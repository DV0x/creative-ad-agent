# Nano Banana Ad Creative Production Guide
## Conversion-Focused Campaigns for Mortgage & Financial Services

**Document Version:** 1.0
**Date:** December 2024
**Focus:** Conversion Campaigns (Meta-Compliant)

---

## Table of Contents

1. [Nano Banana Capability Analysis](#1-nano-banana-capability-analysis)
2. [Paradigm Shift: AI-Native Ad Production](#2-paradigm-shift-ai-native-ad-production)
3. [Conversion Ad Styles Achievable with Nano Banana](#3-conversion-ad-styles-achievable-with-nano-banana)
4. [Prompt Engineering for Ad Creatives](#4-prompt-engineering-for-ad-creatives)
5. [Master Prompt Templates](#5-master-prompt-templates)
6. [Multi-Turn Refinement Workflows](#6-multi-turn-refinement-workflows)
7. [Brand Consistency System](#7-brand-consistency-system)
8. [Platform-Specific Generation](#8-platform-specific-generation)
9. [Conversion Elements Integration](#9-conversion-elements-integration)
10. [Production Workflow](#10-production-workflow)
11. [Limitations & Workarounds](#11-limitations--workarounds)
12. [Example Prompt Library](#12-example-prompt-library)

---

## 1. Nano Banana Capability Analysis

### Available Models

| Model | Best For | Resolution | Reference Images | Speed |
|-------|----------|------------|------------------|-------|
| **Gemini 2.5 Flash Image** | High-volume, fast iterations | 1024px | Up to 3 | Fast |
| **Gemini 3 Pro Image Preview** | Professional assets, complex prompts | Up to 4K | Up to 14 | Slower |

### Core Capabilities for Ad Creation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NANO BANANA CAPABILITIES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TEXT-TO-IMAGE              IMAGE EDITING              MULTI-TURN   │
│  ─────────────              ─────────────              ──────────   │
│  Generate complete          Add/remove/modify          Refine       │
│  ad creatives from          elements in existing       iteratively  │
│  text descriptions          images                     via chat     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TEXT RENDERING             MULTI-IMAGE                STYLE        │
│  ──────────────             ───────────                TRANSFER     │
│  Headlines, CTAs,           Combine up to 14          Apply style   │
│  logos with accurate        reference images          from one      │
│  typography                 into one output           image to      │
│                                                       another       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ASPECT RATIOS              RESOLUTION                 GROUNDING    │
│  ─────────────              ──────────                 ─────────    │
│  1:1, 4:5, 9:16,           1K, 2K, 4K                 Google Search │
│  16:9, 21:9                (Pro only)                  for real-time│
│                                                        data         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### What This Means for Ad Production

| Traditional Workflow | Nano Banana Workflow |
|---------------------|---------------------|
| Design in Figma/Photoshop | Prompt-based generation |
| Create 3D assets in Blender | Generate 3D-style visuals via prompt |
| Source/license stock photos | Generate custom imagery |
| Manual text placement | Text rendered in generation |
| Multiple revision rounds | Multi-turn refinement |
| Hours per creative | Minutes per creative |

---

## 2. Paradigm Shift: AI-Native Ad Production

### Old Model vs New Model

```
OLD: Design-First Approach
─────────────────────────
1. Brief → Designer
2. Designer creates in Photoshop/Figma
3. Revisions (multiple rounds)
4. Export
5. Test
6. Back to step 2 for variations

NEW: Prompt-First Approach
──────────────────────────
1. Brief → Prompt Template
2. Generate with Nano Banana
3. Multi-turn refinement (in same session)
4. Export
5. Test
6. Adjust prompt, regenerate instantly
```

### Key Advantages for Conversion Campaigns

1. **Rapid A/B Testing:** Generate 10+ variations in minutes
2. **Prompt-Based Iteration:** Adjust headlines, colors, layouts via conversation
3. **Consistent Style:** Use reference images to maintain brand
4. **Text Integration:** Headlines and CTAs generated within the image
5. **Platform Adaptation:** Regenerate for different aspect ratios
6. **Cost Efficiency:** No designer required for variations

---

## 3. Conversion Ad Styles Achievable with Nano Banana

### Style 1: Bold Typography Hero (Recommended for Conversion)

**Why it works:** High-fidelity text rendering is a core Nano Banana strength

```
PROMPT APPROACH:
"Create a bold typographic ad with the text 'YOUR PATH TO HOMEOWNERSHIP'
in large, black, sans-serif uppercase letters. The words should be stacked
vertically. Use a cream/off-white background. Add a small 3D-style clay
house icon in warm yellow tones floating to the right of the text. Include
a green button at the bottom with white text 'GET PRE-APPROVED'. The style
should be modern, minimalist with slight brutalist influences - think thick
borders around elements. Square format."
```

### Style 2: 3D Clay Illustration Style

**Why it works:** Nano Banana excels at generating stylized illustrations

```
PROMPT APPROACH:
"Create an advertisement featuring soft, glossy 3D clay-style illustrations.
The main element is a charming house with a key floating beside it, both
rendered in a warm yellow-orange clay material with soft shadows. The
background is solid cream. At the top, include bold black text 'FROM
DREAMING TO KEYS IN HAND' in a clean sans-serif font. At the bottom,
add a coral-colored button with text 'START YOUR JOURNEY'. The overall
style is playful but professional, similar to Slack or Notion branding.
Aspect ratio 4:5."
```

### Style 3: Soft Brutalism with Data Visualization

**Why it works:** Combines typography, borders, and visual hierarchy

```
PROMPT APPROACH:
"Design a neo-brutalist style mortgage advertisement. Use thick black
borders (3-4 pixels) around content blocks. The headline 'HOME LOANS
WITHOUT THE HEADACHE' should be in bold, oversized black sans-serif
typography inside a bordered box. Below, show a simple visual progress
path with 3 icons: document → house → key, connected by a dotted line.
Use a cream background with pops of warm coral for accent elements.
Include a CTA button 'SEE IF YOU QUALIFY' with thick black border.
Add small text '★★★★★ 2,400+ families helped' near the bottom.
Modern, clean, high contrast. 1:1 square format."
```

### Style 4: Split Composition (Reality vs Dream)

**Why it works:** Leverages multi-image composition capabilities

```
PROMPT APPROACH:
"Create a split-screen advertisement. Left side: solid cream/beige
background with a person sitting casually on a real-looking couch
(photorealistic style). Right side: solid blue background (#1E90FF)
with white line-art sketches of furniture around the person - a
sketched lamp, sketched side table, sketched plant. This creates a
'dreaming of home' concept. At the top, overlay text 'YOUR DREAM
HOME IS JUST A CLICK AWAY' in bold white font. At the bottom, a
white button with blue text 'GET PRE-APPROVED'. The person should
be looking at their phone, smiling. Aspect ratio 4:5."
```

### Style 5: Minimalist with Negative Space

**Why it works:** Perfect for text-focused conversion messaging

```
PROMPT APPROACH:
"Create a minimalist advertisement with significant negative space.
Off-white/cream background filling most of the image. In the bottom-right
corner, place a small, detailed 3D-style clay house icon in warm tones.
The headline 'READY TO OWN YOUR FIRST HOME?' should be positioned in
the top-left in bold black sans-serif type, taking up about 40% width.
Below the headline, smaller text: 'We guide you every step of the way.'
At the bottom, a full-width coral/orange button with white text
'GET STARTED →'. Very clean, lots of breathing room. 9:16 vertical format."
```

---

## 4. Prompt Engineering for Ad Creatives

### The Master Prompt Structure

```
CREATE A [ad type] WITH THE FOLLOWING SPECIFICATIONS:

STYLE:
- Visual style: [3D clay / minimalist / brutalist / photorealistic]
- Material feel: [glossy plastic / matte / sketched lines]
- Color palette: [specific colors with hex codes if needed]
- Typography style: [bold sans-serif / clean geometric / hand-drawn]

COMPOSITION:
- Layout: [centered / split / asymmetrical / grid]
- Hero element: [what is the main visual focus]
- Supporting elements: [secondary visuals]
- Negative space: [amount and placement]

TEXT CONTENT:
- Headline: "[exact text]" in [size/weight/position]
- Subheadline: "[exact text]" in [size/weight/position]
- CTA button: "[exact text]" with [color/style]
- Trust text: "[exact text]" in [size/position]

TECHNICAL:
- Aspect ratio: [1:1 / 4:5 / 9:16 / 16:9]
- Resolution: [1K / 2K / 4K] (Pro only)
- Background: [solid color / gradient / textured]
```

### Prompt Optimization Techniques

#### 1. Be Hyper-Specific About Typography

```
WEAK: "Add some text at the top"

STRONG: "At the top center, include the headline 'YOUR PATH TO
HOMEOWNERSHIP' in bold, black, uppercase sans-serif letters
(similar to Clash Display font). The text should be large,
taking up 30% of the image width. Each word on a separate
line, stacked vertically. Tight letter-spacing."
```

#### 2. Describe Materials, Not Just Objects

```
WEAK: "Add a 3D house icon"

STRONG: "Add a 3D-style house icon rendered in warm yellow
glossy clay material. The surface should have soft reflections
like quality plastic or polymer clay. Soft contact shadow
beneath. Slightly rounded, playful proportions. The house
should appear to float with a subtle 5-degree tilt."
```

#### 3. Reference Real Design Systems

```
WEAK: "Make it look modern"

STRONG: "The overall style should be similar to Slack's or
Notion's brand aesthetic - playful 3D illustrations, bold
clean typography, generous white space, warm but professional
color palette. Think 'friendly fintech' not 'stuffy bank'."
```

#### 4. Specify What NOT to Include

```
ADD: "The background must be a solid cream color only -
no gradients, no patterns, no textures. The composition
should have significant empty space (at least 40% of the
canvas). No additional decorative elements beyond what
is specified."
```

---

## 5. Master Prompt Templates

### Template A: Journey-Focused Residential Ad

```
Create a professional mortgage advertisement with these specifications:

STYLE:
- Soft brutalist design with thick black borders (3-4px) around key elements
- 3D clay-style illustrations in warm yellow/coral tones
- Clean, modern sans-serif typography (like Clash Display or Satoshi)
- Cream/off-white background (#FDF6EC)

COMPOSITION:
- Central 3D clay illustration: A charming house with a floating key beside it
- The house should have soft glossy material, rounded edges, warm shadows
- Significant negative space around the illustration (30% margins)

TEXT CONTENT:
- Inside a thick-bordered box at top: "FROM DREAMING TO KEYS IN HAND"
  Black text, bold uppercase, stacked on 2 lines
- Below illustration: "We guide you every step of the way."
  Medium weight, dark gray, centered
- Trust element: "★★★★★ 2,400+ families helped" small, subtle
- CTA Button: "GET PRE-APPROVED →" in coral (#FF6B35) with white text
  Full-width, thick black border

TECHNICAL:
- Aspect ratio: 4:5 (for Instagram/Facebook feed)
- High contrast, clean, scroll-stopping
- No stock photos, illustrated style only

The overall feeling should be warm, trustworthy, and approachable -
like a modern fintech brand, not a traditional bank.
```

### Template B: Process-Focused (Speed/Ease) Ad

```
Create a conversion-focused mortgage advertisement:

STYLE:
- Neo-brutalist design: high contrast, bold borders, raw aesthetic
- Minimalist with intentional "designed imperfection"
- Colors: Black (#000000), White (#FFFFFF), Mint accent (#00F5D4)
- Typography: Bold, geometric sans-serif, oversized

COMPOSITION:
- Top 40%: Large headline in bordered container
- Middle 35%: Simple 3-step visual journey
  Step 1: Document icon
  Step 2: Checkmark icon
  Step 3: House with key icon
  Connected by a dotted line path
- Bottom 25%: CTA and trust elements
- All icons in mint color, outlined style

TEXT CONTENT:
- Headline: "HOME LOANS WITHOUT THE HEADACHE"
  Black, uppercase, bold, inside thick black border
- Each step labeled below icons:
  "Apply online" → "Get approved" → "Close fast"
- CTA Button: "START YOUR APPLICATION →"
  Mint background, black text, thick black border
- Below CTA: "⏱️ Takes just 3 minutes" in small text

TECHNICAL:
- Aspect ratio: 1:1 (square)
- Pure white background
- Sharp, clean edges
- No gradients, no shadows except on icons

This should feel efficient, modern, and confidence-inspiring.
```

### Template C: Social Proof Focused Ad

```
Create a trust-building mortgage advertisement:

STYLE:
- Clean, warm, approachable design
- Soft 3D clay illustration style
- Colors: Cream background, Navy text (#1A1A2E), Coral accents (#FF6B35)
- Typography: Mix of bold headlines and friendly body text

COMPOSITION:
- Top 30%: Large number and statement
- Middle 40%: Grid of small customer testimonial-style elements
- Bottom 30%: CTA

TEXT CONTENT:
- Hero stat: "2,847" in very large coral/orange color
- Below stat: "FAMILIES HELPED THIS YEAR" in navy, uppercase
- Three testimonial snippets in small boxes:
  "Best decision we made." - Sarah M.
  "So much easier than we expected." - The Johnson Family
  "Closed in 21 days!" - Mike & Lisa
  Each with ★★★★★ rating
- CTA: "JOIN THEM →" button in coral with white text
- Below CTA: "🔒 No impact to credit score"

VISUAL ELEMENTS:
- Small 3D clay key icon floating near the main number
- Subtle confetti or sparkle elements around testimonials
- Warm, celebratory feeling

TECHNICAL:
- Aspect ratio: 4:5
- Cream/warm white background
- Should feel like a celebration of success

The ad should inspire confidence through social proof.
```

### Template D: Commercial/B2B Mortgage Ad

```
Create a professional commercial mortgage advertisement:

STYLE:
- Sophisticated, dark-mode design
- Colors: Dark slate (#0D1B2A), White text, Gold accents (#D4AF37)
- Typography: Clean, authoritative serif for headlines, sans-serif for body
- Minimal illustration, more text-focused

COMPOSITION:
- Top 25%: Authority headline
- Middle 50%: Service offerings in clean list format
- Bottom 25%: Credentials and CTA

TEXT CONTENT:
- Headline: "COMMERCIAL FINANCING MADE SIMPLE"
  Large, white, with subtle gold underline
- Service list with gold checkmarks:
  ✓ Multifamily
  ✓ Retail & Industrial
  ✓ Mixed-Use Properties
  ✓ Bridge & Construction
- Credentials line: "$127M funded in 2024 | 15+ years experience"
  Smaller, white, professional
- CTA: "SCHEDULE A CONSULTATION →"
  Gold border, white text, refined style

VISUAL ELEMENTS:
- Subtle 3D building silhouette in background (very faint)
- Clean grid lines suggesting structure
- Professional, no playful elements

TECHNICAL:
- Aspect ratio: 1:1
- Dark background dominant
- High contrast text for readability

This should feel premium, authoritative, and trustworthy for business owners.
```

---

## 6. Multi-Turn Refinement Workflows

### Nano Banana's Conversational Editing is Your Secret Weapon

The multi-turn capability allows you to refine ads iteratively without starting over.

### Workflow: Generate → Refine → Variation

```
TURN 1: Initial Generation
──────────────────────────
"Create a mortgage advertisement with [full specification from template]"

↓ [Review output]

TURN 2: Refinement
──────────────────
"This is good, but please make these adjustments:
- Make the headline 20% larger
- Change the CTA button color from coral to mint green
- Add more negative space around the house icon
- Keep everything else exactly the same"

↓ [Review output]

TURN 3: Variation Creation
──────────────────────────
"Now create a variation of this ad with a different headline.
Change 'FROM DREAMING TO KEYS IN HAND' to 'YOUR JOURNEY STARTS HERE'.
Keep all other elements identical."

↓ [Review output]

TURN 4: Format Adaptation
─────────────────────────
"Now recreate this exact ad but in 9:16 vertical format for
Instagram Stories. Adjust the layout to be vertical - headline
at top, house icon in middle, CTA at bottom. Maintain all styling."
```

### Common Refinement Commands

```
TYPOGRAPHY ADJUSTMENTS:
- "Make the headline larger/smaller"
- "Change the headline to '[new text]'"
- "Make the text bold/bolder/lighter"
- "Center the headline / left-align the headline"
- "Add more space between the headline lines"

COLOR ADJUSTMENTS:
- "Change the background to [color]"
- "Make the CTA button [color]"
- "Use a warmer/cooler color palette"
- "Increase the contrast between text and background"

LAYOUT ADJUSTMENTS:
- "Add more negative space around the main element"
- "Move the CTA button higher/lower"
- "Make the illustration larger/smaller"
- "Center the composition / shift left / shift right"

STYLE ADJUSTMENTS:
- "Make the borders thicker/thinner"
- "Add soft shadows to the 3D elements"
- "Make the style more playful/more professional"
- "Simplify the design - remove [element]"

ELEMENT CHANGES:
- "Replace the house icon with a key icon"
- "Add star ratings below the headline"
- "Remove the decorative elements"
- "Add a small logo in the top right corner"
```

---

## 7. Brand Consistency System

### Method 1: Reference Image Approach (Recommended)

Use previously generated or approved ads as reference images for new generations.

```
PROMPT WITH REFERENCE:
"Using the style from this reference image [attach previous ad],
create a new mortgage advertisement with:
- Same color palette
- Same typography style
- Same border treatment
- Same illustration style

But with this new content:
- Headline: '[NEW HEADLINE]'
- Different 3D element: a key instead of a house
- Same CTA style but text: '[NEW CTA]'

Maintain exact visual consistency with the reference."
```

### Method 2: Style Definition Document

Create a detailed style definition to paste into every prompt:

```
BRAND STYLE DEFINITION (paste into all prompts):
──────────────────────────────────────────────
Style: Soft brutalism with 3D clay elements
Primary color: Navy (#1A1A2E)
Secondary color: Coral (#FF6B35)
Background: Cream (#FDF6EC)
Borders: 4px solid black
Typography: Bold geometric sans-serif for headlines,
           clean sans-serif for body text
3D style: Glossy clay/plastic material, warm yellow-orange
          tones, soft shadows, rounded forms
Layout: Generous negative space (30%+), clear hierarchy
CTA: Full-width button with thick border
──────────────────────────────────────────────
```

### Method 3: Multi-Image Reference (Pro Model)

With Gemini 3 Pro, use multiple reference images to establish style:

```
PROMPT:
"Study these 3 reference images carefully. They represent our brand style.
[Image 1: Previous ad showing typography treatment]
[Image 2: Previous ad showing 3D illustration style]
[Image 3: Previous ad showing color palette and layout]

Now create a new ad that matches this exact style but with:
- Headline: '[NEW CONTENT]'
- Visual: [NEW VISUAL DESCRIPTION]
- CTA: '[NEW CTA]'

The new ad must look like it belongs in the same campaign as
these references - same fonts, colors, border treatment,
illustration style, and overall aesthetic."
```

---

## 8. Platform-Specific Generation

### Aspect Ratio Reference

| Platform | Format | Aspect Ratio | Nano Banana Config |
|----------|--------|--------------|-------------------|
| Instagram/Facebook Feed | Square | 1:1 | `aspectRatio: "1:1"` |
| Instagram/Facebook Feed | Portrait | 4:5 | `aspectRatio: "4:5"` |
| Instagram Stories/Reels | Vertical | 9:16 | `aspectRatio: "9:16"` |
| Facebook Feed | Landscape | 16:9 | `aspectRatio: "16:9"` |
| Google Display | Rectangle | 3:2 | `aspectRatio: "3:2"` |
| LinkedIn | Landscape | 16:9 | `aspectRatio: "16:9"` |

### Platform Adaptation Prompt

```
BASE AD CREATED. NOW ADAPT:

"Take the ad concept we just created and recreate it for
[PLATFORM] with aspect ratio [RATIO].

Adaptation requirements:
- Maintain all brand elements (colors, typography, style)
- Adjust layout for vertical/horizontal format
- Ensure headline remains readable at smaller sizes
- CTA button should be in the platform's optimal CTA zone
- Respect safe zones: [specify if needed]

For [9:16 Stories]:
- Top safe zone: 200px for profile/close buttons
- Bottom safe zone: 250px for swipe-up/CTA overlay
- Keep most important content in middle 60%

For [1:1 Square]:
- Condense layout, increase type size
- Stack elements vertically
- CTA at bottom third"
```

---

## 9. Conversion Elements Integration

### Must-Have Conversion Elements (Built Into Prompts)

```
CONVERSION ELEMENT CHECKLIST:
─────────────────────────────
□ Clear headline (benefit-focused, not feature-focused)
□ Strong CTA button (action-oriented, specific)
□ Trust signal (star rating, review count, credentials)
□ Objection handler (no credit check, takes 2 min, etc.)
□ Visual hierarchy (eye flows to CTA)
□ Single focus (one message, one action)
```

### CTA Button Specifications

```
CTA PROMPT SECTION:
"Include a CTA button at the bottom of the ad:
- Text: 'GET PRE-APPROVED →' (use exact text with arrow)
- Color: Coral/orange (#FF6B35) background
- Text color: White
- Style: Full-width button with thick black border (3px)
- Position: Bottom 15% of canvas
- The button should be impossible to miss - high contrast,
  large enough to tap on mobile"
```

### Trust Signal Integration

```
TRUST SIGNAL PROMPT SECTION:
"Include trust signals near the CTA:
- Above button: '★★★★★ 4.9 rating from 2,400+ reviews'
  Style: Small text, gold stars, subtle but visible
- Below button: '🔒 No impact to credit score'
  Style: Very small text, includes lock emoji, reassuring

These elements should be clearly legible but not compete
with the main headline and CTA for attention."
```

---

## 10. Production Workflow

### Daily Ad Production Process

```
STEP 1: CAMPAIGN BRIEF
──────────────────────
- Define campaign goal (leads, pre-approvals, consultations)
- Identify target audience (first-time buyers, refinance, commercial)
- Determine platforms (Meta, Google, LinkedIn)
- List required ad variations

STEP 2: PROMPT PREPARATION
──────────────────────────
- Select appropriate master template
- Customize with campaign-specific messaging
- Prepare multiple headline/CTA variations
- Define aspect ratios needed

STEP 3: INITIAL GENERATION (Gemini 2.5 Flash)
─────────────────────────────────────────────
- Generate first ad using complete prompt
- Review for brand alignment and message clarity
- Note any adjustments needed

STEP 4: REFINEMENT (Multi-turn)
───────────────────────────────
- Refine typography, colors, layout as needed
- Generate 3-5 variations with different headlines
- Generate platform-specific formats

STEP 5: QUALITY CHECK
─────────────────────
- Verify text is legible at mobile sizes
- Confirm CTA is prominent
- Check brand consistency
- Ensure Meta compliance (no rates, no discriminatory language)

STEP 6: EXPORT & DEPLOY
───────────────────────
- Export generated images
- Upload to ad platform
- Set up A/B test structure
- Launch
```

### Batch Production Template

For generating multiple ads efficiently:

```
SESSION PLAN: Generate 10 Ad Variations

TURN 1: Base Ad
- Generate primary ad with Template A

TURN 2-4: Headline Variations
- "Keep everything the same, change headline to '[VAR 1]'"
- "Keep everything the same, change headline to '[VAR 2]'"
- "Keep everything the same, change headline to '[VAR 3]'"

TURN 5-7: Visual Variations
- "Replace house with key icon"
- "Replace house with family figures"
- "Replace house with open door icon"

TURN 8-10: Format Adaptations
- "Recreate in 9:16 for Stories"
- "Recreate in 16:9 for landscape"
- "Recreate in 1:1 square"
```

---

## 11. Limitations & Workarounds

### Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Text rendering not always perfect | Misspellings, wrong fonts | Be very specific about text; regenerate if wrong |
| May not follow exact specifications | Different than expected | Use multi-turn refinement to correct |
| Up to 3 reference images (Flash) | Limited style matching | Use Pro model for complex multi-reference |
| 1K resolution only (Flash) | Lower quality for print | Use Pro model for high-res needs |
| SynthID watermark | Visible in some cases | Generally not visible in final output |
| No exact font matching | Can't use specific fonts | Describe font characteristics in detail |

### Workarounds & Best Practices

```
ISSUE: Text comes out wrong
SOLUTION:
- Put text in quotes: "The text must read exactly: 'YOUR PATH'"
- Spell out any unusual words
- Use multi-turn to correct: "The headline is misspelled,
  change 'HOMEOWNRSHIP' to 'HOMEOWNERSHIP'"

ISSUE: Style inconsistent across variations
SOLUTION:
- Use reference images from previous generations
- Paste full style definition in every prompt
- Use multi-turn within same session for variations

ISSUE: Colors not matching brand
SOLUTION:
- Specify hex codes: "Use coral (#FF6B35) not orange"
- Provide color comparisons: "The color should be similar to
  Airbnb's coral/red, not pure red"

ISSUE: Layout not as expected
SOLUTION:
- Be extremely specific about positioning: "headline in top 20%,
  illustration in center 50%, CTA in bottom 20%"
- Use percentage-based placement
- Reference real ads: "layout similar to Apple's product ads"

ISSUE: 3D elements look wrong
SOLUTION:
- Describe material in detail: "glossy plastic clay material,
  not matte, with soft reflections"
- Reference specific brands: "3D style like Slack's marketing
  illustrations or Notion's icons"
```

---

## 12. Example Prompt Library

### Prompt 1: First-Time Buyer Journey Ad

```
Create a professional mortgage advertisement targeting first-time home buyers.

STYLE: Soft brutalist design with warm 3D clay illustrations
COLORS: Cream background (#FDF6EC), Navy text (#1A1A2E), Coral accents (#FF6B35)
TYPOGRAPHY: Bold geometric sans-serif (like Clash Display), clean and modern

LAYOUT:
- Top 25%: Headline in thick-bordered box
- Center 45%: 3D clay illustration
- Bottom 30%: CTA and trust elements

CONTENT:
- Headline inside black-bordered box: "YOUR PATH TO HOMEOWNERSHIP STARTS HERE"
  Black text, uppercase, bold, stacked on two lines
- Center illustration: A charming 3D clay-style house in warm yellow-orange
  tones with a large golden key floating beside it. Both elements have
  glossy plastic material, soft shadows, slightly rounded playful proportions.
  The house and key should float with subtle dynamic angle.
- Below illustration: "We guide first-time buyers every step of the way."
  Navy text, medium weight, centered
- Trust element: "★★★★★ 4.9 from 2,400+ happy homeowners"
  Small, gold stars, subtle
- CTA Button: "GET PRE-APPROVED →"
  Full-width, coral background (#FF6B35), white text, thick black border
- Below CTA: "🔒 No impact to credit score • Takes 3 minutes"
  Very small, gray text

TECHNICAL: 4:5 aspect ratio, high contrast, generous negative space

The overall feeling should be warm, approachable, and confidence-inspiring -
like a modern fintech brand helping people achieve their dreams.
```

### Prompt 2: Speed/Ease Focused Ad

```
Create a conversion-focused mortgage advertisement emphasizing speed and simplicity.

STYLE: Neo-brutalist, high contrast, bold
COLORS: White background, Black text, Mint accent (#00F5D4)
TYPOGRAPHY: Oversized bold sans-serif, geometric, impactful

LAYOUT:
- Top 35%: Large headline
- Center 40%: Simple 3-step visual
- Bottom 25%: CTA

CONTENT:
- Headline: "HOME LOANS WITHOUT THE HEADACHE"
  Very large, black, uppercase, bold, inside thick black border box
- 3-Step Visual: Three mint-colored icons in a row connected by a dotted line:
  Icon 1: Simplified document/application icon labeled "APPLY"
  Icon 2: Checkmark in circle labeled "GET APPROVED"
  Icon 3: House with key labeled "CLOSE FAST"
  Each icon is simple, outlined style, mint color on white
- CTA Button: "START YOUR APPLICATION →"
  Mint background, black text, thick black border, full width
- Below CTA: "⏱️ Average closing time: 21 days"
  Small text, subtle

TECHNICAL: 1:1 square format, ultra clean, bold impact

This should feel efficient, modern, and remove anxiety about the mortgage process.
```

### Prompt 3: Social Proof Heavy Ad

```
Create a trust-building mortgage advertisement centered on social proof.

STYLE: Warm, celebratory, testimonial-focused
COLORS: Cream background (#FDF6EC), Coral (#FF6B35), Navy (#1A1A2E)
TYPOGRAPHY: Mix of large display numbers and friendly body text

LAYOUT:
- Top 35%: Large statistic hero
- Center 40%: Testimonial snippets
- Bottom 25%: CTA

CONTENT:
- Hero Statistic: "2,847" in very large coral color, bold
  Below: "FAMILIES HELPED IN 2024" in navy, uppercase, smaller
- Testimonial Grid (3 small cards arranged horizontally):
  Card 1: "★★★★★ 'Best decision we made.' — Sarah M."
  Card 2: "★★★★★ 'So much easier than expected.' — The Johnsons"
  Card 3: "★★★★★ 'Closed in 21 days!' — Mike & Lisa"
  Each card has subtle cream/white background, thin border, small text
- Small floating 3D clay key icon near the main number (warm yellow, glossy)
- CTA Button: "JOIN THEM →"
  Coral background, white text, full width, thick black border
- Below CTA: "🔒 No impact to credit score"

TECHNICAL: 4:5 aspect ratio, warm and celebratory feeling

This should inspire confidence through the success of others.
```

### Prompt 4: Commercial Mortgage Ad

```
Create a sophisticated commercial mortgage advertisement.

STYLE: Dark mode, premium, authoritative
COLORS: Dark slate background (#0D1B2A), White text, Gold accents (#D4AF37)
TYPOGRAPHY: Clean serif for headline, sans-serif for body, refined

LAYOUT:
- Full dark background
- Top 30%: Headline
- Center 45%: Service list
- Bottom 25%: Credentials and CTA

CONTENT:
- Headline: "COMMERCIAL FINANCING MADE SIMPLE"
  Large, white, with subtle gold underline
- Service List with gold checkmarks:
  "✓ Multifamily & Apartment Buildings"
  "✓ Retail & Industrial Properties"
  "✓ Office & Mixed-Use Developments"
  "✓ Bridge & Construction Loans"
  White text, clean layout, generous spacing
- Credentials: "$127M funded in 2024 | 15+ years experience"
  Smaller white text, subtle
- CTA Button: "SCHEDULE A CONSULTATION →"
  Gold border, transparent background, white text, refined style
- Very subtle 3D building silhouette in dark gray in background (barely visible)

TECHNICAL: 1:1 square, premium dark aesthetic, high contrast text

This should feel premium, authoritative, and trustworthy for business owners.
```

### Prompt 5: Refinance-Focused Ad

```
Create a refinance-focused mortgage advertisement emphasizing potential savings.

STYLE: Clean, modern, data-forward with brutalist elements
COLORS: Light gray background (#F5F5F5), Dark navy text (#0F172A), Green accent (#10B981)
TYPOGRAPHY: Bold sans-serif, emphasis on numbers

LAYOUT:
- Top 30%: Attention-grabbing question
- Center 45%: Visual savings representation
- Bottom 25%: CTA

CONTENT:
- Headline in bordered box: "PAYING MORE THAN YOU SHOULD?"
  Large, navy, bold, inside thick border
- Visual Element: Two horizontal progress bars:
  Top bar (longer, red-ish): "Current Rate"
  Bottom bar (shorter, green): "Your New Rate Could Be Lower"
  Clean, simple, infographic style
- Key Message: "Thousands of homeowners save every month."
  Navy text, medium weight, centered
- Trust Element: "★★★★★ Join 1,200+ satisfied refinancers"
- CTA Button: "CHECK YOUR SAVINGS →"
  Green (#10B981) background, white text, thick black border
- Below CTA: "🔒 Free quote • No obligation"

TECHNICAL: 4:5 aspect ratio, clean and direct

This should create urgency without specific rate claims (Meta compliant).
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NANO BANANA QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MODEL SELECTION:                                                   │
│  • Flash (2.5): Fast, high-volume, 1K resolution                   │
│  • Pro (3): Complex, high-res (up to 4K), 14 reference images      │
│                                                                     │
│  ASPECT RATIOS:                                                     │
│  • 1:1 (Square) → Feed ads                                         │
│  • 4:5 (Portrait) → Instagram/Facebook feed                        │
│  • 9:16 (Vertical) → Stories/Reels                                 │
│  • 16:9 (Landscape) → YouTube, LinkedIn                            │
│                                                                     │
│  PROMPT STRUCTURE:                                                  │
│  1. Style definition (colors, typography, feel)                    │
│  2. Composition (layout, elements, spacing)                        │
│  3. Text content (exact headlines, CTAs)                           │
│  4. Technical specs (ratio, resolution)                            │
│                                                                     │
│  MULTI-TURN TIPS:                                                   │
│  • Generate base → Refine details → Create variations              │
│  • "Keep everything the same, but change [X]"                      │
│  • Use for headline A/B variations                                  │
│                                                                     │
│  META COMPLIANCE:                                                   │
│  • NO specific rates (5.99%)                                       │
│  • NO demographic language (young families, seniors)               │
│  • FOCUS on journey, process, outcomes                             │
│                                                                     │
│  CONVERSION MUST-HAVES:                                            │
│  ☑ Clear headline (benefit-focused)                                │
│  ☑ Strong CTA button (action-oriented)                             │
│  ☑ Trust signal (stars, reviews)                                   │
│  ☑ Objection handler (no credit check)                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Test prompts** from the Example Library with Nano Banana
2. **Refine** based on actual outputs
3. **Build** a reference image library from best outputs
4. **Create** campaign-specific prompt variations
5. **Establish** multi-turn workflow for daily production

---

**Document End**

*This guide is optimized for conversion campaign production. Brand awareness campaigns will require adjusted approaches.*
