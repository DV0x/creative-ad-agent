// Phase 1 — resolve brand names → Meta Ad Library page candidates. 1 credit per name.
// Prints candidates; we pick the right page_id per brand (likes + category + ig) BEFORE
// fetching any ads. Ambiguous names are reported, never guessed.
// Brands come from field/discovery.md — three rings + the client itself.
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
const KEY = process.env.SCRAPECREATORS_API_KEY;
if (!KEY) { console.error('missing SCRAPECREATORS_API_KEY'); process.exit(1); }

const BRANDS = [
  // ring 0 — the client (is TheRateFinder already running ads?)
  ['client', 'TheRateFinder'],
  // ring A — rate aggregators / digital lenders (the RATE lane — the crowded one)
  ['rate-lane', 'Ratehub.ca'], ['rate-lane', 'nesto'], ['rate-lane', 'Pine'],
  ['rate-lane', 'Homewise'], ['rate-lane', 'True North Mortgage'], ['rate-lane', 'Butler Mortgage'],
  ['rate-lane', 'Dominion Lending Centres'], ['rate-lane', 'Mortgage Alliance'],
  // ring B — the specialist / hard-to-approve tier (TheRateFinder's REAL lane)
  ['approval-lane', 'GreenHouse Mortgage'], ['approval-lane', 'Zuzart Mortgages'],
  ['approval-lane', 'ApprovedByDustin'], ['approval-lane', 'The Private Mortgages'],
  ['approval-lane', 'Clearkey'], ['approval-lane', 'LendCity'], ['approval-lane', 'Pegasus Lending'],
  // ring B2 — alt / B lenders (who the brokers place these deals with)
  ['alt-lender', 'Home Trust'], ['alt-lender', 'Equitable Bank'], ['alt-lender', 'Haventree Bank'],
];

const out = [];
for (const [ring, name] of BRANDS) {
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(name)}`;
  try {
    const r = await fetch(url, { headers: { 'x-api-key': KEY } });
    const data = await r.json();
    const cands = (data?.searchResults ?? []).slice(0, 5).map((c) => ({
      page_id: c.page_id, name: c.name, likes: c.likes ?? 0,
      category: c.category ?? '', ig: c.ig_username ?? '', verified: c.verification ?? '',
    }));
    out.push({ ring, query: name, candidates: cands });
    console.log(`\n[${ring}] ${name}:`);
    for (const c of cands) console.log(`  ${c.page_id} | "${c.name}" | likes=${c.likes} | ${c.category} | ig=${c.ig} | ${c.verified}`);
    if (!cands.length) console.log('  (no pages found)');
  } catch (e) { console.log(`\n[${ring}] ${name}: ERROR ${e.message}`); }
}
fs.mkdirSync(path.join(CLIENT_DIR, 'field'), { recursive: true });
fs.writeFileSync(path.join(CLIENT_DIR, 'field', 'resolve.json'), JSON.stringify(out, null, 2));
console.log('\nwritten → field/resolve.json');
