# Production Deployment Plan: Creative Ad Agent on Cloudflare

## Overview

Deploy the Creative Ad Agent to production using the **official Cloudflare + Claude Agent SDK integration**:
- **Official Template** - `cloudflare/sandbox-sdk/examples/claude-code` as starting point
- **Sandboxes** - Isolated containers for Claude SDK execution (pre-configured)
- **D1** - SQLite database for session metadata
- **R2** - Object storage for artifacts (research, hooks, images)

## Official Integration

Cloudflare provides an official template for running Claude Agent SDK in their Sandbox:

```bash
npm create cloudflare@latest -- claude-code-sandbox \
  --template=cloudflare/sandbox-sdk/examples/claude-code
```

**Sources:**
- [Run Claude Code on a Sandbox - Cloudflare Docs](https://developers.cloudflare.com/sandbox/tutorials/claude-code/)
- [Cloudflare Sandbox SDK](https://github.com/cloudflare/sandbox-sdk)
- [claude-in-the-box Demo](https://github.com/craigsdennis/claude-in-the-box)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE ECOSYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /generate { url, sessionId }                              │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────┐                       │
│  │    Cloudflare Worker                 │                       │
│  │    (extends official template)       │                       │
│  │  - API gateway (routes)              │                       │
│  │  - Request validation                │                       │
│  │  - Session lookup (D1)               │                       │
│  │  - Artifact retrieval (R2)           │                       │
│  │  - Spawn sandbox via template API    │                       │
│  └───────────────────┬──────────────────┘                       │
│                      │                                          │
│                      ▼                                          │
│  ┌──────────────────────────────────────┐                       │
│  │    Cloudflare Sandbox                │                       │
│  │    (from official template)          │                       │
│  │  - Claude Agent SDK (pre-configured) │                       │
│  │  - Your agent/ directory             │                       │
│  │  - Your skills (hook, art-style)     │                       │
│  │  - Your MCP server (nano-banana)     │                       │
│  │  - Isolated container environment    │                       │
│  └───────────────────┬──────────────────┘                       │
│                      │                                          │
│         ┌────────────┴────────────┐                             │
│         ▼                         ▼                             │
│  ┌─────────────┐           ┌─────────────┐                      │
│  │     D1      │           │     R2      │                      │
│  │  sessions   │           │  artifacts  │                      │
│  │  campaigns  │           │  images     │                      │
│  │  metadata   │           │  research   │                      │
│  └─────────────┘           │  hooks      │                      │
│                            └─────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Session Persistence Strategy

**Approach:** Store artifacts only (not full conversation history)

When user returns after SDK session expires:
1. Worker fetches artifacts from R2 (research.md, hooks.md)
2. Spawns new sandbox with artifacts as context
3. Agent reads artifacts and continues work
4. New versions saved as iterations (v1, v2, etc.)

## Project Structure (Extends Official Template)

```
creative-ad-agent/                # Created from official template
├── src/
│   ├── index.ts                 # FROM TEMPLATE: Worker entry point
│   ├── sandbox.ts               # FROM TEMPLATE: Sandbox spawning logic
│   │
│   ├── routes/                  # YOUR ADDITIONS
│   │   ├── generate.ts          # POST /generate (your main endpoint)
│   │   ├── sessions.ts          # Session management routes
│   │   └── images.ts            # GET /images/:id/:file
│   │
│   └── services/                # YOUR ADDITIONS
│       ├── session.ts           # D1 session operations
│       └── storage.ts           # R2 artifact operations
│
├── agent/                       # YOUR AGENT (copy from current project)
│   ├── .claude/
│   │   ├── agents/
│   │   │   └── research.md      # Research agent definition
│   │   └── skills/
│   │       ├── hook-methodology/
│   │       │   ├── SKILL.md
│   │       │   └── formulas.md
│   │       └── art-style/
│   │           ├── SKILL.md
│   │           └── workflows/
│   └── files/                   # Working directory for artifacts
│
├── lib/                         # YOUR SDK CUSTOMIZATIONS
│   ├── orchestrator-prompt.ts   # (from server/lib - unchanged)
│   ├── instrumentor.ts          # (from server/lib - unchanged)
│   └── nano-banana-mcp.ts       # (from server/lib - unchanged)
│
├── schema/
│   └── d1-schema.sql            # Database schema
│
├── wrangler.toml                # FROM TEMPLATE + your D1/R2 bindings
├── .dev.vars                    # Local API keys (gitignored)
├── package.json                 # FROM TEMPLATE + your dependencies
└── Dockerfile                   # FROM TEMPLATE (sandbox container)
```

**Key Insight:** The official template handles sandbox spawning and Claude SDK execution. You just need to:
1. Add your routes for `/generate`, `/sessions`, `/images`
2. Add D1/R2 services for persistence
3. Copy your `agent/` directory with skills
4. Configure wrangler.toml with D1/R2 bindings

## Implementation Steps

### Phase 1: Bootstrap from Official Template (Day 1 Morning)

1. **Create Cloudflare account** (if needed) and install Wrangler CLI
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. **Create project from official Claude Code template**
   ```bash
   npm create cloudflare@latest -- creative-ad-agent \
     --template=cloudflare/sandbox-sdk/examples/claude-code

   cd creative-ad-agent
   ```

3. **Configure API keys** (local development)
   ```bash
   # Create .dev.vars file (auto-gitignored)
   cat > .dev.vars << EOF
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   GEMINI_API_KEY=your-gemini-key-here
   EOF
   ```

4. **Test the template works** (first run builds Docker, takes 2-3 min)
   ```bash
   npm run dev
   # Test at http://localhost:8787
   ```

5. **Create D1 database**
   ```bash
   wrangler d1 create creative-ads-db
   ```

6. **Create R2 bucket**
   ```bash
   wrangler r2 bucket create creative-ads-artifacts
   ```

7. **Set up production secrets**
   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put GEMINI_API_KEY
   ```

### Phase 2: Database Schema (Day 1 Morning)

**File: `schema/d1-schema.sql`**

```sql
-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  brand_name TEXT,
  brand_url TEXT,
  status TEXT DEFAULT 'active',  -- active, completed, iterating
  current_version INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  metadata TEXT  -- JSON blob for extra data
);

-- Campaigns (versions of a session)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  research_key TEXT,  -- R2 key for research.md
  hooks_key TEXT,     -- R2 key for hooks.md
  prompts_json TEXT,  -- Visual prompts JSON
  images TEXT,        -- JSON array of R2 image keys
  instrumentation TEXT,  -- Cost/timing metrics JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_campaigns_session ON campaigns(session_id);
```

### Phase 3: Extend Template with Your Routes (Day 1 Afternoon)

The official template provides the sandbox integration. You extend it with your custom routes.

**File: `src/index.ts`** (extend template's entry point)

```typescript
// The template provides sandbox spawning - you add your routes
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getSandbox } from './sandbox';  // FROM TEMPLATE
import { createSession, getSession, updateSession } from './services/session';
import { getArtifacts, saveArtifacts } from './services/storage';

type Bindings = {
  Sandbox: any;           // FROM TEMPLATE
  DB: D1Database;         // YOUR ADDITION
  R2: R2Bucket;           // YOUR ADDITION
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      sandbox: !!c.env.Sandbox,
      d1: !!c.env.DB,
      r2: !!c.env.R2
    }
  });
});

// Main generation endpoint
app.post('/generate', async (c) => {
  const { prompt, sessionId, userId } = await c.req.json();

  // Get or create session in D1
  let session = sessionId ? await getSession(c.env.DB, sessionId) : null;
  let existingArtifacts = null;

  if (session) {
    existingArtifacts = await getArtifacts(c.env.R2, sessionId, session.current_version);
  } else {
    session = await createSession(c.env.DB, { userId, prompt });
  }

  // Use template's sandbox API to spawn container
  const sandbox = getSandbox(c.env.Sandbox, session.id);

  // Copy your agent files into sandbox
  await sandbox.writeFile('/workspace/agent/.claude/agents/research.md', RESEARCH_AGENT);
  await sandbox.writeFile('/workspace/agent/.claude/skills/hook-methodology/SKILL.md', HOOK_SKILL);
  // ... copy other skill files

  // Inject existing artifacts as context (if resuming)
  let agentPrompt = prompt;
  if (existingArtifacts) {
    agentPrompt = `
## Existing Context
### Research:
${existingArtifacts.research || 'None'}

### Current Hooks:
${existingArtifacts.hooks || 'None'}

## New Request:
${prompt}
    `;
  }

  // Run Claude Agent SDK via template's sandbox
  const result = await sandbox.exec(`
    cd /workspace/agent && \
    ANTHROPIC_API_KEY=${c.env.ANTHROPIC_API_KEY} \
    GEMINI_API_KEY=${c.env.GEMINI_API_KEY} \
    npx @anthropic-ai/claude-code --prompt "${agentPrompt.replace(/"/g, '\\"')}"
  `);

  // Read generated artifacts from sandbox filesystem
  const research = await sandbox.readFile('/workspace/agent/files/research/*.md').catch(() => null);
  const hooks = await sandbox.readFile('/workspace/agent/.claude/skills/hook-methodology/hook-bank/*.md').catch(() => null);
  const images = await sandbox.listFiles('/workspace/generated-images/');

  // Save artifacts to R2
  const artifactKeys = await saveArtifacts(c.env.R2, session.id, {
    research, hooks, images, version: session.current_version
  });

  // Update session in D1
  await updateSession(c.env.DB, session.id, {
    status: 'completed',
    currentVersion: session.current_version + 1,
    artifacts: artifactKeys
  });

  return c.json({
    success: true,
    sessionId: session.id,
    version: session.current_version,
    images: artifactKeys.images.map(key => `https://pub-xxx.r2.dev/${key}`)
  });
});

// Session endpoints
app.get('/sessions/:id', async (c) => {
  const session = await getSession(c.env.DB, c.req.param('id'));
  return session ? c.json(session) : c.json({ error: 'Not found' }, 404);
});

// Image serving from R2
app.get('/images/:sessionId/:filename', async (c) => {
  const key = `${c.req.param('sessionId')}/images/${c.req.param('filename')}`;
  const object = await c.env.R2.get(key);
  if (!object) return c.json({ error: 'Not found' }, 404);
  return new Response(object.body, {
    headers: { 'Content-Type': 'image/png' }
  });
});

export default app;
```

### Phase 4: Session Service (Day 1 Afternoon)

**File: `worker/src/services/session.ts`**

```typescript
export async function createSession(db: D1Database, data: {
  userId?: string;
  prompt: string;
}): Promise<Session> {
  const id = `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // Extract brand info from prompt (URL detection)
  const urlMatch = data.prompt.match(/https?:\/\/[^\s]+/);
  const brandUrl = urlMatch ? urlMatch[0] : null;
  const brandName = brandUrl ? new URL(brandUrl).hostname.replace('www.', '') : null;

  await db.prepare(`
    INSERT INTO sessions (id, user_id, brand_name, brand_url, status)
    VALUES (?, ?, ?, ?, 'active')
  `).bind(id, data.userId || null, brandName, brandUrl).run();

  return { id, userId: data.userId, brandName, brandUrl, status: 'active', currentVersion: 1 };
}

export async function getSession(db: D1Database, id: string): Promise<Session | null> {
  const result = await db.prepare(`
    SELECT * FROM sessions WHERE id = ?
  `).bind(id).first();

  return result ? mapSession(result) : null;
}

export async function updateSession(db: D1Database, id: string, updates: Partial<Session>) {
  // Update session
  await db.prepare(`
    UPDATE sessions
    SET status = ?, current_version = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(updates.status, updates.currentVersion, id).run();

  // Insert campaign record
  if (updates.artifacts) {
    await db.prepare(`
      INSERT INTO campaigns (id, session_id, version, research_key, hooks_key, images, instrumentation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `campaign_${Date.now()}`,
      id,
      updates.currentVersion,
      updates.artifacts.research,
      updates.artifacts.hooks,
      JSON.stringify(updates.artifacts.images),
      JSON.stringify(updates.instrumentation)
    ).run();
  }
}
```

### Phase 5: R2 Storage Service (Day 1 Evening)

**File: `worker/src/services/storage.ts`**

```typescript
export async function saveArtifacts(
  r2: R2Bucket,
  sessionId: string,
  result: SandboxResult
): Promise<ArtifactKeys> {
  const version = result.version;
  const prefix = `${sessionId}/v${version}`;

  const keys: ArtifactKeys = {
    research: null,
    hooks: null,
    prompts: null,
    images: []
  };

  // Save research.md
  if (result.research) {
    keys.research = `${prefix}/research.md`;
    await r2.put(keys.research, result.research);
  }

  // Save hooks.md
  if (result.hooks) {
    keys.hooks = `${prefix}/hooks.md`;
    await r2.put(keys.hooks, result.hooks);
  }

  // Save prompts.json
  if (result.prompts) {
    keys.prompts = `${prefix}/prompts.json`;
    await r2.put(keys.prompts, JSON.stringify(result.prompts));
  }

  // Save images
  for (let i = 0; i < result.images.length; i++) {
    const imageKey = `${prefix}/images/concept_${i + 1}.png`;
    await r2.put(imageKey, result.images[i].data, {
      httpMetadata: { contentType: 'image/png' }
    });
    keys.images.push(imageKey);
  }

  return keys;
}

export async function getArtifacts(
  r2: R2Bucket,
  sessionId: string,
  version: number
): Promise<Artifacts | null> {
  const prefix = `${sessionId}/v${version}`;

  const [research, hooks, prompts] = await Promise.all([
    r2.get(`${prefix}/research.md`),
    r2.get(`${prefix}/hooks.md`),
    r2.get(`${prefix}/prompts.json`)
  ]);

  if (!research && !hooks) return null;

  return {
    research: research ? await research.text() : null,
    hooks: hooks ? await hooks.text() : null,
    prompts: prompts ? JSON.parse(await prompts.text()) : null
  };
}
```

### Phase 6: Copy Your Agent Files (Day 2 Morning)

The official template handles sandbox spawning. You just need to ensure your agent files are available.

**Option A: Bundle agent files in the Docker image**

Edit the template's `Dockerfile` to include your agent:

```dockerfile
# Add to Dockerfile (after base setup)
COPY agent/ /workspace/agent/

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code
```

**Option B: Write agent files at runtime**

```typescript
// In your /generate route, write skill files to sandbox
const RESEARCH_AGENT = `# Research Agent
Description: Extract factual data from brand homepages...
`;

const HOOK_SKILL = `# Hook Methodology Skill
## Purpose
Generate conversion-focused ad copy using hook-first methodology...
`;

// Write to sandbox filesystem before running
await sandbox.writeFile('/workspace/agent/.claude/agents/research.md', RESEARCH_AGENT);
await sandbox.writeFile('/workspace/agent/.claude/skills/hook-methodology/SKILL.md', HOOK_SKILL);
await sandbox.writeFile('/workspace/agent/.claude/skills/hook-methodology/formulas.md', HOOK_FORMULAS);
await sandbox.writeFile('/workspace/agent/.claude/skills/art-style/SKILL.md', ART_SKILL);
```

**Your MCP Server (nano-banana)**

The Gemini MCP server needs to run inside the sandbox. Include it in your Dockerfile:

```dockerfile
# Copy MCP server
COPY lib/nano-banana-mcp.ts /workspace/lib/

# Or install as package if published
RUN npm install your-mcp-package
```

### Phase 7: Wrangler Configuration (Day 2 Morning)

**File: `wrangler.toml`** (extend template's config)

```toml
# FROM TEMPLATE - don't modify these
name = "creative-ad-agent"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# FROM TEMPLATE - sandbox binding
[sandbox]
enabled = true

# YOUR ADDITIONS - D1 database
[[d1_databases]]
binding = "DB"
database_name = "creative-ads-db"
database_id = "<your-d1-id>"  # Get this from `wrangler d1 create`

# YOUR ADDITIONS - R2 bucket
[[r2_buckets]]
binding = "R2"
bucket_name = "creative-ads-artifacts"

# YOUR ADDITIONS - environment variables
[vars]
R2_PUBLIC_URL = "pub-xxxxx.r2.dev"  # Get this after enabling public access
```

**After creating D1 database, update the config:**
```bash
# Create database and get the ID
wrangler d1 create creative-ads-db
# Output: Created database 'creative-ads-db' with id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Copy the ID to wrangler.toml
```

### Phase 8: Testing & Deployment (Day 2 Afternoon)

1. **Local testing**
   ```bash
   cd worker
   wrangler dev
   ```

2. **Database migration**
   ```bash
   wrangler d1 execute creative-ads-db --file=../schema/d1-schema.sql
   ```

3. **Deploy**
   ```bash
   wrangler deploy
   ```

4. **Verify**
   ```bash
   curl https://creative-ad-agent.<your-subdomain>.workers.dev/health
   ```

## Files to Modify from Current Codebase

**Using the official template significantly reduces work!**

| Current File | Action | Notes |
|--------------|--------|-------|
| `server/sdk-server.ts` | **Extend template** | Add your routes to template's `src/index.ts` |
| `server/lib/session-manager.ts` | **Rewrite** | → `src/services/session.ts` (D1) |
| `server/lib/ai-client.ts` | **Not needed** | Template handles SDK integration |
| `server/lib/orchestrator-prompt.ts` | **Bundle** | Include in Dockerfile or runtime write |
| `server/lib/instrumentor.ts` | **Optional** | Can track via sandbox exec output |
| `server/lib/nano-banana-mcp.ts` | **Bundle** | Include in Dockerfile |
| `agent/` | **Bundle** | Copy to Dockerfile or runtime write |

### What Template Provides vs What You Add

| Component | Template Provides | You Add |
|-----------|------------------|---------|
| Sandbox spawning | ✅ `getSandbox()` | - |
| Claude SDK execution | ✅ Configured | - |
| File operations | ✅ `sandbox.writeFile/readFile` | - |
| Command execution | ✅ `sandbox.exec()` | - |
| Worker routing | ✅ Basic structure | Your `/generate` route |
| D1 integration | ❌ | Session service |
| R2 integration | ❌ | Artifact storage |
| Your agent/skills | ❌ | Bundle in Dockerfile |
| Your MCP server | ❌ | Bundle in Dockerfile |

## Iteration Flow

### First Generation
```
User: "Generate ads for brand.com"
     ↓
Worker: Create session in D1
     ↓
Sandbox: Run full pipeline (research → hooks → art → images)
     ↓
Worker: Save all artifacts to R2, update D1
     ↓
Return: Image URLs + session ID
```

### User Returns Later (Iteration)
```
User: "Keep concepts 2 & 5, regenerate others with more urgency"
     ↓
Worker: Fetch session from D1, load artifacts from R2
     ↓
Sandbox: Receive existing research + hooks as context
         Skip research, modify hooks, regenerate 4 images
     ↓
Worker: Save as v2 artifacts, increment version
     ↓
Return: New image URLs + version info
```

## Cost Estimate (500 campaigns/day)

| Service | Usage | Cost |
|---------|-------|------|
| Sandboxes | 500 × 3min | ~$1.25/day |
| Workers | 500 requests | ~$0.01/day |
| R2 Storage | ~6GB/day | ~$0.09/day |
| R2 Egress | Unlimited | $0 |
| D1 | 500 writes | Free tier |
| **Total** | | **~$40/month** |

## Success Criteria

- [ ] Worker deployed and responding to /health
- [ ] D1 database created with schema
- [ ] R2 bucket created and accessible
- [ ] First campaign generates successfully
- [ ] Images served from R2 CDN
- [ ] Session resumption works with artifacts
- [ ] Iteration creates new versions correctly

---

## Quick Start Summary

Using the official Cloudflare + Claude Agent SDK template reduces implementation from ~2 days to ~1 day:

```bash
# 1. Create project from official template (5 min)
npm create cloudflare@latest -- creative-ad-agent \
  --template=cloudflare/sandbox-sdk/examples/claude-code

cd creative-ad-agent

# 2. Configure API keys (2 min)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
echo "GEMINI_API_KEY=..." >> .dev.vars

# 3. Create D1 database (5 min)
wrangler d1 create creative-ads-db
# Update wrangler.toml with database_id

# 4. Create R2 bucket (5 min)
wrangler r2 bucket create creative-ads-artifacts
# Update wrangler.toml with bucket binding

# 5. Run database migration (2 min)
wrangler d1 execute creative-ads-db --file=schema/d1-schema.sql

# 6. Add your routes & services (4-6 hours)
# - Add /generate route
# - Add session service (D1)
# - Add storage service (R2)
# - Bundle agent files in Dockerfile

# 7. Test locally (first run takes 2-3 min for Docker build)
npm run dev

# 8. Deploy to production (5 min)
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GEMINI_API_KEY

# Done! Your agent is live at:
# https://creative-ad-agent.<your-subdomain>.workers.dev
```

**Total estimated time: ~1 day** (vs 2 days without template)
