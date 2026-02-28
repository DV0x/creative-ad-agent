# Synthesis A: Research Methodology & Hook Pipeline Improvements

**Date:** 2026-02-24
**Scope:** Enhanced research agent, improved hook methodology, and integration points between pipeline stages
**Grounded against:** `agent/.claude/agents/research.md`, `agent/.claude/skills/hook-methodology/SKILL.md`, 28 research briefs, 37 hook banks, all debate/critique documents

---

## Section 1: Enhanced Research Agent

### 1.1 Problem Statement

The current research agent (`research.md`) extracts facts from a single homepage. It captures WHAT a brand does but not WHY it matters, HOW it differs from competitors, or WHAT emotional truth drives its positioning. Research D demonstrated this across 5 brand pipelines: every hook bank produces competent but generic output that a competitor could use by swapping the logo.

The critique confirmed: the research agent has no field for owned positioning, no competitive context, no emotional translation, no customer language extraction, no brand story, and no buying objection mapping. These are not nice-to-haves. They are the data inputs that separate high-performing ads from category-generic ones.

### 1.2 What WebSearch + WebFetch Can Realistically Capture

Before specifying new sections, we must be honest about tooling constraints. The research agent has access to WebFetch (single URL + prompt) and WebSearch (web search queries). It does NOT have authenticated API access, multi-page crawling, or platform-specific scrapers.

**Feasible with current tools:**

| Data Type | Method | Reliability |
|-----------|--------|-------------|
| Homepage extraction (current) | WebFetch on brand URL | High |
| About/founder page | WebFetch on brand /about URL | High |
| Competitor identification | WebSearch for "[category] alternatives to [brand]" | Medium-High |
| Competitor homepage claims | WebFetch on top 2-3 competitor URLs | Medium |
| Review snippets (public) | WebSearch for "[brand] reviews" or WebFetch on review page if accessible | Medium |
| Reddit/forum mentions | WebSearch for "site:reddit.com [brand]" | Medium |
| Product Hunt page | WebFetch on Product Hunt URL | Medium (if exists) |
| Category trends | WebSearch for "[category] trends 2026" | Medium |
| Founder interviews | WebSearch for "[brand] founder interview" or "[brand] origin story" | Low-Medium |
| Meta Ad Library | NOT feasible (requires authentication) | Not available |
| Full review scraping | NOT feasible (pagination, authentication) | Not available |
| Social listening at scale | NOT feasible (API access required) | Not available |

**Design principle:** Every new research section must be completable with WebFetch + WebSearch + LLM reasoning. Sections that require data the agent cannot access should use LLM knowledge as a fallback with explicit marking: "[Based on general knowledge -- verify with brand]".

### 1.3 New Research Sections (Additions to research.md template)

The following sections are added AFTER the existing template sections (The Offer through ICP). The existing template is preserved unchanged.

#### Section A: Owned Positioning

**Priority:** Highest. This is the single most impactful addition. Every hook, visual, and brief downstream depends on knowing what the brand uniquely owns.

**Agent instructions:**

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

---

#### Section B: Competitive Context

**Priority:** High. Even rough competitive intelligence dramatically improves hook specificity.

**Agent instructions:**

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

---

#### Section C: Buying Objections

**Priority:** High. Each objection is a separate hook angle. The current pipeline has zero objection extraction.

**Agent instructions:**

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

---

#### Section D: Feature-to-Emotion Translation

**Priority:** High. This is the translation layer between technical features and emotional hooks. The current pipeline skips this step entirely, causing hooks to stay at the feature level.

**Agent instructions:**

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

---

#### Section E: Customer Language & VoC Signals

**Priority:** Medium-High. Customer language produces hooks that feel authentic rather than manufactured. Feasibility depends on whether reviews or community discussions are publicly accessible.

**Agent instructions:**

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
2. WebSearch: "[brand] reviews" -- extract language patterns from review snippets in search results
3. WebSearch: "site:reddit.com [brand]" or "[brand] reddit" -- extract community language
4. From LLM reasoning: Infer typical trigger events and hesitations for this product category
5. Mark all inferred language clearly vs. verbatim customer quotes

---

#### Section F: Brand Story / Origin

**Priority:** Medium. Founder stories humanize brands and produce hooks with emotional weight. Not all brands have accessible origin stories.

**Agent instructions:**

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

---

#### Section G: Category Intelligence

**Priority:** Medium. Provides seasonal hooks, trend hooks, and regulatory context that the current pipeline entirely misses.

**Agent instructions:**

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

---

### 1.4 Research Agent Template Changes Summary

**Additions to `research.md`:**

| New Section | Lines Added | Data Source | Downstream Consumer |
|-------------|-------------|-------------|---------------------|
| Owned Positioning | ~15 | Homepage + competitor search + LLM | Hook skill (logo-swap validation), Visual skill (brand metaphors) |
| Competitive Context | ~20 | WebSearch + WebFetch competitors + LLM | Hook skill (white space hooks), Visual skill (differentiation) |
| Buying Objections | ~15 per segment | Homepage + reviews + LLM | Hook skill (objection hooks), Brief generation |
| Feature-to-Emotion | ~5 per feature | LLM reasoning on extracted features | Hook skill (emotional hooks), Visual skill (emotional visual cues) |
| Customer Language / VoC | ~20 | Testimonials + WebSearch reviews/Reddit | Hook skill (VoC-language hooks), Brief generation |
| Brand Story / Origin | ~12 | About page + WebSearch + LLM | Hook skill (founder hooks), Brief generation |
| Category Intelligence | ~15 | WebSearch + LLM | Hook skill (temporal hooks), Visual skill (category-aware routing) |

**Total template size increase:** ~100-120 lines (from ~60-70 to ~170-190). The agent's line target should be updated from "~60-70 lines" to "~150-200 lines."

**Workflow change:** The current research agent has 4 steps (Extract Brand Name, Fetch Homepage, Analyze ICP, Write Brief). The new workflow adds:

- **Step 2.5: Fetch About/Story Page** -- WebFetch the /about or /our-story page for brand story extraction
- **Step 2.6: Competitive Scan** -- WebSearch for competitors, WebFetch top 2-3 competitor homepages
- **Step 2.7: Customer Language Scan** -- WebSearch for reviews, Reddit mentions, community discussions
- **Step 3.5: Strategic Analysis** -- Using all extracted data, populate Owned Positioning, Competitive Context, Buying Objections, Feature-to-Emotion Translation, and Category Intelligence sections

**Time impact:** Research will take longer per brand (~3-5 min vs ~1-2 min). This is acceptable because the downstream quality improvement is multiplicative -- every hook, visual, and brief benefits from richer research input.

---

## Section 2: Improved Hook Methodology

### 2.1 Logo-Swap Enforcement

The current SKILL.md includes "Is it OWNED?" as item #2 in the final validation checklist. The critique confirmed this check is present but not enforced -- hook bank output consistently fails it. The fix is not adding a new check but giving the existing check enforcement teeth.

**Change to SKILL.md -- replace the current Validation Checklist (Final Pass) section:**

```
## Validation Checklist (Final Pass) — HARD GATES

Before each hook is complete, it must pass ALL five gates.
Hooks that fail any gate MUST be revised. Do not ship failing hooks.

### Gate 1: TRACEABLE
Can you point to the exact research element this hook came from?
- YES: Pass. Cite the source section.
- NO: Reject. Return to Step 1 and find a research source.

### Gate 2: OWNED (Logo-Swap Test)
Perform this three-part test:

**Test A — Logo Swap:**
"If I replace this brand's name with a direct competitor's, does the hook still work?"
- If YES → Hook is generic. MUST revise.
- If NO → Pass.

**Test B — Emotional Ownership:**
"Is this hook's emotional territory already claimed by a competitor?"
- If YES → Hook enters a crowded space. Revise to target untapped emotional territory.
  (Requires Competitive Context section in research. If unavailable, assess against common category messaging.)
- If NO → Pass.

**Test C — Customer Recognition:**
"Would a real customer of THIS brand say 'that's exactly how I feel'?"
- If YES → Pass. Hook uses authentic language/emotion.
- If NO → Revise using Customer Language / VoC section.

**Scoring:**
- 3/3: Ship.
- 2/3: Revise the failing test.
- 1/3 or 0/3: Fundamental rework needed. Return to extraction.

**Revision instruction when Logo Swap fails:**
Anchor the hook to one of these owned elements from the research:
1. A specific number only this brand can claim (e.g., "350+ lenders", "72-hour BRRR funding")
2. A named product, methodology, or feature unique to this brand
3. The brand's owned positioning from the Owned Positioning research section
4. Verbatim customer language from the VoC section that references this specific brand

### Gate 3: FELT
Does the hook name or evoke an emotion, not just state a fact?
- YES: Pass.
- NO: Apply the Feature-to-Emotion Translation from research. Rewrite the hook at the emotional level.

### Gate 4: CLEAR
Can it be understood in 3 seconds or less?
- YES: Pass.
- NO: Simplify. Cut words. Choose shorter phrasing.

### Gate 5: THEIRS
Does it use the brand's words, the customer's world, and the brand's voice?
- YES: Pass.
- NO: Check Brand Voice and Customer Language sections. Calibrate tone and terminology.
```

### 2.2 Hook Variety Generation: The 3-3-3 Framework Adaptation

Research C identifies the Pilothouse 3-3-3 framework as the leading testing methodology: 3 funnel levels x 3 angles x 3 formats = 27 combinations. The current hook skill generates hooks without funnel-stage or format awareness.

**New section to add to SKILL.md after the Variety Check:**

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

When generating 6 hooks, a minimum viable distribution is:
- At least 2 funnel stages represented
- At least 3 psychological angles represented
- At least 2 format intentions represented
```

### 2.3 Funnel-Stage Hooks (TOF / MOF / BOF)

The current hook skill has no funnel awareness. All hooks are generated at a single undifferentiated level. Research C (Section 4) and Research A (Section 7) both emphasize that GEM orchestrates ad sequences across funnel stages. Complementary creative sets outperform isolated ads.

**New extraction step to add to SKILL.md between Step 1 (EXTRACT) and Step 2 (MATCH):**

```
## Step 1.5: FUNNEL MAPPING

After extraction, map each research element to its natural funnel stage:

### TOF-Ready Elements (Awareness)
- Pain points that name universal frustrations (not brand-specific)
- Surprising stats that challenge assumptions
- Category-level problems that create "I have this problem" recognition
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

### 2.4 Emotional Trigger Diversity

The current SKILL.md Variety Check requires "at least 3 emotional territories." Research C (Section 3) provides a more precise framework grounded in performance data. The update maps specific emotions to funnel stages and adds quantified impact data.

**Replace the current "Emotions Triggered" checklist in the Variety Check with:**

```
### Emotional Trigger Coverage

Hooks MUST cover at least 3 of these emotional territories, mapped to appropriate funnel stages:

| Emotion | Best Funnel Stage | Impact Signal | Example Hook Pattern |
|---------|------------------|---------------|---------------------|
| Curiosity | TOF | Highest hook rates, sustained viewing | "What [category] insiders know that you don't" |
| Relatability | TOF | Pattern match = scroll stop | "[Exact customer pain phrase]? Yeah, us too." |
| Social Proof | MOF (universal) | Trust builder at every stage | "[Number]+ [people] already [action]" |
| Empowerment | TOF/MOF | Identity-aligned purchasing | "For the [identity] who's done [settling/waiting/accepting]" |
| Loss Aversion | BOF | Negative framing outperforms positive by 60% | "Don't miss [specific consequence of inaction]" |
| FOMO/Scarcity | BOF | 60% of impulse purchases | "[Time limit]: [Specific offer]" |
| Pride/Status | MOF/BOF | 72% of premium buyers cite emotional satisfaction | "The [product] that [authority figures] chose" |
| Security/Safety | MOF | Reduces purchase anxiety | "[Guarantee/risk reversal] — no [common fear]" |

**Anti-pattern:** If all hooks trigger the same emotion (e.g., all Pain/Frustration), the hook set will reach only one micro-audience segment under Andromeda. Emotional diversity = audience diversity.
```

### 2.5 Copy-Visual Anti-Duplication

Research C (Section 7) establishes that copy and visual should attack the same message from different angles, not duplicate each other. The current hook skill does not address the copy-visual relationship.

**New section to add to SKILL.md after the CTA formula:**

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

Example:
HOOK: "350 lenders compete for your rate. You choose the winner."
VISUAL DIRECTION: Visual grid or collage of competing lender options converging to a single approval stamp — shows abundance and control.
```

### 2.6 CTA Strategy by Funnel Stage

Research C (Section 8) provides specific CTA performance data. The current SKILL.md has a generic CTA formula. Add funnel-stage specificity:

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

### 2.7 New Hook Sources from Enhanced Research

With the new research sections, the hook extraction step (Step 1) must be expanded to mine the new data. Add these extraction blocks:

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
- Outcome language (use in transformation hooks: "[Customer's words for the result]")

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
- [ ] Owned Positioning — Owned claim, white space, differentiation thesis
- [ ] Competitive Context — Crowded zone (avoid), white space (target)
- [ ] Buying Objections — Each objection as a hook angle
- [ ] Feature-to-Emotion — Emotional benefits as hook material
- [ ] Customer Language / VoC — Verbatim phrases, trigger events, outcome language
- [ ] Brand Story / Origin — Founder narrative, "why we exist" angle
- [ ] Category Intelligence — Temporal hooks, trend hooks
```

### 2.8 Updated Hook Output Format

The hook bank output format must capture the new metadata:

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
**Visual Direction:** [One line — what the visual should SHOW to complement the copy]
**Logo-Swap Test:** [PASS / FAIL — if FAIL, note what owned element anchors it]
**Psychology:** [Why it stops scroll + drives click]
```

### 2.9 Andromeda-Optimized Copy Structures

Research A and C establish specific copy constraints for Andromeda:

**Add to SKILL.md as a reference section:**

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

## Section 3: Integration Points

### 3.1 Data Flow: Research -> Hooks -> Visuals

The pipeline has three stages. Each stage consumes the previous stage's output. The current integration is loose: hooks extract from research text, visuals extract from hook text. With the enhanced research template, the integration must be explicit and structured.

```
RESEARCH AGENT                    HOOK SKILL                      VISUAL SKILL
(research.md)                     (SKILL.md)                      (art-style SKILL.md)

[Homepage Data]          -->      [Extract: Offer, Props,         [Read hook bank]
[About Page Data]                  Proof, Products, Pain,
[Competitor Data]                  Testimonials, Voice,
[Review/VoC Data]                  Messaging, ICP]
[Category Data]

[Owned Positioning]      -->      [Logo-Swap Validation]    -->   [Brand-specific visual metaphors]
[Competitive Context]    -->      [White Space Hooks]       -->   [Category-aware style routing]
[Buying Objections]      -->      [Objection Hooks]         -->   [Objection visual treatment]
[Feature-to-Emotion]     -->      [Emotional Hooks]         -->   [Emotional visual cues]
[Customer Language]      -->      [VoC-Language Hooks]       -->   [Authentic copy-on-image]
[Brand Story]            -->      [Founder/Narrative Hooks]  -->   [Narrative visual style]
[Category Intelligence]  -->      [Temporal/Trend Hooks]     -->   [Seasonal visual treatment]
[Brand Colors]           -->      [Hook Bank header]         -->   [Color palette for all styles]
```

### 3.2 New Fields Required in Research Output for Downstream Consumption

The research brief must provide structured data that downstream skills can reliably parse. These are the contract fields:

**For the Hook Skill:**

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

**For the Visual Skill:**

| Research Field | Visual Skill Usage | Required Format |
|---------------|-------------------|-----------------|
| `Brand Colors` | Color palette for all styles | Hex codes |
| `Brand Voice` | Typography and composition tone | Tone descriptors |
| `Owned Positioning > Differentiation Thesis` | Visual metaphor anchor | Single sentence |
| `Category Intelligence` | Category-aware style routing | Category name |
| `Brand Story > Brand Archetype` | Visual personality | Archetype name |
| `Competitive Context > Direct Competitors` | Visual differentiation | Competitor visual patterns to AVOID |

**For Brief Generation (future):**

| Research Field | Brief Usage | Required Format |
|---------------|-------------|-----------------|
| `Customer Language > Customer Pain Language` | Script opening lines | Quoted phrases |
| `Feature-to-Emotion` | Talking points | Emotional benefit list |
| `Buying Objections` | Objection-handling script sections | Structured objection-answer pairs |
| `Brand Story` | Founder brief content | Origin narrative |
| `ICP Segments` | Creator selection and tone guidance | Demographic + psychographic |

### 3.3 Hook-to-Visual Handoff

The current pipeline writes hooks to a hook bank file, then the visual skill reads that file. The new hook output format (Section 2.8) adds three fields that directly serve the visual skill:

1. **Format Intention** (`[STATIC / VIDEO-SCRIPT / CAROUSEL-LEAD / UGC-BRIEF / ORGANIC]`) -- Tells the visual skill which output mode to use for this hook. Static hooks get image prompts. Video-script hooks get storyboard frames. Carousel hooks get multi-card layouts. UGC-brief hooks get creator direction documents.

2. **Visual Direction** (one-line note) -- Tells the visual skill what the image should SHOW to complement the copy, enforcing the anti-duplication principle. This prevents the visual skill from simply rendering the hook text as typography on a generic background.

3. **Psychological Driver** (`Pain / Aspiration / Social Proof / Urgency / Education / Transformation`) -- Enables the visual skill to select appropriate visual treatment. Pain hooks get empathy visuals. Aspiration hooks get lifestyle visuals. Social proof hooks get multi-person or data visuals. Education hooks get infographic treatment.

### 3.4 Style Routing from Research Data

The visual skill currently routes style selection by user keyword only. With enhanced research, the visual skill should use category and archetype data from the research brief to bias default style selection.

**Proposed routing logic (for visual skill to implement):**

```
## Category-Aware Default Style Selection

When no style is specified by user, select default based on research data:

FROM RESEARCH: Category Intelligence > Market context
FROM RESEARCH: Brand Story > Brand Archetype

| Category | Default Primary Style | Default Secondary Style | Rationale |
|----------|----------------------|------------------------|-----------|
| Beauty/Skincare | Editorial cutout | Product-on-gradient | Texture, ingredient close-ups |
| Fashion/Apparel | Lifestyle-render | Editorial cutout | Movement, fit, context |
| Food/Beverage | Product-on-gradient | Lifestyle-render | Appetizing, environmental |
| SaaS/Tech | Typography-dominant | Infographic/data-visual | Message IS the product |
| Finance/Fintech | Typography-dominant | Soft brutalism clay | Authority, trust signals |
| Health/Wellness | Lifestyle-render | Infographic/data-visual | Transformation, education |
| Home/Lifestyle | Lifestyle-render | Product-on-gradient | Aspirational context |

Always generate in at least 3 different styles per brand to maximize Entity ID diversity.
```

### 3.5 The Complete Pipeline Flow (Updated)

```
USER: "Research [brand URL] and create ads"

STEP 1: RESEARCH AGENT
  - Fetch homepage (existing)
  - Fetch about page (new)
  - Competitive scan via WebSearch (new)
  - Customer language scan via WebSearch (new)
  - Write research brief with all sections (expanded)
  OUTPUT: files/research/{brand}_research.md (~150-200 lines)

STEP 2: HOOK SKILL
  - Read research brief
  - Extract from ALL sections including new ones (expanded extraction)
  - Funnel-map extracted elements (new step)
  - Construct hooks across 3-3-3 matrix (new variety framework)
  - Validate ALL hooks against 5-gate checklist including enforced Logo-Swap Test (strengthened)
  - Add format intention, visual direction, and funnel stage metadata (new output fields)
  OUTPUT: hook-methodology/hook-bank/{brand}-{date}.md (enriched format)

STEP 3: VISUAL SKILL
  - Read hook bank
  - Read research brief (for brand colors, category, archetype)
  - Route style selection using category + archetype (new routing)
  - Generate visuals using visual direction notes from hooks (new input)
  - Ensure minimum 3 distinct visual styles per brand (new constraint)
  OUTPUT: Image prompts or rendered images across multiple styles

STEP 3-ALT: BRIEF GENERATION (future)
  - Read hook bank (hooks tagged [UGC-BRIEF], [VIDEO-SCRIPT], [ORGANIC])
  - Read research brief (for VoC language, objections, brand story)
  - Generate structured briefs for human creators
  OUTPUT: Creator briefs, scripts, shot lists, carousel storyboards
```

### 3.6 Feedback Loop Architecture (Future State)

The current pipeline has no mechanism to learn from performance data. When feedback becomes available, the integration points are:

```
PERFORMANCE DATA --> RESEARCH AGENT
  - Which hooks converted? Update "proven angles" for re-runs
  - Which objections were addressed in winning ads? Weight those objections higher
  - Which emotional triggers performed? Update emotional territory priorities

PERFORMANCE DATA --> HOOK SKILL
  - Which hook types had highest hook rates? Bias generation toward those types
  - Which funnel stages converted? Adjust funnel distribution
  - Which hooks fatigued fastest? Identify patterns to avoid

PERFORMANCE DATA --> VISUAL SKILL
  - Which visual styles had highest CTR? Bias default selection
  - Which style-hook pairings worked? Create pairing recommendations
  - Which styles clustered into same Entity ID? Increase diversity between those styles
```

This feedback loop does not exist yet and requires infrastructure beyond the current pipeline. It is listed here as the integration design that future work should target.

---

## Summary of Changes

### Research Agent (`research.md`)

| Change | Type | Priority | Impact |
|--------|------|----------|--------|
| Add Owned Positioning section | New template section | P0 | Highest -- every downstream output benefits |
| Add Competitive Context section | New template section | P0 | Enables white space hooks and visual differentiation |
| Add Buying Objections section | New template section | P0 | Each objection = new hook angle |
| Add Feature-to-Emotion Translation | New template section | P0 | Transforms feature-hooks into emotional-hooks |
| Add Customer Language / VoC section | New template section | P1 | Authentic language for hooks and briefs |
| Add Brand Story / Origin section | New template section | P1 | Narrative hooks, founder content |
| Add Category Intelligence section | New template section | P1 | Temporal/seasonal hooks, style routing |
| Add Steps 2.5-2.7 (About page, competitive scan, VoC scan) | Workflow expansion | P0 | Data collection for new sections |
| Add Step 3.5 (Strategic Analysis) | Workflow expansion | P0 | Populates strategic sections |
| Update line target from ~60-70 to ~150-200 | Parameter change | P0 | Accommodates new sections |

### Hook Skill (`SKILL.md`)

| Change | Type | Priority | Impact |
|--------|------|----------|--------|
| Replace validation checklist with 5-gate hard validation | Section rewrite | P0 | Enforces logo-swap test with revision instructions |
| Add 3-3-3 variety framework | New section | P0 | Funnel + angle + format diversity |
| Add Step 1.5: Funnel Mapping | New extraction step | P0 | Hooks mapped to TOF/MOF/BOF |
| Add extraction blocks for new research sections | Step 1 expansion | P0 | Mines owned positioning, objections, VoC, brand story |
| Add Step 4.5: Visual Direction Note | New construction step | P1 | Copy-visual anti-duplication |
| Expand CTA formula with funnel-stage specificity | Section expansion | P1 | Stage-appropriate CTAs |
| Update emotional trigger checklist with performance data | Section rewrite | P1 | Quantified emotional targeting |
| Update hook output format with new metadata fields | Output format change | P0 | Funnel stage, psych driver, format intention, visual direction, logo-swap result |
| Add Andromeda copy optimization reference | New reference section | P2 | Character targets, Entity ID signals |
| Update extraction checklist with new sections | Checklist expansion | P0 | Ensures new research sections are mined |

### Integration / Cross-Cutting

| Change | Type | Priority | Impact |
|--------|------|----------|--------|
| Define research-to-hook field contracts | Documentation | P0 | Ensures structured handoff between stages |
| Define hook-to-visual handoff fields | Documentation | P0 | Format intention, visual direction, psych driver |
| Define category-aware style routing table | Specification | P1 | Visual skill uses research category data |
| Define feedback loop integration points | Architecture spec | P2 | Future: performance data informs all stages |

---

## Implementation Sequence

**Week 1 (Parallel tracks):**
1. Update `research.md` with all new sections and workflow steps
2. Update `SKILL.md` with enforced logo-swap test, 3-3-3 framework, and new extraction blocks
3. Update hook output format with new metadata fields

**Week 2:**
4. Test updated pipeline on 3-5 existing brands (re-run research, re-generate hooks)
5. Compare new hook bank output against old hook bank output on logo-swap test
6. Validate that new research sections populate reliably with current tooling

**Week 3+:**
7. Add visual direction notes and copy-visual anti-duplication
8. Implement category-aware style routing in visual skill
9. Add brief generation output mode for hooks tagged [UGC-BRIEF], [VIDEO-SCRIPT], [ORGANIC]
