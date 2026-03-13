# Session 33: R2 Polling & WebSocket Transport — 2026-03-10

**Date:** 2026-03-10
**Branch:** `new-ui`
**Prior version:** Session 32 (`7c7d1784`)

## Goal

Fix the `waitForLog` silent hang from Session 32 by adding a third completion path (alarm-based R2 polling) and switching to WebSocket transport.

## Research Phase

Launched 5 subagents to research Claude SDK docs (18 files), Cloudflare container docs, and codebase state.

### Key Findings

1. **Session 32 "pending" fixes are already deployed** — `getProcess` null/error cleanup, 20-min safety net, `generationStartedAt` tracking are all in the current code. Session 32 doc was stale.

2. **WebSocket transport (`SANDBOX_TRANSPORT=websocket`)** — switches SDK from HTTP SSE to WebSocket. On disconnect, `handleClose()` fires immediately and rejects all pending streams (including `waitForLog`). One env var change.

3. **WebSocket transport has a hardcoded 120s stream timeout** — `requestTimeoutMs ?? 12e4` in the SDK source (`index.js:1006`). Not configurable via `getSandbox` options. This kills `waitForLog` after 2 minutes, which is way too short for 5-15 min generations.

4. **`keepAlive: true` is irrelevant** — only prevents container sleep due to `sleepAfter`. No pings, no heartbeats, nothing to do with transport health.

5. **R2 polling is fully feasible** — `this.env.R2_BUCKET.get(key)` works from alarm handler. Marker key: `users/{userId}/completion_{campaignId}.json`. Logic 95% identical to `recovery.ts`.

## Deploys This Session

| Version | Changes | Result |
|---------|---------|--------|
| `2d98fe55` | WebSocket transport + R2 alarm polling | **BROKEN** — 120s stream timeout killed `waitForLog` prematurely |
| `f6c3207b` | Reverted to HTTP transport, kept R2 polling | Generation completed but showed 46 images (all campaigns) instead of 6 |
| `30c7a5de` | Increased timeouts to 2h (waitForLog + safety net) | Same 46-image bug — root cause is in agent-runner |

## Test Results

### Test 1: WebSocket Transport (`2d98fe55`)

- Generation started for `campaign_mmk7u5k3lue4ws`
- At ~2 min: `[gen] Stream error (non-fatal): ReadableStream received over RPC disconnected prematurely.`
- At ~2 min: `[completion] waitForLog failed: Stream timeout after 120000ms`
- Agent was still running fine — container sent "stream chunk for unknown request" warnings
- **Root cause:** SDK's WebSocket transport has `requestTimeoutMs = 120000` (hardcoded, not configurable)
- **Conclusion:** WebSocket transport unusable for long-running `waitForLog`

### Test 2: HTTP Transport + R2 Polling (`30c7a5de`)

- Generation started for `campaign_mmk9ieo7923b5x`
- Generation ran ~11 min (age=638s at last visible alarm)
- R2 polling found completion marker → campaign completed
- **Bug:** UI showed 46 images from ALL campaigns, not just this one's 6
- **Bug:** Message said "Generation complete. 46 images created."
- Chat showed only user prompt + synthetic assistant message (no intermediate streaming messages — expected, those are ephemeral)

### Root Cause: 46-Image Bug

`agent-runner.ts` `writeCompletionMarker()` scans `/mnt/r2/images/` which is mounted with prefix `users/{userId}/`. This directory contains images from ALL campaigns for this user, not just the current one. The marker JSON had 46 images.

**This bug always existed** but was never triggered before because:
- Pre-Session 23: sandbox destroyed after each gen → fresh R2 mount → only current images
- Post-Session 23: warm containers, but completion via SSE streaming caught images one-by-one. The marker was only used by the rarely-fired `/recover` endpoint
- This session: R2 alarm polling runs every 30s, guaranteed to read the bad marker

### Verified via R2

```bash
npx wrangler r2 object get "creative-agent-assets/users/.../completion_campaign_mmk9ieo7923b5x.json" --remote
```
- Marker contains 46 images
- Timestamps range from `1772709375595` (days ago) to `1773126511171` (this campaign)
- Only 6 images have the `1773126511171` prefix (this campaign's actual images)

## Code Changes (In Working Tree, NOT Deployed)

### Deployed changes (in current production)

1. **`wrangler.jsonc`**: Comment noting WebSocket transport is unusable (120s timeout)
2. **`campaign-session.ts`**: `pollR2CompletionMarker()` method — alarm-based R2 polling every 30s
3. **`campaign-session.ts`**: `waitForLog` timeout 900s → 2h, safety net 20min → 2h

### Written but NOT deployed (needs review)

4. **`nano-banana-mcp.ts`**: MCP tool appends to `/app/generated-images.jsonl` after each image download
5. **`agent-runner.ts`**: `writeCompletionMarker()` reads tracking file instead of scanning `/mnt/r2/images/`

## Architecture After This Session

```
Completion paths (3):
  1. waitForLog('turn_complete', 2h)  — primary, instant on completion
  2. Alarm R2 polling (every 30s)     — safety net, reads completion marker from R2
  3. Client /recover endpoint          — last resort, user-triggered

Alarm (every 30s):
  1. Safety net: generation > 2h → mark incomplete
  2. Poll R2 for completion marker → reconcile + complete  ← NEW
  3. Re-attach waitForLog + stream if sandbox lost
  4. Keep DO alive (prevent hibernation)
```

## Pending Fix: Image Tracking

**Problem:** `writeCompletionMarker()` in agent-runner scans all of `/mnt/r2/images/` — includes images from all campaigns.

**Proposed fix (written, not deployed):**
- MCP tool (`nano-banana-mcp.ts`) appends `{filename, path}` to `/app/generated-images.jsonl` after each image download
- `writeCompletionMarker()` reads that file instead of scanning the directory
- File cleared after each turn

**Concerns raised:**
- Is this overcomplicating things? The tracking file approach adds coupling between MCP tool and agent-runner
- Alternative: filter by filename timestamp prefix (each batch shares a `Date.now()` prefix)
- Alternative: have the DO filter the marker images against D1 (already in DB = skip)
- Need to decide simplest approach before deploying

## Key Learnings

1. **WebSocket transport has a hardcoded 120s stream timeout** — found in SDK source at `index.js:1006`. Makes it unusable for long-running log watching. No config to override.
2. **R2 polling works as designed** — completely independent of sandbox RPC. Catches completions within 30s.
3. **Shared R2 mount = shared image directory** — warm containers see ALL user images, not per-campaign. Any code scanning `/mnt/r2/images/` must filter by campaign.
4. **Test what you deploy, read the SDK source** — the WebSocket "auto-reconnect" claim in docs was misleading. Reading the actual code revealed it just fails fast (good) but has a 120s timeout (bad).
5. **New features can expose old bugs** — the image scanning bug existed since Session 18 but was dormant. R2 polling gave it a reliable execution path.

## Files Changed

| File | Status | Change |
|------|--------|--------|
| `cloudflare/wrangler.jsonc` | Deployed | Comment about WebSocket 120s limit, removed SANDBOX_TRANSPORT var |
| `cloudflare/src/durable-objects/campaign-session.ts` | Deployed | `pollR2CompletionMarker()`, 2h timeouts |
| `cloudflare/sandbox/agent-runner.ts` | **Not deployed** | Read from tracking file instead of scanning R2 images dir |
| `cloudflare/sandbox/nano-banana-mcp.ts` | **Not deployed** | Append to `/app/generated-images.jsonl` on image download |

## Next Session Priorities

1. **Decide simplest fix for the 46-image bug** — tracking file vs filename filter vs D1 dedup
2. **Deploy the fix and test end-to-end** — normal generation should show only this campaign's images
3. **Test browser refresh mid-generation** — the original Session 32 bug that started all this
4. **Clean up old completion markers in R2** — they contain stale image lists
