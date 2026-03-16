# Session 55 — Multi-Campaign Switching & Stuck Follow-Up Fixes

**Date:** 2026-03-16
**Branch:** `new-ui`
**Commits:** `d94dcba`, `45632f8`
**Deployed versions:** `2febd1c4` → `1244e101` → `5c2e901a` → `16b47710`

---

## Summary

Fixed 6 bugs that surfaced during multi-campaign testing. Three bugs caused a stuck infinite alarm loop (from Session 54 investigation), two caused cross-campaign context contamination, and one caused agent hangs on corrupt SDK session files.

---

## Bugs Found & Fixed

### Bug 1: Stuck follow-up — canceled sandbox RPC hangs forever

**Root cause:** The alarm handler created a second `getSandbox()` connection to the same Sandbox DO while `setupSandbox()` was running. The Sandbox DO treated the second connection as a replacement, canceling in-flight RPCs from the first. `timedRPC` had no timeout, so the canceled RPC hung forever. The catch block never ran, `isGenerating` stayed true, and the alarm looped every 10s for 2 hours.

**Evidence from logs:**
```
14:30:49.175  mountBucket           → ok (365ms)
14:30:49.175  exec (cleanAuthCache) → canceled (5023ms)  ← same millisecond as mount
14:30:52.464  setSandboxName        → ok (40ms)  ← alarm's getSandbox() collision
```

The `eventTimestamp` of the canceled exec matched exactly with the mount completion. The alarm's `getSandbox()` arrived 3s later, creating the competing connection.

**Fix (3 parts):**
1. `timedRPC` 60s timeout — `Promise.race` wraps every sandbox RPC
2. `sandboxSetupInProgress` flag — alarm skips `getSandbox()` reconnect during setup
3. Zombie detection — alarm marks incomplete after 5min with `isGenerating=true` but no `agentProcessId`

### Bug 2: Campaign switching sends prompt to wrong agent

**Root cause:** CampaignSession DO is one per user. When user switched from Heritage Foods to Snitch, the Heritage agent was still alive in the sandbox. `isAgentProcessAlive()` returned true, so the DO took the fast path — wrote `next-prompt.json` with Snitch's prompt to the Heritage agent. Heritage agent responded about Heritage Foods.

**Evidence from D1:**
```
campaign_mmsqgwb4u6jv1i (Heritage) assistant response:
"Perfect! Let me brainstorm some fresh viral angles for Snitch..."
```

Heritage campaign got Snitch content — the Heritage agent's SDK session still had Snitch's conversation history from the previous generation.

**Fix:** Added `agentCampaignId` to DO storage. Set when agent starts in `setupSandbox()`. Checked before fast path in `handleFollowUp()`. If mismatch → slow path (kill old agent, start new one).

### Bug 3: Stale turn-result.json saved to wrong campaign

**Root cause:** `handleFollowUp` sets `this.campaignId = Heritage` at line 692 (early in the function). Meanwhile, `setupSandbox` is still running. The alarm fires, reads the stale Snitch `turn-result.json` from disk, and `tryFinalize()` saves Snitch content to the Heritage campaign (because `this.campaignId` is already Heritage).

**Evidence from logs:**
```
[T104][finalize][wrongCampaign] got=campaign_mmsqgwb4u6jv1i expected=campaign_mmoh48kqgxuip7
```
(This trace appeared AFTER the fix was deployed — confirming the validation works.)

**Fix:** Agent-runner now includes `campaignId` in `turn-result.json`. `tryFinalize()` checks `result.campaignId !== campaignId` and skips mismatches.

### Bug 4: SDK JSONL resume hangs on corrupt file

**Root cause:** The Snitch SDK session JSONL file on R2 (321KB, 96 lines) had 9 lines filled with null bytes (`\x00`). s3fs pre-allocates file size with nulls then writes content. If the file is read mid-flush or the container dies during write, null-padded blocks appear. The SDK tried to resume from this file and hung during `query()` initialization.

**Evidence:**
```python
Line 6:  len=720,   repr='\x00\x00\x00...'
Line 93: len=13468, repr='\x00\x00\x00...'
Line 96: len=3268,  repr='\x00\x00\x00...'
```

Agent stdout stuck at 496 chars (startup traces only) for 6+ minutes. No `system.init` message ever arrived.

**Fix:** `RESUME_SDK_SESSION_ID` set to `''` on cloudflare — never resume SDK sessions. D1 conversation history (52 messages, 26KB) + file hydration (research, hooks, prompts) provides all context reliably.

---

## Testing Results

### Test 1: Heritage follow-up → switch to Snitch
- Heritage follow-up: worked (fast path, same campaign)
- Switch to Snitch: `campaignMatch=false` → slow path → correct context
- `[finalize][wrongCampaign]` correctly skipped stale Heritage turn-result
- Snitch agent started fresh with D1 context → responded correctly

### Test 2: Alarm collision prevention
- Alarm fired during `setupSandbox`: `sandbox=false` (no reconnect — `sandboxSetupInProgress=true`)
- No competing `getSandbox()` connection created
- Setup completed normally

### Test 3: DO reset during setup (from deploy)
- First attempt failed: `setupError.fatal: Durable Object reset because its code was updated`
- `isGenerating = false` set correctly (catch block ran thanks to `timedRPC` propagating the error)
- Second attempt succeeded after DO recovered

---

## Architecture Decisions

### Why disable SDK session resume on cloudflare?

The SDK session JSONL is the Claude SDK's internal conversation log. On local dev, it's a file on disk — reliable. On cloudflare, it goes through s3fs FUSE → R2 object storage. s3fs has known flush behavior that causes null-byte corruption:

1. s3fs pre-allocates file size with `\x00` bytes
2. Writes actual content over the nulls
3. If the file is read between steps 1 and 2 (or container dies mid-write), you get null-padded blocks

D1 is the reliable alternative:
- 52 messages, 26KB for Snitch — all intact
- File hydration writes research/hooks/prompts to sandbox disk
- Conversation history appended to prompt ("Continue from here")
- Agent starts fresh but has all user-visible context

### Why `agentCampaignId` instead of comparing SDK session IDs?

The SDK session ID changes when an agent starts fresh (no resume). The campaign ID is stable and directly maps to the user's intent. Simpler, more reliable.

### Why validate campaignId in turn-result.json?

The alarm and `handleFollowUp` can race: `this.campaignId` gets updated to the new campaign before the old `turn-result.json` is cleaned up. Rather than trying to order operations perfectly, we make the data self-describing. Each `turn-result.json` says which campaign it belongs to, and `tryFinalize()` skips mismatches.

---

## Files Changed

### Source code
- `cloudflare/src/durable-objects/campaign-session.ts` — All 6 fixes
- `cloudflare/sandbox/agent-runner.ts` — Added `campaignId` to `turn-result.json`
- `cloudflare/sandbox/package.json` — Added `@types/node` dev dependency

### Architecture docs
- `docs/architecture/cloudflare/DURABLE_OBJECT.md` — `agentCampaignId`, path selection diagram, alarm safety layers, `timedRPC` section, 5 new gotchas
- `docs/architecture/GENERATION_FLOW.md` — Follow-up flow with campaign mismatch, SDK resume disabled
- `docs/architecture/cloudflare/SANDBOX_CONTAINER.md` — `RESUME_SDK_SESSION_ID` always empty
- `docs/architecture/cloudflare/R2_STORAGE.md` — `umount -l` lazy unmount fix
- `docs/architecture/ops/KNOWN_ISSUES.md` — 4 resolved issues

### Session docs
- `docs/SESSION_53_MOUNT_FIX_2026-03-13.md` — s3fs mount fix (committed with this session)
- `docs/SESSION_54_STUCK_FOLLOWUP_2026-03-13.md` — Investigation that led to this session's fixes

---

## Key Patterns for Future Reference

### Two `getSandbox()` connections cancel each other
The Sandbox DO is a Cloudflare Durable Object that proxies RPC calls to the container. When a second connection arrives (new `getSandbox()` call for the same container ID), the Sandbox DO treats it as a session replacement and cancels in-flight RPCs from the first connection. The promise on the caller side never resolves or rejects — it hangs.

**Pattern:** Use a flag (`sandboxSetupInProgress`) to prevent concurrent connections. Only one code path should hold an active sandbox connection at a time.

### Alarm races with background promises
The fire-and-forget pattern (`runGeneration()` runs as a background promise, handler returns immediately) means the alarm can fire while setup is still in progress. Any shared state (`this.campaignId`, `this.sandbox`) can be read by the alarm in an intermediate state.

**Pattern:** Make alarm checks defensive. Validate data freshness (campaign ID in turn-result). Use flags to skip operations during setup. Don't assume shared state is consistent.

### s3fs FUSE is unreliable for structured data
s3fs works well for large binary files (images) where partial writes are obvious. It's unreliable for structured text files (JSONL, JSON) where null-byte corruption is silent and causes parse failures.

**Pattern:** Use s3fs only for images and completion markers. Use D1 for structured data that needs reliable reads.
