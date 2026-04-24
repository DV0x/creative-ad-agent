# Session 75 — Architecture Doc Drift Cleanup (Pass 2 + Pass 3 complete)

**Date:** 2026-04-24
**Branch:** `new-ui`
**Previous session:** [SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md](./SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md)
**Commits landed:** `7a21751`, `cfe639b`, `f6c5d06`, `ecca3c3`, `ee5a84c`

---

## Summary

Continuation of Session 74. Pass 0 (tactical fixes) and Pass 1 (billing docs) had already landed at the start of this session. This session completed **Pass 2** (streaming + DO + state machine + WS protocol + error propagation + known issues) and **Pass 3** (staging/production matrix + deployment + auth + sandbox container + index). The architecture doc tree is now aligned with code.

No code changes this session — pure documentation work. All five commits are `docs:` prefixed.

Session 74 was structured with Pass 2 + Pass 3 pending and this session picked up exactly where that doc left off, using it as a plan-of-record. This session doc is the completion receipt.

---

## Commit stack (since Session 74's close)

```
ee5a84c  docs: Pass 3B — DEPLOYMENT + AUTH_FLOW + SANDBOX_CONTAINER + INDEX
ecca3c3  docs: Pass 3A — add STAGING_PRODUCTION.md env matrix
f6c5d06  docs: Pass 2C — state machine + WS protocol + error propagation + known issues
cfe639b  docs: Pass 2B — rewrite DURABLE_OBJECT.md completion detection + credits + zombie
7a21751  docs: Pass 2A — rewrite STREAMING_PIPELINE.md for scratch-pad model + deltas
```

All pushed to `origin/new-ui` (Pass 2 was pushed mid-session; Pass 3 is still unpushed at time of writing — decide whether to bundle or push separately).

Stack on top of Session 74's commits:

```
ee5a84c  Pass 3B             ← HEAD
ecca3c3  Pass 3A
f6c5d06  Pass 2C
cfe639b  Pass 2B
7a21751  Pass 2A
8a399d9  (Session 74) Pass 1 gap patch
ad4ef18  (Session 74) Pass 1 billing
1579258  (Session 74) Pass 0 tactical fixes
64da18c  (prior) Dodo Payments E2E validated + split credit pools
```

---

## What landed — Pass 2 (`7a21751`, `cfe639b`, `f6c5d06`)

### 2A — `docs/architecture/cloudflare/STREAMING_PIPELINE.md` (`7a21751`)

Full rewrite. The prior doc described a pre-Session-65 architecture with `waitForLog` / `waitForExit` / `attachStreamHandler` / `attachCompletionHandler` / `attachCrashHandler` / `streamProcessLogs` with SSE replay — **none of those functions exist in the codebase anymore**, verified by grep.

New doc covers:

- `includePartialMessages: true` as the enabling switch (`agent-runner.ts:101`) — the ONE flag that decides whether streaming happens
- Full agent-runner stdout schema table with file:line refs for every JSON line type (`text_start`, `text_delta`, `text_end`, `tool_use_event`, `turn_start`, `turn_complete`, `COMPLETION:${id}`, system/user/result messages, trace lines)
- `streamForLiveUI` at `campaign-session.ts:1224-1302` — SSE → buffer + split → dispatch loop
- UUID dedup (SDK double-yields assembled messages), `turn_start` replay-skip with 120s ceiling, cancel fast-path via `currentLogStream.cancel()`
- Five parser branches in `processSDKMessage`: stream_event text trio, `tool_use_event`, `system.init`, assembled `assistant` (text accumulator + tool_use fallback for local dev), assembled `user` → tool_result
- **Asymmetric dedup explained** — deltas WIN for UI rendering, assembled text kept only for DB persistence, single `hasStreamedDeltas` flag handles both prod + local-dev paths
- EventBuffer tiers: `emitEvent` (buffered + broadcast), `sendWS` (broadcast no-buffer — for deltas), `sendToWS` (targeted — replay + per-socket errors)
- Turn boundary: per-turn cost delta at `agent-runner.ts:397-402`, `writeCompletionMarker` → `/app/turn-result.json`, dual sentinels (`turn_complete` + `COMPLETION:${requestId}`)
- Scratch-pad model summary: ephemeral live UI channel vs. durable `turn-result.json` reconciliation channel
- Explicit "**local dev is NOT on this path**" callout with grep evidence (zero occurrences of `includePartialMessages`, `text_delta`, `stream_event`, `tool_use_event` in `server/`)

### 2B — `docs/architecture/cloudflare/DURABLE_OBJECT.md` (`cfe639b`)

Replaced the bogus 4-layer completion story with the real one:

**Real completion detection (4 layers):**

1. **Inline stream parse** — `streamForLiveUI` sets `turnDone=true` on `turn_complete` / `result`
2. **Post-streaming `tryFinalize`** — called inline after stream loop returns cleanly at `campaign-session.ts:1581` (runFollowUpFast) and `:1663` (runGeneration). Session 66 fix — eliminated alarm race.
3. **Alarm `listProcesses`** — every 10s. If agent dead → `tryFinalize`. If no result → mark incomplete with friendly error.
4. **Client `POST /recover`** — D1-first reconciliation. No R2 completion marker involved.

Also added:

- Credits finalization in `finalizeGeneration` — `COST_MULTIPLIER=4`, `recordUsage` idempotency via `usage_log(campaign_id, request_id) UNIQUE`, `credits_update` WS event, `recordCancelledUsage` for partial charges
- Zombie detection at three sites: alarm (5 min), subscribe (instant), pre-generate safety net
- Fatal sandbox RPC detection (`"object to be reset"` / `"Network connection lost"`) with dedicated recovery path
- Full alarm cycle walkthrough with priority ordering
- Line count corrected (1581 → 1945)
- 16 critical gotchas section (HOME=/root, s3fs null-byte corruption, agentCampaignId fast-path guard, alarm interval = 10s, zombie threshold = 5 min)
- Observed timing table (cold start 2.5–3 min, warm ~3s, single turn 30–60s, tryFinalize <200ms, etc.)

### 2C — state machine + protocol + errors + issues + index (`f6c5d06`)

Five files in one commit.

**`cloudflare/DO_STATE_MACHINE.md`:**
- Added `currentRequestId`, `hasSourceResearch`, `preGenImageCount`, `currentLogStream` to instance state
- Zombie substate diagrammed
- D1 status transition trigger table with 13 distinct generating → terminal-state triggers, each with file:line
- Race conditions table with 13 guards
- Event flow walkthroughs: happy path generate, fast follow-up, cancel, DO reset during gen, zombie detection

**`shared/WEBSOCKET_PROTOCOL.md`:**
- Added `text_start` / `text_delta` / `text_end` (ephemeral, production only)
- `tool_use_event` documented as transport-only (stdout line translated to `tool_start` event)
- `credits_update` event with shape + emission sites
- Refined `status` event; removed `attachStreamHandler` / `attachCompletionHandler` references
- Friendly error copy reference table
- Staging + production URLs both listed

**`shared/ERROR_PROPAGATION.md`:**
- Friendly error copy reference (with file:line for each emission site)
- Fatal sandbox RPC detection path
- Zombie-on-subscribe flow
- Transitions table updated
- Removed local dev as an error source (local has no billing/sandbox/streaming paths to produce those errors)

**`ops/KNOWN_ISSUES.md`:**
- #2: local dev doesn't stream tokens or test sandbox path (high-pri DX gap)
- #3: partial Dodo refunds over-deduct credits
- #4: subscription refunds route over-deduct topup pool
- #9: stale line counts in CLAUDE.md + OVERVIEW.md
- Removed resolved `waitForLog-hangs` issue (whole architecture changed)
- Updated resolved-issues log through Session 74

**`INDEX.md`:**
- Softened drift notice to "Pass 2 landed, Pass 3 pending"

---

## What landed — Pass 3 (`ecca3c3`, `ee5a84c`)

### 3A — `docs/architecture/ops/STAGING_PRODUCTION.md` (NEW, `ecca3c3`)

402-line new doc consolidating per-env config that was scattered across `wrangler.jsonc`, `BILLING.md`, and tribal knowledge.

Covers:

- Three environments at a glance (local dev / staging / production)
- Full resource matrix — Workers, D1, R2, Dodo (5×2 products), Clerk (test vs live instance), DNS, routes, webhook URLs
- Per-env deploy commands with `build:staging` / `build:production` client modes
- Secrets table — per-env vs shared-value, rotation protocol, what-breaks-if-wrong
- **Clerk instance domains decoded from base64 pk keys:**
  - Staging: `well-bug-49.clerk.accounts.dev` (from pk_test)
  - Production: `clerk.creativemachines.xyz` (from pk_live)
- "Which env am I talking to?" — five-way spot-check (wrangler output, D1 UUID prefix, Worker URL, R2 bucket name, Dodo product ID prefix)
- Disciplines (never mix test/live keys, deploy staging first, etc.)
- Rollout gotchas (two-phase deploy, container image propagation)
- Onboarding a new environment (preview/third env playbook)

### 3B — deployment + auth + sandbox + index (`ee5a84c`)

**`ops/DEPLOYMENT.md`:**
- Per-env deploy commands with `--env` flag + `build:staging` / `build:production`
- Full secret setup table with `DODO_*` additions
- **"Forgetting `--env` is silent"** warning (deploying without it goes to base config, not staging/production)
- Corrected: `CF_ACCOUNT_ID` is a wrangler secret, NOT a var (despite env.d.ts comment claiming otherwise)
- Rollback playbook per component
- Post-deploy checks (health, containers info, tail, D1 row count)
- Cross-refs STAGING_PRODUCTION.md as env matrix SoT

**`shared/AUTH_FLOW.md`:**
- Production Clerk instance `clerk.creativemachines.xyz` (custom domain + Google OAuth) fully documented
- Staging = same Clerk test instance as local dev (`well-bug-49.clerk.accounts.dev`)
- Per-env pk_test vs pk_live table
- Vite `--mode` resolution at client build time explained
- JWKS fetched per-call behavior — works automatically per env because `iss` is embedded in the JWT
- Removed stale "Current State — using Clerk test keys" section (fixed ~Session 70)
- Seven auth-specific gotchas (pk baked at build time, JWKS per-call, iss mismatch at env boundary, dev-mode global bypass, incognito tests after rotation, etc.)

**`cloudflare/SANDBOX_CONTAINER.md`:**
- Cloudflare sandbox version: `0.7.8` → **`0.7.19`** (actual Dockerfile value)
- agent-runner.ts line count: `351` → **`441`**
- Fixed completion marker architecture: **only `/app/turn-result.json`** is written today. The old dual-write to `/mnt/r2/completion_{campaignId}.json` was removed when `/recover` became D1-first. Marker schema corrected to match actual code.
- Added Runtime env vars table: `HOME=/root` (NOT `/mnt/r2`; Session 58 fix with historical note), `IMAGE_OUTPUT_DIR=/mnt/r2/images`, `RESUME_SDK_SESSION_ID=''` (always empty on Cloudflare)
- **Noted HOME is set at process spawn in the DO, NOT in the Dockerfile** (`campaign-session.ts:1482`)
- Updated SDK options to match current agent-runner.ts (12 allowed tools, `includePartialMessages`, `maxBudgetUsd: 3.0`)
- Per-env differences section — container is identical; only R2 bucket name + secrets differ per env

**`INDEX.md`:**
- Replaced STAGING_PRODUCTION placeholder with live link
- Added STAGING_PRODUCTION.md to ops/ tree in Documentation Map
- Removed drift notice entirely (all three passes done)
- Bumped last-updated to 2026-04-24

---

## Facts verified against code this session (do NOT re-verify)

These were grepped / read during Pass 2 + 3 and are now canonical in the docs. Next session can trust without re-checking:

- `agent-runner.ts` is **441 lines** (wc -l: `441 agent-runner.ts`)
- `campaign-session.ts` is **1945 lines** (wc -l: `1945 campaign-session.ts`)
- `sdk-message-parser.ts` is **397 lines**
- `recovery.ts` is **88 lines**
- `useWebSocket.ts` is **597 lines**
- `store/index.ts` is **1267 lines**
- `websocket-manager.ts` is **286 lines**
- `includePartialMessages: true` at `agent-runner.ts:101`
- `maxBudgetUsd: 3.0` at `agent-runner.ts:100`
- 12 allowed tools at `agent-runner.ts:103-108`
- Dual completion sentinels at `agent-runner.ts:418` (`turn_complete`) and `:421` (`COMPLETION:${requestId}`)
- Per-turn cost delta at `agent-runner.ts:397-402`
- `writeCompletionMarker` only writes `/app/turn-result.json` — confirmed by grep for `completion_.*\.json` in `agent-runner.ts` (zero matches)
- Stream-parse loop at `campaign-session.ts:1224-1302`
- `streamForLiveUI` inline `tryFinalize` call sites: `campaign-session.ts:1581` and `:1663`
- Alarm at `campaign-session.ts:109-298`, interval 10s at `:104, :283`
- Zombie threshold `5 * 60 * 1000` at `:170`
- 2h safety net at `:141-153`
- Zombie detection sites: `:167-184` (alarm), `:1141-1150` (subscribe), `:722-727` + `:875-881` (pre-generate), `:586-608` (restoreSession)
- Fatal sandbox RPC detection at `:223-240`
- UUID dedup `seenUuids: Set<string>` at `:1282-1287`
- `hasStreamedDeltas` set at `sdk-message-parser.ts:66`, checked at `:204`
- `processedFilenames` dedup at `:353-355`
- Cost deduction in `finalizeGeneration` at `:427-466`
- `recordCancelledUsage` at `:483-522`
- Grep confirmed: zero occurrences of `waitForLog`, `waitForExit`, `attachStreamHandler`, `attachCompletionHandler`, `attachCrashHandler`, `pollR2CompletionMarker`, `completion_.*\.json` anywhere in `cloudflare/`
- Clerk staging pk: `pk_test_d2VsbC1idWctNDkuY2xlcmsuYWNjb3VudHMuZGV2JA` → decodes to `well-bug-49.clerk.accounts.dev$`
- Clerk production pk: `pk_live_Y2xlcmsuY3JlYXRpdmVtYWNoaW5lcy54eXok` → decodes to `clerk.creativemachines.xyz$`
- Dockerfile uses `cloudflare/sandbox:0.7.19` (line 4 of Dockerfile, verified 2026-04-24)
- Staging D1: `creative-agent-db` id `ddcd29d7-632c-4017-8f3b-9de6cdd8c5fe` (wrangler.jsonc:107)
- Production D1: `creative-agent-db-prod` id `8128f3b2-e5ba-4375-a601-825d400b259d` (wrangler.jsonc:154)
- Staging R2: `creative-agent-assets`
- Production R2: `creative-agent-assets-prod`
- Staging Dodo product IDs all start `pdt_0Ncs…`; production all start `pdt_0Ncx…`
- `HOME=/root` + `IMAGE_OUTPUT_DIR=/mnt/r2/images` set at process spawn in `campaign-session.ts:1471-1485` — NOT in Dockerfile
- Client build scripts: `build:staging` = `tsc -b && vite build --mode staging`, `build:production` = `tsc -b && vite build --mode production` (`client/package.json`)
- `env.d.ts:27` comment calling `CF_ACCOUNT_ID` a var is wrong — it's a secret

---

## Corrections applied to prior docs (noting for audit trail)

Collected in one place so future readers understand what "before/after" looks like.

| Prior doc claim | Reality | Fixed in |
|---|---|---|
| "Four completion layers: waitForLog → waitForExit → alarm polling → /recover" | Those functions don't exist. Real layers are inline stream parse → post-streaming tryFinalize → alarm listProcesses → /recover | STREAMING_PIPELINE, DURABLE_OBJECT, DO_STATE_MACHINE, ERROR_PROPAGATION |
| "pollR2CompletionMarker every 30s" | Gone. /recover is D1-first now | DURABLE_OBJECT, KNOWN_ISSUES |
| Alarm interval = 30s | = 10s | INDEX, DURABLE_OBJECT, DO_STATE_MACHINE |
| "11 allowed tools" | 12 (including `mcp__nano-banana__generate_ad_images`) | STREAMING_PIPELINE, SANDBOX_CONTAINER |
| "agent-runner.ts 351 lines" | 441 | SANDBOX_CONTAINER |
| "campaign-session.ts 1581 lines" | 1945 | DURABLE_OBJECT (CLAUDE.md still wrong; low pri) |
| "cloudflare/sandbox:0.7.8" in Dockerfile | Actually 0.7.19 | SANDBOX_CONTAINER |
| "HOME=/mnt/r2" stale comment | HOME=/root since Session 58 (Dockerfile doesn't set HOME at all; set at spawn) | Pass 0 fixed the inline comment at campaign-session.ts:1335; Pass 3 fixed SANDBOX_CONTAINER doc framing |
| Completion marker writes both `/app/turn-result.json` and `/mnt/r2/completion_{campaignId}.json` | Only `/app/turn-result.json` today | SANDBOX_CONTAINER |
| "DODO_API_BASE hardcoded" | Per-env wrangler var (staging = test.dodopayments.com, production = live.dodopayments.com) | STAGING_PRODUCTION, BILLING already corrected in Session 74 |
| AUTH_FLOW "Current State — using Clerk test keys" | Production Clerk instance fully set up since ~Session 70 | AUTH_FLOW |
| Staging and production share D1 | Separate — staging `ddcd29d7…`, production `8128f3b2…` | STAGING_PRODUCTION (session 74 already caught this; Pass 3 just cemented it) |

---

## Deliberately NOT done (known scope limits)

These are follow-ups not in Session 74's Pass 2 / Pass 3 scope. Leaving them open:

1. **CLAUDE.md line-count drift** — still says `store/index.ts` is 1054 lines (actually 1267) and `useWebSocket.ts` is 471 (actually 597). Flagged in KNOWN_ISSUES #9. Low priority.
2. **OVERVIEW.md "37 components" claim** — client/src/components is larger now. Low priority.
3. **`local-ai-runner.ts` undocumented** (KNOWN_ISSUES #10) — 376-line file runs Claude SDK in-process for dev mode. Has its own orchestrator prompt copy. Worth its own doc section eventually.
4. **Partial Dodo refund over-deduction fix** (KNOWN_ISSUES #3) — documented, not fixed. ~10 lines in `handleRefundSucceeded` to read `data.amount` with currency conversion.
5. **Subscription refund pool-routing fix** (KNOWN_ISSUES #4) — needs `credit_grants` audit table to do properly.
6. **Port streaming to local dev** (KNOWN_ISSUES #2) — high-priority DX gap. Features tested locally miss token-streaming until staging. Medium effort. Open question whether worth the duplicated maintenance surface.
7. **Old resolved issues archive** — KNOWN_ISSUES still has Session 10–55 resolved issues inline for context. Could be moved to a separate archive doc if the list grows further.
8. **No CI/CD pipeline** (KNOWN_ISSUES #7) — manual deploys only.
9. **E2E tests broken with Clerk auth** (KNOWN_ISSUES #6) — test-e2e-*.mjs files 401.

---

## Strategic decisions made this session

1. **Kept Pass 2 and Pass 3 as separate commits.** User preference (from Session 74 doc) was "one commit per step (Pass)" — matched with 2A/2B/2C + 3A/3B split. Gives a clean revert surface.
2. **3B bundled 4 docs into one commit.** They share a common theme (per-env operational) and individually would each be ~50-150 lines of diff. Single commit with detailed message body is cleaner than 4 tiny commits.
3. **INDEX.md drift notice fully removed in 3B**, not softened further. All three passes have now landed; any future drift gets a fresh notice.
4. **Chose to write dedicated session doc rather than amend Session 74.** Session 74's doc is a plan-of-record written at its midpoint; amending it would have obscured the "what was the plan vs what executed" history. New doc is this file.
5. **Pushed Pass 2 mid-session but NOT Pass 3** (as of time of writing). User may want to review Pass 3 before it goes up, or push together.

---

## Feedback memories that applied (and worked)

From `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/`:

- **[Always discuss before implementing](feedback_ask_before_implementing.md)** — proposed the structure for 2A before writing; user approved. Same for Pass 3.
- **[Explain things simply](user_preferences.md)** — docs use plain language where possible, explicit "why this design choice looks weird" explanations (e.g., asymmetric dedup section in STREAMING_PIPELINE).
- **BILLING.md as style reference** — matched its depth, table-heavy format, citation-heavy approach. Both 2A and 3A borrowed its structure.

---

## How to resume if more doc work is needed

### If landing Pass 3 push is still pending

```bash
git push origin new-ui
```

No merge conflicts expected — branch is ahead by 2 commits (Pass 3A + 3B), linear from already-pushed Pass 2C.

### If drift reappears

The pattern that worked this session:

1. Read the "session 74-style" planning doc as plan-of-record
2. Verify facts against code first — grep, line counts, read the actual files
3. Never trust prior docs; they drift constantly
4. Write in the BILLING.md style (citation-heavy, tables where they compress, explicit "why" for weird choices)
5. Commit per-doc or per-theme, not per-session
6. End with a completion-receipt session doc (this file)

### Source files of truth (current line counts, 2026-04-24)

```
cloudflare/src/durable-objects/campaign-session.ts   1945 lines
cloudflare/src/lib/sdk-message-parser.ts              397 lines
cloudflare/src/lib/event-buffer.ts                     51 lines
cloudflare/src/lib/block-builder.ts                     -- (not re-verified this session)
cloudflare/sandbox/agent-runner.ts                    441 lines
cloudflare/src/routes/recovery.ts                      88 lines
cloudflare/wrangler.jsonc                             178 lines
client/src/lib/websocket-manager.ts                   286 lines
client/src/hooks/useWebSocket.ts                      597 lines
client/src/store/index.ts                            1267 lines
```

### Docs now considered current (2026-04-24)

- `docs/architecture/INDEX.md` ✅
- `docs/architecture/OVERVIEW.md` ✅ (Pass 0)
- `docs/architecture/cloudflare/STREAMING_PIPELINE.md` ✅ (Pass 2A)
- `docs/architecture/cloudflare/DURABLE_OBJECT.md` ✅ (Pass 2B)
- `docs/architecture/cloudflare/DO_STATE_MACHINE.md` ✅ (Pass 2C)
- `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` ✅ (Pass 3B)
- `docs/architecture/cloudflare/D1_DATABASE.md` ✅ (Pass 1)
- `docs/architecture/shared/BILLING.md` ✅ (Pass 1)
- `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` ✅ (Pass 2C)
- `docs/architecture/shared/ERROR_PROPAGATION.md` ✅ (Pass 2C)
- `docs/architecture/shared/AUTH_FLOW.md` ✅ (Pass 3B)
- `docs/architecture/shared/REST_API.md` ✅ (Pass 1)
- `docs/architecture/ops/STAGING_PRODUCTION.md` ✅ (Pass 3A, NEW)
- `docs/architecture/ops/DEPLOYMENT.md` ✅ (Pass 3B)
- `docs/architecture/ops/KNOWN_ISSUES.md` ✅ (Pass 2C)

### Docs NOT touched this session (may still have drift)

- `docs/architecture/OVERVIEW.md` — only Pass 0 touched; component count claim may still be stale
- `docs/architecture/GENERATION_FLOW.md` — not re-verified
- `docs/architecture/client/*` (3 files) — not touched
- `docs/architecture/local/*` (3 files) — not touched. `local-ai-runner.ts` doc missing (KNOWN_ISSUES #10)
- `docs/architecture/shared/AI_AGENT_PIPELINE.md` — not touched
- `docs/architecture/shared/IMAGE_PIPELINE.md` — not touched
- `docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md` — not touched
- `docs/architecture/cloudflare/R2_STORAGE.md` — not touched
- `docs/architecture/ops/DEBUGGING.md` — not touched
- `CLAUDE.md` — still has stale line counts (flagged in KNOWN_ISSUES #9)

---

## Open questions for the next session

These were noted but not acted on — flagging for continuity:

1. **Should we port streaming to local dev?** (KNOWN_ISSUES #2) — features tested locally miss token-streaming UX until deployed to staging. Session 65+ explicitly made production-only. Reconsider?
2. **Should line counts be auto-maintained?** (KNOWN_ISSUES #9) — easy pre-commit hook to count lines and update `CLAUDE.md` / `OVERVIEW.md`. Out of scope for doc cleanup but a candidate for a small separate effort.
3. **Quarterly doc-review checklist?** — the drift that accumulated over 17 sessions (from 2026-03-21 to 2026-04-22) was real. Could prevent recurrence.
4. **Move resolved-issues inline history out of KNOWN_ISSUES?** — the Sessions 10–74 resolved issues list is growing. At some point it becomes archive-worthy.
5. **Partial Dodo refund fix prioritization** (KNOWN_ISSUES #3) — do this before any partial refunds happen in production. Currently no partial refunds have been issued, so it's latent.

---

## Meta-note on the doc-drift workflow

This two-session (74 → 75) cleanup worked because:

- **Session 74 was the planning session** — did the full audit, caught the audit's OWN mistakes, identified what needed to land and in what order
- **Session 75 was pure execution** — no re-verification needed because Session 74 had already done it; just followed the plan

For future doc drift (and it will come), the pattern is: do a dedicated audit session first, save its findings as a `SESSION_{N}_AUDIT_{date}.md` doc, then execute in a subsequent session. Avoid mixing audit + rewrite — it's too easy to introduce NEW mistakes while fixing OLD ones if you skip the isolated verification step.

---

## Closing state

Branch `new-ui`, HEAD at `ee5a84c`. Local repo has 2 unpushed commits (Pass 3A + 3B). Working tree clean.

```
8 commits total on this doc-drift arc (Session 74 Pass 0/1 + Session 75 Pass 2/3):
  ee5a84c  docs: Pass 3B
  ecca3c3  docs: Pass 3A
  f6c5d06  docs: Pass 2C       ← pushed
  cfe639b  docs: Pass 2B       ← pushed
  7a21751  docs: Pass 2A       ← pushed
  8a399d9  docs: Pass 1 gap    ← pushed (Session 74)
  ad4ef18  docs: Pass 1        ← pushed (Session 74)
  1579258  docs: Pass 0        ← pushed (Session 74)
```

Next natural follow-up (if anyone picks this up cold): push Pass 3, then either attack KNOWN_ISSUES #2 (local dev streaming port) or #9 (auto line counts) as small standalone efforts.
