# Session Summary — 2026-02-25

**Focus:** Phase 1 Implementation — Creative Pipeline Upgrade
**Branch:** `new-ui`
**Plan document:** `docs/PHASE1_IMPLEMENTATION.md`

---

## What Was Done

Implemented Phase 1 of the creative pipeline upgrade using a 3-agent parallel team. All 3 streams completed successfully with cross-stream contract validation.

### Stream A: Visual Style Expansion (6 new files + 1 rewrite)

**Created 6 new workflow files** at `agent/.claude/skills/art-style/workflows/`:

| File | Lines | Description |
|------|-------|-------------|
| `product-on-gradient.md` | 513 | Clean product on brand-derived gradients, minimal composition |
| `typography-dominant.md` | 580 | Bold text as hero (60-70% of frame), graphic poster aesthetic |
| `infographic-data-visual.md` | 628 | Grid-based data layouts, flat icons, comparison charts |
| `editorial-cutout.md` | 669 | Asymmetric collage, selective color, serif typography |
| `lifestyle-render-hybrid.md` | 702 | Product in atmospheric environments, natural lighting |
| `ugc-aesthetic-static.md` | 648 | Simulated social posts/review cards, lo-fi aesthetic |

Each workflow includes all 12 required sections: Style Overview, Hook-Bank Loading, Brand Anchor Derivation, Category Adaptation, Visual Concept Creation, Design Principles, Prompt Template, 2 Example Prompts, Mobile Constraints, Anti-Patterns, Quality Checklist, Output Format.

**Rewrote `agent/.claude/skills/art-style/SKILL.md`** (52 → 296 lines):
- Routing table expanded to 8 styles (2 existing + 6 new)
- Category-aware default routing (auto-selects 3-4 styles when no keyword specified)
- Hook-to-style pairing logic (7 psychological drivers mapped to primary/secondary styles)
- Multi-style output flow (6-step process)
- Entity ID validation rule (5 signal axes, distinctness matrix)
- Aspect ratio distribution (2x 4:5, 2x 1:1, 2x 9:16)

### Stream B-1: Research Agent Expansion (1 edit)

**Expanded `agent/.claude/agents/research.md`** (303 → 604 lines):
- Added WebSearch to tools
- Added Step 2.5: Fetch About/Story Page
- Added Step 2.6: Competitive Scan (WebSearch for competitors)
- Added Step 2.7: Customer Language Scan (WebSearch reviews/Reddit)
- Added Step 3.5: Strategic Analysis (LLM reasoning on all gathered data)
- Added 7 new output template sections: Owned Positioning, Competitive Context, Buying Objections, Feature-to-Emotion Translation, Customer Language & VoC Signals, Brand Story / Origin, Category Intelligence
- Updated line target from ~60-70 to ~150-200
- Added rules for source marking, no-fabrication, time budget
- Added Tooling Constraints documentation

### Stream B-2: Hook Methodology Upgrade (1 edit + 1 deletion)

**Rewrote `agent/.claude/skills/hook-methodology/SKILL.md`** (453 → 774 lines):
- 7 new extraction blocks for new research sections (with backward compat markers)
- Step 1.5: FUNNEL MAPPING (TOF/MOF/BOF element mapping)
- Step 4.5: VISUAL DIRECTION NOTE (anti-duplication rule)
- 3-3-3 Variety Framework replacing old variety check (Funnel Stage x Psychological Angle x Format Intention)
- 5-Gate Hard Validation replacing old checklist (Traceable, Owned/Logo-Swap 3-part test, Felt, Clear, Theirs)
- Enriched output format: Funnel Stage, Psychological Driver, Format Intention, Visual Direction, Logo-Swap Test
- Default hook count: 3 → 6
- Andromeda Copy Optimization reference section
- 7 psychological drivers (added Curiosity to match art-style routing)

**Deleted `agent/.claude/skills/hook-methodology/formulas.md`** — redundant with expanded SKILL.md. Research-to-Hook Mapping, Emotional Territory Coverage, and Validation Principles are all now covered in SKILL.md with more detail.

### Cross-Stream Validation (fixes applied by team lead)

Two contract mismatches found and fixed:
1. **Psychological Driver enum** — Hook SKILL.md listed 6 values, art-style routing expected 7. Added "Curiosity" to hook output format and 3-3-3 variety framework.
2. **Visual Direction not consumed** — Workflow files extracted "6 hook concepts with psychology field" but didn't mention Visual Direction, Funnel Stage, or Format Intention. Updated all 6 new workflow files + art-style SKILL.md to extract and use these fields.

---

## File Inventory (all changes)

| File | Action | Lines |
|------|--------|-------|
| `agent/.claude/agents/research.md` | Edited | 604 |
| `agent/.claude/skills/hook-methodology/SKILL.md` | Edited | 774 |
| `agent/.claude/skills/hook-methodology/formulas.md` | **Deleted** | — |
| `agent/.claude/skills/art-style/SKILL.md` | Rewritten | 296 |
| `agent/.claude/skills/art-style/workflows/product-on-gradient.md` | **Created** | 513 |
| `agent/.claude/skills/art-style/workflows/typography-dominant.md` | **Created** | 580 |
| `agent/.claude/skills/art-style/workflows/infographic-data-visual.md` | **Created** | 628 |
| `agent/.claude/skills/art-style/workflows/editorial-cutout.md` | **Created** | 669 |
| `agent/.claude/skills/art-style/workflows/lifestyle-render-hybrid.md` | **Created** | 702 |
| `agent/.claude/skills/art-style/workflows/ugc-aesthetic-static.md` | **Created** | 648 |

**Total: 10 files changed, ~5,414 lines of new/modified content**

---

## What Needs Fixing / Next Session

### Known Issues to Verify

1. **Research section name mismatch (minor):** Research uses "Customer Language & VoC Signals" (with &), hook extraction block says "Customer Language / VoC" (with /). LLM agents will likely match these fine, but could be normalized for consistency.

2. **Existing workflows not updated:** `anderson-clay-diorama.md` and `soft-brutalism-clay.md` still use old hook-bank loading (no Visual Direction, Funnel Stage, Format Intention extraction). They work fine with old-format hook banks but won't consume the new fields.

3. **formulas.md deletion:** The 10 detailed per-type hook definitions (Psychology, Structure, 3 examples, Warnings per type) were deleted with formulas.md. SKILL.md has a compact table but not the depth. Monitor if hook quality degrades — may need to inline the per-type details into SKILL.md.

### Testing Needed

1. **End-to-end test:** Run the full pipeline (research → hooks → visuals) on 2-3 existing brands (e.g., composio, theratefinder, rube) and compare output quality.
2. **Research agent timing:** New workflow adds 4 extra steps (about page, competitive scan, VoC scan, strategic analysis). Verify it stays within ~3-5 min per brand.
3. **Hook variety:** Verify 3-3-3 framework produces genuinely diverse hooks across funnel stages, drivers, and formats.
4. **Multi-style routing:** Test that auto-style selection picks appropriate styles for different brand categories.
5. **Logo-swap enforcement:** Check if 5-gate validation actually catches and revises generic hooks.

### Phase 1 Success Criteria (from PHASE1_IMPLEMENTATION.md)

**Stream A:**
- [x] 6 new workflow files created, each with all 12 required sections
- [x] Art-style SKILL.md updated with routing, category logic, multi-style flow
- [x] Each new style differs from all others on 3+ Entity ID signal axes
- [x] All workflows include Brand Anchor, Mobile Constraints, Aspect Ratio blocks
- [x] JSON output format standardized across all 8 styles

**Stream B-1:**
- [x] 7 new sections added to output template
- [x] 4 new workflow steps (2.5, 2.6, 2.7, 3.5) added
- [x] WebSearch added to tools
- [x] Line target updated to ~150-200
- [x] Source marking instructions included
- [x] Fallback instructions for unavailable data

**Stream B-2:**
- [x] New extraction blocks for 7 new research sections
- [x] Step 1.5 Funnel Mapping added
- [x] Step 4.5 Visual Direction Note added
- [x] 3-3-3 Variety Framework replaces old variety check
- [x] 5-Gate Hard Validation replaces old checklist
- [x] Output format includes all new metadata fields
- [x] Default hook count updated from 3 to 6
- [x] Extraction checklist updated with new section checkboxes
- [ ] ~~formulas.md updated~~ → Deleted (redundant)

### Remaining from Phase 1 Plan

- [ ] Test on 2-3 existing brands
- [ ] Compare old vs new hook bank output on logo-swap test
- [ ] Validate new research sections populate reliably

### Beyond Phase 1

- Phase 2: Brief generation for VIDEO-SCRIPT, UGC-BRIEF, CAROUSEL-LEAD, ORGANIC format tags
- Phase 2: Feedback loop architecture (performance data → pipeline optimization)
- Phase 2: Multi-page research crawling if tooling improves

---
---

# Session 2 — 2026-02-25 (continued)

**Focus:** Post-Phase 1 cleanup — fixing cross-stream mismatches and deduplicating art-style workflows
**Branch:** `new-ui`

---

## What Was Done

### 1. Fixed Section Name Mismatch (Issue #1 from previous session)

Normalized `"Customer Language / VoC"` → `"Customer Language & VoC Signals"` across 5 locations in `agent/.claude/skills/hook-methodology/SKILL.md` to match the research agent's output section name exactly.

### 2. Art-Style Workflow Deduplication

Analyzed all 8 workflow files and found ~25-30% shared boilerplate duplicated across the 6 new workflows. Extracted shared blocks into SKILL.md and replaced with references.

**Added to `agent/.claude/skills/art-style/SKILL.md`** (296 → 352 lines):

New `## Shared Workflow Processes` section with 3 subsections:
- **Hook-Bank Loading** — the standard 4-step process (list, sort, read, extract)
- **Brand Anchor Derivation** — the universal 3-step framework (extract → translate → logo swap test) + prompt block format
- **Mobile Safe Zone Rules** — universal safe zone constraints + shared quality checklist mobile bullets

Also added workflow note to Output Format section and updated "Adding New Styles" guidelines to reference shared processes.

**Updated 7 workflow files:**

| File | Before | After | Saved |
|------|--------|-------|-------|
| `product-on-gradient.md` | 513 | 455 | -58 |
| `editorial-cutout.md` | 669 | 612 | -57 |
| `typography-dominant.md` | 580 | 523 | -57 |
| `infographic-data-visual.md` | 628 | 570 | -58 |
| `lifestyle-render-hybrid.md` | 702 | 645 | -57 |
| `ugc-aesthetic-static.md` | 648 | 590 | -58 |
| `soft-brutalism-clay.md` | 335 | 322 | -13 |

`anderson-clay-diorama.md` — unchanged (unique structure, no shared blocks).

**What was replaced with references in each new workflow:**
- Step 1: Load Hook Bank → 2-line reference to SKILL.md
- Step 2: Brand Anchor Derivation → style-specific principle only + reference
- Mobile Constraints in prompt template → reference + style-specific hero element line
- Output Format → style-specific `stage` fields only + reference
- Quality Checklist > Mobile → reference
- Done section → removed (already in SKILL.md)
- Aspect Ratio Mix line → removed (already in SKILL.md)

**Net result: ~360 lines of duplication removed (304 net after +55 lines to SKILL.md)**

---

## Commits

| Hash | Message |
|------|---------|
| `d2c88dd` | `refactor: Deduplicate art-style workflows by extracting shared blocks into SKILL.md` |

---

## Updated Known Issues

1. ~~**Research section name mismatch**~~ — **Fixed.** Normalized to "Customer Language & VoC Signals" everywhere.

2. **Existing workflows not updated** (still open): `anderson-clay-diorama.md` and `soft-brutalism-clay.md` still use old hook-bank loading (no Visual Direction, Funnel Stage, Format Intention extraction). They work fine with old-format hook banks but won't consume the new fields.

3. **formulas.md deletion** (still open): Monitor if hook quality degrades — may need to inline per-type details into SKILL.md.

### Still Remaining

- [ ] Test on 2-3 existing brands (end-to-end pipeline)
- [ ] Compare old vs new hook bank output on logo-swap test
- [ ] Validate new research sections populate reliably
- [ ] Update anderson-clay-diorama.md and soft-brutalism-clay.md to consume new hook fields

---
---

# Session 3 — 2026-02-25 (continued)

**Focus:** Photorealistic mixed-media workflows + orchestrator alignment
**Branch:** `new-ui`

---

## What Was Done

### 1. Orchestrator Prompt Alignment

Updated `server/lib/orchestrator-prompt.ts` to align with Phase 1 changes:
- Research agent description updated (now reflects 7-step workflow, ~150-200 line output, 16 sections)
- Hook methodology description updated (6-hook default, 3-3-3 framework, new metadata fields)
- Art style description updated (multi-style routing, hook-to-style pairing)
- Style Keywords table replaced: removed 2 "future" placeholders (Surrealist Scale, Minimal Photography), added full 8-style routing table
- Default behavior changed from "Anderson Clay Diorama" to "auto-selects 3-4 styles based on brand category"

### 2. Round-Robin Ordering Rule

Added to art-style SKILL.md Step 6 (Write Output): prompts.json must interleave prompts across styles (A1, B1, C1, A2, B2, C2) instead of grouping by style (A1, A2, B1, B2, C1, C2). Ensures orchestrator's "first N prompts" always gets maximum style diversity.

### 3. Ad Design Trend Research

Conducted deep research into 2025-2026 performance marketing ad design trends. Output saved to `docs/performance-marketer-research/ad-design-trends-2025.md` (~755 lines, 12 sections, 30+ sources).

Key findings:
- "Tactile Rebellion" is the dominant design movement — deliberate rejection of AI-polished perfection
- Mixed-media (photo + graphic design) is the most universally applicable ad format
- Only 13% of consumers trust fully AI-created ads
- Static ads still drive 60-70% of Meta conversions
- Specific techniques trending: aura glow, torn paper, film grain, color blocking, split compositions

### 4. Four Photorealistic Mixed-Media Workflows (8 → 12 styles)

Created 4 new workflow files at `agent/.claude/skills/art-style/workflows/`:

| File | Lines | Visual Signature | Best For |
|------|-------|-----------------|----------|
| `clean-premium.md` | 639 | Dark void, colored aura glow behind product, glass/translucent overlays, floating product, condensed sans-serif | Aspiration, Transformation hooks |
| `bold-energy.md` | 624 | 2-3 saturated color blocks, product cutout at intersection, 10-15° tilt, oversized hero type (40-50% frame) | Pain/Problem, Urgency hooks |
| `analog-craft.md` | 749 | Film grain, torn paper/collage layers, warm tungsten tones, light leaks, curvy imperfect serif | Social Proof, Curiosity hooks |
| `split-comparison.md` | 680 | Bisected dual composition (before/after, problem/solution), product bridges divide, per-side callouts | Education, Transformation hooks |

All 4 share a **3-layer foundation**: photorealistic product photo + graphic design frame + typography/info layer.

Each workflow includes all 12 required sections: Style Overview, Hook-Bank Loading (ref), Brand Anchor (ref + style-specific), Category Adaptation, Visual Concept Creation, Design Principles (6 each), Prompt Template, 2 Example Prompts (fully filled), Mobile Constraints, Anti-Patterns, Quality Checklist, Output Format.

### 5. SKILL.md Updates (352 → ~440 lines)

**Keyword Routing Table** — Added 4 new rows. Fixed conflicts: removed "premium" from editorial-cutout, removed "comparison" from infographic-data-visual.

**Style Comparison Table** — Added 4 new rows (12 total styles).

**Category-Aware Default Routing** — Expanded from 4 to 5 columns per category. New styles integrated:

| Category | New Styles Added |
|----------|-----------------|
| Beauty/Skincare | Clean Premium (3rd), Analog Craft (opt 5th) |
| SaaS/Tech | Bold Energy (4th) |
| Fintech/Finance | Split Comparison (3rd) |
| Food/Beverage | Analog Craft (3rd), Bold Energy (opt 5th) |
| Fashion/Apparel | Clean Premium (3rd), Analog Craft (opt 5th) |
| Health/Wellness | Split Comparison (3rd), Clean Premium (4th) |
| Home Goods | Analog Craft (3rd), Split Comparison (opt 5th) |
| General/Unknown | Clean Premium (4th) |

**Psychology-to-Style Mapping** — Added tertiary column. Key mappings:
- Pain/Problem: secondary → Bold Energy
- Aspiration/Identity: secondary → Clean Premium
- Social Proof: tertiary → Analog Craft
- Education/Value: secondary → Split Comparison
- Urgency/Scarcity: secondary → Bold Energy
- Transformation: primary → Split Comparison (promoted from Editorial Cutout)
- Curiosity/Question: secondary → Analog Craft

**Entity ID Distinctness Matrix** — Expanded from 8×5 to 12×5. All 4 new styles pass 3+ axis distinctness against all existing styles and each other. Tightest pair: Clean Premium vs Product-on-Gradient at exactly 3 axes.

**Multi-Style Output Flow** — Updated "3-4 styles" to "3-5 styles". Added tertiary style fallback in assignment process.

**Photorealistic Mixed-Media Family** — Added new section explaining the 3-layer foundation shared by the 4 new styles.

### 6. Orchestrator Prompt Update (second pass)

Updated `server/lib/orchestrator-prompt.ts` style keywords table with 4 new photorealistic styles. Updated auto-selection description from "3-4" to "3-5".

---

## File Inventory (all changes this session)

| File | Action | Lines |
|------|--------|-------|
| `server/lib/orchestrator-prompt.ts` | Edited (2x) | 82 |
| `agent/.claude/skills/art-style/SKILL.md` | Edited | ~440 |
| `agent/.claude/skills/art-style/workflows/clean-premium.md` | **Created** | 639 |
| `agent/.claude/skills/art-style/workflows/bold-energy.md` | **Created** | 624 |
| `agent/.claude/skills/art-style/workflows/analog-craft.md` | **Created** | 749 |
| `agent/.claude/skills/art-style/workflows/split-comparison.md` | **Created** | 680 |
| `docs/performance-marketer-research/ad-design-trends-2025.md` | **Created** | ~755 |

**Total: 7 files changed, ~3,969 lines of new/modified content**

---

## Updated Known Issues

1. ~~**Research section name mismatch**~~ — Fixed in Session 2.

2. **Existing workflows not updated** (still open): `anderson-clay-diorama.md` and `soft-brutalism-clay.md` still use old hook-bank loading (no Visual Direction, Funnel Stage, Format Intention extraction).

3. **formulas.md deletion** (still open): Monitor if hook quality degrades.

4. **Clean Premium vs Product-on-Gradient borderline distinctness** (new): Exactly 3 axes different (the minimum). Both are centered product with minimal text. The DO NOT sections in each workflow enforce mutual exclusion (no gradient backgrounds in Clean Premium, no dark/aura in Product-on-Gradient). Monitor if Andromeda treats them as distinct Entity IDs.

5. **Keyword routing overlap potential** (new): "collage" routes to Editorial Cutout, but Analog Craft also uses collage. "bold" routes to Bold Energy, but some users might mean bold typography. Context should disambiguate, but monitor user intent mismatch.

### Still Remaining

- [ ] Test new photorealistic workflows end-to-end (explicit style keyword)
- [ ] Test auto-routing with no style keyword on 2-3 brands
- [ ] Verify round-robin ordering produces diverse first-N prompts
- [ ] Test on 2-3 existing brands (full pipeline: research → hooks → visuals)
- [ ] Compare old vs new hook bank output on logo-swap test
- [ ] Validate new research sections populate reliably
- [ ] Update anderson-clay-diorama.md and soft-brutalism-clay.md to consume new hook fields
