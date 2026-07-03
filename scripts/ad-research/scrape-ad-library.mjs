#!/usr/bin/env node
/**
 * Reusable research step — scrape the Meta Ad Library for a set of brands and
 * write a clean, analysis-ready CORPUS of their live ad COPY.
 *
 * WHY this exists
 *   The Meta Ad Library has NO performance data for commercial ads (no spend /
 *   CTR / conversions). What it DOES expose is the real creative: ad copy,
 *   CTA, format, start date, and variant count. Two of those — variant count
 *   and days-running — are the "revealed-winner" proxy: an ad a brand keeps
 *   live and duplicates is one its budget endorses. So we can't mine
 *   conversion rates, but we CAN mine the HOOKS and FORMATS competitors are
 *   actually running, and weight them by what their spend endorses. That is a
 *   real research input for the format library + hook banks.
 *   (Mirrors the contract in cloudflare/eval/mini-eval/mcp/scrapecreators.ts —
 *    same endpoints, same revealed-winner ranking — but standalone so we can
 *    sweep new categories/markets without the agent loop.)
 *
 * WHAT it does (deterministic)
 *   1. Resolve each brand NAME → a Meta page. Pin `page_id` in the config to
 *      skip resolution and avoid the wrong-brand trap (a same-name TV show /
 *      influencer can outrank the real brand on likes). When not pinned, it
 *      scores candidates (down-ranks junk categories, rewards an IG handle)
 *      and WARNS you to verify.
 *   2. Fetch that page's ads (default: ACTIVE, the live field).
 *   3. Rank by revealed-winner (active, then most variants, then longest-run).
 *   4. Write corpus.md (read this to analyse), corpus.json (for any automated
 *      lens), and pages.md (the page-pick audit trail).
 *
 * The ANALYSIS is a separate, flexible step — point a lens (hook bank, format
 * census, offer teardown, bucket contrast, …) at the saved corpus. See README.
 *
 * Usage:
 *   node scripts/ad-research/scrape-ad-library.mjs [path/to/config.json]
 *   # default config: scripts/ad-research/config.json
 *
 * Cost: 1 ScrapeCreators credit per name-resolution + 1 per page of ads.
 *   Pinning page_ids skips resolution. Responses are cached to
 *   scripts/ad-research/.cache/ (gitignored) — re-runs are free.
 *
 * Reads SCRAPECREATORS_API_KEY from .env.local at the repo root (gitignored).
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const CACHE_DIR = join(SCRIPT_DIR, '.cache');
const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';

// Categories that signal a namesake, not the brand, when resolving by name.
const JUNK_CATEGORIES = [
  'tv show', 'musician/band', 'community', 'public figure', 'profile',
  'artist', 'mental health service', 'private investigator', 'movie',
  'tv channel', 'personal blog',
];

// ── key + config ────────────────────────────────────────────────────────────
function loadApiKey() {
  const envPath = join(REPO_ROOT, '.env.local');
  if (!existsSync(envPath)) { console.error(`Missing ${envPath}`); process.exit(1); }
  const m = readFileSync(envPath, 'utf8').match(/^SCRAPECREATORS_API_KEY\s*=\s*(.+)$/m);
  if (!m) { console.error('No SCRAPECREATORS_API_KEY in .env.local'); process.exit(1); }
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const configPath = resolve(process.argv[2] ?? join(SCRIPT_DIR, 'config.json'));
if (!existsSync(configPath)) {
  console.error(`Config not found: ${configPath}\nCopy config.example.json → config.json and edit it.`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
const COUNTRY = cfg.country ?? 'ALL';
const STATUS = cfg.status ?? 'ACTIVE';
const MAX_ADS = cfg.maxAds ?? 12;
const SLUG = cfg.slug ?? 'corpus';
const API_KEY = loadApiKey();

// ── http with disk cache (credit discipline) ─────────────────────────────────
let creditsRemaining = '?';
async function apiGet(endpoint, params, label) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const url = `${API_BASE}/${endpoint}?${qs}`;
  const cacheFile = join(CACHE_DIR, `${createHash('sha1').update(url).digest('hex')}.json`);
  if (existsSync(cacheFile)) {
    process.stderr.write(`  [cache] ${label}\n`);
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  }
  process.stderr.write(`  [live]  ${label}\n`);
  const r = await fetch(url, { headers: { 'x-api-key': API_KEY } });
  if (!r.ok) return { __error: `HTTP ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}` };
  const data = await r.json();
  if (data?.credits_remaining !== undefined) creditsRemaining = data.credits_remaining;
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(data));
  return data;
}

// ── shaping ───────────────────────────────────────────────────────────────-─
const clean = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
const daysBetween = (s, e) => (s ? Math.max(0, Math.round(((e ? e * 1000 : Date.now()) - s * 1000) / 86_400_000)) : null);
const isoDay = (u) => (u ? new Date(u * 1000).toISOString().slice(0, 10) : 'n/a');
const domainOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u ? String(u).slice(0, 40) : 'n/a'; } };

function shapeAd(a) {
  const s = a?.snapshot ?? {};
  return {
    archiveId: String(a?.ad_archive_id ?? 'n/a'),
    mediaFormat: String(s?.display_format ?? a?.media_type ?? 'n/a'),
    daysRunning: daysBetween(a?.start_date, a?.end_date),
    launched: isoDay(a?.start_date),
    variants: Number(a?.collation_count ?? 1),
    active: Boolean(a?.is_active),
    cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
    linkDomain: domainOf(s?.link_url),
    platforms: Array.isArray(a?.publisher_platform) ? a.publisher_platform : [],
    title: clean(s?.title),
    body: clean(s?.body?.text),
    linkDescription: clean(s?.link_description),
    firstImageUrl:
      (Array.isArray(s?.images) && (s.images[0]?.original_image_url || s.images[0]?.resized_image_url)) ||
      (Array.isArray(s?.videos) && s.videos[0]?.video_preview_image_url) || 'n/a',
  };
}

const rankRevealedWinners = (ads) => [...ads].sort((x, y) =>
  (x.active !== y.active ? (x.active ? -1 : 1) : 0) ||
  (y.variants - x.variants) ||
  ((y.daysRunning ?? 0) - (x.daysRunning ?? 0)));

// ── page resolution (when page_id not pinned) ────────────────────────────────
function scoreCandidate(c) {
  const cat = (c.category ?? '').toLowerCase();
  let score = Math.log10((Number(c.likes) || 0) + 1) * 10;
  if (c.ig_username) score += 15;
  if (JUNK_CATEGORIES.some((j) => cat.includes(j))) score -= 50;
  return score;
}

async function resolvePage(brand) {
  if (brand.page_id) return { page_id: brand.page_id, candidates: [], pinned: true };
  const found = await apiGet('search/companies', { query: brand.name }, `resolve "${brand.name}"`);
  if (found.__error) return { error: found.__error, candidates: [] };
  const candidates = (found.searchResults ?? []).slice(0, 8)
    .map((c) => ({ page_id: c.page_id, name: c.name, likes: c.likes ?? null, category: c.category ?? null, ig: c.ig_username ?? null, score: 0 }));
  candidates.forEach((c) => { c.score = scoreCandidate(c); });
  candidates.sort((a, b) => b.score - a.score);
  return { page_id: candidates[0]?.page_id, candidates, pinned: false };
}

// ── main ──────────────────────────────────────────────────────────────────-─
const outDir = join(REPO_ROOT, 'docs', 'research', 'ad-library', SLUG);
mkdirSync(outDir, { recursive: true });

const corpus = [];
const pageAudit = [];

for (const brand of cfg.brands) {
  process.stderr.write(`\n# [${brand.bucket}] ${brand.name}\n`);
  const res = await resolvePage(brand);
  if (res.error || !res.page_id) {
    pageAudit.push({ ...brand, resolved: null, note: res.error ?? 'no page found', candidates: res.candidates });
    process.stderr.write(`  ! could not resolve — ${res.error ?? 'no candidates'}\n`);
    continue;
  }
  if (!res.pinned) {
    process.stderr.write(`  ⚠ resolved by score — VERIFY (pin page_id in config to lock it):\n`);
    res.candidates.slice(0, 4).forEach((c) =>
      process.stderr.write(`     ${c === res.candidates[0] ? '→' : ' '} ${c.page_id} "${c.name}" likes=${c.likes} cat=${c.category} ig=${c.ig}\n`));
  }
  const ads = await apiGet('company/ads', { pageId: res.page_id, country: COUNTRY, status: STATUS }, `ads ${brand.name}`);
  if (ads.__error) { pageAudit.push({ ...brand, resolved: res.page_id, note: ads.__error }); continue; }
  const raw = ads.results ?? [];
  const pageName = raw[0]?.page_name ?? null;
  const shaped = rankRevealedWinners(raw.map(shapeAd)).slice(0, MAX_ADS);
  corpus.push({ brand: brand.name, bucket: brand.bucket, page_id: res.page_id, page_name: pageName, totalActive: raw.length, ads: shaped });
  pageAudit.push({ ...brand, resolved: res.page_id, page_name: pageName, pinned: res.pinned, totalActive: raw.length, candidates: res.candidates });
  process.stderr.write(`  ✓ ${raw.length} ads (showing top ${shaped.length})\n`);
}

// ── write artifacts ───────────────────────────────────────────────────────-─
const stamp = new Date().toISOString().slice(0, 10);
const header = `# Ad-Library Corpus — ${SLUG}\n\n` +
  `Market: ${COUNTRY} · Status: ${STATUS} · Pulled: ${stamp} · ` +
  `${corpus.length} brands · ${corpus.reduce((n, b) => n + b.ads.length, 0)} ads shown\n\n` +
  `> No performance data exists for commercial ads. "variants × days-running" is the **revealed-winner proxy** — what each brand's budget endorses, not a measured winner.\n`;

const mdBrand = (b) => {
  const lines = [`\n---\n\n## [${b.bucket}] ${b.brand}`,
    `\`page_id=${b.page_id}\`${b.page_name ? ` · page_name="${b.page_name}"` : ''} · ${b.totalActive} active ads · top ${b.ads.length} by revealed-winner`];
  b.ads.forEach((a, i) => {
    lines.push(`\n### ${i + 1}. [${a.mediaFormat}] · ${a.daysRunning ?? '?'}d (since ${a.launched})${a.active ? '' : ' · INACTIVE'} · variants=${a.variants} · CTA: ${a.cta} → ${a.linkDomain}`);
    if (a.title) lines.push(`**TITLE:** ${a.title}`);
    if (a.body) lines.push(`**BODY:** ${a.body}`);
    if (a.linkDescription) lines.push(`**DESC:** ${a.linkDescription}`);
  });
  return lines.join('\n');
};

writeFileSync(join(outDir, 'corpus.md'), header + corpus.map(mdBrand).join('\n'));
writeFileSync(join(outDir, 'corpus.json'), JSON.stringify({ slug: SLUG, country: COUNTRY, status: STATUS, pulled: stamp, brands: corpus }, null, 2));
writeFileSync(join(outDir, 'pages.md'),
  `# Page-pick audit — ${SLUG}\n\nVerify each resolved page is the real brand (not a namesake). Pin page_id in config to lock.\n\n` +
  pageAudit.map((p) => {
    const head = `## [${p.bucket}] ${p.name}\nresolved: \`${p.resolved ?? 'NONE'}\`${p.page_name ? ` "${p.page_name}"` : ''}${p.pinned ? ' (pinned)' : ''}${p.note ? ` — ${p.note}` : ''}`;
    const cands = (p.candidates ?? []).length
      ? '\ncandidates:\n' + p.candidates.map((c) => `  - ${c.page_id} "${c.name}" likes=${c.likes} cat=${c.category} ig=${c.ig} (score ${c.score?.toFixed?.(0)})`).join('\n')
      : '';
    return head + cands;
  }).join('\n\n'));

console.log(`\n✓ ${corpus.length} brands · ${corpus.reduce((n, b) => n + b.ads.length, 0)} ads`);
console.log(`  credits_remaining=${creditsRemaining}`);
console.log(`  → ${join('docs/research/ad-library', SLUG)}/{corpus.md, corpus.json, pages.md}`);
