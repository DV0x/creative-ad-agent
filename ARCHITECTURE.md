# Creative Ad Agent - System Architecture

**Version:** 4.0
**Last Updated:** December 2025
**Status:** Production (Hook-First Conversion Ad Generator with MCP Image Generation)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Details](#component-details)
4. [Agent System](#agent-system)
5. [Skills System](#skills-system)
6. [Data Flow](#data-flow)
7. [File Structure](#file-structure)
8. [API Endpoints](#api-endpoints)
9. [Session Management](#session-management)
10. [Instrumentation & Observability](#instrumentation--observability)
11. [Technology Stack](#technology-stack)
12. [Deployment](#deployment)
13. [Design Decisions](#design-decisions)

---

## System Overview

### Purpose
An AI-powered creative advertising agent that generates conversion-focused ads using a **hook-first methodology**. The system analyzes brand websites, extracts factual data, and creates 6 diverse ad concepts with AI-generated images using Gemini 3 Pro Image Preview.

### Key Features
- **Hook-First Ad Generation**: Hooks are mined from research data using 7 proven formulas
- **2-Agent Orchestration**: Coordinates strategist (research) and creator (ads) agents sequentially
- **Conversion-Craft Skill**: Operational framework with hook extraction system and copywriting frameworks
- **Hook Diversity Matrix**: 6 concepts MUST cover different emotional triggers (Stat, Story, FOMO, Curiosity, Call-out, Contrast)
- **MCP Image Generation**: Nano-banana MCP server generates images using Gemini 3 Pro Image Preview
- **Session Management**: Stateful conversation handling with forking capabilities
- **Real-time Instrumentation**: Complete observability of SDK operations, costs, and performance

### Performance Targets
- **Total Generation Time**: 2-5 minutes
- **Sequential Workflow**: 2 agents executed in order (strategist → creator)
- **Image Generation**: Up to 3 images per MCP call
- **Output**: 6 ad concepts with hook diversity + generated images

---

## High-Level Architecture

```
+------------------------------------------------------------------+
|                         CLIENT REQUEST                            |
|                    POST /generate { prompt }                      |
+----------------------------------+-------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                      EXPRESS SERVER (sdk-server.ts)               |
|                         Port: 3001                                |
|  +------------------------------------------------------------+  |
|  |  Endpoints:                                                 |  |
|  |  - POST /generate      (campaign generation)                |  |
|  |  - GET  /sessions      (list sessions)                      |  |
|  |  - POST /sessions/:id/continue (resume session)             |  |
|  |  - POST /sessions/:id/fork     (branch session)             |  |
|  |  - GET  /images/:sessionId/:filename (serve images)         |  |
|  +------------------------------------------------------------+  |
+----------------------------------+-------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                        AIClient (ai-client.ts)                    |
|  +------------------------------------------------------------+  |
|  |  - queryStream()         Async generator for SDK messages   |  |
|  |  - queryWithSession()    Session-aware streaming            |  |
|  |  - queryWithSessionFork() Branch from existing session      |  |
|  +------------------------------------------------------------+  |
|                                   |                               |
|     +-----------------------------+-----------------------------+ |
|     |                             |                             | |
|     v                             v                             v |
| +----------------+    +-------------------+    +---------------+  |
| | SessionManager |    | SDKInstrumentor   |    | Claude SDK    |  |
| | (sessions.ts)  |    | (instrumentor.ts) |    | query()       |  |
| +----------------+    +-------------------+    +---------------+  |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                    CLAUDE AGENT SDK ORCHESTRATION                 |
|  +------------------------------------------------------------+  |
|  |  Model: claude-opus-4-5-20251101                           |  |
|  |  Max Turns: 30                                              |  |
|  |  CWD: agent/ (loads .claude/agents/ and .claude/skills/)   |  |
|  +------------------------------------------------------------+  |
|                                   |                               |
|     +-----------------------------+-----------------------------+ |
|     |                                                           | |
|     v                                                           v |
| +--------------------+                           +---------------+|
| | ORCHESTRATOR AGENT |                           | MCP SERVERS   ||
| | (system prompt)    |                           | +-----------+ ||
| +--------------------+                           | |nano-banana| ||
|     |                                            | |(Gemini AI)| ||
|     | Task Tool                                  | +-----------+ ||
|     v                                            +---------------+|
| +--------------------+    +--------------------+                  |
| | STRATEGIST AGENT   |    | CREATOR AGENT      |                  |
| | (strategist.md)    |--->| (creator.md)       |                  |
| +--------------------+    +--------------------+                  |
+------------------------------------------------------------------+
```

---

## Component Details

### 1. Express Server (`server/sdk-server.ts`)

**Responsibilities**:
- HTTP API endpoint handling
- Request validation and routing
- Response formatting and error handling
- CORS and middleware configuration
- Image serving for generated ads

**Key Endpoints**:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate` | POST | Main campaign generation - accepts natural language prompt |
| `/test` | POST | SDK query testing with session management |
| `/sessions` | GET | List all active sessions |
| `/sessions/:id` | GET | Get specific session stats |
| `/sessions/:id/continue` | POST | Resume existing session |
| `/sessions/:id/fork` | POST | Create session variant |
| `/sessions/:id/family` | GET | Get session family tree |
| `/images` | GET | List all generated images by session |
| `/images/:sessionId/:filename` | GET | Serve specific generated image |
| `/health` | GET | Health check with config status |

---

### 2. AIClient (`server/lib/ai-client.ts`)

**Purpose**: Wrapper around Claude SDK with session-aware query capabilities

**Configuration**:
```typescript
{
  cwd: projectRoot,                    // Points to agent/ directory
  model: 'claude-haiku-4-5-20251001',  // Fast model for orchestration
  maxTurns: 30,                        // CRITICAL for tool usage
  settingSources: ['user', 'project'], // Load agents + skills from .claude/
  allowedTools: [
    // Orchestrator tools
    "Task", "Skill", "TodoWrite",
    // Subagent tools
    "WebFetch", "WebSearch", "Read", "Write", "Glob", "Grep", "Bash", "Edit",
    // MCP tool
    "mcp__nano-banana__generate_ad_images"
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
  mcpServers: {
    "nano-banana": nanoBananaMcpServer
  }
}
```

**Key Methods**:
- `queryStream()` - Stream query to Claude SDK
- `queryWithSession()` - Session-aware query with automatic management
- `queryWithSessionFork()` - Fork session for A/B testing

**Generator Lifecycle Pattern** (Critical for MCP):
```typescript
// Generator must stay alive during tool execution
// Uses AbortController for proper cleanup
const abortController = new AbortController();

// Generator waits on abort signal to stay alive
if (signal) {
  await new Promise<void>((resolve) => {
    signal.addEventListener('abort', () => resolve());
  });
}

// Abort when query completes
abortController.abort();
```

**Agent & Skill Discovery**:
At initialization, AIClient:
1. Scans `agent/.claude/agents/` for agent definitions
2. Scans `agent/.claude/skills/` for skill definitions
3. Logs discovered agents and skills with their tools and descriptions

---

### 3. Orchestrator Prompt (`server/lib/orchestrator-prompt.ts`)

**Purpose**: Defines the main agent's behavior as an intelligent coordinator

**Capabilities**:
1. Spawn researcher agent to analyze brand URLs
2. Spawn creator agent to generate ad creatives
3. Understand natural language requests and extract intent
4. Communicate with insight about what it's doing

**Mode Detection**:
- **MEME MODE keywords**: "meme", "memes", "viral", "funny", "humor", "humorous", "entertainment"
- **CONVERSION MODE**: Default when no meme keywords found

**Workflow**:
1. Parse request (extract URL, detect format, note context)
2. Spawn researcher (with meme hint if applicable)
3. Read research file (for orchestrator's own context)
4. Spawn creator (pass format decision in prompt)
5. Summarize results

**Agent Prompts** (from orchestrator):
```typescript
// researcher
Task({
  subagent_type: "researcher",
  description: "Brand research for {domain}",
  prompt: "Research {URL}. Extract brand overview, visual identity, target audience,
          pain points, and customer language. Save to files/research/{brand}_brand_profile.txt"
})
// For meme mode, add: "This is for viral meme content - go deep on audience culture and humor patterns."

// creator
Task({
  subagent_type: "creator",
  description: "Create {format} ads for {brand}",
  prompt: "Create {FORMAT} ads for {BRAND_NAME}.
          Read files/research/{brand}_brand_profile.txt for full research.
          {MEME: 'Load the viral-meme skill and create entertainment-first content.'}
          {CONVERSION: 'Use the embedded conversion framework for professional ads with clear CTAs.'}
          Generate 5 concepts with images. Save to files/final_output/"
})
```

---

### 4. SessionManager (`server/lib/session-manager.ts`)

**Purpose**: Manages SDK session lifecycle and persistence

**Data Model**:
```typescript
interface SessionInfo {
  id: string;                    // Our session ID
  sdkSessionId?: string;         // SDK's internal session ID
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: {
    status: 'active' | 'completed' | 'error';
    messageCount: number;
    forkedFrom?: string;         // Base session if fork
    forkPurpose?: string;
  };
  messages: any[];               // Full message history
  turnCount: number;
}
```

**Key Features**:
- **Persistence**: `./sessions/*.json` files
- **Auto-save**: Every 10 messages
- **Cleanup**: 24-hour max age, 1-hour inactivity for completed sessions
- **Forking**: Create session variants for A/B testing

---

### 5. SDKInstrumentor (`server/lib/instrumentor.ts`)

**Purpose**: Real-time instrumentation and metrics tracking

**Tracked Metrics**:
- Events: All SDK message types
- Tool Calls: Every tool invocation
- Agent Calls: Subagent launches via Task tool
- Costs: SDK-provided USD costs (authoritative from `result.success`)
- Timing: Event timestamps and durations
- Usage: Token counts (input, output, cache read, cache write)

---

### 6. Nano Banana MCP Server (`server/lib/nano-banana-mcp.ts`)

**Purpose**: AI-powered image generation using Gemini 2.5 Flash

**Tool**: `generate_ad_images`

**Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| prompts | string[] | Array of 1-3 image generation prompts |
| style | string? | Visual style (e.g., "modern minimal", "photorealistic") |
| dimensions | string? | Target dimensions (e.g., "1080x1080", "1080x1350") |
| sessionId | string? | Session ID for organizing images into folders |

**Output**:
- PNG files saved to `generated-images/{sessionId}/`
- URLs returned for inclusion in campaign brief
- Filename format: `{timestamp}_{index}_{sanitized_prompt}.png`

**Architecture**: Simple synchronous pattern (v3.0.0)
- Generates up to 3 images per call
- Returns complete results through MCP stream
- 1-second rate limit between requests
- Graceful error handling (continues with remaining images if one fails)

---

## Agent System

### Agent Hierarchy & Hook-First Workflow

```
+------------------------------------------------------------------+
|                    USER REQUEST PROCESSING                        |
|             "Create ads for https://example.com"                  |
+------------------------------------------------------------------+
                                   |
                                   v
+------------------------------------------------------------------+
|                      ORCHESTRATOR AGENT                           |
|                                                                   |
|   1. Parse request                                                |
|      +-- Extract URL (required)                                   |
|      +-- Extract style preference (optional)                      |
|                                                                   |
|   2. Spawn STRATEGIST subagent                                    |
|      +-- Wait for research completion                             |
|                                                                   |
|   3. Spawn CREATOR subagent                                       |
|      +-- Pass style preference                                    |
|                                                                   |
|   4. Report completion                                            |
+------------------------------------------------------------------+
                                   |
        +--------------------------|---------------------------+
        |                          |                           |
        v                          |                           v
+-------------------+              |              +-------------------+
|   STRATEGIST      |              |              |    CREATOR        |
|   AGENT           |              |              |    AGENT          |
+-------------------+              |              +-------------------+
|                   |              |              |                   |
| Tools:            |              |              | Tools:            |
| - WebFetch        |              |              | - Read            |
| - Read            |              |              | - Write           |
| - Write           |              |              | - Skill           |
|                   |              |              | - MCP Image Gen   |
+-------------------+              |              +-------------------+
        |                          |                      |
        v                          |                      v
+-------------------+              |              +-------------------+
| OUTPUT:           |              |              | INPUT:            |
| files/strategy/   |--------------+------------->| files/strategy/   |
| {brand}_research  |                             | {brand}_research  |
| .md               |                             | .md               |
+-------------------+                             +-------------------+
                                                          |
                                                          v
                                                  +-------------------+
                                                  | SKILL LOAD:       |
                                                  | conversion-craft  |
                                                  +-------------------+
                                                          |
                                                          v
                                                  +-------------------+
                                                  | OUTPUT:           |
                                                  | - 6 Ad Concepts   |
                                                  | - Generated Images|
                                                  | - Campaign Brief  |
                                                  +-------------------+
```

### Agent Definitions

#### 1. Strategist (`agent/.claude/agents/strategist.md`)

**Purpose**: Data extraction agent that pulls factual information from business homepages

**Tools**: WebFetch, Read, Write

**Key Responsibilities**:
- Extract brand name from URL for file naming
- Fetch and analyze homepage content
- Extract SPECIFIC data (numbers, quotes, colors) - NOT creative decisions

**Research Workflow**:
1. Extract brand name from URL
2. WebFetch homepage
3. Extract structured data in categories
4. Write to `files/strategy/{brand}_research.md`

**Output Sections** (~50-60 lines, concise):
| Section | What to Extract |
|---------|-----------------|
| THE OFFER | Products, prices, timeframes, geographic scope |
| VALUE PROPS | 3-5 specific differentiators |
| PROOF POINTS | Reviews, ratings, licenses, case studies with numbers |
| PRODUCTS/SERVICES | Full listing |
| VISUAL IDENTITY | Colors (hex), typography, aesthetic, imagery style |
| BRAND VOICE | Tone and communication style |
| TESTIMONIALS | Exact quotes with attribution |
| MESSAGING | Headlines and CTAs |

**Critical Rules**:
- Data extraction ONLY - no creative decisions
- Be SPECIFIC with numbers, not vague
- Extract exact quotes for testimonials
- Include color codes (hex or descriptions)
- Don't make recommendations - facts only

#### 2. Creator (`agent/.claude/agents/creator.md`)

**Purpose**: Conversion-focused ad creation using hook-first methodology

**Tools**: Read, Write, Skill, mcp__nano-banana__generate_ad_images

**9-Step Workflow**:
```
+------------------+
| 1. READ RESEARCH |
+--------+---------+
         v
+------------------+
| 2. LOAD SKILL    |
| conversion-craft |
+--------+---------+
         v
+------------------+
| 3. DETERMINE     |
|    STYLE         |
+--------+---------+
         v
+------------------+
| 4. BUILD HOOK    |
|    BANK (15-20)  |
+--------+---------+
         v
+------------------+
| 5. SELECT 6      |
|    DIVERSE HOOKS |
+--------+---------+
         v
+------------------+
| 6. BUILD         |
|    CONCEPTS      |
+--------+---------+
         v
+------------------+
| 7. CRAFT IMAGE   |
|    PROMPTS       |
+--------+---------+
         v
+------------------+
| 8. GENERATE      |
|    IMAGES (MCP)  |
+--------+---------+
         v
+------------------+
| 9. DELIVER       |
|    CREATIVES     |
+------------------+
```

**Style Detection** (from user request):
| Keywords | Style |
|----------|-------|
| "illustration", "illustrated" | Illustration |
| "meme", "funny", "viral" | Meme |
| "cinematic", "photography" | Photography (default) |
| "minimal", "clean" | Minimalist |
| "bold", "graphic" | Bold Graphic |

**Hook Diversity Matrix** (6 Concepts MUST Use Different Types):
```
+------------------------------------------------------------------+
|                    6 CONCEPTS - HOOK DIVERSITY                    |
+------------------------------------------------------------------+

  Concept   Hook Type           Research Source      Emotional Trigger
  -------   ---------           ---------------      -----------------
    [1]     Stat/Data           Proof Points         Social Proof
    [2]     Story/Result        Testimonials         Empathy + Relief
    [3]     FOMO/Urgency        Offer + Scarcity     Loss Aversion
    [4]     Curiosity           Value Props          Intrigue
    [5]     Call-out/Question   Pain Points          Recognition
    [6]     Contrast/Versus     Competitor Angle     Logic + Greed

+------------------------------------------------------------------+
```

**Image Generation Strategy**:
- Generate in batches: 3 first, then 3
- Use "2K" resolution for most ads
- Match aspect ratio to platform (1:1 Instagram, 9:16 Stories, 4:5 Facebook)

### Tool Permissions by Agent

```
+------------------------------------------------------------------+
|                      TOOL ACCESS MATRIX                           |
+------------------------------------------------------------------+

                    Task  Skill  Todo  Web   Read  Write  MCP
                    ----  -----  ----  ----  ----  -----  ---
  Orchestrator       X      X     X     -     -      -     -
  Strategist         -      -     -     X     X      X     -
  Creator            -      X     -     -     X      X     X

+------------------------------------------------------------------+
|  MCP Tool: mcp__nano-banana__generate_ad_images                   |
|  - prompts: string[] (1-3 image descriptions)                     |
|  - style: string (cinematic, illustration, meme, etc.)            |
|  - aspectRatio: string (1:1, 9:16, 4:5, 16:9, 2:3)               |
|  - imageSize: "2K" | "4K"                                         |
|  - sessionId: string (for organizing output)                      |
+------------------------------------------------------------------+
```

---

## Skills System

Skills provide specialized guidance that agents consult during their workflow. Defined in `agent/.claude/skills/` and invoked using the `Skill` tool.

### conversion-craft (`agent/.claude/skills/conversion-craft/SKILL.md`)

**Purpose**: Operational framework for creating conversion-focused ads with proven formulas

**When to Use**: Creator agent loads this skill FIRST before building hooks

**Key Components**:

#### 1. Hook Extraction System

Maps research data → potential hooks:

```
+------------------------------------------------------------------+
|                    HOOK EXTRACTION MAPPING                        |
+------------------------------------------------------------------+

  Research Section       What to Extract          Hook Types
  ----------------       ---------------          ----------
  The Offer              Price, speed,            Price hooks
                         guarantee, mechanism     Speed hooks
                                                  Guarantee hooks

  Value Props            Time saved, money        Benefit hooks
                         saved, pain removed      Transformation hooks

  Proof Points           Customer count,          Stat hooks
                         success rate, stats      Social proof hooks

  Testimonials           Specific results,        Quote hooks
                         emotional quotes         Story hooks
                                                  Result hooks

  Pain Points            Frustrations, fears,     FOMO hooks
                         obstacles                Loss aversion hooks
                                                  Question hooks
+------------------------------------------------------------------+
```

#### 2. Seven Hook Formulas

| Hook Type | Formula | Example |
|-----------|---------|---------|
| FOMO | "[X] [audience] already [achieved]. Are you next?" | "1,247 homeowners saved $340/mo. Are you next?" |
| Stat | "[Number]% of [audience] [pain]. Here's the fix." | "73% of first-time buyers overpay. Here's the fix." |
| Curiosity | "What [audience] discovered about [topic] (surprising)" | "What homeowners discovered about rates (surprising)" |
| Call-out | "Hey [audience], stop [mistake]" | "Hey first-time buyers, stop calling 10 lenders" |
| Contrast | "[Old way] vs [Brand way]: [difference]" | "10 phone calls vs 1 click: same rates, 10x faster" |
| Question | "Are you still [behavior]? [Consequence]" | "Are you still paying 7.5%? You're losing $340/mo." |
| Story/Result | "[Name] [result] in [time]. Here's how." | "Sarah locked 6.2% in 60 seconds. Here's how." |

#### 3. Hook Scoring Checklist

Each hook must verify:
- ✅ **Specific?** (Numbers, names, timeframes from research - not generic)
- ✅ **Emotional trigger?** (FOMO, curiosity, loss aversion, greed)
- ✅ **3-second test?** (Message clear instantly on mobile)
- ✅ **Competitor-proof?** (They can't copy this exact hook)

#### 4. Copywriting Frameworks

**PAS (Problem → Agitate → Solution)**:
- Best for pain points and emotional connection

**BAB (Before → After → Bridge)**:
- Best for transformation stories

**AIDA (Attention → Interest → Desire → Action)**:
- Best for audiences in buying mode

#### 5. Emotional Triggers

| Trigger | How to Use | Key Words |
|---------|------------|-----------|
| Fear/FOMO | Limited time, scarcity | "Last chance", "Don't miss" |
| Loss Aversion | Cost of inaction > gain | "Stop losing $X", "You're leaving $X behind" |
| Greed | Lead with value | "Free", "Save $X", "Get $X back" |
| Social Proof | Specific numbers, names | "[X] customers", "[Name] did it" |
| Urgency | Real deadlines | "Ends [date]", "Today only" |

**Key Insight**: 70% of purchases are emotional, not logical. Lead with feeling, back with proof.

#### 6. Anti-Patterns (NEVER USE)

```
+------------------------------------------------------------------+
|                    ANTI-PATTERNS TO AVOID                         |
+------------------------------------------------------------------+

  ❌ "Your trusted partner"
  ❌ "Quality you can count on"
  ❌ "Solutions for your needs"
  ❌ Round numbers when research has exact ones
  ❌ Generic benefits when research has specific ones
  ❌ Stock handshakes, keys-to-new-home, suited professionals

+------------------------------------------------------------------+
```

---

## Data Flow

### Complete Campaign Generation Flow

```
+------------------------------------------------------------------+
|                     COMPLETE DATA FLOW                            |
+------------------------------------------------------------------+

  USER                  SERVER                 AGENTS               MCP
   |                      |                      |                   |
   | POST /generate       |                      |                   |
   | {prompt: "URL"}      |                      |                   |
   |--------------------->|                      |                   |
   |                      |                      |                   |
   |                      | Create Session       |                   |
   |                      |---+                  |                   |
   |                      |<--+                  |                   |
   |                      |                      |                   |
   |                      | Initialize           |                   |
   |                      | Instrumentation      |                   |
   |                      |---+                  |                   |
   |                      |<--+                  |                   |
   |                      |                      |                   |
   |                      | SDK Query            |                   |
   |                      |--------------------->|                   |
   |                      |                      |                   |
   |                      |                      | ORCHESTRATOR      |
   |                      |                      | Parse URL/Style   |
   |                      |                      |                   |
   |                      |                      | Task: Strategist  |
   |                      |                      |---+               |
   |                      |                      |   | WebFetch      |
   |                      |                      |   | Extract Data  |
   |                      |                      |   | Write File    |
   |                      |                      |<--+               |
   |                      |                      |                   |
   |                      |                      | Task: Creator     |
   |                      |                      |---+               |
   |                      |                      |   | Read Research |
   |                      |                      |   | Load Skill    |
   |                      |                      |   | Build Hooks   |
   |                      |                      |   |               |
   |                      |                      |   | MCP Call      |
   |                      |                      |   |-------------->|
   |                      |                      |   |               |
   |                      |                      |   |   Gemini API  |
   |                      |                      |   |   Generate    |
   |                      |                      |   |   Save PNGs   |
   |                      |                      |   |               |
   |                      |                      |   |<--------------|
   |                      |                      |   | Images Ready  |
   |                      |                      |<--+               |
   |                      |                      |                   |
   |                      |<---------------------|                   |
   |                      | Stream Complete      |                   |
   |                      |                      |                   |
   |                      | Process Results      |                   |
   |                      | Compile Metrics      |                   |
   |                      |                      |                   |
   |<---------------------|                      |                   |
   | JSON Response        |                      |                   |
   | - sessionId          |                      |                   |
   | - response           |                      |                   |
   | - sessionStats       |                      |                   |
   | - instrumentation    |                      |                   |
   | - images (URLs)      |                      |                   |
   |                      |                      |                   |
```

### Detailed Step-by-Step Flow

```
1. USER REQUEST
   POST /generate { "prompt": "Create ads for https://brand.com" }
                                        |
                                        v
2. SESSION INITIALIZATION
   - sessionManager.getOrCreateSession(campaignSessionId)
   - instrumentor = new SDKInstrumentor(campaignId)
                                        |
                                        v
3. ORCHESTRATOR RECEIVES PROMPT
   - Parses request: extracts URL (required)
   - Extracts style preference (optional)
                                        |
                                        v
4. STEP 1: RESEARCH (STRATEGIST)
   strategist
   |
   +-- WebFetch homepage
   +-- Extract structured data:
   |   - THE OFFER (products, prices)
   |   - VALUE PROPS (differentiators)
   |   - PROOF POINTS (stats, reviews)
   |   - VISUAL IDENTITY (colors, typography)
   |   - BRAND VOICE (tone)
   |   - TESTIMONIALS (exact quotes)
   |
   +-- Write files/strategy/{brand}_research.md (~50-60 lines)
   |
   v (orchestrator waits for completion)
                                        |
                                        v
5. STEP 2: CREATIVE EXECUTION (CREATOR)
   creator
   |
   +-- Read files/strategy/{brand}_research.md
   +-- Skill: conversion-craft (load hook extraction system)
   +-- Build hook bank (15-20 potential hooks)
   +-- Select 6 diverse hooks (using diversity matrix)
   +-- Craft image prompts (natural language, style-matched)
   +-- MCP: nano-banana generate_ad_images (2 calls for 6 images)
   +-- Deliver 6 concepts with images
                                        |
                                        v
6. RESPONSE ASSEMBLY
   {
     success: true,
     sessionId: "campaign-123",
     response: { summary, fullResponse, structuredData },
     sessionStats: { turnCount, messageCount },
     performance: { duration, messageCount },
     instrumentation: { totalCost, totalTokens, timeline },
     images: { storageLocation, viewUrl, listUrl }
   }
```

### File-Based Agent Communication

```
+-------------------+     saves      +---------------------------+
| STRATEGIST        | ------------> | files/strategy/           |
|                   |                | {brand}_research.md       |
| Tools:            |                |                           |
| - WebFetch        |                | Sections:                 |
| - Read            |                | - THE OFFER               |
| - Write           |                | - VALUE PROPS             |
+-------------------+                | - PROOF POINTS            |
                                     | - VISUAL IDENTITY         |
                                     | - BRAND VOICE             |
                                     | - TESTIMONIALS            |
                                     | - MESSAGING               |
                                     +-------------+-------------+
                                                   |
                                                   | reads
                                                   v
+-------------------+                +---------------------------+
| CREATOR           | <------------- | (mines hooks from data)   |
|                   |                +---------------------------+
| Tools:            |
| - Read            |
| - Write           |     generates
| - Skill           | ------------> +---------------------------+
| - MCP Image Gen   |               | generated-images/         |
|                   |               | {sessionId}/*.png         |
| Loads:            |               |                           |
| conversion-craft  |               | 6 images (2 batches of 3) |
| skill             |               +---------------------------+
+-------------------+
```

---

## File Structure

```
creative_agent/
|
+-- agent/                               # Agent ecosystem
|   +-- .claude/
|   |   +-- agents/                      # Agent definitions
|   |   |   +-- strategist.md            # Data extraction agent
|   |   |   +-- creator.md               # Hook-first ad creator
|   |   |
|   |   +-- skills/                      # Skill definitions
|   |       +-- conversion-craft/
|   |           +-- SKILL.md             # Hook extraction & copywriting framework
|   |
|   +-- files/                           # Agent working directory
|       +-- strategy/
|       |   +-- {brand}_research.md      # Research output (strategist)
|       +-- creatives/
|           +-- {brand}_ads.md           # Campaign brief (creator)
|
+-- server/                              # Express server
|   +-- sdk-server.ts                    # Main server file
|   +-- lib/
|   |   +-- ai-client.ts                 # Claude SDK wrapper
|   |   +-- orchestrator-prompt.ts       # System prompt for main agent
|   |   +-- session-manager.ts           # Session lifecycle management
|   |   +-- instrumentor.ts              # Metrics tracking
|   |   +-- nano-banana-mcp.ts           # Gemini 3 Pro image generation MCP
|   +-- sessions/                        # Session persistence (auto-generated)
|   +-- package.json
|   +-- tsconfig.json
|
+-- generated-images/                    # Image output (auto-generated, git-ignored)
|   +-- {sessionId}/
|       +-- {timestamp}_{index}_{prompt}.png
|
+-- .env                                 # Environment variables
+-- ARCHITECTURE.md                      # This file
```

---

## API Endpoints

### POST /generate - Main Campaign Generation

**Purpose**: Generate complete ad campaign from natural language prompt

**Request**:
```json
{
  "prompt": "Create memes for https://brand.com targeting millennials",
  "sessionId": "optional-resume-session"
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "campaign-1234567890",
  "prompt": "...",
  "generatedAt": "2025-11-26T...",
  "response": {
    "summary": "Final assistant message",
    "fullResponse": "All assistant messages joined",
    "structuredData": null
  },
  "sessionStats": {
    "messageCount": 45,
    "turnCount": 8
  },
  "performance": {
    "duration": "180000ms",
    "messageCount": 45
  },
  "instrumentation": {
    "campaignMetrics": { "totalCost_usd": 0.2847, ... },
    "costBreakdown": { ... },
    "timeline": [ ... ],
    "summary": { "totalCost": "$0.2847", "totalTokens": 124567, ... }
  },
  "images": {
    "storageLocation": "generated-images/campaign-1234567890/",
    "viewUrl": "http://localhost:3001/images/campaign-1234567890",
    "listUrl": "http://localhost:3001/images"
  }
}
```

### GET /images - List Generated Images

**Response**:
```json
{
  "success": true,
  "totalImages": 15,
  "totalSessions": 3,
  "imagesBySession": {
    "campaign-abc123": [
      "http://localhost:3001/images/campaign-abc123/1760327650986_1_meme_text.png"
    ]
  }
}
```

### GET /health - Health Check

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-26T10:00:00Z",
  "config": {
    "hasAnthropicKey": true,
    "hasGeminiKey": true,
    "port": 3001
  }
}
```

---

## Session Management

### Session Lifecycle

```
1. CREATION
   POST /generate (no sessionId)
   -> sessionManager.getOrCreateSession() -> new session_abc123
   -> Status: 'active', messages: [], turnCount: 0

2. SDK INITIALIZATION
   -> SDK returns: {type: 'system', subtype: 'init', session_id: 'sdk-xyz789'}
   -> sessionManager.updateSdkSessionId('session_abc123', 'sdk-xyz789')

3. MESSAGE ACCUMULATION
   -> Each SDK message -> sessionManager.addMessage()
   -> Auto-save every 10 messages to ./sessions/session_abc123.json

4. SESSION RESUMPTION (Optional)
   POST /sessions/session_abc123/continue
   -> sessionManager.getResumeOptions() -> {resume: 'sdk-xyz789'}
   -> SDK continues conversation with full context

5. SESSION FORKING (Optional)
   POST /sessions/session_abc123/fork
   -> Create new session with metadata.forkedFrom = 'session_abc123'
   -> SDK creates branch from sdk-xyz789

6. COMPLETION
   -> sessionManager.completeSession()
   -> Status: 'completed', final save to disk

7. CLEANUP (Automatic)
   -> Every 1 hour: delete sessions older than 24 hours
```

---

## Instrumentation & Observability

### Message Processing

The instrumentor tracks every SDK message:

```typescript
switch (message.type) {
  case 'system':
    // Track init, tool calls
    if (message.subtype === 'init') {
      this.logEvent('INIT', { sessionId: message.session_id });
    }
    if (message.tool_name) {
      this.toolCalls.push({ tool: message.tool_name, timestamp: Date.now() });
    }
    break;
  case 'assistant':
    // Track usage tokens from each turn
    if (message.usage) {
      this.logEvent('USAGE', {
        tokens: {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
          cache_read: message.usage.cache_read_input_tokens,
          cache_write: message.usage.cache_creation_input_tokens
        }
      });
    }
    break;
  case 'result':
    // Capture final cost (authoritative from SDK)
    if (message.subtype === 'success') {
      this.totalCost = message.total_cost_usd || 0;
    }
    break;
}
```

---

## Technology Stack

### Runtime
- **Node.js**: v20+
- **TypeScript**: v5.3+
- **tsx**: v4.7+ (TypeScript execution)

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| @anthropic-ai/claude-agent-sdk | ^0.1.1 | Claude SDK for agent orchestration |
| @google/genai | ^1.24.0 | Gemini 2.5 Flash Image API |
| express | ^4.18.2 | HTTP server |
| cors | ^2.8.5 | Cross-origin requests |
| dotenv | ^16.3.1 | Environment variables |
| zod | ^3.22.4 | Runtime type validation |

---

## Deployment

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Required for Image Generation (MCP)
GEMINI_API_KEY=AIzaSy...

# Optional
PORT=3001
CLAUDE_CODE_MAX_OUTPUT_TOKENS=16384  # For large campaign responses
```

### Starting the Server

```bash
# Development (with hot reload)
cd server
npm run dev

# Production
cd server
npm start
```

### Server Startup Output

```
╔══════════════════════════════════════════════╗
║     Creative Ad Agent Server Running         ║
╠══════════════════════════════════════════════╣
║  Server: http://localhost:3001               ║
║                                              ║
║  Core Endpoints:                             ║
║  POST /test - Test query with sessions       ║
║  POST /generate - Natural language prompt    ║
║  GET /health - Health check                  ║
║                                              ║
║  Features Enabled:                           ║
║  ✅ Natural Language Prompt Interface        ║
║  ✅ Automatic Workflow Orchestration         ║
║  ✅ Session Management & Forking             ║
║  ✅ MCP Tools (nano_banana for images)       ║
║  ✅ Multi-Agent System (2 specialists)       ║
║  ✅ Skills System (1 creative skill)         ║
║  ✅ Real-time Cost Tracking                  ║
╚══════════════════════════════════════════════╝
```

---

## Design Decisions

### 1. Why Strategist + Creator (Not Researcher)?

**Decision**: Renamed "researcher" to "strategist" to emphasize data extraction vs. analysis

**Rationale**:
- **Clear separation**: Strategist extracts FACTS, Creator makes CREATIVE decisions
- **No overlap**: Strategist never recommends, never interprets
- **Quality input**: Specific numbers and quotes fuel better hooks
- **Auditable**: Research file is verifiable against source

### 2. Why Hook-First Methodology?

**Decision**: Build hooks BEFORE visuals, not after

**Rationale**:
- **Hooks stop the scroll**: The hook is the ad; visuals support it
- **Data-driven**: Hooks mined from research ensure specificity
- **Testable diversity**: 6 different hook types = 6 emotional triggers tested
- **Competitor-proof**: Specific hooks can't be copied

### 3. Why 6 Concepts with Diversity Matrix?

**Decision**: Require 6 concepts covering different hook types (not variations of one)

**Rationale**:
- **Test different emotions**: Stat vs Story vs FOMO vs Curiosity all perform differently
- **Avoid echo chamber**: Without matrix, all concepts might use same hook type
- **Optimization data**: Learn which emotional trigger resonates with audience
- **Coverage**: Hit different segments (logical buyers, emotional buyers, FOMO-susceptible)

### 4. Why Conversion-Craft Skill (vs Embedded)?

**Decision**: Hook extraction system as loadable skill, not embedded in agent

**Rationale**:
- **Modularity**: Can update hook formulas without changing agent
- **Explicit loading**: Creator knows when methodology is active
- **Extensibility**: Could add more skills (e.g., meme-craft, B2B-craft)
- **Debugging**: Can verify skill was loaded in execution trace

### 5. Why File-Based Agent Communication?

**Decision**: Agents communicate through files in `agent/files/`

**Rationale**:
- **Decoupling**: Agents don't need to know about each other directly
- **Persistence**: Research artifacts preserved for debugging
- **Named outputs**: `{brand}_research.md` is clear and reusable
- **Auditable**: Can review what each agent produced

### 6. Why Synchronous MCP?

**Decision**: Simple synchronous pattern for image generation

**Rationale**:
- **Reliability**: No polling, no job queues, no timeouts
- **Simplicity**: Direct request-response model
- **Graceful degradation**: Continues with remaining images if one fails
- **Debuggability**: Easy to trace issues in linear flow

---

## Key Metrics

### Performance Benchmarks

| Metric | Typical |
|--------|---------|
| Total Campaign Generation | 2-5 minutes |
| Step 1 (Research - Standard) | 1-2 minutes |
| Step 1 (Research - Extended) | 2-3 minutes |
| Step 2 (Creative Execution) | 1-2 minutes |
| Image Generation (per image) | ~10 seconds |
| Session Creation | ~50ms |

### Cost Benchmarks

| Operation | Estimated Cost |
|-----------|----------------|
| Full Campaign (5 images) | $0.10-$0.25 |
| Research Phase (Standard) | $0.02-$0.05 |
| Research Phase (Extended) | $0.04-$0.08 |
| Creative Phase + Images | $0.06-$0.12 |

*Costs vary based on research depth and number of images*

---

## Troubleshooting

### Common Issues

#### "Agent not found"
```bash
# Verify agent files exist
ls agent/.claude/agents/

# Check cwd in ai-client.ts points to agent/ directory
```

#### "Skill not found"
```bash
# Verify skill files exist
ls agent/.claude/skills/*/SKILL.md

# Ensure settingSources includes 'project'
```

#### "Tool permission stream closed"
```bash
# MCP tools need persistent generator
# Verify AbortController pattern in ai-client.ts
```

#### "GEMINI_API_KEY not configured"
```bash
# Add to .env file
GEMINI_API_KEY=your_key_here

# Verify via health check
curl http://localhost:3001/health
```

---

## Conclusion

This architecture provides a streamlined foundation for AI-powered ad generation:

- **Hook-First Methodology**: Hooks are mined from research data, not invented
- **2-Agent Workflow**: Strategist (facts) → Creator (hooks + images)
- **Conversion-Craft Skill**: 7 hook formulas, diversity matrix, copywriting frameworks
- **6 Diverse Concepts**: Each concept tests a different emotional trigger
- **File-Based Communication**: Clear handoffs with named research files
- **Observability**: Complete tracking of costs, performance, and agent behavior
- **Production-Ready**: MCP image generation, session persistence, error handling

The system orchestrates 2 specialized agents with 1 consultable skill to generate 6 conversion-focused ad concepts with AI-generated images.

---

**Last Updated**: December 2025
**Version**: 4.0 - Hook-First Conversion Ad Generator
**Maintained By**: Creative Agent Team

## Recent Changes (v4.0)

- Renamed **researcher → strategist** (emphasizes data extraction, not analysis)
- Introduced **hook-first methodology**: Build 15-20 hooks, select 6 diverse ones
- New **conversion-craft skill** with hook extraction system and 7 formulas
- **Hook diversity matrix**: 6 concepts MUST use different hook types
- File paths: `files/strategy/{brand}_research.md`, `files/creatives/{brand}_ads.md`
- Output standardized to **6 ad concepts** (one per hook type)
- MCP upgraded to **Gemini 3 Pro Image Preview**
- Added **style detection** (illustration, meme, cinematic, minimal, bold)
- Creator follows **9-step workflow** with explicit skill loading
