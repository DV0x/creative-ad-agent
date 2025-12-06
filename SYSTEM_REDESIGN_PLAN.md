# Creative Ad Agent - System Redesign Plan

**Version:** 5.0
**Date:** December 2025
**Status:** In Progress

---

## Overview

Redesigning the system to be **leaner and more flexible** by replacing the 3-agent architecture with a 2-agent + skills-based approach.

---

## Architecture Change

### Before (v4.0)
```
Orchestrator → Strategist → Creator
   (3 agents, fixed workflow)
```

### After (v5.0)
```
Main Agent → Research Agent → Art Skill
                                  ↓
                          (triggers Hook Skill internally)
                                  ↓
                          hook-bank → images
   (2 agents + composable skills)
```

---

## Components

### 1. Main Agent (formerly Orchestrator)

**Role:** Central coordinator that understands user intent and orchestrates the workflow.

**Responsibilities:**
- Parse user request (extract URL, brand name, style preference)
- Spawn Research Agent
- Trigger Art Style Skill (which handles hooks + images internally)
- Deliver final output

**Tools:** Task, Skill, Read, Write

**Workflow:**
1. Parse request → Extract URL, brand name, style (optional)
2. Spawn research agent → Wait for research file
3. Trigger art-style skill → Handles hooks + image generation
4. Report completion with image results

---

### 2. Research Agent (formerly Strategist) ✅ DONE

**Role:** Data extraction + ICP analysis agent.

**Responsibilities:**
- Fetch and analyze brand homepage
- Extract structured business information
- Extract brand colors (hex codes)
- Analyze target audience / ICP
- Write research file

**Tools:** WebFetch, Read, Write

**Output:** `files/research/{brand}_research.md`

**Output Sections:**
| Section | Content |
|---------|---------|
| THE OFFER | Products, prices, timeframes, scope |
| VALUE PROPS | 3-5 specific differentiators |
| PROOF POINTS | Stats, reviews, ratings, case studies |
| TESTIMONIALS | Exact quotes with attribution |
| PAIN POINTS | Customer frustrations, obstacles |
| BRAND COLORS | Primary, secondary, accent (hex codes) |
| BRAND VOICE | Tone, formality, style |
| TARGET AUDIENCE / ICP | Who, pain points, motivations, language |

**ICP Analysis:** If user specifies audience, focus on that. Otherwise derive from site data.

**Does NOT include:** Style recommendations, creative direction, visual suggestions.

---

### 3. Hook Methodology Skill ✅ DONE

**Role:** Copy generation framework for conversion-focused campaigns.

**Triggered:** When campaign type is conversion-focused (default).

**Input:** Reads `files/research/{brand}_research.md`

**Process:**
1. Extract hook-worthy data from research
2. Build hook bank (15-20 potential hooks)
3. Apply 10 hook formulas (Stat, Story, FOMO, Curiosity, Call-out, Contrast, Question, Identity, Enemy, Result)
4. Select 6 diverse hooks using diversity matrix
5. Write full copy (hook + body + CTA) for each concept

**Output:** 6 concepts with ICP summary + copy (hook, body, CTA)

**Files:**
- `SKILL.md` - Main workflow (~130 lines)
- `formulas.md` - Detailed hook formulas reference

**Diversity Matrix (6 concepts must cover):**
```
[1] Stat/Data      → Social Proof
[2] Story/Result   → Empathy + Relief
[3] FOMO/Urgency   → Loss Aversion
[4] Curiosity      → Intrigue
[5] Call-out       → Recognition
[6] Contrast       → Logic + Greed
```

---

### 4. Art Style Skill (Router + Orchestrator) ✅ DONE

**Role:** Complete visual campaign system. Routes to style workflow which triggers hooks, creates visuals, and generates images.

**Structure:**
```
art-style/
├── SKILL.md                        # Router only (style detection + routing)
├── tools/
│   ├── generate-images.ts          # Image generation script (Gemini API)
│   └── run-generate.sh             # Wrapper script (handles NODE_PATH)
└── workflows/
    ├── soft-brutalism-clay.md      # Default style (triggers hooks + full process)
    ├── surrealist-scale.md         # Future
    └── [more styles...]            # Future
```

**SKILL.md (Router) Responsibilities:**
- Detect style from user request (keywords or explicit)
- Default to `soft-brutalism-clay` if not specified
- Route to appropriate workflow file

**Workflow File Responsibilities:**
- Step 1: Trigger Hook Methodology Skill
- Step 2: Load hook-bank file
- Creative process (3-layer thinking, visual principles)
- Construct image prompts with readable filenames
- Write prompts to JSON
- Execute image generation script
- Return results

**Input (from Main Agent):**
- Brand name (extracted from URL)
- Style preference (optional)

**Process (in workflow file):**
1. Trigger hook-methodology skill → creates hook-bank file
2. Load hook-bank file (latest for brand)
3. Apply 3-layer creative process (Literal → Symbolic → Unexpected)
4. Apply visual surprise techniques
5. Filter through 6 design principles
6. Construct detailed image generation prompts
7. Write prompts to `agent/files/creatives/{brand}_prompts.json`
8. Execute: `./agent/.claude/skills/art-style/tools/run-generate.sh`
9. Return generated image paths + metadata

**Output:**
- 6 generated images in `generated-images/{sessionId}/`
- Results JSON with paths and metadata

**Style Detection Keywords:**
| Keywords | Routes To |
|----------|-----------|
| "clay", "brutalist", "handcrafted" | soft-brutalism-clay.md |
| "surreal", "dreamlike", "scale" | surrealist-scale.md (future) |
| "minimal", "clean", "photography" | minimal-photography.md (future) |
| (none specified) | soft-brutalism-clay.md (default) |

**Image Generation Script:**
- Rate limit: 1 second between images (Gemini API protection)
- Supports: 1K, 2K (default), 4K resolution
- Aspect ratios: 1:1, 9:16, 16:9, etc.
- Default mix: 3 at 1:1 (feed), 3 at 9:16 (stories)

**Note:** Art Skill owns all visual decisions AND image generation. Hook Skill only provides copy.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER REQUEST                                                    │
│  "Create conversion ads for https://brand.com"                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MAIN AGENT                                                      │
│  • Parses request                                                │
│  • Identifies: URL, brand name, style (optional)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Task: Research Agent
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RESEARCH AGENT                                                  │
│  • WebFetch homepage                                             │
│  • Extract business info + brand colors                          │
│  • Write files/research/{brand}_research.md                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ File: research.md
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MAIN AGENT                                                      │
│  • Triggers Art Style Skill                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Skill: Art Style
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ART STYLE SKILL (Workflow)                                      │
│                                                                  │
│  Step 1: Trigger Hook Methodology Skill                          │
│          ↓                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  HOOK METHODOLOGY SKILL                                  │    │
│  │  • Reads research.md                                     │    │
│  │  • Extracts colors + ICP + data                          │    │
│  │  • Builds hook bank (10 hooks)                           │    │
│  │  • Selects 6 diverse hooks                               │    │
│  │  • Writes: hook-bank/{brand}-{date}.md                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│          ↓                                                       │
│  Step 2: Load hook-bank file                                     │
│          ↓                                                       │
│  Step 3: Creative process (3-layer, visual surprise)             │
│          ↓                                                       │
│  Step 4: Write prompts to JSON (with readable filenames)         │
│          ↓                                                       │
│  Step 5: Execute image generation script                         │
│          ↓                                                       │
│  Output: 6 generated images + metadata                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Returns: image paths + results
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  MAIN AGENT                                                      │
│  • Receives generated images from Art Skill                      │
│  • Compiles final output                                         │
│  • Delivers campaign brief + images                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure (v5.0)

```
agent/
├── .claude/
│   ├── agents/
│   │   └── research.md              # ✅ Research Agent definition
│   │
│   └── skills/
│       ├── hook-methodology/
│       │   ├── SKILL.md             # ✅ Main workflow
│       │   ├── formulas.md          # ✅ Hook formulas reference
│       │   └── hook-bank/           # ✅ Hook output files
│       │       └── {brand}-{YYYY-MM-DD}.md  # Timestamped hook files
│       │
│       └── art-style/
│           ├── SKILL.md             # ✅ Router + workflow instructions
│           ├── tools/
│           │   ├── generate-images.ts   # ✅ Gemini image generation
│           │   └── run-generate.sh      # ✅ Wrapper script
│           └── workflows/
│               ├── soft-brutalism-clay.md   # ✅ Default style (self-contained)
│               ├── surrealist-scale.md      # Future
│               └── [more styles...]         # Future
│
└── files/
    ├── research/
    │   └── {brand}_research.md      # Research output
    │
    └── creatives/
        ├── {brand}_prompts.json     # Image prompts for generation
        └── {brand}_campaign.md      # Final campaign brief

generated-images/
└── {sessionId}/
    ├── 1_{concept_slug}.png         # Generated images (readable names)
    ├── 2_{concept_slug}.png
    └── results_{timestamp}.json     # Generation metadata
```

---

## What's Removed

| Removed | Reason |
|---------|--------|
| Creator Agent | Replaced by skills (Hook + Art) |
| Strategist name | Renamed to Research (clearer purpose) |
| Style in research | Style comes from user or skill default |
| conversion-craft skill | Split into Hook Methodology + Art Skill |

---

## What's Added

| Added | Purpose |
|-------|---------|
| Hook Methodology Skill | Dedicated copy generation framework |
| Art Style Skill (Router) | Routes to appropriate visual style workflow |
| workflows/ folder | Contains individual style implementations |
| Style detection | Auto-detect from user request or use default |

---

## Future Extensibility

### Adding New Art Styles

Simply add a new workflow file:

```
art-style/
├── SKILL.md                          # Router (update keywords)
└── workflows/
    ├── soft-brutalism-clay.md        # ✅ Exists
    ├── surrealist-scale.md           # Add this file
    ├── minimal-photography.md        # Add this file
    └── bold-graphic.md               # Add this file
```

**Steps to add a new style:**
1. Create `workflows/new-style-name.md` with style methodology
2. Add detection keywords to `SKILL.md` router
3. Done - no other changes needed

### Adding New Campaign Types

When ready to support non-conversion campaigns:

```
Campaign Types:
├── conversion (default) → Hook Methodology Skill
├── awareness           → Brand Story Skill (future)
└── engagement          → Viral Content Skill (future)
```

---

## Benefits of New Architecture

| Benefit | Description |
|---------|-------------|
| Leaner | 2 agents instead of 3 |
| Flexible | Skills can be mixed, matched, skipped |
| Composable | Add new skills without changing agents |
| Debuggable | Clear skill boundaries for troubleshooting |
| Extensible | New styles/campaign types = new skill files |
| Predictable | Skills have defined inputs/outputs |

---

## Implementation Steps

1. [x] Create `research.md` agent (with ICP analysis)
2. [x] Create `hook-methodology/SKILL.md` + `formulas.md`
3. [x] Remove `creator.md` agent
4. [x] Remove `strategist.md` agent
5. [x] Create `art-style/SKILL.md` (router + image generation workflow)
6. [x] Create `art-style/workflows/soft-brutalism-clay.md` (default style, self-contained)
7. [x] Create `art-style/tools/generate-images.ts` + `run-generate.sh` (image generation)
8. [x] Update Main Agent (orchestrator prompt) for new flow
9. [ ] Update ARCHITECTURE.md
10. [ ] Test end-to-end flow

---

## Resolved Decisions

1. **Hook Skill triggering:** Art Style workflow triggers Hook Skill internally (not Main Agent). Main Agent only triggers Research Agent + Art Skill.

2. **Hook Skill output:** Writes to `hook-bank/{brand}-{YYYY-MM-DD}.md` with colors + ICP + 6 concepts. Complete handoff document.

3. **Art Skill structure:** SKILL.md = routing table only. Workflow files = complete process (trigger hooks, load data, creative, image gen).

4. **Skill separation:** Hook Skill = copy + colors extraction. Art Skill = visuals + image generation. Clean file-based boundary.

5. **Image generation:** Art Skill workflow executes image generation directly via bash script. Script handles rate limiting (1s between images) and saves to `generated-images/{sessionId}/`.

6. **Workflow files:** Each style workflow (e.g., `soft-brutalism-clay.md`) is 100% self-contained: triggers hooks, creative process, design principles, example prompts, image generation.

7. **Prompt storage:** Image prompts written to JSON file (`agent/files/creatives/{brand}_prompts.json`) with `filename` field for readable output names.

8. **Hook-bank file naming:** `{brand}-{YYYY-MM-DD}.md` format allows history. Art Skill reads latest by default, user can request specific date.

9. **Image filenames:** Readable format derived from hook concept (e.g., `1_rejected_approved_48hrs.png`) instead of timestamp + prompt.

---

## Open Questions

1. ~~**MCP batching:** 2 calls of 3 images, or 1 call of 6 images?~~ **RESOLVED:** Using direct Gemini API script with 1s rate limiting, 6 images per run.

2. **Output file:** Should final campaign brief be written to file or returned to user directly?

---

*Document created: December 2025*
*Last updated: December 6, 2025*
*Status: In Progress (8/10 steps complete)*
*Next: Test end-to-end flow*
