# Session 128 — The testimonial format is BUILT and VALIDATED across 13 TWT renders, the MAKER is the keystone, Fork B is locked, and the learnings are ENCODED into the docs

**Date:** 2026-06-14
**Branch:** `new-ui` (everything uncommitted)
**Status:** A **build + validation + encoding session.** We wrote the first format entry (testimonial), validated the whole approach through **13 hand-run TWT renders (v1→v13)** — each one exposing the next layer of genericness — crystallized the cell's generative method (**the maker is the keystone**), locked the format-library architecture (**Fork B: thin format docs over a shared art-direction method**), ran an **Andromeda-playbook calibration**, and **encoded the learnings into three cell reference docs.** `v13` is the locked reference image.

> **Read first (continuity chain):** this doc → `SESSION_127_*` (the design session that set up this build: machine-not-skin, critic+vision-gate pulled, testimonial-prototype-next) → `SESSION_126_*` (the format-library pivot + the frozen 18-format list) → `SESSION_125` (assembly-not-invention) . Memory: `project_first_principles_redesign` (S128 block), `feedback_binder_teaches_thinking_not_looking`.

---

## Part 0 — The arc in one paragraph

We set out to build one format (testimonial) and test it on TWT. Building the doc was easy; **running it was the whole session.** Thirteen renders, each exposing a layer of genericness the previous fix revealed: v1 generic (look defaulted) → v2 type derived from the brand → v3 the *whole frame* art-directed at clay-completeness (composition, shot, light, background) → v4 a text-to-image test that proved the **edit-vs-t2i tradeoff** (fidelity vs composition) → v5 the **setting derived from the idea** (a real kitchen, not a studio void) → v6 **one maker** governs everything (a real phone photo) which killed the golden-gloss → v7 the **type re-derived to a native caption** → then an **Andromeda-playbook calibration** → v8–v9 two wrong turns (a full-screen screenshot; a frankenstein edit) that taught the last two rules → v10–v11 a fresh lifestyle photo + a pinned review card, then **every element named** (which phone, angle, light, surface…) → v12 a glass→shaker edit the user rejected on principle → **v13 the locked image,** regenerated fresh. The through-line that emerged and got a name: **every generic default is a visual decision left to the model; the cure is to derive it from a source, and the keystone source is the MAKER** — read the copy's *provenance*, name one real maker, and resolve *every* element from it. We then **locked the architecture** (Fork B — thin format docs over a shared method; the style/type "grammar" is shared, not per-format) and **encoded** the session's rules into `layer-stack.md`, `testimonial.md`, and `shot-spec.md`.

---

## Part 1 — The 13-render gauntlet (each kill named a rule)

All hand-run via `server/tmp-cell-render.mjs` (edit endpoint, fal Nano Banana Pro, the real `light-cocoa-24g-whey.png` bound) unless noted. We were the gate (no critic, no auto vision-gate — per S127). Prompts + PNGs in `cloudflare/eval/mini-eval/results/cell-dryrun/twt-testimonial-v{1..13}*`.

| v | change | verdict → rule learned |
|---|---|---|
| v1 | testimonial.md v0.1 as written | works but **generic** — serif, centered, studio. Copy/structure fine; the **look defaulted.** |
| v2 | type derived from brand DNA | **"typography generic" fixed** — bold grotesque, mixed-weight ("No bloating" heavy / "at all." light, the pack's own move). **Look must be derived, not defaulted.** |
| v3 | whole-frame art-direction | **"background/placement generic" fixed** — composition, shot, light, background all decided = **clay-completeness, derived from the brand.** Type-only wasn't enough; the *whole frame* must be decided. |
| v4 | text-to-image (no ref) | **the tradeoff, proven:** t2i gives composition control but **breaks product fidelity** (wrong wordmark, missing Trustified seal). Edit = fidelity / weak composition. **Production answer = composite** (scene + real product). |
| v5 | setting from the idea | studio void → **real kitchen morning.** **Setting comes from the idea (where the claim lives); treatment from the brand.** I'd taken the setting from the brand's packshot style = a void that argues nothing. |
| v6 | one maker (phone photo) | **golden-gloss + type-clash fixed at once.** Naming ONE maker made light + type + framing cohere. **The maker is the keystone.** |
| v7 | type re-derived to native caption | the brand-poster type was a leftover from a different maker; **the maker governs the type too** (native caption, not editorial headline). |
| — | **Andromeda calibration** (see Part 3) | native > polished (blesses v5→v6); the voice we chose is **too mild**; the compounding loop is the **downstream gap.** |
| v8 | full-screen Amazon screenshot | **wrong turn** — over-literalized "maker = screenshot" and nuked the lifestyle scene. |
| v9 | edit v7 + add review card | **frankenstein** — dragged the old caption AND the two-platform reviews. Taught: **the maker disciplines the copy** (one source per artifact). |
| v10 | fresh kitchen + pinned review card | **the right format** — lifestyle photo + a horizontal review screenshot card. One review. |
| v11 | **every element named** | specificity paid off — iPhone HDR, 35° angle, 7:30am cool window light, marble counter, soft-focus kettle, froth, cocoa-dusted scoop. **"Vague = generic": name every element or the model averages it.** |
| v12 | edit v11 → shaker | user rejected on **principle:** don't edit a prior render. |
| **v13** | **regenerate fresh + shaker** | **LOCKED.** Fresh from prompt + product reference. **The prompt is the source of truth.** |

---

## Part 2 — The method that crystallized (the load-bearing output)

Six rules, all one idea — *a generic default is a decision handed to the model; derive it from a source instead.* The keystone source is the **maker.**

1. **The maker is the keystone.** One fiction — *who made this image?* — makes every other decision (light, type, framing, texture) cohere. Two makers fight (a brand-poster headline on a real phone photo = two images stapled together).
2. **Read the copy's *provenance*, not just its voice.** "A customer is speaking" → "a customer photo" (still average). "This line is a *verbatim Amazon.in verified-purchase review*" → the maker is **that review, as a real screenshot.** The artifact the copy already lives in *is* the maker. (The old cell only had "the voice picks the maker" — abstract. This is the sharpening.)
3. **Vague = generic (the sweep).** "Shot on a phone," "clean text," "natural light" hand the specifics back to the model exactly like silence. Before every render, **walk every element** — which device, the angle, the light's time/direction/quality, the surface, everything in frame, the type, the CTA — and name each. *Every pixel is a decision.*
4. **Setting from the idea; treatment from the brand.** Where the scene happens = the claim ("no bloating, daily" → a real morning kitchen). How it's lit/finished = the brand. Take *both* from the brand's packshots → a packshot void.
5. **The maker disciplines the copy (honesty).** Only copy that could *truthfully* live in the artifact survives. One Amazon screenshot holds Amazon reviews — a second-platform quote moves to the **post copy** or the maker changes. The specific maker is an **honesty gate** the vague look hides (a flat caption bar holds any two quotes; a real screenshot exposes the lie).
6. **Native by default; the prompt is the source of truth.** Reach for the raw native maker first (polished reads as *an ad*); premium is the exception you argue for. And every render is **generated fresh from the prompt + the real product reference** — never edited off a prior render (daisy-chaining compounds artifacts and drifts product + copy).

**Type and style are *derive-not-menu*** (Part 4 below): the same logic — a *grammar of signals* the cell reasons over, not a font/style menu it picks from. Typography is one slice of the style derivation.

---

## Part 3 — The Andromeda-playbook calibration (Adam Taylor article)

User supplied `Andromeda_playbook.md` (Adam Taylor, June 2026) and asked twice "are we going the right direction?" / "are we choosing the right voice and maker?". Honest read:

- **Validates the core thesis.** "You don't need more ads — you need messaging-to-customer alignment" + the "Raw Diet" of verbatim customer language = *our* whole redesign. "Polished ads are red flags; an ugly ad with the right words beats a $50k studio shoot" = **the v5→v6 turn, blessed.**
- **The gap it exposes — the compounding loop.** Find a winner → *compound* it (same hook new format, swap body, static→podcast) on spend data. **We have none of it** — we make first bets, not the loop. Correctly sequenced *after* the bet-maker, but it's the real next system (the deferred `feedback_loop_architecture`).
- **The calibration we took: native by default** (not premium) — our machine kept drifting to polish; the article says that pull is the enemy for everyone.
- **The miss we DEFERRED: the voice is too mild.** "No bloating at all." is the clean *relief*, not the visceral *scar* ("I'd given up on whey, every one wrecked my stomach"). This is a **research-depth** problem (mine the raw 2-star/Reddit/post-purchase language) before it's a cell problem. **User parked it: "we will do it later."**

---

## Part 4 — Architecture locked: Fork B + style/type as grammars

- **Fork B — thin format docs over a SHARED method.** A format doc carries only what's format-specific (job · copy skeleton · material gate · forbid · worked example). The **look is derived by the shared method** (`layer-stack.md`), not decided per-format. This **supersedes S127's "each format carries its own style guide"** — the session proved the look-moves (maker, setting, type) are *universal*, so duplicating them into 18 fat docs would drift. The 17 remaining formats are therefore **cheap** (thin recipes over one brain).
- **Style is *derived via a grammar*, not picked from a menu.** A "style grammar" teaches what each visual *vernacular* signals (photographic-native = real/honest; sculptural = crafted/story; meme = scrappy; poster = loud; newsprint = borrowed-trust) so the cell *derives* the vernacular from maker + buyer-furniture + idea + brand + comp-wallpaper. **We do NOT extend the 14 art-style workflows** (the old menu shape).
- **Clay is recontextualized:** from "menu item #7, picked by category" → **a complete machine the derivation routes INTO** when the vernacular lands on sculptural/story/emotional (the local hotel, the school). Keep the good machines; route to them; don't pick blind.
- **Type = one slice of style.** Same grammar shape (rounded=friendly/young · condensed-caps=loud · neutral-grotesk=premium · handwritten=personal · system-UI=native-social). **Honest ceiling:** text prompts specify a *vernacular* (renderable + derivable), not an exact typeface.
- **The deeper catch (v7/v8 thread): "plain caption" was still too abstract.** A real person doesn't type a clean white bar — they use an IG Story / a real review screenshot / an iMessage. The grammar must carry **real conventions to resolve to**, not abstractions. (A *real* review screenshot is honest/native; *faking* stars on an invented card is the forbidden version.)

---

## Part 5 — What got ENCODED this session (the deliverable)

Three cell reference docs, edited live (read-before-edit, exact lines):

- **`agent/.claude/skills/cell/references/layer-stack.md` — 4 sharpenings:** (1) "no silent decisions" → **"and no vague ones"** + the pre-render **sweep**; (2) **setting-vs-treatment** added to derivation step 1; (3) step 3 "Who made this image?" rewritten to the **keystone / read-provenance / artifact-makers (review screenshot, IG story, text thread) / native-by-default**; (4) new **"the maker disciplines the copy"** honesty paragraph.
- **`.../references/formats/testimonial.md` — rewritten v0.1 → v0.2 (thin Fork-B shape):** removed the brand-identity "look tiers" that bypassed the maker; the look is now *derived* by the shared method; added the maker-honesty rule (one source per artifact), the every-element sweep, native-default, and the **validated v13 worked example** (Amazon screenshot pinned on a real phone photo; supporting quote → post copy).
- **`.../references/shot-spec.md` — 2 render disciplines:** sweep for **vagueness** (not just completeness); **the prompt is the source of truth** (render fresh from prompt + product reference, never edit a prior render).

The cell `SKILL.md` itself is **still untouched** (the match→derive wiring is gated until the approach is proven across a 2nd format — see Next).

---

## Part 6 — `v13`, the locked reference image

A 4:5 native testimonial: a real customer's morning — the burgundy TWT Light Cocoa pouch + a 600ml protein shaker (cocoa shake) + a cocoa-dusted scoop on a white marble kitchen counter, cool 7:30am window light, iPhone-HDR look — with **one real Amazon review pinned as a screenshot card** (5 orange stars, "No bloating at all.", Verified Purchase · Amazon.in, Rohan K.) and a small burgundy "Try it →" CTA. It is the full method in one frame: **specific maker (the real review) · one honest review · real product (reference-bound) · native, not tidy · every pixel named · generated fresh.** Honest notes: reviewer name/date are stand-ins (in production they come from the real review); the voice is still the mild "no bloating" (the rawer voice is the deferred upstream fix).

---

## Part 7 — Open threads / deferred

1. **The rawer voice + research depth** — mine the visceral skeptic-confession language (2-star reviews, Reddit, post-purchase surveys). User explicitly parked it ("we'll do it later").
2. **The compounding / feedback loop** — the Andromeda back-half we don't have. Downstream of the bet-maker.
3. **The composite render mechanism** — for the abstract editorial-card layout where the product must be tiny-in-corner, edit over-scales and t2i breaks fidelity → generate-scene-then-composite-real-product. (In a *scene* context, v13 shows the edit endpoint gives both — so this only bites the flat-card layout.)
4. **angle→format matching table** across all 18 — principle exists, table unwritten.
5. The **cell `SKILL.md` rewrite** stays gated until the thin-mold proves it generalizes (founder-POV).

---

## Part 8 — NEXT SESSION (S129)

1. **Write the two net-new shared references: the `type grammar` and the `style grammar`** (binder-style — signals + when-earned + real conventions to resolve to, NOT a menu). These are the missing "reference books" the whole conversation circled.
2. **Build the 2nd format — founder-POV** (the native SMB unlock, structurally different from testimonial: founder voice, mostly-written copy) — to **prove the thin-mold + shared method generalizes** beyond a lucky testimonial special-case. Run it end-to-end on a fixture, hand-gated.
3. If it holds → **wire the match→derive flow into the cell `SKILL.md`** and start scaling the remaining formats. If not → the mold needs work before scaling.

---

## Part 9 — Repo state

- **Edited (uncommitted, `new-ui`):** `agent/.claude/skills/cell/references/{layer-stack.md, formats/testimonial.md, shot-spec.md}`.
- **New artifacts:** `cloudflare/eval/mini-eval/results/cell-dryrun/twt-testimonial-v{1..13}*.{png,txt}` (13 renders + prompts); `server/tmp-cell-render-t2i.mjs` (the text-to-image variant renderer, added for v4).
- **Untouched:** cell `SKILL.md`, `critic.md`, `counterexamples.md`; the art-style skill; all binders; the harness.
- The frozen 18-format list still lives in **S126 Part 6** (unchanged).

---

## Part 10 — User verdicts this session (calibration corpus — verbatim)

- *"this looks good but not polished. i mean visually it looks generic and the typography is also generic."* (→ v2 type derivation)
- *"the overall background and how the product is placed is still looks generic … we are not following the clay style methods … consider everything … right from the font, composition, shot everything a brand art director does."* (→ v3 whole-frame)
- *"why does the model didnt think about the background and placement? … it could be placed on a kitchen floor or gym floor … wheres the gap here?"* (→ setting-from-idea)
- *"it defaulted to that warm gold lighting lol. also the typography doesnt suit with the scene."* (→ one-maker)
- *"how do you come up with the type style … is it how a person add text taking from the phone?"* (→ provenance / real conventions)
- *"never leave anything to the model imagination or else we see generic outputs … every pixel counts … this is not relevant to text only but every pixel including the CTA."* (→ the sweep)
- *"there are two reviews here in the text right?"* (→ maker disciplines copy)
- *"are we choosing the right customer voice and maker?"* (→ Andromeda: voice too mild, deferred)
- *"i want a new image from scratch and thinking from you."* / *"you again took the previous image as reference?"* (→ prompt-is-source-of-truth)
- *"every pixel counts. why are you keep ignoring stuff?"* (the through-line of the whole session)
