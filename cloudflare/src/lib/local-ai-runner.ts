// @ts-nocheck — Dev-only file. Uses Node.js APIs (fs, path, Buffer, process) that
// conflict with @cloudflare/workers-types. Works at runtime with nodejs_compat flag.
// Local dev AI runner — runs Claude Agent SDK in-process for wrangler dev.
// Mirrors sandbox/agent-runner.ts logic but without Docker/sandbox overhead.
// Only used when AI_BACKEND=local (wrangler dev --env dev).

import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { fal } from '@fal-ai/client';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Orchestrator prompt (same as sandbox/orchestrator-prompt.ts) ───

const ORCHESTRATOR_SYSTEM_PROMPT = `You coordinate a 2-agent + skills system that creates conversion-focused ads.

## Your Components

**research** (Agent) - Extracts factual data from homepage
- Input: URL
- Output: \`agent/files/research/{brand}_research.md\`

**hook-methodology** (Skill) - Generates conversion hooks from research
- Input: Reads research file
- Output: \`agent/.claude/skills/hook-methodology/hook-bank/{brand}-{date}.md\`

**art-style** (Skill) - Creates visual prompts from hooks
- Input: Reads hook-bank file
- Output: \`agent/files/creatives/{brand}_prompts.json\`

**mcp__nano-banana__generate_ad_images** (MCP Tool) - Generates images
- Input: Array of prompts from prompts.json
- Output: Images in \`generated-images/{sessionId}/\`

## Workflow

1. Parse request → Extract URL (required), brand name, style (optional), image count (optional, default 6, max 6)
2. Spawn research agent → Wait for \`agent/files/research/{brand}_research.md\`
3. Trigger hook-methodology skill → Wait for hook-bank file
4. Trigger art-style skill → Wait for \`agent/files/creatives/{brand}_prompts.json\`
5. Read prompts.json and call MCP tool to generate images — only generate the number the user requested (default 6). Pick the first N prompts from prompts.json.
6. Report completion with image URLs

## Style Keywords

Art skill auto-detects from user request:
- "clay" / "diorama" / "anderson" / "theatrical" → Anderson Clay Diorama (default)
- "brutalism" / "brutalist" / "neo-brutalist" → Soft Brutalism Clay
- "surreal" / "dreamlike" / "scale" → Surrealist Scale (future)
- "minimal" / "clean" / "photography" → Minimal Photography (future)
- No style specified → Defaults to Anderson Clay Diorama

## Rules

1. Always need a URL - ask if not provided
2. Sequential: research → hooks → art → images (each depends on previous)
3. Pass brand name to skills (extracted from URL domain)
4. Trust skills - don't micromanage their creative process
5. Be brief in updates
6. For image generation: read prompts.json, extract prompt strings, then generate only the number of images the user requested (default 6 if not specified, max 6). Select the first N prompts from the array. Call MCP in batches of up to 3 as needed.

## Example

User: "Create conversion ads for https://theratefinder.ca"

You: "Researching theratefinder.ca..."
[Spawn research agent with URL]

You: "Research complete. Generating hooks..."
[Trigger hook-methodology skill]

You: "Hooks complete. Creating visual concepts..."
[Trigger art-style skill]

You: "Prompts ready. Generating images..."
[Read prompts.json, select first N prompts based on user's requested count (default 6)]
[Call mcp__nano-banana__generate_ad_images in batches of up to 3]

You: "Done! N ad creatives generated."
[Return image URLs and summary]

Example with specific count:
User: "Create 2 ads for https://example.com"
→ Full pipeline runs (research, 6 hooks, 6 prompts), but only 2 images are generated from the first 2 prompts.

Parse → research → hooks → art → images (user-requested count) → done.`;

// ─── MCP Server (compact version of sandbox/nano-banana-mcp.ts) ─────

type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';
const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

function sanitizeFilename(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').substring(0, 50);
}

function createLocalMcpServer(falKey: string, imageOutputDir: string) {
  fal.config({ credentials: falKey });

  return createSdkMcpServer({
    name: 'nano-banana',
    version: '5.1.0',
    tools: [
      tool(
        'generate_ad_images',
        'Generate up to 6 high-quality images using fal.ai Nano Banana Pro. ' +
        'Supports 1K/2K/4K resolution, multiple aspect ratios, web search grounding, and optional reference images.',
        {
          prompts: z.array(z.string()).min(1).max(6).describe('Array of 1-6 image generation prompts'),
          style: z.string().optional().describe('Visual style to apply across all images'),
          referenceImageUrls: z.array(z.string().url()).max(10).optional().describe('Reference image URLs for style transfer'),
          aspectRatio: z.enum(['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16']).optional(),
          resolution: z.enum(['1K', '2K', '4K']).optional(),
          outputFormat: z.enum(['jpeg', 'png', 'webp']).optional(),
          enableWebSearch: z.boolean().optional(),
          sessionId: z.string().optional().describe('Session ID for organizing images into folders'),
        },
        async (args) => {
          const hasRefs = args.referenceImageUrls && args.referenceImageUrls.length > 0;
          const mode = hasRefs ? 'edit (with references)' : 'text-to-image';

          try {
            const outputDir = args.sessionId
              ? path.join(imageOutputDir, args.sessionId)
              : imageOutputDir;
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

            const timestamp = Date.now();
            const results: any[] = [];

            for (let i = 0; i < args.prompts.length; i++) {
              let enhancedPrompt = args.prompts[i];
              if (args.style) enhancedPrompt = `${enhancedPrompt}. Style: ${args.style}.`;

              try {
                const endpoint = hasRefs ? 'fal-ai/nano-banana-pro/edit' : 'fal-ai/nano-banana-pro';
                const input: any = {
                  prompt: enhancedPrompt,
                  num_images: 1,
                  aspect_ratio: args.aspectRatio || '1:1',
                  resolution: args.resolution || '1K',
                  output_format: args.outputFormat || 'png',
                  enable_web_search: args.enableWebSearch || false,
                };
                if (hasRefs) input.image_urls = args.referenceImageUrls;

                const result = await fal.subscribe(endpoint, { input, logs: true });
                const data = result.data as { images: Array<{ url: string; content_type: string }>; description?: string };
                if (!data.images?.length) throw new Error('No images in response');

                const ext = args.outputFormat || 'png';
                const filename = `${timestamp}_${i + 1}_${sanitizeFilename(args.prompts[i])}.${ext}`;
                const filepath = path.join(outputDir, filename);

                // Download and save
                const res = await fetch(data.images[0].url);
                const buf = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(filepath, buf);

                const url = `/images/${args.sessionId ? args.sessionId + '/' : ''}${filename}`;
                const imageIndex = i + 1;
                results.push({
                  id: `image_${imageIndex}`,
                  imageIndex,
                  hookType: getHookTypeForIndex(imageIndex),
                  filename, url, prompt: args.prompts[i], enhancedPrompt,
                  originalUrl: data.images[0].url,
                  mimeType: `image/${ext}`,
                  sizeKB: Math.round(buf.length / 1024),
                  aspectRatio: args.aspectRatio || '1:1',
                  resolution: args.resolution || '1K',
                  style: args.style || 'default',
                  mode, description: data.description || '',
                });
              } catch (err: any) {
                results.push({ id: `image_${i + 1}`, error: err.message, prompt: args.prompts[i] });
              }

              if (i < args.prompts.length - 1) await new Promise(r => setTimeout(r, 500));
            }

            const successCount = results.filter(r => !r.error).length;
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Successfully generated ${successCount} of ${args.prompts.length} images`,
                  mode, totalRequested: args.prompts.length, totalGenerated: successCount,
                  images: results,
                }, null, 2),
              }],
            };
          } catch (err: any) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ success: false, error: err.message }) }],
            };
          }
        },
      ),
    ],
  });
}

// ─── Public API ──────────────────────────────────────────────────────

export interface LocalRunnerOptions {
  apiKey: string;
  falKey: string;
  imageOutputDir: string;
  cwd?: string;
}

export async function* runLocalGeneration(
  prompt: string,
  sessionId: string,
  sdkSessionId?: string,
  options?: LocalRunnerOptions,
): AsyncGenerator<any> {
  if (!options) throw new Error('LocalRunnerOptions required');

  const mcpServer = createLocalMcpServer(options.falKey, options.imageOutputDir);
  const cwd = options.cwd || process.cwd();

  const baseOptions: Partial<Options> = {
    cwd,
    model: 'claude-haiku-4-5-20251001',
    maxTurns: 30,
    settingSources: ['user', 'project'],
    allowedTools: [
      'Task', 'Skill', 'TodoWrite',
      'WebFetch', 'WebSearch', 'Read', 'Write',
      'Bash', 'Edit', 'Glob', 'Grep',
      'mcp__nano-banana__generate_ad_images',
    ],
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    mcpServers: { 'nano-banana': mcpServer },
    ...(sdkSessionId ? { resume: sdkSessionId } : {}),
  };

  const abortController = new AbortController();

  async function* createPrompt(): AsyncGenerator<any> {
    yield {
      type: 'user' as const,
      message: { role: 'user' as const, content: prompt },
      parent_tool_use_id: null,
      session_id: '',
    };
    if (!abortController.signal.aborted) {
      await new Promise<void>(resolve => {
        abortController.signal.addEventListener('abort', () => resolve(), { once: true });
      });
    }
  }

  try {
    for await (const message of query({ prompt: createPrompt() as any, options: baseOptions })) {
      yield message;
      if (message.type === 'result') {
        abortController.abort();
        break;
      }
    }
  } catch (err: any) {
    // Resume failed — fall back to fresh session
    if (sdkSessionId && err?.message?.includes('resume')) {
      console.error(`Resume failed, starting fresh: ${err.message}`);
      const freshOptions = { ...baseOptions };
      delete (freshOptions as any).resume;
      for await (const message of query({ prompt: createPrompt() as any, options: freshOptions })) {
        yield message;
        if (message.type === 'result') {
          abortController.abort();
          break;
        }
      }
    } else {
      throw err;
    }
  }
}
