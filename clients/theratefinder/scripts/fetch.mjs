// Phase 2 — fetch each chosen page's ACTIVE ads (country=CA), dump full records to
// raw/ads/<brand>.jsonl, and download image creatives to raw/images/<brand>/.
//
// Page IDs picked by hand from field/resolve.json + field/resolve-2.json (Canadian pages,
// right category, dominant likes). Ambiguous names were dropped, never guessed.
//
// DCO FIX (carried from S143): static creatives also live in snapshot.cards[] (DCO/carousel),
// not just snapshot.images[]. Pull BOTH or you silently miss most of the real creative.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CLIENT_DIR = path.resolve(__dirname, '..');
for (const f of ['.env.local', '.env']) {
  const p = path.join(REPO_ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const KEY = process.env.SCRAPECREATORS_API_KEY;
if (!KEY) { console.error('missing SCRAPECREATORS_API_KEY'); process.exit(1); }

const PAGES = [
  // RATE LANE — the crowded, commoditised lane (is it really 95% rate-led?)
  ['rate', 'ratehub', '741997649228043'],
  ['rate', 'nesto', '180488989240637'],
  ['rate', 'true-north-mortgage', '124806884020'],
  ['rate', 'butler-mortgage', '172339346145804'],
  ['rate', 'dominion-lending', '490460550983497'],
  ['rate', 'mortgage-alliance', '211509792583'],
  ['rate', 'mortgage-architects', '127094607347416'],
  ['rate', 'frank-mortgage', '114755726876498'],
  // APPROVAL LANE — the "bank said no" tier (the wedge hypothesis)
  ['approval', 'canadian-mortgages-inc', '87780268966'],
  ['approval', 'sunlite-mortgage', '1729646093920632'],
  ['approval', 'greenhouse-mortgage', '369526379764549'],
  ['approval', 'zuzart-mortgages', '840663462473191'],
  ['approval', 'approved-by-dustin', '105545428171513'],
  ['approval', 'lendsimpl', '121503927718054'],
  ['approval', 'swivel-mortgage', '100287336346291'],
  ['approval', 'mortgage-squad-advisors', '317235161621861'],
  // LOCAL RING — Woodbridge / Vaughan / GTA-north (TheRateFinder's backyard)
  ['local', 'pekoe-mortgages', '108711993795502'],
  ['local', '360lending', '244737585862518'],
  ['local', 'miracle-financial', '577299112349066'],
  ['local', 'northwood-mortgage', '150523381662414'],
  // ALT LENDER — who the brokers actually place the hard files with
  ['alt-lender', 'haventree-bank', '2111998369013594'],
];

const days = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86400000)) : null);
const iso = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : null);

// DCO FIX: static creatives hide in snapshot.cards[] as well as snapshot.images[]
function collectImageUrls(s) {
  const urls = [];
  for (const i of Array.isArray(s?.images) ? s.images : []) {
    const u = i?.original_image_url ?? i?.resized_image_url;
    if (u) urls.push(u);
  }
  for (const c of Array.isArray(s?.cards) ? s.cards : []) {
    const u = c?.original_image_url ?? c?.resized_image_url;
    if (u) urls.push(u);
  }
  return [...new Set(urls)];
}
// card-level copy is often where the real headline lives on DCO ads
function collectCardCopy(s) {
  return (Array.isArray(s?.cards) ? s.cards : []).map((c) => ({
    title: (c?.title ?? '').toString().trim() || null,
    body: (c?.body ?? '').toString().replace(/\s+/g, ' ').trim() || null,
    cta: c?.cta_text ?? null,
  })).filter((c) => c.title || c.body);
}

const summary = [];
for (const [ring, brand, pageId] of PAGES) {
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?pageId=${pageId}&country=CA&status=ACTIVE`;
  let data;
  try { data = await (await fetch(url, { headers: { 'x-api-key': KEY } })).json(); }
  catch (e) { console.log(`${brand}: FETCH ERROR ${e.message}`); continue; }
  const raw = data?.results ?? [];

  const shaped = raw.map((a) => {
    const s = a?.snapshot ?? {};
    return {
      ring, brand, pageId,
      adId: String(a?.ad_archive_id ?? ''),
      active: !!a?.is_active,
      launched: iso(a?.start_date),
      daysRunning: days(a?.start_date, a?.end_date),
      variants: Number(a?.collation_count ?? 1),   // more variants = brand is investing = revealed winner
      format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
      cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || null,
      link: s?.link_url ?? null,
      title: (s?.title ?? '').toString().trim() || null,
      body: (s?.body?.text ?? '').replace(/\s+/g, ' ').trim(),
      cards: collectCardCopy(s),
      images: collectImageUrls(s),
      nVideos: Array.isArray(s?.videos) ? s.videos.length : 0,
    };
  });
  // revealed-winner rank: active first, then most variants, then longest-running
  shaped.sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1)
    : y.variants !== x.variants ? y.variants - x.variants
    : (y.daysRunning ?? 0) - (x.daysRunning ?? 0)));

  fs.mkdirSync(path.join(CLIENT_DIR, 'raw', 'ads'), { recursive: true });
  fs.writeFileSync(path.join(CLIENT_DIR, 'raw', 'ads', `${brand}.jsonl`),
    shaped.map((x) => JSON.stringify(x)).join('\n') + (shaped.length ? '\n' : ''));

  const imgDir = path.join(CLIENT_DIR, 'raw', 'images', brand);
  let dl = 0;
  const withImgs = shaped.filter((x) => x.images.length > 0);
  if (withImgs.length) fs.mkdirSync(imgDir, { recursive: true });
  for (const ad of withImgs.slice(0, 12)) {          // IMG_ADS_PER_BRAND
    for (let i = 0; i < Math.min(ad.images.length, 2); i++) {   // IMGS_PER_AD
      try {
        const r = await fetch(ad.images[i]);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 5000) continue;             // skip tracking pixels / tiny thumbs
        fs.writeFileSync(path.join(imgDir, `${ad.adId}_${i}.jpg`), buf);
        dl++;
      } catch { /* skip */ }
    }
  }
  const videoOnly = shaped.filter((x) => !x.images.length && x.nVideos > 0).length;
  summary.push({ ring, brand, total: shaped.length, imageAds: withImgs.length, videoOnly, imagesDownloaded: dl });
  console.log(`[${ring}] ${brand}: ${shaped.length} active · ${withImgs.length} w/ images · ${videoOnly} video-only · ${dl} saved`);
}
fs.writeFileSync(path.join(CLIENT_DIR, 'field', 'fetch-summary.json'), JSON.stringify(summary, null, 2));
const t = summary.reduce((a, s) => ({ ads: a.ads + s.total, imgs: a.imgs + s.imagesDownloaded }), { ads: 0, imgs: 0 });
console.log(`\nTOTAL: ${t.ads} active ads · ${t.imgs} images → raw/ · field/fetch-summary.json`);
