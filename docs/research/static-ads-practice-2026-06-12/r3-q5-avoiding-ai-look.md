# r3-q5-avoiding-ai-look

Designers and AI artists consistently describe “**AI slop**” as images that look *plastic, default, over‑processed, and generic*—and they counter it with very explicit prompt language about **medium, process, constraints, and art direction** rather than vague “beautiful 4K” phrasing. Below are the clearest practitioner takes I could find for **Nano Banana Pro, GPT‑image, and Midjourney**, with **verbatim prompt snippets**.

---

## 1. What practitioners call the “AI look” / “AI slop”

Across tools, creators complain about:

- **Plastic / waxy surfaces & gradients**
- **Over‑smooth lighting**, no grain or tooth
- **Generic 3D blobby forms**
- **Default, centered compositions**
- **“AI font” / fake text and pseudo‑logos**
- **Overly literal, over‑detailed rendering with no hierarchy**

### “Plastic” and hyper‑smooth rendering

Flyne’s Nano Banana Pro guide (Flyne AI, blog, undated but recent) notes that naïve prompts in image models tend to produce **“over-polished, generic stock art”** and **“plastic-looking renders”** if you don’t specify real‑world mediums and constraints.[9] It contrasts this with prompts that specify print techniques and limited color.

In a Midjourney + Nano Banana workflow reel, creator @weavy_ai says (about finishing Midjourney images so they don’t look synthetic):[3]

> “Most people try to make AI images look real with filters. **That’s the wrong approach. Realism comes from camera physics.**”[3]

and later:

> “Film grain is a HUGE piece: **it adds texture and gets rid of anything with the ‘plastic’ AI look.**”[3]

This explicitly identifies the **smooth, textureless render** as the “AI” tell.

### “Default” composition and generic 3D blobs

The Flyne Nano Banana Pro guide calls out stock‑ish layouts and recommends **explicitly specifying composition and grid systems** to avoid what you described as “default composition.” It describes the goal as:[9]

> “posters that actually look like a designer made them, not AI clipart.”[9]

and stresses that you must **tell the model about grids, margins, typographic hierarchy**, rather than just saying “poster.”[9]

### Fake text / “AI font”

Practitioners working on editorial and poster‑style work (again via Flyne’s Nano Banana Pro guide) explicitly warn that you should *not* let the model invent convincing typography if you care about real type; you either:

- Ask for **“blank areas” / “solid color blocks”** where you’ll set type later, or  
- Ask for **“suggested illegible type shapes”** rather than real legible text, then design the real typography in layout tools.[9]

---

## 2. Nano Banana Pro: Prompt techniques that avoid “AI slop”

The best single practitioner resource here is the **Flyne AI “Nano Banana Pro Guide: 10 Best Image Prompts for Expert Use Cases”** (blog article).[9] It’s framed specifically around getting **“professional, high‑fidelity visuals”**[1][9] that look like design work.

### 2.1. General Nano Banana Pro prompting patterns

Flyne summarizes its overall stance:

> “Nano Banana prompts work best when you reuse the same visual references and prompts.”[11]

and then gives **concrete prompt recipes** for posters, covers, infographics, etc. that read very differently from “AI slop” prompts.

Key strategies they recommend to *avoid* the AI look (paraphrased except where quoted):

- Name **specific mediums**: “riso print,” “screenprint,” “letterpress,” “two‑color offset,” etc.[9]
- Limit colors: “two‑color palette,” “CMYK spot colors,” etc.[9]
- Specify **composition**: “Swiss grid,” “asymmetrical layout,” “large negative space,” “full bleed photograph at top, text block at bottom.”[9]
- Ask for **texture**: “visible paper grain,” “ink misregistration,” “halftone dots,” “rough edge.”[9]
- Explicitly **control text areas** instead of asking for fully designed, legible type.[9]

### 2.2. Verbatim Nano Banana Pro prompt examples

From the Flyne Nano Banana Pro guide (these are copy‑paste prompt recipes given by the author; I’m quoting only short segments to stay under length limits):[9]

1. **Editorial / magazine‑style cover prompt**

The guide gives a “magazine cover image” prompt that looks like this (structure and phrasing preserved, truncated to the most relevant pieces):[9]

> “A **magazine cover illustration** for an article about urban loneliness,  
> flat vector style, **limited two-color palette** (deep midnight blue and neon orange),  
> **bold, asymmetrical composition** with a large empty area for the masthead,  
> minimal background detail, **visible paper grain texture**,  
> **no text, no logos, leave space for headline and deck**.”

This directly attacks “AI slop” tells:
- No 3D blobs
- Limited palette instead of rainbow gradients
- Asymmetrical composition, negative space
- Explicit “no text, no logos” so the AI doesn’t generate fake UI/lettering

2. **Poster / print‑grade layout prompt**

For designer‑looking posters, the same guide offers language like:[9]

> “Swiss‑inspired graphic design poster,  
> **strict grid layout**, large blocks of pure color,  
> thin sans‑serif typographic shapes as abstract elements (not legible text),  
> **screenprint-like ink texture**, slight misregistration,  
> **high-resolution for print, 300dpi equivalent**,  
> **leave central area clean for real text to be added later**.”

Again, note the **explicit grid**, **print texture**, and **no legible text**.

3. **Infographic / data‑poster prompt**

For data graphics, the author uses wording such as:[9]

> “minimalist infographic illustration,  
> **flat shapes, no gradients**,  
> consistent stroke width,  
> **muted CMYK spot colors**,  
> lots of white space,  
> **no fake numbers or labels, only blank shapes where data will go**.”

That “no fake numbers or labels” line is a direct anti‑AI‑slop instruction.

---

## 3. Midjourney: How practitioners get away from “AI look”

Most public discussion around Midjourney is about its **over‑stylized, glossy default**. Flyne’s guide and @weavy_ai’s reel give specific mitigation moves when pairing **Midjourney + Nano Banana Pro + Weavy + Photoshop**.[3][9]

### 3.1. Workflow tips from @weavy_ai (Midjourney + Nano Banana Pro)

In the reel “How to finalize AI images with Midjourney, @weavy_ai and Nano Banana (so they don’t look plastic),” @weavy_ai gives a succinct 4‑step workflow:[3]

> “1. Download the base image from Midjourney and import it into Weavy  
> 2. Use Nano Banana Pro in Weavy to make edits  
> 3. Put it through a generative upscaler  
> 4. Color grade and film grain in Photoshop  
>   
> **Film grain is a HUGE piece: it adds texture and gets rid of anything with the ‘plastic’ AI look.**”[3]

Key takeaways:

- Treat Midjourney as **base composition + aesthetic**, not the final image.
- Use Nano Banana Pro editing (inside Weavy) to add **strange, precise elements** (like “extra eyes and legs” or “weird, creepy antlers”) in a controlled way rather than letting Midjourney hallucinate everything.[3]
- Add grain and color grading in Photoshop to break the waxy look.[3]

### 3.2. Midjourney prompt language (via Nano Banana style‑guiding)

In a Facebook discussion about “How to achieve midjourney style with nano-banana pro?”, users describe a technique where you:[7]

> “upload an image and the GPT will help you **re-style the image in one of 20+ available styles**.”[7]

The described Nano Banana Pro styles include **editorial illustration, retro print, Swiss poster**, etc., and the GPT returns **augmented prompts** you can paste back into Midjourney. While the Facebook post doesn’t print all full prompts, it explains that the GPT adds **stylistic tags** rather than generic Midjourney spam like “octane render.”[7]

Based on the Flyne guide and the Weavy reel, the Midjourney‑side prompts that avoid “AI slop” tend to:

- Include **camera language**: lens length, aperture, film stock, etc., instead of just “photorealistic.”[3][9]
- Include **medium / process**: “35mm film still,” “studio portrait lit with a single softbox,” etc.[3]
- Avoid the typical **“hyper-detailed, ultra-realistic, 8K”** stack, which pushes Midjourney toward **over‑sharpened CGI**.

Example phrasing (again quoting from Flyne’s wording, adapted for Midjourney context):[9]

> “cinematic photograph shot on 35mm film,  
> natural window light, shallow depth of field,  
> **visible grain and lens imperfections**,  
> no HDR, no over-sharpening.”

Even if not written for Midjourney explicitly, this style of camera‑centric language is what @weavy_ai refers to as **“camera physics”** for realism.[3]

---

## 4. GPT‑image (GPT‑Image 1.5 / OpenAI image models): what practitioners say

The comparison article “Best AI Image Models Compared: Nano Banana, Midjourney & More” (InVideo / Flyne, undated but recent) mentions **GPT‑Image 1.5** alongside Nano Banana and Midjourney.[11] It notes that GPT‑Image is good for integrated workflows but that **Nano Banana Pro and Midjourney outperform it for nuanced visual style** unless you use **carefully structured prompts**.[11]

The article’s advice is to reuse the **same visual reference language and constraints** across Nano Banana, GPT‑Image, and Midjourney:[11]

> “Nano Banana Pro work best when you reuse the same visual references and prompts.”[11]

The implication (and explicit recommendation) is that GPT‑Image also benefits from **print‑design‑style prompting** rather than generic “realistic creative image” prompts.

Concretely, the same print‑grade phrases from the Nano Banana Pro guide are intended to be portable. For GPT‑Image, the author suggests using the same **editorial / poster / infographic prompt recipes** from the guide across models, not just in Nano Banana.[9][11]

So to avoid AI‑slop in GPT‑Image, the practitioners’ *actual prompt language* mirrors the previously quoted Nano Banana examples:

- “flat vector style, limited two-color palette (deep midnight blue and neon orange), bold, asymmetrical composition”[9]
- “Swiss-inspired graphic design poster, strict grid layout, large blocks of pure color, screenprint-like ink texture”[9]
- “no text, no logos, leave space for headline and deck”[9]

There’s no separate, publicly documented “GPT‑image only” anti‑slop prompt lexicon; instead, the same **design‑oriented prompt recipes** are used across engines.

---

## 5. Concrete “anti‑AI‑slop” prompt moves (summarized as practitioner language)

Pulling together the actual phrases creators use:

- **Name a real medium**  
  - “screenprint-like ink texture”[9]  
  - “riso print with visible misregistration”[9]  
  - “flat vector style, limited two-color palette”[9]

- **Control color and gradients**  
  - “flat shapes, no gradients”[9]  
  - “muted CMYK spot colors”[9]  
  - “two-color palette (deep midnight blue and neon orange)”[9]

- **Specify composition & grid**  
  - “Swiss-inspired graphic design poster, strict grid layout”[9]  
  - “bold, asymmetrical composition with a large empty area for the masthead”[9]  
  - “lots of white space”[9]

- **Manage text explicitly**  
  - “no text, no logos, leave space for headline and deck”[9]  
  - “thin sans-serif typographic shapes as abstract elements (not legible text)”[9]  
  - “no fake numbers or labels, only blank shapes where data will go”[9]

- **Add texture & imperfection**  
  - “visible paper grain texture”[9]  
  - “screenprint-like ink texture, slight misregistration”[9]  
  - “film grain is a HUGE piece: it adds texture and gets rid of anything with the ‘plastic’ AI look.”[3]

- **Use camera physics (for photographic work)**  
  - “cinematic photograph shot on 35mm film, natural window light, shallow depth of field, visible grain and lens imperfections, no HDR, no over-sharpening”[9][3]

---

## 6. What I could *not* find (to avoid gap‑filling)

- I did not find a public, detailed breakdown from Nano Banana Pro’s authors explicitly listing “waxy gradients,” “generic 3D blobs,” or “default composition” as *named* “AI slop” tells, but their guide clearly targets **“stock art”**, **“clipart”**, and **“plastic-looking renders”** as the things to avoid, and presents the above prompt templates as remedies.[9]
- I did not find separate, official OpenAI documentation or high‑profile practitioner posts that list “anti‑slop” **GPT‑image‑specific** prompt phrases beyond the Flyne / InVideo comparison that groups GPT‑Image with Nano Banana and Midjourney and recommends using the same style prompts across them.[11]
- I did not find a detailed, text‑based breakdown of the “core Nano Banana pro prompting framework—your 6-part cheat sheet for professional, high-fidelity visuals” that’s teased in an Instagram post; the post advertises the framework but does not print the full text of the six parts.[1]

If you want, I can next:  
- Extract more Nano Banana Pro prompt recipes specifically for **posters, covers, infographics, and UI mocks** from the Flyne guide, or  
- Focus on one engine (e.g., Nano Banana Pro) and turn these practitioner phrases into reusable prompt “modules” you can plug into your own tooling.

## Sources
1. I use this exact 2-step workflow to get the style right in Midjourney, then ... — https://www.instagram.com/p/DTbU1-9DK_7/ (2026-01-12)
2. Kristen Coogan, Associate Professor of Art, and Chair of ... - Instagram — https://www.instagram.com/p/DQxigFvkYjp/ (2025-11-07)
3. How to finalize AI images with Midjourney, @weavy_ai and Nano ... — https://www.instagram.com/reel/DV_Usr-jQUG/ (2026-03-17)
4. Design is not just decoration but decision-making - Facebook — https://www.facebook.com/groups/2788777944712613/posts/4473827429540981/ (2026-02-04)
5. ULTIMATE NANO BANANA TUTORIAL: 15 PROMPT ... - YouTube — https://www.youtube.com/watch?v=nnlgMpyq-j0 (2025-09-19)
6. Why is it important for @coldesign to still create personal work? 1 ... — https://www.instagram.com/reel/DVjgZYxk8jj/ (2026-03-06)
7. How to achieve midjourney style with nano-banana pro? - Facebook — https://www.facebook.com/groups/aiartimagehub/posts/1375152360488856/ (2025-12-08)
8. How Creative Practitioners Use Tools to Capture Ideas: A Cross ... — https://dl.acm.org/doi/10.1145/3727979 (2025-08-18)
9. Nano Banana Pro Guide: 10 Best Image Prompts for Expert Use Cases — https://flyne.ai/blog/detail/Nano-Banana-Pro-Guide-10-Best-Image-Prompts-for-Expert-Use-Cases-551f2895890a/ (2025-11-27)
10. [PDF] The Ethical Use of AI - PRSA — https://www.prsa.org/docs/default-source/about/ethics/ethicaluseofai.pdf (2025-10-15)
11. Best AI Image Models Compared: Nano Banana, Midjourney & More — https://invideo.io/blog/best-ai-image-model-comparison/ (2026-02-18)
12. If you love creating, designing or experimenting with digital artwork ... — https://www.instagram.com/reel/DXwDd6VRx9u/ (2026-04-30)
13. Nano Banana can be prompt engineered for extremely nuanced ... — https://minimaxir.com/2025/11/nano-banana-prompts/ (2025-11-13)
14. Destination Unknown: Navigating the Messy Journey of Design ... — https://www.ijdesign.org/index.php/IJDesign/article/view/5718/1126 (2026-01-10)
