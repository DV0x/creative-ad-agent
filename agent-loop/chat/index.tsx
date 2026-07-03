/**
 * chat/index.tsx — the demo entry point.
 *
 *   npm run chat                         # asks for the brand URL, then runs interactively
 *   npm run chat -- https://brand.com    # starts straight from the URL
 *   npm run chat -- https://brand.com --mode deep
 *
 * Loads env (strips ANTHROPIC_API_KEY so the Max OAuth login wins), verifies the required
 * keys, then mounts the ink app. Stray console output is redirected to chat-debug.log so it
 * can never corrupt the live terminal UI.
 */
import { render } from 'ink';
import { appendFileSync } from 'node:fs';
import { App } from './App.tsx';
import { loadEnv, missingKeys } from './setup.ts';
import { STAGE_ORDER, type Mode } from '../stages.ts';

loadEnv();

const args = process.argv.slice(2);
const positionals = args.filter((a) => !a.startsWith('--'));
const url = positionals[0]; // optional — App will ask if absent
const modeArg = args.find((a) => a.startsWith('--mode='))?.split('=')[1] ?? (args.includes('--mode') ? args[args.indexOf('--mode') + 1] : undefined);
const mode: Mode = modeArg === 'deep' ? 'deep' : 'surface';
const order = [...STAGE_ORDER];

const miss = missingKeys(order);
if (miss.length) {
  console.error(`missing required env: ${miss.join(', ')} (expected in repo-root .env / .env.local)`);
  process.exit(1);
}

// Protect the ink UI: after this point, any console.* from the SDK / MCP servers / deps goes
// to a debug file instead of stdout (where it would tear the live display apart).
const dbg = (...a: any[]) => {
  try {
    appendFileSync('chat-debug.log', a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ') + '\n');
  } catch {
    /* ignore */
  }
};
console.log = dbg;
console.error = dbg;
console.warn = dbg;
console.info = dbg;

render(<App initialUrl={url} order={order} mode={mode} />);
