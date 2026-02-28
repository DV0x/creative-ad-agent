# Session Summary: Debugging Staging Deployment (Container Issue)

> Date: 2026-02-27
> Continues from: `SESSION_SUMMARY_2026-02-27-phase7.md`

## Context

Phase 7 staging deployment was complete — Worker deployed, D1/R2 provisioned, all secrets set, static assets serving. The session notes flagged "frontend rendering issue after Clerk login" as the immediate blocker.

---

## What We Found

### 1. Frontend Rendering — NOT a Bug

The "frontend rendering issue" was a **misunderstanding**, not a bug. The staging D1 database is empty (no data migrated from local SQLite). The app's logic is:

- `campaigns.length === 0` → show **landing page** ("What would you like to create?")
- `campaigns.length > 0` → auto-redirect to **workspace layout** (sidebars + results)

Locally, the app has existing campaigns so it shows the workspace. On staging, the empty DB correctly shows the landing page. Once we created a campaign on staging, the workspace layout appeared.

**Clerk auth is working correctly** — the publishable key IS baked into the client build, user signs in successfully, Clerk user button renders in the top-right, API calls include Bearer tokens and return 200.

### 2. Generation Pipeline — BLOCKED by Container 500

When a user creates a campaign on staging, the generation gets stuck at "Starting...". The WebSocket connects, the campaign is created in D1, but no events ever arrive from the sandbox container.

**Root cause: `sandbox.exec()` returns "500 Internal Server Error"**

The diagnostic endpoint (`/api/test-sandbox`) confirmed:

```json
{
  "getSandbox": "ok",        // ✅ SDK proxy created
  "setEnvVars": "ok",        // ✅ Env vars stored in DO state
  "exec_echo": {             // ❌ Container fails to start
    "error": "SandboxError: HTTP error! status: 500"
  },
  "containerStatus": "getStatus failed"
}
```

Even a simple `sandbox.exec('echo hello')` fails with 500. The Container Durable Object is returning 500 on any request that requires the actual container to be running.

---

## What We Tried (and Eliminated)

| Attempt | Result |
|---------|--------|
| **Version mismatch fix** — Updated Dockerfile from `cloudflare/sandbox:0.7.0` to `0.7.6` to match SDK | Still 500 |
| **Remove SANDBOX_TRANSPORT var** — Removed `"SANDBOX_TRANSPORT": "websocket"` from wrangler.jsonc vars | Error changed from "WebSocket upgrade failed: 500" to "HTTP error! status: 500" (same root cause, different transport) |
| **Remove CMD from Dockerfile** — Removed `CMD ["node", "...pipeline.js"]` that would crash on startup (no PIPELINE_INPUT) | Still 500 |
| **Add R2 credentials to mountBucket** — Added explicit `credentials: { accessKeyId, secretAccessKey }` to `sandbox.mountBucket()` | N/A (exec fails before mountBucket is reached) |
| **Reorder setEnvVars before mountBucket** — SDK docs say setEnvVars should be called first | Done, but exec still fails |

---

## Current State of Files

### Modified (uncommitted) in `cloudflare/`:

**`Dockerfile`** — Updated to:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.6
RUN npm install -g @anthropic-ai/claude-code
COPY server/ /workspace/server/
COPY agent/ /workspace/agent/
WORKDIR /workspace/server
RUN npm install
RUN npx tsc
RUN npm prune --production
WORKDIR /workspace
ENTRYPOINT ["/sandbox"]
# No CMD — execution via sandbox.exec()
```

**`src/sandbox.ts`** — Fixed:
- `setEnvVars()` called before `mountBucket()` (SDK recommendation)
- `mountBucket()` now passes explicit R2 `credentials` (container can't use Worker's R2 binding)
- Added `containerTimeouts` to `getOrCreateSandbox()` (60s instance, 180s port ready)

**`src/index.ts`** — Added:
- `/api/test-sandbox` diagnostic endpoint (authenticated, exercises sandbox step by step)
- Import of `getOrCreateSandbox` for the test endpoint

**`wrangler.jsonc`** — Changed:
- Removed `SANDBOX_TRANSPORT: "websocket"` from both production and staging vars

---

## Theories to Investigate Next

### 1. Container Image Pull Failure
The Container DO might not be able to pull the image from the Cloudflare registry. Possible causes:
- Registry authentication issue
- Image architecture mismatch (the local Docker build is `linux/amd64` but Cloudflare might need `linux/arm64`)
- Image too large or layers timing out

**How to test:** Check Cloudflare Dashboard → Workers → Containers tab for deployment status and logs.

### 2. Container Platform Not Available
Cloudflare Containers is in open beta. The account might need specific enablement or the region might not support containers yet.

**How to test:** Check Cloudflare Dashboard for any container-related warnings. Try deploying a minimal "hello world" container to isolate the issue.

### 3. The `/sandbox` Entrypoint Crash
The base image `cloudflare/sandbox:0.7.6` provides the `/sandbox` binary that starts the internal HTTP API server. If this binary crashes (incompatible architecture, missing libs, etc.), the container would never become ready.

**How to test:** Run the container locally:
```bash
docker build -f cloudflare/Dockerfile -t test-sandbox ../
docker run --rm test-sandbox
# Check if /sandbox starts and listens on port 3000
```

### 4. setEnvVars() Doesn't Actually Start the Container
The SDK docs say "container starts lazily on first operation." But `setEnvVars()` succeeds — this might mean it only stores state in the DO's SQLite without actually starting the container. The real first container operation is `exec()`, and that's where the 500 happens.

**How to test:** Skip `setEnvVars()` in the test endpoint and call `exec()` directly to confirm the error is from container startup, not from env var propagation.

### 5. Durable Object Migration Issue
The migration tag `"v1"` might need updating after changing the container image. Or the DO state might be stale.

**How to test:** Try a fresh sandbox ID (not the same userId) to get a completely new DO instance.

### 6. Network/Port Issue
The container's internal HTTP API on port 3000 might not be accessible from the DO. The `portReadyTimeoutMS` might be hit silently, and the subsequent request gets 500.

**How to test:** Increase timeouts significantly (already staged: 60s instance, 180s port ready) and try again with a fresh sandbox ID.

---

## Staging Infrastructure (unchanged)

| Resource | Value |
|---|---|
| Worker URL | `https://creative-agent-worker-staging.alphasapien17.workers.dev` |
| D1 Database | `creative-agent-db-staging` (`04306cf6-...`) |
| R2 Bucket | `creative-agent-assets-staging` |
| Container Image | `creative-agent-worker-staging-sandbox-staging` (in Cloudflare registry) |
| Secrets | All 7 set (ANTHROPIC_API_KEY, FAL_KEY, CLERK_*, R2_*) |

## Quick Commands

```bash
# Deploy to staging
cd cloudflare && npx wrangler deploy --env staging

# Test sandbox (requires Clerk auth token)
curl -H "Authorization: Bearer <token>" \
  https://creative-agent-worker-staging.alphasapien17.workers.dev/api/test-sandbox

# Stream Worker logs
cd cloudflare && npx wrangler tail --env staging

# Test container locally
docker build -f cloudflare/Dockerfile -t test-sandbox ../
docker run --rm -it test-sandbox /bin/bash
# Then inside: ls /workspace/server/dist/ && node --version

# Check campaigns in staging D1
cd cloudflare && npx wrangler d1 execute creative-agent-db-staging --env staging --command "SELECT * FROM campaigns"
```

## Local Dev Status

Both servers were started during this session and may still be running:
- Backend: `npm run dev` (port 3001) from `server/`
- Frontend: `npm run dev` (port 5173) from `client/`

Local app works correctly with existing campaigns in the workspace view.
