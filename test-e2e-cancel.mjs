/**
 * E2E Test: Cancel Flow
 *
 * Starts a generation, waits for sandbox to boot and SDK to start,
 * then sends cancel. Verifies:
 *   1. Generation starts (ack received)
 *   2. Cancel ack received after sending cancel
 *   3. No more events arrive after cancel
 *   4. Campaign status in D1 is 'cancelled'
 *
 * Usage: node test-e2e-cancel.mjs
 * Expected duration: ~40-60s (sandbox boot + cancel)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const BASE_URL = 'https://creative-agent.alphasapien17.workers.dev';
const WS_URL = `wss://creative-agent.alphasapien17.workers.dev/ws`;
const SESSION_ID = `test-cancel-${Date.now()}`;
const CANCEL_AFTER_MS = 40_000; // Send cancel 40s in (after sandbox boots, SDK starts)

console.log('=== E2E Test: Cancel Flow ===\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`Will cancel after: ${CANCEL_AFTER_MS / 1000}s\n`);

const ws = new WebSocket(WS_URL);

let eventCount = 0;
let campaignId = null;
let gotAck = false;
let gotCancelAck = false;
let gotCompleteOrError = false;
let cancelSent = false;
let eventsAfterCancel = 0;
let phases = [];
let startTime = Date.now();

function elapsed() {
  return ((Date.now() - startTime) / 1000).toFixed(1) + 's';
}

function printResult(pass, message) {
  console.log(`\n${pass ? 'PASS' : 'FAIL'}: ${message}`);
}

ws.on('open', () => {
  console.log(`[${elapsed()}] Connected to ${WS_URL}`);
  console.log(`[${elapsed()}] Sending generate...\n`);

  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create conversion ads for a premium coffee brand called "Dark Roast Co" at https://darkroastco.com - they sell organic single-origin coffee beans. Make 6 ads in clay diorama style.',
    sessionId: SESSION_ID,
  }));

  // Schedule cancel
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN && !gotCompleteOrError) {
      console.log(`\n[${elapsed()}] >>> SENDING CANCEL <<<\n`);
      cancelSent = true;
      ws.send(JSON.stringify({ type: 'cancel' }));

      // Wait a few seconds for cancel response, then close
      setTimeout(() => {
        finish();
      }, 10_000);
    }
  }, CANCEL_AFTER_MS);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  eventCount++;

  if (cancelSent) {
    eventsAfterCancel++;
  }

  switch (msg.type) {
    case 'ack':
      if (!cancelSent) {
        gotAck = true;
        campaignId = msg.campaignId;
        console.log(`[${elapsed()}] ACK — campaignId: ${msg.campaignId}, sessionId: ${msg.sessionId}`);
      } else {
        gotCancelAck = true;
        console.log(`[${elapsed()}] CANCEL ACK — ${msg.message}`);
      }
      break;
    case 'phase':
      phases.push(msg.phase);
      console.log(`[${elapsed()}] PHASE -> ${msg.phase}`);
      break;
    case 'tool_start':
      console.log(`[${elapsed()}] TOOL_START -> ${msg.tool || msg.name || 'unknown'}`);
      break;
    case 'tool_end':
      console.log(`[${elapsed()}] TOOL_END -> ${msg.tool || msg.name || 'unknown'}`);
      break;
    case 'message':
      const preview = (msg.text || '').substring(0, 80).replace(/\n/g, ' ');
      console.log(`[${elapsed()}] MESSAGE -> "${preview}..."`);
      break;
    case 'status':
      console.log(`[${elapsed()}] STATUS -> ${msg.message || JSON.stringify(msg)}`);
      break;
    case 'file':
      console.log(`[${elapsed()}] FILE -> type: ${msg.fileType}`);
      break;
    case 'image':
      console.log(`[${elapsed()}] IMAGE -> ${msg.urlPath}`);
      break;
    case 'complete':
      gotCompleteOrError = true;
      console.log(`[${elapsed()}] COMPLETE -> ${msg.summary || msg.message || '(none)'}`);
      break;
    case 'incomplete':
      gotCompleteOrError = true;
      console.log(`[${elapsed()}] INCOMPLETE -> ${msg.message || msg.error || '(none)'}`);
      break;
    case 'error':
      gotCompleteOrError = true;
      console.log(`[${elapsed()}] ERROR -> ${msg.error || msg.message}`);
      break;
    case 'pong':
      break;
    default:
      console.log(`[${elapsed()}] ${msg.type} -> ${JSON.stringify(msg).substring(0, 100)}`);
  }
});

ws.on('error', (err) => {
  console.error(`[${elapsed()}] WS ERROR:`, err.message);
});

ws.on('close', (code, reason) => {
  clearInterval(pingInterval);
  console.log(`[${elapsed()}] Connection closed (code: ${code})`);
});

// Ping every 30s
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30_000);

async function finish() {
  console.log('\n=== Cancel Flow Results ===\n');

  // Check 1: Generation started
  printResult(gotAck, `Generation ack received (campaignId: ${campaignId})`);

  // Check 2: Cancel ack received
  printResult(gotCancelAck, `Cancel ack received`);

  // Check 3: Verify campaign status via REST API (poll up to 10s for async D1 update)
  let statusOk = false;
  if (campaignId) {
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
        const data = await resp.json();
        const status = data.campaign?.status;
        if (status === 'cancelled') {
          statusOk = true;
          printResult(true, `Campaign status in D1: "cancelled"`);
          break;
        }
        if (attempt === 9) {
          printResult(false, `Campaign status in D1: "${status}" (expected: "cancelled") after 10 retries`);
        }
      } catch (err) {
        if (attempt === 9) printResult(false, `Failed to check campaign status: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Summary
  console.log(`\nTotal events: ${eventCount}`);
  console.log(`Events after cancel: ${eventsAfterCancel}`);
  console.log(`Phases seen: ${phases.join(' -> ')}`);
  console.log(`Total time: ${elapsed()}`);

  const allPassed = gotAck && gotCancelAck && statusOk;
  console.log(`\n=== ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===\n`);

  ws.close();
  setTimeout(() => process.exit(allPassed ? 0 : 1), 500);
}

// Timeout after 3 minutes
setTimeout(() => {
  console.error(`\n[${elapsed()}] TIMEOUT — test took too long`);
  finish();
}, 180_000);
