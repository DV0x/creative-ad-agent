/**
 * SWIPE-SEED — one-shot cold start for the reference bank.
 *
 * The thesis (session 2026-07-06): image models mode-collapse to the generic
 * safe version of any genre UNLESS shown concrete reference instances to adapt.
 * Human performance shops solve this with a swipe file; this script builds ours.
 *
 * Flow:
 *   1. Scrape Meta Ad Library (scrapecreators API, direct — the MCP wrapper's
 *      text output drops image URLs) for ~10 brands across ADJACENT categories
 *      (skincare, fintech, food, wellness) + a couple same-category (eyes-only).
 *   2. Download the image creatives of each page's revealed winners.
 *   3. CURATOR (Opus vision, fresh query): views every raw image, admits the
 *      genuinely good ones (~1/3), tags each with genre / proof-mode / category
 *      / the MOVE (the one stealable structural idea), writes bank/index.json.
 *   4. Upload admitted images to fal (so build can pass safe refs to the edit
 *      endpoint) and patch falUrl into the index.
 *
 *   tsx proof/swipe-seed.ts             # full seed
 *   tsx proof/swipe-seed.ts --curate    # skip scrape/download, re-run curation on existing raw/
 */
import { config as loadEnv } from 'dotenv';
import { fal } from '@fal-ai/client';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
loadEnv({ path: join(REPO_ROOT, '.env.local') });
loadEnv({ path: join(REPO_ROOT, '.env') });
delete process.env.ANTHROPIC_API_KEY; // Max OAuth

const BANK_DIR = join(__dirname, 'bank');
const RAW_DIR = join(BANK_DIR, 'raw');
const ADS_DIR = join(BANK_DIR, 'ads');
fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(ADS_DIR, { recursive: true });

const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';
const API_KEY = process.env.SCRAPECREATORS_API_KEY;
const curateOnly = process.argv.includes('--curate');

// Brands chosen for genre coverage, not category match. sameCategory=true entries
// (direct whey/protein rivals) are admitted EYES-ONLY — never into a render call.
const BRANDS: Array<{ name: string; category: string; sameCategory?: boolean }> = [
  { name: 'Minimalist', category: 'skincare (ingredient-transparency DR)' },
  { name: 'Mamaearth', category: 'beauty/personal care' },
  { name: 'CRED', category: 'fintech (statement/big-text ads)' },
  { name: 'Zerodha', category: 'fintech (comparison/education)' },
  { name: 'Yoga Bar', category: 'packaged food' },
  { name: 'Wellbeing Nutrition', category: 'wellness supplements' },
  { name: 'OZiva', category: 'wellness supplements' },
  { name: 'Huel', category: 'global meal-replacement DR' },
  { name: 'AG1', category: 'global greens DR' },
  { name: 'The Whole Truth Foods', category: 'protein/whey', sameCategory: true },
  { name: 'MuscleBlaze', category: 'protein/whey', sameCategory: true },
];

async function apiGet(endpoint: string, params: Record<string, string>): Promise<any> {
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const resp = await fetch(`${API_BASE}/${endpoint}?${qs}`, { headers: { 'x-api-key': API_KEY! } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
  const data = await resp.json();
  if (data?.credits_remaining !== undefined) console.log(`   credits_remaining=${data.credits_remaining}`);
  return data;
}

interface RawEntry {
  id: string; // filename stem
  brand: string;
  category: string;
  sameCategory: boolean;
  daysRunning: number | null;
  variants: number;
  adCopy: string;
  file: string; // path under raw/
}

async function scrapeAndDownload(): Promise<RawEntry[]> {
  if (!API_KEY) throw new Error('SCRAPECREATORS_API_KEY missing');
  const manifest: RawEntry[] = [];

  for (const b of BRANDS) {
    console.log(`\n▶ ${b.name}`);
    let pages: any[];
    try {
      pages = (await apiGet('search/companies', { query: b.name }))?.searchResults ?? [];
    } catch (e: any) { console.log(`   ✗ page search failed: ${e.message}`); continue; }
    if (!pages.length) { console.log('   ✗ no pages'); continue; }
    // Heuristic page pick: most likes. The curator sees actual pixels later, so a
    // namesake slip costs nothing worse than rejected images.
    const page = [...pages].sort((x, y) => (y.likes ?? 0) - (x.likes ?? 0))[0];
    console.log(`   page "${page.name}" likes=${page.likes ?? '?'} id=${page.page_id}`);

    let ads: any[];
    try {
      ads = (await apiGet('company/ads', { pageId: String(page.page_id), country: 'ALL', status: 'ACTIVE' }))?.results ?? [];
    } catch (e: any) { console.log(`   ✗ ads fetch failed: ${e.message}`); continue; }

    // Revealed-winner order, image ads only, top 4 per brand.
    const ranked = [...ads].sort((x, y) => {
      if ((y.collation_count ?? 1) !== (x.collation_count ?? 1)) return (y.collation_count ?? 1) - (x.collation_count ?? 1);
      return (y.start_date ?? 0) < (x.start_date ?? 0) ? -1 : 1;
    });
    let taken = 0;
    for (const ad of ranked) {
      if (taken >= 4) break;
      const img = ad?.snapshot?.images?.[0]?.original_image_url || ad?.snapshot?.images?.[0]?.resized_image_url;
      if (!img) continue;
      const id = `${b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${ad.ad_archive_id}`;
      const file = join(RAW_DIR, `${id}.jpg`);
      try {
        const r = await fetch(img);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 10_000) continue; // skip tiny thumbnails
        fs.writeFileSync(file, buf);
      } catch { continue; }
      const days = ad.start_date ? Math.round((Date.now() - ad.start_date * 1000) / 86_400_000) : null;
      manifest.push({
        id, brand: b.name, category: b.category, sameCategory: !!b.sameCategory,
        daysRunning: days, variants: ad.collation_count ?? 1,
        adCopy: String(ad?.snapshot?.body?.text ?? '').replace(/\s+/g, ' ').slice(0, 200),
        file: `raw/${id}.jpg`,
      });
      taken++;
      console.log(`   ✓ ${id} (${Math.round(fs.statSync(file).size / 1024)}KB, ${days ?? '?'}d, x${ad.collation_count ?? 1})`);
    }
    if (!taken) console.log('   (no image ads — video-only page)');
  }

  fs.writeFileSync(join(BANK_DIR, 'raw-manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

// ── Curator ──────────────────────────────────────────────────────────────────

const GENRES = [
  'annotated-product — product shot with markup doing the arguing: arrows, circles, handwritten notes, labels',
  'big-text-statement — a typographic statement dominates; minimal or no scene',
  'comparison — us-vs-them table, side-by-side, before/after',
  'demo-proof — the claim demonstrated physically (texture, pour, translucency, swatch)',
  'ugc-still — casual phone-photo moment; human context; deliberately unpolished',
  'founder-note — founder speaking plainly: letter, note, to-camera still',
  'document-proof — evidence artifacts: lab report, receipt, certificate, ingredient list (stylized, never fake platform chrome)',
  'pack-macro — the pack/label itself is the hero, close up',
];

const CURATOR_PROMPT = `You are the CURATOR of a performance-creative swipe file. You have a media buyer's eye:
you have seen ten thousand ads and know wallpaper from work. Your job: view raw scraped Meta ads and admit
ONLY the ones worth stealing from — the ads a senior art director would save.

Read bank/raw-manifest.json first (brand, category, days-running, variant count per image — longevity and
variants are the advertiser's own budget voting for the ad). Then VIEW every image file listed (Read its
raw/ path). Judge the pixels, not the metadata.

ADMIT an ad only if (roughly the best third):
  - It has a nameable structural MOVE another brand could steal (a composition/proof/text-density idea) —
    not just "looks nice".
  - It is feed-native performance creative, not brand-poster polish.
  - You can name its genre from the vocabulary below.
REJECT: generic pack-on-gradient, bland lifestyle stock, pure logo posters, anything whose move you cannot
name in one line.

GENRE VOCABULARY (use these exact keys, left of the —):
${GENRES.map((g) => '  - ' + g).join('\n')}

WRITE bank/index.json — a JSON array, one object per ADMITTED ad:
  {
    "id": "<id from manifest>",
    "file": "ads/<id>.jpg",
    "brand": "...", "category": "...", "sameCategory": <bool from manifest>,
    "genre": "<vocabulary key, e.g. annotated-product>",
    "proofMode": "show-it | document | social | comparison | statement",
    "textDensity": "low | medium | high",
    "move": "<ONE line: the stealable structural idea, concrete enough to act on>",
    "daysRunning": <n or null>, "variants": <n>
  }
Also COPY each admitted image from raw/<id>.jpg to ads/<id>.jpg (Bash cp is available).
Admit 8-16 total if the raw pool allows; cover as many different genres as the pool honestly supports.
When bank/index.json is written and the admitted files are copied, you are done. Produce nothing else.`;

async function curate(): Promise<void> {
  const done = new AbortController();
  async function* promptStream(): AsyncGenerator<any> {
    yield {
      type: 'user',
      message: { role: 'user', content: 'Curate the swipe bank: read bank/raw-manifest.json, view every raw image, write bank/index.json and copy admitted images to bank/ads/.' },
      parent_tool_use_id: null,
    };
    if (!done.signal.aborted) await new Promise<void>((r) => done.signal.addEventListener('abort', () => r(), { once: true }));
  }
  const options: Options = {
    cwd: __dirname, // proof/ — so bank/... paths resolve
    model: 'opus',
    systemPrompt: CURATOR_PROMPT,
    settingSources: [],
    strictMcpConfig: true,
    mcpServers: {},
    allowedTools: ['Read', 'Write', 'Bash', 'Glob'],
    maxTurns: 60,
  };
  const hardStop = setTimeout(() => done.abort(), 20 * 60 * 1000);
  try {
    for await (const m of query({ prompt: promptStream(), options })) {
      const msg = m as any;
      if (msg.type === 'assistant') {
        for (const b of msg.message?.content ?? []) {
          if (b.type === 'tool_use') console.log(`   · ${b.name}${b.name === 'Read' ? ' ' + String(b.input?.file_path ?? '').split('/').slice(-1) : ''}`);
        }
      }
      if (msg.type === 'result') {
        console.log(`   ■ curator done — turns=${msg.num_turns}, cost=$${(msg.total_cost_usd ?? 0).toFixed(4)}`);
        done.abort();
      }
    }
  } finally {
    clearTimeout(hardStop);
    done.abort();
  }
}

// ── fal upload for admitted refs ─────────────────────────────────────────────

async function uploadAdmitted(): Promise<void> {
  const indexFile = join(BANK_DIR, 'index.json');
  if (!fs.existsSync(indexFile)) throw new Error('bank/index.json missing — curation failed?');
  const index = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) as any[];
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY missing');
  fal.config({ credentials: process.env.FAL_KEY });
  for (const e of index) {
    const p = join(BANK_DIR, e.file);
    if (!fs.existsSync(p)) { console.log(`   ✗ missing ${e.file} — skipping upload`); continue; }
    if (e.falUrl) continue;
    const buf = fs.readFileSync(p);
    e.falUrl = await fal.storage.upload(new Blob([buf], { type: 'image/jpeg' }));
    console.log(`   ✓ fal ← ${e.id}`);
  }
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

// ── main ─────────────────────────────────────────────────────────────────────

console.log('🗂  swipe-seed — building the reference bank\n');
if (!curateOnly) {
  const manifest = await scrapeAndDownload();
  console.log(`\n${manifest.length} raw creatives downloaded.`);
  if (manifest.length === 0) { console.error('nothing to curate'); process.exit(1); }
} else {
  console.log('(skipping scrape — curating existing raw/)');
}
console.log('\n▶ curator (opus, vision)');
await curate();
console.log('\n▶ uploading admitted refs to fal');
await uploadAdmitted();
const index = JSON.parse(fs.readFileSync(join(BANK_DIR, 'index.json'), 'utf-8'));
console.log(`\n✅ bank ready: ${index.length} admitted refs`);
for (const e of index) console.log(`   [${e.genre}] ${e.id} — ${e.move}${e.sameCategory ? '  (EYES-ONLY: same category)' : ''}`);
