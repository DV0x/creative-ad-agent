# Chat Persistence & Session Recovery Architecture

**Created:** January 29, 2026
**Status:** Implemented (Bug 1 fix)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Architecture Overview](#architecture-overview)
3. [Three-Layer Persistence Model](#three-layer-persistence-model)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Recovery Scenarios](#recovery-scenarios)
6. [Component Reference](#component-reference)
7. [State Lifecycle](#state-lifecycle)
8. [Edge Cases & Guards](#edge-cases--guards)
9. [File Reference](#file-reference)
10. [Cloudflare Migration Notes](#cloudflare-migration-notes)

---

## Problem Statement

Chat messages and the generation thinking block were lost on page refresh or tab close because:

1. The WebSocket handler persisted files, images, and campaign status to the database, but **never wrote chat messages** to the `messages` table.
2. The frontend loaded campaigns from the API but **discarded the messages** field from the response.
3. The **thinking block** (generation progress, tool calls, phase changes) existed only in Zustand memory with no reconstruction path.

---

## Architecture Overview

The system uses three complementary persistence layers, each optimized for a different lifecycle:

```
┌──────────────────────────────────────────────────────────┐
│                    PERSISTENCE LAYERS                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  localStorage          In-Memory Buffer       SQLite DB  │
│  (Client)              (Server)               (Server)   │
│                                                          │
│  Session pointer       Event stream           Permanent  │
│  ┌──────────┐         ┌──────────────┐      ┌─────────┐ │
│  │sessionId │         │ phase events │      │ user    │ │
│  │prompt    │         │ tool events  │      │ message │ │
│  │campaignId│         │ file events  │      │         │ │
│  │messageId │         │ image events │      │assistant│ │
│  │startedAt │         │ msg events   │      │ message │ │
│  └──────────┘         │ complete/err │      └─────────┘ │
│                       └──────────────┘                   │
│                                                          │
│  Survives:            Survives:             Survives:    │
│  - Page refresh       - Tab close           - Everything │
│  - Tab close          - Network disconnect  - Server     │
│                       - Page refresh          restart    │
│                                             - Days later │
│  Cleared:             Cleared:                           │
│  - Generation end     - 40min TTL                        │
│  - Stale detection    - Server restart                   │
│  - Manual cleanup     - Buffer full (1000)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Each layer has a specific job:**

| Layer | Purpose | Lifetime | Used For |
|-------|---------|----------|----------|
| localStorage | Session pointer for client reconnection | Until generation ends or stale cleanup | Telling useWebSocket which session to recover |
| Event Buffer | Real-time event stream for replay | While agent runs + 40min TTL | Reconstructing thinking block on refresh |
| SQLite DB | Permanent record of messages | Forever | Loading chat history for completed campaigns |

---

## Three-Layer Persistence Model

### Layer 1: localStorage (Client-Side Session Pointer)

**Storage key:** `creative-agent:activeSession`

```typescript
interface SavedSession {
  sessionId: string;    // WebSocket session ID
  prompt: string;       // Original user prompt (for chat reconstruction)
  campaignId: string;   // Database campaign ID
  messageId: string;    // Assistant message ID in Zustand
  startedAt: number;    // Timestamp for staleness detection
}
```

**Write points:**
- `useWebSocket.generate()` — when user starts generation (has correct prompt)
- `useWebSocket.resume()` — when user resumes incomplete campaign
- `App.tsx` recovery — fallback only if no session exists (uses campaign name as prompt)

**Read points:**
- `useWebSocket` onopen handler — checks for session to recover on every WebSocket connect

**Clear points:**
- `clearActiveSession()` — called on generation complete, cancel, error
- `cleanupFailedRecovery()` — called when server says session expired

**Secondary key:** `creative-agent:lastEventId:{sessionId}` — tracks last received event ID per session for partial replay (currently unused since recovery replays all events).

### Layer 2: Event Buffer (Server-Side In-Memory)

**Location:** `server/lib/event-buffer.ts`

```typescript
interface EventBuffer {
  events: BufferedEvent[];  // Sequential events with IDs
  nextId: number;           // Auto-incrementing event ID
  createdAt: number;        // For TTL cleanup
}
```

**Configuration:**
- Max events per session: 1000 (older events trimmed at 50%)
- TTL: 40 minutes
- Cleanup interval: every 5 minutes

**Event types buffered:**
```
phase       → Generation phase change (research, hooks, art, images)
tool_start  → SDK tool invocation (Task, Skill, Write, etc.)
tool_end    → SDK tool completion
message     → SDK text output (truncated to 200 chars)
file        → Campaign file written (research/hooks/prompts)
image       → Image generated (with URL, prompt, hook type)
status      → Status update (cancelled)
complete    → Generation finished (with summary, duration, image count)
error       → Generation failed
```

**How it works:**
1. Every event passes through `emitEvent(sessionId, event)` in the WebSocket handler
2. `emitEvent` calls `appendEvent()` to buffer AND sends to connected client
3. If client disconnects, events still buffer (agent continues in background)
4. On reconnect, `handleSubscribe()` calls `getEventsSince(sessionId, afterId)` to replay

### Layer 3: SQLite Database (Server-Side Permanent)

**Table:** `messages`

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL,         -- 'user' | 'assistant'
  content TEXT NOT NULL,
  image_refs TEXT,            -- JSON array (unused currently)
  file_refs TEXT,             -- JSON array (unused currently)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Write points in `websocket-handler.ts`:**

| When | Role | Content |
|------|------|---------|
| Generation starts (campaign created) | `user` | Original prompt |
| Generation completes | `assistant` | Summary (e.g., "I created 6 ad concepts: ...") |
| Generation cancelled | `assistant` | "Generation was cancelled." |
| Generation errors | `assistant` | "Error: {error message}" |

**Read points:**
- `GET /api/campaigns/:id` — returns messages alongside campaign data
- `App.tsx` data loading — loads messages for completed campaigns into Zustand

---

## Data Flow Diagrams

### Flow 1: Normal Generation (No Interruption)

```
User clicks "Create"
    │
    ▼
useWebSocket.generate()
    ├── Creates session ID (UUID)
    ├── store.startGeneration() → creates campaign + user/assistant messages in Zustand
    ├── saveActiveSession() → writes to localStorage
    ├── Sends { type: 'generate', prompt, sessionId } via WebSocket
    │
    ▼
Server: handleGenerate()
    ├── Creates campaign in DB
    ├── db.addMessage({ role: 'user', content: prompt })  ◄── DB WRITE
    ├── Streams SDK response
    │     ├── processSDKMessage() → emitEvent() for each event
    │     │     ├── appendEvent() → buffers in memory
    │     │     └── send() → pushes to client via WebSocket
    │     ├── File detected → db.updateCampaignFile()
    │     └── Image detected → db.addCampaignImage()
    │
    ▼
Server: Generation completes
    ├── db.updateCampaignStatus('complete')
    ├── db.addMessage({ role: 'assistant', content: summary })  ◄── DB WRITE
    ├── emitEvent({ type: 'complete', summary })
    │
    ▼
Client: handleMessage (complete event)
    ├── store.completeGeneration() → updates campaign status, sets summary
    ├── clearActiveSession() → removes from localStorage
    └── Done
```

### Flow 2: Mid-Generation Page Refresh

```
User refreshes browser during active generation
    │
    ▼
Server side (continues uninterrupted):
    ├── Agent keeps running (handleGenerate loop continues)
    ├── Events buffer via emitEvent() (no client connected)
    ├── sessionConnections[sessionId] set to null (ws.onclose)
    ├── sessionAbortControllers[sessionId] preserved (cancel still works)
    │
    ▼
Client side (fresh page load):
    │
    ├── [T+0ms] App mounts → data loading starts
    │
    ├── [T+500ms] useWebSocket connects → onopen fires
    │     ├── Reads localStorage: getActiveSession()
    │     ├── Finds saved session with prompt + campaignId
    │     ├── store.reconstructForRecovery(sessionId, prompt, campaignId)
    │     │     ├── Creates user message (with original prompt)
    │     │     ├── Creates assistant message (with empty GenerationState)
    │     │     ├── REPLACES chatMessages (not append)
    │     │     ├── Sets generatingCampaignId, currentGeneratingMessageId
    │     │     └── Returns messageId for event attachment
    │     │
    │     ├── addThinking('phase', 'Recovering session...')
    │     │
    │     └── Sends { type: 'subscribe', sessionId, lastEventId: 0 }
    │           └── lastEventId: 0 = replay ALL events from buffer
    │
    ▼
Server: handleSubscribe()
    ├── Validates session buffer exists (hasBuffer)
    ├── Links WebSocket to session (sessionConnections)
    ├── Links campaign from DB (getCampaignBySessionId)
    ├── Links abort controller (for cancel-after-reconnect)
    ├── Replays ALL buffered events: getEventsSince(sessionId, 0)
    │     └── Client receives: phase → tool_start → message → file → image → ...
    ├── Sends { type: 'subscribed' } confirmation
    │
    ▼
Client: handleMessage (replayed events)
    ├── phase events → addThinking('phase', label) → thinking lines rebuild
    ├── tool_start events → addThinking('tool', toolText) → tool entries rebuild
    ├── message events → addThinking('result', text) → result lines rebuild
    ├── file events → updateCampaignFile() → campaign files update
    ├── image events → addImageToCampaign() + incrementCompletedImages()
    ├── 'subscribed' event → setIsRecovering(false) → recovery complete
    │
    ▼
Live events continue streaming (agent still running)
    └── New events processed normally via handleMessage
```

### Flow 3: Post-Generation Page Refresh

```
User refreshes after generation completed
    │
    ▼
Client side:
    │
    ├── [T+0ms] App mounts → data loading starts
    │
    ├── [T+500ms] useWebSocket connects → onopen fires
    │     ├── Reads localStorage: getActiveSession()
    │     └── null (was cleared on generation complete)
    │         └── No recovery needed
    │
    ├── [T+~1000ms] App.tsx data loading completes
    │     ├── campaignsApi.list() → campaigns from DB
    │     ├── campaignsApi.get(id) → { campaign, messages }
    │     │     ├── campaign: full data (files, images, status='complete')
    │     │     └── messages: [user message, assistant summary]
    │     │
    │     ├── setCampaigns(fullCampaigns)
    │     ├── No active recovery → setChatMessages(allMessages)
    │     │     └── Chat shows: user prompt + assistant summary
    │     └── setDataLoaded(true)
    │
    ├── [T+~1100ms] Recovery check runs
    │     ├── campaigns.filter(status === 'generating') → empty
    │     └── No recovery needed
    │
    └── User sees completed campaign with chat history
```

### Flow 4: Tab Close + Reopen (Agent Still Running)

```
User closes tab entirely
    │
    ▼
Server side:
    ├── ws.onclose fires → sessionConnections[sessionId] = null
    ├── Agent continues (NOT aborted)
    ├── Events buffer in memory
    │
    ▼
User reopens tab (new browser session)
    │
    ├── localStorage still has activeSession ◄── Survives tab close
    │
    └── Same flow as "Mid-Generation Page Refresh" (Flow 2)
```

### Flow 5: Stale Session (Server Restarted / Buffer Expired)

```
User opens app, but server was restarted
    │
    ├── localStorage has stale session from previous run
    │
    ├── useWebSocket connects → finds session → reconstructForRecovery()
    ├── Sends { type: 'subscribe', sessionId }
    │
    ▼
Server: handleSubscribe()
    ├── hasBuffer(sessionId) → false (buffer cleared on restart)
    ├── Sends { type: 'error', error: 'Session not found or expired' }
    │
    ▼
Client: handleMessage (error)
    ├── Detects "Session not found" in error message
    ├── clearActiveSession() → removes from localStorage
    ├── store.cleanupFailedRecovery()
    │     ├── Clears generatingCampaignId, sessionId, currentGeneratingMessageId
    │     ├── Sets isRecovering = false
    │     ├── Clears chatMessages (removes reconstructed messages)
    │     └── Does NOT change appState (user stays where they are)
    ├── Clears all refs (sessionId, campaignId, messageId)
    │
    ▼
App.tsx recovery check runs
    ├── Finds campaign with status 'generating' in DB
    ├── Calls campaignsApi.getStatus()
    ├── isAgentRunning: false → marks campaign as 'incomplete'
    └── User sees campaign with partial results + "Resume" button
```

---

## Recovery Scenarios

| Scenario | localStorage | Event Buffer | DB Messages | Recovery Path |
|----------|-------------|-------------|-------------|---------------|
| Refresh mid-generation | Has session | Has events | User message only | Flow 2: reconstruct + replay |
| Tab close, reopen (agent running) | Has session | Has events | User message only | Flow 4: same as refresh |
| Tab close, reopen (agent finished) | Has session | May exist | User + assistant | Flow 5: stale cleanup → load from DB |
| Refresh after generation done | Empty | Empty | User + assistant | Flow 3: load from DB |
| Server restart during generation | Has session | Empty | User message only | Flow 5: stale cleanup → mark incomplete |
| Fresh visit (no history) | Empty | N/A | N/A | No recovery needed |

---

## Component Reference

### Backend Components

#### `server/lib/websocket-handler.ts`

**Responsibility:** Real-time generation streaming + DB persistence

**Message write points:**
```typescript
// Generation start (line ~395)
db.addMessage({ campaignId, role: 'user', content: prompt });

// Generation complete (line ~480)
db.addMessage({ campaignId, role: 'assistant', content: summary });

// Generation cancelled (line ~497)
db.addMessage({ campaignId, role: 'assistant', content: 'Generation was cancelled.' });

// Generation error (line ~522)
db.addMessage({ campaignId, role: 'assistant', content: `Error: ${error.message}` });
```

**Subscribe handler** (`handleSubscribe`):
- Validates session buffer exists
- Links WebSocket to session for future events
- Links campaign from DB
- Replays all events since `lastEventId`
- Sends `subscribed` confirmation

#### `server/lib/event-buffer.ts`

**Responsibility:** In-memory event storage per session

**Key functions:**
- `appendEvent(sessionId, event)` → buffer + return event ID
- `getEventsSince(sessionId, afterId)` → replay events
- `hasBuffer(sessionId)` → check if session exists
- `cleanupOldBuffers()` → periodic TTL cleanup (every 5 min)

#### `server/lib/db/messages.ts`

**Responsibility:** SQLite CRUD for the messages table

**Key functions:**
- `addMessage({ campaignId, role, content })` → insert
- `getMessages(campaignId)` → list (ASC by created_at)
- `updateMessageContent(id, content)` → update
- `getLastAssistantMessage(campaignId)` → latest assistant message

### Frontend Components

#### `client/src/hooks/useWebSocket.ts`

**Responsibility:** WebSocket lifecycle, generation control, session recovery

**Session persistence helpers:**
- `saveActiveSession()` → write to localStorage
- `getActiveSession()` → read from localStorage
- `clearActiveSession()` → remove from localStorage
- `saveLastEventId()` / `getLastEventId()` → per-session event tracking

**Recovery flow (in `onopen` handler):**
1. Read `getActiveSession()` from localStorage
2. Call `store.reconstructForRecovery()` to rebuild chat messages
3. Subscribe with `lastEventId: 0` for full event replay

**Stale session handling (in `handleMessage` error case):**
1. Detect "Session not found or expired" error
2. Call `clearActiveSession()` + `store.cleanupFailedRecovery()`
3. Clear all refs — no error shown to user

#### `client/src/store/index.ts`

**Responsibility:** Zustand state management with recovery actions

**Recovery-specific actions:**

```typescript
// Reconstruct chat state for mid-generation recovery
reconstructForRecovery(sessionId, prompt, campaignId) → { messageId }
  - Creates user message (with original prompt)
  - Creates assistant message (with empty GenerationState)
  - REPLACES chatMessages (not append — prevents duplication on repeated refresh)
  - Sets generatingCampaignId, activeCampaignId, currentGeneratingMessageId
  - Returns messageId for useWebSocket to attach events to

// Clean up when recovery fails (stale session)
cleanupFailedRecovery() → void
  - Clears generatingCampaignId, sessionId, currentGeneratingMessageId
  - Sets isRecovering = false
  - Clears chatMessages
  - Does NOT change appState or campaigns (data loading handles those)
```

#### `client/src/App.tsx`

**Responsibility:** Data loading + recovery orchestration

**Data loading:**
- Loads campaigns + folders from API on mount (when signed in)
- Extracts messages from `campaignsApi.get()` response
- Sets `chatMessages` from DB only if no active recovery session exists

**Recovery check (after data loads):**
- Finds campaigns with `status === 'generating'`
- Calls `campaignsApi.getStatus()` to check if agent is actually running
- If running: saves session to localStorage (only if not already set by `generate()`)
- If stopped: marks campaign as `incomplete`

**Guard against double-write:**
```typescript
// Don't overwrite localStorage if generate() already saved the session with correct prompt
const existing = localStorage.getItem('creative-agent:activeSession')
if (!existing) {
  localStorage.setItem('creative-agent:activeSession', { ... })
}
```

---

## State Lifecycle

### Chat Messages Through Generation Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ GENERATION START                                                │
│                                                                 │
│ Zustand:    [user msg (prompt), assistant msg (empty thinking)] │
│ localStorage: { sessionId, prompt, campaignId, messageId }      │
│ Event Buffer: [ack, phase:parse]                                │
│ DB Messages:  [user msg (prompt)]                               │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ MID-GENERATION                                                  │
│                                                                 │
│ Zustand:    [user msg, assistant msg (thinking lines growing)]  │
│ localStorage: { sessionId, prompt, campaignId, messageId }      │
│ Event Buffer: [ack, phase, tool_start, msg, file, img, ...]    │
│ DB Messages:  [user msg]                                        │
│ DB Campaign:  status='generating', files+images accumulating    │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ REFRESH MID-GENERATION                                          │
│                                                                 │
│ Zustand:    WIPED → reconstructForRecovery rebuilds:            │
│             [user msg (from localStorage prompt),               │
│              assistant msg (empty thinking)]                     │
│ localStorage: { sessionId, prompt } — survives refresh          │
│ Event Buffer: still accumulating on server                      │
│ DB Messages:  [user msg] — still there                          │
│                                                                 │
│ Then: subscribe → replay ALL events → thinking block rebuilds   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ GENERATION COMPLETE                                             │
│                                                                 │
│ Zustand:    [user msg, assistant msg (summary, thinking collapsed)]│
│ localStorage: CLEARED                                           │
│ Event Buffer: exists (40min TTL), then cleared                  │
│ DB Messages:  [user msg, assistant summary]                     │
│ DB Campaign:  status='complete'                                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ POST-GENERATION REFRESH                                         │
│                                                                 │
│ Zustand:    WIPED → App.tsx loads from DB:                      │
│             [user msg (prompt), assistant msg (summary)]         │
│ localStorage: empty                                             │
│ Event Buffer: likely expired                                    │
│ DB Messages:  [user msg, assistant summary] — permanent         │
│                                                                 │
│ Note: No thinking block shown (same as Claude.ai for            │
│       completed conversations — only final response shown)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Edge Cases & Guards

### 1. Duplicate Message Prevention

**Problem:** Multiple refreshes during generation would stack chat messages.
**Guard:** `reconstructForRecovery` REPLACES `chatMessages` instead of appending.

### 2. Prompt Preservation

**Problem:** App.tsx recovery was overwriting localStorage with `prompt: ''`, destroying the real prompt saved by `generate()`.
**Guard:** App.tsx checks `if (!existing)` before writing to localStorage.

### 3. Data Loading Race Condition

**Problem:** `setChatMessages` from DB data could overwrite recovery-reconstructed messages.
**Guard:** App.tsx checks `if (!hasActiveRecovery)` before calling `setChatMessages`.

### 4. Stale Session Cleanup

**Problem:** Server restart clears event buffer but localStorage still has session.
**Guard:** Error handler detects "Session not found or expired" and calls `cleanupFailedRecovery()` silently (no error shown to user).

### 5. WebSocket Reconnection vs. Recovery

**Problem:** WebSocket auto-reconnect (network blip) could trigger recovery again.
**Guard:** `reconstructForRecovery` replaces messages, so repeated calls produce the same result. Subscribe replays from `lastEventId: 0` each time, which is idempotent for thinking lines.

### 6. Agent Finishes While User Away

**Problem:** User closes tab, agent completes, user reopens. localStorage has stale session but event buffer may be cleared.
**Guard:** Subscribe fails → stale cleanup → App.tsx loads campaign as 'complete' from DB with messages.

---

## File Reference

| File | Role | Key Functions |
|------|------|---------------|
| `server/lib/event-buffer.ts` | In-memory event storage | `appendEvent`, `getEventsSince`, `hasBuffer`, `cleanupOldBuffers` |
| `server/lib/db/messages.ts` | SQLite message CRUD | `addMessage`, `getMessages`, `getLastAssistantMessage` |
| `server/lib/websocket-handler.ts` | Generation streaming + DB writes | `handleGenerate`, `handleSubscribe`, `emitEvent`, `processSDKMessage` |
| `server/routes/campaigns.ts` | REST API (serves messages) | `GET /api/campaigns/:id` returns messages |
| `client/src/hooks/useWebSocket.ts` | WebSocket lifecycle + recovery | `generate`, `resume`, `cancel`, `handleMessage`, `connect` |
| `client/src/store/index.ts` | Zustand state + recovery actions | `reconstructForRecovery`, `cleanupFailedRecovery`, `startGeneration` |
| `client/src/App.tsx` | Data loading + recovery orchestration | `loadData`, `checkForRecovery` |
| `client/src/lib/api.ts` | API client | `campaignsApi.get()`, `campaignsApi.getStatus()` |
| `client/src/types/chat.ts` | Type definitions | `ChatMessage`, `GenerationState`, `ThinkingLine` |

---

## Cloudflare Migration Notes

When moving to production on Cloudflare:

| Local | Production | Notes |
|-------|-----------|-------|
| In-memory `Map<string, EventBuffer>` | **Durable Objects** | Each session gets its own Durable Object. Events stored in-memory within the DO. Survives server restarts. |
| SQLite messages table | **D1** | Same SQL, slightly different API (`db.prepare().bind().all()`) |
| `localStorage` | `localStorage` | No change — client-side only |
| Express WebSocket | **Durable Objects WebSocket** | DO handles WebSocket connections natively. Enables multi-region support. |

The three-layer model maps directly: localStorage stays client-side, event buffer becomes Durable Objects (gaining server-restart survival), SQLite becomes D1 (gaining global distribution).

---

*Last updated: January 29, 2026*
