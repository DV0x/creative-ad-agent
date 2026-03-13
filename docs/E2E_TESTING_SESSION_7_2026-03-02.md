# E2E Testing Session 7 — 2026-03-02

> Status: **All 6 E2E tests PASS**
> Branch: `new-ui`
> Deployed: https://creative-agent.alphasapien17.workers.dev
> Version ID: `f0decd77-2ad5-4da3-bb2d-f8d9aede7213`

---

## Session Goal

1. Fix follow-up file persistence (agent can't find files after sandbox recreate)
2. Run the reconnect/subscribe test (last untested flow)
3. Verify all 6 E2E tests pass

---

## Bug Fixed: Follow-Up File Persistence

### Problem

During a follow-up, the SDK resumes conversation context from JSONL on R2, but the agent can't find the files it wrote during the original generation (research.md, hooks.md, prompts.json). These files live on the sandbox's ephemeral disk at `/app/agent/files/` — they're lost when the sandbox is destroyed (IP retry), sleeps, or a new sandbox is created.

In Session 6, the follow-up test passed infrastructure-wise, but the AI asked for clarification instead of rewriting hooks because it couldn't find the hooks file.

### Root Cause

Agent output files are written to the sandbox's local filesystem:
- `/app/agent/files/research/{brand}_research.md`
- `/app/agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md`
- `/app/agent/files/creatives/{brand}_prompts.json`

The sandbox is ephemeral. But the file **content** is already saved to D1 (`campaign_files` table) by `processSDKMessage()` when it detects `Write` tool calls.

### Fix: Hydrate from D1 before follow-up

Added ~30 lines to `campaign-session.ts` in `runGeneration()`, right after sandbox setup and before starting agent-runner:

```typescript
if (sdkSessionId && this.campaignId) {
  const files = await db.getCampaignFiles(this.env.DB, this.campaignId);
  if (files.length > 0) {
    await sandbox.exec('mkdir -p /app/agent/files/research /app/agent/files/creatives /app/agent/.claude/skills/hook-methodology/hook-bank');

    const FILE_PATHS = {
      research: '/app/agent/files/research/restored_research.md',
      hooks: '/app/agent/.claude/skills/hook-methodology/hook-bank/restored_hooks.md',
      prompts: '/app/agent/files/creatives/restored_prompts.json',
    };

    for (const file of files) {
      const targetPath = FILE_PATHS[file.file_type];
      if (!targetPath || !file.content) continue;
      await sandbox.exec(
        `node -e "require('fs').writeFileSync(process.env.TARGET_PATH, process.env.FILE_CONTENT)"`,
        { env: { TARGET_PATH: targetPath, FILE_CONTENT: file.content } }
      );
    }
  }
}
```

### Why this approach (not R2 FUSE or symlinks)

- **D1 is the source of truth** — file content is already there, structured and queryable
- **No FUSE dependency** — files live on local disk where the agent expects them
- **Deterministic** — sandbox starts with known state regardless of how it was created
- **Standard pattern** — stateless containers hydrate from data store on startup (same as K8s init containers, Lambda layers)

---

## Test Results

### All 6 E2E Tests — PASS

| # | Test | Result | Duration | Notes |
|---|------|--------|----------|-------|
| 1 | REST API | **PASS** | ~5s | Session 5 |
| 2 | Image Serving | **PASS** | ~3s | Session 5 |
| 3 | Cancel | **PASS** | ~50s | Session 5 |
| 4 | Follow-Up / Resume | **PASS** | 83.7s | This session — with file hydration |
| 5 | Reconnect / Subscribe | **PASS** | 334.8s | This session — first time tested |
| 6 | Full Generation | **PASS** | 274.6s | Session 6 |

### Follow-Up Test Details

```
Campaign: campaign_mm8vb2m4ygkx0j (follow-up to Session 6 generation)
Duration: 83.7s
Prompt: "Rewrite just the hook headlines to be shorter and punchier..."

Hydrated 3 files from D1 at 12.0s
Agent used Glob → Read → 6x Edit to rewrite each hook headline
AI response: "Hooks updated! All 6 headlines rewritten with punchy one-word power openers"

8/8 PASS:
  PASS: Follow-up ack received
  PASS: Session ID matches
  PASS: Generation completed
  PASS: No fatal errors
  PASS: D1 status: complete
  PASS: New messages saved: 4 -> 6
  PASS: Follow-up user message persisted
  PASS: New assistant response persisted
```

### Reconnect Test Details

```
Session: test-reconnect-1772445181172
Duration: 334.8s

IP retry: attempt 1 → 104.28.157.200 (403, destroyed)
         attempt 2 → 104.28.156.133 (200, proceeding)

WS#1: Connected, started generation, received 24 events
Disconnected at 45.9s (lastEventId: 4)
WS#2: Reconnected at 50.9s, sent subscribe
Generation continued on WS#2: research → hooks → art → images
2 images generated, full pipeline completed

7/7 PASS:
  PASS: WS#1 received events: 24
  PASS: Had buffered events at disconnect (lastEventId: 4)
  PASS: WS#2 received subscribed confirmation
  PASS: WS#2 replayed events: 0
  PASS: WS#2 received new events after reconnect: 125
  PASS: Generation completed on WS#2
  PASS: No fatal errors
```

---

## Files Modified

### Deployed
- `cloudflare/src/durable-objects/campaign-session.ts` — Added D1 file hydration before follow-up (+25 lines)

---

## Auth Status: Currently Bypassed

**All E2E tests run without JWT auth.** The deployed Worker has no `CLERK_SECRET_KEY` secret set, so auth falls through to `'anonymous'` everywhere:

```typescript
// auth.ts — every auth function has this guard:
if (!env.CLERK_SECRET_KEY || !token) return 'anonymous';
```

This means:
- **WebSocket**: No token needed — `verifyWebSocketToken()` returns `'anonymous'`
- **REST API**: No Bearer token needed — `authenticateRequest()` returns `'anonymous'`
- **All data shares one user**: Every request uses `userId = 'anonymous'`, so all campaigns/files/images are visible to everyone

### What needs to happen for auth

1. **Set Clerk secret**: `echo -n 'sk_test_xxx' | npx wrangler secret put CLERK_SECRET_KEY`
2. **Redeploy** (secrets need redeploy to affect running DOs)
3. **Client must send tokens**:
   - WebSocket: `wss://domain/ws?token={clerkJWT}` (already implemented in `websocket-manager.ts`)
   - REST: `Authorization: Bearer {clerkJWT}` header (already implemented in client API calls)
4. **Test with real Clerk tokens** — the `verifyToken()` function fetches JWKS from Clerk and does full RSA verification
5. **Per-user data isolation** — once auth is real, each user gets their own DO (`idFromName(userId)`), own R2 prefix (`/users/{userId}/`), and own D1 data (filtered by `user_id`)

The auth code is fully implemented in `cloudflare/src/auth.ts` — it just needs the secret key to activate.

---

## Next Session: Connect React Client

### Priority 1: Remove debug diagnostics

The `[debug]` status messages and DO-level API key test add ~8s overhead per generation. Strip them before connecting the client:
- Remove DO-level `fetch('https://api.anthropic.com/...')` test (redundant — pre-flight covers it)
- Remove `[debug]` status messages (or gate behind an env flag)
- Keep the pre-flight IP retry (essential for reliability)

### Priority 2: Enable Clerk auth

1. Set `CLERK_SECRET_KEY` via wrangler secret
2. Verify React client sends tokens correctly (already implemented)
3. Test auth flow end-to-end with a real Clerk JWT

### Priority 3: Connect React client to deployed Worker

The React client needs **zero code changes** to work with the Cloudflare Worker — same WebSocket protocol, same REST API, same image URLs. The only change is the endpoint URL:

**Option A: Direct connection (for testing)**
- Set `VITE_WS_URL=wss://creative-agent.alphasapien17.workers.dev` in client env
- Set API base URL to `https://creative-agent.alphasapien17.workers.dev`

**Option B: Deploy to Cloudflare Pages (production)**
- Build: `cd client && npm run build`
- Deploy `client/dist/` to Cloudflare Pages
- Configure routing: Pages for static, Worker for `/ws`, `/api/*`, `/images/*`
- No env vars needed (relative URLs work when same domain)

### Priority 4: Full UI flow test

Once connected, test in the browser:
1. Create new campaign (generate)
2. View generated images
3. Send follow-up message
4. Refresh page mid-generation (reconnect)
5. Cancel a running generation
6. Browse campaign history (REST API)
7. Asset upload + reference in generation

---

## Deployed Version

**Version**: `f0decd77-2ad5-4da3-bb2d-f8d9aede7213`

Changes from Session 6:
- D1 file hydration for follow-up persistence
