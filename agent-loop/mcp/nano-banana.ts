/**
 * nano-banana MCP — fal.ai Nano Banana Pro image generation, ported from
 * server/lib/nano-banana-mcp.ts for the standalone agent-loop.
 *
 * Two changes from the server version:
 *  1. Factory: createNanoBananaServer(outputDir) closes over the run's images
 *     dir (the server used a global generated-images/<sessionId> scheme).
 *  2. The tool returns the ABSOLUTE local file path of each saved PNG, so the
 *     cell can Read() it back for its vision gate. (Server-only imageEvents
 *     WS-streaming is dropped — there is no WS in Phase 1.)
 *
 * Auto-routes: referenceImageUrls present → fal edit endpoint (binds a product);
 * absent → text-to-image. Needs FAL_KEY in the environment.
 */
import { fal } from '@fal-ai/client';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';

function sanitizeFilename(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').substring(0, 50);
}

async function downloadImage(url: string, filepath: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  return buffer.length;
}

const aspectRatioEnum = z.enum(['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16']);
const resolutionEnum = z.enum(['1K', '2K', '4K']);
const outputFormatEnum = z.enum(['jpeg', 'png', 'webp']);

export function createNanoBananaServer(outputDir: string) {
  fs.mkdirSync(outputDir, { recursive: true });

  const generateAdImages = tool(
    'generate_ad_images',
    'Generate ad image(s) with fal.ai Nano Banana Pro. Pass an ARRAY of fully-compiled prompts (one per image). ' +
      'If referenceImageUrls are provided (a product photo), it auto-uses the EDIT endpoint to bind that product; otherwise text-to-image. ' +
      'Each image is saved to disk and the result returns its ABSOLUTE filePath — Read() that path to view the pixels for your vision gate. ' +
      'Default aspect 1:1, resolution 2K, format png.',
    {
      prompts: z.array(z.string().min(1)).min(1).max(6).describe('Fully-compiled image prompts, one per image (1-6).'),
      referenceImageUrls: z
        .array(z.string().url())
        .max(14)
        .optional()
        .describe('Optional product-reference image URLs (e.g. a refs falUrl). When present, the edit endpoint binds the product.'),
      aspectRatio: aspectRatioEnum.optional().describe("Default '1:1'. Use '9:16' for stories, '4:5' for feed, '16:9' for landscape."),
      resolution: resolutionEnum.optional().describe("Default '2K'. '1K' fastest, '4K' highest."),
      outputFormat: outputFormatEnum.optional().describe("Default 'png'."),
      enableWebSearch: z.boolean().optional().describe('Web-search grounding for real-time data. Default false.'),
    },
    async (args) => {
      if (!process.env.FAL_KEY) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: 'FAL_KEY is not set' }) }], isError: true };
      }
      fal.config({ credentials: process.env.FAL_KEY });

      const hasRefs = !!(args.referenceImageUrls && args.referenceImageUrls.length > 0);
      const endpoint = hasRefs ? 'fal-ai/nano-banana-pro/edit' : 'fal-ai/nano-banana-pro';
      const ts = Date.now();
      const results: any[] = [];

      for (let i = 0; i < args.prompts.length; i++) {
        const prompt = args.prompts[i];
        try {
          const input: Record<string, unknown> = {
            prompt,
            num_images: 1,
            aspect_ratio: args.aspectRatio || '1:1',
            resolution: args.resolution || '2K',
            output_format: args.outputFormat || 'png',
            enable_web_search: args.enableWebSearch || false,
          };
          if (hasRefs) input.image_urls = args.referenceImageUrls;

          const result: any = await fal.subscribe(endpoint, { input: input as any, logs: false });
          const image = (result?.data?.images ?? [])[0];
          if (!image?.url) throw new Error('No image URL in fal response');

          const ext = args.outputFormat || 'png';
          const filename = `${ts}_${i + 1}_${sanitizeFilename(prompt)}.${ext}`;
          const filePath = path.join(outputDir, filename);
          const bytes = await downloadImage(image.url, filePath);

          results.push({
            index: i + 1,
            filePath, // absolute — Read() this for the vision gate
            filename,
            mode: hasRefs ? 'edit' : 'text-to-image',
            sizeKB: Math.round(bytes / 1024),
            falUrl: image.url,
            prompt,
          });
        } catch (err: any) {
          results.push({ index: i + 1, error: err?.message ?? String(err), prompt });
        }
        if (i < args.prompts.length - 1) await new Promise((r) => setTimeout(r, 400));
      }

      const ok = results.filter((r) => !r.error).length;
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: ok > 0,
                generated: ok,
                requested: args.prompts.length,
                mode: hasRefs ? 'edit (product bound)' : 'text-to-image',
                images: results,
                hint: 'Read() each images[].filePath to view the pixels for your vision gate.',
              },
              null,
              2,
            ),
          },
        ],
        ...(ok === 0 ? { isError: true } : {}),
      };
    },
  );

  return createSdkMcpServer({ name: 'nano-banana', version: '5.1.0-agentloop', tools: [generateAdImages] });
}
