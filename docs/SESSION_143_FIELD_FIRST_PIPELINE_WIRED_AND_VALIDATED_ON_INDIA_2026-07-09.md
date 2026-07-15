# SESSION 143 — Field-First Pipeline WIRED into agent-loop + validated end-to-end (Optimum Nutrition India)

**Date:** 2026-07-09 (follows SESSION_142, which specced the method: `docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md`)
**Status:** The field-first pipeline is BUILT into agent-loop and ran END-TO-END autonomously on a live brand
(Optimum Nutrition India) through the web UI — shipping **3 gate-passed, publishable creatives** with zero human
touch between the URL and the finished ads. The wiring is validated. Two post-run code fixes (DCO extraction +
reader write-once) are IN but NOT yet run live. **Nothing committed** (standing no-commit-until-tested rule; the
DCO re-run is the test for the two new fixes).

**Arc in one paragraph:** Took the S142 spec and evolved the DR-rebuild roster (collect/market/create/buy +
cell-render/render-critic) into the field-first spine (field-scout → parallel readers → field-brief → collect →
create ⇄ buy → build ⇄ gate) — an evolution, not a rewrite: the orchestrator, hooks, files-as-handoff, and plugin
binders all survived. Built a provider-redundant render MCP (KIE primary / fal failover), extended scrapecreators
to download image creatives, wrote the field + build binders and the read/gate rubrics, rewrote the create binder
to spec-adaptation. Ran it live on ON India through the web UI. It worked: 3 discovery rings fired (incl. a clean
ring-C hit — Bombay Shaving Company), the 4-way parallel reader fan-out ran without deadlock, the buyer killed 2 of
5 for the right reasons, and build rendered 3 near-pixel-accurate ON tubs from pure model knowledge. The run also
surfaced the real quality bottleneck (the DCO gap) which was fixed mid-run for the re-run. One important meta-lesson:
I falsely flagged a "fabricated 25.3g lab stat" — it was REAL and sourced (a third-party lab test collect found on
YouTube); the substantiation chain is airtight, I pattern-matched instead of checking anchors first.

---

## Part 1 — What was built (the file map for diagnosis)

All in `agent-loop/` unless noted. 8 tasks, all typecheck-clean (`npx tsc --noEmit`).

**New files:**
- `mcp/render.ts` — provider-redundant render MCP, ONE tool `render_images`. GPT Image 2 via **KIE primary,
  fal failover** (`RENDER_PROVIDER` env forces one). Job shape `{name, prompt, size?, refs?:[localPaths]}`. KIE
  4:5→3:4 auto-fallback on ratio reject. Brand refs = LOCAL paths → edit/i2i endpoint. Ported from the validated
  manual runners (`clients/verbis/render.cjs` + `clients/verbis/field-first-test/kie-render.mjs`). `RENDER_TOOL`
  export = `mcp__render__render_images`.
- `agent/.claude/skills/field/SKILL.md` (+ `references/read-schema.md`, `references/field-brief.md`) — the field
  scout binder + the two inlined rubrics (pixel-read schema, field-brief synthesis rules). Symlinked into
  `agent-loop/plugin/creative-binders/skills/field`.
- `agent/.claude/skills/build/SKILL.md` (+ `references/gate.md`) — compiler rules (ported from
  `clients/verbis/field-first-test/field/prompt-rules.md`) + the 5-check gate rubric. Symlinked into
  `plugin/creative-binders/skills/build`.

**Rewritten/edited:**
- `stages.ts` — roster now `field-scout → collect → create → build` (STAGE_ORDER); intermediate seats
  `field-read` (parallel), `field-brief`, `buy`, `gate` are orchestrator-launched with IO prompts + inlined
  rubrics. GATHER_STAGES = {field-scout, collect}. market/cell-render/render-critic retired from the roster.
- `pipeline.ts` — orchestrator prompt branches for the field-read FAN-OUT (the ONE parallel step — all readers in
  one message), field-brief, create⇄buy, build⇄gate (1 re-render). `buildAgents` registers field-read/field-brief/
  buy/gate with reference docs inlined. mcpServers: perplexity + scrapecreators(rawAds, **images**) + **render**
  (nano-banana dropped). doneRequires adds `field/field-brief.md`. Hard-stop 60min.
- `hook.ts` — LAUNCH_CAPS updated (field-read: 8 for the fan-out; build/gate: 3). DONE.md guard now lets a
  `flagged:`-prefixed DONE.md through (the buyer-reject / gate-structural early-exit path — otherwise unwritable
  because downstream deliverables rightly don't exist).
- `mcp/scrapecreators.ts` — `competitor_ads` downloads top image creatives → `raw/images/<brand>/`. **DCO FIX (see
  Part 3):** `collectImageUrls`/`collectVideoPreviewUrls` now also pull static creatives from `snapshot.cards[]`
  (DCO/carousel), not just `snapshot.images[]`. Caps: IMG_ADS_PER_BRAND=12, IMGS_PER_AD=2.
- `agent/.claude/skills/create/SKILL.md` — rewritten to §3 spec-adaptation (pick 3–5 constructions, keep/swap/
  re-derive with role+scene laws, copy-by-destination from hook bank, anatomy law). `references/buyer.md` — updated
  to judge adaptations (clone-both-directions, open-lane check, verifies sourceReads).
- `agent/.claude/skills/collect/SKILL.md` — gains "field brief = shopping list" targeting + render-bindable
  asset inventory (assets/).
- `run.ts` — keys per stage (field-scout→PERPLEXITY+SCRAPECREATORS; build→KIE_API_KEY or FAL_KEY), `--product`
  stages into `assets/`, drops the fal-upload path, makes `field/reads/` + `renders/`.
- `chat/reducer.ts`, `chat/setup.ts`, `chat/_reducer-test.ts`, `web/server.ts` — new stage labels/sequence,
  key checks, renders/ (not images/) watch + serve, bindReference lands uploads in `assets/`.

**Reader IO prompt + read-schema.md** carry the write-once instruction (accumulate all reads, ONE write) — the
append fix from Part 3.

---

## Part 2 — The validation run (Optimum Nutrition India)

**Run dir (all artifacts):** `agent-loop/runs/2026-07-09-07-24-18_www-optimumnutrition-co-in/`
**Driver:** web UI (`npm run web`, :4141). Cost: **~$6.60** API + ~9 scrape credits (rest cached from TWT) +
~30 KIE credits (3 renders). Product photo uploaded: `assets/ref-1-creat.jpg` (the WRONG SKU — creatine, not the
Gold Standard whey hero — see Part 3).

**Stage-by-stage (all validated):**
- **intake** — orchestrator WebFetched the site + AskUserQuestion → a rich `founder-facts.md` (conversion=site
  purchase, AOV ₹4,349, CPA ₹200–400, buyer = 18–25 male gym beginners tier-1/2, authenticity anxiety as #1 lever,
  OFFERS ALLOWED = 14% off + free RCB shaker + free shipping >₹1,000).
- **field-scout** → `field/shortlist.md`. 3 rings fired: A (MuscleBlaze, BigMuscles, Dymatize, Steadfast, Avvatar,
  TWT, Myprotein-dark), B (Fast&Up), **C (Bombay Shaving Company — "3 products @ ₹999, do the math", transfers to
  ON's "₹4,349 = #1 whey + free shaker")**. Wrong-brand defence held (Myprotein resolved-but-dark; MuscleTech/GNC/
  AS-IT-IS/Nakpro reported UNRESOLVED, not guessed).
- **field-read** — **4 readers launched in ONE message (parallel fan-out — the S137-deadlock risk; ran clean).**
  → slice-{1,2,3,4}.jsonl. Read quality high (measured scale, device-as-construction, roles per element).
- **field-brief** → `field/field-brief.md`. Strategist-grade: 10 ranked constructions w/ endorsement (503d×5v,
  666d×2v…), the **register-split insight** (ON's equity = clean-challenger, but endorsed mechanisms = mass-loud →
  can't just copy), 5 open lanes each w/ absence+existence-proof, hook bank, named wallpaper.
- **collect** → `material.md`. Targeted to the brief (authenticity-fear voices), journey-covered, + asset
  inventory that CAUGHT the wrong-SKU upload and listed NEEDS-FOUNDER assets.
- **create** (Opus) → `creatives.json` + `creatives.md`. 5 specs, diverse claimTypes, **3 open-lane plays**,
  register-disciplined (C4 keeps MuscleBlaze's 3-beat structure but swaps rented-celebrity → ON's earned status),
  scene re-derived on each, every ref specced as "NEEDS FOUNDER: Gold Standard whey… reproduce 100% identical".
- **buy** (Opus) → `verdict.md`. **FINAL: WINNERS — Creative 1, 4, 5.** Killed C2 (fake urgency — bundle dressed
  as a deadline) and C3 (duplicate of C1). Caught the DCO phantom-read (C1/C3 cite BigMuscles DCO reads that don't
  exist) but approved C1 on its real copy construction.
- **build** → `prompts.md` + `build-output.md` + 3 renders. Handled the missing photo correctly (text-to-image
  the tub from model knowledge; bound the creatine photo only for palette/mark context; named-blocker section).
  All 3 fell back to **3:4 (KIE rejected 4:5)**. Thumbnail self-checks PASS.
- **gate** (Opus) → `gate-verdict.md`. **FINAL: PASS — c1, c4, c5.** 5 checks each; correctly scoped FABRICATION
  to faked visual docs (the text claims are substantiated, so pass).

**The 3 shipped ads** (`renders/`, all 1536×2048 = 3:4):
- `creative-1-objection-wall_*.png` — "LAB-TESTED. NOT LABEL-TESTED." + 4-check authenticity wall, spotlit gym
  floor. Near-publishable.
- `creative-4-trust-name_*.png` — photoreal product hero + "WORLD'S #1 · 35 YEARS · GOLD STANDARD 100% WHEY" band.
- `creative-5-beginner-guide_*.png` — tub in a calm bright KITCHEN (scene re-derived from gym→kitchen = the
  message: not just for gym-bros) + "BEGINNER'S GUIDE · YOUR FIRST WHEY".

---

## Part 3 — Findings (prioritized for next session)

### 3.1 THE quality lever — the DCO gap (FIXED mid-run, NOT yet validated live)
Meta India's dominant format is **DCO** (dynamic creative), whose static creatives live in `snapshot.cards[]`,
NOT `snapshot.images[]` (empty for DCO). The original download code only read `images[]`, so the category leaders
were INVISIBLE to the pixel readers:
- ON (itself): **60** static cards across 20 ads → 0 read (we need ON's own visuals for pixel-level DO-NOT-CLONE)
- MuscleBlaze: **41** cards → 0 read. BigMuscles: **47** → only 2 (and those 2 were STORE-OPENING ads, not
  supplement ads — noise).
This starved the pixel tier to ~16 mostly-weak images (Avvatar 8-day launch flush + ring-C), so `create` borrowed
layout/scale from the wrong reads. **Fix (`mcp/scrapecreators.ts`): `collectImageUrls` now pulls static cards from
`cards[]` (a card with an image url and NO video url = real static creative; video cards → poster only).** Proven
against cached data (the 60/41/47 counts ARE what it now extracts). Expected re-run yield ~150+ images incl. all
leaders. **Diagnosis note for next session: confirm the re-run's `raw/images/` jumps and that field-brief's top
constructions now carry real pixel reads.**

### 3.2 Reader append trap (FIXED, NOT validated)
Readers were told "append line by line," but the Write tool overwrites + demands Read-first, so multi-read slices
hit `File has not been read yet` errors (recovered here on tiny slices; would corrupt/stall on the rich re-run's
12–24-image slices). **Fix: read-schema.md + FIELD_READ_IO_PROMPT now say "view all, then write ONCE."**

### 3.3 sourceRead honesty (NOT fixed — small edit pending)
`create` was told "adapt from the pixel read," but the brief's top constructions are copy-endorsed (DCO/video, no
pixels) — so it cited sourceReads with no reads/*.jsonl line. The buyer caught it and handled gracefully (judged
the copy construction). **Refinement: let `sourceRead` legitimately mark "copy-construction, layout inferred" vs a
pixel read.** Mostly resolved by the DCO fix (leaders will now have real reads) but video-only winners persist.

### 3.4 The substantiation FALSE ALARM (meta-lesson — no code change)
I flagged C1's "lab-verified 25.3g / zero melamine / scan the pack" as fabricated. **It was REAL and sourced** —
material.md #45/#55 = a Trustified India third-party lab test (YouTube 2025-11-06: measured 25.3g vs 24g claimed,
no amino spiking, no melamine); #46 = ON's real QR authentication; #17 = the Chandni Chowk counterfeit quote. The
substantiation chain (create anchors → buyer TRUE check → gate) WORKS. Lesson: I pattern-matched "specific number =
fabricated" without checking anchors first. **There is NO substantiation gap.** (Recorded because next session might
otherwise re-raise it.)

### 3.5 Wrong product photo (user action for re-run)
Uploaded `ref-1-creat.jpg` = ON Creatine tub, but hero SKU = Gold Standard Whey 2lbs. `collect` + `create` both
caught it (specced NEEDS-FOUNDER). Render path proven regardless (model-knowledge tub came out near-perfect).
Re-run: upload the real whey photo, or skip (model render is strong).

### 3.6 KIE 4:5 still falling back to 3:4 (infra, INFO)
All 3 renders auto-fell to 3:4 — KIE's "temporary" 4:5 outage is still live as of 2026-07-09. 3:4 crops natively in
Ads Manager. fal (true 4:5) still `Forbidden` (account/balance, unresolved since 2026-07-07).

---

## Part 4 — Next session: re-run + build order

1. **Small edit:** sourceRead copy-vs-pixel honesty (create SKILL + §3 schema note) — 3.3.
2. **Cache-cheap re-run** on ON India (or a fresh brand). All scrapes cached → ~0 credits. This VALIDATES the DCO
   fix (3.1) + reader write-once (3.2) live, gives `create` the real leader layouts, and takes the right whey
   photo (3.5). Driver: `cd agent-loop && npm run web` (:4141), OR headless `npx tsx run.ts https://www.optimumnutrition.co.in/`.
   - **Diagnose:** does `raw/images/` jump to ~150+? Do field-brief's top constructions (MuscleBlaze/BigMuscles/ON)
     now carry real pixel reads? Does `create` stop borrowing Avvatar scale? Do the readers write once cleanly?
3. **If re-run clean → COMMIT the whole validated pipeline** (honors no-commit-until-tested; this + the ON run are
   the tests). 14 modified + 4 new files (Part 1). Suggested message scope: "feat(field-first): wire field-first
   pipeline into agent-loop — validated end-to-end on ON India (3 shipped)".
4. **Then:** outcome-loop v1 (plan §5b) still pending — after a real client flight, write spend/CPA back onto the
   bank's `score.flights[]`. And the Verbis 11 July flight numbers (S142) are the first data points.

---

## Part 5 — Exact paths / state for diagnosis

- **Validation run:** `agent-loop/runs/2026-07-09-07-24-18_www-optimumnutrition-co-in/` (all stage deliverables +
  `trace.jsonl` + 3 renders present).
- **Spec:** `docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md`. **S142 handoff:** `docs/SESSION_142_*.md`.
- **Uncommitted (this session):** MODIFIED — `agent-loop/{chat/_reducer-test.ts,chat/reducer.ts,chat/setup.ts,
  hook.ts,mcp/scrapecreators.ts,pipeline.ts,run.ts,stages.ts,web/server.ts}`, `agent/.claude/skills/{collect/SKILL.md,
  create/SKILL.md,create/references/buyer.md}`. NEW/untracked — `agent-loop/mcp/render.ts`,
  `agent-loop/plugin/creative-binders/skills/{build,field}` (symlinks), `agent/.claude/skills/field/`,
  `agent/.claude/skills/build/` (build dir tracked via its symlink target — confirm `agent/.claude/skills/build/`
  gets added). Everything on branch `new-ui`.
- **Retired (still on disk, out of roster):** `agent-loop/mcp/nano-banana.ts`, skills `market/cell/comp/research/
  strategy` (+ their plugin symlinks). Safe to leave; not imported by the field-first path.
- **Keys:** `KIE_API_KEY` (repo-root `.env.local`) — render primary. `SCRAPECREATORS_API_KEY`, `PERPLEXITY_API_KEY`
  (`.env.local`). `FAL_KEY` (`.env`) — currently Forbidden.
- **tsc:** clean at session end. **Monitor script used:** `/tmp/on_watch.py` (trace+milestone follower; disposable).
