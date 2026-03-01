import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { nanoBananaMcpServer } from './nano-banana-mcp.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './orchestrator-prompt.js';

const prompt = process.env.PROMPT!;
const sessionId = process.env.SESSION_ID!;
const resumeSdkSessionId = process.env.RESUME_SDK_SESSION_ID || undefined;
const cwd = '/app/agent';

const baseOptions: Partial<Options> = {
  cwd,
  model: 'claude-haiku-4-5-20251001',
  maxTurns: 30,
  settingSources: ['user', 'project'],
  allowedTools: [
    'Task', 'Skill', 'TodoWrite',
    'WebFetch', 'WebSearch', 'Read', 'Write',
    'Bash', 'Edit', 'Glob', 'Grep',
    'mcp__nano-banana__generate_ad_images',
  ],
  systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
  mcpServers: { 'nano-banana': nanoBananaMcpServer },
};

const resumeOptions = resumeSdkSessionId ? { resume: resumeSdkSessionId } : {};
const options = { ...baseOptions, ...resumeOptions };

const abortController = new AbortController();

async function* createPrompt() {
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: prompt },
    parent_tool_use_id: null,
  };
  // Hold generator open until query() completes
  if (!abortController.signal.aborted) {
    await new Promise<void>(resolve => {
      abortController.signal.addEventListener('abort', () => resolve(), { once: true });
    });
  }
}

try {
  for await (const message of query({ prompt: createPrompt(), options })) {
    process.stdout.write(JSON.stringify(message) + '\n');
    if (message.type === 'result') {
      abortController.abort();
      break;
    }
  }
} catch (err: any) {
  // Resume failed — fall back to fresh session
  if (resumeSdkSessionId && err?.message?.includes('resume')) {
    console.error(`Resume failed, starting fresh: ${err.message}`);
    const freshOptions = { ...baseOptions };
    for await (const message of query({ prompt: createPrompt(), options: freshOptions })) {
      process.stdout.write(JSON.stringify(message) + '\n');
      if (message.type === 'result') {
        abortController.abort();
        break;
      }
    }
  } else {
    throw err;
  }
}

process.exit(0);
