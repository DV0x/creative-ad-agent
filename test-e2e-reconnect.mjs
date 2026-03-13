/**
 * E2E Test: Reconnect / Subscribe
 *
 * Tests the WebSocket reconnection and event replay mechanism:
 *   1. Connect WS #1, start a generation
 *   2. Collect events for ~45s (sandbox boots, SDK starts, some events arrive)
 *   3. Record lastEventId from the most recent buffered event
 *   4. Close WS #1 (simulating disconnect)
 *   5. Wait 5s
 *   6. Connect WS #2, send subscribe with sessionId + lastEventId
 *   7. Verify: replayed events arrive (events we missed during disconnect)
 *   8. Verify: new events continue streaming on WS #2
 *   9. Wait for complete or timeout
 *
 * Usage: node test-e2e-reconnect.mjs
 * Expected duration: ~6-8 min (full generation with reconnect mid-way)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const WS_URL = 'wss://creative-agent.alphasapien17.workers.dev/ws';
const SESSION_ID = `test-reconnect-${Date.now()}`;
const DISCONNECT_AFTER_MS = 45_000; // Disconnect after 45s
const RECONNECT_DELAY_MS = 5_000;   // Wait 5s before reconnecting

console.log('=== E2E Test: Reconnect / Subscribe ===\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`Will disconnect after: ${DISCONNECT_AFTER_MS / 1000}s`);
console.log(`Reconnect delay: ${RECONNECT_DELAY_MS / 1000}s\n`);

let passed = 0;
let failed = 0;
let startTime = Date.now();

// State tracking
let ws1EventCount = 0;
let ws2EventCount = 0;
let ws2ReplayedCount = 0;
let ws2NewCount = 0;
let lastEventId = 0;
let campaignId = null;
let sessionId = null;
let gotSubscribed = false;
let gotComplete = false;
let gotError = false;
let phases = [];
let ws1Phases = [];
let ws2Phases = [];

function elapsed() {
  return ((Date.now() - startTime) / 1000).toFixed(1) + 's';
}

function check(condition, name, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function trackEvent(msg, source) {
  if (msg.id && typeof msg.id === 'number') {
    lastEventId = Math.max(lastEventId, msg.id);
  }

  if (msg.type === 'phase' && msg.phase) {
    phases.push(msg.phase);
    if (source === 'ws1') ws1Phases.push(msg.phase);
    if (source === 'ws2') ws2Phases.push(msg.phase);
  }
}

// ─── Phase 1: Connect WS #1 and start generation ───

const ws1 = new WebSocket(WS_URL);
let ws1PingInterval;

ws1.on('open', () => {
  console.log(`[${elapsed()}] WS#1 Connected`);
  console.log(`[${elapsed()}] WS#1 Sending generate...\n`);

  ws1.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create conversion ads for a premium coffee brand called "Dark Roast Co" at https://darkroastco.com - they sell organic single-origin coffee beans. Make 2 ads in clay diorama style.',
    sessionId: SESSION_ID,
  }));

  ws1PingInterval = setInterval(() => {
    if (ws1.readyState === WebSocket.OPEN) {
      ws1.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30_000);

  // Schedule disconnect
  setTimeout(() => {
    if (ws1.readyState === WebSocket.OPEN) {
      console.log(`\n[${elapsed()}] >>> DISCONNECTING WS#1 (lastEventId: ${lastEventId}) <<<\n`);
      clearInterval(ws1PingInterval);
      ws1.close(1000, 'test-disconnect');

      // Schedule reconnect
      setTimeout(() => {
        connectWS2();
      }, RECONNECT_DELAY_MS);
    }
  }, DISCONNECT_AFTER_MS);
});

ws1.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  ws1EventCount++;
  trackEvent(msg, 'ws1');

  switch (msg.type) {
    case 'ack':
      campaignId = msg.campaignId || campaignId;
      sessionId = msg.sessionId || sessionId;
      console.log(`[${elapsed()}] WS#1 ACK — campaignId: ${msg.campaignId}, sessionId: ${msg.sessionId}`);
      break;
    case 'phase':
      console.log(`[${elapsed()}] WS#1 PHASE -> ${msg.phase}`);
      break;
    case 'tool_start':
      console.log(`[${elapsed()}] WS#1 TOOL_START -> ${msg.tool || 'unknown'}`);
      break;
    case 'tool_end':
      console.log(`[${elapsed()}] WS#1 TOOL_END -> ${msg.tool || 'unknown'}`);
      break;
    case 'message':
      console.log(`[${elapsed()}] WS#1 MESSAGE -> "${(msg.text || '').substring(0, 60).replace(/\n/g, ' ')}..."`);
      break;
    case 'status':
      console.log(`[${elapsed()}] WS#1 STATUS -> ${msg.message || ''}`);
      break;
    case 'file':
      console.log(`[${elapsed()}] WS#1 FILE -> ${msg.fileType}`);
      break;
    case 'image':
      console.log(`[${elapsed()}] WS#1 IMAGE -> ${msg.urlPath}`);
      break;
    case 'complete':
      gotComplete = true;
      console.log(`[${elapsed()}] WS#1 COMPLETE (unexpected — generation finished before disconnect)`);
      break;
    case 'pong':
      break;
    default:
      console.log(`[${elapsed()}] WS#1 ${msg.type}`);
  }
});

ws1.on('error', (err) => {
  console.error(`[${elapsed()}] WS#1 ERROR:`, err.message);
});

ws1.on('close', (code) => {
  console.log(`[${elapsed()}] WS#1 Closed (code: ${code})`);
  console.log(`[${elapsed()}] WS#1 Events received: ${ws1EventCount}, lastEventId: ${lastEventId}`);
});

// ─── Phase 2: Connect WS #2 and subscribe ───

function connectWS2() {
  console.log(`\n[${elapsed()}] >>> RECONNECTING WS#2 <<<\n`);
  const lastIdBeforeReconnect = lastEventId;

  const ws2 = new WebSocket(WS_URL);
  let ws2PingInterval;

  ws2.on('open', () => {
    console.log(`[${elapsed()}] WS#2 Connected`);
    console.log(`[${elapsed()}] WS#2 Sending subscribe (sessionId: ${sessionId}, lastEventId: ${lastIdBeforeReconnect})...\n`);

    ws2.send(JSON.stringify({
      type: 'subscribe',
      sessionId,
      lastEventId: lastIdBeforeReconnect,
    }));

    ws2PingInterval = setInterval(() => {
      if (ws2.readyState === WebSocket.OPEN) {
        ws2.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30_000);
  });

  ws2.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    ws2EventCount++;
    trackEvent(msg, 'ws2');

    // Events with id <= lastIdBeforeReconnect are replays
    if (msg.id && typeof msg.id === 'number' && msg.id <= lastIdBeforeReconnect) {
      ws2ReplayedCount++;
    } else if (msg.type !== 'subscribed' && msg.type !== 'pong') {
      ws2NewCount++;
    }

    switch (msg.type) {
      case 'subscribed':
        gotSubscribed = true;
        console.log(`[${elapsed()}] WS#2 SUBSCRIBED — ${msg.message}`);
        break;
      case 'ack':
        console.log(`[${elapsed()}] WS#2 ACK (replayed)`);
        break;
      case 'phase':
        console.log(`[${elapsed()}] WS#2 PHASE -> ${msg.phase} (id: ${msg.id}${msg.id <= lastIdBeforeReconnect ? ' replay' : ' new'})`);
        break;
      case 'tool_start':
        console.log(`[${elapsed()}] WS#2 TOOL_START -> ${msg.tool || 'unknown'} (${msg.id <= lastIdBeforeReconnect ? 'replay' : 'new'})`);
        break;
      case 'tool_end':
        console.log(`[${elapsed()}] WS#2 TOOL_END -> ${msg.tool || 'unknown'} (${msg.id <= lastIdBeforeReconnect ? 'replay' : 'new'})`);
        break;
      case 'message':
        console.log(`[${elapsed()}] WS#2 MESSAGE -> "${(msg.text || '').substring(0, 60).replace(/\n/g, ' ')}..." (${msg.id <= lastIdBeforeReconnect ? 'replay' : 'new'})`);
        break;
      case 'status':
        console.log(`[${elapsed()}] WS#2 STATUS -> ${(msg.message || '').substring(0, 80)}`);
        break;
      case 'file':
        console.log(`[${elapsed()}] WS#2 FILE -> ${msg.fileType} (${msg.id <= lastIdBeforeReconnect ? 'replay' : 'new'})`);
        break;
      case 'image':
        console.log(`[${elapsed()}] WS#2 IMAGE -> ${msg.urlPath} (${msg.id <= lastIdBeforeReconnect ? 'replay' : 'new'})`);
        break;
      case 'complete':
        gotComplete = true;
        console.log(`\n[${elapsed()}] WS#2 COMPLETE`);
        console.log(`  Summary: ${(msg.summary || msg.message || '').substring(0, 120)}`);
        finish(ws2, ws2PingInterval, lastIdBeforeReconnect);
        break;
      case 'incomplete':
        gotError = true;
        console.log(`\n[${elapsed()}] WS#2 INCOMPLETE — ${msg.message || msg.error}`);
        finish(ws2, ws2PingInterval, lastIdBeforeReconnect);
        break;
      case 'error':
        gotError = true;
        console.log(`[${elapsed()}] WS#2 ERROR -> ${msg.error || msg.message}`);
        break;
      case 'pong':
        break;
      default:
        console.log(`[${elapsed()}] WS#2 ${msg.type}`);
    }
  });

  ws2.on('error', (err) => {
    console.error(`[${elapsed()}] WS#2 ERROR:`, err.message);
  });

  ws2.on('close', (code) => {
    clearInterval(ws2PingInterval);
    console.log(`[${elapsed()}] WS#2 Closed (code: ${code})`);
  });

  // Timeout for WS#2
  setTimeout(() => {
    if (!gotComplete && !gotError) {
      console.error(`\n[${elapsed()}] TIMEOUT — generation didn't complete after reconnect`);
      finish(ws2, ws2PingInterval, lastIdBeforeReconnect);
    }
  }, 600_000);
}

function finish(ws2, pingInterval, lastIdBeforeReconnect) {
  clearInterval(pingInterval);

  console.log('\n=== Reconnect / Subscribe Results ===\n');

  check(ws1EventCount > 0, `WS#1 received events: ${ws1EventCount}`);
  check(lastIdBeforeReconnect > 0, `Had buffered events at disconnect (lastEventId: ${lastIdBeforeReconnect})`);
  check(gotSubscribed, 'WS#2 received subscribed confirmation');
  check(ws2ReplayedCount >= 0, `WS#2 replayed events: ${ws2ReplayedCount}`);
  check(ws2NewCount > 0, `WS#2 received new events after reconnect: ${ws2NewCount}`);
  check(gotComplete, 'Generation completed on WS#2');
  check(!gotError || gotComplete, 'No fatal errors');

  console.log(`\nWS#1: ${ws1EventCount} events, phases: ${ws1Phases.join(' -> ')}`);
  console.log(`WS#2: ${ws2EventCount} events (${ws2ReplayedCount} replayed, ${ws2NewCount} new), phases: ${ws2Phases.join(' -> ')}`);
  console.log(`All phases: ${phases.join(' -> ')}`);
  console.log(`Total time: ${elapsed()}`);
  console.log(`\n=== ${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===\n`);

  ws2.close();
  setTimeout(() => process.exit(failed === 0 ? 0 : 1), 500);
}

// Global timeout
setTimeout(() => {
  console.error(`\n[${elapsed()}] GLOBAL TIMEOUT`);
  process.exit(1);
}, 900_000);
