# Session 100 — Image versioning fix + hook taxonomy freed (PR 1)

**Date:** 2026-05-13
**Branch:** `new-ui` (uncommitted — staging tested, prod pending)
**Staging:** ✅ Deployed (worker version `f0fdcddc-96de-478f-867b-6ceb7a8da5a9`, container `creative-agent-staging-sandbox-staging:f0fdcddc`)
**Production:** ⏳ Pending (test on staging first)
**Commits this session:** **0** — per `feedback_no_commits_until_tested`, no commits until end-to-end staging test passes.

---

## TL;DR

User tested prod with a generation: asked for **2 ads**, got **4** in D1. Diagnostic dive found **4 bugs**, all interrelated:

1. **Ghost orphans** — agent regenerates (aspect-ratio retry), abandoned files persist via `generated-images.jsonl` → `turn-result.json` → D1.
2. **Wrong-slot edits** — `[Image 2] iterate` creates new slot 5 instead of bumping slot 2 to version 2.
3. **Garbage hook labels** — `hook_type` is purely positional (slot N → `HOOK_TYPE_ORDER[N-1]`), unrelated to what agent actually generated. Index 7+ silently fell back to `'stat'`. **The hook-methodology skill defines 10 types, the schema CHECK only allows 6 — the column has been semantically meaningless since day one.**
4. **Duplicate assistant messages** — intermittent race; `tryFinalize` fires from alarm + fast-path, both succeed, both insert.

PR 1 fixes all four + a latent billing bug that would have shipped silently. Schema migration drops the 6-hook CHECK constraint; the agent now declares `hookTypes` and `targetImageIndices` per image.

---

## State Table

| Area | What | State |
|---|---|---|
| D1 migration (drop `hook_type` CHECK) | staging | ✅ Applied — 192 rows preserved across 55 campaigns |
| D1 migration | production | ⏳ Pending |
| PR 1 code (12 files) | staging | ✅ Deployed, TS clean on all 3 workspaces |
| PR 1 code | production | ⏳ Pending |
| End-to-end test on staging | | ⏳ Not run — Session 101 |
| Commit / merge to master | | ⏳ Blocked until staging green |
| Cleanup of test campaign `campaign_mp3q9e5n9d2f81` (the 7-row mess on prod) | | ⏳ Pending — wait until fix is verified |

---

## The 4 Bugs (Diagnosis)

### Bug 1 — Ghost orphans (persistence leak)
- **Symptom:** "Create 2 ads" → 4 rows in `campaign_images`. The 2 ghosts had `prompt = NULL`.
- **Root cause:** `cloudflare/sandbox/nano-banana-mcp.ts:297` appends every `generate_image` call to `/app/generated-images.jsonl` with no slot key. `cloudflare/sandbox/agent-runner.ts:222` reads the entire jsonl into `turn-result.json` with no dedup. `cloudflare/src/durable-objects/campaign-session.ts:407` (finalize) inserts every row not already in D1 — **without passing `prompt`**, which is why ghosts have NULL prompts. The 2 real ads were inserted earlier by the parser path (with prompts). The 2 abandoned files (wrong aspect ratio, generated then discarded by the agent) leaked in via finalize.

### Bug 2 — Wrong-slot edits
- **Symptom:** User says `[Image 2] iterate` → new row appears at `image_index = 5` (next available global slot) instead of `version = 2` of slot 2.
- **Root cause:** `cloudflare/src/lib/sdk-message-parser.ts:366` uses `imageCounter.next++` for every image, no notion of "this image edits slot N". `addCampaignImage` already supports versioning (`MAX(version) + 1` per `image_index`), but no caller ever exercises it.

### Bug 3 — Hook taxonomy is meaningless
- **Symptom:** After edits, hook_type names don't match the actual image content. Slot 7 silently becomes `'stat'` (overflow fallback).
- **Root cause:** `hook_type` was derived positionally via `getHookTypeForIndex(N)` from `HOOK_TYPE_ORDER = ['stat','story','fomo','curiosity','callout','contrast']`. The schema CHECK constraint enforced these 6 names. Meanwhile `agent/.claude/skills/hook-methodology/formulas.md` defines **10** hook types (Question, Surprising Stat, Pattern Interrupt, Controversial, Direct Address, Social Proof, Problem-Solution, Contrast, FOMO/Urgency, Curiosity) — and the names don't even map cleanly to the schema's 6. The agent's actual hook choice was never captured.

### Bug 4 — Duplicate assistant messages (intermittent)
- **Symptom:** Two identical assistant messages in `messages` table, 1–2 seconds apart, for the same turn. Fired on 2 of 3 test turns.
- **Root cause:** `tryFinalize` is called from both the alarm path and the fast-path / crash-recovery path. If both see `/app/turn-result.json` before the `rm -f` runs, both invoke `finalizeGeneration`, both insert the assistant message.

---

## PR 1 — Files Changed (12)

| File | Change |
|---|---|
| `cloudflare/migrations/drop_hook_type_check.sql` | **NEW** — recreates `campaign_images` without `hook_type` CHECK constraint. No `BEGIN/COMMIT` (D1 rejects raw transactions; wrangler handles per-statement rollback). |
| `cloudflare/schema.sql` + `server/lib/database.ts` | Removed `CHECK (hook_type IN (…))` from in-repo schemas. |
| `cloudflare/src/lib/types.ts` | `HookType = string`. `getHookTypeForIndex` fallback for index 7+ is `'variant'` (no more silent `'stat'` overflow). |
| `cloudflare/sandbox/nano-banana-mcp.ts` + `server/lib/nano-banana-mcp.ts` | Tool schema gains optional `targetImageIndices: number[]` and `hookTypes: string[]` (parallel arrays to `prompts`). Validates length match. Removed `.max(6)` on prompts. Result objects + jsonl entries carry `targetImageIndex`, `hookType`, `prompt`. |
| `cloudflare/src/lib/local-ai-runner.ts` | Type loosened to match. |
| `cloudflare/src/db/images.ts` | `HookType = string`. **New `getImageRowCount`** (`COUNT(*)` for billing). UNIQUE-violation-safe insert (catches race between parser + finalize). |
| `cloudflare/src/db/index.ts` + `server/lib/db/index.ts` | Export `getImageRowCount` + `getMaxImageIndex`. |
| `server/lib/db/images.ts` | Same as CF: type loosened, `getImageRowCount`, `getMaxImageIndex`, **file_path dedup added** (was missing — Express could insert duplicates). |
| `cloudflare/src/lib/sdk-message-parser.ts` | Honors `img.targetImageIndex` (no counter bump, inherits hook from existing slot). Honors `img.hookType`. Emits actual `version` from DB insert in the `image` WS event. |
| `cloudflare/src/durable-objects/campaign-session.ts` | Finalize loop honors `targetImageIndex` + passes `prompt` (fixes NULL ghosts). **Billing split:** `getImageCount` for UI summary, `getImageRowCount` for the 3 billing sites (preGenImageCount baseline + finalize diff + cancel). `runGenerationLocal` uses `getMaxImageIndex + 1` not count. **Idempotency guard** via `finalizedRequestIds` Set (kills duplicate assistant message). New Sentry events: `slot_overflow_fallback`, `image_persist_dedup_hit`. |
| `client/src/types/websocket.ts` | `WSImageEvent.version?: number`, comment notes slot is no longer capped at 6. |
| `client/src/types/chat.ts` | `HookType = string`. `HOOK_TYPE_LABELS` becomes `Record<string, string>`. New `getHookLabel(hookType)` helper falls back to capitalize-the-key for unknown hooks. |
| `client/src/hooks/useWebSocket.ts` | `version: message.version ?? 1` (no longer hardcoded 1). |
| `client/src/components/mentions/AssetMention.tsx` | Use `getHookLabel` instead of direct `HOOK_TYPE_LABELS[…]` lookup. |
| `cloudflare/sandbox/orchestrator-prompt.ts` | Rule 6: agent **always** passes `targetImageIndices` (even on fresh generation, so aspect-ratio retries collide on same slot → version bump, no leaks) + `hookTypes` (prefer canonical 6 names, invent when none fit). Rule 7: iteration path explained. Worked examples updated. |

**No client store changes** — `campaign.images` stays as one row per slot. Undo/redo (PR 2) will add a parallel history table.

---

## Schema Migration Details

- File: `cloudflare/migrations/drop_hook_type_check.sql`
- Pattern: create `campaign_images_new` without CHECK, INSERT SELECT all rows, DROP old, RENAME new, recreate index.
- D1 rejects `BEGIN TRANSACTION` / `COMMIT` — removed; wrangler handles per-statement rollback automatically.
- **Staging applied:** 192 rows preserved, 55 campaigns, `hook_type` column is now `TEXT NOT NULL` with no CHECK.
- **Prod apply command:**
  ```bash
  npx wrangler d1 execute creative-agent-db-prod --remote --file=cloudflare/migrations/drop_hook_type_check.sql
  ```

---

## Staging Deploy State

- **Worker version:** `f0fdcddc-96de-478f-867b-6ceb7a8da5a9`
- **Container image:** `creative-agent-staging-sandbox-staging:f0fdcddc`
- **Sentry release tag:** `90a41b7ce157d1b80e8fe1f1c16d88999b12c1ae` (last *committed* SHA — the PR 1 changes are bundled into the deployed code but uncommitted, so Sentry will group errors under the old SHA until we commit + redeploy. **Minor observability quirk — does not block testing.**)
- **Health check:** D1 connected (67 campaigns), R2 bound, Clerk set ✅
- **URL:** `https://creative-agent-staging.alphasapien17.workers.dev`

---

## Test Plan for Session 101

Use a fresh user account (or your test account). Tail prod JSON to file in parallel for live visibility:

```bash
TS=$(date +%Y%m%d-%H%M%S)
cd cloudflare && npx wrangler tail --env staging --format json > ../docs/staging-tail-${TS}.json 2>&1 &
```

Helper SQL after each turn (replace `<id>` with the new campaign id):
```bash
npx wrangler d1 execute creative-agent-db --remote --command="
SELECT image_index, version, hook_type, substr(prompt,1,60) AS prompt_head, created_at
FROM campaign_images WHERE campaign_id='<id>'
ORDER BY image_index, version;"
```

| # | Scenario | Expected DB state | Pass criteria |
|---|---|---|---|
| **1** | New: "create 3 ads for [brand URL]" | 3 rows, indexes 1/2/3, all v1 | Hook types reflect real psychological angles (not just positional `stat/story/fomo`). All 3 have non-NULL prompts. |
| **2** | Followup: "[Image 2] make it more dynamic" | **4 rows:** 1/v1, 2/v1, 2/**v2**, 3/v1 | Slot 2 has 2 versions. Slot 5+ does NOT appear. WS `complete.imageCount` = 3. |
| **3** | Followup: "[Image 1] [Image 3] iterate both" | **6 rows:** 1/v1, 1/**v2**, 2/v1, 2/v2, 3/v1, 3/**v2** | Slots 1 and 3 each gain a v2. No new slot allocated. |
| **4** | Verify no duplicate assistant messages | `SELECT COUNT(*) FROM messages WHERE role='assistant' AND campaign_id='<id>'` | Exactly 3 (one per turn). |
| **5** | Verify billing tracks edits | `SELECT request_id, image_count, charged_amount_usd FROM usage_log WHERE campaign_id='<id>'` | 3 rows. Turn 2: `image_count=1`. Turn 3: `image_count=2`. (Pre-fix this was 0 — the latent billing bug.) |
| **6** | Sentry observability | Visit `https://creative-machines.sentry.io/issues/?environment=staging` | No `slot_overflow_fallback`. No `image_persist_dedup_hit` from `source:finalize` (parser should always land first). |

### Red flags to stop and investigate
- Any row with `prompt IS NULL` after edits → finalize path leaking (regression of Bug 1)
- Any `image_index > 6` with `hook_type = 'variant'` → agent forgot to pass `hookTypes`, positional fallback fired (orchestrator prompt issue)
- Duplicate assistant messages → idempotency guard not working
- `image_count = 0` in `usage_log` for an edit-only turn → `getImageRowCount` not wired correctly

---

## After Staging Passes

1. **Commit** the 12-file diff with a sensible message (e.g. `feat(images): targetImageIndices + versioning + freeform hook taxonomy + billing fix`).
2. Apply migration to **prod** D1:
   ```bash
   npx wrangler d1 execute creative-agent-db-prod --remote --file=cloudflare/migrations/drop_hook_type_check.sql
   ```
3. Build + deploy to production:
   ```bash
   cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npm run deploy:production
   ```
4. Verify with a fresh generation on `https://creativemachines.xyz`.
5. **Clean up the test-campaign mess** on prod (`campaign_mp3q9e5n9d2f81` — 7 rows, 4 of which are wrong-slot / ghost orphans):
   ```bash
   npx wrangler d1 execute creative-agent-db-prod --remote --command="
   DELETE FROM campaign_images
   WHERE campaign_id = 'campaign_mp3q9e5n9d2f81'
     AND id IN (36, 37, 38, 39, 40);"
   ```
   (Keeps the 2 "real" ads at id 34/35, deletes the ghosts + misplaced edits.)

---

## Open Items / Risks

### Risks to watch on staging
- **Agent compliance with `targetImageIndices`** — the fix relies on the orchestrator prompt teaching the agent to always pass it. If the agent forgets, the behavior degrades to old (new slot per image) but no longer wrong (because positional `hook_type` is now `'variant'` for slot 7+, not silent `'stat'`).
- **Server-side ref resolution under undo (PR 2 concern)** — agent picks `[Image N]` from its OWN conversation context, not a DB lookup. After PR 2 ships undo arrows, if the user views v1 of slot 2 then iterates, the agent will work on its memory's v3 (latest), not the v1 the UI shows. Ship a tooltip in PR 2: "Iterating uses the latest version."
- **R2 storage growth** — every edit adds a PNG (the old version is preserved). At ~500 KB per PNG, 50 iterations across 6 ads = 150 MB / campaign. Negligible today; add a vacuum cron later.
- **`usage_log.image_count` will now > `campaign.images.length`** — usage log counts every image generation (rows); UI counts active slots. Users querying both might see divergent numbers. Decision: acceptable; revisit if confusion surfaces.

### Deferred (PR 2 candidate)
- **Undo / redo per image** — versioning data exists post-PR-1; PR 2 adds the parallel `imageVersionHistory` store + arrow buttons on `ImageCard.tsx`. Scope: ~85 lines, 6 files (full audit done in this session). **Don't ship PR 2 until prod D1 shows actual v2/v3 rows landing reliably from PR 1.**

### Other carryover (unchanged from S99)
- 🔴 Rotate prod Clerk Secret Key (S97 finding)
- 🟡 WS-resilience 3-change PR (S98 — compat flag + WebSocketRequestResponsePair + online listener) — still unblocked, deferred
- 🔴 Followup intent classification (Session 99 open item) — partial improvement from this session (followups with `[Image N]` now correctly do single-image edits instead of full regen), but the broader orchestrator gap (Q&A vs edit vs full-regen) remains.
- 🟡 `new-ui` branch is now ~22 commits ahead of master.

---

## Useful Commands

```bash
# Tail staging JSON (don't forget — no auto-restart on connection blip)
TS=$(date +%Y%m%d-%H%M%S); cd cloudflare && npx wrangler tail --env staging --format json > ../docs/staging-tail-${TS}.json 2>&1 &

# Query staging campaign images (verify versioning)
npx wrangler d1 execute creative-agent-db --remote --command="
SELECT image_index, version, hook_type, substr(prompt,1,60) AS prompt_head, created_at
FROM campaign_images WHERE campaign_id='<id>' ORDER BY image_index, version;"

# Check distinct slots vs row count post-fix
npx wrangler d1 execute creative-agent-db --remote --command="
SELECT
  COUNT(*) AS rows,
  COUNT(DISTINCT image_index) AS distinct_slots,
  MAX(version) AS max_version
FROM campaign_images WHERE campaign_id='<id>';"

# Verify schema (CHECK should be gone)
npx wrangler d1 execute creative-agent-db --remote --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='campaign_images';"

# Sentry staging filter
open 'https://creative-machines.sentry.io/issues/?environment=staging'

# Health check
curl -s https://creative-agent-staging.alphasapien17.workers.dev/health | python3 -m json.tool
```

---

## File Map

```
cloudflare/
  migrations/drop_hook_type_check.sql              NEW
  schema.sql                                       CHECK constraint removed
  src/
    lib/types.ts                                   HookType = string, variant fallback
    lib/local-ai-runner.ts                         HookType = string
    lib/sdk-message-parser.ts                      Honors targetImageIndex + emits version
    db/images.ts                                   HookType = string, getImageRowCount, UNIQUE-safe insert
    db/index.ts                                    Exports new helpers
    durable-objects/campaign-session.ts            Finalize honors targets, billing split,
                                                   idempotency guard, Sentry events
  sandbox/
    nano-banana-mcp.ts                             targetImageIndices + hookTypes args, jsonl carries them
    orchestrator-prompt.ts                         Rule 6 + Rule 7 + worked examples

server/
  lib/database.ts                                  CHECK constraint removed
  lib/nano-banana-mcp.ts                           Mirrors CF tool changes
  lib/websocket-handler.ts                         3 sites of addCampaignImage updated,
                                                   ServerMessage.version added, getMaxImageIndex
  lib/db/images.ts                                 Mirrors CF, adds file_path dedup
  lib/db/index.ts                                  Exports new helpers

client/
  src/types/websocket.ts                           WSImageEvent.version
  src/types/chat.ts                                HookType = string, getHookLabel helper
  src/hooks/useWebSocket.ts                        version: message.version ?? 1
  src/components/mentions/AssetMention.tsx         getHookLabel instead of direct label lookup
```
