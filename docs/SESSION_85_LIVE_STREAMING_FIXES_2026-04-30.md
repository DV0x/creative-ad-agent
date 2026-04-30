# Session 85 — Live streaming fixes (research + images), continued from Session 84

**Date:** 2026-04-30 (same calendar day as S84; second session)
**Branch:** `new-ui`
**Staging:** ✅ deployed twice this session — final version `e2ac988d` (verified end-to-end)
**Production:** ⏸️ pending — both staging tests (S84 + S85) green; prod push deferred to next session
**Node version required for deploy:** **v20** (Node 23 still broken — `nvm use 20`)

> This doc is a **consolidated handover** covering:
> 1. S84 carry-over (payment gating + signup→checkout flow + pricing investigation)
> 2. S85 work (live streaming fixes: research + images)
> 3. The full punch list to land in the next session: production deploy, architecture doc updates, and remaining follow-ups.
>
> Read it once and you have everything for the next session.

---

## Combined TL;DR (S84 + S85)

| Area | What changed | Verified? |
|---|---|---|
| **S84: Top-up gate** | Subscriber-only at `payments.ts:87-114`. $5 wedge for cold traffic (single-use via `payment_events` lookup). | ✅ deploy `7e6737c6` |
| **S84: Signed-out CTA flow** | Pricing CTAs → `/sign-up?plan=…` → `/checkout/init` → Dodo. SessionStorage primary, URL fallback. | ✅ |
| **S84: Path-based Sign-In/Up** | `/sign-in` → `<ClerkSignIn>`; `/sign-up` → `<ClerkSignUp>`. Both forward `forceRedirectUrl=/checkout/init`. | ✅ |
| **S84: Post-payment workspace** | Lands on `/workspace?welcome=starter\|pro` with 6s `WelcomeBanner` toast. Self-strips URL param. | ✅ |
| **S84: Cancel handling** | Dodo `cancel_url` → `/?upgrade-cancelled=plan-interval` or `/?topup-cancelled=amount`. `ResumeUpgradeBanner` re-launches. | ⏳ not exercised in test |
| **S84: TopupModal locked state** | Free-tier users see lock + "See plans" / "Try one campaign · $5". Server-side 403 surfaced inline. | ✅ |
| **S84: Admin grant tooling** | `CLAUDE.md` SQL recipe for design-partner manual D1 grants. | ✅ documented |
| **S85: Research streams live** | `agent-runner.ts` now surfaces subagent tool_use blocks (research subagent's `Write`) so the parser emits `file` events mid-flight. | ✅ deploy `e2ac988d`, end-to-end on fresh account |
| **S85: Images stream one-by-one** | `orchestrator-prompt.ts` instructs one `nano-banana` call per prompt (was: batches of up to 3). Each image arrives as its own `tool_result` → individual WS event + D1 row. | ✅ verified 3-image run, distinct timestamps |
| **S85: Pipeline guardrail** | Prompt explicitly forbids re-running research / hooks / art-style between image calls — fixes orchestrator looping caused by aggressive "one per prompt" instruction. | ✅ |

---

## Commits to push (in order)

```
ec95d36 feat(payments): subscriber-only top-up gate, $5 wedge, signed-out signup→checkout flow      ← S84
b4e2b36 fix(auth): wrap openTopupModal click handler to fix TS build                                ← S84
42ebccf fix(landing): clarify Starter/Pro credit-bonus copy is monthly-only                         ← S84
d8b41bb feat(landing): refresh hero copy, before/after, footer tagline                              ← pre-S84
f9cb082 chore(gitignore): ignore env files, build caches, and root uploads                          ← pre-S84
28f93b1 fix(agent): stream research live + one-image-per-call to unblock live UI                    ← S85
```

`28f93b1` is the only commit added during S85.

---

# Part 1 — S84 carry-over (full reference)

## What S84 shipped

### Server (Cloudflare worker)

**`cloudflare/src/routes/payments.ts`** — top-up gate + cancel URLs.

```ts
// payments.ts:87-114 — the actual lock
const subscription = await getSubscription(env.DB, userId);
const plan = subscription?.plan ?? 'free';
const status = subscription?.status ?? 'active';
const isActiveSubscriber =
  (plan === 'starter' || plan === 'pro') && status === 'active';

if (!isActiveSubscriber) {
  if (amount !== 5) {
    return Response.json(
      { success: false, error: 'Top-ups require an active Starter or Pro subscription.' },
      { status: 403 }
    );
  }
  // Single-use $5 trial: payment.succeeded only fires for top-ups.
  // Its presence for this user means the wedge has already been used.
  const prior = await env.DB.prepare(
    `SELECT 1 FROM payment_events WHERE user_id = ? AND event_type = 'payment.succeeded' LIMIT 1`,
  ).bind(userId).first();
  if (prior) {
    return Response.json(
      { success: false, error: 'Trial already used — subscribe to Starter or Pro for more top-ups.' },
      { status: 403 }
    );
  }
}
```

Both `/checkout` and `/topup` now pass `cancel_url` to Dodo. **Verified field name `cancel_url` (snake_case)** against the Dodo Checkout Sessions docs. Bonus: `return_url` auto-receives `payment_id`, `subscription_id`, `status`, `license_key`, `email` as query params on success — could let us skip polling on `/checkout/success` later.

### Client (React)

- **`Pricing.tsx`** — `PLANS` array got `id: 'starter' | 'pro'`. `handlePlanCTA(planId)` and `handleWedgeCTA()` stash intent in `sessionStorage` and route signed-out users to `/sign-up?...`. Top-up grid replaced with single "Try one campaign · $5" wedge.
- **`SignIn.tsx`** — path-based form selection. `/sign-in` → `<ClerkSignIn>`, `/sign-up` → `<ClerkSignUp>`. `postAuthRedirectUrl()` returns clean `/checkout/init` (no query string — see Clerk risk note below).
- **`App.tsx`** — three new pieces:
  1. `CheckoutInit` (~50 lines): wires `setTokenGetter`, reads `pendingCheckout` (sessionStorage primary, URL fallback), fires `paymentsApi.checkout` for plans or `paymentsApi.topup` for the $5 wedge.
  2. `WelcomeBanner` (~40 lines): mounted at root next to `PricingModal`/`TopupModal`, reads `?welcome=starter|pro`, shows celebration toast for 6s, strips URL via `replaceState`.
  3. `CheckoutSuccess` got the same `tokenGetter` fix and now redirects to `/workspace?welcome=...`.
- **`TopupModal.tsx`** — locked state for free users with "See plans" + "Try one campaign · $5" CTAs.
- **`LandingPage.tsx`** — `ResumeUpgradeBanner` reads `?upgrade-cancelled=plan-interval` and re-launches checkout in one click.

### Memory + docs

- `CLAUDE.md`: added "Manual Credit Grants" section with the wrangler D1 SQL.
- `pricing_subscription_plan.md` (auto-memory): full rewrite reflecting subscriber-only top-up policy.
- `MEMORY.md`: index updated.

## S84 bugs found and fixed

### Bug 1 — `tokenGetter` was null on `/checkout/init` (CRITICAL)

`setTokenGetter` was wired only inside `AuthenticatedApp` (`App.tsx:341`). For the path-based router, `CheckoutInit` and `CheckoutSuccess` render *outside* `AuthenticatedApp` — so the `apiFetch` calls had no Authorization header → 401.

**Fix:** both `CheckoutInit` and `CheckoutSuccess` now call `setTokenGetter(...)` themselves at the top of their effect, using `useAuth().getToken`.

### Bug 2 — `WelcomeBanner` never rendered

The banner was nested inside `<EmptyState />` which only mounts when `appState === 'creating-campaign'`. Post-payment users land on `'workspace'` → `<ResultsView />` → banner never mounts.

**Fix:** Moved `<WelcomeBanner />` to the root next to `<PricingModal />` / `<TopupModal />`.

### Bug 3 — `ResumeUpgradeBanner` parsed cancel param wrong

`cancel_url` carries `starter-monthly` (full plan-interval string), banner was treating it as just plan. Caught pre-deploy.

### Hardening — Clerk `forceRedirectUrl` query-string risk

Past Clerk issues (clerk/javascript#2440, #3796) show query params getting stripped in some flows. Mitigation: persist plan/interval via `sessionStorage` (primary) with URL fallback. `forceRedirectUrl` is a clean `/checkout/init` (no query) — bypasses Clerk's query handling.

## S84 pricing math investigation (still NOT settled)

**Measured campaign (`campaign_mol59kh6kt5vrr`):**

| Event | Claude COGS | Image COGS | Images | Charged | Credits | Duration |
|---|---|---|---|---|---|---|
| 1 (text only) | $0.0468 | $0.00 | 0 | $0.187 | 1.87 | 12s |
| 2 (image gen) | $0.0147 | $0.30 | 2 | $1.259 | 12.59 | 60s |
| **TOTAL** | **$0.062** | **$0.30** | **2** | **$1.45** | **14.5 cr** | 72s |

**Extrapolated 6-image:** raw COGS $0.96 → charged @ 4× = $3.84 = ~38 credits. Matches landing copy "~37 credits per fresh 6-image campaign."

**Implied per-plan capacity:**
- Starter ($19, 275 credits) → 7.2 campaigns → matches "≈ 7 full campaigns" copy ✓
- Pro ($49, 900 credits) → 23.7 campaigns → matches "≈ 24 full campaigns" copy ✓
- $5 wedge (50 credits) → 1.3 campaigns → matches "1 full pack" copy ✓

**Implied gross margins (worst case):**
- Starter: $19 − $6.84 = **64% margin**
- Pro: $49 − $22.51 = **54% margin**

**Why NOT settled:**
1. Only 2 of 6 images generated (image-skip bug, see "Open follow-ups" below) — measurement might be unrepresentative.
2. One earlier 6-image campaign showed $1.59 raw COGS (n=1), not $0.96. Real campaigns may include more research iteration.
3. User's prior estimate was Claude $0.50–$0.80/research+hooks — much higher than measured $0.06.
4. Need 3–5 successful 6-image runs to ground the math (note: image-skip bug should be **fixed by S85** since live streaming + persistence both work now — re-run with confidence).

**Action for next session:**
- [ ] Run 3–5 successful 6-image campaigns (now possible after S85 fixes)
- [ ] Average actual raw COGS, compute std dev
- [ ] If real average is closer to $1.55: drop COST_MULTIPLIER 4 → 2.5 (margin ~60%, copy stays accurate) or update copy
- [ ] DO NOT switch to a cheaper image model (user explicitly rejected; quality > margin)

---

# Part 2 — S85 work (live streaming fixes)

## The problem

User reported, on **every campaign** post-S65 streaming refactor (Apr 5):

1. **Research never rendered live during the run.** Only appeared after page refresh post-completion.
2. **Images never streamed individually during the run.** All 6 (or however many) appeared at once after the agent finished.

User's initial theory: "fresh-user-account-only issue." That theory was disproved by reproducing on the same account's second campaign.

## Investigation timeline

1. **First pass — fresh account test, brief "Muscleblaze whey protein" (`campaign_mol8j0ayx1cd0g`).** User cancelled at minute 8. D1 had research empty, hooks/prompts populated, 0 image rows. R2 had 3 orphaned images.
2. **Second pass — same account, "Optimumnutrition" (`campaign_mola60zxdfbsez`).** Same pattern: research empty, images orphaned. Disproved fresh-user theory.
3. **Third pass — "Guardian whey protein" (`campaign_molat687fo6wad`), let it run to completion.** All files populated, 11 image rows, status=`complete`. **But user had to refresh** to see research render — confirming the bug is in the live render path, not persistence.
4. Investigation traced to `cloudflare/src/durable-objects/campaign-session.ts:1540` comment:
   > `// Stream = live UI updates only. Completion = alarm-based turn-result.json polling.`
5. Cross-referenced with prior sessions: **S29** (research empty, SSE framing), **S45** (hooks empty, Skill internal Writes invisible), **S56** (research not visible despite D1 content), **S65** (streaming refactor — moved tool detection from assembled messages to stream events).

## Root causes

**Research live-render gap:**
- Research is produced by a **subagent** (Task tool with `subagent_type: research`).
- Subagent runs in its own SDK context. Its `Write` tool call appears in the parent iterator only as a fully-assembled `assistant` message with `parent_tool_use_id` set.
- S65 streaming refactor introduced this skip in `agent-runner.ts:381`:
  ```ts
  if (message.type !== 'assistant') {
    process.stdout.write(JSON.stringify(message) + '\n');
  }
  ```
  …to avoid double-emitting text streams. But it also dropped subagent assistant messages, so the parser never saw research's `Write`.
- Hooks and prompts persisted because they're produced by **Skills** (inline in orchestrator's context) — their `Write` tool_use blocks fire stream_events the parent iterator does receive.
- End-of-turn `turn-result.json` reconciliation (`agent-runner.ts:235-253` reads files from disk) DID save research to D1 — but only at end-of-turn, no live `file` event to client. User had to refresh.

**Image batching gap:**
- `orchestrator-prompt.ts` previously said *"Call MCP in batches of up to 3 as needed."*
- Orchestrator obediently batched: one `nano-banana` call with `prompts: [a, b, c]` → one `tool_result` after all 3 generated → parser emits 3 `image` events at once.
- User saw all images appear together at the very end of the run.

## Fixes shipped (commit `28f93b1`)

### Fix 1 — `cloudflare/sandbox/agent-runner.ts`

Added a synthesis block: any assistant message with `parent_tool_use_id` set (= came from a subagent) gets its `tool_use` blocks emitted as synthetic `tool_use_event` lines to stdout.

```ts
// Surface tool_use blocks from SUBAGENT assistant messages only. Subagents
// (e.g. research via Task tool) run in their own SDK context — their
// content blocks never produce stream_events in the parent iterator, so
// their Write calls stay invisible to the parser without this. Filtering
// by parent_tool_use_id (set by the SDK on subagent messages, null on the
// orchestrator's own messages) avoids double-emit for orchestrator tools
// that already fire via stream_event content_block_stop.
if (message.type === 'assistant' && (message as any).parent_tool_use_id) {
  const content = (message as any).message?.content;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (block?.type === 'tool_use') {
        process.stdout.write(JSON.stringify({
          type: 'tool_use_event',
          name: block.name,
          id: block.id,
          input: block.input,
        }) + '\n');
      }
    }
  }
}
```

**Why filter by `parent_tool_use_id`:** orchestrator content blocks already fire stream_events → parser already sees them. Subagent content blocks only arrive as assembled assistant messages. The two sources are disjoint, so no dedup is needed and no double-emit possible.

### Fix 2 — `cloudflare/sandbox/orchestrator-prompt.ts`

Rule 2 strengthened:
> **The pipeline runs ONCE, in order: research → hooks → art → images.** Each upstream step (research, hook-methodology Skill, art-style Skill) is invoked exactly once per turn. The only step that repeats is the nano-banana call inside "images" — see rule 6. Do NOT re-run research, hook-methodology, or art-style between or after image calls.

Rule 6 restructured:
> **Image generation step ONLY** (after research/hooks/art-style have each run once and produced their files):
> - Read `prompts.json` once.
> - Determine N: default 6 for new campaigns (max 6). For follow-ups, match the previous image count unless the user specifies otherwise.
> - Make N separate calls to `mcp__nano-banana__generate_ad_images`. Each call passes a single-element array: `prompts: [oneStringFromPromptsJson]`. Calls run sequentially (one finishes before the next starts).
> - Why one-per-call: each image streams to the user as it finishes. Batching multiple prompts in one call hides progress until the whole batch completes.
> - You do NOT need to re-read `prompts.json` between calls. You do NOT need to re-run any earlier step between calls. Just keep calling `generate_ad_images` with the next prompt until you've made N calls, then stop.

Example block updated to make the loop pattern explicit and add the "do NOT re-run earlier steps" guardrail.

## Why the orchestrator-prompt guardrail was needed

First attempt at fix 2 used aggressive wording (*"ONCE PER PROMPT — pass a single-element prompts array each call"*). This caused the LLM to **loop the entire pipeline** (parse → hooks → art) before each image call — visible as duplicate "Writing 6 ad hooks", "Crafting art direction" entries with "Parsing Request" reappearing in the screenshot. Fixed by:
1. Strengthening rule 2 to cap each upstream step at "exactly once per turn."
2. Adding explicit "Do NOT re-run any earlier step between calls" reminder in rule 6.
3. Showing the pattern in the example with literal `[Call generate_ad_images with prompts: [prompt1] — wait for completion]` lines.

## Why the first attempt at the agent-runner fix needed a redo

The initial cut used a `Set<string>` to dedup tool_use IDs across both the stream_event path AND a "synthesize for ALL assistant messages" path. In practice this caused:
- Duplicate phase entries in the UI (each Skill call emitted twice, parser opened two thinking blocks)
- Hooks empty in D1 on one run (suspected: race where synthesis fired with partial input before stream_event finished accumulating, but exact mechanism wasn't pinned down)

The redo replaced dedup-by-ID with **filter-by-source** (only synthesize for `parent_tool_use_id`-having messages). The two emission paths are now non-overlapping, so no race is possible. This is the version that shipped.

## Verification

**Final test on a fresh account (`user_3D4sjV7W4Ii5Jgs7FMmkOcKz3Vy`), 3-image run, brand "Muscletech":**

D1 state on completion (`campaign_molh5ov7rfy8hf`, status=`complete`):

| File | is_ready | content_len |
|---|---|---|
| research | 1 | 3,759 |
| hooks | 1 | 3,725 |
| prompts | 1 | 7,146 |

Image rows (`campaign_images`):

| index | hook_type | timestamp prefix in path | created_at |
|---|---|---|---|
| 1 | stat | `1777553186495` | 12:47:14 |
| 2 | story | `1777553238070` | 12:48:03 |
| 3 | fomo | `1777553286828` | 12:49:18 |

**Three distinct timestamp prefixes** = three separate `nano-banana` calls (each call captures `Date.now()` at start). 49–75s gaps between images = sequential, not batched. Pipeline ran once, no duplicate phases observed in the UI.

---

# Part 3 — Next session punch list

## A) Production deploy (highest priority)

Staging is stable on `e2ac988d`. Both S84 and S85 changes are bundled in commits `ec95d36..28f93b1`. Sequence:

```bash
# 1. Sanity check — make sure new-ui is pushed and CI is green
git push origin new-ui

# 2. Switch to Node 20 (Node 23 still broken — same miniflare/undici regression as S83)
nvm use 20

# 3. Build client for production
cd client && npm run build:production

# 4. Docker prep — wipe builder cache to avoid layer reuse weirdness
docker logout registry.cloudflare.com
docker builder prune -af

# 5. Deploy
cd ../cloudflare && npx wrangler deploy --env production
```

Total ~6 min. Production worker URL: `creativemachines.xyz`.

After deploy, verify:
- `curl -s https://creativemachines.xyz/health | python3 -m json.tool`
- Spot-check D1: `npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT COUNT(*) FROM campaigns WHERE created_at > datetime('now', '-1 hour');"`
- Run one self-paid test campaign on creativemachines.xyz (~$5 wedge) to validate the live streaming on production traffic.

## B) Architecture doc updates (the user explicitly asked for this)

The architecture docs at `docs/architecture/` predate both the payment system AND the streaming refactor. Cleanest follow-ups:

1. **`docs/architecture/INDEX.md`** — add entries for:
   - Payment / billing flow
   - Streaming pipeline (post-S65 + post-S85)

2. **New doc — `docs/architecture/PAYMENT_FLOW.md`:**
   - Cold-traffic flow: landing CTA → `/sign-up?plan=…` → Clerk → `/checkout/init` → Dodo → `/checkout/success` → `/workspace?welcome=…`
   - In-app flow: signed-in user → PricingModal → `paymentsApi.checkout` → Dodo
   - $5 wedge flow: signed-out → `/sign-up?wedge=1` → Clerk → `/checkout/init` → topup checkout
   - Cancel flow: Dodo `cancel_url` → landing with `?upgrade-cancelled=…` → `ResumeUpgradeBanner`
   - Server-side gating: subscriber-only top-up + single-use $5 trial enforcement via `payment_events` lookup
   - Webhook handling: `subscription.active` (state only), `subscription.renewed` (credit grant), `payment.succeeded` (top-up grant), `refund.succeeded` (pool-aware reversal)

3. **New doc — `docs/architecture/STREAMING_PIPELINE.md`:**
   - The two emission paths and why they exist:
     - Stream-event path (orchestrator content blocks) — fires `tool_use_event` from `content_block_stop`
     - Subagent assistant-message synthesis path (filtered by `parent_tool_use_id`) — fires `tool_use_event` from assembled assistant messages
   - The `// Stream = live UI updates only. Completion = alarm-based turn-result.json polling.` invariant from `campaign-session.ts:1540`
   - Live UI render flow vs end-of-turn reconciliation flow
   - When each path is the source of truth (live = stream events; canonical D1 state = end-of-turn reconciliation)
   - Lessons from S29 / S45 / S56 / S65 / S85 — the recurring pattern of "subagent or skill writes that don't reach the parser"

4. **Update `docs/architecture/DATA_MODEL.md`:**
   - Add `user_credits`, `user_subscriptions`, `payment_events`, `usage_log` table descriptions
   - Note plan pool vs top-up pool distinction (plan resets on renew/expire; top-up is permanent)

5. **`docs/architecture/CREDITS_AND_USAGE.md`** (if exists; create if not):
   - Plan pool vs top-up pool semantics
   - `COST_MULTIPLIER` (currently 4)
   - Per-event vs per-campaign cost recording
   - Pricing-math investigation status (link to S84 section)

## C) Open follow-ups (not blocking deploy)

### From S84 (still open)

- **Image-skip bug investigation** — task #11 in S84. Was: `campaign_mol59kh6kt5vrr` finalized with all files `is_ready=1` but only 2 of 6 images. **S85 may have fixed this incidentally** (the streaming pipeline was the broken bit), but worth a verification run.
- **Workspace empty-state UX for first-time paying users** — landing on `/workspace` with 0 campaigns shows `<ResultsView />` "Select a campaign to view images" — terrible first-time UX. Tweak in `App.tsx:309-313`: show `<EmptyState />` when `campaigns.length === 0` regardless of `appState`.
- **Generation status indicator stuck during research** — progress UI doesn't reflect `msg.type=trace` events. Consider streaming a "still thinking" indicator after N seconds of silence on the WS.
- **Curl-bypass tests for top-up gate** — never executed end-to-end:
  - free user → `$10` → expect 403
  - free user → `$5` first time → expect 200
  - free user → `$5` second time → expect 403 with "trial already used"
- **Cancel flow** never observed firing in test — `cancel_url` → `ResumeUpgradeBanner` round trip not exercised.
- **Decline-card test** (`4000 0000 0000 0002`) not run.

### From S83 (carry-over)

- **Add `.nvmrc`** to pin Node 20 — still not done.
- **Pin / upgrade miniflare** to a version without the undici regression — still relying on Node 20 workaround.
- **BeforeAfter cost-per-creative claim** still inflated by ~6× (S82/S83).
- **Terms / Privacy / Image-IP pages** still don't exist.

### From S85 (newly open)

- **Orphaned R2 images** under the old test user `user_3D4PSvICNuOGs8dMp7exTc1qUmv` — 4 stragglers in `users/.../images/` from the cancelled-test runs, no `campaign_images` row references them. Optional cleanup; not user-facing because no code paths surface them.
- **Pricing math re-measurement** — now possible since live streaming + persistence work end-to-end. Run 3–5 successful 6-image campaigns and compute average raw COGS.

### Polish (low priority)

- 5-marketer DM panel for new H1 + sub copy (S83 carry-over)
- PostHog instrumentation for new H1 (S83 carry-over)
- Cal.com event setup — IST timezone, intake fields (S82/S83 carry-over)
- Curated eval set — 25–30 D2C brand URLs for baseline + LLM-as-judge

---

## D) Decisions explicitly NOT taken (so we don't relitigate)

- ❌ **Don't switch to a cheaper image model** to fix margins — quality matters; nano-banana-pro stays.
- ❌ **Don't auto-grant credits on signup** — hard paywall + manual D1 grants for design partners is the cold-launch policy.
- ❌ **Don't include `docs/scratchpad.md` or untracked research files in commits** — per S83 / standing user direction.
- ❌ **Don't revisit Free / Starter / Pro tier prices** — capacity-per-dollar question only, not pricing levels.
- ❌ **Don't try to dedup tool_use IDs across stream_event + assistant paths** (S85) — filter-by-source via `parent_tool_use_id` is the cleaner architectural answer.

---

## E) Files modified across S84 + S85

```
S84:
M  CLAUDE.md                                          (admin grants section + tables)
M  cloudflare/src/routes/payments.ts                  (subscriber-only gate + cancel_url)
M  client/src/App.tsx                                 (CheckoutInit + WelcomeBanner + auth fix)
M  client/src/components/auth/SignIn.tsx              (path-based sign-in vs sign-up)
M  client/src/components/landing/LandingPage.tsx      (ResumeUpgradeBanner)
M  client/src/components/landing/Pricing.tsx          (signed-out CTA + $5 wedge)
M  client/src/components/pricing/TopupModal.tsx       (locked state for free users)
M  client/src/components/EmptyState.tsx               (removed inline WelcomeBanner)
+  docs/SESSION_84_…_2026-04-30.md

memory/
M  pricing_subscription_plan.md                       (full rewrite for new policy)
M  MEMORY.md

S85:
M  cloudflare/sandbox/agent-runner.ts                 (subagent tool_use_event synthesis)
M  cloudflare/sandbox/orchestrator-prompt.ts          (one nano-banana call per prompt + guardrails)
+  docs/SESSION_85_LIVE_STREAMING_FIXES_2026-04-30.md (this doc)
```

`docs/scratchpad.md` and untracked research / HTML / SDK files remain intentionally excluded.

---

## F) Test data references

If next session needs evidence trails:

| Campaign ID | What it shows |
|---|---|
| `campaign_mol59kh6kt5vrr` | S84 happy path. Research saved (24,875 chars), images saved. Successful `turn-result.json` reconciliation. |
| `campaign_mol8j0ayx1cd0g` | S85 first repro. Cancelled. Research empty, hooks/prompts saved, images orphaned in R2. |
| `campaign_mola60zxdfbsez` | S85 second repro on same account. Same pattern — disproved fresh-user theory. |
| `campaign_molat687fo6wad` | S85 first complete-run test. All files populated post-completion, but research only after refresh — confirmed live-render bug. |
| `campaign_moldlidaxv97ly` | Single-image test post agent-runner fix (deploy `28776058`). Research rendered live ✓. |
| `campaign_moldyd1zigo8ib` | 3-image batch test (deploy `28776058`). All 3 images had same timestamp prefix → confirmed orchestrator was batching. |
| `campaign_molfyrprrnioku` | Post first-orchestrator-prompt-fix (deploy `1510fca6`). Loop bug visible (4× duplicate phases), hooks empty in D1, but images streamed one-by-one. |
| `campaign_molh5ov7rfy8hf` | Final verification on fresh account `user_3D4sjV7W4Ii5Jgs7FMmkOcKz3Vy` (deploy `e2ac988d`). All files populated, 3 distinct image timestamps, no loop. ✅ |

Staging deploy versions in chronological order this session:
- `28776058-8959-4449-99cf-0340f95f20eb` — agent-runner subagent synthesis (initial, with dedup-by-ID)
- `1510fca6-be9b-4752-9f5f-32d4cc1687e8` — orchestrator-prompt batch=1 (caused loop bug)
- `e2ac988d-7dca-4b2b-9480-75cdca31d475` — final, both fixes corrected (filter by `parent_tool_use_id` + pipeline guardrail)
