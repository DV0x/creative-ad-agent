# WebSocket Resilience Implementation Plan

**Version:** 1.0
**Created:** January 2026
**Status:** Planning
**Estimated Effort:** ~75 lines of code changes

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Architecture Diagram](#architecture-diagram)
4. [Implementation Steps](#implementation-steps)
   - [Step 1: Add Event Buffer System](#step-1-add-event-buffer-system)
   - [Step 2: Modify Event Emission](#step-2-modify-event-emission)
   - [Step 3: Handle Subscribe Message](#step-3-handle-subscribe-message)
   - [Step 4: Remove Abort on Disconnect](#step-4-remove-abort-on-disconnect)
   - [Step 5: Client Session Persistence](#step-5-client-session-persistence)
   - [Step 6: Client Auto-Recovery](#step-6-client-auto-recovery)
   - [Step 7: UI Recovery Indicator](#step-7-ui-recovery-indicator)
5. [Testing Plan](#testing-plan)
6. [Rollback Plan](#rollback-plan)

---

## Problem Statement

### Current Issues

| Issue | User Impact |
|-------|-------------|
| Mobile tab switch | WebSocket suspended by OS, user loses progress visibility |
| Page refresh | All client state lost, no way to reconnect |
| Network blip | Connection drops, user must wait for reconnect |

### Root Cause

The client has no way to:
1. Know which events it missed during disconnection
2. Request replay of missed events
3. Persist session info across page refreshes

### Key Insight

**Generation does NOT stop on disconnect** - especially in production (Cloudflare container). The generation keeps running; the problem is purely client-side recovery.

---

## Solution Overview

### Core Changes

1. **Server: Event Buffer** - Store all events per session with sequential IDs
2. **Server: Subscribe Handler** - Allow clients to reconnect and request missed events
3. **Server: Don't Abort** - Remove generation abort on WebSocket close
4. **Client: Persist Session** - Store sessionId and lastEventId in localStorage
5. **Client: Auto-Recover** - On mount/reconnect, resume from last known state

### What Stays the Same

- WebSocket remains the primary transport
- All existing message types unchanged
- Generation logic unchanged
- Session manager unchanged

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        RESILIENT WEBSOCKET ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT                                    SERVER                           │
│  ┌──────────────────────┐                 ┌────────────────────────────┐   │
│  │  localStorage        │                 │  websocket-handler.ts      │   │
│  │  ┌────────────────┐  │                 │                            │   │
│  │  │ activeSession: │  │                 │  ┌──────────────────────┐  │   │
│  │  │ { sessionId,   │  │                 │  │  sessionEventBuffers │  │   │
│  │  │   prompt }     │  │                 │  │  Map<sessionId,      │  │   │
│  │  ├────────────────┤  │                 │  │    EventBuffer>      │  │   │
│  │  │ lastEventId:   │  │                 │  │                      │  │   │
│  │  │ 42             │  │                 │  │  { events: [...],    │  │   │
│  │  └────────────────┘  │                 │  │    nextId: 43 }      │  │   │
│  └──────────┬───────────┘                 │  └──────────────────────┘  │   │
│             │                             │              │              │   │
│  ┌──────────▼───────────┐                 │              │              │   │
│  │  useWebSocket.ts     │                 │              │              │   │
│  │                      │◄═══WebSocket═══►│              │              │   │
│  │  - Track lastEventId │                 │              ▼              │   │
│  │  - Persist to storage│                 │  ┌──────────────────────┐  │   │
│  │  - Subscribe on      │                 │  │  Generation Runner   │  │   │
│  │    reconnect         │                 │  │  (continues even if  │  │   │
│  └──────────────────────┘                 │  │   client disconnects)│  │   │
│                                           │  └──────────────────────┘  │   │
│                                           └────────────────────────────┘   │
│                                                                             │
│  RECONNECT FLOW:                                                           │
│  ═══════════════                                                           │
│  1. Client reads sessionId + lastEventId from localStorage                 │
│  2. Client connects WebSocket                                              │
│  3. Client sends: { type: "subscribe", sessionId, lastEventId: 42 }        │
│  4. Server finds events 43, 44, 45... in buffer                            │
│  5. Server replays missed events to client                                 │
│  6. Client UI catches up instantly                                         │
│  7. Real-time streaming continues                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Add Event Buffer System

**File:** `server/lib/event-buffer.ts` (NEW FILE)

**Purpose:** Store events per session with sequential IDs for replay capability.

```typescript
// server/lib/event-buffer.ts

import { WebSocketEvent } from './websocket-handler';

export interface BufferedEvent {
  id: number;
  event: WebSocketEvent;
  timestamp: number;
}

export interface EventBuffer {
  events: BufferedEvent[];
  nextId: number;
  createdAt: number;
}

// In-memory storage - events are transient (generation-lifetime only)
const sessionEventBuffers = new Map<string, EventBuffer>();

// Configuration
const MAX_EVENTS_PER_SESSION = 1000;  // Prevent memory bloat
const MAX_BUFFER_AGE_MS = 30 * 60 * 1000;  // 30 minutes

/**
 * Get or create an event buffer for a session
 */
export function getOrCreateBuffer(sessionId: string): EventBuffer {
  let buffer = sessionEventBuffers.get(sessionId);

  if (!buffer) {
    buffer = {
      events: [],
      nextId: 1,
      createdAt: Date.now()
    };
    sessionEventBuffers.set(sessionId, buffer);
  }

  return buffer;
}

/**
 * Append an event to the session buffer
 * Returns the assigned event ID
 */
export function appendEvent(sessionId: string, event: WebSocketEvent): number {
  const buffer = getOrCreateBuffer(sessionId);

  const bufferedEvent: BufferedEvent = {
    id: buffer.nextId++,
    event,
    timestamp: Date.now()
  };

  buffer.events.push(bufferedEvent);

  // Trim old events if buffer is too large
  if (buffer.events.length > MAX_EVENTS_PER_SESSION) {
    buffer.events = buffer.events.slice(-Math.floor(MAX_EVENTS_PER_SESSION / 2));
  }

  return bufferedEvent.id;
}

/**
 * Get all events after a given ID (for replay on reconnect)
 */
export function getEventsSince(sessionId: string, afterId: number): BufferedEvent[] {
  const buffer = sessionEventBuffers.get(sessionId);

  if (!buffer) {
    return [];
  }

  return buffer.events.filter(e => e.id > afterId);
}

/**
 * Get the latest event ID for a session
 */
export function getLatestEventId(sessionId: string): number {
  const buffer = sessionEventBuffers.get(sessionId);
  return buffer ? buffer.nextId - 1 : 0;
}

/**
 * Check if a session has an active buffer
 */
export function hasBuffer(sessionId: string): boolean {
  return sessionEventBuffers.has(sessionId);
}

/**
 * Clear buffer for a session (call on generation complete after grace period)
 */
export function clearBuffer(sessionId: string): void {
  sessionEventBuffers.delete(sessionId);
}

/**
 * Cleanup old buffers (call periodically)
 */
export function cleanupOldBuffers(): void {
  const now = Date.now();

  for (const [sessionId, buffer] of sessionEventBuffers.entries()) {
    if (now - buffer.createdAt > MAX_BUFFER_AGE_MS) {
      sessionEventBuffers.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldBuffers, 5 * 60 * 1000);
```

**Lines of Code:** ~85 lines

---

### Step 2: Modify Event Emission

**File:** `server/lib/websocket-handler.ts`

**Purpose:** Route all events through the buffer before sending to client.

**Changes:**

```typescript
// Add import at top of file
import { appendEvent, getEventsSince, getLatestEventId, hasBuffer } from './event-buffer';

// Find the existing sendToClient or similar function
// Replace direct ws.send calls with this helper:

/**
 * Send an event to the client AND buffer it for replay
 */
function emitEvent(
  ws: WebSocket | null,
  sessionId: string,
  event: WebSocketEvent
): void {
  // Always buffer the event (even if no client connected)
  const eventId = appendEvent(sessionId, event);

  // Send to client if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...event, id: eventId }));
  }
}

// Then update all places that send events to use emitEvent()
// Example changes:

// BEFORE:
ws.send(JSON.stringify({ type: 'phase', phase: 'research', label: 'Researching...' }));

// AFTER:
emitEvent(ws, state.sessionId, { type: 'phase', phase: 'research', label: 'Researching...' });
```

**Locations to Update:**
1. Phase change emissions
2. Tool start/end emissions
3. Message emissions
4. Image emissions
5. Status emissions
6. Complete/error emissions

**Estimated Changes:** ~20 lines modified

---

### Step 3: Handle Subscribe Message

**File:** `server/lib/websocket-handler.ts`

**Purpose:** Allow reconnecting clients to subscribe and receive missed events.

**Add to message handler switch statement:**

```typescript
// Add 'subscribe' to the ClientMessage type
type ClientMessageType = 'generate' | 'cancel' | 'pause' | 'resume' | 'ping' | 'subscribe';

interface SubscribeMessage {
  type: 'subscribe';
  sessionId: string;
  lastEventId?: number;
}

// In the message handler switch:
case 'subscribe': {
  const { sessionId, lastEventId } = message as SubscribeMessage;

  console.log(`[WS] Client subscribing to session ${sessionId}, lastEventId: ${lastEventId ?? 0}`);

  // Attach this WebSocket to the session
  state.sessionId = sessionId;

  // Check if this session exists/has events
  if (!hasBuffer(sessionId)) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Session not found or expired',
      code: 'SESSION_NOT_FOUND'
    }));
    break;
  }

  // Replay missed events
  const missedEvents = getEventsSince(sessionId, lastEventId ?? 0);
  console.log(`[WS] Replaying ${missedEvents.length} missed events`);

  for (const entry of missedEvents) {
    ws.send(JSON.stringify({ ...entry.event, id: entry.id }));
  }

  // Send subscription confirmation with current status
  const isComplete = missedEvents.some(e =>
    e.event.type === 'complete' || e.event.type === 'error'
  );

  ws.send(JSON.stringify({
    type: 'subscribed',
    sessionId,
    replayedCount: missedEvents.length,
    latestEventId: getLatestEventId(sessionId),
    status: isComplete ? 'completed' : 'running'
  }));

  break;
}
```

**Lines of Code:** ~40 lines

---

### Step 4: Remove Abort on Disconnect

**File:** `server/lib/websocket-handler.ts`

**Purpose:** Let generation continue when client disconnects.

**Find the `ws.on('close')` handler and modify:**

```typescript
// BEFORE:
ws.on('close', () => {
  console.log('[WS] Client disconnected');

  // Clear heartbeat
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
  }

  // Abort any in-flight generation
  if (state.abortController) {
    state.abortController.abort();  // ❌ REMOVE THIS
  }

  connections.delete(ws);
});

// AFTER:
ws.on('close', () => {
  console.log(`[WS] Client disconnected from session ${state.sessionId ?? 'none'}`);

  // Clear heartbeat
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
  }

  // ✅ DO NOT abort generation - it continues in background
  // Events will be buffered for when client reconnects

  // Just remove this connection from tracking
  connections.delete(ws);
});
```

**Lines Changed:** ~3 lines (delete abort call)

---

### Step 5: Client Session Persistence

**File:** `client/src/hooks/useWebSocket.ts`

**Purpose:** Persist session info to localStorage for recovery after refresh.

**Add these changes:**

```typescript
// Add at top of file
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'creative-agent:activeSession',
  LAST_EVENT_ID: (sessionId: string) => `creative-agent:lastEventId:${sessionId}`
};

// Add helper functions
function saveActiveSession(sessionId: string, prompt: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify({
    sessionId,
    prompt,
    startedAt: Date.now()
  }));
}

function getActiveSession(): { sessionId: string; prompt: string } | null {
  const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  return saved ? JSON.parse(saved) : null;
}

function clearActiveSession(): void {
  const session = getActiveSession();
  if (session) {
    localStorage.removeItem(STORAGE_KEYS.LAST_EVENT_ID(session.sessionId));
  }
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

function saveLastEventId(sessionId: string, eventId: number): void {
  localStorage.setItem(STORAGE_KEYS.LAST_EVENT_ID(sessionId), String(eventId));
}

function getLastEventId(sessionId: string): number {
  const saved = localStorage.getItem(STORAGE_KEYS.LAST_EVENT_ID(sessionId));
  return saved ? parseInt(saved, 10) : 0;
}

// In the hook, add a ref to track current event ID
const lastEventIdRef = useRef<number>(0);

// Modify message handler to track event IDs
const handleMessage = useCallback((event: MessageEvent) => {
  const data = JSON.parse(event.data);

  // Track event ID for recovery
  if (data.id && sessionIdRef.current) {
    lastEventIdRef.current = data.id;
    saveLastEventId(sessionIdRef.current, data.id);
  }

  // Handle new 'subscribed' message type
  if (data.type === 'subscribed') {
    console.log(`Subscribed to session, replayed ${data.replayedCount} events`);
    setIsRecovering(false);
    return;
  }

  // ... rest of existing message handling

  // On complete or error, clear session
  if (data.type === 'complete' || data.type === 'error') {
    clearActiveSession();
  }
}, [/* deps */]);

// Modify generate function to save session
const generate = useCallback((prompt: string) => {
  const sessionId = crypto.randomUUID();
  sessionIdRef.current = sessionId;

  // Persist for recovery
  saveActiveSession(sessionId, prompt);

  // Reset event tracking
  lastEventIdRef.current = 0;

  sendMessage({
    type: 'generate',
    prompt,
    sessionId
  });
}, [sendMessage]);
```

**Lines of Code:** ~50 lines

---

### Step 6: Client Auto-Recovery

**File:** `client/src/hooks/useWebSocket.ts`

**Purpose:** On mount/reconnect, check for active session and subscribe.

**Add these changes:**

```typescript
// Add state for recovery
const [isRecovering, setIsRecovering] = useState(false);
const [recoverySession, setRecoverySession] = useState<string | null>(null);

// Modify the onopen handler
const connect = useCallback(() => {
  // ... existing connection setup ...

  ws.onopen = () => {
    setIsConnected(true);
    setReconnectAttempts(0);

    // Check for active session to recover
    const savedSession = getActiveSession();
    if (savedSession) {
      console.log(`Recovering session: ${savedSession.sessionId}`);
      setIsRecovering(true);
      setRecoverySession(savedSession.sessionId);

      // Subscribe to the existing session
      ws.send(JSON.stringify({
        type: 'subscribe',
        sessionId: savedSession.sessionId,
        lastEventId: getLastEventId(savedSession.sessionId)
      }));
    }
  };

  // ... rest of setup ...
}, [/* deps */]);

// Add recovery check on mount
useEffect(() => {
  const savedSession = getActiveSession();
  if (savedSession) {
    setRecoverySession(savedSession.sessionId);
  }
}, []);

// Export recovery state
return {
  // ... existing returns ...
  isRecovering,
  recoverySession,
  hasActiveSession: !!getActiveSession()
};
```

**Lines of Code:** ~30 lines

---

### Step 7: UI Recovery Indicator

**File:** `client/src/App.tsx` (or appropriate component)

**Purpose:** Show user that we're recovering their session.

```typescript
// In App.tsx or a new RecoveryBanner component

interface RecoveryBannerProps {
  isRecovering: boolean;
  sessionId: string | null;
}

const RecoveryBanner: React.FC<RecoveryBannerProps> = ({ isRecovering, sessionId }) => {
  if (!isRecovering || !sessionId) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
        <div>
          <p className="text-amber-200 font-medium">Reconnecting to your generation...</p>
          <p className="text-amber-200/60 text-sm">Session: {sessionId.slice(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
};

// In App component:
const { isRecovering, recoverySession, hasActiveSession } = useWebSocket();

return (
  <div>
    <RecoveryBanner isRecovering={isRecovering} sessionId={recoverySession} />

    {/* Show prompt input only if no active session recovering */}
    {!hasActiveSession && <PromptInput />}

    {/* ... rest of app ... */}
  </div>
);
```

**Lines of Code:** ~30 lines

---

## Testing Plan

### Manual Test Cases

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| 1 | **Tab switch (mobile)** | Start generation → switch tab → wait 30s → return | UI shows recovery banner, catches up to current state |
| 2 | **Page refresh** | Start generation → refresh page | On reload, auto-subscribes and replays missed events |
| 3 | **Network disconnect** | Start generation → disable network → enable after 10s | Reconnects and replays missed events |
| 4 | **Complete generation** | Start → wait for completion | localStorage cleared, no recovery on next visit |
| 5 | **Cancel generation** | Start → cancel → refresh | No recovery attempt (session was cancelled) |
| 6 | **Multiple refreshes** | Refresh 3 times during generation | Each refresh recovers correctly |
| 7 | **Old session** | Wait 35 minutes after generation starts | Buffer expired, shows "session not found" gracefully |

### Automated Tests (Optional)

```typescript
// server/lib/__tests__/event-buffer.test.ts

describe('EventBuffer', () => {
  it('should assign sequential IDs', () => {
    const id1 = appendEvent('session-1', { type: 'phase', phase: 'research' });
    const id2 = appendEvent('session-1', { type: 'phase', phase: 'hooks' });
    expect(id2).toBe(id1 + 1);
  });

  it('should return events after given ID', () => {
    appendEvent('session-2', { type: 'phase', phase: 'research' });  // id: 1
    appendEvent('session-2', { type: 'phase', phase: 'hooks' });     // id: 2
    appendEvent('session-2', { type: 'phase', phase: 'art' });       // id: 3

    const events = getEventsSince('session-2', 1);
    expect(events.length).toBe(2);
    expect(events[0].id).toBe(2);
  });

  it('should handle non-existent session', () => {
    const events = getEventsSince('non-existent', 0);
    expect(events).toEqual([]);
  });
});
```

---

## Rollback Plan

If issues arise, rollback is simple:

1. **Server:** Revert `websocket-handler.ts` to restore abort on disconnect
2. **Client:** Remove localStorage calls (system works without them, just no recovery)

The changes are additive and don't break existing functionality.

---

## Implementation Checklist

```
[ ] Step 1: Create server/lib/event-buffer.ts
[ ] Step 2: Update websocket-handler.ts to use emitEvent()
[ ] Step 3: Add 'subscribe' message handler
[ ] Step 4: Remove abort on disconnect
[ ] Step 5: Add client localStorage persistence
[ ] Step 6: Add client auto-recovery logic
[ ] Step 7: Add UI recovery indicator
[ ] Test: Manual test all scenarios
[ ] Test: Verify mobile tab switching
[ ] Deploy: Test in staging
[ ] Deploy: Production release
```

---

## Summary

| Component | File | Changes |
|-----------|------|---------|
| Event Buffer | `server/lib/event-buffer.ts` | New file (~85 lines) |
| Event Emission | `server/lib/websocket-handler.ts` | Modify (~20 lines) |
| Subscribe Handler | `server/lib/websocket-handler.ts` | Add (~40 lines) |
| Remove Abort | `server/lib/websocket-handler.ts` | Delete (~3 lines) |
| Client Persistence | `client/src/hooks/useWebSocket.ts` | Add (~50 lines) |
| Client Recovery | `client/src/hooks/useWebSocket.ts` | Add (~30 lines) |
| UI Indicator | `client/src/App.tsx` | Add (~30 lines) |

**Total New Code:** ~255 lines
**Net Change:** ~250 lines (minimal deletions)

---

## Future Enhancements (Optional)

1. **Persistent buffer to disk** - Survive server restarts
2. **Cross-device recovery** - Share session ID via URL param
3. **Generation status endpoint** - `GET /sessions/:id/status` for polling fallback
4. **Compression** - Compress large event payloads
5. **Event deduplication** - Idempotency keys for exactly-once delivery
