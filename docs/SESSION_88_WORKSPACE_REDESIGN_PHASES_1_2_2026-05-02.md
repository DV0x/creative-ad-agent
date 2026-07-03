# Session 88 — Workspace UI redesign (Phases 1–2 of 4)

**Date:** 2026-05-02
**Branch:** `new-ui` (1 commit ahead of origin, NOT pushed)
**Staging:** ✅ deployed `6362dca7-ef8f-43e9-904c-6b16f2b7201a` (verified by user end-to-end)
**Production:** ⏸️ unchanged from S87 — Phases 1+2 will ride along when we eventually ship S87 to prod
**Node version required for deploy:** **v20** (Node 23 still broken — `nvm use 20`)

> This doc is a complete handover. Read it once and you have everything to jump straight into Phase 3 next session — design link, all decisions, all open questions, all file diffs. Do NOT skip the Claude Design source material — it is the spec we are implementing.

---

## TL;DR

| Phase | What shipped | Status |
|---|---|---|
| **Research** | Identified Claude Design as the source tool. Pulled the design bundle (26MB tar/gz). Read README + chat transcripts + workspace-v2.jsx + tokens.css. Established 4-phase plan. | ✅ |
| **Phase 1: Shell** | 8px bone "desk" frame · 12px rounded floating panels · two-tone bone (sidebar bone, chat/editor bone-2) · wine-tinted hairline + soft shadow on canvas · resize handles repositioned into gap | ✅ Deployed `75aca0fc` |
| **Phase 2: Sidebar** | New campaign CTA (⌘N) · ⌘K search w/ live filter · restyled section eyebrows + mono counts · editorial credits footer (Option C) · account menu popover mirroring old UserMenu options · removed UserMenu from right header | ✅ Deployed `6362dca7` (after iteration) |
| **Phase 3: Canvas + hook tiles** | Toolbar breadcrumb · Active chip · mono meta · Working session eyebrow · hook tile chips (framework + @image-N) · 3-col grid restyle | ❌ Next session |
| **Phase 4: Chat (Sage)** | 52px header w/ Sage agent badge + breathing lime dot · ProgressMsg + AgentBubble + UserBubble + ChatPill · composer redesign w/ ref chips + aspect chips + wine send · Reference files popover | ❌ Next session |

---

## The design source — READ THIS FIRST

**Tool used:** [Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) (Anthropic Labs, launched 2026-04-17). Available in research preview for Pro/Max/Team/Enterprise. Powered by Opus 4.7 vision. Builds HTML/CSS/JS prototypes from your codebase + screenshots.

**Design bundle URL (the "handoff bundle" Claude Design exports):**
```
https://api.anthropic.com/v1/design/h/X-yMU7sOgiFd1_1xWtXWSw?open_file=workspace.html
```

**How to fetch it:** the URL serves a 26MB gzipped tar. WebFetch chokes (>10MB limit). Use:
```bash
curl -sL "https://api.anthropic.com/v1/design/h/X-yMU7sOgiFd1_1xWtXWSw?open_file=workspace.html" \
  -o /tmp/cd_bundle.gz
mkdir -p /tmp/cd_extracted && cd /tmp/cd_extracted
gunzip -k /tmp/cd_bundle.gz && tar -xf /tmp/cd_bundle
# Extracted to: creative-workspcae/{README.md, chats/, project/}
```

**Bundle contents:**
- `creative-workspcae/README.md` — handoff instructions ("read chats first, then workspace.html")
- `creative-workspcae/chats/chat1.md` — full design conversation transcript (key decisions)
- `creative-workspcae/chats/chat2.md` — empty (started new chat for the export)
- `creative-workspcae/project/workspace.html` — 54-line shell loading React + JSX
- `creative-workspcae/project/workspace-v2.jsx` — **1,224 lines, the actual design** (THIS IS THE SPEC)
- `creative-workspcae/project/design-canvas.jsx` — 789 lines, Claude Design's own canvas wrapper (NOT part of our app)
- `creative-workspcae/project/workspace-variations.jsx` — earlier iterations, ignore
- `creative-workspcae/project/tokens.css` — 283 lines, design system tokens
- `creative-workspcae/project/uploads/` — user's screenshots
- `creative-workspcae/project/assets/` — 6 sample ad images for hook tiles

**The design language is called "Inset Editorial" / "Warm Bento":**
- Outer bone "desk" frame
- Floating cards with rounded corners + 8px gaps
- No hard borders between regions
- Two-tone bone for asymmetry
- Wine-tinted hairlines instead of cold grey
- Editorial typography (Clash Display + Satoshi + JetBrains Mono accents)

**The chat transcripts capture the iterative reasoning** — read `chat1.md` for full context on why each design decision was made (esp. "what is the swash moment", "soft pass", "two-tone bone", "warm wine hairline").

---

## Decisions locked this session

| Question | Decision | Rationale |
|---|---|---|
| **Agent name** | **Sage** (chosen over Pitch / Hook / Studio / Adam) | User pick. Carries warmth + creative-herb associations that fit cream/wine palette. |
| **Credits treatment** | A · Editorial Panel (then reshaped — see iteration below) | Initial pick from prototype's 3 options. Iteration changed the *content* but kept the *position* (sidebar footer). |
| **Composer/chat bg** | A · Editorial (bone-2 panel + near-white input) | Default per design. Kept warm-neutral palette intact. |
| **Search visibility** | Always show, regardless of campaign count | Industry standard (Linear / Notion / Raycast). Trains ⌘K muscle memory. |
| **Credits semantics** | No cap, no usage bar. Just show total balance + Top up + Renews date. | Industry standard for products with stacking topups (Runway / Leonardo / Notion AI). Hard caps make sense for products with real ceilings (GitHub Actions, OpenAI plan limits) — we don't have one. |
| **"Resets" → "Renews"** | Renamed | Top-up credits never reset. "Resets" lied. "Renews" refers to billing cycle. |
| **Footer card style** | **Option C** — no bg shift, just wine-tinted hairline + indented two-line layout | Initial bone-2 card felt boxy and stuck-on. Linear/Cursor/Slack patterns suggest single-row identity at bottom. C keeps the credit count visible without the heavy card treatment. |
| **Account menu items** | Mirror the old UserMenu exactly: Upgrade/Change Plan, Buy Credits, Manage Billing (paid only), Sign out + plan/topup breakdown header | User caught my over-add of Workspace/Settings/Help that weren't in the old version. |
| **Local dev** | Skipped — staging-only testing for the session | Backend hit Node 23 issues (missing `unpipe`, `better-sqlite3` NODE_MODULE_VERSION mismatch). PricingModal/TopupModal lacked `isDevMode` guards. Reverted all the local-dev plumbing (Bucket B). |

---

## Commits to push

```
1fe65bf  feat(workspace): inset editorial shell + sidebar redesign (Phases 1-2)   ← S88 (this session)
b6d4030  docs: session 87 — combined S86 + S87 handover with welcome hero fixes   ← pre-S88
0b2cd74  fix(workspace): stop welcome hero from flickering on chat-only turns…    ← S87
d5d1311  feat(workspace): editorial welcome hero, chat-as-action-surface…         ← S86
```

`1fe65bf` is the only commit added during S88. **Not pushed to origin yet** — user wanted to commit but didn't ask for push.

---

# Part 1 — Phase 1 (Shell)

## Files changed (4)

```
M  client/src/index.css                              (+15 lines)
   — Added --color-bg-raised-2 (#F6F3EC = bone-2 two-tone)
   — Added 6 framework tag colors (--color-fw-stat/story/fomo/curiosity/callout/contrast)
   — Added cm-breathe keyframe for Phase 4 agent badge (cheap to land early)

M  client/src/components/layout/AppLayout.tsx        (~52 lines changed)
   — Wrapper conditionally gets bg-bg-raised md:p-2 md:gap-2 when in workspace
   — LeftSidebar: dropped border-r, added md:rounded-xl, kept bg-bg-raised
   — RightSidebar: dropped border-l, added md:rounded-xl, switched to bg-bg-raised-2
   — Main canvas: md:rounded-xl + md:overflow-hidden + inline boxShadow:
       '0 0 0 1px rgba(120,40,74,0.06), 0 1px 2px rgba(120,40,74,0.06)'
   — ResizeHandle repositioned: -right-0.5/-left-0.5 → -right-2/-left-2 (sits in gap)
   — ResizeHandle visual: w-0.5 centered, wine on hover (opacity-50)
   — Sidebar headers: dropped border-b, h-14 → h-13 with pt-3 (spacing-only separation)

M  client/src/components/ResultsView.tsx             (2 lines)
   — h-screen → h-full (twice) so canvas fits inside padded shell

M  client/src/components/editor/FileEditor.tsx       (10 lines)
   — h-screen → h-full + bg-bg-raised → bg-bg-raised-2 + dropped border-l + added rounded-xl
   — ResizeHandle bumped to -left-2 to match new gap convention
```

## Why this works

The wrapper's bone bg is the same as the LeftSidebar's bone bg, so they bleed together — the sidebar feels integrated with the frame. The chat panel's bone-2 is subtly darker, asymmetric on purpose. The canvas is `bg-bg-base` (the lightest cream) with a wine hairline + tiny shadow — reads like "paper on a desk." Resize handles live IN the 8px gap, not on panel edges, so the rounded corners stay crisp.

## What's untouched (per scope)

All of: store, WS handler, gate logic (S87), generation flow, store actions, Welcome hero (S86), auth, routing, payments, mobile drawers (the inset frame is `md:` only — mobile uses the existing full-screen drawer pattern).

---

# Part 2 — Phase 2 (Sidebar redesign)

## Files changed (1, heavily)

```
M  client/src/components/assets/AssetDrawer.tsx     (+388 / -54 net)
   — Added imports: useUser, useClerk, isDevMode, paymentsApi
   — Added icons: SearchIcon, MoreHorizontalIcon, ZapIcon, WalletIcon, ReceiptIcon, LogOutIcon
   — Restructured AssetDrawer return:
       NewCampaignButton + SidebarSearch + ScrollArea(Campaigns + Library) + SidebarFooter
   — CampaignsSection: searchQuery prop + matchesQuery filter + restyled eyebrow header
   — BrandGroup: replaced "{totalImages} img" → mono campaign count
   — AssetsSection: header restyled, "Assets" → "Library"
   — New components at bottom of file (~250 lines):
       NewCampaignButton, SidebarSearch, SidebarAvatar, SidebarFooter, SidebarAccountMenu
```

```
M  client/src/components/layout/AppLayout.tsx       (extra changes for Phase 2)
   — Removed `import { UserMenu }` (no longer used)
   — RightSidebar header: removed <UserMenu /> render
   — Right header now just shows toggle + "Chat" label (Phase 4 will replace with Sage badge)
```

## Sidebar structure (top → bottom)

```
┌─────────────────────────┐
│  Creative Machines  [▭] │  ← AppLayout LeftSidebar header (h-13, no border)
├─────────────────────────┤
│ [+ New campaign  ⌘N  ]  │  ← NewCampaignButton (wine primary)
│ 🔍 Search        ⌘K     │  ← SidebarSearch (bone-2 inset, focuses on ⌘K)
├─────────────────────────┤
│ ▾ CAMPAIGNS  5      +   │  ← Section eyebrow + mono filter count
│   ▸ test campaign   1   │
│     ● Hello dude        │  ← active campaign with wine dot
│       📄 Research       │
│       📄 Hooks          │
│       📄 Prompts        │
│   ▸ Gonoise        1    │
│   ▸ Bewakoof       1    │
│   ▸ Claude         2    │
│   ─── soft divider ───  │  ← border-emphasis/40 hairline
│ ▾ LIBRARY  1        +   │
│   📁 Ass            1   │
├─────────────────────────┤  ← ── wine hairline (boxShadow inset)
│ [I] invictus  PRO   ⋯   │  ← SidebarFooter (Option C — no card bg)
│     1,198.8 credits     │     identity row + indented credits row
│     Renews May 17       │
└─────────────────────────┘
```

## Component contracts (new)

### `NewCampaignButton`
- Wine primary, full-width, `⌘N` keyboard binding (calls handler directly)
- Action: `setSourceCampaign(null)` + `setIsCreatingCampaign(true)` + opens chat sidebar
- Behaves identically to the old "+ New brand" button — just promoted to a primary CTA

### `SidebarSearch`
- Controlled input, `⌘K` focuses
- Bone-2 inset bg, wine focus border at 50% opacity
- Filter is plumbed through `<CampaignsSection searchQuery={…} />` prop
- Match logic: brand name OR formatted campaign name (case-insensitive substring)

### `SidebarAvatar({ initial, size })`
- Wine gradient circle (`linear-gradient(135deg, var(--color-accent), var(--color-accent-press))`)
- Renders the user's first initial in Clash Display
- Default size 30, used at 28 in footer

### `SidebarFooter` (Option C — final form)
- **No** bg shift, **no** card. Inherits sidebar bone bg.
- Wine-tinted hairline above: `boxShadow: 'inset 0 1px 0 rgba(120, 40, 74, 0.08)'`
- Row 1: `[avatar] firstName [PRO badge]                 [⋯]`
- Row 2 (indented `ml-[38px]`): `1,198.8 credits           Top up →`
- Row 3 (small mono, indented): `Renews May 17`
- Free users: row 2 says "Upgrade →" instead of "Top up →"; row 3 hidden

### `SidebarAccountMenu` (popover)
- Opens from `⋯` button, positioned `absolute right-3 bottom-[calc(100%-12px)]`
- `bg-bg-base` + `border-border` + `shadow-xl` + `rounded-lg`
- Closes on outside click + Esc
- **Mirror of old UserMenu options** (this was a correction — initial version had wrong items):
  - Header: full name + email
  - Credits breakdown (only if `planBalance!=null && topupBalance!=null`):
    - `X.X plan` + "resets {date}"
    - `X.X top-up` + "never expire"
  - Actions:
    - **Upgrade Plan** (free) / **Change Plan** (paid) → `openPricingModal()`
    - **Buy Credits** → `openTopupModal()`
    - **Manage Billing** (paid only) → `paymentsApi.portal()` → opens portal URL in new tab
  - Footer: **Sign out** → `useClerk().signOut()`

## Key iteration that happened mid-Phase-2

User caught **two important issues** during Phase 2 review (worth preserving the reasoning):

### Iteration 1 — Account menu options were wrong
**My initial version** had: Plan / **Workspace** / Settings / Help / Sign out.
**The old UserMenu** had: Upgrade/Change Plan / **Buy Credits** / Manage Billing / Sign out.
**User said:** "keep the same options that we have in the previous version, right now im seeing different options why?"
**Fix:** Removed Workspace/Settings/Help (never existed), added Buy Credits + Manage Billing + plan/topup breakdown header.
**Lesson for Phase 4 (chat):** when the design prototype shows menu items / actions that aren't in the real product, **don't add them** — match what's wired today.

### Iteration 2 — Credits math was wrong + footer was boxy
**Bug:** Initial code showed `creditBalance / planCap÷10` which produced "1198.8 / 90" (nonsense).
**User clarified the semantics:** *"there's no cap for any credits. the bar is just usage/total credits they have (both plan and topup)"*
**Industry research:** Products with stacking topups (Runway / Leonardo / Notion AI / Slack) almost universally show **just a balance count, no usage bar**. Bars only make sense when there's a hard cap (GitHub Actions, OpenAI). Our product has no real ceiling.
**Decision:** Drop the bar entirely. Show flat balance comma-formatted (`1,198.8 credits`).
**Footer card iteration:** initial `bg-bg-raised-2` card felt stuck-on. Looked at industry patterns:
- Linear: single-line identity row at bottom, no card
- Cursor: just an avatar circle
- Slack: avatar + name + status
- ChatGPT: avatar + name + small plan badge
**Decision (Option C):** drop the bg shift, drop the card boundary, just keep the wine hairline above. Indented two-line layout under the avatar.

---

# Part 3 — Local dev plumbing (Bucket B — REVERTED)

We initially tried to test in local dev (~30 sec workflow). Hit three issues, all reverted:

1. **Clerk env var commented out** in `client/.env` — restored.
2. **PricingModal + TopupModal** call `useUser()` unconditionally → throws when Clerk env unset. Added `isDevMode() ? null : useUser().user` guards. **Reverted** — these modals never render in dev mode anyway.
3. **Backend Node 23 issues** — `Cannot find module 'unpipe'` (fixed via `npm install`), then `better-sqlite3 NODE_MODULE_VERSION 115 vs 131` (fixed via `npm rebuild better-sqlite3`). Backend started. But local API proxy returned HTML instead of JSON for `/api/folders` (Vite proxy or routing issue) — at this point user said "lets do it staging only".

**Lesson:** for pure UI work, staging deploy + Chrome MCP for screenshot-driven feedback was actually faster than fighting local dev. Total: ~6 min build+deploy per iteration vs ~30 sec restart but with broken auth/data paths.

**Standard staging deploy sequence (CLAUDE.md):**
```bash
. ~/.nvm/nvm.sh && nvm use 20  # Node 23 still broken
cd client && npm run build:staging
docker logout registry.cloudflare.com
docker builder prune -af
cd ../cloudflare && npx wrangler deploy --env staging
```
~6 min total. We deployed ~6 times this session — all from the same shell session by sourcing nvm at the top of each command.

**Note on Cloudflare API flake:** one wrangler deploy errored with `Unauthorized`. Retry succeeded. Doesn't indicate credential rot — transient API issue.

---

# Part 4 — Verification matrix

| Path | Pre-S88 | Post-S88 | Status |
|---|---|---|---|
| Workspace shell on desktop | Edge-to-edge panels w/ hard borders | 8px bone frame + 12px rounded floating cards + 8px gaps | ✅ verified |
| Two-tone bone | All panels same bone | Sidebar bone, chat/editor bone-2 | ✅ verified |
| Canvas hairline | Cold grey | Wine-tinted (rgba(120,40,74,0.06)) | ✅ verified |
| Resize handles | On panel edges | In the 8px gap, wine on hover | ✅ verified |
| Mobile workspace | Full-screen drawers | Unchanged (inset frame is `md:` only) | ✅ unchanged |
| Landing/auth pages | Standard layout | Unchanged (`isWorkspace ? padded : standard`) | ✅ unchanged |
| New campaign CTA | Tiny "+" icon next to section header | Wine primary button at top, ⌘N shortcut | ✅ verified |
| Search | None | ⌘K focuses, live filters campaign list | ✅ verified |
| Credits display | In right-sidebar header (UserMenu CreditBadge) | In left-sidebar footer (Option C) — flat balance, no fraction | ✅ verified |
| Account menu | Clerk UserButton + CreditBadge dropdown | Custom popover w/ same options + Clerk signOut | ✅ verified |
| Right-sidebar header | Toggle + "Chat" + UserMenu | Toggle + "Chat" only (Phase 4 fills it) | ✅ verified, **bare on purpose** |
| FileEditor panel | Edge-to-edge bone w/ hard border | bone-2 + rounded-xl + h-full | ✅ verified |
| Welcome hero (S86) | Editorial poster | Unchanged | ✅ no regression |
| Generation flow / streaming (S85+S87) | Working | Unchanged | ✅ no regression |
| Sage agent badge / chat bubbles | — | NOT YET (Phase 4) | ⏳ |
| Hook tile redesign | Old grid | NOT YET (Phase 3) | ⏳ |

---

# Part 5 — Phase 3 implementation plan (next session)

**Goal:** redesign the canvas (`ResultsView.tsx`) to match `workspace-v2.jsx` lines 537–644.

## What changes in ResultsView

```
┌─────────────────────────────────────────────────────┐
│ GONOISE › Photorealistic / Targeting [Active]       │  ← toolbar w/ breadcrumb + chip
│            ✨ 6 hooks generated · last edited 02:41 │     mono meta on right + sliders + ⋯
├─────────────────────────────────────────────────────┤
│ ● Working session                                   │  ← eyebrow + caption
│ Six hooks across the framework grid…    [All hooks] │
│                                         [Regenerate]│
│ ┌────────┐  ┌────────┐  ┌────────┐                  │  ← 3-col grid
│ │ STAT   │  │ STORY  │  │ FOMO   │                  │     framework chip top-left
│ │ @img-1 │  │ @img-2 │  │ @img-3 │                  │     @image-N badge top-right
│ │ image  │  │ image  │  │ image  │                  │
│ │────────│  │────────│  │────────│                  │
│ │ Stat..  ⋯│  │Story.. ⋯│  │FOMO.. ⋯│                  │  ← footer strip w/ label + 4:5·v2 mono
│ └────────┘  └────────┘  └────────┘                  │
│ ┌────────┐  ┌────────┐  ┌────────┐                  │
│ │ CURIO  │  │CALLOUT │  │CONTRAST│                  │
│ │ ...    │  │ ...    │  │ ...    │                  │
│ └────────┘  └────────┘  └────────┘                  │
└─────────────────────────────────────────────────────┘
```

## Concrete changes

**`client/src/components/ResultsView.tsx`:**
- **Toolbar (h-13):** `Brand › Campaign Name [Active chip]` on left, mono meta `✨ 6 hooks · last edited HH:MM` + sliders + ⋯ on right. Drop the existing `border-b border-border bg-bg-base/80` style. Replace with bone-bg or transparent + bottom spacing.
- **Working session strip:** above the grid, `● Working session` eyebrow (wine `●` dot) + caption "Six hooks across the framework grid. Click a tile to open, regenerate, or feed back as @image-N." + `[All hooks]` and `[Regenerate set]` buttons on right.
- **Hook tile redesign (`ImageCard.tsx`):** add framework tag chip top-left (using `--color-fw-*` tokens from Phase 1), `@image-N` mono badge top-right (`bg-black/55`), footer strip below image with hook label + `4:5 · v2` mono meta + ⋯ icon. Remove default `card-lift` hover, use a softer hover state.

## Data needed
- Hook type per image: `image.hookType` (already exists in store)
- Aspect ratio per image: stored on campaign or image? Need to check
- "Last edited" timestamp: derive from `campaign.updatedAt` or compute from latest message
- "6 hooks generated": derive from `generationExpectedImages` or `campaign.images.length`

## Open questions for Phase 3
- Should breadcrumb use `formatCampaignName()` (currently used in header) or raw `campaign.name`?
- Framework tag colors: 6 colors defined in Phase 1 tokens. Map: stat=forest, story=wine, fomo=amber, curiosity=slate-blue, callout=deep-wine, contrast=ink. Use as bg with white text.
- "All hooks" / "Regenerate set" buttons — what do they actually do? Need to wire to existing actions or treat as visual-only for now?
- Should we keep the existing connection-status banner (`reconnecting` / `disconnected`) at the top, or move it elsewhere?
- The existing `Save All` button — keep in toolbar (current position) or move into the ⋯ menu?

## Files to touch
- `client/src/components/ResultsView.tsx` (heavy — toolbar + working session strip + grid wrapper)
- `client/src/components/ImageCard.tsx` (heavy — chip overlay + footer strip)
- Possibly `client/src/components/ImageLightbox.tsx` (light — match new visual vocab)

---

# Part 6 — Phase 4 implementation plan (next session)

**Goal:** redesign the chat panel (`ChatSidebar.tsx` + chat components) to match `workspace-v2.jsx` lines 647–933.

## What changes

**`AppLayout.tsx` RightSidebar header:**
- Currently bare: `[toggle]   Chat`
- Replace with `<AgentIdentityStrip />` showing the Sage badge + "Sage" name + thinking indicator + brand subtitle:
```
[S]  Sage ● thinking…
     Your creative partner for {brand}
```
- Badge component: 30×30 ink square with lime `S` letter + tiny lime status dot bottom-right, **breathing animation when thinking** (uses `cm-breathe` keyframe added in Phase 1)

**`ChatSidebar.tsx` body:**
- New `ProgressMsg` component for research/hooks/prompts phases — green checkmark when done, pulsing dots when running, mono timestamp on right
- Refactored `AgentBubble` — embedded headline preview card + suggestion pills ("Try a Story Hook", "Make it punchier", "Different angle")
- New `UserBubble` — ink bg, light text, max-w-[85%], right-aligned, "you" label + mono timestamp

**`ChatInput.tsx` (Composer):**
- Reference chips above textarea (`@image-2` w/ framework tag, `brand-guidelines.pdf`)
- Aspect chips inline (4:5 / 1:1 / 9:16) — already in store as `selectedAspectRatio`
- Wine send button (bg-accent)
- `⌘↵ to send` mono hint
- Reference files popover behind paperclip / `@` trigger

## Open decisions for Phase 4
- **Sage state machine:** when does the badge breathe vs go still? Bind to `currentGeneratingMessageId` (true when generating). The "thinking…" label could rotate between states (researching, drafting hooks, generating images) — pull from the existing phase events.
- **Suggestion pills:** static set ("Try a Story Hook" / "Make it punchier" / "Different angle") or dynamic from agent? Recommend **static for now** — low risk, matches design.
- **Reference popover:** currently the chat has an `@` mention system in `mentions/`. Need to merge the popover UX with that existing system, not replace it.
- **MobileChatDrawer:** likely needs the same Sage badge treatment but in mobile drawer chrome.
- **Two existing things to preserve:**
  1. Welcome bubble in chat (S86 personalized intro for first-time users)
  2. Auto-scroll behavior + scroll-to-bottom button

## Files to touch
- `client/src/components/layout/AppLayout.tsx` (RightSidebar header — small)
- `client/src/components/chat/ChatSidebar.tsx` (medium)
- `client/src/components/chat/ChatMessage.tsx` (heavy — bubble redesigns)
- `client/src/components/chat/ChatInput.tsx` (heavy — composer redesign)
- `client/src/components/chat/blocks/` (light — block rendering may need style updates)
- `client/src/components/chat/MobileChatDrawer.tsx` (light — mobile parity)
- Possibly new: `Sage` badge component (could inline in ChatSidebar or split)

---

# Part 7 — Open follow-ups (lower priority)

### From S88
- **Push to origin** — commit `1fe65bf` is local only. `git push origin new-ui` when ready (tells team about the visible workspace changes on staging).
- **Mobile parity** — Phase 1 inset frame is desktop-only (`md:`). Mobile workspace sees the old layout. Acceptable for now per design (desktop-first), revisit after Phase 4.
- **Plan badge wording** — currently shows `PRO` / `STARTER` / `Free`. Design prototype said "Studio" for starter. Keep our actual product names per S87 lesson (don't rename without intent).
- **TS warning suppressions** — initial build threw `unused FileUpload import` and `unused totalImages var`. Fixed. Worth a TS-strict pass at the end of all phases.

### From S87 (carry-over)
- Cancelled / error campaign retry card in ResultsView
- Skeleton math for regenerating one image in a 6-image campaign goes negative
- Background generation indicator when user navigates away mid-run
- First-completion celebration after first campaign finishes
- Welcome bubble dismissibility / "seen welcome" localStorage flag
- Generation status indicator stuck during research phase (S84 carry-over)
- Curl-bypass tests for top-up gate (S84 carry-over)
- Production deploy of S84+S85+S86+S87 (still pending) — S88 will piggyback when this happens

### Architecture docs (S85 carry-over, still owed)
- `docs/architecture/ONBOARDING_FLOW.md` — should now also document Phases 1-2 of S88: gate logic, sidebar redesign rationale
- `docs/architecture/PAYMENT_FLOW.md` — original spec from S85
- `docs/architecture/STREAMING_PIPELINE.md` — original spec from S85

---

# Part 8 — Quick reference for the next session

## To pick up Phase 3:
1. Re-read `chat1.md` from the design bundle (especially around hook tile design)
2. Open `workspace-v2.jsx` lines 537–644 (`CenterCanvas`, `HookTile`)
3. Open this doc's **Part 5** for the implementation plan
4. Open `client/src/components/ResultsView.tsx` and `client/src/components/ImageCard.tsx` for the touch list
5. Build + deploy via the standard sequence (Part 3 of this doc)
6. Iterate via Chrome MCP screenshots (`mcp__claude-in-chrome__computer` action `screenshot`)

## To pick up Phase 4:
1. Re-read `chat1.md` for chat panel design rationale
2. Open `workspace-v2.jsx` lines 647–933 (`ChatPanel`, `AgentBadge`, `ProgressMsg`, `AgentBubble`, `UserBubble`, `Composer`, `RefChip`, `AspectChip`, `ReferencePopover`)
3. Open this doc's **Part 6** for the plan
4. Touch list: `ChatSidebar.tsx`, `ChatMessage.tsx`, `ChatInput.tsx`, `AppLayout.tsx` right header

## To re-pull the design bundle:
```bash
curl -sL "https://api.anthropic.com/v1/design/h/X-yMU7sOgiFd1_1xWtXWSw?open_file=workspace.html" \
  -o /tmp/cd_bundle.gz
mkdir -p /tmp/cd_extracted && cd /tmp/cd_extracted
gunzip -k /tmp/cd_bundle.gz && tar -xf /tmp/cd_bundle
ls creative-workspcae/project/
```

## To see the live result:
- Staging: https://creative-agent-staging.alphasapien17.workers.dev/workspace
- Production: https://creativemachines.xyz/workspace (S88 NOT yet deployed)

## Locked decisions for Phases 3-4 (don't relitigate):
- Agent name is **Sage**
- Composer/chat bg is **A · Editorial** (bone-2 panel, near-white input)
- Credits panel is final (Option C — no card, wine hairline)
- Account menu mirrors old options exactly
- Mobile is desktop-first, mobile drawers stay separate
- No "Workspace / Settings / Help" items in account menu (those weren't in the old version)
- Don't add features beyond visual restyling — match the existing functionality, just dressed differently

---

End of S88 handover.
