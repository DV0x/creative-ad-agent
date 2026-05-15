# Axial Coding — Eval Corpus 2026-05-14

Source: `eval-notes-2026-05-14.md` (16 campaigns: 7 prod + 9 staging).
Lens: Type A (performance marketer reviewing for D2C founder client).

---

## Failure Mode Clusters

### 1. Concept-to-Prompt Loss
**Definition:** Hook bank contains real selling content (verbatim headline, CTA, price, social-proof number), but the image-generation prompt drops the structure and inherits only atmospheric description ("authentic feel," "subtle indicators"). Selling content stays in text and never reaches the canvas. Style-dependent — typography-dominant and infographic-data styles preserve content; product-on-gradient, lifestyle-render, photorealistic, and UGC-aesthetic-static styles strip it.

**Frequency:** 11 campaigns
(TWT C1, Opti C2, Creat C3, Twt-2 C4, Traya C5, Ravila C7, Staging-Creat, Arjuninfra, Theratefinder Apr-30, Gonoise, Bewakoof)

**Severity:** CRITICAL — single largest driver of "unshippable" verdicts and direct user complaints across the corpus.

**Verbatim examples:**
- "IMAGE 1 PROMPT IS THE WORST CONCEPT-TO-PROMPT LOSS IN CORPUS: prompt literally ends with 'No text overlays.' Strips out hook, body, CTA, price, brand identifier. Agent ACTIVELY excludes selling content." (Staging-Creat, `campaign_mp3zdim0g07tlu`)
- "Hook bank has selling content (CTAs, headlines, social proof numbers, brand-voice copy). Image prompts inherit only atmosphere ('authentic, user-generated feel'). The selling content stays in text, never makes it to canvas." (Twt-2, `campaign_mp2lfp269caapa`)
- "Image 2 'Traya branded' bottle … CTA 'Discover your root cause' from hook bank is NOT in image prompt. Concept-to-prompt loss strikes again — image gets headline, doesn't get CTA." (Traya, `campaign_mniw0gw4pqn6xu`)

---

### 2. Fabrication & Narrative Amplification
**Definition:** Agent invents a fact, behavior, or visual element that the research did NOT surface — most commonly by taking a real number and inventing a bigger behavioral story around it (newsletter subs → "read lab reports"; 856 reviews → "16,000+ approved"; Glanbia parent → "global quality guarantee"). Includes fabricated testimonial quotes, fake ratings, fake verification badges, and invented value props.

**Frequency:** 9 campaigns
(Opti C2, Twt-2 C4, Traya C5, Staging-Creat, Arjuninfra, Theratefinder Apr-30, Mamaearth wrong-brand, Bewakoof, TWT-cluster)

**Severity:** CRITICAL — Meta/FCAC/FSRA compliance risk; trademark exposure in worst case (Mamaearth). User-facing trust risk if fake reviews surface.

**Verbatim examples:**
- "FABRICATION FOUND IN HOOK 1: '16,000+ Canadians got approved' — research has 856 verified reviews, NOT 16,000+ approvals. Agent invented the number." (Theratefinder, `campaign_moldlidaxv97ly`)
- "IMAGE 2 FABRICATED CONTENT: prompt specifies testimonial quote 'Finally, a brand I can actually trust' (research had no testimonials), '5-star rating with gold stars'… and 'Glanbia verification badge' (Glanbia doesn't issue a verification badge)." (Staging-Creat, `campaign_mp3zdim0g07tlu`)
- "Hook 1 body: 'Glanbia's global quality guarantee' — research explicitly said 'No specific certifications, athlete partnerships, or public testimonials visible.' Agent may have fabricated the 'guarantee.'" (Opti, `campaign_mp3q9e5n9d2f81`)

---

### 3. Generic / Template Hook Construction
**Definition:** The whole hook construction (not just the brand name slot) is reusable for any brand in the same vertical — passes specific-data-point check but fails whole-construction swap test. Includes category templates ("Premium style. Non-premium prices."), researcher's-proof framing that doesn't resonate with buyers (Glanbia for Indian gym-goers), and hook-template clustering within a vertical (anti-counterfeit recycled across whey brands).

**Frequency:** 9 campaigns
(Opti C2, Ravila C7, Staging-Creat, Arjuninfra, Theratefinder Apr-30, Dailyobjects, Bewakoof, TWT-cluster, Mamaearth)

**Severity:** HIGH — primary "would not ship" trigger when not compounded with image failure; founder-perceived as competitor's-ad-with-logo-swapped.

**Verbatim examples:**
- "Hook 1 'Trusted by 4.8 stars. Built for a decade.' — swap test: 'Trusted by [X] stars. Built for [N] years.' applies to any establishment with a rating + years. Template construction with numbers plugged in. NOT Arjun-specific." (Arjuninfra, `campaign_moo0j70x7xapvv`)
- "All 3 hooks are TEMPLATE constructions for 'premium-business-hotel-near-tech-corridor' category, not Ravila signatures … 'Premium hotel rooms. 50% less than HITEC City.' — fill in any hotel + any landmark, still works." (Ravila, `campaign_mn3egfu1pjxp5r`)
- "Gym-goers know 'Optimum Nutrition' not 'Glanbia plc.' … Agent treats sourcedness as sufficient — Type A treats audience-recognition as the actual bar." (Creat, `campaign_mp2v002v6n7lb4`)

---

### 4. Reference Image Ignored / Absent for Visual-First Verticals
**Definition:** When the product/space/garment IS the conversion lever (hotel rooms, real-estate, apparel, phone cases, supplements with distinctive packaging), agent either (a) ignores uploaded reference images and generates from text descriptions, or (b) doesn't gate the workflow to require references for visual-first verticals. Result: generic AI-rendered product indistinguishable from competitors.

**Frequency:** 8 campaigns
(Twt-2 C4, Ravila C7, Staging-Creat, Arjuninfra, Gonoise, Dailyobjects, Bewakoof, whey cluster — 6 brands no refs)

**Severity:** CRITICAL — product-blocker level for apparel/hospitality/real-estate where the product appearance IS the brand differentiator. Trust-killing for hotels (user explicitly flagged).

**Verbatim examples:**
- "MAJOR FAILURE: user uploaded actual room photos. Agent IGNORED them. Image 1 prompt explicitly says 'no product imagery'… For a hotel where rooms ARE the product, generic AI rooms = competitor could ship the same image = no brand differentiation = conversion-killing." (Ravila, `campaign_mn3egfu1pjxp5r`)
- "APPAREL INTENSIFICATION OF REFERENCE-IMAGE-IGNORED FAILURE MODE: Image 1 prompt says 'a vibrant Bewakoof hoodie or graphic tee' — no reference image uploaded, model invents fake-Bewakoof-style clothing… product-blocker severity, sharper than hospitality (Ravila) or real-estate (Arjun) versions." (Bewakoof, `campaign_mn308y6w6e43dw`)
- "reference images uploaded by user (creat.jpg + opti.jpg) are not deployed — agent generates a generic gym scene with athlete drinking 'protein shake' (no specific brand product). Reference-image-ignored failure mode confirmed again." (Staging-Creat, `campaign_mp3zdim0g07tlu`)

---

### 5. Soft / Channel-Mismatched CTA
**Definition:** CTA is exploratory ("See your options," "See the difference," "See what's inside") instead of action-driving, OR it matches a brand-mechanism but not the platform mechanism (e.g., "Set a reminder" for a Meta paid ad, "See verified options" instead of brand's actual "Apply Now" funnel CTA). Misses the brand's own conversion architecture even when research surfaces it.

**Frequency:** 8 campaigns
(TWT C1, Opti C2, Creat C3, Arjuninfra, Theratefinder Apr-30, Dailyobjects, Bewakoof, Gonoise)

**Severity:** HIGH — directly suppresses click-through; the cheapest single fix-surface in the rubric.

**Verbatim examples:**
- "Hook 1 CTA 'Set a reminder now' is brand-mechanism-clever but channel-mismatched. Meta ads don't have native reminder-set functionality… agent generates CTAs that match brand-mechanism but not always platform-mechanism." (Bewakoof, `campaign_mn308y6w6e43dw`)
- "Hook 1 CTA 'See verified options' is actually decent… [but] Hook 2 'See your options' is mushy." (Opti C2 / Creat C3)
- "Hook 1 CTA 'Trusted by 4.8 stars. See what 4.8 stars looks like' — clever wordplay but soft. Compare to brand's actual site CTA 'Schedule Site Visit' which is high-intent. CTA doesn't match brand's actual conversion funnel." (Arjuninfra, `campaign_moo0j70x7xapvv`)

---

### 6. Research Pipeline Errors (Wrong-Brand, Page-Dependent, Parsing)
**Definition:** Research stage produces input that is wrong, locale-mismatched, or page-dependent. Includes domain-redirect catastrophes (Indian → US brand), URL-page-dependent identity capture (same brand → different colors/angle), currency localization leaks (USD framing for Indian D2C), price-parsing errors (₹6,999 → ₹699,900), and thin-research scenarios where hooks collapse to category templates.

**Frequency:** 6 campaigns
(Mamaearth wrong-brand, Verbisedu C6 vs Verbisedu C5b page-dependent, Dailyobjects USD + thin, Gonoise price parse, Ravila color-extract, TWT color-extract)

**Severity:** CRITICAL when it cascades (Mamaearth = trademark risk + entire campaign unusable); HIGH-to-MEDIUM otherwise.

**Verbatim examples:**
- "NEW HIGH-SEVERITY FAILURE MODE — WRONG-BRAND VIA DOMAIN REDIRECT: User typed mamaearth.in → site redirected to mamaearth.com (different brand) → research extracted from US Mamaearth… all downstream output targets wrong brand." (Mamaearth, `campaign_mn4ogmsbujom9y`)
- "NEW FAILURE MODE — CURRENCY/LOCALE MISMATCH: Hook 2 'Your $1,000 phone deserves better than a generic case' — agent used USD framing for Indian brand. Dailyobjects is Indian D2C (₹ pricing)." (Dailyobjects, `campaign_mnjwlnnlelx5wf`)
- "Brand colors detected differently across the two runs (Navy+Orange here vs Dark Teal in campaign 6) — page-dependent color extraction. Same brand, two visual identities. Founder would be confused." (Verbisedu, `campaign_mn4fy5gosonhqt`)

---

### 7. Workflow / Deliverable Confusion (Over-generation, Pipeline Misalignment, Style-Workflow Split)
**Definition:** Agent produces output that confuses the founder as a deliverable — over-generates images without strategic angle variety (7 or 8 images for "2 ads"), produces hook-bank / art-direction / image-prompt that point to three different angles within one campaign, or generates "image foundations" expecting a post-overlay step that doesn't exist in the product (photorealistic style → textless image + separate textOnImage JSON).

**Frequency:** 7 campaigns
(Creat C3 7-for-2, Twt-2 C4 4-for-2, Staging-Creat, Gonoise 4-for-2, Dailyobjects 8-for-2, Mamaearth pipeline misalign, Theratefinder Mar-19 6-for-2)

**Severity:** MEDIUM — doesn't break a single creative but erodes founder trust in the deliverable and hides the strongest two angles inside a pile.

**Verbatim examples:**
- "8 IMAGES SHIPPED FOR '2 ADS' — worst over-generation in corpus. Image indices go 1-6 + 9-10… Founder receives 8 phone case images, no clear 'ship these two' instruction." (Dailyobjects, `campaign_mnjwlnnlelx5wf`)
- "PIPELINE-LEVEL OBSERVATION: hook bank ≠ art direction ≠ image. Three different hooks/angles across the 3 pipeline stages in this single campaign." (Mamaearth, `campaign_mn4ogmsbujom9y`)
- "photorealistic style prompt explicitly says 'No embedded text in image itself - design should accommodate overlaid copy.' Image generated without text. textOnImage fields presumably for a post-overlay step. THAT POST-OVERLAY STEP DOESN'T EXIST in current product — user gets raw textless image + separate text spec. Founder-deliverable gap." (Gonoise, `campaign_mnka70u46w19q8`)

---

## Positive Patterns

### P1. Brand Voice & Conversion-Mechanism Fidelity
Agent CAN read the brand's actual conversion architecture and pick CTAs that match the on-site funnel (Traya "Take the Hair Test," Theratefinder "Start my deal," Verbisedu "Find Your Exam Match," Arjuninfra "Schedule a transparent walkthrough"). Correlates with brands that have clear quiz/test/audit/lead-gen funnels.
**Frequency:** 5 campaigns (Traya, Theratefinder x2, Verbisedu C5b, Arjuninfra partial)

### P2. Sourced-Not-Fabricated Proof Deployment
When research surfaces hard specifics, agent CAN deploy them clean: real testimonial customer names (Verbisedu — Anurag, Taran, gauhar), real case studies (Theratefinder Oshawa deal $547.5K), real sourced numbers (Guardian 5.5g BCAAs, Optimum ₹489/₹3,949/₹8,999 price tiers).
**Frequency:** 5 campaigns (Verbisedu C5b, Theratefinder Mar-19, Guardian, Twt-2 partial, Gonoise 15-day battery)

### P3. Pattern-Interrupt + Specific-Number Hook Construction
Strongest hooks in the corpus share: pattern-interrupt sentence fragment + specific number + brand-anchored mechanism. Examples: Gonoise "Your watch dies. Mine lasts 15 days.", Guardian "5.5g BCAAs per scoop stops muscle breakdown before it starts.", Theratefinder "Banks take weeks. We close your mortgage in 48 hours."
**Frequency:** 4 campaigns (Gonoise, Guardian, Theratefinder Mar-19, Twt-2 staging)

### P4. Content-Preserving Image Styles (Typography-Dominant + Infographic-Data)
Two of the 14 art styles preserve hook content end-to-end: typography-dominant (Verbisedu C5b, TWT staging C2 Image 4) and infographic-data (Theratefinder Mar-19 Image 2). They produce structured prompts with verbatim hook/CTA + placement zones + hex colors + composition spec.
**Frequency:** 3 campaigns (Verbisedu C5b, TWT staging, Theratefinder Mar-19)

### P5. Emerging Capability Evolution (Self-Check, Compliance Badges, Structured textOnImage)
Three new capabilities appeared in the corpus that didn't exist in older campaigns: (1) logo-swap-check meta-instruction inside image prompts (Theratefinder), (2) fintech compliance badges "No credit score impact" + "Secure & Private" rendered on canvas (Theratefinder Mar-19), (3) structured `textOnImage` JSON field separating hook/CTA/placement from atmosphere (Gonoise). Agent's ceiling is rising; default doesn't trigger consistently.
**Frequency:** 3 campaigns (Theratefinder x2, Gonoise)

---

## Anchor Examples

### PASS Anchor #1 — TWT staging (`campaign_mosi22bwouky66`) — "Add muscle, not ingredients."
> "First image in entire corpus where ALL of these hit at once: hook headline rendered verbatim on canvas, CTA 'Build with clean protein' rendered ON CANVAS — first time in corpus, ACTUAL TWT product shown not generic protein tub (reference image deployed), '30g protein per serving' callout visible on product, gym context supports muscle hook, clean hierarchy hook→CTA→product, brand voice match, text rendering is crisp + legible."

THE FULL PROMPT is the gold-standard structure: verbatim hook + verbatim CTA + placement zones + concrete colors + composition + safe zones + a closing intent line ("This is the ad for people who want real results without compromise."). Reached after 7 turns of user iteration — the ceiling is high; the floor isn't.

### PASS Anchor #2 — Theratefinder staging (`campaign_mn9ulfufiarpro`) — "Banks said no. We closed in 24 hours."
> "★★★ CO-BASE-QUALITY BENCHMARK… 2 production-grade images that may be the highest-quality output in entire corpus. Image 1 typography-dominant 'BANKS SAID NO. WE CLOSED IN 24 HOURS.' massive crisp typography on teal-to-navy gradient … ORANGE PILL CTA BUTTON 'Get Your Answer →'. Genuinely shippable as Meta ad with zero post-production. Image 2 MOST INFORMATION-DENSE AD IN CORPUS … FIRST-IN-CORPUS COMPLIANCE BADGES 'SECURE & PRIVATE. NO CREDIT SCORE IMPACT TO CHECK.'"

Real 856 reviews (sourced), real Oshawa case study, 6 distinct angles with real variety. Same brand as the Apr-30 FAIL example — proves the variance is causal (brief specificity + iteration depth + content-preserving style), not random.

---

### FAIL Anchor — Mamaearth staging (`campaign_mn4ogmsbujom9y`)
> "VERDICT: CRITICAL FAILURE — wrong brand entirely. User asked for Indian Mamaearth (mamaearth.in), agent built campaign for US 'Mamaearth.com' (different brand, domain redirect). Could not ship under any condition. Highest-severity failure mode in entire corpus so far."

Cascade: research → wrong brand → hooks generic to wrong framing → art direction generates a hook NOT IN the hook bank → image is a third different angle. Single campaign demonstrates research-pipeline failure + pipeline-internal misalignment + trademark/compliance exposure. Worst-case anchor.

(Honorable mention: Ravila Grand Hotel `campaign_mn3egfu1pjxp5r` — compound failure of generic hooks + reference-images-ignored, flagged by user as unshippable.)

---

## Miscellaneous (didn't force-fit into clusters)

- **DB schema bug — `campaign_images.hook_type` column mismatch.** Says (stat, story) but actual hooks are (Direct Address, Contrast / curiosity-labeled-as-benefit-first). Recurs across corpus. Engineering ticket, not a creative failure.
- **First-generation silent crash / reliability gap.** Opti C2 turn 1 — agent crashed and recovered with "scrapped that one." Observed but isolated.
- **Power-user behavioral segments emerging in staging traffic.** Three patterns: whey/fintech competitive analysis (`user_3D4PSv`), consumer electronics spec testing (`user_38uxIJ`), brand-poking with mixed real briefs (`user_3ANzBpk1Wd`). Useful for product instrumentation, not a failure mode per se.
- **Follow-up count is not a clean failure signal.** Verified across multiple campaigns: high turn counts conflate real complaints, inspection questions, and engaged exploration. Need transcript verification, not counts alone.
- **Vertical-specific rubrics needed.** SaaS, real-estate, fintech, apparel, hospitality, consumer-electronics all surfaced different conversion levers in this corpus. Single Type A rubric is insufficient — fork required.

---

## Cluster Summary Table

| # | Cluster | Freq | Severity |
|---|---|---|---|
| 1 | Concept-to-Prompt Loss | 11 | Critical |
| 2 | Fabrication & Narrative Amplification | 9 | Critical |
| 3 | Generic / Template Hook Construction | 9 | High |
| 4 | Reference Image Ignored / Absent | 8 | Critical |
| 5 | Soft / Channel-Mismatched CTA | 8 | High |
| 6 | Research Pipeline Errors | 6 | Critical-to-Medium |
| 7 | Workflow / Deliverable Confusion | 7 | Medium |

Top three fix surfaces, ranked by frequency × severity: **(1) per-art-style prompt-construction workflows** (fixes Cluster 1 directly + reduces Cluster 4 partially); **(2) research-pipeline hardening** (fixes Cluster 6 wrong-brand + thin-research + parsing; reduces Cluster 2 fabrication by widening sourced-fact pool); **(3) hook-rubric enforcement at orchestrator level** (fixes Cluster 3 swap-test + Cluster 5 CTA-funnel-mismatch).
