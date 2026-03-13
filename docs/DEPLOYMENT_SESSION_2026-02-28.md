# Deployment Architecture — Session Summary (2026-02-28)

## Decision: Fly Machine + Sprites Hybrid Deployment

### Architecture

```
[Browser] <--WS/HTTPS--> [Fly Machine] <--Sprites SDK--> [Sprite VMs]
                              |
                         Web Server
                         SQLite DB
                         Static Files
                         Event Buffer
                              |
                    +---------+---------+
                    |                   |
               Sprite A            Sprite B
            (campaign-123)       (campaign-456)
            Claude SDK + CLI     Claude SDK + CLI
            MCP Server           MCP Server
            Agents / Skills      Agents / Skills
            JSONL Transcripts    JSONL Transcripts
            ffmpeg (future)      ffmpeg (future)
```

### What lives where

| Component | Location | Why |
|-----------|----------|-----|
| React app (static build) | Fly Machine | Always-on, served via HTTPS |
| Bun + Hono server | Fly Machine | Always-on, handles WebSocket + HTTP |
| SQLite database | Fly Machine (persistent volume) | Source of truth for campaigns, sessions, users |
| Event buffer | Fly Machine (in-memory) | Reconnection resilience, same process as WS |
| Session manager | Fly Machine (in-memory + JSON) | App-level session state |
| Claude Agent SDK subprocess | Sprite | Sandboxed execution, isolated per user |
| Claude Code CLI | Sprite | Installed globally inside sprite |
| JSONL transcripts | Sprite (persistent disk) | Must be local to CLI for `resume` to work |
| MCP server (nano-banana) | Sprite (in-process with SDK) | `createSdkMcpServer()` runs where `query()` runs |
| Agent definitions | Sprite (`agent/.claude/agents/`) | Read by CLI at runtime |
| Skills | Sprite (`agent/.claude/skills/`) | Read by CLI at runtime |
| Generated images | Sprite -> transferred to Fly Machine or S3 | MCP saves locally, then needs transfer |
| ffmpeg / video gen (future) | Sprite | Needs sandboxed bash execution |

### Why this split

1. **Fly Machine** ($7/month) — always-on web server with custom domain, persistent volume for SQLite, handles all client connections
2. **Sprites** (~$2.62/user/month at scale) — per-user sandboxed Linux VMs with persistent 100GB disk, auto-sleep after 30s inactivity (compute billing stops), wake in 100-500ms (warm) or 1-2s (cold)

---

## Key Technical Findings

### Session Resume
- SDK `resume` option takes only a session ID string
- CLI looks up JSONL transcript on local filesystem — no remote filesystem support
- Sprite persistent disk solves this: JSONL stays on sprite between sessions
- Session ID stored in Fly Machine's SQLite for lookup on follow-up

### EventEmitter Boundary
- Current `nano-banana-mcp.ts` uses Node.js EventEmitter for real-time image events
- EventEmitter cannot cross machine boundaries (Fly Machine <-> Sprite)
- **Solution already exists**: `processSDKMessage()` in `websocket-handler.ts` (lines 532-596) has a fallback path that parses image data from `tool_result` messages
- In production: this fallback becomes the primary path. EventEmitter feature-flagged for local dev only

### Sprites Networking
- Sprites are NOT on Fly's 6PN internal network
- Communication goes through public internet via Sprites REST/WebSocket API
- Architecture: Fly Machine -> Sprites API -> Sprite VM (not direct)
- Latency: ~1-10ms if same Fly region

### Credential Management
- Single-tenant (our case): inject `ANTHROPIC_API_KEY` via `env` option on `sprite.spawn()`
- Env vars are per-command, not persisted to sprite disk — safe for API keys
- `env` replaces (not merges) defaults — must pass ALL required vars

### Sprites SDK Streaming
- `sprite.spawn()` returns Node.js Readable streams (stdout/stderr)
- WebSocket binary protocol underneath, multiplexed stdin/stdout/stderr
- NDJSON streaming works: raw byte stream, parse lines on consumer side
- Standard Node.js backpressure via PassThrough streams

### SDK Node.js Version
- `@fly/sprites` SDK says `>=24.0.0` in engines field
- Actually works on Node.js 22.4+ (only real constraint is stable WebSocket global)
- Install with `--ignore-engines` or upgrade Fly Machine to Node 24

---

## Implementation Approach: AIBackend Interface

Zero disruption to local development. New abstraction layer:

```
AI_BACKEND=local  -> LocalAIBackend  (current code, unchanged)
AI_BACKEND=sprite -> SpriteAIBackend (new, uses @fly/sprites SDK)
```

### New files needed

| File | Purpose |
|------|---------|
| `server/lib/ai-backend.ts` | `AIBackend` interface definition |
| `server/lib/local-backend.ts` | Wraps current `ai-client.ts` logic, no behavior change |
| `server/lib/sprite-backend.ts` | Sprites SDK integration — create/wake sprite, spawn SDK, stream output |
| `server/lib/agent-runner.ts` | Entry point that runs INSIDE the sprite — receives commands, calls `query()`, streams results back |

### Files modified

| File | Change |
|------|--------|
| `server/lib/websocket-handler.ts` | Use `AIBackend` instead of direct `aiClient` import |
| `server/lib/nano-banana-mcp.ts` | Feature-flag EventEmitter (local only) |
| `server/lib/image-events.ts` | Feature-flag for local dev |
| `server/sdk-server.ts` | Backend selection based on `AI_BACKEND` env var |

### Files unchanged

- `server/lib/session-manager.ts` — stays on Fly Machine
- `server/lib/event-buffer.ts` — stays on Fly Machine
- `server/lib/orchestrator-prompt.ts` — runs on Sprite, paths resolve there
- `agent/` directory — entire agent ecosystem runs on Sprite as-is
- `client/` — no changes, connects to same WebSocket

---

## Communication Flow

### Initial Campaign
```
1. User sends message -> Fly Machine (WebSocket)
2. Fly Machine creates/wakes Sprite via Sprites SDK
3. Fly Machine runs agent-runner.ts on Sprite via sprite.spawn()
   - Passes: prompt, env vars (API key), MCP config
4. agent-runner.ts calls query() inside Sprite
5. SDK spawns CLI subprocess, creates JSONL on Sprite disk
6. First system/init message -> session_id relayed to Fly Machine
7. Fly Machine stores session_id + sprite_name in SQLite
8. SDK output streams back over Sprites WebSocket -> Fly Machine -> Browser
9. Campaign completes, Sprite auto-sleeps after 30s
```

### Follow-up (Resume)
```
1. User sends follow-up -> Fly Machine
2. Fly Machine looks up session_id + sprite_name in SQLite
3. Wakes same Sprite (100ms-2s)
4. sprite.spawn() with resume: sessionId
5. CLI reads JSONL from Sprite's persistent disk, resumes conversation
6. Output streams back as above
```

### Image Transfer
```
Option A: Sprite filesystem API (simple)
  - MCP saves image on Sprite disk
  - After campaign: Fly Machine reads via sprite.fs.read()
  - Serves images from Fly Machine or uploads to S3

Option B: Direct upload from Sprite (if Sprite has outbound internet)
  - MCP uploads directly to S3/R2
  - Returns URL in tool_result
  - Fly Machine stores URL in SQLite
```

---

## Cost Projections

| Scale | Storage/month | Compute/month | Total/month | Per user |
|-------|--------------|---------------|-------------|----------|
| 10 users | $25 | $1.20 | ~$33 (+ $7 Fly) | $4.00 |
| 100 users | $250 | $12 | ~$269 (+ $7 Fly) | $2.76 |
| 1000 users | $2,500 | $120 | ~$2,627 (+ $7 Fly) | $2.63 |

Assumptions: 5GB disk per sprite, 90%+ sleeping, ~2hrs active/month per user.

**Optimization**: Minimize sprite disk to 1-2GB (delete cached files aggressively) to cut storage costs by 60-80%.

---

## Local Dev Preservation

- `AI_BACKEND=local` (default) — zero changes to current workflow
- No new dependencies required for local dev
- `@fly/sprites` SDK only imported when `AI_BACKEND=sprite`
- EventEmitter path remains active in local mode
- Same `bun run dev` command, same ports, same behavior

---

## Next Step

Write the full implementation plan with exact code changes, file-by-file diffs, Dockerfile, fly.toml, deployment commands, and testing strategy.
