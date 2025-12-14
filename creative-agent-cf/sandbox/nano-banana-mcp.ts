/**
 * nano_banana MCP Server - Gemini 3 Pro Image Preview
 *
 * Adapted for Cloudflare Sandbox with R2 storage mounted at /storage/
 *
 * This MCP server provides AI-powered image generation for ad creatives using
 * Google's Gemini 3 Pro Image Preview model.
 *
 * Features:
 * - High resolution outputs: 1K, 2K (default), or 4K
 * - Multiple aspect ratios for different platforms
 * - Images saved to R2 via mounted /storage/images/ path
 */

import { GoogleGenAI } from '@google/genai';
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

interface GenerateAdImagesArgs {
  prompts: string[];
  style?: string;
  aspectRatio?: string;
  imageSize?: string;
  sessionId?: string;
}

/**
 * Generate ad images using Gemini 3 Pro Image Preview
 */
export async function generateAdImages(args: GenerateAdImagesArgs): Promise<{
  content: Array<{ type: string; text: string }>
}> {
  const toolStartTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting Gemini 3 Pro image generation`);
  console.log(`   Prompts: ${args.prompts.length}`);
  console.log(`   Style: ${args.style || 'default'}`);
  console.log(`   Resolution: ${args.imageSize || '2K'}`);
  console.log(`   Aspect Ratio: ${args.aspectRatio || '1:1'}`);

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found');
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not set',
          message: 'Please configure GEMINI_API_KEY as a Cloudflare secret'
        }, null, 2)
      }]
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const outputDir = ensureOutputDirectory(args.sessionId);
    const timestamp = Date.now();
    const results: any[] = [];

    // Generate images synchronously
    for (let i = 0; i < args.prompts.length; i++) {
      const prompt = args.prompts[i];

      // Enhance prompt with style
      let enhancedPrompt = prompt;
      if (args.style) {
        enhancedPrompt = `${prompt}. Style: ${args.style}.`;
      }

      console.log(`Generating image ${i + 1}/${args.prompts.length}...`);
      console.log(`   Prompt: ${enhancedPrompt.substring(0, 100)}...`);

      try {
        const apiCallStart = Date.now();

        // Build config for Gemini 3 Pro Image Preview
        const config: any = {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: args.aspectRatio || '1:1',
            imageSize: args.imageSize || '2K',
          },
        };

        const response = await ai.models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [{ text: enhancedPrompt }],
          config: config,
        });
        const apiCallDuration = Date.now() - apiCallStart;

        console.log(`API response received for image ${i + 1} (took ${apiCallDuration}ms)`);

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

            // Save PNG file to R2-mounted storage
            fs.writeFileSync(filepath, buffer);
            console.log(`   Saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`);

            // Construct URL path (Worker will serve from R2)
            const urlPath = `/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;

            results.push({
              id: `image_${i + 1}`,
              filename: filename,
              path: filepath,
              urlPath: urlPath,
              prompt: prompt,
              enhancedPrompt: enhancedPrompt,
              mimeType: mimeType,
              sizeKB: Math.round(buffer.length / 1024),
              aspectRatio: args.aspectRatio || '1:1',
              resolution: args.imageSize || '2K',
              style: args.style || "default",
            });

            console.log(`   Image ${i + 1} complete`);
          }
        }
      } catch (imageError: any) {
        console.error(`Failed to generate image ${i + 1}:`, imageError.message);
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
    console.log(`Generation complete: ${successCount}/${args.prompts.length} images (${toolDuration}ms)`);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          message: `Successfully generated ${successCount} of ${args.prompts.length} images`,
          totalRequested: args.prompts.length,
          totalGenerated: successCount,
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

console.log('nano_banana MCP module loaded (v4.0.0 - Cloudflare Sandbox)');
