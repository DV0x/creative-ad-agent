// Event Buffer System for WebSocket Resilience
// Stores events per session with sequential IDs for replay on reconnect

// Reuse the ServerMessage type structure
interface BufferableEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface BufferedEvent {
  id: number;
  event: BufferableEvent;
  timestamp: number;
}

export interface EventBuffer {
  events: BufferedEvent[];
  nextId: number;
  createdAt: number;
}

// In-memory storage - events are transient (generation-lifetime only)
const sessionEventBuffers = new Map<string, EventBuffer>();

// Configuration
const MAX_EVENTS_PER_SESSION = 1000;  // Prevent memory bloat
const MAX_BUFFER_AGE_MS = 40 * 60 * 1000;  // 40 minutes (user requested)

/**
 * Get or create an event buffer for a session
 */
export function getOrCreateBuffer(sessionId: string): EventBuffer {
  let buffer = sessionEventBuffers.get(sessionId);

  if (!buffer) {
    buffer = {
      events: [],
      nextId: 1,
      createdAt: Date.now()
    };
    sessionEventBuffers.set(sessionId, buffer);
  }

  return buffer;
}

/**
 * Append an event to the session buffer
 * Returns the assigned event ID
 */
export function appendEvent(sessionId: string, event: BufferableEvent): number {
  const buffer = getOrCreateBuffer(sessionId);

  const bufferedEvent: BufferedEvent = {
    id: buffer.nextId++,
    event,
    timestamp: Date.now()
  };

  buffer.events.push(bufferedEvent);

  // Trim old events if buffer is too large
  if (buffer.events.length > MAX_EVENTS_PER_SESSION) {
    buffer.events = buffer.events.slice(-Math.floor(MAX_EVENTS_PER_SESSION / 2));
  }

  return bufferedEvent.id;
}

/**
 * Get all events after a given ID (for replay on reconnect)
 */
export function getEventsSince(sessionId: string, afterId: number): BufferedEvent[] {
  const buffer = sessionEventBuffers.get(sessionId);

  if (!buffer) {
    return [];
  }

  return buffer.events.filter(e => e.id > afterId);
}

/**
 * Get the latest event ID for a session
 */
export function getLatestEventId(sessionId: string): number {
  const buffer = sessionEventBuffers.get(sessionId);
  return buffer ? buffer.nextId - 1 : 0;
}

/**
 * Check if a session has an active buffer
 */
export function hasBuffer(sessionId: string): boolean {
  return sessionEventBuffers.has(sessionId);
}

/**
 * Clear buffer for a session (call on generation complete after grace period)
 */
export function clearBuffer(sessionId: string): void {
  sessionEventBuffers.delete(sessionId);
}

/**
 * Cleanup old buffers (call periodically)
 */
export function cleanupOldBuffers(): void {
  const now = Date.now();

  for (const [sessionId, buffer] of sessionEventBuffers.entries()) {
    if (now - buffer.createdAt > MAX_BUFFER_AGE_MS) {
      console.log(`[EventBuffer] Cleaning up expired buffer for session ${sessionId}`);
      sessionEventBuffers.delete(sessionId);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldBuffers, 5 * 60 * 1000);

console.log('[EventBuffer] Initialized with 40-minute TTL');
