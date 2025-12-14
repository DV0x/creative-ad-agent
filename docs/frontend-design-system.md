# Frontend Design System

Design documentation for the Creative Machine frontend.

---

## Design Direction: "The Machine Room"

Industrial control panel aesthetic - dark, high-contrast, mechanical precision. A creative factory where you watch your ads being manufactured.

**Core Principles:**
- Mobile-first responsive design
- Industrial/utilitarian aesthetic
- High information density
- Mechanical, purposeful interactions

---

## Typography

| Role | Font | Usage |
|------|------|-------|
| Display | Instrument Serif (italic) | Headlines, branding |
| Body | Space Mono | All UI text, labels, data |

**Size Scale (Mobile-first):**
- `text-[10px]` - Labels, metadata, status
- `text-[11px]` - Terminal output
- `text-xs` (12px) - Desktop labels
- `text-sm` (14px) - Input text
- `text-3xl` → `text-6xl` - Headline (responsive)

---

## Color Palette

### Core

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-void` | #0a0a0a | Background |
| `--color-surface` | #141414 | Card backgrounds |
| `--color-surface-raised` | #1a1a1a | Elevated surfaces |
| `--color-border` | #2a2a2a | Borders, dividers |
| `--color-border-bright` | #3a3a3a | Active borders |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-text-primary` | #fafafa | Headlines, important text |
| `--color-text-secondary` | #888888 | Body text |
| `--color-text-muted` | #555555 | Labels, hints |

### Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent` | #ff6b4a | Primary accent (Electric Coral) |
| `--color-accent-dim` | #cc5038 | Hover states |
| `--color-accent-glow` | rgba(255,107,74,0.15) | Glow effects |

### Status

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-success` | #4ade80 | Success states |
| `--color-error` | #ef4444 | Error states |
| `--color-warning` | #fbbf24 | Warning states |
| `--color-terminal-green` | #39ff14 | Terminal text |
| `--color-terminal-amber` | #ffb000 | Processing indicator |

---

## Component Anatomy

### Card Container

All major UI sections use consistent card structure:

```
┌─────────────────────────────────────────┐
│ LABEL // CONTEXT            STATUS      │  ← Header bar
├─────────────────────────────────────────┤
│                                         │
│              Content Area               │  ← Main content
│                                         │
├─────────────────────────────────────────┤
│ Helper text                    ACTION   │  ← Footer bar (optional)
└─────────────────────────────────────────┘
```

**CSS Pattern:**
```css
.card {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.card-header {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
}

.card-content {
  padding: 0.75rem;
}

.card-footer {
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-void)/50;
}
```

### Labels

Consistent label pattern across all components:

```html
<span class="text-accent text-[10px] font-bold tracking-wider">LABEL</span>
<span class="text-text-muted text-[10px]">//</span>
<span class="text-text-muted text-[10px] tracking-wide">CONTEXT</span>
```

---

## Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile (default) | < 768px | 2-col grid, stacked footer, compact spacing |
| Tablet (md) | ≥ 768px | 3-col grid, inline footer, larger text |
| Desktop (lg) | ≥ 1024px | Max-width container, full spacing |

**Key responsive patterns:**
- `text-[10px] md:text-xs` - Text scaling
- `p-3 md:p-4` - Padding scaling
- `gap-2 md:gap-3` - Gap scaling
- `grid-cols-2 md:grid-cols-3` - Grid columns
- `hidden md:block` - Desktop-only elements

---

## Animations

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
```

### Cursor Blink
```css
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
.cursor-blink {
  animation: blink 1s step-end infinite;
}
```

### Pulse Glow
```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

### Stagger Delays
```css
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
/* ... up to stagger-6 */
```

---

## Component Reference

### PromptInput

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | `INPUT` + status dot | `INPUT // DIRECTIVE` + status |
| Textarea | 2 rows, full width | 2 rows, full width |
| Footer | Button only | Hint text + button |
| Button | `EXECUTE →` | `EXECUTE →` |

### ProgressDots

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | `PIPELINE 1/6` | `PIPELINE 1/6` + status |
| Progress bar | 0.5px height | 0.5px height |
| Stages | 6 boxes, flex scroll | 6 boxes, equal width |
| Labels | 9px uppercase | 10px uppercase |

### Terminal

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | `LOG` + count | `LOG` + count + dots |
| Content | 200px max-height | 280px max-height |
| Font size | 11px | 12px |
| Footer | Status only | Status + timestamp |

### ImageGrid

| Element | Mobile | Desktop |
|---------|--------|---------|
| Header | `OUTPUT 0/6` | `OUTPUT 0/6` + download |
| Grid | 2 columns | 3 columns |
| Gap | 8px | 12px |
| Cards | No hover overlay | Hover overlay with "VIEW" |

---

## File Structure

```
client/src/
├── index.css              # Theme tokens, global styles, animations
├── App.tsx                # Layout shell
├── components/
│   ├── PromptInput.tsx    # Input card with header/footer
│   ├── ProgressDots.tsx   # Pipeline progress display
│   ├── Terminal.tsx       # Log output display
│   ├── ImageGrid.tsx      # Output gallery container
│   ├── ImageCard.tsx      # Single image with loading states
│   └── ImageLightbox.tsx  # Full-screen image viewer
├── hooks/
│   └── useGenerate.ts     # SSE generation logic
├── store/
│   └── index.ts           # Zustand state management
├── api/
│   ├── config.ts          # API base URL config
│   └── parseSSE.ts        # SSE stream parser
└── types/
    └── index.ts           # TypeScript types
```

---

## Design Decisions

### Why dark theme?
- Reduces eye strain during extended use
- Creates focus on the colorful generated images
- Matches "machine room" / developer tool aesthetic

### Why monospace throughout?
- Reinforces the "machine" / technical feel
- Better readability for data-heavy UI
- Consistent character widths for alignment

### Why no rounded corners?
- Industrial, utilitarian aesthetic
- Sharp edges = precision, mechanical feel
- Differentiates from generic "friendly" AI tools

### Why Electric Coral accent?
- High contrast against dark background
- Warm color balances cold industrial feel
- Memorable, distinctive brand color

---

*Last updated: 2025-01-13*
