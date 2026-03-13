# Phase 4: Sandbox Container — Implementation Plan

> Depends on: Phase 3 (CampaignSession Durable Object)
> Created: 2026-02-28
> Status: Ready to implement

---

## Table of Contents

1. [Context](#1-context)
2. [Architecture](#2-architecture)
3. [Sandbox SDK API Reference](#3-sandbox-sdk-api-reference)
4. [Files to Create](#4-files-to-create)
5. [Files to Modify](#5-files-to-modify)
6. [Implementation Order](#6-implementation-order)
7. [Porting Reference](#7-porting-reference)
8. [Streaming Design](#8-streaming-design)
9. [Verification](#9-verification)

---

## 1. Context

Phases 1-3 are complete:
- **Phase 1**: D1 data layer (`cloudflare/src/db/`)
- **Phase 2**: Worker API routes (`cloudflare/src/routes/`, `router.ts`, `auth.ts`)
- **Phase 3**: CampaignSession DO (`cloudflare/src/durable-objects/campaign-session.ts`)

The `runGeneration()` method in `campaign-session.ts:292-341` is **stubbed** — it sends an `incomplete` event. Phase 4 replaces this stub with actual AI execution via a **Cloudflare Sandbox container** that runs the Claude Agent SDK.

### What Phase 4 Delivers

- Docker image with Claude CLI + agent ecosystem + MCP server
- `agent-runner.ts` that calls the Claude SDK `query()` and streams NDJSON to stdout
- Sandbox lifecycle in the DO: getSandbox → mountBucket → exec → parse → complete
- R2 FUSE mount for JSONL persistence (enables follow-up/resume)
- R2 FUSE mount for image storage (replaces local `generated-images/` directory)
- Cancel support via `sandbox.destroy()`

---

## 2. Architecture

```
DO (CampaignSession)
  │
  ├── sandbox = getSandbox(env.SANDBOX, `user-${userId}`)
  ├── await sandbox.mountBucket(env.R2_BUCKET, '/mnt/r2')
  ├── execPromise = sandbox.exec('npx tsx /app/agent-runner.ts', { stream: true, onOutput })
  │     │
  │     └── onOutput('stdout', data) → parse JSON lines → push to messageQueue
  │
  ├── drainLoop: while messages in queue → await processSDKMessage(msg, ctx)
  │     ├── emitEvent → WS to client (real-time)
  │     └── D1 writes (campaigns, files, images, messages)
  │
  └── await execPromise → finalize (complete/error/cancel)
```

**Key design**: `sandbox.exec()` with `stream: true` feeds stdout lines via `onOutput` callback (sync). A concurrent async drain loop calls `processSDKMessage()` for each message — this emits WS events AND writes to D1 in real-time. The DO's single-threaded event loop interleaves the exec stream and drain loop naturally via `await` yields.

**Data flow within sandbox**:
```
agent-runner.ts
  ├── query() → Claude SDK → MCP tool calls → fal.ai images
  ├── Images saved to /mnt/r2/images/{sessionId}/ (R2 via FUSE)
  ├── JSONL written to /mnt/r2/.claude/projects/ (R2 via FUSE, for resume)
  └── Each SDK message → JSON.stringify(msg) + '\n' → stdout → DO reads
```

---

## 3. Sandbox SDK API Reference

Based on `@cloudflare/sandbox` package. Key differences from architecture doc's assumptions:

### Import
```typescript
import { getSandbox, proxyToSandbox, type Sandbox } from '@cloudflare/sandbox';
export { Sandbox } from '@cloudflare/sandbox'; // Required: re-export for wrangler
```

### getSandbox
```typescript
const sandbox = getSandbox(env.SANDBOX, `user-${userId}`, {
  sleepAfter: '10m',    // Auto-sleep after inactivity (default: '10m')
  keepAlive: false,      // false = auto-timeout (default)
});
```
- `env.SANDBOX` is a `DurableObjectNamespace<Sandbox>` binding
- Same sandboxId = same container (reuse across requests)
- Lazy: no container until first command

### exec (with streaming)
```typescript
const result = await sandbox.exec('npx tsx /app/agent-runner.ts', {
  cwd: '/app',
  env: { ANTHROPIC_API_KEY: '...', PROMPT: '...' },
  stream: true,
  onOutput: (stream, data) => {
    // stream: 'stdout' | 'stderr'
    // data: string (may contain multiple lines)
  }
});
// Returns: { stdout, stderr, exitCode, success, duration }
```
- `onOutput` is a **sync** callback — fires during the `await`
- Cannot `await` inside `onOutput` — use a message queue (see [Streaming Design](#8-streaming-design))

### mountBucket (R2 via FUSE)
```typescript
await sandbox.mountBucket(env.R2_BUCKET, '/mnt/r2', { readOnly: false });
```
- Takes R2 **binding** (not bucket name string)
- **Production only** — does NOT work with `wrangler dev`
- ~1-10ms latency per file op (negligible vs Claude API response times)
- Data persists across sandbox sleep/wake

### destroy
```typescript
await sandbox.destroy();
```
- Terminates container immediately
- Used for cancel support

### Instance Types (wrangler.jsonc)
| Type | RAM | vCPU |
|------|-----|------|
| `lite` | 256MB | 0.5 |
| `standard` | 512MB | 1 |
| `heavy` | 1GB | 2 |

**Note**: `standard` may be too small for Node.js + Claude CLI + MCP. Need to test; `heavy` might be required. The architecture doc's `standard-1` (4GB) appears to be a different product/tier — verify against current Cloudflare pricing page.

### wrangler.jsonc Config
```jsonc
{
  "containers": [{
    "class_name": "Sandbox",
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard",
    "max_instances": 10
  }],
  "durable_objects": {
    "bindings": [
      { "name": "CAMPAIGN_SESSION", "class_name": "CampaignSession" },
      { "name": "SANDBOX", "class_name": "Sandbox" }
    ]
  },
  "migrations": [{
    "tag": "v1",
    "new_classes": ["CampaignSession"],
    "new_sqlite_classes": ["CampaignSession", "Sandbox"]
  }]
}
```

---

## 4. Files to Create (5)

### 4.1 `cloudflare/sandbox/Dockerfile`

```dockerfile
FROM docker.io/cloudflare/sandbox:latest

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code@latest

# Install sandbox dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy agent ecosystem (skills, agents, workflows)
COPY agent/ /app/agent/
COPY agent/.claude/ /app/agent/.claude/

# Copy sandbox entry point and supporting modules
COPY agent-runner.ts orchestrator-prompt.ts nano-banana-mcp.ts ./

RUN chmod -R a+rX /app

# Required for wrangler dev port access
EXPOSE 8080

# Container stays alive; DO invokes commands via exec
CMD ["sleep", "infinity"]
```

**Build context**: The Dockerfile is in `cloudflare/sandbox/`. The agent ecosystem files need to be copied FROM `agent/` (project root) INTO the Docker build context. Options:
- **Option A**: Symlink or copy `agent/` into `cloudflare/sandbox/agent/` before build
- **Option B**: Use `docker build -f cloudflare/sandbox/Dockerfile .` from project root
- **Option C**: Add a build script that copies files into the sandbox directory

### 4.2 `cloudflare/sandbox/package.json`

```json
{
  "name": "creative-agent-sandbox",
  "private": true,
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "@fal-ai/client": "^1.0.0",
    "tsx": "^4.0.0",
    "zod": "^3.0.0"
  }
}
```

### 4.3 `cloudflare/sandbox/agent-runner.ts`

Entry point invoked by DO via `sandbox.exec()`. Port of `server/lib/ai-client.ts` as a standalone script.

**Key logic** (from `ai-client.ts:244-274` queryStream + `ai-client.ts:208-236` createPromptGenerator):

```typescript
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
    'Task', 'Skill', 'TodoWrite',
    'WebFetch', 'WebSearch', 'Read', 'Write',
    'Bash', 'Edit', 'Glob', 'Grep',
    'mcp__nano-banana__generate_ad_images',
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
  mcpServers: { 'nano-banana': nanoBananaMcpServer },
};

const resumeOptions = resumeSdkSessionId ? { resume: resumeSdkSessionId } : {};
const options = { ...baseOptions, ...resumeOptions };

const abortController = new AbortController();

async function* createPrompt() {
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: prompt },
    parent_tool_use_id: null,
  };
  // Hold generator open until query() completes
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
  // Resume failed — fall back to fresh session
  if (resumeSdkSessionId && err?.message?.includes('resume')) {
    console.error(`Resume failed, starting fresh: ${err.message}`);
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

### 4.4 `cloudflare/sandbox/orchestrator-prompt.ts`

**Verbatim copy** from `server/lib/orchestrator-prompt.ts` (77 lines). Single export: `ORCHESTRATOR_SYSTEM_PROMPT`.

### 4.5 `cloudflare/sandbox/nano-banana-mcp.ts`

Port of `server/lib/nano-banana-mcp.ts` (359 lines):

**Changes**:
1. **Remove** `import { imageEvents } from './image-events.js'` (line 7)
2. **Remove** entire `imageEvents.emit(...)` block (lines 289-299)
3. **Change** `ensureOutputDirectory()` (lines 43-58):
   - Replace `path.resolve(__dirname, '..', '..', 'generated-images')` with `process.env.IMAGE_OUTPUT_DIR || '/mnt/r2/images'`
4. **Remove** `__filename`/`__dirname` declarations (lines 9-10) — no longer needed

**Keep unchanged**:
- All fal.ai API calls
- `sanitizeFilename()`, `downloadImage()`, `configureFalClient()`
- Tool schema (`generate_ad_images` with all z.* validators)
- URL format: `/images/{sessionId}/{filename}`
- Hook type mapping: `getHookTypeForIndex()`

---

## 5. Files to Modify (5)

### 5.1 `cloudflare/src/durable-objects/campaign-session.ts`

**Major changes**:

#### a. Add sandbox instance field (new property)
```typescript
private sandbox: any = null;  // Sandbox instance for cancel support
```

#### b. Update `runGeneration()` signature
```typescript
// Before (Phase 3):
private async runGeneration(prompt: string, sessionId: string): Promise<void>

// After (Phase 4):
private async runGeneration(prompt: string, sessionId: string, sdkSessionId?: string): Promise<void>
```

#### c. Replace `runGeneration()` body (lines 292-341)

Full pseudocode:

```
private async runGeneration(prompt, sessionId, sdkSessionId?):
  // Setup (same as Phase 3 stub)
  blockBuilder = new BlockBuilder()
  blockBuilder.openThinkingBlock('Parsing Request')
  textAccumulator = { text: '' }
  processedFilenames = new Set()
  existingImageCount = await db.getImageCount(env.DB, campaignId) || 0
  imageCounter = { next: existingImageCount + 1 }
  generationCompleted = false
  wasCancelled = false

  ctx: ParserContext = {
    emitEvent: (event) => this.emitEvent(event),
    campaignId: this.campaignId,
    d1: this.env.DB,
    processedFilenames,
    textAccumulator,
    blockBuilder,
    imageCounter,
  }

  try {
    // 1. Get or create sandbox
    const sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId}`, {
      sleepAfter: '10m'
    });
    this.sandbox = sandbox;

    // 2. Mount R2 for per-user storage
    await sandbox.mountBucket(this.env.R2_BUCKET, '/mnt/r2', { readOnly: false });

    // 3. Start agent-runner with streaming
    const messageQueue: any[] = [];
    let execDone = false;

    const execPromise = sandbox.exec('npx tsx /app/agent-runner.ts', {
      cwd: '/app',
      env: {
        ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
        FAL_KEY: this.env.FAL_KEY,
        PROMPT: prompt,
        SESSION_ID: sessionId,
        RESUME_SDK_SESSION_ID: sdkSessionId || '',
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
        HOME: '/mnt/r2',
        IMAGE_OUTPUT_DIR: '/mnt/r2/images',
      },
      stream: true,
      onOutput: (stream, data) => {
        if (stream === 'stdout') {
          for (const line of data.split('\n').filter(Boolean)) {
            try { messageQueue.push(JSON.parse(line)); } catch {}
          }
        } else if (stream === 'stderr') {
          console.error('Sandbox stderr:', data);
        }
      }
    }).then(result => {
      execDone = true;
      return result;
    });

    // 4. Concurrent drain loop — process messages as they arrive
    while (true) {
      if (messageQueue.length > 0) {
        const msg = messageQueue.shift()!;

        // Check for abort
        if (this.abortController?.signal.aborted) {
          wasCancelled = true;
          break;
        }

        await processSDKMessage(msg, ctx);

        // Detect completion
        if (msg.type === 'result' && !wasCancelled) {
          generationCompleted = true;
        }
      } else if (execDone) {
        break;
      } else {
        // Yield to let exec fill queue
        await new Promise(r => setTimeout(r, 10));
      }
    }

    // 5. Wait for exec to finish (should already be done)
    const result = await execPromise;

    // 6. Drain any remaining messages
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift()!;
      await processSDKMessage(msg, ctx);
      if (msg.type === 'result') generationCompleted = true;
    }

    // 7. Handle completion
    if (generationCompleted && this.campaignId) {
      const duration = Date.now() - startTime;
      const imageCount = imageCounter.next - 1;
      const summary = this.generateSummary(textAccumulator, imageCounter);

      this.emitEvent({
        type: 'complete',
        timestamp: new Date().toISOString(),
        sessionId,
        campaignId: this.campaignId,
        duration,
        imageCount,
        summary,
      });

      await db.updateCampaignStatus(this.env.DB, this.campaignId, 'complete');
      blockBuilder.closeThinkingBlock('complete');
      await db.addMessage(this.env.DB, {
        campaignId: this.campaignId,
        role: 'assistant',
        content: summary || 'Generation complete.',
        blocks: blockBuilder.getBlocks(),
      });
    } else if (!wasCancelled && !generationCompleted && this.campaignId) {
      // Stream ended without a result message
      this.emitEvent({
        type: 'incomplete',
        timestamp: new Date().toISOString(),
        error: 'generation_ended_unexpectedly',
      });
      await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');
    }

    if (wasCancelled && this.campaignId) {
      await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
      blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
      await db.addMessage(this.env.DB, {
        campaignId: this.campaignId,
        role: 'assistant',
        content: 'Generation was cancelled.',
        blocks: blockBuilder.getBlocks(),
      });
    }

  } catch (error: any) {
    const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
    if (isAbort) {
      wasCancelled = true;
      // ... same cancel handling as above
    } else {
      const errorMsg = error.message || 'Unknown error';
      this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
      if (this.campaignId) {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
        blockBuilder.addStatusBlock(`Error: ${errorMsg}`, 'error');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          blocks: blockBuilder.getBlocks(),
        });
      }
    }
  } finally {
    this.isGenerating = false;
    this.abortController = null;
    this.sandbox = null;
  }
```

#### d. Update `handleCancel()` (line 243)

Add sandbox destruction:
```typescript
private handleCancel(): void {
  if (this.abortController) {
    this.abortController.abort();
    if (this.sandbox) {
      this.sandbox.destroy().catch(() => {});
      this.sandbox = null;
    }
    this.sendWS({
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Cancel requested',
    });
  }
}
```

#### e. Update `handleGenerate()` and `handleFollowUp()`

- `handleGenerate()` (line 169): `await this.runGeneration(prompt, sessionId)` → `await this.runGeneration(prompt, sessionId, undefined)`
- `handleFollowUp()` (line 228): `await this.runGeneration(prompt, wsSessionId)` → `await this.runGeneration(prompt, wsSessionId, sdkSessionId ?? undefined)`

#### f. Add import for getSandbox

```typescript
import { getSandbox } from '@cloudflare/sandbox';
```

### 5.2 `cloudflare/src/env.d.ts`

```typescript
import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  // D1 database
  DB: D1Database;

  // R2 storage bucket
  R2_BUCKET: R2Bucket;

  // Durable Object namespaces
  CAMPAIGN_SESSION: DurableObjectNamespace;
  SANDBOX: DurableObjectNamespace<Sandbox>;

  // Secrets
  ANTHROPIC_API_KEY: string;
  FAL_KEY: string;
  CLERK_SECRET_KEY: string;

  // Vars
  CF_ACCOUNT_ID: string;
}
```

### 5.3 `cloudflare/wrangler.jsonc`

Add `containers` section and update DO bindings + migrations:

```jsonc
{
  // ... existing config ...

  // Sandbox container (runs Claude SDK)
  "containers": [{
    "class_name": "Sandbox",
    "image": "./sandbox/Dockerfile",
    "instance_type": "standard",
    "max_instances": 10
  }],

  // Durable Objects (add Sandbox binding)
  "durable_objects": {
    "bindings": [
      { "name": "CAMPAIGN_SESSION", "class_name": "CampaignSession" },
      { "name": "SANDBOX", "class_name": "Sandbox" }
    ]
  },

  // Migrations (add Sandbox class)
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["CampaignSession"],
      "new_sqlite_classes": ["CampaignSession", "Sandbox"]
    }
  ]
}
```

### 5.4 `cloudflare/package.json`

Add `@cloudflare/sandbox` as a dependency:

```json
{
  "dependencies": {
    "@cloudflare/sandbox": "latest"
  }
}
```

### 5.5 `cloudflare/src/index.ts`

Add Sandbox re-export (required by wrangler for DO class registration):

```typescript
export { Sandbox } from '@cloudflare/sandbox';
```

---

## 6. Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Sandbox source files | `sandbox/Dockerfile`, `sandbox/package.json`, `sandbox/agent-runner.ts`, `sandbox/orchestrator-prompt.ts`, `sandbox/nano-banana-mcp.ts` |
| 2 | Config updates | `wrangler.jsonc`, `env.d.ts`, `package.json`, `src/index.ts` |
| 3 | Replace runGeneration() stub | `src/durable-objects/campaign-session.ts` |
| 4 | Update handleCancel() | `src/durable-objects/campaign-session.ts` |
| 5 | TypeScript check | `npx tsc --noEmit` |
| 6 | Deploy & test | `wrangler deploy` |

---

## 7. Porting Reference

### Source → Destination

| Server File | Cloudflare File | Notes |
|-------------|----------------|-------|
| `server/lib/orchestrator-prompt.ts` | `sandbox/orchestrator-prompt.ts` | Verbatim copy |
| `server/lib/nano-banana-mcp.ts` (359 lines) | `sandbox/nano-banana-mcp.ts` | Remove imageEvents, change output dir to R2 mount |
| `server/lib/ai-client.ts:25-72` (defaultOptions) | `sandbox/agent-runner.ts` (baseOptions) | Same config: model, maxTurns, tools, MCP, prompt |
| `server/lib/ai-client.ts:208-236` (createPromptGenerator) | `sandbox/agent-runner.ts` (createPrompt) | Same keep-alive pattern |
| `server/lib/ai-client.ts:244-274` (queryStream) | `sandbox/agent-runner.ts` (main loop) | query() → NDJSON stdout |
| `server/lib/ai-client.ts:307-339` (queryWithSession resume) | `sandbox/agent-runner.ts` (resume fallback) | Same try/catch pattern |
| `server/lib/image-events.ts` (36 lines) | **Eliminated** | DO parses images from sandbox stdout |
| `server/lib/session-manager.ts` (343 lines) | **Eliminated** | DO state + D1 + R2 JSONL |
| `cloudflare/src/lib/sdk-message-parser.ts` | Already ported (Phase 3) | Used by DO to parse sandbox stdout |
| `cloudflare/src/lib/block-builder.ts` | Already ported (Phase 3) | Used for message persistence |
| `cloudflare/src/db/index.ts` | Already ported (Phase 1) | D1 access layer |

### DB functions used by runGeneration()

From `cloudflare/src/db/index.ts`:
- `db.getImageCount(d1, campaignId)` — get existing image count for follow-up offset
- `db.updateCampaignStatus(d1, campaignId, status)` — update to complete/error/cancelled/incomplete
- `db.addMessage(d1, { campaignId, role, content, blocks })` — save assistant message
- `db.updateSdkSessionId(d1, campaignId, sessionId)` — save for follow-up resume (called by processSDKMessage)
- `db.updateCampaignFile(d1, campaignId, fileType, content)` — save research/hooks/prompts (called by processSDKMessage)
- `db.addCampaignImage(d1, { campaignId, imageIndex, hookType, prompt, filePath })` — save image metadata (called by processSDKMessage)

---

## 8. Streaming Design

### The Problem

`sandbox.exec()` with `stream: true` provides an `onOutput(stream, data)` callback that fires synchronously during the `await`. But `processSDKMessage()` is async (does D1 writes). We can't `await` inside `onOutput`.

### The Solution: Concurrent drain loop

```
exec stream:     [msg1] [msg2] [msg3] [msg4] [msg5] ... [done]
                    ↓      ↓      ↓      ↓      ↓
messageQueue:    [...pushed by onOutput callback...]
                    ↓      ↓      ↓      ↓      ↓
drain loop:      [processSDKMessage(msg1)] → [processSDKMessage(msg2)] → ...
                    ↓ emit WS event            ↓ emit WS event
                    ↓ D1 write                 ↓ D1 write
```

1. `sandbox.exec()` starts streaming — calls `onOutput` for each stdout chunk
2. `onOutput` parses JSON lines and pushes to `messageQueue[]` (sync)
3. A concurrent async loop drains the queue: shifts a message, `await processSDKMessage(msg, ctx)`
4. `processSDKMessage` calls `emitEvent()` (sends to WS immediately) AND `await db.*()` (D1 writes)
5. Between each `await` in the drain loop, the JS event loop processes the next exec chunk → `onOutput` → queue fills
6. When exec completes (`execDone = true`) and queue is empty, the loop exits

**Why this works**: In the Workers/DO runtime, `await` yields to the event loop. The exec's internal streaming `await`s between chunks, the drain loop's `await processSDKMessage()` between messages — they interleave naturally. The `setTimeout(10ms)` is a safety valve for when the queue is temporarily empty.

### Fallback

If the concurrent approach proves problematic (e.g., exec blocks the event loop during streaming), the fallback is simpler:

```typescript
// Non-streaming: process all messages after exec completes
const result = await sandbox.exec('npx tsx /app/agent-runner.ts', { env: { ... } });
const lines = result.stdout.split('\n').filter(Boolean);
for (const line of lines) {
  try {
    const msg = JSON.parse(line);
    await processSDKMessage(msg, ctx);
  } catch {}
}
```

This works correctly but sends all WS events at once after the 2-3 minute generation completes (no real-time progress). Use as MVP if streaming doesn't work, then optimize.

---

## 9. Verification

### TypeScript check
```bash
cd cloudflare && npx tsc --noEmit
```

### Build sandbox image (local Docker)
```bash
cd cloudflare && docker build -t creative-agent-sandbox ./sandbox
```

### Deploy to Cloudflare
```bash
cd cloudflare && wrangler deploy
```

### End-to-end tests (against deployed URL)

| # | Test | Send | Expected |
|---|------|------|----------|
| 1 | Generate | `{ type: 'generate', prompt: 'nike.com', sessionId: 'test-1' }` | `ack` → `phase:parse` → `phase:research` → `phase:hooks` → `phase:art` → `phase:images` → `image` events → `complete` |
| 2 | Reconnect | Disconnect, reconnect, `{ type: 'subscribe', sessionId: 'test-1', lastEventId: 0 }` | All buffered events replayed → `subscribed` |
| 3 | Cancel | Start generation, then `{ type: 'cancel' }` | Sandbox destroyed, `ack: "Cancel requested"`, campaign status `cancelled` |
| 4 | Follow-up | `{ type: 'follow_up', prompt: 'make them blue', campaignId: '<id>' }` | SDK resumes from R2 JSONL, new images appended |
| 5 | Images | `GET /images/{sessionId}/{filename}` | PNG served from R2 |
| 6 | REST | `GET /api/campaigns` | Campaign with status `complete`, images, files |

### D1 verification after generate
- **campaigns**: 1 row, status `complete`, `sdk_session_id` populated
- **campaign_files**: 3 rows (research, hooks, prompts) with `is_ready = 1`
- **campaign_images**: N rows matching generated images
- **messages**: user message + assistant message with blocks JSON

### R2 verification after generate
- `users/{userId}/images/{sessionId}/` — generated PNG files
- `users/{userId}/.claude/projects/{hash}/{sdkSessionId}.jsonl` — SDK transcript

---

## Open Questions / TODO

1. **Instance type sizing**: The sandbox skill reference shows `lite` (256MB), `standard` (512MB), `heavy` (1GB). These are likely too small for Claude CLI + Node.js + MCP. Need to verify if there's a larger tier or if the architecture doc's `standard-1` (4GB) is a separate product.

2. **Bucket mount prefix**: The architecture doc proposed per-user isolation via `prefix: /users/${userId}/`. The sandbox SDK's `mountBucket()` doesn't document a `prefix` option. Current plan: mount entire bucket at `/mnt/r2`, set `HOME=/mnt/r2` for JSONL, use `IMAGE_OUTPUT_DIR=/mnt/r2/images` for images. Per-user isolation happens via sandbox-level isolation (one sandbox per user = one mount per user).

3. **Docker build context**: The agent ecosystem (`agent/`) lives at project root, not in `cloudflare/sandbox/`. Need to either copy files into the build context or use a Dockerfile path that spans the project root.

4. **wrangler dev limitations**: R2 FUSE mount doesn't work locally. For local dev, either: (a) skip sandbox and use a local AI backend flag, or (b) deploy and test against production sandbox.

5. **Asset attachments**: `assetFileIds` parameter in generate/follow_up is not yet wired up. Deferred to Phase 4b.
