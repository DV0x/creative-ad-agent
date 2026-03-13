/**
 * Quick test: check sandbox container location via debug diagnostics.
 * Watches for the network test status message which reveals the sandbox IP.
 * Cancels once generation starts (research phase).
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const WS_URL = 'wss://creative-agent.alphasapien17.workers.dev/ws';
const sessionId = `test-loc-${Date.now()}`;
let cancelled = false;

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('[open] Connected');
  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create a test campaign for Bean Supreme coffee',
    sessionId,
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  if (msg.type === 'status') {
    console.log('[status]', msg.message);
  }
  if (msg.type === 'ack') {
    console.log('[ack]', msg.message || JSON.stringify(msg));
  }
  if (msg.type === 'error') {
    console.log('[error]', msg.message || msg.error);
  }
  if (msg.type === 'phase') {
    console.log('[phase]', msg.phase);
    if (cancelled === false && msg.phase === 'research') {
      cancelled = true;
      console.log('\n--- Generation running, cancelling ---');
      ws.send(JSON.stringify({ type: 'cancel' }));
      setTimeout(() => { ws.close(); process.exit(0); }, 5000);
    }
  }
  if (msg.type === 'complete') {
    console.log('[complete]', msg.message || '');
    ws.close();
    process.exit(0);
  }
});

setTimeout(() => {
  console.log('TIMEOUT - 120s');
  if (cancelled === false) {
    ws.send(JSON.stringify({ type: 'cancel' }));
  }
  setTimeout(() => { ws.close(); process.exit(1); }, 3000);
}, 120000);
