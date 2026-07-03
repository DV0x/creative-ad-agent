# Nano Banana 2 — Capabilities Guide for Logos, Images & Ad Creatives

> Source: [@NanoBanana article by @Giom_V](https://x.com/NanoBanana/status/2031739390561792084) (March 11, 2026)

---

## Model Selection

| Model | When to Use | Cost | Speed |
|---|---|---|---|
| **Nano Banana 1** | Legacy pipelines, simplest prompts, lowest cost | Cheapest | Fastest (not a thinking model) |
| **Nano Banana 2** (Gemini 3.1 Flash Image) | **Default for all new work.** 95% of Pro quality at fraction of cost. Handles text rendering, complex styles, visual grounding. | Low (even lower at 512px) | Fast |
| **Nano Banana Pro** | Only when NB2 consistently fails on highly complex, multi-layered prompts or extreme logical constraints | Expensive | Slower |

**Rule: Start with NB2. Only upgrade to Pro if you hit a wall.**

---

## Key New Capabilities in NB2

### 1. Visual Grounding with Google Search
NB2 can **search the internet for images** to understand what a real-world subject looks like before generating it.

**What it can do:**
- Specific locations: churches, bridges, city squares, niche buildings
- Nature: exact animal species, breeds, insects
- Historical landmarks, monuments

**Limitation:** Cannot search for people.

**Relevance for Creative Agent:** If a brand has a physical location (restaurant, store, landmark), we can generate creatives that accurately depict the real place. For D2C brands, we can ground product images to match the actual product.

### 2. New Resolutions & Aspect Ratios

**512px generation** — Faster, cheaper (roughly same cost as NB1). Perfect for batch exploration.

**Extreme aspect ratios:**
- **1:8 and 1:4** — horizontal and vertical
- Perfect for: web banners, scrolling assets, story ads, comic-style layouts

**Standard ratios we already support:** 4:5, 1:1, 9:16

**New ratios we could add:**
| Ratio | Use Case |
|---|---|
| 4:1 | Web banner ads, header images |
| 1:4 | Tall story ads, scrolling social |
| 16:9 | YouTube thumbnails, display ads |
| 1:8 | Panoramic banners, ticker strips |

### 3. Thinking Mode (Toggle ON/OFF)

**Default recommendation: Keep OFF.** Saves time and processing.

**Turn ON only when:**
- Model generates nonsensical results
- Highly complex infographics
- Combining visual grounding with spatial reasoning

**For Creative Agent:** We should default to thinking OFF for standard ad creatives, and only enable it for complex layout prompts (multi-panel ads, infographics with data).

### 4. Cost Optimization: 512px Batch-to-Upscale Workflow

**The golden workflow for developers:**
1. Use **Batch API** (50% discount) to generate dozens of variations at **512px**
2. Review and select the best composition
3. Ask NB2 to **upscale** that specific image to 1K, 2K, or 4K

**Relevance for Creative Agent:** We could offer a "generate many, pick the best" mode — generate 12-18 variations at 512px (cheap), let the user curate, then upscale selected ones to full resolution.

---

## What We Can Build: Logos

### Current State
We don't generate logos today. But NB2's text rendering + style control makes it feasible.

### Possible Logo Capabilities

| Feature | How |
|---|---|
| **Logo concepts from brand description** | "Design a minimal logo for a coffee brand called 'Ritual' — clean sans-serif, coffee bean icon, earth tones" |
| **Logo variations** | Generate 6-12 concepts at 512px (cheap), user picks favorites, upscale to 4K |
| **Logo in context** | Place generated logo onto mockups (business cards, storefronts, packaging) using image-to-image |
| **Logo refinement** | Upload existing logo, ask NB2 to create variations (modern, vintage, minimal, playful) |
| **Wordmark generation** | NB2's improved text rendering makes wordmark logos much more reliable |
| **Logo + brand identity kit** | Generate logo + color palette suggestion + typography pairing in one prompt |

### Logo Prompt Patterns
- "Design a professional minimalist logo for [brand]. Clean vector style, single color, white background. The logo should work at small sizes."
- "Create 4 logo variations for [brand]: one wordmark, one icon-only, one icon+text, one monogram. Modern, flat style."
- "Generate a logo for [brand] in the style of [reference style — e.g., Scandinavian minimalism, Japanese typography, Swiss design]"

### Limitations
- Text in logos can still be imperfect — may need manual cleanup
- Vector output not possible (raster only) — logos would need to be traced to SVG externally
- Consistency across variations isn't guaranteed

---

## What We Can Build: Ad Creatives

### Current Capabilities (Already Built)
- 6 ad creatives per campaign (one per hook type: stat, story, FOMO, curiosity, callout, contrast)
- 14 art styles
- Brand research → hooks → image prompts pipeline
- Aspect ratios: 4:5, 1:1, 9:16

### New Capabilities We Can Add with NB2

| Feature | Description | Effort |
|---|---|---|
| **Visual grounding for brand accuracy** | Use Google Search grounding to make creatives show actual brand products/locations | Medium — add grounding instructions to image prompts |
| **Extreme aspect ratios** | Add 4:1 (banner), 16:9 (YouTube), 1:4 (tall story) | Low — add to aspect ratio selector |
| **Batch explore mode** | Generate 18+ variations at 512px, user picks best 6, upscale to full res | Medium — new workflow in agent |
| **Multi-panel ads** | Use 4:1 ratio to create comic-strip style multi-panel ads | Low — new art style + ratio |
| **Localized marketing assets** | Generate same ad creative adapted for different markets/languages | Medium — prompt variation loop |
| **Before/After creatives** | Split-image ads showing transformation (great for fitness, beauty, home) | Low — prompt pattern |
| **Carousel ad sets** | Generate 4-6 cohesive images that tell a story across carousel slides | Medium — sequential prompting |
| **Seasonal variations** | Same ad concept but adapted for different seasons/holidays | Low — prompt suffix |
| **A/B test variants** | Generate 2-3 variations of same hook with different visual approaches | Low — batch at 512px |
| **Product mockups** | Place brand products in lifestyle contexts (kitchen, gym, office) | Medium — needs product image upload |
| **UGC-style creatives** | Ads that look like user-generated content (authentic, not polished) | Low — art style prompt |

### Advanced Prompt Patterns for Ads

**Claymation/3D style** (our best-performing style):
```
Create a claymation-style Instagram ad for [brand].
Soft clay textures, warm studio lighting, handmade feel.
Text overlay: "[headline]"
Include [product/scene description].
Style: stop-motion clay animation aesthetic.
```

**Photo-realistic product shot:**
```
Professional product photography of [product] on [surface].
Clean white/neutral background, soft diffused lighting,
subtle shadow. Text overlay: "[headline]" in [font style].
4:5 aspect ratio for Instagram feed.
```

**Lifestyle context:**
```
Authentic lifestyle photograph showing [target audience]
using/enjoying [product] in [setting]. Natural lighting,
candid pose, warm color grading. Text overlay with
brand name and CTA. No stock photo feel.
```

**Contrast/Before-After:**
```
Split-image ad. Left side: [negative scenario] in
desaturated, cold tones. Right side: [positive outcome
with product] in warm, vibrant colors. Clear visual
divide. Text: "[hook headline]"
```

**Kindergarten/Hand-drawn style** (new from NB2 article):
```
A child's crayon drawing style ad for [brand].
Chunky wax-crayon strokes, wobbly outlines, bright
bold colors. Joyful, naive art style. Include [product]
drawn in playful, oversized style. Text in childlike
handwriting: "[headline]"
```

---

## What We Can Build: Image Editing & Enhancement

### Possible Features

| Feature | Description |
|---|---|
| **Upscale existing creatives** | Take 512px drafts to 2K/4K |
| **Style transfer** | Upload brand photo, regenerate in different art style |
| **Background replacement** | Keep product, swap background to different setting |
| **Text overlay variations** | Same image, different headline/CTA text |
| **Color grading** | Apply different color treatments to same creative |
| **Image-to-ad conversion** | Upload raw product photo, convert to styled ad creative |
| **Cartoon/3D character from photo** | Upload founder photo, create cartoon brand mascot (from NB2 article's cartoon portraits example) |

---

## Cost-Optimized Architecture for Creative Agent

### Current Flow
```
Brand URL → Research → 6 Hooks → 6 Image Prompts → 6 Full-Res Images
```

### Optimized Flow with NB2
```
Brand URL → Research → 6 Hooks → 6 Image Prompts
  → Generate 18 images at 512px (3 per hook, Batch API, 50% discount)
  → User selects best 6
  → Upscale selected to 1K/2K
```

**Cost comparison:**
- Current: 6 full-res images = 6x full price
- Optimized: 18 images at 512px (batch) = ~3x full price equivalent, then 6 upscales = 6x upscale price
- Net: More variations for the user to choose from, similar total cost

### Thinking Mode Strategy
- **OFF** for: Standard ad creatives, product shots, lifestyle images, simple layouts
- **ON** for: Infographic ads, data-heavy creatives, complex multi-element compositions, visual grounding + spatial layout combos

---

## Ideas for New Product Features

1. **"Explore Mode"** — Generate 18 variations at 512px, present as a grid, user picks favorites to upscale. More choice, same cost.

2. **"Brand Grounding"** — When user provides a URL, use NB2's visual grounding to search for the actual brand's products/storefront and incorporate into creatives.

3. **"Format Expansion"** — From one approved creative, auto-generate all format variants (feed 4:5, story 9:16, banner 4:1, square 1:1, YouTube 16:9).

4. **"Logo Generator"** — Separate flow: brand description → 12 logo concepts at 512px → user picks → upscale + mockup placement.

5. **"Carousel Builder"** — Generate 4-6 sequential images that tell a story, optimized for Instagram/LinkedIn carousel format.

6. **"Holiday Variants"** — Take existing campaign creatives and regenerate with seasonal themes (Christmas, Diwali, Black Friday, Summer).

7. **"A/B Creative Lab"** — For each hook, generate 3 visual variants (different style, layout, color treatment). User picks which to test.

8. **"Mascot Creator"** — Upload founder/team photo → cartoon/3D character version → use as brand mascot across all creatives.
