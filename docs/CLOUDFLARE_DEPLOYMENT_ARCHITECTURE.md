# Cloudflare Deployment Architecture

> All-Cloudflare production deployment for the Creative Ad Agent.
> Last updated: 2026-02-28. (Reviewed and corrected.)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What Lives Where](#2-what-lives-where)
3. [Durable Object Design](#3-durable-object-design)
4. [Sandbox Container Design](#4-sandbox-container-design)
5. [Data Flow](#5-data-flow)
6. [Persistence Strategy](#6-persistence-strategy)
7. [Database Migration (D1)](#7-database-migration-d1)
8. [Image Pipeline](#8-image-pipeline)
9. [EventEmitter Replacement](#9-eventemitter-replacement)
10. [New File Structure](#10-new-file-structure)
11. [Environment and Secrets](#11-environment-and-secrets)
12. [Cost Projections](#12-cost-projections)
13. [Local Dev Story](#13-local-dev-story)
14. [Migration Path](#14-migration-path)
15. [Client Changes](#15-client-changes)

---

## 1. Architecture Overview

```
                          Cloudflare Network
 ┌──────────────────────────────────────────────────────────────────────┐
 │                                                                      │
 │  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
 │  │  Cloudflare  │    │   Cloudflare    │    │     Cloudflare      │  │
 │  │    Pages     │    │     Worker      │    │   Durable Object    │  │
 │  │  (React CDN) │    │  (API Router)   │    │ (CampaignSession)   │  │
 │  │              │    │                 │    │                     │  │
 │  │ Static build │    │ /api/* routes   │    │ WebSocket handler   │  │
 │  │ global CDN   │    │ /images/* proxy │    │ Sandbox lifecycle   │  │
 │  │              │    │ Auth (Clerk)    │    │ Event buffer        │  │
 │  └──────────────┘    └────────┬────────┘    │ D1 writes          │  │
 │                               │             └──────────┬──────────┘  │
 │                               │                        │             │
 │                        ┌──────┴──────┐          ┌──────┴──────┐     │
 │                        │     D1      │          │  Cloudflare │     │
 │                        │  (SQLite)   │          │   Sandbox   │     │
 │                        │             │          │  (Linux VM) │     │
 │                        │ campaigns   │          │             │     │
 │                        │ messages    │          │ Claude SDK  │     │
 │                        │ images      │          │ Claude CLI  │     │
 │                        │ assets      │          │ MCP tools   │     │
 │                        └─────────────┘          │ Agent files │     │
 │                                                 └──────┬──────┘     │
 │                                                        │            │
 │                                                 ┌──────┴──────┐     │
 │                                                 │     R2      │     │
 │                                                 │  (Storage)  │     │
 │                                                 │             │     │
 │                                                 │ /images/    │     │
 │                                                 │ /transcripts│     │
 │                                                 │ /uploads/   │     │
 │                                                 └─────────────┘     │
 │                                                                      │
 └──────────────────────────────────────────────────────────────────────┘
           ▲                                              ▲
           │                                              │
    ┌──────┴──────┐                                ┌──────┴──────┐
    │   Browser   │                                │   fal.ai    │
    │   (React)   │                                │  (external) │
    │             │                                │ Image GenAPI│
    │ WebSocket   │                                └─────────────┘
    │ REST API    │
    └─────────────┘
```

### Key architectural insight

The Durable Object (DO) is the single coordination point. It owns both ends of the data flow:

- **Browser side**: Accepts the WebSocket connection from the client.
- **Sandbox side**: Manages the Cloudflare Sandbox container (start, exec, stream, destroy).

Because the DO is a single JavaScript actor, there is no cross-machine relay, no pub/sub, no EventEmitter bridge. The sandbox streams output directly into the DO's memory, and the DO writes directly to the WebSocket. This collapses the current three-process architecture (Express server + SDK CLI subprocess + EventEmitter bridge) into a single coordination point.

---

## 2. What Lives Where

| Current Component | Current Location | Cloudflare Service | Notes |
|---|---|---|---|
| React static build | `client/dist/` via Vite | **Pages** | Global CDN, zero-config |
| Express server | `server/sdk-server.ts` | **Worker** (fetch handler) | REST routes only, no WebSocket |
| WebSocket handler | `server/lib/websocket-handler.ts` | **Durable Object** | Full WS lifecycle lives here |
| AI client (SDK wrapper) | `server/lib/ai-client.ts` | **Inside Sandbox** (`agent-runner.ts`) | SDK runs inside Linux container |
| Session manager | `server/lib/session-manager.ts` | **DO** (in-memory) + **R2** (JSONL) | DO tracks state; R2 persists transcripts |
| Event buffer | `server/lib/event-buffer.ts` | **DO** (in-memory) | Per-DO, no shared state needed |
| MCP server (nano-banana) | `server/lib/nano-banana-mcp.ts` | **Inside Sandbox** (`agent-runner.ts`) | Part of SDK process |
| Image events bridge | `server/lib/image-events.ts` | **Eliminated** | DO parses sandbox output directly |
| Orchestrator prompt | `server/lib/orchestrator-prompt.ts` | **Inside Sandbox** (Docker image) | Static file in container |
| Database (SQLite) | `server/data/creative_agent.db` | **D1** | Same SQL, async API |
| DB access modules | `server/lib/db/*.ts` | **Worker + DO** (shared D1 binding) | Rewrite: sync → async |
| Generated images | `generated-images/` local dir | **R2** bucket | Per-user prefix |
| User uploads | `uploads/` local dir | **R2** bucket | Per-user prefix |
| SDK JSONL sessions | `~/.claude/projects/` | **R2** bucket (FUSE mount) | Per-user prefix in sandbox |
| Agent ecosystem | `agent/.claude/` | **Inside Sandbox** (Docker image) | Baked into container |
| Auth (Clerk) | `server/lib/auth.ts` | **Worker** | JWT verification at edge |
| Campaign routes | `server/routes/campaigns.ts` | **Worker** | REST handler |
| Asset routes | `server/routes/assets.ts` | **Worker** + **R2** | File serve from R2 |

---

## 3. Durable Object Design

### Class: `CampaignSession`

Each DO instance represents one active user session. The DO is identified by user ID — one DO per user handles all their campaigns.

```
┌───────────────────────────────────────────────────────┐
│               CampaignSession (Durable Object)        │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  WebSocket   │  │   Sandbox    │  │   Event     │ │
│  │  Connection  │  │   Handle     │  │   Buffer    │ │
│  │              │  │              │  │             │ │
│  │  Browser ◄───┤  │  Container   │  │  events[]   │ │
│  │              │  │  reference   │  │  nextId     │ │
│  │  send()      │  │  exec()      │  │             │ │
│  │  close()     │  │  stream()    │  │  replay()   │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────────┘ │
│         │                 │                           │
│         │   SDK stdout    │                           │
│         │◄────────────────┘                           │
│         │                                             │
│         ▼                                             │
│  Parse SDK message → emit WS event → buffer event    │
│                                                       │
│  State:                                               │
│    sessionId, campaignId, userId                      │
│    isGenerating, abortFlag                            │
│    processedFilenames (Set), imageCounter             │
│    textAccumulator, blockBuilder                      │
│                                                       │
│  Bindings:                                            │
│    D1 (database), R2 (storage), SANDBOX (namespace)   │
└───────────────────────────────────────────────────────┘
```

### DO Lifecycle

```
1. Worker receives WS upgrade request at /ws
   → Extracts userId from Clerk JWT (query param token)
   → Computes DO ID: env.CAMPAIGN_SESSION.idFromName(userId)
   → Forwards request to DO stub

2. DO.fetch() handles WebSocket upgrade
   → Stores WebSocket reference via state.acceptWebSocket(ws)

3. DO.webSocketMessage() dispatches by message type:
   generate | follow_up | cancel | ping | subscribe

4. On "generate":
   a. Create campaign in D1
   b. Send WS: { type: "ack", campaignId, sessionId }
   c. getSandbox(env.SANDBOX, `user-${userId}`, { sleepAfter: 600 })
   d. Mount R2 bucket at /mnt/r2 (prefix: users/{userId}/)
   e. sandbox.execStream("npx tsx /app/agent-runner.ts", { env: {...} })
   f. Read SSE stream in async loop:
      - Parse each SDK message via processSDKMessage()
      - Emit WS events, buffer them, persist to D1
      - On system.init: save sdk_session_id to D1
      - On tool_result with images: emit image events, save to D1
      - On result: emit complete, update D1 status
   g. Sandbox auto-sleeps after 10 min inactivity

5. On "subscribe" (reconnect):
   a. Replace WebSocket reference (close old with code 4001)
   b. Replay buffered events where event.id > lastEventId
   c. Send WS: { type: "subscribed", sessionId }

6. On "follow_up":
   a. Look up sdk_session_id from D1
   b. Wake/create sandbox, mount R2
   c. execStream() with RESUME_SDK_SESSION_ID env var
   d. Same stream processing as generate

7. On "cancel":
   a. Kill sandbox process or destroy sandbox
   b. Update D1: campaign status = "cancelled"
   c. Send WS: { type: "complete", ... }

8. On WebSocket close:
   a. Keep DO alive if generation is still running
   b. Continue buffering events for potential reconnect
```

### Concurrency model

Durable Objects are single-threaded JavaScript actors. Only one message is processed at a time. This eliminates race conditions between WebSocket messages and sandbox output. The event buffer, connection state, and sandbox handle are all safe without synchronization.

The sandbox `execStream()` returns a `ReadableStream` that the DO reads in an async loop. While awaiting chunks from the stream, the DO can still receive WebSocket messages (like `cancel` or `ping`) — the runtime interleaves I/O awaits.

### Hibernation

When no generation is running, the DO can hibernate to save costs:

- Use `state.acceptWebSocket(ws)` with WebSocket hibernation API.
- The DO is woken by incoming WebSocket messages (generate, follow_up, ping).
- During active generation, the DO stays awake because it's reading the sandbox stream.
- Hibernation preserves the WebSocket connection without billing for idle compute.

### Connection replacement (reconnect)

When a client reconnects (new WebSocket for same session), the DO:
1. Closes the old WebSocket with code 4001.
2. Stores the new WebSocket reference.
3. Replays buffered events since `lastEventId`.
4. If generation is in progress, new events continue on the new WebSocket.

This matches the current `sessionConnections` Map behavior but is simpler because the DO is already scoped to a single user.

---

## 4. Sandbox Container Design

### Dockerfile

```dockerfile
FROM node:22-slim

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code@latest

# Install project dependencies for agent-runner
WORKDIR /app
COPY sandbox/package.json sandbox/package-lock.json ./
RUN npm ci --production

# Copy agent ecosystem (skills, agents, workflows)
COPY agent/ /app/agent/

# Copy .claude settings for CLI discovery
COPY agent/.claude/ /app/agent/.claude/

# Copy sandbox entry point and supporting modules
COPY sandbox/agent-runner.ts /app/agent-runner.ts
COPY sandbox/orchestrator-prompt.ts /app/orchestrator-prompt.ts
COPY sandbox/nano-banana-mcp.ts /app/nano-banana-mcp.ts

# Ensure permissions for backup/restore compatibility
RUN chmod -R a+rX /app

# R2 will be FUSE-mounted at /mnt/r2 by the DO at runtime
# Structure:
#   /mnt/r2/.claude/projects/   → SDK JSONL transcripts
#   /mnt/r2/images/             → generated campaign images
#   /mnt/r2/uploads/            → user-uploaded assets

# Container stays alive; DO invokes commands via exec/execStream
CMD ["sleep", "infinity"]
```

### What runs inside the sandbox

The sandbox contains `agent-runner.ts` — a single entry point that:

1. Reads configuration from environment variables (prompt, sessionId, resume options).
2. Imports Claude Agent SDK `query()`.
3. Configures SDK with orchestrator prompt, MCP server, allowed tools, settings sources.
4. Calls `query()` with prompt and resume options.
5. Writes each SDK message as a JSON line to stdout.
6. The DO reads stdout via `execStream()` and parses each line.

```typescript
// sandbox/agent-runner.ts — runs inside container
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { nanoBananaMcpServer } from './nano-banana-mcp.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './orchestrator-prompt.js';

const prompt = process.env.PROMPT!;
const sessionId = process.env.SESSION_ID!;
const resumeSdkSessionId = process.env.RESUME_SDK_SESSION_ID || undefined;
const cwd = '/app/agent';

const baseOptions: Partial<Options> = {
  cwd,
  model: 'claude-haiku-4-5-20251001',
  maxTurns: 30,
  settingSources: ['user', 'project'],
  allowedTools: [
    // Orchestrator tools
    'Task', 'Skill', 'TodoWrite',
    // Subagent tools
    'WebFetch', 'WebSearch', 'Read', 'Write',
    'Bash', 'Edit', 'Glob', 'Grep',
    // MCP tool
    'mcp__nano-banana__generate_ad_images',
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
  mcpServers: { 'nano-banana': nanoBananaMcpServer },
};

// Build resume options with fallback: if resume fails, start fresh
const resumeOptions = resumeSdkSessionId
  ? { resume: resumeSdkSessionId }
  : {};
const options = { ...baseOptions, ...resumeOptions };

// Prompt generator: yield user message, keep alive via AbortSignal
const abortController = new AbortController();

async function* createPrompt() {
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: prompt },
    parent_tool_use_id: null,
  };
  // Hold generator open until query() completes (signalled by abort)
  if (!abortController.signal.aborted) {
    await new Promise<void>(resolve => {
      abortController.signal.addEventListener('abort', () => resolve(), { once: true });
    });
  }
}

try {
  for await (const message of query({ prompt: createPrompt(), options })) {
    process.stdout.write(JSON.stringify(message) + '\n');
    if (message.type === 'result') {
      abortController.abort();
      break;
    }
  }
} catch (err: any) {
  // Resume failed (e.g. JSONL corrupted or missing) — fall back to fresh session
  if (resumeSdkSessionId && err?.message?.includes('resume')) {
    console.error(`Resume failed, starting fresh session: ${err.message}`);
    const freshOptions = { ...baseOptions };
    for await (const message of query({ prompt: createPrompt(), options: freshOptions })) {
      process.stdout.write(JSON.stringify(message) + '\n');
      if (message.type === 'result') {
        abortController.abort();
        break;
      }
    }
  } else {
    throw err;
  }
}

process.exit(0);
```

### How the DO invokes the sandbox

```typescript
// Inside CampaignSession Durable Object

// 1. Get or create sandbox (lazy — no container until first command)
const sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId}`, {
  sleepAfter: 600,  // 10 min idle → sleep
});

// 2. Mount R2 for persistent storage (per-user isolated)
await sandbox.mountBucket('creative-agent-storage', '/mnt/r2', {
  endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  provider: 'r2',
  prefix: `/users/${this.userId}/`,
});

// 3. Start agent-runner via execStream for real-time output
const stream = await sandbox.execStream(
  'npx tsx /app/agent-runner.ts',
  {
    env: {
      ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
      FAL_KEY: this.env.FAL_KEY,
      PROMPT: prompt,
      SESSION_ID: sessionId,
      RESUME_SDK_SESSION_ID: sdkSessionId || '',
      CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
      CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
      HOME: '/mnt/r2',  // SDK writes JSONL to $HOME/.claude/projects/
    },
    cwd: '/app',
  }
);

// 4. Parse SSE stream from sandbox
for await (const event of parseSSEStream(stream)) {
  if (event.type === 'stdout' && event.data) {
    const sdkMessage = JSON.parse(event.data);
    await this.processSDKMessage(sdkMessage);
  } else if (event.type === 'error') {
    this.sendWS({ type: 'error', error: event.data });
  } else if (event.type === 'complete') {
    // Sandbox process exited
    break;
  }
}
```

### Instance sizing

**standard-1** (1/2 vCPU, 4GB RAM, 8GB disk) is the minimum viable size.

- Claude CLI + Node.js + MCP server need ~2-3GB RAM.
- 8GB disk covers node_modules + agent files + temporary image writes.
- Generation typically runs 60-180 seconds.
- At $0.00002/vCPU-second, a single generation costs ~$0.0006-$0.0018 in CPU.

### JSONL persistence via R2 FUSE mount

The Claude SDK writes JSONL transcripts to `$HOME/.claude/projects/{hash}/{sdkSessionId}.jsonl`. By setting `HOME=/mnt/r2` and mounting R2 with `prefix: /users/{userId}/`, the JSONL files land at:

```
R2 key: users/{userId}/.claude/projects/{projectHash}/{sdkSessionId}.jsonl
```

On follow-up: the DO wakes the sandbox, mounts R2, and the SDK finds the JSONL at the same path — enabling resume without any orchestration beyond setting the `RESUME_SDK_SESSION_ID` env var.

**Network latency note**: R2 FUSE mount adds ~1-10ms per file operation. JSONL writes are small appends (~few KB per SDK message), and the dominant latency is the Claude API response (seconds per turn). In practice, the FUSE overhead is negligible.

---

## 5. Data Flow

### 5.1 Initial Generation

```
1. Browser sends WS: { type: "generate", prompt: "...", sessionId: "abc-123" }

2. Worker receives WS upgrade at /ws
   → Verifies Clerk JWT from ?token= query param
   → Routes to DO: env.CAMPAIGN_SESSION.idFromName(userId)

3. DO.webSocketMessage("generate"):
   a. Create campaign in D1 (status: "generating")
   b. Send WS: { type: "ack", campaignId: "camp_xyz", sessionId: "abc-123" }
   c. Get/create Sandbox: getSandbox(env.SANDBOX, `user-${userId}`)
   d. Mount R2 at /mnt/r2 (prefix: /users/{userId}/)
   e. execStream("npx tsx /app/agent-runner.ts", { env: { PROMPT, ... } })
   f. For each SDK message from stdout:
      - system.init → save sdk_session_id to D1
      - assistant + tool_use "Task" → WS { type: "phase", phase: "research" }
      - assistant + tool_use "Skill" → WS { type: "phase", phase: "hooks"/"art" }
      - assistant + tool_use "Write" → detect file type (research/hooks/prompts)
                                     → WS { type: "file", fileType, content }
                                     → save to D1 (campaign_files)
      - assistant + tool_use "mcp__nano-banana__generate_ad_images"
                                     → WS { type: "phase", phase: "images" }
      - user + tool_result with image data
                                     → for each image:
                                         WS { type: "image", urlPath, hookType, ... }
                                         save to D1 (campaign_images)
      - assistant text chunks → WS { type: "message", text }
      - result → WS { type: "complete", summary, imageCount }
              → D1: campaign status = "complete"
              → save assistant message + blocks to D1
   g. All events buffered in DO memory with sequential IDs

4. Browser receives events, updates Zustand store (unchanged)
```

### 5.2 Follow-Up / Resume

```
1. Browser sends WS: { type: "follow_up", prompt: "...", campaignId: "camp_xyz" }

2. Routed to same DO (same userId)

3. DO.webSocketMessage("follow_up"):
   a. Look up campaign in D1 → get session_id + sdk_session_id
   b. Save user message to D1
   c. Update D1: campaign status = "generating"
   d. Send WS: { type: "ack", sessionId, campaignId }
   e. Get/wake Sandbox (same sandboxId = `user-${userId}`)
      - If sleeping: R2 mount restores JSONL access
      - If already awake: JSONL already available
   f. execStream() with env RESUME_SDK_SESSION_ID = sdkSessionId
   g. SDK reads JSONL from /mnt/r2/.claude/projects/... and resumes
   h. Same stream processing as initial generation
   i. On complete: update D1, save assistant message
```

### 5.3 Reconnection / Recovery

```
1. Browser reconnects (new WebSocket to /ws)

2. Worker routes to same DO (same userId)

3. DO receives new WebSocket via fetch():
   a. Close old WebSocket with code 4001
   b. Store new WebSocket reference

4. Browser sends: { type: "subscribe", sessionId, lastEventId }

5. DO.webSocketMessage("subscribe"):
   a. Replay buffered events where event.id > lastEventId
   b. Send WS: { type: "subscribed", sessionId }

6. If generation still running → new events continue on new WebSocket
7. If generation completed during disconnect → replay includes "complete"
```

### 5.4 Cancellation

```
1. Browser sends WS: { type: "cancel" }

2. DO.webSocketMessage("cancel"):
   a. Set abortFlag = true
   b. Kill sandbox process or destroy sandbox entirely
   c. Update D1: campaign status = "cancelled"
   d. Send WS: { type: "complete", message: "Cancelled" }
   e. isGenerating = false
```

### 5.5 Image Delivery

```
Generation:
  fal.ai API → fetch in sandbox → write to /mnt/r2/images/{sessionId}/
  → R2 (via FUSE mount, immediate)

Serving:
  Browser GET /images/{sessionId}/{filename}
  → Worker route handler
  → env.R2_BUCKET.get(`users/${userId}/images/${sessionId}/${filename}`)
  → Response with image/png Content-Type

URL format unchanged: /images/{sessionId}/{filename}
```

---

## 6. Persistence Strategy

### R2 Bucket Layout

```
creative-agent-storage/
└── users/
    └── {userId}/
        ├── .claude/                        # SDK JSONL transcripts
        │   └── projects/
        │       └── {projectHash}/
        │           └── {sdkSessionId}.jsonl
        ├── images/                         # Generated campaign images
        │   └── {sessionId}/
        │       ├── 1738000000_1_stat_hook.png
        │       ├── 1738000000_2_story_hook.png
        │       └── ...
        └── uploads/                        # User-uploaded asset files
            ├── 1738000000-abc.png
            └── 1738000000-def.jpg
```

### What goes where

| Data | Service | Why |
|---|---|---|
| Campaign metadata (id, name, status, session_id, sdk_session_id) | **D1** | Structured queries by user_id, status |
| Campaign files (research, hooks, prompts content) | **D1** | TEXT columns, queried by campaign_id |
| Campaign image metadata (index, hook_type, prompt, path) | **D1** | Structured, queried by campaign_id |
| Chat messages (role, content, blocks) | **D1** | Structured, queried by campaign_id |
| Asset folder/file metadata | **D1** | Structured, queried by user_id |
| Generated image blobs (PNG/JPEG/WebP) | **R2** | Binary, large, CDN-served, zero egress |
| User upload blobs | **R2** | Binary, large |
| SDK JSONL transcripts | **R2** (FUSE mount) | Required for session resume, per-user isolated |
| Event buffer (WS events for replay) | **DO memory** | Transient, generation-lifetime only |
| Connection state (ws ref, flags, counters) | **DO memory** | Transient, per-connection |

---

## 7. Database Migration (D1)

D1 uses SQLite. The schema is identical to the current `better-sqlite3` schema.

### D1 Schema

```sql
-- Matches server/lib/database.ts schema exactly

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating'
    CHECK (status IN ('generating', 'complete', 'incomplete', 'error', 'cancelled')),
  session_id TEXT,
  sdk_session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_session_id ON campaigns(session_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_sdk_session_id ON campaigns(sdk_session_id);

CREATE TABLE IF NOT EXISTS campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('research', 'hooks', 'prompts')),
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, file_type)
);

CREATE INDEX IF NOT EXISTS idx_campaign_files_campaign_id ON campaign_files(campaign_id);

CREATE TABLE IF NOT EXISTS campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,
  hook_type TEXT NOT NULL
    CHECK (hook_type IN ('stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast')),
  prompt TEXT,
  file_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);

CREATE INDEX IF NOT EXISTS idx_campaign_images_campaign_id ON campaign_images(campaign_id);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_refs TEXT,
  file_refs TEXT,
  blocks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);

CREATE TABLE IF NOT EXISTS asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_folders_user_id ON asset_folders(user_id);

CREATE TABLE IF NOT EXISTS asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'other')),
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_files_folder_id ON asset_files(folder_id);

CREATE TRIGGER IF NOT EXISTS campaigns_updated_at
  AFTER UPDATE ON campaigns
  FOR EACH ROW
  BEGIN
    UPDATE campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;

CREATE TRIGGER IF NOT EXISTS campaign_files_updated_at
  AFTER UPDATE ON campaign_files
  FOR EACH ROW
  BEGIN
    UPDATE campaign_files SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
  END;
```

Note: The current codebase adds `blocks TEXT` to `messages` via an ALTER TABLE migration in `database.ts:148-150`. The D1 schema above includes it directly in the CREATE TABLE.

### D1 vs better-sqlite3 API differences

| Aspect | Current (`better-sqlite3`) | D1 |
|---|---|---|
| API style | Synchronous: `db.prepare().run()` | Async: `await env.DB.prepare().run()` |
| Parameter binding | `.run(val1, val2)` | `.bind(val1, val2).run()` |
| Get one row | `.get(...)` | `.bind(...).first()` |
| Get all rows | `.all(...)` | `.bind(...).all()` then `.results` |
| WAL mode | Manual: `PRAGMA journal_mode = WAL` | Managed by D1 |
| Connection | `new Database(path)` | Binding `env.DB` |
| Transactions | `db.transaction(fn)` | `env.DB.batch([stmt1, stmt2])` |
| Foreign keys | `PRAGMA foreign_keys = ON` | Enabled by default |

### Migration approach

1. Create D1 database: `npx wrangler d1 create creative-agent-db`
2. Apply schema: `npx wrangler d1 execute creative-agent-db --file=./schema.sql`
3. Rewrite all `server/lib/db/*.ts` modules to async D1 API.
4. One-time data migration script to export existing SQLite → D1.

---

## 8. Image Pipeline

### Current flow

```
fal.ai API
  → fetch() response in MCP tool (nano-banana-mcp.ts)
  → Buffer → fs.writeFileSync("generated-images/{sessionId}/{filename}")
  → EventEmitter.emit('image-saved', { urlPath, ... })
  → WS handler listener → WebSocket.send({ type: "image", ... })
  → Express static serve: GET /images/{sessionId}/{filename}
```

### Cloudflare flow

```
fal.ai API
  → fetch() response in MCP tool (inside sandbox)
  → Buffer → fs.writeFileSync("/mnt/r2/images/{sessionId}/{filename}")
  → Write lands in R2 via FUSE mount (immediate)
  → DO parses SDK stdout → sees tool_result with image metadata
  → DO sends WebSocket: { type: "image", urlPath: "/images/{sessionId}/{filename}" }
  → Worker serves: GET /images/{sessionId}/{filename} → R2 bucket read
```

The MCP tool code (`nano-banana-mcp.ts`) needs one change: the image output directory moves from `generated-images/{sessionId}/` to `/mnt/r2/images/{sessionId}/`. This is configured via an environment variable or by setting the CWD.

### Image serving via Worker

```typescript
// src/routes/images.ts — Worker route handler
export async function handleImageRequest(
  request: Request,
  env: Env,
  userId: string
): Promise<Response> {
  const url = new URL(request.url);
  // /images/{sessionId}/{filename}
  const path = url.pathname.replace('/images/', '');
  const key = `users/${userId}/images/${path}`;

  const object = await env.R2_BUCKET.get(key);
  if (!object) return new Response('Not Found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
```

Images are immutable (generated once, never modified), so aggressive caching is safe.

---

## 9. EventEmitter Replacement

### Current architecture (cross-process bridge)

```
MCP tool (inside SDK CLI subprocess)
  → imageEvents.emit('image-saved', { sessionId, ... })
    → registerMcpSession() maps mcpSessionId → wsSessionId
  → WS handler listener catches event
    → resolveWsSessionId() looks up mapping
  → WebSocket.send({ type: "image", ... })
```

The `image-events.ts` module exists because the MCP tool runs inside a subprocess and needs to signal the WebSocket handler in the parent Express process. The `registerMcpSession()` / `resolveWsSessionId()` bridge maps human-readable MCP session IDs to WebSocket UUID session IDs.

### Cloudflare architecture (single actor)

```
Sandbox stdout (SDK stream with tool_result messages)
  → DO.processSDKMessage() parses image data from tool_result
  → DO sends WebSocket: { type: "image", ... }
  → DO saves to D1: campaign_images record
```

No EventEmitter. No session ID mapping. The DO already knows its own userId, sessionId, and campaignId. When it encounters a `tool_result` containing image metadata (same parsing logic as `processSDKMessage()` lines 532-596 in the current `websocket-handler.ts`), it directly emits the WebSocket event and persists to D1.

**Files eliminated**: `server/lib/image-events.ts` is completely removed. The `registerMcpSession()`, `resolveWsSessionId()`, and `unregisterByWsSession()` functions are no longer needed.

**Note**: The `processSDKMessage()` function in the current codebase already has a fallback path that parses images from `tool_result` messages (not relying on EventEmitter). This fallback becomes the primary and only path in production.

---

## 10. New File Structure

```
creative-agent-cloudflare/
├── wrangler.jsonc                    # Cloudflare Worker + DO + D1 + R2 + Sandbox config
├── package.json                      # Worker dependencies
├── tsconfig.json
│
├── src/                              # Worker + DO source
│   ├── index.ts                      # Worker fetch handler (entry point)
│   ├── router.ts                     # API route dispatcher
│   ├── auth.ts                       # Clerk JWT verification (edge)
│   │
│   ├── durable-objects/
│   │   └── campaign-session.ts       # CampaignSession DO
│   │
│   ├── routes/
│   │   ├── campaigns.ts              # GET/POST /api/campaigns/*
│   │   ├── assets.ts                 # GET/POST /api/assets/*
│   │   ├── images.ts                 # GET /images/* (R2 proxy)
│   │   └── health.ts                 # GET /health
│   │
│   ├── db/                           # D1 access layer (async)
│   │   ├── campaigns.ts
│   │   ├── files.ts
│   │   ├── images.ts
│   │   ├── messages.ts
│   │   ├── assets.ts
│   │   └── index.ts                  # Barrel exports
│   │
│   ├── lib/
│   │   ├── sdk-message-parser.ts     # processSDKMessage() — ported from websocket-handler.ts
│   │   ├── block-builder.ts          # BlockBuilder class — ported from websocket-handler.ts
│   │   ├── event-buffer.ts           # Per-DO event buffer
│   │   └── types.ts                  # Shared types (WSServerMessage, etc.)
│   │
│   └── env.d.ts                      # TypeScript env/binding declarations
│
├── sandbox/                          # Sandbox container source
│   ├── Dockerfile
│   ├── package.json                  # claude-agent-sdk, tsx, fal-ai deps
│   ├── agent-runner.ts               # Entry point invoked by DO
│   ├── orchestrator-prompt.ts        # System prompt (from server/lib/)
│   └── nano-banana-mcp.ts            # MCP server (from server/lib/)
│
├── agent/                            # Agent ecosystem (copied into Docker image)
│   ├── .claude/
│   │   ├── settings.json
│   │   ├── agents/
│   │   │   └── research.md
│   │   └── skills/
│   │       ├── hook-methodology/
│   │       │   ├── SKILL.md
│   │       │   ├── formulas.md
│   │       │   └── hook-bank/        # Runtime output dir
│   │       └── art-style/
│   │           ├── SKILL.md
│   │           ├── workflows/        # 14 style workflow files
│   │           └── tools/
│   └── files/                        # Runtime output dirs
│       ├── research/
│       └── creatives/
│
├── schema.sql                        # D1 schema (full CREATE TABLE statements)
├── migrations/
│   └── 0001_initial.sql              # D1 migration
│
└── client/                           # React frontend (UNCHANGED)
    ├── src/
    ├── dist/                         # Build output → deployed to Cloudflare Pages
    ├── vite.config.ts
    └── package.json
```

### `wrangler.jsonc`

```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "node_compat": true,

  // D1 database
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "creative-agent-db",
      "database_id": "<auto-generated-on-create>"
    }
  ],

  // R2 bucket
  "r2_buckets": [
    {
      "binding": "R2_BUCKET",
      "bucket_name": "creative-agent-storage"
    }
  ],

  // Durable Objects
  "durable_objects": {
    "bindings": [
      {
        "name": "CAMPAIGN_SESSION",
        "class_name": "CampaignSession"
      }
    ]
  },

  // Sandbox container
  "containers": {
    "bindings": [
      {
        "name": "SANDBOX",
        "image": "./sandbox",
        "instance_type": "standard-1"
      }
    ]
  },

  // DO migrations
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["CampaignSession"],
      "new_sqlite_classes": ["CampaignSession"]
    }
  ]
}
```

### Worker entry point

```typescript
// src/index.ts
import { CampaignSession } from './durable-objects/campaign-session';
import { handleApiRequest } from './router';
import { verifyClerkToken } from './auth';

export { CampaignSession };

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  CAMPAIGN_SESSION: DurableObjectNamespace;
  SANDBOX: any;  // Sandbox binding
  ANTHROPIC_API_KEY: string;
  FAL_KEY: string;
  CLERK_SECRET_KEY: string;
  CF_ACCOUNT_ID: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade → route to Durable Object
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const token = url.searchParams.get('token');
      const userId = await verifyClerkToken(token, env);
      if (!userId) return new Response('Unauthorized', { status: 401 });

      // One DO per user
      const doId = env.CAMPAIGN_SESSION.idFromName(userId);
      const stub = env.CAMPAIGN_SESSION.get(doId);
      return stub.fetch(request);
    }

    // REST API + image proxy
    if (url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/images/') ||
        url.pathname === '/health') {
      return handleApiRequest(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

---

## 11. Environment and Secrets

### Secrets (set via `wrangler secret put`)

| Secret | Purpose | Used By |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude SDK API calls | Sandbox (per-command env) |
| `FAL_KEY` | fal.ai image generation | Sandbox (per-command env) |
| `CLERK_SECRET_KEY` | JWT verification | Worker (auth.ts) |

### Wrangler vars (non-secret, in `wrangler.jsonc`)

| Variable | Purpose |
|---|---|
| `CF_ACCOUNT_ID` | R2 endpoint construction |

### Pages build env vars

| Variable | Purpose |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Client-side Clerk initialization |
| `VITE_WS_URL` | WebSocket endpoint (if not relative) |

### Sandbox environment variables

Injected per-invocation via `sandbox.execStream()` options — never stored in Docker image:

```typescript
{
  ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,    // From Worker secret
  FAL_KEY: env.FAL_KEY,                         // From Worker secret
  PROMPT: prompt,                               // User's message
  SESSION_ID: sessionId,                        // WS session ID
  RESUME_SDK_SESSION_ID: sdkSessionId || '',    // For follow-up resume
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',    // Enable agent teams
  CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',       // Large responses
  HOME: '/mnt/r2',                              // JSONL persistence via FUSE
}
```

---

## 12. Cost Projections

### Per-generation breakdown

Assuming standard-1 instance (0.5 vCPU, 4GB RAM), 120 seconds per generation:

| Resource | Usage | Cost |
|---|---|---|
| Sandbox CPU | 120s * 0.5 vCPU = 60 vCPU-seconds | $0.0012 |
| Sandbox RAM | 120s * 4GB = 480 GB-seconds | $0.0012 |
| Sandbox disk | 120s * 8GB = 960 GB-seconds | ~$0.0001 |
| D1 reads | ~20 queries | free tier |
| D1 writes | ~15 writes | free tier |
| R2 writes | ~8 operations (images + JSONL) | free tier |
| R2 storage | ~3MB (6 images) | negligible |
| DO compute | ~120s active | ~$0.0001 |
| **Total per generation** | | **~$0.003** |

Note: Claude API (~$0.05-0.20) and fal.ai (~$0.02-0.10) costs are additional and identical regardless of hosting.

### Monthly projections

| Scale | Generations/mo | Workers plan | Sandbox compute | D1 | R2 | DO | **Total CF** |
|---|---|---|---|---|---|---|---|
| 10 users | 100 | $5 | $0.24* | Free | Free | Free | **~$5.24** |
| 100 users | 1,000 | $5 | $2.40* | Free | Free | $0.04 | **~$7.44** |
| 1,000 users | 10,000 | $5 | $24.00 | $0.75 | $0.15 | $0.38 | **~$30.28** |

*Partially covered by included 375 vCPU-minutes ($5 plan).

### Comparison with alternatives

| Scale | All Cloudflare | Fly Machine + Sprites |
|---|---|---|
| 10 users | ~$5/month | ~$47/month ($7 machine + $40 sprites) |
| 100 users | ~$7/month | ~$269/month |
| 1,000 users | ~$30/month | ~$2,634/month |

Cloudflare's usage-based billing (pay only for active CPU seconds, not provisioned storage per user) provides a significant cost advantage, especially at lower scale where the $5 base plan covers most usage.

---

## 13. Local Dev Story

### Primary: `wrangler dev` with Miniflare

```bash
# Terminal 1: Worker + DO + D1 + R2 (all emulated locally)
npx wrangler dev

# Terminal 2: Client dev server
cd client && npm run dev
```

`wrangler dev` provides:
- Local D1 (SQLite file in `.wrangler/state/`)
- Local R2 (filesystem in `.wrangler/state/`)
- Local Durable Objects (in-memory)
- Hot reload on Worker source changes

### Sandbox in local dev

The Cloudflare Sandbox SDK does **not** work with `wrangler dev` (R2 FUSE mount requires deployed infrastructure). Two options:

**Option 1: Local AI backend (recommended for daily dev)**

The DO detects `AI_BACKEND=local` environment variable and runs the SDK directly in-process — same as the current `ai-client.ts` architecture. No sandbox, no container, no Docker. This preserves the current `npm run dev` experience.

```typescript
// In CampaignSession DO:
if (this.env.AI_BACKEND === 'local') {
  // Import ai-client.ts, call queryWithSession() directly
  // Same code path as current server
} else {
  // Production: use sandbox.execStream()
}
```

**Option 2: Local Docker (integration testing)**

Build and run the sandbox Dockerfile locally. The DO connects to it via a local HTTP adapter. Use for testing the full sandbox flow before deploying.

### Vite proxy config

```typescript
// client/vite.config.ts — only port changes
server: {
  proxy: {
    '/ws': { target: 'http://localhost:8787', ws: true },
    '/api': { target: 'http://localhost:8787' },
    '/images': { target: 'http://localhost:8787' },
  }
}
```

Port changes from 3001 (current Node server) to 8787 (wrangler dev default).

---

## 14. Migration Path

### Phase 1: Data layer (D1 + R2)

1. Create D1 database and R2 bucket.
2. Apply D1 schema.
3. Rewrite `server/lib/db/*.ts` to async D1 API (new `src/db/` directory).
4. Create R2 image serving route.
5. One-time data migration: SQLite → D1, local images → R2.

### Phase 2: Worker (API routes)

1. Create Worker fetch handler (`src/index.ts`).
2. Port REST routes: campaigns, assets, images, health.
3. Port auth: replace Express `clerkMiddleware()` + `requireAuth()` with `@clerk/backend` JWT verification at the edge (no Express dependency).
4. Deploy Worker and verify REST API works.

### Phase 3: Durable Object (WebSocket)

1. Implement `CampaignSession` DO class.
2. Port WebSocket message dispatching (generate, follow_up, cancel, subscribe, ping).
3. Port `processSDKMessage()` (SDK message → WS event conversion).
4. Port event buffer (per-DO instance, same sequential ID logic).
5. Port BlockBuilder for message block persistence.
6. Wire up sandbox lifecycle management in DO.

### Phase 4: Sandbox (AI execution)

1. Build Docker image with Claude CLI, agent ecosystem, MCP server.
2. Implement `agent-runner.ts` (SDK query → stdout NDJSON stream).
3. Configure R2 FUSE mount for JSONL + image persistence.
4. Test end-to-end: generate, follow-up/resume, cancel, reconnect.

### Phase 5: Pages (frontend)

1. Deploy `client/dist/` to Cloudflare Pages.
2. Configure custom domain + DNS.
3. Set up routing: Pages for static, Worker for API/WS/images.
4. Remove Vite dev proxy (production uses Cloudflare routing).

### What changes vs what stays the same

| Component | Status | Details |
|---|---|---|
| Client React code | **Unchanged** | Zero changes to components, store, hooks, types |
| WebSocket protocol | **Unchanged** | Same message types, shapes, recovery semantics |
| REST API contract | **Unchanged** | Same endpoints, request/response shapes |
| Image URL format | **Unchanged** | Still `/images/{sessionId}/{filename}` |
| Auth flow | **Minor** | Same Clerk JWT token flow; Express middleware → `@clerk/backend` edge verification |
| Database schema | **Unchanged** | Same tables, columns, SQL |
| Orchestrator prompt | **Unchanged** | Copied verbatim to sandbox |
| Agent ecosystem | **Unchanged** | Copied verbatim to Docker image |
| MCP tool (nano-banana) | **Minor** | Image output path → R2 mount path |
| DB access layer | **Rewritten** | Sync → async (better-sqlite3 → D1) |
| Server entry point | **Rewritten** | Express → Worker fetch handler |
| WebSocket handler | **Rewritten** | ws library → DO WebSocket API |
| Session manager | **Replaced** | In-memory Map → DO state + R2 JSONL |
| Event buffer | **Moved** | Module-global Map → per-DO instance |
| Image events bridge | **Removed** | Not needed (DO owns both ends) |
| AI client | **Moved** | Server process → sandbox container (agent-runner.ts) |
| File serving | **Changed** | Local disk → R2 via Worker proxy |

---

## 15. Client Changes

**There are no client changes.**

The React client does not need any modifications because:

1. **Same WebSocket protocol**: The client sends `generate`, `follow_up`, `cancel`, `ping`, `subscribe`. The DO responds with `ack`, `phase`, `tool_start`, `tool_end`, `message`, `status`, `file`, `image`, `complete`, `incomplete`, `error`, `pong`, `subscribed`. All 13 event types and their field shapes are preserved exactly (verified against `client/src/types/websocket.ts`). Note: the server currently sends extra fields (`message`, `success`) on the `subscribed` event that are not in the client type definition — the client safely ignores these, but the DO implementation should match the same behavior for compatibility.

2. **Same REST API**: `/api/campaigns`, `/api/campaigns/:id`, `/api/assets/*` — all endpoints return the same JSON structures.

3. **Same image URLs**: `/images/{sessionId}/{filename}` — whether served by Express or Worker+R2, the URL format is identical.

4. **Same auth flow**: Clerk JWT in `?token=` query param for WebSocket, Clerk middleware (`clerkMiddleware()` + `requireAuth()`) for REST. The Worker migration replaces Express Clerk middleware with direct JWT verification via `@clerk/backend`. The `websocket-manager.ts` constructs URLs the same way.

5. **Same reconnection behavior**: Exponential backoff, `subscribe` with `lastEventId`, event replay — all works identically because the DO implements the same buffering and replay logic.

6. **Same event ID sequencing**: Events have sequential `id` numbers starting from 1, buffered per session.

### Production URL routing

```
Browser → yourdomain.com
    ├── /ws              → Worker → Durable Object (WebSocket)
    ├── /api/*           → Worker → D1 / R2
    ├── /images/*        → Worker → R2
    └── /* (everything)  → Cloudflare Pages (static React build)
```

Configured via Cloudflare Workers Routes or Pages Functions integration.
