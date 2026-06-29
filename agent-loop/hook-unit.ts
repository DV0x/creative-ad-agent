/** Pure-logic test of buildHooks — no API calls. Simulates 20 gathering calls. */
import { buildHooks } from './hook.ts';

const hooks: any = buildHooks({ caps: { research: 15 }, onEvent: () => {} });
const cb = hooks.PreToolUse[0].hooks[0];

async function sim(label: string, input: any) {
  let allowed = 0,
    denied = 0;
  for (let i = 1; i <= 20; i++) {
    const r = await cb({ ...input });
    if (r?.hookSpecificOutput?.permissionDecision === 'deny') denied++;
    else allowed++;
  }
  console.log(`${label}\n   → allowed=${allowed} denied=${denied}  (expect allowed=15 denied=5 when capped)`);
}

await sim("WebFetch · agent_type='research' (cap=15)", { tool_name: 'WebFetch', agent_id: 'a1', agent_type: 'research' });
await sim("WebFetch · agent_type=undefined (no caps key → fallback)", { tool_name: 'WebFetch', agent_id: 'a2' });
await sim("WebFetch · agent_id=undefined (subagent w/o id)", { tool_name: 'WebFetch', agent_type: 'research' });
