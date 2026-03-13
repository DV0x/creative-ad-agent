# Generation Flow — End to End

> How a user prompt becomes ad creatives. Covers the full data flow from browser keystroke to rendered images.

---

## The Players

| Component | What it is | Where it runs |
|-----------|-----------|---------------|
| **Client** | React SPA (Zustand + WebSocket) | User's browser |
| **Worker** | Cloudflare Worker (entry point) | Cloudflare edge |
| **DO** | Durable Object (CampaignSession, one per user) | Cloudflare edge |
| **Container** | Sandbox (Docker, `standard-2`: 1 vCPU, 6 GiB) | Cloudflare container |
| **agent-runner** | Long-lived Node process inside container | Inside container |
| **Claude SDK** | AI orchestrator (research → hooks → prompts → images) | Inside agent-runner |
| **nano-banana-mcp** | MCP tool server for image generation (fal.ai) | Inside agent-runner |
| **D1** | SQL database (campaigns, messages, images, files) | Cloudflare D1 |
| **R2** | Object storage (image files, completion markers) | Cloudflare R2 |

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
                                                               └───────────┘
                                                                     │
                                                          stdout (JSONL)
                                                                     │
                                              ┌──────────────────────┼──────────────────────┐
                                              │                      │                      │
                                              ▼                      ▼                      ▼
                                        SSE stream             waitForLog            R2 polling
                                       (live UI)            (completion)          (alarm, 30s)
                                              │                      │                      │
                                              ▼                      ▼                      ▼
                                          emitEvent ──▶ WebSocket ──▶ Client          reads marker
                                              │                                            │
                                              ▼                                            ▼
                                             D1 ◀──────── reconcile images/files ◀─────────┘
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
  ├── startKeepAlive() ──────────────────────▶ alarm every 30s
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
  │   sandbox.exec('pkill -9 s3fs; umount -f ...; rm -rf /mnt/r2; mkdir -p /mnt/r2')
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
  │       HOME: '/mnt/r2',                    ◀── SDK session JSONL on R2
  │       IMAGE_OUTPUT_DIR: '/mnt/r2/images',  ◀── images on R2 via FUSE
  │     }
  │   })
  │
  ├── Persist agentProcessId to DO storage
  │
  ├── attachCompletionHandler()  ◀── Layer 1: waitForLog('turn_complete')
  │
  └── Start SSE stream loop      ◀── live UI updates (best-effort)
      for await (event of parseSSEStream(logStream))
```

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
  │   All SDK events stream to stdout as JSONL:
  │     { type: 'content_block_delta', ... }
  │     { type: 'tool_use', ... }
  │     { type: 'tool_result', ... }  ◀── contains image results
  │
  │   On completion:
  │
  ├── Print 'turn_complete' to stdout
  │
  └── writeCompletionMarker()
        │
        ├── Read /app/generated-images.jsonl → image list
        ├── Clear /app/generated-images.jsonl
        ├── Read agent output files (research, hooks, prompts)
        ├── Write /mnt/r2/completion_{campaignId}.json ──▶ R2
        └── Write /app/turn-result.json (local disk, fast read)
```

### 6. Live Streaming (while agent runs)

```
Container stdout                    DO                              Client
  │                                  │                                │
  │── JSONL line ──────────────────▶│                                │
  │   (SSE stream via SDK RPC)      │                                │
  │                                  ├── parseSSEStream()            │
  │                                  ├── processSDKMessage()         │
  │                                  │   │                           │
  │                                  │   ├── thinking block?         │
  │                                  │   │   emitEvent(phase)────────▶│ update UI
  │                                  │   │                           │
  │                                  │   ├── text delta?             │
  │                                  │   │   emitEvent(text)─────────▶│ show text
  │                                  │   │                           │
  │                                  │   ├── tool_use?               │
  │                                  │   │   emitEvent(phase)────────▶│ show tool
  │                                  │   │                           │
  │                                  │   └── tool_result with image? │
  │                                  │       emitEvent(image)────────▶│ show image
  │                                  │       addCampaignImage()──▶D1 │
  │                                  │                               │
  │                                  │   Events are BUFFERED in      │
  │                                  │   EventBuffer (max 1000)      │
  │                                  │   for reconnect replay        │
```

### 7. Completion Detection (Three Layers)

```
                    ┌─────────────────────────────────────────┐
                    │         Agent prints turn_complete       │
                    └──────────────────┬──────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
              ▼                        ▼                        ▼

       Layer 1: waitForLog      Layer 2: R2 polling      Layer 3: /recover
       ─────────────────        ────────────────         ─────────────────
       Primary, fastest         Alarm every 30s          Client-triggered
                                                         last resort
       waitForLog sees          Reads completion
       'turn_complete'          marker from R2           POST /api/recover
       in stdout                                         reads R2 marker
              │                        │                        │
              │    ┌───────────────────┘                        │
              │    │                                            │
              ▼    ▼                                            ▼
       ┌──────────────────────────────────────────────────────────────┐
       │                    Reconcile & Complete                       │
       │                                                              │
       │  1. Read turn-result.json (Layer 1) or completion marker     │
       │  2. Dedup images against D1 (skip already-saved ones)        │
       │  3. Add missing images to D1 (campaign_images table)         │
       │  4. Add missing files to D1 (campaign_files table)           │
       │  5. Add assistant message to D1                              │
       │  6. Update campaign status → 'complete'                      │
       │  7. emitEvent({ type: 'complete' }) → client                 │
       │  8. isGenerating = false                                     │
       └──────────────────────────────────────────────────────────────┘
```

#### Layer 1: waitForLog (Primary)

```
attachCompletionHandler()
  │
  ├── sandbox.getProcess(processId)
  │
  ├── proc.waitForLog('turn_complete', 2h timeout)
  │   │
  │   ├── Checks existing logs first (getProcessLogs)
  │   │   If turn_complete already printed → resolves immediately
  │   │
  │   └── Opens SSE stream (streamProcessLogs)
  │       Watches for 'turn_complete' pattern
  │
  │   On success (.then):
  │   └── reconcileImages + reconcileFiles + complete
  │
  │   On failure (.catch):
  │   └── Re-attach (up to 10 retries)     ◀── NOT mark incomplete
  │       SDK has 120s internal stream timeout
  │       Each retry = new SSE stream
  │       R2 polling runs in parallel as safety net
```

#### Layer 2: R2 Polling (Safety Net)

```
alarm() (every 30s)
  │
  ├── Check: isGenerating && campaignId?
  │
  ├── Safety net: generation > 2h? → mark incomplete, stop
  │
  ├── pollR2CompletionMarker()
  │   │
  │   ├── R2.get('users/{userId}/completion_{campaignId}.json')
  │   │
  │   ├── If found:
  │   │   ├── Dedup images against D1
  │   │   ├── Add missing images + files + message
  │   │   ├── Mark complete
  │   │   └── return true (stop alarm)
  │   │
  │   └── If not found: return false (continue polling)
  │
  ├── Re-attach waitForLog + stream if sandbox lost (DO reset)
  │
  └── Reschedule alarm (30s)
```

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
  ├── Get sdkSessionId (for Claude SDK session resume)
  │
  ├── isAgentProcessAlive()?
  │   │
  │   ├── Check process list (sandbox.listProcesses)
  │   ├── Check /app/agent-status.json (idle vs processing)
  │   │
  │   ├── YES (warm, idle) ──────────────────▶ FAST PATH (~30-60s)
  │   │   │
  │   │   ├── attachCompletionHandler()
  │   │   ├── Start streaming logs
  │   │   ├── Write /app/next-prompt.json    ◀── triggers agent-runner
  │   │   │   { prompt, campaignId, requestId }
  │   │   │
  │   │   └── agent-runner sees file → feeds prompt to existing SDK session
  │   │       (no cold start, no CLI init, same conversation context)
  │   │
  │   └── NO (dead/sleeping) ───────────────▶ SLOW PATH (~3-5 min)
  │       │
  │       ├── Full runGeneration() with container setup
  │       ├── Hydrate files from D1 (restore research/hooks/prompts)
  │       └── Append context to prompt so agent doesn't restart research
```

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

/mnt/r2/                           R2 FUSE mount (prefix: users/{userId}/)
├── images/                        ALL images for this user (all campaigns!)
│   ├── {ts}_1_{name}.png
│   ├── {ts}_2_{name}.png
│   └── ...
├── completion_{campaignId}.json   Completion marker (per campaign)
└── .claude/
    └── projects/-app-agent/
        └── {sdkSessionId}.jsonl   Claude SDK conversation history
```

---

## Failure Modes & Recovery

| Failure | What breaks | Recovery |
|---------|------------|----------|
| SDK SSE stream timeout (120s) | `waitForLog` catch fires | Re-attaches up to 10x. R2 polling runs in parallel |
| Browser refresh mid-generation | WS closed, SSE stream may die | DO stays alive (alarm). Client reconnects, subscribe replays events |
| DO reset (deploy/hibernation) | All instance vars lost | `restoreSession()` from DO storage. Alarm re-attaches sandbox + listeners |
| Container killed (version rollout) | Agent process dies | R2 polling finds completion marker if agent finished. Otherwise 2h safety net marks incomplete |
| Anthropic IP blocked (403) | API calls fail from container | Pre-flight retry: destroy sandbox, create new one with different ID (up to 3x) |
| FUSE mount stale | Image writes fail silently | unmountBucket → clean FUSE state → remount before every generation |
| Stale tracking file | Old images pollute new campaign | `rm -f /app/generated-images.jsonl` before every generation |

---

## Data Flow Summary

```
User prompt
  → D1 (user message)
  → Container (agent-runner)
  → Claude API (AI thinking)
  → fal.ai (image generation)
  → /mnt/r2/images/ (FUSE → R2)
  → /app/generated-images.jsonl (tracking)
  → stdout JSONL (streaming)
  → DO SSE stream (live parsing)
  → D1 (images, files via stream)
  → WebSocket (client events)
  → React (UI render)

On completion:
  → /mnt/r2/completion_{id}.json (R2 marker)
  → /app/turn-result.json (local)
  → D1 (reconcile missing images/files)
  → D1 (campaign status → complete)
  → WebSocket ({ type: 'complete' })
  → React (final render with all images)
```
