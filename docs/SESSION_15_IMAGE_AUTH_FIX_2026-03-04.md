# Session 15 — Image Auth Fix + Follow-Up Investigation — 2026-03-04

> Status: **Image auth fix deployed. Follow-up generation stuck — needs debugging.**
> Branch: `new-ui`
> Deployed version: `b4099394`

---

## What We Fixed This Session

### Bug: Images not visible in UI (despite generation completing successfully)

**Root cause:** `ImageCard.tsx` and `ImageLightbox.tsx` used plain `<img src={url}>` tags. Browser `<img>` tags don't send `Authorization: Bearer` headers. With Clerk auth enabled, the `/images/` endpoint requires authentication → returns 401 → images never load.

The `AuthImage` component already existed — it fetches images via `authFetchBlob()` which includes the Bearer token, then renders the blob URL. But `ImageCard` and `ImageLightbox` weren't using it.

**Fix:** Replaced `<img>` with `<AuthImage>` in both components. Also fixed download handlers (`handleDownload`) to use `authFetchBlob()` for authenticated downloads.

### How we found it

1. Generation completed successfully (version `9aca815e` — Session 14 fixes)
2. D1 showed `status=complete`, all files saved, 2 images in `campaign_images` table
3. R2 had both images (4.9MB + 2.9MB)
4. Image GET requests in wrangler tail showed `[AUTH] No token provided, returning null`
5. Traced the request chain: `ResultsView` → `ImageCard` → plain `<img src>` → no auth header → 401

### Files Modified

| File | Change |
|------|--------|
| `client/src/components/ImageCard.tsx` | `<img>` → `<AuthImage>`, `handleDownload` uses `authFetchBlob()` |
| `client/src/components/ImageLightbox.tsx` | `<img>` → `<AuthImage>`, `handleDownload` uses `authFetchBlob()` |

### Verified

After deploying `b4099394`, user refreshed and **images appeared correctly** in the UI.

---

## Session 14 Test Results (completed this session)

The Session 14 fixes (`9aca815e`) were tested end-to-end:

| Test | Result |
|------|--------|
| Generation completes (past old 6-min WS crash) | **PASS** — 16+ min generation completed |
| `keepAlive: true` prevents sandbox eviction | **PASS** — no "Shutdown container" error |
| `sandbox.destroy()` called after completion | **PASS** — cleanup worked |
| Alarm heartbeat keeps DO alive | **PASS** — alarms firing every 30s |
| Images generated and saved to R2 | **PASS** — 2 images (4.9MB + 2.9MB) |
| Images saved to D1 `campaign_images` table | **PASS** — both records present |
| Gap 1 fix (deploy reset → incomplete status) | **PASS** — verified again |
| Images visible in UI | **FAIL** → Fixed in this session (image auth bug) |

---

## Follow-Up Test — FAILED (needs debugging)

### Attempt 1: Deploy killed it

1. Deployed `b4099394` (image auth fix)
2. User sent follow-up immediately
3. Follow-up started: files hydrated, agent-runner booting
4. **~2 min later**: Deploy propagation reset the DO a second time
5. Gap 1 fix: marked campaign `incomplete`
6. Sandbox got "Network connection lost"

**Lesson:** Deploy has two phases — Worker code updates fast, container image push takes longer. The second reset comes ~2 min after the first. Don't send follow-ups until the container rollout is complete.

### Attempt 2: Generation stuck (CURRENT — needs investigation)

After waiting for deploy to fully propagate, user sent another follow-up.

**What happened:**
- 1:27:26 — Sandbox setup started (unmount, keepAlive, mount R2)
- 1:28:09 — R2 mounted successfully
- 1:28:20 — Pre-flight API test passed, files hydrated (3 files written)
- 1:28:26 — MCP server started (`nano_banana MCP server created`)
- 1:28:26+ — Alarm heartbeat firing every 30s (DO alive)
- 1:28:48+ — Ping/pong flowing every 25s (WS alive)
- **NO `[gen] SDK message:` logs appeared in 7+ minutes**
- D1: `status=generating`, file timestamps unchanged from original generation
- UI: No activity (no thinking block, no text, nothing)

**Current D1 state:**
```
campaign_mmboxf6vpr6ih4  status=generating  sdk_session_id=a899a9dc-b6a0-4128-915e-d0bcefb02ab3
Files: research=6339, hooks=6304, prompts=12748 (all from original generation, not updated)
Images: 2 (from original generation)
```

---

## What to Investigate Next Session

### 1. Is the agent-runner exec producing output?

The wrangler tail showed zero `[gen] SDK message:` logs. Possible causes:

a) **Agent-runner hung on startup.** The `npx tsx /app/agent-runner.ts` command might be stuck. The follow-up uses `--resume` with an SDK session ID — if the session file is missing or corrupt in R2, the CLI might hang.

b) **Drain loop not processing messages.** The drain loop reads from `messageQueue` which is populated by `onOutput` callbacks. If `sandbox.exec()` never fires `onOutput`, the queue stays empty.

c) **Wrangler tail not capturing background logs.** With fire-and-forget, `runGeneration()` runs as a background promise. Console.logs inside it get buffered. Previous generation showed these logs fine (flushed on alarm handler returns). But this time they're completely absent.

### 2. Check the exec command for follow-ups

The follow-up exec command uses `--resume` with `sdkSessionId`. Verify:
- Is the SDK session JSONL file present in R2? (`users/{userId}/.claude/projects/-app-agent/{sdkSessionId}.jsonl`)
- The previous generation used session `dde39e50-a8b0-472d-80a6-07a4d047daa1`, but D1 now shows `a899a9dc-b6a0-4128-915e-d0bcefb02ab3` — was the session ID changed during the failed follow-up attempt?

### 3. Check if the WS is actually connected during the follow-up

The client might have lost its WS connection. After the page refresh at 1:27:07, a new WS should have connected. But the tail only shows one WS upgrade at 1:25:10 (before the page refresh). Verify:
- Is the client's WS actually connected?
- Is the client sending/receiving messages?
- Check browser console for WS errors

### 4. Alarm exception at 1:20:27

Two `Alarm - Exception Thrown` entries appeared when the DO started. These are stale alarms from the previous (failed) follow-up firing on the newly reset DO. The alarm handler:
```typescript
async alarm(): Promise<void> {
  if (this.isGenerating) {
    this.state.storage.setAlarm(Date.now() + 30_000);
  }
}
```
This should be harmless (just checks `isGenerating` and reschedules if true). But if the exception is from `setAlarm()` failing during a DO reset, it might be interfering with subsequent alarm scheduling.

### 5. Did the follow-up's `handleFollowUp()` actually run?

The sandbox operations (unmount, mount, hydrate) happened. But we never saw `[gen] Starting agent-runner` or `[gen] R2 mounted, agent-runner started` logs from the NEW follow-up (the ones at 1:20:28 were from the FIRST failed attempt). Verify:
- Did `handleFollowUp()` reach `runGeneration()`?
- Did the fire-and-forget pattern work correctly?
- Or did an error in the handler prevent `runGeneration()` from starting?

### 6. Manual cleanup needed

The campaign is stuck at `generating`. Before next test:
```sql
-- Mark the stuck campaign as incomplete
UPDATE campaigns SET status = 'incomplete' WHERE id = 'campaign_mmboxf6vpr6ih4';
```
Or wait for a deploy to reset the DO (Gap 1 fix will catch it).

---

## Three Keep-Alive Mechanisms (verified working)

| System | Mechanism | Verified |
|--------|-----------|----------|
| **WebSocket** (browser ↔ DO) | Client ping/pong every 25s | Yes — ping/pong flowing |
| **Durable Object** (class instance) | Alarm heartbeat every 30s | Yes — alarms firing |
| **Sandbox Container** | `keepAlive: true` (SDK heartbeat) | Yes — generation completed successfully |

---

## Key Learnings

1. **`<img>` tags don't send auth headers.** Use `AuthImage` (or fetch with `authFetchBlob`) for any image behind authentication. This is a common gotcha with JWT-protected image endpoints.

2. **Deploy propagation has two phases.** Worker code updates fast, container image push takes ~2 min longer. Each phase can reset active DOs. Wait for full rollout before testing.

3. **Wrangler tail "Ok" doesn't mean HTTP 200.** It means the Worker completed without uncaught exceptions. A 401 response still shows "Ok" in tail.

4. **`campaign_images` table exists** (not `files`). Earlier confusion about "no such table: files" was from querying the wrong table name.

---

## Deploy Command
```bash
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd cloudflare && npx wrangler deploy
```
