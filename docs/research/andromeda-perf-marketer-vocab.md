# Meta Andromeda — Perf Marketer Vocabulary & Landing Page Research

**Date:** 2026-04-28
**Purpose:** Source defensible claims and verbatim phrases for landing page targeting D2C founders + performance marketers.
**Audience:** Internal — landing page copy team.

---

## What Andromeda Is (Plain English)

Andromeda is Meta's new **ad retrieval engine** — the first stage of ad delivery that narrows tens of millions of candidate ads down to a few thousand for any given impression. Meta announced it in **December 2024** in an Engineering blog post, began phased rollout in early 2025, and reached **global rollout by October 2025**. It is **not** a new "algorithm" in the colloquial sense — it does not control bidding, attribution, or optimization. It is one component (retrieval) made dramatically more powerful via co-designed hardware (NVIDIA Grace Hopper Superchip + Meta's MTIA accelerator) and ML.

The headline technical claim from Meta: a **10,000x increase in model complexity for retrieval** with acceptable latency, plus a future projected 1,000x further increase. Confidence: HIGH (primary source: Meta Engineering blog).

**The strategic consequence advertisers care about:** Meta's retrieval model is now smart enough to match individual creatives to individual users based on creative signals (visuals, copy, format, engagement history) rather than relying on advertiser-supplied audience filters. This is why the industry is converging on "creative is the new targeting" as shorthand.

**Skeptical caveat (Jon Loomer, MEDIUM-HIGH confidence):** Andromeda is *retrieval only*. It doesn't change ranking, auction, attribution, or campaign objectives. Marketers who claim "Andromeda changed everything" are often conflating Andromeda with the broader Advantage+ automation push that happened concurrently.

---

## The 3-5 Metric/Concept Shifts That Matter for Landing Page Copy

### 1. Retrieval is now creative-aware, not just audience-aware
- **Meta's claim:** +6% recall improvement, +8% ad quality improvement on selected segments. (Source: Meta Engineering blog, Dec 2024.) Confidence: MEDIUM — these are Meta's internal A/B numbers, not independently verified.
- **What this means for copy:** The system now evaluates *the creative itself* as a primary signal. Bad creatives get retrieved less. Good creatives reach people the advertiser would never have manually targeted.

### 2. Creative diversity > creative volume
- **Meta's official guidance (Meta for Business):** "The biggest constraint you can put on your Meta strategy is the constraints you place on your creative process." Meta now recommends **creative diversification** as the primary lever, not audience targeting precision.
- **Case study Meta cites:** Dribbleup went from 3-4 new creatives/week to ~50/week after adopting creative diversification. (Confidence: MEDIUM — Meta-promoted case study.)
- **Industry refinement:** Andromeda *clusters* visually similar ads into one entity for retrieval purposes. So 100 near-duplicate ads perform like ~10. Confidence: MEDIUM-HIGH (multiple agency sources converge; not directly confirmed by Meta in those words).
- **Counter-take (Jon Loomer):** He tested 25-50 ads per ad set and saw "no clear advantage." His conclusion: "Quality still beats quantity." Confidence: MEDIUM.
- **Counter-take (Monica Shukla, AdExchanger, Jan 2026):** "Uploading 20 or more creatives per ad set" can actually backfire — "learning slows, delivery fragments, and the system struggles to distinguish signal from noise."

### 3. The KPI stack is shifting toward creative-level metrics
- **Hook rate** (3-second video views ÷ impressions) and **hold rate** (15-second views ÷ 3-second views) are now first-class diagnostic metrics, not vanity metrics.
- **2025 hook rate benchmarks (Vaizle, Zeely):** 20-25% baseline, 30%+ strong, 35%+ excellent. Top optimized campaigns reach 30-50%.
- **Hold rate benchmarks:** 40-50% average, 60%+ strong, <30% needs rework.
- **Confidence:** MEDIUM. Benchmarks are agency/tool-vendor data, not Meta-published. Use directionally, not as load-bearing claims.

### 4. Creative fatigue compounds faster than people realize
- **Marin Istvanic (cited in Motion):** "After four exposures to the same ad, the chance of conversion drops by about 45%."
- **Industry data (Logical Position / agency aggregations):** Average user sees the same Meta creative 4.2 times; 19%+ of impressions are 5+ exposures. Confidence: MEDIUM (agency-aggregated).
- **Why this matters now:** Andromeda's faster delivery cycles burn through creative inventory faster. The "test 3 ads and let the winner ride" playbook breaks.

### 5. ROAS lift claims are everywhere, but most are unverified
- **Most-cited stat:** "22% increase in ROAS for Advantage+ creative users" — this is from Meta's own announcement and refers to Advantage+, not Andromeda specifically. Frequently misattributed to Andromeda.
- **"20-35% higher ROAS" for advertisers who adopt creative-first strategies** — agency claim (Digital Time Savers, others). Confidence: LOW. No source data, no methodology, likely inflated.
- **For landing page:** Avoid quoting "22% ROAS lift from Andromeda." It's Meta marketing about Advantage+, not Andromeda. If used, attribute to Meta and frame as "Meta claims" not as fact.

---

## 20-30 Verbatim Phrases From Perf Marketers (Grouped)

### Theme 1: Creative Volume / Velocity

1. **"We used to make seventy-five ads a campaign. Now we make six that are genuinely different."** — Connor Rolain, HexClad (via Motion)
2. **"We're not talking about 50, we're talking about 5,000."** — Taylor Holiday, Common Thread Collective (on creative volume Andromeda enables)
3. **"Andromeda is enabling us to consider the possibility and delivery of more creative volume on behalf of the advertiser."** — Taylor Holiday
4. **"We're now unbounding the relationship between campaign and creative."** — Taylor Holiday
5. **"Creative velocity"** — established term: speed and volume at which you produce, test, launch new ads
6. **"Minimum 1.0 new creative per $10K weekly spend; optimal 1.5-3.0"** — Logical Position rule of thumb
7. **"I'm capping my teams at two."** — Dara Denney (cited via Motion — a counter-position, against unchecked volume)
8. **"What are we doing about Andromeda for BFCM? Absolutely nothing."** — Jess Bachman, FireTeam (counter-take)

### Theme 2: Creative Diversity (the more important concept)

9. **"Creative diversity isn't about volume, it's about intent."** — paraphrased agency consensus (multiple sources)
10. **"Concept diversity"** vs. **"visual diversity"** vs. **"messaging diversity"** — Motion's three-axis framework
11. **"100 ads that all look the same perform no better than 10."** — agency consensus on Andromeda clustering
12. **"Meaningfully different creatives"** — Meta-adjacent agency phrasing
13. **"Iteration to intentional differentiation"** — Motion framing
14. **"Diverse buffet"** — Reddit r/FacebookAds vernacular for what Andromeda wants
15. **"Creative diversification as the best lever to find the most relevant audiences"** — Meta for Business (official)

### Theme 3: KPIs (Hook Rate, Thumbstop, Hold)

16. **"Hook rate"** — 3-sec video views ÷ impressions
17. **"Thumbstop rate"** / **"thumb-stop score"** — used interchangeably with hook rate
18. **"Hold rate"** — 15-sec views ÷ 3-sec views
19. **"3-second video views"** — the underlying engagement primitive
20. **"CPA"** / **"ROAS"** / **"MER"** (marketing efficiency ratio) / **"iROAS"** (incremental ROAS) — the financial KPI stack
21. **"Incrementality measurement"** replacing **"7-day click attribution"** — Taylor Holiday

### Theme 4: "Feed the Algo" Mindset

22. **"Feed the algorithm"** — pervasive perf marketer phrase, pre-dates Andromeda but louder now
23. **"Let AI do the targeting, but feed it with great creative."** — agency consensus phrasing
24. **"The algorithm starves"** — Reddit r/FacebookAds, on what happens with too few diverse creatives
25. **"Allow for the least human intervention as possible."** — Taylor Holiday on Advantage+/Andromeda mindset
26. **"Allow the process of the user's response to the creative to be the end-all, be-all."** — Taylor Holiday
27. **"Creative is the primary optimization variable, not audience."** — Digital Time Savers / industry consensus
28. **"The biggest constraint you can put on your Meta strategy is the constraints you place on your creative process."** — Meta for Business (official)

### Theme 5: Skeptical / Counter-takes

29. **"Nothing more than a snake oil scheme."** — Aazar Ali Shad, The Performers (manages $7M/mo ad spend; says he hasn't seen Andromeda move the needle)
30. **"Andromeda doesn't change the fundamentals; it raises the bar on discipline."** — Monica Shukla, AdExchanger (Jan 2026)
31. **"Andromeda is responsible for ad retrieval, and nothing more."** — Jon Loomer
32. **"The biggest shift in Meta ads since iOS14."** — Taylor Holiday (the strongest pro-Andromeda framing)
33. **"Andromeda killed my results."** — common Reddit r/FacebookAds post genre

---

## Vocabulary That Lands With Perf Marketers Without Overwhelming D2C Founders

These are the **gold phrases** for landing page copy. Each one is instantly recognized by a perf marketer (signals you understand their world) and intuitive enough for a D2C founder to grasp without a glossary.

### 1. "Hook rate" / "thumbstop"
- **Why it works:** Instantly visual — everyone knows what it feels like to keep scrolling vs. stop. Perf marketers use it daily as a creative diagnostic. Founders get it from the metaphor alone.
- **Riff potential:** "Better hooks, more thumb-stops." "Stop the scroll. Then prove the algo right."

### 2. "Creative diversity" (NOT "creative volume")
- **Why it works:** This is the *post-Andromeda* shibboleth. Saying "more creatives" sounds dated. Saying "creative diversity" signals you read the December 2024 Engineering post. D2C founders also intuit it ("don't make 50 of the same ad").
- **Riff potential:** "Concept diversity, not copy-paste." "Andromeda doesn't reward 50 versions of the same ad. It rewards 6 genuinely different ones."

### 3. "Feed the algorithm" / "Feed Andromeda"
- **Why it works:** Universally used. Frames the relationship correctly: you don't beat the algorithm, you supply it. Founders understand it as "give the AI the raw material it needs."
- **Riff potential:** "Andromeda is hungry for creative. Feed it." "The algorithm doesn't think for you — it picks from what you give it."

### 4. "Creative is the new targeting"
- **Why it works:** Already a movement-level phrase post-Andromeda. Compresses the entire strategic shift into 5 words. Perf marketers nod; founders intuit it.
- **Riff potential:** Use it as a section header. Don't water it down.

### 5. "Variant velocity" / "creative velocity"
- **Why it works:** "Velocity" implies speed *and* direction. It positions a creative tool as solving a *workflow* problem, not just a quality problem. Perf marketers use it; founders find it self-explanatory.
- **Riff potential:** "Ship variants at the velocity Andromeda demands." "Creative velocity is the new media buyer."

### Bonus — phrases to AVOID

- **"AI-powered ad creative"** — over-saturated, signals nothing.
- **"10,000x model complexity"** — true but means nothing to either audience.
- **"Advantage+"** — a Meta product, not a creative principle. Confusing to founders.
- **"MTIA / Grace Hopper"** — hardware geek-speak. Skip.
- **"22% ROAS lift"** — if used, must be carefully attributed; otherwise reads as PR-deck filler.

---

## Meta's Official Guidance Post-Andromeda

From Meta for Business and Meta Engineering (primary sources):

1. **Embrace creative diversification** — recommended as primary performance lever, replacing niche audience targeting.
2. **Use Advantage+ creative tools** (image generation, background expansion, music, etc.) — Meta cites +11% CTR, +7.6% conversion rate, +7% link clicks (Ben & Jerry's case).
3. **No specific number of creatives recommended** — Meta declines to give a "X ads per ad set" rule. The Dribbleup case study (3-4/week → ~50/week) is the closest implicit signal.
4. **Consolidate campaigns** — implicit guidance toward Advantage+ Sales Campaigns (ASC) as default, with broader audiences and more creative variety per ad set.
5. **Trust the system** — Meta's framing emphasizes minimal advertiser intervention in audience and bidding, maximum advertiser energy on creative.

**Skeptical note:** Meta has *not* published "Andromeda-specific" advertiser guidance. The "creative diversification" guidance was published alongside Advantage+ marketing, and the Andromeda Engineering post is purely technical. Industry agencies have done most of the translation work for advertisers — and have commercial incentives (creative production, creative analytics tools) to amplify the "you need more creative" narrative.

---

## "Creative is the New Targeting" — Has It Gotten Louder Post-Andromeda?

**Yes, decisively.** The phrase predates Andromeda by ~2 years (it emerged post-iOS 14 / SKAdNetwork as targeting capabilities eroded), but post-December 2024 it has been adopted as the explicit framing for the Andromeda transition.

**Who is saying it (with confidence rating on attribution):**

- **Taylor Holiday (Common Thread Collective)** — has called Andromeda "the biggest shift in Meta ads since iOS14" and is the loudest voice telling D2C brands to scale creative volume drastically (5,000 variations, not 50). HIGH confidence.
- **Motion (creative analytics platform)** — 2026 Creative Benchmarks report (550K ads, 6K advertisers, $1.3B spend, Sep 2025-Jan 2026) is built around the diversification thesis. Launched a "creative diversity score" AI feature. HIGH confidence.
- **Barry Hott** — "ugly ads work" thesis aligns: creative quality and surprise > polish; concepts > production value. Has been on Andrew Faris Podcast multiple times. HIGH confidence on association, MEDIUM on direct Andromeda commentary.
- **Andrew Faris** — podcast host, ecommerce/DTC, frequent collaborator with Hott. HIGH confidence on association.
- **Nick Shackelford (Structured)** — quoted on creative strategist role: "here's what we tested, here's what happened, here's what we do next." HIGH confidence on creative-led framing, MEDIUM on direct Andromeda commentary.
- **Marin Istvanic** — explained Andromeda "without hysteria or hype"; the 4-exposure / 45% conversion drop stat. MEDIUM confidence.
- **Dara Denney** — counter-position ("capping my teams at two" creatives). MEDIUM confidence.
- **Common Thread Collective podcast (Ecommerce Playbook)** — episode "Meta's Andromeda: The Biggest Shift in Facebook Ads Since iOS14." HIGH confidence.
- **Jon Loomer** — the most prominent skeptic of the over-hyping; argues Andromeda is *retrieval only*. HIGH confidence.

**Counter-evidence the thesis is overstated:**

- Aazar Ali Shad ($7M/mo) calls it "snake oil" — hasn't seen needle move.
- Jon Loomer's own ad-spend testing (25-50 ads/ad set) showed no clear advantage from volume.
- Monica Shukla (AdExchanger) argues 20+ creatives/ad set actively backfires.
- Reddit r/FacebookAds is full of "Andromeda killed my campaigns" posts; the rollout was uneven and many advertisers report performance collapse.

**Net for landing page:** "Creative is the new targeting" is safe to use — it's the dominant framing. But avoid implying *more* creative is automatically better. The defensible message is **better, more diverse, faster-iterating** creative — not just more.

---

## Defensible Claims for Landing Page (Ranked by Source Strength)

**TIER 1 — Cite directly, primary sources:**

- "Meta announced Andromeda in December 2024." (Meta Engineering blog)
- "10,000x increase in retrieval model complexity." (Meta Engineering blog — direct quote)
- "+6% recall improvement, +8% ad quality improvement." (Meta Engineering blog — but caveat: "on selected segments")
- "Meta now recommends creative diversification as the best lever to find relevant audiences." (Meta for Business)

**TIER 2 — Cite with attribution, secondary but credible:**

- Taylor Holiday calling it "the biggest shift in Meta ads since iOS14." (Common Thread Collective podcast)
- Hook rate / hold rate benchmarks (Vaizle, Zeely, Motion — agency data, directionally useful)
- "After 4 exposures, conversion drops 45%" (Marin Istvanic via Motion — single source, cite him)
- Motion 2026 Creative Benchmarks (550K ads dataset — substantial, but Motion has a creative analytics product to sell)

**TIER 3 — Avoid or heavily caveat:**

- "22% ROAS lift" — Meta marketing about Advantage+, not Andromeda. Misleading if conflated.
- "20-35% higher ROAS for advertisers who adapt" — agency claim, no methodology, likely inflated.
- "10-15 conceptually distinct creatives per campaign" — recommendation varies wildly by source (3-5 per Loomer, 5,000 per Holiday).
- Anything quoting "the algorithm wants X" without source — most are agency self-promotion.

---

## Gaps & Uncertainties

1. **No independent academic / third-party measurement of Andromeda's actual KPI impact.** Every performance number traces back to either (a) Meta's own claims, (b) agency case studies with commercial incentive, or (c) Reddit anecdotes. There is no Nielsen / academic / regulatory study verifying the 8% / 22% / 35% claims.
2. **The exact rollout timeline is fuzzy.** "Phased rollout in early 2025, global by October 2025" is the consensus, but Meta has not published a precise rollout schedule. Some advertisers report changes in March 2025; others say September.
3. **Disagreement on optimal creative volume.** Holiday says 5,000 variations; Loomer says quality beats quantity at 5-10; Denney caps at 2. This is genuine disagreement, not noise — likely it depends on spend level and vertical, but no source breaks it down rigorously.
4. **The "Andromeda clusters similar ads" claim is widely repeated but not directly sourced from Meta.** Likely inferred from the architecture, but I could not find a Meta document confirming it in those exact terms.
5. **Reddit thread sentiment is noisy.** "Andromeda killed my campaigns" posts are real but could reflect (a) actual Andromeda issues, (b) coincidental Meta changes, (c) advertiser error / iOS-related attribution issues, or (d) survivorship bias (people who didn't have problems don't post).
6. **No data on D2C-specific impact.** Most coverage treats "advertisers" as a monolith. The actual effect on D2C founders specifically (vs. agencies, vs. lead-gen, vs. enterprise brand) is not separately quantified.
7. **Could not verify direct Andromeda quotes from Barry Hott, Ralph Burns, or Nik Sharma.** They are clearly part of the broader creative-led performance marketing camp, but I did not find them directly named-quoting Andromeda in the searches conducted.

---

## What Would Change the Recommendations

- If Meta publishes a formal advertiser playbook for Andromeda with specific creative-volume guidance → update Tier 1 claims.
- If a third-party (e.g., academic, Forrester, Nielsen) publishes independent measurement of Andromeda lift → replace Tier 2/3 numbers with verified ones.
- If a major D2C brand publishes a detailed before/after case study → use as the anchoring proof point.
- If Meta walks back or de-emphasizes Andromeda framing in favor of GEM (Generative Embedding Models, mentioned in some 2026 sources) → re-evaluate which name to lead with.

---

## Sources

### Primary (Meta-published)

- [Meta Andromeda: Supercharging Advantage+ automation with the next-gen personalized ads retrieval engine — Engineering at Meta (Dec 2, 2024)](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/)
- [The Creative Advantage: Unlocking the Power of Diversification with Meta Andromeda — Meta for Business](https://www.facebook.com/business/news/the-creative-advantage-unlocking-the-power-of-diversification-with-meta-andromeda)
- [AI Innovation in Meta's Ads Ranking Driving Advertiser Performance — Meta for Business](https://www.facebook.com/business/news/ai-innovation-in-metas-ads-ranking-driving-advertiser-performance)

### Skeptical / Nuanced Industry Voices

- [What Meta's Andromeda Update Actually Changes — And What It Doesn't (AdExchanger, Monica Shukla, Jan 28, 2026)](https://www.adexchanger.com/data-driven-thinking/what-metas-andromeda-update-actually-changes-and-what-it-doesnt/)
- [The Truth About Meta Andromeda and Ad Retrieval — Jon Loomer](https://www.jonloomer.com/meta-andromeda-ad-retrieval/)
- [Meta Andromeda: What It Means for Your Ad Strategy — Jon Loomer](https://www.jonloomer.com/meta-andromeda/)
- [Meta Andromeda and Creative Diversification: 7 Examples Explained — Jon Loomer](https://www.jonloomer.com/meta-andromeda-creative-diversification/)

### D2C / Perf Marketing Practitioner Voices

- [Meta's Andromeda: The Biggest Shift in Facebook Ads Since iOS14 — Common Thread Collective (Taylor Holiday + Richard Gaffin)](https://commonthreadco.com/blogs/ecommerce-playbook/meta-andromeda-facebook-ads-shift)
- [What Meta Andromeda Means for Creative Diversity — Motion](https://motionapp.com/blog/andromeda-impact-on-bfcm)
- [2026 Creative Benchmarks — Motion](https://motionapp.com/thumbstop-pulse/creative-benchmarks-2026)
- [Motion Glossary of Advertising Terms](https://motionapp.com/glossary)
- [Ugly Ads Work — Trust Barry Hott (And Me) — The Andrew Faris Podcast](https://creators.spotify.com/pod/show/andrew-faris6/episodes/Ugly-Ads-Work--Trust-Barry-Hott-And-Me-e2gl6b2)

### KPI / Hook Rate Benchmarks

- [Hook Rate and Hold Rate: Facebook Ads Formulas and Benchmarks — Vaizle](https://insights.vaizle.com/hook-rate-hold-rate/)
- [From Hook Rate to Hold Rate: Video Metrics Growth Teams Track — Billo](https://billo.app/blog/hook-rate-to-hold-rate/)
- [Hook Rate for Meta Ads: Ultimate Guide — Sovran](https://sovran.ai/blog/hook-rate-for-meta-ads-ultimate-guide)
- [Boost Your Meta Ads Hook Rate — Zeely](https://zeely.ai/blog/ways-to-boost-your-meta-ads-hook-rate/)

### Agency Coverage (use directionally; many have product/service incentives)

- [Meta's Andromeda Update: 11 Creative Strategies for DTC Brands — Wonderful](https://www.usewonderful.com/blog/meta-andromeda-creative-strategies)
- [Why Creative Is the New Targeting: How Meta Ads Actually Work in 2026 — Digital Time Savers](https://digitaltimesavers.com/why-creative-is-the-new-targeting-how-meta-ads-actually-work-in-2026/)
- [Creative Velocity: The Meta Ads Strategy Revolutionizing Performance Marketing — Logical Position](https://www.logicalposition.com/blog/creative-velocity-the-meta-ads-strategy-revolutionizing-performance-marketing)
- [Meta Andromeda Broke Your Paid Social Playbook — Silverback Strategies](https://www.silverbackstrategies.com/blog/meta-andromeda-broke-your-paid-social-playbook/)
- [Meta's Andromeda Update: What Advertisers Must Know — The MTM Agency](https://themtmagency.com/blog/meta-andromeda-october-2025-update-why-creative-diversity-now-defines-ad-performance)
- [The Creative Era: How Meta's Andromeda Rewrites Ad Strategy — Dentsu](https://www.dentsu.com/ae/en/our-latest-thinking/meta-andromeda-strategy)
- [Mastering Meta Andromeda, Creative Strategy, and AI Attribution — Logical Position](https://www.logicalposition.com/blog/the-2026-paid-social-playbook)
- [Unpacking Meta's 2025 Ad Overhaul — IMM Digital](https://imm.com/blog/unpacking-meta-2025-ad-overhaul-andromeda-advantage-and-what-it-means-for-your-ads)

### Reddit / Community Sentiment (noisy but useful for vernacular)

- [Meta Andromeda Update: How to Fix Your Facebook Ads — Vaizle (aggregating Reddit threads)](https://insights.vaizle.com/meta-andromeda-update/)
- [How to Recover from Meta Andromeda Algorithm Collapse — VibeMyAd](https://www.vibemyad.com/blog/how-to-recover-from-meta-andromeda-algorithm-collapse)
- [What Is the Meta Andromeda Update and Why Is It Destroying Ad Performance — Medium / Adam Saad](https://medium.com/write-a-catalyst/what-is-the-meta-andromeda-update-and-why-is-it-destroying-ad-performance-a3959e1c5a1b)
