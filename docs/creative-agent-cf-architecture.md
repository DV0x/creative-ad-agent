# Creative Agent CF - Architecture Reference

Comprehensive architecture documentation for the Cloudflare-deployed Creative Agent system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Infrastructure](#infrastructure)
3. [File Structure](#file-structure)
4. [Worker Layer](#worker-layer)
5. [Sandbox Layer](#sandbox-layer)
6. [Agent System](#agent-system)
7. [Data Flow](#data-flow)
8. [Storage Architecture](#storage-architecture)
9. [API Reference](#api-reference)
10. [SSE Protocol](#sse-protocol)
11. [Configuration](#configuration)

---

## System Overview

The Creative Agent is a multi-agent system that generates conversion-focused ad creatives from any website URL. It runs on Cloudflare's infrastructure using Workers, Sandbox containers, D1 database, and R2 storage.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Frontend)                               │
│                     POST /generate → SSE Stream Response                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE WORKER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Router    │  │  Generate   │  │  Sessions   │  │      Images         │ │
│  │  index.ts   │  │  Handler    │  │  Handler    │  │      Handler        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                        ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐
│    D1 Database      │  │   Sandbox (DO)      │  │      R2 Bucket          │
│  Session metadata   │  │  Agent execution    │  │   File storage          │
└─────────────────────┘  └─────────────────────┘  └─────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SANDBOX CONTAINER                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      agent-runner.ts                                 │   │
│  │  Claude Agent SDK → Orchestrator → Agents/Skills → MCP Tools        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                       │                                     │
│         ┌─────────────────────────────┼─────────────────────────────┐      │
│         ▼                             ▼                             ▼      │
│  ┌─────────────┐            ┌─────────────────┐            ┌────────────┐  │
│  │  research   │            │hook-methodology │            │ art-style  │  │
│  │   Agent     │            │     Skill       │            │   Skill    │  │
│  └─────────────┘            └─────────────────┘            └────────────┘  │
│                                       │                                     │
│                                       ▼                                     │
│                            ┌─────────────────┐                             │
│                            │  nano-banana    │                             │
│                            │   MCP Server    │                             │
│                            │ (Gemini Images) │                             │
│                            └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure

### Cloudflare Services Used

| Service | Purpose | Binding Name |
|---------|---------|--------------|
| **Workers** | HTTP routing, request handling | - |
| **Durable Objects** | Sandbox state management | `Sandbox` |
| **Sandbox** | Container execution for agents | `Sandbox` |
| **D1** | Session metadata, analytics | `DB` |
| **R2** | File storage (research, hooks, images) | `STORAGE` |

### Environment Variables

```typescript
interface Env {
  // Durable Objects
  Sandbox: DurableObjectNamespace<Sandbox>;

  // Database
  DB: D1Database;

  // Storage
  STORAGE: R2Bucket;

  // API Keys (secrets)
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;

  // R2 S3-compatible credentials (for mountBucket)
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // Config
  CF_ACCOUNT_ID: string;
  ENVIRONMENT: string;
}
```

---

## File Structure

```
creative-agent-cf/
├── src/                          # Worker source code
│   ├── index.ts                  # Main entry point, routing
│   └── handlers/
│       ├── generate.ts           # POST /generate - SSE streaming
│       ├── sessions.ts           # Session CRUD operations
│       └── images.ts             # Image serving from R2
│
├── sandbox/                      # Sandbox container code
│   ├── package.json              # Sandbox dependencies
│   ├── package-lock.json         # Lock file for deterministic builds
│   ├── tsconfig.json             # TypeScript config
│   ├── agent-runner.ts           # Main agent orchestration
│   ├── orchestrator-prompt.ts    # System prompt for coordinator
│   └── nano-banana-mcp.ts        # Gemini image generation MCP
│
├── agent/                        # Agent configuration
│   └── .claude/
│       ├── agents/
│       │   └── research.md       # Research agent definition
│       └── skills/
│           ├── hook-methodology/
│           │   ├── SKILL.md      # Hook generation skill
│           │   └── formulas.md   # Hook formula reference
│           └── art-style/
│               ├── SKILL.md      # Art style router
│               └── workflows/
│                   └── soft-brutalism-clay.md  # Default style
│
├── Dockerfile                    # Sandbox container image
├── schema.sql                    # D1 database schema
├── wrangler.jsonc                # Wrangler configuration
├── package.json                  # Worker dependencies
└── tsconfig.json                 # Worker TypeScript config
```

---

## Worker Layer

### Entry Point (`src/index.ts`)

The main Worker handles HTTP routing and CORS:

```typescript
// Route table
switch (url.pathname) {
  case "/":           // API info
  case "/health":     // Health check
  case "/generate":   // POST - Start generation (SSE)
  case "/sessions":   // GET - List sessions
  // Dynamic routes:
  // /sessions/:id          - GET session details
  // /sessions/:id/continue - POST continue session
  // /sessions/:id/fork     - POST fork session
  // /images/:sessionId/:filename - GET image from R2
}
```

### Generate Handler (`src/handlers/generate.ts`)

The core endpoint that orchestrates agent execution:

```typescript
async function handleGenerate(request, env, ctx, corsHeaders) {
  // 1. Parse request
  const { prompt, sessionId } = await request.json();

  // 2. Get or create sandbox
  const sandbox = getSandbox(env.Sandbox, sessionId);

  // 3. Mount R2 bucket
  await sandbox.mountBucket("creative-agent-storage", "/storage", {
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    provider: "r2",
    credentials: { accessKeyId, secretAccessKey }
  });

  // 4. Create output directories
  await sandbox.exec(`mkdir -p /storage/images/${sessionId}`);

  // 5. Execute agent with streaming
  const execStream = await sandbox.execStream(
    "npx tsx /workspace/agent-runner.ts",
    {
      env: {
        PROMPT: prompt,
        SESSION_ID: sessionId,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        GEMINI_API_KEY: env.GEMINI_API_KEY,
        // Non-interactive flags
        CI: "true",
        CLAUDE_CODE_SKIP_EULA: "true",
      },
      timeout: 600000  // 10 minutes
    }
  );

  // 6. Transform and stream to client
  // 7. Save to D1 on completion
}
```

### Sessions Handler (`src/handlers/sessions.ts`)

Session management operations:

- `GET /sessions` - List all sessions (paginated)
- `GET /sessions/:id` - Get session with data + images
- `POST /sessions/:id/continue` - Continue with new prompt
- `POST /sessions/:id/fork` - Fork for A/B testing

### Images Handler (`src/handlers/images.ts`)

Serves images from R2 with proper caching:

```typescript
// URL: /images/:sessionId/:filename
// R2 key: images/{sessionId}/{filename}
// Headers: Cache-Control, ETag, Content-Type
```

---

## Sandbox Layer

### Dockerfile

Base image with required tooling:

```dockerfile
FROM docker.io/cloudflare/sandbox:0.6.3

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure for non-interactive use
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true

# Copy workspace files
COPY sandbox/package.json sandbox/package-lock.json /workspace/
RUN npm ci

COPY agent/ /workspace/agent/
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/nano-banana-mcp.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/
```

### Agent Runner (`sandbox/agent-runner.ts`)

The main orchestration script using Claude Agent SDK with structured trace events:

```typescript
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";

// Emit structured trace events for frontend terminal display
function emitTrace(type: string, data: Record<string, unknown>) {
  const event = { type, ...data, timestamp: new Date().toISOString() };
  console.error(`[trace] ${JSON.stringify(event)}`);
}

// Create MCP server for image generation
const nanoBananaMcp = createSdkMcpServer({
  name: "nano-banana",
  version: "4.0.0",
  tools: [
    tool("generate_ad_images", "...", schema, generateAdImages)
  ]
});

// Async generator for prompt (required for MCP tools with long execution)
async function* createPromptGenerator(promptText, signal) {
  yield {
    type: "user",
    message: { role: "user", content: promptText },
    parent_tool_use_id: null
  } as any;  // Type assertion - SDK handles session_id
  await new Promise(resolve => signal.addEventListener('abort', resolve));
}

// Main execution with trace events
for await (const message of query({
  prompt: promptGenerator,
  options: {
    cwd: '/workspace/agent',
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    settingSources: ['project'],
    mcpServers: { 'nano-banana': nanoBananaMcp },
    model: 'claude-opus-4-5-20251101',  // Using Opus for quality
    maxTurns: 30,
    permissionMode: 'default',
    canUseTool: async () => true as any,  // Auto-approve all tools
    allowedTools: [
      'Task', 'Skill', 'TodoWrite',
      'Read', 'Write', 'Edit', 'Glob', 'Grep',
      'Bash', 'WebFetch', 'WebSearch',
      'mcp__nano-banana__generate_ad_images'
    ]
  }
})) {
  // Emit phase changes based on tool calls
  if (message.type === 'assistant') {
    // Detect Task (research), Skill (hooks, art), MCP (images)
    emitTrace('phase', { phase: 'research|hooks|art|images', label: '...' });
    emitTrace('tool_start', { tool: toolName, toolId, input: '...' });
  }

  // Emit completion when SDK sends 'result' message
  if (message.type === 'result') {
    emitTrace('phase', { phase: 'complete', label: 'Complete' });
  }

  // Extract and emit image data from tool results
  if (msg.type === 'user' && hasImageData) {
    emitTrace('image', { id, urlPath, prompt, filename });
  }

  console.error(`[progress] ${JSON.stringify(message)}`);
}
```

### Trace Event Types

The agent emits structured trace events to stderr for frontend consumption:

| Event Type | Purpose | Fields |
|------------|---------|--------|
| `phase` | Workflow phase change | `phase`, `label` |
| `tool_start` | Tool invocation began | `tool`, `toolId`, `input` |
| `tool_end` | Tool completed | `toolId`, `success` |
| `message` | Assistant text output | `text` |
| `status` | General status update | `message`, `success` |
| `image` | Image generated | `id`, `urlPath`, `prompt`, `filename` |

**Phase Values:** `parse` → `research` → `hooks` → `art` → `images` → `complete`

### Orchestrator Prompt (`sandbox/orchestrator-prompt.ts`)

System prompt defining the coordinator's behavior:

```
You coordinate a 2-agent + skills system that creates conversion-focused ads.

Components:
- research (Agent) - Extracts factual data from homepage
- hook-methodology (Skill) - Generates conversion hooks
- art-style (Skill) - Creates visual prompts
- mcp__nano-banana__generate_ad_images (MCP) - Generates images

Workflow:
1. Parse request → Extract URL, brand name, style
2. Spawn research agent → /storage/research/{brand}_research.md
3. Trigger hook-methodology → /storage/hooks/{brand}-{date}.md
4. Trigger art-style → /storage/creatives/{brand}_prompts.json
5. Call MCP tool (2 batches of 3) → /storage/images/{sessionId}/
6. Report completion
```

### Nano Banana MCP (`sandbox/nano-banana-mcp.ts`)

Image generation using Gemini 3 Pro:

```typescript
interface GenerateAdImagesArgs {
  prompts: string[];           // 1-3 prompts per call
  style?: string;              // Visual style
  aspectRatio?: '1:1' | '9:16' | ...;
  imageSize?: '1K' | '2K' | '4K';
  sessionId?: string;
}

// Output location: /storage/images/{sessionId}/{timestamp}_{index}_{slug}.png
// Returns: { success, images: [{ id, filename, urlPath, prompt, ... }] }
```

---

## Agent System

### Research Agent (`agent/.claude/agents/research.md`)

**Purpose:** Extract factual data from homepages and analyze target audience.

**Tools:** `WebFetch`, `Read`, `Write`

**Workflow:**
1. Extract brand name from URL
2. WebFetch homepage with extraction prompt
3. Analyze ICP (Ideal Customer Profile)
4. Write research brief

**Output:** `/storage/research/{brand}_research.md`

**Content Structure:**
- The Offer (product/service with numbers)
- Key Value Props (3-5 differentiators)
- Proof Points (stats, credentials)
- Products/Services
- Pain Points Addressed
- Testimonials (exact quotes)
- Brand Colors (hex codes)
- Brand Voice
- Their Messaging (headlines, CTAs)
- Target Audience / ICP

### Hook Methodology Skill (`agent/.claude/skills/hook-methodology/SKILL.md`)

**Purpose:** Generate conversion-focused ad copy using hook-first methodology.

**Workflow:**
1. Read `/storage/research/{brand}_research.md`
2. Extract numbers, pain points, testimonials, colors
3. Generate 10+ potential hooks
4. Select 6 diverse hooks (diversity matrix)
5. Write supporting copy (body + CTA)
6. Quality check each hook

**Output:** `/storage/hooks/{brand}-{YYYY-MM-DD}.md`

**Diversity Matrix:**
| Concept | Hook Type | Emotional Trigger |
|---------|-----------|-------------------|
| 1 | Stat/Data | Social Proof |
| 2 | Story/Result | Empathy + Relief |
| 3 | FOMO/Urgency | Loss Aversion |
| 4 | Curiosity | Intrigue |
| 5 | Call-out/Identity | Recognition |
| 6 | Contrast/Enemy | Differentiation |

### Art Style Skill (`agent/.claude/skills/art-style/SKILL.md`)

**Purpose:** Route to appropriate visual workflow and create image prompts.

**Style Routing:**
| Keywords | Workflow |
|----------|----------|
| clay, brutalist, handcrafted | `soft-brutalism-clay.md` |
| surreal, dreamlike, scale | `surrealist-scale.md` (future) |
| minimal, clean, photography | `minimal-photography.md` (future) |
| (none) | `soft-brutalism-clay.md` (default) |

**Output:** `/storage/creatives/{brand}_prompts.json`

### Soft Brutalism Clay Workflow

**Visual Characteristics:**
- Thick borders (8-12px) in warm colors
- Clay texture with finger-pressed impressions
- Matte finish with subtle highlights
- 40%+ negative space
- Soft, grounding shadows

**Default Color Palette:**
| Role | Color | Hex |
|------|-------|-----|
| Primary | Terracotta | #C4755B |
| Secondary | Sage Green | #87A087 |
| Light | Warm Cream | #F5F0E8 |
| Dark | Deep Charcoal | #2D2D2D |
| Accent | Warm Coral | #E8846B |

**Prompt Structure:**
```
[FORMAT & PLATFORM]
[THE CONCEPT]
[MATERIALITY]
[COMPOSITION]
[TYPOGRAPHY]
[EMOTIONAL NOTE]
[TECHNICAL]
```

**Output Format:**
```json
{
  "brand": "brand-name",
  "style": "soft-brutalism-clay",
  "prompts": [
    {
      "prompt": "Full prompt text...",
      "filename": "hook_slug",
      "aspectRatio": "1:1",
      "size": "2K"
    }
  ]
}
```

---

## Data Flow

### Generation Pipeline

```
1. USER INPUT
   │  POST /generate { prompt, sessionId }
   ▼
2. PARSE PHASE
   │  Orchestrator extracts: URL (required), brand name, style keywords
   ▼
3. RESEARCH PHASE
   │  Task tool → research agent
   │  WebFetch → Extract data → Analyze ICP
   │  Output: /storage/research/{brand}_research.md
   ▼
4. HOOKS PHASE
   │  Skill tool → hook-methodology
   │  Read research → Generate hooks → Quality check
   │  Output: /storage/hooks/{brand}-{date}.md
   ▼
5. ART PHASE
   │  Skill tool → art-style → soft-brutalism-clay
   │  Read hooks → Create visual concepts → Write prompts
   │  Output: /storage/creatives/{brand}_prompts.json
   ▼
6. IMAGES PHASE
   │  MCP tool → nano-banana → Gemini 3 Pro
   │  Read prompts → Generate images (2 batches × 3)
   │  Output: /storage/images/{sessionId}/*.png
   ▼
7. COMPLETION
   │  SSE: { type: 'done', success: true }
   │  D1: Session saved
   └─→ Images available at: GET /images/{sessionId}/{filename}
```

### File Dependencies

```
                    ┌─────────────────────┐
                    │   User Prompt       │
                    │   (URL + options)   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ {brand}_research.md │
                    │   (Research Agent)  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ {brand}-{date}.md   │
                    │ (Hook Methodology)  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ {brand}_prompts.json│
                    │    (Art Style)      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  PNG Images         │
                    │   (Nano Banana)     │
                    └─────────────────────┘
```

---

## Storage Architecture

### R2 Bucket Structure

```
creative-agent-storage/
├── research/
│   └── {brand}_research.md
├── hooks/
│   └── {brand}-{YYYY-MM-DD}.md
├── creatives/
│   └── {brand}_prompts.json
└── images/
    └── {sessionId}/
        ├── {timestamp}_1_{slug}.png
        ├── {timestamp}_2_{slug}.png
        └── ...
```

### D1 Database Schema

**sessions**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'error', 'forked')),
  campaign_name TEXT,
  brand_url TEXT,
  prompt TEXT,
  data JSON,
  parent_session_id TEXT,
  duration_ms INTEGER
);
```

**campaigns**
```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT,
  brand_url TEXT,
  hooks_generated INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);
```

**images**
```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  prompt TEXT,
  style TEXT,
  aspect_ratio TEXT DEFAULT '1:1',
  resolution TEXT DEFAULT '2K',
  size_kb INTEGER,
  created_at DATETIME
);
```

**usage**
```sql
CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  event_type TEXT CHECK (event_type IN ('generate', 'continue', 'fork', 'image')),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd REAL,
  created_at DATETIME
);
```

**research_cache**
```sql
CREATE TABLE research_cache (
  id TEXT PRIMARY KEY,
  brand_url TEXT NOT NULL UNIQUE,
  research_md TEXT,
  fetched_at DATETIME,
  expires_at DATETIME
);
```

**hooks**
```sql
CREATE TABLE hooks (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  brand_name TEXT,
  hook_type TEXT,
  hook_text TEXT NOT NULL,
  formula_used TEXT,
  created_at DATETIME
);
```

---

## API Reference

### POST /generate

Start a new generation session with SSE streaming.

**Request:**
```json
{
  "prompt": "Create conversion ads for https://example.com",
  "sessionId": "optional-uuid"
}
```

**Response:** `text/event-stream`

### GET /sessions

List all sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "created_at": "2025-01-01T00:00:00Z",
      "status": "completed",
      "brand_url": "https://example.com"
    }
  ],
  "total": 1
}
```

### GET /sessions/:id

Get session details with images.

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "status": "completed",
    "data": { /* parsed JSON */ },
    "images": ["/images/uuid/image1.png"]
  }
}
```

### POST /sessions/:id/continue

Continue session with new prompt.

**Request:**
```json
{
  "prompt": "Generate 3 more variations"
}
```

### POST /sessions/:id/fork

Fork session for A/B testing.

**Request:**
```json
{
  "prompt": "Optional new prompt",
  "name": "Optional campaign name"
}
```

### GET /images/:sessionId/:filename

Serve image from R2.

**Headers:**
- `Content-Type: image/png`
- `Cache-Control: public, max-age=31536000, immutable`
- `ETag: {hash}`

---

## SSE Protocol

### Event Format

```
data: {"type":"...", "sessionId":"...", "timestamp":"...", ...}\n\n
```

### Event Types (from Worker)

| Type | Description | Fields |
|------|-------------|--------|
| `status` | Container status | `message`, `sessionId` |
| `stdout` | Final JSON result | `data` |
| `stderr` | Agent progress (contains trace events) | `data` |
| `complete` | Execution finished | `exitCode` |
| `done` | Stream complete | `success` |
| `error` | Error occurred | `error` |

### Trace Event Parsing (from stderr)

The agent emits structured `[trace]` events in stderr. Parse them for real-time UI updates:

```typescript
interface TraceEvent {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image';
  timestamp: string;
  phase?: 'parse' | 'research' | 'hooks' | 'art' | 'images' | 'complete';
  label?: string;
  tool?: string;
  toolId?: string;
  success?: boolean;
  text?: string;
  message?: string;
  id?: string;
  urlPath?: string;
  prompt?: string;
  filename?: string;
}

function parseTraceEvent(line: string): TraceEvent | null {
  if (!line.startsWith('[trace]')) return null;
  return JSON.parse(line.replace('[trace] ', ''));
}
```

### Client-Side Event Handling

```typescript
// Handle trace events from stderr
if (event.type === 'stderr' && event.data) {
  const trace = parseTraceEvent(event.data);

  if (trace) {
    switch (trace.type) {
      case 'phase':
        setPhase(trace.phase);
        // Early completion detection - clear timeout when complete
        if (trace.phase === 'complete') {
          clearTimeout(timeoutId);
          setComplete();
        }
        break;
      case 'image':
        // Add image immediately when received
        addImage({ id: trace.id, url: trace.urlPath, ... });
        break;
    }
  }
}

// Backup completion from Worker (if trace didn't fire)
if (event.type === 'done') {
  clearTimeout(timeoutId);
  setComplete();
}
```

### Image Extraction (Fallback)

For backwards compatibility, also extract images from `[progress]` messages:

```javascript
function extractImages(text) {
  if (text.startsWith('[progress]')) {
    const data = JSON.parse(text.replace('[progress] ', ''));
    if (data.type === 'tool_result' && data.content?.images) {
      return data.content.images;
    }
  }
  return [];
}
```

### Heartbeat Handling

- **Worker sends:** SSE comment `: heartbeat {timestamp}` every 15s during inactivity
- **Agent sends:** `[heartbeat] Agent alive - {timestamp}` every 10s
- **Client filters:** Heartbeat messages are filtered from terminal display

---

## Configuration

### wrangler.jsonc

```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2024-12-01",
  "compatibility_flags": ["nodejs_compat"],

  "containers": [{
    "class_name": "Sandbox",
    "image": "./Dockerfile",
    "instance_type": "standard-1",
    "max_instances": 10
  }],

  "durable_objects": {
    "bindings": [{ "name": "Sandbox", "class_name": "Sandbox" }]
  },

  "d1_databases": [{
    "binding": "DB",
    "database_name": "creative-agent-sessions",
    "database_id": "..."
  }],

  "r2_buckets": [{
    "binding": "STORAGE",
    "bucket_name": "creative-agent-storage"
  }],

  "vars": {
    "ENVIRONMENT": "production",
    "CF_ACCOUNT_ID": "..."
  }
}
```

### Sandbox Dependencies (`sandbox/package.json`)

```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.x",
    "@google/genai": "^0.x.x",
    "zod": "^3.x.x"
  }
}
```

---

## Critical Implementation Notes

### 1. Async Generator for MCP Tools

MCP tools with long execution times require the prompt generator to stay alive:

```typescript
async function* createPromptGenerator(promptText, signal) {
  yield {
    type: "user",
    message: { role: "user", content: promptText },
    parent_tool_use_id: null
  } as any;  // Type assertion - SDK handles session_id and uuid
  // Keep alive during MCP execution
  await new Promise(resolve => signal.addEventListener('abort', resolve));
}
```

### 2. Permission Mode

Use `permissionMode: 'default'` with `canUseTool: () => true as any`:

```typescript
{
  permissionMode: 'default',
  canUseTool: async () => true as any,  // Auto-approve all tools
  // Note: TypeScript complains but this works at runtime
  // Do NOT use { behavior: 'allow', updatedInput } - it causes hangs
}
```

### 3. Early Completion Detection

Emit completion when SDK sends `result` message, not when the loop exits:

```typescript
// Inside the for-await loop
if (message.type === 'result') {
  emitTrace('phase', { phase: 'complete', label: 'Complete' });
}

// Client-side: clear timeout immediately on complete phase
if (trace.phase === 'complete') {
  clearTimeout(timeoutId);
  setComplete();
}
```

This prevents timeout errors when SDK cleanup takes longer than expected.

### 4. Non-Interactive Container

Critical environment variables for containerized execution:

```bash
CI=true
CLAUDE_CODE_SKIP_EULA=true
CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
TERM=dumb
NO_COLOR=1
```

### 5. R2 Mount Credentials

R2 bucket mounting requires S3-compatible credentials:

```typescript
await sandbox.mountBucket("bucket-name", "/storage", {
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  provider: "r2",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }
});
```

### 6. Timeout Configuration

- Sandbox exec: 600000ms (10 minutes)
- Client timeout: 600000ms (10 minutes) - cleared on completion
- Worker: Default (30s for non-streaming, unlimited for SSE)
- Gemini API: Rate limit with 1s delay between images
- Heartbeat: Every 10s (agent) / 15s (worker) to prevent idle timeout

### 7. Image Streaming

Images are streamed to the client in real-time via trace events:

```typescript
// Agent emits when MCP tool returns
emitTrace('image', {
  id: img.id,
  urlPath: img.urlPath,  // e.g., /images/{sessionId}/{filename}
  prompt: img.prompt,
  filename: img.filename
});

// Client adds image immediately
case 'image':
  addImage({ id: trace.id, url: trace.urlPath, ... });
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 4.0.0 | 2025-01 | Cloudflare Sandbox deployment |
| 5.0.0 | 2025-01 | Orchestrator + Skills architecture |
| 5.1.0 | 2025-12-14 | Structured trace events, early completion detection, real-time image streaming, Opus model |

---

## Recent Changes (v5.1.0)

### Trace Event System
- Added `emitTrace()` function for structured frontend communication
- Events: `phase`, `tool_start`, `tool_end`, `message`, `status`, `image`
- Replaces raw `[progress]` JSON parsing with cleaner event handling

### Early Completion Detection
- Emit `complete` phase when SDK sends `result` message (inside loop)
- Client clears timeout immediately on `complete` phase
- Prevents timeout errors when SDK cleanup takes longer than expected

### Real-time Image Streaming
- Images streamed to client via `image` trace events as they're generated
- Client displays images immediately without waiting for completion
- Fallback extraction from `[progress]` messages for backwards compatibility

### Model Update
- Upgraded from `claude-sonnet-4-20250514` to `claude-opus-4-5-20251101`
- Better quality output, longer generation times

### Permission Handling
- Using `canUseTool: async () => true as any` (runtime works, TypeScript complains)
- Do NOT use `{ behavior: 'allow', updatedInput }` - causes hangs

---

*Last updated: 2025-12-14*
