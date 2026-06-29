/**
 * TraceLogger — observability for the multi-agent loop, eval-ready from day one.
 *
 * Feed it every SDK message (`logger.record(m)` inside your `for await` loop) and
 * call `logger.finalize()` at the end. It produces, in the run directory:
 *   • trace.jsonl   — the raw, ordered event stream (one message per line) for deep inspection / replay
 *   • summary.json  — a per-stage rollup (model, tool calls, MCP calls, anomalies, global cost/turns)
 *   • trace.md      — a human-readable attributed timeline
 *
 * Attribution: every SDK message carries `parent_tool_use_id`. A message whose parent
 * is null came from the ORCHESTRATOR; a non-null parent traces to the `Agent` launch
 * that spawned a subagent (whose `input.subagent_type` names the stage). So we can say,
 * for every tool call, exactly which agent made it — and flag the architecture violation
 * where the orchestrator calls MCP directly (an MCP tool_use with parent === null).
 *
 * Caller-driven by design: `run.ts` (console) and the Phase-2 WS handler can both call
 * `record(m)` alongside their own per-message handling — same stream, one source of truth.
 *
 * Limitation worth knowing: in the single-orchestrator model the SDK emits ONE final
 * `result` with a GLOBAL cost (+ per-model `modelUsage`), so per-stage COST is not
 * separable here. For per-stage cost/quality, the mini-eval harness (sealed per-stage
 * queries) remains the tool. This logger covers per-stage BEHAVIOR (what each stage did).
 */
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type AnyMsg = any; // SDK message; we read known fields defensively.

interface StageStat {
  stage: string;
  models: Set<string>;
  textChars: number;
  toolCalls: Record<string, number>;
  mcpCalls: number;
}

interface TimelineEntry {
  seq: number;
  tsRel: number;
  stage: string;
  kind: string;
  detail: string;
}

const content = (m: AnyMsg): any[] => (Array.isArray(m?.message?.content) ? m.message.content : []);

export class TraceLogger {
  private jsonlPath: string;
  private launches = new Map<string, string>(); // Agent tool_use id -> subagent_type
  private stages = new Map<string, StageStat>();
  private timeline: TimelineEntry[] = [];
  private anomalies: string[] = [];
  private result: AnyMsg = null; // last result wins (cumulative)
  private resultCount = 0; // 0.3.195 emits one result per async-task segment — count them
  private seq = 0;
  private t0 = Date.now();

  constructor(private runDir: string) {
    mkdirSync(runDir, { recursive: true });
    this.jsonlPath = join(runDir, 'trace.jsonl');
    writeFileSync(this.jsonlPath, ''); // truncate any prior run
  }

  /** The stage a message belongs to: 'orchestrator' if parent is null, else the subagent it spawned. */
  private stageFor(parentId?: string | null): string {
    if (!parentId) return 'orchestrator';
    return this.launches.get(parentId) ?? `subagent(${parentId.slice(0, 12)}…)`;
  }

  private stat(stage: string): StageStat {
    let s = this.stages.get(stage);
    if (!s) {
      s = { stage, models: new Set(), textChars: 0, toolCalls: {}, mcpCalls: 0 };
      this.stages.set(stage, s);
    }
    return s;
  }

  private push(stage: string, kind: string, detail: string) {
    this.timeline.push({ seq: this.seq, tsRel: Date.now() - this.t0, stage, kind, detail });
  }

  record(m: AnyMsg): void {
    // 1) raw, ordered append — the full eval/replay trace
    appendFileSync(this.jsonlPath, JSON.stringify({ seq: this.seq, tsRel: Date.now() - this.t0, msg: m }) + '\n');

    // 2) register Agent/Task launches so later subagent messages resolve to a stage
    if (m?.type === 'assistant') {
      for (const b of content(m)) {
        if (b.type === 'tool_use' && (b.name === 'Agent' || b.name === 'Task') && b.input?.subagent_type) {
          this.launches.set(b.id, b.input.subagent_type);
        }
      }
    }

    const stage = this.stageFor(m?.parent_tool_use_id);

    if (m?.type === 'system' && m?.subtype === 'init') {
      this.push('orchestrator', 'init', `apiKeySource=${m.apiKeySource ?? '?'} mcp=${(m.mcp_servers ?? []).map((s: any) => s.name).join(',')}`);
    }

    if (m?.type === 'assistant') {
      const st = this.stat(stage);
      if (m.message?.model) st.models.add(m.message.model);
      for (const b of content(m)) {
        if (b.type === 'text' && b.text?.trim()) {
          st.textChars += b.text.length;
          this.push(stage, 'text', `"${b.text.slice(0, 60).replace(/\s+/g, ' ')}…"`);
        }
        if (b.type === 'tool_use') {
          st.toolCalls[b.name] = (st.toolCalls[b.name] ?? 0) + 1;
          const extra = b.input?.subagent_type ? ` → ${b.input.subagent_type}` : '';
          this.push(stage, 'tool_use', `${b.name}${extra} (id=${b.id})`);
          if (b.name.startsWith('mcp__')) {
            st.mcpCalls++;
            if (!m.parent_tool_use_id) {
              this.anomalies.push(
                `ORCHESTRATOR called MCP directly: ${b.name} (parent_tool_use_id=null). It should delegate to a subagent.`,
              );
            }
          }
        }
      }
    }

    if (m?.type === 'user') {
      for (const b of content(m)) {
        if (b.type === 'tool_result') {
          const snippet = JSON.stringify(b.content ?? '').slice(0, 60);
          this.push(stage, 'tool_result', snippet);
        }
      }
    }

    if (m?.type === 'result') {
      this.result = m;
      this.resultCount++;
      this.push('orchestrator', 'result', `${m.subtype} turns=${m.num_turns} cost=$${m.total_cost_usd}`);
    }

    this.seq++;
  }

  finalize() {
    const summary = {
      runDir: this.runDir,
      stages: [...this.stages.values()].map((s) => ({
        stage: s.stage,
        models: [...s.models],
        textChars: s.textChars,
        toolCalls: s.toolCalls,
        mcpCalls: s.mcpCalls,
      })),
      anomalies: this.anomalies,
      resultSegments: this.resultCount,
      result: this.result
        ? {
            subtype: this.result.subtype,
            is_error: this.result.is_error,
            num_turns: this.result.num_turns,
            total_cost_usd: this.result.total_cost_usd,
            duration_ms: this.result.duration_ms,
            duration_api_ms: this.result.duration_api_ms,
            modelUsage: this.result.modelUsage ? Object.keys(this.result.modelUsage) : null,
            permission_denials: this.result.permission_denials ?? [],
          }
        : null,
      note: 'Per-stage COST is not separable in the single-orchestrator model (global total + per-model modelUsage only). For per-stage cost, use the mini-eval harness.',
    };
    writeFileSync(join(this.runDir, 'summary.json'), JSON.stringify(summary, null, 2));
    writeFileSync(join(this.runDir, 'trace.md'), this.renderMarkdown(summary));
    return summary;
  }

  private renderMarkdown(summary: any): string {
    const lines: string[] = [];
    lines.push(`# Run trace — ${this.runDir}`, '');
    lines.push('## Per-stage rollup', '');
    lines.push('| stage | model(s) | tool calls | mcp calls |', '|---|---|---|---|');
    for (const s of summary.stages) {
      const tools = Object.entries(s.toolCalls).map(([n, c]) => `${n}×${c}`).join(', ') || '—';
      lines.push(`| ${s.stage} | ${s.models.join(', ') || '—'} | ${tools} | ${s.mcpCalls} |`);
    }
    lines.push('');
    if (summary.anomalies.length) {
      lines.push('## ⚠️ Anomalies', '');
      for (const a of summary.anomalies) lines.push(`- ${a}`);
      lines.push('');
    }
    if (summary.result) {
      const r = summary.result;
      lines.push('## Result', '', `- subtype: \`${r.subtype}\` · turns: ${r.num_turns} · cost: $${r.total_cost_usd}`, `- wall: ${r.duration_ms}ms · api: ${r.duration_api_ms}ms · models: ${(r.modelUsage ?? []).join(', ')}`, '');
    }
    lines.push('## Timeline (attributed)', '');
    for (const e of this.timeline) {
      lines.push(`- \`+${String(e.tsRel).padStart(6)}ms\` **[${e.stage}]** ${e.kind}: ${e.detail}`);
    }
    return lines.join('\n') + '\n';
  }
}
