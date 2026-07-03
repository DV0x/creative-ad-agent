# Session 82 — Andromeda copy pass, Pricing alignment, Done-for-you section, Footer/Nav cleanup

**Date:** 2026-04-28
**Branch:** `new-ui` (pushed)
**Status:** Landing page is structurally complete and live on `localhost:5173`. Three commits shipped to `origin/new-ui`. **Hero H1 still the placeholder** carried over from Session 81 (`Ship your next winning ad by 4pm.`) — pick this up next session.

This session was: research → copy alignment → pricing rebuild against live billing → new Done-for-you services section → Footer/Nav truth-up → bug fixes.

---

## TL;DR

| Area | Status |
|---|---|
| Hero H1 | ⚠️ Still placeholder. Sub-copy got a one-phrase swap. |
| BeforeAfter | ✅ Andromeda-era vocab seasoning, KPI label, subgrid row alignment, padding-alignment bug fixed |
| Pricing | ✅ Aligned to live billing (Starter $19 / Pro $49, real credits, real top-ups). Top-up CTA bug fixed |
| Done-for-you (`#run-growth`) | ✅ New section shipped, cal.com booking wired |
| FAQ | ✅ Fixed stale free-trial copy, sub para now links to cal.com, added 3 service FAQs |
| Footer | ✅ Three dead-link columns dropped, cal.com CTA added |
| Nav | ✅ "Run growth" link added, "Start free" → "Get started" (no false promise) |
| Cloudflare Dodo per-env config | ✅ Shipped (separate commit) |
| .gitignore cleanup | ✅ Shipped (env, wrangler cache, tsbuildinfo, root uploads) |

---

## What was shipped (works, in repo, pushed to `origin/new-ui`)

### 1. Andromeda research → light vocabulary swap (Option A)

**Research:** `docs/research/andromeda-perf-marketer-vocab.md` — substantive report covering:
- What Andromeda actually is (retrieval engine, NOT a new "algorithm")
- Defensible Tier-1 stats (Meta Engineering blog: 10,000× retrieval complexity, +6% recall, +8% ad quality on selected segments — caveat all from Meta)
- 30+ verbatim phrases from perf marketers (Taylor Holiday, Jon Loomer, Barry Hott, Monica Shukla, etc.) grouped by theme
- Skeptical voices to NOT pretend don't exist (Aazar Ali Shad's "snake oil," Loomer's "retrieval only," Reddit "killed my campaigns" sentiment)
- 5 vocabulary phrases that land for both perf marketers AND D2C founders without overwhelming
- Phrases to AVOID (`AI-powered`, `10,000× model complexity`, `Advantage+`, `MTIA`, `22% ROAS lift`)

**Decision:** **Option A — light vocabulary swap, no Andromeda mention** (rejected: B = single named Andromeda anchor band, C = aggressive KPI-led reframe). Reasons: avoid hype-riding read, avoid alienating Loomer-camp skeptics, naming Andromeda would be a hypothesis-laden bet pre-launch.

**Surgical changes applied:**
- `Hero.tsx` subhead: `ready for Meta and TikTok` → **`diverse enough to feed Meta and TikTok`** (carries `creative diversity` + `feed the algo` framing without naming either)
- `BeforeAfter.tsx` intro: added **`Creative is the targeting now.`** as a one-sentence anchor
- `BeforeAfter.tsx` row label: `Variants per week` → **`Variant velocity`** (perf marketer dialect)
- `BeforeAfter.tsx` After-side row 3: **`30+ a week, or 300. Cap is your budget, not your team.`** — went through 3 revisions:
  1. `30+ creatives, six angles per run.`
  2. `30+ creatives a week. Concept diversity, not 30 reskins.`
  3. `30+ creatives a week. All concept-diverse.`
  4. **Final:** `30+ a week, or 300. Cap is your budget, not your team.` (user pushed for more aggressive ceiling-removal vibe)

**Why we rejected `unlimited` framing** (user asked):
- Pricing tells the truth — Starter 275 credits/mo caps at ~70 single creatives/wk. Saying "unlimited" reads as bait-and-switch.
- "Unlimited" is a perf-marketer red-flag word (every agency uses it).
- The 30+ figure anchors to the BeforeAfter intro line ("Meta and TikTok eat 30+ creatives a month per brand") — replacing with ∞ makes that comparison degenerate.
- Compromise: keep the number, frame the ceiling differently ("Cap is your budget, not your team").

### 2. Pricing rebuilt against the live billing system

**Investigation:** dug through `cloudflare/src/db/credits.ts`, `campaign-session.ts`, Session 63/64 docs, `usage-tracking-credit-system-plan.md`. **Cost model (live, verified):**

```
rawCost = claudeCost + (imageCount × $0.15)
chargedCost = rawCost × COST_MULTIPLIER (4 → 75% gross margin)
credits = chargedCost × CREDITS_PER_USD (10)
```

| Item | Raw COGS | Charged | Credits |
|---|---|---|---|
| 1 image (fal.ai Nano Banana Pro) | $0.15 | $0.60 | **6** |
| Claude (initial gen, Haiku) | ~$0.03 | $0.12 | **~1** |
| Text-only follow-up | ~$0.008 | ~$0.03 | **~0.3** |
| **Full 6-image campaign** | **~$0.93** | **~$3.72** | **~37** |
| Re-roll with 6 new images | ~$0.91 | ~$3.62 | **~36** |

**Subscription value (real):**
- Starter $19/mo → 275 credits → **~7 fresh 6-image campaigns** OR ~46 individual creatives
- Pro $49/mo → 900 credits → **~24 fresh 6-image campaigns** OR ~150 individual creatives
- $19/mo gets $27.50 of charged generation (1.45× multiple); $49/mo gets $90 (1.84×)

**Was wrong on the old landing** (now fixed):
- Old tiers: Solo $29 / Studio $99 / Scale $299 (3 fictional tiers, no Free)
- Old credits: 20 / 100 / 400 "campaigns/month" (made up; no per-campaign constant exists)
- Old yearly toggle: − 20% (real is 16%)
- Old top-up strip: 10/$19, 25/$39, 60/$79 (inverted — $1 = 10 credits, so $19 should buy 190, not 10)

**Now matches `PricingModal.tsx` source of truth:**

| | Starter | Pro |
|---|---|---|
| Monthly | $19 | $49 |
| Yearly equivalent | $16/mo ($192/yr, ~16%) | $41/mo ($492/yr, ~16%) |
| Credits/mo | 275 (250 + 10% bonus) | 900 (750 + 20% bonus) |
| Top-up bonus | none | +20% |
| Badge | — | **Best value** (replaces "Most picked") |

**Per-tier feature lists rewritten** to match real perks (10%/20% credit bonuses, brand research, top-up bonus on Pro, priority queue).

**Free tier dropped from the marketing page** — it exists in `PricingModal.tsx` (0 credits, generation hard-blocked) but doesn't deserve a marketing slot.

**Top-up strip rebuilt** — 4 quick-picks `$5 / $10 / $25 / $50` matching `TopupModal.tsx` `QUICK_PICKS`. Each shows credits + campaign equivalent. Subline: `$5 minimum · Pro +20% on every top-up`.

**Bug fixed: top-up CTAs now open `TopupModal` (not `PricingModal`) with the dollar amount preselected.** Required:
- `store/index.ts`: `openTopupModal(presetAmount?)` accepts optional preset; `topupPresetAmount` state field
- `TopupModal.tsx`: `useEffect` reads `topupPresetAmount` and seeds `amountInput` on open

**Honest footer line** added below the tier grid:
> *Credits meter real usage — research, hooks, and images. A fresh 6-image campaign runs ~37 credits. Plan credits reset monthly; top-up credits never expire.*

### 3. Done-for-you services section (NEW — `client/src/components/landing/DoneForYou.tsx`)

**Why this exists:** the SaaS landing was missing a high-ticket lead-gen surface. User wanted to capture local business + D2C founder retainers (creative production + media buying + landing pages + weekly reporting) using the SaaS as credibility wedge.

**Placement decision:** between Pricing and FAQ (Option C), not in the pricing grid (Option A) and not as a side strip (Option B). Reasons:
- Right moment in the visitor's head: just saw price, asking "do I learn this myself or pay them to run it?"
- Doesn't dilute the SaaS funnel (above-fold hero CTA stays primary path)
- Catches both "too much DIY" and "too cheap to be real" off-ramps
- Easy to A/B remove if leads don't come in

**Section structure:**
- H2 split into two short clauses with two highlight tiers:
  > **We'll run [growth].** *(lime pop block)*
  > **You run the [brand].** *(thin lime underline)*
- Sub paragraph: *"For D2C founders and local business owners with more ad accounts than time. One team, four services, the [full funnel] — so the creative we ship gets spent, tested, and reported on."* (`full funnel` underlined)
- 4-card service grid: Creative production / Media buying / Landing & lead-gen / Weekly reporting
- 3 trust pills (no testimonials needed):
  - Built on the engine you can try yourself
  - Founder-led. No account-manager game-of-telephone.
  - Month-to-month. No lock-in.
- CTA: `Book a discovery call →` opens `https://cal.com/chakra-creative-machines/30-min-creative-growth-audit` in new tab
- Note line beside CTA: `30-min creative & growth audit · no obligation`

**H2 went through 4 rejected drafts before landing:**
1. ❌ `Want us to run it instead?` — "run it" without object reads as "run your business"
2. ❌ `Running a D2C brand or local biz? Want us to run your growth instead?` — too long, overloaded
3. ❌ `Running a D2C brand or local biz? Want us to run your growth instead?` w/ bigger H2 max-width — still bloated
4. ✅ `We'll run growth. You run the brand.` — wins because:
   - Compact (8 words, two clauses)
   - Solves "are you taking over my business?" worry directly via explicit division of labor
   - Matches page rhythm (`Slow. Generic. Guess.` / `Fast. Tested. Yours.`)
   - "Run growth" is perf-marketer dialect

**Eyebrow dropped:** originally `DONE-FOR-YOU · LOCAL + D2C`, then `DONE-FOR-YOU`, finally removed entirely (eyebrows get skimmed; H2 carries it).

**New CSS class: `.lp-pop-underline`** — lighter highlighter stroke (thin lime line under word, can be used 2–3 times per screen vs. `.lp-pop-word`'s max-once block highlight). Section uses one of each: `growth` (block) and `brand` + `full funnel` (underline). Two-tier highlight system now reusable anywhere on the page.

**Section ID renamed `#done-for-you` → `#run-growth`** to match the new nav label.

### 4. Done-for-you naming/CTA decisions

**Section name:** "Done-for-you" → **"Run growth"** in the nav. Reasons:
- Echoes the section H2 verbatim (`We'll run growth`)
- 2 words, tight for nav
- Action-clear (names what we DO, not generic service category)
- Visual rhyme: nav word → lime pop in section

**CTA mechanism (cal.com vs email):** chose Calendly direct booking with intake fields — NOT email-first capture. Reasons:
- Friction filters tire-kickers
- Speed-to-meeting predicts close rate in B2B
- Cal already captures email via booking; no second hop needed

**Calendly setup notes (for the user, not in code):**
- Set Calendly home timezone to **IST** (don't try to set US time and convert manually)
- Availability windows: **Mon-Fri 7-11 PM IST** (catches US East Coast morning + West Coast start) + **Mon-Fri 10 AM-1 PM IST** (Indian clients)
- 30-min meeting length, 15-min buffer, cap 4 calls/day
- DST gotcha: US shifts twice/year, India does not — Calendly auto-converts when set in IST
- Meeting title: **`30-min creative & growth audit`** (value-led, not "discovery call" or "intro chat")
- Event description (set in Calendly):
  > *We'll spend 30 minutes on your brand: your current ad creative, your performance over the last 30 days, and what we'd ship in your first week if we ran growth for you. Bring a screenshot of your Meta ads dashboard if you have one — otherwise just bring your URL.*

**Domain rename to `.ai`:** considered, **rejected**. `.xyz` is a credible modern startup TLD (Alphabet uses `abc.xyz`), `.ai` is being commoditized, switching cost (SEO, links, email, payment systems) outweighs upside. If user wants defensive registration, suggested `creativemachines.ai` as a redirect (~$80/yr).

### 5. FAQ updates

**Q4 fix:** dropped non-existent free-trial / watermarked-images copy. New answer:
> *Yes, every image you generate is yours — to run, crop, layer, or print. We cover IP for anything generated under the product; see the Terms for the small print.*

**FAQ sub paragraph:** dangling "drop us a line" became live link to cal.com:
> *Answers in plain English. If yours isn't here, **book a 30-min call** — we'll cover it live.*
> (Link styled with `.lp-faq-link` — wine accent, underlined, hover effect)

**Three new service FAQs added** (Q5–Q7), mixed into the same FAQ list (didn't split):
- **Q5 — Cost:** soft floor (*"low four figures per month + ad spend"*), quoted on call
- **Q6 — How is this different from a regular agency:** plants the moat (own creative engine + audit-able tool + founder-led)
- **Q7 — What do you need to start:** brand URL + ad-account access + 30-min kickoff; first creatives ship in week one

Final FAQ shape: 7 items total, SaaS questions (Q1-4) first, service questions (Q5-7) after. Matches section order on the page.

### 6. Eyebrow cleanup across page

User feedback: eyebrows get skimmed. Removed:
- `DONE-FOR-YOU · LOCAL + D2C` from DoneForYou (then `DONE-FOR-YOU` also removed)
- `Pricing` from Pricing
- `Objections, handled` from FAQ

**Sections without eyebrows:** Hero, BeforeAfter (already had none), Pricing, DoneForYou, FAQ, Footer.

### 7. BeforeAfter horizontal-padding alignment bug (FIXED)

**Bug:** the BeforeAfter section's content was running flush to the band edges (no horizontal inset) while every other section had a 40px breathing room.

**Cause:** the inner div had both `.lp-wrap` and `.lp-sec` classes:
```css
.lp-wrap { padding: 0 40px; }       /* horizontal inset */
.lp-sec  { padding: 112px 0; ... }   /* vertical only — RESETS horizontal to 0 */
```
`.lp-sec`'s shorthand `padding` overrode `.lp-wrap`'s. Result: vertical 112px, horizontal 0.

**Fix:** moved `.lp-sec` to the outer `<section>` element so the two roles don't fight:
```jsx
<section className="lp-compare-wrap lp-sec" id="shift">
  <div className="lp-wrap">
```
Removed redundant inline `paddingBottom: 112` (now provided by `.lp-sec` itself).

### 8. BeforeAfter column-balance fix via CSS subgrid

**Problem:** when one row's `.v` text wraps to 2 lines on the After side (e.g., long Variant velocity copy) but the matching Before row stays on 1 line, the cumulative column heights drift apart.

**Tried first:** `min-height: 78px` on each `<li>` — reverted. May have caused a screenshot artifact (faint wine values appearing in the Before column — couldn't reproduce in code review; possibly HMR weirdness).

**Final fix: CSS subgrid.** Modern, well-supported (Chrome 117+ / Safari 16+ / Firefox 71+).

```css
.lp-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(8, auto);   /* tag, h3, 5 li rows, closer */
}
.lp-compare > div {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 8;
  /* padding + position preserved */
}
.lp-compare-rows {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: 3 / span 5;
  /* 5 LIs each take one parent row track */
}
```

Now each row's height is determined by the tallest cell across BOTH columns. When After-side wraps, the matching Before-side row gets that same height — both columns stay aligned, every row pair sits on the same baseline.

### 9. Footer cleanup

**Removed three dead-link columns** (every link was `href="#"`):
- ❌ Company (About / Careers / Press) — no pages, solo founder
- ❌ Resources (Case studies / Changelog / API) — no case studies (cold launch), no public API
- ❌ Legal (Terms / Privacy / Image IP) — pages don't exist

**Footer is now 3 columns:**
1. Brand col (`Creative Machines` wordmark + broadened blurb: *"for D2C founders and growth teams"* — was just D2C)
2. **Product** — The shift, Run growth, Pricing, FAQ (all real anchors)
3. **Talk to us** — single entry: `Book a 30-min call` → cal.com

**Bottom strip:** `© 2026 Creative Machines, Inc.` + `creativemachines.xyz` (dropped fake `v2.4` version).

**CSS:** `.lp-footer-grid` `grid-template-columns: 2fr 1fr 1fr 1fr 1fr` → `2fr 1fr 1fr`. Mobile collapse already handled by existing media query.

### 10. Nav updates

- Added `Run growth` link → `#run-growth`
- `Start free` → **`Get started`** — removed false promise (no free generation tier exists; `Start free` would have read as bait-and-switch when first generation gets blocked)

### 11. Cloudflare per-env Dodo config (separate commit, NOT this session's design work)

**Pre-existing changes from a prior session, shipped as a separate commit because they were uncommitted on the branch:**
- `env.d.ts`: 6 new env vars (`DODO_API_BASE`, `DODO_PRODUCT_STARTER_MONTHLY`, `DODO_PRODUCT_STARTER_YEARLY`, `DODO_PRODUCT_PRO_MONTHLY`, `DODO_PRODUCT_PRO_YEARLY`, `DODO_PRODUCT_TOPUP`)
- `wrangler.jsonc`: vars block per env — staging uses `https://test.dodopayments.com` + test product IDs, production uses `https://live.dodopayments.com` + live product IDs
- `payments.ts`: hardcoded `CHECKOUT_PRODUCTS` const → `checkoutProducts(env)` function reading from env
- `webhooks.ts`: `PLAN_CONFIG` const → `planConfig(env)` function
- `cloudflare/migrations/prod_dodo_parity.sql`: D1 schema parity migration (adds `balance_usd_topup` column, `user_subscriptions` and `payment_events` tables) — comment says already applied to production on 2026-04-18

### 12. .gitignore cleanup

Added entries to stop noisy untracked files from cluttering `git status`:
- `.env.*` with `!.env.example` exception (catches `.env.synthesis` and any future env files)
- `*.tsbuildinfo` (TypeScript incremental build cache)
- `cloudflare/.wrangler/` (wrangler dev cache)
- `/uploads/` (root-level runtime uploads — `server/uploads/` already covered)

---

## Three commits pushed to `origin/new-ui`

```
f9cb082  chore(gitignore): ignore env files, build caches, and root uploads
d6f9670  refactor(payments): move Dodo product IDs to per-env wrangler vars
f8205fa  feat(landing): rebuild marketing landing + add done-for-you section
```

The landing commit also subsumed Session 80 + 81 work that had been sitting uncommitted on the branch (component files, App.tsx routing, index.css token swap, prior session docs, JTBD research).

---

## Final files modified / created this session

```
M  client/src/components/landing/Hero.tsx          (subhead phrase swap)
M  client/src/components/landing/BeforeAfter.tsx   (vocab seasoning, KPI label, subgrid alignment, padding fix)
M  client/src/components/landing/Pricing.tsx       (full rewrite: 2 tiers, real billing, real top-ups)
+  client/src/components/landing/DoneForYou.tsx    (NEW)
M  client/src/components/landing/FAQ.tsx           (Q4 fix, sub→cal.com link, 3 new service FAQs)
M  client/src/components/landing/Footer.tsx        (dropped 3 dead-link cols, added cal.com)
M  client/src/components/landing/Nav.tsx           (Run growth link, Start free → Get started)
M  client/src/components/landing/LandingPage.tsx   (DoneForYou imported between Pricing and FAQ)
M  client/src/components/landing/landing.css       (subgrid, .lp-pop-underline, .lp-faq-link, .lp-dfy-*, footer cols)
M  client/src/components/pricing/TopupModal.tsx    (preset amount support)
M  client/src/store/index.ts                       (openTopupModal accepts presetAmount)
+  docs/research/andromeda-perf-marketer-vocab.md  (NEW)
+  docs/SESSION_82_LANDING_TWEAKS_AND_DONE_FOR_YOU_2026-04-28.md  (this doc)
M  .gitignore                                       (env, build caches, uploads)
M  cloudflare/src/{env.d.ts, routes/payments.ts, routes/webhooks.ts, wrangler.jsonc}  (per-env Dodo)
+  cloudflare/migrations/prod_dodo_parity.sql      (NEW — already-applied)
```

---

## Still unresolved / for next session

### High priority

**1. Hero H1 still the placeholder.**
Carries over from Session 81. Current: `Ship your next winning ad by 4pm.` — known weak. Session 81's "Hero copy thrash" doc has detailed guidance on what NOT to do (six rejected approaches). Specifically:
- ❌ Don't pattern-match Apple/Stripe/Linear-style headlines for an unknown launching product
- ❌ Don't draft 4-5 candidates and ask user to pick blind
- ✅ Anchor every candidate in a verbatim quote or specific job from `docs/research/jtbd-copy-research.md`
- ✅ Propose validation methods alongside drafts (Wynter / 5-marketer DM / live A/B)
- ✅ Consider shipping placeholder, validate with real visitor behavior

The Andromeda research from this session (`docs/research/andromeda-perf-marketer-vocab.md`) adds a second usable anchor: the "creative is the targeting now" framing. That layered with JTBD's "researched, not generated" gap gives two distinct positions to test.

**Three open questions for the user before drafting H1:**
- Tolerance for shipping placeholder copy and validating live vs. trying to nail it pre-launch?
- Network of perf marketers / D2C founders who could give cold feedback on 2-3 candidates?
- Budget for Wynter ($300-500 per panel)?

**2. BeforeAfter cost-per-creative claim is still inflated by ~6×.**
Current copy: `Cost per creative: As low as $0.10`. Real charged price per image is $0.60 (1 image = 6 credits = $0.60). User explicitly deferred fixing this in Session 82 ("ignore before-after fix for now").

If/when fixing: the honest dollar comparison is **~17× cheaper than Fiverr basic** (vs the current "100× cheaper" implied math), which is still strong but less dramatic. Alternative framings: lead with credits per creative not dollars, or restructure the row to compare time-to-first-test instead of dollar cost.

**3. Terms / Privacy / Image IP pages don't exist.**
Removed from Footer this session because dead links are worse than absence. **Dodo and Clerk both require these for live billing.** Need real pages built before launch traffic hits. Current footer mentions "see the Terms for the small print" in FAQ Q4 — that link doesn't go anywhere yet.

Suggested rough scaffolding:
- `/terms` — basic SaaS T&Cs (output ownership, refunds, plan changes)
- `/privacy` — covers Clerk auth data, Dodo payment info, R2 image storage, ad-account read access (for done-for-you clients)
- `/image-ip` (optional) — IP coverage statement for AI-generated images, addresses the "can I run these commercially" question concretely

### Medium priority

**4. Phantom wine-values rendering bug** (from BeforeAfter screenshot).
User reported faint wine `5m / $0.10 / 30+ / 30s / ✓` values appearing in the Before column between rows. Couldn't reproduce in JSX/CSS code review. May have been HMR stale-render. **Verify after hard refresh (Cmd+Shift+R) — if still present, it's an unsolved layout bug worth diving into.** With subgrid now in place, the architecture is cleaner; if the bug persists it's somewhere else.

**5. Done-for-you section section social proof.**
Trust pills cover trust without testimonials. As clients sign, swap one trust pill for a real testimonial / logo. Three trust pills currently:
- Built on the engine you can try yourself
- Founder-led. No account-manager game-of-telephone.
- Month-to-month. No lock-in.

**6. Cal.com event setup on user's side (NOT in code).**
Confirmed earlier: title set to `30-min creative & growth audit`. User needs to:
- Set timezone to IST in Calendly
- Configure availability per the windows above (Mon-Fri 7-11 PM IST + Mon-Fri 10 AM-1 PM IST)
- Add intake fields (brand URL, monthly ad spend, biggest challenge)
- Paste the event description text from this doc

### Low priority / nice to have

**7. Defensive `creativemachines.ai` registration** if user wants it (~$80/yr). Just point at the same site, no real switch.

**8. The other untracked junk in the working tree** — `.codex/`, `client/thinking-*.html`, `client/spinner-preview.html`, `client/src/components/ui/spinner-demo.tsx`, `docs/ai-pm-eval-*`, scratch `.md` files, `agent-factory/`, `claude_sdk/`, `uploads/` (now gitignored). These are user scratch — keep, delete, or commit selectively when desired.

**9. Real changelog / case studies** if/when there's content. Adding empty pages prematurely is worse than not having them — that's why they're not in the footer right now.

---

## Decisions explicitly NOT taken (recorded so we don't re-litigate)

- ❌ **Don't name Andromeda explicitly on the page.** Option A vocabulary swap chosen over Option B (named anchor band) and Option C (aggressive KPI reframe). Doesn't pretend not to exist (research saved as ammo), but doesn't ride the hype on a cold launch.
- ❌ **Don't say "unlimited" creatives.** Conflicts with credit pricing reality, reads as agency fluff to perf marketers.
- ❌ **Don't rename `creativemachines.xyz` → `creativemachines.ai`.** TLD switching cost > marginal upside, `.xyz` is credible.
- ❌ **Don't fix BeforeAfter cost-per-creative claim this session.** User explicitly deferred. Carries forward as item #2 above.
- ❌ **Don't add testimonials / case-studies / "trusted by 100+ brands" claims.** Cold launch — would be fabricated. Use specificity (concrete deliverables, founder-led framing) as the substitute trust signal.
- ❌ **Don't put done-for-you in the pricing grid as a 3rd tier.** Would split visitor attention and dilute the SaaS funnel. Standalone section between Pricing and FAQ is the right placement.
- ❌ **Don't capture email-first then schedule.** Calendly direct booking with intake fields filters tire-kickers and prevents email-tag drop-off.

---

## Current shipped state (verify on `localhost:5173` / push live before launch)

| Section | Status |
|---|---|
| Nav | ✅ Sticky transparent → frosted on scroll. Run growth link added. Get started CTA. |
| Hero | ⚠️ Subhead refreshed; **H1 still placeholder** |
| BeforeAfter | ✅ Padding bug fixed, subgrid row alignment, KPI vocab, "Creative is the targeting now." anchor |
| Pricing | ✅ 2 tiers (Starter $19 / Pro $49), real credits, real top-ups, fixed CTA bug |
| Done-for-you (`#run-growth`) | ✅ New section, cal.com booking |
| FAQ | ✅ Q4 fixed, cal.com link in sub, 3 service FAQs added |
| Footer | ✅ 3 cols (brand, Product, Talk to us), cal.com CTA |
| Global tokens | ✅ Warm cream + wine + lime (from Session 81) |
| Routing | ✅ Marketing landing for signed-out / zero-campaign users; in-app form preserved (from Session 81) |

Next session: **start by reading `docs/research/jtbd-copy-research.md` AND `docs/research/andromeda-perf-marketer-vocab.md`**, then approach the Hero H1 with hypothesis-driven framing from Session 81's guidance.
