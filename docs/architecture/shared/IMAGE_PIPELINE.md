# Image Pipeline

> Part of [Architecture Documentation](../INDEX.md) | Generation → Storage → Serving → Display

---

## Overview

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Prompts  │───→│ fal.ai   │───→│ Download │───→│ FUSE/R2  │───→│ D1 Meta  │
│ .json    │    │ API call │    │ image    │    │ write    │    │ insert   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                      │               │
                                                      │          WS event
                                                      │               │
                                                      ▼               ▼
                                                ┌──────────┐    ┌──────────┐
                                                │ Worker   │    │ Client   │
                                                │ serves   │←───│ AuthImage│
                                                │ from R2  │    │ fetch+JWT│
                                                └──────────┘    └──────────┘
```

**Two data paths:** (1) Real-time: SSE stream → `processSDKMessage` → `image` event → WS → client renders immediately. (2) Reconciliation: `turn-result.json` → `reconcileImages()` → catch any images missed by SSE framing.

---

## 1. Generation

### Prompt Creation

The orchestrator agent creates a `prompts.json` file containing 6 image prompts (one per hook type):

```json
[
  {
    "prompt": "A bold typographic ad showing '47% of runners...'",
    "hookType": "stat",
    "aspectRatio": "1:1",
    "negativePrompt": "text errors, blurry"
  },
  // ... 5 more (story, fomo, curiosity, callout, contrast)
]
```

### MCP Tool: `nano-banana`

The agent calls `mcp__nano-banana__generate_ad_images` which:

1. Sends prompts to **fal.ai API** (Nano Banana Pro model — Google Gemini image model)
2. **Dual mode** — text-to-image by default (`fal-ai/nano-banana-pro`), but when `referenceImageUrls` are provided, auto-routes to the edit endpoint (`fal-ai/nano-banana-pro/edit`) with `image_urls` for style/subject consistency
3. Supports 1K/2K/4K resolution, multiple aspect ratios, web search grounding
4. Downloads generated images from fal.ai URLs
5. Saves to local path and appends to `/app/generated-images.jsonl` tracking file

### Image Naming

```
{index}_{hookType}_{sanitized-name}.png
```

Example: `1_stat_bold-stat-ad.png`, `2_story_runner-journey.png`

---

## 2. Storage

### Local Mode

```
generated-images/{sessionId}/1_stat_bold-stat-ad.png
```

Written directly to disk by the MCP tool. Served via Express static file handler.

### Production Mode

```
/mnt/r2/images/{sessionId}/1_stat_bold-stat-ad.png
   ↓ (s3fs FUSE mount)
R2: users/{userId}/images/{sessionId}/1_stat_bold-stat-ad.png
```

The sandbox container has R2 mounted at `/mnt/r2` via s3fs FUSE. The MCP tool writes files to the FUSE mount, and s3fs uploads them to R2.

### FUSE Flush Gotchas

- **`writeFileSync` is safe** — opens + writes + closes, triggering s3fs upload on close
- **Open file descriptors (like SDK JSONL)** only upload on `close()`/`fsync(fd)`/`unmount` — NOT on Linux `sync`
- **`unmountBucket()` is the only guaranteed flush** for all open files
- The DO calls `unmountBucket()` before `sandbox.destroy()` to ensure all files reach R2

---

## 3. Event Emission

The MCP tool returns a JSON response with an `images` array. The SDK wraps this as a `tool_result` message. The agent-runner prints all SDK messages to stdout as JSON lines. The DO's `processSDKMessage()` extracts images from the `tool_result` and emits WebSocket events:

```json
{"type":"image","id":"image_1","urlPath":"/images/abc/1_stat_bold-stat-ad.png","prompt":"...","hookType":"stat","imageIndex":1,"filename":"1_stat_bold-stat-ad.png"}
```

Pipeline:
```
MCP return → SDK tool_result → agent-runner stdout → streamProcessLogs()
→ parseSSEStream() → processSDKMessage() → emitEvent() → WebSocket → client
```

### `imageCounter` — Global Image Index

The `processSDKMessage()` parser maintains an `imageCounter: { next: number }` that increments across turns. Each image gets a sequential global index (1, 2, 3, ...) which maps to a hook type via `getHookTypeForIndex()`. On follow-ups, the counter starts at `existingImageCount + 1` so indices never collide with previous turns.

### Turn-Result Reconciliation

The agent-runner writes `/app/turn-result.json` at the end of each turn, containing an `images` array (from the `/app/generated-images.jsonl` tracking file) and a `files` object (research, hooks, prompts content). After `waitForLog('turn_complete')` fires, the DO calls `reconcileImages()` which reads this file, deduplicates against existing D1 records by `file_path`, and inserts any images missed during SSE streaming. It also calls `reconcileFiles()` with the same file to persist campaign files to D1. This is the reliable data path — SSE streaming is best-effort for live UI only.

---

## 4. Serving

### Local

```
GET /images/{campaignId}/{filename}
```

Express serves from `generated-images/` directory.

### Production

```
GET /images/{campaignId}/{filename}
```

Worker handler:
1. Extract userId from JWT
2. Build R2 key: `users/{userId}/images/{filename-path}`
3. Fetch from R2 bucket
4. Return with `Content-Type: image/png` and `Cache-Control: public, max-age=31536000, immutable`

### URL Stripping

The image URL stored in D1 (`campaign_images.file_path`) is the relative path: `/images/abc/1_stat.png`. The MCP tool may output absolute sandbox paths (`/mnt/r2/images/sess/1_stat.png`) — these are stripped to relative paths during event processing.

---

## 5. Client Display

### AuthImage Component

Plain `<img>` tags can't send Authorization headers. The `AuthImage` component:

1. Fetches image via `authFetchBlob(url)` — adds Bearer token to request
2. Creates a blob URL from the response
3. Sets blob URL as `<img src>`
4. Cleans up blob URL on unmount/src change (prevents memory leaks)

### ImageCard

Renders each campaign image in a grid:
- Checkbox for selection
- Download button (uses `authFetchBlob` for authenticated download)
- Click to open lightbox

### ImageLightbox

Full-screen image viewer:
- Keyboard navigation (← →)
- Uses `AuthImage` for authenticated loading
- Swipe support on mobile

### Skeleton Cards

While generating, `ResultsView` shows skeleton placeholder cards. Count is based on `generationExpectedImages` from the store (parsed from the prompts file).

---

## 6. Image Data Model

```typescript
// In D1/SQLite
campaign_images {
  id: INTEGER PRIMARY KEY
  campaign_id: TEXT
  image_index: INTEGER        // 1-6
  hook_type: TEXT              // stat | story | fomo | curiosity | callout | contrast
  prompt: TEXT                 // Image generation prompt
  file_path: TEXT              // /images/{campaignId}/{filename}
  version: INTEGER             // Increments on follow-up regeneration
  created_at: TEXT
}
```

```typescript
// Image event emitted by processSDKMessage() over WebSocket
{
  type: 'image'
  id: string                  // "image_1", "image_2", ...
  urlPath: string             // /images/{sessionId}/{filename} (stripped of /mnt/r2 prefix)
  prompt: string
  filename: string
  hookType: HookType
  imageIndex: number          // global index from imageCounter
}
```

### Image Versioning on Follow-Ups

When the same `image_index` is regenerated during a follow-up, `addCampaignImage()` auto-increments the version: it queries `MAX(version)` for that `(campaign_id, image_index)` pair and inserts `version + 1`. The client uses `getLatestCampaignImages()` which joins on `MAX(version)` per index, so only the latest version of each image is displayed.

### Hook Types

| Index | Hook Type | Description |
|---|---|---|
| 1 | `stat` | Data-driven, statistic-based hook |
| 2 | `story` | Narrative, storytelling hook |
| 3 | `fomo` | Fear of missing out / urgency |
| 4 | `curiosity` | Question or intrigue-based |
| 5 | `callout` | Direct challenge to the viewer |
| 6 | `contrast` | Before/after or comparison |

---

## Known Issues

1. ~~`writeCompletionMarker()` scans ALL user images`~~ — **FIXED (Session 55)**. Now reads `/app/generated-images.jsonl` tracking file (per-turn only), no longer scans `/mnt/r2/images/`
2. **Browser HTTP cache hides missing R2 data** — `Cache-Control: immutable` means browser serves stale data even after hard refresh
3. **No R2 cleanup on campaign deletion** — images persist in R2 after DB records are deleted

---

## See Also

- [AI Agent Pipeline](./AI_AGENT_PIPELINE.md) — Orchestrator prompts and MCP tools
- [R2 Storage](../cloudflare/R2_STORAGE.md) — Key structure, FUSE mount details
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — How image events reach the client
- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — AuthImage, ImageCard, ImageLightbox
