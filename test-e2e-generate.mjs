/**
 * E2E Test: Full Generation
 *
 * Runs a full campaign generation to completion.
 * Verifies:
 *   1. Ack received with campaignId
 *   2. At least 1 image generated
 *   3. Complete event received
 *   4. Campaign status in D1 is 'complete'
 *
 * Usage: node test-e2e-generate.mjs
 * Expected duration: ~5-8 min (sandbox boot + full generation)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const BASE_URL = 'https://creative-agent.alphasapien17.workers.dev';
const WS_URL = 'wss://creative-agent.alphasapien17.workers.dev/ws';
const SESSION_ID = `test-gen-${Date.now()}`;

console.log('=== E2E Test: Full Generation ===\n');
console.log(`Session: ${SESSION_ID}`);

let campaignId = null;
let phases = [];
let imageCount = 0;
let gotAck = false;
let gotComplete = false;
let completeData = null;
let startTime = Date.now();

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

  if (msg.type === 'ack' && msg.campaignId) {
    gotAck = true;
    campaignId = msg.campaignId;
    console.log(`[${elapsed()}] Ack: campaignId=${campaignId}`);
  }
  if (msg.type === 'status') {
    console.log(`[${elapsed()}] Status: ${msg.message}`);
  }
  if (msg.type === 'phase') {
    phases.push(msg.phase);
    console.log(`[${elapsed()}] Phase: ${msg.phase}`);
  }
  if (msg.type === 'image') {
    imageCount++;
    console.log(`[${elapsed()}] Image #${imageCount}: ${msg.urlPath || msg.url}`);
  }
  if (msg.type === 'file') {
    console.log(`[${elapsed()}] File: ${msg.fileType}`);
  }
  if (msg.type === 'error') {
    console.log(`[${elapsed()}] ERROR: ${msg.message || msg.error}`);
  }
  if (msg.type === 'complete') {
    gotComplete = true;
    completeData = msg;
    console.log(`[${elapsed()}] Complete!`);
    finish();
  }
});

ws.on('close', () => {
  console.log(`[${elapsed()}] WebSocket closed`);
});

ws.on('error', (err) => {
  console.log(`[${elapsed()}] WebSocket error: ${err.message}`);
});

async function finish() {
  console.log('\n--- Results ---\n');

  // Check D1 status
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

  let passed = 0;
  let failed = 0;

  function check(condition, name, detail) {
    if (condition) { passed++; console.log(`  PASS: ${name}`); }
    else { failed++; console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`); }
  }

  check(gotAck && campaignId, 'Ack received with campaignId');
  check(imageCount >= 1, `At least 1 image generated (got ${imageCount})`);
  check(gotComplete, 'Complete event received');
  check(d1Status === 'complete', `D1 status is complete (got: ${d1Status})`);

  console.log(`\n  Phases: ${phases.join(' → ')}`);
  console.log(`  Images: ${imageCount}`);
  console.log(`  Duration: ${elapsed()}`);
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
