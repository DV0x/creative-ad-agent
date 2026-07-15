/**
 * The orchestrator — one query() whose systemPrompt is the routing brain.
 * It delegates to the binder-subagents in order, files-as-handoff, and never
 * produces itself (no Write except DONE.md, no MCP; the hook hard-blocks
 * orchestrator MCP).
 *
 * FIELD-FIRST FLOW (2026-07-09): field-scout → field-read FAN-OUT (the one
 * place agents run in PARALLEL — several readers in one message, each on its
 * own slice; the S137 deadlock was NESTED spawns, depth-1 concurrency is
 * supported) → field-brief → collect → create ⇄ buy → build ⇄ gate.
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
import { createScrapecreatorsServer, SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL, SCRAPECREATORS_FORMAT_HUNT_TOOL } from './mcp/scrapecreators.ts';
import { createRenderServer, RENDER_TOOL } from './mcp/render.ts';
import {
  STAGES, MODE_CAPS, modeHint, GATHER_STAGES,
  FIELD_READ_MODEL, FIELD_READ_IO_PROMPT,
  FIELD_BRIEF_MODEL, FIELD_BRIEF_IO_PROMPT,
  BUY_MODEL, BUY_IO_PROMPT,
  GATE_MODEL, GATE_IO_PROMPT,
  type Stage, type Mode,
} from './stages.ts';
import { buildHooks } from './hook.ts';
import type { TraceLogger } from './trace.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_PATH = join(__dirname, 'plugin', 'creative-binders');

// Every MCP tool name — goes in top-level allowedTools (the only approval list).
const ALL_MCP_TOOLS = [
  PERPLEXITY_TOOL_NAME,
  SCRAPECREATORS_FIND_PAGES_TOOL,
  SCRAPECREATORS_ADS_TOOL,
  SCRAPECREATORS_FORMAT_HUNT_TOOL,
  RENDER_TOOL,
];

function agentDef(stage: Stage, mode: Mode): AgentDefinition {
  // Gather stages (field-scout/collect) get the depth nudge appended; others run as-is.
  const prompt = GATHER_STAGES.has(stage.name) ? stage.identityPrompt + '\n' + modeHint(mode) : stage.identityPrompt;
  return {
    description: stage.description,
    prompt,
    model: stage.model,
    tools: stage.tools,
    mcpServers: stage.mcpServers,
    skills: [stage.skill ?? stage.name], // preload the binder
    maxTurns: stage.maxTurns,
  };
}

function orchestratorPrompt(brandUrl: string, runDir: string, order: string[], interactive = false): string {
  // The linear produce stages come from `order`. The intermediate seats
  // (field-read fan-out, field-brief, buy, gate) are NOT in `order` — this
  // orchestrator launches them between stages, with the loops below.
  const lines: string[] = [];
  for (const n of order) {
    const s = STAGES[n];
    if (n === 'field-scout') {
      lines.push('  • field-scout — subagent_type "field-scout" → writes field/shortlist.md (the set, the shortlist,');
      lines.push('      the READER SLICES, do-not-clone marks).');
      lines.push('      then the PIXEL READERS — Read field/shortlist.md yourself and find its "Reader slices" section.');
      lines.push('      Launch ONE subagent_type "field-read" PER SLICE — ALL IN ONE MESSAGE (this is the single place');
      lines.push('      you parallelize; the readers are independent). Each launch instruction names (a) that slice\'s');
      lines.push('      image file paths and (b) its own output file: field/reads/slice-<N>.jsonl. WAIT for ALL readers');
      lines.push('      to finish, then verify every slice file exists (Glob field/reads/*.jsonl) before proceeding.');
      lines.push('      then the FIELD-BRIEF seat — subagent_type "field-brief" → writes field/field-brief.md');
      lines.push('      (it synthesizes shortlist + all reads + the raw dumps). Verify it exists before the next stage.');
    } else if (n === 'create') {
      lines.push('  • create — subagent_type "create" → writes creatives.md + creatives.json (3–5 brand specs).');
      lines.push('      then the BUYER — subagent_type "buy" → writes verdict.md (it judges the specs cold against');
      lines.push('      material, the field brief, and the source reads; it never sees the creative\'s reasoning).');
      lines.push('      Read verdict.md and branch:');
      lines.push('        · "FINAL: WINNERS — …" → the approved specs proceed to build.');
      lines.push('        · "FINAL: REJECT ALL"  → re-run create (it reads verdict.md and writes a NEW batch that answers');
      lines.push('          the autopsy), then re-run the buyer. AT MOST 2 rounds total. If the 2nd batch is STILL');
      lines.push('          reject-all, STOP: the problem is upstream (field or material). Write the flag to DONE.md');
      lines.push('          ("flagged: buyer rejected two batches — <the buyer\'s instruction>") and END.');
    } else if (n === 'build') {
      lines.push('  • build — subagent_type "build" → compiles the approved specs, renders via the render tool, writes');
      lines.push('      prompts.md + build-output.md (image paths inside).');
      lines.push('      then the GATE — subagent_type "gate" → writes gate-verdict.md (five checks per image, viewing');
      lines.push('      the actual pixels against creatives.json and the source reads).');
      lines.push('      Read gate-verdict.md\'s FINAL line and branch:');
      lines.push('        · "FINAL: PASS — …" → those creatives ship. Done.');
      lines.push('        · "FINAL: RE-RENDER — …" → re-run build ONCE (it reads gate-verdict.md and fixes ONLY the');
      lines.push('          named re-render diffs), then re-run the gate. AT MOST 1 retry — every render costs money.');
      lines.push('        · "FINAL: FLAG — …" (structural), OR still failing after the retry → STOP. Write the flag to');
      lines.push('          DONE.md ("flagged: gate — <the structural reason>") and END. Do NOT render again.');
      lines.push('        · A mixed FINAL line (some PASS, some RE-RENDER) → the passes ship as-is; run the single');
      lines.push('          build retry scoped to the re-render creatives only, then the gate once more.');
    } else {
      lines.push(`  • ${n} — subagent_type "${n}" → writes ${s.deliverable}  (reads: ${s.reads.join(', ')}).`);
    }
  }
  return [
    'You orchestrate an ad-creative pipeline. You do NOT do the creative work yourself and you do NOT call MCP',
    'tools. You delegate to specialist subagents via the Agent tool and stages hand off through files in the',
    'working directory.',
    '',
    `Working directory: ${runDir} (every artifact lives here). The brand brief is in founder-facts.md; the brand`,
    `URL is ${brandUrl}.`,
    '',
    'THIS RUN\'S WORK IS NOT DONE UNTIL YOU RUN IT. The working directory may contain files from earlier runs or',
    'archived rounds (e.g. an r1/ folder, *.degraded.md). Those are history, never this run\'s deliverables. Run',
    'EVERY stage in the flow below via the Agent tool this session — never conclude from pre-existing files that a',
    'stage is already complete.',
    '',
    'HOW SUBAGENTS RETURN — READ THIS (it is how you avoid deadlocking): when you launch an Agent it runs in the',
    'background and you get "Async agent launched…". You WILL be notified when it finishes. WAIT for that',
    'notification, then confirm its deliverable file exists (Read or Glob) BEFORE the next step. NEVER give up',
    'waiting, never poll-then-quit, and never launch the next step until the current file is on disk.',
    '',
    'CONCURRENCY RULE: exactly ONE Agent in flight at a time — with ONE exception: the field-read fan-out, where',
    'you launch ALL the pixel readers in a single message (they are independent, each on its own slice and its own',
    'output file) and wait for every one of them before proceeding. Never parallelize anything else.',
    '',
    ...(interactive
      ? [
          'BEFORE the pipeline — FOUNDER INTAKE (you are in a live chat with the founder):',
          `  0. Ground yourself: WebFetch ${brandUrl} (and an obvious page or two) so your questions are informed,`,
          '     and extract any OFFER FACTS the pages state verbatim (prices, guarantees, dates).',
          '  1. Then ASK the founder what you need, using the AskUserQuestion tool: the conversion event (what a',
          '     "sale" is, and its price), the target CPA or acceptable cost, the budget/flight window, and who the',
          '     buyer is (market country included). Keep it to 3–4 crisp questions, each with sensible options.',
          '  2. Write their answers + what you learned from the site into founder-facts.md, replacing the stub — be',
          '     concrete; this is the brief every downstream stage reads. Only THEN begin the flow below.',
          '',
        ]
      : []),
    'Run this flow, in order:',
    ...lines,
    '',
    'For each subagent give a SHORT instruction: which working-directory files to read and which deliverable to',
    'write (for pixel readers: the slice\'s image paths + its output file). It already knows its full method',
    '(binder preloaded / rubric inlined) — do NOT re-explain the method, and NEVER pass a writer\'s reasoning or',
    'preferred pick to a judging seat (buy, gate); the judges work cold.',
    '',
    'Your FINAL action, once the flow is complete (the gate returned PASS for the shipped set) OR you have',
    'flagged upstream: write a one-line file DONE.md recording the outcome ("shipped: <image paths> — see',
    'gate-verdict.md", or "flagged: <reason>"). That file is the signal the run is over — write it ONLY at true',
    'completion. Then briefly summarize the deliverables and STOP. Never produce creative work yourself; never',
    'call MCP tools.',
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

// Assemble the subagent registry: the ordered produce-stages + the intermediate
// seats (pixel readers, field-brief, buyer, gate — orchestrator-launched,
// depth-1, reference docs inlined). Shared by the headless runner and the
// interactive chat session so both drive the exact same agents.
export function buildAgents(order: string[], mode: Mode): Record<string, AgentDefinition> {
  const agents: Record<string, AgentDefinition> = {};
  for (const n of order) agents[n] = agentDef(STAGES[n], mode);

  const skillRef = (skill: string, rel: string) => fs.readFileSync(join(PLUGIN_PATH, 'skills', skill, 'references', rel), 'utf8');

  agents['field-read'] = {
    description:
      'Pixel reader — reads ONE SLICE of shortlisted ad creatives (image files) and writes one unified-schema JSONL line per creative. The ORCHESTRATOR launches several in parallel after field-scout, each with its own slice and output file.',
    prompt: FIELD_READ_IO_PROMPT + '\n\n' + skillRef('field', 'read-schema.md'),
    model: FIELD_READ_MODEL,
    tools: ['Read', 'Write', 'Grep', 'Glob'],
    mcpServers: [],
    maxTurns: 30,
  };

  agents['field-brief'] = {
    description:
      'Field-brief seat — synthesizes the shortlist + all pixel reads + the raw dumps into field/field-brief.md (working/emerging constructions, hook bank, registers, open lanes, DO-NOT-CLONE). The ORCHESTRATOR launches it after all readers finish.',
    prompt: FIELD_BRIEF_IO_PROMPT + '\n\n' + skillRef('field', 'field-brief.md'),
    model: FIELD_BRIEF_MODEL,
    tools: ['Read', 'Write', 'Grep', 'Glob'],
    mcpServers: [],
    maxTurns: 15,
  };

  agents['buy'] = {
    description:
      "Media buyer — judges the creative's specs cold, with a fresh context that never saw the writer's reasoning. " +
      'The ORCHESTRATOR invokes it after create; it writes verdict.md and returns winners or REJECT ALL.',
    prompt: BUY_IO_PROMPT + '\n\n' + skillRef('create', 'buyer.md'),
    model: BUY_MODEL,
    tools: ['Read', 'Write', 'Grep', 'Glob'],
    mcpServers: [],
    maxTurns: 12,
  };

  agents['gate'] = {
    description:
      "The gate — judges the RENDERED IMAGES with a fresh context that never saw the compiler's reasoning. The " +
      'ORCHESTRATOR invokes it after build; it views every image against creatives.json and the source reads, ' +
      'writes gate-verdict.md, and returns PASS / RE-RENDER / FLAG.',
    prompt: GATE_IO_PROMPT + '\n\n' + skillRef('build', 'gate.md'),
    model: GATE_MODEL,
    tools: ['Read', 'Write', 'Glob', 'Grep'],
    mcpServers: [],
    maxTurns: 12,
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
  const options: Options = {
    cwd: runDir, // subagents inherit this → files-as-handoff through one shared dir
    model: 'claude-sonnet-4-6', // the orchestrator — reasons about conditional retries + async coordination, so Sonnet not Haiku
    systemPrompt: orchestratorPrompt(brandUrl, runDir, order, interactive),
    settingSources: [],
    strictMcpConfig: true,
    plugins: [{ type: 'local', path: PLUGIN_PATH }],
    mcpServers: {
      perplexity: perplexityMcpServer,
      // dumps full ads to raw/ads/ + downloads the top image creatives to raw/images/
      scrapecreators: createScrapecreatorsServer(join(runDir, 'raw', 'ads'), join(runDir, 'raw', 'images')),
      // provider-redundant GPT Image 2 (KIE primary, fal failover); brand refs resolve against runDir
      render: createRenderServer(join(runDir, 'renders'), runDir),
    },
    // Orchestrator gets Agent + read-only inspection; subagents' built-ins + all MCP names live here too
    // (top-level is the only approval list). extraAllowedTools lets the chat add 'AskUserQuestion'.
    allowedTools: ['Agent', 'Task', 'Read', 'Glob', 'Grep', 'Write', 'WebFetch', ...ALL_MCP_TOOLS, ...extraAllowedTools],
    agents: buildAgents(order, mode),
    hooks: buildHooks({
      caps: { 'field-scout': MODE_CAPS[mode], collect: MODE_CAPS[mode] }, // surface/deep gathering cap
      defaultCap: MODE_CAPS[mode], // applies even if agent_type isn't populated (the async-task path)
      // DONE.md refused until every ordered deliverable exists — plus the field brief (an
      // orchestrator-launched intermediate whose absence means the field phase was skipped).
      // A DONE.md that starts with "flagged:" bypasses this (a legitimate early end).
      doneRequires: [
        ...order.map((n) => join(runDir, STAGES[n].deliverable)),
        ...(order.includes('field-scout') ? [join(runDir, 'field', 'field-brief.md')] : []),
      ],
      onEvent: (msg) => onProgress?.(msg),
    }),
    maxTurns: 120, // orchestrator turns are cheap; the reader fan-out adds notification segments
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
  // A RESUMED run dir may hold DONE.md from its previous run. The completion check
  // below keys on that file existing at a result segment — stale, it closes the
  // input stream on the FIRST segment, which kills the in-process MCP bridge
  // ("Stream closed" on every MCP call) and hook integration. Clear it first.
  fs.rmSync(join(runDir, 'DONE.md'), { force: true });

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
  // writes DONE.md as its final action (after the gate PASSES or it flags upstream).
  // Keying on a stage deliverable closed too EARLY: build writes build-output.md
  // BEFORE the gate + any re-render retry, so the retry would get cut off mid-flight
  // (observed with cell-output.md in the 2026-07-01 validation run). DONE.md exists
  // only at true end. A wall-clock hard-stop guards a run that never produces it.
  const finalDeliverable = join(runDir, 'DONE.md');
  const hardStop = setTimeout(() => done.abort(), 60 * 60 * 1000); // field phase + renders: longer ceiling than the old 45min
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
