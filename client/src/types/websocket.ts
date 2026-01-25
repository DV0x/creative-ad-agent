// Client → Server message types
export interface WSClientMessage {
  type: 'generate' | 'cancel' | 'pause' | 'resume' | 'ping';
  prompt?: string;
  sessionId?: string;
}

// Server → Client message types
export interface WSServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'complete' | 'error' | 'ack' | 'pong';
  timestamp: string;
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
  id?: string;
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

// WebSocket connection state
export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// WebSocket hook return type
export interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  isConnected: boolean;
  generate: () => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}
