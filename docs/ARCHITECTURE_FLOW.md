# Creative Agent — End-to-End Architecture Flow

> A complete walkthrough of how the system works, from opening the app to seeing generated ads.

---

## System Overview

```
                          CLOUDFLARE EDGE
 ┌──────────┐      ┌─────────────────────────────────────────────────┐
 │          │      │                                                 │
 │  Browser │◄────►│  Worker (Gatekeeper)                            │
 │  (React) │      │    │                                            │
 │          │      │    ├── Static Assets (/index.html, /app.js)     │
 │  Clerk   │      │    ├── REST API (/api/campaigns, /api/files)    │
 │  Auth    │      │    └── WebSocket (/ws/campaign)                 │
 │          │      │              │                                   │
 └──────────┘      │              ▼                                   │
                   │    ┌─────────────────────┐                      │
                   │    │   Durable Object     │    ┌─────┐          │
                   │    │   (Your personal     │───►│ D1  │          │
                   │    │    backend room)      │    │(DB) │          │
                   │    │         │             │    └─────┘          │
                   │    │         ▼             │    ┌─────┐          │
                   │    │   ┌───────────┐      │───►│ R2  │          │
                   │    │   │  Sandbox  │      │    │(Files│          │
                   │    │   │ Container │      │    └─────┘          │
                   │    │   │  (AI runs │      │                     │
                   │    │   │   here)   │      │                     │
                   │    │   └───────────┘      │                     │
                   │    └─────────────────────┘                      │
                   └─────────────────────────────────────────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Anthropic   │
                                                  │  Claude API  │
                                                  └─────────────┘
                                                  ┌─────────────┐
                                                  │   fal.ai     │
                                                  │ (Image Gen)  │
                                                  └─────────────┘
```

---

## Step-by-Step Flow

### 1. Open the Website

```
Browser ──GET /──► Worker ──► Static Assets (React app)
                              Returns index.html + JS bundle
```

You visit `creative-agent.alphasapien17.workers.dev`. The Cloudflare Worker is the first thing that handles the request. It sees this isn't an API call (`/api/...`) or WebSocket (`/ws/...`), so it serves the React app — the HTML, JavaScript, and CSS files that are bundled alongside the Worker as static assets.

### 2. Sign In (Clerk Auth)

```
Browser ──────► Clerk (3rd-party auth service)
       ◄────── JWT Token (your "VIP wristband")

JWT contains:
  ├── user ID:  "user_3ANz..."
  ├── email:    "you@example.com"
  ├── issued:   timestamp
  └── signature: (proves it's legit, signed by Clerk)
```

The React app shows Clerk's sign-in UI. You authenticate with email, Google, etc. Clerk gives your browser a **JWT token** — a signed string that proves your identity. Nobody can fake it because only Clerk has the signing key.

### 3. WebSocket Connection

This is where the real-time connection is established.

```
Browser                    Worker                     Durable Object
   │                         │                              │
   │──WSS /ws/campaign──────►│                              │
   │  (JWT in URL param)     │                              │
   │                         │── Verify JWT with Clerk      │
   │                         │   Extract user ID            │
   │                         │                              │
   │                         │── Get/create DO for user ───►│
   │                         │   (X-User-Id header)         │
   │                         │                              │
   │                         │◄── WebSocket upgrade ────────│
   │◄── Connection open ─────│                              │
   │                         │                              │
   │◄── { type: "ack", message: "Connected" } ─────────────│
   │                         │                              │
   │── { type: "ping" } every 25s ─────────────────────────►│
   │◄── { type: "pong" } ──────────────────────────────────│
```

**What happens:**
1. Browser opens a WebSocket to `/ws/campaign?token=<JWT>`
2. The Worker (gatekeeper) intercepts the upgrade request
3. Worker verifies the JWT by calling Clerk — "is this wristband legit?"
4. If valid, Worker extracts user ID and finds (or creates) a Durable Object for this user
5. Worker passes the WebSocket to the DO with the user ID attached as a header
6. DO accepts the connection and sends an "ack" message
7. Browser starts pinging every 25 seconds to keep the connection alive

### 4. Generate — User Sends a Prompt

```
Browser                                    Durable Object
   │                                            │
   │── { type: "generate",                      │
   │     prompt: "create ads for my hotel",     │
   │     sessionId: "ws-12345" } ──────────────►│
   │                                            │
   │                                   handleGenerate()
   │                                     ├── Create campaign in D1
   │                                     ├── Save user message to D1
   │                                     ├── Persist session to storage
   │                                     │
   │◄── { type: "ack", campaignId } ────────────│
   │◄── { type: "phase", phase: "parse" } ──────│
   │                                     │
   │                                     ├── Fire off runGeneration()
   │                                     │   (in background)
   │                                     └── Return immediately
   │                                            │
   │── { type: "ping" } ──────────────────────►│  ← handler is free,
   │◄── { type: "pong" } ─────────────────────│    pings get answered!
```

**The key insight:** `handleGenerate()` sets everything up, fires off the generation in the background, and returns immediately. The DO is free to handle pings, reconnects, and cancels while the generation runs.

**Staying alive:** Before firing off the generation, the handler starts an **alarm heartbeat** — a 30-second recurring alarm that prevents the DO from hibernating. Without this, the Hibernation API would destroy the class instance (and kill the generation) as soon as the handler returns. The alarm keeps the DO alive until generation completes, at which point the alarm is cancelled and the DO can hibernate naturally.

### 5. runGeneration() — The Heavy Lifting

This runs in the background for 5-7 minutes:

```
Durable Object                Sandbox Container              External APIs
      │                              │                            │
      │ ─── 5a. Get sandbox ────────►│                            │
      │      (up to 3 retries        │                            │
      │       if IP blocked)         │                            │
      │                              │                            │
      │ ─── 5b. Mount R2 ──────────►│                            │
      │      (your file storage)     │                            │
      │                              │                            │
      │ ─── 5c. Pre-flight check ──►│── test API call ──────────►│ Anthropic
      │                              │◄── 200 OK ────────────────│
      │                              │                            │
      │ ─── 5d. Start agent-runner ►│                            │
      │      (npx tsx agent-runner)  │                            │
      │                              │── Claude SDK starts ──────►│ Anthropic
      │                              │                            │
      │    ┌─── 5e. Drain loop ─────┤                            │
      │    │   (read stdout lines)   │◄── AI thinking... ────────│
      │    │                         │◄── research done ─────────│
      │    │                         │◄── hooks written ─────────│
      │    │                         │◄── image prompt ──────────│
      │    │                         │── generate image ─────────►│ fal.ai
      │    │                         │◄── image URL ─────────────│
      │    │                         │◄── result ────────────────│
      │    └─────────────────────────┤                            │
      │                              │                            │
```

#### 5a. Get a Sandbox Container

The DO requests a sandbox — a mini Linux computer in the cloud. Think of it as renting a room where the AI does its work. The sandbox is created with `keepAlive: true`, which makes the SDK send heartbeat pings every 30 seconds to prevent the container from being evicted. Without this, the SDK's `sleepAfter` timer would kill the container after 10 minutes of no API calls — even though the AI is actively working inside.

Each sandbox gets a random Cloudflare IP, and some IPs are blocked by Anthropic. If the IP is blocked, it destroys the sandbox and tries a new one (up to 3 attempts).

#### 5b. Mount R2 Storage

R2 is Cloudflare's file storage (like a cloud hard drive). The sandbox mounts your personal folder at `/mnt/r2/users/<your-id>/` so the AI can read and write files — research notes, generated images, session history.

#### 5c. Pre-flight IP Check

Before doing real work, the sandbox makes a quick test call to Anthropic's API. If it gets a 403 (blocked), the DO destroys this sandbox and retries with a new one.

#### 5d. Start the Agent-Runner

The sandbox runs `npx tsx agent-runner.ts` — this boots up the Claude SDK (takes ~2 min for first-time compile and initialization). The agent-runner is the AI brain that:
- Reads your prompt
- Researches the brand
- Creates ad hooks (headlines)
- Writes image prompts
- Generates images via fal.ai

#### 5e. The Drain Loop

The agent-runner outputs JSON lines to stdout as it works. The DO sits in a loop reading these lines:

```
stdout line:  {"type":"assistant","subtype":"thinking","text":"Analyzing the hotel..."}
stdout line:  {"type":"assistant","subtype":"text","text":"Here are your hooks..."}
stdout line:  {"type":"tool","name":"generate_ad_images","status":"started"}
stdout line:  {"type":"result","cost":0.15,"duration":120000}
```

For each line, the DO:
1. Parses the JSON
2. Converts it to a UI event (phase change, text block, image, etc.)
3. Sends the event to your browser over WebSocket
4. Saves data to D1 (files, images, campaign status)

### 6. Real-Time UI Updates

```
Durable Object                              Browser
      │                                        │
      │── { type: "phase", phase: "research" }─►│  "Researching Brand"
      │── { type: "thinking", text: "..." } ───►│   thinking block appears
      │── { type: "phase", phase: "hooks" } ───►│  "Creating Hooks"
      │── { type: "text", text: "..." } ───────►│   hook text appears
      │── { type: "phase", phase: "art" } ─────►│  "Art Direction"
      │── { type: "image", url: "...", ... } ──►│   image pops in!
      │── { type: "image", url: "...", ... } ──►│   another image!
      │── { type: "complete", duration: ... } ─►│  "Done!"
      │                                        │
```

This is why you see the UI updating in real-time — each step of the AI's work is streamed to your browser as it happens.

### 7. Completion

```
Durable Object                    D1 Database
      │                               │
      │── UPDATE campaign              │
      │   SET status = 'complete' ────►│
      │                               │
      │── INSERT assistant message ───►│
      │   (summary + blocks)          │
      │                               │
      │── Reset state:                │
      │   isGenerating = false        │
      │   abortController = null      │
      │   clearPersistedSession()     │
```

When the agent-runner finishes, the DO wraps up: marks the campaign as complete in D1, saves the final assistant message, and resets its internal state.

### 8. Follow-Up

```
Browser                                    Durable Object
   │                                            │
   │── { type: "follow_up",                     │
   │     prompt: "make the colors warmer",      │
   │     campaignId: "campaign_abc123" } ──────►│
   │                                            │
   │                                   handleFollowUp()
   │                                     ├── Look up campaign in D1
   │                                     ├── Get SDK session ID (for resume)
   │                                     ├── Save user message
   │                                     ├── Fire off runGeneration()
   │                                     │   (with SDK session for context)
   │                                     └── Return immediately
```

Same flow as generate, but:
- Reuses the existing campaign
- **Hydrates files** — restores research, hooks, and prompts from D1 into the new sandbox so the AI has full context from the original generation
- Resumes the SDK session if possible (so the AI remembers the conversation)

### 9. Reconnect / Page Refresh

```
Browser                    Worker                     Durable Object
   │                         │                              │
   │ (connection drops or page refresh)                     │
   │                                                        │
   │──WSS /ws/campaign──────►│── verify JWT ──────────────►│
   │                         │                              │
   │◄── connected ───────────│                              │
   │                                                        │
   │── { type: "subscribe",                                 │
   │     sessionId: "ws-12345",                             │
   │     lastEventId: 42 } ───────────────────────────────►│
   │                                                        │
   │                                   handleSubscribe()
   │                                     ├── Find session in buffer
   │                                     ├── Replay events 43, 44, 45...
   │                                     │
   │◄── { type: "phase", id: 43 } ─────────────────────────│
   │◄── { type: "text", id: 44 } ──────────────────────────│
   │◄── { type: "image", id: 45 } ─────────────────────────│
   │◄── { type: "subscribed", message: "Replayed 3" } ─────│
   │                                                        │
   │  (picks up right where you left off)                   │
```

The DO keeps a buffer of recent events. When you reconnect, it replays everything you missed. If generation is still running, new events continue flowing.

### 10. Cancel

```
Browser                                    Durable Object
   │                                            │
   │── { type: "cancel" } ────────────────────►│
   │                                            │
   │                                   handleCancel()
   │                                     ├── Abort signal (stops drain loop)
   │                                     ├── Destroy sandbox container
   │                                     ├── Update D1: status = 'cancelled'
   │                                     │
   │◄── { type: "ack", "Cancel requested" } ───│
```

Because of the fire-and-forget fix, cancel messages are processed immediately — they don't have to wait behind a blocked handler.

---

## Data Storage

### D1 (SQLite Database)

| Table | What it stores |
|-------|---------------|
| `campaigns` | Campaign ID, user ID, name, session ID, SDK session ID, status |
| `messages` | User and assistant messages, UI blocks (thinking, text, images) |
| `campaign_files` | Research, hooks, prompts — text content saved for follow-ups |
| `files` | Uploaded asset files metadata (images the user provides as reference) |

### R2 (Object Storage)

```
users/
  └── {userId}/
       ├── images/               ← Generated ad images
       │    ├── session_1_stat_hook.png
       │    └── session_2_story_hook.png
       ├── uploads/              ← User-uploaded reference images
       │    └── folder-xxx/
       │         └── brand-logo.png
       └── .claude/              ← SDK session history (for resume)
            └── projects/
                 └── -app-agent/
                      └── {sdkSessionId}.jsonl
```

---

## Error Recovery Summary

| Scenario | What happens |
|----------|-------------|
| **WebSocket drops** | Browser auto-reconnects (up to 5 times), sends subscribe, DO replays missed events |
| **Sandbox IP blocked** | DO retries up to 3 times with different sandbox IDs |
| **Sandbox container dies** | `.catch()` on exec promise sets `execDone=true` → drain loop exits → finally block runs → D1 updated, container destroyed |
| **DO evicted mid-generation** | Gap 1 fix: next subscribe detects dead generation, marks campaign as `incomplete` |
| **runGeneration() throws** | Inner try/catch/finally handles it: updates D1 status, resets state, destroys sandbox, clears session |
| **Page refresh** | Browser loads campaigns from REST API, reconnects WS, subscribes with last event ID |
| **User cancels** | Abort signal stops drain loop, sandbox destroyed, D1 updated to `cancelled` |

---

## Key Technical Decisions

1. **Fire-and-forget generation** — `runGeneration()` is not awaited inside the message handler. This keeps the DO responsive to pings, subscribes, and cancels during the 5-7 minute generation.

2. **Alarm heartbeat** — Fire-and-forget alone causes the DO to hibernate (Hibernation API destroys idle DOs). A 30-second recurring alarm (`this.state.storage.setAlarm()`) keeps the DO alive while generation runs. Started before fire-and-forget, cancelled in `finally` when generation ends. Note: `waitUntil()` is a no-op in Durable Objects — alarms are the correct mechanism.

3. **One DO per user** — Each user gets their own Durable Object. This isolates state and prevents one user's generation from blocking another's.

4. **Event buffer for replay** — All events are buffered in memory so reconnecting clients can catch up on missed events.

5. **Session persistence** — Critical state (session ID, campaign ID, user ID) is persisted to DO storage so it survives DO resets/hibernation.

6. **Pre-flight IP retry** — Sandbox containers get random Cloudflare IPs, some of which Anthropic blocks. Testing before starting avoids wasting 2+ minutes on a doomed sandbox.

7. **File hydration for follow-ups** — Sandbox containers are ephemeral. For follow-ups, files from the original generation are restored from D1 into the new sandbox so the AI has full context.

8. **Sandbox `keepAlive: true`** — The sandbox SDK's `sleepAfter` timer only tracks SDK API calls, not container activity. A long-running `exec()` with streaming output looks "idle" to the SDK. `keepAlive: true` sends heartbeat pings every 30s to prevent eviction. The container is explicitly `destroy()`ed in the `finally` block.

9. **Exec error handling** — If the sandbox container dies mid-generation (maintenance, etc.), `sandbox.exec()` rejects but the drain loop only checked `execDone` on the success path. A `.catch()` on the exec promise sets `execDone = true` on rejection, allowing the drain loop to exit and the `finally` cleanup to run.
