# Session 97 — Library folder canvas redesign + Clerk → D1 user sync

**Date:** 2026-05-12
**Branch:** `new-ui`
**Staging:** ✅ verified — worker `c114e3fc-cf2d-49fc-8ae8-37894ae00210`
**Production:** ✅ verified — worker `91c44638-8df1-4f80-8553-0ef95e2909d6`
**Commits:**
- `b6468a4` — `feat(library): drive-style folder canvas + 'add to chat' references`
- `05a713d` — `feat(identity): clerk → d1 user sync via webhook + backfill script`

---

## TL;DR

| Area | What changed | Verified? |
|---|---|---|
| **Upload flow** | Killed the FileUpload modal. Folder click in sidebar now navigates to a Drive-style canvas with drag-drop + Upload button + tiles + lightbox. | ✅ staging + prod |
| **Reference attach UX** | New "Add to chat" pill on every tile. Pre-campaign refs queue in `store.pendingReferences`; back arrow morphs into "Continue with N references →" CTA that starts a new campaign with chips pre-attached. | ✅ staging + prod |
| **@-mention picker** | Folders removed from the picker (file-only selection). Image rows now show real 48×48 `AuthImage` thumbnails. Dropdown widened to `max-w-md`. | ✅ staging + prod |
| **Tile + lightbox visuals** | Tile chrome mirrors `ImageCard.tsx`. Lightbox mirrors `ImageLightbox.tsx` — full-screen, floating chrome pills, no header bar. | ✅ staging + prod |
| **Clerk → D1 user sync** | New `users` table + `/webhooks/clerk` handler with manual Svix HMAC verification (no new npm dep). Idempotent upserts on `user.created/updated`; hard delete on `user.deleted`. | ✅ staging + prod |
| **User backfill** | One-off `scripts/backfill-users.mjs` pulled 5 existing prod users from Clerk Backend API → D1. | ✅ prod |
| **Manual credit grant** | 200 credits ($20 top-up pool) to `chakra@creativemachines.xyz` (`user_3DcijxjNZKYwj4ZTQFyC3AZWN9C`) on production. | ✅ prod |

---

## Part 1 — Library folder canvas (commit `b6468a4`)

### Why we did this

User flagged the upload UX as "confusing". Pre-session audit identified the real leaks:

1. Two different chip strips for the same concept (`ReferenceChipStrip` for active campaign + inline chips in `AssetMention` for pre-campaign) — invisible toggle between modes
2. The `@` picker mixed three lifecycle types (campaign-internal files, folders, asset files) with no visual hierarchy
3. The Asset Library sidebar had no "use this" affordance — only `@`-mention could attach
4. FileUpload modal asked for destination folder *after* file selection (backward)
5. Auto-creation of "Uploads" folder happened silently
6. Folders were a forced concept users didn't want

User direction: **simple, industry-standard, Drive-style**.

### What got built

**New canvas surface** (`workspaceView: 'campaign' | 'library'` in store):

- Click a folder in sidebar → canvas swaps to `LibraryFolderView` (replaces campaign view full-takeover)
- Click a campaign → swaps back to campaign view
- Header: back arrow + folder name + file count + Upload button
- Body: 3-column grid of tiles (was 5-col 48×48 thumbs; user wanted bigger)
- Drag anywhere on canvas → wine-tinted overlay → drops upload to current folder
- Click tile → AssetLightbox (modeled on `ImageLightbox`)
- Empty folder → centered dropzone with full instructions
- Empty Library → sidebar "Get started" link auto-creates "Uploads" folder + navigates in

**Tile** (`FileTile` in `LibraryFolderView.tsx`):

- Mirrors `ImageCard.tsx` chrome — wine hairline shadow, lifts on hover
- Hover-only overlay: filename pill top-right, action pills bottom (`Add to chat` / delete)
- Persistent "Reference" badge top-left when file is an active reference
- `pendingReferences` queue (no campaign) AND `activeReferencesByCampaign` (active campaign) both render as `isReference: true`

**Lightbox** (`AssetLightbox.tsx`):

- Full-screen dark backdrop, floating chrome pills (same `CHROME_PILL` styling as `ImageLightbox`)
- Counter top-left, action pills top-right (`Add to chat` / Download / Delete / Close)
- ←/→ chevrons + keyboard nav (Esc, arrows)
- No header bar, no filename strip — fully immersive

### The `pendingReferences` design choice

User wanted "Add to chat" to work even before a campaign exists. Two designs considered:

- ❌ Store-only: lift `mentionedAssetFiles` (local to `ChatInput`) into the store. Adds coupling.
- ✅ New `store.pendingReferences: AssetFile[]` bucket + a one-way drain effect in `ChatInput`. Clean separation: library writes, ChatInput drains on mount, clears the bucket. Existing submit path threads them into the new campaign's active references unchanged.

**Trigger UX:** the existing back-arrow in `LibraryFolderView` morphs into a primary wine CTA — **"→ Continue with N references"** — when `pendingReferences.length > 0 && !activeCampaignId`. Click → `setIsCreatingCampaign(true)` + `setWorkspaceView('campaign')` + opens right sidebar. ChatInput's `useEffect` drains pending refs into local state → chips appear pre-attached.

### Files touched (Part 1)

| File | Change |
|---|---|
| `client/src/store/index.ts` | Added `workspaceView`, `pendingReferences`, `togglePendingReference`, `removePendingReference`, `clearPendingReferences`. Local cascade on file delete. |
| `client/src/App.tsx` | New branch: `showWorkspace && workspaceView === 'library'` renders `<LibraryFolderView />`. |
| `client/src/components/library/LibraryFolderView.tsx` | **New** — canvas component. |
| `client/src/components/library/AssetLightbox.tsx` | **New** — lightbox modeled on `ImageLightbox`. |
| `client/src/components/assets/AssetDrawer.tsx` | Folders no longer inline-expand. Folder click navigates. Removed `FileUpload` button + inline file list + dead `AssetFileItem`. Removed top-level `AssetPreview` plumbing. |
| `client/src/components/assets/FileUpload.tsx` | **Deleted** — modal obsolete. |
| `client/src/components/assets/index.ts` | Removed FileUpload export. |
| `client/src/components/chat/ChatInput.tsx` | Drains `pendingReferences` into `mentionedAssetFiles` on mount + clears bucket. |
| `client/src/components/mentions/AssetMention.tsx` | Removed folder items. Added 48×48 `AuthImage` thumbnails. Dropdown bumped to `max-w-md` with 20rem scroll height. |

**Files explicitly NOT touched** (still alive, unchanged):

- `ReferenceChipStrip.tsx` — sticky chip strip still works as-is
- `useWebSocket.ts` — `set_active_references` flow unchanged
- `cloudflare/src/durable-objects/campaign-session.ts` — server-side ref resolution unchanged
- `cloudflare/sandbox/refs-mcp.ts` — agent-facing refs MCP unchanged

---

## Part 2 — Clerk → D1 user sync (commit `05a713d`)

### Why we did this

User wanted to grant 200 credits to `chakra@creativemachines.xyz`. Per `CLAUDE.md` runbook, the grant needs `user_id`. Email isn't stored in D1 (Clerk is the source of truth). Two paths:

- Click around Clerk dashboard to find user_id (~30s per grant)
- Mirror email into D1 → SQL lookup forever

User chose the second path, explicitly: *"i want to go full scale from the launch"*.

### Architecture

```
Clerk (identity)            D1 (app data)
─────────────────           ──────────────────
user signs up      ───────► users (insert)
user updates email ───────► users (update)
user deletes acct  ───────► users (hard delete)
```

**Decision matrix:**

| Decision | Choice | Reason |
|---|---|---|
| Soft vs hard delete | Hard | Simplest. GDPR-aligned. Other tables' user_id refs become orphaned (cleanup later if it matters). |
| Fields mirrored | Email only (+ id, timestamps) | YAGNI. Anything else (name, avatar) stays in Clerk; fetched on demand. Can add later without migration drama. |
| Reconciliation cron | Skipped for v1 | User asked "why would webhooks fail" — real answers exist (handler errors, deploy races, secret rotation, silent bugs) but at pre-launch volume, the cost of drift is low. Admin lookup can fall back to Clerk API as safety net (deferred, see below). |
| Webhook signature lib | Manual HMAC-SHA256 | Svix is npm dep + ~200KB. Worker has `crypto.subtle` natively. ~30 lines, no new dep. |
| Replay tolerance | 5 minutes | Svix recommended default. |
| Admin lookup endpoint | **Deferred** | User decided to just `wrangler d1 execute` directly for now. No HTTP endpoint to secure → no allowlist needed → no need to share Clerk user_id. Built-then-removed cleanly (router untouched). |

### The webhook handler

`cloudflare/src/routes/webhooks-clerk.ts` — 174 lines. Manual signature verification:

```
signed_content = `${svix-id}.${svix-timestamp}.${raw-body}`
secretBytes    = base64decode(secret.slice('whsec_'.length))
expected_sig   = base64(HMAC-SHA256(secretBytes, signed_content))
provided_sigs  = signatureHeader.split(' ').filter(v1,).map(s => s.slice(3))
verified       = provided_sigs.some(p => timingSafeEqual(p, expected))
```

Headers required: `svix-id`, `svix-timestamp`, `svix-signature`. Reject 400 if missing, 401 if signature mismatch, 200 + skip if payload malformed (prevents infinite retry loop for invalid payloads), 500 only on transient DB errors (triggers Clerk retry).

### Backfill script

`scripts/backfill-users.mjs` — pure Node ESM, no transpile needed. Reads `CLERK_SECRET_KEY` env, paginates `GET /v1/users` on Clerk Backend API (max 500/page), extracts primary email per user, generates `INSERT INTO users ... ON CONFLICT DO UPDATE` statements, writes to a temp `.sql` file, spawns `npx wrangler d1 execute --remote --file=<tmp>`. Idempotent. Safe to re-run.

**Usage:**
```bash
cd /Users/chakra/Documents/Agents/creative_agent
CLERK_SECRET_KEY="sk_live_..." node scripts/backfill-users.mjs production
# → "✓ Backfilled N users into creative-agent-db-prod"
```

### Files touched (Part 2)

| File | Change |
|---|---|
| `cloudflare/schema.sql` | Appended `users` table + `idx_users_email` index. |
| `cloudflare/src/env.d.ts` | Added `CLERK_WEBHOOK_SECRET` secret. |
| `cloudflare/src/db/users.ts` | **New** — `upsertUser`, `deleteUser`, `getUserByEmail`, `getUserById`. |
| `cloudflare/src/db/index.ts` | Re-exported users helpers. |
| `cloudflare/src/routes/webhooks-clerk.ts` | **New** — webhook handler. |
| `cloudflare/src/index.ts` | Wired `/webhooks/clerk` POST route. |
| `scripts/backfill-users.mjs` | **New** — one-off backfill script. |

### D1 migrations

Both environments migrated via raw `wrangler d1 execute`:

```bash
# Staging
npx wrangler d1 execute creative-agent-db --remote --command="
  CREATE TABLE IF NOT EXISTS users (...);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
"
# Production
npx wrangler d1 execute creative-agent-db-prod --remote --command="..."  # same SQL
```

### Secrets set

```bash
# Staging
echo 'whsec_[REDACTED_ROTATE_THIS_SECRET]' | wrangler secret put CLERK_WEBHOOK_SECRET --env staging
# Production
echo 'whsec_[REDACTED_ROTATE_THIS_SECRET]' | wrangler secret put CLERK_WEBHOOK_SECRET --env production
```

### Clerk dashboard config (manual)

For each environment (staging + production Clerk apps):
1. Webhooks → Add Endpoint
2. URL: `https://<host>/webhooks/clerk` (staging or `creativemachines.xyz`)
3. Subscribed events: `user.created`, `user.updated`, `user.deleted` (just these three)
4. Copy Signing Secret → set as `CLERK_WEBHOOK_SECRET` Worker secret

---

## Part 3 — Production credit grant

User: chakra@creativemachines.xyz (user_id `user_3DcijxjNZKYwj4ZTQFyC3AZWN9C`)
Amount: 200 credits = $20 USD top-up pool

```sql
INSERT OR IGNORE INTO user_credits (user_id) VALUES ('user_3DcijxjNZKYwj4ZTQFyC3AZWN9C');
UPDATE user_credits SET balance_usd_topup = balance_usd_topup + 20.0,
  updated_at = datetime('now')
  WHERE user_id = 'user_3DcijxjNZKYwj4ZTQFyC3AZWN9C';
```

Verified: `balance_usd_topup = 20.0`, `total_credits = 200`. Top-up pool is permanent (never wiped on subscription renewal/expiry).

---

## Verification log

| Step | Result |
|---|---|
| Library deploy → staging | Bundle hash `index-BAvWQpCG.js` confirmed in dist + live |
| Library deploy → prod | Bundle hash `index-Cqz-_FsS.js` confirmed |
| User signed up on staging (`chakra@creativemachines.xyz`) | D1 row landed: `user_3Dch3r6DYIKtwB66WCaAiWPLtZi` |
| User signed up on prod (`chakra@creativemachines.xyz`) | D1 row landed: `user_3DcijxjNZKYwj4ZTQFyC3AZWN9C` |
| Prod backfill | 5 existing users inserted: metabudmedia@gmail.com, j56175522@gmail.com, chakradhar.dhulipalla@gmail.com, alphasapien17@gmail.com, chakra5027@gmail.com |
| Health check prod | `{ status: ok, d1: connected (6 campaigns), r2: bound, clerk key set }` |

---

## Lessons learned (saved to memory)

1. **Don't pattern-match UI complaints to stock fixes** (`feedback_dont_pattern_match_fixes.md`)
   - User said "can't find the Add to chat button". I almost made it always-visible. Real cause: `canReference` gate hid it when no active campaign existed. Should have investigated the render gate before assuming the affordance was too subtle.

2. **Worker-only deploy ships wrong client bundle** (`feedback_worker_only_deploy_ships_wrong_client.md`)
   - Deployed prod client → later did `wrangler deploy --env staging` for the webhook → staging served the prod client bundle (`index-Cqz-_FsS.js` has prod Clerk keys baked in). Clerk sign-in fields didn't render. **Always `npm run build:<env>` before `wrangler deploy --env <env>`**, even for backend-only changes.
   - Diagnostic: `curl -s https://<url>/?t=$(date +%s) | grep index-` and compare to `client/dist/index.html`.

3. **Don't conflate webhook reach with admin endpoint auth**
   - User asked "why do you need my user_id if the webhook syncs everything?" — fair point. Webhook needs zero per-user setup; the admin endpoint needed it for allowlist gating. Different concerns. After I explained, user dropped the admin endpoint entirely.

---

## Open items / handover

### Must-do soon

- 🔴 **Rotate the production Clerk Secret Key.** The `sk_live_[REDACTED_ROTATE_THIS_KEY]` value is in this session's chat history. Rotate via Clerk dashboard → API Keys → revoke + new key → `wrangler secret put CLERK_SECRET_KEY --env production`. Until rotated, treat the key as compromised.

### Decisions deferred to a future session

- **Admin HTTP endpoint** — built and ripped out (clean reverts; `router.ts` is unchanged). Resurrect when there's an admin UI or non-terminal lookup need. Pattern: Clerk user_id allowlist or static `X-Admin-Token` header. Code sketch lives in chat history of this session.
- **Webhook reconciliation cron** — skipped. Add when manual detection becomes impractical (volume threshold or first observed drift incident).
- **GDPR right-to-be-forgotten cascade** — hard-delete of `users` row leaves orphaned `user_id` refs in `campaigns`, `user_credits`, etc. Add a cleanup job when a real deletion request happens.
- **Master merge of `new-ui`** — branch is now 14 commits ahead of master. No CI deploys from master so it's not urgent, but `master` is increasingly stale.

### Known gotchas

- **Two distinct chip surfaces still exist:** `ReferenceChipStrip` (sticky for active campaign) + inline `AssetMention` chips (for `@research/@hooks/@prompts` campaign-files only — folder mentions are gone). These two surfaces serve genuinely different lifecycles now (per-message vs sticky). The naming is still slightly confusing but it's a docs/comment problem, not a code problem.
- **URL routing still deferred.** `workspaceView` is in localStorage (persisted Zustand). Per `feedback_url_routing_deferred.md`, this is band-aid #3 (after `appState` + `selectedFolderId`). Next person to add a view-state field should switch to real routing instead.
- **Backfill is local-script only.** Requires `CLERK_SECRET_KEY` (the live key) on the local machine. If you're rolling someone new onto ops, document this in the README.

### Future enhancements (not promised, just ideas)

- Multi-file selection in library (shift-click range, ctrl-click toggle) → bulk "Add to chat"
- Sort/filter in folder view (by date, name, type)
- Search across the entire library (not just within a folder)
- Drag-from-library-onto-chat-input shortcut

---

## Useful commands for next session

```bash
# Look up a user's user_id by email
npx wrangler d1 execute creative-agent-db-prod --remote \
  --command="SELECT user_id FROM users WHERE email = 'foo@bar.com'"

# Grant 200 credits to a user
npx wrangler d1 execute creative-agent-db-prod --remote --command="
  INSERT OR IGNORE INTO user_credits (user_id) VALUES ('user_xxx');
  UPDATE user_credits SET balance_usd_topup = balance_usd_topup + 20.0,
    updated_at = datetime('now') WHERE user_id = 'user_xxx';
"

# Verify a credit grant
npx wrangler d1 execute creative-agent-db-prod --remote --command="
  SELECT user_id, balance_usd, balance_usd_topup,
    (balance_usd + balance_usd_topup) * 10 AS total_credits
  FROM user_credits WHERE user_id = 'user_xxx';
"

# Re-run backfill (idempotent)
CLERK_SECRET_KEY="sk_live_..." node scripts/backfill-users.mjs production

# Verify what's actually deployed at a URL
curl -s "https://creativemachines.xyz/?t=$(date +%s)" | grep "index-"
# Compare to:
grep "index-" client/dist/index.html

# Deploy command — ALWAYS rebuild client for target env first
cd client && npm run build:staging   # or build:production
cd ../cloudflare && npx wrangler deploy --env staging
```

---

## File map (this session, by purpose)

```
client/
  src/
    App.tsx ...................... wired workspaceView='library' branch
    store/index.ts ............... +workspaceView, +pendingReferences + helpers
    components/
      library/
        LibraryFolderView.tsx .... NEW — canvas (header + grid + drop + lightbox)
        AssetLightbox.tsx ........ NEW — full-screen lightbox (ImageLightbox-style)
      assets/
        AssetDrawer.tsx .......... reworked Library section (no inline expand)
        FileUpload.tsx ........... DELETED
        index.ts ................. dropped FileUpload export
      chat/
        ChatInput.tsx ............ drain pendingReferences on mount
      mentions/
        AssetMention.tsx ......... thumbnails (48×48), no folder items, wider dropdown

cloudflare/
  schema.sql ..................... +users table + idx_users_email
  src/
    env.d.ts ..................... +CLERK_WEBHOOK_SECRET
    index.ts ..................... wired POST /webhooks/clerk
    db/
      users.ts ................... NEW — upsert/delete/find helpers
      index.ts ................... re-exports users helpers
    routes/
      webhooks-clerk.ts .......... NEW — Svix verify + event dispatch

scripts/
  backfill-users.mjs ............. NEW — Clerk API → D1 bulk upsert
```

---

## Deployed versions

| Env | Worker version | Bundle hash | URL |
|---|---|---|---|
| staging | `c114e3fc-cf2d-49fc-8ae8-37894ae00210` | `index-BAvWQpCG.js` | https://creative-agent-staging.alphasapien17.workers.dev |
| production | `91c44638-8df1-4f80-8553-0ef95e2909d6` | `index-Cqz-_FsS.js` | https://creativemachines.xyz |

Both verified live via health endpoint + real signup.
