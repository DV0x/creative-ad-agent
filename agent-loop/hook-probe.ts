/**
 * Isolate the hook failure: does PreToolUse fire for a SUBAGENT's tool calls,
 * is `agent_id` populated, and does a deny actually BLOCK the call?
 * Caps pings at 1; the subagent is told to ping 4×. Cheap (a few Haiku calls).
 */
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
delete process.env.ANTHROPIC_API_KEY;

const testMcp = createSdkMcpServer({
  name: 'test',
  version: '1.0.0',
  tools: [tool('ping', 'returns pong', {}, async () => ({ content: [{ type: 'text', text: 'pong' }] }))],
});

const seen: any[] = [];
const streamTools: any[] = [];
let pingsReachingHook = 0;
let pongs = 0;

for await (const m of query({
  prompt: "Use the 'pinger' subagent to ping the test server 4 times, then report back exactly what it returned each time.",
  options: {
    model: 'claude-haiku-4-5-20251001',
    systemPrompt: "Delegate to the 'pinger' subagent via the Agent tool, WAIT for its full result, then report what it returned. Do not call tools yourself.",
    settingSources: [],
    strictMcpConfig: true,
    mcpServers: { test: testMcp },
    allowedTools: ['Agent', 'Task', 'mcp__test__ping'],
    agents: {
      pinger: {
        description: 'pings the test server',
        prompt: 'Call mcp__test__ping FOUR times in a row, reporting each result. Keep going until you have 4 results.',
        tools: ['mcp__test__ping'],
        mcpServers: ['test'],
        model: 'claude-haiku-4-5-20251001',
      },
    },
    hooks: {
      PreToolUse: [
        {
          hooks: [
            async (input: any) => {
              seen.push({ tool: input?.tool_name, agent_id: input?.agent_id ?? null, agent_type: input?.agent_type ?? null });
              if (input?.tool_name === 'mcp__test__ping') {
                pingsReachingHook++;
                if (pingsReachingHook > 1) {
                  return {
                    hookSpecificOutput: {
                      hookEventName: 'PreToolUse' as const,
                      permissionDecision: 'deny' as const,
                      permissionDecisionReason: 'cap: only 1 ping allowed',
                    },
                  };
                }
              }
              return { continue: true as const };
            },
          ],
        },
      ],
    },
    maxTurns: 12,
  },
})) {
  if (m.type === 'assistant') {
    for (const b of ((m as any).message?.content ?? []) as any[]) {
      if (b.type === 'tool_use') streamTools.push({ tool: b.name, parent: (m as any).parent_tool_use_id ?? null });
    }
  }
  if (m.type === 'user') {
    for (const b of ((m as any).message?.content ?? []) as any[]) {
      if (b.type === 'tool_result' && JSON.stringify(b.content ?? '').includes('pong')) pongs++;
    }
  }
}

console.log('\n──── HOOK PROBE RESULT ────');
console.log('hook fired at all?         ', seen.length > 0, `(${seen.length} PreToolUse events)`);
console.log('inputs the hook saw:       ', JSON.stringify(seen));
console.log('STREAM tool_use events:    ', JSON.stringify(streamTools), '  ← did the subagent actually ping? (parent != null)');
console.log('ping calls that reached hook:', pingsReachingHook);
console.log('pongs the subagent received: ', pongs);
console.log('\nVERDICT:');
const subagentPinged = streamTools.some((t) => t.tool === 'mcp__test__ping' && t.parent);
if (!subagentPinged) console.log('  ⚠️ subagent never pinged in-stream → probe inconclusive (subagent did not run)');
else if (pingsReachingHook === 0) console.log('  ✅ CONFIRMED: subagent pinged but the hook NEVER saw it → PreToolUse does NOT fire for subagent tool calls in 0.3.195');
else console.log('  hook DID see subagent pings → hook works for subagents; bug is elsewhere');
