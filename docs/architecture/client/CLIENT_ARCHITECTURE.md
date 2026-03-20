# Client Architecture

> Part of [Architecture Documentation](../INDEX.md) | **Directory:** `client/src/`

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 19.2.0 | UI framework |
| Zustand | 5.0.10 | State management |
| Tailwind CSS | 4.1.18 | Styling |
| Radix UI | latest | Primitives (dialog, tooltip, scroll-area, collapsible) |
| TipTap | 3.17.1 | Rich text editor (file editing) |
| Clerk | 5.59.6 | Auth (optional in dev) |
| Lucide React | 0.563.0 | Icons |
| Vite | latest | Build/dev server |

---

## App Entry & Routing

**`main.tsx`** (26 lines) — Renders `<App />` into DOM. Wraps with `StrictMode` in dev.

**`App.tsx`** (336 lines) — The root component. No router library — uses a simple two-state model:

```
appState === 'landing'   →  EmptyState (prompt input + examples)
appState === 'workspace'  →  AppLayout (3-column workspace)
```

### Auth Gating

```
IS_AUTH_ENABLED?
  ├── YES → ClerkProvider → AuthenticatedApp → wait for Clerk load → connect WS with JWT
  └── NO  → DevModeApp → connect WS immediately (no auth)
```

- `IS_AUTH_ENABLED` = `!!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`
- Token getter stored in a React ref (`stableTokenGetter`) to survive Clerk state updates
- Passed to `setTokenGetter()` before WebSocket connects

### Data Loading (on mount)

```typescript
// App.tsx — loadData()
1. campaignsApi.list()  +  assetsApi.listFolders()     // parallel
2. For each folder: assetsApi.getFiles(folder.id)        // fetch folder files
3. For each campaign: campaignsApi.get(id)               // full details + messages
4. store.setCampaigns(fullCampaigns)                     // flushes pending buffers
5. Exclude recovering campaign from bulk message load
6. store.setChatMessages(messageMap)                      // preserves generating campaign
7. store.setAssetFolders(foldersWithFiles)
```

After data loads, two additional effects run:
1. **Pending prompt restore** — if a prompt was saved to `sessionStorage` before Clerk auth redirect, restore it and trigger generation
2. **Auto-navigate** — if user has campaigns and is on landing, navigate to workspace showing the most recent campaign

Campaigns in `generating` status are excluded from bulk message load to prevent overwriting live recovery state.

### Recovery (on mount)

```
checkForRecovery() — runs after data loads
  │
  ├── Guard: skip if generatingCampaignId already set (WS recovery active)
  │
  ├── Find campaigns with status='generating' (most recent first)
  │
  └── For the most recent generating campaign:
      │
      ├── campaignsApi.getStatus(id)
      │
      ├── Agent RUNNING (isAgentRunning + hasEventBuffer + sessionId):
      │   1. Save session to localStorage (only if none exists)
      │   2. setActiveCampaignId + setAppState('workspace')
      │   3. WS auto-connects → handleConnected() → subscribes
      │
      ├── Agent STOPPED:
      │   1. campaignsApi.recover(id) → D1 data sync (checks existing images/files/messages)
      │   2. If data found → mark complete, update store with campaign + messages
      │   3. If no data → mark campaign 'incomplete' (local + API)
      │
      └── Error → mark 'incomplete'
```

Session tracked in `localStorage('creative-agent:activeSession')` with `{ sessionId, prompt, campaignId, messageId, startedAt }`.

---

## Component Tree

```
App.tsx (336 lines)
├── [landing]  EmptyState (225 lines)
│                ├── LandingHeader (51 lines — logo + sign-in)
│                │     └── UserMenu (40 lines — Clerk user button)
│                ├── SignIn (43 lines — Clerk sign-in modal)
│                ├── Prompt input with connection status indicator
│                └── Example campaign cards
│                    └── On submit: requireAuth() → generate() or save to sessionStorage
│
└── [workspace] AppLayout (404 lines — 3-column resizable layout)
                  │
                  ├── LeftSidebar ── AssetDrawer (670 lines)
                  │                    ├── Folder tree (CRUD)
                  │                    ├── AssetPreview (149 lines — thumbnails)
                  │                    └── FileUpload (357 lines — drag-drop upload)
                  │
                  ├── Main ── ResultsView (214 lines)
                  │             ├── Image grid (ImageCard × N)
                  │             │   └── ImageCard (148 lines — AuthImage + checkbox + download)
                  │             ├── Skeleton cards (while generating)
                  │             └── ImageLightbox (162 lines — full-screen viewer)
                  │
                  ├── FileEditorPanel (286 lines — TipTap rich text, below main)
                  │     ├── (exported as both `FileEditorPanel` and `FileEditor` alias for backwards compat)
                  │     └── PromptsViewer (178 lines — structured prompts.json viewer)
                  │
                  └── RightSidebar ── ChatSidebar (91 lines)
                                        ├── ChatMessage list (89 lines per message)
                                        │     ├── User messages: plain content + refs
                                        │     └── Assistant messages: blocks[] + trailing content
                                        │           └── BlockRenderer (32 lines — dispatches to block type)
                                        │                 ├── ThinkingBlock (185 lines — phases, tools, image counter)
                                        │                 ├── TextBlock (17 lines — streaming content)
                                        │                 └── StatusBlock (34 lines — info/success/error)
                                        ├── MarkdownContent (129 lines — styled markdown renderer)
                                        ├── ChatInput (144 lines)
                                        │     ├── ImageChip (100 lines — selected image pill)
                                        │     └── AssetMention (473 lines — @-mention asset picker + inline chips)
                                        └── AuthImage (65 lines — authenticated <img> wrapper)
```

### Mobile Layout

Breakpoint: `md` (768px). Desktop: 3-column with resize handles. Mobile: main content only + floating drawers.

- `MobileChatDrawer` (170 lines) — slide-in chat panel
- `MobileAssetsDrawer` (42 lines) — slide-in assets panel
- Auto-opens chat drawer when `generatingCampaignId` is set

---

## Key Components

### `AppLayout.tsx` (405 lines)

3-column layout with resizable sidebars. Sidebar widths persist to localStorage. Toggle buttons collapse/expand. Provides sidebar context via `useSidebars()`.

### `EmptyState.tsx` (226 lines)

Landing page. Contains prompt input and example campaign cards. On submit, calls `generate()` from `useWebSocket`. If auth enabled, wraps submission in `requireAuth()` (opens Clerk modal first).

### `ResultsView.tsx` (215 lines)

Main workspace view. Renders image grid from active campaign. Shows skeleton cards while generating. Calls `useWebSocket.resume()` for incomplete campaigns. Header shows campaign name, file tabs, action buttons.

### `ChatMessage.tsx` (90 lines)

Renders a single user or assistant message. User messages show plain content. Assistant messages render `blocks[]` via `BlockRenderer`, plus any trailing `content` text.

### `ThinkingBlock` — Phase progress indicator

Expandable block showing generation phases. Each child is a phase step (`research`, `hooks`, `prompts`, `images`), tool usage, or status update. Shows completed image count vs expected.

### `ImageCard.tsx` (149 lines)

Single campaign image with checkbox selection, download button, and click-to-lightbox. Uses `AuthImage` for authenticated fetching.

### `AuthImage.tsx` (66 lines)

Wraps `<img>` with authenticated fetch. Fetches image via `authFetchBlob()` (adds Bearer token), creates blob URL, sets as `src`. Cleans up blob URL on unmount/src change. Required because plain `<img>` tags can't send Authorization headers.

### `FileEditorPanel.tsx` (286 lines)

TipTap rich text editor for campaign files (research, hooks, prompts). Auto-saves with 1s debounce. On close, forces immediate save. Supports undo/redo. Located at `editor/FileEditor.tsx`; exported as both `FileEditorPanel` and `FileEditor` (backwards-compat alias).

---

## File Map

```
client/src/
├── App.tsx ................... 336 lines — Root, auth gate, data loading, recovery
├── main.tsx .................. 26 lines  — React DOM entry
├── store/
│   └── index.ts .............. 1054 lines — Zustand store (see STATE_MANAGEMENT.md)
├── lib/
│   ├── api.ts ................ 438 lines  — REST API client + type transformers
│   ├── websocket-manager.ts .. 286 lines  — Singleton WS connection
│   └── auth.ts ............... 10 lines   — Clerk config + dev mode detection
├── hooks/
│   └── useWebSocket.ts ....... 469 lines  — WS message handler + actions
├── types/
│   ├── chat.ts ............... 135 lines  — Chat, Campaign, Image types
│   └── websocket.ts .......... 161 lines  — WS message type unions
├── contexts/
│   └── AuthContext.tsx ........ 87 lines   — Clerk / dev auth providers
└── components/ ............... ~5885 lines total
    ├── layout/AppLayout.tsx ... 404 lines
    ├── ResultsView.tsx ........ 214 lines
    ├── EmptyState.tsx ......... 225 lines
    ├── auth/SignIn.tsx ........ 43 lines
    ├── auth/UserMenu.tsx ...... 40 lines
    ├── chat/ChatSidebar.tsx ... 91 lines
    ├── chat/ChatMessage.tsx ... 89 lines
    ├── chat/blocks/BlockRenderer.tsx .. 32 lines
    ├── chat/blocks/StatusBlock.tsx .... 34 lines
    ├── chat/blocks/TextBlock.tsx ...... 17 lines
    ├── mentions/AssetMention.tsx ...... 473 lines
    ├── ImageCard.tsx .......... 148 lines
    ├── ImageLightbox.tsx ...... 162 lines
    ├── AuthImage.tsx .......... 65 lines
    ├── editor/FileEditor.tsx .. 286 lines  (exports FileEditorPanel + FileEditor alias)
    ├── editor/PromptsViewer.tsx  178 lines  — structured prompts.json viewer
    ├── chat/MarkdownContent.tsx  129 lines  — styled markdown renderer (react-markdown + Tailwind)
    └── ui/ .................... shadcn primitives (button, card, dialog, input, etc.)
```

---

## Vite Config

```typescript
// client/vite.config.ts
plugins: [react(), tailwindcss()]
resolve.alias: { '@': './src' }

devServer:
  port: 5173
  proxy:
    /ws   → http://localhost:3001  (WebSocket)
    /api  → http://localhost:3001
    /images, /sessions, /health → http://localhost:3001
```

In production, the client is built to `client/dist/` and served as Cloudflare Workers Static Assets from the same Worker.

---

## Key Patterns

### Optimistic Updates
Store updates immediately, API call runs in background. No rollback on failure (just console.error). Used by: `deleteCampaignAsync`, `renameCampaignAsync`, `saveFileAsync`.

### Pending Buffers
WebSocket events may arrive before `setCampaigns()` loads campaign data. `addImageToCampaign` / `updateCampaignFile` check if campaign exists — if not, buffer to `_pendingImages` / `_pendingFiles`. On `setCampaigns()`, buffered events are merged and cleared.

### Campaign ID Remapping
Initial generation uses a client-generated ID. Server ACK returns the real server ID. `ack` handler calls `replaceCampaignId(oldId, newId)` — updates campaigns array + chatMessages keys atomically.

### Token Getter Ref
`App.tsx` stores the Clerk token getter in a ref. This survives Clerk state updates and is reused on WS reconnects. Prevents the race where `Clerk.getToken` becomes undefined during re-render.

---

## See Also

- [State Management](./STATE_MANAGEMENT.md) — Full Zustand store documentation
- [WebSocket Client](./WEBSOCKET_CLIENT.md) — WS connection lifecycle, message handling, recovery
- [Auth Flow](../shared/AUTH_FLOW.md) — End-to-end Clerk integration
