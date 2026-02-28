// CampaignSession Durable Object — one per user.
// Accepts WebSocket via Hibernation API, handles generate/follow_up/cancel/subscribe/ping.
// runGeneration() is STUBBED — Phase 4 replaces with sandbox execution.

import type { Env } from '../env.js';
import type { ClientMessage, ServerMessage } from '../lib/types.js';
import { extractCampaignName, HOOK_TYPE_ORDER } from '../lib/types.js';
import { EventBuffer } from '../lib/event-buffer.js';
import { BlockBuilder } from '../lib/block-builder.js';
import { processSDKMessage, type TextAccumulator, type ParserContext } from '../lib/sdk-message-parser.js';
import * as db from '../db/index.js';

export class CampaignSession implements DurableObject {
  // Per-generation state (transient, lost on eviction — acceptable)
  private ws: WebSocket | null = null;
  private userId: string = 'anonymous';
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private isGenerating = false;
  private abortController: AbortController | null = null;
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
          await this.handleGenerate(message.prompt, message.sessionId);
        }
        break;

      case 'follow_up':
        if (message.prompt && message.campaignId) {
          await this.handleFollowUp(message.prompt, message.campaignId);
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

  private async handleGenerate(prompt: string, requestedSessionId?: string): Promise<void> {
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

    // Run generation (stubbed in Phase 3)
    try {
      await this.runGeneration(prompt, sessionId);
    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  private async handleFollowUp(prompt: string, campaignId: string): Promise<void> {
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

      // Run generation (stubbed in Phase 3)
      await this.runGeneration(prompt, wsSessionId);
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

  // ─── Generation (STUB — Phase 4 replaces) ────────────────────

  private async runGeneration(prompt: string, sessionId: string): Promise<void> {
    // Set up streaming state
    const blockBuilder = new BlockBuilder();
    blockBuilder.openThinkingBlock('Parsing Request');

    const textAccumulator: TextAccumulator = { text: '' };
    const processedFilenames = new Set<string>();
    const imageCounter = { next: 1 };

    const _ctx: ParserContext = {
      emitEvent: (event) => this.emitEvent(event),
      campaignId: this.campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
    };

    // ── STUB: Phase 4 will replace this with sandbox execution ──
    // For now, send an incomplete event so surrounding logic is testable.

    const message = 'Sandbox not configured — Phase 4 will enable AI generation.';

    this.emitEvent({
      type: 'incomplete',
      timestamp: new Date().toISOString(),
      error: 'sandbox_not_configured',
      message,
    });

    // Update campaign status
    if (this.campaignId) {
      try {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete');

        // Save assistant message with blocks
        blockBuilder.addStatusBlock(message, 'error');
        const summary = this.generateSummary(textAccumulator, imageCounter);
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: summary || message,
          blocks: blockBuilder.getBlocks(),
        });
      } catch (err) {
        console.error('Failed to update campaign:', err);
      }
    }
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
