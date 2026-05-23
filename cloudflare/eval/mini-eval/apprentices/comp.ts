/**
 * Comp apprentice — the programmatic apprentice that loads the competitive-
 * intelligence binder and reads the field a brand competes in: who the rivals
 * are, where their positioning clusters, the lane no one occupies, and what
 * their live Meta ads reveal.
 *
 * Consumed by the mini-eval harness today; the SAME object will (later, in the
 * Phase-1 Step-2b orchestrator rewrite) be consumed by the orchestrator when
 * apprentices are wired into the 9-step loop as Step C. So this file stays free
 * of harness-specific AND orchestrator-specific concerns — it is just the
 * apprentice's identity, binder, tool surface, deliverable, and pass rule.
 *
 * Two MCP tool surfaces, both wired by the harness into query() options:
 *  1. Perplexity (../mcp/perplexity.ts) — field discovery, the clustering read,
 *     white-space verification, and the trend-fallback when the Ad Library is
 *     empty. Same wrapper the research apprentice uses.
 *  2. ScrapeCreators (../mcp/scrapecreators.ts) — the live Meta Ad Library read,
 *     in two tools: competitor_find_pages (resolve names → pages) then
 *     competitor_ads (page_id → revealed-winner ads).
 *
 * Mini-eval note: as with research/strategy, the harness INLINES SKILL.md into
 * the system prompt rather than relying on Skill-tool triggering — this tests
 * binder *content*, not Skill-trigger reliability (an orchestration concern
 * evaluated later at full-loop integration).
 */

import { PERPLEXITY_TOOL_NAME } from '../mcp/perplexity.js';
import {
  SCRAPECREATORS_FIND_PAGES_TOOL,
  SCRAPECREATORS_ADS_TOOL,
} from '../mcp/scrapecreators.js';
import type { Apprentice } from './strategy.js';

export const compApprentice: Apprentice = {
  name: 'comp',
  description:
    'Competitive-intelligence analyst — reads the field a brand competes in: ' +
    'who the rivals are, where their positioning clusters, the lane no one ' +
    "occupies, and what their live Meta ads reveal. Best-effort; sharpens the " +
    'strategist\'s Bet, never blocks it.',

  identityPrompt: [
    'You are a senior competitive-intelligence analyst, engaged for one brand.',
    '',
    'Your complete method follows below, under "# The Competitive Intelligence',
    'Binder". Read it as your operating manual — it is how you think, not a',
    'checklist. It establishes who you are and what your deliverable,',
    'competitors.md, must contain. Follow it.',
    '',
    'For this engagement the upstream work is already placed in your working',
    'directory. Read both before you reason:',
    '',
    '  - research.md         The brand, its buyers, market, reputation, locale,',
    '                        and any "alternatives landscape" the buyer named.',
    '                        Treat that landscape as a HINT, not your rival list —',
    '                        you discover the field yourself.',
    '  - founder-facts.md    The brand URL and the founder\'s own facts (vertical,',
    '                        conversion event, locale). May be thin.',
    '',
    'Your tools:',
    '',
    `  - ${PERPLEXITY_TOOL_NAME}`,
    '                        Perplexity Search API (raw web retrieval, no LLM',
    '                        synthesis). Your engine for field discovery, the',
    '                        clustering/axes read, white-space verification, and',
    '                        the category-trend FALLBACK when the Ad Library is',
    '                        empty. Pass an ARRAY of queries (1-8); each fires',
    '                        concurrently. Quote from SOURCES, attribute by domain.',
    '',
    `  - ${SCRAPECREATORS_FIND_PAGES_TOOL}`,
    '                        Resolve rival NAMES to Meta Ad Library pages. Pass an',
    '                        array of brand names; returns candidate pages with',
    '                        likes, category, Instagram handle. YOU pick the right',
    '                        page_id (match on likes + category + ig) — this is the',
    '                        wrong-brand defence. 1 credit per name (cached).',
    '',
    `  - ${SCRAPECREATORS_ADS_TOOL}`,
    "                        Fetch a chosen page's active ads, pre-ranked by",
    '                        revealed-winner signal (longevity × variants) and',
    '                        trimmed. Pass an array of {page_id, country}. There is',
    '                        NO performance data — longevity/variants are PROXIES',
    '                        for what a budget endorses, never measured wins. Empty',
    '                        = the rival runs no active Meta ads (a finding). 1',
    '                        credit per page (cached). Scrape only the top 3-5',
    '                        rivals that define the field.',
    '',
    '  - WebFetch             For specific known pages (a rival\'s site) when a',
    '                        search snippet is not enough.',
    '',
    '  - Read                 For files in your working directory.',
    '  - Write                Writes your deliverable.',
    '',
    'Your deliverable is a single file — competitors.md — written into your',
    'working directory, in the 4-section form the binder specifies (the',
    'competitive field, the clustering axes, the white space, the live ad field',
    '& visual zeitgeist). Produce nothing else. When competitors.md is written,',
    'you are done.',
  ].join('\n'),

  binderPaths: [
    'agent/.claude/skills/comp/SKILL.md',
  ],

  deliverable: 'competitors.md',

  // Haiku 4.5 — the production target, matching the research apprentice. The
  // binder content mirrors research's grounding discipline; if a failure looks
  // model-capability-shaped rather than binder-shaped, swap to
  // 'claude-sonnet-4-6' to isolate. Opus 4.7 is incompatible with the pinned SDK.
  model: 'claude-haiku-4-5-20251001',

  // Read/Write/WebFetch are SDK built-ins. The Perplexity + ScrapeCreators tools
  // are namespaced by their MCP server names. WebSearch is omitted — Perplexity
  // covers grounded retrieval more reliably.
  tools: [
    'Read',
    'Write',
    'WebFetch',
    PERPLEXITY_TOOL_NAME,
    SCRAPECREATORS_FIND_PAGES_TOOL,
    SCRAPECREATORS_ADS_TOOL,
  ],

  passRule: {
    // The load-bearing four — the binder's "tell your work from slop" core,
    // mapped to rubric criteria of the same names in rubrics/comp.md.
    //   sourced            every rival/axis/ad claim traces to a citable surface
    //   no-fabrication     no invented rivals, prices, ad counts, or measured-win claims
    //   white-space-named  the open lane is identified, inferred from clustering, hedged
    //   no-marketing-copy  no finished hooks or ad lines of the apprentice's own
    critical: ['sourced', 'no-fabrication', 'white-space-named', 'no-marketing-copy'],
    maxSupportingFails: 1,
  },
};
