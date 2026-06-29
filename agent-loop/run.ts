/**
 * Entry point — runs the pipeline on one brand URL, standalone (no WS, no DB).
 *
 *   tsx run.ts <brand-url> [stage1,stage2,...]
 *   tsx run.ts https://thewholetruthfoods.com research          # one-stage smoke
 *   tsx run.ts https://thewholetruthfoods.com                    # full spine
 *
 * Loads the repo-root .env for the MCP keys, then STRIPS ANTHROPIC_API_KEY so the
 * Max login (OAuth) is used. Each run gets its own runs/<stamp>_<brand>/ dir; the
 * stages hand off through files there, and the TraceLogger writes the eval-ready trace.
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
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
  console.error('usage: tsx run.ts <brand-url> [stage1,stage2,...] [--mode surface|deep]');
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
if (order.includes('cell')) need.add('FAL_KEY');
const missing = [...need].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing required env: ${missing.join(', ')} (expected in ${join(REPO_ROOT, '.env')})`);
  process.exit(1);
}

// 4) run dir
const slug = brandUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40).toLowerCase();
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const runDir = join(__dirname, 'runs', `${stamp}_${slug}`);
fs.mkdirSync(join(runDir, 'images'), { recursive: true });

// 5) founder-facts.md (thin — URL only; research names the gaps)
fs.writeFileSync(
  join(runDir, 'founder-facts.md'),
  [
    '# Founder Facts',
    '',
    `- Brand URL: ${brandUrl}`,
    '- No additional founder brief was provided for this run. Work from the URL and the open web;',
    '  name the gaps where founder intake (conversion event, budget, audience, ad history) would normally inform the work.',
    '',
  ].join('\n'),
);

// 6) stage binder reference files into the working dir (mirrors the eval's EXTRA_FILES_FOR,
//    so the binders' "read references/X.md" / "reference/hyperlocal.md" resolve relative to cwd)
const EXTRA_FILES: Record<string, Array<{ src: string; dest: string }>> = {
  research: [{ src: 'agent/.claude/skills/research/reference/hyperlocal.md', dest: 'reference/hyperlocal.md' }],
  cell: [
    ...['layer-stack', 'style-grammar', 'type-grammar', 'shot-spec', 'critic', 'counterexamples'].map((n) => ({
      src: `agent/.claude/skills/cell/references/${n}.md`,
      dest: `references/${n}.md`,
    })),
    ...['testimonial', 'founder-pov', 'pas-real-world'].map((n) => ({
      src: `agent/.claude/skills/cell/references/formats/${n}.md`,
      dest: `references/formats/${n}.md`,
    })),
  ],
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
