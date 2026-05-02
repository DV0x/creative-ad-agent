# Session 90 — Chat panel polish (post-S89 visual QA)

**Date:** 2026-05-02
**Branch:** `new-ui` (changes committed locally, not pushed)
**Staging:** ✅ deployed `621d86e6` — final state with badge tagline
**Production:** ⏸️ unchanged. S86 + S87 + S88 + S89 + S90 will all ride next prod deploy.

---

## TL;DR

Walked through visual QA of all S89 Phase 4 surfaces on staging. Three rough edges surfaced — fixed in this session:

1. **Agent bubble's wine 2px left rule** read as a chat-panel divider, not a quote-mark. **→ Dropped the AgentSurface chrome entirely.** Agent text renders bare on the bone-2 panel; block-level chrome (ThinkingBlock etc.) stays.
2. **Per-message timestamps** ("you · 11:42" / "sage · 11:43") added no value in a single-thread chat. **→ Removed.**
3. **Plain "Sage" badge** felt generic. Tried a sage-leaf SVG mascot (inline SVG + CSS keyframes, idle/hover/click/generating states). **Rejected** — execution didn't read well at small size. **→ Reverted to ink-square badge with two-line tagline treatment** matching a Pitch reference the user shared:
   - Top line: **Sage** + lime middot + *thinking…* (italic, only when generating)
   - Bottom line: "Your creative partner"

Phase 4 QA verdict before the polish pass: 9/9 surfaces visually passing on staging (Sage badge, composer @-trigger, empty hint, canvas toolbar, lightbox, hook tile shadow, agent/user bubbles, reference popover, focus ring). Only nit besides the three above: timestamp showed `AM` uppercase vs spec's lowercase — moot now since timestamps are removed entirely.

---

## What changed (commit-ready)

```
M  client/src/components/chat/ChatMessage.tsx        (-32 / +16)
M  client/src/components/layout/AppLayout.tsx        (+45 / -33)
2 files changed
```

### `ChatMessage.tsx`

- Removed `<AgentSurface>` wrapper component entirely.
- Live-streaming text: now renders as a bare `<p>` with the streaming cursor; surrounding `space-y-2` + `px-1` for breathing room.
- Markdown fallback content: also bare, wrapped in a thin `px-1` div for consistent inset.
- Removed the timestamp `<span>` block from both UserBubble and the agent path.
- Removed unused `BONE_2`, `WINE`, `WINE_HAIRLINE` constants.
- UserBubble unchanged structurally — still ink bg, cream text, max-w-[85%], `rounded-2xl rounded-br-sm`.

### `AppLayout.tsx`

- `<SageBadge />` rebuilt as a two-line layout (replaces the previous single-line "Sage" wordmark that lived next to the badge):
  - Left: 32×32 ink square with lime "S" letter + lime status dot bottom-right.
  - Right column (vertical stack):
    - Top text row: **Sage** (semibold, primary) — when `isThinking`, append a 1×1 lime dot + `text-[12px] italic text-text-muted` "thinking…" tail.
    - Bottom text row: `text-[11px] text-text-muted` "Your creative partner".
- Status dot `box-shadow: 0 0 0 2px var(--color-bg-raised-2)` so it reads as separated from the ink square against the bone-2 panel surface.
- Status dot still uses the existing `cm-breathe 1.6s ease-in-out infinite` keyframe — unchanged from S89.

No CSS keyframes added or removed. `index.css` is bit-identical to HEAD after the leaf revert.

---

## What we tried and walked back from — the leaf

Mid-session: built a custom sage-leaf SVG component as an experimental replacement for the badge. **Rejected by user during visual QA**, reverted in the same session.

Build details (preserved here in case it's useful in a future agent-identity exploration):

- `client/src/components/chat/SageLeaf.tsx` (now deleted) — ~150 lines.
  - Inline SVG path of an asymmetric sage leaf, ~28×28 viewBox.
  - Wine linear-gradient fill (`#B8487A` → `#923355`), lime central vein, tiny ink stem nub.
  - 5 motion states orchestrated with CSS:
    - **Idle**: `sage-breathe` (scale 1↔1.035 / 2.4s) + `sage-sway` (rotate ±1.6° / 4.8s, out of phase)
    - **Hover**: `data-hovering="true"` paused the breath/sway; React tracked cursor offset → 3D `perspective(120px) rotateX(±10°) rotateY(±10°)` on the stage element. Spring-eased via `cubic-bezier(0.22, 1, 0.36, 1)` 320ms.
    - **Click**: re-mount-keyed `<span>` ran a 540ms outward bloom (`sage-pulse`); a single lime spark drifted up from the tip via `sage-spark` (700ms transform from `translate(-50%, -50%) scale(0)` → `translate(-50%, -260%) scale(0.4)` with opacity dance).
    - **Generating** (`data-state="generating"`): breath quickened to 1.2s, sway to 3.6s; a hidden `<circle r="6">` filled with a radial-gradient lime stop-glow faded in via opacity transition + pulsed independently.
    - **Reduced-motion**: `@media (prefers-reduced-motion: reduce)` killed all animations + transforms.
  - All keyframes (`sage-breathe`, `sage-sway`, `sage-glow-pulse`, `sage-pulse`, `sage-spark`) lived in `index.css` under a `/* ─── Sage leaf ─── */` band — also deleted.

**Why it didn't work in execution:**
- At 28×28 the leaf shape was too small to read as a "creature." The user's reaction was that it looked like a wine pill, not a character.
- The asymmetric leaf path needs more iteration (real sage leaves are more elongated; my path was closer to a pebble).
- The motion was solid, but motion alone doesn't carry a mark when the form isn't legible.

**Lesson for the next agent-identity attempt:** start by sketching the static mark at multiple sizes (16, 24, 32, 48) on paper or in Figma before writing animation code. Polish at 28px is ruthless — even good motion can't save a shape that doesn't read.

---

## Locked decisions (cumulative — do NOT relitigate)

S86–S89 (carry-over):
- Agent name = **Sage**.
- Composer/chat bg = bone-2 (Editorial palette).
- Credits panel = no card, wine hairline, indented.
- Account menu mirrors old UserMenu.
- Mobile = desktop-first; mobile drawers stay separate.
- Don't add features beyond visual restyling.
- Hook framework labels on tiles = DROPPED.
- Hook tile chrome = clean image + hover-only overlay (`@image-N` + aspect + download).
- Save all = solid wine pill.
- Lightbox hook-type pill = REMOVED.
- Reference popover = restyled, not rebuilt — ALL keyboard/filter/store-sync logic preserved.
- Suggestion pills under agent bubbles = SKIPPED for v1.
- User bubble = ink (`#231F20`) + cream (`#FBF9F5`), `rounded-2xl rounded-br-sm`.

S90 (this session):
- **Agent bubble surface = REMOVED.** Agent text renders bare on the bone-2 panel surface. Block-level chrome (ThinkingBlock wine tint, BreadcrumbsIndicator, StatusBlock pill chips) stays — those are *content* containers, not bubble wrappers.
- **Per-message timestamps = REMOVED** for both user and agent. In a single-thread conversation they're noise.
- **Sage subtitle = ADDED** ("Your creative partner") — un-locks S89's "no subtitle" decision based on the Pitch-reference treatment.
- **Mascot direction = PARKED.** Leaf creature was the right archetype (abstract, ownable, name-resonant) but execution failed at 28px. Future attempts: prototype the static mark first, multi-size, before motion.
- **Static subtitle copy** = "Your creative partner". Not yet dynamic per-brand. Easy to swap to `Your creative partner for {activeBrand}` if/when the user wants — needs reading active campaign brand from store.

---

## Verification matrix (post-S90)

| Surface | Status |
|---|---|
| Sage badge (header) | ✅ ink square + lime "S" + lime dot + "Sage" + "Your creative partner" subtitle. Adds `• thinking…` tail when generating. |
| Composer @-trigger | ✅ AtSign icon (S89, unchanged) |
| Welcome / empty hint | ✅ "START CREATING" mono eyebrow + body (S89, unchanged) |
| Canvas toolbar | ✅ uppercase mono breadcrumb + wine Save-all (S89, unchanged) |
| Working session strip | ✅ wine ● + "WORKING SESSION" eyebrow (S89, unchanged) |
| Hook tile container | ✅ wine hairline + soft shadow (S89, unchanged) |
| Lightbox | ✅ "01 / 08" mono counter + dark glass action pills (S89, unchanged) |
| Agent message | ✅ **NEW** — bare text on panel, no surface chrome |
| User message | ✅ ink bubble (S89) **with timestamp removed** |
| Block-level chrome | ✅ ThinkingBlock / BreadcrumbsIndicator / StatusBlock — all kept (content, not bubble) |
| Reference popover | ✅ cream + wine hairline + bone-2 highlight (S89, unchanged) |
| Composer focus ring | ✅ wine ring + aspect chips + wine send (S89, unchanged) |

**Visual QA pass on staging:** confirmed live at 621d86e6.

---

## Outstanding for next session

### Tactical
- **Push `new-ui` to origin** — local-only commits piling up. `1fe65bf` (Phase 1-2 inset shell), `5dfca69` (Phase 3 canvas/lightbox), `1c7fdee` (Phase 4 chat panel), the new S90 polish commit, plus this doc commit.
- **Production deploy** — first prod deploy since S85. Will cut a single ride for the entire S86→S90 redesign.
- **Dynamic subtitle** — `Your creative partner for {brand}` instead of static. Reads `activeCampaign.brand` from store. ~5 line change in `SageBadge`. Decide whether to do it pre- or post-prod.

### Carry-overs (still pending)
- Mobile parity (S88+S89): MobileChatDrawer doesn't have the badge or the Sage identity strip. Mobile lightbox should also use floating chrome. Mobile toolbar lacks the editorial breadcrumb.
- Welcome bubble for 0-campaign users — couldn't visually verify in S89 since the test account had 38 campaigns. Empty hint (the alt path) was confirmed.
- Cancelled/error campaign retry card in ResultsView (S87+ carry).
- Skeleton math negative when regenerating one image (S87+).
- Background generation indicator when navigating away.
- First-completion celebration.
- Welcome bubble dismissibility / "seen welcome" localStorage flag.
- Generation status indicator stuck during research phase (S84).
- Curl-bypass tests for top-up gate (S84).

### Architecture docs (S85 carry-over)
- `docs/architecture/ONBOARDING_FLOW.md` — should now include S88 sidebar + S89 chat + S90 polish.
- `docs/architecture/PAYMENT_FLOW.md`.
- `docs/architecture/STREAMING_PIPELINE.md`.

### Dev environment
- **Disk space** — APFS corruption risk from S89 still real. Disk was at 91% mid-session; same risk this session. Free ≥30GB before next dev run.
- Backend Node 23 issues still unresolved. `nvm use 20` before every deploy (codified in `CLAUDE.md`).

---

## Quick reference

### Live URLs
- Staging: https://creative-agent-staging.alphasapien17.workers.dev
- Production: https://creativemachines.xyz (still pre-S86)

### Branch state at session end
```
local: new-ui
   ├ 4d8cd3a docs: session 89
   ├ 1c7fdee feat(workspace): chat panel redesign — Phase 4
   ├ 5dfca69 feat(workspace): editorial canvas + lightbox redesign — Phase 3
   ├ 1fe65bf feat(workspace): inset editorial shell + sidebar — Phase 1-2
   ├ <S90 polish — pending commit>
   └ <S90 doc — pending commit>
remote: not pushed since pre-S86
```

### To deploy production after committing + pushing
```bash
. ~/.nvm/nvm.sh && nvm use 20
cd client && npm run build:production
docker logout registry.cloudflare.com
docker builder prune -af
cd ../cloudflare && npx wrangler deploy --env production
```

### To check the badge thinking… state on staging
Kick off a generation:
```
1. Open https://creative-agent-staging.alphasapien17.workers.dev/workspace
2. Sign in
3. New campaign → enter a brand URL → submit
4. Watch the chat panel header — "Sage" gets a lime middot + italic "thinking…" tail
5. Lime status dot on the badge breathes via cm-breathe (1.6s)
```

End of S90 handover.
