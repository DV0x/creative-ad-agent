// Round-2 mine from DISCOVERED names (no assumptions): resolve → confident-pick → fetch → dump.
// Confidence rule for auto-pick: exact-ish name match OR dominant likes (≥5x runner-up, ≥1000).
// Ambiguous names are reported, never guessed.
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

// From field/discovery.md (Perplexity), two tiers:
const NAMES = [
  // PTE / English same-skill tier
  ['pte', 'Entri App'], ['pte', "Tiju's Academy"], ['pte', 'Sure Way English'],
  ['pte', 'EnglishWise'], ['pte', 'Vision Language Experts'], ['english', 'Josh Skills'],
  ['english', 'Awal English Academy'],
  // Paid-workshop construction tier (cross-category)
  ['workshop', 'Booming Bulls'], ['workshop', 'Pushkar Raj Thakur'],
  ['workshop', 'Bada Business'], ['workshop', 'Ankur Warikoo'],
  ['workshop', 'CA Rachana Ranade'], ['workshop', 'FITTR'],
  ['workshop', 'Astro Arun Pandit'], ['workshop', 'Cook With Parul'],
];

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const days = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86400000)) : null);
const iso = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : null);

const picks = [];
const ambiguous = [];
for (const [tier, name] of NAMES) {
  let d;
  try {
    d = await (await fetch(`https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(name)}`, { headers: { 'x-api-key': KEY } })).json();
  } catch (e) { ambiguous.push({ name, reason: `error ${e.message}` }); continue; }
  const cands = (d?.searchResults ?? []).map((c) => ({ page_id: String(c.page_id), name: c.name, likes: c.likes ?? 0, ig: c.ig_username ?? '', cat: c.category ?? '' }));
  if (!cands.length) { ambiguous.push({ name, reason: 'no pages' }); continue; }
  cands.sort((a, b) => b.likes - a.likes);
  const exact = cands.find((c) => norm(c.name) === norm(name) || norm(c.name).startsWith(norm(name)));
  const top = cands[0];
  let chosen = null;
  if (exact && exact.likes >= 1000) chosen = exact;
  else if (top.likes >= 1000 && (cands[1] ? top.likes >= 5 * cands[1].likes : true) && norm(top.name).includes(norm(name).slice(0, 6))) chosen = top;
  if (chosen) { picks.push({ tier, query: name, ...chosen }); console.log(`PICK  ${name} → ${chosen.page_id} "${chosen.name}" likes=${chosen.likes} ig=${chosen.ig}`); }
  else { ambiguous.push({ name, reason: 'no confident match', candidates: cands.slice(0, 3) }); console.log(`SKIP  ${name} — ambiguous: ${cands.slice(0, 3).map((c) => `${c.name}(${c.likes})`).join(' | ')}`); }
}

console.log('\n— fetching ads for picks —');
const summary = [];
for (const p of picks) {
  const slug = norm(p.query).slice(0, 30) || p.page_id;
  let d;
  try {
    d = await (await fetch(`https://api.scrapecreators.com/v1/facebook/adLibrary/company/ads?pageId=${p.page_id}&country=IN&status=ACTIVE`, { headers: { 'x-api-key': KEY } })).json();
  } catch (e) { console.log(`${p.query}: fetch error ${e.message}`); continue; }
  const raw = d?.results ?? [];
  const shaped = raw.map((a) => {
    const s = a?.snapshot ?? {};
    return {
      brand: slug, tier: p.tier, pageId: p.page_id, pageName: p.name,
      adId: String(a?.ad_archive_id ?? ''), active: !!a?.is_active,
      launched: iso(a?.start_date), daysRunning: days(a?.start_date, a?.end_date),
      variants: Number(a?.collation_count ?? 1),
      format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
      cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || null,
      link: s?.link_url ?? null, title: (s?.title ?? '').toString().trim() || null,
      body: (s?.body?.text ?? '').replace(/\s+/g, ' ').trim(),
      images: Array.isArray(s?.images) ? s.images.map((i) => i?.original_image_url ?? i?.resized_image_url).filter(Boolean) : [],
      nVideos: Array.isArray(s?.videos) ? s.videos.length : 0,
    };
  });
  shaped.sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1) : y.variants !== x.variants ? y.variants - x.variants : (y.daysRunning ?? 0) - (x.daysRunning ?? 0)));
  fs.writeFileSync(path.join(__dirname, 'raw', 'ads', `${slug}.jsonl`), shaped.map((x) => JSON.stringify(x)).join('\n') + '\n');
  const imgDir = path.join(__dirname, 'raw', 'images', slug);
  fs.mkdirSync(imgDir, { recursive: true });
  let dl = 0;
  for (const ad of shaped.filter((x) => x.images.length > 0).slice(0, 15)) {
    try {
      const r = await fetch(ad.images[0]);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length >= 5000) { fs.writeFileSync(path.join(imgDir, `${ad.adId}.jpg`), buf); dl++; }
      }
    } catch { /* skip */ }
  }
  const imgAds = shaped.filter((x) => x.images.length > 0).length;
  summary.push({ brand: slug, tier: p.tier, total: shaped.length, imageAds: imgAds, imagesDownloaded: dl });
  console.log(`${slug} [${p.tier}]: ${shaped.length} active · ${imgAds} with images · ${dl} saved`);
}
fs.writeFileSync(path.join(__dirname, 'field', 'fetch2-summary.json'), JSON.stringify({ picks, ambiguous, summary }, null, 2));
console.log('\nwritten → field/fetch2-summary.json');
