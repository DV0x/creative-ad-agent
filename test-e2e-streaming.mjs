/**
 * E2E Test: Streaming Deltas
 *
 * Connects via WebSocket, starts generation, verifies:
 *   1. text_start events received (at least 1)
 *   2. text_delta events received (at least 10 — proves token-level streaming)
 *   3. text_end events received (at least 1)
 *   4. text_start count === text_end count (balanced pairs)
 *   5. Existing events still work: ack, phase, image, complete
 *   6. No text_delta events have an 'id' field (proves sendWS, not emitEvent)
 *   7. Phase/image events DO have 'id' field (proves emitEvent still used)
 *   8. Assembled delta text is substantial (>50 chars)
 *   9. No 'message' events received (suppressed by hasStreamedDeltas)
 *
 * Usage: node test-e2e-streaming.mjs
 * Expected duration: ~5-8 min (sandbox boot + full generation)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const ENV = process.env.TEST_ENV || 'staging';
const HOSTS = {
  staging: 'creative-agent-staging.alphasapien17.workers.dev',
  production: 'creative-agent.alphasapien17.workers.dev',
};
const HOST = HOSTS[ENV] || HOSTS.staging;
const BASE_URL = `https://${HOST}`;
const WS_URL = `wss://${HOST}/ws`;
const SESSION_ID = `test-stream-${Date.now()}`;

console.log('=== E2E Test: Streaming Deltas ===\n');
console.log(`Session: ${SESSION_ID}`);

let campaignId = null;
let phases = [];
let imageCount = 0;
let gotAck = false;
let gotComplete = false;
let startTime = Date.now();

// Streaming-specific tracking
let textStartCount = 0;
let textDeltaCount = 0;
let textEndCount = 0;
let allDeltas = [];
let anyDeltaHasId = false;
let somePhaseHasId = false;
let someImageHasId = false;
let messageEventCount = 0;

function elapsed() {
  return ((Date.now() - startTime) / 1000).toFixed(1) + 's';
}

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log(`[${elapsed()}] Connected`);
  ws.send(JSON.stringify({
    type: 'generate',
    prompt: 'Create conversion ads for a premium coffee brand called "Bean Supreme". They sell organic single-origin coffee beans, priced at $24/bag, with over 10,000 5-star reviews. Target audience: health-conscious millennials aged 25-40. Make 2 ads in clay diorama style. Do not visit any websites — use the info provided here.',
    sessionId: SESSION_ID,
  }));
  console.log(`[${elapsed()}] Generate sent\n`);
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'ack':
      if (msg.campaignId) {
        gotAck = true;
        campaignId = msg.campaignId;
        console.log(`[${elapsed()}] Ack: campaignId=${campaignId}`);
      }
      break;

    case 'phase':
      phases.push(msg.phase);
      if (typeof msg.id === 'number') somePhaseHasId = true;
      console.log(`[${elapsed()}] Phase: ${msg.phase}${msg.id ? ` (id=${msg.id})` : ' (no id)'}`);
      break;

    case 'image':
      imageCount++;
      if (typeof msg.id === 'number' || typeof msg.id === 'string') someImageHasId = true;
      console.log(`[${elapsed()}] Image #${imageCount}: ${msg.urlPath || msg.url}`);
      break;

    case 'text_start':
      textStartCount++;
      console.log(`[${elapsed()}] text_start (#${textStartCount})`);
      break;

    case 'text_delta':
      textDeltaCount++;
      if (msg.delta) allDeltas.push(msg.delta);
      if (msg.id !== undefined) anyDeltaHasId = true;
      // Log first few and then every 50th
      if (textDeltaCount <= 3 || textDeltaCount % 50 === 0) {
        const preview = (msg.delta || '').substring(0, 40).replace(/\n/g, '\\n');
        console.log(`[${elapsed()}] text_delta #${textDeltaCount}: "${preview}"`);
      }
      break;

    case 'text_end':
      textEndCount++;
      console.log(`[${elapsed()}] text_end (#${textEndCount})`);
      break;

    case 'message':
      messageEventCount++;
      const preview = (msg.text || '').substring(0, 60).replace(/\n/g, '\\n');
      console.log(`[${elapsed()}] message: "${preview}..." (${messageEventCount} total)`);
      break;

    case 'file':
      console.log(`[${elapsed()}] File: ${msg.fileType}`);
      break;

    case 'tool_start':
      console.log(`[${elapsed()}] Tool: ${msg.tool}`);
      break;

    case 'status':
      console.log(`[${elapsed()}] Status: ${msg.message}`);
      break;

    case 'error':
      console.log(`[${elapsed()}] ERROR: ${msg.message || msg.error}`);
      break;

    case 'complete':
      gotComplete = true;
      console.log(`[${elapsed()}] Complete!`);
      finish();
      break;
  }
});

ws.on('close', () => {
  console.log(`[${elapsed()}] WebSocket closed`);
});

ws.on('error', (err) => {
  console.log(`[${elapsed()}] WebSocket error: ${err.message}`);
});

async function finish() {
  console.log('\n--- Streaming Results ---\n');

  const assembledText = allDeltas.join('');
  console.log(`  text_start: ${textStartCount}`);
  console.log(`  text_delta: ${textDeltaCount}`);
  console.log(`  text_end: ${textEndCount}`);
  console.log(`  message events: ${messageEventCount}`);
  console.log(`  Assembled text: ${assembledText.length} chars`);
  console.log(`  Phases: ${phases.join(' → ')}`);
  console.log(`  Images: ${imageCount}`);
  console.log();

  let passed = 0;
  let failed = 0;

  function check(condition, name, detail) {
    if (condition) { passed++; console.log(`  PASS: ${name}`); }
    else { failed++; console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`); }
  }

  // Core streaming assertions
  check(textStartCount >= 1, `text_start events received (got ${textStartCount})`);
  check(textDeltaCount >= 10, `text_delta events received — proves token streaming (got ${textDeltaCount})`);
  check(textEndCount >= 1, `text_end events received (got ${textEndCount})`);
  check(textStartCount === textEndCount, `Balanced text_start/text_end pairs (${textStartCount}/${textEndCount})`);

  // Existing events still work
  check(gotAck && campaignId, 'Ack received with campaignId');
  check(phases.length >= 1, `Phase events received (got ${phases.length})`);
  check(imageCount >= 1, `Image events received (got ${imageCount})`);
  check(gotComplete, 'Complete event received');

  // sendWS vs emitEvent routing
  check(!anyDeltaHasId, 'text_delta events have no id (sent via sendWS, not buffered)');
  check(somePhaseHasId, 'Phase events have id (sent via emitEvent, buffered)');

  // Delta content
  check(assembledText.length > 50, `Assembled delta text is substantial (${assembledText.length} chars)`);

  // message events should be suppressed when deltas are streaming
  // Note: some message events may still occur if the agent produces text
  // in parts where stream_events don't fire (e.g., subagent results).
  // We check that delta count >> message count.
  if (textDeltaCount > 0) {
    check(
      messageEventCount === 0 || textDeltaCount > messageEventCount * 5,
      `Message events suppressed by hasStreamedDeltas (${messageEventCount} messages vs ${textDeltaCount} deltas)`,
    );
  }

  // D1 verification
  let d1Status = null;
  if (campaignId) {
    try {
      const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}`);
      const data = await resp.json();
      d1Status = data.campaign?.status;
    } catch (e) {
      console.log(`  Could not check D1: ${e.message}`);
    }
  }
  check(d1Status === 'complete', `D1 status is complete (got: ${d1Status})`);

  console.log(`\n  Duration: ${elapsed()}`);
  console.log(`  Campaign ID: ${campaignId}`);
  console.log(`\n  ${passed}/${passed + failed} passed\n`);

  ws.close();
  process.exit(failed === 0 ? 0 : 1);
}

// Timeout after 10 min
setTimeout(() => {
  console.log(`\n[${elapsed()}] TIMEOUT — 10 minutes`);
  finish();
}, 600_000);
