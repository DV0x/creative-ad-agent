# First-Principles Agent Redesign

**Started:** 2026-05-15
**Context:** After the leak map (`leak-map-2026-05-15.md`) proved the current pipeline is structurally a plumber, not a performance marketer, S106 pivoted from patch-the-handoffs (Scenario B) to a first-principles rethink driven by 5 framing questions: identity / output deliverable / input contract / reasoning model / feedback loop.

**Constraints any redesign must satisfy** (carried from S105):
- The 6-cluster locked taxonomy (`axial-coding-SYNTHESIS.md`)
- The 6 floor checks F1-F6 (measurement instrument unchanged)
- Baseline 22% floor pass → target 50%+

This doc accumulates the locked answers Q1 → Q5.

---

## Q1 — Identity & Jobs-to-be-Done — LOCKED 2026-05-15

### Identity

> **The agent is a senior performance marketer accountable for delivering a D2C or local-business founder a decision-ready Meta test, every campaign run** — a clear hypothesis, the creative to execute it, and the rules to judge it.

It is **not** a creative tool, an ad generator, or a designer. Its success is measured by whether the founder can run a *profitable* test — not by whether 6 images came out.

- The accountability **unit** is *a test* (one campaign run). The agent must clear the bar **every time**, not once.
- "First test" is not in the identity sentence — but the *first* test is the highest-stakes instance (cold-start founder, zero data; a flop churns them from the channel and the product). If we ever prioritize, the cold-start case wins.

### The users

- **User = a D2C or local-business founder** with a trackable digital conversion event (matches the broader ICP refinement — not strictly D2C product brands). Beta clients: Hyderabad business hotel (Razorpay booking), abroad-education consultancy (lead form).
- The buyer is a **non-marketer**. Handed 50 creative variants, they are *more* lost, not less — they can't judge which to run. This is why the marketer identity (not the generator identity) is the only one that fits the buyer.

### The bedrock want

> A founder does not want *conversions* — anyone can buy conversions by overspending. They want **profitable conversions**: customers at a CAC below what their margin can bear.

"Profitable" is load-bearing — it forces the deliverable (Q2) to carry a success bar ("cell wins if CAC < ₹X"), which forces the input contract (Q3) to extract the founder's unit economics. v1 channel = **Meta** (a scoping commitment, not a law; identity is channel-agnostic).

### Jobs-to-be-Done

**Main job:** "Get me paying customers from Meta ads, profitably — without hiring a marketer or an agency I can't afford."

**Agent's slice:** "Turn my brand into a decision-ready Meta test — so I can launch it myself and know whether it worked."

**The job, in steps** (the progress the founder is trying to make):

| # | Founder's question | Owner | Agent today |
|---|---|---|---|
| 1 | "What's my pitch / angle?" | Agent | Partial — 6 stock hook types, no hypothesis |
| 2 | "What does the ad look like?" | Agent | Yes — but leaks (concept→prompt, refs, locale) |
| 3 | "Who do I show it to, what do I spend?" | Agent | **Nothing** |
| 4 | "Did it make money?" | Founder (account) | **Nothing** — no measurement plan |
| 5 | "What do I change next?" | Agent | **Nothing** — no iteration logic |

Today the agent does step 2 only. The job is steps 1, 2, 3, 5 (+ a thin 5). Step 4's execution stays with the founder; the agent only supplies the rules to judge it.

**Underneath the functional job:**
- *Emotional:* "I want to feel like I'm running real marketing, not flailing — and not feel ripped off."
- *Social:* "I want to show a partner/investor I have a growth motion." A test plan is presentable; 6 loose images aren't.

### Scope of the agent's work

| Area | What it includes |
|---|---|
| Research | Brand research **+ competitive scan** (Meta Ad Library — rivals' ads, white space) |
| Strategy | Angle/hypothesis tree **+ the test plan: audiences, budget split, kill rules, success bar** |
| Hooks | Copy — research-anchored, locale-correct |
| Creatives | Images + variants designed for A/B-by-construction |
| Iteration | Thin: "given results, here's what to change next" |

The piece easiest to lose is **the test plan** (audiences / budget / kill rules / success bar). Drop it and the agent silently reverts to an ad generator. It stays named explicitly.

### Boundary — what the agent does NOT do

- Does not launch the campaign
- Does not manage daily spend
- Does not install the pixel / set up tracking infrastructure

The founder's hand stays on the Meta account. The agent's job ends at "here is a test you can launch and judge."

### Why this works for positioning & differentiation

1. **Different category.** Competitors (AdCreative.ai, Creatify, Icon, Arcads, Meta Advantage+) sell *artifacts*. We sell a *decision*. Positioning against the job, not the artifact, is a category-of-one move.
2. **Moat is judgment, not pixels.** Image-model quality is commoditizing (every tool gets Nano Banana 2). The strategy layer — conversion event, competitive white space, locale judgment, kill rules — is accumulated marketing reasoning that survives the model improving.
3. **Only fit for the actual buyer.** Generators assume the buyer is a marketer who'll do strategy themselves. Our buyer isn't. "We do the marketer's job" is the only framing that serves a non-marketer founder.
4. **Justifies price + recurring revenue.** Artifact vending = $20/mo utility. Performance marketer = $2-5k/mo agency line item. Every test is a fresh job → naturally recurring.
5. **Reinforces audit-led GTM.** Only a marketer can credibly run a free creative audit; a generator can't. Identity and GTM motion lock together.

**Honest risk:** the full marketer job is much harder than artifact vending — which is *why* competitors don't do it. The leak map shows we can't yet nail even the artifact part (22% floor). The positioning is a moat only if execution lands. Q2-Q5 decide whether the bet cashes.

---

## Q2 — Output deliverable — LOCKED 2026-05-15 (revised same day after Meta Andromeda research; amended 2026-05-16 — competitive scan, see Part 1)

### The deliverable: a Test Brief

> The agent hands back **one Test Brief** — a decision-ready Meta test. Not a batch of 6 images; a self-contained experiment a non-marketer founder can launch and judge.

Four parts. The skeleton is small; the depth bar is the point (see *Executability bar* below).

### Part 1 — The Bet

A short, **readable** strategy statement (2-4 sentences). Names: the conversion event, the hypothesized blocker to conversions, the angles chosen to test against it, and *why those angles* — anchored in the brand research + the founder's facts, and **sharpened by** the Meta Ad Library competitive scan *when available* (where rivals cluster, where the white space is).

The Bet is **visible to the founder as a memo**, not baked silently into the creative. Rationale: the strategy memo *is* the differentiation — a generator cannot write it; it's also the artifact the founder shows a partner/investor (the social job from Q1).

> **Amendment (2026-05-16, from Q4 OQ3):** The Meta Ad Library competitive scan is *best-effort* — the official API does not cover most non-EU commercial ads, though a third-party scraper API makes it viable (see Q4 OQ3, revised). The Bet's *why-these-angles* rationale must nonetheless **stand on the brand research + the founder's facts alone**; the competitive scan only *sharpens* it when present and degrades cleanly to absent. The Bet never depends on competitive data being available.

### Part 2 — Test Cells (the creative)

The creative, organized as **test cells** — not a flat batch, and not a fixed count.

- A first test is **N distinct angles, 1 creative each** — *not* angles × variants. You test *angles* (competing hypotheses) in round 1; you test *variants* (executions of a proven winner) only in round 2. Testing variants of a not-yet-validated angle is wasted spend.
- **N is dynamic, driven by budget:** `N ≈ test budget ÷ cost-to-get-a-read-per-creative`, capped at ~5. Meta's delivery sweet spot is 3-5 ads per ad set; beyond ~5 the algorithm *starves* the weaker ads of impressions before they get a fair read. Sub-threshold budgets may only support N = 2-3.
- Each creative is a **complete Meta ad unit**, not just an image:
  - Image (hook rendered on-image where the style calls for it)
  - **Primary text** (the caption above the image)
  - **Headline**
  - **CTA button** (from Meta's fixed list — Book Now, Get Quote, Learn More, etc.)
  - Sized per placement: **1:1 or 4:5** for feed, **9:16** for reels/stories
- **Variants are round 2.** After an angle wins, the *next* Test Brief proposes 2-3 variants of that winner — differing on exactly one axis (visual treatment *or* hook phrasing). See Part 4.

### Part 3 — The Run Plan

The executable setup — what the founder builds in Ads Manager.

**Account structure (grounded in the Andromeda algorithm — see Grounding principles below):**
- **1 campaign, 1 ad set.** *Not* one ad set per angle. All N angles run as ads *inside the single ad set* so conversion volume pools — splitting starves the learning phase.
- **Broad / Advantage+ audience.** Manual interest/lookalike splitting is outdated; Andromeda targets better than a manual setup. The only hard targeting input is **location** (+ minimum age) — and for local businesses location *is* the real lever (geo + radius), so set it correctly. It is a setup parameter, not a test variable.

**Budget logic (the learning-phase formula):**
- Meta needs ~50 optimization events / week / ad set to exit the learning phase.
- Forward: `minimum daily budget = Target CPA × 50 ÷ 7`.
- For small/cold-start founders, run it **backwards** — budget is a fixed constraint, not something the agent sets: `affordable cost-per-event = daily budget × 7 ÷ 50`. Then **pick the optimization event** the budget can actually afford — a cheap upstream event (link click / landing-page view / lead) instead of the final purchase, if the budget can't support the purchase event.
- Target CPA comes from the founder's **unit economics** (a Q3 input), not from market research.

**Judging:**
- **Success bar**: CAC (or cost-per-chosen-event) below the threshold derived from unit economics.
- **Kill rule**: a leading-indicator gate (e.g. "kill if CTR < Y% after Z impressions") *and* the CAC gate once enough conversions accumulate.
- **Total budget + duration**: sized so the ad set can clear the learning phase; below this floor the test returns only noise.

### Part 4 — The Next Move

Thin but opinionated — the agent has a follow-up view.

- **Leading indicators** to watch days 1-3, before conversions accumulate: CTR, CPC, hook rate / thumbstop. Stops the founder panic-killing on day 1.
- **Decision tree** for after the test window: scale the winning angle, kill losers, and — if every angle underperforms — the *next angle* to try.
- **Round 2 = variants.** Once an angle wins, the next Test Brief tests 2-3 variants of that winner (one axis at a time).
- If creative metrics were strong but conversions weren't, the diagnostic points downstream: "your creative performed — CTR was strong — the drop-off is the landing page / offer." (Per Q1, the agent owns creative, not the funnel.)

### Executability bar (the A/B/C principle)

Every part must be actionable by **someone who has never run a Meta ad** — no marketer in the loop to decode it. This is the operational test for "decision-ready" from Q1. If the founder reads the brief and still needs a marketer to translate it, the brief failed.

This is why Part 2 is a full ad unit (not a loose image) and Part 3 is an Ads-Manager-depth spec (not "target business travelers").

### Boundary (unchanged from Q1)

The agent **specifies** the test; the founder **executes** it. The agent does **not** launch the campaign, manage daily spend, or install the pixel / tracking infra. The Run Plan tells the founder exactly what to build; their hands click the buttons.

### Grounding principles (from Meta Andromeda research, 2026-05-15)

These shape the Run Plan and budget logic:

- **Broad targeting is correct.** Meta's Andromeda delivery engine shortlists candidates per impression mainly on *creative* signals; manual targeting only restricts the pool. Advantage+ Audience treats interests/lookalikes as soft hints. ~70-80% of performance is creative-driven.
- **Creative drives upper-funnel metrics, not conversions alone.** Strong creative reliably wins CTR / CPM / cheap reach; conversions (CAC, ROAS) also depend on the founder's offer, landing page, and price — which the agent does not own.
- **Confidence ladder for numbers.** Reach for figures in this order: (1) the founder's own past ad data → ground truth; (2) the test's own early data → self-correcting; (3) researched market benchmarks → a *prior* only, always labeled "industry estimate," never disguised as the founder's reality (that would be Cluster-4 fabrication).
- **Budget-reality check is mandatory.** Before handing over a test, the agent runs the learning-phase math. If the budget is sub-threshold it says so honestly and adapts the test (cheaper optimization event, fewer angles, consolidate) rather than shipping an unrunnable plan.
- **"Cost-to-get-a-read" is not yet grounded for non-US markets.** The $100-150/creative figure is a US-ecommerce heuristic; Indian CPMs and cheaper events make the real number lower. Open item — ground it with India benchmarks or reason in impressions/clicks, not dollars.

### Worked example — Hyderabad business hotel (illustrative)

- **The Bet:** Conversion event = Razorpay booking. Business travelers near HITEC City default to known 5-star chains and don't know this hotel exists. Test 3 angles against that blindness.
- **Budget reality:** ₹15k/month ≈ ₹500/day. Affordable cost-per-event = 500 × 7 ÷ 50 ≈ **₹70**. A booking costs ~₹500 — too expensive to optimize for directly. So **optimize for a cheaper upstream event** (WhatsApp click / landing-page view, ~₹10-30) and judge bookings through the funnel.
- **Test Cells:** N = 3 angles, 1 creative each — A *Location* ("8 min to HITEC City"), B *Value* ("Business-hotel comfort, half the 5-star bill"), C *Proof* ("4.6★, 800+ corporate stays"). Each a full Meta ad unit.
- **Run Plan:** 1 campaign, **1 ad set**, broad audience, geo = Hyderabad + 15km radius. Optimize for landing-page view. Success bar: cost-per-booking below room margin (judged via funnel). Kill an ad if CTR < ~1% after ~5k impressions.
- **Next Move:** Watch CTR + CPC days 1-2; judge cost-per-booking around day 5-7; if one angle wins, round 2 tests variants of it; if all flat, next angle = "amenities for long stays."

(₹ thresholds are placeholders — they come from the Q3 input contract.)

### Floor-check mapping

F1-F6 grade **per creative**; the Test Brief adds a **per-deliverable** completeness bar.

| Check | Enforced in |
|---|---|
| F1 right brand / F2 locale | Part 1 (research feeding The Bet) |
| F3 no fabrication / F4 hook-in-image | Part 2 (each ad unit) |
| F5 reference deployed | Part 2 (creative) — gated by Q3 input contract |
| F6 action CTA | Part 2 (CTA button + hook) |
| *new* deliverable-complete | All 4 parts present AND pass the Executability bar |

### Implementation note — UI rendering (RESOLVED 2026-05-16)

A Test Brief is half-document, half-grid — but this does **not** need a new workspace layout. The existing workspace already renders on a **text→file / image→grid** split (research/hooks/prompts are files opened in a slide-in `FileEditorPanel`; images are the canvas grid). The Test Brief rides the same pattern: the Bet / Run Plan / Next Move / cell-copy are files (extending the `campaign_files` `file_type` enum), cell images stay in the grid, and the `cells` file gets a bespoke viewer (the `PromptsViewer` pattern) rendering ad-unit previews. See `docs/eval-corpus/implementation-plan.md` §4. The deliverable spec above remains UI-agnostic.

---

## Q3 — Input contract — LOCKED 2026-05-15

### The principle

The founder owes the agent **only what the agent genuinely cannot derive itself.** Vertical, locale, brand facts, competitor set — the agent *researches* these; it never asks. Questions are reserved for **ground truth only the founder holds**. (This is the confidence ladder from Q2 applied to inputs.)

### The input list

| Input | Why it's needed | Necessity | Source |
|---|---|---|---|
| Brand URL | Research foundation | **MUST** | Given at start (already required) |
| Conversion event | Defines what a "win" is — gates the success bar, CTA choice, and the optimization event | **MUST** | Ask |
| Budget | Fixed constraint — drives N angles and the whole learning-phase math | **MUST** | Ask |
| Unit economics → Target CPA | The success bar (CAC < ₹X) is impossible without it | **MUST** | Ask (via plain-language proxy) |
| Prior ad history | Routes the confidence ladder (own data vs estimate) | CAN — improves, never blocks | Ask |
| Reference photos | F5 — visual-first verticals fail without them | **Conditional MUST** — vertical-gated | Ask, *after* vertical detection |

### The necessity rule

A missing **MUST** → **halt-and-ask**, never silent-guess and never a hard error. A real marketer who didn't know the budget would ask, not fabricate one. A missing **CAN** → proceed, note the lower confidence. A **conditional MUST** → only triggered once research reveals the vertical needs it.

### Collection mechanism — `AskUserQuestion`

`AskUserQuestion` is a built-in Claude Agent SDK tool (structured questions, preset options, single/multi-select). So halt-and-ask is a **tool call, not a custom UI project**. Two modes:

- **Batched upfront** — the MUST set (conversion event + budget + unit economics + ad history) collected in essentially *one* `AskUserQuestion` call (the tool allows up to 4 questions per call). One interruption, not four. Fires right after the URL, in parallel with research kicking off.
- **Reactive** — only on genuine mid-run surprises that can't be known upfront: a domain redirect surfaced by research (F1), or vertical detection finding a visual-first brand with no uploaded photos (F5).

### Jargon translation (non-marketer-proof)

The founder is a non-marketer — they don't know "unit economics," "CPA," "ABO." The agent **never asks for the jargon term**; it asks in plain language with structured picks the founder selects:

- Conversion event → "What counts as a win? *Booking / Lead form / WhatsApp message / Phone call*"
- Budget → rupee ranges, not "daily ABO"
- Unit economics → "Roughly what would you happily pay to land one customer? *<₹500 / ₹500-2k / ₹2k-10k / >₹10k*" — directly answerable even by someone who doesn't know their margins
- Ad history → "Run Meta ads before? *Yes, I have the numbers / Yes, but no data handy / No, first time*"

### Discipline rule — ask only what only the founder knows

Because `AskUserQuestion` is *cheap*, the risk is over-asking — turning onboarding into an interrogation that churns a non-marketer. Hard rule: **derive everything derivable** (vertical, locale, brand facts, competitors → research); reserve questions strictly for founder-only ground truth. If the agent *could* find it out, it must not ask.

### Flow

1. URL given.
2. Batched upfront `AskUserQuestion` (conversion event, budget, unit economics, ad history) — fires immediately, parallel to research.
3. Research runs → vertical + locale detected; F1 redirect check.
4. Reactive asks if triggered: redirect mismatch (F1), or visual-first vertical with no photos (F5).
5. All MUSTs satisfied → proceed to the strategy checkpoint (Q4) and the Test Brief (Q2).

### Connection to floor checks

The input contract is where two leak-map gates structurally live:
- **F1 (right brand)** — the reactive ask on domain-redirect detection.
- **F5 (reference deployed)** — the conditional-MUST ask after vertical detection.

Both were "absent-instruction" leaks in `leak-map-2026-05-15.md`; Q3 gives them a home.

---

## Q4 — Reasoning model — LOCKED 2026-05-16

### How this was decided

The Q4 questions (staged vs loop, retry budget, critic placement) are agent-loop *architecture* questions — they had to be grounded in what the Claude Agent SDK harness natively supports, not decided from first principles. Process: (1) four parallel `claude-sdk-guide` research agents covered the agent loop, subagents, hooks, and Anthropic's agent-design best practices; (2) a fresh **output-first** redesign session rebuilt the reasoning model *backward from the Q2 deliverable*. The earlier working proposal's "explicit gate at every seam" instinct was deliberately set aside as over-gating, and replaced with a leaner design that places checks only where they earn their keep.

### The core reframe

The agent is **not an input→output transformer.** "Research + founder facts + skills → output" describes the *current* agent — and it passes 22%. The redesign's value is the **thinking**: research, the founder's facts, and the skills are what the agent reasons *with*; the product is a *judgment* (The Bet) and a *decision* (the Test Brief).

Analogy — a doctor: lab results (research) + patient interview (founder facts) + medical training (skills) are inputs; the product is the **diagnosis** (The Bet) and the **treatment plan** (the Test Brief). A blender does input→output; a doctor reasons. Today's agent is a blender.

### The harness shape — one gated loop, not a chain

- **One orchestrator `query()` loop** runs all 9 steps in a single session. NOT chained `query()` calls — cross-session resume is broken on Cloudflare (s3fs null-byte corruption; `RESUME_SDK_SESSION_ID` already disabled). One continuous loop sidesteps the broken handoff entirely.
- **The orchestrator is a hub** — routes work, holds a thin index ("research done, 5 angles approved"), never the full detail.
- **Files are the memory spine; subagents are sealed rooms** — each step writes a file the next reads; an apprentice's intermediate mess stays in its own context, only the finished file + a short summary returns.
- **Follow-ups** arrive as new prompts to the same loop (existing streaming-input generator pattern — unchanged).
- **Spending limits** (`maxTurns`, `maxBudgetUsd`) stay as the safety cap.

### The 9 steps

Derived output-first — working backward from the Q2 Test Brief. Today's entire pipeline (research → hooks → art → images) collapses into roughly *one* of these (Step F); everything else is net-new.

| Step | Does | Furniture | Brain |
|---|---|---|---|
| **A** Intake | ask founder 4 facts (win event · budget · $/customer · ad history) | intercom (`AskUserQuestion`) | orchestrator |
| **B** Research | facts · ICP · vertical · locale · brand/redirect check · visual-first flag · **voice-of-customer** | apprentice + web tools + research binder | Haiku |
| **C** Comp scan | rival ads, white space — best-effort, parallel to B | apprentice + `competitor-ads` MCP tool + web search | Haiku |
| **D** The Bet | infer the conversion blocker → N competing angles + reason + a visual style each | strategy apprentice + strategy binder + budget tool; **+ critic apprentice** | Sonnet |
| **E** Checkpoint | founder approves/redirects the angles before spend | intercom + spend-lock | orchestrator |
| **F** Build cells ×N | each angle → a whole Meta ad unit (copy + image conceived together) | N parallel apprentices + hook/art/ad-unit binders + image & refs MCP | Sonnet |
| **G** Run Plan | learning-phase budget math, account setup, success bar, kill rule | orchestrator + run-plan binder + budget tool | Sonnet |
| **H** Next Move | leading indicators, decision tree | orchestrator + small binder | Sonnet |
| **I** Assemble | 4 parts → one Test Brief, verified | JSON-file write + schema-validation hook + completeness-lock | orchestrator |

### The flow

```
                       FOUNDER
                         │  URL  (+ reference photos, maybe)
                         ▼
╔════════════ ORCHESTRATOR — one loop, the hub ════════════════════════╗
║                                                                      ║
║  A  INTAKE        AskUserQuestion → founder ← 4 facts                 ║
║                        │                                             ║
║  B  RESEARCH  ┐        ├─► research apprentice    → research.md       ║
║  C  COMP SCAN ┘ ∥      ├─► competitor apprentice  → competitors.md    ║
║                        │                                             ║
║   ⟂ if visual-first vertical & no photos → ask founder for photos     ║
║                        │                                             ║
║  D  THE BET            ├─► strategy apprentice (Sonnet) → draft Bet    ║
║         critic ───────►├─► critic apprentice: rigor check             ║
║         fail ≤2× back to strategy │  pass ▼                           ║
║                        │   thebet.md : blocker, N angles, style each  ║
║                        │                                             ║
║  E  CHECKPOINT         ├─ show The Bet → founder ← approve / redirect  ║
║                        │   [🔒 image tools locked until approved]     ║
║                        │                                             ║
║  F  BUILD CELLS ∥      ├─► cell apprentice ×N (parallel, Sonnet)      ║
║                        │   each: 1 angle + style + research + refs    ║
║                        │   → cell_1..N : full ad unit + image         ║
║                        │                                             ║
║  G  RUN PLAN           ├─ budget math        → run-plan               ║
║  H  NEXT MOVE          ├─ decision tree      → next-move              ║
║                        │                                             ║
║  I  ASSEMBLE           └─► TEST BRIEF (4 parts, structured)           ║
║                           [🔒 won't finish until all 4 present]       ║
╚══════════════════════════════════════════════════════════════════════╝
                         │  TEST BRIEF
                         ▼
                       FOUNDER
```

### Three evaluation points — checks only where they earn their keep

Not a gate at every seam (the rejected over-design). Exactly three places where output is evaluated:

**1. The Bet critic (Step D) — NEW.** A *separate* critic apprentice sits between the strategy apprentice and the founder checkpoint. It checks **rigor**: are the N angles genuinely distinct, competing hypotheses? does the blocker hypothesis follow from the research? does N fit the budget? any fabrication? Fail → back to the strategy apprentice with feedback (≤2 retries). Pass → on to the founder.
- *Why this step:* The Bet is the highest-leverage step — wrong strategy means F–I execute flawlessly against a wrong hypothesis. And The Bet is **pure judgment** — nothing code can check ("is this blocker sound?" has no regex). So it's an LLM critic or *no check at all*; "no check" on the highest-leverage step is unacceptable → LLM critic, **v1**.
- *Why a separate apprentice, not self-critique:* the strategy apprentice grading its own Bet repeats today's failure ("grades its own homework, gives itself an A"). A fresh-context critic is the only honest reviewer.
- *Why this is not the rejected over-gating:* it is ONE critic, at the ONE step where leverage is highest, the output is un-code-checkable, and the human approver (a non-marketer) structurally cannot catch rigor errors.

**2. The cells (Step F).** Mechanical code checks per cell — F1 brand, F2 locale, F4 hook-in-image, F5 reference deployed, F6 CTA — plus the retry rule. F3 (no fabrication) needs semantic judgment → deferred to v2 as an LLM-judge.

**3. The final brief (Step I).** The agent writes the Test Brief as a JSON file; a `PostToolUse` validation hook checks it against a JSON Schema and feeds errors back for self-correction (the SDK's `outputFormat` cannot be used — see the SDK Amendment below); a completeness-lock (`Stop` hook) prevents the agent declaring "done" until all 4 parts are present and coherent.

### The two locks — discipline, not quality-policing

- **Spend-lock (E)** — image-generation tools frozen until the founder approves the angles. Implemented via the permission callback (`canUseTool` / `PreToolUse`). Second purpose: the intercom can't be force-triggered by the harness, so the spend-lock makes asking *necessary* — it reliably fires the checkpoint.
- **Completeness-lock (I)** — a `Stop` hook returns `decision: "block"` with a concrete `reason` while the brief is incomplete, which resumes the loop; the hook must check the `stop_hook_active` flag and stand down when set, or it spins forever (see the SDK Amendment below).

### Human touchpoints — 2 to 3, never more

Intake (A); a *conditional* reference-photo ask (after B, only if research finds a visual-first vertical with no photos); the strategy checkpoint (E). All via `AskUserQuestion`, which is **only available to the orchestrator, not subagents** — which is *why* A and E are orchestrator-owned, not delegated.

### Reference-image thread

Reference photos are a thread through four steps, not a step of their own:
- **A** — uploaded with the campaign; orchestrator notes a flag, does not load the images itself.
- **B** — vertical detection; if visual-first and no photos → the conditional ask.
- **D** — strategy apprentice peeks at the photos so style assignment showcases the real product (not abstract typography for a hotel).
- **F** — each cell apprentice calls the refs MCP tool, loads the relevant photos, writes a prompt describing the ad *scene* (NOT the product — describing the product makes the image model redesign it), and passes `referenceImageUrls` so the founder's real product appears.
- **I** — verifies F5: every cell that should show the product deployed a reference.

The "describe the scene, not the product" rule moves *out* of the orchestrator prompt and *into* the rebuilt art/ad-unit binder — it is image-to-image *expertise*, not a checklist. Fixes the `project_eval_reference_image_ignored` failure mode structurally.

### Subagent topology

- Apprentices are programmatic `AgentDefinition`s (runtime model selection + per-stage `maxTurns`).
- **Skills and MCP tools are explicitly granted per apprentice — not inherited.** Each apprentice is handed exactly the binders + tools its step needs:

| Apprentice | Binders (skills) | Tools (incl. MCP) |
|---|---|---|
| B Research | research binder | web fetch / search, write |
| C Comp scan | light comp binder | `competitor-ads` MCP tool, web search, write |
| D Strategy | strategy binder | budget-calculator tool, read/write |
| D Critic | the rigor rubric | read |
| F Cell ×N | hook + art + ad-unit binders | image MCP, refs MCP, read/write |

- Constraints (both respected): subagents cannot spawn subagents (don't grant an apprentice the delegation tool); `AskUserQuestion` is unavailable inside subagents.

### Model per step

Haiku for extraction (B, C); **Sonnet for judgment** (D strategy, D critic, F cells); Sonnet for G/H; **Haiku for the orchestrator hub** — it routes and holds the growing conversation but makes no judgment, so it does not need a strong model (this is the single biggest cost lever — see the SDK Amendment below). Today everything — including strategy — runs on Haiku. Expert output needs a model strong enough to apply taste; this is why judgment steps move up. There is no "medium" model tier — reasoning depth is tuned per agent with the SDK `effort` setting (`low` for B/C, `max` for D, `medium` for F/G/H).

### Step F — copy and visual merged

A test cell is built by **one apprentice as one creative act** — copy (hook, primary text, headline, CTA) and image conceived together. Today copy (hook-methodology) and visual (art-style) are two steps with a file handoff between them; that seam is the leak map's #1 failure (concept→prompt loss). Merging the *step* deletes the seam. The *binders* stay separate — copy craft and visual craft are different bodies of knowledge — kept as separate reference manuals plus a new ad-unit binder. **Visual-style assignment lifts up to Step D:** since cells are now built independently and in parallel, the strategist assigns each angle a distinct style so the N cells stay visually distinct (Entity-ID diversity).

### Skills principle — LOCKED

**A skill is the agent's senior-marketer brain — judgment, taste, and worked good-vs-bad examples *with the reasoning* — not a procedure manual.** It should read like an apprenticeship under a master, not an IKEA instruction sheet. The current skills are ~450-line procedural recipes; their box-ticking lets the agent mistake process-compliance for quality (slop that passes its own checklist), and they are built for the *old* output (6 hooks across 10 copy-format types, not N strategic angles). Rebuilding each skill as judgment-not-procedure is a **downstream per-step task** — a skill serves a step, so it can only be written once that step is precisely defined. Pairs with model choice: judgment skills need a model strong enough to apply taste.

### The 3 open questions — RESOLVED

**OQ1 — Retry budget + escalation.** 2 retries (3 attempts total) per critic loop, then **drop-the-angle** (ship N−1 cells). **Never ship-with-flag** — a flagged broken cell is still broken and poisons the eval signal. If **≥2 of N cells fail**, one human checkpoint asks the founder (adjust the brief vs ship fewer) — never escalate per-cell (breaks the "hand back one Test Brief" contract). Applies to both the Bet-critic loop and the cell-retry loop.

**OQ2 — Critic: code-only vs code + LLM-judge.** Split by step. **Cells (F):** deterministic code checks in v1 (F1, F2, F4, F5, F6 — mechanically checkable as string/token/regex assertions; F5 fully so); F3 (no fabrication) needs semantic judgment → LLM-judge deferred to v2, calibrated against eval data. **The Bet (D):** an **LLM critic in v1** — The Bet has no code-checkable property, so it's an LLM critic or no check at all. (Refines the original lean, which deferred *all* LLM-judging; the Bet critic is the v1 exception.)

**OQ3 — Meta Ad Library competitive scan. (Revised 2026-05-16 — see the research-inputs amendment below.)** **In-scope via a third-party API, still never a blocking gate.** The *official* Meta Ad Library API is useless here (commercial ads only for EU-delivered ads, political-only elsewhere). But the *public* Ad Library exposes every active commercial ad globally, and a third-party scraper API wraps it cleanly — Step C calls a **`competitor-ads` MCP tool** (vendor **ScrapeCreators**: synchronous JSON + India coverage; Apify / SearchApi as fallback behind a swappable adapter). It returns rivals' real creatives, copy, CTAs, start dates, variant counts and platforms. **No performance metrics exist** for commercial ads anywhere — Step C derives proxy signals only (days-running, variant count, placement breadth) as a *triage*, not a measurement. Still degrades cleanly to "no data" and never blocks Step D.

### Amendment required to Q2 (competitive scan)

Q2 Part 1 ("The Bet") grounds the *why-these-angles* rationale on the Meta Ad Library competitive scan. OQ3 establishes the scan is best-effort and often empty. **The Bet's rationale must not *depend* on competitive data:** when present it sharpens "where rivals cluster / where the white space is"; when absent, The Bet stands on research + founder facts alone. Q2's text should be amended to reflect this. *(Flagged — Q2 is a LOCKED section; amend on confirmation.)*

### What's new vs what exists today

- **Exists:** the loop, one research subagent, the 2 skills, the image + refs MCP tools, spending limits, follow-up streaming.
- **Net-new:** intake + checkpoint via `AskUserQuestion`; the strategy + critic + per-cell apprentices; parallel cell apprentices; model-per-step; the budget-calculator tool; the ad-unit binder; the structured-output deliverable; the two locks; the rebuilt judgment-skills.

### Floor-check enforcement (updated)

| Check | Enforced at |
|---|---|
| F1 right brand | Step B (brand/redirect verification) → code check in F |
| F2 locale | Step B (locale detection) → code check in F |
| F3 no fabrication | v2 LLM-judge on cells; partially via the Bet critic (no-fabrication is a Bet-critic criterion) |
| F4 hook-in-image | Step F code check |
| F5 reference deployed | Step F code check + Step I verification |
| F6 action CTA | Step F code check |
| deliverable-complete | Step I — JSON-file write + `PostToolUse` schema validation + completeness-lock (`Stop` hook) |

### Open implementation notes

- Rebuilding the skills (judgment-not-procedure) is the immediate downstream task — one per step that needs expertise (research, strategy, hook, art, ad-unit, run-plan).
- The Test Brief UI is **resolved** — it rides the existing text→file / image→grid workspace pattern (no new layout). See the Q2 "Implementation note — UI rendering" and `implementation-plan.md` §4.

### Amendment (2026-05-16) — SDK research findings

Five parallel SDK-doc research passes (the `claude_sdk/` corpus) verified the Q4 mechanisms against what the Claude Agent SDK actually supports. Corrections — all folded into `docs/eval-corpus/implementation-plan.md`:

- **Apprentices: programmatic `AgentDefinition` — confirmed.** The SDK explicitly recommends programmatic definitions for SDK applications, and it is the only documented way to set per-agent `model`, `maxTurns`, `effort`, `skills`, and `mcpServers`. Agent *prompts* are still authored as files and loaded into the `prompt` field.
- **The deliverable does NOT use the SDK `outputFormat`.** `outputFormat` is all-or-nothing per `query()` — it would force *every* turn (intake, checkpoint, follow-up edits) to match the Test Brief schema or fail with `error_max_structured_output_retries`. Instead: the agent **writes the Test Brief as a JSON file**, and a **`PostToolUse` validation hook** checks it against a JSON Schema and feeds errors back for self-correction. (This matches how `prompts.json` is already produced.)
- **Orchestrator runs on Haiku, not "medium".** The orchestrator routes work and holds the growing conversation but makes no judgment; judgment lives in the Sonnet subagents, which are sealed fresh contexts. Haiku orchestrator is the single biggest cost lever.
- **There is no "medium" model tier.** Reasoning depth is tuned per agent with the SDK **`effort`** setting (`low` for B/C extraction, `max` for D strategy/critic, `medium` for F/G/H). The TS SDK defaults `effort` to `high`.
- **Completeness-lock (`Stop` hook) — confirmed real.** It forces the loop to continue via `decision: "block"` + a concrete `reason`. The hook **must** check `stop_hook_active` to avoid an infinite loop, and it does **not** fire if `maxTurns` is exhausted first.
- **SDK config required:** raise `maxTurns` to ~150+ and `maxBudgetUsd` to ~$15+ (both are cumulative across the whole continuous `query()` — campaign + warm follow-ups; currently 30 / $3); set `ENABLE_TOOL_SEARCH: "false"` (only 3 MCP tools — below the ~10-tool threshold where tool search helps — and Haiku cannot use tool search at all).
- **Intake/checkpoint = `canUseTool` mid-turn pause.** `AskUserQuestion` routes through the `canUseTool` callback, which suspends the loop mid-turn until the founder answers — a documented, first-class, headless-safe mechanism (`permissionMode: 'default'` required). It is **main-agent only**, which confirms intake (A) and checkpoint (E) must be orchestrator-owned, never delegated to a subagent. Watch item: the 2h `MAX_GENERATION_AGE` cap counts human think-time during the pause.
- **Cost:** Sonnet is exactly 3× Haiku ($3/$15 vs $1/$5 per MTok). A redesigned campaign is estimated at ~$4-6 to serve (Claude + fal.ai images) vs the current $5 price — re-price on the measured Phase-1 number.

### Amendment (2026-05-16) — research inputs (Steps B & C)

Two research-input decisions, from a deep-dive on competitive and voice-of-customer data:

- **Step C competitive scan — upgraded from best-effort `WebSearch` to a real third-party API.** The public Meta Ad Library exposes every active commercial ad globally; a third-party scraper API wraps it. Step C calls a new **`competitor-ads` MCP tool** (primary vendor **ScrapeCreators** — synchronous JSON, India coverage; Apify `curious_coder` / SearchApi as fallback behind a swappable adapter; results D1-cached). Returns rivals' real creatives, copy, CTAs, start dates, variant counts and platforms. **No performance metrics exist** for commercial ads from any source — Step C derives proxy signals only (days-running, variant count, placement breadth) as a *triage*, never a measurement. Non-blocking; The Bet still must not depend on it (see OQ3, revised).
- **Step B research — adds a voice-of-customer pass.** Today's research reads only the brand's own (seller-side) site. Step B's research binder gains a **buyer-side VOC pass**: the research apprentice mines Reddit, review sites (Amazon / Trustpilot / Google / TripAdvisor), Q&A and forums via the `WebSearch` / `WebFetch` it already has — vertical- and locale-weighted, no scraper, no new dependency. Output: a "Voice of Customer" section in `research.md` (pain points and objections in the buyer's own words), feeding The Bet's blocker hypothesis (D) and hook copy (F).

Detail and effort: `docs/eval-corpus/implementation-plan.md` §4.

---

## Q5 — Feedback loop — LOCKED 2026-05-16 (v1 scope; v2 deferred)

### The split

Q5 is two distinct things, deliberately separated:

1. **Manual feedback (v1 — in scope).** The founder reports round-1 performance; the agent runs round 2.
2. **Automatic learning (v2 — deferred).** The agent persists and *retrieves* what worked across campaigns, getting better over time.

The redesign ships **v1 only**. v2 is parked.

### v1 — Manual feedback (locked)

After a Test Brief is launched and judged, the founder returns with round-1 results — CTR/CPC/cost-per-event per cell, which angle won. This arrives as a **follow-up prompt to the same orchestrator loop** — the existing streaming-input pattern from Q4, unchanged. No new channel, no new architecture.

The loop handles it exactly as Q2 Part 4 specifies:
- If an angle won → the next Test Brief tests **2-3 variants of that winner** (one axis at a time).
- If all angles underperformed but creative metrics were strong → the diagnostic points downstream (landing page / offer).
- If all flat → propose the next angle.

The agent does **not** persist results, does **not** learn across campaigns, and does **not** retrieve prior performance. Each follow-up is reasoned fresh from the numbers the founder pastes in. Round-1 results live only in that conversation's context.

**This closes the Q2 Part 4 dependency** ("Round 2 depends on the founder feeding performance data back in"): the data returns as a follow-up prompt, and round 2 is just another pass through the Q4 loop. No spec gap remains.

**Touchpoint:** the Q3 input contract already asks for prior ad history at intake; a returning founder's round-1 numbers are the same kind of input, supplied conversationally on the follow-up rather than via `AskUserQuestion`.

### v2 — Automatic learning (deferred — significant engineering)

Out of scope for the redesign. Revisit **post-launch, once the floor clears 50%.**

The deferred build (designed, not started — see the `feedback_loop_architecture` memory):
- Multimodal CLIP embeddings of shipped creatives + Vectorize for retrieval.
- Reach / performance signal as the gold label ("reach-as-gold").
- Per-founder discovered preferences fed back into The Bet and cell-building steps.

**Why deferred:**
- It is a separate engineering surface (embeddings pipeline, vector store, retrieval integration) — orthogonal to the 9-step loop.
- It has **zero impact on the floor**: F1-F6 are per-creative quality checks; cross-campaign learning touches none of them. The 22% → 50% climb is won entirely inside Q1-Q4. Building v2 now would tune a loop still at 22%.
- It cannot be validated until campaigns are running at volume and the floor is stable — there is no learning signal worth retrieving before then.

### Floor-check mapping

Q5 enforces no floor check. v1 manual feedback reuses the Q4 loop and its existing three evaluation points; round-2 Test Briefs are graded by the same F1-F6 checks as round 1. v2, when built, is a quality *lift* above the floor, not a floor gate.
