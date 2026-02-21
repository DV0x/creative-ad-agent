// Re-export all types from a single entry point

// Chat types (new chat-first UI)
export type {
  HookType,
  ImageReference,
  FileReference,
  ChatMessage,
  CampaignStatus,
  FilesReadyState,
  GeneratedImage,
  AppState,
  MessageBlock,
  TextBlockData,
  ThinkingBlockData,
  StatusBlockData,
  ThinkingChild,
} from './chat';

export {
  HOOK_TYPE_ORDER,
  HOOK_TYPE_LABELS,
  getHookTypeForIndex,
  getImageLabel,
  getImageSubtitle,
} from './chat';

// WebSocket types
export type {
  WSClientMessage,
  WSServerMessage,
  WSPhaseEvent,
  WSToolStartEvent,
  WSToolEndEvent,
  WSMessageEvent,
  WSStatusEvent,
  WSFileEvent,
  WSImageEvent,
  WSCompleteEvent,
  WSErrorEvent,
  WSAckEvent,
  WSPongEvent,
  WSSubscribedEvent,
  WSConnectionState,
} from './websocket';

export {
  isPhaseEvent,
  isToolStartEvent,
  isFileEvent,
  isImageEvent,
  isCompleteEvent,
  isErrorEvent,
} from './websocket';
