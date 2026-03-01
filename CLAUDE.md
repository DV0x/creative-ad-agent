# CLAUDE.md

Project-specific instructions for Claude Code.

## Project Overview

Creative agent — a chat-based AI tool for generating ad campaigns (images, hooks, copy). Stack: React + Vite (client), Node + Express (server), SQLite (persistence), Claude SDK (AI), WebSocket (real-time).

## Key Directories

- `client/` — React frontend (Zustand store, WebSocket hook, chat UI)
- `server/` — Node/Express backend (WebSocket handler, AI client, DB layer, MCP integration)
- `docs/` — Implementation plans and architecture docs

## Plan Document Rules

When writing or updating implementation plan documents (anything in `docs/`):

1. **Never write pseudocode without verifying it.** Before referencing any function, variable, type, or signature in a plan, read the actual source file and confirm it exists with the correct name and signature. Do not guess or write from memory.

2. **Cross-reference in the same pass.** After writing plan pseudocode, immediately verify every reference against the codebase — function names, argument counts, return types, interface fields, barrel exports. Do not treat "architecture review" and "pseudocode accuracy" as separate steps that require user prompting.

3. **No placeholder comments in pseudocode.** Never write `/* same as handleGenerate */` or similar. Either write the actual code, or extract the shared logic into a named function and reference that. Placeholders create gaps that get missed.

4. **Check transitive dependencies.** When a plan adds a new function to a module, also check whether the barrel export (`index.ts`) needs updating, whether TypeScript interfaces need new fields, and whether initialization sites need the new field.

5. **Verify cleanup paths.** For any function with try/catch/finally, trace every early return path through the finally block. Check that cleanup only affects resources created by this invocation, not stale state from a previous one.
