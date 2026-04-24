# Session 77 — Handoff Notes for Next Documentation Session

**Date written:** 2026-04-24 (end of Session 77)
**Branch:** `new-ui`
**For:** Whoever picks up documentation work next

> This is the "what to check first + what we might have missed" companion to [SESSION_77_DOC_DRIFT_CLEANUP_PASS_4_COMPLETE_2026-04-24.md](./SESSION_77_DOC_DRIFT_CLEANUP_PASS_4_COMPLETE_2026-04-24.md). The receipt documents what was done; this doc documents what to watch for.

---

## Current state — you are here

### Commits landed this session (unpushed as of writing)

```
0ef1801  docs: Session 77 completion receipt        ← HEAD
3bc35c0  docs: Pass 4C — local + LOCAL_AI_RUNNER + ops + root
1594f6e  docs: Pass 4B — pipelines + cf peripheral
7c36e14  docs: Pass 4A — user-flow rewrites
```

Check status:
```bash
git log origin/new-ui..HEAD                  # Should show 4 commits
git log --oneline -5                          # Should match the stack above
```

### Push command

```bash
git push origin new-ui
```

No merge conflicts expected — linear history on top of `45c6fc4` which was already pushed.

### Uncommitted / untracked at end of session

Pre-existing modifications that this session did NOT touch (they're unrelated to doc work):

```
M cloudflare/src/env.d.ts
M cloudflare/src/routes/payments.ts
M cloudflare/src/routes/webhooks.ts
M cloudflare/wrangler.jsonc
M docs/scratchpad.md
```

Plus various untracked files (`.codex/`, `.env.synthesis`, test logs, draft markdown files). None are doc-drift work — leave them alone unless the user asks.

---

## First thing to do next session: decide on push

If this handoff is being read at the start of the next session, the 4 commits above may or may not be pushed. Check:

```bash
git log origin/new-ui..HEAD
```

- **Empty output** → already pushed, continue with actual work
- **4 commits listed** → unpushed. Ask user whether to push before doing anything else, unless they've already said to.

---

## Gaps I might have missed — verify early

Be skeptical. These are areas where Session 77 did *targeted* edits and might have left latent drift.

### 1. Cross-links to section anchors — are the slugs actually correct?

I wrote several links like `[DURABLE_OBJECT.md § Completion detection](./cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers)`. GitHub's slugify for `Completion detection — the real four layers` should produce `completion-detection--the-real-four-layers` (em-dash becomes two hyphens), but **this is not verified by rendering**.

**Action:** Preview the docs in GitHub or with a markdown renderer that matches GH's slugify. Any broken anchor shows the full URL bar's `#` fragment not scrolling. Likely candidates:

- `GENERATION_FLOW.md` → 3 links to `DURABLE_OBJECT.md#completion-detection--the-real-four-layers`
- `R2_STORAGE.md` → links to `DURABLE_OBJECT.md#layer-4-client-recover` and `#setupsandbox-prompt-sessionid-sdksessionid-`
- `IMAGE_PIPELINE.md` → `DURABLE_OBJECT.md#completion-detection--the-real-four-layers`
- `LOCAL_AI_RUNNER.md` → same anchor
- `LOCAL_ARCHITECTURE.md` → `#event--store-update-map` on `WEBSOCKET_CLIENT.md`

If any anchor is wrong, it's a one-line fix per reference.

### 2. Docs I touched only lightly

These got structural/point fixes but no end-to-end re-read. Might still have stale bits:

- **`shared/AI_AGENT_PIPELINE.md`** — only 3 targeted edits (SDK options + "10 workflows" typo + filename example). I did NOT verify the workflow table's 14 keyword triggers, the "Step 1–6" narrative order, or the reference-image pipeline section at the bottom.
- **`local/LOCAL_AI_CLIENT.md`** — only added a parity callout. Did NOT re-verify the three `query*` method signatures, the session-manager interactions, or the resume-fallback logic.
- **`shared/IMAGE_PIPELINE.md`** — touched 5 sections but did not read the "Client Display" / "Image Data Model" / "Hook Types" bottom half. Client display section still references `AuthImage`, `ImageCard`, `ImageLightbox` — verify line counts there if it matters.

### 3. Docs I explicitly did NOT touch

Session 75 canonicalized these; Session 76 plan explicitly declared them out of scope for Pass 4:

```
cloudflare/STREAMING_PIPELINE.md
cloudflare/DURABLE_OBJECT.md
cloudflare/DO_STATE_MACHINE.md
cloudflare/SANDBOX_CONTAINER.md
cloudflare/D1_DATABASE.md
shared/WEBSOCKET_PROTOCOL.md
shared/ERROR_PROPAGATION.md
shared/AUTH_FLOW.md
shared/BILLING.md
shared/REST_API.md
ops/STAGING_PRODUCTION.md
ops/DEPLOYMENT.md
```

**If drift is found in any of these, it's NOT a Pass 4 bug — it's either Session 75 drift or new drift since 2026-04-24.** Open a Pass 5 plan doc; don't patch in place without a plan.

### 4. Claims I made without grepping — highest bug risk

These are claims where I used training knowledge or reasoning rather than reading source. Flag them first if something seems off:

- **`CLAUDE.md` "28 architecture docs"** — counted via `find docs/architecture -name '*.md' | wc -l`. If any doc is deleted/added between sessions, this number drifts.
- **`client/src/components/` "46 .ts/.tsx files"** — same count via find. Same drift risk.
- **`R2_STORAGE.md` claim that SDK JSONL "may reach `/mnt/r2/.claude/...`"** — I softened this to "If that path happens to land under `/mnt/r2/...`" because I didn't grep to confirm exactly where the SDK writes the JSONL with `HOME=/root`. **If someone asks "where does the SDK JSONL actually live?" — grep the SDK source, don't trust the doc.**
- **`LOCAL_AI_RUNNER.md` claim that "both MCPs default to `'1K'` resolution"** — verified line 214 + 234 of sandbox MCP default to `'1K'`; line 286 shows `'2K'` in a different code path I didn't trace. If someone files a bug about resolution behavior, re-grep the sandbox MCP thoroughly.
- **`WEBSOCKET_CLIENT.md` Server→Client message shapes** — I rewrote these from code context but they were previously wrong. Re-verify against `client/src/types/websocket.ts` if any message shape is load-bearing for a task.

### 5. Known potential gotchas in the new LOCAL_AI_RUNNER.md

- I claim the orchestrator prompt is "hand-copied from `cloudflare/sandbox/orchestrator-prompt.ts`". I did not do a diff of the two prompts — they might already be out of sync. Worth a `diff` before using this doc as a source of truth for agent behavior.
- The 12-row parity table was written against a fresh read of `local-ai-runner.ts` but I did not verify every production-side counterpart (e.g., "No `turn_start`/`turn_complete`" — I verified the local path doesn't emit them, but the table row implies production DOES — which DURABLE_OBJECT.md confirms, so probably fine).

---

## Followup TODOs flagged during Pass 4 but not executed

Not critical enough to block Pass 4, but worth tracking:

1. **Automate line-count drift check** (KNOWN_ISSUES #9 residual) — ~20-line shell script that greps docs for `NNN lines` patterns and validates against `wc -l`. Could be a pre-commit hook or CI check. Cheap insurance.

2. **Extract shared orchestrator prompt + MCP** between `cloudflare/sandbox/` and `cloudflare/src/lib/local-ai-runner.ts` (KNOWN_ISSUES #10 residual). Not a doc task — a refactor. Makes LOCAL_AI_RUNNER's divergence-risk section obsolete once done.

3. **Port streaming to local dev** (KNOWN_ISSUES #2) — now that LOCAL_AI_RUNNER.md explicitly lists "text-delta streaming" as a `cannot test`, the tradeoff is clearer. Discuss with user before starting: port streaming into `local-ai-runner.ts` + `server/lib/ai-client.ts` so local can test the real flow, OR accept that text-delta regressions only show up on staging.

4. **Quarterly doc-review cadence** — this cleanup arc took 4 sessions to resolve ~17 sessions of drift. Setting a quarterly review would prevent another such event. Define the review checklist and calendar it.

5. **Verify GitHub anchor slugs** (see "Gaps" #1 above) — could be scripted: render each doc with a GH-compatible slugify and dereference every `#anchor` link.

6. **Doc for `cloudflare/src/routes/webhooks.ts`** — the file is 346 lines and is the Dodo webhook handler. CLOUDFLARE_OVERVIEW now points at BILLING.md for semantics, but BILLING.md was last touched in Session 74. If webhooks.ts has grown in capability (it's in this session's pre-existing git-diff stack), BILLING.md may need a refresh. Check `git log cloudflare/src/routes/webhooks.ts` for recent changes.

---

## Test checklist for the next session

Before making changes:

```bash
# 1. Confirm where HEAD is vs origin
git log origin/new-ui..HEAD

# 2. Check for uncommitted work from other sessions
git status -s

# 3. Refresh source-file line counts — they drift constantly
wc -l \
  client/src/App.tsx \
  client/src/store/index.ts \
  client/src/hooks/useWebSocket.ts \
  client/src/lib/api.ts \
  server/sdk-server.ts \
  server/lib/websocket-handler.ts \
  server/lib/ai-client.ts \
  cloudflare/src/index.ts \
  cloudflare/src/router.ts \
  cloudflare/src/env.d.ts \
  cloudflare/src/lib/local-ai-runner.ts \
  cloudflare/src/lib/sdk-message-parser.ts \
  cloudflare/src/durable-objects/campaign-session.ts \
  cloudflare/sandbox/agent-runner.ts

# Compare against documented values:
#   App.tsx                    461
#   store/index.ts            1267
#   useWebSocket.ts            597
#   api.ts                     523
#   sdk-server.ts              948
#   websocket-handler.ts      1672
#   ai-client.ts               489
#   index.ts (cf)               60
#   router.ts                  222
#   env.d.ts                    42
#   local-ai-runner.ts         287
#   sdk-message-parser.ts      397
#   campaign-session.ts       1945
#   agent-runner.ts            441

# 4. Grep for dead functions — should all return 0 matches in cloudflare/
grep -rn "waitForLog\|waitForExit\|attachCompletionHandler\|attachStreamHandler\|attachCrashHandler\|pollR2CompletionMarker" cloudflare/src/ cloudflare/sandbox/

# 5. Grep for R2 completion marker — should return 0 matches in cloudflare/
grep -rn 'completion_.*\.json' cloudflare/src/ cloudflare/sandbox/

# 6. Confirm alarm interval is 10s (10_000ms)
grep -n "setAlarm\|ALARM_INTERVAL" cloudflare/src/durable-objects/campaign-session.ts | head -5

# 7. Confirm per-env bucket bindings
grep -n "bucket_name\|R2_BUCKET_NAME" cloudflare/wrangler.jsonc
```

If any of these expectations no longer hold, flag it in the first message — the codebase has moved and the docs are already drifting.

---

## Context from the user's preferences

Loaded from `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/`:

- **Always discuss before implementing** — propose structure for the first doc you touch and wait for approval. Don't re-propose for every doc in a pre-approved pass.
- **Explain like a noob** — terse, concrete, table-heavy. BILLING.md is the style template.
- **User prefers staged reviewable commits** — one commit per sub-pass (4A/4B/4C pattern). Don't bundle unrelated docs into one commit.

---

## Session 77 artifacts

```
docs/SESSION_77_DOC_DRIFT_CLEANUP_PASS_4_COMPLETE_2026-04-24.md   ← committed receipt
docs/SESSION_77_HANDOFF_NOTES_2026-04-24.md                        ← THIS FILE
docs/architecture/local/LOCAL_AI_RUNNER.md                         ← NEW committed doc (288 lines)
```

Previous related session docs:

```
docs/SESSION_74_DOC_DRIFT_CLEANUP_2026-04-22.md                    ← original audit
docs/SESSION_75_DOC_DRIFT_CLEANUP_PASS_2_3_COMPLETE_2026-04-24.md  ← Pass 2+3 receipt
docs/SESSION_76_DOC_DRIFT_CLEANUP_PASS_4_PLAN_2026-04-24.md        ← Pass 4 plan-of-record
```

Read Session 76's plan first if you need to understand the pre-approved scope. Read Session 75's completion for canonical facts that Pass 4 built on top of.

---

## If a completely new doc-drift hunt is needed

Pattern that has worked four times in a row:

1. **Session 1 (audit):** Read every architecture doc top-to-bottom. Flag every claim that looks stale. Output: a plan doc listing per-file drift with verification grep commands.
2. **Session 2 (plan review):** Read the plan doc. Verify the critical claims against code. Output: a trimmed plan + pre-approved sub-pass structure.
3. **Session 3 (execute):** Follow the plan, grep-first, commit per sub-pass. Output: updated docs + a completion receipt.
4. **Session 4 (handoff):** Write a forward-looking handoff like this one. Output: next-session onboarding in ~10 minutes instead of ~2 hours.

The receipts + handoffs compound: each one shrinks the next audit's surface area.
