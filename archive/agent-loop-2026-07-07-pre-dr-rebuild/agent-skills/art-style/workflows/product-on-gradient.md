# Product-on-Gradient

Clean, modern product isolation on rich gradient backgrounds. The product is the sole hero — no scene, no environment, no narrative. Pure commercial focus with maximum mobile optimization.

**Prerequisites:** Hook-bank file must exist. Main Agent triggers hook-methodology skill first.

---

## Style Overview

**What it is:** Product photographed or rendered in isolation on a solid color or multi-color gradient background. No environmental context, no humans, no lifestyle elements. The product is the clear focal point, occupying 30-40% of the frame, surrounded by generous negative space for typography.

**Why it works:**
- Maximum visual clarity — nothing competes with the product
- Gradient backgrounds create depth and richness without complexity
- Fastest to produce, highest mobile optimization, most scalable across SKUs
- Subtle grain texture prevents sterile digital feel while maintaining polish
- Product shadow grounds the item, giving it physical presence on the gradient
- Works universally across D2C categories with a physical product to showcase

**Visual Characteristics:**

| Element | Specification |
|---------|---------------|
| Background | Solid or multi-color gradient (aurora, radial, duotone, flat solid) |
| Product | Clear focal point, 30-40% of frame, sharp and detailed |
| Grain | Subtle noise/grain overlay for richness (2-5% opacity) |
| Shadow | Soft drop shadow or reflection grounding product |
| Negative space | 50-60% of composition reserved for typography |
| Elements | Product + headline + CTA only — nothing else |

---

## Step 1: Load Hook Bank

Follow the **Hook-Bank Loading** process in SKILL.md. Extract brand colors, ICP, category, owned positioning, and 6 hook concepts with psychology, funnel stage, format intention, and visual direction fields.

---

## Step 2: Brand Anchor Derivation

Follow the **Brand Anchor Derivation** framework in SKILL.md with this style-specific guidance:

**Principle:** The product-on-gradient style achieves brand specificity through the product itself and the gradient color story — not through scene elements or metaphors.

**Style-specific translation (step 2):**
- Product angle or detail that showcases the differentiator (e.g., unique packaging, ingredient window, distinctive shape)
- Gradient color story derived from brand-specific palette (not generic gradients)
- Headline that names the owned claim directly

---

## Step 3: Category Adaptation

The product-on-gradient style adjusts its visual treatment based on the detected D2C category:

| Category | Gradient Treatment | Product Presentation | Lighting Feel |
|----------|--------------------|---------------------|---------------|
| **Beauty/Skincare** | Soft aurora gradients in warm rose, gold, blush tones | Close-up showing texture, label detail, ingredient window | Warm, flattering, soft highlights on product surface |
| **Supplements/Health** | Clean duotone: brand primary to white or light neutral | Straight-on hero shot, label prominent, capsules/powder visible | Bright, clinical-clean but warm, high key |
| **Electronics/Tech** | Dark duotone: deep navy/charcoal to brand accent | 3/4 angle showing form factor, subtle reflections | Cool, precise, subtle rim lighting |
| **Food/Beverage** | Warm radial gradient: amber center fading to rich edge | Appetizing angle, condensation or texture visible, macro detail | Golden, appetizing, warm spotlight center |
| **Fashion/Accessories** | Bold solid or minimal gradient, high fashion feel | Dynamic angle, fabric/material texture visible | Directional, editorial, contrast-forward |
| **Home Goods** | Soft neutral gradients: warm cream to sage or linen | Lifestyle-adjacent angle but isolated, material quality visible | Natural, soft, window-light simulation |

---

## Step 4: Visual Concept Creation

For each hook, build the visual concept by answering:

1. **What product angle best serves this hook?**
   - Pain/Problem hooks: straight-on hero shot (confrontational, direct)
   - Aspiration hooks: elevated angle (aspirational, premium)
   - Education hooks: detail shot showing key feature or ingredient
   - Social proof hooks: the product as it appears in someone's life (on a surface, casual)
   - Urgency hooks: dynamic tilt, product slightly off-axis (energy, motion)

2. **What gradient type matches the emotional tone?**
   - Aurora (multi-color transitions): wonder, premium, aspiration
   - Radial spotlight: focus, clarity, revelation
   - Duotone bold: confidence, directness, urgency
   - Flat solid: simplicity, authority, minimalism

3. **Where does the text live in the negative space?**
   - Top 40% for headlines (above product)
   - Bottom-center for CTA (above safe zone, below product)
   - Side placement only for 1:1 format where product is offset

---

## Step 5: Design Principles

### 1. Product as Sole Hero
- One product, one angle, one clear focal point
- No props, no lifestyle objects, no environmental context
- Product occupies 30-40% of the frame — large enough to identify at thumbnail, small enough for breathing room

### 2. Gradient as Emotional Canvas
- Gradient derived from brand colors — never default or stock gradients
- Primary brand color as dominant hue, secondary as transition target
- If brand colors are insufficient, extend palette with complementary warm or cool tones
- Accent color reserved exclusively for CTA — nowhere in the gradient

### 3. Radical Simplicity
- Three elements maximum: product, headline, CTA
- No borders, no frames, no decorative elements
- Negative space IS the design — 50-60% of the composition
- Every pixel either serves the product, the message, or provides breathing room

### 4. Typography: Clean Authority
- Bold sans-serif headline (5-7 words maximum)
- High contrast against gradient (white on dark gradient, dark on light gradient)
- Readable at thumbnail size (minimum 12pt equivalent at final resolution)
- Text baked into composition, not floating overlay
- CTA in accent color, positioned below headline or bottom-center above safe zone

### 5. Grain Texture
- Subtle noise overlay at 2-5% opacity across the gradient
- Prevents sterile, flat digital feel
- Adds richness and tactile quality to an otherwise smooth surface
- Applied uniformly — not just on the product

### 6. Shadow Grounding
- Soft drop shadow beneath product, matching gradient's darker tones
- Or subtle reflection on a "surface" implied by the gradient
- Shadow gives the product physical weight and presence
- Never pure black shadow — always tinted toward the gradient's cool or warm lean

---

## Prompt Template

```
Create a [4:5/1:1/9:16] social media ad image.

PRODUCT:
[Detailed description of the product — what it looks like, its shape, materials,
colors, distinctive features. Be specific about the angle and what's visible.
This description should make the product identifiable as THIS brand's product.]

GRADIENT BACKGROUND:
Type: [aurora|radial|duotone|solid]
Colors: [Primary #HEX transitioning to secondary #HEX]
Direction: [top-to-bottom|center-outward|left-to-right|radial-from-center]
Grain: Subtle noise texture at [2-5]% opacity across the entire gradient

PRODUCT PLACEMENT:
Position: [centered|rule-of-thirds-right|rule-of-thirds-left]
Size: [30-40]% of frame
Angle: [straight-on|3/4-view|elevated|slight-tilt]
Shadow: Soft drop shadow in [shadow color — gradient-derived, not black]
         grounding the product against the gradient

BRAND ANCHOR:
Owned positioning: [What ONLY this brand can claim]
Visual translation: [How the product angle/detail showcases the differentiator]
Logo swap check: [Confirmation that this product shot is brand-specific]

TYPOGRAPHY:
HEADLINE: "[EXACT HOOK TEXT — 5-7 WORDS]"
- Position: Top [third/40%] of frame, [centered/left-aligned]
- Font: Bold condensed sans-serif (Montserrat Black / Bebas Neue style)
- Color: [#HEX — white or brand primary, maximum contrast against gradient]
- Weight: Extra Bold / Black
- Treatment: ALL CAPS, tight letter-spacing
- Size: Large — readable at 300px thumbnail width

CTA: "[EXACT CTA TEXT]"
- Position: Bottom-center, above 35% safe zone
- Font: Medium-weight sans-serif
- Color: [brand accent #HEX]
- Treatment: Sentence case

MOBILE CONSTRAINTS:
[Apply all safe zone rules from SKILL.md § Mobile Safe Zone Rules]
- Hero element: Product must occupy at least 30% of frame

MOOD:
[One line — the emotional direction. Clean, modern, direct.]

DO NOT:
- Clay textures, handcrafted aesthetic, or visible fingerprints
- Scene elements, environments, lifestyle objects, or props
- Borders or frames of any kind
- Multiple products or product variants in one frame
- Gradients using non-brand colors
- Pure black shadows or pure white highlights
- Decorative or script fonts
- Text in the bottom 35% of frame (except CTA above safe zone)
- Product smaller than 30% of frame
- Floating product without shadow grounding
```

---

## Example Prompts

### Example 1: Beauty/Skincare Brand (4:5)

**Brand:** GlowLab Skincare
**Colors:** Primary #D4A574, Secondary #F5E6D3, Accent #C2185B
**Hook Type:** Education
**Hook:** "Your moisturizer expires 6 months after opening."
**Psychology:** Hidden information — most consumers don't know opened products have a shorter shelf life. Creates urgency to use the product correctly.
**Category:** Beauty/Skincare

```
Create a 4:5 social media ad image.

PRODUCT:
A sleek 50ml glass jar of facial moisturizer with a matte gold lid and
frosted glass body. The label is minimal — brand name in small serif type,
"Daily Renewal Cream" below it. The jar is at a slight 3/4 angle showing
both the front label and the curved side of the jar. A small "6M" period-
after-opening symbol is visible on the lower label — this detail matters
for the hook.

GRADIENT BACKGROUND:
Type: Aurora — soft multi-color transition
Colors: Primary #D4A574 (warm gold) flowing through #F5E6D3 (soft cream)
        to a gentle warm blush at the edges
Direction: Radial from center-left, product sits in the warmest zone
Grain: Subtle noise texture at 3% opacity across the entire gradient

PRODUCT PLACEMENT:
Position: Centered horizontally, positioned in the lower-center of the frame
Size: 35% of frame
Angle: 3/4 view, slightly elevated — showing the label and jar shape
Shadow: Soft drop shadow in muted #B8956A (warm brown-gold), grounding
        the jar against the gradient. Subtle reflection beneath.

BRAND ANCHOR:
Owned positioning: GlowLab's open-jar tracking system — each jar has a
  visible PAO (period-after-opening) symbol and the brand educates on
  product freshness as a differentiator
Visual translation: The 3/4 angle deliberately shows the PAO symbol on the
  label, making the "6M" mark visible — this is the visual hook
Logo swap check: The PAO education angle is GlowLab's owned territory.
  Competitors sell moisturizer but don't lead with freshness education.

TYPOGRAPHY:
HEADLINE: "YOUR MOISTURIZER EXPIRES 6 MONTHS AFTER OPENING."
- Position: Top 35% of frame, centered horizontally
- Font: Bold condensed sans-serif (Montserrat Black style)
- Color: #FFFFFF (white) — maximum contrast against the warm gold gradient
- Weight: Extra Bold
- Treatment: ALL CAPS, tight letter-spacing
- Size: Large — readable at 300px thumbnail width

CTA: "Learn when to replace yours"
- Position: Bottom-center, positioned at 70% down the frame (above safe zone)
- Font: Medium-weight sans-serif
- Color: #C2185B (brand accent — deep rose)
- Treatment: Sentence case

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14%
- Thumb zone: CTA centered, not in bottom corners
- Thumbnail test: Jar and headline readable at 300px width
- Text minimum: All text 12pt+ equivalent
- Single-column: Elements stacked vertically (headline → product → CTA)
- Hero element: Jar at 35% of frame

MOOD:
Warm authority — educational but inviting, not clinical. The gradient feels like golden hour light on a vanity.

DO NOT:
- Clay textures, handcrafted aesthetic, or visible fingerprints
- Scene elements, bathroom shelves, or lifestyle props
- Borders or frames of any kind
- Multiple jars or product variants
- Cool or clinical lighting (this is beauty, not pharma)
- Pure black shadows
- Decorative or script fonts
- Text in the bottom 35% of frame
- Product smaller than 30% of frame
- Floating jar without shadow grounding
```

### Example 2: Supplement Brand (9:16)

**Brand:** NeuroFuel
**Colors:** Primary #1A3A5C, Secondary #4ECDC4, Accent #FF6B35
**Hook Type:** Pain/Problem
**Hook:** "Brain fog isn't normal. It's a signal."
**Psychology:** Reframes a common dismissed symptom as something actionable. Pain-aware without fear-mongering.
**Category:** Supplements/Health

```
Create a 9:16 social media ad image.

PRODUCT:
A matte navy blue bottle of nootropic capsules, cylindrical with a flat cap.
Label features the NeuroFuel wordmark in teal (#4ECDC4) with a simplified
neural network icon. The bottle is positioned straight-on, label facing
forward, cap on. Through the semi-transparent lower section of the bottle,
capsules are faintly visible — amber-colored gel caps stacked inside.

GRADIENT BACKGROUND:
Type: Duotone — bold, clean, two-color
Colors: Deep #1A3A5C (navy) at the top transitioning to #4ECDC4 (teal)
        at the bottom, with a sharp but smooth midpoint transition
Direction: Top-to-bottom vertical gradient
Grain: Subtle noise texture at 4% opacity across the entire gradient

PRODUCT PLACEMENT:
Position: Centered horizontally, positioned at vertical center of frame
Size: 35% of frame height (bottle is tall, fits the vertical format)
Angle: Straight-on, label forward, authoritative and direct
Shadow: Soft drop shadow in #0F2640 (darker navy), subtle reflection
        on an implied surface below the bottle

BRAND ANCHOR:
Owned positioning: NeuroFuel's clinically-dosed nootropic stack — each
  ingredient at research-validated doses, not pixie-dusted proprietary blends
Visual translation: The straight-on presentation and clear label communicate
  transparency. The visible capsules through the bottle reinforce "nothing
  to hide" — you can see exactly what you're taking.
Logo swap check: The neural network icon and teal-on-navy colorway are
  NeuroFuel-specific. Generic supplement brands use green/white/natural palettes.

TYPOGRAPHY:
HEADLINE: "BRAIN FOG ISN'T NORMAL. IT'S A SIGNAL."
- Position: Top 30% of frame, centered horizontally
- Font: Bold condensed sans-serif (Bebas Neue style)
- Color: #FFFFFF (white) against the dark navy top section
- Weight: Extra Bold
- Treatment: ALL CAPS, tight letter-spacing, two lines stacked
- Size: Large — readable at 300px thumbnail width

CTA: "Decode yours"
- Position: Bottom-center at 60% down the frame (well above safe zone)
- Font: Medium-weight sans-serif
- Color: #FF6B35 (brand accent — warm orange, pops against teal)
- Treatment: Sentence case

MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35%
- Safe zone: No text in top 14% (headline starts below status bar)
- Thumb zone: CTA centered, not in bottom corners
- Thumbnail test: Bottle silhouette and headline readable at 300px
- Text minimum: All text 12pt+ equivalent
- Single-column: Vertical stack (headline → bottle → CTA)
- Hero element: Bottle at 35% of frame height

MOOD:
Confident clarity — the gradient feels like emerging from fog into focus. Direct, not aggressive. Scientific authority with warmth.

DO NOT:
- Clay textures, handcrafted aesthetic, or visible fingerprints
- Brain imagery, neurons, or literal fog (the gradient implies the transition)
- Scene elements, desks, or lifestyle props
- Borders or frames
- Multiple bottles or loose capsules scattered around
- Warm/organic color palette (this is a tech-forward nootropic brand)
- Pure black shadows
- Decorative or script fonts
- Text below the 60% mark
- Product smaller than 30% of frame
- Floating bottle without shadow grounding
```

---

## Mobile Constraint Integration

The product-on-gradient style is inherently mobile-friendly due to its simplicity. Key layout rules per aspect ratio:

### 4:5 (1080x1350) — Feed Optimized
- Headline in top 35% of frame
- Product centered, occupying 30-40% of frame in the middle zone
- CTA at approximately 70% down (above bottom-35% safe zone)
- Single-column vertical stack: headline → product → CTA

### 1:1 (1080x1080) — Feed Standard / Carousel
- Headline in top 30% of frame
- Product can be offset to rule-of-thirds right with headline left-aligned in negative space
- CTA bottom-center at approximately 75% down
- Slight horizontal flexibility — product and headline can share horizontal space

### 9:16 (1080x1920) — Reels / Stories
- Headline at 20-30% from top (below 14% status bar safe zone)
- Product centered at vertical midpoint
- CTA at approximately 55-60% down (well above 65% safe zone boundary)
- Strict single-column vertical stacking — no side-by-side elements
- Extra negative space above and below product due to tall format

---

## Anti-Patterns

| Never | Instead |
|-------|---------|
| Stock gradient presets (blue-to-purple, rainbow) | Gradients derived from brand hex values |
| Product floating without grounding | Soft drop shadow or reflection, tinted to gradient |
| Cluttered frame with props or secondary objects | Product + headline + CTA only |
| Borders or frames around the image | Edge-to-edge gradient, no containment |
| Clay, handcrafted, or tactile textures | Smooth, polished, modern digital finish |
| Text crammed against product | 50-60% negative space for comfortable typography |
| Generic product angle (could be any brand) | Angle that reveals brand-specific feature |
| CTA in bottom corners | CTA centered, above safe zone |
| Multiple products showing the full line | Single product, single focus |
| "Clean product shot" without emotional gradient | Gradient color story carries the mood |

---

## Quality Checklist

### Product
- [ ] Product occupies 30-40% of frame
- [ ] Product angle showcases brand-specific feature (Logo Swap Test passes)
- [ ] Soft shadow grounds product against gradient (no floating)
- [ ] Product is sharp, detailed, identifiable at thumbnail size

### Gradient
- [ ] Gradient uses brand hex values (primary and/or secondary)
- [ ] Grain texture applied at 2-5% opacity
- [ ] No pure white or pure black anywhere in gradient
- [ ] Gradient type matches hook's emotional tone

### Typography
- [ ] Headline is 5-7 words, ALL CAPS, Extra Bold sans-serif
- [ ] Headline contrast against gradient is high (legible at 300px)
- [ ] CTA uses brand accent color
- [ ] All text is 12pt+ equivalent at display size

### Mobile
Follow shared mobile checklist in SKILL.md § Mobile Safe Zone Rules.

### Composition
- [ ] Only 3 elements: product, headline, CTA
- [ ] 50-60% negative space maintained
- [ ] No borders, frames, or decorative elements
- [ ] No scene, environment, or lifestyle context

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

Follow the shared JSON structure in SKILL.md § Output Format. Style-specific `stage` fields for this workflow:

```json
"stage": {
  "gradientType": "aurora|radial|duotone|solid",
  "gradientColors": ["#HEX", "#HEX"],
  "productPlacement": "centered|rule-of-thirds-right|rule-of-thirds-left",
  "productAngle": "straight-on|3/4-view|elevated|slight-tilt",
  "negativeSpace": "percentage",
  "grainTexture": true
}
```
