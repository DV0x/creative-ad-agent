# Session 80 — Landing Page Redesign via Claude Design

**Date:** 2026-04-24
**Focus:** Use Anthropic's newly-launched Claude Design to rebuild Creative Machines' brand system + landing page from scratch, moving off the current coral-on-cream placeholder.
**Status:** Design system frozen ✅. Landing page v1 generated, critiqued, structural-fix prompt pasted and awaiting user Send.
**Next session:** Audit the v2 landing page output after regeneration.

---

## TL;DR

- Claude Design launched April 17, 2026. Used it to rebuild Creative Machines' brand.
- Scraped The Whole Truth Foods (TWT) HTML to extract real palette/fonts/logo — their 2026 rebrand uses wine rose + pastel pink + electric purple (not the old black/yellow).
- Generated a design system with Claude Design; iterated palette away from "Anthropic cream + coral" (too AI-slop) toward TWT-faithful wine + lime.
- Locked Clash Display + Satoshi as fonts (both free from Fontshare, less ubiquitous than Inter/Space Grotesk).
- Corrected CLAUDE.md's oversimplified agent description — system is actually 10 hook types (not 6), research-first methodology, 14 art styles, editable artifacts, chat-first iteration.
- Landing page v1 had strong concept but weak execution: agency-targeted voice, no hero input field, fixed "6 everywhere," broken letter spacing.
- Sent 3-fix structural prompt (awaiting user Send).
- **Next audit:** verify input field added, audience reframed D2C/performance, workflow visual cut, letter spacing fixed.

---

## Context

Anthropic launched **Claude Design** on April 17, 2026 — a Research Preview for Pro/Max/Team/Enterprise that generates UI, landing pages, and design systems from a prompt + reference assets. Powered by Claude Opus 4.7. Exports to PDF/PPTX/Canva.

User (D2C founder running Creative Machines) wanted to use Claude Design to rebuild the brand because the current landing and logo are placeholder-quality.

---

## What we actually did

### 1. Reference gathering (anti-AI-slop research)

Explicitly avoided generic AI-tool aesthetics. Scraped **thewholetruthfoods.com** HTML directly to get real palette and font data:

- Font: `--font-obviously-narrow` — **Obviously Narrow** by Ohno Type Co (premium, ~$200+ license)
- Real 2026 TWT palette (color frequency in HTML):
  - `#ab406c` wine rose — 88 uses (dominant)
  - `#ffcaf1` pale pink — 70 uses
  - `#5549de` electric purple — 37 uses
  - `#231F20` warm near-black — 27 uses
  - `#ffd987` butter yellow — 10 uses
  - `#c1ff64` lime green — 5 uses (pop accent)
- Logo: two-color wordmark, `#231F20` warm black + `#93385D` dark wine, handwritten "whole" overlay above serif-bold "The Truth" — encodes the "full disclosure" brand promise visually

**Note:** My initial mental model of TWT was outdated (black + yellow aggressive era). The actual 2026 rebrand is romantic-maximalist — wine + pink + purple + cream.

### 2. Landing page references staged

Collected 8 asset files into `uploads/claude-design-refs/`:

```
twt-logo-reference.svg          ← TWT official logo
ref-twt-hero.png                ← TWT homepage
ref-linear-hero.png             ← Linear (clean, no browser chrome)
ref-linear-method.png           ← Linear Method page
ref-oatly-voice.png             ← Oatly editorial statement
ref-oatly-grid.png              ← Oatly products/scribbles
ref-raycast-hero.png            ← Raycast hero
ref-raycast-ai.png              ← Raycast AI features
```

Plus 6 real product-ad images from `client/public/showcase/` renamed as `product-ad-1..6.png` to hand Claude Design as "product output proof" (vs. generic design references).

### 3. Brand brief written

Saved at `docs/brand-brief.md`. Key constraints:
- Personality: editorial + playful hybrid (80/20)
- Voice: confident, short, a little cheeky — "Real food is flawed" energy
- Anti-patterns: gradients, glassmorphism, dark mode, emoji/mascots, rounded-everything, Vercel-flat minimalism, ChatGPT clones

### 4. Claude Design — design system generation (v1)

Claude Design's first pass was solid but had two fatal issues:
1. Palette defaulted to **Anthropic house style** — cream `#F6F1E8` + warm black + coral. Too AI-slop.
2. Display type rendered as **Space Grotesk** (fallback, not editorial enough).

### 5. Palette redirect — locked new tokens

Moved off Anthropic cream to TWT-faithful rare colors. **These are the locked tokens:**

| Token | Hex | Role |
|---|---|---|
| `bg` | `#FBF9F5` | Neutral warm white — main background (anti-Anthropic, less yellow-bias than `#F6F1E8`) |
| `ink` | `#231F20` | Warm near-black — foreground, keep |
| `accent` | `#ab406c` | TWT wine rose — all CTAs, links, hover states |
| `pop` | `#c1ff64` | TWT lime — punctuation, max ONCE per screen |
| `surface` | `#F3EFE8` | Former cream bg demoted to card/section backgrounds only |
| `ink-2/3/4` | unchanged | Neutral grays |

**Coral `#E8553A` removed entirely** from the system. All interactive elements now wine.

### 6. Font lock

Replaced Space Grotesk with free Indian Type Foundry fonts via Fontshare CDN:

| Role | Font | Weights |
|---|---|---|
| Display | **Clash Display** | Bold 700, Extrabold 600 |
| Body / UI | **Satoshi** | 400, 500, 700 variable |

Fontshare CDN load:
```html
<link href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
```

Rationale: Inter + Space Grotesk are everywhere in AI-tool landings = slop signal. Clash Display + Satoshi are fresher, less ubiquitous, and have editorial weight.

### 7. Logo decisions

Logo file shows: **"CREATIVE machines."** — all-caps heavy geometric sans for "CREATIVE" + coral/wine handwritten script for "machines." with period.

Inspired by TWT's wordmark logic (editorial base + handwritten overlay) but inverted — TWT has serious base + playful insertion; ours has bold base + script accent.

**Variants built:** Primary horizontal + Inline nav. **Two still pending:** Stacked hero + Compact/favicon-safe.

Requested Claude Design fix the inconsistency where sidebar used "Creative — Machines" (title case + em-dash) instead of the logo file's "CREATIVE machines." — requested one version enforced everywhere.

### 8. Agent workflow — corrected understanding

CLAUDE.md's "6 ad hooks (stat, story, fomo, curiosity, callout, contrast)" is **oversimplified**. Reading the actual skill files:

- `cloudflare/sandbox/orchestrator-prompt.ts` — 4-stage pipeline (research → hooks → art → images)
- `agent/.claude/skills/hook-methodology/SKILL.md` — 10 hook types total:
  - Attention: Question, Surprising Stat, Pattern Interrupt, Controversial, Direct Address
  - Desire: Social Proof, Problem-Solution, Contrast, FOMO/Urgency, Curiosity
  - Default generates 3 hooks; user-configurable
- `agent/.claude/skills/art-style/workflows/` — **14 art styles**: analog-craft, anderson-clay-diorama, bold-energy, clean-premium, dream-sketch-hybrid, editorial-cutout, infographic-data-visual, lifestyle-render-hybrid, product-on-gradient, service-realism, soft-brutalism-clay, split-comparison, typography-dominant, ugc-aesthetic-static
- Image generation default: 6 per new campaign, max 6 per round
- **Reference image support:** users upload product photos → image-to-image generation places real product in ads

**The big differentiators (that the landing must tell):**
1. **Research-first methodology** — "Every hook must be traceable. If you can't point to where it came from, start over."
2. **Transparency** — research.md, hooks.md, prompts.json all appear as *editable files* in a sidebar with TipTap editor + auto-save
3. **Chat-first iteration** — no prompt engineering; just English: "make hook 3 more urgent," "regenerate image 2 softer"
4. **Per-image regeneration** — click one image, describe change, get one new version
5. **Brand memory** — "New campaign for same brand" inherits research automatically
6. **File mentions** — `@research`, `@hooks`, `@prompts`, `@asset-folder` references in chat
7. **Aspect ratios** — 4:5 (Meta feed), 1:1 (square), 9:16 (Stories/Reels/TikTok) per message

### 9. Landing page PRD

Saved at `docs/prd-landing-page.md`. Written in FAANG-PM voice (after user rejected an earlier feature-list version as "junior intern"). Structure: **The bet / Why now / Outcome shift / The insight / Who it's for / What good looks like / Non-goals.**

Key framing:
> In 24 months, D2C brands won't brief agencies for paid-social creative. They'll hand that work to agents that do the research, not just the rendering.

Non-goals explicitly named: not Canva, not video, not a scheduler, not white-label.

### 10. Landing page v1 — generated

Claude Design produced a full landing at the second design session URL (see Artifacts below). Grade: **B+ concept, C execution.**

**What's genuinely strong (keep):**
- Hero headline *"Hooks aren't written. They're extracted."* with wine strikethrough on "written" + lime highlight on "extracted" — enacts the extraction process visually
- Live research proof panel in hero (Voice / ICP / Proof / Product / Pain / Founder — source-highlighted in lime)
- `"Made by operators, not AI tourists"` threaded through ticker + footer copyright
- 3-pillar dark manifesto (01 Research is the moat / 02 Everything traces / 03 Edit anything)
- Framework tab UI with **two sources per hook** (review + internal data) — product teardown as landing section
- Pricing tier names (SOLO / STUDIO / ~~AGENCY~~)
- Trust indicator strip above footer
- Footer version string: `v2.4.1 · No emoji · No gradients · No slop` 🎯

**Critical failures (need fix):**
1. **Letter spacing broken on every Clash Display headline** — letters touching: "Hooksaren't", "Fast.Owned.Cheap.", "Sixbrands.Sixframeworks". Same `textLength/spacingAndGlyphs` bug Claude Design fixed in the design system specimen, but it's back on the landing.
2. **No hero input field** — product's primary try-me moment missing. Copy says "Paste a URL" but gives nowhere to paste.
3. **Page reads as agency-targeted** — vocabulary is wrong. *"Research artifact," "made by operators," "client workspaces · separate research," "dedicated creative ops lead," "SLA 99.5% uptime"* is copywriter/agency language. Target audience is D2C founders + in-house performance marketers who think in ROAS/CPA/hook rate/variants.
4. **"6 everywhere"** — ticker, pricing, footer, section heads lean on fixed "6 concepts / six frameworks / six brands." System is flexible; copy shouldn't lie.
5. **Claims editability without showing it** — "03 / Edit anything" pillar gets zero visual. Should render a mockup of the hook file with strikethrough + replacement + "Saved 2s ago."

### 11. Structural-fix prompt (pasted, awaiting Send)

Pasted in the landing page design session chat input. Three fixes requested:
1. **Reframe audience** to D2C/performance marketers. Rename pricing tier "AGENCY" → "SCALE" for in-house teams running 3-20 brands. Demote research-first to proof, not pitch.
2. **Cut the workflow visual** ("THE METHOD · Four steps" section). Replace with wide-grid "What you get" showcase of 6 real ads.
3. **Add hero input field** with `placeholder="thewholetruthfoods.com"` + wine "Generate campaign" CTA. Shift hero copy to outcome-first (*"Ship your next winning ad by 4pm"*).

Plus: fix letter spacing everywhere (textLength bug).

**Kept unchanged:** research proof panel, framework tabs, manifesto pillars, product-ad gallery, trust strip, footer version tag.

### 12. Copy critique (flagged, not yet fixed)

User correctly identified current landing copy as "shit" — writerly, not conversion-focused. Still speaks in craft language ("research artifact," "traces to a source") when audience wants outcomes (ROAS, CPA, variants, hook rate, test velocity).

**Did not send a copy rewrite yet** — user wants structural fixes to land first, then tackle copy in a separate round. This is the right sequencing.

Conversion-copy direction (for the future round):
- Hero H1 should promise an outcome: *"Ship your next winning ad by 4pm"*, not state a methodology
- Social proof strip above the fold with real brands + stats
- "The math" section: agency $ vs Creative Machines $
- FAQ questions performance marketers actually ask (ROAS, Meta Ads Manager export, aspect ratios, credit refund policy)

---

## Artifacts (locations and URLs)

### Files created this session

| Path | Purpose |
|---|---|
| `docs/brand-brief.md` | Initial brand brief for the design system (BRIEF block to paste into Claude Design's "notes" field) |
| `docs/prd-landing-page.md` | FAANG-PM style product brief for landing page |
| `docs/SESSION_80_LANDING_PAGE_REDESIGN_2026-04-24.md` | This document |
| `uploads/claude-design-refs/` | 8 reference files (screenshots + TWT logo) + 6 product-ad images, all uploaded to Claude Design |
| `/Users/chakra/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/memory/feedback_no_over_prescribing.md` | New feedback memory — don't pad prompts with bundled extras |

### Claude Design sessions

| Session | URL | State |
|---|---|---|
| Design System | `https://claude.ai/design/p/019dbe27-cbc5-7534-959b-f9df7a5ce534` | ✅ Frozen (palette locked, Clash Display + Satoshi, wordmark, buttons with states) |
| Landing Page | `https://claude.ai/design/p/019dbf34-5421-7900-994a-6d26f27020c6` | 🔄 v1 generated, structural-fix prompt pasted, awaiting user Send for v2 |

### Key files in repo (referenced but not modified)

| Path | Purpose |
|---|---|
| `cloudflare/sandbox/orchestrator-prompt.ts` | The 4-stage agent pipeline system prompt |
| `agent/.claude/skills/hook-methodology/SKILL.md` | 10 hook types + research-first methodology |
| `agent/.claude/skills/art-style/workflows/*.md` | 14 art style workflows |
| `client/public/showcase/1-6.png` | Real product ad outputs (source of `product-ad-*.png`) |
| `client/public/logo.svg` | Current placeholder logo (DO NOT upload as reference) |

---

## Pending for next session (audit checklist)

### Design system audit (should already be correct)

- [ ] Verify `logos.html` shows all 4 variants (primary horizontal, inline nav, stacked hero, compact/favicon) — not just 2
- [ ] Verify wordmark script is wine `#ab406c`, not the old coral
- [ ] Verify type specimen uses Clash Display + Satoshi (not Space Grotesk)
- [ ] Verify button specimen includes hover / focus / disabled / loading states
- [ ] Verify the sidebar in `ui_kits/product/index.html` uses the CREATIVE machines. logo (not "Creative — Machines" with em-dash)

### Landing page v2 audit (after structural fixes regenerate)

- [ ] **Hero input field present above the fold** with `placeholder="thewholetruthfoods.com"` and wine "Generate campaign" CTA
- [ ] **Hero copy outcome-first** — not "Hooks aren't written. They're extracted." but something like "Ship your next winning ad by 4pm."
- [ ] **Agency frame removed** — pricing tier 3 is "SCALE" (or similar) not "AGENCY". Copy talks to D2C founders + performance marketers, not copywriter shops.
- [ ] **Workflow 4-step visual cut** or replaced with "What you get" ad showcase
- [ ] **Letter spacing fixed** across every Clash Display headline — no more "Hooksaren't" or "Fast.Owned.Cheap."
- [ ] **Research proof panel retained** (possibly demoted below fold)
- [ ] **Framework tabs with two-source traceability retained**
- [ ] **Three manifesto pillars retained**
- [ ] **Trust strip + footer version tag retained**

### Copy audit (next round after structural fixes land)

- [ ] Rewrite hero headline to outcome-first (FAANG marketer voice, not FAANG designer voice)
- [ ] Add social proof strip with real brands + stats below hero
- [ ] Consider adding "The math" section: agency $ vs Creative Machines $
- [ ] Replace FAQ with performance-marketer objections (ROAS, Meta Ads Manager export, 9:16 output, credit refund, control-beating)
- [ ] Kill "Book a 10-minute demo" secondary CTA — product IS the demo
- [ ] Reframe "Is this a Canva replacement?" FAQ — don't name the category you're NOT
- [ ] Drop fixed "6" everywhere; use "research-driven," "on-brand concepts," or actual per-campaign numbers

### Known unresolved questions

- **Is "400+ D2C brands" real or aspirational?** If using social proof numbers, verify they're true.
- **Does Creative Machines output in 9:16 for TikTok/Reels?** Need to confirm for FAQ copy.
- **Hook count defaults** — skill defaults to 3 hooks, orchestrator defaults to 6 images. How does this surface to the user? Does the UI show "6 concepts" or is it variable?
- **"The Research Memo"** — Claude Design invented this as a nav item. Is this a planned content marketing play, or just content-hallucination? Decide whether to build it or drop it.

---

## Decisions locked this session

| Decision | Value | Rationale |
|---|---|---|
| Background color | `#FBF9F5` | Warm neutral white, not Anthropic cream |
| Foreground color | `#231F20` | Warm near-black from TWT logo |
| Accent color | `#ab406c` | TWT wine rose — rare, defensible provenance |
| Pop color | `#c1ff64` | TWT lime — max 1-2 uses per surface |
| Surface color | `#F3EFE8` | Demoted cream, cards only |
| Display font | **Clash Display** (Bold/Extrabold) | Less ubiquitous than Archivo Black |
| Body font | **Satoshi** (400-700) | Less ubiquitous than Inter |
| Font CDN | Fontshare | Free commercial license |
| Wordmark | `CREATIVE machines.` | Caps + wine script, period included |
| Primary pricing tiers | SOLO / STUDIO / SCALE | Renamed from Free/Starter/Pro/Agency to match user self-identity |
| Primary audience | D2C founders + in-house performance marketers | Not agencies (explicitly demoted) |

---

## Key session learnings (for future)

1. **Claude Design has Anthropic's house style baked in as a default.** If you don't explicitly anti-direct the cream + warm-black + coral aesthetic, you get it. Always scope AGAINST Anthropic's look when briefing Claude Design for non-Anthropic brands.

2. **Scrape the reference HTML, don't guess.** My mental picture of TWT was 2+ years outdated. Getting the real 2026 CSS gave us `#ab406c` and `#c1ff64` which were not in my training data as "TWT colors." For any design reference work, extract actual tokens from the live site.

3. **Separate design system from applied design.** Claude Design's project model enforces this — a design system is a project, and applied designs (landing pages, etc.) are sub-projects that *use* the system. Keep them separate for iteration sanity.

4. **User's agent differs from CLAUDE.md's summary.** CLAUDE.md said "6 ad hooks (stat/story/fomo/curiosity/callout/contrast)" — actual skill has 10 hook types and defaults to 3. Always read the skill files before writing user-facing copy about what the product does.

5. **New feedback memory:** don't over-prescribe in prompts for downstream tools. User called this out twice in this session. See `feedback_no_over_prescribing.md`.
