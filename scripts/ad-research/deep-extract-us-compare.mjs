#!/usr/bin/env node
/** US ingestibles deep-extract + IN-vs-US formats/angles comparison. */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SCRIPT_DIR, '..', '..');
const CACHES = [join(REPO, 'cloudflare/eval/mini-eval/.cache/scrapecreators'), join(SCRIPT_DIR, '.cache')];
const US_SLUG = 'ingestibles-us-deep-2026-06-16';
const IN_CORPUS = join(REPO, 'docs/research/ad-library/ingestibles-deep-2026-06-16/corpus.json');

const US = {
  '320396954740959': { brand: 'RXBAR', bucket: 'snacking/protein-bar' },
  '1978160732305312': { brand: 'Magic Spoon', bucket: 'functional-cereal' },
  '162352551085006': { brand: 'OLIPOP', bucket: 'functional-bev/soda' },
  '101077004856501': { brand: 'Poppi', bucket: 'functional-bev/soda' },
  '183869772601': { brand: 'Athletic Greens / AG1', bucket: 'supplements/greens' },
  '609555915738248': { brand: 'Liquid I.V.', bucket: 'functional-bev/hydration' },
};

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const days = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86400000)) : null);
const iso = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : null);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u ? '(non-url)' : '(none)'; } };
const destType = (d) => /amazon|amzn|flipkart|myntra|blinkit|nykaa|swiggy|zepto|target|walmart/.test(d) ? 'marketplace'
  : /app\.link|onelink|u9ilnk|go\.link|page\.link/.test(d) ? 'app-deeplink'
  : /maps\.|goo\.gl/.test(d) ? 'maps' : /instagram|facebook|play\.google|apps\.apple/.test(d) ? 'social/store' : 'own-site';

function extract(ad) {
  const s = ad.snapshot ?? {};
  const cards = Array.isArray(s.cards) ? s.cards : [];
  const vids = Array.isArray(s.videos) ? s.videos : [];
  const link = s.link_url ?? '';
  return {
    archive_id: String(ad.ad_archive_id ?? ''), permalink: `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`,
    format: String(s.display_format ?? ad.media_type ?? 'n/a'), active: Boolean(ad.is_active),
    launched: iso(ad.start_date), days_running: days(ad.start_date, ad.end_date), variants: Number(ad.collation_count ?? 1),
    platforms: Array.isArray(ad.publisher_platform) ? ad.publisher_platform : [],
    cta_text: clean(s.cta_text) || null, cta_type: s.cta_type ?? null,
    link_url: link || null, link_domain: host(link), dest_type: destType(host(link)),
    title: clean(s.title) || null, body: clean(s.body?.text) || null, link_description: clean(s.link_description) || null,
    n_cards: cards.length, card_images: cards.map((c) => c.resized_image_url || c.original_image_url).filter(Boolean).slice(0, 10),
    n_videos: vids.length, video_thumbs: vids.map((v) => v.video_preview_image_url).filter(Boolean).slice(0, 5),
    top_image: (Array.isArray(s.images) && (s.images[0]?.original_image_url || s.images[0]?.resized_image_url)) || null,
  };
}
const rank = (a) => [...a].sort((x, y) => (x.active !== y.active ? (x.active ? -1 : 1) : 0) || (y.variants - x.variants) || ((y.days_running ?? 0) - (x.days_running ?? 0)));

// ── extract US from cache ─────────────────────────────────────────────────────
const byPage = {};
for (const dir of CACHES) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    let d; try { d = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    if (!Array.isArray(d.results) || !d.results.length) continue;
    const pid = String(d.results[0]?.page_id);
    if (!US[pid]) continue;
    if (byPage[pid] && byPage[pid].n >= d.results.length) continue;
    byPage[pid] = { n: d.results.length, raw: d.results };
  }
}
const usBrands = Object.entries(byPage).map(([pid, { raw }]) => ({ ...US[pid], page_id: pid, total: raw.length, ads: rank(raw.map(extract)) })).sort((a, b) => b.total - a.total);

const outDir = join(REPO, 'docs/research/ad-library', US_SLUG);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'corpus.json'), JSON.stringify({ slug: US_SLUG, category: 'better-for-you ingestibles', market: 'US', pulled: '2026-06-16', brands: usBrands }, null, 2));
const L = [`# Better-for-you ingestibles — US deep extraction (Meta Ad Library)\n`, `Pulled 2026-06-16 · ${usBrands.length} brands · ${usBrands.reduce((n, b) => n + b.total, 0)} ads · all fields. corpus.json = all data points.\n`];
for (const b of usBrands) {
  const bf = {}; b.ads.forEach((a) => { bf[a.format] = (bf[a.format] ?? 0) + 1; });
  L.push(`\n---\n\n## ${b.brand} · _${b.bucket}_\n\`page_id=${b.page_id}\` · ${b.total} ads · formats: ${Object.entries(bf).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  b.ads.forEach((a, i) => {
    L.push(`\n**${i + 1}.** [${a.format}] · ${a.days_running ?? '?'}d (since ${a.launched ?? '?'})${a.active ? '' : ' INACTIVE'} · variants=${a.variants} · CTA: ${a.cta_text ?? 'n/a'} → ${a.link_domain} [${a.dest_type}]`);
    if (a.title) L.push(`   TITLE: ${a.title}`);
    if (a.body) L.push(`   BODY: ${a.body}`);
    if (a.link_description) L.push(`   DESC: ${a.link_description}`);
    L.push(`   ${a.permalink}`);
  });
}
writeFileSync(join(outDir, 'corpus.md'), L.join('\n'));

// ── aggregates + comparison ───────────────────────────────────────────────────
const inBrands = JSON.parse(readFileSync(IN_CORPUS, 'utf8')).brands;
const aggregate = (brands) => {
  const all = brands.flatMap((b) => b.ads); const n = all.length;
  const pct = (key) => { const m = {}; all.forEach((a) => { const v = a[key] ?? 'n/a'; m[v] = (m[v] ?? 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${Math.round(v / n * 100)}%`); };
  const avgVar = (all.reduce((s, a) => s + (a.variants || 1), 0) / n).toFixed(1);
  const avgDays = Math.round(all.reduce((s, a) => s + (a.days_running || 0), 0) / n);
  return { n, fmt: pct('format'), dest: pct('dest_type'), cta: pct('cta_text').slice(0, 4), avgVar, avgDays };
};
const IN = aggregate(inBrands), USA = aggregate(usBrands);
const row = (label, a, b) => console.log(`${label.padEnd(14)} IN: ${String(a).padEnd(52)} US: ${b}`);
console.log(`\n=== US extracted: ${usBrands.length} brands, ${USA.n} ads → docs/research/ad-library/${US_SLUG}/ ===`);
usBrands.forEach((b) => console.log(`  ${b.brand.padEnd(22)} ${b.total} ads`));
console.log(`\n================ IN (${IN.n} ads) vs US (${USA.n} ads) ================`);
row('FORMAT', IN.fmt.join('  '), USA.fmt.join('  '));
row('DESTINATION', IN.dest.join('  '), USA.dest.join('  '));
row('TOP CTAs', IN.cta.join('  '), USA.cta.join('  '));
row('avg variants', IN.avgVar, USA.avgVar);
row('avg days live', IN.avgDays, USA.avgDays);
console.log(`\n=== US top revealed-winner hook per brand ===`);
usBrands.forEach((b) => { const a = b.ads[0]; console.log(`  ${b.brand}: "${(a.title || a.body || '').slice(0, 90)}"`); });
