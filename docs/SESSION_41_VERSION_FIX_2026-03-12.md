# Session 41: SDK Version Fix + Stale Completion Bug (2026-03-12)

## Scope

Two fixes: (1) SDK/container version mismatch that broke SSE streaming, (2) stale `turn_complete` detection that broke follow-ups. Deployed as version `695d1a7d`.

---

## Root Cause Analysis

### The chain reaction

The Dockerfile was edited (uncommitted) from `cloudflare/sandbox:0.7.8` → `0.7.10`, but the Worker SDK stayed at `@cloudflare/sandbox:0.7.8`. When deployed, the container got the 0.7.10 runtime while the Worker spoke 0.7.8 protocol.

```
Dockerfile changed to 0.7.10, SDK stayed at 0.7.8
  → SSE streaming broke (streamProcessLogs silently stopped delivering events)
    → No live UI updates after initial burst
    → waitForLog also broke (SSE-based internally)
    → Alarm R2 polling saved initial generation (backup path)
    → Follow-up hit stale turn_complete → instant false completion
```

### Symptoms observed

| Symptom | Cause |
|---------|-------|
| Client showed early events then froze | SSE stream stopped mid-generation (version mismatch) |
| "No images yet" during generation | Events not reaching client |
| Images appeared after ~12 min | Alarm R2 polling found completion marker, reconciled |
| Hooks document empty (0 bytes in D1) | Agent may have failed to write hooks; no visibility due to broken streaming |
| Follow-up completed instantly | `waitForLog('turn_complete')` found OLD completion from initial generation |
| No follow-up work done | Completion handler fired before agent saw new prompt |
| Chat log shows only "Generation complete." | Most SDK events never reached client via broken SSE |

### Evidence from logs (log-4.md)

- Agent stdout grew from 83 → 91,872 chars (agent was working fine)
- Container version warning: `Container version could not be determined. Please update your container to match SDK version 0.7.8`
- No `[gen] Stream ended` or `[gen] Stream error` logs (SSE stream silently stuck)
- Only ~1-2 "Unknown Events" per 30s in wrangler tail (ping/pong, not streaming events)
- Alarm's `getProcessLogs()` (simple HTTP GET) worked throughout
- Initial completion: "Generation complete. 2 images created." — format from R2 polling path (not waitForLog)
- Follow-up: only user message in D1, no assistant response — completion handler fired on stale data

---

## Fix 1: Version Alignment

**Problem:** SDK 0.7.8 on Worker, container runtime 0.7.10 in Dockerfile. Basic RPCs (exec, startProcess, getProcessLogs) work fine over HTTP. SSE streaming (streamProcessLogs, waitForLog) broke silently.

**Fix:**
- `cloudflare/sandbox/Dockerfile`: Reverted `cloudflare/sandbox:0.7.10` → `cloudflare/sandbox:0.7.8`
- `cloudflare/package.json`: Changed `"@cloudflare/sandbox": "latest"` → `"@cloudflare/sandbox": "0.7.8"` (pinned to prevent future drift)

---

## Fix 2: Stale turn_complete Detection

**Problem:** `attachCompletionHandler` calls `proc.waitForLog('turn_complete')` which checks the entire accumulated stdout. For follow-ups on the long-running agent, the OLD `turn_complete` from the initial generation is still in stdout → resolves immediately → marks follow-up "complete" before agent sees new prompt.

The streaming handler already had protection (checks `turn_start` + `requestId`), but the completion handler had none.

**Fix — unique per-turn completion sentinel:**

### agent-runner.ts
- Added module-level `currentRequestId` variable
- Set from prompt file data when follow-up turn starts
- After each `turn_complete`, writes `COMPLETION:req_xxx` (unique per turn)
- Initial generation: no `COMPLETION:` sentinel (no stale data risk)

### campaign-session.ts
- New `completionMarker` instance var (default: `'turn_complete'`)
- `runGeneration`: sets `completionMarker = 'turn_complete'` (fresh process)
- `runFollowUpFast`: sets `completionMarker = 'COMPLETION:req_xxx'` (unique)
- `attachCompletionHandler`: uses `this.completionMarker` in `waitForLog()`
- Alarm log snapshot: uses `this.completionMarker` instead of hardcoded `'turn_complete'`
- Crash handler: uses `this.completionMarker`
- Persisted/restored in `activeSession` storage (survives DO resets)

### How it works

```
Initial generation (fresh process):
  completionMarker = 'turn_complete'
  waitForLog('turn_complete') → no stale data → works normally

Follow-up (reused process):
  completionMarker = 'COMPLETION:req_1710234567890'
  waitForLog('COMPLETION:req_1710234567890') → not in old stdout → waits for NEW turn
  Agent prints COMPLETION:req_1710234567890 after turn completes → resolves correctly
```

---

## Files Modified

| File | What |
|------|------|
| `cloudflare/sandbox/Dockerfile` | Reverted sandbox runtime to 0.7.8 |
| `cloudflare/package.json` | Pinned `@cloudflare/sandbox` to `"0.7.8"` |
| `cloudflare/sandbox/agent-runner.ts` | `currentRequestId` tracking + `COMPLETION:` sentinel |
| `cloudflare/src/durable-objects/campaign-session.ts` | `completionMarker` in completion handler, alarm, crash handler, persist/restore |

---

## Deploy

```
cd client && npm run build && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy
```

Version: `695d1a7d-7449-4c88-99ed-3f67fa472941`

---

## Testing Plan

1. **Generate**: Live streaming should work — tool steps, text, images all visible in real-time
2. **Follow-up**: Should take 30-60s (fast path), show actual agent work, produce new/modified images
3. **Hooks document**: Should be filled after generation (if agent writes it)
4. **Version check**: `wrangler tail` should NOT show "Container version could not be determined" warning
5. **Multi-tab**: Open two tabs, generate from one, verify both get events (Session 40 feature)

---

## Status

- **Deployed**: Yes (`695d1a7d`)
- **Tested**: Pending
