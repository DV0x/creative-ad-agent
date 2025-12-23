# Soft Brutalism + 3D Clay

Bold neo-brutalist borders and typography combined with warm, handcrafted 3D clay elements. The contrast between hard geometric frames and soft organic clay creates visual tension that stops the scroll.

**Prerequisites:** Hook-bank file must exist. Main Agent triggers hook-methodology skill first.

---

## Step 1: Load Hook Bank

Read the hook-bank file for brand data.

**Location:** `agent/.claude/skills/hook-methodology/hook-bank/`

**Process:**
1. List files matching `{brand}-*.md` in the hook-bank folder
2. Sort by date (from filename: `{brand}-YYYY-MM-DD.md`)
3. Read the most recent file (unless user specified a date)
4. Extract: Brand colors, ICP summary, 6 hook concepts

---

## Style Overview

**What it is:** Bold neo-brutalist borders and typography combined with warm, handcrafted 3D clay elements.

**Why it works:**
- Hard borders = confidence, stability
- Soft clay = human touch, approachability
- The contrast creates visual tension that stops the scroll
- Handmade aesthetic differentiates from stock photo competitors


## Visual Characteristics

| Element | Specification |
|---------|---------------|
| Borders | Thick, intentional (8-12px) in warm colors |
| Clay texture | Visible finger-pressed impressions, handmade feel |
| Finish | Matte with subtle highlights catching edges |
| Edges | Soft, rounded on dimensional elements |
| Negative space | 40%+ of composition |
| Shadows | Soft, grounding objects in space |

---

## Default Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary Warm | Terracotta | #C4755B |
| Secondary Calm | Sage Green | #87A087 |
| Neutral Light | Warm Cream | #F5F0E8 |
| Neutral Dark | Deep Charcoal | #2D2D2D |
| Accent Energy | Warm Coral | #E8846B |

**Brand Color Integration:** Use brand primary for hero object or border, brand secondary for background. Fall back to defaults for missing colors.

---

## Step 2: Create Visual Concepts

For each hook, identify:
1. What's the **before** feeling? → Visual tension
2. What's the **after** feeling? → Visual resolution
3. What object represents this transformation? → The hero object

### Visual Metaphor Library

| Metaphor | Visual | Emotional Territory |
|----------|--------|---------------------|
| **The Key** | Oversized clay key, home-shaped head | Achievement, trust |
| **The Bridge** | Two platforms connected by bridge | Progress, journey |
| **The Roots** | House with organic roots beneath | Stability, belonging |
| **The Door** | Standalone door ajar with warm glow | Possibility, invitation |

**Expand to:** Ladders, compasses, anchors, nests, seeds growing, puzzle pieces, lighthouses, pathways, umbrellas, blueprints coming to life and go beyond these examples.

**The rule:** Match metaphor to the emotional truth of the hook.

---

## Step 3: Apply Design Principles

### 1. Intentional Contrast
- Soft clay + hard borders
- Warm terracotta + cool sage
- Bold headlines + delicate supporting text

### 2. Strategic Negative Space
- 40%+ of composition should breathe
- One hero object, not a cluttered scene

### 3. Typography as Architecture
- Headlines have weight and presence
- Clear hierarchy: primary → secondary → tertiary
- Sans-serif for modernity, serif for premium

**Text Rendering (Critical for Nano Banana):**
- Always specify exact text in quotes: `"YOUR FIRST HOME"`
- Define font style explicitly: `bold, white, sans-serif font`
- State position clearly: `at the top`, `bottom-left corner`
- For multi-line, describe stacking: `stacked vertically`
- Keep headlines SHORT (2-4 words) for reliable rendering

### 4. Materiality Creates Believability
- Visible finger-pressed impressions in clay
- Soft shadows grounding objects in space
- Matte finishes with subtle light catching edges

### 5. Emotional Truth Over Features
- Not "Fast pre-approval" → "Confidence when you need it"
- Not "Low rates" → "More room to breathe"

### 6. Distinctive Signature
- Consistent color palette
- Recurring border treatment
- Same clay materiality

---

## Step 4: Write Prompts

### Prompt Structure

```
[FORMAT]
Create a [1:1/9:16] social media ad image.

[SCENE]
[Description of the visual metaphor — what the viewer sees, the hero object, the emotional story]

[MATERIALITY]
[Clay texture: finger-pressed impressions, matte finish, soft highlights]
[Surface quality: warm cream background, soft shadows grounding objects]

[COMPOSITION]
[Layout: negative space percentage, hero object position]
[Framing: thick [Xpx] [color] border — neo-brutalist, intentional]
[Visual hierarchy: what draws the eye first, second, third]

[TYPOGRAPHY]
HEADLINE: "[EXACT TEXT IN CAPS]"
- Font: Bold [weight] [style] sans-serif
- Color: [hex or description]
- Position: [top/bottom] [left/center/right], [stacked vertically if multi-line]
- Size: Large, dominant, architectural presence

SUBTEXT: "[exact supporting text]"
- Font: [lighter weight], same family
- Color: [hex or description]
- Position: Below headline / [specific location]

[LIGHTING]
[Light direction: upper-left, soft diffused, golden hour, etc.]
[How light catches the clay edges and creates highlights]

[MOOD]
[One line — the emotional direction, what it should NOT feel like]

[TECHNICAL]
Aspect ratio [1:1 or 9:16], 2K resolution.
```

**Text Rendering Best Practices:**
- Headline text MUST be in quotes and ALL CAPS
- Specify font weight (Bold, Extra Bold, Black)
- State exact position (top third, bottom-left corner)
- Keep headlines to 2-4 words for reliable rendering
- Describe text as "rendered in" or "displayed as" for clarity

### Aspect Ratios

| Ratio | Platform |
|-------|----------|
| 1:1 | Meta Feed, Instagram Feed |
| 9:16 | Instagram Stories, Reels |

**Default mix:** 3 at 1:1, 3 at 9:16

---

## Example Prompts

### Example 1: "The Key Moment" (1:1)

```
Create a 1:1 social media ad image.

SCENE:
A single oversized house key made of warm terracotta clay, positioned slightly off-center to the right. The key has satisfying weight and dimensionality. The key head is shaped like a simplified home silhouette — immediately recognizable, emotionally resonant.

MATERIALITY:
Clay texture: visible finger-pressed impressions across the key surface, soft rounded edges, matte finish. Soft highlights catch light from upper-left, giving the clay depth and tactile appeal. The key feels handmade, precious.

COMPOSITION:
Layout: 45% negative space on the left, hero key on the right
Framing: 8px warm coral (#E8846B) border — thick, confident, neo-brutalist
Background: Soft sage green (#87A087), flat and calm
Visual hierarchy: Key first, headline second, subtext third

TYPOGRAPHY:
HEADLINE: "YOUR FIRST HOME"
- Font: Extra Bold condensed sans-serif
- Color: Deep charcoal (#2D2D2D)
- Position: Left side, stacked vertically in the negative space
- Size: Large, architectural presence

SUBTEXT: "starts with the right guide"
- Font: Medium weight, same sans-serif family
- Color: Warm coral (#E8846B) matching the border
- Position: Below headline, left-aligned

LIGHTING:
Soft diffused light from upper-left. Gentle highlights on clay edges. Soft shadow beneath the key grounding it in space.

MOOD:
Warm confidence — not corporate, not salesy. Like a trusted friend handing you something valuable.

Aspect ratio 1:1, 2K resolution.
```

### Example 2: "The Bridge" (1:1)

```
Create a 1:1 social media ad image.

SCENE:
A miniature 3D clay diorama showing two platforms connected by a bridge. Left platform: a small building in muted gray clay ("where you are"). Right platform: a larger building in warm terracotta ("where you're going"). Between them, a solid bridge in sage green clay. The scene tells a story of growth and progress.

MATERIALITY:
Clay texture: subtle fingerprint impressions on all surfaces, soft rounded edges, matte finish with gentle highlights. Each building has handmade charm — slightly imperfect, clearly crafted with care.

COMPOSITION:
Layout: Scene centered, 30% negative space above for headline
Framing: 10px black (#2D2D2D) border — neo-brutalist, bold, confident
Background: Creamy off-white (#F5F0E8) surface beneath the scene
Camera: Slightly elevated 3/4 angle, looking down at the diorama
Visual hierarchy: Bridge connection first, buildings second, text third

TYPOGRAPHY:
HEADLINE: "GROW INTO YOUR NEXT SPACE"
- Font: Bold architectural sans-serif
- Color: Deep charcoal (#2D2D2D)
- Position: Top of frame, centered
- Size: Dominant, commanding

SUBTEXT: "Commercial financing, simplified"
- Font: Light weight, same family
- Color: Warm terracotta (#C4755B)
- Position: Below headline, centered

LIGHTING:
Soft golden hour light from upper-right. Warm highlights on the terracotta building. The bridge catches light, drawing the eye to the connection.

MOOD:
Momentum and possibility — not intimidating financial jargon. Progress feels achievable.

Aspect ratio 1:1, 2K resolution.
```

---

## Anti-Patterns (Never Do)

- Stock photo concepts (handshake, happy family)
- Obvious metaphors without twist
- Cluttered compositions (multiple hero objects)
- Generic clay (no fingerprint texture)
- Typography as afterthought
- Corporate cold aesthetic
- Aggressive urgency ("ACT NOW")
- Clay that looks like plastic
- Borders under 6px

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

```json
{
  "brand": "brandname",
  "style": "soft-brutalism-clay",
  "brandColors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "concepts": [{
    "concept": 1,
    "story": {
      "hookType": "Direct-Address|Contrast|Question|etc",
      "hookSource": "Research section + element",
      "hookTarget": "ICP segment or General",
      "visualMetaphor": "key|bridge|door|roots|etc",
      "psychology": "Why the hook works",
      "hook": "The headline text",
      "body": "Supporting copy",
      "cta": "Call to action text"
    },
    "stage": {
      "heroObject": "Description of the main clay element",
      "background": "Color and treatment",
      "border": "Xpx color style",
      "negativeSpace": "percentage and position"
    },
    "prompt": "Full prompt text...",
    "aspectRatio": "1:1",
    "size": "2K"
  }]
}
```

**Aspect Ratio Mix:** Default 6 at 1:1 (or as specified)

---

## Input Compatibility

Reads hook-bank in the new Research-First format:
- **Type** (hook type)
- **Source** (research section + element)
- **Target** (ICP segment)
- **Hook** (headline)
- **Body + CTA**
- **Psychology** (why it works — use for visual metaphor selection)

---

## Done

After writing prompts.json, this skill is complete. Main Agent handles image generation via MCP.
