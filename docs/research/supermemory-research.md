# Supermemory (supermemory.ai) — Comprehensive Research

**Date**: 2026-03-20
**Confidence**: HIGH for API surface and core concepts (primary source: official docs). MEDIUM for pricing (third-party sources corroborate). LOW for rate limits (not documented).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Concepts](#2-core-concepts)
3. [API Surface](#3-api-surface)
4. [User Profiles](#4-user-profiles)
5. [Search](#5-search)
6. [Document Management](#6-document-management)
7. [Memory Operations](#7-memory-operations)
8. [Conversations API](#8-conversations-api)
9. [SDK](#9-sdk)
10. [Settings & Configuration](#10-settings--configuration)
11. [Connectors](#11-connectors)
12. [Pricing & Limits](#12-pricing--limits)
13. [Advanced Features](#13-advanced-features)
14. [Integration Patterns for AI Agents](#14-integration-patterns-for-ai-agents)
15. [Competitive Analysis](#15-competitive-analysis)
16. [Gaps & Uncertainties](#16-gaps--uncertainties)

---

## 1. Executive Summary

Supermemory is a hosted Memory API that combines RAG (retrieval-augmented generation) with a knowledge graph to provide persistent, user-scoped memory for AI applications. It differs from pure vector-search/RAG solutions by automatically extracting "memories" (semantic facts) from documents and conversations, tracking temporal validity, contradictions, and entity relationships.

**Key value proposition**: One API replaces five separate services (vector DB, knowledge graph, document processing, user profiling, connector sync). Sub-300ms search latency claimed.

**Base URL**: `https://api.supermemory.ai`
**Auth**: Bearer token via `Authorization: Bearer <API_KEY>`
**SDKs**: `npm install supermemory` (TypeScript) / `pip install supermemory` (Python)
**Console**: `https://console.supermemory.ai`

---

## 2. Core Concepts

### 2.1 Documents vs. Memories

| Concept | Description | Example |
|---------|-------------|---------|
| **Document** | Raw input content: PDFs, URLs, text, images, video, audio | A 50-page product spec PDF |
| **Memory** | Semantic fact extracted from documents, embedded + connected in knowledge graph | "User prefers dark mode" |

When you upload a document, Supermemory processes it through a pipeline (queued -> extracting -> chunking -> embedding -> indexing -> done) and produces hundreds of interconnected memories.

**Key distinction**: Documents are static, universal knowledge. Memories are user-specific, evolving facts. A document about Python is the same for everyone; a memory about "User loves Python" is tied to a specific user.

### 2.2 Memory Relationship Types

The knowledge graph creates three relationship categories:

1. **Updates**: Handles contradictions. New info that conflicts with old marks old as `isLatest: false`. Example: "User switched from Adidas to Puma" — the Adidas preference is preserved but no longer returned in searches.
2. **Extends**: Adds complementary knowledge without replacing. Job responsibilities extend role info.
3. **Derives**: Inferred connections from patterns. System notices user discusses React frequently and infers "User focuses on frontend development."

### 2.3 Container Tags

Container tags provide memory isolation — separate spaces by user, project, or workspace.

```typescript
// Add with a container tag
await client.add({
  content: "Meeting notes from Q1 planning",
  containerTag: "user_123"
});

// Search within a container
await client.search({ q: "Q1 plans", containerTag: "user_123" });
```

**Tag pattern**: `^[a-zA-Z0-9_:-]+$`, max 100 characters.

**Common patterns**:
- User isolation: `user_{userId}`
- Project grouping: `project_{projectId}`
- Hierarchical: `org_{orgId}_team_{teamId}`

**Important**: Search performs exact tag matching — a memory tagged `["user_123", "project_a"]` will NOT surface in a search filtered by just `["user_123"]`. (This is a gotcha for multi-tag scenarios.)

### 2.4 Content Types Supported

| Format | Details | Size Limit |
|--------|---------|------------|
| Raw text | Chat messages, notes, preferences | 1 MB |
| URLs | Auto-fetched, ads/nav stripped | 10 MB (fetched) |
| PDFs | OCR for scanned materials | 50 MB |
| Office docs | Word, Excel, PowerPoint | 50 MB |
| Google Workspace | Docs, Sheets, Slides (via connector) | — |
| Images | PNG, JPG, JPEG, WebP, GIF — OCR + visual description | 50 MB |
| Audio | MP3, WAV, M4A — transcription + speaker detection | 50 MB |
| Video | MP4, WebM — transcription + topic segmentation | 50 MB |
| Code | Markdown, source code — AST-aware chunking | 1 MB |
| Structured | JSON, CSV | 1 MB |

**Processing times**: 100-page PDF ~1-2 minutes. 1-hour video ~5-10 minutes.

### 2.5 Memory vs. RAG Pipeline

**Traditional RAG**: Query -> Embedding -> Vector Search -> Top-K Results -> LLM

**Supermemory Memory**: Query -> Entity Recognition -> Graph Traversal -> Temporal Filtering -> Context Assembly -> LLM

The memory pipeline understands that preferences can become outdated, tracks causal chains (why a fact changed), and reflects current state rather than just highest-similarity match.

---

## 3. API Surface

### 3.1 Complete Endpoint Reference

**Base URL**: `https://api.supermemory.ai`

#### Document Management (v3)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v3/documents` | Add a single document |
| `POST` | `/v3/documents/batch` | Batch add (max 600 docs) |
| `POST` | `/v3/documents/file` | Upload a file (multipart/form-data) |
| `POST` | `/v3/documents/list` | List documents (paginated) |
| `GET` | `/v3/documents/{id}` | Get document by ID |
| `GET` | `/v3/documents/{id}/chunks` | Get document chunks |
| `GET` | `/v3/documents/processing` | List currently processing docs |
| `PATCH` | `/v3/documents/{id}` | Update document |
| `DELETE` | `/v3/documents/{id}` | Delete by ID or customId |
| `DELETE` | `/v3/documents/bulk` | Bulk delete (max 100 IDs) |

#### Memory Operations (v4)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v4/memories` | Create memories directly (1-100 per batch) |
| `POST` | `/v4/memories/list` | List memory entries with history |
| `PATCH` | `/v4/memories` | Update memory (creates new version) |
| `DELETE` | `/v4/memories` | Forget a memory (soft delete) |

#### Search (v3 + v4)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v3/search` | Search documents (chunks) |
| `POST` | `/v4/search` | Search memories + documents (hybrid) |

#### Profile (v4)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v4/profile` | Get user profile + optional search |

#### Conversations (v4)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v4/conversations` | Ingest or update conversation |

#### Connections (v3)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v3/connections/{provider}` | Create connection (OAuth) |
| `GET` | `/v3/connections` | List connections |
| `GET` | `/v3/connections/{id}` | Get connection by ID |
| `GET` | `/v3/connections/provider/{provider}` | Get by provider |
| `PATCH` | `/v3/connections/{id}` | Configure connection |
| `DELETE` | `/v3/connections/{id}` | Delete connection |
| `POST` | `/v3/connections/{id}/sync` | Sync connection |
| `POST` | `/v3/connections/{id}/resources` | Fetch resources |
| `POST` | `/v3/connections/{id}/documents` | List connection docs |

#### Container Tags (v3)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v3/container-tags/{tag}` | Get tag settings |
| `PATCH` | `/v3/container-tags/{tag}` | Update entityContext |
| `DELETE` | `/v3/container-tags/{tag}` | Delete tag |
| `POST` | `/v3/container-tags/merge` | Merge tags |

#### Organization Settings (v3)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v3/settings` | Get org settings |
| `PATCH` | `/v3/settings` | Update settings |
| `PATCH` | `/v3/settings/overage` | Toggle overage billing |

#### Graph (v3)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v3/graph/stats` | Get graph statistics |
| `GET` | `/v3/graph/bounds` | Get graph bounds |
| `GET` | `/v3/graph/viewport` | Get viewport data |

#### Infinite Chat Proxy

| Pattern | Description |
|---------|-------------|
| `https://api.supermemory.ai/v1/{provider-base-url}` | Transparent proxy (e.g., `.../v1/https/api.openai.com/v1`) |
| `https://api.supermemory.ai/v3/{provider-base-url}` | Alternative proxy path |

### 3.2 Authentication

All requests require:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Scoped API Keys** (added Feb 2026): Create container-scoped keys limited to specific `containerTag` values.
- Restricted to: `/v3/documents`, `/v3/memories`, `/v4/memories`, `/v3/search`, `/v4/search`, `/v4/profile`
- Configurable: expiration (1-365 days), rate limiting
- Revocable via DELETE by key ID

**Proxy headers** (for Infinite Chat):
```
x-supermemory-api-key: YOUR_SUPERMEMORY_KEY
x-sm-user-id: user-identifier
```

---

## 4. User Profiles

### 4.1 How Automatic Extraction Works

1. User adds documents, chats, or content to a container
2. AI analyzes ingested material for user-relevant facts
3. System adds, updates, or removes profile facts accordingly
4. Profiles continuously reflect the most recent information

No manual profile management required.

### 4.2 Static vs. Dynamic Facts

| Type | Description | Examples |
|------|-------------|---------|
| **Static** | Long-term, stable attributes (`isStatic: true`) | Name, profession, location, expertise areas, language preferences |
| **Dynamic** | Recent, evolving context | Active projects, upcoming deadlines, current work focus |

### 4.3 Profile API

```
POST https://api.supermemory.ai/v4/profile
```

**Request**:
```json
{
  "containerTag": "user_123",     // Required - scopes to user
  "q": "what projects am I on?", // Optional - also returns search results
  "threshold": 0.5,              // Optional - relevance filter (0-1)
  "filters": { ... }             // Optional - metadata filters
}
```

**Response**:
```json
{
  "profile": {
    "static": ["User specializes in Python and React", "Based in San Francisco"],
    "dynamic": ["Working on Project Alpha", "Has a demo next Tuesday"]
  },
  "searchResults": [ ... ]  // Only present if `q` was provided
}
```

### 4.4 Performance

- Profile retrieval: 50-100ms
- Compared to 3-5 separate searches: 200-500ms
- Profile delivers comprehensive user context in a single call

### 4.5 Best Practice: Profile + Search

Profiles provide foundational context about *who* the user is. Search retrieves *specific* details. Use both together:

```typescript
const { profile, searchResults } = await client.profile({
  containerTag: `user_${userId}`,
  q: userMessage,
  threshold: 0.7
});

const systemPrompt = `
Background on user:
${profile.static.join('\n')}
${profile.dynamic.join('\n')}

Relevant context:
${searchResults.map(r => r.content).join('\n')}
`;
```

---

## 5. Search

### 5.1 Unified Search Endpoint

```
POST https://api.supermemory.ai/v4/search
```

**Request**:
```json
{
  "q": "design preferences",           // Required
  "containerTag": "user_123",          // Optional - scope to container
  "searchMode": "hybrid",             // "hybrid" (default) | "memories"
  "limit": 10,                        // Max results (default 10)
  "threshold": 0.5,                   // Similarity threshold 0-1 (default varies)
  "rerank": false,                    // Re-rank for better relevance (~100ms extra)
  "filters": { ... }                  // Metadata filters
}
```

### 5.2 Search Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `hybrid` | Searches both memories AND document chunks, returns most relevant from either | Default, recommended for most cases |
| `memories` | Only extracted facts, no raw document content | When you want user-specific insights only |

### 5.3 Result Structure

Each result contains EITHER a `memory` field (extracted fact) or `chunk` field (document content), plus:
- Similarity score (0-1)
- Metadata
- Timestamp
- Version info

### 5.4 Document-Only Search (v3)

```
POST https://api.supermemory.ai/v3/search
```

Parameters: `chunkThreshold` (0-1), `docId` (search within specific doc), `filters`.

### 5.5 Filtering

Filters use AND/OR logic (max 5 nesting levels):

```json
{
  "filters": {
    "AND": [
      { "key": "category", "value": "engineering" },
      {
        "OR": [
          { "key": "priority", "value": "high" },
          { "key": "priority", "value": "critical" }
        ]
      }
    ]
  }
}
```

**Filter types**:
- `metadata` (default): Exact key-value match
- `numeric`: Operators `>`, `<`, `>=`, `<=`, `=`
- `array_contains`: Check if array contains value
- `string_contains`: Substring search with optional `ignoreCase`

All support `negate: true` for exclusion.

### 5.6 Query Optimization

- **Reranking**: Cross-encoder rescoring, ~100ms latency addition, significantly better relevance
- **Threshold tuning**: 0.3 for broad results, 0.8 for precise matches
- **Query rewriting**: System can expand queries to capture additional relevant results

---

## 6. Document Management

### 6.1 Add Document

```
POST /v3/documents
```

```json
{
  "content": "https://example.com/article",  // Required: text, URL, or base64
  "containerTag": "user_123",                // Optional
  "customId": "my-doc-001",                  // Optional: your ID for updates/dedup
  "metadata": {                              // Optional
    "category": "engineering",
    "priority": 1,
    "tags": ["react", "frontend"]
  },
  "entityContext": "Focus on design preferences and style guidelines"  // Optional, max 1500 chars
}
```

**Response**: `{ "id": "abc123", "status": "queued" }`

### 6.2 Batch Add

```
POST /v3/documents/batch
```

```json
{
  "documents": [
    { "content": "First document text", "customId": "doc-1" },
    { "content": "https://example.com", "metadata": { "type": "web" } },
    "Simple string content"  // Strings accepted directly
  ],
  "containerTag": "project_alpha",  // Applied to all
  "metadata": { "batch": true }     // Applied to all
}
```

- Max **600 documents** per batch
- Response includes `{ results: [...], failed: N, success: N }`

### 6.3 File Upload

```
POST /v3/documents/file
Content-Type: multipart/form-data
```

Fields: `file` (binary, required), `fileType` (optional override), `mimeType` (required for image/video), `metadata` (JSON string), `containerTag`.

### 6.4 Update Document

```
PATCH /v3/documents/{id}
```

- Content updates trigger full reprocessing
- Metadata-only changes skip reindexing (efficient for tag/flag updates)
- Use `customId` for consistent updates via your own identifiers

### 6.5 Delete

- **Single**: `DELETE /v3/documents/{id}` (by ID or customId) -> 204
- **Bulk by IDs**: `DELETE /v3/documents/bulk` with `{ ids: [...] }` (max 100)
- **Bulk by container**: `DELETE /v3/documents/bulk` with `{ containerTags: [...] }` (deletes ALL in container)

**WARNING**: Deletes are permanent. No recovery.

### 6.6 Processing Status

Poll for completion:
```
GET /v3/documents/{id}
```

Status values: `queued` -> `extracting` -> `chunking` -> `embedding` -> `indexing` -> `done` | `failed`

List all currently processing:
```
GET /v3/documents/processing
```

### 6.7 List Documents

```
POST /v3/documents/list
```

Paginated, supports `limit` (max 200), `page`, sort by `createdAt`/`updatedAt`, order `asc`/`desc`, plus metadata filters.

### 6.8 Get Chunks

```
GET /v3/documents/{id}/chunks
```

Returns ordered chunks with `id`, `position`, `content`, `type` (text/image), `metadata`.

---

## 7. Memory Operations

### 7.1 Create Memories Directly

Use for known facts and structured data (skip document processing pipeline):

```
POST /v4/memories
```

```json
{
  "containerTag": "user_123",  // Required
  "memories": [
    {
      "content": "User prefers dark mode",  // 1-10,000 chars
      "isStatic": true,                      // Permanent trait
      "metadata": { "source": "onboarding" }
    },
    {
      "content": "User is working on Project Alpha"
      // isStatic defaults to false (dynamic)
    }
  ]
}
```

- Batch: 1-100 memories per request
- Immediately embedded and searchable

**Response** (201):
```json
{
  "documentId": "string or null",
  "memories": [
    {
      "id": "mem_abc123",
      "memory": "User prefers dark mode",
      "isStatic": true,
      "createdAt": "2026-03-20T..."
    }
  ]
}
```

### 7.2 Update Memory (Versioned)

```
PATCH /v4/memories
```

```json
{
  "containerTag": "user_123",
  "id": "mem_abc123",           // OR "content": "exact old content"
  "newContent": "User now prefers light mode",
  "metadata": { "updated": true }  // Optional, inherits from previous if omitted
}
```

**Key**: Updates create NEW versions. Original preserved with `isLatest: false`. Full audit trail.

**Response**:
```json
{
  "id": "mem_def456",           // New version ID
  "memory": "User now prefers light mode",
  "version": 2,
  "parentMemoryId": "mem_abc123",
  "rootMemoryId": "mem_abc123",
  "createdAt": "..."
}
```

### 7.3 Forget Memory (Soft Delete)

```
DELETE /v4/memories
```

```json
{
  "containerTag": "user_123",
  "id": "mem_abc123",              // OR "content": "exact match"
  "reason": "outdated information" // Optional
}
```

Soft delete: removed from search results but preserved in system. 409 if already forgotten.

### 7.4 List Memory Entries

```
POST /v4/memories/list
```

```json
{
  "containerTags": ["user_123"],  // Required, min 1
  "filters": { ... }             // Optional metadata filters
}
```

Returns latest memory entries with version history and source documents.

### 7.5 When to Use Documents vs. Memories

| Scenario | Use |
|----------|-----|
| Raw content needing extraction | `POST /v3/documents` (Add Document) |
| Known facts, structured data | `POST /v4/memories` (Create Memory) |
| Conversation logs | `POST /v4/conversations` (Ingest Conversation) |

---

## 8. Conversations API

```
POST /v4/conversations
```

```json
{
  "conversationId": "conv_abc123",  // Required, 1-255 chars
  "messages": [
    { "role": "user", "content": "I prefer concise answers" },
    { "role": "assistant", "content": "Got it! I'll keep things brief." },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "What do you see?" },
        { "type": "image_url", "image_url": { "url": "https://..." } }
      ]
    }
  ],
  "containerTags": ["user_123"],  // Optional
  "metadata": { "channel": "chat" }
}
```

- Supports roles: `user`, `assistant`, `system`, `tool`
- Content can be string or array of content blocks (text + image URLs)
- Supports `tool_calls` and `tool_call_id` fields for tool use tracking
- Upsert behavior: same `conversationId` updates existing conversation

---

## 9. SDK

### 9.1 Installation

```bash
# TypeScript
npm install supermemory

# Python
pip install supermemory

# Vercel AI SDK tools
npm install @supermemory/tools
```

### 9.2 TypeScript SDK

```typescript
import { Supermemory } from 'supermemory';

const client = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY
});

// Add content
const doc = await client.add({
  content: "User loves hiking and photography",
  containerTag: "user_123",
  metadata: { source: "onboarding" }
});

// Search
const results = await client.search({
  q: "hobbies",
  containerTag: "user_123"
});

// Get profile
const profile = await client.profile({
  containerTag: "user_123",
  q: "what are their interests?"  // Optional
});

// List documents
const docs = await client.documents.list({
  containerTag: "user_123",
  limit: 50
});

// Delete document
await client.documents.delete(doc.id);

// Settings
const settings = await client.settings.get();
await client.settings.update({ shouldLLMFilter: true, filterPrompt: "..." });

// Container tag settings
await client.containerTags.update("user_123", {
  entityContext: "Software engineer focused on React and Node.js"
});
```

### 9.3 Python SDK

```python
from supermemory import Supermemory

client = Supermemory(api_key=os.environ.get("SUPERMEMORY_API_KEY"))

# Add content
doc = client.add(
    content="User loves hiking",
    container_tag="user_123",
    metadata={"source": "onboarding"}
)

# Search
results = client.search.memories(
    q="hobbies",
    container_tag="user_123"
)

# Profile
profile = client.profile(container_tag="user_123")
print(profile.profile.static)
print(profile.profile.dynamic)
```

### 9.4 Vercel AI SDK Integration

Two approaches:

#### Approach 1: `withSupermemory` Wrapper (Automatic)

```typescript
import { withSupermemory } from "@supermemory/tools/ai-sdk";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const modelWithMemory = withSupermemory(openai("gpt-4o"), "user-123", {
  mode: "full",           // "profile" | "query" | "full"
  addMemory: "always",    // "always" | "never" (default: never)
  conversationId: "conv_1",
  verbose: true
});

const result = await streamText({
  model: modelWithMemory,
  messages: [{ role: "user", content: "Remember I prefer TypeScript" }]
});
```

**Modes**:
- `profile`: User profile context only
- `query`: Message-based semantic search only
- `full`: Both profile + search (recommended)

Custom prompt templates:
```typescript
withSupermemory(model, userId, {
  promptTemplate: ({ userMemories, generalSearchMemories, searchResults }) => {
    return `User context: ${userMemories}\nRelevant: ${searchResults}`;
  }
});
```

#### Approach 2: Memory Tools (Agent-Controlled)

```typescript
import { supermemoryTools, searchMemoriesTool, addMemoryTool } from "@supermemory/tools/ai-sdk";

const result = await streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  tools: {
    ...supermemoryTools("API_KEY", { containerTags: ["user_123"] }),
    // or individual tools:
    searchMemories: searchMemoriesTool("API_KEY"),
    addMemory: addMemoryTool("API_KEY")
  },
  messages: [{ role: "user", content: "What do you know about me?" }]
});
```

The AI decides when to search/store memories based on conversation context.

### 9.5 OpenAI SDK Integration

```typescript
import { withSupermemory } from "@supermemory/tools";
import OpenAI from "openai";

const client = withSupermemory(openai, "user-123", {
  mode: "full",
  addMemory: "always"
});
// Works with both Chat Completions and Responses APIs
```

### 9.6 MCP Server

```bash
npx -y install-mcp@latest https://mcp.supermemory.ai/mcp --client claude --oauth=yes
```

Provides three tools:
1. **Memory Tool**: Save or forget user info with optional project scoping
2. **Recall Tool**: Search memories + retrieve profile
3. **WhoAmI Tool**: Returns current user details

Resources: `supermemory://` URIs for user profiles and project lists.

---

## 10. Settings & Configuration

### 10.1 Organization-Level Settings

```
GET /v3/settings
PATCH /v3/settings
```

| Setting | Type | Description |
|---------|------|-------------|
| `shouldLLMFilter` | boolean | Enable LLM-based content filtering during ingestion |
| `filterPrompt` | string | Instructions for what to prioritize/skip during indexing |
| `chunkSize` | integer | Document chunk size (-1 = Supermemory default) |
| `excludeItems` | mixed | Filter criteria for excluded content |
| `includeItems` | mixed | Filter criteria for included content |

**Settings apply only to NEW content**. Existing memories are not reprocessed.

### 10.2 Filter Prompt Examples

```typescript
await client.settings.update({
  shouldLLMFilter: true,
  filterPrompt: `
    PRIORITIZE: Brand guidelines, official design specs, approved copy
    SKIP: Draft documents, work-in-progress, internal comments
  `
});
```

Pre-built templates: Personal Assistant, Customer Support, Legal Assistant, Finance Agent, Healthcare, Developer Docs.

### 10.3 Chunk Size Recommendations

| Use Case | Recommended Size |
|----------|-----------------|
| Citations & references | 256-512 characters |
| Q&A / Support | 512-1,024 characters |
| Long-form analysis | 1,024-2,048 characters |

Smaller chunks = better retrieval precision. Larger chunks = more context per result.

### 10.4 Container-Level Settings

```
PATCH /v3/container-tags/{containerTag}
```

```json
{
  "entityContext": "Design exploration conversation between john@acme.com and Brand.ai assistant. Focus on John's design preferences and style choices."
}
```

Max 1500 characters. Supplements org-wide filter prompts. Persists on the container tag and guides extraction for all content in that container.

### 10.5 Overage Billing

```
PATCH /v3/settings/overage
```

```json
{ "enabled": true }
```

Only available on paid plans. When enabled, allows exceeding plan limits with per-unit overage charges.

### 10.6 Connector OAuth Branding

Custom OAuth credentials for Google Drive, Notion, OneDrive, GitHub to display your app name instead of "Supermemory" during auth flows.

---

## 11. Connectors

### 11.1 Supported Providers

| Provider | Sync Method | Real-time |
|----------|------------|-----------|
| Google Drive | Webhook | Yes |
| Gmail | Pub/Sub webhook | Yes |
| Notion | Webhook | Yes |
| OneDrive | Scheduled (4hr) | No |
| GitHub | Webhook | Yes |
| Web Crawler | Scheduled (7+ days) | No |
| S3 | — | — |

### 11.2 Connection Flow

```typescript
// 1. Create connection (returns OAuth URL)
const conn = await fetch('/v3/connections/google-drive', {
  method: 'POST',
  body: JSON.stringify({
    containerTag: "user_123",
    redirectUrl: "https://myapp.com/callback",
    documentLimit: 1000
  })
});
// Response: { authLink, expiresIn, id, redirectsTo }

// 2. User completes OAuth flow

// 3. Sync connection
await fetch(`/v3/connections/${conn.id}/sync`, { method: 'POST' });

// 4. Monitor sync via document listing
const docs = await fetch(`/v3/connections/${conn.id}/documents`, { method: 'POST' });
```

### 11.3 Disconnection

```
DELETE /v3/connections/{id}
```

Option: `deleteDocuments: false` to preserve imported content after disconnecting.

---

## 12. Pricing & Limits

### 12.1 Pricing Tiers (Confidence: MEDIUM — from third-party review sites, corroborated by official pricing page structure)

| Tier | Price | Processed Tokens | Search Queries | Support |
|------|-------|-----------------|----------------|---------|
| **Free** | $0/mo | 1M | 10K | Email |
| **Pro** | $19/mo | 3M | 100K | Priority |
| **Scale** | $399/mo | 80M | 20M | Dedicated + Slack |
| **Enterprise** | Custom | Custom | Custom | SLA + dedicated |

### 12.2 Overage Pricing

- **$0.01 per 1,000 tokens** (processing)
- **$0.10 per 1,000 queries** (search)

Overage must be explicitly enabled via `PATCH /v3/settings/overage`.

### 12.3 Known Limits

| Limit | Value |
|-------|-------|
| Batch add | 600 documents per request |
| Bulk delete | 100 IDs per request |
| Memory batch | 100 memories per request |
| Content per memory | 10,000 characters |
| Container tag length | 100 characters |
| entityContext | 1,500 characters |
| Text content | 1 MB |
| File upload | 50 MB |
| Fetched URL | 10 MB |
| Filter nesting | 5 levels |
| Pagination limit | 200 per page |
| customId length | 255 characters |
| Document limit per connection | 10,000 |
| Scoped key expiry | 1-365 days |

### 12.4 Rate Limits

**Not explicitly documented**. The API returns 429 status for rate-exceeded requests. Best practice from docs: "Batch uploads should space requests 1-2 seconds apart." Scoped API keys support configurable rate limiting, suggesting per-key rate limits exist but values are not published.

### 12.5 Startup Program

$1,000 in Pro credits for 6 months + direct collaboration with team. Apply via their website.

---

## 13. Advanced Features

### 13.1 Infinite Chat (Context Extender)

Transparent proxy that gives chat apps unlimited context by automatically managing token limits:

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.supermemory.ai/v1/https/api.openai.com/v1',
  defaultHeaders: {
    'x-supermemory-api-key': process.env.SUPERMEMORY_API_KEY,
    'x-sm-user-id': 'user_123'
  }
});
// Use normally — Supermemory handles context windowing transparently
```

- When conversations exceed ~20K tokens, intelligently retrieves relevant prior context
- Claims up to 70% cost savings on long conversations
- Provider-agnostic (any OpenAI-compatible endpoint)
- Diagnostic response headers for debugging

**Caveat (from Mem0 comparison)**: The proxy approach adds latency and consumes Supermemory tokens faster since every LLM request passes through.

### 13.2 Knowledge Graph Visualization

Available in console and via MCP server. Graph API endpoints:
- `GET /v3/graph/stats` — Total documents, spatial data counts
- `GET /v3/graph/bounds` — Graph boundary data
- `GET /v3/graph/viewport` — Viewport data for rendering

### 13.3 Memory Versioning

Every update creates a new version with:
- `version`: Incrementing number
- `parentMemoryId`: Previous version
- `rootMemoryId`: First version in chain
- `isLatest`: Only latest version returned in searches

Full audit trail preserved.

### 13.4 Temporal Forgetting

Time-sensitive facts (appointments, temporary events) automatically expire. Casual content filtered from permanent storage. Repetition strengthens preferences (reinforcement).

### 13.5 Container Tag Merging

```
POST /v3/container-tags/merge
```

Merge memories from multiple container tags into one.

### 13.6 Self-Hosting (Added Feb 2026)

Docker-based self-hosting support introduced. Details not extensively documented in public docs.

### 13.7 Webhooks / Events

**Not documented**. No webhook endpoints in the OpenAPI spec. No event system for notifying your app of memory changes, processing completion, or profile updates. You must poll `GET /v3/documents/{id}` for processing status.

---

## 14. Integration Patterns for AI Agents

### 14.1 Recommended Architecture for Agent Apps

```
User Message
    |
    v
[1] Retrieve Profile + Search
    client.profile({ containerTag: userId, q: userMessage })
    |
    v
[2] Build System Prompt
    Inject profile.static + profile.dynamic + searchResults
    |
    v
[3] Run Agent / LLM
    Generate response with full context
    |
    v
[4] Store Interaction
    client.add({ content: conversation, containerTag: userId })
    |
    v
[5] Return Response
```

### 14.2 Memory-First Pattern (Recommended for Agents)

```typescript
// Before each agent turn:
const { profile, searchResults } = await supermemory.profile({
  containerTag: `user_${userId}`,
  q: userMessage,
  threshold: 0.6
});

const systemPrompt = `
You are a helpful assistant.

## User Background
${profile.static.join('\n')}

## Current Context
${profile.dynamic.join('\n')}

## Relevant Memories
${searchResults?.map(r => `- ${r.content}`).join('\n') || 'None found'}
`;

// After agent completes:
await supermemory.add({
  content: `User: ${userMessage}\nAssistant: ${response}`,
  containerTag: `user_${userId}`,
  metadata: { type: 'conversation', campaignId }
});
```

### 14.3 Tool-Based Pattern (Agent Self-Manages Memory)

```typescript
const tools = {
  ...supermemoryTools(SUPERMEMORY_API_KEY, {
    containerTags: [`user_${userId}`]
  }),
  // Your custom tools
  generateImage: { ... },
  analyzeWebsite: { ... }
};

// Agent decides when to search/store memories
const result = await streamText({
  model: anthropic("claude-sonnet-4-20250514"),
  tools,
  system: "You have access to memory tools. Use them to remember user preferences.",
  messages: conversationHistory
});
```

### 14.4 Customer-Scoped Pattern

```typescript
// Per-customer memory isolation
const containerTag = `customer_${customerId}`;

// Store with metadata for filtering
await client.add({
  content: supportTicketContent,
  containerTag,
  metadata: {
    type: "support_ticket",
    priority: "high",
    category: "billing"
  }
});

// Search with filters
const results = await client.search({
  q: "billing issues",
  containerTag,
  filters: {
    AND: [
      { key: "type", value: "support_ticket" },
      { key: "priority", value: "high" }
    ]
  }
});
```

### 14.5 LangGraph Node Pattern

```python
# Memory retrieval node
def retrieve_context(state):
    result = memory.profile(
        container_tag=f"user_{state['user_id']}",
        q=state['messages'][-1].content
    )
    return {"context": result}

# Memory storage node (conditional — skip trivial messages)
def should_store(state):
    return len(state['messages'][-1].content) > 20

# Wire into graph
graph.add_node("retrieve", retrieve_context)
graph.add_node("respond", generate_response)
graph.add_node("store", store_memory)
graph.add_conditional_edges("respond", should_store, {"store": "store", END: END})
```

### 14.6 Error Resilience Pattern

Memory failures should not crash conversations:
```typescript
let context = { profile: { static: [], dynamic: [] }, searchResults: [] };
try {
  context = await supermemory.profile({ containerTag: userId, q: message });
} catch (err) {
  console.warn('Memory retrieval failed, proceeding without context:', err);
}
// Continue with degraded but functional experience
```

---

## 15. Competitive Analysis

### 15.1 Supermemory vs. Mem0

| Dimension | Supermemory | Mem0 |
|-----------|-------------|------|
| **Approach** | Automatic extraction + profile building | Explicit memory management |
| **Content types** | URLs, PDFs, images, video, audio | Primarily text/conversation |
| **Graph** | Automatic knowledge graph with relationships | Explicit graph relationships |
| **Profile** | Built-in automatic profiling | Manual via tools |
| **Proxy mode** | Infinite Chat (transparent proxy) | Not available |
| **Connectors** | 7 built-in (GDrive, Notion, etc.) | Fewer built-in |
| **Control** | Less transparent, more automated | Fine-grained, more verbose |
| **Debugging** | Harder to audit what was stored | Easier to audit and debug |
| **Pricing** | Free: 1M tokens | Free: limited |

**When Supermemory wins**: Multi-format content, automatic profiling, connector ecosystem, zero-code proxy.
**When Mem0 wins**: When you need fine-grained control, explicit memory lifecycle, easier debugging.

### 15.2 Adversarial Assessment

**What would change this assessment**: If Mem0 adds automatic profiling and multi-format processing (likely within 12 months), the differentiation narrows to connector ecosystem and proxy mode.

**Who would disagree**: A developer building a debugging-heavy agent pipeline would prefer Mem0's explicit control over Supermemory's black-box extraction. If extraction quality matters more than convenience, the automatic approach is risky.

**What changes in 12 months**: Both are rapidly evolving. Supermemory added self-hosting in Feb 2026. The proxy/Infinite Chat approach could be commoditized by LLM providers themselves (OpenAI's context caching, Anthropic's prompt caching already chip at this).

**Where does the value live**: In the processing pipeline (chunking, extraction, graph construction) and connector ecosystem. The vector storage itself is commodity. The extraction quality and graph intelligence are the moats.

---

## 16. Gaps & Uncertainties

### What I could NOT find or verify:

1. **Rate limits**: Not documented anywhere. 429 errors mentioned but no published limits. Scoped keys support rate limiting but values unknown. **Confidence: LOW**

2. **Webhooks / Event system**: No evidence of webhooks for processing completion, memory changes, or profile updates. Must poll for status. **Confidence: HIGH that they don't exist**

3. **Exact pricing page**: Official pricing page returned 404. Pricing data from third-party review sites corroborated by changelog and settings API. **Confidence: MEDIUM**

4. **Self-hosting details**: Mentioned in changelog (Feb 2026) but no public documentation found. **Confidence: LOW**

5. **Memory storage limits per container**: Feb 2026 changelog says "removed 120-memory limit per container tag" — now unlimited. But total storage limits per plan are unclear beyond token counts. **Confidence: MEDIUM**

6. **Search result pagination**: The v4/search endpoint does not clearly document pagination (offset/cursor). Limit parameter exists but no way to page through results is documented. **Confidence: LOW**

7. **Profile update frequency**: How quickly does the profile reflect newly ingested content? Docs say "real-time" but no SLA. **Confidence: LOW**

8. **Concurrency guarantees**: What happens with concurrent writes to the same container tag? No documentation on consistency model. **Confidence: LOW**

9. **Data retention**: How long are soft-deleted (forgotten) memories retained? No documented policy. **Confidence: LOW**

10. **SLA / Uptime guarantees**: Only mentioned for Enterprise tier. No published SLA numbers. **Confidence: LOW**

11. **GDPR / Data residency**: No documentation on data storage location, GDPR compliance, or data processing agreements. **Confidence: LOW**

---

## Sources

### Primary Sources (Official Documentation)
- [Supermemory Docs Index (llms.txt)](https://supermemory.ai/docs/llms.txt)
- [Introduction](https://supermemory.ai/docs/introduction)
- [How It Works](https://supermemory.ai/docs/concepts/how-it-works)
- [Memory vs RAG](https://supermemory.ai/docs/concepts/memory-vs-rag)
- [User Profiles (Concepts)](https://supermemory.ai/docs/concepts/user-profiles)
- [User Profiles (Guide)](https://supermemory.ai/docs/user-profiles)
- [Organizing Memories](https://supermemory.ai/docs/concepts/filtering)
- [Content Types](https://supermemory.ai/docs/concepts/content-types)
- [Graph Memory](https://supermemory.ai/docs/concepts/graph-memory)
- [SuperRAG](https://supermemory.ai/docs/concepts/super-rag)
- [Customization](https://supermemory.ai/docs/concepts/customization)
- [Authentication](https://supermemory.ai/docs/authentication)
- [Quickstart](https://supermemory.ai/docs/quickstart)
- [Memory Operations](https://supermemory.ai/docs/memory-operations)
- [Ingesting Context](https://supermemory.ai/docs/add-memories)
- [Document Operations](https://supermemory.ai/docs/document-operations)
- [Search](https://supermemory.ai/docs/search)
- [Supermemory SDK](https://supermemory.ai/docs/integrations/supermemory-sdk)
- [Vercel AI SDK Integration](https://supermemory.ai/docs/integrations/ai-sdk)
- [OpenAI Integration](https://supermemory.ai/docs/integrations/openai)
- [LangGraph Integration](https://supermemory.ai/docs/integrations/langgraph)
- [MCP Server](https://supermemory.ai/docs/supermemory-mcp/mcp)
- [Connectors Overview](https://supermemory.ai/docs/connectors/overview)
- [Changelog](https://supermemory.ai/docs/changelog/overview)
- [Infinite Chat](https://supermemory.ai/docs/model-enhancement/context-extender)
- [Migration from Mem0](https://supermemory.ai/docs/migration/from-mem0)
- [AI SDK Cookbook](https://supermemory.ai/docs/cookbook/ai-sdk-integration)
- [Personal Assistant Cookbook](https://supermemory.ai/docs/cookbook/personal-assistant)
- [Customer Support Cookbook](https://supermemory.ai/docs/cookbook/customer-support)

### API Reference Pages
- [Add Document](https://supermemory.ai/docs/api-reference/manage-documents/add-document)
- [Batch Add](https://supermemory.ai/docs/api-reference/manage-documents/batch-add-documents)
- [Upload File](https://supermemory.ai/docs/api-reference/manage-documents/upload-a-file)
- [List Documents](https://supermemory.ai/docs/api-reference/manage-documents/list-documents)
- [Get Document](https://supermemory.ai/docs/api-reference/manage-documents/get-document)
- [Get Chunks](https://supermemory.ai/docs/api-reference/manage-documents/get-document-chunks)
- [Update Document](https://supermemory.ai/docs/api-reference/manage-documents/update-document)
- [Delete Document](https://supermemory.ai/docs/api-reference/manage-documents/delete-document-by-id-or-customid)
- [Bulk Delete](https://supermemory.ai/docs/api-reference/manage-documents/bulk-delete-documents)
- [Processing Status](https://supermemory.ai/docs/api-reference/manage-documents/get-processing-documents)
- [Create Memories](https://supermemory.ai/docs/api-reference/memories/create-memories-directly)
- [Update Memory](https://supermemory.ai/docs/api-reference/memories/update-a-memory-creates-new-version)
- [Forget Memory](https://supermemory.ai/docs/api-reference/memories/forget-a-memory)
- [List Memories](https://supermemory.ai/docs/api-reference/memories-v4/list-memory-entries-with-history)
- [Search Documents](https://supermemory.ai/docs/api-reference/search/search-documents)
- [Search Memories](https://supermemory.ai/docs/api-reference/search/search-memory-entries)
- [Get Profile](https://supermemory.ai/docs/api-reference/profile/get-user-profile)
- [Conversations](https://supermemory.ai/docs/api-reference/conversations/ingest-or-update-conversation)
- [Create Connection](https://supermemory.ai/docs/api-reference/connections/create-connection)
- [Update Container Tag](https://supermemory.ai/docs/api-reference/container-tags/update-container-tag-settings)
- [Get Settings](https://supermemory.ai/docs/api-reference/organization-settings/get-settings)
- [Update Settings](https://supermemory.ai/docs/api-reference/organization-settings/update-settings)
- [Toggle Overage](https://supermemory.ai/docs/api-reference/organization-settings/toggle-overage)
- [Graph Stats](https://supermemory.ai/docs/api-reference/graph/get-graph-statistics)
- [OpenAPI Spec](https://api.supermemory.ai/v3/openapi)

### Secondary Sources
- [Supermemory Review — AI Founder Kit](https://aifounderkit.com/tool/supermemory-review-features-pricing-alternatives/) (Published ~2025, pricing details corroborate official data)
- [BetterStack Guide — Adding Long-Term Memory to AI Apps](https://betterstack.com/community/guides/ai/memory-with-supermemory/) (Technical tutorial, covers proxy pattern)
- [LogRocket — Mem0 vs Supermemory](https://blog.logrocket.com/building-ai-apps-mem0-supermemory/) (Technical comparison, secondary analysis)
- [Supermemory Pricing Page](https://supermemory.ai/pricing) (404 at time of research; data from cached/third-party sources)
