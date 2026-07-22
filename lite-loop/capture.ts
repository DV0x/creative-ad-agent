/**
 * capture.ts — STEP 0 of the lite pipeline (CODE, pre-wake). Runs BEFORE the
 * orchestrator's first token: captures the founder's pages + brand identity so
 * every seat works from disk ground-truth and never re-fetches (§3 of the plan).
 *
 * What lands in the run dir (~45s, $0, fail-soft on every step):
 *   raw/pages/*.txt            verbatim page text — founder URL, homepage, hero PDP,
 *                              and a reviews/proof page when one is linked (S155: 3-page bias)
 *   raw/pages/intake-ground.txt  capped intake grounding for the orchestrator
 *   brand.md                   brand_identity + product_photos results as one readable doc
 *   assets/                    logo + real pack shots (render-bindable)
 *   raw/redirect.txt           ONLY when the entered domain resolves elsewhere — the
 *                              wrong-brand guard (eval failure: domain redirect)
 *
 * Everything here reuses agent-loop's exported extractors — no copies, no model calls.
 */
import * as fs from 'node:fs';
import { join } from 'node:path';
import {
  runBrandIdentity,
  runProductPhotos,
  runPageText,
  prefetchIntakeGround,
} from '../agent-loop/mcp/brand-identity.ts';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const host = (u: string): string => {
  try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
};

/** Follow redirects code-side and compare the landing host with the entered one.
 *  A cross-domain landing is the wrong-brand trap (theratefinder-style eval miss):
 *  we record it for the orchestrator to CONFIRM with the founder, never to decide. */
export async function checkRedirect(brandUrl: string, runDir: string): Promise<string | null> {
  try {
    const r = await fetch(brandUrl, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(12_000) });
    const landed = host(r.url);
    const entered = host(brandUrl);
    if (landed && entered && landed !== entered) {
      const warning = [
        `REDIRECT DETECTED — the URL the founder entered does not answer as itself.`,
        `entered:  ${brandUrl} (host ${entered})`,
        `landed:   ${r.url} (host ${landed})`,
        ``,
        `Every capture below is of the LANDING page. During intake, CONFIRM with the founder that`,
        `${landed} is really their brand before any money-spending stage runs. If it is not, stop.`,
      ].join('\n');
      fs.mkdirSync(join(runDir, 'raw'), { recursive: true });
      fs.writeFileSync(join(runDir, 'raw', 'redirect.txt'), warning + '\n');
      return warning;
    }
    return null;
  } catch { return null; } // unreachable site surfaces naturally at page capture
}

/** Intrinsic pixel size of an SVG, from width/height attrs or the viewBox.
 *  Pure — exported for testing. Null when the file declares neither. */
export function svgIntrinsicSize(svg: string): { w: number; h: number } | null {
  const open = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!open) return null;
  const num = (attr: string): number | null => {
    const m = open.match(new RegExp(`\\b${attr}\\s*=\\s*"([\\d.]+)(?:px)?"`, 'i'));
    const n = m ? parseFloat(m[1]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  let w = num('width');
  let h = num('height');
  if (!w || !h) {
    const vb = open.match(/\bviewBox\s*=\s*"([\d.\s,+-]+)"/i)?.[1]?.trim().split(/[\s,]+/).map(Number);
    if (vb && vb.length === 4 && vb[2] > 0 && vb[3] > 0) { w = w ?? vb[2]; h = h ?? vb[3]; }
  }
  return w && h ? { w, h } : null;
}

/** S155 F28: BOTH render providers reject SVG refs (kie "File type not
 *  supported", fal Forbidden) — so run 2 shipped four MODEL-DRAWN logos, on a
 *  service brand whose ONLY bindable asset is its logo. Rasterize the captured
 *  SVG to a bindable PNG at step 0, via the same headless-Chromium canvas path
 *  as rasterColors. Fail-soft: no Playwright → null, the run degrades to the
 *  old behaviour (and the spec validator will name the blocker). */
export async function rasterizeSvgLogo(runDir: string): Promise<string | null> {
  const svgPath = join(runDir, 'assets', 'logo-site.svg');
  const pngPath = join(runDir, 'assets', 'logo-site.png');
  if (!fs.existsSync(svgPath) || fs.existsSync(pngPath)) return fs.existsSync(pngPath) ? pngPath : null;
  try {
    const svgText = fs.readFileSync(svgPath, 'utf8');
    const size = svgIntrinsicSize(svgText);
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
      const b64 = await page.evaluate(async ({ src, w, h }: { src: string; w: number; h: number }) => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = src; });
        const iw = w || img.naturalWidth || 512;
        const ih = h || img.naturalHeight || 512;
        const scale = 1024 / Math.max(iw, ih); // vector source — upscaling is lossless
        const cw = Math.max(1, Math.round(iw * scale));
        const ch = Math.max(1, Math.round(ih * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        canvas.getContext('2d')!.drawImage(img, 0, 0, cw, ch);
        return canvas.toDataURL('image/png').split(',')[1];
      }, { src: dataUri, w: size?.w ?? 0, h: size?.h ?? 0 });
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 100) return null; // an empty canvas encodes to ~a few dozen bytes
      fs.writeFileSync(pngPath, buf);
      return pngPath;
    } finally {
      await browser.close();
    }
  } catch { return null; }
}

/** How many DISTINCT products capture pulls pack shots for (S155 F31).
 *  Run 3 exposed the gap: capture took the FIRST /products/ link only, so the
 *  founder asking for a 2–3 product catalogue mix was told "one product on
 *  disk" — while 16 product pages sat in the homepage HTML. The downloader
 *  already loops over a list; capture was handing it one url. 3 products ×
 *  4 images = a 12-shot pool: enough for a mixed batch, small enough that
 *  create/judge still view only what their renderRefs cite. */
export const MAX_PDPS = 3;

/** Catalogue-link ceiling: enough for any real homepage, small enough that
 *  brand.md's catalogue section stays cheap to read. */
export const MAX_CATALOGUE = 24;

/** Discover product pages + a reviews/proof page from the homepage's own links.
 *  Shopify-first heuristics; empty results are fine (service brands, landers).
 *  - pdps (≤ MAX_PDPS): auto-downloaded at step 0; pdps[0] is the hero (its TEXT
 *    is captured for research; the rest ride along for their PHOTOS only).
 *  - catalogue (≤ MAX_CATALOGUE): EVERY product link found — written to brand.md
 *    as the founder's fetchable catalogue, so intake can map a named product to
 *    its exact URL for capture_products (S155: never guess a URL). */
export function discoverPages(homeHtml: string, baseUrl: string): { pdps: string[]; catalogue: string[]; proof: string | null } {
  const abs = (p: string): string | null => {
    try { return new URL(p, baseUrl).toString(); } catch { return null; }
  };
  const catalogue: string[] = [];
  let proof: string | null = null;
  for (const m of homeHtml.matchAll(/href="([^"#?]+)[^"]*"/gi)) {
    const raw = m[1];
    if (catalogue.length < MAX_CATALOGUE && /\/products\/[a-z0-9._-]+$/i.test(raw)) {
      const u = abs(raw);
      if (u && !catalogue.includes(u)) catalogue.push(u);
    }
    if (!proof && /review|testimonial|happy-customers|wall-of-love/i.test(raw) && !/\/products\//i.test(raw)) proof = abs(raw);
  }
  return { pdps: catalogue.slice(0, MAX_PDPS), catalogue, proof };
}

/** The grouped pack-shot inventory for brand.md — one line per product with its
 *  shot files. Reused by step-0 capture AND by capture_products (post-intake
 *  fetch), so brand.md's asset record always mirrors the disk. */
export function packShotInventory(runDir: string): string[] {
  let shots: string[] = [];
  try {
    shots = fs.readdirSync(join(runDir, 'assets')).filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('logo'));
  } catch { return []; }
  if (!shots.length) return [];
  const byProduct = new Map<string, string[]>();
  for (const s of shots) {
    const key = s.replace(/_\d+\.\w+$/, '');
    byProduct.set(key, [...(byProduct.get(key) ?? []), s]);
  }
  return [
    `${shots.length} image(s) across ${byProduct.size} product(s):`,
    ...[...byProduct.entries()].map(([p, fl]) => `- **${p.replace(/^product-/, '')}** — ${fl.length} shot(s): ${fl.map((f) => `assets/${f}`).join(', ')}`),
  ];
}

/** S156 (run 5): the extractor's logo line says "bind it as a render reference" —
 *  right for raster logos, WRONG when the saved file is the .svg (both providers
 *  reject SVG; the rasterized PNG sibling is the bindable one). brand.md then
 *  contradicted itself one section apart. Patch the sentence rather than fork
 *  the extractor. Pure — exported for testing. */
export function patchSvgBindNote(identity: string): string {
  return identity.replace(
    /logo-site\.svg — bind it as a render reference \(never redraw a mark\)/g,
    'logo-site.svg — SOURCE VECTOR, do NOT bind (both render providers reject SVG refs); bind assets/logo-site.png instead — never redraw a mark',
  );
}

export interface CaptureResult {
  pagesCaptured: string[];
  pdpUrl: string | null;   // the hero PDP (its page TEXT is captured for research)
  pdpUrls: string[];       // every PDP whose pack shots were downloaded (F31)
  redirectWarning: string | null;
}

export async function captureStepZero(
  brandUrl: string,
  runDir: string,
  onProgress?: (line: string) => void,
): Promise<CaptureResult> {
  const say = (l: string) => onProgress?.(l);
  const pagesCaptured: string[] = [];

  // 1) redirect guard first — everything after captures whatever the URL lands on
  const redirectWarning = await checkRedirect(brandUrl, runDir);
  if (redirectWarning) say('⚠ entered domain redirects elsewhere — flagged for intake confirmation');

  // 2) intake grounding (capped) + the founder URL in full
  say('· capturing pages…');
  await prefetchIntakeGround(brandUrl, runDir);
  await runPageText(brandUrl, runDir).then(() => pagesCaptured.push(brandUrl)).catch(() => {});

  // 3) homepage (when the founder gave a deep link) + PDP/proof discovery off the homepage HTML
  let origin = brandUrl;
  try { origin = new URL(brandUrl).origin; } catch { /* keep as-is */ }
  if (origin && origin + '/' !== brandUrl && origin !== brandUrl) {
    await runPageText(origin, runDir).then(() => pagesCaptured.push(origin)).catch(() => {});
  }
  let pdpUrl: string | null = null;
  let pdpUrls: string[] = [];
  let catalogue: string[] = [];
  try {
    const r = await fetch(origin, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(12_000) });
    if (r.ok) {
      const d = discoverPages(await r.text(), origin);
      const { pdps, proof } = d;
      catalogue = d.catalogue;
      pdpUrls = pdps;
      pdpUrl = pdps[0] ?? null;
      // Only the HERO pdp's text is captured — research reads page text, and three
      // near-identical PDP dumps would just tax its one-page budget. The other
      // products ride along for their PHOTOS (below).
      if (pdpUrl) { const u = pdpUrl; await runPageText(u, runDir).then(() => pagesCaptured.push(u)).catch(() => {}); }
      // S155 3-page bias: a linked reviews/proof page is the cheapest anchor fuel research can get
      if (proof && pagesCaptured.length < 4) {
        await runPageText(proof, runDir).then(() => pagesCaptured.push(proof)).catch(() => {});
      }
    }
  } catch { /* discovery is best-effort */ }

  // 4) brand identity (logo → assets/, palette, voice) + real pack shots → brand.md
  say('· extracting brand identity (logo, palette, voice)…');
  const sections: string[] = [`# Brand capture — ${brandUrl}`, `Captured: ${new Date().toISOString()}`, ''];
  if (redirectWarning) sections.push('## ⚠ REDIRECT WARNING', '', redirectWarning, '');
  try {
    sections.push('## Brand identity (deterministic extraction — facts, not vibes)', '', patchSvgBindNote(await runBrandIdentity(brandUrl, runDir)), '');
  } catch (e) {
    sections.push('## Brand identity', '', `extraction failed: ${e instanceof Error ? e.message : String(e)}`, '');
  }
  // S155 F28: providers reject SVG refs — rasterize the logo NOW so every
  // downstream ref binds the PNG (the spec validator refuses .svg renderRefs).
  if (fs.existsSync(join(runDir, 'assets', 'logo-site.svg'))) {
    const png = await rasterizeSvgLogo(runDir);
    if (png) {
      say('· rasterized SVG logo → assets/logo-site.png (render-bindable)');
      sections.push('**LOGO FOR RENDERING:** the site logo is an SVG, which BOTH render providers reject. Use `assets/logo-site.png` (rasterized at capture) in every renderRefs — never the .svg.', '');
    } else {
      sections.push('**⚠ LOGO RASTERIZATION FAILED:** only assets/logo-site.svg exists and render providers reject SVG refs — the logo cannot be bound. Name this blocker in specs/build-output rather than letting the model draw the mark.', '');
    }
  }
  if (pdpUrls.length) {
    say(`· downloading real pack shots from ${pdpUrls.length} product page(s)…`);
    try {
      sections.push(`## Products (${pdpUrls.length} PDP${pdpUrls.length === 1 ? '' : 's'} — structured data; pack shots land in assets/)`, '', await runProductPhotos(pdpUrls, runDir), '');
      // S155 F13: intake recorded "no model photo" while every downloaded pack shot
      // showed one — a false premise that steered four stages. The inventory below
      // forces eyes onto the files before any asset gap is written down.
      const inventory = packShotInventory(runDir);
      if (inventory.length) {
        sections.push(
          '## ⚠ PACK-SHOT INVENTORY — VIEW BEFORE RECORDING ASSET GAPS',
          '',
          ...inventory,
          '',
          'These may already contain model/lifestyle photography. INTAKE MUST Read (view) at least',
          'one before writing any "no photo" style gap — the founder\'s memory of their assets is',
          'not evidence of what is on disk. A multi-product batch binds each spec to the product',
          'it actually shows.',
          '',
        );
      }
    } catch (e) {
      sections.push('## Product', '', `pack-shot extraction failed: ${e instanceof Error ? e.message : String(e)}`, '');
    }
  } else {
    sections.push('## Product', '', 'No PDP discovered from the homepage links — if the founder uploads a hero photo it lands in assets/; otherwise steer to pack-free constructions.', '');
  }
  // S155: the FULL catalogue, as exact fetchable URLs. When the founder names a
  // product during intake whose photos are not on disk, the orchestrator calls
  // capture_products with the URL from THIS list — it never invents a slug.
  if (catalogue.length > pdpUrls.length) {
    sections.push(
      `## Catalogue — every product page found on the homepage (${catalogue.length})`,
      '',
      'Photos are on disk ONLY for the pack-shot inventory above. If the founder wants a product',
      'below in the creative mix, fetch its photos with capture_products using its EXACT url from',
      'this list (never a guessed slug):',
      '',
      ...catalogue.map((u) => `- ${u}${pdpUrls.includes(u) ? '  ← photos already on disk' : ''}`),
      '',
    );
  }
  sections.push('## Captured pages (verbatim text in raw/pages/)', '', ...pagesCaptured.map((p) => `- ${p}`), '');
  fs.writeFileSync(join(runDir, 'brand.md'), sections.join('\n'));
  say(`✓ capture complete — ${pagesCaptured.length} page(s), ${pdpUrls.length} product(s), brand.md written`);
  return { pagesCaptured, pdpUrl, pdpUrls, redirectWarning };
}
