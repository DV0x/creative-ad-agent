/**
* TheRateFinder render helper (fal.ai FAILOVER — prefer kie-render.mjs) — GPT Image 2 (OpenAI, via fal.ai).  [CommonJS]
 *
 * WHY GPT Image 2: text-rendering accuracy ~99% (vs Nano Banana ~90-95%) — our
 * creatives are copy-heavy (headline + ₹589 + trust bar), so text fidelity wins.
 * Endpoints:  text-to-image = fal-ai/gpt-image-2 ;  edit = fal-ai/gpt-image-2/edit
 * Edit mode binds real reference images (Parth's face, the score cards) so the
 * model builds the ad AROUND them instead of inventing them.
 *
 * RUN (FAL_KEY is in repo-root .env; @fal-ai/client is in agent-loop/node_modules;
 * CommonJS honors NODE_PATH so we point it there):
 *   cd /Users/chakra/Documents/Agents/creative_agent
 *   set -a; source ./.env; source ./.env.local; set +a
 *   NODE_PATH=./agent-loop/node_modules node clients/theratefinder/render.cjs clients/theratefinder/render-jobs/<job>.json
 *
 * JOB FILE shape:
 *   { "quality":"high", "size":"4:5", "outDir":"renders",
 *     "jobs":[ { "name":"b4-social-proof", "size":"4:5", "prompt":"...",
 *                "refs":["assets/scorecards-redacted/card-aarti.png"] } ] }
 *   - size: 1:1 | 4:5 | 9:16 | 16:9 | 1.91:1 | a fal preset | {width,height} (mult of 16)
 *   - refs: local paths (relative to clients/theratefinder) → uploaded to fal → edit endpoint.
 *           omit refs → text-to-image.
 */
const { fal } = require('@fal-ai/client');
const fs = require('node:fs');
const path = require('node:path');

if (!process.env.FAL_KEY) {
  console.error('✗ FAL_KEY not set. Run:  set -a; source ./.env; source ./.env.local; set +a');
  process.exit(1);
}
fal.config({ credentials: process.env.FAL_KEY });

// Aspect → concrete pixels (all multiples of 16; GPT Image 2 requires that).
const SIZE = {
  '1:1':    { width: 1440, height: 1440 },
  '4:5':    { width: 1152, height: 1440 }, // Meta feed portrait
  '9:16':   { width: 1088, height: 1920 }, // stories/reels
  '16:9':   { width: 1920, height: 1088 },
  '1.91:1': { width: 1456, height: 768 },  // Meta landscape link
};
const PRESETS = new Set(['square_hd','square','portrait_4_3','portrait_16_9','landscape_4_3','landscape_16_9','auto']);
function toImageSize(s) {
  if (!s) return undefined;
  if (typeof s === 'object') return s;
  if (SIZE[s]) return SIZE[s];
  if (PRESETS.has(s)) return s;
  throw new Error(`unknown size "${s}"`);
}

async function uploadLocal(rel) {
  const abs = path.resolve(__dirname, rel);
  const buf = fs.readFileSync(abs);
  const name = path.basename(abs);
  const type = name.endsWith('.png') ? 'image/png' : /jpe?g$/i.test(name) ? 'image/jpeg' : 'application/octet-stream';
  let blob;
  try { blob = new File([buf], name, { type }); } catch { blob = new Blob([buf], { type }); }
  return await fal.storage.upload(blob);
}

// fal mirrors endpoints under fal-ai/ and openai/ — try primary, fall back on 404.
async function subscribeWithFallback(primary, alt, input) {
  try {
    return await fal.subscribe(primary, { input, logs: false });
  } catch (e) {
    const m = String((e && e.message) || e);
    if (alt && /(404|not.?found|no endpoint|unknown)/i.test(m)) {
      console.warn(`  ↪ ${primary} failed (${m.slice(0, 60)}), retrying ${alt}`);
      return await fal.subscribe(alt, { input, logs: false });
    }
    throw e;
  }
}

async function runJob(job, defaults) {
  const image_size = toImageSize(job.size || defaults.size);
  const quality = job.quality || defaults.quality || 'high';
  const refs = job.refs || [];
  const input = { prompt: job.prompt, num_images: 1, quality, output_format: 'png' };
  if (image_size) input.image_size = image_size;

  let res;
  if (refs.length) {
    input.image_urls = [];
    for (const r of refs) input.image_urls.push(await uploadLocal(r));
    res = await subscribeWithFallback('fal-ai/gpt-image-2/edit', 'openai/gpt-image-2/edit', input);
  } else {
    res = await subscribeWithFallback('fal-ai/gpt-image-2', 'openai/gpt-image-2', input);
  }

  const img = ((res && res.data && res.data.images) || (res && res.images) || [])[0];
  if (!img || !img.url) throw new Error('no image url; raw=' + JSON.stringify(res).slice(0, 300));

  const outDir = path.resolve(__dirname, defaults.outDir || 'renders');
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fp = path.join(outDir, `${job.name}_${stamp}.png`);
  const bytes = Buffer.from(await (await fetch(img.url)).arrayBuffer());
  fs.writeFileSync(fp, bytes);
  return { name: job.name, mode: refs.length ? 'edit' : 't2i', filePath: fp, sizeKB: Math.round(bytes.length / 1024), falUrl: img.url };
}

(async () => {
  const jobFile = process.argv[2];
  if (!jobFile) { console.error('usage: node render.cjs <job.json>'); process.exit(1); }
  const spec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), jobFile), 'utf8'));
  const defaults = { size: spec.size, quality: spec.quality, outDir: spec.outDir };

  const out = [];
  for (const job of spec.jobs) {
    process.stdout.write(`• ${job.name} (${job.refs && job.refs.length ? 'edit' : 't2i'}, ${job.size || defaults.size || 'default'}) … `);
    try {
      const r = await runJob(job, defaults);
      console.log(`OK → ${path.relative(process.cwd(), r.filePath)} (${r.sizeKB}KB)`);
      out.push(r);
    } catch (e) {
      console.log(`FAIL :: ${e.message}`);
      out.push({ name: job.name, error: e.message });
    }
  }
  const ok = out.filter((r) => !r.error).length;
  const outDir = path.resolve(__dirname, spec.outDir || 'renders');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '_last-render.json'), JSON.stringify(out, null, 2));
  console.log(`\n${ok}/${spec.jobs.length} rendered → clients/theratefinder/${spec.outDir || 'renders'}/`);
})();
