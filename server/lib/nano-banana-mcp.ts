import { fal } from '@fal-ai/client';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { imageEvents } from './image-events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * nano_banana MCP Server - fal.ai Nano Banana Pro
 *
 * This MCP server provides AI-powered image generation for ad creatives using
 * fal.ai's Nano Banana Pro model (Google's Gemini image model via fal.ai).
 *
 * Features:
 * - Text-to-image generation with high resolution (1K, 2K, 4K)
 * - Auto-routing: uses edit endpoint when reference images provided
 * - Multiple aspect ratios for different platforms
 * - Web search grounding for real-time data
 * - Up to 6 images per call
 *
 * Tool:
 * - generate_ad_images: Unified generation (text-to-image + reference images)
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
 * Download image from URL and save to file
 */
async function downloadImage(url: string, filepath: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filepath, buffer);
  return buffer.length;
}

/**
 * Configure fal.ai client with API key
 */
function configureFalClient(): boolean {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    console.error('❌ FAL_KEY not found');
    return false;
  }
  fal.config({ credentials: apiKey });
  return true;
}

// Aspect ratio options supported by fal.ai
const aspectRatioEnum = z.enum([
  '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'
]);

// Resolution options
const resolutionEnum = z.enum(['1K', '2K', '4K']);

// Output format options
const outputFormatEnum = z.enum(['jpeg', 'png', 'webp']);

// Hook types for ad concepts (matches client types)
type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';
const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

/**
 * Create and export the nano_banana MCP server with fal.ai
 */
export const nanoBananaMcpServer = createSdkMcpServer({
  name: "nano-banana",
  version: "5.1.0",
  tools: [
    // Tool 1: Text-to-Image Generation (with optional reference images)
    tool(
      "generate_ad_images",
      "Generate high-quality images using fal.ai Nano Banana Pro. " +
      "Supports 1K/2K/4K resolution, multiple aspect ratios, web search grounding, and optional reference images. " +
      "When reference images are provided, automatically uses image editing mode for style/subject consistency. " +
      "Pass `targetImageIndices` when iterating on existing image slots; omit when generating fresh.",
      {
        prompts: z.array(z.string()).min(1).describe(
          "Array of image generation prompts (one per image). Each prompt should be descriptive and detailed."
        ),
        hookTypes: z.array(z.string()).optional().describe(
          "Per-image hook label (parallel array to `prompts`, same length). Prefer canonical names " +
          "(stat, story, fomo, curiosity, callout, contrast) or invent brand-specific names when none fit."
        ),
        targetImageIndices: z.array(z.number().int().positive()).optional().describe(
          "When iterating on existing images, pass the 1-based slot indices to replace. Must match prompts.length. " +
          "Bumps version on the targeted slot instead of allocating a new slot."
        ),
        style: z.string().optional().describe(
          "Visual style to apply across all images. Appended to each prompt. " +
          "Examples: 'modern minimal', 'photorealistic', 'vibrant and energetic', 'professional corporate', 'warm and friendly'"
        ),
        referenceImageUrls: z.array(z.string().url()).max(14).optional().describe(
          "Optional reference image URLs for style transfer or subject consistency. " +
          "When provided, automatically uses the edit endpoint instead of text-to-image. " +
          "Supports up to 14 reference images. Can be URLs from previous generations or external URLs."
        ),
        aspectRatio: aspectRatioEnum
          .optional()
          .describe("Aspect ratio for generated images. Default: '1:1'. Use '9:16' for stories, '16:9' for landscape, '1:1' for square posts."),
        resolution: resolutionEnum
          .optional()
          .describe("Output resolution. Default: '1K'. Options: '1K' (fastest), '2K' (balanced), '4K' (highest quality)."),
        outputFormat: outputFormatEnum
          .optional()
          .describe("Output image format. Default: 'png'. Options: 'jpeg', 'png', 'webp'."),
        enableWebSearch: z.boolean()
          .optional()
          .describe("Enable web search grounding for real-time data (weather, news, sports, events). Default: false"),
        sessionId: z.string().optional().describe(
          "Optional session ID for organizing images into folders. Images will be saved to generated-images/{sessionId}/"
        )
      },
      async (args) => {
        const toolStartTime = Date.now();
        const hasReferenceImages = args.referenceImageUrls && args.referenceImageUrls.length > 0;
        const mode = hasReferenceImages ? 'edit (with references)' : 'text-to-image';

        if (args.targetImageIndices && args.targetImageIndices.length !== args.prompts.length) {
          return { content: [{ type: 'text' as const, text: JSON.stringify({
            success: false,
            error: `targetImageIndices.length (${args.targetImageIndices.length}) must equal prompts.length (${args.prompts.length})`,
          }) }] };
        }
        if (args.hookTypes && args.hookTypes.length !== args.prompts.length) {
          return { content: [{ type: 'text' as const, text: JSON.stringify({
            success: false,
            error: `hookTypes.length (${args.hookTypes.length}) must equal prompts.length (${args.prompts.length})`,
          }) }] };
        }

        console.log(`🎨 [${new Date().toISOString()}] Starting fal.ai Nano Banana Pro image generation`);
        console.log(`   Mode: ${mode}`);
        console.log(`   Prompts: ${args.prompts.length}`);
        console.log(`   targetImageIndices: ${args.targetImageIndices?.join(',') || 'none (fresh slots)'}`);
        console.log(`   hookTypes: ${args.hookTypes?.join(',') || 'none (positional fallback)'}`);
        console.log(`   Style: ${args.style || 'default'}`);
        console.log(`   Resolution: ${args.resolution || '1K'}`);
        console.log(`   Aspect Ratio: ${args.aspectRatio || '1:1'}`);
        console.log(`   Web Search: ${args.enableWebSearch ? 'enabled' : 'disabled'}`);
        if (hasReferenceImages) {
          console.log(`   Reference Images: ${args.referenceImageUrls!.length}`);
        }

        // Configure fal.ai client
        if (!configureFalClient()) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: 'FAL_KEY environment variable is not set',
                message: 'Please configure FAL_KEY in your .env file'
              }, null, 2)
            }]
          };
        }

        try {
          const outputDir = ensureOutputDirectory(args.sessionId);
          const timestamp = Date.now();
          const results: any[] = [];

          // Process prompts one at a time
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
              let result;

              if (hasReferenceImages) {
                // Use edit endpoint when reference images are provided
                result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
                  input: {
                    prompt: enhancedPrompt,
                    image_urls: args.referenceImageUrls!,
                    num_images: 1,
                    aspect_ratio: args.aspectRatio || '1:1',
                    resolution: args.resolution || '1K',
                    output_format: args.outputFormat || 'png',
                    enable_web_search: args.enableWebSearch || false,
                  },
                  logs: true,
                  onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS" && update.logs) {
                      update.logs.map((log) => log.message).forEach((msg) => {
                        console.log(`   📝 ${msg}`);
                      });
                    }
                  },
                });
              } else {
                // Use text-to-image endpoint
                result = await fal.subscribe("fal-ai/nano-banana-pro", {
                  input: {
                    prompt: enhancedPrompt,
                    num_images: 1,
                    aspect_ratio: args.aspectRatio || '1:1',
                    resolution: args.resolution || '1K',
                    output_format: args.outputFormat || 'png',
                    enable_web_search: args.enableWebSearch || false,
                  },
                  logs: true,
                  onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS" && update.logs) {
                      update.logs.map((log) => log.message).forEach((msg) => {
                        console.log(`   📝 ${msg}`);
                      });
                    }
                  },
                });
              }

              const apiCallDuration = Date.now() - apiCallStart;
              console.log(`✅ [${new Date().toISOString()}] API response received for image ${i + 1} (took ${apiCallDuration}ms)`);

              // Extract image from response
              const data = result.data as { images: Array<{ url: string; file_name: string; content_type: string }>; description?: string };

              if (!data.images || data.images.length === 0) {
                throw new Error('No images in response');
              }

              const image = data.images[0];
              const ext = args.outputFormat || 'png';
              const sanitizedPrompt = sanitizeFilename(prompt);
              const filename = `${timestamp}_${i + 1}_${sanitizedPrompt}.${ext}`;
              const filepath = path.join(outputDir, filename);

              // Download and save image
              const fileSize = await downloadImage(image.url, filepath);
              console.log(`   💾 Saved: ${filename} (${Math.round(fileSize / 1024)}KB)`);

              // Construct relative URL (works with Vite proxy in dev, and directly in production)
              const url = `/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;

              const imageIndex = i + 1;
              const targetImageIndex = args.targetImageIndices?.[i] ?? imageIndex;
              const agentHookType = args.hookTypes?.[i];
              const hookType = agentHookType ?? getHookTypeForIndex(targetImageIndex);

              results.push({
                id: `image_${imageIndex}`,
                imageIndex,
                targetImageIndex,
                hookType,
                filename: filename,
                url: url,
                originalUrl: image.url,
                prompt: prompt,
                enhancedPrompt: enhancedPrompt,
                mimeType: image.content_type || `image/${ext}`,
                sizeKB: Math.round(fileSize / 1024),
                aspectRatio: args.aspectRatio || '1:1',
                resolution: args.resolution || '2K',
                style: args.style || "default",
                webSearchEnabled: args.enableWebSearch || false,
                referenceImagesUsed: hasReferenceImages ? args.referenceImageUrls!.length : 0,
                mode: mode,
                description: data.description || '',
              });

              // Emit real-time notification for immediate DB persistence + WS broadcast
              if (args.sessionId) {
                imageEvents.emit('image-saved', {
                  sessionId: args.sessionId,
                  imageIndex,
                  targetImageIndex,
                  hookType,
                  prompt: prompt,
                  filename: filename,
                  urlPath: url,
                  id: `image_${imageIndex}`,
                });
              }

              console.log(`   ✅ Image ${i + 1} complete`);

            } catch (imageError: any) {
              console.error(`   ❌ Failed to generate image ${i + 1}:`, imageError.message);
              results.push({
                id: `image_${i + 1}`,
                error: imageError.message,
                prompt: prompt
              });
            }

            // Small delay between requests to avoid rate limiting
            if (i < args.prompts.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }

          const successCount = results.filter(r => !r.error).length;
          const toolDuration = Date.now() - toolStartTime;
          console.log(`✅ [${new Date().toISOString()}] Generation complete: ${successCount}/${args.prompts.length} images successful (total: ${toolDuration}ms)`);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                message: `Successfully generated ${successCount} of ${args.prompts.length} images`,
                mode: mode,
                totalRequested: args.prompts.length,
                totalGenerated: successCount,
                referenceImagesUsed: hasReferenceImages ? args.referenceImageUrls!.length : 0,
                images: results,
                note: successCount < args.prompts.length
                  ? 'Some images failed to generate. Check error messages in results.'
                  : 'All images generated successfully!'
              }, null, 2)
            }]
          };

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

console.log('✅ nano_banana MCP server created (v5.1.0 - fal.ai Nano Banana Pro with auto-routing)');
