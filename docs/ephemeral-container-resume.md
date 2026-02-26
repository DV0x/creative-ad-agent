# SDK Session Resume in Ephemeral Containers

## Problem

The Claude Agent SDK (via Claude Code CLI) manages conversation history through JSONL files stored at `~/.claude/projects/-<project-path-slug>/<session-id>.jsonl`. Our application interacts with this mechanism by:
1. Storing the session UUID in SQLite
2. Passing it back to the CLI with the `--resume <id>` flag to restore the conversation history

However, in ephemeral container environments (such as Cloudflare Workers, Lambda containers, or other stateless compute platforms), the container's filesystem is destroyed when the container terminates. This means all JSONL session files are lost, making the `--resume` mechanism permanently broken in these environments.

### The Failure Pattern
```
Container starts → CLI creates JSONL → pipeline runs → JSONL grows
Container dies → JSONL gone forever
New container → --resume <id> → "No conversation found" → exit code 1
```

## Current Architecture: Three Layers

The conversation and persistence system currently operates across three distinct layers:

### Layer 1: SQLite Database
- **Responsibility:** Our primary persistence layer
- **What it stores:** Campaign data, `sdk_session_id`, outputs (research.md, hooks.md, image prompts), user campaigns
- **Lifecycle:** Survives container restarts because the database is external (outside the container)
- **Reliability:** Stable and consistent

### Layer 2: SessionManager
- **Location:** `server/sessions/` (JSON files) + `server/lib/session-manager.ts`
- **Purpose:** In-memory bookkeeping wrapper around session state
- **Current usage:** Minimal and largely unused
  - `getResumeOptions()` is bypassed—`handleFollowUp` reads `sdkSessionId` directly from SQLite instead
  - `addMessage()` stores message copies that are never read back
  - No active consumer of its functionality
- **Status:** Dead weight in the current architecture

### Layer 3: CLI JSONL Files
- **Location:** `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent-agent/`
- **Purpose:** The actual conversation memory maintained by the CLI
- **What enables resume:** These files are the only source of truth the CLI can use for `--resume <id>`
- **Lifecycle:** Lives on the container's local disk; destroyed when the container is destroyed
- **Reliability:** Completely lost in ephemeral environments

## Why Resume Fails in Containers

When a fresh container starts:
1. The previous container's JSONL files no longer exist on the filesystem
2. The CLI cannot find the conversation history needed to "resume"
3. Calling `--resume <id>` fails with "No conversation found" and exit code 1
4. The user-facing conversation continuity is broken

The session UUID is safely stored in our SQLite database, but without the JSONL files, that UUID becomes meaningless.

## Possible Solutions

### Option A: Persistent Volume
Mount a persistent volume at `~/.claude/` so that JSONL files survive container restarts and are accessible to new containers.

**Pros:**
- No changes to application code
- Resume works as-is with existing CLI mechanism
- Simple mental model

**Cons:**
- Ties you to a specific host or container orchestration system
- Does not scale horizontally across multiple container instances
- Adds volume management overhead
- Requires external storage infrastructure

### Option B: Prompt-Based Context Injection
When `--resume` is unavailable, reconstruct the conversation context from SQLite artifacts and inject it into the system or user prompt when starting a fresh CLI session.

**Process:**
1. Read stored artifacts from SQLite (research.md, hooks.md, image prompts, campaign metadata)
2. Build a context-rich prompt that describes what has been completed
3. Inject this context into a new CLI invocation (no `--resume`)
4. Instruct the fresh CLI: "Research is complete [content below]. Hooks are complete [content below]. Continue from art-style generation."

**Pros:**
- Works everywhere: local development, ephemeral containers, serverless, multi-region
- No dependency on persistent filesystem
- Completely decouples conversation continuity from JSONL files
- Graceful degradation: always has a fallback

**Cons:**
- Requires building context injection logic
- Token cost of replaying context to the model
- May not perfectly capture all nuance of the original multi-turn conversation
- Larger initial prompts in new sessions

### Option C: Long-Lived Process (Streaming Input Mode)
Leverage the SDK's support for streaming input mode (`AsyncIterable<SDKUserMessage>`) by keeping the CLI process alive across multiple user turns instead of starting and stopping per turn.

**Process:**
1. Start the CLI once with streaming input mode enabled
2. Keep the process running for the entire user session
3. Stream new user messages to the running process without restarting
4. No resume needed because the process never dies

**Pros:**
- Most efficient: no repeated startup overhead
- No JSONL dependency (conversation lives in the running process memory)
- Lowest latency for follow-up messages

**Cons:**
- Requires persistent containers (defeats "ephemeral" model for long-lived workflows)
- Complex process lifecycle management
- Process crashes still lose in-flight state
- Not suitable for serverless or truly ephemeral compute

### Option D: Hybrid (B + A)
Use Option B as the primary, always-available mechanism and Option A as an optional optimization.

**Process:**
1. Always build context injection logic for resilience
2. Optionally mount a persistent volume if the environment supports it
3. Try resume first (fast, cheap); if it fails, fall back to context injection (slower, more tokens, but works)

**Pros:**
- Works in all environments
- Best-case performance when persistent storage is available
- Graceful degradation when it's not
- Progressive enhancement

**Cons:**
- More complex implementation
- Must handle failure/fallback logic correctly
- Two code paths to maintain and test

## Recommendation

For ephemeral container deployments, **Option B (prompt-based context injection)** is the most durable long-term approach. It removes the dependency on transient filesystem state entirely and ensures that conversation continuity is decoupled from container lifecycle.

For environments with more control (persistent containers, managed databases), **Option D (hybrid approach)** provides the best user experience: fast resume when possible, graceful context-based fallback when needed.

## Layer 2 (SessionManager) Cleanup Note

SessionManager (Layer 2) is currently underutilized and should be re-evaluated:

- **`getResumeOptions()`** is bypassed by `handleFollowUp`, which reads `sdkSessionId` directly from SQLite instead of using SessionManager
- **`addMessage()`** stores message copies that are never read back or used by any consumer
- **No active functionality** that isn't duplicated or unused

If the architecture moves toward Option B (context injection), the true source of conversation state should be the SQLite database, not ephemeral JSON files in Layer 2. SessionManager should either be significantly simplified (removing dead code) or removed entirely.

## Related Files

- `server/lib/session-manager.ts` — Layer 2 implementation
- `server/lib/ai-client.ts` — Where SDK query and resume invocation happens
- `server/lib/websocket-handler.ts` — Entry points `handleGenerate`, `handleFollowUp`
- `server/lib/db/campaigns.ts` — SQLite storage of campaign data and `sdk_session_id`
- CLI JSONL location: `~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent-agent/`
