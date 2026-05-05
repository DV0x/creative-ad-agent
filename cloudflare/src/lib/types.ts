// Shared types for the Cloudflare Durable Object WebSocket handler.
// Ported from server/lib/websocket-handler.ts.

// Client -> Server message types
export interface ClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up' | 'set_active_references';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;
  lastEventId?: number;
  // For 'set_active_references' (sticky refs on existing campaigns) AND for
  // first-turn refs on 'generate' (campaign doesn't exist yet, so we bake them
  // into the generate message; the DO sets them on the row right after createCampaign).
  fileIds?: string[];
  sourceCampaignId?: string;
  aspectRatio?: '4:5' | '1:1' | '9:16';
  brand?: string;
}

// Resolved reference set passed from the WS handler down through runGeneration
// /runFollowUpFast → setupSandbox so /app/refs.json can be written after the
// sandbox is mounted (D13).
export interface ResolvedRefs {
  falUrls: string[];
  sandboxPaths: string[];
  fileIds: string[];
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
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image' | 'file' | 'complete' | 'error' | 'incomplete' | 'ack' | 'pong' | 'subscribed' | 'credits_update' | 'text_delta' | 'text_start' | 'text_end' | 'active_references_updated';
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
  delta?: string;
  code?: string;
  error?: string;
  balance?: number;
  plan_balance?: number;
  topup_balance?: number;
  cost?: number;
  sessionId?: string;
  duration?: number;
  imageCount?: number;
  summary?: string;
  campaignId?: string;
  fileIds?: string[];  // for 'active_references_updated'
}

// Event buffer entry
export interface BufferedEvent {
  id: number;
  event: ServerMessage;
  timestamp: number;
}

const COMMAND_PREFIX_RE = /^(?:create|make|generate|design|build|do|run|produce)\s+(?:an?\s+)?(?:single\s+|two\s+|three\s+|four\s+|five\s+|six\s+|\d+\s+)?(?:\d+\s+)?(?:ads?|campaigns?|creatives?|images?|visuals?)\s+(?:for\s+)?/i;

// Extract campaign name from prompt (e.g., "create 2 ads for traya.health/ targeting 30+" -> "Traya — Targeting 30+")
export function extractCampaignName(prompt: string): string {
  const domainMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)(?:\.[a-z]+)/i);
  if (domainMatch) {
    const brand = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    const withoutUrl = prompt.replace(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-z]+\/?/gi, ' ');
    const withoutPrefix = withoutUrl.replace(COMMAND_PREFIX_RE, '').replace(/^\s*[-–—:,/]\s*/, '').trim();
    if (withoutPrefix) {
      const raw = withoutPrefix.charAt(0).toUpperCase() + withoutPrefix.slice(1);
      const brief = raw.length <= 40 ? raw : raw.substring(0, 40).replace(/\s+\S*$/, '');
      return brief ? `${brand} — ${brief}` : `${brand} Ads`;
    }
    return `${brand} Ads`;
  }
  const stripped = prompt.replace(COMMAND_PREFIX_RE, '').trim();
  const meaningful = stripped || prompt.trim();
  const raw = meaningful.charAt(0).toUpperCase() + meaningful.slice(1);
  return (raw.length <= 50 ? raw : raw.substring(0, 50).replace(/\s+\S*$/, '')) || 'Campaign';
}
