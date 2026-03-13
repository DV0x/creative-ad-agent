# D1 Database

> Part of [Architecture Documentation](../INDEX.md) | **Schema:** `cloudflare/schema.sql` | **Access layer:** `cloudflare/src/db/`

---

## Schema

Both local (SQLite) and production (D1) use the same schema.

### `campaigns`

```sql
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating'
    CHECK (status IN ('generating', 'complete', 'incomplete', 'error', 'cancelled')),
  session_id TEXT,          -- WebSocket session ID
  sdk_session_id TEXT,      -- Claude SDK session ID (for resume)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- trigger-updated
);
```

Indexes: `user_id`, `status`, `session_id`, `sdk_session_id`

### `campaign_files`

```sql
CREATE TABLE campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL CHECK (file_type IN ('research', 'hooks', 'prompts')),
  content TEXT DEFAULT '',
  is_ready INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, file_type)
);
```

### `campaign_images`

```sql
CREATE TABLE campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,     -- 1-6
  hook_type TEXT NOT NULL
    CHECK (hook_type IN ('stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast')),
  prompt TEXT,
  file_path TEXT NOT NULL,          -- /images/{campaignId}/{filename}
  version INTEGER DEFAULT 1,        -- increments on follow-up regeneration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);
```

### `messages`

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  image_refs TEXT,       -- JSON array of image IDs (unused currently)
  file_refs TEXT,        -- JSON array of file refs (unused currently)
  blocks TEXT,           -- JSON: MessageBlock[] for thinking blocks
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `asset_folders` / `asset_files`

```sql
CREATE TABLE asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,     -- R2 key or local path
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document', 'other')),
  size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Triggers

- `campaigns_updated_at` — auto-updates `updated_at` on campaign changes
- `campaign_files_updated_at` — auto-updates `updated_at` on file changes

### Status Values

```
campaigns.status:
  'generating' → actively running (or stuck — check generation age)
  'complete'   → generation finished successfully
  'incomplete' → timed out, errored, or interrupted (recoverable via /recover)
  'error'      → unrecoverable failure
  'cancelled'  → user cancelled
```

### D1 Gotchas

1. **Schema is NOT auto-deployed** — must apply manually via `wrangler d1 execute --file=schema.sql`
2. **`sdk_session_id`** is critical for follow-ups — if missing, follow-up starts fresh (loses context)
3. **`blocks` column** stores JSON `MessageBlock[]` — rendered by `ChatMessage` component after refresh
4. **`campaign_images` is the image table** — NOT `files`. Common confusion because both exist

---

## Access Layer (`cloudflare/src/db/`)

Each module exports typed functions. All queries filter by `user_id`.

### `campaigns.ts`

| Function | What it does |
|---|---|
| `createCampaign(db, userId, name, sessionId)` | INSERT with generated UUID |
| `getCampaignById(db, campaignId, userId)` | SELECT with user_id filter |
| `getCampaignBySessionId(db, sessionId)` | SELECT by session_id |
| `getCampaignsByUser(db, userId)` | SELECT all for user (no files/images) |
| `getRecentCampaigns(db, userId, limit)` | SELECT recent campaigns (default 10) |
| `updateCampaignStatus(db, campaignId, status)` | UPDATE status only |
| `updateCampaignName(db, campaignId, name)` | UPDATE name only |
| `updateCampaignSessionId(db, campaignId, sessionId)` | UPDATE session_id |
| `updateSdkSessionId(db, campaignId, sdkSessionId)` | SET sdk_session_id |
| `getSdkSessionId(db, campaignId)` | GET sdk_session_id |
| `deleteCampaign(db, campaignId)` | DELETE (cascades) |

### `files.ts`

| Function | What it does |
|---|---|
| `getCampaignFile(db, campaignId, fileType)` | SELECT single file |
| `getCampaignFiles(db, campaignId)` | SELECT all files for campaign |
| `updateCampaignFile(db, campaignId, fileType, content)` | UPSERT (INSERT OR REPLACE) |
| `markFileReady(db, campaignId, fileType)` | SET `is_ready = 1` |
| `areAllFilesReady(db, campaignId)` | Check if all 3 files have `is_ready = 1` |

### `images.ts`

| Function | What it does |
|---|---|
| `addCampaignImage(db, { campaignId, imageIndex, hookType, prompt?, filePath })` | INSERT |
| `getCampaignImages(db, campaignId)` | SELECT all images |
| `getLatestCampaignImages(db, campaignId)` | SELECT latest version per image_index (dedup) |
| `getImageCount(db, campaignId)` | COUNT(*) |
| `deleteImage(db, imageId)` | DELETE single image |

### `messages.ts`

| Function | What it does |
|---|---|
| `addMessage(db, { campaignId, role, content, blocks? })` | INSERT with generated UUID |
| `getMessages(db, campaignId)` | SELECT ordered by created_at |
| `getMessage(db, id)` | SELECT single message by ID |
| `getLastAssistantMessage(db, campaignId)` | SELECT last assistant message |
| `updateMessageContent(db, id, content)` | UPDATE content only |
| `deleteMessage(db, id)` | DELETE single message |

### `assets.ts`

| Function | What it does |
|---|---|
| `createFolder(db, userId, name)` | INSERT folder |
| `getFoldersByUser(db, userId)` | SELECT all folders for user |
| `getFolder(db, id, userId)` | SELECT single folder |
| `renameFolder(db, id, name)` | UPDATE name |
| `deleteFolder(db, id)` | DELETE (cascades files) |
| `addFile(db, folderId, name, filePath, fileType, size?)` | INSERT file |
| `getFilesByFolder(db, folderId)` | SELECT files in folder |
| `getFile(db, id)` | SELECT single file |
| `deleteFile(db, id)` | DELETE file |
| `getFilesCount(db, folderId)` | COUNT files in folder |

### `utils.ts`

| Function | What it does |
|---|---|
| `generateId(prefix)` | Generate UUID with prefix (e.g., `campaign_abc123`) |

---

## Querying in Production

```bash
npx wrangler d1 execute creative-agent-db --remote --command="<SQL>"
```

See [Debugging Guide](../ops/DEBUGGING.md) for common queries.

---

## See Also

- [R2 Storage](./R2_STORAGE.md) — File storage complement to D1
- [Durable Object](./DURABLE_OBJECT.md) — Primary consumer of DB layer
- [REST API](../shared/REST_API.md) — API endpoints that expose DB data
