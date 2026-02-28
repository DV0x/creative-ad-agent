# Phase 1: Cloudflare Worker Project + D1 Data Layer

> Completed: 2026-02-28

---

## What Was Built

A new `cloudflare/` directory at the project root containing the Cloudflare Worker project with async D1 data access layer. The existing `server/` remains untouched for local dev during migration.

## Cloudflare Infrastructure (Pre-existing)

| Resource | Name | ID / Details |
|---|---|---|
| **Account** | Alphasapien17@gmail.com | `091650847ca6a1d9bb40bee044dfdc91` |
| **D1 Database** | `creative-agent-db` | `ddcd29d7-632c-4017-8f3b-9de6cdd8c5fe` |
| **D1 Staging** | `creative-agent-db-staging` | `04306cf6-5669-42b0-8182-fb5fd01cec95` |
| **R2 Bucket** | `creative-agent-assets` | Production |
| **R2 Staging** | `creative-agent-assets-staging` | Staging |
| **Worker** | `creative-agent` | `https://creative-agent.alphasapien17.workers.dev` |

## File Structure

```
cloudflare/
├── wrangler.jsonc              # Worker config — D1, R2, DO bindings
├── package.json                # wrangler, @cloudflare/workers-types
├── tsconfig.json               # Strict TS for Worker environment
├── schema.sql                  # D1 schema reference (version-controlled)
│
└── src/
    ├── index.ts                # Worker entry: /health + /test/db endpoints
    ├── env.d.ts                # Env interface (D1, R2, DO, secrets)
    │
    └── db/                     # Async D1 access layer
        ├── utils.ts            # generateId(prefix) utility
        ├── campaigns.ts        # 11 functions
        ├── files.ts            # 5 functions
        ├── images.ts           # 5 functions
        ├── messages.ts         # 6 functions + block types
        ├── assets.ts           # 9 functions
        └── index.ts            # Barrel exports
```

## D1 Schema (6 Tables)

All tables, indexes, triggers, and constraints are deployed and verified.

```
campaigns          — id, user_id, name, status, session_id, sdk_session_id, created_at, updated_at
campaign_files     — id, campaign_id, file_type, content, is_ready, updated_at
campaign_images    — id, campaign_id, image_index, hook_type, prompt, file_path, version, created_at
messages           — id, campaign_id, role, content, image_refs, file_refs, blocks, created_at
asset_folders      — id, user_id, name, created_at
asset_files        — id, folder_id, name, file_path, file_type, size, created_at
```

**Constraints**: CHECK on status/role/file_type/hook_type, FOREIGN KEY with CASCADE DELETE, UNIQUE composites on (campaign_id, file_type) and (campaign_id, image_index, version).

**Triggers**: `campaigns_updated_at`, `campaign_files_updated_at` — auto-update `updated_at` on row changes.

**Indexes**: 9 indexes on user_id, status, session_id, sdk_session_id, campaign_id, folder_id.

## DB Layer: Sync → Async Conversion

Every function from `server/lib/db/*.ts` was ported to `cloudflare/src/db/*.ts` with these mechanical changes:

| better-sqlite3 (sync) | D1 (async) |
|---|---|
| `db.prepare(sql).all(args)` | `(await db.prepare(sql).bind(args).all()).results` |
| `db.prepare(sql).get(args)` | `await db.prepare(sql).bind(args).first()` |
| `db.prepare(sql).run(args)` | `await db.prepare(sql).bind(args).run()` |
| Module-global `import { db }` | `db: D1Database` as first parameter |
| `db.transaction(fn)` | `db.batch([stmt1, stmt2, ...])` |
| Returns `T` | Returns `Promise<T>` |
| Returns `undefined` for not-found | Returns `null` for not-found |

### All 36 Functions

**campaigns.ts** (11):
- `getCampaignsByUser(db, userId)` → `Promise<Campaign[]>`
- `getCampaignById(db, id, userId)` → `Promise<Campaign | null>`
- `getCampaignBySessionId(db, sessionId)` → `Promise<Campaign | null>`
- `createCampaign(db, userId, name, sessionId?)` → `Promise<Campaign>` — uses `db.batch()` for campaign insert + 3 file inserts
- `updateCampaignStatus(db, id, status)` → `Promise<void>`
- `updateCampaignSessionId(db, id, sessionId)` → `Promise<void>`
- `updateCampaignName(db, id, name)` → `Promise<void>`
- `deleteCampaign(db, id)` → `Promise<void>`
- `updateSdkSessionId(db, campaignId, sdkSessionId)` → `Promise<void>`
- `getSdkSessionId(db, campaignId)` → `Promise<string | null>`
- `getRecentCampaigns(db, userId, limit?)` → `Promise<Campaign[]>`

**files.ts** (5):
- `getCampaignFiles(db, campaignId)` → `Promise<CampaignFile[]>`
- `getCampaignFile(db, campaignId, fileType)` → `Promise<CampaignFile | null>`
- `updateCampaignFile(db, campaignId, fileType, content)` → `Promise<void>`
- `markFileReady(db, campaignId, fileType)` → `Promise<void>`
- `areAllFilesReady(db, campaignId)` → `Promise<boolean>`

**images.ts** (5):
- `getCampaignImages(db, campaignId)` → `Promise<CampaignImage[]>`
- `getLatestCampaignImages(db, campaignId)` → `Promise<CampaignImage[]>`
- `addCampaignImage(db, input)` → `Promise<CampaignImage>` — sequential: get max version, then insert
- `getImageCount(db, campaignId)` → `Promise<number>`
- `deleteImage(db, imageId)` → `Promise<void>`

**messages.ts** (6):
- `getMessages(db, campaignId)` → `Promise<Message[]>`
- `getMessage(db, id)` → `Promise<Message | null>`
- `addMessage(db, input)` → `Promise<Message>` — serializes imageRefs, fileRefs, blocks to JSON
- `updateMessageContent(db, id, content)` → `Promise<void>`
- `deleteMessage(db, id)` → `Promise<void>`
- `getLastAssistantMessage(db, campaignId)` → `Promise<Message | null>`

**assets.ts** (9):
- `getFoldersByUser(db, userId)` → `Promise<AssetFolder[]>`
- `getFolder(db, id, userId)` → `Promise<AssetFolder | null>`
- `createFolder(db, userId, name)` → `Promise<AssetFolder>`
- `renameFolder(db, id, name)` → `Promise<void>`
- `deleteFolder(db, id)` → `Promise<void>`
- `getFilesByFolder(db, folderId)` → `Promise<AssetFile[]>`
- `getFile(db, id)` → `Promise<AssetFile | null>`
- `addFile(db, folderId, name, filePath, fileType, size?)` → `Promise<AssetFile>`
- `getFilesCount(db, folderId)` → `Promise<number>`

### Shared Types (identical to server/lib/db/)

- `Campaign`, `CampaignFile`, `FileType`, `CampaignImage`, `HookType`, `AddImageInput`
- `Message`, `AddMessageInput`, `MessageBlock`, `TextBlockData`, `ThinkingBlockData`, `ThinkingChild`, `StatusBlockData`
- `AssetFolder`, `AssetFile`

## Wrangler Config

```jsonc
{
  "name": "creative-agent",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-01",
  "compatibility_flags": ["nodejs_compat"],  // wrangler v4 (not node_compat)
  "d1_databases": [{ "binding": "DB", "database_name": "creative-agent-db", "database_id": "ddcd29d7-..." }],
  "r2_buckets": [{ "binding": "R2_BUCKET", "bucket_name": "creative-agent-assets" }],
  "durable_objects": { "bindings": [{ "name": "CAMPAIGN_SESSION", "class_name": "CampaignSession" }] },
  "migrations": [{ "tag": "v1", "new_classes": ["CampaignSession"] }]
}
```

Note: `node_compat: true` was removed — wrangler v4 requires `compatibility_flags: ["nodejs_compat"]` instead.

## Verification Results

### Health Endpoint (Remote D1)
```
GET https://creative-agent.alphasapien17.workers.dev/health
→ {"status":"ok","d1":{"connected":true,"campaigns":0},"r2":{"bound":true}}
```

### Full DB Test (Remote D1) — All 11 Steps Passed
```
POST https://creative-agent.alphasapien17.workers.dev/test/db
→ {"status":"all_passed","results":{...}}
```

| # | Test | Result |
|---|---|---|
| 1 | `createCampaign` — batch insert (campaign + 3 files) | Campaign created, status: `generating` |
| 2 | `getCampaignById` | Found by id + userId |
| 3 | `getCampaignsByUser` | count: 1 |
| 4 | `updateCampaignStatus` → `complete` | status updated |
| 5 | `updateSdkSessionId` / `getSdkSessionId` | Round-trip: `sdk_sess_abc123` |
| 6 | `getCampaignFiles` (auto-created) | 3 files: hooks, prompts, research |
| 7 | `updateCampaignFile` + `areAllFilesReady` | allReady: false (1 of 3) |
| 8 | `addCampaignImage` + `getImageCount` | version: 1, totalImages: 1 |
| 9 | `addMessage` + `getMessages` + `getLastAssistantMessage` | 2 messages, blocks persisted |
| 10 | `createFolder` + `addFile` + `getFoldersByUser` + `getFilesCount` | Folder + file created |
| 11 | `deleteCampaign` (CASCADE) + asset cleanup | All rows deleted |

## Local Dev

```bash
cd cloudflare
npm install
npx wrangler d1 execute creative-agent-db --local --file=./schema.sql  # apply schema locally
npx wrangler dev  # starts on http://localhost:8787
```

## What's Next (Phase 2)

Phase 2 adds REST API routes and Clerk auth to the Worker:
- `src/router.ts` — API route dispatcher
- `src/auth.ts` — Clerk JWT verification at the edge
- `src/routes/campaigns.ts` — GET/POST /api/campaigns/*
- `src/routes/assets.ts` — GET/POST /api/assets/*
- `src/routes/images.ts` — GET /images/* (R2 proxy)
- `src/routes/health.ts` — GET /health
