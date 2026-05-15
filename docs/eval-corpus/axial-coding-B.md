# Axial Coding B — Eval Corpus 2026-05-14

Independent clustering of 16 campaigns (8 PROD + 8 STAGING) into failure modes, positive patterns, and rubric anchors. Type A lens (performance-marketer-for-D2C-founder, not creative-director-for-craft).

---

## Failure Mode Clusters

### 1. Concept-to-Prompt Loss
**Definition:** Selling content (hook headline, CTA, price, sourced numbers) exists in the hook bank or art-direction JSON, but the downstream image prompt drops it and inherits only atmospheric description. Image arrives without the words that close the sale. Style-dependent — atmospheric workflows lose content, typography/infographic workflows preserve it.

**Frequency:** 11 of 16 campaigns (Thewholetruthfoods, Opti, Creat, Twt-2, Traya, Ravilagrandhotel, Staging-Creat, Arjuninfra, Gonoise, Bewakoof, Mamaearth)

**Severity:** Critical — this is the single most-cited failure pattern in the corpus and directly determines whether an output is shippable.

**Examples:**
- Staging-Creat: "Image 1 prompt literally ends with 'No text overlays.' Strips out hook, body, CTA, price, brand identifier. Agent ACTIVELY excludes selling content." (`campaign_mp3zdim0g07tlu`)
- Traya: "CTA 'Discover your root cause' from hook bank is NOT in image prompt. Concept-to-prompt loss strikes again — image gets headline, doesn't get CTA." (`campaign_mniw0gw4pqn6xu`)
- Thewholetruthfoods: "Image 1 ... overlay text decorative not selling — replace with '27g Protein. 1g Sugar. Zero secrets.' and same canvas converts." (`campaign_mp40awylzb2gch`)
- Gonoise: "photorealistic style prompt explicitly says 'No embedded text in image itself' ... THAT POST-OVERLAY STEP DOESN'T EXIST in current product — user gets raw textless image + separate text spec." (`campaign_mnka70u46w19q8`)

---

### 2. Fabricated / Amplified Proof
**Definition:** Agent invents a fact, or takes a sourced number and stretches it into a behavioral claim that isn't in the research. Distinct from honest inference — these are claims a fact-checker would mark false. Carries Meta-ads-policy risk (and regulator risk in fintech / health).

**Frequency:** 7 campaigns (Opti, Twt-2, Traya, Staging-Creat, Theratefinder-Apr30, Arjuninfra, Bewakoof)

**Severity:** Critical — compliance/legal risk on top of trust risk. Higher stakes in fintech and health verticals.

**Examples:**
- Theratefinder (Apr 30): "FABRICATION FOUND IN HOOK 1: '16,000+ Canadians got approved' — research has 856 verified reviews, NOT 16,000+ approvals. Agent invented the number ... Canadian regulatory environment treats this as potential false advertising." (`campaign_moldlidaxv97ly`)
- Opti: "Hook 1 body: 'Glanbia's global quality guarantee' — research explicitly said 'No specific certifications ... visible.' Agent may have fabricated the 'guarantee.' Meta-ads-policy risk + brand-trust risk." (`campaign_mp3q9e5n9d2f81`)
- Twt-2: "'50,000+ people read our published lab reports before buying.' Research only said 50K subscribed to ... NEWSLETTER. Newsletter subscribers ≠ lab-report-readers-before-purchase." (`campaign_mp2lfp269caapa`)
- Staging-Creat: "prompt specifies testimonial quote 'Finally, a brand I can actually trust' (research had no testimonials), '5-star rating with gold stars' ... and 'Glanbia verification badge' (Glanbia doesn't issue a verification badge). Multiple fabricated visual elements." (`campaign_mp3zdim0g07tlu`)

---

### 3. Template-Grade Generic Hook (Swap-Test Fail)
**Definition:** Hook construction works for any brand in the same category — fill in a different brand name and the hook still reads fine. Specific numbers plugged into a generic template count too. The whole construction, not just the data, must be brand-distinctive.

**Frequency:** 9 campaigns (Opti, Ravilagrandhotel, Arjuninfra, Theratefinder-Apr30 Hook 1, Staging-Creat Hook 1, Dailyobjects all hooks, Bewakoof Hook 2, Mamaearth Hook 1, whey-cluster non-Guardian brands)

**Severity:** High — produces "your logo on a competitor's ad" output, founder-visible quality floor.

**Examples:**
- Ravilagrandhotel: "'Premium hotel rooms. 50% less than HITEC City.' — fill in any hotel + any landmark, still works. Template, not signature." (`campaign_mn3egfu1pjxp5r`)
- Arjuninfra: "Hook 1 'Trusted by 4.8 stars. Built for a decade.' — swap test: 'Trusted by [X] stars. Built for [N] years.' applies to any establishment with a rating + years." (`campaign_moo0j70x7xapvv`)
- Dailyobjects: "ALL 3 VISIBLE HOOKS FAIL WHOLE-CONSTRUCTION SWAP TEST: 'Stop choosing between style and protection' (any phone case brand), 'Your $1,000 phone deserves better than a generic case' (any premium case brand) ... None Dailyobjects-distinctive." (`campaign_mnjwlnnlelx5wf`)

---

### 4. Reference Image Ignored / Visual-First Vertical Blocker
**Definition:** User uploaded actual product/space/brand reference photos, but image generation re-renders generic AI versions of the product instead of using the uploads as visual source-of-truth. For verticals where the product IS the conversion lever (hospitality rooms, real estate properties, apparel designs, phone case art), this is product-blocker severity. Sub-pattern: agent doesn't gate or prompt for reference uploads even when the vertical clearly needs them.

**Frequency:** 7 campaigns (Ravilagrandhotel, Staging-Creat, Bewakoof, Dailyobjects, Arjuninfra, whey-cluster all 6, Gonoise)

**Severity:** Critical — same image could be a competitor's ad. Sharper in apparel (Bewakoof) than in hospitality (Ravila).

**Examples:**
- Ravilagrandhotel: "MAJOR FAILURE: user uploaded actual room photos. Agent IGNORED them. Image 1 prompt explicitly says 'no product imagery' ... For a hotel where rooms ARE the product, generic AI rooms = competitor could ship the same image = conversion-killing." (`campaign_mn3egfu1pjxp5r`)
- Bewakoof: "Image 1 prompt says 'a vibrant Bewakoof hoodie or graphic tee' — no reference image uploaded, model invents fake-Bewakoof-style clothing. For apparel specifically, the DESIGN IS the product ... Generic AI hoodie = unusable as Bewakoof ad. This is product-blocker severity." (`campaign_mn308y6w6e43dw`)
- Staging-Creat: "reference images uploaded by user (creat.jpg + opti.jpg) are not deployed — agent generates a generic gym scene with athlete drinking 'protein shake' (no specific brand product)." (`campaign_mp3zdim0g07tlu`)

---

### 5. CTA / Funnel Mismatch
**Definition:** CTA is either soft and exploratory ("See your options," "See the difference"), or it references a mechanism the brand or the platform doesn't actually have (Meta ad with "Set a reminder now" for app-first brand). Includes "researcher's proof vs. buyer's proof" framing — leading with a fact the audience doesn't recognize as a buying signal (Glanbia for Indian gym-goers).

**Frequency:** 8 campaigns (Thewholetruthfoods, Opti, Creat, Twt-2, Theratefinder-Apr30, Arjuninfra Hook 1, Bewakoof, Gonoise)

**Severity:** High — directly suppresses click-through and downstream conversion even when hook and visual are strong.

**Examples:**
- Bewakoof: "Hook 1 CTA 'Set a reminder now' is brand-mechanism-clever but channel-mismatched. Meta ads don't have native reminder-set functionality ... agent generates CTAs that match brand-mechanism but not always platform-mechanism." (`campaign_mn308y6w6e43dw`)
- Creat: "this is a distinct failure mode from fabrication: 'researcher's proof vs. buyer's proof.' Claim is sourced + accurate, but doesn't resonate because the audience doesn't recognize the credibility source." (`campaign_mp2v002v6n7lb4`)
- Thewholetruthfoods: "Hook 1 CTA 'See what's inside' is mushy — fails action-specificity test. Should be 'Compare ingredients with your current protein' or 'See the lab reports.'" (`campaign_mp40awylzb2gch`)

---

### 6. Wrong-Brand / Research-Pipeline Catastrophe
**Definition:** Research stage produces output that targets the wrong brand, wrong locale, or misses signals so severely that everything downstream is built on a broken foundation. Includes: domain-redirect blindness, currency/locale leakage, page-dependent identity drift, thin-research fallback to category templates, and price-parsing bugs. Distinct from fabrication — here the agent is faithfully serving the wrong source-of-truth.

**Frequency:** 6 campaigns (Mamaearth, Dailyobjects, Verbisedu C7 vs C6, Twt-2 vs Twt-1, Gonoise price-parse, Ravilagrandhotel — research had specifics that never landed)

**Severity:** Critical — Mamaearth case is unshippable under any condition; locale and identity errors cannot be patched at the hook layer.

**Examples:**
- Mamaearth: "WRONG-BRAND VIA DOMAIN REDIRECT: User typed mamaearth.in → site redirected to mamaearth.com (different brand) → research extracted from US Mamaearth ... all downstream output targets wrong brand. Indian Mamaearth ... is one of India's LARGEST D2C beauty brands. US Mamaearth.com is essentially unknown." (`campaign_mn4ogmsbujom9y`)
- Dailyobjects: "CURRENCY/LOCALE MISMATCH: Hook 2 'Your $1,000 phone deserves better than a generic case' — agent used USD framing for Indian brand ... Research correctly identified Indian ICP and ₹ context, hook leaked Western dollar reference." (`campaign_mnjwlnnlelx5wf`)
- Verbisedu pair: "Same brand → page-dependent research → different output. New observation: which page the user pastes matters more than the brand. Brand colors detected differently across the two runs (Navy+Orange here vs Dark Teal in campaign 6) — page-dependent color extraction." (`campaign_mn4fy5gosonhqt` vs `campaign_mn7az22inyrf68`)

---

### 7. Image Over-Generation Without Strategic Variety
**Definition:** Agent ships more images than the brief requested (4–8 for "two ads"), but the extras are visual variants — lighting / composition / background swaps — not distinct conversion-angle variants. Founder receives no "ship these two" instruction. Compounds with hook-template-clustering: same angle visualized many times.

**Frequency:** 6 campaigns (Creat 7-for-2, Twt-2 4-for-2, Gonoise 4-for-2, Dailyobjects 8-for-2, Staging-Creat, Theratefinder Mar 6-for-2)

**Severity:** Medium — not a per-ad blocker, but a workflow / deliverable-clarity gap that erodes founder trust and obscures which output is "the answer."

**Examples:**
- Dailyobjects: "8 IMAGES SHIPPED FOR '2 ADS' — worst over-generation in corpus. Image indices go 1-6 + 9-10 ... Founder receives 8 phone case images, no clear 'ship these two' instruction." (`campaign_mnjwlnnlelx5wf`)
- Creat: "7 images for 'two ads' requested: confusing as a deliverable to a founder ... Image variants don't represent angle variety — they're visual minor variations on the same 2 hooks. Type A wants angle variants (different conversion levers) not lighting variants." (`campaign_mp2v002v6n7lb4`)
- Twt-2: "4 images shipped for 'two ads' requested — over-generation pattern (same as campaign 3's 7-for-2)." (`campaign_mp2lfp269caapa`)

---

## Positive Patterns

### P1. Content-Preserving Style (Typography / Infographic)
**Frequency:** 3 campaigns (Verbisedu C7, Staging Twt-1 base-quality, Staging Theratefinder-Mar)
- Per-style proof that the agent CAN produce verbatim hook + CTA + hex colors + placement zones when the workflow is typography-dominant or infographic-data. Counter-evidence to the universal "concept-to-prompt loss" framing.

### P2. Conversion-Mechanism Reading
**Frequency:** 5 campaigns (Traya "Take the Hair Test," Verbisedu C7 "Find Your Exam Match," Theratefinder "Start my deal," Arjuninfra Hook 2 "Schedule a transparent walkthrough," Bewakoof Hook 1 14:00 drop ritual)
- Agent reads the brand's actual top-of-funnel mechanic from the site and mirrors it as the CTA. Strongest when brand has explicit quiz/test/audit/booking funnels.

### P3. Brand-Voice Fidelity When Sourced Phrases Available
**Frequency:** 3 campaigns (Twt-2 "zero secrets" / "imperfect packaging," Traya "root cause," Verbisedu C7 named trainers/students)
- When research surfaces actual brand vocabulary or named customers, the agent deploys them verbatim and the hook stops sounding category-generic.

### P4. Agent Self-Check Capability Evolution
**Frequency:** 3 campaigns (Theratefinder-Apr30 logo-swap check, Theratefinder-Mar art-direction reasoning JSON, Gonoise structured `textOnImage` field)
- Recent campaigns show meta-instructions ("Logo swap check: Could competitors use?") and structured text-on-image specs appearing in the agent's own prompts. Capability is emerging unevenly across runs.

### P5. Sourced-Number-in-Headline Construction
**Frequency:** 4 campaigns (Creat Hook 2 "₹549," Gonoise "15 days," Guardian "5.5g BCAAs," Theratefinder-Mar Hook 2 "856 people / 48 hours")
- When the agent puts a research-sourced concrete number in the headline (not buried in body), the result reliably passes the swap test and reads conversion-grade.

---

## Anchors

### PASS Anchor 1 — Staging Twt-1 (`campaign_mosi22bwouky66`)
"Add muscle, not ingredients." Image 4 is the single highest-quality output in the corpus. Hook verbatim on canvas, CTA "Build with clean protein" rendered, actual TWT product (reference deployed), "30g protein per serving" callout, gym context, clean hierarchy, mobile-safe zones, intent line in prompt ("This is the ad for people who want real results without compromise."). Every Type A element present. This is the Q3 SUCCESS PASS rubric anchor.

### PASS Anchor 2 — Staging Theratefinder-Mar (`campaign_mn9ulfufiarpro`)
Co-base-quality benchmark. Two production-grade images: typography-dominant "BANKS SAID NO. WE CLOSED IN 24 HOURS." with orange pill CTA, plus the most information-dense ad in corpus with real 856 reviews, 350+ lenders icon grid, green pill CTA "FIND YOUR LOAN NOW," and first-in-corpus compliance badges ("NO CREDIT SCORE IMPACT TO CHECK"). Proves agent ceiling is high when brief specificity + iteration + content-preserving styles all align.

### FAIL Anchor — Staging Mamaearth (`campaign_mn4ogmsbujom9y`)
Wrong-brand via domain redirect. User asked for Indian Mamaearth (Honasa Consumer, NSE-listed, "Made Safe" certified, Onion Hair Oil hero SKU). Agent built campaign for US Mamaearth.com (different brand, essentially unknown). Cascade: wrong research → generic clean-beauty hook → art-direction concept uses a hook NOT in the hook bank → shipped image matches neither. Trademark/legal risk. Unshippable under any condition. Highest-severity failure mode in entire corpus.

Runner-up FAIL: Staging-Creat (`campaign_mp3zdim0g07tlu`) — "No text overlays" explicit instruction in prompt, fabricated testimonial + fake rating + fake Glanbia verification badge, reference images ignored. Worst single concept-to-prompt loss + worst single fabrication case combined.

---

## Miscellaneous Notes (Not Clustered)

- **DB schema mismatch:** `campaign_images.hook_type` column persistently labels hooks as ("stat", "story") regardless of actual hook construction (Opti, Staging Twt-1, Gonoise). Engineering ticket, not a creative failure mode.
- **Operational reliability:** Opti and Creat both had silent first-generation failures inferred from transcript ("scrapped that one — send a new idea"). Separate from creative quality.
- **Power-user behavior in staging:** Three distinct power-user patterns observed (`user_3D4PSv...` whey/fintech competitive analysis, `user_3ANzBpk1Wd...` brand testing + agent-poking, `user_38uxIJ...` consumer electronics specs). May not represent typical founder use case — bias risk in corpus interpretation.
- **Follow-up count is not a clean dissatisfaction signal:** Verified across Opti (3 turns = real complaint), Creat (7 turns = mixed inspection + exploration), Verbisedu C6 (6 turns = 1 complaint + later engagement check-ins), Theratefinder-Mar (9 turns = productive iteration to ship quality). Count alone misleads — transcript verification required.
- **Vertical-specific rubrics needed:** SaaS, real estate (Arjuninfra), fintech (Theratefinder), apparel (Bewakoof), consumer electronics (Gonoise), hospitality (Ravila) each surface vertical-specific conversion levers (RERA, compliance badges, design uniqueness, spec-driven, room photos) that a universal rubric misses.
