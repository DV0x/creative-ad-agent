# Session Summary — 2026-02-25-b

## What We Built

### Dream Sketch Hybrid + Service Realism Workflows

Two new service-brand art-style workflows (styles 13 and 14) for brands that sell services, not physical products.

**Files Created:**
- `agent/.claude/skills/art-style/workflows/dream-sketch-hybrid.md` — Photorealistic person composited into hand-drawn sketch environment. 5 sketch sub-styles × 4 compositions × 3 backgrounds. Diversity engine ensures all 6 hooks are visually distinct.
- `agent/.claude/skills/art-style/workflows/service-realism.md` — Full photorealistic lifestyle scene with graphic overlays. 5 scene categories × 4 camera approaches × 3 lighting moods × 4 overlay styles.

**Files Modified:**
- `agent/.claude/skills/art-style/SKILL.md` — Added: keyword routing (2 rows), style comparison (2 rows), service brand category detection (7 categories), service brand default routing table, expanded psychology mapping (tertiary/quaternary columns for new styles), expanded Entity ID distinctness matrix (12×5 → 14×5), Service Brand Family section, Audience Extraction Process section.
- `server/lib/orchestrator-prompt.ts` — Added 2 style keyword rows, updated auto-selection description for service brands.

**Verification:** All 12 structural checks passed (section order, SKILL.md references, hook-bank field contract, routing tables, distinctness matrix, orchestrator sync).

---

## Bug Investigation: Resume Fails After Credit Exhaustion

### Symptom

User ran a generation for `verbisedu` (education brand). Pipeline completed research + hooks but ran out of API credits before art-style could run. User sent a follow-up message expecting the conversation to resume from where it left off. Instead:
- First resume attempt: 0 tokens, 0 cost, crash (exit code 1)
- Second attempt (fresh fallback): same — 0 tokens, crash
- Third attempt (after campaign marked as `error`): finally starts fresh and works

### Root Cause Chain

```
Credits exhausted mid-generation
  → Claude Code CLI receives API error
  → CLI exits with code 1 (abnormal termination)
  → Session JSONL file left incomplete (no final result turn, possibly truncated mid-line)
  → Campaign status already marked 'complete' in DB (the SDK 'result' message fired before the process crashed)
  → Follow-up looks up campaign → status is 'complete' → trusts the SDK session ID
  → Resume tries to load the incomplete JSONL → CLI can't parse it → exits with code 1
  → Fallback fresh session also fails (unclear why — possibly same JSONL still referenced)
  → Campaign finally set to 'error' → third attempt skips resume → works
```

### Key Code Locations

1. **`server/lib/websocket-handler.ts` ~line 1026-1034** — Follow-up resume guard:
   ```ts
   // Get SDK session ID — skip resume for failed/cancelled campaigns
   let sdkSessionId: string | null = null;
   if (campaign.status !== 'error' && campaign.status !== 'cancelled') {
     sdkSessionId = db.getSdkSessionId(campaignId);
   }
   ```
   Problem: Campaign is `'complete'` (not `'error'`), so it trusts the SDK session ID even though the underlying JSONL is broken.

2. **`server/lib/websocket-handler.ts` ~line 820-833** — Initial generation marks complete:
   ```ts
   // Inside handleGenerate, when result message arrives:
   db.updateCampaignStatus(state.campaignId, 'complete');
   ```
   Problem: The `result` message fires BEFORE the process crash. So the DB says `complete` but the session file is broken.

3. **`server/lib/ai-client.ts` ~line 366-393** — `_executeQuery`:
   ```ts
   for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
     // ... yields messages including 'result'
   }
   // After the for-await loop exits, if the process crashed, the error is thrown HERE
   // But by this point, 'result' was already yielded and the campaign was marked complete
   ```
   Problem: The exit code 1 error happens AFTER the result message was processed. There's a race between "result yielded → campaign marked complete" and "process crashes → error thrown".

4. **`server/lib/ai-client.ts` ~line 324-338** — Resume with fallback:
   ```ts
   if (resumeOptions.resume) {
     try {
       yield* this._executeQuery(..., resumeOptions, ...);
       return; // Resume succeeded
     } catch (error) {
       // Falls back to fresh session (no resume)
     }
   }
   yield* this._executeQuery(..., {}, ...); // Fresh session
   ```
   Problem: When resume fails AND the fresh fallback also fails, both errors propagate up and the campaign is set to `error`. Only then does the next attempt skip resume.

### The Real Question

**Why does the Claude Code CLI exit with code 1 when credits run out?**

The CLI (`@anthropic-ai/claude-agent-sdk` → spawns `claude` CLI process) doesn't handle "out of credits" as a recoverable situation. Instead of:
1. Writing a proper error/result to the session JSONL
2. Closing the session file cleanly
3. Exiting with code 0

...it just dies with exit code 1, leaving the JSONL in whatever state it was in mid-write.

### Investigation Plan for Next Session

#### Phase 1: Understand the JSONL state after crash

1. **Find the session JSONL file** for SDK session `02c1dc6d-51bc-4bce-9472-c5ecd3b04f49`:
   - Check `~/.claude/projects/` or wherever the SDK stores session files
   - Inspect the file: is it truncated? Does it have a proper ending? Is the last line complete JSON?

2. **Compare with a healthy session file** (e.g., `df53bb89-31af-4a37-959a-471d53bb0cc1` which worked):
   - What does a properly-ended JSONL look like?
   - What's different about the crashed one?

3. **Check SDK source** (`node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs`):
   - Search for how `resume` loads the JSONL
   - What validation does it do?
   - What causes it to exit code 1 on a bad file?

#### Phase 2: Fix options (from root cause up)

**Option A: Intercept the crash and repair the JSONL**
- After an exit code 1 from the CLI, inspect the session JSONL
- If the last line is truncated, remove it
- If the file is missing a result/end marker, append one
- Then the next resume attempt would find a valid (if incomplete) session
- Risk: We don't know the exact JSONL format expected by the CLI

**Option B: Detect credit exhaustion before the crash**
- Monitor the SDK message stream for credit-related error messages
- If we detect "out of credits", immediately:
  - Mark the campaign as `'incomplete'` (not `'complete'`)
  - Save a flag that tells follow-up to skip resume
  - Gracefully abort the SDK query before the crash happens
- This prevents the JSONL from being corrupted in the first place

**Option C: Wrap the CLI process with a signal handler**
- The SDK spawns a child process. We might be able to:
  - Intercept SIGTERM/SIGINT sent to the child
  - Give it time to flush the JSONL before dying
  - Or register an `exit` handler on the child process that repairs the file
- Risk: The SDK manages the child process internally, we may not have access

**Option D: Post-crash session validation**
- After ANY exit code 1, validate the JSONL file
- If invalid, delete/rename it so resume won't find it
- Store in DB that this session is unresumable
- Follow-up starts fresh immediately (no failed resume attempt needed)

#### Phase 3: Fix the status race condition

Regardless of which JSONL fix we choose, also fix the race:
- Don't mark campaign as `'complete'` until AFTER the for-await loop fully exits without error
- Move `db.updateCampaignStatus(campaignId, 'complete')` to after the try block, not inside the result message handler
- This way, if the process crashes after result but before clean exit, the campaign stays in `'generating'` status, and the follow-up knows something went wrong

### Files to Investigate Next Session

```
# SDK session storage (find the actual JSONL files)
~/.claude/projects/-Users-chakra-Documents-Agents-creative-agent/

# SDK source — how resume works
server/node_modules/@anthropic-ai/claude-agent-sdk/sdk.mjs
  → search for: resume, JSONL, session_id, ProcessTransport

# The websocket handler — where to fix the status race
server/lib/websocket-handler.ts
  → handleGenerate (~line 700-970)
  → handleFollowUp (~line 990-1280)

# The AI client — where resume fallback happens
server/lib/ai-client.ts
  → queryWithSession (~line 307-339)
  → _executeQuery (~line 344-394)
```
