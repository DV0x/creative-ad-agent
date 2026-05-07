# Session 95 — Multi-Reference Selective Replace SHIPPED to Production

**Date:** 2026-05-07
**Branch:** `new-ui`
**Commit deployed:** `3cd26a7` (from session 94 — no new commits this session)
**Worker version:** `df99b1ce-8d15-48aa-9521-16351ba90d40`
**Status:** ✅ Live on `creativemachines.xyz`
**Predecessor:** `docs/SESSION_94_MULTI_REFERENCE_SELECTIVE_REPLACE_SHIPPED_2026-05-05.md`

---

## TL;DR

Executed session 94's deferred Phase 5 — production D1 migration + worker/sandbox deploy. No code changes, just infrastructure. Multi-reference selective replace is now live on prod.

---

## What was done

### 1. D1 migration on `creative-agent-db-prod`
```bash
npx wrangler d1 execute creative-agent-db-prod --remote --command="ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT;"
```
- 1 row written, `success: true`.
- Verified column exists via `PRAGMA table_info(campaigns);` filtered for `active_reference_file_ids`.

### 2. Build
```bash
cd client && npm run build:production
```
- Clean build, 2211 modules transformed, dist bundle `index-BoHU7viz.js` (1.18 MB).
- **Verified dist contains new symbols** before deploying:
  - `activeReferencesByCampaign` — present (1 occurrence, store slice key)
  - `set_active_references` / `active_references_updated` — present (1 occurrence, WS event names)

### 3. Deploy
Split from the build step on purpose (see "Why split" below).
```bash
docker logout registry.cloudflare.com; docker builder prune -af && cd cloudflare && npx wrangler deploy --env production
```
- New sandbox container image: `df99b1ce` (was `14d5d7d6`).
- Worker version ID: `df99b1ce-8d15-48aa-9521-16351ba90d40`.
- Triggers: `creativemachines.xyz/*` deployed in 9.46s.

### 4. Health check
```bash
curl -s https://creativemachines.xyz/health
```
```json
{
  "status": "ok",
  "d1": { "connected": true, "campaigns": 6 },
  "r2": { "bound": true },
  "auth": { "clerkKeySet": true },
  "timestamp": "2026-05-07T05:19:25.951Z"
}
```

---

## Why I split build from deploy

The standard deploy chain in CLAUDE.md is:
```bash
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env production
```

The `;` between docker logout / prune / wrangler means a vite build failure halts the chain (good — `&&` before the `;`), but if any step *after* build silently produces an empty/stale dist (or build was skipped from cache and a symbol isn't there), wrangler still deploys. Per `feedback_deploy_chain_silent_failure.md`, the symptom is a stale-bundle prod deploy with no error.

So this session: ran build standalone → `grep`-verified dist contains the new symbols → only then ran prune + wrangler. One extra step, zero risk of stale bundle.

---

## Carried forward from session 94 (still deferred)

1. **Live UI sync after server-side asset cascade.** When a file is deleted from the asset library, the server sweeps it out of all campaigns' `active_reference_file_ids` (D1) but doesn't push `active_references_updated` events to live clients. Self-heals at render time (broken file → no chip drawn), so cosmetic. ~40 LOC of new RPC surface.
2. **Tool display name not rendering as "Loading reference images".** UI tool log shows raw `mcp__refs__get_reference_images`. Probably a parser path issue specific to MCP tools. ~10-min look.
3. **Double-prefix in campaign title.** `Twt-1 — Twt-1 — @ @ ...` — likely interaction between `extractCampaignName` and mention-prefixed prompts. Cosmetic.
4. **Folder-as-reference.** User asked: tag a whole folder as a reference. Currently @mention is per-file only. ~30 LOC in `ChatInput`'s mention handler (fan out folder.files → addReference per image, with 14-ref cap + overflow toast).
5. **Local dev (`server/`) end-to-end with refs.** Phase 4 mirrored changes to Express + SQLite + in-process SDK. Typechecks clean but never run with a real reference upload. Verify: `cd server && npm run dev` + `cd client && npm run dev` → run a campaign with refs → check `/tmp/creative-agent-refs.json` is being written → watch SDK logs for `mcp__refs__get_reference_images`.

---

## How to smoke-test on prod

Same end-to-end script as the staging verification in session 94:

1. Sign in to `creativemachines.xyz`.
2. Open the asset drawer, upload one or two test images via the FileUpload button.
3. In a new campaign, type `@` and select the uploaded files — chips should appear in the strip above the textarea.
4. Submit a brief that references "the products in the reference images".
5. Watch the agent's tool log — should see `mcp__refs__get_reference_images` invoked once early, followed by `Read(/app/refs/...)` calls.
6. Generated images should preserve product identity from the references (not generic placeholders).

DO logs to look for (via `wrangler tail --env production` if needed):
- `[ASSET] First-turn refs attached to <cid>: N/N valid` (new campaign first turn)
- `[ASSET] Wrote /app/refs.json with N reference(s)` (every turn after sandbox setup)

---

## Branch state at handover

- `master` — untouched
- `new-ui` — untouched since session 94 (`3cd26a7`); after this session, has one new commit for this doc
- `feat/multi-ref-selective-replace` — same as session 94; can delete now that prod is live

End of session 95 doc.
