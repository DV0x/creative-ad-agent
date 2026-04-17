# Session 64 — Billing Overcharge & Image Index Collision Fixes (2026-04-04)

## Context

User tested Session 63's credit system deployment on staging and provided a 4,777-line `wrangler tail --format json` log for audit. This session was a deep forensic analysis of the logs + D1 state, followed by surgical fixes.

## What We Found

### Audit of the Test Session (Gonoise Campaign, 12:02–12:11 UTC)

The test session ran 3 turns (initial gen + 2 follow-ups) on `campaign_mnka70u46w19q8`, generating 6 images total (2 per turn). All images served 200 OK, fast path working, agent process reused across turns.

**Key finding: zero credit/billing log entries in wrangler tail.** The `[credits][recorded]` and `[finalize]` logs go through `this.log()` → `tailLogs[]` buffer → alarm flush. A CampaignSession alarm exception at 12:08:04Z (between Turn 2 and 3) prevented flushing, making billing invisible in tail output. Had to query D1 directly to audit.

### Bug 1: Billing Overcharge ($1.80 on Turn 3)

**Usage log showed Turn 3 charged for 5 images instead of 2.**

Root cause: `finalizeGeneration` line 400 mixed two incompatible metrics:
```javascript
// OLD — broken
const imagesThisTurn = existingImages.length + imagesAdded - this.preGenImageCount;
```

- `existingImages.length` = `getCampaignImages()` → **total rows** (7, including versions + duplicates)
- `this.preGenImageCount` = `getImageCount()` → **COUNT(DISTINCT image_index)** (2)
- Result: `7 + 0 - 2 = 5` instead of the correct `2`

**Actual billing impact:**
| Turn | Images (actual) | Images (charged) | Correct total | Actual total | Overcharge |
|------|----------------|------------------|--------------|-------------|------------|
| 1 | 2 | 2 | $2.07 | $2.07 | $0 |
| 2 | 2 | 2 | $1.56 | $1.56 | $0 |
| 3 | 2 | **5** | $1.54 | **$3.34** | **$1.80** |

### Bug 2: Image Index Reset on Follow-ups

Turn 2's images were assigned index 1,2 (version 2) instead of index 3,4 (version 1). This caused them to **overwrite Turn 1's images** via the versioning system.

**D1 state:**
| id | index | ver | turn | visible on client? |
|----|-------|-----|------|--------------------|
| 199 | 1 | 1 | Turn 1 | **hidden** (behind v2) |
| 200 | 2 | 1 | Turn 1 | **hidden** (behind v2) |
| 201 | 1 | 2 | Turn 2 | yes |
| 202 | 2 | 2 | Turn 2 | yes |
| 203 | 3 | 1 | Turn 3 | yes |
| 204 | 4 | 1 | Turn 3 | yes |
| 205 | 4 | 2 | Turn 3 | duplicate of 204 |

Root cause: `createStreamingContext` sets `imageCounter.next = getImageCount() + 1`. If the previous turn's `finalizeGeneration` (running in the alarm handler) hasn't committed images to D1 yet when the next turn's `createStreamingContext` queries, the counter starts at 1 instead of 3. The alarm handler and WS message handler interleave at `await` points in the DO.

### Bug 3: Duplicate Image Row (SDK Double-Yield)

ids 204 and 205 are identical — same campaign, same index, same file_path, same timestamp. The SDK yields each message twice (streaming + final), and the streaming parser processed both, creating two rows. The `processedFilenames` dedup didn't catch it because both arrived in the same batch or the check was bypassed.

### Bug 4: Triple Cancel Charge (from earlier test, pre-fix)

`campaign_mnk0akmd6dutr5` had 3 cancel entries at 07:33:46 ($0.75 each = $2.25 for 1 image). The `cancel_${Date.now()}` requestId created unique IDs that bypassed the `UNIQUE(campaign_id, request_id)` constraint. This was the OLD container code — the Session 63 fix (`this.currentRequestId || cancel_${campaignId}`) was deployed but the container hadn't picked up the new image yet.

## What We Fixed

### Fix 1: Billing Formula — Consistent Distinct Count
**`campaign-session.ts` finalizeGeneration**

Replaced the mixed row-count/distinct-count formula with a single `getImageCount()` call (DISTINCT) on both sides:
```javascript
// NEW — both sides use COUNT(DISTINCT image_index)
const currentImageCount = await db.getImageCount(this.env.DB, campaignId);
const imagesThisTurn = Math.max(0, currentImageCount - this.preGenImageCount);
```

Also fixed the `complete` event's `imageCount` field and simplified `isFollowUp` detection to just `this.preGenImageCount > 0`.

### Fix 2: Image Counter — MAX(image_index) + DO Storage
**`images.ts` + `campaign-session.ts` createStreamingContext**

New `getMaxImageIndex()` function returns `COALESCE(MAX(image_index), 0)`. The counter now uses `MAX` instead of `COUNT` — ensures new images always get indexes beyond any existing one.

To survive the alarm/handler race, the counter also checks DO storage:
```javascript
const storageKey = `maxImageIndex:${campaignId}`;
const storedMax = (await this.state.storage.get<number>(storageKey)) || 0;
const dbMax = await db.getMaxImageIndex(this.env.DB, campaignId);
const maxIndex = Math.max(storedMax, dbMax);
const imageCounter = { next: maxIndex + 1 };
```

`finalizeGeneration` persists the max index after image insertion:
```javascript
await this.state.storage.put(`maxImageIndex:${campaignId}`, currentMaxIndex);
```

Namespaced by `campaignId` to prevent cross-campaign leaks (DO is per-user, not per-campaign).

### Fix 3: Duplicate Row Prevention
**`images.ts` addCampaignImage**

Early return if the exact `file_path` already exists for the campaign:
```javascript
const dup = await db.prepare(
  `SELECT * FROM campaign_images WHERE campaign_id = ? AND file_path = ? LIMIT 1`
).bind(campaignId, filePath).first();
if (dup) return dup;
```

### Fix 4: Reconciliation Index in finalizeGeneration

`finalizeGeneration`'s image insertion now uses `getMaxImageIndex() + 1` instead of `existingImages.length + imagesAdded + 1`:
```javascript
let nextIndex = (await db.getMaxImageIndex(this.env.DB, campaignId)) + 1;
// ...
const imageIndex = nextIndex++;
```

## Files Changed

| File | Lines | Changes |
|------|-------|---------|
| `cloudflare/src/db/images.ts` | +15 | `getMaxImageIndex()`, file_path dedup in `addCampaignImage` |
| `cloudflare/src/db/index.ts` | +1 | Export `getMaxImageIndex` |
| `cloudflare/src/durable-objects/campaign-session.ts` | +25/-11 | Billing formula, image counter with DO storage, reconciliation index, isFollowUp simplification |

## Deployed & Verified

**Staging:** `66038363` at `https://creative-agent-staging.alphasapien17.workers.dev`

**Verification (3 follow-ups on the same Gonoise campaign):**
- Images got indexes 5, 6, 7 — all version 1, no overwrites, no duplicates
- Billing: 1 image per turn, correct multiplier math, balance matches
- DO storage persistence: counter survived across all 3 turns

**Commits:**
- `05fa233` — Session 63 credit system (staged files that were previously uncommitted)
- `316f331` — This session's billing + image index fixes

## Known Issues Still Open

1. **Old corrupted data** — The Gonoise campaign still has the pre-fix mess (index 1,2 with version 2 overwrites, index 4 duplicate). Could clean up manually in D1 but not critical since it's test data
2. **Inline images in chat disappear on refresh** — Images shown via WS events during streaming are ephemeral. On refresh, messages load from D1 (text only). Gallery is fine
3. **Production not deployed** — All changes are staging only. Production needs:
   - Client build: `npm run build:production`
   - Deploy: `npx wrangler deploy --env production`
   - D1 schema migration (usage_log + user_credits tables)
4. **Local dev server has hardcoded COST_MULTIPLIER** — Should import from shared constant
5. **CampaignSession alarm exception** (12:08:04Z) — Alarm crashed with empty `exceptions[]` and no logs. Root cause unknown. Didn't block generation but prevented tail log flushing. May need better error reporting in alarm handler
6. **Staging deploy gotcha** — Must use `npm run build:staging` (not `npm run build`) or Clerk breaks silently. `npm run build` defaults to production mode → loads `.env.production` → `pk_live_*` key domain-locked to creativemachines.xyz → login fields don't render, only a console error visible

## How to Verify After Future Changes

```bash
# Reset credits
npx wrangler d1 execute creative-agent-db --remote --env staging --command="UPDATE user_credits SET balance_usd = 5.0, total_spent_usd = 0, total_generations = 0 WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J'"

# Check credits after test
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT * FROM user_credits WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J'"

# Check usage log
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT request_id, event_type, image_count, total_cost_usd FROM usage_log WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J' ORDER BY created_at DESC LIMIT 10"

# Check images (look for: sequential indexes, all version 1, no duplicate file_paths)
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT image_index, version, file_path, created_at FROM campaign_images WHERE campaign_id = '<CAMPAIGN_ID>' ORDER BY created_at"

# Verify billing math: (claude_cost_usd + image_count * 0.15) * 4 = total_cost_usd
```
