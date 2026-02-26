import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { WSServerMessage, WSConnectionState } from '../types/websocket';
import { isPhaseEvent, isToolStartEvent, isFileEvent, isImageEvent, isCompleteEvent, isErrorEvent } from '../types/websocket';
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

function getLastEventId(sessionId: string): number {
  const saved = localStorage.getItem(STORAGE_KEYS.LAST_EVENT_ID(sessionId));
  return saved ? parseInt(saved, 10) || 0 : 0;
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

// ── Hook ───────────────────────────────────────────────────────

export interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  isConnected: boolean;
  isRecovering: boolean;
  generate: (prompt: string, assetFileIds?: string[]) => void;
  cancel: () => void;
  resume: (campaignId: string, resumePrompt: string) => void;
  followUp: (campaignId: string, prompt: string, assetFileIds?: string[]) => void;
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
            store.addThinkingChild(campaignId, messageId, { kind: 'phase', text: message.label || message.phase });
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
            store.addThinkingChild(campaignId, messageId, { kind: 'tool', text: toolText });
          }
          break;

        case 'tool_end':
          break;

        case 'message':
          if (message.type === 'message' && 'text' in message && message.text && campaignId && messageId) {
            store.appendMessageContent(campaignId, messageId, message.text);
            // Only show message text in UI during follow-ups (actual AI response).
            // During initial generation, thinking blocks already show workflow progress.
            if (store.isFollowUp) {
              store.appendTextBlock(campaignId, messageId, message.text);
            }
          }
          break;

        case 'status':
          if (message.type === 'status' && 'message' in message && message.message) {
            if (message.message.toLowerCase().includes('cancelled') && campaignId && messageId) {
              store.cancelGeneration(campaignId, messageId);
              clearActiveSession();
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
            // Only add summary text block for initial generation (not follow-ups).
            // Follow-ups already have the AI response in text blocks from message events.
            if (!store.isFollowUp) {
              store.appendTextBlock(campaignId, messageId, summary);
            }
            store.completeGeneration(campaignId, messageId, summary);
            clearActiveSession();
            sessionIdRef.current = null;
          }
          break;

        case 'error':
          if (isErrorEvent(message)) {
            const errorMsg = message.error || 'Unknown error';
            console.error('WebSocket: Error event:', errorMsg);

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

  const generate = useCallback((prompt: string, assetFileIds?: string[]) => {
    if (!prompt.trim()) return;

    const store = useStore.getState();
    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    const campaignName = extractCampaignName(prompt);
    const { campaignId, messageId } = store.startGeneration(sessionId, campaignName, prompt);

    saveActiveSession(sessionId, prompt, campaignId, messageId);

    store.openThinkingBlock(campaignId, messageId, `Starting generation for ${campaignName}...`);

    const sent = wsManager.sendMessage({
      type: 'generate',
      prompt,
      sessionId,
      ...(assetFileIds && assetFileIds.length > 0 ? { assetFileIds } : {}),
    });

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

  const followUp = useCallback((campaignId: string, prompt: string, assetFileIds?: string[]) => {
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
