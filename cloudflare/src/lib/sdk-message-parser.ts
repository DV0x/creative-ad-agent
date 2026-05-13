// SDK message parser for the CampaignSession Durable Object.
// Port of processSDKMessage() from server/lib/websocket-handler.ts:359-606.
// Key difference: all D1 calls are async. Eliminated: imageEvents, registerMcpSession,
// SDKInstrumentor, broadcastToConnection (replaced by ctx.emitEvent).

import type { ServerMessage } from './types.js';
import { getHookTypeForIndex } from './types.js';
import type { BlockBuilder } from './block-builder.js';
import type { HookType } from '../db/images.js';
import * as db from '../db/index.js';

// Accumulator for AI text content (for DB persistence)
export interface TextAccumulator {
  text: string;
}

export interface ParserContext {
  emitEvent: (event: ServerMessage) => void;
  sendEphemeral: (event: ServerMessage) => void;
  campaignId: string | null;
  d1: D1Database;
  processedFilenames: Set<string>;
  textAccumulator: TextAccumulator;
  blockBuilder: BlockBuilder;
  imageCounter: { next: number };
  hasStreamedDeltas: boolean;
}

// Strip image URLs and file paths — images are shown in the gallery, not in chat text
export function stripImageUrls(text: string): string {
  let cleaned = text;
  // Remove fal.ai URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]*fal\.(media|ai)[^\s]*/g, '');
  // Remove /mnt/r2/images/... paths
  cleaned = cleaned.replace(/\/mnt\/r2\/images\/[^\s)"]*/g, '');
  // Remove **Image URL:** lines
  cleaned = cleaned.replace(/[-–•*]*\s*\*?\*?Image URL:?\*?\*?:?\s*[^\n]*/gi, '');
  // Collapse multiple blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'WebFetch': 'Fetching webpage',
  'WebSearch': 'Searching the web',
  'Read': 'Reading file',
  'Write': 'Writing file',
  'Task': 'Running agent',
  'Skill': 'Using skill',
  'Glob': 'Finding files',
  'Grep': 'Searching code',
  'mcp__nano-banana__generate_ad_images': 'Generating images',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processSDKMessage(message: any, ctx: ParserContext): Promise<void> {
  const { emitEvent, sendEphemeral, blockBuilder, textAccumulator, processedFilenames, imageCounter } = ctx;

  // Handle streaming delta events (ephemeral — not buffered in EventBuffer)
  if (message.type === 'text_delta') {
    sendEphemeral({
      type: 'text_delta',
      timestamp: new Date().toISOString(),
      delta: message.delta,
    });
    ctx.hasStreamedDeltas = true;
    return;
  }
  if (message.type === 'text_start') {
    sendEphemeral({
      type: 'text_start',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  if (message.type === 'text_end') {
    sendEphemeral({
      type: 'text_end',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle tool_use events from stream (written by agent-runner at content_block_stop)
  if (message.type === 'tool_use_event') {
    const block = message; // { type, name, id, input }

    emitEvent({
      type: 'tool_start',
      timestamp: new Date().toISOString(),
      tool: block.name,
      toolId: block.id,
      input: block.input,
    });

    // Add tool to block builder with friendly names
    const displayName = TOOL_DISPLAY_NAMES[block.name] || block.name;
    blockBuilder.addThinkingChild('tool', displayName);

    // Detect file writes (Write tool with campaign files)
    if (block.name === 'Write' && block.input?.file_path && block.input?.content) {
      const filePath = block.input.file_path as string;
      const fileContent = block.input.content as string;

      let fileType: 'research' | 'hooks' | 'prompts' | null = null;
      if (filePath.includes('research')) {
        fileType = 'research';
      } else if (filePath.includes('hook')) {
        fileType = 'hooks';
      } else if (filePath.includes('prompt')) {
        fileType = 'prompts';
      }

      if (fileType) {
        emitEvent({
          type: 'file',
          timestamp: new Date().toISOString(),
          fileType,
          content: fileContent,
          path: filePath,
        });

        blockBuilder.addThinkingChild('status', `${fileType}.md created`, 'success');

        if (ctx.campaignId) {
          try {
            await db.updateCampaignFile(ctx.d1, ctx.campaignId, fileType, fileContent);
          } catch (err) {
            console.error(`Failed to save ${fileType}:`, err);
          }
        }
      }
    }

    // Detect phase from tool usage — enrich labels with context
    if (block.name === 'Task') {
      const agentType = block.input?.subagent_type;
      if (agentType === 'Explore' || block.input?.description?.toLowerCase().includes('research')) {
        const desc = (block.input?.description || block.input?.prompt || '') as string;
        const urlMatch = desc.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.[a-z]+/i);
        const label = urlMatch ? `Researching ${urlMatch[1]}` : 'Researching brand';
        emitEvent({
          type: 'phase',
          timestamp: new Date().toISOString(),
          phase: 'research',
          label,
        });
        blockBuilder.openThinkingBlock(label);
      }
    } else if (block.name === 'Skill') {
      const skillName = block.input?.skill;
      if (skillName === 'hook-methodology') {
        const label = 'Writing 6 ad hooks';
        emitEvent({ type: 'phase', timestamp: new Date().toISOString(), phase: 'hooks', label });
        blockBuilder.openThinkingBlock(label);
      } else if (skillName === 'art-style') {
        const label = 'Crafting art direction';
        emitEvent({ type: 'phase', timestamp: new Date().toISOString(), phase: 'art', label });
        blockBuilder.openThinkingBlock(label);
      }
    } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
      const promptCount = Array.isArray(block.input?.prompts) ? block.input.prompts.length : undefined;
      const label = promptCount ? `Generating ${promptCount} images` : 'Generating images';
      emitEvent({
        type: 'phase',
        timestamp: new Date().toISOString(),
        phase: 'images',
        label,
        imageCount: promptCount,
      });
      blockBuilder.openThinkingBlock(label, promptCount || 0);
    }

    return;
  }

  // Capture SDK session ID for follow-up resume
  if (message.type === 'system' && message.subtype === 'init' && message.session_id) {
    if (ctx.campaignId) {
      try {
        await db.updateSdkSessionId(ctx.d1, ctx.campaignId, message.session_id);
      } catch (err) {
        console.error('Failed to save SDK session ID:', err);
      }
    }
  }

  // Debug: log every SDK message type processed
  if (message.type === 'trace' && message.action === 'heartbeat') {
    console.log(`[sdk-parser] heartbeat count=${message.count} req=${message.requestId || 'none'}`);
  } else {
    console.log(`[sdk-parser] msg.type=${message.type} uuid=${message.uuid?.substring(0, 8) || 'none'}`);
  }

  if (message.type === 'assistant') {
    const content = message.message?.content;
    if (!Array.isArray(content)) return;

    const blockTypes = content.map((b: any) => b.type).join(',');
    console.log(`[sdk-parser] assistant content: ${content.length} blocks [${blockTypes}]`);

    for (const block of content) {
      if (block.type === 'text' && block.text) {
        // Always accumulate text for DB persistence (even when deltas were streamed)
        textAccumulator.text += (textAccumulator.text ? '\n' : '') + block.text;

        // Only emit 'message' event if text wasn't already streamed via deltas
        if (!ctx.hasStreamedDeltas) {
          const cleanedText = stripImageUrls(block.text);
          console.log(`[sdk-parser] EMIT message text (${cleanedText.length} chars): ${cleanedText.substring(0, 80)}`);
          if (cleanedText) {
            emitEvent({
              type: 'message',
              timestamp: new Date().toISOString(),
              text: cleanedText,
            });
          }
        } else {
          console.log(`[sdk-parser] SKIP message text (${block.text.length} chars) — already streamed via deltas`);
        }
      } else if (block.type === 'tool_use') {
        // Note: On Cloudflare, tool_use is handled via 'tool_use_event' from stream events (above).
        // This path only fires for local dev (runGenerationLocal) where assembled messages are
        // processed directly without streaming.
        emitEvent({
          type: 'tool_start',
          timestamp: new Date().toISOString(),
          tool: block.name,
          toolId: block.id,
          input: block.input,
        });

        // Add tool to block builder with friendly names
        const displayName = TOOL_DISPLAY_NAMES[block.name] || block.name;
        blockBuilder.addThinkingChild('tool', displayName);

        // Detect file writes (Write tool with campaign files)
        if (block.name === 'Write' && block.input?.file_path && block.input?.content) {
          const filePath = block.input.file_path as string;
          const fileContent = block.input.content as string;

          let fileType: 'research' | 'hooks' | 'prompts' | null = null;
          if (filePath.includes('research')) {
            fileType = 'research';
          } else if (filePath.includes('hook')) {
            fileType = 'hooks';
          } else if (filePath.includes('prompt')) {
            fileType = 'prompts';
          }

          if (fileType) {
            emitEvent({
              type: 'file',
              timestamp: new Date().toISOString(),
              fileType,
              content: fileContent,
              path: filePath,
            });

            blockBuilder.addThinkingChild('status', `${fileType}.md created`, 'success');

            if (ctx.campaignId) {
              try {
                await db.updateCampaignFile(ctx.d1, ctx.campaignId, fileType, fileContent);
              } catch (err) {
                console.error(`Failed to save ${fileType}:`, err);
              }
            }
          }
        }

        // Detect phase from tool usage — enrich labels with context
        if (block.name === 'Task') {
          const agentType = block.input?.subagent_type;
          if (agentType === 'Explore' || block.input?.description?.toLowerCase().includes('research')) {
            // Try to extract brand/URL from task description
            const desc = (block.input?.description || block.input?.prompt || '') as string;
            const urlMatch = desc.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.[a-z]+/i);
            const label = urlMatch ? `Researching ${urlMatch[1]}` : 'Researching brand';
            emitEvent({
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'research',
              label,
            });
            blockBuilder.openThinkingBlock(label);
          }
        } else if (block.name === 'Skill') {
          const skillName = block.input?.skill;
          if (skillName === 'hook-methodology') {
            const label = 'Writing 6 ad hooks';
            emitEvent({
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'hooks',
              label,
            });
            blockBuilder.openThinkingBlock(label);
          } else if (skillName === 'art-style') {
            const label = 'Crafting art direction';
            emitEvent({
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'art',
              label,
            });
            blockBuilder.openThinkingBlock(label);
          }
        } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
          const promptCount = Array.isArray(block.input?.prompts) ? block.input.prompts.length : undefined;
          const label = promptCount ? `Generating ${promptCount} images` : 'Generating images';
          emitEvent({
            type: 'phase',
            timestamp: new Date().toISOString(),
            phase: 'images',
            label,
            imageCount: promptCount,
          });
          blockBuilder.openThinkingBlock(label, promptCount || 0);
        }
      }
    }
  } else if (message.type === 'user') {
    const content = message.message?.content;
    if (!Array.isArray(content)) return;

    for (const block of content) {
      if (block.type === 'tool_result') {
        emitEvent({
          type: 'tool_end',
          timestamp: new Date().toISOString(),
          toolId: block.tool_use_id,
          success: !block.is_error,
        });

        // Check for image results
        try {
          let resultContent = block.content;

          if (typeof resultContent === 'string') {
            resultContent = JSON.parse(resultContent);
          } else if (Array.isArray(resultContent)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const textPart = resultContent.find((p: any) => p.type === 'text');
            if (textPart?.text) {
              resultContent = JSON.parse(textPart.text);
            }
          }

          if (resultContent?.images && Array.isArray(resultContent.images)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const img of resultContent.images as any[]) {
              const imageUrl = img.urlPath || img.url;
              if (!imageUrl || img.error) continue;

              // Dedup by filename
              const filename = img.filename || '';
              if (filename && processedFilenames.has(filename)) continue;
              if (filename) processedFilenames.add(filename);

              // Server assigns global index
              const globalIndex = imageCounter.next++;
              const hookType = getHookTypeForIndex(globalIndex);

              emitEvent({
                type: 'image',
                timestamp: new Date().toISOString(),
                id: `image_${globalIndex}`,
                urlPath: imageUrl,
                prompt: img.prompt || '',
                filename,
                hookType,
                imageIndex: globalIndex,
              });

              blockBuilder.incrementCompletedImages();

              // Persist to database
              if (ctx.campaignId) {
                try {
                  await db.addCampaignImage(ctx.d1, {
                    campaignId: ctx.campaignId,
                    imageIndex: globalIndex,
                    hookType: hookType as HookType,
                    prompt: img.prompt || undefined,
                    filePath: imageUrl,
                  });
                } catch (err) {
                  console.error('Failed to save image:', err);
                }
              }
            }
          }
        } catch {
          // Not an image result, ignore
        }
      }
    }
  }
  // message.type === 'result' is handled at the generation level, not here.
}
