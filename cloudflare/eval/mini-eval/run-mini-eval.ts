/**
 * Mini-eval harness — tests ONE apprentice binder in isolation.
 *
 * A mini-eval gives an apprentice a canned fixture, lets it produce its
 * deliverable in a single query(), and scores the deliverable. No Durable
 * Object, no sandbox, no orchestrator, no staging — a binder behaves the same
 * wherever the SDK runs, so this is a plain local Node script. Dev tooling,
 * not the product runtime.
 *
 * Run from cloudflare/ :
 *   npx tsx eval/mini-eval/run-mini-eval.ts strategy
 *
 * Reads ANTHROPIC_API_KEY from the repo-root .env.local.
 * Writes a scored report to eval/mini-eval/results/<name>-<date>.md
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { strategyApprentice, type Apprentice } from './apprentices/strategy.js';

// ── apprentice registry — add an entry per binder as binders land ──────────
const APPRENTICES: Record<string, Apprentice> = {
  strategy: strategyApprentice,
};

const HERE = __dirname;                              // cloudflare/eval/mini-eval
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
// Judge model. Opus 4.7 needs the new adaptive-thinking API; the pinned SDK
// (@anthropic-ai/claude-agent-sdk 0.2.63) still sends the old thinking shape and
// gets a 400 from Opus 4.7 — so Sonnet 4.6 is the strongest model this SDK can
// drive, and it is on-plan (the redesign costs strategy/critic on Sonnet). The
// judge only classifies per-criterion; the overall verdict is computed by the
// harness from the apprentice's passRule, not by the judge.
const JUDGE_MODEL = 'claude-sonnet-4-6';

// ── .env.local loader — no dotenv dependency ───────────────────────────────
function loadEnvLocal(): void {
  const envPath = path.join(REPO_ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

// ── binder inlining ────────────────────────────────────────────────────────
function stripFrontmatter(md: string): string {
  if (!md.startsWith('---')) return md;
  const close = md.indexOf('\n---', 3);
  if (close < 0) return md;
  const lineEnd = md.indexOf('\n', close + 1);
  return lineEnd < 0 ? '' : md.slice(lineEnd + 1).trimStart();
}

// Binder files for this run. MINIEVAL_NO_EXAMPLES drops the worked-examples
// file — used to ablate worked-example leakage.
function binderPathsFor(app: Apprentice): string[] {
  if (process.env.MINIEVAL_NO_EXAMPLES) {
    return app.binderPaths.filter(p => !/worked-examples/i.test(p));
  }
  return app.binderPaths;
}

function loadBinder(app: Apprentice): string {
  return binderPathsFor(app)
    .map(rel => stripFrontmatter(fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8')))
    .join('\n\n');
}

// ── number-traceability — helpers copied verbatim from scripts/floor-graders.ts
// (floor-graders.ts runs main() on import, so it cannot be imported directly.)
function extractInterestingNumbers(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(/\b(\d{1,3}(?:,\d{3})+(?:\+)?|\d{3,}(?:\+)?)\b/g)) {
    const raw = m[1].replace(/,/g, '').replace(/\+$/, '');
    const n = parseInt(raw, 10);
    if (n >= 2020 && n <= 2030) continue; // year, skip
    out.add(m[1]);
  }
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)) out.add(`${m[1]}%`);
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?[kmb])\b/gi)) out.add(m[1].toLowerCase());
  for (const m of text.matchAll(/[$₹€£]\s*(\d+(?:[,.]?\d+)*)/g)) out.add(`${m[0]}`);
  return [...out];
}
function normalizeNumber(s: string): string {
  return s.toLowerCase().replace(/[,$₹€£\s+]/g, '');
}

/** Advisory only — surfaces numbers in The Bet absent from the sources. The
 *  LLM judge is the actual fabrication grader (`no-fabrication`); this is a
 *  cheap regex flag for a human to eyeball, not a pass/fail gate. */
function traceabilityAdvisory(bet: string, sources: string): { untraced: string[]; total: number } {
  const betNums = [...new Set(extractInterestingNumbers(bet))];
  const srcNums = new Set(extractInterestingNumbers(sources).map(normalizeNumber));
  const untraced = betNums.filter(n => !srcNums.has(normalizeNumber(n)));
  return { untraced, total: betNums.length };
}

// ── types ──────────────────────────────────────────────────────────────────
interface FixtureMeta { brand: string; date: string; shape?: string; notes?: string }
interface CriterionVerdict { id: string; verdict: 'pass' | 'fail'; reason: string }
interface JudgeResult { criteria: CriterionVerdict[]; summary: string }
interface FixtureResult {
  fixture: string;
  meta: FixtureMeta;
  bet: string | null;
  costUsd: number;
  runError?: string;
  judge?: JudgeResult;
  judgeError?: string;
  overall: 'pass' | 'fail';
  untraced: string[];
  untracedTotal: number;
}

// ── run one apprentice on one fixture ──────────────────────────────────────
async function runFixture(
  app: Apprentice,
  systemPrompt: string,
  fixtureDir: string,
): Promise<{ bet: string | null; costUsd: number; sources: string; meta: FixtureMeta; runError?: string }> {
  const meta: FixtureMeta = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'meta.json'), 'utf8'));

  // Working dir with the fixture's three input files copied in.
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `minieval-${app.name}-`));
  const inputs = ['research.md', 'competitors.md', 'founder-facts.md'];
  const sourceParts: string[] = [];
  for (const f of inputs) {
    const src = path.join(fixtureDir, f);
    if (!fs.existsSync(src)) continue;
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(path.join(work, f), content);
    sourceParts.push(`### ${f}\n\n${content}`);
  }

  const userPrompt = [
    'Produce The Bet for this brand.',
    '',
    'Your working directory contains research.md, competitors.md and founder-facts.md.',
    'Read all three before you reason. Today\'s date is ' + meta.date + '.',
    '',
    `Write your deliverable to ${app.deliverable} in this working directory. Nothing else.`,
  ].join('\n');

  const stderrChunks: string[] = [];
  const options: Partial<Options> = {
    cwd: work,
    model: app.model,
    systemPrompt,
    allowedTools: app.tools,
    settingSources: [],          // isolate — do not auto-load project skills
    maxTurns: 25,
    maxBudgetUsd: 1.5,
    stderr: (data: string) => { stderrChunks.push(data); },
  };

  let costUsd = 0;
  let runError: string | undefined;
  try {
    for await (const message of query({ prompt: userPrompt, options })) {
      if ((message as any).type === 'result') {
        costUsd = (message as any).total_cost_usd ?? 0;
        if ((message as any).subtype && (message as any).subtype !== 'success') {
          runError = `result subtype: ${(message as any).subtype}`;
        }
      }
    }
  } catch (err: any) {
    runError = err?.message ?? String(err);
  }
  if (runError && stderrChunks.length) {
    runError += `\n--- subprocess stderr (tail) ---\n` + stderrChunks.join('').slice(-2000);
  }

  const betPath = path.join(work, app.deliverable);
  const bet = fs.existsSync(betPath) ? fs.readFileSync(betPath, 'utf8') : null;
  fs.rmSync(work, { recursive: true, force: true });

  return { bet, costUsd, sources: sourceParts.join('\n\n'), meta, runError };
}

// ── LLM judge ──────────────────────────────────────────────────────────────
async function judgeBet(rubric: string, bet: string, sources: string): Promise<JudgeResult> {
  const judgeSystem =
    'You are a strict senior performance-marketing reviewer. You grade a ' +
    'strategist\'s deliverable ("The Bet") against a rubric. You are hard to ' +
    'impress: polished work that lacks real judgment fails. You return only JSON.';

  const judgePrompt = [
    '# Rubric',
    rubric,
    '',
    '# The research the strategist was given',
    sources,
    '',
    '# The strategist\'s deliverable — The Bet',
    bet,
    '',
    '# Your task',
    'Grade The Bet against EVERY criterion in the rubric (critical and',
    'supporting). For each, decide pass or fail and give a one- to two-sentence',
    'reason citing the specific evidence. Do not compute an overall verdict —',
    'that is done elsewhere from your per-criterion verdicts.',
    '',
    'Respond with ONLY a JSON object, no prose and no markdown fence:',
    '{"criteria":[{"id":"<criterion-id>","verdict":"pass"|"fail","reason":"..."}],"summary":"<2-3 sentence overall read>"}',
  ].join('\n');

  let text = '';
  const judgeStderr: string[] = [];
  try {
    for await (const message of query({
      prompt: judgePrompt,
      options: {
        model: JUDGE_MODEL,
        systemPrompt: judgeSystem,
        allowedTools: [],
        settingSources: [],
        maxTurns: 1,
        stderr: (d: string) => { judgeStderr.push(d); },
      },
    })) {
      if ((message as any).type === 'assistant') {
        for (const block of (message as any).message?.content ?? []) {
          if (block.type === 'text') text += block.text;
        }
      }
    }
  } catch (err: any) {
    const tail = judgeStderr.length ? `\n--- judge subprocess stderr (tail) ---\n${judgeStderr.join('').slice(-2000)}` : '';
    throw new Error(`${err?.message ?? String(err)}${tail}`);
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error(`judge returned no JSON object:\n${text.slice(0, 300)}`);
  return JSON.parse(text.slice(start, end + 1)) as JudgeResult;
}

// ── overall verdict — deterministic, from the apprentice's pass rule ───────
function computeOverall(app: Apprentice, judge: JudgeResult): 'pass' | 'fail' {
  const fails = judge.criteria.filter(c => c.verdict === 'fail').map(c => c.id);
  if (fails.some(id => app.passRule.critical.includes(id))) return 'fail';
  const supportingFails = fails.filter(id => !app.passRule.critical.includes(id));
  return supportingFails.length > app.passRule.maxSupportingFails ? 'fail' : 'pass';
}

// ── report ─────────────────────────────────────────────────────────────────
function renderReport(app: Apprentice, results: FixtureResult[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const L: string[] = [];
  const passed = results.filter(r => r.overall === 'pass').length;
  const totalCost = results.reduce((s, r) => s + r.costUsd, 0);

  L.push(`# Mini-eval — \`${app.name}\` binder — ${today}`);
  L.push('');
  L.push(`**Result: ${passed}/${results.length} fixtures pass.**  Cost: $${totalCost.toFixed(2)}.`);
  L.push('');
  L.push('| Fixture | Brand | Shape | Overall | Cost |');
  L.push('|---|---|---|---|---|');
  for (const r of results) {
    L.push(`| ${r.fixture} | ${r.meta.brand} | ${r.meta.shape ?? '—'} | ${r.overall === 'pass' ? '**PASS**' : 'fail'} | $${r.costUsd.toFixed(2)} |`);
  }
  L.push('');

  for (const r of results) {
    L.push('---');
    L.push('');
    L.push(`## ${r.fixture} — ${r.meta.brand}`);
    L.push('');
    L.push(`- **Overall:** ${r.overall === 'pass' ? '**PASS**' : 'fail'}`);
    L.push(`- **Expected shape:** ${r.meta.shape ?? '—'}`);
    if (r.meta.notes) L.push(`- **Fixture notes:** ${r.meta.notes}`);
    L.push(`- **Cost:** $${r.costUsd.toFixed(2)}`);
    if (r.runError) L.push(`- **⚠ run error:** ${r.runError}`);
    if (r.judgeError) L.push(`- **⚠ judge error:** ${r.judgeError}`);
    L.push('');

    if (r.judge) {
      L.push('### Judge verdicts');
      L.push('');
      L.push('| Criterion | Verdict | Reason |');
      L.push('|---|---|---|');
      for (const c of r.judge.criteria) {
        const crit = app.passRule.critical.includes(c.id) ? ' _(critical)_' : '';
        const reason = c.reason.replace(/\|/g, '\\|').replace(/\n/g, ' ');
        L.push(`| \`${c.id}\`${crit} | ${c.verdict === 'pass' ? '✓' : '✗'} | ${reason} |`);
      }
      L.push('');
      L.push(`**Judge summary:** ${r.judge.summary}`);
      L.push('');
    }

    L.push('### Number-traceability (advisory)');
    if (r.untracedTotal === 0) {
      L.push('No numbers in The Bet.');
    } else if (r.untraced.length === 0) {
      L.push(`All ${r.untracedTotal} numbers in The Bet trace to the research.`);
    } else {
      L.push(`${r.untraced.length}/${r.untracedTotal} numbers not found verbatim in the research — eyeball these (some may be binder knowledge, e.g. Meta's ~50-events/week, not fabrication): ${r.untraced.map(n => `\`${n}\``).join(', ')}`);
    }
    L.push('');

    L.push('### The Bet (produced)');
    L.push('');
    if (r.bet) {
      L.push('```markdown');
      L.push(r.bet);
      L.push('```');
    } else {
      L.push('_(no deliverable produced)_');
    }
    L.push('');
  }

  return L.join('\n');
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnvLocal();
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set (add it to repo-root .env.local).');
    process.exit(1);
  }

  // The SDK spawns a headless `cli.js` subprocess; its bundled nested-session
  // guard refuses to start when CLAUDECODE is set (i.e. when this harness is
  // itself run from inside a Claude Code session). The subprocess is a
  // non-interactive, short-lived agent — the standard Agent-SDK pattern — so
  // clear the marker. A no-op when run from a normal terminal.
  delete process.env.CLAUDECODE;

  const name = process.argv[2];
  const app = APPRENTICES[name];
  if (!app) {
    console.error(`✗ unknown apprentice "${name ?? ''}". known: ${Object.keys(APPRENTICES).join(', ')}`);
    process.exit(1);
  }

  const systemPrompt = app.identityPrompt + '\n\n' + loadBinder(app);
  const rubric = fs.readFileSync(path.join(HERE, 'rubrics', `${app.name}.md`), 'utf8');

  const fixturesDir = path.join(HERE, 'fixtures', app.name);
  if (!fs.existsSync(fixturesDir)) {
    console.error(`✗ no fixtures directory: ${fixturesDir}`);
    process.exit(1);
  }
  const fixtures = fs.readdirSync(fixturesDir)
    .map(d => path.join(fixturesDir, d))
    .filter(p => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'meta.json')))
    .sort();
  if (fixtures.length === 0) {
    console.error(`✗ no fixtures (each needs a meta.json) under ${fixturesDir}`);
    process.exit(1);
  }

  console.log(`mini-eval: ${app.name} — ${fixtures.length} fixture(s), apprentice=${app.model}, judge=${JUDGE_MODEL}`);
  console.log(`binder: ${binderPathsFor(app).map(p => path.basename(p)).join(' + ')}` +
    `${process.env.MINIEVAL_NO_EXAMPLES ? '  (ablation: worked examples EXCLUDED)' : ''}\n`);

  const results: FixtureResult[] = [];
  for (const fixtureDir of fixtures) {
    const fixtureName = path.basename(fixtureDir);
    process.stdout.write(`  ${fixtureName} … running apprentice … `);
    const run = await runFixture(app, systemPrompt, fixtureDir);

    let judge: JudgeResult | undefined;
    let judgeError: string | undefined;
    if (run.bet) {
      process.stdout.write('judging … ');
      try {
        judge = await judgeBet(rubric, run.bet, run.sources);
      } catch (err: any) {
        judgeError = err?.message ?? String(err);
      }
    }

    const overall = judge ? computeOverall(app, judge) : 'fail';
    const trace = run.bet ? traceabilityAdvisory(run.bet, run.sources) : { untraced: [], total: 0 };

    results.push({
      fixture: fixtureName,
      meta: run.meta,
      bet: run.bet,
      costUsd: run.costUsd,
      runError: run.runError,
      judge,
      judgeError,
      overall,
      untraced: trace.untraced,
      untracedTotal: trace.total,
    });
    console.log(`${overall.toUpperCase()} ($${run.costUsd.toFixed(2)})`);
  }

  const report = renderReport(app, results);
  const today = new Date().toISOString().slice(0, 10);
  const resultsDir = path.join(HERE, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const suffix = process.env.MINIEVAL_NO_EXAMPLES ? '-no-examples' : '';
  const outPath = path.join(resultsDir, `${app.name}-${today}${suffix}.md`);
  fs.writeFileSync(outPath, report, 'utf8');

  // Save each produced Bet as its own file, for easy review.
  const betsDir = path.join(resultsDir, `${app.name}-${today}${suffix}-bets`);
  fs.mkdirSync(betsDir, { recursive: true });
  for (const r of results) {
    if (r.bet) fs.writeFileSync(path.join(betsDir, `${r.fixture}.md`), r.bet, 'utf8');
  }

  const passed = results.filter(r => r.overall === 'pass').length;
  console.log(`\n${passed}/${results.length} pass — report: ${path.relative(process.cwd(), outPath)}`);
  console.log(`bets:  ${path.relative(process.cwd(), betsDir)}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
