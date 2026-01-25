# Creative Ad Agent - System Architecture

**Version:** 7.1 | **Updated:** January 2026 | **Status:** Production

---

## Overview

AI-powered ad generator using **hook-first methodology**: analyzes brand websites, extracts data, creates 6 diverse ad concepts with AI images.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR (Main Agent)                          │
│   Coordinates: 1 Agent + 2 Skills + 1 MCP Tool                         │
│                                                                         │
│   ┌──────────┐    ┌─────────────────┐    ┌────────────┐                │
│   │ research │ -> │ hook-methodology│ -> │ art-style  │                │
│   │ (Agent)  │    │    (Skill)      │    │  (Skill)   │                │
│   └────┬─────┘    └───────┬─────────┘    └─────┬──────┘                │
│        ↓                  ↓                    ↓                        │
│   research/          hook-bank/           creatives/                    │
│   {brand}.md         {brand}-{date}.md    {brand}.json                 │
│                                                ↓                        │
│                                    ┌──────────────────┐                │
│                                    │   nano-banana    │                │
│                                    │   (MCP Tool)     │                │
│                                    │   fal.ai API     │                │
│                                    └────────┬─────────┘                │
│                                             ↓                          │
│                                    generated-images/                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Features
- Hook-first ad generation with 6 diverse emotional triggers
- Real-time WebSocket streaming with cancel/pause/resume
- Session recovery after disconnect (40-min buffer)
- MCP image generation via fal.ai Nano Banana Pro
- Dual deployment: Local (Express) + Production (Cloudflare Workers)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                                │
│                WebSocket /ws → { type: "generate", prompt }             │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ↓
┌───────────────────────────────────────────────────────────────────────┐
│  EXPRESS SERVER (sdk-server.ts)         HTTP: 3001 | WebSocket: /ws   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ WebSocket: generate, cancel, pause, resume, ping, subscribe     │  │
│  │ REST: POST /generate, GET /sessions, GET /images                │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ↓
┌───────────────────────────────────────────────────────────────────────┐
│  AI CLIENT (ai-client.ts) → CLAUDE SDK ORCHESTRATION                  │
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐    │
│  │ SessionManager│  │ SDKInstrumentor │  │ Claude SDK query()   │    │
│  │ (persistence) │  │ (cost tracking) │  │ model: opus-4-5      │    │
│  └───────────────┘  └─────────────────┘  └──────────────────────┘    │
│                                    ↓                                  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ ORCHESTRATOR → Task(research) → Skill(hooks) → Skill(art) → MCP │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
```

## Deployment

| Aspect | Local (`server/`) | Cloudflare (`creative-agent-cf/`) |
|--------|-------------------|-----------------------------------|
| Runtime | Node.js + Express | Workers + Sandbox containers |
| Streaming | WebSocket `/ws` | SSE with trace events |
| Storage | Filesystem JSON | D1 (metadata) + R2 (files) |
| Bidirectional | Yes (cancel/pause/resume) | No (SSE unidirectional) |

---

## Workflow (6 Steps)

### 1. Parse Request
Extract URL, brand name, style preference from prompt.

### 2. Research Agent
```
Task(subagent_type: "research")
├── WebFetch homepage
├── Extract: Offer, Value Props, Proof Points, Brand Colors
├── Analyze: Target Audience / ICP
└── Write: files/research/{brand}_research.md
```

### 3. Hook-Methodology Skill
```
Skill("hook-methodology")
├── Read research file
├── Build 10+ hooks using formulas
├── Select 6 diverse hooks (diversity matrix below)
├── Quality check each hook
└── Write: hook-bank/{brand}-{date}.md
```

**Diversity Matrix:**
| Concept | Hook Type | Emotional Trigger |
|---------|-----------|-------------------|
| 1 | Stat/Data | Social Proof |
| 2 | Story/Result | Empathy + Relief |
| 3 | FOMO/Urgency | Loss Aversion |
| 4 | Curiosity | Intrigue |
| 5 | Call-out | Recognition |
| 6 | Contrast/Enemy | Differentiation |

### 4. Art-Style Skill
```
Skill("art-style")
├── Read hook-bank file
├── Route to style workflow (default: soft-brutalism-clay)
└── Write: files/creatives/{brand}_prompts.json
```

### 5. MCP Image Generation
```
mcp__nano-banana__generate_ad_images({
  prompts: [prompt1, prompt2, prompt3],  // Batch 1
  aspectRatio: "1:1", imageSize: "2K"
})
→ Repeat for prompts 4-6 (Batch 2)
→ Output: generated-images/{sessionId}/*.png
```

### 6. Complete
Return summary with image URLs and instrumentation data.

### Data Flow Diagram

```
┌─────────────────┐
│  RESEARCH AGENT │  WebFetch → Extract → Analyze ICP
└────────┬────────┘
         │ writes
         ↓
┌─────────────────────────────────────────┐
│  files/research/{brand}_research.md     │
│  # Brand - Research Brief               │
│  ## The Offer, Value Props, Proof Points│
│  ## Brand Colors (hex), Target ICP      │
└────────┬────────────────────────────────┘
         │ reads
         ↓
┌─────────────────────┐
│  HOOK-METHODOLOGY   │  Build 10+ hooks → Select 6 diverse → Quality check
└────────┬────────────┘
         │ writes
         ↓
┌─────────────────────────────────────────┐
│  hook-bank/{brand}-{date}.md            │
│  # Brand - Hook Bank                    │
│  ## Concept 1-6 (Hook + Body + CTA)     │
└────────┬────────────────────────────────┘
         │ reads
         ↓
┌─────────────────────┐
│  ART-STYLE SKILL    │  Route to style → Create visual prompts
└────────┬────────────┘
         │ writes
         ↓
┌─────────────────────────────────────────┐
│  files/creatives/{brand}_prompts.json   │
│  { "brand": "...", "prompts": [...] }   │
└────────┬────────────────────────────────┘
         │ reads
         ↓
┌─────────────────────┐
│  ORCHESTRATOR + MCP │  Batch 1 (3 images) → Batch 2 (3 images)
└────────┬────────────┘
         │ generates
         ↓
┌─────────────────────────────────────────┐
│  generated-images/{sessionId}/          │
│  ├── {timestamp}_1_{prompt}.png         │
│  └── ... (6 total)                      │
└─────────────────────────────────────────┘
```

---

## Server Components

| File | Lines | Purpose |
|------|-------|---------|
| `sdk-server.ts` | ~920 | Express server, WebSocket init, REST endpoints |
| `lib/websocket-handler.ts` | ~480 | WebSocket server, resilience layer |
| `lib/event-buffer.ts` | ~110 | Event buffering for session recovery |
| `lib/ai-client.ts` | ~490 | Claude SDK wrapper, session-aware queries |
| `lib/session-manager.ts` | ~340 | Session lifecycle, persistence, forking |
| `lib/nano-banana-mcp.ts` | ~300 | MCP server for fal.ai image generation |
| `lib/orchestrator-prompt.ts` | ~72 | System prompt defining workflow |
| `lib/instrumentor.ts` | ~150 | Cost/token tracking |

---

## WebSocket API (`/ws`)

### Client → Server Messages
| Type | Payload | Description |
|------|---------|-------------|
| `generate` | `{ prompt, sessionId? }` | Start generation |
| `cancel` | `{}` | Abort current generation |
| `pause` | `{}` | Pause streaming (buffer messages) |
| `resume` | `{}` | Resume streaming (flush buffer) |
| `ping` | `{}` | Keep-alive heartbeat |
| `subscribe` | `{ sessionId, lastEventId }` | Reconnect to existing session |

### Server → Client Messages
All messages include `id` (number) for event tracking.

| Type | Fields | Description |
|------|--------|-------------|
| `ack` | `message` | Connection/action acknowledgment |
| `phase` | `phase, label` | Workflow phase change |
| `tool_start` | `tool, toolId, input` | Tool invocation started |
| `tool_end` | `toolId, success` | Tool completed |
| `message` | `text` | Assistant text output |
| `image` | `urlPath, prompt, filename` | Generated image ready |
| `complete` | `sessionId, duration, imageCount` | Generation finished |
| `error` | `error` | Error occurred |
| `subscribed` | `sessionId, message` | Recovery confirmation |
| `pong` | - | Heartbeat response |

### WebSocket Resilience

Generation continues on server when client disconnects. Events are buffered for replay on reconnect.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   WEBSOCKET RESILIENCE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────────────┤
│  CLIENT                              SERVER                             │
│  ┌──────────────────┐               ┌─────────────────────────────┐    │
│  │  localStorage    │               │  event-buffer.ts            │    │
│  │  ┌────────────┐  │               │  ┌───────────────────────┐  │    │
│  │  │activeSession│  │               │  │ sessionEventBuffers   │  │    │
│  │  │{ sessionId,│  │               │  │ Map<sessionId,        │  │    │
│  │  │  prompt }  │  │               │  │   EventBuffer>        │  │    │
│  │  ├────────────┤  │               │  │                       │  │    │
│  │  │lastEventId │  │               │  │ { events: [...],      │  │    │
│  │  │ 42         │  │               │  │   nextId: 43 }        │  │    │
│  │  └────────────┘  │               │  └───────────────────────┘  │    │
│  └────────┬─────────┘               └──────────────┬──────────────┘    │
│           │                                        │                    │
│  ┌────────▼─────────┐                              │                    │
│  │ useWebSocket.ts  │◄══════ WebSocket ══════════►│                    │
│  │ - Track eventId  │                              │                    │
│  │ - Persist state  │               ┌──────────────▼──────────────┐    │
│  │ - Auto-subscribe │               │  Generation Runner          │    │
│  └──────────────────┘               │  (continues on disconnect)  │    │
│                                     └─────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│  RECOVERY FLOW:                                                         │
│  1. Client disconnects (refresh/tab switch/network)                    │
│     └── Server: Generation continues, events buffered                  │
│  2. Client reconnects, reads sessionId + lastEventId from localStorage │
│  3. Client sends: { type: "subscribe", sessionId, lastEventId: 42 }    │
│  4. Server replays events 43, 44, 45... → Client UI catches up         │
│  5. Server sends: { type: "subscribed" } → Normal streaming resumes    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Configuration:**
- `MAX_EVENTS_PER_SESSION`: 1000 events
- `MAX_BUFFER_AGE_MS`: 40 minutes
- Cleanup interval: 5 minutes

| Scenario | Behavior |
|----------|----------|
| Page refresh | Auto-recovers from localStorage |
| Mobile tab switch | Reconnects when tab active |
| Network blip | Replays missed events |
| Close & reopen | Recovers if within 40-min window |
| User cancels | Works even after reconnect |
| Buffer expired | Graceful error: "Session not found" |

---

## REST API (Fallback)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Campaign generation (non-streaming) |
| `/health` | GET | Health check |
| `/sessions` | GET | List all sessions |
| `/sessions/:id` | GET | Get session stats |
| `/sessions/:id/continue` | POST | Resume session |
| `/sessions/:id/fork` | POST | Create A/B variant |
| `/images` | GET | List all images by session |
| `/images/:sessionId/:filename` | GET | Serve image |

---

## Agent & Skills

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT & SKILLS HIERARCHY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                  ┌─────────────────────────┐                            │
│                  │     ORCHESTRATOR        │                            │
│                  │     (Main Agent)        │                            │
│                  │  Tools: Task, Skill,    │                            │
│                  │  TodoWrite, MCP, Read   │                            │
│                  └───────────┬─────────────┘                            │
│         ┌────────────────────┼────────────────────┐                     │
│         ↓                    ↓                    ↓                     │
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────┐               │
│  │  RESEARCH   │    │    HOOK-      │    │  ART-STYLE  │               │
│  │  (Agent)    │    │ METHODOLOGY   │    │   (Skill)   │               │
│  │             │    │   (Skill)     │    │             │               │
│  │ Tools:      │    │ Guidance:     │    │ Guidance:   │               │
│  │ - WebFetch  │    │ - Formulas    │    │ - Style     │               │
│  │ - Read      │    │ - Diversity   │    │   routing   │               │
│  │ - Write     │    │ - Quality     │    │ - Prompts   │               │
│  └──────┬──────┘    └───────┬───────┘    └──────┬──────┘               │
│         ↓                   ↓                   ↓                       │
│  research/{brand}.md  hook-bank/{date}.md  prompts.json                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tool Access Matrix
| Component | Task | Skill | TodoWrite | WebFetch | Read | Write | MCP |
|-----------|------|-------|-----------|----------|------|-------|-----|
| Orchestrator | ✓ | ✓ | ✓ | - | ✓ | - | ✓ |
| Research Agent | - | - | - | ✓ | ✓ | ✓ | - |

*Skills provide guidance/context, not tool access.*

### Research Agent (`agent/.claude/agents/research.md`)
- **Purpose:** Extract factual data from homepages + analyze ICP
- **Tools:** WebFetch, Read, Write
- **Output:** `files/research/{brand}_research.md`
- **Rules:** Be specific (numbers, quotes, hex codes), no recommendations

### Hook-Methodology Skill (`agent/.claude/skills/hook-methodology/SKILL.md`)
- **Purpose:** Generate conversion-focused ad copy
- **Core principle:** Hook = 80% of ad performance
- **Output:** `hook-bank/{brand}-{date}.md`
- **Quality checks:** Specific? Emotional? 3-second clarity? Competitor-proof?
- **Anti-patterns:** "Your trusted partner", round numbers, "Learn more" CTA

### Art-Style Skill (`agent/.claude/skills/art-style/SKILL.md`)
- **Purpose:** Create visual prompts for image generation
- **Input:** hook-bank file
- **Output:** `files/creatives/{brand}_prompts.json`
- **Style routing:** clay/brutalist → soft-brutalism-clay (default), surreal → surrealist-scale, minimal → minimal-photography

---

## File Structure

```
creative_agent/
├── agent/                          # Agent ecosystem (SOURCE OF TRUTH)
│   ├── .claude/
│   │   ├── agents/research.md      # Data extraction agent
│   │   └── skills/
│   │       ├── hook-methodology/   # Hook generation skill
│   │       │   ├── SKILL.md
│   │       │   ├── formulas.md
│   │       │   └── hook-bank/      # Generated hooks
│   │       └── art-style/          # Visual prompt skill
│   │           ├── SKILL.md
│   │           └── workflows/
│   └── files/                      # Working directory
│       ├── research/               # Research output
│       └── creatives/              # Visual prompts
├── server/                         # Local dev server
│   ├── sdk-server.ts
│   ├── lib/
│   │   ├── websocket-handler.ts
│   │   ├── event-buffer.ts
│   │   ├── ai-client.ts
│   │   ├── session-manager.ts
│   │   ├── nano-banana-mcp.ts
│   │   ├── orchestrator-prompt.ts
│   │   └── instrumentor.ts
│   └── sessions/                   # Session JSON files
├── creative-agent-cf/              # Cloudflare production
│   ├── src/                        # Worker code
│   ├── sandbox/                    # Container code
│   └── agent/                      # Copy of agent/
├── client/                         # React frontend
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── hooks/useWebSocket.ts   # WebSocket hook
│   │   ├── store/                  # Zustand state
│   │   └── types/                  # TypeScript types
│   └── vite.config.ts
├── generated-images/               # Image output (git-ignored)
└── docs/                           # Documentation
```

---

## Session Management

```
1. CREATE    → sessionManager.getOrCreateSession() → campaign-{timestamp}
2. SDK INIT  → SDK returns session_id → sessionManager.updateSdkSessionId()
3. MESSAGES  → Each SDK message → sessionManager.addMessage() → auto-save every 10
4. RESUME    → POST /sessions/:id/continue → SDK continues with context
5. FORK      → POST /sessions/:id/fork → Creates A/B variant
6. COMPLETE  → sessionManager.completeSession() → status: 'completed'
7. CLEANUP   → Every 1 hour: delete sessions > 24 hours old
```

---

## React Client

### State (Zustand)
- `prompt`, `status` (idle/generating/complete/error)
- `sessionId`, `phase`, `terminalLines[]`, `images[]`

### Components
| Component | Purpose |
|-----------|---------|
| `PromptInput` | Input form, cancel button, recovery banner |
| `ProgressDots` | Phase indicators (parse → research → hooks → art → images → complete) |
| `Terminal` | Log output with syntax highlighting |
| `ImageGrid` | Image gallery with lightbox |

### useWebSocket Hook
- Auto-connect on mount with 500ms delay
- Auto-reconnect (max 5 attempts, exponential backoff)
- 25-second ping interval
- Session recovery from localStorage on reconnect

---

## Technology Stack

| Category | Technology |
|----------|------------|
| AI | Claude SDK 0.1.54, claude-opus-4-5-20251101 |
| Image Gen | fal.ai Nano Banana Pro via MCP |
| Server | Express 4.x, ws 8.x |
| Client | React 19, Vite 7, Zustand, TailwindCSS |
| Production | Cloudflare Workers, D1, R2 |

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| 1 Agent + 2 Skills | Agents have tools, Skills provide guidance |
| Hook-first methodology | Hooks = 80% of ad performance |
| File-based communication | Simple, debuggable, no shared state |
| WebSocket over SSE | Bidirectional control (cancel/pause/resume) |
| Event buffering | Recovery without generation restart |
| Session forking | A/B testing capability |
| MCP for images | Proper tool interface, SDK integration |
| In-memory buffer | Fast, sufficient for generation lifetime |
