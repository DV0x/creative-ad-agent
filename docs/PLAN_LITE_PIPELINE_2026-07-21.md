# PLAN — Lite Pipeline (S154): the heavy loop reverse-engineered for production

**Date:** 2026-07-21 · **Status:** DESIGN COMPLETE, nothing built. Every decision below was
settled in the S154 brainstorm with the founder; founder calls are marked **[F]**.
**Goal:** a new top-level folder `lite-loop/`, run LOCALLY first through the heavy loop's
existing chat/web interface. DO/WebSocket/production port is explicitly deferred until a
local run succeeds.

## 0 — Strategy context (why this exists)

Three product surfaces (S154): (1) **AUDIT** — self-serve funnel wedge (client's own ad
library scored; not this doc); (2) **LITE** — this pipeline: production self-serve draft
tier, target **~$2.50–3.50 and ~15–20 min**, replacing the generic v1 loop (22% floor,
structural — see `docs/V1_AGENT_AND_AGENT_SDK_AUDIT_2026-06-28.md`); (3) **PRO** — the
heavy agent-loop, concierge/bridge now, port later. Lite is the heavy loop *distilled*,
not a new design: every seat traces to a validated heavy mechanism.

## 1 — Locked founder decisions [F]

- **Orchestrator agent STAYS** (code-sequencing rejected: "follow-ups need a router").
  AskUserQuestion intake (2 rounds) + the follow-up router. Mechanical layer stays code.
- **Models: Sonnet everywhere; Opus 4.8 ONLY at the judge.** No Opus A/B for create.
- **Field shortlist = 12–15 creatives** (quota-stratified); final output = 6 specs.
- **Field outputs are JSON, not markdown** (`picks.jsonl` + `field-summary.json`).
- **No seed bank** ("same outputs for every brand") → live **format hunt** escalation.
- **No ad-age-only ranking** (selects branding ads) → lane scoring model (§4).
- **Render prompts are MODEL-written** under the heavy build binder's guidelines
  (code-template compiler rejected; "already working" wins). Provider: **KIE** primary /
  fal failover via the existing render MCP. JSON prompts rejected at the model boundary
  (image models parse captions, not schemas; JSON discipline lives in the spec).
- Local-first validation via the heavy loop's web UI; production wiring deferred.

## 2 — Folder layout

```
lite-loop/
  pipeline.ts          orchestrator prompt (§8) + buildBaseOptions-lite + runPipeline
  stages.ts            6 seat definitions: research / field / create / judge / build
  references/          prompt reference files inlined into seats:
    vision-pass.md     the field seat's shortlist+read law (§5)
    read-schema-lite.md  pick-line schema + closed formatFamily table (adapted from
                       agent/.claude/skills/field/references/read-schema.md)
    judge-rubric.md    kill/flag rubric (§6)
    build-guidelines.md  prompt-engineering law (adapted from build/SKILL.md incl. rule 9)
  mcp/
    harvest.ts         NEW — the fat deterministic tool (§4): resolve→scrape→triage→
                       cluster→score→download→manifest; + hunt_format entry point
  web.ts               thin entry: reuses agent-loop/chat + agent-loop/web components,
                       selects the lite pipeline
```

**Imported from `agent-loop/` (no copies — path imports, tsx handles it):**
`mcp/brand-identity.ts` (brand_identity + product_photos + page_text + prefetchIntakeGround
+ fetchPageSmart), `mcp/scrapecreators.ts` (find_pages + ads + download internals — harvest
wraps these), `mcp/render.ts` (KIE/fal), `mcp/perplexity.ts`, `hook.ts` (buildHooks config:
orchestrator-MCP block, brandUrl write-belt, spec assembly, doneRequires, post-DONE
relaxation), `trace.ts` + `trace-profile.cjs` + `watch-run.cjs`, `chat/*` (ChatSession =
AskUserQuestion wiring, free), `web/*` (question cards, image watcher, resume).

## 3 — The pipeline at a glance

| # | Seat | Model | maxTurns | Deliverable | ~Cost | ~Time |
|---|---|---|---|---|---|---|
| 0 | capture (CODE, pre-wake) | — | — | raw/pages/*.txt, brand.md, assets/, redirect flag | $0 | ~45s |
| — | intake (orchestrator) | Sonnet | — | founder-facts.md (URL verbatim line 1) | ~$0.10 | ~2m founder-paced |
| 1 | research | Sonnet | 6 | research.md — 6 buckets, numbered VERBATIM artifacts | ~$0.15 | ~1.5m |
| 2 | field | Sonnet | 30 | field/picks.jsonl + field/field-summary.json | ~$0.90 | ~6m |
| 3 | create | Sonnet | 15 | creatives/c1–c6.json (harness assembles creatives.json) | ~$0.40 | ~3m |
| 4 | judge | **Opus 4.8** | 1 | verdict.json (schema-enforced) | ~$0.15 | ~40s |
| 5 | build | Sonnet | 12 | prompts + renders/ + build-output.md | ~$0.40 + ~$0.60 render | ~5m |

Step 0 detail: capture the founder URL + homepage + hero PDP (2–3 pages via
`fetchPageSmart`), run brand_identity + product_photos, record final-vs-entered domain
(redirect guard — closes the wrong-brand eval failure).

**Research (seat 1):** reads captured pages ONLY (no fetching; WebFetch paraphrase ban),
6 buckets — offer facts / proof / customer voice / audience EVIDENCE (quoted, not invented
ICP) / niche line (feeds field) / gaps. ONE batched Perplexity call targeted by the derived
niche (external customer verbatim). Cap: 1 page, numbered artifacts.

## 4 — The harvest tool (`mcp__field__harvest`) — all deterministic

Input `{competitorNames[], adjacentNames[], founderDomain, market}`. Steps:

1. **Resolve** each name via find_pages; guards: `page_categories` matches niche,
   domain ≠ founderDomain (own-ads ban), page has ads. Drop-and-log unresolvables.
2. **Scrape** 60–90 ads/advertiser (2–3 cursor pages), 1 page for adjacents. Raw to
   `raw/ads/<brand>.json`. `searchResultsCount` recorded (true volume vs our window).
3. **Triage:** DPA excluded+counted (SKU-push intel); **DCO EXPLODED into card
   siblings** (cards = same copy, different designed images — the brand's test pool;
   verified live on Bewakoof 2026-07-21); VIDEO kept via poster frame; `is_reshared`
   = boosted filter (cleaner than fb.me heuristic); AI-media flag recorded, unscored.
4. **Cluster** (union-find): Meta collation ∪ same normalized LP ∪ identical normalized
   body; then Jaccard ≥0.6 body+title within advertiser. (Real-data proof: "BLUORNG
   T-Shirts. Shop now." on 4 separately-listed ads Meta never grouped.)
5. **Score per LANE** (no single composite — a fresh test can never beat a workhorse on
   one formula, which is how age bias returns). Components 0–1: ITERATION (log₂ cluster
   size /4), ENDURANCE (days/90 × (0.25 + 0.75·ANATOMY) — the anatomy gate kills the
   branding-ad trap), ANATOMY (DR-marker regex: ₹/%/code/CTA/urgency), FRESHNESS (1 at
   ≤14d → 0 at 45d), WAVE (≥3 same-advertiser launches same week), RENDERABLE
   (static/DCO 1.0, carousel 0.9, poster 0.6). **No advertiser weight [F]** — per-
   advertiser caps cover it.
   - WORKHORSE (≥21d): .40·ITER + .30·ENDUR + .20·ANAT + .10·REND, max 2/advertiser
   - FRESH (≤45d): .40·FRESH + .20·WAVE + .20·ITER + .20·REND
   - ADJACENT: workhorse formula within adjacent pages only (guaranteed lane)
   - WILDCARD POOL: unscored — next ~8 unpicked + all oddballs (high-ITER low-ANAT =
     native-performer signature, the Ditto case)
6. **Download** top ~20–24 best-members + manifest.json (full dossier per candidate:
   lane, scores, why-flagged, copy, dates, LP path type).
7. **`hunt_format` entry point** (called by the field seat when field-summary orders
   it): narrow scrape of 2 named master pages, same triage/cluster/score code, returns
   its own manifest. Max 1 hunt/run.

Thin-field fallback: <10 clusters → widen pages, adjacent-heavier; still thin → the
brief must say THIN FIELD honestly (truncation-guard lesson), never pad.

## 5 — The field seat (vision pass) — law summary

One Sonnet context: manifest + view ALL ~20–24 images BEFORE any pick → fill quotas
**6 workhorse / 3–4 fresh / 2 adjacent / 2–3 wildcard** → per pick answer FOUR QUESTIONS
(CONSTRUCTION stated abstractly; DR-CHECK by eye overruling the regex; THE LESSON — one
sentence, no lesson = no slot; CLONE RISK → DO-NOT-CLONE mark) → override code ranking
only with stated reason. **Full heavy read-schema depth on picks** (S154: "does it cover
every anatomy — we don't compromise"): closed formatFamily table (12 families with proof
+ compliance notes — copy from heavy read-schema.md), claimType (closed 8), persona +
awareness, hook VERBATIM + MEASURED scale (cap-height % — "winning proportions transfer
only if measured"), named device, element ROLES (role transfers, person never), craft
finish (photographed-real/designed-flat), palette, validity (event-bound/celebrity/
status/seasonal/retargeting — the borrowed-fuel trap), renderability H/M/L. DCO: view
siblings, pick ONE by eye, record VARIANT AXIS; sibling running standalone = GRADUATED
WINNER mark. Trimmed vs heavy: full per-block inventory, keepSwapDerive (one keep/swap
line on workhorses only), 5-reader fan-out.

**Outputs:** `field/picks.jsonl` — heavy-compatible field names (future bank-append =
file copy) + hook-only lines from unpicked ads; `field/field-summary.json` — register
(+evidence quotes), formatShare (+read line), openLane TYPED (claim-gap: fillable with
field formats / format-gap: HUNT ORDER {format, homeCategory, 2 candidateMasters —
derived from format→home-category knowledge}), intel[], doNotClone[], honesty[]. JSON
strings are judgment prose — multi-sentence, never terse.

## 6 — Create, judge, build — law summaries

**Create (Sonnet [F]):** inputs = founder-facts, research.md, picks.jsonl, field-summary,
brand.md; MUST View pack shots before writing any productZone (rule 9). **Sourcing
ladder — no spec from repertoire:** field pick id / import reference / ONE flagged
experimental slot (only when a format-gap hunt found nothing). Contract at 6: ≤2 per
formatFamily, ≥3 claimTypes, ≥2 personas, ≥1 open-lane play, ≥1 native/logo-stripped.
File-per-spec c1–c6.json (follow-up router needs scoped edits; hook.ts assembles). Spec
schema: sourcePick, keepSwapDerive, formatFamily, claimType, persona, hook{text,
scaleTarget from source pick}, primaryText, headline, cta, visual{scene, productZone-
from-pixels, palette (brand hexes), textPlacement, finish}, **anchors[] (numbered
research artifacts — every number traces)**, renderRefs[], validity, compliance
(subject-swap law: describe the box, never the buyer's condition). No backfill loop.

**Judge (Opus 4.8 [F], ONE turn, no tools — everything inlined by code, INCLUDING pack-
shot images so rule 9 is enforced pre-render):** KILLS objective / FLAGS judgment.
Kills: ANCHOR (cited ≠ supported — the "300+ lenders" lesson), FABRICATION (unfueled
validity, claims research says brand can't hold), SOURCE (pick exists, genuinely adapted,
do-not-clone respected), COMPLIANCE (subject-swap/health/disparagement), PRODUCT-TRUTH
(productZone vs the seen pack shot). Flags→ranking: register match, construction
fidelity, renderability sanity, batch diversity audit (near-dupes named, marginal one
ranked last — HOT c5/c6 precedent), scroll-stop as RANK only. Output verdict.json
(schema-enforced): per-spec {verdict, kills[{check, evidence}], flags, rank, autopsyLine}
+ batch {diversityAudit, shipList, batchOutcome}. **Circuit breaker:** batchOutcome
NORMAL(4+) / THIN(2–3, ships honestly) / FAILED(≤1) → ONE create redo with autopsies
inlined → judge once → ship survivors. Never a second redo.

**Build (Sonnet, heavy build seat trimmed [F]):** model-written prompts under the binder
guidelines — purpose→scene→product→text, views bound assets ITSELF (rule 9), exact
quoted text strings with scale + placement, marks-as-refs never redrawn, prompt recorded
per creative (follow-up re-renders edit the compiled prompt). Renders shipList via render
MCP (KIE primary / fal failover). **No independent gate in lite:** self-glance restricted
to OBJECTIVE catastrophic checks (garbled text / wrong product / missing hook), max 1
scoped re-render per creative. (Survives the S136 self-gate lesson only because the
checks are objective; the quality pixel-gate is the Pro tier's differentiator.)

## 7 — Guards (hook.ts config, reused)

Orchestrator-MCP hard block; founder-URL write-belt on founder-facts.md; spec assembly
(creatives/c*.json → creatives.json); doneRequires = [research.md, picks.jsonl,
field-summary.json, creatives.json, verdict.json, build-output.md]; DONE.md "flagged:"
bypass; post-DONE ceiling relaxation for the router; per-seat maxTurns; maxBudgetUsd ~8
(lite ceiling, headroom over the ~$3 target); 30-min wall hard-stop.

## 8 — The orchestrator prompt (full text, load-bearing)

> Adapted from `agent-loop/pipeline.ts orchestratorPrompt()` — keep its validated
> phrasings. Differences from heavy: 2 intake rounds not 3, no fan-out (ONE agent in
> flight absolute), judge circuit-breaker branching instead of buyer/backfill, founder
> summary cites field evidence per creative (the "why these ads" upsell surface).

```
You orchestrate an ad-creative pipeline. You do NOT do the creative work yourself and you
do NOT call MCP tools. You delegate to specialist seats via the Agent tool; stages hand
off through files in the working directory.

Working directory: <runDir>. The brand URL is <brandUrl>. Before you woke, code already
captured: raw/pages/*.txt (verbatim page text), brand.md + assets/ (logo, palette, voice,
pack shots), and any redirect warning. These are ground truth — never re-fetch, never
substitute prior knowledge of the brand.

CONCURRENCY: exactly ONE agent in flight, always. When you launch an agent you get
"Async agent launched…" — WAIT for its completion notification, then confirm its
deliverable file exists (Read or Glob) BEFORE the next step. Never give up waiting,
never poll-then-quit.

FOUNDER INTAKE (you are in a live chat with the founder):
  0. Read brand.md and the captured pages excerpt first — ask from knowledge, not blindly.
  1. ASK ROUND ONE (AskUserQuestion, up to 4): the conversion event and its price; the
     buyer + market; any offer running now (verbatim if yes); target CPA or budget.
  2. ASK ROUND TWO (AskUserQuestion, up to 4): BRAND LAWS ("what will this brand NEVER
     do — discounts? urgency? — and what real fuel does it hold?"); the REGISTER
     (mass-loud / premium-clinical / follow-the-field); assets check ("upload the hero
     product photo via the panel now" — with a 'no photo' option); compliance lane if
     the category suggests one (finserv/health).
  3. Check assets/ (Glob). Write founder-facts.md replacing the stub. The FIRST line
     after the title MUST be `Brand URL: <brandUrl>` — copied VERBATIM, query params
     included. Record founder answers verbatim; founder-given hexes OUTRANK extraction.
     State every gap explicitly ("NO HERO PHOTO — steer to pack-free constructions").

RUN THIS FLOW, in order:
  • research — subagent "research" → research.md (numbered verbatim artifacts).
      Verify it exists and artifacts are numbered before proceeding.
  • field — subagent "field" → field/picks.jsonl + field/field-summary.json. It calls
      the harvest tool itself, views the creatives, and runs the format hunt internally
      when its summary orders one. Verify BOTH files exist and picks.jsonl parses.
  • create — subagent "create" → creatives/c1.json … c6.json (the harness assembles
      creatives.json; neither you nor create writes it). Verify 6 spec files exist.
  • judge — subagent "judge" (cold: pass it NOTHING of create's reasoning; it reads the
      spec files and inlined evidence itself). It returns verdict.json. Read it and
      branch on batchOutcome:
        · NORMAL (4+ ship) → proceed with the ranked shipList.
        · THIN (2-3) → proceed too — honest gaps ship; note it for the summary.
        · FAILED (≤1) → ONE redo: re-run create ("read verdict.json; write a NEW batch
          answering every autopsy line; survivors stand untouched"), then judge once
          more, then proceed with whatever survives. NEVER a second redo — if the fresh
          verdict is still FAILED, ship the survivors and write the flag into DONE.md.
  • build — subagent "build", instructed with the shipList ids and ratios. It views the
      bound assets, writes the prompts, renders via the render tool, runs its own
      catastrophic-only glance with AT MOST one scoped re-render per creative. It
      writes build-output.md (image paths inside). Verify the images exist on disk.

Your FINAL action once images are on disk (or you flagged): write DONE.md — one line,
"shipped: <paths> — <n>/<total> through judge" or "flagged: <reason>". Only at true
completion. Then summarize for the founder: what shipped, which field evidence each
creative adapts (from picks.jsonl), and what was killed and why (verdict autopsies).
Plain language, no jargon.

FOLLOW-UPS — THE ROUTER (the chat continues after DONE.md). Never re-run the whole
pipeline; route to the SMALLEST seat that owns the change, scoped by name:
  · QUESTION ("why this hook?", "what does Snitch run?") → answer YOURSELF from the
    files (Read/Grep picks.jsonl, verdict.json, research.md). Launch NOTHING.
  · COPY/SPEC change on an existing creative → create, scoped ("edit ONLY c3's
    <field>; touch nothing else") → build scoped to c3. Founder-directed, so the
    JUDGE IS SKIPPED.
  · RENDER problem, spec unchanged ("logo garbled") → build scoped re-render. No create.
  · NEW concept ("try something around X") → create (ADD c7; survivors untouched) →
    judge the new spec cold → build. New bets always face the judge.
  · UPSTREAM truth changed (new offer, different audience) → confirm with
    AskUserQuestion first (name what re-runs and why), then create ⇄ judge → build.
    Re-run field ONLY if the founder names a different market or competitor set.
  If the ask is VAGUE ("make it pop"), AskUserQuestion to pin it down BEFORE delegating.
```

## 9 — Build order

- **P0 — scaffold (half day):** `lite-loop/` folder, imports wired, step-0 capture
  (multi-page fetchPageSmart + redirect check), hook config, web.ts entry reusing
  chat/web. Smoke: capture runs on a real URL.
- **P1 — harvest tool (1–2 days, the biggest new code):** resolve/scrape/triage/cluster/
  score/download/manifest + hunt_format. **Testable standalone with NO model and NO
  credits:** run against the committed menswear corpus as fixtures
  (`docs/research/ad-library/india-menswear-d2c-2026-07-16/`) + the two raw scratchpad
  pulls (Snitch, Bewakoof). Assert: DCO explosion, cluster merges (the BLUORNG ×4
  case), lane winners, per-advertiser caps, thin-field fallback.
- **P2 — seats (1 day):** stages.ts + the four reference files (vision-pass, read-schema-
  lite, judge-rubric, build-guidelines — adapt from heavy's, don't rewrite).
- **P3 — orchestrator + wiring (half day):** pipeline.ts, judge inlining code (specs +
  research + pack-shot images → one prompt; schema-enforced output), circuit breaker.
- **P4 — first live run + validation (§10).**

## 10 — Validation protocol (P4)

Run on **houseoftwilight.in** first — S153's heavy run on the same brand is the quality
benchmark (3/3 shipped, $4.38/shipped, gate-passed renders to compare against).
- **Hard gates:** cost ≤ $3.50; wall ≤ 20 min; ≥4/6 through judge; zero unanchored
  numbers in shipped copy (grep every number → research.md artifact); every spec names
  a real sourcePick; quotas filled or THIN FIELD declared; zero own-brand ads in picks.
- **Judgment checks (founder eyeball):** renders vivid + brand-true (palette, product
  identity vs pack shots); copy register matches founder call; the 6 specs actually
  diverse (contract held); judge kills have evidence lines that make sense.
- **Then one cold brand** (never run before, different niche) to catch HOT-overfit.
- Second run on same niche later → verify field cache… (deferred, see §11).

## 11 — Explicitly deferred

Production port (DO / WebSocket / sandbox / AskUserQuestion file-IPC), bank accumulation
+ formal cross-run taxonomy adoption, field-mini caching per niche, the audit product,
the Pro bridge daemon, Opus-create A/B (founder closed it — revisit only if validation
shows flat copy), image-similarity clustering (accepted gap — vision pass notes visual
families by eye).

## 12 — S155 review amendments (founder-approved 2026-07-21, pre-build)

Code-grounded review against the heavy loop found four holes; founder settled all:

1. **Competitor sourcing (was unassigned):** harvest needs `competitorNames[]`/
   `adjacentNames[]` but nothing produced them (heavy's Perplexity rings were dropped in
   distillation). **Fix [F]: research owns discovery** — its ONE batched Perplexity call
   also returns competitor + adjacent advertiser names for the derived niche; research.md
   gains a COMPETITOR CANDIDATES section; field passes those names to harvest. Founder-
   named competitors in founder-facts.md (if any surface in intake) lead the list.
2. **Judge mechanism (was self-contradictory §6 vs §8):** **judge is a SUBAGENT [F]**, not
   code-compiled inlining — tools Read/Glob/Write, ~6 turns, Opus 4.8, cold context. It
   reads the spec files and research itself and VIEWS pack shots via Read (rule 9 intact).
   Schema enforced deterministically: a PreToolUse hook validates verdict.json on Write
   and denies malformed output.
3. **Chat/web reuse seam:** `chat/session.ts` hardwires heavy `buildBaseOptions`. Approved:
   ONE additive change in agent-loop — optional `buildOptions` param on ChatSessionArgs
   (defaults to heavy builder; zero heavy behavior change). web server is FORKED into
   lite-loop (per-connection plumbing differs anyway); reducer/public assets imported.
4. **Harvest fetch layer:** scrapecreators' `apiGet`/cursor loops are private; harvest
   re-implements ~60 lines of HTTP+cache (own cache dir `lite-loop/.cache`). It works from
   RAW payloads (own entry shape — `rawAdEntry` drops cards/is_reshared/page_categories).
   Verified live shape: `is_reshared` lives at `snapshot.is_reshared`.

**Fixture reality (P1):** committed corpus.json is SHAPED (no snapshot/cards/is_reshared)
— drives cluster-merge (BLUORNG ×4), lane, cap, thin-field tests via a raw-shape adapter.
DCO explosion + is_reshared tests need RAW payloads: rescued from the S154 scratchpad into
`lite-loop/fixtures/{snitch-raw,bewakoof-raw}.json` (2026-07-21). All fixture image URLs
are dead (48h signing) → harvest gets a skip-downloads flag; the test exercises it.

**Quality guards added:** field seat appends picks.jsonl INCREMENTALLY (one line per
finished pick — compaction never loses completed reads); wall hard-stop 60 min with the
30-min figure a validation gate only (intake is founder-paced; redo+renders legitimately
run ~25 min); step-0 capture biased to 3 pages incl. a reviews/proof page when linked;
research must enumerate EVERY number found (S152 rule). Models pinned explicitly:
`claude-sonnet-4-6` (matches validated heavy runs) / judge `claude-opus-4-8`.

## 13 — Fast pointers

Heavy artifacts this plan adapts: `agent-loop/pipeline.ts` (orchestrator + options),
`agent-loop/stages.ts` (seat prompt style), `agent/.claude/skills/field/references/
read-schema.md` (closed formatFamily table — copy the table verbatim),
`agent/.claude/skills/build/SKILL.md` + `references/gate.md` (rule 9, prompt law),
`agent-loop/mcp/*` (all four servers), `agent-loop/hook.ts`, `agent-loop/chat/*` +
`web/*`. Live API shape verified 2026-07-21: scratchpad `sc-raw.json` (Snitch) +
`sc-bewakoof.json` (DCO cards) — re-pull if scratchpad is gone. Cost law: MAX
`total_cost_usd` per segment, never sum. Web server restart after every code edit (tsx).
