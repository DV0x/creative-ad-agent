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
// Thinking Block Types
// ============================================

export type ThinkingLineType = 'phase' | 'tool' | 'result' | 'progress' | 'error' | 'success';

export interface ThinkingLine {
  id: string;
  type: ThinkingLineType;
  text: string;
  indent: number; // 0 for phase, 1 for tool/result
  timestamp: Date;
}

// ============================================
// Generation State (within a chat message)
// ============================================

export type GenerationStatus = 'generating' | 'complete' | 'error' | 'cancelled';

export interface GenerationState {
  status: GenerationStatus;
  thinkingLines: ThinkingLine[];
  thinkingExpanded: boolean;
  expectedImages: number; // Usually 6
  completedImages: number;
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
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;

  // References to campaign content
  imageRefs?: ImageReference[];
  fileRefs?: FileReference[];
  assetRefs?: string[]; // Asset folder IDs

  // Generation state (only for assistant messages during generation)
  generation?: GenerationState;
}

// ============================================
// Campaign Status Types
// ============================================

export type CampaignStatus = 'generating' | 'complete' | 'error' | 'cancelled';

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

// Create an empty generation state for new assistant messages
export function createEmptyGenerationState(expectedImages: number = 6): GenerationState {
  return {
    status: 'generating',
    thinkingLines: [],
    thinkingExpanded: true,
    expectedImages,
    completedImages: 0,
  };
}

// Create a new thinking line with auto-generated ID
export function createThinkingLine(
  type: ThinkingLineType,
  text: string,
  indent: number = 0
): ThinkingLine {
  return {
    id: `think-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    text,
    indent,
    timestamp: new Date(),
  };
}
