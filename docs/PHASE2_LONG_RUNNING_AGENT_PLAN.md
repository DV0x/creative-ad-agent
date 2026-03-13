# Phase 2: Long-Running Agent Process

**Date:** 2026-03-05
**Branch:** `new-ui`
**Prior version:** `d51b0081` (Session 24)

## Problem

Every generation (initial or follow-up) starts the SDK CLI from scratch:
- Node.js spawns, SDK bootstraps, MCP servers connect, tools load
- **~2.7 min** before the first API call to Claude
- The actual API call + generation is only **~30-60s**
- Follow-ups feel painfully slow for users

## Solution

Keep the agent-runner process alive between generations. SDK initializes once on the first prompt. Follow-ups feed new prompts via file-based IPC — no restart, no re-initialization.

| Scenario | Current | After |
|----------|---------|-------|
| First generation | ~5 min | ~5 min (same) |
| Follow-up | ~3 min | **~30-60s** |
| Follow-up (process dead) | N/A | ~3 min (graceful fallback) |

## Architecture Overview

```
FIRST GENERATION:
  User → WS → DO.handleGenerate()
    → getSandbox() with sleepAfter:'2h'
    → mount R2, IP check (same as now)
    → startProcess('node agent-runner.js', {env}) ← NEW (was exec())
    → save processId to storage
    → streamProcessLogs(processId) → parse SDK messages → WS to client
    → agent-runner stays alive after result/success

FOLLOW-UP (agent alive — fast path):
  User → WS → DO.handleFollowUp()
    → getSandbox() → same container
    → listProcesses() → agent-runner alive? YES
    → writeFile('/app/next-prompt.json', {prompt})  ← NEW (file-based IPC)
    → streamProcessLogs(processId) → parse new SDK messages → WS to client

FOLLOW-UP (agent dead — fallback):
  User → WS → DO.handleFollowUp()
    → getSandbox() → container may be new
    → listProcesses() → agent-runner NOT found
    → mount R2, IP check, hydrate files (same as now)
    → startProcess('node agent-runner.js', {env}) → full cold start
```

---

## File Changes

### 1. `cloudflare/sandbox/agent-runner.ts` — Long-Lived Process

**Current behavior:** Process one prompt, write completion marker, exit after 5s.

**New behavior:** Process first prompt, then poll for follow-up prompts via `/app/next-prompt.json`. Stay alive indefinitely. Write completion marker after each turn.

#### Key Changes

**a) AsyncGenerator stays open across turns**

Current code (lines 35-48) yields one message then blocks until abort:
```typescript
// CURRENT — exits after one turn
async function* createPrompt() {
  yield { type: 'user', message: { role: 'user', content: prompt }, ... };
  // Hold open until query() completes
  await new Promise(resolve => { abortController.signal.addEventListener('abort', () => resolve()); });
}
```

New code — yields first message, then polls for follow-ups:
```typescript
const PROMPT_FILE = '/app/next-prompt.json';

async function* promptStream() {
  // Turn 1: initial prompt from env
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: process.env.PROMPT! },
    parent_tool_use_id: null,
    session_id: process.env.SESSION_ID!,
  };

  // Subsequent turns: wait for prompt files
  while (true) {
    const data = await waitForPromptFile();
    if (!data || data.shutdown) return; // end generator → ends query

    yield {
      type: 'user' as const,
      message: { role: 'user' as const, content: data.prompt },
      parent_tool_use_id: null,
      session_id: process.env.SESSION_ID!,
    };
  }
}
```

**Verified:** The SDK docs confirm that after `result/success`, the query does NOT close the generator. It pulls the next value from the input generator. If a new message is yielded, a new turn starts with full conversation history already in memory. No JSONL replay, no re-initialization.

**b) `waitForPromptFile()` — file-based IPC**

```typescript
function waitForPromptFile(): Promise<any> {
  return new Promise(resolve => {
    const check = () => {
      if (fs.existsSync(PROMPT_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(PROMPT_FILE, 'utf-8'));
          fs.unlinkSync(PROMPT_FILE); // delete after reading
          resolve(data);
        } catch {
          // Partial write — retry
          setTimeout(check, 500);
        }
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}
```

File format written by DO:
```json
{
  "prompt": "make the hooks more emotional",
  "campaignId": "campaign_xyz",
  "requestId": "req_1772729430737"
}
```

Or shutdown signal:
```json
{ "shutdown": true }
```

**c) Main loop — don't break on result**

Current (line 50-57):
```typescript
// CURRENT — breaks on result, exits
for await (const message of query({ prompt: createPrompt(), options })) {
  process.stdout.write(JSON.stringify(message) + '\n');
  if (message.type === 'result') {
    abortController.abort();
    break;
  }
}
```

New:
```typescript
for await (const message of query({ prompt: promptStream(), options })) {
  process.stdout.write(JSON.stringify(message) + '\n');

  if (message.type === 'result') {
    // Write completion marker but DON'T exit
    writeCompletionMarker();
    // Output a turn-complete sentinel so DO knows this turn is done
    process.stdout.write(JSON.stringify({ type: 'turn_complete' }) + '\n');
    // Loop continues — generator waits for next prompt file
  }
}
```

**d) Remove the 5s delayed exit**

Current (line 144):
```typescript
setTimeout(() => process.exit(0), 5000);
```

Remove this entirely. The process stays alive. It only exits when:
- The generator returns (shutdown signal)
- The process is killed externally (cancel or container sleep)

**e) Resume fallback stays**

The current try/catch for resume failure (lines 58-72) stays. If the first `query()` call fails because of a bad resume, we fall back to a fresh session. The key change: even the fresh session uses the long-lived `promptStream()` generator.

**f) `writeCompletionMarker()` — called per turn, not at exit**

Move the call from after the main loop (line 137) to inside the loop, after each `result` message. The function itself doesn't change — it still scans `/mnt/r2/images/` and reads agent output files.

**g) Status file for DO health checks**

Write a simple status file so the DO can verify the agent-runner is not just alive but also idle (ready for a new prompt):

```typescript
function writeStatus(status: 'starting' | 'processing' | 'idle' | 'error') {
  try {
    fs.writeFileSync('/app/agent-status.json', JSON.stringify({
      status,
      timestamp: Date.now(),
      pid: process.pid,
    }));
  } catch { /* ignore */ }
}
```

Called at:
- Process start → `writeStatus('starting')`
- Before first `query()` → `writeStatus('processing')`
- After each `result` → `writeStatus('idle')`
- On prompt file detected → `writeStatus('processing')`
- On error → `writeStatus('error')`

---

### 2. `cloudflare/sandbox/package.json` — SDK Upgrade

```json
"@anthropic-ai/claude-agent-sdk": "0.2.69"
```

Upgrade from 0.2.64 to 0.2.69. Key fixes:
- 0.2.69: `session.close()` persistence fix (important if we ever switch to V2 API)
- 0.2.51: Unbounded UUID tracking memory leak fix (critical for long-running processes)
- 0.2.45: Premature stream return fix for background subagents

---

### 3. `cloudflare/src/durable-objects/campaign-session.ts` — DO Changes

#### 3a. New instance variable

```typescript
private agentProcessId: string | null = null;
```

#### 3b. Persist/restore `agentProcessId`

In `persistSession()` (line 78-86), add `agentProcessId`:
```typescript
await this.state.storage.put('activeSession', {
  sessionId: this.sessionId,
  campaignId: this.campaignId,
  userId: this.userId,
  isGenerating: this.isGenerating,
  agentProcessId: this.agentProcessId,  // NEW
});
```

In `restoreSession()` (line 89-115), restore it:
```typescript
if (stored) {
  this.sessionId = stored.sessionId;
  this.campaignId = stored.campaignId;
  if (this.userId === 'anonymous' && stored.userId !== 'anonymous') {
    this.userId = stored.userId;
  }
  this.isGenerating = stored.isGenerating;
  this.agentProcessId = stored.agentProcessId || null;  // NEW
  return true;
}
```

#### 3c. New helper: `isAgentProcessAlive()`

```typescript
private async isAgentProcessAlive(sandbox: any): Promise<boolean> {
  if (!this.agentProcessId) return false;
  try {
    const processes = await sandbox.listProcesses();
    const agent = processes.find((p: any) =>
      p.id === this.agentProcessId && p.status === 'running'
    );
    if (!agent) return false;

    // Optional: check status file for staleness
    try {
      const statusRaw = await sandbox.readFile('/app/agent-status.json');
      const status = JSON.parse(statusRaw);
      if (status.status === 'idle' && Date.now() - status.timestamp < 7200000) {
        return true; // alive and idle within 2h
      }
      if (status.status === 'processing') {
        return false; // still processing previous turn — shouldn't happen, but be safe
      }
    } catch {
      // Status file missing — process might be in startup. Check process list was enough.
      return true;
    }
    return true;
  } catch {
    return false;
  }
}
```

**Verified:** `sandbox.listProcesses()` returns array of `{id, pid, command, status}`. Processes started via `startProcess()` are sandbox-wide and visible across sessions (confirmed in Sandbox SDK docs: "Processes are shared between sessions in the same sandbox").

#### 3d. `handleFollowUp()` — fast path

Current `handleFollowUp()` (line 299-392) always calls `runGeneration()` which starts a new `sandbox.exec()`.

New flow — check if agent-runner is alive first:

```typescript
private async handleFollowUp(prompt: string, campaignId: string, assetFileIds?: string[]): Promise<void> {
  // ... existing setup (lines 300-367 — campaign lookup, D1 message, ack) ...

  this.startKeepAlive();

  // Check if we can use the fast path
  const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
  const sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
    sleepAfter: '2h',
    normalizeId: true,
  });

  const agentAlive = await this.isAgentProcessAlive(sandbox);

  if (agentAlive) {
    // FAST PATH — write prompt file, stream output
    this.sandbox = sandbox;
    this.runFollowUpFast(sandbox, aiPrompt, wsSessionId, campaignId).catch((err) => {
      this.log(`[gen] Fast follow-up error: ${err?.message || err}`);
    });
  } else {
    // SLOW PATH — fall back to full runGeneration()
    this.log('[gen] Agent process not alive, falling back to full generation');
    this.agentProcessId = null;
    this.runGeneration(aiPrompt, wsSessionId, sdkSessionId).catch((err) => {
      this.log(`[gen] Unhandled runGeneration error: ${err?.message || err}`);
    });
  }
}
```

#### 3e. New method: `runFollowUpFast()`

This is the fast path — writes prompt file and streams output from the existing agent-runner process.

```typescript
private async runFollowUpFast(
  sandbox: any,
  prompt: string,
  sessionId: string,
  campaignId: string,
): Promise<void> {
  const startTime = Date.now();

  // Set up streaming state (same as runGeneration lines 492-512)
  const blockBuilder = new BlockBuilder();
  blockBuilder.openThinkingBlock('Processing Follow-Up');

  const textAccumulator: TextAccumulator = { text: '' };
  const processedFilenames = new Set<string>();
  const existingImageCount = campaignId
    ? (await db.getImageCount(this.env.DB, campaignId)) || 0
    : 0;
  const imageCounter = { next: existingImageCount + 1 };
  let generationCompleted = false;
  let wasCancelled = false;

  const ctx: ParserContext = {
    emitEvent: (event) => this.emitEvent(event),
    campaignId,
    d1: this.env.DB,
    processedFilenames,
    textAccumulator,
    blockBuilder,
    imageCounter,
  };

  try {
    const requestId = `req_${Date.now()}`;

    // 1. Start streaming logs BEFORE writing prompt (avoid race condition)
    this.log(`[gen-fast] Starting fast follow-up, requestId=${requestId}`);
    const logStream = await sandbox.streamProcessLogs(this.agentProcessId!);

    // 2. Write prompt file — triggers agent-runner
    await sandbox.writeFile('/app/next-prompt.json', JSON.stringify({
      prompt,
      campaignId,
      requestId,
    }));
    this.log(`[gen-fast] Prompt file written, waiting for output...`);

    // 3. Process log stream
    // Import parseSSEStream from @cloudflare/sandbox
    const { parseSSEStream } = await import('@cloudflare/sandbox');
    let seenTurnOutput = false;
    let stdoutBuffer = '';

    for await (const event of parseSSEStream(logStream)) {
      // Check abort
      if (this.abortController?.signal.aborted) {
        wasCancelled = true;
        break;
      }

      const rawData = event.data;
      if (!rawData) continue;

      // Buffer and split by newlines (same logic as current onOutput)
      stdoutBuffer += rawData;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);

          // Detect turn_complete sentinel
          if (msg.type === 'turn_complete') {
            generationCompleted = true;
            break;
          }

          seenTurnOutput = true;
          this.log(`[gen-fast] SDK message: type=${msg.type}${msg.subtype ? '/' + msg.subtype : ''}`);
          await processSDKMessage(msg, ctx);

          if (msg.type === 'result') {
            generationCompleted = true;
          }
        } catch {
          this.log(`[gen-fast] Non-JSON: ${line.substring(0, 120)}`);
        }
      }

      if (generationCompleted) break;
    }

    // 4. Handle completion (same as runGeneration lines 793-835)
    if (generationCompleted && campaignId) {
      const duration = Date.now() - startTime;
      const imageCount = imageCounter.next - 1 - existingImageCount;
      const summary = this.generateSummary(textAccumulator, imageCounter);

      this.emitEvent({
        type: 'complete',
        timestamp: new Date().toISOString(),
        sessionId,
        campaignId,
        duration,
        imageCount,
        summary,
      });

      await db.updateCampaignStatus(this.env.DB, campaignId, 'complete');
      blockBuilder.closeThinkingBlock('complete');
      await db.addMessage(this.env.DB, {
        campaignId,
        role: 'assistant',
        content: summary || 'Generation complete.',
        blocks: blockBuilder.getBlocks(),
      });
    }

  } catch (error: any) {
    const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
    if (isAbort) {
      wasCancelled = true;
      if (campaignId) {
        await db.updateCampaignStatus(this.env.DB, campaignId, 'cancelled');
      }
    } else {
      this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: error.message });
      if (campaignId) {
        await db.updateCampaignStatus(this.env.DB, campaignId, 'error');
      }
    }
  } finally {
    this.isGenerating = false;
    this.abortController = null;
    // Do NOT unmount R2 or kill agent-runner — keep warm for next follow-up
    // Do NOT clear agentProcessId — it's still alive
    await this.clearPersistedSession();
  }
}
```

#### 3f. `runGeneration()` changes — use `startProcess()` instead of `exec()`

In `runGeneration()` (line 657-722), replace `sandbox.exec()` with `sandbox.startProcess()` + `streamProcessLogs()`.

**Current** (line 657):
```typescript
const execPromise = sandbox.exec('node /app/dist/agent-runner.js', {
  cwd: '/app',
  env: { ... },
  stream: true,
  onOutput: (stream, data) => { ... },
});
```

**New:**
```typescript
// Start agent-runner as a background process
const agentProcess = await sandbox.startProcess('node /app/dist/agent-runner.js', {
  cwd: '/app',
  env: {
    ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
    FAL_KEY: this.env.FAL_KEY,
    PROMPT: prompt,
    SESSION_ID: sessionId,
    CAMPAIGN_ID: this.campaignId || '',
    RESUME_SDK_SESSION_ID: sdkSessionId || '',
    CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
    CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
    HOME: '/mnt/r2',
    IMAGE_OUTPUT_DIR: '/mnt/r2/images',
  },
});

// Save process ID for reconnection after hibernation
this.agentProcessId = agentProcess.id;
await this.persistSession();

this.log(`[gen] Agent process started: id=${agentProcess.id}, pid=${agentProcess.pid}`);

// Stream logs (same role as the old onOutput callback)
const { parseSSEStream } = await import('@cloudflare/sandbox');
const logStream = await sandbox.streamProcessLogs(agentProcess.id);

for await (const event of parseSSEStream(logStream)) {
  if (this.abortController?.signal.aborted) {
    wasCancelled = true;
    break;
  }

  const rawData = event.data;
  if (!rawData) continue;

  // Same line-buffering + JSON parsing as current onOutput
  stdoutBuffer += rawData;
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.type === 'turn_complete') {
        generationCompleted = true;
        break;
      }
      this.log(`[gen] SDK message: type=${msg.type}${msg.subtype ? '/' + msg.subtype : ''}`);
      await processSDKMessage(msg, ctx);
      if (msg.type === 'result') generationCompleted = true;
    } catch {
      this.log(`[gen] WARN: Non-JSON stdout line: ${line.substring(0, 120)}`);
    }
  }

  if (generationCompleted) break;
}
```

**What changes in the drain loop:** The current `messageQueue` + `execDone` + polling loop (lines 730-772) is replaced by the `for await` loop over `parseSSEStream(logStream)`. This is simpler — SSE events arrive one at a time, we process each, and break when we see `turn_complete`.

**What changes in the finally block** (lines 866-886):

```typescript
finally {
  this.isGenerating = false;
  this.abortController = null;
  // Do NOT unmount R2 — agent-runner needs it for subsequent turns
  // JSONL syncs automatically via SDK's appendFile pattern (close triggers s3fs upload)
  // Do NOT destroy sandbox — container stays warm
  // Do NOT kill agent-runner — it stays alive for follow-ups
  await this.clearPersistedSession();
}
```

**R2 mount lifecycle — RESOLVED (Session 26 research):**

Keep R2 mounted between turns. Do NOT unmount in the finally block. Two reasons:

1. **Agent-runner needs `/mnt/r2`** for writing images and completion markers on subsequent turns.
2. **JSONL syncs automatically.** The SDK uses `fs.promises.appendFile` (open-write-close every 100ms via a drain timer). Each `close()` triggers s3fs upload to R2. The JSONL is continuously synced — no unmount needed for flush.

If the process dies (container sleep, crash), at most the last ~100ms of JSONL messages are lost. The rest is already in R2. The fallback path can `resume` from the JSONL successfully.

Only unmount R2 in two cases:
1. Cancel — killing the process, no more turns expected
2. Fallback path — unmount stale mount before mounting fresh

#### 3g. `handleCancel()` changes

Current (line 394-412) destroys the sandbox. New — kill the agent-runner process instead:

```typescript
private async handleCancel(): Promise<void> {
  if (this.abortController) {
    this.log(`Cancelling generation for session ${this.sessionId}`);
    this.abortController.abort();

    if (this.sandbox && this.agentProcessId) {
      // Kill agent-runner process (loses warm session)
      try {
        await this.sandbox.killProcess(this.agentProcessId);
      } catch { /* ignore */ }
      this.agentProcessId = null;
    }

    // Don't destroy sandbox — container can be reused for next generation
    // (Agent-runner will start fresh on next handleGenerate)

    if (this.campaignId) {
      await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
    }
    this.sendWS({
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Cancel requested',
    });
  }
}
```

---

### 4. `cloudflare/sandbox/Dockerfile` — No Changes Expected

The Dockerfile already pre-compiles `agent-runner.ts` to `dist/agent-runner.js`. No changes needed unless we add new dependencies.

---

## Verification Checklist

All items verified (Session 26 research):

- [x] `sandbox.startProcess()` — returns `{id, pid, status, command}`. Options: `{cwd, env, stdin, timeout, processId, encoding, autoCleanup}`
- [x] `sandbox.streamProcessLogs(processId)` — returns `ReadableStream` of `LogEvent`. **Real-time only** (does NOT replay historical logs)
- [x] `sandbox.listProcesses()` — returns `ProcessInfo[]` with `{id, pid, command, status}`
- [x] `sandbox.killProcess(processId)` — terminates process + entire child process tree
- [x] `sandbox.writeFile(path, content)` — writes to container filesystem
- [x] `sandbox.readFile(path)` — reads from container filesystem, returns `FileInfo`
- [x] `parseSSEStream` — exported from `@cloudflare/sandbox`: `import { parseSSEStream, type LogEvent } from '@cloudflare/sandbox'`
- [x] V1 `query()` with AsyncGenerator prompt — after `result/success`, generator is pulled again for next message
- [x] `startProcess` options include `env` and `cwd` — confirmed with examples in docs

---

## Risk Assessment

### ~~Risk 1: `streamProcessLogs()` replays historical logs~~ — ELIMINATED
Docs confirm `streamProcessLogs()` is real-time only. `getProcessLogs()` is the separate API for accumulated/historical logs. No replay concern.

### Risk 2: Agent-runner process crashes between turns — STILL VALID
**Impact:** Follow-up takes the slow path (~3 min instead of ~30-60s).
**Likelihood:** Low — Node.js processes are stable, and the 0.2.51+ memory leak fix helps.
**Mitigation:** `isAgentProcessAlive()` checks `listProcesses()` + status file. Falls back to `runGeneration()` if process is dead. No user-facing error — just slower. JSONL is in R2 (synced via `appendFile`), so `resume` works on fallback.

### ~~Risk 3: R2 JSONL not flushed (process dies without unmount)~~ — ELIMINATED
SDK uses `fs.promises.appendFile` (open-write-close every 100ms via drain timer). Each `close()` triggers s3fs upload to R2. JSONL is continuously synced. At most ~100ms of buffered messages lost on crash — essentially nothing. Fallback path can `resume` from the JSONL in R2 successfully.

### ~~Risk 4: `parseSSEStream` import issues~~ — ELIMINATED
Verified: `import { parseSSEStream, type LogEvent } from '@cloudflare/sandbox'` — confirmed in docs with multiple examples.

### ~~Risk 5: `startProcess` doesn't support `env` or `cwd`~~ — ELIMINATED
Verified: `startProcess('node app.js', { cwd: '/workspace/my-app', env: { NODE_ENV: 'production' } })` — confirmed in docs.

### Risk 6: Concurrent follow-ups while agent-runner is processing — STILL VALID
**Impact:** User sends two follow-ups quickly. Second prompt overwrites the first file before agent-runner reads it.
**Likelihood:** Low — UI has "generation in progress" guard, and DO checks `isGenerating`.
**Mitigation:** The existing `isGenerating` check in `handleFollowUp()` (line 300-306) prevents this. Second request gets an error message.

---

## Testing Plan

### Test 1: First Generation (Cold Start) — Should Be Same As Now
1. Open app, create new campaign
2. Send prompt
3. Verify: SDK cold starts, generation completes, images appear
4. Verify: Agent-runner stays alive (check via wrangler tail for "turn_complete" and no process exit)

### Test 2: Follow-Up (Fast Path)
1. After Test 1, immediately send follow-up prompt
2. Verify: No SDK cold start in logs (no `system/init` message — or if present, very quick)
3. Verify: Follow-up completes in ~30-60s (not ~3 min)
4. Verify: Agent remembers context from first generation
5. Verify: Images from follow-up appear correctly

### Test 3: Follow-Up After Page Refresh
1. After Test 1, refresh the page
2. Send follow-up
3. Verify: DO wakes from hibernation, reconnects to sandbox
4. Verify: Agent process is still alive (fast path taken)
5. Verify: Follow-up still fast (~30-60s)

### Test 4: Follow-Up After Long Wait (Fallback)
1. After Test 1, wait for container to sleep (or kill agent-runner manually)
2. Send follow-up
3. Verify: DO detects process is dead, falls back to full `runGeneration()`
4. Verify: Follow-up completes (slow path, ~3 min)
5. Verify: No errors — graceful degradation

### Test 5: Cancel During Follow-Up
1. Start a follow-up
2. Cancel mid-generation
3. Verify: Agent-runner process is killed
4. Verify: Next generation starts a fresh agent-runner (cold start)

### Test 6: Multiple Follow-Ups
1. Generate → follow-up → follow-up → follow-up
2. Verify: Each follow-up is fast (~30-60s)
3. Verify: Context accumulates correctly across turns

---

## Implementation Order

1. **Upgrade SDK** — `package.json` to 0.2.69
2. **Agent-runner rewrite** — `agent-runner.ts` with `promptStream()`, `waitForPromptFile()`, status file, `turn_complete` sentinel
3. **DO changes** — add `agentProcessId`, `isAgentProcessAlive()`, `runFollowUpFast()`, modify `runGeneration()` to use `startProcess()`, modify `handleCancel()`. Import `parseSSEStream` from `@cloudflare/sandbox`
4. **Build + Deploy** — `tsc`, Docker build, wrangler deploy
5. **Test** — follow the test plan above

---

## What We're NOT Changing

- **Client (React)** — no changes. Same WebSocket messages, same UI.
- **Message protocol** — same SDK message types, same `result/success` handling.
- **D1 schema** — no schema changes.
- **R2 structure** — same image paths, same JSONL paths.
- **MCP server** — same nano-banana MCP.
- **System prompt** — same orchestrator prompt.
- **Container config** — same `standard-2`, same `sleepAfter:'2h'`, same `normalizeId:true`.
- **Auth** — no changes to Clerk auth flow.
- **Recovery layer** — completion marker still works.

---

## Open Questions — ALL RESOLVED (Session 26)

1. ~~**`parseSSEStream` import path**~~ — `import { parseSSEStream, type LogEvent } from '@cloudflare/sandbox'`. Confirmed.

2. ~~**`streamProcessLogs` behavior on reconnect**~~ — Real-time only. Does NOT replay historical logs. `getProcessLogs()` is the separate API for accumulated logs.

3. ~~**R2 mount lifecycle**~~ — Keep R2 mounted between turns. JSONL syncs automatically via SDK's `appendFile` pattern (open-write-close every 100ms, each `close()` triggers s3fs upload). No unmount needed for flush.

4. ~~**`startProcess` `cwd` behavior**~~ — Confirmed as a direct option: `{ cwd: '/workspace/my-app' }`. Not session-scoped.
