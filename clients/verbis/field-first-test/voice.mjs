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
const KEY = process.env.PERPLEXITY_API_KEY;
const QS = [
  'Verbatim quotes from Indian PTE Academic test takers on Reddit/Quora/forums 2024-2026 about RETAKING the exam — exact sentences about being stuck at a score (65, 58, 70s), failing speaking or writing despite good English, frustration with attempts. Paste exact words with sources.',
  'Verbatim quotes from PTE takers about the SPEAKING section scoring low despite fluent English — exact sentences about the microphone, the algorithm, "my English is good but", templates. Exact words, sources.',
  'Verbatim quotes from students who PASSED PTE with 79+ or 90 after using templates or a strategy change — exact sentences about what changed, "cleared in one attempt", "templates worked". Sources.',
  'What do Indian students say about PTE exam cost and retake fees in 2025-2026 — verbatim complaints about ₹17,000-18,000 exam fee, cost of retaking. Exact quotes with sources.',
];
const out = [];
for (const q of QS) {
  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'sonar-pro', messages: [{ role: 'user', content: q }], search_recency_filter: 'year' }),
  });
  const d = await r.json();
  out.push({ q, a: d?.choices?.[0]?.message?.content ?? '(none)', c: (d?.citations ?? []).slice(0, 8) });
}
fs.writeFileSync(path.join(__dirname, 'field', 'student-voice.md'), out.map((o) => `## Q: ${o.q}\n\n${o.a}\n\nSources: ${o.c.join(' ')}\n`).join('\n---\n'));
console.log(out.map((o) => o.a.slice(0, 700)).join('\n\n════════\n\n'));
