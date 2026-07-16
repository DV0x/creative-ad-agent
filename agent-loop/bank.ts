/**
 * The FORMAT BANK — the persistent cross-client construction store
 * (S145 plan §Step 2.6; score schema from PLAN_FIELD_FIRST_PIPELINE §3/§5b).
 *
 * Three memory tiers: scraped field (public, no moat) → interpreted reads
 * (labeled dataset, medium moat) → outcome-linked scores (the moat). This
 * module is tier 2's store and tier 3's scaffold: one JSONL per formatFamily
 * under agent-loop/bank/, each line a pixel read (the unified read schema)
 * plus provenance (`bank`) and the outcome field (`score`) that Step 4's CSV
 * ingest writes flights into.
 *
 * Wiring: buildBaseOptions symlinks the store into every run dir (runDir/bank →
 * BANK_DIR) so the brief/create/buy seats can Grep `bank/*.jsonl` with their
 * ordinary file tools, and the DONE.md PostToolUse hook appends the finished
 * run's reads (dedup by read id — first read of an ad wins, v1 policy).
 * Seeding across markets is seed-bank.ts (costs credits; founder-gated).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** The store. Plain JSONL on disk — R2/D1 port unchanged from the S141 sketch, later.
 *  CREATIVE_BANK_DIR overrides (tests; a per-client bank if that ever becomes policy). */
export const BANK_DIR = process.env.CREATIVE_BANK_DIR
  ? path.resolve(process.env.CREATIVE_BANK_DIR)
  : path.resolve(__dirname, 'bank');

// formatFamily value → bank filename. `other:<describe>` collapses to other.jsonl
// (triaged deliberately, later); reads from before the formatFamily field existed
// land in unlabeled.jsonl so nothing is lost.
export function familySlug(family: unknown): string {
  const s = String(family ?? '').trim().toLowerCase();
  if (!s) return 'unlabeled';
  const base = s.startsWith('other') ? 'other' : s;
  const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return slug || 'unlabeled';
}

/** Expose the bank inside a run dir (runDir/bank → BANK_DIR) so every seat can
 *  Read/Grep `bank/*.jsonl` relative to its cwd. Non-fatal on failure — a run
 *  without the bank degrades to local-field-only sourcing. */
export function ensureBankAccess(runDir: string): void {
  try {
    fs.mkdirSync(BANK_DIR, { recursive: true });
    const link = path.join(runDir, 'bank');
    if (!fs.existsSync(link)) fs.symlinkSync(BANK_DIR, link, 'dir');
  } catch (err) {
    process.stderr.write(`[bank] access link failed (non-fatal): ${err instanceof Error ? err.message : String(err)}\n`);
  }
}

function existingIds(file: string): Set<string> {
  const ids = new Set<string>();
  if (!fs.existsSync(file)) return ids;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      const o = JSON.parse(t);
      if (o && typeof o.id === 'string') ids.add(o.id);
    } catch { /* corrupt line — ignore for dedupe purposes */ }
  }
  return ids;
}

export interface BankAppendResult {
  appended: number;
  skipped: number; // already banked (or duplicate within the run)
  families: string[];
}

/** Append a run's pixel reads (field/reads/*.jsonl) into the bank.
 *  Every entry gains provenance (`bank.run`, `bank.bankedAt`) and the §5b
 *  outcome scaffold (`score: {flights, verdict, updatedAt}`) when absent.
 *  Dedupe is by read id; the first banked read of an ad wins (v1 policy —
 *  re-reads don't overwrite; revisit when Step 4's outcome loop lands). */
export function appendRunReadsToBank(runDir: string, onEvent?: (msg: string) => void): BankAppendResult {
  const result: BankAppendResult = { appended: 0, skipped: 0, families: [] };
  try {
    const readsDir = path.join(runDir, 'field', 'reads');
    if (!fs.existsSync(readsDir)) return result;

    const reads: any[] = [];
    for (const f of fs.readdirSync(readsDir).filter((n) => n.endsWith('.jsonl'))) {
      for (const line of fs.readFileSync(path.join(readsDir, f), 'utf8').split('\n')) {
        const t = line.trim();
        if (!t) continue;
        try {
          const o = JSON.parse(t);
          if (o && typeof o.id === 'string' && o.id) reads.push(o);
        } catch { /* corrupt read line — the run's own problem, not the bank's */ }
      }
    }
    if (reads.length === 0) return result;

    fs.mkdirSync(BANK_DIR, { recursive: true });
    const byFamily = new Map<string, any[]>();
    for (const o of reads) {
      const fam = familySlug(o.formatFamily);
      const list = byFamily.get(fam) ?? [];
      list.push(o);
      byFamily.set(fam, list);
    }

    const runName = path.basename(runDir);
    const bankedAt = new Date().toISOString();
    for (const [fam, entries] of byFamily) {
      const file = path.join(BANK_DIR, `${fam}.jsonl`);
      const seen = existingIds(file);
      const fresh: string[] = [];
      for (const o of entries) {
        if (seen.has(o.id)) { result.skipped++; continue; }
        seen.add(o.id);
        o.bank = { run: runName, bankedAt };
        if (!o.score) o.score = { flights: [], verdict: 'untested', updatedAt: '' };
        fresh.push(JSON.stringify(o));
      }
      if (fresh.length) {
        fs.appendFileSync(file, fresh.join('\n') + '\n', 'utf8');
        result.appended += fresh.length;
        result.families.push(fam);
      }
    }
    if (result.appended || result.skipped) {
      onEvent?.(`🏦 bank: +${result.appended} read(s) (${result.skipped} already banked) → ${result.families.join(', ') || '—'}`);
    }
  } catch (err) {
    process.stderr.write(`[bank] append failed (non-fatal): ${err instanceof Error ? err.message : String(err)}\n`);
  }
  return result;
}
