/**
 * End-to-end WebSocket test against deployed Cloudflare worker.
 * Usage: node test-e2e.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const WS_URL = 'wss://creative-agent.alphasapien17.workers.dev/ws';
const SESSION_ID = `test-${Date.now()}`;

const ws = new WebSocket(WS_URL);

let eventCount = 0;
let phases = [];
let imageCount = 0;
let startTime = Date.now();

function elapsed() {
  return ((Date.now() - startTime) / 1000).toFixed(1) + 's';
}

ws.on('open', () => {
  console.log(`[${elapsed()}] Connected to ${WS_URL}`);
  console.log(`[${elapsed()}] Sending generate with sessionId: ${SESSION_ID}\n`);

  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create conversion ads for a premium coffee brand called "Dark Roast Co" - they sell organic single-origin coffee beans',
    sessionId: SESSION_ID,
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  eventCount++;

  switch (msg.type) {
    case 'ack':
      console.log(`[${elapsed()}] ACK — campaignId: ${msg.campaignId}, sessionId: ${msg.sessionId}`);
      break;
    case 'phase':
      phases.push(msg.phase);
      console.log(`[${elapsed()}] PHASE → ${msg.phase}`);
      break;
    case 'tool_start':
      console.log(`[${elapsed()}] TOOL_START → ${msg.tool || msg.name || 'unknown'}`);
      break;
    case 'tool_end':
      console.log(`[${elapsed()}] TOOL_END → ${msg.tool || msg.name || 'unknown'}`);
      break;
    case 'message':
      const preview = (msg.text || '').substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${elapsed()}] MESSAGE → "${preview}${(msg.text || '').length > 80 ? '...' : ''}"`);
      break;
    case 'status':
      console.log(`[${elapsed()}] STATUS → ${msg.message || JSON.stringify(msg)}`);
      break;
    case 'file':
      const contentPreview = (msg.content || '').substring(0, 60).replace(/\n/g, ' ');
      console.log(`[${elapsed()}] FILE → type: ${msg.fileType}, content: "${contentPreview}..."`);
      break;
    case 'image':
      imageCount++;
      console.log(`[${elapsed()}] IMAGE #${imageCount} → ${msg.urlPath} (hook: ${msg.hookType})`);
      break;
    case 'complete':
      console.log(`\n[${elapsed()}] COMPLETE ✓`);
      console.log(`  Summary: ${msg.summary || msg.message || '(none)'}`);
      console.log(`  Images: ${msg.imageCount || imageCount}`);
      console.log(`  Phases: ${phases.join(' → ')}`);
      console.log(`  Total events: ${eventCount}`);
      console.log(`  Total time: ${elapsed()}`);
      ws.close();
      break;
    case 'incomplete':
      console.log(`\n[${elapsed()}] INCOMPLETE — ${msg.message || '(no message)'}`);
      ws.close();
      break;
    case 'error':
      console.error(`\n[${elapsed()}] ERROR — ${msg.error || msg.message || JSON.stringify(msg)}`);
      ws.close();
      break;
    case 'pong':
      break;
    default:
      console.log(`[${elapsed()}] ${msg.type} → ${JSON.stringify(msg).substring(0, 100)}`);
  }
});

ws.on('error', (err) => {
  console.error(`[${elapsed()}] WS ERROR:`, err.message);
});

ws.on('close', (code, reason) => {
  console.log(`\n[${elapsed()}] Connection closed (code: ${code}, reason: ${reason || 'none'})`);
  process.exit(code === 1000 ? 0 : 1);
});

// Timeout after 10 minutes
setTimeout(() => {
  console.error(`\n[${elapsed()}] TIMEOUT — generation took too long`);
  ws.close();
  process.exit(1);
}, 600_000);
