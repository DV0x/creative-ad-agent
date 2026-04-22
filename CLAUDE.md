# Creative Agent

## Project Overview
AI-powered ad campaign generator. Users provide a brand URL, the agent researches the brand, creates 6 ad hooks (stat, story, fomo, curiosity, callout, contrast), generates art direction, and produces 6 images via fal.ai. Users can also create new campaigns from existing ones — research is copied, skipping the research phase, and fresh hooks/images are generated from a new brief.

## Architecture
- **Client**: React 19 + Zustand + Tailwind v4 + Clerk auth (`client/`)
- **Production**: Cloudflare Workers + Durable Objects + D1 + R2 + Sandbox Containers (`cloudflare/`)
- **Local dev**: Express + SQLite + in-process SDK (`server/`)
- **Agent**: Claude SDK with orchestrator pattern, MCP tools, 14 art styles (`agent/`)
- **Docs**: 24 architecture docs in `docs/architecture/` — start at `docs/architecture/INDEX.md`

## Key Commands
```bash
# Local dev
cd server && npm run dev          # Backend on :3001
cd client && npm run dev          # Frontend on :5173 (proxies to :3001)

# Deploy to staging (creative-agent-staging.alphasapien17.workers.dev)
cd client && npm run build:staging && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env staging

# Deploy to production (creativemachines.xyz)
cd client && npm run build:production && docker logout registry.cloudflare.com; docker builder prune -af; cd ../cloudflare && npx wrangler deploy --env production

# Query production D1 (name is creative-agent-db-prod; staging is creative-agent-db)
npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT ..."

# Health check
curl -s https://creativemachines.xyz/health | python3 -m json.tool
```

## Code Layout
```
client/src/store/index.ts ............. Zustand store (1054 lines)
client/src/hooks/useWebSocket.ts ...... WS hook + message handling (471 lines)
client/src/lib/websocket-manager.ts ... WS singleton connection (286 lines)
client/src/lib/api.ts ................. REST client (438 lines)
cloudflare/src/durable-objects/campaign-session.ts ... THE core DO (1581 lines)
cloudflare/src/lib/sdk-message-parser.ts ............ SDK stdout → WS events
cloudflare/sandbox/agent-runner.ts .................. Long-running agent (351 lines)
server/lib/websocket-handler.ts ..................... Local WS handler (1501 lines)
server/lib/block-builder.ts ......................... Block building for DB persistence
agent/.claude/skills/hook-methodology/ .............. 6 hook types + formulas
agent/.claude/skills/art-style/workflows/ ........... 14 art style workflows
```

## D1 Tables
`campaigns`, `campaign_files`, `campaign_images`, `messages`, `asset_folders`, `asset_files`
Schema: `cloudflare/schema.sql`

## SDK Context Management (Research Notes)

### How Context Accumulates
- Everything accumulates per session: system prompt, tool defs, conversation history, tool results
- No automatic pruning within a session — array only grows
- Token counting is approximate: `string.length / 4` with 1.33x multiplier

### Auto-Compact (built-in, enabled by default)
- Triggers when tokens exceed: `contextWindow - maxOutputTokens - 13,000`
- For Haiku 4.5 (200K context, 16K output): threshold ~170K tokens
- Replaces older messages with structured summary (max 20K output tokens)
- System prompt and CLAUDE.md re-loaded fresh after compact
- Keeps last 3 tool results per tool type (microcompact)

### Env Vars That Control Context
- `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=N` — Trigger compact at N% of available context (can only trigger EARLIER)
- `DISABLE_COMPACT` — Disable all compaction
- `DISABLE_MICROCOMPACT` — Disable lightweight tool-result clearing
- `MAX_MCP_OUTPUT_TOKENS` — Cap MCP tool results (default 25K tokens)
- `BASH_MAX_OUTPUT_LENGTH` — Cap bash output (default 30K chars)
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS` — Max output tokens (default 32K, cap 64K)

### SDK Options for Context
- `maxTurns` — Limits tool round-trips per `query()` call (not cumulative)
- `maxBudgetUsd` — Cost cap per generation
- `forkSession: true` — Branch conversation (new session ID, original untouched)
- `resumeSessionAt: uuid` — Rewind to specific message (truncates everything after)
- `resume: sessionId` — Load full JSONL history

### PreCompact Hook
- Exit 0: stdout becomes custom compaction instructions (appended to built-in prompt)
- Exit 2: Blocks compaction entirely
- Can inject domain-specific instructions like "preserve campaign name, image paths, hook decisions"

### Our Architecture vs SDK Context
- **Fast path** (warm container): SDK manages context in-memory, auto-compact handles growth
- **Cold start**: We bypass SDK context entirely — hydrate from D1 (files + messages in prompt)
- `RESUME_SDK_SESSION_ID` disabled on Cloudflare (s3fs null-byte corruption)

### Future: D1-Level Campaign Forking (Not Built Yet)
Fork a campaign at a specific message to explore a different direction:
1. `POST /api/campaigns/:id/fork` with optional `messageId` (fork point)
2. Copy campaign row with new ID
3. Copy messages up to fork point: `INSERT INTO ... SELECT ... WHERE created_at <= forkPoint`
4. Copy campaign_files and campaign_images (same pattern)
5. Return new campaign ID — cold-start follow-up hydrates from D1 automatically
Low effort (~40-50 lines in routes/campaigns.ts). All DB primitives exist.

## Gotchas
- Wrangler secrets have trailing newlines — always `tr -d '\n'`
- `docker builder prune -af` before every deploy
- Two `getSandbox()` connections cancel each other's RPCs
- `unmountBucket()` before `mountBucket()` on container reuse
- `<img>` tags don't send auth headers — use `AuthImage` component
- One DO per user (not per campaign) — `isGenerating` is a per-user lock
- Browser HTTP cache (`immutable`) hides missing R2 data
