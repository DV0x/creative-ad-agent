export type GenerationStatus = 'idle' | 'generating' | 'complete' | 'error';

export type Phase = 'parse' | 'research' | 'hooks' | 'art' | 'images' | 'complete';

export const PHASES: Phase[] = ['parse', 'research', 'hooks', 'art', 'images', 'complete'];

export const PHASE_LABELS: Record<Phase, string> = {
  parse: 'Parse',
  research: 'Research',
  hooks: 'Hooks',
  art: 'Art',
  images: 'Images',
  complete: 'Done',
};

export interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'success' | 'error';
  text: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  urlPath: string;
  prompt: string;
  filename: string;
}

export interface SSEEvent {
  type: 'stdout' | 'stderr' | 'complete' | 'done' | 'error' | 'status';
  data?: string;
  message?: string;
  sessionId: string;
  timestamp: string;
  exitCode?: number;
  success?: boolean;
  error?: string;
}

// Re-export WebSocket types
export type { WSClientMessage, WSServerMessage, WSConnectionState, UseWebSocketReturn } from './websocket';
