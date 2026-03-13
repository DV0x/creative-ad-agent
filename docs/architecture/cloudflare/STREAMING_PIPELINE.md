# Streaming Pipeline

> Part of [Architecture Documentation](../INDEX.md) | How sandbox stdout becomes client UI updates

---

## The Full Pipeline

```
agent-runner.ts                Durable Object              Client
    │                              │                          │
    │  stdout (JSON lines)         │                          │
    │─────────────────────────────→│                          │
    │  e.g. {"type":"assistant"... │                          │
    │                              │                          │
    │                    streamProcessLogs()                   │
    │                        (SSE stream)                      │
    │                              │                          │
    │                    parseSSEStream()                      │
    │                        (SSE → data)                      │
    │                              │                          │
    │                    line buffer                           │
    │                    JSON.parse(line)                      │
    │                              │                          │
    │                    processSDKMessage()                   │
    │                        (extract events)                  │
    │                              │                          │
    │                    emitEvent()                           │
    │                        │                                │
    │                        ├── EventBuffer (for replay)     │
    │                        └── WebSocket ──────────────────→│
    │                                                         │
    │                                               handleMessage()
    │                                               store updates
    │                                               UI re-render
```

---

## Stage 1: Agent Stdout

The agent-runner prints Claude SDK messages to stdout as JSON, one per line:

```
{"type":"system","subtype":"init","session_id":"sdk-xxx"}
{"type":"assistant","message":{"content":[{"type":"text","text":"Researching..."}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","name":"WebFetch","input":{...}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"xxx","content":"..."}]}}
{"type":"result","subtype":"success","session_id":"sdk-xxx"}
{"type":"turn_complete"}
```

**Sentinels:**
- `turn_start` — marks beginning of a new turn (used to skip replay on re-attach)
- `turn_complete` — marks end of a turn (used by `waitForLog` for completion detection)

---

## Stage 2: `streamProcessLogs(processId)`

Cloudflare SDK method. Returns an SSE stream of the process stdout.

**Gotcha:** Replays ALL historical stdout from process start, not just new output. The `attachStreamHandler` uses the `turn_start` sentinel to skip replayed history:

```typescript
let skippingReplay = true;
for await (const event of parseSSEStream(logStream)) {
  // ...parse line...
  if (skippingReplay) {
    if (msg.type === 'turn_start') {
      skippingReplay = false;  // Now streaming live
    }
    continue;
  }
  await processSDKMessage(msg, ctx);
}
```

---

## Stage 3: Line Buffering

SSE data arrives in chunks that may not align with JSON line boundaries. The pipeline buffers and splits by newline:

```typescript
let stdoutBuffer = '';
stdoutBuffer += rawData;
const lines = stdoutBuffer.split('\n');
stdoutBuffer = lines.pop() || '';  // Keep partial last line

for (const line of lines) {
  const msg = JSON.parse(line);
  await processSDKMessage(msg, ctx);
}
```

---

## Stage 4: `processSDKMessage()` (`sdk-message-parser.ts` — 256 lines)

Extracts semantic events from raw Claude SDK messages:

| SDK Message | Extracted Event | What it means |
|---|---|---|
| `system.init` | (internal) | Save `sdk_session_id` to D1 |
| `assistant` → `text` block | `message` event | Agent is explaining something |
| `assistant` → `tool_use: Task` | `phase: research` | Research subagent spawned |
| `assistant` → `tool_use: Skill(hook-methodology)` | `phase: hooks` | Hook generation started |
| `assistant` → `tool_use: nano-banana` | `phase: images` | Image generation started |
| `assistant` → `tool_use: Write` (with research/hooks/prompts path) | `file` event | Campaign file created |
| `user` → `tool_result` (with images array) | `image` event(s) | Images generated |
| `user` → `tool_result` (no images) | `tool_end` event | Tool finished |

### Text Stripping: `stripImageUrls()`

`stripImageUrls()` (exported from `sdk-message-parser.ts`, ~line 28) removes three patterns from agent text before sending to the client:
1. fal.ai URLs (`https://...fal.media/...` or `fal.ai/...`)
2. `/mnt/r2/images/...` sandbox paths
3. `**Image URL:**` lines (any markdown formatting variant)

After stripping, it collapses multiple blank lines. Images are displayed in the gallery, not in chat text.

### Image Processing

When a `tool_result` contains an `images` array:
1. Extract each image's `urlPath` (preferred) or `url` field
2. **Dedup by filename** — a `processedFilenames: Set<string>` in `ParserContext` tracks seen filenames; duplicates are skipped silently
3. Assign sequential global index via `imageCounter.next++` (continues from existing images across turns)
4. Map index to hook type via `getHookTypeForIndex()` (1=stat, 2=story, 3=fomo, 4=curiosity, 5=callout, 6=contrast)
5. Emit `image` event with `urlPath`, `hookType`, `imageIndex`, `filename`
6. Persist to D1 via `db.addCampaignImage()`

### Phase Detection

Phases are inferred from tool usage, not explicitly signaled:
- `Task` tool with research-related description → `research` phase
- `Skill('hook-methodology')` → `hooks` phase
- `Skill('art-style')` → `art` phase
- `mcp__nano-banana__generate_ad_images` → `images` phase

---

## Stage 5: `emitEvent()`

Buffers the event AND broadcasts to ALL connected WebSockets (multi-tab support):

```typescript
private emitEvent(event: ServerMessage): void {
  const eventId = this.eventBuffer.append(event);  // Sequential ID
  const payload = JSON.stringify({ ...event, id: eventId });
  for (const ws of this.state.getWebSockets()) {
    try { ws.send(payload); } catch { /* closed — ignore */ }
  }
}
```

The EventBuffer assigns sequential IDs (max 1000 events, trims to 500 on overflow). On reconnect, the client sends `lastEventId` and the DO replays everything after it via `getEventsSince()`.

**Three send methods:**
- `emitEvent()` — buffers AND broadcasts to all tabs (generation events that need replay)
- `sendWS()` — broadcasts to all tabs WITHOUT buffering (ack, pong, errors)
- `sendToWS(ws)` — sends to a SPECIFIC tab (subscribe replay, parse errors)

---

## Dual-Path Architecture

The streaming pipeline and completion detection are deliberately separate:

```
runGeneration() / runFollowUpFast()
    │
    ├── attachCompletionHandler()     ← RELIABLE completion path
    │   Uses proc.waitForLog('turn_complete', 2h)
    │   Reads turn-result.json → reconcile images/files → D1 → 'complete'
    │   Independent of stream health
    │
    ├── attachCrashHandler()          ← INSTANT crash detection
    │   Uses proc.waitForExit()
    │   Fires only on crash/kill (never during normal operation)
    │   Checks logs + R2 marker before marking incomplete
    │
    └── attachStreamHandler()         ← BEST-EFFORT live UI path
        Uses sandbox.streamProcessLogs()
        Skips replay via turn_start sentinel
        Processes SDK messages → emitEvent → WebSocket → client
        If stream dies, generation continues — user just loses live progress
```

**Design principle:** SSE streaming is best-effort for real-time UX. The filesystem (`turn-result.json`) is the source of truth. `waitForLog` is the reliable completion detector. `waitForExit` catches crashes instantly. R2 alarm polling + log snapshot polling are the safety nets for when even `waitForLog` fails (RPC disconnect).

### Follow-Up Streaming (runFollowUpFast)

Follow-ups have an additional complication: `streamProcessLogs` replays ALL historical stdout. The inline streaming loop in `runFollowUpFast` must skip replay:

```
1. attachCompletionHandler()          ← Reliable completion
2. sandbox.streamProcessLogs()        ← Start stream
3. sandbox.writeFile(next-prompt.json) ← Trigger agent
4. for await (event of stream):
   │
   ├── [skipping=true] → discard until turn_start with matching requestId
   │                      (hardcoded 120s timeout: `skipTimeout = Date.now() + 120_000`)
   │
   └── [skipping=false] → processSDKMessage() for live UI
                           Stop on turn_complete/result (let waitForLog handle it)
```

---

## Known Issues

### `parseSSEStream()` drops long messages

If a JSON payload exceeds one SSE `data:` frame, it gets split. Each fragment is tried with `JSON.parse()` — both fail silently. Affects long `tool_result` messages with large content.

**Impact:** Some images may be missed during streaming. The completion handler's `reconcileImages()` catches these via `/app/turn-result.json`.

### `streamProcessLogs()` replays ALL history

Despite the name suggesting real-time, it replays the entire accumulated stdout buffer. The `turn_start` sentinel is essential to skip replay on re-attach.

### Stream is best-effort

The stream handler is for **live UI updates only**. Completion detection and data persistence are handled by `waitForLog` + `reconcileImages`. If the stream breaks, generation continues and results are saved via the completion handler.

---

## Supporting Components

### EventBuffer (`event-buffer.ts` — 51 lines)

In-memory ring buffer for WebSocket event replay. One per DO instance.

```
Max events: 1000 → trims to 500 on overflow
No TTL (DO lifecycle handles cleanup — eviction clears everything)
```

| Method | Purpose |
|---|---|
| `append(event)` | Add event, return sequential ID |
| `getEventsSince(afterId)` | Replay events after given ID (for reconnect) |
| `getLatestEventId()` | Get highest assigned ID |
| `hasEvents()` | Check if buffer is non-empty |
| `clear()` | Reset (used before follow-up to clear stale events) |

**Local version** (`server/lib/event-buffer.ts` — 127 lines) differs: has 40-min TTL, per-session Map, cleanup timer every 5 min.

### BlockBuilder (`block-builder.ts` — 106 lines)

Builds `MessageBlock[]` for the assistant message during streaming. Mirrors client-side block structure so chat renders correctly after page refresh.

Block types:
- **`thinking`** — collapsible section with children (tool calls, status updates, image progress)
- **`text`** — plain text content (final summary)
- **`status`** — status badge (info/success/error)

Used by both `runFollowUpFast` (inline streaming) and `attachStreamHandler` (re-attached streaming). Gets serialized to JSON and stored in D1 `messages.blocks` column.

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — attachStreamHandler, attachCompletionHandler
- [Sandbox Container](./SANDBOX_CONTAINER.md) — Agent runner stdout format
- [WebSocket Client](../client/WEBSOCKET_CLIENT.md) — Client-side event handling
