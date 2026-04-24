# Generation Flow — End to End

> How a user prompt becomes ad creatives. Covers the full data flow from browser keystroke to rendered images.

---

## The Players

| Component | What it is | Where it runs |
|-----------|-----------|---------------|
| **Client** | React SPA (Zustand + WebSocket) | User's browser |
| **Worker** | Cloudflare Worker (entry point) | Cloudflare edge |
| **DO** | Durable Object (CampaignSession, one per user) | Cloudflare edge |
| **Container** | Sandbox (`standard-2` instance class, max 50 instances per env) | Cloudflare container |
| **agent-runner** | Long-lived Node process inside container | Inside container |
| **Claude SDK** | AI orchestrator (research → hooks → prompts → images) | Inside agent-runner |
| **nano-banana-mcp** | MCP tool server for image generation (fal.ai) | Inside agent-runner |
| **D1** | SQL database (campaigns, messages, images, files) — per-env: `creative-agent-db` (staging) / `creative-agent-db-prod` (production) | Cloudflare D1 |
| **R2** | Object storage for generated images — per-env: `creative-agent-assets` (staging) / `creative-agent-assets-prod` (production) | Cloudflare R2 |

> **Heads-up: no R2 completion markers.** Completion is detected from `/app/turn-result.json` on the container's local disk and reconciled into D1. Earlier versions wrote `/mnt/r2/completion_{campaignId}.json` — that path is gone. See [DURABLE_OBJECT.md § Completion detection](./cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers).

---

## High-Level Flow

```
┌──────────┐     WebSocket      ┌──────────┐     internal      ┌──────────┐
│  Browser  │ ──────────────────▶│  Worker  │ ────────────────▶│    DO    │
│  (React)  │ ◀──────────────── │  (auth)  │                  │ (per-user)│
└──────────┘    live events      └──────────┘                  └─────┬─────┘
                                                                     │
                                              fire-and-forget        │
                                              runGeneration()        │
                                                                     ▼
                                                               ┌───────────┐
                                                               │ Container │
                                                               │  (sandbox)│
                                                               │           │
                                                               │ agent-    │
                                                               │  runner   │
                                                               │    │      │
                                                               │    ▼      │
                                                               │ Claude SDK│
                                                               │    │      │
                                                               │    ▼      │
                                                               │ nano-     │
                                                               │ banana-mcp│──▶ fal.ai API
                                                               │    │      │
                                                               │    ▼      │
                                                               │ /mnt/r2   │──▶ R2 (FUSE)
                                                               │ (images)  │
                                                               └───────────┘
                                                                     │
                                                          stdout (JSONL)
                                                                     │
                                              ┌──────────────────────┼──────────────────────┐
                                              │                      │                      │
                                              ▼                      ▼                      ▼
                                         Live UI parse         turn_complete /        alarm (10s)
                                        (streamForLiveUI)      result sentinel        listProcesses
                                         5-branch parser       breaks stream loop     + readTurnResult
                                              │                      │                      │
                                              ▼                      ▼                      ▼
                                          emitEvent          post-stream tryFinalize   tryFinalize if dead
                                              │              reads /app/turn-result.json       │
                                              ▼                      │                      │
                                        WebSocket ──▶ Client ◀───────┴──────────────────────┘
                                              │                      │
                                              ▼                      ▼
                                              └───▶ D1 (messages, images, files, credits) ◀──┘

                                                     Last-resort: client POST /api/campaigns/:id/recover
                                                     (reads D1, marks campaign complete if data exists)
```

---

## Step-by-Step: New Generation

### 1. User Sends Prompt

```
Browser                          Worker                           DO
  │                                │                               │
  │─── WS: { type: 'generate',───▶│                               │
  │         prompt: '...',         │── verify Clerk JWT ──────────▶│
  │         sessionId: '...' }    │   extract userId              │
  │                                │   forward to DO               │
  │                                │   (X-User-Id header)          │
```

### 2. DO Sets Up Campaign

```
DO (handleGenerate)
  │
  ├── isGenerating = true
  ├── generationStartedAt = Date.now()
  ├── completionRetries = 0
  │
  ├── Create campaign in D1 ──────────────────▶ D1
  │   (status: 'generating')                    campaigns table
  │
  ├── Save user message in D1 ───────────────▶ D1
  │                                             messages table
  │
  ├── persistSession() ──────────────────────▶ DO storage
  │   (survives DO resets)                      activeSession key
  │
  ├── emitEvent({ type: 'ack' })
  ├── emitEvent({ type: 'phase', phase: 'parse' })
  │
  ├── startKeepAlive() ──────────────────────▶ alarm every 10s
  │
  └── runGeneration() ──── fire and forget ──▶ (returns immediately)
                                                handler can still
                                                process pings/subscribes
```

### 3. Container Setup

```
DO (runGeneration)
  │
  ├── getSandbox('user-{userId}-v2')
  │   (warm = reuse existing, cold = new container)
  │
  ├── Kill old agent-runner
  │   sandbox.exec('pkill -f agent-runner')
  │
  ├── Clean stale R2 mount
  │   sandbox.unmountBucket('/mnt/r2')
  │   sandbox.exec('pkill -9 s3fs; umount -l ...; rm -rf /mnt/r2; mkdir -p /mnt/r2')
  │
  ├── Mount R2 bucket
  │   sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
  │     prefix: '/users/{userId}'      ◀── scoped to this user
  │   })
  │   Result: /mnt/r2/images/ = ALL images for this user (all campaigns)
  │
  ├── Clean stale Claude CLI auth cache
  │
  ├── Pre-flight IP check ──────────────────▶ api.anthropic.com
  │   (test API call from inside container)
  │   If 403 → destroy sandbox, retry with new ID (up to 3x)
  │
  ├── Clean tracking files ◀── IMPORTANT: prevents image pollution
  │   rm -f /app/generated-images.jsonl /app/turn-result.json
  │
  ├── Clean workspace (new campaign only)
  │   rm -rf /app/agent/files/*
  │   rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md
  │
  └── (follow-up only) Hydrate files from D1
      Write research.md, hooks.md, prompts.json to sandbox disk
```

### 4. Agent Starts

```
DO (runGeneration, continued)
  │
  ├── sandbox.startProcess('node /app/dist/agent-runner.js', {
  │     env: {
  │       ANTHROPIC_API_KEY, FAL_KEY,
  │       PROMPT, SESSION_ID, CAMPAIGN_ID,
  │       RESUME_SDK_SESSION_ID: '',           ◀── always empty on cloudflare (s3fs JSONL unreliable)
  │       HOME: '/root',                       ◀── container home; agent stdout + workspace under /app
  │       IMAGE_OUTPUT_DIR: '/mnt/r2/images',  ◀── MCP writes images to R2 via FUSE
  │     }
  │   })
  │
  ├── Persist agentProcessId + agentCampaignId to DO storage
  │
  └── streamProcessLogs(agentProcessId) → streamForLiveUI(stream, ctx)
        ◀── Stage 2 of streaming pipeline (see STREAMING_PIPELINE.md)
        ◀── Also Layer 1 of completion: breaks on turn_complete / result sentinel
```

> **Why `HOME='/root'` and not `/mnt/r2`?** Pre-Session-58 docs framed HOME as living on R2. It doesn't — HOME is container-local so the SDK's Claude CLI auth cache and any tool scratch files don't take a FUSE round trip. Only images go to R2, via `IMAGE_OUTPUT_DIR` writes from the nano-banana MCP tool.

### 5. Agent Runs (inside container)

```
agent-runner.js
  │
  ├── claude.sessions.create({ prompt, model: 'sonnet', mcpServers: [...] })
  │
  ├── SDK orchestrator executes:
  │   │
  │   ├── 1. Research ─────────▶ visits URL, analyzes brand
  │   │      writes /app/agent/files/research/*.md
  │   │
  │   ├── 2. Hooks ────────────▶ generates 6 hook concepts
  │   │      writes /app/agent/.claude/skills/.../hook-bank/*.md
  │   │
  │   ├── 3. Prompts ──────────▶ creates image prompts per hook
  │   │      writes /app/agent/files/creatives/*.json
  │   │
  │   └── 4. Images ───────────▶ calls generate_ad_images MCP tool
  │          │
  │          ▼
  │   nano-banana-mcp.ts
  │          │
  │          ├── Call fal.ai API (flux model) ──────────▶ fal.ai
  │          │                                            generates image
  │          │                                            returns URL
  │          │
  │          ├── Download image ────────────────────────▶ /mnt/r2/images/{ts}_{idx}_{name}.png
  │          │                                            (FUSE → R2 upload on file close)
  │          │
  │          ├── Append to /app/generated-images.jsonl ◀── tracking file (local disk)
  │          │   { filename, path }
  │          │
  │          └── Return JSON result to stdout
  │              { images: [{ filename, urlPath, ... }] }
  │
  │   Events stream to stdout as JSONL. Agent-runner runs the SDK with
  │   `includePartialMessages: true`, then transforms `stream_event` messages
  │   into higher-level events the DO parser consumes:
  │     { type: 'text_start' | 'text_delta' | 'text_end', ... }    ◀── streaming text
  │     { type: 'tool_use_event', name: '...', input: {...} }      ◀── tool invocation
  │     { type: 'assistant', message: {...}, uuid }                ◀── final assistant turn
  │     { type: 'user', message: {content:[{type:'tool_result'...}]} }
  │     { type: 'system', subtype: 'init', session_id }            ◀── SDK session id
  │     { type: 'result', ... }                                    ◀── Layer 1 sentinel
  │     { type: 'turn_complete', requestId }                       ◀── Layer 1 sentinel
  │
  │   On completion:
  │
  ├── Print { type: 'turn_complete', requestId } to stdout
  │
  └── writeCompletionMarker()
        │
        ├── Read /app/generated-images.jsonl → image list
        ├── Clear /app/generated-images.jsonl
        ├── Read agent output files (research, hooks, prompts)
        └── Write /app/turn-result.json (container-local only, no R2 write)
             { images, files, text, blocks, requestId, campaignId, cost }
```

> **No R2 write on completion.** Container-local `/app/turn-result.json` is the only marker. The DO reads it via `sandbox.readFile()` (RPC into the container) in `tryFinalize`, reconciles into D1, then deletes the marker to prevent double-charge on crash recovery.

### 6. Live Streaming (while agent runs)

```
Container stdout                    DO (streamForLiveUI)            Client
  │                                  │                                │
  │── JSONL line ──────────────────▶│                                │
  │   (Sandbox streamProcessLogs    │                                │
  │    RPC — SSE-framed transport   ├── parseSSEStream(logStream)    │
  │    over the sandbox bridge,     │   (frame splitter, not         │
  │    NOT Anthropic SSE)           │    semantically SSE for us)    │
  │                                  │                                │
  │                                  ├── UUID dedup (seenUuids Set)   │
  │                                  │   SDK yields each message 2x  │
  │                                  │   (streaming + final)         │
  │                                  │                                │
  │                                  ├── processSDKMessage(msg, ctx) │
  │                                  │   5 branches:                 │
  │                                  │   ├── text_start / _delta /   │
  │                                  │   │   _end → BlockBuilder     │
  │                                  │   │         emit text_delta ──▶│ stream text
  │                                  │   ├── tool_use_event →        │
  │                                  │   │   emit phase + tool ──────▶│ show tool pill
  │                                  │   ├── assistant → seal blocks │
  │                                  │   ├── user (tool_result) →    │
  │                                  │   │   extract images, dedup,  │
  │                                  │   │   emit image ─────────────▶│ show image
  │                                  │   │   db.addCampaignImage     │
  │                                  │   └── system init → capture   │
  │                                  │       sdk_session_id → D1     │
  │                                  │                                │
  │                                  ├── Sentinel check: turn_complete│
  │                                  │   or result → turnDone=true   │
  │                                  │   break stream loop           │
  │                                  │                                │
  │                                  │   All events buffered in      │
  │                                  │   EventBuffer (ring, 1000)    │
  │                                  │   for reconnect replay        │
```

Full parser detail + dedup semantics: [STREAMING_PIPELINE.md](./cloudflare/STREAMING_PIPELINE.md). The `turn_complete` / `result` sentinel detection here is Layer 1 of the four-layer completion flow described next.

### 7. Completion Detection (Four Layers)

> Canonical source: [DURABLE_OBJECT.md § Completion detection — the real four layers](./cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers). Old framings mentioned `waitForLog` / `waitForExit` / `pollR2CompletionMarker` — **none of those exist in the current code** (grep-verified 2026-04-24). The current flow:

```
                    ┌─────────────────────────────────────────┐
                    │  Agent emits turn_complete / result      │
                    │  AND writes /app/turn-result.json        │
                    └──────────────────┬──────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼

  Layer 1: inline              Layer 2: post-stream          Layer 3: alarm
  stream parse                 tryFinalize                   listProcesses
  ─────────────────            ─────────────────             ─────────────────
  Primary, normal path         Session 66 fix:               Fallback (10s):
                               fires immediately after       - agent dead?
  streamForLiveUI sees         stream loop exits cleanly     - tryFinalize
  type:turn_complete or        — eliminates alarm race       - else mark incomplete
  type:result sentinel                                       - 5 min zombie net
  Breaks loop, returns         reads /app/turn-result.json   - 2 h safety net
  to runGeneration caller      via sandbox.readFile RPC
        │                              │                              │
        └──────────────┬───────────────┴──────────────┬───────────────┘
                       ▼                              ▼
              ┌──────────────────────────────────────────────┐
              │           tryFinalize(campaignId, sessionId) │
              │  1. readFile('/app/turn-result.json')        │
              │  2. Validate campaignId + requestId match    │
              │  3. finalizeGeneration(...)                  │
              │     — reconcile images (dedup vs D1)         │
              │     — reconcile files (research/hooks/prompts)│
              │     — persist assistant message              │
              │     — campaign.status = 'complete'           │
              │     — recordUsage + credits broadcast        │
              │     — delete turn-result.json                │
              │     — isGenerating = false                   │
              └──────────────────────────────────────────────┘

                                       ▼
  Layer 4: client POST /api/campaigns/:id/recover          (last resort)
  ─────────────────────────────────────────────────────────
  D1-FIRST. No R2 marker read. If D1 has any data (images, files, or
  assistant message), synthesize a completion and mark the campaign
  complete. Auto-fired by the client on page load if campaign status
  is 'generating' / 'incomplete' / 'error'. Idempotent.
```

#### Layer 1: inline stream parse (primary path)

`streamForLiveUI` (`campaign-session.ts:1224-1302`) reads `streamProcessLogs` frame by frame. When it sees `{type:'turn_complete'}` or `{type:'result'}`, sets `turnDone=true` and breaks both the inner line loop and the outer frame loop. Returns `false` (not cancelled). Caller (`runGeneration` or `runFollowUpFast`) proceeds directly into Layer 2.

#### Layer 2: post-streaming `tryFinalize` (Session 66 fix)

After the stream loop returns cleanly, the caller immediately invokes `tryFinalize(campaignId, sessionId)` inline. This eliminates a race where the alarm and the stream both tried to finalize and one would clobber the other.

`tryFinalize` at `campaign-session.ts:303-337`:

```
1. sandbox.readFile('/app/turn-result.json')  — wrapped in timedRPC
2. Parse JSON
3. Validate campaignId matches this.campaignId   (skip stale results from prior campaigns)
4. Validate requestId matches this.currentRequestId (skip stale follow-up turns)
5. finalizeGeneration(campaignId, sessionId, result)
6. Return true on success, false if file not found (normal — agent still working)
```

FileNotFoundError is expected whenever the function is called too early. Anything else is logged as a bug.

#### Layer 3: alarm fallback (runs every 10 s)

`alarm()` at `campaign-session.ts:109-298`. Priority order inside:

1. **Flush tail logs** — makes fire-and-forget `console.log` visible in `wrangler tail`
2. **Self-heal** — if `!campaignId`, `restoreSession()` from storage
3. **2 h safety net** — `(now - generationStartedAt) > 2h` → mark `incomplete`, emit friendly error
4. **Sandbox reconnect** — if sandbox is null AND setup isn't in progress, `getSandbox()` to reconnect. Skip if `sandboxSetupInProgress=true` (two `getSandbox()` connections cancel each other's RPCs)
5. **Zombie detection** — if `!agentProcessId && !sandboxSetupInProgress` AND age > 5 min → mark `incomplete`, emit "Hmm something didn't start right…"
6. **Agent liveness** — `listProcesses()` → is our agent `running`?
   - If dead → `tryFinalize` (agent may have written the marker just before dying)
   - If `tryFinalize` returns false → mark `incomplete`, friendly error
   - On fatal sandbox error (`'object to be reset'` / `'Network connection lost'`) → wipe sandbox ref, mark incomplete with reconnect copy
7. **Container log relay** — `getProcessLogs` diff vs `lastContainerLogLen`, trace last 3 new lines
8. **`tryFinalize` one more time** — covers the "agent is alive but marker already landed" case
9. **Reschedule** — `setAlarm(now + 10s)` if still generating. Else self-terminates.

Every step is wrapped in try/catch; the alarm always reschedules so we never get stuck with no heartbeat.

#### Layer 4: client `/recover` (last resort, D1-first)

`POST /api/campaigns/:id/recover` (`cloudflare/src/routes/recovery.ts:9-88`). Auto-fired by the client when it loads a campaign in `generating` / `incomplete` / `error` status.

```
1. Verify campaign exists + belongs to user
2. Only proceed if status in {'incomplete','generating','error'}
3. hasData = (images.length > 0 || files.length > 0 || lastAssistantMessage)
4. If !hasData → return { recovered: false, reason: 'no_data' }
5. If !lastAssistantMessage → insert synthetic "Generation recovered. N images found."
6. Update campaign status → 'complete'
7. Return full campaign payload
```

No R2 read anywhere. Idempotent — safe to call repeatedly past the first success.

### 8. Client Renders Results

```
Client (React)
  │
  ├── Receives { type: 'complete' } event via WebSocket
  │
  ├── Zustand store updates campaign status
  │
  ├── React re-renders campaign detail view
  │
  ├── For each image:
  │   │
  │   └── <AuthImage src="/images/{filename}" />
  │         │
  │         ├── authFetchBlob('/images/{filename}', { Bearer token })
  │         │
  │         ▼
  │       Worker receives GET /images/{filename}
  │         │
  │         ├── Verify Clerk JWT
  │         ├── R2.get('users/{userId}/images/{filename}')
  │         └── Return image bytes with Cache-Control headers
  │
  └── Campaign detail shows: research, hooks, prompts, images
```

---

## Follow-Up Flow (Fast Path vs Slow Path)

```
Client sends { type: 'follow_up', prompt, campaignId }
  │
  DO (handleFollowUp)
  │
  ├── Look up campaign in D1
  ├── Get sdkSessionId (for file hydration decisions)
  │
  ├── isAgentProcessAlive()?
  │   │
  │   ├── Check process list (sandbox.listProcesses)
  │   ├── Check /app/agent-status.json (idle vs processing)
  │   │
  │   ├── YES (warm, idle)
  │   │   │
  │   │   ├── agentCampaignId === campaignId?     ◀── campaign mismatch check
  │   │   │   │
  │   │   │   ├── YES ──────────────────────────▶ FAST PATH (~30-60s, runFollowUpFast)
  │   │   │   │   │
  │   │   │   │   ├── requestId = 'req_' + Date.now()   ◀── per-turn sentinel
  │   │   │   │   ├── streamProcessLogs(agentProcessId) ◀── open stream FIRST
  │   │   │   │   │   (avoids race where agent emits turn_start
  │   │   │   │   │    before the DO attaches its reader)
  │   │   │   │   ├── Write /app/next-prompt.json      ◀── triggers agent-runner
  │   │   │   │   │   { prompt, campaignId, requestId }
  │   │   │   │   │
  │   │   │   │   ├── streamForLiveUI(stream, ctx, { skipUntilRequestId: requestId })
  │   │   │   │   │   Replay-skips until it sees {type:'turn_start', requestId: …}
  │   │   │   │   │   then processes the new turn up to turn_complete / result
  │   │   │   │   │
  │   │   │   │   └── tryFinalize(campaignId, sessionId)  ◀── Layer 2 inline
  │   │   │   │
  │   │   │   └── NO (different campaign) ──────▶ SLOW PATH (kill + restart)
  │   │   │       Agent has wrong campaign context in memory.
  │   │   │       Must kill old agent and start fresh.
  │   │   │
  │   │   └── (agentCampaignId from DO storage — set by setupSandbox)
  │   │
  │   └── NO (dead/sleeping) ───────────────────▶ SLOW PATH (~3-5 min)
  │       │
  │       ├── Full runGeneration() with container setup
  │       ├── Hydrate files from D1 (restore research/hooks/prompts)
  │       ├── Append conversation history (all D1 messages) to prompt
  │       └── Agent starts fresh — NO SDK session resume (JSONL unreliable via s3fs)
```

**Why no SDK session resume on cloudflare?** The SDK stores conversation state in a JSONL file on R2 via s3fs FUSE mount. s3fs pre-allocates file size with null bytes, then writes content. If the file is read mid-flush or the container restarts during write, the JSONL gets null-byte corruption — the SDK hangs trying to parse it. D1 conversation history + file hydration provides all the context reliably.

---

## Key Files on Disk (inside container)

```
/app/
├── dist/agent-runner.js           Entry point (long-lived process)
├── next-prompt.json               IPC: DO writes, agent-runner polls
├── agent-status.json              IPC: agent-runner writes status (idle/processing)
├── generated-images.jsonl         Tracking: nano-banana appends, writeCompletionMarker reads+clears
├── turn-result.json               Completion: images + files for current turn
└── agent/
    ├── files/
    │   ├── research/*.md          Brand research output
    │   └── creatives/*.json       Image prompt output
    └── .claude/
        └── skills/hook-methodology/hook-bank/*.md   Hook concepts

/mnt/r2/                           R2 FUSE mount (prefix: /users/{userId}/)
├── images/                        ALL images for this user (all campaigns)
│   ├── {ts}_{idx}_{name}.png
│   └── ...
└── .claude/
    └── projects/-app-agent/
        └── {sdkSessionId}.jsonl   Claude SDK conversation history (orphaned —
                                   RESUME_SDK_SESSION_ID is always empty on
                                   Cloudflare, so the SDK writes here but we
                                   never read it back)
```

> **No `completion_{campaignId}.json` on R2.** Only `/app/turn-result.json` on the container's local disk is the completion marker.

---

## Failure Modes & Recovery

| Failure | What breaks | Recovery |
|---------|------------|----------|
| SDK stream stalls mid-turn | Live UI pauses, no sentinel arrives | Alarm (Layer 3) checks agent liveness every 10 s; calls `tryFinalize` if dead, else marks incomplete at the 5 min zombie threshold |
| Browser refresh mid-generation | WS closed, live UI loses connection | DO keeps running (alarm heartbeat). Client reconnects, `subscribe` replays events from EventBuffer |
| DO reset (deploy / hibernation) | All instance vars lost | `restoreSession()` from DO storage on next `webSocketMessage`. Alarm reconnects sandbox via `getSandbox()` |
| Container killed (version rollout) | Agent process dies | If `turn-result.json` was written first, alarm `listProcesses` → `tryFinalize` picks it up. Else 5 min zombie threshold marks incomplete; client auto-fires `/recover` on next page load |
| Anthropic IP blocked (403) | Pre-flight `WITH_KEY` check fails | Destroy sandbox, create with new ID, retry (up to 3 attempts) |
| FUSE mount stale | Image writes fail silently | `unmountBucket` → `pkill -9 s3fs; umount -l; fusermount -u; rm -rf /mnt/r2; mkdir` → `mountBucket` before every generation |
| Stale `generated-images.jsonl` | Old images pollute new campaign | `rm -f /app/generated-images.jsonl /app/turn-result.json` in `setupSandbox` step 2 |
| Nothing salvageable in D1 | `/recover` has no data | Returns `{ recovered: false, reason: 'no_data' }`; client shows retry UI |

---

## Data Flow Summary

```
User prompt
  → D1 (user message)
  → Container (agent-runner via startProcess)
  → Claude API (orchestrator + skills + subagents)
  → fal.ai (image generation via nano-banana MCP)
  → /mnt/r2/images/ (FUSE → R2 on file close)
  → /app/generated-images.jsonl (container-local tracking)
  → stdout JSONL (text_delta / tool_use_event / assistant / user / result)
  → DO streamForLiveUI (parse + UUID dedup + 5-branch processSDKMessage)
  → D1 (images + files saved as they stream)
  → WebSocket → EventBuffer → Client → React render

On completion (one of four paths fires):
  → /app/turn-result.json (container-local, only marker)
  → tryFinalize → finalizeGeneration
  → D1 (reconcile any missing images/files, persist assistant message)
  → D1 (campaign.status = 'complete', maxImageIndex persisted for next turn)
  → credits.recordUsage (INSERT OR IGNORE — idempotent per requestId)
  → WebSocket: { type: 'complete' } + { type: 'credits_update' }
  → React final render + credit balance refresh
```
