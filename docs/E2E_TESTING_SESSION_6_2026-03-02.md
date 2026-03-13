# E2E Testing Session 6 — 2026-03-02

> Status: **Generate + Follow-Up PASS, reconnect not run**
> Branch: `new-ui`
> Deployed: https://creative-agent.alphasapien17.workers.dev
> Version ID: `b4cfd03f-5a5b-49d5-8b45-507631c5dcbc`

---

## Session Goal

1. Investigate why sandbox containers were still being placed in Hong Kong despite `placement.region` config
2. Fix the IP blocking issue so generations don't fail intermittently
3. Run full end-to-end generation + follow-up tests

---

## Findings

### Sandbox placement is NOT controlled by `placement.region`

The `placement.region: "aws:us-east-1"` in `wrangler.jsonc` only controls **Worker** placement, not the Sandbox container. Internally, `getSandbox()` calls `getContainer()` from `@cloudflare/containers`, which does:

```js
// @cloudflare/containers/dist/lib/utils.js
function getContainer(binding, name) {
    const objectId = binding.idFromName(name);
    return binding.get(objectId);  // No locationHint passed
}
```

The `SandboxOptions` type has no `locationHint` field. There is no way to control sandbox region through the SDK. This has been reported to Cloudflare Discord.

### The `locationHint: 'enam'` on CampaignSession DO doesn't propagate

The CampaignSession DO is hinted to `enam` via `env.CAMPAIGN_SESSION.get(doId, { locationHint: 'enam' })` in `index.ts`. But the Sandbox DO created by `getSandbox()` is a separate DO with its own placement — it doesn't inherit the caller's hint.

### Dashboard shows Hong Kong, but traffic uses US IPs

Cloudflare dashboard shows the container instance in Hong Kong. However, the container's outbound traffic uses Cloudflare's `104.28.x.x` IP range (US). Some subnets work (`104.28.156.x`, `104.28.160.x`, `104.28.161.x`) while others are blocked by Anthropic (`104.28.157.x`). This is an Anthropic-side IP blocklist issue, not a geographic placement issue.

---

## Bugs Fixed

### 1. R2 mount fails on sandbox reuse (`InvalidMountConfigError`)

**Problem**: When a sandbox is reused from a previous generation, `mountBucket()` fails with:
```
InvalidMountConfigError: Mount path "/mnt/r2" is already in use by bucket "creative-agent-assets:/users/anonymous"
```

The old code used `fusermount -u` (filesystem-level unmount), but the Sandbox SDK tracks mounts internally and still considers `/mnt/r2` occupied.

**Fix**: Call `sandbox.unmountBucket('/mnt/r2')` (SDK-level unmount) before remounting. Wrapped in try/catch for the case where nothing is mounted.

```typescript
// Before:
await sandbox.exec('fusermount -u /mnt/r2 2>/dev/null; ...');

// After:
try { await sandbox.unmountBucket('/mnt/r2'); } catch (_) { /* not mounted */ }
await sandbox.exec('rm -rf /mnt/r2; mkdir -p /mnt/r2');
```

### 2. Pre-flight IP retry (new feature)

**Problem**: Sandbox containers intermittently get IPs blocked by Anthropic's API (403). Previously this caused silent generation failures — the SDK would hang after MCP startup.

**Fix**: After mounting R2, run a pre-flight API test from the sandbox. If it returns 403, destroy the sandbox and create a new one with a different ID (up to 3 attempts).

```typescript
const MAX_SANDBOX_RETRIES = 3;
for (let attempt = 1; attempt <= MAX_SANDBOX_RETRIES; attempt++) {
  const sandboxId = attempt === 1
    ? `user-${this.userId}-v2`
    : `user-${this.userId}-v2-${Date.now()}`;

  sandbox = getSandbox(this.env.SANDBOX, sandboxId, { sleepAfter: '10m' });
  // ... mount R2, run net test ...

  if (netOutput.includes('WITH_KEY=200')) break;

  // Blocked — destroy and retry
  if (attempt < MAX_SANDBOX_RETRIES) {
    await sandbox.destroy();
    sandbox = null;
  }
}
```

**Verified working**: Follow-up test hit a 403 on attempt 1 (`104.28.157.199`), auto-retried, got 200 on attempt 2 (`104.28.156.126`).

### 3. Cancel flow fix (from Session 5, included in this deploy)

Changes from Session 5 were already in the codebase but are part of the deployed diff:
- `handleCancel()` is now `async`, updates D1 status immediately
- `await this.handleCancel()` in dispatcher
- `Promise.race` with 5s timeout on `execPromise` after cancel
- Abort signal checks in drain loop idle branches

---

## Test Results

### Full Generation — 4/4 PASS

```
Campaign: campaign_mm8vb2m4ygkx0j
Duration: 274.6s (~4.5 min)
IP: 104.28.160.175 (attempt 1 — no retry needed)

Phases: parse → hooks → art → images
Files: research.md, hooks.md, prompts.md
Images: 2/2 (clay diorama style, ~45s each via fal.ai)
D1 status: complete

PASS: Ack received with campaignId
PASS: At least 1 image generated (got 2)
PASS: Complete event received
PASS: D1 status is complete
```

### Follow-Up / Resume — 8/8 PASS

```
Campaign: campaign_mm8vb2m4ygkx0j (follow-up to above)
Duration: 69.0s
Prompt: "Rewrite just the hook headlines to be shorter and punchier..."

IP retry: attempt 1 → 104.28.157.199 (403, destroyed)
          attempt 2 → 104.28.156.126 (200, proceeding)

SDK resumed from JSONL on R2 (system/init at 47.9s)
Messages: 2 → 4 (user + assistant saved to D1)
D1 status: complete

PASS: Follow-up ack received
PASS: Session ID matches
PASS: Generation completed
PASS: No fatal errors
PASS: D1 status: complete
PASS: New messages saved
PASS: Follow-up user message persisted
PASS: New assistant response persisted
```

**Note on AI behavior**: The SDK resumed conversation context correctly, but the AI couldn't find the hooks file on disk because the pre-flight retry created a **new sandbox** (the original one was destroyed). The hooks file was written to the first sandbox's ephemeral filesystem during generation, not to R2. The AI asked for clarification instead of rewriting. Infrastructure worked; file persistence is the issue.

### Failed Attempts (before fixes)

| Attempt | Issue | Fix |
|---------|-------|-----|
| Pre-hint `.get()` before `getSandbox()` | 500 error — conflicted with internal DO management | Reverted, used `-v2` ID suffix instead |
| Generation with URL in prompt | AI visited fake URL, got error, stopped early | Changed to self-contained prompt |
| Generation with minimal prompt | AI returned short response, 0 images | Used detailed prompt matching previous successes |

---

## Files Modified

### Deployed
- `cloudflare/src/durable-objects/campaign-session.ts` — Pre-flight IP retry, `unmountBucket()` fix, sandbox ID change (+89 lines, -53 lines)

### Test scripts (local only, untracked)
- `test-e2e-generate.mjs` — New: full generation test
- `test-location.mjs` — New: quick sandbox IP check

---

## D1 State After Session

| Campaign ID | Status | SDK Session | Notes |
|------------|--------|-------------|-------|
| `campaign_mm8vb2m4ygkx0j` | complete | `dde3fe01...` | Full gen + follow-up (PASS) |
| `campaign_mm8v85pl07g4um` | complete | `eaeca066...` | Gen with URL prompt (AI stopped early) |
| `campaign_mm8v6pgtw5yoxq` | complete | `288c560b...` | Gen with blocked IP (0 images) |
| `campaign_mm8uu9zc11amey` | complete | `ed3c9fe2...` | Gen with blocked IP (0 images) |
| `campaign_mm8uo8hoiqmrcy` | error | null | Pre-hint 500 error |
| `campaign_mm8ulsv8zes0tt` | error | null | Pre-hint 500 error |

---

## Deployed Version

**Version**: `b4cfd03f-5a5b-49d5-8b45-507631c5dcbc`

Changes deployed:
- Pre-flight IP retry (3 attempts max)
- `unmountBucket()` before `mountBucket()` for sandbox reuse
- Sandbox ID changed to `user-{userId}-v2` (new DO, avoids stale HK-placed DO)
- Cancel flow fix from Session 5
- Streamlined net test (removed BAD_KEY test, simplified output)

---

## Next Session: What to Do

### 1. Fix follow-up file persistence

The core issue: agent output files (research.md, hooks.md, prompts.md) are written to the sandbox's local filesystem (`/app/agent/files/`), which is ephemeral. When the sandbox is destroyed (IP retry) or sleeps/wakes, these files are lost. The SDK resume restores conversation context from JSONL on R2, but the AI can't find files it wrote previously.

**Options**:
- **Option A**: Write agent output files to R2 (`/mnt/r2/agent-files/`) instead of local disk. Requires changing the orchestrator prompt or agent config to use R2 paths.
- **Option B**: Pre-populate sandbox from D1 before follow-up. The file content is saved in D1 (`campaign_files` table). Before starting agent-runner, write the files back to disk from D1.
- **Option C**: Use Sandbox SDK `createBackup()` / `restoreBackup()` to snapshot the filesystem after generation and restore it before follow-up.

Option B is simplest — the data is already in D1, just needs to be written to disk before the follow-up starts.

### 2. Run reconnect test

```bash
node test-e2e-reconnect.mjs
```

Still not tested. Should work with the current infrastructure since it doesn't depend on file persistence.

### 3. Remove debug diagnostics

The pre-flight net test adds ~5-8s overhead per generation. Consider:
- Keep the pre-flight retry (it's essential for reliability)
- Remove the DO-level API key test (redundant — pre-flight covers it)
- Remove verbose status messages (or gate behind a debug flag)

### 4. Consider: Stable sandbox ID for reuse

Currently, retries use `user-{userId}-v2-{Date.now()}` which creates a throwaway sandbox. If the first sandbox's IP is good, it gets reused across generations (fast mount, no cold start). But if a retry happens, the new sandbox is never reused (unique timestamp ID).

Consider: keep a small pool of sandbox IDs (e.g., `user-{userId}-v2`, `user-{userId}-v3`, `user-{userId}-v4`) and cycle through them on retry. This way retried sandboxes can still be reused on subsequent generations.

### 5. Post on Cloudflare Discord

Draft message prepared for requesting `locationHint` support in `getSandbox()`. Post and track response.

### 6. Connect React client

After all E2E tests pass, connect the React frontend to the deployed Worker and test the full UI flow.
