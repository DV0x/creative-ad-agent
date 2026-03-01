// CampaignSession Durable Object — one per user.
// Accepts WebSocket via Hibernation API, handles generate/follow_up/cancel/subscribe/ping.
// runGeneration() executes AI generation via Cloudflare Sandbox containers (Phase 4).

import type { Env } from '../env.js';
import type { ClientMessage, ServerMessage } from '../lib/types.js';
import { extractCampaignName, HOOK_TYPE_ORDER } from '../lib/types.js';
import { EventBuffer } from '../lib/event-buffer.js';
import { BlockBuilder } from '../lib/block-builder.js';
import { processSDKMessage, type TextAccumulator, type ParserContext } from '../lib/sdk-message-parser.js';
import * as db from '../db/index.js';
import { getSandbox } from '@cloudflare/sandbox';
import { fal } from '@fal-ai/client';

export class CampaignSession implements DurableObject {
  // Per-generation state (transient, lost on eviction — acceptable)
  private ws: WebSocket | null = null;
  private userId: string = 'anonymous';
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private isGenerating = false;
  private abortController: AbortController | null = null;
  private sandbox: any = null;
  private eventBuffer: EventBuffer = new EventBuffer();

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  // ─── WebSocket Hibernation API ────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    // Extract userId from internal header (Worker verifies JWT, passes to DO)
    this.userId = request.headers.get('X-User-Id') || 'anonymous';

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept with Hibernation API
    this.state.acceptWebSocket(server);
    this.ws = server;

    // Send initial ack
    this.sendWS({
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Connected to Creative Machine',
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    // Keep ws ref current
    this.ws = ws;

    let message: ClientMessage;
    try {
      message = JSON.parse(typeof data === 'string' ? data : new TextDecoder().decode(data));
    } catch {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Invalid message format' });
      return;
    }

    switch (message.type) {
      case 'generate':
        if (message.prompt) {
          await this.handleGenerate(message.prompt, message.sessionId, message.assetFileIds);
        }
        break;

      case 'follow_up':
        if (message.prompt && message.campaignId) {
          await this.handleFollowUp(message.prompt, message.campaignId, message.assetFileIds);
        }
        break;

      case 'cancel':
        this.handleCancel();
        break;

      case 'subscribe':
        this.handleSubscribe(ws, message.sessionId, message.lastEventId);
        break;

      case 'ping':
        this.handlePing();
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    console.log(`WS closed: session=${this.sessionId}, code=${code}, reason=${reason}`);
    // Clear ws ref — do NOT abort generation (it continues in background,
    // events are buffered for reconnect)
    if (this.ws === ws) {
      this.ws = null;
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WS error:', error);
    if (this.ws === ws) {
      this.ws = null;
    }
  }

  // ─── Message Handlers ─────────────────────────────────────────

  private async handleGenerate(prompt: string, requestedSessionId?: string, assetFileIds?: string[]): Promise<void> {
    if (this.isGenerating) {
      this.sendWS({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: 'A generation is already in progress. Please wait or cancel first.',
      });
      return;
    }
    this.isGenerating = true;

    const sessionId = requestedSessionId || `ws-${Date.now()}`;
    this.sessionId = sessionId;
    this.abortController = new AbortController();

    // Create campaign in D1
    const campaignName = extractCampaignName(prompt);
    try {
      let campaign = await db.getCampaignBySessionId(this.env.DB, sessionId);
      if (!campaign) {
        campaign = await db.createCampaign(this.env.DB, this.userId, campaignName, sessionId);
      }
      this.campaignId = campaign.id;

      // Persist user message
      await db.addMessage(this.env.DB, {
        campaignId: campaign.id,
        role: 'user',
        content: prompt,
      });
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }

    // Send ack with campaign ID
    this.emitEvent({
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Generation started',
      sessionId,
      campaignId: this.campaignId || undefined,
    });

    // Send initial phase
    this.emitEvent({
      type: 'phase',
      timestamp: new Date().toISOString(),
      phase: 'parse',
      label: 'Parsing Request',
    });

    // Resolve asset reference URLs and prepend to prompt
    let aiPrompt = prompt;
    if (assetFileIds && assetFileIds.length > 0) {
      const referenceUrls = await this.resolveAssetUrls(assetFileIds);
      if (referenceUrls.length > 0) {
        aiPrompt = `${prompt}\n\n## Reference Image URLs (pass these as referenceImageUrls to generate_ad_images)\n${referenceUrls.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')}`;
      }
    }

    // Run generation via sandbox
    await this.runGeneration(aiPrompt, sessionId);
  }

  private async handleFollowUp(prompt: string, campaignId: string, assetFileIds?: string[]): Promise<void> {
    if (this.isGenerating) {
      this.sendWS({
        type: 'error',
        timestamp: new Date().toISOString(),
        error: 'A generation is already in progress. Please wait or cancel first.',
      });
      return;
    }
    this.isGenerating = true;

    try {
      // Look up campaign
      const campaign = await db.getCampaignById(this.env.DB, campaignId, this.userId);
      if (!campaign) {
        this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
        return;
      }

      const sdkSessionId = await db.getSdkSessionId(this.env.DB, campaignId);
      if (!sdkSessionId) {
        console.log(`No SDK session for campaign ${campaignId} (status: ${campaign.status}) — will start fresh`);
      }

      if (!campaign.session_id) {
        this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign has no session' });
        return;
      }

      const wsSessionId = campaign.session_id;
      this.sessionId = wsSessionId;
      this.campaignId = campaignId;
      this.abortController = new AbortController();

      // Clear stale events from previous generation
      this.eventBuffer.clear();

      // Persist user message
      await db.addMessage(this.env.DB, { campaignId, role: 'user', content: prompt });

      // Update campaign status
      await db.updateCampaignStatus(this.env.DB, campaignId, 'generating');

      // Send ack
      this.emitEvent({
        type: 'ack',
        timestamp: new Date().toISOString(),
        sessionId: wsSessionId,
        campaignId,
      });

      // Resolve asset reference URLs and prepend to prompt
      let aiPrompt = prompt;
      if (assetFileIds && assetFileIds.length > 0) {
        const referenceUrls = await this.resolveAssetUrls(assetFileIds);
        if (referenceUrls.length > 0) {
          aiPrompt = `${prompt}\n\n## Reference Image URLs (pass these as referenceImageUrls to generate_ad_images)\n${referenceUrls.map((url, i) => `- Reference ${i + 1}: ${url}`).join('\n')}`;
        }
      }

      // Run generation with SDK session for resume
      await this.runGeneration(aiPrompt, wsSessionId, sdkSessionId ?? undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
      if (this.campaignId) {
        try {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
        } catch { /* ignore */ }
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  private handleCancel(): void {
    if (this.abortController) {
      console.log(`Cancelling generation for session ${this.sessionId}`);
      this.abortController.abort();
      if (this.sandbox) {
        this.sandbox.destroy().catch(() => {});
        this.sandbox = null;
      }
      this.sendWS({
        type: 'ack',
        timestamp: new Date().toISOString(),
        message: 'Cancel requested',
      });
    }
  }

  private handleSubscribe(ws: WebSocket, sessionId?: string, lastEventId?: number): void {
    if (!sessionId) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Session ID required for subscribe' });
      return;
    }

    if (!this.eventBuffer.hasEvents()) {
      this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Session not found or expired' });
      return;
    }

    // Attach this WebSocket
    this.ws = ws;
    this.sessionId = sessionId;

    // Replay missed events
    const missedEvents = this.eventBuffer.getEventsSince(lastEventId ?? 0);
    for (const entry of missedEvents) {
      this.sendWS({ ...entry.event, id: entry.id });
    }

    // Send subscription confirmation
    this.sendWS({
      type: 'subscribed',
      timestamp: new Date().toISOString(),
      sessionId,
      message: `Replayed ${missedEvents.length} events`,
      success: true,
    });
  }

  private handlePing(): void {
    this.sendWS({ type: 'pong', timestamp: new Date().toISOString() });
  }

  // ─── Generation (Phase 4: Sandbox execution) ─────────────────

  private async runGeneration(prompt: string, sessionId: string, sdkSessionId?: string): Promise<void> {
    // Local dev: bypass sandbox, run SDK in-process
    if (this.env.AI_BACKEND === 'local') {
      return this.runGenerationLocal(prompt, sessionId, sdkSessionId);
    }

    const startTime = Date.now();

    // Set up streaming state
    const blockBuilder = new BlockBuilder();
    blockBuilder.openThinkingBlock('Parsing Request');

    const textAccumulator: TextAccumulator = { text: '' };
    const processedFilenames = new Set<string>();
    const existingImageCount = this.campaignId
      ? (await db.getImageCount(this.env.DB, this.campaignId)) || 0
      : 0;
    const imageCounter = { next: existingImageCount + 1 };
    let generationCompleted = false;
    let wasCancelled = false;

    const ctx: ParserContext = {
      emitEvent: (event) => this.emitEvent(event),
      campaignId: this.campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
    };

    try {
      // 1. Get or create sandbox
      const sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId}`, {
        sleepAfter: '10m',
      });
      this.sandbox = sandbox;

      // 2. Mount R2 for per-user storage via S3-compatible FUSE
      await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
        endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        provider: 'r2',
        credentials: {
          accessKeyId: this.env.R2_ACCESS_KEY_ID,
          secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
        },
        readOnly: false,
        prefix: `users/${this.userId}`,
      });

      // 3. Start agent-runner with streaming
      const messageQueue: any[] = [];
      let execDone = false;

      const execPromise = sandbox.exec('npx tsx /app/agent-runner.ts', {
        cwd: '/app',
        env: {
          ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
          FAL_KEY: this.env.FAL_KEY,
          PROMPT: prompt,
          SESSION_ID: sessionId,
          RESUME_SDK_SESSION_ID: sdkSessionId || '',
          CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
          CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
          HOME: '/mnt/r2',
          IMAGE_OUTPUT_DIR: '/mnt/r2/images',
        },
        stream: true,
        onOutput: (stream: string, data: string) => {
          if (stream === 'stdout') {
            for (const line of data.split('\n').filter(Boolean)) {
              try { messageQueue.push(JSON.parse(line)); } catch { /* non-JSON line, skip */ }
            }
          } else if (stream === 'stderr') {
            console.error('Sandbox stderr:', data);
          }
        },
      }).then((result: any) => {
        execDone = true;
        return result;
      });

      // 4. Concurrent drain loop — process messages as they arrive
      while (true) {
        if (messageQueue.length > 0) {
          const msg = messageQueue.shift()!;

          // Check for abort
          if (this.abortController?.signal.aborted) {
            wasCancelled = true;
            break;
          }

          await processSDKMessage(msg, ctx);

          // Detect completion
          if (msg.type === 'result' && !wasCancelled) {
            generationCompleted = true;
          }
        } else if (execDone) {
          break;
        } else {
          // Yield to let exec fill queue
          await new Promise(r => setTimeout(r, 10));
        }
      }

      // 5. Wait for exec to finish (should already be done)
      const result = await execPromise;

      // 6. Drain any remaining messages
      while (messageQueue.length > 0) {
        const msg = messageQueue.shift()!;
        await processSDKMessage(msg, ctx);
        if (msg.type === 'result') generationCompleted = true;
      }

      // 7. Handle completion
      if (generationCompleted && this.campaignId) {
        const duration = Date.now() - startTime;
        const imageCount = imageCounter.next - 1;
        const summary = this.generateSummary(textAccumulator, imageCounter);

        this.emitEvent({
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId,
          campaignId: this.campaignId,
          duration,
          imageCount,
          summary,
        });

        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'complete');
        blockBuilder.closeThinkingBlock('complete');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: summary || 'Generation complete.',
          blocks: blockBuilder.getBlocks(),
        });
      } else if (!wasCancelled && !generationCompleted && this.campaignId) {
        // Stream ended without a result message
        this.emitEvent({
          type: 'incomplete',
          timestamp: new Date().toISOString(),
          error: 'generation_ended_unexpectedly',
        });
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');
      }

      if (wasCancelled && this.campaignId) {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
        blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: 'Generation was cancelled.',
          blocks: blockBuilder.getBlocks(),
        });
      }

    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        wasCancelled = true;
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
          blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId,
            role: 'assistant',
            content: 'Generation was cancelled.',
            blocks: blockBuilder.getBlocks(),
          });
        }
      } else {
        const errorMsg = error.message || 'Unknown error';
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
          blockBuilder.addStatusBlock(`Error: ${errorMsg}`, 'error');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId,
            role: 'assistant',
            content: `Error: ${errorMsg}`,
            blocks: blockBuilder.getBlocks(),
          });
        }
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
      this.sandbox = null;
    }
  }

  // ─── Local Dev Generation (in-process SDK) ──────────────────

  private async runGenerationLocal(prompt: string, sessionId: string, sdkSessionId?: string): Promise<void> {
    const startTime = Date.now();

    const blockBuilder = new BlockBuilder();
    blockBuilder.openThinkingBlock('Parsing Request');

    const textAccumulator: TextAccumulator = { text: '' };
    const processedFilenames = new Set<string>();
    const existingImageCount = this.campaignId
      ? (await db.getImageCount(this.env.DB, this.campaignId)) || 0
      : 0;
    const imageCounter = { next: existingImageCount + 1 };
    let generationCompleted = false;
    let wasCancelled = false;

    const ctx: ParserContext = {
      emitEvent: (event) => this.emitEvent(event),
      campaignId: this.campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
    };

    try {
      const { runLocalGeneration } = await import('../lib/local-ai-runner.js');

      const generator = runLocalGeneration(prompt, sessionId, sdkSessionId, {
        apiKey: this.env.ANTHROPIC_API_KEY,
        falKey: this.env.FAL_KEY,
        imageOutputDir: './generated-images',
      });

      for await (const msg of generator) {
        if (this.abortController?.signal.aborted) {
          wasCancelled = true;
          break;
        }

        await processSDKMessage(msg, ctx);

        if (msg.type === 'result' && !wasCancelled) {
          generationCompleted = true;
        }
      }

      // Handle completion
      if (generationCompleted && this.campaignId) {
        const duration = Date.now() - startTime;
        const imageCount = imageCounter.next - 1;
        const summary = this.generateSummary(textAccumulator, imageCounter);

        this.emitEvent({
          type: 'complete',
          timestamp: new Date().toISOString(),
          sessionId,
          campaignId: this.campaignId,
          duration,
          imageCount,
          summary,
        });

        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'complete');
        blockBuilder.closeThinkingBlock('complete');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: summary || 'Generation complete.',
          blocks: blockBuilder.getBlocks(),
        });
      } else if (!wasCancelled && !generationCompleted && this.campaignId) {
        this.emitEvent({
          type: 'incomplete',
          timestamp: new Date().toISOString(),
          error: 'generation_ended_unexpectedly',
        });
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');
      }

      if (wasCancelled && this.campaignId) {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
        blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: 'Generation was cancelled.',
          blocks: blockBuilder.getBlocks(),
        });
      }
    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
          blockBuilder.addStatusBlock('Generation was cancelled.', 'info');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId,
            role: 'assistant',
            content: 'Generation was cancelled.',
            blocks: blockBuilder.getBlocks(),
          });
        }
      } else {
        const errorMsg = error.message || 'Unknown error';
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
          blockBuilder.addStatusBlock(`Error: ${errorMsg}`, 'error');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId,
            role: 'assistant',
            content: `Error: ${errorMsg}`,
            blocks: blockBuilder.getBlocks(),
          });
        }
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  // ─── Asset Resolution ────────────────────────────────────────

  /** Resolve asset file IDs → R2 objects → fal.ai public URLs for reference images */
  private async resolveAssetUrls(assetFileIds: string[]): Promise<string[]> {
    const urls: string[] = [];

    fal.config({ credentials: this.env.FAL_KEY });

    for (const fileId of assetFileIds) {
      try {
        const file = await db.getFile(this.env.DB, fileId);
        if (!file) {
          console.warn(`Asset file not found: ${fileId}`);
          continue;
        }

        if (file.file_type !== 'image') {
          console.log(`Skipping non-image asset: ${fileId} (type: ${file.file_type})`);
          continue;
        }

        // Read from R2 (file_path is relative, e.g. "folder-xxx/image.png")
        const r2Key = `users/${this.userId}/uploads/${file.file_path}`;
        const r2Object = await this.env.R2_BUCKET.get(r2Key);
        if (!r2Object) {
          console.warn(`R2 object not found: ${r2Key}`);
          continue;
        }

        // Upload to fal.ai storage to get a public URL
        const blob = await r2Object.blob();
        const uploadFile = new File([blob], file.name, { type: r2Object.httpMetadata?.contentType || 'image/png' });
        const publicUrl = await fal.storage.upload(uploadFile);
        urls.push(publicUrl);
        console.log(`Resolved asset: ${file.name} → ${publicUrl}`);
      } catch (err) {
        console.error(`Failed to resolve asset ${fileId}:`, err);
      }
    }

    return urls;
  }

  // ─── Helpers ──────────────────────────────────────────────────

  /** Emit an event: buffer it AND send to connected WS */
  private emitEvent(event: ServerMessage): void {
    const eventId = this.eventBuffer.append(event);

    if (this.ws) {
      try {
        this.ws.send(JSON.stringify({ ...event, id: eventId }));
      } catch {
        // WS may have closed — event is still buffered for replay
      }
    }
  }

  /** Send without buffering (for ack, pong, errors that don't need replay) */
  private sendWS(event: ServerMessage): void {
    if (this.ws) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch {
        // WS may have closed
      }
    }
  }

  /** Generate summary from text accumulator with hook-based fallback */
  private generateSummary(textAccumulator: TextAccumulator, imageCounter: { next: number }): string {
    if (textAccumulator.text.trim()) {
      return textAccumulator.text.trim();
    }

    const imageCount = imageCounter.next - 1;
    if (imageCount <= 0) return 'Generation complete.';

    const hookTypeLabels: Record<string, string> = {
      stat: 'Stat Hook', story: 'Story Hook', fomo: 'FOMO Hook',
      curiosity: 'Curiosity Hook', callout: 'Call-out Hook', contrast: 'Contrast Hook',
    };
    const generatedHooks = HOOK_TYPE_ORDER.slice(0, imageCount).map(h => hookTypeLabels[h]);
    return `I created ${imageCount} ad concept${imageCount > 1 ? 's' : ''}:\n${generatedHooks.map(h => `\u2022 ${h}`).join('\n')}`;
  }
}
