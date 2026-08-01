/**
 * memory-store.ts — P0 of the brand-memory loop
 * (plan: docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md §2–§4).
 *
 * The STORE only: paths + brand keys, the DIARY (append-only events.jsonl,
 * code-assigned monotonic ids, deposit watermarks), the SCOREBOARD
 * (outcomes.csv), and the NOTEBOOK grammar parser shared by the validator
 * (memory-validate.ts) and the P1/P2 wiring. Pure logic exported for fixtures;
 * fs at the edges. No model calls, no pipeline wiring in this file.
 *
 * The bank-balance law (§3): the diary is NEVER injected into a seat and NEVER
 * re-read whole by deposit — notebook + events-since-watermark only. Nothing
 * that grows gets read; nothing that gets read grows.
 */
import * as fs from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths + keys (§2) ────────────────────────────────────────────────────────

export const MEMORY_ROOT = join(__dirname, 'memory');
/** Locally there is one account; in prod this becomes the Clerk user id. */
export const DEFAULT_ACCOUNT = 'local';

/** Brand key = landing host, www-stripped, lowercased, dots→dashes — the
 *  REDIRECT-CONFIRMED landing host per §2, same normalization family as
 *  capture.ts host(). Accepts a full URL or a bare host. */
export function brandKeyFor(urlOrHost: string): string {
  let h = urlOrHost.trim();
  // URL() only for real scheme:// inputs — on a bare "host:port/path" it would
  // silently read "host:" as the SCHEME and return an empty hostname.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(h)) {
    try { h = new URL(h).hostname; } catch { /* fall through to bare-host handling */ }
  }
  h = h.split('/')[0].split(':')[0];
  return h.replace(/^www\./i, '').toLowerCase().replace(/\./g, '-');
}

export const accountDir = (account: string): string => join(MEMORY_ROOT, account);
export const userNotebookPath = (account: string): string => join(accountDir(account), 'user.md');
export const brandDir = (account: string, brandKey: string): string => join(accountDir(account), 'brands', brandKey);
export const notebookPath = (dir: string): string => join(dir, 'memory.md');
export const snapshotPath = (dir: string): string => join(dir, 'memory.md.last');
export const diaryPath = (dir: string): string => join(dir, 'events.jsonl');
export const outcomesPath = (dir: string): string => join(dir, 'outcomes.csv');

// ── The diary (§3, §4) ───────────────────────────────────────────────────────

export const EVENT_TYPES = [
  'intake_answer', 'followup', 'judge_ship', 'judge_kill', 'caption_fix', 'redo',
  'rule_obeyed', 'rule_deleted', 'rule_dropped', 'outcome', 'deposit', 'founder_note',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Event types that count as the founder SPEAKING directly — the only ground
 *  for founder-stated status, and the only tombstone override (§5, §8). */
export const FOUNDER_SPEECH_TYPES: ReadonlySet<EventType> = new Set(['intake_answer', 'founder_note']);

export interface DiaryEvent {
  e: string;    // "E14" — monotonic per brand diary, CODE-assigned, never model-assigned
  run: string;  // run-dir basename
  ts: string;   // ISO timestamp
  type: EventType;
  text?: string;
  specs?: string[];        // followup: c<N> tokens named in the text (best-effort)
  spec?: string;           // judge_ship / judge_kill / caption_fix
  reason?: string;         // judge_kill: the kill's evidence line
  rule?: string;           // rule_obeyed / rule_deleted: "R3"
  creative?: string;       // outcome mirror rows
  throughEvent?: string;   // deposit watermark: last event id this deposit covered
  backfill?: boolean;      // synthesized from a pre-memory run's files (§12.3)
  [k: string]: unknown;
}

/** "E14" → 14; 0 for anything that is not an event id. Pure. */
export const eventOrdinal = (id: unknown): number => {
  const m = /^E(\d+)$/.exec(String(id ?? ''));
  return m ? parseInt(m[1], 10) : 0;
};

/** One diary line → event, or null (invalid lines are skipped, never fatal). Pure. */
export function parseEventLine(line: string): DiaryEvent | null {
  if (!line.trim()) return null;
  try {
    const v = JSON.parse(line);
    if (!v || typeof v !== 'object') return null;
    if (eventOrdinal(v.e) === 0) return null;
    if (!EVENT_TYPES.includes(v.type)) return null;
    if (typeof v.run !== 'string' || typeof v.ts !== 'string') return null;
    return v as DiaryEvent;
  } catch { return null; }
}

/** Next code-assigned id: max ordinal + 1 (gap-robust — ids are never reused). Pure. */
export const nextEventId = (events: DiaryEvent[]): string =>
  `E${events.reduce((n, ev) => Math.max(n, eventOrdinal(ev.e)), 0) + 1}`;

/** Events AFTER the last deposit watermark (deposit rows themselves excluded) —
 *  what the deposit model is shown (§5.4). No watermark → the whole diary. Pure. */
export function sinceWatermark(events: DiaryEvent[]): DiaryEvent[] {
  let mark = 0;
  for (const ev of events) {
    if (ev.type === 'deposit') mark = Math.max(mark, eventOrdinal(ev.throughEvent));
  }
  return events.filter((ev) => ev.type !== 'deposit' && eventOrdinal(ev.e) > mark);
}

/** Read a brand's diary (missing file → empty; bad lines skipped). fs edge. */
export function readEvents(dir: string): DiaryEvent[] {
  let raw = '';
  try { raw = fs.readFileSync(diaryPath(dir), 'utf8'); } catch { return []; }
  return raw.split('\n').map(parseEventLine).filter((e): e is DiaryEvent => e !== null);
}

/** Append one event: id + timestamp are CODE-assigned here (the diary is facts,
 *  and ids are the citation currency — no caller ever picks its own). fs edge. */
export function appendEvent(
  dir: string,
  ev: { run: string; type: EventType; ts?: string } & Record<string, unknown>,
): DiaryEvent {
  if (!EVENT_TYPES.includes(ev.type)) throw new TypeError(`unknown diary event type: ${String(ev.type)}`);
  fs.mkdirSync(dir, { recursive: true });
  const events = readEvents(dir);
  const full: DiaryEvent = { ...ev, e: nextEventId(events), ts: ev.ts ?? new Date().toISOString() } as DiaryEvent;
  fs.appendFileSync(diaryPath(dir), JSON.stringify(full) + '\n');
  return full;
}

// ── The scoreboard (§3) ──────────────────────────────────────────────────────

export const OUTCOMES_HEADER = 'run,creative,ran,start_date,days_live,spend,metric,value,source,note';

export interface OutcomeRow {
  run: string; creative: string; ran: string; start_date: string; days_live: string;
  spend: string; metric: string; value: string; source: string; note: string;
}

/** Minimal quote-aware CSV field split ("" escapes a quote inside quotes). Pure. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** outcomes.csv content → rows. Header must match §3 exactly (the schema is the
 *  contract); short rows are skipped, never guessed. Pure. */
export function parseOutcomes(content: string): OutcomeRow[] {
  const lines = content.split('\n').filter((l) => l.trim());
  if (!lines.length || lines[0].trim() !== OUTCOMES_HEADER) return [];
  const cols = OUTCOMES_HEADER.split(',');
  const rows: OutcomeRow[] = [];
  for (const line of lines.slice(1)) {
    const f = parseCsvLine(line);
    if (f.length < cols.length) continue;
    rows.push(Object.fromEntries(cols.map((c, i) => [c, f[i] ?? ''])) as unknown as OutcomeRow);
  }
  return rows;
}

/** Read a brand's scoreboard (missing → empty). fs edge. */
export function readOutcomes(dir: string): OutcomeRow[] {
  try { return parseOutcomes(fs.readFileSync(outcomesPath(dir), 'utf8')); } catch { return []; }
}

/** Scoreboard rows not yet mirrored into the diary (match key: run+creative). Pure. */
export function unmirroredOutcomes(rows: OutcomeRow[], events: DiaryEvent[]): OutcomeRow[] {
  const seen = new Set(
    events.filter((ev) => ev.type === 'outcome').map((ev) => `${ev.run} ${String(ev.creative ?? '')}`),
  );
  return rows.filter((r) => !seen.has(`${r.run} ${r.creative}`));
}

/** §3 mirror: the founder hand-edits outcomes.csv (manual entry v1); code
 *  mirrors NEW rows into the diary so a fresh result re-opens the deposit
 *  watermark and can promote rules via outcomes: citations. Idempotent. fs edge. */
export function mirrorOutcomes(dir: string): number {
  const fresh = unmirroredOutcomes(readOutcomes(dir), readEvents(dir));
  for (const r of fresh) {
    appendEvent(dir, {
      run: r.run, type: 'outcome', creative: r.creative,
      text: `ran=${r.ran} days=${r.days_live} spend=${r.spend} ${r.metric}=${r.value} (${r.source})${r.note ? ` — ${r.note}` : ''}`,
    });
  }
  return fresh.length;
}

// ── The notebook grammar (§3) ────────────────────────────────────────────────

export const RULE_STATUSES = ['founder-stated', 'confirmed', 'hypothesis', 'stale'] as const;
export type RuleStatus = (typeof RULE_STATUSES)[number];

/** One regex parses a rule — the §3 grammar, exactly:
 *  `- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.` */
export const RULE_RE = /^- R(\d+) \((founder-stated|confirmed|hypothesis|stale)(?:, (?:last )?r(\d+))?\) \[([^\]]+)\] — (.+)$/;

export interface NotebookRule {
  id: number;
  status: RuleStatus;
  last: number | null;   // run ordinal whose evidence last backed the rule
  cites: string[];       // "E12" | "outcomes:c5" | (user.md only) "<brand-key>:E12"
  text: string;
  line: number;          // 1-based, for precise denials
}

export interface ParsedNotebook {
  title: string | null;
  rules: NotebookRule[];
  badLines: Array<{ line: number; text: string }>;
}

/** The notebook is title + rule lines + blank lines and NOTHING else (§3) —
 *  anything unparseable lands in badLines for the validator to refuse. Pure. */
export function parseNotebook(content: string): ParsedNotebook {
  const out: ParsedNotebook = { title: null, rules: [], badLines: [] };
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    if (/^#\s/.test(raw)) {
      if (out.title === null && out.rules.length === 0) out.title = raw.replace(/^#\s+/, '').trim();
      else out.badLines.push({ line: i + 1, text: raw });
      continue;
    }
    const m = RULE_RE.exec(raw);
    if (!m) { out.badLines.push({ line: i + 1, text: raw }); continue; }
    out.rules.push({
      id: parseInt(m[1], 10),
      status: m[2] as RuleStatus,
      last: m[3] ? parseInt(m[3], 10) : null,
      cites: m[4].split(',').map((c) => c.trim()).filter(Boolean),
      text: m[5].trim(),
      line: i + 1,
    });
  }
  return out;
}

/** Tombstone matching form: lowercased, whitespace-collapsed, trailing
 *  punctuation stripped — EXACT match only (the belt; a rephrase is caught by
 *  the deposit prompt's tombstone list, not by code — §5). Pure. */
export const normRuleText = (t: string): string =>
  t.toLowerCase().replace(/\s+/g, ' ').replace(/[.!;\s]+$/, '').trim();

// ── P1: injection (§7) ───────────────────────────────────────────────────────

/** Run-dir audit copies written at injection time. learned-record.md is the
 *  SINGLE SOURCE the seats inline from (resume re-injects the same record);
 *  memory-injected.json is the structured list feeding the orchestrator's
 *  conflict block and (P2) the rule_obeyed soft events. */
export const LEARNED_RECORD_FILE = 'learned-record.md';
export const INJECTED_FILE = 'memory-injected.json';

export interface InjectedRule { id: number; status: RuleStatus; text: string; scope: 'brand' | 'user' }

/** Notebook contents → the seat-facing record + structured rule list. Stale
 *  rules are NOT injected (§6). Empty store → null (zero prompt delta — a
 *  no-memory brand runs EXACTLY as today). Pure. */
export function formatLearnedRecord(
  brandNotebook: string | null,
  userNotebook: string | null,
): { text: string; rules: InjectedRule[] } | null {
  const live = (nb: string | null): NotebookRule[] =>
    nb ? parseNotebook(nb).rules.filter((r) => r.status !== 'stale') : [];
  const brand = live(brandNotebook);
  const user = live(userNotebook);
  if (!brand.length && !user.length) return null;
  const rules: InjectedRule[] = [
    ...brand.map((r) => ({ id: r.id, status: r.status, text: r.text, scope: 'brand' as const })),
    ...user.map((r) => ({ id: r.id, status: r.status, text: r.text, scope: 'user' as const })),
  ];
  const lines: string[] = [
    "LEARNED RECORD — rules from this brand's previous runs (advisory, distilled from the diary).",
    'Fresh founder statements ALWAYS outrank this record. When a rule shapes a choice, cite its id (e.g. "per R2").',
  ];
  if (brand.length) {
    lines.push('', 'Brand rules:');
    for (const r of brand) lines.push(`- R${r.id} (${r.status}) — ${r.text}`);
  }
  if (user.length) {
    lines.push('', 'About this founder (holds across their brands):');
    for (const r of user) lines.push(`- user-R${r.id} (${r.status}) — ${r.text}`);
  }
  return { text: lines.join('\n'), rules };
}

/** The landed URL recorded in raw/redirect.txt by capture.ts checkRedirect
 *  (`landed:   <url> (host <h>)`). Pure. */
export function landedUrlFromRedirect(content: string): string | null {
  return /^landed:\s+(\S+)/m.exec(content)?.[1] ?? null;
}

/** §2: the brand key is the REDIRECT-CONFIRMED landing host when capture
 *  recorded one, else the entered URL's host. fs edge. */
export function resolveBrandKeyForRun(runDir: string, brandUrl: string): string {
  try {
    const landed = landedUrlFromRedirect(fs.readFileSync(join(runDir, 'raw', 'redirect.txt'), 'utf8'));
    if (landed) return brandKeyFor(landed);
  } catch { /* no redirect recorded */ }
  return brandKeyFor(brandUrl);
}

/** §7 injection: read the store, write the run-dir audit copies. Null when the
 *  store is empty (no files written — zero delta). Paths injected so tests run
 *  against temp dirs. fs edge. */
export function injectLearnedRecord(
  runDir: string,
  meta: { account: string; brandKey: string; dir: string; userPath: string },
): InjectedRule[] | null {
  const readOpt = (p: string): string | null => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
  const rec = formatLearnedRecord(readOpt(notebookPath(meta.dir)), readOpt(meta.userPath));
  if (!rec) return null;
  fs.writeFileSync(join(runDir, LEARNED_RECORD_FILE), rec.text + '\n');
  fs.writeFileSync(
    join(runDir, INJECTED_FILE),
    JSON.stringify({ account: meta.account, brandKey: meta.brandKey, rules: rec.rules }, null, 2) + '\n',
  );
  return rec.rules;
}

/** The c<N> spec tokens a founder message names (followup events, §4.2). Pure. */
export const specTokens = (text: string): string[] =>
  [...new Set([...text.matchAll(/\bc(\d+)\b/gi)].map((m) => `c${m[1]}`))];
