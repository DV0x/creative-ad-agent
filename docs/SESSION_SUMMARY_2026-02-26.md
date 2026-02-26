# Session Summary — 2026-02-26

## What We Fixed

### Resume Fails After Credit Exhaustion (Bug Fix)

**Problem:** When API credits ran out mid-generation, the campaign was incorrectly marked `complete` (status race condition), the exit code 1 error was swallowed, and the sdk_session_id was overwritten by failed retry attempts. This made it impossible to resume the conversation with full context when credits were restored.

**Root Cause Chain:**
1. SDK sends billing error as `assistant` message with `error: 'billing_error'` → then sends `result` message with `subtype: 'success'` → then exits with code 1
2. Our code treated the `result` message as successful completion → set `generationCompleted = true`, marked campaign `complete`
3. Exit code 1 error arrived AFTER → catch block saw `generationCompleted = true` → swallowed the error
4. Campaign stuck in `complete` with corrupted session state

**Key Investigation Findings:**
- The JSONL session file was NOT corrupted — all lines were valid JSON. The CLI loaded it fine on resume.
- The billing error message has typed fields: `message.error = 'billing_error'`, `message.message.model = '<synthetic>'`, confirmed via `SDKAssistantMessageError` type in `sdk.d.ts` line 342.
- The SDK has NO session validation API — you can only detect bad sessions by attempting resume and catching the error.
- The `result` message's `subtype: 'success'` is misleading — it means "conversation loop finished", not "process will exit cleanly".

**Fix (3 files changed):**

`server/lib/websocket-handler.ts`:
- Added `apiError` flag in both `handleGenerate` and `handleFollowUp`
- Detects `message.error` on SDK assistant messages (billing, rate limit, auth, server errors)
- When `apiError` is set, skips `generationCompleted` on the subsequent `result` message
- Catch block: new `apiError` branch marks campaign `incomplete` (not `complete` or `error`), preserves sdk_session_id, sends `incomplete` event with friendly user message
- Added `'incomplete'` to `ServerMessage` type union

`client/src/types/websocket.ts`:
- Added `WSIncompleteEvent` interface and added to `WSServerMessage` union

`client/src/hooks/useWebSocket.ts`:
- Added `case 'incomplete'` handler: closes thinking block, shows friendly message, sets campaign status to `incomplete`

**Result:** Credits run out → campaign marked `incomplete` → sdk_session_id preserved → user sends follow-up → CLI resumes with `--resume` → full conversation context restored (research, hooks, everything) → pipeline continues from where it stopped.

**Verified:** Manually set the Verbisedu campaign (`campaign_mm21sm9289f1f0`) to `incomplete` with original session ID `02c1dc6d-51bc-4bce-9472-c5ecd3b04f49`. Resume worked — CLI loaded the JSONL, had full context of research + hooks, and continued with art-style generation + image generation.

---

## Investigation Plan for Next Session

### Debug: Image Quality Issues with Dream Sketch Hybrid & Service Realism Styles

The resumed Verbisedu campaign generated images using the new styles (Dream Sketch Hybrid and Service Realism, styles 13 and 14), but the results had issues:
1. **Images don't have hook text** — the ad concepts should include hook copy overlaid on the images
2. **Overall image quality not matching expectations** — need to compare generated prompts against the workflow specs

#### Files to Read and Cross-Reference:

**Campaign outputs (what was actually generated):**
- `agent/.claude/skills/hook-methodology/hook-bank/verbisedu-2025-02-25.md` — The hook bank (6 hooks with copy text)
- Check the campaign's art-style prompts in the DB: `SELECT * FROM campaign_files WHERE campaign_id = 'campaign_mm21sm9289f1f0' AND file_type = 'prompts'`
- Check generated images: `SELECT * FROM campaign_images WHERE campaign_id = 'campaign_mm21sm9289f1f0'`

**Style workflow definitions (what SHOULD have been generated):**
- `agent/.claude/skills/art-style/workflows/dream-sketch-hybrid.md` — Style 13 spec: photorealistic person composited into hand-drawn sketch environment. 5 sketch sub-styles × 4 compositions × 3 backgrounds.
- `agent/.claude/skills/art-style/workflows/service-realism.md` — Style 14 spec: full photorealistic lifestyle scene with graphic overlays. 5 scene categories × 4 camera approaches × 3 lighting moods × 4 overlay styles.
- `agent/.claude/skills/art-style/SKILL.md` — Master routing, entity ID distinctness matrix, shared blocks

**Orchestrator / prompt flow:**
- `server/lib/orchestrator-prompt.ts` — System prompt that tells the agent how to route to styles and what to do with hooks

#### Debugging Steps:
1. Read the hook bank → verify hook text exists and is well-formed
2. Read the generated art-style prompts → check if hook text was included in the image generation prompts
3. Compare prompts against the workflow specs → are the style-specific instructions being followed?
4. Check the MCP `generate_ad_images` tool calls → what exact prompts were sent to the image generator?
5. Identify the gap: is the problem in the prompt construction (art-style skill not including hook text), the image generator (ignoring text instructions), or the workflow spec (missing text overlay instructions)?

---

## Architecture Documentation Created

### SDK Session Resume in Ephemeral Containers (`docs/ephemeral-container-resume.md`)

Documented the architectural limitation: the CLI stores conversation history as JSONL files on local disk (`~/.claude/projects/...`). In ephemeral containers (Cloudflare), these files are destroyed when the container dies, making `--resume` permanently broken.

Key insight: our SessionManager (Layer 2) is dead weight — it duplicates what SQLite does and its message copies are never read. The recommended solution for containers is prompt-based context injection (read campaign artifacts from SQLite, inject into the fresh session prompt).

---

## Three-Layer Session Architecture (Reference)

```
Layer 1: SQLite DB (campaigns table)
  → Our persistence. Stores campaign data, sdk_session_id, outputs.
  → Survives restarts. Used by handleFollowUp to find resume ID.

Layer 2: SessionManager (server/sessions/*.json)
  → In-memory + JSON files. Thin wrapper per SDK query.
  → Dead weight — getResumeOptions bypassed, message copies unread.

Layer 3: CLI JSONL (~/.claude/projects/.../<session-id>.jsonl)
  → THE conversation memory. Only thing --resume uses.
  → CLI creates/manages internally. We never read/write it.
  → Lost in ephemeral containers.
```
