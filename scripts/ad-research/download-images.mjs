#!/usr/bin/env node
/**
 * Image-analysis lens, step 1 — download one representative image per ad + a manifest.
 *
 * The Ad Library gives us copy (hook + body) but the "look" of an ad lives only in the
 * creative image. This pulls one primary image per ad from a saved corpus, dedupes
 * identical creatives (DCO runs the same image under many copy variants), and writes a
 * manifest pairing each unique image with its hook/copy/offer + the revealed-winner
 * proxies (variants, days_running) — the input to a vision pass and the gallery builder.
 *
 * Usage:
 *   node download-images.mjs <out-slug> <corpus.json> [<corpus2.json> ...]
 * Writes docs/research/ad-library/<out-slug>/{images/, manifest.json}
 * Re-runnable: already-downloaded files are skipped.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');
const RESEARCH = path.join(REPO, 'docs/research/ad-library');

const [outSlug, ...corpusArgs] = process.argv.slice(2);
if (!outSlug || corpusArgs.length === 0) {
  console.error('usage: node download-images.mjs <out-slug> <corpus.json> [<corpus2.json> ...]');
  process.exit(1);
}

const outDir = path.join(RESEARCH, outSlug);
const imgDir = path.join(outDir, 'images');
fs.mkdirSync(imgDir, { recursive: true });

const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// the one image that represents an ad's look
function primaryImage(ad) {
  if (ad.top_image) return ad.top_image;
  const card = (ad.card_images || []).find(Boolean);
  if (card) return card;
  const thumb = (ad.video_thumbs || []).find(Boolean);
  if (thumb) return thumb;
  return null;
}

// 1. gather every ad that has an image. Corpora are processed in argv order and the
//    FIRST corpus to carry a brand wins — pass a fresh re-pull before the stale corpus
//    to "pull the new data, ignore the old" (the stale brand's dead URLs are skipped).
const ads = [];
const seenBrands = new Set();
for (const cp of corpusArgs) {
  const full = path.isAbsolute(cp) ? cp : path.join(REPO, cp);
  const d = JSON.parse(fs.readFileSync(full, 'utf8'));
  const market = d.market || '?';
  const thisCorpusBrands = new Set();
  for (const b of d.brands || []) {
    if (seenBrands.has(b.brand)) { console.log(`  (skip stale "${b.brand}" — already loaded from an earlier corpus)`); continue; }
    thisCorpusBrands.add(b.brand);
    for (const ad of b.ads || []) {
      const url = primaryImage(ad);
      if (!url) continue;
      // DCO ads rotate a POOL of designed images (Meta dynamic creative). Capture ALL of them
      // so the gallery can show the full rotation; every other format = its one primary image.
      const allUrls = ad.format === 'DCO' ? [...new Set((ad.card_images || []).filter(Boolean))] : [url];
      ads.push({ ...ad, _market: market, _brand: b.brand, _bucket: b.bucket || '', _url: url, _urls: allUrls.length ? allUrls : [url] });
    }
  }
  thisCorpusBrands.forEach((x) => seenBrands.add(x));
}
console.log(`ads with an image: ${ads.length}`);

// 2. byUrl maps each PRIMARY url -> the ads it represents (drives the manifest). urlOwner + urls
//    cover EVERY image incl. DCO variants (drives downloads + the rotation-pool strip).
const byUrl = new Map();
for (const ad of ads) {
  if (!byUrl.has(ad._url)) byUrl.set(ad._url, []);
  byUrl.get(ad._url).push(ad);
}
const urlOwner = new Map(); // any url (primary or variant) -> an ad, for filename + md5 dedup
for (const ad of ads) for (const u of ad._urls) if (!urlOwner.has(u)) urlOwner.set(u, ad);
const urls = [...urlOwner.keys()];
console.log(`primary images: ${byUrl.size} · all images incl. DCO variants: ${urls.length}`);

// 3. fetch with a small pool; dedup the bytes (md5) so identical creatives collapse
const fileForMd5 = new Map();   // md5 -> saved filename (ALL images, storage dedup)
const primaryByMd5 = new Map(); // md5 -> { file, ads:[sharers] } (PRIMARY images only -> manifest)
const url2file = new Map();      // url -> saved filename (for the rotation-pool strip)
let done = 0, failed = 0;
const failures = [];

// fbcdn 403s scripted bulk fetches without browser-like headers, and rate-limits
// high concurrency. Send a real UA + Referer and retry transient 403s with backoff.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Referer': 'https://www.facebook.com/',
  'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getBuf(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(400 * attempt + Math.floor(200 * (idx % 5))); // jittered backoff
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch(url, { signal: ctrl.signal, headers: HEADERS });
      clearTimeout(t);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length >= 1000) return { buf };
        return { err: 'tiny' };
      }
      if (res.status !== 403 && res.status !== 429 && res.status < 500) return { err: String(res.status) };
      // 403/429/5xx -> retry
    } catch (e) { /* timeout/network -> retry */ }
  }
  return { err: 'retries-exhausted' };
}

async function fetchOne(url) {
  try {
    const { buf, err } = await getBuf(url);
    if (!buf) { failed++; failures.push(`${err} ${url}`); return; }
    const md5 = crypto.createHash('md5').update(buf).digest('hex').slice(0, 12);
    let file = fileForMd5.get(md5);
    if (!file) {
      const o = urlOwner.get(url);
      file = `${o._market}_${slugify(o._brand)}_${o.format}_${md5}.jpg`;
      fs.writeFileSync(path.join(imgDir, file), buf);
      fileForMd5.set(md5, file);
    }
    url2file.set(url, file);
    const sharers = byUrl.get(url); // non-empty only for a PRIMARY url -> contributes to manifest
    if (sharers) {
      if (!primaryByMd5.has(md5)) primaryByMd5.set(md5, { file, ads: [] });
      primaryByMd5.get(md5).ads.push(...sharers);
    }
  } catch (e) {
    failed++; failures.push(`${e.name} ${url}`);
  } finally {
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${urls.length} fetched (${failed} failed)`);
  }
}

const POOL = 6;
let idx = 0;
const worker = async () => { while (idx < urls.length) await fetchOne(urls[idx++]); };
await Promise.all(Array.from({ length: POOL }, worker));

// 4. one manifest entry per unique PRIMARY image (by bytes); primary ad = longest-running sharer.
//    variant_files = that ad's full rotation pool of downloaded images (the DCO shuffle set).
const manifest = [];
for (const [md5, { file, ads: sharers }] of primaryByMd5) {
  const primary = sharers.slice().sort((a, b) => (b.days_running || 0) - (a.days_running || 0))[0];
  const distinctTitles = [...new Set(sharers.map(a => (a.title || '').trim()).filter(Boolean))].slice(0, 10);
  const vfiles = [...new Set((primary._urls || [primary._url]).map(u => url2file.get(u)).filter(Boolean))];
  manifest.push({
    id: md5,
    file: `images/${file}`,
    variant_count: vfiles.length,
    variant_files: vfiles.map(f => `images/${f}`),
    market: primary._market,
    brand: primary._brand,
    bucket: primary._bucket,
    format: primary.format,
    hook: primary.title || null,
    body: primary.body || null,
    caption: primary.caption || null,
    cta_text: primary.cta_text || null,
    cta_type: primary.cta_type || null,
    link_domain: primary.link_domain || null,
    dest_type: primary.dest_type || null,
    variants: primary.variants || 1,
    days_running: primary.days_running || 0,
    launched: primary.launched || null,
    permalink: primary.permalink || null,
    shared_by_ads: sharers.length,
    shared_titles: distinctTitles,
  });
}
// gallery order: market, format, then revealed-winner strength
manifest.sort((a, b) =>
  a.market.localeCompare(b.market) ||
  a.format.localeCompare(b.format) ||
  (b.days_running - a.days_running) ||
  (b.variants - a.variants));

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
if (failures.length) fs.writeFileSync(path.join(outDir, 'download-failures.txt'), failures.join('\n'));

const totalVariantImgs = manifest.reduce((n, m) => n + (m.variant_count || 1), 0);
console.log(`\nunique images saved: ${fileForMd5.size}  (failed ${failed})`);
console.log(`manifest entries:    ${manifest.length} primary cards · ${totalVariantImgs} images incl. DCO variants`);
console.log(`-> docs/research/ad-library/${outSlug}/`);
