# Session 81 — Landing Page Rebuild (shipped) + Hero Copy (THRASHED, unresolved)

**Date:** 2026-04-26
**Branch:** new-ui
**Status:** Landing page structurally complete and live on `localhost:5173`. Hero H1 is still the placeholder `Ship your next winning ad by 4pm.` — multiple rounds of revision were rejected by the user; no replacement landed. **Pick this up next session with a different approach (see "Hero copy thrash" below).**

---

## What was shipped (works, in repo)

### 1. New landing page from Claude Design bundle

- Source: `https://api.anthropic.com/v1/design/h/-8XvGhbmvXvTGQ07cSt1Ew` → extracted to `/tmp/landing-design/creative-machines/`
- Slim 6-section structure (cut from original 10): **Nav → Hero → Before/After → Pricing → FAQ → Footer**
- Sections we agreed to cut from the design: "What you get" orphan header, Manifesto slab, Frameworks tabs, Proof gallery (duplicated hero), Final CTA slab

**Files created:**
```
client/src/components/landing/LandingPage.tsx     orchestrator
client/src/components/landing/Nav.tsx             sticky transparent → frosted on scroll
client/src/components/landing/Hero.tsx            re-skinned existing input behavior
client/src/components/landing/BeforeAfter.tsx     KPI-aligned comparison (5 rows)
client/src/components/landing/Pricing.tsx         Solo/Studio/Scale + topup, opens PricingModal
client/src/components/landing/FAQ.tsx             4 items (cut from 6)
client/src/components/landing/Footer.tsx          5-column
client/src/components/landing/landing.css         all section CSS
client/public/landing/ads/*                       6 PNG ads from design bundle
client/public/landing/logos/*                     3 SVG wordmarks from design bundle
docs/research/jtbd-copy-research.md               JTBD research report (3.1k lines)
```

### 2. Global token swap (warm cream + wine + lime)

`client/src/index.css` — replaced Monochrome + Coral palette with the design system's:
- `--color-bg-base: #FBF9F5` (warm cream, was `#F3F4F6` cool gray)
- `--color-text-primary: #231F20` (warm ink, was `#111`)
- `--color-accent: #AB406C` (wine, was `#E8553A` coral)
- `--color-pop: #C1FF64` (lime, new)
- Plus accent-press, accent-wash, accent-ring, surface tokens
- shadcn HSL vars updated to match (`--background`, `--primary`, `--ring`, sidebar tokens)
- Added Clash Display + Satoshi fonts via Fontshare; new `--font-display` token

**Affects every screen globally**, not just landing. Workspace UI now reads warm/wine instead of cool/coral.

### 3. App.tsx routing

- `showLanding && !isCreatingCampaign` → new `<LandingPage />` (marketing landing)
- `showLanding && isCreatingCampaign` → existing `<EmptyState />` (in-app New Campaign form, kept untouched)
- Removed `LandingHeader` import (replaced by Nav inside LandingPage)
- Existing flow preserved: landing only shows for signed-out users or signed-in users with zero campaigns; returning users still auto-redirect to `/workspace`

### 4. Hero structural fixes (after user feedback)

- **Bento grid restored** (1×big + 5×small, 3-col 3×3 grid pinned to `aspect-ratio: 1/1`) — replaces the symmetric 3×2 grid that came from the design. Tutor ad set as the 2×2 hero tile.
- **Hero fits viewport** via `min-height: calc(100svh - 72px)` with `align-items: center`. H1 capped at `clamp(2.5rem, 4.6vw, 4.5rem)` and forced to 3 lines via `<br>`.
- **Sticky nav fixed**: changed `.lp-root { overflow-x: hidden }` → `overflow-x: clip` (the `hidden` was creating a scroll container that broke `position: sticky`).
- **Transparent nav with frosted scroll state**: nav is `background: transparent` at top; on scroll `> 8px` it picks up `background: rgba(251,249,245,0.72) + backdrop-filter: blur(14px) saturate(140%)`.
- **Smooth ticker placeholder rotation** — replaced choppy 300ms fade-out → text-swap → fade-in with a continuous cross-fade (two stacked `<span>` layers, `cubic-bezier(0.16, 1, 0.3, 1)`, 720ms, prefers-reduced-motion fallback).
- **Eyebrow pill removed** ("CREATIVE MACHINES · v2.4 · LIVE") — H2 carries the section.

### 5. Before/After section reframed for D2C founders + perf marketers

Section H2 changed: `Brief an agency. Or brief a machine that did the reading.` → `From brief to in-feed, by lunch.`

Eyebrow `01 The shift` cut + meta line `The before / after` cut (redundant with column tags below).

Five rows replacing the original four, all mapped to KPIs marketers actually track:

| Row | Before badge | After badge |
|---|---|---|
| Time to first test | 14d | 5m |
| Cost per creative | $10 (Fiverr templates) | $0.10 |
| Variants per week | ×4 | 30+ |
| Iteration loop | 2wk | 30s |
| Brand fit | ? (templates, best guess) | ✓ (researched from URL) |

Closer triplets: `Slow. Generic. Guess.` / `Fast. Tested. Yours.`

**Honest math:** $10/creative is Fiverr basic floor (real range $5-$50, picked low end so it can't be dismissed as exaggerated). $0.10/creative is Scale tier ($299 ÷ 2400 ads = $0.124, rounded). Comparison: 100× cheaper, defensible.

### 6. "6 creatives" cap-feel fix + terminology sweep

- Removed `6 creatives` / `six on-brand ads` / `six concepts per campaign` / `six ads by Friday` etc. wherever it implied a hard cap on output. Replaced with `creative pack`, `Full creative pack per run`, `a campaign by Friday`.
- Established canonical terms: `creative` = the unit (full asset), `campaign` = orchestration, `ad` only for in-market verb context (`ship a winning ad`, `running their own ads`, `ads manager`).
- Swept `ad/ads` → `creative/creatives` everywhere it referred to the unit. Kept proper-noun-ish `ads manager`, kept `Ad hooks` (the copy term), kept rotating prompt examples (`Create ads for X`) since they model natural user input.

### 7. Eyebrow cleanup (Pricing / FAQ)

After cutting the BeforeAfter eyebrow, the orphaned numbering on Pricing/FAQ (`02 Pricing`, `03 Objections, handled`) looked broken. Dropped numbers entirely from both, kept text labels (`PRICING`, `OBJECTIONS, HANDLED`).

### 8. JTBD research delivered

Researcher subagent produced a substantive report at `docs/research/jtbd-copy-research.md`:
- Top 3 jobs hired by D2C founder + in-house perf marketer (functional, emotional, social)
- ~25 verbatim quotes from the audience (with sources)
- Competitor copy audit (AdCreative, Pencil, Smartly, Creatify, Predis, Omneky, Madgicx, Motion, Canva)
- Two market gaps identified:
  - Nobody owns "researched, not generated"
  - Nobody uses perf marketer KPI vocabulary (hook, hook rate, variants, fatigue) in their hero
- 5 research-grounded hero candidate drafts

This research is GOOD. Use it next session.

---

## Hero copy thrash (unresolved — user called it trash, rightly)

Six rounds of hero copy proposals. All rejected. The current shipped H1 is still the placeholder `Ship your next winning ad by 4pm.` — the user has not approved any replacement.

### What I tried (and why each failed)

**Round 1** — kept the placeholder `Ship your next winning ad by 4pm.` Problems: "winning" is hopeful not specific; "ad" is singular (perf marketers think in batches); "by 4pm" is gimmicky.

**Round 2** — proposed `Six fresh hooks. Every run. No designer.` User flagged: **hook ≠ creative**. A perf marketer reading "hook" thinks "you're giving me copy lines, not the visual." Undersells the deliverable.

**Round 3** — proposed three drafts (`Brand-researched creatives. By lunch.` / `Your brand, in six fresh creatives.` / `Creatives that read your brand. Not just your prompt.`). User unconvinced, asked me to think about whether D2C founders + perf marketers actually care about the current headline.

**Round 4** — re-proposed similar drafts with minor tweaks. Same approach. Still declarative ("X creatives. By lunch."). User: **"by lunch is gimmicky, take inspiration from other tools, action-oriented not statements."**

**Round 5** — proposed pattern-matched action drafts (`Stop briefing. Start testing.` / `Paste a URL. Ship six brand-researched creatives.` / `Paste. Research. Ship.` / `Skip the design queue. Ship the test.` / `Brief less. Test more.`). Cited Apple Cash, Stripe, Linear as inspiration. User: **"these all look shit. Their messages work because the brands were established. Think from first principles."**

**Round 6** — first-principles attempt (`We read your brand before we write your ads.` / `The hooks are pulled from your reviews.` / `Reads your brand. Writes your ads.` / `From one URL: six brand-researched creatives.`). User: **"you're not doing a good job. Acknowledge it. Document so we don't repeat in next session."**

### Failure modes (be honest about these)

1. **Pattern-matched to established brands.** "Stop X. Start Y." (Converge), "Send. Spend. Save." (Apple Cash), "Just do it" (Nike), Stripe's input/output rhythm — these work for known brands because the brand carries the meaning. They do NOT work for an unknown product launching cold. The user called this out and was right.

2. **Treated copy as a phrase puzzle.** Picked words for rhythm, parallelism, alliteration. Not for value communication. Generated 4-5 drafts per round and asked user to pick — but offered no basis to choose because none were grounded in a testable hypothesis.

3. **Iterated without changing approach.** When drafts were rejected, generated more drafts in the same approach. Should have stopped to ask: "what about my method is wrong?" instead of "what other words can I try?"

4. **Used research as window dressing, not anchor.** The JTBD research surfaced two specific market gaps (researched-not-generated, KPI vocabulary) and ~25 verbatim quotes. I cited them in framing but anchored my drafts in pattern-matching anyway.

5. **Failed to propose the right exit.** The right move after 2-3 failed rounds was: *"hero copy can't be solved by a writer's judgment in chat. Let's frame each candidate as an explicit hypothesis and propose a validation method (Wynter copy test, 5 perf marketers in your network, A/B test post-launch). OR ship a placeholder hero and validate with real visitor behavior."* I never proposed this. Kept trying to win the headline through revision.

6. **Over-confident "my pick" framing.** Each round ended with a "my pick: X, here's why." That framing is appropriate for low-stakes design choices. For a hero headline on a product launching cold, where I have no real data, it reads as overconfidence.

---

## For the next session

### Don't

- **Don't draft hero copy variations and ask the user to pick.** Frame each candidate as a testable hypothesis (audience X, prior belief Y, this tests Z) or propose validation methods.
- **Don't pattern-match to Apple/Stripe/Linear/Nike-style headlines.** They work because the brand carries the meaning, not because the pattern is good. New unknown product → can't borrow that authority.
- **Don't re-propose:** "by lunch" / "Stop X. Start Y." / "Paste. Research. Ship." (three-verb compressed) / "Brand-researched creatives. By lunch." — already rejected.
- **Don't re-litigate the terminology.** We landed: `creative` = the unit, `campaign` = orchestration, `ad` only for in-market verb context. Don't re-open this.
- **Don't end with "my pick: X" framing on hero copy** unless tied to a specific, testable claim from user research.

### Do

- **Read `docs/research/jtbd-copy-research.md` first.** Anchor every candidate in a verbatim quote or specific job from that report. The two gaps (researched-not-generated; perf marketer KPI vocab) are the position to occupy.
- **Propose validation methods alongside drafts.** Real options: Wynter / PostHog A/B / 5-marketer survey via Twitter DM / Reddit r/PPC test / quick paid traffic split test post-launch.
- **Consider the right answer might be: ship placeholder, validate live.** A 5-second-clarity test after 200 real visitors is worth more than 6 rounds of writer's judgment.
- **If drafting, label each candidate with its hypothesis explicitly:**
  - *"This headline tests whether perf marketers respond more to the moat (brand-researched) than to the deliverable (six creatives)."*
  - *"This headline tests whether the workflow mirror (paste URL → get pack) outperforms the pain-named approach (stop briefing)."*
- **Be willing to say: "I don't know which works."** Rather than over-confident "my pick" framing.

### Open questions to ask the user up front

- What's tolerance for shipping placeholder copy and validating live vs. trying to nail it pre-launch?
- Network of perf marketers / D2C founders who could give cold feedback on 2-3 candidates?
- Budget/willingness for Wynter ($300-500 for one panel)?

---

## Current shipped state (verify on `localhost:5173`)

| Section | Status |
|---|---|
| Nav | ✅ Sticky transparent → frosted on scroll |
| Hero | ⚠️ Structure done, **H1 copy is placeholder** (`Ship your next winning ad by 4pm.`) |
| Before/After | ✅ Reframed, 5 rows, KPI-aligned, copy tightened |
| Pricing | ✅ Solo/Studio/Scale, monthly-yearly toggle, topup strip, opens PricingModal |
| FAQ | ✅ 4 items, accordion |
| Footer | ✅ 5-column |
| Global tokens | ✅ Swapped warm + wine + lime everywhere |
| Routing | ✅ Marketing landing for signed-out / zero-campaign users; in-app form preserved |

---

## Files modified

```
M client/src/App.tsx
M client/src/index.css
+ client/src/components/landing/{LandingPage,Nav,Hero,BeforeAfter,Pricing,FAQ,Footer}.tsx
+ client/src/components/landing/landing.css
+ client/public/landing/ads/* (6 PNG)
+ client/public/landing/logos/* (3 SVG)
+ docs/research/jtbd-copy-research.md
+ docs/SESSION_81_LANDING_REDESIGN_AND_HERO_COPY_2026-04-26.md (this doc)
```

`client/src/components/EmptyState.tsx` is untouched and still serves the in-app New Campaign form.
`client/src/components/layout/LandingHeader.tsx` is unused (no longer imported); safe to delete in a follow-up.
