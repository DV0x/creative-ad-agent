import { GoogleGenAI } from '@google/genai';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * nano_banana MCP Server - Simplified Synchronous Pattern
 *
 * This MCP server provides AI-powered image generation for ad creatives using
 * Google's Gemini 2.5 Flash Image model (codenamed "nano banana").
 *
 * Architecture: Simple Synchronous Generation
 * - Generates up to 3 images per call
 * - Returns complete results through MCP stream
 * - No job queue, no HTTP polling - just simple and reliable
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
  version: "3.0.0",
  tools: [
    tool(
      "generate_ad_images",
      "Generate up to 3 images synchronously using Gemini 2.5 Flash Image. For larger batches, call this tool multiple times. Returns complete image URLs and metadata.",
      {
        prompts: z.array(z.string()).max(3).describe(
          "Array of 1-3 image generation prompts. Each prompt should be descriptive and detailed. " +
          "Example: 'A professional business person working confidently on a laptop in a modern office, warm lighting, photorealistic style'"
        ),
        style: z.string().optional().describe(
          "Visual style to apply across all images. " +
          "Examples: 'modern minimal', 'photorealistic', 'vibrant and energetic', 'professional corporate', 'warm and friendly'"
        ),
        dimensions: z.string().optional().describe(
          "Target image dimensions for the platform. " +
          "Examples: '1080x1080' (Instagram square), '1080x1350' (Instagram portrait), '1200x628' (Facebook feed)"
        ),
        sessionId: z.string().optional().describe(
          "Optional session ID for organizing images into folders. Images will be saved to generated-images/{sessionId}/"
        )
      },
      async (args) => {
        const toolStartTime = Date.now();
        console.log(`🎨 [${new Date().toISOString()}] Starting synchronous image generation`);
        console.log(`   Prompts: ${args.prompts.length}`);
        console.log(`   Style: ${args.style || 'default'}`);
        console.log(`   Dimensions: ${args.dimensions || 'default'}`);

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

            // Enhance prompt with style and dimensions
            let enhancedPrompt = prompt;
            if (args.style) {
              enhancedPrompt = `${prompt}. Style: ${args.style}.`;
            }
            if (args.dimensions) {
              enhancedPrompt = `${enhancedPrompt} Image dimensions: ${args.dimensions}.`;
            }

            console.log(`🖼️  [${new Date().toISOString()}] Generating image ${i + 1}/${args.prompts.length}...`);
            console.log(`   Prompt: ${enhancedPrompt.substring(0, 100)}...`);

            try {
              const apiCallStart = Date.now();
              const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-image-preview",
                contents: enhancedPrompt
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
                    dimensions: args.dimensions || "default",
                    style: args.style || "default"
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

console.log('✅ nano_banana MCP server created (v3.0.0 - Simple Synchronous)');
