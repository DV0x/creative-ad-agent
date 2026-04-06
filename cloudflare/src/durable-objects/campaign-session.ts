// CampaignSession Durable Object — one per user.
// Accepts WebSocket via Hibernation API, handles generate/follow_up/cancel/subscribe/ping.
// runGeneration() executes AI generation via Cloudflare Sandbox containers (Phase 4).

import type { Env } from '../env.js';
import type { ClientMessage, ServerMessage } from '../lib/types.js';
import { extractCampaignName, HOOK_TYPE_ORDER, getHookTypeForIndex } from '../lib/types.js';
import type { HookType } from '../lib/types.js';
import { EventBuffer } from '../lib/event-buffer.js';
import { BlockBuilder } from '../lib/block-builder.js';
import { processSDKMessage, stripImageUrls, type TextAccumulator, type ParserContext } from '../lib/sdk-message-parser.js';
import * as db from '../db/index.js';
import * as credits from '../db/credits.js';
import { CREDITS_PER_USD, COST_MULTIPLIER } from '../db/credits.js';
import { getSandbox, parseSSEStream } from '@cloudflare/sandbox';
import { fal } from '@fal-ai/client';

export class CampaignSession implements DurableObject {
  // Per-generation state (transient, lost on eviction)
  private userId: string = 'anonymous';
  private sessionId: string | null = null;
  private campaignId: string | null = null;
  private isGenerating = false;
  private abortController: AbortController | null = null;
  private sandbox: any = null;
  private agentProcessId: string | null = null;
  private eventBuffer: EventBuffer = new EventBuffer();
  private tailLogs: string[] = [];
  private generationStartedAt: number = 0; // Timestamp for max age safety net
  private sandboxSetupInProgress = false; // Prevents alarm from creating competing sandbox connection
  private currentRequestId: string | null = null; // Per-turn ID for staleness check (null = initial gen)
  private hasSourceResearch = false; // True when research was copied from a source campaign
  private preGenImageCount = 0; // Image count before current generation (for cancel cost calc)
  private currentLogStream: ReadableStream | null = null; // Reference for cancel to unblock streamForLiveUI

  // Trace instrumentation
  private traceSeq = 0;
  private alarmIteration = 0;
  private lastContainerLogLen = 0; // Track how much of container stdout we've relayed

  constructor(
    private state: DurableObjectState,
    private env: Env,
  ) {}

  // ─── Tail-visible logging ────────────────────────────────────
  // Background promises (fire-and-forget generation) run outside handler
  // context, so their console.log calls don't appear in wrangler tail.
  // Buffer them here and flush during alarm(), which IS a handler invocation.

  private log(msg: string): void {
    this.tailLogs.push(msg);
    if (this.tailLogs.length > 500) {
      this.tailLogs.splice(0, 250);
    }
  }

  private flushTailLogs(): void {
    if (this.tailLogs.length === 0) return;
    const batch = this.tailLogs.splice(0);
    for (const msg of batch) {
      console.log(msg);
    }
  }

  // ─── Structured trace logging ──────────────────────────────────
  // Format: [T{seq}][{component}][{action}] cid={campaignId} key=value ...
  // Appears in wrangler tail via the tailLogs buffer + alarm flush.

  private trace(component: string, action: string, data?: Record<string, any>): void {
    const seq = ++this.traceSeq;
    const parts = [`[T${seq}][${component}][${action}]`];
    if (this.campaignId) parts.push(`cid=${this.campaignId}`);
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        parts.push(`${k}=${v}`);
      }
    }
    this.log(parts.join(' '));
  }

  /** Wrap a sandbox RPC call with trace logging, timing, and timeout */
  private async timedRPC<T>(label: string, fn: () => Promise<T>, timeoutMs = 60_000): Promise<T> {
    const start = Date.now();
    this.trace('rpc', `${label}.start`);
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`RPC ${label} timed out after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
      this.trace('rpc', `${label}.done`, { ms: Date.now() - start });
      return result;
    } catch (err: any) {
      this.trace('rpc', `${label}.error`, { ms: Date.now() - start, err: err?.message?.substring(0, 100) });
      throw err;
    }
  }

  // ─── Keep-alive heartbeat (prevents hibernation during generation) ───

  private startKeepAlive(): void {
    this.state.storage.setAlarm(Date.now() + 10_000).catch((err) => {
      console.warn('[alarm] startKeepAlive setAlarm failed:', err?.message || err);
    });
  }

  async alarm(): Promise<void> {
    const alarmStart = Date.now();
    this.alarmIteration++;
    const iter = this.alarmIteration;
    const ageSec = this.generationStartedAt ? Math.round((Date.now() - this.generationStartedAt) / 1000) : 0;

    try {
      this.flushTailLogs();

      this.trace('alarm', 'enter', {
        iter,
        gen: this.isGenerating,
        cid: this.campaignId || 'null',
        sandbox: !!this.sandbox,
        agent: this.agentProcessId || 'null',
        ageSec,
        userId: this.userId,
        wsCount: this.state.getWebSockets().length,
      });

      // Self-heal after DO reset: restore state if we have nothing in memory
      if (!this.campaignId) {
        this.trace('alarm', 'restoreSession.needed', { reason: 'no_campaignId' });
        await this.restoreSession();
      }

      if (!this.isGenerating || !this.campaignId) {
        this.trace('alarm', 'exit.noop', { gen: this.isGenerating, cid: this.campaignId || 'null', ms: Date.now() - alarmStart });
        return;
      }

      // Safety net: 2h timeout
      const MAX_GENERATION_AGE = 2 * 60 * 60 * 1000;
      if (this.generationStartedAt && (Date.now() - this.generationStartedAt) > MAX_GENERATION_AGE) {
        this.trace('alarm', 'safetyNet.triggered', { ageSec });
        this.emitEvent({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'That took way too long, even for us — your work\'s saved, let\'s try a fresh start',
        });
        try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch (_) {}
        this.isGenerating = false;
        await this.persistSession();
        return;
      }

      // Reconnect sandbox after DO reset — but NOT if setupSandbox is already running
      // (creating a second connection cancels in-flight RPCs on the first)
      if (!this.sandbox && !this.sandboxSetupInProgress && this.userId && this.userId !== 'anonymous') {
        const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
        this.trace('alarm', 'sandbox.reconnect', { sandboxId });
        this.sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
          sleepAfter: '2h',
          normalizeId: true,
        });
        this.trace('alarm', 'sandbox.reconnected');
      }

      // Zombie detection: isGenerating=true but no agent process and setup not running
      // If no agent started after 5 minutes, something went wrong — mark incomplete
      if (!this.agentProcessId && !this.sandboxSetupInProgress) {
        const ZOMBIE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        if (this.generationStartedAt && (Date.now() - this.generationStartedAt) > ZOMBIE_THRESHOLD) {
          this.trace('alarm', 'zombie.detected', { ageSec });
          this.emitEvent({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: 'Hmm something didn\'t start right — your work\'s saved, try again and we\'ll nail it',
          });
          try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
          this.isGenerating = false;
          await this.persistSession();
          return;
        }
        this.trace('alarm', 'zombie.waiting', { ageSec, threshold: ZOMBIE_THRESHOLD / 1000 });
      }

      if (this.sandbox) {
        // Crash detection: check if agent process is still alive
        if (this.agentProcessId) {
          try {
            const processes = await this.timedRPC('listProcesses', () => this.sandbox.listProcesses()) as any[];
            const agentProc = processes.find((p: any) => p.id === this.agentProcessId);
            const alive = agentProc?.status === 'running';
            this.trace('alarm', 'agentCheck', {
              alive,
              status: agentProc?.status || 'not_found',
              processCount: processes.length,
            });

            if (!alive) {
              // Process died — check if it completed before dying
              const finalized = await this.tryFinalize(this.campaignId, this.sessionId!);
              if (finalized) {
                this.trace('alarm', 'exit.finalized_after_crash', { ms: Date.now() - alarmStart });
                return;
              }

              // Process dead and no result — mark incomplete
              this.trace('alarm', 'agent.dead_no_result');
              this.emitEvent({
                type: 'error',
                timestamp: new Date().toISOString(),
                error: 'The creative engine wandered off — your work\'s safe tho, give it another go',
              });
              try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
              this.isGenerating = false;
              await this.persistSession();
              this.trace('alarm', 'exit.incomplete', { ms: Date.now() - alarmStart });
              return;
            }
          } catch (err: any) {
            this.trace('alarm', 'listProcesses.catch', { err: err?.message?.substring(0, 100) });
            // Fatal sandbox error — connection is dead, clean up and let user retry
            if (err?.message?.includes('object to be reset') || err?.message?.includes('Network connection lost')) {
              this.trace('alarm', 'sandbox.fatal', { err: err?.message?.substring(0, 100) });
              this.sandbox = null;
              this.emitEvent({
                type: 'error',
                timestamp: new Date().toISOString(),
                error: 'Connection went poof but your work didn\'t — hit send again and we\'re vibing',
              });
              try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
              this.isGenerating = false;
              this.agentProcessId = null;
              await this.state.storage.delete('agentProcessId');
              await this.state.storage.delete('agentCampaignId');
              await this.clearPersistedSession();
              this.trace('alarm', 'exit.sandboxFatal', { ms: Date.now() - alarmStart });
              return;
            }
          }

          // Relay container logs: call getProcessLogs() to see what agent is doing
          try {
            const logs = await this.timedRPC('getProcessLogs', () => this.sandbox.getProcessLogs(this.agentProcessId)) as any;
            const stdout: string = typeof logs === 'string' ? logs : (logs?.stdout || '');
            const newLen = stdout.length;
            if (newLen > this.lastContainerLogLen) {
              const newContent = stdout.substring(this.lastContainerLogLen);
              // Extract last few lines for the trace
              const newLines = newContent.trim().split('\n');
              const recentLines = newLines.slice(-3);
              for (const line of recentLines) {
                // Parse JSON lines for type, otherwise truncate raw text
                try {
                  const parsed = JSON.parse(line);
                  this.trace('container', 'log', { type: parsed.type, subtype: parsed.subtype || '' });
                } catch {
                  this.trace('container', 'log.raw', { line: line.substring(0, 150) });
                }
              }
              this.trace('alarm', 'containerLogs', { newBytes: newLen - this.lastContainerLogLen, totalLines: newLines.length });
              this.lastContainerLogLen = newLen;
            } else {
              this.trace('alarm', 'containerLogs.noNew', { totalLen: newLen });
            }
          } catch (err: any) {
            this.trace('alarm', 'getProcessLogs.catch', { err: err?.message?.substring(0, 100) });
          }
        }

        // Check if turn-result.json exists (agent completed this turn)
        const finalized = await this.tryFinalize(this.campaignId, this.sessionId!);
        if (finalized) {
          this.trace('alarm', 'exit.finalized', { ms: Date.now() - alarmStart });
          return;
        }
      } else {
        this.trace('alarm', 'no_sandbox', { userId: this.userId });
      }

      // Reschedule
      if (this.isGenerating) {
        await this.state.storage.setAlarm(Date.now() + 10_000);
        this.trace('alarm', 'reschedule', { nextIn: 10000 });
      }
      this.trace('alarm', 'exit.ok', { iter, ms: Date.now() - alarmStart });
    } catch (err: any) {
      this.trace('alarm', 'exit.error', { iter, err: err?.message?.substring(0, 200), ms: Date.now() - alarmStart });
      console.warn('[alarm] alarm handler error:', err?.message || err);
      if (this.isGenerating) {
        try {
          await this.state.storage.setAlarm(Date.now() + 10_000);
          this.trace('alarm', 'reschedule.afterError');
        } catch (e: any) {
          this.trace('alarm', 'reschedule.failed', { err: e?.message?.substring(0, 100) });
        }
      }
    }
  }

  // ─── Single completion path: read turn-result.json, reconcile, save to D1 ───

  private async tryFinalize(campaignId: string, sessionId: string): Promise<boolean> {
    if (!this.sandbox) return false;
    try {
      const raw = await this.timedRPC('readTurnResult', () => this.sandbox.readFile('/app/turn-result.json')) as any;
      const content = typeof raw === 'string' ? raw : raw.content;
      const result = JSON.parse(content);

      // Verify it's for the current campaign (not stale from a different campaign)
      if (result.campaignId && result.campaignId !== campaignId) {
        this.trace('finalize', 'wrongCampaign', { got: result.campaignId, expected: campaignId });
        return false;
      }

      // Verify it's for the current turn (not stale from previous turn)
      if (this.currentRequestId && result.requestId && result.requestId !== this.currentRequestId) {
        this.trace('finalize', 'staleResult', { got: result.requestId, expected: this.currentRequestId });
        return false;
      }

      this.trace('finalize', 'found', {
        images: result.images?.length || 0,
        files: Object.keys(result.files || {}).length,
        requestId: result.requestId || 'initial',
      });
      await this.finalizeGeneration(campaignId, sessionId, result);
      return true;
    } catch (err: any) {
      // FileNotFoundError = agent still working (normal). Anything else = bug.
      const msg = err?.message || String(err);
      if (!msg.includes('FileNotFoundError') && !msg.includes('File not found')) {
        this.log(`[finalize] ERROR in tryFinalize: ${msg.substring(0, 300)}`);
      }
      return false;
    }
  }

  private async finalizeGeneration(
    campaignId: string,
    sessionId: string,
    turnResult: {
      images?: any[];
      files?: Record<string, string>;
      text?: string;
      blocks?: any[];
      requestId?: string;
      cost?: { totalCostUsd: number; inputTokens: number; outputTokens: number; numTurns: number; durationMs: number };
    },
  ): Promise<void> {
    if (!this.isGenerating) return;

    const images = turnResult.images || [];
    const files = turnResult.files || {};
    const text = turnResult.text || '';
    const blocks = turnResult.blocks || [];

    // 1. Reconcile images (dedup against existing D1 records)
    const existingImages = await db.getCampaignImages(this.env.DB, campaignId);
    const knownPaths = new Set(existingImages.map((i: any) => i.file_path));
    let nextIndex = (await db.getMaxImageIndex(this.env.DB, campaignId)) + 1;
    let imagesAdded = 0;

    for (const img of images) {
      const urlPath = img.path?.startsWith('/images/') ? img.path : `/images/${img.filename}`;
      if (knownPaths.has(urlPath)) continue;

      const imageIndex = nextIndex++;
      const hookType = getHookTypeForIndex(imageIndex);

      await db.addCampaignImage(this.env.DB, {
        campaignId,
        imageIndex,
        hookType: hookType as HookType,
        filePath: urlPath,
      });

      this.emitEvent({
        type: 'image',
        timestamp: new Date().toISOString(),
        id: `image_${imageIndex}`,
        urlPath,
        prompt: '',
        filename: img.filename,
        hookType,
        imageIndex,
      });

      imagesAdded++;
    }

    // 2. Reconcile files (research, hooks, prompts)
    for (const [fileType, fileContent] of Object.entries(files)) {
      if (!fileContent || typeof fileContent !== 'string') continue;
      await db.updateCampaignFile(this.env.DB, campaignId, fileType as any, fileContent);
    }

    // 3. Save assistant message to D1 (FULL text, not truncated)
    const msgContent = text ? stripImageUrls(text) : 'Generation complete.';
    await db.addMessage(this.env.DB, {
      campaignId,
      role: 'assistant',
      content: msgContent,
      blocks,
    });

    // 4. Emit complete event (summary for client, can be truncated)
    const currentImageCount = await db.getImageCount(this.env.DB, campaignId);
    const summary = text ? stripImageUrls(text).substring(0, 500) : 'Generation complete.';
    this.emitEvent({
      type: 'complete',
      timestamp: new Date().toISOString(),
      sessionId,
      campaignId,
      duration: 0,
      imageCount: currentImageCount,
      summary,
    });

    // 5. Update D1 status
    await db.updateCampaignStatus(this.env.DB, campaignId, 'complete');

    // 6. Persist max image index for next turn's counter (survives alarm/handler race)
    const currentMaxIndex = await db.getMaxImageIndex(this.env.DB, campaignId);
    await this.state.storage.put(`maxImageIndex:${campaignId}`, currentMaxIndex);

    // 7. Record cost and deduct credits (COST_MULTIPLIER applied for margin)
    //    Both sides use getImageCount (DISTINCT indexes) — no row-count vs distinct mismatch
    const imagesThisTurn = Math.max(0, currentImageCount - this.preGenImageCount);
    const claudeCost = turnResult.cost?.totalCostUsd ?? 0;
    if (claudeCost > 0 || imagesThisTurn > 0) {
      const imageCost = imagesThisTurn * 0.15;
      const rawCost = claudeCost + imageCost;
      const chargedCost = rawCost * COST_MULTIPLIER;
      const isFollowUp = this.preGenImageCount > 0;

      try {
        const result = await credits.recordUsage(this.env.DB, this.userId, campaignId, {
          requestId: turnResult.requestId || `finalize_${Date.now()}`,
          eventType: isFollowUp ? 'follow_up' : 'generation',
          claudeCostUsd: claudeCost,
          imageCount: imagesThisTurn,
          imageCostUsd: imageCost,
          totalCostUsd: chargedCost,
          inputTokens: turnResult.cost?.inputTokens ?? 0,
          outputTokens: turnResult.cost?.outputTokens ?? 0,
          numTurns: turnResult.cost?.numTurns ?? 0,
          durationMs: turnResult.cost?.durationMs ?? 0,
        });

        this.trace('credits', 'recorded', { cogs: rawCost.toFixed(4), charged: chargedCost.toFixed(4), multiplier: COST_MULTIPLIER, newBalance: result.newBalance.toFixed(2), dup: result.alreadyRecorded });

        if (!result.alreadyRecorded) {
          this.sendWS({
            type: 'credits_update',
            timestamp: new Date().toISOString(),
            balance: Math.round(result.newBalance * CREDITS_PER_USD * 10) / 10,
            cost: Math.round(chargedCost * CREDITS_PER_USD * 10) / 10,
          } as any);
        }
      } catch (err: any) {
        this.log(`[credits] Failed to record usage: ${err?.message}`);
      }
    }

    // 8. Delete turn-result.json to prevent double-charge on crash recovery
    if (this.sandbox) {
      try {
        await this.timedRPC('deleteTurnResult', () => this.sandbox.exec('rm -f /app/turn-result.json'));
      } catch { /* sandbox may be gone */ }
    }

    // 9. Cleanup
    this.isGenerating = false;
    await this.persistSession();
    this.trace('finalize', 'complete', { campaignId, imagesAdded, filesReconciled: Object.keys(files).length });
  }

  // ─── Cancel credit deduction (charge for images already generated) ───

  private async recordCancelledUsage(campaignId: string): Promise<void> {
    try {
      const currentImageCount = await db.getImageCount(this.env.DB, campaignId);
      const imagesAdded = Math.max(0, currentImageCount - this.preGenImageCount);
      if (imagesAdded === 0) return; // No images generated, nothing to charge

      const imageCost = imagesAdded * 0.15;
      const chargedCost = imageCost * COST_MULTIPLIER;
      // Stable requestId for idempotency — repeated cancels for the same generation won't double-charge
      const requestId = this.currentRequestId || `cancel_${campaignId}`;

      const result = await credits.recordUsage(this.env.DB, this.userId, campaignId, {
        requestId,
        eventType: 'cancelled',
        claudeCostUsd: 0,
        imageCount: imagesAdded,
        imageCostUsd: imageCost,
        totalCostUsd: chargedCost,
        inputTokens: 0,
        outputTokens: 0,
        numTurns: 0,
        durationMs: 0,
      });

      this.trace('credits', 'cancelled_usage', { images: imagesAdded, cogs: imageCost.toFixed(4), charged: chargedCost.toFixed(4), newBalance: result.newBalance.toFixed(2) });

      if (!result.alreadyRecorded) {
        this.sendWS({
          type: 'credits_update',
          timestamp: new Date().toISOString(),
          balance: Math.round(result.newBalance * CREDITS_PER_USD * 10) / 10,
          cost: Math.round(chargedCost * CREDITS_PER_USD * 10) / 10,
        } as any);
      }
    } catch (err: any) {
      this.log(`[credits] Failed to record cancelled usage: ${err?.message}`);
    }
  }

  // ─── Session persistence (survives DO reset / hibernation) ───

  private async persistSession(): Promise<void> {
    if (this.sessionId && this.campaignId) {
      this.trace('session', 'persist', { gen: this.isGenerating, requestId: this.currentRequestId || 'null' });
      await this.state.storage.put('activeSession', {
        sessionId: this.sessionId,
        campaignId: this.campaignId,
        userId: this.userId,
        isGenerating: this.isGenerating,
        generationStartedAt: this.generationStartedAt,
        currentRequestId: this.currentRequestId,
        hasSourceResearch: this.hasSourceResearch,
      });
    }
  }

  private async restoreSession(): Promise<boolean> {
    // Restore userId from storage if lost to hibernation
    if (this.userId === 'anonymous') {
      const storedUserId = await this.state.storage.get<string>('userId');
      if (storedUserId && storedUserId !== 'anonymous') {
        this.userId = storedUserId;
        this.trace('session', 'restore.userId', { from: 'storage', userId: storedUserId });
      }
    }
    // Always try to restore agentProcessId (persisted independently from activeSession)
    if (!this.agentProcessId) {
      const storedProcessId = await this.state.storage.get<string>('agentProcessId');
      if (storedProcessId) {
        this.agentProcessId = storedProcessId;
        this.trace('session', 'restore.agentProcessId', { processId: storedProcessId });
      }
    }
    if (this.sessionId) return true; // already loaded
    const stored = await this.state.storage.get<{
      sessionId: string;
      campaignId: string;
      userId: string;
      isGenerating: boolean;
      generationStartedAt?: number;
      currentRequestId?: string | null;
      hasSourceResearch?: boolean;
    }>('activeSession');
    if (stored) {
      this.trace('session', 'restore.found', {
        session: stored.sessionId,
        campaign: stored.campaignId,
        gen: stored.isGenerating,
        userId: stored.userId,
      });
      this.sessionId = stored.sessionId;
      this.campaignId = stored.campaignId;
      // Only restore userId if we don't already have a fresh one from the request header
      if (this.userId === 'anonymous' && stored.userId !== 'anonymous') {
        this.userId = stored.userId;
      }
      this.isGenerating = stored.isGenerating;
      this.generationStartedAt = stored.generationStartedAt || 0;
      this.currentRequestId = stored.currentRequestId || null;
      this.hasSourceResearch = stored.hasSourceResearch || false;
      // Staleness check: if isGenerating is true, verify something is actually running
      if (this.isGenerating && stored.campaignId) {
        if (!this.sandbox) {
          // No sandbox connection = nothing is running. DO reset killed it.
          // Reset immediately — don't wait for alarm zombie detection.
          console.log(`[restoreSession] Zombie detected — isGenerating=true but sandbox=null, resetting`);
          this.isGenerating = false;
          try { await db.updateCampaignStatus(this.env.DB, stored.campaignId, 'incomplete'); } catch {}
          await this.persistSession();
        } else {
          // Sandbox exists but D1 might disagree — check D1
          try {
            const campaign = await db.getCampaignBySessionId(this.env.DB, stored.sessionId);
            if (!campaign || campaign.status !== 'generating') {
              console.log(`[restoreSession] Stale isGenerating detected — D1 status=${campaign?.status ?? 'not found'}, resetting`);
              this.isGenerating = false;
              await this.persistSession();
            }
          } catch (err: any) {
            console.warn('[restoreSession] D1 staleness check failed:', err?.message);
            this.isGenerating = false;
            await this.persistSession();
          }
        }
      }
      return true;
    }
    return false;
  }

  private async clearPersistedSession(): Promise<void> {
    await this.state.storage.delete('activeSession');
    // NOTE: Do NOT delete 'userId' here — it must survive across generations
    // so that follow-up messages after DO hibernation can still identify the user.
  }

  // ─── WebSocket Hibernation API ────────────────────────────────

  async fetch(request: Request): Promise<Response> {
    // Extract userId from internal header (Worker verifies JWT, passes to DO)
    this.userId = request.headers.get('X-User-Id') || 'anonymous';
    const url = new URL(request.url);
    this.trace('do', 'fetch', { userId: this.userId, path: url.pathname, upgrade: request.headers.get('Upgrade') || 'none' });

    // Persist userId immediately so it survives hibernation (DO may be evicted
    // between fetch() and the first webSocketMessage(), losing instance vars)
    if (this.userId !== 'anonymous') {
      await this.state.storage.put('userId', this.userId);
    }
    // Restore session state if DO was reset
    await this.restoreSession();

    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept with Hibernation API
    this.state.acceptWebSocket(server);
    this.trace('do', 'ws.accepted', { wsCount: this.state.getWebSockets().length });

    // Send initial ack to THIS connection only
    this.sendToWS(server, {
      type: 'ack',
      timestamp: new Date().toISOString(),
      message: 'Connected to Creative Machine',
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    // Restore session after DO reset / hibernation wake
    await this.restoreSession();

    let message: ClientMessage;
    try {
      message = JSON.parse(typeof data === 'string' ? data : new TextDecoder().decode(data));
    } catch {
      this.sendToWS(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Invalid message format' });
      return;
    }

    this.trace('ws', 'message', { type: message.type, gen: this.isGenerating, session: this.sessionId || 'null' });

    switch (message.type) {
      case 'generate':
        if (message.prompt) {
          await this.handleGenerate(message.prompt, message.sessionId, message.assetFileIds, message.sourceCampaignId, message.aspectRatio, message.brand);
        }
        break;

      case 'follow_up':
        if (message.prompt && message.campaignId) {
          await this.handleFollowUp(message.prompt, message.campaignId, message.assetFileIds, message.aspectRatio);
        }
        break;

      case 'cancel':
        await this.handleCancel();
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
    this.trace('ws', 'close', { code, reason: reason || 'none', session: this.sessionId || 'null', gen: this.isGenerating, wsRemaining: this.state.getWebSockets().length - 1 });
    console.log(`WS closed: session=${this.sessionId}, code=${code}, reason=${reason}`);
    // No cleanup needed — getWebSockets() automatically excludes closed connections
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.trace('ws', 'error', { err: String(error).substring(0, 200), session: this.sessionId || 'null', gen: this.isGenerating });
    console.error('WS error:', error);
    // No cleanup needed — getWebSockets() automatically excludes errored connections
  }

  // ─── Message Handlers ─────────────────────────────────────────

  private async handleGenerate(prompt: string, requestedSessionId?: string, assetFileIds?: string[], sourceCampaignId?: string, aspectRatio?: string, brand?: string): Promise<void> {
    this.trace('handler', 'generate.enter', { promptLen: prompt.length, sessionId: requestedSessionId || 'auto', assets: assetFileIds?.length || 0, source: sourceCampaignId || 'none' });
    if (this.isGenerating) {
      // Safety net: if no sandbox, nothing is actually running (DO reset zombie)
      if (!this.sandbox) {
        this.trace('handler', 'generate.zombieReset', { reason: 'no_sandbox' });
        this.isGenerating = false;
        if (this.campaignId) {
          try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
        }
        await this.clearPersistedSession();
      } else {
        this.trace('handler', 'generate.blocked', { reason: 'already_generating' });
        this.sendWS({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'A generation is already in progress. Please wait or cancel first.',
        });
        return;
      }
    }
    this.isGenerating = true;
    this.generationStartedAt = Date.now();
    this.currentRequestId = null;

    // Pre-flight credit check — before any D1 writes to avoid orphan campaigns
    try {
      const balance = await credits.getBalance(this.env.DB, this.userId);
      if (balance <= 0) {
        this.isGenerating = false;
        this.sendWS({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'Insufficient credits. Please top up to continue.',
          code: 'INSUFFICIENT_CREDITS',
        });
        return;
      }
    } catch (err: any) {
      this.log(`[credits] Pre-flight check failed: ${err?.message} — allowing generation`);
    }

    const sessionId = requestedSessionId || `ws-${Date.now()}`;
    this.sessionId = sessionId;
    this.abortController = new AbortController();

    // Create campaign in D1
    const campaignName = extractCampaignName(prompt);
    try {
      let campaign = await db.getCampaignBySessionId(this.env.DB, sessionId);
      if (!campaign) {
        campaign = await db.createCampaign(this.env.DB, this.userId, campaignName, sessionId, brand);
      } else if (campaign.user_id !== this.userId) {
        // Fix stale user_id from a previous DO reset that created campaign as 'anonymous'
        await this.env.DB.prepare('UPDATE campaigns SET user_id = ? WHERE id = ?')
          .bind(this.userId, campaign.id).run();
        console.log(`[gen] Fixed campaign ${campaign.id} user_id: ${campaign.user_id} → ${this.userId}`);
      }
      this.campaignId = campaign.id;

      // Copy research from source campaign if provided
      if (sourceCampaignId) {
        try {
          // SECURITY: Verify source campaign belongs to this user
          const sourceCampaign = await db.getCampaignById(this.env.DB, sourceCampaignId, this.userId);
          if (!sourceCampaign) {
            this.log(`[gen] Source campaign ${sourceCampaignId} not found or not owned by user — skipping research copy`);
          } else {
            const sourceResearch = await db.getCampaignFile(this.env.DB, sourceCampaignId, 'research');
            if (sourceResearch && sourceResearch.content && sourceResearch.content.trim()) {
              await db.updateCampaignFile(this.env.DB, campaign.id, 'research', sourceResearch.content);
              this.hasSourceResearch = true;
              this.log(`[gen] Copied research from source campaign ${sourceCampaignId} (${sourceResearch.content.length} chars)`);
              // Emit file event so client shows research immediately
              this.emitEvent({
                type: 'file',
                timestamp: new Date().toISOString(),
                fileType: 'research',
                content: sourceResearch.content,
              });
            }
          }
        } catch (err: any) {
          this.log(`[gen] Failed to copy source research: ${err?.message}`);
        }
      }

      // Persist user message
      await db.addMessage(this.env.DB, {
        campaignId: campaign.id,
        role: 'user',
        content: prompt,
      });
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }

    // Persist session so it survives DO resets
    await this.persistSession();

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
      this.log(`[ASSET] Resolving ${assetFileIds.length} asset(s): ${JSON.stringify(assetFileIds)}`);
      const { falUrls, sandboxPaths } = await this.resolveAssetUrls(assetFileIds);
      this.log(`[ASSET] Resolved ${falUrls.length} asset(s)`);
      if (falUrls.length > 0) {
        aiPrompt = `${prompt}\n\n## Reference Images\nThe user uploaded ${falUrls.length} reference image(s). You MUST use these throughout the pipeline.\n\n### Step 1: Read and analyze each image\n${sandboxPaths.map((p, i) => `- Read("${p}") — analyze product, colors, style, details`).join('\n')}\n\n### Step 2: Use your analysis to inform hooks, art direction, and prompts\n\n### Step 3: When calling generate_ad_images, pass these as referenceImageUrls\n${falUrls.map((url, i) => `- ${url}`).join('\n')}\n\nThis ensures the actual product appears in every generated ad.`;
        this.log(`[ASSET] Prompt injected with ${falUrls.length} reference image(s)`);
      }
    } else {
      this.log(`[ASSET] No assetFileIds — generating without reference images`);
    }

    // Append system note for source-based campaigns (research already copied to D1)
    if (this.hasSourceResearch) {
      aiPrompt = `${aiPrompt}\n\n[SYSTEM NOTE: Brand research has already been completed and is available at /app/agent/files/research/restored_research.md. Do NOT run the research agent or ask for a URL. Follow these steps:\n1. Read the research file with the Read tool\n2. Run the hook-methodology skill to generate hooks based on the research AND the user's campaign brief\n3. Run the art-style skill to create visual prompts from the hooks\n4. Generate images using the MCP tool\nProceed now — start by reading the research file.]`;
    }

    // Inject aspect ratio instruction
    if (aspectRatio) {
      aiPrompt = `${aiPrompt}\n\n[ASPECT RATIO: ${aspectRatio} — Generate ALL images at this aspect ratio. Do not vary or rotate aspect ratios across concepts. Every prompt in prompts.json must use aspectRatio "${aspectRatio}" with dimensions "${aspectRatio === '4:5' ? '1080x1350' : aspectRatio === '1:1' ? '1080x1080' : '1080x1920'}". Pass --aspect ${aspectRatio} to generate_ad_images.]`;
    }

    // Start alarm heartbeat — prevents DO from hibernating while generation runs
    this.startKeepAlive();
    this.trace('handler', 'generate.fireAndForget', { sessionId, campaignId: this.campaignId, hasSourceResearch: this.hasSourceResearch });

    // Fire and forget — return immediately so the DO can process pings/subscribes.
    // runGeneration() has its own try/catch/finally that handles all cleanup
    // (D1 status updates, isGenerating reset, session clearing).
    this.runGeneration(aiPrompt, sessionId).catch((err) => {
      this.trace('handler', 'generate.unhandledError', { err: err?.message?.substring(0, 200) });
      console.error('[gen] Unhandled runGeneration error:', err);
    });
  }

  private async handleFollowUp(prompt: string, campaignId: string, assetFileIds?: string[], aspectRatio?: string): Promise<void> {
    this.trace('handler', 'followUp.enter', { promptLen: prompt.length, campaignId, assets: assetFileIds?.length || 0 });
    if (this.isGenerating) {
      // Safety net: if no sandbox, nothing is actually running (DO reset zombie)
      if (!this.sandbox) {
        this.trace('handler', 'followUp.zombieReset', { reason: 'no_sandbox' });
        this.isGenerating = false;
        if (this.campaignId) {
          try { await db.updateCampaignStatus(this.env.DB, this.campaignId, 'incomplete'); } catch {}
        }
        await this.clearPersistedSession();
      } else {
        this.trace('handler', 'followUp.blocked', { reason: 'already_generating' });
        this.sendWS({
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'A generation is already in progress. Please wait or cancel first.',
        });
        return;
      }
    }
    this.isGenerating = true;
    this.generationStartedAt = Date.now();
    this.currentRequestId = null;

    // --- Setup phase (may fail — needs cleanup before returning) ---
    let wsSessionId = '';
    let sdkSessionId: string | undefined;
    let aiPrompt = prompt;

    try {
      // Look up campaign
      const campaign = await db.getCampaignById(this.env.DB, campaignId, this.userId);
      if (!campaign) {
        this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign not found' });
        this.isGenerating = false;
        return;
      }

      // Pre-flight credit check — before saving message or updating status
      try {
        const balance = await credits.getBalance(this.env.DB, this.userId);
        if (balance <= 0) {
          this.isGenerating = false;
          this.sendWS({
            type: 'error',
            timestamp: new Date().toISOString(),
            error: 'Insufficient credits. Please top up to continue.',
            code: 'INSUFFICIENT_CREDITS',
          });
          return;
        }
      } catch (err: any) {
        this.log(`[credits] Pre-flight check failed: ${err?.message} — allowing follow-up`);
      }

      const rawSdkSessionId = await db.getSdkSessionId(this.env.DB, campaignId);
      sdkSessionId = rawSdkSessionId ?? undefined;
      if (!rawSdkSessionId) {
        console.log(`No SDK session for campaign ${campaignId} (status: ${campaign.status}) — will start fresh`);
      }

      if (!campaign.session_id) {
        this.sendWS({ type: 'error', timestamp: new Date().toISOString(), error: 'Campaign has no session' });
        this.isGenerating = false;
        return;
      }

      wsSessionId = campaign.session_id;
      this.sessionId = wsSessionId;
      this.campaignId = campaignId;
      this.abortController = new AbortController();

      // Clear stale events from previous generation
      this.eventBuffer.clear();

      // Persist user message
      await db.addMessage(this.env.DB, { campaignId, role: 'user', content: prompt });

      // Update campaign status
      await db.updateCampaignStatus(this.env.DB, campaignId, 'generating');

      // Persist session so it survives DO resets
      await this.persistSession();

      // Send ack
      this.emitEvent({
        type: 'ack',
        timestamp: new Date().toISOString(),
        sessionId: wsSessionId,
        campaignId,
      });

      // Resolve asset reference URLs and prepend to prompt
      if (assetFileIds && assetFileIds.length > 0) {
        this.log(`[ASSET] Follow-up resolving ${assetFileIds.length} asset(s): ${JSON.stringify(assetFileIds)}`);
        const { falUrls, sandboxPaths } = await this.resolveAssetUrls(assetFileIds);
        this.log(`[ASSET] Follow-up resolved ${falUrls.length} asset(s)`);
        if (falUrls.length > 0) {
          aiPrompt = `${prompt}\n\n## Reference Images\nThe user uploaded ${falUrls.length} reference image(s). You MUST use these.\n\n### Read and analyze each image\n${sandboxPaths.map((p, i) => `- Read("${p}")`).join('\n')}\n\n### When calling generate_ad_images, pass these as referenceImageUrls\n${falUrls.map((url, i) => `- ${url}`).join('\n')}`;
          this.log(`[ASSET] Follow-up prompt injected with ${falUrls.length} reference image(s)`);
        }
      } else {
        this.log(`[ASSET] Follow-up — no assetFileIds`);
      }

      // Inject aspect ratio instruction
      if (aspectRatio) {
        aiPrompt = `${aiPrompt}\n\n[ASPECT RATIO: ${aspectRatio} — Generate ALL images at this aspect ratio. Do not vary or rotate aspect ratios across concepts. Every prompt in prompts.json must use aspectRatio "${aspectRatio}" with dimensions "${aspectRatio === '4:5' ? '1080x1350' : aspectRatio === '1:1' ? '1080x1080' : '1080x1920'}". Pass --aspect ${aspectRatio} to generate_ad_images.]`;
      }
    } catch (err) {
      // Setup failed — clean up and return
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
      if (this.campaignId) {
        try {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
        } catch { /* ignore */ }
      }
      this.isGenerating = false;
      this.abortController = null;
      await this.clearPersistedSession();
      return;
    }

    // Start alarm heartbeat — prevents DO from hibernating while generation runs
    this.startKeepAlive();

    // --- Check if agent-runner is alive for fast path ---
    const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
    const sandbox = getSandbox(this.env.SANDBOX, sandboxId, {
      sleepAfter: '2h',
      normalizeId: true,
    });

    const agentAlive = await this.isAgentProcessAlive(sandbox);
    const agentCampaignId = await this.state.storage.get<string>('agentCampaignId');
    const campaignMatch = agentCampaignId === campaignId;
    this.trace('handler', 'followUp.pathCheck', {
      agentAlive,
      agentProcessId: this.agentProcessId || 'null',
      campaignMatch,
      agentCampaign: agentCampaignId || 'null',
      requestedCampaign: campaignId,
    });

    if (agentAlive && campaignMatch) {
      // FAST PATH — agent alive, write prompt file, stream output (~30-60s)
      this.sandbox = sandbox;
      this.trace('handler', 'followUp.fastPath');
      this.runFollowUpFast(sandbox, aiPrompt, wsSessionId, campaignId).catch((err) => {
        this.trace('handler', 'followUp.fastPath.error', { err: err?.message?.substring(0, 200) });
      });
    } else {
      // SLOW PATH — agent dead, full cold start (~3 min)
      this.trace('handler', 'followUp.slowPath');
      this.agentProcessId = null;
      await this.state.storage.delete('agentProcessId');
      await this.state.storage.delete('agentCampaignId');

      // Fix 2: Append context about existing files so agent doesn't restart research
      // Also applies when research was copied from a source campaign (hasSourceResearch)
      if (sdkSessionId || this.hasSourceResearch) {
        try {
          const files = await db.getCampaignFiles(this.env.DB, campaignId);
          const readyFiles = files.filter(f => f.content && f.content.trim());
          if (readyFiles.length > 0) {
            const FILE_PATHS: Record<string, string> = {
              research: '/app/agent/files/research/restored_research.md',
              hooks: '/app/agent/.claude/skills/hook-methodology/hook-bank/restored_hooks.md',
              prompts: '/app/agent/files/creatives/restored_prompts.json',
            };
            const hasResearch = readyFiles.some(f => f.file_type === 'research');
            const hasHooks = readyFiles.some(f => f.file_type === 'hooks');
            aiPrompt += `\n\n[SYSTEM NOTE: This is a follow-up to an existing campaign. Do NOT restart the research workflow or ask for a URL. The following files are available on disk:\n`;
            for (const file of readyFiles) {
              const targetPath = FILE_PATHS[file.file_type];
              if (targetPath) aiPrompt += `- ${file.file_type}: ${targetPath}\n`;
            }
            if (hasResearch && !hasHooks) {
              aiPrompt += `Only research exists — hooks and prompts need to be generated. Read the research file, then run the hook-methodology skill followed by the art-style skill to generate hooks, prompts, and images based on the user's campaign brief.]`;
            } else {
              aiPrompt += `Read these files if needed. Continue from where the conversation left off.]`;
            }
            this.log(`[gen] Appended cold resume context (${readyFiles.length} files) to prompt`);
          }
        } catch (err: any) {
          this.log(`[gen] Failed to query files for cold resume context: ${err?.message}`);
        }
      }

      // Load conversation history from D1 for context (agent may not have JSONL on cold start)
      try {
        const messages = await db.getMessages(this.env.DB, campaignId);
        if (messages.length > 0) {
          let history = '\n\n[PREVIOUS CONVERSATION:\n';
          for (const msg of messages) {
            const role = msg.role === 'user' ? 'User' : 'Assistant';
            const content = msg.content.substring(0, 2000);
            history += `${role}: ${content}\n---\n`;
          }
          history += 'Continue the conversation from here.]\n';
          aiPrompt += history;
          this.log(`[gen] Appended conversation history (${messages.length} messages) to prompt`);
        }
      } catch (err: any) {
        this.log(`[gen] Failed to load conversation history: ${err?.message}`);
      }

      this.runGeneration(aiPrompt, wsSessionId, sdkSessionId).catch((err) => {
        console.error('[gen] Unhandled runGeneration error:', err);
      });
    }
  }

  private async handleCancel(): Promise<void> {
    this.trace('handler', 'cancel.enter', { hasAbort: !!this.abortController, session: this.sessionId || 'null', gen: this.isGenerating });
    if (this.abortController) {
      console.log(`Cancelling generation for session ${this.sessionId}`);
      // Abort + cancel stream to unblock streamForLiveUI immediately.
      // runGeneration/runFollowUpFast handle killing the agent and unmounting R2.
      this.abortController.abort();
      if (this.currentLogStream) {
        try { this.currentLogStream.cancel(); } catch { /* already closed */ }
        this.currentLogStream = null;
      }
      this.sendWS({
        type: 'ack',
        timestamp: new Date().toISOString(),
        message: 'Cancel requested',
      });
    }
  }

  private async handleSubscribe(ws: WebSocket, sessionId?: string, lastEventId?: number): Promise<void> {
    this.trace('handler', 'subscribe.enter', { sessionId: sessionId || 'null', lastEventId: lastEventId ?? 'null', hasEvents: this.eventBuffer.hasEvents(), gen: this.isGenerating });
    if (!sessionId) {
      this.sendToWS(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Session ID required for subscribe' });
      return;
    }

    // Try to restore session from storage if event buffer is empty (DO was reset)
    if (!this.eventBuffer.hasEvents()) {
      this.trace('handler', 'subscribe.doReset', { reason: 'empty_event_buffer' });
      const restored = await this.restoreSession();
      if (!restored || this.sessionId !== sessionId) {
        this.trace('handler', 'subscribe.notFound', { restored, storedSession: this.sessionId || 'null', requestedSession: sessionId });
        this.sendToWS(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Session not found or expired' });
        return;
      }

      // Verify the generation is actually still running by checking D1
      // (DO reset kills the sandbox process, but persisted session remains)
      if (this.campaignId) {
        try {
          const campaign = await db.getCampaignById(this.env.DB, this.campaignId, this.userId);
          const d1Status = campaign?.status ?? 'not found';
          this.trace('handler', 'subscribe.d1Check', { d1Status, campaignId: this.campaignId });
          if (!campaign || campaign.status !== 'generating') {
            this.trace('handler', 'subscribe.stale', { d1Status });
            await this.clearPersistedSession();
            this.sessionId = null;
            this.campaignId = null;
            this.isGenerating = false;
            this.sendToWS(ws, { type: 'error', timestamp: new Date().toISOString(), error: 'Session not found or expired' });
            return;
          }

          // DO was reset (event buffer empty) but D1 still says 'generating'.
          // Restart alarm — it will reconnect sandbox and poll turn-result.json.
          this.trace('handler', 'subscribe.restartAlarm', { reason: 'DO_reset_while_generating' });
          this.startKeepAlive();
        } catch (err: any) {
          this.trace('handler', 'subscribe.d1Error', { err: err?.message?.substring(0, 100) });
        }
      }

      this.trace('handler', 'subscribe.restoredFromStorage');
    }

    this.sessionId = sessionId;

    // Replay missed events to THIS WebSocket only (not all tabs)
    const missedEvents = this.eventBuffer.getEventsSince(lastEventId ?? 0);
    this.trace('handler', 'subscribe.replay', { eventCount: missedEvents.length, lastEventId: lastEventId ?? 0 });
    for (const entry of missedEvents) {
      this.sendToWS(ws, { ...entry.event, id: entry.id });
    }

    // Send subscription confirmation to THIS WebSocket only
    this.sendToWS(ws, {
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

  // ─── Agent Process Health Check ─────────────────────────────────

  private async isAgentProcessAlive(sandbox: any): Promise<boolean> {
    if (!this.agentProcessId) return false;
    try {
      const processes = await sandbox.listProcesses();
      const agent = processes.find((p: any) =>
        p.id === this.agentProcessId && p.status === 'running'
      );
      if (!agent) return false;

      // Check status file for staleness
      try {
        const statusFile = await sandbox.readFile('/app/agent-status.json');
        const statusText = typeof statusFile === 'string' ? statusFile : statusFile.content;
        const status = JSON.parse(statusText);
        if (status.status === 'processing') {
          return false; // still processing previous turn
        }
        if (status.status === 'idle' && Date.now() - status.timestamp < 7200000) {
          return true; // alive and idle within 2h
        }
      } catch {
        // Status file missing — process might be starting. Process list check was enough.
        return true;
      }
      return true;
    } catch {
      return false;
    }
  }

  // ─── Shared: Stream sandbox logs for live UI ────────────────────
  // Best-effort only — alarm handles actual completion detection.
  // Returns true if generation was cancelled during streaming.

  private async streamForLiveUI(
    logStream: ReadableStream,
    ctx: ParserContext,
    options?: { skipUntilRequestId?: string; label?: string },
  ): Promise<boolean> {
    const skipRequestId = options?.skipUntilRequestId;
    const label = options?.label || 'stream';
    let stdoutBuffer = '';
    let skippingReplay = !!skipRequestId;
    const skipTimeout = skipRequestId ? Date.now() + 120_000 : 0;
    const streamStartTime = Date.now();
    let lineCount = 0;
    const seenUuids = new Set<string>();
    this.trace('stream', 'enter', { label, skipRequestId: skipRequestId || 'none' });

    let cancelled = false;
    let error: string | undefined;
    let turnDone = false; // Must exit BOTH loops — inner break only exits line loop
    try {
      for await (const event of parseSSEStream(logStream)) {
        if (turnDone) break;

        if (this.abortController?.signal.aborted) {
          cancelled = true;
          return true;
        }

        if (skippingReplay && Date.now() > skipTimeout) {
          this.log(`[${label}] Stream timeout waiting for turn_start`);
          break;
        }

        const rawData = (event as any).data;
        if (!rawData) continue;

        stdoutBuffer += rawData;
        const lines = stdoutBuffer.split('\n');
        stdoutBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          lineCount++;
          try {
            const msg = JSON.parse(line);

            if (skippingReplay) {
              if (msg.type === 'turn_start' && msg.requestId === skipRequestId) {
                skippingReplay = false;
                this.log(`[${label}] Found turn_start after ${Date.now() - streamStartTime}ms`);
              }
              continue;
            }

            if (msg.type === 'turn_complete' || msg.type === 'result') {
              turnDone = true;
              break;
            }

            // Deduplicate: SDK yields each message twice (streaming + final).
            // Skip messages we've already processed by UUID.
            if (msg.uuid) {
              if (seenUuids.has(msg.uuid)) continue;
              seenUuids.add(msg.uuid);
            }

            await processSDKMessage(msg, ctx);
          } catch {
            // Non-JSON line — ignore
          }
        }
      }
      return false;
    } catch (err: any) {
      error = err?.message || String(err);
      throw err;
    } finally {
      this.trace('stream', 'exit', { label, lines: lineCount, ms: Date.now() - streamStartTime, cancelled, error });
    }
  }

  // ─── Shared: Setup sandbox with IP retry, R2 mount, workspace prep ───

  private async setupSandbox(options: {
    prompt: string;
    sessionId: string;
    sdkSessionId?: string;
  }): Promise<any> {
    const setupStart = Date.now();
    const { prompt, sessionId, sdkSessionId } = options;
    this.sandboxSetupInProgress = true;
    this.trace('setup', 'enter', { sessionId, hasSdkSession: !!sdkSessionId, userId: this.userId });

    // 1. Get sandbox with pre-flight IP retry
    const sandboxId = `user-${this.userId.toLowerCase()}-v2`;
    let sandbox: any = null;

    const MAX_SANDBOX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_SANDBOX_RETRIES; attempt++) {
      const retryId = attempt === 1
        ? sandboxId
        : `user-${this.userId.toLowerCase()}-v2-${Date.now()}`;

      this.log(`[gen] Getting sandbox (attempt ${attempt}/${MAX_SANDBOX_RETRIES})`);
      sandbox = getSandbox(this.env.SANDBOX, retryId, {
        sleepAfter: '2h',
        normalizeId: true,
      });

      // Clean up completed processes from previous generations
      await this.timedRPC('cleanupProcesses', () => sandbox.cleanupCompletedProcesses()).catch(() => {});

      // Kill agent-runner FIRST — it holds /mnt/r2 open (HOME=/mnt/r2),
      // which prevents fusermount/umount from detaching the FUSE mount.
      this.trace('setup', 'killAgent', { attempt });
      await this.timedRPC('killAgent', () => sandbox.exec('pkill -f agent-runner 2>/dev/null || true'));
      this.agentProcessId = null;
      await this.state.storage.delete('agentProcessId');
      await this.state.storage.delete('agentCampaignId');

      // Clean any stale R2 mount (from previous gen's unmount or partial state)
      this.trace('setup', 'cleanMount', { attempt });
      try { await this.timedRPC('unmountBucket', () => sandbox.unmountBucket('/mnt/r2')); } catch (_) {}
      await this.timedRPC('cleanFuse', () => sandbox.exec('pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2'));

      // Mount R2
      this.trace('setup', 'mountR2', { attempt });
      await this.timedRPC('mountBucket', () => sandbox.mountBucket(this.env.R2_BUCKET_NAME, '/mnt/r2', {
        endpoint: `https://${this.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        provider: 'r2',
        credentials: {
          accessKeyId: this.env.R2_ACCESS_KEY_ID,
          secretAccessKey: this.env.R2_SECRET_ACCESS_KEY,
        },
        readOnly: false,
        prefix: `/users/${this.userId}`,
      }));

      // Pre-flight: test Anthropic API from sandbox to check if IP is blocked
      this.trace('setup', 'preflight', { attempt });
      const netTest = await this.timedRPC('preflight', () => sandbox.exec(
        `node -e "
          async function test() {
            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});
            console.log('WITH_KEY='+r1.status);
            const r3 = await fetch('https://httpbin.org/ip');
            const t3 = await r3.text();
            console.log('IP='+t3.trim());
          }
          test().catch(e=>console.log('ERR='+e.message));
        "`,
        { env: { ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY } }
      ));
      const netOutput = (netTest as any)?.stdout || '';
      this.trace('setup', 'preflight.result', { attempt, output: netOutput.substring(0, 200) });

      if (netOutput.includes('WITH_KEY=200')) {
        this.trace('setup', 'preflight.ok', { attempt });
        break;
      }

      // IP is blocked (403) — destroy and retry with a new sandbox ID
      if (attempt < MAX_SANDBOX_RETRIES) {
        this.trace('setup', 'preflight.blocked', { attempt });
        try { await sandbox.destroy(); } catch (_) {}
        sandbox = null;
      } else {
        this.trace('setup', 'preflight.allBlocked', { attempts: MAX_SANDBOX_RETRIES });
      }
    }
    this.sandbox = sandbox;

    // 2. Clean previous campaign's workspace files + stale tracking data
    this.trace('setup', 'cleanWorkspace');
    await this.timedRPC('cleanWorkspace', () => sandbox.exec('rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true'));
    if (!sdkSessionId) {
      await sandbox.exec('rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true');
      this.log('[gen] Cleaned workspace for new campaign');
    }

    // 3. Hydrate agent files from D1 (for cold-start follow-up)
    if (sdkSessionId && this.campaignId) {
      try {
        const files = await db.getCampaignFiles(this.env.DB, this.campaignId);
        if (files.length > 0) {
          await sandbox.exec('mkdir -p /app/agent/files/research /app/agent/files/creatives /app/agent/.claude/skills/hook-methodology/hook-bank');

          const FILE_PATHS: Record<string, string> = {
            research: '/app/agent/files/research/restored_research.md',
            hooks: '/app/agent/.claude/skills/hook-methodology/hook-bank/restored_hooks.md',
            prompts: '/app/agent/files/creatives/restored_prompts.json',
          };

          for (const file of files) {
            const targetPath = FILE_PATHS[file.file_type];
            if (!targetPath || !file.content) continue;
            await sandbox.exec(
              `node -e "require('fs').writeFileSync(process.env.TARGET_PATH, process.env.FILE_CONTENT)"`,
              { env: { TARGET_PATH: targetPath, FILE_CONTENT: file.content } }
            );
            this.log(`[gen] Hydrated ${file.file_type} → ${targetPath} (${file.content.length} chars)`);
          }
          this.log(`[gen] Hydrated ${files.length} files from D1`);
        }
      } catch (err: any) {
        this.log(`[gen] ERROR: Failed to hydrate files from D1: ${err?.message || err}`);
      }
    }

    // 3b. Hydrate research from source campaign (for "New Campaign from Existing")
    if (this.hasSourceResearch && !sdkSessionId && this.campaignId) {
      try {
        const files = await db.getCampaignFiles(this.env.DB, this.campaignId);
        const readyFiles = files.filter(f => f.content && f.content.trim());
        if (readyFiles.length > 0) {
          await sandbox.exec('mkdir -p /app/agent/files/research /app/agent/files/creatives /app/agent/.claude/skills/hook-methodology/hook-bank');

          const FILE_PATHS: Record<string, string> = {
            research: '/app/agent/files/research/restored_research.md',
            hooks: '/app/agent/.claude/skills/hook-methodology/hook-bank/restored_hooks.md',
            prompts: '/app/agent/files/creatives/restored_prompts.json',
          };

          for (const file of readyFiles) {
            const targetPath = FILE_PATHS[file.file_type];
            if (!targetPath) continue;
            await sandbox.exec(
              `node -e "require('fs').writeFileSync(process.env.TARGET_PATH, process.env.FILE_CONTENT)"`,
              { env: { TARGET_PATH: targetPath, FILE_CONTENT: file.content } }
            );
            this.log(`[gen] Hydrated ${file.file_type} from source → ${targetPath} (${file.content.length} chars)`);
          }
        }
      } catch (err: any) {
        this.log(`[gen] Failed to hydrate source files: ${err?.message}`);
      }
    }

    // 4. Check if cancelled before starting agent
    if (this.abortController?.signal.aborted) {
      this.log('[gen] Aborted before starting agent — skipping');
      throw new DOMException('Aborted', 'AbortError');
    }

    // 5. Start agent-runner as long-lived background process
    this.trace('setup', 'startProcess', { sessionId, campaignId: this.campaignId, hasSdkSession: !!sdkSessionId });

    const agentProcess = await this.timedRPC('startProcess', () => sandbox.startProcess('node /app/dist/agent-runner.js', {
      cwd: '/app',
      env: {
        ANTHROPIC_API_KEY: this.env.ANTHROPIC_API_KEY,
        FAL_KEY: this.env.FAL_KEY,
        PROMPT: prompt,
        SESSION_ID: sessionId,
        CAMPAIGN_ID: this.campaignId || '',
        RESUME_SDK_SESSION_ID: '', // Never resume SDK session on cloudflare — JSONL via s3fs is unreliable. D1 hydration handles context.
        CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: '1',
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: '16384',
        HOME: '/root',
        IMAGE_OUTPUT_DIR: '/mnt/r2/images',
      },
    }));

    // Persist process ID so we can reconnect after DO hibernation
    const proc = agentProcess as any;
    this.agentProcessId = proc.id;
    this.lastContainerLogLen = 0; // Reset for new process
    await this.state.storage.put('agentProcessId', this.agentProcessId);
    await this.state.storage.put('agentCampaignId', this.campaignId);
    this.trace('setup', 'agentStarted', { processId: proc.id, pid: proc.pid, campaignId: this.campaignId, ms: Date.now() - setupStart });

    this.sandboxSetupInProgress = false;
    return sandbox;
  }

  // ─── Create streaming context for SDK message processing ──────

  private async createStreamingContext(
    campaignId: string | null,
    label: string,
  ): Promise<{ ctx: ParserContext; blockBuilder: BlockBuilder }> {
    const blockBuilder = new BlockBuilder();
    blockBuilder.openThinkingBlock(label);

    const textAccumulator: TextAccumulator = { text: '' };
    const processedFilenames = new Set<string>();
    // Billing baseline: distinct image count (apples-to-apples with post-turn count)
    this.preGenImageCount = campaignId
      ? (await db.getImageCount(this.env.DB, campaignId)) || 0
      : 0;
    // Image counter: use max index (not count) so new images always get fresh slots.
    // Check DO storage first to survive the race between alarm finalization and next turn.
    const storageKey = `maxImageIndex:${campaignId}`;
    const storedMax = campaignId ? ((await this.state.storage.get<number>(storageKey)) || 0) : 0;
    const dbMax = campaignId
      ? await db.getMaxImageIndex(this.env.DB, campaignId)
      : 0;
    const maxIndex = Math.max(storedMax, dbMax);
    const imageCounter = { next: maxIndex + 1 };

    const ctx: ParserContext = {
      emitEvent: (event) => this.emitEvent(event),
      sendEphemeral: (event) => this.sendWS(event),
      campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
      hasStreamedDeltas: false,
    };

    return { ctx, blockBuilder };
  }

  // ─── Fast Follow-Up (agent alive, ~30-60s) ─────────────────────
  // Stream = live UI updates only. Completion = alarm-based turn-result.json polling.

  private async runFollowUpFast(
    sandbox: any,
    prompt: string,
    sessionId: string,
    campaignId: string,
  ): Promise<void> {
    const fastStart = Date.now();
    this.trace('gen-fast', 'enter', { campaignId, sessionId, promptLen: prompt.length });
    const { ctx } = await this.createStreamingContext(campaignId, 'Processing Follow-Up');
    let wasCancelled = false;

    try {
      // 1. Set unique request ID for this turn (alarm uses it for staleness check)
      const requestId = `req_${Date.now()}`;
      this.currentRequestId = requestId;
      this.lastContainerLogLen = 0; // Reset for new turn
      await this.persistSession();
      this.trace('gen-fast', 'requestId', { requestId });

      // 2. Start streaming logs BEFORE writing prompt (avoid race condition)
      const logStream = await this.timedRPC('streamProcessLogs', () => sandbox.streamProcessLogs(this.agentProcessId!)) as ReadableStream;
      this.currentLogStream = logStream;

      // 3. Write prompt file — triggers agent-runner to process next turn
      await this.timedRPC('writePromptFile', () => sandbox.writeFile('/app/next-prompt.json', JSON.stringify({
        prompt,
        campaignId,
        requestId,
      })));
      this.trace('gen-fast', 'promptWritten');

      // 4. Stream for live UI — skip replayed history, then show new output
      wasCancelled = await this.streamForLiveUI(logStream, ctx, {
        skipUntilRequestId: requestId,
        label: 'gen-fast',
      });

      // 5. Finalize immediately after streaming — no race with alarm
      if (!wasCancelled && campaignId && sessionId) {
        await this.tryFinalize(campaignId, sessionId);
      }

      if (wasCancelled && campaignId) {
        await db.updateCampaignStatus(this.env.DB, campaignId, 'cancelled');
        await db.addMessage(this.env.DB, {
          campaignId,
          role: 'assistant',
          content: 'No worries, scrapped that one — send a new idea whenever you\'re ready',
          blocks: [],
        });
      }

    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        wasCancelled = true;
        this.trace('gen-fast', 'cancelled');
        if (campaignId) {
          await db.updateCampaignStatus(this.env.DB, campaignId, 'cancelled');
        }
      } else if (this.agentProcessId) {
        // Stream error is non-fatal — agent is still running in sandbox, alarm handles completion
        this.trace('gen-fast', 'streamError.nonFatal', { err: error.message?.substring(0, 200), agent: this.agentProcessId });
        this.emitEvent({ type: 'status', timestamp: new Date().toISOString(), message: 'Live updates paused — generation still in progress...' });
      } else {
        // Agent not running — fatal error
        this.trace('gen-fast', 'error.fatal', { err: error.message?.substring(0, 200) });
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: `Follow-up failed: ${error.message}` });
        if (campaignId) {
          await db.updateCampaignStatus(this.env.DB, campaignId, 'error');
        }
        this.isGenerating = false;
        await this.clearPersistedSession();
      }
    } finally {
      this.abortController = null;
      this.currentLogStream = null;
      if (wasCancelled) {
        this.trace('gen-fast', 'finally.cancelled');
        // Charge for images generated before cancel
        if (campaignId) await this.recordCancelledUsage(campaignId);
        this.isGenerating = false;
        if (this.sandbox && this.agentProcessId) {
          try { await this.sandbox.killProcess(this.agentProcessId); } catch (_) {}
          this.agentProcessId = null;
          await this.state.storage.delete('agentProcessId');
          await this.state.storage.delete('agentCampaignId');
        }
        if (this.sandbox) {
          try { await this.sandbox.unmountBucket('/mnt/r2'); } catch (_) {}
        }
        await this.clearPersistedSession();
      }
      this.trace('gen-fast', 'exit', { wasCancelled, ms: Date.now() - fastStart });
    }
  }

  // ─── Generation (Phase 4: Sandbox execution) ─────────────────

  private async runGeneration(prompt: string, sessionId: string, sdkSessionId?: string): Promise<void> {
    if (this.env.AI_BACKEND === 'local') {
      return this.runGenerationLocal(prompt, sessionId, sdkSessionId);
    }
    const genStart = Date.now();
    this.trace('gen', 'enter', { sessionId, hasSdkSession: !!sdkSessionId, promptLen: prompt.length });

    const { ctx } = await this.createStreamingContext(this.campaignId, 'Parsing Request');
    let wasCancelled = false;

    try {
      // Setup sandbox: IP retry, R2 mount, workspace prep, start agent
      const sandbox = await this.setupSandbox({ prompt, sessionId, sdkSessionId });

      // Stream logs for live UI only (best-effort, not for completion)
      this.trace('gen', 'streamProcessLogs.start');
      const logStream = await this.timedRPC('streamProcessLogs', () => sandbox.streamProcessLogs(this.agentProcessId!)) as ReadableStream;
      this.currentLogStream = logStream;
      wasCancelled = await this.streamForLiveUI(logStream, ctx, { label: 'gen' });

      // Finalize immediately after streaming — no race with alarm
      if (!wasCancelled && this.campaignId && this.sessionId) {
        await this.tryFinalize(this.campaignId, this.sessionId);
      }

      if (wasCancelled && this.campaignId) {
        await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: 'No worries, scrapped that one — send a new idea whenever you\'re ready',
          blocks: [],
        });
      }

    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        wasCancelled = true;
        this.trace('gen', 'cancelled');
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
        }
      } else if (this.agentProcessId) {
        // Stream error is non-fatal — agent is still running in sandbox, alarm handles completion
        this.trace('gen', 'streamError.nonFatal', { err: error.message?.substring(0, 200), agent: this.agentProcessId });
        this.emitEvent({ type: 'status', timestamp: new Date().toISOString(), message: 'Live updates paused — generation still in progress...' });
      } else {
        // Setup failed before agent started — this IS fatal, no alarm can recover
        this.trace('gen', 'setupError.fatal', { err: error.message?.substring(0, 200) });
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: `Setup failed: ${error.message}` });
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
        }
        this.isGenerating = false;
        await this.clearPersistedSession();
      }
    } finally {
      this.sandboxSetupInProgress = false;
      this.abortController = null;
      this.currentLogStream = null;
      if (wasCancelled) {
        this.trace('gen', 'finally.cancelled');
        // Charge for images generated before cancel
        if (this.campaignId) await this.recordCancelledUsage(this.campaignId);
        this.isGenerating = false;
        if (this.sandbox && this.agentProcessId) {
          try { await this.sandbox.killProcess(this.agentProcessId); } catch (_) {}
          this.agentProcessId = null;
          await this.state.storage.delete('agentProcessId');
          await this.state.storage.delete('agentCampaignId');
        }
        if (this.sandbox) {
          try { await this.sandbox.unmountBucket('/mnt/r2'); } catch (_) {}
        }
        await this.clearPersistedSession();
      }
      this.trace('gen', 'exit', { wasCancelled, ms: Date.now() - genStart });
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
      sendEphemeral: (event) => this.sendWS(event),
      campaignId: this.campaignId,
      d1: this.env.DB,
      processedFilenames,
      textAccumulator,
      blockBuilder,
      imageCounter,
      hasStreamedDeltas: false,
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
        blockBuilder.addStatusBlock('No worries, scrapped that one — send a new idea whenever you\'re ready', 'info');
        await db.addMessage(this.env.DB, {
          campaignId: this.campaignId,
          role: 'assistant',
          content: 'No worries, scrapped that one — send a new idea whenever you\'re ready',
          blocks: blockBuilder.getBlocks(),
        });
      }
    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || this.abortController?.signal.aborted;
      if (isAbort) {
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'cancelled');
          blockBuilder.addStatusBlock('No worries, scrapped that one — send a new idea whenever you\'re ready', 'info');
          await db.addMessage(this.env.DB, {
            campaignId: this.campaignId,
            role: 'assistant',
            content: 'No worries, scrapped that one — send a new idea whenever you\'re ready',
            blocks: blockBuilder.getBlocks(),
          });
        }
      } else {
        // Local dev — no sandbox/alarm, this is a real error
        const errorMsg = error.message || 'Unknown error';
        this.emitEvent({ type: 'error', timestamp: new Date().toISOString(), error: errorMsg });
        if (this.campaignId) {
          await db.updateCampaignStatus(this.env.DB, this.campaignId, 'error');
        }
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
      await this.clearPersistedSession();
    }
  }

  // ─── Asset Resolution ────────────────────────────────────────

  /** Resolve asset file IDs → R2 objects → fal.ai public URLs for reference images */
  private async resolveAssetUrls(assetFileIds: string[]): Promise<{ falUrls: string[]; sandboxPaths: string[] }> {
    const falUrls: string[] = [];
    const sandboxPaths: string[] = [];

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
        falUrls.push(publicUrl);

        // R2 mount path — accessible on sandbox after mountBucket()
        const sandboxPath = `/mnt/r2/uploads/${file.file_path}`;
        sandboxPaths.push(sandboxPath);

        console.log(`Resolved asset: ${file.name} → fal: ${publicUrl}, sandbox: ${sandboxPath}`);
      } catch (err) {
        console.error(`Failed to resolve asset ${fileId}:`, err);
      }
    }

    return { falUrls, sandboxPaths };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  /** Emit an event: buffer it AND broadcast to all connected WebSockets */
  private emitEvent(event: ServerMessage): void {
    const eventId = this.eventBuffer.append(event);
    const wsCount = this.state.getWebSockets().length;
    this.trace('emit', event.type, { eventId, wsCount });
    // Direct console.log for complete/error — bypasses tailLog buffer
    const t = (event as any).type;
    if (t === 'complete' || t === 'error') {
      console.log(`[ws-emit] ${t} eventId=${eventId} wsCount=${wsCount} cid=${this.campaignId}`);
    }
    const payload = JSON.stringify({ ...event, id: eventId });
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch { /* closed — ignore */ }
    }
  }

  /** Broadcast without buffering (for ack, pong, errors that don't need replay) */
  private sendWS(event: ServerMessage): void {
    // Direct console.log for streaming events — bypasses tailLog buffer so it appears in wrangler tail immediately
    const t = (event as any).type;
    if (t === 'text_start' || t === 'text_end' || t === 'text_delta') {
      console.log(`[ws-send] ${t}${t === 'text_delta' ? ` len=${((event as any).delta || '').length}` : ''} cid=${this.campaignId}`);
    }
    const payload = JSON.stringify(event);
    for (const ws of this.state.getWebSockets()) {
      try { ws.send(payload); } catch { /* closed — ignore */ }
    }
  }

  /** Send to a specific WebSocket (for subscribe replay, not broadcast) */
  private sendToWS(ws: WebSocket, event: ServerMessage): void {
    try { ws.send(JSON.stringify(event)); } catch { /* closed — ignore */ }
  }

  /** Generate summary from text accumulator with hook-based fallback */
  private generateSummary(textAccumulator: TextAccumulator, imageCounter: { next: number }): string {
    if (textAccumulator.text.trim()) {
      return stripImageUrls(textAccumulator.text);
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
