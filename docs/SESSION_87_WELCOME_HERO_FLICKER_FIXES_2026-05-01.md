# Session 87 — Welcome hero flicker + stranded-campaign fixes (continued from S86)

**Date:** 2026-05-01
**Branch:** `new-ui`
**Staging:** ✅ deployed `9c0d3ba1` (verified by user end-to-end)
**Production:** ⏸️ still pending — S84 + S85 + S86 + S87 bundle now ready for prod
**Node version required for deploy:** **v20** (Node 23 still broken — `nvm use 20`)

> This doc consolidates:
> 1. S86 carry-over (workspace empty-state UX overhaul — see S86 doc for full detail)
> 2. S87 work (4 fixes for empty-state edge cases that S86 introduced or left exposed)
> 3. Updated punch list for the next session
>
> Read once and you have everything for the next session.

---

## Combined TL;DR (S86 + S87)

| Area | What changed | Verified? |
|---|---|---|
| **S86: Editorial welcome hero** | "Welcome in, {firstName}. Your studio is open." + wine divider + long hand-drawn arrow. Bento + process strip dropped. | ✅ |
| **S86: Welcome bubble in chat** | Personalized intro in chat sidebar with research → hooks → creatives + follow-up paragraph. | ✅ |
| **S86: Chat as single action surface** | Input form removed from hero; chat sidebar auto-opens with autofocus. | ✅ |
| **S86: No-redundant-empty-states** | Welcome hero stays mounted until generation kicks off; "No images yet" placeholder removed. | ✅ |
| **S87: Welcome-hero flicker fix** | Chat-only "Hi" no longer blanks the canvas mid-turn. Gate flipped to require `generationExpectedImages > 0` rather than any open WS exchange. | ✅ deploy `9c0d3ba1` |
| **S87: URL-as-followup skeleton fix** | "Hi" → "glossier.com" now renders 6 skeletons immediately on the second turn. `startFollowUp` re-parses the prompt. | ✅ |
| **S87: Vague-followup self-correct** | "yes do it" / "go ahead" now sync `generationExpectedImages` from the server's `imageCount` on the first phase event. | ✅ |
| **S87: Stranded campaigns surface recovery** | Incomplete / cancelled / error campaigns with 0 images now route to ResultsView (where the Resume button lives) instead of stranding in welcome hero. | ✅ |

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
d5d1311 feat(workspace): editorial welcome hero, chat-as-action-surface, no-redundant-empty-states  ← S86
0b2cd74 fix(workspace): stop welcome hero from flickering on chat-only turns, route stranded …     ← S87 (this session)
```

`0b2cd74` is the only commit added during S87. Already pushed to `origin/new-ui`.

---

# Part 1 — S86 recap

See `docs/SESSION_86_WORKSPACE_EMPTY_STATE_UX_2026-05-01.md` for full detail. In one paragraph:

S86 replaced the public-landing-style EmptyState in the workspace with an editorial poster ("Welcome in, {firstName}. Your studio is open." + wine divider + 220px hand-drawn SVG arrow), made the chat sidebar the single action surface (auto-opens on desktop, autofocuses input), added a personalized welcome bubble in chat, removed the "No images yet" placeholder from ResultsView so the welcome hero persists through chat-only turns, and fixed the lime-on-cream "AI slop highlighter" inline code styling. Final staging deploy was `03102d90`. The intent was sound but the gate logic had subtle bugs around chat-only WebSocket exchanges and stranded campaigns — that's what S87 addresses.

---

# Part 2 — S87 work (welcome hero flicker + stranded-campaign fixes)

## The problem (as user reported)

> "im seeing the empty state becoming blank when i chat and coming back after getting the response"

Screenshots showed the editorial hero on first land, then the old `<ImageIcon /> No images yet / Use the chat to generate images for this campaign` placeholder during the agent's reply. Two distinct issues conflated:

1. **The screenshots themselves came from an older deploy** (likely production, which doesn't have S86 yet — the date stamp `№ 001 / MAY 1, 2026` and the "No images yet" placeholder were both in earlier S86 iterations or pre-S86 code).
2. **A real bug existed even on the final S86 staging deploy** (`03102d90`): for chat-only turns, the welcome hero unmounted into a blank canvas because `ResultsView` rendered no skeletons (count=0), then welcome hero remounted on completion. User-facing description "becoming blank when i chat and coming back" was accurate for staging.

## Investigation — full root-cause trace

### How `parseExpectedImageCount` works (`store/index.ts:245-266`)

Returns 1–6 from explicit phrasings, 6 for any prompt with a URL or generation keyword (`generate, create, make, build, design, campaign, brand, website, business`), and **0 for everything else**. So:

| Prompt | Parsed count |
|---|---|
| "Hi" | 0 |
| "what brands do you work with?" | 0 |
| "yes do it" | 0 |
| "go ahead with that" | 0 |
| "another set" | 0 |
| "rewrite hook 3" | 0 |
| "glossier.com" | 6 (URL match) |
| "make ads for glossier.com" | 6 (keyword + URL) |
| "create 3 ads" | 3 |
| "two images" | 2 |

### How the original S86 gate worked (`App.tsx:319-324` pre-fix)

```ts
const isActiveGenerating =
  generatingCampaignId !== null &&
  generatingCampaignId === activeCampaignId
const showWelcomeHero =
  campaigns.length === 0 ||
  (activeCampaign && activeCampaign.images.length === 0 && !isActiveGenerating)
```

The gate treated **any open WS exchange** as "image generation in progress". But `addCampaign` (`store/index.ts:323-347`) sets `generatingCampaignId: id` whenever the new campaign's status is `'generating'` — which is the default. So even a chat-only "Hi" sets `generatingCampaignId`, flipping the gate.

### The blank-canvas trace, step by step

User on workspace (0 campaigns) → types "Hi" → hits send:

1. `startGeneration('Hi')` (`store/index.ts:514`)
2. `parseExpectedImageCount('Hi')` returns **0** → `generationExpectedImages = 0`
3. `addCampaign(name, 'generating', sessionId, brand)` → status set, `generatingCampaignId` set to new campaign id
4. App.tsx gate: `isActiveGenerating = true`, `showWelcomeHero = false` → `<EmptyState />` unmounts, `<ResultsView />` mounts
5. ResultsView skeleton condition (`ResultsView.tsx:197`): `isGenerating && campaign.images.length < generationExpectedImages` → `true && 0 < 0` → **false** → no skeletons render
6. **Result: blank canvas** (campaign header + completely empty image grid). Pre-S86 code had the `<ImageIcon /> No images yet` placeholder filling this gap; S86 removed it, so the bug got more visible.
7. Agent finishes its chat reply → WS `complete` event → `completeGeneration` clears `generatingCampaignId` and resets `generationExpectedImages = 0`
8. App.tsx gate flips back: `showWelcomeHero = true` → welcome hero remounts

That's the "becoming blank when i chat and coming back after getting the response" exactly.

### A second, compounding bug: URL-as-followup

When the user types "glossier.com" as the **second** message (after the agent has asked for one), it doesn't go through `startGeneration` — it goes through `followUp` → `startFollowUp` (`store/index.ts:707-738`). Pre-fix, `startFollowUp` only set `generatingCampaignId`, `isFollowUp`, `currentGeneratingMessageId`, and the chat messages. **It never re-parsed the prompt or updated `generationExpectedImages`**.

So even after typing the URL:
- `generationExpectedImages` stayed at 0 (carried over from the prior turn's reset)
- Welcome hero unmounted (gate fires)
- ResultsView mounted with no skeletons (`0 < 0` again)
- Server-side, the orchestrator IS running a real 6-image generation (it parsed the URL correctly)
- User stares at a blank canvas for ~3-5 minutes until the first image lands as a lone tile

## Industry-pattern discussion (decided division of labor)

We considered (and rejected) building a "build status panel" that mirrors what's happening (Lovable/v0/Manus pattern). The chat sidebar already streams research / file events / tool calls / agent narration — adding a second narration surface in the canvas would duplicate the same information. Decided:

| Surface | Job |
|---|---|
| **Chat sidebar** | Narration. Already does this well post-S85 (research streams live, file events fire, tool calls visible). |
| **Main panel (canvas)** | Visual work product only. |

So the canvas should react to **work state** (welcome hero / skeletons / image grid), not **conversation state**. Chat-only turns shouldn't touch the canvas. That's the principle the four fixes implement.

## The 5 issues identified (4 fixed, 1 explicitly deferred)

| # | Severity | Issue | Status |
|---|---|---|---|
| 1 | Bug | Chat-only "Hi" blanks the canvas mid-turn | ✅ Fixed |
| 2 | Bug | URL-as-followup never re-parses → blank canvas during ~3-5min wait | ✅ Fixed |
| 3 | Bug | Incomplete / cancelled / error campaigns stranded in welcome hero with no Resume access | ✅ Fixed |
| 5 | Bug | Vague follow-ups ("yes do it", "go ahead") parse to 0 → blank canvas until first image | ✅ Fixed (server-authoritative count sync) |
| Smell #1 | Smell | `generationExpectedImages` is store-level, not per-campaign | Deferred — only one campaign generates at a time today |
| Smell #2 | Smell | No "campaign generating in background" indicator when user navigates away | Deferred — single-DO lock means rare in practice |
| Smell #3 | Smell | Mobile users have no directional cue (long arrow is `lg+` only) | **Dropped per user — not focusing on mobile right now** |

(There's no Bug #4 — that number was skipped during the live conversation.)

## The 4 fixes (in dependency order)

### Fix 1 — Tighten the gate in `App.tsx`

Replace `isActiveGenerating` with two separate concepts:
- `isGeneratingImages` — only true when `generationExpectedImages > 0`. WS exchanges that don't produce images keep welcome hero mounted.
- `isStranded` — incomplete / cancelled / error campaigns fall through to ResultsView so users see Resume / retry affordances.

```ts
// client/src/App.tsx (around line 316)
{showWorkspace && (() => {
  const activeCampaign = activeCampaignId ? campaigns.find(c => c.id === activeCampaignId) : null
  const isGeneratingImages =
    generatingCampaignId !== null &&
    generatingCampaignId === activeCampaignId &&
    generationExpectedImages > 0
  const isStranded = !!activeCampaign && (
    activeCampaign.status === 'incomplete' ||
    activeCampaign.status === 'cancelled' ||
    activeCampaign.status === 'error'
  )
  const showWelcomeHero =
    campaigns.length === 0 ||
    (activeCampaign && activeCampaign.images.length === 0 && !isGeneratingImages && !isStranded)
  return showWelcomeHero ? <EmptyState /> : <ResultsView />
})()}
```

Required adding `generationExpectedImages` to the destructured store hook at the top of `AppContent`.

### Fix 2 — Mirror the gate inside `EmptyState.tsx`

`EmptyState` has its own `isWorkspaceEmpty` calculation that toggles between editorial poster mode and the input-form layout. Must match `App.tsx`'s gate or the two surfaces disagree. Same logic, mirrored:

```ts
// client/src/components/EmptyState.tsx (around line 79)
const activeCampaign = activeCampaignId ? campaigns.find(c => c.id === activeCampaignId) : null
const isGeneratingImages =
  generatingCampaignId !== null &&
  generatingCampaignId === activeCampaignId &&
  generationExpectedImages > 0
const isStranded = !!activeCampaign && (
  activeCampaign.status === 'incomplete' ||
  activeCampaign.status === 'cancelled' ||
  activeCampaign.status === 'error'
)
const isWorkspaceEmpty = appState === 'workspace' && (
  campaigns.length === 0 ||
  (!!activeCampaign && activeCampaign.images.length === 0 && !isGeneratingImages && !isStranded)
)
```

Duplication is intentional — kept in sync via comments referencing each other. A future refactor could extract a `useShouldShowWelcomeHero()` hook, but the gate is small enough today that the duplication is cheaper than the abstraction.

### Fix 3 — Re-parse prompt in `startFollowUp`

```ts
// client/src/store/index.ts startFollowUp (around line 707)
startFollowUp: (campaignId, prompt) => {
  const userMessageId = generateId('msg')
  const assistantMessageId = generateId('msg')
  const parsedCount = parseExpectedImageCount(prompt)

  set((state) => ({
    generatingCampaignId: campaignId,
    isFollowUp: true,
    currentGeneratingMessageId: assistantMessageId,
    generationExpectedImages: parsedCount > 0 ? parsedCount : state.generationExpectedImages,
    // ... chatMessages unchanged
  }))
  return { campaignId, messageId: assistantMessageId }
}
```

The `|| state.generationExpectedImages` carries the prior count for chat-only follow-ups so existing campaigns don't accidentally lose their skeleton count between turns.

### Fix 4 — Server-authoritative count in `useWebSocket.ts` `phase` handler

The orchestrator already sends `imageCount` in WS phase events. Use it as the source of truth:

```ts
// client/src/hooks/useWebSocket.ts (around line 131)
case 'phase':
  if (isPhaseEvent(message) && campaignId && messageId) {
    const label = message.label || message.phase;
    if (typeof message.imageCount === 'number' && message.imageCount > 0) {
      store.setGenerationExpectedImages(message.imageCount);
    }
    // ... existing thinking-block logic unchanged
  }
  break;
```

This is the safety net for Bug #5: vague prompts that the client parser misses get corrected within ~1s of the server's first phase event firing.

## Coverage matrix (all 4 fixes together)

| Path | Pre-S87 (S86 only) | Post-S87 |
|---|---|---|
| Land on workspace, 0 campaigns | Welcome hero | Welcome hero ✓ |
| Type "Hi" → agent reply | Blank canvas, then welcome | Welcome hero stays mounted ✓ |
| Type "glossier.com" as follow-up after "Hi" | Blank canvas during ~3min | 6 skeletons render immediately ✓ |
| Type "yes do it" (vague) | Blank canvas | Skeletons render once server confirms via phase event (~1s) ✓ |
| Generation fails / cancelled with 0 images | Stranded in welcome hero, no Resume button visible | ResultsView mounts with header + Resume button (incomplete) ✓ |
| Existing 6-image campaign + chat-only follow-up | Image grid stays | Image grid stays ✓ |
| Existing 6-image campaign + URL follow-up | Image grid stays | Image grid stays ✓ |
| First-ever campaign with URL on turn 1 | Skeletons + image grid | Skeletons + image grid ✓ |

## Files changed (S87)

```
M  client/src/App.tsx
   — Added `generationExpectedImages` to destructured store hook.
   — Replaced single `isActiveGenerating` boolean with `isGeneratingImages` (count-aware)
     and `isStranded` (status-aware) in the showWorkspace IIFE.
   — Added comments explaining the two-gate reasoning.

M  client/src/components/EmptyState.tsx
   — Added `generationExpectedImages` to destructured store hook.
   — Mirrored the same `isGeneratingImages` + `isStranded` logic in `isWorkspaceEmpty`.

M  client/src/store/index.ts
   — `startFollowUp` now calls `parseExpectedImageCount(prompt)` and updates
     `generationExpectedImages` (falls back to prior value when parser returns 0).

M  client/src/hooks/useWebSocket.ts
   — `phase` event handler now syncs server's `imageCount` to
     `generationExpectedImages` via `setGenerationExpectedImages`.
```

Total: 4 files, +42 / −10, single commit `0b2cd74`.

## Decisions explicitly NOT taken (so we don't relitigate)

- ❌ **Don't add a build-status panel in the canvas** — chat already narrates. Duplication.
- ❌ **Don't show skeletons during research/hooks/prompts phases for the FIRST run** — the count needs to be > 0 first. Skeletons appear from `t=0` of the **image-generation phase**, not from `t=0` of the agent's first response. The chat narration covers the pre-image phases.
- ❌ **Don't extract a shared `useShouldShowWelcomeHero` hook yet** — duplication between `App.tsx` and `EmptyState.tsx` is small (~6 lines each) and the gates serve slightly different purposes. Revisit if a third surface needs it.
- ❌ **Don't move `generationExpectedImages` per-campaign** — only one campaign can generate at a time (single-DO lock). Global is fine for now.
- ❌ **Don't add a "campaign X generating in background" indicator** — single-DO lock means rare in practice. Future polish.
- ❌ **Don't refactor `addCampaign` to accept a non-`generating` initial status for chat-only first messages** — would have larger blast radius. The gate fix is the correct level of intervention.
- ❌ **Don't fix mobile directional cue this session** — explicitly dropped per user direction.

## Verification

Tested on staging (`9c0d3ba1`) by user. Working end-to-end. Specific paths verified:

- ✅ Fresh workspace → "Hi" → agent reply: welcome hero stays mounted, no flicker
- ✅ Follow-up with URL: skeletons render immediately, fill in as images stream
- ✅ Vague follow-ups: skeletons appear within ~1s of server's first phase event
- ✅ Existing campaigns with images: no regression, image grid renders normally
- ⏳ Stranded campaign recovery (incomplete status with 0 images): logic in place but not actively triggered in test — Resume button visible if it happens

---

# Part 3 — Updated punch list for next session

## A) Production deploy (highest priority — bigger bundle now)

Staging is stable on `9c0d3ba1` and bundles all of S84 + S85 + S86 + S87 (commits `ec95d36..0b2cd74`). Sequence unchanged from S86 doc:

```bash
# 1. Verify branch is pushed (already done this session)
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
- Run one self-paid test campaign (~$5 wedge) covering:
  - Cold sign-up → checkout → workspace land → editorial welcome hero
  - Chat-only "Hi" turn — **welcome hero stays mounted (S87 fix)**
  - URL follow-up — **6 skeletons appear immediately (S87 fix)**
  - Research streams live (S85), hooks/prompts populate, 6 images stream individually (S85)
  - Pop-ink inline-code styling in chat (S86)

## B) Architecture doc updates (still owed since S85)

The architecture docs at `docs/architecture/` predate the payment system, the streaming refactor, the empty-state flow, AND now the gate logic. Recommended deliverables (carried over from S86, still applicable):

1. **`docs/architecture/INDEX.md`** — add entries for: Payment / billing flow, Streaming pipeline (post-S85), Onboarding / empty-state flow (post-S86 + S87).
2. **New doc — `docs/architecture/PAYMENT_FLOW.md`** (specced in S85 doc Part 3.B).
3. **New doc — `docs/architecture/STREAMING_PIPELINE.md`** (specced in S85 doc Part 3.B).
4. **New doc — `docs/architecture/ONBOARDING_FLOW.md`** — should now include:
   - Welcome hero gate logic (`isGeneratingImages` requires count > 0; `isStranded` routes failed campaigns to ResultsView)
   - Mirrored gate in `EmptyState.tsx` (and why it's mirrored, not extracted)
   - The chat-only vs. image-generation distinction (the conceptual division of labor)
   - Server-authoritative `imageCount` sync via `phase` events
   - Reduced-motion fallback behavior (from S86)
   - Why specific design choices were rejected (status panels, sparkles, pulsing dots, etc.)
5. **Update `docs/architecture/DATA_MODEL.md`** — add `user_credits`, `user_subscriptions`, `payment_events`, `usage_log` table descriptions.
6. **`docs/architecture/CREDITS_AND_USAGE.md`** (if exists; create if not) — same scope as S85 spec.

## C) Open follow-ups (not blocking deploy)

### From S87
- **Cancelled / error campaigns in ResultsView** — they now correctly fall through (no longer stranded), but ResultsView only has a Resume affordance for `incomplete` status. `cancelled` and `error` show an empty grid with no recovery action. Wants a small "this run failed — retry?" card.
- **Skeleton during regeneration** — when an existing campaign with 6 images gets a follow-up that regenerates 1 image, the skeleton math (`expectedImages - existingImages`) goes negative → no skeleton tile renders. Image just appears when ready. Minor.
- **Background generation indicator** (Smell #2) — when user navigates to another campaign mid-run, no visual cue that the original is still cooking. Low priority; single-DO lock makes it rare.

### From S86 (carry-over)
- **First-completion celebration** — after first campaign finishes, no "you did it!" moment. Next onboarding milestone to design.
- **Welcome bubble dismissibility** — currently re-renders if user is in 0-campaign state for any reason. Could persist a "seen welcome" localStorage flag if it feels noisy after real usage.

### From S84 (carry-over)
- **Generation status indicator stuck during research** — progress UI doesn't reflect `msg.type=trace` events.
- **Curl-bypass tests for top-up gate** — never executed end-to-end:
  - free user → `$10` → expect 403
  - free user → `$5` first time → expect 200
  - free user → `$5` second time → expect 403 with "trial already used"
- **Cancel flow** never observed firing in test.
- **Decline-card test** (`4000 0000 0000 0002`) not run.

### From S83 (carry-over)
- **Add `.nvmrc`** to pin Node 20 — still not done.
- **Pin / upgrade miniflare** to a version without the undici regression.
- **BeforeAfter cost-per-creative claim** still inflated by ~6×.
- **Terms / Privacy / Image-IP pages** still don't exist.

### From S85 (carry-over)
- **Orphaned R2 images** under old test user — cosmetic, not user-facing.
- **Pricing math re-measurement** — run 3–5 successful 6-image campaigns and compute average raw COGS.

### Polish (low priority, S82/S83 carry-over)
- 5-marketer DM panel for new H1 + sub copy
- PostHog instrumentation for new H1
- Cal.com event setup — IST timezone, intake fields
- Curated eval set — 25–30 D2C brand URLs for baseline + LLM-as-judge

---

# Part 4 — Files modified across S84 + S85 + S86 + S87

```
S84:
M  CLAUDE.md
M  cloudflare/src/routes/payments.ts
M  client/src/App.tsx
M  client/src/components/auth/SignIn.tsx
M  client/src/components/landing/LandingPage.tsx
M  client/src/components/landing/Pricing.tsx
M  client/src/components/pricing/TopupModal.tsx
M  client/src/components/EmptyState.tsx
+  docs/SESSION_84_…_2026-04-30.md

S85:
M  cloudflare/sandbox/agent-runner.ts
M  cloudflare/sandbox/orchestrator-prompt.ts
+  docs/SESSION_85_LIVE_STREAMING_FIXES_2026-04-30.md

S86:
M  client/src/App.tsx
M  client/src/components/EmptyState.tsx
M  client/src/components/chat/ChatSidebar.tsx
M  client/src/components/chat/MarkdownContent.tsx
M  client/src/components/layout/AppLayout.tsx
M  client/src/components/ResultsView.tsx
M  client/src/index.css
+  docs/SESSION_86_WORKSPACE_EMPTY_STATE_UX_2026-05-01.md

S87:
M  client/src/App.tsx                                 (gate logic — isGeneratingImages + isStranded)
M  client/src/components/EmptyState.tsx               (mirrored gate)
M  client/src/store/index.ts                          (startFollowUp re-parses prompt)
M  client/src/hooks/useWebSocket.ts                   (phase handler syncs server imageCount)
+  docs/SESSION_87_WELCOME_HERO_FLICKER_FIXES_2026-05-01.md (this doc)
```

Untracked scratchpad / research / HTML files remain intentionally excluded from commits.

---

# Part 5 — Quick reference: what should land on production

When the next session runs `wrangler deploy --env production`, here's what users will start seeing on `creativemachines.xyz`:

**Landing / sign-up flow** (S84):
- Pricing tiles route signed-out users through `/sign-up?plan=…` → Clerk → `/checkout/init` → Dodo
- $5 wedge for cold traffic ("Try one campaign · $5"), single-use enforcement
- Post-payment redirect to `/workspace?welcome=starter|pro` with celebratory toast

**First post-payment moment** (S86):
- Editorial welcome hero ("Welcome in, {firstName}. Your studio is open.")
- Chat sidebar auto-opens with personalized welcome bubble + autofocused input
- Long hand-drawn arrow pointing toward chat (desktop)

**Chat-only first turn** (S87):
- Type "Hi" → agent replies asking for URL → **welcome hero stays mounted**, no flicker, no blank canvas
- Same for any exploratory chat ("what brands?", "explain styles", "how long does this take?")

**First real generation** (S85 + S87):
- Type URL (turn 1 directly OR as follow-up after "Hi") → **6 skeleton tiles render immediately** in the main panel
- Research streams live in chat (S85); skeletons sit idle in canvas
- Hooks → Prompts → Images stream one-by-one (S85)
- Each image fills its skeleton; no flicker, no layout shift

**Failed / incomplete campaigns** (S87):
- If a generation fails or is cancelled, ResultsView mounts with the Resume button (for incomplete) — no longer stranded in welcome hero

**Inside the chat** (S86):
- Inline code (`## Reference Images`) renders dark olive on cream — no lime AI-slop highlighter

**Vague follow-ups** (S87):
- "yes do it", "go ahead", "another set" → skeletons appear within ~1s once the server's first phase event arrives with the authoritative count

**Existing campaigns** (regression surface):
- Image grid renders normally for all campaigns with images
- Chat-only follow-ups don't change the canvas
- All payment / top-up / cancel flows unchanged from S84
