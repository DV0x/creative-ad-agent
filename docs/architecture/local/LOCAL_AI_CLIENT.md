# Local AI Client

> Part of [Architecture Documentation](../INDEX.md) | **File:** `server/lib/ai-client.ts` (489 lines)

---

## Overview

`AIClient` class wrapping the Claude Agent SDK for in-process AI execution. In local mode, the SDK runs directly in the Express server process — no containers, no file IPC.

---

## Class: `AIClient`

```typescript
class AIClient {
  constructor(sessionManager?: SessionManager)

  // Three async generator methods:
  async *queryStream(prompt, options?, attachments?): AsyncGenerator<SDKMessage>
  async *queryWithSession(prompt, sessionId?, metadata?, attachments?, externalAbortController?, resumeSdkSessionId?): AsyncGenerator<{ message, sessionId }>
  async *queryWithSessionFork(prompt, baseSessionId, metadata?, attachments?): AsyncGenerator<{ message, sessionId, baseSessionId, isFork }>
}
```

### Query Methods

**1. `queryStream(prompt, options?, attachments?)`** — Basic query. Merges `options` with defaults, creates a prompt generator with a `doneSignal` to keep stdin open for MCP tool responses, and yields raw SDK messages.

**2. `queryWithSession(prompt, sessionId?, metadata?, attachments?, externalAbortController?, resumeSdkSessionId?)`** — Full session management. This is the method `websocket-handler.ts` actually calls for both `generate` and `follow_up`. It:
- Looks up or creates a session via `SessionManager`
- Builds resume options from either the explicit `resumeSdkSessionId` parameter or the session's stored SDK session ID
- If resume is available, tries it first; on failure (e.g., stale JSONL), falls back to a fresh session automatically
- Captures the SDK session ID from the `system.init` message and persists it for future follow-ups
- Yields `{ message, sessionId }` tuples

**3. `queryWithSessionFork(prompt, baseSessionId, metadata?, attachments?)`** — Fork-based. Creates a new session branching from an existing one (for exploring different creative directions). Uses `forkSession: true` in SDK options. Yields `{ message, sessionId, baseSessionId, isFork }` tuples.

All three methods accept an optional `attachments` parameter (`Array<{ type: string; source: any }>`) for multi-modal messages (e.g., image references resolved from asset files).

### SDK Configuration

Calls `@anthropic-ai/claude-agent-sdk`'s `query()` with:

| Option | Value |
|---|---|
| `model` | `claude-haiku-4-5-20251001` |
| `maxTurns` | 30 |
| `cwd` | `agent/` directory (resolved relative to `process.cwd()`) |
| `settingSources` | `['user', 'project']` — loads agents from `.claude/agents/` and skills from `.claude/skills/` |
| `systemPrompt` | `ORCHESTRATOR_SYSTEM_PROMPT` |
| `allowedTools` | Task, Skill, TodoWrite, WebFetch, WebSearch, Read, Write, Bash, Edit, Glob, Grep, `mcp__nano-banana__generate_ad_images` |
| `mcpServers` | `{ 'nano-banana': nanoBananaMcpServer }` |

**Initialization:** On construction, logs discovered agents and skills from the `agent/` workspace directory.

### Follow-Up Resume

```typescript
// For follow-ups, websocket-handler.ts passes the SDK session ID as a positional parameter:
for await (const result of aiClient.queryWithSession(
  prompt,
  wsSessionId,       // session ID
  undefined,         // metadata
  attachments,       // optional multi-modal attachments
  abortController,   // for cancel support
  sdkSessionId       // resume from previous turn's SDK session
)) { ... }
```

The SDK handles conversation history internally via its session file (JSONL in `.claude/projects/`). If resume fails (stale/empty JSONL), `queryWithSession` automatically falls back to a fresh session.

---

## MCP Server (`server/lib/nano-banana-mcp.ts` — 358 lines)

Same tool as production but saves images to local disk instead of FUSE mount:

```
generated-images/{sessionId}/{index}_{hookType}_{name}.png
```

Uses `fal.ai` API (Nano Banana Pro / Gemini image model) for generation.

---

## Orchestrator Prompt (`server/lib/orchestrator-prompt.ts` — 77 lines)

Short barrel file that imports the system prompt. The actual prompt content is shared with the sandbox version (`cloudflare/sandbox/orchestrator-prompt.ts`).

**Warning:** The local and sandbox versions of the orchestrator prompt may diverge. Changes to one must be manually mirrored to the other.

---

## Session Tracking (`server/lib/session-manager.ts` — 342 lines)

`SessionManager` class maintains in-memory maps:
- SDK session IDs per campaign (for follow-up resume)
- Active generation state per user (for cancel)
- WebSocket connections → session mapping (for event routing)

All state lost on server restart.

---

## Differences from Production

| Aspect | Local | Production |
|---|---|---|
| Execution | In-process async generator | Separate container process |
| IPC | Direct function return | File-based (`next-prompt.json`) |
| Image storage | Local filesystem | R2 via FUSE mount |
| Session persistence | In-memory | D1 + DO storage |
| Startup | ~5s | ~2.5 min cold |
| Follow-up | New `query()` with `resume` option | Write prompt file, agent picks up |
| AI class | `AIClient` class instance | `agent-runner.ts` script (long-running) |

---

## See Also

- [Local Architecture](./LOCAL_ARCHITECTURE.md) — Server overview
- [AI Agent Pipeline](../shared/AI_AGENT_PIPELINE.md) — Orchestrator prompt details
- [Sandbox Container](../cloudflare/SANDBOX_CONTAINER.md) — Production equivalent
