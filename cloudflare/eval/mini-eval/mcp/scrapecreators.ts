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

const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';
const MAX_ITEMS_PER_BATCH = 8;   // apprentice-facing cap (queries or pages)
const DEFAULT_CANDIDATES = 6;    // page candidates returned per name lookup
const DEFAULT_MAX_ADS = 12;      // revealed-winner ads returned per page

// Disk cache — eval-scoped, gitignored. Resolved relative to this module so it
// is independent of the harness's cwd.
const CACHE_DIR = path.resolve(__dirname, '..', '.cache', 'scrapecreators');

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

function cacheRead(key: string): unknown | null {
  const f = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(f)) return null;
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
): Promise<{ ok: true; data: any; cached: boolean } | { ok: false; error: string }> {
  const key = cacheKey({ ep: endpoint, ...params });
  const hit = cacheRead(key);
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

interface ShapedAd {
  archiveId: string;
  daysRunning: number | null;
  launched: string;
  variants: number;     // collation_count
  active: boolean;
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
    format: String(s?.display_format ?? a?.media_type ?? 'n/a'),
    nImages: Array.isArray(s?.images) ? s.images.length : 0,
    nVideos: Array.isArray(s?.videos) ? s.videos.length : 0,
    platforms: Array.isArray(a?.publisher_platform) ? a.publisher_platform : [],
    cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
    linkDomain: domainOf(s?.link_url),
    body: body.length > 220 ? body.slice(0, 220) + '…' : body,
    firstImage:
      (Array.isArray(s?.images) && s.images[0]?.original_image_url) ||
      (Array.isArray(s?.images) && s.images[0]?.resized_image_url) ||
      (Array.isArray(s?.videos) && s.videos[0]?.video_preview_image_url) ||
      'n/a',
  };
}

// Revealed-winner ranking: active first, then most-duplicated, then
// longest-running. The brand's budget is voting; this surfaces its vote.
function rankRevealedWinners(ads: ShapedAd[]): ShapedAd[] {
  return [...ads].sort((x, y) => {
    if (x.active !== y.active) return x.active ? -1 : 1;
    if (y.variants !== x.variants) return y.variants - x.variants;
    return (y.daysRunning ?? 0) - (x.daysRunning ?? 0);
  });
}

// ── Tool 1 — resolve brand names to candidate pages ────────────────────────
const findPagesSchema = z.object({
  query: z.string().min(1).describe('Brand/advertiser name to resolve to a Facebook page, e.g. "DailyObjects". Generic names return many namesakes — read the candidates and pick by likes + category + ig_username, do not assume the first is right.'),
  max_results: z.number().int().min(1).max(15).optional().describe('Max candidate pages to return, default 6.'),
});

const competitorFindPages = tool(
  'competitor_find_pages',
  'Resolve rival brand NAMES to Meta Ad Library PAGES (the prerequisite for fetching their ads). Pass an ARRAY of brand names (1-8); each fires concurrently and returns candidate pages with page_id, name, category, likes, verification and Instagram handle. YOU choose the correct page_id from the candidates — match on likes (the real brand has far more), category and ig_username; reject namesakes. Then pass the chosen page_id(s) to competitor_ads. 1 credit per name (cached).',
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).optional().describe('Ad status, default ACTIVE (what they are running NOW — the live field).'),
  max_ads: z.number().int().min(1).max(30).optional().describe('Max revealed-winner ads to return per page after ranking, default 12.'),
});

const competitorAds = tool(
  'competitor_ads',
  'Fetch a rival page\'s ACTIVE Meta ads, pre-ranked by revealed-winner signal (active, then most variants, then longest-running) and trimmed to the fields that matter for a triage read: ad copy, CTA, link domain, format (VIDEO/IMAGE), days running, variant count, platforms. Pass an ARRAY of pages (1-8, page_id from competitor_find_pages); each fires concurrently. There is NO performance data for commercial ads — days_running and variants are PROXIES for what a rival\'s budget endorses, not measured winners; treat them as such. Empty results mean the rival runs no active Meta ads (itself a signal — name it, and fall back to a Perplexity category-trend read). 1 credit per page (cached).',
  { pages: z.array(adsPageSchema).min(1).max(MAX_ITEMS_PER_BATCH).describe('Array of pages to fetch in parallel (max 8).') },
  async (args) => {
    const settled = await Promise.allSettled(
      args.pages.map(async (p) => {
        const r = await apiGet('company/ads', {
          pageId: p.page_id,
          country: p.country ?? 'ALL',
          status: p.status ?? 'ACTIVE',
        }, `ads ${p.label ?? p.page_id} ${p.country ?? 'ALL'}/${p.status ?? 'ACTIVE'}`);
        return { p, r };
      }),
    );
    const blocks = settled.map((s, i) => {
      const idx = i + 1;
      const p = args.pages[i];
      const head = `[${idx}] PAGE: ${p.label ?? p.page_id} (page_id=${p.page_id}, ${p.country ?? 'ALL'}/${p.status ?? 'ACTIVE'})`;
      if (s.status !== 'fulfilled') return `${head}\n    ERROR: ${String(s.reason)}`;
      const { r } = s.value;
      if (!r.ok) return `${head}\n    ERROR: ${r.error}`;
      const raw = (r.data?.results ?? []) as any[];
      if (raw.length === 0) {
        return `${head}${r.cached ? ' (cached)' : ''}\n    NO ACTIVE ADS FOUND. This rival is not running active Meta ads (or none in this country). That is a finding — name it; fall back to a Perplexity category-trend read for the visual zeitgeist.`;
      }
      const shaped = rankRevealedWinners(raw.map(shapeAd));
      const max = p.max_ads ?? DEFAULT_MAX_ADS;
      const realName = raw[0]?.page_name ? ` — confirmed page_name="${raw[0].page_name}"` : '';
      const shown = shaped.slice(0, max).map((a, n) =>
        `      ${n + 1}. [${a.format}] running ${a.daysRunning ?? '?'}d (since ${a.launched})` +
        `${a.active ? '' : ' INACTIVE'} | variants=${a.variants} | ${a.platforms.join('+') || 'n/a'} | CTA: ${a.cta} → ${a.linkDomain}\n` +
        `         copy: ${a.body || '(no body text)'}`);
      return `${head}${r.cached ? ' (cached)' : ''}${realName}\n    ${raw.length} active ad(s) total; showing top ${Math.min(max, shaped.length)} by revealed-winner ranking (variants × longevity):\n${shown.join('\n')}`;
    });
    return { content: [{ type: 'text' as const, text: blocks.join('\n\n') }] };
  },
);

export const scrapecreatorsMcpServer = createSdkMcpServer({
  name: 'scrapecreators',
  version: '0.1.0',
  tools: [competitorFindPages, competitorAds],
});

export const SCRAPECREATORS_FIND_PAGES_TOOL = 'mcp__scrapecreators__competitor_find_pages';
export const SCRAPECREATORS_ADS_TOOL = 'mcp__scrapecreators__competitor_ads';
