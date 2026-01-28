# Creative Ad Agent: File System & Storage Requirements

> Version 1.0 | January 2025

## Overview

This document defines the functional requirements for how the Creative Ad Agent manages files, sessions, and storage across local development and production environments.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Files ARE the Database** | For simplicity, generated content (research, hooks, prompts) is stored as files, not database records |
| **Abstract Storage Interface** | Same code works locally (filesystem) and production (cloud storage) |
| **Session-Based Organization** | Each generation run creates a session with all artifacts grouped together |
| **Cross-Session References** | Users can reference files from previous sessions using @mentions |
| **Selective Regeneration** | When users edit files, only downstream content regenerates |

---

## Session Structure

### What is a Session?

A session represents one complete ad generation run. It contains all artifacts produced for a single brand/request.

```
Session
├── Metadata (id, brand, created, status)
├── Research (brand analysis)
├── Hooks (6 ad copy variations)
├── Prompts (6 image generation prompts)
└── Images (6 generated images)
```

### Session Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CREATE    │────▶│  GENERATE   │────▶│  COMPLETE   │
│             │     │             │     │             │
│ User starts │     │ Agent runs  │     │ All files   │
│ new request │     │ creates     │     │ created     │
└─────────────┘     │ files       │     └──────┬──────┘
                    └─────────────┘            │
                                               ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   EDITING   │◀────│   ACTIVE    │
                    │             │     │             │
                    │ User edits  │     │ User views, │
                    │ regenerates │     │ downloads   │
                    └─────────────┘     └─────────────┘
```

### Session States

| State | Description | User Actions Available |
|-------|-------------|----------------------|
| `creating` | Session just started | Cancel |
| `researching` | Fetching brand info | Cancel |
| `generating_hooks` | Creating ad copy | Cancel |
| `generating_prompts` | Creating visual prompts | Cancel |
| `generating_images` | Creating images | Cancel |
| `complete` | All artifacts ready | View, Edit, Regenerate, Download, Fork |
| `editing` | User making changes | Save, Cancel, Regenerate |
| `error` | Something failed | Retry, Cancel |

---

## File Types & Schemas

### 1. Research File (`research.md`)

Contains brand analysis extracted from the website.

```markdown
# Brand Research: {Brand Name}

## Source
- URL: {website_url}
- Analyzed: {timestamp}

## Brand Identity
- **Tagline**: {tagline}
- **Tone**: {tone_description}
- **Colors**: {primary_color}, {secondary_color}

## Value Propositions
1. {value_prop_1}
2. {value_prop_2}
3. {value_prop_3}

## Target Audience
- **Demographics**: {demographics}
- **Psychographics**: {psychographics}
- **Pain Points**: {pain_points}

## Proof Points
- {proof_point_1}
- {proof_point_2}
- {proof_point_3}

## Competitive Positioning
{competitive_analysis}
```

### 2. Hooks File (`hooks.md`)

Contains 6 ad copy variations using different psychological triggers.

```markdown
# Hook Bank: {Brand Name}

Generated: {timestamp}
Based on: research.md

---

## Hook 1: Stat/Data (Social Proof)

**Headline**: "{hook_headline}"

**Body**: {hook_body}

**CTA**: {call_to_action}

**Emotional Trigger**: Social Proof
**Target Emotion**: Trust, FOMO

---

## Hook 2: Story/Result (Empathy)

**Headline**: "{hook_headline}"

**Body**: {hook_body}

**CTA**: {call_to_action}

**Emotional Trigger**: Empathy + Relief
**Target Emotion**: Connection, Hope

---

## Hook 3: FOMO/Urgency (Loss Aversion)

...

## Hook 4: Curiosity (Intrigue)

...

## Hook 5: Call-out (Recognition)

...

## Hook 6: Contrast/Enemy (Differentiation)

...
```

### 3. Prompts File (`prompts.json`)

Contains image generation prompts for each hook.

```json
{
  "version": "1.0",
  "brand": "{brand_name}",
  "style": "{style_preference}",
  "generated_at": "{timestamp}",
  "prompts": [
    {
      "id": 1,
      "hook_type": "stat_data",
      "prompt": "{full_image_generation_prompt}",
      "negative_prompt": "{things_to_avoid}",
      "aspect_ratio": "1:1",
      "style_modifiers": ["professional", "clean", "bold"],
      "color_palette": ["#111111", "#ffffff", "#ff0000"]
    },
    {
      "id": 2,
      "hook_type": "story_result",
      "prompt": "{full_image_generation_prompt}",
      ...
    },
    ...
  ]
}
```

### 4. Session Metadata (`session.json`)

Contains session state and references.

```json
{
  "id": "{session_id}",
  "brand_name": "{brand}",
  "brand_url": "{url}",
  "created_at": "{timestamp}",
  "updated_at": "{timestamp}",
  "status": "complete",
  "files": {
    "research": "research.md",
    "hooks": "hooks.md",
    "prompts": "prompts.json"
  },
  "images": [
    {
      "id": 1,
      "filename": "1.png",
      "hook_id": 1,
      "generated_at": "{timestamp}",
      "prompt_version": 1
    },
    ...
  ],
  "history": [
    {
      "action": "created",
      "timestamp": "{timestamp}"
    },
    {
      "action": "hooks_edited",
      "timestamp": "{timestamp}",
      "details": { "hook_id": 3 }
    },
    {
      "action": "image_regenerated",
      "timestamp": "{timestamp}",
      "details": { "image_id": 3 }
    }
  ]
}
```

---

## Directory Structure

### Local Development

```
/outputs/
├── nike-1706234567/
│   ├── session.json
│   ├── research.md
│   ├── hooks.md
│   ├── prompts.json
│   └── images/
│       ├── 1.png
│       ├── 2.png
│       ├── 3.png
│       ├── 4.png
│       ├── 5.png
│       └── 6.png
│
├── plumber-austin-1706234890/
│   ├── session.json
│   ├── research.md
│   ├── hooks.md
│   ├── prompts.json
│   └── images/
│       └── ...
│
└── index.json  (list of all sessions)
```

### Production (Cloudflare R2 + D1)

**R2 Bucket Structure:**
```
creative-agent-files/
├── {session_id}/
│   ├── research.md
│   ├── hooks.md
│   ├── prompts.json
│   └── images/
│       ├── 1.png
│       └── ...
```

**D1 Database Schema:**
```sql
-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  brand_name TEXT NOT NULL,
  brand_url TEXT,
  status TEXT DEFAULT 'creating',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Session history
CREATE TABLE session_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,  -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Images metadata
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  image_index INTEGER NOT NULL,  -- 1-6
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  hook_id INTEGER NOT NULL,
  prompt_version INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Indexes
CREATE INDEX idx_sessions_brand ON sessions(brand_name);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_images_session ON images(session_id);
```

---

## Storage Interface

### Abstract Interface

```typescript
interface Storage {
  // Session Management
  createSession(brandName: string, brandUrl?: string): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  listSessions(options?: ListOptions): Promise<Session[]>;
  deleteSession(sessionId: string): Promise<void>;

  // File Operations
  readFile(sessionId: string, filename: string): Promise<string>;
  writeFile(sessionId: string, filename: string, content: string): Promise<void>;
  fileExists(sessionId: string, filename: string): Promise<boolean>;
  listFiles(sessionId: string): Promise<string[]>;

  // Image Operations
  saveImage(sessionId: string, imageIndex: number, buffer: Buffer): Promise<string>;
  getImageUrl(sessionId: string, imageIndex: number): string;
  deleteImage(sessionId: string, imageIndex: number): Promise<void>;

  // Cross-Session References
  resolveFileRef(ref: string): Promise<{ sessionId: string; filename: string; content: string }>;
}

interface Session {
  id: string;
  brandName: string;
  brandUrl?: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'brand_name';
  order?: 'asc' | 'desc';
}

type SessionStatus =
  | 'creating'
  | 'researching'
  | 'generating_hooks'
  | 'generating_prompts'
  | 'generating_images'
  | 'complete'
  | 'editing'
  | 'error';
```

### Local Implementation

```typescript
// storage/local.ts
import fs from 'fs';
import path from 'path';

const OUTPUTS_DIR = './outputs';

export class LocalStorage implements Storage {
  async createSession(brandName: string, brandUrl?: string): Promise<Session> {
    const id = `${slugify(brandName)}-${Date.now()}`;
    const sessionDir = path.join(OUTPUTS_DIR, id);

    fs.mkdirSync(sessionDir, { recursive: true });
    fs.mkdirSync(path.join(sessionDir, 'images'));

    const session: Session = {
      id,
      brandName,
      brandUrl,
      status: 'creating',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Write session.json
    fs.writeFileSync(
      path.join(sessionDir, 'session.json'),
      JSON.stringify(session, null, 2)
    );

    // Update index
    this.updateIndex(session);

    return session;
  }

  async readFile(sessionId: string, filename: string): Promise<string> {
    const filepath = path.join(OUTPUTS_DIR, sessionId, filename);
    return fs.readFileSync(filepath, 'utf-8');
  }

  async writeFile(sessionId: string, filename: string, content: string): Promise<void> {
    const filepath = path.join(OUTPUTS_DIR, sessionId, filename);
    fs.writeFileSync(filepath, content);
    await this.touchSession(sessionId);
  }

  async saveImage(sessionId: string, imageIndex: number, buffer: Buffer): Promise<string> {
    const filename = `${imageIndex}.png`;
    const filepath = path.join(OUTPUTS_DIR, sessionId, 'images', filename);
    fs.writeFileSync(filepath, buffer);
    return `/outputs/${sessionId}/images/${filename}`;
  }

  getImageUrl(sessionId: string, imageIndex: number): string {
    return `/outputs/${sessionId}/images/${imageIndex}.png`;
  }

  async resolveFileRef(ref: string): Promise<{ sessionId: string; filename: string; content: string }> {
    // Parse @session/filename format
    const match = ref.match(/@([^/]+)\/(.+)/);
    if (!match) throw new Error(`Invalid file reference: ${ref}`);

    const [, sessionRef, filename] = match;

    // Find session by ID or brand name
    const sessions = await this.listSessions();
    const session = sessions.find(s =>
      s.id === sessionRef ||
      s.id.startsWith(sessionRef) ||
      slugify(s.brandName) === sessionRef
    );

    if (!session) throw new Error(`Session not found: ${sessionRef}`);

    const content = await this.readFile(session.id, filename);
    return { sessionId: session.id, filename, content };
  }

  private updateIndex(session: Session): void {
    const indexPath = path.join(OUTPUTS_DIR, 'index.json');
    let index: Session[] = [];

    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    const existingIdx = index.findIndex(s => s.id === session.id);
    if (existingIdx >= 0) {
      index[existingIdx] = session;
    } else {
      index.unshift(session);
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }
}
```

### Production Implementation (Cloudflare)

```typescript
// storage/cloudflare.ts
import { D1Database, R2Bucket } from '@cloudflare/workers-types';

export class CloudflareStorage implements Storage {
  constructor(
    private d1: D1Database,
    private r2: R2Bucket
  ) {}

  async createSession(brandName: string, brandUrl?: string): Promise<Session> {
    const id = crypto.randomUUID();
    const now = Date.now();

    await this.d1.prepare(`
      INSERT INTO sessions (id, brand_name, brand_url, status, created_at, updated_at)
      VALUES (?, ?, ?, 'creating', ?, ?)
    `).bind(id, brandName, brandUrl, now, now).run();

    return {
      id,
      brandName,
      brandUrl,
      status: 'creating',
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const result = await this.d1.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `).bind(sessionId).first();

    if (!result) return null;

    return {
      id: result.id as string,
      brandName: result.brand_name as string,
      brandUrl: result.brand_url as string | undefined,
      status: result.status as SessionStatus,
      createdAt: new Date(result.created_at as number),
      updatedAt: new Date(result.updated_at as number)
    };
  }

  async readFile(sessionId: string, filename: string): Promise<string> {
    const key = `${sessionId}/${filename}`;
    const object = await this.r2.get(key);

    if (!object) throw new Error(`File not found: ${key}`);

    return await object.text();
  }

  async writeFile(sessionId: string, filename: string, content: string): Promise<void> {
    const key = `${sessionId}/${filename}`;
    await this.r2.put(key, content, {
      httpMetadata: { contentType: 'text/plain' }
    });
    await this.touchSession(sessionId);
  }

  async saveImage(sessionId: string, imageIndex: number, buffer: Buffer): Promise<string> {
    const key = `${sessionId}/images/${imageIndex}.png`;
    await this.r2.put(key, buffer, {
      httpMetadata: { contentType: 'image/png' }
    });

    // Record in D1
    await this.d1.prepare(`
      INSERT INTO images (session_id, image_index, filename, r2_key, hook_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionId, imageIndex, `${imageIndex}.png`, key, imageIndex, Date.now()).run();

    return this.getImageUrl(sessionId, imageIndex);
  }

  getImageUrl(sessionId: string, imageIndex: number): string {
    // Return public R2 URL or signed URL
    return `https://${R2_PUBLIC_DOMAIN}/${sessionId}/images/${imageIndex}.png`;
  }

  async listSessions(options: ListOptions = {}): Promise<Session[]> {
    const { limit = 20, offset = 0, orderBy = 'created_at', order = 'desc' } = options;

    const results = await this.d1.prepare(`
      SELECT * FROM sessions
      ORDER BY ${orderBy} ${order}
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return results.results.map(r => ({
      id: r.id as string,
      brandName: r.brand_name as string,
      brandUrl: r.brand_url as string | undefined,
      status: r.status as SessionStatus,
      createdAt: new Date(r.created_at as number),
      updatedAt: new Date(r.updated_at as number)
    }));
  }

  private async touchSession(sessionId: string): Promise<void> {
    await this.d1.prepare(`
      UPDATE sessions SET updated_at = ? WHERE id = ?
    `).bind(Date.now(), sessionId).run();
  }
}
```

---

## Cross-Session File References

### @mention Syntax

Users can reference files from other sessions using @mentions:

```
@{session_id}/{filename}
@{brand_name}/{filename}
```

**Examples:**
- `@nike-1706234567/research.md` - Exact session ID
- `@nike/hooks.md` - By brand name (uses most recent)
- `@plumber/research.md` - Partial match

### Resolution Logic

```typescript
async function resolveFileRef(ref: string, storage: Storage): Promise<FileRef> {
  // Parse @session/filename
  const match = ref.match(/@([^/]+)\/(.+)/);
  if (!match) throw new Error(`Invalid reference: ${ref}`);

  const [, sessionRef, filename] = match;

  // Try exact ID match first
  let session = await storage.getSession(sessionRef);

  if (!session) {
    // Try brand name match
    const sessions = await storage.listSessions({ orderBy: 'created_at', order: 'desc' });
    session = sessions.find(s =>
      s.id.startsWith(sessionRef) ||
      slugify(s.brandName) === slugify(sessionRef) ||
      s.brandName.toLowerCase().includes(sessionRef.toLowerCase())
    );
  }

  if (!session) throw new Error(`Session not found: ${sessionRef}`);

  const content = await storage.readFile(session.id, filename);

  return {
    sessionId: session.id,
    filename,
    content
  };
}
```

### UI Autocomplete

When user types `@`, show autocomplete:

```typescript
async function getAutocompleteSuggestions(
  input: string,
  storage: Storage
): Promise<Suggestion[]> {
  const match = input.match(/@([^/]*)(?:\/(.*))?$/);
  if (!match) return [];

  const [, sessionQuery, fileQuery] = match;

  if (!sessionQuery || !fileQuery) {
    // Show sessions
    const sessions = await storage.listSessions({ limit: 10 });
    return sessions
      .filter(s => !sessionQuery || s.brandName.toLowerCase().includes(sessionQuery.toLowerCase()))
      .map(s => ({
        type: 'session',
        label: s.brandName,
        value: `@${s.id}/`,
        meta: formatDate(s.createdAt)
      }));
  } else {
    // Show files in session
    const sessions = await storage.listSessions();
    const session = sessions.find(s =>
      s.id.startsWith(sessionQuery) ||
      slugify(s.brandName) === slugify(sessionQuery)
    );

    if (!session) return [];

    const files = await storage.listFiles(session.id);
    return files
      .filter(f => !fileQuery || f.toLowerCase().includes(fileQuery.toLowerCase()))
      .map(f => ({
        type: 'file',
        label: `${session.brandName}/${f}`,
        value: `@${session.id}/${f}`,
        meta: f.endsWith('.md') ? 'Markdown' : 'JSON'
      }));
  }
}
```

---

## Editing & Regeneration Flow

### Edit Detection

When user edits a file, detect what needs to regenerate:

```typescript
interface EditImpact {
  editedFile: string;
  regenerate: {
    hooks: boolean;
    prompts: boolean;
    images: number[];  // Which image indices
  };
}

function calculateEditImpact(editedFile: string, editedIndices?: number[]): EditImpact {
  switch (editedFile) {
    case 'research.md':
      // Research affects everything downstream
      return {
        editedFile,
        regenerate: {
          hooks: true,
          prompts: true,
          images: [1, 2, 3, 4, 5, 6]
        }
      };

    case 'hooks.md':
      // Hooks affect prompts and images
      return {
        editedFile,
        regenerate: {
          hooks: false,
          prompts: true,
          images: editedIndices || [1, 2, 3, 4, 5, 6]
        }
      };

    case 'prompts.json':
      // Prompts only affect images
      return {
        editedFile,
        regenerate: {
          hooks: false,
          prompts: false,
          images: editedIndices || [1, 2, 3, 4, 5, 6]
        }
      };

    default:
      return {
        editedFile,
        regenerate: { hooks: false, prompts: false, images: [] }
      };
  }
}
```

### Regeneration Options

After user edits, offer choices:

```typescript
interface RegenerationChoice {
  id: string;
  label: string;
  description: string;
  impact: EditImpact;
}

function getRegenerationChoices(impact: EditImpact): RegenerationChoice[] {
  const choices: RegenerationChoice[] = [];

  if (impact.regenerate.images.length === 1) {
    choices.push({
      id: 'single_image',
      label: `Regenerate Image ${impact.regenerate.images[0]}`,
      description: 'Update just this image with your changes',
      impact: { ...impact, regenerate: { ...impact.regenerate, images: impact.regenerate.images } }
    });
  }

  if (impact.regenerate.images.length > 0) {
    choices.push({
      id: 'all_images',
      label: 'Regenerate All Images',
      description: 'Update all 6 images with your changes',
      impact
    });
  }

  choices.push({
    id: 'save_only',
    label: 'Save Only',
    description: 'Keep current images, just save your text changes',
    impact: { ...impact, regenerate: { hooks: false, prompts: false, images: [] } }
  });

  return choices;
}
```

### Version Tracking

Track file versions for history/undo:

```typescript
interface FileVersion {
  sessionId: string;
  filename: string;
  version: number;
  content: string;
  createdAt: Date;
  createdBy: 'agent' | 'user';
}

async function saveFileWithVersion(
  storage: Storage,
  sessionId: string,
  filename: string,
  content: string,
  createdBy: 'agent' | 'user'
): Promise<void> {
  // Save current content
  await storage.writeFile(sessionId, filename, content);

  // Save version history (last 10 versions)
  const historyKey = `${filename}.history.json`;
  let history: FileVersion[] = [];

  try {
    const existing = await storage.readFile(sessionId, historyKey);
    history = JSON.parse(existing);
  } catch {
    // No history yet
  }

  history.unshift({
    sessionId,
    filename,
    version: history.length + 1,
    content,
    createdAt: new Date(),
    createdBy
  });

  // Keep only last 10 versions
  history = history.slice(0, 10);

  await storage.writeFile(sessionId, historyKey, JSON.stringify(history));
}
```

---

## API Endpoints

### Session Endpoints

```typescript
// Create new session
POST /api/sessions
Body: { brandName: string, brandUrl?: string }
Response: { session: Session }

// List sessions
GET /api/sessions?limit=20&offset=0&orderBy=created_at&order=desc
Response: { sessions: Session[], total: number }

// Get session details
GET /api/sessions/:sessionId
Response: { session: Session, files: string[], images: Image[] }

// Delete session
DELETE /api/sessions/:sessionId
Response: { success: true }
```

### File Endpoints

```typescript
// Read file
GET /api/sessions/:sessionId/files/:filename
Response: { content: string, updatedAt: string }

// Write file
PUT /api/sessions/:sessionId/files/:filename
Body: { content: string }
Response: { success: true, updatedAt: string }

// List files
GET /api/sessions/:sessionId/files
Response: { files: string[] }

// Resolve @mention
GET /api/resolve?ref=@nike/hooks.md
Response: { sessionId: string, filename: string, content: string }
```

### Image Endpoints

```typescript
// Get image
GET /api/sessions/:sessionId/images/:index
Response: Image file (PNG)

// Regenerate image
POST /api/sessions/:sessionId/images/:index/regenerate
Body: { prompt?: string }  // Optional custom prompt
Response: { imageUrl: string }

// Regenerate all images
POST /api/sessions/:sessionId/images/regenerate
Response: { images: { index: number, url: string }[] }
```

### Generation Endpoint

```typescript
// Start generation (WebSocket for streaming)
WS /api/generate
Message: { type: 'start', brandName: string, brandUrl?: string }
Message: { type: 'start_with_context', brandName: string, refs: string[] }

// Stream events
{ type: 'status', status: SessionStatus }
{ type: 'file_created', filename: string }
{ type: 'image_created', index: number, url: string }
{ type: 'complete', session: Session }
{ type: 'error', message: string }
```

---

## Context Injection

### Injecting Files into Agent Prompts

When the agent runs, inject relevant file content:

```typescript
async function buildAgentPrompt(
  storage: Storage,
  sessionId: string,
  userRequest: string,
  refs: string[]  // @mentions from user input
): Promise<string> {
  let context = '';

  // 1. Inject current session files (if they exist)
  const currentFiles = ['research.md', 'hooks.md', 'prompts.json'];
  for (const filename of currentFiles) {
    try {
      const content = await storage.readFile(sessionId, filename);
      context += `
<current_file name="${filename}">
${content}
</current_file>

`;
    } catch {
      // File doesn't exist yet
    }
  }

  // 2. Inject referenced files from other sessions
  for (const ref of refs) {
    try {
      const resolved = await storage.resolveFileRef(ref);
      context += `
<referenced_file session="${resolved.sessionId}" name="${resolved.filename}">
${resolved.content}
</referenced_file>

`;
    } catch (e) {
      context += `
<reference_error ref="${ref}">
Could not resolve: ${e.message}
</reference_error>

`;
    }
  }

  // 3. Build final prompt
  return `
## Context

${context}

## User Request

${userRequest}
`;
}
```

### Prompt Caching for Repeated Context

Use Claude's prompt caching for efficiency:

```typescript
async function runAgentWithCaching(
  storage: Storage,
  sessionId: string,
  userRequest: string
): Promise<void> {
  // Read files once
  const research = await storage.readFile(sessionId, 'research.md');
  const hooks = await storage.readFile(sessionId, 'hooks.md');

  // Use prompt caching
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    system: [
      {
        type: 'text',
        text: 'You are a creative ad generation assistant.',
      },
      {
        type: 'text',
        text: `# Current Research\n\n${research}`,
        cache_control: { type: 'ephemeral' }  // Cache for 5 min
      },
      {
        type: 'text',
        text: `# Current Hooks\n\n${hooks}`,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [
      { role: 'user', content: userRequest }
    ]
  });

  // Subsequent calls within 5 min use cached context
  // 90% token savings on research + hooks content
}
```

---

## Environment Configuration

### Local Development

```env
# .env.local
STORAGE_TYPE=local
OUTPUTS_DIR=./outputs
```

### Production (Cloudflare)

```env
# wrangler.toml
[vars]
STORAGE_TYPE = "cloudflare"

[[d1_databases]]
binding = "DB"
database_name = "creative-agent"
database_id = "xxx"

[[r2_buckets]]
binding = "R2"
bucket_name = "creative-agent-files"
```

### Storage Factory

```typescript
// storage/index.ts
import { LocalStorage } from './local';
import { CloudflareStorage } from './cloudflare';

export function createStorage(env: any): Storage {
  if (env.STORAGE_TYPE === 'cloudflare') {
    return new CloudflareStorage(env.DB, env.R2);
  }
  return new LocalStorage(env.OUTPUTS_DIR || './outputs');
}
```

---

## Summary

| Requirement | Solution |
|-------------|----------|
| File storage | Filesystem (local) / R2 (production) |
| Session metadata | JSON file (local) / D1 (production) |
| Cross-session refs | @mention syntax with autocomplete |
| Edit tracking | Calculate downstream impact |
| Selective regen | Only regenerate affected content |
| Version history | Last 10 versions per file |
| Context injection | Read files, inject into prompt |
| Cost optimization | Prompt caching for repeated context |
