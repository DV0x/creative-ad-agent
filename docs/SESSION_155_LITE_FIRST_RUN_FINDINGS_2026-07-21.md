# S155 — LITE pipeline, FIRST LIVE RUN: findings log

> **STATUS UPDATE (same day, post-analysis): ALL FIXES IMPLEMENTED — 55/55 fixture checks green,
> both loops typecheck, web boots.** What landed: F1 (1h TTL off for lite) · F2/F14 (pool capped 28
> via planDownloads, siblings only for workhorse DCO, DISABLE_MICROCOMPACT, batched image viewing)
> · F3 (global advertiser cap 3) · F4 (lane verbatim + fillsQuota/promotionReason, hook-enforced) ·
> F5 (word-boundary resolver + domain retry + nicheKeywords; research supplies "Name — domain") ·
> F6 (research 8000-char validator) · F7 (field maxTurns 60) · F8 (openlane: ladder rung + honest
> shortfall) · F9 (Write-validators on research/summary/picks/specs, closed vocab enforced) · F10
> (literal render call shape in build prompt) · F11 (4th glance check: annotations point true) ·
> F12 (captionFixes in verdict schema + orchestrator sanitation step) · F13 (pack-shot inventory in
> brand.md + intake must view) · F15 (judge diet: batch reads, Grep-scoped picks) · F16 (render.ts
> jobs parallel ×3 — agent-loop, founder-approved) · F17 (READ-ONCE + orchestrator intake diet) ·
> F18 (anti-halt law all seats + sanctioned SendMessage stall recovery) · F19 (canUseTool
> deny-by-default; Edit added to allowedTools; SendMessage/ToolSearch/TaskOutput sanctioned) ·
> trace slimming (LiteTraceLogger strips base64) · budget 25→12. UNCOMMITTED pending run 2.

**Run:** `lite-loop/runs/2026-07-21-10-34-04_www-houseoftwilight-in` · brand houseoftwilight.in
(the S153 heavy-run benchmark brand) · **COMPLETE**: 16:04 → 17:05 wall (61 min), **$10.46 total**
($6.81 session 1 + $3.65 the resumed session), 5 creatives shipped, 5/6 through judge.
**Purpose of this doc:** every issue with evidence. Findings ordered by severity, not discovery.
**Verdict in one line:** the pipeline WORKS end-to-end and produces publishable, brand-true,
field-derived ads — at 3× the cost target, 3× the time target, and only with three human
interventions (budget raise, server restart + resume, field-summary schema rewrite).

---

## F1 — COST: cache writes are 85% of spend (1h TTL × a re-written image context)  ★ CRITICAL

**Evidence** (result segment at +14.9m, cumulative $6.811, field seat only ~6/15 picks in):
```
sonnet-4-6:  cacheR 1,831,606 | cacheW 959,719 | out 33,460  → $6.810
```
Cache WRITE alone ≈ $5.76 of the $6.81. Prior segments: $0.475 (intake) → $0.652 → $1.159 (research
done) → $6.811. So the field seat's vision pass burned ~$5.65 on its own.

**Root cause — two compounding factors:**
1. `loadEnv()` (imported from `agent-loop/chat/setup.ts`) sets `ENABLE_PROMPT_CACHING_1H=1`. That was
   S153 fix #3 and it is CORRECT FOR HEAVY, where stage gaps exceed the 5-min TTL. A 1h cache write
   costs **2× base input**; the 5-min write costs **1.25×**. Lite's field seat writes a pick file
   every ~35s — it never approaches the 5-min expiry — so the premium buys nothing and adds ~60%.
2. The seat's context is ~140k tokens (59 images + 45KB manifest + law + schema). Every pick file
   appends to the conversation, so the prefix is re-written roughly once per turn: 960k cacheW ÷
   ~140k ≈ 7 rewrites.

**Fix:** (a) do NOT inherit the 1h TTL in lite — unset/override `ENABLE_PROMPT_CACHING_1H` in the
lite entry (agent-loop keeps it); (b) shrink the image pool (see F2). Estimated effect: field seat
from ~$5.65 to well under $1.50.

**Consequence during the run:** hit the `maxBudgetUsd: 8` ceiling risk mid-field. Raised to 25
in-flight (pipeline.ts) so the run could finish — a budget abort mid-field is expensive to recover
from because a resumed run RE-LAUNCHES the field seat from scratch (subagent contexts don't resume).

---

## F2 — Image pool inflated 2.25× by DCO siblings (59 files, 57MB, vs ~24 designed)

**Evidence:** 24 lane picks → 22 distinct ads → **59 image files**. 19 of 24 picks are DCO.

**Root cause — a collision between two plan sections, both implemented literally:**
§4.6 says download "top ~20–24 best-members" (one per cluster); §5 requires the vision pass to view
ALL DCO siblings to pick one by eye and record the variant axis. `harvestRun` downloads up to 3
siblings per pick, and this category is DCO-dominant, so most picks brought 2–3 files.

**Fix:** cap the TOTAL pool (~28 files) rather than per-pick; pull siblings only where the variant
axis is load-bearing (DCO workhorses), not for every DCO pick. Directly compounds F1.

---

## F3 — Per-advertiser cap is PER-LANE, not global → one advertiser took 7/24 picks

**Evidence:** Bombay Shirt Company holds 7 of 24 picks (29% of the field).

**Root cause:** in `selectLanes`, `capped()` creates a fresh `perAdv` counter on every call, so
`PER_ADVERTISER_CAP = 2` applies within each lane independently (2 workhorse + 2 fresh + …). The
WILDCARD pool applies no cap at all.

**Why it matters:** the founder call was "**no advertiser weight [F]** — per-advertiser caps cover
it." The guard is weaker than that decision assumed. Skew propagates into the register read, and
this run's register is "follow-the-field," so it flows straight into create.

**Fix:** one shared counter across all four lanes; give wildcard a cap too.

---

## F4 — The vision-pass law LICENSES lane relabeling (evidence class rewritten)

**Evidence:** `field/picks/p1.json` records `lane: "workhorse"` with `daysRunning: 9`. The manifest
classes that same candidate `lane: "wildcard"`. Workhorse means ≥21d survivor.

**Root cause — MY WORDING, not model error.** `references/vision-pass.md` says the seat may override
the code's ranking "(pick a lower-scored candidate over a higher one, **move a wildcard into your
workhorse six**)". Intent was "promote a wildcard into the set of picks filling the quota"; the plain
reading licenses rewriting the evidence class. The seat followed instructions.

**Why it matters:** a lane is an EVIDENCE CLASS, not a quality rating. Relabelled, a 9-day ad carries
a survivorship claim it has not earned; the quota report ("6 workhorses") stops meaning what it says;
create and judge both read the field.

**Fix:** lane is copied VERBATIM from the manifest and never edited. Add a separate `promotedFrom`
field (+ stated reason) if the seat wants to express promotion.

---

## F5 — Resolver picks namesakes: lost Snitch, the single most relevant competitor

**Evidence:**
- `"Snitch"` → page **"No Snitches Allowed"** (1,912,648 likes) — a namesake.
- `"The Man Company"` → page **"The MAN Company" with 1 like**.

**Root cause:** `resolvePage` matches names by plain substring (`"no snitches allowed".includes("snitch")`
is TRUE) and then sorts candidates by likes, so a high-follower impostor wins.

**Mitigation that held:** both bad pages run zero active ads, so the has-ads guard dropped them before
they reached the field — **no pollution occurred**. Nine advertisers resolved correctly.

**Residual damage:** Snitch is the biggest Meta advertiser in Indian menswear and the closest analogue
to this brand; its absence shapes the register read (Souled Store / Bonkers Corner streetwear rather
than Snitch's polish).

**Fix (all three were in plan §4 and under-implemented):** word-boundary matching instead of substring;
retry with the brand's DOMAIN when a match looks suspicious (the heavy `competitor_find_pages` tool
description already prescribes this); the `page_categories` niche guard.

---

## F6 — research.md ignored the ONE PAGE hard cap (16.5KB / 164 lines, ~4 pages)

Costs output tokens at write time and context in create + judge, both of which read it whole.
Content quality was high (see W2) — this is a length-discipline failure, not a quality one.

---

## What WORKED (do not regress these)

- **W1 — DCO explosion validated live.** 19 of 24 picks are DCO; only 1 is a plain IMAGE ad. A
  pipeline that ignored DCO would have had almost nothing to read in this category. The single most
  important triage decision in the design is confirmed.
- **W2 — research owns competitor discovery (S155 amendment) WORKS.** 56 numbered artifacts
  (`[A1]`–`[F7]`) + 16 competitor/adjacent names, 9 of which resolved to real advertisers. The price
  structure was captured as separate traceable facts (`[E1]` ₹1,799 hero / `[E2]` ₹1,999 most styles
  / `[E3]` banner verbatim "Was ₹3000" / `[E4]` HOT35 recorded as secondary per founder override) —
  exactly the ammunition the ANCHOR check needs.
- **W3 — DR-check-by-eye overruled the regex, correctly, on pick 1.** The anatomy regex scored a BSC
  ad low (no price/discount); the seat viewed it and argued "Ships in 1 Day" is the real conversion
  lever for an Indian D2C buyer. That is judgment no formula produces — the reason the seat exists.
- **W4 — incremental picks assembly (S155 guard) is doing its job.** One file per pick, hook-assembled
  into `picks.jsonl` on every landing; work survives an abort. This is what makes a budget-abort
  recoverable at all.
- **W5 — the has-ads guard neutralized both bad resolves** (see F5) with no field pollution.
- **W6 — no compaction** through the vision pass, despite ~140k tokens of context.
- **W7 — capture (step 0) clean:** 6.3s, logo + 4 real pack shots + 3 pages verbatim, no redirect.
- **W8 — harvest is cheap:** ~35 ScrapeCreators credits for 541 creatives across 9 advertisers.
- **W9 — THE FOLLOW-UP ROUTER WORKS, and it is the economic case for keeping the orchestrator [F].**
  First live follow-up ("fix the camp-collar arrow") routed to `build` ALONE, scoped to ONE render
  job — **no create, no judge**, exactly the "render problem, spec unchanged" route. All four arrows
  corrected, output versioned `_v2` with the original preserved. **Cost: $0.64** vs ~$10 for a full
  re-run — a ~16× saving on the iteration path, on its first real use. This validates the founder's
  locked call ("orchestrator STAYS — follow-ups need a router") with real numbers, and it means the
  post-DONE ceiling relaxation in hook.ts works as designed.

---

## F7 — The field seat ran out of TURNS, not budget (maxTurns 30 vs 77 Reads)

The vision pass viewed 59 images (≈59 Read calls) and had written only 5 of 12–15 pick files before
it stopped without `field-summary.json`. **maxTurns: 30 was never survivable** for a
view-all-then-write-15 design — even at the intended 24 images it needs ~40. Compounded by F2.
**Fix:** raise to ~60, AND cut the pool (F2) so the arithmetic works: ~24 views + ~15 writes + slack.

**Downstream damage:** create needed 6 specs from 5 picks (one asset-blocked) → it invented sourcing
paths (F8) and invented format families. The thin batch is a SYMPTOM of F7, not a create failure.

---

## F8 — Create has no HONEST-SHORTFALL path, so under-supply forces invention

With 4 usable picks and a hard contract at 6, create produced: c4/c5 sourced from
`import:research[...]` (not a rung on the ladder — the ladder is field pick / founder upload / ONE
flagged experimental), c6 claiming the experimental slot without the failed hunt that legalizes it,
and **3 of 6 invented formatFamily values** (`identity-statement`, `occasion-hook`, `type-manifesto`)
plus 2 invented claimTypes (`identity`, `manifesto`), none prefixed `other:`.

**Second-order effect:** the diversity contract LOOKS satisfied (6 families, 5 claim types) only
because inventing a family name is the cheapest way to satisfy "≤2 per family." The contract is being
met by vocabulary, not by genuinely different constructions.

**AND — a design contradiction that is mine:** the contract demands "≥1 open-lane play," but an open
lane BY DEFINITION has no field construction behind it, while the ladder permits only field picks.
Create *had* to invent a path. The judge resolved this sensibly (accepted the open-lane import); my
audit called it a violation before I noticed I had written both rules.
**Fix:** (a) add an explicit rung for open-lane plays sourced from research + field-summary.openLane;
(b) give create an `honesty[]` equivalent — "write FEWER specs and declare the shortfall" beats
inventing; (c) make the closed tables enforced, not described.

---

## F9 — Schema drift on THREE seats: prose schemas are treated as suggestions

- **field-summary.json** wrote `totalPicks/laneCounts/top3Constructions/…` — ZERO of the six
  specified keys (register/formatShare/openLane/intel/doNotClone/honesty). Fixed only by a manual
  re-run instruction mid-flight; the rewrite then produced all six correctly.
- **creatives/c*.json** used `sourcePickId`/`researchAnchors`/`keepSwapDerive`-as-string and
  **omitted `persona`, `validity`, and `compliance` entirely** — killing the inputs to three judge
  checks (the ≥2-personas contract, the borrowed-fuel guard, the subject-swap law).
  The spec-assembly hook survived only because it falls back to parsing the filename.
- Common cause: I describe schemas in PROSE inside seat prompts. Only `verdict.json` — which has a
  deterministic validating hook — came out shape-correct on the first write.
**Fix:** the verdict-hook pattern generalizes. Validate `field-summary.json` and `creatives/c*.json`
on Write and DENY with the precise reason. That mechanism is already proven in this very run.

---

## F10 — Build passed invalid `size` values; 3 render rounds wasted

`'1080x1350'` then `'portrait_4_5'` — both rejected by KIE *and* fal (the failover chain worked
correctly; the input was wrong). The third attempt omitted `size`, defaulted to `'4:5'`, and
succeeded. Cause: the lite build prompt describes the ratio in prose; the HEAVY prompt shows the
literal call shape including `size: "4:5"`. **Fix:** show the exact JSON shape in the lite prompt.

---

## F11 — The catastrophic-check list has the wrong boundary (the camp-collar case)

c2's "Camp collar" annotation arrow points at the **cuff**, not the collar. The build seat SAW it and
logged it: *"aesthetic placement drift, not a catastrophic failure. Not re-rendered per law."*
The law worked exactly as written — and the law is wrong here. A mislabelled callout is not
aesthetics, it is a FALSE STATEMENT about the product, on an infographic whose whole premise is that
each label points at the pixel it names.
**Fix:** add a 4th objective check — "every on-image annotation/callout points at the thing it
names." Still objective, still catastrophic-only; no quality gate smuggled in.

**AMENDED after the follow-up (see W9):** the seat is fully CAPABLE of the fix — asked directly, it
corrected all four arrows in one scoped re-render for $0.64, and improved the arrangement (moved
"Dobby crosshatch weave" to the sleeve where the texture actually reads). So the law is behaving
correctly in BOTH directions: it refuses to spend money on self-judged aesthetics, and founder
direction overrides the restriction. The real gap is not capability — it is that **nothing surfaces
this class of defect to the founder automatically** (the judge sees specs, not rendered pixels; lite
has no gate seat by design). Either the 4th check above, or accept that pixel-level truth errors are
founder-caught in lite and gate-caught in Pro. That is a TIER decision, not a bug.

---

## F12 — Caption copy has NO post-judge gate (the only defect that reaches a customer)

Build correctly compiles only ON-IMAGE strings, so it stripped "Ships today" from the pixels of c1
and c4 (acting on the judge's flags — good). But **nothing edits `bodyOrCaption`**, so the shipped
copy pool still contains:
- c1: `"Was ₹2,999. Now ₹1,799. 33% off — no code, no catch. Ships today."` → the discount is **40%**,
  and the site's own shipping page says *"Delivery times vary depending on your location."*
- c4: `"₹1,799 (was ₹2,999). No code. Ships today."` → same two problems.

The judge FLAGGED this ("create should cut", "same deliverability overreach as c1; drop it") and no
seat owns acting on a flag. **A flag with no actor is a note.** This is the one finding that would
mislead a real customer — the images are clean, the paste-into-Ads-Manager text is not.
**Fix:** either the judge's flags become create-actionable before build, or build owns caption
sanitation, or the shipped copy pool is regenerated post-verdict.

---

## F13 — A FALSE asset constraint propagated through four stages; only the judge caught it

founder-facts.md recorded *"❌ NO HERO LIFESTYLE/MODEL PHOTO"*; the field seat inherited it into
`assetConstraint` and marked Andamen's lifestyle pick "structurally blocked"; create steered the
whole batch to pack-shot-or-type-led. **All four pack shots in `assets/` show a male MODEL wearing
the shirt.** The judge caught it by VIEWING the pixels and said so in its diversity audit. (I also
repeated the false constraint twice before opening the file myself.)
**Root cause:** intake asked the founder "do you have a hero photo?" — the founder's mental model
("I have no lifestyle shoot") ≠ what `product_photos` had already downloaded. Nothing looked.
**Fix:** step-0 capture should REPORT what the pack shots actually contain (a cheap vision pass, or
simply "N pack shots downloaded — intake must view them before recording asset gaps").

---

## Gate status (plan §10) — FINAL

| Gate | Target | Actual | |
|---|---|---|---|
| cost | ≤ $3.50 | **$10.46** (~$2.09/shipped creative) | ✗ MISS (3×) |
| wall clock | ≤ 20 min | **61 min** | ✗ MISS (3×) |
| ≥4/6 through judge | ≥4 | **5/6** | ✓ PASS |
| zero unanchored numbers in shipped copy | 0 | **images 0 ✓ / captions 2 ✗** (F12) | ✗ PARTIAL |
| every spec names a real sourcePick | all | **3 of 6** (F8) | ✗ MISS |
| quotas filled or THIN FIELD declared | — | 5 picks vs 12–15; **declared honestly** in honesty[] | ✓ PASS (honest) |
| zero own-brand ads in picks | 0 | **0** | ✓ PASS |
| unattended completion | — | **3 human interventions required** | ✗ MISS |

Benchmark: S153 heavy on the same brand = 3/3 shipped @ $4.38/shipped. Lite = 5 shipped @
$2.09/shipped — **cheaper per creative, 3× more expensive per run**, and not yet unattended.

---

# TRACE DEEP-DIVE (post-run, full 113MB parse — per-call usage, dedup'd by message id)

Computed cost cross-check: $11.62 vs SDK-reported $11.10 (rates confirmed within 5%).

## Per-seat cost (1h cache-write rates) — and what the same traffic costs at 5-min TTL

| seat | model | API calls | cacheR | cacheW | cost | @5m TTL |
|---|---|---|---|---|---|---|
| field | sonnet-4-6 | 37 | 941k | **880k** | **$5.58** | $3.60 |
| judge | opus-4-8 | 8 | 350k | 92k | **$3.30** | $2.26 |
| orchestrator | sonnet-4-6 | 43 | 2,348k | 83k | $1.21 | $1.03 |
| build | sonnet-4-6 | 21 | 574k | 95k | $0.75 | $0.53 |
| research | sonnet-4-6 | 11 | 265k | 61k | $0.45 | $0.31 |
| create | sonnet-4-6 | 12 | 320k | 39k | $0.34 | $0.25 |

## F14 — THE REAL FIELD-SEAT KILLER: context pruning invalidated the cache EVERY call ★ CRITICAL

The per-call pattern is unambiguous. Through +13.6m the seat cached normally (cacheR growing
19k→59k, cacheW ~4.5k per image read). From +13.8m, once context crossed ~60k with dozens of
image tool-results on board, **cacheR collapsed to a flat 7,695 (= system prompt + tools only) and
every call re-wrote 50–64k**, for ~14 consecutive calls, while total context stayed pinned at
~55–65k instead of growing. That signature = the harness's tool-result pruning (microcompact —
"keeps last N tool results per type") was **dropping older image results each turn → the
conversation prefix mutated → full cache invalidation → complete re-write, every call, at the 2×
1h-TTL rate.** (The judge, with only 4 images and 15 reads, grew cleanly 13k→85k with no pruning —
the trigger correlates with image-result volume, not raw size.)

Two consequences, one worse than the money:
1. **~$4.40 of the field seat's $5.58 was pure re-write waste** (880k cacheW for a ~65k context —
   the same tokens written ~13×).
2. **The vision-pass law was silently broken.** "View ALL images, hold them in mind, then pick" —
   by pick-writing time the harness had already dropped the earlier images from context. The seat
   picked from its accumulated notes, not from held pixels. The "full heavy read-schema depth, we
   don't compromise" clause was undermined by the harness, invisibly.

**Fixes (compound):** cap the pool (F2) so context stays well under the prune threshold; batch
image Reads 4–6 per message (59 sequential single Reads → ~12 calls); test `DISABLE_MICROCOMPACT=1`
for the lite subprocess; drop the 1h TTL (F1). Projected field seat: **$5.58 → ~$1.20.**

## F15 — Judge is 22× its planned cost ($3.30 vs ~$0.15) — Opus × 85k context × 1h cacheW

$2.77 of $3.30 is cache writes at Opus's 1h rate ($30/M). Context reached 85k because the judge
reads EVERYTHING whole: 16.5KB research (4× its cap — F6), 24KB picks.jsonl, 6 specs, 2 summaries,
brand.md, founder-facts + 4 pack shots, across 8 sequential API calls.
**Fixes:** 5-min TTL (→$2.26); enforce the research 1-page cap; Grep-scoped pick lookup (only the
6 cited sourcePicks, not the whole file); batch the file reads. Projected: **~$1.20–1.40.**
(Opus at the judge stays — the seat caught things nothing else did; see W-judge in findings above.)

## F16 — Renders are SEQUENTIAL: 8.3 min for 5 images; failed rounds added ~5 min more

Timeline: 3 failed rounds (+12.5→+15.1, bad `size` values) then the real render +15.1→+23.4 —
~100s/image, serial. The follow-up repeated the same failure once (fresh build seat, same missing
call-shape) before succeeding. **Fixes:** (a) F10 (show the literal call shape — kills the failed
rounds and their ~$0.50/5min); (b) parallelize jobs inside the render tool (concurrency ~3):
8.3m → ~3m. (b) is an agent-loop change — flag to founder before touching.

## F17 — Small redundancies (each cheap, all compound)

- **research re-read the SAME spilled tool-result file 4×** (the perplexity batch exceeded
  MAX_MCP_OUTPUT_TOKENS → SDK wrote it to ~/.claude/projects/...txt; the seat then Read it four
  times). READ-ONCE instruction + consider a leaner batch.
- **orchestrator ingested ~9 files at intake** (incl. the full 20KB intake-ground); its context is
  re-read on every one of its 43 wakes (2.35M cacheR total). Mandate brand.md + redirect.txt only.
- **build re-read prompts.md 4× and build-output.md 2×** (its own writes). READ-ONCE nudge.
- **capture fetches the founder URL up to 4×** (redirect check, intake-ground, page-text,
  brand-identity) — time-only (~15s), share one fetch when convenient.
- **trace.jsonl is 113MB** — TraceLogger embeds viewed images as base64. Disk + resume-speed only;
  consider skipping image blocks in the logger (agent-loop change, optional).
- **Timing note:** create (s5, +1.7m) launched BEFORE the field-summary schema rewrite (s6, +3.8m)
  landed — create likely read the wrong-key v1 summary; the judge read v2. Worked out by luck;
  the F9 validating hooks remove the whole class.

## F18 — Research seat ENDED EARLY without producing anything; the orchestrator improvised a
recovery through an UNSANCTIONED tool ★ two findings in one

Trace: research "completed" at +5.1m having only READ the ground-truth files — no Perplexity call,
no research.md (the classic narrate-then-halt: an async agent that ends its turn with plain text is
done). The orchestrator then did something nowhere in its prompt: **ToolSearch("select:SendMessage")
→ SendMessage(to: <research task id>, "You stopped after reading… now run the batched Perplexity
call and write research.md")** — and the SAME agent resumed with context intact and finished
properly at +7.9m. This explains the double research task-end, ~2.5 min of session-1 time, and the
4× re-reads of the spilled Perplexity file (spread across the two passes).

Two conclusions:
1. **Bug:** seat prompts need an anti-halt line ("you are not done until <deliverable> exists —
   never end a turn without a tool call or the file written"), and the orchestrator's verify step
   should name the sanctioned recovery.
2. **The recovery itself was BETTER than a relaunch** (context preserved, no re-read cost) — worth
   sanctioning SendMessage-nudge as the official stall recovery. But note it only worked because of
   F19.

## F19 — canUseTool AUTO-ALLOWS any tool outside allowedTools (chat path) — permission surface
is wider than designed

`ChatSession.canUseTool` returns allow for everything that isn't AskUserQuestion. ToolSearch and
SendMessage weren't in lite's allowedTools; they ran anyway. **Bash/Edit/WebFetch would equally have
run.** The orchestrator's "no MCP" is hook-enforced (holds), but its wider tool ban is prompt-only.
Same hole exists in the heavy chat path. **Fix:** deny-by-default in canUseTool against an explicit
allowlist — and ADD SendMessage to it as the sanctioned stall-recovery tool (F18).

## W10 — the verdict schema hook FIRED LIVE and did its job

The judge's FIRST verdict.json write was malformed ("missing specs array") — the PreToolUse hook
DENIED it with the precise reason and the judge wrote a correct file on the next attempt. The
deterministic-validation pattern is now proven under fire, which is exactly why F9 generalizes it
to field-summary.json and creatives/c*.json.

## Where the 61 minutes went (and the production trajectory)

| block | actual | after fixes |
|---|---|---|
| intake (founder-paced) | ~3.5m | ~2–3m |
| research | ~1.8m | ~1.8m |
| harvest tool (API-bound, serial per advertiser) | ~4m | ~1.5–2m (parallelize advertisers) |
| vision pass (turn-starved, 59 imgs) | ~4m for 5 picks | ~6m for 15 picks (24 imgs, batched) |
| field wind-down + park + HUMAN INTERVENTION + resume | ~14m | 0 |
| summary rewrite (schema fix) | ~2m | 0 (validating hook) |
| create | ~1.3m | ~1.5m |
| judge | ~3.3m | ~3m |
| build: failed render rounds | ~2.6m | 0 |
| build: renders (serial) | ~8.3m | ~3m (parallel) |
| DONE + founder summary | ~1m | ~1m |
| **total** | **~46m active + ~12m stall** | **~21–24m unattended** |

**Projected production cost** after the fix list: field ~$1.20 + judge ~$1.30 + orchestrator ~$1.00
+ build ~$0.55 + research ~$0.30 + create ~$0.25 ≈ **$4.6 ± 0.5** (vs $11.10 actual). The $3.50
gate is reachable only with the judge-context diet landing well; **$4.50 is the honest planning
number** at current scope. Per shipped creative: well under $1.

---

# RUN 2 FINDINGS (theratefinder.ca — service brand, regulated, CA market)

Run 2 deliberately changed brand rather than re-running HOT: service brand (no PDP/pack shots),
finserv compliance lane, lead-gen conversion, CA market. Costs tracked ~18% under run 1 at matched
stages (intake $0.388 vs $0.475; post-research $0.952 vs $1.159) — consistent with the F1 TTL fix.

**Fixes CONFIRMED working live:** F18 anti-halt (research wrote instead of narrating-and-stopping)
· F6+F9 research validator (denied at 9,752 chars → recovered at 7,111 **inside its turn budget**,
no intervention; 57 artifacts preserved in 57% fewer bytes = 2.3× density) · F13 asset verification
(intake wrote "Assets on disk — ACTUAL state (verified by orchestrator)" with real SVG dimensions
and element colours; correctly recorded NO pack shots, which is TRUE here) · F5 partial (research
supplied all 12 competitors WITH domains; domain retry fired for Ratehub) · F2/F14 (12 images, no
turn starvation) · F4 (first picks copy lane verbatim) · trace slimming (132KB at 127 lines vs run
1's 113MB/1008) · compliance memory applied unprompted (subject-swap law written into founder-facts
though the founder named no constraints).

## F20 — Resolver still takes namesakes on SINGLE-TOKEN names; likes-gate suppresses the retry ★

**Evidence:** `"Pine" → Cardinal & Pine` (US news outlet, 99,126 likes) · `"Perch" → Fort Perch Rock
Battery` (UK museum, 51,994 likes). Also marginal: `"Ratehub" → Ratehub.ca Cabinet en courtage
hypothécaire - QC` (709 likes — a regional FR page, contributed 2 French picks to an EN Ontario
field) and `"rateshop.ca" → Noor's Mortgages Rateshop.ca` (28 likes — a franchisee).

**Two distinct causes:**
1. `nameMatches` accepts a query whose tokens are a SUBSET of the candidate's: `["pine"] ⊆
   {"cardinal","pine"}` → true. Fine for "Beardo" vs "BEARDO for Men"; wrong for one-word brands.
2. The domain retry is gated on `!best || best.likes < 1000` — a HIGH-follower namesake means
   `best` exists with big likes, so **the retry designed to catch namesakes never fires**.

**Mitigation held again:** both namesakes run zero CA ads → has-ads guard dropped them, ZERO
pollution (same belt that saved run 1 from the Snitch namesake). The cost is LOST REACH: pine.ca
and myperch.io are digital-native brokers in exactly this client's segment and were never checked.

**Fix:** (a) for a single-token query require an EXACT normalized name match (or ≥0.5 token overlap
both ways) — never bare subset; (b) ALWAYS run the domain retry when a domain is known, and prefer
the domain-matched page over a name-matched one regardless of likes; (c) treat a page whose likes
are <1% of the roster median as suspect and prefer the domain hit.

## F21 — Thin-field flag keys on CLUSTERS, not PICKS → a starved field reports "depth ok"

**Evidence:** 245 candidates → 22 clusters → **11 lane picks, ZERO wildcards**, from only 6
contributing advertisers (4 of 10 resolved pages ran no CA ads). `thinField: false` and the manifest
note reads "field depth ok" — because the threshold is `competitorClusters < 10` and there were 13.
But the vision pass wants 12–15 picks and can only be handed 11, and create then needs 6 specs from
them. Run 1 proved a starved create invents sourcing; run 2's validators now BLOCK that, so the
pressure surfaces as a shortfall instead (which is the desired failure mode — but it should be
ANNOUNCED, not silent).

Also: adjacent picks (4) outnumbered every competitor except True North (3) — the adjacent lane is
guaranteed but uncapped relative to a thin competitor pool, so real-estate portals took 36% of the
field.

**Fix:** compute thinField from the PICK count the vision pass will actually receive (<12 = THIN),
not cluster count; state pick count vs quota in the manifest note; cap adjacent picks at ~25% of
total picks; when wildcards come back empty, say so explicitly (an empty wildcard pool means the
formulas had nothing left over — itself a thin-field signal).

## F22 — Vision pass PADDED a thin pool by duplicating a pick; validator has no uniqueness check

**Evidence:** 11 lane picks in the manifest, **12 pick files written**. `p12.json` is byte-equivalent
in identity to `p5.json` — same id (`ratehub-…_1500633134671189_c0`), same hook ("The lowest mortgage
rates in Quebec."). Every manifest candidate was consumed (0 unused), so the 12th could only be a
repeat.

**Cause:** the quota says 12–15; the pool held 11 (F21). The law says "you never pad, you say THIN
FIELD" — the seat padded anyway. `pickProblem` validates that an id EXISTS in the manifest but not
that it is UNIQUE across pick files, so the duplicate wrote cleanly and the assembly hook put two
identical lines into picks.jsonl.

**Downstream risk:** create sees the same construction twice and may build two specs from it — a
near-dupe the judge's diversity audit then has to catch on the back end.

**Fix:** (a) `pickProblem` takes the set of ids already written to other pick files and denies a
repeat by name ("p5 already covers this candidate — if the pool is exhausted, STOP and record the
shortfall in honesty[]"); (b) restate in vision-pass.md that a short pool ends the pick sequence,
it does not license repeats; (c) F21's pick-count-based THIN flag removes the pressure at source.

**Field-quality note (compounding F20):** 3 of 12 picks came from the marginal `Ratehub QC` resolve
and are French-language Quebec creatives for an EN Ontario-anchored client — one of them twice. Two
more picks (p10, p11) are video poster frames with no readable on-image text. Net genuinely usable
mortgage constructions: ~5 (True North ×3, nesto, Homewise), plus 4 adjacent real-estate portal ads.
Create is being asked for 6 specs off that.

## F23 — `hunt_format` does not FILTER for the format it was ordered to hunt ★

**First live execution of the hunt path (run 2, +23m).** Order was sound: openLane = format-gap,
`testimonial-card` absent from the entire mortgage field, justified by research ([38] Scotiabank:
78% of first-time buyers say trust is critically important; 95% say solid advice would make them
feel more secure). Home category and masters were well reasoned — "insurance / personal finance /
fintech lending", masters PolicyMe + Borrowell (both real Canadian regulated-finance advertisers).

**But none of the 6 returned masters is a testimonial-card:** an offer-card ("Couples save 10% on
their first year of life insurance"), a comparison ("Most plans cap mental health coverage at a few
hundred dollars. This one doesn't"), an aggregate-stat proof line ("4 million Canadians trust
Borrowell") and three problem-solution credit-score ads. The first hunt pick written (p13) is
`formatFamily: us-vs-them` — not the ordered format.

**Cause:** `huntRun` accepts `format` but uses it ONLY for the sentinel + manifest label. Selection
is `scoreClusters(...).sort(workhorseScore).slice(0,6)` — i.e. "the best ads from these two brands",
never "the <format> ads from these two brands". Faithful to plan §4.7 (named-master scrape), but
that approach's blind spot is that a master brand runs many formats.

**Divergence from heavy:** the heavy `format_hunt` searches the WHOLE library by COPY FINGERPRINT
(exact phrases like "verified buyer") — it finds the format directly instead of hoping a named brand
runs it.

**Fix (cheap → thorough):**
1. Return the masters' ads UNFILTERED but say so loudly in the tool result: "these are the masters'
   best ads, NOT filtered to <format>. Identify which (if any) actually run <format>; **if none do,
   the gap stays OPEN and the experimental slot becomes legal.**" — one string, removes the false
   impression that the gap is filled.
2. Add a format→fingerprint regex map (testimonial-card → quote marks / "verified buyer" / star
   glyphs / "— <Name>, <City>"; us-vs-them → "vs"/"unlike"/tick-cross language; …) and rank
   fingerprint-matching candidates first, returning ~10 so the vision pass has real choice.
3. Longer term: port the heavy fingerprint SEARCH (search/ads by exact phrase) as a second hunt
   mode, using named masters only as the fallback.

**Knock-on for the sourcing ladder:** `specProblem` legalizes `experimental` only when honesty[]
records a hunt that "found nothing". A hunt that found six OFF-FORMAT ads is neither "found
nothing" nor a filled gap — the ladder currently has no vocabulary for it. Add: a hunt that returns
no on-format master counts as "found nothing" for legality purposes.

## F24 — Placeholder tokens compiled into ON-IMAGE fences render literally ★ ships a broken ad

**Evidence:** c2 shipped rendering `[Rate]%` four times as visible bracket text next to "Big Bank
A/B/C/D". Everything else about the ad is correct (exact palette, logo, hierarchy, anchored 4.19%,
no named banks, filled disclaimer "Rates as of July 2026").

**Why every seat passed it:** create left the placeholder rather than inventing a bank rate — the
RIGHT call on the fabrication axis (inventing one is exactly what killed c5). The judge explicitly
praised it: *"Honest deferral: bank rates left as '[Rate]%' launch placeholders rather than
invented — the correct discipline."* Build fenced it faithfully. The self-glance passed it because
check 1 is TEXT INTACT — the string rendered exactly as specified.

**The distinction nobody draws: a placeholder is legitimate in a CAPTION (filled at launch) and is
a rendering defect ON AN IMAGE.** c1 proves create can do it right — its date placeholder was
filled ("July 2026").

**Fix (all three):** (a) build law — never fence a bracketed token; fill it from research or drop
the cell; (b) `specProblem` — reject `[...]` inside on-image strings (hook/headline/visual text),
allow in primaryText; (c) judge rubric — an on-image placeholder is a KILL; a caption placeholder
is a captionFix.

## F25 — Create designed a VIDEO POSTER FRAME (with a fake play button) — a format lite cannot ship ★

**Evidence:** c4 shipped as a static ad carrying a **video play button** over an AI-generated
"mortgage advisor". Both were explicitly specified by create:
> `SCENE: … This is a VIDEO POSTER FRAME — the static image for a video ad; the video itself
> carries the offer and CTA.`
> `PLAY BUTTON: A white circle with a solid navy (#011a40) right-facing triangle … This signals
> video format.`

Two defects in one creative:
1. **Fake UI chrome** — a play button on a static ad promises a video that does not exist. This is
   the same class as the read-schema's own ban ("never fake platform chrome … = FABRICATION"), and
   deceptive-UI risk on Meta.
2. **An invented human presented as a real advisor** — `"A mortgage advisor figure (mid-30s …
   professional but approachable)"` with `finish: photographed-real`, for a REGULATED financial
   service whose entire pitch is advisor trust. The read-schema law is explicit: humans fill ROLES,
   "no invented person presented as real."

**Root cause:** the field deliberately captures VIDEO ads via poster frames (correct — it preserves
the construction), the read schema records them, and **nothing tells create that lite can only ship
STATIC ads.** c4's sourcePick was a poster-frame video capture; create transferred the construction
faithfully *including its delivery format*. `renderability` grades complexity, not deliverable type.

**Why it survived judging:** the judge checked COMPLIANCE on the personal-attributes axis and passed
it correctly ("describes a documented buyer EXPERIENCE stat, not the buyer's financial condition") —
it never asked "is this person real?" or "does this video exist?". The self-glance then PASSED,
listing the play button as correctly rendered — fidelity to a spec that was itself the problem.

**Fix:** (a) create prompt — "lite ships STATIC images only: never a poster frame, never video
chrome (play buttons, timecodes, progress bars); a video sourcePick's construction may transfer but
its delivery format may not"; (b) `specProblem` — reject visual text matching /play button|poster
frame|video still/i; (c) judge FABRICATION — add "invented human presented as a real
advisor/customer" and "UI chrome implying a format that does not exist" as named kill triggers;
(d) glance check 5 — "no UI chrome for a medium this ad is not."

---

# RUN 2 RESULT (theratefinder.ca) — the fix set VALIDATED

| metric | run 1 (HOT) | run 2 (TRF) | Δ |
|---|---|---|---|
| **cost** | $11.10 | **$4.71** | **−58%** (projection was $4.60 — within 2.4%) |
| **wall clock** | 61 min | **43.9 min** | −28% (projection 22 min — MISSED 2×) |
| **human interventions** | 3 | **0** | ✓ unattended end-to-end |
| field seat cost | $5.58 | **$0.87** | −84% |
| field cache WRITES | 880,152 | **94,953** | −89% (thrash gone; cacheR grows 60k→92k monotonically) |
| judge cost | $3.30 | **~$1.37** | −58% (CORRECTED — first pass priced Opus at Sonnet rates) |
| specs with VALID sourcing | 3/6 | **6/6** | invention route closed |
| invented formatFamilies | 3 | **0** | closed tables enforced |
| failed render rounds (size-param class) | 4 | **0** | literal call shape works |
| render failures (new class) | 0 | **1** — SVG ref rejected (F28), retried OK | |
| render wall time | 8.3 min (5 imgs) | **~3 min** (4 imgs) | parallel ×3 |
| trace size | 113 MB | **1.6 MB** | base64 stripped |
| ads shipped | 5 | 4 | (thinner field — 11 picks vs 24) |

**Time is the remaining miss.** The 22-min projection assumed ~24 images and no hunt. Actual:
intake ~4m (founder-paced) · research ~4m (incl. one validator retry) · field ~12m (harvest +
18 images + 14 picks + summary + a format hunt) · create ~5m (4 validator retries on c1) · judge ~3m
· build ~7m (compile + 4 parallel renders + glance). Levers: batch image viewing harder, make
validators report ALL errors at once (F26), and treat the hunt as optional depth rather than
reflex.

## RUN 2 TRACE DEEP-DIVE (full parse, post-run)

**Per-seat (input-side accurate; output tokens undercounted in per-call snapshots — the SDK's
$4.71 total is authoritative, computed floor $3.86):**

| seat | calls | cacheR | cacheW | ≈cost |
|---|---|---|---|---|
| judge (opus) | 7 | 208k | 56k | **$1.37** |
| field | 30 | 1,659k | 95k | $0.87 |
| orchestrator | 34 | 1,374k | 63k | $0.66 |
| create | 17 | 710k | 68k | $0.47 |
| research | 11 | 271k | 56k | $0.30 |
| build | 9 | 193k | 37k | $0.20 |

**Cache health: CLEAN on every seat** — peak single-call cacheW 25k (orchestrator intake write),
no seat shows the run-1 thrash signature. Zero compactions. Judge obeyed its diet: 5 Greps
(one per sourcePick), 3.1 tools/call batching. Field batching weaker (1.5 tools/call).

**Where the 43.9 minutes went:** intake 0–4.5 (founder-paced + a stub Write fumble) · research
4.5–8.9 (incl. halt+nudge ~1.5m and the length-denial retry ~0.7m) · **field 9.0–27.2 = 18.2m**
(harvest itself ~45s; 12 images + 14 pick files at one-tool-per-turn × ~70s turn latency ≈ 12m;
format hunt ~4m) · create 27.2–32.2 (5m, incl. 4 denials + c6 nudge) · judge 33.1–36.8 (3.7m) ·
build 36.9–44.3 (7.4m, incl. the SVG failure + retry ~1.5m). **Turn latency (~65–75s) × turn
count is now the whole time story** — the biggest lever is batching pick WRITES (2–3 per message),
then F26 and F28.

## F28 — SVG logo refs are unsupported by BOTH render providers → all 4 ads shipped MODEL-DRAWN logos

**Evidence:** c1's first render failed `kie: "File type not supported" | fal: Forbidden`. The only
brand asset on a service brand is `assets/logo-site.svg`. Build did exactly what its law demands —
named the blocker, described the logo textually from the SVG source, flagged "convert to PNG
before build" for future runs — and the model drew a close likeness in all four frames. But
"close" is not the law: **marks go IN as references, never redrawn** (founder preference on
record). A service brand's ONLY bindable asset is its logo, so this failure mode is the default
for the whole service-brand category. **Fix:** capture rasterizes the logo at step 0
(logo-site.svg → logo-site.png via the existing Playwright canvas path — same infra as
rasterColors); render.ts alternatively auto-converts SVG refs. Capture-side is lite-owned — do
that one.

## F29 — Seats HALT at predictable points; the sanctioned nudge now handles it invisibly

Research halted after its read batch — SAME point as run 1 — despite the anti-halt law; create
halted after the c6 JSON denial. **Both were recovered by the orchestrator's SendMessage nudge**
(F18's sanctioned path): precise diagnosis, exact remaining work named, agent resumed with context
intact, zero founder involvement, ~$0.15 and ~2.5min total. Reframe: halts are no longer
prevented, they are HANDLED — acceptable at this cost. Optional hardening: research's prompt could
demand the Perplexity call ride in the same message as the final read batch.

## F30 — Orchestrator RAN BASH despite deny-by-default canUseTool (the F19 fix is incomplete)

**Evidence:** +3.79m, `Bash {"command":"ls <runDir>"}` → `is_error=False`, directory listing
returned. The gated canUseTool never fired: **the SDK auto-approves sandboxed read-only Bash
before consulting the permission callback**, so callback-level deny-by-default cannot see it.
Harmless here (an `ls`), but the hole is the hole. **Fix: `disallowedTools: ['Bash']` in lite
Options** — enforced ahead of auto-approval — plus keep the callback gate for everything else.

## F26 — Validators report only the FIRST error → serial round-trips

c1 took four attempts (missing `creative` → missing `sourcePick` → `sourcePick "p3"` not an id →
pass), each a full model turn. Specs c2–c6 were then one-shot (create learns in-context), so the
cost is one-time per seat — but it burns turns where budgets are tight.
**Fix:** collect and return ALL violations per write, not the first.

## F27 — "pick id" is ambiguous: file name (`p3`) vs manifest candidate id

Create used `sourcePick: "p3"` — the pick FILE name. The pick files ARE named p1…p14 and the field
summary refers to picks as "p5 and p6" throughout, so this is my schema's ambiguity, not a model
error. **Fix:** accept both and normalize `p<N>` → the id inside that file.

## Fix order for run 2 (highest leverage first)

1. **F14+F2+F1 — the field-seat cost complex** (~$4.40 of waste): cap the pool ~24–28 files
   (siblings only where the variant axis is load-bearing), batch image Reads 4–6/message, test
   `DISABLE_MICROCOMPACT=1`, unset the 1h cache TTL for lite. Field $5.58 → ~$1.20.
2. **F7** field maxTurns 30 → 60 → the run finishes its own field phase unattended.
3. **F15 — judge diet**: 5m TTL + enforced research cap (F6) + Grep-scoped picks + batched reads.
   Judge $3.30 → ~$1.30. Opus stays [F].
4. **F9** validating Write-hooks for `field-summary.json` and `creatives/c*.json` (copy the proven
   `verdictProblem` pattern) → kills schema drift on three seats + the create/judge summary-version
   race (F17).
5. **F10** show the literal render call shape (recurred in the follow-up — 4 wasted rounds total)
   + **F16** parallelize render jobs (agent-loop change — founder sign-off).
6. **F12** caption sanitation → the only defect that reaches a customer.
7. **F5** resolver word-boundary + domain retry · **F3** global per-advertiser cap · **F13** report
   pack-shot contents at capture · harvest: parallelize advertiser scrapes (~2.5m saved).
8. **F4** lane copied verbatim (add `promotedFrom`) · **F8** open-lane rung + create honesty path ·
   **F11** 4th catastrophic check · **F17** READ-ONCE nudges (research spill-file ×4, build ×4) +
   orchestrator intake diet (brand.md + redirect.txt only).

**Note on tooling:** the run watcher (`scratchpad/watch-lite.cjs`) produced TWO false signals of its
own — it consumed partially-written trace lines (fixed mid-run) and grepped for `[1]`-style artifact
numbering when research used `[A1]`. Neither was a pipeline defect. Monitoring bolted on after the
fact was less reliable than the thing it monitored.
