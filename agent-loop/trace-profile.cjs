#!/usr/bin/env node
/**
 * trace-profile.cjs — profiler over a pipeline trace.jsonl
 * Pass 1: skeleton — every init/result boundary with session ids, models, cost counters.
 * Pass 2: per query-segment aggregation — turns, tokens, tool calls, time partition
 *         (model-wait vs tool-wait), longest gaps, rate-limit sightings.
 * Usage: node trace-profile.cjs <trace.jsonl> [--json out.json]
 */
const fs = require('fs');
const readline = require('readline');

const file = process.argv[2];
if (!file) { console.error('usage: node trace-profile.cjs <trace.jsonl>'); process.exit(1); }

const ms = (n) => {
  if (n == null) return '?';
  const s = Math.round(n / 1000);
  return `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`;
};
const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const contentBlocks = (m) => {
  const c = m?.message?.content;
  if (Array.isArray(c)) return c;
  if (typeof c === 'string') return [{ type: 'text', text: c }];
  return [];
};

async function main() {
  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });

  let lineNo = 0;
  let prevSeq = Infinity;
  let loggerSeg = 0;      // increments when seq resets (new TraceLogger lifetime / process)
  let segOrdinal = 0;     // init ordinal within the whole file
  let cur = null;         // current query segment
  const segments = [];
  const rateLimits = [];
  const results = [];

  const newSeg = (lineNo, rec) => {
    const m = rec.msg;
    cur = {
      ord: segOrdinal++, loggerSeg, startLine: lineNo, endLine: lineNo,
      tsStart: rec.tsRel, tsEnd: rec.tsRel,
      sessionId: m.session_id || '?', initModel: m.model || '?',
      firstUserText: null, firstAssistantText: null,
      turns: 0, msgs: 0,
      models: {},           // model -> assistant-msg count
      usage: { in: 0, cacheW: 0, cacheR: 0, out: 0 },
      toolCalls: {},        // name -> count
      toolResultChars: 0,
      gapModel: 0, gapTool: 0, gapOther: 0,   // time partition by "what were we waiting on"
      topGaps: [],          // {gap, beforeKind, afterKind, detail, line}
      result: null,
      launches: {},         // Task/Agent subagent_type -> count
      parentIds: new Set(), // distinct parent_tool_use_ids seen (subagent traffic)
    };
    segments.push(cur);
  };

  let prevTs = null, prevKind = null, prevDetail = '';

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    let rec;
    try { rec = JSON.parse(line); } catch (e) { console.error(`line ${lineNo}: parse error`); continue; }
    const m = rec.msg || {};
    if (rec.seq < prevSeq) { loggerSeg++; prevTs = null; prevKind = null; }
    prevSeq = rec.seq;

    if (m.type === 'system' && m.subtype === 'init') {
      newSeg(lineNo, rec);
      prevTs = rec.tsRel; prevKind = 'init'; prevDetail = 'init';
      continue;
    }
    if (!cur) { newSeg(lineNo, rec); } // file starting mid-stream safety

    // ---- gap attribution: the time since the previous event was spent waiting on
    //      whatever produced THIS event (assistant => model API; user/tool_result => tool exec)
    if (prevTs != null && rec.tsRel >= prevTs) {
      const gap = rec.tsRel - prevTs;
      let bucket = 'gapOther';
      if (m.type === 'assistant') bucket = 'gapModel';
      else if (m.type === 'user') bucket = 'gapTool';
      cur[bucket] += gap;
      const detail = m.type === 'assistant'
        ? contentBlocks(m).map(b => b.type === 'tool_use' ? `tool_use:${b.name}` : b.type).join(',')
        : m.type === 'user'
          ? 'tool_result'
          : `${m.type}/${m.subtype || ''}`;
      cur.topGaps.push({ gap, waitedOn: bucket, after: prevDetail, produced: detail, line: lineNo });
      if (cur.topGaps.length > 400) { cur.topGaps.sort((a, b) => b.gap - a.gap); cur.topGaps.length = 12; }
      prevDetail = detail;
    }
    prevTs = rec.tsRel; prevKind = m.type;

    cur.endLine = lineNo; cur.tsEnd = rec.tsRel; cur.msgs++;
    if (m.parent_tool_use_id) cur.parentIds.add(m.parent_tool_use_id);

    if (m.type === 'assistant') {
      cur.turns++;
      const model = m.message?.model || '?';
      cur.models[model] = (cur.models[model] || 0) + 1;
      const u = m.message?.usage;
      if (u) {
        cur.usage.in += u.input_tokens || 0;
        cur.usage.cacheW += u.cache_creation_input_tokens || 0;
        cur.usage.cacheR += u.cache_read_input_tokens || 0;
        cur.usage.out += u.output_tokens || 0;
      }
      for (const b of contentBlocks(m)) {
        if (b.type === 'tool_use') {
          cur.toolCalls[b.name] = (cur.toolCalls[b.name] || 0) + 1;
          if ((b.name === 'Task' || b.name === 'Agent') && b.input?.subagent_type) {
            cur.launches[b.input.subagent_type] = (cur.launches[b.input.subagent_type] || 0) + 1;
          }
        }
        if (b.type === 'text' && b.text?.trim() && !cur.firstAssistantText) {
          cur.firstAssistantText = b.text.slice(0, 160).replace(/\s+/g, ' ');
        }
      }
    }

    if (m.type === 'user') {
      for (const b of contentBlocks(m)) {
        if (b.type === 'tool_result') {
          cur.toolResultChars += JSON.stringify(b.content ?? '').length;
        } else if ((b.type === 'text' || typeof b === 'string') && !cur.firstUserText) {
          const t = typeof b === 'string' ? b : b.text;
          if (t?.trim()) cur.firstUserText = t.slice(0, 200).replace(/\s+/g, ' ');
        }
      }
      if (typeof m.message?.content === 'string' && !cur.firstUserText) {
        cur.firstUserText = m.message.content.slice(0, 200).replace(/\s+/g, ' ');
      }
    }

    if (m.type === 'result') {
      cur.result = {
        subtype: m.subtype, turns: m.num_turns, cost: m.total_cost_usd,
        durMs: m.duration_ms, apiMs: m.duration_api_ms,
        models: m.modelUsage ? Object.fromEntries(Object.entries(m.modelUsage).map(([mod, v]) => [mod, {
          in: v.inputTokens, out: v.outputTokens, cacheR: v.cacheReadInputTokens, cacheW: v.cacheCreationInputTokens, cost: v.costUSD,
        }])) : null,
      };
      results.push({ line: lineNo, loggerSeg, ord: cur.ord, ...cur.result });
    }

    const raw = JSON.stringify(m);
    if (raw.includes('rate_limit') || raw.includes('overloaded') || raw.includes('529')) {
      rateLimits.push({ line: lineNo, ord: cur.ord, type: m.type, subtype: m.subtype, snippet: raw.slice(0, 200) });
    }
  }

  // ---------- report ----------
  console.log(`\n=== SKELETON: ${segments.length} query segments across ${loggerSeg} logger lifetimes ===\n`);
  for (const s of segments) {
    const models = Object.entries(s.models).map(([m, c]) => `${m.replace('claude-', '')}×${c}`).join(' ');
    const r = s.result;
    console.log(
      `#${String(s.ord).padStart(2)} L${s.loggerSeg} lines ${s.startLine}-${s.endLine} ` +
      `sess=${s.sessionId.slice(0, 8)} span=${ms(s.tsEnd - s.tsStart)} turns=${s.turns} msgs=${s.msgs} ` +
      `[${models || s.initModel}]`
    );
    console.log(`    user: ${(s.firstUserText || '—').slice(0, 150)}`);
    if (r) console.log(`    RESULT ${r.subtype} turns=${r.turns} cost=$${r.cost?.toFixed(2)} wall=${ms(r.durMs)} api=${ms(r.apiMs)}`);
  }

  console.log(`\n=== PER-SEGMENT DETAIL ===\n`);
  for (const s of segments) {
    const wall = s.tsEnd - s.tsStart;
    if (s.msgs < 2) continue;
    console.log(`#${String(s.ord).padStart(2)} sess=${s.sessionId.slice(0, 8)} wall=${ms(wall)} | model-wait=${ms(s.gapModel)} tool-wait=${ms(s.gapTool)} other=${ms(s.gapOther)}`);
    console.log(`    tokens: fresh-in=${k(s.usage.in)} cacheW=${k(s.usage.cacheW)} cacheR=${k(s.usage.cacheR)} out=${k(s.usage.out)} | toolResultChars=${k(s.toolResultChars)}`);
    const tools = Object.entries(s.toolCalls).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n}×${c}`).join(' ');
    if (tools) console.log(`    tools: ${tools}`);
    const launches = Object.entries(s.launches).map(([n, c]) => `${n}×${c}`).join(' ');
    if (launches) console.log(`    launches: ${launches}`);
    s.topGaps.sort((a, b) => b.gap - a.gap);
    for (const g of s.topGaps.slice(0, 5)) {
      console.log(`    gap ${ms(g.gap)} (${g.waitedOn.replace('gap', '')}) after [${(g.after || '').slice(0, 60)}] -> [${g.produced.slice(0, 60)}] line ${g.line}`);
    }
  }

  console.log(`\n=== RESULT MESSAGES (cost counters) ===\n`);
  for (const r of results) {
    console.log(`line ${r.line} L${r.loggerSeg} #${r.ord} ${r.subtype} turns=${r.turns} cost=$${r.cost?.toFixed(2)} wall=${ms(r.durMs)} api=${ms(r.apiMs)}`);
    if (r.models) for (const [mod, v] of Object.entries(r.models)) {
      console.log(`     ${mod}: in=${k(v.in ?? 0)} out=${k(v.out ?? 0)} cacheR=${k(v.cacheR ?? 0)} cacheW=${k(v.cacheW ?? 0)} cost=$${(v.cost ?? 0).toFixed(2)}`);
    }
  }

  console.log(`\n=== RATE-LIMIT / OVERLOAD SIGHTINGS: ${rateLimits.length} ===\n`);
  for (const rl2 of rateLimits.slice(0, 20)) {
    console.log(`line ${rl2.line} #${rl2.ord} ${rl2.type}/${rl2.subtype || ''}: ${rl2.snippet.slice(0, 160)}`);
  }

  const jsonOut = process.argv.indexOf('--json');
  if (jsonOut > -1 && process.argv[jsonOut + 1]) {
    for (const s of segments) { s.parentIds = [...s.parentIds]; s.topGaps.sort((a, b) => b.gap - a.gap); s.topGaps.length = Math.min(s.topGaps.length, 12); }
    fs.writeFileSync(process.argv[jsonOut + 1], JSON.stringify({ segments, results, rateLimits }, null, 1));
    console.log(`\nJSON written to ${process.argv[jsonOut + 1]}`);
  }
}
main();
