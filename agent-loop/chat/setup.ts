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
  if (order.includes('collect') || order.includes('market')) need.add('PERPLEXITY_API_KEY');
  if (order.includes('market')) need.add('SCRAPECREATORS_API_KEY');
  if (order.includes('cell-render')) need.add('FAL_KEY');
  return [...need].filter((k) => !process.env[k]);
}

// The cell reference bundle — copied into the run dir for both cell stages so the binder's
// "read references/X.md" resolves relative to cwd. MUST match run.ts.
const CELL_REFS = [
  ...['layer-stack', 'style-grammar', 'type-grammar', 'shot-spec', 'critic', 'render-critic', 'counterexamples'].map((n) => ({
    src: `agent/.claude/skills/cell/references/${n}.md`,
    dest: `references/${n}.md`,
  })),
  ...['testimonial', 'founder-pov', 'pas-real-world'].map((n) => ({
    src: `agent/.claude/skills/cell/references/formats/${n}.md`,
    dest: `references/formats/${n}.md`,
  })),
];
const EXTRA_FILES: Record<string, Array<{ src: string; dest: string }>> = {
  'cell-render': CELL_REFS,
};

export function slugFor(brandUrl: string): string {
  return brandUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .toLowerCase();
}

/** Create a fresh stamped run dir (with images/), or reuse an existing one for --resume. */
export function createRunDir(brandUrl: string, resumeDir?: string): string {
  const runDir = resumeDir
    ? resumeDir
    : join(AGENT_LOOP_DIR, 'runs', `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}_${slugFor(brandUrl)}`);
  fs.mkdirSync(join(runDir, 'images'), { recursive: true });
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

/** Copy the binder reference files each stage expects into the run dir. */
export function stageBinderRefs(runDir: string, order: string[]): void {
  for (const s of order) {
    for (const f of EXTRA_FILES[s] ?? []) {
      const src = join(REPO_ROOT, f.src);
      const dest = join(runDir, f.dest);
      if (fs.existsSync(src)) {
        fs.mkdirSync(dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }
  }
}
