/**
 * Throwaway: non-interactive smoke of the REAL session bridge, intake-only (no pipeline).
 * Auto-answers whatever the orchestrator asks (picks option 1). Proves, without a TTY:
 *   • AskUserQuestion actually routes to our canUseTool
 *   • the answer round-trips back into the same loop
 *   • the orchestrator does intake and writes founder-facts.md, then DONE.md
 *
 *   tsx chat/_intake-smoke.ts [url]
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, createRunDir, writeFounderStub, stageBinderRefs } from './setup.ts';
import { ChatSession, type AskQuestions, type AskAnswers } from './session.ts';
import { TraceLogger } from '../trace.ts';

loadEnv();
const url = process.argv[2] ?? 'https://thewholetruthfoods.com';
const order: string[] = []; // intake-only — no research/comp/strategy/cell
const runDir = createRunDir(url);
writeFounderStub(runDir, url);
stageBinderRefs(runDir, order);
const logger = new TraceLogger(runDir);
const donePath = join(runDir, 'DONE.md');
const facts = join(runDir, 'founder-facts.md');

let asked = 0;
let closed = false;

const session = new ChatSession(
  { brandUrl: url, runDir, order, mode: 'surface', logger },
  {
    onMessage: (m) => {
      // intake-only completion: a result segment once DONE.md exists → close the held-open stream
      if (m?.type === 'result' && existsSync(donePath) && !closed) {
        closed = true;
        session.end();
      }
    },
    onProgress: (line) => process.stdout.write(`  ${line}\n`),
    onQuestion: (q: AskQuestions) => {
      asked += q.questions?.length ?? 0;
      process.stdout.write(`\n❓ AskUserQuestion fired — ${q.questions?.length ?? 0} question(s):\n`);
      const answers: AskAnswers = {};
      for (const qq of q.questions ?? []) {
        const pick = qq.options?.[0]?.label ?? 'n/a';
        answers[qq.question] = pick;
        process.stdout.write(`   • [${qq.header}] ${qq.question} → auto-picking "${pick}"\n`);
      }
      session.answer(answers);
    },
    onSessionId: (id) => process.stdout.write(`session id: ${id}\n`),
    onEnd: (err) => {
      logger.finalize();
      process.stdout.write(`\n==== intake smoke ${err ? 'ERROR: ' + err.message : 'done'} ====\n`);
      process.stdout.write(`AskUserQuestion fired: ${asked > 0 ? 'YES' : 'NO'} (${asked} question(s))\n`);
      process.stdout.write(`founder-facts.md written: ${existsSync(facts)}\n`);
      process.stdout.write(`DONE.md: ${existsSync(donePath) ? readFileSync(donePath, 'utf8').trim() : 'MISSING'}\n`);
      if (existsSync(facts)) {
        process.stdout.write(`\n--- founder-facts.md (first 1200 chars) ---\n`);
        process.stdout.write(readFileSync(facts, 'utf8').slice(0, 1200) + '\n');
      }
      process.exit(0);
    },
  },
);

setTimeout(() => {
  process.stdout.write('\n⏱️ smoke timeout — closing\n');
  session.end();
}, 6 * 60 * 1000);

void session.run();
session.send(
  `My brand is ${url}. Read the site first, then ask me what you need to know using AskUserQuestion, then write founder-facts.md.`,
);
