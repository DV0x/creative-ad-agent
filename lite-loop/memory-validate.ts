/**
 * memory-validate.ts — P0 of the brand-memory loop
 * (plan: docs/PLAN_BRAND_MEMORY_LOOP_2026-07-22.md §5).
 *
 * notebookProblem() — the deterministic Write-validator for memory.md/user.md,
 * wired (P2) as a PreToolUse deny-hook on the deposit query. PURE: all data
 * injected, no fs. Collect-ALL denial style (pipeline.ts F26 — one denial names
 * every violation, one rewrite fixes them all).
 *
 * The division of labour (§5): the deposit MODEL judges what is a lesson, which
 * notebook it belongs in, and how to phrase it — this CODE decides how sure it
 * is allowed to be. F33 defense: uncited memory is fabricated memory. A wrong
 * rule here poisons every future run for the brand, so this is the one file
 * where model beliefs meet a validator that cannot be argued with.
 */
import {
  FOUNDER_SPEECH_TYPES, RULE_RE, eventOrdinal, normRuleText, parseNotebook,
  type DiaryEvent, type NotebookRule, type OutcomeRow,
} from './memory-store.ts';

export const NOTEBOOK_CHAR_CAP = 4000;

export interface NotebookContext {
  /** brand memory.md, or the account-level user.md */
  scope: 'brand' | 'user';
  /** THIS brand's diary (empty for user scope — user.md has no diary of its own) */
  events: DiaryEvent[];
  /** THIS brand's scoreboard (outcomes: citations resolve here; brand scope only) */
  outcomes?: OutcomeRow[];
  /** user scope: cross-brand citations "<brand-key>:E12" resolve through this map */
  eventsByBrand?: Map<string, DiaryEvent[]>;
  /** memory.md.last — stale legality (§6: stale is stamped by code, a model may
   *  only CARRY an existing stale mark, never mint one) */
  priorNotebook?: string | null;
}

// same collect-all shape as pipeline.ts allProblems (F26) — kept local so P0
// stays additive (no pipeline.ts edits before P1).
const allProblems = (issues: string[]): string | null =>
  issues.length === 0
    ? null
    : issues.length === 1
      ? issues[0]
      : `${issues.length} problems, fix ALL of them in ONE rewrite: ${issues.map((p, i) => `(${i + 1}) ${p}`).join(' ')}`;

interface ResolvedCites {
  /** cited diary events that exist (cross-brand ones included, resolved) */
  events: DiaryEvent[];
  /** cited outcomes rows that exist (by creative id) */
  outcomes: OutcomeRow[];
  /** citations that resolve to nothing — always a violation */
  unresolved: string[];
  /** citations that are the wrong FORM for this scope — always a violation */
  wrongScope: string[];
}

function resolveCites(rule: NotebookRule, ctx: NotebookContext): ResolvedCites {
  const out: ResolvedCites = { events: [], outcomes: [], unresolved: [], wrongScope: [] };
  const byId = new Map(ctx.events.map((ev) => [ev.e, ev]));
  for (const cite of rule.cites) {
    if (/^E\d+$/.test(cite)) {
      if (ctx.scope === 'user') { out.wrongScope.push(cite); continue; }
      const ev = byId.get(cite);
      if (ev) out.events.push(ev);
      else out.unresolved.push(cite);
      continue;
    }
    const oc = /^outcomes:(.+)$/.exec(cite);
    if (oc) {
      if (ctx.scope === 'user') { out.wrongScope.push(cite); continue; }
      const row = (ctx.outcomes ?? []).find((r) => r.creative === oc[1].trim());
      if (row) out.outcomes.push(row);
      else out.unresolved.push(cite);
      continue;
    }
    const cross = /^([a-z0-9-]+):(E\d+)$/.exec(cite);
    if (cross) {
      if (ctx.scope === 'brand') { out.wrongScope.push(cite); continue; }
      const ev = ctx.eventsByBrand?.get(cross[1])?.find((e) => e.e === cross[2]);
      if (ev) out.events.push(ev);
      else out.unresolved.push(cite);
      continue;
    }
    out.unresolved.push(cite);
  }
  return out;
}

/** null when the notebook may be written; else EVERY violation in one denial. */
export function notebookProblem(content: string, ctx: NotebookContext): string | null {
  const issues: string[] = [];

  // §3: ≤4KB — the notebook is rules, not history.
  if (content.length > NOTEBOOK_CHAR_CAP) {
    issues.push(
      `the notebook is ${content.length} chars — ${content.length - NOTEBOOK_CHAR_CAP} OVER the ${NOTEBOOK_CHAR_CAP}-char cap. ` +
      'Merge near-duplicate rules and drop the weakest hypotheses; rules, not history',
    );
  }

  const nb = parseNotebook(content);

  // §3: title + rule lines + blank lines and NOTHING else.
  if (nb.title === null) issues.push('missing the title line — the first non-empty line must be `# <Brand memory — …>`');
  for (const bad of nb.badLines.slice(0, 3)) {
    issues.push(
      `line ${bad.line} does not parse: ${JSON.stringify(bad.text.slice(0, 80))} — every rule line is EXACTLY ` +
      '`- R<id> (<status>[, last r<run>]) [<citations>] — <rule text>` and the file holds nothing but the title and rule lines',
    );
  }
  if (nb.badLines.length > 3) issues.push(`…and ${nb.badLines.length - 3} more unparseable line(s)`);

  // rule ids unique — they are the stable handle for edits, tombstones, staleness.
  const seen = new Map<number, number>();
  for (const r of nb.rules) {
    const first = seen.get(r.id);
    if (first !== undefined) issues.push(`rule id R${r.id} appears twice (lines ${first} and ${r.line}) — ids are unique; edits keep the id, new rules take the next free id`);
    else seen.set(r.id, r.line);
  }

  const prior = ctx.priorNotebook ? parseNotebook(ctx.priorNotebook) : null;
  const tombstones = ctx.events.filter((ev) => ev.type === 'rule_deleted');

  for (const rule of nb.rules) {
    const r = `R${rule.id}`;
    const c = resolveCites(rule, ctx);

    for (const cite of c.unresolved) {
      issues.push(`${r} cites ${JSON.stringify(cite)} which does not exist — every citation must be a real diary event${ctx.scope === 'brand' ? ' or outcomes row' : ''}; uncited memory is fabricated memory`);
    }
    for (const cite of c.wrongScope) {
      issues.push(
        ctx.scope === 'user'
          ? `${r} cites ${JSON.stringify(cite)} — user.md citations must be cross-brand ("<brand-key>:E<n>"); plain event and outcomes: citations are brand-notebook only`
          : `${r} cites ${JSON.stringify(cite)} — cross-brand citations belong in user.md only; a brand notebook cites its own diary (E<n>) or scoreboard (outcomes:<creative>)`,
      );
    }

    // §6: silence keeps rules alive, only evidence strengthens — rule_obeyed
    // citations are legal but count toward NO status requirement.
    const strong = c.events.filter((ev) => ev.type !== 'rule_obeyed');
    const speech = strong.filter((ev) => FOUNDER_SPEECH_TYPES.has(ev.type));

    switch (rule.status) {
      case 'founder-stated':
        if (speech.length === 0) issues.push(`${r} is marked founder-stated but cites no intake_answer/founder_note event — founder-stated means the founder SAID it; an inference is at most a hypothesis`);
        break;
      case 'confirmed': {
        const runs = new Set(strong.map((ev) => ev.run));
        if (c.outcomes.length === 0 && !(strong.length >= 2 && runs.size >= 2)) {
          issues.push(
            `${r} is marked confirmed on ${strong.length} countable citation(s) across ${runs.size} run(s) — ` +
            'confirmed needs ≥2 citations from ≥2 distinct runs OR an outcomes: citation (rule_obeyed never counts)',
          );
        }
        break;
      }
      case 'hypothesis':
        if (strong.length === 0 && c.outcomes.length === 0) issues.push(`${r} (hypothesis) has no countable citation — rule_obeyed events never ground a rule; silence is not evidence`);
        break;
      case 'stale':
        // §6: a model may CARRY an existing stale mark verbatim, never mint one.
        if (!prior?.rules.some((p) => p.id === rule.id && p.status === 'stale')) {
          issues.push(`${r} is marked stale but was not stale in the prior notebook — stale is stamped by CODE after the write; a model never writes it`);
        }
        break;
    }

    // §5/§8 tombstones (brand scope — user.md has no diary to hold them):
    // deleted stays deleted unless a NEWER founder statement supports the rule.
    const tomb = tombstones.find((t) => typeof t.text === 'string' && normRuleText(t.text) === normRuleText(rule.text));
    if (tomb) {
      const override = speech.some((ev) => eventOrdinal(ev.e) > eventOrdinal(tomb.e));
      if (!override) {
        issues.push(
          `${r} matches the deleted-rule tombstone ${tomb.e} (${JSON.stringify(tomb.text)}) — the founder removed this rule; ` +
          `it only returns when a founder_note/intake_answer NEWER than ${tomb.e} says it again`,
        );
      }
    }
  }

  // The forgetting ladder (S158): a rewrite may only FORGET by arithmetic —
  // the ACE "context collapse" defense. The model may drop a hypothesis (the
  // deposit logs it); a confirmed rule leaves only by MERGING (its citations
  // must survive on other rules); founder-stated is retired by the founder
  // alone (tombstone path); stale lines are carried verbatim — CODE retires
  // them on its own clock. Cap pressure stays resolvable: hypotheses drop and
  // confirmed rules merge, so the ladder and the 4KB cap never deadlock.
  if (prior) {
    const newIds = new Set(nb.rules.map((n) => n.id));
    const survivingCites = new Set(nb.rules.flatMap((n) => n.cites));
    for (const old of prior.rules) {
      if (newIds.has(old.id)) continue;
      // founder deletions arrive as tombstones — recorded, not the model's doing
      if (tombstones.some((t) => typeof t.text === 'string' && normRuleText(t.text) === normRuleText(old.text))) continue;
      const r = `R${old.id}`;
      switch (old.status) {
        case 'founder-stated':
          issues.push(`${r} (founder-stated) is missing from this rewrite — only the founder retires a law; keep it verbatim`);
          break;
        case 'confirmed': {
          const lost = old.cites.filter((c) => !survivingCites.has(c));
          if (lost.length) {
            issues.push(
              `${r} (confirmed) is missing and its citation(s) ${lost.join(', ')} survive nowhere — ` +
              'a confirmed rule only leaves by MERGING; keep it, or fold its citations into the rule that absorbs it',
            );
          }
          break;
        }
        case 'stale':
          issues.push(`${r} is stale and missing — carry stale lines verbatim; CODE retires them on its own clock`);
          break;
        // hypothesis: droppable — the deposit logs a rule_dropped diary event
      }
    }
  }

  return allProblems(issues);
}

// re-export for the P1/P2 wiring + tests: the grammar the denials quote back
export { RULE_RE };
