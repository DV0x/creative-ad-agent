/**
 * ScrapeCreators MCP wrapper — exposes Meta (Facebook/Instagram) Ad Library
 * retrieval as two BATCHED tools the comp apprentice calls from inside its
 * query() loop. This is how the comp scan reads what rivals are ACTUALLY
 * running — real creatives, copy, CTAs, start dates, variant counts — rather
 * than a hedged guess from trend articles.
 *
 * ── Why two tools, not one ─────────────────────────────────────────────────
 * The Ad Library has no usable free-text "brand → ads" lookup: a generic name
 * ("Noise") resolves to nothing or the wrong page. The real flow the API
 * forces (confirmed empirically) is:
 *   1. search/companies?query=<name>  → candidate PAGES (page_id, likes, ig,
 *      category, verification). The apprentice picks the RIGHT one — this is
 *      also our defence against the wrong-brand failure mode (a generic name
 *      must not silently resolve to a namesake page with 1 like).
 *   2. company/ads?pageId=<id>        → that page's ads.
 * So tool 1 = competitor_find_pages (resolve), tool 2 = competitor_ads (fetch).
 * Keeping them separate keeps the page-pick decision visible to the apprentice
 * instead of hiding a "best by likes" heuristic inside the wrapper.
 *
 * ── Revealed-winner ranking (no performance data exists) ───────────────────
 * Meta exposes NO spend / ROAS / CTR for commercial ads. We cannot know which
 * ad "wins" by results. But the brand's own behaviour is the proxy: an ad kept
 * live a long time, duplicated into many variants, is one its budget endorses.
 * competitor_ads pre-ranks each page's ads by (is_active, collation_count desc,
 * days_running desc) and returns the top N — the revealed winners — so the
 * apprentice reads what rivals are betting on, not the untested long tail.
 *
 * ── Credit discipline ──────────────────────────────────────────────────────
 * 1 request = 1 credit. The mini-eval re-runs the same fixtures dozens of times
 * while the binder is tuned, so every response is cached to disk
 * (eval/mini-eval/.cache/scrapecreators/, gitignored). A repeated lookup for
 * the same page/query is served from disk for free; delete the folder to force
 * fresh data. credits_remaining is logged on every live call so spend is
 * visible. Production will swap this disk cache for D1 — the tool surface is
 * portable; no harness-specific concerns are embedded.
 *
 * Lives in eval/mini-eval/mcp/ today; moves to cloudflare/src/lib/mcp/ at the
 * Phase-1 Step-2b orchestrator rewrite alongside perplexity.ts.
 *
 * ── Reading list before modifying ──────────────────────────────────────────
 *  - agent/.claude/skills/comp/SKILL.md — "How to read the ad library"
 *  - cloudflare/eval/mini-eval/mcp/perplexity.ts — sibling wrapper, same shape
 *  - docs/eval-corpus/implementation-plan.md §4.2 — the competitor-ads tool
 *  - https://docs.scrapecreators.com/v1/facebook/ad-library
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM has no __dirname; derive it so CACHE_DIR resolves to agent-loop/.cache/…
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';
const MAX_ITEMS_PER_BATCH = 8;   // apprentice-facing cap (queries or pages)
const DEFAULT_CANDIDATES = 6;    // page candidates returned per name lookup
const DEFAULT_MAX_ADS = 12;      // revealed-winner ads returned per page

// Disk cache — eval-scoped, gitignored. Resolved relative to this module so it
// is independent of the harness's cwd.
const CACHE_DIR = path.resolve(__dirname, '..', '.cache', 'scrapecreators');

// Ad-payload responses carry SIGNED fbcdn media URLs that expire within days —
// a cache hit past that window serves dumps whose images all 403 (the dump looks
// fine; the pixel tier silently starves). So ad-bearing endpoints get a TTL;
// search/companies carries no media URLs and stays unbounded.
const AD_CACHE_TTL_HOURS = Number(process.env.SCRAPECREATORS_CACHE_TTL_HOURS || 48);

// ── Diagnostics — mirrors perplexity.ts so runs read the same way ──────────
const TOOL_INIT_MS = Date.now();
let callCounter = 0;
const tRel = (ms: number) => ((ms - TOOL_INIT_MS) / 1000).toFixed(1);

// ── Disk cache helpers ─────────────────────────────────────────────────────
function cacheKey(parts: Record<string, string | number | undefined>): string {
  const norm = Object.entries(parts)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${String(v).toLowerCase().trim()}`)
    .sort()
    .join('&');
  // Filename-safe slug; collisions are not a concern at this scale.
  return norm.replace(/[^a-z0-9=&._-]+/gi, '_').slice(0, 180);
}

function cacheRead(key: string, maxAgeHours?: number): unknown | null {
  const f = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(f)) return null;
  if (maxAgeHours !== undefined) {
    try {
      if (Date.now() - fs.statSync(f).mtimeMs > maxAgeHours * 3_600_000) return null; // stale — refetch live
    } catch { return null; }
  }
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
}

function cacheWrite(key: string, data: unknown): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data), 'utf8');
}

// ── One GET — cache-first, logs cache hits and live-call credits ───────────
async function apiGet(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  label: string,
  ttlHours?: number,
): Promise<{ ok: true; data: any; cached: boolean } | { ok: false; error: string }> {
  const key = cacheKey({ ep: endpoint, ...params });
  const hit = cacheRead(key, ttlHours);
  const callNum = ++callCounter;
  if (hit !== null) {
    process.stderr.write(`[scrapecreators] #${callNum} CACHE-HIT t=${tRel(Date.now())}s ${label}\n`);
    return { ok: true, data: hit, cached: true };
  }

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) return { ok: false, error: 'SCRAPECREATORS_API_KEY is not set in the environment.' };

  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  const url = `${API_BASE}/${endpoint}?${qs}`;

  const tStart = Date.now();
  process.stderr.write(`[scrapecreators] #${callNum} start t=${tRel(tStart)}s ${label}\n`);
  let resp: Response;
  try {
    resp = await fetch(url, { headers: { 'x-api-key': apiKey } });
  } catch (err) {
    return { ok: false, error: `Network failure: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '(no body)');
    return { ok: false, error: `HTTP ${resp.status}: ${body.slice(0, 300)}` };
  }
  let data: any;
  try { data = await resp.json(); } catch (err) {
    return { ok: false, error: `JSON parse failure: ${err instanceof Error ? err.message : String(err)}` };
  }
  const dur = ((Date.now() - tStart) / 1000).toFixed(1);
  process.stderr.write(`[scrapecreators] #${callNum} end   t=${tRel(Date.now())}s dur=${dur}s credits_remaining=${data?.credits_remaining ?? '?'} ${label}\n`);
  cacheWrite(key, data);
  return { ok: true, data, cached: false };
}

// ── Shaping helpers ────────────────────────────────────────────────────────
function daysBetween(startUnix?: number, endUnix?: number): number | null {
  if (!startUnix) return null;
  const end = endUnix ? endUnix * 1000 : Date.now();
  return Math.max(0, Math.round((end - startUnix * 1000) / 86_400_000));
}
function isoDay(unix?: number): string {
  if (!unix) return 'n/a';
  return new Date(unix * 1000).toISOString().slice(0, 10);
}
function domainOf(url?: string): string {
  if (!url) return 'n/a';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.slice(0, 40); }
}

// ── Job classification (ad-data v2) ─────────────────────────────────────────
// The Ad Library exposes no campaign objective, and longevity endorses survival
// at ANY job — a store-opening ad that ran 390 days is a triumph of local
// awareness, not a conversion construction (the BigMuscles pollution: its only
// pixel reads were store-opening ads whose hooks entered the hook bank). We
// classify each ad's JOB from what IS visible — CTA type, link domain, copy
// shape, format — so downstream seats can weight conversion-job ads and treat
// the rest as context. A heuristic, deterministic and conservative: when no
// non-conversion signal fires, the ad is 'conversion' (the default job of a
// commercial ad). The binder treats the label as a strong hint, not a verdict.
export type AdJob = 'conversion' | 'retargeting' | 'local' | 'awareness' | 'recruitment';

const LOCAL_COPY_RE = /\bnow open\b|\bgrand opening\b|\bnew store\b|\bstore (?:launch|opening)\b|\bvisit (?:our|the) (?:new )?store\b/i;
const RECRUIT_COPY_RE = /\bwe(?:'|’)?re hiring\b|\bjoin our team\b|\bnow hiring\b|\bjob opening\b/i;
const DCO_TEMPLATE_RE = /\{\{[^}]+\}\}/; // catalog boilerplate: "{{product.name}}"

/** Exported for direct testing. Takes a RAW ad (API shape, not a dump entry). */
export function classifyJob(a: any): AdJob {
  const s = a?.snapshot ?? {};
  const ctaType = String(s?.cta_type ?? '').toUpperCase();
  const format = String(s?.display_format ?? a?.media_type ?? '').toUpperCase();
  const link = domainOf(s?.link_url).toLowerCase();
  const copy = `${s?.title ?? ''} ${s?.body?.text ?? ''}`;
  // Local: maps CTAs, maps shortlinks, store-opening copy.
  if (ctaType === 'GET_DIRECTIONS' || ctaType === 'CALL_NOW') return 'local';
  if (link === 'g.co' || link === 'goo.gl' || link === 'maps.app.goo.gl' || link.startsWith('maps.google')) return 'local';
  if (LOCAL_COPY_RE.test(copy)) return 'local';
  // Recruitment: hiring copy or a careers destination.
  if (RECRUIT_COPY_RE.test(copy) || /(^|\.)careers\./.test(link) || link.includes('linkedin.com')) return 'recruitment';
  // Retargeting/catalog: DPA format or unrendered catalog placeholders.
  if (format === 'DPA' || DCO_TEMPLATE_RE.test(copy)) return 'retargeting';
  // Awareness: page-like / profile-visit plays — no purchase destination.
  if (format === 'PAGE_LIKE' || ctaType === 'LIKE_PAGE' || ctaType === 'VIEW_INSTAGRAM_PROFILE') return 'awareness';
  // Boosted posts (S152, the TheRateFinder field): an fb.me destination is
  // Facebook's own permalink shortener — the click lands on a POST, not a funnel
  // (even under a conversion-looking CTA button). And no CTA + no destination is
  // an ad that cannot convert by construction. Both run for months on unmanaged
  // inertia, which the days×variants ranking otherwise reads as endorsement —
  // 21/30 client ads rode exactly that.
  if (link === 'fb.me' || link.endsWith('.fb.me')) return 'awareness';
  if (!ctaType && (link === 'n/a' || !link)) return 'awareness';
  return 'conversion';
}

// ── Launch-cadence brand calibration (ad-data v2) ───────────────────────────
// Endorsement (days × variants) only means something against the brand's own
// testing posture. A brand that launched everything last week (launch flush —
// the Avvatar trap) has NOTHING endorsed yet; a brand with no fresh launch in
// months is coasting, and its long-runners may be unmanaged rather than proven.
// Computed at dump time from the launch dates of the fetched ads; the label
// travels with every page result so the scout carries it into the shortlist.
export interface LaunchCadence {
  label: 'ACTIVE-TESTER' | 'LAUNCH-FLUSH' | 'ZOMBIE' | 'STEADY' | 'UNKNOWN' | 'WINDOW-TRUNCATED';
  newestDays: number | null;
  buckets: { d0_30: number; d31_90: number; d91_180: number; d180_plus: number };
  note: string;
}

/** Exported for direct testing. Takes dump-shaped entries ({ daysRunning, active }).
 *  `truncated` = a result cursor remains (page 1 of 2+): the API returns newest-first,
 *  so a partial window hides exactly the old ads cadence needs — a steady 20-year
 *  advertiser reads as LAUNCH-FLUSH off its newest page (S152: the True North miss
 *  that made a client's own boosted posts look like the field's only winners).
 *  A truncated window therefore refuses to emit a cadence at all. */
export function launchCadence(entries: Array<{ daysRunning: number | null; active: boolean }>, truncated = false): LaunchCadence {
  const ages = entries.filter((e) => e.active && e.daysRunning != null).map((e) => e.daysRunning as number);
  const buckets = { d0_30: 0, d31_90: 0, d91_180: 0, d180_plus: 0 };
  if (ages.length === 0) return { label: 'UNKNOWN', newestDays: null, buckets, note: 'no active ads with launch dates' };
  for (const d of ages) {
    if (d <= 30) buckets.d0_30++;
    else if (d <= 90) buckets.d31_90++;
    else if (d <= 180) buckets.d91_180++;
    else buckets.d180_plus++;
  }
  const newestDays = Math.min(...ages);
  if (truncated) {
    const oldestVisible = Math.max(...ages);
    return {
      label: 'WINDOW-TRUNCATED', newestDays, buckets,
      note: `first result page only — oldest VISIBLE ad ${oldestVisible}d, but older ads exist beyond the cursor. Cadence and endorsement are UNREADABLE from a partial window; re-call with depth=2 before treating either as real`,
    };
  }
  const proven = buckets.d91_180 + buckets.d180_plus;
  if (buckets.d0_30 / ages.length >= 0.7 && newestDays <= 30)
    return { label: 'LAUNCH-FLUSH', newestDays, buckets, note: 'nearly everything launched inside 30d — survival untested, endorsement signal ≈ zero' };
  if (newestDays >= 120)
    return { label: 'ZOMBIE', newestDays, buckets, note: `no new creative in ${newestDays}d — long-runners may be unmanaged, not proven` };
  if (buckets.d0_30 + buckets.d31_90 >= 1 && proven >= 1)
    return { label: 'ACTIVE-TESTER', newestDays, buckets, note: 'fresh tests running alongside proven survivors — endorsement here is meaningful' };
  return { label: 'STEADY', newestDays, buckets, note: 'launches present but no long-proven survivors yet — read endorsement with care' };
}

function cadenceLine(c: LaunchCadence): string {
  const b = c.buckets;
  return `LAUNCH CADENCE: newest ${c.newestDays ?? '?'}d | launched ≤30d: ${b.d0_30}, 31–90d: ${b.d31_90}, 91–180d: ${b.d91_180}, >180d: ${b.d180_plus} → ${c.label} (${c.note})`;
}

// last_days=N → server-side start_date of N days ago (YYYY-MM-DD). The primary
// recency read is 90d (decided S146): 30d scoops up tests before they die; 90d
// is current fashion with survivorship already applied.
function startDateFor(lastDays?: number): string | undefined {
  if (!lastDays) return undefined;
  return new Date(Date.now() - lastDays * 86_400_000).toISOString().slice(0, 10);
}

interface ShapedAd {
  archiveId: string;
  daysRunning: number | null;
  launched: string;
  variants: number;     // collation_count
  active: boolean;
  job: AdJob;           // conversion | retargeting | local | awareness | recruitment
  format: string;       // VIDEO / IMAGE / DCO / ...
  nImages: number;
  nVideos: number;
  platforms: string[];
  cta: string;
  linkDomain: string;
  body: string;
  firstImage: string;   // kept for a future multimodal style pass
}

function shapeAd(a: any): ShapedAd {
  const s = a?.snapshot ?? {};
  const body = (s?.body?.text ?? '').replace(/\s+/g, ' ').trim();
  return {
    archiveId: String(a?.ad_archive_id ?? 'n/a'),
    daysRunning: daysBetween(a?.start_date, a?.end_date),
    launched: isoDay(a?.start_date),
    variants: Number(a?.collation_count ?? 1),
    active: Boolean(a?.is_active),
    job: classifyJob(a),
    format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
    nImages: Array.isArray(s?.images) ? s.images.length : 0,
    nVideos: Array.isArray(s?.videos) ? s.videos.length : 0,
    platforms: Array.isArray(a?.publisher_platform) ? a.publisher_platform : [],
    cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
    linkDomain: domainOf(s?.link_url),
    // Context view only (the dump keeps FULL text) — 120 chars is enough for a
    // triage read; the scout Greps the dump for anything deeper (S151 scout diet).
    body: body.length > 120 ? body.slice(0, 120) + '…' : body,
    firstImage:
      (Array.isArray(s?.images) && s.images[0]?.original_image_url) ||
      (Array.isArray(s?.images) && s.images[0]?.resized_image_url) ||
      (Array.isArray(s?.videos) && s.videos[0]?.video_preview_image_url) ||
      'n/a',
  };
}

// Revealed-winner ranking: active first, conversion-job first (a store-opening
// ad's longevity endorses a different job — it must not outrank the sales ads),
// then most-duplicated, then longest-running. The brand's budget is voting;
// this surfaces its vote on the job we're actually here to read.
function rankRevealedWinners(ads: ShapedAd[]): ShapedAd[] {
  return [...ads].sort((x, y) => {
    if (x.active !== y.active) return x.active ? -1 : 1;
    if ((x.job === 'conversion') !== (y.job === 'conversion')) return x.job === 'conversion' ? -1 : 1;
    if (y.variants !== x.variants) return y.variants - x.variants;
    return (y.daysRunning ?? 0) - (x.daysRunning ?? 0);
  });
}

// ── Creative-URL extraction (handles IMAGE, DCO, CAROUSEL, DPA) ─────────────
// The category's dominant format on Meta India is DCO (dynamic creative), whose
// STATIC creatives live in snapshot.cards[], NOT snapshot.images[] (which is
// empty for DCO). A card with an image url and no video url is a real static
// creative worth reading; a card with a video url is a video whose image is
// only a poster frame. IMAGE-format ads use snapshot.images[]. We collect from
// both so the pixel-read tier sees the whole endorsed field, not just the
// shrinking slice of brands still running old-style single-image ads.
const imgUrlOf = (o: any): string | undefined => o?.original_image_url ?? o?.resized_image_url ?? undefined;
const cardIsVideo = (c: any): boolean => Boolean(c?.video_hd_url || c?.video_sd_url || c?.video_preview_image_url && !imgUrlOf(c));

function collectImageUrls(s: any): string[] {
  const urls: string[] = [];
  if (Array.isArray(s?.images)) for (const i of s.images) { const u = imgUrlOf(i); if (u) urls.push(u); }
  // static cards only (a video card's original_image_url is just its poster frame)
  if (Array.isArray(s?.cards)) for (const c of s.cards) { if (!cardIsVideo(c)) { const u = imgUrlOf(c); if (u) urls.push(u); } }
  return [...new Set(urls)];
}
function collectVideoPreviewUrls(s: any): string[] {
  const urls: string[] = [];
  if (Array.isArray(s?.videos)) for (const v of s.videos) if (v?.video_preview_image_url) urls.push(v.video_preview_image_url);
  if (Array.isArray(s?.cards)) for (const c of s.cards) if (cardIsVideo(c) && c?.video_preview_image_url) urls.push(c.video_preview_image_url);
  return [...new Set(urls)];
}

// ── Raw-tier dump ──────────────────────────────────────────────────────────
// The tool result truncates ad copy for context discipline; the RAW dump keeps
// the FULL body text + all media URLs on disk, one JSONL line per ad, so the
// creative stage can Grep the whole field (claim prevalence, full hooks)
// without stuffing its context. Written per page as <slug>.jsonl.
/** Exported for direct testing (ad-data v2 classification runs through it). */
export function rawAdEntry(a: any, brand: string, pageId: string): Record<string, unknown> {
  const s = a?.snapshot ?? {};
  return {
    brand,
    pageId,
    archiveId: String(a?.ad_archive_id ?? 'n/a'),
    active: Boolean(a?.is_active),
    launched: isoDay(a?.start_date),
    daysRunning: daysBetween(a?.start_date, a?.end_date),
    variants: Number(a?.collation_count ?? 1),
    job: classifyJob(a),
    format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
    platforms: Array.isArray(a?.publisher_platform) ? a.publisher_platform : [],
    cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
    linkDomain: domainOf(s?.link_url),
    title: (s?.title ?? '').toString().trim() || null,
    body: (s?.body?.text ?? '').replace(/\s+/g, ' ').trim(), // FULL text, untruncated
    imageUrls: collectImageUrls(s),           // IMAGE ads + DCO/CAROUSEL static cards
    videoPreviewUrls: collectVideoPreviewUrls(s),
    // Opportunistic delivery fields — null for most commercial ads; Meta exposes
    // them for political and EU-shown ads. Captured when present (free upgrade
    // from the days×variants proxy to real delivery numbers). undefined = dropped
    // by JSON.stringify, so ordinary dumps stay lean.
    pageLikes: s?.page_like_count ?? undefined,
    reachEstimate: a?.reach_estimate ?? undefined,
    spend: a?.spend ?? undefined,
    impressionsText: a?.impressions_with_index?.impressions_text ?? undefined,
  };
}

// suffix keeps re-fetch variants from clobbering the primary dump: the default
// ACTIVE all-time fetch writes <slug>.jsonl; a churn fetch (status ALL/INACTIVE)
// or a windowed fetch (last_days) writes its own file beside it.
function dumpRawAds(rawAdsDir: string, label: string, pageId: string, raw: any[], suffix = ''): string | null {
  try {
    fs.mkdirSync(rawAdsDir, { recursive: true });
    const slug = brandSlug(label, pageId);
    const file = path.join(rawAdsDir, `${slug}${suffix}.jsonl`);
    const lines = raw.map((a) => JSON.stringify(rawAdEntry(a, label || pageId, pageId)));
    fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
    return file;
  } catch (err) {
    process.stderr.write(`[scrapecreators] raw dump failed: ${err instanceof Error ? err.message : String(err)}\n`);
    return null;
  }
}

function brandSlug(label: string, pageId: string): string {
  return (label || pageId).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || pageId;
}

// ── Image-creative download (the field stage's pixel tier) ─────────────────
// TWO-PHASE since 0.6.0 (S151 scout diet): page/hunt fetches capture image URLs
// in the dump but download NOTHING. The scout picks its shortlist from metadata
// + copy, then calls download_creatives for exactly the shortlisted ads — so we
// download the ~15-20 creatives the readers will actually view, not the whole
// field (the HK run downloaded 159, read ~20). ≤2 images per ad (a DCO ad's
// cards share one layout; only the product/flavour swaps), skipping tiny files
// (tracking pixels / thumbs). downloadHuntImages remains as the AUTO path for
// bank seeding only (seed-bank.ts reads hunt images immediately, no shortlist).
const IMG_ADS_PER_BRAND = 12;
const IMGS_PER_AD = 2;
const MIN_IMG_BYTES = 5000;

// ── Format hunts — keyword-fingerprint search across ALL advertisers ────────
// A format family (testimonial static, math-anchor offer card, founder-POV…)
// leaves textual fingerprints in ad copy ("verified buyer", "do the math",
// "so we made"). search/ads searches the WHOLE ad library by keyword, so a
// hunt finds who is running a format RIGHT NOW without knowing brand names —
// the discovery path for white-space format lanes and for seeding the format
// bank. Results arrive server-ranked by impressions (the numbers themselves
// are hidden for commercial ads; the ORDER still encodes delivery), so hunt
// dumps preserve API order instead of re-ranking by days×variants.

const HUNT_DEFAULTS = {
  search_type: 'keyword_exact_phrase',
  media_type: 'IMAGE_AND_MEME', // statics only ("MEME" = Meta's name for text-on-image)
  status: 'ACTIVE',
  sort_by: 'total_impressions',
} as const;

// Hunt images land in ONE dir per hunt (not per brand), page-slug-prefixed so
// the pixel reader knows each creative's advertiser: <brand>__<adId>_<n>.jpg
async function downloadHuntImages(
  imagesRoot: string,
  huntSlug: string,
  entries: any[],
): Promise<{ dir: string; adsWithImages: number; downloaded: number; failed: number } | null> {
  try {
    const withImages = entries.filter((e) => Array.isArray(e.imageUrls) && e.imageUrls.length > 0);
    if (withImages.length === 0) return null;
    const dir = path.join(imagesRoot, `hunt-${huntSlug}`);
    fs.mkdirSync(dir, { recursive: true });
    let downloaded = 0;
    let failed = 0;
    for (const ad of withImages.slice(0, IMG_ADS_PER_BRAND)) {
      const prefix = brandSlug(String(ad.brand ?? ''), String(ad.pageId ?? ''));
      for (let i = 0; i < Math.min(ad.imageUrls.length, IMGS_PER_AD); i++) {
        try {
          const r = await fetch(ad.imageUrls[i]);
          if (!r.ok) { failed++; continue; }
          const buf = Buffer.from(await r.arrayBuffer());
          if (buf.length < MIN_IMG_BYTES) continue; // tracking pixel / tiny thumb
          fs.writeFileSync(path.join(dir, `${prefix}__${ad.archiveId}_${i}.jpg`), buf);
          downloaded++;
        } catch { failed++; }
      }
    }
    return { dir, adsWithImages: withImages.length, downloaded, failed };
  } catch (err) {
    process.stderr.write(`[scrapecreators] hunt image download failed: ${err instanceof Error ? err.message : String(err)}\n`);
    return null;
  }
}

// ── download_creatives — phase two of the two-phase fetch ──────────────────
export interface DownloadRequest { dump_file: string; ad_ids: string[] }

/** Exported for direct testing; the download_creatives tool is a thin wrapper.
 *  Reads each requested ad's imageUrls from the raw dump ON DISK (no API call,
 *  no credits) and downloads them: brand dumps → raw/images/<brand>/<adId>_<n>.jpg,
 *  hunt dumps → raw/images/hunt-<slug>/<brand>__<adId>_<n>.jpg — the same naming
 *  the auto-download era used, so readers and downstream Globs are unchanged. */
export async function downloadCreativesForAds(
  requests: DownloadRequest[],
  imagesRoot?: string,
  rawAdsDir?: string,
): Promise<string> {
  if (!imagesRoot) return 'download_creatives is unavailable: this server was built without an images directory.';
  const blocks: string[] = [];
  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    const idx = i + 1;
    let file = req.dump_file;
    if (!fs.existsSync(file) && rawAdsDir) {
      const alt = path.join(rawAdsDir, path.basename(file));
      if (fs.existsSync(alt)) file = alt;
    }
    if (!fs.existsSync(file)) {
      blocks.push(`[${idx}] ${req.dump_file}: DUMP NOT FOUND — pass the raw dump path exactly as the fetch/hunt result named it.`);
      continue;
    }
    const base = path.basename(file).replace(/\.jsonl$/, '');
    const isHunt = base.startsWith('hunt-');
    const byId = new Map<string, any>();
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try { const e = JSON.parse(line); byId.set(String(e.archiveId), e); } catch { /* skip bad line */ }
    }
    const found: any[] = [];
    const missing: string[] = [];
    for (const id of req.ad_ids) {
      const e = byId.get(String(id));
      if (e) found.push(e); else missing.push(id);
    }
    let downloaded = 0;
    let failed = 0;
    let videoOnly = 0;
    const dirs = new Set<string>();
    const CHUNK = 6; // modest concurrency — fast without hammering the CDN
    for (let c = 0; c < found.length; c += CHUNK) {
      await Promise.allSettled(found.slice(c, c + CHUNK).map(async (e) => {
        const urls: string[] = Array.isArray(e.imageUrls) ? e.imageUrls : [];
        if (urls.length === 0) { videoOnly++; return; }
        const dir = path.join(imagesRoot, isHunt ? base : brandSlug(String(e.brand ?? ''), String(e.pageId ?? '')));
        fs.mkdirSync(dir, { recursive: true });
        dirs.add(dir);
        for (let n = 0; n < Math.min(urls.length, IMGS_PER_AD); n++) {
          try {
            const r = await fetch(urls[n]);
            if (!r.ok) { failed++; continue; }
            const buf = Buffer.from(await r.arrayBuffer());
            if (buf.length < MIN_IMG_BYTES) continue; // tracking pixel / tiny thumb
            const name = isHunt
              ? `${brandSlug(String(e.brand ?? ''), String(e.pageId ?? ''))}__${e.archiveId}_${n}.jpg`
              : `${e.archiveId}_${n}.jpg`;
            fs.writeFileSync(path.join(dir, name), buf);
            downloaded++;
          } catch { failed++; }
        }
      }));
    }
    blocks.push([
      `[${idx}] ${base}: ${downloaded} image(s) downloaded for ${found.length - videoOnly} image-bearing ad(s) → ${[...dirs].join(', ') || '(nothing to download)'}`,
      videoOnly ? `    ${videoOnly} requested ad(s) carry no static image URLs (video/DCO poster only) — their copy is in the dump; pixels out of scope.` : '',
      failed ? `    ${failed} URL(s) FAILED — signed CDN links expire ~48h after the original scrape; refetch the page if the dump is old.` : '',
      missing.length ? `    NOT IN DUMP: ${missing.join(', ')} — check the archiveIds against the dump lines.` : '',
    ].filter(Boolean).join('\n'));
  }
  return blocks.join('\n\n');
}

export interface FormatHunt {
  query: string;
  label?: string;
  country?: string;
  search_type?: 'keyword_exact_phrase' | 'keyword_unordered';
  media_type?: 'ALL' | 'IMAGE' | 'MEME' | 'IMAGE_AND_MEME';
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  last_days?: number;
  max_ads?: number;
  depth?: number;
}

/** Exported for direct testing; the format_hunt tool is a thin wrapper. */
export async function runFormatHunts(hunts: FormatHunt[], rawAdsDir?: string, imagesRoot?: string): Promise<string> {
  const blocks: string[] = [];
  for (let i = 0; i < hunts.length; i++) {
    const h = hunts[i];
    const slug = brandSlug(h.label ?? h.query, `hunt${i + 1}`);
    const head = `[${i + 1}] HUNT: "${h.query}" (${h.country ?? 'ALL'} / ${h.status ?? HUNT_DEFAULTS.status} / ${h.media_type ?? HUNT_DEFAULTS.media_type})`;
    const all: any[] = [];
    let cursor: string | undefined;
    let allCached = true;
    let fetchError: string | null = null;
    const depth = Math.min(h.depth ?? 1, 3);
    for (let pg = 0; pg < depth; pg++) {
      const r = await apiGet('search/ads', {
        query: h.query,
        search_type: h.search_type ?? HUNT_DEFAULTS.search_type,
        media_type: h.media_type ?? HUNT_DEFAULTS.media_type,
        status: h.status ?? HUNT_DEFAULTS.status,
        sort_by: HUNT_DEFAULTS.sort_by,
        country: h.country,
        start_date: startDateFor(h.last_days),
        cursor,
      }, `hunt "${h.query}" pg${pg + 1}`, AD_CACHE_TTL_HOURS);
      if (!r.ok) { fetchError = r.error; break; }
      allCached = allCached && r.cached;
      const ads = (r.data?.searchResults ?? []) as any[];
      all.push(...ads);
      cursor = r.data?.cursor ?? undefined;
      if (!cursor || ads.length === 0) break;
    }
    if (fetchError && all.length === 0) { blocks.push(`${head}\n    ERROR: ${fetchError}`); continue; }
    if (all.length === 0) {
      blocks.push(`${head}\n    NO ADS FOUND for this fingerprint. Try keyword_unordered, a different phrase, or country=ALL — or the format genuinely is not running, which is itself a finding.`);
      continue;
    }
    // Search results carry page identity PER AD — each entry keeps its own advertiser.
    const entries = all.map((a) => rawAdEntry(a, String(a?.page_name ?? 'unknown'), String(a?.page_id ?? 'n/a')));
    let dumpFile: string | null = null;
    if (rawAdsDir) {
      try {
        fs.mkdirSync(rawAdsDir, { recursive: true });
        dumpFile = path.join(rawAdsDir, `hunt-${slug}.jsonl`);
        fs.writeFileSync(dumpFile, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
      } catch (err) {
        process.stderr.write(`[scrapecreators] hunt dump failed: ${err instanceof Error ? err.message : String(err)}\n`);
        dumpFile = null;
      }
    }
    // imagesRoot present = the AUTO-download path (bank seeding via seed-bank.ts,
    // which reads hunt images immediately). The pipeline's format_hunt tool omits
    // it — the scout downloads shortlisted hunt ads via download_creatives instead.
    const images = imagesRoot ? await downloadHuntImages(imagesRoot, slug, entries) : null;
    // Advertiser roll-up — who is running this format, how hard.
    const byPage = new Map<string, { pageId: string; n: number; likes: number | null }>();
    for (const e of entries as any[]) {
      const cur = byPage.get(e.brand) ?? { pageId: e.pageId, n: 0, likes: (e.pageLikes as number | undefined) ?? null };
      cur.n++;
      byPage.set(e.brand, cur);
    }
    const rollup = [...byPage.entries()]
      .sort((x, y) => y[1].n - x[1].n)
      .slice(0, 15)
      .map(([name, v]) => `      ${name} (page_id=${v.pageId}${v.likes != null ? `, likes=${v.likes}` : ''}) × ${v.n} ad(s)`);
    const max = h.max_ads ?? DEFAULT_MAX_ADS;
    const shown = (entries as any[]).slice(0, max).map((e, n) =>
      `      ${n + 1}. ${e.brand} [${e.format}] ${e.daysRunning ?? '?'}d × ${e.variants}v | imgs=${e.imageUrls.length} | ${String(e.body).slice(0, 140) || '(no body text)'}`);
    blocks.push([
      `${head}${allCached ? ' (cached)' : ''} — ${all.length} ad(s) found${cursor ? '; MORE available (raise depth)' : ''}${fetchError ? `; page fetch stopped early: ${fetchError}` : ''}`,
      dumpFile ? `    RAW DUMP (full copy + media URLs, one line per ad, per-ad advertiser identity): ${dumpFile}` : '',
      images
        ? `    IMAGE CREATIVES: ${images.downloaded} downloaded (${images.adsWithImages} image-bearing ads${images.failed ? `; ${images.failed} URL(s) FAILED — signed CDN links expire, likely a stale payload` : ''}) → ${images.dir} (files: <brand>__<adId>_<n>.jpg)`
        : dumpFile
          ? `    Images NOT downloaded at fetch time — after the shortlist is picked, call download_creatives with this dump path + the shortlisted archiveIds.`
          : '',
      `    ADVERTISERS RUNNING THIS FINGERPRINT (${byPage.size}):`,
      ...rollup,
      `    TOP ADS (API order = impressions-ranked; numbers hidden for commercial ads):`,
      ...shown,
    ].filter(Boolean).join('\n'));
  }
  return blocks.join('\n\n');
}

// ── Tool 1 — resolve brand names to candidate pages ────────────────────────
const findPagesSchema = z.object({
  query: z.string().min(1).describe('Brand/advertiser name to resolve to a Facebook page, e.g. "DailyObjects". Generic names return many namesakes — read the candidates and pick by likes + category + ig_username, do not assume the first is right.'),
  max_results: z.number().int().min(1).max(15).optional().describe('Max candidate pages to return, default 6.'),
});

const competitorFindPages = tool(
  'competitor_find_pages',
  'Resolve rival brand NAMES to Meta Ad Library PAGES (the prerequisite for fetching their ads). Pass an ARRAY of brand names (1-8); each fires concurrently and returns candidate pages with page_id, name, category, likes, verification and Instagram handle. YOU choose the correct page_id from the candidates — match on likes (the real brand has far more), category and ig_username; reject namesakes. When a NAME lookup returns nothing or only namesakes, RETRY with the brand\'s DOMAIN as the query (e.g. "theratefinder.ca") — page records often match on domain when the display name does not. Then pass the chosen page_id(s) to competitor_ads. 1 credit per name (cached).',
  { queries: z.array(findPagesSchema).min(1).max(MAX_ITEMS_PER_BATCH).describe('Array of brand-name lookups to run in parallel (max 8).') },
  async (args) => {
    const settled = await Promise.allSettled(
      args.queries.map(async (q) => {
        const r = await apiGet('search/companies', { query: q.query }, `find "${q.query}"`);
        return { q, r };
      }),
    );
    const blocks = settled.map((s, i) => {
      const idx = i + 1;
      if (s.status !== 'fulfilled') return `[${idx}] QUERY: ${args.queries[i].query}\n    ERROR: ${String(s.reason)}`;
      const { q, r } = s.value;
      if (!r.ok) return `[${idx}] QUERY: ${q.query}\n    ERROR: ${r.error}`;
      const cands = (r.data?.searchResults ?? []).slice(0, q.max_results ?? DEFAULT_CANDIDATES);
      if (cands.length === 0) return `[${idx}] QUERY: ${q.query}\n    (no pages found — this brand may not advertise on Meta, or the name needs disambiguation)`;
      const lines = cands.map((c: any) =>
        `      page_id=${c.page_id} | "${c.name}" | likes=${c.likes ?? 'n/a'} | cat=${c.category ?? 'n/a'} | ig=${c.ig_username ?? 'n/a'} | ${c.verification ?? ''}`);
      return `[${idx}] QUERY: ${q.query}${r.cached ? ' (cached)' : ''}\n    CANDIDATE PAGES (pick the real brand by likes + category + ig):\n${lines.join('\n')}`;
    });
    return { content: [{ type: 'text' as const, text: blocks.join('\n\n') }] };
  },
);

// ── Tool 2 — fetch a page's revealed-winner ads ────────────────────────────
const adsPageSchema = z.object({
  page_id: z.string().min(1).describe('The page_id chosen from competitor_find_pages results.'),
  label: z.string().optional().describe('Optional human label (the brand name) echoed back so you can tell results apart.'),
  country: z.string().optional().describe('ISO country to scope ads to, e.g. "IN", "CA", "US". Default ALL. Use the brand\'s market.'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().describe('Ad status, default ACTIVE (what they are running NOW — the live field). ALL adds recently-retired ads (the churn read: recently-killed winners are negative signal).'),
  last_days: z.number().int().min(1).max(365).optional().describe('Server-side date window: only ads from the last N days. Use 90 for an explicit recency read on big pages; omit for the all-time read (the default).'),
  depth: z.number().int().min(1).max(3).optional().describe('Result pages to fetch via cursor for big advertisers, default 1. Each page ≈ 30 ads and costs 1 credit; the result says when MORE pages are available.'),
  max_ads: z.number().int().min(1).max(30).optional().describe('Max revealed-winner ads to return per page after ranking, default 12.'),
});

const makeCompetitorAds = (rawAdsDir?: string) => tool(
  'competitor_ads',
  'Fetch a rival page\'s ACTIVE Meta ads, pre-ranked by revealed-winner signal (active, then conversion-job, then most variants, then longest-running) and trimmed to the fields that matter for a triage read: ad copy, CTA, link domain, format (VIDEO/IMAGE), days running, variant count, platforms. Every ad also gets a JOB label (conversion/retargeting/local/awareness/recruitment — the Ad Library hides campaign objectives, so this is inferred from CTA type, link domain, and copy shape) and every page gets a LAUNCH CADENCE calibration (ACTIVE-TESTER / LAUNCH-FLUSH / ZOMBIE / STEADY; a truncated first page reports WINDOW-TRUNCATED instead — re-call with depth=2 before reading cadence or endorsement) — carry both into your shortlist; only conversion-job ads carry endorsement worth reading. Pass an ARRAY of pages (1-8, page_id from competitor_find_pages); each fires concurrently. There is NO performance data for commercial ads — days_running and variants are PROXIES for what a rival\'s budget endorses, not measured winners; treat them as such. Empty results mean the rival runs no active Meta ads (itself a signal — name it, and fall back to a Perplexity category-trend read). Every fetched ad is dumped in full (untruncated copy + image URLs) to a raw JSONL file on disk — the result names the path; cite it in your deliverable so downstream seats can Grep the field. Images are NOT downloaded at fetch time: after you pick the shortlist, call download_creatives with the dump path + shortlisted archiveIds (phase two). 1 credit per page (cached).',
  { pages: z.array(adsPageSchema).min(1).max(MAX_ITEMS_PER_BATCH).describe('Array of pages to fetch in parallel (max 8).') },
  async (args) => {
    const settled = await Promise.allSettled(
      args.pages.map(async (p) => {
        // Cursor pagination for big advertisers (the "30-ad cap" was just us
        // never paginating). depth=1 (default) is the old single fetch.
        const raw: any[] = [];
        let cursor: string | undefined;
        let cached = true;
        let error: string | null = null;
        let more = false;
        const depth = Math.min(p.depth ?? 1, 3);
        for (let pg = 0; pg < depth; pg++) {
          const r = await apiGet('company/ads', {
            pageId: p.page_id,
            country: p.country ?? 'ALL',
            status: p.status ?? 'ACTIVE',
            start_date: startDateFor(p.last_days),
            cursor,
          }, `ads ${p.label ?? p.page_id} ${p.country ?? 'ALL'}/${p.status ?? 'ACTIVE'}${p.last_days ? `/last${p.last_days}d` : ''} pg${pg + 1}`, AD_CACHE_TTL_HOURS);
          if (!r.ok) { error = r.error; break; }
          cached = cached && r.cached;
          const ads = (r.data?.results ?? []) as any[];
          raw.push(...ads);
          cursor = r.data?.cursor ?? undefined;
          more = Boolean(cursor);
          if (!cursor || ads.length === 0) break;
        }
        return { p, raw, cached, error, more };
      }),
    );
    const blocks = await Promise.all(settled.map(async (s, i) => {
      const idx = i + 1;
      const p = args.pages[i];
      const head = `[${idx}] PAGE: ${p.label ?? p.page_id} (page_id=${p.page_id}, ${p.country ?? 'ALL'}/${p.status ?? 'ACTIVE'}${p.last_days ? `/last ${p.last_days}d` : ''})`;
      if (s.status !== 'fulfilled') return `${head}\n    ERROR: ${String(s.reason)}`;
      const { raw, cached, error, more } = s.value;
      if (error && raw.length === 0) return `${head}\n    ERROR: ${error}`;
      if (raw.length === 0) {
        return `${head}${cached ? ' (cached)' : ''}\n    NO ACTIVE ADS FOUND. This rival is not running active Meta ads (or none in this country). That is a finding — name it; fall back to a Perplexity category-trend read for the visual zeitgeist.`;
      }
      const status = p.status ?? 'ACTIVE';
      const dumpSuffix = `${status !== 'ACTIVE' ? `.status-${status.toLowerCase()}` : ''}${p.last_days ? `.last${p.last_days}d` : ''}`;
      const dumpFile = rawAdsDir ? dumpRawAds(rawAdsDir, p.label ?? '', p.page_id, raw, dumpSuffix) : null;
      const shaped = rankRevealedWinners(raw.map(shapeAd));
      const max = p.max_ads ?? DEFAULT_MAX_ADS;
      const realName = raw[0]?.page_name ? ` — confirmed page_name="${raw[0].page_name}"` : '';
      const dumpNote = dumpFile ? `\n    RAW DUMP (all ${raw.length} ads, full untruncated copy + media URLs + job labels): ${dumpFile}` : '';
      const imageBearing = raw.filter((a) => collectImageUrls(a?.snapshot ?? {}).length > 0).length;
      const imgNote = dumpFile
        ? imageBearing > 0
          ? `\n    IMAGE-BEARING ADS: ${imageBearing} of ${raw.length} (image URLs in the dump). NOT downloaded at fetch time — after the shortlist is picked, call download_creatives with this dump path + the shortlisted archiveIds.`
          : '\n    IMAGE-BEARING ADS: none (video/DCO-only page — copy captured in the dump; pixels out of scope)'
        : '';
      // Job mix + cadence — the ad-data v2 calibration the scout carries into
      // the shortlist. Cadence reads over conversion-job ads only (a store
      // opening spree must not make a coasting brand look like a tester).
      const jobMix = new Map<string, number>();
      for (const a of shaped) jobMix.set(a.job, (jobMix.get(a.job) ?? 0) + 1);
      const jobNote = `\n    JOB MIX: ${[...jobMix.entries()].map(([j, n]) => `${j}=${n}`).join(', ')} (only conversion-job ads carry endorsement for our read; the rest is context)`;
      const cadNote = `\n    ${cadenceLine(launchCadence(shaped.filter((a) => a.job === 'conversion'), more))}`;
      const moreNote = more ? `\n    MORE PAGES AVAILABLE — re-call with depth=${Math.min((p.depth ?? 1) + 1, 3)} to fetch deeper (1 credit/page).` : '';
      const stopNote = error ? `\n    NOTE: page fetch stopped early: ${error}` : '';
      const shown = shaped.slice(0, max).map((a, n) =>
        `      ${n + 1}. [${a.format}${a.job === 'conversion' ? '' : ` · job:${a.job}`}] running ${a.daysRunning ?? '?'}d (since ${a.launched})` +
        `${a.active ? '' : ' INACTIVE'} | variants=${a.variants} | ${a.platforms.join('+') || 'n/a'} | CTA: ${a.cta} → ${a.linkDomain}\n` +
        `         copy: ${a.body || '(no body text)'}`);
      return `${head}${cached ? ' (cached)' : ''}${realName}${dumpNote}${imgNote}${jobNote}${cadNote}${moreNote}${stopNote}\n    ${raw.length} ad(s) fetched; showing top ${Math.min(max, shaped.length)} by revealed-winner ranking (active × conversion-job × variants × longevity):\n${shown.join('\n')}`;
    }));
    return { content: [{ type: 'text' as const, text: blocks.join('\n\n') }] };
  },
);

// ── Tool 3 — format_hunt: find who runs a FORMAT, by its copy fingerprint ──
const huntSchema = z.object({
  query: z.string().min(1).describe('The format FINGERPRINT — a phrase the target format leaves in ad copy (e.g. "verified buyer" for testimonial statics, "do the math" for math-anchor offers, "so we made" for founder-POV).'),
  label: z.string().optional().describe('Short slug for the dump/images folder names; defaults to a slug of the query.'),
  country: z.string().optional().describe("One 2-letter market code (e.g. IN, US, CA). Defaults to ALL countries — prefer the brand's market for in-market hunts; ALL for bank seeding."),
  search_type: z.enum(['keyword_exact_phrase', 'keyword_unordered']).optional().describe('Default keyword_exact_phrase — fingerprints work best as exact phrases.'),
  media_type: z.enum(['ALL', 'IMAGE', 'MEME', 'IMAGE_AND_MEME']).optional().describe('Default IMAGE_AND_MEME = statics only (MEME is Meta-speak for text-on-image).'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().describe('Default ACTIVE (the live field). ALL adds recently-retired ads.'),
  last_days: z.number().int().min(1).max(365).optional().describe('Server-side date window: only ads from the last N days (e.g. 90 = the current fashion of this format). Omit for all-time.'),
  max_ads: z.number().int().min(1).max(30).optional().describe('Max ads to summarize in the result (the dump holds everything), default 12.'),
  depth: z.number().int().min(1).max(3).optional().describe('Result pages to fetch via cursor, default 1. Each page ≈ 30 ads and costs 1 credit.'),
});

const makeFormatHunt = (rawAdsDir?: string) => tool(
  'format_hunt',
  'Hunt a creative FORMAT across ALL advertisers by its copy fingerprint — no brand names needed. Searches the whole Meta Ad Library by exact phrase (statics-only by default), returns the advertisers running that format ranked by delivery, and dumps every hit in full to a raw JSONL (per-ad advertiser identity). Images are NOT downloaded at hunt time — shortlist first, then call download_creatives with the hunt dump path + archiveIds (phase two). Use when a format family the brief needs is ABSENT from the rival set (white-space format lanes), or to seed the format bank. Pass an ARRAY of hunts (1-8); each page of each hunt costs 1 credit (cached).',
  { hunts: z.array(huntSchema).min(1).max(MAX_ITEMS_PER_BATCH).describe('Array of fingerprint hunts to run (max 8).') },
  async (args) => ({ content: [{ type: 'text' as const, text: await runFormatHunts(args.hunts, rawAdsDir) }] }),
);

// ── Tool 4 — download_creatives: phase two of the two-phase fetch ──────────
const downloadReqSchema = z.object({
  dump_file: z.string().min(1).describe('The raw dump path EXACTLY as the fetch/hunt result named it (raw/ads/<brand>.jsonl or raw/ads/hunt-<slug>.jsonl).'),
  ad_ids: z.array(z.string().min(1)).min(1).max(20).describe('archiveIds of the SHORTLISTED ads whose image creatives to download (from the dump lines / fetch result).'),
});

const makeDownloadCreatives = (rawAdsDir?: string, imagesRoot?: string) => tool(
  'download_creatives',
  'PHASE TWO of the fetch: download image creatives for SHORTLISTED ads only. Reads each ad\'s image URLs from the raw dump on disk (NO API call, NO credits) and downloads ≤2 images per ad — brand dumps → raw/images/<brand>/<adId>_<n>.jpg, hunt dumps → raw/images/hunt-<slug>/<brand>__<adId>_<n>.jpg. These are the paths your shortlist slices cite. Call it AFTER you have picked the shortlist and BEFORE writing field/shortlist.md; batch all dumps into ONE call. Ads with no static image URLs are named as video-only (their copy stays in the dump).',
  { requests: z.array(downloadReqSchema).min(1).max(MAX_ITEMS_PER_BATCH).describe('One request per dump file (max 8) — batch every dump into a single call.') },
  async (args) => ({ content: [{ type: 'text' as const, text: await downloadCreativesForAds(args.requests, imagesRoot, rawAdsDir) }] }),
);

/** Build the server. Pass rawAdsDir (e.g. <runDir>/raw/ads) to have every
 *  competitor_ads/format_hunt fetch dumped in full to disk for the creative's
 *  Grep, and imagesRoot (e.g. <runDir>/raw/images) to enable download_creatives
 *  (phase two: the scout downloads images for SHORTLISTED ads only). Hunt dumps
 *  land in the same dirs as hunt-<slug>.jsonl / hunt-<slug>/. */
export function createScrapecreatorsServer(rawAdsDir?: string, imagesRoot?: string) {
  return createSdkMcpServer({
    name: 'scrapecreators',
    // 0.7.0 = field-truth guards (S152): boosted-post job rules (fb.me / no-CTA-
    // no-destination → awareness) + WINDOW-TRUNCATED cadence on a partial page.
    // 0.6.0 = scout diet (S151 fix #2): two-phase image downloads — fetches dump
    // URLs only, download_creatives materializes the shortlist; context views
    // slimmed (120-char copy). 0.5.0 = ad-data v2: job classification, cadence
    // calibration, job-aware ranking, last_days windows, cursor pagination.
    version: '0.7.0',
    tools: [competitorFindPages, makeCompetitorAds(rawAdsDir), makeFormatHunt(rawAdsDir), makeDownloadCreatives(rawAdsDir, imagesRoot)],
  });
}

/** Legacy no-dump instance (eval and older callers). */
export const scrapecreatorsMcpServer = createScrapecreatorsServer();

export const SCRAPECREATORS_FIND_PAGES_TOOL = 'mcp__scrapecreators__competitor_find_pages';
export const SCRAPECREATORS_ADS_TOOL = 'mcp__scrapecreators__competitor_ads';
export const SCRAPECREATORS_FORMAT_HUNT_TOOL = 'mcp__scrapecreators__format_hunt';
export const SCRAPECREATORS_DOWNLOAD_TOOL = 'mcp__scrapecreators__download_creatives';
