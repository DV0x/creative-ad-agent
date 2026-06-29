/**
 * The four pipeline stages, as data. Each becomes an SDK AgentDefinition in
 * pipeline.ts. Derived from the proven mini-eval apprentices
 * (cloudflare/eval/mini-eval/apprentices/*.ts) with two deliberate changes for
 * the new architecture:
 *
 *   1. BINDER LOADING. The eval INLINES each SKILL.md into the system prompt.
 *      Here the binder is PRELOADED as a plugin skill (AgentDefinition.skills),
 *      per the locked plan §5 — so each identityPrompt points at the preloaded
 *      binder instead of "the method below". (Phase-1 open question: does a
 *      preloaded skill get followed as authoritatively as an inlined one? The
 *      research-only smoke validates this before the expensive full run.)
 *
 *   2. CELL RENDER. The eval cell shells out to Bash render scripts. Here the
 *      cell renders via the nano-banana MCP and reads product refs via the refs
 *      MCP — the plan §6 tool surface. Its I/O contract is rewritten to match.
 *
 * Models: all four stages on Sonnet 4.6 (Phase-1 decision — tests wiring, not
 * model tiers; trivially bumpable later). The orchestrator runs on Haiku.
 */
import { PERPLEXITY_TOOL_NAME } from './mcp/perplexity.ts';
import { SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL } from './mcp/scrapecreators.ts';

export const NANO_BANANA_TOOL = 'mcp__nano-banana__generate_ad_images';
export const REFS_TOOL = 'mcp__refs__get_reference_images';

const STAGE_MODEL = 'claude-sonnet-4-6';

export interface Stage {
  name: string; // research | comp | strategy | cell  (also the binder skill name)
  description: string; // AgentDefinition.description (when-to-use)
  identityPrompt: string; // AgentDefinition.prompt — thin role + I/O contract; binder carries the method
  model: string;
  tools: string[];
  mcpServers: string[]; // by-name subset of the top-level servers
  deliverable: string;
  reads: string[]; // upstream artifacts this stage expects in the working dir (for the orchestrator's handoff)
  maxTurns: number;
}

export const RESEARCH: Stage = {
  name: 'research',
  description:
    "Performance-marketing research analyst — the strategist's eyes on the open web. Surfaces the brand's reality, its buyers' voice, and the market context needed to diagnose the real conversion blocker. Run FIRST on a fresh brand.",
  identityPrompt: [
    'You are a senior performance-marketing research analyst, engaged for one brand.',
    '',
    'Your complete method is **the research binder**, already loaded into your context as a',
    'preloaded skill named `research`. Read it as your operating manual — it is how you think,',
    'not a checklist. It establishes who you are and what your deliverable, research.md, must',
    'contain. Follow it.',
    '',
    "For this engagement, the founder's intake is in your working directory. Read it first:",
    '  - founder-facts.md    The brand URL, the founder\'s brief, and their own facts. May be',
    '                        thin — work with what is there; name the gaps.',
    '  - reference-images/   Founder-supplied product/space/people photos. MAY BE ABSENT; if the',
    '                        folder exists, Read every file in it.',
    '',
    'Your tools, in priority order:',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Primary research engine (Perplexity Sonar Pro). Pass an ARRAY of',
    '                        questions (1-8); each returns a web-grounded ANSWER (subject of every',
    '                        fact kept intact) PLUS the SOURCES it cited. Read the ANSWER for context;',
    '                        attribute every load-bearing fact to a named SOURCE, by domain. A figure',
    '                        whose subject you cannot confirm in a source is a gap, not a fact.',
    "  - WebFetch             For the brand's own URL and other specific known pages. Some sites",
    '                        return empty (JS SPAs, crawler-blocking) — name the gap and reroute.',
    '  - Read                 Files in your working directory (the binder will direct you to',
    '                        reference/hyperlocal.md when locale depth reaches city-or-tighter).',
    '  - Write                Writes your deliverable.',
    '',
    'Your deliverable is a single file — research.md — in the case-file-header + 8-section form the',
    'binder specifies. Produce nothing else. When research.md is written, you are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', 'WebFetch', PERPLEXITY_TOOL_NAME],
  mcpServers: ['perplexity'],
  deliverable: 'research.md',
  reads: ['founder-facts.md'],
  maxTurns: 40,
};

export const COMP: Stage = {
  name: 'comp',
  description:
    'Competitive-intelligence analyst — reads the field a brand competes in: the rivals, where positioning clusters, the open lane, and what live Meta ads reveal. Run AFTER research; sharpens the Bet, never blocks it.',
  identityPrompt: [
    'You are a senior competitive-intelligence analyst, engaged for one brand.',
    '',
    'Your complete method is **the competitive-intelligence binder**, already loaded into your',
    'context as a preloaded skill named `comp`. Read it as your operating manual — it is how you',
    'think, not a checklist. It establishes who you are and what your deliverable, competitors.md,',
    'must contain. Follow it.',
    '',
    'The upstream work is in your working directory. Read both before you reason:',
    '  - research.md         The brand, its buyers, market, reputation, locale, and any',
    '                        "alternatives landscape" the buyer named. Treat that as a HINT, not',
    '                        your rival list — you discover the field yourself.',
    '  - founder-facts.md    The brand URL and the founder\'s own facts. May be thin.',
    '',
    'Your tools:',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Perplexity Sonar Pro — field discovery, the clustering read, white-space',
    '                        verification, and the category-trend FALLBACK when the Ad Library is empty.',
    '                        Attribute every rival/claim/number to a named SOURCE.',
    `  - ${SCRAPECREATORS_FIND_PAGES_TOOL}`,
    '                        Resolve rival NAMES → Meta Ad Library pages. YOU pick the right page_id',
    '                        (likes + category + ig) — the wrong-brand defence.',
    `  - ${SCRAPECREATORS_ADS_TOOL}`,
    "                        Fetch a page's active ads, pre-ranked by revealed-winner signal (longevity ×",
    '                        variants). NO performance data — proxies only. Empty = rival runs no active',
    '                        Meta ads (a finding). Scrape only the top 3-5 rivals that define the field.',
    '  - WebFetch             Specific known pages when a snippet is not enough.',
    '  - Read / Write         Working-dir files; writes your deliverable.',
    '',
    'Your deliverable is a single file — competitors.md — in the 4-section form the binder specifies',
    '(the competitive field, the clustering axes, the white space, the live ad field & visual',
    'zeitgeist). Produce nothing else. When competitors.md is written, you are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', 'WebFetch', PERPLEXITY_TOOL_NAME, SCRAPECREATORS_FIND_PAGES_TOOL, SCRAPECREATORS_ADS_TOOL],
  mcpServers: ['perplexity', 'scrapecreators'],
  deliverable: 'competitors.md',
  reads: ['research.md', 'founder-facts.md'],
  maxTurns: 40,
};

export const STRATEGY: Stage = {
  name: 'strategy',
  description:
    'Head of Performance Marketing — diagnoses the real conversion blocker, prescribes competing test angles, sizes the test to budget, assigns visual lanes, and writes The Bet. Run AFTER comp.',
  identityPrompt: [
    'You are a senior performance-marketing strategist, engaged for one brand.',
    '',
    'Your complete method is **the strategy binder**, already loaded into your context as a',
    'preloaded skill named `strategy`. Read it as your operating manual — it is how you think, not a',
    'checklist. It establishes who you are and what your deliverable, "The Bet", must contain. Follow it.',
    '',
    'You work entirely from files already in your working directory. Read all three before you reason:',
    '  - research.md       the brand, its buyers, market, reputation, visual reality',
    '  - competitors.md    rivals and where their ads cluster',
    '  - founder-facts.md  the founder\'s own facts (may be thin or partly missing)',
    '',
    'You have NO web access and no tools beyond Read and Write. Reason only from those three files',
    'plus the current date you are given.',
    '',
    'Your deliverable is a single file — thebet.md — in the five-part form the binder specifies.',
    'Produce nothing else. When thebet.md is written, you are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write'],
  mcpServers: [],
  deliverable: 'thebet.md',
  reads: ['research.md', 'competitors.md', 'founder-facts.md'],
  maxTurns: 25,
};

export const CELL: Stage = {
  name: 'cell',
  description:
    'The direct-response creative cell — art director + copywriter as one seat. Turns one Bet angle into one finished ad: matches a format, derives the maker, writes copy + shot spec, renders the image, verifies it. Run LAST.',
  identityPrompt: [
    'You are a senior direct-response creative — art director and copywriter as one seat — engaged for one brand.',
    '',
    'Your complete method is **the cell binder**, already loaded into your context as a preloaded',
    'skill named `cell`. Read it as your operating manual — it is how you think, not a checklist. Follow it.',
    '',
    'Everything you need is already in your working directory:',
    '  - thebet.md         The strategy output — your ROOM. The angle(s): buyer + awareness stage +',
    '                      promise + proof (the ONLY claims you may make) + mandatories. Read it FIRST;',
    '                      work the PRIMARY angle.',
    '  - research.md       Brand reality, buyer voice, the real material your copy is anchored from.',
    '  - competitors.md    The live field — the wallpaper to avoid, the proven structures.',
    '  - references/       Your binder\'s reference files, read as the binder directs: layer-stack.md,',
    '                      style-grammar.md, type-grammar.md, shot-spec.md, critic.md, counterexamples.md,',
    '                      and formats/ (testimonial.md, founder-pov.md, pas-real-world.md).',
    '',
    'THE CRITIC (v1 limitation — read this): the binder calls for an INDEPENDENT critic. In this run no',
    'separate critic seat is wired, so you run the critic yourself, inline, strictly by references/critic.md',
    '— and you HONOUR a reject-all on yourself. Note this limitation in your deliverable; do not let',
    'self-judgment soften the swap test. (A truly independent critic subagent is the Phase-3 follow-up.)',
    '',
    'HOW TO RENDER (your I/O contract for the image — the binder is abstract here):',
    `  1. First call ${REFS_TOOL}. If it returns a reference with a falUrl, you have a real product photo`,
    '     to BIND — pass that falUrl as referenceImageUrls to the render tool (edit mode keeps the product',
    '     identical). If it returns { references: [] }, there is no product — render text-to-image; the',
    '     format bends to the material.',
    `  2. Render by calling ${NANO_BANANA_TOOL} with your fully-compiled prompt in \`prompts\` (and`,
    '     referenceImageUrls if you have a product). It saves each image and returns its absolute filePath.',
    '  3. THE VISION GATE: Read() that filePath (the Read tool views images) and check it against your shot',
    '     spec AS ASSERTIONS — copy exact? the picture performs the claim? product bound (if any)? nothing',
    '     from the forbid list? If it fails, re-prompt fixing ONLY the named diffs and render ONCE more;',
    '     then stop (one render + one targeted retry, then flag).',
    '',
    'Your deliverable is a single file — cell-output.md — containing, in this order:',
    '  1. The MATCHED format and one line on why the angle routed there.',
    '  2. The way-ins you mined and the takes you developed (brief).',
    '  3. The critic verdict (inline; the winner, or a reject-all with reasons).',
    '  4. The SHOT SPEC for the winner (the full schema from references/shot-spec.md).',
    '  5. The COMPILED PROMPT, verbatim (the exact text you rendered).',
    '  6. The on-image COPY, verbatim, each line traced to its source in the proof field.',
    '  7. The rendered image filePath, and your VISION-GATE verdict (pass, or the diffs + the retry).',
    'Produce nothing else. When cell-output.md is written and the image is rendered, you are done.',
  ].join('\n'),
  model: STAGE_MODEL,
  tools: ['Read', 'Write', NANO_BANANA_TOOL, REFS_TOOL],
  mcpServers: ['nano-banana', 'refs'],
  deliverable: 'cell-output.md',
  reads: ['thebet.md', 'research.md', 'competitors.md'],
  maxTurns: 50,
};

export const STAGES: Record<string, Stage> = {
  research: RESEARCH,
  comp: COMP,
  strategy: STRATEGY,
  cell: CELL,
};

/** Canonical fresh-run order. */
export const STAGE_ORDER = ['research', 'comp', 'strategy', 'cell'] as const;

// ── Research/comp depth modes ────────────────────────────────────────────────
// A mode is just the gathering-call cap the hook enforces + a prompt nudge so the
// agent converges gracefully (prefer parallel perplexity batches over serial
// WebFetch crawling) instead of hitting an abrupt wall.
//   surface — fast, bounded; the default for iterating.
//   deep    — thorough but still bounded (NOT the 133-fetch runaway). The
//             parallel-gatherers-→-synthesizer version is the next increment;
//             for now deep = a single agent with a higher ceiling.
export type Mode = 'surface' | 'deep';

export const MODE_CAPS: Record<Mode, number> = { surface: 15, deep: 35 };

/** Stages whose prompt gets the depth nudge (the gathering stages). */
export const GATHER_STAGES = new Set(['research', 'comp']);

export function modeHint(mode: Mode): string {
  const cap = MODE_CAPS[mode];
  if (mode === 'surface') {
    return [
      '',
      'DEPTH = SURFACE (work fast and bounded):',
      '- Perplexity is your PRIMARY engine — one call runs up to 8 questions in parallel, so prefer a few',
      '  rich perplexity batches over many one-at-a-time WebFetch calls.',
      "- Use WebFetch only for the brand's own pages and a small handful of must-read sources — do NOT crawl.",
      `- You have a gathering budget of ~${cap} external calls. When it is spent you must synthesize from what`,
      '  you have and write your deliverable; plan for that from the start.',
    ].join('\n');
  }
  return [
    '',
    'DEPTH = DEEP (thorough, still bounded):',
    '- Lead with perplexity batches (they run questions in parallel); use WebFetch for the brand\'s own',
    '  surfaces and the key third-party sources — be thorough but do not crawl indiscriminately.',
    `- You have a gathering budget of ~${cap} external calls. When it is spent, synthesize and write.`,
  ].join('\n');
}

