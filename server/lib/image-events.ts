import { EventEmitter } from 'events';

export interface ImageSavedEvent {
  sessionId: string;
  imageIndex: number;
  hookType: string;
  prompt: string;
  filename: string;
  urlPath: string;
  id: string;
}

export const imageEvents = new EventEmitter();
imageEvents.setMaxListeners(20);

// Maps MCP tool sessionId (e.g. "mostunderated") → WebSocket sessionId (UUID).
// The AI model passes a human-readable name to the MCP tool, but the WS handler
// uses a UUID. This bridge is populated when we see the tool_use block.
const mcpToWsSession = new Map<string, string>();

export function registerMcpSession(mcpSessionId: string, wsSessionId: string) {
  mcpToWsSession.set(mcpSessionId, wsSessionId);
}

export function resolveWsSessionId(mcpSessionId: string): string | undefined {
  return mcpToWsSession.get(mcpSessionId);
}

export function unregisterByWsSession(wsSessionId: string) {
  for (const [mcpId, wsId] of mcpToWsSession) {
    if (wsId === wsSessionId) {
      mcpToWsSession.delete(mcpId);
    }
  }
}
