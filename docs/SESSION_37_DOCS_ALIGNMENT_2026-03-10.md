# Session 37 — Full Docs Alignment to Codebase (2026-03-10)

## Goal

Verify all 22 architecture docs (cloudflare/, client/, shared/, local/, ops/) against the actual codebase and fix every inaccuracy found.

## Result

All 22 docs verified and updated. **~70+ individual fixes applied across 18 docs.**

---

## Method

Two verification rounds, each using parallel Explore agents for deep code comparison:

### Round 1 — cloudflare/, client/, shared/ (14 docs)
- 4 parallel Explore agents verified every function name, signature, type, flow, and line count
- 4 parallel fix agents applied corrections
- 11 docs updated

### Round 2 — local/, ops/, CLIENT_ARCHITECTURE.md (7 docs)
- 2 parallel Explore agents verified
- 2 parallel fix agents applied corrections
- All 7 docs updated

---

## Critical Fixes Applied

### 1. Image Event Fields Completely Wrong (WEBSOCKET_PROTOCOL.md, IMAGE_PIPELINE.md)

**Before (wrong):**
```json
{ "id": 1, "url": "/images/...", "version": 1 }
```

**After (correct):**
```json
{ "id": "image_0", "urlPath": "/images/...", "filename": "1_stat_bold.png", "hookType": "stat", "imageIndex": 0 }
```

`version` is not in WS events (only D1). Fields `filename`, `imageIndex`, `urlPath` were missing.

### 2. queryStream() vs queryWithSession() (LOCAL_AI_CLIENT.md, LOCAL_WEBSOCKET.md)

Docs only documented `queryStream()` but the actual websocket-handler.ts exclusively uses `queryWithSession()` — a different method with 6 positional parameters including session management and resume support. All 3 AIClient methods now documented.

### 3. REST API Response Wrappers Missing (REST_API.md)

All GET endpoints return `{ success: true, ... }` wrapper but doc showed flat objects. Fixed across all endpoint examples.

### 4. Image R2 Path Wrong (REST_API.md)

**Before:** `GET /images/:campaignId/:filename`
**After:** `GET /images/:sessionId/:filename` — path uses sessionId, not campaignId.

### 5. Health Endpoint Response Structure Wrong (DEBUGGING.md)

**Before:** `bindings.d1`, `bindings.r2`, `bindings.do`
**After:** Separate top-level objects `d1: { connected, campaigns }`, `r2: { bound }`, `auth: { clerkKeySet }`. No `bindings` wrapper exists.

### 6. JWKS Caching Claim False (AUTH_FLOW.md)

Doc said JWKS keys are "cached in module scope". Actual code fetches on every `verifyToken()` call with no caching. Fixed.

### 7. CF_ACCOUNT_ID Location Wrong (DEPLOYMENT.md)

Doc said it's in `wrangler.jsonc` under `vars`. It's not — must be set as a wrangler secret.

### 8. "NOT YET DEPLOYED" Claims Stale (SANDBOX_CONTAINER.md, KNOWN_ISSUES.md)

`generated-images.jsonl` tracking file IS deployed and operational in agent-runner.ts. Known Issues #3 marked as FIXED.

---

## All Changes by Doc

### Cloudflare Docs

| Doc | Changes |
|-----|---------|
| **SANDBOX_CONTAINER.md** | Removed stale "NOT DEPLOYED" note, added `RESUME_SDK_SESSION_ID`, `settingSources`, `writeCompletionMarker()` details, `filepath` limitation |
| **D1_DATABASE.md** | Fixed `addFile` signature (object destructuring → individual params) |
| **CLOUDFLARE_OVERVIEW.md** | Fixed 5 line counts (router 205→204, auth ~120→159, event-buffer 51→50, block-builder 106→105, sdk-message-parser 256→255) |
| **STREAMING_PIPELINE.md** | Added `stripImageUrls()` function, filename dedup via `processedFilenames` Set, 120s turn_start timeout |
| **DURABLE_OBJECT.md** | No changes needed (verified accurate) |
| **R2_STORAGE.md** | No changes needed (verified accurate) |

### Client Docs

| Doc | Changes |
|-----|---------|
| **STATE_MANAGEMENT.md** | Added 33 previously undocumented actions/selectors across 8 new sections. All 68 store items now documented |
| **WEBSOCKET_CLIENT.md** | Added `tool_end` no-op note |
| **CLIENT_ARCHITECTURE.md** | Added 6 undocumented components (AssetMention 473 lines, SignIn 43, UserMenu 40, BlockRenderer 32, StatusBlock 34, TextBlock 17), fixed FileEditorPanel naming, fixed total ~4270→~5885 lines, added ThinkingBlock 185 lines |

### Shared Docs

| Doc | Changes |
|-----|---------|
| **WEBSOCKET_PROTOCOL.md** | Rewrote image event fields, added turn_start sentinel, R2 completion polling, attachStreamHandler/attachCompletionHandler, server keepalive 30s note |
| **REST_API.md** | Fixed image path (sessionId not campaignId), added `success: true` wrappers, fixed POST messages body |
| **AUTH_FLOW.md** | Documented all 4 functions (was 2), fixed JWKS caching claim, clarified dev-mode bypass, fixed line count 120→159 |
| **IMAGE_PIPELINE.md** | Fixed event fields (urlPath not url), added turn-result.json reconciliation, image versioning, imageCounter, dual MCP mode (text-to-image + edit) |
| **AI_AGENT_PIPELINE.md** | Added allowedTools filter, promptStream() generator, waitForPromptFile() IPC, file hydration, turn sentinels, warm container memory clarification |

### Local Docs

| Doc | Changes |
|-----|---------|
| **LOCAL_ARCHITECTURE.md** | Fixed local-ai-runner.ts line count (376→287) |
| **LOCAL_AI_CLIENT.md** | Documented all 3 query methods (queryStream, queryWithSession, queryWithSessionFork) with full signatures, added attachments parameter |
| **LOCAL_WEBSOCKET.md** | Fixed all queryStream→queryWithSession references (generation flow, follow-up flow, comparison table) |

### Ops Docs

| Doc | Changes |
|-----|---------|
| **DEBUGGING.md** | Fixed health response structure (no bindings wrapper), added turn-result.json reconciliation note |
| **DEPLOYMENT.md** | Fixed CF_ACCOUNT_ID (not in wrangler.jsonc — must be wrangler secret) |
| **KNOWN_ISSUES.md** | Issue #3 marked FIXED (tracking file IS deployed), Issue #9a mitigation noted (unmountBucket in finally block) |

---

## Final Status

| Directory | Docs | Updated | Verified Accurate |
|-----------|------|---------|-------------------|
| cloudflare/ | 6 | 4 | 6/6 |
| client/ | 3 | 3 | 3/3 |
| shared/ | 5 | 5 | 5/5 |
| local/ | 3 | 3 | 3/3 |
| ops/ | 3 | 3 | 3/3 |
| **Total** | **22** | **18** | **22/22** |

4 docs needed no changes (DURABLE_OBJECT.md, R2_STORAGE.md were already accurate from Session 36; OVERVIEW.md and INDEX.md were structural only).

---

## Remaining Gaps (from Session 36, unchanged)

These are documentation gaps for content that doesn't exist yet, not inaccuracies:

1. **Agent workspace docs** — `agent/` directory, research subagent, hook/art-style skills
2. **DO state machine diagram** — idle → generating → complete/cancelled/error
3. **Agent-runner file IPC diagram** — next-prompt.json → turn-result.json flow
4. **Three-layer recovery diagram** — waitForLog → R2 polling → /recover
5. **Error propagation patterns** — SDK error → agent stdout → stream handler → client
