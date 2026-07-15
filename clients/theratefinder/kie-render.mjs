// Render a render-jobs JSON via KIE (GPT Image 2) — the PRIMARY renderer.
// Uploads local refs through KIE's file API (base64), then createTask on
// gpt-image-2-image-to-image (or text-to-image when a job has no refs), polls, downloads.
//   cd /Users/chakra/Documents/Agents/creative_agent
//   node clients/theratefinder/kie-render.mjs clients/theratefinder/render-jobs/<job>.json
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const CLIENT_DIR = __dirname; // refs + outDir in job files are relative to clients/theratefinder
for (const f of ['.env.local', '.env']) {
  const p = path.join(REPO_ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const KEY = process.env.KIE_API_KEY;
if (!KEY) { console.error('missing KIE_API_KEY'); process.exit(1); }
const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

const jobFile = process.argv[2];
const spec = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
const outDir = path.resolve(CLIENT_DIR, spec.outDir ?? 'renders');
fs.mkdirSync(outDir, { recursive: true });

async function uploadRef(rel) {
  const abs = path.resolve(CLIENT_DIR, rel);
  const b64 = fs.readFileSync(abs).toString('base64');
  const ext = path.extname(abs).slice(1) || 'png';
  const r = await fetch('https://kieai.redpandaai.co/api/file-base64-upload', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      base64Data: `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${b64}`,
      uploadPath: 'theratefinder-refs', fileName: path.basename(abs),
    }),
  });
  const d = await r.json().catch(() => ({}));
  const url = d?.data?.downloadUrl ?? d?.data?.fileUrl ?? d?.data?.url;
  if (!url) throw new Error(`ref upload failed (${r.status}): ${JSON.stringify(d).slice(0, 300)}`);
  console.log(`  ref uploaded: ${rel} → ${url}`);
  return url;
}

async function run(job) {
  const hasRefs = Array.isArray(job.refs) && job.refs.length > 0;
  const input = { prompt: job.prompt, aspect_ratio: job.size ?? '4:5', resolution: '2K' };
  let model = 'gpt-image-2-text-to-image';
  if (hasRefs) {
    model = 'gpt-image-2-image-to-image';
    input.input_urls = [];
    for (const r of job.refs) input.input_urls.push(await uploadRef(r));
  }
  const cr = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST', headers: H, body: JSON.stringify({ model, input }),
  });
  const cd = await cr.json();
  if (cd?.code !== 200 || !cd?.data?.taskId) throw new Error(`createTask: ${JSON.stringify(cd).slice(0, 300)}`);
  const taskId = cd.data.taskId;
  console.log(`  task ${taskId} (${model})`);
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > 10 * 60 * 1000) throw new Error('poll timeout');
    await new Promise((res) => setTimeout(res, 10000));
    const qr = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: H });
    const qd = await qr.json();
    const st = qd?.data?.state;
    if (st === 'fail') throw new Error(`FAIL ${qd.data.failCode} ${qd.data.failMsg}`);
    if (st === 'success') {
      const urls = JSON.parse(qd.data.resultJson ?? '{}')?.resultUrls ?? [];
      if (!urls.length) throw new Error('no resultUrls');
      const buf = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const file = path.join(outDir, `${job.name}_${stamp}.png`);
      fs.writeFileSync(file, buf);
      console.log(`  ✓ ${file} (${(buf.length / 1024).toFixed(0)}KB, credits=${qd.data.creditsConsumed})`);
      return file;
    }
    process.stdout.write(`\r  ${st} ${((Date.now() - t0) / 1000) | 0}s  `);
  }
}

for (const job of spec.jobs) {
  console.log(`• ${job.name}`);
  try { await run(job); } catch (e) { console.error(`  ✗ ${e.message}`); process.exitCode = 1; }
}
