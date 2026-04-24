# Session 78 → 79 Handoff — Dev-Handover Architecture Doc Review

**Date written:** 2026-04-24 (end of Session 78)
**Branch:** `new-ui` (Session 78 commits already pushed)
**For:** Whoever runs the code-vs-docs alignment review

> Goal stated by user: walk every architecture doc against code one more time so the docs are ready for handover to a new dev working on this codebase. Bar is **"A new engineer with zero context can onboard from these docs alone"** — not just "docs don't lie", but "docs surface the decisions a new dev would need to ask about".

---

## State at start of Session 79

### Pushed on `new-ui`
```
3d25586  docs: Session 78B — close Session 77 handoff Gap #2 + Gap #4
04c7779  docs: Session 78A — BILLING.md line refs post env-var refactor
f3eb6b4  docs: Session 77 handoff notes for next documentation session
0ef1801  docs: Session 77 completion receipt for doc drift Pass 4
3bc35c0  docs: Pass 4C — local dev + NEW LOCAL_AI_RUNNER + ops + root
1594f6e  docs: Pass 4B — pipelines + cloudflare peripheral docs
7c36e14  docs: Pass 4A — user-flow rewrites
```

Check: `git log origin/new-ui..HEAD` — expect empty.

### Uncommitted working tree (do NOT touch, not doc work)
- `cloudflare/src/env.d.ts`, `routes/payments.ts`, `routes/webhooks.ts`, `wrangler.jsonc` — env-var refactor (per-env Dodo product IDs + `DODO_API_BASE`). **Already reflected correctly in BILLING.md.** Safe to ignore during review.
- `docs/scratchpad.md` — personal.
- Various untracked `.md`/`.html` files in `docs/` and elsewhere — unrelated to architecture docs.

---

## Facts already verified — DO NOT re-verify

If you recount any of these and they still match, move on. If they don't match, you've found real drift since 2026-04-24.

### Line counts (14 source files)
| File | Lines |
|---|---|
| `client/src/App.tsx` | 461 |
| `client/src/store/index.ts` | 1267 |
| `client/src/hooks/useWebSocket.ts` | 597 |
| `client/src/lib/api.ts` | 523 |
| `server/sdk-server.ts` | 948 |
| `server/lib/websocket-handler.ts` | 1672 |
| `server/lib/ai-client.ts` | 489 |
| `server/lib/nano-banana-mcp.ts` | 358 |
| `server/lib/orchestrator-prompt.ts` | 107 |
| `server/lib/session-manager.ts` | 342 |
| `cloudflare/src/index.ts` | 60 |
| `cloudflare/src/router.ts` | 222 |
| `cloudflare/src/env.d.ts` | 42 |
| `cloudflare/src/lib/local-ai-runner.ts` | 287 |
| `cloudflare/src/lib/sdk-message-parser.ts` | 397 |
| `cloudflare/src/durable-objects/campaign-session.ts` | 1945 |
| `cloudflare/sandbox/agent-runner.ts` | 441 |
| `cloudflare/sandbox/nano-banana-mcp.ts` | 360 |

### Structural checks
- **Dead-function grep** (`waitForLog`, `waitForExit`, `attachCompletionHandler`, `attachStreamHandler`, `attachCrashHandler`, `pollR2CompletionMarker`) → 0 matches in `cloudflare/`
- **R2 completion marker grep** (`completion_*.json`) → 0 matches in `cloudflare/`
- **Alarm interval** → `10_000ms` (4× `setAlarm(…, 10_000)` in `campaign-session.ts`)
- **Per-env R2 buckets** → `creative-agent-assets` (staging), `creative-agent-assets-prod` (production)
- **Per-env Dodo config** → `DODO_API_BASE` + 5 product IDs differ per env (all in `wrangler.jsonc`, typed in `env.d.ts`)
- **28 architecture docs**, **46 client components**, **14 art-style workflows**
- **17 WebSocket event types**, all shapes match `client/src/types/websocket.ts`

### Key semantic facts from Sessions 77-78 (citations still valid)
- `HOME=/root` is set at `campaign-session.ts:1482` → SDK JSONL at `/root/.claude/projects/-app-agent/`, **NOT on R2**
- `agent-runner.ts:103-108` — `allowedTools` is 12 tools
- `webhooks.ts:27-34` — `planConfig()` is a function (not a const) post env-var refactor
- `credits.ts:198-218` — `recordUsage()` two-pool SQL
- `campaign-session.ts:1642` — `AI_BACKEND === 'local'` gate; `:1724-1814` is `runGenerationLocal`
- `campaign-session.ts:1522` — `runGeneration` imageCounter seed; `:1735` — `runFollowUpFast`
- `sdk-message-parser.ts:22` — `processedFilenames` dedup set; `:25` — `imageCounter`
- All 6 cross-link anchors verified in Session 78 (see Session 77 handoff § Gaps #1 for the list)

---

## Review lens for every doc

For each architecture doc, ask in order:

1. **Accuracy** — is every concrete claim (line refs, counts, symbol names) still true?
2. **Completeness for handoff** — can a new dev do the common operations after reading this, or will they still need to ask?
3. **First impression** — does the first 30 lines orient the reader, or does it assume prior knowledge?
4. **Tribal knowledge check** — is there any "known gotcha" that lives only in session docs / commit messages that should be promoted into the doc?

The bar shifts in Session 79: Sessions 74-78 were "are the facts right?" Session 79 is "is this enough for a new dev?"

---

## Per-doc review checklist (28 docs)

Marked focus areas — skip if nothing jumps out.

### Entry & overview (start here)
- [ ] `INDEX.md` — does the table of contents cover all 28 docs and route correctly? Does the landing paragraph tell a new dev where to start?
- [ ] `OVERVIEW.md` — read cold. Flag anything that assumes prior knowledge. Is the "Two Modes, One Codebase" explanation clear to a dev who's never seen a Cloudflare Workers app?
- [ ] `GENERATION_FLOW.md` — the single most important doc for a new dev. End-to-end happy path. Does it survive a cold read?
- [ ] `CLAUDE.md` (root of architecture/) — what does this file claim it's for? Still useful?

### Cloudflare core (production path)
- [ ] `cloudflare/CLOUDFLARE_OVERVIEW.md` — routes list, env vars, secrets. Critical for ops handover.
- [ ] `cloudflare/DURABLE_OBJECT.md` — largest doc (~1945-line file behind it). 4-layer completion detection section is load-bearing.
- [ ] `cloudflare/DO_STATE_MACHINE.md` — does the state diagram match `campaign-session.ts` still?
- [ ] `cloudflare/SANDBOX_CONTAINER.md` — agent-runner lifecycle, R2 mount, startProcess invocation.
- [ ] `cloudflare/STREAMING_PIPELINE.md` — `includePartialMessages` → `text_delta` flow. Confirm path is complete.
- [ ] `cloudflare/R2_STORAGE.md` — just rewrote the SDK JSONL section in Session 78. Re-read it cold.
- [ ] `cloudflare/D1_DATABASE.md` — schema reference. Verify table/column names match `schema.sql`.

### Shared (cross-mode)
- [ ] `shared/AI_AGENT_PIPELINE.md` — orchestrator, subagents, 14 art styles, hook methodology.
- [ ] `shared/IMAGE_PIPELINE.md` — generation → storage → serving → display.
- [ ] `shared/WEBSOCKET_PROTOCOL.md` — full event catalog. Should be the source of truth vs `WEBSOCKET_CLIENT.md`.
- [ ] `shared/REST_API.md` — endpoint reference. Should list every route at `router.ts` + `index.ts`.
- [ ] `shared/BILLING.md` — freshly-audited in Session 78A. Low drift risk.
- [ ] `shared/AUTH_FLOW.md` — Clerk → JWT → Worker. Does it explain the dev-mode bypass?
- [ ] `shared/ERROR_PROPAGATION.md` — which errors surface where.

### Client
- [ ] `client/CLIENT_ARCHITECTURE.md` — 46-component map. Verify critical-path components documented.
- [ ] `client/STATE_MANAGEMENT.md` — Zustand store shape. Critical for frontend dev handover.
- [ ] `client/WEBSOCKET_CLIENT.md` — just rewrote Server→Client shapes in Session 78. Cross-check against `WEBSOCKET_PROTOCOL.md` for consistency.

### Local dev
- [ ] `local/LOCAL_ARCHITECTURE.md` — Express + SQLite setup. Does a new dev know how to run this?
- [ ] `local/LOCAL_WEBSOCKET.md` — legacy `message` event path. Is it obvious why production doesn't use this?
- [ ] `local/LOCAL_AI_CLIENT.md` — `AIClient` class, session manager. Line-count refreshed in Session 78.
- [ ] `local/LOCAL_AI_RUNNER.md` — NEW in Session 77 (wrangler dev hybrid path). Still accurate?

### Ops
- [ ] `ops/STAGING_PRODUCTION.md` — deploy commands, URLs, env separation.
- [ ] `ops/DEPLOYMENT.md` — full deploy walkthrough. Test: could a dev deploy following only this doc?
- [ ] `ops/DEBUGGING.md` — wrangler commands, D1 queries, R2 inspection. Most useful for on-call handoff.
- [ ] `ops/KNOWN_ISSUES.md` — active bug/limitation tracker. Prune resolved items.

---

## Suggested review approach (pick one)

### Option A — sequential deep read (most thorough, 3-4 hours)
Top-down through the checklist. Commit per-directory (one for `cloudflare/`, one for `shared/`, one for `client/+local/`, one for `ops/`). Expect 1-4 small commits total.

### Option B — adversarial user stories (faster, ~2 hours)
Pick 5-6 concrete tasks a new dev might face and try to do them using ONLY the docs. Every time you have to grep the code for something not referenced from a doc, that's a gap. Suggested stories:

1. Add a new WebSocket event type (client + server)
2. Debug a stuck generation in production
3. Add a new MCP tool to the agent
4. Trace where a credit deduction happens end-to-end
5. Add a new art-style workflow
6. Investigate a failed Dodo payment webhook
7. Fork a campaign at a specific message (not built yet — does the doc tell you where to add it?)

### Option C — hybrid (recommended)
Do Option A for the 4 core-path docs (OVERVIEW, GENERATION_FLOW, DURABLE_OBJECT, CLOUDFLARE_OVERVIEW). Then Option B for the rest. Catches both latent drift and real onboarding gaps.

---

## Expected outcome

If the docs pass: close this arc with a SESSION_79 completion receipt marking the 28-doc set as dev-handover-ready.

If the docs fail: log findings as a new drift pass (79A / 79B / 79C) and fix. Same commit-per-sub-pass rhythm that has worked four times now.

Either way, the facts-verified list above should carry forward into the next receipt — each session compounds.

---

## Out of scope for Session 79

The 4 non-doc TODOs from Session 77 are still open and still code/tooling work:

1. Line-count pre-commit hook
2. Extract shared orchestrator prompt + MCP between `cloudflare/sandbox/` and `cloudflare/src/lib/local-ai-runner.ts`
3. Port streaming to local dev
4. Quarterly doc-review cadence

None of these are prerequisites for dev handover.

---

## First commands to run

```bash
# Confirm baseline hasn't moved since 2026-04-24
git log origin/new-ui..HEAD                             # expect empty
git status -s                                            # pre-existing env-var refactor still uncommitted
find docs/architecture -name '*.md' | wc -l              # expect 28
wc -l client/src/App.tsx client/src/store/index.ts cloudflare/src/durable-objects/campaign-session.ts
# expect 461 / 1267 / 1945
```

If any expectation fails, the codebase has moved — start by flagging what changed.
