# Session 31: Reliability Fix — 2026-03-09

**Date:** 2026-03-09
**Branch:** `new-ui`
**Prior version:** `38693f93` (Session 30 — debug logging)
**Plan:** `docs/SESSION_31_RELIABILITY_FIX_PLAN.md`

## Context

Session 30 deployed debug logging to investigate follow-up hangs. This session analyzed the results from two test runs:

### Test 1 (log-2.md) — Single campaign, 7+ follow-ups
- **Generation**: PASS
- **Follow-ups 1-7**: All PASS (fast path, stream worked)
- **Follow-up 8**: DO reset after ~20 min of continuous operation → campaign stuck at `incomplete`
- **Root cause**: Platform eviction (WS closed code 1006, `DO was reset while campaign was generating`)

### Test 2 (log-3-do-reset.md) — Follow-up after DO reset
- **Follow-up 1** (cold resume): PASS — but agent asked for URL (context loss)
- **Follow-up 2** (fast path, immediate): PASS
- **Follow-up 3** (fast path, 7 min gap): **HUNG** — stream yielded zero events
- **Error shown to client**: `ReadableStream received over RPC disconnected prematurely.`

### Root causes identified

| Bug | Root cause | Evidence |
|-----|-----------|----------|
| Stream stalls after idle | `streamProcessLogs()` RPC connection dies after idle period, no keepalive | Zero events in log, RPC disconnect error |
| DO resets at ~20 min | Platform eviction, can't prevent | WS code 1006, no deploy during test |
| Agent asks for URL on cold resume | Orchestrator prompt says "Always need URL", overrides conversation history | System prompt line 28, 46 |

## Investigation (this session)

### Phase 1: Alarm polling approach (over-engineered, later removed)

Initially implemented alarm-based polling:
- `pollTurnResult()` read `turn-result.json` + `agent-status.json` every 30s from alarm handler
- `turnResultVersion` tracking to detect new results
- `pollFailCount` to give up after 5 failures
- Alarm self-healing: reconnect sandbox, restore session after DO reset

**Deployed version `a36fb967`** — alarm polling active.

### Phase 2: Testing revealed `readFile` parsing bug

**Test (log-4.md):** Follow-up hung again. Alarm polling ran but never completed the campaign.

Logs showed:
- Sandbox DO: `"File read", "details": "/app/turn-result.json (27089 chars)"` — file read successfully
- Our code: `[alarm-poll] turn-result.json empty or missing (0 chars)` — saw 0 chars

**Root cause:** `sandbox.readFile()` returns `{ content: string }` but we were reading `file.contents` (with an 's'). The property `contents` is undefined, so content fell through to empty string.

This typo existed in ALL readFile consumers:
- `reconcileImages()` — `file.contents` (line 708)
- `reconcileFiles()` — `raw?.contents` (line 761)
- `isAgentProcessAlive()` — `statusFile.contents` (line 677)
- `pollTurnResult()` — inherited same bug

**This means `reconcileImages` and `reconcileFiles` have been silently failing** since they were introduced. Images/files were only captured via SSE streaming, never via the reconciliation fallback.

### Phase 3: SDK research — found simpler approach

Researched the `@cloudflare/sandbox` SDK types (`sandbox-BYNjxjyr.d.ts`):

**Key discovery: `Process.waitForLog(pattern, timeout)`**
- Returns a promise that resolves when the pattern appears in process stdout
- Perfect for detecting `turn_complete` marker
- Much simpler than polling files from alarm handler

**Other useful SDK methods found:**
- `process.waitForExit(timeout)` — resolves when process exits
- `process.getStatus()` — returns `'running' | 'completed' | 'failed' | 'killed'`
- `process.getLogs()` — all accumulated stdout/stderr (no streaming)
- `sandbox.getProcessLogs(id)` — same but on sandbox object
- `sandbox.watch(path)` — inotify-based file watching

**`ReadFileResult` type confirmed:**
```ts
interface ReadFileResult {
  success: boolean;
  path: string;
  content: string;    // ← NOT "contents"
  timestamp: string;
  encoding?: 'utf-8' | 'base64';
  isBinary?: boolean;
  mimeType?: string;
  size?: number;
}
```

### Phase 4: Simplified architecture

**Removed (over-engineering):**
- `pollTurnResult()` — 90 lines of polling logic
- `turnResultVersion` + `pollFailCount` instance vars
- `readFileToString()` helper
- Completion handling in stream loops (both `runFollowUpFast` and `runGeneration`)
- D1 guards for alarm vs stream race conditions

**Added (simple):**
- `attachCompletionHandler()` — uses `proc.waitForLog('turn_complete', 600_000)` as the ONLY completion path
- `agentProcess` instance var for the process object

**Fixed:**
- `file.contents` → `file.content` in `reconcileImages`, `reconcileFiles`, `isAgentProcessAlive` (the actual bug that broke everything)

**Simplified:**
- Alarm = heartbeat (keeps DO alive) + reconnect/re-attach `waitForLog` after DO reset
- Stream = live UI only (thinking blocks, progress, images). Does NOT handle completion
- No race condition — one completion path (`waitForLog`), not two

### Orchestrator prompt + cold resume context (unchanged from plan)

- **Fix 2 (cold resume):** `handleFollowUp` slow path appends `[SYSTEM NOTE]` with file locations to prompt
- **Fix 3 (orchestrator prompt):** Rule 1 changed from "Always need a URL" to check for existing files first on follow-ups

## Architecture (after this session)

```
User sends follow-up
        │
        ├──→ Stream (best-effort live UI)
        │     Sends thinking blocks, progress, images to client
        │     May stall/die — doesn't matter
        │
        └──→ waitForLog('turn_complete') (reliable completion)
              Resolves when agent prints turn_complete
              → reads turn-result.json (file.content, not file.contents!)
              → saves images/files to D1
              → sends 'complete' event to client
              → sets isGenerating = false

Alarm (every 30s):
  - Normal: just keeps DO alive
  - After DO reset: restoreSession → reconnect sandbox → re-attach waitForLog
```

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `attachCompletionHandler()` with `waitForLog`, removed `pollTurnResult` + polling vars + `readFileToString`, fixed `contents` → `content` in 3 places, stream-only for UI, simplified alarm |
| `cloudflare/sandbox/orchestrator-prompt.ts` | Rule 1: URL optional for follow-ups |

## Status: NOT YET DEPLOYED

TypeScript compiles clean. Ready to deploy and test.

Previous deploys during debugging:
- `a36fb967` — alarm polling (had readFile parsing bug)
- `5b631293` — added poll logging
- `cb7c865f` — readFileToString attempt (still had wrong approach)

## Next Steps

1. **Deploy** the simplified `waitForLog` approach
2. **Test sequence:**
   - Generate campaign → wait for completion
   - Follow-up immediately → should work (fast path + stream + waitForLog)
   - Wait 7+ min → follow-up → stream may stall, but waitForLog completes it
   - Refresh page (forces DO reset) → follow-up → cold resume should NOT ask for URL
3. **Verify `reconcileImages`/`reconcileFiles` now actually work** (they were silently broken by the `contents` typo)
4. **Monitor** `wrangler tail` for `[completion]` log messages

## Key Lessons

1. **Always check SDK type definitions** before writing code. The `contents` vs `content` typo caused weeks of silent failures.
2. **Use SDK primitives** (`waitForLog`, `waitForExit`) instead of building custom polling. The SDK already solves the problem.
3. **One completion path, not two.** Having both stream and alarm handle completion created race conditions and complexity. `waitForLog` is the single source of truth.
4. **Alarm = heartbeat only.** Don't overload it with business logic. Its job is preventing hibernation and recovering after resets.
