# Session 93 — Reference image pipeline: planning session

**Date:** 2026-05-05
**Branch:** `new-ui` (no code shipped — planning only)
**Output:** `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` + `docs/FUTURE_QUEUE_USE_CASES.md`

> Planning-only session. No code changed. Locked a comprehensive plan to ship multi-reference selective replace + reliability fix for the reference-image pipeline. Pickup next session at Phase 1.1.

---

## What this session was

Started as exploratory ("look at the upload flow"). Became a deep-dive into how the agent consumes user-uploaded reference images, why it sometimes loses URLs (attention dilution / microcompact), and what selective control beta clients need.

Ended with a locked plan + a future-features doc captured along the way.

---

## How the conversation moved

| Phase | What we figured out |
|---|---|
| 1. Upload flow audit | Mapped end-to-end: R2 storage, asset_files D1 metadata, resolveAssetUrls() in DO, FUSE mount, prompt-text URL injection, fal.ai upload + sandbox path. Verified the Explore agent's findings (1 partially correct security claim, 1 wrong claim withdrawn, 3 confirmed). |
| 2. Identified the failure mode | Agent loses reference URLs because they live as text in conversation history; attention dilution + microcompact erode them by the time `generate_ad_images` runs. SDK-guide subagent verified our mental model + flagged hooks as a missed primitive. |
| 3. Designed the rewrite | Two structural changes: (a) campaign-level state in D1 instead of per-message arg; (b) MCP-backed transport instead of prompt-text injection. Skill gets a new Step 2.5 for visual analysis + per-concept reference assignment. |
| 4. Beta client signal landed | User confirmed beta client wants selective replace mid-campaign — promotes "active reference pool" from YAGNI to v1 requirement. Two-layer model crystallized (campaign pool = user-controlled; per-concept subset = agent-controlled). |
| 5. Drafted the spec | Concrete diffs per file (~17 files, ~395 LOC). 12 decisions locked. 3 open decisions surfaced. |
| 6. Staff-engineer review | Caught one P0 bug (sandbox lifecycle: refs.json write was placed in `handleGenerate` where `this.sandbox` is null — must move into `runGeneration` after setup), 2 P0 unspecified edges (cascade-on-delete policy; mid-flight reference change semantics), and several P1/P2 polish items. |
| 7. Resolution + polish | All 3 P0 items locked (D13/D14/D15). All 3 open decisions resolved (O1/O2/O3). Instrumentation step explicitly skipped (D16). PostToolUse hook deferred (D17). Phase 1 subsection ordering corrected. |

---

## Decisions locked (highlights — full list in plan doc)

| # | Decision |
|---|---|
| D3 | Disk-backed MCP, NOT closure-based — survives mid-session updates |
| D4 | Active references live on `campaigns` row in D1 — single source of truth |
| D5 | "Sticky-until-replaced" semantics — empty turn preserves previous refs |
| D6 | Two-layer selection: campaign pool + per-concept subset |
| D8 | Chip strip is display+remove only; `@mention` stays the selection mechanism |
| D11 | Reference visual analysis baked into prompt text via Step 2.5; the prompt is the lever, not just the URL attachment |
| D13 | refs.json write happens INSIDE `runGeneration` after sandbox setup, NOT in handler — `this.sandbox` is null in handler |
| D14 | Cascade-on-delete: `deleteFile`/`deleteFolder` sweep all campaigns' active reference arrays + emit WS sync |
| D15 | Reference changes apply to next generation, not in-flight — predictable + simple |
| D16 | Skip pre-rewrite instrumentation — URL-loss is real from observed usage; selective replace forces data-model change anyway |
| D17 | Defer the PostToolUse durability hook — MCP indirection is enough for v1; add only if hallucination still slips through |

---

## Architecture in one line

> **D1.campaigns.active_reference_file_ids → DO writes /app/refs.json (in `runGeneration` after sandbox setup) → mcp__refs__get_reference_images returns it → art-style Step 2.5 reads images, bakes product-specific language into prompts.json → nano-banana receives URLs from prompts.json.**

---

## Side artifacts

- **`docs/FUTURE_QUEUE_USE_CASES.md`** — captured during a tangent on file-IPC limits. Documents three high-value queue features (parallel image gen, concurrent campaigns per user, scheduled regeneration) plus rule-of-thumb for when to use queue vs file vs pub-sub. Not on near-term roadmap; reference doc for when the time comes.

---

## Pickup instructions for next session

1. **Read `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` top-to-bottom.** Don't relitigate Decisions Locked — they're locked.
2. **Branch:** `git checkout -b feat/multi-ref-selective-replace` off `new-ui`.
3. **Phase 1.1:** staging schema migration. Do NOT touch prod yet — staging first, soak, then prod.
4. **Mark phases done in the plan doc** as you complete them.
5. **Save `docs/SESSION_94_*.md`** retrospective when Phase 5 ships, following S92 template.

End of session 93.
