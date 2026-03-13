# Research: Claude Code / Agent SDK Session Persistence & Multi-Turn Architecture

**Date:** 2026-03-06
**Researcher:** Claude Agent (research task)
**Confidence levels noted per finding**

---

## Executive Summary

The Claude Agent SDK (which powers both Claude Code CLI and Claude Cowork desktop) uses an append-only JSONL file format for session persistence, with each message written as a single JSON line immediately upon generation. The SDK provides two input patterns for multi-turn conversations: (1) the V1 AsyncGenerator/streamInput pattern where messages flow through a long-lived async generator, and (2) the newer V2 Session API with explicit `send()`/`stream()` cycles. Crash recovery relies on the append-only JSONL design -- all messages written before a crash survive, but the session index (`sessions-index.json`) can become stale, making sessions appear "lost" even when data is intact. The SDK does NOT use a database; all state lives in flat files under `~/.claude/projects/`.

---

## 1. How Conversation State Is Maintained Across Multiple Turns

### Confidence: HIGH (based on official Anthropic documentation)

The Claude Agent SDK maintains conversation state through two complementary mechanisms:

#### A. In-Process Context (within a single query lifecycle)

Within a single `query()` invocation, the SDK maintains a conversation buffer in memory. Each turn follows a cycle:
1. User message sent (or yielded via AsyncGenerator)
2. Claude responds (possibly with tool calls)
3. Tools execute, results fed back to model
4. Next turn begins

The full conversation history is sent to the Claude API on each turn, enabling the model to maintain context. When the context window approaches 98% capacity, **auto-compaction** triggers -- the SDK summarizes the conversation, replacing older messages with a condensed summary while preserving key information.

#### B. Cross-Process Persistence (across separate invocations)

When a `query()` completes or the process exits, the session is persisted to a JSONL file. The next invocation can resume by passing the `resume: sessionId` option, which causes the SDK to:
1. Load the JSONL transcript from disk
2. Reconstruct the conversation history
3. Send the full history (or compacted summary) to the Claude API
4. Continue the conversation as if it never stopped

Key options:
- `resume: "session-id"` -- continue the exact same session
- `forkSession: true` -- create a new session branching from the resume point
- `continue: true` -- resume the most recent session (convenience shortcut)
- `resumeSessionAt: "message-uuid"` -- resume at a specific message in the chain
- `persistSession: false` -- disable disk persistence entirely (for ephemeral workflows)

#### C. Context Window Management

Claude Code uses a 200,000-token context window. The system:
- Monitors token consumption across all elements (messages, tool results, system prompts, tool descriptions)
- Auto-compacts at ~98% of effective context (total minus reserved output tokens)
- Strips image blocks, PDFs, and empty text blocks before compaction
- Preserves custom session titles and plan mode state through compaction
- Allows manual compaction via `/compact` command with optional focus directives

**Who would disagree:** Developers building on the SDK in hosted environments (like your Cloudflare deployment) would note that the `~/.claude/projects/` path assumption is problematic when the filesystem is ephemeral. The SDK's persistence model assumes a stable local filesystem, which breaks in container/serverless environments where the filesystem is destroyed on container shutdown.

---

## 2. JSONL File Format and Flush/Sync Behavior

### Confidence: HIGH (confirmed via official docs, community tools, and bug reports)

### File Location and Structure

```
~/.claude/
  history.jsonl                          # Global prompt history index
  projects/
    {project-slug}/                      # Derived from cwd with / replaced by -
      sessions-index.json                # Session metadata index
      {session-id}.jsonl                 # Individual session transcript
      memory/
        MEMORY.md                        # Auto-memory file
```

### JSONL Record Envelope

Each line in a session JSONL file is a JSON object with a shared envelope:

```json
{
  "type": "assistant",
  "uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "parentUuid": "1a2b3c4d-...",
  "timestamp": "2025-02-20T09:14:32.441Z",
  "sessionId": "abc123",
  "cwd": "/home/user/myapp",
  "version": "...",
  "gitBranch": "main",
  "message": { ... }
}
```

### Message Types

Five core message types flow through the JSONL:

| Type | Description |
|------|-------------|
| `system` | Initialization payload with session metadata, model name, available tools, MCP server status |
| `assistant` | Claude's responses with text content, tool invocations, thinking blocks, usage statistics |
| `user` | User prompts and tool results returned to the model |
| `result` | Terminal message with completion status, token accounting, cost calculations |
| `stream_event` | Token-level deltas (only with `--include-partial-messages` flag) |

Additional record types observed in session files: `file-history-snapshot`, `queue-operation`, and summary/compaction records.

### DAG Structure (Not a Linear List)

Messages are linked via `parentUuid`, forming a **directed acyclic graph (DAG)**, not a flat list. This supports:
- Conversation branching (forking sessions)
- Retrying failed tool calls
- Concurrent subagent execution (each branch has its own chain)
- The `/resume` command walks backward from the latest message, following parent references

### Write Behavior

The JSONL format is **append-only**:
- Each message is written as soon as it is generated (one line appended)
- No database, no index, no metadata store for the transcript itself
- The `sessions-index.json` is a separate file maintained alongside

**Critical finding from bug reports:** There is a known issue (GitHub issue #5034) where Claude Code can rewrite/append the entire conversation history to the session file each time a new message is processed in stream-json input format, causing duplicate entries. This is a bug, not the intended behavior.

### Flush Behavior

**Confidence: MEDIUM** (inferred from bug reports and community observations; Anthropic has not published explicit flush documentation)

The SDK writes messages to the JSONL file synchronously during processing. Evidence:
- The v0.2.51 changelog documents a critical fix where `session.close()` was killing the subprocess before it could persist session data, breaking `resumeSession()`. This implies the SDK flushes session data as a cleanup step during graceful shutdown.
- The append-only design means each `writeFileSync` (or equivalent) call to the JSONL file results in an immediate disk write for that line.
- However, the `sessions-index.json` update is a separate operation that can fail independently, leading to "ghost sessions" where data exists but the index doesn't reference it.

**What would change my mind:** If Anthropic published internal docs showing the SDK batches JSONL writes or uses buffered I/O, the crash recovery characteristics would be different.

---

## 3. Crash Recovery

### Confidence: HIGH (extensively documented via bug reports and community experiences)

### What Survives a Crash

The append-only JSONL design provides **message-level crash resistance**:
- All messages written before the crash survive intact
- Only the last unfinished message (if the process was mid-write) may be lost
- New messages are added without reading or rewriting existing data

### What Breaks After a Crash

Three distinct failure modes have been documented:

#### A. sessions-index.json Staleness (Most Common)

The `sessions-index.json` is a separate metadata index mapping session IDs to summaries, message counts, git branches, etc. After a crash (especially OOM kill):
- JSONL files remain intact on disk
- But `sessions-index.json` may not have been updated
- The `/resume` command reads the index, NOT the actual session files
- Result: Sessions appear "lost" even though all data exists

**Recovery:** Rebuild the index from JSONL files. Multiple community tools exist, and there are feature requests for an official rebuild command (GitHub issues #18897, #25032, #22205, #24729).

#### B. parentUuid Corruption (Rarer, More Severe)

GitHub issue #22526 documents a critical bug where `parentUuid` references point to UUIDs that were never written to the file:
- The session chain becomes broken at the corruption point
- `/resume` can only load messages in the unbroken tail chain
- A 951-line JSONL file might show only 1-2 messages loaded
- This appears to be a write-time race condition or incomplete transaction

**Root cause hypothesis:** Buffer flushing issue where parent references are written before child UUIDs are committed, or a state mismatch between in-memory message tracking and the persisted file.

#### C. Large Session File Degradation

GitHub issues #22365 and #21022 document that large session files (>50MB, up to 3.8 GB in extreme cases) cause Claude Code to hang or consume all available RAM:
- The system appears to load these files on every prompt
- Memory explosion causes OOM conditions
- This creates a cascade: large session -> OOM -> crash -> index corruption -> session "lost"

### Recovery Tools and Approaches

1. **Official SDK API:** `getSessionMessages(sessionId, { limit, offset })` -- reads transcript with pagination (added in v0.2.59 with memory optimization for large sessions)
2. **Manual JSONL parsing:** Read the .jsonl file line-by-line, filter by type
3. **Community tools:** `claude-file-recovery` (recovers files from JSONL transcripts), `claude-JSONL-browser` (converts to Markdown), `claude-code-log` (converts to HTML)
4. **Index rebuild scripts:** Several community scripts reconstruct sessions-index.json from JSONL metadata

**Steel-man the opposite position:** One could argue the crash recovery is actually *good* -- the append-only design means data is almost never lost, just the index. Compare this to a database-backed system where a corrupted WAL or incomplete transaction could lose entire sessions. The JSONL approach trades index reliability for data durability.

---

## 4. V1 AsyncGenerator vs V2 Session API

### Confidence: HIGH (based on official documentation)

### V1: AsyncGenerator + streamInput Pattern

The V1 API uses `query()` which returns a `Query` object extending `AsyncGenerator<SDKMessage, void>`. Two input modes:

#### Single Message Input
```typescript
for await (const msg of query({ prompt: "Fix the bug", options: {...} })) {
  // Process messages
}
```
Simple but limited: no image attachments, no dynamic message queueing, no interruption, no hooks.

#### Streaming Input Mode (Recommended)
```typescript
async function* generateMessages() {
  yield { type: "user", message: { role: "user", content: "First message" } };
  // Wait for conditions, then yield more messages
  yield { type: "user", message: { role: "user", content: "Follow-up" } };
}

const q = query({ prompt: generateMessages(), options: {...} });
for await (const msg of q) { /* process */ }
```

The `Query` object also exposes `streamInput(stream: AsyncIterable<SDKUserMessage>): Promise<void>` for feeding additional messages into an existing long-lived query. This enables:
- Multi-turn conversations within a single process
- Image uploads directly in messages
- Queued messages that process sequentially
- Real-time interruption via `query.interrupt()`
- Dynamic permission mode changes via `query.setPermissionMode()`

**This is what your MEMORY.md references as "streamInput() -- used internally for multi-turn conversations."**

#### V1 Multi-Turn Pattern (for your use case)
```typescript
const q = query({
  prompt: asyncGeneratorThatYieldsUserMessages(),
  options: { allowedTools: [...], model: "claude-opus-4-6" }
});

// Long-lived process: consume output as messages stream
for await (const msg of q) {
  if (msg.type === "result") break; // Turn complete
  // Forward to client via WebSocket
}

// Feed follow-up via streamInput
await q.streamInput(anotherAsyncGeneratorWithNextPrompt());

// Continue consuming
for await (const msg of q) { /* ... */ }
```

### V2: Session API (Preview, Unstable)

The V2 API simplifies multi-turn by separating send and receive:

```typescript
import { unstable_v2_createSession, unstable_v2_resumeSession } from "@anthropic-ai/claude-agent-sdk";

// Create session
await using session = unstable_v2_createSession({ model: "claude-opus-4-6" });

// Turn 1
await session.send("What is 5 + 3?");
for await (const msg of session.stream()) { /* process */ }

// Turn 2
await session.send("Multiply that by 2");
for await (const msg of session.stream()) { /* process */ }

// Later: resume
await using resumed = unstable_v2_resumeSession(sessionId, { model: "claude-opus-4-6" });
await resumed.send("Continue from where we left off");
```

**SDKSession interface:**
```typescript
interface SDKSession {
  readonly sessionId: string;
  send(message: string | SDKUserMessage): Promise<void>;
  stream(): AsyncGenerator<SDKMessage, void>;
  close(): void;
}
```

### V1 vs V2 Comparison

| Aspect | V1 (query + streamInput) | V2 (Session send/stream) |
|--------|--------------------------|--------------------------|
| Multi-turn | AsyncGenerator coordination required | Separate send()/stream() cycles |
| Session resume | Via `resume` option on new `query()` | Via `unstable_v2_resumeSession()` |
| Session forking | Supported (`forkSession: true`) | Not yet available |
| Streaming input | Via async generator or `streamInput()` | Via `session.send()` |
| Stability | Stable | **Unstable preview** (APIs may change) |
| Resource cleanup | Manual `close()` | Supports `await using` auto-cleanup |
| Advanced features | Full feature set | Some features pending |

### Recommendation for Your Architecture

For your Cloudflare sandbox deployment, the V1 `streamInput()` pattern is the most suitable because:
1. V2 is unstable and may change
2. `streamInput()` enables keeping the agent process alive across multiple turns without restarting
3. The V1 pattern is what Claude Code itself uses internally
4. Session persistence to JSONL happens automatically

**What would change this recommendation:** If V2 becomes stable and adds session forking support, its explicit send/stream separation would be cleaner for a WebSocket-based architecture where turns are driven by client messages.

---

## 5. Multi-Turn Architecture Documentation

### Confidence: HIGH (aggregated from official docs and detailed technical analysis)

### The Full Architecture Stack

```
                     User/Client
                         |
                    [WebSocket/HTTP]
                         |
                  Your Application Layer
                   (Durable Object / Server)
                         |
               Claude Agent SDK (query())
                    /          \
            V1 AsyncGen    V2 Session
                |              |
          Claude Code CLI  Claude Code CLI
          (subprocess)     (subprocess)
                |              |
           [JSONL persistence on disk]
                |
          Claude API (api.anthropic.com)
                |
          Tool Execution Loop
          (Read, Write, Bash, Grep, etc.)
```

### Key Architectural Decisions

1. **The SDK is a process wrapper.** The Agent SDK spawns Claude Code CLI as a subprocess. All communication happens via stdin/stdout with NDJSON format. The `spawnClaudeCodeProcess` option allows customizing how this subprocess is created (e.g., to run in a VM or container).

2. **Sessions are filesystem-based.** The SDK writes to `~/.claude/projects/` by default. There is no database, no server-side storage, no cloud sync. The `persistSession: false` option can disable this entirely.

3. **The agentic loop is model-driven.** Claude decides what tools to use, when to stop, and how to recover from errors. The SDK provides the harness (tools, context management, execution environment) but does not dictate the loop structure.

4. **Compaction is built-in.** For long-running sessions, automatic context summarization prevents overflow. The compaction summary replaces older messages but preserves the JSONL file (compacted records are appended, not replacing originals).

5. **File checkpointing is opt-in.** When `enableFileCheckpointing: true`, the SDK snapshots files before modification. `rewindFiles(messageId)` restores files to their state at any checkpoint. This does NOT rewind conversation history -- only files on disk.

### Production Hosting Patterns (from Anthropic's Official Docs)

Anthropic documents four deployment patterns:

| Pattern | Description | Best For |
|---------|-------------|----------|
| **Ephemeral** | New container per task, destroyed on completion | One-off tasks, invoice processing |
| **Long-Running** | Persistent containers, multiple SDK processes | Email agents, chat bots, site builders |
| **Hybrid** | Ephemeral containers hydrated with history via session resume | Deep research, project management |
| **Single Container** | Multiple agents in one container | Simulations, agent collaboration |

**Your architecture (Cloudflare sandbox)** maps closest to the **Hybrid** pattern: ephemeral containers that hydrate state from R2 storage and use session resume for follow-ups.

### Claude Cowork's Approach (for Reference)

Claude Cowork (the desktop product) uses a different hosting model:
- Runs in a local VM (Apple Virtualization Framework on macOS)
- Linux ARM64 guest OS with bubblewrap + seccomp security layers
- File sharing via explicit folder mounting
- Same Agent SDK underneath, but with desktop-specific MCP integrations
- Session persistence is local to the VM/host filesystem
- Long-running tasks within a single session context (no cross-session persistence discussed)

---

## 6. Implications for Your Creative Agent Architecture

### What This Means for Your R2-Backed Session Persistence

Your current architecture writes JSONL to R2 via s3fs FUSE mount. Based on this research:

1. **JSONL flush behavior matters critically.** The SDK's append-only writes are synchronous per-message, but s3fs only uploads on `close(fd)`, `fsync(fd)`, or `unmount`. Your Session 17/24 fix (`unmountBucket` before destroy) is correctly addressing this gap. Without it, the last N messages written to the JSONL may never reach R2.

2. **The `persistSession: false` option exists.** If you want to manage persistence yourself (e.g., writing to D1 instead of JSONL files), you can disable the SDK's built-in persistence and handle session state in your Durable Object.

3. **The `getSessionMessages()` API could replace your JSONL parsing.** Instead of manually parsing JSONL from R2, you could use the SDK's built-in function (added v0.2.59) with pagination support and memory optimization.

4. **V1 streamInput is your follow-up path.** Your MEMORY.md already identified this. The pattern would be:
   - Initial generation: `query()` starts a long-running process
   - Follow-up: `streamInput()` feeds the next prompt without restarting
   - Benefit: Eliminates the ~2.5 minute SDK startup on each follow-up

5. **Session forking could enable branching.** If a user wants to try a different creative direction from the same campaign, `forkSession: true` would create a new branch without losing the original.

### Risk: What Changes in 12 Months?

The V2 Session API is currently unstable but is clearly the direction Anthropic is moving. When it stabilizes:
- `send()`/`stream()` will be cleaner for WebSocket-bridged architectures
- `await using` auto-cleanup will reduce resource leak risks
- But V1 streamInput will likely remain supported (V1 is the stable API)

The biggest risk is that Anthropic changes the JSONL format or storage location. The `parentUuid` corruption bugs suggest the format is still evolving. Building directly on JSONL file parsing creates coupling to an undocumented internal format.

---

## Gaps & Uncertainties

1. **JSONL flush timing is not officially documented.** The claim that "each message is written immediately" is inferred from the crash recovery characteristics, not from official documentation. Confidence: MEDIUM.

2. **V2 Session API internals are unknown.** How V2 manages the subprocess lifecycle differently from V1 is not documented. The `session.close()` bug (v0.2.51) suggests it was initially mishandling subprocess termination. Confidence: LOW on V2 internals.

3. **No official documentation on sessions-index.json format.** The index structure is reverse-engineered from community observations. There is no official schema. Confidence: MEDIUM.

4. **Compaction's effect on JSONL files is unclear.** Whether compaction appends a summary record or truncates/rewrites the JSONL is not clearly documented. Behavior likely changed between versions. Confidence: LOW.

5. **streamInput() behavior after process crash is undocumented.** If the subprocess crashes mid-stream, whether the SDK can recover the AsyncGenerator state is not documented. Likely requires creating a new query() with resume. Confidence: LOW.

6. **Claude Cowork's session persistence across VM restarts is not documented.** The VM lifecycle and whether sessions survive VM destruction is not covered in public docs. Confidence: LOW.

7. **No documentation on concurrent writes to the same JSONL.** The official docs mention that two terminals resuming the same session will interleave messages without corruption, but the mechanism (file locks, atomic appends) is not documented. Confidence: MEDIUM.

---

## Sources

### Primary Sources (Official Anthropic Documentation)
- [Session Management - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/sessions) -- Official session management documentation
- [Agent SDK Reference - TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript) -- Full TypeScript API reference including Query, streamInput, Options
- [TypeScript SDK V2 Interface (Preview)](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview) -- V2 Session API documentation
- [Streaming Input - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode) -- Streaming vs single message input modes
- [Hosting the Agent SDK - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/hosting) -- Production deployment patterns
- [Agent SDK Overview - Claude API Docs](https://platform.claude.com/docs/en/agent-sdk/overview) -- SDK architecture overview
- [How Claude Code Works - Claude Code Docs](https://code.claude.com/docs/en/how-claude-code-works) -- Agentic loop, session management, context window
- [Rewind File Changes with Checkpointing](https://platform.claude.com/docs/en/agent-sdk/file-checkpointing) -- File checkpointing and rewind API
- [Get Started with Cowork - Claude Help Center](https://support.claude.com/en/articles/13345190-get-started-with-cowork) -- Cowork product documentation

### Primary Sources (Anthropic GitHub)
- [claude-agent-sdk-typescript CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/main/CHANGELOG.md) -- SDK changelog with session persistence fixes (v0.2.51, v0.2.53, v0.2.59)
- [Feature Request: API to retrieve historical messages (Issue #14)](https://github.com/anthropics/claude-agent-sdk-typescript/issues/14) -- Reveals session persistence internals, 47+ upvotes
- [BUG: Corrupt parentUuid references (Issue #22526)](https://github.com/anthropics/claude-code/issues/22526) -- Critical JSONL write corruption bug
- [BUG: Duplicate entries in session .jsonl files (Issue #5034)](https://github.com/anthropics/claude-code/issues/5034) -- JSONL write duplication bug
- [BUG: Large session JSONL files cause hangs (Issue #22365)](https://github.com/anthropics/claude-code/issues/22365) -- Memory issues with large sessions
- [sessions-index.json not updated (Issue #25032)](https://github.com/anthropics/claude-code/issues/25032) -- Index staleness after crashes

### Secondary Sources (Analysis and Community)
- [Claude Agent SDK Spec (Gist)](https://gist.github.com/SamSaffron/603648958a8c18ceae34939a8951d417) -- Community-authored SDK spec with NDJSON protocol details
- [Claude Code's Hidden Conversation History](https://kentgigger.com/posts/claude-code-conversation-history) -- Deep dive into session file structure
- [Claude Cowork Architecture Deep Dive](https://claudecn.com/en/blog/claude-cowork-architecture/) -- VM isolation, MCP integration, agentic loop analysis
- [Context Window & Compaction (DeepWiki)](https://deepwiki.com/anthropics/claude-code/3.3-session-and-conversation-management) -- Detailed context management analysis
- [Missing Sessions in Claude Code --resume: How to Restore](https://zenn.dev/tjst_t/articles/260220-claude-code-oom-session-recovery?locale=en) -- Session recovery after OOM kill
- [Claude Code /resume loses sessions](https://fizz.today/claude-code-resume-session-index-rebuild/) -- Index rebuild guide
- [Claude Cowork Explained (Amplifi Labs)](https://www.amplifilabs.com/post/claude-cowork-explained-how-anthropic-is-building-agentic-productivity) -- Cowork architecture overview
- [Anthropic: Claude Code transformed programming, Cowork next (VentureBeat)](https://venturebeat.com/orchestration/anthropic-says-claude-code-transformed-programming-now-claude-cowork-is) -- Product strategy context
- [Analyzing Claude Code Logs with DuckDB](https://liambx.com/blog/claude-code-log-analysis-with-duckdb) -- JSONL format analysis
- [claude-file-recovery (GitHub)](https://github.com/hjtenklooster/claude-file-recovery) -- Tool for recovering files from JSONL transcripts
