# Session 60 — UI Rebrand: Monochrome + Coral, Landing Page Redesign

**Date:** 2026-03-27 to 2026-03-28
**Branch:** `new-ui`

---

## What Changed

### 1. Complete Color System Rebrand
**Old:** Dark theme (#0f0f0f) + Electric Coral (#ff6b6b) accent + glow effects
**New:** Monochrome light theme + Coral (#E8553A) as the only accent color

| Token | Old | New |
|---|---|---|
| bg-base | #0f0f0f (dark) | #FAFAFA (cool near-white) |
| bg-raised | #171717 | #FFFFFF |
| bg-elevated | #1f1f1f | #F5F5F5 |
| text-primary | #f5f5f5 | #111111 |
| text-secondary | #a3a3a3 | #666666 |
| text-muted | #666666 | #999999 |
| border | #2a2a2a | #E5E5E5 |
| accent | #ff6b6b (coral) → #7A2E3C (burgundy, rejected) | #E8553A (coral) |
| pop | #4361ee (blue) | #475569 (slate) |
| shadows | dramatic dark (0.3-0.6 opacity) | subtle light (0.04-0.10 opacity) |

**Removed:** All glow effects (`--glow-accent`, `glow-pulse` keyframe, `.glow-accent` utilities), gradient mesh opacity reduced to near-invisible.

**Design philosophy:** Monochrome (black/white/gray) base with coral as the ONLY color. Generated ad images become the visual hero — UI chrome has no color to compete.

**Inspiration:** Pencil.dev (monochrome + one bold accent), Framer (minimal), Vercel (content-forward).

### 2. Product Rename
- **Old:** "Creative Agent"
- **New:** "Creative Machines" (matches domain creativemachines.xyz)
- Updated in header, page title, all references

### 3. Logo & Favicon
- **Favicon:** Black rounded square with white "CM" monogram (`/public/favicon.svg`)
- **Logo SVG:** Two-weight wordmark — "Creative" (coral, regular) + "Machines" (black, bold) (`/public/logo.svg`)
- **Header:** CSS wordmark with same two-weight treatment

### 4. Landing Page Redesign — Header
- **Old:** Full-width fixed bar with Sparkles icon + "Creative Agent" + Sign in button
- **New:** Floating pill navbar (Arcads-style) with glassmorphism — `rounded-full`, gray-tinted frosted glass (`bg-[rgba(235,235,235,0.65)]` + `backdrop-blur-2xl`), centered with max-width, "Login or Sign up" dark pill CTA

### 5. Landing Page Redesign — Hero Section
- **Old:** Centered layout, gradient mesh background, Sparkles icon, single-line search input, connection status pill, floating example chips
- **New:** Split layout (Input → Output pattern)
  - **Left:** Bold heading ("Turn any brand into an ad campaign.") + subtitle + multi-line textarea in card + inline aspect ratio selector + process strip (1→Research → 2→Ad hooks → 3→6 creatives)
  - **Right:** Bento grid of 6 showcase images (sample ad creatives) — staggered entrance animation, hover lift
  - **Mobile:** Stacks vertically

### 6. Component Updates
- **button.tsx:** `glow` variant — removed glow shadows, uses `shadow-md/lg`
- **input.tsx:** Focus ring uses `accent-subtle` instead of glow
- **EmptyState.tsx:** Complete rewrite (3 iterations — centered → split → bento)
- **ImageCard.tsx:** Removed glow shadows
- **orbital-spinner.tsx:** Removed glow shadows from dots
- **SignIn.tsx:** Colors updated to match light theme
- **App.tsx:** Error text `red-400` → `red-600`

---

## Files Changed (9 files)
```
client/index.html ......................... Title + favicon + meta
client/src/index.css ...................... Full color system + animations
client/src/App.tsx ........................ Error text color
client/src/components/EmptyState.tsx ...... Complete rewrite — split hero
client/src/components/ImageCard.tsx ....... Removed glow shadows
client/src/components/auth/SignIn.tsx ..... Light theme colors
client/src/components/layout/LandingHeader.tsx .. Floating pill + glassmorphism
client/src/components/ui/button.tsx ....... Glow variant update
client/src/components/ui/input.tsx ........ Focus ring update
```

## New Files
```
client/public/favicon.svg ................ CM monogram favicon
client/public/logo.svg ................... Two-weight wordmark
client/public/showcase/*.png ............. 6 curated sample ad creatives
docs/nano-banana-2-guide.md .............. NB2 capabilities for logos/ads/creatives
```

---

## Design Decisions & Rationale

### Why Monochrome + Coral?
- Coral (#E8553A) sits in the orange-red "creativity" sweet spot (same zone as Adobe Creative Cloud)
- Monochrome base ensures generated ad images are the only colorful content on screen
- Images pop when UI chrome has no competing color
- Pencil.dev, Vercel, Linear all prove this approach ages well

### Why Not Dark Theme?
- User was tired of dark backgrounds
- 82% of AI tool users prefer dark, but this is a creative tool where image output needs to be viewed on light backgrounds (matching how ads appear on Instagram/Facebook)

### Why Not Warm Cream / Burgundy?
- First attempt used warm cream (#F7F5F2) + burgundy (#7A2E3C) — looked like a blog/editorial site, not a tool
- Cool neutrals (#FAFAFA) read as "tool," warm neutrals read as "magazine"

### Why Split Layout Hero?
- "Input → Output" pattern — left side shows the input, right side shows what comes out
- The page IS the product demo — user instantly sees "URL in, creatives out"
- Every modern AI tool (Claude, v0, ChatGPT) uses a card-style textarea, not a search bar
- Bento grid of 6 images provides visual proof without text explanation

---

## Rejected Directions
1. Dark theme (user preference)
2. Warm cream + burgundy (looked like a blog)
3. Purple/indigo accent (too trendy, may date)
4. Deep olive (Google territory)
5. Scattered absolute-positioned images (looked chaotic)
6. Ticker tape / marquee (needs 12+ images for good loop)

## What's Next
- [ ] Custom Clerk sign-in UI (replace Clerk modal with branded form)
- [ ] Workspace UI update (sidebars, chat, cards in new color system)
- [ ] Optimize showcase images (compress to webp, ~200KB each)
- [ ] Mobile responsive testing
- [ ] Deploy to production
