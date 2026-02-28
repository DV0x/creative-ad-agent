# Creative Pipeline 2026: Final Report

**Date:** 2026-02-24
**Scope:** Complete pipeline upgrade specification -- from research extraction through visual output, brief generation, and testing operations
**Sources:** Research A-D, Critique, Debate Transcript, Synthesis A/B/C, Advocate and Skeptic Final Positions
**Purpose:** Actionable specification a developer can use to update the pipeline skill files

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Research Agent Expansion](#2-research-agent-expansion)
3. [Hook Methodology Improvements](#3-hook-methodology-improvements)
4. [Visual Style Catalog](#4-visual-style-catalog)
5. [Art Direction & Prompt Construction](#5-art-direction--prompt-construction)
6. [Entity ID Diversity Strategy](#6-entity-id-diversity-strategy)
7. [Output Format Diversity](#7-output-format-diversity)
8. [Creative Testing & Optimization](#8-creative-testing--optimization)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Executive Summary

### The Core Problem

The pipeline generates competent but generic creative. Three structural failures compound:

1. **Visual monotony.** All output uses 1-2 clay diorama styles. Under Andromeda's Entity ID clustering, every creative for a brand likely collapses into 1-2 Entity IDs regardless of hook diversity. This is the binding constraint -- hook diversity is partially wasted while visual output clusters.

2. **Strategic shallowness.** The research agent extracts WHAT a brand does (homepage facts) but not WHY it matters (owned positioning, competitive context, emotional territory). Every hook bank produces output that passes a logo-swap test -- a competitor could use the same hooks by changing the brand name.

3. **Format tunnel vision.** The pipeline outputs 100% static AI images against a recommended mix of 50% video, 30% static, 20% carousel. The highest-performing content types (UGC, founder video, carousels) have no pipeline support.

### The Fix

The pipeline needs upgrades across every stage:

- **Research:** Add 7 new strategic sections (owned positioning, competitive context, buying objections, feature-to-emotion translation, customer language, brand story, category intelligence)
- **Hooks:** Enforce logo-swap validation, add funnel-stage awareness (TOF/MOF/BOF), add the 3-3-3 variety framework, expand extraction to mine new research sections
- **Visuals:** Add 6 new art styles producing compositionally distinct Entity IDs, add category-aware style routing, enforce mobile-first composition
- **Output formats:** Add UGC briefs (founder selfie + external creator), carousel storyboards, video storyboard outlines, organic post concepts
- **Testing:** Implement Hook x Style matrix generation, funnel-stage creative sets, refresh cadence model, and performance feedback loop design

### Key Debate Resolution

The debate between expanding AI visual styles first vs. pivoting to brief/UGC generation resolved with consensus on these points:

- Both styles and briefs are necessary -- this is not either/or
- The strategic research layer must improve regardless of output mode
- The pipeline's long-term moat is strategic intelligence, not rendering capability
- Entity ID clustering is a real problem requiring visual diversity
- Briefs unlock higher-performing content types but depend on improved research
- AI styles provide immediate deployable output for all customers; briefs serve the subset with production capability

The roadmap runs both streams in parallel, with research improvements as the shared foundation.

---

## 2. Research Agent Expansion

### 2.1 Problem Statement

The current research agent (`research.md`) extracts facts from a single homepage. It captures WHAT a brand does but not WHY it matters, HOW it differs from competitors, or WHAT emotional truth drives its positioning. Across 5 tested brand pipelines, every hook bank produces output that a competitor could use by swapping the logo.

Missing from the current research template: owned positioning, competitive context, emotional translation, customer language extraction, brand story, buying objection mapping, and category intelligence.

### 2.2 Tooling Constraints

The research agent has access to WebFetch (single URL + prompt) and WebSearch (web search queries). It does NOT have authenticated API access, multi-page crawling, or platform-specific scrapers.

| Data Type | Method | Reliability |
|-----------|--------|-------------|
| Homepage extraction (current) | WebFetch on brand URL | High |
| About/founder page | WebFetch on brand /about URL | High |
| Competitor identification | WebSearch for "[category] alternatives to [brand]" | Medium-High |
| Competitor homepage claims | WebFetch on top 2-3 competitor URLs | Medium |
| Review snippets (public) | WebSearch for "[brand] reviews" | Medium |
| Reddit/forum mentions | WebSearch for "site:reddit.com [brand]" | Medium |
| Product Hunt page | WebFetch on Product Hunt URL | Medium (if exists) |
| Category trends | WebSearch for "[category] trends 2026" | Medium |
| Founder interviews | WebSearch for "[brand] founder interview" | Low-Medium |
| Meta Ad Library | NOT feasible (requires authentication) | Not available |
| Full review scraping | NOT feasible (pagination, authentication) | Not available |
| Social listening at scale | NOT feasible (API access required) | Not available |

**Design principle:** Every new research section must be completable with WebFetch + WebSearch + LLM reasoning. Sections that require unavailable data use LLM knowledge as a fallback with explicit marking: "[Based on general knowledge -- verify with brand]".

### 2.3 New Research Sections

The following sections are added AFTER the existing template sections (The Offer through ICP). The existing template is preserved unchanged.

#### Section A: Owned Positioning

**Priority:** P0 -- Highest. Every hook, visual, and brief downstream depends on knowing what the brand uniquely owns.

```
## Owned Positioning

Answer these three questions using extracted data + competitive context:

### What can ONLY this brand claim?
[Specific capability, metric, approach, or story that no direct competitor shares]
[Must be verifiable from homepage data or publicly available information]

### What are ZERO competitors claiming in this category?
[Messaging gap or positioning angle that is unoccupied]
[Based on competitive homepage analysis or LLM category knowledge]

### Differentiation Thesis
In one sentence: Why should a customer choose this brand over the top 2-3 alternatives?
[Must reference a specific owned element, not a generic category benefit]
```

**How the agent populates this:**
1. From homepage extraction: Identify the most specific claims (numbers, named methodologies, unique product types)
2. From competitor search: WebSearch "[brand] vs [competitor]" or "[category] alternatives" to identify what competitors claim
3. From LLM reasoning: Identify which extracted claims are generic (shared with competitors) vs. specific (owned)

**Validation gate:** If the Differentiation Thesis could apply to a competitor by changing the brand name, it is too generic. Revise.

#### Section B: Competitive Context

**Priority:** P0. Even rough competitive intelligence dramatically improves hook specificity.

```
## Competitive Context

### Direct Competitors (Top 2-3)
- [Competitor 1]: Primary claim = "[what they say]". Emotional territory = [what emotion they own]
- [Competitor 2]: Primary claim = "[what they say]". Emotional territory = [what emotion they own]
- [Competitor 3]: Primary claim = "[what they say]". Emotional territory = [what emotion they own]

### Messaging Overlap (Crowded Zone)
What claims are ALL competitors making? (These are NOT differentiating hooks)
- [Shared claim 1]
- [Shared claim 2]

### White Space Opportunities
What emotional territories or messaging angles are NO competitors using?
- [Untapped angle 1]
- [Untapped angle 2]

### Source
[Competitor data gathered from: WebSearch / WebFetch / LLM category knowledge]
```

**How the agent populates this:**
1. WebSearch: "[brand name] competitors" or "[brand name] vs" or "[category] best [year]"
2. WebFetch: Top 2-3 competitor homepages -- extract their primary headline, tagline, and top value props
3. LLM reasoning: Identify overlapping claims and emotional white space

**Fallback:** If competitors cannot be identified or fetched, use LLM knowledge of the category with explicit marking: "[Competitive context based on general category knowledge]"

#### Section C: Buying Objections

**Priority:** P0. Each objection is a separate hook angle. The current pipeline has zero objection extraction.

```
## Buying Objections (Per ICP Segment)

### Segment: [Name from ICP section]
- Objection 1: "[What stops them from buying?]"
  - Brand's answer: [How the brand addresses this, from homepage data]
  - Hook potential: [How to frame as a hook angle]

- Objection 2: "[What concern do they have?]"
  - Brand's answer: [From homepage data or inferred]
  - Hook potential: [Hook angle]

### Segment: [Name]
[Same structure]

### Common Category Objections
[Objections typical for this product category, from LLM knowledge]
- "[Category-wide objection]"
- "[Category-wide objection]"
```

**How the agent populates this:**
1. From testimonials: What concerns did customers mention overcoming?
2. From homepage: What does the site proactively address? (FAQ sections, guarantee language, "why us" sections)
3. From LLM reasoning: What are standard objections for this product category?
4. Optional: WebSearch "[brand] reviews" to find common complaints or hesitations

#### Section D: Feature-to-Emotion Translation

**Priority:** P0. This is the translation layer between technical features and emotional hooks. The current pipeline skips this step entirely, causing hooks to stay at the feature level.

```
## Feature-to-Emotion Translation

For each key value prop or product feature, map the emotional chain:

### [Feature/Value Prop 1]
- Technical benefit: [What it enables functionally]
- Emotional benefit: [Why the customer FEELS motivated -- what changes in their life]
- Hook framing: [How to express the emotional benefit as a hook]

### [Feature/Value Prop 2]
[Same structure]

### [Feature/Value Prop 3]
[Same structure]
```

**Example (from TheRateFinder pipeline):**

```
### Feature: 24-48 Hour Approvals
- Technical benefit: Faster than traditional 3-6 week bank process
- Emotional benefit: Deal does not fall through. No anxiety while waiting. Feel in control.
- Hook framing: "Your deal closes before it can fall apart"

### Feature: 350+ Lenders
- Technical benefit: More options than any single bank
- Emotional benefit: Freedom to choose. Not trapped. Feels like the system works FOR you.
- Hook framing: "Stop begging one bank. Let 350 compete for you."

### Feature: BRRR Strategy Loans (72-hour funding)
- Technical benefit: Speed matched to investor timelines
- Emotional benefit: Treated as a professional investor, not a risk. Pride. Competence recognized.
- Hook framing: "BRRR investors: We built funding around YOUR timeline"
```

#### Section E: Customer Language & VoC Signals

**Priority:** P1. Customer language produces hooks that feel authentic rather than manufactured. Feasibility depends on whether reviews or community discussions are publicly accessible.

```
## Customer Language & VoC Signals

### Source
[Where customer language was gathered: homepage testimonials / WebSearch reviews / Reddit / Product Hunt / LLM inference]

### Trigger Events (What makes customers seek this solution?)
- Event 1: "[Specific situation that creates urgency]"
- Event 2: "[Specific situation]"

### Customer Pain Language (Their words, not brand's words)
- "[Verbatim phrase from testimonials or reviews]"
- "[Verbatim phrase]"
- "[Inferred from category if direct quotes unavailable -- mark as inferred]"

### Alternative Solutions Considered
- [Competitor/DIY option]: Why rejected? "[Customer's reason if available]"
- [Competitor/DIY option]: Why rejected? "[Reason]"

### Outcome Language (How customers describe the result)
- "[How they describe transformation/benefit after using product]"
- "[Transformation language]"

### Buying Hesitations (Pre-purchase)
- "[What almost stopped them from buying -- from reviews or inferred]"
- "[Concern before purchase]"
```

**How the agent populates this:**
1. From homepage testimonials: Extract emotional language, not just factual claims
2. WebSearch: "[brand] reviews" -- extract language patterns from review snippets
3. WebSearch: "site:reddit.com [brand]" or "[brand] reddit" -- extract community language
4. From LLM reasoning: Infer typical trigger events and hesitations for this product category
5. Mark all inferred language clearly vs. verbatim customer quotes

#### Section F: Brand Story / Origin

**Priority:** P1. Founder stories humanize brands and produce hooks with emotional weight.

```
## Brand Story / Origin

### Source
[About page / founder interview / Crunchbase / LLM knowledge / Not available]

### Origin Moment
Why does this brand exist? What problem were the founders personally solving?

### Founder Connection
How is the founder personally connected to the problem?

### Differentiation Origin
What insight led them to a different approach than competitors?

### Brand Archetype
[Hero / Sage / Caregiver / Rebel / Creator / Explorer / Other]
(Affects all creative tone downstream)
```

**How the agent populates this:**
1. WebFetch: Brand's /about page or /our-story page
2. WebSearch: "[brand] founder story" or "[founder name] interview"
3. Fallback: If no origin story is publicly available, note "[Brand story not available from public sources]" and move on. Do not invent.

#### Section G: Category Intelligence

**Priority:** P1. Provides seasonal hooks, trend hooks, and regulatory context.

```
## Category Intelligence

### Market Trends
[What is changing in this vertical? Based on WebSearch or LLM knowledge]

### Seasonal / Temporal Opportunities
When is buying pressure highest? What events create urgency?
- [Season/event 1]: [Hook opportunity]
- [Season/event 2]: [Hook opportunity]

### Regulatory / Compliance Context
What constraints shape positioning in this category?

### Category Sentiment
Are incumbents losing trust? Is there a cultural shift? Is the category growing or contracting?

### Source
[WebSearch results / LLM category knowledge]
```

### 2.4 Research Agent Workflow Changes

**Current workflow (4 steps):** Extract Brand Name -> Fetch Homepage -> Analyze ICP -> Write Brief

**New workflow (expanded):**

| Step | Action | New? |
|------|--------|------|
| 1. Extract Brand Name | Parse URL for brand | Existing |
| 2. Fetch Homepage | WebFetch on brand URL | Existing |
| 2.5. Fetch About/Story Page | WebFetch on /about or /our-story | New |
| 2.6. Competitive Scan | WebSearch for competitors, WebFetch top 2-3 competitor homepages | New |
| 2.7. Customer Language Scan | WebSearch for reviews, Reddit mentions, community discussions | New |
| 3. Analyze ICP | Extract ICP segments | Existing |
| 3.5. Strategic Analysis | Populate Owned Positioning, Competitive Context, Buying Objections, Feature-to-Emotion Translation, Category Intelligence | New |
| 4. Write Brief | Compile all sections | Existing (expanded) |

**Template size change:** ~60-70 lines -> ~150-200 lines. Update the agent's line target accordingly.

**Time impact:** Research will take ~3-5 min vs ~1-2 min per brand. This is acceptable because downstream quality improvement is multiplicative.

---

## 3. Hook Methodology Improvements

### 3.1 Logo-Swap Enforcement (5-Gate Hard Validation)

The current SKILL.md includes "Is it OWNED?" as a validation item, but output consistently fails it. The fix is replacing the current validation checklist with enforced hard gates.

**Replace the current Validation Checklist (Final Pass) with:**

```
## Validation Checklist (Final Pass) -- HARD GATES

Before each hook is complete, it must pass ALL five gates.
Hooks that fail any gate MUST be revised. Do not ship failing hooks.

### Gate 1: TRACEABLE
Can you point to the exact research element this hook came from?
- YES: Pass. Cite the source section.
- NO: Reject. Return to Step 1 and find a research source.

### Gate 2: OWNED (Logo-Swap Test)
Perform this three-part test:

**Test A -- Logo Swap:**
"If I replace this brand's name with a direct competitor's, does the hook still work?"
- If YES -> Hook is generic. MUST revise.
- If NO -> Pass.

**Test B -- Emotional Ownership:**
"Is this hook's emotional territory already claimed by a competitor?"
- If YES -> Revise to target untapped emotional territory.
  (Requires Competitive Context section in research. If unavailable, assess against common category messaging.)
- If NO -> Pass.

**Test C -- Customer Recognition:**
"Would a real customer of THIS brand say 'that's exactly how I feel'?"
- If YES -> Pass. Hook uses authentic language/emotion.
- If NO -> Revise using Customer Language / VoC section.

**Scoring:**
- 3/3: Ship.
- 2/3: Revise the failing test.
- 1/3 or 0/3: Fundamental rework. Return to extraction.

**Revision instruction when Logo Swap fails:**
Anchor the hook to one of these owned elements from the research:
1. A specific number only this brand can claim (e.g., "350+ lenders", "72-hour BRRR funding")
2. A named product, methodology, or feature unique to this brand
3. The brand's owned positioning from the Owned Positioning research section
4. Verbatim customer language from the VoC section that references this specific brand

### Gate 3: FELT
Does the hook name or evoke an emotion, not just state a fact?
- YES: Pass.
- NO: Apply the Feature-to-Emotion Translation from research. Rewrite at the emotional level.

### Gate 4: CLEAR
Can it be understood in 3 seconds or less?
- YES: Pass.
- NO: Simplify. Cut words. Choose shorter phrasing.

### Gate 5: THEIRS
Does it use the brand's words, the customer's world, and the brand's voice?
- YES: Pass.
- NO: Check Brand Voice and Customer Language sections. Calibrate tone and terminology.
```

### 3.2 The 3-3-3 Variety Framework

The current hook skill generates hooks without funnel-stage or format awareness. The 3-3-3 framework organizes output across three dimensions: funnel stage x psychological angle x format intention.

**New section to add after the Variety Check:**

```
## Hook Variety Matrix (3-3-3 Framework)

When generating 6+ hooks, organize output across three dimensions:

### Dimension 1: Funnel Stage
Each hook set MUST include hooks for at least 2 of these 3 stages:

| Stage | Hook Purpose | Copy Approach | CTA Style |
|-------|-------------|---------------|-----------|
| **TOF** (Top of Funnel) | Awareness. Spark curiosity, not sell. | Problem hook or emotional question. Short (50-100 chars). | Soft: "See how" / "Learn more" |
| **MOF** (Middle of Funnel) | Education + validation. Show HOW it works. | Mechanism/methodology, social proof, objection handling. Medium (100-125 chars). | Trust: "See results" / "Read reviews" |
| **BOF** (Bottom of Funnel) | Conversion. Close the sale. | Direct offer, urgency, stacked proof. Short and direct (50-100 chars). | Direct: "Shop Now" / "Claim Offer" |

### Dimension 2: Psychological Angle
Each hook set MUST include hooks from at least 3 of these 6 drivers:

| Driver | Hook Approach | When to Use |
|--------|-------------|-------------|
| **Pain / Problem** | Name the frustration. Empathize, then hint at relief. | Problem-aware audiences. TOF/MOF. |
| **Aspiration / Identity** | Show who they become. Appeal to desired self. | Aspirational brands. TOF. |
| **Social Proof / Credibility** | Numbers, testimonials, authority markers. | Trust-dependent verticals. MOF/BOF. |
| **Urgency / Scarcity** | Time pressure, limited availability, competitive pressure. | Offer-driven BOF campaigns. |
| **Education / Value** | Teach something useful. Position brand as expert. | Complex products. MOF. |
| **Transformation** | Before/after. Show the change. | Results-driven brands. MOF/BOF. |

### Dimension 3: Format Intention
Tag each hook with its intended visual treatment:

| Tag | Description | Visual Pairing |
|-----|-------------|----------------|
| `[STATIC]` | Designed for static image ad | Product-focused, typography-dominant, or infographic |
| `[VIDEO-SCRIPT]` | Opening 3 seconds of a video/Reel | Hook serves as opening line or text overlay |
| `[CAROUSEL-LEAD]` | First card of a carousel sequence | Must create enough curiosity to swipe |
| `[UGC-BRIEF]` | Script line for UGC creator | Conversational, first-person, natural tone |
| `[ORGANIC]` | Designed for boosted organic post | Native to platform, not ad-like |

When generating 6 hooks, minimum viable distribution:
- At least 2 funnel stages represented
- At least 3 psychological angles represented
- At least 2 format intentions represented
```

### 3.3 Funnel Mapping Step

**New step between Step 1 (EXTRACT) and Step 2 (MATCH):**

```
## Step 1.5: FUNNEL MAPPING

After extraction, map each research element to its natural funnel stage:

### TOF-Ready Elements (Awareness)
- Pain points naming universal frustrations (not brand-specific)
- Surprising stats that challenge assumptions
- Category-level problems creating "I have this problem" recognition
- Emotional triggers: Curiosity, Relatability, Pattern Interrupt

### MOF-Ready Elements (Consideration)
- Mechanism/methodology differentiators ("here's HOW it works")
- Social proof with specific numbers (reviews, customer count, results)
- Feature-to-emotion translations (why features matter emotionally)
- Objection-handling proof points (addresses buying hesitations)
- Emotional triggers: Social Proof, Security, Belonging

### BOF-Ready Elements (Conversion)
- Direct offers with specific numbers (discounts, guarantees, timelines)
- Urgency/scarcity elements (limited availability, seasonal timing)
- Stacked proof (multiple proof points combined)
- Risk-reversal language (guarantees, free trials, easy returns)
- Emotional triggers: Loss Aversion, FOMO, Specificity

Map at least 2-3 research elements to each funnel stage before constructing hooks.
```

### 3.4 Emotional Trigger Diversity

**Replace the current "Emotions Triggered" checklist in the Variety Check with:**

```
### Emotional Trigger Coverage

Hooks MUST cover at least 3 of these emotional territories:

| Emotion | Best Funnel Stage | Impact Signal | Example Hook Pattern |
|---------|------------------|---------------|---------------------|
| Curiosity | TOF | Highest hook rates, sustained viewing | "What [category] insiders know that you don't" |
| Relatability | TOF | Pattern match = scroll stop | "[Exact customer pain phrase]? Yeah, us too." |
| Social Proof | MOF (universal) | Trust builder at every stage | "[Number]+ [people] already [action]" |
| Empowerment | TOF/MOF | Identity-aligned purchasing | "For the [identity] who's done [settling/waiting/accepting]" |
| Loss Aversion | BOF | Negative framing outperforms positive by 60% | "Don't miss [specific consequence of inaction]" |
| FOMO/Scarcity | BOF | 60% of impulse purchases | "[Time limit]: [Specific offer]" |
| Pride/Status | MOF/BOF | 72% of premium buyers cite emotional satisfaction | "The [product] that [authority figures] chose" |
| Security/Safety | MOF | Reduces purchase anxiety | "[Guarantee/risk reversal] -- no [common fear]" |

**Anti-pattern:** If all hooks trigger the same emotion (e.g., all Pain/Frustration), the hook set will reach only one micro-audience segment under Andromeda. Emotional diversity = audience diversity.
```

### 3.5 Expanded Extraction from New Research Sections

The hook extraction step (Step 1) must mine the new research data:

```
### FROM: Owned Positioning (NEW)
Extract:
- The specific owned claim (use as anchor for every hook that fails Logo Swap Test)
- White space opportunities (untapped emotional territories)
- The Differentiation Thesis (one-sentence unique value)

### FROM: Competitive Context (NEW)
Extract:
- What competitors claim (these are NOT hook material -- they are the crowded zone)
- What NO competitor claims (these ARE hook material -- they are white space)
- Emotional territories that are untapped in the category

### FROM: Buying Objections (NEW)
Extract:
- Each objection as a separate hook angle
- The brand's answer to each objection (becomes the hook body)
- Match objections to ICP segments

### FROM: Feature-to-Emotion Translation (NEW)
Extract:
- The emotional benefit of each feature (this is the hook, not the feature itself)
- The hook framing suggestion from the research

### FROM: Customer Language / VoC (NEW)
Extract:
- Verbatim customer phrases (use directly in hooks)
- Trigger events (these become situational hooks: "Just got rejected by your bank?")
- Outcome language (use in transformation hooks)

### FROM: Brand Story / Origin (NEW)
Extract:
- Founder origin moment (becomes narrative hook)
- The "why this exists" angle (emotional weight that feature-hooks lack)
- Brand archetype (affects tone of all hooks)

### FROM: Category Intelligence (NEW)
Extract:
- Seasonal/temporal hooks ("Tax season? Here's why this matters now.")
- Trend hooks ("In 2026, [category shift] means [consequence].")
- Regulatory/cultural shift hooks
```

**Updated Extraction Checklist:**

```
**STOP. Before writing ANY hooks, verify you have extracted from:**

EXISTING SECTIONS:
- [ ] The Offer
- [ ] Key Value Props
- [ ] Proof Points
- [ ] Products/Services
- [ ] Pain Points Addressed
- [ ] Testimonials
- [ ] Brand Voice
- [ ] Their Messaging
- [ ] ICP Segment 1-3

NEW SECTIONS (extract if available in research):
- [ ] Owned Positioning -- Owned claim, white space, differentiation thesis
- [ ] Competitive Context -- Crowded zone (avoid), white space (target)
- [ ] Buying Objections -- Each objection as a hook angle
- [ ] Feature-to-Emotion -- Emotional benefits as hook material
- [ ] Customer Language / VoC -- Verbatim phrases, trigger events, outcome language
- [ ] Brand Story / Origin -- Founder narrative, "why we exist" angle
- [ ] Category Intelligence -- Temporal hooks, trend hooks
```

### 3.6 Copy-Visual Anti-Duplication

**New section after the CTA formula:**

```
## Step 4.5: VISUAL DIRECTION NOTE

For each hook, add a one-line visual direction note. This bridges hook output to the visual skill.

**The Anti-Duplication Rule:** If the copy SAYS it, the visual should SHOW the proof (not repeat the words).

| If the Hook Says... | Visual Should Show... |
|---------------------|----------------------|
| A transformation claim | Before/after or result imagery |
| A social proof number | Multiple people or crowd/community visual |
| A specific process | Step visualization or product in use |
| An offer/price | Product with price treatment or urgency visual |
| A pain point | The frustrated situation (empathy visual) |
| An identity claim | The aspirational person or lifestyle |

**Format:**
VISUAL DIRECTION: [One line describing what the visual should SHOW to complement, not duplicate, the copy]
```

### 3.7 CTA Strategy by Funnel Stage

**Expand the existing CTA Formula section:**

```
### CTA by Funnel Stage

| Funnel Stage | CTA Approach | Top Performers | Avoid |
|-------------|-------------|----------------|-------|
| **TOF** | Soft, exploratory. No purchase pressure. | "See how it works" / "Learn more" / "Discover" | "Buy now" / "Shop now" / Price mentions |
| **MOF** | Trust-building, educational. | "Read the reviews" / "See results" / "Compare options" | Hard urgency / Aggressive discounts |
| **BOF** | Direct, urgent, action-oriented. | "Shop Now" / "Claim [X]% Off" / "Complete Order" | Soft language / "Learn more" |

**CTA Performance Data:**
- CTA buttons increase CTR by 2.85x vs. text CTAs
- Single CTA per ad significantly outperforms multiple CTAs (40,000-ad analysis)
- Action verb + implied outcome ("Get your answer") outperforms generic verbs ("Learn more")
```

### 3.8 Updated Hook Output Format

```markdown
## Hook [N]
**Type:** [Hook type from the 10]
**Source:** [Research section + specific element]
**Target:** [ICP segment or "General"]
**Funnel Stage:** [TOF / MOF / BOF]
**Psychological Driver:** [Pain / Aspiration / Social Proof / Urgency / Education / Transformation]
**Format Intention:** [STATIC / VIDEO-SCRIPT / CAROUSEL-LEAD / UGC-BRIEF / ORGANIC]
**Hook:** "[The headline]"
**Body:** [1-2 sentences]
**CTA:** [Action + outcome, matched to funnel stage]
**Visual Direction:** [One line -- what the visual should SHOW to complement the copy]
**Logo-Swap Test:** [PASS / FAIL -- if FAIL, note what owned element anchors it]
**Psychology:** [Why it stops scroll + drives click]
```

### 3.9 Andromeda Copy Optimization Reference

```
## Andromeda Copy Optimization Notes

### Character Targets
- Primary text: 50-125 characters (truncates at ~125 on mobile)
- Headline: 27-40 characters (5-7 words optimal)
- Link description: 30 characters max

### What Andromeda's NLP Analyzes
- Headline structure and length
- Body copy tone (urgency, excitement, trust, fear appeal)
- CTA type and strength
- Emotional triggers present
- Offer type (discount, education, social proof, urgency, scarcity)

### Copy Patterns That Signal New Entity IDs
Andromeda clusters ads with similar messaging. To create distinct Entity IDs:
- Change the CORE MESSAGE, not just the words
- Different psychological driver = different cluster
- Different offer type = different cluster
- Same message reworded does NOT create a new Entity ID

### Copy Framework Selection by Awareness Level
| Audience State | Best Framework | Funnel Stage |
|---------------|---------------|--------------|
| Unaware | AIDA, Storytelling | TOF |
| Problem-Aware | PAS (Problem-Agitate-Solve) | TOF/MOF |
| Solution-Aware | BAB (Before-After-Bridge), FAB (Features-Advantages-Benefits) | MOF |
| Product-Aware | Social Proof + Offer | BOF |
| Most Aware | Direct Offer + Urgency | BOF |
```

---

## 4. Visual Style Catalog

The pipeline currently produces all output in one visual aesthetic (anderson-clay-diorama as default, soft-brutalism-clay as alternate). Under Andromeda's Entity ID clustering, this collapses output diversity. The following 6 new styles are designed to produce visually distinct Entity IDs while serving different D2C categories and funnel stages.

### 4.1 Product-on-Gradient

**Visual:** Product in isolation on solid color or multi-color gradient background. No environmental context, no humans. Clean product as focal point (30-40% of frame). Subtle grain texture overlay. Product shadow grounding.

**Composition:** Product centered or at rule-of-thirds. Generous negative space (50-60%) for typography. Single-column vertical for mobile. Text in top 40% of frame.

**Typography:** Bold sans-serif headline (5-7 words max). Clean, readable at thumbnail. CTA in accent color.

**Color:** Gradient derived from brand colors. Duotone option for bold brands. Accent reserved for CTA.

**Differentiators from clay styles:** No clay textures, no scene, no diorama. Pure product isolation. Compositionally flat. Fastest to produce.

**Best categories:** Beauty/skincare, supplements, e-commerce catalogs, electronics, fashion accessories

**Funnel position:** MOF/BOF

**Entity ID distinction:** Flat product-on-gradient is compositionally distinct from 3D rendered clay scenes. Different visual fingerprint.

### 4.2 Editorial Cutout

**Visual:** Product isolated with artistic cut-out edges. Selective color treatment (product in full color against muted background). Magazine-editorial aesthetic. Layered overlapping geometric shapes. Collage-influenced. Paper/linen-texture background.

**Composition:** Asymmetric layout with deliberate visual tension. Product at 40% with secondary elements (ingredient close-ups, texture details, color swatches). White space as design element.

**Typography:** Serif or editorial serif/sans-serif pairing. Title-case headlines, not ALL CAPS. Pull-quote treatment for key benefits. Text wraps around product cutout.

**Color:** Neutral base (off-white, warm gray, soft blush, sage). Selective saturation on product. No gradients -- flat color fields.

**Differentiators:** Flat layered collage vs. 3D depth. Serif vs. sans-serif. Asymmetric vs. bilateral. Paper texture vs. clay. No borders.

**Best categories:** Fashion, beauty, premium accessories, lifestyle, home goods

**Funnel position:** TOF/MOF

**Entity ID distinction:** Flat collage with selective color and serif typography is fundamentally different from clay diorama, gradient product shots, and typography posters.

### 4.3 Typography-Dominant

**Visual:** Bold typography IS the hero element (60-70% of frame). Minimal or no product imagery (10-15% if present). Large, stacked, stretched, or rotated letterforms. High contrast. Kinetic energy.

**Composition:** Text-first layout. Product subordinate. Rule-breaking: text extends to edges, overlaps borders. No scene, no environment.

**Typography:** Extra Bold / Black weight. Sans-serif dominant (Impact, Bebas Neue, Anton). Variable weight for hierarchy. Color treatment: headline in brand primary, accent word in contrasting color.

**Color:** High contrast, 2-3 colors max. No gradients, no textures -- flat, graphic, poster-like. Color blocking.

**Differentiators:** No product scene, no clay, no rendered objects. Text as visual hero. Flat 2D. Zero uncanny valley risk.

**Best categories:** SaaS, tech, services, financial products, coaching/education, subscription boxes

**Funnel position:** TOF/BOF

**Entity ID distinction:** Radically different from all imagery-dominant styles. Text/graphic layout is a separate visual category for Andromeda.

### 4.4 Infographic / Data-Visual

**Visual:** Educational, authority-building layouts. Data visualization elements: comparison charts, step-by-step breakdowns, numbered lists, progress indicators. Flat icons. Clean grid. Divider lines, labeled callouts.

**Composition:** Grid-based, organized. 3-4 sections within a single frame. Icons at consistent size. Headline top, structured content middle, CTA bottom. Comparison layout option (left vs. right).

**Typography:** Clean sans-serif throughout. Multiple sizes for hierarchy. Numbers and statistics rendered large and bold as visual anchors.

**Color:** Clinical/professional base (white or light gray). Brand primary for headers. Muted tones overall -- authority from structure, not color intensity.

**Differentiators:** Information-dense vs. single-concept. Grid/structured vs. compositional art direction. Flat icons vs. rendered objects. Educational tone vs. emotional tone.

**Best categories:** Health/wellness, fintech, SaaS, supplements, science-backed brands

**Funnel position:** MOF/BOF

**Entity ID distinction:** Multi-section data layout with icons is visually alien to every other style. Different category for Andromeda's scene-type analysis.

### 4.5 Lifestyle-Render Hybrid

**Visual:** Atmospheric environmental rendering with product in idealized context. NOT photorealistic humans -- aspirational scenes. Environments: kitchen countertop, bathroom shelf, cozy bedside table, gym bag setup. Soft natural lighting (golden hour, window light). Depth of field.

**Composition:** Environment 60%, product 30%, text 10%. Product at natural eye-level in scene. Scene tells a micro-story. Natural framing (window frame, shelf edge).

**Typography:** Minimal text overlay. Short statement with semi-transparent background for legibility. Warm-toned text. Positioned in natural negative space.

**Color:** Warm, natural tones (amber, warm white, soft green, earth). Brand colors through product itself. Desaturated golden-hour color grading. No flat color fields.

**Differentiators:** Environmental scene with depth vs. isolated product. Natural lighting vs. theatrical. Atmospheric mood vs. graphic impact. Warm organic vs. crafted/designed.

**Best categories:** Wellness, skincare/beauty, home goods, fitness, coffee/food/beverage, candles/fragrance, bedding/sleep

**Funnel position:** TOF/MOF

**Entity ID distinction:** Environmental scene with natural lighting is compositionally distinct from all other styles. Andromeda registers as lifestyle/environmental composition.

### 4.6 UGC-Aesthetic Static

**Visual:** Designed to look like a screenshot from a real social media post or review. Simulated UGC elements: screenshot framing, profile header, star ratings. Testimonial text as hero element. Product as it would appear in a real person's photo. Lo-fi quality markers.

**Composition:** Screenshot-style framing (social media post mockup, review card). Asymmetric, casual placement. Text-heavy: customer's words are primary content. Product as contextual element.

**Typography:** System fonts or casual sans-serif. Customer quote in larger text. Star ratings visual. Brand font at bottom for CTA strip.

**Color:** Neutral/white background simulating social media interface. Brand accent for CTA. Warm color cast suggesting real phone camera.

**Differentiators:** Simulates social media, not advertising. Testimonial as visual hero. Casual/authentic vs. designed. Interface elements (stars, avatars) vs. artistic elements.

**Best categories:** Universal -- works for any category where social proof drives conversion. Especially beauty, supplements, SaaS, fashion.

**Funnel position:** MOF/BOF

**Entity ID distinction:** Social-media-interface composition with screenshot framing is fundamentally different from all other styles.

### Style Summary Matrix

| Style | Visual Signature | Best Categories | Funnel | Uncanny Valley Risk | Speed |
|-------|-----------------|-----------------|--------|--------------------|----|
| **Product-on-Gradient** | Clean product on gradient | Beauty, supplements, e-com | MOF/BOF | None | Fastest |
| **Editorial Cutout** | Collage, selective color, serif | Fashion, beauty, premium, home | TOF/MOF | None | Fast |
| **Typography-Dominant** | Bold text as hero, poster | SaaS, tech, services, fintech | TOF/BOF | None | Fastest |
| **Infographic/Data** | Grid, icons, data elements | Health, fintech, SaaS, science | MOF/BOF | None | Fast |
| **Lifestyle-Render** | Product in atmospheric scene | Wellness, food, home, sleep | TOF/MOF | Low (no humans) | Medium |
| **UGC-Aesthetic Static** | Simulated social post/review | Universal (social proof) | MOF/BOF | None | Fast |
| **Anderson Clay Diorama** (existing) | 3D clay miniature theater | Storytelling, emotional brands | TOF/MOF | Low | Medium |
| **Soft Brutalism Clay** (existing) | Bold borders, single clay hero | Bold statements, high-contrast | TOF/MOF | Low | Medium |

---

## 5. Art Direction & Prompt Construction

### 5.1 Brand-Specific Prompt Engineering

Every prompt must anchor its visual metaphor to the brand's owned positioning, not generic emotional territory. Not "a key to a house" (generic) but "350 doors where each door represents a different lender" (specific to TheRateFinder's 350+ lender network).

**Required in all prompts:**

```
BRAND ANCHOR:
Owned positioning: [from hook-bank or research brief]
Visual translation: [how owned positioning becomes a visual element in THIS style]
Logo swap check: [confirmation that visual is brand-specific]
```

### 5.2 Category-Aware Visual Routing

| Category | Visual Priority | Avoid | Composition Emphasis |
|----------|----------------|-------|---------------------|
| **Beauty/Skincare** | Texture close-ups, ingredient visibility, warm lighting | Cold/clinical lighting, harsh shadows | Soft warm diffusion |
| **Tech/SaaS** | Clean interfaces, dark mode aesthetics, architectural clarity | Cluttered scenes, warm/organic materials | Negative space, sharp edges |
| **Food/Beverage** | Appetizing close-ups, warm ambient lighting, ingredient freshness | Sterile/clinical, isolated product without context | Natural surfaces, macro detail |
| **Fashion** | Movement/drape, fabric texture, styling context | Static flat-lay only | Dynamic composition, multiple angles |
| **Fintech/Finance** | Trust signals, clean data, professional restraint | Aggressive urgency, clutter | Structured grids, authoritative spacing |
| **Health/Wellness** | Natural ingredients, transformation implied, calm mood | Before/after with negative self-perception (Meta policy) | Warm lighting, organic materials |
| **Home Goods** | Environmental context, room setting, lifestyle integration | Isolated product without home context | Scene depth, lifestyle micro-story |

### 5.3 Mobile-First Composition Constraints

Required in every prompt:

```
MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35% (Meta UI coverage on Stories/Reels)
- Safe zone: No text in top 14% (status bar coverage on Stories/Reels)
- Thumb zone: Keep CTA above bottom-left and bottom-right corners
- Thumbnail test: Hero element and headline must be legible at 300px width
- Text minimum: All text equivalent to 12pt+ at final display size
- Single-column: For 9:16 formats, stack elements vertically (no side-by-side)
- Hero element: Must occupy at least 30% of frame and be identifiable at thumbnail size
```

### 5.4 Aspect Ratio Strategy

Current default (3 at 1:1, 3 at 9:16) should be updated:

| Ratio | Dimensions | Platform Fit | Recommended Mix |
|-------|-----------|-------------|-----------------|
| 4:5 (1080x1350) | Feed optimized (outperforms 1:1 by ~15%) | 2 prompts |
| 1:1 (1080x1080) | Feed standard, carousel | 2 prompts |
| 9:16 (1080x1920) | Reels, Stories (90% of Meta inventory) | 2 prompts |

Each hook concept should be rendered in at least 2 aspect ratios.

### 5.5 Style Routing Table

| User Keywords | Workflow |
|---------------|----------|
| "clay", "diorama", "anderson", "theatrical", "miniature" | `workflows/anderson-clay-diorama.md` |
| "brutalism", "soft brutalism", "neo-brutalist", "bold borders" | `workflows/soft-brutalism-clay.md` |
| "gradient", "product shot", "minimal product", "clean product" | `workflows/product-on-gradient.md` |
| "editorial", "cutout", "magazine", "collage", "premium" | `workflows/editorial-cutout.md` |
| "type", "typography", "text", "bold text", "poster" | `workflows/typography-dominant.md` |
| "infographic", "data", "chart", "comparison", "education" | `workflows/infographic-data-visual.md` |
| "lifestyle", "environment", "scene", "context", "atmospheric" | `workflows/lifestyle-render-hybrid.md` |
| "ugc", "testimonial", "review", "social proof", "screenshot" | `workflows/ugc-aesthetic-static.md` |
| (none specified) | **Auto-select 3-4 styles based on brand category** |

**Critical change:** The default is no longer a single style. When no style keyword is specified, the pipeline auto-selects 3-4 styles based on brand category and distributes hooks across them.

### 5.6 Category-Based Default Style Selection

| Category | Style 1 | Style 2 | Style 3 | Optional Style 4 |
|----------|---------|---------|---------|-------------------|
| Beauty/Skincare | Product-on-Gradient | Editorial Cutout | UGC-Aesthetic Static | Lifestyle-Render |
| SaaS/Tech | Typography-Dominant | Infographic/Data | Product-on-Gradient | UGC-Aesthetic Static |
| Fintech/Finance | Typography-Dominant | Infographic/Data | UGC-Aesthetic Static | Editorial Cutout |
| Food/Beverage | Lifestyle-Render | Product-on-Gradient | UGC-Aesthetic Static | Editorial Cutout |
| Fashion/Apparel | Editorial Cutout | Lifestyle-Render | UGC-Aesthetic Static | Product-on-Gradient |
| Health/Wellness | Lifestyle-Render | Infographic/Data | UGC-Aesthetic Static | Product-on-Gradient |
| Home Goods | Lifestyle-Render | Editorial Cutout | Product-on-Gradient | UGC-Aesthetic Static |
| General/Unknown | Product-on-Gradient | Typography-Dominant | UGC-Aesthetic Static | Anderson Clay Diorama |

### 5.7 Shared Prompt Construction Principles

Every workflow file must include these shared elements:

**1. Hook-Bank Loading (identical across all workflows)**
```
Read hook-bank file for brand
Extract: brand colors (primary, secondary, accent hex values)
Extract: ICP summary and category
Extract: 6 hook concepts with psychology field
```

**2. Brand Anchor Block (required in all workflows)**
```
BRAND ANCHOR:
Owned positioning: [from hook-bank or research brief]
Visual translation: [how owned positioning becomes a visual element in THIS style]
Logo swap check: [confirmation that visual is brand-specific]
```

**3. Mobile Constraint Block (required in all workflows)**
```
MOBILE CONSTRAINTS:
Safe zone top: 14% clear
Safe zone bottom: 35% clear
Thumb zone: CTA not in bottom corners
Thumbnail legibility: hero + headline readable at 300px
Text size: 12pt+ equivalent at display resolution
```

**4. Aspect Ratio Coverage (required in all workflows)**
```
Generate prompts across aspect ratios:
- 2x at 4:5 (1080x1350) -- Feed optimized
- 2x at 1:1 (1080x1080) -- Feed standard / carousel
- 2x at 9:16 (1080x1920) -- Reels / Stories
```

**5. Output Format (standardized across all workflows)**
```json
{
  "brand": "brandname",
  "style": "style-name",
  "category": "detected-category",
  "brandColors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "concepts": [{
    "concept": 1,
    "story": {
      "hookType": "Pain|Aspiration|Social-Proof|Education|Urgency|Transformation|Curiosity",
      "hookSource": "Research section + element",
      "hookTarget": "ICP segment or General",
      "ownedPositioning": "What only this brand can claim",
      "visualTranslation": "How owned positioning appears visually",
      "psychology": "Why the hook works",
      "hook": "The headline text",
      "body": "Supporting copy",
      "cta": "Call to action text"
    },
    "stage": {
      "style-specific fields here": "varies by workflow"
    },
    "prompt": "Full prompt text...",
    "aspectRatio": "4:5|1:1|9:16",
    "dimensions": "1080x1350|1080x1080|1080x1920"
  }]
}
```

### 5.8 Per-Style Workflow File Structure

Each workflow file must be self-contained and include:

1. **Style Overview** -- What the style is, why it works, visual characteristics
2. **Hook-Bank Loading** -- Standard process (shared)
3. **Brand Anchor Derivation** -- How to translate owned positioning into this style's visual language
4. **Category Adaptation** -- How this style adjusts for different D2C categories
5. **Visual Concept Creation** -- Style-specific creative process
6. **Design Principles** -- Style-specific rules (composition, typography, color, texture)
7. **Prompt Template** -- Style-specific prompt structure with all required blocks
8. **Example Prompts** -- 2 complete examples demonstrating the style
9. **Mobile Constraint Integration** -- How safe zones apply to this style's layout
10. **Anti-Patterns** -- What to avoid (style-specific)
11. **Quality Checklist** -- Verification items before output
12. **Output Format** -- Standard JSON (shared)

### 5.9 Multi-Style Output Flow

```
Input: 6 hooks from hook-bank + brand category

Step 1: Select 3-4 styles based on category
  Example (beauty brand): Product-on-Gradient, Editorial Cutout, UGC-Aesthetic, Lifestyle-Render

Step 2: Assign hooks to styles based on psychology pairing
  Hook 1 (Pain) -> Typography-Dominant or Infographic
  Hook 2 (Social Proof) -> UGC-Aesthetic Static
  Hook 3 (Aspiration) -> Lifestyle-Render
  Hook 4 (Education) -> Infographic or Product-on-Gradient
  Hook 5 (Urgency) -> Typography-Dominant or Product-on-Gradient
  Hook 6 (Transformation) -> Editorial Cutout

Step 3: For each hook-style pair, dispatch to style workflow
  Each workflow generates 1 prompt per assigned hook
  Each prompt specifies aspect ratio (alternating to ensure coverage)

Step 4: Validate Entity ID distinctness
  Check that each prompt differs from all others on 3+ visual signal axes
  If two prompts are too similar, reassign one to a different style

Step 5: Write combined output
  All prompts written to single {brand}_prompts.json

Output: 6 prompts across 3-4 styles and 3 aspect ratios
  = 6 visually distinct Entity ID candidates
```

---

## 6. Entity ID Diversity Strategy

### 6.1 The N Hooks x M Styles Multiplication

Under Andromeda, each genuinely distinct combination of hook concept + visual style has the potential to register as a separate Entity ID.

**Current state:** 6 hooks x 1 style = 6 potential Entity IDs (but likely 1-2 due to visual clustering)

**Target state:** 6 hooks x 3-4 styles per brand = 18-24 potential Entity IDs

Each combination produces a distinct visual fingerprint paired with a distinct message, maximizing the chance of Andromeda treating each as a separate Entity ID.

### 6.2 Ensuring Genuine Distinctness

Each style must differ on multiple axes that Andromeda's computer vision analyzes:

| Signal Axis | How Styles Must Differ |
|-------------|----------------------|
| **Color composition** | Gradient vs. flat vs. selective vs. warm ambient |
| **Layout/composition** | Centered isolation vs. asymmetric collage vs. text-dominant vs. grid-structured vs. environmental scene vs. screenshot framing |
| **Objects and elements** | Product only vs. clay objects vs. icons/data vs. lifestyle objects vs. social UI elements |
| **Scene type** | No scene vs. miniature theater vs. editorial spread vs. data dashboard vs. lifestyle environment vs. social media post |
| **Text density/position** | Minimal overlay vs. baked-in architectural vs. text-as-hero vs. multi-section labels vs. testimonial quote vs. editorial serif |

**Validation rule:** Before finalizing a prompt, check that its visual description differs from every other style in the same brand's output on at least 3 of these 5 axes.

### 6.3 Hook-to-Style Pairing Logic

| Hook Psychology | Primary Style | Secondary Style | Why |
|----------------|--------------|-----------------|-----|
| Pain/Problem | Typography-Dominant | Infographic/Data | Pain hooks work as bold text statements or data-backed problem framing |
| Aspiration/Identity | Lifestyle-Render | Editorial Cutout | Aspiration needs environmental/aesthetic context |
| Social Proof | UGC-Aesthetic Static | Infographic/Data | Social proof needs testimonial framing or data validation |
| Education/Value | Infographic/Data | Lifestyle-Render | Education needs structured information or in-use demonstration |
| Urgency/Scarcity | Typography-Dominant | Product-on-Gradient | Urgency needs bold text impact or direct product + offer |
| Transformation | Editorial Cutout | Product-on-Gradient | Transformation needs before/after structure or clear product showcase |
| Curiosity/Question | Typography-Dominant | Anderson Clay Diorama | Questions work as bold text or intriguing visual scenes |

### 6.4 Entity ID Diversity Checklist (Pre-Launch Audit)

Before deploying any creative set:

- [ ] **Visual style count:** 4+ visually distinct styles? (1-2 styles = 1-2 Entity IDs regardless of hook count)
- [ ] **Psychological driver diversity:** 3+ different emotional drivers?
- [ ] **Format diversity:** 2+ formats in the set?
- [ ] **Storytelling structure variation:** 3+ different narrative structures?
- [ ] **Logo swap test (per hook):** Could a competitor use this hook by changing the brand name?
- [ ] **Tone variation:** 2+ different tones?
- [ ] **Copy length variation:** Mix of short-form (<125 chars) and medium-form (125-150 chars)?

**Danger signals:**
- All creatives use same background color/gradient family
- All creatives use same composition layout
- All creatives address same pain point in same emotional register
- All creatives use same visual style
- Hooks differ only in headline text while sharing same visual

---

## 7. Output Format Diversity

### 7.1 Current State vs. Recommended Mix

| Format | Current | Recommended | Gap |
|--------|---------|-------------|-----|
| Video (Reels/Feed) | 0% | 50% | Pipeline cannot generate video |
| Static Image | 100% | 30% | Over-indexed on single format |
| Carousel | 0% | 20% | No carousel support |

### 7.2 UGC Brief: Founder Selfie Format

The most accessible UGC format. Requires no external creator, no production budget -- only a founder, a phone, and a window.

```
## FOUNDER SELFIE BRIEF

### Campaign Context
- Brand: [Name]
- Product/Offer: [Specific product or promotion]
- Funnel Stage: [TOF / MOF / BOF]
- Target ICP Segment: [From research brief]
- Psychological Driver: [Pain / Aspiration / Social Proof / Urgency / Education / Transformation]

### The Hook (First 3 Seconds)
- Opening line (spoken): "[Exact scripted line -- conversational tone]"
- Text overlay (burned in): "[5-8 word hook displayed on screen]"
- Visual action: [What the founder does physically]
- Emotional register: [Specific emotion to convey]

### Script Structure (15-30 seconds total)
1. HOOK (0-3s): [Opening line + visual action]
2. PROBLEM/CONTEXT (3-8s): [1-2 sentences establishing why this matters]
3. BRIDGE (8-15s): [How the product connects to the problem]
4. PROOF (15-22s): [Specific claim, number, testimonial reference, or demonstration]
5. CTA (22-30s): [Single clear next step aligned to funnel stage]

### Talking Points (Not a Script -- Hit These Beats Naturally)
- Beat 1: [Core pain point in customer language, from VoC research]
- Beat 2: [Owned differentiation -- what ONLY this brand can claim]
- Beat 3: [Specific proof point most relevant to this ICP segment]
- Beat 4: [Transformation or outcome in customer language]

### Shot Direction
- Framing: Vertical (9:16), head-and-shoulders, natural background
- Lighting: Natural window light, no ring light
- Eye line: Direct to camera lens
- Environment: [Specific -- home office, kitchen, warehouse, etc.]
- Product integration: [When and how to show product]
- Energy: [Conversational, not performative. Speak like telling a friend.]

### What NOT to Do
- Do not open with brand name or product name
- Do not use ring light (signals "ad" to audience)
- Do not script word-for-word -- hit the beats, speak naturally
- Do not include multiple CTAs
- Do not mention competitors by name

### Technical Specs
- Aspect ratio: 9:16 (1080x1920)
- Duration: 15-30 seconds (under 15 preferred for TOF)
- Captions: Burned-in, bold black-on-white, positioned in center frame
- Audio: Direct voice, no background music (or very subtle)
```

### 7.3 UGC Creator Brief: External Creator Format

For brands that source external UGC creators. More structured because the creator has no inherent brand knowledge.

```
## UGC CREATOR BRIEF

### Brand & Product Context
- Brand: [Name]
- Brand voice: [2-3 adjective description]
- Product: [Specific product being featured]
- Key claim: [The ONE thing the creator must communicate]
- Owned position: [What separates this brand from competitors]

### Creator Direction
- Creator type: [Everyday user / micro-influencer / expert / relatable peer]
- Demographic alignment: [Age range, vibe, setting that matches ICP]
- Tone: [Genuine surprise, calm authority, excited discovery, relatable frustration]

### Hook Options (Choose One)
1. "[Scripted hook option A -- pattern interruption style]"
2. "[Scripted hook option B -- question style]"
3. "[Scripted hook option C -- social proof style]"

### Scene Breakdown (Shot List)
| Shot | Duration | Action | Audio | Text Overlay |
|------|----------|--------|-------|-------------|
| 1 | 0-3s | [Hook action] | "[Opening line]" | "[Hook text]" |
| 2 | 3-8s | [Problem/context] | "[Talking point]" | None |
| 3 | 8-15s | [Product demo] | "[Mechanism explanation]" | "[Key stat or claim]" |
| 4 | 15-22s | [Proof/result] | "[Outcome language]" | "[Social proof number]" |
| 5 | 22-30s | [CTA + product hold] | "[Closing line]" | "[CTA text]" |

### Emotional Arc
- Open with: [Starting emotion -- curiosity, frustration, skepticism]
- Build to: [Middle emotion -- discovery, understanding, excitement]
- Close with: [Ending emotion -- confidence, satisfaction, urgency]

### Product Integration
- When to show product: [Exact shot number]
- How to show product: [Unboxing, applying, holding, using]
- Label/packaging visible: [Yes/No and when]
- Avoid: [Product angles that hide key branding]

### Deliverables
- 3 takes minimum (different energy levels)
- Raw footage (no editing by creator)
- Vertical 9:16
- Natural lighting only
- No filters, no beauty mode
```

### 7.4 Carousel Storyboard

```
## CAROUSEL STORYBOARD

### Campaign Context
- Brand: [Name]
- Funnel Stage: [TOF / MOF / BOF]
- Carousel Type: [Story progression / Educational / Social proof sequence / Before-after / Product showcase]
- Card Count: [3-7 cards -- first card is strongest, mobile users see ~1.75 cards initially]

### Card Sequence

#### Card 1: THE HOOK (Must stop the scroll)
- Visual direction: [What the image shows -- this is the scroll-stopper]
- Text overlay: "[5-10 word hook -- question, bold claim, or pattern interrupt]"
- Purpose: Create curiosity or tension that compels swipe

#### Card 2: THE PROBLEM / CONTEXT
- Visual direction: [Illustrate the pain point or situation]
- Text overlay: "[Expand on the hook -- deepen the tension]"
- Purpose: Validate the viewer's experience, build emotional investment

#### Card 3: THE MECHANISM / BRIDGE
- Visual direction: [Show HOW the product solves the problem]
- Text overlay: "[Explain the mechanism or differentiator]"
- Purpose: Education -- give the viewer a reason to believe

#### Card 4: THE PROOF
- Visual direction: [Testimonial, data point, before/after, or social proof]
- Text overlay: "[Specific proof -- number, quote, or result]"
- Purpose: Remove doubt, build trust

#### Card 5: THE CTA
- Visual direction: [Product beauty shot or offer visual]
- Text overlay: "[Clear CTA aligned to funnel stage]"
- Purpose: Convert attention into action

### Visual Consistency Rules
- Color palette: [Consistent across all cards]
- Typography: [Same font family, size hierarchy]
- Layout pattern: [Consistent positioning]
- Aspect ratio: 1:1 (1080x1080) for feed carousel

### Carousel Types and When to Use

| Type | Structure | Best For |
|------|-----------|----------|
| Story Progression | Hook -> Problem -> Solution -> Proof -> CTA | TOF prospecting |
| Educational | Hook -> Step 1 -> Step 2 -> Step 3 -> CTA | MOF education |
| Social Proof Sequence | Review 1 -> Review 2 -> Review 3 -> Product -> CTA | BOF conversion |
| Before/After | Before -> Transformation -> After -> How -> CTA | Beauty, fitness, wellness |
| Product Showcase | Hero -> Feature 1 -> Feature 2 -> Lifestyle -> CTA | E-commerce, high-SKU |
```

### 7.5 Video Storyboard Outline

```
## VIDEO STORYBOARD OUTLINE

### Format
- Platform: [Reels / Feed Video / Stories]
- Duration: [15s / 30s / 60s]
- Aspect ratio: 9:16 (vertical) or 4:5 (feed)
- Style: [UGC / Founder / Product demo / Motion graphics / Testimonial]

### Scene Breakdown

| Scene | Time | Visual | Audio | Text Overlay | Purpose |
|-------|------|--------|-------|-------------|---------|
| 1 | 0-3s | [Hook visual] | "[Opening line]" | "[Hook text]" | Attention |
| 2 | 3-8s | [Problem/context] | "[Narration]" | "[Supporting text]" | Problem |
| 3 | 8-18s | [Product demo or mechanism] | "[Explanation]" | "[Key claim]" | Bridge |
| 4 | 18-25s | [Proof -- testimonial, result] | "[Social proof]" | "[Data or quote]" | Trust |
| 5 | 25-30s | [CTA visual] | "[Closing line]" | "[CTA]" | Convert |

### Production Notes
- Pacing: [Fast cuts for TOF, slower for MOF education]
- Transitions: [Cut, swipe, zoom -- platform-native]
- Sound design: [Trending audio, voiceover, natural sound, or silent-optimized]
- Caption style: [Bold black-on-white centered -- mandatory for sound-off viewing]
```

### 7.6 Organic Post Concept

```
## ORGANIC POST CONCEPT

### Post Type: [Educational / Behind-the-scenes / Product moment / Customer spotlight / Hot take]

### Caption
- Hook line: "[First line -- appears before 'See more']"
- Body: "[2-3 sentences expanding the hook]"
- CTA: "[Soft engagement ask -- question, comment prompt, save prompt]"

### Visual Direction
- Image/video concept: [What to photograph, film, or design]
- Aesthetic: [Match brand's organic feed -- NOT ad aesthetic]
- Authenticity markers: [Natural lighting, real setting, imperfect framing]

### Boosting Criteria
- Boost if: [Engagement rate exceeds organic average within 24 hours]
- Boost objective: [Engagement / Reach / Traffic]
- Boosted audience: [Broad -- let Andromeda optimize from organic signals]
```

### 7.7 How Research Data Feeds Into Briefs

| Brief Field | Pipeline Source | Research Section |
|-------------|---------------|-----------------|
| Psychological Driver | Hook bank -- each hook tagged with driver | Hook methodology |
| Opening line (hook) | Hook bank -- top hooks per driver | Hook output |
| Talking points | Research brief -- pain points, VoC language, proof points | Sections C, D, E |
| Owned positioning | Research brief -- competitive context | Section A |
| ICP segment alignment | Research brief -- ICP analysis | Existing ICP |
| Emotional arc | Hook methodology -- emotional register mapping | Section 3.4 |
| Product integration | Research brief -- key products, primary value props | Existing |
| CTA alignment | Funnel stage tagging from hook generation | Section 3.2 |

### 7.8 Full Session Output Target

| Format | Pipeline Output | Production Requirement | Mix Coverage |
|--------|----------------|----------------------|-------------|
| Video (50%) | Video storyboard outlines + UGC briefs + Founder selfie briefs | Human production | Indirect -- pipeline provides strategy |
| Static (30%) | AI-rendered images across 4-6 styles | None -- immediately deployable | Direct -- full pipeline control |
| Carousel (20%) | Carousel storyboards with per-card direction | Light design execution | Semi-direct -- template execution |

---

## 8. Creative Testing & Optimization

### 8.1 Hook x Style Matrix Generation

```
HOOK x STYLE TESTING MATRIX

Hooks (from hook bank):
H1: [Pain-driver hook]
H2: [Aspiration-driver hook]
H3: [Social-proof-driver hook]

Styles (from visual style library):
S1: Product-on-gradient
S2: Typography-dominant
S3: Clay diorama
S4: Editorial cutout

Output Matrix (H x S):
|    | S1    | S2    | S3    | S4    |
|----|-------|-------|-------|-------|
| H1 | H1-S1 | H1-S2 | H1-S3 | H1-S4 |
| H2 | H2-S1 | H2-S2 | H2-S3 | H2-S4 |
| H3 | H3-S1 | H3-S2 | H3-S3 | H3-S4 |

= 12 distinct creatives, each a unique Hook x Style combination
= 12 potential Entity IDs
```

### 8.2 Funnel-Stage Creative Sets

**TOF Set (Awareness)**
- 3-4 static images: Different psychological drivers (pain, aspiration, curiosity)
- 1-2 video storyboards: Hook-first Reels, pattern interruption
- 1 carousel storyboard: Educational or story-progression type
- 1-2 organic post concepts: Educational or hot-take format
- Copy framework: AIDA or storytelling
- CTA tone: Soft -- "Learn More," "See How," "Discover"
- Visual styles: Typography-dominant, lifestyle-render (scroll-stopping, novel)

**MOF Set (Education)**
- 2-3 static images: Mechanism explanation, feature breakdowns
- 1-2 video storyboards: Founder video, product demo, FAQ format
- 1 carousel storyboard: Educational or social-proof sequence
- 1 UGC creator brief: Testimonial or expert review format
- Copy framework: PAS or FAB
- CTA tone: Educational -- "See Results," "Read Reviews," "Watch Demo"
- Visual styles: Infographic/data-visual, editorial cutout, product-on-gradient

**BOF Set (Conversion)**
- 2-3 static images: Offer-driven, urgency, price/value
- 1 carousel storyboard: Social proof sequence or product showcase
- 1 founder selfie brief: Personal recommendation with offer
- Copy framework: Direct offer + urgency
- CTA tone: Direct -- "Shop Now," "Claim Offer," "Get 40% Off"
- Visual styles: Product-on-gradient, typography-dominant

### 8.3 Refresh Cadence Model

Research consensus: 5-10 new ads launched weekly, run untouched for 7 days before evaluating, creative fatigue after 4 exposures (~45% conversion drop), top ads see significant drops within 2-4 weeks, high-spend accounts need new variants every 3-4 days.

| Week | Action | Pipeline Output |
|------|--------|----------------|
| Week 1 | Initial creative generation | Full set: 6-12 statics, 2-3 carousels, 2-4 video storyboards, 2-3 briefs, 3-5 organic posts |
| Week 2 | Evaluate, launch refresh | 5-10 new variations on winning hooks x new styles |
| Week 3 | Retire underperformers, iterate | New hook angles using winning visual styles |
| Week 4 | Full creative refresh | New hook bank generation, new style combinations |

**Rotation logic:** When a hook performs well, rotate across new visual styles. When a visual style performs well, rotate new hooks through it.

### 8.4 A/B Test Structure

For each test cycle, generate matched pairs:
- **Same hook, different style:** Tests visual treatment (Entity ID diversity test)
- **Same style, different hook:** Tests message resonance (messaging test)
- **Same hook+style, different funnel copy:** Tests CTA and copy (conversion test)

Each pair runs 7 days minimum with 100+ conversions before declaring a winner.

### 8.5 Creative Fatigue Monitoring Signals

| Signal | Metric | Threshold | Action |
|--------|--------|-----------|--------|
| Hook rate decline | 3-sec views / impressions | >20% drop from baseline | Refresh hooks |
| CPMr spike | Cost per 1,000 unique reach | Exceeds $20 or >30% WoW rise | New creative needed |
| Frequency ceiling | Average impressions per user | >4 exposures | Rotate to new set |
| CTR decay | Click-through rate | >15% decline from peak | Replace underperformers |
| Creative age | Days since launch | >14 days TOF, >21 days BOF | Mandatory refresh |
| Conversion rate decline | Purchases / link clicks | >20% decline from week 1 | Full creative + offer refresh |

**Key insight:** Rising CPMr is the primary early warning signal. When CPMr exceeds $20, the fix is creative refresh, not bid adjustment.

### 8.6 Performance Feedback Loop Design

```
1. TAG OUTPUTS
   - Every hook: psychological_driver, funnel_stage, hook_type, owned_position_reference
   - Every visual: style_name, composition_type, category_match
   - Every brief: format, creator_type, emotional_arc

2. CAPTURE RESULTS (Manual Input -- v1)
   After 7-day run, marketer inputs per-creative:
   - Hook rate (3-sec views / impressions)
   - CTR (link clicks / impressions)
   - Cost per result
   - Conversion rate
   - Creative age at retirement

3. PATTERN EXTRACTION
   - Which psychological_driver produced highest hook rates?
   - Which style_name produced lowest CPM?
   - Which funnel_stage x hook_type combos produced best cost-per-result?
   - Which hooks passed/failed logo-swap prediction vs. actual performance?

4. ITERATE
   - Next run: Weight toward winning drivers, styles, and types
   - Deprioritize (don't eliminate) underperforming combinations
   - Generate new variations within winning directions
   - Test new combinations in losing directions (may need different visual treatment)
```

V1 is manual input. V2 (future) integrates with Meta Ads API or analytics platforms.

---

## 9. Implementation Roadmap

### Dependency Map

```
[Research Layer Improvements] -----> [Brief Generation Quality]
         |
         +-------------------------> [Hook Quality (all formats)]

[Visual Style Expansion] ----------> [Entity ID Diversity (statics)]
         |
         (no dependency on research for initial styles)

[Brief + Storyboard Templates] ----> [Format Diversity (video, carousel)]
         |
         (depends on research layer for strategic content)
```

### Phase 1: Parallel Foundation (Weeks 1-2)

**Stream A: Visual Style Expansion**

Add 6 new art style workflows. Priority order:

| # | Style | Rationale | Effort |
|---|-------|-----------|--------|
| 1 | Product-on-gradient | Lowest risk, highest versatility, dominant D2C pattern | 1-2 days |
| 2 | Typography-dominant | Zero uncanny valley risk. Serves SaaS/tech. Maximally distinct. | 1-2 days |
| 3 | Infographic/data-visual | MOF/BOF education. Authority-building. Distinct layout. | 1-2 days |
| 4 | Editorial cutout | Fashion/beauty/premium. Growing trend. | 1-2 days |
| 5 | Lifestyle-render | Aspirational. Medium uncanny valley risk (no humans). | 1-2 days |
| 6 | UGC-aesthetic static | Social-proof-driven. Universal category fit. | 1-2 days |

Each style is a workflow markdown file + prompt engineering extending existing SKILL.md infrastructure.

**Stream B: Strategic Research Layer**

Changes to research agent template:
1. Add Owned Positioning section (P0)
2. Add Competitive Context field (P0)
3. Add Buying Objection extraction per ICP segment (P0)
4. Add Feature-to-Emotion translation layer (P0)
5. Add Customer Language / VoC section (P1)
6. Add Brand Story / Origin section (P1)
7. Add Category Intelligence section (P1)

Changes to hook skill:
1. Enforce logo-swap test as hard validation gate (P0)
2. Add 3-3-3 variety framework (P0)
3. Expand extraction to mine new research sections (P0)
4. Update hook output format with new metadata fields (P0)

No new architecture required -- template additions only.

### Phase 2: Brief Generation & Testing (Weeks 2-4)

With the improved research layer providing richer strategic inputs:

1. **Founder Selfie Brief** -- Most accessible. No production infrastructure needed.
2. **UGC Creator Brief** -- Full script with shot list. For brands with creator access.
3. **Carousel Storyboard** -- Card-by-card narrative. Semi-direct template execution.
4. **Organic Post Concept** -- Optimized for boosting.

Effort: Text template generation using existing research and hook data. New arrangement of existing capabilities, not new architecture.

### Phase 3: Format Expansion (Weeks 4-6)

1. **Video Storyboard Outlines** -- Scene-by-scene production briefs enabling video portion of 50/30/20 mix.
2. **Category-Aware Style Routing** -- Art style SKILL.md detects brand category from research brief and biases default selection.
3. **Mobile Composition Constraints** -- Safe-zone enforcement, thumb-zone awareness, thumbnail legibility in all art style prompt workflows.

### Phase 4: Feedback & Iteration (Weeks 6+)

1. **Performance tagging system** -- Every output tagged with driver, style, funnel stage, hook type.
2. **Manual feedback input** -- Marketer inputs 7-day performance data per creative.
3. **Pattern extraction** -- Identify winning driver x style x funnel combinations.
4. **Iteration weighting** -- Next pipeline run biases toward winning combinations.

### Priority Justification

| Phase | Why This Order | Blocking Dependency |
|-------|---------------|-------------------|
| 1A: Visual Styles | Fixes binding constraint (Entity ID clustering). All other improvements partially wasted while output collapses to 1-2 IDs. | None -- extends existing architecture |
| 1B: Research Layer | Foundation for hook quality, brief quality, all output differentiation. | None -- template changes only |
| 2: Brief Generation | Unlocks highest-performing content types (UGC, founder). Requires improved research. | Depends on 1B |
| 3: Format Expansion | Covers video and carousel portions of recommended mix. | Depends on Phase 2 templates |
| 4: Feedback Loop | Enables data-driven iteration. Requires output diversity for meaningful comparisons. | Depends on Phases 1-3 |

### Full Pipeline Output After Implementation

A single pipeline session produces:

- **6-12 static images** across 4-6 visually distinct styles (6-12 potential Entity IDs)
- **2-3 carousel storyboards** with per-card direction (2-3 additional Entity IDs)
- **2-4 video storyboard outlines** as production briefs (enabling video format)
- **2-3 UGC/founder briefs** directing highest-performing content types
- **3-5 organic post concepts** for boosting
- **All outputs tagged** with psychological driver, funnel stage, visual style, hook type
- **Hook x Style matrix** enabling systematic A/B testing
- **Funnel-stage sets** (TOF/MOF/BOF) with format-appropriate creative in each

This moves the pipeline from "6 hooks + 6 images in one style" to "15-30 strategically diverse outputs across multiple formats, styles, and funnel stages" -- aligned with the 5-10 new ads/week cadence that the research universally recommends.

---

## Appendix: Data Flow Contracts

### Research -> Hooks Field Contracts

| Research Field | Hook Skill Usage | Required Format |
|---------------|-----------------|-----------------|
| `Owned Positioning > What can ONLY this brand claim?` | Logo-swap revision anchor | Single sentence, specific |
| `Competitive Context > White Space Opportunities` | Hook angle discovery | Bulleted list of untapped angles |
| `Buying Objections > [Per segment]` | Objection-handling hooks | Structured: objection + brand answer + hook potential |
| `Feature-to-Emotion > [Per feature]` | Emotional hook construction | Structured: feature + emotional benefit + hook framing |
| `Customer Language > Customer Pain Language` | Verbatim-language hooks | Quoted phrases |
| `Customer Language > Trigger Events` | Situational hooks | Described events |
| `Customer Language > Outcome Language` | Transformation hooks | Quoted phrases |
| `Brand Story > Origin Moment` | Narrative hooks | 2-3 sentences |
| `Brand Story > Brand Archetype` | Tone calibration | Single archetype name |
| `Category Intelligence > Seasonal Opportunities` | Temporal hooks | Event + hook opportunity |

### Research -> Visuals Field Contracts

| Research Field | Visual Skill Usage | Required Format |
|---------------|-------------------|-----------------|
| `Brand Colors` | Color palette for all styles | Hex codes |
| `Brand Voice` | Typography and composition tone | Tone descriptors |
| `Owned Positioning > Differentiation Thesis` | Visual metaphor anchor | Single sentence |
| `Category Intelligence` | Category-aware style routing | Category name |
| `Brand Story > Brand Archetype` | Visual personality | Archetype name |
| `Competitive Context > Direct Competitors` | Visual differentiation | Competitor visual patterns to AVOID |

### Hook -> Visual Handoff Fields

| Hook Field | Visual Usage |
|-----------|-------------|
| Format Intention (`STATIC / VIDEO-SCRIPT / CAROUSEL-LEAD / UGC-BRIEF / ORGANIC`) | Determines output mode |
| Visual Direction (one-line note) | What image should SHOW to complement copy |
| Psychological Driver | Selects appropriate visual treatment |

### Research -> Brief Field Contracts

| Research Field | Brief Usage | Required Format |
|---------------|-------------|-----------------|
| `Customer Language > Customer Pain Language` | Script opening lines | Quoted phrases |
| `Feature-to-Emotion` | Talking points | Emotional benefit list |
| `Buying Objections` | Objection-handling script sections | Structured objection-answer pairs |
| `Brand Story` | Founder brief content | Origin narrative |
| `ICP Segments` | Creator selection and tone guidance | Demographic + psychographic |

---

## Appendix: Changes Summary

### Research Agent (`research.md`)

| Change | Type | Priority |
|--------|------|----------|
| Add Owned Positioning section | New section | P0 |
| Add Competitive Context section | New section | P0 |
| Add Buying Objections section | New section | P0 |
| Add Feature-to-Emotion Translation | New section | P0 |
| Add Customer Language / VoC section | New section | P1 |
| Add Brand Story / Origin section | New section | P1 |
| Add Category Intelligence section | New section | P1 |
| Add Steps 2.5-2.7 (About page, competitive scan, VoC scan) | Workflow expansion | P0 |
| Add Step 3.5 (Strategic Analysis) | Workflow expansion | P0 |
| Update line target ~60-70 -> ~150-200 | Parameter change | P0 |

### Hook Skill (`SKILL.md`)

| Change | Type | Priority |
|--------|------|----------|
| Replace validation with 5-gate hard validation | Section rewrite | P0 |
| Add 3-3-3 variety framework | New section | P0 |
| Add Step 1.5: Funnel Mapping | New step | P0 |
| Add extraction blocks for new research sections | Step 1 expansion | P0 |
| Update hook output format with new metadata | Output format change | P0 |
| Update extraction checklist with new sections | Checklist expansion | P0 |
| Add Step 4.5: Visual Direction Note | New step | P1 |
| Expand CTA formula with funnel-stage specificity | Section expansion | P1 |
| Update emotional trigger checklist | Section rewrite | P1 |
| Add Andromeda copy optimization reference | New reference | P2 |

### Art Style Skill (`SKILL.md` + 6 new workflow files)

| Change | Type | Priority |
|--------|------|----------|
| Add Product-on-Gradient workflow | New file | P0 |
| Add Typography-Dominant workflow | New file | P0 |
| Add Infographic/Data-Visual workflow | New file | P0 |
| Add Editorial Cutout workflow | New file | P0 |
| Add Lifestyle-Render Hybrid workflow | New file | P1 |
| Add UGC-Aesthetic Static workflow | New file | P1 |
| Update SKILL.md routing table | Section expansion | P0 |
| Add category-aware default routing | New section | P1 |
| Add hook-to-style pairing logic | New section | P1 |
| Add shared prompt construction principles | New section | P0 |
| Add mobile constraints to all workflows | Section addition | P1 |
| Update aspect ratio strategy (add 4:5) | Parameter change | P1 |

### New Output Modes

| Change | Type | Priority |
|--------|------|----------|
| Add Founder Selfie Brief template | New output type | P1 |
| Add UGC Creator Brief template | New output type | P1 |
| Add Carousel Storyboard template | New output type | P1 |
| Add Video Storyboard Outline template | New output type | P2 |
| Add Organic Post Concept template | New output type | P2 |

### Integration / Cross-Cutting

| Change | Type | Priority |
|--------|------|----------|
| Define research-to-hook field contracts | Documentation | P0 |
| Define hook-to-visual handoff fields | Documentation | P0 |
| Define research-to-brief field contracts | Documentation | P1 |
| Define category-aware style routing table | Specification | P1 |
| Define Entity ID diversity checklist | Specification | P0 |
| Define feedback loop integration points | Architecture spec | P2 |
