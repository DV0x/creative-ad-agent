# Session Summary — 2026-02-21

## What We Did

### 1. Architecture Doc Cleanup
- Removed all fixed bugs from `ARCHITECTURE.md` (C1-C3, H1-H6, and all strikethrough items)
- Cleaned sections 9 and 10 — only active issues remain
- Renumbered sections: 9.1 Discrepancies, 9.2 Dead Code, 9.3 Race Conditions, 9.4 Security
- Verified R1 and R2 race conditions are real (confirmed via code review)

### 2. Created `docs/FUTURE_REVIEW.md`
Tracks deferred issues:
- R1: Campaign ID window (file saves can 404 between local/server ID swap)
- R2: Dual image event path (DB orphan rows from EventEmitter + SDK tool_result race)
- Image regeneration scaling (Phase 2 — stateless operations)
- Batch download (no onClick handler)
- Batch operations (no bulk API)

### 3. Wired Image Attachments Through WebSocket Pipeline
**Goal:** When users @ mention uploaded asset images, pass them to the AI agent so it can see them and use them as style references for image generation.

**Files modified:**

| File | Change |
|------|--------|
| `client/src/types/websocket.ts` | Added `assetFileIds?: string[]` to `WSClientMessage` |
| `client/src/hooks/useWebSocket.ts` | `generate()` and `followUp()` accept and forward `assetFileIds` |
| `client/src/components/chat/ChatSidebar.tsx` | Filters `assetRefs` for `file_` IDs, passes to generate/followUp |
| `client/src/components/chat/MobileChatDrawer.tsx` | Same as ChatSidebar |
| `server/lib/websocket-handler.ts` | Added `resolveAssetAttachments()` — reads files from disk, base64 encodes for Claude, uploads to `fal.storage.upload()` for public URLs. Updated `handleGenerate` and `handleFollowUp` to resolve assets and prepend reference URLs to prompt. Fixed pre-existing TS error (closure narrowing on `localSessionId`). |

**How it works:**
1. Client sends `assetFileIds: ['file_xxx']` over WebSocket
2. Server looks up file in DB → reads from `/uploads/` → base64 encodes
3. Base64 sent as multimodal attachment so Claude can **see** the image
4. File uploaded to `fal.storage.upload()` → public URL returned
5. Public URLs appended to prompt so agent can pass them as `referenceImageUrls` to MCP
6. MCP auto-routes to `fal-ai/nano-banana-pro/edit` for style transfer

### 4. Fixed Pre-existing TypeScript Error
`websocket-handler.ts` line 1218 — `localSessionId` (type `string | null`) wasn't narrowed inside `setTimeout` closure. Fixed by capturing in a `const sid`.

---

## Current Blocker: File Upload Is a Stub

**The image attachment pipeline is fully wired but doesn't work end-to-end because file uploads never reach the server.**

### The Problem

`client/src/components/assets/FileUpload.tsx` line 162-168:
```typescript
addFileToFolder(folderId, {
  name: uploadFile.name,
  url: uploadFile.preview, // ← Object URL (blob:http://...), browser-only
  type: uploadFile.type,
  size: uploadFile.size
})
```

- Uses `URL.createObjectURL()` — files only exist in browser memory
- Store generates client-side IDs (`file_xxx`) via `generateId('file')`
- Never calls `POST /api/assets/upload` (the server endpoint exists and works)
- Files vanish on page refresh
- When server receives `assetFileIds: ['file_xxx']`, `db.getFile()` returns `undefined`

### What Needs to Happen

Wire `FileUpload.tsx` to call the real server upload endpoint:

1. **Upload to server:** Call `POST /api/assets/upload` (multer, 10MB limit, already implemented in `server/routes/assets.ts`)
2. **Use server response:** The endpoint returns `{ id, name, file_path, file_type, size }` — use this instead of client-generated data
3. **Store server ID:** The file ID from the server (`file_xxx` from `generateId('file')` in `db/assets.ts`) must be what ends up in the Zustand store, so when the user @ mentions it, the correct server-side ID is sent over WebSocket
4. **URL for display:** Use `/api/assets/files/:id` for the file URL (already the pattern in `api.ts:165`)

### Key Files for Implementation

| File | What to do |
|------|-----------|
| `client/src/components/assets/FileUpload.tsx` | Replace object URL stub with real `POST /api/assets/upload` call |
| `client/src/lib/api.ts` | Add/verify `uploadFile()` function that calls the upload endpoint |
| `client/src/store/index.ts` | `addFileToFolder` should accept server-returned file data (with server ID) instead of generating client IDs |
| `server/routes/assets.ts` | Already implemented — `POST /api/assets/upload` with multer. Returns file metadata. Needs `folderId` in request body. |

### Server Upload Endpoint (Already Exists)

`POST /api/assets/upload` (`server/routes/assets.ts` lines 250-308):
- Accepts: `multipart/form-data` with `file` field + `folderId` body param
- Storage: `/uploads/{timestamp}-{random}.{ext}`
- Allowed: jpeg, png, gif, webp, pdf, text, markdown (10MB limit)
- Returns: `{ id, folder_id, name, file_path, file_type, size, created_at }`

### Verification Steps After Fix

1. Upload an image via the asset panel → confirm it persists across page refresh
2. @ mention the uploaded image in a chat prompt
3. Check server logs for `🖼️ Resolved asset:` with fal.ai URL
4. Verify the generated image uses the edit endpoint (`Mode: edit (with references)`)
5. Test without assets — should work exactly as before (backwards compatible)
