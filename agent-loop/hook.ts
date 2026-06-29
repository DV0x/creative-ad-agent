/**
 * PreToolUse hook — the harness's rule layer. Three guards, all keyed on the
 * fields the SDK gives the hook (`agent_id` absent = orchestrator/main thread;
 * `agent_type` = the subagent's stage name):
 *
 *  1. ORCHESTRATOR-MCP GUARD — an mcp__ call with no agent_id is the orchestrator
 *     breaking role → deny. (The §6 hard guarantee the permission system can't give.)
 *
 *  2. NO-RELAUNCH GUARD — the orchestrator launching a stage that already ran once
 *     → deny. (Fixes the runaway: the orchestrator fired a 2nd research instance
 *     because subagents run as async tasks. One instance per stage.)
 *
 *  3. GATHERING BUDGET — per subagent, cap the expensive gathering tools
 *     (WebFetch + perplexity + scrapecreators). Past the cap, deny *gathering*
 *     (Read/Write/Glob always allowed) with "synthesize and write now". This
 *     replaces AgentDefinition.maxTurns, which is NOT enforced in 0.3.195
 *     (research did 77 calls against a cap of 40). The cap value is the
 *     surface/deep mode knob.
 */
import type { Options } from '@anthropic-ai/claude-agent-sdk';

const isGatheringTool = (name: string): boolean =>
  name === 'WebFetch' || name.startsWith('mcp__perplexity') || name.startsWith('mcp__scrapecreators');

export interface HookConfig {
  /** subagent_type -> max gathering calls (e.g. { research: 15, comp: 15 }). */
  caps: Record<string, number>;
  /** Cap for stages not in `caps` (cell/strategy don't gather). Default: no cap. */
  defaultCap?: number;
  /** Progress sink for denials. */
  onEvent?: (msg: string) => void;
}

export function buildHooks(cfg: HookConfig): Options['hooks'] {
  const gatherCount = new Map<string, number>(); // agent key -> gathering calls so far
  const launched = new Set<string>(); // subagent_type already launched once
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

            // 1) orchestrator must not call MCP directly
            if (tool.startsWith('mcp__') && fromOrchestrator) {
              return deny(`Orchestrator must not call MCP directly (${tool}); delegate to the appropriate subagent.`);
            }

            // 2) no re-launching a stage that already ran
            if ((tool === 'Agent' || tool === 'Task') && fromOrchestrator) {
              const st: string | undefined = input?.tool_input?.subagent_type;
              if (st && launched.has(st)) {
                return deny(
                  `Stage "${st}" already ran once — do NOT re-launch it. Read its deliverable file; if it is missing, that stage failed — proceed to the next stage or stop, but never relaunch.`,
                );
              }
              if (st) launched.add(st);
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
