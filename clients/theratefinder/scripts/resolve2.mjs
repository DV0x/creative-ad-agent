// Phase 1b — resolve the round-2 discovered names → Meta page candidates.
// These came from field/discovery-2.md (GTA private/alt lenders + the Woodbridge/Vaughan
// local ring + investor financing). Appends to field/resolve.json as resolve-2.json.
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
  // local ring — Woodbridge / Vaughan / GTA-north = TheRateFinder's actual backyard
  ['local', 'Pekoe Mortgages'], ['local', 'Northwood Mortgage'], ['local', '360Lending'],
  ['local', 'Miracle Financial'], ['local', 'OntarioLend'],
  // GTA private / alternative / "bank said no" lane
  ['approval-lane', 'Canadian Mortgages Inc'], ['approval-lane', 'Sunlite Mortgage'],
  ['approval-lane', 'LendSimpl'], ['approval-lane', 'Mortgage Squad'],
  ['approval-lane', 'Joe Purewal Mortgages'], ['approval-lane', 'Swivel Mortgage'],
  // rate lane retries (round 1 returned junk for these two)
  ['rate-lane', 'Pine Mortgage'], ['rate-lane', 'Homewise Mortgage'],
  ['rate-lane', 'Frank Mortgage'], ['rate-lane', 'Mortgage Architects'],
];

const out = [];
for (const [ring, name] of BRANDS) {
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(name)}`;
  try {
    const r = await fetch(url, { headers: { 'x-api-key': KEY } });
    const data = await r.json();
    const cands = (data?.searchResults ?? []).slice(0, 4).map((c) => ({
      page_id: c.page_id, name: c.name, likes: c.likes ?? 0,
      category: c.category ?? '', ig: c.ig_username ?? '',
    }));
    out.push({ ring, query: name, candidates: cands });
    console.log(`\n[${ring}] ${name}:`);
    for (const c of cands) console.log(`  ${c.page_id} | "${c.name}" | likes=${c.likes} | ${c.category} | ig=${c.ig}`);
    if (!cands.length) console.log('  (no pages found)');
  } catch (e) { console.log(`\n[${ring}] ${name}: ERROR ${e.message}`); }
}
fs.writeFileSync(path.join(CLIENT_DIR, 'field', 'resolve-2.json'), JSON.stringify(out, null, 2));
console.log('\nwritten → field/resolve-2.json');
