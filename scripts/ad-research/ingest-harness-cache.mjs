#!/usr/bin/env node
/**
 * Companion to scrape-ad-library.mjs — turn the ALREADY-PAID harness
 * ScrapeCreators cache into an analysis-ready corpus, for FREE (zero credits).
 *
 * The comp apprentice's past runs cached competitor ad pulls in
 *   cloudflare/eval/mini-eval/.cache/scrapecreators/
 * under readable keys (country=in&ep=company_ads&pageId=...&status=active.json).
 * This reads those, shapes + revealed-winner ranks them, groups by page_name,
 * and writes the same corpus.{md,json} shape as the scraper — so any analysis
 * lens (hook bank, format census, …) points at it identically.
 *
 * Usage:
 *   node scripts/ad-research/ingest-harness-cache.mjs [slug] [maxAds]
 *   # default slug = harness-cache-ingest, maxAds = 12
 */

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const HARNESS_CACHE = join(REPO_ROOT, 'cloudflare', 'eval', 'mini-eval', '.cache', 'scrapecreators');
const SLUG = process.argv[2] ?? 'harness-cache-ingest';
const MAX_ADS = Number(process.argv[3] ?? 12);

if (!existsSync(HARNESS_CACHE)) { console.error(`No harness cache at ${HARNESS_CACHE}`); process.exit(1); }

const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const daysBetween = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86_400_000)) : null);
const isoDay = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : 'n/a');
const domainOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u ? String(u).slice(0, 40) : 'n/a'; } };

function shapeAd(a) {
  const s = a?.snapshot ?? {};
  return {
    mediaFormat: String(s?.display_format ?? a?.media_type ?? 'n/a'),
    daysRunning: daysBetween(a?.start_date, a?.end_date),
    launched: isoDay(a?.start_date),
    variants: Number(a?.collation_count ?? 1),
    active: Boolean(a?.is_active),
    cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
    linkDomain: domainOf(s?.link_url),
    title: clean(s?.title),
    body: clean(s?.body?.text),
    linkDescription: clean(s?.link_description),
  };
}
const rank = (ads) => [...ads].sort((x, y) =>
  (x.active !== y.active ? (x.active ? -1 : 1) : 0) || (y.variants - x.variants) || ((y.daysRunning ?? 0) - (x.daysRunning ?? 0)));

const files = readdirSync(HARNESS_CACHE).filter((f) => f.includes('ep=company_ads') && f.endsWith('.json'));
const corpus = [];
for (const f of files) {
  let data; try { data = JSON.parse(readFileSync(join(HARNESS_CACHE, f), 'utf8')); } catch { continue; }
  const raw = data?.results ?? [];
  if (!raw.length) continue; // empty / errored pull
  const pageId = (f.match(/pageId=(\d+)/) ?? [])[1] ?? '?';
  const pageName = raw[0]?.page_name ?? `page ${pageId}`;
  corpus.push({ brand: pageName, page_id: pageId, totalActive: raw.length, ads: rank(raw.map(shapeAd)).slice(0, MAX_ADS) });
}
corpus.sort((a, b) => b.totalActive - a.totalActive);

const outDir = join(REPO_ROOT, 'docs', 'research', 'ad-library', SLUG);
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const header = `# Ad-Library Corpus (ingested from harness cache) — ${SLUG}\n\n` +
  `Source: cloudflare/eval/mini-eval/.cache/scrapecreators/ · ingested ${stamp} · ` +
  `${corpus.length} brands · ${corpus.reduce((n, b) => n + b.ads.length, 0)} ads (already paid, zero new credits)\n\n` +
  `> "variants × days-running" = revealed-winner proxy. Pull dates reflect when comp last cached each page (May 2026).\n`;
const mdBrand = (b) => {
  const lines = [`\n---\n\n## ${b.brand}`, `\`page_id=${b.page_id}\` · ${b.totalActive} active ads cached · top ${b.ads.length} by revealed-winner`];
  b.ads.forEach((a, i) => {
    lines.push(`\n### ${i + 1}. [${a.mediaFormat}] · ${a.daysRunning ?? '?'}d (since ${a.launched})${a.active ? '' : ' · INACTIVE'} · variants=${a.variants} · CTA: ${a.cta} → ${a.linkDomain}`);
    if (a.title) lines.push(`**TITLE:** ${a.title}`);
    if (a.body) lines.push(`**BODY:** ${a.body}`);
    if (a.linkDescription) lines.push(`**DESC:** ${a.linkDescription}`);
  });
  return lines.join('\n');
};
writeFileSync(join(outDir, 'corpus.md'), header + corpus.map(mdBrand).join('\n'));
writeFileSync(join(outDir, 'corpus.json'), JSON.stringify({ slug: SLUG, source: 'harness-cache', ingested: stamp, brands: corpus }, null, 2));
console.log(`✓ ingested ${corpus.length} brands · ${corpus.reduce((n, b) => n + b.ads.length, 0)} ads (0 credits)`);
corpus.forEach((b) => console.log(`  - ${b.brand} (${b.totalActive} ads)`));
console.log(`  → ${join('docs/research/ad-library', SLUG)}/{corpus.md, corpus.json}`);
