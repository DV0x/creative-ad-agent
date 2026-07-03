# Session 130 — Built a reusable Meta Ad Library research tool, established there is **no per-format performance data**, **locked category targeting** (ingestibles → beauty → local services), ran the **ingestibles deep-dive (452 ads, IN + US)**, and grew the format repertoire **18 → 23**

**Date:** 2026-06-16 (work spanned 2026-06-15 → 16)
**Branch:** `new-ui` (everything uncommitted)
**Status:** A **research + tooling session — no cell-skill code, nothing built in `agent/.claude/skills/cell/`, nothing committed.** S129 predicted S130 = "scale the next format." Instead this session pivoted to **competitive intelligence** — because the question "which formats/angles actually work?" had no grounded answer. It produced: (1) the hard finding that **no audited per-format performance data exists anywhere** (Meta Ad Library included); (2) a **reusable ad-library research tool** (`scripts/ad-research/`); (3) **locked category targeting**; (4) a full **ingestibles deep-dive** across India + US; (5) the repertoire grown **18 → 23**. This work *feeds* the format-scaling — it tells us which formats to build and how they look — so it's a detour that sharpens S129's plan, not a replacement.

> **Read first — continuity chain (index of prior sessions):**
> - `docs/SESSION_129_*2026-06-15.md` — type & style grammars built, founder-POV validated (v3 locked), **specification-not-compositing**. (Predicted S130 = scale formats.)
> - `docs/SESSION_128_*2026-06-14.md` — testimonial format built + validated (13 renders), **the MAKER keystone**, Fork B locked, learnings encoded.
> - `docs/SESSION_127_*2026-06-13.md` — format library into the cell, machine-not-skin, Andromeda debunked, critic/vision-gate pulled.
> - `docs/SESSION_126_*2026-06-13.md` — why the cell is generic, the format-library pivot, **the FROZEN 18-format repertoire** (Part 6 = the list this session extended to 23).
> - `docs/SESSION_125_*2026-06-13.md` — research-first assembly direction locked; production-grade genericness unsolved.
> - `docs/SESSION_124_*` → `122_*` — designed-poster/leap-is-the-ceiling → first-principles reset → visual strategy + makers.
> - Memory: `project_first_principles_redesign` (the S108→S130 arc) · **`project_ad_library_competitive_research`** (this session's capstone) · `feedback_*` (calibration).
> - This session's artifacts: `docs/research/ad-library/` (FINDINGS, FORMAT-REPERTOIRE, 3 corpora) + `scripts/ad-research/` (the tool). Full session list: `ls docs/SESSION_*`.

---

## Part 0 — The arc in one paragraph

We set out to learn which formats/angles actually convert, and hit a wall: **there is no audited, per-format performance data** — not from Meta, not from any benchmark house (confirmed via Perplexity, twice). The Meta Ad Library has **no performance data for commercial ads at all** — only the creative + two proxies (variants, days-running = "revealed-winner"). So we stopped chasing conversion numbers and instead built a **reusable tool to scrape the ad COPY at scale** and mine real hooks/formats. From there: a market-prioritization pass (Perplexity ×3) that **locked a 3-track target** — better-for-you **ingestibles** (NOW), **beauty** (NEXT), **local services** (PARALLEL paying track); a **deep-dive on ingestibles** (16 brands, 452 active ads, India + US) with full-field extraction, a cross-market formats/angles comparison, and a hook bank + format census; and the repertoire grown **18 → 23** (5 formats the live data surfaced that the frozen list didn't name). The throughline finding for the build: **the format mix a category runs is set by how big a decision the buy is** (impulse → catalog/offer; trust-gated → problem/science/clean; lead-gen → offer-chassis + hook), and **founder-POV + testimonial are white space across every D2C category we mined** — which validates building them, even though we de-prioritized them this session in favour of the category's actual workhorses.

---

## Part 1 — The foundational finding: no per-format performance data exists

- **No audited per-format CTR/CVR/CPA benchmarks** exist for static ad creative angles (testimonial, founder-POV, PAS, etc.) — 2023–2026, any source. Three independent Sonar Pro searches landed on the same wall. What exists is *practitioner consensus + scattered case studies* (e.g. a Reddit-thread ad +45% CTR) — directional, not measured.
- **The Meta Ad Library has NO performance data for commercial ads** — no spend/reach/CTR/impressions. Verified two ways: Perplexity, and our own cached data (`spend`=null 0/270, `reach`=null, `impressions`=placeholder `{-1}`; the fields exist only because the same schema serves political ads). The ONLY signal is the **revealed-winner proxy**: an ad kept live long + duplicated into many variants = one the brand's budget endorses.
- **"Proven formats" = consensus + revealed-winner, not measurement.** The frozen 18 came from research + the practitioner taxonomy, the same soft grade of evidence. The list is a *prior*, not scripture; comp updates it per brand.
- **Real per-format numbers only ever come from real spend** — the ₹20–30k beta is still the only judge that locks learning (unchanged from S126).

---

## Part 2 — The reusable ad-library research tool (`scripts/ad-research/`)

Built so we can mine any category/market without the agent loop, and re-use what comp already paid for.
- **`scrape-ad-library.mjs`** — config-driven pull (pin `page_id` to dodge the wrong-brand trap; resolve-by-name + score + warn otherwise). Caches raw responses (re-runs free). Writes `corpus.{md,json}` + `pages.md` (page-pick audit) to `docs/research/ad-library/<slug>/`.
- **`ingest-harness-cache.mjs`** — turns comp's already-paid ScrapeCreators cache into a corpus for **zero credits**.
- **`deep-extract-ingestibles.mjs` / `deep-extract-us-compare.mjs`** — full-field extraction (all ads, all data points incl. creative image/video URLs + ad-library permalinks) + IN-vs-US aggregates.
- **`README.md`** — the 6 analysis **lenses** (hook bank · format census · offer teardown · CTA/funnel · revealed-winner · bucket contrast) you point at a saved corpus.
- **Build-vs-buy settled:** keep ScrapeCreators. The official Meta API can't see commercial ads (political only); DIY = reverse-engineer Meta's undocumented GraphQL + rotating residential proxies + perpetual maintenance against an adversary — far costlier than the cents-per-call fee. Revisit only at production volume.
- **The wrong-brand trap is real and recurrent** — likes alone is wrong: "The Whole Truth" (TV show > the brand), "Yoga Bar" (a yoga influencer), "Open Secret" (Mexican page 54k likes > Indian 3k), "Poppi" (Mary Poppins musical, 573k, *verified*). Always verify by **category + IG handle**, or pin `page_id`.

---

## Part 3 — Category targeting LOCKED (3 sequenced tracks)

Prioritised by **size + Meta-dependence · do we know the playbook · do we have a head start** — not market size alone. (Full section in `docs/research/ad-library/FINDINGS-2026-06-15.md`.)
- **▶ Track 1 — NOW: better-for-you ingestibles** (supplements + healthy snacking + functional foods + functional beverages = one trust-gated super-category). TWT anchors it; deepest comp data; playbook already mapped.
- **▷ Track 2 — NEXT: beauty & personal care.** Biggest D2C category in both markets, very Meta-native — but zero data, no anchor, a visual/UGC playbook we must learn first.
- **▷ Track 3 — PARALLEL (the paying track): local services.** Lead-gen playbook (offer-chassis + hook); the beta clients live here. Meta-heavy verticals (India): real estate, healthcare/aesthetic clinics, education, financial services, beauty/wellness services, fitness are **HIGH**; **hotels only MEDIUM** (the hotel beta client sits in a thinner vertical than the education one).
- **The tension we sequence around:** biggest market (beauty) ≠ best fit (ingestibles) ≠ who pays today (local). → prove on ingestibles → expand to beauty → run local as the paying track.

---

## Part 4 — Ingestibles deep-dive (452 active ads, IN + US) + the cross-market split

- **Coverage:** 16 brands, **452 active ads → 284 distinct concepts.** IN (10): The Whole Truth, MuscleBlaze, Optimum Nutrition, OZiva, Wellbeing Nutrition, Bal Bharat, Yogabar, Blue Tokai, Sleepy Owl, Anveshan. US (6): RXBAR, Magic Spoon, OLIPOP, Poppi, AG1, Liquid I.V. *(Happilo + Open Secret run 0 active ads in IN — a finding: marketplace/quick-commerce or paused.)*
- **Scope caveat:** ACTIVE only, ~top-30/brand (the API's first page; the 8 brands at exactly 30 likely have more — no pagination in v1).
- **Format mix (≈ same both markets):** DCO ~61% · VIDEO ~19% · then IMAGE/DPA/CAROUSEL. The category runs heavily on **automated creative (DCO)**; single hand-made statics are a minority (US 16% vs IN 7%).
- **Destination:** own-site **84% (IN) / 94% (US)** — they keep the conversion on their own site. **CTA: "Shop now" dominant** (87% IN / 80% US) → a product-**sale** category, not lead-gen.
- **Longevity:** IN ads run far longer (avg 78d vs US 26d — partly MuscleBlaze's 470–597-day evergreen combos); US churns creative faster + more variants (1.7 vs 1.4).
- **THE cross-market angle split:** **India = prove the health** (clean/anti-chemical, dose/science, problem→solution, certified-quality — benefit-first). **US = sell it like a consumer brand** — RXBAR/AG1/Liquid I.V. still lead clean+science, but **the functional sodas (OLIPOP, Poppi) lead with FLAVOR, nostalgia, culture, celebrity**, with the health benefit as *background reassurance*. Templating rule: US functional bev = fun-brand-first, health-second; IN ingestibles = benefit-first.

---

## Part 5 — Format census + repertoire grown 18 → 23

Census of the 284 concepts vs the frozen 18 (`HOOK-BANK-AND-CENSUS.md`):
- **13 of 18 appear** (10 strong + 3 partial). The category's workhorses are all already in the library: **what's-inside, offer/discount, science, stat, PAS, us-vs-them, listicle, bundle, hero, lifestyle.**
- **5 are white space** in ingestibles (the Tier-1 native formats: founder-POV, testimonial, notes-app, Reddit, meme) — unclaimed, but **de-prioritized this session** (we chose parity on the workhorses over differentiation).
- **5 NEW formats surfaced that the 18 didn't name** → added to the living repertoire (`FORMAT-REPERTOIRE.md`, **18 → 23**): **New-launch/new-flavor** (very common — "Introducing…/NEW:") · **Celebrity/ambassador** (AG1×Hugh Jackman, ON×RCB) · **Cultural/trend-jack** (OLIPOP song, Poppi×Love Island — US bev) · **Sampler/trial pack** (Blue Tokai) · **Subscription offer** (Liquid I.V.). Marked ingestibles-validated, not universal. Kept OUT of the gated cell skill; folds in when match→derive is wired.

---

## Part 6 — Repo state (all uncommitted, `new-ui`)

- **New tool:** `scripts/ad-research/` — `scrape-ad-library.mjs`, `ingest-harness-cache.mjs`, `deep-extract-ingestibles.mjs`, `deep-extract-us-compare.mjs`, `config*.json`, `README.md`, `.cache/` (gitignored — added to `.gitignore`).
- **New research:** `docs/research/ad-library/` — `FINDINGS-2026-06-15.md` (patterns + targeting), `FORMAT-REPERTOIRE.md` (23 formats), `india-d2c-vs-local-2026-06-15/`, `cached-rivals-2026-05/`, `ingestibles-deep-2026-06-16/` (+ `HOOK-BANK-AND-CENSUS.md`), `ingestibles-us-deep-2026-06-16/`.
- **Memory:** `project_ad_library_competitive_research` (created + extended) + `MEMORY.md` index.
- **Untouched:** the cell skill (`agent/.claude/skills/cell/`) — still gated, no changes. ScrapeCreators credits at **~11** (top up before the next scrape).

---

## Part 7 — NEXT (S131): START WITH IMAGE ANALYSIS

1. **Analyse the ingestibles creative IMAGES (start here).** We already hold every card/video URL + ad-library permalink in the two `ingestibles-*deep-*` corpora — **free, no scrape.** Download a curated set (the revealed-winners across the workhorses + the 5 new formats, both markets) and **vision-read them.** This closes the copy-only blind spot we've carried all session: copy tells us the *angle*; only the image tells us the *look* (layout, type treatment, real-photo vs graphic, product handling, how "clean/science/offer" actually render). Pick ~15–25 images spanning: what's-inside, offer, science, stat, new-launch, us-vs-them, + US flavor/culture.
2. **Turn the images into a per-format VISUAL playbook for ingestibles** — the "how it looks" layer that feeds the cell format docs (the missing half; we have the copy/hook half).
3. **Top up ScrapeCreators credits** (~11 left).
4. **Track 2 — beauty deep-dive:** scrape Mamaearth, Sugar, Plum, Minimalist, Dot & Key → learn the *visual/UGC/before-after* playbook (the one we don't have).
5. **Track 3 — local services:** scrape clinics + real estate (the two HIGH verticals we hold nothing on) to seed the paying track.
6. **Then fold it back into the build:** repertoire (23) + the per-format visual playbooks → the cell format library; wire the gated match→derive so the cell picks format-from-angle and derives the look. (Re-joins the S129 plan.)

**Deferred / carry:** image analysis needs a vision pass (download + read — buildable as a lens); pagination + `status=ALL` if exhaustive coverage is needed; the cell skill stays gated until the visual playbooks exist; the 5 new formats are ingestibles-validated only (re-check generality per category).

---

## Part 8 — User verdicts this session (calibration corpus — verbatim)

- *"ok we have perplexity i guess can you check the data?"* (→ ground claims in retrieved data, not memory)
- *"I know but for research we can scrape, scrape it and we can anlyse the hooks and formats based on text"* (→ the pivot: copy-as-research-input even without perf data)
- *"we need to look D2C and the local brands"* (→ both buckets; the consideration-level split)
- *"no im asking you said we can do look at images cheaply via live comp? what does that mean?"* (→ caught a loose claim — comp reads copy, NOT images; image analysis isn't built)
- *"is there a way thet we can build our own scraper... right now we are using thri party and its a pid one"* (→ build-vs-buy; keep buying)
- *"I mean our platform can generate different multiple ads so thats not a problem if we ask it to generate ads for DCO"* (→ corrected my "we make one" framing; we already make 6)
- *"so for DCO there should be no content on the images?"* (→ DCO wants clean images; the opposite of our designed-static craft)
- *"did you pull a the list of all brands because i cant see TWT and others"* (→ caught the two-cache split; the format census had missed the live-pulled brands)
- *"ok so we scraped all the ads or only active ones?"* (→ precise scope: active only, ~top-30, no pagination)
- *"regardless of white space since we dont want to focus on white space now... how many of this fits in that 18 format?"* (→ census vs the 18 → repertoire 18→23)
