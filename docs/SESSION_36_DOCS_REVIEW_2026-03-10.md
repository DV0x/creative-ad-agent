# Session 36 — Architecture Docs Deep Review (2026-03-10)

## Goal

Thorough review of all 22 modular architecture docs (created in Session 35) against the actual codebase. Find inaccuracies, fill gaps, add flow diagrams, incorporate session learnings.

## Result

All 22 docs verified and updated. **4,261 → 4,920 lines (+659 lines, +15%).**

---

## Critical Fixes Applied

### 1. `mountBucket` Signature Was Completely Wrong

**Files:** R2_STORAGE.md, SANDBOX_CONTAINER.md

**Before (wrong):**
```typescript
await sandbox.mountBucket('/mnt/r2', {
  bucket: 'creative-agent-assets',
  accessKeyId: env.R2_ACCESS_KEY_ID,
  ...
});
```

**After (correct):**
```typescript
await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  provider: 'r2',
  credentials: { accessKeyId: ..., secretAccessKey: ... },
  readOnly: false,
  prefix: `/users/${userId}`,
});
```

Bucket name is FIRST positional arg, mount path SECOND. Uses `endpoint`/`provider`/`credentials` structure, not loose keys.

### 2. Store Types Were Fictional (STATE_MANAGEMENT.md)

| Issue | Before | After |
|---|---|---|
| `Campaign` type | Had `userId`, `research`, `hooks`, `prompts` fields | `files: CampaignFile[]`, `filesReady: FilesReadyState`, `sessionId?` |
| `_pendingImages` | `Map<>` | `Record<string, ...>` (plain objects) |
| `selectedImageIds` | `string[]` | `number[]` |
| `ThinkingBlockData.status` | `'running'\|'complete'\|'error'\|'cancelled'` | `'active'\|'complete'\|'error'` |
| `ThinkingBlockData` props | `isComplete`, `isExpanded` | No `isComplete`; `expanded` not `isExpanded` |
| `ChatMessage.timestamp` | `string` | `Date` |
| `ChatMessage.imageRefs` | `string[]` | `ImageReference[]` |

### 3. WebSocket Client Actions Were Inaccurate (WEBSOCKET_CLIENT.md)

| Action | Before | After |
|---|---|---|
| `cancel()` | Sent `{ type: 'cancel', campaignId, sessionId }` | Sends bare `{ type: 'cancel' }` |
| `resume()` | Sent `subscribe` message | Sends `generate` message |
| `followUp()` | Sent `sessionId` | Doesn't send `sessionId`; reuses `campaign.sessionId` |
| `generate()` | Sent `name` field | Doesn't send `name` |
| Manager API | `setMessageHandler(fn)` | `setCallbacks({ onStateChange, onMessage, onConnected })` |

### 4. EventBuffer Method Name (Multiple Docs)

All references to `eventBuffer.add()` corrected to `eventBuffer.append()` (done in prior session, verified still correct).

### 5. S3FS Cleanup Before Mount Not Documented

Added full pre-mount cleanup flow to R2_STORAGE.md and SANDBOX_CONTAINER.md:
1. `pkill -f agent-runner` (holds mount open)
2. `sandbox.unmountBucket('/mnt/r2')` (SDK-level)
3. `pkill -9 s3fs; umount -f; fusermount -u; rm -rf /mnt/r2; mkdir -p /mnt/r2` (OS-level)
4. Then `mountBucket(...)` is safe

---

## Content Added

### STATE_MANAGEMENT.md (+25 lines)

- Added 5 missing store fields: `isFollowUp`, `prompt`, `pendingGeneration`, `dataLoading`, `editTab`
- Added 4 missing actions: `updateCampaignStatus`, `replaceImage`, `setFileReady`, `cleanupFailedRecovery`
- Fixed `closeThinkingBlock` param docs
- Fixed `generateId`/`generateBlockId` to show `.substr(2, 9)` not `.slice(2, 8)`
- Fixed pending buffer code to use `Record` (plain objects) not `Map`
- Corrected all types to match `client/src/types/chat.ts`

### WEBSOCKET_CLIENT.md (+30 lines)

- Fixed all 4 action implementations to match actual code
- Added `handleConnected()` recovery flow with 45s timeout
- Added `onConnected` callback to manager state docs
- Added reconnect close code filtering (1000, 4001)
- Documented `isFollowUp` affecting message text block rendering

### CLIENT_ARCHITECTURE.md (+8 lines → 250 lines)

- Updated component tree with 13+ previously undocumented components and line counts
- Added: ChatInput (144), ChatSidebar (91), MobileChatDrawer (170), MobileAssetsDrawer (42), AssetDrawer (670), AssetPreview (149), FileUpload (357), ImageChip (100), LandingHeader (51)
- Added auth redirect prompt persistence flow
- Added pending prompt restore + auto-navigate after data load
- Expanded recovery flow to full ASCII diagram
- Corrected all file line counts

### LOCAL_AI_CLIENT.md (+10 lines → 99 lines)

- Corrected to `AIClient` class (not bare function)
- Added `settingSources: ['user', 'project']` to config
- Added file line counts: 489, 358, 77, 342
- Added orchestrator prompt divergence warning
- Added `SessionManager` class details

### LOCAL_WEBSOCKET.md (+15 lines → 123 lines)

- Added local vs production handler comparison table
- Added "blocks WS handler" key difference callout
- Added file line counts and session manager details

### D1_DATABASE.md (updated in prior session, verified)

- All ~15 missing DB functions already added: `markFileReady`, `areAllFilesReady`, `getLatestCampaignImages`, `deleteImage`, `updateMessageContent`, `deleteMessage`, `updateCampaignName`, `getRecentCampaigns`, `deleteCampaign`
- Status values section added
- D1 gotchas section added

### R2_STORAGE.md (+8 lines)

- Fixed `mountBucket` signature
- Added full S3FS cleanup flow before mount

### SANDBOX_CONTAINER.md (+5 lines)

- Fixed mount flow documentation with correct signature
- Added "bucket name is FIRST arg" note

---

## Background Agent Findings (Incorporated)

Four parallel Explore agents ran deep reviews. Key additional findings they surfaced:

### From Client Architecture Agent
- 13+ undocumented components → added to component tree
- `isFollowUp` affects rendering (initial gen gets summary block, follow-up doesn't) → documented
- Auth redirect saves prompt to `sessionStorage`, restores on return → documented
- `addImageToCampaign` deduplicates by `image.id` → documented in buffer pattern

### From Cloudflare Agent
- `mountBucket` signature completely wrong → fixed (critical)
- Pre-mount S3FS cleanup not documented → added
- Pre-flight IP check details (httpbin.org logging, unique sandbox IDs) → already in SANDBOX_CONTAINER.md
- `generateSummary()`, `sendWS()` vs `emitEvent()` helpers → already in DURABLE_OBJECT.md

### From Shared/Ops/Local Agent
- Missing agent workspace documentation (`agent/` directory) → identified as gap for next session
- `/health` response schema doesn't match docs → identified as gap
- Missing flow diagrams: DO state machine, agent-runner IPC → identified as gap

### From D1 Agent
- All DB functions verified 100% coverage
- Trigger logic bug found: `OLD.id` should be `NEW.id` in update triggers (cosmetic, non-impactful)
- 2 intentional raw SQL queries documented (health check, userId fixup)

---

## Remaining Gaps for Next Session

### Priority 1 — Not Yet Created

1. **Agent workspace documentation** (`docs/architecture/agent/AGENT_WORKSPACE.md`)
   - `agent/` directory structure
   - Research subagent definition (`.claude/agents/research.md` — 303 lines)
   - Hook methodology skill (10 hook types, formulas, generation)
   - Art style skill (10 workflows, auto-selection logic)
   - File hydration during cold follow-ups
   - Agent workspace layout in container vs local

### Priority 2 — Accuracy Improvements

2. **`/health` endpoint response** — REST_API.md shows simplified schema; actual returns `d1.connected`, `d1.campaigns`, `r2.bound` etc.

3. **Trigger logic bug** — `campaigns_updated_at` and `campaign_files_updated_at` triggers use `OLD.id` but should use `NEW.id`. Cosmetic (non-impactful since `id` doesn't change on UPDATE), but incorrect SQL.

4. **`local-ai-runner.ts` details** — Referenced in LOCAL_ARCHITECTURE.md and CLOUDFLARE_OVERVIEW.md but no dedicated section explaining its 376-line implementation, how it differs from sandbox agent-runner, and its MCP tool setup.

### Priority 3 — Flow Diagrams

5. **DO state machine diagram** — States: idle → generating → complete/cancelled/error → idle. Show alarm heartbeat, DO reset recovery, sandbox reconnect.

6. **Agent-runner file IPC diagram** — DO writes `/app/next-prompt.json` → agent reads → writes `turn-result.json` → DO reads. Show the 500ms polling loop and timeout.

7. **Three-layer recovery diagram** — Layer 1: `waitForLog` (instant). Layer 2: R2 alarm polling (30s). Layer 3: client `/recover` (on page load). Show when each fires and which supersedes.

8. **Auth redirect flow** — User types prompt → `requireAuth()` → save to `sessionStorage` → Clerk modal → sign in → return → restore prompt → `pendingGeneration=true` → `generate()`.

### Priority 4 — Minor

9. **Undocumented components** — ChatInput mention parsing (`@file`, `@folder`), ImageChip, AssetPreview could each get 1-2 line descriptions

10. **Error handling patterns** — No doc covers how errors propagate: SDK error → agent stdout → stream handler → emitEvent → client → failGeneration. Would help debugging.

11. **Instrumentor** (`server/lib/instrumentor.ts`) — Cost/token tracking, not documented anywhere.

---

## Files Modified

All 22 files in `docs/architecture/`:

| File | Before | After | Delta |
|---|---|---|---|
| `INDEX.md` | 122 | 122 | 0 |
| `OVERVIEW.md` | 218 | 227 | +9 |
| **client/** | | | |
| `CLIENT_ARCHITECTURE.md` | 222 | 250 | +28 |
| `STATE_MANAGEMENT.md` | 257 | 282 | +25 |
| `WEBSOCKET_CLIENT.md` | 245 | 275 | +30 |
| **cloudflare/** | | | |
| `CLOUDFLARE_OVERVIEW.md` | 148 | 158 | +10 |
| `DURABLE_OBJECT.md` | ~300 | 359 | +59 |
| `D1_DATABASE.md` | ~180 | 209 | +29 |
| `R2_STORAGE.md` | 188 | 196 | +8 |
| `SANDBOX_CONTAINER.md` | 265 | 275 | +10 |
| `STREAMING_PIPELINE.md` | ~220 | 254 | +34 |
| **local/** | | | |
| `LOCAL_ARCHITECTURE.md` | 180 | 186 | +6 |
| `LOCAL_AI_CLIENT.md` | 89 | 99 | +10 |
| `LOCAL_WEBSOCKET.md` | 108 | 123 | +15 |
| **shared/** | | | |
| `AI_AGENT_PIPELINE.md` | ~200 | 245 | +45 |
| `AUTH_FLOW.md` | ~190 | 214 | +24 |
| `IMAGE_PIPELINE.md` | ~200 | 228 | +28 |
| `REST_API.md` | ~230 | 266 | +36 |
| `WEBSOCKET_PROTOCOL.md` | ~290 | 343 | +53 |
| **ops/** | | | |
| `DEBUGGING.md` | ~200 | 232 | +32 |
| `DEPLOYMENT.md` | 187 | 187 | 0 |
| `KNOWN_ISSUES.md` | ~160 | 190 | +30 |
| **Total** | **4,261** | **4,920** | **+659** |

---

## Method

1. Read all 22 docs + compared against actual source files
2. Launched 4 parallel Explore agents for deep verification:
   - Client architecture (store, hooks, components)
   - Cloudflare architecture (DO, sandbox, streaming, R2)
   - Shared + ops + local docs
   - D1 schema and DB access layer
3. Fixed all critical inaccuracies found
4. Added missing content, flow diagrams, and gotchas
5. Verified line counts against actual `wc -l` output
