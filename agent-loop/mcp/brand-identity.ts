/**
 * brand_identity — deterministic brand extraction from the brand's own site
 * (S152 fix #12: both TheRateFinder runs shipped forest-green/amber ads for a
 * navy/mint brand because NO seat ever captured the brand's actual identity —
 * create inferred "equity" from ad pixels and called it a fact).
 *
 * One call, a few plain HTTP fetches, no credits, no headless browser:
 *   1. LOGO — found in the HTML (img[src*=logo], icons, Next.js _next/image
 *      wrappers decoded), downloaded to assets/ for render binding. SVG logos
 *      are TEXT: their fill colours are read directly — the authoritative tier.
 *   2. PALETTE — hex frequency across HTML + linked CSS, cross-referenced
 *      against the logo colours (a colour in both = confirmed brand colour).
 *      Validated live: theratefinder.ca → logo #46be8a/#011a40; page frequency
 *      66×/29× the same two hexes, everything else ≤2.
 *   3. TYPOGRAPHY — font-family declarations + Google Fonts links.
 *   4. VOICE — VERBATIM strings only (the collect law): title, meta/og
 *      description, h1-h3, button/CTA labels. The tool never characterizes;
 *      the seats do.
 *
 * Full dump lands in raw/brand-identity.json (two-phase discipline: summary to
 * context, everything to disk).
 */
import { z } from 'zod';
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

const HTML_CAP = 800_000;
const CSS_CAP = 250_000;
const MAX_CSS_FILES = 3;
const LOGO_CAP = 2_000_000;

// ── pure extraction (exported for direct testing) ───────────────────────────

const decodeEntities = (s: string): string =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
   .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();

const stripTags = (s: string): string => decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Absolutize a URL found in HTML; decodes Next.js /_next/image?url= wrappers. */
export function resolveAssetUrl(raw: string, baseUrl: string): string | null {
  try {
    let u = decodeEntities(raw);
    const next = u.match(/\/_next\/image\?[^"]*url=([^&"]+)/i);
    if (next) u = decodeURIComponent(next[1]);
    return new URL(u, baseUrl).href;
  } catch { return null; }
}

/** Candidate logo URLs from the page, best-first (explicit logo > icons). */
export function extractLogoUrls(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const push = (m: RegExpMatchArray | null) => {
    if (m?.[1]) { const r = resolveAssetUrl(m[1], baseUrl); if (r && !out.includes(r)) out.push(r); }
  };
  for (const m of html.matchAll(/<img[^>]+src="([^"]*logo[^"]*)"/gi)) push(m);
  for (const m of html.matchAll(/(?:href|src)="([^"]*\/logo\.(?:svg|png|webp)[^"]*)"/gi)) push(m);
  for (const m of html.matchAll(/<link[^>]+rel="[^"]*(?:apple-touch-icon|icon)[^"]*"[^>]+href="([^"]+)"/gi)) push(m);
  return out.slice(0, 4);
}

/** Colours declared inside an SVG (fills, strokes, gradient stops). */
export function svgColors(svg: string): string[] {
  const hexes = svg.match(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b/g) ?? [];
  const norm = hexes.map((h) => {
    const x = h.toLowerCase();
    return x.length === 4 ? `#${x[1]}${x[1]}${x[2]}${x[2]}${x[3]}${x[3]}` : x;
  });
  return [...new Set(norm)];
}

const NEUTRAL = new Set(['#ffffff', '#000000', '#fff', '#000']);

/** Hex frequency across page + css text, most-frequent first, neutrals excluded. */
export function extractHexCounts(text: string): Array<{ hex: string; n: number }> {
  const counts = new Map<string, number>();
  for (const m of text.match(/#[0-9A-Fa-f]{6}\b/g) ?? []) {
    const h = m.toLowerCase();
    if (NEUTRAL.has(h)) continue;
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return [...counts.entries()].map(([hex, n]) => ({ hex, n })).sort((a, b) => b.n - a.n).slice(0, 10);
}

/** font-family stacks (CSS + inline) and Google Fonts family names. */
export function extractFonts(htmlAndCss: string): string[] {
  const out = new Map<string, number>();
  for (const m of htmlAndCss.matchAll(/font-family\s*:\s*([^;}{"]+)/gi)) {
    const fam = m[1].trim().replace(/\s+/g, ' ').slice(0, 80);
    if (fam && !/inherit|initial|unset|var\(/i.test(fam)) out.set(fam, (out.get(fam) ?? 0) + 1);
  }
  for (const m of htmlAndCss.matchAll(/fonts\.googleapis\.com\/css2?\?[^"']*family=([A-Za-z0-9+ :;@,._-]+)/gi)) {
    for (const fam of m[1].split('&')[0].split('|')) {
      const name = fam.split(':')[0].replace(/\+/g, ' ').trim();
      if (name) out.set(`${name} (Google Fonts)`, (out.get(`${name} (Google Fonts)`) ?? 0) + 5);
    }
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f).slice(0, 5);
}

export interface VoiceStrings {
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  themeColor: string | null;
  headlines: string[]; // h1-h3, verbatim, in document order
  ctas: string[];      // button/short-link labels, verbatim
}

/** VERBATIM voice strings — the tool never paraphrases or characterizes. */
export function extractVoiceStrings(html: string): VoiceStrings {
  const one = (re: RegExp): string | null => {
    const m = html.match(re);
    return m?.[1] ? stripTags(m[1]).slice(0, 200) || null : null;
  };
  const headlines: string[] = [];
  for (const m of html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = stripTags(m[2]);
    if (t.length >= 2 && t.length <= 140 && !headlines.includes(t)) headlines.push(t);
    if (headlines.length >= 20) break;
  }
  const ctas: string[] = [];
  for (const m of html.matchAll(/<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/gi)) {
    const t = stripTags(m[1]);
    if (t.length >= 2 && t.length <= 32 && !ctas.includes(t)) ctas.push(t);
    if (ctas.length >= 15) break;
  }
  return {
    title: one(/<title[^>]*>([\s\S]*?)<\/title>/i),
    metaDescription: one(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ?? one(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i),
    ogTitle: one(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
    ogDescription: one(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i),
    themeColor: one(/<meta[^>]+name="theme-color"[^>]+content="([^"]+)"/i),
    headlines, ctas,
  };
}

/** Stylesheet hrefs worth fetching. */
export function extractCssUrls(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"|<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/gi)) {
    const r = resolveAssetUrl(m[1] ?? m[2] ?? '', baseUrl);
    if (r && !out.includes(r)) out.push(r);
  }
  return out.slice(0, MAX_CSS_FILES);
}

// ── the tool ────────────────────────────────────────────────────────────────

async function fetchText(url: string, cap: number): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (brand-identity)' } });
    if (!r.ok) return null;
    const t = await r.text();
    return t.slice(0, cap);
  } catch { return null; }
}

export async function runBrandIdentity(url: string, runDir?: string): Promise<string> {
  const html = await fetchText(url, HTML_CAP);
  if (!html) return `Could not fetch ${url} — check the URL (redirects to another host must be followed manually).`;

  // CSS
  const cssUrls = extractCssUrls(html, url);
  const cssTexts: string[] = [];
  for (const cu of cssUrls) {
    const t = await fetchText(cu, CSS_CAP);
    if (t) cssTexts.push(t);
  }
  const corpus = html + '\n' + cssTexts.join('\n');

  // LOGO — first candidate that fetches; SVG colours read directly
  const logoUrls = extractLogoUrls(html, url);
  let logoPath: string | null = null;
  let logoColorsFound: string[] = [];
  let logoNote = 'no logo candidate found in the HTML';
  for (const lu of logoUrls) {
    try {
      const r = await fetch(lu, { headers: { 'user-agent': 'Mozilla/5.0 (brand-identity)' } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length === 0 || buf.length > LOGO_CAP) continue;
      const ct = r.headers.get('content-type') ?? '';
      const isSvg = ct.includes('svg') || /^\s*<(\?xml|svg)/i.test(buf.toString('utf8', 0, 200));
      const ext = isSvg ? 'svg' : ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : (lu.match(/\.(\w{3,4})(?:\?|$)/)?.[1] ?? 'img');
      if (runDir) {
        const assets = path.join(runDir, 'assets');
        fs.mkdirSync(assets, { recursive: true });
        // never clobber a founder upload — site extraction gets its own name
        logoPath = path.join(assets, `logo-site.${ext}`);
        fs.writeFileSync(logoPath, buf);
      }
      if (isSvg) logoColorsFound = svgColors(buf.toString('utf8'));
      logoNote = `${lu} (${isSvg ? 'SVG — colours read from the file' : ext.toUpperCase()})`;
      break;
    } catch { /* next candidate */ }
  }

  const freq = extractHexCounts(corpus);
  const confirmed = freq.filter((f) => logoColorsFound.includes(f.hex));
  const fonts = extractFonts(corpus);
  const voice = extractVoiceStrings(html);

  // full dump to disk (two-phase discipline)
  if (runDir) {
    try {
      const rawDir = path.join(runDir, 'raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.writeFileSync(path.join(rawDir, 'brand-identity.json'), JSON.stringify({
        url, fetchedAt: new Date().toISOString(), logo: { url: logoUrls[0] ?? null, savedTo: logoPath, colors: logoColorsFound },
        paletteFrequency: freq, confirmedBrandColors: confirmed.map((c) => c.hex), fonts, voice, cssUrls,
      }, null, 2) + '\n');
    } catch { /* non-fatal */ }
  }

  const paletteLines = freq.slice(0, 6).map((f) =>
    `      ${f.hex} ×${f.n}${logoColorsFound.includes(f.hex) ? '  ← CONFIRMED (also in the logo)' : ''}`);
  return [
    `BRAND IDENTITY — ${url}`,
    ``,
    `LOGO: ${logoNote}${logoPath ? `\n      saved to ${logoPath} — bind it as a render reference (never redraw a mark)` : ''}`,
    logoColorsFound.length ? `      logo colours: ${logoColorsFound.join(', ')}` : '',
    ``,
    `PALETTE (hex frequency across HTML + ${cssTexts.length} stylesheet(s); neutrals excluded):`,
    ...(paletteLines.length ? paletteLines : ['      (no non-neutral hex colours found — the site may style via an un-fetched framework sheet)']),
    (() => {
      // headline both tiers: logo-confirmed colours AND frequency-dominant accents
      // (a brand's loudest colour is often not IN the logo — TWT's berry #ab406c
      // ran 106× against a #93385d logo; both belong in the palette).
      const dominant = freq.filter((f) => !logoColorsFound.includes(f.hex) && f.n >= Math.max(10, (freq[0]?.n ?? 0) / 4)).slice(0, 2);
      if (confirmed.length) {
        const dom = dominant.length ? `; frequency-dominant accents: ${dominant.map((d) => d.hex).join(' + ')}` : '';
        return `      → BRAND PALETTE — logo-confirmed: ${confirmed.map((c) => c.hex).join(' + ')}${dom}`;
      }
      if (logoColorsFound.length) return `      → logo colours ${logoColorsFound.join('/')} did not recur in page text — treat the LOGO as authoritative`;
      return `      → no logo cross-check available; treat top frequency as PROVISIONAL`;
    })(),
    ``,
    `TYPOGRAPHY: ${fonts.length ? fonts.join(' · ') : '(none found in fetched CSS)'}`,
    voice.themeColor ? `THEME-COLOR: ${voice.themeColor}` : '',
    ``,
    `VOICE (verbatim from the site — quote, never paraphrase):`,
    `      title: ${voice.title ?? '(none)'}`,
    `      description: ${voice.metaDescription ?? voice.ogDescription ?? '(none)'}`,
    voice.headlines.length ? `      headlines (${voice.headlines.length}):\n${voice.headlines.map((h) => `        · "${h}"`).join('\n')}` : '      headlines: (none found)',
    voice.ctas.length ? `      CTAs: ${voice.ctas.map((c) => `"${c}"`).join(' · ')}` : '',
    ``,
    `Full dump: raw/brand-identity.json. Write palette, typography, and voice into material.md as`,
    `NUMBERED ARTIFACTS (source: this tool + the site URL) — downstream seats may only use what is anchored.`,
  ].filter((l) => l !== '').join('\n');
}

// ── product_photos — real pack shots from PDPs (structured data ONLY) ──────
// A PDP's <img> soup is full of cross-sell SKUs (the TWT mango page carries the
// badaam spread and half the bar range) — generic scraping binds the WRONG
// product. og:image and JSON-LD Product are the page's own declaration of what
// it sells; we trust nothing else. This is how "product must be 100% identical"
// starts: bind the brand's real pack shot, never a lookalike.

export interface ProductData {
  name: string | null;
  price: string | null;
  imageUrls: string[]; // og:image first (usually the largest hero), then JSON-LD
  rating: { value: number; count: number } | null; // AggregateRating — a citable proof number
  faqs: Array<{ q: string; a: string }>; // FAQPage entries, VERBATIM — objections pre-answered
  description: string | null; // Shopify body_html when present (stripped, verbatim text)
}

/** Exported for direct testing. Structured-data product extraction. */
export function extractProductData(html: string): ProductData {
  const urls: string[] = [];
  const push = (u: unknown) => {
    if (typeof u === 'string' && /^https?:\/\//.test(u) && !urls.includes(u)) urls.push(u);
  };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)="(?:og:image(?::secure_url)?|twitter:image)"[^>]+content="([^"]+)"/gi)) push(decodeEntities(m[1]));
  let name: string | null = null;
  let price: string | null = null;
  let rating: ProductData['rating'] = null;
  let description: string | null = null;
  const faqs: ProductData['faqs'] = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = Array.isArray(j['@graph']) ? j['@graph'] : [j];
      for (const node of nodes) {
        const type = String(node?.['@type']).toLowerCase();
        if (type === 'product') {
          name = name ?? (typeof node.name === 'string' ? node.name : null);
          if (!description && typeof node.description === 'string') description = stripTags(node.description).slice(0, 1500) || null;
          const imgs = Array.isArray(node.image) ? node.image : [node.image];
          for (const im of imgs) push(typeof im === 'string' ? im : im?.url ?? im?.image);
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
          if (offer?.price != null) price = `${offer.price}${offer.priceCurrency ? ' ' + offer.priceCurrency : ''}`;
          const ar = node.aggregateRating;
          if (ar?.ratingValue != null && ar?.reviewCount != null) rating = { value: Number(ar.ratingValue), count: Number(ar.reviewCount) };
        }
        if (type === 'faqpage' && Array.isArray(node.mainEntity)) {
          for (const qa of node.mainEntity) {
            const q = typeof qa?.name === 'string' ? stripTags(qa.name) : null;
            const a = typeof qa?.acceptedAnswer?.text === 'string' ? stripTags(qa.acceptedAnswer.text) : null;
            if (q && a && faqs.length < 12) faqs.push({ q, a: a.slice(0, 500) });
          }
        }
      }
    } catch { /* not our JSON */ }
  }
  return { name, price, imageUrls: urls.slice(0, 6), rating, faqs, description };
}

const PRODUCT_IMG_MIN = 10_000;
const PRODUCT_IMGS_PER_PAGE = 4;
const REVIEW_CARDS_MAX = 10;

/** Brand-published REVIEW-CARD images on the page (testimonials rendered as
 *  pixels — TWT ships 21 of them as CMS assets; the text never arrives as HTML).
 *  Filename-based: an image URL whose name says "review" is a review surface,
 *  not a product or a cross-sell. Exported for direct testing. */
export function extractReviewCardUrls(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/https?:\/\/[^"'\\\s)]+\/[^"'\\\s)/]*review[^"'\\\s)/]*\.(?:png|jpe?g|webp)/gi)) {
    const u = decodeEntities(m[0]);
    if (!out.includes(u)) out.push(u);
  }
  return out.slice(0, REVIEW_CARDS_MAX);
}

/** Shopify stores expose the FULL product gallery at /products/<handle>.json —
 *  every angle at full resolution, platform-scoped to the one product (validated
 *  live: 27 images for a boAt PDP). Exported for direct testing. */
export function parseShopifyProductJson(text: string): ProductData | null {
  try {
    const p = JSON.parse(text)?.product;
    if (!p || !Array.isArray(p.images)) return null;
    const desc = typeof p.body_html === 'string' ? stripTags(p.body_html).slice(0, 1500) : '';
    return {
      name: typeof p.title === 'string' ? p.title : null,
      price: p.variants?.[0]?.price != null ? String(p.variants[0].price) : null,
      imageUrls: p.images.map((im: any) => typeof im?.src === 'string' ? im.src : null).filter(Boolean),
      rating: null,
      faqs: [],
      description: desc || null,
    };
  } catch { return null; }
}

async function tryShopifyGallery(pageUrl: string): Promise<ProductData | null> {
  try {
    const u = new URL(pageUrl);
    const m = u.pathname.match(/^(.*\/products\/[a-z0-9._-]+)/i);
    if (!m) return null;
    const text = await fetchText(`${u.origin}${m[1]}.json`, HTML_CAP);
    return text ? parseShopifyProductJson(text) : null;
  } catch { return null; }
}

export async function runProductPhotos(pages: string[], runDir?: string): Promise<string> {
  const blocks: string[] = [];
  const dump: any[] = [];
  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];
    const html = await fetchText(url, HTML_CAP * 2); // PDPs run heavy
    if (!html) { blocks.push(`[${i + 1}] ${url}\n    ERROR: could not fetch the page.`); continue; }
    const p = extractProductData(html);
    // Shopify tier: the platform's own product JSON carries the FULL gallery —
    // merge it in (og:image stays first as the hero; gallery fills the angles).
    const shopify = await tryShopifyGallery(url);
    if (shopify) {
      p.name = p.name ?? shopify.name;
      p.price = p.price ?? shopify.price;
      p.description = p.description ?? shopify.description;
      for (const su of shopify.imageUrls) if (!p.imageUrls.includes(su)) p.imageUrls.push(su);
    }
    if (p.imageUrls.length === 0) {
      blocks.push(`[${i + 1}] ${p.name ?? url}\n    NO STRUCTURED PRODUCT IMAGES (no og:image / JSON-LD Product) — the pack shot needs a founder upload; never bind a lookalike.`);
      continue;
    }
    const slug = (p.name ?? new URL(url).pathname.split('/').filter(Boolean).pop() ?? `product-${i + 1}`)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
    let saved = 0;
    const paths: string[] = [];
    for (const iu of p.imageUrls) {
      if (saved >= PRODUCT_IMGS_PER_PAGE) break;
      try {
        // sized-variant URLs (?w=600) often hide a larger original — try bare first
        const bare = iu.includes('?') ? iu.split('?')[0] : null;
        let buf: Buffer | null = null;
        let ext = 'jpg';
        for (const candidate of [bare, iu].filter(Boolean) as string[]) {
          const r = await fetch(candidate, { headers: { 'user-agent': 'Mozilla/5.0 (brand-identity)' } });
          if (!r.ok) continue;
          const b = Buffer.from(await r.arrayBuffer());
          if (b.length < PRODUCT_IMG_MIN) continue; // thumb / tracking pixel
          const ct = r.headers.get('content-type') ?? '';
          ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('jpeg') ? 'jpg' : (candidate.match(/\.(\w{3,4})(?:\?|$)/)?.[1] ?? 'jpg');
          if (!buf || b.length > buf.length) buf = b; // keep the larger variant
        }
        if (!buf) continue;
        if (runDir) {
          const assets = path.join(runDir, 'assets');
          fs.mkdirSync(assets, { recursive: true });
          const fp = path.join(assets, `product-${slug}_${saved}.${ext}`);
          fs.writeFileSync(fp, buf);
          paths.push(fp);
        }
        saved++;
      } catch { /* next url */ }
    }
    // review cards — brand-published testimonial pixels; collect transcribes them verbatim
    const reviewUrls = extractReviewCardUrls(html);
    const reviewPaths: string[] = [];
    for (const ru of reviewUrls) {
      try {
        const r = await fetch(ru, { headers: { 'user-agent': 'Mozilla/5.0 (brand-identity)' } });
        if (!r.ok) continue;
        const b = Buffer.from(await r.arrayBuffer());
        if (b.length < PRODUCT_IMG_MIN) continue;
        if (runDir) {
          const assets = path.join(runDir, 'assets');
          fs.mkdirSync(assets, { recursive: true });
          const ext = ru.match(/\.(\w{3,4})$/)?.[1] ?? 'png';
          const fp = path.join(assets, `review-card-${reviewPaths.length}.${ext}`);
          fs.writeFileSync(fp, b);
          reviewPaths.push(fp);
        }
      } catch { /* next */ }
    }
    dump.push({ url, name: p.name, price: p.price, rating: p.rating, faqs: p.faqs, description: p.description, shopifyGallery: Boolean(shopify), imageUrls: p.imageUrls.slice(0, 12), reviewCardUrls: reviewUrls, savedTo: paths, reviewCardsSavedTo: reviewPaths });
    blocks.push([
      `[${i + 1}] ${p.name ?? url}${p.price ? ` — ${p.price}` : ''}`,
      p.rating ? `    RATING (structured, citable): ${p.rating.value}★ from ${p.rating.count} ratings — a real social-proof anchor` : '',
      p.faqs.length ? `    FAQ: ${p.faqs.length} verbatim Q&A pairs captured (product details + pre-answered objections) — full text in raw/product-photos.json; quote as artifacts, never paraphrase` : '',
      p.description ? `    DESCRIPTION (verbatim, ${p.description.length} chars): "${p.description.slice(0, 120)}…" — full text in the dump` : '',
      `    ${saved} file(s) downloaded (og:image + JSON-LD Product${shopify ? ' + Shopify product JSON' : ''} — cross-sell images ignored)`,
      ...paths.map((fp) => `      ${fp} — bind as the REAL product reference (100%-identical law)`),
      shopify
        ? `    FULL GALLERY available (Shopify product JSON: ${shopify.imageUrls.length} image(s) — every angle). First ${PRODUCT_IMGS_PER_PAGE} saved; ALL URLs in raw/product-photos.json — fetch more only if a construction needs a specific angle.`
        : saved >= 2
          ? '    NOTE: og:image and JSON-LD often reference the SAME creative at different sizes — if the files are the same shot, inventory the larger one and say so.'
          : '',
      !shopify && saved > 0 ? '    Extra angles (back-of-pack, texture) are client-rendered on this store and NOT fetchable — if a construction needs one, write it as NEEDS FOUNDER.' : '',
      saved === 0 ? '    all image URLs failed or were thumbnails — NEEDS FOUNDER upload' : '',
      reviewPaths.length
        ? `    REVIEW CARDS: ${reviewPaths.length} brand-published testimonial image(s) → assets/review-card-*.png. VIEW each and transcribe the text VERBATIM into material.md as (A) artifacts (source: "PDP review card, brand-published") — reviewer name and credential included. Text reviews beyond these are client-rendered; hunt off-site voices via Perplexity as usual.`
        : '',
    ].filter(Boolean).join('\n'));
  }
  if (runDir && dump.length) {
    try {
      const rawDir = path.join(runDir, 'raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.writeFileSync(path.join(rawDir, 'product-photos.json'), JSON.stringify(dump, null, 2) + '\n');
    } catch { /* non-fatal */ }
  }
  return blocks.join('\n\n') + '\n\nList each saved file in material.md\'s Assets section (product photo, brand-owned, auto-extracted).';
}

// ── page_text — deterministic VERBATIM page fetch ───────────────────────────
// Replaces WebFetch on the COLLECT seat: WebFetch converts to markdown and has
// a model ANSWER QUESTIONS about the page — a paraphrase layer inside a seat
// whose one law is verbatim. This returns the page's actual words, untouched,
// and saves the full text to raw/pages/ for grepping and quoting.
export async function runPageText(url: string, runDir?: string): Promise<string> {
  const html = await fetchText(url, HTML_CAP * 2);
  if (!html) return `Could not fetch ${url}.`;
  const text = decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<(?:\/)?(?:p|div|h[1-6]|li|ul|ol|br|tr|section|article|header|footer)[^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, ' '),
  )
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  let savedTo: string | null = null;
  if (runDir) {
    const dir = path.join(runDir, 'raw', 'pages');
    fs.mkdirSync(dir, { recursive: true });
    const slug = (new URL(url).pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'home').slice(0, 60);
    savedTo = path.join(dir, `${slug}.txt`);
    fs.writeFileSync(savedTo, `SOURCE: ${url}\nFETCHED: ${new Date().toISOString()}\n\n${text}\n`);
  }
  return [
    `PAGE TEXT — ${url} (${text.length} chars, VERBATIM — no model touched it)`,
    savedTo ? `Saved in full to ${savedTo} — quote artifacts from there, source = this URL.` : '',
    '',
    'FIRST 1200 CHARS:',
    text.slice(0, 1200),
  ].filter(Boolean).join('\n');
}

const pageTextTool = (runDir?: string) => tool(
  'page_text',
  'Fetch a page and return its VERBATIM text — no markdown conversion, no model summarizing in between (unlike WebFetch). Full text is saved to raw/pages/<slug>.txt for grepping; the result shows the first 1200 chars. Use for the brand\'s own pages and rich single sources when exact wording matters (it always does for collection). Counts against the gathering budget like any fetch.',
  { url: z.string().url().describe('The page to fetch verbatim.') },
  async (args) => ({ content: [{ type: 'text' as const, text: await runPageText(args.url, runDir) }] }),
);

const productPhotosTool = (runDir?: string) => tool(
  'product_photos',
  'Extract everything a product page STRUCTURALLY declares, in one call: real pack shots (og:image + JSON-LD Product; on Shopify stores the public product JSON adds the FULL gallery — every angle), canonical name + price, the aggregate rating (a citable social-proof number), verbatim FAQ pairs (product details + pre-answered objections), and brand-published REVIEW-CARD images (testimonials rendered as pixels — download them and transcribe verbatim). Cross-sell images of other SKUs are never grabbed. Files land in assets/ for render binding (the 100%-identical law starts with the real file); full data in raw/product-photos.json. Call once with the hero product page URL(s) (max 4). No credits.',
  { pages: z.array(z.string().url()).min(1).max(4).describe('Product page URLs (the hero SKU first).') },
  async (args) => ({ content: [{ type: 'text' as const, text: await runProductPhotos(args.pages, runDir) }] }),
);

const brandIdentityTool = (runDir?: string) => tool(
  'brand_identity',
  'Extract a brand\'s VISUAL IDENTITY and VOICE from its own website in one deterministic call (no credits): finds and downloads the logo to assets/ (SVG logo colours read directly from the file), ranks hex-colour frequency across the HTML + linked CSS and cross-confirms against the logo (both agreeing = the brand palette, as facts not inference), pulls font families, and captures VERBATIM voice strings (title, meta description, h1-h3 headlines, CTA labels). Call ONCE on the brand URL at the START of collection; write the results into material.md as numbered artifacts so palette/voice are citable anchors like any other fact. Full dump lands in raw/brand-identity.json.',
  { url: z.string().url().describe('The brand\'s site URL (from founder-facts.md).') },
  async (args) => ({ content: [{ type: 'text' as const, text: await runBrandIdentity(args.url, runDir) }] }),
);

export function createBrandIdentityServer(runDir?: string) {
  return createSdkMcpServer({
    name: 'brand',
    // 0.3.0 = page_text (verbatim fetch replacing WebFetch on collect) + review
    // cards + rating/FAQ/description extraction + Shopify full-gallery tier.
    // 0.2.0 = product_photos (structured-data pack shots from PDPs).
    version: '0.3.0',
    tools: [brandIdentityTool(runDir), productPhotosTool(runDir), pageTextTool(runDir)],
  });
}

export const BRAND_IDENTITY_TOOL = 'mcp__brand__brand_identity';
export const PRODUCT_PHOTOS_TOOL = 'mcp__brand__product_photos';
export const PAGE_TEXT_TOOL = 'mcp__brand__page_text';
