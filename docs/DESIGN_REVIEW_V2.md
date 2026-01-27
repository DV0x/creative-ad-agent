# Creative Ad Agent: Design Review & V2 Direction

> **Status:** 🟢 Phase 3 Complete (Frontend Implementation Done)
> **Date:** January 2026
> **Last Updated:** January 27, 2026
> **Current Work:** Backend Integration
> **Dev Server:** `npm run dev` → http://localhost:5173

---

## Executive Summary

The current Solarized Light prototype has **solid UX architecture** but the **wrong visual direction** for a creative ad generation tool. The aesthetic signals "developer tool" when it should signal "creative studio."

**Decision:** Pivot to **Option A: Studio Dark** - a professional creative aesthetic that makes user-generated images the hero.

**Architecture Pivot (Session 4+):** Restructured from single-session editing to **campaign-based workflow** with file-based content management.

---

## Architecture Pivot: Campaign-Based Workflow

### Why We Made This Change

The original design had several limitations:

| Problem | Original Approach | New Approach |
|---------|-------------------|--------------|
| **No persistence** | Single session, data lost on refresh | Campaigns persist with files |
| **Structured editing** | Form fields for hooks/prompts | Free-form markdown files |
| **No history** | Can't revisit previous work | Campaign list shows all projects |
| **Complex editing** | Tabbed panels with structured inputs | Simple TipTap markdown editor |
| **Unclear file refs** | How to reference content in chat? | `@research`, `@hooks`, `@prompts` mentions |

### New Campaign-Based Architecture

```
┌──────────────┬─────────────────────┬──────────────┬──────────────┐
│ Left Sidebar │    Main Content     │ File Editor  │ Chat Sidebar │
│  (Assets)    │     (Images)        │  (optional)  │              │
│  resizable   │                     │  resizable   │  resizable   │
│  200-480px   │      flex-1         │  300-600px   │  200-480px   │
└──────────────┴─────────────────────┴──────────────┴──────────────┘
```

All panels are **independently resizable** with drag handles. Widths persist to localStorage.

### Campaign Structure

Each campaign contains:

```
Campaign/
├── research.md    # Brand research, tone, colors, notes
├── hooks.md       # Ad headlines and copy (6 hooks)
├── prompts.md     # Image generation prompts
└── images/        # Generated images (6 per campaign)
```

### File-Based Content

All content is now **markdown files** edited with TipTap:

| File | Content | Example |
|------|---------|---------|
| `research.md` | Brand name, tagline, tone, colors, target audience, notes | Free-form research document |
| `hooks.md` | 6 ad hooks with headlines, body copy, CTAs | Markdown with ## headers per hook |
| `prompts.md` | Image generation prompts for each hook | Code blocks with prompt text |

### @ Mentions for Content Reference

In chat, users can reference:

```
@research    → Campaign research file
@hooks       → Campaign hooks file
@prompts     → Campaign prompts file
@Brand Kit   → Asset folder
@logo.png    → Individual asset file
```

Features:
- Type `@` to trigger autocomplete dropdown
- Keyboard navigation (↑↓ Enter Escape)
- Filter by typing after `@`
- Selected items appear as removable tags
- Campaign files only shown when a campaign is active

---

## V2 Layout Architecture

### Landing Page vs Workspace

The app has two distinct modes:

**Landing Page** (no sidebars):
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                        ✨ (logo)                                 │
│                                                                  │
│              What would you like to create?                      │
│                                                                  │
│         ┌────────────────────────────────┬────────┐             │
│         │ Enter URL or description...     │ Create │             │
│         └────────────────────────────────┴────────┘             │
│                                                                  │
│                    Try: "nike.com" ...                           │
│                                                                  │
│                    ─────────────────                             │
│                                                                  │
│                    Recent campaigns                              │
│                    [Nike] [Adidas] ...                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Workspace** (with sidebars):
```
┌──────────────┬─────────────────────┬──────────────┬──────────────┐
│ Left Sidebar │    Main Content     │ File Editor  │ Chat Sidebar │
│  (Assets)    │     (Images)        │  (optional)  │              │
│  resizable   │                     │  resizable   │  resizable   │
│  200-480px   │      flex-1         │  300-600px   │  200-480px   │
└──────────────┴─────────────────────┴──────────────┴──────────────┘
```

**When to show Workspace:**
- `appState === 'generating'` - During content generation
- `appState === 'results'` - Viewing campaign results
- `isCreatingCampaign === true` - Creating a new campaign from sidebar
- `activeCampaignId !== null` - Any campaign is selected

### Left Sidebar (Resizable)

Now contains **two stacked sections**:

```
┌───────────────────────────────┐
│  CAMPAIGNS              [+]   │  ← Header with add button
├───────────────────────────────┤
│  ▸ Nike          ✏️ 🗑️   6   │  ← Hover shows rename/delete
│    └ 📄 research.md           │  ← Click to edit in panel
│    └ 📄 hooks.md              │
│    └ 📄 prompts.md            │
│  ▸ Adidas                 2   │  ← Collapsed, shows image count
│  ▸ Puma                   0   │
├───────────────────────────────┤
│  ASSETS                 [+]   │  ← Header with add button
├───────────────────────────────┤
│  📁 Brand Kit    ✏️ 🗑️   2   │  ← Hover shows rename/delete
│  📁 Products              3   │
│  📁 Lifestyle             1   │
├───────────────────────────────┤
│  [Upload Files]               │
└───────────────────────────────┘
```

**Interactions:**
- Click [+] to create new campaign/folder
- Click campaign row to select and view images
- Click chevron (▸) to expand/collapse files
- Double-click name OR click ✏️ to rename inline
- Click 🗑️ to delete

### File Editor Panel (Resizable)

When clicking a campaign file, a **resizable panel** opens between main content and chat:

```
┌─────────────────────────────────────────────────────────────────┐
│  research.md                              [Undo] [Redo] [×]     │
│  ● Saved just now · Nike                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  # Brand Research                                                │
│                                                                  │
│  **Brand Name:** Nike                                            │
│  **Tagline:** Just Do It                                         │
│  **Tone:** Bold, athletic, aspirational                          │
│                                                                  │
│  ## Color Palette                                                │
│  - Primary: `#111111`                                            │
│  - Secondary: `#ffffff`                                          │
│  - Accent: `#ff6b00`                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Features:
- TipTap rich text editor
- Auto-save (1 second debounce)
- Undo/Redo with TipTap history
- Dark theme styling
- Resizable panel (300-600px)
- Slide-in animation on open
- Scrollable content area
- Does NOT overlay chat sidebar

---

## Implementation Progress

### ✅ COMPLETED

#### Session 1: Foundation
- [x] Install shadcn components (sidebar, command, drawer, scroll-area, collapsible)
- [x] Update design tokens (index.css) - Studio Dark palette
- [x] Create AppLayout with custom sidebar context
- [x] Basic dark theme working

#### Session 2: Chat Migration
- [x] Create ChatSidebar component
- [x] Move chat logic from ChatBar
- [x] Implement collapse/expand with keyboard shortcuts
- [x] Mobile bottom sheet (MobileChatDrawer)

#### Session 3: Asset System
- [x] Create AssetDrawer component
- [x] Implement folder structure with collapsible tree
- [x] Add Zustand asset state (folders, files, chat messages)
- [x] @ mention picker (AssetMention with Command)
- [x] File upload UI (button placeholder)

#### Session 4: Content Editor & Auto-save
- [x] Install TipTap editor (`@tiptap/react`, `@tiptap/starter-kit`)
- [x] Create tabbed EditPanel with TipTap for Research tab
- [x] Implement auto-save with debounce (1 second)
- [x] Add undo/redo functionality (debounced history)
- [x] TipTap prose styling for dark theme
- [x] Scrollable editor content

#### Session 5: Campaign Architecture Complete ✅
- [x] Update App.tsx to use new store structure (activeCampaignId)
- [x] Update ResultsView to show active campaign images
- [x] Create FileEditorPanel component (resizable inline panel)
- [x] Update @ mention system with Cursor/Claude Code-like UX:
  - [x] Campaign files (@research, @hooks, @prompts)
  - [x] Asset folders (@Brand Kit, @Products)
  - [x] Individual asset files (@logo.png, @shoe-1.jpg)
  - [x] Keyboard navigation (↑↓ Enter Escape Tab)
  - [x] Inline filtering as you type
  - [x] Removable tag chips
- [x] Wire up file editing to store (updateFileContent)
- [x] Resizable side panels:
  - [x] Left sidebar (200-480px, persisted)
  - [x] Right chat sidebar (200-480px, persisted)
  - [x] File editor panel (300-600px, persisted)
  - [x] Drag handles with hover indicator
  - [x] Smooth resize without text selection
- [x] File editor slide-in animation

#### Session 6: File Upload & Asset Preview ✅
- [x] Create FileUpload component with drag & drop:
  - [x] Drag & drop zone with visual feedback
  - [x] Hidden file input for click-to-upload
  - [x] File type validation (images: jpg, png, gif, webp, svg)
  - [x] Multiple file selection
  - [x] Target folder selector
  - [x] File preview grid before upload
- [x] Create AssetPreview modal component:
  - [x] Full-size image preview
  - [x] Image info display (name, size)
  - [x] Download and delete actions
  - [x] Click on asset file to open preview
- [x] Add folder rename functionality:
  - [x] Rename button in hover actions
  - [x] Double-click to rename
  - [x] Inline input with Enter/Escape handling
- [x] Create MobileAssetsDrawer for mobile view:
  - [x] Full-height drawer with same content as AssetDrawer
  - [x] Floating button in EmptyState and ResultsView
  - [x] Toggle via sidebar context

#### Session 7: Campaign UX & Landing Page ✅
- [x] Fix campaign collapsible accordion:
  - [x] Separate chevron toggle from campaign select
  - [x] Click chevron to expand/collapse files
  - [x] Click campaign row to select and view
- [x] Add "+" button in Campaigns header to create new campaign
- [x] Add campaign rename functionality:
  - [x] Pencil icon on hover
  - [x] Double-click to rename
  - [x] Inline input with Enter/Escape handling
  - [x] Store: `renameCampaign(id, name)`
- [x] New campaign creation flow:
  - [x] Store: `isCreatingCampaign` state
  - [x] "New Campaign" highlighted in sidebar when creating
  - [x] Shows EmptyState with focused input
  - [x] Auto-resets after generation completes
- [x] Landing page vs Workspace mode:
  - [x] Landing page: Clean, no sidebars (just prompt input)
  - [x] Workspace: Full layout with sidebars
  - [x] Sidebars appear when: generating, results, creating campaign, or active campaign
  - [x] Mobile floating buttons only in workspace mode
- [x] Recent campaigns in EmptyState now from actual store data

---

## Completed: Phase 3 - Polish & QA ✅

- [x] Gradient mesh background (EmptyState) - Animated floating blobs
- [x] Connected dots progress (GeneratingView) - Animated lines, checkmarks, glow effects
- [x] Button micro-interactions (scale on press, glow transitions)
- [x] Cross-browser compatibility (prefers-reduced-motion, backdrop-blur fallback)
- [x] Edge case handling (empty states with icons, skeleton loading)
- [x] ImageCard enhancements (hover zoom, lift effect, better action buttons)

---

## Frontend Architecture (For Backend Engineers)

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| State | Zustand (single store) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Editor | TipTap (rich text) |
| Icons | Lucide React |

### Component Hierarchy

```
App.tsx
├── AppLayout (layout/AppLayout.tsx)
│   ├── LeftSidebar (campaigns + assets tree)
│   │   └── AssetDrawer.tsx
│   ├── MainContent
│   │   ├── EmptyState.tsx (landing page)
│   │   ├── GeneratingView.tsx (progress UI)
│   │   └── ResultsView.tsx (image grid)
│   │       └── ImageCard.tsx
│   ├── FileEditorPanel (optional, resizable)
│   │   └── FileEditor.tsx (TipTap editor)
│   ├── RightSidebar
│   │   └── ChatSidebar.tsx
│   ├── MobileChatDrawer.tsx
│   └── MobileAssetsDrawer.tsx
```

### Data Types (TypeScript Interfaces)

```typescript
// ================== CAMPAIGNS ==================

type AppState = 'empty' | 'generating' | 'results'
type GeneratingPhase = 'research' | 'hooks' | 'visuals' | 'images'
type CampaignFileType = 'research' | 'hooks' | 'prompts'

interface Campaign {
  id: string                    // Unique identifier
  name: string                  // Display name (e.g., "Nike")
  createdAt: Date
  files: CampaignFile[]         // Always 3 files: research, hooks, prompts
  images: GeneratedImage[]      // Generated ad images (typically 6)
}

interface CampaignFile {
  type: CampaignFileType        // 'research' | 'hooks' | 'prompts'
  name: string                  // Display name (e.g., "research.md")
  content: string               // Markdown content
  lastModified: Date
}

interface GeneratedImage {
  id: number
  url: string                   // Image URL (can be CDN or blob storage)
  prompt: string                // The prompt used to generate this image
}

// ================== ASSETS ==================

interface AssetFolder {
  id: string
  name: string                  // e.g., "Brand Kit", "Products"
  files: AssetFile[]
  createdAt: Date
}

interface AssetFile {
  id: string
  name: string                  // e.g., "logo.png"
  url: string                   // File URL
  type: 'image' | 'document' | 'other'
  folderId: string
  thumbnailUrl?: string
  size?: number                 // Bytes
  createdAt: Date
}

// ================== CHAT ==================

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  fileRefs?: CampaignFileType[] // Referenced campaign files (@research, @hooks)
  assetRefs?: string[]          // Referenced asset folder IDs (@Brand Kit)
}

// ================== GENERATION REQUEST ==================

// What the frontend sends to start generation
interface GenerationRequest {
  prompt: string                // User input (URL or description)
  assetRefs?: string[]          // Asset folder IDs to include as context
}

// ================== GENERATION RESPONSE (SSE/WebSocket) ==================

// Backend should stream these events during generation
interface GenerationEvent {
  type: 'phase_update' | 'research_complete' | 'hooks_complete' |
        'prompts_complete' | 'image_complete' | 'complete' | 'error'
  phase?: GeneratingPhase
  data?: ResearchData | HooksData | PromptsData | ImageData | Campaign
  error?: string
}

interface ResearchData {
  brandName: string
  tagline: string
  tone: string
  colors: string[]              // Hex colors
  targetAudience: string
  notes: string
  markdownContent: string       // Full research.md content
}

interface HooksData {
  hooks: {
    type: string                // e.g., "Stat/Data Hook"
    headline: string
    body: string
    cta: string
  }[]
  markdownContent: string       // Full hooks.md content
}

interface PromptsData {
  prompts: {
    hookIndex: number
    prompt: string              // Image generation prompt
  }[]
  markdownContent: string       // Full prompts.md content
}

interface ImageData {
  index: number                 // 0-5
  url: string
  prompt: string
}
```

### API Contract (Required Endpoints)

#### 1. Start Generation
```
POST /api/generate
Content-Type: application/json

Request:
{
  "prompt": "nike.com - focus on sustainability",
  "assetRefs": ["folder-1"]  // Optional asset context
}

Response:
{
  "sessionId": "gen-123",
  "streamUrl": "/api/generate/gen-123/stream"  // SSE endpoint
}
```

#### 2. Generation Stream (SSE or WebSocket)
```
GET /api/generate/{sessionId}/stream
Accept: text/event-stream

Events:
data: {"type": "phase_update", "phase": "research"}
data: {"type": "research_complete", "data": {...}}
data: {"type": "phase_update", "phase": "hooks"}
data: {"type": "hooks_complete", "data": {...}}
data: {"type": "phase_update", "phase": "visuals"}
data: {"type": "prompts_complete", "data": {...}}
data: {"type": "phase_update", "phase": "images"}
data: {"type": "image_complete", "data": {"index": 0, "url": "...", "prompt": "..."}}
data: {"type": "image_complete", "data": {"index": 1, "url": "...", "prompt": "..."}}
... (6 images total)
data: {"type": "complete", "data": <full Campaign object>}
```

#### 3. Campaigns CRUD
```
GET    /api/campaigns              → Campaign[]
POST   /api/campaigns              → Campaign (create)
GET    /api/campaigns/{id}         → Campaign
PUT    /api/campaigns/{id}         → Campaign (update name)
DELETE /api/campaigns/{id}         → void

PUT    /api/campaigns/{id}/files/{type}  → CampaignFile
Body: { "content": "markdown..." }
```

#### 4. Assets CRUD
```
GET    /api/assets/folders         → AssetFolder[]
POST   /api/assets/folders         → AssetFolder
PUT    /api/assets/folders/{id}    → AssetFolder (rename)
DELETE /api/assets/folders/{id}    → void

POST   /api/assets/folders/{id}/files  → AssetFile (upload)
Content-Type: multipart/form-data

DELETE /api/assets/files/{id}      → void
```

#### 5. Chat
```
POST /api/chat
{
  "campaignId": "campaign-123",
  "message": "Make the hooks more urgent",
  "fileRefs": ["hooks"],
  "assetRefs": ["folder-1"]
}

Response (SSE stream):
data: {"type": "token", "content": "I'll "}
data: {"type": "token", "content": "update "}
...
data: {"type": "file_update", "fileType": "hooks", "content": "..."}
data: {"type": "complete"}
```

### State Management (Zustand Store)

The frontend uses a single Zustand store at `src/store/index.ts`:

```typescript
interface Store {
  // === App State ===
  appState: AppState                    // 'empty' | 'generating' | 'results'

  // === Campaigns ===
  campaigns: Campaign[]
  activeCampaignId: string | null
  isCreatingCampaign: boolean

  // === File Editor ===
  activeFileType: CampaignFileType | null  // Which file is open in editor

  // === Generation ===
  generatingPhase: GeneratingPhase
  prompt: string

  // === Chat ===
  chatMessages: ChatMessage[]

  // === Assets ===
  assetFolders: AssetFolder[]
  selectedFolderId: string | null
}
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORE                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ campaigns│  │  chat    │  │  assets  │  │ appState │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (TBD)                             │
│  • REST endpoints for CRUD                                       │
│  • SSE/WebSocket for generation streaming                        │
│  • File upload for assets                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                   │
│  • Campaign persistence (DB)                                     │
│  • LLM orchestration (research → hooks → prompts)               │
│  • Image generation (DALL-E, Midjourney, etc.)                  │
│  • Asset storage (S3, R2, etc.)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

| Frontend Location | Backend Requirement |
|------------------|---------------------|
| `EmptyState.tsx` → `startGeneration()` | POST /api/generate + SSE stream |
| `GeneratingView.tsx` | Consume SSE events, update phase/progress |
| `ChatSidebar.tsx` → `addChatMessage()` | POST /api/chat + SSE stream |
| `FileEditor.tsx` → `updateFileContent()` | PUT /api/campaigns/{id}/files/{type} |
| `AssetDrawer.tsx` → folder/file CRUD | /api/assets/* endpoints |
| `FileUpload.tsx` | POST multipart/form-data |

### Generation Flow (Detailed)

```
1. User enters "nike.com" → clicks Create
   └─ Frontend: setAppState('generating'), startGeneration()
   └─ Backend:  POST /api/generate { prompt: "nike.com" }

2. Backend starts SSE stream
   └─ Event: { type: "phase_update", phase: "research" }
   └─ Frontend: setGeneratingPhase('research')

3. Backend completes research (scrapes site, analyzes brand)
   └─ Event: { type: "research_complete", data: { tagline, tone, colors... } }
   └─ Frontend: Display research preview card

4. Backend generates hooks
   └─ Event: { type: "phase_update", phase: "hooks" }
   └─ Event: { type: "hooks_complete", data: { hooks: [...] } }

5. Backend generates image prompts
   └─ Event: { type: "phase_update", phase: "visuals" }
   └─ Event: { type: "prompts_complete", data: { prompts: [...] } }

6. Backend generates images (parallel or sequential)
   └─ Event: { type: "phase_update", phase: "images" }
   └─ Event: { type: "image_complete", data: { index: 0, url: "..." } }
   └─ Event: { type: "image_complete", data: { index: 1, url: "..." } }
   ... (repeat for 6 images)

7. Generation complete
   └─ Event: { type: "complete", data: <Campaign> }
   └─ Frontend: setAppState('results'), add campaign to store
```

### File Content Formats

**research.md** (parsed by backend for context):
```markdown
# Brand Research

**Brand Name:** Nike
**Tagline:** Just Do It
**Tone:** Bold, athletic, aspirational

## Color Palette
- Primary: `#111111`
- Secondary: `#ffffff`
- Accent: `#ff6b00`

## Target Audience
Athletes, fitness enthusiasts...

## Notes
[Free-form notes]
```

**hooks.md** (6 ad hooks):
```markdown
# Ad Hooks for Nike

## 1. Stat/Data Hook
**Headline:** 847 athletes switched to Nike Air
[Body copy]
*CTA: See the stats*

---

## 2. Story/Result Hook
...
```

**prompts.md** (image generation prompts):
```markdown
# Image Prompts for Nike

## Image 1 - Stat/Data Visual
\`\`\`
Soft brutalism clay render, athletic scene...
\`\`\`

## Image 2 - Story/Result Visual
...
```

---

## Files Structure (Current)

### Created/Modified ✅

```
prototype/src/
├── store/
│   └── index.ts              ✅ Campaign-based store (complete)
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx     ✅ Four-panel resizable layout
│   ├── chat/
│   │   ├── ChatSidebar.tsx   ✅ Right sidebar chat + mentions
│   │   └── MobileChatDrawer.tsx ✅ Mobile bottom sheet
│   ├── assets/
│   │   ├── index.ts          ✅ Assets exports
│   │   ├── AssetDrawer.tsx   ✅ Campaigns + Assets tree + rename
│   │   ├── AssetPreview.tsx  ✅ Modal for asset preview
│   │   ├── FileUpload.tsx    ✅ Drag & drop upload dialog
│   │   └── MobileAssetsDrawer.tsx ✅ Mobile assets overlay
│   ├── mentions/
│   │   └── AssetMention.tsx  ✅ Full @ mention system
│   ├── editor/
│   │   ├── index.ts          ✅ Editor exports
│   │   ├── ContentEditor.tsx ✅ Full-page TipTap editor
│   │   └── FileEditor.tsx    ✅ Resizable panel editor
│   ├── ResultsView.tsx       ✅ Campaign images grid
│   ├── ImageCard.tsx         ✅ Hover glow effects
│   └── EmptyState.tsx        ✅ Dark theme styling
├── index.css                 ✅ Studio Dark + TipTap styles
└── App.tsx                   ✅ Campaign-based routing
```

---

## Store Schema

```typescript
// Campaign Types
interface Campaign {
  id: string
  name: string
  createdAt: Date
  files: CampaignFile[]
  images: GeneratedImage[]
}

interface CampaignFile {
  type: 'research' | 'hooks' | 'prompts'
  name: string
  content: string  // Markdown content
  lastModified: Date
}

// Store State
interface Store {
  // App
  appState: 'empty' | 'generating' | 'results'

  // Campaigns
  campaigns: Campaign[]
  activeCampaignId: string | null
  isCreatingCampaign: boolean
  activeFileType: CampaignFileType | null
  getActiveCampaign(): Campaign | null
  getActiveFileContent(): string

  // Actions
  addCampaign(name: string): string
  removeCampaign(id: string): void
  renameCampaign(id: string, name: string): void
  updateFileContent(type, content): void
  setActiveCampaignId(id): void
  setActiveFileType(type): void
  setIsCreatingCampaign(creating: boolean): void

  // Assets
  assetFolders: AssetFolder[]
  addFolder(name): void
  removeFolder(id): void
  renameFolder(id, name): void
  addFileToFolder(folderId, file): void
  removeFile(fileId): void

  // Chat
  chatMessages: ChatMessage[]
  addChatMessage(message): void
}
```

---

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Theme** | Studio Dark | Makes images hero, signals creative tool |
| **Layout modes** | Landing page vs Workspace | Clean onboarding, full workspace after |
| **Content storage** | Campaign files (markdown) | Persistence, simplicity, flexibility |
| **Editor** | TipTap (WYSIWYG) | Non-technical users, familiar UX |
| **File types** | research.md, hooks.md, prompts.md | Clear separation, easy to reference |
| **Content reference** | @ mentions in chat | Familiar pattern (Cursor/Claude Code style) |
| **Left sidebar** | Campaigns + Assets stacked | Clear hierarchy, easy navigation |
| **File editing** | Resizable inline panel | Context preserved, chat visible |
| **Saving** | Auto-save with undo | Reduces friction, prevents data loss |
| **Panel sizing** | Resizable + persisted | User preference, professional feel |
| **Campaign CRUD** | Inline rename, + button, trash | Quick actions without modals |

---

## Quick Start

```bash
cd /Users/chakra/Documents/Agents/creative_agent/prototype
npm install
npm run dev
```

**Keyboard Shortcuts:**
- `Cmd+[` - Toggle left sidebar (Assets/Campaigns)
- `Cmd+]` - Toggle right sidebar (Chat)

**Next Steps for Backend:**
1. Implement campaign generation pipeline (LLM + image gen)
2. Set up SSE/WebSocket streaming for real-time updates
3. Connect asset storage (S3/R2)
4. Wire up REST endpoints for CRUD operations

---

*Last updated: January 27, 2026 - Frontend Complete, Ready for Backend Integration*
