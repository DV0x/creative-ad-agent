# AI Agent Pipeline

> Part of [Architecture Documentation](../INDEX.md) | Orchestrator, subagents, tools, MCP

---

## Overview

The AI agent uses Claude's Agent SDK with an orchestrator pattern: a main agent with a system prompt that defines a multi-step workflow. The orchestrator spawns subagents for specific tasks and calls MCP tools for image generation.

```
User prompt → Orchestrator Agent (Claude Haiku 4.5)
                │
                ├── Step 1: Research  ──→ Task subagent (WebFetch, WebSearch)
                │                         └── Saves research.md
                │
                ├── Step 2: Hooks     ──→ Skill: hook-methodology
                │                         └── Saves hooks.md (6 ad angles)
                │
                ├── Step 3: Art Direction → Skill: art-style
                │                           └── Defines visual direction
                │
                ├── Step 4: Prompts   ──→ Creates prompts.json
                │
                ├── Step 5: Images    ──→ MCP: nano-banana (fal.ai)
                │                         └── Generates 6 images
                │
                └── Step 6: Review    ──→ Optional: inspect images, iterate
```

---

## SDK Configuration

```typescript
model: 'claude-haiku-4-5-20251001'
maxTurns: 30
cwd: '/app/agent'                           // (local: 'agent/')
settingSources: ['user', 'project']
systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT
mcpServers: { 'nano-banana': nanoBananaMcpServer }
```

### Multi-Turn Mechanism: `promptStream()` Async Generator

The core of the long-running agent is the `promptStream()` async generator in `agent-runner.ts`. It feeds prompts to the SDK's `query()` function:

1. **Turn 1:** Yields the initial prompt from the `PROMPT` env var
2. **Subsequent turns:** Calls `waitForPromptFile()` which polls `/app/next-prompt.json` every 500ms. When the DO writes a follow-up prompt to this file, the generator reads it, deletes it, and yields the next prompt

This keeps the agent Node process alive between turns — the SDK retains full conversation history in memory (no disk persistence). The generator returns (ending the process) when it receives a shutdown signal or `null`.

### Turn Sentinels

The agent-runner prints sentinel markers to stdout for the DO to track turn boundaries:

- **`turn_start`** — printed before yielding each follow-up prompt, includes `requestId` so the DO can match it to the right request and skip replayed history
- **`turn_complete`** — printed after each `result` message from the SDK, signals that `writeCompletionMarker()` has run and `/app/turn-result.json` is ready

---

## Available Tools (`allowedTools` Filter)

The agent-runner explicitly restricts SDK tools via the `allowedTools` array. Only these 11 tools are available to the agent:

| Tool | Category | Purpose |
|---|---|---|
| `Task` | Orchestration | Spawn subagents (research, creative) |
| `Skill` | Orchestration | Invoke skill definitions (hook-methodology, art-style) |
| `TodoWrite` | Planning | Task tracking during generation |
| `WebFetch` | Research | Scrape brand websites |
| `WebSearch` | Research | Cultural intelligence, competitor research |
| `Read` | File I/O | Read research files, prompts, hooks |
| `Write` | File I/O | Save research, hooks, prompts |
| `Edit` | File I/O | Modify existing files |
| `Glob` | File I/O | Find files by pattern |
| `Grep` | File I/O | Search file contents |
| `Bash` | System | Shell commands |
| `mcp__nano-banana__generate_ad_images` | Images | Generate images via fal.ai |

Any tool not in this list (e.g., `NotebookEdit`, `computer`) is blocked by the SDK even if the model requests it.

---

## Workflow Steps

### Step 1: Research

The orchestrator spawns a research subagent via `Task`:
- **WebFetch** the brand's website — analyze products, positioning, value props
- **WebSearch** for cultural angles — trends, memes, competitor strategies
- Saves findings to `files/research/brand_research.md`

### Step 2: Hook Generation

Uses the `hook-methodology` skill to create 6 ad angles:

| Hook Type | Description | Example |
|---|---|---|
| `stat` | Data-driven, statistic-based | "47% of runners switch after trying..." |
| `story` | Narrative, storytelling | "She started with a single pair..." |
| `fomo` | Fear of missing out / urgency | "Only 3 days left to get..." |
| `curiosity` | Question or intrigue-based | "What if your shoes could predict..." |
| `callout` | Direct challenge to viewer | "Still wearing last year's model?" |
| `contrast` | Before/after or comparison | "Other brands: mass produced. Nike: engineered" |

Saves to `.claude/skills/hook-methodology/hook-bank/hooks.md`

### Step 3: Art Direction

Uses the `art-style` skill to define visual style. The skill auto-selects 3-4 styles by brand category if no keyword specified, or routes to a specific workflow based on user keywords.

**14 Art Style Workflows** (`agent/.claude/skills/art-style/workflows/`):

| Workflow | Description | Keyword Triggers |
|---|---|---|
| `anderson-clay-diorama` | Wes Anderson diorama in handcrafted clay (default) | "clay", "anderson", "diorama", "theatrical" |
| `soft-brutalism-clay` | Neo-brutalist borders + warm 3D clay elements | "brutalism", "brutalist" |
| `bold-energy` | Saturated color blocks, dynamic product, oversized type | "bold", "energy", "dynamic" |
| `clean-premium` | Dark/moody with colored aura glow, glass overlays | "premium", "dark", "moody", "minimal" |
| `editorial-cutout` | Magazine-editorial with artistic cut-out edges | "editorial", "magazine", "cutout" |
| `product-on-gradient` | Clean product isolation on rich gradient backgrounds | "gradient", "product", "clean" |
| `typography-dominant` | Bold type IS the hero (60-70% of frame) | "typography", "type", "text", "poster" |
| `infographic-data-visual` | Data visualization, structured info, flat icons | "data", "infographic", "stats" |
| `lifestyle-render-hybrid` | Atmospheric environmental rendering, warm scenes | "lifestyle", "environment", "scene" |
| `dream-sketch-hybrid` | Real person composited into illustrated environment | "sketch", "dream", "illustration" |
| `service-realism` | Photorealistic lifestyle with graphic overlays | "realism", "photorealistic", "service" |
| `analog-craft` | Lo-fi film grain, torn paper collage, hand-cut elements | "analog", "craft", "vintage", "retro" |
| `split-comparison` | Dual-composition: before/after, problem/solution | "split", "comparison", "before", "versus" |
| `ugc-aesthetic-static` | Simulated UGC — screenshot framing, star ratings | "ugc", "review", "testimonial" |

Each workflow defines composition rules, color treatment, typography guidelines, and prompt modifiers.

Output: `files/creatives/{brand}_prompts.json` with image prompts + art direction

### Step 4: Image Prompts

Creates detailed prompts for each hook, saved as `files/creatives/prompts.json`:

```json
[
  {
    "prompt": "A bold typographic ad on dark background...",
    "hookType": "stat",
    "aspectRatio": "1:1",
    "negativePrompt": "text errors, blurry, low quality"
  }
]
```

### Step 5: Image Generation

Calls `mcp__nano-banana__generate_ad_images` with all prompts. The MCP tool:
1. Sends prompts to fal.ai API (Nano Banana Pro model)
2. Downloads images
3. Saves to disk/R2

### Step 6: Review (Optional)

On follow-up, the agent can:
- Read generated images (via `filepath` returned by MCP)
- Modify specific hooks
- Regenerate specific images
- Iterate based on user feedback

---

## Agent Workspace Layout

```
/app/agent/                                    # (production) or agent/ (local)
├── .claude/
│   ├── agents/
│   │   └── research.md                        # Research subagent: WebFetch+Write, ICP analysis
│   │                                          # Tools: WebFetch, Read, Write
│   │                                          # Output: files/research/{brand}_research.md
│   └── skills/
│       ├── hook-methodology/
│       │   ├── SKILL.md                       # Hook skill definition (10 hook types documented)
│       │   └── hook-bank/
│       │       ├── {brand}-{date}.md          # Generated hooks (6 types from research)
│       │       └── (many example hook files)
│       └── art-style/
│           ├── SKILL.md                       # Art style skill definition
│           ├── tools/
│           │   ├── generate-images.ts         # Image generation helper
│           │   └── run-generate.sh            # Shell wrapper
│           └── workflows/                     # 14 art style workflows
│               ├── anderson-clay-diorama.md   # Default — Wes Anderson clay diorama
│               ├── soft-brutalism-clay.md     # Neo-brutalist + warm clay
│               ├── bold-energy.md             # Saturated color blocks, dynamic
│               ├── clean-premium.md           # Dark/moody, aura glow
│               ├── editorial-cutout.md        # Magazine-editorial cutout
│               ├── product-on-gradient.md     # Product isolation on gradient
│               ├── typography-dominant.md     # Bold type as hero
│               ├── infographic-data-visual.md # Data visualization
│               ├── lifestyle-render-hybrid.md # Atmospheric environmental
│               ├── dream-sketch-hybrid.md     # Real person + illustrated world
│               ├── service-realism.md         # Photorealistic lifestyle + overlays
│               ├── analog-craft.md            # Lo-fi film grain, collage
│               ├── split-comparison.md        # Dual-composition before/after
│               └── ugc-aesthetic-static.md    # Simulated UGC screenshots
├── files/
│   ├── research/{brand}_research.md           # Research output (per brand)
│   └── creatives/{brand}_prompts.json         # Image prompts (per brand)
└── (no CLAUDE.md — workspace instructions embedded in orchestrator prompt)
```

### Research Agent (`research.md`)

Spawned via `Task` tool. Uses `WebFetch` to scrape brand homepage. Extracts: offer, value props, proof points, products, pain points, testimonials, brand colors, brand voice, messaging, and ICP analysis. Outputs structured markdown (~60-70 lines).

### Hook Skill (`hook-methodology`)

10 hook types defined (though generation uses 6): stat, story, fomo, curiosity, callout, contrast (+ pattern-interrupt, us-vs-them, social-proof, secret-reveal). Core philosophy: "Research first — every hook has a SOURCE." No invention, only discovery from research data.

### Art Style Skill (`art-style`)

Routes to style-specific workflows based on user keywords. Auto-selects 3-4 styles by brand category if no keyword specified. 10 style workflows available. Each workflow defines composition rules, color treatment, typography, and prompt modifiers.

---

## "New Campaign from Existing" — Skip Research Path

When a user creates a new campaign from an existing one, the research phase is skipped entirely. The flow:

```
User selects "New Campaign" on existing campaign
  → Client sets sourceCampaignId in store
  → User submits a brief (not a URL)
  → WS message: { type: 'generate', prompt, sessionId, sourceCampaignId }
```

### Server-Side (DO `handleGenerate`)

1. **Ownership check:** `getCampaignById(sourceCampaignId, userId)` — verifies the user owns the source campaign
2. **Research copy:** Copies `research` file from source's `campaign_files` to the new campaign's `campaign_files` in D1
3. **`file` event emitted** — client shows research immediately in the file panel
4. **System note appended** to the prompt: tells the agent to read the pre-loaded research, then run hook skill, art skill, and image generation (skipping the research subagent)
5. **`hasSourceResearch` flag set** on the DO instance — used during sandbox setup to hydrate the research file to disk

### Agent Behavior

The agent starts, finds `restored_research.md` on disk, and enters the pipeline at Step 2 (hooks) instead of Step 1 (research). This saves ~2 minutes of research time.

```
Pre-loaded research on disk → Step 2: Hooks → Step 3: Art → Step 4: Prompts → Step 5: Images
```

### Key Design Decisions

- Research is **copied** (not referenced) — the new campaign is fully independent
- Only research is copied; hooks, prompts, and images are generated fresh from the new brief
- `sourceCampaignId` is used once at creation time then forgotten — no persistent DB link between campaigns
- No new database tables or schema changes required
- Campaign name is prefixed: `"{sourceName} — {brief}"`

---

## Follow-Up Context

### Warm Container (Fast Path)

Agent process stays alive. The SDK retains full conversation history **in the active Node process memory** (not persisted to disk). Follow-up is just another turn via `promptStream()` — the DO writes `/app/next-prompt.json` and the agent picks it up within 500ms. The agent remembers everything from previous turns.

### Cold Start (Slow Path)

Container was evicted. The DO:
1. Queries D1 for existing campaign files (`campaign_files` table)
2. **Hydrates files** into the sandbox filesystem before starting the agent:
   - Research → `/app/agent/files/research/restored_research.md`
   - Hooks → `/app/agent/.claude/skills/hook-methodology/hook-bank/restored_hooks.md`
   - Prompts → `/app/agent/files/creatives/restored_prompts.json`
3. Files are written via `sandbox.exec(node -e "fs.writeFileSync(...)")` with content passed as env vars
4. Starts a fresh SDK session (no conversation history — only the hydrated files provide context)

This means the agent can reference existing work but doesn't remember the conversation itself.

**Source-research campaigns:** The same hydration path is used for campaigns created via "New from Existing". The hydration condition is `if (sdkSessionId || hasSourceResearch)`. When only research exists (no hooks/prompts yet), a smart follow-up note tells the agent to generate hooks and prompts from the pre-loaded research.

---

## MCP Server: nano-banana

### Tool: `generate_ad_images`

**Input Schema:**
```json
{
  "prompts": [{ "prompt": "...", "hookType": "stat", "aspectRatio": "1:1" }],
  "referenceImageUrls": ["https://..."],     // optional
  "resolution": "2k"                          // 1k | 2k | 4k
}
```

**Output:**
```json
{
  "images": [
    {
      "filename": "1_stat_bold-stat.png",
      "url": "https://fal.media/files/...",
      "urlPath": "/images/session/1_stat_bold-stat.png",
      "filepath": "/mnt/r2/images/session/1_stat_bold-stat.png",
      "prompt": "A bold typographic ad...",
      "hookType": "stat"
    }
  ]
}
```

**Key details:**
- Uses fal.ai's Nano Banana Pro model (Google Gemini image model)
- **Dual mode:** text-to-image by default (`fal-ai/nano-banana-pro`); auto-routes to edit endpoint (`fal-ai/nano-banana-pro/edit`) when `referenceImageUrls` are provided
- Returns `filepath` so agent can Read the image for inspection
- Writes to tracking file (`/app/generated-images.jsonl`) for completion marker

---

## See Also

- [Image Pipeline](./IMAGE_PIPELINE.md) — Generation → storage → serving → display
- [Sandbox Container](../cloudflare/SANDBOX_CONTAINER.md) — Agent runner lifecycle
- [Local AI Client](../local/LOCAL_AI_CLIENT.md) — In-process SDK usage
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — How agent output reaches the client
