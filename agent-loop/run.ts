/**
 * Entry point — runs the pipeline on one brand URL, standalone (no WS, no DB).
 *
 *   tsx run.ts <brand-url> [stage1,stage2,...] [--mode surface|deep] [--founder=<brief.md>] [--product=<image>]
 *   tsx run.ts https://thewholetruthfoods.com research          # one-stage smoke
 *   tsx run.ts https://thewholetruthfoods.com                    # full spine
 *
 * Loads the repo-root .env for the MCP keys, then STRIPS ANTHROPIC_API_KEY so the
 * Max login (OAuth) is used. Each run gets its own runs/<stamp>_<brand>/ dir; the
 * stages hand off through files there, and the TraceLogger writes the eval-ready trace.
 */
import { config as loadEnv } from 'dotenv';
import { fal } from '@fal-ai/client';
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
const positionals = rawArgs.filter((a) => !a.startsWith('--'));
const brandUrl = positionals[0];
if (!brandUrl) {
  console.error('usage: tsx run.ts <brand-url> [stage1,stage2,...] [--mode surface|deep] [--founder=<brief.md>] [--product=<image>]');
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
if (order.includes('research') || order.includes('comp')) need.add('PERPLEXITY_API_KEY');
if (order.includes('comp')) need.add('SCRAPECREATORS_API_KEY');
if (order.includes('cell-render')) need.add('FAL_KEY');
const missing = [...need].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing required env: ${missing.join(', ')} (expected in ${join(REPO_ROOT, '.env')})`);
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
fs.mkdirSync(join(runDir, 'images'), { recursive: true });

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

// 5b) refs.json — bind a real product photo if given (--product=<image>). The image model fetches a URL,
//     and there is no built-in upload step, so push it to fal here; also copy it locally for the cell's
//     vision gate. Absent --product, no refs.json is written → the cell runs text-to-image (unchanged).
const productPath = rawArgs.find((a) => a.startsWith('--product='))?.split('=')[1];
if (productPath) {
  if (!fs.existsSync(productPath)) {
    console.error(`--product file not found: ${productPath}`);
    process.exit(1);
  }
  if (!process.env.FAL_KEY) {
    console.error('--product needs FAL_KEY to upload the reference image');
    process.exit(1);
  }
  fal.config({ credentials: process.env.FAL_KEY });
  const buf = fs.readFileSync(productPath);
  const ext = (productPath.match(/\.([a-z0-9]+)$/i)?.[1] ?? 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const localPath = join(runDir, `product-ref.${ext}`);
  fs.writeFileSync(localPath, buf);
  console.log('· uploading product reference to fal …');
  const falUrl = await fal.storage.upload(new Blob([buf], { type: mime }));
  fs.writeFileSync(
    join(runDir, 'refs.json'),
    JSON.stringify({ references: [{ falUrl, localPath, fileId: 'product-ref' }] }, null, 2),
  );
  console.log(`· product bound → ${falUrl}`);
}

// 6) stage binder reference files into the working dir (mirrors the eval's EXTRA_FILES_FOR,
//    so the binders' "read references/X.md" / "reference/hyperlocal.md" resolve relative to cwd)
// The cell reference bundle — copied into cwd for BOTH cell stages (and the critics
// read counterexamples.md / the cell reads critic.md from here). Same set for each.
const CELL_REFS = [
  ...['layer-stack', 'style-grammar', 'type-grammar', 'shot-spec', 'critic', 'render-critic', 'counterexamples'].map((n) => ({
    src: `agent/.claude/skills/cell/references/${n}.md`,
    dest: `references/${n}.md`,
  })),
  ...['testimonial', 'founder-pov', 'pas-real-world'].map((n) => ({
    src: `agent/.claude/skills/cell/references/formats/${n}.md`,
    dest: `references/formats/${n}.md`,
  })),
];
const EXTRA_FILES: Record<string, Array<{ src: string; dest: string }>> = {
  research: [{ src: 'agent/.claude/skills/research/reference/hyperlocal.md', dest: 'reference/hyperlocal.md' }],
  'cell-generate': CELL_REFS,
  'cell-render': CELL_REFS,
};
for (const s of order) {
  for (const f of EXTRA_FILES[s] ?? []) {
    const src = join(REPO_ROOT, f.src);
    const dest = join(runDir, f.dest);
    if (fs.existsSync(src)) {
      fs.mkdirSync(dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

// 7) run
console.log(`\n🚀 agent-loop · ${order.join(' → ')} · mode=${mode}`);
console.log(`   brand: ${brandUrl}`);
console.log(`   run:   ${runDir}\n`);

const logger = new TraceLogger(runDir);
const t0 = Date.now();
try {
  await runPipeline({ brandUrl, runDir, order, mode, logger, onProgress: (line) => console.log(line) });
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
  const imgDir = join(runDir, 'images');
  const imgs = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
  console.log(`   images: ${imgs.length}${imgs.length ? ' → ' + imgDir : ''}`);
  console.log(`   trace:  ${join(runDir, 'trace.md')}  (+ summary.json, trace.jsonl)`);
  if (summary.anomalies.length) console.log(`   ⚠️  ${summary.anomalies.length} anomaly(ies) — see summary.json`);
}
