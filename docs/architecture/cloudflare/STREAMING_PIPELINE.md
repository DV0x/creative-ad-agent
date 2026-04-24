# Streaming Pipeline

> Part of [Architecture Documentation](../INDEX.md) | **Sources:** `cloudflare/sandbox/agent-runner.ts`, `cloudflare/src/durable-objects/campaign-session.ts`, `cloudflare/src/lib/sdk-message-parser.ts`, `cloudflare/src/lib/event-buffer.ts`

---

## What this covers

How a live generation's output — tokens, tool calls, files, and images — gets from the SDK running inside a sandbox container into the browser, in real time.

Scope is **production only**. The local dev path (`server/`) does not stream token-level deltas — it processes assembled SDK messages and emits chunks per turn. See "Local dev is NOT on this path" at the bottom.

Four moving parts:

1. **The switch** — `includePartialMessages: true` on the SDK `query()` call. Without it, no stream events flow.
2. **Agent stdout** — `agent-runner.ts` translates SDK messages into newline-delimited JSON on stdout (with custom types for stream events).
3. **DO stream-parse loop** — `streamForLiveUI()` consumes `streamProcessLogs` as SSE, splits on `\n`, JSON-parses each line, dispatches to the parser. Also detects turn end.
4. **Parser + WS emission** — `processSDKMessage()` translates SDK shapes into client-facing WebSocket events; `emitEvent` / `sendWS` / `sendToWS` choose between broadcast-with-replay, broadcast-without, and targeted.

At the turn boundary, the agent writes `/app/turn-result.json` (the durable scratch pad) and prints sentinel lines (`turn_complete`, `COMPLETION:${requestId}`). The DO then reconciles that file into D1.

---

## The enabling switch: `includePartialMessages: true`

`agent-runner.ts:101` sets `includePartialMessages: true` in the SDK `query()` options. This single flag decides whether the SDK yields `stream_event` messages (token-level deltas + block start/stop) alongside the assembled `assistant` / `user` / `result` messages.

With the flag on:

- The SDK yields **stream_event** messages as tokens arrive from Anthropic
- It ALSO yields assembled **assistant** / **user** messages after the full block completes
- Net effect: every assistant message comes through twice — once granularly as deltas, once whole

Without it:

- Only assembled messages flow; no token-level streaming
- This is exactly what the local dev path does — see last section.

We use both paths. Deltas drive the live UI; assembled messages drive persistence. How they avoid duplication is covered in [Asymmetric dedup](#asymmetric-dedup-why-deltas-win) below.

Other SDK options at `agent-runner.ts:96-111`:

| Option | Value | Purpose |
|---|---|---|
| `model` | `claude-haiku-4-5-20251001` | Production model |
| `maxTurns` | `30` | Per-`query()` tool round-trip cap |
| `maxBudgetUsd` | `3.0` | Per-session USD cap — hard stop |
| `includePartialMessages` | `true` | **Streaming switch — this doc is about this flag** |
| `settingSources` | `['user', 'project']` | Load `~/.claude` + `./.claude` config |
| `allowedTools` | 12 names | `Task, Skill, TodoWrite, WebFetch, WebSearch, Read, Write, Bash, Edit, Glob, Grep, mcp__nano-banana__generate_ad_images` |
| `mcpServers` | `{ 'nano-banana': ... }` | In-process MCP server for image generation |

---

## Agent-runner stdout schema

The DO reads the agent's stdout as a stream of newline-delimited JSON. Every line the DO might see, in one table:

| Line shape | Source | Payload |
|---|---|---|
| `{type: 'text_start'}` | stream_event → content_block_start (text) — `agent-runner.ts:335` | — |
| `{type: 'text_delta', delta}` | stream_event → content_block_delta (text_delta) — `agent-runner.ts:348` | One text token chunk |
| `{type: 'text_end'}` | stream_event → content_block_stop (text) — `agent-runner.ts:360` | — |
| `{type: 'tool_use_event', name, id, input}` | stream_event → content_block_stop (tool_use) — `agent-runner.ts:365-370` | Parsed from accumulated `input_json_delta` fragments |
| `{type: 'turn_start', requestId}` | Follow-up trigger — `agent-runner.ts:292-295` | Sentinel — DO uses it to skip replayed history |
| `{type: 'turn_complete'}` | End of turn — `agent-runner.ts:418` | Generic completion marker |
| `COMPLETION:${requestId}\n` | End of turn — `agent-runner.ts:421` | **Not JSON** — raw text line, per-turn completion marker |
| `{type: 'system', subtype: 'init', session_id}` | SDK emits directly | DO saves `session_id` to D1 for future cold-resume |
| `{type: 'user', message: {content: [tool_result...]}}` | SDK emits directly | Contains image results from `mcp__nano-banana__generate_ad_images` |
| `{type: 'result', total_cost_usd, usage, ...}` | SDK emits at end of session or per turn | Cumulative SDK cost + token counts |
| `{type: 'trace', component, action, ts, ...}` | `trace()` helper — `agent-runner.ts:27-38` | Structured diagnostics (heartbeat, phase, file_write, etc.) |

**Not on stdout:** `assistant` messages. `agent-runner.ts:381-383` explicitly skips them when writing to stdout — their text and tool calls already flowed through `text_delta` / `tool_use_event` stream events. Writing them again would duplicate every token.

---

## Stage 1: agent-runner message handling

Inside `for await (const message of query({...}))` at `agent-runner.ts:326`, three branches:

### A. `message.type === 'stream_event'`

Fine-grained Anthropic streaming events. Five sub-cases (`agent-runner.ts:328-374`):

- `content_block_start` + text → emit `{type:'text_start'}`, flip `inTextBlock`
- `content_block_start` + tool_use → capture `name` + `id`, reset `toolInputBuffer`, flip `inToolUseBlock`
- `content_block_delta` + `text_delta` → emit `{type:'text_delta', delta}`
- `content_block_delta` + `input_json_delta` → append `partial_json` to `toolInputBuffer`
- `content_block_stop` → if text block: emit `{type:'text_end'}`; if tool block: `JSON.parse(toolInputBuffer)`, emit `{type:'tool_use_event', name, id, input}`

`continue` after stream-event handling — skip the block-builder / result handling below.

### B. Assembled messages — everything except `assistant`

`agent-runner.ts:381-383`:
```ts
if (message.type !== 'assistant') {
  process.stdout.write(JSON.stringify(message) + '\n');
}
```

So `system`, `user`, and `result` messages go to stdout verbatim as JSON. `assistant` messages do NOT (they'd duplicate stream_event output).

Also: assembled messages feed `processMessageForBlocks()` (`agent-runner.ts:127-204`), which builds `MessageBlock[]` used later by `writeCompletionMarker()` for DB persistence. This is where tool calls get "friendly" display names (`WebFetch` → "Fetching webpage", etc.).

### C. `message.type === 'result'`

End of a single turn. `agent-runner.ts:394-431`:

1. **Per-turn cost delta.** SDK reports `total_cost_usd` cumulatively across the session. We track `previousCostUsd` locally and compute `turnCost = max(0, cumulative - previousCostUsd)` — so follow-ups are billed for the follow-up's work, not the cumulative session cost.
2. **`writeCompletionMarker(blocks, text, costData)`** — writes `/app/turn-result.json` with `{images, files, text, blocks, requestId, campaignId, cost}`. Images come from `/app/generated-images.jsonl` (appended by the nano-banana MCP tool, one line per image). Files come from reading `/app/agent/files/research/`, `.../.claude/skills/hook-methodology/hook-bank/`, and `/app/agent/files/creatives/`.
3. **Dual sentinels** on stdout:
   - `{type:'turn_complete'}` — generic marker (older fallback path)
   - `COMPLETION:${currentRequestId}\n` — per-turn marker (follow-up paths key off this)
4. Reset block-builder + streaming-state locals for the next turn.

After `result`, the outer `for await` loop keeps iterating — the `promptStream()` generator blocks on `/app/next-prompt.json` for the next turn. One `query()` call spans the entire agent lifetime; the SDK keeps conversation context in memory.

---

## Stage 2: DO stream-parse loop (`streamForLiveUI`)

`campaign-session.ts:1224-1302`.

### Entry

Two call sites:

- `runGeneration` (`campaign-session.ts:1657-1659`) — initial generation, no replay skip
- `runFollowUpFast` (`campaign-session.ts:1562-1577`) — warm follow-up, `skipUntilRequestId` set

Both await `sandbox.streamProcessLogs(agentProcessId)` wrapped in `timedRPC('streamProcessLogs', ...)` — returns a `ReadableStream` of SSE frames. Stored on `this.currentLogStream` so cancel can abort it.

### Buffer + split

```ts
let stdoutBuffer = '';
for await (const event of parseSSEStream(logStream)) {
  const rawData = event.data;
  if (!rawData) continue;
  stdoutBuffer += rawData;
  const lines = stdoutBuffer.split('\n');
  stdoutBuffer = lines.pop() || '';  // keep partial last line
  for (const line of lines) { /* parse + dispatch */ }
}
```

SSE frames don't align with JSON line boundaries, so we buffer fragments and hold the last (possibly-partial) line over to the next frame.

### UUID dedup — why the parser doesn't see duplicates

`campaign-session.ts:1282-1287`:
> The SDK yields each message twice (streaming + final). Skip messages we've already processed by UUID.

A `seenUuids: Set<string>` is populated per stream invocation. If the SDK yields the same `assistant` message once during incremental streaming and once as a final assembled message, the second dispatch is dropped. Note: stream_event messages and `result`/`system`/`user` messages don't carry UUIDs in a way we dedup — only the assembled `assistant` path uses this guard.

### Replay skip — the follow-up problem

`streamProcessLogs(processId)` replays the ENTIRE accumulated stdout from process start every time it's called. On a warm follow-up, that means tens of thousands of bytes from the previous turn.

The solution (`campaign-session.ts:1269-1275`):

```ts
if (skippingReplay) {
  if (msg.type === 'turn_start' && msg.requestId === skipRequestId) {
    skippingReplay = false;
  }
  continue;
}
```

Each follow-up generates a unique `requestId` (`req_${Date.now()}` at `campaign-session.ts:1555`). The agent prints `{type:'turn_start', requestId}` just before yielding the new prompt (`agent-runner.ts:291-295`). The stream loop discards everything until it sees that sentinel — from then on it processes live messages.

A `skipTimeout = Date.now() + 120_000` (`campaign-session.ts:1233`) breaks the loop if the matching `turn_start` never arrives. This is a ceiling, not an SLA — if it fires, the alarm still finalizes, but the user loses live events.

### Cancel fast-path

Two checks per iteration:

- `abortController.signal.aborted` inside the outer `for await` (`campaign-session.ts:1246-1249`) — returns `true` (cancelled) on the next SSE frame
- `handleCancel()` at `campaign-session.ts:1092-1096` also calls `currentLogStream.cancel()` — cancels the underlying `ReadableStream` so the `for await` unblocks immediately instead of waiting for the next frame

### Turn-end break

`campaign-session.ts:1277-1280`:

```ts
if (msg.type === 'turn_complete' || msg.type === 'result') {
  turnDone = true;
  break;
}
```

The caller (`runGeneration` / `runFollowUpFast`) then calls `tryFinalize(campaignId, sessionId)` **inline** at `campaign-session.ts:1581` and `1663`. The inline call is what eliminates the alarm race window — finalize fires immediately after the stream loop exits cleanly instead of waiting for the next alarm tick.

---

## Stage 3: `processSDKMessage` — the five branches

`cloudflare/src/lib/sdk-message-parser.ts` (398 lines). Five distinct input types, all in one dispatch function.

### A. Stream event trio — `text_start` / `text_delta` / `text_end`

`sdk-message-parser.ts:60-82`. For each type:

- `sendEphemeral(event)` — broadcasts to all connected WebSockets via `sendWS()` (NOT buffered in EventBuffer; not replayed on reconnect — the assembled text is, see branch D)
- `text_delta` also sets `ctx.hasStreamedDeltas = true` — this flag is what gates branch D's duplicate-suppression

### B. `tool_use_event` (production tool-call path)

`sdk-message-parser.ts:85-175`.

Always emits a `tool_start` event with `{toolId, tool, input}`. Then detects intent from tool name + input:

- **`Write`** with `file_path` containing `research` / `hook` / `prompt` → emits `file` event with content, persists via `db.updateCampaignFile`
- **`Task`** with `subagent_type === 'Explore'` or `description` containing "research" → extracts URL from description, emits `phase: research` with label like "Researching nike"
- **`Skill`** with `skill === 'hook-methodology'` → emits `phase: hooks`, label "Writing 6 ad hooks"
- **`Skill`** with `skill === 'art-style'` → emits `phase: art`, label "Crafting art direction"
- **`mcp__nano-banana__generate_ad_images`** → emits `phase: images` with `imageCount: prompts.length`, label "Generating N images"

Block-builder also gets an `addThinkingChild` for every tool.

### C. `system.init`

`sdk-message-parser.ts:177-186`. Captures `session_id` and writes to `campaigns.sdk_session_id` in D1. That row survives the DO reset, so a future cold-resume follow-up can read it back and attempt to resume the SDK session (though we currently never set `RESUME_SDK_SESSION_ID` — see the gotcha in DURABLE_OBJECT.md about s3fs null-byte corruption).

### D. Assembled `assistant` messages — the asymmetric path

`sdk-message-parser.ts:191-318`. Two sub-cases per block type.

**Text blocks (`block.type === 'text'`):**

```ts
textAccumulator.text += (textAccumulator.text ? '\n' : '') + block.text;  // ALWAYS

if (!ctx.hasStreamedDeltas) {
  const cleanedText = stripImageUrls(block.text);
  if (cleanedText) emitEvent({ type: 'message', text: cleanedText });
}
```

- Text is always accumulated (for DB persistence in `addMessage`)
- `message` event is only emitted if deltas did NOT stream. In production, `hasStreamedDeltas` flips to `true` on the first `text_delta`, so the assembled `message` event is suppressed and the client keeps the text already rendered token-by-token. See [Asymmetric dedup](#asymmetric-dedup-why-deltas-win).

**Tool-use blocks (`block.type === 'tool_use'`):**

`sdk-message-parser.ts:217-317`. A near-duplicate of branch B, kept deliberately. Why:

- On **production**, `tool_use_event` already fired from the stream_event path (branch B)
- On **local dev** (`runGenerationLocal`, `campaign-session.ts:1724-1814`), the SDK runs in-process without `includePartialMessages`, so only the assembled `assistant` message arrives — this branch is the only tool-call path
- Both paths must hit the same detection logic (phase, file, block-builder)

The UUID dedup (Stage 2) prevents production from running this branch for the same `assistant` twice.

### E. Assembled `user` → `tool_result`

`sdk-message-parser.ts:319-395`. Fired for every tool result. Always:

- Emit `tool_end` with `{toolId, success: !is_error}`

Then parses `block.content` looking for an `images` array (only `mcp__nano-banana__generate_ad_images` produces one). For each image:

- **Filename dedup** — `processedFilenames: Set<string>` (on `ParserContext`, lives for one stream invocation). If the same filename appears twice, skip.
- **Global index** — `imageCounter.next++` (initialised from `max(storedMaxIndex, db.getMaxImageIndex)` at `campaign-session.ts:1511-1522` — survives the race between alarm finalization and next-turn start).
- **Hook type** — `getHookTypeForIndex(globalIndex)` maps 0-5 to `stat | story | fomo | curiosity | callout | contrast`.
- Emit `image` event with `{id, urlPath, prompt, filename, hookType, imageIndex}`.
- Persist via `db.addCampaignImage`.
- `blockBuilder.incrementCompletedImages()`.

---

## Asymmetric dedup — why deltas win

Production receives every assistant text block through TWO paths:

1. **Token-level deltas** → emitted as `text_start`/`text_delta`/`text_end` as tokens arrive. Client appends each delta to an in-flight text block in the store.
2. **Assembled assistant message** → arrives later with the complete text in one shot.

If we emitted both as client events, the text would render twice — once token-by-token, once whole.

The resolution (the whole dedup logic is driven by one boolean):

```
ctx.hasStreamedDeltas = false  // reset per stream invocation
on text_delta     → hasStreamedDeltas = true; send ephemeral
on assistant text → accumulate into textAccumulator   (ALWAYS — for DB)
                  → if !hasStreamedDeltas: emit message event   (local dev only, in practice)
```

- **Production**: `hasStreamedDeltas` flips true on first delta. Assembled-text emission is suppressed. Deltas render in UI; assembled text persists to D1 only.
- **Local dev**: No deltas ever fire. `hasStreamedDeltas` stays false. Assembled-text emits as `message` and renders whole.

This is why we can keep one `processSDKMessage` function for both paths — the single flag handles both.

The accumulator `textAccumulator.text` is always filled, regardless of path, because `finalizeGeneration` / `generateSummary` need a full-turn text string to write to D1 as the assistant message body.

---

## Stage 4: WebSocket emission

`campaign-session.ts:1895-1927`. Three functions, picked by event class.

| Method | Buffered? | Recipient | Use for |
|---|---|---|---|
| `emitEvent(event)` | Yes | All connected sockets | Durable events: `phase`, `tool_start`/`tool_end`, `file`, `image`, `complete`, `error`, `incomplete`, `ack`, `message`. These need replay on reconnect. |
| `sendWS(event)` | No | All connected sockets | Ephemeral: `text_start`/`text_delta`/`text_end`, `pong`, `credits_update`, `status`. These are OK to drop on reconnect. |
| `sendToWS(ws, event)` | No | One specific socket | Subscribe replay, per-socket errors, initial `ack` on connect. |

`emitEvent` also stamps each outgoing payload with `id = eventBuffer.append(event)` — the sequential event ID the client saves as `lastEventId` in localStorage and sends back on `subscribe`.

### EventBuffer (`event-buffer.ts`)

- `MAX_EVENTS = 1000` — trimmed to 500 on overflow (`event-buffer.ts:7-25`). Older events dropped.
- In-memory per DO instance. Lost on DO eviction (code deploy).
- `nextId` starts at 1, monotonically increments.
- `clear()` called by `handleFollowUp` at `campaign-session.ts:945` — so stale events from the prior turn don't get replayed on reconnect mid-follow-up.
- `getEventsSince(afterId)` → O(n) filter — fine at n=1000.

**Local version** (`server/lib/event-buffer.ts`) is different: per-session Map, 40-min TTL, cleanup timer. DO version is simpler because DO eviction handles cleanup.

### Why deltas don't go through EventBuffer

If deltas were buffered, reconnecting would replay hundreds of `text_delta` events and re-render the text token-by-token. Instead we accept that reconnect loses deltas — the assembled text blocks are still persisted to the DB via the accumulator, and the client can re-load from `/api/campaigns/:id` if it needs the final text. This is the trade-off that makes the buffer size viable.

---

## Turn boundary — end-of-turn marker

Everything the DO needs to finalize a turn lands in **three** places:

### 1. `/app/turn-result.json` (durable scratch pad)

Written by `writeCompletionMarker` at `agent-runner.ts:216-261`. Schema:

```json
{
  "images": [{ "filename": "...", "path": "/mnt/r2/images/..." }, ...],
  "files": { "research": "...", "hooks": "...", "prompts": "..." },
  "text": "accumulated assistant text this turn",
  "blocks": [{ /* MessageBlock[] */ }],
  "requestId": "req_1710000000000" | "turn_1710..." | "initial",
  "campaignId": "abc123",
  "cost": { "totalCostUsd": 0.043, "inputTokens": 1200, "outputTokens": 850, "numTurns": 6, "durationMs": 124000 }
}
```

- **Images** come from `/app/generated-images.jsonl` (the nano-banana MCP tool appends one line per image). That tracking file is cleared after each turn (`agent-runner.ts:231`).
- **Files** come from reading the three workspace dirs (research / hook-bank / creatives).
- **Cost** is the per-turn delta (not cumulative) — see the cost-delta calc at `agent-runner.ts:397-402`.

DO reads this file in `tryFinalize` (`campaign-session.ts:303-337`), validates `campaignId` + `requestId` match, then calls `finalizeGeneration` to reconcile images/files/text into D1 and deduct credits.

### 2. `{type:'turn_complete'}` on stdout

`agent-runner.ts:418`. Generic marker. `streamForLiveUI` breaks on this (`campaign-session.ts:1277-1280`). Also read by the alarm's log-snapshot fallback when the stream is unavailable.

### 3. `COMPLETION:${requestId}\n` on stdout

`agent-runner.ts:421`. Raw text line, NOT JSON. Per-turn marker — used by any follow-up logic that needs to key off a specific turn's completion. The `req_${Date.now()}` from follow-up kickoff matches the sentinel here.

After emitting all three, the agent resets its per-turn state and loops back to wait for the next `/app/next-prompt.json`.

---

## Scratch-pad model summary

Two parallel channels to the client, one durable one ephemeral:

```
                    agent-runner stdout
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
     Live UI            Durable Marker        D1 Persistence
     (ephemeral)        /app/turn-result.json (via finalize)
        │                    │                    │
text_delta → WS       Read by tryFinalize  → campaign_images
tool_use_event → WS   Read by alarm        → campaign_files
phase → WS                                 → messages
file → WS (buffered)                       → usage_log
image → WS (buffered)
```

- **Live UI path**: best-effort. Deltas lost on reconnect; buffered events replayed by `lastEventId`.
- **Durable path**: authoritative. Every image / file / cost number written to `turn-result.json` gets reconciled into D1 — even if every WS frame was dropped.
- **Reconnect**: client sends `subscribe` with `lastEventId`, DO replays `getEventsSince(lastEventId)`. Deltas aren't replayed (they're not in the buffer), but the assembled assistant text is persisted to D1 and visible on a page reload via `/api/campaigns/:id`.

This is why "stream is best-effort" is safe to say — the durable path guarantees the final state regardless.

---

## Local dev is NOT on this path

The local dev server (`server/` directory, `AI_BACKEND=local`) does not stream tokens. Grep facts, verified 2026-04-22:

- Zero occurrences of `includePartialMessages` in `server/`
- Zero occurrences of `text_delta`, `stream_event`, `tool_use_event`, `hasStreamedDeltas`

In local mode:

- `runGenerationLocal` (`campaign-session.ts:1724-1814`) — used only when `env.AI_BACKEND === 'local'`
- `local-ai-runner.ts` runs the SDK in-process without `includePartialMessages`
- Only assembled `assistant` / `user` / `result` messages flow
- `processSDKMessage` branches D and E fire; branches A (stream trio) and B (`tool_use_event`) never fire
- Text appears in big chunks per-block, not token-by-token
- `hasStreamedDeltas` stays false → assembled `text` blocks go out as `message` events (branch D's fallback behaviour)

### Implication

Features you develop locally that depend on token-level UX (fade-in animations, mid-stream interactions, incremental parsing of the agent's output) must be re-validated on staging before deploying. This is listed in [Known Issues](../ops/KNOWN_ISSUES.md) as a high-priority DX gap.

---

## Known footguns

| Footgun | Where | Impact / mitigation |
|---|---|---|
| Large `tool_result` payloads split across SSE frames | `@cloudflare/sandbox` `parseSSEStream` SDK code | JSON fragments fail `JSON.parse`, silently dropped in the `catch`. Mitigated by `tryFinalize` re-reading `turn-result.json` — images/files reconcile from disk. |
| `streamProcessLogs` replays entire history | SDK behaviour | Needed `turn_start` sentinel + `requestId` match in follow-ups. 120s skip ceiling avoids hanging forever. |
| UUID dedup is assembled-message only | parser | Stream-event deltas are never deduped — if the SDK ever double-yielded the same delta, text would render twice. Not observed in practice. |
| `processedFilenames` resets per stream | parser ctx | Within one stream, same image filename is deduped. Across restarts, D1 `knownPaths` check in `finalizeGeneration` (`campaign-session.ts:360-366`) is the durable dedup. |
| Local dev doesn't stream | `runGenerationLocal` | See prior section. High-priority DX gap. |
| 120s replay-skip timeout | `streamForLiveUI` | If follow-up agent hangs before printing `turn_start`, live UI gets no events; alarm still finalizes. Silent degradation — surface if recurring. |
| `currentLogStream.cancel()` requires the reference | `handleCancel` / `streamForLiveUI` | Cancel-during-stream depends on `this.currentLogStream` being set. The `try/finally` in `streamForLiveUI` does NOT null it — the caller does (`runGeneration` / `runFollowUpFast` finally blocks at `campaign-session.ts:1618, 1701`). |

---

## See Also

- [Durable Object](./DURABLE_OBJECT.md) — completion detection layers, credits finalization, zombie recovery
- [DO State Machine](./DO_STATE_MACHINE.md) — full state transitions around streaming
- [Sandbox Container](./SANDBOX_CONTAINER.md) — agent-runner lifecycle and IPC
- [WebSocket Protocol](../shared/WEBSOCKET_PROTOCOL.md) — every event type this pipeline emits, client-facing shape
- [Billing](../shared/BILLING.md) — cost deduction reads `turn-result.json.cost`
- [Known Issues](../ops/KNOWN_ISSUES.md) — local dev streaming gap, SSE frame-split
