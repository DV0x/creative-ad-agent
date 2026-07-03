#!/usr/bin/env node
/**
 * Refresh expired creatives — fresh API pull for a fixed set of page_ids.
 *
 * Meta's fbcdn image URLs are signed and expire in ~days. When a corpus was built
 * from a stale cache (e.g. comp's month-old ScrapeCreators pulls), the copy is fine
 * but every image URL 403s. This re-pulls the named pages LIVE (bypassing all disk
 * caches), shapes them with the same field set as deep-extract, and writes a fresh
 * rich corpus.json with valid image URLs.
 *
 * Reads SCRAPECREATORS_API_KEY from .env.local. Costs 1 credit per page.
 * Usage: node refresh-pull.mjs   (edit PAGES + SLUG below)
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SCRIPT_DIR, '..', '..');
const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';

// the 5 India ingestibles brands whose May-cache image URLs have expired
const COUNTRY = 'IN';
const STATUS = 'ACTIVE';
const MAX_ADS = 30;
const SLUG = 'ingestibles-in-refresh-2026-06-16';
const PAGES = [
  { page_id: '489081634454102',  brand: 'MuscleBlaze',         bucket: 'sports-nutrition' },
  { page_id: '1415869608627860', brand: 'Optimum Nutrition',   bucket: 'sports-nutrition' },
  { page_id: '603903383105760',  brand: 'OZiva',               bucket: 'plant-nutrition/wellness' },
  { page_id: '107959920549143',  brand: 'Wellbeing Nutrition', bucket: 'supplements' },
  { page_id: '320897441109128',  brand: 'Bal Bharat',          bucket: 'protein' },
];

function loadApiKey() {
  const envPath = join(REPO, '.env.local');
  if (!existsSync(envPath)) { console.error(`Missing ${envPath}`); process.exit(1); }
  const m = readFileSync(envPath, 'utf8').match(/^SCRAPECREATORS_API_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error('No SCRAPECREATORS_API_KEY in .env.local'); process.exit(1); }
  return m[1].trim().replace(/^["']|["']$/g, '');
}
const API_KEY = loadApiKey();

// ── same field extraction as deep-extract-ingestibles.mjs ─────────────────────
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const days = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86400000)) : null);
const iso = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : null);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u ? '(non-url)' : '(none)'; } };
const destType = (d) => /amazon|amzn|flipkart|myntra|blinkit|nykaa|swiggy|zepto/.test(d) ? 'marketplace'
  : /app\.link|onelink|u9ilnk|go\.link|page\.link/.test(d) ? 'app-deeplink'
  : /maps\.|goo\.gl/.test(d) ? 'maps' : /instagram|facebook|play\.google|apps\.apple/.test(d) ? 'social/store' : 'own-site';

function extract(ad) {
  const s = ad.snapshot ?? {};
  const cards = Array.isArray(s.cards) ? s.cards : [];
  const vids = Array.isArray(s.videos) ? s.videos : [];
  const cardImgs = cards.map((c) => c.resized_image_url || c.original_image_url).filter(Boolean);
  const topImg = (Array.isArray(s.images) && (s.images[0]?.original_image_url || s.images[0]?.resized_image_url)) || null;
  const link = s.link_url ?? '';
  return {
    archive_id: String(ad.ad_archive_id ?? ''),
    permalink: `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`,
    format: String(s.display_format ?? ad.media_type ?? 'n/a'),
    active: Boolean(ad.is_active),
    launched: iso(ad.start_date), ended: iso(ad.end_date),
    days_running: days(ad.start_date, ad.end_date),
    variants: Number(ad.collation_count ?? 1),
    platforms: Array.isArray(ad.publisher_platform) ? ad.publisher_platform : [],
    cta_text: clean(s.cta_text) || null, cta_type: s.cta_type ?? null,
    link_url: link || null, link_domain: host(link), dest_type: destType(host(link)),
    title: clean(s.title) || null, body: clean(s.body?.text) || null,
    link_description: clean(s.link_description) || null, caption: clean(s.caption) || null,
    byline: clean(s.byline) || null,
    n_cards: cards.length, card_images: cardImgs.slice(0, 10),
    card_titles: cards.map((c) => clean(c.title)).filter(Boolean).slice(0, 10),
    n_videos: vids.length,
    video_urls: vids.map((v) => v.video_sd_url || v.video_hd_url).filter(Boolean).slice(0, 5),
    video_thumbs: vids.map((v) => v.video_preview_image_url).filter(Boolean).slice(0, 5),
    top_image: topImg,
  };
}
const rank = (a) => [...a].sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1) : 0) || (y.variants - x.variants) || ((y.days_running ?? 0) - (x.days_running ?? 0)));

// ── live pull (no cache read — guarantees fresh signed URLs) ──────────────────
let creditsRemaining = '?';
const outDir = join(REPO, 'docs/research/ad-library', SLUG);
mkdirSync(outDir, { recursive: true });
const brands = [];
for (const p of PAGES) {
  const url = `${API_BASE}/company/ads?pageId=${p.page_id}&country=${COUNTRY}&status=${STATUS}`;
  process.stderr.write(`  [live] ${p.brand} (${p.page_id})\n`);
  const r = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!r.ok) { console.error(`  ✗ HTTP ${r.status} for ${p.brand}: ${(await r.text().catch(() => '')).slice(0, 160)}`); continue; }
  const data = await r.json();
  if (data?.credits_remaining !== undefined) creditsRemaining = data.credits_remaining;
  const raw = data.results ?? [];
  const ads = rank(raw.map(extract)).slice(0, MAX_ADS);
  const pageLikes = raw[0]?.snapshot?.page_like_count ?? null;
  brands.push({ brand: p.brand, bucket: p.bucket, page_id: p.page_id, page_likes: pageLikes, total: ads.length, ads });
  process.stderr.write(`  ✓ ${raw.length} active ads (kept top ${ads.length})\n`);
}

writeFileSync(join(outDir, 'corpus.json'),
  JSON.stringify({ slug: SLUG, category: 'better-for-you ingestibles (refresh)', market: 'IN', pulled: '2026-06-16', brands }, null, 2));

console.log(`\n✓ refreshed ${brands.length} brands`);
brands.forEach((b) => console.log(`  ${b.brand.padEnd(20)} ${String(b.total).padStart(2)} ads`));
console.log(`credits_remaining=${creditsRemaining}`);
console.log(`→ docs/research/ad-library/${SLUG}/corpus.json`);
