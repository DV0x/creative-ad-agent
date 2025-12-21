# Creative Agent CF - Quick Reference

> **Last Updated:** 2025-12-18
> **Purpose:** Single reference doc for debugging, changes, and deployment

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [File Reference](#file-reference)
4. [Data Flow](#data-flow)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Environment Variables](#environment-variables)
8. [Common Issues & Fixes](#common-issues--fixes)
9. [Deployment Commands](#deployment-commands)
10. [Trace Events (SSE)](#trace-events-sse)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT REQUEST                                 │
│                    POST /generate { prompt: "..." }                      │
└─────────────────────────────────────────┬───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE WORKER (Edge)                            │
│  src/index.ts → src/handlers/generate.ts                                 │
│                                                                          │
│  1. Parse request                                                        │
│  2. Create sandbox: getSandbox(env.Sandbox, sessionId)                   │
│  3. Mount R2 bucket at /storage/                                         │
│  4. execStream("npx tsx /workspace/agent-runner.ts")                     │
│  5. Return SSE stream immediately (non-blocking)                         │
│  6. Process in background via ctx.waitUntil()                            │
└─────────────────────────────────────────┬───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE SANDBOX (Container)                        │
│  Base: cloudflare/sandbox:0.6.3 + Node.js 20 + Claude Code CLI           │
│                                                                          │
│  sandbox/agent-runner.ts                                                 │
│  ├── Creates async generator for prompt (CRITICAL for MCP)               │
│  ├── Initializes MCP server (nano-banana)                                │
│  ├── Calls Claude Agent SDK query()                                      │
│  │   ├── cwd: /workspace/agent                                           │
│  │   ├── model: claude-opus-4-5-20251101                                 │
│  │   ├── maxTurns: 30                                                    │
│  │   └── mcpServers: { nano-banana }                                     │
│  ├── Emits trace events to stderr                                        │
│  └── Outputs final JSON to stdout                                        │
└─────────────────────────────────────────┬───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENT WORKFLOW                                   │
│                                                                          │
│  1. PARSE     → Extract URL, brand name from prompt                      │
│  2. RESEARCH  → Task tool → research agent → /storage/research/*.md      │
│  3. HOOKS     → Skill tool → hook-methodology → /storage/hooks/*.md      │
│  4. ART       → Skill tool → art-style → /storage/creatives/*.json       │
│  5. IMAGES    → MCP tool → nano-banana → /storage/images/{sessionId}/    │
│  6. COMPLETE  → Return image URLs                                        │
└─────────────────────────────────────────┬───────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          STORAGE LAYER                                   │
│                                                                          │
│  D1 Database (SQLite)           R2 Bucket (Object Storage)               │
│  ├── sessions                   /storage/                                │
│  ├── campaigns                  ├── research/{brand}_research.md         │
│  ├── images                     ├── hooks/{brand}-{date}.md              │
│  ├── usage                      ├── creatives/{brand}_prompts.json       │
│  ├── research_cache             └── images/{sessionId}/*.png             │
│  └── hooks                                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
creative-agent-cf/
├── src/                              # Cloudflare Worker code
│   ├── index.ts                      # Router, CORS, env interface
│   └── handlers/
│       ├── generate.ts               # POST /generate - main entry
│       ├── sessions.ts               # GET/POST /sessions/*
│       └── images.ts                 # GET /images/* - serve from R2
│
├── sandbox/                          # Runs INSIDE container
│   ├── agent-runner.ts               # SDK orchestration (CRITICAL)
│   ├── nano-banana-mcp.ts            # Gemini image generation MCP
│   ├── orchestrator-prompt.ts        # System prompt for coordinator
│   ├── package.json                  # Container dependencies
│   └── package-lock.json
│
├── agent/                            # Agent definitions
│   └── .claude/
│       ├── agents/
│       │   └── research.md           # Research agent spec
│       └── skills/
│           ├── hook-methodology/
│           │   ├── SKILL.md          # Hook generation skill
│           │   └── formulas.md       # Hook formula reference
│           └── art-style/
│               ├── SKILL.md          # Art routing skill
│               └── workflows/
│                   └── soft-brutalism-clay.md
│
├── wrangler.jsonc                    # Cloudflare config
├── Dockerfile                        # Sandbox container image
├── schema.sql                        # D1 database schema
├── package.json                      # Worker dependencies
└── tsconfig.json
```

---

## File Reference

### Worker Layer (`src/`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `index.ts` | Router + env interface | Routes to handlers, CORS |
| `handlers/generate.ts` | Main generation endpoint | `handleGenerate()` - spawns sandbox, streams SSE |
| `handlers/sessions.ts` | Session management | `handleSessionsList()`, `getSession()`, `continueSession()`, `forkSession()` |
| `handlers/images.ts` | Image serving | `handleImageRoute()` - serves from R2 with caching |

### Sandbox Layer (`sandbox/`)

| File | Purpose | Critical Notes |
|------|---------|----------------|
| `agent-runner.ts` | SDK orchestration | **MUST use async generator for prompt** (keeps stream alive for MCP) |
| `nano-banana-mcp.ts` | Image generation | Uses Gemini 3 Pro Image Preview, saves to /storage/images/ |
| `orchestrator-prompt.ts` | System prompt | Defines workflow: parse → research → hooks → art → images |
| `package.json` | Dependencies | `@anthropic-ai/claude-agent-sdk`, `@google/genai`, `zod`, `tsx` |

### Agent Layer (`agent/.claude/`)

| File | Purpose | Output Location |
|------|---------|-----------------|
| `agents/research.md` | Extract brand data + ICP | `/storage/research/{brand}_research.md` |
| `skills/hook-methodology/SKILL.md` | Generate 6 hooks | `/storage/hooks/{brand}-{date}.md` |
| `skills/art-style/SKILL.md` | Route to art workflow | `/storage/creatives/{brand}_prompts.json` |
| `skills/art-style/workflows/soft-brutalism-clay.md` | Visual prompt generation | (writes to prompts.json) |

### Config Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Worker name, D1/R2 bindings, container config |
| `Dockerfile` | Sandbox image: Node 20, Claude Code CLI, env vars |
| `schema.sql` | D1 tables: sessions, campaigns, images, usage, research_cache, hooks |

---

## Data Flow

### File Dependencies

```
User Prompt
    │
    ▼
research agent
    │ reads: URL via WebFetch
    │ writes: /storage/research/{brand}_research.md
    │
    ▼
hook-methodology skill
    │ reads: /storage/research/{brand}_research.md
    │ writes: /storage/hooks/{brand}-{date}.md
    │
    ▼
art-style skill
    │ reads: /storage/hooks/{brand}-{date}.md
    │ writes: /storage/creatives/{brand}_prompts.json
    │
    ▼
nano-banana MCP
    │ reads: prompts from orchestrator (passed as args)
    │ writes: /storage/images/{sessionId}/*.png
    │
    ▼
Worker saves to D1
```

### SSE Stream Flow

```
Worker (generate.ts)
    │
    ├── Returns Response immediately (non-blocking)
    │
    └── ctx.waitUntil() processes in background:
        │
        ├── parseSSEStream(execStream) from container
        │   │
        │   ├── stdout → [trace] events → emitted as SSE
        │   ├── stderr → [heartbeat], [progress] → logged
        │   └── complete → exit code
        │
        ├── Enriches with sessionId, timestamp
        ├── Sends heartbeat every 15s if inactive
        └── Saves to D1 on completion
```

---

## API Endpoints

| Method | Path | Purpose | Response |
|--------|------|---------|----------|
| `GET` | `/` | API info | JSON with endpoints list |
| `GET` | `/health` | Health check | `{ status: "ok", timestamp, environment }` |
| `POST` | `/generate` | Start generation | SSE stream with trace events |
| `GET` | `/sessions` | List all sessions | `{ sessions: [...], total }` |
| `GET` | `/sessions/:id` | Get session + images | `{ session: { ..., images: [...] } }` |
| `POST` | `/sessions/:id/continue` | Continue with new prompt | JSON result |
| `POST` | `/sessions/:id/fork` | Create A/B variant | `{ sessionId, parentSessionId }` |
| `GET` | `/images/:sessionId/:filename` | Serve image | Image binary (cached 1yr) |

### POST /generate Request

```json
{
  "prompt": "Create conversion ads for https://example.com",
  "sessionId": "optional-custom-id"
}
```

### SSE Event Types

```
data: {"type":"status","message":"Container started...","sessionId":"..."}
data: {"type":"stdout","data":"[trace] {...}"}
data: {"type":"stderr","data":"[heartbeat] ..."}
data: {"type":"complete","exitCode":0}
data: {"type":"done","sessionId":"...","success":true}
```

---

## Database Schema

### sessions (main table)

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'error', 'forked')),
  campaign_name TEXT,
  brand_url TEXT,
  prompt TEXT,
  data JSON,                    -- Full agent output
  parent_session_id TEXT,       -- For forked sessions
  duration_ms INTEGER
);
```

### Other Tables

| Table | Purpose |
|-------|---------|
| `campaigns` | Aggregated campaign metrics |
| `images` | Per-image metadata (filename, r2_key, size) |
| `usage` | API usage tracking for billing |
| `research_cache` | Cache research by brand_url |
| `hooks` | Store generated hooks for reuse |

---

## Environment Variables

### Cloudflare Secrets (set via `wrangler secret put`)

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API |
| `GEMINI_API_KEY` | Gemini image generation |
| `AWS_ACCESS_KEY_ID` | R2 S3-compatible access |
| `AWS_SECRET_ACCESS_KEY` | R2 S3-compatible secret |

### wrangler.jsonc vars

```jsonc
"vars": {
  "ENVIRONMENT": "production",
  "CF_ACCOUNT_ID": "091650847ca6a1d9bb40bee044dfdc91"
}
```

### Container Environment (set in generate.ts)

```typescript
env: {
  PROMPT: prompt,
  SESSION_ID: sessionId,
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
  GEMINI_API_KEY: env.GEMINI_API_KEY,
  HOME: "/root",
  CI: "true",
  CLAUDE_CODE_SKIP_EULA: "true",
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "true",
  TERM: "dumb",
  NO_COLOR: "1",
}
```

---

## Common Issues & Fixes

### 1. "Tool permission stream closed before response received"

**Cause:** Generator closes before MCP tool completes
**Fix:** Use async generator with abort signal (see `agent-runner.ts:86-106`)

```typescript
async function* createPromptGenerator(promptText: string, signal: AbortSignal) {
  yield { type: "user", message: { role: "user", content: promptText } };
  // Keep alive until abort
  await new Promise<void>((resolve) => {
    signal.addEventListener('abort', () => resolve());
  });
}
```

### 2. Claude Code hangs / exit code 1

**Cause:** Missing non-interactive configuration
**Fix:** Dockerfile must have:

```dockerfile
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true

RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true}' > /root/.claude/settings.json
```

### 3. 502 Bad Gateway / Timeout

**Cause:** Using `exec()` instead of `execStream()` for long operations
**Fix:** Use `execStream()` and return Response immediately

```typescript
const execStream = await sandbox.execStream("npx tsx ...", { timeout: 600000 });
return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
```

### 4. R2 Mount Fails (S3FSMountError)

**Cause:** Mount point doesn't exist
**Fix:** Create in Dockerfile + verify in handler

```dockerfile
RUN mkdir -p /storage /workspace
```

```typescript
await sandbox.exec(`mkdir -p /storage`);
await sandbox.mountBucket("creative-agent-storage", "/storage", { ... });
```

### 5. Container not updating after code changes

**Cause:** Cloudflare caches container images
**Fix:** Add rebuild marker to Dockerfile

```dockerfile
# Rebuild 1765611370  (change this number)
```

### 6. SSE stream times out

**Cause:** No activity for 60s+
**Fix:** Heartbeat in both worker and agent-runner

```typescript
// Worker (generate.ts) - every 15s
const heartbeatInterval = setInterval(async () => {
  await writer.write(encoder.encode(`: heartbeat\n\n`));
}, 15000);

// Agent (agent-runner.ts) - every 10s
const heartbeatInterval = setInterval(() => {
  console.error(`[heartbeat] Agent alive - ${new Date().toISOString()}`);
}, 10000);
```

### 7. Images not appearing

**Cause:** R2 path mismatch between write and serve
**Fix:** Verify paths match:

- Write: `/storage/images/{sessionId}/{filename}`
- R2 key: `images/{sessionId}/{filename}`
- URL: `/images/{sessionId}/{filename}`

---

## Deployment Commands

### Development

```bash
cd creative-agent-cf
npm run dev              # Local dev server with wrangler
npm run tail             # View production logs
```

### Database

```bash
npm run db:create        # Create D1 database
npm run db:init          # Run schema.sql
wrangler d1 execute creative-agent-sessions --command "SELECT * FROM sessions"
```

### R2 Storage

```bash
npm run r2:create        # Create R2 bucket
wrangler r2 object list creative-agent-storage --prefix images/
```

### Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put AWS_ACCESS_KEY_ID
wrangler secret put AWS_SECRET_ACCESS_KEY
```

### Deploy

```bash
npm run deploy           # Deploy to production
npm run deploy:staging   # Deploy to staging
```

### Containers

```bash
npm run containers:list  # List running containers
```

---

## Trace Events (SSE)

The agent emits structured trace events for frontend terminal display.

### Event Types

| Type | Purpose | Data |
|------|---------|------|
| `phase` | Workflow phase change | `{ phase: 'research'/'hooks'/'art'/'images'/'complete', label }` |
| `status` | General status | `{ message, success? }` |
| `tool_start` | Tool invocation | `{ tool, toolId, input }` |
| `tool_end` | Tool completion | `{ toolId, success }` |
| `message` | Assistant text | `{ text }` |
| `image` | Image generated | `{ id, urlPath, prompt, filename }` |

### Emitting Traces (agent-runner.ts)

```typescript
function emitTrace(type: string, data: Record<string, unknown>) {
  console.error(`[trace] ${JSON.stringify({ type, ...data, timestamp: new Date().toISOString() })}`);
}

// Usage
emitTrace('phase', { phase: 'research', label: 'Research' });
emitTrace('image', { id: 'image_1', urlPath: '/images/session/file.png' });
```

### Parsing Traces (frontend)

```typescript
// In SSE handler
if (event.type === 'stderr' && event.data.includes('[trace]')) {
  const traceJson = event.data.replace('[trace] ', '');
  const trace = JSON.parse(traceJson);
  // Handle trace.type: 'phase', 'tool_start', 'image', etc.
}
```

---

## Quick Debugging Checklist

1. **Container not starting?**
   - Check `wrangler tail` for errors
   - Verify secrets are set: `wrangler secret list`
   - Check Dockerfile syntax

2. **Agent failing?**
   - Check stderr for `[agent-runner]` logs
   - Verify async generator pattern in `agent-runner.ts`
   - Check `permissionMode: 'default'` + `canUseTool: async () => true`

3. **Images not generating?**
   - Verify `GEMINI_API_KEY` is set
   - Check R2 mount: `/storage/images/` should exist
   - Check MCP tool registration in `agent-runner.ts`

4. **SSE stream dropping?**
   - Verify heartbeat intervals (15s worker, 10s agent)
   - Check `ctx.waitUntil()` wraps the processing
   - Verify timeout is set: `timeout: 600000`

5. **Research/hooks/art not working?**
   - Check files exist in R2: `wrangler r2 object list creative-agent-storage`
   - Verify skill/agent paths: `/workspace/agent/.claude/`
   - Check `settingSources: ['project']` in SDK options

---

## Version Info

| Component | Version |
|-----------|---------|
| `@cloudflare/sandbox` | 0.6.3 |
| `@anthropic-ai/claude-agent-sdk` | 0.1.62 |
| `@google/genai` | 1.24.0 |
| Claude Model | claude-opus-4-5-20251101 |
| Gemini Model | gemini-3-pro-image-preview |

---

## Local Server (`server/`)

The local server provides an Express.js-based development environment that mirrors the Cloudflare deployment.

### Local vs Cloudflare Comparison

| Aspect | Local (`server/`) | Cloudflare (`creative-agent-cf/`) |
|--------|-------------------|-----------------------------------|
| **Runtime** | Node.js + Express | Cloudflare Worker + Sandbox |
| **Port** | 3001 | Edge (workers.dev) |
| **Storage** | Filesystem (`sessions/`, `generated-images/`) | D1 + R2 |
| **Agent Path** | `../agent/.claude/` | `/workspace/agent/.claude/` |
| **Output Path** | `agent/files/` | `/storage/` (R2 mount) |
| **Session Mgmt** | `SessionManager` class (JSON files) | D1 database |
| **SDK Version** | 0.1.54 | 0.1.62 |

### Local Directory Structure

```
server/
├── sdk-server.ts             # Express server (main entry)
├── lib/
│   ├── ai-client.ts          # SDK wrapper with session support
│   ├── session-manager.ts    # JSON-file session persistence
│   ├── nano-banana-mcp.ts    # Gemini MCP (same as CF)
│   ├── orchestrator-prompt.ts # System prompt (similar to CF)
│   └── instrumentor.ts       # Cost tracking & metrics
├── sessions/                 # Session JSON files
├── generated-images/         # Output images
└── package.json
```

### Local API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/generate` | Main generation (same as CF) |
| `POST` | `/test` | Debug/test with verbose logging |
| `GET` | `/sessions` | List active sessions |
| `GET` | `/sessions/:id` | Get session details |
| `POST` | `/sessions/:id/continue` | Continue session |
| `POST` | `/sessions/:id/fork` | Fork for A/B testing |
| `GET` | `/sessions/:id/family` | Get fork tree |
| `GET` | `/images` | List all generated images |
| `GET` | `/images/:session/:file` | Serve image |
| `GET` | `/health` | Health check |
| `POST` | `/debug/orchestrator-skill` | Debug skill access |
| `POST` | `/debug/skill-access` | Debug subagent skills |

### Running Locally

```bash
cd server
npm run dev              # Watch mode with hot reload
npm run start            # Production mode
```

### Local File Paths (vs Cloudflare)

| File Type | Local Path | Cloudflare Path |
|-----------|------------|-----------------|
| Research | `agent/files/research/{brand}_research.md` | `/storage/research/{brand}_research.md` |
| Hooks | `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md` | `/storage/hooks/{brand}-{date}.md` |
| Prompts | `agent/files/creatives/{brand}_prompts.json` | `/storage/creatives/{brand}_prompts.json` |
| Images | `generated-images/{sessionId}/` | `/storage/images/{sessionId}/` |
| Sessions | `server/sessions/{id}.json` | D1 `sessions` table |

### Key Differences in ai-client.ts

```typescript
// Local: Points to agent/ directory relative to server/
const projectRoot = resolve(process.cwd(), '..', 'agent');

this.defaultOptions = {
  cwd: projectRoot,                      // agent/ directory
  model: 'claude-opus-4-5-20251101',
  maxTurns: 30,
  settingSources: ['user', 'project'],   // Load from .claude/
  allowedTools: [...],                   // Same tools as CF
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
  mcpServers: { "nano-banana": nanoBananaMcpServer }
};
```

### Session Manager (Local Only)

The local server uses a `SessionManager` class for persistence:

```typescript
// Sessions stored as JSON files
server/sessions/
├── session_abc123.json
├── session_def456.json
└── campaign-1702500000.json

// Session structure
{
  "id": "session_abc123",
  "sdkSessionId": "sdk_xyz789",      // SDK's internal session ID
  "createdAt": "2025-12-18T...",
  "lastAccessedAt": "2025-12-18T...",
  "metadata": {
    "status": "active",
    "messageCount": 45,
    "forkedFrom": null               // For fork sessions
  },
  "messages": [...],                 // Full message history
  "turnCount": 12
}
```

### Forking Sessions (Local Feature)

The local server supports session forking for A/B testing:

```bash
# Create base campaign
POST /generate
{ "prompt": "Create ads for https://example.com" }
# Returns: sessionId = "campaign-123"

# Fork for variant
POST /sessions/campaign-123/fork
{
  "prompt": "Try emotional angle instead",
  "purpose": "emotional-variant"
}
# Returns: new sessionId with link to parent

# View fork tree
GET /sessions/campaign-123/family
# Returns: base session + all forks
```

### Async Generator Pattern (Critical)

Both local and Cloudflare use the same async generator pattern for MCP tools:

```typescript
// server/lib/ai-client.ts - createPromptGenerator()
private async *createPromptGenerator(promptText: string, signal?: AbortSignal) {
  yield {
    type: "user",
    message: { role: "user", content: promptText },
    parent_tool_use_id: null
  };

  // CRITICAL: Keep generator alive for MCP tools
  if (signal) {
    await new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve());
    });
  } else {
    await new Promise<void>(() => {}); // Never resolves - SDK closes when done
  }
}
```

### When to Use Local vs Cloudflare

| Use Case | Recommendation |
|----------|----------------|
| Development & debugging | Local (`server/`) |
| Testing new agents/skills | Local |
| Production API | Cloudflare |
| Session forking/A/B tests | Local (better support) |
| Long-running campaigns | Cloudflare (better reliability) |
| Cost tracking/instrumentation | Local (detailed metrics) |

### Syncing Changes Between Local and Cloudflare

When making changes, update both locations:

| Component | Local Location | CF Location |
|-----------|----------------|-------------|
| System prompt | `server/lib/orchestrator-prompt.ts` | `creative-agent-cf/sandbox/orchestrator-prompt.ts` |
| MCP tool | `server/lib/nano-banana-mcp.ts` | `creative-agent-cf/sandbox/nano-banana-mcp.ts` |
| Agent specs | `agent/.claude/agents/` | `creative-agent-cf/agent/.claude/agents/` |
| Skills | `agent/.claude/skills/` | `creative-agent-cf/agent/.claude/skills/` |

**Note:** The `agent/` directory is the source of truth. Copy to `creative-agent-cf/agent/` when deploying.
