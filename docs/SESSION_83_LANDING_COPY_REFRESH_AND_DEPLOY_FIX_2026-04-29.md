# Session 83 — Hero/BeforeAfter/Footer/Pricing copy refresh, build fix, Node-20 deploy unblock

**Date:** 2026-04-29
**Branch:** `new-ui` (pushed)
**Staging:** ✅ deployed — `https://creative-agent-staging.alphasapien17.workers.dev` (version `359b0fe3`)
**Production:** ⏸️ pending — waiting on user staging verification before pushing
**Node version required for deploy:** **v20** (Node 23 is broken — see "Deploy landmine" below)

---

## TL;DR

| Area | What changed |
|---|---|
| Footer | Corporate `© 2026 Creative Machines, Inc.` → audience-pointing tagline `For brands too small for an agency, too serious for slop.` |
| BeforeAfter | H2 swap + variety/polish paragraph rewrite (less perf-marketer jargon) |
| Hero | H1 rewrite ended at `Make creatives that read your brand.`; sub rewritten to describe brief+URL input + iteration |
| Pricing | `10% credit bonus, baked in` → `+10% bonus on monthly credits` (clarify it's monthly, not top-up) |
| Build fix | `UserMenu.tsx` click handler — wrap `openTopupModal` in arrow fn (was passing click event as `presetAmount`) |
| Deploy | Established Node 20 + clean reinstall workflow as the canonical deploy path |

---

## Commits pushed (this session)

```
b4e2b36  fix(auth): wrap openTopupModal click handler to fix TS build
42ebccf  fix(landing): clarify Starter/Pro credit-bonus copy is monthly-only
d8b41bb  feat(landing): refresh hero copy, before/after, footer tagline
```

All on `origin/new-ui`. The `d8b41bb` commit also subsumed the leftover Session 82 changes in `Nav.tsx`, `DoneForYou.tsx`, and `landing.css` (subgrid + footer 3-col + `.lp-pop-underline`) that had been hanging uncommitted on the branch.

---

## Final shipped copy (verify these on staging)

### Hero

**H1:** `Make creatives that read your brand.`
- Verb-led action (`Make`)
- Lime pop on `read your brand` (the moat phrase)
- Cold-reader test: "I can do something + the something reads my brand"

**Sub:**
> *Tell us what to run, with a URL. We read your reviews, product pages, and customer language — then ship a fresh pack of on-brand hooks with matched visuals. Run again for new angles, anytime.*

Three concepts, one per sentence: flexible input → mechanism → repeatability.

### BeforeAfter

**H2:** `From two-week sprints to five-minute packs.`

**Right-side paragraph:**
> *Meta and TikTok reward brands that ship variety, not polish — **30+ different creatives a month**, not three perfect ones. Two-week production loops can't keep up. **Creative is the targeting now.***

The H2's `two-week` and the paragraph's `Two-week production loops` mirror — H1 and body share an explicit anchor.

### Pricing

| Tier | Bonus lines |
|---|---|
| Starter ($19) | `+10% bonus on monthly credits` (single line) |
| Pro ($49) | `+20% bonus on monthly credits` AND `20% bonus on every top-up` (two distinct lines) |

The visual contrast is now unambiguous: Pro has TWO bonus lines, Starter has ONE. No reader can misread Starter as having a top-up bonus.

### Footer

**Tagline (replaces `© 2026 Creative Machines, Inc.`):**
> *For brands too small for an agency, too serious for slop.*

Right side stays `creativemachines.xyz`. Copyright marker dropped intentionally — Berne Convention covers it automatically; the corporate `Inc.` line was the part that didn't fit a solo-founder operation.

---

## Deploy landmine — Node 23 is broken (READ BEFORE DEPLOYING)

A `npm install` somewhere in recent history pulled in:
- `miniflare 4.20260305.0` (March 5, 2026 release)
- which bundles `undici 7.18.2`
- which has a regression: `new CacheStorage(kConstruct)` fails on Node 20+ because Node's own `CacheStorage` global shadows it

**Symptom:** deploy crashes with two errors stacked:
```
Vite/Rollup:  does not provide an export named 'version'
Wrangler:     TypeError: CacheStorage is not a constructor
```

**Fix that worked this session:**
1. Switch to Node 20: `source ~/.nvm/nvm.sh && nvm use 20`
2. Wipe both `node_modules` directories
3. Reinstall via `npm ci` (uses lockfile, doesn't drift versions)
4. Build and deploy normally

**Canonical deploy script lives at `/tmp/deploy-staging.sh`** (created this session). To redeploy staging, just run `bash /tmp/deploy-staging.sh`. For production, swap `--env staging` → `--env production` and `build:staging` → `build:production`.

**Long-term fix (NOT done this session):** pin Node 20 in a `.nvmrc` at repo root, or upgrade `miniflare`/`wrangler` to a version that fixes the undici regression. Suggested follow-up: add `.nvmrc` containing `20.20.2` so future shells auto-switch.

---

## Testing checklist for staging

URL: **https://creative-agent-staging.alphasapien17.workers.dev**

### Landing page (signed-out)

- [ ] Nav: `The shift`, `Run growth`, `Pricing`, `FAQ` all scroll to correct sections
- [ ] Nav: `Get started` button (replaced `Start free`) — opens sign-in
- [ ] Hero H1 reads: `Make creatives that read your brand.` (lime pop on `read your brand`)
- [ ] Hero H1 fits cleanly on one line at desktop width — no awkward wrap
- [ ] Hero sub reads the new 3-sentence version (input → mechanism → repeatability)
- [ ] Hero composer has rotating placeholder prompts
- [ ] Hero pipeline strip below composer: `Research — Ad hooks — Creative pack`
- [ ] BeforeAfter H2: `From two-week sprints to five-minute packs.`
- [ ] BeforeAfter right-side paragraph mentions `30+ different creatives a month` and ends `Creative is the targeting now.`
- [ ] BeforeAfter rows align across columns (subgrid working) — no drift on the longer "Variant velocity" row
- [ ] Pricing toggle works (`Monthly` ↔ `Yearly` shows -16%)
- [ ] Starter card shows: `+10% bonus on monthly credits` (one line, not two)
- [ ] Pro card shows BOTH `+20% bonus on monthly credits` AND `20% bonus on every top-up` (two lines)
- [ ] Top-up quick-picks ($5 / $10 / $25 / $50) clickable — should open `TopupModal` with that amount preset (NOT `PricingModal`)
- [ ] DoneForYou section scrolls from `#run-growth` nav link
- [ ] DoneForYou `Book a discovery call` opens cal.com in new tab
- [ ] FAQ Q4 doesn't mention `free trial` or `watermarked images` (Session 82 fix)
- [ ] FAQ sub paragraph has live link `book a 30-min call` to cal.com
- [ ] Footer is 3 columns (brand, Product, Talk to us) — NOT 5 dead-link columns
- [ ] Footer bottom strip reads: `For brands too small for an agency, too serious for slop. · creativemachines.xyz`
- [ ] No `© 2026 Creative Machines, Inc.` anywhere

### Auth flow

- [ ] `Get started` → Clerk sign-in modal/page
- [ ] Sign up with new email → redirected back to app
- [ ] Sign in with existing test account → loads dashboard

### Payment flow (Dodo test mode)

**Test card: `4242 4242 4242 4242`** · expiry: any future (e.g. `12/30`) · CVC: any 3 digits (e.g. `123`) · ZIP: any

- [ ] Click `Start with Starter` → opens `PricingModal`
- [ ] Click `Subscribe` (or equivalent CTA) → redirects to Dodo test checkout
- [ ] Complete checkout with test card → redirected back to app
- [ ] Webhook processes → user's credit balance updates (check via DB or UI)
- [ ] Try `Go Pro` flow same as above
- [ ] Try top-up: click a top-up button (e.g. `$10`) → `TopupModal` opens with `10` pre-filled
- [ ] Complete top-up checkout → balance updates by 100 credits ($10 × 10 cr/$)
- [ ] Pro user only: top-up should grant +20% bonus (e.g. $10 → 120 credits)

**Decline test:** card `4000 0000 0000 0002` should fail at checkout.

### Generation flow

- [ ] Logged in, dashboard shows. Click composer area on landing
- [ ] Submit a brief like "Run a back-to-school promo for warbyparker.com glasses"
- [ ] Backend creates campaign → user sees streaming progress
- [ ] Research phase completes → hooks render
- [ ] 6 hooks generated (stat / story / fomo / curiosity / callout / contrast)
- [ ] Art direction generated
- [ ] 6 images render (fal.ai)
- [ ] Aspect ratio (4:5 / 1:1 / 9:16) chip selection works
- [ ] Credits decrement by ~37 for a fresh 6-image campaign

### Iteration flow

- [ ] On a completed campaign, send a follow-up prompt like "make them more aggressive"
- [ ] Should reuse research, generate fresh hooks/images (not full re-research)
- [ ] Credit cost lower than initial (no research charge)

### Cross-cutting

- [ ] No console errors on landing or in-app
- [ ] No 404s on assets (favicon, fonts, images)
- [ ] Health check: `curl -s https://creative-agent-staging.alphasapien17.workers.dev/health` returns `{"status":"ok",...}` (verified at deploy time: D1 connected with 49 campaigns, R2 bound, Clerk wired)

---

## Quick D1 / log spelunking commands

```bash
# Count campaigns
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT COUNT(*) as n FROM campaigns"

# Last 5 messages
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT id, role, substr(content, 1, 80) as preview, created_at FROM messages ORDER BY created_at DESC LIMIT 5"

# Last 5 download events (Session 82 analytics)
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT * FROM user_events ORDER BY created_at DESC LIMIT 5"

# Recent payment events (Dodo webhooks)
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT * FROM payment_events ORDER BY created_at DESC LIMIT 10"

# User credit balance
npx wrangler d1 execute creative-agent-db --remote \
  --command="SELECT * FROM user_credits WHERE user_id='<clerk_user_id>'"

# Tail Worker logs (live)
cd /Users/chakra/Documents/Agents/creative_agent/cloudflare && npx wrangler tail --env staging
```

---

## Decisions taken this session (and the *why*, so future-you doesn't relitigate)

### Hero H1 evolution

The H1 went through ~12 iterations before landing. Captured here so the path makes sense:

| Stage | Candidate | Why rejected |
|---|---|---|
| Placeholder (from S81) | `Ship your next winning ad by 4pm.` | Speed claim is table stakes; "by 4pm" doesn't match actual <5min reality |
| First rewrite | `URL in. Brand-researched creatives out. Five minutes.` | Visual fail — long words at H1 size wrapped to 6 visual lines; lime highlight broke mid-hyphen |
| Tighter | `URL in. On-brand ads. Five minutes.` | "Six" issue (cap perception); "Five minutes" is table-stakes filler; user asked for action-led |
| Nounless triadic | `Researched. On-brand. Instantly.` | Too cryptic for cold readers — adjectives without nouns |
| Statement form | `Creatives that read your brand.` | Strong but felt like description, not action |
| **Final** | **`Make creatives that read your brand.`** | Verb-led action, single line, fresh verb (`read`), no number/time, lime pop on differentiator |

**Strategic frame** (don't lose this): cold-launch heroes should win **comprehension first**, **differentiation second**. Save manifesto-grade lines (`Researched, not generated.`) for Stage 3 (post-PMF). At Stage 1, the H1 should describe what the reader can DO, not declare a stance.

The 5-marketer DM panel and PostHog scroll-depth instrumentation called out in `docs/research/jtbd-copy-research.md` are still the cheapest validation step before a Wynter A/B.

### Pricing copy: monthly-bonus vs top-up bonus disambiguated

The phrase `10% credit bonus, baked in` was being misread as a top-up bonus. Real truth:
- Starter: +10% on **monthly subscription credits only** (250 base → 275 with bonus). NO top-up bonus.
- Pro: +20% on monthly subscription credits AND +20% on every top-up.

Replaced both Starter and Pro lines with `+N% bonus on monthly credits`, leaving Pro's separate `20% bonus on every top-up` line intact. Now the two-vs-one bonus contrast is visually obvious.

### Footer tagline

Solo-founder operation, no `Inc.`. Replaced corporate copyright line with `For brands too small for an agency, too serious for slop.` — audience-pointing, defines the gap explicitly, matches the page's two-clause anti-fluff voice. Kept the URL on the right.

### Sub iteration copy: "refine" → "run again"

Original sub draft said `Refine with a follow-up prompt` — but `refine` implied the first run wasn't good. Reframed to `Run again for new angles, anytime` — positive (exploration), uses perf-marketer dialect (`angles`), implies no friction.

---

## Decisions explicitly NOT taken (so we don't relitigate)

- ❌ **Don't use a number in the H1.** "Six creatives" reads as a cap; competes with BeforeAfter's `30+/week` and Pricing's `~150/month on Pro` — page feels smaller than it is.
- ❌ **Don't lead with speed in the H1.** Speed is table stakes; BeforeAfter section already owns the speed proof with cost/iteration data.
- ❌ **Don't ship `Researched, not generated.` as the H1 yet.** It's manifesto-grade — perfect for a footer/about/tagline at Stage 3, too abstract for a cold-launch H1 right now.
- ❌ **Don't downgrade Vite to v7-pre-3.1.** The Vite/Rollup error was symptom, not cause — node_modules state was. Clean reinstall on Node 20 fixed it without any package.json changes.
- ❌ **Don't upgrade Vite to v8 right now.** Major version bump risks introducing other build issues. Defer to a separate exploration branch.
- ❌ **Don't include `docs/scratchpad.md` or `docs/SESSION_82_*.md` in this session's commits.** Per user direction — those stay local for now.

---

## Next session — open items

### High priority

1. **Verify staging visually** (in progress — user is testing)
2. **Push to production** once staging is green: same flow but `npm run build:production && npx wrangler deploy --env production`. URL: `https://creativemachines.xyz`.
3. **Pin Node version.** Add `.nvmrc` (or `package.json` engines field) so future deploys don't hit Node 23 by default. Avoids the loop next time.

### Medium priority

4. **Investigate the upstream miniflare regression.** Either upgrade to a Cloudflare release that fixes the undici/CacheStorage issue, or pin miniflare to the last known-good version in `package.json`. Clean reinstall fixed the symptom but the lockfile still pins the broken version.
5. **BeforeAfter cost-per-creative claim still inflated by ~6×.** Carries over from Session 82 — copy says `$0.10` but real charged price is `$0.60` per image. User explicitly deferred. Honest dollar comparison is `~17× cheaper than Fiverr`, not `100× cheaper`.
6. **Terms / Privacy / Image IP pages still don't exist.** Dodo and Clerk both require these for live billing. Footer mentions "see the Terms" in FAQ Q4 — that link still goes nowhere.

### Low priority

7. **5-marketer DM panel** for the new H1 + sub before considering it locked-in. Cheapest validation before A/B.
8. **PostHog instrumentation** for the new H1 — scroll depth + composer-focus rate to compare against future iterations.
9. **Cal.com event setup** (Session 82 carry-over) — set timezone IST, add intake fields, paste event description.

---

## Files modified this session

```
M  client/src/components/auth/UserMenu.tsx          (TS build fix)
M  client/src/components/landing/Hero.tsx           (H1 + sub rewrite)
M  client/src/components/landing/BeforeAfter.tsx    (H2 + paragraph rewrite)
M  client/src/components/landing/Footer.tsx         (tagline replaces Inc.)
M  client/src/components/landing/Pricing.tsx        (bonus copy clarified)
+  /tmp/deploy-staging.sh                           (deploy script — outside repo)
+  docs/SESSION_83_LANDING_COPY_REFRESH_AND_DEPLOY_FIX_2026-04-29.md  (this doc)
```

All landing/component files committed and pushed. `/tmp/deploy-staging.sh` is local-only — recreate from this doc's "Canonical deploy script" section if needed.
