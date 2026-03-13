# Session 28: SSE Framing Fix + URL Stripping

**Date:** 2026-03-07
**Branch:** `new-ui`
**Prior version:** `605e485e` (Session 27 — replay fix)
**Deployed version:** `f8f73c4e`

## Context

Session 27 identified two bugs. Bug 1 (replay fix) was deployed. Bug 2 (SSE framing dropping long SDK messages) was left open. This session fixes Bug 2 and adds URL stripping for chat messages.

## Bug 2 Fix: Post-Turn Image Reconciliation (DEPLOYED)

### Root Cause (from Session 27)

`parseSSEStream()` in `@cloudflare/sandbox` silently drops JSON payloads that exceed a single SSE frame (~64KB). The `tool_result` message carrying image metadata grows with conversation context. By follow-up #6, it exceeded the frame limit — both fragments failed `JSON.parse()` silently, the DO never saw the image info, and the image was orphaned in R2 (never written to D1).

### Research Findings

Three parallel research agents investigated:

1. **Sandbox SDK**: No way to control SSE frame size. `parseSSEStream()` is in the SDK (can't modify). Alternative APIs: `getProcessLogs()` (one-shot, expensive), `sandbox.readFile()` (direct file read, bypasses SSE entirely), `sandbox.listFiles()` (directory listing).

2. **Claude Agent SDK**: No output size control. No alternative output channel. But has `getSessionMessages()` — reads full conversation from JSONL files on disk (no size limits). Not needed for our fix since we just need image filenames.

3. **Sandbox file APIs**: `readFile()`, `writeFile()`, `listFiles()` all available. No file watching API. File-based IPC is the established pattern (`agent-status.json`, `next-prompt.json`).

### Solution: File-Based Reconciliation

**Principle:** Don't rely on the SSE postal pipe for critical data. Use a direct file read as a safety net.

**Agent-runner** (`cloudflare/sandbox/agent-runner.ts`):
- After `writeCompletionMarker()`, also writes `/app/turn-result.json` to **local disk** (not R2 mount)
- Contains `{ images: [{ filename, path }] }` — the same image list from the completion marker
- Local disk = no FUSE flush concerns, instant read

**DO** (`cloudflare/src/durable-objects/campaign-session.ts`):
- New `reconcileImages()` method
- Called after `generationCompleted = true` in both `runFollowUpFast` and `runGeneration`
- Reads `/app/turn-result.json` via `sandbox.readFile()` (bypasses SSE entirely)
- Queries D1 `campaign_images` for existing images
- Inserts any missing images into D1 and emits `image` events to client
- Runs before the `complete` event, so `imageCount` is accurate

**Flow:**
```
Turn completes
  → agent-runner writes /app/turn-result.json (local disk, ~200 bytes)
  → agent-runner writes turn_complete to stdout
  → DO sees result/success
  → DO calls sandbox.readFile('/app/turn-result.json')  ← bypasses SSE
  → Compares image list against D1
  → Inserts missing images + emits events to client
  → Emits 'complete' with correct imageCount
```

### Why This Approach

| Considered | Verdict |
|-----------|---------|
| Fix `parseSSEStream()` | Can't — SDK code we don't control |
| Agent-runner splits large messages | Complex protocol, fragile |
| Small stdout summary message | Still goes through SSE (99.9% safe, not 100%) |
| `getProcessLogs()` fallback | Re-parses entire stdout history, expensive |
| `getSessionMessages()` from Claude SDK | Overkill — we just need filenames, not full conversation |
| **File-based reconciliation** | **Chosen — deterministic, bypasses SSE, uses existing IPC pattern, minimal code** |

## URL Stripping (DEPLOYED)

### Problem

The agent's text responses contain fal.ai CDN URLs and `/mnt/r2/images/` file paths. These render as raw text in the chat — ugly and redundant since images are shown in the gallery.

### Solution

New `stripImageUrls()` function in `sdk-message-parser.ts`:
- Removes `https://...fal.media/...` and `https://...fal.ai/...` URLs
- Removes `/mnt/r2/images/...` file paths
- Removes `**Image URL:**` lines entirely
- Collapses resulting blank lines

Applied in two places:
1. **Real-time streaming**: `message` events stripped before emitting to client
2. **DB persistence**: `generateSummary()` strips before saving to D1

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | Added `fs.writeFileSync('/app/turn-result.json', ...)` after completion marker |
| `cloudflare/src/durable-objects/campaign-session.ts` | New `reconcileImages()` method, called from both `runFollowUpFast` and `runGeneration` completion handlers. `generateSummary()` uses `stripImageUrls()`. New imports: `getHookTypeForIndex`, `HookType`, `stripImageUrls` |
| `cloudflare/src/lib/sdk-message-parser.ts` | New exported `stripImageUrls()` function. Streamed `message` events filtered through it |

## New Issue Found: s3fs Mount Failure on Sandbox Reuse After Cancel

### Symptoms

After cancelling a campaign, deleting it, and creating a new one — the s3fs mount fails with `Success: false`. The sandbox is reused (same sandboxId) and has stale mount state from the cancelled campaign.

### Evidence

```
Sandbox.unmountBucket - Ok @ 1:28:07 PM     (SDK unmount)
Sandbox.exec - Ok @ 1:28:07 PM              (pkill s3fs + umount + rm -rf /mnt/r2)
Sandbox.mountBucket - Ok @ 1:28:07 PM       (s3fs command: Success: false)
```

Timestamps show only 8ms between cleanup finishing and mountBucket starting. The mount point may not be fully clean.

### Root Cause (hypothesis)

The `pkill -9 s3fs` kills the process but the kernel-level unmount hasn't propagated in 8ms. When `mountBucket()` runs s3fs, it finds the mount point still busy.

### Possible Fixes

1. **Add delay**: Small `setTimeout` or `sleep 1` between cleanup exec and mountBucket
2. **Retry mountBucket**: If first mount fails, wait 1s and retry
3. **Verify mount clean**: After cleanup exec, run `mountpoint -q /mnt/r2 || echo clean` before proceeding
4. **Not yet implemented** — needs discussion on approach

## Next Session

1. Fix s3fs mount failure after cancel (choose approach, implement)
2. Test image reconciliation end-to-end (trigger the SSE drop, verify image appears)
3. Test URL stripping in chat messages
4. Remove debug diagnostics from initial generation (API key test, IP check) to reduce startup time
5. Update MEMORY.md
