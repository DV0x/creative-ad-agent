#!/usr/bin/env node
/**
 * Image-analysis lens, step 3 — build a self-contained side-by-side HTML gallery.
 *
 * Joins manifest.json (image + hook/copy/offer/meta) with analysis.json (the vision
 * read: layout, type, imagery, product handling, palette, and how the angle renders)
 * into one filterable page. Each card = image | copy + meta | visual recipe. Grouped
 * by format, filterable by market/brand/text, revealed-winner ranked. Open index.html
 * in a browser (images load from the local images/ folder).
 *
 * Usage: node build-image-gallery.mjs <slug>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../..');
const slug = process.argv[2];
if (!slug) { console.error('usage: node build-image-gallery.mjs <slug>'); process.exit(1); }
const dir = path.join(REPO, 'docs/research/ad-library', slug);

const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const analysis = JSON.parse(fs.readFileSync(path.join(dir, 'analysis.json'), 'utf8'));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const top = (arr) => { const m = {}; arr.forEach((x) => { m[x] = (m[x] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };

// join + order
const rows = manifest.map((m) => ({ ...m, a: analysis[m.id] || {} }));
const byFormat = {};
for (const r of rows) (byFormat[r.a.format_label || 'other'] ||= []).push(r);
const formatOrder = Object.keys(byFormat).sort((a, b) => byFormat[b].length - byFormat[a].length);
// within a format: revealed-winner first
for (const f of formatOrder) byFormat[f].sort((x, y) => (y.days_running - x.days_running) || (y.variants - x.variants));

const brands = [...new Set(rows.map((r) => r.brand))].sort();
const winner = (r) => r.days_running >= 120 || r.variants >= 4; // budget-endorsed proxy
// DR = built to convert now (offer/proof/urgency) · MID = mid-funnel/trust · BRAND = awareness/affinity
const DR_FORMATS = new Set(['offer-discount', 'bundle', 'subscription', 'sampler-trial', 'PAS', 'us-vs-them', 'stat', 'science', 'listicle', "what's-inside", 'catalog-DPA']);
const MID_FORMATS = new Set(['testimonial', 'founder-POV', 'celebrity-ambassador', 'new-launch', 'hero-product']);
const bucketOf = (f) => DR_FORMATS.has(f) ? 'DR' : (MID_FORMATS.has(f) ? 'mid' : 'brand');
const bucketCount = (bk) => rows.filter((r) => bucketOf(r.a.format_label) === bk).length;

function card(r) {
  const a = r.a;
  const shared = r.shared_by_ads > 1 ? `<span class="chip muted">runs under ${r.shared_by_ads} concepts</span>` : '';
  const win = winner(r) ? `<span class="chip win">★ revealed-winner</span>` : '';
  const attr = (k, v) => v ? `<div class="attr"><span>${k}</span><b>${esc(v)}</b></div>` : '';
  const media = r.format === 'VIDEO' ? 'video' : 'static';
  const bk = bucketOf(a.format_label);
  const bkChip = `<span class="chip bk bk-${bk}"${media === 'video' ? ' title="bucket inferred from a single video frame — less reliable"' : ''}>${bk.toUpperCase()}${media === 'video' ? '?' : ''}</span>`;
  return `<div class="card" data-format="${esc(a.format_label)}" data-market="${esc(r.market)}" data-brand="${esc(r.brand)}" data-density="${esc(a.text_density)}" data-imagery="${esc(a.imagery_type)}" data-media="${media}" data-bucket="${bk}" data-text="${esc((r.hook || '') + ' ' + (r.body || '') + ' ' + (a.angle_render || '') + ' ' + (a.notable || '') + ' ' + r.brand).toLowerCase()}">
  <div class="col-img"><img loading="lazy" src="${esc(r.file)}" alt="${esc(r.brand)}"></div>
  <div class="col-copy">
    <div class="badges">${bkChip}<span class="chip mk mk-${esc(r.market)}">${esc(r.market)}</span><span class="chip brand">${esc(r.brand)}</span><span class="chip fmt">${esc(r.format)}</span>${win}${shared}</div>
    ${r.hook ? `<div class="hook">${esc(r.hook)}</div>` : '<div class="hook muted">— no headline —</div>'}
    ${r.body ? `<div class="body">${esc(r.body)}</div>` : ''}
    <div class="meta">
      ${r.cta_text ? `<span>CTA: <b>${esc(r.cta_text)}</b></span>` : ''}
      <span>${r.days_running}d running</span><span>${r.variants} variant${r.variants === 1 ? '' : 's'}</span>
      ${r.link_domain ? `<span>${esc(r.link_domain)}</span>` : ''}
      ${r.permalink ? `<a href="${esc(r.permalink)}" target="_blank">ad ↗</a>` : ''}
    </div>
  </div>
  <div class="col-read">
    <div class="angle"><span class="lbl">how the angle renders</span>${esc(a.angle_render)}</div>
    <div class="attrs">
      ${attr('imagery', a.imagery_type)}
      ${attr('layout', a.layout)}
      ${attr('type', a.type_treatment)}
      ${attr('product', a.product_handling)}
      ${attr('palette', a.palette)}
      ${attr('text on image', a.text_on_image)}
      ${attr('density', a.text_density)}
    </div>
    ${a.notable ? `<div class="notable">💡 ${esc(a.notable)}</div>` : ''}
  </div>
  ${r.variant_count > 1 ? `<div class="pool"><span class="pool-lbl">↻ This DCO ad rotates ${r.variant_count} designs Meta shuffles — the 1st is analysed above:</span><div class="pool-thumbs">${r.variant_files.map((f, i) => `<a href="${esc(f)}" target="_blank" title="open full size"><img loading="lazy" src="${esc(f)}"><span>${i + 1}</span></a>`).join('')}</div></div>` : ''}
</div>`;
}

function section(f) {
  const list = list_ = byFormat[f];
  const n = list.length;
  const inc = list.filter((r) => r.market === 'IN').length;
  const usc = n - inc;
  const img = top(list.map((r) => r.a.imagery_type)).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(', ');
  const dens = top(list.map((r) => r.a.text_density)).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(', ');
  return `<section class="fmt-sec" data-format="${esc(f)}">
    <h2 id="f-${esc(f)}">${esc(f)} <span class="count">${n}</span></h2>
    <div class="sec-stats">IN ${inc} · US ${usc} &nbsp;|&nbsp; imagery: ${esc(img)} &nbsp;|&nbsp; text: ${esc(dens)}</div>
    <div class="cards">${list.map(card).join('\n')}</div>
  </section>`;
}
let list_;

const nav = formatOrder.map((f) => `<button class="navchip" data-f="${esc(f)}">${esc(f)} <span>${byFormat[f].length}</span></button>`).join('');

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ingestibles ad-creative analysis — ${rows.length} ads</title>
<style>
:root{--cream:#FBF9F5;--ink:#1a1714;--wine:#AB406C;--lime:#C1FF64;--line:#e7e1d8;--muted:#8a8178}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
header{padding:28px 32px 14px}
h1{margin:0 0 6px;font-size:26px;letter-spacing:-.02em}
.sub{color:var(--muted);max-width:900px}
.thesis{margin:14px 0 0;padding:12px 16px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--wine);border-radius:8px;max-width:1000px}
.thesis b{color:var(--wine)}
.bar{position:sticky;top:0;z-index:10;background:rgba(251,249,245,.96);backdrop-filter:blur(6px);padding:12px 32px;border-bottom:1px solid var(--line)}
.bar input{padding:8px 12px;border:1px solid var(--line);border-radius:8px;width:280px;font-size:14px}
.bar .group{display:inline-flex;gap:6px;margin-left:10px;vertical-align:middle}
.btn{padding:7px 12px;border:1px solid var(--line);background:#fff;border-radius:20px;cursor:pointer;font-size:13px}
.btn.on{background:var(--wine);color:#fff;border-color:var(--wine)}
.count-live{color:var(--muted);margin-left:10px;font-size:13px}
.nav{padding:10px 32px;display:flex;flex-wrap:wrap;gap:6px;border-bottom:1px solid var(--line)}
.navchip{padding:5px 10px;border:1px solid var(--line);background:#fff;border-radius:16px;cursor:pointer;font-size:12px;color:var(--ink)}
.navchip span{color:var(--muted)}
.navchip.on{background:var(--ink);color:#fff}.navchip.on span{color:#cfc7bd}
main{padding:8px 32px 80px}
.fmt-sec{margin:26px 0}
.fmt-sec h2{font-size:21px;margin:0 0 2px;text-transform:capitalize;border-bottom:2px solid var(--wine);display:inline-block;padding-bottom:2px}
.fmt-sec h2 .count{color:var(--wine);font-size:15px}
.sec-stats{color:var(--muted);font-size:13px;margin:6px 0 14px}
.cards{display:flex;flex-direction:column;gap:14px}
.card{display:grid;grid-template-columns:260px 1.1fr 1.2fr;gap:18px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px;align-items:start}
.col-img>img{width:100%;border-radius:8px;display:block;background:#f0ece5}
.pool{grid-column:1/-1;margin-top:4px;border-top:1px dashed var(--line);padding-top:10px}
.pool-lbl{display:block;font-size:11px;color:var(--wine);font-weight:700;margin-bottom:8px}
.pool-thumbs{display:flex;flex-wrap:wrap;gap:8px}
.pool-thumbs a{position:relative;display:block}
.pool-thumbs img{width:108px;height:108px;object-fit:cover;border-radius:6px;border:1px solid var(--line);cursor:pointer;display:block}
.pool-thumbs a span{position:absolute;top:3px;left:3px;background:rgba(0,0,0,.65);color:#fff;font-size:10px;line-height:1.7;padding:0 6px;border-radius:8px}
.pool-thumbs a:hover img{border-color:var(--wine)}
.badges{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px}
.chip{font-size:11px;padding:2px 8px;border-radius:12px;background:#f0ece5;color:#5b5249;white-space:nowrap}
.chip.mk-IN{background:#fde8ef;color:var(--wine)}.chip.mk-US{background:#e8f0ff;color:#3a5bbf}
.chip.brand{background:#efeae2;font-weight:600}
.chip.fmt{background:#f5f1ea;color:var(--muted)}
.chip.win{background:var(--lime);color:#2c3a00;font-weight:600}
.chip.muted{background:transparent;color:var(--muted);border:1px dashed var(--line)}
.chip.bk{font-weight:800;letter-spacing:.03em}
.chip.bk-DR{background:#1f7a3d;color:#fff}
.chip.bk-mid{background:#e8a13a;color:#3a2600}
.chip.bk-brand{background:#5b7cc4;color:#fff}
.hook{font-size:16px;font-weight:700;letter-spacing:-.01em;margin-bottom:6px}
.hook.muted{font-weight:400;color:var(--muted)}
.body{font-size:13px;color:#544b42;margin-bottom:10px;white-space:pre-wrap;max-height:160px;overflow:auto}
.meta{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--muted)}
.meta b{color:var(--ink)}.meta a{color:var(--wine);text-decoration:none}
.col-read{border-left:1px solid var(--line);padding-left:16px}
.angle{background:linear-gradient(0deg,#f6ffe3,#fbfff2);border:1px solid #dcefb0;border-radius:8px;padding:10px;font-size:13.5px;margin-bottom:10px}
.angle .lbl{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6b8000;margin-bottom:3px;font-weight:700}
.attrs{display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;font-size:12px}
.attr{display:flex;flex-direction:column}
.attr span{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.04em}
.attr b{font-weight:500}
.notable{margin-top:10px;font-size:12.5px;color:#3f3a34;background:#faf7f1;border-radius:6px;padding:8px}
@media(max-width:1100px){.card{grid-template-columns:200px 1fr}.col-read{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding-left:0;padding-top:12px}}
</style></head><body>
<header>
  <h1>Better-for-you ingestibles — ad-creative analysis</h1>
  <div class="sub">${rows.length} analysed creatives · ${rows.filter(r=>r.market==='IN').length} India + ${rows.filter(r=>r.market==='US').length} USA · 16 brands · pulled from Meta Ad Library 2026-06-16. Each card pairs the real creative with its copy and a vision read of <i>how the angle renders</i>. <b>DCO cards show their full rotation pool</b> (the ${rows.reduce((n,r)=>n+(r.variant_count||1),0)} total images Meta shuffles) as thumbnails under the main image. Sorted by revealed-winner strength (days running × variants — what the brand's budget endorses; no perf data exists).</div>
  <div class="thesis"><b>The split:</b> India sells <b>benefit-first</b> — offer/discount (30 vs 1 US), bundles, science, problem→solution, hero pack-shots, claims & prices stacked on-image. USA sells <b>brand-first</b> — flavor-worlds, lifestyle, new-launch, clean creatives with the health benefit as background. Templating rule: <b>IN ingestibles = prove-the-health</b>; <b>US functional bev = fun-brand-first</b>.</div>
</header>
<div class="bar">
  <input id="q" placeholder="search hook / copy / visual read / brand…" oninput="flt()">
  <span class="group"><button class="btn market on" data-m="all" onclick="setM(this)">All</button><button class="btn market" data-m="IN" onclick="setM(this)">India</button><button class="btn market" data-m="US" onclick="setM(this)">USA</button></span>
  <span class="group"><button class="btn media" data-md="all" onclick="setMed(this)">All media</button><button class="btn media on" data-md="static" onclick="setMed(this)">🖼 Statics only (${rows.filter(r=>r.format!=='VIDEO').length})</button><button class="btn media" data-md="video" onclick="setMed(this)">▶ Video frames (${rows.filter(r=>r.format==='VIDEO').length})</button></span>
  <span class="group"><button class="btn bkf on" data-bk="all" onclick="setBk(this)">All goals</button><button class="btn bkf" data-bk="DR" onclick="setBk(this)">DR (${bucketCount('DR')})</button><button class="btn bkf" data-bk="mid" onclick="setBk(this)">Mid (${bucketCount('mid')})</button><button class="btn bkf" data-bk="brand" onclick="setBk(this)">Brand (${bucketCount('brand')})</button></span>
  <span class="count-live" id="live"></span>
</div>
<div class="nav"><button class="navchip on" data-f="all" onclick="setF(this)">all formats</button>${nav.replace(/data-f/g, 'onclick="setF(this)" data-f')}</div>
<main>${formatOrder.map(section).join('\n')}</main>
<script>
let M='all',F='all',MED='static',BK='all';
function setM(b){document.querySelectorAll('.market').forEach(x=>x.classList.remove('on'));b.classList.add('on');M=b.dataset.m;flt()}
function setF(b){document.querySelectorAll('.navchip').forEach(x=>x.classList.remove('on'));b.classList.add('on');F=b.dataset.f;flt()}
function setMed(b){document.querySelectorAll('.media').forEach(x=>x.classList.remove('on'));b.classList.add('on');MED=b.dataset.md;flt()}
function setBk(b){document.querySelectorAll('.bkf').forEach(x=>x.classList.remove('on'));b.classList.add('on');BK=b.dataset.bk;flt()}
function flt(){
  const q=document.getElementById('q').value.toLowerCase().trim();
  let shown=0;
  document.querySelectorAll('.card').forEach(c=>{
    const ok=(M==='all'||c.dataset.market===M)&&(F==='all'||c.dataset.format===F)&&(MED==='all'||c.dataset.media===MED)&&(BK==='all'||c.dataset.bucket===BK)&&(!q||c.dataset.text.includes(q));
    c.style.display=ok?'':'none'; if(ok)shown++;
  });
  document.querySelectorAll('.fmt-sec').forEach(s=>{
    const any=[...s.querySelectorAll('.card')].some(c=>c.style.display!=='none');
    s.style.display=any?'':'none';
  });
  document.getElementById('live').textContent='showing '+shown+' of '+document.querySelectorAll('.card').length;
}
flt();
</script></body></html>`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`✓ gallery: docs/research/ad-library/${slug}/index.html  (${rows.length} cards, ${formatOrder.length} formats)`);
