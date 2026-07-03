# Session 131 — Ingestibles **image analysis** built (262 creatives → gallery + visual playbook), **DCO clarified**, and the **DR/native format strategy FROZEN** as a *skin × engine* kit

**Date:** 2026-06-16 · **Branch:** `new-ui` (everything uncommitted) · **Status:** Research + tooling + strategy session — **strategy FROZEN, implementation starts next session.** No cell code written, nothing committed.

> **Read first:**
> - `docs/research/ad-library/DR-FORMAT-KIT-FROZEN-2026-06-16.md` — **the forward-looking blueprint** (skin × engine kit + build order). This is what next session builds from.
> - `docs/research/ad-library/ingestibles-image-analysis-2026-06-16/VISUAL-PLAYBOOK.md` — per-format visual recipes (the "how it looks" layer).
> - `docs/SESSION_130_*2026-06-16.md` — prior session (ad-library tool, no-perf-data finding, targeting locked, 452-ad deep dive). This session = S130's "Part 7 NEXT: start with image analysis," executed.

---

## Part 0 — The arc in one paragraph
S130 said "next, vision-read the creative images." We did — and it turned into a full strategy lock. Built a reusable **image-analysis lens** (`scripts/ad-research/`), hit an expired-URL wall on 5 India brands and fixed it with a fresh re-pull, then **vision-read 262 unique creatives** (175 IN + 87 US, 16 brands) via 13 parallel Sonnet subagents into a filterable **side-by-side gallery** + a per-format **visual playbook**. Along the way the user pushed hard on the data — which forced real clarity on **what DCO actually is** (a pool of fully-designed images Meta mixes, *not* bare shuffled product — that's DPA), on **which creatives are proper DR vs brand** (India 67% DR, US 48% brand), and on **which DR formats run vs "win"** (the win-proxy is distorted by MuscleBlaze evergreen; PAS/science are the active momentum). That converged on a **frozen strategy**: differentiate by adopting **native ("doesn't-look-like-an-ad") DR formats**, modelled as **SKIN × ENGINE** — and the user corrected my over-narrow "UGC-selfie/faceless" framing into an **open, derived real-world subject** (person/hand/pet/object/scene — decided by the MAKER rule, not a menu). Seven live IG exemplars the user captured validated it and added the **chat-screenshot** skin. Strategy frozen into one doc; memory trimmed to pointers.

---

## Part 1 — The image-analysis lens (`scripts/ad-research/`, 3 new scripts)
- **`download-images.mjs`** — one representative image per ad, byte-dedup, manifest pairing image↔copy. First-corpus-wins brand dedup ("pull new, ignore old"). Later extended to pull **all DCO variant images** (rotation pools).
- **`refresh-pull.mjs`** — live re-pull for expired creatives (bypasses cache).
- **`build-image-gallery.mjs`** — self-contained filterable HTML gallery.
- **The expired-URL wall:** 5 India anchor brands (MuscleBlaze, Optimum Nutrition, Wellbeing, OZiva, Bal Bharat) came from comp's **May cache** → fbcdn signatures expired → deterministic 403. Fix = `refresh-pull` (cost 5 ScrapeCreators credits; **~6 left**). **Gotcha locked: cached fbcdn image URLs expire in ~weeks — always re-pull fresh.**
- **The vision pass:** 262 unique images, 13 parallel **Sonnet** subagents, each writing a structured per-image JSON (layout · type · imagery · product-handling · palette · text-density · **how-the-angle-renders** · notable). Merged → `analysis.json` (1 JSON-escape repair on slice-3).

## Part 2 — Deliverables (`docs/research/ad-library/ingestibles-image-analysis-2026-06-16/`)
- `index.html` — side-by-side gallery (image · copy+meta · visual read), filters: market · **media (statics/video)** · **DR/mid/brand bucket** · format · search; DCO cards show their **rotation pool** as a full-width thumbnail row.
- `analysis.json` (262 vision reads) · `manifest.json` · **`VISUAL-PLAYBOOK.md`** (the payload).
- `images/` + `_work/` + `index.html` are **gitignored** (heavy/regenerable); playbook/analysis/manifest kept.

## Part 3 — Key findings
- **The IN/US split is a VISUAL split.** India = benefit/DR-first (claims/price/numbers on-image, dense); US = brand-first (clean, product often absent, benefit demoted). offer-discount 30:1 IN; flavor-culture 13:4 US; PAS/hero/listicle/sampler/founder-POV IN-only; subscription/meme US-only.
- **10 cross-cutting visual moves** = the reusable primitives (in the playbook): human-as-headline · pack-IS-the-ad · claim-as-visual-proof · price-before-product · stat-box-anchored-to-product · two-zone aspiration/transaction split · show-the-count · retailer-as-credibility · flavor-world · open-loop typography.
- **Biggest nativeness lever = a market dial on text-density** (same format; India turns claims/price UP, US DOWN).

## Part 4 — DCO clarified (a recurring user question, now settled)
- **DCO = Dynamic Creative Optimization:** one ad = a **pool** of multiple *fully-designed* images (+ optional multiple texts) that Meta **mixes, matches, and optimizes** per viewer. Verified in raw data: a single ad held **3 distinct designed images, 1 headline/body**.
- **DCO ≠ bare/clean.** The "clean naked-product, auto-shuffled" format is **DPA** (catalog/feed). Our designed statics ARE what a DCO slot wants.
- **Meta does NOT redesign inside a finished image** (won't move the product or restyle fonts). It changes the *combination*, the *placement crop*, and optional *creative enhancements* — not the layout of an uploaded design.
- → Pulled **all DCO variants** into the gallery (413 unique images) so the rotation pools are visible.

## Part 5 — DR vs brand, running vs winning
- **DR/mid/brand buckets:** IN = 67% DR / 22% mid / 11% brand; US = 17% DR / 34% mid / **48% brand**. DR is essentially the India playbook. (DR bucket is ~90% statics → reliable; the brand bucket is the video-frame-heavy/soft one.)
- **DR running:** offer-discount (31) · catalog-DPA (19) · us-vs-them (17) · bundle (15) · science (15) · PAS (10).
- **DR "winning" is distorted:** every top revealed-winner is **MuscleBlaze evergreen** (400–617 days, 1 variant) = set-and-forget retargeting, not best creative. **science/PAS/stat show 0% "winners" only because they're NEW** (max ~40 days) + multi-variant = the **active momentum wave**. The days-proxy is blind to fresh winners.
- **Caveat locked:** "revealed-winner" = budget proxy, NOT measured performance. The ₹20–30k beta is the only real judge.

## Part 6 — The FROZEN strategy: Native DR Kit (skin × engine)
Full spec in `DR-FORMAT-KIT-FROZEN-2026-06-16.md`. Summary:
- **Bet:** differentiate by going **native** while staying DR; serves ingestibles (Track 1) AND lead-gen/local-services (Track 3).
- **Model:** **ENGINES** {PAS · offer · us-vs-them · proof} × **SKINS** {real-world/native-moment · chat-screenshot · notes-app/text-card · quote-card · relatable-routine · Reddit · clean-poster (parity)}. Mix freely.
- **The "real-world moment" skin** (user's correction): subject is **OPEN and derived** — person/hand/pet (cat,dog)/object/scene, *anything real-world* — decided by the **MAKER** rule (who'd actually post this, in what real world). NOT a fixed menu, NOT "faceless-first." Testimonial + founder-POV (already built) are just the human points.
- **Guardrails:** skin disarms / payload converts (no payload = brand fluff) · MAKER derives the subject · static-slice (we make statics, native-UGC is strongest in video) · IN/US density dial · skip pure-brand emerging (flavor-world, trend-jack, meme-for-laughs).
- **Build order (next session):** PAS × real-world-moment (reuse built human skin) → chat-screenshot → notes-app → render-validate (testimonial bar) → wire engine×skin → expand → fold into gated match→derive.

## Part 7 — Live exemplars saved (`wild-native-exemplars-2026-06-16/`)
7 real IG ads the user captured + a README mapping each to skin × engine. They (a) validated the native trend, (b) **added the chat-screenshot skin** (Ditto WhatsApp), (c) showed **4 of 7 are lead-gen** (Shift, Ditto×2, Humanedge) → the kit serves the local-services paying track. Pattern: a disarming *skin* over a hard DR *payload*; 5 of 7 are text-first/fake-UI (product barely shown) = typography-driven = our static strength.

## Part 8 — User verdicts (calibration corpus — verbatim)
- *"why do we have video images here?"* → video cards are 1-frame thumbnails (soft); added a media filter + `?` markers; DR bucket is ~90% statics (reliable).
- *"for DCO i can see the same image with copy and all DR parts… what is DCO? you said meta shuffles images with headlines"* → DCO = dynamic-creative pool of *designed* images Meta mixes; DPA is the clean one. (Owned my earlier conflation.)
- *"so meta also change the position and style in the DCO?"* → No inside a finished image — only the combination, placement crop, and optional enhancements.
- *"which are proper DR / performance ads?"* → DR vs brand classification (India = DR engine of the category).
- *"in the DR what's running and which are winning?"* → running vs the (distorted) win-proxy; PAS/science = momentum.
- *"finalize… differentiate and adopt the emerging stuff."* → skin × engine kit.
- *"what is PAS as native UGC?"* → unpacked (P-A-S engine + native skin).
- *"is it only selfie version of UGC?" / "why faceless first… you can use cats, dogs, anything real world."* → corrected to OPEN/derived real-world subject via MAKER. **Key calibration: don't impose style defaults; derive, don't menu.**
- *"freeze the strategy… create a summary doc, don't bloat the memory."* → froze into one doc; trimmed memory to one-line pointers; logged the preference ([[feedback_handoff_doc_not_memory_bloat]]).

## Part 9 — Repo state (all uncommitted, `new-ui`)
- **New scripts:** `scripts/ad-research/{download-images,refresh-pull,build-image-gallery}.mjs`.
- **New research:** `docs/research/ad-library/{ingestibles-image-analysis-2026-06-16/ (gallery+playbook+analysis), ingestibles-in-refresh-2026-06-16/, wild-native-exemplars-2026-06-16/, DR-FORMAT-KIT-FROZEN-2026-06-16.md}`.
- **Memory:** trimmed `project_ad_library_competitive_research` + `project_first_principles_redesign` to doc-pointers; added `feedback_handoff_doc_not_memory_bloat`.
- **Untouched:** the cell skill (`agent/.claude/skills/cell/`) — implementation is next session. ScrapeCreators credits **~6** (top up before next scrape).
