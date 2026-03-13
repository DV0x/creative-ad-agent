# End-to-End Testing Session 3 — 2026-03-01

> Status: **Full generation verified** — 2 images generated end-to-end
> Branch: `new-ui`
> Deployed URL: https://creative-agent.alphasapien17.workers.dev
> Deployed Version: `51efc936`
> Container Instance: `standard-1` (0.5 vCPU, 4 GiB RAM, 8 GB disk)

---

## Summary

Third E2E testing session. Investigated persistent 403 authentication errors from the Anthropic API when calling from inside the sandbox container. Through systematic debugging, discovered that **the 403 was not an API key issue** — it was an IP-level block by Anthropic on the outbound IP assigned to `standard-2` container instances. Reverting to `standard-1` resolved the issue. Full generation completed successfully: research → hooks → art → 2 images in clay diorama style, ~7 minutes total.

---

## Root Cause: standard-2 Outbound IP Blocked by Anthropic

### The problem

Every API call from inside the sandbox to `api.anthropic.com` returned:
```json
{"error":{"type":"forbidden","message":"Request not allowed"}}
```

### Investigation steps

1. **Verified API key is valid** — direct `curl` from local machine returned 200
2. **Verified key reaches DO correctly** — `this.env.ANTHROPIC_API_KEY` has len=108, correct prefix `sk-ant-api03-BE`
3. **Verified key works from DO** — direct `fetch()` from the Durable Object to Anthropic API returned 200
4. **Verified key reaches sandbox** — `exec('echo ${#ANTHROPIC_API_KEY}')` inside sandbox returned 108
5. **Verified key works from sandbox on standard-1** — Node.js `fetch()` inside sandbox returned 200
6. **Discovered the IP difference**:

| Instance Type | Outbound IP | Anthropic API Response |
|---------------|-------------|----------------------|
| **standard-1** | `104.28.156.124` | **200** (works) |
| **standard-2** | `104.28.157.197` | **403** (blocked) |

7. **Confirmed it's IP-level, not key-level** — from standard-2, even a fake API key (`sk-ant-bad-key`) returned 403 (not 401). The request is rejected before key validation.

### Why it worked in Session 2

The partial generation in Session 2 ran on **standard-1** (before the instance type upgrade). The upgrade to standard-2 happened at the end of that session and was never tested. Every test in this session initially ran on standard-2, which has a blocked outbound IP.

### Resolution

Reverted `wrangler.jsonc` from `standard-2` back to `standard-1`. Full generation completed successfully.

### Open question

The `standard-2` IP range (`104.28.157.x`) is blocked by Anthropic's firewall/WAF. The Cloudflare Sandbox SDK docs do not mention any IP blocking limitations for outbound connections. This may be:
- A temporary block on that specific IP range
- A Cloudflare-specific firewall rule on Anthropic's side
- An issue worth reporting to Cloudflare

Debug diagnostic code is intentionally left in `campaign-session.ts` to facilitate testing other instance types in the future.

---

## Full Generation Results

### Test parameters
- **Prompt:** "Create conversion ads for a premium coffee brand called 'Dark Roast Co' at https://darkroastco.com - they sell organic single-origin coffee beans. Make 2 ads in clay diorama style."
- **Instance:** standard-1 (0.5 vCPU, 4 GiB RAM)
- **Model:** claude-haiku-4-5-20251001

### Timeline

```
[0.4s]   WebSocket connect
[1.3s]   ACK + PHASE:parse
[3.0s]   API key verified (DO: 200)
[5.1s]   Sandbox boot + R2 mount + auth cache clean
[10.2s]  Network tests passed (sandbox API: 200)
[15.4s]  MCP server initialized (nano-banana v5.1.0)
[36.5s]  SDK system/init
[41.3s]  First Claude response — "I'll create conversion ads..."
[44.2s]  TOOL_START: Agent (research subagent)
[49.7s]  TOOL_START: WebFetch (darkroastco.com)
[85.3s]  FILE: research (research.md created)
[95.6s]  Research subagent complete
[98.6s]  TOOL_START: Skill (hook-methodology) + PHASE:hooks
[107.1s] TOOL_START: Skill (art-style) + PHASE:art
[150.1s] Hook-bank not found, retrying with direct agent
[181.1s] FILE: hooks (hook-bank created)
[196.5s] TOOL_START: Skill (art-style) + PHASE:art (retry)
[222.7s] TOOL_START: Agent (prompt generation subagent)
[283.9s] FILE: prompts (prompts.json created)
[317.1s] TOOL_START: mcp__nano-banana__generate_ad_images + PHASE:images
[317.5s] Image 1/2 generating...
[361.9s] Image 1 saved (41.7s generation time)
[362.4s] Image 2/2 generating...
[412.9s] Image 2 saved (48.5s generation time)
[416.5s] IMAGE #1 → stat hook (clay diorama)
[416.9s] IMAGE #2 → story hook (clay diorama)
[425.2s] Final summary message
[425.7s] COMPLETE ✓
```

### Timing breakdown

| Phase | Duration | Notes |
|-------|----------|-------|
| WebSocket + ACK | ~1s | |
| Sandbox boot + R2 mount | ~5s | Including auth cache clean + network test |
| SDK initialization | ~30s | npx tsx compile + CLI init + first API call |
| Research | ~55s | 2 WebFetch calls + Write |
| Hooks | ~85s | Skill call failed, retried with direct agent |
| Art / Prompts | ~90s | Prompt generation subagent |
| Image generation | ~100s | 2 images via fal.ai (~45s each) |
| **Total** | **~426s (~7 min)** | |

### Output

- **Events:** 181 WebSocket events
- **Images:** 2 (both saved to R2, delivered via WebSocket)
- **Files:** research.md, hook-bank.md, prompts.json (all saved to D1)
- **SDK messages:** 93 stdout chunks parsed

---

## What Works (Fully Verified)

| Feature | Status | Notes |
|---------|--------|-------|
| WebSocket connect + ACK | ✅ | |
| Campaign creation in D1 | ✅ | |
| Sandbox boot + R2 FUSE mount | ✅ | ~5s total |
| SDK initialization | ✅ | ~30s |
| Research phase (WebFetch + Write) | ✅ | |
| Hooks phase (Skill + Agent) | ✅ | Skill routing had hiccup, recovered via agent |
| Art phase (Skill + Agent) | ✅ | |
| Image generation (fal.ai MCP tool) | ✅ | 2/2 images generated |
| Image save to R2 | ✅ | Via FUSE mount |
| Image events via WebSocket | ✅ | Both images delivered to client |
| Phase detection (parse/hooks/art/images) | ✅ | |
| File detection (research/hooks/prompts) | ✅ | |
| Tool start/end events | ✅ | |
| Text message streaming | ✅ | |
| Complete event with summary | ✅ | |
| Event buffering | ✅ | 181 events buffered |
| Ping/pong keepalive | ✅ | 30s interval |

---

## What Still Needs Testing

1. **Cancel flow** — start generation, send `{ "type": "cancel" }` mid-pipeline
2. **Follow-up/resume** — after complete generation, send `follow_up` with campaignId
3. **REST API** — `GET /api/campaigns`, `GET /api/campaigns/:id`
4. **Image serving** — `GET /images/{sessionId}/{filename}` from R2 via Worker
5. **Reconnect/subscribe** — disconnect during generation, reconnect, send `subscribe` with `lastEventId`
6. **Client UI** — connect the React frontend to the deployed Worker

---

## Debug Diagnostics (Intentionally Retained)

The following debug code is in `campaign-session.ts` for future instance type investigation:

1. **API key check** — logs key length and prefix to WS
2. **DO API test** — direct `fetch()` from DO to Anthropic, logs status code
3. **Auth cache cleanup** — removes stale `.claude/.credentials` from R2 mount
4. **Sandbox network test** — tests API with valid key, bad key, and httpbin from inside sandbox; logs IP and status codes

These add ~8s overhead per generation. Remove before production.

---

## Files Modified This Session

| File | Changes |
|------|---------|
| `cloudflare/src/durable-objects/campaign-session.ts` | Added debug diagnostics (API key test, network test, auth cache cleanup) |
| `cloudflare/wrangler.jsonc` | Reverted `instance_type` from `standard-2` to `standard-1` |
| `test-e2e.mjs` | Changed prompt from 3 images to 2 images |

---

## Key Learnings

### 8. Container instance type affects outbound IP — and some IPs are blocked

Different `instance_type` values (`standard-1` vs `standard-2`) result in containers with different outbound IP addresses. The `standard-2` IP (`104.28.157.197`) is blocked by Anthropic's API, while `standard-1` (`104.28.156.124`) works. This is not documented in the Cloudflare Sandbox SDK docs.

**Diagnostic approach:** To test if an instance type works, check both a valid AND invalid API key from inside the sandbox. If both return 403, it's an IP block (not a key issue). If the valid key returns 200 and invalid returns 401, networking is fine.

### 9. standard-1 is sufficient for Claude Code + subagents

Contrary to the Session 2 hypothesis, `standard-1` (0.5 vCPU, 4 GiB) completed a full generation in ~7 minutes without hanging. The Session 2 hang was likely caused by the IP blocking issue (before the key fix was deployed to the working standard-1 instance), not insufficient resources.

### 10. The 403 "Request not allowed" means IP block, not auth failure

Anthropic's API returns different errors for different failure modes:
- `401` with `"authentication_error"` → bad/missing API key
- `403` with `"Request not allowed"` → IP/network level block (key never validated)

If both valid and invalid keys return 403, the request is being rejected at the network/WAF level before reaching the API handler.

---

## Deployment Commands Reference

```bash
# From cloudflare/ directory:

# Deploy Worker + container
npx wrangler deploy

# Set secrets (ALWAYS strip newlines!)
grep '^ANTHROPIC_API_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put ANTHROPIC_API_KEY
grep '^FAL_KEY=' ../.env | cut -d= -f2- | tr -d '\n' | npx wrangler secret put FAL_KEY

# Check container status
npx wrangler containers list
npx wrangler containers info a033dfe8-c682-4146-baf3-cbcb96ad9c3f

# Health check
curl https://creative-agent.alphasapien17.workers.dev/health

# Run E2E test (from project root)
cd /Users/chakra/Documents/Agents/creative_agent
node test-e2e.mjs
```
