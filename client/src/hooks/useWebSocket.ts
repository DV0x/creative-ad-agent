import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../store';
import type { WSClientMessage, WSServerMessage, WSConnectionState, UseWebSocketReturn } from '../types/websocket';
import type { Phase } from '../types';

// WebSocket URL - always use current host so Vite proxy can handle it in dev
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const PING_INTERVAL = 25000;

// Storage keys for session persistence
const STORAGE_KEYS = {
  ACTIVE_SESSION: 'creative-agent:activeSession',
  LAST_EVENT_ID: (sessionId: string) => `creative-agent:lastEventId:${sessionId}`
};

// Session persistence helpers
function saveActiveSession(sessionId: string, prompt: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify({
    sessionId,
    prompt,
    startedAt: Date.now()
  }));
}

function getActiveSession(): { sessionId: string; prompt: string; startedAt: number } | null {
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

export function useWebSocket(): UseWebSocketReturn {
  const {
    prompt,
    startGeneration,
    setPhase,
    addTerminalLine,
    addImage,
    setComplete,
    setError,
  } = useAppStore();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const lastEventIdRef = useRef<number>(0);

  const [connectionState, setConnectionState] = useState<WSConnectionState>('disconnected');
  const [isRecovering, setIsRecovering] = useState(false);

  // Send message helper
  const sendMessage = useCallback((message: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WSServerMessage = JSON.parse(event.data);

      // Track event ID for recovery (only numeric IDs from event buffer)
      if (typeof message.id === 'number' && sessionIdRef.current) {
        lastEventIdRef.current = message.id;
        saveLastEventId(sessionIdRef.current, message.id);
      }

      switch (message.type) {
        case 'subscribed':
          console.log('WebSocket: Subscribed to session, recovery complete');
          setIsRecovering(false);
          return;

        case 'phase':
          if (message.phase) {
            setPhase(message.phase as Phase);
            addTerminalLine({
              type: 'command',
              text: `$ phase: ${message.label || message.phase}`
            });
          }
          break;

        case 'tool_start':
          if (message.tool) {
            // Show tool name, with agent type for Task tool
            let toolText = message.tool;
            if (message.tool === 'Task' && message.input?.subagent_type) {
              toolText = `Task [${message.input.subagent_type}]`;
            } else if (message.tool === 'Skill' && message.input?.skill) {
              toolText = `Skill [${message.input.skill}]`;
            }
            addTerminalLine({
              type: 'command',
              text: `$ ${toolText}`
            });
          }
          break;

        case 'tool_end':
          // Silent - don't clutter terminal
          break;

        case 'message':
          if (message.text) {
            addTerminalLine({
              type: 'output',
              text: message.text.slice(0, 150)
            });
          }
          break;

        case 'status':
          if (message.message) {
            // Handle cancellation status
            if (message.message.toLowerCase().includes('cancelled')) {
              setComplete(); // Reset to idle state
              addTerminalLine({
                type: 'output',
                text: 'Generation cancelled'
              });
            } else {
              addTerminalLine({
                type: message.success ? 'success' : 'output',
                text: message.message
              });
            }
          }
          break;

        case 'image':
          if (message.id && message.urlPath) {
            addImage({
              id: String(message.id),
              url: message.urlPath,
              urlPath: message.urlPath,
              prompt: message.prompt || '',
              filename: message.filename || ''
            });
            addTerminalLine({
              type: 'success',
              text: `Image generated: ${message.filename || 'image'}`
            });
          }
          break;

        case 'complete':
          setComplete();
          clearActiveSession();
          addTerminalLine({
            type: 'success',
            text: message.message || 'Generation complete!'
          });
          break;

        case 'error':
          setError(message.error || 'Unknown error');
          clearActiveSession();
          addTerminalLine({
            type: 'error',
            text: message.error || 'Unknown error'
          });
          break;

        case 'ack':
          // Acknowledgment - log if interesting
          if (message.message && !message.message.includes('Connected')) {
            console.log('WebSocket ack:', message.message);
          }
          break;

        case 'pong':
          // Heartbeat response - ignore
          break;

        default:
          console.log('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [setPhase, addTerminalLine, addImage, setComplete, setError]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState('connecting');
    console.log('WebSocket: Connecting to', WS_URL);

    try {
      const ws = new WebSocket(WS_URL);
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

          // Restore generation state in store
          startGeneration(savedSession.sessionId);
          addTerminalLine({
            type: 'command',
            text: `$ recovering session ${savedSession.sessionId.slice(0, 8)}...`
          });

          // Subscribe to the existing session
          ws.send(JSON.stringify({
            type: 'subscribe',
            sessionId: savedSession.sessionId,
            lastEventId: getLastEventId(savedSession.sessionId)
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        console.log('WebSocket: Disconnected', event.code, event.reason);
        setConnectionState('disconnected');
        wsRef.current = null;

        // Clear ping interval
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
        // Error details are not available in browser WebSocket API
        // The close event will fire after this with more info
        console.log('WebSocket: Connection error (server may be unavailable)');
      };
    } catch (error) {
      console.error('WebSocket: Failed to create connection', error);
      setConnectionState('disconnected');
    }
  }, [handleMessage, sendMessage]);

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
  }, []);

  // Generate action
  const generate = useCallback(() => {
    if (!prompt.trim()) return;

    const sessionId = crypto.randomUUID();
    sessionIdRef.current = sessionId;
    lastEventIdRef.current = 0;

    // Persist session for recovery
    saveActiveSession(sessionId, prompt);

    startGeneration(sessionId);

    addTerminalLine({
      type: 'command',
      text: `$ starting session ${sessionId.slice(0, 8)}...`
    });

    const sent = sendMessage({
      type: 'generate',
      prompt,
      sessionId
    });

    if (!sent) {
      setError('WebSocket not connected');
      clearActiveSession();
      addTerminalLine({
        type: 'error',
        text: 'WebSocket not connected - please refresh'
      });
    }
  }, [prompt, startGeneration, addTerminalLine, sendMessage, setError]);

  // Cancel action
  const cancel = useCallback(() => {
    sendMessage({ type: 'cancel' });
    clearActiveSession();
    addTerminalLine({
      type: 'command',
      text: '$ cancelling...'
    });
  }, [sendMessage, addTerminalLine]);

  // Pause action
  const pause = useCallback(() => {
    sendMessage({ type: 'pause' });
  }, [sendMessage]);

  // Resume action
  const resume = useCallback(() => {
    sendMessage({ type: 'resume' });
  }, [sendMessage]);

  // Auto-connect on mount with small delay to let server initialize
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
    pause,
    resume
  };
}
