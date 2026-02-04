# Persistence Layer Implementation Plan

**Created:** January 28, 2026
**Status:** Phases A, B & C Complete + Auth & Cancel Bug Fixes — Ready for Phase D (Resume Generation)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Implementation Phases](#implementation-phases)
6. [File Changes Summary](#file-changes-summary)
7. [Cloudflare Migration Path](#cloudflare-migration-path)

---

## Overview

### Problem

Currently, all application state lives in browser memory (Zustand store). When the user:
- Refreshes the page → All data lost, shows demo data
- Closes browser → All data lost
- Disconnects mid-generation → Can't see partial results or reconnect

### Solution

Add a persistence layer that:
1. Stores all campaign data in a database (SQLite locally → D1 in production)
2. Stores images/assets on disk (locally → R2 in production)
3. Provides REST API for frontend to fetch/save data
4. Enables reconnection to running agent via session tracking
5. Integrates Clerk for user authentication

### Goals

- **Survive refresh:** User can refresh and see their data
- **Resume generation:** If agent is still running, reconnect and continue receiving events
- **Multi-user ready:** Schema includes user_id from day one
- **Cloudflare ready:** Local implementation maps directly to D1/R2/Durable Objects

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local database | SQLite | Same SQL syntax as Cloudflare D1, easy migration |
| Production database | Cloudflare D1 | Native integration, globally distributed |
| Local file storage | File system | Simple, maps to R2 later |
| Production file storage | Cloudflare R2 | S3-compatible, integrated with Workers |
| Authentication | Clerk | Great React integration, Google + Email support |
| Event buffer | In-memory (local) → Durable Objects (prod) | Real-time state, WebSocket coordination |
| URL routing | Skip for now | Can add shareable URLs later |

---

## Database Schema

### Entity Relationship

```
users (managed by Clerk - we just store user_id)
  │
  ├── campaigns (one user has many campaigns)
  │     │
  │     ├── campaign_files (one campaign has 3 files: research, hooks, prompts)
  │     │
  │     ├── campaign_images (one campaign has many images, typically 6)
  │     │
  │     └── messages (one campaign has many chat messages)
  │
  └── asset_folders (one user has many folders)
        │
        └── asset_files (one folder has many files)
```

### SQL Schema

```sql
-- ============================================
-- CAMPAIGNS
-- ============================================

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- Clerk user ID
  name TEXT NOT NULL,
  status TEXT DEFAULT 'generating',         -- 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled'
  session_id TEXT,                          -- SDK session ID for reconnection
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ============================================
-- CAMPAIGN FILES (research, hooks, prompts)
-- ============================================

CREATE TABLE campaign_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,                  -- 'research' | 'hooks' | 'prompts'
  content TEXT DEFAULT '',
  is_ready BOOLEAN DEFAULT FALSE,           -- Has content been generated?
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, file_type)
);

CREATE INDEX idx_campaign_files_campaign_id ON campaign_files(campaign_id);

-- ============================================
-- CAMPAIGN IMAGES
-- ============================================

CREATE TABLE campaign_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,             -- 1-6 (position in grid)
  hook_type TEXT NOT NULL,                  -- 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast'
  prompt TEXT,                              -- The prompt used to generate
  file_path TEXT NOT NULL,                  -- Path on disk or R2 key
  version INTEGER DEFAULT 1,                -- Increments on regeneration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(campaign_id, image_index, version)
);

CREATE INDEX idx_campaign_images_campaign_id ON campaign_images(campaign_id);

-- ============================================
-- CHAT MESSAGES
-- ============================================

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                       -- 'user' | 'assistant'
  content TEXT NOT NULL,
  image_refs TEXT,                          -- JSON array of image references
  file_refs TEXT,                           -- JSON array of file references
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);

-- ============================================
-- ASSET FOLDERS
-- ============================================

CREATE TABLE asset_folders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,                    -- Clerk user ID
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_folders_user_id ON asset_folders(user_id);

-- ============================================
-- ASSET FILES
-- ============================================

CREATE TABLE asset_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL REFERENCES asset_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,                  -- Path on disk or R2 key
  file_type TEXT NOT NULL,                  -- 'image' | 'document' | 'other'
  size INTEGER,                             -- File size in bytes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asset_files_folder_id ON asset_files(folder_id);
```

---

## API Endpoints

### Authentication

All endpoints require Clerk authentication. The `user_id` is extracted from the JWT token.

```
Authorization: Bearer <clerk_jwt_token>
```

### Campaigns

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/campaigns` | List user's campaigns | - | `{ campaigns: Campaign[] }` |
| GET | `/api/campaigns/:id` | Get full campaign (files, images, messages) | - | `{ campaign, files, images, messages }` |
| POST | `/api/campaigns` | Create new campaign | `{ name }` | `{ campaign }` |
| PATCH | `/api/campaigns/:id` | Update campaign | `{ name?, status? }` | `{ campaign }` |
| DELETE | `/api/campaigns/:id` | Delete campaign (aborts active generation) | - | `{ success: true }` |

### Campaign Files

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/campaigns/:id/files/:type` | Get file content | - | `{ file }` |
| PUT | `/api/campaigns/:id/files/:type` | Update file content | `{ content }` | `{ file }` |

### Campaign Images

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/campaigns/:id/images` | List campaign images | - | `{ images: Image[] }` |

*Note: Images are created by the agent during generation, not via API.*

### Messages

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/campaigns/:id/messages` | Get chat history | - | `{ messages: Message[] }` |
| POST | `/api/campaigns/:id/messages` | Add message | `{ role, content, imageRefs?, fileRefs? }` | `{ message }` |

### Assets

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/assets/folders` | List user's folders | - | `{ folders: Folder[] }` |
| POST | `/api/assets/folders` | Create folder | `{ name }` | `{ folder }` |
| PATCH | `/api/assets/folders/:id` | Rename folder | `{ name }` | `{ folder }` |
| DELETE | `/api/assets/folders/:id` | Delete folder + files | - | `{ success: true }` |
| POST | `/api/assets/upload` | Upload file | `multipart/form-data` | `{ file }` |
| GET | `/api/assets/files/:id` | Serve file | - | Binary file |
| DELETE | `/api/assets/files/:id` | Delete file | - | `{ success: true }` |

### Generation

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/campaigns/:id/status` | Check if agent is running | - | `{ status, isAgentRunning }` |

*Note: Generation is initiated via WebSocket, not REST API.*

---

## Implementation Phases

### Phase A: Database Layer (Backend)

#### A1: Set Up SQLite

**Files to create:**
- `server/lib/database.ts` - Database connection and initialization

```typescript
// server/lib/database.ts
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/creative_agent.db');

export const db = new Database(DB_PATH);

export function initDatabase() {
  // Run schema creation
  db.exec(SCHEMA_SQL);
}
```

**Tasks:**
- [x] Install `better-sqlite3` package
- [x] Create `server/data/` directory (gitignored)
- [x] Create database initialization script
- [x] Run schema migration on server start

#### A2: Data Access Layer

**Files to create:**
- `server/lib/db/campaigns.ts` - Campaign CRUD operations
- `server/lib/db/files.ts` - Campaign files operations
- `server/lib/db/images.ts` - Campaign images operations
- `server/lib/db/messages.ts` - Chat messages operations
- `server/lib/db/assets.ts` - Asset folders/files operations
- `server/lib/db/index.ts` - Export all

**Example:**
```typescript
// server/lib/db/campaigns.ts
export function getCampaignsByUser(userId: string): Campaign[] {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
}

export function getCampaignById(id: string, userId: string): Campaign | null {
  return db.prepare(`
    SELECT * FROM campaigns
    WHERE id = ? AND user_id = ?
  `).get(id, userId);
}

export function createCampaign(userId: string, name: string): Campaign {
  const id = generateId('campaign');
  db.prepare(`
    INSERT INTO campaigns (id, user_id, name, status)
    VALUES (?, ?, ?, 'generating')
  `).run(id, userId, name);

  // Create empty files
  for (const fileType of ['research', 'hooks', 'prompts']) {
    db.prepare(`
      INSERT INTO campaign_files (campaign_id, file_type)
      VALUES (?, ?)
    `).run(id, fileType);
  }

  return getCampaignById(id, userId);
}
```

**Tasks:**
- [x] Create campaigns data access functions
- [x] Create files data access functions
- [x] Create images data access functions
- [x] Create messages data access functions
- [x] Create assets data access functions

#### A3: Update Backend to Write to DB

**Files to modify:**
- `server/lib/websocket-handler.ts` - Save events to DB as they occur

**Changes:**
```typescript
// When file event is emitted
if (event.type === 'file') {
  await db.updateCampaignFile(campaignId, event.fileType, event.content);
}

// When image event is emitted
if (event.type === 'image') {
  await db.addCampaignImage(campaignId, {
    imageIndex: event.imageIndex,
    hookType: event.hookType,
    prompt: event.prompt,
    filePath: event.urlPath
  });
}

// When complete event is emitted
if (event.type === 'complete') {
  await db.updateCampaignStatus(campaignId, 'complete');
}
```

**Tasks:**
- [x] Modify websocket-handler to save file events to DB
- [x] Modify websocket-handler to save image events to DB
- [x] Modify websocket-handler to update status on complete/error
- [x] Store session_id in campaign record when generation starts

---

### Phase B: REST API (Backend)

#### B1: Set Up Clerk Authentication

**Files to create:**
- `server/lib/auth.ts` - Clerk middleware

```typescript
// server/lib/auth.ts
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth();

export function getUserId(req: Request): string {
  return req.auth.userId;
}
```

**Tasks:**
- [x] Install `@clerk/express` package (newer SDK)
- [x] Add CLERK_SECRET_KEY to .env (optional - dev mode bypass)
- [x] Create auth middleware with dev mode support
- [x] Add middleware to all API routes

#### B2: Campaign API Routes

**Files to create:**
- `server/routes/campaigns.ts` - Campaign endpoints

**Tasks:**
- [x] GET /api/campaigns - List campaigns
- [x] GET /api/campaigns/:id - Get full campaign
- [x] POST /api/campaigns - Create campaign
- [x] PATCH /api/campaigns/:id - Update campaign
- [x] DELETE /api/campaigns/:id - Delete campaign
- [x] GET /api/campaigns/:id/files/:type - Get file
- [x] PUT /api/campaigns/:id/files/:type - Update file
- [x] GET /api/campaigns/:id/messages - Get messages
- [x] POST /api/campaigns/:id/messages - Add message

#### B3: Assets API Routes

**Files to create:**
- `server/routes/assets.ts` - Asset endpoints

**Tasks:**
- [x] GET /api/assets/folders - List folders
- [x] POST /api/assets/folders - Create folder
- [x] PATCH /api/assets/folders/:id - Rename folder
- [x] DELETE /api/assets/folders/:id - Delete folder
- [x] POST /api/assets/upload - Upload file (multipart with multer)
- [x] GET /api/assets/files/:id - Serve file
- [x] DELETE /api/assets/files/:id - Delete file

#### B4: Mount Routes

**Files to modify:**
- `server/sdk-server.ts` - Add API routes

**Tasks:**
- [x] Import route handlers
- [x] Mount at /api prefix
- [x] Add auth middleware (clerkAuth at app level)
- [x] Add error handling (per-route try/catch)

---

### Phase C: Frontend Integration ✅ COMPLETE

#### C1: Set Up Clerk ✅

**Files created/modified:**
- `client/src/lib/auth.ts` - Dev mode detection, Clerk key export
- `client/src/contexts/AuthContext.tsx` - Auth context with requireAuth()
- `client/src/main.tsx` - ClerkProvider wrapper (dev bypass)
- `client/src/components/auth/SignIn.tsx` - Sign in page (dark theme)
- `client/src/components/auth/UserMenu.tsx` - User avatar in sidebar
- `client/src/components/layout/LandingHeader.tsx` - Header with login button

**Tasks:**
- [x] Install `@clerk/clerk-react` package
- [x] Add VITE_CLERK_PUBLISHABLE_KEY to .env
- [x] Create ClerkProvider wrapper (with dev mode bypass)
- [x] Add SignIn component with dark theme styling
- [x] Add UserButton to sidebar header
- [x] Soft-gate auth (login prompt on "Create" click, not page block)

#### C2: API Client ✅

**Files created:**
- `client/src/lib/api.ts` - API client with auth token injection

**Implementation:**
- `setTokenGetter()` - Called by App.tsx to inject Clerk's getToken
- `apiFetch()` - Base fetch with automatic Authorization header
- `campaignsApi` - list, get, create, update, delete, updateFile
- `assetsApi` - listFolders, createFolder, renameFolder, deleteFolder, getFiles, deleteFile
- Type transformers: API snake_case → store camelCase

**Tasks:**
- [x] Create API client with Clerk token injection
- [x] Add all campaign API methods
- [x] Add all assets API methods
- [x] Add error handling

#### C3: Load Data on Mount ✅

**Files modified:**
- `client/src/App.tsx` - Load campaigns on mount
- `client/src/store/index.ts` - Added bulk setters

**Auth Flow (soft-gate):**
```
User visits app
    │
    └── Landing page always shown (no auth gate)
          ├── Header with "Log in" button
          ├── User can enter prompt
          └── Clicks "Create" → requireAuth() checks
                │
                ├── Signed in → Generate
                └── Not signed in → Clerk modal → then generate
```

**Bug Fixes (January 29, 2026):**
- **Token race condition:** `AuthenticatedApp` now uses a ref-based token getter so the auth token is always current when child effects fire (fixed in `App.tsx`)
- **Lost requireAuth callback:** `ClerkAuthProvider` stores the callback in a ref and executes it on `isSignedIn` transition (`false → true`), so the "Create" button flow works with modal sign-in (fixed in `AuthContext.tsx`)
- **Silent API error on landing:** Error display no longer gated behind `showWorkspace`, so landing page users see load errors and can retry (fixed in `App.tsx`)

**Tasks:**
- [x] Add `setCampaigns` bulk setter to store
- [x] Add `setAssetFolders` bulk setter to store
- [x] Call API on app mount (when signed in)
- [x] Show loading state while fetching
- [x] Handle errors with retry button
- [x] Fix token race condition after modal sign-in
- [x] Fix requireAuth callback lost on modal sign-in
- [x] Show API errors on landing page (not just workspace)

#### C4: Sync Store Changes to API ✅

**Files modified:**
- `client/src/store/index.ts` - Added async API actions
- `client/src/components/assets/AssetDrawer.tsx` - Use async actions
- `client/src/components/editor/FileEditor.tsx` - Sync edits to API

**Async Store Actions:**
```typescript
deleteCampaignAsync(id)           // DELETE /api/campaigns/:id
renameCampaignAsync(id, name)     // PATCH /api/campaigns/:id
saveFileAsync(id, type, content)  // PUT /api/campaigns/:id/files/:type
createFolderAsync(name)           // POST /api/assets/folders
deleteFolderAsync(id)             // DELETE /api/assets/folders/:id
renameFolderAsync(id, name)       // PATCH /api/assets/folders/:id
deleteFileAsync(fileId)           // DELETE /api/assets/files/:id
```

**Tasks:**
- [x] Add `deleteCampaignAsync` (optimistic + API)
- [x] Add `renameCampaignAsync` (optimistic + API)
- [x] Add `saveFileAsync` (debounced API sync)
- [x] Add async asset folder actions
- [x] Handle optimistic updates

#### C5: Remove Demo Data ✅

**Files modified:**
- `client/src/store/index.ts` - Removed demo constants

**Tasks:**
- [x] Remove DEMO_CAMPAIGNS constant
- [x] Remove DEMO_FOLDERS constant
- [x] Remove DEMO_MESSAGES constant
- [x] Initialize state as empty arrays
- [x] Load real data from API on mount

---

### Phase D: Resume Generation

#### D1: Track Session in Campaign

**Already covered in Phase A3** - session_id stored in campaigns table.

#### D2: Check Agent Status on Load

**Files to modify:**
- `client/src/App.tsx` or `client/src/components/ResultsView.tsx`

**Flow:**
```
Load campaign from API
    │
    ├── status === 'complete' → Show results, done
    │
    └── status === 'generating'
          │
          ├── Connect WebSocket with session_id
          │
          ├── Request: { type: 'reconnect', sessionId, lastEventId }
          │
          └── Backend checks if agent running
                │
                ├── Yes → Replay missed events, continue streaming
                │
                └── No → Return { agentStopped: true }
                          │
                          └── Mark campaign as 'incomplete'
                              Show partial results + "Resume" button
```

**Tasks:**
- [ ] Add reconnection logic to useWebSocket hook
- [ ] Handle `agentStopped` response
- [ ] Add "Resume" button for incomplete campaigns
- [ ] Implement resume flow (start new agent with context)

#### D3: Event Buffer Integration

**Files to modify:**
- `server/lib/websocket-handler.ts` - Handle reconnect message

**Tasks:**
- [ ] Add `reconnect` message type handler
- [ ] Check if session buffer exists
- [ ] Replay events since lastEventId
- [ ] If agent stopped, send status update

---

### Phase E: Polish & Testing

#### E1: Error Handling

**Tasks:**
- [ ] Handle API errors gracefully in frontend
- [ ] Show error toasts/messages
- [ ] Retry logic for transient failures
- [ ] Handle offline state

#### E2: Loading States

**Tasks:**
- [ ] Show skeleton while loading campaigns
- [ ] Show loading spinner during API calls
- [ ] Disable buttons during pending operations

#### E3: Testing

**Tasks:**
- [ ] Test: Create campaign → refresh → campaign still there
- [ ] Test: Generate images → refresh mid-way → partial results shown
- [ ] Test: Close browser → reopen → data persists
- [ ] Test: Sign out → sign in → data still there
- [ ] Test: Upload asset → refresh → asset still there

---

## File Changes Summary

### New Files (Backend)

| File | Purpose |
|------|---------|
| `server/lib/database.ts` | SQLite connection and init |
| `server/lib/db/campaigns.ts` | Campaign data access |
| `server/lib/db/files.ts` | File data access |
| `server/lib/db/images.ts` | Image data access |
| `server/lib/db/messages.ts` | Message data access |
| `server/lib/db/assets.ts` | Asset data access |
| `server/lib/db/index.ts` | Export all |
| `server/lib/auth.ts` | Clerk middleware |
| `server/routes/campaigns.ts` | Campaign API routes |
| `server/routes/assets.ts` | Asset API routes |
| `server/data/` | SQLite database directory |

### New Files (Frontend)

| File | Purpose |
|------|---------|
| `client/src/lib/auth.ts` | Dev mode detection, Clerk key |
| `client/src/lib/api.ts` | API client with token injection |
| `client/src/contexts/AuthContext.tsx` | Auth context with requireAuth() |
| `client/src/components/auth/SignIn.tsx` | Sign-in page (dark theme) |
| `client/src/components/auth/UserMenu.tsx` | User avatar component |
| `client/src/components/layout/LandingHeader.tsx` | Header with login button |

### Modified Files (Backend)

| File | Changes |
|------|---------|
| `server/sdk-server.ts` | Mount API routes, add auth middleware |
| `server/lib/websocket-handler.ts` | Save events to DB, handle reconnect |
| `server/package.json` | Add better-sqlite3, @clerk/clerk-sdk-node |

### Modified Files (Frontend)

| File | Changes |
|------|---------|
| `client/vite.config.ts` | Added /api proxy |
| `client/src/main.tsx` | ClerkProvider wrapper (dev bypass) |
| `client/src/App.tsx` | Auth flow, data loading from API |
| `client/src/store/index.ts` | Remove demo data, add async API actions |
| `client/src/components/layout/AppLayout.tsx` | Added UserMenu to sidebar |
| `client/src/components/assets/AssetDrawer.tsx` | Use async API actions |
| `client/src/components/editor/FileEditor.tsx` | Sync edits to API |
| `client/src/hooks/useWebSocket.ts` | (Phase D: add reconnect logic) |
| `client/package.json` | Add @clerk/clerk-react |

---

## Cloudflare Migration Path

When ready to deploy to Cloudflare, here's what changes:

### Database: SQLite → D1

```typescript
// Local
import Database from 'better-sqlite3';
const db = new Database('./data/creative_agent.db');
db.prepare('SELECT * FROM campaigns WHERE user_id = ?').all(userId);

// Cloudflare D1
const db = env.DB; // D1 binding
await db.prepare('SELECT * FROM campaigns WHERE user_id = ?').bind(userId).all();
```

**Same SQL, slightly different API.**

### File Storage: Filesystem → R2

```typescript
// Local
import fs from 'fs';
fs.writeFileSync(`./uploads/${filename}`, buffer);

// Cloudflare R2
await env.BUCKET.put(filename, buffer);
```

### Event Buffer: In-Memory → Durable Objects

```typescript
// Local
const buffers = new Map<string, EventBuffer>();
buffers.get(sessionId).events.push(event);

// Cloudflare Durable Object
const id = env.SESSION_DO.idFromName(sessionId);
const stub = env.SESSION_DO.get(id);
await stub.appendEvent(event);
```

### API Routes: Express → Workers

```typescript
// Local Express
app.get('/api/campaigns', requireAuth, (req, res) => {
  const campaigns = getCampaignsByUser(req.auth.userId);
  res.json({ campaigns });
});

// Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/campaigns') {
      const userId = await verifyClerkToken(request, env);
      const campaigns = await env.DB.prepare('...').bind(userId).all();
      return Response.json({ campaigns });
    }
  }
};
```

### Auth: Same Clerk, Different SDK

```typescript
// Local
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Cloudflare
import { verifyToken } from '@clerk/backend';
const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
```

---

## Next Steps

### Completed
- [x] **Phase A** - Database layer (SQLite + data access)
- [x] **Phase B** - REST API (Clerk auth + endpoints)
- [x] **Phase C** - Frontend integration (Clerk auth, API client, sync store)
- [x] **Bug Fixes** - Auth flow (token race, requireAuth callback, landing errors) + Cancel generation (shared abort controller, delete aborts active generation)

### Up Next
1. **Phase D** - Resume generation (reconnect to in-progress campaigns)
2. **Phase E** - Polish & testing
3. **Deploy to Cloudflare** - When ready for production

### Bug Fixes Summary (January 29, 2026)

**Auth / Login Flow (3 fixes):**
- `client/src/App.tsx` — Ref-based token getter in `AuthenticatedApp` eliminates parent/child effect race condition; error display on landing page no longer gated behind workspace
- `client/src/contexts/AuthContext.tsx` — `ClerkAuthProvider` stores `requireAuth` callback in a ref and executes on sign-in transition

**Cancel Generation (3 fixes):**
- `server/lib/ai-client.ts` — `queryWithSession()` accepts external `AbortController` so SDK shares caller's abort signal
- `server/lib/websocket-handler.ts` — Passes handler's abort controller to SDK; new `abortSession()` export
- `server/routes/campaigns.ts` — DELETE endpoint calls `abortSession()` before deleting campaign

See `docs/BUGS.md` for full details (Bugs 2 & 3).

### To Continue Next Session
```
Read @docs/SESSION_CONTEXT_2026-01-28.md and @docs/PERSISTENCE_LAYER_PLAN.md

Current status: Phases A, B & C complete + auth & cancel bug fixes.
Next: Implement Phase D (resume generation on reconnect).

Key tasks:
1. Check campaign status on load
2. If status=generating, reconnect WebSocket with sessionId
3. Replay missed events from event buffer
4. Add "Resume" button for incomplete campaigns
```

---

*Last updated: January 29, 2026 (Phases A, B & C complete + auth & cancel bug fixes)*
