import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { aiClient } from './ai-client.js';
import { sessionManager } from './session-manager.js';
import { SDKInstrumentor } from './instrumentor.js';
import { appendEvent, getEventsSince, getLatestEventId, hasBuffer } from './event-buffer.js';

// Client → Server message types
interface ClientMessage {
  type: 'generate' | 'cancel' | 'pause' | 'resume' | 'ping' | 'subscribe';
  prompt?: string;
  sessionId?: string;
  lastEventId?: number;
}

// Server → Client message types
interface ServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'complete' | 'error' | 'ack' | 'pong' | 'subscribed';
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
  // Error events
  error?: string;
  // Complete events
  sessionId?: string;
  duration?: number;
  imageCount?: number;
}

// Connection state
interface ConnectionState {
  ws: WebSocket;
  sessionId: string | null;
  abortController: AbortController | null;
  isPaused: boolean;
  messageBuffer: ServerMessage[];
  heartbeatInterval: NodeJS.Timeout | null;
}

const connections = new Map<WebSocket, ConnectionState>();

// Track which WebSocket is subscribed to each session (for resilience)
const sessionConnections = new Map<string, WebSocket | null>();

// Track abort controllers per session (for cancel after reconnect)
const sessionAbortControllers = new Map<string, AbortController>();

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
  if (state.isPaused) {
    state.messageBuffer.push(message);
  } else if (state.sessionId) {
    // Use emitEvent for resilience (buffers + sends)
    emitEvent(state.sessionId, message);
  } else {
    // No session yet, send directly
    send(state.ws, message);
  }
}

// Detect phase from SDK message content
function detectPhaseFromMessage(text: string): { phase: string; label: string } | null {
  const lower = text.toLowerCase();

  if (lower.includes('research') || lower.includes('analyzing') || lower.includes('webpage')) {
    return { phase: 'research', label: 'Researching' };
  }
  if (lower.includes('hook') || lower.includes('headline') || lower.includes('copy')) {
    return { phase: 'hooks', label: 'Generating Hooks' };
  }
  if (lower.includes('visual') || lower.includes('art') || lower.includes('style') || lower.includes('prompt')) {
    return { phase: 'art', label: 'Creating Art Direction' };
  }
  if (lower.includes('image') || lower.includes('generat') || lower.includes('nano_banana')) {
    return { phase: 'images', label: 'Generating Images' };
  }

  return null;
}

// Process SDK messages and convert to WebSocket events
function processSDKMessage(message: any, state: ConnectionState, instrumentor: SDKInstrumentor) {
  // Process for instrumentation
  instrumentor.processMessage(message);

  if (message.type === 'assistant') {
    const content = message.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          // Send text message
          broadcastToConnection(state, {
            type: 'message',
            timestamp: new Date().toISOString(),
            text: block.text.slice(0, 200) // Truncate for terminal display
          });

          // Detect phase changes from text content
          const phaseInfo = detectPhaseFromMessage(block.text);
          if (phaseInfo) {
            broadcastToConnection(state, {
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: phaseInfo.phase,
              label: phaseInfo.label
            });
          }
        } else if (block.type === 'tool_use') {
          // Send tool start event
          broadcastToConnection(state, {
            type: 'tool_start',
            timestamp: new Date().toISOString(),
            tool: block.name,
            toolId: block.id,
            input: block.input
          });

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
            } else if (skillName === 'art-style') {
              broadcastToConnection(state, {
                type: 'phase',
                timestamp: new Date().toISOString(),
                phase: 'art',
                label: 'Creating Art Direction'
              });
            }
          } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
            broadcastToConnection(state, {
              type: 'phase',
              timestamp: new Date().toISOString(),
              phase: 'images',
              label: 'Generating Images'
            });
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
                if (img.urlPath && !img.error) {
                  broadcastToConnection(state, {
                    type: 'image',
                    timestamp: new Date().toISOString(),
                    id: img.id || `img-${Date.now()}`,
                    urlPath: img.urlPath,
                    prompt: img.prompt || '',
                    filename: img.filename || ''
                  });
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

async function handleGenerate(state: ConnectionState, prompt: string, requestedSessionId?: string) {
  const sessionId = requestedSessionId || `ws-${Date.now()}`;
  state.sessionId = sessionId;
  state.abortController = new AbortController();
  state.isPaused = false;
  state.messageBuffer = [];

  // Register this WebSocket for the session (for resilience)
  sessionConnections.set(sessionId, state.ws);

  // Store abort controller by session (for cancel after reconnect)
  sessionAbortControllers.set(sessionId, state.abortController);

  console.log(`🚀 WebSocket: Starting generation for session ${sessionId}`);

  // Send acknowledgment
  send(state.ws, {
    type: 'ack',
    timestamp: new Date().toISOString(),
    message: 'Generation started',
    sessionId
  });

  // Send initial phase
  broadcastToConnection(state, {
    type: 'phase',
    timestamp: new Date().toISOString(),
    phase: 'parse',
    label: 'Parsing Request'
  });

  const startTime = Date.now();
  let imageCount = 0;
  let wasCancelled = false;

  try {
    // Initialize session
    await sessionManager.getOrCreateSession(sessionId, {
      status: 'active',
      context: { userPrompt: prompt }
    });

    // Initialize instrumentation
    const instrumentor = new SDKInstrumentor(sessionId, prompt, 'websocket');

    // Process SDK stream
    for await (const result of aiClient.queryWithSession(prompt, sessionId)) {
      // Check for cancellation
      if (state.abortController?.signal.aborted) {
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
      processSDKMessage(message, state, instrumentor);

      // Count images
      if (message.type === 'user') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_result') {
              try {
                let rc = block.content;
                if (typeof rc === 'string') rc = JSON.parse(rc);
                if (rc?.images?.length) imageCount += rc.images.length;
              } catch { /* ignore */ }
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Only send completion if not cancelled
    if (!wasCancelled) {
      broadcastToConnection(state, {
        type: 'phase',
        timestamp: new Date().toISOString(),
        phase: 'complete',
        label: 'Complete'
      });

      broadcastToConnection(state, {
        type: 'complete',
        timestamp: new Date().toISOString(),
        sessionId,
        duration,
        imageCount,
        message: `Generation complete in ${(duration / 1000).toFixed(1)}s`
      });

      console.log(`✅ WebSocket: Generation complete for session ${sessionId} (${duration}ms, ${imageCount} images)`);
    } else {
      console.log(`🛑 WebSocket: Generation stopped for session ${sessionId} (cancelled after ${(duration / 1000).toFixed(1)}s)`);
    }

  } catch (error: any) {
    console.error(`❌ WebSocket: Generation error for session ${sessionId}:`, error);

    broadcastToConnection(state, {
      type: 'error',
      timestamp: new Date().toISOString(),
      error: error.message || 'Unknown error occurred'
    });
  } finally {
    state.abortController = null;
    // Clean up session abort controller
    if (sessionId) {
      sessionAbortControllers.delete(sessionId);
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

function handlePause(state: ConnectionState) {
  state.isPaused = true;
  console.log(`⏸️ WebSocket: Pausing stream for session ${state.sessionId}`);

  send(state.ws, {
    type: 'ack',
    timestamp: new Date().toISOString(),
    message: 'Stream paused'
  });
}

function handleResume(state: ConnectionState) {
  state.isPaused = false;
  console.log(`▶️ WebSocket: Resuming stream for session ${state.sessionId}`);

  // Flush buffered messages
  for (const msg of state.messageBuffer) {
    send(state.ws, msg);
  }
  state.messageBuffer = [];

  send(state.ws, {
    type: 'ack',
    timestamp: new Date().toISOString(),
    message: 'Stream resumed'
  });
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
  state.sessionId = sessionId;
  sessionConnections.set(sessionId, state.ws);

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

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔗 WebSocket: Client connected');

    // Initialize connection state
    const state: ConnectionState = {
      ws,
      sessionId: null,
      abortController: null,
      isPaused: false,
      messageBuffer: [],
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
              handleGenerate(state, message.prompt, message.sessionId);
            }
            break;

          case 'cancel':
            handleCancel(state);
            break;

          case 'pause':
            handlePause(state);
            break;

          case 'resume':
            handleResume(state);
            break;

          case 'ping':
            handlePing(state);
            break;

          case 'subscribe':
            handleSubscribe(state, message.sessionId, message.lastEventId);
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
      // Just clear the session's WebSocket reference
      if (state.sessionId) {
        sessionConnections.set(state.sessionId, null);
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
