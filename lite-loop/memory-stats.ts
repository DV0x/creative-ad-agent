/**
 * memory-stats.ts — P3 of the brand-memory loop
 * (plan: docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md §9).
 *
 * THE measurement: edits-per-batch per brand, trending down. One table per
 * brand from the diary — no dashboard. Injected-rule counts come from each
 * run dir's memory-injected.json when the run is still on disk.
 *
 *   npm run stats             all brands (account "local")
 *   npm run stats -- <brand>  one brand key, e.g. trunativ-co
 */
import * as fs from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DEFAULT_ACCOUNT, accountDir, brandDir, notebookPath, parseNotebook, readEvents, readOutcomes,
  type DiaryEvent,
} from './memory-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = join(__dirname, 'runs');

export interface RunStats {
  run: string;
  ordinal: number;
  edits: number;    // followup count — THE number (§9)
  ships: number;
  kills: number;
  outcomes: number;
  obeyed: number;
}

/** Per-run aggregates in first-appearance order (same ordinal currency as the
 *  deposit's brandRunOrdinal). Pure. */
export function brandStats(events: DiaryEvent[]): RunStats[] {
  const byRun = new Map<string, RunStats>();
  for (const ev of events) {
    let s = byRun.get(ev.run);
    if (!s) {
      s = { run: ev.run, ordinal: byRun.size + 1, edits: 0, ships: 0, kills: 0, outcomes: 0, obeyed: 0 };
      byRun.set(ev.run, s);
    }
    if (ev.type === 'followup') s.edits++;
    else if (ev.type === 'judge_ship') s.ships++;
    else if (ev.type === 'judge_kill') s.kills++;
    else if (ev.type === 'outcome') s.outcomes++;
    else if (ev.type === 'rule_obeyed') s.obeyed++;
  }
  return [...byRun.values()];
}

const injectedCount = (runId: string): string => {
  try {
    const j = JSON.parse(fs.readFileSync(join(RUNS_DIR, runId, 'memory-injected.json'), 'utf8'));
    return String(Array.isArray(j?.rules) ? j.rules.length : 0);
  } catch { return '—'; }
};

function printBrand(account: string, brandKey: string): void {
  const dir = brandDir(account, brandKey);
  const events = readEvents(dir);
  if (!events.length) { console.log(`\n${brandKey}: empty diary`); return; }
  const stats = brandStats(events);
  const nbRaw = (() => { try { return fs.readFileSync(notebookPath(dir), 'utf8'); } catch { return null; } })();
  const rules = nbRaw ? parseNotebook(nbRaw).rules : [];
  const by = (s: string) => rules.filter((r) => r.status === s).length;

  console.log(`\n═══ ${brandKey}`);
  const head = ['r#', 'edits', 'ships', 'kills', 'injected', 'obeyed', 'outcomes', 'run'];
  const rows = stats.map((s) => [
    `r${s.ordinal}`, String(s.edits), String(s.ships), String(s.kills),
    injectedCount(s.run), String(s.obeyed), String(s.outcomes), s.run,
  ]);
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  for (const line of [head, ...rows]) {
    console.log('  ' + line.map((c, i) => c.padEnd(widths[i] + 2)).join(''));
  }
  console.log(
    `  notebook: ${rules.length} rule(s) (${by('founder-stated')} founder-stated, ${by('confirmed')} confirmed, ` +
    `${by('hypothesis')} hypothesis, ${by('stale')} stale) · diary: ${events.length} event(s) · ` +
    `scoreboard: ${readOutcomes(dir).length} row(s)`,
  );
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const account = DEFAULT_ACCOUNT;
  const wanted = process.argv[2];
  let brands: string[] = [];
  try { brands = fs.readdirSync(join(accountDir(account), 'brands')).sort(); } catch { /* empty store */ }
  if (wanted) brands = brands.filter((b) => b === wanted);
  if (!brands.length) {
    console.log(wanted ? `no memory for brand "${wanted}"` : 'the memory store is empty — run a campaign (or the deposit CLI) first');
    process.exit(0);
  }
  for (const b of brands) printBrand(account, b);
  console.log('');
}
