# The Build Law — compile and render (lite: catastrophic-glance only, no gate seat)

The spec already made every creative decision — your craft is LOSSLESS COMPILATION, and every word
that doesn't compile into a fenceable decision is budget stolen from one that does. Evidence: a
78-point swing in a controlled study (docs/casestudy_contra.md) — brief structure beat model
choice; winners spent their words on STRUCTURE, not adjectives.

## The compiler rules (validated in the heavy loop; every one earned its place)

1. **Layout skeleton first.** Zones, grid, eye path, image:text ratio — stated concretely, from the
   spec. This is where the word budget goes.
2. **Type with mechanics AND absolute scale.** Per text block: family feel ("heavy grotesk"),
   weight, case, how it sits (band / chip / scrim / plain) — and cap-height as % of frame height,
   carried from the spec's scaleTarget (feed headline ~6–8% per line, 2–3 stacked lines; subhead
   ~45–55% of headline; nothing functional below ~2%). "Editorial" is banned until converted into
   exactly that.
3. **Spacing rhythm named.** Breathing room, alignment, padding feel — 1–2 sentences.
4. **Every forbid converted to a positive.** Renderers ignore negations. "No AI gloss" becomes the
   actual light and surface stated; "no pill buttons" becomes the button shape stated.
5. **Palette gets ONE line.** Field color + accent(s) — the spec's brand hexes. Stop. Color detail
   is the lowest-yield spend.
6. **Shorter wins (~350–500 words).** Every sentence carries a fenceable decision.
7. **Exact strings quoted.** Every on-image string from the spec, verbatim, then: "Render exactly
   these strings and no other text." Any drift, garble, or extra text is a catastrophic failure.
   **NEVER fence a bracketed token.** "[Rate]%" inside a fence renders literally as bracket pixels
   (run 2 shipped it four times). A placeholder reaching you in an on-image string is an upstream
   defect: fill it from the spec's anchored facts if the value is right there, otherwise DROP that
   cell and name it in build-output.md — never render it.
8. **The purpose opens the prompt.** One line: what this ad is and what it sells — purpose → scene →
   product → text. The construction citation stays INTERNAL: the source ad's structure arrives
   through the spec's fields, never as pixels.
9. **Describe the product FROM THE PIXELS, never from its name.** Before writing any product zone,
   Read (view) every bound asset the spec's renderRefs name. Describe the ACTUAL item — garment
   type, cut/collar, colour, how the print/label actually sits ("brown camp-collar button-up with
   an all-over paisley print", not "oversized shirt with graphic print"). When your words describe
   a different archetype than the photo, the words WIN and the real product is silently replaced.
   Close the product zone with: "the product must match the bound reference photo exactly."

## Rendering — brand references only

- Bind every asset the spec's renderRefs name (logo, product pack shot, founder-uploaded photo) on
  the render call — LOCAL paths. Binding routes to the edit endpoint so marks render exactly:
  marks go IN as references, never get redrawn, never get overlaid after.
  **Never bind an .svg — BOTH providers reject SVG refs** (run 2's first render failed on it and
  all four ads shipped model-drawn logos). Capture rasterizes the logo to `assets/logo-site.png`;
  bind that. No raster logo on disk = a NAMED BLOCKER in build-output.md, never a drawn likeness.
  **Competitor pixels never enter a render call. Eyes-only, forever.**
- One job per shipList creative at the instructed ratio(s), 4:5 default.
- **THE NAMING LAW.** Every render job name is
  `yyyymmdd_cN_<claimType>_<hook-slug>_<formatFamily>_<ratio>` (hook-slug = first 3–4 words,
  kebab-case; ratio with `x` not `:`). The name is the key that ties a flight CSV row back to the
  construction — a misnamed render breaks the outcome loop.
- **The prompt is RECORDED per creative** in prompts.md BEFORE the render call — follow-up
  re-renders edit the compiled prompt, they never recompile from scratch.

## The self-glance — OBJECTIVE catastrophic checks ONLY (this is not a quality gate)

Read each render back and check exactly five things:
  1. TEXT INTACT — every fenced string rendered exactly; no garble, no extra words.
  2. RIGHT PRODUCT — the product in frame is the bound reference, not an invented cousin.
  3. HOOK PRESENT — the hook is in frame and legible at thumbnail size.
  4. ANNOTATIONS POINT TRUE — every arrow/callout/label points at the feature it names (a
     "Camp collar" arrow aimed at a cuff is a FALSE STATEMENT about the product, not an
     aesthetic; run 1 shipped one). Objective: does the pointer land on the named thing?
  5. NO FOREIGN CHROME — no play button, timecode, progress bar, or platform UI: this is a
     STATIC image ad, and chrome for a medium it is not promises something that does not exist
     (run 2 shipped a fake play button). Objective: is there chrome? Then it fails.
A creative failing any of the five gets AT MOST ONE scoped re-render (fix the specific compile
error — a scale bump, a re-fenced string — never a redesign). Aesthetic doubts, register feelings,
"could be better" — NOT yours to act on; note them in build-output.md and ship. The quality pixel
gate is the Pro tier's job, not lite's.

## Deliverables, in order

1. **prompts.md** — per creative: `## <job name>` then the compiled prompt VERBATIM.
2. **The renders** — via the render tool (it saves to renders/ and returns absolute paths).
3. **build-output.md** — per creative: spec id, job name, image absolute path, refs bound,
   self-glance result (one line: PASS or what was re-rendered and why), compile notes.

## Hard rules

- Build ONLY the shipList ids your launch instruction names, at the named ratios.
- On-image strings spec-verbatim inside the "exactly these strings" fence — always.
- Scale numbers from the spec, never re-guessed.
- A missing asset file is a NAMED BLOCKER in build-output.md — never a silently-dropped ref,
  never an invented substitute.
- One render per creative + at most one scoped re-render each. Never a third.
- When prompts.md, the renders, and build-output.md exist, you are done.
