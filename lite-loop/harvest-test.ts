/**
 * harvest-test.ts — P1 standalone validation (NO model calls, NO API credits).
 *
 *   npm run test:harvest
 *
 * Fixtures:
 *   fixtures/bewakoof-raw.json   raw company/ads payload — 7 DCO ads with static cards
 *   fixtures/snitch-raw.json     raw company/ads payload — 16 DPA + video-heavy page
 *   docs/research/ad-library/india-menswear-d2c-2026-07-16/corpus.json
 *                                10-brand SHAPED corpus (no snapshot) → adapter below
 *
 * Asserts (plan §9 P1): DCO card explosion · is_reshared boosted filter (synthesized —
 * zero live cases in the fixtures) · DPA exclusion + SKU intel · the BLUORNG ×4 cluster
 * merge · lane winners (workhorse ≥21d, fresh ≤45d) · per-advertiser caps · thin-field flag.
 * Run-3 fix batch (S155 F20–F28): single-token resolver · pick-count thin-field +
 * adjacent cap + wildcard announcement · pick uniqueness · hunt fingerprint ranking ·
 * on-image placeholder/video-chrome/SVG-ref spec guards · collect-ALL validators ·
 * p<N> sourcePick alias · SVG intrinsic size + live logo rasterization.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  triageAds, clusterCandidates, scoreClusters, selectLanes, planDownloads,
  nameMatches, parseRosterEntry, normText, POOL_FILE_CAP, PICK_QUOTA_MIN,
  FORMAT_FINGERPRINTS, rankHunt, type Candidate,
} from './mcp/harvest.ts';
import { verdictProblem, researchProblem, summaryProblem, pickProblem, specProblem, type PickIndex } from './pipeline.ts';
import { svgIntrinsicSize, rasterizeSvgLogo, discoverPages, packShotInventory, patchSvgBindNote, MAX_PDPS } from './capture.ts';
import { productUrlProblem } from './mcp/capture-products.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');
const CORPUS = join(__dirname, '..', 'docs', 'research', 'ad-library', 'india-menswear-d2c-2026-07-16', 'corpus.json');

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); };
};

// Freeze "now" at the corpus pull date so daysRunning matches the committed data.
const NOW = Date.parse('2026-07-16T00:00:00Z');

// ── 1) DCO explosion + triage counts on RAW payloads ────────────────────────
console.log('\n[1] bewakoof-raw.json — DCO explosion');
const bewakoof = JSON.parse(fs.readFileSync(join(FIXTURES, 'bewakoof-raw.json'), 'utf8'));
const bkAds: any[] = bewakoof.results;
const bkTri = triageAds(bkAds, 'Bewakoof', '145543022589681', 'competitor', NOW);

const dcoWithStatics = bkAds.filter((a) => a?.snapshot?.display_format === 'DCO' && (a.snapshot.cards ?? []).some((c: any) => (c.original_image_url || c.resized_image_url) && !(c.video_hd_url || c.video_sd_url)));
check(`fixture has DCO ads with static cards (${dcoWithStatics.length})`, dcoWithStatics.length >= 3);
for (const ad of dcoWithStatics.slice(0, 3)) {
  const id = String(ad.ad_archive_id);
  const siblings = bkTri.candidates.filter((c) => c.archiveId === id);
  const staticCards = ad.snapshot.cards.filter((c: any) => (c.original_image_url || c.resized_image_url) && !(c.video_hd_url || c.video_sd_url)).length;
  check(`ad ${id}: ${staticCards} static cards → ${siblings.length} sibling candidates`, siblings.length === staticCards);
  check(`ad ${id}: siblings share copy, differ by cardIndex`,
    new Set(siblings.map((c) => c.body)).size === 1 && new Set(siblings.map((c) => c.cardIndex)).size === siblings.length);
  check(`ad ${id}: siblings carry dcoSiblings=${staticCards}`, siblings.every((c) => c.dcoSiblings === staticCards));
}
const bkClusters = clusterCandidates(bkTri.candidates);
const firstDco = String(dcoWithStatics[0].ad_archive_id);
const dcoCluster = bkClusters.find((cl) => cl.members.some((m) => m.archiveId === firstDco));
check('DCO siblings land in ONE cluster (they are one test pool, not three ads)', Boolean(dcoCluster) && dcoCluster!.members.filter((m) => m.archiveId === firstDco).length >= 2);
check('DCO cluster size counts the card siblings (iteration signal)', (dcoCluster?.size ?? 0) >= 2);

// ── 2) is_reshared boosted filter (synthesized — no live case in fixtures) ──
console.log('\n[2] boosted-post filter (is_reshared)');
const boostedAd = JSON.parse(JSON.stringify(bkAds.find((a) => a?.snapshot?.display_format === 'IMAGE')));
boostedAd.snapshot.is_reshared = true;
boostedAd.ad_archive_id = 'SYNTH_BOOSTED_1';
const bkTri2 = triageAds([...bkAds, boostedAd], 'Bewakoof', '145543022589681', 'competitor', NOW);
check('is_reshared ad is skipped and counted', bkTri2.boostedSkipped === bkTri.boostedSkipped + 1
  && !bkTri2.candidates.some((c) => c.archiveId === 'SYNTH_BOOSTED_1'));

// ── 3) DPA exclusion + SKU-push intel on snitch-raw ─────────────────────────
console.log('\n[3] snitch-raw.json — DPA exclusion + video poster keep');
const snitch = JSON.parse(fs.readFileSync(join(FIXTURES, 'snitch-raw.json'), 'utf8'));
const snAds: any[] = snitch.results;
const snTri = triageAds(snAds, 'Snitch', '236672023872356', 'competitor', NOW);
const rawDpa = snAds.filter((a) => a?.snapshot?.display_format === 'DPA').length;
check(`all ${rawDpa} DPA ads excluded and counted`, snTri.dpaCount >= rawDpa);
check('DPA exclusion recorded SKU paths (push intel)', snTri.dpaSkuPaths.length > 0 || rawDpa === 0);
check('no DPA leaked into candidates', !snTri.candidates.some((c) => c.format === 'DPA'));
const rawVideo = snAds.filter((a) => a?.snapshot?.display_format === 'VIDEO').length;
check(`video ads kept via poster frame (${snTri.videoKept}/${rawVideo})`, snTri.videoKept > 0 && snTri.candidates.some((c) => c.renderSource === 'poster'));

// ── 4) corpus adapter → BLUORNG ×4 merge, lanes, caps, thin field ────────────
console.log('\n[4] corpus.json — clustering + lane model');
const corpus = JSON.parse(fs.readFileSync(CORPUS, 'utf8'));
const ADJACENT = new Set(['Rare Rabbit', 'Veirdo']); // designated adjacents for the test

/** Shaped corpus ad → synthetic raw payload (the corpus predates raw dumping). */
function toRaw(a: any): any {
  const [ctaText, ctaType] = String(a.cta ?? '').split(' / ');
  const isVideo = a.mediaFormat === 'VIDEO';
  return {
    ad_archive_id: a.archiveId,
    start_date: Date.parse(a.launched) / 1000,
    is_active: a.active,
    collation_count: a.variants,
    snapshot: {
      display_format: a.mediaFormat,
      body: { text: a.body ?? '' },
      title: a.title ?? null,
      cta_text: ctaText || undefined,
      cta_type: ctaType || undefined,
      link_url: a.linkDomain && a.linkDomain !== 'n/a' ? `https://${a.linkDomain}/` : undefined,
      images: !isVideo && a.firstImageUrl ? [{ original_image_url: a.firstImageUrl }] : [],
      videos: isVideo && a.firstImageUrl ? [{ video_preview_image_url: a.firstImageUrl }] : [],
      cards: [],
    },
  };
}

const all: Candidate[] = [];
for (const b of corpus.brands) {
  const bucket = ADJACENT.has(b.brand) ? ('adjacent' as const) : ('competitor' as const);
  const tri = triageAds(b.ads.map(toRaw), b.brand, b.page_id, bucket, NOW);
  all.push(...tri.candidates);
}
check(`corpus adapts to ${all.length} candidates across 10 brands`, all.length >= 60);

const clusters = clusterCandidates(all);
const bluorngShopNow = clusters.filter((cl) => cl.advertiser === 'Bluorng' && normText(cl.best.body) === normText('BLUORNG T-Shirts. Shop now.'));
check('BLUORNG ×4: the four separately-listed "BLUORNG T-Shirts. Shop now." ads merge into ONE cluster',
  bluorngShopNow.length === 1 && new Set(bluorngShopNow[0].members.map((m) => m.archiveId)).size === 4,
  `got ${bluorngShopNow.length} cluster(s), sizes ${bluorngShopNow.map((c) => new Set(c.members.map((m) => m.archiveId)).size).join(',')}`);
check('clustering compresses the field (fewer clusters than candidates)', clusters.length < all.length);

const scored = scoreClusters(clusters);
const sel = selectLanes(scored);
const lanes = sel.picks.reduce<Record<string, number>>((m, p) => ((m[p.lane] = (m[p.lane] ?? 0) + 1), m), {});
console.log(`    lanes: ${JSON.stringify(lanes)} · competitor clusters: ${sel.clusterCount}`);

check('workhorse lane filled and every pick ≥21 days',
  (lanes.workhorse ?? 0) >= 4 && sel.picks.filter((p) => p.lane === 'workhorse').every((p) => (p.s.cluster.best.daysRunning ?? 0) >= 21));
check('fresh lane filled and every pick ≤45 days',
  (lanes.fresh ?? 0) >= 3 && sel.picks.filter((p) => p.lane === 'fresh').every((p) => (p.s.cluster.best.daysRunning ?? 99) <= 45));
check('adjacent lane only from designated adjacent brands',
  sel.picks.filter((p) => p.lane === 'adjacent').every((p) => ADJACENT.has(p.s.cluster.best.advertiser))
  && (lanes.adjacent ?? 0) >= 1);
check('wildcard pool present', (lanes.wildcard ?? 0) >= 2);
// S155 F21: adjacent is capped RELATIVE to the pool (~25% of picks), and the
// empty-wildcard announcement mirrors reality.
{
  const adjN = lanes.adjacent ?? 0;
  const adjCap = Math.min(4, Math.max(1, Math.floor((sel.picks.length - adjN) / 3)));
  check(`adjacent capped at ~25% of picks (${adjN} ≤ ${adjCap})`, adjN <= adjCap);
  check('wildcardsEmpty flag mirrors the wildcard count', sel.wildcardsEmpty === ((lanes.wildcard ?? 0) === 0));
}

for (const lane of ['workhorse', 'fresh'] as const) {
  const perAdv = new Map<string, number>();
  for (const p of sel.picks.filter((x) => x.lane === lane)) {
    const k = p.s.cluster.best.pageId;
    perAdv.set(k, (perAdv.get(k) ?? 0) + 1);
  }
  check(`per-advertiser cap holds in ${lane} (≤2)`, [...perAdv.values()].every((n) => n <= 2));
}
// S155 F3 + S156 headroom: no advertiser holds more than 3 SCORED picks; wildcards
// may add at most 1 more (run 5: workhorse+fresh exhausted every cap before the
// wildcard pass, so the oddball lane was structurally unfillable)
{
  const scoredAdv = new Map<string, number>();
  const totalAdv = new Map<string, number>();
  for (const p of sel.picks) {
    const k = p.s.cluster.best.pageId;
    totalAdv.set(k, (totalAdv.get(k) ?? 0) + 1);
    if (p.lane !== 'wildcard') scoredAdv.set(k, (scoredAdv.get(k) ?? 0) + 1);
  }
  const worstScored = Math.max(...scoredAdv.values());
  const worstTotal = Math.max(...totalAdv.values());
  check(`GLOBAL cap holds on scored lanes (max ${worstScored} ≤ 3)`, worstScored <= 3);
  check(`wildcard headroom bounded (max total ${worstTotal} ≤ 4)`, worstTotal <= 4);
}
// S155 F2: the download pool is CAPPED and siblings only ride with workhorse DCO picks
{
  const plan = planDownloads(sel.picks);
  check(`download plan ≤ ${POOL_FILE_CAP} files (got ${plan.length}; run 1 downloaded 59)`, plan.length <= POOL_FILE_CAP);
  const wkIds = new Set(sel.picks.filter((p) => p.lane === 'workhorse').map((p) => p.s.cluster.best.archiveId));
  check('every sibling in the plan belongs to a workhorse DCO pick',
    plan.filter((d) => d.isSibling).every((d) => wkIds.has(d.candidate.archiveId)));
  check('plan covers every pick with an image (best member each)',
    plan.filter((d) => !d.isSibling).length === sel.picks.filter((p) => p.s.cluster.best.imageUrl).length
    || plan.length === POOL_FILE_CAP);
}

// ── 6) resolver guards (S155 F5 + F20 — namesakes on single-token names) ────
console.log('\n[6] resolver name-matching + roster parsing');
check('"Snitch" REJECTS "No Snitches Allowed"', nameMatches('Snitch', 'No Snitches Allowed') === false);
check('"Snitch" matches "Snitch"', nameMatches('Snitch', 'Snitch') === true);
check('"Beardo" matches "BEARDO for Men"', nameMatches('Beardo', 'BEARDO for Men') === true);
check('"The Man Company" matches "The MAN Company"', nameMatches('The Man Company', 'The MAN Company') === true);
check('"Rare Rabbit" rejects "Rabbit Foods"', nameMatches('Rare Rabbit', 'Rabbit Foods') === false);
// F20: single-token queries — the run-2 namesakes must fail, brand-led names must pass
check('"Pine" REJECTS "Cardinal & Pine" (the run-2 US news outlet)', nameMatches('Pine', 'Cardinal & Pine') === false);
check('"Perch" REJECTS "Fort Perch Rock Battery" (the run-2 UK museum)', nameMatches('Perch', 'Fort Perch Rock Battery') === false);
check('"Pine" matches "Pine Financial" (brand token leads)', nameMatches('Pine', 'Pine Financial') === true);
check('"Perch" matches "The Perch" (leading stopword skipped)', nameMatches('Perch', 'The Perch') === true);
const r1 = parseRosterEntry('Snitch — snitch.co.in');
check(`roster "Snitch — snitch.co.in" → name "${r1.name}" + domain "${r1.domain}"`, r1.name === 'Snitch' && r1.domain === 'snitch.co.in');
const r2 = parseRosterEntry('Bombay Shirt Company');
check('roster without domain keeps the name, null domain', r2.name === 'Bombay Shirt Company' && r2.domain === null);

// ── 7) Write-validators (S155 F9 — the schema-drift killers) ────────────────
console.log('\n[7] pipeline validators');
const goodVerdict = JSON.stringify({
  specs: [
    { id: 'c1', verdict: 'SHIP', kills: [], flags: [], captionFixes: ["remove 'Ships today' — no shipping anchor exists"], rank: 1 },
    { id: 'c2', verdict: 'KILL', kills: [{ check: 'ANCHOR', evidence: 'copy says 4.9; artifact [B2] says 4.6 — does not trace' }], flags: [], rank: 2, autopsyLine: 'Re-anchor the rating to [B2] or drop the number.' },
  ],
  batch: { diversityAudit: 'two specs, two families, contract satisfied at this size.', shipList: ['c1'], batchOutcome: 'THIN (2-3 ship)' },
});
check('verdict with captionFixes passes', verdictProblem(goodVerdict) === null);
check('verdict with junk captionFixes fails', verdictProblem(goodVerdict.replace('["remove \'Ships today\' — no shipping anchor exists"]', '[42]')) !== null);
check('research over 8000 chars fails', researchProblem('x'.repeat(8100)) !== null);
// S155 F31: the denial is SURGICAL — run 3's seat trimmed 27k→15k→12.5k over three
// turns against a vague "compress" and never landed. It must state the overage, the
// prose/table cost, and the exact line format, in ONE decisive order.
{
  const bloated = [
    '## Artifacts',
    ...Array.from({ length: 20 }, (_, i) => `[A${i + 1}] "fact ${i}" — home.txt`),
    // 60 × ~140 chars of prose ≈ 8.4k on their own — the fixture must actually EXCEED
    // the 8000 cap or the denial never fires (the first draft of this test was 7.6k
    // and probed a null)
    ...Array.from({ length: 60 }, () => 'This artifact matters because the buyer needs reassurance at the decision moment, and the brand has said so repeatedly across the site copy.'),
    '| col | col |', '| --- | --- |', ...Array.from({ length: 30 }, (_, i) => `| row ${i} | some value here that costs characters |`),
    '## Competitor candidates', '- Snitch — snitch.co.in',
  ].join('\n');
  const p = researchProblem(bloated);
  check('F31 denial states the exact overage and the ~7000 target', p !== null && /\d+ OVER the 8000-char hard cap/.test(p) && p.includes('7000'));
  check('F31 denial counts the prose lines carrying the weight', p !== null && /\d+ such lines are carrying \d+ chars/.test(p));
  check('F31 denial names the table cost when tables exist', p !== null && /DELETE every markdown table \(\d+ chars\)/.test(p));
  check('F31 denial prescribes the one-line artifact format', p !== null && p.includes('[A1] "verbatim quote or number" — source-file'));
  check('F31 denial forbids cutting evidence', p !== null && p.includes('cutting WORDS, never evidence'));
  const noTables = researchProblem(bloated.split('\n').filter((l) => !l.trim().startsWith('|')).join('\n'));
  check('F31 denial adapts when there are no tables to cut', noTables !== null && noTables.includes('no tables to cut'));
}
const goodResearch = '## Artifacts\n' + Array.from({ length: 16 }, (_, i) => `[A${i + 1}] fact ${i}`).join('\n') + '\n## Competitor candidates\n- Snitch — snitch.co.in';
check('research with 16 artifacts + candidates passes', researchProblem(goodResearch) === null);
check('research without candidates section fails', researchProblem(goodResearch.replace('## Competitor candidates', '## Rivals')) !== null);
const goodSummary = JSON.stringify({ register: 'premium-clinical: evidence "Giza Cotton Shirts" (p5), "Summer in Linen" (p4) — controlled, fabric-forward.', formatShare: { counts: { 'product-hero': 3 }, read: 'pack-shot dominant' }, openLane: { type: 'claim-gap', description: 'x' }, intel: [], doNotClone: [], honesty: [] });
check('summary on schema passes', summaryProblem(goodSummary) === null);
check('summary with wrong keys fails (the run-1 v1 case)', summaryProblem(JSON.stringify({ totalPicks: 5, laneCounts: {} })) !== null);
const manifest = new Map([['bsc_123_c0', { lane: 'wildcard' }]]);
const NO_DUPES = new Map<string, string>();
const goodPick = { pick: 1, id: 'bsc_123_c0', lane: 'wildcard', fillsQuota: 'workhorse', promotionReason: 'construction quality outranks its 9-day age; stated override per the law', fourQuestions: { construction: 'three folded shirts stacked, hero on top, headline mid-frame over product'.padEnd(60, '.'), drCheck: 'yes — logistics chip does the conversion work; my eye overrules the regex here'.padEnd(60, '.'), lesson: 'this market rewards a logistics promise over a discount at the decision moment'.padEnd(60, '.'), cloneRisk: 'high on the surface, low on the structure; adapt with mono surface + texture story'.padEnd(60, '.') }, formatFamily: 'product-hero', claimType: 'offer', hook: { text: 'New Giza Cotton Shirts' }, renderability: 'HIGH' };
check('pick with verbatim lane + fillsQuota passes', pickProblem(JSON.stringify(goodPick), manifest, NO_DUPES) === null);
check('pick RELABELING lane fails (the run-1 F4 case)', pickProblem(JSON.stringify({ ...goodPick, lane: 'workhorse' }), manifest, NO_DUPES) !== null);
check('pick with unknown id fails', pickProblem(JSON.stringify({ ...goodPick, id: 'invented_999' }), manifest, NO_DUPES) !== null);
// S155 F22: a candidate already covered by another pick file is a DENIAL naming the file
{
  const dup = pickProblem(JSON.stringify(goodPick), manifest, new Map([['bsc_123_c0', 'p5']]));
  check('duplicate pick id is denied and names the covering file (F22)', dup !== null && dup.includes('p5') && /honesty/.test(dup));
}
// S155 F26: a pick with several defects reports them ALL in one denial
{
  const multi = pickProblem(JSON.stringify({ ...goodPick, lane: 'nonsense', claimType: 'vibes', hook: {} }), manifest, NO_DUPES);
  check('pick validator collects ALL violations (F26)', multi !== null && multi.includes('(1)') && multi.includes('(3)'));
}
const picks: PickIndex = { ids: new Set(['bsc_123_c0']), aliases: new Map([['p1', 'bsc_123_c0']]) };
const goodSpec = { creative: 1, sourcePick: 'bsc_123_c0', experimental: false, formatFamily: 'product-hero', claimType: 'offer', persona: 'urban man 25-35, product-aware', hook: { text: 'Art. In Black.' }, primaryText: 'x', headline: 'y', cta: 'Shop now', visual: { productZone: 'off-white camp-collar shirt with black brushstroke print, from _0.jpg', palette: ['#121212'] }, anchors: ['E1'], renderRefs: ['assets/x.jpg'], validity: 'none', compliance: 'no personal attributes' };
check('spec on canonical schema passes', specProblem(JSON.stringify(goodSpec), picks, 'claim-gap', 'no-hunt') === null);
check('spec missing persona fails (run-1 drift)', specProblem(JSON.stringify({ ...goodSpec, persona: undefined }), picks, 'claim-gap', 'no-hunt') !== null);
check('spec with invented family fails', specProblem(JSON.stringify({ ...goodSpec, formatFamily: 'identity-statement' }), picks, 'claim-gap', 'no-hunt') !== null);
check('spec with unknown sourcePick fails', specProblem(JSON.stringify({ ...goodSpec, sourcePick: 'import:research[D5]'.replace('import:', '') }), picks, 'claim-gap', 'no-hunt') !== null);
check('openlane: spec passes when a lane is open', specProblem(JSON.stringify({ ...goodSpec, sourcePick: 'openlane:[D5,D7]' }), picks, 'claim-gap', 'no-hunt') === null);
check('openlane: spec fails when no lane is open', specProblem(JSON.stringify({ ...goodSpec, sourcePick: 'openlane:[D5,D7]' }), picks, 'none', 'no-hunt') !== null);
// S155 F27: the pick FILE name is an accepted alias (normalized on landing by the harness)
check('sourcePick "p1" (pick file alias) passes', specProblem(JSON.stringify({ ...goodSpec, sourcePick: 'p1' }), picks, 'claim-gap', 'no-hunt') === null);
check('sourcePick "p9" (no such pick file) fails', specProblem(JSON.stringify({ ...goodSpec, sourcePick: 'p9' }), picks, 'claim-gap', 'no-hunt') !== null);
// S155 F23: experimental-slot legality is CODE-checked against the hunt record
{
  const exp = { ...goodSpec, sourcePick: 'experimental', experimental: true };
  check('experimental passes after a hunt that found nothing', specProblem(JSON.stringify(exp), picks, 'format-gap', 'found-nothing') === null);
  check('experimental fails when NO hunt has run', specProblem(JSON.stringify(exp), picks, 'format-gap', 'no-hunt') !== null);
  check('experimental fails when the hunt FOUND the format', specProblem(JSON.stringify(exp), picks, 'format-gap', 'found-format') !== null);
}
// S155 F24: bracketed placeholders are caption-legal ONLY — on-image they render as pixels
check('placeholder in hook.text fails (the "[Rate]%" case)', specProblem(JSON.stringify({ ...goodSpec, hook: { text: 'Big banks: [Rate]%' } }), picks, 'claim-gap', 'no-hunt') !== null);
check('placeholder in headline fails', specProblem(JSON.stringify({ ...goodSpec, headline: 'Rates as of [Month Year]' }), picks, 'claim-gap', 'no-hunt') !== null);
check('placeholder in visual text fails', specProblem(JSON.stringify({ ...goodSpec, visual: { ...goodSpec.visual, textPlacement: 'rate cells read [Rate]% each' } }), picks, 'claim-gap', 'no-hunt') !== null);
check('placeholder in primaryText (caption) is ALLOWED', specProblem(JSON.stringify({ ...goodSpec, primaryText: 'Rates from [Rate]% — filled at launch.' }), picks, 'claim-gap', 'no-hunt') === null);
// S155 F25: lite ships static images — video chrome in the spec is rejected at write time
check('"play button" in visual.scene fails (the run-2 c4 case)', specProblem(JSON.stringify({ ...goodSpec, visual: { ...goodSpec.visual, scene: 'advisor at desk; white circle play button centered' } }), picks, 'claim-gap', 'no-hunt') !== null);
check('"VIDEO POSTER FRAME" in visual.scene fails', specProblem(JSON.stringify({ ...goodSpec, visual: { ...goodSpec.visual, scene: 'This is a VIDEO POSTER FRAME — the static image for a video ad' } }), picks, 'claim-gap', 'no-hunt') !== null);
// S155 F28: SVG renderRefs are rejected (providers refuse them; the mark would be model-drawn)
check('renderRefs with an .svg fails and points at the PNG', (() => { const p = specProblem(JSON.stringify({ ...goodSpec, renderRefs: ['assets/logo-site.svg'] }), picks, 'claim-gap', 'no-hunt'); return p !== null && p.includes('logo-site.png'); })());
// S155 F26: a spec with several defects reports them ALL in one denial (run 2's c1 took 4 round-trips)
{
  const multi = specProblem(JSON.stringify({ ...goodSpec, persona: undefined, validity: undefined, compliance: undefined }), picks, 'claim-gap', 'no-hunt');
  check('spec validator collects ALL violations (F26)', multi !== null && multi.includes('persona') && multi.includes('validity') && multi.includes('compliance') && multi.includes('(3)'));
}
// S155 F26 on the verdict too
{
  const badVerdict = JSON.stringify({
    specs: [
      { id: 'c1', verdict: 'MAYBE', kills: [], flags: [], rank: 1 },
      { id: 'c2', verdict: 'KILL', kills: [], flags: [], rank: 2 },
    ],
    batch: { diversityAudit: 'two specs, contract satisfied at this size, near-dupes none.', shipList: [], batchOutcome: 'THIN (2-3 ship)' },
  });
  const multi = verdictProblem(badVerdict);
  check('verdict validator collects ALL violations (F26)', multi !== null && multi.includes('c1') && multi.includes('c2') && multi.includes('(1)'));
}
check('no pick from two lanes (no double-dipping)', new Set(sel.picks.map((p) => p.s)).size === sel.picks.length);
check('a fresh test outranks nothing by age alone — freshness component is 0 past 45d',
  scored.filter((s) => (s.cluster.best.daysRunning ?? 0) > 45).every((s) => s.freshness === 0));
check('full corpus is NOT a thin field', sel.thinField === false);

// ── 8) thin-field flag on a starved input (S155 F21: keys on PICK count) ────
console.log('\n[8] thin-field fallback');
const onlyBluorng = all.filter((c) => c.advertiser === 'Bluorng');
const thinSel = selectLanes(scoreClusters(clusterCandidates(onlyBluorng)));
check(`single-brand slice trips the thin-field flag (${thinSel.picks.length} picks < ${PICK_QUOTA_MIN})`,
  thinSel.thinField === true && thinSel.picks.length < PICK_QUOTA_MIN);
// F21: run 2's exact failure shape — MORE than 10 clusters but FEWER than 12 picks
// must still read THIN (the old cluster-count flag said "field depth ok")
{
  const emptySel = selectLanes([]);
  check('an empty field is THIN and announces the empty wildcard pool', emptySel.thinField === true && emptySel.wildcardsEmpty === true);
}

// ── 9) hunt fingerprint ranking (S155 F23) ───────────────────────────────────
console.log('\n[9] hunt format fingerprints + ranking');
check('testimonial fingerprint matches quoted-review copy',
  FORMAT_FINGERPRINTS['testimonial-card'].test('"They made switching so easy" — verified buyer, 5 stars'));
check('testimonial fingerprint REJECTS an aggregate-stat proof line (the Borrowell case)',
  !FORMAT_FINGERPRINTS['testimonial-card'].test('4 million Canadians trust Borrowell'));
check('us-vs-them fingerprint matches comparison copy',
  FORMAT_FINGERPRINTS['us-vs-them'].test('Unlike the big banks, we shop 30 lenders for you'));
{
  const mkRaw = (id: string, body: string, days: number) => ({
    ad_archive_id: id,
    start_date: (NOW - days * 86_400_000) / 1000,
    is_active: true,
    collation_count: 1,
    snapshot: {
      display_format: 'IMAGE',
      body: { text: body },
      title: null,
      cta_text: 'Learn more',
      cta_type: 'LEARN_MORE',
      link_url: `https://policyme.example/quote/${id}`, // distinct LPs — the LP-identity join must not merge these
      images: [{ original_image_url: `https://cdn.example/${id}.jpg` }],
      videos: [],
      cards: [],
    },
  });
  const tri = triageAds([
    mkRaw('H1', 'Couples save on their first year of life insurance. Get a quote today.', 60),
    mkRaw('H2', '"I had a policy in 20 minutes. Painless." — verified buyer review, 5 stars', 30),
    mkRaw('H3', 'Most plans cap mental health coverage. This one does not.', 45),
  ], 'PolicyMe', '999', 'competitor', NOW);
  const ranked = rankHunt(scoreClusters(clusterCandidates(tri.candidates)), 'testimonial-card');
  check('rankHunt puts the on-format candidate FIRST and flags it', ranked.length === 3 && ranked[0].onFormat === true && ranked[0].s.cluster.best.archiveId === 'H2');
  check('rankHunt marks off-format candidates onFormat=false', ranked.slice(1).every((r) => r.onFormat === false));
  const unmapped = rankHunt(scoreClusters(clusterCandidates(tri.candidates)), 'product-hero');
  check('a format with no fingerprint ranks by score, all onFormat=false (counts as found-nothing)', unmapped.every((r) => r.onFormat === false));
}

// ── 10) capture: SVG logo rasterization (S155 F28) ───────────────────────────
console.log('\n[10] SVG logo → PNG (F28 — providers reject SVG refs)');
check('svgIntrinsicSize reads width/height attrs', JSON.stringify(svgIntrinsicSize('<svg width="200" height="100"><rect/></svg>')) === '{"w":200,"h":100}');
check('svgIntrinsicSize reads px-suffixed attrs', JSON.stringify(svgIntrinsicSize('<svg width="88px" height="30px"><path/></svg>')) === '{"w":88,"h":30}');
check('svgIntrinsicSize falls back to the viewBox', JSON.stringify(svgIntrinsicSize('<svg viewBox="0 0 400 150"><path/></svg>')) === '{"w":400,"h":150}');
check('svgIntrinsicSize is null with neither', svgIntrinsicSize('<svg><path/></svg>') === null);
{
  // live rasterization through headless Chromium — the actual run-3 fix path
  const tmp = fs.mkdtempSync(join(os.tmpdir(), 'lite-raster-'));
  fs.mkdirSync(join(tmp, 'assets'), { recursive: true });
  fs.writeFileSync(join(tmp, 'assets', 'logo-site.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><rect width="120" height="40" fill="#011a40"/><circle cx="20" cy="20" r="12" fill="#46be8a"/></svg>');
  const png = await rasterizeSvgLogo(tmp);
  const buf = png ? fs.readFileSync(png) : Buffer.alloc(0);
  check('rasterizeSvgLogo writes a real PNG (magic bytes, >100 bytes)',
    png !== null && png.endsWith('logo-site.png') && buf.length > 100 && buf[0] === 0x89 && buf[1] === 0x50,
    png === null ? 'returned null — is Playwright/Chromium installed?' : `got ${buf.length} bytes`);
  check('rasterizeSvgLogo never clobbers an existing PNG', (await rasterizeSvgLogo(tmp)) === join(tmp, 'assets', 'logo-site.png') && fs.readFileSync(join(tmp, 'assets', 'logo-site.png')).equals(buf));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ── 12) S156 run-5 fixes: wildcard headroom · confabulation guard · null captionFixes · svg note ──
console.log('\n[12] S156 fixes');
{
  // run-5 shape in miniature: ONE advertiser owns every cluster; without headroom
  // the wildcard pass gets exactly 1 slot (cap 3 − workhorse 2), with headroom 2.
  const mkAd = (id: string, body: string) => ({
    ad_archive_id: id,
    start_date: (NOW - 60 * 86_400_000) / 1000, // 60d: workhorse-eligible, too old for fresh
    is_active: true,
    collation_count: 1,
    snapshot: {
      display_format: 'IMAGE', body: { text: body }, title: null,
      cta_text: 'Shop now', cta_type: 'SHOP_NOW',
      link_url: `https://capco.example/products/${id}`,
      images: [{ original_image_url: `https://cdn.example/${id}.jpg` }], videos: [], cards: [],
    },
  });
  // bodies must be GENUINELY distinct — near-identical sentences Jaccard-merge
  // into one cluster (correctly), which starves the test
  const bodies = [
    'Free shipping on every protein order this week',
    'Marine collagen your skin drinks up daily',
    'Swap sugar without changing a single recipe',
    'Gut fiber that dissolves clear in water',
    'Creatine for measurable strength gains each month',
    'Omega capsules built for sharper mornings',
  ];
  const tri = triageAds(bodies.map((b, i) => mkAd(`W${i}`, b)), 'CapCo', '777', 'competitor', NOW);
  const s = selectLanes(scoreClusters(clusterCandidates(tri.candidates)));
  const wc = s.picks.filter((p) => p.lane === 'wildcard').length;
  check(`wildcard headroom: single capped advertiser still yields 2 wildcards (got ${wc})`, wc === 2);
  check('headroom never exceeds cap+1 total', s.picks.length === 4); // 2 workhorse + 2 wildcard
}
{
  const base = JSON.parse(goodSummary);
  const confab = { ...base, honesty: ['CDN expiry wiped pixels on 17 of 27 downloaded images: plix_807372062336981 (c0/c1/c2) all returned empty on Read.'] };
  const p = summaryProblem(JSON.stringify(confab), { failed: 1, failedIds: ['oziva_123'] });
  check('confabulated image-failure claim is DENIED with the true count', p !== null && p.includes('EXACTLY 1') && p.includes('oziva_123'));
  const honest = { ...base, honesty: ['1 image could not be viewed — expired CDN link (oziva_123); its pick was judged from manifest copy.'] };
  check('an image-failure claim within the real count passes', summaryProblem(JSON.stringify(honest), { failed: 1 }) === null);
  const vague = { ...base, honesty: ['several creative images were unviewable due to CDN expiry'] };
  check('a no-number failure claim counts as ≥1 and is denied at failed=0', summaryProblem(JSON.stringify(vague), { failed: 0 }) !== null);
  check('non-image honesty entries are untouched', summaryProblem(JSON.stringify({ ...base, honesty: ['wildcard pool empty — the formulas left nothing over'] }), { failed: 0 }) === null);
  check('without a manifest record the check is skipped', summaryProblem(JSON.stringify(confab)) === null);
}
check('captionFixes: null is accepted as "none" (run 5 cost an Opus round-trip)',
  verdictProblem(goodVerdict.replace('["remove \'Ships today\' — no shipping anchor exists"]', 'null')) === null);
{
  const identity = 'LOGO: https://x.co/logo.svg (SVG — colours read from the file)\n      saved to /runs/x/assets/logo-site.svg — bind it as a render reference (never redraw a mark)';
  const patched = patchSvgBindNote(identity);
  check('stale SVG bind note is rewritten to point at the PNG', patched.includes('do NOT bind') && patched.includes('logo-site.png') && !patched.includes('logo-site.svg — bind it as a render reference'));
  check('raster-logo identity strings pass through unchanged', patchSvgBindNote('saved to /runs/x/assets/logo-site.png — bind it as a render reference (never redraw a mark)').includes('logo-site.png — bind it as a render reference'));
}

// ── 11) founder-driven product fetch (S155 founder call) ─────────────────────
console.log('\n[11] capture_products guard + catalogue discovery');
const HOST = 'houseoftwilight.in';
check('same-domain /products/ URL passes', productUrlProblem('https://houseoftwilight.in/products/beige-grid-shirt', HOST) === null);
check('www variant of the domain passes', productUrlProblem('https://www.houseoftwilight.in/products/beige-grid-shirt', HOST) === null);
check('FOREIGN domain is refused (never a general fetcher)', productUrlProblem('https://snitch.co.in/products/some-shirt', HOST) !== null);
check('non-product path is refused', productUrlProblem('https://houseoftwilight.in/pages/about', HOST) !== null);
check('guessed-slug garbage is refused as invalid URL', productUrlProblem('beige grid shirt', HOST) !== null);
check('non-http scheme is refused', productUrlProblem('file:///etc/passwd', HOST) !== null);
{
  const html = Array.from({ length: 7 }, (_, i) => `<a href="/products/shirt-${i}">x</a>`).join('')
    + '<a href="/products/shirt-0">dupe</a><a href="/pages/reviews">reviews</a>';
  const d = discoverPages(html, 'https://houseoftwilight.in');
  check(`catalogue collects ALL product links (7), pdps capped at ${MAX_PDPS}`,
    d.catalogue.length === 7 && d.pdps.length === MAX_PDPS && d.pdps.every((u) => d.catalogue.includes(u)));
  check('catalogue de-dupes and proof page still found', new Set(d.catalogue).size === 7 && d.proof === 'https://houseoftwilight.in/pages/reviews');
}
{
  const tmp = fs.mkdtempSync(join(os.tmpdir(), 'lite-inv-'));
  fs.mkdirSync(join(tmp, 'assets'), { recursive: true });
  for (const f of ['product-alpha_0.jpg', 'product-alpha_1.jpg', 'product-beta_0.jpg', 'logo-site.png']) fs.writeFileSync(join(tmp, 'assets', f), 'x');
  const inv = packShotInventory(tmp).join('\n');
  check('packShotInventory groups by product and skips the logo',
    inv.includes('3 image(s) across 2 product(s)') && inv.includes('**alpha** — 2 shot(s)') && inv.includes('**beta** — 1 shot(s)') && !inv.includes('logo'));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ── verdict ──────────────────────────────────────────────────────────────────
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
