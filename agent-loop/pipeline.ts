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
import { createScrapecreatorsServer, SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL, SCRAPECREATORS_FORMAT_HUNT_TOOL, SCRAPECREATORS_DOWNLOAD_TOOL } from './mcp/scrapecreators.ts';
import { createRenderServer, RENDER_TOOL } from './mcp/render.ts';
import { createBrandIdentityServer, BRAND_IDENTITY_TOOL, PRODUCT_PHOTOS_TOOL, PAGE_TEXT_TOOL } from './mcp/brand-identity.ts';
import {
  STAGES, MODE_CAPS, modeHint, GATHER_STAGES,
  FIELD_READ_MODEL, FIELD_READ_IO_PROMPT,
  FIELD_BRIEF_MODEL, FIELD_BRIEF_IO_PROMPT,
  BUY_MODEL, BUY_IO_PROMPT,
  GATE_MODEL, GATE_IO_PROMPT,
  KIT_MODEL, KIT_IO_PROMPT,
  type Stage, type Mode,
} from './stages.ts';
import { buildHooks } from './hook.ts';
import { ensureBankAccess, appendRunReadsToBank } from './bank.ts';
import type { TraceLogger } from './trace.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_PATH = join(__dirname, 'plugin', 'creative-binders');

// Every MCP tool name — goes in top-level allowedTools (the only approval list).
const ALL_MCP_TOOLS = [
  PERPLEXITY_TOOL_NAME,
  SCRAPECREATORS_FIND_PAGES_TOOL,
  SCRAPECREATORS_ADS_TOOL,
  SCRAPECREATORS_FORMAT_HUNT_TOOL,
  SCRAPECREATORS_DOWNLOAD_TOOL,
  BRAND_IDENTITY_TOOL,
  PRODUCT_PHOTOS_TOOL,
  PAGE_TEXT_TOOL,
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

function orchestratorPrompt(
  brandUrl: string,
  runDir: string,
  order: string[],
  interactive = false,
  renderTop = 3,
  ratios: string[] = ['4:5'],
): string {
  // The linear produce stages come from `order`. The intermediate seats
  // (field-read fan-out, field-brief, buy, gate, kit) are NOT in `order` — this
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
      lines.push('  • create — subagent_type "create" → writes creatives.md + ONE SPEC FILE PER CONCEPT');
      lines.push('      (creatives/c1.json … c8.json). The harness assembles them into creatives.json automatically —');
      lines.push('      neither you nor create ever writes creatives.json. Verify it exists and parses (Read it)');
      lines.push('      before launching the buyer.');
      lines.push('      then the BUYER — subagent_type "buy" → writes verdict.md (it judges the specs cold against');
      lines.push('      material, the field brief, and the source reads; it never sees the creative\'s reasoning; it');
      lines.push('      approves the genuine survivors RANKED, target 6–8).');
      lines.push('      Read verdict.md WHOLE — the FINAL line AND whether it contains a "BACKFILL:" section — then branch:');
      lines.push('        · WINNERS with NO BACKFILL section → the approved specs proceed to build.');
      lines.push('        · WINNERS with a BACKFILL section → the buyer killed spec(s) and ORDERED replacements; obey it');
      lines.push('          WHATEVER the survivor count (six survivors still get their two replacements — the order, not');
      lines.push('          a count threshold, is the trigger). ONE BACKFILL ROUND: re-run create telling it "BACKFILL');
      lines.push('          round — read verdict.md; the survivors stand untouched; write ONLY the replacement specs, as');
      lines.push('          NEW files continuing the numbering (creatives/c9.json, c10.json, …)". Then re-run the buyer');
      lines.push('          telling it "BACKFILL round — autopsy only the new specs, re-run the batch tests on the full');
      lines.push('          set, write a fresh complete verdict.md". Whatever the fresh verdict approves proceeds to');
      lines.push('          build — even if a replacement dies too (honest gaps ship; padded slots do not). AT MOST 1');
      lines.push('          backfill round, never a second: if the fresh verdict orders ANOTHER backfill, ignore that');
      lines.push('          order and build its approved set.');
      lines.push('        · "FINAL: REJECT ALL"  → re-run create (FULL REDO: it reads verdict.md and writes a NEW batch');
      lines.push('          that answers the autopsy), then re-run the buyer. AT MOST 2 full rounds total. If the 2nd');
      lines.push('          batch is STILL reject-all, STOP: the problem is upstream (field or material). Write the');
      lines.push('          flag to DONE.md ("flagged: buyer rejected two batches — <the buyer\'s instruction>") and END.');
    } else if (n === 'build') {
      lines.push(`  • build — subagent_type "build". THINK WIDE, RENDER NARROW: instruct it to render ONLY the TOP ${renderTop}`);
      lines.push(`      creatives by the buyer's ranking (verdict.md FINAL line order), at ratio(s) ${ratios.join(', ')} — name them`);
      lines.push('      explicitly in the launch instruction. Every other approved spec stays STORED in creatives.json (the');
      lines.push('      founder can ask to render more later — a cheap build+gate pass, no upstream re-run). It writes');
      lines.push('      prompts.md + build-output.md (image paths inside).');
      lines.push('      then the GATE — subagent_type "gate" → writes gate-verdict.md (eight checks per image + the batch');
      lines.push('      diversity line, viewing the actual pixels against creatives.json and the source reads).');
      lines.push('      Read gate-verdict.md\'s FINAL line and branch:');
      lines.push('        · "FINAL: PASS — …" → those creatives ship. Proceed to the kit.');
      lines.push('        · "FINAL: RE-RENDER — …" → re-run build ONCE (it reads gate-verdict.md and fixes ONLY the');
      lines.push('          named re-render diffs), then re-run the gate. AT MOST 1 retry — every render costs money.');
      lines.push('        · "FINAL: FLAG — …" (structural on EVERYTHING), OR still failing after the retry → STOP. Write');
      lines.push('          the flag to DONE.md ("flagged: gate — <the structural reason>") and END. Do NOT render again.');
      lines.push('        · A mixed FINAL line (some PASS, some RE-RENDER) → the passes ship as-is; run the single');
      lines.push('          build retry scoped to the re-render creatives only, then the gate once more.');
      lines.push('      then the LAUNCH KIT — once ANY creative ships, subagent_type "kit" → writes launch-kit.md');
      lines.push('      (shipped images by ratio, the copy pool, the naming map, the campaign sheet, and the test map');
      lines.push('      covering every approved concept — rendered or stored). Verify it exists before DONE.md.');
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
          '  0. Ground yourself: Read raw/pages/intake-ground.txt — the brand page is PRE-FETCHED there',
          `     (capped for intake; collect captures pages in full later). WebFetch ${brandUrl} pages beyond it`,
          '     ONLY if a question needs them. If the file is missing AND WebFetch is bot-blocked (403/406),',
          '     NEVER substitute prior knowledge of the brand — say the site is unreachable and lean on the',
          "     founder questions; collect's page_text tool works where WebFetch is blocked. Extract any",
          '     OFFER FACTS the pages state verbatim (prices, guarantees, dates).',
          '  1. ASK ROUND ONE (AskUserQuestion, up to 4 crisp questions with sensible options): the conversion',
          '     event (what a "sale" is, and its price), the target CPA or acceptable cost, the budget/flight',
          '     window, and who the buyer is (market country included).',
          '  2. ASK ROUND TWO (AskUserQuestion, up to 4 more): the COMPLIANCE LANE (e-commerce / lead-gen /',
          '     financial-SAC / health-wellness); the BRAND LAWS ("what will this brand NEVER do — discounts?',
          '     urgency? comparisons? — and what real fuel does it hold: certs, deadlines, price advantages?");',
          '     AD HISTORY ("what have you tested before; what won, what lost"); and ASSETS ("upload the hero',
          '     product photo + logo via the panel now" — with an explicit "no photo available" option).',
          '  3. ASK ROUND THREE (AskUserQuestion, TWO questions):',
          '     · the REGISTER — "how should these ads SPEAK?" Options: "Mass-loud (Register A)" (punchy,',
          '       meme-friendly, colloquial/local-language mix), "Premium-clinical (Register B)" (clean,',
          '       English, evidence-led), "Mix — test both" (the batch splits deliberately), "Follow the',
          '       field" (whatever the mined evidence says wins). The batch\'s register is a FOUNDER',
          '       DECISION, never silent drift.',
          '     · the BRAND KIT — "brand colours + fonts?" Options: "Extract from my site (Recommended)"',
          '       (collect\'s brand_identity tool reads the logo + site), "I\'ll type the hex codes" (record',
          '       them verbatim), "Uploading a brand kit to the panel", "No brand identity yet" (the batch',
          '       may define one — say so explicitly in the brief).',
          '  4. Check assets/ (Glob) for what actually landed. Write EVERYTHING into founder-facts.md, replacing',
          `     the stub. The FIRST line after the title MUST be \`Brand URL: ${brandUrl}\` — copied VERBATIM`,
          '     (query params included): the gate\'s LP check and collect fetch THIS exact string; dropping or',
          '     paraphrasing it forces downstream slug-guessing. Then the explicit sections: THE JOB (conversion',
          '     event, CPA, budget, buyer, market),',
          '     COMPLIANCE LANE, BRAND LAWS (held fuel + forbidden moves — the motor law reads this), REGISTER',
          '     (the founder\'s A / B / mix / follow-the-field call — create obeys it), BRAND KIT (founder hexes',
          '     verbatim, or "extract from site" — collect\'s brand_identity runs either way and founder-given',
          '     hexes OUTRANK extraction), AD HISTORY,',
          '     OFFER FACTS (verbatim from the site), and ASSETS (each file in assets/ + what is MISSING; if no',
          '     hero photo: write "NO HERO PHOTO — steer to pack-free constructions or model-knowledge renders").',
          '     Be concrete; this is the brief every downstream stage reads. Only THEN begin the flow below.',
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
    'Your FINAL action, once the flow is complete (creatives shipped AND launch-kit.md written) OR you have',
    'flagged upstream: write a one-line file DONE.md recording the outcome ("shipped: <image paths> — see',
    'launch-kit.md + gate-verdict.md", or "flagged: <reason>"). That file is the signal the run is over — write',
    'it ONLY at true completion. Then briefly summarize the deliverables and STOP. Never produce creative work',
    'yourself; never call MCP tools.',
    ...(interactive
      ? [
          '',
          'FOLLOW-UPS — THE ROUTER (the chat continues after DONE.md). A follow-up NEVER re-runs the whole',
          'pipeline: the field/collect work is done and paid for; you route each ask to the SMALLEST seat that',
          'owns the change, with a SCOPED instruction naming exactly which creative(s) and field(s) to touch.',
          'The routes:',
          '  · QUESTION about the work ("why this hook?", "what did rival X run?") → answer it YOURSELF from the',
          '    files (Read/Grep). Launch NOTHING.',
          '  · COPY or SPEC change on an existing creative ("change the headline", "different background scene",',
          '    "drop the price line") → create, scoped: "edit ONLY creative N\'s <field> in creatives/cN.json +',
          '    creatives.md; touch nothing else" (on a run with no creatives/ spec files, edit creatives.json',
          '    directly) → then build scoped to creative N (its ratios) → then the gate',
          '    (it re-views everything shipped). The founder directed the change, so the BUYER IS SKIPPED.',
          '  · RENDER problem, spec unchanged ("the logo garbled", "text is cut off") → build scoped re-render',
          '    (fix the compiled prompt) → gate. No create.',
          '  · RENDER MORE ("render the other winners", "give me 9:16 and 1:1") → build scoped to the named',
          '    stored specs/ratios from creatives.json → gate. Nothing upstream.',
          '  · NEW concept/angle ("try something around X") → create (ADD the new spec(s); survivors untouched)',
          '    → buy judges the NEW spec(s) cold → build → gate. New bets always face the buyer.',
          '  · UPSTREAM truth changed (different audience, new product, new offer, "actually we can\'t discount")',
          '    → this re-spends real budget: confirm with AskUserQuestion FIRST (name which stages must re-run',
          '    and why), then run the needed chain (usually create ⇄ buy → build ⇄ gate; collect only if the',
          '    brand facts themselves changed). NEVER re-run field-scout/readers for a creative-level ask.',
          '  After ANY route that changed shipped work, re-run the kit seat so launch-kit.md reflects reality.',
          '  If the ask is VAGUE ("make it pop"), AskUserQuestion to pin it down BEFORE delegating. Never guess.',
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
    maxTurns: 20, // 8-spec portfolio: each spec pulls its sourceRead + anchors before the verdict
  };

  agents['gate'] = {
    description:
      "The gate — judges the RENDERED IMAGES with a fresh context that never saw the compiler's reasoning. The " +
      'ORCHESTRATOR invokes it after build; it views every image against creatives.json and the source reads, ' +
      'writes gate-verdict.md, and returns PASS / RE-RENDER / FLAG.',
    prompt: GATE_IO_PROMPT + '\n\n' + skillRef('build', 'gate.md'),
    model: GATE_MODEL,
    // WebFetch: the LP-congruence check (one fetch); page_text: fallback for
    // bot-blocked LPs (406s WebFetch but answers our plain fetch — S153).
    tools: ['Read', 'Write', 'Glob', 'Grep', 'WebFetch', PAGE_TEXT_TOOL],
    mcpServers: ['brand'],
    maxTurns: 12,
  };

  agents['kit'] = {
    description:
      'Launch-kit seat — mechanical assembly of launch-kit.md (shipped images by ratio, copy pool, naming map, ' +
      'campaign sheet, test map) from the run\'s own artifacts. The ORCHESTRATOR invokes it after the gate ' +
      'passes; re-invoked after any follow-up that changes shipped work.',
    prompt: KIT_IO_PROMPT,
    model: KIT_MODEL,
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
  /** Chat mode: adds founder intake (AskUserQuestion) + the follow-up router to the orchestrator prompt. */
  interactive?: boolean;
  /** Render economics (S145 Step 3.1, "think wide render narrow"): how many buyer-ranked
   *  winners get rendered on the main pass. Default 3; the rest stay stored in creatives.json. */
  renderTop?: number;
  /** Ratios rendered on the main pass. Default ['4:5']; more ratios are follow-up territory. */
  ratios?: string[];
  /** SDK session id to RESUME (session_management.md:194 — the docs' path for returning to a
   *  specific past conversation). The orchestrator wakes with its full JSONL history; the fresh
   *  systemPrompt/hooks/agents from this options object apply on top. cwd must equal the
   *  original run dir (it does — cwd is the runDir). */
  resumeSessionId?: string;
}

// The single source of truth for the orchestrator's SDK Options — everything EXCEPT the
// input `prompt` (the headless single-yield vs the chat's held-open queue differ). Both
// entry points build on this, so they run identical agents, MCP grants, hooks, and guards.
export function buildBaseOptions({ brandUrl, runDir, order, mode, onProgress, extraAllowedTools = [], canUseTool, interactive = false, renderTop = 3, ratios = ['4:5'], resumeSessionId }: BaseOptionsArgs): Options {
  // The cross-client format bank, exposed as runDir/bank so the brief/create/buy
  // seats can Grep bank/*.jsonl with their ordinary file tools (Step 2.6).
  ensureBankAccess(runDir);
  const options: Options = {
    cwd: runDir, // subagents inherit this → files-as-handoff through one shared dir
    model: 'claude-sonnet-4-6', // the orchestrator — reasons about conditional retries + async coordination, so Sonnet not Haiku
    systemPrompt: orchestratorPrompt(brandUrl, runDir, order, interactive, renderTop, ratios),
    settingSources: [],
    strictMcpConfig: true,
    plugins: [{ type: 'local', path: PLUGIN_PATH }],
    mcpServers: {
      perplexity: perplexityMcpServer,
      // dumps full ads to raw/ads/ + downloads the top image creatives to raw/images/
      scrapecreators: createScrapecreatorsServer(join(runDir, 'raw', 'ads'), join(runDir, 'raw', 'images')),
      // provider-redundant GPT Image 2 (KIE primary, fal failover); brand refs resolve against runDir
      render: createRenderServer(join(runDir, 'renders'), runDir),
      // deterministic brand extraction (logo → assets/, palette, fonts, verbatim voice)
      brand: createBrandIdentityServer(runDir),
    },
    // Orchestrator gets Agent + read-only inspection; subagents' built-ins + all MCP names live here too
    // (top-level is the only approval list). extraAllowedTools lets the chat add 'AskUserQuestion'.
    allowedTools: ['Agent', 'Task', 'Read', 'Glob', 'Grep', 'Write', 'WebFetch', ...ALL_MCP_TOOLS, ...extraAllowedTools],
    agents: buildAgents(order, mode),
    hooks: buildHooks({
      caps: { 'field-scout': MODE_CAPS[mode], collect: MODE_CAPS[mode] }, // surface/deep gathering cap
      defaultCap: MODE_CAPS[mode], // applies even if agent_type isn't populated (the async-task path)
      // create writes creatives/c<N>.json (one small file per spec); code merges
      // them into creatives.json on every landing — S151 fix #1.
      specs: { dir: join(runDir, 'creatives'), out: join(runDir, 'creatives.json') },
      // DONE.md refused until every ordered deliverable exists — plus the field brief (an
      // orchestrator-launched intermediate whose absence means the field phase was skipped).
      // A DONE.md that starts with "flagged:" bypasses this (a legitimate early end).
      doneRequires: [
        ...order.map((n) => join(runDir, STAGES[n].deliverable)),
        ...(order.includes('field-scout') ? [join(runDir, 'field', 'field-brief.md')] : []),
        // Ships must be launchable: the kit is part of "done" whenever build ran.
        ...(order.includes('build') ? [join(runDir, 'launch-kit.md')] : []),
      ],
      // Once DONE.md exists, launch ceilings relax — founder-driven iterations
      // (the follow-up router) must not be denied by the mid-run runaway guard.
      donePath: join(runDir, 'DONE.md'),
      // Run complete (DONE.md written) → this run's pixel reads join the bank.
      onDone: () => appendRunReadsToBank(runDir, (msg) => onProgress?.(msg)),
      onEvent: (msg) => onProgress?.(msg),
      // The intake rewrite must never drop the founder's exact URL (gate + collect fetch it verbatim).
      brandUrl,
    }),
    // JSONL session resume (the docs' recommended return-to-a-conversation path).
    ...(resumeSessionId ? { resume: resumeSessionId } : {}),
    maxTurns: 120, // orchestrator turns are cheap; the reader fan-out adds notification segments
    // Global safety-net; the per-agent gathering cap is the real control. Raised for the
    // 8-spec portfolio era (create/buy handle ~2x the specs; a backfill round may add a pass).
    maxBudgetUsd: mode === 'deep' ? 34 : 26,
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
  renderTop?: number;
  ratios?: string[];
}

export async function runPipeline({ brandUrl, runDir, order, mode, logger, onProgress, renderTop, ratios }: PipelineArgs): Promise<void> {
  // A RESUMED run dir may hold DONE.md from its previous run. The completion check
  // below keys on that file existing at a result segment — stale, it closes the
  // input stream on the FIRST segment, which kills the in-process MCP bridge
  // ("Stream closed" on every MCP call) and hook integration. Clear it first.
  fs.rmSync(join(runDir, 'DONE.md'), { force: true });

  const options = buildBaseOptions({ brandUrl, runDir, order, mode, onProgress, renderTop, ratios });

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
