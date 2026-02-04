// ============================================
// Chat Types for Chat-First UI
// ============================================

// Hook types map to the 6 ad concept strategies
export type HookType = 'stat' | 'story' | 'fomo' | 'curiosity' | 'callout' | 'contrast';

// Map image index (1-6) to hook type
export const HOOK_TYPE_ORDER: HookType[] = ['stat', 'story', 'fomo', 'curiosity', 'callout', 'contrast'];

export const HOOK_TYPE_LABELS: Record<HookType, string> = {
  stat: 'Stat Hook',
  story: 'Story Hook',
  fomo: 'FOMO Hook',
  curiosity: 'Curiosity Hook',
  callout: 'Call-out Hook',
  contrast: 'Contrast Hook',
};

// ============================================
// Block Types (for structured message rendering)
// ============================================

export type MessageBlock =
  | TextBlockData
  | ThinkingBlockData
  | StatusBlockData;

export interface TextBlockData {
  type: 'text';
  id: string;
  content: string; // Accumulated text (grows during streaming)
}

export interface ThinkingBlockData {
  type: 'thinking';
  id: string;
  label: string; // Phase label (e.g., "Researching")
  status: 'active' | 'complete' | 'error';
  expanded: boolean;
  children: ThinkingChild[];
  completedImages: number;
  expectedImages: number;
}

export interface ThinkingChild {
  id: string;
  kind: 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'text' | 'status';
  text: string;
  timestamp: Date;
  variant?: 'info' | 'success' | 'error'; // For 'status' kind
}

export interface StatusBlockData {
  type: 'status';
  id: string;
  text: string; // e.g., "research.md created", "6 images generated"
  variant: 'info' | 'success' | 'error';
}

// ============================================
// Chat Message Types
// ============================================

export interface ImageReference {
  imageId: number;
  hookType?: HookType; // Optional - can be inferred from campaign
}

export interface FileReference {
  fileType: 'research' | 'hooks' | 'prompts';
}

export interface ChatMessage {
  id: string;
  campaignId?: string; // Links message to its campaign
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  // References to campaign content
  imageRefs?: ImageReference[];
  fileRefs?: FileReference[];
  assetRefs?: string[]; // Asset folder IDs

  // Structured content blocks (only during live generation, ephemeral)
  blocks?: MessageBlock[];
}

// ============================================
// Campaign Status Types
// ============================================

export type CampaignStatus = 'generating' | 'complete' | 'incomplete' | 'error' | 'cancelled';

export interface FilesReadyState {
  research: boolean;
  hooks: boolean;
  prompts: boolean;
}

// ============================================
// Updated Image Types
// ============================================

export interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  hookType: HookType;
  version: number; // For tracking regenerations
}

// ============================================
// App State Types
// ============================================

export type AppState = 'landing' | 'workspace';

// ============================================
// Helper Functions
// ============================================

export function getHookTypeForIndex(index: number): HookType {
  return HOOK_TYPE_ORDER[index - 1] || 'stat';
}

export function getImageLabel(index: number): string {
  return `Image ${index}`;
}

export function getImageSubtitle(hookType: HookType): string {
  return HOOK_TYPE_LABELS[hookType];
}

