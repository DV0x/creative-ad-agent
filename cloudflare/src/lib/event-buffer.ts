// Per-DO event buffer for WebSocket resilience.
// Each Durable Object has its own instance (no Map needed).
// DO eviction handles cleanup (no interval timer needed).

import type { ServerMessage, BufferedEvent } from './types.js';

const MAX_EVENTS = 1000;
const TRIM_TO = 500;

export class EventBuffer {
  private events: BufferedEvent[] = [];
  private nextId = 1;

  /** Append an event to the buffer. Returns the assigned event ID. */
  append(event: ServerMessage): number {
    const buffered: BufferedEvent = {
      id: this.nextId++,
      event,
      timestamp: Date.now(),
    };
    this.events.push(buffered);

    if (this.events.length > MAX_EVENTS) {
      this.events = this.events.slice(-TRIM_TO);
    }

    return buffered.id;
  }

  /** Get all events after a given ID (for replay on reconnect). */
  getEventsSince(afterId: number): BufferedEvent[] {
    return this.events.filter(e => e.id > afterId);
  }

  /** Get the latest event ID. */
  getLatestEventId(): number {
    return this.nextId - 1;
  }

  /** Check if this buffer has any events. */
  hasEvents(): boolean {
    return this.events.length > 0;
  }

  /** Clear all events (e.g., before a follow-up to remove stale events). */
  clear(): void {
    this.events = [];
    this.nextId = 1;
  }
}
