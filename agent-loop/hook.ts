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

const isGatheringTool = (name: string): boolean =>
  name === 'WebFetch' || name.startsWith('mcp__perplexity') || name.startsWith('mcp__scrapecreators');

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
  create: 2, // one buyer-rejected redo
  buy: 2,
  build: 3, // initial + the gate's single re-render round (+1 headroom)
  gate: 3,
};
const DEFAULT_LAUNCH_CAP = 2;

export interface HookConfig {
  /** subagent_type -> max gathering calls (e.g. { collect: 15, market: 15 }). */
  caps: Record<string, number>;
  /** Cap for stages not in `caps` (create/buy don't gather). Default: no cap. */
  defaultCap?: number;
  /** Absolute paths that must ALL exist before DONE.md may be written. Stops the
   *  orchestrator declaring completion off stale/archived files (observed: it
   *  Globbed an archived r1/ round and wrote DONE.md without running any stage). */
  doneRequires?: string[];
  /** Progress sink for denials. */
  onEvent?: (msg: string) => void;
}

export function buildHooks(cfg: HookConfig): Options['hooks'] {
  const gatherCount = new Map<string, number>(); // agent key -> gathering calls so far
  const launchCount = new Map<string, number>(); // subagent_type -> launches so far (retry-aware ceiling)
  let identityLogged = false; // log the first gathering call's identity once (diagnostic)

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

            // 1) orchestrator must not call MCP directly
            if (tool.startsWith('mcp__') && fromOrchestrator) {
              return deny(`Orchestrator must not call MCP directly (${tool}); delegate to the appropriate subagent.`);
            }

            // 2) launch ceiling per stage — ALLOW the bounded retry loops (cell-generate/
            // critic re-mine up to 3 rounds; cell-render/render-critic 1 retry) but stop a
            // runaway (a stage fired far past its ceiling — the old async double-fire).
            if ((tool === 'Agent' || tool === 'Task') && fromOrchestrator) {
              const st: string | undefined = input?.tool_input?.subagent_type;
              if (st) {
                const n = (launchCount.get(st) ?? 0) + 1;
                const cap = LAUNCH_CAPS[st] ?? DEFAULT_LAUNCH_CAP;
                if (n > cap) {
                  return deny(
                    `Stage "${st}" has already been launched ${cap} time(s) — that is its retry ceiling. Do NOT launch it again; read its deliverable and proceed or stop.`,
                  );
                }
                launchCount.set(st, n);
              }
              return cont();
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
  };
}
