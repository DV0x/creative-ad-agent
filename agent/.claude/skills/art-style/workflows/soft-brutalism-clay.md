# Soft Brutalism + Clay (Visual-First)

Scene-driven ad visuals where clay metaphors embody the hook's insight. Text overlays the visual, not the other way around.

---

## Philosophy

```
The visual IS the hook.

Before reading any text, the image should make someone feel something.
The scene embodies the insight. The headline names what they're already feeling.

Old approach: Text stops scroll, visual supports
New approach: Visual stops scroll, text anchors meaning
```

---

## Step 1: Load Hook Bank

Read `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md`

Extract:
- **Brand colors (hex)** — Primary, Secondary, Accent
- **ICP Essence** — emotional reality of the customer
- **6 concepts** — insight, hook, body, cta

### Brand Color Mapping

Map brand colors to visual elements consistently:

| Brand Color | Visual Element | Purpose |
|-------------|----------------|---------|
| **Primary** | Border, text headlines | Brand recognition, framing |
| **Secondary** | Background tints, supporting elements | Visual cohesion |
| **Accent** | Glowing elements, CTAs, focal points | Draw attention, hope/action |

**Example mapping for True North Mortgage:**
```
Primary #00707F (Teal) → 10px border, headline text
Secondary #C3E1E2 (Light Cyan) → Background gradient, secondary objects
Accent (warm orange) → Glowing doorways, CTA buttons, hopeful elements
```

Always use **exact hex values** in prompts. Never fall back to defaults when brand colors exist.

---

## Step 2: Translate Insight → Visual

**This is the creative work.** For each concept, translate the INSIGHT into a visual scene.

### The Translation Framework

Ask: "What would make someone FEEL this insight before reading any words?"

| Insight Type | Visual Translation |
|--------------|-------------------|
| Hidden truth being exposed | Revealing scene — peeling back, magnifying, spotlight |
| Emotional frustration | Tension scene — blocked paths, weight, obstacles |
| Permission/relief | Opening scene — doorways, clearing, warmth |
| Power shift/reframe | Transformation scene — before/after, perspective change |
| Challenge/confrontation | Bold symbolic object — dice, scale, mirror |

### Example Translations

**Insight:** "Banks count on your overwhelm. Your paralysis is their profit."
**Visual:** Clay figure at crossroads, surrounded by towering document stacks. One clear path glowing through the chaos.

**Insight:** "Self-employed rejection isn't about risk—it's about paperwork convenience."
**Visual:** Clay briefcase with glowing contents, sitting outside a closed bank door. The case is clearly valuable; the door is the problem.

**Insight:** "The renewal letter feels like a deadline, not an opportunity."
**Visual:** Clay envelope transforming mid-frame — left side gray/heavy, right side golden/light. Metamorphosis in progress.

---

## Step 3: Choose Visual Approach

| Approach | When | Scene Focus |
|----------|------|-------------|
| **Metaphor Scene** | Insight implies a hidden dynamic | Environment that embodies the insight |
| **Emotional Moment** | Insight names a feeling | Character/figure experiencing that feeling |
| **Symbolic Object** | Insight is punchy/direct | Single powerful object that IS the insight |
| **Transformation** | Insight reframes reality | Before/after or transition captured mid-change |

**Clay treatment for each:**
- Warm, handcrafted aesthetic
- Finger-pressed textures, matte finish
- Soft shadows grounding objects
- Imperfect but intentional

---

## Step 4: Write Prompts

**Structure for Nano Banana Pro:**

```
Create a [1:1/9:16] social media ad image.

SCENE:
[Describe the visual metaphor in detail. This is 70% of the image.
Be specific about what the viewer sees, the emotional tone, the story
being told through objects and environment.]

STYLE:
Clay/ceramic aesthetic. All elements have handcrafted, finger-pressed
texture with matte finish. Soft directional lighting creating gentle
shadows.

COLOR PALETTE:
- Primary brand color [#HEXCODE] for: [specific elements - border, key objects]
- Secondary brand color [#HEXCODE] for: [background tints, supporting elements]
- Accent color [#HEXCODE] for: [glowing elements, highlights, focal points]
- Clay base: warm terracotta/cream tones for figures and neutral objects

Neo-brutalist framing with [Xpx] [brand primary hex] border.

COMPOSITION:
[Where scene elements sit. Where text will overlay.
Ensure clear space for text — typically top third or bottom third.]

TEXT OVERLAY:
Headline: "[EXACT HOOK]" — bold [brand primary or white], [position].
CTA: "[EXACT CTA]" — [brand accent], [position], smaller.

MOOD:
[One-line emotional direction: hopeful, confrontational, warm, urgent, etc.]

DO NOT:
[Anything that would undermine the visual metaphor]
```

**Key principle:** Every prompt must include the brand's actual hex values. The clay aesthetic provides warmth; brand colors provide recognition.

---

## Visual Prompting Guidelines

### Scene Description (Most Important)

Be cinematic. Describe what a viewer SEES and FEELS.

| Weak | Strong |
|------|--------|
| "A person looking at documents" | "Clay figure hunched at desk, drowning in paper stacks that tower above them. One small glowing card cuts through the chaos." |
| "A house with a key" | "Oversized clay key unlocking a warm-lit doorway. The door is mid-swing, amber light spilling through the gap." |
| "Money being saved" | "Two clay scales — one weighed down by a heavy bank building, the other rising with a simple house floating upward." |

### Clay Aesthetic

- **Texture:** Finger-pressed, thumbprint marks visible, organic imperfections
- **Finish:** Matte, not glossy. Absorbs light rather than reflecting.
- **Shadows:** Soft, diffused. Objects feel grounded, not floating.
- **Colors:** Warm terracottas, muted sage, cream backgrounds. Brand accent colors for key elements.

### Human Figures (Critical)

**Never mannequins. Always characters.**

Clay figures must be PEOPLE — with personality, expression, clothing, and humanity. The clay aesthetic applies to texture and material, NOT to erasing human qualities.

| ❌ Wrong (Mannequin) | ✅ Right (Character) |
|---------------------|---------------------|
| Smooth, featureless face | Expressive face with eyes, subtle smile or furrowed brow |
| Generic blob body | Visible clothing (shirt, jacket, dress) with fabric folds |
| No hair or generic round head | Styled hair, texture, personality |
| Stiff, posed posture | Natural body language showing emotion |
| Interchangeable figures | Distinct individual who feels like a real person |

**In prompts, specify:**
```
The figure is a [person description] with [expression] wearing [clothing].
Their posture shows [emotion/action]. Face has gentle features —
warm eyes, [expression]. Rendered in clay with finger-pressed texture
but clearly human, not a mannequin.
```

**Example:**
```
❌ "A clay figure holding a house"

✅ "A young woman in a cozy sweater, sitting on a step. Her expression
   is hopeful but uncertain — she's holding a small glowing house in
   her hands, looking at it with wonder. Warm brown hair, gentle eyes.
   All rendered in clay with finger-pressed texture, but she's clearly
   a person with personality, not a mannequin."
```

The clay treatment makes it artful. The human details make it emotional.

### Brutalist Framing

- **Border:** 8-12px solid, brand primary or warm coral
- **Negative space:** 30-40% minimum for text overlay
- **Geometry:** Clean edges on frame, organic shapes within

### Text Overlay (Simplified)

Don't over-specify. Let the model integrate naturally.

| Over-specified (Avoid) | Simplified (Use) |
|------------------------|------------------|
| "bold white sans-serif, top-left corner, 48pt, high contrast" | "bold white text, top third, readable" |
| "render in coral (#E8846B), bottom-center, 18pt medium weight" | "coral accent text, bottom, smaller than headline" |

The scene carries the load. Text just needs to be present and legible.

---

## Default Palette (Fallback Only)

**Use brand colors from hook-bank first. These defaults apply ONLY when brand colors are unavailable.**

```
Terracotta: #C4755B (clay objects, figures)
Sage: #87A087 (organic elements)
Cream: #F5F0E8 (backgrounds)
Charcoal: #2D2D2D (text, shadows, obstacles)
Coral: #E8846B (fallback accent)
Warm Amber: #D4A574 (glowing elements, hope)
```

**Priority order:**
1. Brand Primary → border, headline elements
2. Brand Accent → glowing elements, CTAs, focal points
3. Brand Secondary → background tints
4. Defaults → clay figures, neutral objects, shadows

---

## Example Prompts

### Metaphor Scene

**Brand:** True North Mortgage
**Brand Colors:** Primary #00707F (Teal), Secondary #C3E1E2 (Light Cyan), Accent: warm orange
**Hook:** "Your bank is betting you won't read this."
**Insight:** Banks count on your overwhelm. Your paralysis is their profit.

```
Create a 1:1 social media ad image.

SCENE:
Clay figure standing at a crossroads, looking up at a towering wall of
stacked documents and fine print that blocks the path forward. The papers
are gray and imposing. But in the wall, there's one glowing gap — a
doorway-sized opening with warm amber-orange light streaming through. The figure
is small but turned toward the light, about to step through.

STYLE:
Clay/ceramic aesthetic. All elements handcrafted with finger-pressed texture,
matte finish. Soft overhead lighting, gentle shadows.

COLOR PALETTE:
- Primary #00707F (teal) for: 10px border frame
- Secondary #C3E1E2 (light cyan) for: subtle background gradient behind documents
- Accent warm orange for: glowing doorway light, the path through
- Clay base: terracotta figure, gray/charcoal documents

Neo-brutalist framing with 10px #00707F teal border.

COMPOSITION:
Figure bottom-left, document wall fills center and right. Glowing gap
center-right. Clear sky/space in top third for headline.

TEXT OVERLAY:
Headline: "Your bank is betting you won't read this." — bold white, top third.
CTA: "See what they're not showing you" — warm orange accent, bottom-center.

MOOD:
Confrontational but hopeful. There IS a way through.

DO NOT: Make the scene cluttered. The wall should feel massive but the
gap should feel inviting.
```

### Emotional Moment

**Brand:** True North Mortgage
**Brand Colors:** Primary #00707F (Teal), Secondary #C3E1E2 (Light Cyan), Accent: warm orange
**Hook:** "First home? You're allowed to not know what you're doing."
**Insight:** First-time buyers want permission to believe they can do this.

```
Create a 1:1 social media ad image.

SCENE:
A young woman in her late 20s sits on a front porch step. She's wearing a
comfortable cardigan over a simple top — casual, relatable. Her dark hair
is pulled back loosely. She's holding a small glowing house in her hands,
looking at it with a mix of wonder and uncertainty — hopeful eyes, a hint
of a smile forming. Her posture is curious, leaning slightly forward.
Around her on the ground, scattered clay question marks of various sizes.
The house in her hands glows with warm amber-orange light, the brightest
thing in frame. She's clearly a person with personality, not a mannequin —
rendered in clay with finger-pressed texture but expressive and human.

STYLE:
Clay/ceramic aesthetic. Soft, rounded forms, finger-pressed texture.
All elements have that handcrafted warmth.

COLOR PALETTE:
- Primary #00707F (teal) for: 8px border frame
- Secondary #C3E1E2 (light cyan) for: subtle background wash
- Accent warm orange for: glowing house light, warmth emanating
- Clay base: terracotta/cream for figure, muted gray for question marks

COMPOSITION:
Figure centered, sitting. Question marks scattered around on ground level.
House in hands is focal point. Top third open for headline.

TEXT OVERLAY:
Headline: "First home? You're allowed to not know what you're doing." —
white text, top third.
CTA: "Ask anything. Seriously." — #00707F teal, bottom-left.

MOOD:
Gentle permission. Warmth without pressure.

DO NOT: Make the figure look like a mannequin or featureless blob.
She needs a face, expression, clothing, hair. The clay texture applies
to the material, not to erasing her humanity.
```

### Symbolic Object

**Hook:** "Find a lower rate. Anywhere. We'll pay you $500."
**Insight:** This guarantee calls the bluff of the entire industry.

```
Create a 1:1 social media ad image.

SCENE:
Oversized clay hand holding out five crisp $100 bills (rendered as clay
but clearly reading as money). The hand is confident, palm-up, offering.
Behind it, a soft-focus suggestion of other banks' buildings receding
into the background, diminished. The money is the hero — tangible, real,
available.

STYLE:
Clay/ceramic aesthetic. The hand and money have finger-pressed warmth,
but the bills have enough definition to read as currency. Terracotta
hand, cream/green bills. Cream background with subtle teal gradient.
10px teal border.

COMPOSITION:
Hand and money fill center frame, entering from bottom-left. Banks
faded in upper-right background. Lower third reserved for text.

TEXT OVERLAY:
Headline: "Find a lower rate. Anywhere. We'll pay you $500." —
bold charcoal, top of frame.
CTA: "Test us" — bold teal, bottom-right.

MOOD:
Bold confidence. Put your money where your mouth is.

DO NOT: Make the money look fake or cartoonish. It should feel tangible
and available.
```

### Transformation

**Hook:** "That renewal letter? It's not a deadline. It's your leverage."
**Insight:** The renewal letter is framed as urgency when it's actually power.

```
Create a 1:1 social media ad image.

SCENE:
A clay envelope in mid-transformation. The left half is heavy, gray,
slightly crumpled — it looks like a burden. The right half is lifting,
golden-amber, edges curling upward like wings or an opening flower.
The transformation happens in the center of the envelope, a gradient
from gray to gold. Light emanates from the golden side.

STYLE:
Clay/ceramic aesthetic. Visible texture on both halves. The gray side
has denser, heavier texture. The golden side is smoother, lighter.
Soft dramatic lighting from the right. Cream background. 10px coral border.

COMPOSITION:
Envelope centered and large, filling 60% of frame. Transformation
gradient runs left to right. Top third clear for headline.

TEXT OVERLAY:
Headline: "That renewal letter? It's not a deadline. It's your leverage." —
white text, top third.
CTA: "See your real options" — coral, bottom-center.

MOOD:
Reframe. Shift in perspective. Power returning.

DO NOT: Make both halves look the same. The contrast between burden
and opportunity must be visible.
```

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

```json
{
  "brand": "brandname",
  "style": "soft-brutalism-clay-v2",
  "brandColors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE"
  },
  "prompts": [
    {
      "concept": 1,
      "insight": "The underlying truth this visual embodies",
      "hook": "Exact hook text",
      "body": "Exact body text (for ad caption, not image)",
      "cta": "Exact CTA text",
      "visualApproach": "metaphor-scene | emotional-moment | symbolic-object | transformation",
      "visualConcept": "1-sentence description of what the scene shows",
      "prompt": "Full Nano Banana Pro prompt with brand hex values...",
      "filename": "descriptive_visual_slug",
      "aspectRatio": "1:1",
      "size": "2K"
    }
  ]
}
```

**Note:** The `brandColors` object at the top level ensures brand colors are captured once and used consistently across all prompts.

---

## Checklist

For each prompt:
- [ ] **Brand colors included?** — Exact hex values from hook-bank, not defaults
- [ ] **Color mapping clear?** — Primary for border, accent for glowing elements
- [ ] **Human figures are characters?** — Face, expression, clothing, hair — not mannequins
- [ ] Scene embodies the INSIGHT (not just illustrates the hook)?
- [ ] Visual could stop scroll WITHOUT any text?
- [ ] Clay aesthetic is specified (texture, finish, warmth)?
- [ ] Clear space reserved for text overlay?
- [ ] Text specs are simplified (not over-engineered)?
- [ ] Mood/emotion is explicitly stated?
- [ ] DO NOT section prevents common failures?

---

## Anti-Patterns

- **Mannequin figures** — Clay people must have faces, expressions, clothing, hair. Never featureless blobs.
- **Ignoring brand colors** — Never use default palette when brand colors exist in hook-bank
- **Vague color references** — "teal" is wrong; "#00707F teal" is right. Always use hex values.
- **Decorative visuals** — Scene must embody insight, not just look nice
- **Text-hero fallback** — If you're writing "text-dominant," stop and rethink the visual
- **Generic objects** — "A house" means nothing. "A glowing house emerging from chaos" means something.
- **Over-specified text** — Font weights and pt sizes fight the model. Keep it simple.
- **Ignoring the insight** — The insight is your creative brief. The hook is just the headline.
- **Flat scenes** — Clay should feel dimensional, tactile, real. Add depth and shadow.
