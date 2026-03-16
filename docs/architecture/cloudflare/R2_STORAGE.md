# R2 Storage

> Part of [Architecture Documentation](../INDEX.md) | **Bucket:** `creative-agent-assets`

---

## Key Structure

```
creative-agent-assets/
└── users/{userId}/
    ├── images/{sessionId}/{index}_{hookType}_{name}.png    # Generated images
    ├── uploads/{folderDir}/{filename}                      # User-uploaded assets
    ├── .claude/projects/-app-agent/{sdkSessionId}.jsonl    # SDK conversation log
    └── completion_{campaignId}.json                        # Completion marker
```

**SDK project path:** NOT a hash — it's the container cwd with `/` replaced by `-` (cwd `/app/agent` → `-app-agent`)

---

## How Data Gets In

### Generated Images

Written by the MCP tool (`nano-banana-mcp.ts`) inside the sandbox container:

```
MCP tool → fs.writeFileSync('/mnt/r2/images/{sessionId}/1_stat_bold.png', buffer)
          → s3fs FUSE upload → R2 bucket
```

### Uploaded Assets

Written by the Worker route handler (`routes/assets.ts`):

```
POST /api/assets/upload → env.R2_BUCKET.put('users/{userId}/uploads/...', body)
```

### Completion Marker

Written by `agent-runner.ts` after each turn:

```
fs.writeFileSync('/mnt/r2/completion_{campaignId}.json', JSON.stringify(marker))
→ s3fs FUSE upload → R2
```

### SDK JSONL

Written automatically by Claude SDK. Contains the full conversation log for session resume.

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

### Recovery

```
POST /api/campaigns/{id}/recover
  → R2_BUCKET.get(`users/${userId}/completion_{campaignId}.json`)
  → Parse marker → sync images/files to D1
```

### Alarm Polling

```
alarm() → pollR2CompletionMarker()
  → R2_BUCKET.get(`users/${userId}/completion_{campaignId}.json`)
  → If exists: reconcile to D1, mark complete
```

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
await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
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

6. **Completion marker scans ALL user images** — `/mnt/r2/images/` contains all campaigns for the user. The tracking file approach (`/app/generated-images.jsonl`) was written to fix this but not fully deployed

---

## Inspection Commands

```bash
# Download an R2 object
npx wrangler r2 object get "creative-agent-assets/users/{userId}/images/{path}" \
  --remote --file=/tmp/out.png

# Check if completion marker exists
npx wrangler r2 object get "creative-agent-assets/users/{userId}/completion_{campaignId}.json" \
  --remote --file=/tmp/marker.json && cat /tmp/marker.json | python3 -m json.tool
```

---

## See Also

- [D1 Database](./D1_DATABASE.md) — Metadata complement to R2 objects
- [Sandbox Container](./SANDBOX_CONTAINER.md) — FUSE mount details
- [Image Pipeline](../shared/IMAGE_PIPELINE.md) — End-to-end image flow
- [Debugging](../ops/DEBUGGING.md) — R2 inspection commands
