# Session 25: Long-Running Agent Research

**Date:** 2026-03-05
**Branch:** `new-ui`
**Prior version:** `d51b0081` (Session 24)
**Type:** Research + planning (no code changes)

## Goal

Eliminate the ~2.7 min SDK CLI cold start on every follow-up generation. Design an architecture where the agent-runner process stays alive between turns, reducing follow-ups from ~3 min to ~30-60s.

## Context

From Session 24 testing, the timing breakdown for a follow-up was:

| Component | Time | % of total |
|-----------|------|------------|
| R2 mount + IP check | ~11s | 5% |
| **SDK CLI startup** | **~2.5 min** | **72%** |
| File hydration | ~1s | <1% |
| Actual API call | ~30-60s | 23% |

The SDK CLI startup (Node.js spawn, tool loading, MCP server init) happens on **every** generation — initial or follow-up. The actual useful work (API call to Claude) is only 30-60s.

## Research Conducted

Three parallel research agents were launched covering:

1. **Claude Agent SDK** — multi-turn capabilities, `streamInput()`, V2 Session API
2. **Cloudflare Sandbox SDK** — long-running processes, IPC, reconnection
3. **DO Hibernation** — warm patterns, costs, new Cloudflare features

### Sources Consulted

**Claude Agent SDK:**
- Local docs: `claude_sdk/streaming_input.md`, `claude_sdk/session_management.md`, `claude_sdk/typescript_sdk.md`, `claude_sdk/sdk_hosting.md`
- SDK types: `cloudflare/sandbox/node_modules/@anthropic-ai/claude-agent-sdk/sdk.d.ts`
- GitHub: CHANGELOG.md, Issues #120, #133
- Platform docs: TypeScript V2 preview page

**Cloudflare Sandbox SDK:**
- `sandbox-sdk.txt` (local cache of full docs)
- API docs: commands, lifecycle, files, file-watching, sessions, transport
- GitHub: Issues #345 (keepAlive), #357 (stdin), #398 (timeout), #438 (stuck exec)

**Cloudflare DO/Workers:**
- DO lifecycle docs, pricing docs, limits docs
- Agents SDK v0.7.0 changelog
- workerd GitHub issue #4864 (outgoing WS hibernation)

---

## Key Findings

### Finding 1: V1 Streaming Input Mode Is the Solution

The SDK's `query()` function accepts an `AsyncIterable<SDKUserMessage>` as the prompt parameter. This is "Streaming Input Mode" — the recommended approach for multi-turn conversations.

**How it works:**
1. Your async generator yields Message 1
2. SDK processes it, yields assistant responses + `result/success`
3. **After `result/success`, the SDK does NOT close the generator.** It pulls the next value.
4. If the generator yields Message 2, a new turn begins with full context already in memory
5. The `for await` loop on the query continues yielding new messages

**Why this is fast:** The CLI subprocess stays alive. No re-initialization of Node, tools, or MCP servers. Just an API call with conversation history already loaded. This is exactly the pattern described in `claude_sdk/streaming_input.md`.

**Current code breaks this pattern:** `agent-runner.ts` line 53-56 calls `abortController.abort()` and `break` on `result`. This kills the query. The fix: don't break — let the generator wait for the next prompt.

### Finding 2: V2 Session API Exists But Can't Be Used

The SDK has `unstable_v2_createSession()` which returns an `SDKSession` with `send()` / `stream()` / `close()` methods. Clean API, but:

- `SDKSessionOptions` is **missing critical fields**: no `systemPrompt`, no `mcpServers`, no `cwd`, no `maxTurns`, no `settingSources`
- Marked `@alpha` / `unstable_`
- We need all those fields (orchestrator prompt, nano-banana MCP, `/app/agent` cwd)

**Decision:** Use V1 streaming input mode. Full `Options` support, stable API.

### Finding 3: `startProcess()` Is Better Than `exec()` for Long-Running

| Feature | `exec()` | `startProcess()` |
|---------|----------|-------------------|
| Reference survives DO hibernation | No | Yes (via `listProcesses()`) |
| Log access after reconnection | No | Yes (`streamProcessLogs()`, `getProcessLogs()`) |
| Kill specific process | No | Yes (`killProcess(id)`) |
| Stuck command recovery | Hangs forever (issue #438) | `killProcess()` always works |

**Decision:** Use `startProcess()` for agent-runner.

### Finding 4: File-Based IPC Is the Only Option

| IPC Method | Status |
|------------|--------|
| **`stdin`** | Not supported. Issue #357 closed. "Doing PTY API instead." |
| **File write** | Works. `sandbox.writeFile()` from DO, `fs.readFileSync()` in agent-runner |
| **HTTP server inside container** | Works but adds complexity (Express dep, curl exec) |
| **WebSocket** | Outgoing WS from DO doesn't survive hibernation (workerd #4864) |

**Decision:** File-based IPC. DO writes `/app/next-prompt.json` via `sandbox.writeFile()`. Agent-runner polls for it every 500ms.

### Finding 5: `keepAlive: true` Is Unreliable and Expensive

- **Issue #345:** Container still dies despite `keepAlive: true`. Fix uncertain.
- **Cost:** ~$220/month per user container if kept alive 24/7
- **Current `sleepAfter: '2h'`:** Container stays warm for 2h after last operation. Process stays alive. Good enough.

**Decision:** Keep `sleepAfter: '2h'`. No `keepAlive`.

### Finding 6: SDK Should Be Upgraded to 0.2.69

Current: 0.2.64. Latest: 0.2.69.

Key fixes relevant to long-running processes:
- **0.2.69:** `session.close()` persistence fix
- **0.2.51:** Unbounded UUID tracking memory leak — critical for long-lived processes
- **0.2.45:** Premature `session.stream()` return with background subagents

### Finding 7: New Cloudflare Features (Feb-Mar 2026)

| Feature | Relevance |
|---------|-----------|
| **Backup/Restore API** (Feb 23) | Could replace D1 file hydration. Not needed now. |
| **Agents SDK `keepAlive()`** (Mar 2) | Could replace manual alarm heartbeat. Nice-to-have. |
| **`sandbox.watch()`** (Mar 3) | SSE file watching via inotify. Could detect output files. |
| **Custom instance types** (Jan 5) | Can specify exact vCPU/memory. Not needed now. |

None are required for Phase 2 but worth noting for future optimization.

---

## Designed Architecture

### Agent-Runner (Long-Lived Process)

```
Start → SDK cold starts (~2.7 min) → process prompt 1 → result/success
  → write completion marker → write status "idle"
  → poll for /app/next-prompt.json every 500ms
  → file appears → read + delete → yield to AsyncGenerator
  → SDK processes prompt 2 (NO cold start, ~30-60s) → result/success
  → write completion marker → write status "idle"
  → continue polling...
```

### DO Flow (Two Paths)

```
Follow-up arrives → getSandbox() → listProcesses()
  ├─ Agent alive (fast path, ~30-60s):
  │    writeFile('/app/next-prompt.json', {prompt})
  │    streamProcessLogs(processId) → parse → WS to client
  │
  └─ Agent dead (fallback, ~3 min):
       mount R2, IP check, hydrate files
       startProcess('node agent-runner.js') → full cold start
```

### IPC Protocol

**DO → Agent-Runner:** JSON file at `/app/next-prompt.json`
```json
{ "prompt": "make it blue", "campaignId": "campaign_xyz", "requestId": "req_123" }
```

**Agent-Runner → DO:** JSON lines on stdout (same as current), plus `{"type":"turn_complete"}` sentinel after each turn.

**Health Check:** Agent-runner writes `/app/agent-status.json` with `{status: "idle"|"processing"|"starting", timestamp, pid}`. DO reads via `sandbox.readFile()`.

### State Persistence

One new field added to `this.state.storage`:

| Key | Value | Purpose |
|-----|-------|---------|
| `activeSession.agentProcessId` | `"abc123"` | Reconnect to agent-runner after DO hibernation |

---

## Files to Change

| File | Change | Complexity |
|------|--------|------------|
| `cloudflare/sandbox/agent-runner.ts` | Rewrite: `promptStream()` generator, `waitForPromptFile()` polling, status file, remove exit. Keep `writeCompletionMarker()` (called per turn). | High |
| `cloudflare/sandbox/package.json` | `@anthropic-ai/claude-agent-sdk`: `0.2.64` → `0.2.69` | Low |
| `cloudflare/src/durable-objects/campaign-session.ts` | Add `agentProcessId`, `isAgentProcessAlive()`, `runFollowUpFast()`. Modify `runGeneration()` to use `startProcess()` + `streamProcessLogs()`. Modify `handleCancel()` to use `killProcess()`. | High |

**No changes to:** client (React), D1 schema, R2 structure, MCP server, system prompt, container config, auth, Dockerfile.

---

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `streamProcessLogs()` replays old logs | Fast path gets confused by old output | Low | `turn_complete` sentinel + requestId marker |
| Agent-runner crashes between turns | Follow-up takes slow path | Low | `isAgentProcessAlive()` check, graceful fallback |
| R2 JSONL not flushed on process death | Resume fails, fresh session starts | Medium | Completion marker recovery. Fast path doesn't need JSONL |
| `parseSSEStream` import issues | Build error | Medium | Write minimal SSE parser as fallback |
| Concurrent follow-ups race on prompt file | Second prompt overwrites first | Low | Existing `isGenerating` guard prevents this |

---

## Plan Document

Full implementation plan with pseudocode: `docs/PHASE2_LONG_RUNNING_AGENT_PLAN.md`

---

## Next Session: Implementation

### Order of Work
1. Upgrade SDK to 0.2.69
2. Rewrite `agent-runner.ts` — long-lived process with file-based IPC
3. Verify `parseSSEStream` availability from `@cloudflare/sandbox`
4. Modify `campaign-session.ts` — `startProcess()`, fast path, cancel
5. Build + deploy
6. Test: generate → fast follow-up → refresh follow-up → fallback → cancel → multi-follow-up

### Expected Outcome
- First generation: ~5 min (unchanged)
- Follow-up (agent alive): ~30-60s (down from ~3 min)
- Follow-up (agent dead): ~3 min (graceful fallback, same as current)

### Must Verify Before Coding
- [ ] `parseSSEStream` export path from `@cloudflare/sandbox`
- [ ] `startProcess()` accepts `env` and `cwd` options (confirmed in docs, verify in types)
- [ ] `streamProcessLogs()` behavior: real-time only or includes historical logs
- [ ] `sandbox.readFile()` works from DO context (for status file check)
