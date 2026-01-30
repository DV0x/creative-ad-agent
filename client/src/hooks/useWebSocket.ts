import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { WSClientMessage, WSServerMessage, WSConnectionState } from '../types/websocket';
import { isPhaseEvent, isToolStartEvent, isFileEvent, isImageEvent, isCompleteEvent, isErrorEvent } from '../types/websocket';
import { getHookTypeForIndex } from '../types/chat';
import type { ThinkingLineType } from '../types/chat';
import { getAuthToken } from '../lib/api';

// WebSocket URL - always use current host so Vite proxy can handle it in dev
const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const PING_INTERVAL = 25000;

// Storage keys for session persistence
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'creative-agent:activeSession',
  LAST_EVENT_ID: (sessionId: string) => `creative-agent:lastEventId:${sessionId}`
};

// Session persistence helpers
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
  return saved ? parseInt(saved, 10) : 0;
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

export interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  isConnected: boolean;
  isRecovering: boolean;
  generate: () => void;
  cancel: () => void;
  resume: (campaignId: string, resumePrompt: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const {
    prompt,
    connectionState,
    isRecovering,
    generatingCampaignId,
    currentGeneratingMessageId,
    setConnectionState,
    setIsRecovering,
    setError,
    startGeneration,
    resumeGeneration,
    reconstructForRecovery,
    cleanupFailedRecovery,
    completeGeneration,
    cancelGeneration,
    failGeneration,
    addThinkingLine,
    addImageToCampaign,
    updateCampaignFile,
    replaceCampaignId,
    incrementCompletedImages,
    setGenerationExpectedImages,
    generationExpectedImages,
    setAppState,
  } = useStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef<number>(0);
  const promptRef = useRef<string>('');

  // Track current generation context
  const campaignIdRef = useRef<string | null>(null);
  const messageIdRef = useRef<string | null>(null);

  // Keep refs in sync with store
  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    campaignIdRef.current = generatingCampaignId;
  }, [generatingCampaignId]);

  useEffect(() => {
    messageIdRef.current = currentGeneratingMessageId;
  }, [currentGeneratingMessageId]);

  // Send message helper
  const sendMessage = useCallback((message: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Add a thinking line to the current generating message
  const addThinking = useCallback((type: ThinkingLineType, text: string, indent: number = 0) => {
    const messageId = messageIdRef.current;
    if (messageId) {
      addThinkingLine(messageId, { type, text, indent });
    }
  }, [addThinkingLine]);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSServerMessage = JSON.parse(event.data);

      // Track event ID for recovery
      if (typeof message.id === 'number' && sessionIdRef.current) {
        lastEventIdRef.current = message.id;
        saveLastEventId(sessionIdRef.current, message.id);
      }

      const campaignId = campaignIdRef.current;
      const messageId = messageIdRef.current;

      switch (message.type) {
        case 'subscribed':
          console.log('WebSocket: Subscribed to session, recovery complete');
          setIsRecovering(false);
          return;

        case 'phase':
          if (isPhaseEvent(message) && messageId) {
            addThinking('phase', message.label || message.phase, 0);
            // When images phase starts, the server includes the expected image count
            if (message.phase === 'images' && message.imageCount) {
              setGenerationExpectedImages(message.imageCount);
            }
          }
          break;

        case 'tool_start':
          if (isToolStartEvent(message) && messageId) {
            let toolText = message.tool;
            if (message.tool === 'Task' && message.input?.subagent_type) {
              toolText = `Task [${message.input.subagent_type}]`;
            } else if (message.tool === 'Skill' && message.input?.skill) {
              toolText = `Skill [${message.input.skill}]`;
            }
            addThinking('tool', toolText, 1);
          }
          break;

        case 'tool_end':
          // Silent - tool completion doesn't need a line
          break;

        case 'message':
          if (message.type === 'message' && 'text' in message && message.text && messageId) {
            // Truncate long messages for the thinking display
            const text = message.text.length > 100 ? message.text.slice(0, 100) + '...' : message.text;
            addThinking('result', text, 1);
          }
          break;

        case 'status':
          if (message.type === 'status' && 'message' in message && message.message) {
            // Handle cancellation status
            if (message.message.toLowerCase().includes('cancelled') && campaignId && messageId) {
              cancelGeneration(campaignId, messageId);
              clearActiveSession();
            }
          }
          break;

        case 'file':
          // New: Handle file content from backend
          if (isFileEvent(message) && campaignId) {
            console.log('WebSocket: Received file event:', message.fileType);
            updateCampaignFile(campaignId, message.fileType, message.content);
            addThinking('result', `Created ${message.fileType}.md`, 1);
          }
          break;

        case 'image':
          if (isImageEvent(message) && campaignId && messageId) {
            console.log('WebSocket: Received image event:', message.imageIndex);

            // Add image to campaign
            addImageToCampaign(campaignId, {
              id: message.imageIndex,
              url: message.urlPath,
              prompt: message.prompt,
              hookType: message.hookType || getHookTypeForIndex(message.imageIndex),
              version: 1,
            });

            // Update progress
            incrementCompletedImages(messageId);
            const expected = useStore.getState().generationExpectedImages;
            addThinking('progress', `Image ${message.imageIndex}/${expected} generated`, 1);
          }
          break;

        case 'complete':
          if (isCompleteEvent(message) && campaignId && messageId) {
            console.log('WebSocket: Received complete event');
            addThinking('success', 'Complete', 0);

            const imgCount = message.imageCount || useStore.getState().generationExpectedImages;
            const summary = message.summary ||
              `Created ${imgCount} ad concept${imgCount !== 1 ? 's' : ''}. You can edit the hooks and prompts in the sidebar, or select images to regenerate them.`;

            completeGeneration(campaignId, messageId, summary);
            clearActiveSession();
            sessionIdRef.current = null;
          }
          break;

        case 'error':
          if (isErrorEvent(message)) {
            const errorMsg = message.error || 'Unknown error';
            console.error('WebSocket: Error event:', errorMsg);

            // Stale session from a previous run — clean up silently
            if (errorMsg.includes('Session not found') || errorMsg.includes('expired')) {
              console.log('WebSocket: Stale session detected, cleaning up');
              clearActiveSession();
              cleanupFailedRecovery();
              sessionIdRef.current = null;
              campaignIdRef.current = null;
              messageIdRef.current = null;
              break;
            }

            if (campaignId && messageId) {
              addThinking('error', errorMsg, 0);
              failGeneration(campaignId, messageId, errorMsg);
            } else {
              setError(errorMsg);
            }
            clearActiveSession();
          }
          break;

        case 'ack':
          // Server sends the real DB campaign ID — adopt it so all
          // subsequent API calls (file saves, renames, etc.) use the
          // correct ID that actually exists in the database.
          if ('campaignId' in message && message.campaignId) {
            const serverCampaignId = message.campaignId as string;
            const localCampaignId = campaignIdRef.current;

            if (localCampaignId && localCampaignId !== serverCampaignId) {
              console.log(`WebSocket: Replacing local campaign ID ${localCampaignId} → ${serverCampaignId}`);
              replaceCampaignId(localCampaignId, serverCampaignId);
              campaignIdRef.current = serverCampaignId;

              // Update localStorage session with the real campaign ID
              const session = getActiveSession();
              if (session) {
                saveActiveSession(session.sessionId, session.prompt, serverCampaignId, session.messageId);
              }
            }
          }
          break;

        case 'pong':
          // Heartbeat response - silent
          break;

        default:
          // All known types are handled above
          console.log('Unknown WebSocket message type:', (message as { type: string }).type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [
    setIsRecovering,
    addThinking,
    cancelGeneration,
    updateCampaignFile,
    addImageToCampaign,
    incrementCompletedImages,
    completeGeneration,
    failGeneration,
    cleanupFailedRecovery,
    setError,
    replaceCampaignId,
  ]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('connecting');

    // Include auth token as query parameter so the server can identify the user
    let wsUrl = WS_BASE_URL;
    try {
      const token = await getAuthToken();
      if (token) {
        wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
      }
    } catch {
      // Continue without token (dev mode)
    }

    console.log('WebSocket: Connecting to', WS_BASE_URL);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket: Connected');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          sendMessage({ type: 'ping' });
        }, PING_INTERVAL);

        // Check for active session to recover
        const savedSession = getActiveSession();
        if (savedSession) {
          console.log(`WebSocket: Recovering session ${savedSession.sessionId}`);
          setIsRecovering(true);
          sessionIdRef.current = savedSession.sessionId;

          // Reconstruct chat messages (user prompt + assistant with thinking block)
          // so replayed events have a message to attach to
          const { messageId } = reconstructForRecovery(
            savedSession.sessionId,
            savedSession.prompt,
            savedSession.campaignId
          );
          campaignIdRef.current = savedSession.campaignId;
          messageIdRef.current = messageId;

          addThinking('phase', `Recovering session...`, 0);

          // Subscribe with lastEventId=0 to replay ALL events from buffer
          // so the thinking block gets fully reconstructed
          ws.send(JSON.stringify({
            type: 'subscribe',
            sessionId: savedSession.sessionId,
            lastEventId: 0
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket: Disconnected', event.code, event.reason);
        setConnectionState('disconnected');
        wsRef.current = null;

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnection (only if not a clean close)
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          setConnectionState('reconnecting');
          reconnectAttemptsRef.current++;
          console.log(`WebSocket: Reconnecting (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY * reconnectAttemptsRef.current);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error('WebSocket: Max reconnection attempts reached');
        }
      };

      ws.onerror = () => {
        console.log('WebSocket: Connection error (server may be unavailable)');
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection', error);
      setConnectionState('disconnected');
    }
  }, [handleMessage, sendMessage, setConnectionState, setIsRecovering, setAppState, addThinking, reconstructForRecovery]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('disconnected');
  }, [setConnectionState]);

  // Generate action
  const generate = useCallback(() => {
    if (!promptRef.current.trim()) return;

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    // Extract campaign name and start generation
    const campaignName = extractCampaignName(promptRef.current);
    const { campaignId, messageId } = startGeneration(sessionId, campaignName);

    campaignIdRef.current = campaignId;
    messageIdRef.current = messageId;

    // Persist session for recovery
    saveActiveSession(sessionId, promptRef.current, campaignId, messageId);

    // Add initial thinking line
    addThinking('phase', `Starting generation for ${campaignName}...`, 0);

    const sent = sendMessage({
      type: 'generate',
      prompt: promptRef.current,
      sessionId
    });

    if (!sent) {
      failGeneration(campaignId, messageId, 'WebSocket not connected');
      clearActiveSession();
    }
  }, [startGeneration, sendMessage, failGeneration, addThinking]);

  // Cancel action
  const cancel = useCallback(() => {
    const campaignId = campaignIdRef.current;
    const messageId = messageIdRef.current;

    sendMessage({ type: 'cancel' });

    if (campaignId && messageId) {
      addThinking('error', 'Cancelling...', 0);
      cancelGeneration(campaignId, messageId);
    }

    clearActiveSession();
  }, [sendMessage, cancelGeneration, addThinking]);

  // Resume action - restart generation for an incomplete campaign
  const resume = useCallback((campaignId: string, resumePrompt: string) => {
    if (!resumePrompt.trim()) return;

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    // Use existing campaign, update status to generating
    campaignIdRef.current = campaignId;
    const { messageId } = resumeGeneration(sessionId, campaignId);
    messageIdRef.current = messageId;

    // Persist session for recovery
    saveActiveSession(sessionId, resumePrompt, campaignId, messageId);

    // Add initial thinking line
    addThinking('phase', 'Resuming generation...', 0);

    const sent = sendMessage({
      type: 'generate',
      prompt: resumePrompt,
      sessionId
    });

    if (!sent) {
      failGeneration(campaignId, messageId, 'WebSocket not connected');
      clearActiveSession();
    }
  }, [resumeGeneration, sendMessage, failGeneration, addThinking]);

  // Auto-connect on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      connect();
    }, 500);

    return () => {
      clearTimeout(timeout);
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isRecovering,
    generate,
    cancel,
    resume,
  };
}
