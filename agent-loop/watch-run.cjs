/** Live run watcher — emits ONE line per state change (milestones + failures). */
const fs = require('fs');
const path = require('path');
const RUN = process.argv[2];
const P = (p) => path.join(RUN, p);

const MILESTONES = [
  'founder-facts.md', 'field/shortlist.md', 'field/field-brief.md', 'material.md',
  'creatives.md', 'creatives.json', 'verdict.md', 'prompts.md', 'build-output.md',
  'gate-verdict.md', 'launch-kit.md', 'DONE.md',
];
const t0 = Date.now();
const min = () => ((Date.now() - t0) / 60000).toFixed(1);
// Files that get REWRITTEN (intake stub → real brief; backfill rewrites the
// verdict) are keyed by size, so a rewrite re-fires the check instead of being
// swallowed by a first-sight "seen" mark.
const REWRITTEN = new Set(['founder-facts.md', 'verdict.md', 'gate-verdict.md']);
const seen = new Set();
let specs = -1, imgs = -1, reads = -1, traceLine = 0, lastCost = 0;
const say = (s) => { console.log(`[+${min()}m] ${s}`); };

const countFiles = (dir, re) => {
  let n = 0;
  const walk = (d) => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.isDirectory()) walk(path.join(d, e.name));
      else if (re.test(e.name)) n++;
    }
  };
  walk(dir);
  return n;
};

setInterval(() => {
  // 1) deliverables
  for (const m of MILESTONES) {
    if (!fs.existsSync(P(m))) continue;
    let size = 0;
    try { size = fs.statSync(P(m)).size; } catch { continue; }
    // rewritten files re-fire when their size changes; others fire once
    const key = REWRITTEN.has(m) ? `${m}@${size}` : m;
    if (!seen.has(key)) {
      seen.add(key);
      let extra = '';
      try {
        const sz = size;
        extra = ` (${(sz / 1024).toFixed(1)}kb)`;
        if (m === 'founder-facts.md') {
          const txt = fs.readFileSync(P(m), 'utf8');
          if (/^#+\s*REGISTER|REGISTER\b/im.test(txt) && txt.length > 300) extra += ' — REGISTER section PRESENT ✓';
          else if (txt.length > 300) extra += ' — ⚠ no REGISTER section';
        }
        if (m === 'gate-verdict.md') {
          const txt = fs.readFileSync(P(m), 'utf8');
          extra += /REGISTER:/i.test(txt) ? ' — REGISTER check ✓' : ' — ⚠ no REGISTER check';
          extra += /TELLS:/i.test(txt) ? ' · TELLS check ✓' : ' · ⚠ no TELLS check';
        }
        if (m === 'verdict.md') {
          const txt = fs.readFileSync(P(m), 'utf8');
          if (/^BACKFILL:/im.test(txt)) extra += ' — ⚑ BACKFILL ORDERED (branch must fire)';
        }
      } catch {}
      say(`✓ ${m}${extra}`);
    }
  }
  // 2) spec files (fix #1)
  const s = countFiles(P('creatives'), /^c\d+\.json$/);
  if (s !== specs) { specs = s; if (s > 0) say(`specs: ${s} file(s) in creatives/`); }
  // 3) downloads (fix #2 — HK baseline was 159)
  const i = countFiles(P('raw/images'), /\.(jpg|jpeg|png)$/i);
  if (i !== imgs) { imgs = i; if (i > 0) say(`images downloaded: ${i} (HK baseline 159)`); }
  // 4) reader outputs
  const r = countFiles(P('field/reads'), /\.jsonl$/);
  if (r !== reads) { reads = r; if (r > 0) say(`reader slices written: ${r}`); }
  // 5) trace: compaction / denials / errors / cost
  let lines = [];
  try { lines = fs.readFileSync(P('trace.jsonl'), 'utf8').split('\n'); } catch { return; }
  for (let n = traceLine; n < lines.length; n++) {
    const raw = lines[n];
    if (!raw.trim()) continue;
    let msg;
    try { msg = JSON.parse(raw).msg; } catch { continue; }
    const txt = JSON.stringify(msg);
    if (msg?.type === 'user' && /ran out of context/.test(txt)) say('⚠⚠ AUTO-COMPACT — a seat overflowed its context');
    if (/DONE\.md refused|Gathering budget spent|retry ceiling|must not call MCP|banned — binary/.test(txt)) {
      const m = txt.match(/"(DONE\.md refused[^"]{0,90}|Gathering budget spent[^"]{0,60}|[^"]{0,40}retry ceiling[^"]{0,40}|[^"]{0,40}banned — binary[^"]{0,60})/);
      if (m) say(`⛔ hook: ${m[1].slice(0, 110)}`);
    }
    if (msg?.type === 'result') {
      const c = msg.total_cost_usd ?? 0;
      if (c > lastCost) { lastCost = c; }
      if (msg.subtype !== 'success') say(`⚠ result: ${msg.subtype}`);
    }
    if (/is_error":true/.test(txt) && /rate_limit|overloaded|API Error|529|429/.test(txt)) say('⚠ API error / rate limit event');
  }
  traceLine = lines.length;
  if (fs.existsSync(P('DONE.md'))) {
    say(`RUN COMPLETE — segment cost so far $${lastCost.toFixed(2)} · ${fs.readFileSync(P('DONE.md'), 'utf8').trim().slice(0, 160)}`);
    process.exit(0);
  }
}, 15000);
