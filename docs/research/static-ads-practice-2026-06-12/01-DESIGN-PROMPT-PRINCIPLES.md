# Design-prompt principles for Nano Banana Pro / GPT-image — research synthesis (r3)

**Question:** how do creators/designers prompt these models to get designed, non-slop graphics?
**Sources:** Google's official Nano Banana prompting guides, Higgsfield high-control guide, Flyne anti-slop recipes, OpenAI image prompting guide, GPT-Image-2 poster prompt libraries, designer guides (3C formula, design-system prompting, Swiss/brutalist vocab). Raw in `r3-q1..q6-*.md`.

## The one-line diagnosis of our FP prompts

We wrote **zone maps** (what goes where + exact strings) with **no design direction** — no medium, no idiom, no hierarchy ratios, no grid numbers, no palette discipline, no texture. "Anything the spec doesn't decide, the image model decides" — and the model's default IS the AI look. The research confirms the user's thesis: the model is capable; the prompt has to carry the design.

## The 10 principles (each traced to sources)

1. **The model obeys a schema, not vibes.** Subject → composition → action → location → style, plus camera/lighting/format blocks (Google official). Command-line precision beats conversational filler — "remove polite phrases; every token is a strict instruction" (Higgsfield). Our prompts were already structured — keep.
2. **Name a real MEDIUM/PROCESS — the #1 anti-slop move.** "Screenprint-like ink texture," "riso print with visible misregistration," "two-color offset," "letterpress," "visible paper grain." The AI look = no medium specified → default digital render (waxy gradients, plastic light). Naming a print process imports a coherent aesthetic WITH built-in texture and constraints. For photo: "camera physics" — film stock, grain, lens imperfections, "no HDR, no over-sharpening."
3. **Limit the palette explicitly and kill gradients.** "Limited two-color palette (deep midnight blue and neon orange)," "muted CMYK spot colors," "flat shapes, no gradients." Unlimited color = AI default gradient soup. We named colors but never said FLAT.
4. **Name a design idiom — it compresses 50 layout rules into 3 words.** "Swiss International Typographic Style" = strict grid + asymmetry + sans + negative space + minimal palette. "Brutalist" = oversized grotesk + raw contrast + broken grid. "Minimalist editorial," "retail poster," "premium tech / Apple-like minimalism." Our prompts named NO idiom → the model averaged. IMPORTANT: the idiom must be DERIVED from the brand's identity system (research §5 already extracts palette/type/photography language) — never a menu pick.
5. **Hierarchy as numbers and order, not adjectives.** "Headline very large, subheading half its size, max 3 font sizes," alignment per block, and eye-flow ("how the viewer should scan the design" — headline → product → CTA; Z-pattern). "Large type" is not a decision; a 4:1 scale ratio is.
6. **Grid + spacing as explicit constraints.** "Strict 3-column grid," "24px vertical rhythm," "generous negative space," "clean margin," "consistent margins and alignment."
7. **Type with character, exact strings quoted.** Strings in quotes (we did); font described with character — "bold condensed sans-serif, tight tracking, all caps" not "bold sans-serif"; 1–2 families max; "keep all text sharp and readable."
8. **Light and material even for graphics.** "Soft shadows," "studio light," material cues ("matte," "pebbled leather") for the product; print-flatness for the field.
9. **Define the boundaries of failure.** Negative constraints at the end: "no extra text beyond specified, no logos, no gradients, no random extra words." (We had the frame-inventory — keep; extend with anti-slop negatives.)
10. **Iterate with edit verbs, reuse the skeleton.** Targeted follow-ups ("replace X," "simplify the design, lighter palette") beat re-rolls; a proven prompt skeleton reused across a series = brand consistency (directly relevant to set production).

## Product-ad specifics (r3-q4)

- Two-stage workflows are common (aesthetic base → edit pass for text/product) — our single edit-pass with reference is a valid variant of this.
- "Name what must not change": "keep identity identical," "keep lighting and background unchanged," "preserving product integrity" — our binding block already does this; the run-3 language is consistent with best practice.
- No source had a full headline+badge+CTA+real-product single-prompt template — our use case is ahead of the public material; the principles above are the transferable part.

## Mapping to our prompt anatomy (the upgrade)

Current FP prompt: canvas → maker(job title) → zones+strings → binding → frame inventory.
Upgraded: canvas → **maker + idiom + medium** ("a flat retail poster in the brand's plum/cream system, Swiss-grid discipline, screenprint-flat color, print-grade") → zones+strings **+ hierarchy ratios + grid/rhythm + eye-flow** → **type character per element** → **palette discipline line (flat, N colors, no gradients)** → **finish/texture line** → binding (unchanged, + explicit wordmark stacking) → frame inventory **+ anti-slop negatives**.

Derivation rule (anti-menu): format gives the STRUCTURE; the brand's identity system (from research §5) gives the IDIOM/palette/type voice; the design-direction block is written per ad from those two inputs — never picked from a list.

## Caveat

Pros split on AI-rendered type: some leave text areas blank and set type in Figma. Nano Banana Pro is specifically strong at legible type (its marketed differentiator), and our renders held headline-scale type fine — failure modes live at fine-print scale. We keep AI type (user's call, consistent with [[feedback_nano_banana_prompt_construction]]); revisit only if A/B shows type quality capping the set.
