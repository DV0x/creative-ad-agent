<br />

<br />

Gemini can generate and process images conversationally. You can prompt either the[fast Gemini 2.5 Flash (aka Nano Banana) or the advanced Gemini 3 Pro Preview (aka Nano Banana Pro)](https://ai.google.dev/gemini-api/docs/image-generation#model-selection)image models with text, images, or a combination of both, allowing you to create, edit, and iterate on visuals with unprecedented control:

- **Text, Image, and Multi-Image to Image:**Generate high-quality images from text descriptions, use text prompts to edit and adjust a given image, or use multiple input images to compose new scenes and transfer styles.
- **Iterative refinement:**Conversationally refine your image over multiple turns, making small adjustments until it's perfect.
- **High-Fidelity text rendering:**Accurately generate images that contain legible and well-placed text, ideal for logos, diagrams, and posters.

All generated images include a[SynthID watermark](https://ai.google.dev/responsible/docs/safeguards/synthid).

## Image generation (text-to-image)

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("gemini-native-image.png", buffer);
          console.log("Image saved as gemini-native-image.png");
        }
      }
    }

    main();

### REST

    curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
          ]
        }]
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > gemini-native-image.png

![AI-generated image of a nano banana dish](https://ai.google.dev/static/gemini-api/docs/images/nano-banana.png)AI-generated image of a nano banana dish in a Gemini-themed restaurant

## Image editing (text-and-image-to-image)

**Reminder** : Make sure you have the necessary rights to any images you upload. Don't generate content that infringe on others' rights, including videos or images that deceive, harass, or harm. Your use of this generative AI service is subject to our[Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy).

Provide an image and use text prompts to add, remove, or modify elements, change the style, or adjust the color grading.

The following example demonstrates uploading base64 encoded images. For multiple images, larger payloads, and supported MIME types, check the[Image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)page.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "path/to/cat_image.png";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        { text: "Create a picture of my cat eating a nano-banana in a" +
                "fancy restaurant under the Gemini constellation" },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("gemini-native-image.png", buffer);
          console.log("Image saved as gemini-native-image.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/cat_image.jpeg

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {\"text\": \"'Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation\"},
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/jpeg\",
                    \"data\": \"$IMG_BASE64\"
                  }
                }
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > gemini-edited-image.png

![AI-generated image of a cat eating anano banana](https://ai.google.dev/static/gemini-api/docs/images/cat-banana.png)AI-generated image of a cat eating a nano banana

### Multi-turn image editing

Keep generating and editing images conversationally. Chat or multi-turn conversation is the recommended way to iterate on images. The following example shows a prompt to generate an infographic about photosynthesis.

### Javascript

    import { GoogleGenAI } from "@google/genai";

    const ai = new GoogleGenAI({});

    async function main() {
      const chat = ai.chats.create({
        model: "gemini-3-pro-image-preview",
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          tools: [{googleSearch: {}}],
        },
      });

    await main();

    const message = "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plant's favorite food. Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy). The style should be like a page from a colorful kids' cookbook, suitable for a 4th grader."

    let response = await chat.sendMessage({message});

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("photosynthesis.png", buffer);
          console.log("Image saved as photosynthesis.png");
        }
    }

### REST

    curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "role": "user",
          "parts": [
            {"text": "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plants favorite food. Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy). The style should be like a page from a colorful kids cookbook, suitable for a 4th grader."}
          ]
        }],
        "generationConfig": {
          "responseModalities": ["TEXT", "IMAGE"]
        }
      }' > turn1_response.json

    cat turn1_response.json
    # Requires jq to parse JSON response
    jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' turn1_response.json | head -1 | base64 --decode > photosynthesis.png

![AI-generated infographic about photosynthesis](https://ai.google.dev/static/gemini-api/docs/images/infographic-eng.png)AI-generated infographic about photosynthesis

You can then use the same chat to change the language on the graphic to Spanish.

### Javascript

    const message = 'Update this infographic to be in Spanish. Do not change any other elements of the image.';
    const aspectRatio = '16:9';
    const resolution = '2K';

    let response = await chat.sendMessage({
      message,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
        tools: [{googleSearch: {}}],
      },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("photosynthesis2.png", buffer);
          console.log("Image saved as photosynthesis2.png");
        }
    }

### REST

    # Create request2.json by combining history and new prompt
    # Read model's previous response content directly into jq
    jq --argjson user1 '{"role": "user", "parts": [{"text": "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plant'\''s favorite food. Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy). The style should be like a page from a colorful kids'\'' cookbook, suitable for a 4th grader."}]}' \
      --argjson user2 '{"role": "user", "parts": [{"text": "Update this infographic to be in Spanish. Do not change any other elements of the image."}]}' \
      -f /dev/stdin turn1_response.json > request2.json <<'EOF_JQ_FILTER'
    .candidates[0].content | {
      "contents": [$user1, ., $user2],
      "tools": [{"google_search": {}}],
      "generationConfig": {
        "responseModalities": ["TEXT", "IMAGE"],
        "imageConfig": {
          "aspectRatio": "16:9",
          "imageSize": "2K"
        }
      }
    }
    EOF_JQ_FILTER

    curl -s -X POST \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @request2.json > turn2_response.json

    jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' turn2_response.json | head -1 | base64 --decode > photosynthesis_spanish.png

![AI-generated infographic of photosynthesis in Spanish](https://ai.google.dev/static/gemini-api/docs/images/infographic-spanish.png)AI-generated infographic of photosynthesis in Spanish

## New with Gemini 3 Pro Image

Gemini 3 Pro Image (`gemini-3-pro-image-preview`) is a state-of-the-art image generation and editing model optimized for professional asset production. Designed to tackle the most challenging workflows through advanced reasoning, it excels at complex, multi-turn creation and modification tasks.

- **High-resolution output**: Built-in generation capabilities for 1K, 2K, and 4K visuals.
- **Advanced text rendering**: Capable of generating legible, stylized text for infographics, menus, diagrams, and marketing assets.
- **Grounding with Google Search**: The model can use Google Search as a tool to verify facts and generate imagery based on real-time data (e.g., current weather maps, stock charts, recent events).
- **Thinking mode**: The model utilizes a "thinking" process to reason through complex prompts. It generates interim "thought images" (visible in the backend but not charged) to refine the composition before producing the final high-quality output.
- **Up to 14 reference images**: You can now mix up to 14 reference images to produce the final image.

### Use up to 14 reference images

Gemini 3 Pro Preview lets you to mix up to 14 reference images. These 14 images can include the following:

- Up to 6 images of objects with high-fidelity to include in the final image
- Up to 5 images of humans to maintain character consistency

### Javascript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
          'An office group photo of these people, they are making funny faces.';
      const aspectRatio = '5:4';
      const resolution = '2K';

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile1,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile2,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile3,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile4,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64ImageFile5,
        },
      }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: contents,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: resolution,
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("image.png", buffer);
          console.log("Image saved as image.png");
        }
      }

    }

    main();

### REST

    IMG_PATH1=person1.png
    IMG_PATH2=person2.png
    IMG_PATH3=person3.png
    IMG_PATH4=person4.png
    IMG_PATH5=person5.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG1_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH1" 2>&1)
    IMG2_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH2" 2>&1)
    IMG3_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH3" 2>&1)
    IMG4_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH4" 2>&1)
    IMG5_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH5" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {\"text\": \"An office group photo of these people, they are making funny faces.\"},
                {\"inline_data\": {\"mime_type\":\"image/png\", \"data\": \"$IMG1_BASE64\"}},
                {\"inline_data\": {\"mime_type\":\"image/png\", \"data\": \"$IMG2_BASE64\"}},
                {\"inline_data\": {\"mime_type\":\"image/png\", \"data\": \"$IMG3_BASE64\"}},
                {\"inline_data\": {\"mime_type\":\"image/png\", \"data\": \"$IMG4_BASE64\"}},
                {\"inline_data\": {\"mime_type\":\"image/png\", \"data\": \"$IMG5_BASE64\"}}
            ]
          }],
          \"generationConfig\": {
            \"responseModalities\": [\"TEXT\", \"IMAGE\"],
            \"imageConfig\": {
              \"aspectRatio\": \"5:4\",
              \"imageSize\": \"2K\"
            }
          }
        }" | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' | head -1 | base64 --decode > office.png

![AI-generated office group photo](https://ai.google.dev/static/gemini-api/docs/images/office-group-photo.jpeg)AI-generated office group photo

### Grounding with Google Search

Use the[Google Search tool](https://ai.google.dev/gemini-api/docs/google-search)to generate images based on real-time information, such as weather forecasts, stock charts, or recent events.

Note that when using Grounding with Google Search with image generation, image-based search results are not passed to the generation model and are excluded from the response.

### Javascript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt = 'Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day';
      const aspectRatio = '16:9';
      const resolution = '2K';

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: resolution,
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("image.png", buffer);
          console.log("Image saved as image.png");
        }
      }

    }

    main();

### REST

    curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{"parts": [{"text": "Visualize the current weather forecast for the next 5 days in San Francisco as a clean, modern weather chart. Add a visual on what I should wear each day"}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {
          "responseModalities": ["TEXT", "IMAGE"],
          "imageConfig": {"aspectRatio": "16:9"}
        }
      }' | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' | head -1 | base64 --decode > weather.png

![AI-generated five day weather chart for San Francisco](https://ai.google.dev/static/gemini-api/docs/images/weather-forecast.png)AI-generated five day weather chart for San Francisco

The response includes`groundingMetadata`which contains the following required fields:

- **`searchEntryPoint`**: Contains the HTML and CSS to render the required search suggestions.
- **`groundingChunks`**: Returns the top 3 web sources used to ground the generated image

### Generate images up to 4K resolution

Gemini 3 Pro Image generates 1K images by default but can also output 2K and 4K images. To generate higher resolution assets, specify the`image_size`in the`generation_config`.

You must use an uppercase 'K' (e.g., 1K, 2K, 4K). Lowercase parameters (e.g., 1k) will be rejected.

### Javascript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
          'Da Vinci style anatomical sketch of a dissected Monarch butterfly. Detailed drawings of the head, wings, and legs on textured parchment with notes in English.';
      const aspectRatio = '1:1';
      const resolution = '1K';

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: resolution,
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("image.png", buffer);
          console.log("Image saved as image.png");
        }
      }

    }

    main();

### REST

    curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{"parts": [{"text": "Da Vinci style anatomical sketch of a dissected Monarch butterfly. Detailed drawings of the head, wings, and legs on textured parchment with notes in English."}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {
          "responseModalities": ["TEXT", "IMAGE"],
          "imageConfig": {"aspectRatio": "1:1", "imageSize": "1K"}
        }
      }' | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' | head -1 | base64 --decode > butterfly.png

The following is an example image generated from this prompt:
![AI-generated Da Vinci style anatomical sketch of a dissected Monarch butterfly.](https://ai.google.dev/static/gemini-api/docs/images/gemini3-4k-image.png)AI-generated Da Vinci style anatomical sketch of a dissected Monarch butterfly.

### Thinking Process

The Gemini 3 Pro Image Preview model is a thinking model and uses a reasoning process ("Thinking") for complex prompts. This feature is enabled by default and cannot be disabled in the API. To learn more about the thinking process, see the[Gemini Thinking](https://ai.google.dev/gemini-api/docs/thinking)guide.

The model generates up to two interim images to test composition and logic. The last image within Thinking is also the final rendered image.

You can check the thoughts that lead to the final image being produced.

### Javascript

    for (const part of response.candidates[0].content.parts) {
      if (part.thought) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, 'base64');
          fs.writeFileSync('image.png', buffer);
          console.log('Image saved as image.png');
        }
      }
    }

#### Thought Signatures

Thought signatures are encrypted representations of the model's internal thought process and are used to preserve reasoning context across multi-turn interactions. All responses include a`thought_signature`field. As a general rule, if you receive a thought signature in a model response, you should pass it back exactly as received when sending the conversation history in the next turn. Failure to circulate thought signatures may cause the response to fail. Check the[thought signature](https://ai.google.dev/gemini-api/docs/thought-signatures)documentation for more explanations of signatures overall.
| **Note:** If you use the official[Google Gen AI SDKs](https://ai.google.dev/gemini-api/docs/libraries)and use the chat feature (or append the full model response object directly to history),**thought signatures are handled automatically**. You do not need to manually extract or manage them, or change your code.

Here is how thought signatures work:

- All`inline_data`parts with image`mimetype`which are part of the response should have signature.
- If there are some text parts at the beginning (before any image) right after the thoughts, the first text part should also have a signature.
- Thoughts do not have signatures; If`inline_data`parts with image`mimetype`are part of thoughts, they will not have signatures.

The following code shows an example of where thought signatures are included:

    [
      {
        "inline_data": {
          "data": "<base64_image_data_0>",
          "mime_type": "image/png"
        },
        "thought": true // Thoughts don't have signatures
      },
      {
        "inline_data": {
          "data": "<base64_image_data_1>",
          "mime_type": "image/png"
        },
        "thought": true // Thoughts don't have signatures
      },
      {
        "inline_data": {
          "data": "<base64_image_data_2>",
          "mime_type": "image/png"
        },
        "thought": true // Thoughts don't have signatures
      },
      {
        "text": "Here is a step-by-step guide to baking macarons, presented in three separate images.\n\n### Step 1: Piping the Batter\n\nThe first step after making your macaron batter is to pipe it onto a baking sheet. This requires a steady hand to create uniform circles.\n\n",
        "thought_signature": "<Signature_A>" // The first non-thought part always has a signature
      },
      {
        "inline_data": {
          "data": "<base64_image_data_3>",
          "mime_type": "image/png"
        },
        "thought_signature": "<Signature_B>" // All image parts have a signatures
      },
      {
        "text": "\n\n### Step 2: Baking and Developing Feet\n\nOnce piped, the macarons are baked in the oven. A key sign of a successful bake is the development of \"feet\"---the ruffled edge at the base of each macaron shell.\n\n"
        // Follow-up text parts don't have signatures
      },
      {
        "inline_data": {
          "data": "<base64_image_data_4>",
          "mime_type": "image/png"
        },
        "thought_signature": "<Signature_C>" // All image parts have a signatures
      },
      {
        "text": "\n\n### Step 3: Assembling the Macaron\n\nThe final step is to pair the cooled macaron shells by size and sandwich them together with your desired filling, creating the classic macaron dessert.\n\n"
      },
      {
        "inline_data": {
          "data": "<base64_image_data_5>",
          "mime_type": "image/png"
        },
        "thought_signature": "<Signature_D>" // All image parts have a signatures
      }
    ]

## Other image generation modes

Gemini supports other image interaction modes based on prompt structure and context, including:

- **Text to image(s) and text (interleaved):** Outputs images with related text.
  - Example prompt: "Generate an illustrated recipe for a paella."
- **Image(s) and text to image(s) and text (interleaved)** : Uses input images and text to create new related images and text.
  - Example prompt: (With an image of a furnished room) "What other color sofas would work in my space? can you update the image?"

## Generate images in batch

If you need to generate a lot of images, you can use the[Batch API](https://ai.google.dev/gemini-api/docs/batch-api). You get higher[rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)in exchange for a turnaround of up to 24 hours.

Check the[Batch API image generation documentation](https://ai.google.dev/gemini-api/docs/batch-api#image-generation)and the[cookbook](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Batch_mode.ipynb)for Batch API image examples and code.

## Prompting guide and strategies

Mastering image generation starts with one fundamental principle:
> **Describe the scene, don't just list keywords.**The model's core strength is its deep language understanding. A narrative, descriptive paragraph will almost always produce a better, more coherent image than a list of disconnected words.

### Prompts for generating images

The following strategies will help you create effective prompts to generate exactly the images you're looking for.

#### 1. Photorealistic scenes

For realistic images, use photography terms. Mention camera angles, lens types, lighting, and fine details to guide the model toward a photorealistic result.

### Template

    A photorealistic [shot type] of [subject], [action or expression], set in
    [environment]. The scene is illuminated by [lighting description], creating
    a [mood] atmosphere. Captured with a [camera/lens details], emphasizing
    [key textures and details]. The image should be in a [aspect ratio] format.

### Prompt

    A photorealistic close-up portrait of an elderly Japanese ceramicist with
    deep, sun-etched wrinkles and a warm, knowing smile. He is carefully
    inspecting a freshly glazed tea bowl. The setting is his rustic,
    sun-drenched workshop. The scene is illuminated by soft, golden hour light
    streaming through a window, highlighting the fine texture of the clay.
    Captured with an 85mm portrait lens, resulting in a soft, blurred background
    (bokeh). The overall mood is serene and masterful. Vertical portrait
    orientation.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop with pottery wheels and shelves of clay pots in the background. The scene is illuminated by soft, golden hour light streaming through a window, highlighting the fine texture of the clay and the fabric of his apron. Captured with an 85mm portrait lens, resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("photorealistic_example.png", buffer);
          console.log("Image saved as photorealistic_example.png");
        }
      }
    }

    main();

### REST

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "A photorealistic close-up portrait of an elderly Japanese ceramicist with deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop with pottery wheels and shelves of clay pots in the background. The scene is illuminated by soft, golden hour light streaming through a window, highlighting the fine texture of the clay and the fabric of his apron. Captured with an 85mm portrait lens, resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful."}
          ]
        }]
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > photorealistic_example.png

![A photorealistic close-up portrait of an elderly Japanese ceramicist...](https://ai.google.dev/static/gemini-api/docs/images/photorealistic_example.png)A photorealistic close-up portrait of an elderly Japanese ceramicist...

#### 2. Stylized illustrations \& stickers

To create stickers, icons, or assets, be explicit about the style and request a transparent background.

### Template

    A [style] sticker of a [subject], featuring [key characteristics] and a
    [color palette]. The design should have [line style] and [shading style].
    The background must be transparent.

### Prompt

    A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's
    munching on a green bamboo leaf. The design features bold, clean outlines,
    simple cel-shading, and a vibrant color palette. The background must be white.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It's munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette. The background must be white.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("red_panda_sticker.png", buffer);
          console.log("Image saved as red_panda_sticker.png");
        }
      }
    }

    main();

### REST

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. It'"'"'s munching on a green bamboo leaf. The design features bold, clean outlines, simple cel-shading, and a vibrant color palette. The background must be white."}
          ]
        }]
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > red_panda_sticker.png

![A kawaii-style sticker of a happy red...](https://ai.google.dev/static/gemini-api/docs/images/red_panda_sticker.png)A kawaii-style sticker of a happy red panda...

#### 3. Accurate text in images

Gemini excels at rendering text. Be clear about the text, the font style (descriptively), and the overall design. Use Gemini 3 Pro Image Preview for professional asset production.

### Template

    Create a [image type] for [brand/concept] with the text "[text to render]"
    in a [font style]. The design should be [style description], with a
    [color scheme].

### Prompt

    Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way.";

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });
      for (const part of response.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("logo_example.jpg", buffer);
          console.log("Image saved as logo_example.jpg");
        }
      }
    }

    main();

### REST

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "Create a modern, minimalist logo for a coffee shop called '"'"'The Daily Grind'"'"'. The text should be in a clean, bold, sans-serif font. The color scheme is black and white. Put the logo in a circle. Use a coffee bean in a clever way."}
          ]
        }],
        "generationConfig": {
          "imageConfig": {
            "aspectRatio": "1:1"
          }
        }
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > logo_example.jpg

![Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'...](https://ai.google.dev/static/gemini-api/docs/images/logo_example.jpg)Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'...

#### 4. Product mockups \& commercial photography

Perfect for creating clean, professional product shots for e-commerce, advertising, or branding.

### Template

    A high-resolution, studio-lit product photograph of a [product description]
    on a [background surface/description]. The lighting is a [lighting setup,
    e.g., three-point softbox setup] to [lighting purpose]. The camera angle is
    a [angle type] to showcase [specific feature]. Ultra-realistic, with sharp
    focus on [key detail]. [Aspect ratio].

### Prompt

    A high-resolution, studio-lit product photograph of a minimalist ceramic
    coffee mug in matte black, presented on a polished concrete surface. The
    lighting is a three-point softbox setup designed to create soft, diffused
    highlights and eliminate harsh shadows. The camera angle is a slightly
    elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with
    sharp focus on the steam rising from the coffee. Square image.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("product_mockup.png", buffer);
          console.log("Image saved as product_mockup.png");
        }
      }
    }

    main();

### REST

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug in matte black, presented on a polished concrete surface. The lighting is a three-point softbox setup designed to create soft, diffused highlights and eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising from the coffee. Square image."}
          ]
        }]
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > product_mockup.png

![A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug...](https://ai.google.dev/static/gemini-api/docs/images/product_mockup.png)A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug...

#### 5. Minimalist \& negative space design

Excellent for creating backgrounds for websites, presentations, or marketing materials where text will be overlaid.

### Template

    A minimalist composition featuring a single [subject] positioned in the
    [bottom-right/top-left/etc.] of the frame. The background is a vast, empty
    [color] canvas, creating significant negative space. Soft, subtle lighting.
    [Aspect ratio].

### Prompt

    A minimalist composition featuring a single, delicate red maple leaf
    positioned in the bottom-right of the frame. The background is a vast, empty
    off-white canvas, creating significant negative space for text. Soft,
    diffused lighting from the top left. Square image.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt =
        "A minimalist composition featuring a single, delicate red maple leaf positioned in the bottom-right of the frame. The background is a vast, empty off-white canvas, creating significant negative space for text. Soft, diffused lighting from the top left. Square image.";

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("minimalist_design.png", buffer);
          console.log("Image saved as minimalist_design.png");
        }
      }
    }

    main();

### REST

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{
          "parts": [
            {"text": "A minimalist composition featuring a single, delicate red maple leaf positioned in the bottom-right of the frame. The background is a vast, empty off-white canvas, creating significant negative space for text. Soft, diffused lighting from the top left. Square image."}
          ]
        }]
      }' \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > minimalist_design.png

![A minimalist composition featuring a single, delicate red maple leaf...](https://ai.google.dev/static/gemini-api/docs/images/minimalist_design.png)A minimalist composition featuring a single, delicate red maple leaf...

#### 6. Sequential art (Comic panel / Storyboard)

Builds on character consistency and scene description to create panels for visual storytelling. For accuracy with text and storytelling ability, these prompts work best with Gemini 3 Pro Image Preview.

### Template

    Make a 3 panel comic in a [style]. Put the character in a [type of scene].

### Prompt

    Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humurous scene.

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/man_in_white_glasses.jpg";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        {text: "Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humurous scene."},
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("comic_panel.jpg", buffer);
          console.log("Image saved as comic_panel.jpg");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/man_in_white_glasses.jpg

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -s -X POST
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"contents\": [{
          \"parts\": [
            {\"text\": \"Make a 3 panel comic in a gritty, noir art style with high-contrast black and white inks. Put the character in a humurous scene.\"},
            {\"inline_data\": {\"mime_type\":\"image/jpeg\", \"data\": \"$IMG_BASE64\"}}
          ]
        }]
      }" \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > comic_panel.jpg

|------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input                                                                                                            | Output                                                                                                                                                                         |
| ![Man in white glasses](https://ai.google.dev/static/gemini-api/docs/images/man_in_white_glasses.jpg)Input image | ![Make a 3 panel comic in a gritty, noir art style...](https://ai.google.dev/static/gemini-api/docs/images/comic_panel.jpg)Make a 3 panel comic in a gritty, noir art style... |

#### 7. Grounding with Google Search

Use Google Search to generate images based on recent or real-time information. This is useful for news, weather, and other time-sensitive topics.

### Prompt

    Make a simple but stylish graphic of last night's Arsenal game in the Champion's League

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const prompt = "Make a simple but stylish graphic of last night's Arsenal game in the Champion's League";

      const aspectRatio = '16:9';
      const resolution = '2K';

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: resolution,
          },
          tools: [{"google_search": {}}],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("football-score.jpg", buffer);
          console.log("Image saved as football-score.jpg");
        }
      }

    }

    main();

### REST

    curl -s -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
      -H "x-goog-api-key: $GEMINI_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "contents": [{"parts": [{"text": "Make a simple but stylish graphic of last nights Arsenal game in the Champions League"}]}],
        "tools": [{"google_search": {}}],
        "generationConfig": {
          "responseModalities": ["TEXT", "IMAGE"],
          "imageConfig": {"aspectRatio": "16:9"}
        }
      }" | jq -r '.candidates[0].content.parts[] | select(.inlineData) | .inlineData.data' | head -1 | base64 --decode > football-score.jpg

![AI-generated graphic of an Arsenal football score](https://ai.google.dev/static/gemini-api/docs/images/football-score.jpg)AI-generated graphic of an Arsenal football score

### Prompts for editing images

These examples show how to provide images alongside your text prompts for editing, composition, and style transfer.

#### 1. Adding and removing elements

Provide an image and describe your change. The model will match the original image's style, lighting, and perspective.

### Template

    Using the provided image of [subject], please [add/remove/modify] [element]
    to/from the scene. Ensure the change is [description of how the change should
    integrate].

### Prompt

    "Using the provided image of my cat, please add a small, knitted wizard hat
    on its head. Make it look like it's sitting comfortably and matches the soft
    lighting of the photo."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/cat_photo.png";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        { text: "Using the provided image of my cat, please add a small, knitted wizard hat on its head. Make it look like it's sitting comfortably and not falling off." },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("cat_with_hat.png", buffer);
          console.log("Image saved as cat_with_hat.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/cat_photo.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {\"text\": \"Using the provided image of my cat, please add a small, knitted wizard hat on its head. Make it look like it's sitting comfortably and not falling off.\"},
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG_BASE64\"
                  }
                }
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > cat_with_hat.png

|---------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input                                                   | Output                                                                                                                                                                                                                              |
| :cat:A photorealistic picture of a fluffy ginger cat... | ![Using the provided image of my cat, please add a small, knitted wizard hat...](https://ai.google.dev/static/gemini-api/docs/images/cat_with_hat.png)Using the provided image of my cat, please add a small, knitted wizard hat... |

#### 2. Inpainting (Semantic masking)

Conversationally define a "mask" to edit a specific part of an image while leaving the rest untouched.

### Template

    Using the provided image, change only the [specific element] to [new
    element/description]. Keep everything else in the image exactly the same,
    preserving the original style, lighting, and composition.

### Prompt

    "Using the provided image of a living room, change only the blue sofa to be
    a vintage, brown leather chesterfield sofa. Keep the rest of the room,
    including the pillows on the sofa and the lighting, unchanged."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/living_room.png";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        { text: "Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("living_room_edited.png", buffer);
          console.log("Image saved as living_room_edited.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/living_room.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG_BASE64\"
                  }
                },
                {\"text\": \"Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa. Keep the rest of the room, including the pillows on the sofa and the lighting, unchanged.\"}
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > living_room_edited.png

|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input                                                                                                                                                                    | Output                                                                                                                                                                                                                                                                                                                          |
| ![A wide shot of a modern, well-lit living room...](https://ai.google.dev/static/gemini-api/docs/images/living_room.png)A wide shot of a modern, well-lit living room... | ![Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa...](https://ai.google.dev/static/gemini-api/docs/images/living_room_edited.png)Using the provided image of a living room, change only the blue sofa to be a vintage, brown leather chesterfield sofa... |

#### 3. Style transfer

Provide an image and ask the model to recreate its content in a different artistic style.

### Template

    Transform the provided photograph of [subject] into the artistic style of [artist/art style]. Preserve the original composition but render it with [description of stylistic elements].

### Prompt

    "Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/city.png";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        { text: "Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("city_style_transfer.png", buffer);
          console.log("Image saved as city_style_transfer.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/city.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG_BASE64\"
                  }
                },
                {\"text\": \"Transform the provided photograph of a modern city street at night into the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition of buildings and cars, but render all elements with swirling, impasto brushstrokes and a dramatic palette of deep blues and bright yellows.\"}
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > city_style_transfer.png

|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input                                                                                                                                                                                                       | Output                                                                                                                                                                                                                     |
| ![A photorealistic, high-resolution photograph of a busy city street...](https://ai.google.dev/static/gemini-api/docs/images/city.png)A photorealistic, high-resolution photograph of a busy city street... | ![Transform the provided photograph of a modern city street at night...](https://ai.google.dev/static/gemini-api/docs/images/city_style_transfer.png)Transform the provided photograph of a modern city street at night... |

#### 4. Advanced composition: Combining multiple images

Provide multiple images as context to create a new, composite scene. This is perfect for product mockups or creative collages.

### Template

    Create a new image by combining the elements from the provided images. Take
    the [element from image 1] and place it with/on the [element from image 2].
    The final image should be a [description of the final scene].

### Prompt

    "Create a professional e-commerce fashion photo. Take the blue floral dress
    from the first image and let the woman from the second image wear it.
    Generate a realistic, full-body shot of the woman wearing the dress, with
    the lighting and shadows adjusted to match the outdoor environment."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath1 = "/path/to/your/dress.png";
      const imageData1 = fs.readFileSync(imagePath1);
      const base64Image1 = imageData1.toString("base64");
      const imagePath2 = "/path/to/your/model.png";
      const imageData2 = fs.readFileSync(imagePath2);
      const base64Image2 = imageData2.toString("base64");

      const prompt = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image1,
          },
        },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image2,
          },
        },
        { text: "Create a professional e-commerce fashion photo. Take the blue floral dress from the first image and let the woman from the second image wear it. Generate a realistic, full-body shot of the woman wearing the dress, with the lighting and shadows adjusted to match the outdoor environment." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("fashion_ecommerce_shot.png", buffer);
          console.log("Image saved as fashion_ecommerce_shot.png");
        }
      }
    }

    main();

### REST

    IMG_PATH1=/path/to/your/dress.png
    IMG_PATH2=/path/to/your/model.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG1_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH1" 2>&1)
    IMG2_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH2" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG1_BASE64\"
                  }
                },
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG2_BASE64\"
                  }
                },
                {\"text\": \"Create a professional e-commerce fashion photo. Take the blue floral dress from the first image and let the woman from the second image wear it. Generate a realistic, full-body shot of the woman wearing the dress, with the lighting and shadows adjusted to match the outdoor environment.\"}
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > fashion_ecommerce_shot.png

|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input 1                                                             | Input 2                                                                                                                                                                  | Output                                                                                                                                                                                |
| :dress:A professionally shot photo of a blue floral summer dress... | ![Full-body shot of a woman with her hair in a bun...](https://ai.google.dev/static/gemini-api/docs/images/model.png)Full-body shot of a woman with her hair in a bun... | ![Create a professional e-commerce fashion photo...](https://ai.google.dev/static/gemini-api/docs/images/fashion_ecommerce_shot.png)Create a professional e-commerce fashion photo... |

#### 5. High-fidelity detail preservation

To ensure critical details (like a face or logo) are preserved during an edit, describe them in great detail along with your edit request.

### Template

    Using the provided images, place [element from image 2] onto [element from
    image 1]. Ensure that the features of [element from image 1] remain
    completely unchanged. The added element should [description of how the
    element should integrate].

### Prompt

    "Take the first image of the woman with brown hair, blue eyes, and a neutral
    expression. Add the logo from the second image onto her black t-shirt.
    Ensure the woman's face and features remain completely unchanged. The logo
    should look like it's naturally printed on the fabric, following the folds
    of the shirt."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath1 = "/path/to/your/woman.png";
      const imageData1 = fs.readFileSync(imagePath1);
      const base64Image1 = imageData1.toString("base64");
      const imagePath2 = "/path/to/your/logo.png";
      const imageData2 = fs.readFileSync(imagePath2);
      const base64Image2 = imageData2.toString("base64");

      const prompt = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image1,
          },
        },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image2,
          },
        },
        { text: "Take the first image of the woman with brown hair, blue eyes, and a neutral expression. Add the logo from the second image onto her black t-shirt. Ensure the woman's face and features remain completely unchanged. The logo should look like it's naturally printed on the fabric, following the folds of the shirt." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("woman_with_logo.png", buffer);
          console.log("Image saved as woman_with_logo.png");
        }
      }
    }

    main();

### REST

    IMG_PATH1=/path/to/your/woman.png
    IMG_PATH2=/path/to/your/logo.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG1_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH1" 2>&1)
    IMG2_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH2" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG1_BASE64\"
                  }
                },
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG2_BASE64\"
                  }
                },
                {\"text\": \"Take the first image of the woman with brown hair, blue eyes, and a neutral expression. Add the logo from the second image onto her black t-shirt. Ensure the woman's face and features remain completely unchanged. The logo should look like it's naturally printed on the fabric, following the folds of the shirt.\"}
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > woman_with_logo.png

|----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input 1                                                                    | Input 2                                                                                                                                                                     | Output                                                                                                                                                                                                                                                         |
| :woman:A professional headshot of a woman with brown hair and blue eyes... | ![A simple, modern logo with the letters 'G' and 'A'...](https://ai.google.dev/static/gemini-api/docs/images/logo.png)A simple, modern logo with the letters 'G' and 'A'... | ![Take the first image of the woman with brown hair, blue eyes, and a neutral expression...](https://ai.google.dev/static/gemini-api/docs/images/woman_with_logo.png)Take the first image of the woman with brown hair, blue eyes, and a neutral expression... |

#### 6. Bring something to life

Upload a rough sketch or drawing and ask the model to refine it into a finished image.

### Template

    Turn this rough [medium] sketch of a [subject] into a [style description]
    photo. Keep the [specific features] from the sketch but add [new details/materials].

### Prompt

    "Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting."

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/car_sketch.png";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
        { text: "Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting." },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
      });
      for (const part of response.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("car_photo.png", buffer);
          console.log("Image saved as car_photo.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/car_sketch.png

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/png\",
                    \"data\": \"$IMG_BASE64\"
                  }
                },
                {\"text\": \"Turn this rough pencil sketch of a futuristic car into a polished photo of the finished concept car in a showroom. Keep the sleek lines and low profile from the sketch but add metallic blue paint and neon rim lighting.\"}
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > car_photo.png

|-------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Input                                                                                                       | Output                                                                                                                            |
| ![Sketch of a car](https://ai.google.dev/static/gemini-api/docs/images/car-sketch.jpg)Rough sketch of a car | ![Output showing the final concept car](https://ai.google.dev/static/gemini-api/docs/images/car-photo.jpg)Polished photo of a car |

#### 7. Character consistency: 360 view

You can generate 360-degree views of a character by iteratively prompting for different angles. For best results, include previously generated images in subsequent prompts to maintain consistency. For complex poses, include a reference image of the desired pose.

### Template

    A studio portrait of [person] against [background], [looking forward/in profile looking right/etc.]

### Prompt

    A studio portrait of this man against white, in profile looking right

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    import * as fs from "node:fs";

    async function main() {

      const ai = new GoogleGenAI({});

      const imagePath = "/path/to/your/man_in_white_glasses.jpg";
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString("base64");

      const prompt = [
        { text: "A studio portrait of this man against white, in profile looking right" },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
      });
      for (const part of response.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          fs.writeFileSync("man_right_profile.png", buffer);
          console.log("Image saved as man_right_profile.png");
        }
      }
    }

    main();

### REST

    IMG_PATH=/path/to/your/man_in_white_glasses.jpg

    if [[ "$(base64 --version 2>&1)" = *"FreeBSD"* ]]; then
      B64FLAGS="--input"
    else
      B64FLAGS="-w0"
    fi

    IMG_BASE64=$(base64 "$B64FLAGS" "$IMG_PATH" 2>&1)

    curl -X POST \
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent" \
        -H "x-goog-api-key: $GEMINI_API_KEY" \
        -H 'Content-Type: application/json' \
        -d "{
          \"contents\": [{
            \"parts\":[
                {\"text\": \"A studio portrait of this man against white, in profile looking right\"},
                {
                  \"inline_data\": {
                    \"mime_type\":\"image/jpeg\",
                    \"data\": \"$IMG_BASE64\"
                  }
                }
            ]
          }]
        }"  \
      | grep -o '"data": "[^"]*"' \
      | cut -d'"' -f4 \
      | base64 --decode > man_right_profile.png

|-----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Input                                                                                                                                   | Output 1                                                                                                                                                                        | Output 2                                                                                                                                                                              |
| ![Original input of a man in white glasses](https://ai.google.dev/static/gemini-api/docs/images/man_in_white_glasses.jpg)Original image | ![Output of a man in white glasses looking right](https://ai.google.dev/static/gemini-api/docs/images/man_in_white_glasses_looking_right.jpg)Man in white glasses looking right | ![Output of a man in white glasses looking forward](https://ai.google.dev/static/gemini-api/docs/images/man_in_white_glasses_looking_forward.jpg)Man in white glasses looking forward |

### Best Practices

To elevate your results from good to great, incorporate these professional strategies into your workflow.

- **Be Hyper-Specific:**The more detail you provide, the more control you have. Instead of "fantasy armor," describe it: "ornate elven plate armor, etched with silver leaf patterns, with a high collar and pauldrons shaped like falcon wings."
- **Provide Context and Intent:** Explain the*purpose*of the image. The model's understanding of context will influence the final output. For example, "Create a logo for a high-end, minimalist skincare brand" will yield better results than just "Create a logo."
- **Iterate and Refine:**Don't expect a perfect image on the first try. Use the conversational nature of the model to make small changes. Follow up with prompts like, "That's great, but can you make the lighting a bit warmer?" or "Keep everything the same, but change the character's expression to be more serious."
- **Use Step-by-Step Instructions:**For complex scenes with many elements, break your prompt into steps. "First, create a background of a serene, misty forest at dawn. Then, in the foreground, add a moss-covered ancient stone altar. Finally, place a single, glowing sword on top of the altar."
- **Use "Semantic Negative Prompts":**Instead of saying "no cars," describe the desired scene positively: "an empty, deserted street with no signs of traffic."
- **Control the Camera:** Use photographic and cinematic language to control the composition. Terms like`wide-angle shot`,`macro shot`,`low-angle
  perspective`.

## Limitations

- For best performance, use the following languages: EN, ar-EG, de-DE, es-MX, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, pt-BR, ru-RU, ua-UA, vi-VN, zh-CN.
- Image generation does not support audio or video inputs.
- The model won't always follow the exact number of image outputs that the user explicitly asks for.
- `gemini-2.5-flash-image`works best with up to 3 images as input, while`gemini-3-pro-image-preview`supports 5 images with high fidelity, and up to 14 images in total.
- When generating text for an image, Gemini works best if you first generate the text and then ask for an image with the text.
- All generated images include a[SynthID watermark](https://ai.google.dev/responsible/docs/safeguards/synthid).

## Optional configurations

You can optionally configure the response modalities and aspect ratio of the model's output in the`config`field of`generate_content`calls.

### Output types

The model defaults to returning text and image responses (i.e.`response_modalities=['Text', 'Image']`). You can configure the response to return only images without text using`response_modalities=['Image']`.

### JavaScript

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
            responseModalities: ['Image']
        }
      });

### REST

    -d '{
      "contents": [{
        "parts": [
          {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
        ]
      }],
      "generationConfig": {
        "responseModalities": ["Image"]
      }
    }' \

### Aspect ratios and image size

The model defaults to matching the output image size to that of your input image, or otherwise generates 1:1 squares. You can control the aspect ratio of the output image using the`aspect_ratio`field under`image_config`in the response request, shown here:

### JavaScript

    // For gemini-2.5-flash-image
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        }
      });

    // For gemini-3-pro-image-preview
    const response_gemini3 = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: prompt,
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K",
          },
        }
      });

### REST

    # For gemini-2.5-flash-image
    -d '{
      "contents": [{
        "parts": [
          {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
        ]
      }],
      "generationConfig": {
        "imageConfig": {
          "aspectRatio": "16:9"
        }
      }
    }' \

    # For gemini-3-pro-image-preview
    -d '{
      "contents": [{
        "parts": [
          {"text": "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme"}
        ]
      }],
      "generationConfig": {
        "imageConfig": {
          "aspectRatio": "16:9",
          "imageSize": "2K"
        }
      }
    }' \

The different ratios available and the size of the image generated are listed in the following tables:

**Gemini 2.5 Flash Image**

| Aspect ratio | Resolution | Tokens |
|--------------|------------|--------|
| 1:1          | 1024x1024  | 1290   |
| 2:3          | 832x1248   | 1290   |
| 3:2          | 1248x832   | 1290   |
| 3:4          | 864x1184   | 1290   |
| 4:3          | 1184x864   | 1290   |
| 4:5          | 896x1152   | 1290   |
| 5:4          | 1152x896   | 1290   |
| 9:16         | 768x1344   | 1290   |
| 16:9         | 1344x768   | 1290   |
| 21:9         | 1536x672   | 1290   |

**Gemini 3 Pro Image Preview**

| Aspect ratio | 1K resolution | 1K Tokens | 2K resolution | 2K Tokens | 4K resolution | 4K Tokens |
|--------------|---------------|-----------|---------------|-----------|---------------|-----------|
| **1:1**      | 1024x1024     | 1210      | 2048x2048     | 1210      | 4096x4096     | 2000      |
| **2:3**      | 848x1264      | 1210      | 1696x2528     | 1210      | 3392x5056     | 2000      |
| **3:2**      | 1264x848      | 1210      | 2528x1696     | 1210      | 5056x3392     | 2000      |
| **3:4**      | 896x1200      | 1210      | 1792x2400     | 1210      | 3584x4800     | 2000      |
| **4:3**      | 1200x896      | 1210      | 2400x1792     | 1210      | 4800x3584     | 2000      |
| **4:5**      | 928x1152      | 1210      | 1856x2304     | 1210      | 3712x4608     | 2000      |
| **5:4**      | 1152x928      | 1210      | 2304x1856     | 1210      | 4608x3712     | 2000      |
| **9:16**     | 768x1376      | 1210      | 1536x2752     | 1210      | 3072x5504     | 2000      |
| **16:9**     | 1376x768      | 1210      | 2752x1536     | 1210      | 5504x3072     | 2000      |
| **21:9**     | 1584x672      | 1210      | 3168x1344     | 1210      | 6336x2688     | 2000      |

## Model selection

Choose the model best suited for your specific use case.

- **Gemini 3 Pro Image Preview (Nano Banana Pro Preview)**is designed for professional asset production and complex instructions. This model features real-world grounding using Google Search, a default "Thinking" process that refines composition prior to generation, and can generate images of up to 4K resolutions.

- **Gemini 2.5 Flash Image (Nano Banana)**is designed for speed and efficiency. This model is optimized for high-volume, low-latency tasks and generates images at 1024px resolution.

### When to use Imagen

In addition to using Gemini's built-in image generation capabilities, you can also access[Imagen](https://ai.google.dev/gemini-api/docs/imagen), our specialized image generation model, through the Gemini API.

|     Attribute     |                                                                                                                 Imagen                                                                                                                 |                                                                                                                                                                                               Gemini Native Image                                                                                                                                                                                                |
|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Strengths         | Model specializes in image generation.                                                                                                                                                                                                 | **Default recommendation.** Unparalleled flexibility, contextual understanding, and simple, mask-free editing. Uniquely capable of multi-turn conversational editing.                                                                                                                                                                                                                                            |
| Availability      | Generally available                                                                                                                                                                                                                    | Preview (Production usage allowed)                                                                                                                                                                                                                                                                                                                                                                               |
| Latency           | **Low**. Optimized for near-real-time performance.                                                                                                                                                                                     | Higher. More computation is required for its advanced capabilities.                                                                                                                                                                                                                                                                                                                                              |
| Cost              | Cost-effective for specialized tasks. $0.02/image to $0.12/image                                                                                                                                                                       | Token-based pricing. $30 per 1 million tokens for image output (image output tokenized at 1290 tokens per image flat, up to 1024x1024px)                                                                                                                                                                                                                                                                         |
| Recommended tasks | - Image quality, photorealism, artistic detail, or specific styles (e.g., impressionism, anime) are top priorities. - Infusing branding, style, or generating logos and product designs. - Generating advanced spelling or typography. | - Interleaved text and image generation to seamlessly blend text and images. - Combine creative elements from multiple images with a single prompt. - Make highly specific edits to images, modify individual elements with simple language commands, and iteratively work on an image. - Apply a specific design or texture from one image to another while preserving the original subject's form and details. |

Imagen 4 should be your go-to model when starting to generate images with Imagen. Choose Imagen 4 Ultra for advanced use-cases or when you need the best image quality (note that can only generate one image at a time).

## What's next

- Find more examples and code samples in the[cookbook guide](https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_Started_Nano_Banana.ipynb).
- Check out the[Veo guide](https://ai.google.dev/gemini-api/docs/video)to learn how to generate videos with the Gemini API.
- To learn more about Gemini models, see[Gemini models](https://ai.google.dev/gemini-api/docs/models/gemini).
