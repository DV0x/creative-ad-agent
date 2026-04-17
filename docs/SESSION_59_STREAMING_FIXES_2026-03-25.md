# Session 59: Streaming Fixes + Dynamic Workers Research (2026-03-25)

## What was done

### Streaming Fixes (deployed to staging + production)

**Problem:** During live generation, all agent text messages rendered as one concatenated blob. After page refresh, messages loaded from D1 and displayed properly formatted.

**Root cause:** Two issues in the streaming pipeline:
1. `appendTextBlock` merged all incoming text into the last text block instead of creating separate blocks
2. No client-side dedup — duplicate messages from SDK passed through to UI

**Fixes applied (commit `511d92f`):**
1. **`store/index.ts` — `appendTextBlock`**: Always pushes a new text block instead of merging into the last one
2. **`useWebSocket.ts` — `seenTextsRef`**: Client-side dedup using a Set that tracks seen text, cleared on each new generation
3. **`useWebSocket.ts` — removed `appendMessageContent`**: Blocks handle streaming display; `.content` accumulation was redundant and caused a blob at the bottom after generation completed
4. **`useWebSocket.ts` — removed `isFollowUp` guard** (commit `740ba59`): `appendTextBlock` now called for both initial generation and follow-ups

**Result:** Streaming now shows individual text blocks interleaved with thinking/tool blocks. Not fully polished — a small content blob still appears at bottom (will be addressed in streaming upgrade).

### Two Rendering Paths (known limitation)

The app has two separate rendering paths that produce different styles:
- **Live streaming**: Text blocks in Zustand (ephemeral, lost on refresh) → BlockRenderer → individual bubbles
- **After refresh**: `.content` from D1 → MarkdownContent → single formatted block

This will be unified in the streaming upgrade (token-level delta streaming).

### Dynamic Workers Research

Researched Cloudflare Dynamic Workers to understand if they could replace our Sandbox Containers.

**Key finding:** Dynamic Workers are NOT for running agents — they're for running CODE that agents GENERATE. The pattern is:
- Agent orchestrator (DO/Worker) calls LLM API
- LLM generates JavaScript code
- That code runs in a Dynamic Worker (isolated V8 sandbox)
- Results return to orchestrator

**Why we can't switch:** We use the Claude Agent SDK (Claude Code harness) which requires a full container environment (filesystem, bash, child processes, MCP). Dynamic Workers are V8 isolates without these capabilities.

**Interesting tech to watch:**
- `@cloudflare/codemode` — LLM writes one function that chains multiple tool calls (reduces API round trips)
- `@cloudflare/shell` — virtual filesystem backed by SQLite + R2
- Cloudflare Agents SDK — their own agent orchestrator framework (separate from Anthropic's)

## Current state

- **Production**: deployed, working at `app.creativemachines.xyz`
- **Staging**: deployed, working at `creative-agent-staging.alphasapien17.workers.dev`
- **Both environments verified** this session

## Planned: Streaming Upgrade

Saved to memory for future discussion. Current streaming sends complete assistant messages as whole blocks. Need to upgrade to token-by-token delta streaming (like Claude Code) for a polished experience:
- `agent-runner.ts` needs to capture SDK `content_block_delta` events
- `sdk-message-parser.ts` needs to process deltas and stream to client
- Client renders ONE growing message (not separate blocks)
- Same content saved to D1 = same rendering everywhere, no two-path problem

## Files changed
- `client/src/hooks/useWebSocket.ts` — dedup + removed appendMessageContent + removed isFollowUp guard
- `client/src/store/index.ts` — appendTextBlock always creates new block
