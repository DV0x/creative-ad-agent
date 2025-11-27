# Meme Quality Optimization Plan

**Goal**: Create the best meme-making agent in the world
**Focus**: Meme quality (viral, authentic, shareable)
**Target**: Both B2C and B2B brands (agent infers from website)
**Design Principles**: Lean, efficient, file-based agent communication

---

## Key Architecture Changes

### 1. Sequential Research (via File System)

```
brand-researcher
        ↓
        Writes: brand_intelligence.txt
        (includes: Industry, Brand Type, Target Audience, Pain Points, Product Analysis)
        ↓
culture-researcher
        ↓
        READS brand_intelligence.txt first
        Designs its OWN targeted searches based on brand context
        Writes: cultural_intelligence.txt
        ↓
creative-director (LEAN - relies on skills)
        ↓
        Reads both files, uses skills, generates 3-5 memes
```

**Why file-based**:
- Orchestrator stays dumb (just spawns agents sequentially)
- Culture researcher has FULL context (reads entire file)
- Culture researcher uses its own intelligence to decide searches
- Natural SDK pattern

### 2. Lean Creative Director

**Before**: 434 lines (duplicates skill content)
**After**: ~50 lines (delegates to skills)

Skills handle expertise. Agent just coordinates.

### 3. Output Change

**Before**: 5-8 memes
**After**: 3-5 quality memes

---

## Summary of Changes

| File | Priority | Key Changes |
|------|----------|-------------|
| `orchestrator-prompt.ts` | HIGH | Sequential workflow (no context passing, just spawn order) |
| `brand-researcher.md` | HIGH | +Deep product analysis, +Brand Type, +Context section for culture |
| `culture-researcher.md` | HIGH | Read brand file first, design own targeted searches |
| `creative-director.md` | HIGH | **SIMPLIFY to ~50 lines**, rely on skills |
| `viral-meme-creation/SKILL.md` | LOW | Minor: update to 3-5 memes, add B2B guidance |
| `nanobanana-meme-prompting/SKILL.md` | LOW | Keep as-is (already concise) |

---

## PHASE 1: Core Architecture (4 files)

### 1.0 Orchestrator: Sequential Spawning

**File**: `server/lib/orchestrator-prompt.ts`

**Simplify to**:
```
WORKFLOW:

STEP 1: Spawn brand-researcher
        → Wait for completion
        → Writes brand_intelligence.txt

STEP 2: Spawn culture-researcher
        → Reads brand_intelligence.txt (no context passing needed)
        → Designs its own searches based on what it learns
        → Writes cultural_intelligence.txt

STEP 3: Spawn creative-director
        → Reads both files
        → Uses skills
        → Generates memes
```

**Key**: Orchestrator does NOT extract or pass context. Just spawns in order. File system handles communication.

---

### 1.1 Brand Researcher: Deep Product + Context Output

**File**: `agent/.claude/agents/brand-researcher.md`

**Add Rigorous Product/Service Analysis**:
```
## Product/Service Deep Dive

Analyze the product/service offerings rigorously:
- What exactly do they sell?
- Pricing model (subscription, one-time, freemium?)
- Key features and how they solve problems
- Who is the ideal customer?
- What transformation does the product provide?

From this analysis, derive:
- Primary pain points (what problem does product solve?)
- Customer emotional state (frustrated? anxious? hopeful?)
- Value proposition in customer language
```

**Add Brand Type Inference**:
```
Brand Type: B2C / B2B / Both
Evidence: [How determined - pricing page, customer testimonials, use cases]
```

**Add Context Section for Culture Researcher** (end of output):
```
## CONTEXT FOR CULTURE RESEARCH

Read this section to inform your cultural research strategy.

Industry: [Specific industry/category]
Brand Type: [B2C / B2B / Both]
Target Audience: [Demographics + psychographics]
Primary Pain Points: [Top 3 customer struggles with emotional weight]
Customer Language: [5-7 actual phrases customers use]
Product Category: [What space this is in for meme research]
Meme Tone Ceiling: [Conservative / Moderate / Edgy]
Competitors: [Main competitors to research meme landscape]
```

**Add Competitive Meme Research** (1-2 searches):
- "[competitor] memes" + "[industry] brand viral"
- What's been done, what white space exists

---

### 1.2 Culture Researcher: Read Brand File First

**File**: `agent/.claude/agents/culture-researcher.md`

**MAJOR CHANGE - Start by reading brand research**:

```markdown
## Workflow

### Step 1: Read Brand Intelligence (REQUIRED FIRST)

Before any research, read `files/research/brand_intelligence.txt`.

From the "CONTEXT FOR CULTURE RESEARCH" section, extract:
- Industry/category for targeted searches
- Brand type (B2C/B2B/Both) for platform focus
- Target audience for demographic-specific research
- Pain points for relatable content angles
- Customer language for authenticity
- Tone ceiling for humor boundaries

### Step 2: Design Your Research Strategy

Based on brand context, plan 5-7 targeted searches:

**For B2C brands**:
- "[industry] memes" (e.g., "personal finance memes")
- "[target audience] humor" (e.g., "millennial money anxiety memes")
- "[pain point] jokes reddit" (e.g., "budgeting struggle memes")
- Platform trends (Instagram/Twitter viral content)

**For B2B brands**:
- "[profession] memes" (e.g., "accountant memes", "developer humor")
- "[industry] workplace humor" (e.g., "SaaS sales memes")
- LinkedIn professional humor trends
- Industry insider jokes

**For Both**:
- Cover both mass appeal AND insider angles

### Step 3: Execute Targeted Research

Run your planned searches. For each search, extract:
- Humor patterns resonating (absurdist, self-deprecating, observational)
- Psychological triggers active (validation, catharsis, belonging)
- Trending language/phrases
- What's overdone in this category
```

**Remove**: Generic search blocks, hardcoded search queries
**Add**: Intelligence-driven research based on brand context

---

### 1.3 Creative Director: Make it LEAN

**File**: `agent/.claude/agents/creative-director.md`

**REWRITE to ~50-60 lines** (current: 434 lines)

```markdown
---
name: creative-director
description: Synthesizes research to create viral meme concepts and generates images
tools: Read, Write, Skill, mcp__nano-banana__generate_ad_images
---

# Creative Director

Create 3-5 viral meme ads by synthesizing brand and cultural research.

## Workflow

### Step 1: Read Research Files

Read both files to understand the brand and cultural landscape:
- `files/research/brand_intelligence.txt`
- `files/research/cultural_intelligence.txt`

### Step 2: Create Meme Concepts

**Use skill: viral-meme-creation**

Follow the skill's complete workflow:
1. Extract key insights from research
2. Find brand-culture intersections
3. Create 3-5 original concepts
4. Validate viral potential

### Step 3: Generate Images

**Use skill: nanobanana-meme-prompting**

For each concept:
1. Translate concept into image prompt
2. Generate using `mcp__nano-banana__generate_ad_images`
3. Save to `files/final_output/images/meme_[N].png`

### Step 4: Document Campaign

Write `files/final_output/campaign_brief.txt` with:
- Campaign overview
- Each meme: concept, copy, strategic rationale, image path
- Posting recommendations

## Quality Standards

- 70/30 entertainment-to-promotion ratio
- Authentic brand-culture bridges only
- Text readable on mobile
- Would work without brand name (culturally native)

## Output

- 3-5 meme images in `files/final_output/images/`
- Campaign brief in `files/final_output/campaign_brief.txt`
```

**Why lean**: Skills handle the expertise (concept creation, image prompting). Agent just coordinates workflow.

---

### 1.4 Skill Update: Minor Tweaks

**File**: `agent/.claude/skills/viral-meme-creation/SKILL.md`

**Minor updates**:
- Change "5 concepts" to "3-5 concepts" throughout
- Add brief B2B guidance:
  ```
  **For B2B brands**:
  - Industry insider humor works (requires expertise to get it)
  - Process frustration (meetings, tools, approvals)
  - Professional validation ("finally someone said it" in work context)
  - LinkedIn-appropriate tone
  ```

**Keep**: Everything else (skill is already comprehensive)

---

## PHASE 2: Polish (Optional, after testing)

### 2.1 Nanobanana Skill

**File**: `agent/.claude/skills/nanobanana-meme-prompting/SKILL.md`

**Keep as-is** - already concise (175 lines)

Optional additions if needed:
- Composition principles
- Style-matching guide

---

## Implementation Order

### Phase 1 (implement now):
1. `server/lib/orchestrator-prompt.ts` - Sequential spawning
2. `agent/.claude/agents/brand-researcher.md` - Product analysis + context output
3. `agent/.claude/agents/culture-researcher.md` - Read brand file first, targeted searches
4. `agent/.claude/agents/creative-director.md` - **SIMPLIFY to ~50 lines**

### Phase 2 (optional polish):
5. `agent/.claude/skills/viral-meme-creation/SKILL.md` - Minor B2B additions
6. `agent/.claude/skills/nanobanana-meme-prompting/SKILL.md` - Keep as-is

---

## Expected Outcomes

- **Targeted research**: Culture searches based on actual brand context
- **Connected insights**: File-based communication, full context flow
- **Lean system**: Creative director ~50 lines instead of 434
- **Quality over quantity**: 3-5 memes instead of 5-8
- **B2B/B2C support**: Agent infers and adapts automatically

---

## Files to Modify

| File | Action |
|------|--------|
| `server/lib/orchestrator-prompt.ts` | Update to sequential spawning |
| `agent/.claude/agents/brand-researcher.md` | Add product analysis + context section |
| `agent/.claude/agents/culture-researcher.md` | Read brand file first, design own searches |
| `agent/.claude/agents/creative-director.md` | **REWRITE to ~50 lines** |
| `agent/.claude/skills/viral-meme-creation/SKILL.md` | Minor: 3-5 memes, B2B note |

---

## Quick Start for Implementation

When resuming, tell Claude:

> "Read OPTIMIZATION_PLAN.md and implement Phase 1. Start with the orchestrator, then brand-researcher, then culture-researcher, then creative-director."

This gives full context to continue where we left off.
