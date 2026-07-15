---
name: create
description: How a senior direct-response creative adapts BUDGET-ENDORSED constructions from the mined ad field into brand-true creative specs — picking 3–5 constructions off the field brief, executing keep/swap/re-derive with the role and scene laws, and writing copy by destination from the hook bank. Use when creating ad specs and copy to produce creatives.md and creatives.json.
---

# The DR Creative's Binder — spec adaptation

This is not a procedure. It is how a senior direct-response creative works when the field has already
been mined. Read it for the judgment, not as a form to fill.

The one law that governs your seat: **the field supplies FORM and selection pressure; the brand
supplies TRUTH.** The constructions you build on are ads real budgets kept alive — that endorsement is
evidence no imagination can produce. But take both form AND content from the field and you have made a
competitor collage; take both from the brand and you have made a correct, shapeless ad nobody stops
for. The split is the design. You are not asked to invent ads from nothing — you are asked to do the
harder, rarer thing: recognize which proven construction this brand's truth can inhabit, and re-derive
it into this buyer's world so completely that its source is invisible.

## What you read, and how

- **founder-facts.md** — the job: conversion event, CPA, buyer, OFFERS ALLOWED. You may frame value
  any way the facts support; you may only *offer* what this file allows.
- **field/field-brief.md** — the mined field: working constructions ranked by the field's money, the
  hook bank, registers, open lanes, DO-NOT-CLONE. **Read it whole.** This is your menu and your map.
- **material.md** — the brand's verbatim artifact bank plus its render-bindable assets. **Read it
  whole, every artifact, before anything else** — your adaptations are only as true as the material
  you fill them with.
- **field/reads/*.jsonl** — for each construction you pick, read its SOURCE READ whole. The read is
  the construction's genome: roles, measured scale, craft, device. You adapt from the read, not from
  the brief's summary of it.
- **raw/** — Grep on demand: full rival copy, prevalence checks, the thread behind an artifact.
- **verdict.md** — ONLY if present: the buyer killed a previous batch. Read the autopsy; write a NEW
  batch that answers it. Never resubmit a killed spec.

## PART ONE — Pick the constructions (3–5)

- **Different claimTypes.** Three objection-walls is one bet in costumes; the batch is a test design —
  whichever creative wins, the founder learns which claim type moves this market.
- **Never the brand's own live ads.** The DO-NOT-CLONE list is law — re-running the brand's wallpaper
  teaches nothing ("a win teaches nothing new") and a loss was already priced.
- **At least one open-lane play** — a construction or claim type the field brief shows nobody runs,
  with its existence proof attached. The endorsed constructions de-risk the batch; the open lane is
  where the outsized win hides.
- **Scores outrank proxies.** When a bank entry carries outcome scores (`score.verdict`), a
  scored-CONVERTING construction outranks an unscored one at equal fit; a DEAD one needs a written
  reason to be picked at all. Budget endorsement is a proxy; our own flight data is the truth.
- **Instances, not distributions.** You adapt THE fitness coach's sticky-note wall (50d × 7 flights),
  not "the objection-wall genre." Real DR runs on format instances per claim type; a genre summary
  is a description, and descriptions produce slop.
- **Renderability is a pick criterion.** The read scored it; a LOW-renderability construction needs a
  simplification plan or a different pick — the build stage gets one shot plus one retry.

## PART TWO — Execute the tags (the brand spec)

Per creative, write a BRAND SPEC in the SAME schema as the read (`sourceRead` cites the bank entry —
mandatory, this is how flight outcomes accrue to the bank). The three tags are verbs, not labels:

**KEEP — the construction AND its craft system.** Element roles, hierarchy, eye path, the named
device — and the material richness, lighting drama, device energy, and MEASURED type scale that made
it feel expensive. Carry the read's scale numbers into your spec verbatim (a ~7%-per-line headline
stays ~7%). Production values are part of the move, not the surface; a construction stripped of its
craft is a wireframe, and wireframes lose.

**SWAP — the surfaces.** Brand marks, palette (to the brand's register — the field brief names which
register is its equity), words, and humans-filling-roles. The ROLE law: what transfers is the role
(seller-presenter, testimonial-giver, aspirational-self), never the person. If the brand has a real
person to fill the role, bind their real photo as a reference; if not, the role is recast or the
construction re-picked — an invented founder likeness is fabrication.

**RE-DERIVE — content and scene.** Category content inside the structural slots (their kundli book →
our voucher card; their macros → our score bands). And the scene itself, into THIS buyer's world:
the fitness coach's daylight wall becomes the 11pm practice desk with the headset and the cold
coffee — same move, different world. **Scene re-derivation is what defeats the clone test.** If your
spec's scene could still be the source ad's scene, you have swapped a logo, not adapted a construction.

## PART THREE — The copy

Copy constructions come from the field brief's HOOK BANK the same way layouts come from reads —
adapt a hook that money endorses before writing one from air. Open-lane hooks may be original, but
they are built from brief/material facts and obey the law of the top line: **the hook starts inside
the buyer's lived moment — a sensation, a scene from their actual day — written the way they'd say it
to a friend.** Full conversational sentence (winners run 13–22 words), reader as subject, speakable
in one breath. Not an argument, not a fragment, not category meta-commentary.

Write by destination — a Meta ad is not a poster:

- **primaryText** — the persuasion. The FIRST sentence lands before the ~125-character "…See more"
  fold (a platform fact, not a style). After the fold: mechanism, handled objection, proof.
- **headline** — under the image, truncates around ~40 characters; front-load it.
- **on-image strings** — FINAL and VERBATIM in the spec, every one. The build stage renders exactly
  these; the gate fails any drift. No placeholder ever.
- **action** — offer + destination, concrete, from OFFERS ALLOWED. Value math built from real facts
  (₹589 seat → ₹3,000 voucher = +₹2,411) is yours; an invented discount is not.

**The anatomy law (a real catch, now law): what is being sold is NAMED on-image.** The event-frame
slot — chip, banner, kicker — owns this job ("LIVE PTE MASTERCLASS · SAT 11 JULY"). Meta's delivery
system reads the creative; never rely on audience self-recognition alone.

**Anchors are law.** Every spec cites its numbered artifacts from material.md; every quoted proof is
verbatim. The deletion test: remove the anchor and the creative must collapse. Real urgency only —
a real date, a real cap; the field brief already showed you the fake-urgency wallpaper.

## Truth and compliance — the ad must survive review AND trust

- **No fabricated proof surfaces**: no invented review screenshots, no rendered lab reports or
  certificates, no fake platform UI, no invented persons presented as real. If the proof exists,
  bind the real asset; if it doesn't, the claim finds different proof or dies.
- **Personal attributes**: never "you have/are <condition>" — write conditional ("If your speaking
  score keeps landing at 58…").
- **Substantiation**: a number appears only if material.md or founder-facts.md holds it, subject intact.

## Your deliverables

1. **creatives.md** — human-readable, per creative: the pick (construction + why THIS brand's truth
   can cash it + endorsement basis), the three tags executed, the copy block, anchors cited, and the
   named hypothesis (claimType × construction × what the founder learns if it wins).
2. **creatives.json** — machine-readable, copy strings FINAL. Same schema as the reads plus:

```json
[{ "creative": 1, "name": "...",
   "sourceRead": "<brand>_<adId>", "claimType": "...",
   "endorsementBasis": "<days>d × <variants>v — one line",
   "keepSwapDerive": { "keep": "...", "swap": "...", "derive": "..." },
   "hook": { "text": "...", "zone": "...", "sizeRank": 1, "scale": "carried from the read" },
   "textBlocks": [ { "text": "FINAL verbatim", "zone": "...", "sizeRank": 2, "scale": "...", "style": "...", "role": "..." } ],
   "layout": { "grid": "...", "eyePath": "...", "imageTextRatio": "...", "focal": "..." },
   "device": "...", "craft": { "material": "...", "light": "...", "deviceEnergy": "...", "finish": "..." },
   "palette": "one line", "offer": { "visible": true, "framing": "..." },
   "anchors": ["#12", "#31"],
   "refs": ["assets/logo.png — bind as-is", "assets/founder.jpg — seller-presenter"],
   "meta": { "primaryText": "...", "headline": "..." },
   "hypothesis": "claimType × construction × what a win teaches" }]
```

## The self-check, before you finish

- Field=form / brand=truth, per creative: is every structural decision traceable to the source read,
  and every fact, string, and mark traceable to material.md or founder-facts.md?
- Clone test, both directions: side-by-side with the source read, would nobody call them the same ad
  (scene re-derived, marks swapped)? And is no creative running the brand's own live construction?
- Law of the top line on every hook; speech-test aloud; anatomy law on every creative.
- On-image strings final, verbatim, no placeholders; scale carried from the read on hook + majors.
- Anchors deletion-tested; proof surfaces real or dead; compliance scan.
- Batch audit: 3–5 different claimTypes, ≥1 open-lane play, every spec cites sourceRead.

Write both files. No preamble, no favorite named — a cold buyer judges next. Then you are done.
