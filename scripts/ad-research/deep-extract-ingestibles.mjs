#!/usr/bin/env node
/**
 * Deep extraction for the "better-for-you ingestibles" category — pulls the
 * FULL field set for EVERY cached ad of the category brands (across both cache
 * dirs), into one comprehensive corpus.{json,md}. corpus.json = all data points;
 * corpus.md = readable; console = per-brand + category aggregates.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SCRIPT_DIR, '..', '..');
const CACHES = [join(REPO, 'cloudflare/eval/mini-eval/.cache/scrapecreators'), join(SCRIPT_DIR, '.cache')];
const SLUG = 'ingestibles-deep-2026-06-16';

const IG = {
  '108531977179455': { brand: 'The Whole Truth', bucket: 'protein/clean-label' },
  '489081634454102': { brand: 'MuscleBlaze', bucket: 'sports-nutrition' },
  '1415869608627860': { brand: 'Optimum Nutrition', bucket: 'sports-nutrition' },
  '603903383105760': { brand: 'OZiva', bucket: 'plant-nutrition/wellness' },
  '107959920549143': { brand: 'Wellbeing Nutrition', bucket: 'supplements' },
  '320897441109128': { brand: 'Bal Bharat', bucket: 'protein' },
  '336994479721509': { brand: 'Yogabar', bucket: 'snacking' },
  '271595149591920': { brand: 'Blue Tokai', bucket: 'functional-bev/coffee' },
  '325859228089056': { brand: 'Anveshan', bucket: 'clean-label' },
  '631432006996993': { brand: 'Sleepy Owl Coffee', bucket: 'functional-bev/coffee' },
};

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
    launched: iso(ad.start_date),
    ended: iso(ad.end_date),
    days_running: days(ad.start_date, ad.end_date),
    variants: Number(ad.collation_count ?? 1),
    platforms: Array.isArray(ad.publisher_platform) ? ad.publisher_platform : [],
    cta_text: clean(s.cta_text) || null,
    cta_type: s.cta_type ?? null,
    link_url: link || null,
    link_domain: host(link),
    dest_type: destType(host(link)),
    title: clean(s.title) || null,
    body: clean(s.body?.text) || null,
    link_description: clean(s.link_description) || null,
    caption: clean(s.caption) || null,
    byline: clean(s.byline) || null,
    n_cards: cards.length,
    card_images: cardImgs.slice(0, 10),
    card_titles: cards.map((c) => clean(c.title)).filter(Boolean).slice(0, 10),
    n_videos: vids.length,
    video_urls: vids.map((v) => v.video_sd_url || v.video_hd_url).filter(Boolean).slice(0, 5),
    video_thumbs: vids.map((v) => v.video_preview_image_url).filter(Boolean).slice(0, 5),
    top_image: topImg,
  };
}
const rank = (a) => [...a].sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1) : 0) || (y.variants - x.variants) || ((y.days_running ?? 0) - (x.days_running ?? 0)));

// ── read both caches, keep the fullest copy per ingestibles page ──────────────
const byPage = {};
for (const dir of CACHES) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    let d; try { d = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    if (!Array.isArray(d.results) || !d.results.length) continue;
    const pid = String(d.results[0]?.page_id);
    if (!IG[pid]) continue;
    if (byPage[pid] && byPage[pid].n >= d.results.length) continue;
    byPage[pid] = { n: d.results.length, raw: d.results };
  }
}

const brands = Object.entries(byPage).map(([pid, { raw }]) => {
  const ads = rank(raw.map(extract));
  const s = raw[0]?.snapshot ?? {};
  return { ...IG[pid], page_id: pid, page_likes: s.page_like_count ?? null, total: ads.length, ads };
}).sort((a, b) => b.total - a.total);

// ── aggregates ────────────────────────────────────────────────────────────────
const agg = (key) => { const m = {}; brands.forEach((b) => b.ads.forEach((a) => { const v = a[key] ?? 'n/a'; m[v] = (m[v] ?? 0) + 1; })); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
const fmt = agg('format'); const cta = agg('cta_text'); const dest = agg('dest_type');
const totalAds = brands.reduce((n, b) => n + b.total, 0);

// ── write JSON (all data points) ──────────────────────────────────────────────
const outDir = join(REPO, 'docs/research/ad-library', SLUG);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'corpus.json'), JSON.stringify({ slug: SLUG, category: 'better-for-you ingestibles', market: 'IN', pulled: '2026-06-16', brands }, null, 2));

// ── write MD (readable) ───────────────────────────────────────────────────────
const L = [];
L.push(`# Better-for-you ingestibles — deep extraction (Meta Ad Library, India)\n`);
L.push(`Pulled 2026-06-16 · ${brands.length} brands · ${totalAds} ads · ALL fields. corpus.json holds every data point; this is the readable view.\n`);
L.push(`> No performance data exists for commercial ads. variants × days-running = revealed-winner proxy.\n`);
L.push(`**Format mix:** ${fmt.map(([k, v]) => `${k} ${v}`).join(' · ')}`);
L.push(`**Destination mix:** ${dest.map(([k, v]) => `${k} ${v}`).join(' · ')}`);
L.push(`**Top CTAs:** ${cta.slice(0, 6).map(([k, v]) => `"${k}" ${v}`).join(' · ')}`);
L.push(`**Not advertising in IN (0 active ads):** Happilo, Open Secret\n`);
for (const b of brands) {
  const bf = {}; b.ads.forEach((a) => { bf[a.format] = (bf[a.format] ?? 0) + 1; });
  L.push(`\n---\n\n## ${b.brand} · _${b.bucket}_`);
  L.push(`\`page_id=${b.page_id}\` · likes=${b.page_likes ?? '?'} · ${b.total} active ads · formats: ${Object.entries(bf).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  b.ads.forEach((a, i) => {
    L.push(`\n**${i + 1}.** [${a.format}] · ${a.days_running ?? '?'}d (since ${a.launched ?? '?'})${a.active ? '' : ' · INACTIVE'} · variants=${a.variants} · ${a.platforms.join('+') || 'n/a'}`);
    L.push(`   CTA: ${a.cta_text ?? 'n/a'}${a.cta_type ? ` (${a.cta_type})` : ''} → ${a.link_domain} [${a.dest_type}]`);
    if (a.title) L.push(`   TITLE: ${a.title}`);
    if (a.body) L.push(`   BODY: ${a.body}`);
    if (a.link_description) L.push(`   DESC: ${a.link_description}`);
    const asset = a.card_images[0] || a.video_thumbs[0] || a.top_image;
    if (asset) L.push(`   CREATIVE: ${a.n_cards ? `${a.n_cards} cards` : a.n_videos ? `${a.n_videos} video(s)` : 'image'} · ${asset.slice(0, 95)}…`);
    L.push(`   ${a.permalink}`);
  });
}
writeFileSync(join(outDir, 'corpus.md'), L.join('\n'));

// ── console summary ───────────────────────────────────────────────────────────
console.log(`✓ ${brands.length} brands · ${totalAds} ads · all fields extracted`);
brands.forEach((b) => console.log(`  ${b.brand.padEnd(20)} ${String(b.total).padStart(2)} ads · ${b.bucket}`));
console.log(`\nFORMAT MIX:  ${fmt.map(([k, v]) => `${k} ${v} (${Math.round(v / totalAds * 100)}%)`).join(' · ')}`);
console.log(`DEST MIX:    ${dest.map(([k, v]) => `${k} ${v} (${Math.round(v / totalAds * 100)}%)`).join(' · ')}`);
console.log(`TOP CTAs:    ${cta.slice(0, 6).map(([k, v]) => `"${k}" ${v}`).join(' · ')}`);
console.log(`\n→ docs/research/ad-library/${SLUG}/{corpus.json (all data points), corpus.md}`);
