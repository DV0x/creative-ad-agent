# Session 91 — Workspace state refactor + persistence

**Date:** 2026-05-02
**Branch:** `new-ui` (committed + pushed to origin)
**Commit:** `033f456` — `fix(workspace): persistent campaign state + data-driven UI dispatch`
**Staging:** ✅ deployed `f79f042a-2e5d-41e8-a3ae-360fed2ef153`
**Production:** ⏸️ unchanged. S86 → S91 will all ride the next prod deploy.

> Read the **architectural decisions** + **mental models** sections — they capture *why* the code looks the way it does. The next session should pick up from "Pending / next moves" at the bottom.

---

## TL;DR

Started as a cosmetic ask (dynamic Sage subtitle). Cascaded into discovering that workspace state didn't survive refresh, the welcome hero showed the wrong mode, and the chat composer's submit silently no-op'd after refresh. Patched it three times incrementally, the user called out the pattern ("are you patching?"), refactored properly: workspace UI + behavior now derive from `activeCampaignId` (data) instead of `isCreatingCampaign` (UI flag). Single source of truth, ~360 lines of dead code deleted, store wrapped in Zustand `persist` middleware.

The session also landed: dynamic per-brand Sage subtitle, sidebar open/closed persistence with smart defaults, a `useLocalStorageState` utility hook, the welcome hero as the only empty-state mode, the welcome bubble at every "starting" moment, and a proper data-loading state machine (`dataLoaded` + `authReady` + `selectWorkspaceReady` selector).

| Bug surface | Root cause | Fix |
|---|---|---|
| Active campaign forgotten on refresh | Zustand state was in-memory only | `persist` middleware with `partialize` allowlist |
| "Select a campaign to view images" cold empty state on refresh | `isWorkspaceEmpty` gate didn't include `!activeCampaign` | Hero is now universal "no concrete work to show" fallback |
| Welcome-bubble flicker on refresh | Loading gate didn't cover Clerk auth init window | New `selectWorkspaceReady` selector; subscribe to *value*, not getter |
| Sidebar always closed on refresh | Open/closed state was React-local, not persisted | `useLocalStorageState` hook + smart "first visit" default |
| New-campaign click + refresh = welcome bubble disappears | `isCreatingCampaign` not persisted, so the gate `campaigns.length === 0 \|\| isCreatingCampaign` failed | Welcome bubble derives from `!activeCampaignId` instead |
| New-campaign click + refresh = chat composer submit dies | Submit handler dispatched on `isCreatingCampaign` UI flag | Dispatch on `activeCampaignId` data shape |
| New-campaign click + refresh = composer not autofocused | Same gate as welcome bubble | Same fix |

---

## What shipped (commit `033f456`)

```
client/src/App.tsx                              |  40 +-
client/src/components/EmptyState.tsx            | 462 +++---------------
client/src/components/ResultsView.tsx           |  16 +-
client/src/components/chat/ChatSidebar.tsx      | 115 ++---
client/src/components/chat/MobileChatDrawer.tsx |  19 +-
client/src/components/layout/AppLayout.tsx      |  68 ++-
client/src/store/index.ts                       |  47 +-
client/src/hooks/useLocalStorageState.ts        |  78 ++++ (new)
8 files changed, 329 insertions(+), 513 deletions(-)
```

### Store (`src/store/index.ts`)
- Wrapped `create<Store>()` in `persist(...)` middleware with `partialize` allowlist:
  ```ts
  partialize: (state) => ({
    activeCampaignId: state.activeCampaignId,
    sourceCampaignId: state.sourceCampaignId,
    sourceCampaignName: state.sourceCampaignName,
  })
  ```
  - **`isCreatingCampaign` deliberately NOT in the allowlist.** It's a UI flag; persisting it would mean a "click new + close tab + return weeks later" flow leaves the user in stale creating mode. Components derive UI mode from `!activeCampaignId` instead, so refresh-during-creation just works.
- Added `dataLoaded`, `authReady`, plus setters.
- Exported `selectWorkspaceReady = (s) => s.authReady && s.dataLoaded` — Zustand selector, not a getter (see "Subscribe to value not getter" mental model below).
- Storage key: `creative-agent:store`.

### Loading gate (`src/App.tsx`)
- Dropped the local `useState(dataLoaded)` — now lives in the store.
- Added Clerk → store sync effect: `useEffect(() => setAuthReady(!!(isLoaded && isSignedIn)), [...])`.
- Loading gate is one line: `if (showWorkspace && !workspaceReady && !loadError) { return <Spinner /> }` where `workspaceReady = useStore(selectWorkspaceReady)`.
- Validation effect: after `dataLoaded`, drop the persisted `activeCampaignId` if its campaign no longer exists in the loaded list.

### Hero everywhere (`src/App.tsx`, `src/components/EmptyState.tsx`)
- `showWelcomeHero` gate widened to include `!activeCampaign` case.
- `EmptyState.tsx` rewritten — went from 442 lines to 113. Deleted Mode A entirely (bento grid of sample creatives, two-column hero, "Recent" section, rotating placeholder, inline composer + aspect chips, mobile floating buttons gated on `isCreatingCampaign`).
- Single rendering path: editorial welcome hero (`Welcome in, {name}. What ads are we cooking?`) + "Start a brief in chat →" arrow.
- Mobile floating buttons preserved but gated on `!activeCampaignId` (data-driven).
- Pre-auth handoff effect (`pendingGeneration`) preserved — auto-fires `generate()` when WS connects after a sign-in redirect.

### Chat sidebar (`src/components/chat/ChatSidebar.tsx`)
- Single `isStartingMoment = appState === 'workspace' && !activeCampaignId` flag drives welcome bubble visibility, autoFocus, and submit dispatch — they can't fall out of sync.
- `handleSubmit`:
  ```ts
  if (!message.content.trim()) return
  if (activeCampaignId) {
    followUp(activeCampaignId, ...)
  } else if (isConnected) {
    generate(...)  // fork context flows through automatically (generate reads sourceCampaign* from store)
  }
  ```
- `WelcomeBubble` is fork-aware: when `sourceCampaignName` is set, copy becomes `"Hi {name} — brand research from {sourceName} is already loaded. Describe the new angle..."` and skips the 3-step list.
- `EmptyHint` consolidated to one variant (`"Start creating / Type a brief below to generate ads."`) — only fires for the rare "existing campaign with no chat history" case. The fork variant moved into `WelcomeBubble` since fork mode is now part of "starting moment."

### Mobile drawer (`src/components/chat/MobileChatDrawer.tsx`)
- Same `handleSubmit` refactor as ChatSidebar.
- Header label `{!activeCampaignId ? 'New Campaign' : 'Chat'}` (was `isCreatingCampaign ? ...`).

### Sage subtitle (`src/components/layout/AppLayout.tsx`)
- `SageBadge` reads `campaigns` + `activeCampaignId` from store, computes `activeBrand`, renders subtitle as `Your creative partner for {brand}` when present, else static `Your creative partner`.
- `truncate` class + `title` tooltip handle long brand names ("Liquid Death Mountain Water" → ellipsis, full string in tooltip).

### Sidebar persistence (`src/components/layout/AppLayout.tsx`)
- `leftOpen` / `rightOpen` use the new `useLocalStorageState<boolean>` hook (synchronous read, no flicker).
- Smart defaults via an `isFirstVisit()` check: returning user (any saved width or open preference) gets both sidebars open by default; brand-new user (no saved preferences) gets chat-only.
- Widths kept the bespoke `useState(loadInitialWidth)` + manual save-on-mouseUp pattern — drag fires hundreds of `setState` per second; using the hook would write to localStorage every frame.

### `useLocalStorageState` hook (`src/hooks/useLocalStorageState.ts`)
- New utility. `useLocalStorageState<T>(key, default, options?)` reads synchronously on first render, writes on every change via `useCallback`'d setter, fails silently on storage errors.
- Variant: `useLocalStorageNumber(key, default, min, max)` for bounds-checked numeric values. (Defined but currently unused — kept for future use.)

### `ResultsView` invariant
- Replaced the old `if (!campaign) return <Select-a-campaign empty state />` with `if (!campaign) throw new Error(...)`. App.tsx routing guarantees `campaign` is non-null here; the throw documents the invariant and fails loudly if a future routing change breaks it.

---

## Architectural decisions made (locked — do NOT relitigate)

### Persistence allowlist
- ✅ `activeCampaignId` — navigation pointer, must survive refresh
- ✅ `sourceCampaignId`, `sourceCampaignName` — fork context, only meaningful while in-flight, but worth persisting so refresh-during-fork keeps the welcome bubble fork-aware. Auto-cleared by `useWebSocket.ts:505` after `generate()` fires, so they don't outlive the fork moment.
- ❌ `isCreatingCampaign` — UI click-intent flag. Persisting it would mean stale "creating" state after the user closes the tab and returns weeks later.
- ❌ `selectedAspectRatio`, sidebar widths/open — UI prefs. Sidebar open/closed uses `useLocalStorageState` (independent storage). Widths use bespoke `useState(loadInitialWidth)`.

### "Sidebar widths intentionally do not use the hook"
- Drag fires hundreds of `setState` calls per second. Using the hook would write to localStorage on every frame.
- Bespoke pattern: `useState(loadInitialWidth(...))` for init, manual `localStorage.setItem(...)` only on mouseUp.
- Comment in code spells this out so a future contributor doesn't "tidy" it.

### Hero is the only empty-state mode
- "Mode A" (big "New campaign" hero with bento grid + sample creatives + inline composer) is gone.
- Editorial welcome hero (`Welcome in, {name}. What ads are we cooking?` + "Start a brief in chat →" arrow) renders in **every** empty path.
- Chat composer in the right sidebar is the only input surface — no inline composer in the hero.

### Welcome bubble at every "starting" moment
- Old: only for 0-campaign users (`campaigns.length === 0`).
- New: any time `!activeCampaignId` while in workspace. Fires for first sign-in, every "+ New campaign" click, fork-from-existing, refresh-with-deleted-active-id.
- Fork-aware copy via `sourceCampaignName`.
- Same gate drives autoFocus and submit dispatch — single source of truth.

### `isCreatingCampaign` still exists, just doesn't drive workspace behavior
- Used only by:
  - `App.tsx` landing-page routing logic (`showLanding && isCreatingCampaign && <EmptyState />`)
  - `AssetDrawer` visual indicators (active campaign highlight, "+ new campaign" placeholder rows)
- Setting it (`setIsCreatingCampaign(true)`) still has the side effect of nulling `activeCampaignId` (store line 314). That's the only behavior coupling left.
- Workspace UI/behavior reads `activeCampaignId` directly, not `isCreatingCampaign`.

### Three-signal data-loading model (in store)
- `authReady` — Clerk has resolved AND user is signed in (or dev-mode bypass)
- `dataLoading` — an API fetch is currently in flight
- `dataLoaded` — initial campaign/asset/credits fetch has completed at least once
- `selectWorkspaceReady = (s) => s.authReady && s.dataLoaded` — exported selector, the **only** place this combination is computed. Comment in store explicitly warns against re-deriving ad-hoc at call sites.

---

## Mental models articulated this session (worth keeping)

### "Subscribe to the value, not the getter" (Zustand)

A getter on a Zustand store:
```ts
workspaceReady: () => get().authReady && get().dataLoaded
```
…and consumed via destructure:
```ts
const { workspaceReady } = useStore()
if (!workspaceReady()) { ... }
```
…**does not** re-render the component when `authReady` or `dataLoaded` flips. The component subscribes to the function reference (which never changes). The function returns the right value when called, but nothing triggers React to call it again.

Fix: write it as a selector you pass to `useStore`:
```ts
export const selectWorkspaceReady = (s) => s.authReady && s.dataLoaded
const workspaceReady = useStore(selectWorkspaceReady)
```
Now Zustand re-runs the selector on every store change and notifies React when the *result* flips. Subscribed to the answer, not the function.

**Universal rule** (applies to Jotai derivations, MobX `computed`, Redux `useSelector`, etc.): subscription happens at the boundary (the hook call), not inside the function. Read derived values via selectors, not via methods.

### "Derive UI from data, not from a UI flag"

The `isCreatingCampaign` bug class came from coupling submit dispatch to a UI flag:
```ts
if (isCreatingCampaign) generate(...)
if (activeCampaignId) followUp(...)
```
This conflates "what mode am I in?" with "what should happen on submit?" — and fails when the UI flag and the data shape disagree (e.g., after refresh).

Cleaner: derive the action from the data shape:
```ts
if (activeCampaignId) followUp(...) else generate(...)
```
The data shape (`activeCampaignId` is set or not) is the actual user intent. The UI flag is just a click signal that *causes* the data shape to change. Don't make behavior depend on the cause when it can depend on the effect.

Once you do this, the same data shape can drive *all* the related UI (welcome bubble visibility, autoFocus, mobile FAB visibility, header label) — they can't fall out of sync because they share one source.

### "Don't patch — refactor the smell" (the conversation that triggered the bigger fix)

When you find yourself adding pieces to the same conditional across multiple iterations, that's a smell:
```
if (dataLoading && showWorkspace)
→ if (showWorkspace && isLoaded && isSignedIn && !dataLoaded && !loadError)
→ if (showWorkspace && !dataLoaded && !loadError)
```
Each round adds a clause to handle a new edge case. That's whack-a-mole. Step back and ask: "what ONE concept do I want to express?" Then express it once (in this case, `selectWorkspaceReady`) and use it everywhere.

### "Defer to the proper architectural fix, but don't block on it"

URL routing (`/workspace/c/:id`, `/workspace/new`) is the architecturally correct way to make refresh remember active campaign. localStorage is a band-aid. But the band-aid solves the user's complaint today; URL routing is a bigger refactor.

Pattern: ship the band-aid + flag the proper fix as the next architectural bet. Don't pretend the band-aid is the destination.

### "Persistence is opt-in, allowlist explicitly"

Bulk-persisting state means everything that should be ephemeral (transient flags, scroll positions, focus states) silently survives refresh. Use `partialize` to make persistence an explicit allowlist. Comment the allowlist with *why* each key is in it so the next person doesn't add `selectedAspectRatio` "because it'd be nice."

---

## Verification matrix (post-S91)

| Surface | Status |
|---|---|
| Refresh on a campaign → still on it | ✅ |
| Refresh after "+ New campaign" click → welcome hero + welcome bubble + autofocus + first prompt submits | ✅ |
| Refresh after "New campaign from existing" → welcome bubble shows fork-aware copy + first prompt creates fork | ✅ |
| Refresh after deleting the active campaign → falls back to hero (validation effect drops stale ID) | ✅ |
| Sidebar toggle persists across refresh | ✅ |
| Sidebar drag → release → refresh → width preserved | ✅ |
| First-time user (no localStorage) → chat sidebar open, left sidebar closed | ✅ |
| Returning user (any saved preference) → both sidebars open by default | ✅ |
| Sage subtitle shows brand when active campaign has one, falls back when null | ✅ |
| No empty-data flicker between mount and data load | ✅ (loading spinner gates everything until `selectWorkspaceReady`) |
| Hero is "Welcome in, {name}. What ads are we cooking?" everywhere — no big-hero/bento variant anywhere | ✅ |

---

## Pending / next moves

### Architectural follow-up (priority)
- **URL routing** — `/workspace/c/:id` and `/workspace/new`. The proper end state. Removes the need for any of the `activeCampaignId`/`isCreatingCampaign` localStorage scaffolding because the URL itself is the source of truth. Estimated: medium lift (~few hours), but every state-management decision in this session would simplify after.
- **Move `isCreatingCampaign` out of the store entirely?** It now only drives landing-page routing + AssetDrawer cosmetics. Could become a derived value (`isCreatingCampaign = appState === 'landing' && !activeCampaignId`?) or live in `App.tsx` local state. Optional.

### Pending UI work (carry-overs from earlier sessions)
- Mobile parity (S88 → S91 carry): MobileChatDrawer doesn't have the Sage badge in its chrome. Mobile lightbox doesn't use the floating chrome from S89 Phase 3. Mobile toolbar lacks the editorial breadcrumb.
- Cancelled / error campaign retry card in `ResultsView` (S87+ carry).
- Skeleton math negative when regenerating one image (S87+ carry).
- Background generation indicator when navigating away mid-run.
- First-completion celebration after first campaign finishes.
- Welcome bubble dismissibility / "seen welcome" localStorage flag.
- Generation status indicator stuck during research phase (S84 carry).
- Curl-bypass tests for top-up gate (S84 carry).

### Operational
- **Production deploy** — first prod cut since S85. S86 → S91 will all ride together. Run via:
  ```bash
  . ~/.nvm/nvm.sh && nvm use 20
  cd client && npm run build:production
  docker logout registry.cloudflare.com
  docker builder prune -af
  cd ../cloudflare && npx wrangler deploy --env production
  ```
- **Disk space** — APFS corruption risk from S89 still real. Free ≥30GB before next dev run.

### Architecture docs (S85 carry — still owed)
- `docs/architecture/ONBOARDING_FLOW.md` — should now also document S88 sidebar + S89 chat + S90 polish + S91 state model.
- `docs/architecture/PAYMENT_FLOW.md`.
- `docs/architecture/STREAMING_PIPELINE.md`.

---

## Code map (post-S91 — what lives where)

```
client/src/store/index.ts
  ├ persist middleware (allowlist: activeCampaignId, sourceCampaignId, sourceCampaignName)
  ├ dataLoaded, authReady state + setters
  └ selectWorkspaceReady selector (exported separately, not a method)

client/src/hooks/useLocalStorageState.ts (NEW, 78 lines)
  ├ useLocalStorageState<T>(key, default, options?)
  └ useLocalStorageNumber(key, default, min, max)

client/src/App.tsx
  ├ Clerk → store auth sync effect
  ├ Loading gate via selectWorkspaceReady
  ├ Validation effect — drops stale persisted activeCampaignId if campaign deleted
  └ showWelcomeHero gate includes !activeCampaign

client/src/components/EmptyState.tsx (442 → 113 lines)
  ├ Single rendering path: welcome hero + arrow → chat
  ├ Mobile FABs gated on !activeCampaignId
  └ Pre-auth handoff effect (pendingGeneration → auto-generate after sign-in)

client/src/components/chat/ChatSidebar.tsx
  ├ isStartingMoment = appState === 'workspace' && !activeCampaignId
  │   ├ drives WelcomeBubble visibility
  │   ├ drives composer autoFocus
  │   └ drives submit dispatch
  ├ WelcomeBubble — fork-aware via sourceCampaignName
  ├ EmptyHint — single variant (rare "existing campaign with no chat" case)
  └ handleSubmit — dispatches on activeCampaignId only

client/src/components/chat/MobileChatDrawer.tsx
  ├ Same handleSubmit dispatch as ChatSidebar
  └ Header label gated on !activeCampaignId

client/src/components/layout/AppLayout.tsx
  ├ leftOpen, rightOpen via useLocalStorageState
  ├ leftWidth, rightWidth, editorWidth: useState + manual save-on-mouseUp (intentional)
  ├ isFirstVisit() → smart sidebar default
  └ SageBadge with dynamic per-brand subtitle

client/src/components/ResultsView.tsx
  └ Throws if rendered without active campaign (App.tsx routing guarantees this)
```

---

## Key URLs + state at session end

- **Staging:** https://creative-agent-staging.alphasapien17.workers.dev
- **Staging version:** `f79f042a-2e5d-41e8-a3ae-360fed2ef153`
- **Production:** https://creativemachines.xyz (still pre-S86)
- **Branch:** `new-ui` @ `033f456` (pushed to `origin/new-ui`)
- **GitHub:** https://github.com/DV0x/creative-ad-agent/tree/new-ui

### Recent commits on `new-ui`
```
033f456 fix(workspace): persistent campaign state + data-driven UI dispatch  ← S91
d645e55 docs: session 90 — chat panel polish handover                        ← S90
6e83728 feat(workspace): drop agent bubble + timestamps, add Sage tagline    ← S90
4d8cd3a docs: session 89 — Phase 3+4 workspace redesign + APFS recovery     ← S89
1c7fdee feat(workspace): chat panel redesign — Sage agent identity (P4)     ← S89
5dfca69 feat(workspace): editorial canvas + lightbox redesign (P3)          ← S89
1fe65bf feat(workspace): inset editorial shell + sidebar redesign (P1-2)    ← S88
```

---

## To pick up next session

1. **Either** push the prod deploy (Run sequence above; S86→S91 ships together) **or** start the URL routing refactor (`/workspace/c/:id`, `/workspace/new`).
2. If continuing UI: tackle mobile parity (Sage badge in MobileChatDrawer, floating chrome in mobile lightbox, editorial breadcrumb in mobile toolbar).
3. If continuing state work: consider moving `isCreatingCampaign` out of the store as discussed above.
4. Walk the verification matrix once on staging before deploying to prod.

End of S91 handover.
