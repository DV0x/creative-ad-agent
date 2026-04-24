# Session 77 — Architecture Doc Drift Cleanup (Pass 4 complete)

**Date:** 2026-04-24
**Branch:** `new-ui`
**Previous sessions:**
- [SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md](./SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md) — audit + Pass 0/1
- [SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md](./SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md) — Pass 2 + 3
- [SESSION_76_DOC_DRIFT_CLEANUP_PASS_4_PLAN_2026-04-24.md](./SESSION_76_DOC_DRIFT_CLEANUP_PASS_4_PLAN_2026-04-24.md) — plan for this session

**Commits landed:** `7c36e14`, `1594f6e`, `3bc35c0`

---

## Summary

Session 76 wrote a planning doc. This session executed it. Pass 4 targets the peripheral architecture docs + root-level `CLAUDE.md`, plus a brand-new `LOCAL_AI_RUNNER.md` for the wrangler-dev in-process SDK path that was previously undocumented.

With this pass, every architecture doc listed in `docs/architecture/INDEX.md` has been aligned against HEAD of `new-ui`. 28 docs total (up from 27 — LOCAL_AI_RUNNER added). The 17-session drift accumulation that started this arc (Sessions 74-77) is closed.

No code changes. All three commits are `docs:` prefixed.

---

## Commit stack (since Session 75's close)

```
3bc35c0  docs: Pass 4C — local dev + NEW LOCAL_AI_RUNNER + ops + root     ← HEAD
1594f6e  docs: Pass 4B — pipelines + cloudflare peripheral docs
7c36e14  docs: Pass 4A — user-flow rewrites (GENERATION_FLOW + 3 client docs)
45c6fc4  (Session 76) docs: Track session docs for doc-drift cleanup arc
ee5a84c  (Session 75) Pass 3B
ecca3c3  (Session 75) Pass 3A
f6c5d06  (Session 75) Pass 2C
cfe639b  (Session 75) Pass 2B
7a21751  (Session 75) Pass 2A
```

---

## What landed — Pass 4A (`7c36e14`)

### `docs/architecture/GENERATION_FLOW.md` (the cross-cutting narrative)

Critical drift fixes:

- **Completion detection section** rewritten end-to-end. Old "Three Layers" (`waitForLog` / R2 polling / `/recover`) → **Four Layers** matching [DURABLE_OBJECT.md canonical](./architecture/cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers):
  - Layer 1 — inline stream parse (`streamForLiveUI` detects `turn_complete`/`result` sentinel)
  - Layer 2 — post-streaming `tryFinalize` (`campaign-session.ts:303-337`, called inline after stream loop exits)
  - Layer 3 — alarm `listProcesses` every **10 s** (not 30 s)
  - Layer 4 — client POST `/recover` (D1-first; no R2 marker read)
- **Players table**: R2 row no longer lists "completion markers"; D1 + R2 rows now show per-env bucket/db names
- **Step 4** (agent starts): `HOME='/root'` (not `/mnt/r2` — that was the pre-Session-58 framing); dropped `attachCompletionHandler()` call; `startProcess` → `streamForLiveUI` as the canonical transport
- **Step 5** (agent runs): `writeCompletionMarker` writes **only** `/app/turn-result.json` — no R2 write
- **Step 6** (live streaming): 5-branch parser with UUID dedup, cross-linked to STREAMING_PIPELINE.md for full detail
- **Follow-up fast path** diagram: stream opens BEFORE writing `next-prompt.json` (the actual race-free order in `runFollowUpFast`)
- **Failure modes** table: removed `waitForLog catch fires` row; added "nothing salvageable in D1" row
- **Data flow summary**: pruned the `/mnt/r2/completion_{id}.json` line; added `credits_update` WS event

### `docs/architecture/client/CLIENT_ARCHITECTURE.md`

- `App.tsx` 336 → **461** lines
- `main.tsx` 26 → **39**
- `store/index.ts` reference 1054 → **1267**
- `useWebSocket.ts` reference 469 → **597**
- `api.ts` 438 → **523**
- Component count 37 → **46**, with the full refreshed tree (every file `wc -l`'d)
- Added routing: `/sign-in`, `/sign-up`, `/checkout/success` path branches + `appState ↔ URL` sync via `pushState` + `popstate`
- Added billing components (`PricingModal`, `TopupModal`), `CheckoutSuccess` inline function, `BreadcrumbsIndicator` + `OrbitalSpinner`
- Added the 4-way mount fetch (`campaigns + folders + credits + subscription`) that replaces the old 2-way
- File map now explicit about what's in `pricing/`, `auth/`, `chat/blocks/`, etc.

### `docs/architecture/client/STATE_MANAGEMENT.md`

- `store/index.ts` 1054 → **1267** lines
- Added **Billing state** block: `creditBalance`, `planBalance`, `topupBalance`, `subscription`, `pricingModalOpen`, `topupModalOpen`
- Added **Text Streaming** section: `streamingText`, `textStreamingMessageId`, `appendTextDelta` / `commitStreamingText` / `mergeAndStripTextBlocks` / `setTextStreaming` / `appendTextBlock`
- Added **Billing setters** table: `setCreditBalance(balance, planBalance?, topupBalance?)` semantics, `setSubscription`, open/close modal actions
- Added **Thinking block selectors**: `hasActiveThinkingBlock`, `removeEmptyThinkingBlock`
- Added `selectedAspectRatio` + `renameBrand` + `renameBrandAsync`
- Campaign type gains `brand: string | null`
- Noted `appState` is URL-derived on boot (`window.location.pathname === '/workspace'` check)

### `docs/architecture/client/WEBSOCKET_CLIENT.md`

- `useWebSocket.ts` 469 → **597** lines
- Added `text_start` / `text_delta` / `text_end` rows to the Event → Store table, with the RAF-batched delta pipeline explained
- Added `credits_update` row → `setCreditBalance` → header/UserMenu refresh
- Rewrote `message` row: fallback-only when `!streamingText` (local runner / non-streaming transports)
- Rewrote `error` row: `INSUFFICIENT_CREDITS` → `closeThinkingBlock` + `failGeneration(upsellMsg)` + `openPricingModal`
- Fixed recovery-flow stale claim: `/recover` reads **D1 only**, no R2 marker fetch
- Updated Server→Client message shapes: new `text_*` + `credits_update` entries; corrected `image` shape to match actual SDK parser output; noted production-only vs local-only events
- Fixed bad cross-link paths (`cloudflare/WEBSOCKET_PROTOCOL` → `shared/WEBSOCKET_PROTOCOL`)

---

## What landed — Pass 4B (`1594f6e`)

### `docs/architecture/cloudflare/R2_STORAGE.md`

- Header bucket: single `creative-agent-assets` → **per-env** (`creative-agent-assets` staging / `creative-agent-assets-prod` production), with explicit binding explanation (`env.R2_BUCKET` for worker, `env.R2_BUCKET_NAME` for sandbox mount)
- **Key structure rewritten.** Image filename format fixed: `{timestamp}_{i+1}_{sanitized-prompt}.{ext}` (was incorrectly `{index}_{hookType}_{name}`). hookType is NOT in the R2 key — it's derived at DO side and stored in D1.
- **Removed `completion_{campaignId}.json`** entirely from the key structure, with an explicit callout that it was removed when `/recover` became D1-first, and a grep-proof: `grep cloudflare/ for completion_` returns nothing.
- **Orphaned SDK JSONL** callout: written by SDK but never read (RESUME_SDK_SESSION_ID is always `''` on Cloudflare).
- "Completion Marker" write path reframed as "NOT on R2" — only `/app/turn-result.json` container-local.
- "Recovery" section: `/api/campaigns/:id/recover` reads D1 only, no R2 access.
- `mountBucket` code example: `env.R2_BUCKET_NAME` (not hardcoded `creative-agent-assets`), with deployment guidance.
- "Completion marker scans ALL user images" gotcha replaced with "cross-campaign `/mnt/r2/images/` lives under user prefix".
- Added "wrong-bucket-name = silent data partition" gotcha.
- Inspection commands: per-env examples for staging and production; completion-marker inspection replaced with D1 query.

### `docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md`

- `index.ts` 50 → **60**, `router.ts` 204 → **222**
- Added webhooks route (`/webhooks/dodo`, unauthenticated, signature-verified) as a top-level Worker-entry branch
- Added billing route surface: `/api/credits`, `/api/credits/usage`, `/api/payments/{checkout,topup,subscription,portal}`, `/api/events`
- Rewrote Env interface to match actual `env.d.ts` (42 lines): added all 5 Dodo product IDs, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_SECRET`, `DODO_API_BASE`, `R2_BUCKET_NAME`
- Key Files tree: added new routes (`credits.ts` 45, `events.ts` 30, `payments.ts` 135, `webhooks.ts` 346) + new db files (`credits.ts` 265, `events.ts` 52, `subscriptions.ts` 77)
- Refreshed existing file counts: `campaign-session.ts` 1581→1945, `sdk-message-parser.ts` 255→397, `local-ai-runner.ts` 376→287 (it shrunk), `recovery.ts` 88, etc.
- Rewrote Wrangler config highlights to show the per-env structure (staging vs production D1/R2/R2_BUCKET_NAME var)

### `docs/architecture/shared/IMAGE_PIPELINE.md`

- Fixed "SSE stream" language — it's JSONL over sandbox RPC; `parseSSEStream` is a frame splitter, not Anthropic SSE
- Fixed image naming from `{index}_{hookType}_{name}` to `{timestamp}_{i+1}_{sanitizedPrompt}.{ext}` with a correct example
- Added explicit imageCounter seeding rules (new gen: `max(storedMaxIndex, dbMaxIndex) + 1`; follow-up fast: `existingImageCount + 1`)
- Added `processedFilenames: Set<string>` filename-level dedup explanation
- Replaced `waitForLog('turn_complete')` reconciliation text with `tryFinalize` (Layer 2 of DURABLE_OBJECT canonical)
- Fixed Known Issues: removed stale `writeCompletionMarker scans ALL user images` item; added per-env mount mismatch risk
- Cross-link updates to DURABLE_OBJECT.md completion-detection anchor

### `docs/architecture/shared/AI_AGENT_PIPELINE.md`

- Added `maxBudgetUsd: 3.0` and `includePartialMessages: true` to SDK configuration (were missing)
- Fixed "10 style workflows" prose contradiction — the table already lists all **14**; prose now matches
- Refreshed MCP `generate_ad_images` output example to current filename format

---

## What landed — Pass 4C (`3bc35c0`)

### NEW: `docs/architecture/local/LOCAL_AI_RUNNER.md` (288 lines)

Previously undocumented. Covers `cloudflare/src/lib/local-ai-runner.ts` (287 lines), which is the third AI-execution path in the codebase (the other two being production `agent-runner.ts` and local-dev `server/lib/ai-client.ts`).

Structure:

1. **What this covers** — the three-path matrix
2. **When it runs** — `env.AI_BACKEND === 'local'` branch at `campaign-session.ts:1642`, only set for `wrangler dev --env dev`
3. **How it differs from the sandbox path** — 12-row parity table (container, FUSE, streaming, turn sentinels, completion marker, pre-flight IP, tryFinalize+alarm, credits, session resume)
4. **How it differs from `server/lib/ai-client.ts`** — inside DO, not Express
5. **Why it exists** — rapid iteration on DO code without docker rebuilds
6. **What it cannot test** — the 9 things that require an actual staging deploy
7. **SDK options** — verbatim from source, with explicit callouts of what's absent (`includePartialMessages`, `maxBudgetUsd`)
8. **Integration point** — `runGenerationLocal` pseudocode at `campaign-session.ts:1724-1814`
9. **Divergence risk** — orchestrator prompt + MCP tool hand-duplicated from sandbox bundle
10. **See Also**

### `docs/architecture/local/LOCAL_ARCHITECTURE.md`

- `sdk-server.ts` `~947` → **948**; `ai-client.ts` added as 489; `websocket-handler.ts` `~1606` → **1672**
- Recovery row rewritten to show 4-layer model + D1-first `/recover`
- Added Credits row, Streaming row to the parity table
- Rewrote "Wrangler Dev Mode" section to delegate to LOCAL_AI_RUNNER.md

### `docs/architecture/local/LOCAL_WEBSOCKET.md`

- Line count 1,606 → **1,672**; production side 1,605 → **1,945**
- Added explicit production-parity gap: no `text_start`/`text_delta`/`text_end`, no `credits_update`. Client falls back to legacy `message` event.
- Completion row: `waitForLog('turn_complete') + R2 alarm` → "4-layer detection (see DURABLE_OBJECT.md)"
- Recovery row: "R2 marker + alarm + /recover" → "D1-first `/recover` (no R2 marker read — removed in Session 65)"
- Added Streaming + Credits rows to the parity table

### `docs/architecture/local/LOCAL_AI_CLIENT.md`

Minimal edits (doc was already accurate). Added a **Production parity callout** noting the absence of `includePartialMessages: true` and `maxBudgetUsd: 3.0` compared to the production sandbox, with a cross-link to LOCAL_AI_RUNNER.md for the parallel in-process path.

### `docs/architecture/ops/DEBUGGING.md`

- **Health URL fix** — `creative-agent.alphasapien17.workers.dev` (stale) → staging + production URLs
- **Per-env D1 and R2 commands** — both bucket names, both DB names
- **Image filename format** fixed in R2 key patterns
- Dropped stale `waitForLog` and `completion_{campaignId}.json` references
- Container error list updated: new fatal sandbox RPC patterns (`"Network connection lost"`, `"object to be reset"`)
- DO Tail Log Buffer: alarm interval 30s → **10s**
- **Generation-status diagnosis** rewritten: D1-first (campaigns + campaign_images + campaign_files + messages); `/app/turn-result.json` inside container; wrangler tail with env flag
- **New section: Billing Queries** — `user_credits`, `usage_log`, `user_subscriptions`, `payment_events`, `user_events` with example SQL
- **New section: Stuck generation diagnosis** — zombie age query
- See Also adds STAGING_PRODUCTION + BILLING + R2_STORAGE

### `docs/architecture/OVERVIEW.md`

- Component count 37 → **46**, store `~1055` → **1267**, sdk-server `~947` → **948**
- Transport row: `stdout SSE → parse → WS` → `stdout JSONL (sandbox RPC) → frame-split → processSDKMessage → WS`
- Completion detection block in the subsystem map: old 3-layer (waitForLog + R2 alarm polling + /recover) → canonical 4-layer
- Alarm heartbeat 30s → **10s**
- "pending BILLING.md" → live link to shipped BILLING.md

### `CLAUDE.md` (project root)

- All line counts refreshed against `wc -l`:
  - `store/index.ts` 1054 → 1267
  - `useWebSocket.ts` 471 → 597
  - `api.ts` 438 → 523
  - `campaign-session.ts` 1581 → 1945
  - `agent-runner.ts` 351 → 441
  - `websocket-handler.ts` 1501 → 1672
  - `sdk-message-parser.ts` — new entry, 397 lines
  - `local-ai-runner.ts` — new entry, 287 lines
- "24 architecture docs" → **28** (actual count)

### `docs/architecture/INDEX.md`

- Added LOCAL_AI_RUNNER to the Quick Start table ("Use `wrangler dev --env dev` (in-process SDK)")
- Added LOCAL_AI_RUNNER to the Documentation Map tree, with a one-line explanation of how it differs from LOCAL_AI_CLIENT.md

### `docs/architecture/ops/KNOWN_ISSUES.md`

- **#9 (Stale line counts in CLAUDE.md / OVERVIEW.md)** — marked ✅ Resolved (Pass 4). Still-open sub-item: no automated guard against future drift (20-line shell script idea retained).
- **#10 (`local-ai-runner.ts` undocumented)** — marked ✅ Resolved with pointer to LOCAL_AI_RUNNER.md. Still-open sub-item: the orchestrator prompt + MCP tool hand-duplication across the two files (refactor opportunity).

---

## Facts verified against code this session (do NOT re-verify)

Extends Session 75's canonical-facts list:

- `App.tsx` is **461 lines**
- `main.tsx` is **39 lines**
- `lib/api.ts` is **523 lines**
- `lib/auth.ts` is **9 lines**
- `contexts/AuthContext.tsx` is **83 lines**
- `types/websocket.ts` is **191 lines**
- `types/chat.ts` is **135 lines**
- `client/src/components/` contains **46 .ts/.tsx files** total (including nested dirs, excluding dev-only `ui/spinner-demo.tsx` which isn't wired into production routing)
- `server/sdk-server.ts` is **948 lines**; `server/lib/websocket-handler.ts` is **1672 lines**; `server/lib/ai-client.ts` is **489 lines**; `server/lib/session-manager.ts` is **342 lines**
- `cloudflare/src/index.ts` is **60 lines**, `cloudflare/src/router.ts` is **222 lines**, `cloudflare/src/env.d.ts` is **42 lines**, `cloudflare/src/auth.ts` is **159 lines**
- `cloudflare/src/lib/local-ai-runner.ts` is **287 lines**; `cloudflare/src/lib/sdk-message-parser.ts` is **397 lines**; `cloudflare/src/lib/event-buffer.ts` is **50 lines**; `cloudflare/src/lib/block-builder.ts` is **105 lines**; `cloudflare/src/lib/types.ts` is **89 lines**
- All cloudflare route files: health 26, images 56, campaigns 347, assets 307, recovery 88, credits 45, events 30, payments 135, webhooks 346
- All cloudflare db files: campaigns 119, files 63, images 98, messages 111, assets 109, credits 265, events 52, subscriptions 77, index 99, utils 5
- nano-banana-mcp filename format: `{timestamp}_{i+1}_{sanitizedPrompt}.{ext}` at `cloudflare/sandbox/nano-banana-mcp.ts:262`; both sandbox and local MCP default `resolution: '1K'`
- `AI_BACKEND === 'local'` gate is at `campaign-session.ts:1642`; `runGenerationLocal` body is at `:1724-1814`
- `runLocalGeneration` signature in `local-ai-runner.ts:219-224` (takes `prompt, sessionId, sdkSessionId?, options?`)
- `/webhooks/dodo` route is at `cloudflare/src/index.ts:41`, unauthenticated, routed to `handleDodoWebhook`
- 14 art-style workflows exist on disk at `agent/.claude/skills/art-style/workflows/*.md` — ls confirmed
- PricingModal + TopupModal are mounted globally in `App.tsx:312-313`; CheckoutSuccess is defined inline at `:368`, routed at `:455`
- Billing state field names in the Zustand store: lines 198-215 of `client/src/store/index.ts` define `creditBalance`, `planBalance`, `topupBalance`, `subscription`, `pricingModalOpen`, `topupModalOpen` + setters + open/close actions
- `WEBSOCKET_PROTOCOL.md` lives at `docs/architecture/shared/WEBSOCKET_PROTOCOL.md` (not `cloudflare/`) — three docs had to be corrected for this during 4A

---

## Corrections applied to prior docs (audit trail for Pass 4)

| Prior doc claim | Reality | Fixed in |
|---|---|---|
| "Three Layers: waitForLog → R2 polling (30s) → /recover" | Four layers: stream-parse → tryFinalize → alarm listProcesses (10s) → /recover | GENERATION_FLOW, OVERVIEW, LOCAL_WEBSOCKET |
| Alarm every 30s | Every 10s | GENERATION_FLOW, DEBUGGING, OVERVIEW, LOCAL_WEBSOCKET |
| `writeCompletionMarker` writes `/mnt/r2/completion_{campaignId}.json` | Writes only `/app/turn-result.json` container-local | GENERATION_FLOW, R2_STORAGE, DEBUGGING, IMAGE_PIPELINE |
| Single bucket `creative-agent-assets` | Per-env: `creative-agent-assets` staging / `creative-agent-assets-prod` prod | R2_STORAGE, DEBUGGING, OVERVIEW (Pass 4's pass), CLOUDFLARE_OVERVIEW |
| Image filename `{index}_{hookType}_{name}.png` | `{timestamp}_{i+1}_{sanitizedPrompt}.{ext}` | R2_STORAGE, IMAGE_PIPELINE, AI_AGENT_PIPELINE, DEBUGGING |
| `HOME='/mnt/r2'` | `HOME='/root'` (set at process spawn, not Dockerfile) | GENERATION_FLOW |
| `attachCompletionHandler()` in runGeneration | Gone (Session 65); Layer 1 is inline `streamForLiveUI` sentinel check | GENERATION_FLOW |
| Fast-path follow-up: "attach, stream, write next-prompt" | Order matters: open stream BEFORE writing next-prompt.json (avoids turn_start race) | GENERATION_FLOW |
| `App.tsx` 336 lines | 461 lines | CLIENT_ARCHITECTURE, CLAUDE.md |
| 37 client components | 46 .ts/.tsx files | CLIENT_ARCHITECTURE, OVERVIEW, CLAUDE.md |
| `local-ai-runner.ts` 376 lines (it shrunk) | 287 lines | CLOUDFLARE_OVERVIEW, CLAUDE.md |
| `sdk-message-parser.ts` 255 lines | 397 lines | CLOUDFLARE_OVERVIEW, CLAUDE.md |
| `env.d.ts` 32 lines (and no Dodo secrets) | 42 lines incl. 5 Dodo product IDs + 2 Dodo secrets + `R2_BUCKET_NAME` + `DODO_API_BASE` | CLOUDFLARE_OVERVIEW |
| `DODO_API_KEY` / `DODO_WEBHOOK_SECRET` (my first draft) | `DODO_PAYMENTS_API_KEY` / `DODO_PAYMENTS_WEBHOOK_SECRET` | CLOUDFLARE_OVERVIEW (caught mid-session) |
| No `/webhooks/dodo` route documented at Worker entry | Documented at `index.ts:41`, signature-verified, unauthenticated | CLOUDFLARE_OVERVIEW |
| No billing routes listed | `/api/credits`, `/api/credits/usage`, `/api/payments/*`, `/api/events` added with cross-link to BILLING.md | CLOUDFLARE_OVERVIEW, DEBUGGING, WEBSOCKET_CLIENT (credits_update) |
| Legacy `message` WS event is the primary text transport | Production streams via `text_start`/`text_delta`/`text_end`; `message` is a local-runner fallback only | WEBSOCKET_CLIENT, LOCAL_WEBSOCKET, STATE_MANAGEMENT |
| "10 style workflows" | 14 | AI_AGENT_PIPELINE |
| `useWebSocket.ts` 469 lines | 597 lines | WEBSOCKET_CLIENT, CLAUDE.md |
| `store/index.ts` 1054 lines | 1267 lines | STATE_MANAGEMENT, CLIENT_ARCHITECTURE, CLAUDE.md, OVERVIEW |
| `websocket-handler.ts` 1501-1606 lines | 1672 lines | LOCAL_ARCHITECTURE, LOCAL_WEBSOCKET, CLAUDE.md |
| Stale health URL `creative-agent.alphasapien17.workers.dev` | Staging + production URLs listed separately | DEBUGGING |
| "24 architecture docs" | 28 | CLAUDE.md |

---

## Strategic decisions made this session

1. **Followed the Session 76 plan without deviation.** The plan's 4A/4B/4C split + file list was correct; execution only added one extra line-count fix (main.tsx 26→39) that wasn't in the plan.
2. **Discussed structure for 4A's first doc (GENERATION_FLOW.md) before writing**, per the `feedback_ask_before_implementing` memory. Went straight into 4B and 4C after that since the plan had pre-approved them.
3. **Caught my own mistake mid-session.** In CLOUDFLARE_OVERVIEW.md I initially guessed the Dodo secret names (`DODO_API_KEY`, `DODO_WEBHOOK_SECRET`) from training data before reading `env.d.ts`. Correct names are `DODO_PAYMENTS_API_KEY` / `DODO_PAYMENTS_WEBHOOK_SECRET`. Also initially speculated SDK JSONL location in R2_STORAGE.md and rewrote more conservatively. Pattern: whenever I made a specific claim, I grep'd before finalizing.
4. **Caught a cross-link bug.** Three docs had wrong `../cloudflare/WEBSOCKET_PROTOCOL.md` links when the file actually lives at `../shared/WEBSOCKET_PROTOCOL.md`. Fixed via grep sweep at the end of 4A.
5. **Did NOT extract shared orchestrator-prompt / MCP code.** The LOCAL_AI_RUNNER.md divergence risk section flags this; it's a refactor opportunity, not Pass 4 scope.

---

## Feedback memories that applied (and worked)

From `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/`:

- **[Always discuss before implementing](feedback_ask_before_implementing.md)** — proposed GENERATION_FLOW.md rewrite structure before writing; user approved with "ok lets go". Subsequent docs followed the pre-approved plan.
- **[Explain things simply](user_preferences.md)** — LOCAL_AI_RUNNER.md leans heavily on tables + explicit "why this exists / what it cannot test" framings; DEBUGGING.md's new billing queries include runnable copy-paste SQL, not abstract descriptions.
- **BILLING.md as style reference** — R2_STORAGE.md's per-env bucket block, LOCAL_AI_RUNNER.md's 12-row parity table, DEBUGGING.md's billing-query block all follow BILLING.md's citation-heavy, table-heavy aesthetic.

---

## Remaining known issues / open strategic questions

Carried forward from Session 75; none addressed this session (they were out of scope):

1. **Port streaming to local dev** ([KNOWN_ISSUES #2](./architecture/ops/KNOWN_ISSUES.md#2-local-dev-doesnt-stream-tokens-or-test-sandbox-path)) — now that LOCAL_AI_RUNNER.md explicitly lists this as a cannot-test, the tradeoff is starker: either port streaming to local-ai-runner + server/, or accept that text-delta regressions can only be caught on staging. Decide at next planning session.
2. **Auto-maintain line counts** (KNOWN_ISSUES #9 residual) — a pre-commit hook would prevent this kind of drift. ~20-line shell script. Cheap; hasn't happened yet.
3. **Shared orchestrator prompt + MCP** (KNOWN_ISSUES #10 residual) — the divergence between `cloudflare/sandbox/{orchestrator-prompt,nano-banana-mcp}.ts` and `cloudflare/src/lib/local-ai-runner.ts` is a ticking time bomb. Extract-to-shared refactor at ~60-100 lines of work.
4. **Quarterly doc-review checklist** — this arc (Sessions 74-77) resolved ~17 sessions of accumulated drift. Setting a quarterly review cadence would prevent another such event.
5. **Partial Dodo refunds over-deduct credits** (KNOWN_ISSUES #3) — billing bug, not a doc issue.

---

## How to resume if more doc work is needed

### All architecture docs are current as of 2026-04-24

```
docs/architecture/INDEX.md                        ✅ (4C)
docs/architecture/OVERVIEW.md                     ✅ (4C)
docs/architecture/GENERATION_FLOW.md              ✅ (4A)
docs/architecture/CLAUDE.md (root)                ✅ (4C)
docs/architecture/client/CLIENT_ARCHITECTURE.md   ✅ (4A)
docs/architecture/client/STATE_MANAGEMENT.md      ✅ (4A)
docs/architecture/client/WEBSOCKET_CLIENT.md      ✅ (4A)
docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md ✅ (4B)
docs/architecture/cloudflare/DURABLE_OBJECT.md    ✅ (Session 75 Pass 2B)
docs/architecture/cloudflare/DO_STATE_MACHINE.md  ✅ (Session 75 Pass 2C)
docs/architecture/cloudflare/D1_DATABASE.md       ✅ (Session 74 Pass 1)
docs/architecture/cloudflare/R2_STORAGE.md        ✅ (4B)
docs/architecture/cloudflare/SANDBOX_CONTAINER.md ✅ (Session 75 Pass 3B)
docs/architecture/cloudflare/STREAMING_PIPELINE.md ✅ (Session 75 Pass 2A)
docs/architecture/local/LOCAL_ARCHITECTURE.md     ✅ (4C)
docs/architecture/local/LOCAL_WEBSOCKET.md        ✅ (4C)
docs/architecture/local/LOCAL_AI_CLIENT.md        ✅ (4C)
docs/architecture/local/LOCAL_AI_RUNNER.md        ✅ NEW (4C)
docs/architecture/ops/STAGING_PRODUCTION.md       ✅ (Session 75 Pass 3A)
docs/architecture/ops/DEPLOYMENT.md               ✅ (Session 75 Pass 3B)
docs/architecture/ops/DEBUGGING.md                ✅ (4C)
docs/architecture/ops/KNOWN_ISSUES.md             ✅ (Session 75 Pass 2C + 4C resolutions)
docs/architecture/shared/AUTH_FLOW.md             ✅ (Session 75 Pass 3B)
docs/architecture/shared/WEBSOCKET_PROTOCOL.md    ✅ (Session 75 Pass 2C)
docs/architecture/shared/REST_API.md              ✅ (Session 74 Pass 1)
docs/architecture/shared/BILLING.md               ✅ (Session 74 Pass 1)
docs/architecture/shared/AI_AGENT_PIPELINE.md     ✅ (4B)
docs/architecture/shared/IMAGE_PIPELINE.md        ✅ (4B)
docs/architecture/shared/ERROR_PROPAGATION.md     ✅ (Session 75 Pass 2C)
```

28 docs, all aligned with code at HEAD.

### Push

```bash
git push origin new-ui
```

Three new commits (`7c36e14`, `1594f6e`, `3bc35c0`) since the last push. No merge conflicts expected.

### If drift reappears

Same pattern that worked this arc:

1. Write a plan-of-record doc (like Session 76)
2. Verify facts against code first — grep, `wc -l`, read actual files
3. Never trust prior docs; they drift constantly
4. Write in the BILLING.md style (citation-heavy, tables where they compress, explicit "why" for weird choices)
5. Commit per-sub-pass, not per-session
6. End with a completion-receipt session doc (like this one)

### Meta-note

The audit-plan-execute-receipt rhythm (Session 74 audit → 75 execute → 76 plan-4 → 77 execute-4) took four sessions for what was initially framed as a single cleanup. That felt like too many, but the plan docs were high-leverage — Session 77 spent almost zero time figuring out WHAT to do; Session 76's plan had already done that. Recommend keeping this pattern for future drift accumulations.
