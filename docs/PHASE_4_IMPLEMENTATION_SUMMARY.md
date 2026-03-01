# Phase 4: Sandbox Container — Implementation Summary

> Implemented: 2026-03-01
> Status: Deployed, pending end-to-end testing
> Deployed URL: https://creative-agent.alphasapien17.workers.dev

---

## What Was Built

Phase 4 replaced the stubbed `runGeneration()` method in the CampaignSession Durable Object with actual AI execution via Cloudflare Sandbox containers. The sandbox runs the Claude Agent SDK inside a Docker container, streams NDJSON messages back to the DO, which parses them in real-time and emits WebSocket events to the client.

### Architecture

```
Client (React)
  │ WebSocket
  ▼
Worker (src/index.ts)
  │ Routes /ws to DO
  ▼
CampaignSession DO
  │ getSandbox() → mountBucket() → exec()
  ▼
Sandbox Container (Docker)
  ├── agent-runner.ts — SDK query() → NDJSON stdout
  ├── orchestrator-prompt.ts — System prompt
  ├── nano-banana-mcp.ts — fal.ai image generation
  └── agent/ — Skills + agent definitions
        ├── .claude/agents/research.md
        └── .claude/skills/hook-methodology/, art-style/
```

**Data flow:**
1. DO calls `sandbox.exec('npx tsx /app/agent-runner.ts')` with streaming
2. `onOutput` callback parses JSON lines into a `messageQueue`
3. Concurrent drain loop calls `processSDKMessage()` for each message
4. `processSDKMessage` emits WS events (real-time) AND writes to D1 (persistence)
5. Images are saved to R2 via FUSE mount at `/mnt/r2/images/`

---

## Files Created (6)

| File | Purpose |
|------|---------|
| `cloudflare/sandbox/Dockerfile` | `node:22-slim` + sandbox runtime from `cloudflare/sandbox:0.7.8` + Claude CLI + agent ecosystem |
| `cloudflare/sandbox/package.json` | `claude-agent-sdk`, `@fal-ai/client`, `tsx`, `zod@^4` |
| `cloudflare/sandbox/agent-runner.ts` | Entry point: SDK `query()` → NDJSON stdout, with resume fallback |
| `cloudflare/sandbox/orchestrator-prompt.ts` | Verbatim copy from `server/lib/orchestrator-prompt.ts` |
| `cloudflare/sandbox/nano-banana-mcp.ts` | Port from `server/lib/nano-banana-mcp.ts` (removed imageEvents, uses R2 mount for output) |
| `cloudflare/sandbox/.gitignore` | Excludes `agent/` (copied at build time) and `node_modules/` |

### Key porting changes (nano-banana-mcp.ts)

- Removed `import { imageEvents }` and all `imageEvents.emit()` calls (DO parses images from sandbox stdout instead)
- Removed `__filename`/`__dirname` declarations (not needed)
- Changed `ensureOutputDirectory()` to use `process.env.IMAGE_OUTPUT_DIR || '/mnt/r2/images'` instead of `path.resolve(__dirname, ...)`

---

## Files Modified (5)

| File | Changes |
|------|---------|
| `cloudflare/wrangler.jsonc` | Added `containers` section (Sandbox, standard-1, max 10), SANDBOX DO binding, v2 migration |
| `cloudflare/src/env.d.ts` | Added `SANDBOX: DurableObjectNamespace<Sandbox>`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| `cloudflare/package.json` | Added `@cloudflare/sandbox` dependency |
| `cloudflare/src/index.ts` | Added `export { Sandbox } from '@cloudflare/sandbox'` re-export |
| `cloudflare/src/durable-objects/campaign-session.ts` | Replaced stub with full sandbox execution (see below) |

### campaign-session.ts changes

- **Added import**: `import { getSandbox } from '@cloudflare/sandbox'`
- **Added field**: `private sandbox: any = null`
- **`runGeneration()`**: New signature `(prompt, sessionId, sdkSessionId?)`. Full implementation:
  - Gets/creates sandbox per user (`getSandbox(env.SANDBOX, 'user-{userId}')`)
  - Mounts R2 bucket via S3-compatible FUSE (`sandbox.mountBucket()`)
  - Starts `agent-runner.ts` with streaming (`sandbox.exec()` with `onOutput`)
  - Concurrent drain loop processes messages as they arrive
  - Handles complete/incomplete/cancelled/error states with D1 persistence
  - Cleanup in `finally`: `isGenerating = false`, `abortController = null`, `sandbox = null`
- **`handleCancel()`**: Added `sandbox.destroy()` for immediate container termination
- **`handleFollowUp()`**: Passes `sdkSessionId` to `runGeneration()` for resume support
- **`handleGenerate()`**: Removed redundant try/finally (runGeneration handles its own cleanup)

---

## Cloudflare Resources

### Worker
- **Name**: `creative-agent`
- **URL**: https://creative-agent.alphasapien17.workers.dev

### Bindings
| Binding | Type | Resource |
|---------|------|----------|
| `DB` | D1 | `creative-agent-db` |
| `R2_BUCKET` | R2 | `creative-agent-assets` |
| `CAMPAIGN_SESSION` | Durable Object | `CampaignSession` |
| `SANDBOX` | Durable Object | `Sandbox` (container) |

### Secrets (6)
| Secret | Source |
|--------|--------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `FAL_KEY` | fal.ai API key |
| `CLERK_SECRET_KEY` | Clerk auth |
| `R2_ACCESS_KEY_ID` | R2 S3-compatible access key |
| `R2_SECRET_ACCESS_KEY` | R2 S3-compatible secret |
| `CF_ACCOUNT_ID` | Cloudflare account ID |

### Container Application
- **Name**: `creative-agent-sandbox`
- **Instance type**: `standard-1` (4GB RAM, 2 vCPU)
- **Max instances**: 10
- **Base image**: `node:22-slim` + `cloudflare/sandbox:0.7.8` runtime
- **Entrypoint**: `/sandbox` (Cloudflare container runtime)

### DO Migrations
- **v1**: `new_classes: ["CampaignSession"]`
- **v2**: `new_sqlite_classes: ["Sandbox"]`

---

## Issues Resolved During Implementation

1. **Dockerfile base image**: `docker.io/cloudflare/sandbox:latest` doesn't exist. Fixed: use `node:22-slim` + `COPY --from=cloudflare/sandbox:0.7.8 /container-server/sandbox /sandbox`

2. **Migration conflict**: Couldn't add `CampaignSession` to `new_sqlite_classes` in v1 (already deployed as `new_classes`). Fixed: added v2 migration with `new_sqlite_classes: ["Sandbox"]`

3. **Zod version**: `claude-agent-sdk` requires `zod@^4.0.0` as peer dep. Fixed: updated sandbox `package.json` from `^3.0.0` to `^4.0.0`

4. **Docker build context**: `agent/` directory lives at project root, not in `cloudflare/sandbox/`. Fixed: copy `agent/` into sandbox dir before build, added `.gitignore` to avoid committing the duplicate

5. **`mountBucket()` API**: Plan assumed it takes an R2 binding. Actual API requires S3-compatible endpoint + credentials. Fixed: added `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` secrets, use `https://{CF_ACCOUNT_ID}.r2.cloudflarestorage.com` endpoint

6. **Instance type naming**: `"standard"` renamed to `"standard-1"` in current wrangler. Fixed in `wrangler.jsonc`

7. **Stale container apps**: Previous deployments left orphaned container applications. Cleaned up 4 stale apps via Cloudflare API

---

## Account Cleanup (also done this session)

Deleted unused workers and associated storage:
- Workers: `admitra-ai`, `creative-agent-worker`, `creative-agent-worker-staging`, `prototype`
- D1: `creative-agent-db-staging`
- R2: `creative-agent-assets-staging` (39 objects purged)
- Container apps: `admitra-ai-admitracontainer`, `creative-agent-worker-sandbox`, `creative-agent-worker-staging-sandbox-staging`, stale `creative-agent-sandbox`

---

## Testing Plan (Next Session)

### 1. Health check
```bash
curl https://creative-agent.alphasapien17.workers.dev/health
```

### 2. WebSocket test
Connect to `wss://creative-agent.alphasapien17.workers.dev/ws?token=<JWT>` and send:
```json
{ "type": "generate", "prompt": "Create conversion ads for https://nike.com", "sessionId": "test-1" }
```

Expected events: `ack` → `phase:parse` → `phase:research` → `phase:hooks` → `phase:art` → `phase:images` → `image` events → `complete`

### 3. Cancel test
Start a generation, then send `{ "type": "cancel" }`. Expect sandbox destroyed, campaign status `cancelled`.

### 4. Follow-up test
```json
{ "type": "follow_up", "prompt": "make them blue", "campaignId": "<id>" }
```
Expect SDK resume from R2 JSONL, new images appended.

### 5. REST API verification
```bash
curl -H "Authorization: Bearer <token>" https://creative-agent.alphasapien17.workers.dev/api/campaigns
```

### 6. D1 verification
Check campaigns table has status `complete`, `sdk_session_id` populated, images and files saved.

---

## Deferred (Phase 4b)

- `assetFileIds` parameter in generate/follow_up — reference image uploads not yet wired
- Per-user R2 prefix isolation (`prefix: '/users/${userId}/'`) — currently uses sandbox-level isolation
- Local dev support — R2 FUSE mount doesn't work with `wrangler dev`
