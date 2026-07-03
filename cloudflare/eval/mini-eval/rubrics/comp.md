# Comp binder — mini-eval rubric

The deliverable under test is **`competitors.md`** — the file the strategist
reads alongside `research.md` to aim The Bet at a winnable lane instead of into
a saturated one. The judge grades it against the criteria below, given the same
inputs the comp apprentice was given (`research.md`, `founder-facts.md`, the
current date). The harness — not the judge — computes the overall pass:
overall **fails** if any *critical* criterion fails, or if more than one
*supporting* criterion fails.

Grade strictly, but grade for the right thing. Comp is **best-effort, never
blocking** — a thin field honestly read is a PASS; the bar is judgment and
provenance, not completeness. A junior lists ten rivals, paraphrases each
homepage, never finds the open lane, and invents a "visual zeitgeist" from
training priors without opening the Ad Library. It looks thorough. It hands the
strategist a directory and no decision. That is a FAIL even when it looks clean.
You are grading the read of the *field* — the structure — not the length of the
list.

---

## Critical criteria — any one failing fails the whole file

### `sourced` — every claim traces to a citable surface

Every specific in `competitors.md` — a named rival, a price anchor, a
market-share figure, a clustering observation, an ad's copy or format —
attaches to a source the apprentice could point to: a `search_results` URL
(attributed by domain), a fetched page, or a ScrapeCreators Ad Library record.
Ad observations trace to the `competitor_ads` result (the page, the ad's copy,
its days-running / variant figures).

- **PASS:** every rival and observation has a surface attached; the judge could
  pick any line and find where it came from.
- **FAIL:** rivals or "everyone does X" claims float without attribution; ad
  observations with no Ad Library record behind them; a visual-zeitgeist
  read with no source (neither live ads nor a labelled trend probe).

### `no-fabrication` — nothing invented, and no measured-win claims

No invented rivals, prices, market shares, ad counts, or category benchmarks.
And the comp-specific landmine: **no claim of measured ad performance.** No
performance data exists for commercial Meta ads — so any statement that an ad
is "high-performing," "their best-converting," or "a proven winner" as if
measured is fabrication. Longevity and variant counts are *behavioural
proxies* and must be written as such ("running 90+ days across 8 variants —
a signal their budget endorses it"), never as results.

- **PASS:** every rival and figure traces to retrieval; ad-strength language is
  framed as a behavioural proxy (longevity / variants / breadth), not a measured
  result; thin signal shown as thin.
- **FAIL:** any invented rival, price, or share; any "this ad converts / their
  top performer" stated as fact; described ad *visuals* (colours, mood,
  imagery) the apprentice never saw — it has the format and copy, not the pixels.

### `white-space-named` — the open lane is identified, inferred, hedged

The point of the file. `competitors.md` names the **white space** — the lane no
rival occupies — and it is *inferred from the clustering*, not asserted, and
verified or hedged rather than flatly claimed. Channel white space (a platform
no rival advertises on) counts when surfaced. For a genuinely crowded field
with no clear gap, saying so honestly is acceptable — but the file must show
the *attempt* and the reasoning, not skip the question. A named lane is
**demand-checked against research's JTBD** — open-and-wanted (the desire it
serves named) vs open-but-unwanted (a trap) vs demand-unverified (research
silent) — never presented as opportunity on emptiness alone.

- **PASS:** an open lane is named and tied to the crowded axes that imply it;
  it is verified with a probe or hedged honestly ("uncontested among major
  players; a few small sellers occupy it"); or, for a saturated field, the
  absence of a clean gap is reasoned and stated.
- **FAIL:** no white space identified at all; or a lane asserted with no link
  to the clustering and no verification ("the artisan angle is open" with
  nothing behind it); the file is a rival directory that never finds the gap;
  or an open lane sold as opportunity with no demand-check against research's
  desire (emptiness mistaken for demand).

### `no-marketing-copy` — no finished creative of the apprentice's own

`competitors.md` is competitive evidence, not a starter pack for the hook
writer. No finished hooks, sample ad lines, "angles to run," or "what we
should do" recommendations. Reporting a *rival's actual ad copy* verbatim
(attributed) is evidence and is fine; writing new copy, or telling the
strategist which angle to pick, is not.

- **PASS:** the file reports what rivals do + the field structure; any ad copy
  present is a rival's real, attributed creative, not the apprentice's invention.
- **FAIL:** sample hooks or ad lines authored by the apprentice; an "angles to
  test" or "recommendations" section; the apprentice prescribing the response
  instead of reporting the field.

---

## Supporting criteria — more than one failing fails the whole file

### `field-segmented` — rivals organised by the tiers that matter

The competitive field is not a flat list — it is segmented into the tiers a
buyer actually weighs (price floor / mass market, branded / premium, direct
peers). The segmentation reflects this brand's vertical and locale.

- **PASS:** rivals grouped into meaningful tiers; the price-floor / "why not buy
  cheap" pressure surfaced where it applies; direct peers distinguished from
  adjacent players.
- **FAIL:** an undifferentiated list of names; obviously wrong-tier grouping;
  or only same-tier rivals when a price-floor or premium pressure clearly exists.

### `axes-read` — the crowded axes named, not just rivals described

§ "Where competitors cluster" identifies the **axes** the field competes on
and which are crowded (table stakes) vs. lightly held — a read of the
structure, not a per-rival summary.

- **PASS:** the competing axes are named; crowded vs. open axes distinguished;
  the read is about the field, not a list of individual rival descriptions; the
  **desires rivals tap** (read from their actual copy, not inferred) are noted
  alongside the claims.
- **FAIL:** the section is a rival-by-rival paraphrase with no axis-level read;
  or asserts an axis is crowded/open with nothing behind it.

### `ad-read-handled` — live ads read as revealed winners, or the rung labelled

The Ad Library section either reads real live ads as revealed winners
(ranked by longevity × variants, framed as behavioural proxy) **or** names the
fallback rung honestly: a labelled Perplexity category-trend proxy, or a named
gap / "rivals don't run active Meta ads." The confidence rung is explicit.

- **PASS:** live ads read with the revealed-winner framing and the right
  rivals' pages chosen (not namesakes); or the fallback rung is clearly labelled
  ("category-trend proxy, not these rivals' ads") or the gap named; format /
  copy / CTA / cadence used for the zeitgeist read, not invented visuals; winners
  read **twice** — the proven craft worth modelling (transferable vs
  advantage-bound) *and* the wallpaper to differentiate the angle from.
- **FAIL:** an unlabelled visual-zeitgeist read with no Ad Library or trend
  source behind it; ads fetched for an obvious namesake page; the rung left
  ambiguous so the strategist can't tell live data from a guess.

### `locale-anchored` — field, ads, and trends anchored to this brand's market

The field read, the Ad Library country scope, and any trend probes are anchored
to the brand's locale and language, and trend / "currently running" claims are
anchored to today.

- **PASS:** rivals are the ones competing in *this* market; `competitor_ads`
  scoped to the brand's country; trend claims dated.
- **FAIL:** a US/global field read for a local brand; ads pulled with no country
  scope when the brand is single-market; "rising format" claims with no date.
