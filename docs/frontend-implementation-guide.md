# Frontend Implementation Guide

Step-by-step guide to building the Creative Machine frontend.

---

## Phase 1: Project Setup

### Step 1.1: Create Vite Project

```bash
cd /Users/chakra/Documents/Agents/creative_agent
npm create vite@latest client -- --template react-ts
cd client
npm install
```

### Step 1.2: Install Dependencies

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# State management
npm install zustand

# Fonts (optional, can use CDN)
npm install @fontsource/inter @fontsource/jetbrains-mono
```

### Step 1.3: Configure Tailwind

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#1A1A1A',
          text: '#E0E0E0',
          green: '#4ADE80',
          blue: '#60A5FA',
          red: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
```

### Step 1.4: Setup CSS

**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import '@fontsource/jetbrains-mono/400.css';

html {
  font-family: 'Inter', system-ui, sans-serif;
}

/* Custom scrollbar for terminal */
.terminal-scroll::-webkit-scrollbar {
  width: 8px;
}

.terminal-scroll::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 4px;
}

.terminal-scroll::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.terminal-scroll::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
```

### Step 1.5: Configure Vite Proxy

**vite.config.ts**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/generate': {
        target: 'http://localhost:8787',  // wrangler dev
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/sessions': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Phase 2: Core Types & Store

### Step 2.1: Create Types

**src/types/index.ts**
```typescript
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
  type: 'stdout' | 'stderr' | 'complete' | 'done' | 'error';
  data?: string;
  sessionId: string;
  timestamp: string;
  exitCode?: number;
  success?: boolean;
  error?: string;
}
```

### Step 2.2: Create Zustand Store

**src/store/index.ts**
```typescript
import { create } from 'zustand';
import { GenerationStatus, Phase, TerminalLine, GeneratedImage, PHASES } from '../types';

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
  setComplete: () => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
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
```

---

## Phase 3: SSE Client & Hook

### Step 3.1: Create SSE Parser

**src/api/parseSSE.ts**
```typescript
import { SSEEvent } from '../types';

/**
 * Parse SSE stream from response body
 */
export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SSEEvent> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          yield event;
        } catch (e) {
          console.error('Failed to parse SSE event:', line);
        }
      }
    }
  }
}
```

### Step 3.2: Create Generation Hook

**src/hooks/useGenerate.ts**
```typescript
import { useCallback } from 'react';
import { useAppStore } from '../store';
import { parseSSEStream } from '../api/parseSSE';
import { Phase } from '../types';

// Detect phase from terminal output
function detectPhase(text: string): Phase | null {
  if (text.includes('spawning research agent') || text.includes('research agent')) {
    return 'research';
  }
  if (text.includes('hook-methodology') || text.includes('generating hook')) {
    return 'hooks';
  }
  if (text.includes('art-style') || text.includes('visual prompt')) {
    return 'art';
  }
  if (text.includes('generate_ad_images') || text.includes('Generating image')) {
    return 'images';
  }
  return null;
}

// Extract image data from tool result
function extractImages(text: string, sessionId: string): Array<{
  id: string;
  url: string;
  urlPath: string;
  prompt: string;
  filename: string;
}> {
  try {
    // Look for image generation results
    if (text.includes('"images"') && text.includes('"urlPath"')) {
      const match = text.match(/\{[\s\S]*"images"[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.images && Array.isArray(data.images)) {
          return data.images.map((img: any) => ({
            id: img.id,
            url: img.urlPath, // Will be resolved to full URL
            urlPath: img.urlPath,
            prompt: img.prompt,
            filename: img.filename,
          }));
        }
      }
    }
  } catch (e) {
    // Ignore parse errors
  }
  return [];
}

export function useGenerate() {
  const {
    prompt,
    startGeneration,
    setPhase,
    addTerminalLine,
    addImage,
    setComplete,
    setError,
  } = useAppStore();

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    const sessionId = crypto.randomUUID();
    startGeneration(sessionId);

    addTerminalLine({ type: 'command', text: `$ starting session ${sessionId.slice(0, 8)}...` });

    try {
      const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();

      for await (const event of parseSSEStream(reader)) {
        // Handle stderr (agent progress)
        if (event.type === 'stderr' && event.data) {
          // Format for terminal display
          let displayText = event.data;
          let lineType: 'command' | 'output' | 'success' | 'error' = 'output';

          // Detect special lines
          if (event.data.startsWith('[agent-runner]')) {
            displayText = `$ ${event.data.replace('[agent-runner] ', '')}`;
            lineType = 'command';
          } else if (event.data.startsWith('[progress]')) {
            // Parse SDK message for display
            try {
              const sdkMsg = JSON.parse(event.data.replace('[progress] ', ''));
              if (sdkMsg.type === 'assistant' && sdkMsg.message?.content) {
                for (const block of sdkMsg.message.content) {
                  if (block.type === 'tool_use') {
                    displayText = `$ calling ${block.name}`;
                    lineType = 'command';
                  }
                }
              }
            } catch {
              displayText = event.data;
            }
          }

          addTerminalLine({ type: lineType, text: displayText });

          // Detect phase changes
          const newPhase = detectPhase(event.data);
          if (newPhase) {
            setPhase(newPhase);
          }

          // Extract images if present
          const images = extractImages(event.data, sessionId);
          for (const image of images) {
            addImage(image);
          }
        }

        // Handle stdout (final result)
        if (event.type === 'stdout' && event.data) {
          addTerminalLine({ type: 'output', text: `→ ${event.data.slice(0, 100)}...` });
        }

        // Handle completion
        if (event.type === 'done') {
          if (event.success) {
            addTerminalLine({ type: 'success', text: '✓ Generation complete!' });
            setComplete();
          } else {
            addTerminalLine({ type: 'error', text: '✗ Generation failed' });
            setError('Generation failed');
          }
        }

        // Handle errors
        if (event.type === 'error') {
          addTerminalLine({ type: 'error', text: `✗ ${event.error}` });
          setError(event.error || 'Unknown error');
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLine({ type: 'error', text: `✗ ${message}` });
      setError(message);
    }
  }, [prompt, startGeneration, setPhase, addTerminalLine, addImage, setComplete, setError]);

  return { generate };
}
```

---

## Phase 4: UI Components

### Step 4.1: PromptInput Component

**src/components/PromptInput.tsx**
```typescript
import { useAppStore } from '../store';
import { useGenerate } from '../hooks/useGenerate';

export function PromptInput() {
  const { prompt, setPrompt, status } = useAppStore();
  const { generate } = useGenerate();
  const isGenerating = status === 'generating';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGenerating && prompt.trim()) {
      generate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your website and creative direction..."
          disabled={isGenerating}
          rows={1}
          className="w-full min-h-[56px] max-h-[120px] p-4 pr-28
                     rounded-xl border border-gray-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none text-base
                     disabled:bg-gray-50 disabled:text-gray-500
                     placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     px-4 py-2 bg-blue-500 text-white text-sm font-medium
                     rounded-full
                     hover:bg-blue-600
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Running
            </span>
          ) : (
            'Generate →'
          )}
        </button>
      </div>
    </form>
  );
}
```

### Step 4.2: ProgressDots Component

**src/components/ProgressDots.tsx**
```typescript
import { useAppStore } from '../store';
import { PHASES, PHASE_LABELS } from '../types';

export function ProgressDots() {
  const { phaseIndex, status } = useAppStore();

  if (status === 'idle') return null;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4">
      {PHASES.map((phase, i) => (
        <div key={phase} className="flex items-center">
          {/* Dot */}
          <div className="flex flex-col items-center">
            <div
              className={`
                w-3 h-3 rounded-full transition-all duration-300
                ${i < phaseIndex ? 'bg-gray-900' : ''}
                ${i === phaseIndex ? 'bg-blue-500 animate-pulse' : ''}
                ${i > phaseIndex ? 'border-2 border-gray-300 bg-white' : ''}
              `}
            />
            <span className={`
              text-xs mt-1 hidden sm:block
              ${i <= phaseIndex ? 'text-gray-900' : 'text-gray-400'}
            `}>
              {PHASE_LABELS[phase]}
            </span>
          </div>

          {/* Connector */}
          {i < PHASES.length - 1 && (
            <div
              className={`
                w-4 sm:w-8 h-0.5 mx-1 transition-colors duration-300
                ${i < phaseIndex ? 'bg-gray-900' : 'bg-gray-200'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Step 4.3: Terminal Component

**src/components/Terminal.tsx**
```typescript
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';

export function Terminal() {
  const { terminalLines, status } = useAppStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [terminalLines]);

  if (status === 'idle') return null;

  return (
    <div
      ref={containerRef}
      className="bg-terminal-bg rounded-xl p-4 font-mono text-sm
                 max-h-[250px] sm:max-h-[300px] overflow-y-auto
                 terminal-scroll"
    >
      {terminalLines.map((line) => (
        <div
          key={line.id}
          className={`
            py-0.5 break-all
            ${line.type === 'command' ? 'text-terminal-green' : ''}
            ${line.type === 'output' ? 'text-terminal-text opacity-70' : ''}
            ${line.type === 'success' ? 'text-terminal-blue' : ''}
            ${line.type === 'error' ? 'text-terminal-red' : ''}
          `}
        >
          {line.text}
        </div>
      ))}

      {/* Blinking cursor */}
      {status === 'generating' && (
        <span className="text-terminal-green animate-pulse">█</span>
      )}
    </div>
  );
}
```

### Step 4.4: ImageGrid Component

**src/components/ImageGrid.tsx**
```typescript
import { useState } from 'react';
import { useAppStore } from '../store';
import { ImageCard } from './ImageCard';
import { ImageLightbox } from './ImageLightbox';
import { GeneratedImage } from '../types';

export function ImageGrid() {
  const { images, status } = useAppStore();
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  // Don't show until we're generating or have images
  if (status === 'idle' && images.length === 0) return null;

  // Show skeleton loaders for expected 6 images
  const skeletonCount = Math.max(0, 6 - images.length);
  const showSkeletons = status === 'generating';

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onClick={() => setLightboxImage(image)}
          />
        ))}

        {/* Skeleton loaders */}
        {showSkeletons && Array(skeletonCount).fill(0).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="aspect-square bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
```

### Step 4.5: ImageCard Component

**src/components/ImageCard.tsx**
```typescript
import { useState } from 'react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onClick: () => void;
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Resolve URL (could be relative or absolute)
  const imageUrl = image.url.startsWith('http')
    ? image.url
    : image.urlPath;

  return (
    <div
      onClick={onClick}
      className="relative aspect-square rounded-xl overflow-hidden
                 bg-gray-100 cursor-pointer
                 hover:shadow-lg hover:scale-[1.02]
                 transition-all duration-200"
    >
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">Failed to load</span>
        </div>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={image.prompt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`
          w-full h-full object-cover
          transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  );
}
```

### Step 4.6: ImageLightbox Component

**src/components/ImageLightbox.tsx**
```typescript
import { useEffect } from 'react';
import { GeneratedImage } from '../types';

interface ImageLightboxProps {
  image: GeneratedImage;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const imageUrl = image.url.startsWith('http')
    ? image.url
    : image.urlPath;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white
                   p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt={image.prompt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[80vh] object-contain rounded-lg"
      />

      {/* Prompt text */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 left-4 right-4
                   bg-black/70 text-white p-4 rounded-lg
                   max-h-[20vh] overflow-y-auto"
      >
        <p className="text-sm">{image.prompt}</p>
      </div>
    </div>
  );
}
```

---

## Phase 5: Main App Assembly

### Step 5.1: App Component

**src/App.tsx**
```typescript
import { PromptInput } from './components/PromptInput';
import { ProgressDots } from './components/ProgressDots';
import { Terminal } from './components/Terminal';
import { ImageGrid } from './components/ImageGrid';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Creative Machine
          </h1>
          <p className="text-gray-500 mt-2">
            Generate ad creatives from any website
          </p>
        </header>

        {/* Input */}
        <div className="mb-6">
          <PromptInput />
        </div>

        {/* Progress */}
        <ProgressDots />

        {/* Terminal */}
        <div className="mb-6">
          <Terminal />
        </div>

        {/* Images */}
        <ImageGrid />
      </div>
    </div>
  );
}

export default App;
```

### Step 5.2: Main Entry Point

**src/main.tsx**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Phase 6: Backend Enhancement

### Step 6.1: Add Trace Events to agent-runner.ts

In `creative-agent-cf/sandbox/agent-runner.ts`, enhance the progress output:

```typescript
// Add at top of file
function emitTrace(type: string, data: any) {
  console.error(`[trace] ${JSON.stringify({ type, ...data, timestamp: new Date().toISOString() })}`);
}

// In the message loop, add:
for await (const message of query({...})) {
  messages.push(message);

  // Emit structured trace
  if (message.type === 'assistant') {
    const content = message.message?.content;
    if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_use') {
          emitTrace('tool_start', {
            tool: block.name,
            toolId: block.id,
            input: block.input,
          });
        }
        if (block.type === 'text') {
          emitTrace('message', { text: block.text?.slice(0, 200) });
        }
      }
    }
  }

  // Existing progress output
  console.error(`[progress] ${JSON.stringify(message)}`);
}
```

---

## Phase 7: Testing & Deployment

### Step 7.1: Local Development

```bash
# Terminal 1: Start backend (Workers dev)
cd creative-agent-cf
npx wrangler dev

# Terminal 2: Start frontend
cd client
npm run dev
```

Open http://localhost:5173

### Step 7.2: Build for Production

```bash
cd client
npm run build
```

### Step 7.3: Deploy to Cloudflare Pages

```bash
cd client
npx wrangler pages deploy dist --project-name=creative-machine
```

### Step 7.4: Configure Production API URL

For production, update the API base URL in the frontend:

**src/api/config.ts**
```typescript
export const API_BASE = import.meta.env.PROD
  ? 'https://creative-agent.your-account.workers.dev'
  : '';
```

Update fetch calls to use `${API_BASE}/generate`.

---

## Checklist

- [ ] Phase 1: Project setup (Vite, Tailwind, dependencies)
- [ ] Phase 2: Types and Zustand store
- [ ] Phase 3: SSE client and useGenerate hook
- [ ] Phase 4: UI components (PromptInput, ProgressDots, Terminal, ImageGrid)
- [ ] Phase 5: Assemble App component
- [ ] Phase 6: Backend trace enhancements
- [ ] Phase 7: Test locally and deploy

---

## File Summary

| File | Purpose |
|------|---------|
| `client/src/types/index.ts` | TypeScript types |
| `client/src/store/index.ts` | Zustand state management |
| `client/src/api/parseSSE.ts` | SSE stream parser |
| `client/src/hooks/useGenerate.ts` | Generation logic |
| `client/src/components/PromptInput.tsx` | Input + button |
| `client/src/components/ProgressDots.tsx` | Progress indicator |
| `client/src/components/Terminal.tsx` | Live terminal |
| `client/src/components/ImageGrid.tsx` | Image gallery |
| `client/src/components/ImageCard.tsx` | Single image |
| `client/src/components/ImageLightbox.tsx` | Full-screen view |
| `client/src/App.tsx` | Main app |
