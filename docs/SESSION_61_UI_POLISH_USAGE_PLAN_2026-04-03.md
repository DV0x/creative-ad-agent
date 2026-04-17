# Session 61 — UI Polish + Usage Tracking Plan (2026-04-03)

## What We Did

### 1. Smart Campaign Naming (`5215228`)

**Problem:** Campaign names in the sidebar were awkwardly truncated from the user's prompt. For input `"create 2 ads for https://traya.health/ targeting the hairloss people above 30+"`, the header showed `"/ targeting the hairloss people above 30+"`.

**Root cause:** Three layers of regex extraction fighting each other:
- `extractBrandAndName()` (client, `useWebSocket.ts`) stripped the URL but left `"Create 2 ads for / targeting..."`
- `formatCampaignName()` (client, `utils.ts`) stripped the prefix, leaving `"/ targeting..."`
- `extractCampaignName()` (server, `types.ts` + `websocket-handler.ts`) only extracted domain name `"Traya"`

**Fix:** Rewrote all three naming functions (client + both servers) with a shared approach:
- Strip common command prefixes (`create/make/generate X ads for`)
- Extract brand from domain
- Use remaining text as brief
- Format: `"Brand — Brief"` or `"Brand Ads"` if no brief
- `formatCampaignName()` simplified to just truncation (names are already clean)

**Examples:**
| Input | Before | After |
|---|---|---|
| `create 2 ads for traya.health/ targeting 30+` | `/ targeting the hairloss people above 30+` | `Traya — Targeting the hairloss people above 30+` |
| `make ads for bombayshirts.com - festive collection` | `Bombayshirts` | `Bombayshirts — Festive collection for Diwali` |
| `nike.com` | `Nike` | `Nike Ads` |

**Files:** `client/src/hooks/useWebSocket.ts`, `client/src/lib/utils.ts`, `cloudflare/src/lib/types.ts`, `server/lib/websocket-handler.ts`

### 2. Hide Empty State During Generation (`5215228`)

**Problem:** "No images yet" empty state showed alongside skeleton cards during generation.

**Fix:** One-line change in `ResultsView.tsx` — added `!isGenerating` condition to the empty state render check.

### 3. Sidebar Polish (`b384f81`)

**Changes:**
- Replaced `SparklesIcon` with minimal dot indicators for campaigns (coral when active, muted when not)
- Right sidebar (chat) defaults to 480px (max width) instead of 256px
- Added `RIGHT_SIDEBAR_DEFAULT_WIDTH = 480` constant

**Files:** `client/src/components/assets/AssetDrawer.tsx`, `client/src/components/layout/AppLayout.tsx`

### 4. Deployed to Both Environments

- Top-level: `creative-agent.alphasapien17.workers.dev` (version `c86ec731`)
- Production: `creativemachines.xyz` (version `b7f44454`)

---

## What We Planned

### Usage Tracking & Credit System

Detailed plan saved to `docs/usage-tracking-credit-system-plan.md`.

**Per-generation cost breakdown:**
| Component | Cost |
|---|---|
| Claude API (Haiku 4.5, ~250K input + ~45K output tokens) | ~$0.48 |
| fal.ai Nano Banana Pro (6 images x $0.15) | ~$0.90 |
| Cloudflare infra (container, D1, R2) | ~$0.01 |
| **Total** | **~$1.39** |

**Billing model decided:**
- Deduct actual cost AFTER successful completion (like Runway ML, Leonardo.ai)
- Pre-flight: `balance > 0` check before every generation/follow-up
- Cancelled/failed generations = no charge
- New users get $5.00 free balance
- If generation costs more than balance → allow overdraft (max ~$1.50), block next gen
- `maxBudgetUsd: 3.0` as hard safety cap on agent SDK

**Industry research:** Runway deducts on completion with auto-refund on failure. Leonardo.ai shows cost before clicking. Replicate bills post-completion with prepaid balance. ChatGPT/Jasper use flat subscriptions.

**Key architecture decisions:**
- SDK `result` message provides `total_cost_usd` — exact cost, no estimation needed
- Per-turn `assistant` messages have `message.usage.input_tokens/output_tokens` for granular tracking
- Image cost tracked separately: `image_count × $0.15`
- Cost logging is best-effort — failure doesn't block generation completion
- Two new D1 tables: `user_credits` (balance per user) + `usage_log` (cost per generation)

---

## Commits

| Hash | Description |
|---|---|
| `5215228` | fix: Smart campaign naming + hide empty state during generation |
| `b384f81` | fix: Sidebar polish — dot icons, chat panel defaults to max width |

## Not Yet Implemented

- Usage tracking & credit system (plan ready, implementation pending)
- Production Clerk setup (still on test keys)
- Stripe integration (future — after credit system is built)
