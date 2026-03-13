# Session 26: Long-Running Agent Implementation (Phase 2)

**Date:** 2026-03-06
**Branch:** `new-ui`
**Prior version:** `d51b0081` (Session 24)
**Deployed version:** `b998bf6d`

## Goal

Eliminate ~2.7 min SDK CLI cold start on every follow-up. Keep agent-runner process alive between turns. Follow-ups drop from ~3 min to ~30-60s.

## Research Phase

Launched 3 parallel research agents before coding:

### Finding 1: JSONL Risk Doesn't Exist
The Phase 2 plan assumed the SDK keeps the JSONL file descriptor open (requiring `unmountBucket` to flush). **Wrong.** The SDK uses `fs.promises.appendFile` — open-write-close every 100ms via a drain timer. Each `close()` triggers s3fs upload to R2. JSONL syncs continuously. At most ~100ms of buffered messages lost on crash.

**Impact:** Removed the entire R2 unmount concern. No DO-side JSONL backup needed. Fallback `resume` works because JSONL is already in R2.

### Finding 2: Industry Pattern Confirmed
Every major production system (Claude Cowork, OpenAI Codex, LangGraph, Temporal) uses the same architecture:
1. Append-only log as source of truth (JSONL, DB checkpoints)
2. Keep process alive when possible (fast path)
3. Reconstruct from log when process dies (fallback)

Our architecture matches this pattern exactly.

### Finding 3: All Verification Items Passed
- `parseSSEStream` — exported from `@cloudflare/sandbox` ✓
- `startProcess()` — accepts `env` and `cwd` ✓
- `streamProcessLogs()` — real-time only, no historical replay ✓
- `sandbox.readFile()` — works from DO context ✓

### Finding 4: Risks Eliminated
- Risk 1 (log replay) — eliminated: `streamProcessLogs` is real-time only
- Risk 3 (JSONL not flushed) — eliminated: `appendFile` pattern
- Risk 4 (parseSSEStream import) — eliminated: verified export
- Risk 5 (startProcess options) — eliminated: verified in docs
- Risk 2 (agent crashes) and Risk 6 (concurrent follow-ups) — still valid, mitigated

## Implementation

### Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/package.json` | SDK `0.2.64` → `0.2.69` (memory leak fix for long-lived process) |
| `cloudflare/sandbox/agent-runner.ts` | Rewrite: long-lived process with `promptStream()` generator, `waitForPromptFile()` IPC, `writeStatus()` health check, `turn_complete` sentinel |
| `cloudflare/src/durable-objects/campaign-session.ts` | `startProcess()` + `streamProcessLogs()` replaces `exec()` + drain loop. New `isAgentProcessAlive()`, `runFollowUpFast()`. Cancel uses `killProcess()` instead of `destroy()`. R2 stays mounted. |

### Architecture

```
FIRST GENERATION (cold start, ~5 min):
  User → WS → DO.handleGenerate()
    → getSandbox() with sleepAfter:'2h'
    → mount R2, IP check (same as before)
    → startProcess('node agent-runner.js', {env})
    → save agentProcessId to storage
    → streamProcessLogs(processId) → parse SDK messages → WS to client
    → agent-runner stays alive after result/turn_complete

FOLLOW-UP — FAST PATH (agent alive, ~30-60s):
  User → WS → DO.handleFollowUp()
    → getSandbox() → same container
    → listProcesses() → agent-runner alive? YES
    → readFile('/app/agent-status.json') → status: 'idle'? YES
    → streamProcessLogs(processId) → start listening
    → writeFile('/app/next-prompt.json', {prompt})
    → agent-runner detects file → yields to AsyncGenerator → SDK processes
    → parse new SDK messages → WS to client

FOLLOW-UP — SLOW PATH (agent dead, ~3 min):
  User → WS → DO.handleFollowUp()
    → getSandbox() → container may be new
    → listProcesses() → agent-runner NOT found
    → mount R2, IP check, hydrate files (same as cold start)
    → startProcess('node agent-runner.js') → full cold start
```

### Key Design Decisions

1. **`startProcess()` instead of `exec()`** — Process survives DO hibernation (reconnectable via `listProcesses()`). Log access via `streamProcessLogs()`. Killable via `killProcess()`.

2. **File-based IPC** — `stdin` not supported (Sandbox SDK issue #357). DO writes `/app/next-prompt.json` via `sandbox.writeFile()`. Agent-runner polls every 500ms.

3. **R2 stays mounted** — Agent-runner needs `/mnt/r2` for writing images and completion markers on subsequent turns. JSONL syncs automatically via `appendFile` pattern.

4. **`agentProcessId` persisted independently** — Stored separately from `activeSession` in DO storage. Survives `clearPersistedSession()` (called after each generation). Only cleared on cancel or when agent found dead.

5. **`streamProcessLogs` before `writeFile`** — Start listening for logs BEFORE writing the prompt file to avoid race condition. `streamProcessLogs` is real-time only (no replay), so ordering matters.

6. **No R2 unmount in finally block** — JSONL syncs via `appendFile`. Images/markers written via `writeFileSync` (close triggers upload). Unmount only on cancel or fallback cold start.

### What's NOT Changed

- Client (React) — no changes
- D1 schema — no changes
- MCP server, system prompt — no changes
- Dockerfile — no changes (compiles agent-runner.ts inside Docker)
- Debug diagnostics — intentionally retained
- Local dev path (`runGenerationLocal`) — no changes
- Auth — no changes
- Recovery layer (completion marker) — still works

## Testing Plan

### Test 1: First Generation (Cold Start)
1. Open app, create new campaign
2. Send prompt
3. **Watch for:** `Agent process started: id=...` in wrangler tail
4. **Watch for:** `turn_complete` in logs (agent stayed alive)
5. **Verify:** Generation completes, images appear

### Test 2: Fast Follow-Up (Agent Alive)
1. Immediately after Test 1, send follow-up
2. **Watch for:** `Agent process alive — taking fast path` in logs
3. **Watch for:** `Prompt file written, streaming output...` in logs
4. **Verify:** Completes in ~30-60s (not ~3 min)
5. **Verify:** Agent remembers context from first generation
6. **Verify:** Images from follow-up appear correctly

### Test 3: Follow-Up After Page Refresh
1. After Test 1, refresh the page
2. Send follow-up
3. **Watch for:** DO restores `agentProcessId` from storage
4. **Verify:** Fast path still taken (~30-60s)

### Test 4: Cancel During Generation
1. Start a generation
2. Cancel mid-generation
3. **Watch for:** `killProcess` in logs
4. **Verify:** Next generation starts fresh (cold start)

### Test 5: Multiple Follow-Ups
1. Generate → follow-up → follow-up → follow-up
2. **Verify:** Each follow-up is fast (~30-60s)
3. **Verify:** Context accumulates correctly across turns

### Test 6: Fallback (Agent Dead)
1. After Test 1, wait for container to sleep (2h) or manually kill agent
2. Send follow-up
3. **Watch for:** `Agent process not alive — falling back to full generation`
4. **Verify:** Follow-up completes (~3 min, same as before)
5. **Verify:** JSONL resume works (agent has conversation history)

## Expected Outcomes

| Scenario | Before | After |
|----------|--------|-------|
| First generation | ~5 min | ~5 min (same) |
| Follow-up (agent alive) | ~3 min | **~30-60s** |
| Follow-up (agent dead) | ~3 min | ~3 min (graceful fallback) |
| Follow-up after page refresh | ~3 min | **~30-60s** (agentProcessId restored) |

## Potential Issues to Watch

1. **`streamProcessLogs` SSE event format** — We access `event.data` with a cast (`(event as any).data`). If the actual field name differs, we'll get no output. Check for empty/silent fast path.

2. **`sandbox.readFile` return type** — We handle both string and `.contents` property. If the actual return is different, `isAgentProcessAlive` might always return false (falling back to slow path).

3. **Agent-runner process stability** — First time running the SDK as a long-lived process in this environment. Watch for OOM, memory leaks, or unexpected exits. SDK 0.2.69 includes the memory leak fix (0.2.51).

4. **`parseSSEStream` in DO context** — First time importing it from `@cloudflare/sandbox` in a DO. If there's a bundle/import issue, `runGeneration()` will fail entirely (not just the fast path).

## Research Docs Created

- `docs/RESEARCH_CLAUDE_SESSION_PERSISTENCE.md` — Claude Cowork architecture findings
- `docs/RESEARCH_LONG_RUNNING_AGENT_PATTERNS.md` — Industry patterns for long-running agents

## Next Session

1. Analyze test results from wrangler tail
2. Fix any issues found during testing
3. If fast path works: celebrate, measure timing improvement
4. If issues: debug using tail logs, fix, redeploy
