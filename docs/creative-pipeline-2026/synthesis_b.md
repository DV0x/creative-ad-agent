# Synthesis B: Visual Styles & Art Direction Pipeline

**Date:** 2026-02-24
**Focus:** New art styles, prompt construction improvements, Entity ID diversity strategy, and art-style skill architecture
**Sources:** research_a.md, research_b.md, research_c.md, research_d.md, critique.md, debate_transcript.md, position_advocate.md, position_skeptic.md, existing workflow files (soft-brutalism-clay.md, anderson-clay-diorama.md), SKILL.md

---

## 1. New Art Style Catalog

The pipeline currently produces all output in one visual aesthetic (anderson-clay-diorama as default, soft-brutalism-clay as alternate). Under Andromeda's Entity ID clustering, this means every creative for a brand likely collapses into 1-2 Entity IDs regardless of hook diversity. The critique identifies this as the single highest-leverage problem to fix. The following 6 styles are designed to produce visually distinct Entity IDs while serving different D2C categories and funnel stages.

### 1.1 Product-on-Gradient

**Visual Characteristics:**
- Product photographed or rendered in isolation on a solid color or multi-color gradient background
- No environmental context, no humans, no lifestyle elements
- Clean product as clear focal point occupying 30-40% of frame
- Modern gradient treatments: aurora-style multi-color transitions, radial spotlight gradients, duotone bold contrasting hues, or flat solid color
- Subtle grain texture overlay for richness (avoids sterile digital feel)
- Product shadow grounding it against the gradient (soft drop shadow or reflection)

**Composition:**
- Product centered or positioned at rule-of-thirds intersection
- Generous negative space (50-60%) for typography
- Single-column vertical layout optimized for mobile thumb zones
- Text positioned in top 40% of frame (away from bottom thumb zones)
- Minimal visual elements: product + headline + CTA only

**Typography:**
- Bold sans-serif headline (5-7 words max) with high contrast against gradient
- Clean, readable at thumbnail size (minimum 12pt equivalent at final resolution)
- Text baked into composition, not floating overlay
- CTA in accent color, positioned below headline or bottom-center above safe zone

**Color Strategy:**
- Gradient derived from brand colors: primary as dominant hue, secondary as transition target
- If brand colors are insufficient, extend palette with complementary warm or cool tones
- Duotone option: two bold brand colors in steep gradient
- Accent color reserved exclusively for CTA

**What Differentiates It from Existing Styles:**
- No clay textures, no handcrafted aesthetic, no borders
- No scene, no environment, no diorama — pure product isolation
- Compositionally flat (product + background) vs. the layered depth of clay diorama
- Fastest to produce, highest mobile optimization, most scalable across SKUs

**Best D2C Categories:** Beauty/skincare product lines, supplements, high-SKU e-commerce catalogs, electronics, fashion accessories, any brand with a physical product to showcase

**Funnel Position:** Mid-funnel (product education, feature showcase) and bottom-funnel (direct response with offer)

**Entity ID Distinction:** Andromeda sees flat product-on-gradient as compositionally distinct from 3D rendered clay scenes. No layered depth, no scene elements, no miniature-world staging. Different visual fingerprint.

---

### 1.2 Editorial Cutout

**Visual Characteristics:**
- Product isolated with artistic cut-out edges (slightly rough, not pixel-perfect)
- Selective color treatment: product in full color against monochrome, desaturated, or tinted background
- Magazine-editorial aesthetic — product presented like a design object
- Layered composition with overlapping geometric shapes (circles, rectangles) framing the product
- Collage-influenced: multiple product angles or components arranged in deliberate editorial layout
- Paper-texture or linen-texture background for tactile quality

**Composition:**
- Asymmetric layout with deliberate visual tension (break from clay diorama's bilateral symmetry)
- Product at 40% of frame with secondary elements (ingredient close-ups, texture details, color swatches)
- Overlapping layers create depth without 3D rendering
- Grid-based but not rigid — editorial magazines break the grid intentionally
- White space used as a design element, not just absence

**Typography:**
- Serif or editorial serif/sans-serif pairing (distinct from clay styles' geometric sans-serif)
- Title-case headlines, not ALL CAPS (editorial voice, not brutalist)
- Smaller body text with longer copy permitted (editorial format supports more text)
- Pull-quote treatment: key benefit highlighted in larger text with quotation marks
- Text wraps around or overlaps product cutout for integrated feel

**Color Strategy:**
- Dominant: neutral base (off-white, warm gray, soft blush, sage)
- Selective saturation: product in full, vivid brand colors against muted surroundings
- Accent pops in geometric overlay elements
- No gradients — flat color fields and layered shapes

**What Differentiates It from Existing Styles:**
- Flat layered composition (collage) vs. 3D depth (clay diorama)
- Serif typography vs. geometric sans-serif
- Asymmetric editorial layout vs. bilateral symmetry
- Paper/linen texture vs. clay materiality
- Selective color vs. full-color scene
- No borders (uses overlapping shapes instead)

**Best D2C Categories:** Fashion, beauty, premium accessories, lifestyle brands, home goods, any brand with a premium or design-forward positioning

**Funnel Position:** Top-funnel (aspirational, brand-building) and mid-funnel (product education through editorial detail)

**Entity ID Distinction:** Flat collage composition with cut-out edges, selective color, and serif typography produces a fundamentally different visual signature from both clay diorama (3D scene) and product-on-gradient (minimal isolation).

---

### 1.3 Typography-Dominant

**Visual Characteristics:**
- Bold typography IS the hero element — text occupies 60-70% of the frame
- Minimal or no product imagery (product may appear as small element at 10-15% of frame)
- Large, stacked, stretched, or rotated letterforms
- High contrast: dark background with light text or light background with dark text
- Kinetic energy: type that feels like it is in motion (stretched, overlapping, breaking grid)
- Graphic elements: lines, blocks of color, or simple geometric accents supporting the text

**Composition:**
- Text-first layout: headline dominates the visual field
- Product image (if present) is subordinate — a small element in corner or bottom strip
- Rule-breaking: text can extend to edges, overlap borders, break the frame
- Vertical stacking for 9:16 formats, horizontal sweep for 1:1
- No scene, no environment, no context beyond the message itself

**Typography:**
- Extra Bold / Black weight, condensed or extended depending on message
- Sans-serif dominant: Impact, Bebas Neue, Anton, or similar high-impact faces
- Variable font weight for emphasis hierarchy (Ultra Bold headline, Medium subtext)
- Color treatment: headline in brand primary, accent word in contrasting color
- Text as texture: repeated words, layered at different opacities, creating visual rhythm

**Color Strategy:**
- High contrast, limited palette: 2-3 colors maximum
- Options: black + brand accent, white + brand primary, brand primary + brand secondary
- No gradients, no textures — flat, graphic, poster-like
- Color blocking: large fields of solid color divided by text

**What Differentiates It from Existing Styles:**
- No product scene, no clay, no rendered objects
- Text as visual hero (opposite of clay diorama where scene is hero and text is secondary)
- Graphic/poster aesthetic vs. handcrafted/diorama aesthetic
- Flat 2D composition with no depth simulation
- Zero uncanny valley risk (no rendered objects or environments)

**Best D2C Categories:** SaaS, tech, services, financial products, coaching/education, subscription boxes — any brand where the product is intangible or the message is more compelling than the product image

**Funnel Position:** Top-funnel (pattern interruption, bold statements) and bottom-funnel (offer-driven with clear CTA)

**Entity ID Distinction:** Radically different from all other styles. No imagery-dominant composition. Andromeda's visual analysis sees text/graphic layout as a completely separate visual category from product-on-background, clay diorama, or editorial collage.

---

### 1.4 Infographic / Data-Visual

**Visual Characteristics:**
- Educational, authority-building layouts with structured information presentation
- Data visualization elements: comparison charts, step-by-step breakdowns, numbered lists, progress indicators
- Icon-based illustrations (flat icons, not 3D) representing features or steps
- Clean grid layout with clear information hierarchy
- Divider lines, numbered sections, and labeled callouts
- Factual/scientific tone conveyed through layout structure

**Composition:**
- Grid-based, structured, organized — visual order signals credibility
- 3-4 sections within a single frame (e.g., "3 Steps to Better Sleep" with three visual blocks)
- Icons or simple illustrations at consistent size across sections
- Headline at top, structured content in middle, CTA at bottom
- Comparison layout option: left vs. right (this product vs. competitors, before vs. after)
- Check/cross marks, star ratings, percentage bars as visual proof elements

**Typography:**
- Clean sans-serif throughout (no decorative fonts)
- Multiple text sizes: headline (large), section headers (medium), body (small but readable)
- Numbers and statistics rendered large and bold as visual anchors
- Brand primary for headers, neutral dark for body text, accent for key statistics

**Color Strategy:**
- Clinical/professional base: white or very light gray background
- Brand primary for headers and key data points
- Brand secondary for supporting elements and section dividers
- Accent sparingly for the most important statistic or CTA
- Muted tones overall — authority comes from structure, not color intensity

**What Differentiates It from Existing Styles:**
- Information-dense (multiple data points per frame) vs. single-concept visual
- Grid/structured layout vs. compositional art direction
- Flat icons and data elements vs. rendered objects or photography
- Educational tone vs. emotional/atmospheric tone
- Readable complexity vs. scroll-stopping simplicity (targets a different user behavior)

**Best D2C Categories:** Health/wellness (ingredient breakdowns, clinical results), fintech (rate comparisons, savings calculators), SaaS (feature comparisons, workflow diagrams), supplements (ingredient profiles), any science-backed or results-driven brand

**Funnel Position:** Mid-funnel (education, proof, feature comparison) and bottom-funnel (data-backed offers, review summaries)

**Entity ID Distinction:** Information-structured layout with icons, data elements, and multi-section composition is visually alien to every other style. Andromeda's scene-type analysis categorizes this differently from product shots, clay scenes, typography posters, or editorial collages.

---

### 1.5 Lifestyle-Render Hybrid

**Visual Characteristics:**
- Atmospheric environmental rendering showing product in an idealized context
- NOT photorealistic humans — aspirational scenes with product placed in warm, inviting environments
- Environments: morning kitchen countertop, minimalist bathroom shelf, cozy bedside table, gym bag setup, outdoor picnic spread
- Soft, natural-looking lighting (golden hour, window light, diffused daylight)
- Depth of field: product sharp in foreground, environment softly blurred behind
- Warm, lived-in quality — not sterile studio, not clinical product shot

**Composition:**
- Environmental context takes 60% of frame, product occupies 30%, text 10%
- Product positioned at natural eye-level within the scene (on a counter, shelf, table)
- Scene tells a micro-story: the coffee cup next to the supplement, the journal beside the skincare
- Complementary objects (not competing products) create lifestyle context
- Natural framing: window frame, shelf edge, table edge as compositional anchors

**Typography:**
- Minimal text overlay — the scene communicates value, text adds CTA only
- Headline as short statement overlaid with semi-transparent background bar for legibility
- Warm-toned text that harmonizes with the scene (not harsh white or black)
- Positioned in natural negative space within the scene (not covering the product)

**Color Strategy:**
- Warm, natural tones dominant: amber, warm white, soft green, earth tones
- Brand colors integrated through the product itself and subtle environmental elements
- Desaturated, golden-hour color grading on the environment
- No flat color fields — everything has ambient lighting variation

**What Differentiates It from Existing Styles:**
- Environmental scene with depth vs. isolated product or abstract composition
- Natural lighting simulation vs. theatrical/studio lighting of clay diorama
- Atmospheric mood vs. graphic impact
- Scene-based (tells a lifestyle story) vs. concept-based (tells a hook story)
- Warm, organic, natural aesthetic vs. crafted/designed aesthetic

**Best D2C Categories:** Wellness, skincare/beauty, home goods, fitness, coffee/food/beverage, candles/fragrance, bedding/sleep products — any brand where lifestyle context increases desire

**Funnel Position:** Top-funnel (aspirational lifestyle association) and mid-funnel (product-in-use contextualization)

**Entity ID Distinction:** Environmental scene with depth, natural lighting, and lifestyle objects is compositionally distinct from all other styles. Andromeda's "scene type and setting" analysis registers this as a lifestyle/environmental composition rather than product isolation, graphic poster, data layout, or miniature diorama.

---

### 1.6 UGC-Aesthetic Static

**Visual Characteristics:**
- Designed to look like a screenshot from a real social media post or review
- Simulated UGC elements: screenshot framing, profile header, like/comment counts, star ratings
- "Real person" feel achieved through casual composition, not polished layout
- Testimonial text as the hero element (customer quote in conversational language)
- Product appears as it would in a real person's photo: held in hand, on their counter, in their mirror selfie setup
- Lo-fi quality markers: slight grain, warm color cast, casual framing

**Composition:**
- Screenshot-style framing (social media post mockup, review card, text message exchange)
- Or: testimonial card layout with customer photo/avatar, star rating, quote text, and product image
- Asymmetric, casual placement — not grid-aligned, not symmetrical
- Text-heavy: the customer's words are the primary content
- Product appears as contextual element, not hero element
- Optional: simulated notification bar, social media interface elements

**Typography:**
- System fonts or casual sans-serif (looks like social media, not designed)
- Customer quote in larger text, attribution in smaller text
- Star ratings (visual, not text)
- Product name/offer in brand font at bottom as clear CTA strip

**Color Strategy:**
- Neutral/white background simulating social media interface
- Brand accent color for CTA strip at bottom
- Minimal color — let the "screenshot" look authentic
- Warm color cast suggesting real phone camera

**What Differentiates It from Existing Styles:**
- Simulates social media content rather than advertising
- Testimonial/social-proof as visual hero vs. product or concept
- Casual/authentic aesthetic vs. designed/crafted aesthetic
- Interface elements (stars, avatars, comment UI) vs. artistic elements
- Lo-fi intentional vs. hi-fi intentional

**Best D2C Categories:** Universal — works for any category where social proof drives conversion. Particularly effective for: beauty (review cards), supplements (testimonial screenshots), SaaS (tweet/review screenshots), fashion (customer photo reposts)

**Funnel Position:** Mid-funnel (social proof, trust building) and bottom-funnel (review stacking, testimonial urgency)

**Entity ID Distinction:** Social-media-interface composition with screenshot framing, star ratings, and avatar elements is a fundamentally different visual pattern from all other styles. Andromeda categorizes social-proof-style content differently from product shots, scenes, graphics, or data layouts.

---

### Style Summary Matrix

| Style | Visual Signature | Best Categories | Funnel | Uncanny Valley Risk | Production Speed |
|-------|-----------------|-----------------|--------|--------------------|-----------------|
| **Product-on-Gradient** | Clean product on gradient | Beauty, supplements, e-com, electronics | MOF/BOF | None | Fastest |
| **Editorial Cutout** | Collage, selective color, serif type | Fashion, beauty, premium, home | TOF/MOF | None | Fast |
| **Typography-Dominant** | Bold text as hero, graphic poster | SaaS, tech, services, fintech | TOF/BOF | None | Fastest |
| **Infographic/Data-Visual** | Grid layout, icons, data elements | Health, fintech, SaaS, science-backed | MOF/BOF | None | Fast |
| **Lifestyle-Render** | Product in atmospheric environment | Wellness, food, home, sleep, fitness | TOF/MOF | Low (no humans) |  Medium |
| **UGC-Aesthetic Static** | Simulated social post/review card | Universal (social-proof-driven) | MOF/BOF | None | Fast |
| **Anderson Clay Diorama** (existing) | 3D clay miniature theater | Storytelling, emotional brands | TOF/MOF | Low | Medium |
| **Soft Brutalism Clay** (existing) | Bold borders, single clay hero | Bold statements, high-contrast | TOF/MOF | Low | Medium |

---

## 2. Prompt Construction Improvements

### 2.1 Brand-Specific Prompt Engineering

**Current problem:** Both existing workflows use the same visual metaphor library (keys, bridges, doors, roots) regardless of brand. The result is "competent but generic" creative that could work for any competitor with a logo swap (Research D diagnosis).

**Fix: Brand-Anchored Visual Metaphors**

Every prompt must anchor its visual metaphor to the brand's owned positioning, not generic emotional territory. The prompt construction process should follow this sequence:

1. **Extract owned positioning from hook-bank.** Each hook-bank file should contain (after research improvements) the brand's owned claim — the thing only this brand can say.

2. **Derive brand-specific metaphor from owned positioning.** Not "a key to a house" (generic) but "350 doors where each door represents a different lender" (specific to TheRateFinder's 350+ lender network). Not "a bridge from old to new" (generic) but "a PostgreSQL elephant standing on an open-source foundation while Firebase's proprietary wall crumbles" (specific to Supabase's positioning).

3. **Apply the Logo Swap Visual Test.** After writing the prompt, ask: "If I described this scene to someone without showing the brand name, could they guess a competitor?" If yes, the visual metaphor is generic. Revise until the scene is ownable.

**Implementation in prompts:**

```
BRAND ANCHOR:
Owned positioning: [What ONLY this brand can claim]
Visual translation: [How the owned positioning becomes a visual element]
Logo swap check: [Could a competitor use this exact scene? If yes, what makes it specific?]
```

### 2.2 Category-Aware Visual Routing

Different D2C categories have fundamentally different visual requirements (Research B, Section 5). The prompt construction should adapt based on detected category.

| Category | Visual Priority | Avoid | Composition Emphasis |
|----------|----------------|-------|---------------------|
| **Beauty/Skincare** | Texture close-ups, ingredient visibility, warm lighting on skin tones, macro photography feel | Cold/clinical lighting, harsh shadows | Product texture and light reflection, soft warm diffusion |
| **Tech/SaaS** | Clean interfaces, code snippets as texture, dark mode aesthetics, architectural clarity | Cluttered scenes, warm/organic materials | Negative space, sharp edges, monospace elements |
| **Food/Beverage** | Appetizing close-ups, real hands/consumption context, warm ambient lighting, ingredient freshness | Sterile/clinical presentation, isolated product without context | Natural surfaces (wood, marble), macro detail |
| **Fashion** | Movement/drape, fit on body (when possible), fabric texture, styling context | Static flat-lay only, no human reference | Dynamic composition, multiple angles, color accuracy |
| **Fintech/Finance** | Trust signals, clean data, professional restraint, calm colors | Aggressive urgency, cluttered layouts | Structured grids, clear hierarchy, authoritative spacing |
| **Health/Wellness** | Natural ingredients, transformation implied, calm/aspirational mood | Before/after with negative self-perception (Meta policy), overclaiming | Warm natural lighting, organic materials, breathing space |
| **Home Goods** | Environmental context, room setting, lifestyle integration | Isolated product without home context | Scene depth, natural framing, lifestyle micro-story |

**Implementation:** The prompt template should include a `CATEGORY` field that modifies default lighting, color temperature, texture priority, and composition rules. Category is detected from the research brief (brand description, product type, ICP).

### 2.3 Mobile-First Composition Constraints

Research B identifies that 94-98% of Meta activity is on mobile, and 90% of inventory is vertical. Current workflow prompts specify positions like "left side, stacked vertically" without reference to mobile safe zones.

**Required composition constraints in every prompt:**

```
MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35% (Meta UI coverage on Stories/Reels)
- Safe zone: No text in top 14% (status bar coverage on Stories/Reels)
- Thumb zone: Keep CTA above bottom-left and bottom-right corners
- Thumbnail test: Hero element and headline must be legible at 300px width
- Text minimum: All text equivalent to 12pt+ at final display size
- Single-column: For 9:16 formats, stack elements vertically (no side-by-side)
- Hero element: Must occupy at least 30% of frame and be identifiable at thumbnail size
```

**Feed (1:1 and 4:5) vs. Stories/Reels (9:16) adaptation:**
- 1:1/4:5: Product and headline can share horizontal space. CTA in bottom-center.
- 9:16: Vertical stacking. Headline in top third. Product in center. CTA in lower-center (above 35% safe zone).

### 2.4 Aspect Ratio Strategy

Current default: 3 at 1:1, 3 at 9:16. Research B shows 4:5 outperforms 1:1 by up to 15% in Feed. The pipeline should cover three aspect ratios:

| Ratio | Platform Fit | Recommended Mix |
|-------|-------------|-----------------|
| 4:5 (1080x1350) | Feed optimized (outperforms 1:1 by ~15%) | 2 prompts |
| 1:1 (1080x1080) | Feed standard, carousel | 2 prompts |
| 9:16 (1080x1920) | Reels, Stories (90% of Meta inventory) | 2 prompts |

**Per-concept variation:** Each hook concept should be rendered in at least 2 different aspect ratios to maximize placement coverage. The prompt should specify composition adaptation rules per ratio rather than creating entirely separate prompts (same visual concept, adjusted layout).

---

## 3. Entity ID Diversity Strategy

### 3.1 The N Hooks x M Styles Multiplication

Under Andromeda, each genuinely distinct combination of hook concept + visual style has the potential to register as a separate Entity ID. The pipeline's output diversity is the multiplication of hook diversity and visual diversity.

**Current state:** 6 hooks x 1 style = 6 potential Entity IDs (but likely 1-2 due to visual clustering)

**Target state:** 6 hooks x 3-4 styles per brand = 18-24 potential Entity IDs

**How the multiplication works:**

```
Hook 1 (Pain/Problem) x Product-on-Gradient  = Entity ID A
Hook 1 (Pain/Problem) x Typography-Dominant   = Entity ID B
Hook 2 (Social Proof) x UGC-Aesthetic Static  = Entity ID C
Hook 2 (Social Proof) x Infographic           = Entity ID D
Hook 3 (Aspiration)   x Lifestyle-Render      = Entity ID E
Hook 3 (Aspiration)   x Editorial Cutout      = Entity ID F
...
```

Each combination produces a distinct visual fingerprint (different composition, different elements, different scene type) paired with a distinct message — maximizing the chance of Andromeda treating each as a separate Entity ID.

### 3.2 Ensuring Genuine Distinctness

Not all hook-style combinations produce genuinely distinct Entity IDs. The risk is that similar visual compositions collapse even when style names differ. To prevent this, each style must differ on multiple axes that Andromeda's computer vision analyzes:

| Signal Axis (from Research A) | How Styles Must Differ |
|-------------------------------|----------------------|
| **Color composition** | Each style has a fundamentally different color strategy (gradient vs. flat vs. selective vs. warm ambient) |
| **Layout/composition** | Each style uses a different spatial pattern (centered isolation vs. asymmetric collage vs. text-dominant vs. grid-structured vs. environmental scene vs. screenshot framing) |
| **Objects and elements** | Each style features different visual element types (product only vs. clay objects vs. icons/data vs. lifestyle objects vs. social UI elements) |
| **Scene type** | Each style belongs to a different scene category (no scene vs. miniature theater vs. editorial spread vs. data dashboard vs. lifestyle environment vs. social media post) |
| **Text density/position** | Each style has different text treatment (minimal overlay vs. baked-in architectural vs. text-as-hero vs. multi-section labels vs. testimonial quote vs. editorial serif) |

**Validation rule:** Before finalizing a prompt, check that its visual description differs from every other style in the same brand's output on at least 3 of these 5 axes.

### 3.3 Style Selection Per Brand

Not every brand needs all 8 styles. Category-aware style routing selects 3-4 optimal styles per brand based on:

1. **Category fit** (beauty brand gets Product-on-Gradient, Editorial Cutout, Lifestyle-Render, UGC-Aesthetic — not Typography-Dominant or Infographic)
2. **Funnel coverage** (at least one TOF style, one MOF style, one BOF style per brand)
3. **Visual diversity** (selected styles must differ on 3+ signal axes per the validation rule above)
4. **Hook-style alignment** (pain/problem hooks pair better with data-visual or typography; aspiration hooks pair better with lifestyle-render or editorial)

**Default style assignments by category:**

| Category | Style 1 | Style 2 | Style 3 | Optional Style 4 |
|----------|---------|---------|---------|-------------------|
| Beauty/Skincare | Product-on-Gradient | Editorial Cutout | UGC-Aesthetic Static | Lifestyle-Render |
| SaaS/Tech | Typography-Dominant | Infographic/Data | Product-on-Gradient | UGC-Aesthetic Static |
| Fintech/Finance | Typography-Dominant | Infographic/Data | UGC-Aesthetic Static | Editorial Cutout |
| Food/Beverage | Lifestyle-Render | Product-on-Gradient | UGC-Aesthetic Static | Editorial Cutout |
| Fashion/Apparel | Editorial Cutout | Lifestyle-Render | UGC-Aesthetic Static | Product-on-Gradient |
| Health/Wellness | Lifestyle-Render | Infographic/Data | UGC-Aesthetic Static | Product-on-Gradient |
| Home Goods | Lifestyle-Render | Editorial Cutout | Product-on-Gradient | UGC-Aesthetic Static |
| General/Unknown | Product-on-Gradient | Typography-Dominant | UGC-Aesthetic Static | Anderson Clay Diorama |

### 3.4 Hook-to-Style Pairing Logic

Different psychological drivers pair naturally with different visual treatments. The pipeline should use the hook's psychology field to bias style selection:

| Hook Psychology | Primary Style | Secondary Style | Why |
|----------------|--------------|-----------------|-----|
| Pain/Problem | Typography-Dominant | Infographic/Data | Pain hooks work as bold text statements or data-backed problem framing |
| Aspiration/Identity | Lifestyle-Render | Editorial Cutout | Aspiration needs environmental/aesthetic context |
| Social Proof | UGC-Aesthetic Static | Infographic/Data | Social proof needs testimonial framing or data validation |
| Education/Value | Infographic/Data | Lifestyle-Render | Education needs structured information or in-use demonstration |
| Urgency/Scarcity | Typography-Dominant | Product-on-Gradient | Urgency needs bold text impact or direct product + offer |
| Transformation | Editorial Cutout | Product-on-Gradient | Transformation needs before/after visual structure or clear product showcase |
| Curiosity/Question | Typography-Dominant | Anderson Clay Diorama | Questions work as bold text or intriguing visual scenes |

---

## 4. Art Style Skill Architecture

### 4.1 Updated SKILL.md Structure

The art-style SKILL.md should be updated to support:

1. **Category detection** from the hook-bank's brand data
2. **Automatic multi-style routing** (select 3-4 styles per brand instead of 1)
3. **Hook-style pairing** using the hook's psychology field
4. **Per-style workflow dispatch** to individual workflow files

**Proposed SKILL.md routing flow:**

```
1. Read hook-bank file
2. Detect brand category from research brief / hook-bank metadata
3. Select 3-4 styles based on category default table
4. For each hook:
   a. Read hook psychology field
   b. Select optimal style based on hook-style pairing logic
   c. Dispatch to corresponding workflow file
   d. Workflow file writes prompt to output JSON
5. Validate: Each prompt differs from all others on 3+ visual signal axes
6. Write combined output to {brand}_prompts.json
```

### 4.2 Style Routing Table (Updated)

| User Keywords | Workflow |
|---------------|----------|
| "clay", "diorama", "anderson", "theatrical", "miniature" | `workflows/anderson-clay-diorama.md` |
| "brutalism", "soft brutalism", "neo-brutalist", "bold borders" | `workflows/soft-brutalism-clay.md` |
| "gradient", "product shot", "minimal product", "clean product" | `workflows/product-on-gradient.md` |
| "editorial", "cutout", "magazine", "collage", "premium" | `workflows/editorial-cutout.md` |
| "type", "typography", "text", "bold text", "poster" | `workflows/typography-dominant.md` |
| "infographic", "data", "chart", "comparison", "education" | `workflows/infographic-data-visual.md` |
| "lifestyle", "environment", "scene", "context", "atmospheric" | `workflows/lifestyle-render-hybrid.md` |
| "ugc", "testimonial", "review", "social proof", "screenshot" | `workflows/ugc-aesthetic-static.md` |
| (none specified) | **Auto-select based on category** (see 3.3 above) |

**Critical change:** The default is no longer a single style. When no style keyword is specified, the pipeline auto-selects 3-4 styles based on brand category and distributes hooks across them.

### 4.3 Shared Prompt Construction Principles

Every workflow file, regardless of style, must include these shared construction elements:

**1. Hook-Bank Loading (identical across all workflows)**
```
Read hook-bank file for brand
Extract: brand colors (primary, secondary, accent hex values)
Extract: ICP summary and category
Extract: 6 hook concepts with psychology field
```

**2. Brand Anchor Block (new, required in all workflows)**
```
BRAND ANCHOR:
Owned positioning: [from hook-bank or research brief]
Visual translation: [how owned positioning becomes a visual element in THIS style]
Logo swap check: [confirmation that visual is brand-specific]
```

**3. Mobile Constraint Block (new, required in all workflows)**
```
MOBILE CONSTRAINTS:
Safe zone top: 14% clear
Safe zone bottom: 35% clear
Thumb zone: CTA not in bottom corners
Thumbnail legibility: hero + headline readable at 300px
Text size: 12pt+ equivalent at display resolution
```

**4. Aspect Ratio Coverage (required in all workflows)**
```
Generate prompts across aspect ratios:
- 2x at 4:5 (1080x1350) — Feed optimized
- 2x at 1:1 (1080x1080) — Feed standard / carousel
- 2x at 9:16 (1080x1920) — Reels / Stories
```

**5. Output Format (standardized across all workflows)**
```json
{
  "brand": "brandname",
  "style": "style-name",
  "category": "detected-category",
  "brandColors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "concepts": [{
    "concept": 1,
    "story": {
      "hookType": "Pain|Aspiration|Social-Proof|Education|Urgency|Transformation|Curiosity",
      "hookSource": "Research section + element",
      "hookTarget": "ICP segment or General",
      "ownedPositioning": "What only this brand can claim",
      "visualTranslation": "How owned positioning appears visually",
      "psychology": "Why the hook works",
      "hook": "The headline text",
      "body": "Supporting copy",
      "cta": "Call to action text"
    },
    "stage": {
      "style-specific fields here": "varies by workflow"
    },
    "prompt": "Full prompt text...",
    "aspectRatio": "4:5|1:1|9:16",
    "dimensions": "1080x1350|1080x1080|1080x1920"
  }]
}
```

### 4.4 Per-Style Workflow File Structure

Each workflow file must be self-contained (per existing convention) and include:

1. **Style Overview** — What the style is, why it works, visual characteristics
2. **Hook-Bank Loading** — Standard process (shared)
3. **Brand Anchor Derivation** — How to translate owned positioning into this style's visual language
4. **Category Adaptation** — How this style adjusts for different D2C categories
5. **Visual Concept Creation** — Style-specific creative process (metaphor selection, composition, etc.)
6. **Design Principles** — Style-specific rules (composition, typography, color, texture)
7. **Prompt Template** — Style-specific prompt structure with all required blocks
8. **Example Prompts** — 2 complete example prompts demonstrating the style
9. **Mobile Constraint Integration** — How safe zones and thumb zones apply to this style's layout
10. **Anti-Patterns** — What to avoid (style-specific)
11. **Quality Checklist** — Verification items before output
12. **Output Format** — Standard JSON (shared)

### 4.5 Multi-Style Output Flow

When the pipeline generates creatives for a brand with auto-style routing:

```
Input: 6 hooks from hook-bank + brand category

Step 1: Select 3-4 styles based on category
  Example (beauty brand): Product-on-Gradient, Editorial Cutout, UGC-Aesthetic, Lifestyle-Render

Step 2: Assign hooks to styles based on psychology pairing
  Hook 1 (Pain) -> Typography-Dominant or Infographic
  Hook 2 (Social Proof) -> UGC-Aesthetic Static
  Hook 3 (Aspiration) -> Lifestyle-Render
  Hook 4 (Education) -> Infographic or Product-on-Gradient
  Hook 5 (Urgency) -> Typography-Dominant or Product-on-Gradient
  Hook 6 (Transformation) -> Editorial Cutout

Step 3: For each hook-style pair, dispatch to style workflow
  Each workflow generates 1 prompt per assigned hook
  Each prompt specifies aspect ratio (alternating across the set to ensure coverage)

Step 4: Validate Entity ID distinctness
  Check that each prompt differs from all others on 3+ visual signal axes
  If two prompts are too similar, reassign one to a different style

Step 5: Write combined output
  All prompts written to single {brand}_prompts.json
  Each concept includes its style identifier for tracking

Output: 6 prompts across 3-4 styles and 3 aspect ratios
  = 6 visually distinct Entity ID candidates
  (vs. current: 6 prompts in 1 style = 1-2 Entity IDs)
```

---

## Summary

The visual pipeline expansion addresses the binding constraint identified by the critique: visual monotony collapses all hook diversity into 1-2 Entity IDs. The 6 new styles are designed to:

1. **Maximize Entity ID diversity** — Each style produces a fundamentally different visual fingerprint across 5 signal axes (color, layout, elements, scene type, text treatment)
2. **Serve specific D2C categories** — Category-aware routing ensures each brand gets styles matched to its vertical
3. **Cover the full funnel** — Style-funnel mapping ensures TOF, MOF, and BOF are all represented
4. **Eliminate uncanny valley risk** — None of the new styles attempt photorealistic humans
5. **Scale rapidly** — All styles are designed for AI image generation with clear prompt templates
6. **Support brand specificity** — Brand anchor blocks and the logo-swap visual test prevent generic output

The N hooks x M styles multiplication moves the pipeline from generating 6 creatives in 1 visual cluster to generating 6 creatives across 3-4 visual clusters — a 3-4x increase in Entity ID diversity with no change to hook generation volume.
