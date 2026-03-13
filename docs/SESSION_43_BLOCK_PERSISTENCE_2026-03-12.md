# Session 43: Block/Text Persistence + R2 Marker Cleanup + Cold-Start Memory

**Date**: 2026-03-12
**Branch**: `new-ui`
**Status**: Deployed (`250401c7`), pending test evaluation

## Problem

Three interconnected bugs from one architectural gap — the agent-runner didn't capture enough data, so the DO completion handler saved empty results to D1:

1. **Assistant messages saved with `blocks: []` and "Generation complete."** — blocks/text were built in the DO streaming loop (local vars), but the completion handler ran in a separate scope with no access. After refresh, all thinking blocks, phases, and agent text were lost.

2. **Stale R2 completion marker poisons follow-ups** — the R2 marker was written after each turn but never deleted. Follow-ups >30s got poisoned when the alarm found the stale marker from the previous turn.

3. **Agent forgets conversation on cold-start follow-ups** — the SDK's JSONL (conversation history) goes through s3fs FUSE which buffers writes. On container death, JSONL is stale/empty. Resume fails silently, agent starts fresh with no memory.

## Root Cause

The agent-runner (source of truth for what happened during generation) only wrote images and files to `turn-result.json` and the R2 marker. It didn't capture the accumulated text or thinking blocks that the DO streaming loop was building independently.

## Changes

### New: `cloudflare/sandbox/block-builder.ts` (136 lines)
- Self-contained copy of `BlockBuilder` with inline type definitions
- No imports from `cloudflare/src` (sandbox runs in container, not Worker)

### Modified: `cloudflare/sandbox/agent-runner.ts`
- Added `processMessageForBlocks()` — simplified `processSDKMessage` that only builds blocks (no D1, no events)
- Phase detection mirrors `sdk-message-parser.ts`: Task→Researching, Skill→Hooks/Art, nano-banana→Images
- Tool display names map, file write detection, image result counting
- `writeCompletionMarker(blocks, text)` — now writes blocks + text to both R2 marker (`version: 2`) and `turn-result.json`
- Main loop: creates `blockBuilder` + `textAccumulator`, processes every message, passes to `writeCompletionMarker` on result, resets for next turn
- Same pattern in resume-failed catch block

### Modified: `cloudflare/sandbox/Dockerfile`
- Added `COPY block-builder.ts ./`

### Modified: `cloudflare/sandbox/tsconfig.json`
- Added `block-builder.ts` to include array

### Modified: `cloudflare/src/durable-objects/campaign-session.ts`

**a) `attachCompletionHandler`**: Reads blocks + text from `turn-result.json`. Uses `stripImageUrls(text).substring(0, 500)` for summary instead of hardcoded "Generation complete.". Deletes R2 marker after completion.

**b) Alarm log snapshot path**: Same pattern — reads blocks/text from `turn-result.json` for assistant message. Deletes R2 marker.

**c) `pollR2CompletionMarker`**:
- Timestamp guard: ignores markers written before `this.generationStartedAt`
- Reads `text` and `blocks` from marker for assistant message
- Deletes R2 marker after completion

**d) `handleFollowUp`**: Deletes stale R2 marker at start (after `isGenerating = true`)

**e) Cold-start conversation context**: In slow path, loads D1 conversation history and appends to prompt so agent has context even when SDK JSONL resume fails

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/block-builder.ts` | **NEW** — BlockBuilder + types for sandbox |
| `cloudflare/sandbox/agent-runner.ts` | Block-building during generation, enhanced turn-result.json |
| `cloudflare/sandbox/tsconfig.json` | Added block-builder.ts to include |
| `cloudflare/sandbox/Dockerfile` | COPY block-builder.ts |
| `cloudflare/src/durable-objects/campaign-session.ts` | Read blocks/text in completion handlers, R2 marker cleanup, conversation context |

## What Did NOT Change
- `cloudflare/src/lib/block-builder.ts` — DO-side copy stays as-is (used by streaming pipeline)
- `cloudflare/src/lib/sdk-message-parser.ts` — streaming pipeline stays as-is (real-time UI)
- Client code — already renders blocks from D1 correctly
- D1 schema — blocks column already exists, just needs real data

## Verification Plan (for next session)
1. Generate a campaign → verify streaming works (real-time phases/tools in UI)
2. Refresh the page → verify assistant message shows thinking blocks, tools, and text (not just "Generation complete.")
3. Send a fast follow-up (<30s) → verify it works, then refresh → blocks persist
4. Send a slow follow-up (>30s) → verify alarm doesn't poison it with stale R2 marker
5. Wait for container to sleep → send follow-up → verify agent has conversation context
6. Check D1: `npx wrangler d1 execute creative-agent-db --remote --command="SELECT content, blocks FROM messages WHERE role='assistant' ORDER BY created_at DESC LIMIT 3"` — verify blocks is not empty

## Deploy
```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy
```
Deployed version: `250401c7-b0a4-4424-9e44-037e3fc49129`
