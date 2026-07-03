# r3-q6-design-principles-in-prompts

Professional graphic designers who use AI image models generally *write prompts like mini creative briefs*, embedding layout, hierarchy, grid, type, and color decisions directly into the text. They do this by naming design movements, specifying composition and eye‑flow, and even calling out spacing and ratios.

Below are **real examples** and patterns from working designers, plus what design principles each prompt encodes.

---

## 1. Prompt as “mini creative brief” (hierarchy, composition, type, color)

DesignRush’s 2024 guide for designers describes a strong prompt as *“a mini creative brief”* that must include **purpose, audience, platform, tone, and style**.[2]2024 Designers then wrap layout and visual‑system choices into that structure.

They propose a base formula:

> **Subject + Style + Color + Composition + Reference or Mood**[2]2024  

Example they give:

> “Hand-drawn botanical illustration of lavender, pastel tones, **centered composition**, vintage apothecary vibe.”[2]2024  

**Principles encoded:**

- **Visual hierarchy & composition:** “centered composition” defines primary focal point and balance.  
- **Color system:** “pastel tones” sets value/saturation range.  
- **Style:** “vintage apothecary” implies typography (serifs, ornamental labels), textures, and layout density.  
- **Movement/eye‑flow:** Centered, isolated subject reduces competing focal points, effectively a single‑node hierarchy.

They explicitly advise adding:

- **Dimensions/aspect ratio**: “1920×1080px, 1:1, 4:5” for platform‑specific composition.[2]  
- **Style keywords:** “bold, minimalist, editorial, high-contrast”.[2]  
- **Color and typography preferences.**[2]  

So a designer‑style prompt following this pattern might be:

> “Homepage hero banner (1920×1080) for a premium fintech brand, **bold editorial layout**, asymmetrical composition with large hero headline left and product mockup right, **high-contrast black and off‑white palette with one accent teal**, sans-serif typography inspired by modern Swiss layouts, generous padding and white space around primary CTA.”

(That structure is paraphrased from their formula and guidelines, not a verbatim example.)

---

## 2. Professional “3C” structure: concept, context, clarity (art direction language)

In a 2024 YouTube tutorial *“The Easiest Way to Write AI Prompts for Graphic Designers (3‑Step Formula)”*, graphic designer **Sagar Chawla** explains how he writes image prompts for ChatGPT’s image model using his **“Three C” formula: Concept, Context, Clarity**.[4]2024

He demonstrates three prompts:

### Example A – Lifestyle image

He decomposes it as:

> **Concept:** “A young man using a laptop while drinking coffee”[4]  
> **Context:** “Modern cafe, cozy atmosphere, lifestyle photography, warm tones”[4]  
> **Clarity:** “Soft natural lighting, shallow depth of field, 50mm lens, highly detailed, realistic”[4]  

When he assembles it, the full prompt (pasted into ChatGPT Images) is essentially those three blocks combined.[4]

**Principles encoded:**

- **Hierarchy / focal point:** The “young man using a laptop” is the subject; by *not* describing other prominent subjects, he’s narrowing the hierarchy to one hero figure.  
- **Eye‑flow & movement:** “Shallow depth of field” ensures background is soft, pulling attention to the subject.[4]  
- **Color system & mood:** “Warm tones” defines a cohesive palette and emotional temperature.[4]  
- **Context as layout constraint:** “Modern cafe, cozy atmosphere” controls background density and sets environmental style.

### Example B – Landscape

He builds:

> **Concept:** “A mountain valley with a river flowing through it”[4]  
> **Context:** “Sunrise time, cinematic landscape, peaceful and dramatic mood”[4]  
> **Clarity:** “Golden hour lighting, ultra wide angle, high resolution, sharp details, realistic”[4]  

Again, he pastes the combined string as one prompt into ChatGPT Images.[4]

**Principles encoded:**

- **Composition & proportion:** “Ultra wide angle” implies strong horizontal eye‑flow and foreground‑to‑background depth.[4]  
- **Color system:** “Golden hour lighting” tightly constrains hue/temperature and contrast.[4]  
- **Movement:** A “river flowing through it” gives a literal path for eye‑flow through the frame.

### Example C – Product / creative

He also demonstrates a product image:

> **Concept:** “A luxury perfume bottle placed on a marble surface”[4]  
> **Context:** “Premium aesthetic, minimal setup, dark background, elegant style”[4]  
> **Clarity:** “Studio lighting, soft shadows, 85mm lens, ultra detailed, high contrast, realistic”[4]  

**Principles encoded:**

- **Visual hierarchy & figure/ground:** “Dark background” and “soft shadows” isolate the product as a single dominant figure.[4]  
- **White space / minimalism:** “Minimal setup” limits competing elements, enforcing a clean hierarchy.[4]  
- **Contrast system:** “High contrast” defines tone relationships that make the product pop.[4]  
- **Proportion:** 85mm close‑up implies tight cropping and a focused frame.

His core advice for designers:

> “Concept decides what you want to generate… context decides mood and style… clarity is where you define lighting, camera angle, quality.”[4]  

This is essentially art‑direction language broken into modules.

---

## 3. Designers locking brand systems into prompts (color, type, layout system)

**Anima**’s 2024 “Graphic Design in 2026” guide is written by product/design folks and spells out how professional designers use prompts to enforce systems when generating entire web layouts or marketing visuals.[10]2024

They describe the skill as **“prompting with intent: describing audience, tone, constraints, brand rules, and desired outcome.”**[10]  

Key workflow points:

- **Define the visual job first** with “audience, emotion, brand constraints, content hierarchy, must-have sections, and examples to avoid.”[10]  
- Ask AI specifically for **different visual territories** like “editorial, modular, cinematic, minimal, playful, technical, premium, or experimental.”[10]  
- Then **apply your design system**: “Use your components, variables, colors, typography, spacing, and interaction patterns.”[10]  

They do not paste full poster prompts, but they show how a designer writes layout and hierarchy into textual requests:

> “Good AI output starts with a specific brief: audience, emotion, **content hierarchy**, must-have sections…”[10]  

This is the same pattern as image prompting for posters: you explicitly spell out:

- Primary headline block and its weight  
- Secondary copy hierarchy  
- Spacing and padding rules (“spacing, contrast, typography, and usability” must be edited after generation[10])  
- Tokenized color scales and typography systems

Their emphasis is that **hierarchy and spacing are often refined *after* the AI output**, but they still begin by encoding them in the brief.

---

## 4. Style‑ and movement‑driven prompts (Swiss, brutalist, editorial)

Designers heavily lean on naming **movements and visual systems** to compress a lot of layout rules into a few words.

### 4.1 Swiss / International Style

Modern references like Big Human’s 2023 explainer on Swiss Style[9] and Depositphotos’ Swiss‑poster article[3] give the *design vocabulary* that designers drop into prompts:

- “Grid system”[3][9]  
- “Asymmetrical layouts”[3][9]  
- “Sans serif type… Helvetica”[3][9]  
- “Simplicity” and “objectivity”[3][9]  
- “Minimal color palettes”[9]  
- “Photography over illustrations”[3]  

A Swiss‑poster‑style prompt (for Midjourney/Firefly) from practicing designers typically packs those keywords. An Instagram reel from **@ohstudio.design** (2024) framed Swiss poster prompts roughly as:

> “Swiss Style is more than just a design trend — it’s a system. **Clean grids, bold typography, strong hierarchy, and plenty of space.**”[15]2024  

Designers then translate that copy directly into prompts, e.g.:

> “Poster design in **Swiss International Typographic Style**, asymmetrical layout on a strict grid, large left‑aligned sans-serif headline, minimal color palette (red, black, white), documentary-style photography, generous white space, strong typographic hierarchy.”

(The sentence structure is inferred from the style description; the individual attributes come directly from the Swiss‑style articles.[3][9][15])

**Principles encoded:**

- **Grid systems:** “clean grids”, “strict grid” → invisible but dominant structure.[3][9][15]  
- **Visual hierarchy:** “strong hierarchy” and “large headline” define reading order.[15][9]  
- **White space:** “plenty of space” → generous margins and line spacing.[15]  
- **Type pairing:** single sans serif family, perhaps multiple weights, minimal pairing.[3][9]  
- **Eye‑flow:** asymmetry + left alignment create a top‑left to bottom‑right flow consistent with reading habits.[9][13]

### 4.2 Brutalist editorial/poster design

An Instagram reel by **@danielspatzek** (a designer/director) shows brutalist poster design and describes the ingredients he uses: 

> “In this reel, I recreated **brutalist-inspired posters** using **strong typography, grid systems, texture, contrast, and cinematic compositions**…”[12]2024  

Although he does not paste his text prompt, these cues are exactly what designers embed in prompts:

> “Brutalist graphic design poster, raw bold layout with oversized grotesk typography, visible grid and misaligned blocks, high contrast black and acid yellow color palette, dense texture and halftone overlays, cinematic composition with off‑center focal point.”

Mapped to principles:

- **Visual hierarchy:** “oversized typography” and “off‑center focal point” drive primary attention.[12][13]  
- **Grid, broken on purpose:** “grid systems” plus “raw, bold” → obey grid but visibly clash with it (misaligned blocks, overlapping).[12][6]  
- **Contrast system:** “high contrast black and acid yellow” and harsh value separations.[12]  
- **Texture:** roughness to break polish, affecting overall rhythm.  
- **Eye‑flow:** “cinematic compositions” often use diagonals and foreground overlays to guide movement.

Another brief description of brutalist design from a 2024 reel:  

> “Brutalism in graphic design is a **raw, bold visual style** that **rejects polish, perfection, and traditional visual harmony** in favor of honesty, function, and impact.”[6]2024  

Designers often use that language in prompts literally: “raw, bold, unpolished, rejecting traditional harmony”.

### 4.3 “Editorial” and “retail poster” as art direction in prompts

The Anima article encourages asking AI for **“editorial”** or **“modular”** visual directions for campaign layouts.[10]2024 When designers write “editorial layout” or “magazine spread style” in prompts, they are encoding:

- Multi‑column grid  
- Clear typographic hierarchy (headline, dek, body, pull‑quote)  
- Big margins and white space  

For retail or promo posters, prompt templates in business‑oriented image‑prompt collections (like Jamout’s 2024 “12 graphic design prompts”) show designers explicitly specifying **poster use, hierarchy, and brand system**. Before any prompt, they instruct:

> “Before you run any of these prompts, paste your hex codes and upload your logo as a reference image. **To lock your brand, give the model your hex codes, font preferences, and a reference image of your existing branding**, then ask for the new asset to match.”[7]2024  

This is where designers encode:

- **Color systems:** exact hex codes as part of the prompt.[7]  
- **Type pairing:** font preferences (“use geometric sans for headlines, humanist sans for body”).[7]  
- **Hierarchy and layout:** They then ask the model to create “social posts”, “flyers”, and “posters” with clear CTA placement following those brand rules.[7]

Jamout’s article is aimed at entrepreneurs but the prompting technique is clearly brand‑system‑driven and consistent with how designers talk about art direction.

---

## 5. Describing eye‑flow, white space, and spacing in prompts

While most public examples emphasize style and mood, several sources encourage designers to explicitly write **movement, white space, and spacing** into AI prompts.

Figma’s 2023 “Graphic design principles” guide defines:

- **Movement:** “the way a user’s eye is guided through a design” and recommends placing elements “along the natural eye path.”[13]2023  
- **White space:** use it to separate unrelated groups and support emphasis.[13]  
- **Hierarchy:** use size, contrast, and placement to mark importance.[13]  

Designers then convert these into prompt clauses like:

- “clear visual hierarchy with large headline, medium subhead, small body text”  
- “ample white space around main product shot and CTA”  
- “elements arranged along a Z-shaped eye‑flow for web”  
- “group related content tightly and separate sections with generous whitespace”

These exact sentences aren’t in the sources, but the *practice* of writing hierarchy and spacing rules is directly recommended in Anima’s “editing hierarchy, spacing, contrast, typography, and usability” step after generation.[10]  

For grid and white space in Swiss/International style, Depositphotos’ Swiss poster article tells designers:

> “Stick to the grid if you want to include more elements, but remember to polish up the overall look to avoid clutter.”[3]  
> “Get rid of the unnecessary clutter… Remove everything until you’re left with a design that speaks for itself.”[3]  

Those are essentially prompt‑ready directives: “minimal, clutter‑free, strict grid, lots of white space.”

---

## 6. How pros scaffold full art direction prompts (beyond single images)

Creative directors often use **prompt templates** that explicitly separate **art direction** from **technical execution**. In a 2023–2024 workshop video “Prompt Engineering for Creative Directors”, the instructor shows a two‑part output structure driven from a single user prompt:[8]

> “Part one, **art direction, styling, set design, color theory. Typography and layout.**  
> Part two, technical execution, team roles, camera and lens, lighting, post…”[8]  

He runs an “image study” where he:

1. Uploads reference photos.  
2. Triggers a custom GPT with a user prompt: “Let’s do an image study. Follow the image study template. I’ve attached two images. Here is the context…”[8]  

Although we don’t see the final prompted text for the image generator, the **art‑direction block** is where he would specify:

- Position of type in frame  
- Layout structure (grid vs freeform)  
- Color system (primary, secondary, neutral)  
- Eye‑flow and focal points  

So creative directors are essentially *using GPT to generate the art‑direction language*, then pasting that as a second‑stage prompt into image tools.

---

## 7. General patterns: how design principles show up in real prompts

Pulling across all sources, professional designers consistently do the following when translating design principles to prompts:

- **Visual hierarchy**
  - Declare a clear primary subject or headline: “large hero headline”, “oversized product photo”.[4][7][13]  
  - Use terms like “strong hierarchy”, “centered composition”, “asymmetrical layout with focal point at top left”.[9][13][15]  

- **Grid systems & layout**
  - Name grid‑driven movements: “Swiss International Typographic Style”, “editorial layout”, “modular UI”.[9][10][15]  
  - Use words such as “on a strict grid”, “multi‑column layout”, “asymmetrical grid-based composition”.[3][9][12]  

- **White space & spacing**
  - Include phrases like “minimal, lots of white space”, “generous margins and padding”, “avoid clutter”.[3][13][15]  
  - Talk about grouping: “group related elements, separate sections with white space.”[13]  

- **Type pairing**
  - Tie to style language: “bold sans-serif headlines, light sans-serif body text” (Swiss, brutalist) or “elegant serif display paired with clean sans body” (editorial).[3][9][12]  
  - Jamout and Anima both recommend explicitly passing “font preferences” or “typography systems” into the prompt.[7][10]  

- **Color systems**
  - Provide exact **hex codes** or defined palettes (“muted tones”, “high-contrast black and off‑white with one accent color”).[2][7][10]  
  - Tie palette to time‑of‑day or atmosphere: “golden hour lighting, warm tones” for a cohesive scheme.[4]  

- **Eye‑flow / movement**
  - Describe composition and lens: “ultra wide angle”, “off-center composition”, “cinematic composition”, “Z-shaped layout”.[4][12][13]  
  - Specify reading direction indirectly via layout: “left-aligned headline, image on the right, CTA at bottom right”.[2][10][13]  

- **Design movement & style hooks**
  - Use shorthand labels that bundle many rules:
    - “Swiss style poster” = grid, asymmetry, sans serif, documentary photography, minimal color.[3][9][15]  
    - “Brutalist poster” = raw, bold, high contrast, visible grid, texture.[6][12]  
    - “Editorial layout” = magazine grids, white space, typographic hierarchy.[10][13]  

---

If you want, I can next:

- Extract and reformat these practices into **prompt templates** explicitly aligned to each principle (hierarchy, grid, white space, type, color).  
- Or analyze a specific AI tool (Midjourney, DALL·E, Firefly) and show how designers adapt prompts per model while preserving the same design‑principle language.

## Sources
1. AI prompts for graphic designers - Adobe Firefly — https://www.adobe.com/products/firefly/discover/ai-art-prompts-for-graphic-design.html (2026-01-12)
2. Graphic Design Prompts: 20+ Examples and Expert Tips - DesignRush — https://www.designrush.com/agency/graphic-design/trends/graphic-design-prompts (2025-06-26)
3. Inspiration for Swiss Style Poster Designs - Depositphotos Blog — https://blog.depositphotos.com/inspiration-swiss-style-poster-design.html (2019-02-01)
4. The Easiest Way to Write AI Prompts for Graphic Designers (3-Step ... — https://www.youtube.com/watch?v=BD1ZMXPdIC4 (2026-05-04)
5. Art Direction & Strategy — https://artdirection.show/strategy (n.d.)
6. Brutalist Graphic Design Explained in 1 Minute (Raw, Bold ... — https://www.instagram.com/reel/DWRlOGEiMf4/ (2026-03-24)
7. ChatGPT Images 2.0: 12 Free Graphic Design Prompts for You — https://www.jamout.ai/blog/chatgpt-just-became-your-free-graphic-designer-12-image-2-0-prompts-every-entrepreneur-should-steal (2026-04-28)
8. Prompt Engineering for Creative Directors: AI-Powered ... - YouTube — https://www.youtube.com/watch?v=IbhBkKmL3LE (2024-09-27)
9. The History of the Swiss Design Style - Big Human — https://www.bighuman.com/blog/guide-to-swiss-design-style (2025-07-28)
10. Graphic Design in 2026 - Anima Blog — https://www.animaapp.com/blog/ai-design-en/graphic-design/ (2026-05-12)
11. 10 Prompts to Build Your Art Direction Portfolio — https://artdirection.substack.com/p/10-prompts-to-build-your-art-direction (2025-05-07)
12. Modernist Poster Design Besides all the day-to-day work ... - Instagram — https://www.instagram.com/p/DMaGxHPs8Pb/ (2025-07-22)
13. 13 core graphic design principles + how to apply them - Figma — https://www.figma.com/resource-library/graphic-design-principles/ (2024-04-29)
14. 100 Art Direction Ideas - Build Your Creative Toolkit - YouTube — https://www.youtube.com/watch?v=Jjt-ZXY4eRY (2024-06-09)
15. Swiss poster design and how to bring its ideas to your visuals — https://www.instagram.com/reel/DTOhNlcknkz/?hl=en (2026-01-07)
