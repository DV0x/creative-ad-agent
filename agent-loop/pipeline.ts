/**
 * The orchestrator — one Haiku query() whose systemPrompt is the routing brain.
 * It delegates to the four binder-subagents in order, files-as-handoff, and
 * never produces itself (no Write, no MCP; the hook hard-blocks orchestrator MCP).
 *
 * MCP grant model (verified in Phase 0): every mcp__ tool name goes in BOTH the
 * subagent's `tools` (capability) AND the top-level `allowedTools` (approval).
 * Binders load via the `plugins` option + each subagent's `skills`. Hermetic:
 * settingSources [] + strictMcpConfig true.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options, AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as fs from 'node:fs';
import { perplexityMcpServer, PERPLEXITY_TOOL_NAME } from './mcp/perplexity.ts';
import { scrapecreatorsMcpServer, SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL } from './mcp/scrapecreators.ts';
import { createNanoBananaServer } from './mcp/nano-banana.ts';
import { createRefsServer } from './mcp/refs.ts';
import { STAGES, NANO_BANANA_TOOL, REFS_TOOL, MODE_CAPS, modeHint, GATHER_STAGES, CRITIC_MODEL, CRITIC_IO_PROMPT, RENDER_CRITIC_MODEL, RENDER_CRITIC_IO_PROMPT, type Stage, type Mode } from './stages.ts';
import { buildHooks } from './hook.ts';
import type { TraceLogger } from './trace.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_PATH = join(__dirname, 'plugin', 'creative-binders');

// Every MCP tool name — goes in top-level allowedTools (the only approval list).
const ALL_MCP_TOOLS = [
  PERPLEXITY_TOOL_NAME,
  SCRAPECREATORS_FIND_PAGES_TOOL,
  SCRAPECREATORS_ADS_TOOL,
  NANO_BANANA_TOOL,
  REFS_TOOL,
];

function agentDef(stage: Stage, mode: Mode): AgentDefinition {
  // Gather stages (research/comp) get the depth nudge appended; others run as-is.
  const prompt = GATHER_STAGES.has(stage.name) ? stage.identityPrompt + '\n' + modeHint(mode) : stage.identityPrompt;
  return {
    description: stage.description,
    prompt,
    model: stage.model,
    tools: stage.tools,
    mcpServers: stage.mcpServers,
    skills: [stage.skill ?? stage.name], // preload the binder (both cell stages use the 'cell' skill)
    maxTurns: stage.maxTurns,
  };
}

function orchestratorPrompt(brandUrl: string, runDir: string, order: string[], interactive = false): string {
  // The linear produce stages come from `order`. The two critics are NOT in `order` —
  // this orchestrator launches them (depth-1) between the cell stages, with the retry
  // loops below. cell-generate carries the take-critic loop; cell-render the render one.
  const lines: string[] = [];
  for (const n of order) {
    const s = STAGES[n];
    if (n === 'cell-generate') {
      lines.push('  • cell-generate — subagent_type "cell-generate" → writes takes.md.');
      lines.push('      then the TAKE-CRITIC — subagent_type "critic" → writes verdict.md (it judges the takes cold).');
      lines.push('      Read verdict.md and branch:');
      lines.push('        · names a WINNER  → proceed to cell-render.');
      lines.push('        · "REJECT ALL"    → re-run cell-generate (it reads verdict.md and re-mines NEW takes),');
      lines.push('          then re-run the take-critic. AT MOST 3 rounds total. If the 3rd batch is STILL reject-all,');
      lines.push('          STOP: the problem is upstream (the room/strategy). Write a short flag to cell-output.md');
      lines.push('          ("could not clear the take-critic in 3 rounds — room/strategy needs revisiting: <reasons>")');
      lines.push('          and END. Do not render.');
    } else if (n === 'cell-render') {
      lines.push('  • cell-render — subagent_type "cell-render" → writes shotspec.md, the image, and cell-output.md.');
      lines.push('      then the RENDER-CRITIC — subagent_type "render-critic" → writes render-verdict.md (judges the pixels).');
      lines.push('      Read render-verdict.md and branch:');
      lines.push('        · "PASS" → done.');
      lines.push('        · "FAIL" with ONLY "re-render" diffs → re-run cell-render ONCE (it reads render-verdict.md and');
      lines.push('          fixes only those diffs), then re-run the render-critic.');
      lines.push('        · any "structural" diff, OR still FAIL after that 1 retry → STOP; the note stays in');
      lines.push('          cell-output.md. Do NOT render again — every render costs money.');
    } else {
      lines.push(`  • ${n} — subagent_type "${n}" → writes ${s.deliverable}  (reads: ${s.reads.join(', ')}).`);
    }
  }
  return [
    'You orchestrate an ad-creative pipeline. You do NOT do the creative work yourself and you do NOT call MCP',
    'tools. You delegate to specialist subagents via the Agent tool — ONE at a time — and stages hand off through',
    'files in the working directory.',
    '',
    `Working directory: ${runDir} (every artifact lives here). The brand brief is in founder-facts.md; the brand`,
    `URL is ${brandUrl}.`,
    '',
    'HOW SUBAGENTS RETURN — READ THIS (it is how you avoid deadlocking): when you launch an Agent it runs in the',
    'background and you get "Async agent launched…". You WILL be notified when it finishes. WAIT for that',
    'notification, then confirm its deliverable file exists (Read or Glob) BEFORE the next step. NEVER give up',
    'waiting, never poll-then-quit, and never launch the next step until the current file is on disk. Exactly ONE',
    'Agent in flight at a time.',
    '',
    ...(interactive
      ? [
          'BEFORE the pipeline — FOUNDER INTAKE (you are in a live chat with the founder):',
          `  0. Ground yourself: WebFetch ${brandUrl} (and an obvious page or two) so your questions are informed.`,
          '  1. Then ASK the founder what you need, using the AskUserQuestion tool: the conversion goal (sales /',
          '     leads / bookings / signups), who the buyer is, the rough monthly ad budget, and what they have',
          '     already tried or what is not working. Keep it to 3–4 crisp questions, each with sensible options.',
          '  2. Write their answers + what you learned from the site into founder-facts.md, replacing the stub — be',
          '     concrete; this is the brief every downstream stage reads. Only THEN begin the flow below.',
          '',
        ]
      : []),
    'Run this flow, in order:',
    ...lines,
    '',
    'For each subagent give a SHORT instruction: which working-directory files to read and which deliverable to',
    'write. It already knows its full method (binder preloaded / rubric inlined) — do NOT re-explain the method,',
    "and NEVER pass a cell's reasoning or preferred take to a critic; the critics judge cold.",
    '',
    'Your FINAL action, once the flow is complete (the render-critic returned PASS) OR you have flagged upstream:',
    'write a one-line file DONE.md recording the outcome ("shipped: <image path>" or "flagged: <reason>"). That',
    'file is the signal the run is over — write it ONLY at true completion, never before the render-critic passes.',
    'Then briefly summarize the deliverables + the rendered image path and STOP. Never produce creative work',
    'yourself; never call MCP tools.',
    ...(interactive
      ? [
          '',
          'FOLLOW-UPS (the chat continues after DONE.md): the founder may ask for changes. If the request is CLEAR',
          '("make the headline bigger"), act — re-run ONLY the stage(s) needed and re-verify. If it is VAGUE ("make',
          'it pop more"), call AskUserQuestion to pin down exactly what they mean BEFORE delegating. Never guess at',
          'a vague ask.',
        ]
      : []),
  ].join('\n');
}

// Assemble the subagent registry: the ordered produce-stages + the two independent
// critics (orchestrator-launched, depth-1). Shared by the headless runner and the
// interactive chat session so both drive the exact same agents.
export function buildAgents(order: string[], mode: Mode): Record<string, AgentDefinition> {
  const agents: Record<string, AgentDefinition> = {};
  for (const n of order) agents[n] = agentDef(STAGES[n], mode);

  const criticRubric = fs.readFileSync(join(PLUGIN_PATH, 'skills', 'cell', 'references', 'critic.md'), 'utf8');
  agents['critic'] = {
    description:
      "Independent creative critic — judges the cell's takes with a fresh context that never saw the writer's " +
      'reasoning. The ORCHESTRATOR invokes it after cell-generate; it writes verdict.md and returns a winner or REJECT ALL.',
    prompt: CRITIC_IO_PROMPT + '\n\n' + criticRubric,
    model: CRITIC_MODEL,
    tools: ['Read', 'Write'],
    mcpServers: [],
    maxTurns: 8,
  };

  const renderCriticRubric = fs.readFileSync(join(PLUGIN_PATH, 'skills', 'cell', 'references', 'render-critic.md'), 'utf8');
  agents['render-critic'] = {
    description:
      "Independent render-critic — judges the cell's RENDERED IMAGE with a fresh context that never saw the " +
      'writer\'s reasoning. The ORCHESTRATOR invokes it after cell-render; it views the pixels against shotspec.md, ' +
      'writes render-verdict.md, and returns PASS or FAIL with named diffs.',
    prompt: RENDER_CRITIC_IO_PROMPT + '\n\n' + renderCriticRubric,
    model: RENDER_CRITIC_MODEL,
    tools: ['Read', 'Write', 'Glob'],
    mcpServers: [],
    maxTurns: 8,
  };

  return agents;
}

export interface BaseOptionsArgs {
  brandUrl: string;
  runDir: string;
  order: string[];
  mode: Mode;
  onProgress?: (line: string) => void;
  /** Extra tool names to add to the top-level approval list (e.g. 'AskUserQuestion' for the chat). */
  extraAllowedTools?: string[];
  /** Interactive permission callback (the chat uses it to render AskUserQuestion in the UI). */
  canUseTool?: Options['canUseTool'];
  /** Chat mode: adds founder intake (AskUserQuestion) + clarify-on-vague-followup to the orchestrator prompt. */
  interactive?: boolean;
}

// The single source of truth for the orchestrator's SDK Options — everything EXCEPT the
// input `prompt` (the headless single-yield vs the chat's held-open queue differ). Both
// entry points build on this, so they run identical agents, MCP grants, hooks, and guards.
export function buildBaseOptions({ brandUrl, runDir, order, mode, onProgress, extraAllowedTools = [], canUseTool, interactive = false }: BaseOptionsArgs): Options {
  const imagesDir = join(runDir, 'images');
  const options: Options = {
    cwd: runDir, // subagents inherit this → files-as-handoff through one shared dir
    model: 'claude-sonnet-4-6', // the orchestrator — reasons about conditional retries + async coordination, so Sonnet not Haiku
    systemPrompt: orchestratorPrompt(brandUrl, runDir, order, interactive),
    settingSources: [],
    strictMcpConfig: true,
    plugins: [{ type: 'local', path: PLUGIN_PATH }],
    mcpServers: {
      perplexity: perplexityMcpServer,
      scrapecreators: scrapecreatorsMcpServer,
      'nano-banana': createNanoBananaServer(imagesDir),
      refs: createRefsServer(runDir),
    },
    // Orchestrator gets Agent + read-only inspection; subagents' built-ins + all MCP names live here too
    // (top-level is the only approval list). extraAllowedTools lets the chat add 'AskUserQuestion'.
    allowedTools: ['Agent', 'Task', 'Read', 'Glob', 'Grep', 'Write', 'WebFetch', ...ALL_MCP_TOOLS, ...extraAllowedTools],
    agents: buildAgents(order, mode),
    hooks: buildHooks({
      caps: { research: MODE_CAPS[mode], comp: MODE_CAPS[mode] }, // surface/deep gathering cap
      defaultCap: MODE_CAPS[mode], // applies even if agent_type isn't populated (the async-task path)
      onEvent: (msg) => onProgress?.(msg),
    }),
    maxTurns: 100, // orchestrator turns are cheap; async-task re-invocations add segments
    maxBudgetUsd: mode === 'deep' ? 28 : 20, // global safety-net; the per-agent gathering cap is the real control
  };
  if (canUseTool) options.canUseTool = canUseTool;
  return options;
}

export interface PipelineArgs {
  brandUrl: string;
  runDir: string;
  order: string[];
  mode: Mode;
  logger: TraceLogger;
  onProgress?: (line: string) => void;
}

export async function runPipeline({ brandUrl, runDir, order, mode, logger, onProgress }: PipelineArgs): Promise<void> {
  const options = buildBaseOptions({ brandUrl, runDir, order, mode, onProgress });

  // STREAMING INPUT MODE (not a plain string prompt). We yield the initial user
  // message from an async generator and HOLD IT OPEN (await `done`) until the run
  // finishes. This keeps stdin open so the in-process MCP bridge stays alive
  // (single-message mode let it close → "Stream closed") AND enables hooks
  // (single-message mode does not support hook integration — streaming_input.md:74,77,235).
  const done = new AbortController();
  async function* promptStream(): AsyncGenerator<any> {
    yield {
      type: 'user',
      message: { role: 'user', content: `Begin the pipeline for ${brandUrl}. Run the stages in order.` },
      parent_tool_use_id: null,
    };
    if (!done.signal.aborted) {
      await new Promise<void>((resolve) => done.signal.addEventListener('abort', () => resolve(), { once: true }));
    }
  }

  // Close the input stream ONLY when the ORCHESTRATOR signals true completion — it
  // writes DONE.md as its final action (after the render-critic PASSES or it flags
  // upstream). Keying on a stage deliverable (cell-output.md) closed too EARLY:
  // cell-render writes cell-output.md BEFORE the render-critic + any re-render retry,
  // so the retry got cut off mid-flight (observed in the 2026-07-01 validation run).
  // DONE.md exists only at true end. A wall-clock hard-stop guards a run that never
  // produces it.
  const finalDeliverable = join(runDir, 'DONE.md');
  const hardStop = setTimeout(() => done.abort(), 45 * 60 * 1000);
  try {
    for await (const m of query({ prompt: promptStream(), options })) {
      logger.record(m);
      if (onProgress) emitProgress(m, onProgress);
      if ((m as any).type === 'result' && fs.existsSync(finalDeliverable)) {
        onProgress?.('✓ final deliverable present — closing input stream');
        done.abort();
      }
    }
  } finally {
    clearTimeout(hardStop);
    done.abort();
  }
}

export function emitProgress(m: any, onProgress: (s: string) => void): void {
  if (m?.type === 'system' && m?.subtype === 'init') {
    onProgress(`· session init (apiKeySource=${m.apiKeySource}, mcp=${(m.mcp_servers ?? []).map((s: any) => s.name).join(',')})`);
  }
  if (m?.type === 'assistant') {
    for (const b of m.message?.content ?? []) {
      if (b.type === 'tool_use') {
        if (b.name === 'Agent' || b.name === 'Task') onProgress(`▶ launching subagent: ${b.input?.subagent_type ?? '?'}`);
        else if (b.name.startsWith('mcp__')) onProgress(`   · mcp call: ${b.name}`);
        else onProgress(`   · ${b.name}`);
      }
    }
  }
  if (m?.type === 'result') onProgress(`■ result segment: ${m.subtype} (turns=${m.num_turns}, cost=$${(m.total_cost_usd ?? 0).toFixed(4)})`);
}
