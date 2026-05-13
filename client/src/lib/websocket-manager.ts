/**
 * Module-level WebSocket singleton.
 *
 * Exactly one WebSocket connection exists per browser tab, regardless
 * of how many React components call useWebSocket(). The hook delegates
 * all connection lifecycle to this module.
 *
 * Connection is auth-gated: the socket is NOT opened on subscribe().
 * Instead, the auth layer calls connectWithAuth() once the token is
 * confirmed available, which stores the token getter and connects.
 * Reconnects reuse the stored getter so they are always authenticated.
 */

// ── Constants ──────────────────────────────────────────────────

import * as Sentry from '@sentry/react';
import { crumb } from './observability';

const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const PING_INTERVAL = 25000;
// If we send a ping and no message of any type arrives within this window,
// the connection is silently dead and we want to know about it before the
// eventual 1006 close fires. Tuned generously vs PING_INTERVAL (25s).
const PONG_TIMEOUT = 8000;

// Tracks the last client ping send so ws_close_unexpected can carry "time since last ping"
let lastPingSentAt = 0;
// Timer that fires ping_pong_timeout capture if no inbound message arrives
// after a ping. Cleared by any inbound message (pong or otherwise — any data
// proves the connection is alive).
let pongWatcherTimeout: ReturnType<typeof setTimeout> | null = null;

// ── Module-level state (survives React lifecycle) ──────────────

let activeSocket: WebSocket | null = null;
let connectionGeneration = 0;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;
let unsubscribeTimeout: ReturnType<typeof setTimeout> | null = null;

// Stored token getter — set once by connectWithAuth(), reused on reconnect
let storedTokenGetter: (() => Promise<string | null>) | null = null;
let authReady = false;

// Callbacks registered by the hook (always latest version via refs)
let onStateChange: ((state: string) => void) | null = null;
let onMessage: ((event: MessageEvent) => void) | null = null;
let onConnected: (() => void) | null = null;

// ── Public API ─────────────────────────────────────────────────

/**
 * Register callbacks from the hook. Called on every hook render
 * via refs, so these always point to the latest closures.
 */
export function setCallbacks(cbs: {
  onStateChange: (state: string) => void;
  onMessage: (event: MessageEvent) => void;
  onConnected: () => void;
}): void {
  onStateChange = cbs.onStateChange;
  onMessage = cbs.onMessage;
  onConnected = cbs.onConnected;
}

/**
 * Called when a useWebSocket hook mounts.
 * Increments ref count. If auth is already ready and the socket
 * is not connected, triggers a reconnect (handles server restarts,
 * HMR reloads, and timing races).
 */
export function subscribe(): void {
  subscriberCount++;
  // Cancel any pending disconnect from a recent unsubscribe (component transition)
  if (unsubscribeTimeout) {
    clearTimeout(unsubscribeTimeout);
    unsubscribeTimeout = null;
  }
  // connect() has internal guards for OPEN/CONNECTING state
  if (authReady) {
    connect();
  }
}

/**
 * Called when a useWebSocket hook unmounts.
 * Uses a grace period before disconnecting so that component transitions
 * (e.g. EmptyState → ResultsView) don't kill the socket between unmount/mount.
 */
export function unsubscribe(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0) {
    // Grace period: if another subscriber mounts within 200ms, skip disconnect
    unsubscribeTimeout = setTimeout(() => {
      unsubscribeTimeout = null;
      if (subscriberCount === 0) {
        disconnect();
      }
    }, 200);
  }
}

/**
 * Called by the auth layer once the token is confirmed available.
 * Stores the token getter for use on connect and reconnect, then
 * opens the connection if there are subscribers waiting.
 *
 * In dev mode (no auth), call with no arguments to connect immediately.
 */
export function connectWithAuth(tokenGetter?: () => Promise<string | null>): void {
  if (tokenGetter) {
    storedTokenGetter = tokenGetter;
  }
  authReady = true;

  // Connect if hooks have already subscribed
  if (subscriberCount > 0) {
    connect();
  }
}

/**
 * Open a WebSocket connection. Closes any existing socket first.
 * Uses the stored token getter (set by connectWithAuth) for auth.
 */
export async function connect(): Promise<void> {
  // Don't connect until auth layer has signalled ready
  if (!authReady) return;

  // Already connected or connecting — nothing to do
  if (
    activeSocket?.readyState === WebSocket.OPEN ||
    activeSocket?.readyState === WebSocket.CONNECTING
  ) {
    return;
  }

  // Kill any lingering socket (e.g. CLOSING state)
  if (activeSocket) {
    killSocket(activeSocket);
    activeSocket = null;
  }

  // Clear pending reconnect
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const myGeneration = ++connectionGeneration;

  onStateChange?.('connecting');

  // Build URL with auth token from stored getter
  let wsUrl = WS_BASE_URL;
  crumb('ws', 'connect.start', {
    hasTokenGetter: !!storedTokenGetter,
    authReady,
    attempt: reconnectAttempts,
  });
  try {
    const token = storedTokenGetter ? await storedTokenGetter() : null;
    if (token) {
      wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
    } else {
      crumb('ws', 'connect.no_token', { reason: 'no token from getter' });
    }
  } catch (err) {
    crumb('ws', 'connect.token_error', { err: String(err).slice(0, 200) });
    // Continue without token (dev mode)
  }

  // Generation may have changed during async token fetch
  if (myGeneration !== connectionGeneration) return;

  try {
    const ws = new WebSocket(wsUrl);
    activeSocket = ws;

    ws.onopen = () => {
      if (myGeneration !== connectionGeneration) {
        killSocket(ws);
        return;
      }
      crumb('ws', 'connected');
      onStateChange?.('connected');
      reconnectAttempts = 0;

      // Start keepalive pings + pong watcher
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        lastPingSentAt = Date.now();
        sendMessage({ type: 'ping' });
        // Arm pong watcher: if NO inbound message arrives within PONG_TIMEOUT
        // (resets on any message in ws.onmessage), fire a Sentry capture.
        // This catches "connection silently dead" before the eventual 1006.
        if (pongWatcherTimeout) clearTimeout(pongWatcherTimeout);
        pongWatcherTimeout = setTimeout(() => {
          pongWatcherTimeout = null;
          Sentry.captureMessage('ping_pong_timeout', {
            level: 'warning',
            extra: {
              timeoutMs: PONG_TIMEOUT,
              pingIntervalMs: PING_INTERVAL,
              navigatorOnline: navigator.onLine,
              visibilityState: document.visibilityState,
              readyState: activeSocket?.readyState ?? null,
            },
          });
          crumb('ws', 'pong.timeout', { timeoutMs: PONG_TIMEOUT });
        }, PONG_TIMEOUT);
      }, PING_INTERVAL);

      // Notify hook to run recovery logic
      onConnected?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (myGeneration !== connectionGeneration) return;
      // Any inbound message proves the connection is alive — clear pong watcher
      if (pongWatcherTimeout) {
        clearTimeout(pongWatcherTimeout);
        pongWatcherTimeout = null;
      }
      onMessage?.(event);
    };

    ws.onclose = (event: CloseEvent) => {
      if (myGeneration !== connectionGeneration) {
        crumb('ws', 'close.stale', { gen: myGeneration, active: connectionGeneration });
        return;
      }

      crumb('ws', 'close', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      activeSocket = null;

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
      if (pongWatcherTimeout) {
        clearTimeout(pongWatcherTimeout);
        pongWatcherTimeout = null;
      }

      onStateChange?.('disconnected');

      // Report unexpected closes to Sentry. 1000 = normal, 1001 = going-away
      // (tab close / nav), 4001 = replaced-by-server.
      if (event.code !== 1000 && event.code !== 1001 && event.code !== 4001) {
        Sentry.captureMessage('ws_close_unexpected', {
          level: 'warning',
          tags: { ws_close_code: String(event.code) },
          extra: {
            reason: event.reason,
            wasClean: event.wasClean,
            navigatorOnline: navigator.onLine,
            visibilityState: document.visibilityState,
            timeSinceLastPingMs: lastPingSentAt ? Date.now() - lastPingSentAt : null,
            userAgent: navigator.userAgent,
          },
        });
      }

      // Reconnect on abnormal close (not clean close, not replaced-by-server)
      if (
        event.code !== 1000 &&
        event.code !== 4001 &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttempts++;
        crumb('ws', 'reconnect.scheduled', {
          attempt: reconnectAttempts,
          max: MAX_RECONNECT_ATTEMPTS,
          delayMs: RECONNECT_DELAY * reconnectAttempts,
        });
        onStateChange?.('reconnecting');
        reconnectTimeout = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY * reconnectAttempts);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        Sentry.captureMessage('ws_reconnect_exhausted', {
          level: 'error',
          tags: { ws_close_code: String(event.code) },
          extra: {
            attempts: reconnectAttempts,
            navigatorOnline: navigator.onLine,
            visibilityState: document.visibilityState,
            lastCloseCode: event.code,
            lastCloseReason: event.reason,
          },
        });
        crumb('ws', 'reconnect.exhausted', { attempts: reconnectAttempts });
      }
    };

    ws.onerror = () => {
      if (myGeneration !== connectionGeneration) return;
      crumb('ws', 'error', { msg: 'connection error (server may be unavailable)' });
    };
  } catch (error) {
    console.error('WebSocket: Failed to create connection', error);
    onStateChange?.('disconnected');
  }
}

/**
 * Cleanly disconnect. Invalidates all pending handlers.
 */
export function disconnect(): void {
  connectionGeneration++;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  if (pongWatcherTimeout) {
    clearTimeout(pongWatcherTimeout);
    pongWatcherTimeout = null;
  }
  if (activeSocket) {
    killSocket(activeSocket);
    activeSocket = null;
  }

  onStateChange?.('disconnected');
}

/**
 * Send a JSON message over the active socket.
 * Returns true if sent, false if not connected.
 */
export function sendMessage(message: Record<string, unknown>): boolean {
  if (activeSocket?.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// ── Internal helpers ───────────────────────────────────────────

/**
 * Forcefully terminate a WebSocket: null out all handlers to prevent
 * stale callbacks, then close it.
 */
function killSocket(ws: WebSocket): void {
  ws.onopen = null;
  ws.onclose = null;
  ws.onmessage = null;
  ws.onerror = null;
  try {
    ws.close();
  } catch {
    // Already closed or errored
  }
}
