/**
 * chat/setup.ts — env + run-dir + binder-file staging for the chat entry.
 *
 * Mirrors the setup block in run.ts (keep the CELL_REFS/EXTRA_FILES lists in sync). The
 * headless runner is left untouched; the chat's founder brief is captured by the orchestrator
 * during intake, so here we only lay down a URL-only founder-facts.md stub for it to overwrite.
 */
import { config as loadEnvFile } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fs from 'node:fs';
import { initView, reduce, type ChatView } from './reducer.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const AGENT_LOOP_DIR = join(__dirname, '..');
export const REPO_ROOT = join(AGENT_LOOP_DIR, '..');

/** Load the repo-root env files, then strip ANTHROPIC_API_KEY so the Max OAuth login wins. */
export function loadEnv(): void {
  loadEnvFile({ path: join(REPO_ROOT, '.env.local') });
  loadEnvFile({ path: join(REPO_ROOT, '.env') });
  delete process.env.ANTHROPIC_API_KEY;
}

/** Which required keys are missing for the chosen stages (fail fast with a clear message). */
export function missingKeys(order: string[]): string[] {
  const need = new Set<string>();
  if (order.includes('collect') || order.includes('field-scout')) need.add('PERPLEXITY_API_KEY');
  if (order.includes('field-scout')) need.add('SCRAPECREATORS_API_KEY');
  const missing = [...need].filter((k) => !process.env[k]);
  // build renders via KIE (primary) or fal (failover) — at least one key must exist
  if (order.includes('build') && !process.env.KIE_API_KEY && !process.env.FAL_KEY) missing.push('KIE_API_KEY (or FAL_KEY)');
  return missing;
}

export function slugFor(brandUrl: string): string {
  return brandUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .toLowerCase();
}

/** Create a fresh stamped run dir (with field/reads/ + renders/), or reuse an existing one for --resume. */
export function createRunDir(brandUrl: string, resumeDir?: string): string {
  const runDir = resumeDir
    ? resumeDir
    : join(AGENT_LOOP_DIR, 'runs', `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}_${slugFor(brandUrl)}`);
  fs.mkdirSync(join(runDir, 'field', 'reads'), { recursive: true }); // the reader fan-out appends slice files here
  fs.mkdirSync(join(runDir, 'renders'), { recursive: true });
  return runDir;
}

/** URL-only founder-facts stub. The orchestrator overwrites it after intake; kept so research
 *  never hard-fails reading it if intake is skipped. */
export function writeFounderStub(runDir: string, brandUrl: string): void {
  const p = join(runDir, 'founder-facts.md');
  if (fs.existsSync(p)) return;
  fs.writeFileSync(
    p,
    ['# Founder Facts', '', `- Brand URL: ${brandUrl}`, '- (intake pending — the orchestrator captures the brief here)', ''].join('\n'),
  );
}

/** Binder reference staging — now a NO-OP kept for caller compatibility. The field-first
 *  seats get their reference docs INLINED into their prompts by pipeline.ts (read-schema,
 *  field-brief rules, buyer + gate rubrics), so nothing needs copying into the run dir. */
export function stageBinderRefs(_runDir: string, _order: string[]): void {}

// ── Session resume (the docs' return-to-a-conversation path) ────────────────
// ChatSession writes runDir/session.json at init ({sessionId, brandUrl, order,
// startedAt}); these helpers read it back so a run can be REOPENED with the SDK's
// `resume` — full conversation memory, follow-up router on top.

export interface SessionInfo {
  sessionId: string;
  brandUrl: string;
  order: string[];
  startedAt?: string;
}

/** The run's SDK session record, or null when the run predates session capture. */
export function readSessionInfo(runDir: string): SessionInfo | null {
  try {
    const raw = JSON.parse(fs.readFileSync(join(runDir, 'session.json'), 'utf8'));
    if (typeof raw?.sessionId !== 'string' || !raw.sessionId) return null;
    return {
      sessionId: raw.sessionId,
      brandUrl: String(raw.brandUrl ?? ''),
      order: Array.isArray(raw.order) ? raw.order : [],
      startedAt: raw.startedAt,
    };
  } catch {
    return null;
  }
}

export interface ResumableRun {
  runId: string; // basename of the run dir
  brandUrl: string;
  startedAt?: string;
  done: boolean; // DONE.md exists — the run completed (iteration mode on reopen)
  renders: number; // shipped image count, for the picker
}

/** Rebuild the live view for a resumed run by folding its OWN trace.jsonl back
 *  through the reducer — trace.jsonl records the exact SDK messages the reducer
 *  consumes, so this reproduces the original run's feed (the prior conversation)
 *  + the completed pipeline strip. Resilient: any failure (missing/oversized/
 *  corrupt trace, or an FS stall) degrades to a fresh view with a resumed note,
 *  never a broken resume. Rendered images are NOT in the trace (they arrive via
 *  the renders/ watcher, not the SDK stream) — the caller replays those after. */
export function rehydrateView(runDir: string, brandUrl: string, order: string[]): ChatView {
  let view = initView(brandUrl, order);
  try {
    const tracePath = join(runDir, 'trace.jsonl');
    if (fs.existsSync(tracePath)) {
      const raw = fs.readFileSync(tracePath, 'utf8');
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        // Skip giant lines cheaply (string length, no parse): these are subagent
        // tool-result payloads (image reads, full JSON dumps) that the reducer
        // ignores anyway — parsing them is the only slow part on a fat/compounding
        // trace, and skipping keeps resume snappy without losing any feed content.
        if (line.length > 512_000) continue;
        try {
          const o = JSON.parse(line);
          if (o && o.msg) view = reduce(view, { t: 'sdk', m: o.msg });
        } catch { /* skip a corrupt/partial line */ }
      }
    }
  } catch {
    view = initView(brandUrl, order); // FS stall / oversized read → clean fallback
  }
  // A resumed run is complete; surface that + a marker so the founder has context.
  view = { ...view, phase: 'idle', feed: [...view.feed, { kind: 'note', text: '↩ Continued session — ask for any change.' }] };
  return view;
}

/** Newest-first list of runs that can be reopened (have a captured session id). */
export function listResumableRuns(limit = 8): ResumableRun[] {
  const runsDir = join(AGENT_LOOP_DIR, 'runs');
  if (!fs.existsSync(runsDir)) return [];
  const out: ResumableRun[] = [];
  for (const name of fs.readdirSync(runsDir).sort().reverse()) {
    if (out.length >= limit) break;
    const dir = join(runsDir, name);
    const info = readSessionInfo(dir);
    if (!info) continue;
    const rendersDir = join(dir, 'renders');
    const renders = fs.existsSync(rendersDir)
      ? fs.readdirSync(rendersDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length
      : 0;
    out.push({ runId: name, brandUrl: info.brandUrl, startedAt: info.startedAt, done: fs.existsSync(join(dir, 'DONE.md')), renders });
  }
  return out;
}
