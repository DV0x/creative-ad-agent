# PLAN — The Field-First Creative Pipeline (agent-loop build)

**Date:** 2026-07-08
**Status:** Design locked, validated end-to-end MANUALLY on a real client (Verbis Edu PTE, 3 publishable
creatives in one sitting, founder-judged). Build target: agent-loop.
**Worked example (read alongside this doc):** `clients/verbis/field-first-test/` — every artifact of the
manual run this plan is distilled from.
**Supersedes:** the create-side stage designs from the 2026-07-07 DR rebuild where they conflict (lead-form
menu, diagnosis ceremony); keeps that rebuild's collectors, code spine, and buyer where they don't.

---

## 1. The thesis (and why we finally believe it)

**The Meta Ad Library is the only input that carries market selection pressure.** Everything else — brand
sites, reviews, founder briefs — is what people SAY. The ad field is what budgets KEEP ALIVE. So the field
is mined FIRST, and everything downstream — research, copy, layout, finish — adapts from evidence-endorsed
instances instead of being generated from descriptions.

Evidence this works, from this session:
- TWT rounds 1→3: ad-field data killed an approved-but-fatal card (the FSSAI "cleanest" contradiction),
  exposed wallpaper self-cloning, and re-classed the wear ladder (verification claims: burned on websites,
  UNRUN in paid ads — an open lane invisible without the field).
- Verbis manual run: 3 constructions adapted from 50–101-day budget-endorsed ads produced 3 publishable
  creatives in ~4 hours for a real flight. Every prior pipeline iteration (S103–S141) ended in slop.

**The one law that governs every stage:** *the field supplies FORM and selection pressure; the brand
supplies TRUTH.* Both from the field = competitor collage. Both from the brand = correct-but-shapeless.
The split is the design.

---

## 2. Pipeline stages

```
0 INTAKE  → brief.md                    (orchestrator, interactive or --founder file)
1 FIELD   → field-brief.md + banks      (discovery agent + code fetch/rank + multimodal reader)
2 COLLECT → material.md + assets/       (targeted by the field brief)
3 CREATE  → creatives.json + copy       (Opus; construction picks + brand specs)
4 BUILD   → prompts + renders           (compiler rules; brand refs only; fal/KIE)
5 GATE    → per-image PASS/FAIL         (Opus fresh eyes; the five real-catch checks)
```

### Stage 0 — INTAKE
WebFetch the brand URL first, then AskUserQuestion for only what the page can't say: conversion event,
target CPA, budget/flight window, audience. Offer facts extracted from the page verbatim (OFFERS ALLOWED).
Deliverable: `brief.md`.

### Stage 1 — FIELD (the new first-class stage)
1. **Discovery (agent, Perplexity — NO assumed lists).** Three rings:
   (a) direct rivals, (b) same-buyer brands (different product, same feed), (c) **offer-shape adjacents** —
   whoever sells the same TRANSACTION SHAPE in any category (for a ₹589 workshop: every ₹99–999
   masterclass advertiser — trading, astrology, fitness, cooking). Ring (c) is where the best
   constructions came from in the Verbis run (FITTR, Astro Arun Pandit).
2. **Resolve (agent judgment).** Names → page_ids with the wrong-brand defence (likes + category + ig).
   Ambiguous names are reported, never guessed.
3. **Fetch + dump (code).** Active ads per page, country-scoped. FULL records to `raw/ads/<brand>.jsonl`
   (untruncated copy, launch date, daysRunning, variants, format, CTA, link); image creatives downloaded
   to `raw/images/<brand>/`. Video ads: copy captured, pixels skipped (image pipeline).
4. **Shortlist (code).** Endorsement rank = active × variants × daysRunning; dedupe same-creative flights;
   force construction diversity across brands (never top-N of one brand).
5. **Pixel reads (multimodal agent).** Each shortlisted image → one line of `image-reads.jsonl` on the
   UNIFIED SCHEMA (§3). Text and visuals read together as ONE construction.
6. **Field brief (agent).** `field-brief.md`: working formats (endorsed) vs emerging formats (young but
   multi-variant / cross-brand), verbatim hooks-on-winners tagged by claimType (this IS the hook bank),
   offer structures, register notes, open lanes, and the brand's own live ads marked DO-NOT-CLONE.
7. **Bank caching.** Reads + images cached per category (`bank is the cache, scrape is the feed`);
   next same-category client starts warm. Same-category competitor pixels are EYES-ONLY forever —
   they inform reads, they never enter a render call.

### Stage 2 — COLLECT (targeted brand research)
The field brief is the shopping list: hunt verbatim voice and facts that FILL the shortlisted
constructions and BEAT the running claims. Keep the 2026-07-07 collect binder's discipline (verbatim-only,
journey coverage, desire/objection types, raw tier) — add the targeting. Also inventory the brand's
render-bindable assets: logo files, faces (with permission), product photos, proof documents.

### Stage 3 — CREATE (Opus)
1. Pick 3–5 constructions: different claimTypes, none cloning the brand's live ads, at least one open-lane
   play (a construction or claim nobody in the field runs).
2. Per creative, write the BRAND SPEC — same schema as the reads (§3) — by executing the tags:
   - **KEEP**: the construction (element roles, hierarchy, eye path) AND its craft system (material
     richness, lighting drama, device energy, MEASURED type scale). Production values are part of the
     move, not the surface.
   - **SWAP**: brand marks, palette, words, humans-filling-roles.
   - **RE-DERIVE**: category content inside structural slots (their kundli book → our voucher card) and
     **the scene itself, into this buyer's world** (FITTR's daylight wall → the 11pm PTE practice desk).
     Scene re-derivation is what defeats the clone test — same move, different world.
3. Copy by destination: primaryText (persuasion; first sentence lands before the ~125-char fold),
   headline (~40 chars visible), on-image strings (final, verbatim). Copy constructions come from the
   field brief's hook bank the same way layouts come from reads; open-lane hooks may be original but must
   be built from brief/material facts.
4. Anatomy law (real catch): **the category/product is NAMED on-image** — the event-frame slot (chip/
   banner) owns this job. Never rely on audience self-recognition alone; Meta's delivery reads the creative.

### Stage 4 — BUILD (compile + render)
Compiler rules (full text: `clients/verbis/field-first-test/field/prompt-rules.md`):
1. Layout skeleton first (zones, grid, eye path) — the word budget goes here.
2. Type with mechanics AND absolute scale: family-feel, weight, case, per-block cap-height as % of frame
   (feed headline ~6–8%/line, 2–3 stacked lines; subhead ~50% of headline; nothing functional <2%).
   Scale numbers come from the source read's MEASURED fractions.
3. Spacing rhythm named. 4. Every forbid converted to a positive. 5. Palette gets ONE line.
6. Shorter wins (~350–500 words); no uncompiled adjectives. 7. Exact strings quoted; "render exactly
   these and no other text".
Rendering: brand references only (logo, face, product) bound via edit/i2i mode; competitor pixels never.
Provider-redundant: fal `clients/verbis/render.cjs` + KIE `clients/verbis/field-first-test/kie-render.mjs`,
same job-file format (§6). One shot + at most one targeted retry per named diff.

### Stage 5 — GATE (Opus, fresh context)
Five checks — each born from a real catch this session, severity per the Contra study (generic = blocker,
polish = forgivable):
1. **STRINGS** — every specced string verbatim; no other text; no garble (blocker).
2. **NAMED** — what is being sold is named on-image (blocker; the missing-PTE catch).
3. **CLONE, both directions** — rival's logo on ours breaks it; side-by-side with the source read, nobody
   calls them the same creative (blocker; the FITTR-wall catch).
4. **THUMBNAIL** — at ~300px: hook legible, one focal point, CTA findable (major; the type-scale catch).
5. **FABRICATION** — no invented brand marks, impersonated platform UI, invented persons/documents
   (blocker; the invented-V-monogram catch).
Named diffs → one re-render → ship or flag. Verdict format and loop identical to the existing
gate/render-critic machinery.

---

## 3. The unified read/spec schema (JSON #1 = reads, JSON #2 = brand specs — SAME shape)

```json
{ "id": "brand_adid | creative-N",
  "endorsement": { "daysRunning": 0, "variants": 0, "active": true },   // reads only
  "sourceRead": "brand_adid",                                            // specs only
  "claimType": "offer | social-proof | mechanism | callout | curiosity | comparison | objection-wall | letter",
  "hook": { "text": "verbatim", "zone": "", "sizeRank": 1, "scale": "cap-height as % of frame height" },
  "textBlocks": [ { "text": "", "zone": "", "sizeRank": 2, "scale": "", "style": "", "role": "WHY it exists in the argument" } ],
  "layout": { "grid": "", "eyePath": "", "imageTextRatio": "", "focal": "" },
  "device": "the named mechanism (objection-wall / price-slash object / parody banner / …)",
  "craft": { "material": "", "light": "", "deviceEnergy": "", "finish": "" },
  "palette": ["…"],
  "offer": { "visible": true, "framing": "" },
  "move": "one line: the stealable structural idea",
  "keepSwapDerive": { "keep": "", "swap": "", "derive": "" },
  "renderability": "HIGH | MEDIUM | LOW — can a one-shot image model hold this",
  "score": {                                    // bank entries only — the tier-3 outcome layer
    "flights": [ { "client": "verbis", "creative": "creative-1-v4", "spendINR": 0,
                   "conversions": 0, "cpaINR": null, "window": "2026-07-08..11",
                   "source": "ads-manager-export | founder-report" } ],
    "verdict": "converting | mixed | dead | untested",
    "updatedAt": "" } }
```
Schema laws: every element carries a ROLE (roles decide keep/swap — the seller-presenter lesson);
`scale` is MEASURED on reads and carried into specs; `craft` is part of KEEP; `score` accrues on the
BANK entry (the construction), never just the render — constructions transfer across brands, so one
client's outcome improves every client's priors.

---

## 4. Agent-loop build map (what changes where)

- `stages.ts` — roster becomes: `intake(orchestrator) → field → collect → create → build` (+ `gate`
  orchestrator-launched, mirroring `buy`). The 2026-07-07 `market` stage evolves INTO `field` (its MCP
  dump machinery is the fetch layer; add image download + shortlist + pixel-read + field-brief steps).
  `collect` keeps its binder + gains the targeting read. `create` binder REWRITTEN to §3 spec-adaptation
  (drop: lead-form menu, hook workbench, JTBD ceremony; keep: verbatim anchors, wear ladder, awareness
  read, matrix-of-hypotheses framing, compliance instincts). `cell-render`/`render-critic` retire in favor
  of `build`/`gate`.
- `mcp/scrapecreators.ts` — extend `competitor_ads` to also download image creatives (the raw-dump pattern
  is already in; add image fetch per ad, capped).
- New render tool — wrap fal + KIE behind one MCP (or Bash-invoked script) taking the job-file format (§6);
  include the reference-upload path (fal storage / KIE base64 API).
- `hook.ts` — launch caps for the new stage names; keep the DONE.md guard and gathering caps.
- Buyer (`buy`) — keep as the concept gate after create (its ad-field SEEN-IT already works); GATE is the
  new pixel seat. Both Opus, both fresh-context, both orchestrator-launched.
- Banks — per-category folder now; R2 + D1 port unchanged from the S141 sketch, later.

## 5. Binders to write (from the manual run's prompts, not from theory)
- `field` binder: discovery rings, resolve defence, read schema + measurement discipline, field-brief shape,
  working/emerging shortlist rules.
- `create` binder v2: construction picking, tag execution (keep/swap/re-derive with the role + scene laws),
  copy-by-destination, anatomy law.
- `build` binder: the compiler rules verbatim + thumbnail self-check.
- `gate` rubric: the five checks with severity tiers.

## 5b. The outcome loop — the bank's `score` field (tier-3 memory, crude v1)

The Ad Library only gives survival proxies for OTHER brands' ads. Our clients' ad accounts give TRUE
conversion data for OUR outputs — the only compounding asset a competitor cannot scrape. Three memory
tiers: scraped field (public, no moat) → interpreted reads (labeled dataset, medium moat) → **outcome-linked
scores (the moat)**.

Crude v1 — deliberately manual, start immediately:
1. Every shipped creative's brand spec already cites its `sourceRead` → the bank entry it adapted.
2. After a flight, the founder's Ads Manager numbers (spend, conversions, CPA) get written into that bank
   entry's `score.flights[]` by hand (or a 20-line import script from a CSV export). Verdict rolls up:
   converting / mixed / dead.
3. Retrieval preference at CREATE: scored-converting constructions rank above unscored; dead ones need a
   reason to be picked again. That's the whole v1 — no embeddings, no Vectorize, no infra.
4. **First data points: the Verbis 11 July flight** (3 constructions live — objection-wall, price-slash
   object, parody letter). Collect the numbers the following week.

The designed-but-unbuilt reach-as-gold loop (CLIP + Vectorize, `feedback_loop_architecture`) is v2 of
exactly this field; it gets built only after the manual version proves the scores change picks.

## 6. Provider infrastructure (state as of 2026-07-08)
- **Job-file format** (shared): `{quality, size, outDir, jobs:[{name, size, prompt, refs?:[localPaths]}]}`.
- **fal** (`clients/verbis/render.cjs`): GPT Image 2 (`fal-ai/gpt-image-2` / `/edit`), true 4:5 (1152×1440).
  ⚠️ Account returned `Forbidden` on ALL calls since ~19:20 on 2026-07-07 (probe confirmed account-level —
  check balance/key before relying on it).
- **KIE** (`clients/verbis/field-first-test/kie-render.mjs`): key in repo-root `.env.local` (`KIE_API_KEY`).
  Models `gpt-image-2-text-to-image` / `gpt-image-2-image-to-image` via `POST /api/v1/jobs/createTask`,
  poll `GET /api/v1/jobs/recordInfo?taskId=`. Refs via base64 upload
  (`https://kieai.redpandaai.co/api/file-base64-upload` → temp URL, 3-day expiry) into `input_urls`.
  10 credits per 2K render. ⚠️ 4:5/5:4 "temporarily unavailable" — 3:4 is the fallback (Ads Manager crops).
- GPT Image 2 chosen over Nano Banana for copy-heavy creatives (text fidelity ~99%; a ~120-word letter
  rendered with zero garble twice).

## 7. Open items
1. Gate judge policy (single Opus vs 2-of-3) — S141's variance finding still unresolved; start single, log.
2. Bank storage port (R2 + D1) and cross-client cache sharing — the IP/eyes-only rule must survive.
3. Video constructions — excluded from v1; the copy layer of video ads is already captured in dumps.
4. Historical ads (`status=ALL`) for churn depth — worth a few credits per category.
5. Per-category discovery cost ~30–40 scrape credits + ~$0.5 Perplexity; renders ~10 KIE credits each.
