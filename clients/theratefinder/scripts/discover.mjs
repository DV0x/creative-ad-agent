// Phase 0 — DISCOVERY. No assumptions: ask Perplexity who ACTUALLY advertises to this
// buyer on Meta in Canada, in three rings:
//   A) direct   — Canadian mortgage brokers / brokerages / rate platforms on Meta
//   B) specialist — the "hard to approve" tier: private, B-lender, declined, self-employed,
//                   investor/fix-and-flip, power-of-sale rescue (this is TheRateFinder's real lane)
//   C) construction masters — who runs *good* finance creative anywhere (steal the construction, not the surface)
// Writes field/discovery.md. ~4 Perplexity calls.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CLIENT_DIR = path.resolve(__dirname, '..');
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
  ['A · direct',
   'Which Canadian mortgage brokers, mortgage brokerages, and mortgage rate-comparison platforms actively advertise on Facebook and Instagram in Canada in 2025-2026? Include the big aggregators (anything like Ratehub, ratesdotca, Nesto, Pine, Homewise, True North Mortgage, Butler Mortgage), the national brokerage networks (Dominion Lending, Mortgage Alliance, Verico, Centum, TMG), AND individual mortgage-broker personal brands who run their own Meta ads. List BRAND NAMES exactly as they appear on their Facebook pages, with a few words each.'],

  ['B · specialist / hard-to-approve',
   'Which Canadian mortgage lenders or brokers advertise specifically to borrowers who CANNOT get approved by a bank — self-employed borrowers, new-to-Canada / newcomer borrowers, people with bad or bruised credit, people declined by their bank, people in consumer proposal or bankruptcy, non-resident buyers? Also: which Canadian brands advertise PRIVATE mortgages, B-lender / alternative mortgages, second mortgages, bridge loans, home-equity rescue, POWER OF SALE rescue financing, and investor financing (fix-and-flip, BRRRR, construction loans) — especially in Ontario and the Greater Toronto Area? List BRAND NAMES as they appear on Facebook pages.'],

  ['C · construction masters (finance creative)',
   'Which financial-services or lending brands run the highest-performing or most distinctive Meta/Facebook ad creatives in 2025-2026 — talked about in performance-marketing newsletters, ad-library roundups, Foreplay/AdSpy swipe files, or growth communities? Include mortgage, personal loans, credit repair, debt consolidation, and fintech. I care about the CREATIVE CONSTRUCTION (what the ad actually looks like and says), not the company size. List BRAND NAMES and describe what their creative style is known for.'],

  ['D · the buyer + the objection',
   'For Canadian mortgage borrowers in 2025-2026: what are the most common REASONS people get DECLINED by a bank for a mortgage, and what do those borrowers search for or worry about afterwards? What is the emotional experience of being declined? Also: what are the biggest complaints, fears, and objections Canadians have about using a MORTGAGE BROKER instead of their bank (e.g. is the broker paid by me? is my credit score hit? is this a scam? are private lenders predatory?). Quote real borrower language from forums (Reddit r/PersonalFinanceCanada, r/canadahousing) where possible.'],
];

const out = [];
for (const [ring, q] of QUESTIONS) {
  process.stdout.write(`• ${ring} ... `);
  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: q }],
      search_recency_filter: 'year',
    }),
  });
  const d = await r.json();
  const answer = d?.choices?.[0]?.message?.content ?? '(no answer)';
  const cites = (d?.citations ?? []).slice(0, 12);
  out.push({ ring, q, answer, cites });
  console.log(`${answer.length} chars, ${cites.length} cites`);
}

const md = ['# TheRateFinder — field discovery (Perplexity)', '', `_${new Date().toISOString().slice(0, 10)}_`, '']
  .concat(out.flatMap(({ ring, q, answer, cites }) => [
    `## ${ring}`, '', `**Q:** ${q}`, '', answer, '',
    cites.length ? `**Sources:** ${cites.map((c, i) => `[${i + 1}](${c})`).join(' · ')}` : '', '', '---', '',
  ]));
fs.mkdirSync(path.join(CLIENT_DIR, 'field'), { recursive: true });
fs.writeFileSync(path.join(CLIENT_DIR, 'field', 'discovery.md'), md.join('\n'));
console.log('\nwritten → field/discovery.md');
