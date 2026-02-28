# Phase 1: Implementation Specification

**Date:** 2026-02-25
**Scope:** Parallel foundation — visual style expansion + strategic research layer + hook methodology upgrade
**Duration:** Weeks 1-2
**Source:** `docs/creative-pipeline-2026/final_report.md`, `synthesis_a.md`, `synthesis_b.md`, `critique.md`

---

## Dependency Map

```
Stream A: Visual Style Expansion          Stream B: Research + Hooks
(independent — no dependency on B)        (B-2 depends on B-1 sections existing)

[A-1] 6 new workflow files ──┐            [B-1] research.md expansion
[A-2] SKILL.md routing       │            [B-2] hook SKILL.md rewrite
[A-3] Shared prompt blocks   │
[A-4] Category-aware routing ─┘
```

Stream A and Stream B are **fully parallel** — no cross-dependencies during Phase 1.
Within Stream B, B-2 (hook SKILL.md) references the new research sections from B-1, but the hook skill file can be written in parallel since we know the section names and structures in advance.

---

## File Inventory

### Files to CREATE (Stream A)

| # | File Path | Description |
|---|-----------|-------------|
| 1 | `agent/.claude/skills/art-style/workflows/product-on-gradient.md` | New art style workflow |
| 2 | `agent/.claude/skills/art-style/workflows/typography-dominant.md` | New art style workflow |
| 3 | `agent/.claude/skills/art-style/workflows/infographic-data-visual.md` | New art style workflow |
| 4 | `agent/.claude/skills/art-style/workflows/editorial-cutout.md` | New art style workflow |
| 5 | `agent/.claude/skills/art-style/workflows/lifestyle-render-hybrid.md` | New art style workflow |
| 6 | `agent/.claude/skills/art-style/workflows/ugc-aesthetic-static.md` | New art style workflow |

### Files to EDIT

| # | File Path | Stream | Description |
|---|-----------|--------|-------------|
| 7 | `agent/.claude/skills/art-style/SKILL.md` | A | Add routing, category logic, shared blocks |
| 8 | `agent/.claude/agents/research.md` | B-1 | Add 7 new sections + workflow steps |
| 9 | `agent/.claude/skills/hook-methodology/SKILL.md` | B-2 | Rewrite validation, add frameworks, expand extraction |
| 10 | `agent/.claude/skills/hook-methodology/formulas.md` | B-2 | Add new hook source mappings + emotional triggers |

---

## STREAM A: Visual Style Expansion

### Why This Is the Binding Constraint

Under Meta's Andromeda system, ads are assigned Entity IDs based on visual similarity. Currently all pipeline output uses clay diorama aesthetics → all creatives collapse into 1-2 Entity IDs regardless of hook diversity. Adding visually distinct styles is the single highest-leverage change.

**Current state:** 6 hooks × 1 style = 1-2 Entity IDs
**Target state:** 6 hooks × 3-4 styles = 18-24 Entity IDs

### Reference: Existing Workflow Structure

Both existing workflows follow this structure (study these before writing new ones):

- `agent/.claude/skills/art-style/workflows/anderson-clay-diorama.md` — 3 Decisions model (Story → Stage → Frame), hook psychology mapping, lighting/camera/composition specs, texture hierarchy, color temperature, quality checklist, JSON output
- `agent/.claude/skills/art-style/workflows/soft-brutalism-clay.md` — Visual metaphor library, design principles, prompt structure template, text rendering practices, anti-patterns, JSON output

**Key conventions to preserve:**
1. Each workflow is **100% self-contained** — no imports or references to other workflows
2. Hook-bank loading is the first step (extract brand colors, ICP, 6 hook concepts)
3. Output format is `agent/files/creatives/{brand}_prompts.json`
4. JSON structure includes: `brand`, `style`, `brandColors`, `concepts[]` with `story`, `stage`, `prompt`, `aspectRatio`, `size`

### Reference: Existing Art Style SKILL.md (Current State)

**File:** `agent/.claude/skills/art-style/SKILL.md`
**Current content:** 52 lines. Routes by keyword to workflow files. Default is anderson-clay-diorama. Lists 2 active styles + 2 future placeholders (surrealist-scale, minimal-photography).

---

### A-1: New Workflow Files

Each new workflow file MUST include these 12 sections:

1. **Style Overview** — What, why, visual characteristics
2. **Hook-Bank Loading** — Standard: read hook-bank, extract brand colors + ICP + 6 hooks
3. **Brand Anchor Derivation** — How owned positioning translates to THIS style's visual language
4. **Category Adaptation** — How this style adjusts for different D2C verticals
5. **Visual Concept Creation** — Style-specific creative process
6. **Design Principles** — Composition, typography, color, texture rules
7. **Prompt Template** — Style-specific prompt structure
8. **Example Prompts** — 2 complete example prompts
9. **Mobile Constraint Integration** — Safe zones, thumb zones for this layout
10. **Anti-Patterns** — What to avoid
11. **Quality Checklist** — Verification items
12. **Output Format** — Standard JSON

Each workflow must also include these **shared blocks** (new requirement):

**Brand Anchor Block:**
```
BRAND ANCHOR:
Owned positioning: [from hook-bank or research brief]
Visual translation: [how owned positioning becomes a visual element in THIS style]
Logo swap check: [confirmation that visual is brand-specific]
```

**Mobile Constraint Block:**
```
MOBILE CONSTRAINTS:
- Safe zone: No text or critical elements in bottom 35% (Meta UI on Stories/Reels)
- Safe zone: No text in top 14% (status bar on Stories/Reels)
- Thumb zone: Keep CTA above bottom-left and bottom-right corners
- Thumbnail test: Hero element and headline must be legible at 300px width
- Text minimum: All text equivalent to 12pt+ at final display size
- Single-column: For 9:16, stack elements vertically
- Hero element: Must occupy at least 30% of frame
```

**Aspect Ratio Coverage:**
```
Generate prompts across aspect ratios:
- 2x at 4:5 (1080x1350) — Feed optimized (outperforms 1:1 by ~15%)
- 2x at 1:1 (1080x1080) — Feed standard / carousel
- 2x at 9:16 (1080x1920) — Reels / Stories
```

**Standardized JSON Output:**
```json
{
  "brand": "brandname",
  "style": "style-name-here",
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
      "...style-specific fields...": "varies per workflow"
    },
    "prompt": "Full prompt text...",
    "aspectRatio": "4:5|1:1|9:16",
    "dimensions": "1080x1350|1080x1080|1080x1920"
  }]
}
```

---

#### Workflow 1: Product-on-Gradient

**File:** `agent/.claude/skills/art-style/workflows/product-on-gradient.md`
**Priority:** P0 — first to implement (lowest risk, highest versatility)

**Visual spec:**
- Product isolated on solid/multi-color gradient background
- No environment, no humans, no lifestyle elements
- Product as clear focal point: 30-40% of frame
- Gradient types: aurora multi-color, radial spotlight, duotone bold, flat solid
- Subtle grain texture overlay for richness
- Product shadow grounding (soft drop or reflection)

**Composition:**
- Product centered or rule-of-thirds
- 50-60% negative space for typography
- Single-column vertical for mobile
- Text in top 40% of frame
- Minimal: product + headline + CTA only

**Typography:**
- Bold sans-serif, 5-7 words max, high contrast against gradient
- Readable at thumbnail (12pt+ equivalent)
- Text baked into composition
- CTA in accent color, below headline or bottom-center above safe zone

**Color strategy:**
- Gradient from brand colors: primary dominant, secondary as transition
- Duotone option: two bold brand colors
- Accent reserved for CTA only

**What makes it Entity-ID-distinct:**
- No clay textures, no borders, no scene
- Flat (product + background) vs layered depth of diorama
- Different color composition (gradient vs flat/selective)
- Different scene type (no scene vs miniature theater)
- Different text treatment (minimal overlay vs architectural)

**Best categories:** Beauty, supplements, e-commerce, electronics, accessories
**Funnel position:** MOF/BOF (product education, direct response)

**Stage-specific JSON fields:**
```json
"stage": {
  "gradientType": "aurora|radial|duotone|solid",
  "gradientColors": ["#HEX", "#HEX"],
  "productPlacement": "centered|rule-of-thirds",
  "negativeSpace": "percentage",
  "grainTexture": true
}
```

---

#### Workflow 2: Typography-Dominant

**File:** `agent/.claude/skills/art-style/workflows/typography-dominant.md`
**Priority:** P0

**Visual spec:**
- Bold typography IS the hero: text occupies 60-70% of frame
- Minimal/no product imagery (10-15% of frame max)
- Large stacked, stretched, or rotated letterforms
- High contrast: dark bg + light text or light bg + dark text
- Kinetic energy: type in motion (stretched, overlapping, breaking grid)
- Graphic elements: lines, color blocks, geometric accents

**Composition:**
- Text-first layout: headline dominates
- Product subordinate (small corner or bottom strip if present)
- Rule-breaking: text extends to edges, overlaps borders
- Vertical stacking for 9:16, horizontal sweep for 1:1
- No scene, no environment

**Typography:**
- Extra Bold / Black weight, condensed or extended
- Sans-serif: Impact, Bebas Neue, Anton or similar
- Variable weight for hierarchy (Ultra Bold headline, Medium subtext)
- Headline in brand primary, accent word in contrasting color
- Text as texture: repeated words at different opacities

**Color strategy:**
- High contrast, 2-3 colors max
- Black + brand accent, or white + brand primary, or primary + secondary
- No gradients, no textures — flat, graphic, poster-like
- Color blocking: large solid fields divided by text

**What makes it Entity-ID-distinct:**
- No product scene, no rendered objects
- Text as visual hero (opposite of clay diorama)
- Graphic/poster aesthetic, flat 2D
- Zero uncanny valley risk
- Radically different from every other style

**Best categories:** SaaS, tech, services, fintech, coaching, education, subscriptions
**Funnel position:** TOF (pattern interruption) and BOF (offer-driven)

**Stage-specific JSON fields:**
```json
"stage": {
  "textHierarchy": "stacked|stretched|rotated|overlapping",
  "fontWeight": "Extra Bold|Black|Condensed",
  "colorBlocking": "description of color field arrangement",
  "productPresence": "none|minimal-corner|bottom-strip",
  "graphicAccents": "lines|blocks|geometric shapes"
}
```

---

#### Workflow 3: Infographic / Data-Visual

**File:** `agent/.claude/skills/art-style/workflows/infographic-data-visual.md`
**Priority:** P0

**Visual spec:**
- Educational, authority-building layouts
- Data viz elements: comparison charts, step breakdowns, numbered lists, progress bars
- Flat icon illustrations (not 3D)
- Clean grid layout, clear information hierarchy
- Divider lines, numbered sections, labeled callouts
- Factual/scientific tone through structure

**Composition:**
- Grid-based, structured, organized — order signals credibility
- 3-4 sections in single frame (e.g. "3 Steps to X")
- Icons at consistent size across sections
- Headline top, structured content middle, CTA bottom
- Comparison layout option: left vs right (brand vs competitors, before vs after)
- Check/cross marks, star ratings, percentage bars as proof elements

**Typography:**
- Clean sans-serif throughout
- Multiple sizes: headline (large), section headers (medium), body (small readable)
- Numbers/statistics rendered large and bold as visual anchors
- Brand primary for headers, neutral dark for body, accent for key stats

**Color strategy:**
- Clinical base: white or light gray background
- Brand primary for headers and data points
- Brand secondary for dividers
- Accent sparingly for most important stat or CTA
- Muted overall — authority from structure, not color intensity

**What makes it Entity-ID-distinct:**
- Information-dense (multiple data points per frame)
- Grid/structured layout vs compositional art direction
- Flat icons and data elements vs rendered objects
- Educational tone vs emotional/atmospheric tone
- Compositionally alien to every other style

**Best categories:** Health/wellness, fintech, SaaS, supplements, any science-backed brand
**Funnel position:** MOF (education, proof) and BOF (data-backed offers)

**Stage-specific JSON fields:**
```json
"stage": {
  "layoutType": "steps|comparison|checklist|stats-grid|breakdown",
  "sectionCount": 3,
  "dataElements": ["icon-list", "percentage-bar", "checkmarks"],
  "comparisonMode": "left-right|before-after|none",
  "backgroundTone": "white|light-gray"
}
```

---

#### Workflow 4: Editorial Cutout

**File:** `agent/.claude/skills/art-style/workflows/editorial-cutout.md`
**Priority:** P0

**Visual spec:**
- Product isolated with artistic cut-out edges (slightly rough, not pixel-perfect)
- Selective color: product in full color against monochrome/desaturated/tinted bg
- Magazine-editorial aesthetic — product as design object
- Layered: overlapping geometric shapes (circles, rectangles) framing product
- Collage-influenced: multiple product angles or components in editorial layout
- Paper-texture or linen-texture background

**Composition:**
- Asymmetric with deliberate visual tension (breaks clay diorama's bilateral symmetry)
- Product at 40%, secondary elements (ingredient close-ups, texture details, color swatches)
- Overlapping layers create depth without 3D rendering
- Grid-based but intentionally broken (editorial magazines break the grid)
- White space as design element

**Typography:**
- Serif or editorial serif/sans-serif pairing (distinct from clay's geometric sans-serif)
- Title-case, not ALL CAPS (editorial voice, not brutalist)
- Smaller body text permitted (editorial supports more text)
- Pull-quote treatment: key benefit highlighted large with quotation marks
- Text wraps around or overlaps product cutout

**Color strategy:**
- Dominant: neutral base (off-white, warm gray, soft blush, sage)
- Selective saturation: product in vivid brand colors against muted surroundings
- Accent pops in geometric overlays
- No gradients — flat color fields and layered shapes

**What makes it Entity-ID-distinct:**
- Flat layered composition (collage) vs 3D depth
- Serif typography vs geometric sans-serif
- Asymmetric layout vs bilateral symmetry
- Paper/linen texture vs clay materiality
- Selective color vs full-color scene

**Best categories:** Fashion, beauty, premium accessories, lifestyle, home goods
**Funnel position:** TOF (aspirational) and MOF (product education through detail)

**Stage-specific JSON fields:**
```json
"stage": {
  "cutoutStyle": "rough-edge|clean-edge|torn-paper",
  "colorTreatment": "selective-saturation|monochrome-bg|tinted-bg",
  "overlayShapes": ["circles", "rectangles"],
  "textureBackground": "paper|linen|canvas",
  "typographyPairing": "serif-heading|serif-sans-body"
}
```

---

#### Workflow 5: Lifestyle-Render Hybrid

**File:** `agent/.claude/skills/art-style/workflows/lifestyle-render-hybrid.md`
**Priority:** P1

**Visual spec:**
- Atmospheric environmental rendering, product in idealized context
- NOT photorealistic humans — aspirational scenes with product in warm environments
- Environments: morning kitchen counter, bathroom shelf, bedside table, gym bag, picnic spread
- Soft natural lighting (golden hour, window light, diffused daylight)
- Depth of field: product sharp foreground, environment blurred behind
- Warm, lived-in quality — not sterile, not clinical

**Composition:**
- Environment 60%, product 30%, text 10%
- Product at natural eye-level within scene (on counter, shelf, table)
- Scene tells micro-story: coffee cup next to supplement, journal beside skincare
- Complementary objects (not competing products) create context
- Natural framing: window frame, shelf edge, table edge as anchors

**Typography:**
- Minimal text overlay — scene communicates, text adds CTA only
- Short headline with semi-transparent background bar for legibility
- Warm-toned text harmonizing with scene
- Positioned in natural negative space (not covering product)

**Color strategy:**
- Warm natural tones: amber, warm white, soft green, earth tones
- Brand colors through product itself and subtle environmental elements
- Golden-hour color grading on environment
- No flat color fields — ambient lighting variation throughout

**What makes it Entity-ID-distinct:**
- Environmental scene with depth vs isolated product or abstract composition
- Natural lighting simulation vs theatrical/studio lighting
- Atmospheric mood vs graphic impact
- Scene-based (lifestyle story) vs concept-based (hook story)

**Best categories:** Wellness, skincare, home goods, fitness, coffee/food, candles, bedding
**Funnel position:** TOF (aspirational) and MOF (product-in-use)

**Stage-specific JSON fields:**
```json
"stage": {
  "environment": "kitchen|bathroom|bedside|gym|outdoor|office",
  "lightingMood": "golden-hour|window-light|diffused-daylight|candlelight",
  "depthOfField": "shallow|medium",
  "complementaryObjects": ["description of lifestyle objects in scene"],
  "colorGrading": "warm-golden|cool-morning|soft-neutral"
}
```

---

#### Workflow 6: UGC-Aesthetic Static

**File:** `agent/.claude/skills/art-style/workflows/ugc-aesthetic-static.md`
**Priority:** P1

**Visual spec:**
- Designed to look like screenshot from real social media post or review
- Simulated UGC elements: screenshot framing, profile header, like/comment counts, star ratings
- "Real person" feel through casual composition
- Testimonial text as hero element (customer quote in conversational language)
- Product appears as it would in real person's photo (held, on counter, in mirror)
- Lo-fi quality: slight grain, warm color cast, casual framing

**Composition:**
- Screenshot-style framing (social post mockup, review card, text message)
- Or: testimonial card with avatar, star rating, quote, product image
- Asymmetric, casual placement — not grid-aligned, not symmetrical
- Text-heavy: customer words are primary content
- Product as contextual element, not hero
- Optional: simulated notification bar, social media interface elements

**Typography:**
- System fonts or casual sans-serif (looks social media, not designed)
- Customer quote in larger text, attribution smaller
- Star ratings (visual)
- Brand font for CTA strip at bottom

**Color strategy:**
- Neutral/white bg simulating social media interface
- Brand accent for CTA strip at bottom
- Minimal color — let "screenshot" look authentic
- Warm color cast suggesting real phone camera

**What makes it Entity-ID-distinct:**
- Simulates social content, not advertising
- Testimonial/social-proof as visual hero
- Casual/authentic aesthetic vs designed/crafted
- Interface elements (stars, avatars, UI) vs artistic elements
- Lo-fi intentional vs hi-fi intentional

**Best categories:** Universal — any category where social proof drives conversion
**Funnel position:** MOF (social proof, trust) and BOF (review stacking, urgency)

**Stage-specific JSON fields:**
```json
"stage": {
  "ugcFormat": "review-card|social-post|text-message|testimonial-card",
  "interfaceElements": ["star-rating", "avatar", "like-count", "comment-count"],
  "testimonialText": "The customer quote used as hero",
  "productPresentation": "held-in-hand|on-counter|contextual-background",
  "ctaStrip": "brand-accent-bottom-bar"
}
```

---

### A-2: Art Style SKILL.md Rewrite

**File:** `agent/.claude/skills/art-style/SKILL.md`

Replace the entire file. The new version must include:

1. **Expanded routing table** with all 8 styles (2 existing + 6 new)
2. **Category-aware default routing** — auto-select 3-4 styles when no keyword specified
3. **Hook-to-style pairing logic** — map psychological drivers to optimal styles
4. **Multi-style output flow** — generate across 3-4 styles per brand, not just 1
5. **Entity ID validation rule** — each prompt must differ from others on 3+ visual signal axes

#### New Routing Table

```
| User Keywords | Workflow |
|---------------|----------|
| "clay", "diorama", "anderson", "theatrical", "miniature", "handcrafted" | workflows/anderson-clay-diorama.md |
| "brutalism", "soft brutalism", "neo-brutalist", "bold borders" | workflows/soft-brutalism-clay.md |
| "gradient", "product shot", "minimal product", "clean product" | workflows/product-on-gradient.md |
| "editorial", "cutout", "magazine", "collage", "premium" | workflows/editorial-cutout.md |
| "type", "typography", "text", "bold text", "poster" | workflows/typography-dominant.md |
| "infographic", "data", "chart", "comparison", "education" | workflows/infographic-data-visual.md |
| "lifestyle", "environment", "scene", "context", "atmospheric" | workflows/lifestyle-render-hybrid.md |
| "ugc", "testimonial", "review", "social proof", "screenshot" | workflows/ugc-aesthetic-static.md |
| (none specified) | **Auto-select 3-4 styles based on category** |
```

#### Category-Aware Default Routing

When no style keyword is specified, detect brand category from research brief and select 3-4 styles:

```
| Category | Style 1 | Style 2 | Style 3 | Optional 4 |
|----------|---------|---------|---------|------------|
| Beauty/Skincare | Product-on-Gradient | Editorial Cutout | UGC-Aesthetic | Lifestyle-Render |
| SaaS/Tech | Typography-Dominant | Infographic/Data | Product-on-Gradient | UGC-Aesthetic |
| Fintech/Finance | Typography-Dominant | Infographic/Data | UGC-Aesthetic | Editorial Cutout |
| Food/Beverage | Lifestyle-Render | Product-on-Gradient | UGC-Aesthetic | Editorial Cutout |
| Fashion/Apparel | Editorial Cutout | Lifestyle-Render | UGC-Aesthetic | Product-on-Gradient |
| Health/Wellness | Lifestyle-Render | Infographic/Data | UGC-Aesthetic | Product-on-Gradient |
| Home Goods | Lifestyle-Render | Editorial Cutout | Product-on-Gradient | UGC-Aesthetic |
| General/Unknown | Product-on-Gradient | Typography-Dominant | UGC-Aesthetic | Anderson Clay Diorama |
```

#### Hook-to-Style Pairing Logic

When assigning hooks to styles, use the hook's psychological driver:

```
| Hook Psychology | Primary Style | Secondary Style |
|----------------|--------------|-----------------|
| Pain/Problem | Typography-Dominant | Infographic/Data |
| Aspiration/Identity | Lifestyle-Render | Editorial Cutout |
| Social Proof | UGC-Aesthetic Static | Infographic/Data |
| Education/Value | Infographic/Data | Lifestyle-Render |
| Urgency/Scarcity | Typography-Dominant | Product-on-Gradient |
| Transformation | Editorial Cutout | Product-on-Gradient |
| Curiosity/Question | Typography-Dominant | Anderson Clay Diorama |
```

#### Multi-Style Output Flow

```
Input: 6 hooks from hook-bank + brand category

Step 1: Select 3-4 styles based on category
Step 2: Assign hooks to styles based on psychology pairing
Step 3: For each hook-style pair, dispatch to style workflow
Step 4: Validate Entity ID distinctness (3+ visual signal axes differ)
Step 5: Write combined output to {brand}_prompts.json

Output: 6 prompts across 3-4 styles and 3 aspect ratios
```

#### Entity ID Validation Rule

Each prompt must differ from every other prompt in the same brand's output on at least 3 of these 5 axes:

1. **Color composition** — gradient vs flat vs selective vs warm ambient
2. **Layout/composition** — centered isolation vs asymmetric collage vs text-dominant vs grid vs environmental vs screenshot
3. **Objects/elements** — product only vs clay vs icons/data vs lifestyle objects vs social UI
4. **Scene type** — no scene vs miniature theater vs editorial spread vs data dashboard vs lifestyle env vs social post
5. **Text density/position** — minimal overlay vs baked-in vs text-as-hero vs multi-section labels vs testimonial quote vs editorial serif

---

## STREAM B-1: Research Agent Expansion

### File: `agent/.claude/agents/research.md`

**Current state:** 303 lines. 4-step workflow (Extract Brand Name → Fetch Homepage → Analyze ICP → Write Brief). Output: ~60-70 lines. Single homepage fetch only.

**Target state:** ~450-500 lines. 8-step workflow adding about/story page fetch, competitive scan, customer language scan, and strategic analysis. Output: ~150-200 lines with 7 new sections.

### Changes Summary

1. Update frontmatter: add `WebSearch` to tools list
2. Update "Your Job" section: add strategic analysis responsibilities
3. Add Step 2.5: Fetch About/Story Page
4. Add Step 2.6: Competitive Scan
5. Add Step 2.7: Customer Language Scan
6. Add Step 3.5: Strategic Analysis
7. Expand Step 4 output template with 7 new sections
8. Update Rules: line target from ~60-70 to ~150-200
9. Add tooling constraints documentation

### Detailed Changes

#### Change 1: Frontmatter

**Current:**
```
tools: WebFetch, Read, Write
```

**New:**
```
tools: WebFetch, WebSearch, Read, Write
```

#### Change 2: "Your Job" Section

**Current:**
```
- Extract DATA from the homepage
- Report FACTS with specific numbers
- Analyze TARGET AUDIENCE / ICP
- Keep output concise (~60-70 lines)
```

**New:**
```
- Extract DATA from the homepage and about page
- Report FACTS with specific numbers
- Analyze TARGET AUDIENCE / ICP
- Conduct COMPETITIVE SCAN (identify top 2-3 competitors, their claims)
- Gather CUSTOMER LANGUAGE (reviews, Reddit, community discussions)
- Perform STRATEGIC ANALYSIS (owned positioning, competitive context, buying objections, feature-to-emotion translation)
- Keep output structured (~150-200 lines)
```

#### Change 3: Add Step 2.5 — Fetch About/Story Page

Insert after Step 2 (Fetch Homepage), before Step 3 (Analyze ICP):

```markdown
### Step 2.5: Fetch About/Story Page

Try to WebFetch the brand's about page for founder/origin story:

**Try these URLs in order (stop at first success):**
1. `{brand_url}/about`
2. `{brand_url}/about-us`
3. `{brand_url}/our-story`

**WebFetch prompt:**
\```
Extract from this about/story page:

FOUNDER STORY:
- Why does this brand exist?
- What problem were the founders personally solving?
- How is the founder connected to the problem?

BRAND ORIGIN:
- What insight or event led to creating this brand?
- What approach did they take that was different?

COMPANY FACTS:
- Team size, founding year, location
- Mission statement (exact text if available)
- Awards, press mentions, notable milestones
\```

**If no about page exists:** Skip this step. Note "[About page not available]" in Brand Story section.
```

#### Change 4: Add Step 2.6 — Competitive Scan

```markdown
### Step 2.6: Competitive Scan

Use WebSearch to identify competitors and their positioning.

**Search queries (run 2-3):**
1. `"[brand name] competitors"` or `"[brand name] vs"`
2. `"[category] alternatives to [brand name]"`
3. `"best [category] [current year]"`

**From search results, identify top 2-3 competitors.**

**For each competitor, WebFetch their homepage with this prompt:**
\```
Extract from this competitor homepage:
- Primary headline (exact text)
- Main tagline or value proposition
- Top 3 claimed differentiators
- Emotional tone (what emotion does their messaging target?)
- Key proof points (numbers, ratings, customer counts)
\```

**If competitors cannot be identified or fetched:** Use LLM category knowledge with explicit marking: "[Competitive context based on general category knowledge — verify with brand]"

**Time budget:** Max 2-3 competitor fetches. Don't exhaustively scan — rough competitive intelligence is far better than none.
```

#### Change 5: Add Step 2.7 — Customer Language Scan

```markdown
### Step 2.7: Customer Language Scan

Use WebSearch to find authentic customer language about the brand.

**Search queries (run 2-3):**
1. `"[brand name] reviews"`
2. `"site:reddit.com [brand name]"` or `"[brand name] reddit"`
3. `"[brand name] product hunt"` (for tech/SaaS brands)

**From search result snippets, extract:**
- Verbatim customer phrases (positive and negative)
- Common complaints or hesitations
- How customers describe the transformation/outcome
- Trigger events (what made them seek this solution)

**Important:** Extract language from search result SNIPPETS — don't try to scrape full review pages (pagination won't work). WebSearch snippets contain enough language signal.

**If no customer language found:** Use homepage testimonials + LLM inference about typical customer language for this category. Mark inferred language: "[Inferred from category — not verbatim customer language]"
```

#### Change 6: Add Step 3.5 — Strategic Analysis

Insert after Step 3 (Analyze ICP), before Step 4 (Write Brief):

```markdown
### Step 3.5: Strategic Analysis

Using ALL data gathered (homepage, about page, competitors, customer language), populate the strategic sections.

**This step uses LLM reasoning on the extracted data. No new fetches needed.**

**Populate these sections:**

**A. Owned Positioning** — What can ONLY this brand claim? What are competitors NOT claiming? Write a one-sentence Differentiation Thesis. VALIDATION: If the thesis could apply to a competitor by changing the brand name, it is too generic — revise.

**B. Competitive Context** — List top 2-3 competitors with their primary claims and emotional territory. Identify messaging overlap (crowded zone) and white space opportunities (untapped angles).

**C. Buying Objections** — For each ICP segment, what stops them from buying? What is the brand's answer? How can each objection be framed as a hook angle?

**D. Feature-to-Emotion Translation** — For each key value prop: what is the technical benefit → what is the emotional benefit → how to express as a hook.

**E. Customer Language & VoC** — Trigger events, verbatim pain language, outcome language, buying hesitations. Mark verbatim vs inferred.

**F. Brand Story / Origin** — Origin moment, founder connection, brand archetype (Hero/Sage/Caregiver/Rebel/Creator/Explorer). Skip if not available.

**G. Category Intelligence** — Market trends, seasonal opportunities, regulatory context, category sentiment.
```

#### Change 7: Expand Step 4 Output Template

The existing output template sections (The Offer through ICP) remain **unchanged**. Add these 7 new sections AFTER the existing ICP section:

```markdown
---

## Owned Positioning

### What can ONLY this brand claim?
[Specific capability, metric, approach, or story that no direct competitor shares]
[Must be verifiable from homepage data or publicly available information]

### What are ZERO competitors claiming in this category?
[Messaging gap or positioning angle that is unoccupied]

### Differentiation Thesis
[One sentence: Why should a customer choose this brand over the top 2-3 alternatives?]
[Must reference a specific owned element, not a generic category benefit]

---

## Competitive Context

### Direct Competitors (Top 2-3)
- [Competitor 1]: Primary claim = "[what they say]". Emotional territory = [emotion they own]
- [Competitor 2]: Primary claim = "[what they say]". Emotional territory = [emotion they own]
- [Competitor 3]: Primary claim = "[what they say]". Emotional territory = [emotion they own]

### Messaging Overlap (Crowded Zone)
What claims are ALL competitors making? (These are NOT differentiating hooks)
- [Shared claim 1]
- [Shared claim 2]

### White Space Opportunities
What emotional territories or messaging angles are NO competitors using?
- [Untapped angle 1]
- [Untapped angle 2]

### Source
[Competitor data from: WebSearch / WebFetch / LLM category knowledge]

---

## Buying Objections (Per ICP Segment)

### Segment: [Name from ICP section]
- Objection 1: "[What stops them from buying?]"
  - Brand's answer: [How the brand addresses this]
  - Hook potential: [How to frame as a hook angle]
- Objection 2: "[Concern]"
  - Brand's answer: [From homepage or inferred]
  - Hook potential: [Hook angle]

### Common Category Objections
- "[Category-wide objection]"
- "[Category-wide objection]"

---

## Feature-to-Emotion Translation

### [Feature/Value Prop 1]
- Technical benefit: [What it enables functionally]
- Emotional benefit: [Why the customer FEELS motivated]
- Hook framing: [How to express as a hook]

### [Feature/Value Prop 2]
[Same structure]

### [Feature/Value Prop 3]
[Same structure]

---

## Customer Language & VoC Signals

### Source
[Where gathered: homepage testimonials / WebSearch reviews / Reddit / LLM inference]

### Trigger Events
- Event 1: "[Specific situation that creates urgency]"
- Event 2: "[Specific situation]"

### Customer Pain Language (Their words, not brand's words)
- "[Verbatim or inferred phrase]"
- "[Verbatim or inferred phrase]"

### Outcome Language (How customers describe the result)
- "[Transformation language]"

### Buying Hesitations (Pre-purchase)
- "[What almost stopped them from buying]"

---

## Brand Story / Origin

### Source
[About page / WebSearch / LLM knowledge / Not available]

### Origin Moment
[Why this brand exists, what problem founders were solving]

### Founder Connection
[How founder is personally connected to the problem]

### Brand Archetype
[Hero / Sage / Caregiver / Rebel / Creator / Explorer / Other]

---

## Category Intelligence

### Market Trends
[What is changing in this vertical?]

### Seasonal / Temporal Opportunities
- [Season/event 1]: [Hook opportunity]
- [Season/event 2]: [Hook opportunity]

### Regulatory / Compliance Context
[Constraints that shape positioning]

### Category Sentiment
[Growing/contracting? Trust shifts? Cultural changes?]

### Source
[WebSearch / LLM category knowledge]
```

#### Change 8: Update Rules

**Current Rule 6:**
```
6. **Keep it concise** - ~60-70 lines max
```

**New Rule 6:**
```
6. **Keep it structured** - ~150-200 lines. The existing sections (The Offer through ICP) stay concise. The new strategic sections (Owned Positioning through Category Intelligence) add depth that downstream skills depend on.
```

**Add new rules:**

```
7. **Mark data sources** - For each new section, note whether data came from WebFetch, WebSearch, homepage testimonials, or LLM inference. Never present LLM inference as verified fact.
8. **Don't invent** - If competitive data, customer language, or brand story isn't available, say so. "[Not available from public sources]" is better than fabrication.
9. **Time budget** - Aim for 3-5 minutes per brand. Don't exhaustively search — rough strategic intelligence is far better than none.
```

---

## STREAM B-2: Hook Methodology SKILL.md Rewrite

### File: `agent/.claude/skills/hook-methodology/SKILL.md`

**Current state:** 453 lines. 5-step process (Extract → Match → Construct → Body+CTA → Variety Check). 10 hook types. Simple validation checklist. No funnel awareness, no format tagging, no logo-swap enforcement.

**Target state:** ~650-700 lines. Same core philosophy and 10 hook types. Major additions: expanded extraction for new research sections, funnel mapping step, 3-3-3 variety framework, 5-gate hard validation with revision instructions, enriched output format.

### Changes Summary

1. Expand Step 1 (EXTRACT) with new research section mining
2. Add Step 1.5: FUNNEL MAPPING
3. Keep Steps 2-3 (MATCH, CONSTRUCT) mostly unchanged
4. Expand Step 4 (BODY + CTA) with funnel-stage CTA specificity
5. Add Step 4.5: VISUAL DIRECTION NOTE
6. Replace Step 5 (VARIETY CHECK) with 3-3-3 Variety Framework
7. Replace Validation Checklist with 5-Gate Hard Validation
8. Update Output Format with new metadata fields
9. Update Extraction Checklist
10. Add Andromeda Copy Optimization reference section

### Detailed Changes

#### Change 1: Expand Step 1 (EXTRACT)

**Keep all existing extraction blocks unchanged.** Add these NEW extraction blocks after the ICP extraction:

```markdown
---

### FROM: Owned Positioning (NEW — if available in research)
Extract:
- The specific owned claim (anchor for every hook that fails Logo Swap Test)
- White space opportunities (untapped emotional territories)
- The Differentiation Thesis (one-sentence unique value)

---

### FROM: Competitive Context (NEW — if available in research)
Extract:
- What competitors claim (these are NOT hook material — they are the crowded zone)
- What NO competitor claims (these ARE hook material — they are white space)
- Emotional territories that are untapped in the category

---

### FROM: Buying Objections (NEW — if available in research)
Extract:
- Each objection as a separate hook angle
- The brand's answer to each objection (becomes the hook body)
- Match objections to ICP segments

---

### FROM: Feature-to-Emotion Translation (NEW — if available in research)
Extract:
- The emotional benefit of each feature (this is the hook, not the feature itself)
- The hook framing suggestion from the research

---

### FROM: Customer Language / VoC (NEW — if available in research)
Extract:
- Verbatim customer phrases (use directly in hooks)
- Trigger events (situational hooks: "Just got rejected by your bank?")
- Outcome language (transformation hooks: "[Customer's words for the result]")

---

### FROM: Brand Story / Origin (NEW — if available in research)
Extract:
- Founder origin moment (narrative hook)
- The "why this exists" angle (emotional weight that feature-hooks lack)
- Brand archetype (affects tone of all hooks)

---

### FROM: Category Intelligence (NEW — if available in research)
Extract:
- Seasonal/temporal hooks ("Tax season? Here's why this matters now.")
- Trend hooks ("In 2026, [category shift] means [consequence].")
- Regulatory/cultural shift hooks
```

#### Change 2: Update Extraction Checklist

Replace the existing checklist with:

```markdown
## Extraction Checklist

**STOP. Before writing ANY hooks, verify you have extracted from:**

EXISTING SECTIONS:
- [ ] **The Offer** — Core promise, key numbers
- [ ] **Key Value Props** — ALL differentiators listed
- [ ] **Proof Points** — ALL stats, ratings, real deals
- [ ] **Products/Services** — EVERY product category (CRITICAL)
- [ ] **Pain Points Addressed** — ALL pain + solution pairs
- [ ] **Testimonials** — ALL customer quotes
- [ ] **Brand Voice** — Tone noted for calibration
- [ ] **Their Messaging** — Headlines, taglines, CTAs captured
- [ ] **ICP Segment 1** — WHO, PAIN, MOTIVATION, LANGUAGE
- [ ] **ICP Segment 2** — (if exists)
- [ ] **ICP Segment 3** — (if exists)

NEW SECTIONS (extract if available in research):
- [ ] **Owned Positioning** — Owned claim, white space, differentiation thesis
- [ ] **Competitive Context** — Crowded zone (avoid), white space (target)
- [ ] **Buying Objections** — Each objection as a hook angle
- [ ] **Feature-to-Emotion** — Emotional benefits as hook material
- [ ] **Customer Language / VoC** — Verbatim phrases, trigger events, outcome language
- [ ] **Brand Story / Origin** — Founder narrative, "why we exist" angle
- [ ] **Category Intelligence** — Temporal hooks, trend hooks

**If any existing checkbox is unchecked, go back. New sections may not exist yet in older research briefs — skip if not present, but extract if available.**
```

#### Change 3: Add Step 1.5 — FUNNEL MAPPING

Insert between Step 1 (EXTRACT) and Step 2 (MATCH):

```markdown
## Step 1.5: FUNNEL MAPPING

After extraction, map each research element to its natural funnel stage:

### TOF-Ready Elements (Awareness — spark curiosity, not sell)
- Pain points naming universal frustrations (not brand-specific)
- Surprising stats that challenge assumptions
- Category-level problems creating "I have this problem" recognition
- Emotional triggers: Curiosity, Relatability, Pattern Interrupt

### MOF-Ready Elements (Consideration — show HOW it works)
- Mechanism/methodology differentiators
- Social proof with specific numbers (reviews, customer count, results)
- Feature-to-emotion translations (why features matter emotionally)
- Objection-handling proof points
- Emotional triggers: Social Proof, Security, Belonging

### BOF-Ready Elements (Conversion — close the sale)
- Direct offers with specific numbers (discounts, guarantees, timelines)
- Urgency/scarcity elements (limited availability, seasonal timing)
- Stacked proof (multiple proof points combined)
- Risk-reversal language (guarantees, free trials, easy returns)
- Emotional triggers: Loss Aversion, FOMO, Specificity

**Map at least 2-3 research elements to each funnel stage before constructing hooks.**
```

#### Change 4: Expand Step 4 — CTA by Funnel Stage

Add after the existing CTA Formula:

```markdown
### CTA by Funnel Stage

| Funnel Stage | CTA Approach | Top Performers | Avoid |
|-------------|-------------|----------------|-------|
| **TOF** | Soft, exploratory | "See how it works" / "Learn more" / "Discover" | "Buy now" / "Shop now" / Price mentions |
| **MOF** | Trust-building | "Read the reviews" / "See results" / "Compare options" | Hard urgency / Aggressive discounts |
| **BOF** | Direct, urgent | "Shop Now" / "Claim [X]% Off" / "Get your answer" | Soft language / "Learn more" |
```

#### Change 5: Add Step 4.5 — VISUAL DIRECTION NOTE

Insert after Step 4:

```markdown
## Step 4.5: VISUAL DIRECTION NOTE

For each hook, add a one-line visual direction note. This bridges hook output to the art style skill.

**The Anti-Duplication Rule:** If the copy SAYS it, the visual should SHOW the proof (not repeat the words).

| If the Hook Says... | Visual Should Show... |
|---------------------|----------------------|
| A transformation claim | Before/after or result imagery |
| A social proof number | Multiple people or crowd/community visual |
| A specific process | Step visualization or product in use |
| An offer/price | Product with price treatment or urgency visual |
| A pain point | The frustrated situation (empathy visual) |
| An identity claim | The aspirational person or lifestyle |

**Format:**
VISUAL DIRECTION: [One line — what the visual should SHOW to complement, not duplicate, the copy]

Example:
HOOK: "350 lenders compete for your rate. You choose the winner."
VISUAL DIRECTION: Grid of competing options converging to single approval — shows abundance and control.
```

#### Change 6: Replace Step 5 with 3-3-3 Variety Framework

Replace the entire current Step 5 (VARIETY CHECK) with:

```markdown
## Step 5: VARIETY CHECK (3-3-3 Framework)

Before finalizing, verify diversity across three dimensions:

### Dimension 1: Funnel Stage
Each hook set MUST include hooks for at least 2 of these 3 stages:

| Stage | Hook Purpose | Copy Approach | CTA Style |
|-------|-------------|---------------|-----------|
| **TOF** | Awareness. Spark curiosity, not sell. | Problem or emotional question. Short (50-100 chars). | Soft: "See how" / "Learn more" |
| **MOF** | Education + validation. Show HOW. | Mechanism, social proof, objection handling. Medium (100-125 chars). | Trust: "See results" / "Read reviews" |
| **BOF** | Conversion. Close the sale. | Direct offer, urgency, stacked proof. Short (50-100 chars). | Direct: "Shop Now" / "Claim Offer" |

### Dimension 2: Psychological Angle
Each hook set MUST include hooks from at least 3 of these 6 drivers:

| Driver | Hook Approach | When to Use |
|--------|-------------|-------------|
| **Pain / Problem** | Name frustration, hint at relief | Problem-aware audiences. TOF/MOF. |
| **Aspiration / Identity** | Show who they become | Aspirational brands. TOF. |
| **Social Proof / Credibility** | Numbers, testimonials, authority | Trust-dependent verticals. MOF/BOF. |
| **Urgency / Scarcity** | Time pressure, limited availability | Offer-driven BOF. |
| **Education / Value** | Teach something useful | Complex products. MOF. |
| **Transformation** | Before/after. Show the change. | Results-driven brands. MOF/BOF. |

### Dimension 3: Format Intention
Tag each hook with its intended visual treatment:

| Tag | Description | Visual Pairing |
|-----|-------------|----------------|
| `[STATIC]` | Static image ad | Product-focused, typography-dominant, or infographic |
| `[VIDEO-SCRIPT]` | Opening 3 seconds of video/Reel | Hook as opening line or text overlay |
| `[CAROUSEL-LEAD]` | First card of carousel | Must create curiosity to swipe |
| `[UGC-BRIEF]` | Script for UGC creator | Conversational, first-person, natural |
| `[ORGANIC]` | Boosted organic post | Native to platform, not ad-like |

### Minimum Viable Distribution (6 hooks)
- At least 2 funnel stages represented
- At least 3 psychological angles represented
- At least 2 format intentions represented

### Emotional Trigger Coverage
Hooks MUST cover at least 3 of these territories:

| Emotion | Best Stage | Impact |
|---------|-----------|--------|
| Curiosity | TOF | Highest hook rates |
| Relatability | TOF | Pattern match = scroll stop |
| Social Proof | MOF | Trust builder |
| Empowerment | TOF/MOF | Identity-aligned |
| Loss Aversion | BOF | Outperforms positive framing by 60% |
| FOMO/Scarcity | BOF | 60% of impulse purchases |
| Pride/Status | MOF/BOF | Premium buyer motivation |
| Security/Safety | MOF | Reduces purchase anxiety |

**Anti-pattern:** If all hooks trigger the same emotion, the hook set reaches only one micro-audience under Andromeda.

### Research Section Coverage
- [ ] Not all hooks from Pain Points
- [ ] Proof Points used in at least 1 hook
- [ ] Products/Services referenced in at least 1 hook
- [ ] New sections (if available): Owned Positioning, Objections, VoC used
- [ ] Multiple ICP segments covered (if multiple exist)
```

#### Change 7: Replace Validation Checklist with 5-Gate Hard Validation

Replace the current "Validation Checklist (Final Pass)" section:

```markdown
## Validation Checklist (Final Pass) — HARD GATES

Before each hook is complete, it must pass ALL five gates.
Hooks that fail any gate MUST be revised. Do not ship failing hooks.

### Gate 1: TRACEABLE
Can you point to the exact research element this hook came from?
- YES: Pass. Cite the source section.
- NO: Reject. Return to Step 1 and find a research source.

### Gate 2: OWNED (Logo-Swap Test)
Perform this three-part test:

**Test A — Logo Swap:**
"If I replace this brand's name with a direct competitor's, does the hook still work?"
- If YES → Hook is generic. MUST revise.
- If NO → Pass.

**Test B — Emotional Ownership:**
"Is this hook's emotional territory already claimed by a competitor?"
- If YES → Revise to target untapped territory (use Competitive Context white space).
- If NO → Pass.

**Test C — Customer Recognition:**
"Would a real customer of THIS brand say 'that's exactly how I feel'?"
- If YES → Pass.
- If NO → Revise using Customer Language / VoC section.

**Scoring:**
- 3/3: Ship.
- 2/3: Revise the failing test.
- 1/3 or 0/3: Fundamental rework. Return to extraction.

**Revision instruction when Logo Swap fails:**
Anchor the hook to one of these owned elements:
1. A specific number only this brand can claim (e.g., "350+ lenders")
2. A named product, methodology, or feature unique to this brand
3. The brand's owned positioning from the research
4. Verbatim customer language that references this specific brand

### Gate 3: FELT
Does the hook name or evoke an emotion, not just state a fact?
- YES: Pass.
- NO: Apply Feature-to-Emotion Translation from research. Rewrite at emotional level.

### Gate 4: CLEAR
Can it be understood in 3 seconds or less?
- YES: Pass.
- NO: Simplify. Cut words. Choose shorter phrasing.

### Gate 5: THEIRS
Does it use the brand's words, the customer's world, and the brand's voice?
- YES: Pass.
- NO: Check Brand Voice and Customer Language sections. Calibrate.
```

#### Change 8: Update Output Format

Replace the current output format with:

```markdown
## Output Format

Write to: `agent/.claude/skills/hook-methodology/hook-bank/{brand}-{YYYY-MM-DD}.md`

\```markdown
# [Brand Name] - Hook Bank
**Date:** YYYY-MM-DD
**Hooks Generated:** [number]

## Brand Colors
- Primary: #hex
- Secondary: #hex
- Accent: #hex

## Research Elements Used
[List which sections were mined for each hook]

---

## Hook 1
**Type:** [Hook type from the 10]
**Source:** [Research section + specific element]
**Target:** [ICP segment or "General"]
**Funnel Stage:** [TOF / MOF / BOF]
**Psychological Driver:** [Pain / Aspiration / Social Proof / Urgency / Education / Transformation]
**Format Intention:** [STATIC / VIDEO-SCRIPT / CAROUSEL-LEAD / UGC-BRIEF / ORGANIC]
**Hook:** "[The headline]"
**Body:** [1-2 sentences]
**CTA:** [Action + outcome, matched to funnel stage]
**Visual Direction:** [One line — what the visual should SHOW to complement the copy]
**Logo-Swap Test:** [PASS — or FAIL with note on what owned element anchors it]
**Psychology:** [Why it stops scroll + drives click]

## Hook 2
[Same structure]

[Continue for each hook]

---

## Variety Verification
- **Funnel Stages:** [list — must have 2+]
- **Psychological Drivers:** [list — must have 3+]
- **Format Intentions:** [list — must have 2+]
- **Hook Types Used:** [list — must have 3+]
- **Emotional Territories:** [list — must have 3+]
- **Research Sections Used:** [list]
- **ICP Segments Covered:** [list]
- **Logo-Swap Results:** [X/Y passed]
\```
```

#### Change 9: Update Hook Volume

**Current:**
```
- **Default:** Generate 3 hooks
```

**New:**
```
- **Default:** Generate 6 hooks
- **User-specified:** Generate the number requested
- **Minimum for variety:** 6 hooks needed to satisfy 3-3-3 framework minimums
```

#### Change 10: Add Andromeda Copy Reference (P2 — add at end)

```markdown
## Andromeda Copy Optimization Notes

### Character Targets
- Primary text: 50-125 characters (truncates at ~125 on mobile)
- Headline: 27-40 characters (5-7 words optimal)
- Link description: 30 characters max

### Copy Patterns That Signal New Entity IDs
Andromeda clusters ads with similar messaging. To create distinct Entity IDs:
- Change the CORE MESSAGE, not just the words
- Different psychological driver = different cluster
- Different offer type = different cluster
- Same message reworded does NOT create a new Entity ID
```

---

## STREAM B-2 (continued): formulas.md Updates

### File: `agent/.claude/skills/hook-methodology/formulas.md`

**Changes needed:**

1. **Add new Research-to-Hook Mapping entries** for the 7 new research sections:

```markdown
| **Owned Positioning** | Pattern Interrupt, Direct Address | Owned claims create strong hooks |
| **Competitive Context** | Contrast, Pattern Interrupt | White space = unique angles |
| **Buying Objections** | Question, Problem-Solution, Direct Address | Each objection is a hook |
| **Feature-to-Emotion** | Problem-Solution, Aspiration | Emotional framing is the hook |
| **Customer Language / VoC** | Direct Address, Social Proof | Verbatim = authentic |
| **Brand Story / Origin** | Curiosity, Pattern Interrupt | Founder story = narrative hooks |
| **Category Intelligence** | FOMO/Urgency, Surprising Stat | Temporal + trend hooks |
```

2. **Expand Emotional Territory Coverage** with quantified impact data:

Add after existing coverage section:
```markdown
### Extended Emotional Territories (from Andromeda research)

| Emotion | Best Funnel Stage | Impact Signal |
|---------|------------------|---------------|
| Empowerment | TOF/MOF | Identity-aligned purchasing |
| Loss Aversion | BOF | Outperforms positive framing by 60% |
| FOMO/Scarcity | BOF | 60% of impulse purchases driven by scarcity |
| Pride/Status | MOF/BOF | 72% of premium buyers cite emotional satisfaction |
| Security/Safety | MOF | Reduces purchase anxiety |
```

---

## Agent Team Assignment

### Recommended Parallel Split

| Agent | Stream | Files | Dependencies |
|-------|--------|-------|-------------|
| **Agent 1** | A (Visuals) | 6 new workflow files + art-style SKILL.md | None — fully independent |
| **Agent 2** | B-1 (Research) | research.md | None — fully independent |
| **Agent 3** | B-2 (Hooks) | hook SKILL.md + formulas.md | None for writing — B-1 section names are specified above |

All three agents can work simultaneously. No agent blocks another.

### Validation After All Streams Complete

After all three agents finish, run a cross-stream validation:

1. **Research → Hook contract check:** Do the new research section names in `research.md` match the extraction block headers in `SKILL.md`?
2. **Hook → Visual contract check:** Does the hook output format (Funnel Stage, Psychological Driver, Format Intention, Visual Direction) match what the art-style SKILL.md routing expects?
3. **Test on 2-3 existing brands:** Re-run research → hooks → visuals on brands with existing hook banks (e.g., composio, rube, theratefinder) and compare old vs new output.

---

## Success Criteria

### Stream A: Visual Styles
- [ ] 6 new workflow files created, each self-contained with all 12 required sections
- [ ] Art-style SKILL.md updated with routing, category logic, multi-style flow
- [ ] Each new style differs from all others on 3+ Entity ID signal axes
- [ ] All workflows include Brand Anchor, Mobile Constraints, Aspect Ratio blocks
- [ ] JSON output format standardized across all 8 styles

### Stream B-1: Research Agent
- [ ] 7 new sections added to output template
- [ ] 4 new workflow steps (2.5, 2.6, 2.7, 3.5) added
- [ ] WebSearch added to tools
- [ ] Line target updated to ~150-200
- [ ] Source marking instructions included for all new sections
- [ ] Fallback instructions for when data isn't available

### Stream B-2: Hook Methodology
- [ ] New extraction blocks for 7 new research sections
- [ ] Step 1.5 Funnel Mapping added
- [ ] Step 4.5 Visual Direction Note added
- [ ] 3-3-3 Variety Framework replaces old variety check
- [ ] 5-Gate Hard Validation replaces old checklist (with revision instructions)
- [ ] Output format includes: Funnel Stage, Psychological Driver, Format Intention, Visual Direction, Logo-Swap Test
- [ ] Default hook count updated from 3 to 6
- [ ] Extraction checklist updated with new section checkboxes
