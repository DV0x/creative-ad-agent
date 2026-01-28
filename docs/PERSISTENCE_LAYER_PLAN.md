# Persistence Layer Implementation Plan

**Created:** January 28, 2026
**Status:** Phases A & B Complete - Ready for Phase C (Frontend Integration)

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
| DELETE | `/api/campaigns/:id` | Delete campaign | - | `{ success: true }` |

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

### Phase C: Frontend Integration

#### C1: Set Up Clerk

**Files to create/modify:**
- `client/src/lib/clerk.ts` - Clerk configuration
- `client/src/main.tsx` - Wrap app in ClerkProvider
- `client/src/components/auth/SignIn.tsx` - Sign in page
- `client/src/components/auth/UserMenu.tsx` - User button in header

**Tasks:**
- [ ] Install `@clerk/clerk-react` package
- [ ] Add VITE_CLERK_PUBLISHABLE_KEY to .env
- [ ] Create ClerkProvider wrapper
- [ ] Add SignIn component
- [ ] Add UserButton to header
- [ ] Protect routes (redirect to sign-in if not authenticated)

#### C2: API Client

**Files to create:**
- `client/src/api/client.ts` - API client with auth

```typescript
// client/src/api/client.ts
import { useAuth } from '@clerk/clerk-react';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { getToken } = useAuth();
  const token = await getToken();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export const api = {
  // Campaigns
  getCampaigns: () => fetchWithAuth('/api/campaigns').then(r => r.json()),
  getCampaign: (id: string) => fetchWithAuth(`/api/campaigns/${id}`).then(r => r.json()),
  createCampaign: (name: string) => fetchWithAuth('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }).then(r => r.json()),
  // ... etc
};
```

**Tasks:**
- [ ] Create API client with Clerk token injection
- [ ] Add all campaign API methods
- [ ] Add all assets API methods
- [ ] Add error handling

#### C3: Load Data on Mount

**Files to modify:**
- `client/src/App.tsx` - Load campaigns on mount
- `client/src/store/index.ts` - Add loading actions

**Flow:**
```
App mounts
    │
    ├── Check: Is user signed in?
    │     │
    │     ├── No → Show sign-in page
    │     │
    │     └── Yes → Continue
    │
    ├── Call: GET /api/campaigns
    │
    ├── Store: setCampaigns(response.campaigns)
    │
    ├── Call: GET /api/assets/folders
    │
    ├── Store: setAssetFolders(response.folders)
    │
    └── Show: Landing page (or last campaign if stored)
```

**Tasks:**
- [ ] Add `loadCampaigns` action to store
- [ ] Add `loadAssetFolders` action to store
- [ ] Call API on app mount
- [ ] Show loading state while fetching
- [ ] Handle errors

#### C4: Sync Store Changes to API

**Files to modify:**
- `client/src/store/index.ts` - Add API calls to actions

**Example:**
```typescript
// Before (memory only)
addCampaign: (name) => {
  const id = generateId('campaign');
  set(state => ({ campaigns: [...state.campaigns, { id, name, ... }] }));
  return id;
}

// After (synced with API)
addCampaign: async (name) => {
  const response = await api.createCampaign(name);
  set(state => ({ campaigns: [...state.campaigns, response.campaign] }));
  return response.campaign.id;
}
```

**Tasks:**
- [ ] Update `addCampaign` to call API
- [ ] Update `removeCampaign` to call API
- [ ] Update `renameCampaign` to call API
- [ ] Update `updateFileContent` to call API
- [ ] Update asset folder actions to call API
- [ ] Handle optimistic updates vs wait for API

#### C5: Remove Demo Data

**Files to modify:**
- `client/src/store/index.ts` - Remove DEMO_CAMPAIGNS, DEMO_FOLDERS, DEMO_MESSAGES

**Tasks:**
- [ ] Remove DEMO_CAMPAIGNS constant
- [ ] Remove DEMO_FOLDERS constant
- [ ] Remove DEMO_MESSAGES constant
- [ ] Initialize state as empty arrays
- [ ] Load real data from API on mount

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
| `client/src/api/client.ts` | API client with auth |
| `client/src/components/auth/SignIn.tsx` | Sign-in page |
| `client/src/components/auth/UserMenu.tsx` | User menu component |

### Modified Files (Backend)

| File | Changes |
|------|---------|
| `server/sdk-server.ts` | Mount API routes, add auth middleware |
| `server/lib/websocket-handler.ts` | Save events to DB, handle reconnect |
| `server/package.json` | Add better-sqlite3, @clerk/clerk-sdk-node |

### Modified Files (Frontend)

| File | Changes |
|------|---------|
| `client/src/main.tsx` | Wrap in ClerkProvider |
| `client/src/App.tsx` | Load data on mount, auth check |
| `client/src/store/index.ts` | Remove demo data, add API sync |
| `client/src/hooks/useWebSocket.ts` | Add reconnect logic |
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

### Up Next
1. **Set up Clerk account** - Create app at clerk.com, enable Google + Email
2. **Get API keys** - Add `CLERK_SECRET_KEY` to server `.env`, `VITE_CLERK_PUBLISHABLE_KEY` to client `.env`
3. **Phase C** - Frontend integration (API client, load on mount, sync store)
4. **Phase D** - Resume generation (reconnect logic)
5. **Phase E** - Polish & testing
6. **Deploy to Cloudflare** - When ready for production

### To Continue Next Session
```
Read @docs/SESSION_CONTEXT_2026-01-28.md and @docs/PERSISTENCE_LAYER_PLAN.md

Start Phase C: Frontend Integration
- Install @clerk/clerk-react
- Create API client with auth
- Load campaigns on mount
- Sync store to API
```

---

*Last updated: January 28, 2026 (Phases A & B complete)*
