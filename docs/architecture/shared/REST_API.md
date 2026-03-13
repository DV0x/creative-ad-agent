# REST API Reference

> Part of [Architecture Documentation](../INDEX.md) | Complete endpoint reference

---

## Base URL

| Mode | Base |
|---|---|
| Local | `http://localhost:5173/api` (Vite proxy → Express on `:3001`) |
| Production | `https://creative-agent.alphasapien17.workers.dev/api` |

## Authentication

All endpoints (except `/health`) require:

```
Authorization: Bearer <clerk-jwt>
```

In local dev without `CLERK_SECRET_KEY`, auth is disabled and all requests pass as `user_id = 'anonymous'`.

---

## Campaigns

### `GET /api/campaigns`

List all campaigns for the authenticated user.

**Response:** `{ success: true, campaigns: Campaign[] }` (minimal — no files/images/messages)

```json
{
  "success": true,
  "campaigns": [
    {
      "id": "abc123",
      "user_id": "user_xxx",
      "name": "Nike Campaign",
      "status": "complete",
      "session_id": "sess-xxx",
      "created_at": "2026-03-10T...",
      "updated_at": "2026-03-10T..."
    }
  ]
}
```

### `POST /api/campaigns`

Create a new campaign.

**Body:** `{ name: string, sessionId?: string }`

**Response:** `Campaign`

### `GET /api/campaigns/:id`

Get full campaign with files, images, and messages.

**Response:**

```json
{
  "success": true,
  "campaign": { /* Campaign */ },
  "files": { "research": "...", "hooks": "...", "prompts": "..." },
  "images": [
    { "id": 1, "campaign_id": "abc", "image_index": 1, "hook_type": "stat",
      "prompt": "...", "file_path": "/images/abc/1_stat_bold.png", "version": 1 }
  ],
  "messages": [
    { "id": "msg1", "campaign_id": "abc", "role": "user",
      "content": "Create ads for nike.com", "blocks": "[]" }
  ]
}
```

### `PATCH /api/campaigns/:id`

Update campaign name or status.

**Body:** `{ name?: string, status?: string }`

### `DELETE /api/campaigns/:id`

Delete campaign and associated files/images/messages from DB. Does **not** clean up R2 objects.

### `GET /api/campaigns/:id/files/:type`

Get campaign file content. Type: `research` | `hooks` | `prompts`.

### `PUT /api/campaigns/:id/files/:type`

Update campaign file content.

**Body:** `{ content: string }`

### `GET /api/campaigns/:id/images`

List campaign images.

### `GET /api/campaigns/:id/messages`

Get chat messages for campaign.

### `POST /api/campaigns/:id/messages`

Add a chat message.

**Body:** `{ role: string, content: string, imageRefs?: string[], fileRefs?: string[] }`

### `GET /api/campaigns/:id/status`

Get generation status. Used during recovery to check if agent is still running.

**Response:**

```json
{
  "success": true,
  "status": "generating",
  "sessionId": "sess-xxx",
  "isAgentRunning": true,
  "hasEventBuffer": false
}
```

Note: `isAgentRunning` is derived from `campaign.status === 'generating'`. `hasEventBuffer` is always `false` from the REST API; real-time status comes via WebSocket.

### `POST /api/campaigns/:id/recover`

Attempt R2 recovery for a stuck campaign. Reads the completion marker from R2 and syncs missing data to D1.

**Only works for campaigns with status:** `incomplete`, `generating`, or `error`.

**Recovery flow:**
1. Verify campaign ownership (userId check)
2. Read `completion_{campaignId}.json` from R2
3. Sync images (dedup by `file_path`)
4. Sync files (only update if empty in D1)
5. Add synthetic assistant message if none exists
6. Set status → `complete`

**Response (success):**

```json
{
  "success": true,
  "recovered": true,
  "imagesAdded": 6,
  "filesUpdated": 3,
  "campaign": { /* updated campaign */ },
  "files": { "research": "...", "hooks": "...", "prompts": "..." },
  "images": [ /* campaign images */ ],
  "messages": [ /* chat messages */ ]
}
```

**Response (no marker found):**
```json
{ "success": true, "recovered": false, "reason": "no_marker" }
```

**Response (not recoverable):**
```json
{ "success": false, "recovered": false, "reason": "not_recoverable", "message": "Campaign status is 'complete', not recoverable" }
```

---

## Assets

### `GET /api/assets/folders`

List user's asset folders.

### `POST /api/assets/folders`

Create folder. **Body:** `{ name: string }`

### `PATCH /api/assets/folders/:id`

Rename folder. **Body:** `{ name: string }`

### `DELETE /api/assets/folders/:id`

Delete folder and all files within.

### `GET /api/assets/folders/:id/files`

List files in a folder.

### `POST /api/assets/upload`

Upload file. **Content-Type:** `multipart/form-data`

**Fields:** `file` (the file), `folderId` (target folder ID)

**Response:** `AssetFile`

### `GET /api/assets/files/:id`

Serve file content (binary). Used for previews and downloads.

### `DELETE /api/assets/files/:id`

Delete file from DB and storage.

---

## Images

### `GET /images/:sessionId/:filename`

Serve a generated image. The route path is `/images/{path}` where path = `{sessionId}/{filename}`.

| Mode | Source |
|---|---|
| Local | `generated-images/{sessionId}/{filename}` on disk |
| Production | R2 key `users/{userId}/images/{path}` (path = `{sessionId}/{filename}`) |

**Headers:** `Cache-Control: public, max-age=31536000, immutable`

**Auth:** Requires Bearer token (images are behind auth).

---

## Other

### `GET /health`

Health check (no auth required).

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-03-10T...",
  "auth": { "clerkKeySet": true },
  "bindings": { "d1": true, "r2": true, "do": true }
}
```

---

## Error Responses

All errors return:

```json
{
  "error": "Human-readable error message"
}
```

| Status | Meaning |
|---|---|
| 400 | Bad request (missing fields, invalid input) |
| 401 | Unauthorized (missing/invalid JWT) |
| 404 | Resource not found |
| 500 | Internal server error |

---

## See Also

- [Auth Flow](./AUTH_FLOW.md) — How JWT tokens are obtained and verified
- [Client Architecture](../client/CLIENT_ARCHITECTURE.md) — API client (`lib/api.ts`)
- [D1 Database](../cloudflare/D1_DATABASE.md) — What the API reads/writes
