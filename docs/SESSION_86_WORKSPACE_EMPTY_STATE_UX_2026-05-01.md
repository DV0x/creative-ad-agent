# Session 86 — Workspace empty-state UX overhaul (continued from S85)

**Date:** 2026-05-01
**Branch:** `new-ui`
**Staging:** ✅ deployed five times this session — final version `03102d90` (verified end-to-end)
**Production:** ⏸️ pending — S85 + S86 changes bundle is now ready for prod
**Node version required for deploy:** **v20** (Node 23 still broken — `nvm use 20`)

> This doc consolidates:
> 1. S84/S85 carry-over (payment gating + live streaming fixes — see S85 doc for full detail)
> 2. S86 work (workspace empty-state UX overhaul, editorial welcome hero, chat-as-action-surface)
> 3. The full updated punch list for the next session: production deploy + arch docs + remaining follow-ups
>
> Read it once and you have everything for the next session.

---

## Combined TL;DR (S84 + S85 + S86)

| Area | What changed | Verified? |
|---|---|---|
| **S84: Top-up gate** | Subscriber-only at `payments.ts:87-114`. $5 wedge for cold traffic (single-use via `payment_events` lookup). | ✅ deploy `7e6737c6` |
| **S84: Signed-out CTA flow** | Pricing CTAs → `/sign-up?plan=…` → `/checkout/init` → Dodo. SessionStorage primary, URL fallback. | ✅ |
| **S84: Path-based Sign-In/Up** | `/sign-in` → `<ClerkSignIn>`; `/sign-up` → `<ClerkSignUp>`. Both forward `forceRedirectUrl=/checkout/init`. | ✅ |
| **S84: Post-payment workspace** | Lands on `/workspace?welcome=starter\|pro` with 6s `WelcomeBanner` toast. Self-strips URL param. | ✅ |
| **S84: Cancel handling** | Dodo `cancel_url` → `/?upgrade-cancelled=plan-interval` or `/?topup-cancelled=amount`. `ResumeUpgradeBanner` re-launches. | ⏳ not exercised in test |
| **S84: TopupModal locked state** | Free-tier users see lock + "See plans" / "Try one campaign · $5". Server-side 403 surfaced inline. | ✅ |
| **S84: Admin grant tooling** | `CLAUDE.md` SQL recipe for design-partner manual D1 grants. | ✅ documented |
| **S85: Research streams live** | `agent-runner.ts` now surfaces subagent tool_use blocks (research subagent's `Write`) so the parser emits `file` events mid-flight. | ✅ deploy `e2ac988d`, end-to-end on fresh account |
| **S85: Images stream one-by-one** | `orchestrator-prompt.ts` instructs one `nano-banana` call per prompt (was: batches of up to 3). | ✅ verified 3-image run |
| **S85: Pipeline guardrail** | Prompt explicitly forbids re-running research / hooks / art-style between image calls. | ✅ |
| **S86: Editorial welcome hero** | `EmptyState` in workspace-empty mode is now an editorial poster: "Welcome in, {firstName}. Your studio is open." with wine accent divider + long hand-drawn SVG arrow pointing to chat. Bento + recent chips dropped in this mode. | ✅ deploy `03102d90` |
| **S86: Welcome bubble in chat** | First-time users see a personalized intro bubble in the chat sidebar (Clerk firstName fallback chain), explaining research → hooks → creatives + follow-up flow. No counts ("6") to keep scope open. | ✅ |
| **S86: Chat as single action surface** | Input form + bento removed from main hero in workspace-empty. Chat sidebar auto-opens (desktop) with input autofocus on land. Typing in chat from workspace-empty kicks off `generate()`. | ✅ |
| **S86: No-redundant-empty-states** | Welcome hero stays mounted whenever active campaign has 0 images and isn't generating. Generic "No images yet" placeholder fully removed from `ResultsView`. As soon as generation starts, ResultsView takes over with skeleton cards. Zero layout shift. | ✅ |
| **S86: Lime → pop-ink in chat** | Inline code in chat (`## Reference Images` style tags) was using `text-pop` (`#C1FF64`) on cream — washed-out AI-slop look. Swapped to `text-pop-ink` (`#3A5A14`, dark olive). Brand-keeping, legible. | ✅ |

---

## Commits to push (in order, since pre-S84 baseline)

```
ec95d36 feat(payments): subscriber-only top-up gate, $5 wedge, signed-out signup→checkout flow      ← S84
b4e2b36 fix(auth): wrap openTopupModal click handler to fix TS build                                ← S84
42ebccf fix(landing): clarify Starter/Pro credit-bonus copy is monthly-only                         ← S84
d8b41bb feat(landing): refresh hero copy, before/after, footer tagline                              ← pre-S84
f9cb082 chore(gitignore): ignore env files, build caches, and root uploads                          ← pre-S84
28f93b1 fix(agent): stream research live + one-image-per-call to unblock live UI                    ← S85
6e54e7f docs: session 85 — combined S84 + S85 handover for prod deploy + arch docs                  ← S85
d5d1311 feat(workspace): editorial welcome hero, chat-as-action-surface, no-redundant-empty-states  ← S86 (this session)
```

`d5d1311` is the only commit added during S86. Already pushed to `origin/new-ui`.

---

# Part 1 — S84 + S85 recap

See `docs/SESSION_85_LIVE_STREAMING_FIXES_2026-04-30.md` for full detail. In one paragraph:

S84 shipped the entire payment gating story — top-up gate locked to subscribers, $5 wedge for cold traffic with single-use enforcement via `payment_events`, full sign-up → checkout flow with sessionStorage + URL fallback for plan persistence, post-payment redirect to `/workspace?welcome=starter|pro` with a celebratory toast, and a cancel flow that returns users to the landing with a `ResumeUpgradeBanner`. S85 fixed two long-standing live-streaming bugs (since the post-S65 streaming refactor): research output never rendered live during a run because subagent assistant messages don't fire stream_events in the parent iterator (fixed by synthesizing `tool_use_event` lines from any message with `parent_tool_use_id` in `agent-runner.ts`), and images appeared in batches of 3 because the orchestrator prompt allowed batching (fixed by mandating one `nano-banana` call per prompt with a strict "do NOT re-run earlier steps between calls" guardrail). All S84 + S85 changes are live on staging since `e2ac988d` and verified end-to-end.

---

# Part 2 — S86 work (workspace empty-state UX overhaul)

## The problem

After S84 + S85, the post-payment / first-launch experience went:

1. User pays → lands on `/workspace?welcome=…` → sees `<ResultsView />` rendering "Select a campaign to view images" — a dead-end message with nothing to select.
2. After clicking "New Campaign", the EmptyState used the same hero design as the public landing page (large two-column layout with bento showcase grid). Redundant for someone already inside the app.
3. After typing "Hi" in the chat to start a campaign, the main panel showed a generic ImageIcon + "No images yet / Use the chat to generate images for this campaign" placeholder. Boring, low-effort.
4. Inside the agent's intro message, inline code tags (`## Reference Images`) were styled with `text-pop` (lime) on cream — looked like washed-out AI-slop highlighter.

User feedback during this session: the workspace empty-state was the highest-priority follow-up from S85's punch list, and the post-creation "No images yet" placeholder felt boring next to the polished welcome.

## Iteration timeline (the design conversation)

This session went through ~6 visual iterations, each verified on staging. Key turns:

1. **First pass — keep input form + bento, just soften copy.** Quickly rejected by user — having an input box in the hero AND another in the chat sidebar is visually conflicting.
2. **Option 2 — chat as the single action surface, hero becomes a banner.** User accepted. Drop the input form from the hero, keep chat input as the only place to type.
3. **First editorial pitch — "Welcome in, {firstName}. Your studio is open." with `ISSUE 001 · MAY 1, 2026` date stamp + pulsing ✦ sparkle + linear → arrow.** User: "sparkles are AI slop" — rejected.
4. **Replacements pitched — pulsing lime dot ("OPEN" light), ✦ replacement.** User: "no pulsing it's also very common stuff" — rejected.
5. **Settled on no motion in stamp area, just `№ 001 / MAY 1, 2026` mono-caps. Custom hand-drawn SVG arrow with subtle horizontal nudge.** Initial implementation had a short 36px arrow inline with the label.
6. **User: "make the arrow long so it points to the chat with cursor enabled."** Restructured: removed the now-redundant subhead "Make creatives that read your brand." and the ① Research — ② Hooks — ③ Creative pack process strip (both already on the public landing hero). Promoted the arrow to a 220px hand-drawn SVG positioned absolute at the bottom-right of the hero, with a draw-on stroke animation followed by an infinite gentle nudge. Chat input got `autoFocus`.
7. **User: "what is that date and numbers above?"** The date stamp wasn't reading as evocative — confusing rather than editorial. Dropped entirely. Hero is now just H1 + wine divider + arrow.
8. **User: "the empty state turned into something boring again after the chat" — pointing at the post-creation "No images yet" placeholder.** Pitched 6 options (editorial twin, phantom grid, active studio status, etc.), but user pushed back: "once images are generated the whole space will become grids so how do you exactly point it?" Realized the right answer is to **keep the welcome hero mounted until generation actually starts, then let `ResultsView` take over with skeleton cards.** No separate empty state needed. Removed the `ResultsView` placeholder entirely.

## Final design — three layered components

### 1. Editorial welcome hero (main panel)

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   Welcome in,                                            │  ← Clash Display
│   pimoreh347.                       (firstName in wine)  │     ~5xl–7xl
│   Your studio is open.                                   │
│                                                          │
│   ──    (32px wine divider, 2px tall)                    │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                                                          │
│                            Start a brief in chat ━━━→    │  ← absolute bottom-right
│                                                          │     220px SVG, hand-drawn
└──────────────────────────────────────────────────────────┘
```

**Typography:**
- H1: `text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]`, two lines
- firstName span: `text-[#AB406C]` (wine accent on the personalization beat)
- Wine divider: `h-[2px] w-8 bg-[#AB406C]`
- Arrow label: `text-sm font-medium text-text-secondary`

**SVG arrow path:** `d="M 4 14 C 40 14 60 10 100 11 S 160 13 200 12 L 210 12"` followed by arrowhead. Hand-drawn quality (subtle dip-and-rise), wine-colored, 220px wide.

**Animation choreography (mount):**
| Element | Delay | Duration | Animation |
|---|---|---|---|
| H1 | 0ms | 600ms | `editorialFadeUp` (opacity + 8px translateY) |
| Wine divider | 200ms | 480ms | `editorialFadeUp` |
| Arrow container | 500ms | 480ms | `editorialFadeUp` |
| Arrow main path | 700ms | 1400ms | `editorialArrowDraw` (stroke-dashoffset 320 → 0) |
| Arrowhead | 1900ms | 300ms | `editorialArrowDraw` (stroke-dashoffset 20 → 0) |
| Arrow nudge | 2200ms | 2s loop infinite | `editorialArrowNudge` (translateX 0 → 6px → 0) |

Total entrance ~2.5s including arrow draw-on. Reduced-motion fallback skips entrance and stops nudge.

### 2. Welcome bubble (chat sidebar)

When `chatMessages.length === 0 && isWorkspaceEmpty`, the chat sidebar renders a personalized intro instead of the generic "Start creating" empty state:

> Hi **{firstName}**, I'm your creative agent. Drop a URL or describe your business in the box, and I'll:
>
> 1. Research the brand — reviews, products, customer language
> 2. Write ad hooks across multiple angles
> 3. Generate matching ad creatives
>
> Each run takes about 5–8 minutes. You can follow up anytime — rewrite hooks, try a different angle, switch the art direction, or generate more creatives. Just keep chatting.

**FirstName fallback chain:** `clerkUser?.firstName || clerkUser?.username || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'there'`. Same chain in `EmptyState.tsx` and `ChatSidebar.tsx`.

**Explicit copy decisions:**
- Removed all "6" counts (was "6 ad hooks", "6 matching ad creatives") — anchoring to a specific number suggests a hard limit, but users can iterate / generate more / tune. "ad hooks across multiple angles" keeps scope open.
- Removed the parenthetical hook-type list (stat / story / fomo / curiosity / callout / contrast) — internal mechanics, doesn't help a fresh user.
- Added the explicit follow-up paragraph — most users assume this is one-shot generation; the paragraph makes the conversation framing clear.

### 3. Persistence logic (no redundant empty states)

The welcome hero (both editorial main panel + chat welcome bubble) stays mounted whenever:
- Workspace mode is active, AND
- (zero campaigns) OR (active campaign has zero images AND isn't generating)

Implementation: gated in `App.tsx:308-321` (the `showWorkspace` render branch) AND inside `EmptyState.tsx:isWorkspaceEmpty` (must duplicate the gate so both component selection and component internal mode-switching agree).

The instant generation kicks off (`generatingCampaignId === activeCampaignId`), the gate flips to false → `ResultsView` mounts → existing skeleton-card flow runs → real images arrive. Same grid layout throughout, zero layout shift.

Removed entirely: the old `<div className="text-center py-16">...No images yet...</div>` block from `ResultsView.tsx`. The unused `MessageSquare` icon import was also stripped.

## Files changed (S86)

```
M  client/src/App.tsx
   — Added `activeCampaignId` and `generatingCampaignId` to the destructured store hook.
   — Replaced `campaigns.length === 0 ? <EmptyState /> : <ResultsView />` with an IIFE
     that computes `showWelcomeHero` based on the broader empty-state gate.

M  client/src/components/EmptyState.tsx
   — Imported `useUser` from Clerk + `isDevMode` for the dev-mode auth fallback.
   — Replaced the simple opacity-fade placeholder rotation with a ticker-style
     cross-slide hook (`useRotatingPrompt`) modeled on the landing Hero.tsx version.
   — Added `firstName` derivation with full fallback chain.
   — Extended `isWorkspaceEmpty` to cover "active campaign with no images, not generating".
   — Branched the JSX: workspace-empty mode renders the editorial poster (H1 +
     wine divider only); other modes keep the existing input-form layout.
   — Added the absolute-positioned long SVG arrow at `bottom-16 right-12` (lg+ only).
   — Bento grid + recent campaigns + process strip all conditionally hidden in
     workspace-empty mode.
   — autoFocus textarea when `isCreatingCampaign || isWorkspaceEmpty`.

M  client/src/components/chat/ChatSidebar.tsx
   — Imported `useUser` + `isDevMode`.
   — Pulled `appState`, `campaigns` from store, derived `isWorkspaceEmpty` + `firstName`.
   — Welcome bubble JSX rendered when `showEmptyState && isWorkspaceEmpty`. Falls back
     to the existing "Start creating" / "Enter a prompt to generate" empty state otherwise.
   — handleSubmit gained a fallback path: typing in chat from workspace-empty state
     fires `generate()` (was a no-op before because no `activeCampaignId` and no
     `isCreatingCampaign` flag).
   — `<ChatInput autoFocus={isCreatingCampaign || isWorkspaceEmpty}>`.

M  client/src/components/chat/MarkdownContent.tsx
   — One-line: `text-pop` → `text-pop-ink` on the inline code className.

M  client/src/components/layout/AppLayout.tsx
   — Added `campaignsCount` selector from store.
   — New effect: auto-open right (chat) sidebar on desktop when `isWorkspace &&
     campaignsCount === 0 && !isMobile`. Mirrors the existing
     `generatingCampaignId` auto-open effect; mobile drawer left collapsed
     (would block the empty-state input).

M  client/src/components/ResultsView.tsx
   — Removed the entire "No images yet" placeholder block (was lines 205-223 pre-edit).
   — Stripped now-unused `MessageSquare` from the lucide-react import.
   — Replaced placeholder div with a single comment explaining that the empty
     state is now handled at the App.tsx level.

M  client/src/index.css
   — Added `tickerRotateIn` / `tickerRotateOut` keyframes (ticker-style
     cross-slide for placeholder rotation, ported from Hero.tsx).
   — Added `editorialFadeUp` (entrance), `editorialArrowNudge` (perpetual
     6px right-and-back), `editorialArrowDraw` (stroke-dashoffset 320 → 0).
   — `prefers-reduced-motion` block kills entrance + nudge + draw-on, leaves
     ticker rotation at 1ms.
```

Total: 7 files, +324 / -139, single commit `d5d1311`.

## Visual decisions made and explicitly NOT made

### Decided — keep
- ✅ **Wine accent (`#AB406C`) on personalization touches** (firstName, divider, arrow). Editorial, premium.
- ✅ **Clash Display H1 + Satoshi body** (existing brand fonts).
- ✅ **Hand-drawn long SVG arrow** with draw-on + nudge animation. Wine-colored, ~220px.
- ✅ **Single action surface — chat sidebar is where the user types.** Hero is decorative + directional.
- ✅ **Welcome hero persists until generation actually starts.** No separate "empty campaign" placeholder.

### Decided — explicitly avoid
- ❌ **Sparkles (✦, ✨, etc.)** — flagged as AI-slop by user. Used nowhere in the editorial hero.
- ❌ **Pulsing dots** — flagged as common AI tropes. No "OPEN" light, no breathing dot, no glow halos.
- ❌ **Date / issue stamps** (`№ 001`, `MAY 1, 2026`, `ISSUE 001`) — initially seemed editorial, but read as confusing rather than evocative when the user saw them. Dropped entirely.
- ❌ **Generic linear → arrows** — explicitly want creative / hand-drawn quality.
- ❌ **Bento showcase grid in workspace-empty** — already on the public landing hero. Redundant inside the app.
- ❌ **Subhead "Make creatives that read your brand."** — also on landing hero. Redundant.
- ❌ **Process strip ① Research — ② Hooks — ③ Creative pack** in workspace-empty — also on landing hero. Redundant.
- ❌ **Phantom grid placeholder cards** (numbered `№ 01 · STAT` etc.) — pitched, but the welcome-persists approach is cleaner.
- ❌ **Hard counts of "6"** in any user-facing copy — limits perceived scope.
- ❌ **Lime (`#C1FF64`) on cream backgrounds** — washed-out, AI-slop look. Use `text-pop-ink` (`#3A5A14`) instead.

## Verification

**Final test on a fresh staging account (Pro plan, 0 campaigns):**

| State | Verified |
|---|---|
| Land on `/workspace` after sign-in | ✅ Editorial hero renders, chat sidebar auto-opens, chat input has focus |
| Welcome bubble with `Hi pimoreh347, I'm your creative agent...` | ✅ Personalized via Clerk firstName fallback to username |
| Long arrow at bottom-right with draw-on then nudge | ✅ |
| Type "Hi" in chat → campaign created, agent responds with intro | ✅ Welcome hero **stays mounted** through this — no boring "No images yet" |
| Inline code in agent's intro (`## Reference Images`) | ✅ Now dark olive, not lime |
| Type real URL → generation starts → ResultsView with skeleton cards | ✅ Smooth transition, zero layout shift |

Staging deploy versions in chronological order this session:
- `510510b5-3d05-47e2-988c-0c707d5c8224` — initial workspace-empty + welcome bubble + auto-open chat
- `f8feee2f-2f2d-498c-8518-9a8af3a168a8` — editorial poster v1 with date stamp + ticker + bento dropped
- `21628bea-9359-41c1-adb0-e56ffb75137c` — long arrow + dropped subhead/process strip + autofocus chat
- `6998ab47-0dfa-4cf4-b28a-2b559e26efa8` — dropped date stamp, tighter alignment + animation timing
- `03102d90-8622-4ae1-a5c3-92614e1e5966` — **final**: welcome hero persists through "no images yet" + lime → pop-ink fix

---

# Part 3 — Next session punch list

## A) Production deploy (highest priority, BIG bundle now)

Staging is stable on `03102d90` and bundles all of S84 + S85 + S86 (commits `ec95d36..d5d1311`). Sequence:

```bash
# 1. Verify branch is pushed and CI is green (if any)
git push origin new-ui

# 2. Switch to Node 20 (Node 23 still broken — same miniflare/undici regression)
nvm use 20

# 3. Build client for production
cd client && npm run build:production

# 4. Docker prep
docker logout registry.cloudflare.com
docker builder prune -af

# 5. Deploy
cd ../cloudflare && npx wrangler deploy --env production
```

Total ~6 min. Production worker URL: `creativemachines.xyz`.

After deploy, verify:
- `curl -s https://creativemachines.xyz/health | python3 -m json.tool`
- Spot-check D1: `npx wrangler d1 execute creative-agent-db-prod --remote --command="SELECT COUNT(*) FROM campaigns WHERE created_at > datetime('now', '-1 hour');"`
- Run one self-paid test campaign on creativemachines.xyz (~$5 wedge) to validate **the entire S84 + S85 + S86 stack on production traffic**:
  - Cold sign-up → checkout → workspace land → editorial welcome hero
  - Chat welcome bubble with correct firstName
  - Type URL → research streams live → hooks/prompts persist → 6 images stream individually
  - Verify pop-ink inline-code styling in chat
  - Verify "No images yet" placeholder is fully gone

## B) Architecture doc updates (still owed since S85)

The architecture docs at `docs/architecture/` predate the payment system, the streaming refactor, AND the new empty-state flow. Recommended deliverables:

1. **`docs/architecture/INDEX.md`** — add entries for:
   - Payment / billing flow
   - Streaming pipeline (post-S65 + post-S85)
   - Onboarding / empty-state flow (post-S86)

2. **New doc — `docs/architecture/PAYMENT_FLOW.md`** (specced in S85 doc Part 3.B). Same scope still applies.

3. **New doc — `docs/architecture/STREAMING_PIPELINE.md`** (specced in S85 doc Part 3.B). Same scope still applies.

4. **New doc — `docs/architecture/ONBOARDING_FLOW.md`** (S86 add):
   - Cold land → editorial welcome hero ("Welcome in, {firstName}.")
   - Chat sidebar as single action surface
   - Welcome bubble persistence rules (the broader gate: `appState === 'workspace' && (campaigns.length === 0 || (activeCampaign && images.length === 0 && !isActiveGenerating))`)
   - Transition to ResultsView (skeleton cards → real images)
   - Reduced-motion fallback behavior
   - Why specific design choices were rejected (sparkles / pulsing / date stamps / phantom grid)

5. **Update `docs/architecture/DATA_MODEL.md`:**
   - Add `user_credits`, `user_subscriptions`, `payment_events`, `usage_log` table descriptions
   - Note plan pool vs top-up pool distinction

6. **`docs/architecture/CREDITS_AND_USAGE.md`** (if exists; create if not) — same scope as S85 doc spec.

## C) Open follow-ups (not blocking deploy)

### From S84 (carry-over)
- ⏭️ **Image-skip bug investigation** — *resolved*. Per user this session: not a bug, just cancelled generations. Skip.
- ✅ **Workspace empty-state UX for first-time paying users** — **DONE in S86**. Editorial hero + chat welcome bubble + persistence rules.
- **Generation status indicator stuck during research** — progress UI doesn't reflect `msg.type=trace` events. Consider streaming a "still thinking" indicator after N seconds of WS silence.
- **Curl-bypass tests for top-up gate** — never executed end-to-end:
  - free user → `$10` → expect 403
  - free user → `$5` first time → expect 200
  - free user → `$5` second time → expect 403 with "trial already used"
- **Cancel flow** never observed firing in test — `cancel_url` → `ResumeUpgradeBanner` round trip not exercised.
- **Decline-card test** (`4000 0000 0000 0002`) not run.

### From S83 (carry-over)
- **Add `.nvmrc`** to pin Node 20 — still not done.
- **Pin / upgrade miniflare** to a version without the undici regression — still relying on Node 20 workaround.
- **BeforeAfter cost-per-creative claim** still inflated by ~6× (S82/S83).
- **Terms / Privacy / Image-IP pages** still don't exist.

### From S85 (carry-over)
- **Orphaned R2 images** under the old test user `user_3D4PSvICNuOGs8dMp7exTc1qUmv` — 4 stragglers in `users/.../images/` from cancelled-test runs. Optional cleanup; not user-facing.
- **Pricing math re-measurement** — now possible since live streaming + persistence work end-to-end. Run 3–5 successful 6-image campaigns and compute average raw COGS. (Carry from S84 too.)

### Newly open from S86
- **Mobile chat drawer auto-open** for empty workspace? Currently only desktop auto-opens the right sidebar; mobile needs an extra tap on the chat icon. Trade-off: auto-opening the mobile drawer would block the editorial hero. Open question.
- **First-time user mobile experience** — the long arrow is desktop-only (`hidden lg:flex`). Mobile users see the H1 + wine divider but no clear directional cue. Could add a small "↓ Tap chat to start" mobile-only fallback, or assume the chat icon is discoverable.
- **Welcome bubble dismissibility** — currently re-renders if user is in 0-campaign state for any reason (deleted all campaigns, edge cases). Could persist a "seen welcome" localStorage flag to suppress on repeat. Decided **not** to do this in S86 (simplicity wins), but worth revisiting if it feels noisy after real usage.
- **First-completion celebration** — after a user's *first* campaign finishes, there's no "you did it!" moment. The next onboarding milestone to design. Skip for now.

### Polish (low priority)
- 5-marketer DM panel for new H1 + sub copy (S83 carry-over)
- PostHog instrumentation for new H1 (S83 carry-over)
- Cal.com event setup — IST timezone, intake fields (S82/S83 carry-over)
- Curated eval set — 25–30 D2C brand URLs for baseline + LLM-as-judge

---

## D) Decisions explicitly NOT taken (so we don't relitigate)

Carry-over from S85 + new from S86:

- ❌ **Don't switch to a cheaper image model** to fix margins — quality matters; nano-banana-pro stays. (S85)
- ❌ **Don't auto-grant credits on signup** — hard paywall + manual D1 grants for design partners. (S84)
- ❌ **Don't include `docs/scratchpad.md` or untracked research files in commits** — per S83 / standing user direction.
- ❌ **Don't revisit Free / Starter / Pro tier prices** — capacity-per-dollar question only. (S84)
- ❌ **Don't try to dedup tool_use IDs across stream_event + assistant paths** — filter-by-source via `parent_tool_use_id` is the cleaner architectural answer. (S85)
- ❌ **Don't add sparkles, pulsing dots, or generic linear arrows to the editorial hero** — flagged as AI-slop. (S86)
- ❌ **Don't anchor user-facing copy to "6"** anything — limits perceived scope. (S86)
- ❌ **Don't render a separate "campaign exists but no images" empty state** — welcome hero persists until generation kicks off; ResultsView takes over with skeleton cards. (S86)
- ❌ **Don't use lime (`#C1FF64`) as text on cream / white backgrounds** — washed-out. Use `pop-ink` (`#3A5A14`) for text, lime stays for fills/highlights only. (S86)

---

## E) Files modified across S84 + S85 + S86

```
S84:
M  CLAUDE.md                                          (admin grants section + tables)
M  cloudflare/src/routes/payments.ts                  (subscriber-only gate + cancel_url)
M  client/src/App.tsx                                 (CheckoutInit + WelcomeBanner + auth fix)
M  client/src/components/auth/SignIn.tsx              (path-based sign-in vs sign-up)
M  client/src/components/landing/LandingPage.tsx      (ResumeUpgradeBanner)
M  client/src/components/landing/Pricing.tsx          (signed-out CTA + $5 wedge)
M  client/src/components/pricing/TopupModal.tsx       (locked state for free users)
M  client/src/components/EmptyState.tsx               (removed inline WelcomeBanner)
+  docs/SESSION_84_…_2026-04-30.md

memory/
M  pricing_subscription_plan.md                       (full rewrite for new policy)
M  MEMORY.md

S85:
M  cloudflare/sandbox/agent-runner.ts                 (subagent tool_use_event synthesis)
M  cloudflare/sandbox/orchestrator-prompt.ts          (one nano-banana call per prompt + guardrails)
+  docs/SESSION_85_LIVE_STREAMING_FIXES_2026-04-30.md

S86:
M  client/src/App.tsx                                 (broader empty-state gate)
M  client/src/components/EmptyState.tsx               (editorial hero + ticker + long arrow)
M  client/src/components/chat/ChatSidebar.tsx         (welcome bubble + handleSubmit fallback)
M  client/src/components/chat/MarkdownContent.tsx     (text-pop → text-pop-ink)
M  client/src/components/layout/AppLayout.tsx         (auto-open chat sidebar in empty state)
M  client/src/components/ResultsView.tsx              (removed "No images yet" block)
M  client/src/index.css                               (ticker + editorial keyframes)
+  docs/SESSION_86_WORKSPACE_EMPTY_STATE_UX_2026-05-01.md (this doc)
```

`docs/scratchpad.md` and untracked research / HTML / SDK files remain intentionally excluded.

---

## F) Test data references

If next session needs evidence trails:

| Campaign / context | What it shows |
|---|---|
| `campaign_molh5ov7rfy8hf` | S85 final verification on fresh account (deploy `e2ac988d`). All files populated, 3 distinct image timestamps, no loop. |
| Test account `pimoreh347` (Pro plan, 0 campaigns) | S86 verification subject. Used to verify editorial hero + welcome bubble + chat autofocus + welcome-hero persistence through "Hi" → agent intro → real URL → generation. |
| Staging deploy `03102d90` | Final S86 build — bundles S84 + S85 + S86. Production deploy candidate. |

---

## G) Quick reference — what should land on production

When you `wrangler deploy --env production` next session, here's what users will start seeing on `creativemachines.xyz`:

**Landing / sign-up flow** (S84):
- Pricing tiles route signed-out users through `/sign-up?plan=…` → Clerk → `/checkout/init` → Dodo
- $5 wedge for cold traffic ("Try one campaign · $5"), single-use enforcement
- Post-payment redirect to `/workspace?welcome=starter|pro` with celebratory toast

**First post-payment moment** (S86):
- Land on `/workspace` → editorial welcome hero ("Welcome in, {firstName}. Your studio is open.") with wine accent + long hand-drawn arrow pointing at chat
- Chat sidebar auto-opens with welcome bubble personalized by firstName + clear pipeline explanation + iteration paragraph
- Chat input is autofocused — cursor blinking, ready

**First campaign creation** (S86 + S85):
- Type URL in chat → welcome hero stays mounted → chat shows agent's "Starting generation..." trace
- The instant generation kicks off, ResultsView replaces the welcome hero with skeleton cards
- Research streams live (S85): subagent's `Write` to `research.md` fires `file` events → research panel populates mid-flight
- Hooks then prompts populate as each Skill completes (existing flow)
- Images stream **one at a time** (S85): individual `nano-banana` calls, each image arrives as its own event → distinct timestamps

**Inside the chat** (S86):
- Inline code tags (`## Reference Images`) render dark olive on cream — no more lime AI-slop highlighter

**Everything still works that worked before** (regression surface):
- Existing user with N campaigns lands on `/workspace` → ResultsView for active campaign (no editorial hero shown)
- Existing campaigns mid-generation continue to work via the live streaming fixes from S85
- Payment gates, top-up flow, cancel flow, locked TopupModal — all unchanged
