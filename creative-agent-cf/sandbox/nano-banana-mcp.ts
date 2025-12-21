/**
 * nano_banana MCP Server - fal.ai Nano Banana Pro
 *
 * Adapted for Cloudflare Sandbox with R2 storage mounted at /storage/
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
 * - Images saved to R2 via mounted /storage/images/ path
 */

import { fal } from '@fal-ai/client';
import * as fs from 'fs';
import * as path from 'path';

// R2 mount point in Cloudflare Sandbox
const STORAGE_BASE = '/storage';
const IMAGES_DIR = `${STORAGE_BASE}/images`;

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
 * Ensure output directory exists in R2-mounted storage
 */
function ensureOutputDirectory(sessionId?: string): string {
  const outputDir = sessionId
    ? path.join(IMAGES_DIR, sessionId)
    : IMAGES_DIR;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created image directory: ${outputDir}`);
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
    console.error('FAL_KEY not found');
    return false;
  }
  fal.config({ credentials: apiKey });
  return true;
}

// Type definitions for tool arguments
interface GenerateAdImagesArgs {
  prompts: string[];
  style?: string;
  referenceImageUrls?: string[];
  aspectRatio?: '21:9' | '16:9' | '3:2' | '4:3' | '5:4' | '1:1' | '4:5' | '3:4' | '2:3' | '9:16';
  resolution?: '1K' | '2K' | '4K';
  outputFormat?: 'jpeg' | 'png' | 'webp';
  enableWebSearch?: boolean;
  sessionId?: string;
}

/**
 * Generate ad images using fal.ai Nano Banana Pro
 */
export async function generateAdImages(args: GenerateAdImagesArgs): Promise<{
  content: Array<{ type: string; text: string }>
}> {
  const toolStartTime = Date.now();
  const hasReferenceImages = args.referenceImageUrls && args.referenceImageUrls.length > 0;
  const mode = hasReferenceImages ? 'edit (with references)' : 'text-to-image';

  console.log(`[${new Date().toISOString()}] Starting fal.ai Nano Banana Pro image generation`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Prompts: ${args.prompts.length}`);
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
          message: 'Please configure FAL_KEY as a Cloudflare secret'
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

      console.log(`[${new Date().toISOString()}] Generating image ${i + 1}/${args.prompts.length}...`);
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
                  console.log(`   ${msg}`);
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
                  console.log(`   ${msg}`);
                });
              }
            },
          });
        }

        const apiCallDuration = Date.now() - apiCallStart;
        console.log(`[${new Date().toISOString()}] API response received for image ${i + 1} (took ${apiCallDuration}ms)`);

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

        // Download and save image to R2-mounted storage
        const fileSize = await downloadImage(image.url, filepath);
        console.log(`   Saved: ${filename} (${Math.round(fileSize / 1024)}KB)`);

        // Construct URL path (Worker will serve from R2)
        const urlPath = `/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;

        results.push({
          id: `image_${i + 1}`,
          filename: filename,
          path: filepath,
          urlPath: urlPath,
          originalUrl: image.url,
          prompt: prompt,
          enhancedPrompt: enhancedPrompt,
          mimeType: image.content_type || `image/${ext}`,
          sizeKB: Math.round(fileSize / 1024),
          aspectRatio: args.aspectRatio || '1:1',
          resolution: args.resolution || '1K',
          style: args.style || "default",
          webSearchEnabled: args.enableWebSearch || false,
          referenceImagesUsed: hasReferenceImages ? args.referenceImageUrls!.length : 0,
          mode: mode,
          description: data.description || '',
        });

        console.log(`   Image ${i + 1} complete`);

      } catch (imageError: any) {
        console.error(`Failed to generate image ${i + 1}:`, imageError.message);
        // Continue with next image instead of failing entire batch
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
    console.log(`[${new Date().toISOString()}] Generation complete: ${successCount}/${args.prompts.length} images (${toolDuration}ms)`);

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
          storageLocation: outputDir,
          note: successCount < args.prompts.length
            ? 'Some images failed to generate. Check error messages in results.'
            : 'All images generated successfully!'
        }, null, 2)
      }]
    };

  } catch (error: any) {
    console.error('Image generation failed:', error.message);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: error.message,
          message: 'Image generation failed. Check logs for details.'
        }, null, 2)
      }]
    };
  }
}

console.log('nano_banana MCP module loaded (v5.1.0 - fal.ai Nano Banana Pro with auto-routing for Cloudflare Sandbox)');
