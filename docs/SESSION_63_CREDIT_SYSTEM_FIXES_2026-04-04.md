# Session 63 — Credit System Fixes & Pricing (2026-04-04)

## What We Did

### 1. Cost Multiplier for Gross Margin
- Added `COST_MULTIPLIER = 4` (75% gross margin) in `cloudflare/src/db/credits.ts`
- Applied in `finalizeGeneration` and `recordCancelledUsage` (cloudflare DO)
- Applied in both generation + follow-up paths (local dev server)
- Raw COGS stored in `claude_cost_usd` + `image_cost_usd` columns, charged amount in `total_cost_usd`

### 2. Follow-Up Image Count Default
- Updated `cloudflare/sandbox/orchestrator-prompt.ts` — 4 occurrences of "default 6" now say "default 6 for new campaigns, match previous count for follow-ups"
- Prevents agent from generating 6 images when user asks to redo 2

### 3. Cancel Credit Deduction
- New `preGenImageCount` instance var set in `createStreamingContext`
- New `recordCancelledUsage()` method — diffs D1 image count, charges `imagesAdded * $0.15 * COST_MULTIPLIER`
- Called in both `runFollowUpFast` and `runGeneration` finally blocks
- Fixed idempotency: uses `this.currentRequestId || cancel_${campaignId}` (not `cancel_${Date.now()}`)

### 4. Cumulative Cost Bug Fix
- SDK's `result.total_cost_usd` is cumulative across the session, not per-turn
- Added `previousCostUsd` tracker in `agent-runner.ts`
- Each turn now writes `turnCost = cumulativeCost - previousCostUsd` to turn-result.json
- Before fix: text-only follow-ups charged ~11 credits. After: ~0.3-0.4 credits

### 5. RequestId Collision Fix
- Cold-start follow-ups killed old agent, started new one whose first turn used `requestId: "initial"`
- Collided with campaign's existing "initial" entry → `INSERT OR IGNORE` treated it as duplicate → $0 charged
- Fix: agent-runner now uses `turn_${Date.now()}` instead of `"initial"` for every first turn

### 6. Image Billing from D1
- `finalizeGeneration` now counts images from D1 (`existingImages.length + imagesAdded - preGenImageCount`) instead of `generated-images.jsonl`
- Streaming parser already persists images to `campaign_images` during generation
- Eliminates dependency on a container file that can fail silently

### 7. Insufficient Credits UX
- Server sends `INSUFFICIENT_CREDITS` error with pre-flight check (balance <= 0)
- Client now calls `closeThinkingBlock` + `failGeneration` → clears spinner, shows error inline in chat
- Removed `setCreditBalance(0)` hack — real balance preserved

### 8. Credits Badge Redesign
- Pill badge with border: `**50** credits` in rounded-md container
- `text-xs font-medium`, number bold, "credits" label muted
- Consistent style regardless of balance

### 9. Error Logging in tryFinalize
- `tryFinalize` catch block was silently swallowing ALL errors (including finalizeGeneration crashes)
- Now logs non-FileNotFound errors: `[finalize] ERROR in tryFinalize: ...`

## Files Changed

| File | Changes |
|---|---|
| `cloudflare/src/db/credits.ts` | `COST_MULTIPLIER = 4`, exported |
| `cloudflare/src/durable-objects/campaign-session.ts` | Import COST_MULTIPLIER, preGenImageCount, recordCancelledUsage, D1 image counting, tryFinalize error logging, cancel idempotency |
| `cloudflare/sandbox/agent-runner.ts` | Cost delta (`previousCostUsd`), unique requestId (`turn_${Date.now()}`), replace all `'initial'` |
| `cloudflare/sandbox/orchestrator-prompt.ts` | Follow-up image count defaults |
| `client/src/hooks/useWebSocket.ts` | INSUFFICIENT_CREDITS: closeThinkingBlock + failGeneration, remove setCreditBalance(0) |
| `client/src/components/auth/UserMenu.tsx` | Credits pill badge redesign |
| `server/lib/websocket-handler.ts` | COST_MULTIPLIER in both gen + follow-up paths |

## Cost Model

- `COST_MULTIPLIER = 4` → 75% gross margin (300% markup)
- `CREDITS_PER_USD = 10` → 10 credits = $1
- Image COGS: $0.15/image (fal.ai)
- Claude COGS: varies (~$0.03 for initial gen on Haiku, ~$0.005-0.01 per follow-up)
- Free trial: $5.00 = 50 credits
- Full generation (2 images): COGS ~$0.33 → charged ~$1.32 → ~13 credits
- Text-only follow-up: COGS ~$0.008 → charged ~$0.03 → ~0.3 credits

## Deployed to Staging

Latest: `cd575533` at `https://creative-agent-staging.alphasapien17.workers.dev`

**Important**: Container reuse means old agent-runner code runs until the container is destroyed. The cost delta fix and requestId fix are in the container image — verify the container picked up the new image by checking if the `dup=true` issue is gone.

## Not Yet Tested (Next Session)

1. **Fresh generation on new campaign** — verify credits deduct with correct image count from D1
2. **Follow-up on same campaign** — verify unique requestId, no duplicate collision
3. **Cancel mid-generation** — verify partial image cost charged, no triple charge
4. **Insufficient credits** — verify spinner clears, error shows in chat, no stuck state
5. **Container image update** — verify new container has the delta fix (check `turnCost` in logs vs cumulative)

## How to Test

```bash
# Reset credits
npx wrangler d1 execute creative-agent-db --remote --env staging --command="UPDATE user_credits SET balance_usd = 5.0, total_spent_usd = 0, total_generations = 0 WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J'"

# Tail logs (JSON for full detail)
cd cloudflare && npx wrangler tail creative-agent-staging --format json

# Check credits after test
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT * FROM user_credits WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J'"

# Check usage log
npx wrangler d1 execute creative-agent-db --remote --env staging --command="SELECT request_id, event_type, claude_cost_usd, image_count, image_cost_usd, total_cost_usd FROM usage_log WHERE user_id = 'user_38uxIJdRftKkSkstogHasnk6c2J' ORDER BY created_at DESC LIMIT 10"
```

## What to Look For in Logs

- `[credits][recorded]` — should show `cogs`, `charged`, `multiplier=4`, `dup=false`
- `[finalize][found]` — should show correct `images` count matching D1
- `[finalize] ERROR` — any new errors from the improved catch block
- `turnCost` in agent traces — should be per-turn delta, not cumulative
- `requestId` in finalize — should be `turn_xxxxx` or `req_xxxxx`, never `initial`

## Known Issues Not Fixed This Session

- **Duplicate image rows in D1** — SDK double-yield causes some images to appear twice (different versions). `processedFilenames` dedup doesn't catch all cases
- **Inline images in chat disappear on refresh** — images shown via WS events during streaming are ephemeral. On refresh, messages load from D1 (text only). Workspace gallery is unaffected
- **Production not deployed** — all changes are on staging only. Production D1 migration + deploy pending
- **Local dev server has hardcoded COST_MULTIPLIER** — should import from shared constant
