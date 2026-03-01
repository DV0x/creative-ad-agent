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
      // 0. Debug: verify API key reaches DO correctly
      const keyLen = this.env.ANTHROPIC_API_KEY?.length || 0;
      const keyPrefix = this.env.ANTHROPIC_API_KEY?.substring(0, 10) || '(none)';
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] API key check: len=${keyLen}, prefix=${keyPrefix}` });

      // Quick API test from DO (bypasses sandbox entirely)
      try {
        const testResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': this.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        });
        this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] API key test from DO: ${testResp.status}` });
      } catch (e: any) {
        this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] API key test error: ${e.message}` });
      }

      // 1. Get or create sandbox
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] Getting sandbox...' });
      const sandbox = getSandbox(this.env.SANDBOX, `user-${this.userId}`, {
        sleepAfter: '10m',
      });
      this.sandbox = sandbox;

      // 2. Clean mount point (unmount stale FUSE, clear residual files)
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] Cleaning mount point...' });
      console.log(`[gen] Cleaning mount point...`);
      await sandbox.exec('fusermount -u /mnt/r2 2>/dev/null; umount /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2');

      // 3. Mount R2 for per-user storage via S3-compatible FUSE
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] Mounting R2 bucket...' });
      console.log(`[gen] Mounting R2 bucket...`);
      await sandbox.mountBucket('creative-agent-assets', '/mnt/r2', {
        endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        provider: 'r2',
        credentials: {
          accessKeyId: this.env.R2_ACCESS_KEY_ID,
          secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
        },
        readOnly: false,
        prefix: `/users/${this.userId}`,
      });

      // 3. Clean stale Claude CLI auth cache (may contain corrupted key from previous sessions)
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] Cleaning CLI auth cache...' });
      await sandbox.exec('rm -f /mnt/r2/.claude/.credentials /mnt/r2/.claude/config.json /mnt/r2/.claude/auth.json 2>/dev/null; ls -la /mnt/r2/.claude/ 2>/dev/null || true');

      // 4. Debug: comprehensive network test from sandbox
      const netTest = await sandbox.exec(
        `node -e "
          async function test() {
            // Test 1: with API key
            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});
            const t1 = await r1.text();
            console.log('WITH_KEY='+r1.status);
            // Test 2: without API key (should get 401 if network works)
            const r2 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':'sk-ant-bad-key','anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});
            console.log('BAD_KEY='+r2.status);
            // Test 3: simple GET to external site
            const r3 = await fetch('https://httpbin.org/ip');
            const t3 = await r3.text();
            console.log('HTTPBIN='+r3.status+' '+t3.substring(0,100));
          }
          test().catch(e=>console.log('ERR='+e.message));
        "`,
        { env: { ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY } }
      );
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] Net test: ${netTest?.stdout?.substring(0, 400) || JSON.stringify(netTest).substring(0, 400)}` });

      // 5. Start agent-runner with streaming
      const messageQueue: any[] = [];
      let execDone = false;
      let stdoutBuffer = ''; // Accumulate partial lines across chunks

      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] Starting agent-runner exec...' });
      console.log(`[gen] Starting agent-runner for session=${sessionId}, campaign=${this.campaignId}`);

      let outputChunkCount = 0;
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
          outputChunkCount++;
          if (stream === 'stdout') {
            // Buffer partial lines — only parse complete lines ending with \n
            stdoutBuffer += data;
            const lines = stdoutBuffer.split('\n');
            // Keep the last element (incomplete line or empty string after trailing \n)
            stdoutBuffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                messageQueue.push(parsed);
                console.log(`[gen] SDK message: type=${parsed.type}${parsed.subtype ? '/' + parsed.subtype : ''}`);
                // Debug: send all SDK message types to WS
                this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] SDK msg: ${parsed.type}${parsed.subtype ? '/' + parsed.subtype : ''}` });
              } catch {
                console.warn(`[gen] Non-JSON stdout line: ${line.substring(0, 120)}`);
                this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] Non-JSON stdout: ${line.substring(0, 80)}` });
              }
            }
          } else if (stream === 'stderr') {
            console.log(`[gen] stderr: ${data.substring(0, 200)}`);
            this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] stderr: ${data.substring(0, 100)}` });
          }
        },
      }).then((result: any) => {
        // Flush remaining buffer
        if (stdoutBuffer.trim()) {
          try {
            const parsed = JSON.parse(stdoutBuffer);
            messageQueue.push(parsed);
            console.log(`[gen] SDK message (flush): type=${parsed.type}`);
          } catch {
            console.warn(`[gen] Non-JSON final buffer: ${stdoutBuffer.substring(0, 120)}`);
          }
        }
        execDone = true;
        console.log(`[gen] Sandbox exec finished, exit=${result?.exitCode}, messages queued=${messageQueue.length}`);
        this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] exec done: exit=${result?.exitCode}, stdout chunks=${outputChunkCount}, msgs=${messageQueue.length}` });
        return result;
      });

      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: '[debug] R2 mounted, agent-runner started. Draining queue...' });
      console.log(`[gen] R2 mounted, agent-runner started. Draining message queue...`);

      // 4. Concurrent drain loop — process messages as they arrive
      let lastOutputTime = Date.now();
      let heartbeatCount = 0;
      while (true) {
        if (messageQueue.length > 0) {
          const msg = messageQueue.shift()!;
          lastOutputTime = Date.now();

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

          // Heartbeat: send status every 60s of silence
          const silenceSecs = Math.floor((Date.now() - lastOutputTime) / 1000);
          if (silenceSecs > 0 && silenceSecs % 60 === 0) {
            heartbeatCount++;
            if (heartbeatCount % 60 === 1) { // Once per minute
              this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] Waiting for SDK output... ${silenceSecs}s since last message, chunks=${outputChunkCount}` });
            }
          }
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
      this.sendWS({ type: 'status', timestamp: new Date().toISOString(), message: `[debug] Generation error: ${error.message?.substring(0, 150) || error}` });
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
