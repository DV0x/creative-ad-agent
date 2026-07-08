// Phase 2 — fetch each chosen page's ACTIVE ads (country=IN), dump FULL ad records
// to raw/ads/<brand>.jsonl, and download every image creative (skip video-only ads)
// to raw/images/<brand>/. Ranked dump; images capped at top 20 ads per brand.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
for (const f of ['.env.local', '.env']) {
  const p = path.join(REPO_ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const KEY = process.env.SCRAPECREATORS_API_KEY;

const PAGES = [
  { brand: 'verbis-edu', pageId: '261433674397069' },
  { brand: 'e2-test-prep', pageId: '430264727152487' },
  { brand: 'pte-tutorials', pageId: '119847388669970' },
  { brand: 'leap-scholar', pageId: '109456827509203' },
  { brand: 'idp-ielts-india', pageId: '388491071281133' },
  { brand: 'yocket', pageId: '1585691268384511' },
  { brand: 'scaler', pageId: '100171994759155' },
  { brand: 'gradding', pageId: '118493287917533' },
];

const days = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86400000)) : null);
const iso = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : null);

// retry upGrad with sharper queries before fetching
for (const q of ['upGrad Education', 'upGrad India']) {
  try {
    const r = await fetch(`https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(q)}`, { headers: { 'x-api-key': KEY } });
    const d = await r.json();
    const hit = (d?.searchResults ?? []).find((c) => /^upgrad$/i.test(c.name ?? '') && (c.likes ?? 0) > 10000);
    if (hit) { PAGES.push({ brand: 'upgrad', pageId: String(hit.page_id) }); console.log(`upGrad resolved via "${q}" → ${hit.page_id} (likes=${hit.likes})`); break; }
    console.log(`upGrad: no clean hit via "${q}"`);
  } catch (e) { console.log(`upGrad retry error: ${e.message}`); }
}

const summary = [];
for (const { brand, pageId } of PAGES) {
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?pageId=${pageId}&country=IN&status=ACTIVE`;
  let data;
  try { data = await (await fetch(url, { headers: { 'x-api-key': KEY } })).json(); }
  catch (e) { console.log(`${brand}: FETCH ERROR ${e.message}`); continue; }
  const raw = data?.results ?? [];

  const shaped = raw.map((a) => {
    const s = a?.snapshot ?? {};
    return {
      brand, pageId,
      adId: String(a?.ad_archive_id ?? ''),
      active: !!a?.is_active,
      launched: iso(a?.start_date),
      daysRunning: days(a?.start_date, a?.end_date),
      variants: Number(a?.collation_count ?? 1),
      format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
      cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || null,
      link: s?.link_url ?? null,
      title: (s?.title ?? '').toString().trim() || null,
      body: (s?.body?.text ?? '').replace(/\s+/g, ' ').trim(),
      images: Array.isArray(s?.images) ? s.images.map((i) => i?.original_image_url ?? i?.resized_image_url).filter(Boolean) : [],
      nVideos: Array.isArray(s?.videos) ? s.videos.length : 0,
    };
  });
  // revealed-winner rank
  shaped.sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1) : y.variants !== x.variants ? y.variants - x.variants : (y.daysRunning ?? 0) - (x.daysRunning ?? 0)));

  fs.mkdirSync(path.join(__dirname, 'raw', 'ads'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'raw', 'ads', `${brand}.jsonl`), shaped.map((x) => JSON.stringify(x)).join('\n') + '\n');

  // download images for top 20 IMAGE-bearing ads
  const imgDir = path.join(__dirname, 'raw', 'images', brand);
  fs.mkdirSync(imgDir, { recursive: true });
  let dl = 0;
  for (const ad of shaped.filter((x) => x.images.length > 0).slice(0, 20)) {
    for (let i = 0; i < Math.min(ad.images.length, 3); i++) {
      try {
        const r = await fetch(ad.images[i]);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 5000) continue; // skip tracking pixels/tiny thumbs
        fs.writeFileSync(path.join(imgDir, `${ad.adId}_${i}.jpg`), buf);
        dl++;
      } catch { /* skip */ }
    }
  }
  const imgAds = shaped.filter((x) => x.images.length > 0).length;
  const videoOnly = shaped.filter((x) => x.images.length === 0 && x.nVideos > 0).length;
  summary.push({ brand, total: shaped.length, imageAds: imgAds, videoOnly, imagesDownloaded: dl });
  console.log(`${brand}: ${shaped.length} active ads · ${imgAds} with images · ${videoOnly} video-only · ${dl} images saved`);
}
fs.writeFileSync(path.join(__dirname, 'field', 'fetch-summary.json'), JSON.stringify(summary, null, 2));
console.log('\ndone → raw/ads/*.jsonl · raw/images/<brand>/ · field/fetch-summary.json');
