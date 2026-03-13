# Session 38: Bug Fixes & Generation Flow Docs — 2026-03-10

**Date:** 2026-03-10
**Branch:** `new-ui`
**Prior state:** Session 37 (docs alignment complete, all 22 docs verified)

## What Happened

Tested production with `wrangler tail`, ran a generation, analyzed the logs (`log-4.md`), found 2 bugs, fixed both, and created comprehensive generation flow documentation.

## Test Results (from log-4.md)

### Generation 1 (`campaign_mmk7u5k3lue4ws`) — FAILED

| Time | Event |
|------|-------|
| 11:45 | Sandbox setup, R2 mount, API pre-flight all passed. Agent started |
| 11:47:41 (age 123s) | `waitForLog` died — SDK 120s stream timeout |
| 11:47–11:51 | "Received stream chunk for unknown request" spam — agent still running, no handler |
| 11:51 | Deploy happened mid-generation → DO reset + container killed |

User deleted campaign, retried.

### Generation 2 (`campaign_mmk9ieo7923b5x`) — COMPLETED (with bugs)

| Time | Event |
|------|-------|
| 12:32 | Same setup, agent started |
| 12:32–12:43 | Alarm heartbeats every 30s, generation running (~11.5 min total) |
| 12:43 | 6 images generated and served |
| 12:43 | **BUT**: 40 old images from other campaigns also added to this campaign |

## Bugs Found

### Bug 1: Image Pollution (tracking file not cleaned)

**Root cause:** `/app/generated-images.jsonl` accumulates across warm container reuse. Each `nano-banana-mcp` call appends to this file. `writeCompletionMarker()` reads and clears it on successful completion, but killed/interrupted generations leave stale entries behind. The workspace cleanup in `runGeneration()` only cleaned `/app/agent/files/*` — never touched the tracking file.

**Evidence:** D1 had 46 images for `campaign_mmk9ieo7923b5x` — 6 real + 40 from old campaigns. The R2 completion marker confirmed all 46 were listed.

**Fix:** Added `rm -f /app/generated-images.jsonl /app/turn-result.json` before every generation (both new and follow-up). Runs before workspace cleanup, so tracking data is always fresh.

**D1 cleanup:** `DELETE FROM campaign_images WHERE campaign_id='campaign_mmk9ieo7923b5x' AND image_index > 6` — removed 40 stale rows.

### Bug 2: waitForLog Premature Death

**Root cause:** When `waitForLog` failed (120s SDK stream timeout), the `.catch()` block immediately marked the campaign `incomplete` and set `isGenerating = false`. This killed the entire safety net:
- `pollR2CompletionMarker()` returns early because `isGenerating` is `false`
- Alarm stops rescheduling because `isGenerating` is `false`
- Agent is still running in the container, but DO has completely given up

**Fix:** Changed the `.catch()` to re-attach `waitForLog` (up to 10 retries) instead of marking incomplete. Each retry opens a new SSE stream and checks existing logs first — if `turn_complete` was already printed, resolves immediately. Also changed the `getProcess` catch to not mark incomplete. Three-layer safety net now works properly:
- Layer 1: `waitForLog` re-attach (retries automatically on stream timeout)
- Layer 2: R2 alarm polling every 30s (completely independent of streaming)
- Layer 3: 2h safety net marks incomplete as last resort

## Code Changes

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Added `completionRetries` instance var |
| | Reset `completionRetries = 0` in `handleGenerate()` and `handleFollowUp()` |
| | `waitForLog` catch: re-attach up to 10x instead of marking incomplete |
| | `getProcess` catch: log error, keep `isGenerating = true`, rely on R2 polling |
| | Added `rm -f /app/generated-images.jsonl /app/turn-result.json` before workspace cleanup |

## Documentation Created

### `docs/architecture/GENERATION_FLOW.md`

Full end-to-end generation flow with ASCII diagrams. Contents:

#### High-Level Flow
```
Browser → WebSocket → Worker → DO → Container → Claude AI → fal.ai → R2
                                 ↓                              ↓
                                D1                         /mnt/r2 (FUSE)
```

#### Step-by-Step Phases

1. **User Sends Prompt** — Client sends `{ type: 'generate' }` over WS → Worker verifies Clerk JWT → forwards to DO

2. **DO Sets Up Campaign** — Creates campaign + message in D1 (status: `generating`), persists session to DO storage, starts alarm heartbeat, fires `runGeneration()` as fire-and-forget

3. **Container Setup** — Get/create sandbox, kill old agent-runner, unmount+remount R2 FUSE, pre-flight IP check (retry up to 3x if Anthropic blocks IP), clean tracking files + workspace

4. **Agent Starts** — `sandbox.startProcess('node agent-runner.js')` with env vars (API keys, prompt, campaign ID, `HOME=/mnt/r2`). Attaches two independent listeners to stdout:
   - `attachCompletionHandler()` — `waitForLog('turn_complete')`, the only path that marks campaign complete
   - SSE stream — live UI updates, best-effort

5. **Agent Runs (inside container)** — Claude SDK orchestrates: research → hooks → image prompts → image generation via `nano-banana-mcp` → fal.ai API → download to `/mnt/r2/images/` → append to `/app/generated-images.jsonl`

6. **Live Streaming** — Agent stdout (JSONL) → `parseSSEStream()` → `processSDKMessage()` → extract events (thinking, text, tool calls, images) → `emitEvent()` → WebSocket → client Zustand store → React re-render

7. **Completion Detection** — Three independent layers:
   ```
   Layer 1: waitForLog('turn_complete')     ← primary, fastest
            On failure: re-attach up to 10x (not mark incomplete)
   Layer 2: pollR2CompletionMarker()        ← alarm every 30s, reads R2
   Layer 3: POST /api/recover              ← client-triggered, last resort
   ```
   All paths converge → reconcile images/files against D1 → dedup → mark complete → emit `{ type: 'complete' }` to client

8. **Client Renders** — Receives `complete` event → Zustand updates → React renders → `<AuthImage>` fetches `/images/{filename}` with Bearer token → Worker serves from R2

#### Follow-Up Flow
```
Fast path (agent alive):  Write /app/next-prompt.json → agent polls → same SDK session (~30-60s)
Slow path (agent dead):   Full runGeneration() + hydrate files from D1 (~3-5 min)
```

#### Container File Layout
```
/app/generated-images.jsonl    ← tracking (nano-banana appends, writeCompletionMarker clears)
/app/turn-result.json          ← completion data (images + files for current turn)
/app/next-prompt.json          ← IPC: DO writes, agent-runner polls
/app/agent-status.json         ← IPC: agent-runner writes status
/app/agent/files/              ← research, prompts output
/mnt/r2/images/                ← ALL images for this user (R2 FUSE mount)
/mnt/r2/completion_{id}.json   ← completion marker per campaign
```

#### Failure Modes & Recovery Table
| Failure | Recovery |
|---------|----------|
| SDK SSE stream timeout (120s) | `waitForLog` re-attaches up to 10x. R2 polling runs in parallel |
| Browser refresh mid-generation | DO stays alive (alarm). Client reconnects, replays events |
| DO reset (deploy/hibernation) | `restoreSession()` from storage. Alarm re-attaches listeners |
| Container killed (rollout) | R2 polling finds marker if agent finished. Otherwise 2h safety net |
| Anthropic IP blocked (403) | Pre-flight retry: new sandbox with different ID (up to 3x) |
| Stale tracking file | `rm -f generated-images.jsonl` before every generation |

### Index Updates

- `CLAUDE.md` — Added architecture docs reference table with all 23 docs, added `GENERATION_FLOW.md`
- `docs/architecture/INDEX.md` — Added to quick start table and documentation map

## Status

- **Code changes:** Written, NOT deployed
- **D1 cleanup:** Done (40 stale images removed)
- **Testing:** Pending deploy + new generation test
- **Deploy command:** `cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy`
