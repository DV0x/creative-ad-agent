# Session 102 — Observability Phases 1-4 shipped to prod

**Date:** 2026-05-14 (started 2026-05-13 evening IST; spans midnight)
**Branch:** `new-ui` (now 135 commits ahead of master)
**Commits this session:** 2
- `f1fa6ae feat(observability): breadcrumbs + WS investigation captures` (Phase 1)
- `67f2bc0 feat(observability): gen lifecycle + payment + recovery captures` (Phase 2-4)
**Pushed:** `origin/new-ui` at `67f2bc0`
**Production worker:** `caa5eb49-8567-4e4e-8042-57aa2e6feef1` (Phase 1) → bumped again for Phase 2-4 same-session
**Sentry release tag:** `67f2bc077670303c5a199ed1b04a48a7aa599509` — matches commit

---

## TL;DR

User flagged the WS 1006 issue from Session 101 as the next priority. After a discussion of root cause vs. recovery, the conclusion was: **we don't fully know why 1006 fires** — Sentry today records the close but not the lead-up. So instead of guessing at fixes, we shipped two observability commits that turn Sentry into a real autopsy tool.

Net result: 6 new discrete Sentry captures + structured breadcrumbs on every WS lifecycle event, every inbound message type, every store mutation, every DO trace() site. Tagged so we can filter by `campaignId:X` or `user:Y`.

End-to-end verified on staging with both synthetic errors and a real 75-second follow-up generation.

---

## State Table

| Area | What | State |
|---|---|---|
| Phase 1 staging deploy | worker `44cde085` | ✅ |
| Phase 1 verification | synthetic error showed structured breadcrumbs + tags attached; live gen flowed clean trail | ✅ |
| Phase 1 prod deploy | worker `caa5eb49`, sandbox `:caa5eb49` | ✅ |
| Phase 2-4 staging deploy | bundle `index-DEEaLkYB.js` | ✅ |
| Phase 2-4 prod deploy | same release | ✅ |
| Commits pushed to origin | `f1fa6ae`, `67f2bc0` | ✅ |
| Sentry release tag matches commit | `67f2bc0…` | ✅ |

---

## What's now live in Sentry

### Phase 1 — WS investigation set (4 captures + breadcrumb infrastructure)
- `ping_pong_timeout` — client sent ping, no inbound message in 8s. **Fires before the eventual 1006 close**, while the connection is still nominally alive.
- `replay_event_dropped` — file or image event arrived but the gate at `useWebSocket.ts:236` had `campaignId` or `messageId` null. Confirms or kills the S101 hypothesis.
- `ws_send_no_clients` — DO tried to emit while `wsCount=0 && isGenerating`. Throttled 1/min/session.
- `ws_reconnect_exhausted` — client hit `MAX_RECONNECT_ATTEMPTS` (5) and gave up. Today: silent.

**Plus**: `crumb()` helper wired into WS lifecycle, every inbound message type (skips `text_delta`), `updateCampaignFile`. DO `trace()` now emits `Sentry.addBreadcrumb` on every existing trace site (~50+ sites covered for free). Store `subscribe()` keeps Sentry tags `campaignId`/`messageId` in sync with the active campaign.

### Phase 2-4 — Generation, payment, recovery (6 more captures)
- `sandbox_rpc_timeout` — DO `timedRPC` exceeded its timeout. Distinguishes sandbox hang from other RPC errors.
- `agent_process_died` — agentProcessId set but no matching process found while gen is flagged active. Throttled 1/60s per session.
- `credit_record_failed` — `credits.recordUsage` threw mid-finalize. Gen completed but billing didn't land — revenue risk made visible.
- `dodo_webhook_rejected` — invalid HMAC signature or malformed JSON on Dodo webhook. Today silently 401s.
- `image_load_failed` — AuthImage auth fetch threw or native `<img>` onError fired. Per-URL throttle 1/5min.
- `auth_token_refresh_failed` — WS path's storedTokenGetter threw. (App.tsx checkout flows already capture as `auth_failed`.)

### Pre-existing (from Session 99)
`heartbeat_silent`, `gen_stream_error`, `finalize_no_result`, `image_persist_dedup_hit`, `image_slot_overflow_fallback`, `ws_abnormal_close`, `ws_close_unexpected`, `auth_failed`, `generation_orphaned`, `gen_setup_failed` (via `captureException`).

---

## Decisions made (and explicitly NOT made)

### Why we shipped observability instead of WS structural fixes
The S101 plan had a 3-change PR ready (`web_socket_auto_reply_to_close` compat flag, `setWebSocketAutoResponse` for ping/pong, browser `online` listener). Killed for this session because **we can't prove any of those addresses our specific 1006s**. The compat flag fixes one documented cause; the other two are defensive improvements without evidence. Decision: get the data first, ship a targeted fix once Sentry shows the actual mechanism.

### Dropped from original Phase 2-4 scope
- **`r2_write_failed`** — image writes happen in the sandbox container, which has no Sentry SDK. Indirectly covered by `gen_stream_error` when the sandbox image tool fails.
- **`credit_charge_mismatch`** — no clean detection signal post-PR 1. Pivoted to `credit_record_failed` (clearer trigger, same revenue concern).
- **`subscription_state_drift`** — no clean trigger point without more research into Clerk↔D1 sync paths. Worth a focused session if a payment support ticket calls for it.
- **`hydration_mismatch`** — definition was too fuzzy; would have been noisy.

### Known cosmetic issues, not blocking
- **Console-mirror duplication.** Sentry's default `Breadcrumbs` integration auto-captures our `console.log` mirror in `crumb()`. So each event in the trail shows up twice — once as `console: [ws] xxx` and once as our structured `ws: xxx`. Fix later: drop the console.log mirror from `crumb()` or disable `CaptureConsole`.
- **React 19 StrictMode double-mount.** 2 WS lifecycles visible at boot. Pre-existing; just more visible now.

---

## Post-deploy watch list (next 24-72h)

Open `https://creative-machines.sentry.io/issues/?environment=production&statsPeriod=24h&sort=new`

### What we WANT to see
- **Any** of the 6 new captures firing — confirms the trigger logic + carries the autopsy trail.
- The next `ws_close_unexpected` or `generation_orphaned` from real prod traffic, with breadcrumbs now showing structured `ws:`, `ws-rx:`, `store:`, `emit:`, `rpc:` entries instead of raw `console.log` lines.

### What we DON'T want to see (would indicate a bug)
- `image_load_failed` firing dozens of times for the same URL within minutes (throttle broken).
- `agent_process_died` firing on every healthy gen (false positive — trigger needs tightening).
- `ws_send_no_clients` firing during normal disconnect+replay sequences (the buffer + replay should handle this without alerting).

### Validation queries
```bash
# Any of the new captures, last 24h:
open 'https://creative-machines.sentry.io/issues/?environment=production&statsPeriod=24h&query=ping_pong_timeout+OR+replay_event_dropped+OR+ws_send_no_clients+OR+ws_reconnect_exhausted+OR+sandbox_rpc_timeout+OR+agent_process_died+OR+credit_record_failed+OR+dodo_webhook_rejected+OR+image_load_failed+OR+auth_token_refresh_failed'

# Specifically: did breadcrumbs improve the next ws_close_unexpected event?
open 'https://creative-machines.sentry.io/issues/?environment=production&statsPeriod=24h&query=ws_close_unexpected&sort=new'
```

---

## Files touched this session

```
client/src/lib/observability.ts                       NEW (helper)
client/src/lib/websocket-manager.ts                   crumbs + 3 captures
client/src/hooks/useWebSocket.ts                      crumbs + replay_event_dropped
client/src/store/index.ts                             crumbs + setSentryContext subscribe
client/src/components/AuthImage.tsx                   image_load_failed (auth + img onError)
cloudflare/src/durable-objects/campaign-session.ts    trace() breadcrumb + 4 captures
cloudflare/src/routes/webhooks.ts                     dodo_webhook_rejected (2 paths)
```

---

## Next session opener

> Last session shipped observability Phases 1-4 to prod (commits `f1fa6ae`, `67f2bc0`). 6 new captures + structured breadcrumbs across server + client. Decision: defer the WS 1006 structural fix until Sentry shows the actual mechanism in real prod traffic. **First action this session: check `https://creative-machines.sentry.io/issues/?environment=production&statsPeriod=24h` and see what fired.** Then either (a) ship the targeted WS fix the data points at, or (b) work on the followup intent classification (memory file `project_followup_intent_classification.md`) which is the next highest-priority deferred item.

---

## Open punch list carried from S101 (still pending)

- WS 1006 structural fix (3-change PR) — deferred pending observability data
- Followup intent classification (saves $1.95 per Q&A follow-up) — high priority
- Aspect-ratio drift (4:5 vs 9:16 on square refs)
- `new-ui` branch 135 commits ahead of master — schedule the master merge
- Rotate prod Clerk Secret Key
- Multi-reference selective replace Phase 1.1
- PR 2 — undo/redo image versioning UI
- Background `wrangler tail` loops left from S101 — kill if still alive: `pkill -f "wrangler tail"`
