# Session 76 — Architecture Doc Drift Cleanup (Pass 4 plan)

**Date:** 2026-04-24
**Branch:** `new-ui`
**Previous sessions:**
- [SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md](./SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md) — original audit, Pass 0 + 1 landed
- [SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md](./SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md) — Pass 2 + 3 completion

**Current state:** Pass 2 + 3 committed + pushed. Load-bearing architecture docs aligned with code. Pass 4 targets the remaining ~12 peripheral docs + root-level files that weren't in Session 74's scope.

This is a **planning doc written at the end of Session 75** to enable clean execution in Session 76. No execution in this session.

---

## Summary

Sessions 74 + 75 cleaned up the "load-bearing" architecture docs — the ones someone reaches for to debug production or understand the core generation flow. About 15 docs. Pass 4 completes the cleanup by hitting the remaining ~12 peripheral docs plus `CLAUDE.md` and `docs/architecture/OVERVIEW.md` root-level files.

Scope at a glance:

- 4 user-flow docs (GENERATION_FLOW + 3 client docs) — **critical drift** in GENERATION_FLOW
- 4 AI/image/cloudflare-peripheral docs — **some drift** (R2_STORAGE is critical)
- 3 local dev docs + **1 new doc** (LOCAL_AI_RUNNER.md — KNOWN_ISSUES #10)
- 1 ops doc (DEBUGGING.md) — minor drift, stale URL
- 2 root-level (CLAUDE.md line counts, OVERVIEW.md component count)

Total: ~13 existing docs to update + 1 new doc.

---

## Current commit stack (at time of writing this plan)

```
ee5a84c  docs: Pass 3B — DEPLOYMENT + AUTH_FLOW + SANDBOX_CONTAINER + INDEX
ecca3c3  docs: Pass 3A — add STAGING_PRODUCTION.md env matrix
f6c5d06  docs: Pass 2C — state machine + WS protocol + error propagation + known issues
cfe639b  docs: Pass 2B — rewrite DURABLE_OBJECT.md completion detection + credits + zombie
7a21751  docs: Pass 2A — rewrite STREAMING_PIPELINE.md for scratch-pad model + deltas
8a399d9  (Session 74) docs: Pass 1 gap patch
ad4ef18  (Session 74) docs: Pass 1 billing
1579258  (Session 74) docs: Pass 0 tactical fixes
```

Branch `new-ui`, HEAD `ee5a84c`. Session 75 Pass 3A/3B may or may not be pushed yet depending on when this is resumed — check `git log origin/new-ui..HEAD`.

---

## Pass 4 — Inventory & drift findings (per doc, verified 2026-04-24)

Reconnaissance done at the end of Session 75 — short audit of each target doc's first ~50 lines against code. Drift hypotheses below are confident enough to plan against; full rewrites still require reading the whole doc + checking against source during execution.

### Group A — User flow docs (critical path)

#### `docs/architecture/GENERATION_FLOW.md` ⚠️ CRITICAL drift

Top of doc (lines 57-58) shows three simultaneously-wrong facts in the completion-detection diagram:
- `waitForLog` — **doesn't exist** (Session 65 removal)
- `R2 polling` → says alarm runs every **30s**, actually **10s**
- `pollR2CompletionMarker` implied — **function is gone** (removed when /recover became D1-first)

Line 19 "R2 — completion markers" in the Players table — R2 no longer stores completion markers. Marker is local-disk only (`/app/turn-result.json`).

Rewrite scope: moderate. Fix the completion-detection section, update Players table, verify ASCII diagrams. Use [DURABLE_OBJECT.md](./architecture/cloudflare/DURABLE_OBJECT.md) as the canonical source for the real 4-layer completion.

#### `docs/architecture/client/CLIENT_ARCHITECTURE.md`

Line count drift: `App.tsx` doc says 336 lines, actually **461** (+125 lines).

Missing content likely includes:
- PricingModal, TopupModal components (from BILLING.md we know they exist at `components/pricing/`)
- `CheckoutSuccess` route at `App.tsx:368` (from BILLING.md we know it's there)
- "37 components" claim — actual count is **46** (.ts/.tsx only, not counting nested dirs)
- Billing-related mount (credit balance fetch on boot)
- Possibly new pages/routes for checkout flow

Rewrite scope: medium. Update file line counts, add billing-related components to tech-stack narrative, update component count.

#### `docs/architecture/client/STATE_MANAGEMENT.md`

Line count drift: `store/index.ts` doc says 1,054 lines, actually **1,267** (+213 lines).

Missing state fields (all added Sessions 62-73 per BILLING.md):
- `creditBalance`, `planBalance`, `topupBalance` (nullable numbers)
- `subscription` (Subscription object)
- `pricingModalOpen`, `topupModalOpen` (booleans)

Missing actions likely:
- `setCreditBalance`, `setPlanBalance`, `setTopupBalance`, `setSubscription`
- `openPricingModal` / `closePricingModal` / `openTopupModal` / `closeTopupModal`
- `failGeneration` (referenced in ERROR_PROPAGATION) — verify it exists + document

Rewrite scope: medium. Add a "Billing state" section. Audit full store for any other new fields added since the doc was written.

#### `docs/architecture/client/WEBSOCKET_CLIENT.md`

Line count drift: `useWebSocket.ts` doc says 469 lines, actually **597** (+128 lines).

Missing event handlers (per Session 75's WEBSOCKET_PROTOCOL.md new additions):
- `text_start` / `text_delta` / `text_end` (streaming deltas)
- `tool_use_event` (transport-only — probably not surfaced to client, verify)
- `credits_update` (post-finalize credit broadcast)
- Updated `status` handling with friendly copy

The `websocket-manager.ts` (286 lines) is **accurate** — Session 75 confirmed. Only the hook has drifted.

Rewrite scope: medium. Add new event types + their store-update flows. Document block builder's integration with delta rendering.

### Group B — Pipeline + cloudflare peripheral docs

#### `docs/architecture/shared/AI_AGENT_PIPELINE.md`

Likely mostly accurate. The orchestrator prompt / skill / subagent architecture is stable. Verify:
- `cwd: '/app/agent'` — confirmed
- Skills: `hook-methodology`, `art-style` — confirmed
- `mcp__nano-banana__generate_ad_images` — confirmed
- SDK options: `includePartialMessages`, `maxBudgetUsd: 3.0` — verify included
- `promptStream()` async generator — likely accurate
- 14 art style workflows reference — verify agent/.claude/skills/art-style/workflows/ count

Rewrite scope: small. Refresh and cross-link to STREAMING_PIPELINE.md for streaming details instead of duplicating.

#### `docs/architecture/shared/IMAGE_PIPELINE.md`

Line 25 says "SSE stream → processSDKMessage → image event" — **incorrect term**, it's stdout JSONL, not SSE. Though `parseSSEStream` is the SDK helper used, the wire protocol isn't SSE semantically for our purposes. Minor language fix.

Line 25 also says "Reconciliation: turn-result.json → reconcileImages()" — accurate.

Likely missing:
- Filename dedup via `processedFilenames` (from STREAMING_PIPELINE)
- Global `imageCounter` seeded from `max(storedMaxIndex, dbMax) + 1` (from DURABLE_OBJECT)
- `hookType` assignment via `getHookTypeForIndex`
- Per-env R2 bucket (staging vs prod)

Rewrite scope: small-medium. Mostly language accuracy + link-out to STREAMING_PIPELINE for dedup details.

#### `docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md`

Minor drift:
- `index.ts` doc says 50 lines, actually **60** (+10)
- `router.ts` doc says 204 lines, actually **222** (+18)

Likely missing route mentions (per BILLING.md + REST_API.md):
- `/api/credits`, `/api/credits/usage`
- `/api/payments/checkout`, `/api/payments/topup`, `/api/payments/subscription`, `/api/payments/portal`
- `/api/events` (download tracking)
- `/webhooks/dodo`

Rewrite scope: small. Update line counts, expand the route-list section.

#### `docs/architecture/cloudflare/R2_STORAGE.md` ⚠️ CRITICAL drift

Lines 15 + 46: `completion_{campaignId}.json` listed in key structure + "Written by agent-runner.ts" — **this file is not written anymore**. `/mnt/r2/completion_{campaignId}.json` was removed when `/recover` became D1-first. Only `/app/turn-result.json` (container-local) gets written.

Missing:
- Per-env buckets — `creative-agent-assets` (staging) vs `creative-agent-assets-prod` (production)
- `users/{userId}/` prefix mentioned but should be explicit about how it's set (via `mountBucket({ prefix })`)
- SDK JSONL path at `.claude/projects/-app-agent/{sdkSessionId}.jsonl` — technically still written to R2 by agent SDK, but `RESUME_SDK_SESSION_ID` is always empty string on Cloudflare, so this data is orphaned. Document as orphaned-but-present for completeness.

Rewrite scope: medium. Remove completion_marker references, split key structure by env, add `uploads/` asset structure (from BILLING.md we know `/api/assets/upload` exists).

### Group C — Local dev docs + NEW doc

#### `docs/architecture/local/LOCAL_ARCHITECTURE.md`

Line count drift: `sdk-server.ts` doc says "~947", actually **948** (close enough). Not the problem.

Missing:
- Billing routes mount (`/api/credits`, `/api/payments/*`, `/api/events`, `/webhooks/dodo`) — verify these exist in local. BILLING.md says "Local dev has no billing — generations are free there" — but routes may still be mounted and return errors. Verify.
- The `cloudflare/src/lib/local-ai-runner.ts` divergence — this runs SDK in-process for `wrangler dev --env dev`, separate from `server/`. LOCAL_ARCHITECTURE doesn't mention it because the file is in `cloudflare/`, not `server/`. But it's still a "local mode" — doc should link to the NEW LOCAL_AI_RUNNER.md.
- Cross-link to WEBSOCKET_PROTOCOL showing local doesn't emit `text_delta` etc.

Rewrite scope: small. Add a "Wrangler dev mode" subsection linking to LOCAL_AI_RUNNER.md.

#### `docs/architecture/local/LOCAL_WEBSOCKET.md`

Line count drift: doc says 1606 lines, actually **1672** (+66). Small.

Content-wise probably mostly accurate since local hasn't been rewritten. But should explicitly:
- Call out "does NOT emit text_delta/text_start/text_end" (Session 65+ production-only)
- List the WS event types local DOES emit vs production (cross-ref WEBSOCKET_PROTOCOL.md)
- Update the processSDKMessage reference — session 75 documented prod uses 5 branches, local uses 2 (D + E)

Rewrite scope: small. Explicit parity-vs-production callouts.

#### `docs/architecture/local/LOCAL_AI_CLIENT.md`

Line count: 489 lines both in doc and reality — **accurate**!

Verify:
- `queryStream` / `queryWithSession` / `queryWithSessionFork` still the three methods
- `forkSession: true` still used for fork variant
- Resume options: stale JSONL fallback still there
- Local SDK config — `model: 'claude-haiku-4-5-20251001'`, `maxTurns: 30` — verify (likely same as prod)

Rewrite scope: tiny. Mostly a verification pass + cross-link to STREAMING_PIPELINE explaining why the message flow is different.

#### 🆕 **NEW DOC:** `docs/architecture/local/LOCAL_AI_RUNNER.md`

Not-yet-existing. Flagged in KNOWN_ISSUES #10 (Session 74).

Target: `cloudflare/src/lib/local-ai-runner.ts` (287 lines). Runs Claude SDK in-process for `wrangler dev --env dev` (with `AI_BACKEND=local`). This is a THIRD AI-execution path (after `server/lib/ai-client.ts` and sandbox `agent-runner.ts`).

Structure proposal:
1. **What this covers** — the `AI_BACKEND=local` path in wrangler dev
2. **When it runs** — `env.AI_BACKEND === 'local'` branches in `campaign-session.ts:1642-1814`
3. **How it differs from sandbox agent-runner** — no container, no FUSE, no streaming, runs SDK directly in DO
4. **How it differs from server/lib/ai-client.ts** — inside a Worker/DO, not Express
5. **Why it exists** — rapid iteration on DO code without docker builds
6. **What it cannot test** — pre-flight IP, FUSE mount, container cold start, streaming, sandbox RPC errors
7. **SDK options** — same model/maxTurns as production but NO `includePartialMessages`
8. **How `runGenerationLocal` integrates** — cross-link to DURABLE_OBJECT.md
9. **Divergence risk** — has its own MCP tool registration? (verify). May drift from sandbox path silently.
10. **See Also**

Rewrite scope: medium-large. New doc, but focused scope (287 lines to cover). Read the source first.

### Group D — Ops + root

#### `docs/architecture/ops/DEBUGGING.md`

Line 10: `https://creative-agent.alphasapien17.workers.dev/health` — **OUTDATED URL**. The old base Worker is not the current endpoint. Should use the staging URL `creative-agent-staging.alphasapien17.workers.dev` OR production `creativemachines.xyz`.

Line 31: `creative-agent-db` — should note that production uses `creative-agent-db-prod` and staging uses `creative-agent-db`. Reference [STAGING_PRODUCTION.md](./architecture/ops/STAGING_PRODUCTION.md).

Missing queries likely:
- Billing queries (`user_credits`, `usage_log`, `user_subscriptions`, `payment_events`, `user_events`)
- Dodo webhook debugging (look up `payment_events` by `webhook_id`)
- Credit balance check per user
- Stuck generation diagnosis (per Session 75 zombie recovery: look for `status='generating'` with no active DO)

Rewrite scope: medium. URL fixes + new query examples for billing debugging.

#### `docs/architecture/OVERVIEW.md`

Pass 0 already fixed most things. Remaining:
- "~37 components" (if still there) — actual 46
- Cross-ref Sessions 65/70-73 Pass 2/3 outcomes
- Check for any other stale numbers

Rewrite scope: tiny. Quick audit.

#### `CLAUDE.md` (project root)

Line 34-41: Code Layout section has stale line counts:

| File | Doc says | Reality |
|---|---|---|
| `store/index.ts` | 1054 | **1267** |
| `useWebSocket.ts` | 471 | **597** |
| `websocket-manager.ts` | 286 | 286 ✅ |
| `api.ts` | 438 | (not re-checked) |
| `campaign-session.ts` | 1581 | **1945** |
| `agent-runner.ts` | 351 | **441** |
| `websocket-handler.ts` | 1501 | **1672** |

Line 11: "24 architecture docs" — verify count (STAGING_PRODUCTION.md brings it to at least 25).

Rewrite scope: tiny. Just update line counts. This is KNOWN_ISSUES #9.

---

## Suggested commit structure (Pass 4A / 4B / 4C)

Following the Pass 2 (3-commit) and Pass 3 (2-commit) precedent. Three commits feels right for 13 files + 1 new doc.

### 4A — User flow docs (critical-path rewrites)

Files:
- `docs/architecture/GENERATION_FLOW.md` ⚠️
- `docs/architecture/client/CLIENT_ARCHITECTURE.md`
- `docs/architecture/client/STATE_MANAGEMENT.md`
- `docs/architecture/client/WEBSOCKET_CLIENT.md`

Why bundled: these are what a frontend debugger reaches for. GENERATION_FLOW.md is the cross-cutting user-facing narrative. Three client docs have overlapping drift (billing state, line counts).

Expected diff: ~600–800 lines across four files.

### 4B — AI/image pipelines + cloudflare peripheral

Files:
- `docs/architecture/shared/AI_AGENT_PIPELINE.md`
- `docs/architecture/shared/IMAGE_PIPELINE.md`
- `docs/architecture/cloudflare/CLOUDFLARE_OVERVIEW.md`
- `docs/architecture/cloudflare/R2_STORAGE.md` ⚠️

Why bundled: AI and image pipelines cross client↔server boundaries; cloudflare peripherals complete the production-side picture. R2_STORAGE's critical drift (completion_marker still referenced) needs fixing here.

Expected diff: ~400–600 lines.

### 4C — Local dev + NEW local-ai-runner + ops + root

Files:
- `docs/architecture/local/LOCAL_ARCHITECTURE.md`
- `docs/architecture/local/LOCAL_WEBSOCKET.md`
- `docs/architecture/local/LOCAL_AI_CLIENT.md`
- `docs/architecture/local/LOCAL_AI_RUNNER.md` 🆕 **NEW**
- `docs/architecture/ops/DEBUGGING.md`
- `docs/architecture/OVERVIEW.md`
- `CLAUDE.md`
- `docs/architecture/INDEX.md` (add LOCAL_AI_RUNNER.md to Documentation Map)

Why bundled: local dev overhaul + DX docs + root file updates.

Expected diff: ~400–500 lines.

**Alternative:** split 4C further if size is unwieldy:
- 4C = local dev trio + LOCAL_AI_RUNNER new
- 4D = DEBUGGING + CLAUDE.md + OVERVIEW.md + INDEX.md

Decide at execution time based on actual diff sizes.

---

## Source files of truth for Pass 4

All facts should be verified against these before writing:

### Client
```
client/src/App.tsx                          461 lines   (was 336 in doc)
client/src/store/index.ts                  1267 lines   (was 1054 in doc)
client/src/hooks/useWebSocket.ts            597 lines   (was 469 in doc)
client/src/lib/websocket-manager.ts         286 lines   ✅ accurate
client/src/lib/api.ts                       ??? lines   (verify)
client/src/components/                       46 files   (was 37 in doc)
```

### Server (local dev)
```
server/sdk-server.ts                        948 lines   (was ~947 in doc) ✅
server/lib/websocket-handler.ts            1672 lines   (was 1606 in doc)
server/lib/ai-client.ts                     489 lines   ✅ accurate
server/lib/event-buffer.ts                  127 lines   (per STREAMING_PIPELINE)
```

### Cloudflare
```
cloudflare/src/index.ts                      60 lines   (was 50 in doc)
cloudflare/src/router.ts                    222 lines   (was 204 in doc)
cloudflare/src/lib/local-ai-runner.ts       287 lines   (NO DOC)
cloudflare/src/durable-objects/campaign-session.ts  1945 lines (Session 75)
cloudflare/sandbox/agent-runner.ts          441 lines   (Session 75)
cloudflare/wrangler.jsonc                   178 lines
```

### Agent
```
agent/.claude/skills/hook-methodology/      (verify structure — 6 hook types)
agent/.claude/skills/art-style/workflows/   (verify count — CLAUDE.md says 14)
```

---

## Prerequisites already verified (do NOT re-verify)

Session 75's [facts verified](./SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md#facts-verified-against-code-this-session-do-not-re-verify) list is canonical. Highlights relevant to Pass 4:

- **Streaming architecture** — `includePartialMessages: true`, 5 parser branches, UUID dedup, `hasStreamedDeltas` asymmetric dedup, `turn_start` + `turn_complete` sentinels, per-turn cost delta
- **DO completion detection** — 4 layers are inline → post-stream tryFinalize → alarm listProcesses → /recover. `waitForLog`/`waitForExit`/`pollR2CompletionMarker` all gone
- **Zombie detection** — 3 sites (alarm 5min, subscribe instant, pre-generate safety net)
- **Per-env config** — staging D1 `ddcd29d7…`, prod D1 `8128f3b2…`, staging Clerk `well-bug-49.clerk.accounts.dev`, prod Clerk `clerk.creativemachines.xyz`, Dodo product ID prefixes
- **Container** — sandbox 0.7.19, agent-runner 441 lines, HOME=/root at spawn not Dockerfile, completion marker is ONLY `/app/turn-result.json`
- **Grep-verified absent** — `waitForLog`, `waitForExit`, `attachStreamHandler`, `attachCompletionHandler`, `attachCrashHandler`, `pollR2CompletionMarker`, `completion_.*\.json` anywhere in `cloudflare/`

Any time Pass 4 writes about streaming, DO completion, billing, auth, or container internals — **link out to the Pass 2/3 docs rather than duplicating**. Keep each doc's scope crisp.

---

## Audit strategy for execution

Suggested workflow, mirroring Sessions 74-75:

1. **Pick a group (4A / 4B / 4C).**
2. **Read each target doc in full** first (not just top 50 lines — recon above was a sniff).
3. **Grep/read source files** for each claim the doc makes. Key traps:
   - Line counts — always `wc -l`, never trust the doc
   - Function names — `grep -n "^function\|^export " FILE` to list actual exports
   - Architecture diagrams — check against current code paths, not old ones
4. **Write the replacement doc** in BILLING.md style: citation-heavy, tables where they compress, explicit "why this is weird" callouts
5. **Don't duplicate Pass 2/3 content** — link to STREAMING_PIPELINE / DURABLE_OBJECT / STAGING_PRODUCTION / BILLING / AUTH_FLOW
6. **Commit per group.** Detailed commit message body listing every change per file.
7. **Update INDEX.md** if new docs added (LOCAL_AI_RUNNER.md in 4C).
8. **End with a completion receipt doc** (`SESSION_77_DOC_DRIFT_CLEANUP_PASS_4_COMPLETE_YYYY-MM-DD.md`) matching Session 75's structure.

### Things to actively look for (common drift patterns from Sessions 74-75)

- **Line counts** — every single doc had them wrong except `websocket-manager.ts` and `ai-client.ts`. Always verify.
- **Function names that don't exist** — `waitForLog`/`waitForExit` pattern. Grep before documenting.
- **Interval claims** — alarm is 10s, ping is 25s, agent heartbeat is 30s. Don't mix.
- **Per-env hard-coded values** — if a doc says "the D1 is X" without noting per-env, that's likely wrong
- **Event types** — `text_delta`, `credits_update`, `tool_use_event` are new; `streamProcessLogs` SSE framing may be mentioned as "the protocol" when it's actually an implementation detail
- **Stale URLs** — `creative-agent.alphasapien17.workers.dev` (old) vs `creative-agent-staging.alphasapien17.workers.dev` (current staging) vs `creativemachines.xyz` (prod)

### Things explicitly NOT in scope for Pass 4

Don't touch these — they're either Session 75 canonical or out of scope:

- STREAMING_PIPELINE.md, DURABLE_OBJECT.md, DO_STATE_MACHINE.md, SANDBOX_CONTAINER.md
- WEBSOCKET_PROTOCOL.md, ERROR_PROPAGATION.md, AUTH_FLOW.md, BILLING.md, REST_API.md, D1_DATABASE.md
- STAGING_PRODUCTION.md, DEPLOYMENT.md, KNOWN_ISSUES.md, INDEX.md

If Pass 4 uncovers new drift in the above, flag it — don't fix it in Pass 4. Create a Pass 5 plan or just note in the completion doc.

---

## Feedback memories that apply

From `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/`:

- **Always discuss before implementing** — propose structure for each doc before writing. Especially for the NEW LOCAL_AI_RUNNER.md.
- **Explain things simply** — "explain like a noob" when documenting gotchas. Everyday analogies, not jargon.
- **BILLING.md is the style template** — citation-heavy, tables, explicit "why this looks weird" sections
- **One commit per Pass (sub-pass OK)** — 4A/4B/4C pattern continues the Session 74 precedent

---

## Notes for the next session

### Start here

1. Read this doc fully
2. Read the Session 75 completion receipt for canonical facts and style references
3. Pick Group A (4A) first — user-flow docs, critical path, highest impact
4. Read target docs in full before writing (the recon above was partial)
5. Commit 4A, then move to 4B, then 4C

### Expected session length

Similar to Session 75 (Pass 2 + Pass 3 in one session). Pass 4 is roughly the same total volume. Could split across two sessions if context gets tight — the 4A/4B/4C split is a natural boundary.

### After Pass 4 lands

All architecture docs will be aligned with code. At that point:

1. Update `KNOWN_ISSUES.md` #9 (line counts) → resolved
2. Update `KNOWN_ISSUES.md` #10 (local-ai-runner undocumented) → resolved
3. Write `SESSION_77_DOC_DRIFT_CLEANUP_PASS_4_COMPLETE_YYYY-MM-DD.md` following Session 75's structure
4. Consider the quarterly doc-review checklist (open question from Session 75)

### Open strategic questions (carried forward from Session 75)

1. **Port streaming to local dev?** (KNOWN_ISSUES #2) — Pass 4 will re-surface this when documenting LOCAL_WEBSOCKET + LOCAL_AI_RUNNER. Decide then whether to scope the port work.
2. **Auto-maintain line counts?** (KNOWN_ISSUES #9) — After Pass 4 fixes them manually, consider a pre-commit hook. Easy ~20-line script.
3. **Quarterly doc-review checklist?** — After Pass 4, docs are aligned; define the review cadence to prevent future 17-session drift accumulations.

### Meta-note

Session 74 (audit) + 75 (Pass 2+3 execute) + 76 (this plan) + 77 (Pass 4 execute) is starting to look like a fractal of itself. Each "audit session" is a cheap investment that pays off in a clean "execute session." Pattern to keep using.

---

## Pre-flight checklist for starting Pass 4 execution

- [ ] Session 75 Pass 3A + 3B committed AND pushed to `origin/new-ui` (check `git status` + `git log origin/new-ui..HEAD`)
- [ ] Read [SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md](./SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md) canonical facts section
- [ ] Confirm line counts haven't drifted in the hour since this plan (`wc -l` the source files listed above)
- [ ] Decide: 4A/4B/4C 3-commit structure OR 4A/4B/4C/4D 4-commit structure (based on 4C volume)
- [ ] Propose structure for 4A's first doc before writing (GENERATION_FLOW.md — it's the critical one)
- [ ] Execute per 4A → 4B → 4C order
- [ ] End-of-session: write SESSION_77 completion receipt
