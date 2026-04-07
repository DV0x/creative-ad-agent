import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { WSServerMessage, WSConnectionState } from '../types/websocket';
import { isPhaseEvent, isToolStartEvent, isFileEvent, isImageEvent, isCompleteEvent, isErrorEvent, isCreditsUpdateEvent } from '../types/websocket';
import { getHookTypeForIndex } from '../types/chat';
import * as wsManager from '../lib/websocket-manager';
import { campaignsApi } from '../lib/api';

// ── Storage keys for session persistence ───────────────────────

const STORAGE_KEYS = {
  ACTIVE_SESSION: 'creative-agent:activeSession',
  LAST_EVENT_ID: (sessionId: string) => `creative-agent:lastEventId:${sessionId}`
};

// ── Session persistence helpers ────────────────────────────────

function saveActiveSession(sessionId: string, prompt: string, campaignId: string, messageId: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify({
    sessionId,
    prompt,
    campaignId,
    messageId,
    startedAt: Date.now()
  }));
}

interface SavedSession {
  sessionId: string;
  prompt: string;
  campaignId: string;
  messageId: string;
  startedAt: number;
}

function getActiveSession(): SavedSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function clearActiveSession(): void {
  const session = getActiveSession();
  if (session) {
    localStorage.removeItem(STORAGE_KEYS.LAST_EVENT_ID(session.sessionId));
  }
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
}

function saveLastEventId(sessionId: string, eventId: number): void {
  localStorage.setItem(STORAGE_KEYS.LAST_EVENT_ID(sessionId), String(eventId));
}

// Strip common command prefixes from prompts to extract the meaningful part
const COMMAND_PREFIX_RE = /^(?:create|make|generate|design|build|do|run|produce)\s+(?:an?\s+)?(?:single\s+|two\s+|three\s+|four\s+|five\s+|six\s+|\d+\s+)?(?:\d+\s+)?(?:ads?|campaigns?|creatives?|images?|visuals?)\s+(?:for\s+)?/i;

// Extract brand and campaign name from prompt
// e.g., "create 2 ads for https://traya.health/ targeting 30+" -> { brand: "Traya", campaignName: "Traya Ads" }
// e.g., "bombayshirts.com - festive collection" -> { brand: "Bombayshirts", campaignName: "Bombayshirts — Festive Collection" }
// e.g., "Local bakery in Austin targeting foodies" -> { brand: "Local Bakery In Austin", campaignName: "Local Bakery In Austin" }
function extractBrandAndName(prompt: string): { brand: string; campaignName: string } {
  const domainMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)(?:\.[a-z]+)/i);
  if (domainMatch) {
    const brand = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    // Strip the URL and any command prefix, then extract meaningful brief
    const withoutUrl = prompt.replace(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-z]+\/?/gi, ' ');
    const withoutPrefix = withoutUrl.replace(COMMAND_PREFIX_RE, '').replace(/^\s*[-–—:,/]\s*/, '').trim();
    // Take the remaining meaningful text as a brief (max 40 chars, clean word boundary)
    if (withoutPrefix) {
      const raw = withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
      const brief = raw.length <= 40 ? raw : raw.substring(0, 40).replace(/\s+\S*$/, '');
      return { brand, campaignName: brief ? `${brand} — ${brief}` : `${brand} Ads` };
    }
    return { brand, campaignName: `${brand} Ads` };
  }
  // No URL — use meaningful part as both brand and campaign name
  const stripped = prompt.replace(COMMAND_PREFIX_RE, '').trim();
  const meaningful = stripped || prompt.trim();
  const raw = meaningful.charAt(0).toUpperCase() + meaningful.slice(1);
  const campaignName = raw.length <= 50 ? raw : raw.substring(0, 50).replace(/\s+\S*$/, '');
  const brand = campaignName || 'Campaign';
  return { brand, campaignName: brand };
}

// ── Hook ───────────────────────────────────────────────────────

export interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  isConnected: boolean;
  isRecovering: boolean;
  generate: (prompt: string, assetFileIds?: string[], aspectRatio?: string) => void;
  cancel: () => void;
  resume: (campaignId: string, resumePrompt: string) => void;
  followUp: (campaignId: string, prompt: string, assetFileIds?: string[], aspectRatio?: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  // Only subscribe to values that affect rendering (2 instead of ~20)
  const connectionState = useStore(state => state.connectionState);
  const isRecovering = useStore(state => state.isRecovering);

  // Session refs
  const sessionIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef<number>(0);

  // ── Message handler ────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSServerMessage = JSON.parse(event.data);

      // Track event ID for recovery
      if (typeof message.id === 'number' && sessionIdRef.current) {
        lastEventIdRef.current = message.id;
        saveLastEventId(sessionIdRef.current, message.id);
      }

      const store = useStore.getState();
      const campaignId = store.generatingCampaignId;
      const messageId = store.currentGeneratingMessageId;

      switch (message.type) {
        case 'subscribed':
          console.log('WebSocket: Subscribed to session, recovery complete');
          store.setIsRecovering(false);
          return;

        case 'phase':
          if (isPhaseEvent(message) && campaignId && messageId) {
            const label = message.label || message.phase;
            // Open a thinking block if none exists yet (follow-ups don't pre-create one)
            if (!store.hasActiveThinkingBlock(campaignId, messageId)) {
              store.openThinkingBlock(campaignId, messageId, label, message.imageCount);
            } else {
              store.addThinkingChild(campaignId, messageId, { kind: 'phase', text: label });
            }
          }
          break;

        case 'tool_start':
          if (isToolStartEvent(message) && campaignId && messageId) {
            let toolText = message.tool;
            if (message.tool === 'Task' && message.input?.subagent_type) {
              toolText = `Task [${message.input.subagent_type}]`;
            } else if (message.tool === 'Skill' && message.input?.skill) {
              toolText = `Skill [${message.input.skill}]`;
            }
            // Open a thinking block if none exists yet (follow-ups don't pre-create one)
            if (!store.hasActiveThinkingBlock(campaignId, messageId)) {
              store.openThinkingBlock(campaignId, messageId, toolText);
            }
            store.addThinkingChild(campaignId, messageId, { kind: 'tool', text: toolText });
          }
          break;

        case 'tool_end':
          break;

        case 'text_start':
          if (campaignId && messageId) {
            // Commit any leftover streaming text from a missed text_end (safety net)
            store.commitStreamingText();
            // If the thinking block has no real steps (just the placeholder from follow-up),
            // remove it — text-only responses don't need a thinking block
            store.removeEmptyThinkingBlock(campaignId, messageId);
            store.setTextStreaming(campaignId, messageId, true);
          }
          break;

        case 'text_delta':
          if ('delta' in message && message.delta && store.generatingCampaignId) {
            store.appendTextDelta(message.delta);
          }
          break;

        case 'text_end':
          if (campaignId && messageId) {
            store.commitStreamingText();
            store.setTextStreaming(campaignId, messageId, false);
          }
          break;

        case 'message':
          // Fallback for local runner — only fires when NOT actively streaming.
          // During streaming, deltas go to streamingText scratch pad instead.
          if (message.type === 'message' && 'text' in message && message.text && campaignId && messageId) {
            if (!store.streamingText) {
              store.appendTextBlock(campaignId, messageId, message.text);
            }
          }
          break;

        case 'status':
          if (message.type === 'status' && 'message' in message && message.message) {
            if (message.message.toLowerCase().includes('cancelled') && campaignId && messageId) {
              store.cancelGeneration(campaignId, messageId);
              clearActiveSession();
            } else if (campaignId && messageId) {
              store.addThinkingChild(campaignId, messageId, { kind: 'status', text: message.message, variant: 'info' });
            }
          }
          break;

        case 'file':
          if (isFileEvent(message) && campaignId && messageId) {
            store.updateCampaignFile(campaignId, message.fileType, message.content);
            store.addThinkingChild(campaignId, messageId, { kind: 'status', text: `${message.fileType}.md created`, variant: 'info' });
            // Prompts file is the authoritative source for expected image count
            if (message.fileType === 'prompts' && message.content) {
              try {
                const prompts = JSON.parse(message.content);
                if (Array.isArray(prompts) && prompts.length > 0) {
                  store.setGenerationExpectedImages(prompts.length);
                }
              } catch { /* not valid JSON, keep current count */ }
            }
          }
          break;

        case 'image':
          if (isImageEvent(message) && campaignId && messageId) {
            store.addImageToCampaign(campaignId, {
              id: message.imageIndex,
              url: message.urlPath,
              prompt: message.prompt,
              hookType: message.hookType || getHookTypeForIndex(message.imageIndex),
              version: 1,
            });
            store.updateThinkingImages(campaignId, messageId, message.imageIndex);
          }
          break;

        case 'complete':
          if (isCompleteEvent(message) && campaignId && messageId) {
            const imgCount = message.imageCount || store.generationExpectedImages;
            const summary = message.summary ||
              `Created ${imgCount} ad concept${imgCount !== 1 ? 's' : ''}. You can edit the hooks and prompts in the sidebar, or select images to regenerate them.`;

            store.closeThinkingBlock(campaignId, messageId, 'complete');
            // Commit any remaining streaming text (safety net if text_end was missed)
            store.commitStreamingText();
            // Merge all text blocks into one + strip image URLs for visual parity with D1
            store.mergeAndStripTextBlocks(campaignId, messageId);
            // Only add summary text if no text blocks exist at all
            const msgs = useStore.getState().chatMessages[campaignId] || [];
            const msg = msgs.find(m => m.id === messageId);
            const hasText = msg?.blocks?.some(b => b.type === 'text') ?? false;
            if (!hasText) {
              store.appendTextBlock(campaignId, messageId, summary);
            }
            store.completeGeneration(campaignId, messageId, summary);
            clearActiveSession();
            sessionIdRef.current = null;
          }
          break;

        case 'credits_update':
          if (isCreditsUpdateEvent(message)) {
            store.setCreditBalance(message.balance);
          }
          break;

        case 'error':
          if (isErrorEvent(message)) {
            const errorMsg = message.error || 'Unknown error';
            console.error('WebSocket: Error event:', errorMsg);

            // Insufficient credits — close spinner, show error in chat
            if (message.code === 'INSUFFICIENT_CREDITS') {
              const genCampaignId = store.generatingCampaignId;
              const genMessageId = store.currentGeneratingMessageId;
              if (genCampaignId && genMessageId) {
                store.closeThinkingBlock(genCampaignId, genMessageId, 'error');
                store.failGeneration(genCampaignId, genMessageId, errorMsg);
              } else {
                store.setError(errorMsg);
              }
              clearActiveSession();
              break;
            }

            if (errorMsg.includes('Session not found') || errorMsg.includes('expired')) {
              clearActiveSession();
              store.cleanupFailedRecovery();
              sessionIdRef.current = null;
              break;
            }

            if (campaignId && messageId) {
              store.closeThinkingBlock(campaignId, messageId, 'error');
              store.appendTextBlock(campaignId, messageId, `Error: ${errorMsg}`);
              store.failGeneration(campaignId, messageId, errorMsg);
            } else {
              store.setError(errorMsg);
            }
            clearActiveSession();
          }
          break;

        case 'incomplete':
          // API error (billing, rate limit, etc.) — campaign is resumable
          if (campaignId && messageId) {
            store.closeThinkingBlock(campaignId, messageId, 'error');
            const incompleteMsg = ('message' in message && typeof message.message === 'string')
              ? message.message
              : 'Generation interrupted — will resume on your next message.';
            store.appendTextBlock(campaignId, messageId, incompleteMsg);
            store.updateCampaignStatus(campaignId, 'incomplete');
          }
          clearActiveSession();
          sessionIdRef.current = null;
          break;

        case 'ack':
          if ('campaignId' in message && message.campaignId) {
            const serverCampaignId = message.campaignId as string;
            const localCampaignId = store.generatingCampaignId;

            if (localCampaignId && localCampaignId !== serverCampaignId) {
              store.replaceCampaignId(localCampaignId, serverCampaignId);
              const session = getActiveSession();
              if (session) {
                saveActiveSession(session.sessionId, session.prompt, serverCampaignId, session.messageId);
              }
            }
            const ackCampaignId = store.generatingCampaignId;
            if (ackCampaignId && messageId) {
              store.addThinkingChild(ackCampaignId, messageId, { kind: 'progress', text: 'Generation started' });
            }
          }
          break;

        case 'pong':
          break;

        default:
          console.log('Unknown WebSocket message type:', (message as { type: string }).type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, []);

  // ── Connected handler (recovery logic) ─────────────────────

  const handleConnected = useCallback(() => {
    const savedSession = getActiveSession();
    if (!savedSession) return;

    const store = useStore.getState();
    sessionIdRef.current = savedSession.sessionId;

    // If recovery is already active for this campaign (e.g. WebSocket reconnected),
    // just re-subscribe without creating duplicate messages.
    if (store.generatingCampaignId === savedSession.campaignId && store.currentGeneratingMessageId) {
      console.log(`WebSocket: Re-subscribing to session ${savedSession.sessionId} (recovery already active)`);
      wsManager.sendMessage({
        type: 'subscribe',
        sessionId: savedSession.sessionId,
        lastEventId: lastEventIdRef.current
      });
      return;
    }

    console.log(`WebSocket: Recovering session ${savedSession.sessionId}`);
    store.setIsRecovering(true);

    // Set up recovery state (generatingCampaignId, etc.) immediately
    // so setCampaigns/setChatMessages know to preserve this campaign.
    store.reconstructForRecovery(
      savedSession.sessionId,
      savedSession.prompt,
      savedSession.campaignId
    );

    const recoverMessageId = useStore.getState().currentGeneratingMessageId;
    if (recoverMessageId) {
      store.openThinkingBlock(savedSession.campaignId, recoverMessageId, 'Recovering session...');
    }

    // Subscribe immediately — events that arrive before setCampaigns loads
    // the campaign are buffered by the store (_pendingImages/_pendingFiles)
    // and flushed when setCampaigns runs.
    wsManager.sendMessage({
      type: 'subscribe',
      sessionId: savedSession.sessionId,
      lastEventId: lastEventIdRef.current
    });

    // Load historical messages in background (non-blocking).
    // App.tsx excludes the recovering campaign from setChatMessages to avoid
    // overwriting live recovery state, so we load its history here instead.
    campaignsApi.get(savedSession.campaignId).then(({ messages }) => {
      if (messages.length > 0) {
        const currentStore = useStore.getState();
        const existing = currentStore.chatMessages[savedSession.campaignId] || [];
        currentStore.setChatMessagesForCampaign(savedSession.campaignId, [
          ...messages,
          ...existing,
        ]);
      }
    }).catch(() => { /* recovery works without history */ });

    // Recovery timeout
    setTimeout(() => {
      if (useStore.getState().isRecovering) {
        console.warn('WebSocket: Recovery timed out, clearing recovery state');
        useStore.getState().setIsRecovering(false);
        clearActiveSession();
      }
    }, 45_000);
  }, []);

  // ── Refs so manager always calls latest callbacks ──────────

  const handleMessageRef = useRef(handleMessage);
  handleMessageRef.current = handleMessage;

  const handleConnectedRef = useRef(handleConnected);
  handleConnectedRef.current = handleConnected;

  // ── Subscribe to manager on mount ──────────────────────────

  useEffect(() => {
    wsManager.setCallbacks({
      onStateChange: (state) => useStore.getState().setConnectionState(state as WSConnectionState),
      onMessage: (event) => handleMessageRef.current(event),
      onConnected: () => handleConnectedRef.current(),
    });
    wsManager.subscribe();

    return () => {
      wsManager.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ────────────────────────────────────────────────

  const generate = useCallback((prompt: string, assetFileIds?: string[], aspectRatio?: string) => {
    if (!prompt.trim()) return;

    const store = useStore.getState();
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    // Extract brand + campaign name from prompt, or inherit from source campaign
    const { sourceCampaignId, sourceCampaignName } = store;
    let brand: string | null;
    let campaignName: string;

    if (sourceCampaignId && sourceCampaignName) {
      // Creating from existing brand — inherit brand, use prompt as campaign name
      brand = sourceCampaignName;
      const trimmed = prompt.trim();
      campaignName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      campaignName = campaignName.substring(0, 60) || 'New Campaign';
    } else {
      // New brand — extract from URL or use prompt
      const extracted = extractBrandAndName(prompt);
      brand = extracted.brand;
      campaignName = extracted.campaignName;
    }

    const { campaignId, messageId } = store.startGeneration(sessionId, campaignName, prompt, brand);

    saveActiveSession(sessionId, prompt, campaignId, messageId);

    store.openThinkingBlock(campaignId, messageId, `Starting generation for ${brand ? `${brand} — ${campaignName}` : campaignName}...`);

    const sent = wsManager.sendMessage({
      type: 'generate',
      prompt,
      sessionId,
      ...(sourceCampaignId ? { sourceCampaignId } : {}),
      ...(assetFileIds && assetFileIds.length > 0 ? { assetFileIds } : {}),
      ...(aspectRatio ? { aspectRatio } : {}),
      ...(brand ? { brand } : {}),
    });

    // Clear source campaign state after sending
    if (sourceCampaignId) {
      store.setSourceCampaign(null);
    }

    if (!sent) {
      store.failGeneration(campaignId, messageId, 'WebSocket not connected');
      clearActiveSession();
    }
  }, []);

  const cancel = useCallback(() => {
    wsManager.sendMessage({ type: 'cancel' });

    const store = useStore.getState();
    const campaignId = store.generatingCampaignId;
    const messageId = store.currentGeneratingMessageId;
    if (campaignId && messageId) {
      store.closeThinkingBlock(campaignId, messageId, 'error');
      // Discard any in-progress streaming text before adding cancel message
      store.commitStreamingText();
      store.appendTextBlock(campaignId, messageId, 'Generation was cancelled.');
      store.cancelGeneration(campaignId, messageId);
    }

    clearActiveSession();
  }, []);

  const resume = useCallback((campaignId: string, resumePrompt: string) => {
    if (!resumePrompt.trim()) return;

    const store = useStore.getState();
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    const { messageId } = store.resumeGeneration(sessionId, campaignId);

    saveActiveSession(sessionId, resumePrompt, campaignId, messageId);

    store.openThinkingBlock(campaignId, messageId, 'Resuming generation...');

    const sent = wsManager.sendMessage({
      type: 'generate',
      prompt: resumePrompt,
      sessionId
    });

    if (!sent) {
      store.failGeneration(campaignId, messageId, 'WebSocket not connected');
      clearActiveSession();
    }
  }, []);

  const followUp = useCallback((campaignId: string, prompt: string, assetFileIds?: string[], aspectRatio?: string) => {
    if (!prompt.trim()) return;

    const store = useStore.getState();
    const campaign = store.campaigns.find(c => c.id === campaignId);
    const { messageId } = store.startFollowUp(campaignId, prompt);

    // Save session for recovery on page refresh (matches generate/resume pattern)
    if (campaign?.sessionId) {
      sessionIdRef.current = campaign.sessionId;
      lastEventIdRef.current = 0;
      saveActiveSession(campaign.sessionId, prompt, campaignId, messageId);
    }

    store.openThinkingBlock(campaignId, messageId, 'Processing follow-up...');

    const sent = wsManager.sendMessage({
      type: 'follow_up',
      prompt,
      campaignId,
      ...(assetFileIds && assetFileIds.length > 0 ? { assetFileIds } : {}),
      ...(aspectRatio ? { aspectRatio } : {}),
    });

    if (!sent) {
      store.failGeneration(campaignId, messageId, 'WebSocket not connected');
      clearActiveSession();
    }
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isRecovering,
    generate,
    cancel,
    resume,
    followUp,
  };
}
