/**
 * Research apprentice — the programmatic apprentice that loads the research
 * binder and surfaces a brand's reality, its buyers' voice, and the market
 * context the strategist will need.
 *
 * Consumed by the mini-eval harness today; the SAME object will (later, in
 * the Phase-1 Step-2b orchestrator rewrite) be consumed by the orchestrator
 * when apprentices are wired into the 9-step loop. So this file stays free
 * of harness-specific AND orchestrator-specific concerns — it is just the
 * apprentice's identity, binder, tool surface, deliverable, and pass rule.
 *
 * Two things this apprentice needs that the strategy apprentice does not:
 *  1. The Perplexity MCP tool. The wrapper lives at ../mcp/perplexity.ts;
 *     the apprentice's tool list includes its namespaced tool name. The
 *     harness must wire the MCP server into the SDK's query() options.
 *  2. Access to reference/hyperlocal.md — the conditional binder reference
 *     the apprentice reads at runtime when locale depth reaches city-or-
 *     tighter. The harness places hyperlocal.md in the working directory
 *     at relative path reference/hyperlocal.md so the binder's instruction
 *     "Read reference/hyperlocal.md" resolves.
 *
 * Mini-eval note: as with strategy, the harness INLINES SKILL.md into the
 * apprentice's system prompt rather than relying on Skill-tool triggering.
 * This tests binder *content*, not Skill-trigger reliability — which is an
 * orchestration concern evaluated later at full-loop integration.
 */

import { PERPLEXITY_TOOL_NAME } from '../mcp/perplexity.js';
import type { Apprentice } from './strategy.js';

export const researchApprentice: Apprentice = {
  name: 'research',
  description:
    "Performance-marketing research analyst — the strategist's eyes on the " +
    "open web. Surfaces the brand's reality, its buyers' voice, and the " +
    'market context the strategist will need to diagnose the real ' +
    'conversion blocker.',

  identityPrompt: [
    'You are a senior performance-marketing research analyst, engaged for one brand.',
    '',
    'Your complete method follows below, under "# The Research Binder". Read it',
    'as your operating manual — it is how you think, not a checklist. It',
    'establishes who you are and what your deliverable, research.md, must contain.',
    'Follow it.',
    '',
    "For this engagement, the founder's intake is already placed in your working",
    'directory. Read it first:',
    '',
    "  - founder-facts.md    The brand URL, the founder's brief, and their own",
    '                        facts (conversion event, budget, ad history if any,',
    '                        target audience if specified). May be thin or partly',
    '                        missing — work with what is there; name the gaps.',
    '',
    "  - reference-images/   Founder-supplied photos of the brand's product,",
    '                        space, or people. May be absent for non-visual-first',
    '                        verticals; if the folder exists, Read every file in',
    '                        it. These are your primary visual-reality input.',
    '',
    'Your tools, in priority order:',
    '',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Primary research engine (Perplexity Sonar Pro).',
    '                        Pass an ARRAY of questions (1-8); each fires',
    '                        concurrently and returns a web-grounded ANSWER (a',
    '                        synthesis that keeps every fact bound to its exact',
    '                        subject — which entity, period, region a number',
    '                        describes) PLUS the SOURCES it cited (title, URL,',
    '                        date, snippet). Use for buyer voice, category',
    '                        context, locale signals, cost benchmarks, calendar.',
    '                        Read the ANSWER for context; attribute every',
    '                        load-bearing fact to a named SOURCE, by domain. A',
    '                        figure whose subject you cannot confirm in a source',
    '                        is a gap, not a fact.',
    '',
    "  - WebFetch             For the brand's own URL and other specific known",
    '                        pages. Use before paying for grounded research on',
    "                        the brand's own surfaces. Expect some sites to",
    '                        return empty (JS-rendered SPAs, crawler-blocking) —',
    '                        that is normal; name the gap and reroute.',
    '',
    '  - Read                 For files in your working directory. The binder',
    '                        will direct you to read reference/hyperlocal.md',
    '                        when locale depth reaches city-or-tighter — that',
    '                        file is in your working directory under reference/.',
    '',
    '  - Write                Writes your deliverable.',
    '',
    'Your deliverable is a single file — research.md — written into your working',
    'directory, in the case-file-header + 8-section form the binder specifies.',
    'Produce nothing else. When research.md is written, you are done.',
  ].join('\n'),

  binderPaths: [
    'agent/.claude/skills/research/SKILL.md',
  ],

  deliverable: 'research.md',

  // Haiku 4.5 — production-realistic test of the REDESIGNED binder (this
  // session: desire-thread + weighting/anti-skew + proof). S116 had bumped
  // research to Sonnet because Haiku failed the OLD binder in capability-shaped
  // ways; the redesign added load, so we re-test whether Haiku can carry the
  // richer binder (the open Sonnet-per-seat vs Haiku+lint-gate economics call).
  // If a failure is clearly model-capability-shaped, swap back to
  // 'claude-sonnet-4-6' to isolate. Opus 4.7 is incompatible with the pinned SDK.
  model: 'claude-haiku-4-5-20251001',

  // Read + Write are the SDK's built-in file tools. WebFetch is the SDK's
  // built-in fetcher. The Perplexity tool is namespaced by the MCP server's
  // name. WebSearch is deliberately omitted — the Perplexity tool covers
  // grounded retrieval more reliably (no Anthropic user-agent restrictions,
  // no US-only locale, raw search_results with snippets).
  tools: ['Read', 'Write', 'WebFetch', PERPLEXITY_TOOL_NAME],

  passRule: {
    // The load-bearing four — the binder's own "how to tell your work from
    // slop" core, mapped to rubric criteria of the same names in
    // rubrics/research.md.
    //   sourced            every claim attributable to a citable surface
    //   no-fabrication     no invented numbers, dates, names, or facts
    //   no-marketing-copy  no finished hooks, sample ad lines, copy ideas
    //   gap-named          thin signal and empty surfaces named explicitly
    critical: ['sourced', 'no-fabrication', 'no-marketing-copy', 'gap-named'],
    maxSupportingFails: 1,
  },
};
