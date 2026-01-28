# Session Context: Chat-First UI Redesign

**Date:** January 28, 2026
**Goal:** Transform wizard-style flow into chat-first experience
**Status:** Persistence Layer - Phases A & B Complete, Ready for Phase C

---

## Quick Start

```bash
# 1. Start backend
cd server && npm run dev

# 2. Start frontend (separate terminal)
cd client && npm run dev

# 3. Open http://localhost:5173
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  EmptyState (Landing)                                        │
│    └─ User enters prompt → clicks Create                     │
│    └─ Calls generate() from useWebSocket                     │
│                                                              │
│  Workspace (After Create)                                    │
│    ├─ ResultsView: Image grid with selection                 │
│    ├─ ChatSidebar: Messages + ThinkingBlock + ChatInput      │
│    └─ EditPanel: Research/Hooks/Prompts editor               │
├─────────────────────────────────────────────────────────────┤
│                     REST API (NEW)                           │
├─────────────────────────────────────────────────────────────┤
│  /api/campaigns     - CRUD for campaigns                     │
│  /api/campaigns/:id - Full campaign with files/images/msgs   │
│  /api/assets        - Folder and file management             │
├─────────────────────────────────────────────────────────────┤
│                        WEBSOCKET                             │
├─────────────────────────────────────────────────────────────┤
│  Events from Server:                                         │
│    • phase    → addThinkingLine() + DB persist               │
│    • file     → updateCampaignFile() + DB persist            │
│    • image    → addImageToCampaign() + DB persist            │
│    • complete → completeGeneration() + DB status update      │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  database.ts         - SQLite initialization                 │
│  lib/db/*.ts         - Data access layer (6 files)           │
│  lib/auth.ts         - Clerk middleware (dev mode bypass)    │
│  routes/campaigns.ts - Campaign REST endpoints               │
│  routes/assets.ts    - Asset REST endpoints                  │
│  websocket-handler.ts - Real-time events + DB writes         │
└─────────────────────────────────────────────────────────────┘
```

---

## Persistence Layer Progress

### Phase A: Database Layer ✅ COMPLETE

**Installed:**
- `better-sqlite3` + `@types/better-sqlite3`

**Created Files:**
| File | Purpose |
|------|---------|
| `server/lib/database.ts` | SQLite connection, schema, init |
| `server/lib/db/campaigns.ts` | Campaign CRUD |
| `server/lib/db/files.ts` | Campaign files (research/hooks/prompts) |
| `server/lib/db/images.ts` | Campaign images with versioning |
| `server/lib/db/messages.ts` | Chat message history |
| `server/lib/db/assets.ts` | Asset folders and files |
| `server/lib/db/index.ts` | Re-exports all |

**Database Tables:**
```
campaigns        - id, user_id, name, status, session_id, timestamps
campaign_files   - campaign_id, file_type, content, is_ready
campaign_images  - campaign_id, image_index, hook_type, prompt, file_path, version
messages         - campaign_id, role, content, image_refs, file_refs
asset_folders    - user_id, name
asset_files      - folder_id, name, file_path, file_type, size
```

**WebSocket Integration:**
- Campaign created when generation starts
- File events persisted in real-time
- Image events persisted with hookType/imageIndex
- Status updated on complete/error/cancel

---

### Phase B: REST API ✅ COMPLETE

**Installed:**
- `@clerk/express` - Authentication
- `multer` + `@types/multer` - File uploads

**Created Files:**
| File | Purpose |
|------|---------|
| `server/lib/auth.ts` | Clerk middleware with dev bypass |
| `server/routes/campaigns.ts` | Campaign CRUD + files/images/messages |
| `server/routes/assets.ts` | Folder CRUD + file upload/serve |

**Campaign Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List user's campaigns |
| GET | `/api/campaigns/:id` | Get full campaign (files, images, messages) |
| POST | `/api/campaigns` | Create campaign |
| PATCH | `/api/campaigns/:id` | Update name/status |
| DELETE | `/api/campaigns/:id` | Delete campaign |
| GET/PUT | `/api/campaigns/:id/files/:type` | Get/update file content |
| GET | `/api/campaigns/:id/images` | List images |
| GET/POST | `/api/campaigns/:id/messages` | Chat history |
| GET | `/api/campaigns/:id/status` | Check agent running |

**Asset Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/assets/folders` | List/create folders |
| PATCH/DELETE | `/api/assets/folders/:id` | Update/delete folder |
| GET | `/api/assets/folders/:id/files` | List files in folder |
| POST | `/api/assets/upload` | Upload file |
| GET | `/api/assets/files/:id` | Serve file |
| DELETE | `/api/assets/files/:id` | Delete file |

**Auth Status:**
- Dev mode: Uses `anonymous` user when `CLERK_SECRET_KEY` not set
- Production: Requires valid Clerk JWT token

---

### Phase C: Frontend Integration - NOT STARTED

**To Do:**
- [ ] Install `@clerk/clerk-react`
- [ ] Create `client/src/api/client.ts` with token injection
- [ ] Wrap app in ClerkProvider
- [ ] Add SignIn component and UserMenu
- [ ] Load campaigns on mount: `GET /api/campaigns`
- [ ] Load assets on mount: `GET /api/assets/folders`
- [ ] Sync store actions to API calls
- [ ] Remove DEMO_CAMPAIGNS/DEMO_FOLDERS from store

---

### Phase D: Resume Generation - NOT STARTED

**To Do:**
- [ ] On load, check campaign status
- [ ] If `generating`, reconnect WebSocket with sessionId
- [ ] Replay missed events
- [ ] Handle `agentStopped` response
- [ ] Add "Resume" button for incomplete campaigns

---

### Phase E: Polish & Testing - NOT STARTED

**To Do:**
- [ ] Error handling and toasts
- [ ] Loading states and skeletons
- [ ] Test: refresh preserves data
- [ ] Test: reconnect during generation
- [ ] Test: auth flow with Clerk

---

## Key Files (Updated)

| Area | File | Purpose |
|------|------|---------|
| **Database** | `server/lib/database.ts` | SQLite init and schema |
| **Database** | `server/lib/db/index.ts` | Data access exports |
| **Auth** | `server/lib/auth.ts` | Clerk middleware |
| **Routes** | `server/routes/campaigns.ts` | Campaign REST API |
| **Routes** | `server/routes/assets.ts` | Asset REST API |
| **WebSocket** | `server/lib/websocket-handler.ts` | Events + DB writes |
| **Types** | `client/src/types/chat.ts` | Chat, campaign, image types |
| **Store** | `client/src/store/index.ts` | Frontend state |
| **Hook** | `client/src/hooks/useWebSocket.ts` | WebSocket connection |

---

## Environment Variables

**Backend (.env):**
```
ANTHROPIC_API_KEY=sk-...      # Required
CLERK_SECRET_KEY=sk_...       # Optional (dev mode if missing)
```

**Frontend (.env):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...  # Needed for Phase C
```

---

## To Continue Next Session

```
Read @docs/SESSION_CONTEXT_2026-01-28.md

Current status: Phases A & B complete (database + REST API).
Next: Implement Phase C (frontend integration with Clerk + API client).

Key tasks:
1. Install @clerk/clerk-react in client
2. Create API client with auth token
3. Load campaigns from API on mount
4. Sync store changes to API
5. Remove demo data
```

---

*Last updated: January 28, 2026 (Phases A & B complete)*
