# Implementation Plan: Deploy Creative Ad Agent to Production

**Stack:** Daytona (sandbox) + Supabase (database/storage) + Vercel (API gateway)
**Cost:** ~$0.26/campaign (mostly Claude API)

---

## Overview

### Milestone 1: Basic Sandbox (1-2 days)
- Single campaign generation in Daytona sandbox
- Save results to Supabase
- Validate end-to-end flow works

### Milestone 2: Session Resume (1 day)
- Multi-version campaigns
- Hydrate sandbox with previous artifacts
- User feedback iterations

---

# MILESTONE 1: Basic Sandbox

## Phase 1: Setup External Services (30 min)

### Step 1.1: Create Daytona Account
- [ ] Sign up at https://app.daytona.io
- [ ] Create API key at https://app.daytona.io/dashboard/keys
- [ ] Scopes needed: `write:sandboxes`, `delete:sandboxes`
- [ ] Save as `DAYTONA_API_KEY`

### Step 1.2: Create Supabase Project
- [ ] Sign up at https://supabase.com
- [ ] Create new project
- [ ] Get connection details:
  - `SUPABASE_URL` (Project URL)
  - `SUPABASE_SERVICE_KEY` (service_role key for server-side)
- [ ] Create storage bucket named `artifacts`

### Step 1.3: Setup Database Schema
Run in Supabase SQL Editor:

```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  brand_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table (each generation run)
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  version INTEGER DEFAULT 1,
  research_path TEXT,
  hooks_path TEXT,
  prompts JSONB,
  image_paths JSONB,
  cost_usd DECIMAL,
  duration_ms INTEGER,
  status TEXT DEFAULT 'running',
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_campaigns_session ON campaigns(session_id);
```

---

## Phase 2: Create API Gateway (2-3 hours)

### Step 2.1: Project Structure
```
server/
├── gateway/
│   ├── index.ts          # Express server
│   ├── daytona.ts        # Sandbox management
│   ├── supabase.ts       # Database/storage client
│   └── types.ts          # Shared types
```

### Step 2.2: Install Dependencies
```bash
npm install @daytonaio/sdk @supabase/supabase-js express uuid
npm install -D @types/express
```

### Step 2.3: Implement Gateway
Key endpoints:
- `POST /api/generate` - Start new campaign generation
- `GET /api/campaigns/:id` - Get campaign status/results
- `GET /api/sessions/:id` - Get session with all campaigns

Gateway flow:
1. Receive request with `{ brandName, brandUrl }`
2. Create session record in Supabase
3. Create Daytona sandbox
4. Upload agent code + skills to sandbox
5. Execute agent via `sandbox.process.executeCommand()`
6. Stream/poll for results
7. Save artifacts to Supabase Storage
8. Update campaign record with results
9. Delete sandbox
10. Return campaign ID

### Step 2.4: Agent Adaptation
Modify agent to:
- Accept args via environment variables or CLI
- Output results to known file paths
- Exit cleanly when done

---

## Phase 3: Package Agent for Sandbox (1-2 hours)

### Step 3.1: Create Sandbox Bundle
Files to upload to sandbox:
```
/home/daytona/agent/
├── package.json
├── server/
│   ├── ai-client.ts
│   ├── orchestrator-prompt.ts
│   └── nano-banana-mcp.ts
├── agent/
│   └── .claude/
│       ├── agents/
│       └── skills/
└── output/           # Where results are written
```

### Step 3.2: Create Entry Script
```typescript
// sandbox-entry.ts - runs inside sandbox
// 1. Read brand info from env vars
// 2. Run orchestrator
// 3. Write results to /home/daytona/output/
// 4. Exit with code 0 on success
```

### Step 3.3: Sandbox Execution Commands
```typescript
// In gateway:
await sandbox.process.executeCommand('npm install');
await sandbox.process.executeCommand(
  'npx tsx sandbox-entry.ts',
  '/home/daytona/agent',
  { BRAND_NAME: brandName, BRAND_URL: brandUrl }
);
```

---

## Phase 4: Deploy Gateway (1 hour)

### Step 4.1: Environment Variables
```bash
# .env.production
DAYTONA_API_KEY=dtn_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
GEMINI_API_KEY=xxx
```

### Step 4.2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Or deploy to Railway:
```bash
# Connect GitHub repo
# Add environment variables in dashboard
# Deploy
```

---

## Phase 5: Testing & Validation (1-2 hours)

### Step 5.1: Local Testing
- [ ] Test Daytona sandbox creation/deletion
- [ ] Test file upload/download
- [ ] Test agent execution in sandbox
- [ ] Test Supabase writes

### Step 5.2: Integration Testing
- [ ] Full flow: API → Sandbox → Agent → Storage → Response
- [ ] Error handling: sandbox timeout, API failures
- [ ] Cleanup: verify sandboxes are deleted

### Step 5.3: Production Testing
- [ ] Deploy and test with real request
- [ ] Verify artifacts in Supabase Storage
- [ ] Check costs in Daytona dashboard

---

## File Checklist

New files to create:
- [ ] `server/gateway/index.ts` - Express API server
- [ ] `server/gateway/daytona.ts` - Sandbox management
- [ ] `server/gateway/supabase.ts` - Database client
- [ ] `server/gateway/types.ts` - Type definitions
- [ ] `server/sandbox-entry.ts` - Agent entry point for sandbox
- [ ] `vercel.json` or `railway.json` - Deployment config

Files to modify:
- [ ] `package.json` - Add new dependencies
- [ ] `.env.example` - Add new env vars

---

## Quick Reference

### Daytona SDK Cheatsheet
```typescript
import { Daytona } from '@daytonaio/sdk';

const daytona = new Daytona();
const sandbox = await daytona.create({ language: 'typescript' });

// Files
await sandbox.fs.uploadFile(buffer, 'path/file.ts');
await sandbox.fs.createFolder('output', '755');
const content = await sandbox.fs.downloadFile('output/result.json');

// Commands
const result = await sandbox.process.executeCommand('npm install');
const code = await sandbox.process.codeRun('console.log("test")');

// Cleanup
await sandbox.delete();
```

### Supabase Cheatsheet
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Database
await supabase.from('sessions').insert({ id, brand_name, brand_url });
await supabase.from('campaigns').update({ status: 'complete' }).eq('id', id);

// Storage
await supabase.storage.from('artifacts').upload(path, buffer);
const { data } = supabase.storage.from('artifacts').getPublicUrl(path);
```

---

## Milestone 1 Success Criteria

- [ ] API accepts brand info, returns campaign ID
- [ ] Campaign runs in isolated Daytona sandbox
- [ ] Results (research, hooks, images) saved to Supabase
- [ ] Sandbox cleaned up after completion
- [ ] Error handling for timeouts and failures
- [ ] Total latency < 10 minutes per campaign

---

# MILESTONE 2: Session Resume

> **Prerequisites:** Milestone 1 complete and validated in production

## Phase 6: Extend Database Schema (30 min)

### Step 6.1: Update Tables for Versioning

```sql
-- Add versioning to sessions
ALTER TABLE sessions ADD COLUMN current_version INTEGER DEFAULT 1;

-- Add parent tracking and feedback to campaigns
ALTER TABLE campaigns ADD COLUMN parent_campaign_id TEXT;
ALTER TABLE campaigns ADD COLUMN user_feedback TEXT;

-- Update storage paths to include version
-- artifacts/{session_id}/v{version}/research.md
```

### Step 6.2: Update Storage Structure

```
Supabase Storage: artifacts/
└── {session_id}/
    ├── v1/
    │   ├── research.md
    │   ├── hooks.md
    │   └── images/
    ├── v2/
    │   └── ...  (iteration based on feedback)
    └── v3/
        └── ...
```

---

## Phase 7: Implement Session Hydration (2-3 hours)

### Step 7.1: Update API Endpoints

```typescript
// Extend existing endpoint to handle resume
POST /api/generate
Body (new session): { brandName: "Acme", brandUrl: "https://acme.com" }
Body (resume):      { sessionId: "abc123", feedback: "Make hooks more emotional" }

// Get session with all versions
GET /api/sessions/:sessionId
Returns: {
  session: { id, brandName, brandUrl, currentVersion },
  campaigns: [
    { version: 1, status: "complete", imagePaths: [...] },
    { version: 2, status: "complete", imagePaths: [...] }
  ]
}

// Get specific campaign artifacts
GET /api/campaigns/:campaignId/artifacts
```

### Step 7.2: Implement Hydration Logic

```typescript
// gateway/daytona.ts - Add to runCampaign()

async function hydrateFromPreviousCampaign(
  sandbox: Sandbox,
  sessionId: string
): Promise<ResumeContext> {
  // 1. Get latest campaign for session
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'complete')
    .order('version', { ascending: false })
    .limit(1);

  const latest = campaigns[0];
  if (!latest) return { hasContext: false };

  // 2. Download artifacts from storage
  const research = await supabase.storage
    .from('artifacts')
    .download(latest.research_path);

  const hooks = await supabase.storage
    .from('artifacts')
    .download(latest.hooks_path);

  // 3. Upload to sandbox context folder
  await sandbox.fs.createFolder('context', '755');
  await sandbox.fs.uploadFile(
    Buffer.from(await research.data.text()),
    'context/research.md'
  );
  await sandbox.fs.uploadFile(
    Buffer.from(await hooks.data.text()),
    'context/hooks.md'
  );

  return {
    hasContext: true,
    version: latest.version + 1,
    previousResearch: true,
    previousHooks: true
  };
}
```

### Step 7.3: Update Agent Entry Point

```typescript
// sandbox-entry.ts - Handle resume context

const hasContext = process.env.HAS_CONTEXT === 'true';
const userFeedback = process.env.USER_FEEDBACK || '';
const version = parseInt(process.env.VERSION || '1');

if (hasContext) {
  // Read previous artifacts
  const prevResearch = await fs.readFile('context/research.md', 'utf-8');
  const prevHooks = await fs.readFile('context/hooks.md', 'utf-8');

  // Pass to orchestrator with resume context
  await runOrchestrator({
    mode: 'resume',
    previousResearch: prevResearch,
    previousHooks: prevHooks,
    userFeedback,
    version
  });
} else {
  // First run - generate everything
  await runOrchestrator({ mode: 'new' });
}
```

---

## Phase 8: Update Orchestrator Prompt (1 hour)

### Step 8.1: Add Resume Mode to Prompt

```typescript
// orchestrator-prompt.ts

function buildPrompt(context: OrchestratorContext) {
  if (context.mode === 'resume') {
    return `
You are continuing an existing ad campaign (Version ${context.version}).

## Previous Research (already completed):
${context.previousResearch}

## Previous Hooks (from last version):
${context.previousHooks}

## User Feedback for This Iteration:
"${context.userFeedback}"

## Your Task:
Based on the user feedback, decide what needs to be regenerated:

1. **If feedback mentions research/brand understanding:**
   - Regenerate research
   - Then regenerate hooks based on new research
   - Generate new images

2. **If feedback mentions hooks/messaging only:**
   - Keep existing research
   - Regenerate hooks with feedback in mind
   - Generate new images

3. **If feedback mentions images/visuals only:**
   - Keep existing research and hooks
   - Generate new images with adjusted prompts

4. **If feedback is about specific hooks:**
   - Keep research
   - Modify only the mentioned hooks
   - Regenerate images for modified hooks only

Be efficient - don't regenerate what doesn't need changing.
`;
  }

  // Original first-run prompt
  return `... existing prompt ...`;
}
```

---

## Phase 9: Testing Resume Flow (1 hour)

### Step 9.1: Test Cases

- [ ] Create new session, get v1 campaign
- [ ] Resume with feedback "regenerate hooks" → v2 uses same research
- [ ] Resume with feedback "change visuals" → v3 uses same hooks
- [ ] Resume with feedback "start fresh" → v4 regenerates all
- [ ] Verify all versions accessible via API
- [ ] Verify storage has correct folder structure

### Step 9.2: Edge Cases

- [ ] Resume non-existent session → error handling
- [ ] Resume session with failed campaign → skip to last successful
- [ ] Multiple rapid resume requests → queue or reject

---

## Milestone 2 Success Criteria

- [ ] User can resume session with `sessionId`
- [ ] Previous artifacts hydrated into new sandbox
- [ ] User feedback influences what gets regenerated
- [ ] All versions preserved and accessible
- [ ] Version history visible in API responses
- [ ] Efficient regeneration (skip unchanged artifacts)
