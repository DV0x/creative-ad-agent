# Research: Long-Running AI Agent Process Patterns

## How Production Applications Handle Conversation Persistence and Crash Recovery

**Date**: 2026-03-06
**Research Focus**: How do production AI agent systems keep agent processes alive for fast follow-ups while ensuring conversation history survives process death?

---

## Executive Summary

The industry has converged on a clear answer: **do NOT keep processes alive as the primary persistence mechanism**. Instead, persist conversation state to durable storage (JSONL files, databases) and replay/reconstruct state on process restart. Keeping processes alive is an optimization for latency, not a reliability strategy.

The dominant pattern across Codex CLI, Claude Code, Cursor, LangGraph, and Manus is:

1. **Persist every event to an append-only log** (typically JSONL on disk or rows in a database)
2. **Keep the process alive when possible** for fast follow-ups (avoid cold start)
3. **When the process dies, reconstruct state from the log** -- the log IS the source of truth, never the in-memory state
4. **Compact/summarize conversation history** when it exceeds context window limits

This is the same pattern as write-ahead logging (WAL) in databases, event sourcing in distributed systems, and journaling in filesystems. The AI agent world has independently converged on it.

**Confidence: HIGH** -- This finding is consistent across 6+ independent implementations reviewed.

---

## 1. OpenAI Codex CLI / App Server

### Architecture (Confidence: HIGH -- primary source, open-source code)

Codex CLI is the most well-documented implementation and represents the current industry gold standard for this pattern.

**Three Core Primitives:**
- **Thread**: The durable container for a conversation. Supports creation, resumption, forking, and archival. Has a persistent event history so clients can reconnect without losing state.
- **Turn**: A single request-response cycle within a thread. Begins with user input, ends when agent finishes.
- **Item**: The atomic unit of input/output (user messages, agent responses, tool executions, diffs) with lifecycle events (`item/started`, `item/delta`, `item/completed`).

**Persistence Mechanism:**
- All events are appended to JSONL files on disk at `~/.codex/sessions/{thread_id}.jsonl`
- First line: `SessionMeta` (CWD, model, base instructions)
- Subsequent lines: `RolloutItem` entries (every event that occurred)
- A separate `~/.codex/session_index.jsonl` provides fast thread listing without reading full rollout files
- The `RolloutRecorder` component persists events to disk for crash recovery

**Process Lifecycle:**
- The `ThreadManager` spawns `Codex` instances, each owning a `Session` managing conversation state, model client, and tool execution
- For local clients: platform-specific binaries run as child processes with stdio channels
- For web: containers run the App Server, communicating via HTTP and SSE
- The process CAN stay alive between turns for fast follow-ups
- But if it dies, state is fully reconstructable from the JSONL file

**Session Resume:**
- `codex resume --last` or `codex resume <SESSION_ID>`
- Loads the rollout file, replays all `RolloutItem` events
- Validates CWD is still accessible
- Dynamic tools restored from: (1) thread/start params, (2) SQLite state DB, (3) rollout file fallback
- Resumed sessions append to the existing rollout file, not a new one

**Forking:**
- `forkSession` creates a new thread ID that starts from the parent's state
- Preserves linkage via `forked_from_id` and `session_source` fields
- Parent thread preserved unchanged

**Key Insight:** The JSONL file IS the source of truth. In-memory state is a cache. This is explicitly stated: "RolloutRecorder persists events to disk for recovery after crashes."

### What Would Change This Finding
If Codex moved to a server-managed persistence model (like their Conversations API) and dropped local JSONL files, it would indicate the industry is moving toward cloud-hosted state. Currently they support both patterns.

---

## 2. Claude Code / Claude Agent SDK

### Architecture (Confidence: HIGH -- primary source, official docs)

Claude Code uses the same JSONL-on-disk pattern as Codex, with an additional layer of SDK-level session management.

**Storage Locations:**
- `~/.claude/history.jsonl`: Global index (prompt text, timestamp, project path, session ID per line)
- `~/.claude/projects/{path-encoded-dir}/{uuid}.jsonl`: Full session transcripts
- `sessions-index.json`: Auto-generated summaries, message counts, git branches, timestamps
- `memory/` subdirectory: Persistent memory files (cross-session)

**Path Encoding:** `/Users/alex/Projects/myapp` becomes `-Users-alex-Projects-myapp`

**Session Resume:**
- `claude --continue` (most recent session)
- `claude --resume <session-id>` (specific session)
- `/resume` command within active sessions

**Conversation Compaction:**
- When approaching context window limits, Claude Code automatically compacts conversations
- Creates a summary and replaces older messages
- Takes ~1 minute to compact
- Early messages can be summarized away -- critical instructions should be in `CLAUDE.md`

**Claude Agent SDK (V2 Preview):**
- `createSession()` / `resumeSession()`: Start or continue a conversation
- `session.send()`: Send a message
- `session.stream()`: Get the response
- Session ID captured from first system init message
- `forkSession: true` creates a branch without modifying the original

**SDK Streaming Input Mode (Recommended):**
- Agent operates as a long-lived process taking user input
- Handles interruptions, permission requests, session management
- Process stays alive between turns
- File system state maintained persistently
- Follow-ups are just `session.send()` calls -- no restart needed

**SDK Single Message Input:**
- One-shot queries using session state and resuming
- Stateless -- each call is independent
- Uses `resume` option with session ID to continue conversations

**Key Insight:** The SDK explicitly supports BOTH patterns. Streaming input keeps the process alive for fast follow-ups. Session resume handles process death. The JSONL file survives either way.

### Counter-Evidence
The SDK V2 is still marked "unstable preview," suggesting the final API may change. However, the underlying persistence model (JSONL files on disk) is stable and has been shipping in Claude Code for over a year.

---

## 3. Cursor / Windsurf

### Architecture (Confidence: MEDIUM -- limited public documentation, mostly inferred from features)

**Cursor:**
- Each conversation is a separate session. No persistent process between conversations.
- Context carried forward via: (1) Rules (`.cursor/rules/` markdown files injected into every prompt), (2) Memories (auto-generated rules from past interactions), (3) `@Past Chats` reference feature
- Codebase indexed in background using Merkle tree sync
- Long conversations cause attention degradation -- Cursor recommends starting new conversations when effectiveness drops
- **Background Agents**: Run on isolated Ubuntu VMs in AWS. Clone repo, work on separate branch, push changes. State persists as disk snapshots. Each task is a separate agent run.

**Windsurf (Cascade):**
- Persistent agent that reads codebase and builds project model
- Two memory types: User-generated rules and auto-generated memories
- Named snapshots/checkpoints of project state
- `@-mention` previous conversations to pull relevant summaries
- Does NOT retrieve full past conversations -- retrieves summaries and relevant snippets to avoid context window overflow

**Key Insight:** Neither Cursor nor Windsurf keeps an LLM process alive between conversation sessions. Each conversation starts a new API call chain. Persistence is through rules files, memory systems, and codebase indexing -- not process state.

### Who Would Disagree
Cursor/Windsurf users who want fast follow-ups within a single session might argue these tools DO keep the process alive during a session. That's true -- within a single conversation, the process stays alive and turns are fast. The point is that between conversations, state is reconstructed from disk, not from a persistent process.

---

## 4. Devin (Cognition)

### Architecture (Confidence: MEDIUM -- limited technical detail, mostly product-level descriptions)

**Cloud VM Model:**
- Each session runs in an isolated virtual machine
- VM includes terminal, code editor, and browser
- Multiple parallel Devins can run simultaneously
- Each task gets its own VM -- no conflict between sessions

**State Management:**
- Vectorized snapshots of the codebase stored in a memory layer
- Full replay timeline of every command, file diff, and browser tab
- Persistent memory enables long-running migrations over hours/days
- Agent maintains a running to-do list of subtasks

**Fork and Rollback:**
- Users can scrub timeline and restore checkpoint
- Rollback restores files and memory to a previous point
- Fork creates a branch from current state

**Cross-Session Memory:**
- As of mid-2025: Devin does NOT maintain long-term memory across sessions
- Each new session starts fresh
- Insights from sessions can inform future sessions via improved prompts

**Key Insight:** Devin's persistence is VM-level, not process-level. The VM disk and replay timeline provide durability. When the VM dies, the replay timeline enables reconstruction. This is analogous to the JSONL pattern but at a higher abstraction level.

### What Would Change This Finding
If Devin introduced persistent cross-session memory (which their product roadmap may include), it would move them closer to the Letta/MemGPT model. Currently, each session is isolated.

---

## 5. LangGraph

### Architecture (Confidence: HIGH -- primary source, detailed documentation)

LangGraph has the most explicit checkpointing architecture of any framework reviewed.

**Checkpoint Data Model:**
- `Checkpoint`: Complete state snapshot (channel_values, channel_versions, versions_seen, updated_channels)
- `CheckpointTuple`: Wraps checkpoint with metadata and parent_config (linked list through history)
- `CheckpointMetadata`: Source (input/loop/update/fork), step number, parents mapping

**Three-Table Storage Schema:**
- `checkpoints`: Main record with primitive values inlined as JSON
- `checkpoint_blobs`: Serialized complex channel values (keyed by channel name + version)
- `checkpoint_writes`: Pending writes accumulated per-task before next checkpoint

**Backend Implementations:**
| Backend | Storage | Durability |
|---------|---------|-----------|
| InMemorySaver | In-memory | None (process lifetime) |
| SqliteSaver | SQLite file | File-based |
| PostgresSaver | PostgreSQL + JSONB | Durable |
| AsyncPostgresSaver | PostgreSQL + JSONB | Durable |

**Checkpoint Creation:**
- Input checkpoint (step: -1, source: "input"): Before any nodes run
- Loop checkpoints (step: 0+, source: "loop"): After each BSP superstep
- Update checkpoints (source: "update"): From manual state injection

**Recovery Flow:**
1. Load checkpoint via `get_tuple(config)` using `thread_id` (+ optional `checkpoint_id`)
2. Restore `channel_values` from persisted state
3. Use `versions_seen` to determine which nodes need to execute
4. Apply any accumulated `pending_writes` (enables human-in-the-loop review)
5. Resume execution from saved step

**Version Tracking:** `'{step:032}.{random:016}'` format -- zero-padded step + random suffix for lexicographic ordering and conflict-free concurrent writes.

**Key Insight:** LangGraph checkpoints at every superstep, creating a full execution history that enables both crash recovery AND time-travel debugging. However, partial work within a superstep IS lost on failure.

### Counter-Evidence (Important)
A detailed critique from Diagrid argues that LangGraph's checkpointing is NOT equivalent to durable execution:
- Manual resume required -- checkpoints need explicit external action to restore
- No automatic failure detection or watchdog mechanisms
- Duplicate execution risk when multiple processes resume the same checkpoint
- Superstep-level granularity means partial work within a step is lost

This is a valid criticism. LangGraph provides the BUILDING BLOCKS for crash recovery but not a complete solution. You still need external orchestration (health checks, restart logic, dedup) to make it production-grade.

---

## 6. Durable Execution Frameworks (Temporal / Restate)

### Architecture (Confidence: HIGH -- primary sources, detailed documentation)

These represent the most rigorous approach to crash recovery, going beyond checkpointing to true durable execution.

**Temporal:**
- Workflows are deterministic orchestration blueprints that survive crashes
- Activities are where non-deterministic work occurs (LLM calls, tool invocations)
- Event History records every decision and activity result
- On crash: replay the workflow using Event History, skip already-completed activities, resume from failure point
- Tool calls are recorded as activities -- their results are replayed, NOT re-executed
- LLM responses treated as activity results -- recorded once, replayed deterministically

**Restate:**
- Journal-based persistence: every LLM call, DB query, or tool invocation recorded in a durable journal
- On crash: re-invoke function, replay journal, restore resolved promises, continue
- Runs as a proxy in front of serverless functions (Vercel, CloudFlare Workers, AWS Lambda)
- Zero-cost waiting: functions suspend during human approval, resume without cost
- Immutable deployment URLs: in-flight requests continue on original code version, new requests route to new version

**Key Advantages Over Checkpointing:**
1. Activity-level recovery (not just superstep-level)
2. Automatic failure detection and restart
3. Duplicate prevention through distributed coordination
4. Deterministic replay -- no need to re-execute completed work

**Key Insight:** Durable execution is the most robust pattern but requires the most infrastructure investment. The tradeoff is: checkpointing (LangGraph) is simpler to implement but less reliable; durable execution (Temporal/Restate) is more reliable but adds an orchestration layer.

### Who Would Disagree
Teams building simple agent applications would argue durable execution is overengineered. For an agent that runs for 30 seconds and makes 3 API calls, a simple retry is sufficient. Durable execution shines for agents that run for minutes/hours with dozens of tool calls.

---

## 7. Manus AI

### Architecture (Confidence: MEDIUM -- blog posts, not code-level docs)

**File System as Memory:**
- Treats the filesystem as "the ultimate context" -- unlimited, persistent, directly operable
- All compression strategies are restorable (e.g., drop webpage content but preserve URL)
- `todo.md` file serves as a live checklist, continuously updated
- "Recites objectives into the end of context" to prevent goal drift

**KV-Cache Optimization:**
- Maintains stable prompt prefixes for cache hits
- Append-only context for deterministic serialization
- 10x cost savings (0.30 vs 3.00 USD/MTok with Claude Sonnet)
- State machine-based tool masking instead of dynamic tool removal (preserves cache)

**Error Recovery:**
- Failed actions remain in context intentionally
- Model learns to adapt from errors
- No explicit checkpoint or crash recovery mechanisms documented

**Scale:**
- Tasks can require up to 15,000 iterations
- Single tasks generate thousands of database iterations
- Uses TiDB for extreme write throughput

**Key Insight:** Manus externalizes state to the filesystem rather than holding it in process memory. The agent reads/writes files as its primary memory mechanism. This is a pragmatic alternative to formal checkpointing -- if the process dies, the filesystem state survives.

---

## 8. OpenAI Conversations API / Agents SDK

### Architecture (Confidence: HIGH -- primary source, official docs)

**Server-Managed State (Conversations API):**
- Conversation persisted as a server-side object with a durable identifier
- Items persisted with no 30-day TTL
- Resume by passing `conversation_id`
- No need to manually resend message history

**Client-Managed State (Sessions in Agents SDK):**
- `SessionABC` interface: `get_items()`, `add_items()`, `pop_item()`, `clear_session()`
- Pre-run: retrieve stored history, prepend to current input
- Post-run: persist all new items from the turn
- Built-in backends: SQLiteSession, OpenAIConversationsSession
- Extension backends: Redis, SQLAlchemy, Dapr, encrypted sessions

**Compaction:**
- `OpenAIResponsesCompactionSession` auto-compacts when history exceeds limits
- Three modes: `previous_response_id`, `input`, `auto`
- Can block streaming or be triggered manually

**Key Insight:** OpenAI provides both server-managed and client-managed persistence. The trend is toward server-managed (Conversations API) for simplicity, but client-managed (Sessions) for control and privacy.

---

## 9. Letta (formerly MemGPT)

### Architecture (Confidence: HIGH -- primary source, research paper + docs)

**LLM-as-OS Paradigm:**
- Context window = RAM (limited, fast)
- Archival/recall memory = Disk (unlimited, slower)
- Agent manages its own memory using tools (self-editing memory)

**Memory Hierarchy:**
- Core memory blocks (persona, human) -- always in context
- Archival memory -- vector-indexed, searchable
- Recall memory -- conversation history, date-searchable

**Memory Tools:**
- `memory_replace`, `memory_insert`, `memory_rethink` -- edit in-context memory
- `archival_memory_insert`, `archival_memory_search` -- persist/retrieve long-term facts
- `conversation_search`, `conversation_search_date` -- search past conversations

**Key Insight:** Letta's approach is fundamentally different -- the agent itself manages what to remember and forget, rather than an external system doing checkpointing. This is more flexible but requires the LLM to be good at memory management.

---

## Synthesis: The Emerging Industry Standard

### The Dominant Pattern (Confidence: HIGH)

```
┌─────────────────────────────────────────────────────────────┐
│                    DURABLE STATE LAYER                       │
│  (JSONL files, SQLite, PostgreSQL, or cloud API)             │
│  - Append-only event log                                     │
│  - Every turn, tool call, and result recorded                │
│  - Source of truth -- survives process death                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼─────┐            ┌──────▼──────┐
    │  FAST    │            │   COLD      │
    │  PATH    │            │   START     │
    │          │            │             │
    │ Process  │            │ Load state  │
    │ alive    │            │ from log    │
    │ Send new │            │ Reconstruct │
    │ turn     │            │ context     │
    │ ~instant │            │ Resume      │
    │          │            │ ~seconds    │
    └──────────┘            └─────────────┘
```

**The pattern has three layers:**

1. **Durable State Layer**: Every event persisted to durable storage. This is the source of truth. Format varies (JSONL files for CLI tools, databases for web services) but the principle is universal.

2. **Fast Path (Process Alive)**: When the process is still alive from the previous turn, the follow-up is near-instant. No cold start, no state reconstruction. This is the happy path.

3. **Cold Start Path (Process Dead)**: When the process has died (crash, deployment, timeout), state is reconstructed from the durable log. Context is rebuilt, and execution resumes. This may take seconds to minutes depending on the amount of state.

### Specific Implementation Recommendations

| Approach | Used By | Best For | Tradeoff |
|----------|---------|----------|----------|
| JSONL on disk | Codex CLI, Claude Code | Local CLI tools | Simple, fast, but single-machine |
| SQLite/PostgreSQL | LangGraph, OpenAI Agents SDK | Web services | Queryable, multi-process, but more complex |
| Server-managed API | OpenAI Conversations API | Cloud-native apps | Simplest, but vendor lock-in |
| VM disk snapshots | Devin, Cursor Background Agents | Sandboxed environments | Full environment preserved, but heavy |
| Durable execution | Temporal, Restate | Mission-critical agents | Most reliable, but most infrastructure |
| File system as memory | Manus | Long-running autonomous agents | Pragmatic, but requires agent cooperation |
| Self-managing memory | Letta/MemGPT | Personalized agents | Most flexible, but depends on LLM quality |

### The Key Architectural Decision

The central question is NOT "keep alive vs restart" -- it's **"where does the source of truth live?"**

- If source of truth = in-memory process state --> fragile, will lose data on crash
- If source of truth = durable log + in-memory is a cache --> robust, can always recover

Every production system reviewed uses the second approach. The in-memory process is kept alive as a PERFORMANCE OPTIMIZATION, not as a RELIABILITY MECHANISM.

---

## Relevance to Creative Agent Project

Based on the current project architecture (Cloudflare Workers + Containers + Durable Objects), here is how these patterns map:

### Current State
- SDK session JSONL stored in R2 (durable log exists)
- Container process dies after generation (no fast path)
- Follow-ups require full container restart + SDK init (~2.5 min cold start)
- D1 stores campaign/message data (second source of truth)

### Recommended Architecture (Based on Industry Patterns)

**Option A: Claude Agent SDK Streaming Input (Most Aligned with Industry)**
- Keep the agent process alive in the container using SDK's streaming input mode
- `createSession()` on first generation
- `session.send()` for follow-ups (near-instant, no restart)
- JSONL automatically persisted by SDK to R2
- If container dies: `resumeSession(sessionId)` reconstructs from JSONL
- This is exactly the Codex CLI / Claude Code pattern

**Option B: Server-Managed State via Anthropic API**
- Use the SDK's session resume feature
- Each generation calls `query()` with `resume: sessionId`
- SDK handles loading conversation history
- Container can die between turns -- session ID is the only state needed
- Cold start penalty: SDK CLI init (~2.5 min) + context reconstruction
- This is the OpenAI Conversations API pattern

**Option C: Hybrid (Recommended)**
- Keep container alive with `sleepAfter: '2h'` (already implemented)
- Use SDK streaming input for fast follow-ups when container is warm
- Persist session ID + JSONL to R2 (already happening)
- On cold start: use `resumeSession()` to reconstruct
- Optimize cold start by: (1) pre-compiling SDK, (2) caching session state, (3) warm container pool

### What Would Change This Recommendation
- If Anthropic's SDK cold start drops below 30 seconds (making Option B viable without latency penalty)
- If Cloudflare containers gain persistent process support across deployments (eliminating the need for session reconstruction)
- If the SDK's streaming input mode proves unreliable in container environments

---

## Gaps & Uncertainties

1. **Cursor internal architecture**: Limited public documentation about how Cursor manages agent process lifecycle between turns within a single session. The Background Agent documentation focuses on cloud VMs but doesn't detail the in-IDE agent process. **Confidence: LOW** on internal details.

2. **Devin crash recovery**: No documentation found on what happens when a Devin VM crashes mid-task. The replay timeline suggests recovery is possible, but no explicit crash recovery mechanism is documented. **Confidence: LOW**.

3. **Cold start latency benchmarks**: No systematic comparison of cold start times across tools (Codex resume, Claude Code --continue, Cursor session restore). Anecdotal evidence suggests 1-5 seconds for local tools, longer for cloud-based tools. **Confidence: LOW**.

4. **SDK streaming input in containers**: The Claude Agent SDK V2 streaming input mode is documented for local use. No documentation found on using it in containerized/cloud environments where the container may be paused/hibernated. **Confidence: MEDIUM** -- the SDK should work, but container lifecycle interactions are untested.

5. **Compaction quality**: Multiple tools auto-compact conversations when context limits are reached (Claude Code, Codex CLI, Cursor). No benchmarks found on information loss during compaction. Manus explicitly notes this as a hard problem. **Confidence: LOW** on quality metrics.

6. **Multi-user session isolation**: Most documentation focuses on single-user scenarios. How these patterns work with multiple users sharing infrastructure (as in our Cloudflare deployment) is less documented. OpenAI's Agents SDK addresses this with `thread_id` scoping, but container-level isolation adds complexity. **Confidence: MEDIUM**.

---

## Sources

### Primary Sources (Official Documentation)
- [OpenAI Codex App Server](https://developers.openai.com/codex/app-server/) - Thread/Turn/Item architecture
- [OpenAI Codex CLI Features](https://developers.openai.com/codex/cli/features/) - Session resume, JSONL persistence
- [OpenAI Codex App Server DeepWiki](https://deepwiki.com/openai/codex/4.4-app-server-and-json-rpc-protocol) - RolloutRecorder, ThreadManager, crash recovery
- [OpenAI Codex App Server InfoQ](https://www.infoq.com/news/2026/02/opanai-codex-app-server/) - Architecture overview
- [Claude Agent SDK Sessions](https://platform.claude.com/docs/en/agent-sdk/sessions) - createSession, resumeSession, forkSession
- [Claude Agent SDK V2 Preview](https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview) - send/stream pattern
- [Claude Agent SDK Streaming Input](https://platform.claude.com/docs/en/agent-sdk/streaming-vs-single-mode) - Long-lived process pattern
- [Claude Code Conversation History](https://kentgigger.com/posts/claude-code-conversation-history) - JSONL storage format
- [LangGraph Checkpointing Architecture](https://deepwiki.com/langchain-ai/langgraph/4.1-checkpointing-architecture) - Three-table schema, recovery flow
- [LangGraph Persistence Docs](https://docs.langchain.com/oss/python/langgraph/persistence) - Checkpoint backends
- [OpenAI Agents SDK Sessions](https://openai.github.io/openai-agents-python/sessions/) - SessionABC interface, backends
- [OpenAI Conversation State Guide](https://developers.openai.com/api/docs/guides/conversation-state) - Server vs client managed state
- [Cursor Background Agent Docs](https://cursor.com/docs/background-agent) - Cloud VM architecture
- [Cursor Features](https://cursor.com/features) - Memories, rules
- [Windsurf Cascade](https://docs.windsurf.com/windsurf/cascade/cascade) - Checkpoints, conversation referencing
- [Devin First Run Docs](https://docs.devin.ai/get-started/first-run) - Session management
- [Letta/MemGPT Research Background](https://docs.letta.com/concepts/letta/) - Memory hierarchy
- [Letta Core Concepts](https://docs.letta.com/core-concepts/) - Agent architecture

### Secondary Sources (Analysis & Blog Posts)
- [Diagrid: Still Not Durable](https://www.diagrid.io/blog/still-not-durable-how-microsoft-agent-framework-and-strands-agents-repeat-the-same-mistake) - Critique of checkpointing vs durable execution (Feb 2026)
- [Temporal: Dynamic AI Agents](https://temporal.io/blog/of-course-you-can-build-dynamic-ai-agents-with-temporal) - Event History replay pattern
- [Restate: Resilient Serverless Agents](https://www.restate.dev/blog/resilient-serverless-agents) - Journal-based persistence
- [Manus: Context Engineering](https://manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus) - File system as memory, todo.md pattern
- [Tacnode: Stateful vs Stateless Agents](https://tacnode.io/post/stateful-vs-stateless-ai-agents-practical-architecture-guide-for-developers) - Five failure modes
- [Devin 2.0 Technical Design](https://medium.com/@takafumi.endo/agent-native-development-a-deep-dive-into-devin-2-0s-technical-design-3451587d23c0) - VM isolation, vectorized snapshots
- [Letta V1 Agent Architecture](https://www.letta.com/blog/letta-v1-agent) - Evolution from MemGPT to V1
- [ByteByteGo: How Cursor Works](https://blog.bytebytego.com/p/how-cursor-serves-billions-of-ai) - Cursor architecture overview
- [Cuckoo AI: Coding Agent Architectures](https://cuckoo.network/blog/2025/06/03/coding-agent) - Cursor/Windsurf/Copilot comparison
- [Long-Running Agent Patterns Newsletter](https://natesnewsletter.substack.com/p/i-read-everything-google-anthropic) - Manus/Google/Anthropic patterns
- [AWS: Durable Agents with LangGraph + DynamoDB](https://aws.amazon.com/blogs/database/build-durable-ai-agents-with-langgraph-and-amazon-dynamodb/) - DynamoDBSaver implementation
- [LangGraph Redis Integration](https://redis.io/blog/langgraph-redis-build-smarter-ai-agents-with-memory-persistence/) - Redis checkpointer
