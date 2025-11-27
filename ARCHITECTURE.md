# Creative Ad Agent - System Architecture

**Version:** 3.0
**Last Updated:** November 2025
**Status:** Production (Dual-Mode Ad Generator with MCP Image Generation)

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
An AI-powered creative advertising agent that generates professional conversion ads or viral meme ads for brands. The system analyzes brand websites, extracts customer language, and creates ready-to-post ad images using Gemini AI image generation.

### Key Features
- **Dual-Mode Ad Generation**: Conversion ads (default) or meme ads (on request)
- **2-Agent Orchestration**: Coordinates researcher and creator agents sequentially
- **Adaptive Research**: Standard mode (4 searches) or Extended mode (7 searches) based on ad type
- **Skills System**: On-demand viral-meme skill for entertainment-first content
- **MCP Image Generation**: Nano-banana MCP server generates images using Gemini 2.5 Flash
- **Session Management**: Stateful conversation handling with forking capabilities
- **Real-time Instrumentation**: Complete observability of SDK operations, costs, and performance

### Performance Targets
- **Total Generation Time**: 2-5 minutes (depends on research depth)
- **Sequential Workflow**: 2 agents executed in order (researcher → creator)
- **Image Generation**: Up to 3 images per MCP call (~10 seconds each)
- **Output**: 5 ready-to-post ad images + comprehensive campaign brief

---

## High-Level Architecture

```
+--------------------------------------------------------------------------------+
|                              CLIENT LAYER                                       |
|                         (HTTP REST API Consumers)                               |
+---------------------------------------+----------------------------------------+
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                            EXPRESS SERVER                                       |
|                          (server/sdk-server.ts)                                 |
|  +-------------+------------------+----------------+------------------+         |
|  | POST        | POST             | GET            | GET              |         |
|  | /generate   | /test            | /sessions      | /images          |         |
|  | (campaign)  | (SDK test)       | (management)   | (serve images)   |         |
|  +-------------+------------------+----------------+------------------+         |
+---------------------------------------+----------------------------------------+
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                           CORE LIBRARIES                                        |
|  +------------------+------------------+---------------------+                  |
|  |   AIClient       | SessionManager   |  SDKInstrumentor    |                  |
|  | (ai-client.ts)   | (session-mgr.ts) | (instrumentor.ts)   |                  |
|  +--------+---------+--------+---------+---------+-----------+                  |
|           |                  |                   |                              |
|           v                  v                   v                              |
|  +------------------+  +------------------+  +------------------+               |
|  | Claude SDK       |  | File Storage     |  | Event Stream     |               |
|  | @anthropic-ai    |  | ./sessions/      |  | Processing       |               |
|  +--------+---------+  +------------------+  +------------------+               |
|           |                                                                     |
+-----------|---------------------------------------------------------------------+
            |
            v
+--------------------------------------------------------------------------------+
|                        AGENT ECOSYSTEM                                          |
|                   (agent/.claude/agents/)                                       |
|                                                                                 |
|  +------------------------------------------------------------------------+    |
|  |                   ORCHESTRATOR (Main Agent)                             |    |
|  |            (Coordinates SEQUENTIAL workflow via Task tool)              |    |
|  |                   System Prompt: orchestrator-prompt.ts                 |    |
|  +-----------------------------------+------------------------------------+    |
|                                      |                                          |
|            STEP 1                    |         STEP 2                          |
|            +----------+              |         +----------+                    |
|            v                         |         v                               |
|  +---------------------------+       |  +---------------------------+          |
|  | researcher                |       |  | creator                   |          |
|  |                           |       |  |                           |          |
|  | MODE DETECTION:           |       |  | MODE DETECTION:           |          |
|  | - STANDARD: 4 searches    |       |  | - CONVERSION: Embedded    |          |
|  |   (for conversion ads)    |       |  |   framework (default)     |          |
|  | - EXTENDED: 7 searches    |       |  | - MEME: Loads viral-meme  |          |
|  |   (for meme/viral ads)    |       |  |   skill via Skill tool    |          |
|  |                           |       |  |                           |          |
|  | Tools: WebSearch,         |       |  | Tools: Read, Write, Skill,|          |
|  |        WebFetch,          |       |  |   mcp__nano-banana__      |          |
|  |        Read, Write        |       |  |   generate_ad_images      |          |
|  +-------------+-------------+       |  +-------------+-------------+          |
|                |                     |                |                         |
|                v                     |                v                         |
|  +---------------------------+       |  +---------------------------+          |
|  | files/research/           |       |  | files/final_output/       |          |
|  | {brand}_brand_profile.txt |------>|  | {brand}_campaign_brief.txt|          |
|  |                           |       |  | + PNG images              |          |
|  +---------------------------+       |  +---------------------------+          |
+--------------------------------------------------------------------------------+
                                        |
                                        v
+--------------------------------------------------------------------------------+
|                         MCP SERVER                                              |
|                    (nano-banana-mcp.ts)                                         |
|  +------------------------------------------------------------------------+    |
|  | mcp__nano-banana__generate_ad_images                                    |    |
|  |   - Uses Gemini 2.5 Flash Image API                                    |    |
|  |   - Generates up to 3 images per call                                  |    |
|  |   - Saves PNG files to generated-images/{sessionId}/                   |    |
|  |   - Returns image URLs for inclusion in campaign brief                 |    |
|  +------------------------------------------------------------------------+    |
+--------------------------------------------------------------------------------+
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

### Agent Hierarchy & Dual-Mode Workflow

```
ORCHESTRATOR (Main Agent)
    |
    +-- Parses request, detects mode (CONVERSION or MEME)
    |
    +-- STEP 1: Research
    |   |
    |   +-- researcher
    |       Tools: WebSearch, WebFetch, Read, Write
    |
    |       MODE DETECTION (from task context):
    |       - STANDARD MODE (default): 4 WebSearches
    |         → Customer voice, pain points, category context, competition
    |       - EXTENDED MODE (meme keywords): 7 WebSearches
    |         → Standard + meme culture, viral patterns, emotional triggers
    |
    |       Output: files/research/{brand}_brand_profile.txt
    |       (~150 lines standard, ~220 lines extended)
    |
    +-- STEP 2: Creation (after Step 1 completes)
        |
        +-- creator
            Tools: Read, Write, Skill, mcp__nano-banana__generate_ad_images

            MODE DETECTION (from task context):
            - CONVERSION MODE (default): Uses embedded framework
              → Professional ads with clear value props and CTAs
            - MEME MODE (keywords detected): Loads viral-meme skill
              → Entertainment-first, 70/30 rule, 11pm test

            Output:
            - files/final_output/{brand}_campaign_brief.txt
            - 5 PNG ad images
```

### Agent Definitions

#### 1. researcher (`agent/.claude/agents/researcher.md`)

**Purpose**: Adaptive brand intelligence researcher that extracts brand identity, customer voice, and cultural context

**Tools**: WebSearch, WebFetch, Read, Write

**Mode Detection**:
- Checks task context for meme/viral/humor keywords
- STANDARD: 4 searches, ~150 lines output
- EXTENDED: 7 searches, ~220 lines output (includes cultural landscape, psychology, humor patterns)

**Research Workflow**:
1. Extract brand name from URL for file naming
2. WebFetch homepage with brand intelligence prompt
3. WebFetch additional pages if needed (About, Products)
4. WebSearches (STANDARD MODE - 4 searches):
   - Customer voice (Reddit, reviews)
   - Audience pain points
   - Category context
   - Competitive landscape
5. Extended WebSearches (EXTENDED MODE ONLY - 3 more):
   - Audience meme culture
   - Viral content patterns
   - Emotional triggers
6. Synthesize and write to `files/research/{brand}_brand_profile.txt`

**Output Sections**:
1. Business Overview (offerings, value prop, differentiator)
2. Visual Identity (colors, typography, aesthetic)
3. Target Audience (demographics, psychographics, emotional state)
4. Pain Points & Customer Language (with exact phrases)
5. Competitive Context
6. Brand Voice & Tone (including humor tolerance)
7. Cultural Landscape (EXTENDED only)
8. Psychological Triggers (EXTENDED only)
9. Humor Patterns (EXTENDED only)
10. White Space & Opportunities (EXTENDED only)
11. Anti-Patterns (EXTENDED only)

#### 2. creator (`agent/.claude/agents/creator.md`)

**Purpose**: Ad creative generator that transforms brand research into conversion ads (default) or meme ads (when requested)

**Tools**: Read, Write, Skill, mcp__nano-banana__generate_ad_images

**Workflow**:
1. Read research file (`files/research/{brand}_brand_profile.txt`)
2. Determine ad type from task keywords
3. **If meme keywords found**: Load `viral-meme` skill using Skill tool
4. **If no meme keywords**: Use embedded conversion framework
5. Create 5 ad concepts with copy and visual direction
6. Generate images using `mcp__nano-banana__generate_ad_images`
7. Write campaign brief to `files/final_output/{brand}_campaign_brief.txt`

**Embedded Conversion Framework**:
- Headline templates (Pain Point, Benefit, Question, Social Proof)
- Body copy guidelines (1-2 sentences, customer language, no jargon)
- CTAs matched to funnel stage
- Emotional targets (Relief, Aspiration, FOMO, Simplicity)

**Image Prompting Techniques** (embedded):
- Golden rule: "white text with thick black outline"
- Platform dimensions (1:1, 4:5, 9:16, 16:9)
- Visual styles (professional, lifestyle, minimal, meme)
- Text placement (top/bottom/center/split)
- Brand integration (colors, subtle logo watermark)

---

## Skills System

Skills provide specialized guidance that agents consult during their workflow. Defined in `agent/.claude/skills/` and invoked using the `Skill` tool.

### viral-meme (`agent/.claude/skills/viral-meme/SKILL.md`)

**Purpose**: Transform brand research into viral meme concepts for entertainment-first content

**When to Use**: User requests memes, viral content, funny ads, or humor-based marketing

**Key Frameworks**:

**The Golden Rule**: 70% entertainment, 30% brand (at most)

**Hard Constraints**:
| Never Do | Why |
|----------|-----|
| Copy existing meme formats | Templates scream "marketing team" |
| Use marketing language | Only words customers actually say |
| Make brand the hero | Customer's struggle is the hero |
| Explain the joke | If it needs explanation, it's dead |

**Emotional Targets** (pick ONE per concept):
| Target | Feeling | Signs Working |
|--------|---------|---------------|
| Catharsis | "Finally someone said it" | Tagging friends, "THIS" |
| Validation | "This is SO me" | Screenshots, identity expression |
| Surprise | "Wait, what?" | Comments, debates |
| Belonging | "My people get this" | Niche community spread |
| Hope | "Maybe there's a way" | Saves, encouragement shares |

**Humor Patterns**:
| Pattern | Energy | Best For |
|---------|--------|----------|
| Self-deprecating | "I'm a mess but funny" | Shared struggles |
| Observational | "Why is this SO true?" | Universal moments |
| Absurdist | "Makes no sense but YES" | Breaking patterns |
| Wholesome | "I needed this today" | Genuine support |
| Dark/Gallows | "At least we can laugh" | Heavy topics, solidarity |

**The 11pm Test**: "Would I send this to a friend at 11pm with no context?"

**Visual Philosophy**:
- Cognitive load: One focal point, one joke
- Authenticity: Intentional lo-fi > corporate polish
- Lo-Fi Spectrum: Screenshots → iPhone photo → Designed → Studio

---

## Data Flow

### Complete Campaign Generation Flow

```
1. USER REQUEST
   POST /generate { "prompt": "Create memes for https://brand.com targeting millennials" }
                                        |
                                        v
2. SESSION INITIALIZATION
   - sessionManager.getOrCreateSession(campaignSessionId)
   - instrumentor = new SDKInstrumentor(campaignId)
                                        |
                                        v
3. ORCHESTRATOR RECEIVES PROMPT
   - Parses request: extracts URL, detects mode (MEME detected)
   - Notes context: "targeting millennials"
                                        |
                                        v
4. STEP 1: RESEARCH (EXTENDED MODE)
   researcher
   |
   +-- WebFetch homepage
   +-- WebFetch about/products (if needed)
   +-- WebSearch: customer voice (Reddit, reviews)
   +-- WebSearch: audience pain points
   +-- WebSearch: category context
   +-- WebSearch: competitive landscape
   +-- WebSearch: audience meme culture (EXTENDED)
   +-- WebSearch: viral content patterns (EXTENDED)
   +-- WebSearch: emotional triggers (EXTENDED)
   +-- Write brand_brand_profile.txt (~220 lines)
   |
   v (orchestrator waits for completion)
                                        |
                                        v
5. ORCHESTRATOR READS RESEARCH
   - Reads brand_profile.txt for own context
   - Extracts brand name and business type
   - Prepares to spawn creator with mode info
                                        |
                                        v
6. STEP 2: CREATIVE EXECUTION (MEME MODE)
   creator
   |
   +-- Skill: viral-meme (load framework FIRST)
   +-- Read brand_brand_profile.txt
   +-- Apply 70/30 rule, emotional targets, humor patterns
   +-- Create 5 meme concepts using 11pm test
   +-- MCP: nano-banana generate_ad_images (1-2 calls for 5 images)
   +-- Write campaign_brief.txt
                                        |
                                        v
7. RESPONSE ASSEMBLY
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
| researcher        | ------------> | {brand}_brand_profile.txt |
|                   |                | - Business Overview       |
| (4-7 searches     |                | - Visual Identity         |
|  based on mode)   |                | - Target Audience         |
+-------------------+                | - Pain Points             |
                                     | - Brand Voice             |
                                     | (Extended: +5 sections)   |
                                     +-------------+-------------+
                                                   |
                                                   | reads
                                                   v
+-------------------+                +---------------------------+
| creator           | <------------- | (applies mode framework)  |
|                   |                +---------------------------+
| CONVERSION:       |
| Uses embedded     |     saves
| framework         | ------------> +---------------------------+
|                   |               | files/final_output/       |
| MEME:             |               | - {brand}_campaign_brief  |
| Loads viral-meme  |               | - 5 PNG ad images         |
| skill first       |               +---------------------------+
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
|   |   |   +-- researcher.md            # Adaptive brand researcher
|   |   |   +-- creator.md               # Dual-mode ad creator
|   |   |
|   |   +-- skills/                      # Skill definitions
|   |       +-- viral-meme/
|   |           +-- SKILL.md             # Meme creation methodology
|   |
|   +-- files/                           # Agent working directory
|       +-- research/
|       |   +-- {brand}_brand_profile.txt  # Research output
|       +-- final_output/
|           +-- {brand}_campaign_brief.txt # Campaign document
|           +-- *.png                      # Generated ad images
|
+-- server/                              # Express server
|   +-- sdk-server.ts                    # Main server file
|   +-- lib/
|   |   +-- ai-client.ts                 # Claude SDK wrapper
|   |   +-- orchestrator-prompt.ts       # System prompt for main agent
|   |   +-- session-manager.ts           # Session lifecycle management
|   |   +-- instrumentor.ts              # Metrics tracking
|   |   +-- nano-banana-mcp.ts           # Gemini image generation MCP
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

### 1. Why 2 Agents (Not 3)?

**Decision**: Consolidated from 3 agents (brand-researcher, culture-researcher, creative-director) to 2 agents (researcher, creator)

**Rationale**:
- **Mode-based flexibility**: Single researcher adapts depth based on ad type
- **Reduced overhead**: Fewer agent handoffs means faster execution
- **Simpler orchestration**: Two-step workflow is easier to coordinate
- **Context preservation**: All research in one file, no synthesis needed

### 2. Why Adaptive Research Modes?

**Decision**: Researcher runs in STANDARD (4 searches) or EXTENDED (7 searches) mode

**Rationale**:
- **Conversion ads don't need cultural deep-dives**: Standard mode is faster and cheaper
- **Meme ads require cultural context**: Extended mode adds meme culture, viral patterns, emotional triggers
- **Cost efficiency**: Don't pay for research you won't use
- **Quality focus**: Right depth for the right output

### 3. Why Embedded Conversion Framework?

**Decision**: Creator has conversion framework embedded, only loads skill for memes

**Rationale**:
- **Conversion is default**: Most requests are for professional ads
- **Skill loading has overhead**: Avoid unnecessary skill invocation
- **Separation of concerns**: Meme skill is specialized knowledge
- **Faster execution**: Embedded framework is always available

### 4. Why File-Based Agent Communication?

**Decision**: Agents communicate through files in `agent/files/`

**Rationale**:
- **Decoupling**: Agents don't need to know about each other directly
- **Persistence**: Research artifacts are preserved for debugging
- **Named outputs**: `{brand}_brand_profile.txt` is clear and reusable
- **Auditable**: Can review what each agent produced

### 5. Why Synchronous MCP (v3.0.0)?

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

- **Dual-Mode System**: Conversion (default) or Meme (on request) with appropriate depth
- **2-Agent Workflow**: Researcher → Creator with mode-based adaptation
- **On-Demand Skills**: Viral-meme skill loaded only when needed
- **File-Based Communication**: Clear handoffs with named research files
- **Observability**: Complete tracking of costs, performance, and agent behavior
- **Production-Ready**: MCP image generation, session persistence, error handling

The system orchestrates 2 specialized agents with 1 consultable skill to generate 5 ready-to-post ad images with comprehensive campaign briefs.

---

**Last Updated**: November 2025
**Version**: 3.0 - Dual-Mode Ad Generator (Conversion + Meme)
**Maintained By**: Creative Agent Team

## Recent Changes (v3.0)

- Consolidated from 3 agents to **2 agents** (researcher, creator)
- Introduced **mode-based research**: STANDARD (4 searches) vs EXTENDED (7 searches)
- **Embedded conversion framework** in creator agent (no skill needed for default mode)
- Single **viral-meme skill** loaded on demand for meme content
- Simplified file naming: `{brand}_brand_profile.txt`, `{brand}_campaign_brief.txt`
- Removed separate cultural intelligence file (merged into brand profile extended sections)
- Updated orchestrator to be more conversational and insightful
- MCP server upgraded to v3.0.0 (simple synchronous pattern)
- Output standardized to **5 ad images** per campaign
