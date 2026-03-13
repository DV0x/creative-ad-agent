import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { nanoBananaMcpServer } from './nano-banana-mcp.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './orchestrator-prompt.js';
import { BlockBuilder } from './block-builder.js';
import type { MessageBlock } from './block-builder.js';
import * as fs from 'fs';
import * as path from 'path';

const prompt = process.env.PROMPT!;
const sessionId = process.env.SESSION_ID!;
const campaignId = process.env.CAMPAIGN_ID || '';
const resumeSdkSessionId = process.env.RESUME_SDK_SESSION_ID || undefined;
const cwd = '/app/agent';

const PROMPT_FILE = '/app/next-prompt.json';
const STATUS_FILE = '/app/agent-status.json';

// Tracks current turn's requestId for unique completion markers
let currentRequestId: string | null = null;

// SDK session ID — captured from system.init message
let sdkSessionId: string | undefined = resumeSdkSessionId;

// ─── Structured trace logging (written to stdout for DO to read) ──

function trace(action: string, data?: Record<string, any>): void {
  const entry: Record<string, any> = {
    type: 'trace',
    component: 'agent',
    action,
    ts: Date.now(),
    pid: process.pid,
  };
  if (campaignId) entry.cid = campaignId;
  if (data) Object.assign(entry, data);
  process.stdout.write(JSON.stringify(entry) + '\n');
}

// Heartbeat — writes a trace line every 30s so the DO alarm can see the agent is alive
// even during long API calls where no SDK messages flow
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let heartbeatCount = 0;

function startHeartbeat(): void {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(() => {
    heartbeatCount++;
    trace('heartbeat', { count: heartbeatCount, sdkSessionId: sdkSessionId || 'none', requestId: currentRequestId || 'initial' });
  }, 30_000);
}

function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ─── Status file for DO health checks ───────────────────────────

function writeStatus(status: 'starting' | 'processing' | 'idle' | 'error') {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({
      status,
      timestamp: Date.now(),
      pid: process.pid,
    }));
  } catch { /* ignore */ }
}

// ─── File-based IPC: wait for next prompt ───────────────────────

function waitForPromptFile(): Promise<{ prompt: string; campaignId: string; requestId: string } | { shutdown: true } | null> {
  return new Promise(resolve => {
    const check = () => {
      if (fs.existsSync(PROMPT_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(PROMPT_FILE, 'utf-8'));
          fs.unlinkSync(PROMPT_FILE);
          resolve(data);
        } catch {
          // Partial write — retry
          setTimeout(check, 500);
        }
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// ─── Options ────────────────────────────────────────────────────

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

// ─── Block-building message processor ────────────────────────────

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  'WebFetch': 'Fetching webpage',
  'WebSearch': 'Searching the web',
  'Read': 'Reading file',
  'Write': 'Writing file',
  'Task': 'Running agent',
  'Skill': 'Using skill',
  'Glob': 'Finding files',
  'Grep': 'Searching code',
  'mcp__nano-banana__generate_ad_images': 'Generating images',
};

function processMessageForBlocks(message: any, blockBuilder: BlockBuilder, textAcc: { text: string }): void {
  if (message.type === 'assistant') {
    const content = message.message?.content;
    if (!Array.isArray(content)) return;

    for (const block of content) {
      if (block.type === 'text' && block.text) {
        textAcc.text += (textAcc.text ? '\n' : '') + block.text;
      } else if (block.type === 'tool_use') {
        // Add tool with friendly name
        const displayName = TOOL_DISPLAY_NAMES[block.name] || block.name;
        blockBuilder.addThinkingChild('tool', displayName);

        // Detect file writes
        if (block.name === 'Write' && block.input?.file_path) {
          const filePath = block.input.file_path as string;
          let fileType: string | null = null;
          if (filePath.includes('research')) fileType = 'research';
          else if (filePath.includes('hook')) fileType = 'hooks';
          else if (filePath.includes('prompt')) fileType = 'prompts';
          if (fileType) {
            trace('file_write', { fileType, path: filePath.substring(0, 100) });
            blockBuilder.addThinkingChild('status', `${fileType}.md created`, 'success');
          }
        }

        // Detect phase from tool usage
        if (block.name === 'Task') {
          const agentType = block.input?.subagent_type;
          if (agentType === 'Explore' || block.input?.description?.toLowerCase().includes('research')) {
            trace('phase', { phase: 'research', tool: 'Task', agentType });
            blockBuilder.openThinkingBlock('Researching');
          }
        } else if (block.name === 'Skill') {
          const skillName = block.input?.skill;
          if (skillName === 'hook-methodology') {
            trace('phase', { phase: 'hooks', tool: 'Skill', skill: skillName });
            blockBuilder.openThinkingBlock('Generating Hooks');
          } else if (skillName === 'art-style') {
            trace('phase', { phase: 'art_direction', tool: 'Skill', skill: skillName });
            blockBuilder.openThinkingBlock('Creating Art Direction');
          }
        } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
          const promptCount = Array.isArray(block.input?.prompts) ? block.input.prompts.length : 0;
          trace('phase', { phase: 'images', tool: 'mcp__nano-banana', promptCount });
          blockBuilder.openThinkingBlock('Generating Images', promptCount);
        }
      }
    }
  } else if (message.type === 'user') {
    const content = message.message?.content;
    if (!Array.isArray(content)) return;

    for (const block of content) {
      if (block.type === 'tool_result') {
        // Check for image results — increment completed images count
        try {
          let resultContent = block.content;
          if (typeof resultContent === 'string') {
            resultContent = JSON.parse(resultContent);
          } else if (Array.isArray(resultContent)) {
            const textPart = resultContent.find((p: any) => p.type === 'text');
            if (textPart?.text) resultContent = JSON.parse(textPart.text);
          }
          if (resultContent?.images && Array.isArray(resultContent.images)) {
            for (const img of resultContent.images) {
              if (img.urlPath || img.url) {
                blockBuilder.incrementCompletedImages();
              }
            }
          }
        } catch {
          // Not an image result
        }
      }
    }
  }
}

// ─── Completion marker ──────────────────────────────────────────

function writeCompletionMarker(blocks: MessageBlock[], text: string): void {
  if (!campaignId) return;

  try {
    // Read tracked images from this turn (written by nano-banana MCP tool).
    const images: { filename: string; path: string }[] = [];
    const trackingFile = '/app/generated-images.jsonl';
    if (fs.existsSync(trackingFile)) {
      const lines = fs.readFileSync(trackingFile, 'utf-8').split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          images.push(JSON.parse(line));
        } catch { /* skip malformed */ }
      }
      // Clear tracking file for next turn
      fs.writeFileSync(trackingFile, '');
    }

    // Read agent output files
    const files: Record<string, string> = {};
    const filePaths: Record<string, string[]> = {
      research: ['/app/agent/files/research/'],
      hooks: ['/app/agent/.claude/skills/hook-methodology/hook-bank/'],
      prompts: ['/app/agent/files/creatives/'],
    };
    for (const [type, dirs] of Object.entries(filePaths)) {
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
          const fp = path.join(dir, f);
          if (fs.statSync(fp).isFile()) {
            files[type] = fs.readFileSync(fp, 'utf-8');
            break; // take first file found per type
          }
        }
      }
    }

    // Write to local disk for reliable reading by DO alarm (no FUSE dependency)
    fs.writeFileSync('/app/turn-result.json', JSON.stringify({ images, files, text, blocks, requestId: currentRequestId || 'initial' }));

    console.log(`[marker] Wrote turn-result.json (${images.length} images, ${Object.keys(files).length} files, ${blocks.length} blocks)`);
  } catch (err: any) {
    console.error(`[marker] Failed to write completion marker: ${err.message}`);
  }
}

// ─── Streaming input generator (multi-turn, SDK keeps context in memory) ───

async function* promptStream() {
  // First turn — yield initial prompt
  yield {
    type: 'user' as const,
    message: { role: 'user' as const, content: prompt },
    parent_tool_use_id: null,
    session_id: sessionId,
  };

  // Subsequent turns — wait for prompt file, yield next prompt
  while (true) {
    writeStatus('idle');
    trace('waiting_for_prompt');
    const data = await waitForPromptFile();
    if (!data || 'shutdown' in data) {
      trace('shutdown', { reason: !data ? 'null_data' : 'shutdown_signal' });
      return; // Generator ends → query() ends → process exits
    }

    // Prepare for next turn
    currentRequestId = data.requestId || null;
    trace('prompt_received', { requestId: currentRequestId || 'null', campaignId: data.campaignId, promptLen: data.prompt.length });

    // Clear stale turn-result.json before starting new turn
    try { fs.unlinkSync('/app/turn-result.json'); } catch {}

    // Sentinel so DO can skip replayed stdout from streamProcessLogs()
    process.stdout.write(JSON.stringify({
      type: 'turn_start',
      requestId: data.requestId,
    }) + '\n');

    writeStatus('processing');

    yield {
      type: 'user' as const,
      message: { role: 'user' as const, content: data.prompt },
      parent_tool_use_id: null,
      session_id: sessionId,
    };
  }
}

// ─── Main: single query() with multi-yield generator ────────────

trace('startup', { sessionId, campaignId, resumeSdkSessionId: resumeSdkSessionId || 'none', promptLen: prompt.length });
writeStatus('starting');
writeStatus('processing');
startHeartbeat();

let blockBuilder = new BlockBuilder();
blockBuilder.openThinkingBlock('Parsing Request');
let textAccumulator = { text: '' };

try {
  for await (const message of query({ prompt: promptStream(), options: baseOptions })) {
    process.stdout.write(JSON.stringify(message) + '\n');

    // Capture SDK session ID from init message
    if (message.type === 'system' && (message as any).subtype === 'init' && (message as any).session_id) {
      sdkSessionId = (message as any).session_id;
      trace('sdk_init', { sdkSessionId });
    }

    // Build blocks from each message (for persistence)
    processMessageForBlocks(message, blockBuilder, textAccumulator);

    if (message.type === 'result') {
      // Turn completed — write completion marker with accumulated blocks/text
      trace('turn_end', { requestId: currentRequestId || 'initial', textLen: textAccumulator.text.length, blocks: blockBuilder.getBlocks().length });
      blockBuilder.closeThinkingBlock('complete');
      const blocks = blockBuilder.getBlocks();
      const text = textAccumulator.text;
      writeCompletionMarker(blocks, text);

      // Generic marker (for alarm log snapshot fallback)
      process.stdout.write(JSON.stringify({ type: 'turn_complete' }) + '\n');
      // Unique per-turn marker (for follow-up completion detection)
      if (currentRequestId) {
        process.stdout.write(`COMPLETION:${currentRequestId}\n`);
      }

      // Reset block builder for next turn
      blockBuilder = new BlockBuilder();
      blockBuilder.openThinkingBlock('Processing Follow-Up');
      textAccumulator = { text: '' };
    }
  }
} catch (err: any) {
  trace('fatal_error', { err: err.message?.substring(0, 300), stack: err.stack?.substring(0, 500) });
  console.error(`[agent-runner] Fatal error: ${err.message}`);
  writeStatus('error');
}

stopHeartbeat();
trace('exit', { sdkSessionId: sdkSessionId || 'none' });
writeStatus('idle');
