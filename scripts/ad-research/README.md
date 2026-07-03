# Ad-Library research step

Mine what competitors are **actually running** on Meta — real ad copy, hooks, formats, offers — across any set of brands, markets, and buckets. Then analyse the saved corpus from whatever angle you need.

**What you can and can't get.** The Meta Ad Library has *no* performance data for commercial ads (no spend / CTR / conversions). It *does* expose the creative + two proxy signals: **variant count** and **days-running**. An ad a brand keeps live and duplicates is one its budget endorses — the "revealed-winner" proxy. So this is not a conversion-rate source; it's a **hook + format + offer** source, weighted by what spend endorses.

It's split in two on purpose:

- **Scrape (deterministic, cached).** A config-driven CLI pulls the corpus. Re-run with a new config to sweep new "stuff."
- **Analyse (flexible).** Point a *lens* at the saved corpus. Re-run a different lens for a new "angle." No re-scrape needed.

## 1. Scrape

```bash
# edit scripts/ad-research/config.json (brands + market + buckets), then:
node scripts/ad-research/scrape-ad-library.mjs
# or a named config:
node scripts/ad-research/scrape-ad-library.mjs path/to/other-config.json
```

Writes to `docs/research/ad-library/<slug>/`:
- **`corpus.md`** — readable, grouped by bucket, revealed-winner ranked. *Read this to analyse.*
- **`corpus.json`** — structured, for an automated lens.
- **`pages.md`** — the page-pick audit trail (verify here).

**Cost:** 1 credit per name-resolution + 1 per page of ads. Pin `page_id` to skip resolution. Responses cache to `.cache/` (gitignored) → re-runs are free.

**⚠ The wrong-brand trap.** Resolving a brand by name can return a namesake (a same-name TV show or influencer outranks the real brand on likes — seen live with "The Whole Truth" and "Yoga Bar"). The script down-ranks junk categories and warns, but the guarantee is to **pin `page_id`** in the config. Always skim `pages.md` after a resolve-by-name run.

## 2. Analyse — the lenses (the "different angles")

Hand the corpus + one of these to Claude (or a future scripted agent). They compose — run several.

- **Hook bank** — pull the opening hook line from every ad; cluster by hook type (curiosity, objection-kill, urgency, social-proof, contrarian, stat, identity). Output: a bank of *real* hooks per bucket, to seed/validate the hook methodology.
- **Format census** — classify each ad into the 18-format library (testimonial, founder-POV, PAS, us-vs-them, listicle, what's-inside, offer, …). Count by bucket. **Flag formats/hooks live in the wild that the library doesn't name yet.**
- **Offer / promo teardown** — for local + Tier-3: extract offer mechanics (discount %, bundle, free-consult, deadline/urgency, loyalty). What's the conversion event?
- **CTA + funnel read** — Shop vs Book vs Apply vs Sign-up. Tells you product-sale vs lead-gen, which decides the format chassis.
- **Revealed-winner read** — sort by variants × longevity; name what each brand's budget is *currently* leaning on.
- **Bucket contrast** — how the same format-job mutates across buckets (e.g. testimonial → *success-story* for a service). This is where D2C-vs-local insight lives.

## Worked example

`docs/research/ad-library/india-d2c-vs-local-2026-06-15/` — 2 D2C (TWT, Plix) + 3 local (Leverage Edu, Yocket, Treebo). Headline finding: **D2C sells the product (Shop now, ingredient/proof-led); local sells the next step (Book/Apply, an offer-chassis with the hook as the variable).** "Testimonial" becomes a student success-story for the edu brands; "what's-inside" is D2C-only.

## Extending

- New market: change `country`. New angle of brands: change `bucket` labels and sweep.
- More than ~30 ads/brand or pagination: not in v1 (the API returns a top page; enough for a hook/format read). Add a cursor loop if a deep bank is needed.
- Hands-off analysis: the lenses are written so a small SDK agent could run them over `corpus.json` on a schedule — not built yet.
