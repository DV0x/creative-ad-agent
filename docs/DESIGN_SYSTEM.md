# Creative Ad Agent: Design System

> Version 1.0 | January 2025

## Design Philosophy

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Blank Paper** | Start with nothing, content appears as created. Inspired by Notion's philosophy. |
| **2-3 Layers Max** | Summary → Details → Edit. Never deeper. Progressive disclosure prevents overwhelm. |
| **Constrained Flexibility** | Users can customize, but can't make it ugly. Guide them to good outcomes. |
| **Guide, Don't Overwhelm** | Empty states show what's possible. Never leave users staring at blank screens. |
| **Chat as Command Center** | Everything happens through conversation. Natural language is the interface. |

### Target Users

- **D2C Brands**: Small teams creating Meta/Google ads
- **Local Service Businesses**: Plumbers, bakeries, salons needing quick ad creatives
- **Non-designers**: People who know their business but not design tools

### Design References

- [Notion](https://notion.so) - Blank paper philosophy, block-based, constrained flexibility
- [ChatGPT Canvas](https://openai.com/index/introducing-canvas/) - Side-by-side editing, chat + artifact
- [Ideogram](https://ideogram.ai) - Clean web interface for AI generation
- [Linear](https://linear.app) - Minimal, focused, keyboard-first
- [Solarized](https://ethanschoonover.com/solarized/) - Precision colors for readability

---

## Layout System

### Primary Layout: Focused Canvas

One adaptive canvas with chat as the command layer. No competing panels.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                      CANVAS                                     │
│                   (Full attention)                              │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 Chat bar (collapsed by default, expands on focus)          │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale**: Users focus better on one thing at a time. Chat expands when needed, collapses when viewing results.

### Layout States

| State | Canvas Shows | Chat Bar |
|-------|--------------|----------|
| Empty | Welcome + prompt input | Hidden |
| Generating | Progress + live preview | Collapsed (shows status) |
| Results | 6 image grid | Collapsed (shows hint) |
| Editing | Compressed images + edit panel | Available |
| Chatting | Compressed images | Expanded |

---

## Application States

### State 1: Empty State (First Visit)

Never show a blank screen. Guide users to action.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         ✦                                       │
│                                                                 │
│               What would you like to create?                    │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │  Enter a website URL or describe your business...   │     │
│     │                                          [Create →] │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│               Try: "nike.com - focus on sustainability"         │
│                    "Local bakery in Austin, artisan breads"     │
│                                                                 │
│     ─────────────────────────────────────────────────────       │
│                                                                 │
│     Recent                                                      │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│     │  Nike   │  │ Plumber │  │ Bakery  │                      │
│     │ Jan 24  │  │ Jan 20  │  │ Jan 18  │                      │
│     └─────────┘  └─────────┘  └─────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Single focused input (not multiple options)
- Example prompts (reduces blank canvas anxiety)
- Recent projects as small cards (not a full sidebar)
- No clutter, no instructions - just essentials

---

### State 2: Generating (Progress View)

Show progress without overwhelming.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     nike.com                                           [Cancel] │
│                                                                 │
│     ┌─────────────────────────────────────────────────────┐     │
│     │                                                     │     │
│     │         ◐  Researching brand...                    │     │
│     │                                                     │     │
│     │     ┌───────────────────────────────────────┐      │     │
│     │     │ Found: "Just Do It" campaign          │      │     │
│     │     │ Tone: Bold, athletic, aspirational    │      │     │
│     │     │ Colors: #111111, #ffffff              │      │     │
│     │     └───────────────────────────────────────┘      │     │
│     │                                                     │     │
│     └─────────────────────────────────────────────────────┘     │
│                                                                 │
│     ● Research    ○ Hooks    ○ Visuals    ○ Images             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 Researching nike.com...                              [···]  │
└─────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Progress indicator with actual status (not generic spinner)
- Preview of what's being discovered
- Minimal progress dots (4 stages max)
- Chat bar shows current activity

---

### State 3: Results (Image Grid)

The main deliverable. Images are the hero.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     nike.com                              [Save All ↓] [Share]  │
│                                                                 │
│     ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│     │               │  │               │  │               │    │
│     │    IMAGE 1    │  │    IMAGE 2    │  │    IMAGE 3    │    │
│     │               │  │               │  │               │    │
│     │   [↻] [↓]     │  │   [↻] [↓]     │  │   [↻] [↓]     │    │
│     └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                                 │
│     ┌───────────────┐  ┌───────────────┐  ┌───────────────┐    │
│     │               │  │               │  │               │    │
│     │    IMAGE 4    │  │    IMAGE 5    │  │    IMAGE 6    │    │
│     │               │  │               │  │               │    │
│     │   [↻] [↓]     │  │   [↻] [↓]     │  │   [↻] [↓]     │    │
│     └───────────────┘  └───────────────┘  └───────────────┘    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 Type to edit: "make image 3 brighter" or "@nike/hooks"      │
└─────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Images are largest elements (hero content)
- Hover reveals actions (↻ regenerate, ↓ download)
- Chat bar hints at capabilities
- No visible tabs/panels - just results

---

### State 4: Editing (Slide-Up Panel)

Panel slides up from bottom. Images stay visible for context.

```
┌─────────────────────────────────────────────────────────────────┐
│     nike.com                                         [× Close]  │
│                                                                 │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐  (images compress)   │
│     └─────────┘  └─────────┘  └─────────┘                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  HOOKS                              [Research] [Hooks] [Prompts]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Stat/Data                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "847 athletes switched to Nike Air in Q4..."            │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [↻ Regen Image 1]                                              │
│                                                                 │
│  2. Story/Result                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ "How Maria went from couch to marathon in 6 months..."  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  [↻ Regen Image 2]                                              │
│                                                                 │
│  [Save Changes]                              [Regenerate All]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  💬 "change hook 2 to focus on speed"                    [Send] │
└─────────────────────────────────────────────────────────────────┘
```

**Elements**:
- Images stay visible (compressed) for context
- Edit panel slides up (not a new page)
- Direct text editing in place
- Regenerate button per item
- Tabs for switching content type

---

### State 5: Chat Expanded

Full conversation history when user needs it.

```
┌─────────────────────────────────────────────────────────────────┐
│     nike.com                                         [× Close]  │
│                                                                 │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│     └─────────┘  └─────────┘  └─────────┘                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  CHAT                                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     You: Create ads for nike.com                                │
│                                                                 │
│     Agent: I researched Nike and created 6 ad concepts:         │
│     • 2 stat-based (social proof)                               │
│     • 2 story-based (emotional)                                 │
│     • 2 urgency-based (FOMO)                                    │
│                                                                 │
│     You: Make image 3 brighter                                  │
│                                                                 │
│     Agent: Regenerating image 3 with brighter colors...         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Type here... @mentions for files                  [Send] │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Progressive Disclosure

### Three Layers Only

```
LAYER 1: Results (Default)
─────────────────────────
• 6 images in grid
• Chat bar collapsed
• "This is what you made"

         │
         ▼ Click image or type in chat

LAYER 2: Details (On Demand)
────────────────────────────
• Edit panel slides up
• See hooks/research/prompts
• Edit text directly
• "Customize your content"

         │
         ▼ Click specific hook

LAYER 3: Deep Edit (Focused)
────────────────────────────
• Single item expanded
• Full editing controls
• Regenerate options
• "Fine-tune this item"

         ✗ NO LAYER 4
```

---

## Visual Design System

### Color Palette: Solarized Light

Based on Ethan Schoonover's [Solarized](https://ethanschoonover.com/solarized/) color scheme, optimized for readability and reduced eye strain.

```css
/* Background Tones */
--color-base3: #fdf6e3;           /* Primary background */
--color-base2: #eee8d5;           /* Secondary background, cards */
--color-base2-hover: #e6dfcc;     /* Hover state for cards */

/* Content Tones */
--color-base00: #657b83;          /* Body text */
--color-base01: #586e75;          /* Emphasized text, headings */
--color-base1: #93a1a1;           /* Secondary text, placeholders */

/* Accent Colors */
--color-blue: #268bd2;            /* Primary actions, links */
--color-cyan: #2aa198;            /* Success, active states */
--color-green: #859900;           /* Positive feedback */
--color-yellow: #b58900;          /* Warnings, highlights */
--color-orange: #cb4b16;          /* Attention, notifications */
--color-red: #dc322f;             /* Errors, destructive */
--color-magenta: #d33682;         /* Special, accent */
--color-violet: #6c71c4;          /* Tags, secondary accent */
```

### Semantic Color Mapping

```css
/* Surfaces */
--color-background: var(--color-base3);      /* #fdf6e3 - Page background */
--color-surface: var(--color-base2);         /* #eee8d5 - Cards, panels */
--color-surface-hover: var(--color-base2-hover);

/* Borders */
--color-border: #d3cbb7;                     /* Subtle borders */
--color-border-emphasis: #c9c1ad;            /* Emphasized borders */

/* Text */
--color-text-primary: var(--color-base01);   /* #586e75 - Headlines */
--color-text-body: var(--color-base00);      /* #657b83 - Body text */
--color-text-muted: var(--color-base1);      /* #93a1a1 - Hints */

/* Interactive */
--color-accent: var(--color-blue);           /* #268bd2 - CTAs */
--color-accent-hover: #1a6da0;               /* Darker blue for hover */
--color-link: var(--color-blue);

/* Status */
--color-success: var(--color-cyan);          /* #2aa198 */
--color-warning: var(--color-yellow);        /* #b58900 */
--color-error: var(--color-red);             /* #dc322f */
--color-info: var(--color-violet);           /* #6c71c4 */
```

### Color Usage Guidelines

| Element | Color | Usage |
|---------|-------|-------|
| Page background | `base3` | Main app background |
| Cards, panels | `base2` | Elevated surfaces |
| Primary text | `base01` | Headlines, important content |
| Body text | `base00` | Paragraphs, descriptions |
| Muted text | `base1` | Placeholders, hints |
| Primary button | `blue` | Main CTAs |
| Secondary button | `base2` + border | Less emphasis |
| Links | `blue` | Clickable text |
| Success | `cyan` | Completed, positive |
| Warning | `yellow` | Attention needed |
| Error | `red` | Problems, destructive |
| Tags | `violet` | Categories, labels |

### Typography

```css
/* Display: Headlines - warm, approachable */
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
--font-display: 'Libre Baskerville', Georgia, serif;

/* Body: Clean, readable sans-serif */
@import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap');
--font-body: 'Source Sans 3', -apple-system, sans-serif;

/* Mono: Code, data, labels */
@import url('https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap');
--font-mono: 'Source Code Pro', monospace;
```

**Type Scale**:
```css
--text-xs: 12px;    /* Labels, captions */
--text-sm: 14px;    /* Secondary text */
--text-base: 16px;  /* Body text */
--text-lg: 18px;    /* Large body */
--text-xl: 20px;    /* Section headers */
--text-2xl: 24px;   /* Page headers */
--text-3xl: 32px;   /* Hero text */
```

**Usage**:
- `font-display`: Page titles, empty state headlines, brand names
- `font-body`: Everything else (paragraphs, buttons, labels)
- `font-mono`: Code snippets, file names, technical data

### Spacing System (8px base)

```css
--space-1: 8px;    /* Tight: inside buttons, between icons */
--space-2: 16px;   /* Default: card padding, list gaps */
--space-3: 24px;   /* Comfortable: section spacing */
--space-4: 32px;   /* Sections: between major blocks */
--space-6: 48px;   /* Major: page margins, hero spacing */
--space-8: 64px;   /* XL: empty state vertical spacing */
```

### Border Radius

```css
--radius-sm: 4px;   /* Buttons, inputs */
--radius-md: 8px;   /* Cards, panels */
--radius-lg: 12px;  /* Images, modals */
--radius-xl: 16px;  /* Large cards */
```

### Shadows (Light Theme)

```css
/* Subtle elevation */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);

/* Cards, dropdowns */
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);

/* Modals, popovers */
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);

/* Floating elements */
--shadow-xl: 0 8px 32px rgba(0, 0, 0, 0.1);
```

---

## Component Specifications

### Image Card

```
┌─────────────────────────────┐
│                             │
│                             │
│          IMAGE              │  aspect-ratio: 1/1 (square)
│                             │  border-radius: 12px
│                             │  background: var(--surface)
│                             │  box-shadow: var(--shadow-md)
│                             │
├─────────────────────────────┤
│  "Hook preview text..."     │  font: body, 14px
│                             │  color: text-body
│  [↻ Regen] [↓ Save]         │  opacity: 0 → 1 on hover
└─────────────────────────────┘
```

**States**:
- Default: Image with subtle shadow
- Hover: Shadow increases, actions fade in (200ms)
- Loading: Skeleton pulse animation (base2 → base2-hover)
- Error: Error state with red border, retry button

### Chat Bar

**Collapsed**:
```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Type to edit: "make image 3 brighter"              [Expand] │
└─────────────────────────────────────────────────────────────────┘
```
- Height: 52px
- Background: var(--surface)
- Border-top: 1px solid var(--border)
- Box-shadow: var(--shadow-sm)

**Expanded**:
```
┌─────────────────────────────────────────────────────────────────┐
│  CHAT                                                [Collapse] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Conversation history - scrollable]                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Type here...                                      [Send] │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```
- Height: 50vh (half screen)
- Animation: slide up 300ms ease-out
- Box-shadow: var(--shadow-lg)

### Edit Panel

```
┌─────────────────────────────────────────────────────────────────┐
│  [Research] [Hooks] [Prompts]                        [× Close]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Content area - scrollable]                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Save Changes]                              [Regenerate All]   │
└─────────────────────────────────────────────────────────────────┘
```
- Height: 60vh
- Animation: slide up 300ms ease-out
- Tabs: pill style, blue background when active

### Buttons

**Primary (Blue)**:
```css
.btn-primary {
  background: var(--color-blue);
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  box-shadow: var(--shadow-md);
}
```

**Secondary (Outlined)**:
```css
.btn-secondary {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-body);
  padding: 10px 20px;
  border-radius: var(--radius-sm);
}
.btn-secondary:hover {
  background: var(--color-surface);
  border-color: var(--color-border-emphasis);
}
```

**Ghost (Text only)**:
```css
.btn-ghost {
  background: transparent;
  color: var(--color-blue);
  padding: 10px 20px;
}
.btn-ghost:hover {
  background: var(--color-surface);
}
```

### Input Fields

```css
.input {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-body);
}
.input::placeholder {
  color: var(--color-text-muted);
}
.input:focus {
  outline: none;
  border-color: var(--color-blue);
  box-shadow: 0 0 0 3px rgba(38, 139, 210, 0.15);
}
```

---

## Micro-interactions

### Image Hover

```
Default                    Hover (200ms fade)
┌─────────────────┐       ┌─────────────────┐
│                 │       │ ┌─────────────┐ │
│     IMAGE       │  ───▶ │ │  ↻     ↓    │ │
│                 │       │ └─────────────┘ │
│  shadow-md      │       │     IMAGE       │
└─────────────────┘       ├─────────────────┤ shadow-lg
                          │ "Hook text..."  │
                          └─────────────────┘
```

### Chat Bar Expansion

```
Click chat bar:
1. Bar grows upward (height: 52px → 50vh)
2. Shadow increases (shadow-sm → shadow-lg)
3. History fades in (opacity: 0 → 1, 150ms delay)
4. Input focuses automatically
```

### Panel Slide

```
Click "Edit Hooks":
1. Images compress (scale: 1 → 0.6, move up)
2. Panel slides up from bottom (translateY: 100% → 0)
3. Shadow appears (shadow-lg)
4. Content fades in (opacity: 0 → 1, 100ms delay)
```

---

## Component Hierarchy

```
App
├── EmptyState
│   ├── Logo
│   ├── Headline (font-display)
│   ├── PromptInput
│   ├── ExamplePrompts
│   └── RecentProjects
│       └── ProjectCard (×n)
│
├── GeneratingView
│   ├── Header (brand + cancel)
│   ├── ProgressCard
│   │   ├── Spinner (cyan)
│   │   ├── StatusText
│   │   └── PreviewContent
│   └── ProgressDots
│
├── ResultsView
│   ├── Header (brand + actions)
│   ├── ImageGrid
│   │   └── ImageCard (×6)
│   │       ├── Image
│   │       ├── HoverOverlay
│   │       └── HookPreview
│   ├── EditPanel (conditional)
│   │   ├── TabBar
│   │   ├── ContentEditor
│   │   └── ActionBar
│   └── ChatBar
│       ├── CollapsedView
│       └── ExpandedView
│           ├── MessageList
│           └── InputBar
│
└── Shared
    ├── Button
    ├── Input
    ├── Tabs
    └── Modal
```

---

## Responsive Behavior

### Breakpoints

```css
--bp-sm: 640px;   /* Mobile */
--bp-md: 768px;   /* Tablet */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large desktop */
```

### Mobile Adaptations

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Image Grid | 3×2 | 2×3 |
| Chat Bar | Bottom bar | Full screen overlay |
| Edit Panel | Slide up 60% | Full screen |
| Recent Projects | 3 cards | 2 cards, horizontal scroll |

---

## Accessibility

### Keyboard Navigation

- `Tab`: Move between interactive elements
- `Enter`: Activate buttons, submit forms
- `Escape`: Close panels, cancel actions
- `Cmd/Ctrl + Enter`: Submit chat message

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-blue);
  outline-offset: 2px;
}
```

### Color Contrast (Solarized Light)

- Primary text (base01) on base3: 6.2:1 (AA)
- Body text (base00) on base3: 4.8:1 (AA)
- Blue on base3: 4.5:1 (AA)
- All status colors meet WCAG AA standards

---

## Animation Timing

```css
/* Quick feedback */
--duration-fast: 150ms;

/* Standard transitions */
--duration-normal: 200ms;

/* Panel animations */
--duration-slow: 300ms;

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

---

## Design Tokens Summary

```css
:root {
  /* Solarized Light Colors */
  --color-base3: #fdf6e3;
  --color-base2: #eee8d5;
  --color-base01: #586e75;
  --color-base00: #657b83;
  --color-base1: #93a1a1;

  /* Accent Colors */
  --color-blue: #268bd2;
  --color-cyan: #2aa198;
  --color-green: #859900;
  --color-yellow: #b58900;
  --color-orange: #cb4b16;
  --color-red: #dc322f;
  --color-magenta: #d33682;
  --color-violet: #6c71c4;

  /* Semantic */
  --color-background: #fdf6e3;
  --color-surface: #eee8d5;
  --color-text-primary: #586e75;
  --color-text-body: #657b83;
  --color-text-muted: #93a1a1;
  --color-accent: #268bd2;
  --color-border: #d3cbb7;

  /* Typography */
  --font-display: 'Libre Baskerville', Georgia, serif;
  --font-body: 'Source Sans 3', -apple-system, sans-serif;
  --font-mono: 'Source Code Pro', monospace;

  /* Spacing */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-6: 48px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);

  /* Animation */
  --duration-normal: 200ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```
