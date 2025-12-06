# Soft Brutalism + 3D Clay

Complete workflow for generating scroll-stopping image prompts in the Soft Brutalism + 3D Clay style.

**Note:** This skill expects the hook-bank file to already exist. Main Agent triggers hook-methodology skill before this skill.

---

## Step 1: Load Hook Bank

Read the hook-bank file for brand data.

**Location:** `agent/.claude/skills/hook-methodology/hook-bank/`

**Process:**
1. List files matching `{brand}-*.md` in the hook-bank folder
2. Sort by date (from filename: `{brand}-YYYY-MM-DD.md`)
3. Read the most recent file (unless user specified a date)
4. Extract from file:
   - Brand colors (hex codes)
   - ICP summary
   - 6 hook concepts (Hook, Body, CTA)

**User Date Override:** If user says "use hooks from Dec 5th", read `{brand}-2025-12-05.md` instead of latest.

---

## Style Overview

**What it is:** Bold neo-brutalist borders and typography combined with warm, handcrafted 3D clay elements.

**Why it works:**
- Hard borders = confidence, stability (what you want in a lender)
- Soft clay = human touch, approachability (what you want in a guide)
- The contrast creates visual tension that stops the scroll
- Handmade aesthetic differentiates from stock photo competitors

---

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

**Brand Color Integration:**
- Use brand primary for hero object or border
- Use brand secondary for background or accents
- Fall back to default palette for missing colors
- Ensure contrast ratios work for accessibility

---

# The Creative Process

## Step 1: Extract Emotional Truth

For each hook, identify:

| Question | Answer Informs |
|----------|----------------|
| What's the **before** feeling? | Visual tension/contrast |
| What's the **after** feeling? | Visual resolution/payoff |
| What's the **transformation**? | The visual journey |
| What would the ICP **hold in their hands** if this feeling was an object? | The hero object |

---

## Step 2: Generate Visual Concepts using UltraThink (3-Layer Approach)

**Don't** pick from a menu. **Do** generate unexpected concepts.

| Layer | Description | Use? |
|-------|-------------|------|
| Literal | Direct representation (house, key, money) | Never—too obvious |
| Symbolic | Emotional equivalent (anchor=stability) | Sometimes—if strong |
| Unexpected | Surprising object + visual twist | **Always aim here** |

**Examples of Layer 3 Thinking:**

| Hook | Literal | Symbolic | Unexpected (Best) |
|------|---------|----------|-------------------|
| "Rejected 3x, Approved in 48hrs" | Door | Bridge | A clay "DENIED" stamp crumbling apart, revealing a golden key inside |
| "350+ lenders, 60 seconds" | Phone/App | Funnel | A single clay finger pressing a button, with 350 tiny buildings floating upward |
| "Your neighbor locked 5.9%" | House | Fence | Two identical clay houses—one with a glowing warm window, one dark and cold |
| "$340/month savings" | Money | Piggy bank | A clay wallet with wings, lifting off a surface |
| "What banks won't tell you" | Bank building | Keyhole | A clay vault door slightly ajar, with glowing orbs (lenders) floating out |

---

## Step 3: Apply Visual Surprise Techniques using UltraThink

| Technique | Description | Example |
|-----------|-------------|---------|
| **Scale Shift** | Make something unexpectedly large or small | Tiny person next to massive key |
| **Material Swap** | Familiar object in unexpected material | Glass house, clay money, fabric door |
| **State Change** | Show transformation mid-process | Melting, growing, crumbling, blooming |
| **Juxtaposition** | Two unrelated objects creating new meaning | Compass growing from a house roof |
| **Absence** | Show what's missing | Empty keyhole with light streaming through |
| **Personification** | Give objects human qualities | House with arms reaching out |

---

## Step 4: Apply the 6 Design Principles using UltraThink

### 1. Intentional Contrast Creates Tension

Pair opposing forces deliberately:
- Soft clay + hard borders
- Warm terracotta + cool sage
- Bold headlines + delicate supporting text
- Organic shapes + geometric frames

### 2. Restraint is Strength (Strategic Negative Space)

- 40%+ of composition should breathe
- One hero object, not a cluttered scene
- Let the eye rest, then focus
- Emptiness signals confidence

### 3. Typography as Architecture

- Headlines have weight and presence
- Clear hierarchy: primary → secondary → tertiary
- Type should feel built, not decorated
- Sans-serif for modernity, serif for premium moments

### 4. Materiality Creates Believability

Specific textures sell authenticity:
- Glossy but not plastic
- Visible finger-pressed impressions in clay
- Soft shadows grounding objects in space
- Matte finishes with subtle light catching edges

### 5. Emotional Truth Over Feature Lists

Sell feelings, not processes:
- Not "Fast pre-approval" → "Confidence when you need it"
- Not "Low rates" → "More room to breathe"
- Not "Easy application" → "We handle the complexity"

### 6. Distinctive Signature Creates Recognition

Ownable visual language:
- Consistent color palette across all touchpoints
- Recurring border treatment
- Same clay materiality
- Typography system that's yours alone

---

## Hook Type → Visual Direction

| Hook Type | Emotional Territory | Visual Approach |
|-----------|---------------------|-----------------|
| Stat | Authority, proof | Object implying scale/quantity |
| Story | Transformation | Before/after or mid-change state |
| FOMO | Urgency, missing out | Others have it, you don't (yet) |
| Curiosity | Hidden knowledge | Partially revealed, peek behind |
| Call-out | Recognition, belonging | "This is for YOU" directness |
| Contrast | Old vs new | Split composition, side-by-side |

---

## Visual Metaphor Library

Use as inspiration, then push for the unexpected twist.

| Metaphor | Visual | Emotional Territory |
|----------|--------|---------------------|
| **The Key** | Oversized clay key, home-shaped head | Achievement, trust, "something valuable handed to you" |
| **The Bridge** | Two platforms connected by bridge | Progress, journey, getting from here to there |
| **The Roots** | House with organic roots spreading beneath | Stability, belonging, long-term security |
| **The Door** | Standalone door ajar with warm glow | Possibility, invitation, threshold moment |

**Expand to:** Ladders, stepping stones, compasses, maps, anchors, nests, seeds growing, puzzle pieces, lighthouses, open windows, pathways, handshakes, umbrellas (protection), foundations, blueprints coming to life, keys in locks, stamps crumbling, wallets with wings, vaults opening.

**The rule:** Match metaphor to the emotional truth → then add an unexpected twist.

---

# Construct Prompt Construction using UltraThink

## Prompt Structure Template

```
[FORMAT & PLATFORM]
Create a [aspect ratio] [platform] ad for [client type].

[THE CONCEPT - What & Why]
The scene/visual: [Detailed description of the visual metaphor]

[MATERIALITY - How it Feels]
[Specific textures, surfaces, light behavior, tactile qualities]

[COMPOSITION - Where Things Live]
[Layout, negative space, framing, visual hierarchy]

[TYPOGRAPHY - The Words]
[Headlines, supporting text, placement, style]

[EMOTIONAL NOTE - The Feeling]
[The mood, what it should evoke, what it should NOT feel like]

[TECHNICAL]
Aspect ratio [X:X], high resolution for [platform] placement.
```

---

## Aspect Ratio Guidelines

| Ratio | Platform | Use For |
|-------|----------|---------|
| 1:1 | Meta Feed, Instagram Feed | Primary feed ads |
| 9:16 | Instagram Stories, Reels | Vertical immersive |
| 4:5 | Meta Feed (preferred) | Taller feed presence |
| 16:9 | YouTube, Display | Horizontal banners |

**Default mix:** 3 concepts at 1:1, 3 concepts at 9:16

---

# Example Prompts

## Example 1: "The Key Moment" (1:1 Feed)

```
Create a square social media ad for a mortgage broker targeting first-time homebuyers.

The scene: A single oversized house key made of glossy terracotta clay, positioned slightly off-center to the right. The key has satisfying weight and dimensionality—you can see the subtle finger-pressed texture in the clay, soft highlights catching light from the upper left. The key head is shaped like a simplified home silhouette.

Behind the key, a soft sage green background with a thick, confident 8-pixel warm coral border framing the entire composition. The border feels hand-drawn but precise—intentionally imperfect.

In the generous negative space to the left, bold sans-serif text reads "YOUR FIRST HOME" in deep charcoal, stacked vertically. Below it, smaller but equally confident: "starts with the right guide" in the same coral as the border.

The mood is warm confidence—not corporate, not salesy. Like a trusted friend handing you something valuable. The clay material makes homeownership feel tangible, achievable, something you can literally hold.

Small logo placement bottom right corner, subtle. No other text or calls-to-action cluttering the frame.

Aspect ratio 1:1, high resolution for Meta feed placement.
```

---

## Example 2: "The Bridge" (9:16 Stories)

```
Design a vertical Instagram story ad for commercial mortgage services targeting small business owners.

The concept: A miniature 3D clay scene showing two platforms—one representing "where you are" (a small, simple building shape in muted gray clay) and one representing "where you're going" (a larger, more established building in warm terracotta). Between them, a solid bridge in sage green clay connects the two.

The entire scene sits on a creamy off-white surface, shot from a slightly elevated 3/4 angle so you see depth and dimension. The clay has that satisfying handmade quality—subtle fingerprint impressions, soft rounded edges, matte finish with gentle highlights.

Frame the scene with a thick black border (neo-brutalist style) but keep the interior warm and approachable. The contrast between hard border and soft clay creates visual tension that stops the scroll.

Typography: "GROW INTO YOUR NEXT SPACE" in bold, architectural sans-serif at the top—the words have presence and weight. Smaller supporting text below: "Commercial financing, simplified" in a lighter weight.

The feeling is momentum and possibility—not intimidating financial jargon, but a clear visual metaphor anyone can understand in 0.5 seconds. The handcrafted clay aesthetic signals human touch in an industry that often feels cold.

Aspect ratio 9:16 for Stories placement, high resolution.
```

---

## Example 3: "Roots" (1:1 Feed)

```
Create a square social media ad for a mortgage broker emphasizing long-term stability and family homes.

The visual: A charming miniature house made of warm terracotta clay—simple geometric form with a pitched roof, single door, two windows. The house has that handcrafted quality with soft rounded edges and visible finger-smoothed surfaces.

The distinctive element: From beneath the house, organic root shapes in sage green clay spread downward and outward, like a tree establishing itself. The roots have gentle curves, varying thickness, and that satisfying clay materiality—matte with subtle light catching the edges.

Background: A rich, deep forest green that makes the warm terracotta pop. Framed with a thick cream-colored border (12 pixels) that feels substantial and intentional.

Typography positioned in the upper third: "PUT DOWN ROOTS" in bold, warm off-white sans-serif—the letters feel grounded and confident. Below in smaller text: "Find your forever home" in a softer weight, same cream color.

The composition breathes—the house and roots occupy maybe 50% of the frame, letting negative space do its work. The eye travels naturally from text to house to roots.

The emotional note: Security without stuffiness. Growth that feels organic, not forced. The handmade clay whispers "real people, real homes" not "corporate lender."

Aspect ratio 1:1, high resolution for Meta feed.
```

---

## Example 4: "The Door" (9:16 Stories)

```
Design a vertical ad for Instagram showing the moment of possibility in homeownership.

The scene: A standalone door frame made of smooth cream-colored clay, slightly ajar, positioned center-right in the frame. Through the open door, a warm golden-yellow glow emanates—not harsh, but inviting like afternoon sunlight in a new home. The door itself has a simple round doorknob in terracotta clay.

The door frame casts a soft shadow on a sage green surface beneath it, grounding the object in space. The clay has beautiful imperfections—subtle texture variations, soft edges where forms meet, that handmade quality that says "crafted with care."

Background: Split composition—deep charcoal on the left (where the typography lives), transitioning to softer sage on the right where the door sits. This creates natural visual flow and reading hierarchy.

Bold text on the dark left side: "WHAT'S ON THE OTHER SIDE?" stacked vertically in warm coral. Below it, smaller: "Let's find out together" in cream—warmer, more personal.

The thick border here is terracotta-colored, creating a warm frame around the entire scene. The border feels like it's holding the composition together with intention.

The mood: Curiosity and warmth. Not "ACT NOW" urgency but "something wonderful awaits" anticipation. The partially open door is an invitation, not a demand.

Aspect ratio 9:16 for Stories, high resolution.
```

---

## Example 5: "Transformation" (1:1 Feed) - State Change Technique

```
Create a square social media ad for a mortgage broker targeting people rejected by banks.

The scene: A clay rubber stamp that reads "DENIED" in bold letters—but the stamp is mid-crumble, breaking apart. From the cracks and fragments, a warm golden key emerges, pushing through. The key is smooth and polished terracotta clay, contrasting with the crumbling gray stamp.

The stamp fragments float slightly, caught in the moment of transformation. Small particles of gray clay dust scatter around the scene. The golden key is partially revealed, about 60% emerged—the transformation is happening NOW.

Background: Deep charcoal with a thick sage green border (10px). The dark background makes the warm key glow by contrast.

Typography in the upper left: "REJECTED?" in muted gray, then below it "KEEP GOING." in bold warm coral. The word "REJECTED" should feel like it's fading, while "KEEP GOING" feels solid and present.

Small supporting text: "We specialize in second chances" in cream, bottom area.

The mood: Hope emerging from disappointment. Not "banks are bad" anger—instead, "there's another way" optimism. The mid-transformation moment creates tension and resolution simultaneously.

Aspect ratio 1:1, high resolution for Meta feed placement.
```

---

# Quality Checklists

## Materiality Checklist

Before finalizing any prompt, verify:

- [ ] Clay texture described (finger-pressed, handmade feel)
- [ ] Light behavior specified (matte with subtle highlights)
- [ ] Shadows mentioned (soft, grounding)
- [ ] Surface quality defined (not plastic, not too perfect)
- [ ] Imperfections included (texture variations, soft edges)

## Composition Checklist

- [ ] One hero object identified
- [ ] 40%+ negative space
- [ ] Border specified (thickness, color)
- [ ] Typography placement defined
- [ ] Visual hierarchy clear (primary → secondary → tertiary)
- [ ] Eye flow considered

## Emotional Checklist

- [ ] Mood explicitly stated
- [ ] What it should NOT feel like mentioned
- [ ] Connects to hook's emotional territory
- [ ] Human touch communicated (not corporate/cold)

---

# Typography in This Style

| Element | Treatment |
|---------|-----------|
| Headlines | Bold, architectural sans-serif, stacked vertically or horizontally with presence |
| Supporting text | Lighter weight, same family, smaller size |
| Placement | Integrated with composition, not floating randomly |
| Colors | High contrast with background, often using accent colors |

**Typography should feel BUILT, not decorated.**

---

# Common Compositions

## Split Composition
- Left side: dark background + typography
- Right side: lighter background + hero object
- Creates natural reading flow (text → image)

## Centered Hero
- Hero object center or slightly off-center
- Typography above or below
- Maximum negative space around object

## Scene Composition
- Multiple clay objects in relationship
- Elevated 3/4 angle for depth
- Surface/ground visible

---

# Anti-Patterns (Never Do)

- Stock photo concepts (handshake, happy family, house exterior)
- Obvious metaphors without twist (plain key, plain bridge)
- Cluttered compositions (multiple hero objects)
- Generic clay objects (no fingerprint texture, no character)
- Typography as afterthought (floating text with no relationship to scene)
- Corporate cold aesthetic (sterile, overly polished)
- Aggressive urgency ("ACT NOW", "LIMITED TIME")
- Clay that looks like plastic (too shiny, no texture)
- Borders that feel weak (under 6px, muted colors)
- Too many clay objects competing
- Perfect, machine-made looking clay (needs handmade imperfection)

---

# Workflow Summary

```
1. READ hook-bank file (6 hooks with copy from Hook Skill)
2. FOR EACH hook:
   a. EXTRACT emotional truth (before/after/transformation)
   b. GENERATE Layer 3 unexpected visual concept
   c. SELECT visual surprise technique
   d. APPLY 6 design principles
   e. CONSTRUCT prompt using template
   f. VERIFY against checklists
3. WRITE prompts to agent/files/creatives/{brand}_prompts.json
4. DONE - Main Agent handles image generation via MCP
```

---

# Remember

- One hero object per image
- 40%+ negative space
- Clay = fingerprints, matte, soft shadows
- Borders = thick, intentional, warm colors
- Typography = architectural, weighted, hierarchy
- Emotion > Information
- Unexpected > Obvious
- Handmade > Perfect

---

# Output & Image Generation

## Write Prompts to JSON

After generating 6 image prompts, write them to a JSON file:

**File:** `agent/files/creatives/{brand}_prompts.json`

**Format:**
```json
{
  "brand": "brand-name",
  "style": "soft-brutalism-clay",
  "prompts": [
    {
      "prompt": "Full detailed prompt text for image 1...",
      "filename": "rejected_approved_48hrs",
      "aspectRatio": "1:1",
      "size": "2K"
    },
    {
      "prompt": "Full detailed prompt text for image 2...",
      "filename": "350_lenders_60_seconds",
      "aspectRatio": "9:16",
      "size": "2K"
    },
    {
      "prompt": "Full detailed prompt text for image 3...",
      "filename": "neighbor_locked_rate",
      "aspectRatio": "1:1",
      "size": "2K"
    },
    {
      "prompt": "Full detailed prompt text for image 4...",
      "filename": "savings_340_month",
      "aspectRatio": "9:16",
      "size": "2K"
    },
    {
      "prompt": "Full detailed prompt text for image 5...",
      "filename": "banks_wont_tell_you",
      "aspectRatio": "1:1",
      "size": "2K"
    },
    {
      "prompt": "Full detailed prompt text for image 6...",
      "filename": "first_home_guide",
      "aspectRatio": "9:16",
      "size": "2K"
    }
  ]
}
```

**filename:** Derive from hook concept - short, readable slug (e.g., "rejected_approved_48hrs" from hook "Rejected 3x, Approved in 48hrs")

**Aspect Ratio Mix:** 3 at 1:1 (feed), 3 at 9:16 (stories)

---

## Done

After writing prompts.json, this skill is complete. Main Agent will:
1. Read the prompts.json file
2. Call `mcp__nano-banana__generate_ad_images` MCP tool to generate images
3. Report final results to user
