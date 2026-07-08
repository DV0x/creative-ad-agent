// Discovery pass — NO assumptions: ask Perplexity who actually advertises to this
// buyer and who runs paid-workshop constructions across categories in India.
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
if (!KEY) { console.error('missing PERPLEXITY_API_KEY'); process.exit(1); }

const QUESTIONS = [
  'Which PTE coaching brands, academies, or prep platforms actively advertise on Instagram/Facebook in India in 2025-2026? Include the specialist tier: single-trainer academies, PTE template sellers, mock-test platforms (e.g., anything like APEUni, Sure Way English, Vision Language Experts, EnglishWise, Edutrainex or similar). List BRAND NAMES with a few words each. I need names as they appear on their Facebook pages.',
  'Which Indian companies run paid ONLINE WORKSHOP or MASTERCLASS ads on Instagram/Facebook at impulse price points (₹99-₹999) in 2025-2026 — across ANY category: stock trading, digital marketing, AI tools, data skills, astrology, fitness, cooking, personal finance, English speaking? These are the "pay ₹X for a 2-4 hour live workshop" ads. List BRAND NAMES (companies or well-known instructor brands) with their category. Names as they appear on Facebook pages.',
  'Which ed-tech or coaching brands in India are known in the performance-marketing community for high-performing or distinctive Meta ad creatives in 2025-2026 (talked about in marketing newsletters, Foreplay/ad-library roundups, growth communities)? List BRAND NAMES and what their creative style is known for.',
];

const out = [];
for (const q of QUESTIONS) {
  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: q }],
      search_recency_filter: 'year',
    }),
  });
  const d = await r.json();
  const answer = d?.choices?.[0]?.message?.content ?? '(no answer)';
  const cites = (d?.citations ?? []).slice(0, 12);
  out.push({ q, answer, cites });
  console.log('Q:', q.slice(0, 90) + '…\n');
  console.log(answer, '\n');
  console.log('sources:', cites.join(' '), '\n' + '─'.repeat(80));
}
fs.writeFileSync(path.join(__dirname, 'field', 'discovery.md'),
  out.map((o) => `## Q: ${o.q}\n\n${o.answer}\n\nSources: ${o.cites.join(' ')}\n`).join('\n---\n'));
console.log('\nwritten → field/discovery.md');
