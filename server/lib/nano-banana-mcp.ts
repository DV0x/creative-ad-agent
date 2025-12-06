import { GoogleGenAI } from '@google/genai';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * nano_banana MCP Server - Gemini 3 Pro Image Preview
 *
 * This MCP server provides AI-powered image generation for ad creatives using
 * Google's Gemini 3 Pro Image Preview model (codenamed "nano banana pro").
 *
 * Features:
 * - High resolution outputs: 1K, 2K (default), or 4K
 * - Multiple aspect ratios for different platforms
 * - Google Search grounding for real-time data (weather, news, events)
 * - Reference image support (up to 14 images for style/subject consistency)
 * - Thinking mode for complex compositions (enabled by default)
 *
 * Architecture: Simple Synchronous Generation
 * - Generates up to 3 images per call
 * - Returns complete results through MCP stream
 *
 * For larger batches (10+ images), the agent will automatically make multiple calls.
 */

/**
 * Sanitize filename to remove unsafe characters
 */
function sanitizeFilename(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

/**
 * Ensure output directory exists
 */
function ensureOutputDirectory(sessionId?: string): string {
  const serverDir = path.resolve(__dirname, '..');
  const projectRoot = path.resolve(serverDir, '..');
  const baseDir = path.join(projectRoot, 'generated-images');

  const outputDir = sessionId
    ? path.join(baseDir, sessionId)
    : baseDir;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created image directory: ${outputDir}`);
  }

  return outputDir;
}

/**
 * Create and export the simple nano_banana MCP server
 */
export const nanoBananaMcpServer = createSdkMcpServer({
  name: "nano-banana",
  version: "4.0.0",
  tools: [
    tool(
      "generate_ad_images",
      "Generate up to 3 high-quality images using Gemini 3 Pro Image Preview. " +
      "Supports 1K/2K/4K resolution (default 2K), multiple aspect ratios, " +
      "Google Search grounding for real-time data, and up to 14 reference images for style/subject consistency.",
      {
        prompts: z.array(z.string()).max(3).describe(
          "Array of 1-3 image generation prompts. Each prompt should be descriptive and detailed. " +
          "Example: 'A professional business person working confidently on a laptop in a modern office, warm lighting, photorealistic style'"
        ),
        style: z.string().optional().describe(
          "Visual style to apply across all images. " +
          "Examples: 'modern minimal', 'photorealistic', 'vibrant and energetic', 'professional corporate', 'warm and friendly'"
        ),
        aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'])
          .optional()
          .describe("Aspect ratio for generated images. Default: '1:1'. Use '9:16' for stories, '16:9' for landscape, '1:1' for square posts."),
        imageSize: z.enum(['1K', '2K', '4K'])
          .optional()
          .describe("Output resolution. Default: '2K'. Options: '1K' (fastest), '2K' (balanced), '4K' (highest quality). Must use uppercase K."),
        useGoogleSearch: z.boolean()
          .optional()
          .describe("Enable Google Search grounding for real-time data (weather, news, sports scores, events). Default: false"),
        referenceImages: z.array(z.object({
          data: z.string().describe("Base64 encoded image data"),
          mimeType: z.string().describe("MIME type (e.g., 'image/png', 'image/jpeg')")
        }))
          .max(14)
          .optional()
          .describe("Up to 14 reference images for style transfer or character consistency. Include images of subjects, styles, or objects to maintain across generations."),
        sessionId: z.string().optional().describe(
          "Optional session ID for organizing images into folders. Images will be saved to generated-images/{sessionId}/"
        )
      },
      async (args) => {
        const toolStartTime = Date.now();
        console.log(`🎨 [${new Date().toISOString()}] Starting Gemini 3 Pro image generation`);
        console.log(`   Prompts: ${args.prompts.length}`);
        console.log(`   Style: ${args.style || 'default'}`);
        console.log(`   Resolution: ${args.imageSize || '2K'}`);
        console.log(`   Aspect Ratio: ${args.aspectRatio || '1:1'}`);
        console.log(`   Google Search: ${args.useGoogleSearch ? 'enabled' : 'disabled'}`);
        console.log(`   Reference Images: ${args.referenceImages?.length || 0}`);

        // Check API key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error('❌ GEMINI_API_KEY not found');
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: 'GEMINI_API_KEY environment variable is not set',
                message: 'Please configure GEMINI_API_KEY in your .env file'
              }, null, 2)
            }]
          };
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          const outputDir = ensureOutputDirectory(args.sessionId);
          const timestamp = Date.now();
          const results = [];

          // Generate images synchronously
          for (let i = 0; i < args.prompts.length; i++) {
            const prompt = args.prompts[i];

            // Enhance prompt with style
            let enhancedPrompt = prompt;
            if (args.style) {
              enhancedPrompt = `${prompt}. Style: ${args.style}.`;
            }

            console.log(`🖼️  [${new Date().toISOString()}] Generating image ${i + 1}/${args.prompts.length}...`);
            console.log(`   Prompt: ${enhancedPrompt.substring(0, 100)}...`);

            try {
              const apiCallStart = Date.now();

              // Build contents array (text prompt + optional reference images)
              const contents: any[] = [{ text: enhancedPrompt }];

              // Add reference images if provided (only on first image to avoid duplication)
              if (i === 0 && args.referenceImages && args.referenceImages.length > 0) {
                for (const refImg of args.referenceImages) {
                  contents.push({
                    inlineData: {
                      mimeType: refImg.mimeType,
                      data: refImg.data,
                    },
                  });
                }
                console.log(`   📎 Including ${args.referenceImages.length} reference image(s)`);
              }

              // Build config for Gemini 3 Pro Image Preview
              const config: any = {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                  aspectRatio: args.aspectRatio || '1:1',
                  imageSize: args.imageSize || '2K',
                },
              };

              // Add Google Search grounding if enabled
              if (args.useGoogleSearch) {
                config.tools = [{ googleSearch: {} }];
              }

              const response = await ai.models.generateContent({
                model: "gemini-3-pro-image-preview",
                contents: contents,
                config: config,
              });
              const apiCallDuration = Date.now() - apiCallStart;

              console.log(`✅ [${new Date().toISOString()}] API response received for image ${i + 1} (took ${apiCallDuration}ms)`);

              // Extract image data
              if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No candidates in response');
              }

              const candidate = response.candidates[0];
              if (!candidate?.content?.parts) {
                throw new Error('Invalid response structure');
              }

              const parts = candidate.content.parts;

              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  const base64Data = part.inlineData.data;
                  const mimeType = part.inlineData.mimeType || "image/png";

                  // Convert base64 to buffer
                  const buffer = Buffer.from(base64Data, 'base64');

                  // Generate filename
                  const sanitizedPrompt = sanitizeFilename(prompt);
                  const filename = `${timestamp}_${i + 1}_${sanitizedPrompt}.png`;
                  const filepath = path.join(outputDir, filename);

                  // Save PNG file
                  fs.writeFileSync(filepath, buffer);
                  console.log(`   💾 Saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`);

                  // Construct URL
                  const url = `http://localhost:${process.env.PORT || 3001}/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;

                  results.push({
                    id: `image_${i + 1}`,
                    filename: filename,
                    url: url,
                    prompt: prompt,
                    enhancedPrompt: enhancedPrompt,
                    mimeType: mimeType,
                    sizeKB: Math.round(buffer.length / 1024),
                    aspectRatio: args.aspectRatio || '1:1',
                    resolution: args.imageSize || '2K',
                    style: args.style || "default",
                    googleSearchEnabled: args.useGoogleSearch || false,
                    referenceImagesUsed: args.referenceImages?.length || 0,
                  });

                  console.log(`   ✅ Image ${i + 1} complete`);
                }
              }
            } catch (imageError: any) {
              console.error(`   ❌ Failed to generate image ${i + 1}:`, imageError.message);
              // Continue with next image instead of failing entire batch
              results.push({
                id: `image_${i + 1}`,
                error: imageError.message,
                prompt: prompt
              });
            }

            // Rate limit between requests (except for last image)
            if (i < args.prompts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          const successCount = results.filter(r => !r.error).length;
          const toolDuration = Date.now() - toolStartTime;
          console.log(`✅ [${new Date().toISOString()}] Generation complete: ${successCount}/${args.prompts.length} images successful (total tool duration: ${toolDuration}ms)`);

          const result = {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully generated ${successCount} of ${args.prompts.length} images`,
                totalRequested: args.prompts.length,
                totalGenerated: successCount,
                images: results,
                note: successCount < args.prompts.length
                  ? 'Some images failed to generate. Check error messages in results.'
                  : 'All images generated successfully!'
              }, null, 2)
            }]
          };

          console.log(`📤 [${new Date().toISOString()}] Returning result to SDK (tool execution: ${toolDuration}ms)`);
          return result;

        } catch (error: any) {
          console.error('❌ Image generation failed:', error.message);
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Image generation failed. Check server logs for details.'
              }, null, 2)
            }]
          };
        }
      }
    )
  ]
});

console.log('✅ nano_banana MCP server created (v4.0.0 - Gemini 3 Pro Image Preview)');
