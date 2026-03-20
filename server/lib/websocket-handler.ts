import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve, extname, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { fal } from '@fal-ai/client';
import { aiClient } from './ai-client.js';
import { sessionManager } from './session-manager.js';
import { SDKInstrumentor } from './instrumentor.js';
import { appendEvent, getEventsSince, getLatestEventId, hasBuffer, clearBuffer } from './event-buffer.js';
import * as db from './db/index.js';
import { verifyWebSocketToken, IS_CLERK_CONFIGURED } from './auth.js';
import { imageEvents, ImageSavedEvent, registerMcpSession, resolveWsSessionId, unregisterByWsSession } from './image-events.js';
import { BlockBuilder } from './block-builder.js';

// Client → Server message types
interface ClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;
  lastEventId?: number;
  assetFileIds?: string[];
}

// ── Asset attachment resolution ────────────────────────────────

const __filename_ws = fileURLToPath(import.meta.url);
const __dirname_ws = dirname(__filename_ws);
const UPLOADS_DIR = resolve(__dirname_ws, '../../uploads');

const EXT_TO_MEDIA_TYPE: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

interface ResolvedAssets {
  attachments: Array<{ type: string; source: { type: string; media_type: string; data: string } }>;
  referenceUrls: string[];
}

async function resolveAssetAttachments(assetFileIds: string[]): Promise<ResolvedAssets> {
  const attachments: ResolvedAssets['attachments'] = [];
  const referenceUrls: string[] = [];

  // Configure fal.ai client for storage uploads
  const falKey = process.env.FAL_KEY;
  const canUploadToFal = !!falKey;
  if (canUploadToFal) {
    fal.config({ credentials: falKey });
  }

  for (const fileId of assetFileIds) {
    const assetFile = db.getFile(fileId);
    if (!assetFile) {
      console.warn(`⚠️ Asset file not found: ${fileId}`);
      continue;
    }

    if (assetFile.file_type !== 'image') {
      console.log(`⏭️ Skipping non-image asset: ${fileId} (type: ${assetFile.file_type})`);
      continue;
    }

    const ext = extname(assetFile.file_path).toLowerCase();
    const mediaType = EXT_TO_MEDIA_TYPE[ext];
    if (!mediaType) {
      console.warn(`⚠️ Unsupported image extension: ${ext} for file ${fileId}`);
      continue;
    }

    const fullPath = resolve(UPLOADS_DIR, assetFile.file_path);
    try {
      const fileBuffer = await readFile(fullPath);

      // Base64 attachment for Claude to see the image
      attachments.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: fileBuffer.toString('base64'),
        },
      });

      // Upload to fal.ai storage for public URL (used by MCP referenceImageUrls)
      if (canUploadToFal) {
        try {
          const file = new File([fileBuffer], basename(assetFile.file_path), { type: mediaType });
          const publicUrl = await fal.storage.upload(file);
          referenceUrls.push(publicUrl);
          console.log(`🖼️ Resolved asset: ${assetFile.name} (${mediaType}, ${(fileBuffer.length / 1024).toFixed(1)}KB) → ${publicUrl}`);
        } catch (uploadErr) {
          console.error(`⚠️ fal.ai upload failed for ${assetFile.name}, image visible to agent but not usable as reference:`, uploadErr);
          console.log(`🖼️ Resolved asset (base64 only): ${assetFile.name} (${mediaType}, ${(fileBuffer.length / 1024).toFixed(1)}KB)`);
        }
      } else {
        console.log(`🖼️ Resolved asset (base64 only, no FAL_KEY): ${assetFile.name} (${mediaType}, ${(fileBuffer.length / 1024).toFixed(1)}KB)`);
      }
    } catch (err) {
      console.error(`❌ Failed to read asset file ${fullPath}:`, err);
    }
  }

  return { attachments, referenceUrls };
}

// Hook types for ad concepts
type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';

// Map image index (1-6) to hook type
const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

// Server → Client message types
interface ServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'file' | 'complete' | 'error' | 'incomplete' | 'ack' | 'pong' | 'subscribed';
  timestamp: string;
  // Event/Image ID (number for event tracking, string for image IDs)
  id?: number | string;
  // Phase events
  phase?: string;
  label?: string;
  // Tool events
  tool?: string;
  toolId?: string;
  input?: any;
  success?: boolean;
  // Message events
  text?: string;
  message?: string;
  // Image events
  urlPath?: string;
  prompt?: string;
  filename?: string;
  hookType?: HookType;
  imageIndex?: number;
  // File events
  fileType?: 'research' | 'hooks' | 'prompts';
  content?: string;
  path?: string;
  // Error events
  error?: string;
  // Complete events
  sessionId?: string;
  duration?: number;
  imageCount?: number;
  summary?: string;
  // Ack events
  campaignId?: string;
}

// Connection state
interface ConnectionState {
  ws: WebSocket;
  sessionId: string | null;
  campaignId: string | null;  // Database campaign ID
  userId: string;             // User ID (placeholder until auth)
  abortController: AbortController | null;
  isGenerating: boolean;
  heartbeatInterval: NodeJS.Timeout | null;
}

const connections = new Map<WebSocket, ConnectionState>();

// Track which WebSocket is subscribed to each session (for resilience)
const sessionConnections = new Map<string, WebSocket | null>();

// Track abort controllers per session (for cancel after reconnect)
const sessionAbortControllers = new Map<string, AbortController>();

/**
 * Check if an agent is currently running for a session
 * Used by the status endpoint to determine if generation is still active
 */
export function isAgentRunning(sessionId: string): boolean {
  return sessionAbortControllers.has(sessionId);
}

/**
 * Abort a running generation by session ID.
 * Used when a campaign is deleted while generation is in progress.
 * Returns true if an active generation was aborted.
 */
export function abortSession(sessionId: string): boolean {
  const controller = sessionAbortControllers.get(sessionId);
  if (controller) {
    console.log(`🛑 Aborting generation for session ${sessionId} (campaign deleted)`);
    controller.abort();
    return true;
  }
  return false;
}

// Extract campaign name from prompt (e.g., "nike.com" -> "Nike")
function extractCampaignName(prompt: string): string {
  const domainMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)(?:\.[a-z]+)/i);
  if (domainMatch) {
    const name = domainMatch[1];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  const firstWord = prompt.split(/\s+/)[0] || 'Campaign';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Emit an event: buffer it AND send to connected client
 * This enables replay on reconnect
 */
function emitEvent(sessionId: string, event: ServerMessage): number {
  // Always buffer the event (even if no client connected)
  const eventId = appendEvent(sessionId, event);

  // Send to client if connected
  const ws = sessionConnections.get(sessionId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ ...event, id: eventId }));
  }

  return eventId;
}

function broadcastToConnection(state: ConnectionState, message: ServerMessage) {
  if (state.sessionId) {
    // Use emitEvent for resilience (buffers + sends)
    emitEvent(state.sessionId, message);
  } else {
    // No session yet, send directly
    send(state.ws, message);
  }
}

// Accumulator for AI text content (for DB persistence)
interface TextAccumulator {
  text: string;
}

// BlockBuilder extracted to ./block-builder.ts for reuse and parity with cloudflare version

// Process SDK messages and convert to WebSocket events
function processSDKMessage(message: any, state: ConnectionState, instrumentor: SDKInstrumentor, processedFilenames?: Set<string>, textAccumulator?: TextAccumulator, blockBuilder?: BlockBuilder, imageCounter?: { next: number }) {
  // Process for instrumentation
  instrumentor.processMessage(message);

  // Capture SDK session ID for follow-up resume (C.2)
  if (message.type === 'system' && message.subtype === 'init' && message.session_id) {
    if (state.campaignId) {
      try {
        db.updateSdkSessionId(state.campaignId, message.session_id);
        console.log(`💾 DB: Saved SDK session ID ${message.session_id} for campaign ${state.campaignId}`);
      } catch (dbError) {
        console.error('❌ DB: Failed to save SDK session ID:', dbError);
      }
    }
  }

  if (message.type === 'assistant') {
    const content = message.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          // Accumulate text for DB persistence
          if (textAccumulator) {
            textAccumulator.text += (textAccumulator.text ? '\n' : '') + block.text;
          }
          // Send text message
          broadcastToConnection(state, {
            type: 'message',
            timestamp: new Date().toISOString(),
            text: block.text
          });
        } else if (block.type === 'tool_use') {
          // Send tool start event
          broadcastToConnection(state, {
            type: 'tool_start',
            timestamp: new Date().toISOString(),
            tool: block.name,
            toolId: block.id,
            input: block.input
          });

          // Add tool to block builder with friendly names
          if (blockBuilder) {
            const toolDisplayNames: Record<string, string> = {
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
            const displayName = toolDisplayNames[block.name] || block.name;
            blockBuilder.addThinkingChild('tool', displayName);
          }

          // Register MCP sessionId mapping when image generation tool is called
          if (block.name === 'mcp__nano-banana__generate_ad_images' && block.input?.sessionId && state.sessionId) {
            registerMcpSession(block.input.sessionId, state.sessionId);
            console.log(`[ImageEvent] Mapped MCP sessionId "${block.input.sessionId}" → WS sessionId "${state.sessionId}"`);
          }

          // Detect file writes (Write tool with campaign files)
          if (block.name === 'Write' && block.input?.file_path && block.input?.content) {
            const filePath = block.input.file_path as string;
            const content = block.input.content as string;

            // Detect file type from path
            let fileType: 'research' | 'hooks' | 'prompts' | null = null;
            if (filePath.includes('research')) {
              fileType = 'research';
            } else if (filePath.includes('hook')) {
              fileType = 'hooks';
            } else if (filePath.includes('prompt')) {
              fileType = 'prompts';
            }

            if (fileType) {
              broadcastToConnection(state, {
                type: 'file',
                timestamp: new Date().toISOString(),
                fileType,
                content,
                path: filePath,
              });
              console.log(`📄 File event: ${fileType} written to ${filePath}`);

              // Add file creation to block builder
              if (blockBuilder) {
                blockBuilder.addThinkingChild('status', `${fileType}.md created`, 'success');
              }

              // Persist to database
              if (state.campaignId) {
                try {
                  db.updateCampaignFile(state.campaignId, fileType, content);
                  console.log(`💾 DB: Saved ${fileType} for campaign ${state.campaignId}`);
                } catch (dbError) {
                  console.error(`❌ DB: Failed to save ${fileType}:`, dbError);
                }
              }
            }
          }

          // Detect phase from tool usage
          if (block.name === 'Task') {
            const agentType = block.input?.subagent_type;
            if (agentType === 'Explore' || block.input?.description?.toLowerCase().includes('research')) {
              broadcastToConnection(state, {
                type: 'phase',
                timestamp: new Date().toISOString(),
                phase: 'research',
                label: 'Researching'
              });
              // Open a thinking block for research phase
              if (blockBuilder) {
                blockBuilder.openThinkingBlock('Researching');
              }
            }
          } else if (block.name === 'Skill') {
            const skillName = block.input?.skill;
            if (skillName === 'hook-methodology') {
              broadcastToConnection(state, {
                type: 'phase',
                timestamp: new Date().toISOString(),
                phase: 'hooks',
                label: 'Generating Hooks'
              });
              if (blockBuilder) {
                blockBuilder.openThinkingBlock('Generating Hooks');
              }
            } else if (skillName === 'art-style') {
              broadcastToConnection(state, {
                type: 'phase',
                timestamp: new Date().toISOString(),
                phase: 'art',
                label: 'Creating Art Direction'
              });
              if (blockBuilder) {
                blockBuilder.openThinkingBlock('Creating Art Direction');
              }
            }
          } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
            const promptCount = Array.isArray(block.input?.prompts) ? block.input.prompts.length : undefined;
            broadcastToConnection(state, {
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'images',
              label: 'Generating Images',
              imageCount: promptCount,
            });
            if (blockBuilder) {
              blockBuilder.openThinkingBlock('Generating Images', promptCount || 0);
            }
          }
        }
      }
    }
  } else if (message.type === 'user') {
    const content = message.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_result') {
          // Send tool end event
          broadcastToConnection(state, {
            type: 'tool_end',
            timestamp: new Date().toISOString(),
            toolId: block.tool_use_id,
            success: !block.is_error
          });

          // Check for image results
          try {
            let resultContent = block.content;

            // Parse if string
            if (typeof resultContent === 'string') {
              resultContent = JSON.parse(resultContent);
            } else if (Array.isArray(resultContent)) {
              const textPart = resultContent.find((p: any) => p.type === 'text');
              if (textPart?.text) {
                resultContent = JSON.parse(textPart.text);
              }
            }

            // Extract images
            if (resultContent?.images && Array.isArray(resultContent.images)) {
              for (const img of resultContent.images) {
                const imageUrl = img.urlPath || img.url; // Support both 'url' and 'urlPath'
                if (imageUrl && !img.error) {
                  // Dedup by filename (unique per image across all MCP batches)
                  const filename = img.filename || '';
                  if (filename && processedFilenames?.has(filename)) {
                    console.log(`[SDK Stream] Skipping duplicate "${filename}" (already processed via EventEmitter)`);
                    continue;
                  }
                  if (filename) processedFilenames?.add(filename);

                  // Server assigns global index (not MCP's per-batch index)
                  const globalIndex = imageCounter ? imageCounter.next++ : 1;
                  const hookType = getHookTypeForIndex(globalIndex);

                  broadcastToConnection(state, {
                    type: 'image',
                    timestamp: new Date().toISOString(),
                    id: `image_${globalIndex}`,
                    urlPath: imageUrl,
                    prompt: img.prompt || '',
                    filename,
                    hookType,
                    imageIndex: globalIndex,
                  });

                  // Track in block builder
                  if (blockBuilder) {
                    blockBuilder.incrementCompletedImages();
                  }

                  // Persist to database
                  if (state.campaignId) {
                    try {
                      db.addCampaignImage({
                        campaignId: state.campaignId,
                        imageIndex: globalIndex,
                        hookType: hookType as db.HookType,
                        prompt: img.prompt || undefined,
                        filePath: imageUrl,
                      });
                      console.log(`💾 DB: Saved image ${globalIndex} (${hookType}) for campaign ${state.campaignId} [via SDK stream fallback]`);
                    } catch (dbError) {
                      console.error(`❌ DB: Failed to save image:`, dbError);
                    }
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
  } else if (message.type === 'result') {
    // Final result - handled at generation complete
  }
}

async function handleGenerate(state: ConnectionState, prompt: string, requestedSessionId?: string, assetFileIds?: string[]) {
  if (state.isGenerating) {
    send(state.ws, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'A generation is already in progress. Please wait or cancel first.'
    });
    return;
  }
  state.isGenerating = true;

  const sessionId = requestedSessionId || `ws-${Date.now()}`;
  state.sessionId = sessionId;
  state.abortController = new AbortController();

  // Register this WebSocket for the session (for resilience)
  // Close any previous connection for this session first
  const previousGenWs = sessionConnections.get(sessionId);
  if (previousGenWs && previousGenWs !== state.ws && previousGenWs.readyState === WebSocket.OPEN) {
    console.log(`[WS] Closing previous connection for session ${sessionId} (new generate)`);
    previousGenWs.close(4001, 'Replaced by new connection');
  }
  sessionConnections.set(sessionId, state.ws);

  // Store abort controller by session (for cancel after reconnect)
  sessionAbortControllers.set(sessionId, state.abortController);

  console.log(`🚀 WebSocket: Starting generation for session ${sessionId}`);

  // Create or get campaign in database BEFORE sending ack
  // so the client receives the real DB campaign ID immediately.
  // DB operations are synchronous (better-sqlite3).
  const campaignName = extractCampaignName(prompt);
  try {
    let campaign = db.getCampaignBySessionId(sessionId);
    if (!campaign) {
      campaign = db.createCampaign(state.userId, campaignName, sessionId);
      console.log(`💾 DB: Created campaign ${campaign.id} for session ${sessionId}`);
    } else {
      console.log(`💾 DB: Using existing campaign ${campaign.id} for session ${sessionId}`);
    }
    state.campaignId = campaign.id;

    // Persist user message (prompt) to DB
    try {
      db.addMessage({
        campaignId: campaign.id,
        role: 'user',
        content: prompt,
      });
      console.log(`💾 DB: Saved user message for campaign ${campaign.id}`);
    } catch (msgError) {
      console.error('❌ DB: Failed to save user message:', msgError);
    }
  } catch (dbError) {
    console.error('❌ DB: Failed to create campaign:', dbError);
    // Continue without database - WebSocket still works
  }

  // Send acknowledgment with the DB campaign ID so the client
  // can replace its local placeholder ID with the real one.
  emitEvent(sessionId, {
    type: 'ack',
    timestamp: new Date().toISOString(),
    message: 'Generation started',
    sessionId,
    campaignId: state.campaignId || undefined,
  });

  // Send initial phase
  broadcastToConnection(state, {
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'parse',
    label: 'Parsing Request'
  });

  const startTime = Date.now();
  let wasCancelled = false;
  let apiError: string | null = null; // SDK API error: 'billing_error', 'rate_limit', etc.

  // Real-time image event handling — dedup by filename, server assigns global index
  const processedFilenames = new Set<string>();
  const imageCounter = { next: 1 };
  let generationCompleted = false;

  // Accumulate AI text for DB persistence
  const textAccumulator: TextAccumulator = { text: '' };

  // Build blocks for DB persistence
  const blockBuilder = new BlockBuilder();
  blockBuilder.openThinkingBlock('Parsing Request');

  const onImageSaved = (event: ImageSavedEvent) => {
    const wsId = resolveWsSessionId(event.sessionId) || event.sessionId;
    if (wsId !== sessionId) return;
    // Dedup by filename (unique per image across all MCP batches)
    if (processedFilenames.has(event.filename)) return;
    processedFilenames.add(event.filename);

    // Server assigns global index (not MCP's per-batch index)
    const globalIndex = imageCounter.next++;
    const hookType = getHookTypeForIndex(globalIndex);

    console.log(`[ImageEvent] Real-time image ${globalIndex} for session ${sessionId} (file: ${event.filename})`);

    broadcastToConnection(state, {
      type: 'image',
      timestamp: new Date().toISOString(),
      id: `image_${globalIndex}`,
      urlPath: event.urlPath,
      prompt: event.prompt,
      filename: event.filename,
      hookType,
      imageIndex: globalIndex,
    });

    if (state.campaignId) {
      try {
        db.addCampaignImage({
          campaignId: state.campaignId,
          imageIndex: globalIndex,
          hookType: hookType as db.HookType,
          prompt: event.prompt || undefined,
          filePath: event.urlPath,
        });
        console.log(`💾 DB: Saved image ${globalIndex} (${hookType}) for campaign ${state.campaignId} [via EventEmitter]`);
      } catch (dbError) {
        console.error(`❌ DB: Failed to save image via EventEmitter:`, dbError);
      }
    }

    // Track image completion in block builder
    blockBuilder.incrementCompletedImages();
  };

  imageEvents.on('image-saved', onImageSaved);

  try {
    // Initialize session
    await sessionManager.getOrCreateSession(sessionId, {
      status: 'active',
      context: { userPrompt: prompt }
    });

    // Initialize instrumentation
    const instrumentor = new SDKInstrumentor(sessionId, prompt, 'websocket');

    // Resolve asset file attachments for multimodal input + fal.ai public URLs
    let resolvedAttachments: ResolvedAssets['attachments'] | undefined;
    let aiPrompt = prompt;
    if (assetFileIds && assetFileIds.length > 0) {
      console.log(`📎 [ASSET DEBUG] Resolving ${assetFileIds.length} asset file(s): ${JSON.stringify(assetFileIds)}`);
      const resolved = await resolveAssetAttachments(assetFileIds);
      console.log(`📎 [ASSET DEBUG] Resolved: ${resolved.attachments.length} base64 attachment(s), ${resolved.referenceUrls.length} fal.ai URL(s)`);
      if (resolved.referenceUrls.length > 0) {
        console.log(`📎 [ASSET DEBUG] fal.ai URLs:\n${resolved.referenceUrls.map((u, i) => `   ${i + 1}. ${u}`).join('\n')}`);
      }
      resolvedAttachments = resolved.attachments.length > 0 ? resolved.attachments : undefined;
      if (resolved.referenceUrls.length > 0) {
        aiPrompt = `${prompt}\n\n## Reference Image URLs (pass these as referenceImageUrls to generate_ad_images)\n${resolved.referenceUrls.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')}`;
      }
      console.log(`📎 [ASSET DEBUG] Final prompt injected:\n${aiPrompt.slice(-300)}`);
    } else {
      console.log(`📎 [ASSET DEBUG] No assetFileIds — generating without reference images`);
    }

    // Process SDK stream — pass the handler's abort controller so cancel
    // actually terminates the SDK query (including long-running tool calls)
    for await (const result of aiClient.queryWithSession(aiPrompt, sessionId, undefined, resolvedAttachments, state.abortController!)) {
      // Check for cancellation (only if we haven't already completed)
      if (state.abortController?.signal.aborted && !generationCompleted) {
        wasCancelled = true;
        console.log(`⚠️ WebSocket: Generation cancelled for session ${sessionId}`);
        broadcastToConnection(state, {
          type: 'status',
          timestamp: new Date().toISOString(),
          message: 'Generation cancelled'
        });
        break;
      }

      const { message } = result;
      processSDKMessage(message, state, instrumentor, processedFilenames, textAccumulator, blockBuilder, imageCounter);

      // Detect SDK API errors (billing, rate limit, etc.) on assistant messages.
      // These arrive BEFORE the result message and indicate the process will crash.
      if (message.type === 'assistant' && message.error) {
        apiError = message.error;
        console.warn(`⚠️ SDK API error detected: ${message.error} for session ${sessionId}`);
      }

      // SDK 'result' message = conversation finished.
      // Send completion immediately for responsive UX. The for-await loop
      // will exit naturally after this (no more messages from the SDK).
      // Skip if an API error was detected — the result is not a real completion.
      if (message.type === 'result' && !generationCompleted && !wasCancelled && !apiError) {
        generationCompleted = true;
        const duration = Date.now() - startTime;

        broadcastToConnection(state, {
          type: 'phase',
          timestamp: new Date().toISOString(),
          phase: 'complete',
          label: 'Complete'
        });

        const imageCount = imageCounter.next - 1;
        const hookTypeLabels: Record<HookType, string> = {
          stat: 'Stat Hook', story: 'Story Hook', fomo: 'FOMO Hook',
          curiosity: 'Curiosity Hook', callout: 'Call-out Hook', contrast: 'Contrast Hook'
        };
        const generatedHooks = HOOK_TYPE_ORDER.slice(0, imageCount).map(h => hookTypeLabels[h]);
        const fallbackSummary = imageCount > 0
          ? `I created ${imageCount} ad concept${imageCount > 1 ? 's' : ''}:\n${generatedHooks.map(h => `• ${h}`).join('\n')}`
          : 'Generation complete.';
        // Use accumulated AI text if available, otherwise fallback
        const summary = textAccumulator.text.trim() || fallbackSummary;

        broadcastToConnection(state, {
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId,
          duration,
          imageCount,
          message: `Generation complete in ${(duration / 1000).toFixed(1)}s`,
          summary,
        });

        console.log(`✅ WebSocket: Generation complete for session ${sessionId} (${duration}ms, ${imageCount} images)`);

        if (state.campaignId) {
          try {
            db.updateCampaignStatus(state.campaignId, 'complete');
            // Add text block for summary and get final blocks
            blockBuilder.addTextBlock(summary);
            db.addMessage({
              campaignId: state.campaignId,
              role: 'assistant',
              content: summary,
              blocks: blockBuilder.getBlocks(),
            });
            console.log(`💾 DB: Campaign ${state.campaignId} marked as complete, summary + blocks saved`);
          } catch (dbError) {
            console.error('❌ DB: Failed to update campaign status:', dbError);
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Only send completion if not cancelled AND not already completed inline
    if (!wasCancelled && !generationCompleted) {
      broadcastToConnection(state, {
        type: 'phase',
        timestamp: new Date().toISOString(),
        phase: 'complete',
        label: 'Complete'
      });

      // Generate summary message for assistant (use accumulated text if available)
      const imageCount = imageCounter.next - 1;
      const hookTypeLabels: Record<HookType, string> = {
        stat: 'Stat Hook', story: 'Story Hook', fomo: 'FOMO Hook',
        curiosity: 'Curiosity Hook', callout: 'Call-out Hook', contrast: 'Contrast Hook'
      };
      const generatedHooks = HOOK_TYPE_ORDER.slice(0, imageCount).map(h => hookTypeLabels[h]);
      const fallbackSummary = imageCount > 0
        ? `I created ${imageCount} ad concept${imageCount > 1 ? 's' : ''}:\n${generatedHooks.map(h => `• ${h}`).join('\n')}`
        : 'Generation complete.';
      // Use accumulated AI text if available, otherwise fallback
      const summary = textAccumulator.text.trim() || fallbackSummary;

      broadcastToConnection(state, {
        type: 'complete',
        timestamp: new Date().toISOString(),
        sessionId,
        duration,
        imageCount,
        message: `Generation complete in ${(duration / 1000).toFixed(1)}s`,
        summary,
      });

      console.log(`✅ WebSocket: Generation complete for session ${sessionId} (${duration}ms, ${imageCount} images)`);

      // Update campaign status and save assistant message
      if (state.campaignId) {
        try {
          db.updateCampaignStatus(state.campaignId, 'complete');
          // Add text block for summary and get final blocks
          blockBuilder.addTextBlock(summary);
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: summary,
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as complete, summary + blocks saved`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    } else if (wasCancelled && !generationCompleted) {
      console.log(`🛑 WebSocket: Generation stopped for session ${sessionId} (cancelled after ${(duration / 1000).toFixed(1)}s)`);

      // Update campaign status and save cancel message
      if (state.campaignId) {
        try {
          db.updateCampaignStatus(state.campaignId, 'cancelled');
          // Add status block for cancellation
          blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: 'Generation was cancelled.',
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as cancelled`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    }
    // If generationCompleted: already handled inline, nothing to do here

  } catch (error: any) {
    // If generation completed cleanly (no API error), the exit code 1 is just cleanup noise
    if (generationCompleted && !apiError) {
      // Fall through to finally block for cleanup
      return;
    }

    // AbortError means the user cancelled — treat as cancellation, not error
    const isAbort = error.name === 'AbortError' || state.abortController?.signal.aborted;

    if (isAbort) {
      const duration = Date.now() - startTime;
      console.log(`🛑 WebSocket: Generation cancelled (via AbortError) for session ${sessionId} (${(duration / 1000).toFixed(1)}s)`);

      broadcastToConnection(state, {
        type: 'status',
        timestamp: new Date().toISOString(),
        message: 'Generation cancelled'
      });

      if (state.campaignId) {
        try {
          db.updateCampaignStatus(state.campaignId, 'cancelled');
          blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: 'Generation was cancelled.',
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as cancelled`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    } else if (apiError) {
      // SDK API error (billing, rate limit, auth, etc.) — mark incomplete, keep sdk_session_id.
      // The JSONL is valid and resume will work when the transient issue resolves.
      const friendlyMessages: Record<string, string> = {
        billing_error: 'Credit balance is too low — generation will resume when credits are available.',
        rate_limit: 'Rate limit reached — generation will resume on your next message.',
        authentication_failed: 'Authentication error — please check your API key.',
        server_error: 'Anthropic server error — generation will resume on your next message.',
      };
      const friendlyMsg = friendlyMessages[apiError] || `Generation interrupted: ${apiError}`;

      console.warn(`⚠️ WebSocket: Generation interrupted by API error (${apiError}) for session ${sessionId}`);

      broadcastToConnection(state, {
        type: 'incomplete',
        timestamp: new Date().toISOString(),
        error: apiError,
        message: friendlyMsg,
      });

      if (state.campaignId) {
        try {
          db.updateCampaignStatus(state.campaignId, 'incomplete');
          blockBuilder.addStatusBlock(friendlyMsg, 'error');
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: friendlyMsg,
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as incomplete (${apiError})`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    } else {
      console.error(`❌ WebSocket: Generation error for session ${sessionId}:`, error);

      broadcastToConnection(state, {
        type: 'error',
        timestamp: new Date().toISOString(),
        error: error.message || 'Unknown error occurred'
      });

      if (state.campaignId) {
        try {
          const errorMsg = `Error: ${error.message || 'Unknown error occurred'}`;
          db.updateCampaignStatus(state.campaignId, 'error');
          blockBuilder.addStatusBlock(errorMsg, 'error');
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: errorMsg,
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as error`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    }
  } finally {
    state.isGenerating = false;
    imageEvents.removeListener('image-saved', onImageSaved);
    unregisterByWsSession(sessionId);
    state.abortController = null;
    if (sessionId) {
      sessionAbortControllers.delete(sessionId);
      // Clear event buffer after grace period (allows late reconnects to replay).
      // Guard: if a follow-up reuses this sessionId, its abort controller will be
      // registered — skip the clear so we don't destroy the follow-up's active buffer.
      setTimeout(() => {
        if (!sessionAbortControllers.has(sessionId)) {
          clearBuffer(sessionId);
        }
      }, 60_000);
    }
  }
}

async function handleFollowUp(state: ConnectionState, prompt: string, campaignId: string, assetFileIds?: string[]) {
  // Concurrency guard — reject if already processing
  if (state.isGenerating) {
    send(state.ws, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'A generation is already in progress. Please wait or cancel first.'
    });
    return;
  }
  state.isGenerating = true;

  // Track the session ID set by THIS invocation so the finally block
  // only cleans up what we created.
  let localSessionId: string | null = null;
  let onImageSaved: ((event: ImageSavedEvent) => void) | null = null;

  // Build blocks for DB persistence (declared outside try for catch block access)
  const blockBuilder = new BlockBuilder();
  blockBuilder.openThinkingBlock('Processing Follow-up');

  // Declared outside try so catch block can access them
  let generationCompleted = false;
  let apiError: string | null = null;

  try {
    // 1. Look up campaign and SDK session ID
    const campaign = db.getCampaignById(campaignId, state.userId);
    if (!campaign) {
      send(state.ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
      return;
    }

    // Always attempt to load SDK session ID for resume — the AI client has
    // fallback logic (try resume → fall back to fresh session if JSONL is invalid).
    const sdkSessionId = db.getSdkSessionId(campaignId);
    if (!sdkSessionId) {
      console.log(`⚠️ No SDK session for campaign ${campaignId} (status: ${campaign.status}) — will start fresh`);
    }

    if (!campaign.session_id) {
      send(state.ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Campaign has no session' });
      return;
    }

    const wsSessionId = campaign.session_id;
    localSessionId = wsSessionId;

    // 2. Set up connection state
    state.sessionId = wsSessionId;
    state.campaignId = campaignId;
    state.abortController = new AbortController();
    sessionAbortControllers.set(wsSessionId, state.abortController);

    // Register this WebSocket for the session
    const previousWs = sessionConnections.get(wsSessionId);
    if (previousWs && previousWs !== state.ws && previousWs.readyState === WebSocket.OPEN) {
      previousWs.close(4001, 'Replaced by new connection');
    }
    sessionConnections.set(wsSessionId, state.ws);

    // 3. Clear stale events from previous generation (e.g. cancel events
    //    that would poison recovery replay for this follow-up).
    clearBuffer(wsSessionId);

    // 4. Persist user message to DB
    db.addMessage({ campaignId, role: 'user', content: prompt });

    // 5. Update campaign status
    db.updateCampaignStatus(campaignId, 'generating');

    // 6. Send ack to client
    emitEvent(wsSessionId, {
      type: 'ack',
      timestamp: new Date().toISOString(),
      sessionId: wsSessionId,
      campaignId,
    });

    console.log(`💬 WebSocket: Starting follow-up for campaign ${campaignId}, session ${wsSessionId}`);

    // 6. Register image event listener (same pattern as handleGenerate)
    const processedFilenames = new Set<string>();
    const existingImageCount = db.getImageCount(campaignId);
    const imageCounter = { next: existingImageCount + 1 };

    // Accumulate AI text for DB persistence
    const textAccumulator: TextAccumulator = { text: '' };

    onImageSaved = (event: ImageSavedEvent) => {
      const wsId = resolveWsSessionId(event.sessionId) || event.sessionId;
      if (wsId !== wsSessionId) return;
      // Dedup by filename (unique per image across all MCP batches)
      if (processedFilenames.has(event.filename)) return;
      processedFilenames.add(event.filename);

      // Server assigns global index (continues from existing images)
      const globalIndex = imageCounter.next++;
      const hookType = getHookTypeForIndex(globalIndex);

      broadcastToConnection(state, {
        type: 'image',
        timestamp: new Date().toISOString(),
        id: `image_${globalIndex}`,
        urlPath: event.urlPath,
        prompt: event.prompt,
        filename: event.filename,
        hookType,
        imageIndex: globalIndex,
      });

      if (state.campaignId) {
        try {
          db.addCampaignImage({
            campaignId: state.campaignId,
            imageIndex: globalIndex,
            hookType: hookType as db.HookType,
            prompt: event.prompt || undefined,
            filePath: event.urlPath,
          });
        } catch (dbError) {
          console.error('DB: Failed to save image via EventEmitter:', dbError);
        }
      }
      blockBuilder.incrementCompletedImages();
    };

    imageEvents.on('image-saved', onImageSaved);

    // 7. Initialize instrumentation
    const instrumentor = new SDKInstrumentor(wsSessionId, prompt, 'websocket');

    // 8. Resolve asset attachments and call AI with resume
    let resolvedAttachments: ResolvedAssets['attachments'] | undefined;
    let aiPrompt = prompt;
    if (assetFileIds && assetFileIds.length > 0) {
      console.log(`📎 [ASSET DEBUG] Follow-up resolving ${assetFileIds.length} asset file(s): ${JSON.stringify(assetFileIds)}`);
      const resolved = await resolveAssetAttachments(assetFileIds);
      console.log(`📎 [ASSET DEBUG] Follow-up resolved: ${resolved.attachments.length} base64, ${resolved.referenceUrls.length} fal.ai URL(s)`);
      if (resolved.referenceUrls.length > 0) {
        console.log(`📎 [ASSET DEBUG] fal.ai URLs:\n${resolved.referenceUrls.map((u, i) => `   ${i + 1}. ${u}`).join('\n')}`);
      }
      resolvedAttachments = resolved.attachments.length > 0 ? resolved.attachments : undefined;
      if (resolved.referenceUrls.length > 0) {
        aiPrompt = `${prompt}\n\n## Reference Image URLs (pass these as referenceImageUrls to generate_ad_images)\n${resolved.referenceUrls.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')}`;
      }
      console.log(`📎 [ASSET DEBUG] Follow-up final prompt tail:\n${aiPrompt.slice(-300)}`);
    } else {
      console.log(`📎 [ASSET DEBUG] Follow-up — no assetFileIds`);
    }

    let wasCancelled = false;
    const startTime = Date.now();

    for await (const result of aiClient.queryWithSession(
      aiPrompt,
      wsSessionId,
      undefined,
      resolvedAttachments,
      state.abortController,
      sdkSessionId ?? undefined
    )) {
      if (state.abortController?.signal.aborted && !generationCompleted) {
        wasCancelled = true;
        break;
      }

      const { message } = result;
      processSDKMessage(message, state, instrumentor, processedFilenames, textAccumulator, blockBuilder, imageCounter);

      // Detect SDK API errors (billing, rate limit, etc.) on assistant messages.
      if (message.type === 'assistant' && message.error) {
        apiError = message.error;
        console.warn(`⚠️ SDK API error detected: ${message.error} for campaign ${campaignId}`);
      }

      // Skip if an API error was detected — the result is not a real completion.
      if (message.type === 'result' && !generationCompleted && !wasCancelled && !apiError) {
        generationCompleted = true;
        const duration = Date.now() - startTime;
        const imageCount = imageCounter.next - 1 - existingImageCount;
        // Use accumulated AI text if available, otherwise fallback
        const summary = textAccumulator.text.trim() || 'Follow-up completed.';

        broadcastToConnection(state, {
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId: wsSessionId,
          duration,
          imageCount,
          message: `Follow-up complete in ${(duration / 1000).toFixed(1)}s`,
          summary,
        });

        if (state.campaignId) {
          db.updateCampaignStatus(state.campaignId, 'complete');
          blockBuilder.addTextBlock(summary);
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: summary,
            blocks: blockBuilder.getBlocks(),
          });
        }

        console.log(`✅ WebSocket: Follow-up complete for campaign ${campaignId} (${duration}ms)`);
      }
    }

    // Handle silent stream end (SDK finished without 'result' message)
    if (!generationCompleted && !wasCancelled) {
      const duration = Date.now() - startTime;
      const imageCount = imageCounter.next - 1 - existingImageCount;
      const summary = textAccumulator.text.trim() || 'Follow-up completed.';

      broadcastToConnection(state, {
        type: 'complete',
        timestamp: new Date().toISOString(),
        sessionId: wsSessionId,
        duration,
        imageCount,
        message: `Follow-up complete in ${(duration / 1000).toFixed(1)}s`,
        summary,
      });

      if (state.campaignId) {
        db.updateCampaignStatus(state.campaignId, 'complete');
        blockBuilder.addTextBlock(summary);
        db.addMessage({
          campaignId: state.campaignId,
          role: 'assistant',
          content: summary,
          blocks: blockBuilder.getBlocks(),
        });
      }

      console.log(`✅ WebSocket: Follow-up complete (fallback) for campaign ${campaignId} (${duration}ms)`);
    }

    // Handle cancellation (if cancelled but no error thrown)
    if (wasCancelled && !generationCompleted && state.campaignId) {
      db.updateCampaignStatus(state.campaignId, 'cancelled');
      blockBuilder.addStatusBlock('Follow-up was cancelled.', 'info');
      db.addMessage({
        campaignId: state.campaignId,
        role: 'assistant',
        content: 'Follow-up was cancelled.',
        blocks: blockBuilder.getBlocks(),
      });
      console.log(`🛑 WebSocket: Follow-up cancelled for campaign ${campaignId}`);
    }

  } catch (err) {
    // If follow-up completed cleanly (no API error), the exit code 1 is just cleanup noise
    if (generationCompleted && !apiError) {
      return;
    }

    const isAbort = (err instanceof Error && err.name === 'AbortError') || state.abortController?.signal.aborted;

    if (isAbort) {
      if (state.campaignId) {
        db.updateCampaignStatus(state.campaignId, 'cancelled');
        blockBuilder.addStatusBlock('Follow-up was cancelled.', 'info');
        db.addMessage({
          campaignId: state.campaignId,
          role: 'assistant',
          content: 'Follow-up was cancelled.',
          blocks: blockBuilder.getBlocks(),
        });
      }
    } else if (apiError) {
      // SDK API error (billing, rate limit, auth, etc.) — mark incomplete, keep sdk_session_id.
      const friendlyMessages: Record<string, string> = {
        billing_error: 'Credit balance is too low — generation will resume when credits are available.',
        rate_limit: 'Rate limit reached — generation will resume on your next message.',
        authentication_failed: 'Authentication error — please check your API key.',
        server_error: 'Anthropic server error — generation will resume on your next message.',
      };
      const friendlyMsg = friendlyMessages[apiError] || `Generation interrupted: ${apiError}`;

      console.warn(`⚠️ WebSocket: Follow-up interrupted by API error (${apiError}) for campaign ${campaignId}`);

      broadcastToConnection(state, {
        type: 'incomplete',
        timestamp: new Date().toISOString(),
        error: apiError,
        message: friendlyMsg,
      });

      if (state.campaignId) {
        try {
          db.updateCampaignStatus(state.campaignId, 'incomplete');
          blockBuilder.addStatusBlock(friendlyMsg, 'error');
          db.addMessage({
            campaignId: state.campaignId,
            role: 'assistant',
            content: friendlyMsg,
            blocks: blockBuilder.getBlocks(),
          });
          console.log(`💾 DB: Campaign ${state.campaignId} marked as incomplete (${apiError})`);
        } catch (dbError) {
          console.error('❌ DB: Failed to update campaign status:', dbError);
        }
      }
    } else {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      broadcastToConnection(state, { type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
      if (state.campaignId) {
        db.updateCampaignStatus(state.campaignId, 'error');
        blockBuilder.addStatusBlock(`Error: ${errorMsg}`, 'error');
        db.addMessage({
          campaignId: state.campaignId,
          role: 'assistant',
          content: `Error: ${errorMsg}`,
          blocks: blockBuilder.getBlocks(),
        });
      }
      console.error(`❌ WebSocket: Follow-up error for campaign ${campaignId}:`, err);
    }
  } finally {
    state.isGenerating = false;
    if (localSessionId) {
      const sid = localSessionId;
      sessionAbortControllers.delete(sid);
      unregisterByWsSession(sid);
      // Clear event buffer after grace period (allows late reconnects to replay).
      // Guard: if another follow-up reuses this sessionId, skip the clear.
      setTimeout(() => {
        if (!sessionAbortControllers.has(sid)) {
          clearBuffer(sid);
        }
      }, 60_000);
    }
    state.abortController = null;
    if (onImageSaved) {
      imageEvents.removeListener('image-saved', onImageSaved);
    }
  }
}

function handleCancel(state: ConnectionState) {
  // Try session-based abort controller first (works after reconnect)
  const sessionAbort = state.sessionId ? sessionAbortControllers.get(state.sessionId) : null;
  const abortController = sessionAbort || state.abortController;

  if (abortController) {
    console.log(`🛑 WebSocket: Cancelling generation for session ${state.sessionId}`);
    abortController.abort();

    send(state.ws, {
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Cancel requested'
    });
  } else {
    console.log(`⚠️ WebSocket: No generation to cancel for session ${state.sessionId}`);
  }
}

function handlePing(state: ConnectionState) {
  send(state.ws, {
    type: 'pong',
    timestamp: new Date().toISOString()
  });
}

function handleSubscribe(state: ConnectionState, sessionId?: string, lastEventId?: number) {
  if (!sessionId) {
    send(state.ws, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'Session ID required for subscribe'
    });
    return;
  }

  console.log(`[WS] Client subscribing to session ${sessionId}, lastEventId: ${lastEventId ?? 0}`);

  // Check if this session exists/has events
  if (!hasBuffer(sessionId)) {
    send(state.ws, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: 'Session not found or expired'
    });
    return;
  }

  // Attach this WebSocket to the session
  // Close any previous connection for this session first
  const previousSubWs = sessionConnections.get(sessionId);
  if (previousSubWs && previousSubWs !== state.ws && previousSubWs.readyState === WebSocket.OPEN) {
    console.log(`[WS] Closing previous connection for session ${sessionId} (replaced by new subscriber)`);
    previousSubWs.close(4001, 'Replaced by new connection');
  }
  state.sessionId = sessionId;
  sessionConnections.set(sessionId, state.ws);

  // Link campaign if it exists in database
  try {
    const campaign = db.getCampaignBySessionId(sessionId);
    if (campaign) {
      state.campaignId = campaign.id;
      console.log(`[WS] Linked to existing campaign ${campaign.id}`);
    }
  } catch (dbError) {
    console.error('[WS] Failed to look up campaign:', dbError);
  }

  // Link abort controller so cancel works after reconnect
  const existingAbort = sessionAbortControllers.get(sessionId);
  if (existingAbort) {
    state.abortController = existingAbort;
  }

  // Replay missed events
  const missedEvents = getEventsSince(sessionId, lastEventId ?? 0);
  console.log(`[WS] Replaying ${missedEvents.length} missed events`);

  for (const entry of missedEvents) {
    send(state.ws, { ...entry.event, id: entry.id } as ServerMessage);
  }

  // Send subscription confirmation with current status
  const isComplete = missedEvents.some(e =>
    e.event.type === 'complete' || e.event.type === 'error'
  );

  send(state.ws, {
    type: 'subscribed',
    timestamp: new Date().toISOString(),
    sessionId,
    message: `Replayed ${missedEvents.length} events`,
    success: true
  } as ServerMessage);

  console.log(`[WS] Client subscribed to session ${sessionId}, status: ${isComplete ? 'completed' : 'running'}`);
}

export function initWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('🔌 WebSocket server initialized on /ws');

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    // Extract and verify user ID from auth token in query parameter
    let userId = 'anonymous';
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      const verified = await verifyWebSocketToken(token);

      if (verified === null) {
        // Production: invalid token → reject connection
        send(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Authentication failed' });
        ws.close(4401, 'Authentication failed');
        return;
      }

      userId = verified;
      console.log(`🔗 WebSocket: Client connected (user: ${userId})`);
    } catch {
      console.log('🔗 WebSocket: Client connected (auth error, using anonymous)');
    }

    // Initialize connection state
    const state: ConnectionState = {
      ws,
      sessionId: null,
      campaignId: null,
      userId,
      abortController: null,
      isGenerating: false,
      heartbeatInterval: null
    };

    connections.set(ws, state);

    // Send connection acknowledgment
    send(ws, {
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Connected to Creative Machine'
    });

    // Setup heartbeat (30 seconds)
    state.heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    // Handle incoming messages
    ws.on('message', async (data: Buffer) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'generate':
            if (message.prompt) {
              console.log(`📎 [ASSET DEBUG] WS 'generate' received — assetFileIds: ${JSON.stringify(message.assetFileIds || [])}`);
              handleGenerate(state, message.prompt, message.sessionId, message.assetFileIds);
            }
            break;

          case 'cancel':
            handleCancel(state);
            break;

          case 'ping':
            handlePing(state);
            break;

          case 'subscribe':
            handleSubscribe(state, message.sessionId, message.lastEventId);
            break;

          case 'follow_up':
            if (message.prompt && message.campaignId) {
              console.log(`📎 [ASSET DEBUG] WS 'follow_up' received — assetFileIds: ${JSON.stringify(message.assetFileIds || [])}`);
              handleFollowUp(state, message.prompt, message.campaignId, message.assetFileIds);
            }
            break;

          default:
            console.warn('⚠️ WebSocket: Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('❌ WebSocket: Failed to parse message:', error);
        send(ws, {
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'Invalid message format'
        });
      }
    });

    // Handle close
    ws.on('close', () => {
      console.log(`🔌 WebSocket: Client disconnected from session ${state.sessionId ?? 'none'}`);

      // Cleanup heartbeat
      if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
      }

      // DO NOT abort generation - it continues in background
      // Events will be buffered for when client reconnects
      // Only clear the session's WebSocket reference if THIS socket is still the active one.
      // A newer connection may have already replaced us via handleSubscribe.
      if (state.sessionId) {
        if (sessionConnections.get(state.sessionId) === ws) {
          sessionConnections.set(state.sessionId, null);
        } else {
          console.log(`[WS] Stale close for session ${state.sessionId} — newer connection active, skipping nullify`);
        }
      }

      connections.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Handle pong responses
    ws.on('pong', () => {
      // Client is alive
    });
  });

  return wss;
}
