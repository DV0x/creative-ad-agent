# SESSION 141 — Killing Genericness: Production Audit → Proof Loop → Swipe Bank

**Dates:** 2026-07-06 → 2026-07-07 (one continuous session)
**Question the session answered:** "Outputs are terrible — have we hit the ceiling of what LLMs can do for performance creative, or is something else broken?"
**Answer:** Something else was broken. Three layers of it. Two are now fixed and validated in a running loop; one is isolated, named, and has a known engineering fix.

---

## 1. What happened, in one paragraph

A fresh-mind audit of the **production** agent (cloudflare/) found seven failure classes and confirmed them by pulling 11 real ads from prod R2 — fabricated people, invented stats, clay dioramas for whey protein, offers that never reach the image. The debate that followed produced a thesis: **genericness is not an LLM ceiling — it's summarized inputs + weak selection + ex-nihilo visual prompting.** The thesis was made falsifiable and tested by building a small standalone pipeline (`agent-loop/proof/`) that (a) feeds the creative seat VERBATIM raw artifacts instead of research summaries, (b) puts an independent Opus "media buyer" between concepts and money, and (c) conditions image generation on REAL reference ads (the swipe bank) instead of asking the model to imagine. Two runs on The Whole Truth whey (same founder brief + product photo as the 2026-07-01 agent-loop runs, so the method is the only variable) moved the output from "unusable" to "one image graded postable by a cold Opus buyer, then reversed at the margin" — with every remaining failure traced to ONE renderer-fidelity wall (bound-pack fine print).

---

## 2. Part 1 — Production agent audit (the starting point)

### What production actually is
One **Haiku 4.5** `query()` (maxTurns 30, $3 cap) in the sandbox container runs everything: `orchestrator-prompt.ts` → research subagent (ONE WebFetch of the homepage) → `hook-methodology` skill → `art-style` skill (category→style lookup tables, 8 workflow templates) → nano-banana MCP → ship. No step ever looks at the generated images. Skills run in-context (same Haiku session). Default style: Anderson Clay Diorama (orchestrator prompt line 47 — contradicts the art-style skill's category routing, and fires in practice).

### The seven failure classes (all confirmed in real outputs)
1. **Open loop** — nobody ever views the images; any bad step ships.
2. **The ad is the homepage rearranged** — research = one homepage fetch; hooks must be "traceable to research" → hooks can only re-say the website.
3. **Style is a lookup, not a decision** — category tables + clay default (whey protein got clay bodybuilders; a mortgage brokerage got a Wes Anderson diorama with studio lights IN frame).
4. **Prompt mush** — Haiku compresses the 400-word workflow templates into ~100-word blobs; real July-2 prompt contained "Three-column grid layout on desktop, single-column stack on mobile" — responsive-web specs sent to an image model.
5. **Fabrication** — every social-proof ad contained invented people ("Reya M., University of Warwick"; "Anurag K."; a quote attributed to TWO people at once), invented stats ("150+ students placed"), fake "Verified" badges.
6. **The offer never appears** — the Verbis workshop campaign had ₹589/80%-off/4-hours/voucher IN research; zero of it reached any image.
7. **All creative thinking on Haiku** in one crowded context.

Evidence set: 11 images pulled from `creative-agent-assets-prod` (keys are `users/{userId}/images/{filename}`), viewed directly. Local copies: session scratchpad `prod-images/`.

### Verdict on renders vs prompts
Nano Banana Pro executed every brief competently (text renders clean). **The briefs are the failure, not the renderer.**

---

## 3. Part 2 — The ceiling debate (the ideas that drove everything after)

- **LLM one-pass output is generic BY CONSTRUCTION** — next-token training + RLHF = the modal ad. No prompt escapes a sampling objective. (The user's despair was correct for one-pass.)
- But humans don't create one-pass either: **material → volume → ruthless selection → market feedback**. Compare like with like.
- LLMs are weak at exactly two things: **observation** (can't go look at the world) and **accountable taste** (their picks cost nothing). Strong at **recombination and craft** — once instances are in front of them.
- **Ex-nihilo imagination doesn't exist in humans either.** A human's references are specific retrievable instances; an LLM's training is those instances **averaged into a blur** — it can only sample near the mean. The lever is **adaptation**: supply the specific instances externally that the weights destroyed.
- **"Feed instances, not distributions"** — the unifying principle:
  - material.md = reference board for copy (verbatim voices)
  - swipe bank = reference board for visuals (real ads)
  - product photo = reference board for the product
  - founder brief = reference board for the objective
- Creativity relocates to **selection** (which instances), **collision** (which unexpected pair), **transfer** (cross-category moves) — all things models do well with instances in hand.
- **Template vs form:** a template fixes the OUTPUT (fill-in slots → sameness); a form fixes the GENRE and forces the content decisions open (like film shot types). Test: swap the brand — template still works; form collapses.
- **Performance creative is not an open-loop skill for anyone.** The honest product bar: a portfolio of sharp, testable, truthful bets; the ad account finds winners.

---

## 4. Part 3 — The converged architecture

Three thinking seats + one executor on a code spine, with an LLM router only where language is unbounded:

```
user ─► ORCHESTRATOR (LLM router — session brain: intake, follow-up routing, Q&A from files)
            ▼
   THE SPINE (code, not an agent: sequence, retry ceilings, string guard, DONE sentinel)
     1. COLLECTOR → material.md   (verbatim artifacts; no synthesis allowed to exist)
     2. CREATIVE  → cards.md/.json (anchor→hook→turn→proof/action strings + GENRE + scene;
                                    copy authored ONCE, machine-law)
     3. BUYER pass 1 → kills concepts, ≤2 survive (fresh context, own-money persona)
     [string guard — code: approved strings verbatim in compiled prompt or no render]
     4. IMAGE AGENT → adapts swipe references (moves, never surfaces), renders w/ product bound
     3. BUYER pass 2 → kills renders per-image (pixels vs card vs refs; clone check)
```

Key laws argued and locked this session:
- **The orchestrator proposes, the harness disposes.** LLM for unbounded inputs (follow-up language, unanticipated failures, compound requests); CODE for invariants (gates unskippable, retry/budget ceilings, copy fidelity, critics always fresh-context). Every historical orchestrator failure (7-hr deadlock, skipped critics, early DONE) was a policy failure; every win was compositional.
- **A run is a script; a session is not.** Follow-ups = router picks re-entry point on the file checkpoints (`--resume` + `--stages`); "why this hook?" = answer from verdict.md, NO pipeline.
- **Visual concept belongs to the creative (WHAT), image agent executes (HOW)** — hook and picture are one argument; splitting them recreates the production concept→prompt loss.
- **The creative method** (now in the create prompt): fix the scroll MOMENT → CHARGE pass (voltage, not relevance — frequency-ranking = computing the average) → TENSION PAIRS (the pair is the concept) → STEAL the hook (speech test) → GENRE from the proof problem ("what evidence format would make a skeptic believe THIS claim?") → anti-WALLPAPER check (name what it ruptures).

---

## 5. Part 4 — The swipe bank (what we built; how it's used)

**Why:** text is a lossy channel for visual specificity — "a phone photo of a shake" describes a billion images; the model picks the center. A reference pins ten thousand micro-decisions at once. Human shops run on swipe files (Foreplay, Ad Library); we ported the actual industry workflow.

**Build (`proof/swipe-seed.ts`):** scraped Meta Ad Library via the scrapecreators API directly (the MCP text tool drops image URLs; the raw response has `snapshot.images[].original_image_url`) for 11 brands across ADJACENT categories (Minimalist, CRED, Zerodha, Yoga Bar, Wellbeing Nutrition, OZiva, Huel + same-category TWT & MuscleBlaze) → 25 image creatives downloaded → **Opus curator viewed every one**, admitted 9 (~1/3), tagged each with genre / proofMode / textDensity / sameCategory + **the MOVE** (one line naming the stealable structural idea) → admitted refs uploaded to fal → `proof/bank/index.json`.

**Usage rules (implemented in code + prompts):**
- **Bank is the cache, scrape is the feed, curator sits between.** Raw Ad Library ≠ winners; only curated refs reach the image agent.
- **Retrieval per winner (code, `swipeRetrieve`):** genre match first → safe-refs-first → revealed-winner signal (variants × longevity) → brand diversity (no two refs from one brand — forces abstraction).
- **2-3 refs minimum, never one** (one ref gets traced; two force abstraction — the marble-kitchen lesson made structural).
- **Moves transfer, surfaces never do** (each ref gets an explicit STEALING/DISCARDING line in shotspec.md).
- **Eyes-only firewall:** same-category refs are viewed by the agent but NEVER passed into the fal edit call (anti-trace + anti-convergence); adjacent-category refs may condition the render directly.
- **Gate CLONE check:** overlay each used ref mentally; same surfaces with swapped branding = FAIL.

**Seed-run notes:** AG1 resolved to "America's Got Talent" (max-likes heuristic; harmless — curator judges pixels), several pages were video-only. Bank currently covers: demo-proof (3), annotated-product (3), big-text-statement (2), comparison (1). NOT covered yet: ugc-still, founder-note, document-proof, pack-macro.

---

## 6. Part 5 — The two proof runs (same brand, brief, product photo as agent-loop's 2026-07-01 runs)

### v1 (2026-07-06, `proof/runs/2026-07-06-14-32-09_thewholetruthfoods-com/`) — material + buyer, NO swipe bank
- **material.md**: 45 verbatim artifacts incl. the ₹5,000 salt-scam post, the FSSAI "holier than thou" backlash, the lactose scandal, "3–4 scoops daily, zero bloating", the pack's "no hidden * marks either" — and an honest Gaps list; an unverified heavy-metal claim was correctly EXCLUDED.
- **Buyer killed 6/8** with media-buyer-grade reasons: "foam ≠ gut" (proof/claim mismatch), "anchor stolen from the unflavored SKU", "buying TWT does NOT stop you receiving salt" (broken bridge), Takes 5+7 deduped as one bet.
- **Renders:** pack-macro (beautiful type, but restyled the pack onto kraft paper) + coffee-adjacent kitchen scene (pouch became a TUB, floating tilt). Gate passed one, failed one — and corrected ME twice (the "fabricated" bullets were real pack copy from the reference; the tub-vs-pouch I'd missed).
- **v1 failures → v2 fixes:** copy re-authored downstream (dropped "₹619 off") → copy-at-create + string guard; poster-default composition → swipe bank; set-level gate PASS let a failed image ship → per-image verdicts.

### v2 (2026-07-07, `proof/runs/2026-07-07_twt-swipe/`) — + swipe bank, string guard, per-image gate
- **Cards** (8, with TURN line resolving every hook): standouts "Your protein changed. You didn't notice." / "We raised the price. We kept the cocoa." / "You're not intolerant. Your protein was garbage."
- **Buyer verdict — the sharpest artifact of the session:** killed Card 6 as RETENTION not cold acquisition (off-brief); killed Card 5 for a **fabricated visual pre-render** ("clear dissolve" for an opaque cocoa whey — physical-truth reasoning); killed Card 4 because "the proof answers a different question than the fear it raises"; killed Card 2 (best copy) on buyer logic — strong doubt, weak close, wrong audience. Winners: Card 3 (ugc-still) + Card 8 (demo-proof, coffee).
- **String guard:** PASSED first try — zero copy drift in any render (v1's bug class dead).
- **Renders:** categorically feed-native, information-dense; reference MOVES visibly transferred (CRED's annotation chip → the quote card), CLONE checks passed.
- **Gate round 1:** coffee image **PASS — "would put money behind this, as-is, today"** (first postable-graded ad across all three pipelines); Card 3 FAIL on crisp garbled pack body copy ("doubly damaging for a brand whose entire pitch is 'read our label'"); build's own discarded first render FAIL for leaked layout labels ("TOP / LOWER THIRD / BOTTOM" rendered as literal text — prompt-compilation hazard, now on record).
- **Re-render:** solved garble by crop + Post-it cover, but the pack grew an **invented "TWT®" wordmark** → gate CAUGHT it (pixels-vs-reference, named diff). Safety net works.
- **Gate round 2 TWIST — judge variance measured:** the SAME coffee image that passed round 1 FAILED round 2 (round 2 zoomed harder: "thutteners", "adofferants" resolving in the background pack). Same pixels, opposite verdicts. Round 2 itself concluded the root cause "may be structural: bound-product edit mode regenerates fine print — another roll cannot reliably fix it; de-emphasize the pack instead."
- **Final outcome:** `flagged: structural render fail` — honest, and the flag names the one remaining wall.

**Cost/time:** v1 ≈ 21.6 min / ~$3.9; v2 ≈ 30.1 min / ~$5.1 + seed ~$1.9 + ~22 scrape credits. All Claude spend via Max OAuth.

---

## 7. Scorecard vs "we've hit the LLM ceiling"

| Layer | Before (prod / agent-loop) | After v2 | Status |
|---|---|---|---|
| Copy/concept | homepage rearranged; fabricated people; template hooks | anchored, tension-paired, buyer-graded cards; zero fabrication | **WON** |
| Selection | none / self-blessing critic | cold Opus buyer, 6-of-8 kills with correct reasons, off-brief catches | **WON** |
| Composition | clay default / brand-poster mode collapse | reference-adapted, feed-native, clone-checked | **WON on genericness; OPEN on register** (see finish axis) |
| Copy fidelity to pixels | dropped offers, paraphrase drift | string guard: zero drift | **WON (deterministic)** |
| Product fidelity | invented products | pouch shape/colors hold; **fine print garbles / marks invented at resolvable scale** | **THE remaining wall — engineering, not creativity** |
| Judging | none | works, but single-judge PASS/FAIL at the margin measured noisy | **OPEN — needs a policy** |

---

## 8. OPEN ITEMS — the discussion agenda

### A. Results
1. **Finish axis (the conceded "ugc bias").** I hard-coded raw/native as law (create prompt bans posters; gate NATIVE check penalizes polish) — over-correction to the AI-gloss failure. TWT's own admitted ads are POLISHED. Proposed: `FINISH: raw-ugc ↔ clean-demo ↔ designed-editorial ↔ premium-studio` as a derived card field, anchored to the brand's own ads in the bank; gate checks register-match instead of "looks like a phone photo". **Pending: re-render Card 3 in designed-editorial as the A/B.**
2. **Pack patch (the structural wall).** Bound pack at resolvable scale garbles/invents label text in fal edit mode. Options: keep pack off-hero (partial), **deterministic compositing of the real pack crop over the rendered pack region** (full fix; interacts with the "no post-hoc compositing" preference — but the evidence now says the edit model cannot hold fine print), better binding later. Decide the line: when is compositing acceptable?
3. **Judge variance policy.** Same pixels, PASS then FAIL. Options: 2-of-3 votes on ship decisions; a "borderline" tier for human resolve; deterministic sub-checks (e.g. OCR the pack region and diff against real label text — cheap and objective).
4. **Volume economics.** ~30 min / ~$5 per campaign in the proof loop vs production's $3 cap. What's the acceptable prod budget, and which seats degrade gracefully to cheaper models?
5. **Hook variants.** Buyer approves a concept; media buying wants 3–5 headline variants per concept for the test matrix. Cheap create-stage extension — when?

### B. The bank (user flagged for discussion)
1. **Ownership & scope:** one global bank vs per-category banks vs per-user/brand banks? (Current: one local folder, 9 refs.) The compounding story — every gate-passed ad + founder-liked ad joins the bank — is also a data-asset/moat story: whose asset is it?
2. **Curation policy:** what bar, who sets it, how often re-curated? Current: Opus one-shot, ~1/3 admit rate, MOVE annotation required. Refresh/expiry (feed aesthetics drift ~12–18 months)?
3. **Coverage gaps:** no ugc-still / founder-note / document-proof / pack-macro refs yet — seed round 2 targets? (v2's Card 3 rendered ugc-still on a CROSS-GENRE board — worked, but thin.)
4. **IP posture:** eyes-only firewall for same-category is implemented; is adjacent-category-into-the-edit-call acceptable long-term, or should ALL rivals' pixels stay eyes-only with only the spec transferring?
5. **Ref scoring:** refs that produce gate-passing ads earn score (designed, not implemented). Worth building now?
6. **Production port:** bank storage → R2 + D1 (schema sketch: `swipe_refs(id, r2_key, fal_url, genre, category, same_category, move, proof_mode, source, admitted_at, score)`); curator as a scheduled job; retrieval as a Worker query. When does this enter the production roadmap vs staying a lab asset?

---

## 9. File map (everything new this session; NOTHING in production or agent-loop's main pipeline was touched)

```
agent-loop/proof/run.ts            v2 pipeline (5 stages, code spine, string guard, per-image gate)
agent-loop/proof/swipe-seed.ts     bank builder (scrape → curator → fal upload → index)
agent-loop/proof/bank/index.json   9 curated refs w/ genre + MOVE + eyes-only flags (+ raw/, ads/)
agent-loop/proof/runs/2026-07-06-14-32-09_thewholetruthfoods-com/   v1 run (material.md is the reusable gold input)
agent-loop/proof/runs/2026-07-07_twt-swipe/                          v2 run (cards, verdicts, swipe.json, 4 renders, gate rounds)
docs/SESSION_141_GENERICNESS_PROOF_LOOP_AND_SWIPE_BANK_2026-07-07.md  this doc
```
Prod evidence images: session scratchpad `prod-images/` (11 files, ephemeral — re-pull via `users/{userId}/images/{filename}` keys if needed).

Rerun commands:
```bash
cd agent-loop
npx tsx proof/run.ts <brand-url> --founder=<brief.md> --product=<pack.jpg>          # full
npx tsx proof/run.ts <url> --resume=<runDir> --stages=create,buy,build,gate         # re-enter on cached material
npx tsx proof/swipe-seed.ts            # re-seed bank   (--curate = re-curate existing raw/)
```

---

## 10. One-line summary

The ceiling wasn't the model — it was summaries in, softness in the middle, and imagination asked of a machine that can only adapt; with instances in (verbatim material, real reference ads, the real pack) and a cold buyer twice in the path, the same models went from clay bodybuilders to a buyer-graded postable ad in two runs, and the last wall standing is pack-label fidelity in the renderer — an engineering problem with a compositing-shaped answer.
