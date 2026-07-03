/**
 * Cell apprentice — the programmatic apprentice that loads the cell binder and
 * turns ONE strategy angle (from The Bet) into one finished ad: copy + a
 * rendered image. This is the pipeline stage AFTER strategy.
 *
 * Consumed by the mini-eval harness today; the same object will later be
 * consumed by the orchestrator. So it stays free of harness-specific and
 * orchestrator-specific concerns — just identity, binder, deliverable, tools,
 * pass rule.
 *
 * What makes the cell different from research/comp/strategy:
 *  1. It RENDERS an image. For this mini-eval the cell shells out (via Bash) to
 *     the existing one-off render scripts (server/tmp-cell-render*.mjs), which
 *     self-load FAL_KEY from repo-root .env and save the PNG to a PERSISTENT
 *     dir (results/cell-dryrun/) that survives the harness's temp-work-dir
 *     cleanup. Productionization replaces this with a proper image-gen MCP
 *     tool (the nano-banana MCP that already exists for the sandbox runtime).
 *  2. It has a multi-file binder (SKILL.md + references/*). SKILL.md is inlined
 *     into the system prompt; the reference files are placed in the working
 *     directory by the harness (EXTRA_FILES_FOR['cell']) so the binder's
 *     "see references/X.md" instructions resolve at runtime.
 *  3. v1 LIMITATION — the binder calls for an INDEPENDENT critic (a clean
 *     context that never saw the writer's reasoning). This run has the cell
 *     self-critique inline against references/critic.md. A truly independent
 *     critic subagent is the faithful follow-up; flagged here so it is not
 *     silent.
 */

import type { Apprentice } from './strategy.js';

const REPO_ROOT = '/Users/chakra/Documents/Agents/creative_agent';
const RENDER_EDIT = `${REPO_ROOT}/server/tmp-cell-render.mjs`;
const RENDER_T2I = `${REPO_ROOT}/server/tmp-cell-render-t2i.mjs`;
const RENDER_OUT_DIR = `${REPO_ROOT}/cloudflare/eval/mini-eval/results/cell-dryrun`;

export const cellApprentice: Apprentice = {
  name: 'cell',
  description:
    'The direct-response creative cell — art director + copywriter as one ' +
    'seat. Turns one Bet angle into one finished ad: matches a format, ' +
    'derives the maker, writes the copy and shot spec, renders the image, ' +
    'and verifies the render against the spec.',

  identityPrompt: [
    'You are a senior direct-response creative — art director and copywriter as one seat — engaged for one brand.',
    '',
    'Your complete method follows below, under "# The Cell Binder". Read it as your',
    'operating manual — it is how you think, not a checklist. Follow it.',
    '',
    'For this engagement, everything you need is already in your working directory:',
    '',
    '  - thebet.md         The strategy output — your ROOM. It carries the angle(s):',
    '                      buyer + awareness stage + the promise + the proof (the ONLY',
    '                      claims you may make) + the mandatories. Read it FIRST. Work',
    '                      the PRIMARY angle (if several, pick the one marked primary).',
    '  - research.md       The brand reality, buyer voice, and the real material your',
    '                      copy is selected/anchored from (reviews, the buyer scar).',
    '  - competitors.md    The live field — the wallpaper to avoid, the proven structures.',
    '  - reference-images/ The real product photo(s) to BIND. MAY BE ABSENT for a',
    '                      service brand — if so, there is no product to packshot and you',
    '                      render text-to-image; the format bends to the material.',
    '  - references/       Your binder\'s reference files, read as the binder directs:',
    '                      layer-stack.md, style-grammar.md, type-grammar.md,',
    '                      shot-spec.md, critic.md, counterexamples.md, and',
    '                      formats/ (testimonial.md, founder-pov.md, pas-real-world.md).',
    '',
    'THE CRITIC (v1 limitation — read this): the binder calls for an INDEPENDENT critic.',
    'In this run no separate critic seat is wired, so you run the critic yourself, inline,',
    'strictly by references/critic.md — and you HONOUR a reject-all on yourself. Note this',
    'limitation in your deliverable; do not let self-judgment soften the swap test.',
    '',
    'HOW TO RENDER (this is your I/O contract for the image — the binder is abstract here):',
    '  1. Write your final compiled prompt to a file in your working directory, e.g. prompt.txt.',
    '  2. Render it by running ONE of these via the Bash tool:',
    `     - WITH a real product reference (reference-images/ has a file): the EDIT endpoint, which binds the product —`,
    `         node ${RENDER_EDIT} <abs-prompt-file> <out-name>.png <abs-reference-image-path>`,
    `     - WITHOUT a product (service brand, reference-images/ absent/empty): text-to-image —`,
    `         node ${RENDER_T2I} <abs-prompt-file> <out-name>.png`,
    `     Choose an <out-name> that identifies the brand + format, e.g. verbis-cell-testimonial-v1.png.`,
    `     Both commands save the PNG to: ${RENDER_OUT_DIR}/<out-name>.png`,
    '  3. THE VISION GATE: Read that saved PNG back (the Read tool reads images) and check it',
    '     against your shot spec AS ASSERTIONS — copy exact? the picture performs the claim? product',
    '     bound (if any)? nothing from the forbid list? If it fails, re-prompt fixing ONLY the named',
    '     diffs and render ONCE more; then stop (one render + one targeted retry, then flag).',
    '',
    'Your deliverable is a single file — cell-output.md — written into your working directory,',
    'containing, in this order:',
    '  1. The MATCHED format and one line on why the angle routed there (from the format docs\' Match sections).',
    '  2. The way-ins you mined and the takes you developed (brief).',
    '  3. The critic verdict (inline; the winner, or a reject-all with reasons).',
    '  4. The SHOT SPEC for the winner (the full schema from references/shot-spec.md).',
    '  5. The COMPILED PROMPT, verbatim (the exact text you rendered).',
    '  6. The on-image COPY, verbatim, each line traced to its source in the proof field.',
    '  7. The rendered image path, and your VISION-GATE verdict (pass, or the diffs + the retry).',
    'Produce nothing else. When cell-output.md is written and the image is rendered, you are done.',
  ].join('\n'),

  binderPaths: [
    'agent/.claude/skills/cell/SKILL.md',
  ],

  deliverable: 'cell-output.md',

  // Sonnet 4.6 — the cell carries the heaviest reasoning load in the pipeline
  // (match -> derive -> takes -> critic -> spec -> compile -> vision gate) and
  // is the strongest model the pinned SDK can drive. Opus 4.7 is incompatible.
  model: 'claude-sonnet-4-6',

  // Read + Write are the built-in file tools (Read also views the rendered PNG
  // for the vision gate). Bash runs the render scripts. No web access.
  tools: ['Read', 'Write', 'Bash'],

  passRule: {
    // The load-bearing four for a finished ad — mapped to rubrics/cell.md.
    //   format-matched   the format fits the Bet's angle (awareness + want + material)
    //   maker-derived    the look is derived from the copy's provenance, not picked
    //   copy-honest      every on-image claim/quote traces to the proof field; nothing invented
    //   swap-test        built from this brand's specifics — a rival could not run it
    critical: ['format-matched', 'maker-derived', 'copy-honest', 'swap-test'],
    maxSupportingFails: 1,
  },
};
