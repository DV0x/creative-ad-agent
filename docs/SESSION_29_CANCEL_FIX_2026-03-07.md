# Session 29: Cancel Race Condition Fix + File Reconciliation

**Date:** 2026-03-07
**Branch:** `new-ui`
**Prior version:** `f8f73c4e` (Session 28 — SSE fix + image reconciliation)
**Deployed version:** `060bd742`

## Issues Found

### Issue 1: Stuck `isGenerating` Flag

After a previous generation completed, the `isGenerating` flag was persisted as `true` in DO storage. New generations got rejected with "A generation is already in progress."

**Root cause:** `isGenerating` is persisted to DO storage via `persistSession()` and restored on reconnect. If a generation completes but the DO resets before `clearPersistedSession()` runs, the flag stays `true` forever.

**Fix:** Added staleness check in `restoreSession()` — when `isGenerating` is restored as `true`, verify against D1 that the campaign actually has `generating` status. If not, reset the flag.

### Issue 2: Cancel Kills Wrong Agent Process (Critical)

When the user cancels a generation during the setup phase (before the new agent starts), `handleCancel` kills the **old** agent process from a previous campaign. The new agent (started after cancel) is never killed.

**Sequence:**
1. User starts new campaign → `runGeneration()` begins setup (mount R2, pre-flight check, etc.)
2. User cancels after ~10 seconds → `handleCancel()` runs
3. `handleCancel` looks at `this.agentProcessId` — still points to the **previous campaign's** agent
4. Kills the wrong agent, sets `agentProcessId = null`
5. `runGeneration()` finishes setup, starts a **new** agent, overwrites `agentProcessId`
6. Checks abort signal → breaks out of loop
7. Finally block intentionally does NOT kill agent (designed to keep warm for follow-ups)
8. Result: zombie agent holds R2 mount, blocks next generation

**Consequences:**
- Next generation's R2 mount fails: `S3FSMountError: /mnt/r2 is not empty`
- Next message treated as follow-up to zombie agent (wrong campaign)

**Fix (3 parts):**

1. **`handleCancel` simplified** — only sets abort signal + sends ack. Does NOT kill processes or update D1. Lets `runGeneration`/`runFollowUpFast` handle their own cleanup since they know which agent they started.

2. **Abort check before `startProcess()`** — `runGeneration` checks `abortController.signal.aborted` before starting the agent. If cancelled during setup, skips starting the agent entirely.

3. **Cancel-aware finally blocks** — both `runGeneration` and `runFollowUpFast` now kill the agent and unmount R2 when `wasCancelled` is true. On normal completion, behavior is unchanged (keep agent warm).

### Issue 3: Research File Empty After Generation (SSE Framing)

The research file showed empty content (0 bytes) in the client despite generation completing successfully.

**Root cause:** The SSE framing bug (documented in Session 27/28) dropped the assistant message containing the `Write` tool_use for the research file. The DO never parsed the message, so `updateCampaignFile()` was never called. D1 stayed at 0 bytes.

Session 28 fixed this for **images** via `reconcileImages()` reading `turn-result.json`. But files (research, hooks, prompts) were not covered.

**Fix:** Extended the same pattern to files:

1. **Agent-runner** (1 line): `turn-result.json` now includes `files` alongside `images`:
   ```json
   { "images": [...], "files": { "research": "...", "hooks": "...", "prompts": "..." } }
   ```

2. **DO**: New `reconcileFiles()` method reads `turn-result.json` via `sandbox.readFile()` (bypasses SSE) and updates D1. Called after turn completes in both `runGeneration` and `runFollowUpFast`, alongside `reconcileImages()`.

## Design Principle

**SSE is best-effort for real-time progress. The filesystem is the source of truth.**

During generation, the SSE stream delivers data to D1 in real-time (for UI updates). After each turn completes, the DO reads `turn-result.json` from local disk and reconciles both images and files. This guarantees D1 has complete data regardless of SSE reliability.

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Staleness check in `restoreSession()`. Simplified `handleCancel()`. Abort check before `startProcess()`. Cancel-aware finally blocks in `runGeneration` and `runFollowUpFast`. New `reconcileFiles()` method called alongside `reconcileImages()`. |
| `cloudflare/sandbox/agent-runner.ts` | `turn-result.json` now includes `files` object |

## Testing

- Start campaign → cancel after 10s → start new campaign (should mount R2 cleanly)
- Full generation → verify research/hooks/prompts in D1 have content
- Follow-up on existing campaign (slow path after deploy)
