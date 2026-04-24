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

**Two data paths:** (1) **Live:** stdout JSONL from agent-runner → `streamForLiveUI` → `processSDKMessage` → `image` event → WS → client renders immediately. The DO also writes to D1 inline during this pass. (2) **Reconciliation:** `/app/turn-result.json` → `tryFinalize` → `reconcileImages` inserts any images that were in the container's tracking jsonl but never landed in D1 from the stream. The stream is the fast path; reconciliation is the safety net.

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
2. **Dual mode** — text-to-image by default (`fal-ai/nano-banana-pro`), but when `referenceImageUrls` are provided, auto-routes to the edit endpoint (`fal-ai/nano-banana-pro/edit`) with `image_urls`. The reference image provides the product appearance; the text prompt describes the ad scene/composition
3. Supports 1K/2K/4K resolution, multiple aspect ratios, web search grounding
4. Downloads generated images from fal.ai URLs
5. Saves to local path and appends to `/app/generated-images.jsonl` tracking file

### Image Naming

Actual format from `cloudflare/sandbox/nano-banana-mcp.ts:262`:

```
{timestamp}_{i+1}_{sanitizedPrompt}.{ext}
```

where `timestamp = Date.now()` for the batch, `i+1` is the 1-based index within the MCP tool call, and `sanitizedPrompt` is the prompt lowercased, whitespace→dashes, truncated. **The filename does NOT contain the hookType** — hookType is derived at the DO side from the global `imageIndex` via `getHookTypeForIndex()` and persisted to `campaign_images.hook_type` in D1.

Example: `1729530822000_1_runners-who-skip-leg-day.png`

---

## 2. Storage

### Local Mode (`server/`)

```
{projectRoot}/generated-images/{sessionId}/{timestamp}_{i+1}_{sanitized}.png
```

Written directly to the local filesystem by the MCP tool (which uses `IMAGE_OUTPUT_DIR` when set, else a fallback relative to the Express process). Served via Express static file handler at `/images/{sessionId}/{filename}`.

### Production Mode (Cloudflare)

```
/mnt/r2/images/{sessionId}/{timestamp}_{i+1}_{sanitized}.png
   ↓ (s3fs FUSE mount — upload triggered on fd close)
R2: users/{userId}/images/{sessionId}/{timestamp}_{i+1}_{sanitized}.png
```

The sandbox container has R2 mounted at `/mnt/r2` via s3fs, with `prefix: /users/{userId}` — so writes are automatically scoped. The MCP tool calls `fs.writeFileSync` then `fs.statSync` to verify the byte count reached the mount (catches silent FUSE failures).

`sessionId` is optional — if the orchestrator passes a sessionId when invoking the MCP tool, images go into a sub-folder; without it they land directly under `/mnt/r2/images/`. Either way the URL emitted is `/images/{sessionId?}/{filename}`.

### FUSE Flush Gotchas

- **`writeFileSync` is safe** — opens + writes + closes, triggering s3fs upload on close
- **Open file descriptors (like SDK JSONL)** only upload on `close()`/`fsync(fd)`/`unmount` — NOT on Linux `sync`
- **`unmountBucket()` is the only guaranteed flush** for all open files
- The DO calls `unmountBucket()` before `sandbox.destroy()` to ensure all files reach R2

---

## 3. Event Emission

The MCP tool returns a JSON response with an `images` array. The SDK wraps this as a `tool_result` message. The agent-runner prints all SDK messages to stdout as JSON lines. The DO's `processSDKMessage()` extracts images from the `tool_result` and emits WebSocket events:

```json
{"type":"image","id":"image_1","urlPath":"/images/abc/1729530822000_1_runners-who-skip-leg-day.png","prompt":"...","hookType":"stat","imageIndex":1,"filename":"1729530822000_1_runners-who-skip-leg-day.png"}
```

Pipeline:
```
MCP return → SDK tool_result → agent-runner stdout (JSONL) → streamProcessLogs()
→ parseSSEStream() (frame splitter) → streamForLiveUI → processSDKMessage()
→ emitEvent({type:'image', …}) → EventBuffer → WebSocket → client
```

### `imageCounter` — Global Image Index

The stream-parse context carries an `imageCounter: { next: number }` (`cloudflare/src/lib/sdk-message-parser.ts:25`). It seeds with `max(storedMaxIndex, dbMaxIndex) + 1` on new generations, and `existingImageCount + 1` on follow-up fast-path — both choices defined in `campaign-session.ts:1522` (`runGeneration`) and `:1735` (`runFollowUpFast`). Every extracted image gets `globalIndex = imageCounter.next++`; `hookType = getHookTypeForIndex(globalIndex)`.

### Filename-level dedup

The parser also holds `processedFilenames: Set<string>` (`sdk-message-parser.ts:22`). Because the SDK may yield a `tool_result` twice (streaming + final), the parser skips any image whose filename has already been processed in this context — so the same image never inserts twice into D1.

### Turn-Result Reconciliation

The agent-runner writes `/app/turn-result.json` at the end of each turn containing the `images` array (from `/app/generated-images.jsonl`) and a `files` object (research, hooks, prompts content). The DO's `tryFinalize` reads this file via `sandbox.readFile` (Layer 2 of completion detection — see [DURABLE_OBJECT.md](../cloudflare/DURABLE_OBJECT.md#completion-detection--the-real-four-layers)), validates `campaignId` + `requestId`, then calls `reconcileImages` + `reconcileFiles`. Reconciliation dedups against D1 by `file_path` so images already streamed aren't re-inserted. The stream is the fast path; reconciliation is the safety net.

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

1. **Browser HTTP cache hides missing R2 data** — `Cache-Control: immutable` means browser serves stale data even after hard refresh. Use `fetch(url, { cache: 'no-store' })` to probe whether the R2 object actually exists.
2. **No R2 cleanup on campaign deletion** — `DELETE /api/campaigns/:id` removes DB rows but leaves R2 objects orphaned. R2 storage cost grows over time. See [KNOWN_ISSUES.md](../cloudflare/KNOWN_ISSUES.md).
3. **Per-env mount mismatch risk** — The container mounts `env.R2_BUCKET_NAME` and the Worker serves via `env.R2_BUCKET`. If those point at different buckets (misconfigured env), writes and reads land on different storage. Always deploy with `--env {staging|production}`.

---

## See Also

- [AI Agent Pipeline](./AI_AGENT_PIPELINE.md) — Orchestrator prompts and MCP tools
- [R2 Storage](../cloudflare/R2_STORAGE.md) — Key structure, FUSE mount details
- [Streaming Pipeline](../cloudflare/STREAMING_PIPELINE.md) — How image events reach the client
- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — AuthImage, ImageCard, ImageLightbox
