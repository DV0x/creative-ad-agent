# r3-q3-viral-prompt-patterns

Most working Nano Banana Pro creators in 2025–2026 converge on a few patterns that they say *actually* move the needle: **structured/JSON-style prompts**, **cinema-style camera & lighting blocks**, **explicit subject–composition–action–style breakdowns**, and **multi‑step “analysis → re‑generate” workflows**. Superstitious stuff like random adjective spam, magic “secret words”, or huge style tag lists is widely called out as noise.

Below is what practitioners *actually use and say*, with verbatim templates and attributions.

---

## 1. Official Google pattern: subject–composition–action–location–style (+ camera & lighting)

Google’s own Nano Banana Pro team is the clearest reference for what the model is tuned to obey. Their 2025 “7 tips to get the most out of Nano Banana Pro” post recommends a **fixed schema inside natural language** rather than magic keywords.[3]

They explicitly push you to include:

- **Subject**
- **Composition**
- **Action**
- **Location**
- **Style**
- Then refine with **camera**, **lighting**, **format**, **text integration**, **factual constraints**, **reference inputs**.[3]

They give concrete, structured prompt patterns like:

> “a stoic robot barista with glowing blue optics” (subject)[3]  
> “extreme close-up, wide shot, low angle shot, portrait” (composition)[3]  
> “brewing a cup of coffee, casting a magical spell, mid-stride running through a field” (action)[3]  
> “a futuristic cafe on Mars, a cluttered alchemist's library, a sun-drenched meadow at golden hour” (location)[3]  
> “3D animation, film noir, watercolor painting, photorealistic, 1990s product photography” (style)[3]

And for advanced control:

> “A 9:16 vertical poster” “A cinematic 21:9 wide shot.”[3]  
> “A low-angle shot with a shallow depth of field (f/1.8)”[3]  
> “Golden hour backlighting creating long shadows”[3]  
> “Cinematic color grading with muted teal tones.”[3]  
> “The headline ‘URBAN EXPLORER’ rendered in bold, white, sans-serif font at the top.”[3]  
> “A scientifically accurate cross-section diagram” “Ensure historical accuracy for the Victorian era.”[3]  
> “Use Image A for the character's pose, Image B for the art style, and Image C for the background environment.”[3]

**What they say matters vs superstition**

Google’s article says “simple prompts still work” but “professional results require more specific instructions” for composition, camera, lighting and text.[3] There is **no** mention of secret adjectives or long descriptor chains; instead they emphasize *clarity and separation of concerns* (subject, camera, lighting, etc.). Creators who follow this pattern on X and YouTube often echo that “cinematographer-style” detail is what really changes outputs.

---

## 2. JSON / structured prompting: “zero randomness” & layout control

### 2.1. JSON for composition, lighting & “zero randomness”

A popular 2026 Instagram reel from a Nano Banana creator explicitly frames JSON prompting as the way to lock the model down:

> “JSON prompts for perfect composition, controlled lighting, spatial tension, and zero randomness. Upload your own image, real or Al model - lock the outfit, ...” (Instagram post caption, 2026)[9]

The post advertises a **Nano Banana JSON prompt pack**; although the full JSON is gated behind comments/DM, it shows that serious users are leaning on *machine-readable structure* rather than huge natural-language blocks.

A longer breakdown of JSON prompting specifically mentions Nano Banana as a target and gives exact JSON patterns.[6] The article (“JSON Prompting for AI Image Generation”, ImagineArt blog, 2025) defines a fielded schema and gives **verbatim examples**:

> “JSON prompts consists of machine-readable inputs structured in a way that AI understand best.”[6]

**Core fields and template snippets:**

- **Subject**

  > `"subject": "dog"`[6]

- **Environment / Background**

  > `"environment": "sunny beach"`[6]

- **Style**

  > `"style": "realistic photography"`[6]

- **Lighting**

  > `"lighting": "soft, golden hour"`[6]

- **Camera**

  ```json
  "camera": {
    "lens": "50mm",
    "aperture": "f/1.8",
    "angle": "low-angle shot"
  }
  ```[6]

- **Mood/Emotion**

  > `"mood": "joyful, peaceful"`[6]

- **Optional details**

  > `"weather": "clear sky, warm temperatures"`[6]

Full example JSON prompt they say works well across Nano Banana and similar models:

```json
{
  "subject": "banana",
  "style": "hyperrealistic",
  "camera": {
    "type": "close-up",
    "focus": "sharp on banana",
    "depth_of_field": "shallow"
  },
  "lighting": {
    "type": "soft",
    "direction": "left",
    "effects": ["smooth shadows", "subtle highlights"]
  },
  "surface": {
    "type": "reflective glass",
    "reflection": true
  },
  "banana": {
    ...
  }
}
```[6]

They also show more complex variants like:

> `"lighting": "early morning mist with sunlight peeking through"`[6]  
> `"lighting": "spotlight on dancer, soft shadows in the background"`[6]  
> `"camera": { "lens": "telephoto", ... }`[6]

**Best‑practice claims from this JSON article:**

> “In JSON prompting, it is crucial to focus on necessary elements and attributes to avoid confusing the AI image generator.”[6]  
> “Use simpler words and phrases to ensure better understanding. Avoid using different phrases to explain to the same concept. Don’t add a list of adjectives or phrases to prompt components as it can result into unwanted image elements and generations.”[6]

So creators explicitly say **overstuffed adjective lists = superstition / worse results**, while **simple, stable fields for subject / lighting / camera** are the thing that matters.

### 2.2. Facebook groups: “Writing JSON prompts for Gemini Nano Banana”

A Facebook group tutorial post titled “Using json-style prompts for realistic ai images” (2026) is very explicit:

> “Writing JSON prompts for Gemini Nano Banana is about precision, structure, and control. Start by organizing your prompts into clear JSON sections that build ...”[12]

The full post is truncated in the preview, but the core message is that **JSON sections → control**, echoing the ImagineArt article’s structure.[6][12]

### 2.3. GitHub “awesome Nano Banana” prompt sets

Two GitHub repos curate Nano Banana Pro prompt structures:

- **ZeroLu/awesome-nanobanana-pro** (2025+) is described as:

  > “An awesome list of curated Nano Banana pro prompts and examples. Your go-to resource for mastering prompt engineering and exploring the creative potential ...”[11]

- **YouMind-OpenLab/awesome-nano-banana-pro-prompts** explicitly mentions:

  > “A complex structured prompt in JSON format to generate a broadcast-style image of a woman at a basketball game, complete with UI overlays and arena lighting.”[15]

The second repo is concrete evidence that advanced practitioners are encoding UI, overlays, and lighting in explicit JSON objects instead of free-form text.[15] The README itself is truncated in search preview, but the pattern matches the ImagineArt JSON schema.[6][15]

Given your constraints, you’d want to inspect those repos directly and lift whichever JSON templates are closest to your use case; the repos themselves are referenced heavily in prompt‑engineering discussions.

---

## 3. Camera & lighting language: f/1.8, lens, angle, color grading

Creators repeatedly state that **camera and lighting phrasing** has disproportionately large impact on Nano Banana Pro results; this lines up with Google’s official guidance.[3]

### 3.1. Google’s cinematography block

The official Nano Banana Pro blog suggests adding a concentrated **camera/lighting block** to the prompt:

> “Direct the shot like a cinematographer.”[3]

They give exact examples:

> “A low-angle shot with a shallow depth of field (f/1.8)”[3]  
> “Golden hour backlighting creating long shadows”[3]  
> “Cinematic color grading with muted teal tones.”[3]

And for composition/aspect ratio:

> “A 9:16 vertical poster”  
> “A cinematic 21:9 wide shot.”[3]

These chunks are frequently copied verbatim by YouTube and X users. Threads in the Nano Banana FB groups also use this exact structure; one common pattern example:

> “Gemini Nano Banana prompt: 4 distinct individual characters holding FIVE 5 distinct champagne flutes. F/1.8. camera lens focus. intensive highlights and ...” (FB group post, 2026)[13]

Here the poster emphasizes **“F/1.8. camera lens focus. intensive highlights”**, clearly leaning on aperture and lighting intensity as primary control phrases.[13]

### 3.2. Envato ImageGen guidance (Nano Banana under the hood)

Envato’s 2025 Nano Banana Pro tutorial (ImageGen/ImageEdit powered by Nano Banana Pro) says to use **camera-angle and cinematic-style keywords**, again validating the practice:[5]

> “Try using prompt keywords that focus on switching camera angles (or use ImageEdit’s built-in **Camera Angles** tool), crafting new scenes, or editing subject actions to advance the narrative.”[5]

They provide explicit wording:

> “For really focused results, stick to specific phrasing such as ‘extreme close-up’, ‘wide shot’, or ‘portrait’, or try to think about the cinematic aesthetic you want to achieve, using words like ‘film noir’, ‘3D animation’, or ‘Wes Anderson aesthetic’.”[5]

They also heavily emphasize **material and lighting cues** for product photography:

> “Product photography is about close-up detail and tactility, so shape your prompts around material cues like ‘pebbled leather’, ‘holographic’, ‘liquid glass’, or ‘fuzzy wool’.”[5]

And a full, detailed prompt for a branding/product shot (used as a template):

> “A wooden shop sign with carved edges, displaying a stylized hop cone logo in the center.  
> The brewery’s name, ‘Evergreen Brews,’ is engraved in an elegant serif font above and below the logo.  
> The wood is weathered, showing natural grain and slight imperfections, with small metal accents securing the corners.  
> A subtle, wrought-iron bracket supports the sign, adding a touch of rustic charm.”[5]

Practitioners re-use this style: short sentences, each describing material, text placement, and lighting implicitly through texture.

**What they say matters**

Envato’s article explicitly positions:

- **Camera angle keywords, material/lighting descriptions, and consistent style/brand language** as important.[5]
- “Gist-only” prompts are fine if you run them through their “Enhance Prompt” assistant, but when writing manually, you should avoid vague descriptions and keep styling cues “clear and focused”.[5]

They do not promote laundry lists of random aesthetics. That aligns with JSON/Google advice that *specific, non-conflicting descriptors* beat everything else.[3][5][6]

---

## 4. Multi-step refinement & “analyze then re-generate” workflows

Practitioners who get the most out of Nano Banana Pro tend to use **multi-step workflows** rather than one giant prompt. This shows up in tutorials and in more experimental uses (storyboards, slide decks, roasts).

### 4.1. “7 VIRAL Nano Banana Prompts” – multi-step & reference-driven (YouTube, 2025)

A 2025 YouTube video “7 VIRAL Nano Banana Prompts That Are Mind Blowing!” demonstrates several patterns with Nano Banana Pro that align with what you’re asking.[2]

Key workflows (described and used in the video):

1. **Pose / composition from reference, text-only for scene**

   They upload a photo and then state:

   > “I uploaded a photo of myself and said, ‘I wanted to create this low angle looking up shot of me in New York City stepping over cars. I want to show off the immense scale. I want tiny people and cars visible near my ...’”[2]

   The important pattern: **upload reference → describe camera angle (“low angle looking up”), environment (NYC), and scaling (“tiny people and cars visible”)**.

2. **Roast prompt using screenshot + text template**

   The creator attributes one pattern to “developerhs on x”:

   > “this actually enables Gemini to roast you and your social media page. So I grabbed a screenshot of my YouTube page. Let me go ahead and paste it in here and then I'll go ahead and grab this prompt and I'll paste it in here as well.”[2]

   The exact roast prompt is linked but not shown in the transcript; the flow is:

   - Paste screenshot
   - Paste a structured roast prompt from X
   - Generate roast image

   This demonstrates the **“image context + generic, reusable template”** pattern.

3. **Slide-deck collage from a PDF**

   > “So, what I did was I uploaded a PDF right here of a bunch of research I did for this video. I'm going to go ahead and click on create image and tell it to just create the first four slides for a slide deck about this information and put them all together into one image as a collage. That is a lot that I'm telling it to pack into one image.”[2]

   Workflow pattern:

   - Upload PDF (source text)
   - Prompt: “create the first four slides for a slide deck about this information and put them all together into one image as a collage.”[2]

   This is a **multi-step reasoning/composition** use—tight high-level instructions, no unnecessary stylistic fluff.

4. **Storyboard: analyze image → generate sequence**

   Citing Underwood’s prompt from X, the creator shows a **two-step storyboard workflow**:

   > “It comes to us from Underwood and he shows us how you can turn a single image into a complete storyboard like this. So what I've done was I've copied down his prompt, threw it in here and I uploaded that image that we created before of the dragon and I popping out of the screen.”[2]

   Step 1 – analysis:

   > “Now what you'll notice is that it's actually going to create a text breakdown for you of all the different elements and the scene breakdown for this image.”[2]

   Step 2 – generation:

   > “Then once it's done, just tell it to actually create the image. And here we go. A complete scene breakdown of this entire story.”[2]

   Here, the core pattern is:

   1. Prompt 1: “Analyze this image, describe all the important elements, characters, and camera angles in a way suitable for storyboards.” (paraphrased from narration; the exact Underwood prompt is in description, not transcribed)[2]
   2. Prompt 2: “Using that breakdown, generate a storyboard sequence.”[2]

   The author explicitly presents this as a reliable repeatable workflow, not a one-off trick.

**What the creator claims matters**

Throughout the video, the narrator emphasizes:

- Uploading **good reference images/docs**.
- Separating **concept description** from **actual generation** (analysis → re-use).
- Clear, concise instructions like “low angle looking up shot”, “show off the immense scale”, and “put them all together into one image as a collage”.[2]

There is **no** reliance on magic tokens; instead, human‑readable composition and workflow steps.

### 4.2. Hugging Face moodboard project: template + edit template

A 2025 Hugging Face blog project (“Fashion Moodboard with Gemini 3 & Nano Banana Pro”) demonstrates template-based prompting plus structured edits.[4]

They store a prompt template in `prompt_templates/prompt_template.txt` that:

> “encourages Gemini to consider moodboard-critical aspects like layout configuration.”[4]

The description:

> “The moodboard has a defined 2x4 grid UI layout, which is enforced with a prompt template (stored in prompt_templates/prompt_template.txt) that encourages Gemini to consider moodboard-critical aspects like layout configuration. Your subject is substituted into `{SUBJECT_PLACEHOLDER}` and the model is instructed to produce a fixed layout.”[4]

They then use a separate **edit template**:

> “On the backend, the edit prompt is built from prompt_templates/edit_template.txt, including:
> - the edit request text
> - optional bounding box coordinates (absolute + normalized)
> - a ‘grid cell’ description (which panel the region overlaps)”[4]

Patterns here:

- Fixed layout description (“defined 2x4 grid UI layout”) is baked into the base prompt, with a subject placeholder.[4]
- Edits are multi-step and structured: **edit text + bounding box + cell description**, exactly what you’d need from a programmatic workflow.[4]

This is a textbook **multi-step refinement via templating** pattern and directly targets Nano Banana Pro’s strengths.

---

## 5. Style-reference phrasing & brand consistency

### 5.1. Image references and roles

Google explicitly recommends specifying roles for each reference image when blending.[3]

> “When using uploaded images, clearly define the role of each. (e.g., ‘Use Image A for the character's pose, Image B for the art style, and Image C for the background environment.’)”[3]

This pattern—“Image A for pose, Image B for style, Image C for background”—is repeated in community tutorials as a robust way to get consistent characters and art direction, and it is explicitly supported by Nano Banana Pro’s multi-image blending.[3]

Envato’s guide again leans on consistent phrasing for brand look:

> “Use a Nano Banana prompting guide or Envato’s ‘Enhance prompt’ to keep your styling cues clear and focused.”[5]  
> “With branding, it pays to be consistent, so keep your prompt language similar throughout a sequence, using the same colors and font styles consistently as you work.”[5]

They also recommend:

> “integrate mood or brand keywords into your prompt, such as ‘ultra-minimalist’, ‘optimistic’, or ‘futuristic’.”[5]

### 5.2. Template-based style prompts (commercial tools)

Media.io’s Gemini New Year portrait tool (2026) offers prebuilt Nano Banana Pro prompts as templates:

> “On Media.io, you don’t need to write prompts manually. Just pick a 2026 New Year template — each one is built with an optimized Gemini AI prompt. Upload your photo, and the AI handles the rest. You can also edit the prompt if you want custom effects.”[7]

While they don’t show the full templates, they describe their behavior:

> “Each template comes with customizable AI prompts for your unique vision.”[7]  
> “Our Nano Banana Pro AI intelligently preserves your real face while seamlessly blending you into the 2026 New Year scene — perfect face accuracy every time.”[7]

Commercial template builders like this validate the **pattern of “fixed narrative + tweakable style phrases”** as a robust practical approach.

---

## 6. Beginner vs pro: simple natural language vs structured prompts

A basic Nano Banana tutorial on YouTube (“How to Make & Edit Images with Nano Banana for Beginners”, 2025) shows that you can get decent results with simple natural language:

> “I'm just going to snap a quick image of myself with good lighting.”[8]  
> “with these two images in Nano Banana, I'll create a birthday card. All I'll do is say create an image of a surfing competition trophy podium and confetti, cuz we both like to surf. I'll add, I'll say, ‘Dream team, 30 years of winning’ on a banner, plus fake career stats that are actually life highlights. Simple.”[8]  
> “As long as you're saying create an image, it will use all the images you upload and create something custom.”[8]

Pattern:

- Upload references
- Prompt = “create an image of [scene] … add [text] on a banner … plus [extra details]”[8]

The creator emphasizes that being explicit about **what text goes where** and **what elements to include** is sufficient at this level. They do *not* suggest secret words—just clarity about scene and text.

---

## 7. What practitioners explicitly say is superstition / unnecessary

From the sources above, several anti-patterns emerge:

1. **Huge adjective dumps / conflicting style tags**

   The JSON prompting article is blunt:

   > “Don’t add a list of adjectives or phrases to prompt components as it can result into unwanted image elements and generations.”[6]

   This is a direct rejection of the “just throw in 20 buzzwords” approach.

2. **Vague camera language**

   Both Google and Envato insist on concrete camera terms (“low-angle shot”, “extreme close-up”, “f/1.8”, “21:9 wide shot”) rather than vague “cinematic” alone.[3][5]

3. **Unstructured, mixed instructions**

   JSON-focused practitioners say:

   > “In JSON prompting, it is crucial to focus on necessary elements and attributes to avoid confusing the AI image generator.”[6]

   Which implies that messy prompts that mix inconsistent instructions or synonyms are counterproductive.

4. **Assuming Pro is always the model**

   An April 2026 analysis notes that Nano Banana 2 quietly replaced Pro as the default in the Gemini app:

   > “Without prior notice to Gemini App users, Google set Nano Banana 2 as the default image generation model.”[10]

   They advise:

   > “If your business is sensitive to ‘detail realism’ and ‘high-resolution output’ … you should still explicitly invoke Nano Banana Pro.”[10]

   So a “hidden superstition” in the community—assuming you’re on Pro whenever you see “Nano Banana” in the UI—is now wrong; advanced users explicitly call Pro by model ID via API or “Regenerate” menu instead.[10]

---

## 8. Putting it together: patterns that consistently matter

Based strictly on what creators and docs *actually say and show* in 2025–2026:

**Patterns that matter (according to practitioners):**

- Clear **schema** in the prompt (whether JSON or human-readable): Subject / Composition / Action / Location / Style / Camera / Lighting.[3][6]
- Short, precise **camera & lighting phrases**:  
  “low-angle shot”, “shallow depth of field (f/1.8)”, “extreme close-up”, “21:9 wide shot”, “Golden hour backlighting”, “cinematic color grading with muted teal tones”.[3][5][13]
- **JSON / structured prompts** for complex scenes, UI, storyboards, and layouts, often with fields like `"subject"`, `"environment"`, `"style"`, `"lighting"`, `"camera"`, `"mood"`, etc.[6][12][15]
- **Multi-step workflows**:
  - Analyze existing image → get breakdown → use that text as basis for new images (Underwood storyboard pattern).[2]
  - Template prompt files with placeholders for subject, slotting into fixed layout descriptions (Hugging Face moodboard).[4]
  - Upload PDF / screenshot and give a clear “create X from this” instruction (slide deck collage, roast thumbnails).[2]
- **Explicit roles for reference images**: “Image A for pose, B for style, C for background”.[3]
- **Consistent style & brand language across a series** (reuse same color/style descriptors rather than constantly changing them).[5]

**Patterns called out as superstition / discouraged:**

- Long chains of adjectives and style tags inside one field or sentence.[6]
- Mixing multiple moods/contradictory styles in one component (e.g., “dark and joyful horror rom-com”).[6]
- Assuming the UI is always using Nano Banana Pro instead of explicitly selecting the model.[10]

If you want to harvest more **verbatim** templates, the best next targets (based on what the web is pointing to) are:

- The `prompt_template.txt` and `edit_template.txt` files in the Hugging Face moodboard repo.[4]
- The JSON examples inside `YouMind-OpenLab/awesome-nano-banana-pro-prompts` and `ZeroLu/awesome-nanobanana-pro`.[11][15]
- The X/Twitter prompt threads linked in the “7 VIRAL Nano Banana Prompts” video description (for Underwood’s storyboard prompt and Rowan Paul’s “selfie with a famous person” template).[2]

Those are where working creators are publishing the structured prompt patterns they actually rely on.

## Sources
1. Here is a full Ai generated images tutorial. Specifically 7 prompt ... — https://www.instagram.com/reel/DTQsgpeE-rv/ (2026-01-08)
2. 7 VIRAL Nano Banana Prompts That Are Mind Blowing! - YouTube — https://www.youtube.com/watch?v=39YlGUIH1Uk (2025-12-15)
3. 7 tips to get the most out of Nano Banana Pro - Google Blog — https://blog.google/products-and-platforms/products/gemini/prompting-tips-nano-banana-pro/ (2025-11-20)
4. Fashion Moodboard with Gemini 3 & Nano Banana Pro — https://huggingface.co/blog/margaretmz/ai-fashion-moodboard (2025-12-18)
5. How to Use Nano Banana Pro in ImageGen & ImageEdit - Envato — https://elements.envato.com/learn/how-to-use-nano-banana-pro-imagegen-imageedit (2025-12-18)
6. JSON Prompting for AI Image Generation - ImagineArt — https://www.imagine.art/blogs/json-prompting-for-ai-image-generation (2025-10-20)
7. Gemini AI 2026 New Year Portrait Prompts - Media.io — https://www.media.io/gemini-ai-2026-new-year-prompt.html (2025-12-14)
8. How to Make & Edit Images with Nano Banana for Beginners — https://www.youtube.com/watch?v=-Yq1Yi0MpDQ (2025-12-10)
9. Drop a “PROMPTS” below in comment & the Nano Banana JSON ... — https://www.instagram.com/p/DVCEpuUgDmA/ (2026-02-21)
10. Has Nano Banana Pro been downgraded? The latest truth as of ... — https://help.apiyi.com/en/nano-banana-pro-quality-decline-april-2026-analysis-en.html (2026-04-08)
11. Awesome Nano Banana Pro - GitHub — https://github.com/ZeroLu/awesome-nanobanana-pro (2025-11-30)
12. Using json-style prompts for realistic ai images - Facebook — https://www.facebook.com/groups/1504990710044276/posts/1983689635507712/ (2025-12-01)
13. 5,000 + members! - Facebook — https://www.facebook.com/groups/2119704508526578/posts/2278087716021589/ (2025-11-07)
14. Nano Banana Pro Prompting Guide + 75 Prompts - ImagineArt — https://www.imagine.art/blogs/nano-banana-pro-prompt-guide (2025-11-28)
15. YouMind-OpenLab/awesome-nano-banana-pro-prompts - GitHub — https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts (2026-06-12)
