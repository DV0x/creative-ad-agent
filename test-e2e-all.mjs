/**
 * E2E Test Runner — executes all test scripts in dependency order.
 *
 * Order:
 *   1. REST API (fast, no generation, uses existing data)
 *   2. Image Serving (fast, uses existing data)
 *   3. Cancel (starts generation, cancels ~40s in)
 *   4. Follow-Up / Resume (resumes existing campaign, full generation)
 *   5. Reconnect / Subscribe (starts generation, disconnects, reconnects)
 *
 * Tests 1-2 run first because they're fast (~5s each) and use existing data.
 * Tests 3-5 involve sandbox boot + generation, ordered by duration.
 *
 * Usage: node test-e2e-all.mjs [--skip-long]
 *   --skip-long: Only run fast tests (REST API + Image Serving)
 *
 * Expected duration:
 *   Fast tests only: ~10s
 *   All tests: ~15-20 min
 */

import { execSync } from 'child_process';

const TESTS = [
  { name: 'REST API', script: 'test-e2e-rest-api.mjs', fast: true },
  { name: 'Image Serving', script: 'test-e2e-images.mjs', fast: true },
  { name: 'Cancel', script: 'test-e2e-cancel.mjs', fast: false },
  { name: 'Follow-Up / Resume', script: 'test-e2e-follow-up.mjs', fast: false },
  { name: 'Reconnect / Subscribe', script: 'test-e2e-reconnect.mjs', fast: false },
  { name: 'Streaming Deltas', script: 'test-e2e-streaming.mjs', fast: false },
];

const skipLong = process.argv.includes('--skip-long');
const testsToRun = skipLong ? TESTS.filter(t => t.fast) : TESTS;

console.log('=== E2E Test Suite ===\n');
console.log(`Tests: ${testsToRun.map(t => t.name).join(', ')}`);
if (skipLong) console.log('(Skipping long-running tests)');
console.log();

const results = [];

for (const test of testsToRun) {
  console.log(`${'='.repeat(60)}`);
  console.log(`Running: ${test.name} (${test.script})`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();
  try {
    execSync(`node ${test.script}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      timeout: 900_000, // 15 min per test
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    results.push({ name: test.name, pass: true, duration });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    results.push({ name: test.name, pass: false, duration });
  }
  console.log();
}

// Summary
console.log(`${'='.repeat(60)}`);
console.log('E2E TEST SUITE RESULTS');
console.log(`${'='.repeat(60)}\n`);

const maxNameLen = Math.max(...results.map(r => r.name.length));
for (const r of results) {
  const status = r.pass ? 'PASS' : 'FAIL';
  const pad = ' '.repeat(maxNameLen - r.name.length);
  console.log(`  ${status}  ${r.name}${pad}  (${r.duration}s)`);
}

const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
console.log(`\n  Total: ${passCount} passed, ${failCount} failed out of ${results.length}`);
console.log(`\n=== ${failCount === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===\n`);

process.exit(failCount === 0 ? 0 : 1);
