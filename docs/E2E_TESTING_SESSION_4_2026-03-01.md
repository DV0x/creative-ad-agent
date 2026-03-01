# End-to-End Testing Session 4 — 2026-03-01

> Status: **standard-2 IP blocking resolved** — full generation verified on standard-2
> Branch: `new-ui`
> Deployed URL: https://creative-agent.alphasapien17.workers.dev
> Deployed Version: `4df0ae1c`
> Container Instance: `standard-2` (1 vCPU, 6 GiB RAM, 12 GB disk)

---

## Summary

Fourth E2E testing session. Investigated and permanently resolved the `standard-2` container IP blocking issue from Session 3. Root cause: Cloudflare was placing containers in **Hong Kong** (nearest datacenter to India), and Anthropic blocks API access from Hong Kong IPs. Fix: added Worker placement region hint (`aws:us-east-1`) and DO location hint (`enam`), which moved container placement to a US datacenter. Full generation completed successfully on `standard-2` in ~5.3 minutes.

---

## Root Cause: Container Placed in Hong Kong

### The problem (from Session 3)

`standard-2` containers returned 403 from Anthropic API. Session 3 identified it as an IP-level block (`104.28.157.x` range) but didn't determine *why* that IP was blocked.

### Discovery

The Cloudflare dashboard container instance detail page revealed the answer:

| Field | Value |
|-------|-------|
| **Status** | Running |
| **Location** | **Hong Kong, Hong Kong** |
| **Memory** | 6144 MiB |
| **vCPU** | 1 |

Anthropic restricts API access from certain regions, including Hong Kong. The container was placed there because the user is in India (GMT+5:30), and Hong Kong is the nearest Cloudflare datacenter with `standard-2` capacity.

### Why standard-1 worked

`standard-1` instances happened to be placed in a US datacenter (IP `104.28.156.x`), likely due to different capacity distribution across instance types. This was luck, not design.

### Research findings

This is a **known class of issue** across the industry:
- Cloudflare Workers/Containers route through whatever datacenter they're scheduled in
- AI API providers (Anthropic, OpenAI, Google) block requests from restricted regions
- Multiple Cloudflare community threads document similar 403 errors from HKG-routed requests
- Cloudflare's egress IP assignment is opaque and not documented per instance type

---

## The Fix

### 1. Worker placement region hint (`wrangler.jsonc`)

```jsonc
// Place Worker near US East — Anthropic API is US-hosted
"placement": {
  "region": "aws:us-east-1"
}
```

This tells Cloudflare to run the Worker in the datacenter closest to `aws:us-east-1`, which pulls the DO and container placement toward the US.

### 2. Durable Object location hint (`src/index.ts`)

```typescript
const stub = env.CAMPAIGN_SESSION.get(doId, { locationHint: 'enam' });
```

Best-effort hint to place the DO in Eastern North America. Only applies on first creation.

### 3. Container observability (`wrangler.jsonc`)

```jsonc
"observability": {
  "enabled": true
}
```

Enables container logs in the Cloudflare dashboard for debugging.

### What didn't work

| Attempt | Result |
|---------|--------|
| `locationHint: "enam"` alone (without `placement.region`) | Container still placed in HK, IP `104.28.157.198` — **403** |
| `placement: { mode: "smart" }` | Container still placed in HK — **403** |
| `placement: { region: "aws:us-east-1" }` + `locationHint: "enam"` | Container placed in US, IP `104.28.156.131` — **200** |

The `placement.region` in `wrangler.jsonc` was the key fix. `locationHint` alone is best-effort and was ignored.

### Docker cache issue

The first deploy with placement hints showed "Image already exists remotely, skipping push" — the cached Docker image was reused. Running `docker builder prune -af` before deploy forced a fresh build and new image push, which triggered Cloudflare to create new container instances in the correct region.

---

## Full Generation Results (standard-2)

### Test parameters
- **Prompt:** "Create conversion ads for a premium coffee brand called 'Dark Roast Co' at https://darkroastco.com - they sell organic single-origin coffee beans. Make 2 ads in clay diorama style."
- **Instance:** standard-2 (1 vCPU, 6 GiB RAM)
- **Model:** claude-haiku-4-5-20251001

### Timeline

```
[0.9s]   WebSocket connect
[2.1s]   ACK + PHASE:parse
[3.3s]   API key verified (DO: 200)
[5.2s]   Sandbox boot + R2 mount
[10.3s]  Network tests passed (WITH_KEY=200, BAD_KEY=401, IP=104.28.156.131)
[14.2s]  MCP server initialized (nano-banana v5.1.0)
[31.8s]  SDK system/init
[36.2s]  First Claude response — "I'll create 2 conversion ads..."
[37.9s]  TOOL_START: Agent (research subagent)
[43.4s]  TOOL_START: WebFetch (darkroastco.com)
[77.4s]  FILE: research (research.md created)
[88.9s]  PHASE:hooks — "Generating conversion hooks..."
[89.2s]  TOOL_START: Skill (hook-methodology)
[127.4s] FILE: hooks (hook-bank created)
[133.1s] PHASE:art — "Creating visual concepts in clay diorama style..."
[133.1s] TOOL_START: Skill (art-style)
[181.1s] FILE: prompts (prompts.json created)
[204.2s] TOOL_START: mcp__nano-banana__generate_ad_images + PHASE:images
[204.2s] Image 1/2 generating...
[254.7s] Image 1 saved (48.6s generation time)
[255.1s] Image 2/2 generating...
[304.3s] Image 2 saved (47.5s generation time)
[307.9s] IMAGE #1 → stat hook (clay diorama)
[308.4s] IMAGE #2 → story hook (clay diorama)
[316.7s] Final summary message
[316.9s] COMPLETE ✓
```

### Timing breakdown

| Phase | Duration | Notes |
|-------|----------|-------|
| WebSocket + ACK | ~2s | |
| Sandbox boot + R2 mount | ~8s | Including network test |
| SDK initialization | ~22s | npx tsx compile + CLI init |
| Research | ~50s | 2 WebFetch calls + Write |
| Hooks | ~40s | Skill call + retry + Write |
| Art / Prompts | ~50s | Skill + prompt generation |
| Image generation | ~100s | 2 images via fal.ai (~48s each) |
| **Total** | **~317s (~5.3 min)** | |

### Performance comparison

| Instance | Total Time | Notes |
|----------|-----------|-------|
| `standard-1` (Session 3) | ~426s (~7.1 min) | 0.5 vCPU, 4 GiB |
| `standard-2` (Session 4) | ~317s (~5.3 min) | 1 vCPU, 6 GiB |
| **Improvement** | **~26% faster** | |

### Output
- **Events:** 146 WebSocket events
- **Images:** 2 (both saved to R2, delivered via WebSocket)
- **Files:** research.md, hook-bank.md, prompts.json (all saved to D1)

---

## All Changes This Session

| File | Changes |
|------|---------|
| `cloudflare/wrangler.jsonc` | Added `placement.region: "aws:us-east-1"`, `observability.enabled: true`, changed `instance_type` to `standard-2` |
| `cloudflare/src/index.ts` | Added `{ locationHint: 'enam' }` to `CAMPAIGN_SESSION.get()` call |

---

## Key Learnings

### 11. Container placement follows the user, not the API

Without explicit placement hints, Cloudflare places containers near the requesting user. For users in Asia, this means HKG or SIN datacenters — which are blocked by Anthropic's regional restrictions. Always use `placement.region` when your container calls geo-restricted APIs.

### 12. `placement.region` is more effective than `locationHint`

`locationHint` on DO `.get()` is best-effort and was ignored in our tests. The `placement.region` field in `wrangler.jsonc` was the actual fix. Use both for defense in depth, but `placement.region` is the reliable one.

### 13. Docker build cache can prevent deployment changes

Wrangler skips image push if the Docker image SHA matches. When only `wrangler.jsonc` config changes (not Dockerfile or source files), the image stays cached. Run `docker builder prune -af` to force a fresh build when needed.

### 14. standard-2 is 26% faster than standard-1

With double the CPU (1 vs 0.5 vCPU), SDK compilation and agent processing complete significantly faster. The generation pipeline dropped from ~7 min to ~5.3 min. The extra cost (~$0.001 per generation) is negligible.

---

## Current Deployed Configuration

```jsonc
{
  "placement": { "region": "aws:us-east-1" },
  "containers": [{
    "instance_type": "standard-2",
    "max_instances": 10
  }],
  "observability": { "enabled": true }
}
```

Container location hint in `src/index.ts`:
```typescript
env.CAMPAIGN_SESSION.get(doId, { locationHint: 'enam' })
```

---

## What Still Needs Testing

(Unchanged from Session 3)

1. **Cancel flow** — start generation, send `{ "type": "cancel" }` mid-pipeline
2. **Follow-up/resume** — after complete generation, send `follow_up` with campaignId
3. **REST API** — `GET /api/campaigns`, `GET /api/campaigns/:id`
4. **Image serving** — `GET /images/{sessionId}/{filename}` from R2 via Worker
5. **Reconnect/subscribe** — disconnect during generation, reconnect, send `subscribe` with `lastEventId`
6. **Client UI** — connect the React frontend to the deployed Worker

---

## Deployment Commands Reference

```bash
# From cloudflare/ directory:

# Clean Docker cache (do this before deploy if image isn't changing)
docker builder prune -af

# Deploy Worker + container
npx wrangler deploy

# Set secrets (ALWAYS strip newlines!)
grep '^ANTHROPIC_API_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put ANTHROPIC_API_KEY
grep '^FAL_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put FAL_KEY

# Check container status
npx wrangler containers list

# Health check
curl https://creative-agent.alphasapien17.workers.dev/health

# Run E2E test (from project root)
cd /Users/chakra/Documents/Agents/creative_agent
node test-e2e.mjs
```
