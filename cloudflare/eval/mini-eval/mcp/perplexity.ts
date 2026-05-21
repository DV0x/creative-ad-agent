/**
 * Perplexity MCP wrapper — exposes Perplexity's **Search API** (raw web
 * retrieval, no LLM in the loop) as a single BATCHED tool the research
 * apprentice calls from inside its query() loop.
 *
 * ── Why Search API, not Agent API ──────────────────────────────────────────
 * S111 (this session) — we moved off the Agent API. The Agent API ran an
 * internal multi-step search-and-synthesise loop per call (20–40s wall-time,
 * ~$0.03–$0.06 per call, output capped at 4000 synthesis tokens). The
 * apprentice's binder then told it to **ignore the synthesis ANSWER** and
 * quote only from SOURCES. We were paying for synthesis we threw away.
 *
 * Search API is the right shape: one search per query, no agent loop, no
 * LLM, raw `{title, url, snippet, date}` results — exactly the SOURCES
 * blob the apprentice quotes from. Each call is 1–2 seconds. Per-request
 * pricing, not per-token. The grounding discipline (no marketing copy, no
 * fabrication, near-miss disclosure) now lives **only** in the apprentice's
 * binder — which is where it always should have been.
 *
 * ── Why per-query HTTP, not native multi-query batching ────────────────────
 * The Search API accepts an array of queries (up to 5) on a single request,
 * and the docs say "multi-query requests group results per query in
 * submission order." Empirically (S111) that does NOT hold: a request with
 * N=3 queries and max_results=8 returned 8 results *total*, not 24. The
 * grouping the docs promise is not exposed in the response. So we cannot
 * reliably map results back to the originating query when batching natively.
 *
 * The fix: fire ONE HTTP request per query, all concurrent via
 * Promise.allSettled. We lose the per-request cost discount of native
 * batching, but per-request prices on Search API are small and correctness
 * matters more. Per-query duration is ~1-2s; with N concurrent requests,
 * wall-time still collapses to the slowest single request.
 *
 * ── Why the tool surface stays batched (no singular variant) ───────────────
 * Sonnet 4.6 does NOT batch independent tool_use blocks in a single turn
 * even when explicitly instructed to (S110). We move parallelism out of the
 * model's tool-selection layer and into the wrapper: ONE tool that takes an
 * array of queries (max 8) and fires them concurrently. Sonnet emits one
 * tool_use block per turn (which it does reliably); we get N parallel HTTP
 * requests per block.
 *
 * Lives in eval/mini-eval/mcp/ today. Moves to cloudflare/src/lib/mcp/ at
 * the Phase-1 Step-2b orchestrator rewrite. The MCP-server object itself is
 * portable — no harness-specific concerns embedded.
 *
 * ── Design decisions ───────────────────────────────────────────────────────
 *  - Endpoint: POST https://api.perplexity.ai/search, ONE query per request.
 *  - Apprentice-facing cap: 8 queries per call. Wrapper fires N concurrent
 *    HTTP requests with Promise.allSettled.
 *  - Per-query filters (recency, domain allow/block, max_results) — applied
 *    per-request, no grouping needed.
 *  - No `instructions` parameter — Search API has no LLM to instruct. The
 *    discipline now lives only in the apprentice's binder.
 *  - Result format: `[N] QUERY: ... SOURCES: ...` per query — same shape as
 *    before minus the dead ANSWER section.
 *
 * ── Reading list before modifying ──────────────────────────────────────────
 *  - perplexity_prompt_guide.md AND perplexity_sonar_API.txt (repo root)
 *  - agent/.claude/skills/research/SKILL.md — "How to wield the search tool"
 *  - docs/SESSION_110_*.md — the wall-time + parallelism failure that
 *    motivated batched-only
 *  - docs/SESSION_111_*.md — the Agent-API-to-Search-API switch, and the
 *    discovery that native multi-query batching doesn't expose per-query
 *    grouping in the response (this file)
 *  - cloudflare/eval/mini-eval/run-mini-eval.ts — how MCP servers wire into
 *    the harness's query() call
 */

import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const PERPLEXITY_SEARCH_ENDPOINT = 'https://api.perplexity.ai/search';
const MAX_QUERIES_PER_BATCH = 8; // apprentice-facing cap

// ── Diagnostics state ──────────────────────────────────────────────────────
// Module-scoped counter + init time so the harness can see call ordering,
// relative timing, and per-call duration. Module-scoped (not per-fixture) is
// intentional: mini-eval runs fixtures sequentially. Used to diagnose:
//  - per-call parallelism is real (start lines for concurrent queries share a
//    `t=` value; `parallelism=Nx` summary confirms)
//  - which queries are slow (`dur=Ns`)
//  - cost / over-probing patterns when reading runs end-to-end.
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
}

interface SearchApiResponse {
  results: SearchResultItem[];
  id?: string;
  server_time?: string | null;
}

interface PerQueryArgs {
  question: string;
  recency?: 'hour' | 'day' | 'week' | 'month' | 'year';
  domains_allowed?: string[];
  domains_blocked?: string[];
  max_results?: number;
}

type SingleQueryResult =
  | {
      status: 'ok';
      question: string;
      sources: SearchResultItem[];
      durationMs: number;
    }
  | {
      status: 'error';
      question: string;
      errorText: string;
      durationMs: number;
    };

// ── One HTTP call — sends ONE query to /search, parses, returns result ────

async function runSingleQuery(
  args: PerQueryArgs,
  apiKey: string,
): Promise<SingleQueryResult> {
  // Build request body. Search API accepts `query` as string or array;
  // we always send a single string here. Per-request filters apply to
  // the one query.
  const body: Record<string, unknown> = {
    query: args.question,
    max_results: args.max_results ?? 10,
  };
  if (args.recency) body.search_recency_filter = args.recency;

  const allowList = args.domains_allowed ?? [];
  const blockList = args.domains_blocked ?? [];
  if (allowList.length > 0 || blockList.length > 0) {
    // Perplexity's blocklist convention: prepend "-" to a domain to exclude.
    // Allowlist and blocklist live in the same array.
    body.search_domain_filter = [
      ...allowList,
      ...blockList.map(d => `-${d}`),
    ];
  }

  // ── Diagnostics: start log ──────────────────────────────────────────
  // Logged BEFORE the fetch so overlapping start lines from concurrent
  // calls are unambiguous evidence of parallel execution (and lack of
  // overlap is equally unambiguous evidence of sequential execution).
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
    `[perplexity_search] #${callNum} start t=${tRel(tStart)}s max_results=${
      args.max_results ?? 10
    } filters=${filterDesc} q="${qOneLine}"\n`
  );

  const logEnd = (tag: string, extra: string = '') => {
    const tEnd = Date.now();
    const durSec = ((tEnd - tStart) / 1000).toFixed(1);
    process.stderr.write(
      `[perplexity_search] #${callNum} end   t=${tRel(tEnd)}s dur=${durSec}s ${tag}${extra ? ' ' + extra : ''}\n`
    );
  };

  // ── The call ────────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(PERPLEXITY_SEARCH_ENDPOINT, {
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

  let parsed: SearchApiResponse;
  try {
    parsed = (await response.json()) as SearchApiResponse;
  } catch (err) {
    logEnd('error=parse');
    return {
      status: 'error',
      question: args.question,
      errorText: `JSON parse failure: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - tStart,
    };
  }

  const sources = parsed.results ?? [];
  logEnd('ok', `sources=${sources.length}`);

  return {
    status: 'ok',
    question: args.question,
    sources,
    durationMs: Date.now() - tStart,
  };
}

// ── The batched tool ──────────────────────────────────────────────────────

const queryItemSchema = z.object({
  question: z
    .string()
    .min(1)
    .describe(
      'The search query. Specific phrasing improves retrieval; vague phrasings produce vague results. Embed locale cues (country, region, language) in the question prose. Search API returns raw web results — apprentice does its own synthesis from snippets.'
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
  max_results: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe(
      'Max search results per query, default 10, range 1-20. Lower (3-5) for tight fact probes; higher (15-20) for buyer-voice or category probes where breadth matters.'
    ),
});

const perplexityResearchBatch = tool(
  'perplexity_research_batch',
  // Reinforces the binder's "How to wield the search tool" section.
  'Search the web for MULTIPLE queries IN PARALLEL via Perplexity\'s Search API (raw web retrieval, no LLM synthesis). Pass an ARRAY of queries (1-8 items) — each fires as a concurrent HTTP request and the tool returns when all complete. ALWAYS use this tool for grounded research, even for a single question (pass a 1-item array). The discipline: each turn, list every probe you need next, call this tool ONCE with the full list, read all results, then decide on follow-ups for the next turn. Each query returns raw search results — title, URL, snippet, date — that you quote directly with attribution by domain. There is NO synthesis layer; the apprentice does its own synthesis in research.md.',
  {
    queries: z
      .array(queryItemSchema)
      .min(1)
      .max(MAX_QUERIES_PER_BATCH)
      .describe(
        'Array of search queries to run in parallel. Min 1, max 8. Each query carries its own filters; queries do NOT share state. Order in the result matches order in the input array.'
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

    // Fire all queries as concurrent HTTP requests. runSingleQuery handles
    // its own errors and returns a SingleQueryResult, so allSettled
    // rejections should never happen in practice; we handle them
    // defensively.
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

    // ── Batch summary — the parallelism diagnostic ─────────────────────
    // parallelism = sum(per-query duration) / wall-clock.
    //   1.0  = strictly sequential
    //   N    = perfect parallelism for N queries
    // With N concurrent HTTP requests, expect parallelism ≈ N (each
    // request shares the wall window). Below N indicates serialisation
    // somewhere in the stack.
    const sumDurMs = results.reduce((sum, r) => sum + r.durationMs, 0);
    const wallSec = (wallMs / 1000).toFixed(1);
    const sumDurSec = (sumDurMs / 1000).toFixed(1);
    const parallelism = wallMs > 0 ? (sumDurMs / wallMs).toFixed(1) : '0.0';
    const okCount = results.filter(r => r.status === 'ok').length;
    const errCount = results.length - okCount;
    process.stderr.write(
      `[perplexity_research_batch] queries=${args.queries.length} ok=${okCount} err=${errCount} wall=${wallSec}s sum_dur=${sumDurSec}s parallelism=${parallelism}x\n`
    );

    // ── Format result text — numbered blocks per query ─────────────────
    // Same shape as the Agent API version MINUS the ANSWER section. Each
    // block clearly delimits which sources belong to which probe; source
    // numbering resets within each block.
    const blocks = results.map((r, i) => {
      const idx = i + 1;
      const qLine = r.question.replace(/\s+/g, ' ').trim();

      if (r.status === 'error') {
        return `[${idx}] QUERY: ${qLine}\n    ERROR: ${r.errorText}`;
      }

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
        `    SOURCES (quote from here, with attribution by domain):`,
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
  version: '0.3.1',
  tools: [perplexityResearchBatch],
});

/**
 * Canonical name of the tool as the apprentice sees it — namespaced by the
 * MCP server name. Add this to the apprentice's allowedTools list.
 */
export const PERPLEXITY_TOOL_NAME = 'mcp__perplexity__perplexity_research_batch';
