# Cell rubric — grading one finished ad against the binder's bars

You grade the cell's deliverable (`cell-output.md`) — the matched format, the takes, the critic verdict, the shot spec, the compiled prompt, the on-image copy, and the vision-gate verdict. You are grading the **text artifact and its judgment**, not the pixels (the image is eyeballed separately). Judge against the cell binder's own standards. Be hard to impress: a clean, on-brand ad that any rival could run still fails.

You are given `thebet.md`, `research.md`, and `competitors.md` as the cell's inputs — judge the copy and claims against what those actually contain.

## Critical criteria (any fail → overall fail)

- **format-matched** — Does the chosen format fit the Bet's angle? The format must follow from the angle's **buyer awareness + the want + the material that actually exists** (each format doc's "Match" section + its hard material gate). Testimonial requires a real verbatim review in the proof; founder-POV requires a real founder + true origin; PAS requires a real documented problem. Picking a format whose material gate the brand cannot meet — e.g. testimonial with no real review, forcing a fabricated quote — is a fail. Naming no format, or a format that contradicts the awareness stage, is a fail.

- **maker-derived** — Is the look **derived from the copy's provenance**, not picked from a menu or defaulted? The deliverable must name ONE maker read off where the proof actually lives (a real review → that review's real screenshot/chrome; a founder line → a real selfie/note; a forum post → that platform's UI), and resolve the elements (light, type, setting, treatment) from that one maker. A look chosen for taste, a generic "clean/premium" default, two stapled makers, or "photorealistic" as the instruction → fail.

- **copy-honest** — Does every on-image claim and quote trace to **the Bet's proof field** (verbatim where the format selects copy; truthfully anchored where it authors)? Any invented statistic, customer, offer, quote, or product detail the files don't contain → fail. Any mandatory crossed → fail. No judgment-call margin: one fabricated claim fails it.

- **swap-test** — Strip the brand name. Could the nearest competitor run this ad unchanged without lying? If yes → fail. The ad must stand on truths only this brand owns (a specific real review, an owned phrase, this buyer's specific scar). Vague praise, category-generic promises, or a structure with no brand-specific content → fail.

## Supporting criteria (overall fails if more than one fails)

- **drawable** — Is the picture concrete objects + an action caught mid-act + a composition a stranger could draw, rather than a theme ("conveys trust")? Impossible-but-drawable passes; undrawable themes fail.

- **spec-complete** — Does the shot spec decide every question the renderer could otherwise answer (objects, action, composition, copy-with-placement, product binding, staging/maker, must-show, forbid) with no field left as "renderer's choice"? And is the compiled prompt the spec translated faithfully — nothing authored anew, nothing dropped, forbids converted to positive decisions?

- **vision-gate-run** — Did the cell actually check the rendered image against the spec as assertions (copy exact, picture performs the claim, product bound, nothing forbidden), name any diffs, and either pass or do exactly one targeted retry? A skipped or vibes-only gate fails.

## Output

Return JSON: for each criterion id above, `pass`/`fail` + a one–two sentence reason citing specific evidence from the deliverable. Then a 2–3 sentence summary. Do not compute the overall verdict — the harness does that from the critical/supporting split.
