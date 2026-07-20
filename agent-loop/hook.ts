/**
 * PreToolUse hook — the harness's rule layer. Three guards, all keyed on the
 * fields the SDK gives the hook (`agent_id` absent = orchestrator/main thread;
 * `agent_type` = the subagent's stage name):
 *
 *  1. ORCHESTRATOR-MCP GUARD — an mcp__ call with no agent_id is the orchestrator
 *     breaking role → deny. (The §6 hard guarantee the permission system can't give.)
 *
 *  2. LAUNCH-CEILING GUARD — per-stage relaunch cap. ALLOWS the bounded retry loops
 *     (cell-generate/critic re-mine up to 3 rounds; cell-render/render-critic 1 retry)
 *     but denies a runaway (the old async double-fire that fired a 2nd research).
 *
 *  3. GATHERING BUDGET — per subagent, cap the expensive gathering tools
 *     (WebFetch + perplexity + scrapecreators). Past the cap, deny *gathering*
 *     (Read/Write/Glob always allowed) with "synthesize and write now". This
 *     replaces AgentDefinition.maxTurns, which is NOT enforced in 0.3.195
 *     (research did 77 calls against a cap of 40). The cap value is the
 *     surface/deep mode knob.
 */
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import * as fs from 'node:fs';
import { join } from 'node:path';

// download_creatives is EXEMPT from the gathering cap: it materializes already-
// fetched data (no API credits) for the readers — denying it post-cap would
// strand a run with a shortlist and zero images. page_text IS counted (it is a
// crawl-capable fetch — collect's WebFetch replacement); the one-shot identity/
// product extractors are exempt.
const isGatheringTool = (name: string): boolean =>
  name === 'WebFetch' || name === 'mcp__brand__page_text' || name.startsWith('mcp__perplexity') ||
  (name.startsWith('mcp__scrapecreators') && !name.endsWith('download_creatives'));

// Binary-into-context WebFetch ban (S151 scout diet): the HK scout WebFetched
// fbcdn image URLs — raw image bytes in context is the single worst overflow
// pattern. Creatives reach disk via download_creatives; pages are for reading.
const BINARY_PATH_RE = /\.(png|jpe?g|gif|webp|avif|bmp|ico|mp4|mov|webm)$/i;
const IMAGE_CDN_RE = /fbcdn|cdninstagram/i;
const isBinaryFetchUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    return BINARY_PATH_RE.test(u.pathname) || IMAGE_CDN_RE.test(u.hostname);
  } catch { return false; }
};

// Per-stage launch ceilings. The retry loops re-launch create/buy (one
// buyer-rejected redo) and build/gate (1 re-render round), and the field-read
// FAN-OUT launches several readers in one message — so a flat "once only" rule
// would block them. Collectors/scout run once. Beyond the ceiling = a runaway
// (the old async double-fire) — deny it.
const LAUNCH_CAPS: Record<string, number> = {
  'field-scout': 1,
  'field-read': 8, // the parallel fan-out: one launch per reader slice
  'field-brief': 2,
  collect: 1,
  create: 3, // initial + one full redo (reject-all) + one backfill round (partial kills)
  buy: 3,
  build: 3, // initial + the gate's single re-render round (+1 headroom)
  gate: 3,
  kit: 2, // initial + one rebuild after a follow-up changes shipped work
};
const DEFAULT_LAUNCH_CAP = 2;
// After DONE.md exists the session is in ITERATION MODE (founder-driven follow-ups
// through the router) — the strict mid-run ceilings would deny legitimate edit
// cycles, so a generous per-stage ceiling takes over. Budget caps still guard.
const ITERATION_LAUNCH_CAP = 12;

export interface HookConfig {
  /** subagent_type -> max gathering calls (e.g. { collect: 15, market: 15 }). */
  caps: Record<string, number>;
  /** Cap for stages not in `caps` (create/buy don't gather). Default: no cap. */
  defaultCap?: number;
  /** Absolute paths that must ALL exist before DONE.md may be written. Stops the
   *  orchestrator declaring completion off stale/archived files (observed: it
   *  Globbed an archived r1/ round and wrote DONE.md without running any stage). */
  doneRequires?: string[];
  /** Fired ONCE after DONE.md is actually written (PostToolUse) — the run-complete
   *  signal that works on every entry point (headless, chat, web). Used to append
   *  the run's reads to the format bank. */
  onDone?: () => void;
  /** Absolute path of DONE.md. When it EXISTS on disk, the launch-ceiling check
   *  switches to the generous iteration cap (follow-up edit cycles are founder-
   *  driven, not runaway loops). */
  donePath?: string;
  /** Spec-file assembly (S151 fix #1 — kill create's regeneration waste): create
   *  writes ONE FILE PER SPEC (creatives/c<N>.json); every time one lands, CODE
   *  merges all of them into creatives.json. The model never writes the big file,
   *  so the 16k output cap / split-write / stitch failure class cannot occur. */
  specs?: { dir: string; out: string };
  /** Progress sink for denials. */
  onEvent?: (msg: string) => void;
  /** The exact brand/destination URL the founder gave. When set, any Write to
   *  founder-facts.md that drops it is DENIED — the gate's LP check and every
   *  downstream fetch resolve THIS URL verbatim; a brief without it forces the
   *  model to derive a slug from the product name (observed: soft-404 → false
   *  structural FAIL). */
  brandUrl?: string;
}

export function buildHooks(cfg: HookConfig): Options['hooks'] {
  const gatherCount = new Map<string, number>(); // agent key -> gathering calls so far
  const launchCount = new Map<string, number>(); // subagent_type -> launches so far (retry-aware ceiling)
  let identityLogged = false; // log the first gathering call's identity once (diagnostic)
  let doneFired = false; // onDone fires once, even if DONE.md is rewritten (chat follow-ups)

  // Merge creatives/c<N>.json spec files into creatives.json (numeric order).
  // MERGE, not replace: entries already in creatives.json whose number has no
  // spec file survive — so a backfill/follow-up on a pre-spec-file run (where
  // creatives.json was model-written and creatives/ starts empty) never loses
  // the surviving specs. A spec file always wins over a baseline entry.
  const assembleSpecs = () => {
    if (!cfg.specs) return;
    const { dir, out } = cfg.specs;
    const byNumber = new Map<number, any>();
    try {
      const prev = JSON.parse(fs.readFileSync(out, 'utf8'));
      if (Array.isArray(prev)) for (const s of prev) if (s && typeof s.creative === 'number') byNumber.set(s.creative, s);
    } catch { /* no baseline (fresh run) or unparseable — spec files alone */ }
    let files: string[] = [];
    try { files = fs.readdirSync(dir).filter((f) => /^c\d+\.json$/.test(f)); } catch { return; }
    for (const f of files) {
      try {
        const parsed = JSON.parse(fs.readFileSync(join(dir, f), 'utf8'));
        for (const s of Array.isArray(parsed) ? parsed : [parsed]) {
          const n = s && typeof s.creative === 'number' ? s.creative : parseInt(f.slice(1), 10);
          byNumber.set(n, s);
        }
      } catch (err) {
        cfg.onEvent?.(`⚠ creatives/${f} is not valid JSON — left out of creatives.json (${err instanceof Error ? err.message : String(err)})`);
      }
    }
    if (!byNumber.size) return;
    const specs = [...byNumber.entries()].sort((a, b) => a[0] - b[0]).map(([, s]) => s);
    fs.writeFileSync(out, JSON.stringify(specs, null, 2) + '\n');
    cfg.onEvent?.(`· assembled creatives.json (${specs.length} spec${specs.length === 1 ? '' : 's'}, ${files.length} file${files.length === 1 ? '' : 's'})`);
  };

  const deny = (reason: string) => {
    cfg.onEvent?.(`⛔ ${reason}`);
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse' as const,
        permissionDecision: 'deny' as const,
        permissionDecisionReason: reason,
      },
    };
  };
  const cont = () => ({ continue: true as const });

  return {
    PreToolUse: [
      {
        hooks: [
          async (input: any) => {
            const tool: string = input?.tool_name ?? '';
            const agentId: string | undefined = input?.agent_id; // absent on main thread
            const agentType: string | undefined = input?.agent_type; // subagent stage name
            const fromOrchestrator = !agentId;

            // 0) DONE.md is the completion sentinel — it may only be written once every
            // ordered stage's deliverable exists ON THIS RUN's disk. This is the code-side
            // "harness disposes" guard against the orchestrator concluding completion from
            // archived/stale files instead of running its stages.
            // EXCEPTION: a DONE.md that starts with "flagged" is a legitimate EARLY end
            // (buyer rejected two batches; gate found a structural miss) — on that path the
            // downstream deliverables rightly do not exist, so the guard must let it through.
            if (tool === 'Write' && typeof input?.tool_input?.file_path === 'string' && /(^|\/)DONE\.md$/.test(input.tool_input.file_path)) {
              const content = String(input?.tool_input?.content ?? '');
              const isFlag = /^\s*flagged\b/i.test(content);
              const missing = isFlag ? [] : (cfg.doneRequires ?? []).filter((p) => !fs.existsSync(p));
              if (missing.length) {
                return deny(
                  `DONE.md refused: this run's deliverable(s) do not exist yet — ${missing.join(', ')}. ` +
                  'Run the missing stage(s) via the Agent tool first. Files in archived subfolders do not count. ' +
                  '(Only a "flagged: <reason>" DONE.md may end a run early.)',
                );
              }
            }

            // 0b) founder-facts.md must never lose the exact destination URL —
            // the intake rewrite replaces the stub wholesale; if the URL line
            // vanishes, the gate has no ground truth and invents a slug.
            if (
              cfg.brandUrl &&
              tool === 'Write' &&
              typeof input?.tool_input?.file_path === 'string' &&
              /(^|\/)founder-facts\.md$/.test(input.tool_input.file_path) &&
              !String(input?.tool_input?.content ?? '').includes(cfg.brandUrl)
            ) {
              return deny(
                `founder-facts.md must carry the exact destination URL verbatim (${cfg.brandUrl}) — ` +
                'add a "Brand URL:" line near the top. Downstream seats (gate LP check, collect) fetch THIS ' +
                'string; a brief without it forces slug-guessing.',
              );
            }

            // 1) orchestrator must not call MCP directly
            if (tool.startsWith('mcp__') && fromOrchestrator) {
              return deny(
                `Orchestrator must not call MCP directly (${tool}); route the work to the seat that owns the tool ` +
                '(brand/page tools live on collect; ad tools on field-scout; render on build). For intake grounding, ' +
                'Read raw/pages/intake-ground.txt instead — it is pre-fetched.',
              );
            }

            // 2) launch ceiling per stage — ALLOW the bounded retry loops (cell-generate/
            // critic re-mine up to 3 rounds; cell-render/render-critic 1 retry) but stop a
            // runaway (a stage fired far past its ceiling — the old async double-fire).
            if ((tool === 'Agent' || tool === 'Task') && fromOrchestrator) {
              const st: string | undefined = input?.tool_input?.subagent_type;
              if (st) {
                const n = (launchCount.get(st) ?? 0) + 1;
                // Iteration mode: once DONE.md exists, the founder is driving edits
                // through the follow-up router — the strict mid-run ceilings would
                // deny legitimate build/gate/create cycles. Generous cap takes over.
                const iterating = Boolean(cfg.donePath && fs.existsSync(cfg.donePath));
                const cap = iterating ? ITERATION_LAUNCH_CAP : (LAUNCH_CAPS[st] ?? DEFAULT_LAUNCH_CAP);
                if (n > cap) {
                  return deny(
                    `Stage "${st}" has already been launched ${cap} time(s) — that is its retry ceiling. Do NOT launch it again; read its deliverable and proceed or stop.`,
                  );
                }
                launchCount.set(st, n);
              }
              return cont();
            }

            // 2b) binary WebFetch ban — image/CDN URLs never enter a context as
            // bytes, from ANY seat. Denied before the budget check so a blocked
            // call does not eat a gathering slot.
            if (tool === 'WebFetch' && isBinaryFetchUrl(String(input?.tool_input?.url ?? ''))) {
              return deny(
                'WebFetch on an image/CDN URL is banned — binary content must never enter your context. ' +
                'Ad creatives are downloaded to raw/images/ via the scrapecreators download_creatives tool; ' +
                'work from the files on disk (and only pixel-reading seats view them).',
              );
            }

            // 3) gathering budget. Do NOT gate on agent_id: in 0.3.195 a subagent's
            // tool calls can reach the hook with agent_id/agent_type ABSENT (the
            // async-task path) — gating on agent_id was why the cap silently never
            // fired. Cap whenever a gathering tool is seen (the orchestrator doesn't
            // gather), key by whatever identity we have, and rely on defaultCap when
            // agent_type is absent.
            if (isGatheringTool(tool)) {
              if (!identityLogged) {
                identityLogged = true;
                cfg.onEvent?.(`(hook saw gathering: tool=${tool} agent_id=${agentId ?? 'null'} agent_type=${agentType ?? 'null'})`);
              }
              const cap = cfg.caps[agentType ?? ''] ?? cfg.defaultCap ?? Infinity;
              const key = agentId ?? agentType ?? 'shared';
              const used = (gatherCount.get(key) ?? 0) + 1;
              gatherCount.set(key, used);
              if (used > cap) {
                return deny(
                  `Gathering budget spent (${cap} calls). Stop gathering now — synthesize from what you already have and WRITE your deliverable. (Read and Write are still allowed.)`,
                );
              }
            }

            return cont();
          },
        ],
      },
    ],
    // PostToolUse carries two code-side reactions:
    //  · spec assembly — a Write/Edit landing in creatives/c<N>.json re-merges the
    //    spec files into creatives.json (the model never writes the big file);
    //  · the run-complete signal — DONE.md only ever gets written at true completion
    //    (the PreToolUse guard above refuses premature writes), so a PostToolUse on
    //    that Write is the one place that fires on every entry point — headless,
    //    chat, and web all share these hooks via buildBaseOptions.
    ...(cfg.onDone || cfg.specs
      ? {
          PostToolUse: [
            {
              hooks: [
                async (input: any) => {
                  const tool: string = input?.tool_name ?? '';
                  const file = input?.tool_input?.file_path;
                  if (cfg.specs && (tool === 'Write' || tool === 'Edit') && typeof file === 'string' && /(^|\/)creatives\/c\d+\.json$/.test(file)) {
                    try { assembleSpecs(); } catch (err) {
                      cfg.onEvent?.(`spec assembly failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
                    }
                  }
                  if (cfg.onDone && tool === 'Write' && typeof file === 'string' && /(^|\/)DONE\.md$/.test(file) && !doneFired) {
                    doneFired = true;
                    try { cfg.onDone(); } catch (err) {
                      cfg.onEvent?.(`onDone failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
                    }
                  }
                  return { continue: true as const };
                },
              ],
            },
          ],
        }
      : {}),
  };
}
