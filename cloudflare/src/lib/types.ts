// Shared types for the Cloudflare Durable Object WebSocket handler.
// Ported from server/lib/websocket-handler.ts.

// Client -> Server message types
export interface ClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;
  lastEventId?: number;
  assetFileIds?: string[];
}

// Hook types for ad concepts
export type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';

// Map image index (1-6) to hook type
export const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

export function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

// Server -> Client message types
export interface ServerMessage {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'file' | 'complete' | 'error' | 'incomplete' | 'ack' | 'pong' | 'subscribed';
  timestamp: string;
  id?: number | string;
  phase?: string;
  label?: string;
  tool?: string;
  toolId?: string;
  input?: unknown;
  success?: boolean;
  text?: string;
  message?: string;
  urlPath?: string;
  prompt?: string;
  filename?: string;
  hookType?: HookType;
  imageIndex?: number;
  fileType?: 'research' | 'hooks' | 'prompts';
  content?: string;
  path?: string;
  error?: string;
  sessionId?: string;
  duration?: number;
  imageCount?: number;
  summary?: string;
  campaignId?: string;
}

// Event buffer entry
export interface BufferedEvent {
  id: number;
  event: ServerMessage;
  timestamp: number;
}

// Extract campaign name from prompt (e.g., "nike.com" -> "Nike")
export function extractCampaignName(prompt: string): string {
  const domainMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)(?:\.[a-z]+)/i);
  if (domainMatch) {
    const name = domainMatch[1];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  const firstWord = prompt.split(/\s+/)[0] || 'Campaign';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}
