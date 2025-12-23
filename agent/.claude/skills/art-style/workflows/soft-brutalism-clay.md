# Soft Brutalism + Clay

> **⚠️ DEPRECATED:** This workflow has been replaced by `anderson-clay-diorama.md` which provides enhanced visual direction with theatrical lighting, camera grammar, composition systems, and texture hierarchy. Use the new workflow for all new creative generation.

Visual-first ad creatives where tactile clay scenes embody emotional insights. The image stops the scroll; text anchors meaning.

---

## Philosophy

The visual IS the hook. Before reading any text, the image makes someone FEEL something. Visual metaphors impact attention, elaboration, pleasure, and liking — the extra effort to decode is rewarded with positive attitudes toward the ad.

Clay's warmth disarms. Brutalism's boldness arrests attention. Together: scroll-stopping authenticity.

---

## Step 1: Load Hook Bank

Read `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md`

Extract: **Brand Colors** (hex codes), **ICP Essence**, **6 Concepts** (insight, hook, body, CTA)

### Brand Color Mapping

| Color | Visual Element | Purpose |
|-------|----------------|---------|
| **Primary** | Border, headline | Brand recognition |
| **Secondary** | Backgrounds, supporting objects | Visual cohesion |
| **Accent** | Glowing elements, CTAs | Draw attention, signal hope |

**Always use exact hex values.** Never fall back to defaults when brand colors exist.

---

## Step 2: Translate Insight → Visual

Ask: **"What would make someone FEEL this insight before reading any words?"**

| Insight Type | Visual Translation |
|--------------|-------------------|
| Hidden truth exposed | Revealing scene — peeling back, spotlight |
| Emotional frustration | Tension scene — blocked paths, weight, obstacles |
| Permission/relief | Opening scene — doorways, warmth breaking through |
| Power shift/reframe | Transformation — before/after mid-change |
| Challenge/confrontation | Bold symbolic object — the object IS the challenge |
| Social proof | Quantity scene — multiple figures, stacked evidence |

---

## Step 3: Choose Visual Approach

| Approach | When to Use |
|----------|-------------|
| **Metaphor Scene** | Insight implies hidden dynamic — environment tells story |
| **Emotional Moment** | Insight names a feeling — character IS the story |
| **Symbolic Object** | Insight is punchy/direct — hero object dominates |
| **Transformation** | Insight reframes reality — metamorphosis in progress |

**Distribution for 6 concepts:** Never use same approach twice in a row. Variety creates test-worthy creative.

---

## Step 4: Clay Aesthetic

| Property | Specification |
|----------|--------------|
| **Surface** | Finger-pressed, thumbprint marks, organic imperfections |
| **Finish** | Matte — absorbs light |
| **Shadows** | Soft, diffused — objects grounded, not floating |
| **Colors** | Warm terracotta/cream base; brand colors for accents |

Think: Wallace & Gromit meets Wes Anderson. Handmade but directed.

---

## Step 5: Human Figures

**Never mannequins. Always characters.**

| Element | Requirement |
|---------|-------------|
| **Face** | Expressive eyes, subtle emotion |
| **Body** | Visible clothing with texture |
| **Hair** | Styled, with personality |
| **Posture** | Natural body language showing emotion |

```
✅ "A young woman in her late 20s, wearing a chunky cardigan. Dark hair
   pulled back loosely. Holding a glowing house, looking at it with wonder.
   Rendered in clay with finger-pressed texture but clearly human."
```

---

## Step 6: Brutalist Framing

| Element | Specification |
|---------|--------------|
| **Border** | 8-12px solid, brand primary color |
| **Negative Space** | 30-40% minimum for text |
| **Hierarchy** | Scene (70%) → Headline (20%) → CTA (10%) |

---

## Step 7: Write Prompts

### Prompt Structure

```
Create a [1:1/9:16] social media ad image.

SCENE:
[Cinematic description of visual metaphor — 60% of prompt weight.
Be specific about what viewer sees, emotional tone, story through objects.]

STYLE:
Clay/ceramic aesthetic. Handcrafted, finger-pressed texture, matte finish.
Soft directional lighting, gentle shadows grounding objects.

COLOR PALETTE (from hook-bank):
- Primary [#HEX] for: border frame, headline text, key brand elements
- Secondary [#HEX] for: background gradient, supporting elements
- Accent [#HEX] for: glowing elements, CTA text, focal points
- Clay base: warm terracotta/cream for figures and objects

Neo-brutalist framing with 10px solid [brand primary #HEX] border.

COMPOSITION:
[Element positions. Reserve clear space for text — top or bottom third.]

TYPOGRAPHY (Brutalist-Aligned):
Text must feel architectural — bold, geometric, intentional. Like signage
on a concrete building. Not decorative. Not playful. Structural.

HEADLINE: "[EXACT HOOK TEXT]"
- Position: Top third, centered, with generous padding from border
- Font: Bold, condensed, geometric sans-serif (like Bebas Neue, Anton, or Impact style)
- Color: [brand primary #HEX] or white for maximum contrast
- Size: Large, commanding — fills 60-70% of the text zone width
- Weight: Extra bold / Black — text should feel solid and heavy
- Treatment: All caps for impact, tight letter-spacing

CTA: "[EXACT CTA TEXT]"
- Position: Bottom third, right-aligned or centered
- Font: Medium-weight geometric sans-serif, same family feel as headline
- Color: [brand accent #HEX]
- Size: 40% of headline size — clearly secondary but readable
- Treatment: Sentence case or all caps, clean and direct

Text sits ON the composition like brutalist signage — integrated but distinct.
Not floating. Not decorative. Purposeful.

MOOD:
[One-line emotional direction]

DO NOT:
[Specific failures: mannequins, floating objects, illegible text, etc.]
```

---

## Step 8: Typography & Brand Colors

### Brutalist Text = Architectural

| Property | Specification |
|----------|--------------|
| **Weight** | Extra Bold / Black — solid, heavy |
| **Style** | Geometric sans-serif (Bebas Neue, Anton) |
| **Case** | ALL CAPS headlines |
| **Position** | Grid-aligned, not floating |

### Brand Color Application (Mandatory)

| Element | Color Source |
|---------|--------------|
| **Border** | Brand Primary (`#00707F`) |
| **Headline** | Brand Primary or white |
| **CTA** | Brand Accent (`#E8846B`) |
| **Glow/Focus** | Brand Accent |
| **Background** | Brand Secondary (`#C3E1E2`) |

**Never use defaults when brand colors exist.**

---

## Example Prompt

**Brand Colors:** Primary #00707F, Secondary #C3E1E2, Accent #E8846B
**Hook:** "Your bank is betting you won't read this."
**Insight:** Banks count on your overwhelm. Your paralysis is their profit.

```
Create a 1:1 social media ad image.

SCENE:
Clay figure at crossroads, looking up at towering wall of stacked documents
blocking the path. Papers gray, imposing, casting shadows. One glowing gap
in the wall — doorway-sized opening with warm amber-coral light streaming
through. Figure small but resolute, turned toward the light.

STYLE:
Clay/ceramic aesthetic. Finger-pressed texture, matte finish. Soft overhead
lighting, gentle shadows grounding objects.

COLOR PALETTE (from hook-bank):
- Primary #00707F (teal) for: 10px border frame, headline text
- Secondary #C3E1E2 (light cyan) for: background gradient, sky area
- Accent #E8846B (coral) for: glowing doorway light, CTA text
- Clay base: warm terracotta figure, gray/charcoal documents

Neo-brutalist framing with 10px solid #00707F border.

COMPOSITION:
Figure bottom-left. Document wall center-right, towering. Glowing gap
center-right. Top third has clear #C3E1E2 gradient for headline.

TYPOGRAPHY (Brutalist-Aligned):
Text feels architectural — like signage on concrete. Bold, geometric, intentional.

HEADLINE: "YOUR BANK IS BETTING YOU WON'T READ THIS."
- Position: Top third, centered, generous padding from border
- Font: Bold, condensed, geometric sans-serif (Bebas Neue / Anton style)
- Color: #00707F (brand primary) — matches border, creates unity
- Size: Large, commanding — fills 65% of text zone width
- Weight: Extra bold, solid, heavy
- Treatment: ALL CAPS, tight letter-spacing

CTA: "See what they're hiding"
- Position: Bottom-center, above border
- Font: Medium-weight geometric sans-serif
- Color: #E8846B (brand accent) — draws eye to action
- Size: 40% of headline size
- Treatment: Sentence case, clean

Text sits ON the composition like brutalist signage — integrated but distinct.

MOOD:
Confrontational but hopeful. There IS a way through.

DO NOT:
- Mannequin figures
- Floating objects without shadows
- Decorative or script fonts
- Text smaller than readable
- Generic colors instead of brand palette
- Text floating randomly (must be grid-aligned)
```

---

## Output Format

Write to: `agent/files/creatives/{brand}_prompts.json`

```json
{
  "brand": "brandname",
  "style": "soft-brutalism-clay",
  "brandColors": { "primary": "#HEX", "secondary": "#HEX", "accent": "#HEX" },
  "concepts": [{
    "concept": 1,
    "hookType": "stat-data|story-result|fomo-urgency|curiosity|call-out|contrast-enemy",
    "insight": "...", "hook": "...", "body": "...", "cta": "...",
    "visualApproach": "metaphor-scene|emotional-moment|symbolic-object|transformation",
    "prompt": "Full prompt...",
    "aspectRatio": "1:1", "size": "2K"
  }]
}
```

---

## Quality Checklist

- [ ] **Brand colors** from hook-bank with exact hex values (no defaults)
- [ ] **Border** uses brand primary hex
- [ ] **Headline** uses brand primary or white (high contrast)
- [ ] **CTA** uses brand accent hex
- [ ] **Glow/focal elements** use brand accent
- [ ] Scene embodies INSIGHT (not just illustrates hook)
- [ ] Clay texture specified (finger-pressed, matte)
- [ ] Human figures have faces, expression, clothing
- [ ] TYPOGRAPHY section with brutalist specs (bold, geometric, ALL CAPS)
- [ ] Text feels architectural — like signage, not decoration
- [ ] DO NOT includes: decorative fonts, generic colors, floating text

---

## Anti-Patterns

| Never | Instead |
|-------|---------|
| Mannequin figures | Characters with faces, expression, clothing |
| Default/generic colors | Brand hex codes from hook-bank (primary, secondary, accent) |
| Decorative/script fonts | Bold, geometric sans-serif (Bebas Neue, Anton style) |
| Lowercase headlines | ALL CAPS — brutalist, commanding |
| Thin/light font weights | Extra Bold / Black — solid, heavy |
| Text floating randomly | Grid-aligned, architectural positioning |
| Generic white/black text | Brand primary for headline, brand accent for CTA |
| Missing TYPOGRAPHY section | Full brutalist text specs in every prompt |

**v2.1** | December 2025
