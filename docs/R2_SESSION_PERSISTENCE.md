# R2 Session Persistence Plan

## Problem

Cloudflare Containers have ephemeral disk. When a container goes idle and shuts down, the SDK's JSONL session files at `~/.claude/projects/` are wiped. Without these files, the `resume` option won't work and follow-up conversations lose context.

## Solution

Sync session JSONL files to Cloudflare R2 on container shutdown, and hydrate from R2 before follow-up calls.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Container Lifecycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INITIAL GENERATION                                          │
│     └─ SDK creates: ~/.claude/projects/{slug}/{sdkSessionId}.jsonl
│     └─ Server stores sdkSessionId in campaigns table            │
│                                                                  │
│  2. FOLLOW-UP (container still warm)                            │
│     └─ SDK reads local JSONL, appends to it                     │
│     └─ Resume works normally                                    │
│                                                                  │
│  3. CONTAINER IDLE (sleepAfter timeout)                         │
│     └─ Cloudflare sends SIGTERM                                 │
│     └─ Shutdown handler uploads JSONL to R2                     │
│     └─ 15-minute grace period for upload                        │
│                                                                  │
│  4. CONTAINER DIES                                              │
│     └─ Disk wiped, but JSONL safe in R2                         │
│                                                                  │
│  5. FOLLOW-UP (container cold start)                            │
│     └─ Before SDK call: download JSONL from R2                  │
│     └─ SDK reads local JSONL, resume works                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## R2 Bucket Structure

```
sessions/
  {sdk_session_id}.jsonl    # Main session files
```

Example:
```
sessions/b6a6098d-5a44-4f78-918e-e2ea10aef23b.jsonl
```

Note: Subagent files (`agent-*.jsonl`) are NOT synced — they're ephemeral and regenerated each run.

## Implementation

### 1. Environment Variables

Add to `.env`:
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=creative-agent-sessions
```

### 2. New Module: `server/lib/r2-session-sync.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { glob } from 'glob';
import * as fs from 'fs/promises';
import * as path from 'path';

const PROJECT_SLUG = '-Users-chakra-Documents-Agents-creative-agent-agent';
const SESSION_DIR = path.join(process.env.HOME!, '.claude/projects', PROJECT_SLUG);

let r2: S3Client | null = null;

export function initR2Client() {
  if (!process.env.R2_ACCOUNT_ID) {
    console.log('⚠️ R2 not configured, session persistence disabled');
    return;
  }

  r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  console.log('✅ R2 client initialized for session persistence');
}

/**
 * Download session JSONL from R2 to local disk (called before follow-up)
 */
export async function hydrateSession(sdkSessionId: string): Promise<boolean> {
  if (!r2) return false;

  const localPath = path.join(SESSION_DIR, `${sdkSessionId}.jsonl`);

  // Skip if file already exists locally
  try {
    await fs.access(localPath);
    console.log(`📂 Session ${sdkSessionId} already exists locally`);
    return true;
  } catch {
    // File doesn't exist, proceed to download
  }

  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `sessions/${sdkSessionId}.jsonl`,
    }));

    const content = await res.Body?.transformToString();
    if (content) {
      await fs.mkdir(SESSION_DIR, { recursive: true });
      await fs.writeFile(localPath, content);
      console.log(`✅ Hydrated session ${sdkSessionId} from R2`);
      return true;
    }
  } catch (err: any) {
    if (err.name === 'NoSuchKey') {
      console.log(`📭 Session ${sdkSessionId} not found in R2 (new session)`);
    } else {
      console.error(`❌ Failed to hydrate session ${sdkSessionId}:`, err);
    }
  }

  return false;
}

/**
 * Upload a single session JSONL to R2
 */
export async function persistSession(sdkSessionId: string): Promise<boolean> {
  if (!r2) return false;

  const localPath = path.join(SESSION_DIR, `${sdkSessionId}.jsonl`);

  try {
    const content = await fs.readFile(localPath, 'utf-8');
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `sessions/${sdkSessionId}.jsonl`,
      Body: content,
      ContentType: 'application/jsonl',
    }));
    console.log(`✅ Persisted session ${sdkSessionId} to R2`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to persist session ${sdkSessionId}:`, err);
    return false;
  }
}

/**
 * Upload all session JSONL files to R2 (called on shutdown)
 */
export async function persistAllSessions(): Promise<void> {
  if (!r2) return;

  try {
    const files = await glob(`${SESSION_DIR}/*.jsonl`);
    // Filter out subagent files
    const sessionFiles = files.filter(f => !path.basename(f).startsWith('agent-'));

    console.log(`💾 Persisting ${sessionFiles.length} session files to R2...`);

    for (const file of sessionFiles) {
      const sessionId = path.basename(file, '.jsonl');
      await persistSession(sessionId);
    }

    console.log('✅ All sessions persisted to R2');
  } catch (err) {
    console.error('❌ Failed to persist sessions:', err);
  }
}

/**
 * Register shutdown handler to persist sessions before container dies
 */
export function registerShutdownHandler() {
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, persisting sessions to R2...');
    await persistAllSessions();
    console.log('👋 Shutdown complete');
    process.exit(0);
  });

  console.log('✅ Shutdown handler registered for session persistence');
}
```

### 3. Initialize in `sdk-server.ts`

```typescript
import { initR2Client, registerShutdownHandler } from './lib/r2-session-sync.js';

// At startup
initR2Client();
registerShutdownHandler();
```

### 4. Hydrate Before Follow-up in `websocket-handler.ts`

```typescript
import { hydrateSession } from './r2-session-sync.js';

async function handleFollowUp(state: ConnectionState, prompt: string, campaignId: string) {
  // ... existing code to get sdkSessionId from DB ...

  const sdkSessionId = db.getSdkSessionId(campaignId);
  if (!sdkSessionId) {
    send(state.ws, { type: 'error', ... });
    return;
  }

  // Hydrate session from R2 if not on local disk
  await hydrateSession(sdkSessionId);

  // ... continue with SDK call ...
}
```

### 5. Optional: Persist After Generation Complete

For extra safety, persist immediately after generation completes (not just on shutdown):

```typescript
import { persistSession } from './r2-session-sync.js';

// In handleGenerate/handleFollowUp, after SDK completes:
if (sdkSessionId) {
  await persistSession(sdkSessionId);
}
```

## Cloudflare Container Configuration

```javascript
// wrangler.jsonc or Container class
export class AgentContainer extends Container {
  defaultPort = 3001;
  sleepAfter = "10m";  // Container sleeps after 10 minutes idle

  // R2 credentials passed to container
  envVars = {
    R2_ACCOUNT_ID: this.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: this.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: this.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: this.env.R2_BUCKET_NAME,
  };
}
```

## Session Lifecycle Summary

| Event | Action |
|-------|--------|
| Initial generation | SDK creates JSONL locally |
| Generation complete | (Optional) Persist to R2 immediately |
| Follow-up (warm) | SDK reads local JSONL |
| Follow-up (cold) | Hydrate from R2, then SDK reads |
| Container idle | SIGTERM → persist all to R2 |
| Container restart | Fresh disk, hydrate on-demand |

## File Sizes & Costs

- Typical session JSONL: 100KB - 1MB
- R2 pricing: $0.015/GB storage, $0.36/million Class A ops (writes), $0.036/million Class B ops (reads)
- Estimated cost: < $1/month for typical usage

## Edge Cases

1. **Container crashes (OOM, etc.)**: SIGKILL sent, no time to persist. Mitigation: persist after each generation completes.

2. **Concurrent follow-ups**: Multiple follow-ups to same campaign could race. Mitigation: use campaign-level locking or queue.

3. **R2 unavailable**: Degrade gracefully — follow-up works if local file exists, fails with clear error if not.

4. **Large sessions**: Very long conversations could create large JSONL files. Mitigation: monitor sizes, implement rotation if needed.

## Testing Checklist

- [ ] Create R2 bucket `creative-agent-sessions`
- [ ] Generate API credentials with read/write access
- [ ] Test `persistSession()` uploads correctly
- [ ] Test `hydrateSession()` downloads correctly
- [ ] Test SIGTERM handler triggers persist
- [ ] Test follow-up after simulated cold start
- [ ] Test error handling when R2 unavailable
