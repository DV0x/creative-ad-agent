/**
 * Entry point — runs the pipeline on one brand URL, standalone (no WS, no DB).
 *
 *   tsx run.ts <brand-url> [stage1,stage2,...] [--mode surface|deep] [--founder=<brief.md>] [--product=<image>]
 *   tsx run.ts https://verbisedu.com field-scout                 # one-stage smoke
 *   tsx run.ts https://verbisedu.com                             # full spine
 *     (field-scout → read fan-out → field-brief → collect → create ⇄ buy → build ⇄ gate)
 *
 * Loads the repo-root .env for the MCP keys, then STRIPS ANTHROPIC_API_KEY so the
 * Max login (OAuth) is used. Each run gets its own runs/<stamp>_<brand>/ dir; the
 * stages hand off through files there, and the TraceLogger writes the eval-ready trace.
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import * as fs from 'node:fs';
import { runPipeline } from './pipeline.ts';
import { STAGE_ORDER, STAGES, type Mode } from './stages.ts';
import { TraceLogger } from './trace.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

// 1) env — keys split across two repo files: .env.local has PERPLEXITY/SCRAPECREATORS,
//    .env has FAL_KEY. Load both, then strip the Anthropic key so the Max login (OAuth) wins.
loadEnv({ path: join(REPO_ROOT, '.env.local') });
loadEnv({ path: join(REPO_ROOT, '.env') });
delete process.env.ANTHROPIC_API_KEY;
// S153 fix #3: 1h prompt-cache TTL (measured: 92% of cache writes were 5-min TTL
// re-writes; $5.30 of $12.70). Subprocess inherits process.env. See chat/setup.ts.
process.env.ENABLE_PROMPT_CACHING_1H = '1';

// 2) args — positional <brand-url> [stages]  +  optional --mode surface|deep
const rawArgs = process.argv.slice(2);
let mode: Mode = 'surface';
const modeIdx = rawArgs.findIndex((a) => a === '--mode' || a.startsWith('--mode='));
if (modeIdx >= 0) {
  const val = rawArgs[modeIdx].includes('=') ? rawArgs[modeIdx].split('=')[1] : rawArgs[modeIdx + 1];
  if (val !== 'surface' && val !== 'deep') {
    console.error('--mode must be "surface" or "deep"');
    process.exit(1);
  }
  mode = val;
  rawArgs.splice(modeIdx, rawArgs[modeIdx].includes('=') ? 1 : 2);
}
// Render economics (S145 Step 3.1): design 8, render top-N (default 3) at the
// named ratios (default 4:5). The unrendered winners stay stored in creatives.json.
const renderTopRaw = rawArgs.find((a) => a.startsWith('--render='))?.split('=')[1];
const renderTop = Math.min(Math.max(Number(renderTopRaw ?? 3) || 3, 1), 8);
const ratiosRaw = rawArgs.find((a) => a.startsWith('--ratios='))?.split('=')[1];
const ratios = (ratiosRaw ?? '4:5').split(',').map((r) => r.trim()).filter(Boolean);

const positionals = rawArgs.filter((a) => !a.startsWith('--'));
const brandUrl = positionals[0];
if (!brandUrl) {
  console.error('usage: tsx run.ts <brand-url> [stage1,stage2,...] [--mode surface|deep] [--founder=<brief.md>] [--product=<image>] [--render=N] [--ratios=4:5,1:1]');
  process.exit(1);
}
const order = positionals[1]?.split(',').map((s) => s.trim()).filter(Boolean) ?? [...STAGE_ORDER];
for (const s of order) {
  if (!STAGES[s]) {
    console.error(`unknown stage "${s}" — valid: ${Object.keys(STAGES).join(', ')}`);
    process.exit(1);
  }
}

// 3) required keys for the chosen stages — fail fast with a clear message
const need = new Set<string>();
if (order.includes('collect') || order.includes('field-scout')) need.add('PERPLEXITY_API_KEY');
if (order.includes('field-scout')) need.add('SCRAPECREATORS_API_KEY');
const missing = [...need].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing required env: ${missing.join(', ')} (expected in ${join(REPO_ROOT, '.env.local')} / .env)`);
  process.exit(1);
}
// build renders via KIE (primary) or fal (failover) — at least one key must exist
if (order.includes('build') && !process.env.KIE_API_KEY && !process.env.FAL_KEY) {
  console.error('build needs KIE_API_KEY or FAL_KEY (render providers) — neither is set');
  process.exit(1);
}

// 4) run dir — a fresh stamped dir, OR reuse an existing one with --resume=<dir>.
//    Resume is a FRESH query() over the persisted FILE-state (research.md, thebet.md,
//    verdict.md, shotspec.md, render-verdict.md, …), NOT SDK session/JSONL resume. The
//    docs endorse this "pass application state into a fresh session" path as the robust,
//    host-portable one (session_management.md:313); our files-as-handoff design already
//    works this way, so a stage subset (e.g. `cell-render`) re-runs on the cache.
const resumeDir = rawArgs.find((a) => a.startsWith('--resume='))?.split('=')[1];
let runDir: string;
if (resumeDir) {
  runDir = resolve(resumeDir);
  if (!fs.existsSync(runDir)) {
    console.error(`--resume dir not found: ${runDir}`);
    process.exit(1);
  }
  console.log(`↻ RESUME — reusing ${runDir}\n   fresh query() over its cached file-state; running: ${order.join(' → ')}`);
} else {
  const slug = brandUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40).toLowerCase();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  runDir = join(__dirname, 'runs', `${stamp}_${slug}`);
}
fs.mkdirSync(join(runDir, 'field', 'reads'), { recursive: true }); // the reader fan-out appends slice files here
fs.mkdirSync(join(runDir, 'renders'), { recursive: true });

// 5) founder-facts.md — a supplied brief (--founder=<path.md>), else the thin URL-only stub
const founderPath = rawArgs.find((a) => a.startsWith('--founder='))?.split('=')[1];
if (founderPath && !fs.existsSync(founderPath)) {
  console.error(`--founder file not found: ${founderPath}`);
  process.exit(1);
}
const founderFile = join(runDir, 'founder-facts.md');
if (resumeDir && !founderPath && fs.existsSync(founderFile)) {
  console.log('· reusing existing founder-facts.md (from the original run)');
} else {
  fs.writeFileSync(
    founderFile,
    founderPath
      ? fs.readFileSync(founderPath, 'utf-8')
      : [
          '# Founder Facts',
          '',
          `- Brand URL: ${brandUrl}`,
          '- No additional founder brief was provided for this run. Work from the URL and the open web;',
          '  name the gaps where founder intake (conversion event, budget, audience, ad history) would normally inform the work.',
          '',
        ].join('\n'),
  );
}

// 5b) --product=<image> — a real product photo to bind at render. The render MCP
//     binds LOCAL paths (uploading per provider internally), so this just lands the
//     file in assets/ where collect inventories it and build binds it.
const productPath = rawArgs.find((a) => a.startsWith('--product='))?.split('=')[1];
if (productPath) {
  if (!fs.existsSync(productPath)) {
    console.error(`--product file not found: ${productPath}`);
    process.exit(1);
  }
  const ext = (productPath.match(/\.([a-z0-9]+)$/i)?.[1] ?? 'jpg').toLowerCase();
  const dest = join(runDir, 'assets', `product-ref.${ext}`);
  fs.mkdirSync(dirname(dest), { recursive: true });
  fs.copyFileSync(productPath, dest);
  console.log(`· product reference staged → ${dest}`);
}

// 7) run
console.log(`\n🚀 agent-loop · ${order.join(' → ')} · mode=${mode} · render top-${renderTop} @ ${ratios.join(',')}`);
console.log(`   brand: ${brandUrl}`);
console.log(`   run:   ${runDir}\n`);

const logger = new TraceLogger(runDir);
const t0 = Date.now();
try {
  await runPipeline({ brandUrl, runDir, order, mode, logger, renderTop, ratios, onProgress: (line) => console.log(line) });
} catch (e: any) {
  console.error('\n❌ pipeline error:', e?.message ?? e);
} finally {
  const summary = logger.finalize();
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n✅ done in ${mins} min`);
  console.log('   deliverables:');
  for (const s of order) {
    const p = join(runDir, STAGES[s].deliverable);
    console.log(`     ${fs.existsSync(p) ? '✓' : '✗'} ${STAGES[s].deliverable}`);
  }
  const imgDir = join(runDir, 'renders');
  const imgs = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
  console.log(`   renders: ${imgs.length}${imgs.length ? ' → ' + imgDir : ''}`);
  console.log(`   trace:  ${join(runDir, 'trace.md')}  (+ summary.json, trace.jsonl)`);
  if (summary.anomalies.length) console.log(`   ⚠️  ${summary.anomalies.length} anomaly(ies) — see summary.json`);
}
