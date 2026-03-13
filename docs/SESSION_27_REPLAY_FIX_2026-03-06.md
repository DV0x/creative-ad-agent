# Session 27: streamProcessLogs Replay Fix + SSE Framing Issue

**Date:** 2026-03-06
**Branch:** `new-ui`
**Prior version:** `b998bf6d` (Session 26 — long-running agent deploy)
**Deployed version:** `605e485e`

## Context

Session 26 deployed Phase 2 (long-running agent). First test revealed follow-ups replayed the entire first generation's content instead of showing new output.

## Bug 1: streamProcessLogs Replay (FIXED)

### Root Cause

`streamProcessLogs()` from `@cloudflare/sandbox` **replays ALL historical stdout** from the process every time it's called. This was confirmed by reading the server-side source code (`packages/sandbox-container/src/handlers/process-handler.ts`):

1. Registers output listeners
2. Replays ALL accumulated `stdout` as SSE events
3. Then forwards new real-time output

The Session 26 research incorrectly concluded `streamProcessLogs` was "real-time only". **Wrong.** The `ProcessManager` stores stdout as a simple string that accumulates indefinitely. No cursor, no offset, no skip option.

### What Happened

1. First generation: DO calls `streamProcessLogs()`, processes all output, exits on `turn_complete`
2. Follow-up: DO calls `streamProcessLogs()` again → gets REPLAY of all gen 1 stdout
3. DO processes replayed messages as new → client gets duplicate images/text
4. DO hits replayed `turn_complete` from gen 1 → exits loop
5. Agent-runner processes the actual follow-up prompt, writes new output to stdout → nobody listening
6. New images generated and written to R2 but never sent to client

### The Fix (deployed as `605e485e`)

**Sentinel marker approach** — two surgical changes:

**Agent-runner** (`cloudflare/sandbox/agent-runner.ts`):
- When `waitForPromptFile()` returns, writes `{ type: 'turn_start', requestId }` to stdout BEFORE yielding the prompt to the SDK

**DO** (`cloudflare/src/durable-objects/campaign-session.ts`, `runFollowUpFast`):
- Generates a unique `requestId`, includes it in the prompt file
- After connecting `streamProcessLogs()`, enters skip mode
- Discards all messages until it sees `{ type: 'turn_start', requestId: <matching> }`
- Then processes messages normally until `turn_complete` or `result`
- 2-minute timeout as safety net

### Research Findings

Three parallel research agents confirmed:

1. **Claude Agent SDK `query()`**: Does NOT replay history on multi-turn. Each turn only yields new messages. Confirmed by reading `sdk.mjs` source. The `streamInput()` method writes each yielded prompt to CLI stdin. `readMessages()` forwards stdout as-is. Multi-turn via AsyncGenerator is the explicitly documented "Streaming Input Mode (Recommended)".

2. **Cloudflare Sandbox `streamProcessLogs()`**: ALWAYS replays all stdout. Confirmed by reading server-side `process-handler.ts`. No skip parameter exists (only `signal?: AbortSignal`).

3. **Industry patterns**: Every production system (Codex, Manus, Google ADK) streams only new output forward. History/recovery uses a separate mechanism (JSONL files, DB checkpoints). Nobody replays full history through the live stream.

Research docs created:
- `docs/RESEARCH_MULTI_TURN_STREAMING_PATTERNS.md` (by researcher agent)

### Test Results (version `605e485e`)

| Follow-up | Time | Images | Result |
|-----------|------|--------|--------|
| #1 | ~30s | 0 | Text-only, fast path |
| #2 | ~89s | 1 NEW | Image generated + visible |
| #3 | ~30s | 0 | Text-only, fast path |
| #4 | ~30s | 0 | Text-only, fast path |
| #5 | ~90s | 1 NEW | Image generated + visible |
| #6 | ~90s | 1 NEW | Image generated, **NOT visible** (Bug 2) |
| #7 | ~30s | 0 | Text-only, fast path |

- 7 consecutive follow-ups, all fast path, no crashes
- No duplicate content (replay fix working)
- `turn_start` marker found on every follow-up
- Agent process stable across all 7 follow-ups

## Bug 2: Long SDK Messages Dropped by SSE Framing (OPEN)

### Symptoms

Follow-up #6 generated a new image (`1772790548127_1_high_fashion_editorial_magazine_spread_with_3_dive.png`), confirmed in R2. But the image never appeared in the client gallery. The agent's text response mentions the image filename and fal.ai URL, but no image card rendered.

### Root Cause

The `tool_result` SDK message (containing the MCP response with image filepath) was too long for a single SSE `data:` frame. It got split, and `parseSSEStream()` silently dropped both fragments.

Evidence from the log:
```
[gen-fast] Non-JSON: {"type":"user","message":{"role":"user","content":[{"tool_use_id":"toolu_01S3q3mUe9VeHeP9a5Qmoxf5","type":"tool_result",
```

This is a valid SDK message logged as "Non-JSON" because `JSON.parse()` failed on the partial line.

Contrast with follow-up #5 where the tool_result WAS parsed correctly:
```
[gen-fast] SDK message: type=user    <-- tool_result parsed OK
```
And that image DID appear in the client (GET request at line 334).

### Technical Details

The pipeline:

```
agent-runner stdout
  → process stdout buffer (in container)
    → SSE server chunks it into "data: {...}\n" frames
      → parseSSEStream() in DO reads frames, JSON.parse each one
        → yields parsed event objects
          → DO processes event.data as stdout content
```

`parseSSEStream()` (in `@cloudflare/sandbox/dist/index.js:2489`):
```javascript
async function* parseSSEStream(stream, signal) {
  // ...
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.substring(6);
      try {
        yield JSON.parse(data);
      } catch {}   // <-- SILENTLY DROPS parse failures
    }
  }
}
```

When a long JSON payload exceeds one SSE frame:
1. Frame 1: `data: {"type":"stdout","data":"{\"type\":\"user\",\"message\":{\"role\":\"user\",...` (truncated)
2. Frame 2: `data: ...rest of json}"}`
3. `parseSSEStream` tries `JSON.parse()` on each frame separately — both fail
4. Both fragments silently dropped (`catch {}`)
5. The entire SDK message is lost

### Why It's Intermittent

Tool_result messages vary in size based on:
- Length of the MCP tool response content
- Accumulated context (tool_use_id, content array)
- Follow-up #5's tool_result happened to be shorter (fit in one SSE frame)
- Follow-up #6's tool_result was longer (exceeded one SSE frame)

First-generation tool_results are also shorter (less accumulated context).

### Impact

- Images generated but not shown in client gallery
- Image data exists in R2 but not in D1 `campaign_images`
- Agent text response mentions the image (the assistant saw the tool result), but the image card isn't rendered
- Only affects long SDK messages (primarily tool_results with large content)
- Pre-existing issue, but more visible now that follow-ups work

### Possible Fixes (TO DISCUSS)

**Option A: Agent-runner splits long messages**
- Before `process.stdout.write()`, check message length
- If over a threshold (e.g., 16KB), split into a header + chunked payload
- DO reassembles before parsing
- Pros: Fixes the root cause at the source
- Cons: Complex protocol, both sides need to agree on format

**Option B: Agent-runner extracts and forwards image info separately**
- After `writeCompletionMarker()`, also write image paths to a status file
- DO reads the status file after turn completes to pick up any missed images
- Pros: Simple, targeted fix for the image-missing problem
- Cons: Doesn't fix general message dropping

**Option C: Use `getProcessLogs()` as fallback**
- After `result/success`, call `sandbox.getProcessLogs(processId)` to get ALL accumulated stdout
- Parse the full log and extract any SDK messages that were missed
- Pros: Catches all dropped messages
- Cons: Expensive (re-parses entire history), complex dedup logic

**Option D: File-based output for follow-ups**
- Agent-runner writes each turn's SDK output to `/app/turn-{requestId}.jsonl`
- DO reads the file after turn completes instead of streaming
- Pros: Eliminates SSE framing issue entirely
- Cons: Loses real-time streaming (user doesn't see progress until turn completes)

**Option E: Hybrid — stream for UX, file for completeness**
- Keep `streamProcessLogs` for real-time progress (phases, thinking blocks)
- After `result/success`, read a summary file that agent-runner writes with image paths and key results
- Pros: Best of both worlds — real-time UX + reliable image detection
- Cons: Slightly more complex than pure streaming

**Recommendation: Option E** — stream for real-time UX, use a post-turn summary file to catch any images/files that were dropped by SSE framing. The agent-runner already writes `agent-status.json` and `completion_marker.json` — we can extend this pattern.

## Files Changed This Session

| File | Change |
|------|--------|
| `cloudflare/sandbox/agent-runner.ts` | Added `turn_start` marker with `requestId` before yielding follow-up prompts |
| `cloudflare/src/durable-objects/campaign-session.ts` | `runFollowUpFast`: skip mode to discard replayed history until matching `turn_start` marker, 2-min timeout |

## Key Learnings

1. **Always verify SDK behavior by reading source code.** The Session 26 research said `streamProcessLogs` was "real-time only" based on docs/naming. The actual server code replays everything. We lost a test cycle to this.

2. **SSE has implicit message size limits.** `parseSSEStream` in `@cloudflare/sandbox` silently drops messages that don't fit in a single SSE frame. No error, no warning. This is a latent bug that affects any long stdout output.

3. **The sentinel marker pattern works well.** Request-scoped markers (`turn_start` with `requestId`) are deterministic, stateless, and survive any number of accumulated turns. Zero dedup logic needed.

## Next Session

1. Fix Bug 2 (SSE framing / missing images) — discuss approach, implement
2. Test image visibility after fix
3. Consider removing debug diagnostics (API key test, etc.) to reduce generation time
4. Update MEMORY.md with session findings
