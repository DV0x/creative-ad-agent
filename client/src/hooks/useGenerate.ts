import { useCallback, useRef } from 'react';
import { useAppStore } from '../store';
import { parseSSEStream } from '../api/parseSSE';
import { API_BASE } from '../api/config';
import type { Phase, GeneratedImage } from '../types';

// Trace event types from backend
interface TraceEvent {
  type: 'phase' | 'tool_start' | 'tool_end' | 'message' | 'status' | 'image';
  timestamp: string;
  // Phase events
  phase?: Phase;
  label?: string;
  // Tool events
  tool?: string;
  toolId?: string;
  input?: string;
  success?: boolean;
  // Message/status events
  text?: string;
  message?: string;
  // Image events
  id?: string;
  urlPath?: string;
  prompt?: string;
  filename?: string;
}

// Parse [trace] events from stderr
function parseTraceEvent(line: string): TraceEvent | null {
  if (!line.startsWith('[trace]')) return null;
  try {
    return JSON.parse(line.replace('[trace] ', ''));
  } catch {
    return null;
  }
}

// Fallback: Detect phase from terminal output (for backwards compatibility)
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

// Extract image data from tool result (handles nested JSON in progress messages)
function extractImages(text: string): Array<{
  id: string;
  url: string;
  urlPath: string;
  prompt: string;
  filename: string;
}> {
  const results: Array<{
    id: string;
    url: string;
    urlPath: string;
    prompt: string;
    filename: string;
  }> = [];

  try {
    // First, try to parse the progress message and extract content
    if (text.startsWith('[progress]')) {
      const progressData = JSON.parse(text.replace('[progress] ', ''));

      // Handle tool_result messages
      if (progressData.type === 'tool_result' && progressData.content) {
        let content = progressData.content;

        // Content might be a string (escaped JSON) or array
        if (typeof content === 'string') {
          content = JSON.parse(content);
        } else if (Array.isArray(content)) {
          // MCP format: [{type: "text", text: "..."}]
          const textPart = content.find((p: {type: string}) => p.type === 'text');
          if (textPart?.text) {
            content = JSON.parse(textPart.text);
          }
        }

        if (content?.images && Array.isArray(content.images)) {
          for (const img of content.images) {
            if (img.urlPath && !img.error) {
              results.push({
                id: img.id || `img-${Date.now()}`,
                url: img.urlPath,
                urlPath: img.urlPath,
                prompt: img.prompt || '',
                filename: img.filename || ''
              });
            }
          }
        }
      }
    }

    // Fallback: Look for raw image JSON anywhere in text
    if (results.length === 0 && text.includes('"images"') && text.includes('"urlPath"')) {
      // Try to find and parse any JSON with images array
      const jsonMatches = text.match(/\{[^{}]*"images"\s*:\s*\[[^\]]*\][^{}]*\}/g);
      if (jsonMatches) {
        for (const match of jsonMatches) {
          try {
            const data = JSON.parse(match);
            if (data.images && Array.isArray(data.images)) {
              for (const img of data.images) {
                if (img.urlPath && !img.error) {
                  results.push({
                    id: img.id || `img-${Date.now()}`,
                    url: img.urlPath,
                    urlPath: img.urlPath,
                    prompt: img.prompt || '',
                    filename: img.filename || ''
                  });
                }
              }
            }
          } catch {
            // Continue to next match
          }
        }
      }
    }
  } catch {
    // Ignore parse errors
  }

  return results;
}

// Poll session endpoint for recovery
async function pollSession(
  sessionId: string,
  onImages: (images: GeneratedImage[]) => void,
  onComplete: () => void,
  onStatus: (message: string) => void,
  signal: AbortSignal
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, { signal });
    if (!response.ok) return false;

    const data = await response.json();
    const session = data.session;

    // Recover images from session
    if (session?.images && Array.isArray(session.images)) {
      const recoveredImages: GeneratedImage[] = session.images.map((urlPath: string, i: number) => ({
        id: `recovered-${i}-${Date.now()}`,
        url: urlPath,
        urlPath: urlPath,
        prompt: '',
        filename: urlPath.split('/').pop() || `image-${i}.png`
      }));

      if (recoveredImages.length > 0) {
        onImages(recoveredImages);
        onStatus(`Recovered ${recoveredImages.length} image(s)`);
      }
    }

    // Check if complete
    if (session?.status === 'completed' || session?.status === 'complete') {
      onComplete();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function useGenerate() {
  const {
    prompt,
    startGeneration,
    setPhase,
    addTerminalLine,
    addImage,
    recoverImages,
    setComplete,
    setError,
  } = useAppStore();

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return;

    const sessionId = crypto.randomUUID();
    startGeneration(sessionId);

    addTerminalLine({ type: 'command', text: `$ starting session ${sessionId.slice(0, 8)}...` });

    // AbortController for timeout handling (16 minute timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 960000); // 16 minutes

    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId }),
        signal: controller.signal,
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
          // First, try to parse as structured trace event
          const trace = parseTraceEvent(event.data);

          if (trace) {
            // Handle structured trace events
            switch (trace.type) {
              case 'phase':
                if (trace.phase) {
                  setPhase(trace.phase);
                  addTerminalLine({
                    type: 'command',
                    text: `$ phase: ${trace.label || trace.phase}`
                  });
                  // When we receive 'complete' phase, mark as done and clear timeout
                  // This prevents timeout errors when SDK cleanup takes longer than expected
                  if (trace.phase === 'complete') {
                    clearTimeout(timeoutId);
                    setComplete();
                    addTerminalLine({ type: 'success', text: 'Generation complete!' });
                  }
                }
                break;

              case 'tool_start':
                addTerminalLine({
                  type: 'command',
                  text: `$ ${trace.tool}`
                });
                break;

              case 'tool_end':
                // Silent - don't clutter terminal with tool_end
                break;

              case 'message':
                if (trace.text) {
                  addTerminalLine({
                    type: 'output',
                    text: trace.text.slice(0, 150)
                  });
                }
                break;

              case 'status':
                if (trace.message) {
                  addTerminalLine({
                    type: trace.success ? 'success' : 'output',
                    text: trace.message
                  });
                }
                break;

              case 'image':
                // Add image immediately when received from backend
                if (trace.id && trace.urlPath) {
                  addImage({
                    id: trace.id,
                    url: trace.urlPath,
                    urlPath: trace.urlPath,
                    prompt: trace.prompt || '',
                    filename: trace.filename || ''
                  });
                  addTerminalLine({
                    type: 'success',
                    text: `Image generated: ${trace.filename}`
                  });
                }
                break;
            }
          } else if (event.data.startsWith('[agent-runner]')) {
            // Agent runner status lines
            const text = event.data.replace('[agent-runner] ', '');
            addTerminalLine({ type: 'command', text: `$ ${text}` });
          } else if (event.data.startsWith('[progress]')) {
            // Legacy progress format - skip to avoid duplicate output
            // (trace events already handle this more cleanly)
          } else if (event.data.startsWith('[heartbeat]')) {
            // Skip heartbeat messages - they clutter the terminal
          } else {
            // Other stderr output
            addTerminalLine({ type: 'output', text: event.data });
          }

          // Fallback phase detection (for backwards compatibility)
          const newPhase = detectPhase(event.data);
          if (newPhase) {
            setPhase(newPhase);
          }

          // Extract images if present
          const images = extractImages(event.data);
          for (const image of images) {
            addImage(image);
          }
        }

        // Handle stdout (final result)
        if (event.type === 'stdout' && event.data) {
          addTerminalLine({ type: 'output', text: `-> ${event.data.slice(0, 100)}...` });
        }

        // Handle completion from Worker (backup - phase handler usually fires first)
        if (event.type === 'done') {
          clearTimeout(timeoutId);
          if (event.success) {
            setComplete();
          } else {
            addTerminalLine({ type: 'error', text: 'Generation failed' });
            setError('Generation failed');
          }
        }

        // Handle errors
        if (event.type === 'error') {
          addTerminalLine({ type: 'error', text: `${event.error}` });
          setError(event.error || 'Unknown error');
        }

        // Handle status messages (e.g., container startup)
        if (event.type === 'status' && event.message) {
          addTerminalLine({ type: 'output', text: event.message });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        addTerminalLine({ type: 'error', text: 'Request timed out after 10 minutes' });
        setError('Request timed out after 10 minutes');
      } else {
        // Connection lost - switch to polling mode
        const message = error instanceof Error ? error.message : 'Unknown error';
        addTerminalLine({ type: 'output', text: `Connection interrupted: ${message}` });
        addTerminalLine({ type: 'output', text: 'Switching to polling mode...' });

        // Start polling for recovery
        const pollController = new AbortController();
        let pollCount = 0;
        const maxPolls = 60; // 5 minutes max (60 * 5s)

        const startPolling = async () => {
          pollCount++;

          const isComplete = await pollSession(
            sessionId,
            recoverImages,
            () => {
              clearTimeout(timeoutId);
              if (pollingRef.current) clearInterval(pollingRef.current);
              setComplete();
              addTerminalLine({ type: 'success', text: 'Generation complete (recovered)!' });
            },
            (statusMsg) => addTerminalLine({ type: 'output', text: statusMsg }),
            pollController.signal
          );

          if (isComplete || pollCount >= maxPolls) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (!isComplete && pollCount >= maxPolls) {
              addTerminalLine({ type: 'error', text: 'Polling timeout - generation may still be running' });
              setError('Polling timeout');
            }
          }
        };

        // Poll immediately, then every 5 seconds
        startPolling();
        pollingRef.current = setInterval(startPolling, 5000);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [prompt, startGeneration, setPhase, addTerminalLine, addImage, recoverImages, setComplete, setError]);

  return { generate };
}
