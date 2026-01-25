// Client → Server message types
export interface WSClientMessage {
  type: 'generate' | 'cancel' | 'pause' | 'resume' | 'ping' | 'subscribe';
  prompt?: string;
  sessionId?: string;
  lastEventId?: number;
}

// Server → Client message types
export interface WSServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'complete' | 'error' | 'ack' | 'pong' | 'subscribed';
  timestamp: string;
  // Event ID (for resilience/recovery) - number for event tracking, string for image IDs
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

// WebSocket connection state
export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// WebSocket hook return type
export interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  isConnected: boolean;
  isRecovering: boolean;
  generate: () => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}
