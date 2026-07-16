/**
 * ONE-TIME format-bank seeding (S145 plan §Step 2.6) — founder-gated: COSTS
 * CREDITS, refuses to run without --yes.
 *
 * What it does, per market country:
 *   1. format_hunt each fingerprint (statics-only, ACTIVE, impressions-ranked)
 *      → dumps + top creatives into runs/bank-seed-<stamp>/raw/…
 *   2. one Sonnet pixel-read pass per hunt (top N images, unified read schema)
 *      → field/reads/<hunt>-<country>.jsonl in the seed dir
 *   3. append every read to the bank (dedup by id) via bank.ts
 *
 * The fingerprints are the plan's four families-worth of copy tells:
 *   testimonial → "verified buyer" + "★★★★★" · founder-POV → "so we made"
 *   math-anchor → "do the math" · us-vs-them → "unlike other"
 * The hunt finds the NEIGHBORHOOD; the reader assigns the actual formatFamily
 * from the pixels (fingerprints are recall, reads are precision).
 *
 * Cost: countries × fingerprints × depth scrape credits (default 3×5×1 = 15;
 * ~30-45 at depth 2-3 — the plan's 40-60 estimate) + Sonnet tokens for reads.
 *
 *   npx tsx seed-bank.ts [--countries US,IN,CA] [--depth 1] [--per-hunt 5] --yes
 */
import { config as loadEnv } from 'dotenv';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fs from 'node:fs';
import { runFormatHunts, type FormatHunt } from './mcp/scrapecreators.ts';
import { appendRunReadsToBank } from './bank.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
loadEnv({ path: join(REPO_ROOT, '.env.local') });
loadEnv({ path: join(REPO_ROOT, '.env') });
delete process.env.ANTHROPIC_API_KEY; // Max login (OAuth) wins, as in run.ts

const FINGERPRINTS: Array<{ slug: string; query: string }> = [
  { slug: 'testimonial-verified-buyer', query: 'verified buyer' },
  { slug: 'testimonial-stars', query: '★★★★★' },
  { slug: 'founder-pov-so-we-made', query: 'so we made' },
  { slug: 'math-anchor-do-the-math', query: 'do the math' },
  { slug: 'us-vs-them-unlike-other', query: 'unlike other' },
];

// ── args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argVal = (name: string, dflt: string): string => {
  const i = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i < 0) return dflt;
  return args[i].includes('=') ? args[i].split('=')[1] : (args[i + 1] ?? dflt);
};
const countries = argVal('countries', 'US,IN,CA').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
const depth = Math.min(Math.max(Number(argVal('depth', '1')) || 1, 1), 3);
const perHunt = Math.min(Math.max(Number(argVal('per-hunt', '5')) || 5, 1), 12);
const confirmed = args.includes('--yes');

const plannedCredits = countries.length * FINGERPRINTS.length * depth;
console.log(`bank seeding plan: ${countries.join('+')} × ${FINGERPRINTS.length} fingerprints × depth ${depth}`);
console.log(`  ≈ ${plannedCredits} scrape credits (cache hits are free) + one Sonnet read pass per hunt (top ${perHunt} images each)`);
if (!confirmed) {
  console.log('\nDRY: pass --yes to actually run (this spends credits).');
  process.exit(0);
}
if (!process.env.SCRAPECREATORS_API_KEY) {
  console.error('SCRAPECREATORS_API_KEY missing from .env.local');
  process.exit(1);
}

// ── the read schema, inlined for the reader passes ───────────────────────────
const READ_SCHEMA = fs.readFileSync(
  join(__dirname, 'plugin', 'creative-binders', 'skills', 'field', 'references', 'read-schema.md'),
  'utf8',
);

const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
const seedDir = join(__dirname, 'runs', `bank-seed-${stamp}`);
const rawAdsDir = join(seedDir, 'raw', 'ads');
const imagesRoot = join(seedDir, 'raw', 'images');
fs.mkdirSync(join(seedDir, 'field', 'reads'), { recursive: true });

function readerPrompt(huntSlug: string, country: string, images: string[], dumpFile: string, outFile: string): string {
  return [
    'You are a PIXEL READER seeding a cross-client format bank. Read the ad creatives below and write',
    `one JSONL line per creative to ${outFile} — the unified read schema and its disciplines follow at`,
    'the end of this message. These are hunt results (found by copy fingerprint across ALL advertisers),',
    'so each filename carries its advertiser: <brand-slug>__<adId>_<n>.jpg.',
    '',
    'For EACH image:',
    '  1. Read the image file — actually view the pixels; a read without viewing is fabrication.',
    `  2. Grep ${dumpFile} for its adId — the dump line carries endorsement (daysRunning, variants,`,
    '     active, job) and the platform copy (body/title), which are part of the construction.',
    '  3. Compose ONE line on the schema: id = <brand-slug>_<adId>, endorsement copied from the dump',
    '     line (job included), formatFamily from the CLOSED table, verbatim strings, measured scale.',
    '',
    `View ALL images first, then WRITE THE FILE ONCE. Skip an image only if it is unreadable/corrupt`,
    '(note it in a trailing comment line starting with // ). When the file holds one line per readable',
    'creative, you are done. Produce nothing else.',
    '',
    `Hunt: "${huntSlug}" (${country}). Your images:`,
    ...images.map((p) => `  - ${p}`),
    '',
    '════════════════ THE READ SCHEMA ════════════════',
    READ_SCHEMA,
  ].join('\n');
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  let totalReads = 0;
  for (const country of countries) {
    const hunts: FormatHunt[] = FINGERPRINTS.map((f) => ({
      query: f.query,
      label: `${f.slug}-${country.toLowerCase()}`,
      country,
      depth,
    }));
    console.log(`\n── hunting ${country} (${hunts.length} fingerprints) …`);
    const summary = await runFormatHunts(hunts, rawAdsDir, imagesRoot);
    console.log(summary.split('\n').filter((l) => l.includes('HUNT:') || l.includes('IMAGE CREATIVES')).join('\n'));

    for (const f of FINGERPRINTS) {
      const slug = `${f.slug}-${country.toLowerCase()}`;
      const dir = join(imagesRoot, `hunt-${slug}`);
      if (!fs.existsSync(dir)) { console.log(`   · ${slug}: no images — skipped`); continue; }
      const images = fs.readdirSync(dir).filter((n) => n.endsWith('.jpg')).slice(0, perHunt).map((n) => join(dir, n));
      if (images.length === 0) { console.log(`   · ${slug}: no images — skipped`); continue; }
      const dumpFile = join(rawAdsDir, `hunt-${slug}.jsonl`);
      const outFile = join(seedDir, 'field', 'reads', `${slug}.jsonl`);
      console.log(`   · reading ${slug} (${images.length} images) …`);
      for await (const m of query({
        prompt: readerPrompt(slug, country, images, dumpFile, outFile),
        options: {
          cwd: seedDir,
          model: 'claude-sonnet-4-6',
          settingSources: [],
          allowedTools: ['Read', 'Write', 'Grep', 'Glob'],
          maxTurns: 30,
        },
      })) {
        if ((m as any).type === 'result') {
          console.log(`     result: ${(m as any).subtype} (cost=$${((m as any).total_cost_usd ?? 0).toFixed(3)})`);
        }
      }
      if (fs.existsSync(outFile)) {
        const n = fs.readFileSync(outFile, 'utf8').split('\n').filter((l) => l.trim() && !l.trim().startsWith('//')).length;
        totalReads += n;
        console.log(`     ${n} read(s) written`);
      }
    }
  }

  const banked = appendRunReadsToBank(seedDir, (msg) => console.log(msg));
  console.log(`\nseeding complete: ${totalReads} reads produced, ${banked.appended} banked (${banked.skipped} already present).`);
  console.log(`seed run dir: ${seedDir}`);
})();
