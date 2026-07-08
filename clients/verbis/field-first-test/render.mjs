// Render the 3 compiled prompts via KIE — GPT Image-2 (gpt-image-2-text-to-image), 4:5, 2K.
// Parses prompts.md (single source of truth), creates 3 tasks, polls, downloads to renders/.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
for (const f of ['.env.local', '.env']) {
  const p = path.join(REPO_ROOT, f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
const KEY = process.env.KIE_API_KEY;
if (!KEY) { console.error('missing KIE_API_KEY (add to repo-root .env.local)'); process.exit(1); }

// Parse prompts.md → the three compiled prompts (from "Direct-response ad image" to section end).
const md = fs.readFileSync(path.join(__dirname, 'prompts.md'), 'utf8');
const sections = md.split(/^## Creative /m).slice(1);
const prompts = sections.map((s) => {
  const name = s.split('\n')[0].trim();
  const start = s.indexOf('Direct-response ad image');
  const body = s.slice(start).split(/^---$/m)[0].trim();
  return { name, prompt: body };
});
console.log(`parsed ${prompts.length} prompts: ${prompts.map((p) => p.name).join(' | ')}`);

const H = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function createTask(prompt) {
  const r = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST', headers: H,
    body: JSON.stringify({ model: 'gpt-image-2-text-to-image', input: { prompt, aspect_ratio: '4:5', resolution: '2K' } }),
  });
  const d = await r.json();
  if (d?.code !== 200 || !d?.data?.taskId) throw new Error(`createTask failed: ${JSON.stringify(d).slice(0, 300)}`);
  return d.data.taskId;
}

async function poll(taskId, label, maxMin = 8) {
  const t0 = Date.now();
  for (;;) {
    if ((Date.now() - t0) / 60000 > maxMin) throw new Error(`${label}: poll timeout`);
    const r = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: H });
    const d = await r.json();
    const st = d?.data?.state;
    if (st === 'success') {
      const urls = JSON.parse(d.data.resultJson ?? '{}')?.resultUrls ?? [];
      if (!urls.length) throw new Error(`${label}: success but no resultUrls`);
      return { urls, credits: d.data.creditsConsumed, ms: d.data.costTime };
    }
    if (st === 'fail') throw new Error(`${label}: FAIL ${d.data.failCode} ${d.data.failMsg}`);
    process.stdout.write(`\r${label}: ${st} ${(Date.now() - t0) / 1000 | 0}s   `);
    await new Promise((res) => setTimeout(res, 10000));
  }
}

const outDir = path.join(__dirname, 'renders');
fs.mkdirSync(outDir, { recursive: true });

const results = await Promise.allSettled(prompts.map(async (p, i) => {
  const id = await createTask(p.prompt);
  console.log(`\ncreative ${i + 1} (${p.name}) → task ${id}`);
  const { urls, credits, ms } = await poll(id, `creative ${i + 1}`);
  const buf = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
  const file = path.join(outDir, `creative-${i + 1}.png`);
  fs.writeFileSync(file, buf);
  console.log(`\ncreative ${i + 1}: saved ${file} (${(buf.length / 1024 / 1024).toFixed(1)}MB, ${(ms / 1000).toFixed(0)}s, credits=${credits})`);
  return file;
}));
for (const [i, r] of results.entries()) {
  if (r.status === 'rejected') console.error(`creative ${i + 1}: ERROR ${r.reason?.message ?? r.reason}`);
}
