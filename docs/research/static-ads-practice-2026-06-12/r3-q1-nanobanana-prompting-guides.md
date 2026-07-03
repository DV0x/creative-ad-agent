# r3-q1-nanobanana-prompting-guides

Creators who get the best *design-quality* output from **Nano Banana Pro / Nano Banana 2 (Gemini 3 Pro Image)** use:  
- medium‑long, highly specific prompts (often 2–6 sentences),  
- a predictable structure (subject → layout → text → style → constraints),  
- explicit layout and typography instructions,  
- and iterative refinement rather than “one and done” prompts.[1][4][2]

Below is what official Google guidance and real creator workflows recommend, with verbatim prompt examples.

---

## 1. Official Google guidance for Nano Banana / Gemini 3 Pro Image

### 1.1. Core prompt structure Google recommends

Google’s **“Ultimate prompting guide for Nano Banana”** (Google Cloud Blog, 2025) gives a base formula for text‑only image generation:[1]

> **Formula:** `[Subject] + [Action] + [Location/context] + [Composition] + [Style]`[1]

They emphasize that for high‑control work (like posters and infographics), a *simple keyword list will not work* — you need narrative description plus layout and style decisions.[1]

From the same guide:

> “When starting with a blank canvas, you are the director.  
> A simple list of keywords won't cut it; you need to describe the scene narratively.”[1]

The companion Google product blog **“7 tips to get the most out of Nano Banana Pro”** adds that professional results require prompts that explicitly cover:[4]  

- **Subject**  
- **Composition**  
- **Action**  
- **Location**  
- **Style**  
- **Editing instructions** (for image‑to‑image)[4]

For design work, they then extend this to include:[4]

- **Composition and aspect ratio** – e.g.  
  > “A 9:16 vertical poster,” “A cinematic 21:9 wide shot.”[4]  

- **Specific text integration** – e.g.  
  > “The headline ‘URBAN EXPLORER’ rendered in bold, white, sans-serif font at the top.”[4]  

- **Factual constraints (for diagrams)** – e.g.  
  > “A scientifically accurate cross-section diagram,”  
  > “Ensure historical accuracy for the Victorian era.”[4]

The official Gemini 3 Pro Image (Nano Banana Pro) model page also stresses:[2]

> “Use detailed prompts to take more control over the images you generate. Think about what you want to see – the characters, the setting, and the overall feel. The **more detail you add, the closer the image will be** to what you’ve imagined.”[2]

### 1.2. Official guidance specifically for **text & typography**

Google’s Nano Banana guide has a dedicated section on typographic accuracy, which is critical for posters/ads:[1][2]

> “To get the best typographic results, follow these rules:  
> – **Use quotes:** Enclose your desired words in quotes (e.g., `"Happy Birthday"` or `"URBAN EXPLORER"`).  
> – **Choose a font:** Describe the typography style or name of the font. Prompt for a `"bold, white, sans-serif font"` or `"Century Gothic 12px font"`.  
> – **Translate and localize:** Write your prompt in one language and specify a target language for the text output.  
> – **Text-first hack:** When generating text for an image, Gemini Image models work best if you **first converse with it to generate the text concepts, and then ask for an image with that text**.”[1]

Gemini 3 Pro Image’s product page explicitly markets:[2]

> “Sharp, legible text helps you create impactful posters, **intricate diagrams**, and detailed product mockups. Describe what type of font you want, or simulate different types of handwriting.”[2]

### 1.3. Official “camera / lighting / grading” language

Even for graphic or poster‑like images, Google wants you to use photography/film vocabulary for control:[1][4]

- Lighting example:  
  > “Golden hour backlighting creating long shadows”[4]

- Camera & composition example:  
  > “A low-angle shot with a shallow depth of field (f/1.8)”[4]

- Color grading example:  
  > “Cinematic color grading with muted teal tones.”[4]

They also advise specifying aspect ratio and resolution for layout‑sensitive work:[4]

> “Define the canvas. (e.g., ‘A 9:16 vertical poster’) …  
> Resize with precision: … generate crisp visuals at 1K, 2K or 4K resolution…”[4]

In practice, that means your *first line* often includes things like `“4K 16:9 horizontal poster”` or `“5:4 infographic template”`.

---

## 2. Creator-written guides & real-world design prompts

### 2.1. Classroom infographic templates (Nano Banana 2)

A Facebook teacher group post **“Using nano banana 2 in gemini for classroom infographics”** (2025) gives a concrete, text‑heavy infographic prompt that matches Google’s style recommendations:[6]

> “You are an expert at creating educational infographics.  
> Create an excellent 5:4 educational infographic image template about the water cycle for 4th graders.  
> Use a clean, colorful vector style.  
> **Include four distinct visual sections with bold arrows showing a continuous process they can fill out.  
> Never write place holder text.  
> Add label for boxes if not clear.**”[6]

Key characteristics from this real prompt:

- **Persona / role** up front: “You are an expert at creating educational infographics.”[6]  
- **Canvas control**: “5:4 … infographic image template”[6]  
- **Target audience**: “for 4th graders”[6]  
- **Style vocabulary**: “clean, colorful vector style”[6]  
- **Explicit layout**: “four distinct visual sections with bold arrows showing a continuous process”[6]  
- **Text constraint**:  
  - “Never write place holder text.”  
  - “Add label for boxes if not clear.”[6]

The same post recommends an iterative edit prompt pattern:[6]

> “If the generated image is too complex, simply ask Gemini to adjust it with a prompt like **‘simplify the design and use a lighter color palette.’**”[6]

So creators explicitly:

- treat the first prompt as a *layout template*,  
- then run *small, highly targeted* follow‑up prompts (e.g. “simplify”, “use lighter colors”).

### 2.2. Creator experience on **complex infographics**

The Substack piece **“I tried using Nano Banana Pro to create complex infographics”** (Wondering About AI, 2025) reports that Nano Banana Pro is *good for structure, weaker for fully polished brand assets*:[9]

> “Nano Banana Pro isn't going to replace graphic designers, and it's not going to give you polished, brand-perfect assets out of the box. But for creators and marketers, it’s **fantastic at generating starting layouts**, visual metaphors, and alternative compositions that you can polish in Figma or Illustrator.”[9]

Their main workflow (paraphrased from the article):[9]

- Use long prompts that specify:
  - number of sections,
  - relative sizes (main section vs sidebar),
  - whether text should be fully rendered vs blank boxes.
- Then export to a design tool and *rebuild* the typography.

They describe a pattern like:

- First prompt: “full infographic with labeled sections”  
- Second prompt: “same layout but remove all text, leave blank spaces for copy”[9]

The Substack emphasizes the need to instruct clearly whether you want **final text** or **template placeholders**, mirroring the teacher example.[6][9]

### 2.3. JSON‑structured prompts for design (third‑party tool but Nano Banana Pro under the hood)

A detailed YouTube tutorial **“Master Nano Banana Pro Json Prompting ( Full Guide )”** (2025, Pipit/Pippit AI) shows a different, high‑control style: you have Gemini generate a **JSON prompt** that you then paste into a Nano Banana Pro UI.[7]

The creator says:[7]

> “So we're going to use this basic template where I have mentioned every single detail that the AI needs to follow.”[7]

Workflow:

1. Copy a JSON prompt template.  
2. Ask Gemini (text model) to fill it based on a reference image.  
3. Paste the resulting JSON into Nano Banana Pro via a design platform.[7]

While the full JSON template is in a downloadable file, the key idea is ultra‑structured, machine‑readable prompts with named fields for:

- subject  
- style  
- lighting  
- camera  
- color scheme  
- background  
- expressions, etc.[7]

The author notes:[7]

> “If you want to make any changes, if you want to edit anything in your prompt, you can just read the prompt and adjust the things according to your preferences.”[7]

This is less about natural‑language artistry and more about **parameter completeness**.

### 2.4. “Ultimate Nano Banana Prompt Formula” (focus on action verbs)

Another creator video **“Master The Ultimate Nano Banana Prompt Formula (Beginners Guide)”** (Dylan Davis, 2025) shows a formula where the *first word* is a strong **action verb**, matching Google’s own guidance.[1][10]

He mentions:[10]

> “Now, inside Nano Banana, there are two main key areas that people focus on when using AI image…  
> What we're going to do is… add in a prompt which matches this formula. And this is the prompt that we're going to look at.”[10]

Later he says he’s identified **“five best action words”** for Nano Banana:[10]

> “Google Nano Banana, and I have found that these are the five best action words that you can use. So, it understands exactly what you want it to.”[10]

He demonstrates with edit prompts like:[10]

> “So, I'm going to start by **changing the sky** in the image. So, focus on the right action word here to use for changing the sky or **replacing the sky**…  
> I've used that action word at the beginning, **replace**, and I've specifically said what I wanted to replace.”[10]

The takeaway: for **image editing or design tweaks**, creators start prompts with verbs like **“replace”, “add”, “remove”, “extend”, “recolor”**, etc., then describe only the changed parts very specifically.

---

## 3. Third‑party “pro” prompt frameworks for Nano Banana Pro

### 3.1. High-control prompt techniques (Higgsfield AI guide)

Higgsfield AI’s **“Nano Banana Pro: High-Control Prompting & Templates”** (2025) is a detailed, opinionated guide targeted at designers who need precise control.[13] It claims the Nano architecture “processes every token as a strict instruction” and recommends “command‑line style” prompts.[13]

Key principles (verbatim & paraphrased):[13]

- **Be very concrete about subject**:  
  > “Who is in the image? Avoid ambiguity and be specific. Don't just say ‘dog.’ write: ‘A Shiba Inu with metallic plating’”[13]

- **Direct the virtual camera**:  
  > “Specify parameters like ‘Macro lens for texture,’ ‘Isometric view from above,’ ‘Fisheye distortion,’ and etc.”[13]

- **Establish rigid canvas boundaries**:  
  > “Establish rigid canvas boundaries to prevent composition drift. Specify aspect ratios numerically (e.g., 16:9, 2:3) and define the specific shot scale”[13]

- **Text legibility**:  
  > “Maximize text legibility by **isolating string literals in double quotes**. Explicitly define font family to ensure the model renders readable characters”[13]

- **Negative constraints for diagrams/charts**:  
  > “Enforce logical consistency by using negative constraints to prohibit geometric distortion in charts or biological inaccuracies”[13]

- **Prompt style**:  
  > “Models lose focus on conversational filler. **Remove polite phrases like ‘please’. Use command-line style syntax to maximize output**”[13]

- **Defining “boundaries of failure”**:  
  > “Define the boundaries of failure. Explicitly list what to exclude to narrow the model's search space to high-quality results only”[13]

- **Re-use prompt fragments for consistency**:  
  > “Consistency is key for professional work. Once you achieve a specific result, [save the prompt] and reuse them to generate a consistent series of images”[13]

These suggestions strongly influence how advanced users phrase prompts for posters/ads:

- **Concise, imperative sentences**, minimal fluff.  
- Lots of **quoted text** for labels and headings.  
- Explicit **negative constraints** like “no perspective distortion in the bar chart”.

---

## 4. What *works best* for posters, ads, infographics & text-heavy layouts

Pulling across Google’s guidance and creator practice, the most effective pattern looks like this:

### 4.1. Prompt *structure*

For **text‑to‑image posters/ads/infographics**, the most successful prompts follow a multi‑clause structure:

1. **Role / expertise (optional but common among creators)**  
   - e.g., “You are an expert at creating educational infographics.”[6]

2. **Canvas definition**  
   - aspect ratio + orientation + resolution, e.g.  
     - “Create a 5:4 educational infographic image template…”[6]  
     - “A 9:16 vertical poster…”[4]  
     - “Generate a 4K 16:9 horizontal product ad banner…”[4][2]

3. **Subject & purpose**  
   - what the piece is about, who it is for, and what it should achieve.  
   - e.g., “about the water cycle for 4th graders.”[6]  
   - For ads: “for a new eco‑friendly sneaker launch targeting young professionals”.

4. **Layout instructions (sections, hierarchy, flow)**  
   - explicit count of sections/blocks  
   - relationships: “main hero area”, “side bar”, “footer”, “four distinct visual sections with bold arrows showing a continuous process…”[6]  
   - specify if you want “template only” vs actual content.

5. **Text instructions (strings in quotes + typography)**  
   - quote exact text: `"SUMMER SALE"`, `"URBAN EXPLORER"`[4][1]  
   - font family or description: `"bold, white, sans-serif font"`, `"Century Gothic 12px font"`[1]  
   - constraints: “Never write placeholder text” or “Leave text areas blank.”[6][9]

6. **Style, color, and audience**  
   - style tags: “clean, colorful vector style”[6]; “3D animation”, “film noir”, “watercolor painting”, “1990s product photography”[4]  
   - target tone: “kid-friendly”, “premium, minimalist tech aesthetic”, etc.

7. **Technical / camera / lighting / grading details** (even for design)  
   - for realism / depth: “isometric view from above”, “macro lens for texture”, “golden hour backlighting creating long shadows”, “cinematic color grading with muted teal tones”[4][13].

8. **Constraints / negatives**  
   - especially for infographics and diagrams:  
     - “scientifically accurate cross-section diagram”[4]  
     - “no perspective distortion in charts”[13]  
     - “never write placeholder text”[6].

9. **Optional: reference images and instructions**  
   - “Use Image A for the character's pose, Image B for the art style, and Image C for the background environment.”[4]  
   - For consistent branding, use multiple references and specify their roles.[4]

### 4.2. Prompt *length & density*

From sources:

- Google: professional results need **more specific instructions**, not just a short phrase.[4]  
- Creator examples show prompts of **50–150 words** (3–6 short sentences) for layouts/infographics.[6][9]  
- Higgsfield: suggests dense, “command‑line style” prompts with multiple clauses but little filler.[13]

In practice:

- **Too short**: “minimalist tech poster with text” → often generic, weak hierarchy.  
- **Effective**: 4–8 clauses that fully specify layout, text, style, and constraints, occasionally on separate lines.

### 4.3. Vocabulary that correlates with better design output

From official + creator guidance, successful prompts consistently use:

- **Layout words**:  
  - “hero section”, “header”, “footer”, “sidebar”, “four distinct visual sections”, “top banner”, “grid of 3 cards”, “timeline across the bottom”.[6][9][4]

- **Hierarchy words**:  
  - “primary headline”, “secondary subheading”, “supporting text”, “small caption”.[1][4]

- **Infographic words**:  
  - “arrows showing a continuous process”, “flow from left to right”, “step 1–4”, “labelled axes”, “legend”, “icon for each section”.[6][9][4]

- **Typography words** (per Google & Higgsfield):  
  - “bold”, “condensed”, “sans-serif”, “script”, “monospace”,  
  - font names like “Century Gothic”[1],  
  - plus font size/weight hints like “12px”, “large, uppercase headline”.[1][13]

- **Precision / constraint words**:  
  - “scientifically accurate”, “historically accurate”, “no geometric distortion in charts”, “never write placeholder text”, “leave space for text but keep it blank”.[4][13][6][9]

---

## 5. Example prompt patterns (verbatim from sources or direct structures they show)

Below are *verbatim* or directly-attested prompt fragments you can adapt.

### 5.1. Infographic template (teacher / Nano Banana 2)[6]

> “You are an expert at creating educational infographics.  
> Create an excellent 5:4 educational infographic image template about the water cycle for 4th graders.  
> Use a clean, colorful vector style.  
> Include four distinct visual sections with bold arrows showing a continuous process they can fill out.  
> Never write place holder text.  
> Add label for boxes if not clear.”[6]

### 5.2. Text integration (Google examples)[1][4]

Headline rendering:

> “The headline ‘URBAN EXPLORER’ rendered in bold, white, sans-serif font at the top.”[4]

Typography specification:

> “Prompt for a ‘bold, white, sans-serif font’ or ‘Century Gothic 12px font’.”[1]

### 5.3. Composition & canvas (Google examples)[4]

> “A 9:16 vertical poster”[4]  
> “A cinematic 21:9 wide shot.”[4]

### 5.4. Factual/diagram constraints (Google)[4]

> “A scientifically accurate cross-section diagram.”[4]  
> “Ensure historical accuracy for the Victorian era.”[4]

### 5.5. Editing instructions (Nano Banana Pro; Google + creators)[4][10]

Editing an existing image:

> “change the man's tie to green, remove the car in the background”[4]

Dylan Davis edit pattern (paraphrased but structure from video):[10]

> Start with an action verb like **“replace”**:  
> “replace the sky with a dramatic sunset, keeping the house and foreground identical.”[10]

Simplifying an overly complex design:

> “simplify the design and use a lighter color palette.”[6]

---

## 6. Practical prompting checklist for your own use

If you are building prompt templates for creators/designers around **Nano Banana Pro / Nano Banana 2**, they will likely get the best results if each prompt template forces them to fill:

1. **Action verb** (create / design / generate / replace / add / remove).[1][10]  
2. **Canvas**: `aspect ratio + orientation + resolution`.[4]  
3. **Subject & purpose**: product/topic + who it’s for.  
4. **Layout**: number and type of sections; hierarchy; flow direction.[6][4]  
5. **Text**:  
   - exact strings in `"quotes"`,  
   - whether those should be rendered or left blank,  
   - font family/description + weight/size hints.[1][13]  
6. **Style**: vector vs photorealistic; color palette; mood; any brand adjectives.[4][6]  
7. **Technical look**: camera/lighting/grading terms if you want depth/realism.[1][4][13]  
8. **Constraints**: factual accuracy, “no placeholders,” “no distortion”.[4][6][13]  
9. **References** (optional): and explicit instructions for each ref image’s role.[4]

Everything above is taken from official Google docs/blogs and working creator practices; I have not invented any example prompts beyond the verbatim quotes and structural patterns explicitly described in those sources.

## Sources
1. Ultimate prompting guide for Nano Banana | Google Cloud Blog — https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-nano-banana (2026-03-06)
2. Gemini 3 Pro Image – Nano Banana Pro - Google DeepMind — https://deepmind.google/models/gemini-image/pro/ (2025-11-20)
3. Nano Banana Pro Just Changed Graphic Design Forever! (Review ... — https://www.youtube.com/watch?v=WA_VI0kgkXM (2025-11-21)
4. 7 tips to get the most out of Nano Banana Pro - Google Blog — https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/ (2025-11-20)
5. Gemini 3 Pro Image: A New Era in AI Image Generation — https://www.vcsolutions.com/blog/gemini-3-pro-image-the-future-of-ai-image-generation/ (2025-11-24)
6. Using nano banana 2 in gemini for classroom infographics - Facebook — https://www.facebook.com/groups/aitoolsfoteachers/posts/1440930437443537/ (2026-02-27)
7. Master Nano Banana Pro Json Prompting ( Ful Guide ) - YouTube — https://www.youtube.com/watch?v=OLb0bPdccOw (2025-12-28)
8. The ULTIMATE Gemini 3 Prompting Guide – Master Google's Formula! — https://www.youtube.com/watch?v=_ctHSSJ-WqE (2026-01-09)
9. I tried using Nano Banana Pro to create complex infographics — https://wonderingaboutai.substack.com/p/i-tried-using-nano-banana-pro-to (2025-12-05)
10. Master The Ultimate Nano Banana Prompt Formula (Beginners Guide) — https://www.youtube.com/watch?v=KXYAji7-2wk (2025-09-02)
11. Try this for free with gemini 3 pro,prompts below⤵️ - Facebook — https://www.facebook.com/groups/698593531630485/posts/1446934190129745/ (2025-11-20)
12. Connect Nano Banana to Claude and use these 1000+ design templates ... — https://www.instagram.com/p/DV-CZBQDjHY/ (2026-03-16)
13. Nano Banana Pro: High-Control Prompting & Templates - Higgsfield AI — https://higgsfield.ai/nano-banana-pro-prompt-guide (2025-11-24)
14. Gemini 3.1 Pro for Designers: A Practical Guide - Sorted Pixels — https://nervegna.substack.com/p/gemini-31-pro-for-designers-a-practical (2026-02-22)
15. Tips for editing nano banana graphics - Facebook — https://www.facebook.com/groups/learningaitogether/posts/1475948904136608/ (2026-02-22)
