# SESSION 138 — The web demo (chat UI, images inline, reference upload) + the mandatory-critic fix

**Date:** 2026-07-01 (continues SESSION_137, same day)
**Branch:** `new-ui` — **everything below is UNCOMMITTED**; `agent-loop/chat/`, `agent-loop/web/`, and `agent/.claude/skills/cell/` are entirely **git-untracked**.
**One line:** We turned the agent-loop into a **demoable product** — first a terminal (ink) chat, then a **browser chat** (option A) that shows the ad *inline*, streams live activity, does founder intake via clickable questions, takes **reference-image uploads**, and reuses the whole engine. Then a real run exposed a creative bug — the judge crowned a faceless, off-strategy ad over the on-strategy one it had already generated — and we fixed it **universally** (mandatories are now a hard gate in the critic).

---

## 0. NEXT SESSION — start here

Two fixes are **built but not yet run-validated** (a full run is ~20–40 min + ~$2–5, so we deferred):

1. **Re-run verbisedu (or any brand) through `npm run web`** and confirm:
   - the **mandatory fix** now picks the **trainer-to-camera** ad (not the faceless score-report one), and
   - an **uploaded photo** (add Mr Parth's face on the welcome screen) makes the render show the **real** person, not an invented face.
2. Then knock out the two **smaller, still-open** fixes (§8): **(a)** lock the CTA text verbatim like we lock the score number (stop the "Book your seat — 100 only" garble); **(b)** the web UI streams *every* render including the rejected ones — show only the **shipped** render (mark retries).
3. When a run looks good end-to-end → **commit the batch** (per our rule: no commits until tested). `git add agent-loop/chat agent-loop/web agent/.claude/skills/cell` (all untracked) + the tracked `pipeline.ts`/`tsconfig.json`/`package.json`.

**How to run the demo:** `cd agent-loop && npm run web` → open **http://localhost:4141**.

---

## 1. TL;DR — the spine

1. **Goal shifted** from "make the pipeline's process visible" (SESSION_137's goal) to "**present it as a demo**." The decisive fact: the output is an **image** — a terminal can't show it. So the demo is a **browser chat**.
2. **Built a terminal ink chat first** (works, kept), then **pivoted to a web chat** because images render inline + live activity is richer. **The engine is medium-agnostic** — only the UI layer differs; the web reused `ChatSession` + `reducer` + `buildBaseOptions` unchanged.
3. **Engine (new, medium-agnostic):** `pipeline.ts` refactored to a shared `buildBaseOptions`/`buildAgents`; a **held-open streaming `ChatSession`** (follow-ups + AskUserQuestion round-trip); a pure **reducer** (SDK stream → live view); an **`interactive` intake** (orchestrator reads URL → asks intake questions → writes `founder-facts.md` → runs).
4. **Web demo:** `web/server.ts` (WS, reduces server-side, serves the run's images, watches for the rendered image) + `web/public/index.html` (on-brand chat — cream/wine/lime + Clash Display/Satoshi — scoreboard, spinner, clickable questions, **image inline**, **reference upload**).
5. **First real web run (verbisedu PTE workshop) succeeded end-to-end → a rendered ad.** But the ad was **faceless + pain-only + wrong CTA**.
6. **Diagnosis (traced upstream through the run's artifacts):** the **strategy was good** (it mandated *"show the trainer's face — the conversion driver"*), the cell even **generated the right ad** (Take 2 = trainer-to-camera), but the **take-critic picked the faceless freestyle take** and explicitly downgraded the mandatory to *"flag, not kill."*
7. **Fix (universal):** made **mandatory-fidelity a hard gate** in `critic.md` — a take that drops a stated mandatory can't win over one that holds it; a conversion-driver mandatory is an outright kill. Keys on *"whatever mandatories the plan lists,"* not this brand.
8. **Reference upload added** to the web UI (welcome + mid-chat) so the render binds the **real** face/product/room instead of inventing it.

---

## 2. The architecture (what's built)

```
                          ┌─────────────────── the ENGINE (medium-agnostic) ───────────────────┐
  browser  ──WS──►  web/server.ts ──►  chat/session.ts (ChatSession)  ──►  pipeline.ts buildBaseOptions()
   (or)                                      │  held-open streaming input     │  (same agents/MCP/hooks as headless)
  terminal ──────►  chat/index.tsx  ────────►│  AskUserQuestion → canUseTool   │
                    chat/App.tsx (ink)        │  session-id → session.json      └──► query() → research→comp→strategy
                                              └──► every SDK msg ──► chat/reducer.ts ──► ChatView (live scoreboard, feed, cost)
                                                                                              →cell-generate→[take-critic]
                                                                                              →cell-render→[render-critic]→DONE.md
```

- **`pipeline.ts` (refactored, TRACKED edit):** extracted **`buildBaseOptions({...interactive?, canUseTool?, extraAllowedTools?})`** and **`buildAgents()`** — the single source of truth for the orchestrator's SDK `Options`. Both the headless `runPipeline` and the interactive `ChatSession` build on it, so they run **byte-identical** agents/MCP/hooks. `emitProgress` exported. `orchestratorPrompt` gained an `interactive` branch: **founder intake** (WebFetch the URL → `AskUserQuestion` for goal/buyer/budget/what's-tried → write `founder-facts.md`) **+ clarify-on-vague-followup**. Headless path unchanged (`interactive` defaults false).
- **`chat/session.ts` — `ChatSession`:** the held-open streaming bridge. A queue-backed async generator that **stays open** (closes only on `end()`, never on `DONE.md`) so follow-ups land; `canUseTool` intercepts `AskUserQuestion` → surfaces to the UI → parks on a promise → resolves on `answer()`; captures `session_id` → `session.json`; 45-min watchdog that **pauses while awaiting a human**.
- **`chat/reducer.ts` — pure `reduce(view, event)`:** folds the SDK message stream (+ UI actions) into one `ChatView` (stages with status/model/tools/verdict, feed, activity, cost, phase). Attribution mirrors `trace.ts` (Agent tool_use id → subagent_type). **DONE.md write → phase `idle`.** Validated against the real 184-message trace.
- **`chat/App.tsx` + `index.tsx` — the ink terminal chat** (built first). Header, live scoreboard, feed, **status bar with spinner + activity + ticking timer + cost** (the "is it alive?" fix), clickable question picker, bordered input. **Superseded by the web UI for the demo, but kept** (shares the engine).
- **`web/server.ts`** (untracked): tiny Node http + `ws`. Per browser connection runs one `ChatSession`, reduces **server-side**, streams the `ChatView` (coalesced ~8fps), serves `/images/<runId>/<file>` from the run dir, **watches `runs/<id>/images` and pushes each new render to the browser**, relays answers/follow-ups/uploads back. Console-safe (no ink to corrupt).
- **`web/public/index.html`** (untracked): plain HTML/CSS/JS, **no build step**, styled to match `client/` (imports the same Fontshare fonts; cream `#FBF9F5` / ink `#231F20` / wine `#AB406C` / lime `#C1FF64`). Welcome (URL + optional photo) → live pipeline strip + spinner + timer/cost → conversation → clickable question buttons → **the ad image inline** → idle for follow-ups → **📎 mid-chat upload**.
- **Reference upload (both server + browser):** `server.ts bindReference()` decodes the browser data-URL, saves it to the run dir **+ `reference-images/`** (so research can *see* it), uploads to **fal**, and **appends to `refs.json`** (`{references:[{falUrl,localPath,fileId}]}` — the exact shape `mcp/refs.ts` reads; its comment literally anticipated a "future upload step"). Bound **before** the pipeline runs (start-screen upload) or mid-chat (say *"use this photo"* to rebuild).

---

## 3. Key SDK findings (grounded via `claude-sdk-guide` over `claude_sdk/*.md` — don't re-derive)

- **Follow-ups = the held-open streaming generator, NOT resume.** Keep the input generator open (park on a promise; close only on explicit end) and `yield` new user messages into the live `query()`. Proved live (`_hold-probe`, since deleted): a message sent 8 s after idle, with nothing pending, was answered. (`streaming_input.md`, `How-the-agent-loop-works.md`.)
- **AskUserQuestion is the SDK's real clarifying-questions tool, surfaced via `canUseTool`.** Input `{questions:[{question,header,options:[{label,description}],multiSelect}]}`; return `{behavior:'allow', updatedInput:{questions, answers}}` where **`answers` maps question-text → chosen label** (array/joined for multi; free text via an "Other"). **Leave it OUT of `allowedTools`** so it routes to the callback (our real tools are auto-approved and never reach it). Only the **top-level orchestrator** may ask — subagents are backgrounded and would deadlock; AskUserQuestion is also unavailable in subagents. (`Handling-approvals-user-input.md:412–549, 825`.)
- **Resume, if ever needed:** locally (persistent host) SDK JSONL `resume` works; but our **files-as-handoff `--resume=<dir>`** is the endorsed path (`session_management.md:313`), and for *reconnect/replay* the deliverable files + `trace.jsonl` **are** the durable state (zero `query()`). We chose **not** to build durable resume for the demo — the held-open session covers same-sitting follow-ups.
- **Demo medium:** web > terminal for THIS product because the deliverable is an image (terminals can't show it) and live activity is richer in a browser. The engine doesn't care — only the ~2 ink files are terminal-specific.

---

## 4. The creative-quality diagnosis (verbisedu run) — the important part

**Run:** `agent-loop/runs/2026-07-01-09-48-07_www-verbisedu-com-workshop/` (full success: 3 renders, `DONE.md` shipped). **The ad it shipped:** hook *"My speaking was fine. My score was 58."* over a phone score-report, CTA *"Claim my seat · ₹589."* — **faceless, pain-only, no service, no human.** User's instinct: wrong for an education service.

**Traced upstream through the artifacts (the method: the failing signal is decided earlier than where it shows):**

- **`founder-facts.md` / `thebet.md` — strategy was GOOD.** It named the real blocker (trust, not price/algorithm/credentials), the differentiated want (a one-session *diagnostic + plan*), and — critically — a **Mandatory**: *"Show the trainer (Mr Parth) as a real human face; **this is the conversion driver** in a trust-critical category — a faceless poster loses to a person with 2,500 students behind them."*
- **`takes.md` — the cell GENERATED the right ad.** Among 5 takes, **Take 2 "2,500 Times" = the trainer talking to camera** ("I've watched 2,500 people take PTE. I know exactly why most of them failed.") — shows the human, makes the trust argument, honors the mandatory. (Take 5 also shows the trainer photo.)
- **`verdict.md` — the take-critic PICKED the faceless one and softened the mandatory.** It ran a "MANDATORY CHECK — Trainer face," found Take 1 **fails it** ("shows the score report, not Parth's face… no face in the creative"), then ruled **"Flag, not auto-kill"** and crowned Take 1 anyway because the hook was "pure recognition." The winning take went **freestyle** (a "score-report confession"), passing over its own founder-POV format.

**Root cause (in the rubric):** `agent/.claude/skills/cell/references/critic.md` **line 13** told the critic the cell's self-check already handled *"mandatories held"* and *"you do not re-litigate them"* — so when the critic noticed the violation, it had authority only to *flag*, not *kill*.

**Also found, separately (NOT yet fixed):** the **CTA garble** ("Book your seat — 100 only" in the first render vs the spec's "Claim my seat · ₹589") is **image-model small-text fidelity** — the compiled prompt locked the on-screen **score** ("CRITICAL: must read 58") but gave the **CTA** no verbatim lock, so the model improvised the small pill + hallucinated a number. The render-critic caught it and re-rendered to a correct 3rd image — but 3 renders is expensive.

---

## 5. The fix — mandatory-fidelity is now a HARD gate (universal)

**3 edits to `agent/.claude/skills/cell/references/critic.md`:**
1. **Line 13:** removed *"mandatories held"* from the "cell already checked, don't re-litigate" list; added that **mandatory-holding is the exception the critic DOES re-verify** (the writing seat rationalizes it away).
2. **New gate before the kill tests** — *"Mandatory fidelity — the gate before the kill tests; check it FIRST."* A take that **drops/crosses a mandatory FAILS** however sharp the hook; *"but the picture argues the exact claim better"* is named as the rationalization to refuse; a mandatory the strategy flags as **the conversion driver is a hard kill**; **a mandatory-violating take can never outrank a mandatory-holding one**; if all cross → **REJECT ALL** and route upstream.
3. **Ranking section:** mandatory fidelity + genericness are both **gates above the ranking** — a take that crossed a mandatory "never enters the ranking, however sharp its hook."

**Universal by construction:** the strategy binder *defines* mandatories as a standard per-angle field (`strategy/SKILL.md:198, 237, 253` — "the honesty/identity guardrails the cell must hold: show the real product, stay in identity, any 'don't-claim' line"). The gate keys on *those*, whatever they are — so it enforces "show the real product," "show the founder's face," "stay in the brand's look," "don't claim X" for any brand.

---

## 6. File inventory (this session)

**New / untracked:**
- `agent-loop/chat/` — `session.ts`, `reducer.ts`, `App.tsx`, `index.tsx`, `setup.ts` (+ dev throwaways `_reducer-test.ts`, `_intake-smoke.ts` — delete before commit).
- `agent-loop/web/` — `server.ts`, `public/index.html`.
- `agent/.claude/skills/cell/` — whole dir was already untracked; **`references/critic.md` got the mandatory-fidelity fix.**

**Tracked edits:**
- `agent-loop/pipeline.ts` — `buildBaseOptions`/`buildAgents` extracted+exported, `emitProgress` exported, `orchestratorPrompt` interactive intake + clarify.
- `agent-loop/tsconfig.json` — `jsx: react-jsx`, include `chat/**` + `web/**`.
- `agent-loop/package.json` / `package-lock.json` — deps `ink`, `react`, `ink-text-input`, `ws` (+ `@types/*`); scripts `chat`, `web`.
- **NOT touched this session** (their `M` in git is from prior sessions): `hook.ts`, `run.ts`, `stages.ts`.

---

## 7. Validation state — proven vs. not

**Proven:**
- Reducer correct on the **real 184-message trace** (stages, verdicts, cost, DONE→idle).
- **Intake + AskUserQuestion** fires and round-trips; produced a genuinely good `founder-facts.md` (`_intake-smoke`).
- **Held-open follow-ups** work (`_hold-probe`).
- **Full pipeline end-to-end via the web UI → a rendered image** (verbisedu run).
- Web server **boots, serves the on-brand page, image routes + 404s work**; upload UI present; server **typechecks**; browser JS **parses**.

**NOT yet run-validated (built, logic-complete):**
- The **mandatory fix** picking the trainer ad (needs a fresh run).
- **Reference upload** actually binding the real face/product into the render (needs a run with a photo).
- (Unbuilt) the **CTA-lock** and **UI-only-show-shipped-render** fixes.

---

## 8. Open / deferred (the queue)

1. **Run-validate** the mandatory fix + the reference upload (one `npm run web` run).
2. **CTA verbatim lock** — give the CTA the same "CRITICAL, render exactly" treatment the score number gets, in the cell's compiled prompt (`stages.ts` CELL_RENDER I/O + `shot-spec.md`). Fallback if still fragile: composite the CTA/hook as a real text layer post-render (against the user's specification-first preference, so try the lock first).
3. **Web UI: show only the shipped render.** `server.ts` currently `watch`es the images dir and pushes *every* file; instead push only the render-critic-**passed** image (or mark intermediate ones "rejected"). The rejected first render is what the user reacted to.
4. **Delete dev throwaways** (`agent-loop/chat/_reducer-test.ts`, `_intake-smoke.ts`, `agent-loop/chat-debug.log`).
5. **Commit the batch** once a run looks good (§0.3).
6. **Bigger, later:** does the pipeline generalize to **services** (education/consultancy) vs the D2C-product binders? This run says the *strategy* generalizes fine and a fitting format existed (founder-POV = trainer); the miss was selection, now fixed. Watch future service runs.

---

## 9. Reference map

- **The demo:** `cd agent-loop && npm run web` → `http://localhost:4141`. Terminal version: `npm run chat`. Headless: `npm run run <url>`.
- **The diagnostic run (evidence):** `agent-loop/runs/2026-07-01-09-48-07_www-verbisedu-com-workshop/` — `thebet.md` (the mandatory, line ~57), `takes.md` (Take 2 = the trainer ad), `verdict.md` (the "flag, not kill"), `images/` (render 1 = "Book your seat — 100 only", render 3 = "Claim my seat · ₹589").
- **The fix:** `agent/.claude/skills/cell/references/critic.md` (mandatory-fidelity gate).
- **Engine:** `agent-loop/pipeline.ts` (`buildBaseOptions`), `agent-loop/chat/{session,reducer,setup}.ts`, `agent-loop/web/{server.ts, public/index.html}`.
- **Prior handoff:** `docs/SESSION_137_PIPELINE_REBUILD_ASYNC_DEADLOCK_FIX_AND_CRITIC_JUDGMENT_2026-07-01.md`.
- **SDK docs used:** `claude_sdk/{streaming_input, Handling-approvals-user-input, session_management, How-the-agent-loop-works, custom_tools}.md`.
