import type { HookType } from './chat';

// ============================================
// Client → Server Messages
// ============================================

export interface WSClientMessage {
  type: 'generate' | 'cancel' | 'ping' | 'subscribe' | 'follow_up';
  prompt?: string;
  sessionId?: string;
  campaignId?: string;
  lastEventId?: number;
}

// ============================================
// Server → Client Messages (Base)
// ============================================

interface WSBaseMessage {
  timestamp: string;
  // Event ID for resilience/recovery
  id?: number;
}

// ============================================
// Specific Event Types
// ============================================

export interface WSPhaseEvent extends WSBaseMessage {
  type: 'phase';
  phase: string;
  label?: string;
  imageCount?: number;
}

export interface WSToolStartEvent extends WSBaseMessage {
  type: 'tool_start';
  tool: string;
  toolId?: string;
  input?: Record<string, unknown>;
}

export interface WSToolEndEvent extends WSBaseMessage {
  type: 'tool_end';
  toolId?: string;
  success?: boolean;
}

export interface WSMessageEvent extends WSBaseMessage {
  type: 'message';
  text: string;
}

export interface WSStatusEvent extends WSBaseMessage {
  type: 'status';
  message: string;
  success?: boolean;
}

export interface WSFileEvent extends WSBaseMessage {
  type: 'file';
  fileType: 'research' | 'hooks' | 'prompts';
  content: string;
  path: string;
}

export interface WSImageEvent extends WSBaseMessage {
  type: 'image';
  urlPath: string;
  prompt: string;
  filename?: string;
  hookType: HookType;
  imageIndex: number; // 1-6
}

export interface WSCompleteEvent extends WSBaseMessage {
  type: 'complete';
  message?: string;
  summary: string;
  sessionId?: string;
  duration?: number;
  imageCount?: number;
}

export interface WSErrorEvent extends WSBaseMessage {
  type: 'error';
  error: string;
}

export interface WSAckEvent extends WSBaseMessage {
  type: 'ack';
  message?: string;
  sessionId?: string;
  campaignId?: string;
}

export interface WSPongEvent extends WSBaseMessage {
  type: 'pong';
}

export interface WSSubscribedEvent extends WSBaseMessage {
  type: 'subscribed';
  sessionId: string;
}

// ============================================
// Union Type for All Server Messages
// ============================================

export type WSServerMessage =
  | WSPhaseEvent
  | WSToolStartEvent
  | WSToolEndEvent
  | WSMessageEvent
  | WSStatusEvent
  | WSFileEvent
  | WSImageEvent
  | WSCompleteEvent
  | WSErrorEvent
  | WSAckEvent
  | WSPongEvent
  | WSSubscribedEvent;

// ============================================
// Type Guards
// ============================================

export function isPhaseEvent(msg: WSServerMessage): msg is WSPhaseEvent {
  return msg.type === 'phase';
}

export function isToolStartEvent(msg: WSServerMessage): msg is WSToolStartEvent {
  return msg.type === 'tool_start';
}

export function isFileEvent(msg: WSServerMessage): msg is WSFileEvent {
  return msg.type === 'file';
}

export function isImageEvent(msg: WSServerMessage): msg is WSImageEvent {
  return msg.type === 'image';
}

export function isCompleteEvent(msg: WSServerMessage): msg is WSCompleteEvent {
  return msg.type === 'complete';
}

export function isErrorEvent(msg: WSServerMessage): msg is WSErrorEvent {
  return msg.type === 'error';
}

// WebSocket connection state
export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
