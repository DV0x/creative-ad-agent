/**
 * E2E Test: Follow-Up / Resume
 *
 * Sends a follow_up message to an existing completed campaign.
 * The DO should resume the SDK session via JSONL on R2 and generate
 * new content with full conversation context.
 *
 * Verifies:
 *   1. follow_up ack received with correct campaignId/sessionId
 *   2. SDK resumes (events stream in)
 *   3. Generation completes (complete event)
 *   4. Campaign status returns to 'complete' in D1
 *   5. New assistant message saved in D1
 *
 * Usage: node test-e2e-follow-up.mjs [campaignId]
 * If no campaignId provided, uses the most recent completed campaign.
 * Expected duration: ~3-7 min (sandbox boot + SDK resume + generation)
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('./server/node_modules/ws');

const BASE_URL = 'https://creative-agent.alphasapien17.workers.dev';
const WS_URL = 'wss://creative-agent.alphasapien17.workers.dev/ws';

let passed = 0;
let failed = 0;
let eventCount = 0;
let phases = [];
let imageCount = 0;
let campaignId = null;
let sessionId = null;
let gotAck = false;
let gotComplete = false;
let gotError = false;
let errorMessage = null;
let startTime = Date.now();

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

async function findCampaign() {
  const argId = process.argv[2];
  if (argId) return argId;

  const resp = await fetch(`${BASE_URL}/api/campaigns`);
  const data = await resp.json();
  const completed = data.campaigns?.find(c => c.status === 'complete' && c.sdk_session_id);
  if (!completed) {
    console.log('ERROR: No completed campaign with sdk_session_id found');
    process.exit(1);
  }
  return completed.id;
}

async function getMessageCountBefore() {
  const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/messages`);
  const data = await resp.json();
  return data.messages?.length || 0;
}

async function run() {
  console.log('=== E2E Test: Follow-Up / Resume ===\n');

  campaignId = await findCampaign();
  console.log(`Campaign: ${campaignId}`);

  // Get current message count to verify new messages are added
  const messageCountBefore = await getMessageCountBefore();
  console.log(`Messages before: ${messageCountBefore}`);
  const followUpPrompt = 'Rewrite just the hook headlines to be shorter and punchier. Do NOT do any new research or web fetches — just rewrite the existing hooks with one-word power openers. Only update the hooks file.';
  console.log(`Follow-up prompt: "${followUpPrompt}"\n`);

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log(`[${elapsed()}] Connected`);
    console.log(`[${elapsed()}] Sending follow_up...\n`);

    ws.send(JSON.stringify({
      type: 'follow_up',
      prompt: followUpPrompt,
      campaignId,
    }));
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    eventCount++;

    switch (msg.type) {
      case 'ack':
        gotAck = true;
        sessionId = msg.sessionId;
        console.log(`[${elapsed()}] ACK — campaignId: ${msg.campaignId}, sessionId: ${msg.sessionId}`);
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
        console.log(`[${elapsed()}] MESSAGE -> "${preview}${(msg.text || '').length > 80 ? '...' : ''}"`);
        break;
      case 'status':
        console.log(`[${elapsed()}] STATUS -> ${msg.message || JSON.stringify(msg)}`);
        break;
      case 'file':
        const contentPreview = (msg.content || '').substring(0, 60).replace(/\n/g, ' ');
        console.log(`[${elapsed()}] FILE -> type: ${msg.fileType}, content: "${contentPreview}..."`);
        break;
      case 'image':
        imageCount++;
        console.log(`[${elapsed()}] IMAGE #${imageCount} -> ${msg.urlPath} (hook: ${msg.hookType})`);
        break;
      case 'complete':
        gotComplete = true;
        console.log(`\n[${elapsed()}] COMPLETE`);
        console.log(`  Summary: ${(msg.summary || msg.message || '(none)').substring(0, 120)}`);
        console.log(`  Images: ${msg.imageCount || imageCount}`);
        finish(ws);
        break;
      case 'incomplete':
        gotError = true;
        errorMessage = msg.message || msg.error;
        console.log(`\n[${elapsed()}] INCOMPLETE — ${errorMessage}`);
        finish(ws);
        break;
      case 'error':
        gotError = true;
        errorMessage = msg.error || msg.message;
        console.log(`\n[${elapsed()}] ERROR — ${errorMessage}`);
        // Don't finish on error — might be a status error followed by recovery
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

  ws.on('close', (code) => {
    clearInterval(pingInterval);
    console.log(`[${elapsed()}] Connection closed (code: ${code})`);
  });

  // Ping every 30s
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 30_000);

  async function finish(wsConn) {
    console.log('\n=== Follow-Up Results ===\n');

    check(gotAck, 'Follow-up ack received');
    check(sessionId !== null, `Session ID: ${sessionId}`);
    check(gotComplete, 'Generation completed');
    check(!gotError || gotComplete, `No fatal errors${errorMessage ? `: ${errorMessage}` : ''}`);

    // Check campaign status in D1
    try {
      const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/status`);
      const data = await resp.json();
      check(data.status === 'complete', `D1 status: ${data.status} (expected: complete)`);
    } catch (err) {
      check(false, `D1 status check`, err.message);
    }

    // Check new messages were saved
    try {
      const resp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/messages`);
      const data = await resp.json();
      const messageCountAfter = data.messages?.length || 0;
      check(
        messageCountAfter > messageCountBefore,
        `New messages saved: ${messageCountBefore} -> ${messageCountAfter}`
      );

      // Check the follow-up user message exists
      const lastUser = [...(data.messages || [])].reverse().find(m => m.role === 'user');
      check(
        lastUser?.content?.includes('hook headlines'),
        'Follow-up user message persisted'
      );

      // Check a new assistant message exists
      const lastAssistant = [...(data.messages || [])].reverse().find(m => m.role === 'assistant');
      check(
        lastAssistant?.created_at > lastUser?.created_at || messageCountAfter >= messageCountBefore + 2,
        'New assistant response persisted'
      );
    } catch (err) {
      check(false, 'Message count check', err.message);
    }

    console.log(`\nTotal events: ${eventCount}`);
    console.log(`Phases: ${phases.join(' -> ') || '(none)'}`);
    console.log(`Images: ${imageCount}`);
    console.log(`Total time: ${elapsed()}`);
    console.log(`\n=== ${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===\n`);

    wsConn.close();
    setTimeout(() => process.exit(failed === 0 ? 0 : 1), 500);
  }

  // Timeout after 15 minutes
  setTimeout(() => {
    console.error(`\n[${elapsed()}] TIMEOUT — follow-up took too long`);
    finish(ws);
  }, 900_000);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
