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
import { STAGES, NANO_BANANA_TOOL, REFS_TOOL, MODE_CAPS, modeHint, GATHER_STAGES, type Stage, type Mode } from './stages.ts';
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
    skills: [stage.name], // preload the binder from the plugin
    maxTurns: stage.maxTurns,
  };
}

function orchestratorPrompt(brandUrl: string, runDir: string, order: string[]): string {
  const seq = order
    .map((n, i) => {
      const s = STAGES[n];
      return `  ${i + 1}. subagent_type "${n}" → writes ${s.deliverable}  (reads: ${s.reads.join(', ')})`;
    })
    .join('\n');
  return [
    'You orchestrate an ad-creative pipeline. You do NOT do the creative work yourself and you do NOT',
    'call MCP tools. You delegate to specialist subagents via the Agent tool — ONE at a time, IN ORDER —',
    'and the stages hand off through files in the working directory.',
    '',
    `Working directory: ${runDir} (every artifact lives here). The brand brief is in founder-facts.md;`,
    `the brand URL is ${brandUrl}.`,
    '',
    'Run these stages IN THIS EXACT ORDER, one Agent call per stage. After each Agent call returns,',
    "confirm the stage's deliverable file exists (use Read or Glob) BEFORE launching the next:",
    seq,
    '',
    'For each stage, invoke the matching subagent (subagent_type) with a SHORT instruction: name the brand',
    'URL, say which working-directory files to read, and which deliverable to write. The subagent already',
    'knows its full method (its binder is preloaded) — do NOT re-explain the method to it.',
    '',
    'When the final deliverable exists, briefly summarize what was produced (the deliverable files + the',
    'rendered image path) and STOP. Never produce creative work yourself.',
  ].join('\n');
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
  const imagesDir = join(runDir, 'images');
  const agents: Record<string, AgentDefinition> = {};
  for (const n of order) agents[n] = agentDef(STAGES[n], mode);

  const options: Options = {
    cwd: runDir, // subagents inherit this → files-as-handoff through one shared dir
    model: 'claude-haiku-4-5-20251001', // the orchestrator
    systemPrompt: orchestratorPrompt(brandUrl, runDir, order),
    settingSources: [],
    strictMcpConfig: true,
    plugins: [{ type: 'local', path: PLUGIN_PATH }],
    mcpServers: {
      perplexity: perplexityMcpServer,
      scrapecreators: scrapecreatorsMcpServer,
      'nano-banana': createNanoBananaServer(imagesDir),
      refs: createRefsServer(runDir),
    },
    // Orchestrator gets Agent + read-only inspection; subagents' built-ins + all MCP names live here
    // too (top-level is the only approval list). Orchestrator has no Write/MCP, and the hook hard-blocks
    // any orchestrator MCP call.
    allowedTools: ['Agent', 'Task', 'Read', 'Glob', 'Grep', 'Write', 'WebFetch', ...ALL_MCP_TOOLS],
    agents,
    hooks: buildHooks({
      caps: { research: MODE_CAPS[mode], comp: MODE_CAPS[mode] }, // surface/deep gathering cap
      defaultCap: MODE_CAPS[mode], // applies even if agent_type isn't populated (the async-task path)
      onEvent: (msg) => onProgress?.(msg),
    }),
    maxTurns: 100, // orchestrator turns are cheap; async-task re-invocations add segments
    maxBudgetUsd: mode === 'deep' ? 15 : 8, // global safety-net for the full 4-stage run; the per-agent gathering cap is the real control
  };

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

  // Close the input stream ONLY when the pipeline is truly finished — i.e. the
  // LAST stage's deliverable exists on disk. Closing on an intermediate async-task
  // `result` segment (the earlier bug) shuts stdin mid-run and defeats streaming
  // mode. A wall-clock hard-stop guards against a stage that never produces its file.
  const finalDeliverable = join(runDir, STAGES[order[order.length - 1]].deliverable);
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

function emitProgress(m: any, onProgress: (s: string) => void): void {
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
