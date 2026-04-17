# Session 58 — Production Cold Start, Container Stability & Environment Setup

**Date:** 2026-03-24
**Branch:** `new-ui`
**Commit:** `68a8020`
**Deployed:** Both staging and production

---

## Problems Investigated

### 1. Production cold start: 16 minutes (should be ~2 min)
- **Root cause:** `HOME: '/mnt/r2'` in `startProcess()` env — the Claude CLI wrote all config, session, npm cache, and debug files through the slow s3fs FUSE mount to R2
- Every file operation (stat, mkdir, readdir, write) was an HTTP round-trip to R2 (50-200ms each)
- Hundreds of file operations during CLI startup accumulated to 16 minutes
- Staging appeared fine because the existing R2 bucket had cached `.claude/` directories from 38 previous campaigns

### 2. Container crashes mid-generation ("Network connection lost")
- **Root cause:** `@cloudflare/sandbox` SDK v0.7.8 was 11 versions behind (latest: 0.7.19)
- Specific bug: internal streaming controller closed prematurely → `TypeError: Invalid state: Controller is already closed`
- The platform then SIGTERM'd the container (exit code 0, not OOM)
- Production crashed at 2 min into generation, staging crashed at 15 seconds
- Both environments had the same SDK bug — staging wasn't "working fine," it was also crashing

### 3. Images not showing after successful generation
- **Root cause:** fal.ai account ran out of credits
- MCP tool (`nano-banana-mcp.ts`) caught the error silently — only wrote to stderr (123 chars), invisible in `wrangler tail`
- Agent continued without images, marked campaign as `complete`

---

## Fixes Applied

| Fix | File | Change |
|-----|------|--------|
| HOME to local disk | `campaign-session.ts:1261` | `HOME: '/mnt/r2'` → `HOME: '/root'` |
| SDK upgrade | `cloudflare/package.json` | `@cloudflare/sandbox` 0.7.8 → 0.7.19 |
| Container runtime upgrade | `sandbox/Dockerfile` | `cloudflare/sandbox:0.7.8` → `cloudflare/sandbox:0.7.19` |
| Dynamic R2 bucket name | `campaign-session.ts:1130` | `mountBucket('creative-agent-assets')` → `mountBucket(this.env.R2_BUCKET_NAME)` |
| R2_BUCKET_NAME env var | `env.d.ts`, `wrangler.jsonc` | Added per-environment variable |
| Staging+production envs | `wrangler.jsonc` | Added `env.staging` and `env.production` blocks with separate D1/R2/DO/containers |
| Client build scripts | `client/package.json` | Added `build:staging` and `build:production` |
| Removed cleanAuthCache | `campaign-session.ts` | Deleted workaround for CLI writing auth to R2 (no longer needed) |
| TypeScript build fix | `sandbox/tsconfig.json` | Added `"types": ["node"]` for clean Docker builds |
| Image error visibility | `nano-banana-mcp.ts:302-308` | MCP image errors now write structured trace to stdout (visible in `wrangler tail`) |

---

## Performance Results

| Metric | Before | After |
|--------|--------|-------|
| Cold start (CLI boot) | 16 minutes | ~6 seconds |
| Container stability | Crashed at 15s-2min | Stable (no crashes) |
| End-to-end generation | 22 min (or crash) | **2.5 minutes** |
| Follow-up (warm) | Not tested this session | Expected 30-60s |

---

## Deploy Commands

```bash
# Production
cd client && npm run build:production
cd ../cloudflare && docker logout registry.cloudflare.com; docker builder prune -af; npx wrangler deploy --env production

# Staging
cd client && npm run build:staging
cd ../cloudflare && docker logout registry.cloudflare.com; docker builder prune -af; npx wrangler deploy --env staging
```

---

## Current Deployment State

| | Staging | Production |
|---|---|---|
| **URL** | `creative-agent-staging.alphasapien17.workers.dev` | `app.creativemachines.xyz` |
| **Version** | `24fbfaaf` | `9734c159` |
| **SDK** | @cloudflare/sandbox 0.7.19 | @cloudflare/sandbox 0.7.19 |
| **HOME** | `/root` | `/root` |
| **Status** | Deployed, not yet tested | Verified working (generation + follow-up + images) |

---

## Data Cleanup Done

- **Production D1:** Wiped all users except `user_3BLzdow2LAiyPvHIrKr41FBYDqI` (chakra5027@gmail.com)
- **Production R2:** Deleted R2 objects for 2 other users (61 + 1 objects)
- **Staging D1:** Wiped all users except `user_3ANzBpk1WdE1QZOshOLhHK8EAfI` (chakra5027@gmail.com)
- **Staging R2:** Deleted R2 objects for 2 other users (63 + 17 objects)
- **Clerk accounts:** Other users still exist in Clerk dashboard — delete manually if needed

---

## Testing Pending

### Staging (not yet tested with new code)
- [ ] Fresh generation on staging — verify cold start is fast and container is stable
- [ ] Image generation on staging — verify fal.ai works (credits permitting)
- [ ] Follow-up on staging — verify warm container fast path

### Production (partially tested)
- [ ] Fresh generation with fal.ai credits — verify images render in client
- [ ] Follow-up after page refresh — verify D1 hydration + messages visible
- [ ] "New Campaign from Existing" flow — verify research copy + fresh hooks/images
- [ ] Multi-tab — verify broadcast works across tabs
- [ ] Cancel mid-generation — verify cleanup works
- [ ] Different user login — verify per-user isolation

### Error handling
- [ ] Trigger fal.ai error (e.g., invalid prompt) — verify error appears in `wrangler tail` stdout as structured trace
- [ ] Container crash recovery — verify alarm detects dead agent and marks campaign incomplete

### Performance
- [ ] Measure warm follow-up time (expected 30-60s)
- [ ] Measure cold start with warm container (agent-runner already alive, new campaign)
- [ ] Verify `sleepAfter: '2h'` keeps container alive between sessions

---

## Key Learnings

1. **Never set HOME to a FUSE mount** — local disk for CLI config, FUSE only for persistent data (images)
2. **Keep @cloudflare/sandbox pinned to latest** — the platform evolves server-side, old SDK versions break. Check npm regularly
3. **The "Container version could not be determined" warning** appears even with matching versions — it's the container runtime's version reporting, not an actual mismatch
4. **MCP tool errors must surface to stdout** — stderr is invisible in wrangler tail. Always write errors to stdout as structured JSON traces
5. **Staging "working" can mask real bugs** — staging worked because slow FUSE I/O accidentally throttled the data rate below the SDK bug threshold
6. **`docker builder prune -af` before every deploy** — stale cached layers cause wrangler to skip pushing the image

---

## Files Changed (this session)

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | HOME=/root, dynamic R2 bucket, removed cleanAuthCache |
| `cloudflare/package.json` | @cloudflare/sandbox 0.7.19 |
| `cloudflare/package-lock.json` | Updated lockfile |
| `cloudflare/sandbox/Dockerfile` | sandbox runtime 0.7.19 |
| `cloudflare/sandbox/nano-banana-mcp.ts` | Image error logging to stdout |
| `cloudflare/sandbox/tsconfig.json` | Added types:["node"] |
| `cloudflare/src/env.d.ts` | Added R2_BUCKET_NAME |
| `cloudflare/wrangler.jsonc` | Staging + production environment blocks |
| `client/package.json` | build:staging + build:production scripts |
