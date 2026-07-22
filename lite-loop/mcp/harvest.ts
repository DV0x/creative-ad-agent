/**
 * harvest.ts — the lite pipeline's ONE fat deterministic field tool (§4 of the plan).
 *
 * The heavy loop lets a scout agent drive resolve→fetch→download across many tool
 * calls; lite compresses all mechanics into ONE deterministic call so the field
 * seat spends its context on JUDGMENT (the vision pass), not on plumbing:
 *
 *   resolve → scrape → triage → cluster → lane-score → download → manifest
 *
 * plus a `hunt_format` entry point (narrow scrape of 2 named master pages when the
 * field seat's summary orders a format hunt — max 1 per run).
 *
 * Everything here is deterministic code — no model in the loop. The LANE model
 * (workhorse / fresh / adjacent / wildcard) replaces single-composite ranking:
 * a fresh test can never beat a workhorse on one formula, which is how age bias
 * returns [F: no ad-age-only ranking]. No advertiser weight [F] — per-advertiser
 * caps cover it.
 *
 * Imports the heavy loop's exported classifiers (classifyJob, launchCadence);
 * the private HTTP+cache layer is re-implemented here (~60 lines, own cache dir)
 * because agent-loop keeps it unexported — S155 amendment #4.
 */
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyJob, launchCadence, type AdJob, type LaunchCadence } from '../../agent-loop/mcp/scrapecreators.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── HTTP + disk cache (same shape as agent-loop's private layer) ────────────
const API_BASE = 'https://api.scrapecreators.com/v1/facebook/adLibrary';
const CACHE_DIR = path.resolve(__dirname, '..', '.cache', 'scrapecreators');
const AD_CACHE_TTL_HOURS = Number(process.env.SCRAPECREATORS_CACHE_TTL_HOURS || 48);

function cacheKey(parts: Record<string, string | number | undefined>): string {
  const norm = Object.entries(parts)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${String(v).toLowerCase().trim()}`)
    .sort()
    .join('&');
  return norm.replace(/[^a-z0-9=&._-]+/gi, '_').slice(0, 180);
}

async function apiGet(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  label: string,
  ttlHours?: number,
): Promise<{ ok: true; data: any; cached: boolean } | { ok: false; error: string }> {
  const key = cacheKey({ ep: endpoint, ...params });
  const f = path.join(CACHE_DIR, `${key}.json`);
  if (fs.existsSync(f)) {
    const fresh = ttlHours === undefined || Date.now() - fs.statSync(f).mtimeMs <= ttlHours * 3_600_000;
    if (fresh) {
      try {
        const data = JSON.parse(fs.readFileSync(f, 'utf8'));
        process.stderr.write(`[harvest] CACHE-HIT ${label}\n`);
        return { ok: true, data, cached: true };
      } catch { /* fall through to live */ }
    }
  }
  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (!apiKey) return { ok: false, error: 'SCRAPECREATORS_API_KEY is not set in the environment.' };
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  try {
    const t0 = Date.now();
    const resp = await fetch(`${API_BASE}/${endpoint}?${qs}`, { headers: { 'x-api-key': apiKey } });
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 300)}` };
    const data = await resp.json();
    process.stderr.write(`[harvest] live ${label} ${(Date.now() - t0) / 1000}s credits_remaining=${data?.credits_remaining ?? '?'}\n`);
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(f, JSON.stringify(data), 'utf8');
    return { ok: true, data, cached: false };
  } catch (err) {
    return { ok: false, error: `network: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── Small shared helpers ─────────────────────────────────────────────────────
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'x';
const isoDay = (unix?: number): string => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : 'n/a');
const daysBetween = (startUnix?: number, endUnix?: number, nowMs = Date.now()): number | null => {
  if (!startUnix) return null;
  const end = endUnix ? endUnix * 1000 : nowMs;
  return Math.max(0, Math.round((end - startUnix * 1000) / 86_400_000));
};
const hostOf = (u?: string): string => {
  if (!u) return '';
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
};

/** Body/title normalization for identity clustering: case, whitespace, emoji and
 *  punctuation noise must not split "the same ad listed twice" (the BLUORNG ×4 case). */
export const normText = (s: string | null | undefined): string =>
  String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Landing-page normalization: same funnel = same cluster key. */
export const normLp = (u: string | null | undefined): string => {
  if (!u) return '';
  try {
    const url = new URL(u);
    return (url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')).toLowerCase();
  } catch { return String(u).toLowerCase(); }
};

export const lpPathType = (u: string | null | undefined): string => {
  const p = (() => { try { return new URL(String(u)).pathname.toLowerCase(); } catch { return ''; } })();
  if (/\/products?\//.test(p)) return 'pdp';
  if (/\/collections?\//.test(p) || /\/category\//.test(p)) return 'collection';
  if (p === '' || p === '/') return 'home';
  if (/\/pages?\//.test(p) || /land|lp|offer/.test(p)) return 'lander';
  return 'other';
};

// ── Triage: raw ads → candidates (DPA out, DCO exploded, boosted out) ───────
export interface Candidate {
  id: string;                // <advertiser-slug>_<archiveId>[_c<idx>]
  advertiser: string;
  pageId: string;
  bucket: 'competitor' | 'adjacent';
  archiveId: string;
  cardIndex: number | null;  // DCO sibling index (null = not a card sibling)
  dcoSiblings: number;       // static cards on the parent ad (1 = not DCO)
  format: string;            // IMAGE | DCO | CAROUSEL | VIDEO
  renderSource: 'static' | 'carousel' | 'poster';
  imageUrl: string | null;
  title: string | null;
  body: string;
  cta: string;
  linkUrl: string;
  linkDomain: string;
  lpType: string;
  launched: string;
  daysRunning: number | null;
  active: boolean;
  variants: number;          // Meta collation_count
  collationId: string | null;
  job: AdJob;
  aiMedia: boolean;          // Meta's AI-generated-media flag — recorded, never scored
}

export interface TriageResult {
  candidates: Candidate[];
  dpaCount: number;
  dpaSkuPaths: string[];     // SKU-push intel: what the catalog engine is pushing
  boostedSkipped: number;    // snapshot.is_reshared — boosted organic posts, not designed ads
  videoKept: number;         // videos kept via poster frame
}

const imgUrlOf = (o: any): string | undefined => o?.original_image_url ?? o?.resized_image_url ?? undefined;
const cardIsVideo = (c: any): boolean => Boolean(c?.video_hd_url || c?.video_sd_url || (c?.video_preview_image_url && !imgUrlOf(c)));
const DCO_TEMPLATE_RE = /\{\{[^}]+\}\}/;

export function triageAds(rawAds: any[], advertiser: string, pageId: string, bucket: 'competitor' | 'adjacent', nowMs = Date.now()): TriageResult {
  const out: TriageResult = { candidates: [], dpaCount: 0, dpaSkuPaths: [], boostedSkipped: 0, videoKept: 0 };
  const aSlug = slug(advertiser);
  for (const a of rawAds) {
    const s = a?.snapshot ?? {};
    const format = String(s?.display_format ?? a?.media_type ?? 'n/a').toUpperCase();
    const body = String(s?.body?.text ?? '').replace(/\s+/g, ' ').trim();
    // DPA: catalog ads — excluded from the creative field, counted as SKU-push intel
    if (format === 'DPA' || DCO_TEMPLATE_RE.test(body)) {
      out.dpaCount++;
      const p = (() => { try { return new URL(String(s?.link_url)).pathname; } catch { return ''; } })();
      if (p && out.dpaSkuPaths.length < 8 && !out.dpaSkuPaths.includes(p)) out.dpaSkuPaths.push(p);
      continue;
    }
    // Boosted organic (is_reshared): ran on inertia, not designed for the feed — cleaner
    // signal than the fb.me heuristic (which classifyJob still applies underneath).
    if (s?.is_reshared === true) { out.boostedSkipped++; continue; }

    const job = classifyJob(a);
    if (job === 'recruitment') continue; // never creative-field material

    const base = {
      advertiser, pageId, bucket,
      archiveId: String(a?.ad_archive_id ?? 'n/a'),
      title: (s?.title ?? '').toString().trim() || null,
      body,
      cta: [s?.cta_text, s?.cta_type].filter(Boolean).join(' / ') || 'n/a',
      linkUrl: String(s?.link_url ?? ''),
      linkDomain: hostOf(s?.link_url),
      lpType: lpPathType(s?.link_url),
      launched: isoDay(a?.start_date),
      daysRunning: daysBetween(a?.start_date, a?.end_date, nowMs),
      active: Boolean(a?.is_active),
      variants: Number(a?.collation_count ?? 1),
      collationId: a?.collation_id != null ? String(a.collation_id) : null,
      job,
      aiMedia: Boolean(a?.contains_digital_created_media),
    };

    const staticCards = Array.isArray(s?.cards) ? s.cards.filter((c: any) => !cardIsVideo(c) && imgUrlOf(c)) : [];
    if (format === 'DCO' && staticCards.length > 0) {
      // DCO EXPLOSION: each static card is a separately-designed creative sharing the
      // ad's copy — the brand's own test pool (verified live on Bewakoof 2026-07-21).
      staticCards.forEach((c: any, i: number) => {
        out.candidates.push({
          ...base, id: `${aSlug}_${base.archiveId}_c${i}`, cardIndex: i, dcoSiblings: staticCards.length,
          format: 'DCO', renderSource: 'static', imageUrl: imgUrlOf(c) ?? null,
        });
      });
      continue;
    }
    if (format === 'CAROUSEL' && staticCards.length > 0) {
      // Carousel = one narrative across frames → ONE candidate, first frame carries it.
      out.candidates.push({
        ...base, id: `${aSlug}_${base.archiveId}`, cardIndex: null, dcoSiblings: 1,
        format: 'CAROUSEL', renderSource: 'carousel', imageUrl: imgUrlOf(staticCards[0]) ?? null,
      });
      continue;
    }
    const images = Array.isArray(s?.images) ? s.images : [];
    const staticUrl = images.map(imgUrlOf).find(Boolean);
    if (staticUrl) {
      out.candidates.push({
        ...base, id: `${aSlug}_${base.archiveId}`, cardIndex: null, dcoSiblings: 1,
        format: format === 'n/a' ? 'IMAGE' : format, renderSource: 'static', imageUrl: staticUrl,
      });
      continue;
    }
    // VIDEO (or video-card DCO): kept via poster frame — the hook/construction is readable
    const poster =
      (Array.isArray(s?.videos) && s.videos[0]?.video_preview_image_url) ||
      (Array.isArray(s?.cards) && s.cards.find((c: any) => c?.video_preview_image_url)?.video_preview_image_url) ||
      null;
    if (poster) {
      out.videoKept++;
      out.candidates.push({
        ...base, id: `${aSlug}_${base.archiveId}`, cardIndex: null, dcoSiblings: 1,
        format: 'VIDEO', renderSource: 'poster', imageUrl: poster,
      });
    }
    // no image at all → copy-only; the raw dump keeps it for grepping, no candidate
  }
  return out;
}

// ── Clustering: union-find over candidates ───────────────────────────────────
// Meta collation ∪ same normalized LP ∪ identical normalized body, then
// Jaccard ≥ 0.6 (body+title tokens) within the same advertiser.
export interface Cluster {
  members: Candidate[];
  size: number;          // max(distinct designed units, max collation_count) — the iteration signal
  advertiser: string;
  bucket: 'competitor' | 'adjacent';
  best: Candidate;
}

class UnionFind {
  parent: number[] = [];
  constructor(n: number) { this.parent = Array.from({ length: n }, (_, i) => i); }
  find(i: number): number { return this.parent[i] === i ? i : (this.parent[i] = this.find(this.parent[i])); }
  union(a: number, b: number): void { this.parent[this.find(a)] = this.find(b); }
}

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
};

export function clusterCandidates(candidates: Candidate[]): Cluster[] {
  const uf = new UnionFind(candidates.length);
  // exact keys — collation, LP, body identity (scoped to advertiser: two brands
  // running "Shop now." are not one cluster)
  const byKey = new Map<string, number>();
  const joinKey = (key: string, i: number) => {
    if (!key) return;
    const prev = byKey.get(key);
    if (prev === undefined) byKey.set(key, i);
    else uf.union(prev, i);
  };
  candidates.forEach((c, i) => {
    if (c.collationId) joinKey(`col|${c.pageId}|${c.collationId}`, i);
    joinKey(`sib|${c.pageId}|${c.archiveId}`, i); // DCO siblings always cohere
    const lp = normLp(c.linkUrl);
    if (lp && c.lpType !== 'home') joinKey(`lp|${c.pageId}|${lp}`, i); // homepages funnel everything — too coarse to merge on
    const nb = normText(c.body);
    if (nb) joinKey(`body|${c.pageId}|${nb}`, i);
  });
  // near-duplicate copy within an advertiser (Jaccard ≥ 0.6 on body+title tokens)
  const byAdvertiser = new Map<string, number[]>();
  candidates.forEach((c, i) => {
    const arr = byAdvertiser.get(c.pageId) ?? [];
    arr.push(i);
    byAdvertiser.set(c.pageId, arr);
  });
  for (const idxs of byAdvertiser.values()) {
    const tokens = idxs.map((i) => new Set(normText(candidates[i].body + ' ' + (candidates[i].title ?? '')).split(' ').filter(Boolean)));
    for (let x = 0; x < idxs.length; x++) {
      for (let y = x + 1; y < idxs.length; y++) {
        if (uf.find(idxs[x]) === uf.find(idxs[y])) continue;
        if (jaccard(tokens[x], tokens[y]) >= 0.6) uf.union(idxs[x], idxs[y]);
      }
    }
  }
  // materialize
  const groups = new Map<number, Candidate[]>();
  candidates.forEach((c, i) => {
    const root = uf.find(i);
    const arr = groups.get(root) ?? [];
    arr.push(c);
    groups.set(root, arr);
  });
  const clusters: Cluster[] = [];
  for (const members of groups.values()) {
    const designedUnits = new Set(members.map((m) => `${m.archiveId}_${m.cardIndex ?? 0}`)).size;
    const maxCollation = Math.max(...members.map((m) => m.variants || 1));
    // best member: static beats poster, active beats dead, then longest-running
    const best = [...members].sort((a, b) => {
      const src = (m: Candidate) => (m.renderSource === 'static' ? 2 : m.renderSource === 'carousel' ? 1 : 0);
      if (src(a) !== src(b)) return src(b) - src(a);
      if (a.active !== b.active) return a.active ? -1 : 1;
      return (b.daysRunning ?? 0) - (a.daysRunning ?? 0);
    })[0];
    clusters.push({ members, size: Math.max(designedUnits, maxCollation), advertiser: best.advertiser, bucket: best.bucket, best });
  }
  return clusters;
}

// ── Lane scoring (§4.5) — component scores 0–1, two formulas, four lanes ────
export interface Scored {
  cluster: Cluster;
  iteration: number;
  endurance: number;
  anatomy: number;
  freshness: number;
  wave: number;
  renderable: number;
  workhorseScore: number;
  freshScore: number;
}

// DR-anatomy markers — five groups; the fraction hit is the ANATOMY score.
const ANATOMY_GROUPS: RegExp[] = [
  /₹|\brs\.?\s?\d|\$\d|€\d|£\d|\bmrp\b/i,                                  // price literal
  /\d+\s?%|\bflat\s?\d+|\bb[0-9]g[0-9]\b|\bbogo\b|\bsale\b|\boff\b/i,      // discount mechanics
  /\bcode\s+[a-z0-9]{3,}\b|\buse\s+code\b|\bcoupon\b/i,                    // promo code
  /\bshop now\b|\bbuy now\b|\border now\b|\bget yours\b|\bgrab\b|\bshop the\b/i, // CTA verb
  /\btoday\b|\bnow\b|\blimited\b|\blast\b|\bends\b|\bhurry\b|\bonly \d+\b/i,     // urgency
];
export const anatomyScore = (text: string): number =>
  ANATOMY_GROUPS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0) / ANATOMY_GROUPS.length;

export function scoreClusters(clusters: Cluster[]): Scored[] {
  // WAVE needs launch-week counts per advertiser (≥3 same-week launches = a push)
  const weekOf = (launched: string): string => {
    const d = new Date(launched);
    if (isNaN(d.getTime())) return '';
    const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7)); // ISO week start (Mon)
    return `${day.toISOString().slice(0, 10)}`;
  };
  const launchesPerWeek = new Map<string, number>();
  for (const cl of clusters) {
    const k = `${cl.best.pageId}|${weekOf(cl.best.launched)}`;
    launchesPerWeek.set(k, (launchesPerWeek.get(k) ?? 0) + 1);
  }
  return clusters.map((cluster) => {
    const b = cluster.best;
    const days = b.daysRunning ?? 0;
    const anatomy = anatomyScore(`${b.title ?? ''} ${b.body} ${b.cta}`);
    const iteration = Math.min(1, Math.log2(Math.max(1, cluster.size)) / 4);
    // the anatomy gate inside endurance kills the branding-ad trap: longevity only
    // counts in proportion to the ad LOOKING like it sells something
    const endurance = Math.min(1, days / 90) * (0.25 + 0.75 * anatomy);
    const freshness = days <= 14 ? 1 : days >= 45 ? 0 : (45 - days) / (45 - 14);
    const wave = (launchesPerWeek.get(`${b.pageId}|${weekOf(b.launched)}`) ?? 0) >= 3 ? 1 : 0;
    const renderable = b.renderSource === 'static' ? 1.0 : b.renderSource === 'carousel' ? 0.9 : 0.6;
    return {
      cluster, iteration, endurance, anatomy, freshness, wave, renderable,
      workhorseScore: 0.4 * iteration + 0.3 * endurance + 0.2 * anatomy + 0.1 * renderable,
      freshScore: 0.4 * freshness + 0.2 * wave + 0.2 * iteration + 0.2 * renderable,
    };
  });
}

export interface LanePick { lane: 'workhorse' | 'fresh' | 'adjacent' | 'wildcard'; why: string; s: Scored }
export interface LaneSelection {
  picks: LanePick[];
  thinField: boolean;
  clusterCount: number;    // competitor clusters (context only — the flag keys on picks)
  wildcardsEmpty: boolean; // the formulas left nothing over — itself a thin-field signal
}

// S155 F21: the vision pass needs 12–15 picks; thinField keys on what it will
// actually RECEIVE, not on cluster count (run 2: 13 clusters read "field depth
// ok" while only 11 picks existed — the starved pool then got padded, F22).
export const PICK_QUOTA_MIN = 12;

const PER_LANE_ADVERTISER_CAP = 2;
// GLOBAL cap across ALL lanes (S155 F3): the per-lane-only cap let Bombay Shirt
// Company take 7/24 picks (2 workhorse + 2 fresh + uncapped wildcards). The
// founder call is "no advertiser weight — caps cover it"; a global ceiling is
// what makes that true.
const GLOBAL_ADVERTISER_CAP = 3;
// S156 (run 5): workhorse + fresh exhausted every advertiser's global cap BEFORE
// the wildcard pass ran — all 43 leftover clusters were cap-blocked, so the
// oddball lane (the one that catches what the formulas miss) was STRUCTURALLY
// unfillable on any big-advertiser field. Wildcards get ONE slot of headroom:
// an advertiser may hold cap scored picks + at most 1 wildcard (4 total vs the
// 7-of-24 domination case the cap exists for).
const WILDCARD_CAP_HEADROOM = 1;

/** Fill the pick pool by lane: 9 workhorse / 6 fresh / 4 adjacent / 5 wildcard
 *  (the vision pass fills its 13–15 pick quotas from them). */
export function selectLanes(scored: Scored[]): LaneSelection {
  const comp = scored.filter((s) => s.cluster.bucket === 'competitor');
  const adj = scored.filter((s) => s.cluster.bucket === 'adjacent');
  const picks: LanePick[] = [];
  const picked = new Set<Scored>();
  const globalAdv = new Map<string, number>(); // ONE counter across every lane
  const capped = (pool: Scored[], score: (s: Scored) => number, n: number, perLaneCap = PER_LANE_ADVERTISER_CAP): Scored[] => {
    const perAdv = new Map<string, number>();
    const out: Scored[] = [];
    for (const s of [...pool].sort((a, b) => score(b) - score(a))) {
      if (picked.has(s)) continue;
      const k = s.cluster.best.pageId;
      if ((perAdv.get(k) ?? 0) >= perLaneCap) continue;
      if ((globalAdv.get(k) ?? 0) >= GLOBAL_ADVERTISER_CAP) continue;
      out.push(s);
      perAdv.set(k, (perAdv.get(k) ?? 0) + 1);
      globalAdv.set(k, (globalAdv.get(k) ?? 0) + 1);
      if (out.length >= n) break;
    }
    return out;
  };

  for (const s of capped(comp.filter((x) => (x.cluster.best.daysRunning ?? 0) >= 21), (x) => x.workhorseScore, 9)) {
    picked.add(s);
    picks.push({ lane: 'workhorse', s, why: `≥21d survivor — workhorse ${s.workhorseScore.toFixed(2)} (iter ${s.iteration.toFixed(2)}, endur ${s.endurance.toFixed(2)}, anat ${s.anatomy.toFixed(2)})` });
  }
  for (const s of capped(comp.filter((x) => (x.cluster.best.daysRunning ?? 99) <= 45), (x) => x.freshScore, 6)) {
    picked.add(s);
    picks.push({ lane: 'fresh', s, why: `≤45d test — fresh ${s.freshScore.toFixed(2)} (fresh ${s.freshness.toFixed(2)}, wave ${s.wave}, iter ${s.iteration.toFixed(2)})` });
  }
  // WILDCARD — unscored on purpose: oddballs first (high-iteration/low-anatomy =
  // native-performer signature, the Ditto case), then the next-best unpicked.
  // No per-lane cap here (oddball freedom) but the GLOBAL cap still applies.
  const oddballs = comp.filter((s) => !picked.has(s) && s.iteration >= 0.5 && s.anatomy <= 0.2);
  const rest = comp.filter((s) => !picked.has(s) && !oddballs.includes(s))
    .sort((a, b) => Math.max(b.workhorseScore, b.freshScore) - Math.max(a.workhorseScore, a.freshScore));
  let wildcards = 0;
  for (const s of [...oddballs, ...rest]) {
    if (wildcards >= 5) break;
    const k = s.cluster.best.pageId;
    if ((globalAdv.get(k) ?? 0) >= GLOBAL_ADVERTISER_CAP + WILDCARD_CAP_HEADROOM) continue;
    picked.add(s);
    globalAdv.set(k, (globalAdv.get(k) ?? 0) + 1);
    wildcards++;
    picks.push({ lane: 'wildcard', s, why: oddballs.includes(s) ? 'oddball: high iteration + low DR anatomy — native-performer signature' : 'next-best unpicked — vision pass may see what the formulas missed' });
  }
  // ADJACENT last, capped RELATIVE to the competitor pool (S155 F21): the lane is
  // guaranteed but on a thin field a fixed 4 let real-estate portals take 36% of
  // run 2's picks. ~25% of total picks = nonAdjacent/3, floor 1, ceiling 4.
  const adjacentCap = Math.min(4, Math.max(1, Math.floor(picks.length / 3)));
  for (const s of capped(adj, (x) => x.workhorseScore, adjacentCap)) {
    picked.add(s);
    picks.push({ lane: 'adjacent', s, why: `adjacent field (guaranteed lane, capped ~25% of picks) — workhorse-formula ${s.workhorseScore.toFixed(2)}` });
  }
  return { picks, thinField: picks.length < PICK_QUOTA_MIN, clusterCount: comp.length, wildcardsEmpty: wildcards === 0 };
}

// ── Download planning (S155 F2/F14) — the pool is CAPPED ────────────────────
// Run 1 downloaded 59 files (24 picks × DCO siblings) — 2.25× the design. The
// oversized pool triggered the harness's tool-result pruning in the field seat,
// which invalidated the prompt cache EVERY call (~$4.40 of pure re-write waste)
// AND silently broke view-all-then-pick. The pool now hard-caps at 28: one best
// image per pick, then siblings ONLY where the variant axis is load-bearing
// (workhorse-lane DCO picks), best-scored first, up to 2 extra siblings each.
export const POOL_FILE_CAP = 28;

export interface DownloadPlan { candidate: Candidate; isSibling: boolean }

export function planDownloads(picks: LanePick[]): DownloadPlan[] {
  const plan: DownloadPlan[] = [];
  for (const p of picks) {
    if (plan.length >= POOL_FILE_CAP) break;
    if (p.s.cluster.best.imageUrl) plan.push({ candidate: p.s.cluster.best, isSibling: false });
  }
  for (const p of picks.filter((x) => x.lane === 'workhorse' && x.s.cluster.best.dcoSiblings > 1)) {
    const b = p.s.cluster.best;
    const siblings = p.s.cluster.members
      .filter((m) => m.archiveId === b.archiveId && m.id !== b.id && m.imageUrl)
      .slice(0, 2);
    for (const m of siblings) {
      if (plan.length >= POOL_FILE_CAP) return plan;
      plan.push({ candidate: m, isSibling: true });
    }
  }
  return plan;
}

// ── Resolve, scrape, download, manifest (the impure shell) ───────────────────
export interface AdvertiserReport {
  name: string;
  pageId: string | null;
  bucket: 'competitor' | 'adjacent';
  status: 'ok' | 'unresolved' | 'no-ads' | 'own-ads-dropped' | 'error';
  note?: string;
  adsFetched: number;
  searchResultsCount: number | null; // true volume vs our window
  windowTruncated: boolean;
  cadence: LaunchCadence | null;
  dpaCount: number;
  dpaSkuPaths: string[];
  boostedSkipped: number;
}

/** WORD-BOUNDARY name match (S155 F5). Substring matching resolved "Snitch" to
 *  "No Snitches Allowed" (1.9M likes) — a namesake with more followers than the
 *  brand. Token-set containment rejects that: 'snitch' ≠ 'snitches'.
 *
 *  SINGLE-TOKEN queries (S155 F20): bare subset still took namesakes — "Pine" ⊆
 *  "Cardinal & Pine" (a US news outlet), "Perch" ⊆ "Fort Perch Rock Battery" (a
 *  UK museum). A one-word brand matches only when its token LEADS the page name
 *  ("BEARDO for Men" ✓, "Cardinal & Pine" ✗) — brand pages lead with the brand.
 *  Exported for direct testing. */
const LEAD_STOPWORDS = new Set(['the', 'a', 'an']);
export function nameMatches(query: string, candidate: string): boolean {
  const q = normText(query).split(' ').filter(Boolean);
  const c = normText(candidate).split(' ').filter(Boolean);
  if (!q.length || !c.length) return false;
  if (q.length === 1) {
    const lead = LEAD_STOPWORDS.has(c[0]) && c.length > 1 ? c[1] : c[0];
    return lead === q[0];
  }
  const cSet = new Set(c);
  const qSet = new Set(q);
  return q.every((t) => cSet.has(t)) || c.every((t) => qSet.has(t));
}

/** "Name — domain.com" / "Name (domain.com)" roster entries: research supplies the
 *  domain when it knows it; the resolver uses it as the namesake-rejection retry. */
export function parseRosterEntry(entry: string): { name: string; domain: string | null } {
  const m = entry.match(/\b([a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i);
  const domain = m ? m[1].toLowerCase() : null;
  const name = entry
    .replace(m?.[1] ?? '', '')
    .replace(/[—–()|]/g, ' ')
    .replace(/\s+-\s+/g, ' ') // " - " separator, but never a hyphen inside a brand name
    .replace(/\s+/g, ' ')
    .trim();
  return { name: name || entry.trim(), domain };
}

async function resolvePage(
  name: string,
  domain?: string | null,
  nicheKeywords: string[] = [],
): Promise<{ pageId: string; pageName: string; likes: number } | null> {
  const pick = (cands: any[]): { pageId: string; pageName: string; likes: number } | null => {
    const kw = nicheKeywords.map((k) => k.toLowerCase());
    const scored = cands
      .map((c) => ({
        c,
        likes: Number(c?.likes ?? 0),
        match: nameMatches(name, String(c?.name ?? '')),
        // soft niche bonus: right category wins a likes tie, never overrides a name match
        niche: kw.length && kw.some((k) => String(c?.category ?? '').toLowerCase().includes(k)) ? 1 : 0,
      }))
      .filter((x) => x.match)
      .sort((a, b) => (b.niche - a.niche) || (b.likes - a.likes));
    const best = scored[0];
    return best ? { pageId: String(best.c.page_id), pageName: String(best.c.name), likes: best.likes } : null;
  };
  const r = await apiGet('search/companies', { query: name }, `resolve "${name}"`);
  let best = r.ok ? pick((r.data?.searchResults ?? []) as any[]) : null;
  // Domain retry (S155 F20): ALWAYS runs when a domain is known — run 2's likes
  // gate (`best.likes < 1000`) meant a HIGH-follower namesake suppressed the very
  // retry designed to catch namesakes. And a domain-matched page OUTRANKS a
  // name-matched one regardless of likes: the domain is the founder's own claim
  // about who the competitor is; a follower count is not.
  if (domain) {
    const r2 = await apiGet('search/companies', { query: domain }, `resolve "${domain}" (domain retry)`);
    if (r2.ok) {
      const byDomain = pick((r2.data?.searchResults ?? []) as any[])
        ?? pick(((r2.data?.searchResults ?? []) as any[]).filter((c: any) => normText(String(c?.name ?? '')).includes(normText(domain.split('.')[0]))));
      if (byDomain) best = byDomain;
    }
  }
  return best;
}

async function scrapePage(pageId: string, label: string, country: string, depth: number): Promise<{ raw: any[]; truncated: boolean; searchResultsCount: number | null; error: string | null }> {
  const raw: any[] = [];
  let cursor: string | undefined;
  let error: string | null = null;
  let searchResultsCount: number | null = null;
  let truncated = false;
  for (let pg = 0; pg < depth; pg++) {
    const r = await apiGet('company/ads', { pageId, country, status: 'ACTIVE', cursor }, `ads ${label} pg${pg + 1}`, AD_CACHE_TTL_HOURS);
    if (!r.ok) { error = r.error; break; }
    const ads = (r.data?.results ?? []) as any[];
    raw.push(...ads);
    if (searchResultsCount === null && r.data?.searchResultsCount != null) searchResultsCount = Number(r.data.searchResultsCount);
    cursor = r.data?.cursor ?? undefined;
    truncated = Boolean(cursor);
    if (!cursor || ads.length === 0) break;
  }
  return { raw, truncated, searchResultsCount, error };
}

const MIN_IMG_BYTES = 5000;
async function downloadImage(url: string, dest: string): Promise<boolean> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return false;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < MIN_IMG_BYTES) return false;
    fs.writeFileSync(dest, buf);
    return true;
  } catch { return false; }
}

export interface HarvestArgs {
  competitorNames: string[]; // entries may carry a domain: "Snitch — snitch.co.in"
  adjacentNames: string[];
  market: string;
  founderDomain: string;
  runDir: string;
  nicheKeywords?: string[]; // soft resolver guard, e.g. ["clothing","apparel","fashion"]
  download?: boolean; // false in fixture tests — signed CDN URLs expire in ~48h
  onLog?: (l: string) => void;
}

/** Tiny concurrency pool — advertiser scrapes are independent HTTP chains; running
 *  them serially cost ~4 min of wall clock in run 1 (S155). Order is preserved. */
async function pooled<T, R>(items: T[], n: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

export interface HarvestOutput {
  manifestPath: string;
  summary: string;
  manifest: any;
}

export async function harvestRun(args: HarvestArgs): Promise<HarvestOutput> {
  const { runDir, market, founderDomain } = args;
  const log = args.onLog ?? (() => {});
  const rawDir = path.join(runDir, 'raw', 'ads');
  const imgDir = path.join(runDir, 'field', 'creatives');
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(imgDir, { recursive: true });

  const founderHost = founderDomain.replace(/^www\./, '').toLowerCase();

  const roster: Array<{ entry: string; bucket: 'competitor' | 'adjacent' }> = [
    ...args.competitorNames.map((entry) => ({ entry, bucket: 'competitor' as const })),
    ...args.adjacentNames.map((entry) => ({ entry, bucket: 'adjacent' as const })),
  ];

  // PHASE 1 — resolve every roster entry (concurrency 4). Split from scraping so
  // the roster's likes MEDIAN exists before any page is trusted (S155 F20c).
  const resolved = await pooled(roster, 4, async ({ entry, bucket }) => {
    const { name, domain } = parseRosterEntry(entry);
    const rep: AdvertiserReport = {
      name, pageId: null, bucket, status: 'ok', adsFetched: 0, searchResultsCount: null,
      windowTruncated: false, cadence: null, dpaCount: 0, dpaSkuPaths: [], boostedSkipped: 0,
    };
    // own-ads ban, belt 1: the name or domain IS the founder's brand
    if ((domain && domain.replace(/^www\./, '') === founderHost) || (normText(name) && normText(name) === normText(founderHost.split('.')[0]))) {
      rep.status = 'own-ads-dropped';
      rep.note = 'name/domain matches the founder brand';
      return { rep, bucket, name, page: null as Awaited<ReturnType<typeof resolvePage>> };
    }
    const page = await resolvePage(name, domain, args.nicheKeywords ?? []);
    if (!page) { rep.status = 'unresolved'; rep.note = 'no token-matching Meta page (namesakes rejected); supply a domain for the retry'; }
    else {
      rep.pageId = page.pageId;
      log(`· ${name} → page ${page.pageName} (${page.likes.toLocaleString()} likes)`);
    }
    return { rep, bucket, name, page };
  });

  // S155 F20c: a page with likes under 1% of the roster median is a suspect
  // namesake/franchisee (run 2: a 709-like Quebec page fed 3 French picks into an
  // EN Ontario field). Flagged, not dropped — the has-ads belt still guards, and
  // the field seat reads the note in the manifest.
  const likesSorted = resolved.filter((r) => r.page).map((r) => r.page!.likes).sort((a, b) => a - b);
  const likesMedian = likesSorted.length ? likesSorted[Math.floor(likesSorted.length / 2)] : 0;
  for (const r of resolved) {
    if (r.page && likesMedian >= 1000 && r.page.likes < likesMedian * 0.01) {
      const warn = `SUSPECT RESOLVE: "${r.page.pageName}" has ${r.page.likes.toLocaleString()} likes vs a roster median of ${likesMedian.toLocaleString()} — likely a namesake, regional page, or franchisee. Treat its ads with suspicion (verify language/market fit) and record any doubt in honesty[]`;
      r.rep.note = r.rep.note ? `${r.rep.note}; ${warn}` : warn;
      log(`⚠ ${r.name}: ${warn}`);
    }
  }

  // PHASE 2 — scrape + triage the resolved pages (concurrency 3).
  const results = await pooled(resolved, 3, async ({ rep, bucket, name, page }) => {
    if (!page || rep.status !== 'ok') return { rep, candidates: [] as Candidate[] };
    const depth = bucket === 'competitor' ? 3 : 1; // 60–90 ads for rivals, 1 page for adjacents
    const { raw, truncated, searchResultsCount, error } = await scrapePage(page.pageId, name, market, depth);
    const addNote = (n: string) => { rep.note = rep.note ? `${rep.note}; ${n}` : n; };
    if (error && raw.length === 0) { rep.status = 'error'; addNote(error); return { rep, candidates: [] }; }
    if (raw.length === 0) { rep.status = 'no-ads'; addNote('no active ads in this market'); return { rep, candidates: [] }; }
    rep.adsFetched = raw.length;
    rep.searchResultsCount = searchResultsCount;
    rep.windowTruncated = truncated;
    fs.writeFileSync(path.join(rawDir, `${slug(name)}.json`), JSON.stringify(raw), 'utf8');

    const tri = triageAds(raw, page.pageName || name, page.pageId, bucket);
    rep.dpaCount = tri.dpaCount;
    rep.dpaSkuPaths = tri.dpaSkuPaths;
    rep.boostedSkipped = tri.boostedSkipped;
    rep.cadence = launchCadence(
      tri.candidates.filter((c) => c.job === 'conversion').map((c) => ({ daysRunning: c.daysRunning, active: c.active })),
      truncated,
    );
    // own-ads ban, belt 2: the page's ads point at the founder's own domain
    const domains = tri.candidates.map((c) => c.linkDomain).filter(Boolean);
    const ownShare = domains.length ? domains.filter((d) => d === founderHost).length / domains.length : 0;
    if (ownShare > 0.5) {
      rep.status = 'own-ads-dropped';
      addNote(`ads land on ${founderHost} — this is the founder's own page`);
      return { rep, candidates: [] };
    }
    return { rep, candidates: tri.candidates };
  });

  const reports: AdvertiserReport[] = results.map((r) => r.rep);
  const allCandidates: Candidate[] = results.flatMap((r) => r.candidates);

  // cluster → score → lanes
  const clusters = clusterCandidates(allCandidates);
  const scored = scoreClusters(clusters);
  const selection = selectLanes(scored);
  log(`· ${allCandidates.length} candidates → ${clusters.length} clusters → ${selection.picks.length} lane picks${selection.thinField ? ' (THIN FIELD)' : ''}`);

  // download the CAPPED pool (S155 F2: one best image per pick; siblings only for
  // workhorse DCO picks; POOL_FILE_CAP hard stop — see planDownloads)
  const plan = planDownloads(selection.picks);
  let downloaded = 0;
  let failed = 0;
  const failedIds: string[] = []; // S156: the REAL failure record — the summary
  // validator cross-checks honesty[] against it (run 5's field seat confabulated
  // "CDN wiped 17 of 27 images" when exactly ONE download had failed)
  if (args.download !== false) {
    await pooled(plan, 4, async ({ candidate: m }) => {
      const dest = path.join(imgDir, `${m.id}.jpg`);
      if (fs.existsSync(dest)) { downloaded++; return; }
      if (m.imageUrl && (await downloadImage(m.imageUrl, dest))) downloaded++;
      else { failed++; failedIds.push(m.id); }
    });
  }
  const planned = new Set(plan.map((d) => d.candidate.id));

  // manifest — the full dossier the vision pass works from
  const manifest = {
    generatedAt: new Date().toISOString(),
    market,
    founderDomain: founderHost,
    advertisers: reports,
    field: {
      candidates: allCandidates.length,
      clusters: clusters.length,
      competitorClusters: selection.clusterCount,
      lanePicks: selection.picks.length,
      thinField: selection.thinField,
      wildcardsEmpty: selection.wildcardsEmpty,
      // S156: ground truth for the vision seat's honesty[] — what ACTUALLY failed.
      imageDownloads: { planned: plan.length, downloaded, failed, failedIds },
      // S155 F21: the note states PICK COUNT vs the 12–15 quota — cluster count
      // read "field depth ok" on a field that could only hand the vision pass 11.
      note: (selection.thinField
        ? `THIN FIELD: only ${selection.picks.length} lane picks vs the 12–15 the vision pass needs (${selection.clusterCount} competitor clusters). Do NOT pad and NEVER repeat a candidate — quotas shrink to what exists, and the summary says THIN FIELD honestly.`
        : `field depth ok: ${selection.picks.length} lane picks from ${selection.clusterCount} competitor clusters.`)
        + (selection.wildcardsEmpty ? ' WILDCARD POOL EMPTY: the formulas left nothing over — itself a thin-field signal; say so in honesty[].' : ''),
    },
    candidates: selection.picks.map((p) => {
      const b = p.s.cluster.best;
      // siblings appear ONLY where the plan downloaded them (workhorse DCO picks) —
      // for other DCO picks the variant axis is read from dcoSiblings count, not pixels
      const siblings = p.lane === 'workhorse' && b.dcoSiblings > 1
        ? p.s.cluster.members
            .filter((m) => m.archiveId === b.archiveId && m.id !== b.id && planned.has(m.id))
            .map((m) => ({
              cardIndex: m.cardIndex,
              imagePath: fs.existsSync(path.join(imgDir, `${m.id}.jpg`)) ? path.join('field', 'creatives', `${m.id}.jpg`) : null,
            }))
        : [];
      return {
        id: b.id,
        lane: p.lane,
        whyFlagged: p.why,
        advertiser: b.advertiser,
        bucket: b.bucket,
        archiveId: b.archiveId,
        format: b.format,
        renderSource: b.renderSource,
        dcoSiblings: b.dcoSiblings,
        siblingImages: siblings,
        imagePath: fs.existsSync(path.join(imgDir, `${b.id}.jpg`)) ? path.join('field', 'creatives', `${b.id}.jpg`) : null,
        scores: {
          iteration: +p.s.iteration.toFixed(3), endurance: +p.s.endurance.toFixed(3), anatomy: +p.s.anatomy.toFixed(3),
          freshness: +p.s.freshness.toFixed(3), wave: p.s.wave, renderable: p.s.renderable,
          workhorse: +p.s.workhorseScore.toFixed(3), fresh: +p.s.freshScore.toFixed(3),
        },
        clusterSize: p.s.cluster.size,
        variants: b.variants,
        daysRunning: b.daysRunning,
        launched: b.launched,
        active: b.active,
        job: b.job,
        aiMedia: b.aiMedia,
        title: b.title,
        body: b.body,
        cta: b.cta,
        linkDomain: b.linkDomain,
        lpType: b.lpType,
        rawDump: path.join('raw', 'ads', `${slug(b.advertiser)}.json`),
      };
    }),
    huntBudget: 1,
  };
  const manifestPath = path.join(runDir, 'field', 'manifest.json');
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const laneCounts = manifest.candidates.reduce<Record<string, number>>((m, c: any) => ((m[c.lane] = (m[c.lane] ?? 0) + 1), m), {});
  const summary = [
    `HARVEST COMPLETE → field/manifest.json (Read it — every candidate carries its full dossier).`,
    ``,
    `ADVERTISERS: ${reports.map((r) => `${r.name}=${r.status === 'ok' ? `${r.adsFetched} ads${r.windowTruncated ? ` (window-truncated; true volume ${r.searchResultsCount ?? '?'})` : ''}` : r.status.toUpperCase()}${r.note?.includes('SUSPECT RESOLVE') ? ' ⚠SUSPECT-RESOLVE (see manifest note)' : ''}`).join(' · ')}`,
    `FIELD: ${allCandidates.length} creatives → ${clusters.length} clusters (${selection.clusterCount} competitor) → ${selection.picks.length} lane picks${selection.thinField ? ` — ⚠ THIN FIELD (under the 12-pick quota): report it honestly, never pad, NEVER repeat a candidate` : ''}`,
    `LANES: ${Object.entries(laneCounts).map(([l, n]) => `${l}=${n}`).join(' · ')}${selection.wildcardsEmpty ? ' · ⚠ wildcard pool EMPTY — announce it in honesty[]' : ''}`,
    `IMAGES: ${downloaded} downloaded to field/creatives/${failed ? ` (${failed} failed — expired CDN links)` : ''}`,
    `DPA (catalog SKU-push, excluded from the field): ${reports.reduce((n, r) => n + r.dpaCount, 0)} · boosted organic skipped: ${reports.reduce((n, r) => n + r.boostedSkipped, 0)}`,
    ``,
    `Now run the VISION PASS per your law: view ALL images first, then pick to quota, one file per pick.`,
  ].join('\n');

  return { manifestPath, summary, manifest };
}

// ── hunt_format — narrow scrape of 2 named master pages (max 1 per run) ─────
export interface HuntArgs {
  format: string;
  candidateMasters: string[];
  market: string;
  runDir: string;
  download?: boolean;
}

// S155 F23: a master brand runs MANY formats — "the best ads from these two
// brands" is not "the <format> ads from these two brands" (run 2 hunted
// testimonial-card and got an offer-card, a comparison, and three
// problem-solution ads back, unlabelled). Copy fingerprints let the code RANK
// on-format candidates first and say honestly when none exists; the heavy
// loop's fingerprint SEARCH is the eventual port, this is the cheap tier.
export const FORMAT_FINGERPRINTS: Record<string, RegExp> = {
  'testimonial-card': /["“”].{8,}["“”]|verified (buyer|customer|purchase|review)|\b5[- ]?stars?\b|★|⭐|\btrust(ed)? by\b|\bcustomers? say\b/i,
  'us-vs-them': /\bvs\.?\b|\bunlike\b|\bswitch(ed)? (from|to)\b|✓|✗|✅|❌|\bcompared? (to|with)\b|\bwhy settle\b/i,
  'problem-solution': /\b(tired of|sick of|struggling (with|to)|stop (paying|wasting|guessing|scrolling)|no more|still (paying|using)|fix(es|ed)? (it|this|your))\b/i,
  'offer-card': /\d+\s?%\s?off|\bflat\s?\d+|\bsale\b|\buse code\b|\bcode\s+[a-z0-9]{3,}\b|\bfree (shipping|trial|gift)\b|₹\s?\d|\$\s?\d|\bbogo\b/i,
  'meme-native': /\bpov\b|\bme when\b|nobody:|\bbe like\b|\bit's giving\b/i,
  'ugc-style': /\b(i|my)\b.{0,40}\b(tried|bought|ordered|honest|obsessed|review(ed)?)\b/i,
  'infographic-mechanism': /\bhow it works\b|\bstep [1-9]\b|\bin [0-9]+ (minutes|days|steps)\b|\bthe science\b|\bingredients?\b/i,
  // no entry for product-hero / lifestyle-in-use / text-billboard / editorial-advertorial:
  // those live in the PIXELS, not the copy — a wrong fingerprint is worse than none
  // (absent entry → results honestly labelled unfiltered, judged by eye).
};

export interface RankedHunt { s: Scored; onFormat: boolean }

/** Rank hunt clusters: fingerprint-matching candidates first, then workhorse
 *  score. Returns up to 10 so the vision pass has real choice. Pure — exported
 *  for fixture testing. */
export function rankHunt(scored: Scored[], format: string): RankedHunt[] {
  const fp = FORMAT_FINGERPRINTS[format] ?? null;
  return scored
    .map((s) => ({ s, onFormat: fp ? fp.test(`${s.cluster.best.title ?? ''} ${s.cluster.best.body} ${s.cluster.best.cta}`) : false }))
    .sort((a, b) => (Number(b.onFormat) - Number(a.onFormat)) || (b.s.workhorseScore - a.s.workhorseScore))
    .slice(0, 10);
}

export async function huntRun(args: HuntArgs): Promise<string> {
  const sentinel = path.join(args.runDir, 'field', '.hunt-done');
  if (fs.existsSync(sentinel)) {
    return 'HUNT REFUSED: this run already spent its one format hunt. Work with the field you have; note the gap honestly in field-summary.json.';
  }
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, `${args.format} @ ${new Date().toISOString()}\n`);

  const rawDir = path.join(args.runDir, 'raw', 'ads');
  const imgDir = path.join(args.runDir, 'field', 'creatives');
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(imgDir, { recursive: true });
  const allCandidates: Candidate[] = [];
  const notes: string[] = [];
  for (const name of args.candidateMasters.slice(0, 2)) {
    const page = await resolvePage(name);
    if (!page) { notes.push(`${name}: UNRESOLVED`); continue; }
    const { raw, error } = await scrapePage(page.pageId, name, args.market, 2);
    if (!raw.length) { notes.push(`${name}: ${error ?? 'no active ads'}`); continue; }
    fs.writeFileSync(path.join(rawDir, `hunt-${slug(name)}.json`), JSON.stringify(raw), 'utf8');
    const tri = triageAds(raw, page.pageName || name, page.pageId, 'competitor');
    allCandidates.push(...tri.candidates);
    notes.push(`${name}: ${raw.length} ads → ${tri.candidates.length} candidates`);
  }
  const clusters = clusterCandidates(allCandidates);
  const top = rankHunt(scoreClusters(clusters), args.format); // S155 F23: on-format first, up to 10
  const onFormatCount = top.filter((t) => t.onFormat).length;
  const hasFingerprint = args.format in FORMAT_FINGERPRINTS;
  let downloaded = 0;
  if (args.download !== false) {
    for (const { s } of top) {
      const b = s.cluster.best;
      if (b.imageUrl && (await downloadImage(b.imageUrl, path.join(imgDir, `hunt_${b.id}.jpg`)))) downloaded++;
    }
  }
  const manifest = {
    hunt: args.format,
    masters: args.candidateMasters,
    // huntFoundFormat is what the spec validator reads for experimental-slot
    // legality: an off-format hunt counts as "found nothing" (S155 F23).
    huntFoundFormat: onFormatCount > 0,
    fingerprintAvailable: hasFingerprint,
    results: top.map(({ s, onFormat }) => ({
      id: `hunt_${s.cluster.best.id}`,
      onFormat,
      advertiser: s.cluster.best.advertiser,
      imagePath: fs.existsSync(path.join(imgDir, `hunt_${s.cluster.best.id}.jpg`)) ? path.join('field', 'creatives', `hunt_${s.cluster.best.id}.jpg`) : null,
      clusterSize: s.cluster.size,
      daysRunning: s.cluster.best.daysRunning,
      title: s.cluster.best.title,
      body: s.cluster.best.body,
      cta: s.cluster.best.cta,
      scores: { workhorse: +s.workhorseScore.toFixed(3), anatomy: +s.anatomy.toFixed(3) },
    })),
  };
  const p = path.join(args.runDir, 'field', 'manifest-hunt.json');
  fs.writeFileSync(p, JSON.stringify(manifest, null, 2) + '\n');
  // S155 F23: never let "the masters' best ads" masquerade as "the format, found".
  const formatHonesty = top.length === 0
    ? `NOTHING FOUND — the format gap stays open; record "hunt found nothing" in honesty[] (one flagged experimental slot is now legal downstream).`
    : !hasFingerprint
      ? `NO COPY FINGERPRINT exists for "${args.format}" — these are the masters' BEST ads, NOT format-filtered. Judge by EYE which (if any) actually run the format; if none do, the gap stays OPEN and counts as "found nothing" (experimental slot legal).`
      : onFormatCount === 0
        ? `⚠ NONE of the ${top.length} results fingerprint-match "${args.format}" — these are the masters' best ads, NOT the ordered format. The gap stays OPEN: record "hunt found nothing on-format" in honesty[]; the flagged experimental slot is now legal downstream. Do not pick an off-format ad as if it filled the gap.`
        : `${onFormatCount}/${top.length} results fingerprint-match "${args.format}" (ranked first, "onFormat": true in the manifest). The rest are the masters' best ads, unfiltered — verify the matches by EYE before picking.`;
  return [
    `HUNT COMPLETE (${args.format}) → field/manifest-hunt.json · ${downloaded} image(s) downloaded.`,
    ...notes.map((n) => `  · ${n}`),
    formatHonesty,
  ].join('\n');
}

// ── The MCP server ───────────────────────────────────────────────────────────
export function createHarvestServer(runDir: string, founderDomain: string) {
  const harvestTool = tool(
    'harvest',
    'THE deterministic field harvest — one call does everything mechanical: resolves competitor/adjacent names to Meta pages (own-brand pages are auto-dropped), scrapes 60–90 ads per competitor (1 page per adjacent), triages (DPA excluded but counted as SKU intel; DCO cards EXPLODED into design siblings; boosted organic posts skipped; video kept via poster frame), clusters duplicates (collation ∪ landing page ∪ copy identity), scores per LANE (workhorse/fresh/adjacent/wildcard — no single composite), downloads the ~24-image pool to field/creatives/, and writes field/manifest.json with a full dossier per candidate. Call it ONCE with the competitor + adjacent names from research.md. Then Read the manifest and run your vision pass.',
    {
      competitorNames: z.array(z.string().min(1)).min(2).max(10).describe('Competitor brand names from research.md COMPETITOR CANDIDATES (6–8 ideal). Include the domain when research names one — "Snitch — snitch.co.in" — the resolver uses it to reject namesake pages.'),
      adjacentNames: z.array(z.string().min(1)).max(5).describe('Adjacent advertisers (same buyer, different category) from research.md — 2–4. Same "Name — domain" form when known.'),
      market: z.string().min(2).max(2).describe('ISO country of the buyer market, e.g. "IN".'),
      nicheKeywords: z.array(z.string().min(2)).max(4).optional().describe('2–4 category words for the resolver\'s niche guard, e.g. ["clothing","apparel","fashion"] — a right-category page wins a tie, never overrides a name match.'),
    },
    async (a) => {
      try {
        const out = await harvestRun({
          competitorNames: a.competitorNames,
          adjacentNames: a.adjacentNames,
          market: a.market.toUpperCase(),
          founderDomain,
          runDir,
          nicheKeywords: a.nicheKeywords,
          onLog: (l) => process.stderr.write(`[harvest] ${l}\n`),
        });
        return { content: [{ type: 'text' as const, text: out.summary }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `HARVEST FAILED: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );

  const huntTool = tool(
    'hunt_format',
    'FORMAT HUNT — when your field-summary orders one (openLane type "format-gap"): narrow scrape of the 2 named MASTER pages (advertisers who run the missing format at home), same triage/cluster/scoring, results to field/manifest-hunt.json + images to field/creatives/hunt_*.jpg. MAX 1 hunt per run — a second call is refused. If the hunt finds nothing, the gap stays open and you say so honestly.',
    {
      format: z.string().min(1).describe('The missing formatFamily being hunted (from the closed table).'),
      candidateMasters: z.array(z.string().min(1)).min(1).max(2).describe('The 2 master advertiser names (derived from format→home-category knowledge).'),
      market: z.string().min(2).max(2).describe('ISO market country.'),
    },
    async (a) => {
      try {
        const text = await huntRun({ format: a.format, candidateMasters: a.candidateMasters, market: a.market.toUpperCase(), runDir });
        return { content: [{ type: 'text' as const, text }] };
      } catch (err) {
        return { content: [{ type: 'text' as const, text: `HUNT FAILED: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );

  return createSdkMcpServer({ name: 'field', version: '0.1.0', tools: [harvestTool, huntTool] });
}

export const HARVEST_TOOL = 'mcp__field__harvest';
export const HUNT_TOOL = 'mcp__field__hunt_format';
