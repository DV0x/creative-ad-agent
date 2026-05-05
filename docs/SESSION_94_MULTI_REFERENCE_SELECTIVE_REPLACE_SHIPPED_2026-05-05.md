# Session 94 — Multi-Reference Selective Replace SHIPPED (staging)

**Date:** 2026-05-05
**Branch:** `new-ui` (fast-forwarded from `feat/multi-ref-selective-replace`)
**Commit:** `3cd26a7` — `feat(refs): multi-reference selective replace via campaign-level refs MCP`
**Status:** ✅ Shipped to staging — verified end-to-end. Production migration + deploy NOT yet done.
**Predecessor:** `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` (the plan we executed)
**Predecessor session:** `docs/SESSION_93_REFERENCE_IMAGE_PIPELINE_PLAN_2026-05-05.md`

---

## TL;DR

Reference images are now sticky on the campaign row in D1 (`active_reference_file_ids` JSON column) instead of being passed per-message. The agent retrieves them via a new MCP tool (`mcp__refs__get_reference_images`) instead of reading URL-injected prompt text. Beta-client requirement (selective replace via chip strip) shipped with it.

Plan was 5 phases. All 5 phases landed; Phase 5 manual verification on staging passed; production migration + deploy is the only remaining step.

---

## What was shipped

One commit (`3cd26a7`) — 31 files changed, +1655/-121.

### Backend — Cloudflare (`cloudflare/`)
| File | Change |
|---|---|
| `schema.sql` | Added `active_reference_file_ids TEXT` inline on `campaigns` |
| `src/db/campaigns.ts` | New: `getActiveReferences`, `setActiveReferences`, `removeFileFromAllCampaigns` |
| `src/db/index.ts` | Exported the three new functions |
| `src/lib/types.ts` | `ClientMessage` accepts `set_active_references` + `fileIds` field; new `ResolvedRefs` interface; `ServerMessage` accepts `active_references_updated` + `fileIds` |
| `src/durable-objects/campaign-session.ts` | New `handleSetActiveReferences`; `handleGenerate`/`handleFollowUp` refactored — read sticky refs from D1, write `/app/refs.json` inside `setupSandbox` after `mountBucket`, refresh in `runFollowUpFast` before `next-prompt.json`. Drops `assetFileIds` arg. Accepts `firstTurnFileIds` to attach refs after `createCampaign` for new campaigns. |
| `src/routes/assets.ts` | `deleteFile` and `deleteFolder` cascade-sweep `removeFileFromAllCampaigns` |
| `sandbox/refs-mcp.ts` | **NEW** — disk-backed MCP, reads `/app/refs.json` per call |
| `sandbox/agent-runner.ts` | Registers `refs` MCP + adds `mcp__refs__get_reference_images` to `allowedTools`; tool display name `"Loading reference images"` |
| `sandbox/orchestrator-prompt.ts` | Replaced "Reference Images" workflow steps to invoke MCP first, then `Read(sandboxPath)`. Added refs MCP to tool inventory section. **(Critical — without this Haiku narrates instead of calling.)** |
| `sandbox/nano-banana-mcp.ts` | `referenceImageUrls.max(10) → max(14)` |
| `sandbox/Dockerfile` | Added `refs-mcp.ts` to the COPY list |

### Backend — local server (`server/`)
| File | Change |
|---|---|
| `lib/database.ts` | Added column inline to CREATE TABLE + try/catch ALTER TABLE migration block |
| `lib/db/campaigns.ts` | Mirrored Cloudflare DB layer functions |
| `lib/db/index.ts` | Exported the three new functions |
| `lib/refs-mcp.ts` | **NEW** — local refs MCP, reads `/tmp/creative-agent-refs.json` |
| `lib/ai-client.ts` | Registered `refs` MCP + added to `allowedTools` |
| `lib/orchestrator-prompt.ts` | Mirror of Cloudflare orchestrator prompt change |
| `lib/nano-banana-mcp.ts` | `max(10) → max(14)` mirror |
| `lib/websocket-handler.ts` | New `set_active_references` case + `handleSetActiveReferences`; `handleGenerate`/`handleFollowUp` refactored same as DO; new helper `resolveRefsForLocal` + `writeLocalRefsFile` |
| `routes/assets.ts` | Cascade sweep on file/folder delete |

### Frontend (`client/`)
| File | Change |
|---|---|
| `src/types/websocket.ts` | `WSClientMessage` adds `set_active_references`, `fileIds`, `sourceCampaignId`, `aspectRatio`, `brand`. New `WSActiveReferencesUpdatedEvent`. |
| `src/lib/api.ts` | `ApiCampaign` adds `active_reference_file_ids: string \| null`; `transformCampaign` parses to `activeReferenceFileIds: string[]` |
| `src/store/index.ts` | `Campaign.activeReferenceFileIds`; new state slice `activeReferencesByCampaign: Record<campaignId, fileIds[]>`; actions `addReference`/`removeReference`/`setActiveReferences`; `removeFile` does local cascade; `setCampaigns` seeds the map; `reset()` clears it. NOT in `partialize` allowlist (server-derived). |
| `src/hooks/useWebSocket.ts` | Drops `assetFileIds` arg from `followUp`; `generate` keeps it (new-campaign first-turn case rides on the `generate` WS payload as `fileIds`). New case in message handler: `'active_references_updated' → setActiveReferences` |
| `src/components/chat/ReferenceChipStrip.tsx` | **NEW** — display + remove only chip strip above textarea |
| `src/components/chat/ChatInput.tsx` | Mounts `<ReferenceChipStrip>` for active campaigns; @-mention dispatches `addReference` for active campaigns, falls back to local `mentionedAssetFiles` for new-campaign-creation. **Stable `EMPTY_IDS` constant outside selector to avoid React error #185.** |
| `src/components/chat/ChatSidebar.tsx` | `handleSubmit` only passes `assetFileIds` for new campaigns (refs are server-state for follow-ups) |
| `src/components/chat/MobileChatDrawer.tsx` | Same shape as ChatSidebar |
| `src/components/assets/AssetDrawer.tsx` | **Mounted `<FileUpload />`** below the Library header. (Component existed in the codebase but was never rendered anywhere — pre-existing gap discovered while testing.) |

### Skill (`agent/`)
| File | Change |
|---|---|
| `.claude/skills/art-style/SKILL.md` | New **Step 2.5** between Step 2 and Step 3: "Build Reference Image Roster" — calls `mcp__refs__get_reference_images`, reads each `sandboxPath`, builds IMAGE ROSTER + PRODUCT FIDELITY block, assigns `referenceImageUrls` per concept. |

### Plan doc
| File | Change |
|---|---|
| `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` | New (committed; was untracked when session started). Includes the deferred-WS-broadcast note. |

---

## Architecture summary

### Data model
- D1 column `campaigns.active_reference_file_ids` — JSON array of `asset_files.id` values. NULL = no refs.
- Sticky semantics (D5 in plan): empty turn preserves previous refs; any chip add/remove via UI rewrites the array.
- Cascade integrity (D14): when a file or folder is deleted from the asset library, server-side `removeFileFromAllCampaigns` sweeps the column. WS broadcast back to live clients was deferred (see "Deferred").

### Two-layer reference selection
- **Layer 1 (user-controlled, persistent):** the campaign's `active_reference_file_ids` set, surfaced as the chip strip above the textarea.
- **Layer 2 (agent-controlled, per-concept):** in art-style Step 2.5, the agent picks which subset of refs each ad concept uses, writes them into `prompts.json` as `referenceImageUrls`. Some concepts may use all, some a subset, some none.

### Flow per turn
1. WS message arrives at DO (`generate` or `follow_up`).
2. DO reads `db.getActiveReferences(campaignId)` → list of fileIds.
3. DO calls `resolveAssetUrls(fileIds)` → fal.ai upload → `{ falUrls, sandboxPaths, fileIds }`.
4. DO writes `/app/refs.json` inside the sandbox (after `mountBucket` for cold path; before `next-prompt.json` for warm path).
5. Prompt-text injected: "This campaign has N active reference image(s). Call `mcp__refs__get_reference_images`..."
6. Orchestrator prompt instructs the agent: "If prompt mentions reference images → call `mcp__refs__get_reference_images` FIRST, then `Read(sandboxPath)` each."
7. Art-style skill Step 2.5: calls the MCP again per-concept, builds IMAGE ROSTER, assigns `referenceImageUrls` to each prompts.json entry.
8. `generate_ad_images` reads `referenceImageUrls` from `prompts.json` per concept, NOT from agent working memory. **This is the durability boundary.**

### First-turn new-campaign edge case
The campaign doesn't exist server-side until the DO's `handleGenerate` calls `createCampaign`. So the client can't dispatch `set_active_references` before `generate` (server would reject "Campaign not found"). Fix: client sends `fileIds` *inside* the `generate` WS payload; DO calls `setActiveReferences(campaign.id, validFileIds)` immediately after `createCampaign`, then the existing `getActiveReferences` read finds them. Auth check inline (validates each fileId belongs to the user's folders).

For follow-ups, no special-casing needed — the campaignId is real, `addReference` dispatches `set_active_references` with it directly.

---

## Bugs caught and fixed during the session

### 1. Workspace blank on sign-in (React error #185)
**Symptom:** Workspace renders blank after sign-in. Console: `Minified React error #185` (Maximum update depth exceeded).
**Root cause:** Two new selectors I added used `useStore(s => s.activeReferencesByCampaign[id] || [])`. The `|| []` allocates a fresh empty array every render → zustand's `Object.is` sees a new value → triggers re-render → infinite loop.
**Fix:** Module-scoped `EMPTY_IDS: string[] = []` constant; pull the value via selector, fall back outside: `useStore(s => s.activeReferencesByCampaign[id]) ?? EMPTY_IDS`. Saved as memory at `feedback_zustand_selector_fallback.md`.
**Files:** `client/src/components/chat/ReferenceChipStrip.tsx`, `client/src/components/chat/ChatInput.tsx`.

### 2. Sandbox docker build failed: `Cannot find module './refs-mcp.js'`
**Symptom:** First wrangler deploy failed with `error TS2307` inside the docker build.
**Root cause:** `cloudflare/sandbox/Dockerfile` explicitly lists files to COPY (one line, multiple files). I created `refs-mcp.ts` but forgot to add it to that COPY line, so `agent-runner.ts`'s import couldn't resolve at compile time.
**Fix:** Added `refs-mcp.ts` to the COPY list. Important reminder: any new sandbox-side file needs the Dockerfile COPY edit.

### 3. `Unauthorized` on first deploy
**Symptom:** Container image pushed, but worker deploy step rejected.
**Root cause:** Wrangler session expired.
**Fix:** `npx wrangler login` (interactive). Re-ran deploy; image was already in registry so it was fast.

### 4. "Upload Files" button missing from UI
**Symptom:** No way to upload assets for testing.
**Root cause:** **Pre-existing gap** — `client/src/components/assets/FileUpload.tsx` defined a self-contained "Upload Files" button + drag-drop dialog, exported via `index.ts`, but was never imported anywhere in the running app.
**Fix:** Mounted `<FileUpload />` below the Library header in `AssetDrawer.tsx`. ~3 lines.

### 5. "Campaign not found" error during new-campaign flow
**Symptom:** When the user @-mentioned files on a new (unsaved) campaign, the WS handler returned "Campaign not found".
**Root cause:** Race condition. Client mints a temp campaignId in `startGeneration` (e.g. `campaign-1777975960712-...`), dispatches `set_active_references` with that temp ID, *then* dispatches `generate`. Server processes `set_active_references` first → looks up the temp ID in D1 → null. Server creates the real campaign (`campaign_<random>`) only when processing `generate`. Two-phase protocol where the order doesn't work.
**Fix:** Bake `fileIds` into the `generate` WS payload (one message). DO creates the campaign, then immediately `setActiveReferences(campaign.id, validFileIds)` before reading them back.

### 6. Agent narrating instead of calling the refs MCP
**Symptom:** Agent said "I'm reading reference images" but never invoked `mcp__refs__get_reference_images`. UI tool log showed the existing tools (Read, WebFetch, etc.) but never "Loading reference images".
**Root cause:** Two issues:
1. The orchestrator prompt's "Reference Images" workflow section had stale instructions (`Use the Read tool at each listed path`) — it expected paths inlined in the prompt text. After the rewrite, paths are only in the MCP, but the orchestrator still followed the old instructions.
2. The refs MCP was registered in `allowedTools` and `mcpServers` (verified) but wasn't documented in the orchestrator's tool inventory, unlike `mcp__nano-banana__generate_ad_images` which is.
**Fix:** Listed the refs MCP in the tool inventory + rewrote the entire "Reference Images" workflow section to invoke MCP first, then `Read(sandboxPath)`. Also strengthened SKILL.md Step 2.5 with imperative language ("YOU MUST call... do not narrate, do not paraphrase, do not skip"). Confirmed via claude-sdk-guide that Skills inherit parent MCPs.
**Files:** `cloudflare/sandbox/orchestrator-prompt.ts`, `server/lib/orchestrator-prompt.ts`, `agent/.claude/skills/art-style/SKILL.md`.

---

## Verification on staging

End-to-end test passed on staging deploy `7e7072db` (and onwards):

✅ User uploaded 2 reference images (`twt-1.jpg`, `twt-2.jpg`) via the new FileUpload button
✅ User @-mentioned both → chips appeared in `ReferenceChipStrip`
✅ User submitted → DO logged `[ASSET] First-turn refs attached to <cid>: 2/2 valid`
✅ DO logged `[ASSET] Wrote /app/refs.json with 2 reference(s)`
✅ Agent invoked `mcp__refs__get_reference_images` (visible in user's UI tool log — screenshot in chat)
✅ Followed by two `Read` tool calls (one per `sandboxPath`)
✅ Generation completed, images saved to R2, served via `/images/...`
✅ User confirmed: generated images preserved the reference images' product identity (not generic placeholders)

---

## Deferred (known follow-ups)

### 1. Live UI sync after server-side asset cascade
**What:** When a file is deleted from the asset library, the server sweeps it out of all campaigns' `active_reference_file_ids` (D1), but doesn't push `active_references_updated` events to the user's open clients. Stale state persists in `activeReferencesByCampaign` until next page refresh.
**Why deferred:** The chip strip self-heals at render time (file lookup fails → chip doesn't draw), so the user doesn't see broken UI — only the in-memory store array is stale. Building the worker→DO push pattern was ~40 LOC of new RPC surface for a cosmetic gain. `removeFileFromAllCampaigns` already returns the affected campaign IDs, so wiring up the broadcast later is straightforward.
**Decision recorded in:** `PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` Phase 1.3 note.

### 2. Tool display name not rendering as "Loading reference images"
**What:** The UI tool log shows the raw tool name `mcp__refs__get_reference_images` instead of the friendly display name "Loading reference images" that I registered in `agent-runner.ts`'s `TOOL_DISPLAY_NAMES`.
**Why deferred:** Cosmetic. Probably a parser/display path issue — the SDK message parser may not consult `TOOL_DISPLAY_NAMES` for MCP tools the same way it does for built-ins. Worth a 10-minute look but not blocking.

### 3. Double-prefix in campaign title
**What:** Title rendered as `Twt-1 — Twt-1 — @ @ create 2 ads...` — the asset filename appears twice and the `@` prefix is doubled.
**Why deferred:** Cosmetic. Likely from how `extractCampaignName` interacts with mention-prefixed prompts. Unrelated to refs flow.

### 4. Folder-as-reference (tag whole folder)
**What:** User asked: can they tag an entire folder as a reference? Currently no — only individual files can be added via @-mention.
**Why deferred:** Outside scope of the locked plan. Captured in conversation; would add ~30 LOC to `ChatInput`'s mention handler (fan out folder.files → addReference for each image, with the 14-ref cap and a toast for overflow).

### 5. Production migration + deploy
**What:** ALTER TABLE on `creative-agent-db-prod` + production wrangler deploy.
**Why not done:** User wanted to verify on staging first.
**How:** Plan doc Phase 5 has the exact commands. Same flow as staging:
```bash
# 1. Production D1 migration
npx wrangler d1 execute creative-agent-db-prod --remote --command="ALTER TABLE campaigns ADD COLUMN active_reference_file_ids TEXT;"

# 2. Build production frontend + deploy
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env production

# 3. Verify dist contains new symbols
grep -c "activeReferencesByCampaign" client/dist/assets/index-*.js   # should be >0

# 4. Health check + smoke test on prod
curl -s https://creativemachines.xyz/health | python3 -m json.tool
```

### 6. Local dev path may be stale
**What:** Phase 4 mirrored the changes in `server/` (Express + SQLite + in-process SDK), but local dev was never run end-to-end this session. Server typechecks clean but behavioral verification is pending.
**How to verify next session:** `cd server && npm run dev` + `cd client && npm run dev`, hit `localhost:5173`, run a campaign with refs, check `/tmp/creative-agent-refs.json` is being written, watch SDK logs for the MCP call.

---

## Locked decisions (do not relitigate)

From the plan, all 17 are locked. The most load-bearing for the next session:
- **D7:** Hard cutover — no `assetFileIds` fallback on generate/follow_up payloads. (Exception: first-turn `fileIds` ride along on `generate` because the campaign doesn't exist yet — that's a different field, not the old contract.)
- **D8:** Chip strip is **display + remove only**. `@mention` is the add action. Don't add a "+ Add" button to the chip strip.
- **D11:** Reference visual analysis baked into prompt text by the agent (in Step 2.5) — not just URLs. Generic descriptions cause drift.
- **D13:** `refs.json` write happens INSIDE `runGeneration` after sandbox setup, not in `handleGenerate`. (Sandbox is null until `setupSandbox` runs.)
- **D15:** Reference changes apply to the NEXT generation, not in-flight one. The MCP reads the file fresh on each call but the file isn't rewritten mid-generation.

---

## Memory updates this session

Two new feedback memories saved (referenced in `MEMORY.md`):
- `feedback_no_commits_until_tested.md` — wait for staging verification before committing or even commit-prep work
- `feedback_zustand_selector_fallback.md` — `|| []` inside a useStore selector triggers React error #185

---

## How to pick up next session

1. **Read this doc top-to-bottom.** It's the current authoritative state.
2. If plan-on-disk drift is suspected, also re-read `docs/PLAN_MULTI_REFERENCE_SELECTIVE_REPLACE_2026-05-05.md` for the fully-documented decisions.
3. **Decide deploy vs follow-ups first.** Most likely: do the prod migration + deploy. Once that lands, capture beta feedback before pulling new features in.
4. If working on the Deferred items above, treat each as its own scoped task — none of them require touching the locked architecture.
5. Branch state at handover:
   - `master` — untouched
   - `new-ui` — fast-forwarded, contains the feature (commit `3cd26a7`)
   - `feat/multi-ref-selective-replace` — same commit (kept as marker; can delete once landed)
6. Staging is live at `https://creative-agent-staging.alphasapien17.workers.dev` (version `7e7072db-2d10-4b30-8da5-8ebe828f5f60` as of session end).

---

## Key file references

When debugging refs flow issues:
- DO entry: `cloudflare/src/durable-objects/campaign-session.ts` — `handleSetActiveReferences` (search "First-turn refs"), `handleGenerate` (line where `firstTurnFileIds` is processed), `setupSandbox` (where `/app/refs.json` is written)
- MCP: `cloudflare/sandbox/refs-mcp.ts` (cloudflare) / `server/lib/refs-mcp.ts` (local)
- Agent runner registration: `cloudflare/sandbox/agent-runner.ts` — `allowedTools`, `mcpServers`, `TOOL_DISPLAY_NAMES`
- Orchestrator prompt: `cloudflare/sandbox/orchestrator-prompt.ts` — "Reference Images" section
- Skill: `agent/.claude/skills/art-style/SKILL.md` — Step 2.5
- Frontend chip: `client/src/components/chat/ReferenceChipStrip.tsx`
- Frontend dispatch: `client/src/components/chat/ChatInput.tsx` — `handleAssetFileMention`
- Frontend store: `client/src/store/index.ts` — search for `activeReferencesByCampaign`
- WS plumbing: `client/src/hooks/useWebSocket.ts` — `generate` and `followUp` callbacks; `active_references_updated` case in message handler

End of session 94 doc.
