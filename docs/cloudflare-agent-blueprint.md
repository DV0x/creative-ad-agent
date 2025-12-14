# Cloudflare Sandbox Agent Blueprint

> A reusable guide for deploying Claude Agent SDK agents to Cloudflare Workers + Sandbox containers.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Critical Configuration](#critical-configuration)
6. [File Templates](#file-templates)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Cloudflare Edge                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │   HTTP Request  │───▶│  Worker (index) │───▶│  Sandbox (DO)   │     │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘     │
│                                │                        │               │
│                                ▼                        ▼               │
│                         ┌───────────┐          ┌─────────────────┐     │
│                         │ D1 (SQL)  │          │ Container       │     │
│                         │ Sessions  │          │ ┌─────────────┐ │     │
│                         └───────────┘          │ │agent-runner │ │     │
│                                                │ │  (SDK)      │ │     │
│                         ┌───────────┐          │ └─────────────┘ │     │
│                         │R2 (Files) │◀─────────│ /storage mount  │     │
│                         │ Images    │          └─────────────────┘     │
│                         └───────────┘                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Components:**
- **Worker**: HTTP API, routing, SSE streaming
- **Sandbox (Durable Object)**: Container orchestration, session state
- **Container**: Claude Agent SDK execution environment
- **D1**: Session metadata, results storage
- **R2**: File storage (images, research, outputs)

---

## Prerequisites

### Cloudflare Account Setup
- Cloudflare account with Workers Paid plan ($5/month minimum)
- Sandbox access enabled (may require waitlist)
- R2 bucket created
- D1 database created

### API Keys Required
- `ANTHROPIC_API_KEY` - Claude API access
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - R2 S3-compatible credentials

### Local Tools
```bash
npm install -g wrangler
wrangler login
```

---

## Project Structure

```
your-agent-cf/
├── src/                          # Worker code (runs on edge)
│   ├── index.ts                  # Entry point, routing
│   └── handlers/
│       └── generate.ts           # Main endpoint
│
├── sandbox/                      # Container code (runs in sandbox)
│   ├── agent-runner.ts           # SDK orchestrator
│   ├── your-mcp-server.ts        # Custom MCP tools (optional)
│   ├── orchestrator-prompt.ts    # System prompt
│   ├── package.json              # Sandbox dependencies
│   └── tsconfig.json
│
├── agent/                        # Agent configuration (copied to container)
│   └── .claude/
│       ├── agents/               # Subagent definitions
│       └── skills/               # Skill definitions
│
├── Dockerfile                    # Container image
├── wrangler.jsonc               # Cloudflare configuration
├── schema.sql                   # D1 database schema
├── package.json                 # Worker dependencies
└── tsconfig.json
```

---

## Step-by-Step Setup

### 1. Create Project

```bash
mkdir your-agent-cf && cd your-agent-cf
npm init -y
```

### 2. Install Dependencies

**Worker (root package.json):**
```bash
npm install @cloudflare/sandbox
npm install -D wrangler typescript @types/node
```

**Sandbox (sandbox/package.json):**
```bash
cd sandbox
npm init -y
npm install @anthropic-ai/claude-agent-sdk zod tsx typescript
```

### 3. Create Cloudflare Resources

```bash
# Create D1 database
npx wrangler d1 create your-agent-sessions
# Note the database_id from output

# Create R2 bucket
npx wrangler r2 bucket create your-agent-storage

# Generate R2 API credentials (in Cloudflare Dashboard)
# R2 > Manage R2 API Tokens > Create API Token
# Save the Access Key ID and Secret Access Key
```

### 4. Set Secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY

# Optional: if using other APIs
npx wrangler secret put GEMINI_API_KEY
```

### 5. Initialize Database

```bash
npx wrangler d1 execute your-agent-sessions --file=schema.sql
```

### 6. Deploy

```bash
npx wrangler deploy
```

---

## Critical Configuration

### ⚠️ PITFALL #1: Permission Mode

**WRONG** - Causes exit code 1 in containers:
```typescript
permissionMode: 'bypassPermissions'
```

**CORRECT** - Works in containers:
```typescript
permissionMode: 'default',
canUseTool: async () => true,  // Auto-approve all tools
```

**Why:** `bypassPermissions` internally uses `--dangerously-skip-permissions` flag which Claude Code blocks in certain environments.

---

### ⚠️ PITFALL #2: Prompt Must Be Async Generator

**WRONG** - MCP tools with >1s execution will fail:
```typescript
query({ prompt: "Do something" })
```

**CORRECT** - Generator stays alive during tool execution:
```typescript
async function* createPromptGenerator(prompt: string, signal: AbortSignal) {
  yield {
    type: "user" as const,
    message: { role: "user" as const, content: prompt },
    parent_tool_use_id: null
  };

  // Keep alive until query completes
  await new Promise<void>(resolve => {
    signal.addEventListener('abort', () => resolve());
  });
}

const abortController = new AbortController();
const promptGenerator = createPromptGenerator(prompt, abortController.signal);

for await (const message of query({ prompt: promptGenerator, ... })) {
  // process messages
}

abortController.abort();  // Cleanup
```

**Why:** Long-running MCP tools (API calls) need the generator stream to remain open.

---

### ⚠️ PITFALL #3: Use execStream() Not exec()

**WRONG** - Blocks and causes 30s timeout:
```typescript
const result = await sandbox.exec("npx tsx agent-runner.ts");
```

**CORRECT** - Returns immediately with SSE stream:
```typescript
const execStream = await sandbox.execStream("npx tsx agent-runner.ts", {
  env: { ... },
  timeout: 600000  // 10 min
});

// Return SSE stream immediately
return new Response(readable, {
  headers: { 'Content-Type': 'text/event-stream' }
});

// Process in background
ctx.waitUntil(async () => {
  for await (const event of parseSSEStream(execStream)) {
    // forward to client
  }
});
```

---

### ⚠️ PITFALL #4: Pre-configure Claude Code

Claude Code will hang waiting for interactive prompts in containers.

**Dockerfile must include:**
```dockerfile
# Environment variables
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
ENV TERM=dumb
ENV NO_COLOR=1

# Pre-create settings file
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true}' > /root/.claude/settings.json
```

---

### ⚠️ PITFALL #5: R2 Mount Point Must Exist

**WRONG** - Mount fails:
```typescript
await sandbox.mountBucket("bucket", "/storage", { ... });
// Error: No such file or directory
```

**CORRECT** - Ensure directory exists:
```dockerfile
# In Dockerfile
RUN mkdir -p /storage
```

```typescript
// Or in Worker (belt and suspenders)
await sandbox.exec(`mkdir -p /storage`);
await sandbox.mountBucket("bucket", "/storage", { ... });
```

---

### ⚠️ PITFALL #6: Container Caching

Changes to Dockerfile may not take effect due to caching.

**Force clean rebuild:**
```bash
rm -rf node_modules .wrangler
docker builder prune -f
npm install
npx wrangler deploy
```

---

## File Templates

### wrangler.jsonc

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/schemas/config.schema.json",
  "name": "your-agent",
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
    "database_name": "your-agent-sessions",
    "database_id": "YOUR_DATABASE_ID"
  }],

  "r2_buckets": [{
    "binding": "STORAGE",
    "bucket_name": "your-agent-storage"
  }],

  "vars": {
    "ENVIRONMENT": "production",
    "CF_ACCOUNT_ID": "YOUR_ACCOUNT_ID"
  },

  "migrations": [{
    "tag": "v1",
    "new_sqlite_classes": ["Sandbox"]
  }]
}
```

---

### Dockerfile

```dockerfile
FROM docker.io/cloudflare/sandbox:0.6.3

# Install Node.js 20
RUN apt-get update && apt-get install -y curl git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configure for non-interactive execution
ENV HOME=/root
ENV CI=true
ENV CLAUDE_CODE_SKIP_EULA=true
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
ENV TERM=dumb
ENV NO_COLOR=1

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Pre-configure Claude Code
RUN mkdir -p /root/.claude && \
    echo '{"ackTosVersion": 2, "hasCompletedOnboarding": true}' > /root/.claude/settings.json

# Create directories
RUN mkdir -p /storage /workspace
WORKDIR /workspace

# Copy sandbox dependencies
COPY sandbox/package.json sandbox/package-lock.json /workspace/
RUN npm ci

# Copy agent configuration
COPY agent/ /workspace/agent/

# Copy agent runner
COPY sandbox/agent-runner.ts /workspace/
COPY sandbox/orchestrator-prompt.ts /workspace/
# COPY sandbox/your-mcp-server.ts /workspace/  # If using MCP
```

---

### src/index.ts (Worker Entry)

```typescript
import { getSandbox, proxyToSandbox, type Sandbox } from "@cloudflare/sandbox";
export { Sandbox } from "@cloudflare/sandbox";

export interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  DB: D1Database;
  STORAGE: R2Bucket;
  ANTHROPIC_API_KEY: string;
  CF_ACCOUNT_ID: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle sandbox proxy
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Routes
    if (url.pathname === "/health") {
      return Response.json({ status: "ok" }, { headers: corsHeaders });
    }

    if (url.pathname === "/generate" && request.method === "POST") {
      return handleGenerate(request, env, ctx, corsHeaders);
    }

    return new Response("Not Found", { status: 404, headers: corsHeaders });
  },
};
```

---

### src/handlers/generate.ts (Main Handler)

```typescript
import { getSandbox, parseSSEStream, type ExecEvent } from "@cloudflare/sandbox";
import type { Env } from "../index";

export async function handleGenerate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { prompt, sessionId: reqSessionId } = await request.json();
  const sessionId = reqSessionId || crypto.randomUUID();

  const sandbox = getSandbox(env.Sandbox, sessionId);

  // Ensure mount point exists
  await sandbox.exec(`mkdir -p /storage`);

  // Mount R2 bucket
  await sandbox.mountBucket("your-agent-storage", "/storage", {
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    provider: "r2",
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Create output directories
  await sandbox.exec(`mkdir -p /storage/output/${sessionId}`);

  // Run agent with execStream (non-blocking)
  const execStream = await sandbox.execStream("npx tsx /workspace/agent-runner.ts", {
    env: {
      PROMPT: prompt,
      SESSION_ID: sessionId,
      ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
      HOME: "/root",
      CI: "true",
      CLAUDE_CODE_SKIP_EULA: "true",
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "true",
      TERM: "dumb",
      NO_COLOR: "1",
    },
    timeout: 600000,
  });

  // Transform stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Process in background
  ctx.waitUntil((async () => {
    let stdout = '';
    try {
      for await (const event of parseSSEStream<ExecEvent>(execStream)) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ ...event, sessionId })}\n\n`));
        if (event.type === 'stdout') stdout += event.data;
      }

      // Save to D1
      await env.DB.prepare(`
        INSERT INTO sessions (id, status, data) VALUES (?, 'completed', ?)
      `).bind(sessionId, stdout).run();

    } finally {
      await writer.close();
    }
  })());

  // Return SSE stream immediately
  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

### sandbox/agent-runner.ts (SDK Orchestrator)

```typescript
import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

// Optional: MCP server for custom tools
const myMcpServer = createSdkMcpServer({
  name: "my-tools",
  version: "1.0.0",
  tools: [
    tool("my_tool", "Description", { param: z.string() }, async (args) => {
      return { content: [{ type: "text", text: "result" }] };
    })
  ]
});

// Async generator for prompt (CRITICAL)
async function* createPromptGenerator(prompt: string, signal: AbortSignal) {
  yield {
    type: "user" as const,
    message: { role: "user" as const, content: prompt },
    parent_tool_use_id: null
  };
  await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve()));
}

async function main() {
  const prompt = process.env.PROMPT!;
  const sessionId = process.env.SESSION_ID!;

  console.error(`[agent] Starting session: ${sessionId}`);

  const abortController = new AbortController();
  const messages: any[] = [];

  try {
    for await (const message of query({
      prompt: createPromptGenerator(prompt, abortController.signal),
      options: {
        cwd: '/workspace/agent',
        systemPrompt: "Your system prompt here",
        settingSources: ['project'],
        mcpServers: { 'my-tools': myMcpServer },
        model: 'claude-sonnet-4-20250514',
        maxTurns: 30,

        // CRITICAL: Use default + canUseTool, NOT bypassPermissions
        permissionMode: 'default',
        canUseTool: async () => true,

        allowedTools: [
          'Task', 'Skill', 'TodoWrite',
          'Read', 'Write', 'Edit', 'Glob', 'Grep',
          'Bash', 'WebFetch', 'WebSearch',
          'mcp__my-tools__my_tool'
        ]
      }
    })) {
      messages.push(message);
      if (message.type === 'assistant') {
        console.error(`[progress] ${JSON.stringify(message)}`);
      }
    }

    abortController.abort();
    console.log(JSON.stringify({ sessionId, messages, success: true }));

  } catch (error: any) {
    abortController.abort();
    console.error(`[agent] Error: ${error.message}`);
    console.log(JSON.stringify({ sessionId, error: error.message, success: false }));
    process.exit(1);
  }
}

main();
```

---

### schema.sql (Minimal)

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  prompt TEXT,
  data JSON
);

CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at DESC);
```

---

## Deployment

### First Deploy

```bash
# 1. Create resources (one time)
npx wrangler d1 create your-agent-sessions
npx wrangler r2 bucket create your-agent-storage

# 2. Update wrangler.jsonc with database_id

# 3. Set secrets
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put AWS_ACCESS_KEY_ID
npx wrangler secret put AWS_SECRET_ACCESS_KEY

# 4. Initialize database
npx wrangler d1 execute your-agent-sessions --file=schema.sql

# 5. Deploy
npx wrangler deploy
```

### Update Deploy

```bash
npx wrangler deploy
```

### Force Clean Deploy (after Dockerfile changes)

```bash
rm -rf node_modules .wrangler
docker builder prune -f
npm install
npx wrangler deploy
```

---

## Troubleshooting

| Symptom | Cause | Solution |
|---------|-------|----------|
| Exit code 1 | `bypassPermissions` | Use `permissionMode: 'default'` + `canUseTool` |
| "Tool permission stream closed" | Plain string prompt | Use async generator for prompt |
| 502 Bad Gateway | `exec()` timeout | Use `execStream()` |
| Hanging on startup | Interactive prompts | Set `CI=true` and create settings.json |
| Mount point not found | Missing directory | Add `mkdir -p /storage` to Dockerfile |
| Changes not taking effect | Container caching | Force clean rebuild |

### Debug Commands

```bash
# Check deployment status
npx wrangler deployments list

# View live logs
npx wrangler tail

# Test health
curl https://your-agent.your-subdomain.workers.dev/health

# Test generate
curl -X POST https://your-agent.your-subdomain.workers.dev/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt"}' \
  --no-buffer
```

---

## Checklist for New Agent

- [ ] Create project structure
- [ ] Install Worker dependencies (`@cloudflare/sandbox`)
- [ ] Install Sandbox dependencies (`@anthropic-ai/claude-agent-sdk`, `zod`, `tsx`)
- [ ] Create `wrangler.jsonc` with containers, D1, R2 config
- [ ] Create `Dockerfile` with Claude Code pre-configuration
- [ ] Write `agent-runner.ts` with async generator pattern
- [ ] Write `generate.ts` handler with `execStream()`
- [ ] Create D1 database and update `database_id`
- [ ] Create R2 bucket
- [ ] Set secrets (ANTHROPIC_API_KEY, AWS credentials)
- [ ] Initialize database schema
- [ ] Deploy and test

---

## Reference Implementation

See `/Users/chakra/Documents/Agents/creative_agent/creative-agent-cf/` for a complete working implementation.
