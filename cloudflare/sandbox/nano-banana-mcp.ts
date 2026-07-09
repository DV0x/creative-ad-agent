import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * nano_banana MCP Server - KIE Nano Banana Pro (Sandbox port)
 *
 * This MCP server provides AI-powered image generation for ad creatives using
 * KIE's Nano Banana Pro model (Google's Gemini image model via kie.ai).
 *
 * Provider history: fal.ai until 2026-07 (account went Forbidden / credits
 * expired) → KIE jobs API, the provider already validated in agent-loop/mcp/
 * render.ts and clients/verbis/field-first-test/kie-render.mjs.
 * Same job shape: createTask → poll recordInfo → download resultUrls[0].
 *
 * Features:
 * - Text-to-image generation with high resolution (1K, 2K, 4K)
 * - Auto-routing: passes image_input (edit mode) when reference images provided
 * - Multiple aspect ratios for different platforms
 * - Up to 6 images per call
 *
 * Tool:
 * - generate_ad_images: Unified generation (text-to-image + reference images)
 *
 * Sandbox changes vs server version:
 * - Removed imageEvents (DO parses images from sandbox stdout)
 * - Output directory uses IMAGE_OUTPUT_DIR env var or /mnt/r2/images (R2 FUSE mount)
 */

const KIE_API = 'https://api.kie.ai/api/v1';
const KIE_MODEL = 'nano-banana-pro';
const KIE_POLL_MS = 10_000;
const KIE_TIMEOUT_MS = 10 * 60 * 1000;

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
  const baseDir = process.env.IMAGE_OUTPUT_DIR || '/mnt/r2/images';

  const outputDir = sessionId
    ? path.join(baseDir, sessionId)
    : baseDir;

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

  // Verify the write persisted (catches silent FUSE failures)
  const stat = fs.statSync(filepath);
  if (stat.size !== buffer.length) {
    throw new Error(`Image write verification failed: wrote ${buffer.length} bytes but file is ${stat.size} bytes at ${filepath}`);
  }
  console.log(`   Write verified: ${filepath} (${stat.size} bytes)`);

  return buffer.length;
}

function kieHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.KIE_API_KEY}`, 'Content-Type': 'application/json' };
}

/**
 * Render one image via the KIE jobs API: createTask → poll recordInfo → result URL.
 * `imageInput` (public URLs) switches Nano Banana Pro into edit mode.
 */
async function kieGenerateImage(input: {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  outputFormat: string; // 'png' | 'jpg'
  imageInput?: string[];
}): Promise<{ url: string; creditsConsumed: number | null }> {
  const taskInput: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    resolution: input.resolution,
    output_format: input.outputFormat,
  };
  if (input.imageInput && input.imageInput.length > 0) {
    taskInput.image_input = input.imageInput;
  }

  const cr = await fetch(`${KIE_API}/jobs/createTask`, {
    method: 'POST',
    headers: kieHeaders(),
    body: JSON.stringify({ model: KIE_MODEL, input: taskInput }),
  });
  const cd: any = await cr.json();
  if (cd?.code !== 200 || !cd?.data?.taskId) {
    throw new Error(`KIE createTask failed: ${JSON.stringify(cd).slice(0, 300)}`);
  }
  const taskId = cd.data.taskId;
  console.log(`   KIE task ${taskId} created`);

  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > KIE_TIMEOUT_MS) throw new Error(`KIE poll timeout for task ${taskId}`);
    await new Promise((res) => setTimeout(res, KIE_POLL_MS));
    const qr = await fetch(`${KIE_API}/jobs/recordInfo?taskId=${taskId}`, { headers: kieHeaders() });
    const qd: any = await qr.json();
    const state = qd?.data?.state;
    if (state === 'fail') {
      throw new Error(`KIE render failed: ${qd.data.failCode} ${qd.data.failMsg}`);
    }
    if (state === 'success') {
      const urls = JSON.parse(qd.data.resultJson ?? '{}')?.resultUrls ?? [];
      if (!urls.length) throw new Error('KIE task succeeded but returned no resultUrls');
      return { url: urls[0], creditsConsumed: qd.data.creditsConsumed ?? null };
    }
  }
}

// Aspect ratio options supported by KIE nano-banana-pro
const aspectRatioEnum = z.enum([
  '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'
]);

// Resolution options
const resolutionEnum = z.enum(['1K', '2K', '4K']);

// Output format options (KIE supports png/jpg; jpeg and webp are normalized)
const outputFormatEnum = z.enum(['jpeg', 'png', 'webp']);

// Hook types are freeform — agent declares per image via the hookTypes tool arg.
// HOOK_TYPE_ORDER is a positional fallback for legacy paths only.
type HookType = string;
const HOOK_TYPE_ORDER = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'] as const;

function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] ?? 'variant';
}

/**
 * Create and export the nano_banana MCP server with KIE
 */
export const nanoBananaMcpServer = createSdkMcpServer({
  name: "nano-banana",
  version: "6.0.0",
  tools: [
    // Tool 1: Text-to-Image Generation (with optional reference images)
    tool(
      "generate_ad_images",
      "Generate high-quality images using Nano Banana Pro (via KIE). " +
      "Supports 1K/2K/4K resolution, multiple aspect ratios, and optional reference images. " +
      "When reference images are provided, automatically uses image editing mode for style/subject consistency. " +
      "Pass `targetImageIndices` when iterating on existing image slots; omit when generating fresh.",
      {
        prompts: z.array(z.string()).min(1).describe(
          "Array of image generation prompts (one per image). Each prompt should be descriptive and detailed. " +
          "Example: 'A professional business person working confidently on a laptop in a modern office, warm lighting, photorealistic style'"
        ),
        hookTypes: z.array(z.string()).optional().describe(
          "Per-image hook label (parallel array to `prompts`, same length). The agent should pick from the canonical " +
          "framework names (stat, story, fomo, curiosity, callout, contrast) when applicable, or invent a brand-specific " +
          "name (e.g. 'authority', 'social-proof', 'pattern-interrupt') when none fit. Required for new ads to be " +
          "semantically labeled; omit only on rapid retries where the label is inherited."
        ),
        targetImageIndices: z.array(z.number().int().positive()).optional().describe(
          "When iterating on existing images, pass the 1-based slot indices to replace. Must match prompts.length. " +
          "Example: prompts=['updated infographic'], targetImageIndices=[1] → bumps Image 1 to a new version. " +
          "On fresh initial generation, also pass [1..N] so any aspect-ratio retries collide on the same slot " +
          "(bumps version) instead of leaking abandoned files. Omit only for ad-hoc one-off generations."
        ),
        style: z.string().optional().describe(
          "Visual style to apply across all images. Appended to each prompt. " +
          "Examples: 'modern minimal', 'photorealistic', 'vibrant and energetic', 'professional corporate', 'warm and friendly'"
        ),
        referenceImageUrls: z.array(z.string().url()).max(8).optional().describe(
          "Optional reference image URLs for style transfer or subject consistency. " +
          "When provided, automatically uses image editing mode instead of text-to-image. " +
          "Supports up to 8 reference images. Can be URLs from previous generations or external URLs."
        ),
        aspectRatio: aspectRatioEnum
          .optional()
          .describe("Aspect ratio for generated images. Default: '1:1'. Use '9:16' for stories, '16:9' for landscape, '1:1' for square posts."),
        resolution: resolutionEnum
          .optional()
          .describe("Output resolution. Default: '1K'. Options: '1K' (fastest), '2K' (balanced), '4K' (highest quality)."),
        outputFormat: outputFormatEnum
          .optional()
          .describe("Output image format. Default: 'png'. 'jpeg' maps to jpg; 'webp' is not supported by KIE and falls back to png."),
        enableWebSearch: z.boolean()
          .optional()
          .describe("Accepted for backward compatibility but not supported by the KIE provider; ignored."),
        sessionId: z.string().optional().describe(
          "Optional session ID for organizing images into folders. Images will be saved to generated-images/{sessionId}/"
        )
      },
      async (args) => {
        const toolStartTime = Date.now();
        const hasReferenceImages = args.referenceImageUrls && args.referenceImageUrls.length > 0;
        const mode = hasReferenceImages ? 'edit (with references)' : 'text-to-image';

        // Validate parallel-array lengths up front so the agent gets a clear error.
        if (args.targetImageIndices && args.targetImageIndices.length !== args.prompts.length) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({
              success: false,
              error: `targetImageIndices.length (${args.targetImageIndices.length}) must equal prompts.length (${args.prompts.length})`,
            }) }],
          };
        }
        if (args.hookTypes && args.hookTypes.length !== args.prompts.length) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({
              success: false,
              error: `hookTypes.length (${args.hookTypes.length}) must equal prompts.length (${args.prompts.length})`,
            }) }],
          };
        }

        // KIE format: png/jpg only. jpeg → jpg, webp → png (unsupported).
        const kieFormat = args.outputFormat === 'jpeg' ? 'jpg' : args.outputFormat === 'webp' ? 'png' : (args.outputFormat || 'png');
        const ext = kieFormat;
        const mimeType = kieFormat === 'jpg' ? 'image/jpeg' : 'image/png';

        console.log(`[${new Date().toISOString()}] Starting KIE Nano Banana Pro image generation`);
        console.log(`   Mode: ${mode}`);
        console.log(`   Prompts: ${args.prompts.length}`);
        console.log(`   targetImageIndices: ${args.targetImageIndices?.join(',') || 'none (fresh slots)'}`);
        console.log(`   hookTypes: ${args.hookTypes?.join(',') || 'none (positional fallback)'}`);
        console.log(`   Style: ${args.style || 'default'}`);
        console.log(`   Resolution: ${args.resolution || '1K'}`);
        console.log(`   Aspect Ratio: ${args.aspectRatio || '1:1'}`);
        if (args.enableWebSearch) {
          console.log('   Web Search: requested but not supported by KIE — ignored');
        }
        if (hasReferenceImages) {
          console.log(`   Reference Images: ${args.referenceImageUrls!.length}`);
        }

        if (!process.env.KIE_API_KEY) {
          console.error('KIE_API_KEY not found');
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: false,
                error: 'KIE_API_KEY environment variable is not set',
                message: 'Please configure KIE_API_KEY (wrangler secret / .env)'
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

              const rendered = await kieGenerateImage({
                prompt: enhancedPrompt,
                aspectRatio: args.aspectRatio || '1:1',
                resolution: args.resolution || '1K',
                outputFormat: kieFormat,
                imageInput: hasReferenceImages ? args.referenceImageUrls! : undefined,
              });

              const apiCallDuration = Date.now() - apiCallStart;
              console.log(`[${new Date().toISOString()}] API response received for image ${i + 1} (took ${apiCallDuration}ms, credits=${rendered.creditsConsumed ?? '?'})`);

              const sanitizedPrompt = sanitizeFilename(prompt);
              const filename = `${timestamp}_${i + 1}_${sanitizedPrompt}.${ext}`;
              const filepath = path.join(outputDir, filename);

              // Download and save image
              const fileSize = await downloadImage(rendered.url, filepath);
              console.log(`   Saved: ${filename} (${Math.round(fileSize / 1024)}KB)`);

              // Construct relative URL (works with Vite proxy in dev, and directly in production)
              const url = `/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;

              const imageIndex = i + 1;
              // Slot to persist into: agent-specified target if given, else positional fallback.
              const targetImageIndex = args.targetImageIndices?.[i] ?? imageIndex;
              // Hook label: agent-specified if given, else positional fallback (legacy).
              const agentHookType = args.hookTypes?.[i];
              const hookType = agentHookType ?? getHookTypeForIndex(targetImageIndex);

              results.push({
                id: `image_${imageIndex}`,
                imageIndex,
                targetImageIndex,
                hookType,
                filename: filename,
                filepath: filepath,
                url: url,
                originalUrl: rendered.url,
                prompt: prompt,
                enhancedPrompt: enhancedPrompt,
                mimeType,
                sizeKB: Math.round(fileSize / 1024),
                aspectRatio: args.aspectRatio || '1:1',
                resolution: args.resolution || '2K',
                style: args.style || "default",
                webSearchEnabled: false,
                referenceImagesUsed: hasReferenceImages ? args.referenceImageUrls!.length : 0,
                mode: mode,
                description: '',
              });

              // Track generated image for completion marker (append-only).
              // targetImageIndex + hookType travel here so finalize (DO) honors them on the
              // jsonl-driven path too (parser path reads from tool_result directly).
              try {
                const trackEntry = JSON.stringify({
                  filename,
                  path: `images/${filename}`,
                  targetImageIndex,
                  hookType,
                  prompt,
                }) + '\n';
                fs.appendFileSync('/app/generated-images.jsonl', trackEntry);
              } catch { /* non-critical */ }

              console.log(`   Image ${i + 1} complete`);

            } catch (imageError: any) {
              // Write to stdout (visible in DO logs) AND stderr
              const errMsg = `[IMAGE_ERROR] Image ${i + 1} failed: ${imageError.message}`;
              process.stdout.write(JSON.stringify({ type: 'trace', component: 'nano-banana', action: 'image_error', error: imageError.message, imageIndex: i + 1, ts: Date.now() }) + '\n');
              console.error(errMsg);
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
          console.log(`[${new Date().toISOString()}] Generation complete: ${successCount}/${args.prompts.length} images successful (total: ${toolDuration}ms)`);

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
          console.error('Image generation failed:', error.message);
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

console.log('nano_banana MCP server created (v6.0.0 - KIE Nano Banana Pro with auto-routing)');
