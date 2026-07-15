/**
 * chat/reducer.ts — the pure brain of the live view.
 *
 * It folds the orchestrator's raw SDK message stream (plus a few UI actions) into ONE
 * immutable ChatView the ink components render. No ink, no SDK calls, no side effects —
 * so it's trivially testable against a recorded trace.jsonl.
 *
 * Attribution mirrors trace.ts: an Agent/Task tool_use registers `id -> subagent_type`,
 * and any later message whose `parent_tool_use_id` matches belongs to that stage. A message
 * with a null parent came from the orchestrator (it talks to the user; the stages do the work).
 */
import type { AskQuestions, AskAnswers } from './session.ts';

export type StageStatus = 'pending' | 'running' | 'done' | 'failed';

export interface StageView {
  id: string; // research | comp | strategy | cell-generate | critic | cell-render | render-critic
  label: string;
  status: StageStatus;
  model?: string;
  tools: number;
  activity?: string; // last thing this stage did (one line)
  verdict?: string; // critics only: WINNER / REJECT ALL / PASS / FAIL
  round: number; // retry round (0 = first pass)
}

export type FeedItem =
  | { kind: 'agent'; text: string }
  | { kind: 'user'; text: string }
  | { kind: 'question'; headers: string[] }
  | { kind: 'note'; text: string };

export interface ChatView {
  brand: string;
  sessionId: string | null;
  phase: 'starting' | 'intake' | 'running' | 'idle' | 'ended';
  stages: StageView[];
  feed: FeedItem[];
  activity: string;
  costUsd: number;
  segments: number;
  awaitingUser: boolean;
  launches: Record<string, string>; // Agent tool_use id -> stage id
  error?: string;
}

const LABELS: Record<string, string> = {
  'field-scout': 'field · scout',
  'field-read': 'field · read',
  'field-brief': 'field · brief',
  collect: 'collect',
  create: 'create',
  buy: 'buyer',
  build: 'build',
  gate: 'gate',
};
const label = (id: string): string => LABELS[id] ?? id;
const isCritic = (id: string | null): boolean => id === 'buy' || id === 'gate';

/** Seed the scoreboard with the whole sequence (the intermediate seats interleave after their stages). */
export function initView(brand: string, order: string[]): ChatView {
  const seq: string[] = [];
  for (const n of order) {
    seq.push(n);
    if (n === 'field-scout') seq.push('field-read', 'field-brief'); // the fan-out renders as one stage row
    if (n === 'create') seq.push('buy');
    if (n === 'build') seq.push('gate');
  }
  return {
    brand,
    sessionId: null,
    phase: 'starting',
    stages: seq.map((id) => ({ id, label: label(id), status: 'pending', tools: 0, round: 0 })),
    feed: [],
    activity: '',
    costUsd: 0,
    segments: 0,
    awaitingUser: false,
    launches: {},
  };
}

export type ChatEvent =
  | { t: 'sdk'; m: any }
  | { t: 'user'; text: string }
  | { t: 'question'; q: AskQuestions }
  | { t: 'answered'; a: AskAnswers }
  | { t: 'idle' }
  | { t: 'session'; id: string }
  | { t: 'ended'; err?: string };

const content = (m: any): any[] => (Array.isArray(m?.message?.content) ? m.message.content : []);
const oneLine = (t: string): string => t.replace(/\s+/g, ' ').trim().slice(0, 80);

function verdictFrom(text: string): string | undefined {
  const t = text.toUpperCase();
  if (t.includes('REJECT ALL')) return 'REJECT ALL';
  if (t.includes('WINNER')) return 'WINNER';
  if (/\bFAIL\b/.test(t)) return 'FAIL';
  if (/\bPASS\b/.test(t)) return 'PASS';
  return undefined;
}

const patch = (v: ChatView, id: string, p: Partial<StageView>): StageView[] =>
  v.stages.map((s) => (s.id === id ? { ...s, ...p } : s));
const toolsOf = (v: ChatView, id: string): number => v.stages.find((s) => s.id === id)?.tools ?? 0;

export function reduce(v: ChatView, e: ChatEvent): ChatView {
  switch (e.t) {
    case 'user':
      return { ...v, feed: [...v.feed, { kind: 'user', text: e.text }] };
    case 'question':
      return {
        ...v,
        awaitingUser: true,
        phase: v.phase === 'starting' ? 'intake' : v.phase,
        feed: [...v.feed, { kind: 'question', headers: e.q.questions?.map((q) => q.header) ?? [] }],
      };
    case 'answered':
      return { ...v, awaitingUser: false };
    case 'session':
      return { ...v, sessionId: e.id };
    case 'ended':
      return { ...v, phase: 'ended', error: e.err };
    case 'idle':
      return v; // a result segment is a boundary, NOT full completion — driven off DONE.md instead
    case 'sdk':
      return reduceSdk(v, e.m);
  }
}

function reduceSdk(v: ChatView, m: any): ChatView {
  let next = v;

  // 1) register subagent launches so later messages attribute to a stage
  if (m?.type === 'assistant') {
    for (const b of content(m)) {
      if (b.type === 'tool_use' && (b.name === 'Agent' || b.name === 'Task') && b.input?.subagent_type) {
        next = { ...next, launches: { ...next.launches, [b.id]: b.input.subagent_type } };
      }
    }
  }

  const stage: string | null = m?.parent_tool_use_id ? next.launches[m.parent_tool_use_id] ?? null : null;

  if (m?.type === 'assistant') {
    if (stage && m.message?.model) next = { ...next, stages: patch(next, stage, { model: m.message.model }) };

    for (const b of content(m)) {
      if (b.type === 'text' && b.text?.trim()) {
        if (stage === null) {
          // the orchestrator talking — the conversation feed
          next = { ...next, feed: [...next.feed, { kind: 'agent', text: b.text.trim() }] };
        } else {
          const vd = isCritic(stage) ? verdictFrom(b.text) : undefined;
          next = {
            ...next,
            activity: `${label(stage)} › ${oneLine(b.text)}`,
            stages: patch(next, stage, { activity: oneLine(b.text), ...(vd ? { verdict: vd } : {}) }),
          };
        }
      }

      if (b.type === 'tool_use') {
        if ((b.name === 'Agent' || b.name === 'Task') && b.input?.subagent_type) {
          const id: string = b.input.subagent_type;
          // finish whatever else was running, then (re)start this stage
          let stages = next.stages.map((s) =>
            s.status === 'running' && s.id !== id ? { ...s, status: 'done' as StageStatus, activity: undefined } : s,
          );
          stages = stages.map((s) =>
            s.id === id ? { ...s, status: 'running' as StageStatus, round: s.status === 'done' ? s.round + 1 : s.round } : s,
          );
          next = { ...next, stages, phase: 'running', activity: `launching ${label(id)}` };
        } else if (
          b.name === 'Write' &&
          stage === null &&
          typeof b.input?.file_path === 'string' &&
          b.input.file_path.endsWith('DONE.md')
        ) {
          // the orchestrator's final act — the first ad is complete; idle for follow-ups
          const stages = next.stages.map((s) => (s.status === 'running' ? { ...s, status: 'done' as StageStatus } : s));
          next = { ...next, stages, phase: 'idle', activity: 'done — ready for a follow-up' };
        } else if (stage) {
          next = { ...next, stages: patch(next, stage, { tools: toolsOf(next, stage) + 1 }), activity: `${label(stage)} › ${b.name}` };
        } else {
          next = { ...next, activity: b.name };
        }
      }
    }
  }

  if (m?.type === 'result') {
    next = {
      ...next,
      segments: next.segments + 1,
      costUsd: typeof m.total_cost_usd === 'number' ? m.total_cost_usd : next.costUsd,
    };
  }

  return next;
}
