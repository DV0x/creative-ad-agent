# Session Context: Chat-First UI Redesign

**Date:** January 28, 2026
**Goal:** Transform wizard-style flow into chat-first experience
**Status:** Persistence Layer - Phases A, B, C & D Complete, Ready for Phase E

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
│  LandingHeader                                               │
│    └─ Logo + Login button (Clerk SignInButton)              │
│                                                              │
│  EmptyState (Landing)                                        │
│    └─ User enters prompt → clicks Create                     │
│    └─ requireAuth() → shows Clerk modal if not signed in    │
│    └─ Calls generate() from useWebSocket                     │
│                                                              │
│  Workspace (After Create)                                    │
│    ├─ ResultsView: Image grid with selection                 │
│    ├─ ChatSidebar: Messages + ThinkingBlock + ChatInput      │
│    ├─ EditPanel: Research/Hooks/Prompts editor (API sync)    │
│    └─ UserMenu: Clerk UserButton in sidebar header           │
├─────────────────────────────────────────────────────────────┤
│                     REST API CLIENT                          │
├─────────────────────────────────────────────────────────────┤
│  client/src/lib/api.ts                                       │
│    • campaignsApi: list, get, create, update, delete, files  │
│    • assetsApi: folders CRUD, files CRUD                     │
│    • Auto token injection via Clerk getToken()               │
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

### Phase C: Frontend Integration ✅ COMPLETE

**Installed:**
- `@clerk/clerk-react`

**Created Files:**
| File | Purpose |
|------|---------|
| `client/src/lib/auth.ts` | Dev mode detection, Clerk key export |
| `client/src/lib/api.ts` | API client with token injection |
| `client/src/contexts/AuthContext.tsx` | Auth context with requireAuth() |
| `client/src/components/auth/SignIn.tsx` | Clerk sign-in page (dark theme) |
| `client/src/components/auth/UserMenu.tsx` | User avatar in sidebar header |
| `client/src/components/layout/LandingHeader.tsx` | Header with login button |

**Modified Files:**
| File | Changes |
|------|---------|
| `client/vite.config.ts` | Added `/api` proxy to backend |
| `client/src/main.tsx` | ClerkProvider wrapper (dev bypass) |
| `client/src/App.tsx` | Auth flow, data loading from API |
| `client/src/store/index.ts` | Removed demo data, added async API actions |
| `client/src/components/layout/AppLayout.tsx` | Added UserMenu |
| `client/src/components/assets/AssetDrawer.tsx` | Use async API actions |
| `client/src/components/editor/FileEditor.tsx` | Sync edits to API |

**Auth Flow:**
```
User visits app
    │
    └── Landing Page (always shown)
          ├── Header with "Log in" button (or avatar if signed in)
          ├── Prompt input + "Create" button
          └── Recent campaigns (if any, loaded from API)

User clicks "Create"
    │
    ├── Signed in? → Generate campaign
    └── Not signed in? → Clerk sign-in modal → then generate

User clicks "Log in" in header
    └── Clerk sign-in modal
```

**Store Async Actions:**
- `deleteCampaignAsync(id)` - DELETE /api/campaigns/:id
- `renameCampaignAsync(id, name)` - PATCH /api/campaigns/:id
- `saveFileAsync(campaignId, fileType, content)` - PUT /api/campaigns/:id/files/:type
- `createFolderAsync(name)` - POST /api/assets/folders
- `deleteFolderAsync(id)` - DELETE /api/assets/folders/:id
- `renameFolderAsync(id, name)` - PATCH /api/assets/folders/:id
- `deleteFileAsync(fileId)` - DELETE /api/assets/files/:id

---

### Phase D: Resume Generation ✅ COMPLETE

**Implemented:**
- [x] Added `incomplete` status to CampaignStatus type
- [x] `isAgentRunning()` function exported from websocket-handler
- [x] Enhanced `/api/campaigns/:id/status` with actual agent check
- [x] `getStatus()` API client method
- [x] Recovery logic on app load (checks generating campaigns)
- [x] `resume()` function in useWebSocket hook
- [x] `resumeGeneration()` in store
- [x] Resume button UI in ResultsView for incomplete campaigns

---

### Phase E: Polish & Testing - PENDING

**Manual Testing Checklist:**
- [ ] Refresh preserves data (create campaign → refresh → still visible)
- [ ] Reconnect during generation (refresh mid-generation → auto-reconnects)
- [ ] Incomplete detection (restart server → campaign shows incomplete)
- [ ] Resume functionality (click Resume → generation restarts)
- [ ] Auth flow with Clerk (sign out → sign in → data preserved)

**Polish Tasks (Optional):**
- [ ] Error handling toasts
- [ ] Loading state skeletons
- [ ] Retry logic for API failures

---

## Key Files

| Area | File | Purpose |
|------|------|---------|
| **Auth** | `client/src/lib/auth.ts` | Dev mode detection |
| **Auth** | `client/src/contexts/AuthContext.tsx` | requireAuth() hook |
| **API** | `client/src/lib/api.ts` | REST client with auth |
| **Database** | `server/lib/database.ts` | SQLite init and schema |
| **Database** | `server/lib/db/index.ts` | Data access exports |
| **Auth** | `server/lib/auth.ts` | Clerk middleware |
| **Routes** | `server/routes/campaigns.ts` | Campaign REST API |
| **Routes** | `server/routes/assets.ts` | Asset REST API |
| **WebSocket** | `server/lib/websocket-handler.ts` | Events + DB writes |
| **Types** | `client/src/types/chat.ts` | Chat, campaign, image types |
| **Store** | `client/src/store/index.ts` | Frontend state + async actions |
| **Hook** | `client/src/hooks/useWebSocket.ts` | WebSocket connection |

---

## Environment Variables

**Backend (server/.env):**
```
GEMINI_API_KEY=...            # Required for AI
CLERK_SECRET_KEY=sk_test_...  # Required for auth (optional in dev)
PORT=3001
```

**Frontend (client/.env):**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Required for auth
```

---

## To Continue Next Session

```
Read @docs/SESSION_CONTEXT_2026-01-28.md

Current status: Phases A, B, C & D complete.
Next: Implement Phase E (polish & testing).

Key tasks:
1. Error handling and toasts
2. Loading states and skeletons
3. Test: refresh preserves data
4. Test: reconnect during generation
5. Test: auth flow with Clerk
```

---

*Last updated: January 28, 2026 (Phases A, B, C & D complete)*
