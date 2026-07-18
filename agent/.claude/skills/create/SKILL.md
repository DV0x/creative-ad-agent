---
name: create
description: How a senior direct-response creative adapts BUDGET-ENDORSED constructions from the mined ad field into brand-true creative specs — designing a PORTFOLIO of 8 genuinely different concepts under the diversity contract, executing keep/swap/re-derive with the role and scene laws, and writing copy by destination from the hook bank. Use when creating ad specs and copy to produce creatives.md and the per-spec files creatives/c1.json…c8.json.
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

- **founder-facts.md** — the job: conversion event, CPA, buyer, OFFERS ALLOWED, and REGISTER (the
  founder's mass-loud / premium-clinical / mix / follow-the-field call). You may frame value any way
  the facts support; you may only *offer* what this file allows — and the batch SPEAKS in the
  register the founder chose: a "mix" decision means a deliberate split you can point to; "follow
  the field" means the brief's register evidence decides, and you SAY which way it decided. The
  batch's register spread is a decision with a name on it, never drift.
- **field/field-brief.md** — the mined field: working constructions ranked by the field's money, the
  hook bank, registers, open lanes, DO-NOT-CLONE. **Read it whole.** This is your menu and your map.
- **material.md** — the brand's verbatim artifact bank plus its render-bindable assets. **Read it
  whole, every artifact, before anything else** — your adaptations are only as true as the material
  you fill them with.
- **field/reads/*.jsonl** — for each construction you pick, read its SOURCE READ whole. The read is
  the construction's genome: roles, measured scale, craft, device. You adapt from the read, not from
  the brief's summary of it.
- **bank/*.jsonl** — the cross-client FORMAT BANK, one file per formatFamily: reads accumulated from
  past runs and seeding hunts, some carrying real flight `score`s. Your second sourcing rung when the
  local field has no exemplar of a family you need.
- **raw/** — Grep on demand: full rival copy, prevalence checks, the thread behind an artifact.
- **verdict.md** — ONLY if present: the buyer judged a previous batch. On a FULL REDO (reject-all),
  write a NEW batch that answers the autopsy — never resubmit a killed spec. On a BACKFILL round
  (some specs survived), do NOT touch the survivors: write only the replacement specs, each answering
  its slot's autopsy AND restoring the portfolio contract below. Replacement specs CONTINUE the
  numbering — the next free `creatives/c<N>.json` — never an overwrite of an existing spec file.

## PART ONE — Design the portfolio (8 specs)

You design 8 concepts, not 8 variations. Meta's delivery system retrieves DISTINCT concepts
(angle × persona × context) and starves near-duplicates; a portfolio that collapses into one family
is one bet in eight costumes. 8 is the target, quality is the floor — if the brand's truth genuinely
cannot fill a slot honestly, leave it unfilled and say so; the buyer kills padding anyway.

**The portfolio contract** — the batch as a whole must satisfy:

- **≤2 specs per formatFamily** (the closed taxonomy the reads carry).
- **≥4 different claimTypes.** Three objection-walls is one bet in costumes; the batch is a test
  design — whichever creative wins, the founder learns which claim moves this market.
- **≥2 personas** — genuinely different buyers or awareness stages, not the same person renamed.
- **≥1 format-lane play** — a family the brief shows is absent locally but proven elsewhere (bank/
  hunt existence proof attached). Rank lane picks by the brief's evidence × fits the diagnosed
  blocker × the brand holds the fuel — then renderable/compliant.
- **≥1 native/anti-polish execution, LOGO-STRIPPED** — feed-native, deliberately un-designed;
  "beautiful, balanced, branded" is feed blindness. Brand marks appear only where that family
  actually carries them.

**Form comes from the most-endorsed exemplar OF ITS OWN FAMILY.** This is the single rule that stops
winner-takes-all collapse: the #1 construction in the brief lends its layout to ITS family's specs
only — a testimonial-card spec sources testimonial-card form, never the price-slash winner's layout
with a quote pasted in. **The sourcing ladder, in order: local field read (a COMPETITOR's read —
the brand's own reads are NEVER on the ladder) → format bank entry (`bank:<id>`) → a hunt dump the
scout brought home → labeled archetype (`archetype:<family>` — the family's table definition, named
as such). NEVER freehand.** A ladder-bottom pick is honest; an unlabeled invention is not — and so
is a thin field: when no competitor read fits, the ladder continues DOWN (bank → hunt → archetype),
never SIDEWAYS into the client's own account. In a thin field the brand's own long-runners will
mechanically top the endorsement ranking — that is the ranking pointing at your own client, not the
market voting (S152: 5 of 9 specs sourced the client's own ads, two of them unmanaged boosted posts).

**The motor law.** Every construction = SKIN (layout/craft/register — always transfers) + MOTOR (the
persuasion engine — price-aggression, rented-celebrity, owned-status, dated-scarcity, certification,
education). The motor transfers ONLY if the brand holds its fuel: a real price advantage, a real
deadline, a real cert. The brief types each construction's motor and the read's `validity` names its
conditions — respect both. You MAY swap the motor explicitly (BSC's discount-math construction
running on ON's value-math), but the swap is NAMED in the spec; an unnamed motor swap is how
fake-urgency deaths happen.

And still, per pick:

- **Never the brand's own live ads — not as constructions AND not as form sources.** The DO-NOT-CLONE
  list is law — re-running the brand's wallpaper teaches nothing ("a win teaches nothing new") and a
  loss was already priced. Borrowing "form only" from an own ad is the same failure in slow motion:
  the founder pays to test a re-skin of what they already run. Own reads exist so you can AVOID
  their constructions; sourcing goes down the ladder instead.
- **Scores outrank proxies.** When a bank entry carries outcome scores (`score.verdict`), a
  scored-CONVERTING construction outranks an unscored one at equal fit; a DEAD one needs a written
  reason to be picked at all. Budget endorsement is a proxy; our own flight data is the truth.
- **Pixel ledger for pixels.** Visual DNA (layout, scale, craft) adapts only from PIXEL-ENDORSED
  reads; a COPY-ENDORSED construction contributes its argument, with form from its own family's
  pixel exemplar (and an honest `copy:` sourceRead).
- **Instances, not distributions.** You adapt THE fitness coach's sticky-note wall (50d × 7 flights),
  not "the objection-wall genre." Real DR runs on format instances per claim type; a genre summary
  is a description, and descriptions produce slop.
- **Renderability is a pick criterion.** The read scored it; a LOW-renderability construction needs a
  simplification plan or a different pick — the build stage gets one shot plus one retry.

## PART TWO — Execute the tags (the brand spec)

Per creative, write a BRAND SPEC in the SAME schema as the read (`sourceRead` cites the bank entry —
mandatory, this is how flight outcomes accrue to the bank). **sourceRead is honest about WHAT was
read:** a plain `<brand>_<adId>` claims a pixel read exists in field/reads/ — cite it only when it
does. When the construction is copy-endorsed only (video/DCO winner — no pixels were ever read),
cite `copy:<brand>_<adId>` and say in `keep` where the LAYOUT actually comes from (an own-family
pixel read, or the brief's craft commons). Implying a pixel read that doesn't exist poisons the
bank and the buyer's side-by-side. The three tags are verbs, not labels:

**KEEP — the construction AND its craft system.** Element roles, hierarchy, eye path, the named
device — and the material richness, lighting drama, device energy, and MEASURED type scale that made
it feel expensive. Carry the read's scale numbers into your spec verbatim (a ~7%-per-line headline
stays ~7%). Production values are part of the move, not the surface; a construction stripped of its
craft is a wireframe, and wireframes lose.

**SWAP — the surfaces.** Brand marks, palette, words, and humans-filling-roles. **The palette is a
FACT, not an inference: bind it from material.md's BRAND PALETTE artifact and cite that anchor in
the spec's `palette` field.** The field's ads inform REGISTER (how loud, how designed, how warm) —
never the brand's colours; two runs shipped another brand's colour system because create read
"equity" off ad pixels nobody had verified. No BRAND PALETTE artifact in material.md → palette is a
named gap driven by the construction's needs, stated as such — never presented as the brand's. The
ROLE law: what transfers is the role (seller-presenter, testimonial-giver, aspirational-self), never
the person. If the brand has a real person to fill the role, bind their real photo as a reference;
if not, the role is recast or the construction re-picked — an invented founder likeness is
fabrication.

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

**Write in the brand's voice, from evidence.** material.md carries VERBATIM brand-voice artifacts —
the site's own headlines, CTA labels, punctuation habits ("100% Private • 🚫 No Spam" is a voice
fingerprint, not filler). Your primaryText and CTAs should sound like the same company wrote them:
reuse the brand's own vocabulary and CTA verbs where they fit, and never introduce a register the
brand's own copy contradicts. The founder-facts REGISTER decision outranks everything; within it,
the voice artifacts are your ear.

**Text economy is part of the construction (a real taste kill, now law).** Carry the source's WORD
COUNT the way you carry its type scale: count the source read's hook/punchline words and treat that
count (±20%) as your budget. A meme punchline lands in ~8 words or it is not a meme; a native
question card speaks in one casual breath; an objection-wall's chips are 2–4 words each. A 16-word
punchline in an 8-word format keeps the joke's words and loses its snap — the construction dies of
explanation. (The 13–22-word law above is for conversational lived-moment hooks; short-snap families
override it — the SOURCE sets the budget, always.)

Write by destination — a Meta ad is not a poster:

- **primaryText** — the persuasion. The FIRST sentence lands before the ~125-character "…See more"
  fold (a platform fact, not a style). After the fold: mechanism, handled objection, proof.
- **headline** — under the image, truncates around ~40 characters; front-load it.
- **on-image strings** — FINAL and VERBATIM in the spec, every one. The build stage renders exactly
  these; the gate fails any drift. No placeholder ever.
- **action** — offer + destination, concrete, from OFFERS ALLOWED. Value math built from real facts
  (₹589 seat → ₹3,000 voucher = +₹2,411) is yours; an invented discount is not.
- **the copy pool** — per spec, Meta's asset-pool shape: 3 primary texts and 5 headlines total (the
  lead + alternates in `meta`). Alternates are genuinely different WAYS IN — a different first line,
  a different lead fact, a different objection handled — never paraphrases of the lead; each obeys
  the fold rules above. Text is free; a real pool is what Advantage+ actually wants.

**The anatomy law (a real catch, now law): what is being sold is NAMED on-image.** The event-frame
slot — chip, banner, kicker — owns this job ("LIVE PTE MASTERCLASS · SAT 11 JULY"). Meta's delivery
system reads the creative; never rely on audience self-recognition alone.

**Anchors are law.** Every spec cites its numbered artifacts from material.md; every quoted proof is
verbatim. The deletion test: remove the anchor and the creative must collapse. Real urgency only —
a real date, a real cap; the field brief already showed you the fake-urgency wallpaper.

**The anchor gate (a real kill, now law): a claim with no anchor `#` never reaches on-image copy or
a motor's `fuelHeld`.** The brief is upstream testimony, not proof — even when it says "the brand
holds X", you verify: Grep material.md / founder-facts.md for the number or claim. Found → cite the
anchor `#` beside it. Not found → the claim is fabrication-in-progress; it dies and the spec rebuilds
on fuel the brand verifiably holds (or the slot goes to a different construction). The tell is
mechanical: if you are writing a fuel or an on-image number and there is no `#` to put beside it,
STOP — the only two unanchored specs ever shipped were exactly the two the buyer killed.

**The gate covers EVERY on-image number, not just the motor (a second real miss, now law).** Before
a spec is final, scan `hook.text` and every `textBlocks[].text` for digits: each number must trace
to an entry in `anchors` and appear VERBATIM as the artifact states it — never rounded, softened, or
"conservatively" restated. A held "350+" written as "300+" is not an understatement; it is an
INVENTED number that no source holds (S152: it reached pixels, with a qualifier no one had verified).
And the same fact carries the SAME number across the whole batch — two specs quoting two different
lender counts is an advertiser who doesn't know its own numbers.

## Truth and compliance — the ad must survive review AND trust

- **No fabricated proof surfaces**: no invented review screenshots, no rendered lab reports or
  certificates, no fake platform UI, no invented persons presented as real. If the proof exists,
  bind the real asset; if it doesn't, the claim finds different proof or dies.
- **Personal attributes**: never "you have/are <condition>" — write conditional ("If your speaking
  score keeps landing at 58…").
- **Substantiation**: a number appears only if material.md or founder-facts.md holds it, subject intact.
- **The compliance lane** (founder-facts.md names it) sharpens these laws:
  · *financial (SAC)*: Meta kills the targeting levers, so the creative carries ALL targeting — and
    the SUBJECT SWAP is law: describe the offer's box ("approvals from 580+ scores exist"), never
    the buyer's condition ("bad credit?" = rejection).
  · *health/wellness*: required disclaimer IN the ad copy; no before/after imagery; outcome claims
    conditional, never personal.
  · *lead-gen*: the post-click promise must match the form/page exactly (LP-congruence is a gate check).
  · *e-commerce*: standard laws apply.
- **Missing hero photo**: when founder-facts says NO HERO PHOTO, every spec is pack-free (families
  that don't demand the product render — text-billboard, testimonial-card, us-vs-them, offer-card…)
  or leans on model knowledge ONLY for a world-famous SKU. Fabricating the pack is never the answer.

## Your deliverables

1. **creatives.md** — human-readable, per creative: the pick (construction + why THIS brand's truth
   can cash it + endorsement basis), the three tags executed, the copy block, anchors cited, and the
   named hypothesis (claimType × construction × what the founder learns if it wins).
2. **ONE FILE PER SPEC — `creatives/c1.json` … `creatives/c8.json`** — machine-readable, copy strings
   FINAL. Each file is a SINGLE JSON OBJECT (not an array) on the read schema plus the fields below.
   You never write `creatives.json` — the harness assembles the spec files into it automatically,
   ordered by creative number. One spec per file always fits one Write: no split-writes, no stitching.

```json
{ "creative": 1, "name": "...",
   "sourceRead": "<brand>_<adId> | copy:<brand>_<adId> (copy-endorsed, no pixel read) | bank:<id> | archetype:<formatFamily>",
   "formatFamily": "from the closed table (carried from the source read/bank entry)",
   "persona": "who this spec speaks to + awareness stage — one line",
   "motor": { "engine": "the persuasion engine", "fuelHeld": "the brand fact that powers it (anchor #)",
              "swappedFrom": "named ONLY when you swapped the source's motor" },
   "claimType": "...",
   "endorsementBasis": "<days>d × <variants>v — one line",
   "keepSwapDerive": { "keep": "...", "swap": "...", "derive": "..." },
   "hook": { "text": "...", "zone": "...", "sizeRank": 1, "scale": "carried from the read" },
   "textBlocks": [ { "text": "FINAL verbatim", "zone": "...", "sizeRank": 2, "scale": "...", "style": "...", "role": "..." } ],
   "layout": { "grid": "...", "eyePath": "...", "imageTextRatio": "...", "focal": "..." },
   "device": "...", "craft": { "material": "...", "light": "...", "deviceEnergy": "...", "finish": "..." },
   "palette": "one line", "offer": { "visible": true, "framing": "..." },
   "anchors": ["#12", "#31"],
   "refs": ["assets/logo.png — bind as-is", "assets/founder.jpg — seller-presenter"],
   "meta": { "primaryText": "...", "primaryTextAlts": ["...", "..."],
             "headline": "...", "headlineAlts": ["...", "...", "...", "..."] },
   "hypothesis": "claimType × construction × what a win teaches" }
```

## The self-check, before you finish

- Field=form / brand=truth, per creative: is every structural decision traceable to the source read,
  and every fact, string, and mark traceable to material.md or founder-facts.md?
- Clone test, both directions: side-by-side with the source read, would nobody call them the same ad
  (scene re-derived, marks swapped)? And is no creative running the brand's own live construction?
- Law of the top line on every hook; speech-test aloud; anatomy law on every creative.
- On-image strings final, verbatim, no placeholders; scale carried from the read on hook + majors.
- Anchors deletion-tested; proof surfaces real or dead; compliance scan.
- The anchor gate, per spec: every on-image number and every `fuelHeld` carries its `#`, VERBATIM as
  the artifact states it (never rounded or softened); any claim you could not anchor is GONE from
  the spec, not softened; the same fact carries the same number across the batch.
- Sourcing audit: no spec's form traces to the brand's own reads (competitor read / bank / hunt /
  archetype only — own ads are DO-NOT-CLONE evidence, never sources).
- Batch audit — the portfolio contract, checked as a whole: 8 specs (or named honest gaps), ≤2 per
  formatFamily, ≥4 claimTypes, ≥2 personas, ≥1 format-lane play, ≥1 logo-stripped native execution;
  every spec's form sourced from its OWN family's ladder; every motor fueled by a cited anchor
  (swaps named); every sourceRead honest (`copy:` / `bank:` / `archetype:` wherever no local pixel
  read exists); the batch's REGISTER spread matches founder-facts' REGISTER decision (and hook/
  punchline word counts sit inside their source budgets).

Write creatives.md and every spec file. No preamble, no favorite named — a cold buyer judges next.
Then you are done.
