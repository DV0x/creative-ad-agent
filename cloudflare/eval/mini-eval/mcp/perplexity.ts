/**
 * Perplexity MCP wrapper — exposes Perplexity's **Sonar Pro chat API**
 * (web-grounded SYNTHESIS + structured sources) as a single BATCHED tool the
 * research/comp apprentices call from inside their query() loop.
 *
 * ── Why Sonar (answer API), not the raw Search API ─────────────────────────
 * S116 (this change) — we moved BACK to a synthesis API, reversing the S111
 * switch to the raw Search API. The reason is a real fabrication we caught
 * on the DailyObjects gold-standard run:
 *
 *   The Search API returns context-free SNIPPETS — a fragment where a number
 *   ("₹200 crore"), the brand ("DailyObjects"), and the true subject (the
 *   founder's *family shoe business*, or the *parent company* peopic-retail)
 *   all sit jammed together with the subject already stripped out. A small
 *   model reading that fragment re-binds the number to the nearest plausible
 *   subject — "bags = 40% of revenue", "revenue ₹200 cr" — both FALSE
 *   (the real 40% was tier-3/4 demand; the ₹200 cr was a sibling business).
 *   The number "looks right", wears a citation, and is wrong. A snippet's
 *   subject is the first thing it loses.
 *
 *   Sonar reads the FULL pages and synthesises WITH context intact, so the
 *   sentence that binds a number to its subject travels with the fact. On the
 *   same question Sonar answered "₹111 Cr FY25, ₹220–230 Cr FY26 projected"
 *   with a citation and NO shoe-business conflation. Context-rich synthesis
 *   is what prevents subject mis-binding — raw snippets cause it.
 *
 * S111's original objection — "we paid for synthesis we threw away because
 * the binder said ignore the ANSWER and quote only SOURCES" — is resolved by
 * the binder change that ships with this: the ANSWER is now USED (it carries
 * the subject-binding context), and SOURCES are used to ATTRIBUTE. We no
 * longer throw the synthesis away; it is the point.
 *
 * Each query returns BOTH: the grounded ANSWER (context preserved) and the
 * structured `search_results` (title/url/date/snippet — same shape the old
 * Search API returned, so the SOURCES block is unchanged). The apprentice
 * reads the answer for context and attributes load-bearing facts to a named
 * source.
 *
 * ── Retrieval-layer discipline (the SYSTEM prompt) ─────────────────────────
 * We now have a system message Perplexity reads (the Search API had no LLM to
 * instruct). It enforces the subject-binding rule at the retrieval layer —
 * preserve the exact entity/period/region of every number, never re-attach a
 * figure to a different entity than the source does, distinguish the brand
 * from parent/sibling/same-name companies. This is a guard in addition to
 * (not instead of) the apprentice's binder discipline.
 *
 * ── Why per-query HTTP, not native multi-query batching ────────────────────
 * The chat API is one-question-per-request by design. We fire ONE request per
 * query, all concurrent via Promise.allSettled. Wall-time collapses to the
 * slowest single request.
 *
 * ── Why the tool surface stays batched (no singular variant) ───────────────
 * Sonnet 4.6 does NOT batch independent tool_use blocks in a single turn even
 * when explicitly instructed to (S110). We move parallelism out of the
 * model's tool-selection layer and into the wrapper: ONE tool that takes an
 * array of questions (max 8) and fires them concurrently. The model emits one
 * tool_use block per turn (which it does reliably); we get N parallel HTTP
 * requests per block.
 *
 * ── Design decisions ───────────────────────────────────────────────────────
 *  - Endpoint: POST https://api.perplexity.ai/chat/completions, ONE question
 *    per request (validated live S116; /chat/completions and /v1/sonar both
 *    return 200 with identical body — we use the canonical OpenAI-compatible
 *    path).
 *  - Model: `sonar-pro` (multi-step Pro Search, more citations, deeper
 *    synthesis). `web_search_options.search_context_size: 'high'` — maximum
 *    grounding, which is the whole point of the switch. This costs more than
 *    raw Search (~$0.01–0.05/query vs ~$0.005); research/comp runs are
 *    infrequent, and provenance is the product.
 *  - Apprentice-facing cap: 8 questions per call; wrapper fires N concurrent
 *    requests with Promise.allSettled.
 *  - Per-query filters (recency, domain allow/block) map to Sonar's
 *    search_recency_filter / search_domain_filter.
 *  - Result format: `[N] QUERY → ANSWER + SOURCES` per query. SOURCES use the
 *    same `{title,url,date,last_updated,snippet}` shape as the old Search API.
 *
 * ── Reading list before modifying ──────────────────────────────────────────
 *  - perplexity_sonar_API.txt (repo root) + live docs:
 *    https://docs.perplexity.ai/api-reference/sonar-post.md
 *  - agent/.claude/skills/research/SKILL.md — "How to wield the search tool"
 *  - agent/.claude/skills/comp/SKILL.md — "How to wield the tools"
 *  - docs/SESSION_116_*.md — this switch and the DailyObjects fabrication that
 *    motivated it; docs/SESSION_111_*.md — the (now reversed) Search-API move
 *  - cloudflare/eval/mini-eval/run-mini-eval.ts — how MCP servers wire in
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const PERPLEXITY_CHAT_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const SONAR_MODEL = 'sonar-pro';
const SEARCH_CONTEXT_SIZE = 'high'; // maximum grounding — the reason for the switch
const MAX_QUERIES_PER_BATCH = 8; // apprentice-facing cap

// The retrieval-layer guard. Perplexity reads this on every query. It attacks
// the subject-mis-binding failure (S116) at the source, before the apprentice
// ever sees a fact. This does NOT replace the apprentice's binder discipline.
const SYSTEM_PROMPT = [
  'You are a web-research retrieval assistant working for a performance-marketing analyst.',
  'Answer the question using only current web sources you actually retrieve. Follow these rules without exception:',
  '',
  '1. SUBJECT-BINDING: Preserve the exact subject of every fact and number — which entity, which time period, which region a figure describes. NEVER attach a number to a different entity than the source does. If a figure belongs to a parent/holding company, a sibling business, the founder personally, or the whole category, say so explicitly; do not present it as the target brand\'s own figure.',
  '2. ENTITY DISAMBIGUATION: Distinguish the target brand from same-name brands and from any parent/holding/sibling company. If the name is ambiguous or the brand has a parent, flag it in your answer.',
  '3. ATTRIBUTION: Attribute every fact to its source and include the publication date as shown.',
  '4. VERBATIM VOICE: Quote real customer/review language as it actually appears; do not smooth or paraphrase it.',
  '5. UNCERTAINTY: If sources disagree, or a figure is dated or uncertain, say so plainly rather than silently picking one.',
  '6. NO GAP-FILLING: If you cannot find a fact, say you could not find it. Never estimate, infer, or fabricate a number to fill a silence.',
].join('\n');

// ── Diagnostics state ──────────────────────────────────────────────────────
const TOOL_INIT_MS = Date.now();
let callCounter = 0;
const tRel = (ms: number) => ((ms - TOOL_INIT_MS) / 1000).toFixed(1);

// ── Types ─────────────────────────────────────────────────────────────────

interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  date: string | null;
  last_updated: string | null;
  source?: string;
}

interface ChatApiResponse {
  id?: string;
  model?: string;
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  citations?: string[];
  search_results?: SearchResultItem[];
  usage?: { cost?: { total_cost?: number } };
}

interface PerQueryArgs {
  question: string;
  recency?: 'hour' | 'day' | 'week' | 'month' | 'year';
  domains_allowed?: string[];
  domains_blocked?: string[];
}

type SingleQueryResult =
  | {
      status: 'ok';
      question: string;
      answer: string;
      sources: SearchResultItem[];
      citations: string[];
      costUsd: number;
      durationMs: number;
    }
  | {
      status: 'error';
      question: string;
      errorText: string;
      durationMs: number;
    };

// ── One HTTP call — sends ONE question to /chat/completions ────────────────

async function runSingleQuery(
  args: PerQueryArgs,
  apiKey: string,
): Promise<SingleQueryResult> {
  const body: Record<string, unknown> = {
    model: SONAR_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: args.question },
    ],
    web_search_options: { search_context_size: SEARCH_CONTEXT_SIZE },
  };
  if (args.recency) body.search_recency_filter = args.recency;

  const allowList = args.domains_allowed ?? [];
  const blockList = args.domains_blocked ?? [];
  if (allowList.length > 0 || blockList.length > 0) {
    // Perplexity's blocklist convention: prepend "-" to a domain to exclude.
    body.search_domain_filter = [
      ...allowList,
      ...blockList.map(d => `-${d}`),
    ];
  }

  // ── Diagnostics: start log (before fetch so concurrent starts are visible) ─
  const callNum = ++callCounter;
  const tStart = Date.now();
  const qOneLine = args.question.replace(/\s+/g, ' ').trim();
  const filterDesc =
    [
      args.recency ? `recency=${args.recency}` : null,
      allowList.length > 0 ? `allow=${allowList.length}` : null,
      blockList.length > 0 ? `block=${blockList.length}` : null,
    ]
      .filter(Boolean)
      .join(' ') || 'none';
  process.stderr.write(
    `[perplexity_sonar] #${callNum} start t=${tRel(tStart)}s model=${SONAR_MODEL} ctx=${SEARCH_CONTEXT_SIZE} filters=${filterDesc} q="${qOneLine}"\n`
  );

  const logEnd = (tag: string, extra: string = '') => {
    const tEnd = Date.now();
    const durSec = ((tEnd - tStart) / 1000).toFixed(1);
    process.stderr.write(
      `[perplexity_sonar] #${callNum} end   t=${tRel(tEnd)}s dur=${durSec}s ${tag}${extra ? ' ' + extra : ''}\n`
    );
  };

  // ── The call ────────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(PERPLEXITY_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logEnd('error=network');
    return {
      status: 'error',
      question: args.question,
      errorText: `Network failure: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - tStart,
    };
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '(no body)');
    logEnd(`error=http${response.status}`);
    return {
      status: 'error',
      question: args.question,
      errorText: `HTTP ${response.status}: ${errBody.slice(0, 500)}`,
      durationMs: Date.now() - tStart,
    };
  }

  let parsed: ChatApiResponse;
  try {
    parsed = (await response.json()) as ChatApiResponse;
  } catch (err) {
    logEnd('error=parse');
    return {
      status: 'error',
      question: args.question,
      errorText: `JSON parse failure: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - tStart,
    };
  }

  const answer = parsed.choices?.[0]?.message?.content ?? '';
  const sources = parsed.search_results ?? [];
  const citations = parsed.citations ?? [];
  const costUsd = parsed.usage?.cost?.total_cost ?? 0;
  logEnd('ok', `sources=${sources.length} cost=$${costUsd.toFixed(4)}`);

  return {
    status: 'ok',
    question: args.question,
    answer,
    sources,
    citations,
    costUsd,
    durationMs: Date.now() - tStart,
  };
}

// ── The batched tool ──────────────────────────────────────────────────────

const queryItemSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe(
      'The research question, in prose. Sonar returns a web-grounded ANSWER (synthesis that preserves the subject of each fact) plus the SOURCES it used. Ask it to QUOTE and ATTRIBUTE, not merely "find". Embed locale cues (country, region, language) in the question prose. Cap volume in the prose ("quote up to 10 reviews").'
    ),
  recency: z
    .enum(['hour', 'day', 'week', 'month', 'year'])
    .optional()
    .describe(
      'Restrict search to content published within this window. Use for current-data probes (cost benchmarks, recent events, upcoming calendar). Omit to search all time.'
    ),
  domains_allowed: z
    .array(z.string())
    .optional()
    .describe(
      'Allowlist of domains to search (without protocol, e.g. ["youtube.com","quora.com"]). Use to point a probe at a specific surface class.'
    ),
  domains_blocked: z
    .array(z.string())
    .optional()
    .describe(
      'Blocklist of domains to exclude. Use to filter out brand-authored or promotional surfaces when probing for third-party signal.'
    ),
});

const perplexityResearchBatch = tool(
  'perplexity_research_batch',
  'Research the web for MULTIPLE questions IN PARALLEL via Perplexity\'s Sonar Pro chat API (web-grounded synthesis WITH sources). Pass an ARRAY of questions (1-8 items) — each fires as a concurrent request and the tool returns when all complete. ALWAYS use this tool for grounded research, even for a single question (pass a 1-item array). Each question returns a web-grounded ANSWER (a synthesis that keeps the subject of every fact intact — which entity/period/region a number describes) PLUS the SOURCES it cited (title, URL, date, snippet). Read the ANSWER for context; ATTRIBUTE every load-bearing fact to a named SOURCE. A figure whose subject you cannot confirm in a source is a gap, not a fact. The discipline: each turn, list every probe you need, call this tool ONCE with the full list, read all results, then decide follow-ups for the next turn.',
  {
    queries: z
      .array(queryItemSchema)
      .min(1)
      .max(MAX_QUERIES_PER_BATCH)
      .describe(
        'Array of research questions to run in parallel. Min 1, max 8. Each carries its own filters; queries do NOT share state. Order in the result matches order in the input array.'
      ),
  },
  async (args) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'ERROR: PERPLEXITY_API_KEY is not set in the environment. The research tool cannot run. Add the key to .env.local at the repo root.',
          },
        ],
        isError: true,
      };
    }

    const batchStart = Date.now();
    const settled = await Promise.allSettled(
      args.queries.map(q => runSingleQuery(q, apiKey)),
    );
    const wallMs = Date.now() - batchStart;

    const results: SingleQueryResult[] = settled.map((s, i) => {
      if (s.status === 'fulfilled') return s.value;
      return {
        status: 'error',
        question: args.queries[i].question,
        errorText: `Unexpected promise rejection: ${String(s.reason)}`,
        durationMs: 0,
      };
    });

    // ── Batch summary — parallelism + cost diagnostic ──────────────────
    const sumDurMs = results.reduce((sum, r) => sum + r.durationMs, 0);
    const totalCost = results.reduce(
      (sum, r) => sum + (r.status === 'ok' ? r.costUsd : 0),
      0,
    );
    const wallSec = (wallMs / 1000).toFixed(1);
    const sumDurSec = (sumDurMs / 1000).toFixed(1);
    const parallelism = wallMs > 0 ? (sumDurMs / wallMs).toFixed(1) : '0.0';
    const okCount = results.filter(r => r.status === 'ok').length;
    const errCount = results.length - okCount;
    process.stderr.write(
      `[perplexity_research_batch] queries=${args.queries.length} ok=${okCount} err=${errCount} wall=${wallSec}s sum_dur=${sumDurSec}s parallelism=${parallelism}x cost=$${totalCost.toFixed(4)}\n`
    );

    // ── Format result text — ANSWER + SOURCES per query ────────────────
    const blocks = results.map((r, i) => {
      const idx = i + 1;
      const qLine = r.question.replace(/\s+/g, ' ').trim();

      if (r.status === 'error') {
        return `[${idx}] QUERY: ${qLine}\n    ERROR: ${r.errorText}`;
      }

      const answerText = r.answer.trim() || '(no answer returned)';
      const sourcesSection =
        r.sources.length === 0
          ? '      (no sources returned)'
          : r.sources
              .map((s, sIdx) => {
                const dateInfo = s.date ?? 'n/a';
                const updated = s.last_updated
                  ? ` (last updated ${s.last_updated})`
                  : '';
                const snippet = (s.snippet ?? '').replace(/\s+/g, ' ').trim();
                return `      ${sIdx + 1}. ${s.title}\n         URL: ${s.url}\n         Date: ${dateInfo}${updated}\n         Snippet: ${snippet}`;
              })
              .join('\n\n');

      return [
        `[${idx}] QUERY: ${qLine}`,
        `    ANSWER (web-grounded synthesis — keeps each fact's subject intact; verify load-bearing numbers against SOURCES):`,
        answerText
          .split('\n')
          .map(line => `      ${line}`)
          .join('\n'),
        `    SOURCES (attribute facts to these, by domain):`,
        sourcesSection,
      ].join('\n');
    });

    return {
      content: [{ type: 'text' as const, text: blocks.join('\n\n') }],
    };
  },
);

/**
 * The MCP server exposing the Perplexity research tool to the apprentice.
 * Pass via `mcpServers` to the SDK's query() options:
 *
 *   query({
 *     prompt: ...,
 *     options: {
 *       mcpServers: { perplexity: perplexityMcpServer },
 *       allowedTools: [...existing, PERPLEXITY_TOOL_NAME],
 *     }
 *   })
 */
export const perplexityMcpServer = createSdkMcpServer({
  name: 'perplexity',
  version: '0.4.0',
  tools: [perplexityResearchBatch],
});

/**
 * Canonical name of the tool as the apprentice sees it — namespaced by the
 * MCP server name. Add this to the apprentice's allowedTools list.
 */
export const PERPLEXITY_TOOL_NAME = 'mcp__perplexity__perplexity_research_batch';
