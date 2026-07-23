/**
 * memory-deposit.ts — P2 of the brand-memory loop
 * (plan: docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md §5–§6).
 *
 * The DISTILLER: after a run, code copies the run's facts into the diary
 * (verdict events, founder-edit tombstones, rule_obeyed soft events, backfill
 * synthesis for pre-memory runs), then ONE Sonnet pass rewrites the brand
 * notebook — fenced by notebookProblem() as a PreToolUse deny-hook — and code
 * finishes with the staleness arithmetic the model is forbidden to do.
 *
 * Code before model, code after model; the model only ever holds the pen in
 * the middle, and the pen is validator-fenced (F33: uncited memory is
 * fabricated memory).
 *
 * Triggers: web.ts onEnd (DONE.md present) · CLI:
 *   npx tsx memory-deposit.ts <runDir> [--force]
 * Idempotent: a diary with nothing new since the last watermark is skipped.
 */
import * as fs from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { loadEnv, readSessionInfo } from '../agent-loop/chat/setup.ts';
import {
  DEFAULT_ACCOUNT, INJECTED_FILE, accountDir, appendEvent, brandDir, diaryPath, eventOrdinal,
  mirrorOutcomes, nextEventId, normRuleText, notebookPath, parseNotebook, readEvents,
  readOutcomes, resolveBrandKeyForRun, sinceWatermark, snapshotPath, userNotebookPath,
  type DiaryEvent, type NotebookRule, type RuleStatus,
} from './memory-store.ts';
import { notebookProblem } from './memory-validate.ts';

export const DEPOSIT_MODEL = 'claude-sonnet-4-6';
/** §6: hypothesis/confirmed rules unbacked for this many brand-runs go stale. */
export const STALE_AFTER_RUNS = 3;
const INTAKE_BACKFILL_CAP = 4000;

// ── Pure helpers (exported for memory-test.ts) ───────────────────────────────

/** verdict.json → judge_ship / judge_kill / caption_fix event bodies (§4.3). */
export function verdictToEvents(verdict: any): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const s of Array.isArray(verdict?.specs) ? verdict.specs : []) {
    if (typeof s?.id !== 'string' || !s.id) continue;
    if (s.verdict === 'SHIP') out.push({ type: 'judge_ship', spec: s.id });
    else if (s.verdict === 'KILL') {
      out.push({ type: 'judge_kill', spec: s.id, reason: String(s.autopsyLine ?? s.kills?.[0]?.evidence ?? 'killed') });
    }
    if (Array.isArray(s.captionFixes) && s.captionFixes.length) {
      out.push({ type: 'caption_fix', spec: s.id, text: s.captionFixes.join(' | ') });
    }
  }
  return out;
}

/** §5.2 founder-edit diff: snapshot vs on-disk notebook BEFORE this deposit.
 *  Removed rules → tombstones; added or text-edited rules → founder speech
 *  (the founder holding the pen IS the founder saying it). */
export function founderEditDiff(
  prior: string | null,
  current: string | null,
): { deleted: NotebookRule[]; added: NotebookRule[] } {
  const p = prior ? parseNotebook(prior).rules : [];
  const c = current ? parseNotebook(current).rules : [];
  const pById = new Map(p.map((r) => [r.id, r]));
  const cIds = new Set(c.map((r) => r.id));
  return {
    deleted: p.filter((r) => !cIds.has(r.id)),
    added: c.filter((r) => {
      const was = pById.get(r.id);
      return !was || normRuleText(was.text) !== normRuleText(r.text);
    }),
  };
}

/** Brand-run ordinal: distinct run ids in diary first-appearance order,
 *  1-based; an unseen runId is the next one. The "rN" currency of §6. */
export function brandRunOrdinal(events: DiaryEvent[], runId: string): number {
  const seen: string[] = [];
  for (const ev of events) if (!seen.includes(ev.run)) seen.push(ev.run);
  const i = seen.indexOf(runId);
  return i === -1 ? seen.length + 1 : i + 1;
}

const serializeRule = (r: NotebookRule): string => {
  const runPart = r.last === null ? '' : r.status === 'founder-stated' ? `, r${r.last}` : `, last r${r.last}`;
  return `- R${r.id} (${r.status}${runPart}) [${r.cites.join(', ')}] — ${r.text}`;
};

export interface StalePatch { content: string; bumped: number[]; staled: number[]; dropped: number[] }

/** §6 post-model arithmetic, all code: bump `last` for obeyed rules → age
 *  unbacked hypothesis/confirmed to stale → DROP rules stale in BOTH the prior
 *  snapshot and this write (second consecutive stale deposit). Laws
 *  (founder-stated) are exempt from all three. Pure. */
export function applyStalenessAndBumps(
  content: string,
  opts: { runOrdinal: number; obeyedIds: Set<number>; prior: string | null; staleAfter?: number },
): StalePatch {
  const staleAfter = opts.staleAfter ?? STALE_AFTER_RUNS;
  const nb = parseNotebook(content);
  const priorStale = new Set(
    (opts.prior ? parseNotebook(opts.prior).rules : []).filter((r) => r.status === 'stale').map((r) => r.id),
  );
  const patch: StalePatch = { content: '', bumped: [], staled: [], dropped: [] };
  const kept: NotebookRule[] = [];
  for (const r of nb.rules) {
    const rule = { ...r };
    if (rule.status === 'stale' && priorStale.has(rule.id)) { patch.dropped.push(rule.id); continue; }
    if (rule.status !== 'founder-stated' && opts.obeyedIds.has(rule.id)) {
      rule.last = opts.runOrdinal;
      patch.bumped.push(rule.id);
    }
    if (
      (rule.status === 'hypothesis' || rule.status === 'confirmed') &&
      rule.last !== null && opts.runOrdinal - rule.last >= staleAfter
    ) {
      rule.status = 'stale' as RuleStatus;
      patch.staled.push(rule.id);
    }
    kept.push(rule);
  }
  patch.content = [`# ${nb.title ?? 'Brand memory'}`, '', ...kept.map(serializeRule), ''].join('\n');
  return patch;
}

/** §12.3 backfill: a pre-memory run has an empty diary — synthesize the intake
 *  record from founder-facts.md (a real file on disk, per the F33 rule; marked
 *  backfill). Verdict events come from the normal copy step. */
export function synthesizeBackfillEvents(runDir: string): Array<Record<string, unknown>> {
  try {
    const ff = fs.readFileSync(join(runDir, 'founder-facts.md'), 'utf8');
    if (ff.trim().length < 100) return [];
    return [{ type: 'intake_answer', text: ff.slice(0, INTAKE_BACKFILL_CAP), backfill: true }];
  } catch { return []; }
}

export function buildDepositPrompt(args: {
  account: string; brandKey: string; runOrdinal: number;
  notebook: string | null; userNotebook: string | null;
  tombstones: DiaryEvent[]; newEvents: DiaryEvent[];
  notebookFile: string; userFile: string;
}): string {
  return `You are the MEMORY DEPOSIT step of an ad-creative pipeline — the only seat that writes
long-lived beliefs. A run just finished for brand "${args.brandKey}" (account "${args.account}").
Distill the NEW diary events below into the brand notebook. This is brand-run number ${args.runOrdinal}.

THE LAWS:
- A rule is a CONSTRAINT that would change a future run — never a research fact, never an event log.
- Quote-level specificity ("no emoji in headlines"), never vibes ("likes clean copy").
- Every rule cites the diary event(s) it stands on. How sure you may be is ARITHMETIC, enforced
  at write time: founder-stated needs a cited intake_answer/founder_note (the founder SAID it);
  confirmed needs ≥2 citations from ≥2 different runs OR an outcomes: citation; one citation
  buys hypothesis, nothing more. rule_obeyed events never count.
- A new event that CONTRADICTS a rule REPLACES it (recency wins; the diary keeps history) —
  unless an intake answer resolved it as a one-time exception: then keep the law and append the
  exception to its text.
- Prefer EDITING an existing rule over adding a near-duplicate. Ids are stable: edits keep the
  id, new rules take the next free id.
- TOMBSTONES below are rules the founder deleted. Never rewrite them, in ANY phrasing.
- Never write status "stale" yourself — code stamps it after you. Carry an existing stale line
  verbatim, or re-cite it with fresh evidence at its earned status.
- A rule backed by THIS run's evidence writes "last r${args.runOrdinal}".
- When in doubt, DON'T write. A missing hypothesis costs nothing; a wrong rule poisons every
  future run for this brand.
- The user notebook is ONLY for person-facts that would stay true if the founder switched brands
  (cite cross-brand: "${args.brandKey}:E<n>"). Most deposits write nothing there.

THE GRAMMAR — the notebook is ONE title line + rule lines + nothing else, ≤4000 chars:
# Brand memory — ${args.brandKey} (account: ${args.account})
- R1 (founder-stated, r1) [E2] — Never discount framing.
- R2 (confirmed, last r5) [E12, E31] — No gym-bro tone in copy.
- R3 (hypothesis, r5) [E44] — Prefers headlines under 6 words.

CURRENT NOTEBOOK (rewrite it WHOLESALE — keep what stands, edit what changed):
${args.notebook?.trim() || '(none yet — this is the first deposit)'}

USER NOTEBOOK (for reference):
${args.userNotebook?.trim() || '(none)'}

TOMBSTONES (founder-deleted rules — never resurrect):
${args.tombstones.length ? args.tombstones.map((t) => `- ${t.e}: ${JSON.stringify(t.text ?? t.rule ?? '')}`).join('\n') : '(none)'}

NEW DIARY EVENTS since the last deposit — your citation currency:
${args.newEvents.map((ev) => JSON.stringify(ev)).join('\n') || '(none)'}

For context you may Read (BATCH your reads — several files in one message): founder-facts.md,
verdict.json, research.md, field/field-summary.json in the working directory.

Write ${args.notebookFile} ONCE, in exactly the grammar above. Only write ${args.userFile} if a
genuine person-fact emerged. Then you are done — produce nothing else.`;
}

// ── The deposit ──────────────────────────────────────────────────────────────

export interface DepositResult {
  skipped?: string;
  brandKey?: string;
  appended?: number;
  denials?: number;
  rules?: number;
  patch?: Omit<StalePatch, 'content'>;
  costUsd?: number;
}

export async function depositRun(
  runDir: string,
  opts: { account?: string; log?: (l: string) => void } = {},
): Promise<DepositResult> {
  const account = opts.account ?? DEFAULT_ACCOUNT;
  const log = opts.log ?? (() => {});
  const info = readSessionInfo(runDir);
  const brandUrl = info?.brandUrl ?? '';
  if (!brandUrl) return { skipped: 'no session.json/brandUrl — cannot resolve the brand' };
  if (!fs.existsSync(join(runDir, 'DONE.md'))) return { skipped: 'no DONE.md — deposits run on completed runs only' };
  const runId = runDir.replace(/\/+$/, '').split('/').pop()!;
  const brandKey = resolveBrandKeyForRun(runDir, brandUrl);
  const memDir = brandDir(account, brandKey);
  const notebookFile = notebookPath(memDir);
  const userFile = userNotebookPath(account);

  // ── steps 1–3 + backfill: CODE writes the diary before the model wakes ────
  let existing = readEvents(memDir);
  let appended = 0;
  const add = (body: Record<string, unknown>) => { appendEvent(memDir, { run: runId, ...body } as any); appended++; };

  // §5.1 verdict → events, once per run
  if (!existing.some((ev) => ev.run === runId && (ev.type === 'judge_ship' || ev.type === 'judge_kill'))) {
    try {
      const verdict = JSON.parse(fs.readFileSync(join(runDir, 'verdict.json'), 'utf8'));
      for (const body of verdictToEvents(verdict)) add(body);
    } catch { /* no verdict (flagged run) — honest absence */ }
  }

  // §5.2 founder-edit diff (snapshot vs on-disk, BEFORE the model writes)
  const readOpt = (p: string): string | null => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
  const notebookNow = readOpt(notebookFile);
  const snapshot = readOpt(snapshotPath(memDir));
  const diff = founderEditDiff(snapshot, notebookNow);
  for (const r of diff.deleted) add({ type: 'rule_deleted', rule: `R${r.id}`, text: r.text });
  // added/edited by hand = the founder holding the pen = founder speech (§5.2);
  // diff.added is only non-empty when the on-disk notebook diverges from the
  // snapshot, i.e. a human touched it between deposits (or hand-created it).
  for (const r of diff.added) {
    add({ type: 'founder_note', text: `founder hand-${snapshot === null ? 'wrote' : 'edited'} rule R${r.id}: ${r.text}` });
  }

  // §12.3 backfill: pre-memory run → synthesize the intake record
  existing = readEvents(memDir);
  if (!existing.some((ev) => ev.run === runId && ev.type === 'intake_answer')) {
    for (const body of synthesizeBackfillEvents(runDir)) add(body);
  }

  // §6 rule_obeyed soft events: injected + DONE + zero followups this run
  const injectedRaw = readOpt(join(runDir, INJECTED_FILE));
  existing = readEvents(memDir);
  if (injectedRaw && !existing.some((ev) => ev.run === runId && ev.type === 'rule_obeyed')) {
    const hadFollowups = existing.some((ev) => ev.run === runId && ev.type === 'followup');
    if (!hadFollowups) {
      try {
        for (const r of JSON.parse(injectedRaw).rules ?? []) {
          if (r?.scope === 'brand' && typeof r?.id === 'number') add({ type: 'rule_obeyed', rule: `R${r.id}` });
        }
      } catch { /* malformed injection record — skip soft events */ }
    }
  }

  // §3 scoreboard mirror: hand-entered outcome rows become diary events — a
  // fresh real-world result re-opens the deposit and can promote rules.
  appended += mirrorOutcomes(memDir);

  // ── idempotence: nothing new since the last watermark → skip the model ────
  const events = readEvents(memDir);
  const fresh = sinceWatermark(events);
  if (!fresh.length) return { skipped: 'nothing new since the last deposit watermark', brandKey, appended };
  const watermark = events.length ? `E${events.reduce((n, ev) => Math.max(n, eventOrdinal(ev.e)), 0)}` : nextEventId([]);

  // ── §5.4 the model pass, validator-fenced ─────────────────────────────────
  const runOrdinal = brandRunOrdinal(events, runId);
  const tombstones = events.filter((ev) => ev.type === 'rule_deleted');
  const outcomes = readOutcomes(memDir);
  const eventsByBrand = new Map<string, DiaryEvent[]>();
  try {
    for (const b of fs.readdirSync(join(accountDir(account), 'brands'))) {
      eventsByBrand.set(b, readEvents(brandDir(account, b)));
    }
  } catch { /* no brands dir yet */ }

  let denials = 0;
  const deny = (reason: string) => ({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse' as const,
      permissionDecision: 'deny' as const,
      permissionDecisionReason: reason,
    },
  });
  const prompt = buildDepositPrompt({
    account, brandKey, runOrdinal, notebook: notebookNow, userNotebook: readOpt(userFile),
    tombstones, newEvents: fresh, notebookFile, userFile,
  });
  log(`deposit ${brandKey}: run r${runOrdinal}, ${fresh.length} new event(s)`);

  let costUsd = 0;
  const q = query({
    prompt,
    options: {
      cwd: runDir,
      model: DEPOSIT_MODEL,
      additionalDirectories: [accountDir(account)],
      settingSources: [],
      allowedTools: ['Read', 'Glob', 'Grep', 'Write'],
      disallowedTools: ['Bash'],
      maxTurns: 8,
      maxBudgetUsd: 1,
      hooks: {
        PreToolUse: [{
          hooks: [async (input: any) => {
            if (input?.tool_name !== 'Write') return { continue: true as const };
            const fp = resolve(String(input?.tool_input?.file_path ?? ''));
            const content = String(input?.tool_input?.content ?? '');
            let problem: string | null = null;
            if (fp === resolve(notebookFile)) {
              problem = notebookProblem(content, { scope: 'brand', events, outcomes, priorNotebook: snapshot ?? notebookNow });
            } else if (fp === resolve(userFile)) {
              problem = notebookProblem(content, { scope: 'user', events: [], eventsByBrand, priorNotebook: readOpt(userFile) });
            } else {
              denials++;
              return deny(`the deposit writes ONLY ${notebookFile} or ${userFile} — nothing else, ever`);
            }
            if (problem) {
              denials++;
              log(`⛔ notebook refused: ${problem.slice(0, 200)}…`);
              return deny(`refused — ${problem}. Fix ALL of it and write again (the grammar is in your instructions).`);
            }
            return { continue: true as const };
          }],
        }],
      },
    },
  });
  for await (const m of q as any) {
    if (m?.type === 'result') costUsd = m.total_cost_usd ?? 0;
  }

  // ── §6 post-model arithmetic + §5.5 snapshot + watermark ──────────────────
  const written = readOpt(notebookFile);
  if (written === null) {
    appendEvent(memDir, { run: runId, type: 'deposit', throughEvent: watermark, note: 'model wrote no notebook' } as any);
    return { skipped: 'model pass produced no notebook write', brandKey, appended, denials, costUsd };
  }
  const obeyedIds = new Set(
    events.filter((ev) => ev.run === runId && ev.type === 'rule_obeyed')
      .map((ev) => parseInt(String(ev.rule ?? '').replace(/^R/, ''), 10)).filter(Number.isFinite),
  );
  const patch = applyStalenessAndBumps(written, { runOrdinal, obeyedIds, prior: snapshot });
  fs.writeFileSync(notebookFile, patch.content);
  fs.writeFileSync(snapshotPath(memDir), patch.content);
  appendEvent(memDir, { run: runId, type: 'deposit', throughEvent: watermark } as any);
  const rules = parseNotebook(patch.content).rules.length;
  log(`deposit ${brandKey}: ${rules} rule(s), ${denials} denial(s), $${costUsd.toFixed(2)}` +
    (patch.staled.length ? `, staled R${patch.staled.join(',R')}` : '') +
    (patch.dropped.length ? `, dropped R${patch.dropped.join(',R')}` : '') +
    (patch.bumped.length ? `, bumped R${patch.bumped.join(',R')}` : ''));
  return { brandKey, appended, denials, rules, patch: { bumped: patch.bumped, staled: patch.staled, dropped: patch.dropped }, costUsd };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2).filter((a) => a !== '--force');
  if (!args.length) {
    console.error('usage: npx tsx memory-deposit.ts <runDir> [<runDir> …]');
    process.exit(1);
  }
  loadEnv();
  const runs = args.map((a) => resolve(a));
  (async () => {
    for (const dir of runs) {
      console.log(`\n── deposit: ${dir.split('/').pop()}`);
      try {
        const r = await depositRun(dir, { log: (l) => console.log(`  ${l}`) });
        if (r.skipped) console.log(`  · skipped: ${r.skipped}`);
        else console.log(`  ✓ ${r.brandKey}: ${r.rules} rule(s), +${r.appended} event(s), ${r.denials} denial(s), $${(r.costUsd ?? 0).toFixed(2)}`);
      } catch (e: any) {
        console.error(`  ✗ failed: ${e?.message ?? e}`);
        process.exitCode = 1;
      }
    }
  })();
}
