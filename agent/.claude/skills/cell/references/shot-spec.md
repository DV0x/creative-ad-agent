# The Shot Spec — schema, compile rules, and the vision gate

The shot spec exists because of one fact: **the renderer answers every question the prompt leaves open, and it answers from the category average.** It has world-class craft and zero loyalty to the concept — it was not in the meeting. The spec is the meeting, written down: every decision the image model could otherwise make, made first, by you, in words.

The governing rule: **anything the spec doesn't decide, the image model decides.** The completeness test: a stranger who never read the strategy could draw roughly the right ad from the spec alone.

---

## The schema

One spec per winning take. Every field filled — "renderer's choice" is not a value.

```
## Shot Spec — [angle name] / [take name]

**Claim**            · the one thing this ad commits to (from the take; traceable to the angle's promise)

**On-image copy**    · every word that appears in the image, VERBATIM, each with placement
                       — hook: "…exact words…" — [where it sits]
                       — CTA (REQUIRED on-image, never caption-only — a small native pill/sticker): "…" — [where]
                       — supporting line if on-image: "…" — [where]

**Objects**          · everything in frame, named. If it isn't listed, it isn't in the picture.

**Action**           · what is happening, caught mid-act. A frozen verb — not a state, not a mood.

**Composition**      · how the frame is arranged: where the eye lands first, where the product sits,
                       where the copy lives, camera distance/angle if it matters to the idea.

**Product binding**  · which reference image of the real product; what must stay true to it
                       (the actual colorway, material, label, proportions — name them).
                       Written with the reference image OPEN, then re-checked against it item
                       by item: anything in this field not visible in the pixels is invention,
                       and a misread colorway becomes the renderer's instruction. The pixels
                       outrank your memory and your prose — describe what is THERE. And the
                       binding states it plainly: **reproduce the upload 100% identical —
                       nothing added, nothing removed**; if the reference is a listing image,
                       bind only the product and ignore its overlays (ribbons, badges).

**Staging record**   · carried VERBATIM from the take's staging line — never authored here:
                       who made this image (the maker) · capture + light · condition (clean/worn) ·
                       type treatment · markup · what it sits in · and the take's one-line reason.
                       The spec CARRIES this decision; it does not make it. "Photorealistic" alone
                       is not a value — texture comes from the named maker (a real photographer
                       brings grain, true shadows, imperfection; AI-gloss is a forbid).

**Must-show**        · the short list the vision gate will assert (the claim's visible evidence,
                       the real product, the exact copy, the on-image CTA, and the hero line legible at thumbnail).

**Forbid**           · the floor items for this category (from the counterexample bank + comp wallpaper)
                       that this picture is nearest to — named so the compile can design them out.
```

Under-decided fields are how concepts die. The failure shapes, from real evals:

- ✗ **Theme as picture** — *"a visual conveying transparency and trust"* → nobody can draw it; the renderer will. Objects, action, composition — or it is not a spec yet.
- ✗ **Paraphrase slot** — *"headline about honesty here"* → the renderer (or the compile) writes its own line; the picture now proves a claim that is no longer on screen. Verbatim or nothing.
- ✗ **Unbound product** — *"the protein pack on a table"* → the renderer draws the category's idea of a protein pack. Bind the reference image and name what must survive from it.
- ✗ **Staging authored at spec time** — the take said only "frame next to pack," and the spec writer filled in cream table + soft window light from instinct → the tasteful center with extra steps. The staging decision belongs in the take, where the critic can kill it; if it isn't there, the take is incomplete — route back, don't improvise here.

---

## The performance bar — three checks beyond "a stranger could draw it"

The schema makes the ad *specific* and *drawable*. But an ad that draws right can still fail as an ad — it is seen at **thumbnail size, in a feed, by someone who never reads the caption.** Three constraints the spec must satisfy, each a way real ads die that the drawability bar doesn't catch:

1. **The load-bearing copy must read at thumbnail.** The one or two lines that *do the selling* — the hook, the proof line — must be legible when the image is shrunk to a feed thumbnail: large enough, high-contrast against what's behind them, squarely facing the viewer. Drawability asks "can the picture be drawn?"; this asks "can the line that *sells* be **read** at the size it's actually seen?" The trap is the native artifact: a real review or chat shown on a *tilted phone in-scene* renders the hero line tiny and skewed — unreadable in the feed, so the proof becomes decoration. Frame whatever carries the load-bearing text **flat and dominant** enough that its words read small. When the text *is* the ad (a pure proof shot), its legibility *is* the composition.

2. **The CTA is a required on-image element.** The ask appears *on the image*, not in the caption alone — most viewers act on the image without reading the post. It is the ad's own added furniture: a small, native pill or sticker, kept light so it doesn't blow a native skin's disguise — the one brand element a native ad is allowed to plant. A caption-only CTA is an incomplete spec.

3. **The setting must be a believable, on-message place for this product.** A specific, un-generic scene can still be the *wrong* scene. The setting has to be a real place a real person would genuinely use, keep, or reach for **this** product — not merely any scene the claim's words suggest. Arbitrary, off-category, or faintly-wrong surroundings break belief even when every element is named (the ad reads as staged, not real). Before you freeze the staging, ask the stranger's question — *"would someone actually be here, with this?"* — and if the honest answer is no, choose a place where the answer is yes. (The real **product** is never the thing to fix here — it is ground-truth; the *scene around it* is.)

These three join the **must-show** list and the **vision gate**: the spec names them, the gate asserts them.

---

## Compile rules — spec → prompt

The prompt is the spec translated into the renderer's language. The step is **mechanical**: it decides nothing new, it drops nothing. If a choice is being made here, the spec under-decided — fix the spec, not the prompt.

1. **Purpose first, then scene.** Open with what the prompt is *making* — "a direct-response ad creative for Meta (IG/FB feed), feed-native and scroll-stopping" — so the renderer reasons about the whole frame as an ad, not a bare scene. Then objects + action + composition become the scene description — concrete nouns and one frozen verb, arranged as the composition states.
2. **Copy in quotes, verbatim, with placement.** The renderer renders text well *when told the exact text and where it sits.* Never describe the copy ("a headline about…"); always quote it.
3. **Reference image bound explicitly.** The instruction names the reference and what must match it, and states the product must be **100% identical to the upload — change nothing, add nothing, remove nothing.** If the reference is an e-commerce listing image, name only the product and tell the renderer to **ignore any overlays** (a "Bestseller" ribbon, a "Trustified" badge) — they are not on the product, and left in they get baked onto the pack. The product in the render is the founder's object, not a lookalike. *(Honest ceiling: the edit endpoint only approximates this — it regenerates the product; literal 100% is a composite of the real pixels.)*
4. **Staging as carried.** The maker and layer words pass through exactly; do not "improve" them, and never collapse them into "photorealistic, high quality" — that phrase is the renderer's default with a bow on it.
5. **Forbids compile into positive decisions.** Renderers ignore negations — "no gradient backdrop" plants a gradient in the room. Convert every forbid into the *actual* decision that excludes it: the background is not "not a gradient," it is the specific surface the spec composed. If a forbid has no positive replacement in the spec, the spec is incomplete.
6. **Nothing extra.** Anything in the prompt that is not in the spec is authoring — the exact failure this step exists to prevent.

**The audit, before rendering:** read the spec line by line against the prompt. Every field present? Copy character-exact? Reference bound? Each forbid replaced by a positive decision? Only then render — once.

**Two disciplines this step enforces:**

- **Sweep for vagueness, not just completeness.** The audit checks every field is *present*; also check every field is *specific*. "Shot on a phone," "a clean kitchen," "natural light" are present-but-vague — and vague renders as the category average just as silence does. Name the device (*which* phone/camera), the angle, the light's time/direction/quality, the surface, the type, **the layout and alignment of the on-image text** (one grid with named margins — not three competing alignments), the CTA (**including its color/fill**), or the renderer decides them. (Full rule: `layer-stack.md`.)
- **The prompt is the source of truth — render fresh from it.** Every render is generated from scratch, from the prompt plus the real product reference. Never iterate by editing a *prior render*: daisy-chaining edits compounds artifacts and drifts both the product and the baked-in copy. A change to the image is a change to the *prompt*, re-rendered. In production there is no "last image" to edit — only the spec, the prompt, and the bound product.

---

## The vision gate — render vs spec (an INDEPENDENT critic)

This gate is **no longer self-administered.** After rendering, the cell writes the frozen spec to `shotspec.md` and spawns an independent **render-critic** (`references/render-critic.md`) — a fresh seat that never saw the cell's reasoning, which VIEWS the pixels and judges them against the spec + the performance bar, then returns PASS or named diffs (each marked "re-render" or "structural"). Write the spec to satisfy the assertions it applies — **the same checks, now as an independent look, not your own**:

- [ ] On-image copy is character-exact, placed as specified
- [ ] The promised action is happening — the picture still *demonstrates the claim*
- [ ] Every object on the must-show list is present and recognizable
- [ ] The product matches the bound reference — **checked pixels-versus-pixels: open the reference image NEXT TO the render. The spec's description of the reference is never evidence; a misdescribed spec passes its own wrong render** (colorway, label, material, proportions)
- [ ] Nothing from the forbid list crept in
- [ ] The maker's texture holds — the image reads as made by the staging record's maker (a phone photo looks phone-shot, a screenshot has real chrome), not as AI-gloss
- [ ] Composition holds (the eye lands where the spec said)
- [ ] **The load-bearing copy reads at thumbnail** — shrink the render to feed-thumbnail size; the line that *sells* is still legible (large enough, high-contrast, facing the viewer), not tiny or skewed on an in-scene screen
- [ ] **The CTA is on the image**, not caption-only
- [ ] **The scene is a believable, on-message place for this product** — a real person would plausibly be *here* with *this*; the setting supports the claim, not arbitrary or off-category (the real product itself is ground-truth, never the thing to "fix")

**On failure: named diffs, one targeted retry.** Each failed assertion becomes a named diff ("copy reads X, spec says Y"; "pack is generic white, reference is the Lagoon colorway"). Re-prompt fixing *only* the diffs — the rest of the prompt stays byte-identical. One retry. If the second render fails, **stop and flag**: a repeated miss means the spec under-decided or the concept fights the renderer — both are fixed upstream of the dice, not by rolling them again.
