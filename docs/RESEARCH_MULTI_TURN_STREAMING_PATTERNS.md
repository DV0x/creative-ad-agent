# Research: Multi-Turn Agent Output Streaming Patterns

**Date:** 2026-03-06
**Scope:** Claude Agent SDK multi-turn behavior, Cloudflare Sandbox streaming, industry patterns
**Confidence levels:** HIGH = multiple primary sources confirm; MEDIUM = single source or inference from docs; LOW = inferred from indirect evidence

---

## 1. Claude Agent SDK: Multi-Turn `query()` Behavior

### 1.1 V1 AsyncGenerator Pattern (What We Use)

The `query()` function accepts `prompt: string | AsyncIterable<SDKUserMessage>`. When given an AsyncGenerator, it operates as a **long-lived streaming input session**. The agent-runner in this project uses exactly this pattern via `promptStream()`.

**Key finding: The SDK does NOT re-emit historical messages when the generator yields a second prompt.**

When `query()` is in streaming input mode and the AsyncGenerator yields a second `SDKUserMessage`, the outer `for await (const message of query(...))` loop emits **only new messages for the current turn** (system, assistant, tool-use, result). Messages from turn 1 are not replayed.

**Confidence: HIGH**

Evidence:
- GitHub Issue #14 (anthropics/claude-agent-sdk-typescript, 47 upvotes): Explicitly confirms that when resuming a session, only 3 messages are emitted (system init, assistant, result), NOT the 63 historical turns. A community workaround parses JSONL files manually.
- GitHub Issue #5135 (anthropics/claude-code, CLOSED as "not planned"): Requested `--include-history` flag to replay historical messages. Closed without implementation.
- GitHub Issue #109 (anthropics/claude-agent-sdk-python): Same question, same answer. A collaborator confirmed no official method exists. However, as of v0.1.46 (March 2026), "listening sessions and file-read based messages history just shipped" -- suggesting a very recent addition that may not yet be documented.
- The `SDKUserMessageReplay` type (with `isReplay: true` flag) exists in the type system but is for a future/partial `includeHistory` feature, not the current default behavior.

**What this means for our architecture:**
The `promptStream()` generator in `agent-runner.ts` is correct. When it yields a second prompt, the `for await` loop on stdout will only see new messages. The DO's `streamProcessLogs()` will NOT see a flood of replayed historical messages. This is the desired behavior -- our architecture already handles this correctly.

### 1.2 V2 Session Interface (Preview)

The V2 SDK (`unstable_v2_createSession()`) simplifies multi-turn by replacing the AsyncGenerator with explicit `send()`/`stream()` cycles:

```typescript
await using session = unstable_v2_createSession({ model: "claude-opus-4-6" });
await session.send("Turn 1 prompt");
for await (const msg of session.stream()) { /* only turn 1 messages */ }
await session.send("Turn 2 prompt");
for await (const msg of session.stream()) { /* only turn 2 messages */ }
```

Each `stream()` call yields only messages from the current turn. No historical replay.

`unstable_v2_resumeSession(sessionId)` reconnects to a previous session by ID. The `thread/read` equivalent is not documented for V2 yet.

**Relevance to our project:** V2 is unstable and would require restructuring agent-runner.ts. The current V1 AsyncGenerator approach is stable and works. No migration needed now, but V2 would simplify the code if it stabilizes.

### 1.3 Session Persistence (JSONL)

Sessions are stored as JSONL files at `~/.claude/projects/{project-slug}/{session-id}.jsonl`. Key behaviors:
- The SDK uses `fs.promises.appendFile` (open-write-close every ~100ms) -- confirmed in Session 26 research
- Each `close()` triggers s3fs upload when mounted via FUSE
- Resuming with `{ resume: sessionId }` loads history internally for Claude's context but does NOT stream it to the caller
- The `forkSession` option creates a new branch from the resume point

**Confidence: HIGH** (confirmed via SDK source code analysis in Session 25 + multiple GitHub issues)

### 1.4 What Would Change This Analysis

- If Anthropic ships the `includeHistory` option (proposed in Issue #14), the default behavior would remain the same, but callers could opt into replay. Our code would NOT break because we don't set `includeHistory`.
- If the Python SDK's v0.1.46 "listening sessions" feature propagates to the TypeScript SDK, there may be a new API for accessing history without replay through the generator.

---

## 2. Cloudflare Sandbox `streamProcessLogs`

### 2.1 API Summary

| Method | Returns | Behavior |
|--------|---------|----------|
| `startProcess(cmd, opts)` | `Promise<Process>` | Starts background process. Options: `cwd`, `env`, `stdin`, `timeout`, `processId`, `encoding`, `autoCleanup` |
| `streamProcessLogs(processId)` | `Promise<ReadableStream>` emitting `LogEvent` objects | Real-time streaming of process stdout/stderr |
| `getProcessLogs(processId)` | `Promise<string>` | Returns ALL accumulated output since process start |

### 2.2 Key Finding: `streamProcessLogs` Does NOT Replay History

**Confidence: MEDIUM** (inferred from documentation patterns and Session 26 verification, but not explicitly documented)

The documentation does not explicitly state whether `streamProcessLogs` includes historical output. However:

1. **Session 26 verification** (noted in the project's own research): "streamProcessLogs — real-time only, no historical replay" was verified.
2. The documentation consistently describes it as "Stream logs in real-time" vs `getProcessLogs` for "all accumulated output."
3. The naming convention follows a common pattern: `stream*` = live data, `get*` = snapshot.
4. The SSE (Server-Sent Events) transport mechanism is inherently forward-looking.

**What this means for our architecture:**
When the DO calls `streamProcessLogs(agentProcessId)` for a follow-up turn, it will only see output from that point forward. It will NOT see output from the initial generation turn. This is correct -- the DO already processed initial turn output via the first `streamProcessLogs` call.

### 2.3 The `getProcessLogs` Escape Hatch

If we ever need to recover missed output (e.g., DO hibernated while agent was producing output), `getProcessLogs(processId)` returns ALL accumulated stdout since process start. This could serve as a recovery mechanism:

1. Call `getProcessLogs(agentProcessId)`
2. Parse the accumulated output to find messages after the last known good state
3. Process only the delta

**Limitation:** `getProcessLogs` returns a plain string, not structured `LogEvent` objects. You'd need to parse newline-delimited JSON yourself. There's no cursor/offset parameter to get "only since byte X."

### 2.4 What Would Change This Analysis

- If Cloudflare adds a `since` or `offset` parameter to `streamProcessLogs`, it would enable precise recovery without parsing all historical output.
- If `streamProcessLogs` behavior changes to include historical output, our architecture would need a deduplication layer (process IDs + message UUIDs to skip already-seen messages).

---

## 3. Industry Patterns for Multi-Turn Agent Output Streaming

### 3.1 OpenAI Codex App Server (Most Analogous)

**Architecture:** JSON-RPC 2.0 over stdio (JSONL) or WebSocket. Three primitives:
- **Thread**: Durable conversation container (persisted to disk as JSONL)
- **Turn**: One unit of agent work (user input -> agent output)
- **Item**: Atomic unit with lifecycle: `item/started` -> `item/*delta` -> `item/completed`

**Multi-turn streaming:**
- Client sends `turn/start` -> server emits streaming notifications (`item/started`, `item/agentMessage/delta`, `item/completed`, `turn/completed`)
- Each turn streams only NEW items. Previous turn items are NOT replayed on `turn/start`
- `turn/steer` allows mid-turn input without creating a new turn
- `thread/resume` reopens an existing thread by ID
- `thread/read` retrieves history WITHOUT resuming (separate from streaming)

**Reconnection:**
- Thread history persists as JSONL logs on disk
- `thread/resume` reconnects, but does NOT replay missed notifications
- WebSocket mode uses bounded queues -- notifications missed during disconnection are dropped
- No explicit replay mechanism for missed events

**Key insight:** Codex separates "streaming live output" from "reading history." They are two different operations. This validates our approach of using `streamProcessLogs` for live output and `getProcessLogs` / R2 completion markers for recovery.

**Confidence: HIGH** (primary source: official Codex App Server docs + OpenAI engineering blog)

### 3.2 Manus AI (Context Engineering Approach)

**Architecture:** Iterative agent loop in sandboxed VMs (E2B Firecracker microVMs). One tool action per iteration:
1. Analyze current state from event stream
2. Plan/select action
3. Execute in sandbox
4. Observe result (appended to event stream)
5. Repeat until done

**Multi-turn streaming:**
- Uses an **event stream** as the core data structure, not stdout streaming
- Each iteration appends to the event stream
- The model only sees "recent interactions" -- not the full stream
- Uses **file system as extended memory**: `todo.md` updated each step, compressible observations

**Context management (critical for long-running):**
- KV-cache optimization is "the single most important metric" -- 10x cost reduction
- Stable prompt prefixes + append-only contexts + deterministic serialization
- Dynamic tool masking via logit manipulation (preserves cache, constrains actions)
- "Recitation" pattern: agent maintains `todo.md` at end of context window to keep goals in attention
- Error traces preserved in context for implicit belief updating

**Relevance:** Manus doesn't stream stdout across turns -- it reads/writes files. This is closer to our file-based IPC pattern (`/app/next-prompt.json`) than to a persistent stdio stream.

**Confidence: HIGH** (primary source: official Manus engineering blog)

### 3.3 Cursor Agent Mode

**Architecture:** Multi-agent parallel processing (up to 8 agents on one prompt). Each agent works in an isolated git worktree copy.

**Multi-turn streaming:**
- Agent-first interface: agents are "objects in the editor," visible in sidebar, manageable as processes
- "Plans" are multi-step strategies executed against the repo
- "Rules" provide persistent instructions seen at the start of every conversation
- Output streaming not publicly documented in detail

**Key insight:** Cursor uses **tool-level streaming** (showing tool execution progress) rather than raw stdout streaming. The Composer model (RL-trained, 4x faster) handles the agent loop internally.

**Confidence: LOW** (secondary sources; Cursor's internals are not open)

### 3.4 Devin 2.0 (Full VM Approach)

**Architecture:** Full sandboxed cloud VM per task (shell, editor, browser). Planner -> Executor -> Verifier pipeline.

**Multi-turn streaming:**
- Event-driven: REST API triggers sessions, no human-in-the-loop required
- Users can provide mid-flight clarifications; Devin updates plan accordingly
- Planning checkpoint and PR checkpoint are non-negotiable human approval gates
- Multi-hour sessions supported (with 18% planning improvement using Claude Sonnet 4.5)

**Key insight:** Devin doesn't appear to stream raw process output to users. Instead, it provides **progress updates** and **plan visualizations**. The agent loop runs autonomously in the VM; the user sees a higher-level representation.

**Confidence: MEDIUM** (mix of official blog posts and third-party analysis)

### 3.5 Google ADK (Bidirectional Streaming)

**Architecture:** Stateful sessions with async real-time I/O management.

**Multi-turn streaming:**
- Sessions persist throughout live interaction (not just history, but tool calls, tool responses, system signals)
- "Signal-based event division": interruptions, explicit 'complete' signals, agent transfers delineate events
- **Streaming tools as AsyncGenerators**: tools `yield` multiple results over time, providing intermediate updates while long-running tasks execute in background

**Key insight:** Google's approach uses streaming tools (generators that yield intermediate results) as the primitive, rather than streaming stdout. This is architecturally elegant but requires tool-level integration.

**Confidence: MEDIUM** (primary source: Google Developers Blog)

---

## 4. Pattern Taxonomy

Across all systems studied, four patterns emerge for multi-turn agent output:

### Pattern A: Persistent Process + Forward-Only Stream
**Used by:** Our system, OpenAI Codex App Server

Keep agent process alive. Stream new output forward only. Use separate mechanism (JSONL files, `getProcessLogs`, `thread/read`) to access history. Reconnection requires catching up via the history mechanism.

**Pros:** Simple, no deduplication needed, memory-efficient
**Cons:** Missed events during disconnect require separate recovery path
**Our status:** This is exactly what we do.

### Pattern B: Event Stream with File-Based State
**Used by:** Manus AI, our file-based IPC

Agent reads/writes files. No persistent stdout stream. State lives in files (event log, todo.md, results). Each turn reads current file state, acts, writes results.

**Pros:** Naturally persistent (files survive process death), no streaming complexity
**Cons:** Polling overhead, slightly higher latency
**Our status:** We use this for IPC (next-prompt.json, agent-status.json) but not for output.

### Pattern C: Higher-Level Progress Updates
**Used by:** Devin, Cursor (partially)

Don't stream raw agent output. Instead, emit structured progress events (plan updates, tool status, diffs). The user never sees raw stdout.

**Pros:** Better UX (users see meaningful progress, not raw tokens), easier to resume
**Cons:** Requires significant abstraction layer, loses granularity
**Our status:** We partially do this via `processSDKMessage` which converts raw SDK messages into structured events.

### Pattern D: Turn-Scoped Streaming with History API
**Used by:** OpenAI Codex, Claude Agent SDK V2

Each turn is a discrete streaming session. History is available via separate API (`thread/read`, `getSessionHistory`). No automatic replay.

**Pros:** Clean separation of concerns, supports forking/branching
**Cons:** Two code paths (live stream + history read)
**Our status:** Our architecture naturally falls into this pattern since SDK `query()` only emits new turn messages.

---

## 5. Implications for Our Architecture

### 5.1 Current Architecture Is Sound

The Phase 2 implementation (Session 26) already follows the dominant industry pattern:
1. **Persistent process** with `startProcess()` + `promptStream()` AsyncGenerator
2. **Forward-only streaming** via `streamProcessLogs()` for each turn
3. **File-based IPC** for inter-turn communication (`next-prompt.json`)
4. **Sentinel markers** (`turn_complete`) for turn boundary detection
5. **Fallback recovery** via JSONL in R2 + completion markers

### 5.2 Known Gap: Missed Events During DO Hibernation

If the DO hibernates while the agent process is producing output between turns:
- `streamProcessLogs` connection is lost
- Agent continues writing to stdout
- When DO wakes, a new `streamProcessLogs` call picks up only NEW output

**Recovery options (not yet implemented):**
1. Call `getProcessLogs(agentProcessId)` to get all accumulated output, diff against last known state
2. Use `sandbox.readFile('/app/agent-status.json')` to check if agent is idle/processing
3. Rely on completion marker in R2 for final state recovery

### 5.3 The V2 SDK Simplification Opportunity

If/when the V2 SDK stabilizes, agent-runner.ts could be simplified from:

```typescript
// Current: V1 AsyncGenerator
async function* promptStream() {
  yield { type: 'user', message: { role: 'user', content: prompt } };
  while (true) {
    const data = await waitForPromptFile();
    if (!data || 'shutdown' in data) return;
    yield { type: 'user', message: { role: 'user', content: data.prompt } };
  }
}
for await (const msg of query({ prompt: promptStream(), options })) { ... }
```

To:

```typescript
// Potential V2 approach
const session = unstable_v2_createSession(options);
await session.send(prompt);
for await (const msg of session.stream()) { process.stdout.write(JSON.stringify(msg) + '\n'); }
// Wait for next prompt
while (true) {
  const data = await waitForPromptFile();
  if (!data || 'shutdown' in data) break;
  await session.send(data.prompt);
  for await (const msg of session.stream()) { process.stdout.write(JSON.stringify(msg) + '\n'); }
}
```

The V2 approach makes turn boundaries explicit and eliminates generator coordination complexity.

### 5.4 What Would Change These Recommendations

| If this happens... | Then... |
|---------------------|---------|
| `streamProcessLogs` starts replaying history | Add dedup layer (track last seen message UUID) |
| SDK `query()` starts replaying history on 2nd yield | Add `isReplay` filter in the DO's message parser |
| V2 SDK stabilizes | Consider migration for cleaner code (not urgent) |
| Cloudflare adds `getProcessLogs(id, { since: byteOffset })` | Use for precise recovery instead of full replay |
| Agent processes frequently crash | Add `getProcessLogs` recovery path to `alarm()` handler |

---

## 6. Gaps & Uncertainties

1. **streamProcessLogs replay behavior is undocumented.** Our conclusion that it's "real-time only" is based on naming convention, Session 26 testing, and documentation tone -- but Cloudflare has not explicitly documented this. If they change the behavior, our architecture could receive duplicate messages. **Risk: LOW** (behavior change unlikely without version bump).

2. **SDK v0.1.46 "listening sessions" feature.** A comment on Issue #109 suggests Anthropic shipped a history access feature in the Python SDK. Whether this exists in the TypeScript SDK (which we use) and whether it changes the default behavior of `query()` is unknown. **Risk: LOW** (even if it exists, it would be opt-in, not default).

3. **DO hibernation during multi-turn gap.** If the agent is idle (waiting for `next-prompt.json`) and the DO hibernates, the next `streamProcessLogs` call after wakeup will only see new output. Any output the agent produced between DO hibernation and wakeup is lost to the stream. `getProcessLogs` could recover it, but this path is not implemented. **Risk: MEDIUM** (depends on how long DO takes to wake vs agent processing speed).

4. **Cursor and Devin internals.** These systems don't publish detailed streaming architecture. Our analysis relies on external observations and third-party write-ups. **Impact: LOW** (we have enough from Codex and Manus to validate our pattern).

5. **Concurrent follow-ups.** If two follow-ups arrive before the first completes, the file-based IPC (single `next-prompt.json` file) could race. This was noted as a risk in Session 26 but not mitigated. **Risk: MEDIUM** (unlikely in current single-user usage, but needs addressing for production).

---

## Sources

### Primary Sources (Firsthand Documentation)
- [Claude Agent SDK TypeScript Reference](https://platform.claude.com/docs/en/agent-sdk/typescript) - Official API docs (current, March 2026)
- [Claude Agent SDK V2 Preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview) - V2 interface docs (current)
- [Claude Agent SDK Session Management](https://platform.claude.com/docs/en/agent-sdk/sessions) - Session persistence docs (current)
- [Claude Agent SDK Streaming Input](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode) - Input modes docs (current)
- [Claude Agent SDK Streaming Output](https://platform.claude.com/docs/en/agent-sdk/streaming-output) - Output streaming docs (current)
- [Cloudflare Sandbox SDK Commands API](https://developers.cloudflare.com/sandbox/api/commands/) - streamProcessLogs/getProcessLogs reference (current)
- [Cloudflare Sandbox SDK Background Processes](https://developers.cloudflare.com/sandbox/guides/background-processes/) - startProcess guide (current)
- [Cloudflare Sandbox SDK Streaming Output](https://developers.cloudflare.com/sandbox/guides/streaming-output/) - Streaming patterns guide (current)
- [OpenAI Codex App Server Docs](https://developers.openai.com/codex/app-server/) - Thread/Turn/Item architecture (Feb 2026)
- [Manus Context Engineering Blog](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) - Context management patterns (2025)
- [Google ADK Bidirectional Streaming Blog](https://developers.googleblog.com/en/beyond-request-response-architecting-real-time-bidirectional-streaming-multi-agent-system/) - Real-time streaming architecture (2025)

### GitHub Issues (Community + Collaborator Responses)
- [Issue #14: Historical messages API (TypeScript SDK)](https://github.com/anthropics/claude-agent-sdk-typescript/issues/14) - 47 upvotes, no official response
- [Issue #5135: --include-history flag (Claude Code)](https://github.com/anthropics/claude-code/issues/5135) - Closed as "not planned"
- [Issue #109: Historical messages (Python SDK)](https://github.com/anthropics/claude-agent-sdk-python/issues/109) - Collaborator workaround, possible v0.1.46 fix
- [Issue #88: Forking from historical messages](https://github.com/anthropics/claude-agent-sdk-typescript/issues/88) - Closed as completed (resumeSessionAt exists)

### Secondary Sources
- [InfoQ: Codex App Server Architecture](https://www.infoq.com/news/2026/02/opanai-codex-app-server/) - Feb 2026
- [Codex App Server README (GitHub)](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md) - Feb 2026
- [Cognition: Devin 2.0 Blog](https://cognition.ai/blog/devin-2) - April 2025
- [Cursor Agent Best Practices](https://cursor.com/blog/agent-best-practices) - 2025
- [E2B Blog: How Manus Uses E2B](https://e2b.dev/blog/how-manus-uses-e2b-to-provide-agents-with-virtual-computers) - 2025

### Project-Internal Sources
- `docs/SESSION_25_LONG_RUNNING_AGENT_RESEARCH_2026-03-05.md` - Prior SDK research
- `docs/SESSION_26_LONG_RUNNING_AGENT_2026-03-06.md` - Phase 2 implementation details
- `cloudflare/sandbox/agent-runner.ts` - Current promptStream() implementation
