# Session Changes - February 20, 2026

## Summary

This session fixed two critical image generation bugs:
1. **Image index collision across MCP batches** — When the AI called the image MCP tool twice (batches of 3), the second batch's images were silently dropped because both batches used indices 1-3. Only half the requested images were delivered.
2. **Image duplication on refresh** — DB-loaded images used autoincrement PKs as IDs while WebSocket events used positional indices. The client store deduplicated by ID, so the same images appeared twice when namespaces didn't match.
3. **Placeholder skeleton count wrong on refresh** — Per-batch `imageCount` from `phase` events overwrote the total expected count, causing skeleton placeholders to disappear before all images loaded.

---

## Changes Made

### 1. Server-Side Image Index Authority (Core Fix)

**Problem:** The MCP tool (`generate_ad_images`) uses a per-call loop index (`i + 1`), so every batch emits images with indices 1, 2, 3. When the server deduplicates by `imageIndex`, batch 2 collides with batch 1 and is dropped entirely.

**Root Cause:** The server had no authority over image indexing — it just passed through whatever the MCP tool reported.

**Fix:** Server is now the source of truth for image indices. Two mechanisms:

#### a) Filename-based deduplication (replaces imageIndex-based dedup)

Each image has a unique filename (timestamp + index + prompt hash). The dedup set changed from `Set<number>` (imageIndex) to `Set<string>` (filename). This naturally prevents cross-batch collision regardless of how the AI batches MCP calls.

#### b) Server-assigned global index counter

A `{ next: number }` counter in each generation session assigns sequential indices (1, 2, 3, 4, 5, 6) in arrival order. The MCP's per-batch index is ignored for all downstream use (hookType mapping, DB storage, client broadcast).

**File:** `server/lib/websocket-handler.ts`

**`processSDKMessage` (line ~261):**
- Param `processedImageIndices?: Set<number>` → `processedFilenames?: Set<string>`
- Added param `imageCounter?: { next: number }`
- Tool result image handling: dedup by `img.filename`, assign `globalIndex = imageCounter.next++`, derive hookType from global index

**`handleGenerate` (line ~506):**
- Replaced `processedImageIndices = new Set<number>()` with `processedFilenames = new Set<string>()`
- Added `imageCounter = { next: 1 }`
- `onImageSaved` handler: dedup by `event.filename`, assign global index from counter
- Removed dead image-counting block in for-await loop (was redundant with EventEmitter path)
- Image count at completion derived from `imageCounter.next - 1`

**`handleFollowUp` (line ~897):**
- Same pattern as handleGenerate
- Counter initialized from existing DB image count: `{ next: db.getImageCount(campaignId) + 1 }`
- Follow-up images continue the sequence after existing ones

---

### 2. Client Image ID Namespace Fix (Architecture Doc C3)

**Problem:** Images loaded from DB had `id = autoincrement PK` (e.g., 7, 8, 9). Images from WebSocket had `id = imageIndex` (1, 2, 3). The store's `addImageToCampaign` deduplicates by `id`, so the same images appeared twice when the namespaces didn't match.

**Fix:** Use `image_index` (position index) instead of `id` (DB PK) for client-side identity.

**File:** `client/src/lib/api.ts` (line ~147)
- Changed `id: img.id` → `id: img.image_index`

---

### 3. Placeholder Skeleton Count Fix

**Problem:** When the AI calls the MCP tool in batches (e.g., 2+2 for 4 images), each `phase: images` event carries the per-batch `imageCount` (2). On event replay, `setGenerationExpectedImages(2)` overwrites the total. After 2 images load, `2 - 2 = 0` remaining skeletons — no placeholders for the remaining images.

**Fix:** Derive expected image count from the `prompts` file (authoritative source) instead of per-batch phase events.

**File:** `client/src/hooks/useWebSocket.ts`
- Removed `setGenerationExpectedImages(message.imageCount)` from `phase: images` handler (line ~113)
- Added prompts file parsing in `file` event handler: when `fileType === 'prompts'`, parse JSON array and set `generationExpectedImages` to `prompts.length`

**Flow after fix:**
1. `startGeneration` → `parseExpectedImageCount(prompt)` → defaults to 6 (initial estimate)
2. `file` event with `prompts` JSON arrives → `setGenerationExpectedImages(N)` → corrects to actual count
3. Skeletons accurately show `N - loadedImages` remaining throughout generation
4. On refresh/replay, `prompts` file event replays → same correct count restored

---

## Also Investigated

### tsconfig.json Corruption (Not a Code Bug)

**Symptom:** `[ERROR] Unexpected end of file in JSON` in `client/tsconfig.json` causing Vite crash on restart.

**Root Cause:** VS Code's hot-exit feature can truncate open files when the editor/terminal is force-closed. Vite's file watcher detects the empty file and crashes.

**Resolution:** Cleared stale Vite/TS caches (`node_modules/.tmp/`, `node_modules/.vite/`). File was intact on re-read. Advised closing `tsconfig.json` in VS Code tabs or disabling `files.hotExit`.

---

## Files Changed

### Server
| File | Change |
|------|--------|
| `server/lib/websocket-handler.ts` | Filename-based dedup, server-assigned global index counter, removed dead counting code |

### Client
| File | Change |
|------|--------|
| `client/src/lib/api.ts` | Use `image_index` for client-side image identity (fixes C3) |
| `client/src/hooks/useWebSocket.ts` | Derive expected count from prompts file, removed per-batch phase override |

---

## Resolved Architecture Issues

| ID | Issue | Status |
|----|-------|--------|
| **C3** | Image ID namespace collision (live index vs DB autoincrement PK) | **Fixed** — client now uses `image_index` consistently |
| **New** | MCP batch index collision (batch 2 images dropped) | **Fixed** — server-assigned global index + filename dedup |
| **New** | Placeholder skeletons disappear mid-generation | **Fixed** — prompts file is source of truth for expected count |

---

## Known Issues (Carried Forward from Previous Sessions)

### 1. Event Replay Always From 0
**From:** Architecture doc (H4)
**Symptom:** Client always subscribes with `lastEventId: 0`, replaying all events from the start. Wasteful and can cause edge-case duplication.
**Status:** Not addressed. The filename-based dedup and image_index fix mitigate the worst effects.

### 2. Image Regeneration Broken End-to-End
**From:** Architecture doc (C1)
**Symptom:** `imageRefs` dropped, no server logic for single-image regeneration.
**Status:** Not addressed.

---

## Verification Log

From the test run (Vercel campaign):
- AI called MCP twice: batch 1 (2 prompts) + batch 2 (2 prompts)
- Server assigned global indices 1→4 correctly:
  ```
  [ImageEvent] Real-time image 1 ... (file: 1771594156794_1_...)
  [ImageEvent] Real-time image 2 ... (file: 1771594156794_2_...)
  [ImageEvent] Real-time image 3 ... (file: 1771594305735_1_...)
  [ImageEvent] Real-time image 4 ... (file: 1771594305735_2_...)
  ```
- Duplicates correctly skipped via filename dedup:
  ```
  [SDK Stream] Skipping duplicate "1771594156794_1_..." (already processed via EventEmitter)
  ```
- Final: `Generation complete (528154ms, 4 images)`
- All 4 images persisted to DB with correct indices and hook types

---

## Quick Reference: Key Code Locations

| Feature | File | Function/Location |
|---------|------|-------------------|
| Server image counter | `server/lib/websocket-handler.ts` | `imageCounter` in `handleGenerate`, `handleFollowUp` |
| Filename dedup | `server/lib/websocket-handler.ts` | `processedFilenames` Set in `onImageSaved` + `processSDKMessage` |
| Global index assignment | `server/lib/websocket-handler.ts` | `imageCounter.next++` in `onImageSaved` + `processSDKMessage` |
| Client image ID | `client/src/lib/api.ts` | `transformCampaign` → `id: img.image_index` |
| Expected count source | `client/src/hooks/useWebSocket.ts` | `file` event handler → parses prompts JSON |
| Skeleton rendering | `client/src/components/ResultsView.tsx` | `generationExpectedImages - campaign.images.length` |

---

## Commands to Start Next Session

```bash
# Start backend
cd server && npm run dev

# Start frontend (separate terminal)
cd client && npm run dev

# Check image data in database
sqlite3 server/data/creative_agent.db "SELECT campaign_id, image_index, hook_type, file_path FROM campaign_images ORDER BY campaign_id, image_index;"
```
