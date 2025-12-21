import { create } from 'zustand';
import type { GenerationStatus, Phase, TerminalLine, GeneratedImage } from '../types';
import { PHASES } from '../types';

interface AppState {
  // Input
  prompt: string;
  setPrompt: (prompt: string) => void;

  // Generation
  status: GenerationStatus;
  sessionId: string | null;
  error: string | null;

  // Progress
  currentPhase: Phase;
  phaseIndex: number;

  // Terminal
  terminalLines: TerminalLine[];

  // Images
  images: GeneratedImage[];

  // Actions
  startGeneration: (sessionId: string) => void;
  setPhase: (phase: Phase) => void;
  addTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  addImage: (image: GeneratedImage) => void;
  recoverImages: (images: GeneratedImage[]) => void;
  setComplete: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  prompt: '',
  status: 'idle',
  sessionId: null,
  error: null,
  currentPhase: 'parse',
  phaseIndex: 0,
  terminalLines: [],
  images: [],

  // Actions
  setPrompt: (prompt) => set({ prompt }),

  startGeneration: (sessionId) => set({
    status: 'generating',
    sessionId,
    error: null,
    currentPhase: 'parse',
    phaseIndex: 0,
    terminalLines: [],
    images: [],
  }),

  setPhase: (phase) => set({
    currentPhase: phase,
    phaseIndex: PHASES.indexOf(phase),
  }),

  addTerminalLine: (line) => set((state) => ({
    terminalLines: [
      ...state.terminalLines,
      {
        ...line,
        id: `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
      },
    ],
  })),

  addImage: (image) => set((state) => ({
    images: [...state.images, image],
  })),

  recoverImages: (newImages) => set((state) => {
    // Only add images we don't already have (by URL)
    const existingUrls = new Set(state.images.map(img => img.url));
    const uniqueNewImages = newImages.filter(img => !existingUrls.has(img.url));
    return {
      images: [...state.images, ...uniqueNewImages],
    };
  }),

  setComplete: () => set({
    status: 'complete',
    currentPhase: 'complete',
    phaseIndex: 5,
  }),

  setError: (error) => set({
    status: 'error',
    error,
  }),

  reset: () => set({
    prompt: '',
    status: 'idle',
    sessionId: null,
    error: null,
    currentPhase: 'parse',
    phaseIndex: 0,
    terminalLines: [],
    images: [],
  }),
}));
