# Creative Ad Agent - System Architecture

**Version:** 1.1
**Last Updated:** January 2025
**Status:** Production (with MCP Image Generation)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Session Management](#session-management)
6. [API Endpoints](#api-endpoints)
7. [Agent System](#agent-system)
8. [Instrumentation & Observability](#instrumentation--observability)
9. [Technology Stack](#technology-stack)
10. [Deployment](#deployment)

---

## System Overview

### Purpose
An AI-powered creative advertising agent that generates 10 high-quality, strategically-aligned ad creatives for Meta and Instagram by analyzing brand websites, identifying customer pain points, and researching competitor strategies.

### Key Features
- **Multi-Agent Orchestration**: Coordinates 5 specialized AI agents in parallel workflows
- **Session Management**: Stateful conversation handling with forking capabilities
- **Real-time Instrumentation**: Complete observability of SDK operations, costs, and performance
- **Platform Optimization**: Native optimization for Meta/Instagram specifications

### Performance Targets
- **Total Generation Time**: < 5 minutes
- **Parallel Research**: 3 concurrent agents
- **Session Persistence**: 24-hour active sessions
- **Cost Tracking**: Real-time USD cost tracking per campaign

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
│                     (HTTP REST API Consumers)                           │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER                                   │
│                      (sdk-server.ts)                                    │
│  ┌─────────────┬──────────────────┬──────────────┬──────────────────┐  │
│  │ /generate   │ /test            │ /sessions    │ /health          │  │
│  │ (campaign)  │ (sdk query test) │ (mgmt)       │ (health check)   │  │
│  └─────────────┴──────────────────┴──────────────┴──────────────────┘  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      CORE LIBRARIES                                     │
│  ┌──────────────────┬──────────────────┬──────────────────────────┐    │
│  │   AIClient       │ SessionManager   │  SDKInstrumentor         │    │
│  │ (ai-client.ts)   │(session-mgr.ts)  │ (instrumentor.ts)        │    │
│  └────────┬─────────┴────────┬─────────┴─────────┬────────────────┘    │
│           │                  │                   │                      │
└───────────┼──────────────────┼───────────────────┼──────────────────────┘
            │                  │                   │
            ↓                  ↓                   ↓
    ┌───────────────┐  ┌────────────────┐  ┌──────────────┐
    │ Claude SDK    │  │ File Storage   │  │ Event Stream │
    │ @anthropic-ai │  │ ./sessions/    │  │ Processing   │
    └───────┬───────┘  └────────────────┘  └──────────────┘
            │
            ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      AGENT ECOSYSTEM                                    │
│                      (.claude/agents/)                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   MAIN CREATIVE DIRECTOR                         │  │
│  │            (Orchestrates entire campaign workflow)               │  │
│  └────────────────────────┬─────────────────────────────────────────┘  │
│                           │                                             │
│         ┌─────────────────┼─────────────────┐                          │
│         │                 │                 │                          │
│         ↓                 ↓                 ↓                          │
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────────┐             │
│  │ Brand Intel  │  │ Customer    │  │ Competitive       │             │
│  │ Analyst      │  │ Psychology  │  │ Intelligence      │             │
│  └──────────────┘  └─────────────┘  └───────────────────┘             │
│         │                 │                 │                          │
│         └─────────────────┼─────────────────┘                          │
│                           ↓                                             │
│                  ┌─────────────────┐                                    │
│                  │  Copy Creator   │                                    │
│                  └─────────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Express Server (`server/sdk-server.ts`)

**Responsibilities**:
- HTTP API endpoint handling
- Request validation and routing
- Response formatting and error handling
- CORS and middleware configuration

**Key Endpoints**:
- `POST /generate` - Main campaign generation
- `POST /test` - SDK query testing with session management
- `GET /sessions` - List all active sessions
- `GET /sessions/:id` - Get specific session stats
- `POST /sessions/:id/continue` - Resume existing session
- `POST /sessions/:id/fork` - Create session variant
- `GET /sessions/:id/family` - Get session family tree
- `GET /images` - List all generated images by session
- `GET /images/:sessionId/:filename` - Serve specific generated image
- `GET /health` - Health check with config status

**Dependencies**:
- Express.js for HTTP server
- CORS for cross-origin requests
- dotenv for environment configuration
- AIClient for SDK interaction
- SessionManager for state management
- SDKInstrumentor for metrics tracking

---

### 2. AIClient (`server/lib/ai-client.ts`)

**Purpose**: Wrapper around Claude SDK with session-aware query capabilities

**Key Methods**:

```typescript
// Stream query to Claude SDK
async *queryStream(
  prompt: string,
  options?: Partial<Options>,
  attachments?: Array<{type: string; source: any}>
): AsyncGenerator<Message>

// Session-aware query with automatic management
async *queryWithSession(
  prompt: string,
  sessionId?: string,
  metadata?: any,
  attachments?: Array<{type: string; source: any}>
): AsyncGenerator<{message: Message, sessionId: string}>

// Fork session for A/B testing
async *queryWithSessionFork(
  prompt: string,
  baseSessionId: string,
  metadata?: any,
  attachments?: Array<{type: string; source: any}>
): AsyncGenerator<{message: Message, sessionId: string, baseSessionId: string, isFork: boolean}>
```

**Configuration**:
```typescript
{
  cwd: projectRoot,                    // Points to .claude/agents
  model: 'claude-sonnet-4-5-20250929', // Sonnet 4.5
  maxTurns: 30,                        // CRITICAL for tool usage
  settingSources: ['project'],         // Load project agents
  allowedTools: [                      // Explicit tool permissions (includes MCP)
    "Task", "Bash", "Read", "Write", "Edit", "Glob", "Grep",
    "WebFetch", "WebSearch", "TodoWrite",
    "mcp__nano-banana__generate_ad_images"  // ✅ MCP tool (accessible to all agents)
  ],
  systemPrompt: "...",                 // Custom creative agent prompt
  mcpServers: {
    "nano-banana": nanoBananaMcpServer  // ✅ Production: Gemini 2.5 Flash Image
  }
}
```

**Features**:
- **Persistent async generator pattern** with AbortController (REQUIRED for MCP servers)
- Generator lifecycle management for long-running tools (10+ seconds)
- Automatic SDK session ID capture from `system.init` messages
- Session resumption via `resume` option
- Session forking with `forkSession` flag
- Custom system prompt for creative specialization

**Generator Lifecycle Pattern**:
```typescript
// Each query uses AbortController for proper cleanup
const controller = new AbortController();
try {
  for await (const message of query({
    prompt: createPromptGenerator(text, attachments, controller.signal),
    options
  })) {
    // Process messages
  }
} finally {
  controller.abort();  // Clean shutdown
}
```

---

### 3. SessionManager (`server/lib/session-manager.ts`)

**Purpose**: Manages SDK session lifecycle and persistence

**Data Model**:
```typescript
interface SessionInfo {
  id: string;                    // Our session ID
  sdkSessionId?: string;         // SDK's internal session ID
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: {
    url?: string;
    campaignName?: string;
    status: 'active' | 'completed' | 'error';
    messageCount: number;
    context?: any;
    // Fork-related
    forkedFrom?: string;         // Base session if this is a fork
    forkTimestamp?: string;
    forkPurpose?: string;        // Why this fork was created
  };
  messages: any[];               // Full message history
  turnCount: number;             // Number of assistant turns
}
```

**Key Methods**:
```typescript
createSession(metadata?)          // Create new session
getOrCreateSession(sessionId?)    // Get or create session
updateSdkSessionId(id, sdkId)    // Link SDK session ID
addMessage(sessionId, message)    // Add message to history
getResumeOptions(sessionId)       // Get resume config for SDK
saveSession(sessionId)            // Persist to disk
loadSession(sessionId)            // Load from disk
getSessionForks(baseSessionId)    // Get all forks
getSessionFamily(sessionId)       // Get base + all forks
```

**Persistence**:
- **Storage**: `./sessions/*.json` files
- **Auto-save**: Every 10 messages
- **Cleanup**: 24-hour max age, 1-hour inactivity for completed sessions
- **Format**: JSON with ISO date strings

**Session Forking**:
```
Base Session (session_abc123)
    ├── Fork 1 (session_xyz456) - Emotional angle variant
    ├── Fork 2 (session_def789) - Social proof variant
    └── Fork 3 (session_ghi012) - Problem-solution variant
```

---

### 4. SDKInstrumentor (`server/lib/instrumentor.ts`)

**Purpose**: Real-time instrumentation and metrics tracking

**Tracked Metrics**:
- **Events**: All SDK message types (system, assistant, user, result)
- **Tool Calls**: Every tool invocation with parameters
- **Agent Calls**: Subagent launches via Task tool
- **Costs**: SDK-provided USD costs (authoritative)
- **Timing**: Event timestamps and durations
- **Usage**: Token counts (input, output, cache read/write)

**Message Processing**:
```typescript
processMessage(message) {
  switch (message.type) {
    case 'system':
      // Track init, tool calls
    case 'assistant':
      // Track usage tokens from each turn
    case 'user':
      // Track tool results
    case 'result':
      // Capture final cost and duration
  }
}
```

**Output Reports**:
```typescript
{
  campaignId: string,
  totalCost_usd: number,           // From SDK result message
  totalDuration_ms: number,
  summary: {
    totalEvents: number,
    totalTools: number,
    totalAgents: number,
    totalTokens: number,
    avgResponseTime_ms: number
  },
  timeline: Event[]                // Chronological event log
}
```

**Key Insight**: SDK provides authoritative cost data in `result.success` messages - no manual calculation needed!

---

## Data Flow

### Complete Campaign Generation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: HTTP REQUEST                                                    │
└─────────────────────────────────────────────────────────────────────────┘
    POST /generate
    {
      url: "https://example.com",
      platform: "instagram",
      objective: "conversion",
      targetAudience: "..."
    }
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: SESSION INITIALIZATION                                          │
└─────────────────────────────────────────────────────────────────────────┘
    sessionManager.getOrCreateSession(campaignSessionId)
    instrumentor = new SDKInstrumentor(campaignId, url, platform)
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: ORCHESTRATION PROMPT CONSTRUCTION                               │
└─────────────────────────────────────────────────────────────────────────┘
    Build multi-phase prompt:
    - PHASE 1: Run 3 research agents IN PARALLEL
    - PHASE 2: Synthesize into 5 strategic angles
    - PHASE 3: Copy Creator generates 10 variations
    - PHASE 4: Return structured JSON
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: SDK EXECUTION (STREAMING)                                       │
└─────────────────────────────────────────────────────────────────────────┘
    for await (const result of aiClient.queryWithSession(prompt, sessionId)) {
      const { message } = result;

      // Process message through instrumentor
      instrumentor.processMessage(message);

      // Add to session history
      sessionManager.addMessage(sessionId, message);

      // Log progress
      if (message.type === 'assistant') {
        console.log('Progress:', message.content);
      }
    }
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: PARALLEL AGENT EXECUTION (Inside SDK)                           │
└─────────────────────────────────────────────────────────────────────────┘
    Main Agent receives prompt
         ↓
    Launches 3 agents in parallel:
         ├─→ brand-intelligence-analyst (WebFetch brand site)
         ├─→ customer-psychology-specialist (WebFetch + analysis)
         └─→ competitive-intelligence-specialist (WebSearch competitors)
         ↓
    Each returns structured JSON
         ↓
    Main Agent synthesizes research
         ↓
    Main Agent generates 5 strategic angles
         ↓
    Main Agent launches copy-creator agent
         ↓
    Copy Creator generates 10 copy variations using frameworks:
         - Problem-Solution → PAS
         - Social Proof → 4 Ps
         - Transformation → Before-After-Bridge
         - Product Hero → FAB
         - Emotional → AIDA
         ↓
    Main Agent structures final output as JSON
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: RESPONSE ASSEMBLY                                               │
└─────────────────────────────────────────────────────────────────────────┘
    Extract assistant messages
    Parse JSON structured data
    Get instrumentation report
    Get session stats
              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: HTTP RESPONSE                                                   │
└─────────────────────────────────────────────────────────────────────────┘
    {
      success: true,
      campaign: {
        url, platform, objective,
        summary: "...",
        structuredData: { /* 10 creatives */ }
      },
      sessionId: "campaign-...",
      sessionStats: { turnCount, messageCount, ... },
      performance: { duration, messageCount, phases },
      instrumentation: {
        campaignMetrics: { totalCost_usd, ... },
        costBreakdown: { ... },
        timeline: [ /* events */ ],
        summary: { totalCost, totalTokens, avgResponseTime, ... }
      }
    }
```

---

## Session Management

### Session Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       SESSION LIFECYCLE                                  │
└──────────────────────────────────────────────────────────────────────────┘

1. CREATION
   ├─ POST /generate OR POST /test (no sessionId)
   ├─ sessionManager.getOrCreateSession() → new session_abc123
   └─ Status: 'active', messages: [], turnCount: 0

2. SDK INITIALIZATION
   ├─ aiClient.queryWithSession(prompt, session_abc123)
   ├─ SDK returns: {type: 'system', subtype: 'init', session_id: 'sdk-xyz789'}
   └─ sessionManager.updateSdkSessionId('session_abc123', 'sdk-xyz789')

3. MESSAGE ACCUMULATION
   ├─ Each SDK message → sessionManager.addMessage()
   ├─ Auto-save every 10 messages to ./sessions/session_abc123.json
   └─ Update turnCount, lastAccessedAt

4. SESSION RESUMPTION
   ├─ POST /sessions/session_abc123/continue
   ├─ sessionManager.getResumeOptions() → {resume: 'sdk-xyz789'}
   └─ SDK continues conversation with full context

5. SESSION FORKING
   ├─ POST /sessions/session_abc123/fork
   ├─ Create new session_def456 with metadata.forkedFrom = 'session_abc123'
   ├─ aiClient.queryWithSessionFork(prompt, 'session_abc123')
   └─ SDK creates branch from sdk-xyz789 → new sdk-qrs345

6. COMPLETION
   ├─ sessionManager.completeSession()
   └─ Status: 'completed', final save to disk

7. CLEANUP
   ├─ Auto-cleanup every 1 hour
   ├─ Delete sessions older than 24 hours
   └─ Delete inactive completed sessions > 1 hour
```

### Session Fork Use Case

**Scenario**: A/B test different creative angles from same research

```
Base Campaign Session
├─ Research Phase (60s)
│  ├─ Brand Intelligence
│  ├─ Customer Psychology
│  └─ Competitive Analysis
│
└─ [FORK POINT] - Research complete, try 3 creative variants
    │
    ├─ Fork 1: "Emotional Angle"
    │  └─ Copy Creator → emotional framework
    │
    ├─ Fork 2: "Social Proof Angle"
    │  └─ Copy Creator → testimonial framework
    │
    └─ Fork 3: "Problem-Solution Angle"
       └─ Copy Creator → PAS framework
```

**Benefits**:
- Don't repeat expensive research phase
- Test multiple creative strategies in parallel
- Compare results across forks
- Original session unchanged (safe experimentation)

---

## API Endpoints

### Core Endpoints

#### `POST /generate` - Campaign Generation

**Purpose**: Generate complete ad campaign with 10 creatives

**Request**:
```json
{
  "url": "https://example.com",
  "platform": "instagram",
  "objective": "conversion",
  "targetAudience": "Small business owners",
  "sessionId": "optional-resume-session"
}
```

**Response**:
```json
{
  "success": true,
  "campaign": {
    "url": "https://example.com",
    "platform": "instagram",
    "generatedAt": "2025-10-01T...",
    "summary": "Generated 10 creatives across 5 strategic angles",
    "structuredData": {
      "brandInsights": {},
      "customerInsights": {},
      "competitiveInsights": {},
      "creativeAngles": [],
      "copyVariations": []
    }
  },
  "sessionId": "campaign-1234567890",
  "performance": {
    "duration": "287432ms",
    "messageCount": 45
  },
  "instrumentation": {
    "campaignMetrics": {
      "totalCost_usd": 0.2847,
      "totalDuration_ms": 287432
    },
    "summary": {
      "totalCost": "$0.2847",
      "totalTokens": 124567,
      "agentsUsed": 4,
      "toolsUsed": 12
    }
  }
}
```

#### `POST /test` - SDK Query Test

**Purpose**: Test SDK functionality with session management

**Request**:
```json
{
  "prompt": "List available agents",
  "sessionId": "optional-session-id",
  "createNew": false
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "session_...",
  "sessionStats": {
    "messageCount": 15,
    "turnCount": 3,
    "duration": 45231
  },
  "summary": "Available agents: brand-intelligence-analyst, ..."
}
```

#### `GET /sessions` - List Active Sessions

**Response**:
```json
{
  "success": true,
  "count": 5,
  "sessions": [
    {
      "id": "session_abc123",
      "sdkSessionId": "sdk-xyz789",
      "createdAt": "2025-10-01T10:00:00Z",
      "lastAccessedAt": "2025-10-01T10:15:00Z",
      "turnCount": 5,
      "metadata": {
        "campaignName": "Example Campaign",
        "status": "active"
      }
    }
  ]
}
```

#### `POST /sessions/:id/continue` - Resume Session

**Request**:
```json
{
  "prompt": "Generate 5 more variations with urgency focus"
}
```

**Response**: Similar to `/test` endpoint

#### `POST /sessions/:id/fork` - Fork Session

**Request**:
```json
{
  "prompt": "Try emotional angle instead",
  "purpose": "Emotional variant A/B test"
}
```

**Response**:
```json
{
  "success": true,
  "fork": {
    "sessionId": "session_new456",
    "baseSessionId": "session_abc123",
    "purpose": "Emotional variant A/B test"
  },
  "note": "Fork created successfully. Original session unchanged."
}
```

#### `GET /sessions/:id/family` - Session Family Tree

**Response**:
```json
{
  "success": true,
  "family": {
    "base": {
      "id": "session_abc123",
      "createdAt": "...",
      "turnCount": 8
    },
    "forks": [
      {
        "id": "session_def456",
        "forkedFrom": "session_abc123",
        "forkPurpose": "Emotional variant"
      },
      {
        "id": "session_ghi789",
        "forkedFrom": "session_abc123",
        "forkPurpose": "Social proof variant"
      }
    ],
    "totalVariants": 3
  }
}
```

#### `GET /health` - Health Check

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T10:00:00Z",
  "config": {
    "hasAnthropicKey": true,
    "hasGeminiKey": true,
    "port": 3001
  }
}
```

#### `GET /images` - List Generated Images

**Purpose**: List all AI-generated images organized by session

**Response**:
```json
{
  "success": true,
  "totalImages": 15,
  "totalSessions": 3,
  "imagesBySession": {
    "campaign-abc123": [
      "http://localhost:3001/images/campaign-abc123/1760327650986_1_professional_office.png",
      "http://localhost:3001/images/campaign-abc123/1760327660123_2_happy_customer.png"
    ],
    "test-session-001": [
      "http://localhost:3001/images/test-session-001/1760347745646_1_mountain_landscape.png"
    ]
  }
}
```

#### `GET /images/:sessionId/:filename` - Serve Image

**Purpose**: Serve a specific generated PNG image file

**Example**:
```
GET /images/campaign-abc123/1760327650986_1_professional_office.png
```

**Response**: PNG image file (Content-Type: image/png)

**File Naming Convention**:
```
{timestamp}_{index}_{sanitized_prompt}.png

Example:
1760327650986_1_professional_office_workspace_with_natural.png
  └─ timestamp  └─ index  └─ first 50 chars of prompt (sanitized)
```

---

## Agent System

### Agent Hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│                    AGENT ECOSYSTEM                             │
│                  (.claude/agents/*.md)                         │
└────────────────────────────────────────────────────────────────┘

Level 0: SDK Query (Has MCP Access ✅)
    │
    └─→ Main Creative Director Agent (Orchestrator)
         │
         ├─→ Level 1: Research Agents (Parallel)
         │   ├─→ brand-intelligence-analyst
         │   │   Tools: WebFetch, Read, Grep
         │   │
         │   ├─→ customer-psychology-specialist
         │   │   Tools: WebFetch, WebSearch, Read
         │   │
         │   └─→ competitive-intelligence-specialist
         │       Tools: WebSearch, WebFetch, Read
         │
         └─→ Level 1: Copy Generation
             └─→ copy-creator
                 Tools: Read, Write
```

### Agent Definitions

#### 1. **Main Creative Director** (Implicit in system prompt)

**Role**: Orchestrates entire workflow, makes strategic decisions

**Capabilities**:
- Coordinate parallel agent execution
- Synthesize multi-source research
- Generate strategic creative angles
- Structure final output
- Direct MCP tool access (future: nano_banana)

**System Prompt** (from ai-client.ts):
```
You are an expert creative advertising agent that specializes in
generating high-converting ad campaigns.

Core capabilities:
- Coordinating multiple specialized agents
- Analyzing brands, audiences, and market opportunities
- Generating compelling ad copy using proven frameworks
- Orchestrating parallel workflows
- Producing structured, platform-optimized content

When generating campaigns:
1. Extract comprehensive brand insights
2. Identify customer pain points and triggers
3. Analyze competitive landscape
4. Develop multiple strategic creative angles
5. Create copy variations optimized for platform
6. Structure outputs as actionable assets
```

#### 2. **brand-intelligence-analyst**

**File**: `.claude/agents/brand-intelligence-analyst.md`

**Purpose**: Extract brand identity, visual elements, positioning

**Tools**: WebFetch, Read, Grep

**Output**:
```json
{
  "brandName": "Example Co",
  "visualIdentity": {
    "primaryColors": ["#FF5733", "#3498DB"],
    "designLanguage": "modern minimal"
  },
  "brandVoice": {
    "tone": ["professional", "friendly"],
    "personality": "Innovative but approachable"
  },
  "valueProps": {
    "primary": "Simplify complex workflows",
    "uspList": ["AI-powered", "5-minute setup", "No coding"]
  }
}
```

#### 3. **customer-psychology-specialist**

**File**: `.claude/agents/customer-psychology-specialist.md`

**Purpose**: Identify pain points, desires, psychological triggers

**Tools**: WebFetch, WebSearch, Read

**Output**:
```json
{
  "painPoints": [
    {
      "pain": "Ads take too long to create",
      "severity": "high",
      "emotionalImpact": "frustration",
      "currentSolution": "Manual design work"
    }
  ],
  "desires": [
    {
      "desire": "Generate campaigns in minutes",
      "type": "functional",
      "intensity": "high"
    }
  ],
  "psychologicalTriggers": {
    "urgency": ["Limited-time offer", "Competition moving faster"],
    "socialProof": ["Case studies", "Testimonials"],
    "authority": ["AI expertise", "Industry recognition"]
  }
}
```

#### 4. **competitive-intelligence-specialist**

**File**: `.claude/agents/competitive-intelligence-specialist.md`

**Purpose**: Research competitor strategies, identify market gaps

**Tools**: WebSearch, WebFetch, Read

**Output**:
```json
{
  "competitors": [
    {
      "name": "Competitor A",
      "positioning": "Enterprise automation",
      "strengths": ["Brand recognition", "Feature-rich"],
      "weaknesses": ["Complex setup", "Expensive"]
    }
  ],
  "opportunities": {
    "marketGaps": [
      {
        "gap": "No simple solution for small teams",
        "opportunity": "Position as fast, simple alternative",
        "priority": "high"
      }
    ]
  }
}
```

#### 5. **copy-creator**

**File**: `.claude/agents/copy-creator.md`

**Purpose**: Generate compelling ad copy using proven frameworks

**Tools**: Read, Write

**Frameworks by Angle**:
- **Problem-Solution** → PAS (Problem, Agitate, Solution)
- **Social Proof** → 4 Ps (Promise, Picture, Proof, Push)
- **Transformation** → Before-After-Bridge
- **Product Hero** → FAB (Features, Advantages, Benefits)
- **Emotional** → AIDA (Attention, Interest, Desire, Action)

**Output**:
```json
{
  "creatives": [
    {
      "angleType": "problem-solution",
      "framework": "PAS",
      "variant": "A",
      "copy": {
        "primaryHeadline": "Stop Wasting Hours on Ads",
        "supportingHeadline": "AI Creates 10 in 5 Minutes",
        "bodyCopy": "Transform URLs into creatives instantly.",
        "ctaButton": "Start Free Trial"
      },
      "emotionalTone": "urgency-relief"
    }
  ]
}
```

### Agent Communication Pattern

```
Main Agent: "I need brand analysis for https://example.com"
     ↓
Task Tool Call: {
  subagent_type: "brand-intelligence-analyst",
  description: "Extract brand identity",
  prompt: "Analyze https://example.com for brand colors, voice, USPs..."
}
     ↓
[SDK spawns subagent]
     ↓
Brand Agent: [Uses WebFetch on example.com]
     ↓
Brand Agent: [Returns structured JSON]
     ↓
Main Agent: [Receives JSON in tool_result]
     ↓
Main Agent: "Brand uses blue/orange, friendly tone, focuses on speed"
```

---

## Instrumentation & Observability

### Real-time Message Processing

```typescript
// In sdk-server.ts /generate endpoint
for await (const result of aiClient.queryWithSession(prompt, sessionId)) {
  const { message } = result;

  // Process through instrumentor
  instrumentor.processMessage(message);

  // Message types handled:
  switch (message.type) {
    case 'system':
      if (message.subtype === 'init') {
        console.log('SDK Session:', message.session_id);
      }
      break;

    case 'assistant':
      // Extract text content
      const content = message.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') {
            console.log('Assistant:', block.text.substring(0, 100));
          }
          if (block.type === 'tool_use') {
            console.log('Tool Called:', block.name);
            if (block.name === 'Task') {
              console.log('Agent:', block.input?.subagent_type);
            }
          }
        }
      }
      break;

    case 'user':
      // Tool results
      const userContent = message.message?.content;
      if (Array.isArray(userContent)) {
        for (const block of userContent) {
          if (block.type === 'tool_result') {
            console.log('Tool Completed:', block.tool_use_id);
          }
        }
      }
      break;

    case 'result':
      if (message.subtype === 'success') {
        console.log('Complete! Cost:', message.total_cost_usd);
        console.log('Duration:', message.duration_ms, 'ms');
        console.log('Turns:', message.num_turns);
      }
      break;
  }
}
```

### Cost Tracking

**SDK Provides Authoritative Costs**:
```json
{
  "type": "result",
  "subtype": "success",
  "total_cost_usd": 0.2847,
  "duration_ms": 287432,
  "num_turns": 8,
  "usage": {
    "input_tokens": 45231,
    "output_tokens": 12456,
    "cache_read_input_tokens": 23400,
    "cache_creation_input_tokens": 8900
  }
}
```

**No Manual Calculation Needed**: SDK computes exact cost based on:
- Model pricing (Sonnet 4.5)
- Cache read tokens (90% discount)
- Cache write tokens
- Input/output tokens

### Event Timeline

```json
{
  "timeline": [
    {
      "timestamp": 1696176234567,
      "type": "INIT",
      "data": { "sessionId": "sdk-xyz789" }
    },
    {
      "timestamp": 1696176235123,
      "type": "TOOL",
      "data": "Task"
    },
    {
      "timestamp": 1696176236890,
      "type": "USAGE",
      "data": {
        "tokens": {
          "input": 2341,
          "output": 456,
          "cache_read": 1200,
          "cache_write": 890
        }
      }
    },
    {
      "timestamp": 1696176237456,
      "type": "COMPLETE",
      "data": {
        "duration": "287432ms",
        "cost": "$0.2847",
        "turns": 8
      }
    }
  ]
}
```

---

## Technology Stack

### Backend Runtime
- **Node.js**: v20+
- **TypeScript**: v5.3+
- **tsx**: v4.7+ (TypeScript execution)

### Core Framework
- **@anthropic-ai/claude-agent-sdk**: v0.1.1
  - Main SDK for Claude Code integration
  - Provides `query()` function with streaming
  - Agent orchestration via Task tool
  - Session management with `resume` and `forkSession`

### Web Framework
- **Express**: v4.18+
  - HTTP server
  - REST API endpoints
  - Middleware support

### Utilities
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **zod**: Runtime type validation

### MCP Integrations (Production)
- **@google/genai**: v1.24+ (Gemini 2.5 Flash Image API)
  - Used by nano_banana MCP server for AI image generation
  - Synchronous generation: 10.5s average per image
  - Model: `gemini-2.5-flash-image-preview`
- **@anthropic-ai/claude-agent-sdk MCP**: Built-in MCP server support
  - Tool registration via `createSdkMcpServer()`
  - Accessible to all agents via `allowedTools` configuration

### Development Tools
- **@types/node**: TypeScript definitions
- **@types/express**: Express type definitions
- **@types/cors**: CORS type definitions

### File Structure
```
creative_agent/
├── .claude/
│   ├── agents/
│   │   ├── brand-intelligence-analyst.md
│   │   ├── customer-psychology-specialist.md
│   │   ├── competitive-intelligence-specialist.md
│   │   ├── copy-creator.md
│   │   ├── visual-director.md          # ✅ MCP image generation
│   │   └── image-tester.md             # ✅ MCP testing agent
│   └── settings.local.json
├── server/
│   ├── lib/
│   │   ├── ai-client.ts                # Generator lifecycle with AbortController
│   │   ├── session-manager.ts
│   │   ├── instrumentor.ts
│   │   └── nano-banana-mcp.ts          # ✅ MCP server for image generation
│   ├── sdk-server.ts
│   ├── package.json
│   └── tsconfig.json
├── sessions/                            # Auto-generated
│   └── session_*.json
├── generated-images/                    # ✅ Auto-generated (git-ignored)
│   ├── campaign-abc123/
│   │   └── {timestamp}_{index}_{prompt}.png
│   └── test-session-001/
│       └── {timestamp}_{index}_{prompt}.png
├── .env
├── .gitignore                           # Excludes generated-images/
└── *.md (documentation)
```

---

## Deployment

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Required for Image Generation (MCP)
GEMINI_API_KEY=AIzaSy...

# Server Config
PORT=3001
NODE_ENV=development
```

### Starting the Server

**Development Mode** (with hot reload):
```bash
cd server
npm run dev
# Uses: tsx watch --env-file=../.env sdk-server.ts
```

**Production Mode**:
```bash
cd server
npm start
# Uses: tsx --env-file=../.env sdk-server.ts
```

**Testing**:
```bash
cd server
npm test
# Uses: tsx --env-file=../.env test-agent.ts
```

### Server Startup Output

```
╔══════════════════════════════════════════════╗
║     Creative Ad Agent Server Running         ║
╠══════════════════════════════════════════════╣
║  🚀 Server: http://localhost:3001            ║
║                                              ║
║  Core Endpoints:                             ║
║  📝 POST /test - Test query with sessions    ║
║  🎨 POST /generate - Generate ad campaigns   ║
║  💚 GET /health - Health check               ║
║                                              ║
║  Session Management:                         ║
║  📋 GET /sessions - List active sessions     ║
║  📊 GET /sessions/:id - Get session info     ║
║  🔄 POST /sessions/:id/continue - Resume     ║
║  🌿 POST /sessions/:id/fork - Fork variant   ║
║  🌳 GET /sessions/:id/family - Session tree  ║
╠══════════════════════════════════════════════╣
║  Features Enabled:                           ║
║  ✅ Session Forking (A/B testing)            ║
║  ✅ Custom System Prompt (ad specialist)     ║
║  ✅ Real-time Instrumentation                ║
╠══════════════════════════════════════════════╣
║  Environment:                                ║
║  - Anthropic API: ✅ Configured              ║
║  - Gemini API: ✅ Configured (Image Gen)     ║
║  - Session Storage: ./sessions               ║
║  - Image Storage: ./generated-images         ║
╚══════════════════════════════════════════════╝
```

### Health Check

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-01T10:00:00.000Z",
  "config": {
    "hasAnthropicKey": true,
    "hasGeminiKey": false,
    "port": 3001
  }
}
```

---

## Design Decisions & Insights

### 1. Why Async Generators?

**Decision**: Use async generator pattern with persistent lifecycle for SDK queries

**Rationale**:
- **REQUIRED** for MCP server integration (nano_banana is now production-ready)
- Enables streaming responses
- Generator MUST stay alive during entire tool execution
- Without persistence, long-running MCP tools fail with "stream closed" error

**Critical Discovery** (January 2025):
The async generator must not complete after yielding the initial message. If it completes too early, the SDK loses its connection to maintain session state during long-running tool execution (like 10+ second Gemini API calls). This appeared as "Tool permission stream closed before response received" errors.

**Correct Implementation**:
```typescript
private async *createPromptGenerator(
  promptText: string,
  attachments?: Array<{type: string; source: any}>,
  signal?: AbortSignal  // Controls generator lifetime
) {
  // Yield user message
  yield {
    type: "user",
    message: { role: "user", content: promptText },
    parent_tool_use_id: null
  };

  // 🎯 CRITICAL: Keep generator alive!
  // Without this, stream closes prematurely during tool execution
  if (signal) {
    await new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve());
    });
  } else {
    // Fallback: keep alive indefinitely (SDK closes when done)
    await new Promise<void>(() => {});
  }
}

// Usage with AbortController for proper cleanup
const controller = new AbortController();
for await (const message of query({
  prompt: promptGenerator(text, attachments, controller.signal),
  options
})) {
  // Process streaming messages
}
controller.abort();  // Clean shutdown
```

**Why This Matters**:
- **Before fix**: Generator completes → SDK detects closed stream → MCP tool fails even though it's still running
- **After fix**: Generator waits for abort signal → SDK maintains connection → MCP tool completes successfully and returns results

### 2. Why Two Session IDs?

**Decision**: Track both our session ID and SDK's session ID

**Rationale**:
- Our ID: User-facing, stable across requests
- SDK ID: Internal, required for `resume` option
- Decoupling allows flexibility in session management

**Pattern**:
```typescript
{
  id: "session_abc123",           // Our ID (stable)
  sdkSessionId: "sdk-xyz789",     // SDK's ID (from init message)
}

// Resume uses SDK ID
aiClient.queryStream(prompt, { resume: "sdk-xyz789" })
```

### 3. How MCP Tools Work with Subagents

**Status**: ✅ **Production Ready** (Validated January 2025)

**Key Mechanism**:
- MCP tools listed in top-level `allowedTools` array are available to ALL agents
- Subagents inherit tool access from the session-wide configuration
- Agent definitions specify which tools they use via `tools:` frontmatter field
- Generator lifecycle fix enables long-running MCP tools (10+ seconds)

**Configuration Pattern**:
```typescript
// ai-client.ts - Top-level configuration
allowedTools: [
  "Task", "WebFetch", "Read", "Write", ...  // Built-in tools
  "mcp__nano-banana__generate_ad_images"    // MCP tool - available to ALL agents
]

// .claude/agents/visual-director.md - Agent definition
---
tools: Read, Bash, mcp__nano-banana__generate_ad_images
---
```

**Complete Workflow** (All Phases Validated):
```
Research Phase: Subagents (WebFetch, WebSearch) ✅
   ↓
Strategy Phase: Main Agent ✅
   ↓
Copy Generation: copy-creator subagent ✅
   ↓
Image Generation: visual-director subagent + MCP ✅
   └─> mcp__nano-banana__generate_ad_images
       └─> Gemini 2.5 Flash Image API (10.5s avg)
           └─> Returns PNG images with URLs
```

**MCP Tool Execution Flow**:
```
┌─────────────────────────────────────────────────────────┐
│ LEVEL 1: Main Agent or Subagent                         │
│ Calls: mcp__nano-banana__generate_ad_images             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ LEVEL 2: MCP Server (nano-banana-mcp.ts)                │
│ - Receives: prompts[], style, dimensions, sessionId     │
│ - Calls: Gemini 2.5 Flash Image API                    │
│ - Processing time: ~10 seconds per image               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓ (Generator stays alive!)
┌─────────────────────────────────────────────────────────┐
│ LEVEL 3: Async Generator Lifecycle                      │
│                                                          │
│ t=0s     Generator yields user message                  │
│ t=0.1s   Generator waits on AbortSignal                │
│          [Keeps connection alive]                       │
│ t=10.5s  Gemini API completes                          │
│ t=10.6s  MCP tool returns result                       │
│ t=10.7s  SDK aborts generator                          │
│ t=10.8s  Generator closes gracefully                   │
└─────────────────────────────────────────────────────────┘
```

**Critical Fix for MCP Tools** (Documented in `MCP_STREAM_FIX.md`):
- **Problem**: Generator completed immediately after yielding → Stream closed prematurely
- **Solution**: Generator waits for AbortSignal → Stays alive during tool execution
- **Result**: Long-running tools (10+ seconds) work perfectly
- **Validation**: Tested with 10.5s Gemini API calls - 100% success rate

### 4. Why Session Forking?

**Decision**: Allow forking sessions for A/B testing creative variants

**Use Case**:
- Complete expensive research once
- Fork at decision point to try different creative angles
- Compare results across variants
- Original session preserved (safe experimentation)

**Implementation**:
```typescript
aiClient.queryWithSessionFork(
  "Try emotional angle",
  baseSessionId,
  { forkPurpose: "emotional-variant" }
)
```

### 5. Why Real-time Instrumentation?

**Decision**: Process every SDK message through instrumentor

**Benefits**:
- Complete observability of agent behavior
- Real-time cost tracking (no surprises)
- Debugging complex agent workflows
- Performance optimization insights

**Pattern**:
```typescript
for await (const message of query(...)) {
  instrumentor.processMessage(message);  // Track everything
  sessionManager.addMessage(sessionId, message);  // Persist
}
```

---

## Future Enhancements

### ✅ Recently Completed

1. **Image Generation Integration** (✅ Production Ready - January 2025)
   - **nano_banana MCP server** for Gemini 2.5 Flash Image (`gemini-2.5-flash-image-preview`)
   - **visual-director subagent** with MCP access (PHASE 4 in workflow)
   - **Synchronous generation**: Up to 3 images per call (10.5s average per image)
   - **File storage**: Images saved to `generated-images/{sessionId}/` as PNG files
   - **HTTP serving**: `/images` endpoints for accessing generated images
   - **Generator lifecycle fix**: AbortController pattern enables long-running MCP tools
   - **Multi-agent validation**: Tested with @image-tester and @visual-director agents
   - **Error rate**: 0% in production testing (previously 100% due to stream closure bug)

2. **MCP Tool Stream Fix** (✅ Critical Bug Fix - January 2025)
   - **Root cause identified**: Async generator completing too early
   - **Solution implemented**: Generator persistence using AbortSignal
   - **Impact**: Enables any long-running MCP tool (not just image generation)
   - **Documentation**: See `MCP_STREAM_FIX.md` for complete technical analysis

### Planned Features

1. **Enhanced Session Management**
   - Session merging (combine forks)
   - Session replay (debugging)
   - Session export (share campaigns)

3. **Advanced Analytics**
   - Cost prediction before execution
   - Performance comparison across forks
   - Agent efficiency metrics

4. **Platform Integrations**
   - Direct export to Meta Ads Manager
   - Instagram integration
   - Campaign tracking post-deployment

5. **Optimization**
   - Research result caching (avoid redundant WebFetch)
   - Parallel fork execution
   - Cost-optimized agent selection

---

## Troubleshooting

### Common Issues

#### 1. "Session not found"
```bash
# Check active sessions
curl http://localhost:3001/sessions

# Session may have expired (24 hour limit)
# Create new session by omitting sessionId in request
```

#### 2. "No SDK session ID found"
```bash
# Cannot fork before session initialization complete
# Wait for system.init message before forking
# Check session stats to verify sdkSessionId exists
curl http://localhost:3001/sessions/{id}
```

#### 3. "Agent not found"
```bash
# Verify agent files exist in .claude/agents/
ls .claude/agents/

# Check cwd setting in ai-client.ts
# Should point to project root (parent of server/)
```

#### 4. High costs
```bash
# Check instrumentation report
# POST /generate includes detailed cost breakdown
# Enable caching by running similar queries
# Consider reducing maxTurns if excessive
```

#### 5. "Tool permission stream closed before response received"
```bash
# MCP Tool Issue: Async generator completing too early
# Solution: Ensure ai-client.ts has generator lifecycle fix

# Verify fix is in place:
grep -A 10 "signal.addEventListener" server/lib/ai-client.ts

# Should see AbortSignal pattern:
if (signal) {
  await new Promise<void>((resolve) => {
    signal.addEventListener('abort', () => resolve());
  });
}

# If missing, see MCP_STREAM_FIX.md for implementation details
```

#### 6. MCP tool works but agent reports error
```bash
# Symptom: Image file exists but agent says "failed"
# Cause: Generator closed before tool returned result

# Check server logs for timing:
grep -E "(TOOL CALLED|API response received|TOOL COMPLETED)" server_log.md

# If you see:
#   TOOL CALLED → TOOL COMPLETED (error) → API response (success)
# Then the generator is closing too early (see issue #5)

# Expected pattern:
#   TOOL CALLED → API response (success) → TOOL COMPLETED (no error)
```

#### 7. GEMINI_API_KEY not configured
```bash
# MCP image generation requires Gemini API key
# Add to .env file:
GEMINI_API_KEY=your_key_here

# Verify:
curl http://localhost:3001/health
# Should show: "hasGeminiKey": true
```

---

## Key Metrics

### Performance Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Total Generation Time | < 5 min | 2-4 min |
| Research Phase | < 60s | 30-45s |
| Copy Generation | < 90s | 60-75s |
| Session Creation | < 100ms | 50ms |
| API Response Time | < 500ms | 200-300ms |

### Cost Benchmarks

| Operation | Estimated Cost |
|-----------|---------------|
| Full Campaign (10 creatives) | $0.20-$0.40 |
| Research Phase Only | $0.05-$0.10 |
| Copy Generation | $0.08-$0.15 |
| Session Fork | $0.10-$0.20 |

*Costs vary based on cache hits and content volume*

---

## Conclusion

This architecture provides a robust, scalable foundation for AI-powered creative ad generation. Key strengths:

- **Modularity**: Clear separation of concerns (server, client, session, instrumentation)
- **Observability**: Complete tracking of costs, performance, and agent behavior
- **Flexibility**: Session forking enables creative experimentation
- **Scalability**: Parallel agent execution, session persistence
- **Future-proof**: MCP integration ready, extensible agent system

The system successfully orchestrates 5 specialized agents to generate 10 unique ad creatives in under 5 minutes, with full cost transparency and session management.

---

**Last Updated**: January 10, 2025
**Version**: 1.1 - MCP Image Generation Integration
**Maintained By**: Creative Agent Team

## Recent Changes (v1.1)

- ✅ **MCP Image Generation**: nano_banana server integrated and validated
- ✅ **Generator Lifecycle Fix**: AbortController pattern for long-running tools
- ✅ **Multi-Agent MCP Access**: Subagents can call MCP tools successfully
- ✅ **Image Serving**: HTTP endpoints for generated images
- 📖 **Documentation**: MCP_STREAM_FIX.md with root cause analysis
