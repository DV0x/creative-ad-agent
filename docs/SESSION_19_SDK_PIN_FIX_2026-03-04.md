# Session 19: SDK Version Pin Fix

**Date:** 2026-03-04
**Branch:** `new-ui`
**Deployed version:** `9f3f035f`

## Problem

After deploying Session 18 (recovery layer), the agent stopped running in the sandbox. Two campaigns created today both had `sdk_session_id: null` and status `incomplete` — meaning the agent-runner crashed immediately on startup, producing zero SDK output.

## Root Cause

The sandbox `package.json` used `"@anthropic-ai/claude-agent-sdk": "latest"` with no lockfile in the Docker build. When Session 18 was deployed with `docker builder prune -af` (fresh build), `npm install` pulled SDK version **0.2.68** — published just hours earlier (2026-03-04 at 09:52 UTC). This version bundles Claude Code CLI 2.1.68, which appears to have a startup issue in the container environment.

Previous working deployments (Sessions 15-17) used SDK **0.2.64** (published 2026-03-03), which bundles CLI 2.1.64.

**Timeline:**
| When | What |
|------|------|
| March 3 | SDK 0.2.64 released — used by Session 17 deploy (worked) |
| March 4, 00:49 UTC | SDK 0.2.66 released |
| March 4, 09:52 UTC | SDK 0.2.68 released (breaking in container) |
| March 4, ~13:00 UTC | Session 18 deployed — fresh Docker build pulled 0.2.68 |
| March 4, 13:13 UTC | First failed campaign — agent produces zero output |
| March 4, 13:49 UTC | Second failed campaign — same |

## Fix

1. **Pinned SDK version** in `cloudflare/sandbox/package.json`: `"@anthropic-ai/claude-agent-sdk": "0.2.64"`
2. **Pinned Claude Code CLI** in `cloudflare/sandbox/Dockerfile`: `npm install -g @anthropic-ai/claude-code@2.1.64`
3. **Added lockfile to Docker build**: `COPY package.json package-lock.json ./` + `npm ci --production`

## Files Changed

| File | Change |
|------|--------|
| `cloudflare/sandbox/package.json` | SDK pinned from `"latest"` → `"0.2.64"` |
| `cloudflare/sandbox/Dockerfile` | CLI pinned from `@latest` → `@2.1.64`, copy lockfile, use `npm ci` |
| `cloudflare/sandbox/package-lock.json` | Generated with pinned versions |

## Investigation Notes

- TypeScript compiles fine — no code-level errors
- SDK 0.2.66 and 0.2.68 have identical `sdk.mjs` (385626 bytes) — only the bundled CLI changed
- Zod v4 compatibility confirmed — `createSdkMcpServer` and `tool()` work with Zod 4.3.6
- The `query()` function spawns `node cli.js` as a subprocess. If that subprocess crashes (new CLI version issue), the exec returns with no output → `generationCompleted = false` → status `incomplete`

## Design Lesson

**Never use `"latest"` for production dependencies in Docker builds without a lockfile.** Every `docker builder prune` + rebuild can silently pull a different version. Pin exact versions and commit the lockfile.

## Testing Plan (NEXT SESSION)

### Test 1: Normal generation end-to-end
1. Open https://creative-agent.alphasapien17.workers.dev
2. Sign in with Clerk
3. Submit a generation prompt (e.g., "create a single photorealistic ad for a luxury hotel")
4. Verify: agent starts, thinking blocks appear, images generate, status becomes `complete`
5. Verify: `sdk_session_id` is populated in D1

### Test 2: Recovery layer (Session 18 feature)
1. Start a generation, wait for images to start generating
2. Force-kill the DO by redeploying mid-generation
3. Wait ~2 min for container to finish
4. Reload client — should auto-detect incomplete campaign, call `/recover`
5. Verify images appear, status becomes `complete`

### Test 3: Follow-up works
1. After Test 1 completes, send a follow-up message
2. Verify agent resumes with SDK session, produces new output

### Test 4: Manual recovery endpoint
```bash
curl -X POST https://creative-agent.alphasapien17.workers.dev/api/campaigns/{ID}/recover \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" | python3 -m json.tool
```

## D1 State After Deploy

```sql
-- 3 campaigns, all from before fix:
-- campaign_mmc3f0qtj1k9ay: incomplete (13:49, no sdk_session_id)
-- campaign_mmc24t5lchon30: incomplete (13:13, no sdk_session_id)
-- campaign_mmbn023teukodd: incomplete (06:09, has sdk_session_id from Session 17)
```

## Status

- [x] Root cause identified (SDK 0.2.68 published today)
- [x] Versions pinned (SDK 0.2.64, CLI 2.1.64)
- [x] Lockfile added to Docker build
- [x] Deployed (`9f3f035f`)
- [x] Health check passing
- [ ] Test 1: Normal generation
- [ ] Test 2: Recovery after DO crash
- [ ] Test 3: Follow-up
- [ ] Test 4: Manual recovery endpoint
