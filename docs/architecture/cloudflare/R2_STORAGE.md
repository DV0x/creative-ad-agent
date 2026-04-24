# R2 Storage

> Part of [Architecture Documentation](../INDEX.md) | **Buckets (per-env):** `creative-agent-assets` (staging) · `creative-agent-assets-prod` (production). Both bindings are exposed to the Worker / DO as `env.R2_BUCKET`, and to the sandbox at mount time via `env.R2_BUCKET_NAME`.

---

## Key Structure

```
{R2_BUCKET_NAME}/
└── users/{userId}/
    ├── images/{sessionId}/{timestamp}_{i+1}_{sanitized-prompt}.{ext}   # Generated images
    │                                                                    # sessionId is optional — orchestrator
    │                                                                    # passes one, but fallbacks drop it
    └── uploads/{folder_path}                                            # User-uploaded assets (path comes from D1)
```

**Bucket name is per-env.** The Worker reads via `env.R2_BUCKET.get(key)` (binding is resolved by wrangler). The sandbox container mounts via `sandbox.mountBucket(env.R2_BUCKET_NAME, '/mnt/r2', …)` — so `R2_BUCKET_NAME` must match the environment's bucket or writes land in the wrong place.

**Generated-image filename format:** `{timestamp}_{i+1}_{sanitizedPrompt}.{ext}` — `cloudflare/sandbox/nano-banana-mcp.ts:262`. Note the filename does NOT contain the hookType — hookType is derived from the 1-based index via `getHookTypeForIndex` and stored in D1's `campaign_images.hook_type` column, not in the R2 key.

**SDK JSONL is NOT in this tree.** The DO sets `HOME=/root` when spawning the agent (`campaign-session.ts:1482`), so the SDK's session log lives at `/root/.claude/projects/-app-agent/{sessionId}.jsonl` on the container's ephemeral disk, outside the FUSE mount. See the "SDK JSONL" subsection below.

> **No `completion_{campaignId}.json` on R2.** Earlier versions wrote a completion marker there; it was removed when `/recover` became D1-first. The only completion marker is `/app/turn-result.json` on the container's **local disk**. Grep `cloudflare/` for `completion_` — you will find nothing.

---

## How Data Gets In

### Generated Images

Written by the MCP tool (`cloudflare/sandbox/nano-banana-mcp.ts:262`) inside the sandbox container:

```
MCP tool:
  baseDir = process.env.IMAGE_OUTPUT_DIR || '/mnt/r2/images'
  outputDir = sessionId ? baseDir/sessionId : baseDir
  filename  = `${timestamp}_${i + 1}_${sanitizedPrompt}.${ext}`
  fs.writeFileSync(path.join(outputDir, filename), buffer)
    → s3fs FUSE → R2 PUT (happens when fd closes)
  Returns url: `/images/${sessionId ? sessionId + '/' : ''}${filename}`
```

After each write the MCP tool calls `fs.statSync(filepath)` and compares byte length — a silent FUSE failure throws instead of producing a zero-byte object. That's important because s3fs doesn't surface upload errors through the normal `writeFileSync` error path.

### Uploaded Assets

Written by the Worker route handler (`cloudflare/src/routes/assets.ts`):

```
POST /api/assets/upload
  → r2Key = `users/${userId}/uploads/${uniqueName}`
  → env.R2_BUCKET.put(r2Key, file.stream(), …)
  → db.insert('asset_files', { file_path: uniqueName, … })

GET /api/assets/files/:id
  → DB lookup { file_path }
  → env.R2_BUCKET.get(`users/${userId}/uploads/${file_path}`)
```

### Completion Marker (NOT on R2)

`cloudflare/sandbox/agent-runner.ts:255` — `writeCompletionMarker` writes **only** to `/app/turn-result.json` (container-local). The DO's `tryFinalize` reads it via `sandbox.readFile('/app/turn-result.json')`. No R2 write, no R2 read.

### SDK JSONL (NOT on R2)

The Claude SDK writes a per-session conversation log to `${HOME}/.claude/projects/{cwd-slugified}/{sessionId}.jsonl`. On Cloudflare the DO sets `HOME=/root` at `startProcess` (`campaign-session.ts:1482`) with cwd `/app/agent`, so the actual path is `/root/.claude/projects/-app-agent/{sessionId}.jsonl` — on the container's ephemeral disk, **not** the FUSE mount. It dies when the container is evicted.

Nothing reads it back on Cloudflare anyway — `RESUME_SDK_SESSION_ID` is always `''` on the DO's `startProcess` call (see [DURABLE_OBJECT.md § setupSandbox](./DURABLE_OBJECT.md#setupsandbox-prompt-sessionid-sdksessionid-)). That's a belt-and-suspenders decision: even if we routed the SDK JSONL through FUSE, s3fs null-byte pre-allocation would corrupt it on flush. Context resumption is handled instead via D1 conversation history + file hydration.

(The `-app-agent` slug is the container cwd with `/` replaced by `-` — not a hash, just how the SDK names its project directories.)

---

## How Data Gets Out

### Image Serving

```
GET /images/{campaignId}/{filename}
  → Worker auth check
  → R2_BUCKET.get(`users/${userId}/images/${path}`)
  → Response with Cache-Control: public, max-age=31536000, immutable
```

### Asset Serving

```
GET /api/assets/files/{fileId}
  → DB lookup for file_path
  → R2_BUCKET.get(file_path)
  → Response with content type
```

### Recovery (D1-first — no R2 read)

```
POST /api/campaigns/{id}/recover
  → db.getCampaignImages(id) + db.getCampaignFiles(id) + db.getLastAssistantMessage(id)
  → If any data present: synth completion, mark complete, return payload
  → No R2 access
```

See [recovery.ts:9-88](../../../cloudflare/src/routes/recovery.ts) and [DURABLE_OBJECT.md § Layer 4](./DURABLE_OBJECT.md#layer-4-client-recover). The legacy `pollR2CompletionMarker` function was removed in Session 65; the `/recover` path no longer touches R2.

---

## FUSE Mount Details

The sandbox mounts R2 at `/mnt/r2` via s3fs:

```typescript
// In DO's runGeneration():
// 1. Kill stale agent + clean mount
await sandbox.exec('pkill -f agent-runner 2>/dev/null || true');
try { await sandbox.unmountBucket('/mnt/r2'); } catch (_) {}
await sandbox.exec('pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; '
  + 'fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2');

// 2. Mount R2 — NOTE: bucket name is FIRST arg, mount path is SECOND
// env.R2_BUCKET_NAME is per-env: "creative-agent-assets" (staging) or
// "creative-agent-assets-prod" (production). NEVER hardcode it.
await sandbox.mountBucket(env.R2_BUCKET_NAME, '/mnt/r2', {
  endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  provider: 'r2',
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  readOnly: false,
  prefix: `/users/${userId}`,
});
```

### Flush Rules

```
                          ┌───────────┐
                          │ Your Code │
                          └─────┬─────┘
                                │
                         writeFileSync()
                         (open → write → close)
                                │
                                ▼
                        ┌───────────────┐
                        │ Linux Kernel  │
                        │ (VFS layer)   │
                        └───────┬───────┘
                                │
                          close(fd) triggers
                                │
                                ▼
                        ┌───────────────┐
                        │   s3fs-fuse   │──→ R2 Upload (HTTP PUT)
                        │  (userspace)  │
                        └───────────────┘

  ⚠️ Linux `sync` only reaches the kernel layer — NOT s3fs
  ⚠️ `sandbox.destroy()` may kill s3fs before upload completes
  ✅ `unmountBucket()` forces s3fs to flush ALL pending uploads
```

| Operation | Triggers R2 Upload? |
|---|---|
| `fs.writeFileSync(path, data)` | YES — opens, writes, closes. Upload on close |
| `fs.writeSync(fd, data)` on open fd | NO — upload only when fd is closed |
| Linux `sync` command | NO — flushes kernel buffers to s3fs, NOT s3fs→R2 |
| `fsync(fd)` | YES — per-fd flush |
| `unmountBucket()` | YES — guaranteed flush for ALL open files |
| `sandbox.destroy()` | MAYBE — race condition, files may be lost |

**Key rule:** Always call `unmountBucket()` before `sandbox.destroy()` to ensure data reaches R2.

---

## Gotchas

1. **`unmountBucket()` before `mountBucket()`** — If sandbox is reused, `mountBucket()` fails with `InvalidMountConfigError`. Must unmount first (try/catch for not-mounted case)

2. **Browser HTTP cache hides missing R2 data** — `Cache-Control: immutable` means browser serves from disk cache even after hard refresh. Use `fetch()` with `cache: 'no-store'` to test if data actually exists in R2

3. **`wrangler r2 object get` silently creates 0-byte files** — When key doesn't exist, exit code is 0. Always check file size after download

4. **No `r2 list` command** — Must use exact keys. Get paths from D1 (`campaign_images.file_path`)

5. **No R2 cleanup on campaign deletion** — `DELETE /api/campaigns/:id` removes DB records but leaves R2 objects. R2 costs accrue over time

6. **`/mnt/r2/images/` is cross-campaign.** With `prefix: /users/{userId}`, everything under `/mnt/r2/images/` is every image this user has ever generated (all campaigns). Per-campaign tracking is done via `/app/generated-images.jsonl` (container-local) which `writeCompletionMarker` reads + clears before the next turn. Without this, a follow-up would see prior turns' images in the R2 directory listing.

7. **Wrong bucket = silent data partition.** If `env.R2_BUCKET_NAME` disagrees with the bucket binding `env.R2_BUCKET` (e.g., deploying to prod with a staging override), images get mounted to one bucket and served from another. Always deploy via `wrangler deploy --env {staging|production}` — never edit bindings by hand.

---

## Inspection Commands

```bash
# Download an R2 object (staging)
npx wrangler r2 object get "creative-agent-assets/users/{userId}/images/{path}" \
  --remote --file=/tmp/out.png

# Download an R2 object (production)
npx wrangler r2 object get "creative-agent-assets-prod/users/{userId}/images/{path}" \
  --remote --file=/tmp/out.png

# Neither env has completion_{campaignId}.json anymore —
# if you need to inspect last-turn state, read D1 instead:
npx wrangler d1 execute creative-agent-db-prod --remote \
  --command="SELECT * FROM campaign_images WHERE campaign_id='...' ORDER BY image_index"
```

---

## See Also

- [D1 Database](./D1_DATABASE.md) — Metadata complement to R2 objects
- [Sandbox Container](./SANDBOX_CONTAINER.md) — FUSE mount details
- [Image Pipeline](../shared/IMAGE_PIPELINE.md) — End-to-end image flow
- [Debugging](../ops/DEBUGGING.md) — R2 inspection commands
