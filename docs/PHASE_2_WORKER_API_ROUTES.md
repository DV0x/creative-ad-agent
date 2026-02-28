# Phase 2: Worker API Routes + Auth

> Completed: 2026-02-28

---

## What Was Built

REST API routes and Clerk JWT authentication ported from Express to Cloudflare Worker. All campaign, asset, and image endpoints are live and verified against the remote D1 database and R2 bucket.

## New Files

```
cloudflare/src/
├── auth.ts                    # Clerk JWT verification (edge, no Express)
├── router.ts                  # Route dispatcher with CORS
├── routes/
│   ├── campaigns.ts           # 10 campaign endpoints
│   ├── assets.ts              # 8 asset endpoints (R2 storage)
│   ├── images.ts              # Image serving from R2
│   └── health.ts              # Health check
└── index.ts                   # Updated entry point (routes + WS stub)
```

## Architecture: Express → Worker

| Express Pattern | Worker Pattern |
|---|---|
| `router.get('/', handler)` | Function + regex match in `router.ts` |
| `req.params.id` | Regex capture group |
| `req.body` | `await request.json()` |
| `res.json({ ... })` | `Response.json({ ... })` |
| `res.status(201).json()` | `Response.json({}, { status: 201 })` |
| `res.sendFile(path)` | `new Response(r2Object.body, { headers })` |
| `multer` file upload | `request.formData()` → R2 `put()` |
| `fs.existsSync` / `fs.unlinkSync` | `R2_BUCKET.get()` / `R2_BUCKET.delete()` |
| `cors()` middleware | `corsResponse()` wrapper on every response |
| `clerkMiddleware()` + `requireAuth()` | `authenticateRequest()` → JWT JWKS verification |
| `getAuth(req).userId` | JWT `sub` claim from verified token |

## Auth: Clerk JWT at the Edge

**Production path** (when `CLERK_SECRET_KEY` is set):
1. Extract Bearer token from `Authorization` header
2. Decode JWT header to get `kid` (key ID)
3. Decode JWT payload to get `iss` (issuer URL)
4. Fetch JWKS from `{issuer}/.well-known/jwks.json`
5. Find matching public key by `kid`
6. Verify RSA-SHA256 signature using Web Crypto API
7. Check token expiration
8. Return `sub` (user ID) claim

**Dev mode** (no `CLERK_SECRET_KEY`): Returns `'anonymous'` for all requests.

**WebSocket auth**: Same verification via `verifyWebSocketToken()` using `?token=` query param.

No npm dependencies added — pure Web Crypto API.

## API Endpoints (All Verified)

### Campaigns (`/api/campaigns`)

| Method | Path | Function | Status |
|---|---|---|---|
| GET | `/api/campaigns` | `listCampaigns` | Verified |
| POST | `/api/campaigns` | `createCampaign` | Verified |
| GET | `/api/campaigns/:id` | `getCampaign` (+ files, images, messages) | Verified |
| PATCH | `/api/campaigns/:id` | `updateCampaign` (name, status) | Verified |
| DELETE | `/api/campaigns/:id` | `deleteCampaign` (CASCADE) | Verified |
| GET | `/api/campaigns/:id/files/:type` | `getCampaignFile` | Verified |
| PUT | `/api/campaigns/:id/files/:type` | `updateCampaignFile` | Verified |
| GET | `/api/campaigns/:id/images` | `getCampaignImages` | Verified |
| GET | `/api/campaigns/:id/messages` | `getCampaignMessages` | Verified |
| POST | `/api/campaigns/:id/messages` | `addCampaignMessage` | Verified |
| GET | `/api/campaigns/:id/status` | `getCampaignStatus` | Verified |

### Assets (`/api/assets`)

| Method | Path | Function | Status |
|---|---|---|---|
| GET | `/api/assets/folders` | `listFolders` (with file counts) | Verified |
| POST | `/api/assets/folders` | `createFolder` | Verified |
| PATCH | `/api/assets/folders/:id` | `renameFolder` | Verified |
| DELETE | `/api/assets/folders/:id` | `deleteFolder` (R2 + D1 cleanup) | Verified |
| GET | `/api/assets/folders/:id/files` | `listFolderFiles` | Verified |
| POST | `/api/assets/upload` | `uploadFile` (FormData → R2) | Verified |
| GET | `/api/assets/files/:id` | `serveFile` (R2 → Response) | Verified |
| DELETE | `/api/assets/files/:id` | `deleteFile` (R2 + D1) | Verified |

### Other

| Method | Path | Function | Status |
|---|---|---|---|
| GET | `/health` | Health check (D1 + R2) | Verified |
| GET | `/images/:sessionId/:filename` | Image serving from R2 | Ready (no test images yet) |
| WebSocket | `/ws` | Routes to DO stub (Phase 3) | Stub |

## File Upload: multer → R2

The Express server used `multer` for disk-based uploads. The Worker uses:

1. `request.formData()` to parse multipart data (Web API, zero deps)
2. MIME type validation (same allowed types)
3. Size validation (10MB limit)
4. Unique filename generation (`{timestamp}-{random}.{ext}`)
5. `R2_BUCKET.put(key, file.stream())` for storage
6. D1 record with `file_path` = unique filename (R2 key prefix added at serve time)

R2 key format: `users/{userId}/uploads/{uniqueFilename}`

## CORS

Every response is wrapped with:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

OPTIONS preflight returns 204 with CORS headers.

## Validation & Error Handling

All error cases verified:
- 404 for nonexistent campaigns/folders/files
- 400 for missing required fields (name, role, content)
- 400 for invalid file types and message roles
- 403 for unauthorized file deletion
- Consistent `{ success: false, error: "..." }` format

## Deployment

```
Worker: https://creative-agent.alphasapien17.workers.dev
Upload size: 49.94 KiB / gzip: 10.29 KiB
Startup time: 21ms
```

## What's Next (Phase 3)

Phase 3 implements the Durable Object (`CampaignSession`) for WebSocket handling:
- WebSocket lifecycle (connect, message dispatch, close)
- Sandbox container management (start, exec, stream, destroy)
- SDK message parsing → WS event emission
- Event buffer for reconnect/replay
- D1 writes for campaign state during generation
