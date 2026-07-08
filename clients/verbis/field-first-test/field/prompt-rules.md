# Prompt compilation rules (from Contra Labs study, docs/casestudy_contra.md + our field reads)

The compiled image prompt is the design act. Allocation rules, in priority order:

1. **Layout skeleton first.** Zones, grid, eye path, image:text ratio — stated concretely, from the
   source construction's spec. This is where the word budget goes.
2. **Type direction with mechanics, not mood.** Per text block: family feel (e.g. "heavy grotesk"),
   weight, case, relative scale (sizeRank), and how it sits on the image (band / chip / scrim /
   plain). "Editorial" is banned until converted into exactly that.
3. **Spacing rhythm named.** Breathing room, alignment, padding feel ("generous margins, one
   centered column") — 1-2 sentences.
4. **Every forbid converted to a positive.** Renderers ignore negations. "No AI gloss" becomes the
   actual light and surface stated. "No pill buttons" becomes the button shape stated.
5. **Palette gets ONE line.** Name the field color + accent(s) and stop. Color detail is the
   lowest-yield spend (odds ratio 0.88 on client-readiness); over-specifying it steals budget from
   structure.
6. **Shorter wins.** Winning briefs averaged ~678 words. Every sentence must carry a fenceable
   decision; adjectives that don't compile get deleted.
7. **The construction citation stays internal.** The source ad's structure arrives via the spec
   fields (we never paste competitor pixels into the render call); the spec IS the reference.

Gate priorities when judging renders (for the render-phase rebuild):
- BLOCKER: generic feel ("could be anyone's ad"), copy not verbatim, fabricated marks/UI.
- MAJOR: layout/spacing drift from spec, type hierarchy lost, product infidelity.
- MINOR/FORGIVABLE: color/contrast imperfection, small polish — fixable, ship-worthy.

## Addendum (v3 lesson): type SCALE is a fenced decision
8. **Absolute scale anchors, not just hierarchy.** Every text block gets a size relative to the
   frame: headline cap-height as % of frame height (feed ads: ~6-8% per line, set in 2-3 stacked
   lines filling its column), subhead = 45-55% of headline, no functional text below ~2% frame
   height. Source-ad reads must MEASURE these fractions (add `scale` to the read schema) so the
   winner's proportions transfer instead of being re-guessed.
9. **Thumbnail self-check before delivery.** View the render at ~300px: hook legible, one focal
   point, CTA findable. This was the old render-gate's test; with no critic in the loop it is the
   compiler's job.
