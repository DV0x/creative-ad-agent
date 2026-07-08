/**
 * Throwaway: replay a recorded trace.jsonl through the reducer and print the final view.
 * Proves attribution / stage-completion / verdict-extraction / cost work on REAL messages,
 * with zero ink and zero API cost.
 *   tsx chat/_reducer-test.ts runs/<dir>/trace.jsonl
 */
import { readFileSync } from 'node:fs';
import { initView, reduce, type ChatView, type FeedItem } from './reducer.ts';

const path = process.argv[2];
if (!path) {
  console.error('usage: tsx chat/_reducer-test.ts <trace.jsonl>');
  process.exit(1);
}

let v: ChatView = initView('test-brand', ['research', 'comp', 'strategy', 'cell-generate', 'cell-render']);
const lines = readFileSync(path, 'utf8').split('\n').filter(Boolean);
let parsed = 0;
for (const line of lines) {
  let rec: any;
  try {
    rec = JSON.parse(line);
  } catch {
    continue;
  }
  if (rec?.msg) {
    v = reduce(v, { t: 'sdk', m: rec.msg });
    parsed++;
  }
}

const agentLines = v.feed.filter((f: FeedItem) => f.kind === 'agent') as Array<{ kind: 'agent'; text: string }>;
console.log(`\nreplayed ${parsed} messages from ${path}\n`);
console.log('phase:  ', v.phase);
console.log('cost:   ', '$' + v.costUsd.toFixed(4), '· segments:', v.segments);
console.log('feed:   ', v.feed.length, 'items (', agentLines.length, 'agent )');
console.log('\nscoreboard:');
for (const s of v.stages) {
  const bits = [
    s.status.padEnd(8),
    s.label.padEnd(16),
    `tools=${s.tools}`,
    `round=${s.round}`,
    s.verdict ? `verdict=${s.verdict}` : '',
    s.model ? `(${s.model})` : '',
  ];
  console.log('  ' + bits.join(' ').trimEnd());
}
console.log('\nlast 3 orchestrator feed lines:');
for (const f of agentLines.slice(-3)) console.log('  • ' + f.text.slice(0, 100).replace(/\s+/g, ' '));
console.log('');
