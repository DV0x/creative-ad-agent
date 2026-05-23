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
import { researchApprentice } from './apprentices/research.js';
import { compApprentice } from './apprentices/comp.js';
import { perplexityMcpServer } from './mcp/perplexity.js';
import { scrapecreatorsMcpServer } from './mcp/scrapecreators.js';

// ── apprentice registry — add an entry per binder as binders land ──────────
const APPRENTICES: Record<string, Apprentice> = {
  strategy: strategyApprentice,
  research: researchApprentice,
  comp: compApprentice,
};

// MCP servers per apprentice — kept off the Apprentice interface so that type
// stays SDK-clean. The harness wires these into the SDK's query() options at
// run time. Strategy has none (works from canned files); research has the
// Perplexity Search wrapper for grounded retrieval; comp adds the
// ScrapeCreators Ad-Library wrapper on top of Perplexity.
const MCP_SERVERS_FOR: Record<string, Options['mcpServers']> = {
  research: { perplexity: perplexityMcpServer },
  comp: { perplexity: perplexityMcpServer, scrapecreators: scrapecreatorsMcpServer },
};

// Extra files copied into each fixture's working directory before the
// apprentice runs. Used for conditional binder references that aren't inlined
// into the system prompt — e.g. research's reference/hyperlocal.md, which the
// apprentice reads at runtime when the locale depth reaches city-or-tighter.
const EXTRA_FILES_FOR: Record<string, Array<{ src: string; dest: string }>> = {
  research: [
    { src: 'agent/.claude/skills/research/reference/hyperlocal.md',
      dest: 'reference/hyperlocal.md' },
  ],
};

// Per-apprentice SDK caps. Strategy works from canned files and finishes in
// a handful of turns; research has tool calls (Perplexity, WebFetch, Read)
// that consume both turns and budget, so it gets more headroom.
const MAX_TURNS_FOR: Record<string, number> = {
  strategy: 25,
  research: 40,
  comp: 40,
};
const MAX_BUDGET_USD_FOR: Record<string, number> = {
  strategy: 1.5,
  research: 2.5,
  comp: 2.5,
};

// Per-apprentice required env vars. The harness fails fast if anything is
// missing so the user sees a clear error before the SDK subprocess starts.
const REQUIRED_ENV_FOR: Record<string, string[]> = {
  research: ['PERPLEXITY_API_KEY'],
  comp: ['PERPLEXITY_API_KEY', 'SCRAPECREATORS_API_KEY'],
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
  durationMs: number;     // total apprentice wall-time (SDK result.duration_ms)
  durationApiMs: number;  // time in LLM API calls (SDK result.duration_api_ms)
  numTurns: number;       // tool round-trips (SDK result.num_turns)
  runError?: string;
  judge?: JudgeResult;
  judgeError?: string;
  overall: 'pass' | 'fail' | 'inconclusive';
  untraced: string[];
  untracedTotal: number;
}

// ── run one apprentice on one fixture ──────────────────────────────────────
async function runFixture(
  app: Apprentice,
  systemPrompt: string,
  fixtureDir: string,
): Promise<{ bet: string | null; costUsd: number; durationMs: number; durationApiMs: number; numTurns: number; sources: string; meta: FixtureMeta; runError?: string }> {
  const meta: FixtureMeta = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'meta.json'), 'utf8'));

  // Working dir built from the fixture. Every file/folder (except meta.json,
  // which is harness metadata) is copied across — so adding new fixture files
  // requires no harness change. Text files (.md/.txt/.json) also flow into
  // sourceParts as the judge's view of the apprentice's inputs; binary files
  // (images) are copied but only referenced by name in sourceParts since the
  // judge is text-only.
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `minieval-${app.name}-`));
  const sourceParts: string[] = [];
  const TEXT_EXTS = new Set(['.md', '.txt', '.json', '.yml', '.yaml']);

  for (const entry of fs.readdirSync(fixtureDir, { withFileTypes: true })) {
    if (entry.name === 'meta.json') continue;
    const src = path.join(fixtureDir, entry.name);
    const dest = path.join(work, entry.name);

    if (entry.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
      const inner = fs.readdirSync(src);
      const innerList = inner.length > 0
        ? inner.map(f => `  - ${f}`).join('\n')
        : '  _(empty)_';
      sourceParts.push(`### ${entry.name}/ (folder)\n\n${innerList}`);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTS.has(ext)) {
        const content = fs.readFileSync(src, 'utf8');
        fs.writeFileSync(dest, content);
        sourceParts.push(`### ${entry.name}\n\n${content}`);
      } else {
        fs.copyFileSync(src, dest);
        sourceParts.push(`### ${entry.name}\n\n_(binary file — apprentice may Read it; not shown in judge sources)_`);
      }
    }
  }

  // Apprentice-specific extra files — conditional binder references that
  // aren't inlined into the system prompt. Resolves them relative to the
  // repo root and copies into the work dir at the configured dest path,
  // creating any needed parent directories.
  for (const extra of EXTRA_FILES_FOR[app.name] ?? []) {
    const absSrc = path.join(REPO_ROOT, extra.src);
    const absDest = path.join(work, extra.dest);
    fs.mkdirSync(path.dirname(absDest), { recursive: true });
    fs.copyFileSync(absSrc, absDest);
  }

  // User prompt is deliberately apprentice-agnostic — the identity prompt
  // already tells each apprentice what files to expect in its working
  // directory; we only need to anchor today's date and point at the
  // deliverable filename.
  const userPrompt = [
    `Today's date is ${meta.date}.`,
    '',
    `Read the files in your working directory and produce ${app.deliverable}.`,
    'Produce nothing else; when the deliverable is written, you are done.',
  ].join('\n');

  const stderrChunks: string[] = [];
  const mcpServers = MCP_SERVERS_FOR[app.name];
  const options: Partial<Options> = {
    cwd: work,
    model: app.model,
    systemPrompt,
    allowedTools: app.tools,
    settingSources: [],          // isolate — do not auto-load project skills
    maxTurns: MAX_TURNS_FOR[app.name] ?? 25,
    maxBudgetUsd: MAX_BUDGET_USD_FOR[app.name] ?? 1.5,
    stderr: (data: string) => { stderrChunks.push(data); },
    ...(mcpServers ? { mcpServers } : {}),
  };

  let costUsd = 0;
  let durationMs = 0;
  let durationApiMs = 0;
  let numTurns = 0;
  let runError: string | undefined;
  try {
    for await (const message of query({ prompt: userPrompt, options })) {
      if ((message as any).type === 'result') {
        costUsd = (message as any).total_cost_usd ?? 0;
        // SDK result carries wall-time + API-time + turn count. The gap
        // between durationMs and durationApiMs is harness/tool overhead;
        // durationApiMs is the model's own thinking+generation time — the
        // real wall-time driver now that Search API probes are ~1s each.
        durationMs = (message as any).duration_ms ?? 0;
        durationApiMs = (message as any).duration_api_ms ?? 0;
        numTurns = (message as any).num_turns ?? 0;
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

  return { bet, costUsd, durationMs, durationApiMs, numTurns, sources: sourceParts.join('\n\n'), meta, runError };
}

// ── LLM judge ──────────────────────────────────────────────────────────────
async function judgeBet(
  app: Apprentice,
  rubric: string,
  deliverable: string,
  sources: string,
): Promise<JudgeResult> {
  const judgeSystem =
    'You are a strict senior performance-marketing reviewer. You grade an ' +
    'apprentice\'s deliverable against a rubric. You are hard to impress: ' +
    'polished work that lacks real judgment fails. You return only JSON.';

  const judgePrompt = [
    '# Rubric',
    rubric,
    '',
    '# The input the apprentice was given',
    sources,
    '',
    `# The apprentice's deliverable — ${app.deliverable}`,
    deliverable,
    '',
    '# Your task',
    'Grade the deliverable against EVERY criterion in the rubric (critical and',
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
  const inconclusive = results.filter(r => r.overall === 'inconclusive').length;
  const totalCost = results.reduce((s, r) => s + r.costUsd, 0);

  L.push(`# Mini-eval — \`${app.name}\` binder — ${today}`);
  L.push('');
  L.push(`**Result: ${passed}/${results.length} fixtures pass${inconclusive ? `, ${inconclusive} inconclusive (judge infra)` : ''}.**  Cost: $${totalCost.toFixed(2)}.`);
  L.push('');
  L.push('| Fixture | Brand | Shape | Overall | Cost |');
  L.push('|---|---|---|---|---|');
  for (const r of results) {
    L.push(`| ${r.fixture} | ${r.meta.brand} | ${r.meta.shape ?? '—'} | ${r.overall === 'pass' ? '**PASS**' : r.overall === 'inconclusive' ? '*inconclusive*' : 'fail'} | $${r.costUsd.toFixed(2)} |`);
  }
  L.push('');

  for (const r of results) {
    L.push('---');
    L.push('');
    L.push(`## ${r.fixture} — ${r.meta.brand}`);
    L.push('');
    L.push(`- **Overall:** ${r.overall === 'pass' ? '**PASS**' : r.overall === 'inconclusive' ? '*inconclusive*' : 'fail'}`);
    L.push(`- **Expected shape:** ${r.meta.shape ?? '—'}`);
    if (r.meta.notes) L.push(`- **Fixture notes:** ${r.meta.notes}`);
    L.push(`- **Cost:** $${r.costUsd.toFixed(2)}`);
    if (r.durationMs) {
      const mins = (ms: number) => (ms / 60000).toFixed(1);
      L.push(`- **Timing:** ${mins(r.durationMs)} min wall — ${mins(r.durationApiMs)} min in model (API), ${r.numTurns} turns. Search probes are ~1s each; the API time is the model thinking between batches + writing the deliverable.`);
    }
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

  for (const key of REQUIRED_ENV_FOR[app.name] ?? []) {
    if (!process.env[key]) {
      console.error(`✗ ${key} not set (add it to repo-root .env.local). Required for the ${app.name} apprentice.`);
      process.exit(1);
    }
  }

  const systemPrompt = app.identityPrompt + '\n\n' + loadBinder(app);
  const rubric = fs.readFileSync(path.join(HERE, 'rubrics', `${app.name}.md`), 'utf8');

  const fixturesDir = path.join(HERE, 'fixtures', app.name);
  if (!fs.existsSync(fixturesDir)) {
    console.error(`✗ no fixtures directory: ${fixturesDir}`);
    process.exit(1);
  }
  // Optional second arg: a fixture name (or comma-separated list) to filter
  // down to. Lets us re-run a single fixture cheaply when iterating on the
  // binder, the apprentice's tool surface, or — as in this case — when
  // probing what strategy actually uses from a given research.md.
  //   npx tsx run-mini-eval.ts strategy arjun-infra
  //   npx tsx run-mini-eval.ts strategy arjun-infra,dailyobjects
  const fixtureFilter = (process.argv[3] ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const allFixtures = fs.readdirSync(fixturesDir)
    .map(d => path.join(fixturesDir, d))
    .filter(p => fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'meta.json')))
    .sort();
  const fixtures = fixtureFilter.length === 0
    ? allFixtures
    : allFixtures.filter(p => fixtureFilter.includes(path.basename(p)));
  if (fixtureFilter.length > 0 && fixtures.length !== fixtureFilter.length) {
    const found = new Set(fixtures.map(p => path.basename(p)));
    const missing = fixtureFilter.filter(n => !found.has(n));
    console.error(`✗ fixture filter named ${missing.length} unknown fixture(s): ${missing.join(', ')}`);
    process.exit(1);
  }
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
        judge = await judgeBet(app, rubric, run.bet, run.sources);
      } catch (err: any) {
        judgeError = err?.message ?? String(err);
      }
    }

    // A judge *infra* failure (subprocess crash, missing JSON, etc.) is not a binder
    // failure — surface it as inconclusive so a real fail can't be silently masked.
    const overall: 'pass' | 'fail' | 'inconclusive' = judge ? computeOverall(app, judge) : 'inconclusive';
    const trace = run.bet ? traceabilityAdvisory(run.bet, run.sources) : { untraced: [], total: 0 };

    results.push({
      fixture: fixtureName,
      meta: run.meta,
      bet: run.bet,
      costUsd: run.costUsd,
      durationMs: run.durationMs,
      durationApiMs: run.durationApiMs,
      numTurns: run.numTurns,
      runError: run.runError,
      judge,
      judgeError,
      overall,
      untraced: trace.untraced,
      untracedTotal: trace.total,
    });
    // Timing breakdown: total wall, of which API (model thinking+generation)
    // is the dominant term now that Search API probes are ~1s each. `turns`
    // ≈ number of tool round-trips (each batch is a turn → a thinking gap).
    const mins = (ms: number) => (ms / 60000).toFixed(1);
    const timing = run.durationMs
      ? `, ${mins(run.durationMs)}min wall / ${mins(run.durationApiMs)}min api, ${run.numTurns} turns`
      : '';
    console.log(`${overall.toUpperCase()} ($${run.costUsd.toFixed(2)}${timing})`);
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
  // Clear stale files from a prior same-date run so the folder reflects only
  // the current fixture set — no orphaned bets from removed/renamed fixtures.
  fs.rmSync(betsDir, { recursive: true, force: true });
  fs.mkdirSync(betsDir, { recursive: true });
  for (const r of results) {
    if (r.bet) fs.writeFileSync(path.join(betsDir, `${r.fixture}.md`), r.bet, 'utf8');
  }

  const passed = results.filter(r => r.overall === 'pass').length;
  const inconclusive = results.filter(r => r.overall === 'inconclusive').length;
  const tail = inconclusive ? `, ${inconclusive} inconclusive` : '';
  console.log(`\n${passed}/${results.length} pass${tail} — report: ${path.relative(process.cwd(), outPath)}`);
  console.log(`bets:  ${path.relative(process.cwd(), betsDir)}/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
