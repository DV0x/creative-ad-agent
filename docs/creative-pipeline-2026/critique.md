# Critique: Creative Pipeline Research (A/B/C/D)

**Date:** 2026-02-24
**Reviewer role:** Adversarial critic (gap fill + destruction test)
**Documents reviewed:** research_a.md, research_b.md, research_c.md, research_d.md
**Grounded against:** Actual pipeline code (research.md, SKILL.md for hooks and art-style, both art style workflows, formulas.md, 4 hook-bank samples, 27 research briefs)

---

## Overall Assessment

The four documents collectively form a strong knowledge base about Meta advertising mechanics, visual trends, copywriting frameworks, and pipeline diagnosis. Research D in particular is the most valuable document in the set: it identifies the actual structural problems in the pipeline with concrete examples. However, the research as a whole suffers from three systemic weaknesses: (1) heavy duplication across documents that inflates apparent coverage while masking gaps, (2) category knowledge that stays generic when the pipeline needs brand-level specificity, and (3) recommendations that tell us WHAT to add without specifying HOW the pipeline code must change to support it.

---

## Part 1: What the Research Gets Right

### 1.1 Entity ID / Creative Diversity Argument (Research A)

The core argument is sound and well-supported: Andromeda rewards conceptual diversity, not cosmetic variation. The Entity ID clustering explanation is the single most important insight for the pipeline because it directly explains why generating 50 creatives in only 2 art styles (soft brutalism clay + anderson diorama) is a structural failure. If every creative from our pipeline uses clay diorama aesthetics, Andromeda likely collapses them into a single Entity ID regardless of hook variation. This is the strongest section in all four documents.

### 1.2 The "Logo Swap Test" Diagnosis (Research D)

Research D's identification of the logo swap problem is accurate and verified against the actual hook bank output. I checked the Supabase, Perplexity, TheRateFinder, and Rube hook banks. The diagnosis is confirmed:

- "Stop configuring. Start shipping." (Supabase) -- works for Vercel, Railway, Render, PlanetScale
- "Google gave you links. We give you answers." (Perplexity) -- works for any AI search tool
- "Your chatbot talks. Ours actually works." (Rube) -- works for any AI automation tool
- "Self-employed? Banks don't get it. We do." (TheRateFinder) -- works for any alternative lender

Hook 6 from TheRateFinder ("BRRR investors: 72-hour funding exists.") is the only hook across all four bank samples that genuinely passes the logo swap test. This validates Research D's central thesis.

### 1.3 The Feature-to-Emotion Translation Gap (Research D)

The identification that the pipeline extracts features but doesn't translate them to emotional benefits is correct. The research agent spec (research.md) literally has no field for emotional translation. The ICP section asks for "Motivations" but the examples in the spec itself show surface-level motivations ("Get approved despite non-traditional situation") rather than deeper emotional states ("Feel like the system works for me, not against me").

---

## Part 2: Contradictions Between Documents

### 2.1 Copy Importance: Research A vs. Research C vs. Research B

Research A (Section 4) says: Primary text 50-125 characters, headline 25-40 characters.
Research C (Section 2.1) says: Recommended range 50-150 characters.
Research B (Section 7.1 equivalent) says: Visuals account for 70-80% of performance success.

Research C then states: "Hook quality is more important than length." This is a truism that avoids taking a position. The actual tension here is unresolved: if visuals drive 70-80% of performance (Research B) and creative quality drives 56% of sales lift (Research A/C), how much does copy actually matter for our pipeline? The documents never reconcile these numbers into actionable guidance for the pipeline.

**What's missing:** A clear hierarchy for where the pipeline should invest optimization effort. Is it: visual style diversity (highest leverage) > hook conceptual diversity > copy length/structure > CTA wording? The research implies this ranking but never states it.

### 2.2 Creative Volume Recommendations

Research A says: 8-12 distinct concepts for small budgets, 15-25 for medium, 25-50 for large.
Research C says: 5-10 new variants per week.
Research B says: Weekly refresh yields 30-40% lower CPA; high-spend accounts need new variants every 3-4 days.

These are not contradictory in the strict sense, but they are unaligned for our pipeline. Our pipeline generates 6 hooks + 6 visuals per brand per session. At what cadence should brands re-run the pipeline? The research offers no synthesis that maps to actual pipeline usage patterns.

### 2.3 UGC vs. AI-Generated Aesthetics

Research B says: UGC outperforms polished content 3-5x. Authenticity beats production value.
Research B also says: AI-generated content has uncanny valley problems.

But our pipeline generates AI images exclusively (clay diorama, soft brutalism). The research never addresses this contradiction directly: if UGC-style content wins and AI-generated content risks looking generic, why is our pipeline generating AI images at all? This is the elephant in the room that none of the four documents confronts.

**The honest question:** Should the pipeline be generating image prompts, or should it be generating creative briefs for human/UGC creators? The research strongly implies the latter would perform better, but no document makes this recommendation.

---

## Part 3: Gaps the Research Misses Entirely

### 3.1 The Andromeda Entity ID Problem Applied to Our Art Styles

Research A explains Entity ID clustering in detail. Research D identifies that we only have 2 art styles (one deprecated). But nobody connects these two facts to their logical conclusion:

**If Andromeda clusters by visual similarity, and all our output uses clay diorama aesthetics, then every creative we generate for a brand likely collapses into 1-2 Entity IDs regardless of hook diversity.**

This means the hook diversity work (Research C + Research D's recommendations) may be largely irrelevant if the visual execution collapses them back together. The research never quantifies this risk or proposes a minimum number of visual styles needed to avoid clustering.

**What's needed:** A concrete recommendation for minimum visual style count per brand per campaign cycle, grounded in the Entity ID clustering behavior described in Research A.

### 3.2 Format Diversity (Static vs. Video vs. Carousel)

Research A recommends: 50% video, 30% static, 20% carousel.
Our pipeline generates: 100% static images.

This is the largest strategic gap in the entire pipeline and none of the four documents treats it as a priority finding. Research B mentions video UGC as the highest-performing format. Research A says format diversity itself is a ranking signal. Yet the research makes zero recommendations about how to add video or carousel support to the pipeline.

### 3.3 Competitor Intelligence Feasibility

Research D recommends: Meta Ad Library analysis, competitive white space mapping, review mining.

But the actual research agent (research.md) uses WebFetch to scrape a single homepage. The research never addresses:

- Can WebFetch access the Meta Ad Library? (Probably not without authentication)
- How would the agent scrape competitor reviews? (G2, Trustpilot, App Store all have different structures)
- How would the agent identify competitors? (Requires domain knowledge the agent doesn't have)

**The feasibility gap:** Research D's recommendations assume a human creative strategist workflow. The research never translates these into capabilities that an automated agent can actually execute. Several recommendations (Meta Ad Library analysis, social listening on Reddit/Twitter) require tool access the agent doesn't have.

### 3.4 How Andromeda Analyzes AI-Generated Clay Aesthetics

Research A lists Andromeda's visual signals: color composition, objects, scene type, composition patterns, foreground/background. Research B discusses the uncanny valley of AI content. But neither document asks: **How does Andromeda classify our specific clay diorama output?**

If Andromeda's computer vision sees "3D rendered clay object on solid background with thick border" as a single visual category, then all our output regardless of the clay object itself may be treated as one visual cluster. This is a testable hypothesis that the research should have raised.

### 3.5 No Testing or Validation Methodology

Research C (Section 8) describes testing frameworks (Three-Phase Model, 1-5% Rule). Research A describes angle testing phases. But none of the documents propose how our pipeline should validate its own output quality.

Missing: How do we know if the hooks we generate actually perform? There is no feedback loop in the pipeline. No mechanism to capture which hooks converted, which visual styles won, which Entity IDs clustered. The research describes the importance of testing but never proposes a data capture mechanism for the pipeline.

### 3.6 Boosted Organic Posts

Research A repeatedly states that boosted posts from a brand's own Instagram outperform manual ad creation. This is a fundamentally different creative strategy from what our pipeline does (generate ad creatives from scratch). If boosting organic content is the highest-performing approach, the pipeline could add value by generating organic post ideas rather than (or in addition to) ad creatives. None of the documents explore this.

### 3.7 Mobile-First Composition Constraints

Research B covers mobile optimization (thumb-safe zones, thumbnail legibility, aspect ratios). But the art style workflows (soft-brutalism-clay.md, anderson-clay-diorama.md) never mention mobile constraints. The prompts include typography positions like "left side, stacked vertically" or "top third, centered" without reference to thumb zones. The research identifies the constraint but never maps it to the prompt generation workflow.

---

## Part 4: Duplication and Inflation

### 4.1 Repeated Content Across Documents

The following topics appear in near-identical form in multiple documents:

| Topic | Research A | Research B | Research C | Count |
|-------|-----------|-----------|-----------|-------|
| UGC outperforms branded 3-5x | Yes (Sec 8) | Yes (Sec 6) | Yes (Sec 4) | 3x |
| Creative quality = 70-80% of performance | Yes (Sec 5) | Yes (Exec Summary) | Yes (Sec 7.1) | 3x |
| 8-12 concepts per campaign | Yes (Sec 5) | Yes (Sec 13.2) | Implied | 2-3x |
| Creative fatigue metrics | Yes (Sec 2) | Yes (Sec 14) | Yes (Sec 5) | 3x |
| PAS copywriting framework | - | - | Yes (Sec 2.2) | 1x (correct) |
| Advantage+ / ASC details | Yes (Sec 6) | Yes (Sec 8.4) | - | 2x |

Approximately 30-40% of the total content across the four documents is restated material. This inflates the apparent volume of research without adding information density. A synthesis pass should deduplicate.

### 4.2 Generic Industry Advice vs. Pipeline-Specific Recommendations

Much of Research A and Research C reads as general D2C marketing education rather than pipeline-specific analysis. Sections like "Campaign Structure & Account Organization" (Research A, Sec 7) and "CTA Button Design" (Research C, Sec 8.2) are useful knowledge for a human media buyer but have no bearing on the pipeline's code or output quality.

**Guideline:** Research should be evaluated by the question "Does this change what the pipeline does, or how it does it?" Content that educates but doesn't change pipeline behavior is padding.

---

## Part 5: Destruction Test -- Stress-Testing Key Claims

### 5.1 "Research-first hooks are stronger than template hooks"

The hook methodology SKILL.md claims: "The best hooks aren't constructed from templates. They're extracted from what the brand has already proven."

**Test:** I compared the Supabase hook bank (research-first) against Research C's hook framework templates. Result: The research-first hooks ("Stop configuring. Start shipping.") are structurally identical to what a Contrast template would produce. The "extraction" process is functionally template application with a research-data fill-in. The philosophical distinction between "discovery" and "construction" is not borne out in the actual output.

**Implication:** The hook methodology's claim of superiority over templates is not supported by the output evidence. The real problem isn't templates vs. extraction -- it's that both approaches draw from the same shallow data (homepage-only research). Better input data would improve both approaches equally.

### 5.2 "Diverse hook types prevent Entity ID clustering"

Research A says: Conceptually different messages avoid clustering.
Research C says: Use 5 different hook types per campaign.
The hook SKILL says: Variety check requires 3+ hook types.

**Test:** Looking at the Supabase hook bank, all 6 hooks share the same visual output (clay diorama). If Andromeda's Entity ID clustering is primarily visual (which Research A's description of "visual background, compositions" suggests), then hook diversity is necessary but not sufficient. You need hook diversity AND visual diversity. The pipeline delivers the former but not the latter.

**Implication:** The research creates a false sense of completeness by treating hook diversity and visual diversity as separate problems, when under Andromeda they are a joint optimization.

### 5.3 "Authenticity paradox" -- intentional imperfection

Research B claims: "In 2026, perfectly polished AI visuals feel less authentic than intentionally imperfect human-created content."

**Test against our pipeline:** The anderson-clay-diorama workflow explicitly calls for "every imperfection is intentional" and "finger-pressed surfaces show the maker's hand." This is attempting to solve the authenticity problem within AI generation. But the imperfection described is stylistic (clay texture) not compositional (candid framing, natural lighting, real environments). Research B's definition of authenticity markers includes "natural lighting, real locations, hand-held camera movement, genuine reactions" -- none of which clay diorama can deliver.

**Implication:** The art styles attempt stylistic imperfection as a proxy for compositional authenticity, but these are different things. A clay diorama with fingerprint textures is still obviously a rendered scene, not UGC. The research identifies the right principle but the pipeline misapplies it.

### 5.4 "Category-specific visual strategies matter"

Research B (Section 5) provides category-specific strategies: beauty needs macro photography and texture close-ups; fashion needs movement and fit shots; food needs appetizing close-ups with real hands.

**Test against our pipeline:** The art style routing has zero category awareness. A beauty brand, a SaaS product, and a mortgage broker all get the same clay diorama or soft brutalism treatment. The research identifies category-specific needs but the pipeline has no mechanism to use this information.

**Implication:** Adding more art styles is necessary but not sufficient. The style routing needs category awareness, not just keyword matching.

---

## Part 6: What Research D Gets Wrong or Incomplete

Research D is the strongest document, but it has specific weaknesses:

### 6.1 Overestimates Agent Capabilities

Research D recommends "Meta Ad Library analysis," "social listening (Twitter, Reddit, Product Hunt)," and "review mining." These require:

- Authenticated API access (Meta Ad Library)
- Multi-page crawling with pagination (review sites)
- Platform-specific scraping (Reddit, Twitter)
- Domain expertise to identify relevant competitors

The research agent uses WebFetch, which can fetch a single URL with a prompt. The gap between what Research D recommends and what the agent can do is enormous. Research D never acknowledges this constraint.

### 6.2 Missing: The Owned Positioning Problem is Upstream

Research D blames the hook skill for generic output. But the root cause is upstream: the research agent doesn't capture owned positioning. The hook skill can only work with what the research provides. Research D correctly identifies missing data but attributes the failure to the wrong pipeline stage.

The fix order should be:
1. Research agent adds strategic fields (owned positioning, competitive context, emotional territory)
2. Hook skill adds logo-swap validation
3. Art style adds category routing and visual diversity

Research D presents these as parallel recommendations when they are sequential dependencies.

### 6.3 The "Better Hook" Examples May Not Be Better

Research D provides "better hook" examples:

- TheRateFinder: "BRRR investors: We speak your language." -- This is better (niche specificity), but it's also a much smaller addressable audience. The research doesn't discuss the tradeoff between brand-specific hooks (high differentiation, small audience) and category hooks (lower differentiation, large audience).

- Perplexity: "When your research has to be flawless." -- This is arguably worse for Meta ads. It's abstract and doesn't name a specific pain. Compare to "Google gave you links. We give you answers." which, despite being swappable, is immediately concrete.

**The tension Research D doesn't resolve:** The most differentiated hook is often the most niche. The most broadly effective hook is often the most generic. Performance marketing needs both. The pipeline should generate hooks across this spectrum, not just optimize for one end.

---

## Part 7: What Should Change in the Pipeline (Prioritized)

Based on destruction-testing the research against the actual pipeline code:

### Tier 1: Highest Impact, Must Fix

1. **Add 4-6 more visual art styles.** This is the single highest-leverage change. Until the pipeline can output visually distinct creatives, all hook diversity work is undermined by Entity ID visual clustering. New styles needed: product-on-gradient, lifestyle photography prompt, editorial cutout, typography-dominant, infographic/data-visual, UGC-style brief.

2. **Add a "Competitive Context" field to the research agent template.** Even without scraping competitors, the research agent can use its LLM knowledge to provide: "In the [category], competitors typically claim [X, Y, Z]. This brand's unique position is [specific thing]." This costs nothing to add.

3. **Enforce the logo-swap test in the hook skill.** Add a mandatory validation step: "Could a direct competitor use this hook by changing the brand name? If yes, revise." This is already in the SKILL.md as item #2 in the validation checklist ("Is it OWNED?") but the output evidence shows it is not enforced. The check needs teeth -- a specific revision instruction, not just a checkbox.

### Tier 2: High Impact, Non-Trivial

4. **Add category-aware style routing.** The art style SKILL.md routes by user keyword only. Add category detection from the research brief (beauty, SaaS, finance, food, etc.) and bias the default style selection accordingly.

5. **Add creative brief output mode** (in addition to image prompts). For brands where UGC would outperform AI-generated images, the pipeline should output a creator brief instead of (or alongside) an image generation prompt. The research strongly supports this.

6. **Add feature-to-emotion translation field** in the research agent template. Add a field: "For each key value prop, what is the emotional benefit? (Not what it does -- why the customer cares.)"

### Tier 3: Valuable, Requires Infrastructure

7. **Add format diversity (carousel, video storyboard).** The pipeline generates only static images. Adding even carousel card sequences would meaningfully improve Entity ID diversity.

8. **Add mobile composition constraints to art style prompts.** Thumb-safe zones, thumbnail legibility testing, aspect ratio coverage beyond the current 1:1 and 9:16.

9. **Build a feedback loop.** Capture which hooks and visuals are used, which perform well, which get fatigued. Feed this back into the research and hook generation. Without this, the pipeline cannot learn.

---

## Part 8: Questions the Research Doesn't Answer

These are open questions that the four documents raise but don't resolve. They should be answered before building.

1. **Should the pipeline generate images at all, or creative briefs?** If UGC outperforms AI imagery 3-5x, the highest-ROI output may be structured briefs for human creators, not AI image prompts.

2. **How many visual styles are needed to avoid Entity ID clustering?** The research says "conceptually different" but never quantifies minimum diversity. Is 3 enough? 5? 8?

3. **What is the optimal hook-to-visual pairing strategy?** Should each hook get multiple visual treatments (same hook, different styles)? Or each visual get multiple hooks (same image, different copy)? The research describes both approaches but doesn't recommend one.

4. **How does the pipeline handle brands that don't have a clear owned position?** Research D assumes every brand has unique positioning. Many D2C brands are genuinely commoditized. What does the pipeline do then?

5. **What is the refresh cadence for pipeline re-runs?** If creatives fatigue in 2-4 weeks, how often should a brand re-run the pipeline? Is there enough variation in a homepage to produce genuinely new output?

---

## Summary

The research is thorough on industry knowledge but incomplete on pipeline application. The strongest contribution is Research D's diagnosis of where brand specificity gets lost. The weakest area is the gap between what the research recommends and what the pipeline can actually implement. The single most important finding across all four documents: **visual style diversity is the binding constraint on the pipeline, and the research focuses disproportionately on hook diversity (which helps but cannot compensate for visual monotony under Andromeda's Entity ID system).**

The research is ready for synthesis, but the synthesis should be built around pipeline-actionable changes, not industry education.
