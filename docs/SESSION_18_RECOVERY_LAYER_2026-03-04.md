# Session 18: Layer 3 — Eventual Consistency Recovery

**Date:** 2026-03-04
**Branch:** `new-ui`
**Deployed version:** `5fa68e4a`

## Problem

When the DO crashes mid-generation (alarm exception, eviction, deploy), the sandbox container keeps running and finishes its work — images get written to R2, SDK JSONL persists. But D1 never learns about the results. Campaign stays `incomplete` with 0 images.

**Validated by real crash:** DO crashed at 4:24 PM due to alarm exception. Container kept running, generated 1 image (3.7 MB jpeg), wrote it to R2, SDK JSONL persisted (423KB, 58 lines with "Done!" message). But D1 has 0 images, 0 assistant messages, status=`incomplete`.

## Solution: Completion Marker + Recovery Endpoint

### How it works

1. **Agent-runner writes a completion marker** to R2 (`completion_{campaignId}.json`) after SDK finishes. Contains:
   - List of images found (recursive scan of `/mnt/r2/images/`)
   - Agent output files (research, hooks, prompts)
   - Campaign/session metadata

2. **Recovery endpoint** (`POST /api/campaigns/:id/recover`) reads the marker and syncs to D1:
   - Inserts missing images (dedup by file_path)
   - Updates empty campaign files
   - Adds synthetic assistant message if none exists
   - Sets status to `complete`

3. **Client auto-recovers on load** — when it finds an `incomplete`/`generating` campaign with no running agent, calls `/recover` before marking it incomplete.

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | Added `writeCompletionMarker()` — scans images + files, writes JSON marker to `/mnt/r2/`, calls `sync`. Reads `CAMPAIGN_ID` env var. Non-fatal (try/catch). |
| `cloudflare/src/durable-objects/campaign-session.ts` | Added `CAMPAIGN_ID: this.campaignId` to sandbox exec env vars (~line 635) |
| `cloudflare/src/routes/recovery.ts` | **New file** — `recoverCampaign()` endpoint. Verifies ownership, reads marker from R2, syncs images/files/messages to D1, returns full campaign data |
| `cloudflare/src/router.ts` | Wired `POST /:id/recover` route, imported recovery module |
| `client/src/lib/api.ts` | Added `campaignsApi.recover(id)` — POST to `/api/campaigns/${id}/recover` |
| `client/src/App.tsx` | `checkForRecovery()` now calls `recover()` before falling back to marking incomplete |

## Key Design Decisions

- **Marker is written by agent-runner, not DO** — because the whole point is that the DO may be dead. The container outlives the DO.
- **Images scanned recursively** — nano-banana MCP's `sessionId` param is optional, so images may be at `/mnt/r2/images/{filename}` or `/mnt/r2/images/{sessionId}/{filename}`.
- **Dedup by file_path** — recovery is idempotent. Running it twice won't create duplicate images.
- **Files only updated if empty** — won't overwrite user edits.
- **Non-fatal marker write** — if marker fails, generation still completes normally. Recovery is best-effort.

## Testing Plan (NOT YET TESTED)

### Test 1: Recovery after DO crash
1. Start a generation, wait for images to start generating
2. Force-kill the DO by redeploying mid-generation (`cd cloudflare && npx wrangler deploy`)
3. Wait ~2 min for container to finish on its own
4. Reload the client — should auto-detect `incomplete` campaign, call `/recover`
5. Verify images appear, status becomes `complete`, chat shows recovery message

### Test 2: Normal flow still works
1. Run a full generation without any crash
2. Verify it completes normally (marker gets written but recovery isn't triggered since status is `complete`)

### Test 3: No false positives
- Campaigns that were `incomplete` before this deploy have no marker → recovery returns `{ recovered: false, reason: 'no_marker' }` → falls through to existing behavior
- Campaign `campaign_mmbwlp3lm5le6s` from the earlier crash won't recover (no marker existed then)

### Test 4: Manual recovery via curl
```bash
# Get a Clerk token first, then:
curl -X POST https://creative-agent.alphasapien17.workers.dev/api/campaigns/{CAMPAIGN_ID}/recover \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

## R2 Marker Location

```
users/{userId}/completion_{campaignId}.json
```

Marker schema:
```json
{
  "version": 1,
  "status": "complete",
  "campaignId": "...",
  "sessionId": "...",
  "sdkSessionId": "...",
  "timestamp": "...",
  "images": [{ "filename": "...", "path": "images/..." }],
  "files": { "research": "...", "hooks": "...", "prompts": "..." }
}
```

## Status

- [x] Code implemented
- [x] TypeScript compiles (both cloudflare/ and client/)
- [x] Deployed (`5fa68e4a`)
- [x] Health check passing
- [ ] Test 1: Recovery after DO crash
- [ ] Test 2: Normal flow still works
- [ ] Test 3: No false positives
- [ ] Test 4: Manual recovery via curl
