# Session 56 — UI Fixes, Aspect Ratio, UUID Dedup, Brand Sidebar

**Date:** 2026-03-23
**Branch:** `new-ui`
**Commits:** `9abf484`, `0eda5db`, `bbaddc6`
**Deployed:** https://creative-agent.alphasapien17.workers.dev

---

## Changes Made

### 1. Chat Content Blob Fix (`9abf484`)

**Problem:** During generation, the agent's narration text ("I'll create... Let me start... Perfect!...") appeared as one giant unformatted paragraph below the thinking block. No line breaks, truncated at container edge.

**Root cause:** Two issues:
- `appendMessageContent` concatenated text chunks without newline separators: `(msg.content || '') + text`
- The content fallback div rendered during active generation alongside the thinking block

**Fix:**
- Added `\n` separator in `appendMessageContent` and `appendTextBlock`
- Added `isActivelyGenerating` check to hide content fallback during generation
- Content only renders for completed messages without text blocks

### 2. User-Selected Aspect Ratio (`0eda5db`)

**Problem:** Agent auto-rotated aspect ratios across 6 hooks (2x 4:5, 2x 1:1, 2x 9:16). Users had no control.

**Fix:**
- Added `selectedAspectRatio` to Zustand store (default: `4:5`)
- 3-button toggle in EmptyState (`4:5 Feed`, `1:1 Square`, `9:16 Story`) and ChatInput
- Aspect ratio passed through WS message → DO/server → injected into agent prompt as `[ASPECT RATIO: X:Y]`
- Updated `SKILL.md`: removed auto-rotation, replaced with "use user-specified ratio for ALL concepts"
- `generate-images` MCP tool already accepts `--aspect` flag

**Files changed:** store, EmptyState, ChatInput, ChatSidebar, useWebSocket, cloudflare types, campaign-session DO, server websocket-handler, SKILL.md

### 3. UUID Dedup Fix (`0eda5db`)

**Problem:** Chat messages from the agent appeared duplicated — every sentence showed twice.

**Root cause:** Claude Agent SDK's `query()` yields each message twice through stdout — once during streaming and once as the final consolidated message. Both have the same `uuid`. The agent-runner writes both to stdout, the DO parses both, and duplicate events get sent to the WebSocket.

**Fix:** Added `seenUuids` Set in `streamForLiveUI()`. When a message UUID is already in the set, it's skipped before reaching `processSDKMessage`.

### 4. Brand-Grouped Sidebar (`bbaddc6`)

**Problem:** All campaigns in a flat list. Names like "Create", "Can", "I" from truncated prompts. No visual grouping for campaigns from the same brand.

**Design decisions (brainstorm with user):**
- Brand = folder (collapsible), campaigns nest inside
- No separate brands table — just a `brand TEXT` column on campaigns
- Auto-extract brand from URL ("bombayshirts.com" → "Bombayshirts")
- Research copied per campaign (not shared at brand level)
- Legacy campaigns (no brand) show under "Ungrouped"
- Brand actions: + new campaign, rename, delete all
- Campaign actions: rename, delete (copy button removed — use brand +)

**Implementation:**
- **DB:** `ALTER TABLE campaigns ADD COLUMN brand TEXT` (D1 migration + local SQLite)
- **Backend:** `createCampaign()` accepts optional `brand` parameter, passed through WS message
- **Client:** New `extractBrandAndName()` function splits prompt into brand + campaign name
- **Sidebar:** Rewrote `CampaignsSection` with `BrandGroup` component for collapsible brand folders
- **"+ on brand":** Finds oldest campaign in brand group, uses it as research source
- **"+ top-level":** Creates new brand (full research flow)
- **Store:** Added `brand` to Campaign interface, `renameBrand()` action

**Sidebar layout:**
```
CAMPAIGNS                              [+ New Brand]
▼ Bombayshirts                         [+ ✏ 🗑]
  ▼ Festive Collection   (6 img)       [✏ 🗑]
    ├─ Research
    ├─ Hooks
    └─ Prompts
  ▶ Summer Launch        (3 img)       [✏ 🗑]
▶ Verbis EDU                           [+ ✏ 🗑]
▶ Ungrouped
```

---

## Known Issue (Deferred)

**Content blob during initial generation:** During live initial generation, the content fallback still appears briefly when generation completes. Root cause: message text goes to `msg.content` but NOT into blocks during initial gen (`isFollowUp = false`). Follow-ups work correctly because they put text into blocks. Full analysis documented — fix deferred to avoid breaking refresh rendering.

---

## Files Changed (All Commits)

| File | Changes |
|------|---------|
| `client/src/store/index.ts` | `brand`, `selectedAspectRatio`, `renameBrand`, `appendMessageContent` newline |
| `client/src/components/assets/AssetDrawer.tsx` | Brand-grouped sidebar rewrite |
| `client/src/components/chat/ChatMessage.tsx` | Content blob hide during generation |
| `client/src/components/chat/ChatInput.tsx` | Aspect ratio toggle |
| `client/src/components/EmptyState.tsx` | Aspect ratio toggle |
| `client/src/components/chat/ChatSidebar.tsx` | Pass aspectRatio to generate/followUp |
| `client/src/hooks/useWebSocket.ts` | `extractBrandAndName()`, pass brand + aspectRatio |
| `client/src/lib/api.ts` | `brand` in ApiCampaign + transformCampaign |
| `cloudflare/schema.sql` | `brand TEXT` column |
| `cloudflare/src/db/campaigns.ts` | `brand` in Campaign interface + createCampaign |
| `cloudflare/src/lib/types.ts` | `aspectRatio`, `brand` in ClientMessage |
| `cloudflare/src/durable-objects/campaign-session.ts` | Pass brand to createCampaign, aspect ratio injection, UUID dedup |
| `cloudflare/src/lib/sdk-message-parser.ts` | (no change — dedup is in DO) |
| `server/lib/database.ts` | `brand TEXT` column + migration |
| `server/lib/db/campaigns.ts` | `brand` in Campaign interface + createCampaign |
| `server/lib/websocket-handler.ts` | Pass brand + aspectRatio through handlers |
| `agent/.claude/skills/art-style/SKILL.md` | Remove auto-rotation, use user-specified ratio |

---

## Key Gotcha Discovered

**Claude Agent SDK yields each message twice:** Once during streaming, once as the final consolidated message. Both have the same `uuid`. Must deduplicate by UUID in the log parser to prevent duplicate events reaching the WebSocket client.
