# Session 101 — PR 1 shipped to prod + WS 1006 diagnosis + observability bump

**Date:** 2026-05-13 (same calendar day as S100; second session of the day)
**Branch:** `new-ui` (now **133 commits ahead** of master)
**Commit:** `84d3c84 feat(images): targetImageIndices + per-slot versioning + freeform hook taxonomy + billing fix`
**Staging:** ✅ deployed `7c5aee0b-9f7d-4e79-af2b-dfd74ada99c4` (sandbox image `:7c5aee0b`)
**Production:** ✅ deployed `c7fb1a6a-ad3c-4bb0-b6a9-21170be21fe5` (sandbox image `:c7fb1a6a`)
**Sentry release tag (both):** `84d3c8430420b0799df4535f619a2968d6681505` — matches commit SHA
**Pushed:** `origin/new-ui` at `84d3c84`

---

## TL;DR

PR 1 (the image-versioning + hook-taxonomy + billing fix from Session 100) is now **live and verified on production**. All 4 bugs + the latent billing bug confirmed fixed end-to-end. Cleanup of the original test-campaign mess on prod is done.

While testing, **a separate bug** surfaced: the research card didn't render live during the first staging test. Investigation traced this to **WebSocket 1006 disconnects** mid-flight (already a known/deferred issue from Session 98). The eventBuffer + subscribe-replay safety net rescued most events, but research timing made it visible. **An earlier hypothesis about a `_pendingFiles` race condition was disproven** by client-side instrumentation.

Six observability log lines were added across the agent-runner → parser → DO → client → store chain so the next investigation doesn't have to infer from missing wrangler-tail data.

---

## State Table

| Area | What | State |
|---|---|---|
| PR 1 staging deploy | worker `7c5aee0b`, sandbox image `:7c5aee0b` | ✅ |
| PR 1 staging migration | hook_type CHECK dropped, 192 rows preserved (done in S100) | ✅ |
| 3-scenario staging verify (fresh / single edit / multi-slot edit) | All passed cleanly | ✅ |
| Commit `84d3c84` | 21 files, +469/-157 | ✅ |
| Prod D1 migration | 32 rows preserved, 9 campaigns | ✅ |
| Prod code deploy | worker `c7fb1a6a` | ✅ |
| Prod smoke test (`campaign_mp40awylzb2gch`) | 2 rows, real hooks, no dupes, billing OK | ✅ |
| Cleanup of test campaign `campaign_mp3q9e5n9d2f81` | 5 ghost/wrong-slot rows deleted | ✅ |
| Push to `origin/new-ui` | done | ✅ |
| WS 1006 disconnects investigation | diagnosed but NOT fixed | ⏳ |
| 6 observability log lines | added to PR 1 commit | ✅ |

---

## Part 1 — PR 1 verification on staging

Three scenarios run on staging worker `7c5aee0b`:

### Scenario 1 — fresh "create 2 ads"
- Campaign `campaign_mp3xtqhtjb3kft` (thewholetruthfoods, with 2 reference images attached)
- D1: 2 rows, image_index 1/2, both v1, both non-NULL prompts
- Hook types: `stat` + `contrast` (canonical, not silent fallback)
- **Aspect-ratio bug spotted:** one image came back 9:16 instead of 4:5 (agent's own choice, ref was square). Logged for follow-up — not PR 1 scope.

### Scenario 2 — single-image edit
- Followup: `[Image 2] this image is not 4:5 and also doesn't have content rendered.`
- D1 post-followup: 3 rows — `1/v1`, `2/v1`, **`2/v2`** ✅
- Slot 2 v2 inherited `contrast` from v1 (correct hook inheritance)
- usage_log: turn 1 image_count=2 ($2.21), turn 2 image_count=1 ($0.79) ✅
- messages: 4 rows, perfect user/assistant alternation, no duplicates ✅

### Scenario 3 — multi-slot edit (natural language, no `[Image N]` mention)
- Different campaign `campaign_mp3zdim0g07tlu` (optimumnutrition.co.in)
- Followup: `ok can you edit both images and make them stunning? right now i dont see the content in the first image.`
- D1 post-followup: 4 rows — `1/v1`, `1/v2`, `2/v1`, `2/v2` ✅
- **Agent correctly inferred `targetImageIndices: [1, 2]` from "both images"** — stronger pass than the canonical `[Image 1] [Image 2]` syntax in the test plan
- Both v2 rows inherited hook_type from v1 (`aspiration`, `social-proof`)
- usage_log: turn 1 image_count=2, turn 2 image_count=2 ✅
- messages: 4 rows, no duplicates ✅

---

## Part 2 — Prod deploy + smoke test

### Migration
```bash
npx wrangler d1 execute creative-agent-db-prod --remote --file=cloudflare/migrations/drop_hook_type_check.sql
```
- Pre-migration: 32 rows, 9 campaigns
- Post-migration: 32 rows, schema has no CHECK constraint ✅
- 6.17ms execution, served from APAC/SIN

### Code deploy
```bash
cd client && npm run build:production && \
docker logout registry.cloudflare.com && \
docker builder prune -af && \
cd ../cloudflare && npm run deploy:production
```
- Worker version `c7fb1a6a-ad3c-4bb0-b6a9-21170be21fe5`
- Health check OK, D1 connected, R2 bound

### Smoke test
- Campaign `campaign_mp40awylzb2gch` (thewholetruthfoods)
- D1: 2 rows, slots 1/2, hooks `curiosity` + `contrast`, both non-NULL prompts ✅
- usage_log: image_count=2, $2.04 charged ✅
- messages: 1 user + 1 assistant ✅

### Cleanup
```sql
DELETE FROM campaign_images WHERE campaign_id='campaign_mp3q9e5n9d2f81' AND id IN (36,37,38,39,40);
```
- 5 rows removed (ids 34, 35 preserved as the 2 "real" ads)
- Prod totals: 29 rows across 10 campaigns

---

## Part 3 — WS 1006 disconnect diagnosis (the new finding)

### Symptom

First staging test (campaign `campaign_mp3xtqhtjb3kft`): **research card never rendered in the UI during the run.** Only appeared after a workspace refresh. D1 had the research content fine — it was a live-render issue, not a persistence issue.

### Earlier hypothesis (DISPROVEN)

Initial guess was a race in `client/src/store/index.ts:434` (`updateCampaignFile`): if a `file` event arrives before the campaign is in `state.campaigns` under the server's ID (because `replaceCampaignId` hadn't completed yet), the content buffers into `_pendingFiles` and never flushes until the next `setCampaigns` call (i.e., page refresh).

This was almost shipped as a "safety-net flush" patch to `replaceCampaignId`. Killed before commit because:
- Real ack timing: ~100ms after WS message receipt
- Research file event timing: ~30-60s into the run
- 30,000ms gap makes the race effectively impossible in practice

### Actual root cause (CONFIRMED via client-side instrumentation)

The 6 observability log lines added in this session captured the live `[ws-rx][file]` events on a second staging test. **Every `[store][updateCampaignFile]` showed `exists: true` and `messageIdSet: true`.** The `_pendingFiles` BUFFERING branch never fired. So the race hypothesis was wrong.

What the client console actually showed for the working staging test (`campaign_mp3zdim0g07tlu`):

```
WebSocket: Connected
[WS-MGR] onclose: code=1006, reason="", wasClean=false       ← 1st disconnect
WebSocket: Reconnecting (attempt 1/5)
WebSocket: Connected
[ws-rx][file] research → [store] exists:true                  ← live delivery
[ws-rx][file] hooks    → [store] exists:true
[WS-MGR] onclose: code=1006, reason="", wasClean=false       ← 2nd disconnect
WebSocket: Reconnecting (attempt 1/5)
WebSocket: Re-subscribing to session ...
[ws-rx][file] research (DUPLICATE from replay)
[ws-rx][file] hooks    (DUPLICATE from replay)
[ws-rx][file] prompts  → [store] exists:true                  ← was buffered during 2nd disconnect, replayed
[WS-MGR] onclose: code=1006, reason="", wasClean=false       ← 3rd disconnect
WebSocket: Reconnecting
WebSocket: Connected
```

**Three WS 1006 disconnects in one ~2-minute run.** The DO `eventBuffer` + client `subscribe + lastEventId` replay path rescued every file event, but with timing flakiness — sometimes live, sometimes via replay, sometimes both (duplicates).

### Why the first staging test failed where the second succeeded

Best inference (cannot prove without the original test's console logs):

In the first test, a 1006 disconnect happened during a window where the client's `currentGeneratingMessageId` had transiently nulled out (e.g., right after `completeGeneration` for an earlier turn), so when replay arrived, the `if (campaignId && messageId)` gate at `useWebSocket.ts:235` dropped the file event silently. After refresh, the API re-hydrate from D1 surfaced the content.

This is unconfirmed. The 6 observability logs in PR 1 will catch the next occurrence cleanly.

### What this means for PR 1

PR 1 is **not** the WS 1006 fix. PR 1 fixes structural data integrity bugs (versioning, hook taxonomy, billing). The streaming reliability bug is **a separate problem** that's been deferred since Session 98.

---

## Part 4 — 6 observability log lines added

All 6 ship as part of commit `84d3c84`. Cheap permanent breadcrumbs — they only fire on specific events, not noisy.

| # | File:line | What fires | Used for |
|---|---|---|---|
| 1 | `cloudflare/sandbox/agent-runner.ts:395` | `trace('subagent_tool_synth', { name, filePath })` | Confirms subagent (research) tool_use_event synthesis path executed |
| 2 | `cloudflare/src/lib/sdk-message-parser.ts:118` | `[parser][emit][file] type=X path=... contentLen=N` | Confirms parser detected Write to research/hooks/prompts |
| 3 | `cloudflare/src/durable-objects/campaign-session.ts:2138` | Enriched emit trace — `[emit][file fileType=research ...]` includes tool, imageIndex, phase | Maps eventId to actual event payload |
| 4 | `client/src/hooks/useWebSocket.ts:235` | `[ws-rx][file] {campaignId, fileType, messageIdSet, contentLen}` | Confirms client received WS file event + state of gate |
| 5 | `client/src/store/index.ts:436` | `[store][updateCampaignFile] {campaignId, fileType, exists, knownIds}` | Confirms campaign lookup succeeded |
| 6 | `client/src/store/index.ts:437` | `[store][updateCampaignFile] BUFFERING into _pendingFiles` | Fires only if the race I hypothesized actually triggers (it didn't, in our tests) |

### Important note about wrangler tail reliability

During this session, wrangler tail dropped large swathes of log lines under load. EventIds 11-14, 21-28, 31-33 of one staging run were invisible in the tail despite the server obviously emitting them (D1 had the content). **Don't rely on wrangler tail alone** for happy-path verification — use D1 + browser console as primary sources of truth, with the tail as a complementary signal.

---

## Part 5 — Open punch list for next session (prioritized)

### 🔴 P0 — blocking / high impact

#### 1. WS 1006 disconnects mid-flight
- **What:** WebSocket connection drops repeatedly during normal generation. Observed 3× in one 2-minute staging run.
- **Symptom:** Research card occasionally fails to render live (user must refresh to see it). Replay safety net mostly catches it, but timing matters.
- **Root cause hypothesis:** Cloudflare WS proxy timeout, or DO not responding to keepalives fast enough during heavy SDK message bursts.
- **Suggested fix:** The 3-change PR already drafted in Session 98:
  1. `WebSocketRequestResponsePair` compat flag for hibernatable WS
  2. Browser `online` event listener to force-reconnect on network restore
  3. Better reconnect handling — preserve `messageId` across reconnects so the file-event gate at `useWebSocket.ts:235` doesn't drop replayed events
- **Files:** `cloudflare/src/durable-objects/campaign-session.ts`, `client/src/lib/websocket-manager.ts`, `client/src/hooks/useWebSocket.ts`
- **Next debug evidence:** Look for `BUFFERING` in browser console or a `messageIdSet: false` line on a replay — that pinpoints which gate dropped a real file event.

#### 2. Followup intent classification (HIGH PRIORITY, deferred since S99)
- **What:** Orchestrator runs the full research → hooks → art → images pipeline on every followup, even when the user is asking a question ("what hook is image 2?") or doing a single-image edit.
- **Cost impact:** Every Q&A follow-up costs ~$2 instead of ~$0.05.
- **UX impact:** 30-60s wait for what should be a <5s answer.
- **Where:** `cloudflare/sandbox/orchestrator-prompt.ts` — needs a classification step at the top: question / single-edit / multi-edit / full-regen / out-of-scope. Branches:
  - Q&A → text answer only, no tools
  - Single/multi edit → skip research/hooks/art, jump to image generation with `targetImageIndices`
  - Full regen → current flow
- **Note:** PR 1 partially helped (followups with `[Image N]` mention now correctly do single-image edits instead of allocating new slots). The broader classification gap remains.

#### 3. Aspect-ratio drift
- **What:** Agent generated 9:16 instead of 4:5 on first staging test today (reference was square, so it wasn't ref-mirroring).
- **Reproduce:** Often when the agent is given a square ref + brief that mentions "lifestyle" / "Instagram story".
- **Where:** `cloudflare/sandbox/orchestrator-prompt.ts` — strengthen the 4:5 reminder, or validate aspect_ratio in `nano-banana-mcp.ts` and reject non-4:5 unless explicitly requested.

### 🟡 P1 — real but not blocking

#### 4. `new-ui` branch 133 commits ahead of master
- **What:** Long-lived feature branch. Master is essentially abandoned now.
- **Suggested:** Either (a) fast-forward master to `new-ui` and continue from there, or (b) keep deploying from `new-ui` and rename later. Decision needed; not urgent.

#### 5. Rotate prod Clerk Secret Key
- **What:** Session 97 finding. Key has been live a while.
- **Where:** Clerk dashboard → prod app → rotate secret → update `wrangler secret put CLERK_SECRET_KEY --env production` → redeploy.

#### 6. Multi-reference selective replace plan — Phase 1.1
- **What:** Paused at staging schema migration. Doc: `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md`.

#### 7. PR 2 — undo/redo per image versioning UI
- **What:** Now that PR 1 produces v2/v3 rows reliably (verified today), add `imageVersionHistory` parallel store + arrow buttons on `ImageCard.tsx`. ~85 lines, 6 files.
- **Audit done in:** Session 100 doc.
- **Gate:** Don't ship until prod shows several v2+ rows across real user campaigns over the next ~week.

#### 8. Prod `generation_orphaned` Sentry issue
- **What:** A user's campaign got stuck with `isGenerating=true` past the 5-min threshold. Sentry caught it: `https://creative-machines.sentry.io/issues/7477854937/`.
- **Investigate:** Pull the campaign ID from Sentry extras → check D1 status → see if it was a real orphan (DO crashed) or a client misperception (DO finished but WS dropped before the `complete` event landed).

### 🟢 P2 — polish / housekeeping

#### 9. Audit the 6 observability log lines after a week
- **What:** Decide which to keep permanently vs. demote to debug-only.
- **Criteria:** Has the log helped diagnose a real issue in the next 7 days? If no for any line → remove.

#### 10. Background tail loops still running
- **What:** Two `wrangler tail` shell loops from this session — staging (`bp5i7v4zx`) and prod (`bq6eciceo`). They write to `docs/{staging,prod}-tail-*.json` indefinitely.
- **Risk:** Disk fills over time if left unattended.
- **Action:** Kill them at session start of next session. If we want persistent tails, set up a proper rotation (e.g., logrotate or a `find ... -mtime +1 -delete` cron).

---

## Part 6 — Useful commands / references

```bash
# Kill the background tails from this session
pkill -f "wrangler tail --env staging"
pkill -f "wrangler tail --env production"

# Restart prod tail if needed
TS=$(date +%Y%m%d-%H%M%S); npx wrangler tail --env production --format json > "docs/prod-tail-${TS}.json" 2>&1 &

# Verify PR 1 fixes still healthy on prod
npx wrangler d1 execute creative-agent-db-prod --remote --command="
SELECT campaign_id, COUNT(*) AS rows, MAX(version) AS max_v
FROM campaign_images
WHERE created_at > datetime('now', '-1 day')
GROUP BY campaign_id
ORDER BY rows DESC;"

# Check for any rows with NULL prompts (regression of Bug 1)
npx wrangler d1 execute creative-agent-db-prod --remote --command="
SELECT COUNT(*) FROM campaign_images WHERE prompt IS NULL;"

# Check for duplicate assistant messages (regression of Bug 4)
npx wrangler d1 execute creative-agent-db-prod --remote --command="
SELECT campaign_id, COUNT(*) AS n
FROM messages WHERE role='assistant'
GROUP BY campaign_id HAVING n > (SELECT COUNT(*) FROM messages WHERE role='user' AND campaign_id=messages.campaign_id);"

# Sentry filters
open 'https://creative-machines.sentry.io/issues/?environment=production'
open 'https://creative-machines.sentry.io/issues/?environment=staging'
```

### Test campaign IDs (for forensic queries if needed)

| Campaign | Env | What it shows |
|---|---|---|
| `campaign_mp3q9e5n9d2f81` | prod | Original "2 ads → 4 rows" bug that started everything. Cleaned up this session. |
| `campaign_mp3xtqhtjb3kft` | staging | First PR 1 verify run. Aspect-ratio bug + research-render gap surfaced here. |
| `campaign_mp3zdim0g07tlu` | staging | Second verify run + multi-edit scenario. WS 1006 evidence captured here. |
| `campaign_mp40awylzb2gch` | prod | Prod smoke test post-deploy. Clean 2-row pass. |

---

## Part 7 — Files touched this session

```
cloudflare/migrations/drop_hook_type_check.sql        NEW (committed in PR 1)
cloudflare/schema.sql                                 CHECK removed
cloudflare/sandbox/agent-runner.ts                    +1 log (subagent_tool_synth)
cloudflare/sandbox/nano-banana-mcp.ts                 PR 1 (targetImageIndices, hookTypes)
cloudflare/sandbox/orchestrator-prompt.ts             PR 1 (rule 6, 7, examples)
cloudflare/src/db/images.ts                           PR 1 (HookType=string, getImageRowCount)
cloudflare/src/db/index.ts                            PR 1 (exports)
cloudflare/src/durable-objects/campaign-session.ts    PR 1 (finalize, billing split, idempotency) + 1 enriched log
cloudflare/src/lib/local-ai-runner.ts                 PR 1 (HookType=string)
cloudflare/src/lib/sdk-message-parser.ts              PR 1 (targetImageIndex routing) + 1 log
cloudflare/src/lib/types.ts                           PR 1 (HookType=string)
server/lib/database.ts                                Mirror schema change
server/lib/db/images.ts                               PR 1 mirror
server/lib/db/index.ts                                PR 1 mirror
server/lib/nano-banana-mcp.ts                         PR 1 mirror
server/lib/websocket-handler.ts                       PR 1 mirror
client/src/components/mentions/AssetMention.tsx       PR 1 (getHookLabel)
client/src/hooks/useWebSocket.ts                      PR 1 (version) + 1 log
client/src/store/index.ts                             +2 logs (updateCampaignFile + BUFFERING)
client/src/types/chat.ts                              PR 1 (HookType=string, helper)
client/src/types/websocket.ts                         PR 1 (version)

docs/SESSION_101_PR1_PROD_DEPLOY_AND_WS_1006_DIAGNOSIS_2026-05-13.md  NEW (this doc, untracked)
```

---

## Decisions explicitly NOT taken this session (so we don't relitigate)

- ❌ **Don't ship the `_pendingFiles` flush fix to `replaceCampaignId`** — speculative; client-side instrumentation proved the race doesn't trigger.
- ❌ **Don't conflate WS 1006 fix with PR 1** — separate scope; ship structural data fixes first, streaming reliability as its own PR.
- ❌ **Don't commit `docs/scratchpad.md`, `server/package-lock.json`, or untracked session docs** — matches the standing pattern on `new-ui`.
- ❌ **Don't push PR 2 (undo/redo UI) yet** — wait until prod shows actual v2+ rows from real users.

---

## Next session opener

> Last session shipped PR 1 to prod (commit `84d3c84`, prod worker `c7fb1a6a`). All 4 image-versioning bugs + billing fix verified working end-to-end. New WS 1006 disconnect issue diagnosed but not fixed — that's the highest-priority work for this session. See `docs/SESSION_101_PR1_PROD_DEPLOY_AND_WS_1006_DIAGNOSIS_2026-05-13.md` for the full punch list.
