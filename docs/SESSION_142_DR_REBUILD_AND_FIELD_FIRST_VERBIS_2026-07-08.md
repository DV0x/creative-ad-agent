# SESSION 142 — DR Rebuild, the Voice Wars, and the Field-First Breakthrough (Verbis)

**Dates:** 2026-07-07 → 2026-07-08 (one continuous session, follows SESSION_141)
**Arc in one paragraph:** Started by diagnosing why the proof-loop renders were slop (our own prompt
skeleton + three-string law forced identical three-band posters; genre was a menu pick). Rebuilt the
agent-loop create side (collect/market/create/buy on the real SDK spine) and validated it on TWT across
three buyer rounds — each round exposing a deeper miscalibration (argument-hooks, swap-test damage, word
caps) that the founder caught and we patched. Then the founder proposed the inversion that finally worked:
**mine the Meta Ad Library FIRST and adapt everything from budget-endorsed constructions.** We ran that
method manually on Verbis Edu (PTE masterclass, real client, live flight) and produced **three publishable
creatives in one sitting** — the first outputs in 10+ iterations not graded on a curve. The method is now
specced as the definitive pipeline: `docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md`. Next session builds it
into agent-loop.

---

## Part 1 — Slop diagnosis and the DR rebuild (agent-loop, TWT)

### The diagnosis (proof-loop v2 renders)
All four renders were the same ad: big white hook top / photo middle / small text bottom. Cause chain:
(1) the build prompt's copy-placement slot imposed a three-band poster; (2) the three-string law (hook+
turn+action all pixel-verbatim) has exactly one layout solution; (3) genre was an 8-key menu picked before
any reference was seen, with a bank-coverage nudge (availability bias). The leaked "TOP/LOWER THIRD/BOTTOM"
render was the tell. Layout — how copy and image integrate — was decided by nobody.

### What was built (all in agent-loop, all still there)
- **Archive first:** `archive/agent-loop-2026-07-07-pre-dr-rebuild/` (old code + all binder skills).
- New roster in `stages.ts`: `collect` (field collector: 8 verbatim artifact types incl. desire/objection
  voice, journey coverage, raw tier) → `market` (ad-field collector; scrapecreators MCP now dumps FULL ads
  to `raw/ads/*.jsonl`) → `create` (Opus, diagnose-then-write) + `buy` (Opus media buyer,
  orchestrator-launched). Binders: `agent/.claude/skills/{collect,market,create}/SKILL.md` +
  `create/references/buyer.md`. `cell-render`/`render-critic` kept but out of default order.
- Code spine fixes discovered by failure: **stale DONE.md on resume closed the input stream** (killed
  in-process MCP + hooks — "Stream closed") → cleared at pipeline start; **orchestrator declared work done
  off archived files** → deterministic hook refuses DONE.md until every ordered deliverable exists;
  gathering-cap keys updated; launch caps per new stages.
- Run dir (all TWT rounds): `agent-loop/runs/2026-07-07-12-18-29_thewholetruthfoods-com/`
  (round archives in `.rounds-r1/`, `.rounds-r2/`; degraded market.md kept for comparison).

### The three TWT rounds (what each proved)
- **R1** (website-only market data): buyer approved 3; artifacts literate but hooks were positioning
  arguments ("Clean is a word. This is a number.").
- **R2** (real ad-field data): diagnosis caught the FSSAI trap — TWT still RUNS "cleanest, lightest whey
  ever" in live ads, so R1's approved "we stopped saying cleanest" card was fatal; buyer killed cards for
  re-running TWT's own wallpaper and cloning its live Alphonso ad ("a win teaches nothing new"); wear
  ladder re-classed verification claims as an OPEN paid-ads lane. Residual: creative kept staging
  fabricated proof surfaces (fake review screenshots, rendered lab report, invented founder likeness).
- **R3** (voice recalibration): founder's catches → law of the top line (hook starts in the buyer's lived
  moment, friend-speech, full sentence), swap test demoted to whole-construction, anti-wallpaper narrowed
  to evidence-based bans, word caps replaced by platform truncation facts. Hooks transformed ("Most protein
  promises you two years on the shelf. This one asks you to finish it in two months."), buyer approved 3
  incl. the genuinely fresh shelf-life-honesty angle. Founder verdict: language better, hooks still weak —
  formats missing. This led to the hook-bank insight and then the field-first inversion.

### Founder catches this session (calibration record — each became a rule)
1. Coffee-hook worship = grading on a curve. 2. Hooks were abstract arguments (theirs start in the body/
day). 3. Swap/anti-wallpaper at hook level forces abstraction (TWT's own 187-day winner fails our swap
test). 4. Word caps produce telegram fragments (winners are 13–22-word sentences). 5. Lead forms are
distributions; real DR runs on format INSTANCES per claim type. 6. Field-first inversion (their idea).
7. Sticky-notes v1 was a FITTR clone → role-based keep/swap/re-derive + scene re-derivation. 8. Missing
"PTE" on-image → anatomy law (category named on-image). 9. Type too small → measured scale anchors +
300px thumbnail check.

---

## Part 2 — The field-first manual test (Verbis Edu, real client)

**Full artifact trail: `clients/verbis/field-first-test/`** — brief.md, mine-resolve/mine-fetch/discover/
discover-fetch/voice/render/kie-render scripts, `raw/ads/*.jsonl` (~350 ads, 18 brands), `raw/images/`
(62 creatives), `field/` (image-reads.jsonl — 15 unified pixel-reads; field-brief.md — working+emerging
formats; prompt-rules.md — compiler rules incl. scale addendum; discovery.md, student-voice.md),
creatives.json (3 brand specs), prompts.md, renders/ (all versions).

**Method executed:** intake (page fetch + AskUserQuestion: seat purchase ₹589, CPA ₹200-350, ₹10-25k
sprint, all-India PTE) → field mine round 1 (assumed set — founder corrected: NO assumptions) → Perplexity
discovery (3 rings incl. offer-shape adjacents: paid-workshop advertisers in ANY category) → round 2 fetch
→ 15 pixel reads → shortlist: working formats (FITTR objection-wall 50d×7 flights; Astro price-slash-object
83d×4; Yocket doubt-flip system 81d×2 and apology-letter 69d; Gradding value-stack 101d) + emerging →
student-voice pass ("My English is good but my speaking keeps getting 50–55"; retake ≈ ₹18,000) → 3 brand
specs with keep/swap/derive + source citations → compiled prompts (Contra rules) → renders.

**Key discoveries:** Verbis's two live Meta ads ARE our prior-session renders (5d/3d — do-not-clone);
every rival CTA is FREE-something (paid ₹589 ask = open lane, FITTR's ₹199 paid call proves impulse-paid
runs durably); nobody runs value-math (₹589 → ₹3,000 voucher = +₹2,411); real deadline beats the field's
fake urgency; typos survive 83–101 days (endorsement ≠ polish).

**Render iterations (every fix = a permanent rule):** v1 set: sticky-notes clone / price-tag with invented
V-monogram + no human / letter too quiet. v2: Parth bound as SELLER-PRESENTER (role ≠ person), real logo
bound, BREAKING banner energy restored, line-break law. v3: "LIVE PTE MASTERCLASS" chip (anatomy law).
v4: scale anchors (3-line headline ~7%/line) + thumbnail check → **final set: c1-v4 (KIE, 3:4), c2-v2
(fal, 4:5), c3-v2 (fal, 4:5)** — founder-approved for the Sat 11 July flight.

**Contra Labs case study** (`docs/casestudy_contra.md`): brief structure beats model choice (78-pt swing);
generic feel = blocker severity, color/contrast forgivable; winners spend words on structure not
adjectives. Encoded into prompt-rules.md.

---

## Part 3 — Infrastructure state (check before rendering anything)

- **fal:** `Forbidden` on ALL calls since ~2026-07-07 19:20 (probe confirmed account-level — balance or
  key). `clients/verbis/render.cjs` is the runner (GPT Image 2, true 4:5, refs via fal storage).
- **KIE:** WORKING. `KIE_API_KEY` in repo-root `.env.local`. Runner:
  `clients/verbis/field-first-test/kie-render.mjs <job-file>` (same job format). GPT Image 2 t2i/i2i via
  jobs API; refs via base64 upload (3-day temp URLs); 10 credits/2K render; **4:5 temporarily disabled —
  use 3:4 fallback** (Ads Manager crops natively).
- Scrapecreators credits ~866 → ~830 used this session; Perplexity via repo `.env.local`.
- Nothing committed this session; everything on `new-ui` uncommitted (per standing no-commit-until-tested
  practice — the field-first build next session is the test).

---

## Part 4 — Next session: build order

1. Read `docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md` (the spec) + skim the Verbis worked example.
2. `field` stage: evolve `market` (add image download to scrapecreators MCP, shortlist code, pixel-read
   step on the unified schema, field-brief deliverable, per-category bank cache).
3. Rewrite `create` binder to spec-adaptation (§3 schema; drop lead-forms/workbench/JTBD ceremony; keep
   anchors, wear ladder, awareness, matrix framing, compliance).
4. `build` stage: compiler-rules binder + provider-redundant render tool (job-file format, fal/KIE).
5. `gate`: five-check rubric (strings/named/clone/thumbnail/fabrication), orchestrator-launched.
6. Wire + smoke on TWT (material/market already cached in the run dir), then full run on a fresh brand.
7. Session-permanent laws to carry into every binder: field=form/brand=truth; role-based keep/swap/
   re-derive; scene re-derivation; category named on-image; measured scale; instances, not distributions.
8. **Outcome loop v1 (plan §5b):** after the Verbis 11 July flight, get spend/conversions/CPA from the
   founder's Ads Manager and write the first `score.flights[]` entries onto the three source bank entries
   (FITTR objection-wall, Astro price-slash, Yocket letter). The moat starts with these three numbers.
