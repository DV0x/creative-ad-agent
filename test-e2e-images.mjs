/**
 * E2E Test: Image Serving
 *
 * Fetches actual image URLs from a completed campaign via REST API,
 * then verifies the Worker serves them correctly from R2.
 *
 * Verifies:
 *   1. GET /api/campaigns/:id/images returns image metadata
 *   2. GET /images/{path} returns actual image binary
 *   3. Response has correct Content-Type (image/png)
 *   4. Response has immutable Cache-Control header
 *   5. Response body is non-empty (actual image data)
 *   6. Nonexistent image returns 404
 *
 * Usage: node test-e2e-images.mjs [campaignId]
 * If no campaignId provided, uses the first completed campaign with images.
 * Expected duration: ~3s
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

async function run() {
  console.log('=== E2E Test: Image Serving ===\n');

  // Find a campaign with images
  let campaignId = process.argv[2];
  if (!campaignId) {
    const resp = await fetch(`${BASE_URL}/api/campaigns`);
    const data = await resp.json();
    const completed = data.campaigns?.find(c => c.status === 'complete');
    if (!completed) {
      console.log('SKIP: No completed campaigns found');
      process.exit(0);
    }
    campaignId = completed.id;
  }
  console.log(`Using campaign: ${campaignId}\n`);

  // 1. Get image metadata
  console.log('1. Fetch image metadata from REST API');
  const imgResp = await fetch(`${BASE_URL}/api/campaigns/${campaignId}/images`);
  const imgData = await imgResp.json();
  check(imgData.success === true, 'API returned success');
  check(Array.isArray(imgData.images), 'images is array');
  check(imgData.images?.length > 0, `image count: ${imgData.images?.length}`);
  console.log();

  if (!imgData.images?.length) {
    console.log('SKIP: No images found for this campaign');
    printSummary();
    return;
  }

  // 2. Fetch each image via Worker /images/ route
  for (let i = 0; i < imgData.images.length; i++) {
    const img = imgData.images[i];
    const imgPath = img.file_path; // e.g. /images/1738000000_1_stat_hook.png
    console.log(`${i + 2}. GET ${imgPath}`);

    const url = `${BASE_URL}${imgPath}`;
    const resp = await fetch(url);

    check(resp.status === 200, `Status: ${resp.status}`);

    const contentType = resp.headers.get('Content-Type');
    check(
      contentType?.startsWith('image/'),
      `Content-Type: ${contentType}`
    );

    const cacheControl = resp.headers.get('Cache-Control');
    check(
      cacheControl?.includes('immutable'),
      `Cache-Control: ${cacheControl}`
    );

    // Read body to verify it's actual image data
    const buffer = await resp.arrayBuffer();
    check(buffer.byteLength > 1000, `Body size: ${(buffer.byteLength / 1024).toFixed(1)} KB`);

    // Check PNG magic bytes (89 50 4E 47) or JPEG (FF D8 FF)
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    check(isPng || isJpeg, `Valid image format: ${isPng ? 'PNG' : isJpeg ? 'JPEG' : 'unknown'}`);

    console.log();
  }

  // Test nonexistent image
  console.log(`${imgData.images.length + 2}. GET /images/nonexistent/fake.png`);
  const notFound = await fetch(`${BASE_URL}/images/nonexistent-session/fake-image.png`);
  check(notFound.status === 404, `Status: ${notFound.status} (expected 404)`);
  console.log();

  printSummary();
}

function printSummary() {
  console.log('=== Image Serving Results ===\n');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n=== ${failed === 0 ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
