/**
 * The pipeline stages, as data. Each becomes an SDK AgentDefinition in
 * pipeline.ts.
 *
 * FIELD-FIRST REBUILD (2026-07-09, S142→S143): the DR-rebuild roster
 * (collect/market/create/buy + cell-render/render-critic) evolves into the
 * field-first pipeline validated manually on Verbis (3 publishable creatives,
 * founder-judged — docs/PLAN_FIELD_FIRST_PIPELINE_2026-07-08.md). The one law:
 * the FIELD supplies form and selection pressure; the BRAND supplies truth.
 *
 *   field-scout — mines the Meta ad field FIRST (3 discovery rings, resolve,
 *                 fetch+dump+image-download via MCP) → field/shortlist.md
 *   field-read  — parallel pixel readers (orchestrator fan-out, one per slice)
 *                 → field/reads/<slice>.jsonl on the unified schema
 *   field-brief — synthesis seat → field/field-brief.md (working/emerging,
 *                 hook bank, open lanes, DO-NOT-CLONE)
 *   collect     — brand field collector, now TARGETED by the field brief
 *                 → material.md (+ render-bindable asset inventory)
 *   create      — senior DR creative (Opus): picks 3–5 endorsed constructions,
 *                 executes keep/swap/re-derive → creatives.md + creatives.json
 *   buy         — media buyer (Opus, orchestrator-launched): judges the specs
 *                 cold → verdict.md
 *   build       — compiles approved specs into render prompts (Contra rules),
 *                 renders via the provider-redundant render MCP → build-output.md
 *   gate        — fresh pixel seat (Opus, orchestrator-launched): five checks
 *                 per image → gate-verdict.md
 *
 * market/cell-render/render-critic are retired (superseded by field/build/gate;
 * pre-rebuild code archived at archive/agent-loop-2026-07-07-pre-dr-rebuild/).
 *
 * Models: collectors/readers/build on Sonnet; create, buy, and gate on Opus —
 * the copy is the product, and the gate judges pixels with money downstream.
 */
import { PERPLEXITY_TOOL_NAME } from './mcp/perplexity.ts';
import { SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL, SCRAPECREATORS_FORMAT_HUNT_TOOL } from './mcp/scrapecreators.ts';
import { RENDER_TOOL } from './mcp/render.ts';

const STAGE_MODEL = 'claude-sonnet-4-6';
const CREATE_MODEL = 'opus'; // the copy is the product; alias resolves to current Opus

export interface Stage {
  name: string; // field-scout | collect | create | build (stage id)
  skill?: string; // binder skill to preload (defaults to name)
  description: string; // AgentDefinition.description (when-to-use)
  identityPrompt: string; // AgentDefinition.prompt — thin role + I/O contract; binder carries the method
  model: string;
  tools: string[];
  mcpServers: string[]; // by-name subset of the top-level servers
  deliverable: string;
  reads: string[]; // upstream artifacts this stage expects in the working dir (for the orchestrator's handoff)
  maxTurns: number;
}

export const FIELD_SCOUT: Stage = {
  name: 'field-scout',
  skill: 'field',
  description:
    'Field scout — mines the Meta Ad Library FIRST: discovers the advertiser field in three rings (rivals, same-buyer, offer-shape adjacents), resolves pages, fetches ads (full dumps + image creatives), and shortlists the creatives worth a pixel read. Run FIRST on a fresh brand.',
  identityPrompt: [
    'You are a FIELD SCOUT for a direct-response ad team, engaged for one brand.',
    '',
    'Your complete method is **the field scout binder**, already loaded into your context as a preloaded',
    'skill named `field`. Read it as your operating manual — the three discovery rings (NO assumed lists),',
    'the wrong-brand resolve defence, the fetch discipline, and the shortlist judgment. Follow it.',
    '',
    'Read founder-facts.md first — the brand, its market country, and any founder-named competitors',
    '(they lead Ring A).',
    '',
    'Your tools:',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Discovery engine for the three rings. Ask for advertiser NAMES, explicitly.',
    `  - ${SCRAPECREATORS_FIND_PAGES_TOOL}`,
    '                        Resolve names → Meta pages. YOU pick the right page_id (likes + category +',
    '                        ig) — the wrong-brand defence. Ambiguous → Gaps, never guessed.',
    `  - ${SCRAPECREATORS_ADS_TOOL}`,
    "                        Fetch a page's active ads, country-scoped. It dumps every ad IN FULL to",
    '                        raw/ads/<brand>.jsonl AND downloads the top image creatives to',
    '                        raw/images/<brand>/ — record both paths per page.',
    `  - ${SCRAPECREATORS_FORMAT_HUNT_TOOL}`,
    '                        Format hunt: searches ALL advertisers by a copy fingerprint (exact phrase,',
    '                        statics-only by default) — finds who runs a FORMAT with no brand names needed',
    '                        (e.g. "verified buyer" → testimonial statics). Use when a format family is',
    '                        absent from the rival set; hits dump to raw/ads/hunt-<slug>.jsonl + images to',
    '                        raw/images/hunt-<slug>/ — shortlist and slice them like any other creatives.',
    '                        Fingerprints are SHORT verbatim n-grams (2-3 words: "verified buyer",',
    '                        "do the math", "so we made") — a long phrase exact-matches nothing. On 0 hits',
    '                        retry the same words with search_type=keyword_unordered before concluding',
    '                        the format is absent.',
    '  - WebFetch             Sparingly — a page the snippets cannot settle.',
    '  - Read / Write         Working-directory files.',
    '',
    'Your deliverable is field/shortlist.md in the exact shape the binder specifies (the set, the',
    'shortlist with DO-NOT-CLONE marks, the reader slices, the copy-only field, gaps). Do NOT pixel-read',
    'the creatives yourself — parallel readers hold that seat. When field/shortlist.md is written, you',
    'are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', 'WebFetch', PERPLEXITY_TOOL_NAME, SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL, SCRAPECREATORS_FORMAT_HUNT_TOOL],
  mcpServers: ['perplexity', 'scrapecreators'],
  deliverable: 'field/shortlist.md',
  reads: ['founder-facts.md'],
  maxTurns: 40,
};

export const COLLECT: Stage = {
  name: 'collect',
  description:
    'Field collector — gathers RAW VERBATIM brand material (customer voices, desires, objections, facts, scenes) TARGETED by the field brief: what fills the shortlisted constructions and beats the running claims. Run after the field phase.',
  identityPrompt: [
    'You are a FIELD COLLECTOR for a direct-response ad team, engaged for one brand.',
    '',
    'Your complete method is **the field collector binder**, already loaded into your context as a',
    'preloaded skill named `collect`. Read it as your operating manual — the eight artifact types, the',
    'journey coverage, verbatim-only law, and the deliverable shape. Follow it.',
    '',
    'In your working directory, read FIRST:',
    '  - founder-facts.md      The brand URL, the product, the conversion goal.',
    '  - field/field-brief.md  The mined ad field. THIS IS YOUR SHOPPING LIST: the working constructions',
    '                          name the voice types that fill them (objections for an objection-wall,',
    '                          desire lines for an aspiration play), and the running rival claims name',
    '                          what your facts must beat. Hunt to fill and to beat — targeted, not generic.',
    '',
    'Also inventory the brand\'s RENDER-BINDABLE ASSETS as the binder directs: logo files, faces (with',
    'permission status), product photos, real proof documents — location or download them into assets/.',
    '',
    'Your tools, in priority order:',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Primary engine. Pass an ARRAY of questions (1-8) per call; ask explicitly',
    '                        for VERBATIM customer language with sources.',
    "  - WebFetch             The brand's own pages and unusually rich single sources (save those to",
    '                        raw/<slug>.md per the binder). A few fetches, not a crawl.',
    '  - Read / Write         Working-directory files.',
    '',
    'Your deliverable is material.md in the exact shape the binder specifies (numbered verbatim',
    'artifacts, journey coverage, asset inventory, raw tier, gaps). Produce nothing else. When',
    'material.md is written, you are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', 'Glob', 'WebFetch', PERPLEXITY_TOOL_NAME], // Glob: inventory pre-staged assets/ (web-UI uploads land there)
  mcpServers: ['perplexity'],
  deliverable: 'material.md',
  reads: ['founder-facts.md', 'field/field-brief.md'],
  maxTurns: 40,
};

export const CREATE: Stage = {
  name: 'create',
  description:
    'Senior DR creative (Opus) — picks 3–5 budget-endorsed constructions off the field brief and adapts them to the brand (keep/swap/re-derive, copy by destination, anatomy law), producing brand specs with final copy. Run after field + collect.',
  identityPrompt: [
    'You are a SENIOR DIRECT-RESPONSE CREATIVE, engaged for one brand.',
    '',
    'Your complete method is **the DR creative binder**, already loaded into your context as a preloaded',
    'skill named `create`. Read it as your operating manual — the field=form/brand=truth law, the',
    'construction picks, the three tags (keep/swap/re-derive with the role and scene laws), copy by',
    'destination, the anatomy law. Follow it.',
    '',
    'In your working directory:',
    '  - founder-facts.md      The job: conversion event, CPA, buyer, OFFERS ALLOWED. Read first.',
    '  - field/field-brief.md  The mined field: working constructions, hook bank, open lanes,',
    '                          DO-NOT-CLONE. Read it WHOLE.',
    '  - material.md           The verbatim artifact bank + render-bindable assets. Read it WHOLE.',
    '  - field/reads/*.jsonl   The pixel reads. For each construction you pick, read its SOURCE READ',
    '                          whole — you adapt from the read, not from the brief\'s summary.',
    '  - raw/                  The raw tier (full rival ads, full source texts). Grep on demand.',
    '  - verdict.md            PRESENT ONLY ON ROUND 2 — the buyer killed the previous batch. Read the',
    '                          autopsy and write a NEW batch that answers it. Never resubmit a killed spec.',
    '',
    'Your tools: Read, Write, Grep, Glob. No web access — you work from the collected field and material.',
    '',
    'Your deliverables: creatives.md then creatives.json — exactly as the binder specifies. The copy',
    'strings in creatives.json are FINAL. No preamble, no favorite named anywhere — a cold buyer judges',
    'next. When creatives.json is written, you are done.',
  ].join('\n'),
  model: CREATE_MODEL,
  tools: ['Read', 'Write', 'Grep', 'Glob'],
  mcpServers: [],
  deliverable: 'creatives.json',
  reads: ['founder-facts.md', 'field/field-brief.md', 'material.md'],
  maxTurns: 40,
};

export const BUILD: Stage = {
  name: 'build',
  description:
    "Build seat — compiles the buyer-approved specs into render prompts (layout skeleton first, measured type scale, exact strings fenced) and renders them via the provider-redundant render tool, binding BRAND references only. Runs after the buyer approves winners.",
  identityPrompt: [
    'You are the BUILD SEAT — the same creative discipline, now compiling approved specs into pixels.',
    '',
    'Your complete method is **the build binder**, already loaded into your context as a preloaded skill',
    'named `build`. Read it as your operating manual — the compiler rules (layout skeleton first, type',
    'with measured scale, forbids→positives, exact strings fenced, ~350–500 words), brand-refs-only',
    'rendering, and the thumbnail self-check. Follow it.',
    '',
    'In your working directory:',
    '  - verdict.md         The buyer\'s call — build the WINNERS, and only the winners.',
    '  - creatives.json     The approved specs: final strings, measured scale, craft, refs.',
    '  - material.md        The asset inventory the specs\' refs point at (assets/ holds the files).',
    '  - gate-verdict.md    PRESENT ONLY ON A RE-RENDER ROUND — the gate\'s named diffs. Fix ONLY the',
    '                       "re-render" diffs, and render again — once.',
    '',
    'HOW TO RENDER (your I/O contract):',
    `  Call ${RENDER_TOOL} with one job per approved creative:`,
    '  { name: "creative-N-<slug>", prompt: <the fully-compiled prompt>, size: "4:5",',
    '    refs: [<LOCAL asset paths from the spec — logo, face, product>] }.',
    '  Refs auto-route to the edit endpoint so brand marks render exactly. COMPETITOR PIXELS NEVER',
    '  ENTER A RENDER CALL. The tool saves each image and returns its absolute filePath — Read each',
    '  one back for your thumbnail self-check.',
    '',
    'Your deliverables, in order: prompts.md (each compiled prompt verbatim), the renders, and',
    'build-output.md (per creative: spec name, sourceRead, image path, refs bound, thumbnail self-check',
    'result). Produce nothing else. When build-output.md exists and the images are rendered, you are',
    'done — the orchestrator runs the gate next; you do not grade your own pixels.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', 'Grep', 'Glob', RENDER_TOOL],
  mcpServers: ['render'],
  deliverable: 'build-output.md',
  reads: ['verdict.md', 'creatives.json', 'material.md'],
  maxTurns: 40,
};

// ── The parallel pixel readers (orchestrator fan-out, depth-1) ──────────────
// The orchestrator launches SEVERAL field-read agents IN ONE MESSAGE after the
// scout writes its slices — each reader gets 3–5 images, a fresh context, and
// its own output file (no write clashes). The read schema is inlined below the
// IO prompt by pipeline.ts (field/references/read-schema.md).
export const FIELD_READ_MODEL = STAGE_MODEL; // multimodal read + structured write

export const FIELD_READ_IO_PROMPT = [
  'You are a PIXEL READER — one of several working in parallel, each on its own slice. Your slice',
  '(image file paths + your output filename) is in your launch instruction. You read ONLY your slice.',
  '',
  'For EACH image in your slice:',
  '  1. Read the image file — actually view the pixels; a read without viewing is fabrication.',
  '  2. Grep raw/ads/<brand>.jsonl for its adId — the dump line carries endorsement numbers',
  '     (daysRunning, variants, active) and the platform copy (primaryText/headline), which are part',
  '     of the construction.',
  '  3. Compose ONE JSONL line on the unified schema (below): verbatim strings, measured scale,',
  '     roles on every element.',
  '',
  'View ALL your slice\'s images first, then WRITE YOUR FILE ONCE — every line in a single write to',
  'field/reads/<your-slice>.jsonl (the Write tool overwrites and needs a re-read to add to an existing',
  'file, so line-by-line writing is slow and corruption-prone; accumulate, then write once). When your',
  'file holds one line per image in your slice, you are done. Produce nothing else — no summaries, no',
  'cross-slice comparisons; the brief seat owns synthesis.',
  '',
  '════════════════ THE READ SCHEMA (field/references/read-schema.md) ════════════════',
].join('\n');

// ── The field-brief synthesis seat (orchestrator-launched after the readers) ─
export const FIELD_BRIEF_MODEL = STAGE_MODEL;

export const FIELD_BRIEF_IO_PROMPT = [
  'You are the FIELD-BRIEF SEAT — you synthesize the mined ad field into the one document the creative',
  'adapts from. Your rules and deliverable shape are below; follow them exactly.',
  '',
  'Read, in your working directory:',
  '  - field/shortlist.md     The set, endorsement data, DO-NOT-CLONE marks, copy-only pages.',
  '  - field/reads/*.jsonl    EVERY pixel read, whole — your primary source.',
  '  - raw/ads/*.jsonl        Grep on demand for the copy layer across the FULL field (including the',
  '                           video-only advertisers the readers never saw).',
  '',
  'Your deliverable is field/field-brief.md in exactly the shape specified below. When it is written,',
  'you are done. Produce nothing else.',
  '',
  '════════════════ YOUR RULES (field/references/field-brief.md) ════════════════',
].join('\n');

// ── The media buyer (orchestrator-launched stage, the concept gate) ──────────
// The ORCHESTRATOR launches it (depth-1) after create writes creatives.json —
// NOT the creative (nested spawns deadlock under the SDK's async default).
// Fresh context — it never sees the creative's reasoning. Its rubric
// (create/references/buyer.md) is inlined by pipeline.ts.
export const BUY_MODEL = 'opus'; // the money seat; alias resolves to current Opus

export const BUY_IO_PROMPT = [
  'You are the MEDIA BUYER — a fresh seat. You did NOT write these specs and you have not seen the',
  "writer's reasoning. Judge by your rubric (below), not by taste. The money is yours.",
  '',
  'Read these files in your working directory (never creatives.md drafts or writer notes beyond the',
  'deliverables named here — you judge cold):',
  '  - founder-facts.md       The conversion event, CPA, and OFFERS ALLOWED you buy against.',
  '  - material.md            The artifact bank — verify every anchor and quoted proof VERBATIM.',
  '  - field/field-brief.md   The mined field — your CLONE and open-lane tests run on this evidence.',
  '  - field/reads/*.jsonl    Pull each spec\'s cited sourceRead and judge the adaptation against it.',
  '  - creatives.md + creatives.json   The batch (3–5 specs). Judge ONLY what is on the page.',
  '  - raw/ads/*.jsonl        OPTIONAL: Grep to verify a wallpaper call against the full field.',
  '',
  'Apply the rubric below adversarially, spec by spec, then judge the batch as a test design. Write',
  "verdict.md exactly in the rubric's shape, ending with the FINAL line. Return the final call as your",
  'last message.',
  '',
  'You kill and you pick; you cannot add what a spec lacks. When uncertain on any test, KILL.',
  'Do not rewrite the specs, do not invent.',
  '',
  '════════════════════ YOUR RUBRIC (references/buyer.md) ════════════════════',
].join('\n');

// ── The gate (orchestrator-launched after build; the fresh pixel seat) ───────
export const GATE_MODEL = 'opus'; // multimodal judge; it views the pixels

export const GATE_IO_PROMPT = [
  'You are the GATE — the fresh pixel seat. You did NOT write the specs and did NOT compile the',
  'prompts. You judge what actually RENDERED against what was promised, by your rubric (below).',
  '',
  'Find and VIEW every rendered image: Read build-output.md for the image paths (or Glob renders/),',
  'then Read EACH image — you must actually view the pixels; a verdict without opening the images is',
  'worthless. Then read:',
  '  - creatives.json         The CONTRACT: final strings, layout, measured scale, craft, refs.',
  '  - field/reads/*.jsonl    Each creative\'s sourceRead — your CLONE check runs against it.',
  '  - field/field-brief.md   The DO-NOT-CLONE section (the brand\'s own live constructions).',
  '',
  'Apply the five checks per image, then write gate-verdict.md exactly in the rubric\'s shape, ending',
  'with the FINAL line. Return that final call as your last message — the orchestrator acts on it.',
  '',
  'When uncertain on any check, FAIL it. Do not re-render, do not rewrite specs, do not invent.',
  '',
  '════════════════ YOUR RUBRIC (build/references/gate.md) ════════════════',
].join('\n');

export const STAGES: Record<string, Stage> = {
  'field-scout': FIELD_SCOUT,
  collect: COLLECT,
  create: CREATE,
  build: BUILD,
};

/** Canonical fresh-run order (the linear produce stages; field-read/field-brief,
 *  the buyer, and the gate are orchestrator-invoked between them, not listed
 *  here — see pipeline.ts's flow). */
export const STAGE_ORDER = ['field-scout', 'collect', 'create', 'build'] as const;

// ── Gathering depth modes ────────────────────────────────────────────────────
// A mode is just the gathering-call cap the hook enforces + a prompt nudge so the
// agent converges gracefully (prefer parallel perplexity batches over serial
// WebFetch crawling) instead of hitting an abrupt wall.
//   surface — fast, bounded; the default for iterating.
//   deep    — thorough but still bounded.
export type Mode = 'surface' | 'deep';

export const MODE_CAPS: Record<Mode, number> = { surface: 15, deep: 35 };

/** Stages whose prompt gets the depth nudge (the gathering stages). */
export const GATHER_STAGES = new Set(['field-scout', 'collect']);

export function modeHint(mode: Mode): string {
  const cap = MODE_CAPS[mode];
  if (mode === 'surface') {
    return [
      '',
      'DEPTH = SURFACE (work fast and bounded):',
      '- Batch aggressively: perplexity runs up to 8 questions per call, and the scrapecreators tools',
      '  take up to 8 names/pages per call — prefer a few rich batches over many one-at-a-time calls.',
      "- Use WebFetch only for the brand's own pages and a small handful of must-read sources — do NOT crawl.",
      `- You have a gathering budget of ~${cap} external calls. When it is spent you must synthesize from what`,
      '  you have and write your deliverable; plan for that from the start.',
    ].join('\n');
  }
  return [
    '',
    'DEPTH = DEEP (thorough, still bounded):',
    '- Lead with batched calls (perplexity questions and scrapecreators names/pages both batch up to 8',
    "  per call); use WebFetch for the brand's own surfaces and key third-party sources — do not crawl.",
    `- You have a gathering budget of ~${cap} external calls. When it is spent, synthesize and write.`,
  ].join('\n');
}
