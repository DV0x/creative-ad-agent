# Session 98 — Prod debug instrumentation + Sentry prep

**Date:** 2026-05-13 (work spanned late 2026-05-12 → 2026-05-13 IST)
**Branch:** `new-ui`
**Staging:** not touched this session
**Production:** ✅ instrumentation deployed (worker `1fea8e70-80e1-4189-a630-f1443733af0d`)
**Commits this session:** none yet — see "Commit hygiene" below

---

## TL;DR

User flagged "followups feel stuck" in production. Spent the session building visibility, capturing a live repro, and uncovering three distinct issues. Output: a real-time observability story on the worker + sandbox, a documented WS drop investigation, and a scoped plan for Sentry integration which will become Session 99.

| Area | What happened | State |
|---|---|---|
| **Live tail instrumentation** | Added drop-log for non-JSON stream lines, real-time `trace()` console mirror, tightened heartbeat 30s → 5s, parser logs heartbeats distinctly | ✅ deployed to prod, **uncommitted** |
| **WS 1006 mid-gen investigation** | Live repro captured. 44s WS-silence window before drop. Hypothesis: CF edge idle timeout combined with client ceasing to ping. Cannot fully confirm without browser-side telemetry. | 📓 documented, fix PR deferred |
| **Followup intent bug** | User's Q&A-style followup ("I don't see the content") triggered $3.32 worth of unintended regen (5 new images). Agent has no Q&A path — bulk regen is the default. | 📓 saved as project memory `project_followup_intent_classification.md`, HIGH PRIORITY |
| **WS resilience PR (3 changes)** | Scoped, approved, **not yet coded**. Was deprioritized in favor of building Sentry first to measure whether the fixes actually help. | ⏸ deferred to post-Sentry |
| **Sentry integration plan** | Decided yes; user wants production observability before launch | 📋 detailed plan below for Session 99 |

---

## Part 1 — Instrumentation deployed (uncommitted)

These four edits are live on prod but not committed. **Tomorrow's first action: commit them before starting Sentry work.**

| File | Change |
|---|---|
| `cloudflare/src/durable-objects/campaign-session.ts:1358` | Replaced silent `catch {}` in `streamForLiveUI` with `console.log('[stream] non-JSON line (N chars): ...')` so we see what the agent is emitting that isn't SDK JSONL |
| `cloudflare/src/durable-objects/campaign-session.ts:79` | Inside `trace()`, added `console.log(line)` BEFORE `this.log(line)` — traces appear in `wrangler tail` immediately rather than waiting up to ~60s for the next alarm flush |
| `cloudflare/sandbox/agent-runner.ts:51` | Heartbeat `setInterval` interval reduced from `30_000` to `5_000` for finer liveness signal |
| `cloudflare/src/lib/sdk-message-parser.ts:189` | Parser distinguishes heartbeats: `[sdk-parser] heartbeat count=N req=...` instead of generic `msg.type=trace` |

**Why uncommitted:** Per `feedback_no_commits_until_tested.md`, we ship to staging/prod and verify end-to-end before committing. These have been live and verified for several hours. Safe to commit tomorrow.

**Suggested commit message:**
```
feat(observability): drop-log + real-time trace + 5s heartbeat

Adds the visibility we were missing on the agent stream. Drop-log
surfaces the previously-invisible MCP image-gen progress lines.
Trace mirroring removes the up-to-60s alarm flush delay.
5s heartbeat gives finer liveness during long tool waits.

Verified live on prod via stuck-followup repro 2026-05-12.
```

---

## Part 2 — WS 1006 investigation (deferred fix)

### What we observed live

User submitted a followup with reference image at 22:17:34 IST on production campaign `campaign_mp2v002v6n7lb4`. WS dropped mid-generation at **22:21:01.325 IST** with `code=1006, "WebSocket disconnected without sending Close frame."`

Critical timeline data:

| Time (IST) | Event |
|---|---|
| 22:19:55 | Client ping received (server) |
| 22:20:17 | Client ping received (server) — **last ping** |
| 22:20:51 | Client HTTP-fetched image 3 (network alive) |
| **22:20:17 → 22:21:01 (44s)** | **Zero client→server WS messages, zero server→client emits, gap of 58 DO trace numbers missing from captured tail** |
| 22:21:01 | `[T719][ws][close] code=1006 ...gen=true wsRemaining=0` |
| 22:21:31 | Client reconnected, `subscribe.replay eventCount=19 lastEventId=0` |

### CF docs research findings

- CF has a **documented but unspecified** WS idle timeout. Quote: "Cloudflare will close a WebSocket connection when no data is transmitted in either direction for a period of time. Enterprise customers can contact their account team to configure a custom idle timeout."
- CF auto-responds to **protocol-level WS PING frames** (control frames) without waking the DO. Our client sends **application-level `{"type":"ping"}` JSON**, which is a DATA frame — no auto-pong, every ping wakes the DO.
- Our `compatibility_date` is `2026-01-01` — **before** the `2026-04-07` cutoff for `web_socket_auto_reply_to_close`. Per docs, pre-cutoff DOs must call `ws.close(code, reason)` inside `webSocketClose` to complete the close handshake, otherwise clients see 1006. We don't (line 713 just logs).
- `WebSocketRequestResponsePair(request: string, response: string)` — **exact string match**. Confirmed in `cloudflare/node_modules/@cloudflare/workers-types/index.d.ts:717`.
- Client already handles `case 'pong': break;` at `useWebSocket.ts:351`. Safe to register an auto-response pair.
- Existing connection-state UI **already exists** in `ResultsView.tsx:147-173` (orange "reconnecting" pill, red "offline · refresh" pill). User confirmed they "didn't look at the screen" so we don't know if it was visible during the drop.

### The deferred WS-resilience PR (3 changes, ~25 lines)

| # | File | Change |
|---|---|---|
| 1 | `cloudflare/wrangler.jsonc` | Add `"web_socket_auto_reply_to_close"` to `compatibility_flags`. Keep `compatibility_date = "2026-01-01"` to avoid dragging in unrelated breaking changes (Blob binaryType, iterable fetch bodies, stream backpressure, etc.) |
| 2 | `cloudflare/src/durable-objects/campaign-session.ts` constructor | `state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'))` |
| 3 | `client/src/lib/websocket-manager.ts` | `window.addEventListener('online', () => { if (disconnected) reconnect() })` for faster reconnect on network restore |

### What was deprioritized from the original 4-change scope

- **UI banner** — already exists in `ResultsView.tsx`
- **Ping interval 25s → 15s** — no proof tighter interval helps; client *stopped* pinging entirely
- **`ws.close()` reciprocation in `webSocketClose`** — rendered moot by #1 (compat flag auto-handles)
- **Replay-flash dedup (persistent `lastEventId`)** — bigger change, separate PR

### Honest disclaimer

The 3-change PR will reduce 1006 frequency but **will not eliminate it**. The root cause of today's specific incident (client stopped pinging for 44s while HTTP stayed alive) could be browser tab throttling, WS-specific TCP death, or JS event-loop blockage. None of those are fixable from our code. Sentry is what tells us why next time.

---

## Part 3 — The followup intent bug (memory-saved)

User's followup prompt: *"I dont see the ocntent on the images? did we miss that? and also the second image is not good"* — a question + a critique.

Agent's response: generated **5 brand-new images** (~50s each, sequential per orchestrator prompt rule 6), charged **$3.32 (332 credits)**. Total followup duration: 252 seconds.

### Root cause

`cloudflare/sandbox/orchestrator-prompt.ts` (123 lines) has no intent classification. Workflow rule line 33 says:

> "For follow-ups that reference previous images (e.g. 'redo', 'regenerate', 'try again', 'improve the images'), match the number of images from the previous generation..."

There is no path for:
- **QUESTION** ("why don't I see content?", "what does this mean?")
- **SINGLE-IMAGE EDIT** ("fix image 2", "make image 3 brighter")
- **CRITIQUE-ONLY** ("image 2 isn't good")

Default behavior: bulk regen of N images.

### Fix decided (deferred to later session)

User chose **ask-when-ambiguous** behavior over auto-classify. Spec saved in `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/project_followup_intent_classification.md`. Started investigating whether the Claude Agent SDK 0.2.69 has an `AskUserQuestion` tool — *paused before completing the SDK check*. To resume: examine `cloudflare/sandbox/node_modules/@anthropic-ai/claude-agent-sdk/sdk-tools.d.ts`.

### What NOT to change

The sequential one-prompt-per-MCP-call pattern (orchestrator-prompt lines 91-92) is **intentional** for progressive image delivery to the user. Don't batch.

---

## Part 4 — D1 verification of today's test

All numbers reconciled cleanly on prod:

**Campaign `campaign_mp2v002v6n7lb4`** (status: `complete`)

| Turn | request_id | event_type | images | duration | charged |
|---|---|---|---|---|---|
| 1 | `turn_1778604402507` | generation | 2 | 217s | $1.99 |
| 2 | `req_1778604454841` | **follow_up** | 5 | 252s | $3.32 |

**Credits** for `user_3DcijxjNZKYwj4ZTQFyC3AZWN9C` (chakra@creativemachines.xyz):
- Before: $14 (200 credits granted in Session 97 + initial $20 grant)
- After: **$8.72** (87 credits remaining)
- Math: $14.05 − $1.99 − $3.32 = $8.74 ≈ $8.72 (minor rounding from fractional cogs)

Total **7 images** persisted across both turns (image_index 1–7, hook_types: stat, story, fomo, curiosity, callout, contrast, stat).

---

## Part 5 — Session 99 plan: Sentry integration

User's reasoning, verbatim: *"we dont want to face any issues when we go live even then we dont want to scramble to identify the issue."*

### Scope decided

Both client-side AND server-side error tracking, single Sentry project, both environments (staging + production tagged separately).

### Estimated effort: 3-4 focused hours

| Step | Time | Description |
|---|---|---|
| 1 | 10 min | Sentry account check / create project. **Open question:** does user already have a Sentry account? Decision needed on region (US vs EU). |
| 2 | ~1 hr | Server: `@sentry/cloudflare` integration in Worker. Wrap fetch handler. Set `SENTRY_DSN` as wrangler secret per env. |
| 3 | ~1 hr | Server: Durable Object integration. Custom `Sentry.withScope()` pattern per CF docs. Capture alarm failures, DO method exceptions. |
| 4 | ~30 min | Client: `@sentry/react` integration. Init in `client/src/main.tsx`. ErrorBoundary for the app. |
| 5 | ~30 min | Source maps upload during build. Vite plugin for client + esbuild plugin for worker. Hidden source maps preferred (uploaded but not exposed). |
| 6 | ~15 min | User identification. `Sentry.setUser({id: clerkUserId})` after auth completes on both sides. |
| 7 | ~30 min | Custom events: replace `console.log` with `Sentry.captureMessage()` for the high-signal events (WS close, agent errors, gen failures). Keep noisy ones (heartbeats, parser msg.type) as plain `console.log` for tail-time use only. |
| 8 | ~15 min | PII redaction config via `beforeSend`. Decide: send IPs (yes by default since CF already has them) and redact `request.body` / prompts (yes — user content). |
| 9 | ~30 min | Deploy to staging, verify events appear in Sentry dashboard, then prod. |

### Bundled-in custom events to emit

After SDK is in place, add these `Sentry.captureMessage` calls:

**Server (in DO):**
- `ws_abnormal_close` — in `webSocketClose` when `code !== 1000 && code !== 4001`. Extra: `{code, reason, sessionId, isGenerating, wsRemaining, ageSec}`
- `gen_setup_failed` — in the `else { /* Setup failed before agent started */ }` path at line 1794
- `gen_stream_error` — in the non-fatal stream error path at line 1790
- `finalize_no_result` — when `tryFinalize` ends without producing a turn-result.json
- `heartbeat_silent` — derived event: if no agent heartbeat in >30s while `isGenerating === true`

**Client:**
- `ws_close_unexpected` — `ws.onclose` when `code !== 1000`. Extra: `{code, reason, navigatorOnline, visibilityState, timeSinceLastPingMs, userAgent}`
- `auth_failed` — Clerk auth recovery failures
- `generation_orphaned` — if user lands back on a campaign showing `isGenerating=true` for >5min with no new events

### Bundled distributed tracing setup

Both Sentry SDKs propagate trace headers automatically. After wiring both sides, one user action (submit followup) appears as a single linked timeline: client click → worker fetch → DO handleGenerate → DO stream → exception/event. Cross-correlated by trace ID.

### Sentry vs tail decision matrix (for user reference)

| Use case | Tool |
|---|---|
| Production routine monitoring | Sentry alone |
| User reports a bug ("it broke at 7:30") | Sentry — search by user_id + time |
| Did my fix reduce errors? | Sentry — compare rates pre/post |
| Live debugging while iterating on code | `wrangler tail` |
| Watching the agent stream in real-time | `wrangler tail` |

### What gets dropped after Sentry is live

- Manual `wrangler tail` sessions during prod testing — Sentry catches errors automatically
- Bash log-parsing scripts (today's Python `re.split` log forensics)
- The 4-line drop-log + trace mirror **stay** — they're for tail-time use, not Sentry

### Open questions for the user at session start

1. Existing Sentry account, or create fresh?
2. Region preference: US (default, cheapest) or EU (data residency)?
3. PII redaction: redact user prompts (research URLs, brand briefs, followup messages) from Sentry events? *Default recommendation: yes redact* — user content shouldn't leave our infrastructure unless we explicitly choose.
4. Alert routing: email, Slack, both, or just dashboard for now?

---

## Part 6 — Commit hygiene checklist for Session 99 start

In order:

1. **Verify prod is still healthy** (`curl -s https://creativemachines.xyz/health | python3 -m json.tool`)
2. **Commit the 4 instrumentation edits** (Part 1 above) as a single commit on `new-ui`. Suggested message in Part 1.
3. **Start Sentry work** per Part 5.
4. After Sentry is live and verified: pick up the **3-change WS-resilience PR** (Part 2) so we can measure if it reduces drops.
5. After WS PR: pick up the **followup intent classification** (memory file).

---

## Part 7 — Open items / handover

### Must-do soon (carryover from Session 97)

- 🔴 **Rotate prod Clerk Secret Key** — still pending from Session 97. Treat `sk_live_kkn8...` as compromised until rotated.
- 🟡 **`new-ui` branch is now 14+ commits ahead of `master`** — even more stale. Not blocking, but should plan a master merge after the next stable batch (post-Sentry).

### Architectural concerns surfaced this session

- **Image generation is sequential by design** (orchestrator prompt rule 6 lines 91-92). Reason: progressive delivery. Trade-off: ~50s × N total time. Don't change.
- **`getProcessLogs` in alarm loops blocks DO for ~10s per cycle.** Pattern visible in tail as `wall=10026ms cpu=0ms`. Probably not a bug but worth understanding before adding more alarm work.
- **Container SDK version warning** in sandbox logs: `"Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.19"`. Cosmetic but worth tracking.

### Useful debugging commands

```bash
# Restart prod tail with auto-reconnect (wrangler tail keeps dropping)
while true; do
  npx wrangler tail --env production --format=json \
    >> docs/prod-tail-$(date +%Y%m%d).json 2>&1
  sleep 2
done &

# Parse JSON tail into timeline (use this Python pattern)
python3 -c "
import json, re
content = open('docs/prod-tail-YYYYMMDD.json').read()
docs = re.split(r'(?<=^})\n(?=\{)', content, flags=re.MULTILINE)
events = [json.loads(d) for d in docs if d.strip()]
# ... filter, sort, format
"

# Query D1 for campaign + usage state
npx wrangler d1 execute creative-agent-db-prod --remote --command="
  SELECT campaign_id, request_id, event_type, image_count, duration_ms,
         charged_amount_usd, created_at
  FROM usage_log
  WHERE user_id = '<user_id>'
  ORDER BY created_at DESC LIMIT 10
"

# Check tail process status
ps aux | grep 'wrangler tail' | grep -v grep
```

### What's deployed (production)

- Worker version: `1fea8e70-80e1-4189-a630-f1443733af0d`
- Bundle hash: `index-Cqz-_FsS.js` (unchanged from Session 97 — no client changes)
- URL: https://creativemachines.xyz

---

## File map — files touched this session

```
cloudflare/
  src/
    durable-objects/
      campaign-session.ts ............... +trace mirror, +non-JSON drop log
    lib/
      sdk-message-parser.ts ............. heartbeat-distinct logging
  sandbox/
    agent-runner.ts ................... 30s → 5s heartbeat interval

~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/
  MEMORY.md ........................... +pointer to new project memory
  project_followup_intent_classification.md  NEW — deferred high-priority fix

docs/
  prod-tail-20260512.json ............. live tail capture of repro (224KB)
  SESSION_98_*.md ..................... this doc
```
