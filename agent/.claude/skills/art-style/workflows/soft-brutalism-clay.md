# Soft Brutalism + 3D Clay

Workflow for generating scroll-stopping image prompts in the Soft Brutalism + 3D Clay style.

**Note:** This skill expects the hook-bank file to already exist. Main Agent triggers hook-methodology skill before this skill.

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

## Step 4: Write Prompts using UltraThink

### Prompt Structure

```
[FORMAT & PLATFORM]
Create a [aspect ratio] [platform] ad for [client type].

[THE CONCEPT]
The scene/visual: [Description of the visual metaphor]

[MATERIALITY]
[Textures, surfaces, light behavior, tactile qualities]

[COMPOSITION]
[Layout, negative space, framing, visual hierarchy]

[TYPOGRAPHY]
[Headlines, supporting text, placement, style]

[EMOTIONAL NOTE]
[The mood, what it should evoke, what it should NOT feel like]

[TECHNICAL]
Aspect ratio [X:X], high resolution for [platform] placement.
```

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
Create a square social media ad for a mortgage broker targeting first-time homebuyers.

The scene: A single oversized house key made of glossy terracotta clay, positioned slightly off-center to the right. The key has satisfying weight and dimensionality—you can see the subtle finger-pressed texture in the clay, soft highlights catching light from the upper left. The key head is shaped like a simplified home silhouette.

Behind the key, a soft sage green background with a thick, confident 8-pixel warm coral border framing the entire composition. The border feels hand-drawn but precise—intentionally imperfect.

In the generous negative space to the left, bold sans-serif text reads "YOUR FIRST HOME" in deep charcoal, stacked vertically. Below it, smaller but equally confident: "starts with the right guide" in the same coral as the border.

The mood is warm confidence—not corporate, not salesy. Like a trusted friend handing you something valuable.

Aspect ratio 1:1, high resolution for Meta feed placement.
```

### Example 2: "The Bridge" (1:1)

```
Design a vertical Instagram story ad for commercial mortgage services.

The concept: A miniature 3D clay scene showing two platforms—one representing "where you are" (a small building in muted gray clay) and one representing "where you're going" (a larger building in warm terracotta). Between them, a solid bridge in sage green clay connects the two.

The entire scene sits on a creamy off-white surface, shot from a slightly elevated 3/4 angle. The clay has that satisfying handmade quality—subtle fingerprint impressions, soft rounded edges, matte finish with gentle highlights.

Frame the scene with a thick black border (neo-brutalist style) but keep the interior warm and approachable.

Typography: "GROW INTO YOUR NEXT SPACE" in bold, architectural sans-serif at the top. Smaller supporting text below: "Commercial financing, simplified" in a lighter weight.

The feeling is momentum and possibility—not intimidating financial jargon.

Aspect ratio 1:1 for Stories placement, high resolution.
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

## Output

Write prompts to: `agent/files/creatives/{brand}_prompts.json`

```json
{
  "brand": "brand-name",
  "style": "soft-brutalism-clay",
  "prompts": [
    {
      "prompt": "Full prompt text...",
      "filename": "hook_slug",
      "aspectRatio": "1:1",
      "size": "2K"
    }
  ]
}
```

**Aspect Ratio Mix:** 6 at 1:1

---

## Done

After writing prompts.json, this skill is complete. Main Agent handles image generation via MCP.
