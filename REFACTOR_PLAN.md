# Plan: Simplified Two-Agent Creative Ad System

## Goal
Refactor the current 3-agent system into a cleaner 2-agent architecture that:
1. Eliminates redundant research work
2. Conversion-focused ads as DEFAULT behavior
3. Skills for specialized formats (memes, etc.) invoked on demand
4. Intelligent orchestrator that understands context and makes decisions
5. Simple web UI via existing Express server

---

## Architecture Overview

```
User Request: "Create ads for https://brand.com"
         OR: "Create viral memes for https://brand.com"
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ ORCHESTRATOR (Intelligent Coordinator)                       │
│                                                             │
│ UNDERSTANDS:                                                │
│ - What the user is asking for (ads vs memes vs both)        │
│ - Extracts brand URL from natural language                  │
│ - Determines if special format requested (memes)            │
│                                                             │
│ DECIDES:                                                    │
│ - Whether to proceed or ask clarifying questions            │
│ - What instructions to give each agent                      │
│ - How to summarize results meaningfully                     │
│                                                             │
│ COORDINATES:                                                │
│ - Sequential agent execution with context                   │
│ - Passes relevant context (e.g., "user wants memes")        │
│ - Handles errors gracefully                                 │
└─────────────────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────────────────────────┐
│ RESEARCHER    │       │ CREATOR                           │
│               │       │                                   │
│ From URL:     │       │ DEFAULT: Conversion-focused ads   │
│ - Business    │       │ - Professional ad copies          │
│   overview    │  ───► │ - Headlines + CTAs                │
│ - Visual ID   │ file  │ - Platform-optimized images       │
│   (fonts,     │       │                                   │
│   colors)     │       │ ON REQUEST: Invoke viral-meme     │
│ - Features/   │       │ skill for meme-style content      │
│   services    │       │                                   │
│ - Target      │       │ Future skills:                    │
│   audience    │       │ ├── carousel-story                │
│ - Pain points │       │ └── video-hook                    │
│ - Culture fit │       │                                   │
└───────────────┘       └───────────────────────────────────┘
```

---

## Changes from Current System

| Current (3 agents) | New (2 agents) |
|--------------------|----------------|
| brand-researcher (412 lines) | **researcher** (~150 lines) |
| culture-researcher (286 lines) | merged into researcher |
| creative-director (93 lines) | **creator** (~100 lines) |
| 2 separate research outputs | 1 unified brand_profile.txt |
| Skills loaded via tool | Skills embedded or loaded once |

---

## Agent Definitions

### Agent 1: `researcher`

**Purpose**: Extract comprehensive brand intelligence from provided URL

**Tools**: WebFetch, WebSearch, Read, Write

**What it extracts**:
1. **Business Overview**: What they do, value proposition, key offerings
2. **Visual Identity**: Colors, fonts, design aesthetic, logo style
3. **Features/Services**: What they offer, pricing model if visible
4. **Target Audience**: Who they serve, demographics, psychographics
5. **Pain Points**: Problems they solve, customer frustrations
6. **Cultural Context**: Brand personality, tone, humor tolerance

**Workflow**:
1. WebFetch homepage (extract business overview, visual identity)
2. WebFetch about/products pages if needed
3. WebSearch for customer language (Reddit, forums, reviews)
4. WebSearch for audience culture (what resonates with this demographic)
5. Synthesize into unified brand profile

**Output**: `files/research/brand_profile.txt` (~150-200 lines, focused)

### Agent 2: `creator`

**Purpose**: Generate ad creatives based on brand research

**Tools**: Read, Write, Skill, mcp__nano-banana__generate_ad_images

**DEFAULT Behavior** (conversion-focused ads - embedded in agent):
- Professional ad copies with clear value propositions
- Strong headlines that address pain points
- Clear calls-to-action
- Platform-optimized dimensions (Meta, X, LinkedIn)
- Image prompting techniques built-in

**OPTIONAL** (when user requests memes):
- Invoke `viral-meme` skill
- Entertainment-first approach
- Humor patterns, emotional triggers
- "11pm test" methodology

**Workflow**:
1. Read brand_profile.txt
2. If meme requested → Load viral-meme skill
3. Create 3-5 ad concepts with copy
4. Generate images via MCP
5. Document campaign brief

**Output**: `files/final_output/` (images + brief)

**Future Skills**:
- `carousel-story` - Multi-slide narrative ads
- `video-hook` - Short-form video scripts

---

## Skill Definitions

### Skill: `viral-meme` (invoked on request)

Entertainment-first meme ads for organic social reach. Invoked when user specifically asks for memes.

**Core principles**:
- 70% entertainment, 30% brand
- Customer language is your superpower
- "Would you send this to a friend at 11pm?"
- One strong emotion per meme
- NEVER copy existing meme formats
- Original concepts, not template copies

**Includes**:
- Emotional targets (catharsis, validation, belonging, surprise)
- Humor patterns (self-deprecating, observational, absurdist, wholesome)
- Hard constraints (what to never do)
- Image prompting techniques for meme-style visuals

---

## Conversion Ads (Embedded in Creator Agent)

The default behavior - professional ads for paid campaigns. NOT a skill, built into the creator agent.

**Core principles**:
- Clear value proposition in 3 seconds
- Strong headline + supporting visual
- Explicit call-to-action
- Platform-specific dimensions
- Professional but not corporate/boring

**Ad structure**:
- **Headline**: Pain point or benefit (max 5 words)
- **Body**: Value proposition or social proof
- **CTA**: Clear next action
- **Visual**: Product, lifestyle, or outcome-focused

**Platform dimensions**:
- Meta: 1:1 (feed), 9:16 (stories/reels)
- LinkedIn: 1.91:1 (feed), 1:1 (sponsored)
- X: 16:9 or 1:1

---

## File Structure (Simplified)

```
agent/
├── .claude/
│   ├── agents/
│   │   ├── researcher.md      # Brand intelligence extraction
│   │   └── creator.md         # Ad creation (conversion default + meme skill)
│   └── skills/
│       └── viral-meme/
│           └── SKILL.md       # Meme-style content (invoked on request)
├── files/
│   ├── research/
│   │   └── brand_profile.txt  # Single research output
│   └── final_output/
│       ├── campaign_brief.txt
│       └── images/
```

---

## Intelligent Orchestrator

**Current Problem**: The orchestrator is a dumb for-loop that just says "Starting X" and spawns agents blindly.

**New Approach**: An intelligent coordinator that understands, decides, and communicates meaningfully.

### What Makes It Intelligent

**1. UNDERSTANDS the request**
```
User: "Create some ads for mybrand.com targeting small business owners"
       │
       ├─ Extracts URL: mybrand.com
       ├─ Identifies format: ads (default → conversion)
       ├─ Notes context: targeting small business owners
       └─ No meme keywords → use default conversion ads
```

```
User: "Make viral memes for https://startup.io"
       │
       ├─ Extracts URL: https://startup.io
       ├─ Identifies format: memes (keyword detected)
       └─ Will tell creator to invoke viral-meme skill
```

**2. DECIDES what to do**
- If URL missing → Ask for it
- If request ambiguous → Clarify with user
- If brand seems unsuitable for memes → Suggest conversion ads instead
- If research fails → Handle gracefully, explain what happened

**3. COMMUNICATES meaningfully**
Not this:
```
"Starting brand research."
"Brand research complete. Starting creative."
"Done."
```

But this:
```
"I'll analyze mybrand.com to understand their brand, audience, and pain points."
"Found a B2B SaaS targeting SMBs. Creating conversion-focused ads with clear CTAs."
"Done! Generated 4 ad creatives optimized for LinkedIn and Meta. See files/final_output/"
```

### Orchestrator Prompt Structure

```typescript
ORCHESTRATOR_SYSTEM_PROMPT = `
You are an intelligent creative coordinator for an ad generation system.

YOUR CAPABILITIES:
- Spawn researcher agent to analyze brand URLs
- Spawn creator agent to generate ad creatives
- Understand natural language requests and extract intent

UNDERSTANDING REQUESTS:
- Extract brand URL from user message
- Detect if user wants memes (keywords: "meme", "viral", "funny", "humor")
- Note any targeting context (audience, platform, etc.)
- If unclear, ask clarifying questions

DECISION MAKING:
- Default to conversion-focused ads unless memes explicitly requested
- Pass relevant context to agents (e.g., "user wants memes", "targeting: small businesses")
- If research agent fails, explain the issue and suggest solutions

COMMUNICATION:
- Be conversational, not robotic
- Explain what you're doing and why
- Summarize results meaningfully
- Never just say "Starting X" - provide context

WORKFLOW:
1. Parse user request → extract URL, format, context
2. Spawn researcher → "Analyze {URL}. Extract brand overview, visual identity, audience, pain points."
3. Wait for research completion
4. Spawn creator → "Read brand_profile.txt. {Create conversion ads / Invoke viral-meme skill}. Context: {any user notes}"
5. Summarize what was created
`
```

---

## API Changes

**Current**: `POST /generate { prompt: "Create Instagram ads for https://..." }`

**New**: Natural language input - orchestrator handles parsing
```json
POST /generate {
  "prompt": "Create ads for https://brand.com targeting small business owners"
}
```

The intelligent orchestrator extracts URL, format, and context from natural language.

---

## Implementation Steps

### Phase 1: Create New Agents ✅ DONE
1. ✅ Write `agent/.claude/agents/researcher.md` - Brand intelligence extraction (adaptive mode)
2. ✅ Write `agent/.claude/agents/creator.md` - Ad creation with conversion ads + prompting embedded

### Phase 2: Create Skill ✅ DONE (needs rework)
3. ✅ Create `agent/.claude/skills/viral-meme/SKILL.md` - Meme mindset skill
   - **TODO: Rework viral-meme skill** - See "Skill Rework Notes" below

### Phase 3: Rewrite Orchestrator 🔲 PENDING
4. Rewrite `server/lib/orchestrator-prompt.ts` - Intelligent coordinator
5. Update `server/lib/ai-client.ts` - Any necessary adjustments

### Phase 4: Simplify API 🔲 PENDING
6. Simplify `server/sdk-server.ts` - Natural language input (no explicit format param needed)

### Phase 5: Cleanup 🔲 PENDING
7. Delete old agents: brand-researcher.md, culture-researcher.md, creative-director.md
8. Delete redundant skills: nanobanana-meme-prompting/, viral-meme-creation/
9. Rewrite ARCHITECTURE.md

### Phase 6: Test 🔲 PENDING
10. Test default flow: "Create ads for https://example.com"
11. Test meme flow: "Create viral memes for https://example.com"
12. Verify image generation works
13. Check cost/performance vs old system

---

## Files to Modify

| File | Action | Status |
|------|--------|--------|
| `agent/.claude/agents/researcher.md` | CREATE | ✅ DONE |
| `agent/.claude/agents/creator.md` | CREATE (with conversion ads + prompting embedded) | ✅ DONE |
| `agent/.claude/skills/viral-meme/SKILL.md` | CREATE (meme mindset skill) | ✅ DONE (needs rework) |
| `server/lib/orchestrator-prompt.ts` | REWRITE (intelligent coordinator) | 🔲 PENDING |
| `server/lib/ai-client.ts` | MINOR MODIFY | 🔲 PENDING |
| `server/sdk-server.ts` | SIMPLIFY (natural language input) | 🔲 PENDING |
| `ARCHITECTURE.md` | REWRITE | 🔲 PENDING |
| `agent/.claude/agents/brand-researcher.md` | DELETE | 🔲 PENDING |
| `agent/.claude/agents/culture-researcher.md` | DELETE | 🔲 PENDING |
| `agent/.claude/agents/creative-director.md` | DELETE | 🔲 PENDING |
| `agent/.claude/skills/nanobanana-meme-prompting/` | DELETE (embedded in creator) | 🔲 PENDING |
| `agent/.claude/skills/viral-meme-creation/` | DELETE (replaced by viral-meme) | 🔲 PENDING |

---

## Success Criteria

1. **Simpler**: 2 agents instead of 3
2. **Smarter**: Intelligent orchestrator that understands context
3. **Faster**: No redundant research passes
4. **Extensible**: New formats = new skills (not new agents)
5. **Default works**: Conversion ads without specifying format
6. **Memes on demand**: Invoke skill when explicitly requested
7. **Working**: End-to-end generation still works
8. **Cheaper**: Fewer tokens due to shorter prompts

---

## Skill Rework Notes

### viral-meme Skill - Future Improvements

The current `viral-meme/SKILL.md` was created as an initial version. Consider reworking to:

**1. Add more specific creative provocations:**
- Industry-specific humor patterns
- Platform-specific content styles (Instagram vs Twitter vs TikTok)
- Seasonal/timely content hooks

**2. Include concrete examples:**
- Before/after examples of meme concepts
- Visual reference descriptions
- Caption patterns that work

**3. Strengthen the connection to research:**
- How to extract meme angles from pain points
- How to use customer language in memes
- How to match humor pattern to brand tone ceiling

**4. Add anti-patterns with examples:**
- Specific examples of what NOT to do
- Common mistakes brands make
- "Cringe" indicators

**5. Consider splitting into specialized skills (future):**
- `viral-meme` - General meme creation
- `platform-meme` - Platform-specific optimization
- `reaction-content` - Reactive/timely content

### Notes from Implementation

- Skill is loaded via `Skill("viral-meme")` from creator agent
- Skill provides MINDSET, agent provides EXECUTION (prompting techniques)
- Skills are additive - don't need to duplicate agent knowledge
- Description field is critical for skill discovery
