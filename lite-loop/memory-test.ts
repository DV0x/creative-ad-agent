/**
 * memory-test.ts — P0 standalone validation for the brand-memory loop
 * (plan: docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md §11 P0). NO model calls.
 *
 *   npm run test:memory
 *
 * Store: brand keys · event-id assignment (monotonic, gap-robust) · diary
 * parse/append round-trip · deposit watermark · quote-aware outcomes CSV ·
 * notebook grammar parse. Validator (every §11 P0 fixture case): valid
 * notebook · uncited rule · over-promoted status · rule_obeyed never counts ·
 * founder-stated without founder speech · tombstone resurrection + newer-
 * founder-note override · >4KB cap · stale-minted-by-model vs stale-carried ·
 * cross-brand citations (user scope) · grammar/title/duplicate-id refusals ·
 * collect-ALL denials.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';
import {
  INJECTED_FILE, LEARNED_RECORD_FILE, OUTCOMES_HEADER, appendEvent, brandKeyFor, eventOrdinal,
  formatLearnedRecord, injectLearnedRecord, landedUrlFromRedirect, nextEventId, normRuleText,
  parseCsvLine, parseEventLine, parseNotebook, parseOutcomes, readEvents, resolveBrandKeyForRun,
  sinceWatermark, specTokens, type DiaryEvent, type EventType,
} from './memory-store.ts';
import { NOTEBOOK_CHAR_CAP, notebookProblem, type NotebookContext } from './memory-validate.ts';
import { buildLiteAgents, liteOrchestratorPrompt } from './pipeline.ts';
import {
  applyStalenessAndBumps, brandRunOrdinal, buildDepositPrompt, founderEditDiff,
  hasBlockingFollowup, ruleDrops, ruleObeyedByEvidence, synthesizeBackfillEvents, verdictToEvents,
} from './memory-deposit.ts';
import { mirrorOutcomes, unmirroredOutcomes } from './memory-store.ts';
import { brandStats } from './memory-stats.ts';

let failures = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) console.log(`  ✓ ${name}`);
  else { failures++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};

const ev = (e: string, type: EventType, run: string, extra: Record<string, unknown> = {}): DiaryEvent =>
  ({ e, run, ts: '2026-07-22T00:00:00Z', type, ...extra }) as DiaryEvent;

// The shared fixture diary — event ids/types/runs chosen to exercise every
// arithmetic branch (two runs back R2; one run grounds R3; E50 is silence).
const DIARY: DiaryEvent[] = [
  ev('E2', 'intake_answer', 'r1-run', { text: 'never discount framing; premium-clinical' }),
  ev('E9', 'followup', 'r2-run', { text: 'love the billboard one' }),
  ev('E12', 'followup', 'r2-run', { text: 'drop the gym-bro tone' }),
  ev('E31', 'followup', 'r5-run', { text: 'again — no bro tone please' }),
  ev('E44', 'followup', 'r5-run', { text: 'make c3 headline shorter', specs: ['c3'] }),
  ev('E50', 'rule_obeyed', 'r5-run', { rule: 'R2' }),
];
const OUTCOMES = parseOutcomes(`${OUTCOMES_HEADER}\nrunX,c5,yes,2026-07-25,14,120.00,cpl,3.40,self_report,"founder DM"`);
const CTX: NotebookContext = { scope: 'brand', events: DIARY, outcomes: OUTCOMES };

const VALID = `# Brand memory — trunativ.co (account: local)

- R1 (founder-stated, r1) [E2] — Never discount framing; premium-clinical register.
- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.
- R3 (hypothesis, r5) [E44] — Prefers headlines under 6 words.
- R4 (confirmed, last r5) [E9, outcomes:c5] — Text-billboard formats outperform for this brand.
`;

// with one rule swapped in (same title/other rules stay valid so exactly the
// swapped rule's violation fires)
const withRule = (line: string): string => `# Brand memory — trunativ.co\n\n${line}\n`;

// ── 1) store: keys, ids, watermark ──────────────────────────────────────────
console.log('\n[1] store — brand keys, event ids, watermark');
check("brandKeyFor full URL strips www/case/path → 'trunativ-co'", brandKeyFor('https://www.Trunativ.co/products/x') === 'trunativ-co');
check("brandKeyFor bare host → 'houseoftwilight-in'", brandKeyFor('houseoftwilight.in') === 'houseoftwilight-in');
check("brandKeyFor bare host with port+path → 'snitch-com'", brandKeyFor('www.snitch.com:443/shop') === 'snitch-com');
check("eventOrdinal 'E14'→14, junk→0", eventOrdinal('E14') === 14 && eventOrdinal('nope') === 0 && eventOrdinal(undefined) === 0);
check("nextEventId on empty diary → 'E1'", nextEventId([]) === 'E1');
check("nextEventId is gap-robust (E1,E5 → E6 — ids never reused)", nextEventId([ev('E1', 'followup', 'r'), ev('E5', 'followup', 'r')]) === 'E6');

const wmDiary = [
  ev('E1', 'followup', 'r1'), ev('E2', 'followup', 'r1'), ev('E3', 'judge_ship', 'r1', { spec: 'c1' }),
  ev('E4', 'deposit', 'r1', { throughEvent: 'E3' }), ev('E5', 'followup', 'r2'),
];
const since = sinceWatermark(wmDiary);
check('sinceWatermark returns only post-watermark events', since.length === 1 && since[0].e === 'E5');
check('sinceWatermark with no deposit → whole diary minus deposit rows', sinceWatermark(wmDiary.slice(0, 3)).length === 3);
check('deposit rows themselves never reach the deposit model', !sinceWatermark(wmDiary).some((e) => e.type === 'deposit'));

check('parseEventLine accepts a valid line', parseEventLine(JSON.stringify(ev('E7', 'followup', 'r1'))) !== null);
check('parseEventLine rejects unknown type / junk / missing id', parseEventLine('{"e":"E1","run":"r","ts":"t","type":"vibes"}') === null && parseEventLine('not json') === null && parseEventLine('{"type":"followup","run":"r","ts":"t"}') === null);

// ── 2) store: diary append round-trip (fs edge, temp dir) ───────────────────
console.log('\n[2] store — appendEvent round-trip');
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'memory-p0-'));
const a1 = appendEvent(tmp, { run: 'r1', type: 'followup', text: 'hello' });
const a2 = appendEvent(tmp, { run: 'r1', type: 'intake_answer', text: 'answers' });
const readBack = readEvents(tmp);
check('ids are code-assigned and monotonic (E1, E2)', a1.e === 'E1' && a2.e === 'E2');
check('timestamps stamped, both events read back', readBack.length === 2 && readBack.every((e) => Boolean(e.ts)));
check('unknown event type throws (writer bug, not data)', (() => { try { appendEvent(tmp, { run: 'r', type: 'vibes' as EventType }); return false; } catch { return true; } })());
fs.rmSync(tmp, { recursive: true, force: true });

// ── 3) store: outcomes CSV + notebook grammar ───────────────────────────────
console.log('\n[3] store — outcomes CSV, notebook grammar');
check("parseCsvLine quote-aware ('a,\"b, c\",d')", JSON.stringify(parseCsvLine('a,"b, c",d')) === JSON.stringify(['a', 'b, c', 'd']));
check('parseCsvLine handles "" escapes', JSON.stringify(parseCsvLine('a,"He said ""hi""",c')) === JSON.stringify(['a', 'He said "hi"', 'c']));
check('parseOutcomes reads the fixture row (quoted note intact)', OUTCOMES.length === 1 && OUTCOMES[0].creative === 'c5' && OUTCOMES[0].note === 'founder DM');
check('parseOutcomes refuses a wrong header (schema is the contract)', parseOutcomes('run,creative\nx,c1').length === 0);

const nb = parseNotebook(VALID);
check('grammar: 4 rules, title, zero bad lines', nb.rules.length === 4 && nb.title !== null && nb.badLines.length === 0);
check('grammar: statuses/last/cites land', nb.rules[1].status === 'confirmed' && nb.rules[1].last === 5 && JSON.stringify(nb.rules[1].cites) === JSON.stringify(['E12', 'E31']));
check("grammar: '(founder-stated, r1)' short-form last parses", nb.rules[0].last === 1);
check('grammar: prose line → badLines', parseNotebook('# T\n\nSome prose here.\n').badLines.length === 1);
check('grammar: second title line → badLines', parseNotebook('# T\n\n# Another\n').badLines.length === 1);
check('normRuleText: case/whitespace/trailing-punct insensitive', normRuleText('No  gym-bro tone in copy.') === normRuleText('no gym-bro tone in copy'));

// ── 4) validator: the happy path ────────────────────────────────────────────
console.log('\n[4] validator — valid notebook passes');
check('the §3 example notebook is accepted', notebookProblem(VALID, CTX) === null, String(notebookProblem(VALID, CTX)));

// ── 5) validator: every violation class fires ───────────────────────────────
console.log('\n[5] validator — violations');
const p = (content: string, ctx: NotebookContext = CTX) => notebookProblem(content, ctx) ?? '';

check('uncited rule refused (E99 does not exist)', p(withRule('- R5 (hypothesis, r5) [E99] — Something invented.')).includes('E99'));
check('malformed citation refused', p(withRule('- R5 (hypothesis, r5) [see run 3] — Vague sourcing.')).includes('"see run 3"'));
check('over-promoted: confirmed on one citation refused', p(withRule('- R5 (confirmed, last r2) [E12] — One sighting is not confirmed.')).includes('confirmed needs'));
check('over-promoted: two citations from the SAME run refused', p(withRule('- R5 (confirmed, last r5) [E31, E44] — Same-run double counting.')).includes('≥2 distinct runs'));
check('rule_obeyed never counts toward confirmed', p(withRule('- R5 (confirmed, last r5) [E12, E50] — Silence promoted me.')).includes('confirmed needs'));
check('rule_obeyed alone cannot ground a hypothesis', p(withRule('- R5 (hypothesis, r5) [E50] — Born from silence.')).includes('silence'));
check('founder-stated without founder speech refused', p(withRule('- R5 (founder-stated, r2) [E12] — I decided they said this.')).includes('founder-stated'));
check('>4KB cap refused with exact overage', (() => {
  const rules = Array.from({ length: 60 }, (_, i) => `- R${i + 1} (hypothesis, r5) [E44] — Padding rule number ${i + 1} that says very little of value.`).join('\n');
  return p(`# Brand memory — trunativ.co\n\n${rules}\n`).includes(`OVER the ${NOTEBOOK_CHAR_CAP}-char cap`);
})());
check('stale minted by the model refused', p(withRule('- R5 (stale, r5) [E44] — I aged myself.')).includes('stamped by CODE'));
check('stale CARRIED from the prior notebook is legal', notebookProblem(
  withRule('- R5 (stale, r5) [E44] — Carried stale mark.'),
  { ...CTX, priorNotebook: withRule('- R5 (stale, r5) [E44] — Carried stale mark.') },
) === null);
check('duplicate rule ids refused', p('# T\n\n- R5 (hypothesis, r5) [E44] — First.\n- R5 (hypothesis, r5) [E44] — Second.\n').includes('appears twice'));
check('missing title refused', p('- R5 (hypothesis, r5) [E44] — No title above me.\n').includes('title line'));
check('collect-ALL: multiple violations in ONE denial', p('# T\n\n- R5 (confirmed, r2) [E99] — Uncited AND over-promoted.\n').includes('problems, fix ALL'));

// ── 6) validator: tombstones (§5 belt + §8 override) ────────────────────────
console.log('\n[6] validator — tombstones');
const TOMB_DIARY = [...DIARY, ev('E60', 'rule_deleted', 'r6-run', { rule: 'R2', text: 'No gym-bro tone in copy.' })];
check('deleted rule cannot resurrect (normalized text match)',
  p(withRule('- R2 (confirmed, last r5) [E12, E31] — no  gym-bro tone in copy'), { ...CTX, events: TOMB_DIARY }).includes('tombstone E60'));
check('a NEWER founder_note overrides the tombstone', notebookProblem(
  withRule('- R2 (founder-stated, r7) [E61] — No gym-bro tone in copy.'),
  { ...CTX, events: [...TOMB_DIARY, ev('E61', 'founder_note', 'r7-run', { text: 'remember: keep the no-bro-tone rule' })] },
) === null);
check('an OLDER founder statement does not override',
  p(withRule('- R1 (founder-stated, r1) [E2] — Never discount framing; premium-clinical register.'),
    { ...CTX, events: [...DIARY, ev('E60', 'rule_deleted', 'r6-run', { rule: 'R1', text: 'Never discount framing; premium-clinical register.' })] },
  ).includes('tombstone E60'));

// ── 7) validator: user scope (cross-brand citations) ────────────────────────
console.log('\n[7] validator — user.md scope');
const USER_CTX: NotebookContext = { scope: 'user', events: [], eventsByBrand: new Map([['trunativ-co', DIARY]]) };
check('cross-brand citation resolves in user scope', notebookProblem(
  '# User memory — local\n\n- R1 (founder-stated) [trunativ-co:E2] — Prefers premium-clinical register everywhere.\n', USER_CTX,
) === null);
check('plain event citation refused in user scope', p('# U\n\n- R1 (hypothesis) [E2] — Wrong form.\n', USER_CTX).includes('cross-brand'));
check('unknown brand key refused in user scope', p('# U\n\n- R1 (hypothesis) [nope-co:E2] — Ghost brand.\n', USER_CTX).includes('does not exist'));
check('cross-brand citation refused in BRAND scope', p(withRule('- R5 (hypothesis, r5) [trunativ-co:E2] — Wrong notebook.')).includes('user.md only'));
check('outcomes citation refused in user scope', p('# U\n\n- R1 (confirmed) [outcomes:c5] — Brand-only currency.\n', USER_CTX).includes('brand-notebook only'));

// ── 8) P1 — learned-record formatting ───────────────────────────────────────
console.log('\n[8] P1 — learned-record formatting');
check('empty store → null (zero prompt delta)', formatLearnedRecord(null, null) === null);
const rec = formatLearnedRecord(VALID, null)!;
check('brand notebook → 4 rules, precedence line present', rec.rules.length === 4 && rec.text.includes('R2 (confirmed)') && rec.text.includes('ALWAYS outrank'));
check('stale rules are NOT injected', formatLearnedRecord(withRule('- R5 (stale, r5) [E44] — Aged out.'), null) === null);
const userRec = formatLearnedRecord(null, '# User memory\n\n- R1 (founder-stated) [trunativ-co:E2] — Prefers premium register.\n')!;
check("user rules render as 'user-R<id>' with scope 'user'", userRec.text.includes('user-R1') && userRec.rules[0].scope === 'user');
check("specTokens extracts c<N> ('c3', 'C12'), skips 'cash'", JSON.stringify(specTokens('make c3 and C12 pop, cash stays')) === JSON.stringify(['c3', 'c12']));
const REDIRECT_FIXTURE = 'REDIRECT DETECTED — the URL the founder entered does not answer as itself.\nentered:  https://x.ca (host x.ca)\nlanded:   https://y.com/home (host y.com)\n';
check('landedUrlFromRedirect parses the capture.ts format', landedUrlFromRedirect(REDIRECT_FIXTURE) === 'https://y.com/home');

// ── 9) P1 — injection round-trip + brand-key resolution (fs, temp dirs) ─────
console.log('\n[9] P1 — injection round-trip');
const storeTmp = fs.mkdtempSync(join(os.tmpdir(), 'memory-p1-store-'));
const runTmp = fs.mkdtempSync(join(os.tmpdir(), 'memory-p1-run-'));
const bDir = join(storeTmp, 'brands', 'trunativ-co');
fs.mkdirSync(bDir, { recursive: true });
fs.writeFileSync(join(bDir, 'memory.md'), VALID);
const injected = injectLearnedRecord(runTmp, { account: 'test', brandKey: 'trunativ-co', dir: bDir, userPath: join(storeTmp, 'user.md') });
check('injection writes both run-dir audit copies', injected?.length === 4 && fs.existsSync(join(runTmp, LEARNED_RECORD_FILE)) && fs.existsSync(join(runTmp, INJECTED_FILE)));
check('memory-injected.json carries account/brandKey/rules', (() => {
  const j = JSON.parse(fs.readFileSync(join(runTmp, INJECTED_FILE), 'utf8'));
  return j.account === 'test' && j.brandKey === 'trunativ-co' && j.rules.length === 4;
})());
const runTmp2 = fs.mkdtempSync(join(os.tmpdir(), 'memory-p1-run2-'));
check('empty store → null, NO files written', injectLearnedRecord(runTmp2, { account: 'test', brandKey: 'x', dir: join(storeTmp, 'nope'), userPath: join(storeTmp, 'user.md') }) === null && !fs.existsSync(join(runTmp2, LEARNED_RECORD_FILE)));
fs.mkdirSync(join(runTmp2, 'raw'), { recursive: true });
fs.writeFileSync(join(runTmp2, 'raw', 'redirect.txt'), REDIRECT_FIXTURE);
check('brand key = redirect-confirmed landing host', resolveBrandKeyForRun(runTmp2, 'https://x.ca') === 'y-com');
check('brand key = entered host when no redirect recorded', resolveBrandKeyForRun(runTmp, 'https://www.trunativ.co') === 'trunativ-co');

// ── 10) P1 — prompt wiring (seats + orchestrator) ───────────────────────────
console.log('\n[10] P1 — prompt wiring');
const agentsOff = buildLiteAgents(runTmp2); // no learned-record.md in this dir
const agentsOn = buildLiteAgents(runTmp);   // record written by [9]
check('no record → research prompt has NO learned block', !agentsOff.research.prompt!.includes('LEARNED RECORD'));
check('record → research + create get the block', agentsOn.research.prompt!.includes('LEARNED RECORD') && agentsOn.create.prompt!.includes('No gym-bro tone'));
check('THE JUDGE STAYS COLD (field + build too)', !agentsOn.judge.prompt!.includes('LEARNED RECORD') && !agentsOn.field.prompt!.includes('LEARNED RECORD') && !agentsOn.build.prompt!.includes('LEARNED RECORD'));
check('judge prompt byte-identical with and without memory', agentsOn.judge.prompt === agentsOff.judge.prompt);
check('anti-halt law still terminal after the block', agentsOn.research.prompt!.trimEnd().endsWith('your finished deliverable.'));

const promptBare = liteOrchestratorPrompt('https://trunativ.co', runTmp2);
fs.writeFileSync(join(runTmp2, INJECTED_FILE), JSON.stringify({ account: 't', brandKey: 'x', rules: [{ id: 1, status: 'hypothesis', text: 'Guess.', scope: 'brand' }] }));
const promptHypo = liteOrchestratorPrompt('https://trunativ.co', runTmp2);
fs.writeFileSync(join(runTmp2, INJECTED_FILE), JSON.stringify({ account: 't', brandKey: 'x', rules: [{ id: 1, status: 'founder-stated', text: 'Never discount framing.', scope: 'brand' }] }));
const promptLaw = liteOrchestratorPrompt('https://trunativ.co', runTmp2);
check('no injected file → no MEMORY CONFLICTS block', !promptBare.includes('MEMORY CONFLICTS'));
check('hypothesis-only rules → orchestrator stays minimal, prompt byte-identical', promptHypo === promptBare);
check('founder-stated rules → MEMORY CONFLICTS block with the rule text', promptLaw.includes('MEMORY CONFLICTS') && promptLaw.includes('Never discount framing.') && promptLaw.includes('one-time exception'));

for (const d of [storeTmp, runTmp, runTmp2]) fs.rmSync(d, { recursive: true, force: true });

// ── 11) P2 — deposit pure helpers ───────────────────────────────────────────
console.log('\n[11] P2 — verdict→events, founder-edit diff, run ordinal');
const VERDICT = {
  specs: [
    { id: 'c1', verdict: 'SHIP', kills: [], flags: [], rank: 1 },
    { id: 'c2', verdict: 'SHIP', kills: [], flags: [], rank: 2, captionFixes: ["remove 'Ships today'"] },
    { id: 'c3', verdict: 'KILL', kills: [{ check: 'ANCHOR', evidence: 'cites A9 which says nothing of the sort' }], autopsyLine: 'unanchored number in hook', flags: [], rank: 3 },
  ],
  batch: { shipList: ['c1', 'c2'], batchOutcome: 'NORMAL', diversityAudit: 'fine' },
};
const vEvents = verdictToEvents(VERDICT);
check('verdict → 2 ships + 1 kill + 1 caption_fix', vEvents.filter((e) => e.type === 'judge_ship').length === 2 && vEvents.filter((e) => e.type === 'judge_kill').length === 1 && vEvents.filter((e) => e.type === 'caption_fix').length === 1);
check('kill carries the autopsy as reason', vEvents.find((e) => e.type === 'judge_kill')?.reason === 'unanchored number in hook');

const EDITED = `# Brand memory — trunativ.co\n\n- R1 (founder-stated, r1) [E2] — Never discount framing; premium-clinical register.\n- R2 (confirmed, last r5) [E12, E31] — Actually bro tone is fine on reels.\n- R9 (founder-stated, r5) [E2] — Hand-added law.\n`;
const dd = founderEditDiff(VALID, EDITED);
check('diff: removed rules → deleted (R3, R4)', dd.deleted.map((r) => r.id).sort().join(',') === '3,4');
check('diff: added + text-edited → added (R2, R9)', dd.added.map((r) => r.id).sort().join(',') === '2,9');
check('diff: no snapshot → every current rule is "added"', founderEditDiff(null, VALID).added.length === 4 && founderEditDiff(null, VALID).deleted.length === 0);

const ordEvents = [ev('E1', 'followup', 'run-a'), ev('E2', 'judge_ship', 'run-a'), ev('E3', 'followup', 'run-b'), ev('E4', 'followup', 'run-c')];
check('brandRunOrdinal: first-appearance order (run-b → 2)', brandRunOrdinal(ordEvents, 'run-b') === 2);
check('brandRunOrdinal: unseen run → next ordinal (4)', brandRunOrdinal(ordEvents, 'run-d') === 4);

// ── 12) P2 — staleness arithmetic (all code, §6) ────────────────────────────
console.log('\n[12] P2 — applyStalenessAndBumps');
const AGED = `# Brand memory — trunativ.co\n\n- R1 (founder-stated, r1) [E2] — Never discount framing.\n- R2 (confirmed, last r2) [E12, E31] — No gym-bro tone in copy.\n- R3 (hypothesis, last r4) [E44] — Prefers short headlines.\n- R6 (stale, last r1) [E9] — Carried stale rule.\n`;
const PRIOR_WITH_STALE = `# Brand memory — trunativ.co\n\n- R6 (stale, last r1) [E9] — Carried stale rule.\n`;
const sp = applyStalenessAndBumps(AGED, { runOrdinal: 5, obeyedIds: new Set([3]), prior: PRIOR_WITH_STALE });
const spRules = parseNotebook(sp.content).rules;
check('obeyed rule bumped to the current run (R3 last r5, not staled)', sp.bumped.includes(3) && spRules.find((r) => r.id === 3)?.last === 5 && spRules.find((r) => r.id === 3)?.status === 'hypothesis');
check('unbacked confirmed aged to stale (R2: r5−r2 ≥ 3)', sp.staled.includes(2) && spRules.find((r) => r.id === 2)?.status === 'stale');
check('founder-stated exempt from aging (R1 untouched at r5−r1=4)', spRules.find((r) => r.id === 1)?.status === 'founder-stated');
check('stale in prior AND carried stale → DROPPED (R6, second stale deposit)', sp.dropped.includes(6) && !spRules.some((r) => r.id === 6));
check('patched content still parses clean (round-trip)', parseNotebook(sp.content).badLines.length === 0);
check('carried stale WITHOUT prior stale is kept, not dropped', (() => {
  const one = applyStalenessAndBumps(AGED, { runOrdinal: 5, obeyedIds: new Set(), prior: null });
  return !one.dropped.length && parseNotebook(one.content).rules.some((r) => r.id === 6 && r.status === 'stale');
})());

// ── 13) P2 — backfill synthesis + deposit prompt ────────────────────────────
console.log('\n[13] P2 — backfill + prompt');
const bfTmp = fs.mkdtempSync(join(os.tmpdir(), 'memory-p2-'));
fs.writeFileSync(join(bfTmp, 'founder-facts.md'), `# Founder facts\nBrand URL: https://x.co\n${'answers verbatim. '.repeat(20)}`);
const bf = synthesizeBackfillEvents(bfTmp);
check('backfill: founder-facts → ONE intake_answer marked backfill', bf.length === 1 && bf[0].type === 'intake_answer' && bf[0].backfill === true);
check('backfill: no founder-facts → no synthesis', synthesizeBackfillEvents(join(bfTmp, 'nope')).length === 0);
fs.rmSync(bfTmp, { recursive: true, force: true });

const dp = buildDepositPrompt({
  account: 'local', brandKey: 'trunativ-co', runOrdinal: 3, notebook: VALID, userNotebook: null,
  tombstones: [ev('E60', 'rule_deleted', 'r6', { rule: 'R2', text: 'No gym-bro tone in copy.' })],
  newEvents: [ev('E70', 'followup', 'r7', { text: 'less clutter please' })],
  notebookFile: '/tmp/memory.md', userFile: '/tmp/user.md',
});
check('deposit prompt carries run number, tombstone, events, grammar, stale ban',
  dp.includes('brand-run number 3') && dp.includes('No gym-bro tone in copy.') && dp.includes('less clutter please') && dp.includes('- R1 (founder-stated, r1)') && dp.includes('Never write status "stale"'));

// ── 14) P3 — scoreboard mirror + stats ──────────────────────────────────────
console.log('\n[14] P3 — outcome mirror + brandStats');
const CSV2 = `${OUTCOMES_HEADER}\nrun-a,c5,yes,2026-07-25,14,120.00,cpl,3.40,self_report,"founder DM"\nrun-a,c3,no,,,,none,,self_report,never launched`;
const rows2 = parseOutcomes(CSV2);
check('unmirroredOutcomes: mirrored row excluded', unmirroredOutcomes(rows2, [ev('E1', 'outcome', 'run-a', { creative: 'c5' })]).length === 1);
const mirTmp = fs.mkdtempSync(join(os.tmpdir(), 'memory-p3-'));
fs.writeFileSync(join(mirTmp, 'outcomes.csv'), CSV2);
check('mirrorOutcomes appends one event per new row', mirrorOutcomes(mirTmp) === 2 && readEvents(mirTmp).filter((e) => e.type === 'outcome').length === 2);
check('mirrorOutcomes is idempotent (second call → 0)', mirrorOutcomes(mirTmp) === 0);
check('mirrored event carries the row facts', readEvents(mirTmp)[0].text?.includes('cpl=3.40') === true);
fs.rmSync(mirTmp, { recursive: true, force: true });

const statEvents = [
  ev('E1', 'intake_answer', 'run-a'), ev('E2', 'followup', 'run-a'), ev('E3', 'followup', 'run-a'),
  ev('E4', 'judge_ship', 'run-a', { spec: 'c1' }), ev('E5', 'judge_kill', 'run-a', { spec: 'c2' }),
  ev('E6', 'deposit', 'run-a', { throughEvent: 'E5' }),
  ev('E7', 'followup', 'run-b'), ev('E8', 'judge_ship', 'run-b', { spec: 'c1' }),
  ev('E9', 'rule_obeyed', 'run-b', { rule: 'R1' }), ev('E10', 'outcome', 'run-a', { creative: 'c1' }),
];
const st = brandStats(statEvents);
check('brandStats: two runs, first-appearance ordinals', st.length === 2 && st[0].run === 'run-a' && st[0].ordinal === 1 && st[1].ordinal === 2);
check('brandStats: edits-per-batch counted (run-a 2 → run-b 1, the §9 trend)', st[0].edits === 2 && st[1].edits === 1);
check('brandStats: ships/kills/obeyed/outcomes per run', st[0].ships === 1 && st[0].kills === 1 && st[0].outcomes === 1 && st[1].obeyed === 1);

// ── 15) S158 — the forgetting ladder (validator) + rule-drop audit ──────────
console.log('\n[15] S158 — forgetting ladder + rule_dropped audit');
const TITLE = '# Brand memory — trunativ.co';
const R1L = '- R1 (founder-stated, r1) [E2] — Never discount framing; premium-clinical register.';
const R2L = '- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.';
const R3L = '- R3 (hypothesis, r5) [E44] — Prefers headlines under 6 words.';
const R4L = '- R4 (confirmed, last r5) [E9, outcomes:c5] — Text-billboard formats outperform for this brand.';
const book = (...lines: string[]): string => `${TITLE}\n\n${lines.join('\n')}\n`;
const LCTX: NotebookContext = { ...CTX, priorNotebook: VALID };

check('dropping a founder-stated rule refused', p(book(R2L, R3L, R4L), LCTX).includes('R1 (founder-stated) is missing'));
check('dropping a confirmed rule without absorbing citations refused', p(book(R1L, R3L, R4L), LCTX).includes('only leaves by MERGING'));
check('MERGING a confirmed rule is legal (citations survive on R5)', notebookProblem(
  book(R1L, R3L, R4L, '- R5 (confirmed, last r5) [E12, E31] — Tone: premium register, gym-bro banned.'), LCTX,
) === null, String(notebookProblem(book(R1L, R3L, R4L, '- R5 (confirmed, last r5) [E12, E31] — Tone: premium register, gym-bro banned.'), LCTX)));
check('dropping a hypothesis is legal (deposit logs it)', notebookProblem(book(R1L, R2L, R4L), LCTX) === null);
check('dropping a stale rule refused (code retires stale, not the model)', p(
  book('- R7 (hypothesis, r5) [E44] — Fresh idea.'),
  { ...CTX, priorNotebook: book('- R6 (stale, r5) [E44] — Old aged rule.') },
).includes('R6 is stale and missing'));
check('a tombstoned rule is exempt from the ladder (founder deletion, not model forgetting)', notebookProblem(
  book(R1L, R3L, R4L), { ...CTX, events: TOMB_DIARY, priorNotebook: VALID },
) === null);

const dropsPlain = ruleDrops(VALID, book(R1L, R3L, R4L), { tombstones: [], codeDropped: [] });
check('ruleDrops: unabsorbed removal logged as "dropped"', dropsPlain.length === 1 && dropsPlain[0].id === 2 && dropsPlain[0].reason === 'dropped' && JSON.stringify(dropsPlain[0].cites) === JSON.stringify(['E12', 'E31']));
const dropsMerged = ruleDrops(VALID, book(R1L, R3L, R4L, '- R5 (confirmed, last r5) [E12, E31] — Merged tone rule.'), { tombstones: [], codeDropped: [] });
check('ruleDrops: citations absorbed → reason "merged"', dropsMerged.length === 1 && dropsMerged[0].reason === 'merged');
const dropsStale = ruleDrops(VALID, book(R1L, R2L, R3L), { tombstones: [], codeDropped: [4] });
check('ruleDrops: code staleness drop → reason "stale-aged-out"', dropsStale.length === 1 && dropsStale[0].id === 4 && dropsStale[0].reason === 'stale-aged-out');
check('ruleDrops: tombstoned rule excluded (rule_deleted already logged it)', ruleDrops(
  VALID, book(R1L, R3L, R4L), { tombstones: [ev('E60', 'rule_deleted', 'r6-run', { rule: 'R2', text: 'No gym-bro tone in copy.' })], codeDropped: [] },
).length === 0);
check('ruleDrops: no prior notebook → nothing to audit', ruleDrops(null, VALID, { tombstones: [], codeDropped: [] }).length === 0);

// ── 16) S158 — the obeyed-checkmark gate ────────────────────────────────────
console.log('\n[16] S158 — rule_obeyed gate');
const OB = [
  ev('E1', 'followup', 'run-x', { text: 'make c3 pop', specs: ['c3'] }),
  ev('E2', 'followup', 'run-y', { text: 'overall too loud' }),
];
check('spec-scoped followup does NOT block checkmarks', hasBlockingFollowup(OB, 'run-x') === false);
check('a global (unscoped) followup blocks', hasBlockingFollowup(OB, 'run-y') === true);
check('no followups this run → not blocked', hasBlockingFollowup(OB, 'run-z') === false);

const R3_TEXT = 'Logo: use assets/logo-site.png for all renders — logo-site.svg is on disk but render providers reject SVG.';
check('positive mechanical rule + token in specs → verified obeyed', ruleObeyedByEvidence(R3_TEXT, '{"logo":"assets/logo-site.png","format":"4:5"}') === true);
check('token absent from specs → not obeyed', ruleObeyedByEvidence(R3_TEXT, '{"logo":"assets/wordmark.jpg"}') === false);
check('negated rule NEVER earns evidence (found token means the opposite)', ruleObeyedByEvidence('Never use stock-photo.jpg backgrounds.', 'bg: stock-photo.jpg') === false);
check('rule with no file tokens → evidence path unavailable', ruleObeyedByEvidence('Register follows the field: warm-clinical, benefit-first.', 'anything at all') === false);

// ── done ─────────────────────────────────────────────────────────────────────
console.log(failures ? `\n✗ ${failures} check(s) FAILED\n` : '\n✓ all checks green\n');
process.exit(failures ? 1 : 0);
