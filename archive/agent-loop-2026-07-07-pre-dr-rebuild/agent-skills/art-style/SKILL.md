---
name: art-style
description: Creates visual prompts from hooks. Expects hook-bank to exist. Routes to style workflows based on keywords or auto-selects 3-4 styles by category. Outputs prompts.json for MCP image generation.
---

# Art Style Skill

Routes to art style workflows, selects optimal styles per brand, and generates visually diverse prompts across multiple styles for Entity ID diversity.

## Prerequisites

**Hook-bank must exist before triggering this skill.**
Main Agent triggers `hook-methodology` skill first, which creates:
`agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md`

## Input/Output

- **Input:** Reads hook-bank file for brand colors, ICP, category, owned positioning, and 6 hook concepts with psychology field
- **Output:** Writes `agent/files/creatives/{brand}_prompts.json`

Main Agent handles image generation via MCP after this skill completes.

---

## Style Routing

### Keyword-Based Routing

When the user specifies a style keyword, route to the corresponding workflow:

| User Keywords | Workflow |
|---------------|----------|
| "clay", "diorama", "anderson", "theatrical", "miniature", "handcrafted" | `workflows/anderson-clay-diorama.md` |
| "brutalism", "soft brutalism", "neo-brutalist", "bold borders" | `workflows/soft-brutalism-clay.md` |
| "gradient", "product shot", "minimal product", "clean product" | `workflows/product-on-gradient.md` |
| "editorial", "cutout", "magazine", "collage", "premium" | `workflows/editorial-cutout.md` |
| "type", "typography", "text", "bold text", "poster" | `workflows/typography-dominant.md` |
| "infographic", "data", "chart", "comparison", "education" | `workflows/infographic-data-visual.md` |
| "lifestyle", "environment", "scene", "context", "atmospheric" | `workflows/lifestyle-render-hybrid.md` |
| "ugc", "testimonial", "review", "social proof", "screenshot" | `workflows/ugc-aesthetic-static.md` |
| (none specified) | **Auto-select 3-4 styles based on category** (see below) |

When a keyword is matched, run that single workflow for all 6 hooks. When no keyword is specified, use category-aware multi-style routing.

### Style Comparison

| Style | Visual Signature | Best Categories | Funnel | Uncanny Valley Risk | Speed |
|-------|-----------------|-----------------|--------|--------------------|----|
| **Anderson Clay Diorama** | 3D clay miniature theater, bilateral symmetry, theatrical lighting | Storytelling, emotional brands | TOF/MOF | Low | Medium |
| **Soft Brutalism Clay** | Bold borders, single clay hero, generous negative space | Bold statements, high-contrast | TOF/MOF | Low | Medium |
| **Product-on-Gradient** | Clean product on gradient, modern, minimal | Beauty, supplements, e-com, electronics | MOF/BOF | None | Fastest |
| **Editorial Cutout** | Collage, selective color, serif type, asymmetric | Fashion, beauty, premium, home | TOF/MOF | None | Fast |
| **Typography-Dominant** | Bold text as hero, graphic poster, flat color | SaaS, tech, services, fintech | TOF/BOF | None | Fastest |
| **Infographic/Data-Visual** | Grid layout, icons, data elements, structured | Health, fintech, SaaS, science-backed | MOF/BOF | None | Fast |
| **Lifestyle-Render Hybrid** | Product in atmospheric environment, natural light | Wellness, food, home, sleep, fitness | TOF/MOF | Low (no humans) | Medium |
| **UGC-Aesthetic Static** | Simulated social post/review card, lo-fi | Universal (social-proof-driven) | MOF/BOF | None | Fast |

---

## Category-Aware Default Routing

When no style keyword is specified, detect the brand category from the hook-bank's research brief (brand description, product type, ICP) and auto-select 3-4 styles.

### Category Detection

Read the hook-bank file and identify the brand category from:
1. Product type description
2. ICP (Ideal Customer Profile) characteristics
3. Brand positioning and value propositions

Map to one of these categories:

| Category | Detection Signals |
|----------|------------------|
| Beauty/Skincare | skincare, beauty, serum, moisturizer, cosmetics, skin, complexion, anti-aging |
| SaaS/Tech | software, app, platform, API, developer, cloud, AI, automation, tool |
| Fintech/Finance | mortgage, lending, rates, investment, banking, financial, insurance, credit |
| Food/Beverage | food, drink, beverage, coffee, tea, snack, meal, nutrition, organic |
| Fashion/Apparel | clothing, fashion, apparel, shoes, accessories, style, wear, fabric |
| Health/Wellness | supplement, vitamin, wellness, health, fitness, sleep, adaptogen, probiotic |
| Home Goods | home, decor, candle, furniture, bedding, kitchen, living, fragrance |
| General/Unknown | (no clear category match) |

### Default Style Assignments by Category

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

---

## Hook-to-Style Pairing Logic

When distributing 6 hooks across 3-4 styles, use the hook's psychology field to assign each hook to its optimal style.

### Psychology-to-Style Mapping

| Hook Psychology | Primary Style | Secondary Style | Why |
|----------------|--------------|-----------------|-----|
| Pain/Problem | Typography-Dominant | Infographic/Data | Pain hooks work as bold text statements or data-backed problem framing |
| Aspiration/Identity | Lifestyle-Render | Editorial Cutout | Aspiration needs environmental/aesthetic context |
| Social Proof | UGC-Aesthetic Static | Infographic/Data | Social proof needs testimonial framing or data validation |
| Education/Value | Infographic/Data | Lifestyle-Render | Education needs structured information or in-use demonstration |
| Urgency/Scarcity | Typography-Dominant | Product-on-Gradient | Urgency needs bold text impact or direct product + offer |
| Transformation | Editorial Cutout | Product-on-Gradient | Transformation needs before/after visual structure or clear product showcase |
| Curiosity/Question | Typography-Dominant | Anderson Clay Diorama | Questions work as bold text or intriguing visual scenes |

### Assignment Process

1. Read all 6 hooks and their psychology fields from the hook-bank
2. For each hook, identify the primary style from the mapping above
3. If the primary style is in the brand's selected style set, assign it
4. If not, use the secondary style
5. If neither is available, assign to the closest available style
6. Ensure each selected style gets at least 1 hook (no empty styles)
7. Distribute evenly — aim for 1-2 hooks per style across 3-4 styles

---

## Multi-Style Output Flow

When generating creatives for a brand with auto-style routing:

### Step 1: Read Hook-Bank
```
Read hook-bank file for brand
Extract: brand colors (primary, secondary, accent hex values)
Extract: ICP summary, category, owned positioning
Extract: 6 hook concepts with these fields per hook:
  - Type (one of 10 hook types)
  - Psychological Driver (Pain / Aspiration / Social Proof / Urgency / Education / Transformation / Curiosity)
  - Funnel Stage (TOF / MOF / BOF)
  - Format Intention (STATIC / VIDEO-SCRIPT / CAROUSEL-LEAD / UGC-BRIEF / ORGANIC)
  - Visual Direction (one-line note — what the visual should SHOW to complement the copy)
  - Hook text, Body, CTA, Logo-Swap Test result
```

### Step 2: Select Styles
```
Detect brand category from research brief
Select 3-4 styles from the category default table
```

### Step 2.5: Build Reference Image Roster (only if references exist)

The user may have uploaded reference images for this campaign (e.g. their actual product photos). When references exist, the prompts you generate must explicitly preserve product identity — generic descriptions ("a whey protein tub") cause the image generator to redesign the packaging.

**Process:**

1. **Retrieve refs:** Call `mcp__refs__get_reference_images`. The result is `{ references: [{ falUrl, sandboxPath, fileId }, ...] }`.
2. **If `references` is empty:** skip this step. Proceed to Step 3 with text-to-image semantics.
3. **For each reference, load the image:** Call `Read(sandboxPath)`. The image enters your vision context. If `Read()` fails on any path (FUSE flake, missing file), emit a brief warning and skip that reference — do not fail the whole campaign.
4. **Describe each image:** For every reference you loaded, write a structured description noting:
   - Form factor (cylindrical tub, rectangular bar, bottle, sachet, etc.)
   - Material/finish (matte, glossy, foil, glass, plastic)
   - Wordmark / logo (text, position, font feel)
   - Distinctive label features (color bands, callouts, badges, ingredient text)
   - Inferred role (primary product, companion product, brand mark, alt angle)
5. **Build the IMAGE ROSTER block:** Combine descriptions into one block per the template below. This block must be included in EVERY concept's `prompt` field that uses references.

**Image Roster template (literal text to include in prompts):**
```
IMAGE ROSTER:
- Image 1: <visual description, role inference>
- Image 2: <visual description, role inference>
...

PRODUCT FIDELITY: Preserve product identity exactly as shown in the references.
Do NOT redesign packaging, alter labels, change colors, or modify proportions.
Use the role inferences above to place each element in the scene appropriately.
When multiple products appear in one creative, name each one's placement explicitly.
```

6. **Per-concept reference assignment:** When emitting `prompts.json`, populate each concept's `referenceImageUrls` field:
   - Some concepts may use ALL refs (e.g. lifestyle scene featuring both products).
   - Some may use a SUBSET (e.g. infographic showing just the bar).
   - Some may use NONE (e.g. pure typography hooks where the product doesn't visually appear).
   - The agent decides per concept based on hook + style + composition logic.
   - Use the `falUrl` values from step 1 — copy them verbatim into the array.

**Output schema gain (per concept):**
```json
{
  "concept": 1,
  "...": "...",
  "prompt": "IMAGE ROSTER:\n- Image 1: matte black whey tub...\nPRODUCT FIDELITY: ...\n\nFeature the user's exact tub...",
  "referenceImageUrls": ["https://fal.media/.../tub.jpg"]
}
```

When references exist, the orchestrator's call to `generate_ad_images` reads `referenceImageUrls` from `prompts.json` per concept — not from your conversation memory. This is the durability boundary.

### Step 3: Assign Hooks to Styles
```
For each hook:
  Read hook Psychological Driver field
  Match to primary style from psychology-to-style mapping
  If primary style is in selected set, assign
  If not, use secondary style or closest available
Ensure: each style gets at least 1 hook
```

### Step 4: Generate Prompts Per Style
```
For each hook-style pair:
  Read the assigned workflow file
  Follow that workflow's complete process
  Pass the hook's Visual Direction note to the workflow — the visual must SHOW
    what the copy SAYS (anti-duplication: don't render the headline as the entire visual)
  Generate 1 prompt for the assigned hook
  Use the aspect ratio specified in the user's prompt (look for [ASPECT RATIO: X:Y] instruction)
```

### Step 5: Validate Entity ID Distinctness
```
For each prompt, check against all other prompts:
  Must differ on 3+ of 5 visual signal axes (see below)
  If two prompts are too similar, reassign one to a different style
```

### Step 6: Write Output
```
Combine all prompts into single {brand}_prompts.json
Each concept includes its style identifier
```

### Aspect Ratio

The user selects a single aspect ratio before generating. Look for `[ASPECT RATIO: X:Y]` in the prompt and use that ratio for ALL concepts. Do not vary or rotate ratios — every prompt gets the same one.

Supported ratios and their dimensions:
- 4:5 → 1080x1350 (Feed optimized)
- 1:1 → 1080x1080 (Feed standard / carousel)
- 9:16 → 1080x1920 (Reels / Stories)

If no `[ASPECT RATIO]` instruction is present, default to 4:5.

---

## Entity ID Validation Rule

Each prompt in the brand's output must differ from every other prompt on at least 3 of 5 visual signal axes. This ensures Andromeda treats each creative as a separate Entity ID.

### The 5 Signal Axes

| Signal Axis | What Andromeda Analyzes | How Styles Differ |
|-------------|----------------------|-------------------|
| **Color composition** | Dominant colors, palette structure, contrast pattern | Gradient vs. flat vs. selective vs. warm ambient vs. high-contrast 2-color |
| **Layout/composition** | Spatial arrangement, symmetry, element positioning | Centered isolation vs. asymmetric collage vs. text-dominant vs. grid-structured vs. environmental scene vs. screenshot framing |
| **Objects and elements** | What's in the frame — product, text, icons, scene objects | Product only vs. clay objects vs. icons/data vs. lifestyle objects vs. social UI elements |
| **Scene type** | The overall category of visual | No scene vs. miniature theater vs. editorial spread vs. data dashboard vs. lifestyle environment vs. social media post |
| **Text density/position** | How much text, where it sits, what role it plays | Minimal overlay vs. baked-in architectural vs. text-as-hero vs. multi-section labels vs. testimonial quote vs. editorial serif |

### Style Distinctness Matrix

Each style is designed to differ from every other style on 3+ axes:

| | Product-on-Gradient | Typography-Dominant | Infographic/Data | Editorial Cutout | Lifestyle-Render | UGC-Aesthetic | Anderson Clay | Soft Brutalism |
|---|---|---|---|---|---|---|---|---|
| **Color** | Gradient | Flat 2-3 color | Clinical white | Selective sat. | Warm ambient | Neutral/white | Theatrical | Bold flat |
| **Layout** | Centered isolation | Text-fills-frame | Grid structured | Asymmetric collage | Environmental | Screenshot frame | Bilateral symm. | Single hero center |
| **Objects** | Product only | Text (no objects) | Icons + data | Cut-out + shapes | Lifestyle objects | UI elements | Clay figures | Clay hero object |
| **Scene** | No scene | No scene | Data dashboard | Editorial spread | Lifestyle env. | Social post | Mini theater | No scene (object) |
| **Text** | Minimal overlay | Text IS hero (60-70%) | Multi-section labels | Serif editorial | Minimal (10%) | Testimonial hero | Architectural | Bold architectural |

### Validation Process

After generating all prompts, compare each pair:
1. List the visual signals for each prompt (color approach, layout, objects, scene type, text treatment)
2. Count how many axes differ between each pair
3. If any pair differs on fewer than 3 axes, flag it
4. Reassign the flagged prompt to a different style that increases distinctness

---

## Output Format

All workflows write to the same output file:
`agent/files/creatives/{brand}_prompts.json`

When running multi-style, all prompts from all styles are combined into a single JSON file:

```json
{
  "brand": "brandname",
  "style": "multi-style",
  "category": "detected-category",
  "stylesUsed": ["style-1", "style-2", "style-3"],
  "brandColors": {
    "primary": "#HEX",
    "secondary": "#HEX",
    "accent": "#HEX"
  },
  "concepts": [
    {
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
      "referenceImageUrls": ["https://fal.media/..."],
      "aspectRatio": "user-specified ratio (4:5, 1:1, or 9:16)",
      "dimensions": "matching dimensions (1080x1350, 1080x1080, or 1080x1920)"
    }
  ]
}
```

`referenceImageUrls` is **optional** — populate it only when Step 2.5 ran and you assigned references to this concept. Omit it (or use an empty array) for text-to-image concepts.

When running a single specified style, the output uses that style's name instead of "multi-style" and omits the "stylesUsed" field.

**Workflow note:** Individual workflows only need to document their style-specific `stage` fields. The full JSON structure above is the shared contract — do not duplicate it in workflow files.

---

## Shared Workflow Processes

These sections define shared processes that all workflows follow. Workflows reference these instead of duplicating them.

### Hook-Bank Loading

All workflows load data from the same hook-bank source:

1. List files matching `{brand}-*.md` in `agent/.claude/skills/hook-methodology/hook-bank/`
2. Sort by date (from filename: `{brand}-YYYY-MM-DD.md`)
3. Read the most recent file (unless user specified a date)
4. Extract:
   - Brand colors (primary, secondary, accent hex values)
   - ICP summary
   - Category
   - Owned positioning
   - 6 hook concepts, each with: psychology field, funnel stage, format intention, visual direction note

### Brand Anchor Derivation

Every workflow applies this 3-step brand anchor process (with style-specific guidance for step 2):

1. **Extract** owned positioning from hook-bank (what only this brand can claim)
2. **Translate** owned positioning into visual elements this style can express *(each workflow defines how)*
3. **Apply the Logo Swap Visual Test:** If the visual could belong to any competitor, it's too generic. Adjust to showcase brand-specific features.

Include this block in every prompt:
```
BRAND ANCHOR:
Owned positioning: [What ONLY this brand can claim]
Visual translation: [How the style-specific visual elements showcase the differentiator]
Logo swap check: [Could a competitor use this exact visual? If yes, what makes it specific?]
```

### Mobile Safe Zone Rules

Include these universal constraints in every prompt template:
- Safe zone: No text or critical elements in bottom 35% (Meta UI on Stories/Reels)
- Safe zone: No text in top 14% (status bar on Stories/Reels)
- Thumb zone: Keep CTA above bottom-left and bottom-right corners
- Thumbnail test: Key visual and headline must be legible at 300px width
- Text minimum: All text equivalent to 12pt+ at final display size
- Single-column: For 9:16, stack elements vertically

Each workflow adds one style-specific hero element size rule (e.g., "Product must occupy at least 30% of frame").

**Quality checklist — mobile (shared across all workflows):**
- [ ] No text or critical elements in bottom 35%
- [ ] No text in top 14% (for 9:16 format)
- [ ] CTA not in bottom corners (thumb zone clear)
- [ ] Single-column layout for 9:16

---

## Adding New Styles

1. Create `workflows/new-style-name.md` with these sections:
   - Style Overview, Brand Anchor (style-specific guidance, reference shared framework), Category Adaptation
   - Visual Concept Creation, Design Principles, Prompt Template (reference shared mobile safe zones), Example Prompts
   - Mobile Constraint Integration, Anti-Patterns, Quality Checklist (reference shared mobile checklist)
   - Style-specific `stage` fields (output format references SKILL.md shared contract)
2. Reference shared processes from SKILL.md (Hook-Bank Loading, Brand Anchor, Mobile Safe Zones) — do not duplicate
3. Add detection keywords to the routing table above
4. Add the style to the category default routing table
5. Add the style to the hook-to-style pairing logic
6. Update the Entity ID distinctness matrix

---

## Done

After writing prompts.json, this skill is complete. Main Agent handles image generation via MCP.
