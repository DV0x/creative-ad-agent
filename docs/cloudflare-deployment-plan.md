# Cloudflare Deployment Plan for Creative Agent

## Overview

Deploy the creative ad agent to Cloudflare using:
- **Cloudflare Workers** - API gateway and routing
- **Cloudflare Sandbox** - Agent execution environment
- **Cloudflare R2** - Image and file storage
- **Cloudflare D1** - Session metadata (SQLite)

## Architecture

```
                    ┌──────────────────────────────────────────────────────┐
                    │                   Cloudflare Edge                     │
                    │                                                       │
┌──────────┐        │  ┌─────────────┐     ┌─────────────────────────────┐ │
│  Client  │───────▶│  │   Worker    │────▶│    Sandbox (Container)      │ │
│          │        │  │ (API Layer) │     │                             │ │
└──────────┘        │  │             │     │  ┌───────────────────────┐  │ │
                    │  │ - Routing   │     │  │  Claude Agent SDK     │  │ │
                    │  │ - Auth      │     │  │  - Orchestrator       │  │ │
                    │  │ - Sessions  │     │  │  - Research Agent     │  │ │
                    │  └──────┬──────┘     │  │  - Skills             │  │ │
                    │         │            │  │  - MCP Tools          │  │ │
                    │         │            │  └───────────────────────┘  │ │
                    │         │            │              │               │ │
                    │         ▼            │              ▼               │ │
                    │  ┌─────────────┐     │     ┌───────────────┐       │ │
                    │  │     D1      │     │     │  R2 (mounted) │       │ │
                    │  │  (Sessions) │     │     │   /storage    │       │ │
                    │  └─────────────┘     │     └───────────────┘       │ │
                    │                      └─────────────────────────────┘ │
                    └──────────────────────────────────────────────────────┘
```

## Key Concepts

### Why This Architecture?

| Component | Role | Why Needed |
|-----------|------|------------|
| **Worker** | HTTP routing, auth | Fast, cheap ($0.50/million req), runs at edge (300+ locations) |
| **Sandbox** | Run Agent SDK | Full Node.js environment, can run for minutes, file system access |
| **R2** | Image storage | Zero egress fees, mounted as `/storage/` in sandbox |
| **D1** | Session metadata | SQLite, cheap, integrated with Workers |

### Flow

```
1. User calls POST /generate
2. Cloudflare Worker receives request
3. Worker gets/creates a Sandbox for this session
4. Worker runs: sandbox.exec('npx tsx /workspace/agent-runner.ts')
5. agent-runner.ts uses Agent SDK (query()) + MCP tools
6. Agent executes: research → hooks → art → images
7. Images saved to /storage/ (R2 bucket)
8. Worker saves session to D1
9. Worker returns results to user
```

---

## Implementation Steps

### Phase 1: Cloudflare Project Setup

#### 1.1 Create Cloudflare Sandbox Project
```bash
# Create from Claude Code template
npm create cloudflare@latest -- creative-agent-cf \
  --template=cloudflare/sandbox-sdk/examples/claude-code

cd creative-agent-cf
```

#### 1.2 Configure `wrangler.jsonc`
```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",

  // Sandbox container configuration
  "containers": [{
    "class_name": "Sandbox",
    "image": "./Dockerfile",
    "instance_type": "standard",  // More resources for agent tasks
    "max_instances": 10           // Scale based on usage
  }],

  // Durable Objects for sandbox state
  "durable_objects": {
    "bindings": [{
      "name": "Sandbox",
      "class_name": "Sandbox"
    }]
  },

  // D1 database for session metadata
  "d1_databases": [{
    "binding": "DB",
    "database_name": "creative-agent-sessions",
    "database_id": "<will be created>"
  }],

  // R2 bucket for file storage
  "r2_buckets": [{
    "binding": "STORAGE",
    "bucket_name": "creative-agent-storage"
  }],

  // Environment variables
  "vars": {
    "ENVIRONMENT": "production"
  },

  "migrations": [{
    "tag": "v1",
    "new_sqlite_classes": ["Sandbox"]
  }]
}
```

#### 1.3 Create Custom Dockerfile
```dockerfile
FROM ghcr.io/cloudflare/sandbox-base:latest

# Install Node.js 20
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create workspace
WORKDIR /workspace

# Copy package.json and install Agent SDK + dependencies
COPY sandbox/package.json /workspace/
RUN npm install

# Copy agent files (agents, skills, prompts)
COPY agent/ /workspace/agent/

# Copy the agent runner and MCP tools
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/nano-banana-mcp.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/
```

#### 1.4 Create `sandbox/package.json`
```json
{
  "name": "creative-agent-sandbox",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.54",
    "@google/genai": "^1.24.0",
    "zod": "^3.22.4",
    "tsx": "^4.7.0"
  }
}
```

#### 1.5 Create `sandbox/agent-runner.ts` (Runs inside sandbox)
```typescript
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Import your existing MCP tool logic
import { generateAdImages } from "./nano-banana-mcp";
import { orchestratorPrompt } from "./orchestrator-prompt";

// Create MCP server (same as your current setup)
const nanoBananaMcp = createSdkMcpServer({
  name: "nano-banana",
  version: "1.0.0",
  tools: [
    tool(
      "generate_ad_images",
      "Generate ad images using Gemini",
      { prompts: z.array(z.string()) },
      async ({ prompts }) => generateAdImages(prompts)
    )
  ]
});

// Main runner
async function main() {
  const prompt = process.env.PROMPT!;
  const sessionId = process.env.SESSION_ID!;

  const messages: any[] = [];

  for await (const message of query({
    prompt,
    options: {
      // Working directory (where .claude/agents and .claude/skills live)
      cwd: '/workspace/agent',

      // System prompt: Use Claude Code preset + append our orchestrator prompt
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: orchestratorPrompt
      },

      // Load agents/skills from .claude/ directory
      settingSources: ['project'],

      // MCP servers (image generation)
      mcpServers: { 'nano-banana': nanoBananaMcp },

      // Model settings
      model: 'claude-sonnet-4-20250514',
      maxTurns: 30,

      // Permission mode: bypass since we're in sandboxed container
      permissionMode: 'bypassPermissions',

      // SDK-level sandbox: Extra security layer for bash commands
      // (This is IN ADDITION to Cloudflare's container sandbox)
      sandbox: {
        enabled: true,
        autoAllowBashIfSandboxed: true,  // Auto-approve bash since sandboxed
        network: {
          allowLocalBinding: true,  // Allow local servers if needed
        }
      },

      // Restrict to only the tools our agent needs
      // This prevents unexpected tool usage and improves reliability
      allowedTools: [
        // Core agent tools
        'Task',           // Launch subagents (research agent)
        'Skill',          // Use skills (hook-methodology, art-style)
        'TodoWrite',      // Track progress

        // File operations
        'Read',           // Read files
        'Write',          // Write files (research, prompts)
        'Edit',           // Edit files
        'Glob',           // Find files by pattern
        'Grep',           // Search file contents

        // System
        'Bash',           // Run shell commands

        // Web (for research agent)
        'WebFetch',       // Fetch URL content
        'WebSearch',      // Search the web

        // MCP tool (image generation)
        'mcp__nano-banana__generate_ad_images'
      ]
    }
  })) {
    messages.push(message);

    // Output progress for streaming (goes to stderr)
    if (message.type === 'assistant') {
      console.error(`[progress] ${JSON.stringify(message)}`);
    }
  }

  // Final output (goes to stdout, parsed by Worker)
  console.log(JSON.stringify({
    sessionId,
    messages,
    result: messages.find(m => m.type === 'result')
  }));
}

main().catch(console.error);
```

**SDK Settings Explained:**

| Setting | Value | Purpose |
|---------|-------|---------|
| `permissionMode: 'bypassPermissions'` | Bypass | We're in a sandboxed container, no need for permission prompts |
| `sandbox.enabled: true` | On | Extra security layer for bash command execution |
| `sandbox.autoAllowBashIfSandboxed` | True | Auto-approve bash since SDK sandbox is enabled |
| `allowedTools` | Whitelist | Only allow tools the agent actually needs |
| `settingSources: ['project']` | Project | Load .claude/agents and .claude/skills from cwd |

---

### Phase 2: Worker Implementation

#### 2.1 Create Worker Entry Point (`src/index.ts`)
```typescript
import { getSandbox, proxyToSandbox, type Sandbox } from "@cloudflare/sandbox";
export { Sandbox } from "@cloudflare/sandbox";

interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  DB: D1Database;
  STORAGE: R2Bucket;
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  CF_ACCOUNT_ID: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle sandbox proxy (for preview URLs if needed)
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Route based on path
    try {
      switch (url.pathname) {
        case "/health":
          return Response.json({ status: "ok", timestamp: new Date().toISOString() }, { headers: corsHeaders });

        case "/generate":
          if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
          }
          return handleGenerate(request, env, ctx, corsHeaders);

        case "/sessions":
          return handleSessionsList(env, corsHeaders);

        default:
          // Handle /sessions/:id routes
          if (url.pathname.startsWith("/sessions/")) {
            return handleSessionRoute(request, env, url, corsHeaders);
          }
          // Handle /images routes
          if (url.pathname.startsWith("/images/")) {
            return handleImageRoute(request, env, url);
          }
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      console.error("Error:", error);
      return Response.json({ error: String(error) }, { status: 500, headers: corsHeaders });
    }
  }
};
```

#### 2.2 Generate Handler (`src/handlers/generate.ts`)
```typescript
async function handleGenerate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { prompt, sessionId } = await request.json();

  // Get or create sandbox for this session
  const sandboxId = sessionId || crypto.randomUUID();
  const sandbox = getSandbox(env.Sandbox, sandboxId);

  // Mount R2 for persistent storage (images, research files)
  await sandbox.mountBucket("creative-agent-storage", "/storage", {
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`
  });

  // Create output directory for this session
  await sandbox.exec(`mkdir -p /storage/images/${sandboxId}`);

  // Run the agent-runner.ts script (uses Agent SDK inside sandbox)
  const result = await sandbox.exec('npx tsx /workspace/agent-runner.ts', {
    env: {
      PROMPT: prompt,
      SESSION_ID: sandboxId,
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      GEMINI_API_KEY: env.GEMINI_API_KEY
    },
    timeout: 600000,  // 10 min timeout for long agent runs
    stream: true,
    onOutput: (stream, data) => {
      // Could stream progress to client via SSE/WebSocket
      console.log(`[${stream}] ${data}`);
    }
  });

  if (!result.success) {
    return Response.json({
      error: "Agent execution failed",
      stderr: result.stderr
    }, { status: 500, headers: corsHeaders });
  }

  // Parse the JSON result from agent-runner
  const output = JSON.parse(result.stdout);

  // Save session to D1
  await env.DB.prepare(`
    INSERT OR REPLACE INTO sessions (id, created_at, updated_at, data)
    VALUES (?, datetime('now'), datetime('now'), ?)
  `).bind(sandboxId, JSON.stringify(output)).run();

  // List generated images from R2-mounted path
  const imageList = await sandbox.exec(`ls /storage/images/${sandboxId} 2>/dev/null || echo ""`);
  const images = imageList.stdout.split('\n').filter(Boolean).map(
    filename => `/images/${sandboxId}/${filename}`
  );

  return Response.json({
    sessionId: sandboxId,
    result: output.result,
    messages: output.messages,
    images
  }, { headers: corsHeaders });
}
```

#### 2.3 Session Handlers (`src/handlers/sessions.ts`)
```typescript
async function handleSessionsList(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const result = await env.DB.prepare(`
    SELECT id, created_at, updated_at, status, campaign_name, brand_url
    FROM sessions
    ORDER BY created_at DESC
    LIMIT 100
  `).all();

  return Response.json({ sessions: result.results }, { headers: corsHeaders });
}

async function handleSessionRoute(
  request: Request,
  env: Env,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parts = url.pathname.split('/');
  const sessionId = parts[2];
  const action = parts[3];

  if (request.method === "GET" && !action) {
    // GET /sessions/:id
    const result = await env.DB.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).bind(sessionId).first();

    if (!result) {
      return Response.json({ error: "Session not found" }, { status: 404, headers: corsHeaders });
    }

    return Response.json({ session: result }, { headers: corsHeaders });
  }

  if (request.method === "POST" && action === "continue") {
    // POST /sessions/:id/continue
    const { prompt } = await request.json();
    // Resume session with new prompt...
    // Similar to handleGenerate but with resume option
  }

  if (request.method === "POST" && action === "fork") {
    // POST /sessions/:id/fork
    // Create a forked session...
  }

  return new Response("Not Found", { status: 404 });
}
```

#### 2.4 Image Handler (`src/handlers/images.ts`)
```typescript
async function handleImageRoute(request: Request, env: Env, url: URL): Promise<Response> {
  // URL: /images/:sessionId/:filename
  const parts = url.pathname.split('/');
  const sessionId = parts[2];
  const filename = parts[3];

  const key = `images/${sessionId}/${filename}`;
  const object = await env.STORAGE.get(key);

  if (!object) {
    return new Response("Image not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType || "image/png");
  headers.set("Cache-Control", "public, max-age=31536000");

  return new Response(object.body, { headers });
}
```

---

### Phase 3: Database Schema

#### 3.1 D1 Schema (`schema.sql`)
```sql
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  campaign_name TEXT,
  brand_url TEXT,
  data JSON,
  parent_session_id TEXT,
  FOREIGN KEY (parent_session_id) REFERENCES sessions(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_parent ON sessions(parent_session_id);

-- Campaigns table for tracking
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  name TEXT,
  brand_url TEXT,
  hooks_generated INTEGER DEFAULT 0,
  images_generated INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

---

### Phase 4: Agent Files Migration

#### 4.1 Files to Copy to Sandbox Image
```
agent/
├── .claude/
│   ├── agents/
│   │   └── research.md          # Research agent definition
│   └── skills/
│       ├── hook-methodology/    # Hook generation skill
│       └── art-style/           # Art style skill
├── files/
│   ├── research/                # Research outputs (will use R2)
│   └── creatives/               # Prompt files (will use R2)
└── orchestrator-prompt.md       # Main orchestrator prompt
```

#### 4.2 Update File Paths for R2
Modify agent files to use `/storage/` path prefix:
- Research saves to `/storage/research/{brand}_research.md`
- Prompts save to `/storage/creatives/{brand}_prompts.json`
- Images save to `/storage/images/{sessionId}/`

---

### Phase 5: MCP Tool Setup

#### 5.1 Nano-Banana MCP Tool (Kept as-is)
The MCP tool uses `createSdkMcpServer()` which runs in-process with the Agent SDK.
Just copy and adapt the file path:

```typescript
// sandbox/nano-banana-mcp.ts - Copy from server/lib/nano-banana-mcp.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs/promises";
import * as path from "path";

export async function generateAdImages(prompts: string[]): Promise<{ content: Array<{ type: string; text: string }> }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const sessionId = process.env.SESSION_ID!;

  // Output to R2-mounted path
  const outputDir = `/storage/images/${sessionId}`;
  await fs.mkdir(outputDir, { recursive: true });

  const generatedPaths: string[] = [];

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];

    // Call Gemini API...
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);

    // Save image to R2-mounted path
    const filename = `ad_${i + 1}.png`;
    const filepath = path.join(outputDir, filename);
    // ... save image data

    generatedPaths.push(filepath);
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ success: true, images: generatedPaths })
    }]
  };
}
```

---

### Phase 6: Deployment

#### 6.1 Create Cloudflare Resources
```bash
# Create D1 database
npx wrangler d1 create creative-agent-sessions
# Note the database_id and update wrangler.jsonc

# Create R2 bucket
npx wrangler r2 bucket create creative-agent-storage
```

#### 6.2 Add Secrets
```bash
npx wrangler secret put ANTHROPIC_API_KEY
# Enter your Anthropic API key when prompted

npx wrangler secret put GEMINI_API_KEY
# Enter your Gemini API key when prompted
```

#### 6.3 Initialize Database
```bash
npx wrangler d1 execute creative-agent-sessions --file=schema.sql
```

#### 6.4 Deploy
```bash
npx wrangler deploy
```

#### 6.5 Wait for Container Provisioning
After first deployment, wait 2-3 minutes for container provisioning.
Check status:
```bash
npx wrangler containers list
```

---

## API Endpoints (Cloudflare Worker)

| Endpoint | Method | Response | Description |
|----------|--------|----------|-------------|
| `/health` | GET | JSON | Health check |
| `/generate` | POST | **SSE Stream** | Generate campaign (streams real-time events) |
| `/sessions` | GET | JSON | List all sessions |
| `/sessions/:id` | GET | JSON | Get session details |
| `/sessions/:id/continue` | POST | SSE Stream | Continue session with new prompt |
| `/sessions/:id/fork` | POST | SSE Stream | Fork session for A/B testing |
| `/images/:sessionId/:filename` | GET | Binary | Serve image from R2 |

### `/generate` SSE Response Format

```bash
# Request
curl -N -X POST https://creative-agent.alphasapien17.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create ads for https://example.com"}'

# Response (Server-Sent Events stream)
data: {"type":"start","sessionId":"uuid","timestamp":"ISO8601"}
data: {"type":"stdout","data":"...agent output...","sessionId":"uuid"}
data: {"type":"stderr","data":"[agent-runner] Starting...","sessionId":"uuid"}
data: {"type":"complete","exitCode":0,"sessionId":"uuid"}
data: {"type":"done","sessionId":"uuid","success":true}
```

**Event Types:**
- `start` - Stream started
- `stdout` - Standard output from agent-runner
- `stderr` - Logging/progress from agent-runner
- `complete` - Command finished with exit code
- `done` - Stream complete, results saved to D1
- `error` - Error occurred

---

## Cost Estimate

| Resource | Usage (10-100 users/day) | Estimated Cost |
|----------|--------------------------|----------------|
| Workers | ~50k requests/month | ~$5/month |
| Sandbox (Containers) | ~100 hours/month | ~$5/month |
| R2 Storage | ~10GB | ~$0.15/month |
| D1 Database | ~1M rows read | ~$0.50/month |
| **Total Cloudflare** | | **~$10-15/month** |
| Anthropic API | ~500 campaigns | Variable |
| Gemini API | ~3000 images | Variable |

---

## Project Structure

### New Files (Cloudflare Project)
```
creative-agent-cf/
├── wrangler.jsonc              # Cloudflare config (Workers, D1, R2, Containers)
├── Dockerfile                  # Sandbox container image
├── schema.sql                  # D1 database schema
├── src/
│   ├── index.ts                # Worker entry point (HTTP routing)
│   └── handlers/
│       ├── generate.ts         # POST /generate handler
│       ├── sessions.ts         # Session CRUD handlers
│       └── images.ts           # Image serving from R2
└── sandbox/
    ├── package.json            # Agent SDK dependencies
    ├── agent-runner.ts         # Main script that uses Agent SDK
    ├── nano-banana-mcp.ts      # MCP tool (copied from server/lib/)
    └── orchestrator-prompt.ts  # System prompt (copied from server/lib/)
```

### Files to Copy (No changes needed)
- `agent/.claude/agents/` - Research agent definition
- `agent/.claude/skills/` - Hook methodology and art style skills
- `agent/files/` - Any static files needed

### Files to Adapt (Minor path changes)
- `server/lib/nano-banana-mcp.ts` → `sandbox/nano-banana-mcp.ts`
  - Change output path from `./generated-images/` to `/storage/images/`
- `server/lib/orchestrator-prompt.ts` → `sandbox/orchestrator-prompt.ts`
  - No logic changes needed

---

## Testing Plan

1. **Local Development**
   ```bash
   npm run dev  # Note: R2 mounting won't work locally
   ```

2. **Deploy to Staging**
   ```bash
   npx wrangler deploy --env staging
   ```

3. **Test Endpoints**
   ```bash
   # Health check
   curl https://creative-agent.YOUR_SUBDOMAIN.workers.dev/health

   # Generate campaign
   curl -X POST https://creative-agent.YOUR_SUBDOMAIN.workers.dev/generate \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Create ads for https://example.com"}'
   ```

---

## Rollback Plan

If issues arise:
1. Keep the local Express server running as fallback
2. Use Cloudflare's deployment rollback: `npx wrangler rollback`
3. Sessions in D1 can be exported/imported if needed

---

## Implementation Log (Dec 2024)

### Completed

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | ✅ Done | Project structure created |
| Phase 2 | ✅ Done | Worker + handlers implemented |
| Phase 3 | ✅ Done | D1 schema with 6 tables |
| Phase 4 | ✅ Done | Agent files migrated with R2 paths |
| Phase 5 | ✅ Done | MCP tool adapted |
| Phase 6 | ✅ Done | Deployed with streaming SSE response |

### Issues Encountered & Fixes

#### 1. Wrong Wrangler Version
**Error:** `"containers" should be an object, but got an array`
**Cause:** Wrangler 3.x doesn't support containers properly
**Fix:** Update to wrangler 4.x
```bash
npm install wrangler@4 --save-dev
```

#### 2. Wrong Docker Base Image
**Error:** `403 Forbidden` when pulling `ghcr.io/cloudflare/sandbox-base:latest`
**Cause:** Image doesn't exist at that registry
**Fix:** Use Docker Hub image instead
```dockerfile
# Wrong
FROM ghcr.io/cloudflare/sandbox-base:latest

# Correct
FROM docker.io/cloudflare/sandbox:0.3.3
```

#### 3. Instance Type Renamed
**Warning:** `"standard" instance_type has been renamed to "standard-1"`
**Fix:** Update wrangler.jsonc
```jsonc
"instance_type": "standard-1"  // Not "standard"
```

#### 4. Missing Compatibility Flag
**Fix:** Add nodejs_compat flag
```jsonc
"compatibility_flags": ["nodejs_compat"]
```

#### 5. SDK Version Mismatch (CURRENT BLOCKER)
**Error:** `The RPC receiver does not implement the method "mountBucket"`
**Cause:** `@cloudflare/sandbox@0.1.4` doesn't have `mountBucket`
**Fix:** Update to matching versions
```json
// package.json
"@cloudflare/sandbox": "^0.3.3"
```
```dockerfile
FROM docker.io/cloudflare/sandbox:0.3.3
```

#### 6. R2 Credentials Required for mountBucket
**Cause:** `mountBucket` needs S3-compatible credentials
**Fix:** Create R2 API token and add secrets
```bash
# Create R2 API token in Cloudflare Dashboard
# Dashboard → R2 → Manage R2 API Tokens

npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY
```

#### 7. SDK Version 0.1.4 → 0.6.3 (Dec 10, 2025)
**Error:** `The RPC receiver does not implement the method "mountBucket"`
**Cause:** npm installed old version despite package.json specifying ^0.3.3
**Fix:**
```bash
npm install @cloudflare/sandbox@latest --save
# Installed 0.6.3
```

#### 8. mountBucket Credentials Format
**Error:** Still getting mountBucket RPC error after SDK update
**Cause:** Credentials must be nested in `credentials` object
**Fix:** Update generate.ts:
```typescript
await sandbox.mountBucket("creative-agent-storage", "/storage", {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  provider: "r2",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
```

#### 9. Dockerfile Version Mismatch
**Error:** `SandboxError: HTTP error! status: 500`
**Cause:** Dockerfile used `cloudflare/sandbox:0.3.3` but SDK was `0.6.3`
**Fix:** Update Dockerfile to match:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.6.3
```

#### 10. Claude Agent SDK Requires Claude Code CLI (RESOLVED - Dec 10, 2025)
**Error:** `Claude Code process exited with code 1`
**Cause:** The `@anthropic-ai/claude-agent-sdk` spawns Claude Code CLI as a subprocess. The CLI wasn't installed in the container.

**Fix Applied:**
```dockerfile
# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Non-interactive mode environment variables
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
ENV TERM=dumb
ENV NO_COLOR=1

# Pre-configure for non-interactive use (ackTosVersion: 2)
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true, "theme": "dark"}' > /root/.claude/settings.json && \
    chmod 600 /root/.claude/settings.json
```

**Status:** ✅ RESOLVED - Claude SDK now works, agent responds correctly

#### 11. Worker Timeout / 502 Bad Gateway (RESOLVED - Dec 10, 2025)
**Error:** `502 Bad Gateway` after ~15 seconds, request shows as "Canceled"
**Cause:** Using `sandbox.exec()` which **blocks** until command completes. Long-running agent tasks exceed Worker timeout.

**Root Cause Analysis:**
- `exec()` - Blocks until completion → Worker timeout
- `execStream()` - Returns immediately with ReadableStream → No timeout

**Fix (per Cloudflare Sandbox SDK docs):**
```typescript
// WRONG - blocks until completion
const result = await sandbox.exec("npx tsx agent-runner.ts");

// CORRECT - returns immediately with streaming response
const stream = await sandbox.execStream("npx tsx agent-runner.ts");
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

**Status:** ✅ RESOLVED - Using `execStream()` with SSE response

#### 12. agent-runner.ts Pattern Mismatch (RESOLVED - Dec 10, 2025)
**Issue:** Cloudflare implementation differed from working local implementation
**Fixes Applied:**
1. Added async generator pattern for prompt (required for MCP tools)
2. Added SDK `sandbox` option for bash command sandboxing
3. Added `permissionMode: 'bypassPermissions'` (valid for CI per docs)
4. Added AbortController for proper cleanup
5. Generated `sandbox/package-lock.json` for deterministic builds

**Status:** ✅ RESOLVED

### Correct Configuration (Updated Dec 10, 2025)

#### wrangler.jsonc
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
    "bindings": [{
      "name": "Sandbox",
      "class_name": "Sandbox"
    }]
  },

  "d1_databases": [{
    "binding": "DB",
    "database_name": "creative-agent-sessions",
    "database_id": "009b3a45-168a-4138-bd09-e7fbcb42c184"
  }],

  "r2_buckets": [{
    "binding": "STORAGE",
    "bucket_name": "creative-agent-storage"
  }],

  "vars": {
    "ENVIRONMENT": "production",
    "CF_ACCOUNT_ID": "091650847ca6a1d9bb40bee044dfdc91"
  },

  "migrations": [{
    "tag": "v1",
    "new_sqlite_classes": ["Sandbox"]
  }]
}
```

#### Dockerfile
```dockerfile
FROM docker.io/cloudflare/sandbox:0.6.3

# Install Node.js 20
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Set HOME for Claude Code config storage
ENV HOME=/root

# Install Claude Code CLI globally (required by Agent SDK)
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure Claude Code for non-interactive use
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 1, "hasCompletedOnboarding": true}' > /root/.claude/settings.json && \
    chmod 600 /root/.claude/settings.json

WORKDIR /workspace

COPY sandbox/package.json /workspace/
RUN npm install

COPY agent/ /workspace/agent/
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/nano-banana-mcp.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/
```

#### package.json (Worker - creative-agent-cf/)
```json
{
  "dependencies": {
    "@cloudflare/sandbox": "^0.6.3"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20241205.0",
    "typescript": "^5.3.3",
    "wrangler": "^4.53.0"
  }
}
```

#### sandbox/package.json (Inside Container)
```json
{
  "name": "creative-agent-sandbox",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.62",
    "@google/genai": "^1.24.0",
    "zod": "^3.22.4",
    "tsx": "^4.7.0"
  }
}
```

### Current Status (Updated Dec 10, 2025)

**✅ ALL MAJOR BLOCKERS RESOLVED:**
- [x] R2 API token created
- [x] AWS_ACCESS_KEY_ID secret added
- [x] AWS_SECRET_ACCESS_KEY secret added
- [x] R2 mountBucket working
- [x] Claude Code CLI installed in container (v2.0.62)
- [x] Claude Agent SDK working (responds to prompts)
- [x] Worker timeout fixed with `execStream()`
- [x] API returns SSE stream for real-time updates
- [x] agent-runner.ts matches working local pattern

**🎉 DEPLOYMENT WORKING!**

Test command:
```bash
# -N flag disables buffering to see SSE events in real-time
curl -N -X POST https://creative-agent.alphasapien17.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create ads for https://example.com"}'
```

**📋 API Response Format (SSE Stream):**
```
data: {"type":"start","sessionId":"abc123","timestamp":"..."}
data: {"type":"stdout","data":"...","sessionId":"abc123"}
data: {"type":"stderr","data":"[agent-runner] Starting...","sessionId":"abc123"}
data: {"type":"complete","exitCode":0,"sessionId":"abc123"}
data: {"type":"done","sessionId":"abc123","success":true}
```

**📋 SECRETS CONFIGURED:**
```bash
npx wrangler secret list
# ANTHROPIC_API_KEY ✓
# GEMINI_API_KEY ✓
# AWS_ACCESS_KEY_ID ✓
# AWS_SECRET_ACCESS_KEY ✓
```

### Environment Variables & Secrets

```typescript
// src/index.ts - Env interface
export interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  DB: D1Database;
  STORAGE: R2Bucket;
  ANTHROPIC_API_KEY: string;      // Secret
  GEMINI_API_KEY: string;         // Secret
  AWS_ACCESS_KEY_ID: string;      // Secret (R2 S3 credentials)
  AWS_SECRET_ACCESS_KEY: string;  // Secret (R2 S3 credentials)
  CF_ACCOUNT_ID: string;          // Var in wrangler.jsonc
  ENVIRONMENT: string;            // Var in wrangler.jsonc
}
```

### Deployed Resources

| Resource | ID/URL |
|----------|--------|
| Worker URL | https://creative-agent.alphasapien17.workers.dev |
| D1 Database | `009b3a45-168a-4138-bd09-e7fbcb42c184` |
| R2 Bucket | `creative-agent-storage` |
| Container App | `a038a938-e589-4994-8cf2-35b9f8f82749` |
| Account ID | `091650847ca6a1d9bb40bee044dfdc91` |
| Claude Code (container) | v2.0.62 |
| Sandbox SDK | v0.6.3 |
| Agent SDK | v0.1.62 |
