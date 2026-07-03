# r3-q4-product-ad-creative-prompts

For **product ads and static ad creatives**, the most reliable workflow in the sources is to **create the art direction in Midjourney, then use Nano Banana Pro or GPT-image for image-editing/compositing** so the product stays faithful while text, badges, and layout elements are added in the editor stage.[1][8][14]

- **Midjourney first, no text yet**: one practitioner workflow says to prompt Midjourney for “the mood, palette, and composition you want,” and to “ignore text and fine detail entirely at this point,” because the goal is only a base image that “feels right.”[1]
- **Then edit in Nano Banana Pro**: the same workflow says to upload the Midjourney image and instruct Nano Banana Pro to “add this headline, swap this background, keep this face, place this product on the shelf,” because it “edits the existing pixels rather than starting over.”[1]
- **Keep the product image as the anchor**: Bria’s product-shot workflow emphasizes using a reference image or text-guided product placement while “preserving product integrity,” “true color, texture, and shape,” and the product’s “real look, texture, and brand integrity.”[4]
- **Use GPT-image for editing and logo placement**: one marketing workflow based on OpenAI Playground says GPT-image-1 supports “editing, logo placement, and combining multiple images,” and the same article describes taking a lifestyle image and adding a logo directly onto packaging with “a single adjustment.”[8]

A named practitioner workflow for a static ad with text is explicitly described like this:[1]
- **Step 1, in Midjourney (aesthetics only, no text):** “Editorial portrait of a confident Hong Kong woman in her early 30s, smart-casual blazer, sitting in a bright modern co-working space, warm natural window light, shallow depth of field, professional advertising photography, 4:5 vertical composition”
- **Step 2, in Nano Banana Pro (attach the Midjourney image):** “Using the attached image as the exact reference for the woman's face and outfit, keep her identity identical. Place a clean headline in the upper third that reads ‘Work smarter, not harder’ in bold white sans-serif text. Keep the lighting and background unchanged. Output a crisp, legible, print-ready result.”[1]

For **product packaging fidelity**, the sources converge on a few rules:[2][4][14]
- **Start from a real product photo or a high-fidelity reference**, not a pure text-to-image guess, when packaging accuracy matters.[4][14]
- **Preserve identity on the edit pass** by telling the model to keep the product unchanged while altering background, scene, or layout.[1][4]
- **Use product-specific editors for small labels and packaging edges** because they are designed for “label restoration,” “small-text cleaning,” and “packaging fidelity.”[2][14]
- **Restyle the scene, not the package**: Bria says its image-based workflow adapts the environment “while preserving the original product’s look,” and the product “continues to look authentic and consistent.”[4]

Real prompt language from the sources that is directly relevant to ad creatives:

- Midjourney base-image prompt: “Editorial portrait of a confident Hong Kong woman in her early 30s, smart-casual blazer, sitting in a bright modern co-working space, warm natural window light, shallow depth of field, professional advertising photography, 4:5 vertical composition.”[1]
- Nano Banana Pro edit prompt: “Using the attached image as the exact reference for the woman's face and outfit, keep her identity identical. Place a clean headline in the upper third that reads ‘Work smarter, not harder’ in bold white sans-serif text. Keep the lighting and background unchanged. Output a crisp, legible, print-ready result.”[1]
- Product-visual prompt from a branding test case: “Create an image of someone doing laundry with laundry strips. The strips are from the brand Zyra (vivid orange, blue, and purple abstract design). The woman is looking happy.”[8]
- Product-photo workflow language: “Generate lifestyle product shots that preserve the original product’s look while adapting to new environments described through text prompts.”[4]
- Reference-image workflow language: “Generate lifestyle product shots that stay true to the original product while adapting to new environments, guided by a reference image.”[4]

What the sources say about **when to use which model**:

| Model | Best fit for this task | Source-based reason |
|---|---|---|
| **Midjourney v7** | Concepting the ad look, mood, and composition | Strong at stylized scenes but weak on precise text/editing; one source says it is for the “mood, palette, and composition” stage.[1][3] |
| **Nano Banana Pro** | Final ad layout, text placement, reference-image edits, identity/product consistency | Described as strong for accurate text, identity consistency, and pixel-level edits rather than regeneration.[1][3][5] |
| **GPT-image** | Marketing edits, logo placement, combining multiple images | One marketing workflow says it supports “editing, logo placement, and combining multiple images.”[8] |

Two practical prompt patterns show up across the sources:

- **Separate generation from editing**: use a long, art-directed prompt in Midjourney; use a shorter, direct edit instruction in Nano Banana Pro.[1]
- **Name what must not change**: “exact reference,” “keep her identity identical,” “Keep the lighting and background unchanged,” and “preserving product integrity” are the kinds of constraints the sources recommend.[1][4]

I could not find a source in the retrieved results that gives a full, explicitly branded **product-ad template prompt** with **headline + badge + CTA button + real product photo** all in one example for Nano Banana Pro, GPT-image, or Midjourney v7. The closest matches are the Midjourney-to-Nano-Banana Pro ad workflow for a headline overlay[1], the GPT-image branding/editing workflow for logo placement on packaging[8], and the product-shot workflows focused on preserving packaging fidelity while changing the scene[4].

## Sources
1. Midjourney + Nano Banana Pro: The Two-Tool AI Image Workflow — https://www.ud.hk/en/blogs/insight/article/2026-06-03-midjourney-nano-banana-workflow (2026-06-04)
2. Top 10 AI Product Photography Tools for Sellers 2026 - Blend — https://www.blendnow.com/blog/top-10-tools-for-product-photography (2025-11-29)
3. Midjourney vs Nano Banana: Which AI Image Generator Is Better for ... — https://srefhunt.com/midjourney-vs-nano-banana/ (2025-11-26)
4. AI Product Photography & Product Shots | Bria — https://bria.ai/product-shots (2026-01-07)
5. Nano Banana vs Midjourney The AI Image Test You Need to See — https://www.youtube.com/watch?v=tmwkWnRZkUg (2025-09-05)
6. How Global Brands are Using Image Editing to Win Customers — https://www.smartphotoeditors.com/blog/how-global-brands-use-image-editing-to-win-customers/ (2025-10-06)
7. Tested Midjourney v8 against Nano Banana Pro, including style ... — https://www.instagram.com/p/DWPYLUKEi3O/ (2026-03-23)
8. How AI image generation can support marketing and branding ... — https://www.element61.be/en/resource/how-ai-image-generation-can-support-marketing-and-branding-strategies (2025-10-29)
9. when anyone can create high-end AI slop, they get commoditized ... — https://www.instagram.com/reel/DOVNJp0jQCL/?hl=en (2025-09-07)
10. Best Image Editing AI Models - Runware — https://runware.ai/collections/best-image-editing (2025-12-11)
11. Gemini 3 Pro Image: AI Visual Marketing Complete Guide — https://www.digitalapplied.com/blog/gemini-3-pro-image-marketing-guide (2025-12-14)
12. I made a full spec ad using AI, here's exactly how I did it ... - Instagram — https://www.instagram.com/reel/DYT-8_ITs8N/ (2026-05-14)
13. Nano Banana Pro vs Midjourney v7: The Definitive 2025 ... - YingTu — https://yingtu.ai/en/blog/nano-banana-pro-vs-midjourney-v7 (2025-12-30)
14. AI product photography: the best tools for ecommerce in 2026 — https://claid.ai/blog/article/ai-product-photo-tools (2026-01-27)
15. Nano Banana Pro vs Midjourney v8: The Complete 2026 ... — https://blog.laozhang.ai/en/posts/nano-banana-pro-vs-midjourney-v8 (2026-03-17)
