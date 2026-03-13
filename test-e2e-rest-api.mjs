/**
 * E2E Test: REST API
 *
 * Tests all REST API endpoints against deployed Worker using existing campaign data.
 * No WebSocket needed — pure HTTP.
 *
 * Verifies:
 *   1. GET /health — returns ok with D1/R2 status
 *   2. GET /api/campaigns — returns array of campaigns
 *   3. GET /api/campaigns/:id — returns campaign with files, images, messages
 *   4. GET /api/campaigns/:id/files/research — returns research file
 *   5. GET /api/campaigns/:id/files/hooks — returns hooks file
 *   6. GET /api/campaigns/:id/files/prompts — returns prompts file
 *   7. GET /api/campaigns/:id/images — returns images array
 *   8. GET /api/campaigns/:id/messages — returns messages array
 *   9. GET /api/campaigns/:id/status — returns campaign status
 *  10. GET /api/campaigns/nonexistent — returns 404
 *
 * Usage: node test-e2e-rest-api.mjs [campaignId]
 * If no campaignId provided, uses the first completed campaign from the list.
 * Expected duration: ~5s
 */

const BASE_URL = 'https://creative-agent.alphasapien17.workers.dev';

let passed = 0;
let failed = 0;

function check(condition, name, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.log(`  FAIL: ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function fetchJSON(path) {
  const resp = await fetch(`${BASE_URL}${path}`);
  const body = await resp.json();
  return { status: resp.status, body };
}

async function run() {
  console.log('=== E2E Test: REST API ===\n');

  // --- 1. Health Check ---
  console.log('1. GET /health');
  const health = await fetchJSON('/health');
  check(health.status === 200, 'Status 200');
  check(health.body.status === 'ok', 'status: ok');
  check(health.body.d1?.connected === true, 'd1.connected: true');
  check(health.body.r2?.bound === true, 'r2.bound: true');
  check(typeof health.body.d1?.campaigns === 'number', `d1.campaigns: ${health.body.d1?.campaigns}`);
  console.log();

  // --- 2. List Campaigns ---
  console.log('2. GET /api/campaigns');
  const list = await fetchJSON('/api/campaigns');
  check(list.status === 200, 'Status 200');
  check(list.body.success === true, 'success: true');
  check(Array.isArray(list.body.campaigns), 'campaigns is array');
  check(list.body.campaigns.length > 0, `campaigns count: ${list.body.campaigns.length}`);
  console.log();

  // Find a completed campaign to use for remaining tests
  let campaignId = process.argv[2];
  if (!campaignId) {
    const completed = list.body.campaigns.find(c => c.status === 'complete');
    if (!completed) {
      console.log('SKIP: No completed campaigns found for detail tests');
      printSummary();
      return;
    }
    campaignId = completed.id;
  }
  console.log(`Using campaign: ${campaignId}\n`);

  // --- 3. Get Campaign Detail ---
  console.log('3. GET /api/campaigns/:id');
  const detail = await fetchJSON(`/api/campaigns/${campaignId}`);
  check(detail.status === 200, 'Status 200');
  check(detail.body.success === true, 'success: true');
  check(detail.body.campaign?.id === campaignId, `campaign.id matches`);
  check(detail.body.campaign?.status === 'complete', `status: ${detail.body.campaign?.status}`);
  check(typeof detail.body.campaign?.session_id === 'string', `has session_id`);
  check(typeof detail.body.campaign?.sdk_session_id === 'string', `has sdk_session_id`);
  check(Array.isArray(detail.body.files), `files is array (count: ${detail.body.files?.length})`);
  check(Array.isArray(detail.body.images), `images is array (count: ${detail.body.images?.length})`);
  check(Array.isArray(detail.body.messages), `messages is array (count: ${detail.body.messages?.length})`);
  console.log();

  // --- 4-6. Campaign Files ---
  for (const fileType of ['research', 'hooks', 'prompts']) {
    const num = fileType === 'research' ? 4 : fileType === 'hooks' ? 5 : 6;
    console.log(`${num}. GET /api/campaigns/:id/files/${fileType}`);
    const file = await fetchJSON(`/api/campaigns/${campaignId}/files/${fileType}`);
    check(file.status === 200, 'Status 200');
    check(file.body.success === true, 'success: true');
    check(file.body.file?.file_type === fileType, `file_type: ${file.body.file?.file_type}`);
    check(typeof file.body.file?.content === 'string' && file.body.file.content.length > 0, `content length: ${file.body.file?.content?.length || 0}`);
    check(file.body.file?.is_ready === 1, `is_ready: ${file.body.file?.is_ready}`);
    console.log();
  }

  // --- 7. Campaign Images ---
  console.log('7. GET /api/campaigns/:id/images');
  const images = await fetchJSON(`/api/campaigns/${campaignId}/images`);
  check(images.status === 200, 'Status 200');
  check(images.body.success === true, 'success: true');
  check(Array.isArray(images.body.images), 'images is array');
  if (images.body.images?.length > 0) {
    const img = images.body.images[0];
    check(typeof img.file_path === 'string', `image[0].file_path exists`);
    check(typeof img.hook_type === 'string', `image[0].hook_type: ${img.hook_type}`);
    check(typeof img.image_index === 'number', `image[0].image_index: ${img.image_index}`);
  }
  console.log();

  // --- 8. Campaign Messages ---
  console.log('8. GET /api/campaigns/:id/messages');
  const messages = await fetchJSON(`/api/campaigns/${campaignId}/messages`);
  check(messages.status === 200, 'Status 200');
  check(messages.body.success === true, 'success: true');
  check(Array.isArray(messages.body.messages), 'messages is array');
  if (messages.body.messages?.length > 0) {
    const userMsg = messages.body.messages.find(m => m.role === 'user');
    const asstMsg = messages.body.messages.find(m => m.role === 'assistant');
    check(!!userMsg, 'has user message');
    check(!!asstMsg, 'has assistant message');
    check(typeof userMsg?.content === 'string' && userMsg.content.length > 0, 'user message has content');
    check(typeof asstMsg?.content === 'string' && asstMsg.content.length > 0, 'assistant message has content');
  }
  console.log();

  // --- 9. Campaign Status ---
  console.log('9. GET /api/campaigns/:id/status');
  const status = await fetchJSON(`/api/campaigns/${campaignId}/status`);
  check(status.status === 200, 'Status 200');
  check(status.body.success === true, 'success: true');
  check(status.body.status === 'complete', `status: ${status.body.status}`);
  check(typeof status.body.sessionId === 'string', `has sessionId`);
  check(status.body.isAgentRunning === false, `isAgentRunning: ${status.body.isAgentRunning}`);
  console.log();

  // --- 10. Nonexistent Campaign ---
  console.log('10. GET /api/campaigns/nonexistent');
  const notFound = await fetchJSON('/api/campaigns/nonexistent-campaign-id');
  check(notFound.status === 404, `Status: ${notFound.status} (expected 404)`);
  check(notFound.body.success === false, 'success: false');
  console.log();

  printSummary();
}

function printSummary() {
  console.log('=== REST API Results ===\n');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n=== ${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
