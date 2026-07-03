# Ingestibles — per-format VISUAL playbook (the "how it looks" layer)

**Built from:** 262 unique competitor creatives (175 India + 87 USA, 16 brands), each vision-read for layout / type / imagery / product-handling / palette / text-density and — the payload — **how the copy's angle is rendered as a picture.** Source: Meta Ad Library, pulled 2026-06-16.

**Read alongside:**
- `index.html` — the side-by-side gallery (creative · copy · visual read), filterable by format/market. **Open this to see every example.**
- `analysis.json` — the raw per-image reads (keyed by image id).
- `../FORMAT-REPERTOIRE.md` — the 23-format copy/angle list. This doc is its missing visual half.
- `HOOK-BANK-AND-CENSUS.md` (in the `ingestibles-deep-*` folder) — the copy/hook half.

> **Why this exists.** We've had the *copy* half of each format (the angle, the hook). We never had the *look* half — and you can't build a format from an angle alone. This turns "founder-POV" or "science" from a label into a buildable picture: where the product sits, how the headline is set, what the background is, what visual move carries the claim.

---

## 0. The one finding that frames everything: the IN/US split is a VISUAL split

It's not just different copy — the two markets build the *picture* differently, and the format counts prove it:

| Leans **India** (benefit-first) | count IN:US | Leans **USA** (brand-first) | count IN:US |
|---|---|---|---|
| offer-discount | 30 : 1 | flavor-culture | 4 : 13 |
| catalog-DPA | 17 : 2 | lifestyle | 15 : 26 |
| bundle | 14 : 1 | new-launch | 12 : 26 |
| science | 13 : 2 | subscription | 0 : 3 |
| us-vs-them | 13 : 4 | meme | 0 : 2 |
| PAS, hero-product, sampler, listicle, founder-POV | **IN-only** | | |

**India = prove the health, stack the value.** Claims, prices, badges, and numbers live *on the image*. Text density: moderate-to-heavy. The picture argues.

**USA = sell the brand, hide the work.** Clean creatives, the health benefit as background, the product often *not even shown* in the frame (the can lives inside a flavor-world; the launch is a Target storefront). Text density: none-to-minimal. The picture seduces.

**Templating rule for our system:** when the brief is an Indian ingestible → default to benefit-first construction (claim/number/price on-image). When it's a US-style functional beverage → default to brand-first (clean, mood, benefit demoted). The *format* is the same; the *dial* on text-density and claim-prominence flips by market.

> **DCO ≠ bare product.** 61% of these ads are delivered as "DCO," but most MuscleBlaze/Sleepy Owl "DCO" creatives are **fully designed statics** (price badges, benefit icons, headlines) — DCO is just the *delivery slot*. The truly bare product-on-white shots are **DPA** (catalog). So our designed statics ARE what feeds a DCO slot; only DPA wants the naked pack.

---

## 1. Cross-cutting visual moves (transfer across formats — encode these first)

These recurred across many formats. They're the highest-leverage primitives because one move serves several formats.

1. **The human IS the headline (no product in frame).** PAS and UGC hooks open on a person in the problem-state (head-clutching, hollow-eyed in a duvet, exhausted at a clinic). The picture says "are you stressed?" so the copy doesn't have to. Product enters later/beside as the calm answer. *(Wellbeing `e10fefebccb2`, `f13748b65b3c`)*

2. **The pack/label IS the ad.** Transparency brands print the whole argument on the package and shoot it with zero overlay — the on-label sentence becomes the headline. Zero production cost; only works when the label is the brand's whole pitch. *(The Whole Truth `188f1e08495b`; every MuscleBlaze DPA)*

3. **Claim-as-visual-proof, not claim-as-text.** Don't *write* "75 ingredients" — flat-lay all 75. Don't *write* "natural" — splash the fruit out of the pack. Don't *write* "tastes like cold coffee" — splash cold coffee around it. The proof is photographed, not stated. *(AG1 ingredient flat-lay `59c95ca28ca2`; OZiva ingredient splash; Wellbeing flavor splash)*

4. **Price-before-product eye-path.** Offer ads put the discount badge *above/left* of the pack so the eye lands on value first, product second. Strikethrough MRP + bright contrast replacement price + % burst. *(MuscleBlaze offer cluster)*

5. **Stat boxes anchored to the in-hand product.** Floating "15g PROTEIN / 2 ESPRESSO SHOTS" boxes pinned *to the glass being held* read as labels-in-context, not generic callouts. *(Sleepy Owl `stat` cluster)*

6. **Two-zone split: aspiration on top, transaction below.** Celebrity/ambassador ads put the famous faces (RCB cricketers, athletes) in the top half and hard-cut to a brand-color price/CTA block below. Emotion and conversion in one frame, cleanly separated. *(Optimum Nutrition RCB cluster)*

7. **Show the exact count.** Sampler/trial ads show *exactly* the number of SKUs in the offer (3 bags fanned, 5 sachets) — visual proof of "variety" with no bullet points. *(Blue Tokai sampler cluster)*

8. **Retailer-as-credibility (US).** No product at all — just the Target storefront at a low hero angle. Mass-retail availability *is* the flex. Only works when distribution is itself the status signal. *(AG1 `b4e12f25f174`)*

9. **Flavor-world (US bev).** Submerge the can inside a 3D/illustrated universe built from its own flavor (sherbet landscape, botanical bloom). Zero text. The image is the claim; works only when the flavor name is the whole story. *(OLIPOP cluster)*

10. **Open-loop / pattern-interrupt typography.** A single mid-sentence word ("First," / "This") or a struck-through belief ("NOT just muscle gains") as the only overlay forces the scroll to stop. *(ON `26d...`, Wellbeing torso `First,`)*

---

## 2. Per-format visual recipes

Grouped into three families by **consideration level** (the routing rule: low-consideration/commerce → desire; trust-gated → efficacy). Each recipe = the buildable spec + reference ids (find them in `index.html`).

### Family A — EFFICACY / TRUST formats (the India workhorses; trust-gated buys)

**`science` (15 · IN 13:2)**
- **Look:** clean light/pastel bg; pack right-of-center; **3 clinical % numbers stacked down the left rail, ascending impact** (21% → 69% → 86%); ingredients/capsules spilled at the base.
- **Type:** big serif or heavy sans headline top-left; numbers are the second-biggest element.
- **Build it:** light bg → pack right → left-rail of 2-4 hard numbers (name the *molecular form*: "bis-glycinate," not "type of magnesium") → spill the actual ingredient near the pack. Add a giant problem-word in maroon/dark top-left if fusing with PAS.
- **Refs:** Wellbeing `science you can see` (clinical %), OZiva 3-in-1 magnesium, Wellbeing fish-oil scoreboard (`0 fishy burps` stat kills the #1 objection).

**`PAS` (10 · IN-only)**
- **Look:** a real person in the problem-state fills 50-60% of frame; bold black problem-headline top-left; product enters small, beside, as the answer.
- **Build it:** photograph the *feeling* (exhausted/in-pain), not the product. Headline = the question the face already asks. Product + CTA bottom corner. Optionally add 2 floating ingredient labels for a science credibility layer.
- **Refs:** Wellbeing duvet-woman `f13748b65b3c`, head-clutch man `e10fefebccb2`, OZiva "Skip the Bloating Drama."

**`us-vs-them` (17 · IN 13:4)**
- **Look:** two routes — (a) **comparison table** (5 rows, your column colored vs competitor grey, each row a *felt pain* not a spec); (b) **"X without Y" headline** that names the enemy (caffeine crash) with the product as the fix.
- **Build it:** for the table, anchor each row to a pain ("no chalky texture" > "low maltodextrin"). For the headline route, structure as "everything you want, minus the one thing you fear," two-line color-coded (white = familiar, yellow = the benefit).
- **Refs:** Yogabar 5-row table `f9aab774d715`, Magic Spoon split scorecard (same bowl spans both halves), Sleepy Owl "WITHOUT THE CRASH."

**`what's-inside` (6 · IN 5:1)**
- **Look:** the pack's own flavor-strip/label turned to camera does the inventory; OR the product is *replaced* by a flat-lay of all its ingredients.
- **Build it:** if the label is strong, shoot it label-forward, zero overlay (transparency play). If the claim is "N ingredients," lay out all N. Skateboard/prop shortcut signals lifestyle without a person.
- **Refs:** AG1 75-ingredient flat-lay `59c95ca28ca2`, TWT on-label-sentence `188f1e08495b`.

**`stat` (7 · IN 6:1)**
- **Look:** one hero number in a high-contrast (usually yellow) box is the anchor; secondary stats as smaller badges; product in-hand beside it.
- **Build it:** pick ONE number to be huge; pin it to the in-hand product as a label; stack social-proof badges (★ "10,000+ sold," "Amazon's Choice") around it. Mirror the stat-box count to the claim ("double duty" → exactly 2 boxes).
- **Refs:** Sleepy Owl `15g/2 shots`, OZiva `25g + 10,000+ sold`.

**`hero-product` (9 · IN-only)**
- **Look:** product dead-center on a flat brand-color or organic "blob" background; floating callout pills orbit the pack answering objections; flavor-matched bg color.
- **Build it:** monochrome flavor-matched bg → product centered → 2-3 rounded callout pills orbiting ("same price as whey," "26g protein"). The bg color = the flavor.
- **Refs:** Yogabar orbiting-pills `508fe3...`, Wellbeing cold-coffee splash.

**`listicle` (4 · IN-only)**
- **Look:** 3-5 numbered/checkmark benefit items as a scannable column or icon-row above the pack; often fused with a price badge.
- **Build it:** split one product's features into 3-5 equal icon-pillars or a checklist; let the viewer "audit" the product. Pair rational checklist + emotional price-drop.
- **Refs:** MuscleBlaze 5-icon multivitamin `476...`, Wellbeing "3 Reasons Why."

### Family B — OFFER / COMMERCE formats (low-consideration, bottom-funnel)

**`offer-discount` (31 · IN 30:1 — the single most India-skewed format)**
- **Look:** strikethrough MRP + bright (orange/red/yellow) replacement price + "FLAT 23% OFF" burst, placed **above/left of the pack**; gym or flat bg; benefit icons often layered in the same frame.
- **Build it:** value first in the eye-path. Strikethrough old price → big bright new price → % burst badge. Put the badge at the photo/product seam so deal + aspiration read together. Layer ingredient badges to convert both price- and efficacy-shoppers.
- **Refs:** MuscleBlaze offer cluster (`504d`, `490d` evergreen winners — the most budget-endorsed creatives in the whole set).

**`bundle` (15 · IN 14:1)**
- **Look:** 2+ packs shown as a pair/combo; benefit icons above each; combo price undercuts MRP; OR gift-with-purchase shown at *equal visual size* to the hero so it feels like value, not a discount.
- **Build it:** show the combo physically together; elevate the free item to hero-size; "open box" reveal beats sealed pack (unboxing fantasy).
- **Refs:** MuscleBlaze "From Reps to Recovery" (athlete towers over combo), Sleepy Owl open-box mug combo.

**`catalog-DPA` (19 · IN 17:2)**
- **Look:** single pack cutout on pure white (or a simple brand blob), **zero overlay** — the label carries 100% of the claims; trust badges in the margin.
- **Build it:** this is the ONE format that wants a naked pack. Clean cutout, label-forward, maybe an ingredient splash for naturals. Don't design it — let the pack design work. (Earns 371+ days purely on search-intent capture.)
- **Refs:** MuscleBlaze whey DPA `8f355e3badee`, OZiva amla-splash DPA, Yogabar pink-blob DPA.

**`sampler-trial` (6 · IN-only)**
- **Look:** all variants fanned in a row at equal height; headline names the *fear* ("what if I pick the wrong one?") and resolves it with the multi-pack.
- **Build it:** show exactly N SKUs fanned; open with a qualifying question ("New to specialty coffee?") that pre-selects high-intent explorers; add a ritual scene (press + pastry) to sell the lifestyle before the promo.
- **Refs:** Blue Tokai 3-bag + 5-bag sampler cluster.

**`subscription` (3 · US-only)**
- **Look:** the discount number ("SAVE 30%") is the single biggest element; three objection-busters as in-frame checkmarks (switch flavors / skip / cancel anytime).
- **Build it:** make the % the hero; pre-empt the 3 subscription fears as checkmarks so the creative does the landing-page's conversion work. Optional flavor/IP collab to make "subscribe" feel like access.
- **Refs:** Liquid I.V. `30% / objection-checkmarks` cluster.

### Family C — DESIRE / BRAND formats (the USA lean; top-funnel)

**`flavor-culture` (17 · US 13:4)**
- **Look:** product submerged in a 3D or illustrated world built from its own flavor; OR tied to a cultural moment (Love Island, a collab IP). Zero/minimal text.
- **Build it:** build the environment from the flavor ingredients (sherbet landscape, botanical bloom unique per SKU). The can sits inside its world. Reserve for brands where the flavor name carries the story.
- **Refs:** OLIPOP raspberry-sherbet `38168c7dacf5`, blackberry-bloom illustration.

**`lifestyle` (41 · US 26:15 — the largest format)**
- **Look:** real-photo or UGC; product in-hand or *absent*; the scene (fridge-restock fantasy, garden café, Target haul) sells the desire. Text: none-to-minimal, in the caption.
- **Build it:** show the end-state, not the product pitch. Negative proof ("no brewing equipment in sight" = "easy") is more convincing than the claim. For US: let a repeating-product pattern (full fridge, basket haul) replace designed layout entirely.
- **Refs:** Poppi fridge-restock, Blue Tokai garden-café convenience, Poppi Target basket-haul.

**`new-launch` (38 · US 26:12)**
- **Look:** "NEW / Introducing / meet ___" as near-poster-scale type where the **product name IS the announcement**; OR (US) the launch is a retail-distribution flex (storefront, no product).
- **Build it:** treat the product name as the headline when the name is the news ("PROTEIN COFFEE"). Add 2 spec boxes as a trade-up equation. US route: announce *availability* (retailer) not the product.
- **Refs:** Sleepy Owl "PROTEIN COFFEE" poster, AG1 "New at Target," Magic Spoon "me when…" meme-launch.

**`celebrity-ambassador` (6 · IN 5:1)**
- **Look:** two-zone split — famous faces (RCB cricket, athletes) top half as aspiration, brand-color price/CTA block below as transaction. US route: athlete in *action context* + "Real Member" credential + pull-quote.
- **Build it:** transfer the star's identity with a coaching-cue headline ("Repeat Greatness"); separate aspiration (top) from offer (bottom). For trust, shoot the endorser in real action, not a studio.
- **Refs:** ON RCB cluster, AG1 Sloane Stephens mid-serve.

**`testimonial` (10 · IN 7:3)**
- **Look:** UGC handheld, low polish; person examining/holding the product in real light; OR a headless physique result-shot; pull-quote + "Real Member" tag.
- **Build it:** strip the ad signal — no overlay, real light, talent looks like they're actually trying it. Hide the brand in the thumbnail so the viewer self-identifies with the problem first. "Real Member" tag pre-empts the paid-actor objection.
- **Refs:** AG1 "Real AG1 Member" pull-quote, Wellbeing physique-torso `First,`.

**`founder-POV` (5 · IN-only)**
- **Look:** direct-to-camera talking head, no brand overlay; domestic/production setting (Indian home, ceiling fan; ghee facility); single-word open-loop caption ("This"); OR a real comment-screenshot pinned as "reply to audience."
- **Build it:** bet on the face + gesture, not the logo. Setting = provenance (home = relatable expert; facility = "I make this"). Single mid-sentence word as the only text. Comment-reply framing borrows organic social-proof architecture.
- **Refs:** Wellbeing talking-head, TWT founder-classroom + comment-reply, Anveshan co-founder-in-facility + offer.

**`meme` (2 · US-only)**
- **Look:** native meme structure ("me when…", flavor-battle-as-courtroom); doodle/marquee graphics; invites the comment section to pick a side.
- **Build it:** borrow the exact meme template aesthetic; make the product launch feel like a cultural in-joke; design for comment-section participation. Reserve for brands with permission to be silly.
- **Refs:** OLIPOP courtroom flavor-battle, Magic Spoon "me when…" launch.

---

## 3. What this means for the build (bridge to the cell — NOT yet in the gated skill)

1. **Encode the 10 cross-cutting moves (§1) as primitives first.** They compose into many formats — higher leverage than 23 separate format templates. E.g. "claim-as-visual-proof" + "human-as-headline" + "stat-box-anchored-to-product" cover most of Family A.
2. **Make text-density + claim-prominence a market dial, not a per-format constant.** Same format, IN turns it up (claims/price on-image), US turns it down (clean, benefit demoted). This is the single biggest determinant of whether output looks native.
3. **Route format → family by consideration level** (already our rule): trust-gated brief → Family A; bottom-funnel/promo → Family B; awareness/brand → Family C. The ad-library census confirms the category actually runs this way.
4. **DPA is the only "naked pack" format** — every other format is *designed*. Our designed statics are exactly what a DCO slot wants; don't strip them.
5. **Per-format "build it" lines above are draft cell-format specs.** When match→derive is wired, these become the visual half of each format doc (paired with the existing copy/angle half in `FORMAT-REPERTOIRE.md`). Keep them here as research until then.

**Still copy+single-frame only:** video ads are read from their thumbnail (first frame) — motion/sequence is not captured. The 5 white-space formats (founder-POV, testimonial, notes-app, Reddit, meme) are sparse in this category, so their recipes above lean on fewer examples — re-validate when building them.
