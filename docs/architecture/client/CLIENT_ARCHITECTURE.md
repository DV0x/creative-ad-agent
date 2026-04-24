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

**`main.tsx`** (39 lines) — Renders `<App />` into DOM. Wraps with `StrictMode` in dev.

**`App.tsx`** (461 lines) — The root component. No router library. Three path-based branches + a two-state appState for the authenticated shell:

```
pathname === '/sign-in' | '/sign-up'  →  <SignIn />  (Clerk modal route)
pathname === '/checkout/success'      →  <CheckoutSuccess />  (billing post-pay poll)
else                                  →  <AuthenticatedApp />
                                           │
                                           ├── appState === 'landing'   →  EmptyState + LandingHeader
                                           └── appState === 'workspace' →  AppLayout (3-column)
```

`appState ↔ URL` is kept in sync via `history.pushState` (`/workspace` vs `/`) + a `popstate` listener so browser back/forward work without a router.

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
1. 4-way parallel fetch:
     - campaignsApi.list()
     - assetsApi.listFolders()
     - creditsApi.get()                       // may 404 in local dev — catch → null
     - paymentsApi.getSubscription()          // default to { plan: 'free' } on error
2. setCreditBalance(balance, planBalance, topupBalance)   // billing state hydrates before UI renders
3. setSubscription(subscriptionData)
4. For each folder: assetsApi.getFiles(folder.id)
5. For each campaign: campaignsApi.get(id)    // full details + messages
6. store.setCampaigns(fullCampaigns)          // flushes pending buffers
7. Exclude the recovering campaign from bulk message load (status='generating')
8. store.setChatMessages(messageMap)          // preserves generating campaign's live state
9. store.setAssetFolders(foldersWithFiles)
```

Credit/subscription fetches use `.catch()` per-request so the whole mount doesn't fail if the billing routes are unreachable (e.g., local dev with billing disabled).

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
App.tsx (461 lines)
├── PricingModal (177 lines — mounted globally, opened from store)
├── TopupModal (122 lines — mounted globally, opened from store)
├── CheckoutSuccess (inline in App.tsx — polls subscription + credits after Dodo redirect)
│
├── [landing]  EmptyState (334 lines)
│                ├── LandingHeader (48 lines — logo + sign-in)
│                │     └── UserMenu (163 lines — Clerk user button, credit balance, upgrade triggers)
│                ├── SignIn (105 lines — Clerk sign-in route)
│                ├── Prompt input with connection status indicator
│                └── Example campaign cards
│                    └── On submit: requireAuth() → generate() or save to sessionStorage
│
└── [workspace] AppLayout (407 lines — 3-column resizable layout)
                  │
                  ├── LeftSidebar ── AssetDrawer (854 lines)
                  │                    ├── Campaign list with hover actions (rename, delete, new-from-existing)
                  │                    ├── Folder tree (CRUD)
                  │                    ├── AssetPreview (224 lines — thumbnails)
                  │                    └── FileUpload (357 lines — drag-drop upload)
                  │
                  ├── Main ── ResultsView (261 lines)
                  │             ├── Image grid (ImageCard × N)
                  │             │   └── ImageCard (153 lines — AuthImage + checkbox + download)
                  │             ├── Skeleton cards (while generating)
                  │             └── ImageLightbox (162 lines — full-screen viewer)
                  │
                  ├── FileEditorPanel (319 lines — TipTap rich text, below main)
                  │     ├── exports both `FileEditorPanel` and `FileEditor` (alias at the bottom of FileEditor.tsx)
                  │     └── PromptsViewer (178 lines — structured prompts.json viewer)
                  │
                  └── RightSidebar ── ChatSidebar (155 lines — source-aware prompt when creating from existing)
                                        ├── ChatMessage list (104 lines per message)
                                        │     ├── User messages: plain content + refs
                                        │     └── Assistant messages: blocks[] + trailing content
                                        │           └── BlockRenderer (41 lines — dispatches to block type)
                                        │                 ├── ThinkingBlock (185 lines — phases, tools, image counter)
                                        │                 ├── TextBlock (24 lines — streaming content)
                                        │                 ├── StatusBlock (34 lines — info/success/error)
                                        │                 └── BreadcrumbsIndicator (91 lines — phase progress w/ OrbitalSpinner)
                                        ├── MarkdownContent (129 lines — styled markdown renderer)
                                        ├── ChatInput (177 lines)
                                        │     ├── ImageChip (100 lines — selected image pill)
                                        │     └── AssetMention (501 lines — @-mention asset picker + inline chips)
                                        └── AuthImage (65 lines — authenticated <img> wrapper)
```

### Mobile Layout

Breakpoint: `md` (768px). Desktop: 3-column with resize handles. Mobile: main content only + floating drawers.

- `MobileChatDrawer` (171 lines) — slide-in chat panel
- `MobileAssetsDrawer` (42 lines) — slide-in assets panel
- Auto-opens chat drawer when `generatingCampaignId` is set

---

## Key Components

### `AppLayout.tsx` (407 lines)

3-column layout with resizable sidebars. Sidebar widths persist to localStorage. Toggle buttons collapse/expand. Provides sidebar context via `useSidebars()`.

### `EmptyState.tsx` (334 lines)

Landing page. Contains prompt input and example campaign cards. On submit, calls `generate()` from `useWebSocket`. If auth enabled, wraps submission in `requireAuth()` (opens Clerk modal first).

### `ResultsView.tsx` (261 lines)

Main workspace view. Renders image grid from active campaign. Shows skeleton cards while generating. Calls `useWebSocket.resume()` for incomplete campaigns. Header shows campaign name, file tabs, action buttons.

### `ChatMessage.tsx` (104 lines)

Renders a single user or assistant message. User messages show plain content. Assistant messages render `blocks[]` via `BlockRenderer`, plus any trailing `content` text.

### `ThinkingBlock` — Phase progress indicator

Expandable block showing generation phases. Each child is a phase step (`research`, `hooks`, `prompts`, `images`), tool usage, or status update. Shows completed image count vs expected.

### `BreadcrumbsIndicator.tsx` (91 lines)

Compact phase-progress indicator shown inside `ThinkingBlock`. Uses `OrbitalSpinner` (ui/orbital-spinner.tsx, 101 lines) for the live-in-flight phase pill.

### `ImageCard.tsx` (153 lines)

Single campaign image with checkbox selection, download button, and click-to-lightbox. Uses `AuthImage` for authenticated fetching.

### `AuthImage.tsx` (65 lines)

Wraps `<img>` with authenticated fetch. Fetches image via `authFetchBlob()` (adds Bearer token), creates blob URL, sets as `src`. Cleans up blob URL on unmount/src change. Required because plain `<img>` tags can't send Authorization headers.

### `FileEditorPanel.tsx` (319 lines)

TipTap rich text editor for campaign files (research, hooks, prompts). Auto-saves with 1s debounce. On close, forces immediate save. Supports undo/redo. Located at `editor/FileEditor.tsx`; exported as both `FileEditorPanel` and `FileEditor` (backwards-compat alias).

### `PricingModal.tsx` (177 lines) · `TopupModal.tsx` (122 lines)

Billing UI. Both are mounted globally at the root of `AppContent` and opened via store actions (`openPricingModal`, `openTopupModal`) from anywhere in the app (UserMenu credit-low prompt, ChatSidebar out-of-credits error, etc.). `PricingModal` drives the subscribe/upgrade flow to Dodo; `TopupModal` drives one-time credit purchases. See [BILLING.md](../shared/BILLING.md) for the full payment flow.

### `CheckoutSuccess` (defined inline in `App.tsx`)

Post-Dodo-redirect route at `/checkout/success`. Polls `paymentsApi.getSubscription()` + `creditsApi.get()` until the webhook processes the payment, then redirects to `/workspace`. Shows a "this is taking longer than usual" message after a threshold so the user knows they haven't been stranded.

---

## File Map

```
client/src/
├── App.tsx ................... 461 lines — Root, auth gate, pathname routing, data loading, recovery
├── main.tsx .................. 39 lines  — React DOM entry
├── store/
│   └── index.ts .............. 1267 lines — Zustand store (see STATE_MANAGEMENT.md)
├── lib/
│   ├── api.ts ................ 523 lines  — REST API client + type transformers (campaigns, assets, credits, payments)
│   ├── websocket-manager.ts .. 286 lines  — Singleton WS connection
│   └── auth.ts ...............   9 lines  — Clerk config + dev mode detection
├── hooks/
│   └── useWebSocket.ts ....... 597 lines  — WS message handler + actions
├── types/
│   ├── chat.ts ............... 135 lines  — Chat, Campaign, Image types
│   └── websocket.ts .......... 191 lines  — WS message type unions (incl. credits_update, text_delta)
├── contexts/
│   └── AuthContext.tsx ........ 83 lines   — Clerk / dev auth providers
└── components/ ............... 46 files total (.tsx/.ts, includes ui/ primitives)
    ├── AuthImage.tsx ...................... 65 lines
    ├── EmptyState.tsx ..................... 334 lines
    ├── ImageCard.tsx ...................... 153 lines
    ├── ImageLightbox.tsx .................. 162 lines
    ├── ResultsView.tsx .................... 261 lines
    ├── assets/
    │   ├── AssetDrawer.tsx ................ 854 lines
    │   ├── AssetPreview.tsx ............... 224 lines
    │   ├── FileUpload.tsx ................. 357 lines
    │   └── MobileAssetsDrawer.tsx .......... 42 lines
    ├── auth/
    │   ├── SignIn.tsx ..................... 105 lines
    │   └── UserMenu.tsx ................... 163 lines  — credit balance display + modal triggers
    ├── chat/
    │   ├── ChatInput.tsx .................. 177 lines
    │   ├── ChatMessage.tsx ................ 104 lines
    │   ├── ChatSidebar.tsx ................ 155 lines
    │   ├── ImageChip.tsx .................. 100 lines
    │   ├── MarkdownContent.tsx ............ 129 lines
    │   ├── MobileChatDrawer.tsx ........... 171 lines
    │   └── blocks/
    │       ├── BlockRenderer.tsx ...........  41 lines
    │       ├── BreadcrumbsIndicator.tsx ....  91 lines
    │       ├── StatusBlock.tsx .............  34 lines
    │       ├── TextBlock.tsx ...............  24 lines
    │       └── ThinkingBlock.tsx ........... 185 lines
    ├── editor/
    │   ├── FileEditor.tsx ................. 319 lines  (exports FileEditorPanel + FileEditor alias)
    │   └── PromptsViewer.tsx .............. 178 lines
    ├── layout/
    │   ├── AppLayout.tsx .................. 407 lines
    │   └── LandingHeader.tsx ...............  48 lines
    ├── mentions/
    │   └── AssetMention.tsx ............... 501 lines
    ├── pricing/
    │   ├── PricingModal.tsx ............... 177 lines  — subscribe/upgrade flow
    │   └── TopupModal.tsx ................. 122 lines  — one-time credit purchase
    └── ui/ ................................ shadcn + custom primitives
        ├── orbital-spinner.tsx ............ 101 lines  — OrbitalSpinner used by BreadcrumbsIndicator
        └── (button, card, dialog, input, scroll-area, sidebar, sheet, drawer, …)
```

> `ui/spinner-demo.tsx` (160 lines) is a dev-only demo not wired into production routing; ignore it when auditing the production component surface.

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

- [State Management](./STATE_MANAGEMENT.md) — Full Zustand store documentation (incl. billing state)
- [WebSocket Client](./WEBSOCKET_CLIENT.md) — WS connection lifecycle, message handling, recovery
- [Auth Flow](../shared/AUTH_FLOW.md) — End-to-end Clerk integration
- [Billing](../shared/BILLING.md) — Credits, subscriptions, Dodo integration, payment modals
