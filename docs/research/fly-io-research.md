# Fly.io Infrastructure Research for AI Agent Deployment

**Date**: 2026-03-23
**Purpose**: Evaluate Fly.io as an alternative to Cloudflare Workers + Durable Objects + Sandbox Containers for deploying an autonomous AI agent application (creative-agent).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [How Fly.io Works](#how-flyio-works)
3. [Pricing & Cost Analysis](#pricing--cost-analysis)
4. [Long-Running Processes](#long-running-processes)
5. [Persistent Storage (Volumes)](#persistent-storage-volumes)
6. [WebSocket Support](#websocket-support)
7. [Docker Deployment](#docker-deployment)
8. [SQLite on Fly.io](#sqlite-on-flyio)
9. [Static File Serving](#static-file-serving)
10. [Secrets Management](#secrets-management)
11. [Object Storage (Tigris)](#object-storage-tigris)
12. [Fly.io vs Cloudflare Workers](#flyio-vs-cloudflare-workers)
13. [Practical Deployment Guide](#practical-deployment-guide)
14. [Gotchas & Known Issues](#gotchas--known-issues)
15. [Reliability Assessment](#reliability-assessment)
16. [Recommendation for Creative-Agent](#recommendation-for-creative-agent)
17. [Gaps & Uncertainties](#gaps--uncertainties)
18. [Sources](#sources)

---

## Executive Summary

Fly.io runs your Docker containers as lightweight Firecracker microVMs on bare metal servers across 30+ regions. Unlike Cloudflare Workers (serverless, request-driven, ~50ms CPU limits), Fly.io gives you a **real Linux VM** that can run for hours/days, store files on persistent volumes, and maintain WebSocket connections without exotic workarounds.

**For the creative-agent use case** (long-running Claude SDK process, SQLite database, image storage, WebSocket streaming), Fly.io would dramatically simplify the architecture: one machine running Node.js + Express + SQLite + the agent process directly, instead of the current Worker + Durable Object + Sandbox Container + D1 + R2 stack.

**Confidence: HIGH** that Fly.io is architecturally simpler for this use case. **Confidence: MEDIUM** on reliability -- Fly.io has had well-documented infrastructure incidents, though the situation has improved since 2023.

---

## How Fly.io Works

### Core Concepts

- **Firecracker microVMs**: Not traditional Docker containers. Fly unpacks your Docker image into a root filesystem for a lightweight VM with hardware-level isolation. Sub-second boot times.
- **Fly Proxy**: A global Anycast proxy that routes traffic to your VMs, handles TLS termination, and manages auto-start/stop.
- **flyctl**: The CLI tool that handles everything -- deployment, scaling, secrets, volumes, SSH access.
- **fly.toml**: The single configuration file for your app (equivalent to `wrangler.jsonc`).

### Deployment Flow

```
1. Write a Dockerfile (or let fly.io detect your framework)
2. Run `fly launch` -- creates app, builds image, deploys
3. Run `fly deploy` for subsequent deploys
4. App gets a *.fly.dev domain with automatic TLS
```

### Available Regions (18+ gateway regions)

Key US regions: **iad** (Ashburn, VA), **ewr** (Secaucus, NJ), **dfw** (Dallas), **lax** (Los Angeles), **ord** (Chicago), **sjc** (San Jose).

Other notable: **ams** (Amsterdam), **cdg** (Paris), **fra** (Frankfurt), **lhr** (London), **nrt** (Tokyo), **sin** (Singapore), **syd** (Sydney).

**For AI agent use**: Deploy in **iad** (Ashburn) for lowest latency to Anthropic's API servers on US East Coast.

---

## Pricing & Cost Analysis

### Machine Types (billed per second, base region pricing)

| Type | RAM | Cost/hr | Cost/mo (always-on) |
|------|-----|---------|---------------------|
| shared-cpu-1x | 256MB | $0.0028 | $2.02 |
| shared-cpu-1x | 1GB | $0.0082 | $5.91 |
| shared-cpu-1x | 2GB | $0.0154 | $11.11 |
| shared-cpu-2x | 2GB | $0.0112 | $8.08 |
| shared-cpu-2x | 4GB | $0.0309 | $22.22 |
| shared-cpu-4x | 4GB | $0.0224 | $16.15 |
| shared-cpu-4x | 8GB | $0.0617 | $44.44 |
| performance-1x | 2GB | $0.0447 | $32.19 |
| performance-1x | 4GB | $0.0591 | $42.55 |
| performance-2x | 4GB | $0.0894 | $64.39 |

**Reservation blocks** give 40% discount: $36/year for $5/month credit (shared), $144/year for $20/month credit (performance).

### Storage

- **Volumes**: $0.15/GB/month (provisioned capacity)
- **Volume Snapshots**: $0.08/GB/month (first 10GB free)
- **Stopped Machines**: $0.15/GB/month for rootfs

### Network

- **IPv4 dedicated**: $2/month (shared IPv4 is free for HTTP/HTTPS)
- **IPv6**: Free
- **Egress (NA/EU)**: $0.02/GB
- **SSL Certificates**: First 10 single-hostname certs free, then $0.10/month each

### Free Tier / Trial

**No free tier** as of 2024. New accounts get a 2 VM-hour or 7-day trial (whichever first), then credit card required.

### Estimated Cost for Creative-Agent

| Component | Spec | Monthly Cost |
|-----------|------|-------------|
| Machine (always-on) | shared-cpu-2x, 4GB RAM | ~$22 |
| Volume (SQLite + images) | 10GB | $1.50 |
| Shared IPv4 | Free for HTTP | $0 |
| Egress (light usage) | ~5GB | $0.10 |
| Tigris (image storage) | 5GB free tier | $0 |
| **Total** | | **~$24/month** |

With auto-stop (scale to zero when idle): cost drops to **~$5-10/month** depending on usage.

With reservations (40% off): **~$15/month** always-on.

**Comparison**: Current Cloudflare setup costs are harder to calculate (Workers usage + D1 + R2 + container runtime), but Cloudflare's container pricing (standard-2 at 1 vCPU/6GB) is likely similar or higher per-minute.

---

## Long-Running Processes

### Can a Machine Run for Hours/Days?

**YES**. This is Fly.io's fundamental advantage over serverless. A Fly Machine is a real VM -- your Node.js process runs as PID 1 (via Fly's init wrapper) and stays alive as long as the process runs.

### Configuration for Always-On

```toml
# fly.toml
[http_service]
  internal_port = 3001
  auto_stop_machines = "off"     # Never auto-stop
  auto_start_machines = true     # Start on first request if stopped
  min_machines_running = 1       # Keep at least 1 running
```

### Configuration for Scale-to-Zero (Save Money)

```toml
[http_service]
  internal_port = 3001
  auto_stop_machines = "stop"    # Stop when idle
  auto_start_machines = true     # Wake on request
  min_machines_running = 0       # Allow full scale-to-zero
```

**Cold start latency**: ~300ms-2s depending on machine type. "Suspend" mode is faster than "stop" but has restrictions.

### Key Behavior

- **Fly Proxy determines "idle"** based on active HTTP connections. Background processes without HTTP connections may be incorrectly detected as idle.
- **Solution for AI agent**: Keep `auto_stop_machines = "off"` during active generation. Or keep a WebSocket connection alive (which counts as an active connection).
- The machine stays alive as long as your process runs. If your process exits (code 0), Fly's init kills the machine and (if auto-start is on) will restart on next request.
- `kill_timeout` (default 5s, max 300s) controls graceful shutdown time when Fly needs to stop your machine.

### How This Compares to Current Architecture

**Current (Cloudflare)**: Worker (50ms CPU limit) -> Durable Object (hibernation kills background promises) -> Sandbox Container (separate process, RPC over WebSocket, s3fs for storage, alarm heartbeat to prevent hibernation). The agent runs inside the sandbox container, not the Worker.

**Fly.io alternative**: Express server + agent process run in the SAME VM. No RPC bridge. No FUSE filesystem. No alarm heartbeat hack. The agent is just a child process or in-process SDK call.

**Confidence: HIGH** -- This is the simplest possible architecture for this use case.

---

## Persistent Storage (Volumes)

### How Volumes Work

Volumes are NVMe-backed persistent storage attached to a specific machine. They appear as a regular directory (e.g., `/data`).

```toml
# fly.toml
[[mounts]]
  source = "creative_agent_data"
  destination = "/data"
  initial_size = "10gb"
  snapshot_retention = 14
  auto_extend_size_threshold = 80
  auto_extend_size_increment = "1GB"
  auto_extend_size_limit = "50GB"
```

### Performance

| Machine Type | Max IOPs | Max Bandwidth |
|---|---|---|
| shared-cpu-1x/2x | 4,000 | 16 MiB/s |
| shared-cpu-4x/8x | 8,000 | 32 MiB/s |
| performance-1x | 12,000 | 48 MiB/s |
| performance-2x/4x | 16,000 | 64 MiB/s |

For comparison, ephemeral filesystem is only 2,000 IOPs / 8 MiB/s.

### Critical Limitations

1. **One volume per machine**: A machine can mount only ONE volume.
2. **Pinned to hardware**: Volume lives on a specific physical server. If that server fails, your volume is unavailable.
3. **No cross-machine sharing**: Cannot mount the same volume on two machines simultaneously.
4. **Not network storage**: This is NOT like EBS or a SAN. It is local NVMe on one host.
5. **Single-region**: Volumes cannot span regions.

### Backup Strategy

- **Automatic snapshots**: Daily block-level snapshots, 5-day retention (configurable 1-60 days).
- **Manual snapshots**: On-demand via CLI.
- **IMPORTANT**: "Daily automatic snapshots may not have your latest data." You need your own backup strategy.
- **Recommendation**: Use Litestream to continuously replicate SQLite to Tigris (S3-compatible). This gives you point-in-time recovery.

### For Creative-Agent

Store SQLite database + generated images on a single volume at `/data`. Directory structure:

```
/data/
  db/
    creative-agent.db        # SQLite database
    creative-agent.db-wal    # WAL file
    creative-agent.db-shm    # Shared memory
  images/
    {userId}/
      {campaignId}/
        {image_name}.png
  uploads/
    {userId}/
      {folderDir}/
        {filename}
```

**Risk mitigation**: Use Litestream for continuous SQLite backup to Tigris. If the host dies, restore from Tigris to a new volume.

---

## WebSocket Support

### Does It Work?

**YES**. WebSockets work natively on Fly.io. Fly Proxy handles TLS termination, so your app just runs a regular WebSocket server on the internal port -- no special TLS handling needed.

### Timeout Behavior

- **Idle timeout removed**: As of 2024, Fly.io removed its application-layer idle timeout for TCP connections. Long-lived WebSocket connections no longer get killed during inactivity.
- **Kernel-level keepalive**: Uses `SO_KEEPALIVE`, `TCP_KEEPIDLE`, etc. for connection health.
- **Connection limit**: 2,048 concurrent connections per edge per app. For a single-user creative-agent, this is more than sufficient.

### Configuration

No special configuration needed. Your Express/ws server listens on `internal_port` (e.g., 3001), Fly Proxy handles `wss://` on port 443.

```javascript
// Standard Node.js WebSocket setup -- works out of the box on Fly.io
import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ server: httpServer });
```

### Sticky Sessions / Routing

If running multiple machines, use the `fly-force-instance-id` header or `fly-replay` header to route WebSocket connections to a specific machine (the one with the user's data on its volume).

For single-machine deployment (our use case), this is not needed.

### Comparison to Cloudflare

**Current (Cloudflare)**: WS connects to Worker -> routes to Durable Object -> DO manages agent in sandbox container. SDK streaming goes through `streamProcessLogs()` which uses HTTP SSE internally (120s hardcoded timeout). Complex event pipeline with parsing, buffering, and replay issues.

**Fly.io alternative**: WS connects directly to Express server. Agent output streams through the same process. No SSE bridge. No DO hibernation worries. No replay/deduplication needed.

**Confidence: HIGH** -- Standard WebSocket with zero special configuration.

---

## Docker Deployment

### Step-by-Step

```bash
# 1. Install flyctl
brew install flyctl
# or: curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. From your project directory (with Dockerfile)
fly launch
# -> Creates app, detects Dockerfile, asks for app name + region
# -> Generates fly.toml
# -> Builds and deploys

# 4. Subsequent deploys
fly deploy

# 5. Open in browser
fly apps open
```

### Dockerfile for Creative-Agent

```dockerfile
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build React client
RUN cd client && npm ci && npm run build

# The app listens on this port
EXPOSE 3001

# Volume mount point will be at /data
CMD ["node", "server/index.js"]
```

### fly.toml for Creative-Agent

```toml
app = "creative-agent"
primary_region = "iad"
kill_timeout = 120

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"
  DATABASE_PATH = "/data/db/creative-agent.db"
  IMAGE_DIR = "/data/images"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "off"
  auto_start_machines = true
  min_machines_running = 1
  [http_service.concurrency]
    type = "connections"
    soft_limit = 100
    hard_limit = 200

[[mounts]]
  source = "creative_agent_data"
  destination = "/data"
  initial_size = "10gb"

[[vm]]
  size = "shared-cpu-2x"
  memory = "4gb"
```

### How This Compares to Cloudflare

**Current (Cloudflare) deploy**:
```bash
cd client && npm run build
docker logout registry.cloudflare.com
docker builder prune -af
cd ../cloudflare && npx wrangler deploy
# Two propagation phases, container image push ~2 min
# Each phase resets DOs, interrupting in-flight generations
```

**Fly.io deploy**:
```bash
fly deploy
# Single step, rolling deployment, zero-downtime with health checks
```

**Simplicity difference**: Fly.io deployment is significantly simpler. No Docker registry conflicts, no DO resets, no two-phase propagation, no `docker builder prune -af` required.

**Confidence: HIGH** on simpler deployment.

---

## SQLite on Fly.io

### Direct SQLite (Single Machine, Recommended for Creative-Agent)

Run SQLite directly on a Fly Volume. This is the simplest approach and works well for single-machine apps.

```bash
# Create a volume
fly volumes create creative_agent_data --size 10 --region iad
```

Use `better-sqlite3` (synchronous, fast) or any SQLite driver. Point it at `/data/db/creative-agent.db`.

### Critical Gotchas

1. **Scale to 1 machine**: `fly scale count 1`. SQLite does not support concurrent writes from multiple processes on different machines.
2. **Migrations in startup, not release command**: The release command runs in a temporary machine WITHOUT the volume. Run migrations in your app's startup code.
3. **WAL mode recommended**: Enables concurrent reads during writes.
4. **Backup with Litestream**: Continuously replicate to Tigris for disaster recovery.

### Litestream (Recommended Backup)

Litestream continuously replicates SQLite WAL changes to S3-compatible storage (like Tigris). It is a single-node disaster recovery tool -- simpler than LiteFS.

```dockerfile
# Add Litestream to your Dockerfile
RUN wget https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
    && tar -xzf litestream-*.tar.gz -C /usr/local/bin/
```

Configure via `litestream.yml`:
```yaml
dbs:
  - path: /data/db/creative-agent.db
    replicas:
      - type: s3
        endpoint: https://fly.storage.tigris.dev
        bucket: creative-agent-backups
        path: db/
```

### LiteFS (Multi-Region Replication, NOT Recommended)

LiteFS is a FUSE-based distributed filesystem that replicates SQLite across nodes. It is:
- Pre-1.0 and APIs may change
- "We are not able to provide support or guidance for this product" (Fly.io docs)
- **LiteFS Cloud was sunset in October 2024**
- Incompatible with autostop/autostart (risk of data loss)
- Overkill for a single-machine deployment

**Recommendation**: Use direct SQLite + Litestream for backup. Skip LiteFS unless you need multi-region replication.

### Comparison to D1

**Current (Cloudflare D1)**: Managed SQLite, globally replicated, accessed via binding. No direct file access. Query via HTTP/RPC. Limited to 10GB per database. Good for reads, write latency depends on primary location.

**Fly.io SQLite**: Direct file access with `better-sqlite3`. Full SQLite feature set (FTS, JSON, triggers, CTEs). No 10GB limit (volume up to 500GB). Synchronous reads/writes in the same process. But: you manage backups, no automatic replication, single-machine constraint.

**Confidence: HIGH** -- SQLite on Fly.io is simpler and more capable for a single-machine app, with the tradeoff of managing your own durability.

---

## Static File Serving

### Approach: Express Serves Everything

The simplest approach: build React in the Docker image, serve via `express.static()`.

```javascript
// server/index.js
import express from 'express';
import path from 'path';

const app = express();

// API routes
app.use('/api', apiRouter);

// WebSocket upgrade handled separately

// Serve React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback -- all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(3001);
```

### Alternative: Multi-Stage Docker Build with Nginx

For higher-performance static serving, use nginx for static files and proxy API requests to Node.js. More complex but better for high traffic.

### Fly.io [[statics]] Directive

Fly.io also has a `[[statics]]` directive in fly.toml for serving static files directly from the Fly Proxy (bypassing your app):

```toml
[[statics]]
  guest_path = "/app/client/dist"
  url_prefix = "/assets"
```

This is faster for static assets but requires your app to still handle the SPA fallback.

### Comparison to Cloudflare

**Current**: Workers Static Assets with `binding: "ASSETS"`. Worker checks if request matches a static file, falls back to `env.ASSETS.fetch(request)`. SPA fallback via `not_found_handling: "single-page-application"`.

**Fly.io**: Express middleware serves static files directly. Simpler to reason about -- it is just Node.js code.

---

## Secrets Management

### Setting Secrets

```bash
# Set individual secrets
fly secrets set ANTHROPIC_API_KEY=sk-ant-... CLERK_SECRET_KEY=sk_test_...

# Import from .env file
fly secrets import < .env

# Stage secrets (don't restart machines immediately)
fly secrets set --stage ANTHROPIC_API_KEY=sk-ant-...
fly secrets deploy  # Apply staged secrets

# List secrets (shows names + digests, NOT values)
fly secrets list

# Remove a secret
fly secrets unset SECRET_NAME
```

### How Secrets Work

1. Values stored in an encrypted vault (API servers can encrypt but NOT decrypt)
2. At boot time, Fly's host agent gets a temporary token to decrypt secrets
3. Secrets injected as environment variables into your machine
4. Available via `process.env.ANTHROPIC_API_KEY` in Node.js

### Non-Sensitive Config

Put non-sensitive values in `fly.toml` under `[env]`:
```toml
[env]
  NODE_ENV = "production"
  LOG_LEVEL = "info"
```

### Comparison to Cloudflare

**Current**: `wrangler secret put SECRET_NAME` (trailing newlines are a gotcha -- must `tr -d '\n'`). Secrets need redeploy to take effect. Can also use `.dev.vars` for local dev.

**Fly.io**: `fly secrets set` triggers immediate machine restart (or use `--stage` to defer). Imports from `.env` files directly. No trailing newline gotcha.

**Confidence: HIGH** -- Fly.io secrets management is simpler and less error-prone.

---

## Object Storage (Tigris)

### What It Is

Tigris is Fly.io's globally distributed, S3-compatible object storage with **zero egress fees**. Built on Fly's infrastructure.

### Pricing

| Feature | Cost |
|---------|------|
| Standard storage | $0.02/GB/month |
| Free tier | 5GB + 10K writes + 100K reads/month |
| Egress | **Free** (no egress fees) |
| PUT/POST requests | $0.005/1000 |
| GET requests | $0.0005/1000 |

### Use Case for Creative-Agent

Store generated images in Tigris instead of on the volume:
- **Pros**: Zero egress, globally cached (CDN-like), survives volume/host failure, public bucket option for direct image serving
- **Cons**: Additional API calls, slight latency vs local disk, need S3 client library

### Alternative: Just Use the Volume

For a single-machine app with light traffic, storing images on the volume at `/data/images/` is simpler. Use Tigris only for:
- Backup (via Litestream for SQLite)
- Image storage if you need CDN-like global caching
- If volume capacity becomes a concern

---

## Fly.io vs Cloudflare Workers

### Architecture Comparison

| Aspect | Cloudflare Workers | Fly.io |
|--------|-------------------|--------|
| **Compute model** | Serverless (request-driven) | VM (always-on or auto-stop) |
| **CPU limits** | 50ms (free) / 30s (paid) | Unlimited (full VM) |
| **Memory** | 128MB | 256MB - 64GB |
| **Long-running processes** | Not supported (needs DO + Containers) | Native -- your process runs as long as needed |
| **State management** | D1, KV, R2, Durable Objects | SQLite on volume, Tigris, Postgres |
| **WebSocket** | Via Durable Objects only | Native on any machine |
| **Cold start** | ~0ms (V8 isolate) | ~300ms-2s (microVM) |
| **Global distribution** | 300+ PoPs, automatic | 30+ regions, manual placement |
| **Deployment** | `wrangler deploy` | `fly deploy` |
| **Docker support** | Sandbox Containers (beta) | First-class (Dockerfile-based) |
| **Pricing model** | Request-based + resource-based | Per-second VM + storage + bandwidth |

### For Creative-Agent Specifically

| Concern | Cloudflare (Current) | Fly.io (Proposed) |
|---------|---------------------|-------------------|
| **Agent execution** | Sandbox Container (separate process, RPC bridge) | Direct child process or in-process SDK |
| **State persistence** | D1 + R2 (network calls) | SQLite on local volume (disk access) |
| **Image storage** | R2 (requires s3fs FUSE mount in sandbox) | Local volume or Tigris |
| **WebSocket streaming** | Worker -> DO -> Sandbox -> SSE -> WS (5-layer pipeline) | Express -> WS (direct) |
| **Deploy complexity** | Docker prune + wrangler deploy + two-phase propagation | `fly deploy` (one step) |
| **DO resets on deploy** | Yes (kills in-flight generations) | Rolling deploy (zero downtime) |
| **Hibernation workarounds** | Alarm heartbeat, fire-and-forget, tail log buffer | Not needed (VM stays alive) |
| **Context management** | D1 hydration on cold start (SDK JSONL corrupt on s3fs) | SQLite direct or SDK JSONL on local disk |
| **Sandbox IP blocking** | Pre-flight retry with different sandbox IDs | Not applicable (outbound from your VM) |
| **Components to manage** | Worker + DO + D1 + R2 + Sandbox Container | One machine + one volume |

### What Fly.io Eliminates

The following creative-agent complexities become unnecessary on Fly.io:

1. **Durable Object state machine** -- No DO hibernation, no alarm heartbeat, no `isGenerating` lock complexity
2. **Sandbox Container management** -- No `getSandbox()`, no `mountBucket()`/`unmountBucket()`, no FUSE filesystem
3. **s3fs corruption** -- No null-byte corruption from s3fs pre-allocation
4. **SSE streaming bridge** -- No `streamProcessLogs()`, no `parseSSEStream()`, no 120s hardcoded timeout
5. **SDK session resume** -- No JSONL corruption, can use SDK session files directly on local disk
6. **Two-phase deployment** -- No DO resets interrupting in-flight generations
7. **Container IP blocking** -- Anthropic API called from your VM's IP, not from a container subnet
8. **Fire-and-forget pattern** -- No need for async generation with alarm keepalive
9. **Turn-result.json IPC** -- Agent and server in same process, no file-based IPC needed
10. **Campaign file hydration** -- Files persist on volume across requests, no need to restore from D1

### What You Lose Moving to Fly.io

1. **Global edge distribution**: Cloudflare Workers run at 300+ PoPs. Fly.io runs in 30+ regions but you pick where.
2. **Near-zero cold starts**: Workers start in ~0ms. Fly machines take 300ms-2s.
3. **Managed database replication**: D1 handles read replicas automatically. SQLite on Fly needs manual backup.
4. **Cloudflare network protection**: DDoS protection, Bot Management, WAF. On Fly.io you would add Cloudflare as a CDN/proxy in front.
5. **Mature container isolation**: Sandbox Containers provide per-user isolation. On Fly.io, the agent runs in the same VM as the server.

### Steel-Man Counter-Argument (Against Moving to Fly.io)

The strongest argument against migrating:

- **The current architecture works**. All 6 E2E tests pass. Image generation completes end-to-end. The complexity is documented and understood.
- **Fly.io reliability concerns are real**. There have been documented outages, API failures, and volume-pinning issues. Cloudflare's edge network is battle-tested at massive scale.
- **Single-machine risk**: On Fly.io with one machine and one volume, a host failure means downtime AND potential data loss. D1 + R2 on Cloudflare are replicated by design.
- **You trade complexity for different complexity**: Instead of DO state machines, you manage VM lifecycle, volume backups, Litestream configuration, and rollback procedures.

**What would change this assessment**: If Fly.io had a significant outage pattern in your deployment region (iad), or if your app needed true multi-region active-active deployment, Cloudflare's architecture would be more appropriate.

---

## Practical Deployment Guide

### Step 1: Install and Setup

```bash
brew install flyctl
fly auth login
```

### Step 2: Create App

```bash
cd creative-agent
fly launch --no-deploy
# Choose:
#   App name: creative-agent
#   Region: iad (Ashburn, Virginia)
#   No Postgres
#   No Redis
```

### Step 3: Create Volume

```bash
fly volumes create creative_agent_data \
  --size 10 \
  --region iad \
  --count 1
```

### Step 4: Set Secrets

```bash
fly secrets set \
  ANTHROPIC_API_KEY=sk-ant-... \
  CLERK_SECRET_KEY=sk_test_... \
  FAL_KEY=... \
  CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Step 5: Configure fly.toml

(See the fly.toml example in the Docker Deployment section above)

### Step 6: Deploy

```bash
fly deploy
```

### Step 7: Verify

```bash
fly status           # Check machine status
fly logs             # Stream logs
fly ssh console      # SSH into the machine
fly apps open        # Open in browser
```

### Step 8: Custom Domain (Optional)

```bash
fly certs add yourdomain.com
# Add CNAME record pointing to your-app.fly.dev
# Fly.io auto-issues Let's Encrypt certificate
```

---

## Gotchas & Known Issues

### Deployment Gotchas

1. **Volume not available during release command**: Don't run migrations in `[deploy] release_command`. Run them in your app's startup code.
2. **Default machine size is small**: `shared-cpu-1x` with 1GB RAM. For AI agent work, upgrade to at least `shared-cpu-2x` with 4GB.
3. **Single machine with volume = downtime during deploys**: Rolling deploy stops the old machine before starting the new one (because the volume can only be attached to one machine). Brief downtime (~5-30s).
4. **Remote builder is default**: Builds happen on Fly's remote builder, not locally. Use `--local-only` if you have Docker installed and want faster builds.

### Volume Gotchas

5. **Volumes are pinned to hardware**: If the host server fails, your volume is unavailable until hardware is fixed. This is NOT like AWS EBS.
6. **One volume per machine**: Cannot mount multiple volumes on one machine.
7. **Cannot shrink volumes**: Only expand. Plan initial size carefully.
8. **Snapshots may lag**: Daily snapshots might not capture latest data. Use Litestream for real-time backup.

### Network Gotchas

9. **Shared IPv4 requires HTTP/TLS**: Non-HTTP, non-TLS TCP on shared IPv4 does not work (proxy needs SNI/Host header). WebSockets over HTTPS work fine.
10. **Flycast (internal) requires `force_https = false`**: Internal Flycast addresses are HTTP-only.
11. **Connection limit**: 2,048 concurrent connections per edge per app. Not a concern for small apps but worth knowing.

### Operational Gotchas

12. **`auto_stop_machines` uses HTTP idle detection**: Background processes without HTTP connections may be stopped. Disable auto-stop for always-on workloads.
13. **Cannot disable Fly's init**: Your process runs under Fly's init. Use ENTRYPOINT scripts for pre-start setup.
14. **Secrets cause machine restart**: `fly secrets set` immediately restarts all machines unless you use `--stage`.
15. **DFW (Dallas) region had elevated failure rates** in March 2026. Prefer iad (Ashburn) for reliability.

---

## Reliability Assessment

### Historical Issues (Confidence: MEDIUM on current reliability)

**2023 (Major)**: Reliability was "not great" per Fly.io's own CEO. Service discovery corruption, centralized Vault failures, Postgres cluster breakdowns, capacity problems from rapid growth (30%/month from Heroku migration).

**2024**: Improved significantly. Replaced Consul with custom gossip system. Shipped personalized status pages. Upgraded Postgres infrastructure. Still had occasional incidents.

**2025**: Flood of 500 errors in Machines API (February). Deploy issues in European regions. Depot Builder outage (May). Some billing complaints on Trustpilot.

**2026 (March)**: Elevated Machine start failure rates in DFW region. 401 errors for orgs with numeric-prefixed names.

### Mitigation Strategy

1. **Use Litestream** for continuous SQLite backup to Tigris
2. **Deploy in iad** (most reliable region, close to Anthropic APIs)
3. **Volume snapshots** with 14-day retention
4. **Health checks** configured in fly.toml
5. **Monitor** via `fly status` and `fly logs`

### Who Would Disagree?

**A reliability engineer** would point out that Fly.io's single-volume-on-single-host model is fundamentally less durable than Cloudflare's replicated D1/R2. If your host dies, you have downtime AND risk data loss (mitigated by Litestream, but there is still a window). For a production SaaS with paying customers, this matters. For a development/MVP tool with one user, the simplicity tradeoff is worth it.

---

## Recommendation for Creative-Agent

### Verdict: Fly.io Would Be Significantly Simpler

**For the current use case** (single user, AI agent generating ad campaigns, moderate traffic), Fly.io eliminates roughly 60% of the architectural complexity:

| Metric | Cloudflare (Current) | Fly.io (Proposed) |
|--------|---------------------|-------------------|
| Infrastructure components | 5 (Worker, DO, D1, R2, Sandbox) | 2 (Machine, Volume) |
| Config files | wrangler.jsonc + schema.sql | fly.toml + Dockerfile |
| Core source files | ~6,000 lines across 6+ files | ~1,500 lines in 2-3 files (estimate) |
| Known gotchas documented | 30+ in MEMORY.md | ~15 expected |
| Deploy command | 4-step process with pruning | `fly deploy` |
| Session docs for debugging | 55+ sessions | Would start fresh |

### Migration Path

A phased approach:

1. **Phase 1**: Deploy Express server + SQLite + static assets on Fly.io. No agent yet.
2. **Phase 2**: Add Claude SDK as in-process agent. Test generation flow.
3. **Phase 3**: Add WebSocket streaming. Test with real client.
4. **Phase 4**: Add Litestream backup. Production hardening.

### What Would Change This Recommendation

- If you need **multi-region active-active** deployment (Cloudflare is better)
- If Fly.io has **sustained outages in iad** region
- If the creative-agent needs **per-user isolation** (separate sandboxes per user for security)
- If the user base grows to **hundreds of concurrent users** (would need to rethink single-machine architecture)
- If Cloudflare **simplifies their container story** significantly (making the current architecture less painful)

### What Changes in 12 Months?

- **Cloudflare Containers** may mature beyond beta, potentially closing the simplicity gap
- **Fly.io reliability** has been trending upward but is not yet at Cloudflare/AWS levels
- **Railway** could be an even simpler alternative if they add volume support and WebSocket features
- **AI agent frameworks** may standardize deployment patterns, making platform choice less critical

---

## Gaps & Uncertainties

1. **Exact cold start latency for shared-cpu-2x with 4GB RAM**: Searched but could not find specific benchmarks. Estimated 300ms-2s. **Confidence: MEDIUM**.

2. **Volume failover time**: When a host fails, how long until the volume is available on a replacement host? Could not find specific SLA. **Confidence: LOW**.

3. **Fly.io uptime SLA**: No published SLA found for non-enterprise customers. Enterprise support starts at $2,500/month. **Confidence: LOW** on guaranteed uptime.

4. **Claude SDK running directly on Fly.io**: No firsthand reports of running the Anthropic Claude SDK (the `@anthropic-ai/claude-code` package with MCP tools) on Fly.io found. The SDK should work fine in a standard Node.js environment, but untested. **Confidence: MEDIUM**.

5. **Concurrent generation on single machine**: How well does a shared-cpu-2x handle Express + WebSocket + Claude SDK + image processing simultaneously? Untested. **Confidence: MEDIUM**.

6. **Inter-region pricing change (Feb 2026)**: Private network traffic now billed. Impact for single-region deployment is zero, but worth knowing for future. **Confidence: HIGH** (documented).

7. **Billing predictability**: Multiple user reports of unexpected charges. The pay-as-you-go model with many cost components (compute, storage, egress, IPv4, snapshots) can be surprising. **Confidence: MEDIUM** on predictable costs.

8. **Litestream + Tigris integration**: Documented by Fly.io but limited firsthand production reports for Node.js apps. **Confidence: MEDIUM**.

---

## Sources

### Official Fly.io Documentation
- [Fly.io Resource Pricing](https://fly.io/docs/about/pricing/) - Accessed 2026-03-23
- [Fly Volumes Overview](https://fly.io/docs/volumes/overview/) - Accessed 2026-03-23
- [Autostop/Autostart Machines](https://fly.io/docs/launch/autostop-autostart/) - Accessed 2026-03-23
- [Deploy with a Dockerfile](https://fly.io/docs/languages-and-frameworks/dockerfile/) - Accessed 2026-03-23
- [Secrets and Fly Apps](https://fly.io/docs/apps/secrets/) - Accessed 2026-03-23
- [LiteFS - Distributed SQLite](https://fly.io/docs/litefs/) - Accessed 2026-03-23
- [App Configuration (fly.toml)](https://fly.io/docs/reference/configuration/) - Accessed 2026-03-23
- [JavaScript on Fly.io](https://fly.io/docs/js/) - Accessed 2026-03-23
- [Fly.io Regions](https://fly.io/docs/reference/regions/) - Accessed 2026-03-23
- [Custom Domains](https://fly.io/docs/networking/custom-domain/) - Accessed 2026-03-23
- [Run a Static Website](https://fly.io/docs/languages-and-frameworks/static/) - Accessed 2026-03-23
- [WebSockets and Fly](https://fly.io/blog/websockets-and-fly/) - Blog post
- [Tigris Global Object Storage](https://fly.io/docs/tigris/) - Accessed 2026-03-23

### Fly.io Community / Blog
- [Reliability: It's Not Great](https://community.fly.io/t/reliability-its-not-great/11253) - March 2023, CEO post + community discussion
- [Is Fly.io Suitable for Long-Running Jobs?](https://community.fly.io/t/is-fly-io-suitable-for-long-running-jobs/17605) - Community discussion
- [TCP Idle Timeouts Restrictions Removed](https://community.fly.io/t/tcp-idle-timeouts-restrictions-have-been-removed/15160) - 2024 announcement
- [Sunsetting LiteFS Cloud](https://community.fly.io/t/sunsetting-litefs-cloud/20829) - October 2024 sunset
- [Litestream: Revamped](https://fly.io/blog/litestream-revamped/) - Blog post on Litestream improvements
- [LiteFS Cloud: Distributed SQLite with Managed Backups](https://fly.io/blog/litefs-cloud/) - Blog post

### Third-Party Analysis
- [Fly.io Complete Guide 2026 (Kuberns)](https://kuberns.com/blogs/post/what-is-flyio/) - 2026
- [Fly.io Pricing Breakdown (Orb)](https://www.withorb.com/blog/flyio-pricing) - 2025
- [Fly.io vs Cloudflare Workers (srvrlss)](https://www.srvrlss.io/compare/cloudflare-vs-fly/) - Comparison
- [Railway vs Render vs Fly.io (codeYaan)](https://codeyaan.com/blog/top-5/railway-vs-render-vs-flyio-comparison-2624) - 2026 comparison
- [Fly.io Free Allowance 2026 (SaasPricePulse)](https://www.saaspricepulse.com/tools/flyio) - 2026 pricing changes
- [Tigris Pricing](https://www.tigrisdata.com/pricing/) - Official Tigris pricing page
- [Monitoring Latency Comparison (OpenStatus)](https://www.openstatus.dev/blog/monitoring-latency-cf-workers-fly-koyeb-raylway-render) - Performance benchmarks

### AI Agent on Fly.io
- [Go AI Agents on Fly.io](https://fly.io/go/agents) - Official Fly.io agents page
- [Building Go Apps with Claude on Fly.io](https://fly.io/go/agents/claude) - Claude + Fly.io guide
- [Ephemeral VM Claude Code on Fly.io](https://shareful.ai/s/mblode/shares/pattern-ephemeral-vm-claude-code) - Community pattern
