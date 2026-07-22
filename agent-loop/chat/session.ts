/**
 * chat/session.ts — the interactive bridge between the ink UI and the Agent SDK.
 *
 * It runs the SAME orchestrator as the headless pipeline (via buildBaseOptions, so agents /
 * MCP grants / hooks / guards are byte-identical), but in a HELD-OPEN streaming session:
 *
 *   • Input is a queue-backed async generator that stays open — it yields the user's typed
 *     lines (the first URL, plain-question answers, follow-ups) and PARKS otherwise. It closes
 *     only on end(), NOT on DONE.md, so the same live session takes follow-ups (streaming_input.md).
 *   • The agent's clarifying questions arrive through `canUseTool` (toolName === 'AskUserQuestion').
 *     We surface them to the UI (onQuestion), park on a promise, and resolve it when the UI calls
 *     answer(). The answer returns as the tool result INSIDE the same loop — no turn-boundary guessing.
 *   • Every SDK message is forwarded to onMessage (the reducer builds the live view) and logged.
 *   • The SDK writes its own session diary to ~/.claude/projects/…; we just capture the session_id
 *     into runDir/session.json so a later `--resume` can reopen the conversation.
 *
 * The watchdog closes a wedged run, but NEVER while a human is mid-answer (awaitingUser).
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildBaseOptions, emitProgress } from '../pipeline.ts';
import type { Mode } from '../stages.ts';
import type { TraceLogger } from '../trace.ts';

/** The AskUserQuestion input shape the SDK hands our callback (Handling-approvals-user-input.md:483). */
export interface AskQuestion {
  question: string;
  header: string;
  options: Array<{ label: string; description?: string; preview?: string }>;
  multiSelect?: boolean;
}
export interface AskQuestions {
  questions: AskQuestion[];
}
/** answers: question TEXT → chosen option LABEL (array/joined for multi-select; free text = the typed value). */
export type AskAnswers = Record<string, string | string[]>;

export interface ChatSessionArgs {
  brandUrl: string;
  runDir: string;
  order: string[];
  mode: Mode;
  logger: TraceLogger;
  /** Reopen a past conversation: the SDK session id from runDir/session.json. The orchestrator
   *  wakes with its full history (intake, verdicts, the lot) and the follow-up router applies. */
  resumeSessionId?: string;
  /** Pipeline seam (S155): supply a different Options builder (e.g. the lite pipeline) and the
   *  session drives it with the same held-open stream / AskUserQuestion wiring / watchdog.
   *  Omitted = the heavy loop's buildBaseOptions, exactly as before. */
  buildOptions?: (io: {
    canUseTool: Options['canUseTool'];
    onProgress?: (line: string) => void;
    resumeSessionId?: string;
  }) => Options;
}

export interface ChatSessionEvents {
  /** Every SDK message — the reducer folds these into the live view. */
  onMessage: (m: any) => void;
  /** Simple one-line activity/log strings. */
  onProgress?: (line: string) => void;
  /** The agent asked something: render it, then call session.answer(...). */
  onQuestion: (q: AskQuestions) => void;
  /** A result segment landed — the orchestrator is idle, ready for a follow-up. */
  onIdle?: () => void;
  /** The SDK session id (captured once, at init). */
  onSessionId?: (id: string) => void;
  /** The query loop ended (user quit / watchdog / error). */
  onEnd?: (err?: Error) => void;
}

const WEDGE_MS = 45 * 60 * 1000; // close a session with no activity this long — unless awaiting a human

export class ChatSession {
  private inbox: any[] = []; // queued user messages waiting to be yielded into the live stream
  private wake: (() => void) | null = null; // resolves the parked generator when input/end arrives
  private ended = false;
  private answerResolver: ((a: AskAnswers) => void) | null = null;
  /** True while the orchestrator is blocked on a human answer (intake / clarify). The watchdog reads it. */
  awaitingUser = false;
  sessionId: string | null = null;

  constructor(private args: ChatSessionArgs, private events: ChatSessionEvents) {}

  /** The user typed a line — the first URL, an answer to a plain-text question, or a follow-up. */
  send(text: string): void {
    this.inbox.push({ type: 'user', message: { role: 'user', content: text }, parent_tool_use_id: null });
    this.wake?.();
    this.wake = null;
  }

  /** The UI collected the AskUserQuestion selections — resolve the parked callback. */
  answer(answers: AskAnswers): void {
    this.awaitingUser = false;
    this.answerResolver?.(answers);
    this.answerResolver = null;
  }

  /** End the chat — closes the held-open input stream so query() returns. */
  end(): void {
    this.ended = true;
    this.wake?.();
    this.wake = null;
  }

  /** The live SDK query handle — held so a dying host can interrupt the CLI child. */
  private q: any = null;

  /** HARD stop: interrupt the SDK's CLI subprocess mid-flight, then close the
   *  stream. end() alone only closes stdin — and the CLI treats stdin EOF as
   *  "finish the current run", so a killed host leaves an ORPHANED agent running
   *  with no hooks, no validators, and no MCP tools (S155 F32: run 3's orphan
   *  wrote 14 fabricated picks over ~11 unsupervised minutes). Additive only —
   *  no existing behavior changes unless this is called. */
  async interrupt(): Promise<void> {
    try { await this.q?.interrupt?.(); } catch { /* child may already be gone */ }
    this.end();
  }

  // AskUserQuestion is deliberately NOT in allowedTools, so it routes here (our real tools are
  // auto-approved and never reach the callback — Handling-approvals-user-input.md:422).
  private canUseTool: NonNullable<Options['canUseTool']> = async (toolName, input) => {
    if (toolName === 'AskUserQuestion') {
      const q = input as unknown as AskQuestions;
      this.awaitingUser = true;
      this.events.onProgress?.(`❓ agent is asking (${q.questions?.length ?? 0} question(s))`);
      const answers = await new Promise<AskAnswers>((resolve) => {
        this.answerResolver = resolve;
        this.events.onQuestion(q);
      });
      return { behavior: 'allow', updatedInput: { questions: q.questions, answers } };
    }
    // Anything else that reaches here (shouldn't, given allowedTools) — allow unchanged.
    return { behavior: 'allow', updatedInput: input as Record<string, unknown> };
  };

  // Held-open input: yield queued lines as they arrive, park otherwise. Closes only on end().
  private async *promptStream(): AsyncGenerator<any> {
    while (!this.ended) {
      while (this.inbox.length) yield this.inbox.shift();
      if (this.ended) break;
      await new Promise<void>((resolve) => {
        this.wake = resolve;
      });
    }
  }

  async run(): Promise<void> {
    const { brandUrl, runDir, order, mode, logger, resumeSessionId } = this.args;
    const options = this.args.buildOptions
      ? this.args.buildOptions({ canUseTool: this.canUseTool, onProgress: this.events.onProgress, resumeSessionId })
      : buildBaseOptions({
          brandUrl,
          runDir,
          order,
          mode,
          onProgress: this.events.onProgress,
          canUseTool: this.canUseTool,
          interactive: true,
          resumeSessionId,
        });

    let lastActivity = Date.now();
    const watchdog = setInterval(() => {
      if (!this.awaitingUser && Date.now() - lastActivity > WEDGE_MS) {
        this.events.onProgress?.('⏱️ no activity for 45 min — closing session');
        this.end();
      }
    }, 30_000);

    try {
      this.q = query({ prompt: this.promptStream(), options });
      for await (const m of this.q as any) {
        lastActivity = Date.now();
        logger.record(m);
        this.events.onMessage(m);
        if (this.events.onProgress) emitProgress(m, this.events.onProgress);

        if (m?.type === 'system' && m?.subtype === 'init' && m?.session_id && !this.sessionId) {
          this.sessionId = m.session_id;
          writeFileSync(
            join(runDir, 'session.json'),
            JSON.stringify({ sessionId: m.session_id, brandUrl, order, startedAt: new Date().toISOString() }, null, 2),
          );
          this.events.onSessionId?.(m.session_id);
        }
        if (m?.type === 'result') this.events.onIdle?.();
      }
      this.events.onEnd?.();
    } catch (e: any) {
      this.events.onEnd?.(e instanceof Error ? e : new Error(String(e)));
    } finally {
      clearInterval(watchdog);
    }
  }
}
