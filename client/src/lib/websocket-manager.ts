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

const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;
const PING_INTERVAL = 25000;

// ── Module-level state (survives React lifecycle) ──────────────

let activeSocket: WebSocket | null = null;
let connectionGeneration = 0;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let pingInterval: ReturnType<typeof setInterval> | null = null;
let subscriberCount = 0;

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
 * Only does ref counting — does NOT trigger connection.
 * Connection is triggered separately by connectWithAuth().
 */
export function subscribe(): void {
  subscriberCount++;
}

/**
 * Called when a useWebSocket hook unmounts.
 * Disconnect only when the LAST subscriber unmounts.
 */
export function unsubscribe(): void {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0) {
    disconnect();
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
  try {
    const token = storedTokenGetter ? await storedTokenGetter() : null;
    if (token) {
      wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
    }
  } catch {
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
      console.log('WebSocket: Connected');
      onStateChange?.('connected');
      reconnectAttempts = 0;

      // Start keepalive pings
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        sendMessage({ type: 'ping' });
      }, PING_INTERVAL);

      // Notify hook to run recovery logic
      onConnected?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (myGeneration !== connectionGeneration) return;
      onMessage?.(event);
    };

    ws.onclose = (event: CloseEvent) => {
      if (myGeneration !== connectionGeneration) return;

      console.log('WebSocket: Disconnected', event.code, event.reason);
      activeSocket = null;

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      onStateChange?.('disconnected');

      // Reconnect on abnormal close (not clean close, not replaced-by-server)
      if (
        event.code !== 1000 &&
        event.code !== 4001 &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS
      ) {
        reconnectAttempts++;
        console.log(
          `WebSocket: Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
        );
        onStateChange?.('reconnecting');
        reconnectTimeout = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY * reconnectAttempts);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('WebSocket: Max reconnection attempts reached');
      }
    };

    ws.onerror = () => {
      if (myGeneration !== connectionGeneration) return;
      console.log('WebSocket: Connection error (server may be unavailable)');
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
