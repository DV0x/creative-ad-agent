// Phase 1 — resolve brand names → Meta Ad Library page candidates.
// Prints candidates; a human (or the calling agent) picks the right page_id per brand
// (likes + category + ig) before any ads are fetched. 1 credit per name.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

// minimal .env.local parser (no deps)
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

// The set: Verbis itself · direct PTE prep · IELTS/study-abroad (same buyer) ·
// adjacent Indian ed-tech that runs workshop/offer constructions on the same feed.
const BRANDS = [
  'Verbis Edu',
  'E2 Test Prep',            // global PTE prep leader
  'Alfa PTE',                // Indian PTE practice platform
  'PTE Tutorials',           // Aussizz Group
  'Leap Scholar',            // study-abroad, heavy Meta advertiser
  'IDP IELTS',               // test owner, heavy advertiser, same buyer
  'Yocket',                  // study-abroad platform
  'Scaler',                  // adjacent: masterclass/workshop ad constructions
  'upGrad',                  // adjacent: ed-tech offer constructions
  'Gradding',                // study-abroad PTE/IELTS
];

const out = [];
for (const name of BRANDS) {
  const url = `https://api.scrapecreators.com/v1/facebook/adLibrary/search/companies?query=${encodeURIComponent(name)}`;
  try {
    const r = await fetch(url, { headers: { 'x-api-key': KEY } });
    const data = await r.json();
    const cands = (data?.searchResults ?? []).slice(0, 5).map((c) => ({
      page_id: c.page_id, name: c.name, likes: c.likes ?? 0,
      category: c.category ?? '', ig: c.ig_username ?? '', verified: c.verification ?? '',
    }));
    out.push({ query: name, candidates: cands });
    console.log(`\n${name}:`);
    for (const c of cands) console.log(`  ${c.page_id} | "${c.name}" | likes=${c.likes} | ${c.category} | ig=${c.ig} | ${c.verified}`);
    if (!cands.length) console.log('  (no pages found)');
  } catch (e) { console.log(`\n${name}: ERROR ${e.message}`); }
}
fs.writeFileSync(path.join(__dirname, 'field', 'resolve.json'), JSON.stringify(out, null, 2));
console.log('\nwritten → field/resolve.json');
