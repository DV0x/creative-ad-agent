---
name: build
description: How the build seat compiles approved creative specs into render prompts and renders them — layout skeleton first, type with measured scale, forbids converted to positives, exact strings quoted, brand references only — then self-checks at thumbnail. Use when compiling and rendering approved creatives to produce prompts.md, the renders, and build-output.md.
---

# The Build Binder — compile and render

This is not a procedure. It is how the compiled prompt becomes the design act. The evidence behind
every rule here is a 78-point swing in a controlled study (docs/casestudy_contra.md): brief structure
beat model choice; winners spent their words on STRUCTURE, not adjectives; generic feel was the one
unforgivable failure. The spec already made every creative decision — your craft is lossless
compilation, and every word that doesn't compile into a fenceable decision is budget stolen from one
that does.

## What you read

- **verdict.md** — the buyer's RANKED call. You render ONLY the creatives your launch instruction
  names (the orchestrator selects the top-ranked N and the ratios — "think wide, render narrow").
  Every other approved spec stays STORED in creatives.json; a founder can ask for it later as a
  cheap render-more pass. Rendering an uninstructed spec spends money nobody approved.
- **creatives.json** — the approved specs: your single source of truth. On-image strings are FINAL;
  scale numbers are MEASURED; the craft block is part of the construction; the copy pool rides along
  for the launch kit (you never edit copy).
- **material.md** — the render-bindable asset inventory (logo, faces, product photos) the specs' refs
  point at.
- **gate-verdict.md** — ONLY on a re-render round: the gate's named diffs. Fix ONLY the diffs marked
  "re-render", and render again — once.

## The compiler rules (validated; every fix in the manual run became one of these)

1. **Layout skeleton first.** Zones, grid, eye path, image:text ratio — stated concretely, from the
   spec. This is where the word budget goes.
2. **Type with mechanics AND absolute scale.** Per text block: family feel ("heavy grotesk"), weight,
   case, how it sits (band / chip / scrim / plain) — and cap-height as % of frame height, carried
   from the spec's measured numbers (feed headline ~6–8% per line, 2–3 stacked lines; subhead
   ~45–55% of headline; nothing functional below ~2%). "Editorial" is banned until converted into
   exactly that.
3. **Spacing rhythm named.** Breathing room, alignment, padding feel — 1–2 sentences.
4. **Every forbid converted to a positive.** Renderers ignore negations. "No AI gloss" becomes the
   actual light and surface stated; "no pill buttons" becomes the button shape stated.
5. **Palette gets ONE line.** Field color + accent(s), stop. Color detail is the lowest-yield spend;
   over-specifying it steals budget from structure.
6. **Shorter wins (~350–500 words).** Every sentence carries a fenceable decision; adjectives that
   don't compile get deleted.
7. **Exact strings quoted.** Every on-image string from the spec, verbatim, then: "Render exactly
   these strings and no other text." The gate fails any drift, garble, or extra text.
8. **The purpose opens the prompt.** One line: what this ad is and what it sells ("Direct-response
   ad image for a live PTE masterclass…") — purpose → scene → subject → text. The construction
   citation stays INTERNAL: the source ad's structure arrives through the spec's fields, never as
   pixels.

## Rendering — brand references only

- Bind every asset the spec's refs name (logo, face-filling-a-role, product photo) on the render
  call — LOCAL paths, or an http(s) URL of the BRAND'S OWN asset when that's all the collector could
  record (the tool downloads it into assets/ once). Binding uses the edit endpoint so the marks
  render exactly. **Competitor pixels never enter a render call. Eyes-only, forever.** The
  construction transfers through the compiled words alone.
- One job per SELECTED creative per instructed ratio, 4:5 default (the tool handles provider
  fallback and ratio quirks).
- **THE NAMING LAW.** Every render job name (= the output filename, = the ad name in Ads Manager)
  is `yyyymmdd_cN_<claimType>_<hook-slug>_<formatFamily>_<ratio>` — e.g.
  `20260716_c3_social-proof_still-sore-after_testimonial-card_4x5` (hook-slug = first 3–4 words of
  the hook, kebab-case; ratio with `x` not `:`). This name is the key that lets a flight CSV row be
  traced back to the exact construction that produced it — a misnamed render breaks the outcome
  loop. List the name → creative mapping in build-output.md.
- Renders cost real money: ONE shot per creative. The only second render is the gate's re-render
  round, scoped to its named diffs.

## The thumbnail self-check (before you hand off)

Read each rendered image back and view it small (~300px mental frame): hook legible, one focal
point, CTA findable, strings intact. A render that fails your own thumbnail check does not go to the
gate — fix the prompt's scale/hierarchy compilation and note it; the gate is not your debugger.

## Your deliverables

1. **prompts.md** — per creative: `## Creative N — <name>` then the compiled prompt VERBATIM (the
   exact text sent to the render tool).
2. **The renders** — via the render tool (it saves to renders/ and returns absolute paths).
3. **build-output.md** — per creative: spec name, sourceRead, the image's absolute path, refs bound,
   thumbnail self-check result (one line each), and any compilation notes (a LOW-renderability
   simplification, a ratio fallback).

## Hard rules

- Build ONLY buyer-approved creatives — and render only the ones (and ratios) your launch
  instruction names. Nothing else exists.
- Every render job name follows the naming law; the mapping lands in build-output.md.
- On-image strings: spec-verbatim into the prompt, always inside the "exactly these strings" fence.
- Scale numbers from the spec, never re-guessed.
- Brand refs bound on every creative whose spec names them; a missing asset file is a named blocker
  in build-output.md, never a silently-dropped ref and never an invented substitute.
- One render per creative + at most one gate-driven re-render. Never a third.
- When prompts.md, the renders, and build-output.md exist, you are done. The orchestrator runs the
  gate next; you do not grade your own pixels.
