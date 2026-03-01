# Phase 4b: assetFileIds, Per-User R2 Prefix, Local Dev Support

> Implemented: 2026-03-01
> Status: Code complete, pending testing
> Branch: `new-ui`

---

## What Was Built

Three deferred items from Phase 4's sandbox deployment.

### Item 1: Per-User R2 Prefix Isolation

**Problem:** `mountBucket()` exposed the entire R2 bucket. Sandbox wrote to `/mnt/r2/images/{sessionId}/` → R2 key `images/{sessionId}/...`, but the Worker serves from `users/{userId}/images/...` → 404 mismatch.

**Fix:** One-line change — added `prefix: \`users/${this.userId}\`` to `mountBucket()`. The FUSE mount now scopes transparently:
- `/mnt/r2/images/{sessionId}/` → R2 key `users/{userId}/images/{sessionId}/...`
- Matches Worker image serving path and architecture doc's R2 layout

### Item 2: assetFileIds Resolution

**Problem:** Client sends `assetFileIds?: string[]` with generate/follow_up messages. The DO ignored them entirely — no reference image support.

**Fix:**
- WS dispatch passes `message.assetFileIds` to `handleGenerate()` and `handleFollowUp()`
- New `resolveAssetUrls()` method: D1 lookup → R2 read → fal.ai storage upload → public URL
- Reference URLs prepended to prompt as `## Reference Image URLs (pass these as referenceImageUrls to generate_ad_images)`
- Same format as Express server — MCP tool already handles `referenceImageUrls` for edit mode

### Item 3: Local Dev Support

**Problem:** `runGeneration()` always called `getSandbox()` which fails with `wrangler dev`.

**Fix:**
- `AI_BACKEND` env var: when `"local"`, bypasses sandbox entirely
- `runGenerationLocal()` dynamically imports `local-ai-runner.ts`
- Local runner runs Claude Agent SDK `query()` in-process with same orchestrator prompt and MCP server
- Yields SDK messages through same `processSDKMessage()` path — client gets identical events
- Images save to `./generated-images/` locally

---

## Files Modified (4)

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | `prefix` on mountBucket, `resolveAssetUrls()`, assetFileIds threading, `runGenerationLocal()`, AI_BACKEND check, `fal` import |
| `cloudflare/src/env.d.ts` | Added `AI_BACKEND?: string` |
| `cloudflare/wrangler.jsonc` | Added `env.dev` section with `AI_BACKEND = "local"` |
| `cloudflare/package.json` | Added `@fal-ai/client` dep, `@anthropic-ai/claude-agent-sdk` + `zod` devDeps |

## Files Created (1)

| File | Purpose |
|------|---------|
| `cloudflare/src/lib/local-ai-runner.ts` | In-process SDK runner for local dev. Self-contained with orchestrator prompt and compact MCP server. `@ts-nocheck` (uses Node APIs, works with `nodejs_compat`) |

---

## Testing Plan

### Prerequisites

```bash
cd cloudflare && npm install
npx tsc --noEmit  # should pass clean
```

### Test 1: R2 Prefix (Production)

Deploy and run a generation:

```bash
wrangler deploy
```

Connect to `wss://creative-agent.alphasapien17.workers.dev/ws?token=<JWT>` and send:
```json
{ "type": "generate", "prompt": "Create conversion ads for https://nike.com", "sessionId": "test-r2-prefix" }
```

**Verify:**
- R2 bucket contains keys at `users/{userId}/images/test-r2-prefix/...` (not `images/test-r2-prefix/...`)
- Images render in client UI (Worker serves from `users/{userId}/images/...`)
- Check R2 via dashboard or CLI:
  ```bash
  wrangler r2 object list creative-agent-assets --prefix "users/"
  ```

### Test 2: assetFileIds (Production)

1. Upload an image asset via the client UI (Assets panel)
2. Note the file ID from the upload response
3. Send a generate with assetFileIds:
   ```json
   {
     "type": "generate",
     "prompt": "Create conversion ads for https://nike.com in this style",
     "sessionId": "test-assets",
     "assetFileIds": ["file-xxxxxxx"]
   }
   ```

**Verify:**
- DO logs show `Resolved asset: {name} → https://fal.ai/...` (fal.ai storage URL)
- Prompt received by SDK includes `## Reference Image URLs` section
- MCP tool uses edit endpoint (check sandbox logs for `Mode: edit (with references)`)
- Generated images reflect reference style

Also test follow_up with assetFileIds:
```json
{
  "type": "follow_up",
  "prompt": "make them warmer",
  "campaignId": "<id>",
  "assetFileIds": ["file-xxxxxxx"]
}
```

### Test 3: Local Dev (wrangler dev)

```bash
cd cloudflare
wrangler dev --env dev
```

Connect to `ws://localhost:8787/ws` (auth may need adjusting for local dev) and send:
```json
{ "type": "generate", "prompt": "Create conversion ads for https://nike.com", "sessionId": "test-local" }
```

**Verify:**
- No sandbox/container errors (SDK runs in-process)
- Events stream to client: `ack` → `phase:parse` → `phase:research` → ... → `complete`
- Images saved to `./generated-images/test-local/` locally
- D1 records created (campaigns, messages, images) in `.wrangler/state/`

### Test 4: Cancel During Local Dev

Start a generation via local dev, then send:
```json
{ "type": "cancel" }
```

**Verify:**
- Generation stops, campaign status set to `cancelled`
- No orphaned processes

### Test 5: Follow-up Resume (Both Environments)

After a completed generation:
```json
{ "type": "follow_up", "prompt": "make them blue", "campaignId": "<id>" }
```

**Verify:**
- SDK resumes from saved session ID
- New images appended (imageIndex continues from previous count)
- Campaign status returns to `complete`

---

## Known Considerations

- **Local dev auth**: `wrangler dev` may need a mock auth setup or dev token for WebSocket connections
- **Local dev MCP**: The MCP server runs in-process. The Claude Agent SDK needs to be able to spawn subprocesses for skills/agents — verify `nodejs_compat` supports this in `wrangler dev`
- **`@ts-nocheck`**: `local-ai-runner.ts` skips type checking because it uses Node.js APIs (`fs`, `path`, `Buffer`, `process`) that conflict with `@cloudflare/workers-types`. Runtime works fine with `nodejs_compat` flag

---

## Outstanding Items (from FUTURE_REVIEW.md)

These are unrelated to Phase 4b but remain open:

1. **Campaign ID window** — Brief 404 risk between local ID and server ack
2. **Dual image event path** — Potential duplicate DB rows (Express server only, not DO)
3. **Image regeneration scaling** — Session resume replays full history; needs stateless image ops
4. **Batch download** — Toolbar button has no onClick handler
5. **Batch operations** — Selection UI works but no bulk API exists
