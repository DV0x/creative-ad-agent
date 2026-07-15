# Meta Andromeda & Creative Production — Research Findings (2025–2026)

Research date: 2026-07-15. Prepared for creative-production strategy.
Confidence conventions: HIGH = primary Meta source or broad practitioner consensus with numbers; MEDIUM = credible practitioner, some corroboration; LOW = single source / circular citation / inferred.

---

## 0. TL;DR

- **Andromeda is Meta's ML *retrieval* engine** (the first stage of ad ranking): for each impression it narrows tens of millions of candidate ads down to a few thousand *before* the value-based auction runs. Announced Dec 2, 2024 (with NVIDIA); rolled out through 2025, described by practitioners as "complete by ~October 2025." **HIGH.**
- It sits under a broader 2025 stack: **GEM** (Generative Ads Model — a *prediction* foundation model, launched 2025, Meta engineering blog Nov 10 2025) is the "central brain"; **Andromeda** does retrieval; **Lattice** does ranking. The clean "three-layer" diagram is a *practitioner synthesis* — no single Meta doc lays it out that way. **MEDIUM.**
- **Directional creative takeaway is real and Meta-endorsed:** feed the system *distinct creative concepts* (different people, contexts, benefits), not many near-copies of one idea. Meta's own "creative diversification" guidance says the same. **HIGH (direction).**
- **BUT the popular mechanic — "near-duplicates collapse into one Entity ID = one auction ticket, so 50 similar ads = 1 ad"** — is *unofficial practitioner terminology*, not something Meta publishes. Right intuition, unverified mechanism. **MEDIUM/LOW.**
- **The volume numbers everyone quotes are agency-generated, not Meta-confirmed**, and some are circularly cited (e.g., "25 creatives = 17% more conversions / 16% lower cost" traces to an agency, Scaledon, not Meta). Treat as directional. **LOW/MEDIUM.**
- **Important counter-current from top strategists (Foxwell, Motion):** raw volume of mediocre variations *corrupts* the signal and wastes budget; ~5–6% of ads capture the majority of account spend; one great ad beats 30 mediocre ones. The real lesson both camps agree on: **volume of DISTINCT CONCEPTS, gated by a quality bar — not volume for its own sake.** **HIGH.**

---

## 1. What exactly is Andromeda?

### Primary source (HIGH)
Meta Engineering blog, Dec 2, 2024: "Meta Andromeda: Supercharging Advantage+ automation with the next-gen personalized ads retrieval engine."
https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/

**What it is:** A machine-learning *retrieval* engine. Meta's ad system is multi-stage: (1) **retrieval** — narrow tens of millions of eligible ads to a few thousand; (2) **ranking / value-based auction** — score that shortlist on bid × estimated action rates × ad quality. **Andromeda is stage 1.** It doesn't replace the auction; it decides which few thousand ads the auction even gets to consider.

**What changed vs. before:**
- Old system: "isolated model stages and numerous rule-based heuristics" to manage the ad volume — "complex, memory bandwidth-intensive, and difficult to scale."
- New: a "highly customized deep neural network with sublinear inference cost," enabling a **10,000× increase in model capacity** for retrieval personalization.
- **Hierarchical indexing** (multi-layer index, only inspects most-relevant nodes) + **model elasticity** (adjusts model complexity/inference steps in real time to available compute).

**Hardware (NVIDIA + Meta):**
- **NVIDIA Grace Hopper Superchip** — GPU-side feature preprocessing; stores all precomputed ad embeddings/features in local memory, sidestepping the CPU↔GPU interconnect bandwidth bottleneck.
- **MTIA** (Meta Training and Inference Accelerator) — future integration expected to add "another 1,000× increase in model complexity."

**Reported performance (Meta's own numbers):**
- +6% recall improvement to the retrieval system
- +8% ads-quality improvement on selected segments
- 10× model-inference efficiency (via elasticity); >3× end-to-end QPS; >100× feature-extraction latency/throughput
- Advertiser-side (attributed to the broader Advantage+ AI stack, not Andromeda alone): +22% ROAS when AI-driven targeting enabled; +7% conversions for businesses using generative image tools; >1M advertisers made >15M ads/month with GenAI tools.

**Roadmap signal in the same blog:** planned move to an **autoregressive loss function** to deliver "a more diverse set of ad candidates" — Meta itself framing *diversity* as a delivery goal (matters for §2).

### Rollout timeline (MEDIUM — dates beyond the announcement are secondary)
- **Dec 2, 2024** — announced (primary).
- Through 2025 — progressive rollout. Multiple practitioner posts say "rolled out globally / completed ~October 2025." No Meta doc pins the exact global-completion date; treat "October 2025" as practitioner consensus, not confirmed.
- **Oct 2025 "ROAS disruption"** narrative: a widely re-cited agency study claims across ~3,014 advertisers, ROAS fell ~7% on average during rollout and industry landing-page conversion dropped 3.5% → 2.9%, worst during the 0–30% rollout window. **LOW confidence — single-source agency study, not Meta; likely conflates seasonal/iOS/other factors.** Useful as color, not fact.

### What Meta shipped since / roadmap (2025–2026)
- **GEM (Generative Ads Model)** — Meta Engineering blog, Nov 10, 2025. Meta's largest recommendation foundation model, LLM-scale, trained across thousands of GPUs. **"Generative" = generating predictions, NOT ad creative.** Reported +5% IG / +3% FB Feed conversions in Q2 2025, benefit "doubled" in Q3. Note: this blog does *not* mention Andromeda or Lattice by name.
  https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/
- **"Fully automated ads by end of 2026"** — widely reported (originally WSJ; via Benzinga, Marketing Dive). Vision: advertiser supplies product image or URL + budget + target; Meta's AI generates the creative (image/video/copy), picks audience, placement, and spend. This is the *creative-generation* layer being added on top of the *delivery* automation Advantage+ already does. **MEDIUM — reported plan, not shipped GA as of mid-2026.**
  https://www.benzinga.com/markets/tech/25/06/45722563/mark-zuckerbergs-meta-to-offer-fully-automated-ai-based-ad-creation-by-2026-report
  https://www.marketingdive.com/news/meta-plans-to-enable-fully-ai-automated-ads-by-2026/749613/
- **Advantage+ evolution:** through 2025 Meta made Advantage+ the default/primary path (Advantage+ Shopping "ASC" + Advantage+ Audience where detailed targeting becomes a *suggestion*). GenAI creative enhancements (image expansion, background gen, text/music overlays) folded into "Advantage+ creative."

**Practitioner synthesis of the stack (MEDIUM — useful mental model, not one Meta doc):**
GEM = brain (learns, predicts, transfers knowledge) → **Andromeda = retrieval** (millions → ~a few thousand / "~500" in some retellings) → **Lattice = ranking** (scores the shortlist using GEM's predictions). Some add "GEM real-time personalization." Treat the neat 3-layer chart as an explanatory device.

---

## 2. Does creative DIVERSITY now beat a few polished ads? How are near-duplicates handled?

### The consensus claim (HIGH on direction)
Both Meta and practitioners agree: **supply distinct creative concepts, not minor variations.** Meta's official "Creative Advantage" post frames creative diversification as the top lever now that targeting is automated. Its own Andromeda blog names *ad diversity* as a delivery goal.
- Meta official: https://www.facebook.com/business/news/the-creative-advantage-unlocking-the-power-of-diversification-with-meta-andromeda
  (Case study: Dribbleup scaled 3–4 creatives/week → ~50; Advantage+ image gen: +11% CTR, +7.6% CVR; ASC: −9% CPA.)

### The "Entity ID / dedupe" mechanic (MEDIUM/LOW — flag as inferred)
The viral framing — Andromeda clusters conceptually similar ads (via CV + NLP + audio) above a similarity threshold into one "Entity ID"; if 50 ads share one Entity ID you get **"one ticket to the stage-2 auction"** ("50 ads = 1 ad") — is **explicitly practitioner terminology, NOT official Meta nomenclature.** The clearest source even says so: "Entity ID is the shorthand the industry uses... an explanatory device... rather than an official term Meta publishes."
  https://adsuploader.com/blog/meta-andromeda
- **What's defensible:** Meta's system does dedupe/cluster similar ads and rewards diversity (consistent with the autoregressive-diversity roadmap and the "5 slightly-different product shots ≈ one ad" language across many agencies). **What's NOT confirmed:** the specific "single auction ticket" mechanic and any exact similarity threshold. Use the *behavior* (diversify concepts) as guidance; don't state the *mechanism* as Meta fact.

### Volume / refresh cadence — the numbers everyone quotes (LOW/MEDIUM — agency-sourced)
Widely repeated benchmarks (Common Thread Collective and echoed by many):
- **Concepts per month by spend:** <$10K → 8–12; $10K–$50K → 15–25; $50K+ → 25–40+ with weekly refresh.
- "Brands testing 20+ ads/month see ~65% higher ROAS than those testing <10."
- "Top performers keep creative-similarity scores <40% across active ad sets."
- **Ad-fatigue window compressed to 2–4 weeks**; keep 2–3 new distinct concepts entering the pipeline weekly at moderate spend.
- Catalog ads emphasis: top performers run 67+ live catalog ads, ~60% of Meta revenue from catalog, +23% ROAS / +37% CPA vs. bottom performers.
  https://commonthreadco.com/blogs/coachs-corner/meta-andromeda-roas-creative-strategy-2026
- The "**one ad set w/ 25 diverse creatives = +17% conversions at −16% cost vs. five ad sets × five creatives**" stat is cited as "Meta internal testing" in some posts but traces to agency **Scaledon** in others. **Circular sourcing — LOW.** Directionally supports consolidation, but don't cite as a Meta figure.
  https://www.chatterbuzzmedia.com/blog/meta-andromeda-creative-targeting/

### The COUNTER-VIEW — critical, do not skip (HIGH)
Top strategists warn the volume story is half-true and dangerous taken literally:
- **Foxwell Digital (Andrew Foxwell, top-tier Meta advisor):** healthy account creative hit rate is only ~10–30%; flooding Meta with mediocre ads *corrupts targeting signal* ("Andromeda goes looking for an audience that resonates with a bad ad"), raising CPMs and slowing optimization. One great ad spent "$600K profitably at 2.5× ROAS over 2.5 years." Prescription: a **pre-launch quality gate** (product/problem in first 3s, made for cold audiences, works without sound, right-audience hook), then methodical iteration — not volume for its own sake.
  https://www.foxwelldigital.com/blog/creative-quality-vs-quantity-why-meta-still-prioritizes-story-over-volume
- **Motion ("Winners are rare"):** by design, ~6% of ads capture the majority of an account's spend; ~5% of creatives spend ≥10× the account median. Rarity of winners is statistical, not a volume-failure — so cost-per-winner and win-rate matter more than raw ad count.
  https://motionapp.com/library/research/creative-benchmarks-2026/winners-are-rare
- **RevenueCat ("creative volume trap"):** excessive testing causes strategist burnout, weaker experiments, account bloat.
  https://www.revenuecat.com/blog/growth/creative-volume-meta-ad/

**Synthesis (my read):** The two camps actually converge. What Andromeda rewards is **diversity of distinct, high-quality concepts** — different angles/people/contexts that give the system genuinely different signals to match. What it punishes (or wastes budget on) is **volume of near-identical or low-quality variations.** "Diversity beats polish" is a false binary; the winning posture is *diverse AND quality-gated*. For a creative-generation tool, the implication is: generate genuinely distinct concepts (angle × persona × context × benefit), not 20 reskins of one layout — and bake in a quality bar.

---

## 3. "Creative is the new targeting" — evidence

**Directionally well-supported (HIGH for Advantage+ specifically):**
- Meta moved detailed targeting to a *suggestion* under Advantage+ Audience; the system uses conversion signals + creative to find converters. Advantage+ creative shows +22% ROAS over manual (Meta's figure).
- Mechanism: creative content self-selects audience. A fitness image pulls fitness-interested users; a B2B headline self-selects decision-makers. Every hook/headline/visual is a signal Andromeda uses to decide who sees it — and it can override your audience inputs if the creative signals a better match elsewhere.
- Cross-platform corroboration: same principle underlies Google PMax and TikTok's engine (MarTech: "AI is making creative the new targeting").
  https://martech.org/ai-is-making-creative-the-new-targeting/
  https://www.triplewhale.com/blog/creative-targeting-ai-driven-delivery

**Caveats / steel-man the opposite:** "creative IS targeting" is strongest under **broad + Advantage+**; advertisers running tight manual audiences still exert real control. And the strong version ("the algorithm overrides your audience") is practitioner framing — Meta confirms *Advantage+ Audience* treats targeting as a suggestion, but not that all delivery ignores audience. **Confidence: HIGH that creative now drives *who converts* under broad/Advantage+; MEDIUM on the absolutist "creative fully replaces targeting" framing.**

---

## 4. Formats the delivery system favors for STATIC images (2025–2026)

**Aspect ratios (HIGH on the core three; MEDIUM on the 2026 change-dates, which are agency-sourced):**
- **4:5 vertical (1080×1350)** — default for feed single-image; ~25% more mobile screen than square → typically better CTR.
- **9:16 vertical (1080×1920)** — Stories, Reels, all full-screen placements.
- **1:1 square (1080×1080)** — universal fallback, works across ~80%+ placements.
- Meta guidance: 4:5 / 9:16 / 1:1 together cover ~90% of delivery. Design 4:5 for feed + a 9:16 variant for full-screen; 1:1 as safe fallback.
  https://www.facebook.com/business/help/103816146375741
- Reported 2026 shifts (MEDIUM, secondary): unified 9:16 safe zone across FB/IG Stories+Reels (~Mar 2026); IG Explore feed retired (~Jan 2026) pushing more weight to 9:16.

**Text-on-image (MEDIUM):** The hard **20%-text rule was removed (2020)** — no longer rejects ads. But delivery still tends to **deprioritize text-heavy images**; keep on-image text minimal. Safe zones matter for 9:16 (avoid top ~14% and bottom ~20–35% where UI overlaps).

**Flexible ads / DCO (MEDIUM — format naming in flux):**
- **DCO / Dynamic Creative:** upload an asset pool — **up to 10 images/videos, 5 headlines, 5 primary texts, 5 CTAs** — Meta assembles best-performing combinations per user/placement.
  https://www.hunchads.com/blog/dynamic-creative-optimization
- **"Flexible Ads"** (the newer combined format) was **removed from Ads Manager setup ~March 2026**, with the capability folded into **Advantage+ creative** (flexible media, placement asset customization, GenAI enhancements). Net: the *asset-pool → machine-assembled* model persists; the label is being absorbed into Advantage+.
  https://www.campaignbuilder.io/blogs/meta-flexible-ads-removed-2026
  https://madgicx.com/blog/flexible-ads-are-replacing-dynamic-creatives

**How many creatives per ad set:** practitioner guidance (LOW/MEDIUM) skews toward **consolidation** — fewer ad sets, more diverse creatives inside them (the "25-in-one-ad-set" framing), CBO/Advantage+ budget, ad sets organized by **concept/persona, not format**.

---

## 5. How practitioners restructured production after Andromeda (concrete)

**Common Thread Collective (DR agency, real spend) — MEDIUM:** concepts/month tiered by spend (8–12 / 15–25 / 25–40+); consolidate to fewer broad campaigns (if >3–4 campaigns and none hits 20+ conversions/week, you're fragmenting signal); 2–4 week fatigue window; weekly refresh at scale. https://commonthreadco.com/blogs/coachs-corner/meta-andromeda-roas-creative-strategy-2026

**Motion — Caleb Kruse "10 ads vs 100 ads" — MEDIUM/LOW on specifics:** old play (10–15 ads/mo, find 1–2 winners, scale) → new play (**50–100 ads/mo across ~10 concepts × 5–10 hook variations**, 4-week cycle, campaign-level CBO, ad sets by concept/persona not format, 10–20 variations per ad set). Cites analysis of brands spending >$200M and a claimed conversation with Meta VP Matt Steiner — **attribution unverified.** https://motionapp.com/library/talk/the-new-meta-ads-testing-strategy-10-ads-vs-100-ads/

**Testing structure consensus (MEDIUM):**
- **ASC / Advantage+ Shopping as the primary/scaling campaign** (claimed −17% CPA vs manual) + **one separate testing campaign** feeding winners in.
- Growth-stage: 1 production + 1 testing campaign, ~70% budget into Advantage+, 10–12 concept-level new ads/mo minimum.
- Scale-stage: 2 production (by market/product line) + 1 testing, 15–25 concepts/mo.
- Cost caps / bid controls come up as the lever to *scale winners without breaking* Advantage+ efficiency, but I found **no reliable, non-circular numbers** on specific cap values — treat as a known tactic, unquantified here.

**The load-bearing agreement across everyone (including skeptics):** test **conceptually distinct** creatives (different emotional angle — problem, social proof, contrarian, story — persona, environment, benefit), let Meta's system distribute, judge on **win-rate and cost-per-winner**, and don't confuse "many variations" with "many concepts."

---

## Gaps & Uncertainties (what I could NOT verify)

1. **Exact provenance of headline volume stats.** "25 creatives = +17% conv / −16% cost," "20+ ads = +65% ROAS," "similarity <40%" — circulated as Meta or "internal testing" but traced to agencies (Scaledon, CTC). **Directional only; do not cite as Meta figures.**
2. **The "Entity ID → one auction ticket" dedupe mechanic** is explicitly *unofficial*. Meta clearly rewards diversity and clusters similar ads, but the precise collapse mechanism and any similarity threshold are inferred, not published.
3. **The neat GEM→Andromeda→Lattice three-layer diagram** is a practitioner synthesis. Meta's GEM blog doesn't mention Andromeda/Lattice; the Andromeda blog doesn't mention GEM/Lattice. Roles are individually sourced; the *integration diagram* is not from one Meta doc.
4. **The Oct-2025 "7% ROAS drop / 3,014 advertisers / 3.5%→2.9% CVR" study** is single-source agency data; unverifiable and likely confounded by seasonality/iOS. **LOW.**
5. **Global rollout completion date ("October 2025")** is practitioner consensus, not a Meta-published date.
6. **"Fully automated ads by end 2026"** is a reported *plan* (press), not a shipped, GA capability as of mid-2026.
7. **2026 format change dates** (unified 9:16 safe zone ~Mar 2026, Explore retired ~Jan 2026, Flexible Ads removed ~Mar 2026) are agency-reported; not confirmed against Meta's own release notes.
8. **Cost-cap specifics** — widely recommended, but no reliable numbers found.
9. **Caleb Kruse's "Matt Steiner (Meta VP)" attribution** — unverified.

---

## Key sources (with dates)

Primary (Meta):
- Andromeda retrieval engine — Meta Engineering, Dec 2, 2024. https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/
- GEM (Generative Ads Model) — Meta Engineering, Nov 10, 2025. https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/
- Creative Advantage / diversification — Meta for Business. https://www.facebook.com/business/news/the-creative-advantage-unlocking-the-power-of-diversification-with-meta-andromeda
- Aspect ratio best practices — Meta Business Help. https://www.facebook.com/business/help/103816146375741

Practitioners (real spend / credible):
- Common Thread Collective (Andromeda creative strategy). https://commonthreadco.com/blogs/coachs-corner/meta-andromeda-roas-creative-strategy-2026
- Foxwell Digital (quality-over-volume counter-view). https://www.foxwelldigital.com/blog/creative-quality-vs-quantity-why-meta-still-prioritizes-story-over-volume
- Motion — "Winners are rare" benchmark. https://motionapp.com/library/research/creative-benchmarks-2026/winners-are-rare
- Motion — "10 ads vs 100 ads." https://motionapp.com/library/talk/the-new-meta-ads-testing-strategy-10-ads-vs-100-ads/
- adsuploader — Entity IDs vs creative volume (flags unofficial terminology). https://adsuploader.com/blog/meta-andromeda
- RevenueCat — creative volume trap. https://www.revenuecat.com/blog/growth/creative-volume-meta-ad/

Trade / explainer:
- MarTech — "AI is making creative the new targeting." https://martech.org/ai-is-making-creative-the-new-targeting/
- Triple Whale — creative-as-targeting. https://www.triplewhale.com/blog/creative-targeting-ai-driven-delivery
- Benzinga / Marketing Dive — fully automated ads by 2026. https://www.benzinga.com/markets/tech/25/06/45722563/mark-zuckerbergs-meta-to-offer-fully-automated-ai-based-ad-creation-by-2026-report | https://www.marketingdive.com/news/meta-plans-to-enable-fully-ai-automated-ads-by-2026/749613/
- Hunch — DCO 2026 guide. https://www.hunchads.com/blog/dynamic-creative-optimization
- Campaign Builder / Madgicx — Flexible Ads removal 2026. https://www.campaignbuilder.io/blogs/meta-flexible-ads-removed-2026 | https://madgicx.com/blog/flexible-ads-are-replacing-dynamic-creatives
- Jon Loomer — Andromeda explainer (403 on fetch; indexed as credible corroboration). https://www.jonloomer.com/meta-andromeda/
