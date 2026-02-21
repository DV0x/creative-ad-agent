# Session Summary — 2026-02-21 (Session 2)

## What We Did

### 1. Fixed File Upload — No Longer a Stub

**Problem:** `FileUpload.tsx` used `URL.createObjectURL()` — files only existed in browser memory, vanished on refresh, and the server couldn't resolve `assetFileIds` sent over WebSocket.

**Solution:** Wired the upload dialog to the real `POST /api/assets/upload` endpoint.

**Files modified:**

| File | Change |
|------|--------|
| `client/src/lib/api.ts` | Added `assetsApi.uploadFile(file, folderId)` — sends `FormData` to server, returns transformed `AssetFile` with server-generated ID and `/api/assets/files/:id` URL |
| `client/src/store/index.ts` | Changed `addFileToFolder` signature from `Omit<AssetFile, 'id' \| 'folderId' \| 'createdAt'>` to `Omit<AssetFile, 'folderId'>` — accepts server-provided `id` and `createdAt` instead of generating client-side ones |
| `client/src/components/assets/FileUpload.tsx` | Rewired `handleUpload` to call `assetsApi.uploadFile()`, use `createFolderAsync` (server-synced) instead of local-only `addFolder`, added `isUploading` state with button feedback |

**How it works now:**
1. User selects files in the upload dialog
2. Each file is `POST`ed to `/api/assets/upload` as `FormData`
3. Server saves file to `/uploads/`, persists metadata in SQLite
4. Server returns `{ id, folder_id, name, file_path, file_type, size, created_at }`
5. Client stores the server-generated file (with server ID) in Zustand
6. Files persist across refresh — loaded from DB on app init via `assetsApi.getFiles()`
7. When user @ mentions a file, the correct server-side ID is sent over WebSocket
8. Server resolves: DB lookup → disk read → base64 for Claude + fal.storage URL for MCP

### 2. Fixed Upload Target Folder Bug

**Problem:** Clicking "Upload Files" button called `setIsOpen(true)` directly, bypassing `handleOpenChange()` which initializes `targetFolderId`. Result: every upload created a new "Uploads" folder instead of using the selected folder.

**Fix:** Changed button's `onClick` from `() => setIsOpen(true)` to `() => handleOpenChange(true)`.

### 3. Collapsible Campaigns Section in Asset Drawer

**Problem:** The CAMPAIGNS list in the left sidebar had ~20 campaigns taking up all vertical space, pushing the ASSETS section off-screen.

**Fix:** Made the CAMPAIGNS section header clickable to collapse/expand the campaign list.

| File | Change |
|------|--------|
| `client/src/components/assets/AssetDrawer.tsx` | Added `isCollapsed` state to `CampaignsSection`. Header now has a chevron + click handler. Collapsed state shows "CAMPAIGNS (N)" badge. Auto-expands when creating a new campaign. |

### 4. Fixed Vite Phantom Reload Loop

**Problem:** Vite dev server kept detecting phantom changes to `tsconfig.json` and `.env`, triggering repeated HMR reloads and full server restarts. Caused by iCloud syncing `~/Documents/` and touching file metadata.

**Fix:** Added `server.watch.ignored` to `vite.config.ts` to ignore `tsconfig.json` and `.env` in the file watcher.

| File | Change |
|------|--------|
| `client/vite.config.ts` | Added `watch: { ignored: ['**/tsconfig.json', '**/.env'] }` to server config |

### 5. Updated Architecture Doc

Updated `docs/ARCHITECTURE.md` to reflect all changes:
- Section 5.7: Asset panel now describes collapsible campaigns and server-persisted uploads
- Section 5.9: Added `uploadFile` to assets API method list
- Section 7.4: Rewrote asset upload flow to show real server upload pipeline
- Section 9.2: Removed `FileUpload` from dead code list
- Section 10.1: Removed "File upload" from incomplete features

---

## End-to-End Pipeline Status

The full image attachment pipeline is now complete:

```
Upload image → Server persists (disk + SQLite)
    → Page refresh: files loaded from DB ✓
    → @ mention in chat: server-side file ID sent over WebSocket ✓
    → Server resolves: DB lookup → base64 for Claude + fal.storage URL ✓
    → Claude sees the image + MCP gets reference URL for style transfer ✓
```

## What's Left (from previous session)

All items in `docs/FUTURE_REVIEW.md` remain:
- R1: Campaign ID window race condition
- R2: Dual image event path race condition
- Phase 2: Stateless image operations
- Batch download (no onClick handler)
- Batch operations (no bulk API)
