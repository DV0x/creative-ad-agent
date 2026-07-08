/**
 * Self-test for TraceLogger — runs the orchestrator → subagent → MCP path (same shape as
 * the real loop) through the logger and prints the eval-ready artifacts it produced.
 * Uses a trivial in-process MCP, no API keys beyond the Max login. Run: `npm run trace:selftest`.
 */
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TraceLogger } from './trace.ts';

delete process.env.ANTHROPIC_API_KEY; // force the Max login

const testMcp = createSdkMcpServer({
  name: 'test',
  version: '1.0.0',
  tools: [tool('ping', 'returns pong', {}, async () => ({ content: [{ type: 'text', text: 'pong' }] }))],
});

const runDir = join('runs', '_selftest');
const logger = new TraceLogger(runDir);

for await (const m of query({
  prompt: "Use the 'echo' subagent to ping the test server, then report what it returned.",
  options: {
    model: 'claude-haiku-4-5-20251001',
    systemPrompt: "You orchestrate. Delegate to the 'echo' subagent via the Agent tool. Do NOT call tools yourself.",
    settingSources: [],
    strictMcpConfig: true,
    mcpServers: { test: testMcp },
    allowedTools: ['Agent', 'Task', 'mcp__test__ping'],
    agents: {
      echo: {
        description: 'Pings the test MCP server. Use to verify connectivity.',
        prompt: 'Call mcp__test__ping and report exactly what it returns.',
        tools: ['mcp__test__ping'],
        mcpServers: ['test'],
        model: 'haiku',
      },
    },
    maxTurns: 8,
  },
})) {
  logger.record(m);
}

const summary = logger.finalize();

console.log('\n──────── summary.json ────────');
console.log(JSON.stringify(summary, null, 2));
console.log('\n──────── trace.md ────────');
console.log(readFileSync(join(runDir, 'trace.md'), 'utf8'));
console.log('──────── attribution check ────────');
const mcpStage = summary.stages.find((s: any) => s.mcpCalls > 0);
console.log(`MCP call(s) attributed to stage: ${mcpStage ? mcpStage.stage : '(none)'}`);
console.log(`Anomalies (orchestrator-called-MCP etc.): ${summary.anomalies.length === 0 ? 'none ✅' : summary.anomalies.join('; ')}`);
