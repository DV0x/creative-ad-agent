# CELL Architectures — Beyond the Style Bank

Research date: 2026-05-26. Scope: strictly the CELL (one angle → one static Meta ad: copy + image prompt + image). NOT upstream pipeline.

Lens: map alternatives to our proposed **style bank** (6–8 reusable "moves" + reference images + fit-test). Core fear: any reusable artifact ossifies into a TEMPLATE. Evaluation axes: **scalable** (auto, per-brief, no human hand-feeding) × **high-converting on Meta** × **template-resistant**.

---

## 0. The reframe that changes everything: Meta now PUNISHES sameness

The single most important finding for the "template" fear is that template-resistance is no longer just an aesthetic preference — it is an **algorithmic requirement on Meta as of the Andromeda update** (announced Dec 2024, rolled out globally by Oct 2025).

- Andromeda replaced manual audience targeting with an ML retrieval stage that matches ads to users based on **creative signals**. Practitioner analysis converges on: near-duplicate creatives cluster into the same retrieval "leaf node," so 10 similar ads are seen as ~1 concept; redundant variations get severely limited distribution regardless of bid. A widely-cited (practitioner-inferred, NOT official) threshold is "~60% creative similarity triggers suppression." [PPC Blog Pro; AdScale; Wonderful]
- **CONFIDENCE: MEDIUM on the directional claim, LOW on the exact 60% number.** Motion's own write-up is honest that this is *expert opinion, not Meta data*: some practitioners managing $7M/mo "haven't seen measurable impact yet"; others see distinct creatives win. Marin Istvanic notes Meta's algorithm "has always favored differentiation." [Motion]
- The directional consensus is strong even if the mechanism is fuzzy: Connor Rolain (cited by Motion) — *"We used to make seventy-five ads a campaign. Now we make six,"* each with meaningful differences in hook / visual / angle.

**Implication for the cell:** an architecture that produces *meaningfully distinct* ads per brief is not just nicer — it is the thing the platform's distribution layer rewards. A template-collapse architecture is actively penalized. This makes template-resistance a first-class success metric, not a tasteful nice-to-have. It also reframes the volume strategy (B): "more ads" only helps if they are *diverse* ads.

Counter-nuance: "creative diversity matters more than creative volume post-Andromeda" is the current agency consensus, but Meta's internal guidance still recommends 8–15 *distinct* ads per ad set — so the cell must produce variety, not one perfect ad. [Wonderful; AdScale]

---

## How big is the prize? (Why the cell matters at all)

Creative is the dominant controllable lever in paid social, which justifies investing in cell quality vs. just buying more impressions:
- Nielsen / NCSolutions "Five Keys": creative drives **49%** of incremental sales overall, **56%** for digital specifically; when creative is strong it can be up to **89%** of digital in-market success. [Marketing Charts; Nielsen]
- Google: ~**70%** of purchase-intent impact comes from creative quality. [Inside Radio summary]
- CONFIDENCE: HIGH that creative is the #1 controllable lever; these are CPG/brand-lift studies (secondary for D2C DR specifically), so treat exact % as directional for our context.

---

## Approach A — LEARN-FROM-WINNERS (RAG / multimodal retrieval over high-performing ads)

**How it works.** Build a corpus of high-performing ads (Meta Ad Library long-runners as a behavioral proxy for "winning"; or your own historical winners). Embed them multimodally (image + text in a shared vector space). At generation time, embed the brief and retrieve the most relevant winning exemplars, then condition the LLM/image model to *adapt* (not copy) their structure to the brand.

**Evidence / grounding.**
- Multimodal embedding retrieval works and beats LLM-summary retrieval for creative assets: direct multimodal retrieval gave **+13% mAP, +11% nDCG** vs. summary-based approaches; Amazon Nova multimodal embeddings hit **96.7% recall** on a 170-asset creative library. [arXiv 2511.16654; AWS Nova blog]
- RAG-for-ad-copy is proven in production: the CTOP system uses RAG to fetch semantically similar exemplars + chain-of-thought before generation (then optimizes — see C). [arXiv 2507.20227]
- Industry: Foreplay "Lens" and Motion auto-tag Ad Library creatives by hook type / angle / visual style — i.e., a retrievable, labeled winner corpus already exists as a product category. Pencil claims its predictive model is trained on **$2.65B** of media spend (a proprietary winner corpus). [Foreplay; Motion; trypencil.com]

**Scales?** YES — fully automatic per-brief once the corpus + embeddings exist. The corpus also compounds (more winners ingested → better retrieval).

**Template-resistant?** PARTIALLY, and it's the central risk. Retrieval-then-adapt biases toward what already won → regression to the proven mean and "everyone retrieves the same long-runner." Mitigations: (1) retrieve the *structural move* (hook type, proof device, layout grammar) not the surface pixels — this is exactly the "teach thinking not looking" principle in MEMORY.md; (2) retrieve a *diverse set* (k distinct clusters) and force the cell to combine across them; (3) use retrieval as a *constraint to avoid* (don't look like the top 3 in this category) rather than to imitate.

**Converts?** Indirect evidence: long-runners in Ad Library are a behavioral winner-proxy (your own research binder already uses "revealed winner" logic). No clean causal study that *retrieving* winners improves a *new* brand's CTR. CONFIDENCE: MEDIUM that it lifts baseline quality, LOW that naive retrieval is template-resistant.

**vs. style bank.** This is essentially a *bigger, auto-populated, behaviorally-validated* version of the style bank — the bank is a hand-curated 6–8 moves; this is a continuously-growing retrieved set grounded in real performance. Strictly dominates the bank on scalability and freshness; equal-or-worse on template-resistance unless you retrieve-to-differentiate.

---

## Approach B — GENERATE-MANY, LET THE ALGO DECIDE (volume + Meta Advantage+)

**How it works.** Mass-generate variants; upload many; let Meta Advantage+ Creative auto-select/auto-combine the best version per viewer (it recombines base creative with enhancements — format, text overlays, etc. — and tests new combos on up to ~5% of impressions, scaling winners).

**Evidence it converts.** This is the best-documented *platform-level* evidence in the whole space:
- Advantage+ Creative: **+15% ROAS** vs. static creatives (Meta-reported). [Spinutech]
- Advantage+ Sales Campaigns: **+22% ROAS** average; grew 70% YoY, >$20B run-rate (Meta). [adsmurai; Medium playbook]
- CONFIDENCE: MEDIUM — these are Meta's own numbers (the seller has an incentive); still the most direct "this converts on Meta" data available.

**Does platform selection make per-ad craft less important?** Partly yes, partly NO — and this is the key tension:
- YES: Advantage+ does the A/B selection for you, so you don't need to *pick* the winner; the volume strategy says "the algo finds the winner if you feed it enough." Andromeda guidance: feed 8–15 distinct creatives and let retrieval allocate.
- NO (the trap): post-Andromeda, **diversity gates volume**. RevenueCat ("creative volume trap"), Favoured, and Foxwell all warn that "5 ads that look the same = 1 test." Similarity suppression means craft moves *up* the stack: the per-ad job is now "produce a *genuinely distinct, well-crafted concept*," and volume is just "do that N times across distinct angles." Meta selects *among* good distinct inputs; it cannot manufacture a winner from undifferentiated slop. [RevenueCat; Favoured; Foxwell]

**Scales?** YES — this is the most scalable pattern by definition (generation is the only bottleneck).

**Template-resistant?** This is where it fails on its own — naive mass generation is the *most* prone to template collapse and is the exact thing Andromeda penalizes. It only works if paired with a diversity-forcing generator (see D and the QD note below).

**vs. style bank.** Orthogonal — B is a *deployment/selection* strategy, not a generation strategy. Our cell should ASSUME a B-style deployment (produce a *diverse set*, not one ad) and let Advantage+ select. The cell's job is to maximize the diversity-quality of the inputs B selects from.

---

## Approach C — PERFORMANCE-FEEDBACK LOOPS (RL / preference optimization on real metrics)

**How it works.** Close the loop: use real ad metrics (CTR/CVR/ROAS or proxies) as a reward signal to improve future generation. Train a reward model on historical performance, then align the generator (DPO / PPO / RLHF-style) toward higher predicted performance.

**Evidence — this is the strongest *causal* evidence that an architectural choice lifts CTR:**

1. **Meta AdLlama / RLPF** (arXiv 2507.21983, Jul 2025) — *the* flagship result and a near-perfect analog to our cell.
   - 7B LLM, post-trained with **RLPF** (PPO). Reward model = Bradley-Terry on **~7M preference pairs** from "multitext" tests where advertisers varied *only text* (image/targeting fixed) → isolates text's causal effect on CTR. RM accuracy ~57% pairwise.
   - **Result: +6.7% CTR (p=0.0296)** vs. a supervised imitation baseline, in a 10-week live A/B across **~35,000 advertisers / 640,000 ad variations**. First deployed RL-trained LLM for generative ads on Facebook.
   - **Critical caveats they admit (gold for our template fear):** PPO reliably raises RM score but "subjective text quality started to decrease after a certain number of training steps (irrelevant or repetitive text)… reward hacking / overoptimization." Mitigated by early-stopping via a *held-out evaluation RM* + small human labeling, and a length penalty. They explicitly note they do NOT balance performance vs. *creativity* (left to future multi-objective work). So: feedback loops lift CTR but *actively pull toward degeneration/sameness* unless checked. CONFIDENCE: HIGH (large live A/B, Meta authors).

2. **CTR-driven image generation** (CAIG, arXiv 2502.06823, ACM WWW 2025) — image analog.
   - LLaVA-7B + two-branch reward model (pairwise + pointwise CTR) → DPO with "Product-Centric Preference Optimization." Generates background descriptions → Stable Diffusion + ControlNet.
   - **+7.4% CTR offline; +2% CTR in live A/B over 60M+ impressions** on a major e-commerce platform. Reformulates absolute CTR into *relative pairwise* comparisons to handle category-baseline noise. CONFIDENCE: HIGH.

3. **CTOP / CTR-driven ad TEXT** (arXiv 2507.20227, deployed late 2024) — RAG + DPO with *no explicit CTR model*; handles noisy/delayed feedback via dynamic gain+confidence weighting and AA-group testing. **+4.76% relative CTR in test; +1.11% CTR / +1.02% RPM deployed.** CONFIDENCE: HIGH.

4. **Reinforced GAN for ad creative** (Springer ECR 2022) — earlier; reinforced GAN with a CTR-based reward to assemble creatives. (Paywalled; couldn't verify specifics — see Gaps.) CONFIDENCE: LOW.

**Scales?** YES at inference once trained, but training requires a *performance corpus* — the hard part for an early-stage product with little of its own ad-result data. Cold-start is the blocker.

**Template-resistant?** NO — this is the *least* template-resistant family by default. Every RL/DPO-on-performance paper above documents drift toward generic/repetitive output (reward hacking). It optimizes a scalar; scalars have a single peak; the generator races to it. Must be paired with explicit diversity objectives (multi-objective RL, KL/length penalties, novelty rewards) — which the AdLlama authors flag as unsolved future work.

**Converts?** YES — strongest causal evidence in the entire space (multiple live A/Bs, +2% to +6.7% CTR).

**vs. style bank.** Complementary, not competing. The bank/cell decides *what to make*; a feedback loop tunes *how to make it well over time*. For us, the realistic near-term form is a **lightweight reflection / proxy-reward loop** (no real metrics yet): score candidates with a CTR-predictor or an LLM-judge against DR principles, keep the best — i.e., bandit-on-proxy, not full RL. Real-metric RL is a v2 once we have ad-result data.

---

## Approach D — CREATIVE-DNA DECOMPOSITION (decompose winners → recombine components)

**How it works.** Break winning ads into structured components — hook type, layout grammar, proof element, visual device, emotional tone, CTA pattern — into a taxonomy; then recombine components per brief into new combinations the corpus never literally contained.

**Evidence / grounding.**
- This is a *live product category*: Motion sorts by AI tags (asset type, format, hook, creative angle); Foreplay Lens auto-transcribes + tags hooks; Improvado/Retensis market "Creative DNA" decomposition; "Creative Impact Analysis" decodes color/pacing/expression/hook. So the decomposition step is industrially validated as *analyzable*. [Motion; Foreplay; Improvado; Retensis; Starti]
- Academic: the conditional-attention conversion-prediction work (arXiv 1905.07289) decomposes creatives into elements and learns which drive conversion by genre/audience — i.e., DNA components are *predictive*, not just descriptive. CONFIDENCE: MEDIUM (2019, but methodologically on point).

**Scales?** YES — auto-tag a corpus once, then recombination is cheap and per-brief.

**Template-resistant?** This is the **most structurally template-resistant** of all the approaches, and the most aligned with our own MEMORY principle ("encode the MOVES, discard the SURFACE"). Recombination across orthogonal axes is a *combinatorial explosion* of distinct concepts (5 hooks × 5 layouts × 5 proof devices × 5 visual devices = 625 structurally-distinct skeletons), and you can *measure* distinctness in the component space to guarantee Andromeda-friendly diversity. It avoids surface-copying by construction because it never retrieves whole pixels.
- Risk: recombination can yield *incoherent* ads (a stat-hook with a story-layout and a contrast-visual may not cohere) — needs a coherence/fit check (which is what our fit-test + a critic agent do).

**Converts?** Indirect — components are extracted from winners (behavioral proxy) and shown predictive (1905.07289), but recombination novelty isn't causally validated for CTR. CONFIDENCE: MEDIUM.

**vs. style bank.** This is the **natural generalization of the style bank done right.** The bank is a small fixed set of *visual* moves; DNA decomposition is a *multi-axis* taxonomy (copy + layout + proof + visual) that recombines — strictly more expressive and more template-resistant, because diversity comes from *combinatorics across axes*, not from a menu of 6–8 looks. The bank is the visual-device axis of a fuller DNA system.

---

## Approach E — Novel / emerging architectures

**E1. Reflective multi-agent generation (self-critique loop).** "Mirror in the Model" (MIMO, arXiv 2507.03326, 2025): hierarchical multi-modal agent system (MIMO-Core) + a coordination loop (MIMO-Loop) that *explores multiple stylistic directions* and *auto-detects and corrects errors* iteratively, beating diffusion and LLM baselines on real banner-design tasks. OMS (arXiv 2507.02353) does the same idea for ad keywords (ReAct + self-reflection + click feedback). Takeaway: a **generate → critique → revise** loop with an explicit *style-exploration* step is a proven pattern and maps directly onto our cell (generate concept → DR-principle critic → revise). It bakes in template-resistance via the "explore multiple stylistic directions" step. CONFIDENCE: MEDIUM (academic, no CTR result; human/quality-judge evaluated).

**E2. Quality-Diversity (MAP-Elites / novelty search) as the diversity engine.** QD algorithms (MAP-Elites + novelty, MENOV) explicitly search for *a set of high-performing AND distinct* solutions across a user-defined feature space, rather than one optimum — "illuminating" the space. This is the textbook *cure* for the single-peak collapse that kills approaches B and C. Applied to our cell: define behavior dimensions = DNA axes (hook type, visual device, tone), keep the best ad *in each cell of the grid* → guaranteed-diverse, individually-strong set of 8–15 ads = exactly what Andromeda + Advantage+ want. CONFIDENCE: MEDIUM that it transfers (QD is proven in robotics/PCG/aesthetic evolution; not yet shown on Meta ads specifically). This is the most *novel* and most *template-resistant-by-design* idea in this report. [Frontiers QD; MENOV; QD for Aesthetic Evolution]

**E3. CTR-predictor-in-the-loop (predict before spend).** Pencil's pattern: generate variants, score each with a proprietary performance predictor (claims 84% accuracy, trained on $2.65B spend), launch only top-quartile-predicted. AdCreative.ai markets up-to-14× CTR case studies. This is approach C's reward model used at *inference* as a filter rather than for training — cold-start-friendly if you can get/borrow a predictor. CONFIDENCE: LOW on the vendor accuracy claims (marketing numbers, no peer review); MEDIUM that "predict-and-filter" is a sound, scalable pattern.

---

## The counter-case (Constitution: seek disagreement / steel-man the opposite)

A skeptical performance marketer would push back hard on "AI-generate winning static ads at scale":
- **Authenticity backlash.** Nielsen 2025: human-crafted brand campaigns got **+43% unaided recall, +37% emotional engagement** vs. AI equivalents; the Nuremberg Institute found merely *labeling* an ad AI-generated lowers ad attitude and purchase intent. McDonald's pulled an AI holiday ad after outcry; Coca-Cola was ridiculed for AI trucks. [Soku; KO Insights; DesignRush; NN/g]
- **Short-termism trap.** WARC 2025: ads optimized solely for short-term performance underperform by up to **40%** over longer horizons vs. campaigns built around multiple rotating creative ideas. Optimizing a per-ad CTR proxy (approach C) can *cost* you over the campaign horizon. [Soku summary of WARC]
- **The honest counter-balance:** brands running weekly promos report **~40% creative-cost savings with AI and no measurable performance decline**, and the LLM-Generated Ads paper (arXiv 2512.03373) found LLM ads reached *parity* and in places *persuasion superiority* (higher click intent) vs. human ads — under controlled conditions, within fixed templates, may not generalize. CONFIDENCE: MEDIUM.

**Who disagrees and why:** a senior DR creative strategist would say the *concept/angle* is the moat and no recombination/RL system invents a genuinely new angle — it remixes proven ones, which is fine for scaling a known winner but won't produce the breakout. This is partially true and is exactly why our cell takes the *angle as input* (from upstream strategy) and only owns *execution* — sidestepping the weakest claim of automated creative.

**What would change the conclusion:** if Meta confirms Andromeda does NOT meaningfully suppress similar creatives (removing the algorithmic penalty for sameness), the template-resistance axis would drop in importance and the volume-only strategy (B) would look much stronger. Conversely, if authenticity backlash hardens into measurable CTR penalties for detectably-AI statics, the whole "scale AI statics" thesis weakens and the cell should lean toward AI-assisted-human, not full-auto.

---

## 12-month fragility check (systems thinking)

- **Andromeda is the load-bearing external assumption.** It's <18 months old and still rolling out; Meta could change similarity handling. Our architecture should be *robust to it either way* — diverse-set generation is good under both regimes (it's just *more* valuable if suppression is real).
- **Value migration.** The cell's "intelligence" (write a good hook, derive a style) is exactly the thing every frontier model is rapidly commoditizing. Durable value lives in: (1) a *proprietary winner/DNA corpus* tied to real outcomes (approaches A+D+C compound), (2) the *feedback loop on our users' own ad results* (approach C — a data moat that grows with usage), and (3) workflow/habit. A pure prompt-engineering cell has no moat; a cell wrapped in a compounding performance corpus does.
- **Who else could solve this:** Meta itself (AdLlama + Advantage+ are Meta moving *into* the cell — the most dangerous competitor), Pencil/AdCreative (have the spend-data moat already), or the founder using ChatGPT + Nano Banana directly. Our defensibility has to be the *integrated angle→DR-execution→diverse-set* loop plus the per-user feedback corpus, not raw generation quality.

---

## Design-space scoring

Scale: 1 (weak) – 5 (strong). Axes: **Scalable** (auto, per-brief) · **Converts** (evidence it lifts Meta CTR/ROAS) · **Template-resistant** (resists sameness / Andromeda-safe).

| # | Approach | Scalable | Converts | Template-resistant | Evidence strength |
|---|----------|:--------:|:--------:|:------------------:|-------------------|
| A | RAG / multimodal retrieval over winners | 5 | 3 | 2 (naive) → 4 (retrieve-to-differentiate) | MED |
| B | Mass-generate + Advantage+ selection | 5 | 4 (Meta: +15–22% ROAS) | 1 alone → 4 with diversity-forcing | MED (vendor) |
| C | RL / preference optimization on real metrics | 3 (cold-start) | 5 (AdLlama +6.7% CTR live) | 1 (reward hacking → drift) | HIGH |
| D | Creative-DNA decomposition + recombine | 5 | 3 (indirect) | 5 (combinatorial, measurable) | MED |
| E1 | Reflective multi-agent generate→critique→revise | 4 | 3 (quality, no CTR) | 4 (style-exploration step) | MED |
| E2 | Quality-Diversity (MAP-Elites / novelty) | 4 | 3 (transfer unproven) | 5 (diverse-set by design) | MED |
| E3 | CTR-predictor-in-the-loop (predict-and-filter) | 4 | 4 (Pencil/AdCreative claims) | 2 (filters, doesn't diversify) | LOW |
| — | **Style bank (baseline)** | 3 (hand-curated) | 3 (DR-grounded) | 3 (menu risk) | n/a |

### Top 2–3 most promising

1. **D — Creative-DNA decomposition + recombination, structured as the diversity engine.** Best template-resistance (combinatorial across orthogonal axes, *measurable* distinctness for Andromeda safety), fully scalable, and it is the *correct generalization of our own style bank* ("moves not surface" — already our stated principle). Convert-evidence is indirect but the components are extracted from behavioral winners and shown predictive. This is the spine.

2. **E2 / B together — Quality-Diversity generation feeding an Advantage+ deployment.** D gives the axes; QD (MAP-Elites + novelty) turns those axes into a *guaranteed-diverse, individually-strong set of 8–15 ads*; Advantage+ then does the live selection (the part with the hardest *converts* evidence: +15–22% ROAS). This directly answers "does platform selection make per-ad craft less important?" — NO; it makes per-ad *distinctness* the craft, which QD operationalizes. Most novel, most Andromeda-aligned.

3. **C as a v2 overlay (proxy-reward now, real-metric RL later).** Strongest causal CTR evidence in the field (AdLlama +6.7%, CAIG +2% live), and the only approach that builds a *compounding data moat* from our users' own ad results. Near-term, run it as a *lightweight critic/predict-and-filter* loop (E3/E1 flavor) to avoid the documented reward-hacking/template-drift; graduate to real RLPF once we have outcome data. Pair with explicit diversity penalties so it doesn't undo D+E2.

**Net recommendation for the cell:** D (DNA axes) as the generation grammar → E2 (QD) to force a diverse-strong *set* → A (retrieve-to-differentiate) to ground each in real winners without copying them → critique loop (E1) for coherence/DR-fit → ship the set into B (Advantage+) for selection → layer C (proxy reward → real RLPF) over time as the moat. The style bank survives, but as the *visual-device axis* of D, not as the whole cell.

---

## Sources

- [CTR-Driven Advertising Image Generation with MLLMs (CAIG, ACM WWW 2025)](https://arxiv.org/html/2502.06823v1) · [ACM](https://dl.acm.org/doi/10.1145/3696410.3714836) — 2025, primary
- [Improving Generative Ad Text on Facebook using RL (AdLlama / RLPF)](https://arxiv.org/abs/2507.21983) · [HTML](https://arxiv.org/html/2507.21983v1) — Jul 2025, primary (Meta authors)
- [CTR-Driven Ad Text Generation via Online Feedback Preference Optimization (CTOP)](https://arxiv.org/html/2507.20227v2) — 2025, primary
- [LLM-Generated Ads: From Personalization Parity to Persuasion Superiority](https://arxiv.org/pdf/2512.03373) — Dec 2025, primary
- [Mirror in the Model (MIMO) — Reflective Multi-LLM Ad Banner Generation](https://arxiv.org/abs/2507.03326) — 2025, primary
- [OMS: Self-Reflective Ad Keyword Generation via LLM Agent](https://arxiv.org/pdf/2507.02353) — 2025, primary
- [Creativity in LLM-based Multi-Agent Systems: A Survey](https://arxiv.org/pdf/2505.21116) — 2025, secondary/survey
- [Conversion Prediction via Multi-task Conditional Attention Networks (Hosei)](https://arxiv.org/pdf/1905.07289) — 2019, primary
- [Ad creative generation using reinforced GAN (Springer ECR)](https://link.springer.com/article/10.1007/s10660-022-09564-6) — 2022, primary (paywalled, unverified)
- [Comparison of Text- vs Image-Based Retrieval in Multimodal RAG](https://arxiv.org/pdf/2511.16654) — 2025, primary
- [Amazon Nova Multimodal Embeddings for creative asset discovery](https://aws.amazon.com/blogs/machine-learning/scale-creative-asset-discovery-with-amazon-nova-multimodal-embeddings-unified-vector-search/) — 2025, vendor
- [Quality Diversity: A New Frontier (Frontiers)](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2016.00040/full) · [QD for Aesthetic Evolution (Springer)](https://link.springer.com/chapter/10.1007/978-3-031-03789-4_24) — QD methods
- [Meta Advantage+ Creative — Spinutech (+15% ROAS)](https://www.spinutech.com/digital-marketing/social/platforms/facebook/metas-advantage-creative-enhancements-a-new-era-of-ad-optimization/) · [adsmurai (+22% ROAS)](https://www.adsmurai.com/en/articles/meta-advantage-solutions) · [2026 playbook](https://medium.com/@tentenco/how-to-build-a-successful-campaign-with-metas-advantage-ai-the-complete-2026-playbook-befca729202b) — 2025/26, vendor/practitioner
- [Andromeda creative-similarity suppression — PPC Blog Pro](https://ppcblogpro.com/how-andromeda-detects-and-punishes-ad-duplication/) · [Wonderful](https://www.usewonderful.com/blog/meta-andromeda-creative-strategies) · [AdScale](https://adscale.com/blog/meta-andromeda-update/) · [Motion (honest "expert opinion not Meta data")](https://motionapp.com/blog/andromeda-impact-on-bfcm) — 2025/26, practitioner-inferred
- [Creative volume trap — RevenueCat](https://www.revenuecat.com/blog/growth/creative-volume-meta-ad/) · [Foxwell testing frameworks](https://www.foxwelldigital.com/blog/the-meta-creative-testing-frameworks-top-brands-use-in-2026) · [Favoured](https://favoured.co.uk/creative-testing-meta-ads-strategy/) — 2025/26, practitioner
- [Creative-DNA tooling — Motion](https://motionapp.com/) · [Foreplay Lens](https://www.foreplay.co/lens-creative-analytics) · [Improvado Creative DNA](https://improvado.io/docs/creative-analytics) · [Retensis](https://retensis.com/creative-dna) — vendor
- [Pencil AI predictive model ($2.65B spend, 84% claim)](https://trypencil.com/the-platform) · [BCG x Pencil](https://www.bcg.com/news/20may2025-bcg-and-pencil-join-forces-to-scale-ai-adoption-in-marketing) — vendor
- [Creative = 49–56% of sales lift — Marketing Charts / Nielsen-NCS](https://www.marketingcharts.com/advertising-trends-230468) · [Nielsen](https://www.nielsen.com/insights/2017/perspectives-want-a-successful-ad-get-creative/) — brand-lift studies
- [AI vs human creative & authenticity backlash — Soku](https://soku.ai/blog/ai-vs-human-ad-creatives-performance) · [KO Insights](https://www.koinsights.com/the-authenticity-premium-why-consumers-are-rejecting-ai-generated-content/) · [DesignRush AI backfires](https://news.designrush.com/7-worst-ai-advertising-backfires-2025) · [NN/g](https://www.nngroup.com/articles/ai-ad/) — 2025, secondary

## Gaps & Uncertainties

- **Andromeda mechanism unverified.** The "60% similarity → suppression" threshold and leaf-node clustering are practitioner inference, not confirmed Meta documentation. Could NOT find an official Meta statement on creative-similarity suppression. Directional consensus is strong; exact mechanics are not. (LOW–MED)
- **No causal study that retrieval-of-winners (A) or DNA-recombination (D) lifts a NEW brand's CTR.** Their convert-claims are indirect (winners-as-proxy + component predictiveness). The clean causal evidence is all in C (RL on metrics). (Gap)
- **QD (E2) is unproven on Meta ads specifically** — transfer from robotics/PCG/aesthetic evolution is my inference, not a published ad result. (MED)
- **Vendor performance numbers (Pencil 84%, AdCreative 14× CTR, Meta +15–22% ROAS) are self-reported**, not peer-reviewed or independently audited. (LOW on exact figures)
- Could not access the reinforced-GAN paper (Springer paywall/redirect) or the full QD survey text (PDF render issue) beyond abstract/structure.
- No data found on AI-static-ad performance *specifically for small D2C/local/lead-gen budgets* (most evidence is large e-commerce / brand CPG); generalization to our ICP is assumed, not verified.
