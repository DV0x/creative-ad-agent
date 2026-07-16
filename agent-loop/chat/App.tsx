/**
 * chat/App.tsx — the ink terminal UI (Claude-Code-style).
 *
 * Top→bottom: header (brand · phase · cost) · live scoreboard (one row per stage, critic
 * verdicts inline) · conversation feed · a STATUS BAR that always shows whether the agent is
 * working (animated spinner + what it's doing + a ticking timer + running cost) · and a
 * bordered input box. When the agent asks something, the picker replaces the input box.
 * All state comes from the pure reducer; these components only render it.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ChatSession, type AskQuestions, type AskAnswers } from './session.ts';
import { initView, reduce, type ChatView, type ChatEvent, type StageView, type FeedItem } from './reducer.ts';
import { createRunDir, writeFounderStub, stageBinderRefs } from './setup.ts';
import { TraceLogger } from '../trace.ts';
import type { Mode } from '../stages.ts';

const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const fmtDur = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function statusMark(s: StageView, frame: number): { icon: string; color?: string } {
  switch (s.status) {
    case 'done':
      return { icon: '✓', color: 'green' };
    case 'running':
      return { icon: SPIN[frame % SPIN.length], color: 'yellow' };
    case 'failed':
      return { icon: '✗', color: 'red' };
    default:
      return { icon: '○', color: 'gray' };
  }
}

const verdictColor = (v: string): string => (/WINNER|PASS/.test(v) ? 'green' : /REJECT|FAIL/.test(v) ? 'red' : 'yellow');
const shortModel = (m?: string): string => (!m ? '' : m.includes('opus') ? 'opus' : m.includes('sonnet') ? 'sonnet' : m.includes('haiku') ? 'haiku' : m);

function Header({ view }: { view: ChatView }) {
  const phaseColor =
    view.phase === 'idle' ? 'green' : view.phase === 'ended' ? 'gray' : view.phase === 'intake' ? 'cyan' : 'yellow';
  return (
    <Box justifyContent="space-between">
      <Text>
        <Text bold color="magenta">
          creative-agent
        </Text>
        <Text dimColor> · {view.brand}</Text>
      </Text>
      <Text>
        <Text color={phaseColor}>{view.phase}</Text>
        <Text dimColor> · ${view.costUsd.toFixed(2)}</Text>
      </Text>
    </Box>
  );
}

function Scoreboard({ view, frame }: { view: ChatView; frame: number }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {view.stages.map((s) => {
        const m = statusMark(s, frame);
        return (
          <Text key={s.id}>
            <Text color={m.color}>{m.icon} </Text>
            <Text color={s.status === 'pending' ? 'gray' : undefined}>{s.label.padEnd(15)}</Text>
            <Text dimColor> {shortModel(s.model).padEnd(6)}</Text>
            {s.tools > 0 ? <Text dimColor> {String(s.tools).padStart(2)} tools</Text> : <Text dimColor>{'        '}</Text>}
            {s.round > 0 ? <Text color="yellow"> ↻{s.round}</Text> : null}
            {s.verdict ? (
              <Text color={verdictColor(s.verdict)} bold>
                {'  '}
                {s.verdict}
              </Text>
            ) : null}
          </Text>
        );
      })}
    </Box>
  );
}

function feedLine(f: FeedItem): { prefix: string; color: string; text: string; dim?: boolean } {
  switch (f.kind) {
    case 'agent':
      return { prefix: '◆', color: 'magenta', text: f.text };
    case 'user':
      return { prefix: '›', color: 'cyan', text: f.text };
    case 'question':
      return { prefix: '?', color: 'yellow', text: `asked: ${f.headers.join(' · ')}` };
    case 'note':
      return { prefix: '·', color: 'gray', text: f.text, dim: true };
    case 'image':
      return { prefix: '🖼', color: 'green', text: `rendered ad → ${f.url}`, dim: true };
  }
}

function Feed({ view }: { view: ChatView }) {
  const items = view.feed.slice(-7);
  return (
    <Box flexDirection="column" marginTop={1}>
      {items.map((f, i) => {
        const l = feedLine(f);
        return (
          <Box key={i}>
            <Text color={l.color}>{l.prefix} </Text>
            <Text dimColor={l.dim} wrap="wrap">
              {l.text.length > 240 ? l.text.slice(0, 240) + '…' : l.text}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}

// The "is it alive?" bar — an animated spinner + what it's doing + a ticking timer + cost,
// or a clear "your turn / done" state. Always visible (except while a question is on screen).
function StatusBar({ view, frame, startMs }: { view: ChatView; frame: number; startMs: number }) {
  const elapsed = startMs ? fmtDur(Date.now() - startMs) : '0:00';
  const cost = `$${view.costUsd.toFixed(2)}`;
  if (view.phase === 'ended')
    return (
      <Box marginTop={1}>
        <Text color="gray">
          ■ session ended · {elapsed} · {cost}
        </Text>
      </Box>
    );
  if (view.phase === 'idle')
    return (
      <Box marginTop={1}>
        <Text color="green">✓ ready</Text>
        <Text dimColor>
          {' '}
          — ask for a change or a new direction · {elapsed} · {cost}
        </Text>
      </Box>
    );
  return (
    <Box marginTop={1}>
      <Text color="yellow">{SPIN[frame % SPIN.length]} </Text>
      <Text bold color="yellow">
        working
      </Text>
      <Text dimColor>
        {' '}
        · {view.activity || 'thinking…'} · {elapsed} · {cost}
      </Text>
    </Box>
  );
}

function Prompt({
  input,
  setInput,
  onSubmit,
  view,
}: {
  input: string;
  setInput: (s: string) => void;
  onSubmit: (s: string) => void;
  view: ChatView | null;
}) {
  const working = !!view && view.phase !== 'idle' && view.phase !== 'ended';
  const label = !view ? 'url' : view.phase === 'idle' ? 'follow-up' : 'message';
  return (
    <Box borderStyle="round" borderColor={working ? 'gray' : 'cyan'} paddingX={1} marginTop={1}>
      <Text color={working ? 'gray' : 'cyan'}>{label} › </Text>
      <TextInput
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        placeholder={working ? 'type to queue a note… (esc to quit)' : 'type and press enter… (esc to quit)'}
      />
    </Box>
  );
}

function Question({ q, onAnswer }: { q: AskQuestions; onAnswer: (a: AskAnswers) => void }) {
  const questions = q.questions ?? [];
  const [qi, setQi] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<AskAnswers>({});
  const [typing, setTyping] = useState(false);
  const [other, setOther] = useState('');

  const cur = questions[qi];
  const optCount = cur?.options.length ?? 0;
  const OTHER = optCount; // synthetic "Other" row index

  const toggle = (i: number) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const commit = (value: string) => {
    const nextAnswers: AskAnswers = { ...answers, [cur.question]: value };
    if (qi + 1 < questions.length) {
      setAnswers(nextAnswers);
      setQi(qi + 1);
      setCursor(0);
      setChecked(new Set());
      setTyping(false);
      setOther('');
    } else {
      onAnswer(nextAnswers);
    }
  };

  useInput(
    (input, key) => {
      if (typing) return;
      if (key.upArrow) setCursor((c) => (c - 1 + (optCount + 1)) % (optCount + 1));
      else if (key.downArrow) setCursor((c) => (c + 1) % (optCount + 1));
      else if (/^[1-9]$/.test(input)) {
        const i = parseInt(input, 10) - 1;
        if (i < optCount) {
          if (cur.multiSelect) toggle(i);
          else commit(cur.options[i].label);
        }
      } else if (input === ' ' && cur.multiSelect && cursor < optCount) {
        toggle(cursor);
      } else if (key.return) {
        if (cursor === OTHER) {
          setTyping(true);
          return;
        }
        if (cur.multiSelect) {
          const labels = [...checked].sort((a, b) => a - b).map((i) => cur.options[i].label);
          commit(labels.length ? labels.join(', ') : cur.options[cursor].label);
        } else {
          commit(cur.options[cursor].label);
        }
      }
    },
    { isActive: !typing },
  );

  if (!cur) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text>
        <Text color="yellow" bold>
          ? {cur.question}
        </Text>
        <Text dimColor>
          {'  '}[{cur.header}
          {cur.multiSelect ? ' · pick any' : ''}]
        </Text>
      </Text>
      {cur.options.map((o, i) => {
        const sel = cursor === i;
        const chk = cur.multiSelect && checked.has(i);
        return (
          <Text key={i} color={sel ? 'greenBright' : undefined}>
            {sel ? '❯ ' : '  '}
            {cur.multiSelect ? (chk ? '◉ ' : '○ ') : ''}
            {i + 1}. {o.label}
            {o.description ? <Text dimColor> — {o.description}</Text> : null}
          </Text>
        );
      })}
      <Text color={cursor === OTHER ? 'greenBright' : undefined}>
        {cursor === OTHER ? '❯ ' : '  '}✎ Other (type your own)…
      </Text>
      {typing ? (
        <Box>
          <Text color="cyan">{'  › '}</Text>
          <TextInput
            value={other}
            onChange={setOther}
            onSubmit={(t) => {
              if (t.trim()) commit(t.trim());
            }}
          />
        </Box>
      ) : null}
      <Text dimColor>
        {cur.multiSelect ? '↑↓ move · space toggle · enter confirm' : '↑↓ or 1–9 · enter select'}
        {questions.length > 1 ? `  ·  Q ${qi + 1}/${questions.length}` : ''}
      </Text>
    </Box>
  );
}

export function App({ initialUrl, order, mode }: { initialUrl?: string; order: string[]; mode: Mode }) {
  const [view, setView] = useState<ChatView | null>(null);
  const [pendingQ, setPendingQ] = useState<AskQuestions | null>(null);
  const [input, setInput] = useState('');
  const [frame, setFrame] = useState(0);
  const sessionRef = useRef<ChatSession | null>(null);
  const startedRef = useRef(false);
  const startMs = useRef(0);
  const { exit } = useApp();

  const dispatch = useCallback((e: ChatEvent) => setView((v) => (v ? reduce(v, e) : v)), []);

  // spinner + timer tick
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => f + 1), 120);
    return () => clearInterval(t);
  }, []);

  const startSession = useCallback(
    (url: string) => {
      if (startedRef.current) return;
      startedRef.current = true;
      startMs.current = Date.now();
      const runDir = createRunDir(url);
      writeFounderStub(runDir, url);
      stageBinderRefs(runDir, order);
      const logger = new TraceLogger(runDir);
      setView(initView(url, order));
      const session = new ChatSession(
        { brandUrl: url, runDir, order, mode, logger },
        {
          onMessage: (m) => dispatch({ t: 'sdk', m }),
          onQuestion: (q) => {
            setPendingQ(q);
            dispatch({ t: 'question', q });
          },
          onIdle: () => dispatch({ t: 'idle' }),
          onSessionId: (id) => dispatch({ t: 'session', id }),
          onEnd: (err) => {
            dispatch({ t: 'ended', err: err?.message });
            logger.finalize();
          },
        },
      );
      sessionRef.current = session;
      void session.run();
      session.send(`My brand is ${url}. Read the site first, then ask me what you need to know, and build the ad.`);
    },
    [order, mode, dispatch],
  );

  useEffect(() => {
    if (initialUrl) startSession(initialUrl);
  }, [initialUrl, startSession]);

  // ctrl-c / esc → close the session, then exit
  useInput((inputChar, key) => {
    if (key.escape || (key.ctrl && inputChar === 'c')) {
      sessionRef.current?.end();
      exit();
    }
  });

  const onSubmit = (text: string) => {
    const t = text.trim();
    setInput('');
    if (!t) return;
    if (!sessionRef.current) {
      startSession(t); // first line = the URL
      return;
    }
    dispatch({ t: 'user', text: t });
    sessionRef.current.send(t);
  };

  // pre-session: ask for the URL
  if (!view) {
    return (
      <Box flexDirection="column">
        <Text bold color="magenta">
          creative-agent · chat
        </Text>
        <Text dimColor>paste a brand URL to begin</Text>
        <Prompt input={input} setInput={setInput} onSubmit={onSubmit} view={null} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header view={view} />
      <Scoreboard view={view} frame={frame} />
      <Feed view={view} />
      {pendingQ ? (
        <Question
          q={pendingQ}
          onAnswer={(a) => {
            setPendingQ(null);
            dispatch({ t: 'answered', a });
            sessionRef.current?.answer(a);
          }}
        />
      ) : (
        <>
          <StatusBar view={view} frame={frame} startMs={startMs.current} />
          <Prompt input={input} setInput={setInput} onSubmit={onSubmit} view={view} />
        </>
      )}
    </Box>
  );
}
