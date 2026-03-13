# End-to-End Testing Session 5 — Plan

> Status: **Ready to execute**
> Branch: `new-ui`
> Deployed URL: https://creative-agent.alphasapien17.workers.dev
> Container: `standard-2` (1 vCPU, 6 GiB RAM)
> Prerequisite: Session 4 passed (full generation verified on standard-2)

---

## Objective

Test the 5 remaining untested flows on the deployed Cloudflare Worker:

| # | Test | Script | Duration | Dependencies |
|---|------|--------|----------|-------------|
| 1 | REST API | `test-e2e-rest-api.mjs` | ~5s | Existing campaign data in D1 |
| 2 | Image Serving | `test-e2e-images.mjs` | ~3s | Existing images in R2 |
| 3 | Cancel | `test-e2e-cancel.mjs` | ~60s | None (starts new generation) |
| 4 | Follow-Up / Resume | `test-e2e-follow-up.mjs` | ~5-7 min | Completed campaign with `sdk_session_id` |
| 5 | Reconnect / Subscribe | `test-e2e-reconnect.mjs` | ~6-8 min | None (starts new generation) |

Total estimated time: **~15-20 minutes** for all tests.

---

## Quick Start

### Run all tests (recommended)

```bash
cd /Users/chakra/Documents/Agents/creative_agent
node test-e2e-all.mjs
```

This executes tests in dependency order and prints a summary at the end.

### Run fast tests only (~10s)

```bash
node test-e2e-all.mjs --skip-long
```

Only runs REST API + Image Serving — no sandbox boot required.

### Run individual tests

```bash
# Fast tests (no sandbox boot)
node test-e2e-rest-api.mjs
node test-e2e-images.mjs

# Long-running tests (sandbox boot + generation)
node test-e2e-cancel.mjs
node test-e2e-follow-up.mjs
node test-e2e-reconnect.mjs

# The original full generation test (from Session 4)
node test-e2e.mjs
```

---

## Test Details

### Test 1: REST API (`test-e2e-rest-api.mjs`)

**What it tests:** All REST API endpoints against the deployed Worker using existing campaign data in D1.

**Checks (10 groups):**

| # | Endpoint | Assertions |
|---|----------|------------|
| 1 | `GET /health` | Status 200, `status: "ok"`, `d1.connected: true`, `r2.bound: true` |
| 2 | `GET /api/campaigns` | Status 200, `success: true`, campaigns is non-empty array |
| 3 | `GET /api/campaigns/:id` | Status 200, campaign object with correct id, files/images/messages arrays |
| 4 | `GET /api/campaigns/:id/files/research` | Status 200, file_type matches, non-empty content, is_ready: 1 |
| 5 | `GET /api/campaigns/:id/files/hooks` | Same as above for hooks |
| 6 | `GET /api/campaigns/:id/files/prompts` | Same as above for prompts |
| 7 | `GET /api/campaigns/:id/images` | Status 200, images array with file_path, hook_type, image_index |
| 8 | `GET /api/campaigns/:id/messages` | Status 200, has user + assistant messages with content |
| 9 | `GET /api/campaigns/:id/status` | Status 200, `status: "complete"`, `isAgentRunning: false` |
| 10 | `GET /api/campaigns/nonexistent` | Status 404, `success: false` |

**Test data:** Uses the most recent completed campaign from `GET /api/campaigns`. Can also pass a specific campaign ID: `node test-e2e-rest-api.mjs campaign_mm7qbx1iinmllh`

**Known good campaign:** `campaign_mm7qbx1iinmllh` (from Session 4, status: complete, 2 images, 3 files, 2 messages)

---

### Test 2: Image Serving (`test-e2e-images.mjs`)

**What it tests:** Worker serves generated images from R2 with correct headers.

**Flow:**
1. Fetches image metadata from `GET /api/campaigns/:id/images`
2. For each image, fetches `GET /images/{path}` from the Worker
3. Validates response headers and binary content

**Checks per image:**
- Status 200
- `Content-Type` starts with `image/`
- `Cache-Control` includes `immutable`
- Body size > 1KB (real image data, not error page)
- PNG magic bytes (`89 50 4E 47`) or JPEG magic bytes (`FF D8 FF`)

**Additional check:**
- `GET /images/nonexistent/fake.png` returns 404

**Known good image paths (from Session 4):**
- `/images/1772368513023_1_create_a_1_1_social_media_ad_image_in_anderson_cla.png`
- `/images/1772368513023_2_create_a_1_1_social_media_ad_image_in_anderson_cla.png`

---

### Test 3: Cancel Flow (`test-e2e-cancel.mjs`)

**What it tests:** Ability to abort a running generation mid-pipeline.

**Flow:**
```
[0s]     Connect WebSocket
[0s]     Send generate (6 ads — intentionally long to give time)
[0-40s]  Stream events (sandbox boot, SDK init, early phases)
[40s]    Send { type: "cancel" }
[40-50s] Expect cancel ack from DO
[50s]    Check campaign status via REST API
```

**Checks:**
1. Generation ack received (campaignId present)
2. Cancel ack received (`type: "ack"`, `message: "Cancel requested"`)
3. Campaign status in D1 is `"cancelled"` (verified via `GET /api/campaigns/:id`)

**What happens server-side (campaign-session.ts:259-273):**
- `abortController.abort()` signals the drain loop to stop
- `sandbox.destroy()` kills the container
- `isGenerating = false`
- The drain loop in `runGeneration()` detects `abortController.signal.aborted`, sets `wasCancelled = true`, breaks
- D1 update: campaign status → `"cancelled"`
- D1 insert: assistant message "Generation was cancelled."

**Risk areas:**
- If cancel arrives before sandbox exec starts, `sandbox.destroy()` may throw (sandbox is null) — but `handleCancel()` guards with `this.sandbox` check
- If cancel arrives after exec finishes but before drain loop completes — the abort signal is checked in the drain loop, so it should still cancel cleanly
- The cancel handler sends an ack via `sendWS()` (unbuffered), not `emitEvent()` — this is intentional since cancel acks don't need replay

**Timing note:** The 40s delay is tuned for standard-2 sandbox boot (~8s) + SDK init (~22s) = ~30s before first SDK messages. By 40s we should have at least a few SDK messages flowing, making cancel meaningful.

---

### Test 4: Follow-Up / Resume (`test-e2e-follow-up.mjs`)

**What it tests:** SDK session resume via JSONL persisted on R2.

**Flow:**
```
[0s]     Find a completed campaign with sdk_session_id
[0s]     Record message count before follow-up
[0s]     Connect WebSocket
[0s]     Send { type: "follow_up", prompt: "...", campaignId: "..." }
[0-?s]   Stream events (sandbox boot, SDK resume from JSONL, new generation)
[?]      COMPLETE event
[?]      Verify D1: status, new messages
```

**Follow-up prompt:** `"Make the headlines shorter and punchier. Use one-word power openers."`

This is a text-only follow-up — it asks the AI to modify existing hooks, not generate new images. This makes the test faster since it doesn't trigger fal.ai image generation.

**Checks:**
1. Follow-up ack received with correct campaignId and sessionId
2. Events stream in (SDK resumes successfully)
3. Generation completes (complete event)
4. Campaign status in D1 returns to `"complete"`
5. New user message persisted in D1 (content includes "headlines shorter")
6. New assistant message persisted in D1

**What happens server-side (campaign-session.ts:183-257):**
1. `handleFollowUp()` looks up campaign in D1, gets `sdk_session_id`
2. Clears event buffer (stale events from previous generation)
3. Persists user message to D1
4. Updates campaign status to `"generating"`
5. Calls `runGeneration()` with `sdkSessionId` param
6. In sandbox: `RESUME_SDK_SESSION_ID` env var is set
7. `agent-runner.ts` passes `resume: sdkSessionId` to SDK `query()`
8. SDK reads JSONL from `/mnt/r2/.claude/projects/{hash}/{sdkSessionId}.jsonl`
9. SDK has full conversation context, generates new response

**Risk areas:**
- If R2 FUSE mount fails to restore JSONL, SDK resume fails → agent-runner falls back to fresh session (loses context)
- If sandbox was destroyed (e.g., after cancel test), a new sandbox must boot — JSONL should still be on R2
- The `sdkSessionId` might be null if the previous generation didn't reach SDK init — test guards against this by selecting campaigns with `sdk_session_id`

**Test data:** Uses the most recent completed campaign with `sdk_session_id`. Can also pass a specific campaign ID: `node test-e2e-follow-up.mjs campaign_mm7qbx1iinmllh`

---

### Test 5: Reconnect / Subscribe (`test-e2e-reconnect.mjs`)

**What it tests:** WebSocket disconnection during active generation, reconnection with event replay.

**Flow:**
```
[0s]     WS#1 connects, sends generate
[0-45s]  WS#1 receives events, tracks lastEventId
[45s]    WS#1 closes (simulating browser disconnect)
[45-50s] Gap — generation continues in DO background, events buffered
[50s]    WS#2 connects
[50s]    WS#2 sends { type: "subscribe", sessionId, lastEventId }
[50s]    WS#2 receives replayed events (missed during gap)
[50-?s]  WS#2 receives new live events
[?]      COMPLETE event on WS#2
```

**Checks:**
1. WS#1 received events before disconnect
2. Had buffered events at disconnect (lastEventId > 0)
3. WS#2 received `subscribed` confirmation
4. WS#2 replayed missed events (count >= 0, depends on gap duration)
5. WS#2 received new events after reconnect
6. Generation completed on WS#2
7. No fatal errors

**What happens server-side:**

On WS#1 close (campaign-session.ts:101-108):
- `ws` ref is set to null
- Generation continues running (abort NOT triggered)
- Events continue being buffered via `emitEvent()` (sends fail silently, but buffering succeeds)

On WS#2 connect (campaign-session.ts:33-57):
- New WebSocket accepted, `ws` ref updated
- Initial ack sent (connection-level, not generation-level)

On subscribe (campaign-session.ts:275-304):
- `ws` ref updated to WS#2
- `eventBuffer.getEventsSince(lastEventId)` replays missed events
- `subscribed` event sent with replay count
- New events from ongoing generation now go to WS#2

**Risk areas:**
- If DO evicts between disconnect and reconnect (unlikely in <5s), all buffered events are lost
- If generation completes during the 5s gap, the complete event is buffered and replayed on subscribe
- The subscribe handler requires `eventBuffer.hasEvents()` — if buffer was cleared (shouldn't happen during active generation), subscribe returns error

**Timing notes:**
- 45s disconnect point: Chosen to be after sandbox boot + SDK init (~30s) but before completion (~300s)
- 5s reconnect delay: Short enough that DO won't evict, long enough to prove buffering works

---

## Existing Test Data in D1

From the deployed worker (26 campaigns as of Session 4):

| Field | Value |
|-------|-------|
| **Best campaign for tests** | `campaign_mm7qbx1iinmllh` |
| **Session ID** | `test-1772368309323` |
| **SDK Session ID** | `40b7fb91-c890-4596-a655-e32bf86ceedb` |
| **Status** | `complete` |
| **Image 1** | `/images/1772368513023_1_create_a_1_1_social_media_ad_image_in_anderson_cla.png` |
| **Image 2** | `/images/1772368513023_2_create_a_1_1_social_media_ad_image_in_anderson_cla.png` |
| **Files** | research (id:85), hooks (id:86), prompts (id:87) |
| **Messages** | 2 (1 user, 1 assistant) |

---

## Potential Issues and Mitigations

### Cancel test: "Already generating" error

If a previous test left a generation running (e.g., test-e2e.mjs was interrupted), the DO might reject the cancel test's generate with "A generation is already in progress." Since the DO is keyed per-user and we're using `anonymous`, all tests share one DO.

**Mitigation:** Run cancel test first among long tests, or wait for any active generation to complete. The cancel test sends cancel after 40s, which will clear the `isGenerating` flag.

### Follow-up test: Wrong campaign selected

The follow-up test auto-selects the most recent completed campaign. If the cancel test creates a cancelled campaign, it won't be selected (only `complete` campaigns are used).

**Mitigation:** The script filters for `status === 'complete' && sdk_session_id`. The cancel test's campaign will have status `cancelled`, so it's excluded.

### Reconnect test: Generation completes before disconnect

If the generation (2 ads) happens to complete in <45s (very unlikely on standard-2, which takes ~5 min), the reconnect test becomes meaningless.

**Mitigation:** The 45s timeout is well within the generation time. If this somehow happens, the test still passes — it just logs "unexpected completion before disconnect."

### Shared DO state between tests

All tests use the `anonymous` user, so they share one DO instance. Running tests sequentially (via `test-e2e-all.mjs`) avoids conflicts. Running in parallel would cause "already generating" errors.

**Mitigation:** Always run via `test-e2e-all.mjs` or run one test at a time.

---

## Expected Output (Ideal Run)

```
=== E2E Test Suite ===

Tests: REST API, Image Serving, Cancel, Follow-Up / Resume, Reconnect / Subscribe

============================================================
Running: REST API (test-e2e-rest-api.mjs)
============================================================

  PASS: Status 200
  PASS: status: ok
  ...
  (all 30+ checks pass in ~5s)

============================================================
Running: Image Serving (test-e2e-images.mjs)
============================================================

  PASS: Status 200
  PASS: Content-Type: image/png
  PASS: Cache-Control includes immutable
  PASS: Body size: 245.3 KB
  PASS: Valid image format: PNG
  ...
  (all checks pass in ~3s)

============================================================
Running: Cancel (test-e2e-cancel.mjs)
============================================================

  [0.2s]  Connected
  [0.3s]  Sending generate...
  [1.1s]  ACK — campaignId: campaign_xxx
  [1.3s]  PHASE -> parse
  ...
  [40.0s] >>> SENDING CANCEL <<<
  [40.3s] CANCEL ACK — Cancel requested

  PASS: Generation ack received
  PASS: Cancel ack received
  PASS: Campaign status in D1: "cancelled"
  (~50s)

============================================================
Running: Follow-Up / Resume (test-e2e-follow-up.mjs)
============================================================

  [0.3s]  Connected
  [0.3s]  Sending follow_up...
  [1.0s]  ACK — campaignId: campaign_mm7qbx1iinmllh
  ...
  [~300s] COMPLETE

  PASS: Follow-up ack received
  PASS: Generation completed
  PASS: D1 status: complete
  PASS: New messages saved: 2 -> 4
  (~5-7 min)

============================================================
Running: Reconnect / Subscribe (test-e2e-reconnect.mjs)
============================================================

  [0.2s]  WS#1 Connected
  ...
  [45.0s] >>> DISCONNECTING WS#1 <<<
  [50.0s] >>> RECONNECTING WS#2 <<<
  [50.3s] WS#2 SUBSCRIBED — Replayed 12 events
  ...
  [~310s] WS#2 COMPLETE

  PASS: WS#1 received events: 25
  PASS: WS#2 received subscribed confirmation
  PASS: WS#2 replayed events: 12
  PASS: WS#2 received new events: 85
  PASS: Generation completed on WS#2
  (~6-8 min)

============================================================
E2E TEST SUITE RESULTS
============================================================

  PASS  REST API              (4.8s)
  PASS  Image Serving         (2.3s)
  PASS  Cancel                (52.1s)
  PASS  Follow-Up / Resume    (341.2s)
  PASS  Reconnect / Subscribe (378.5s)

  Total: 5 passed, 0 failed out of 5

=== ALL TESTS PASSED ===
```

---

## After Testing: Cleanup

After all tests pass, consider:

1. **Remove debug diagnostics** from `campaign-session.ts` (API key checks, network tests — adds ~8s overhead per generation)
2. **Clean up test campaigns** from D1 (26 campaigns from sessions 1-4, plus new test campaigns)
3. **Update deployment architecture doc** with any findings
4. **Connect React client** to deployed Worker (Session 5 stretch goal or Session 6)

---

## File Inventory

| File | Purpose | Lines |
|------|---------|-------|
| `test-e2e.mjs` | Original full generation test (Session 4) | 115 |
| `test-e2e-cancel.mjs` | Cancel flow test | ~150 |
| `test-e2e-rest-api.mjs` | REST API endpoint tests | ~140 |
| `test-e2e-images.mjs` | Image serving from R2 tests | ~115 |
| `test-e2e-follow-up.mjs` | Follow-up/resume test | ~195 |
| `test-e2e-reconnect.mjs` | Reconnect/subscribe test | ~230 |
| `test-e2e-all.mjs` | Test runner (sequential) | ~70 |
| `docs/E2E_TESTING_SESSION_5_PLAN.md` | This document | — |
