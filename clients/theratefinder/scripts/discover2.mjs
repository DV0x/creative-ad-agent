// Phase 0b — DISCOVERY ROUND 2. Round 1 named brands that mostly did NOT resolve to
// Canadian Meta pages (Clearkey/LendCity/Pegasus = US pages). This round asks for
// advertisers that demonstrably HAVE Facebook/Instagram presence, and adds the local
// ring: Woodbridge/Vaughan/GTA — TheRateFinder's actual backyard.
// Writes field/discovery-2.md.
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

const ASK = `For EVERY brand you name, you MUST give: (a) the exact Facebook PAGE NAME as it appears on Facebook, and (b) the Instagram handle if one exists. Only list brands you can actually evidence have a real social presence — say "no social found" rather than guessing. Prefer CANADIAN companies; explicitly mark any that are US-based.`;

const QUESTIONS = [
  ['E · GTA / Ontario private + alternative lenders',
   `Which Ontario / Greater-Toronto-Area mortgage brokerages, private lenders, and MICs (mortgage investment corporations) have an active social-media presence promoting PRIVATE mortgages, SECOND mortgages, home-equity loans, bridge loans, POWER OF SALE / foreclosure rescue, and bad-credit or bank-declined mortgages? Think firms in Toronto, Vaughan, Woodbridge, Mississauga, Brampton, Markham. ${ASK}`],

  ['F · Woodbridge / Vaughan local ring',
   `Who are the mortgage brokers and mortgage agents operating in WOODBRIDGE and VAUGHAN, Ontario (and the immediate GTA north — Kleinburg, Maple, Concord, Richmond Hill)? Include brokerage firms and individual mortgage agents with personal brands. This is a heavily Italian-Canadian area with a lot of self-employed contractors and small business owners. ${ASK}`],

  ['G · Canadian commercial / investor financing',
   `Which Canadian brokers or lenders advertise COMMERCIAL mortgages, construction financing, fix-and-flip / BRRRR investor loans, and multi-unit / apartment building financing to real-estate investors — and market themselves on Instagram, YouTube or Facebook? Include the Canadian real-estate-investor influencer brands who promote financing. ${ASK}`],

  ['H · who is actually running Meta ADS (not just posting)',
   `Which Canadian mortgage brokers, mortgage brokerages, or lenders are known to actively RUN PAID Facebook/Instagram ADS (not just organic posts) — for example ones whose ads people have discussed, complained about, or that appear in the Meta Ad Library? Include lead-generation-heavy mortgage brands, "get approved" advertisers, debt-consolidation-via-home-equity advertisers, and refinance advertisers in Canada. ${ASK}`],
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

const md = ['# TheRateFinder — field discovery, round 2 (Perplexity)', '',
  `_${new Date().toISOString().slice(0, 10)} — round 1 named mostly-US or unresolvable pages; this round demands real FB/IG handles + adds the local GTA ring._`, '']
  .concat(out.flatMap(({ ring, q, answer, cites }) => [
    `## ${ring}`, '', answer, '',
    cites.length ? `**Sources:** ${cites.map((c, i) => `[${i + 1}](${c})`).join(' · ')}` : '', '', '---', '',
  ]));
fs.writeFileSync(path.join(CLIENT_DIR, 'field', 'discovery-2.md'), md.join('\n'));
console.log('\nwritten → field/discovery-2.md');
