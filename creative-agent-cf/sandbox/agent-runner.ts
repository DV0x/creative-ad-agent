/**
 * Agent Runner for Cloudflare Sandbox
 *
 * This script runs inside the Cloudflare Sandbox container and orchestrates
 * the creative ad generation workflow using the Claude Agent SDK.
 *
 * Environment variables (set by Worker):
 * - PROMPT: User's input prompt
 * - SESSION_ID: Unique session identifier
 * - ANTHROPIC_API_KEY: Claude API key
 * - GEMINI_API_KEY: Gemini API key for image generation
 *
 * CRITICAL: This implementation matches the working local pattern from ai-client.ts
 * Key requirements:
 * 1. Use async generator for prompt (keeps stream alive during MCP tool execution)
 * 2. Do NOT use permissionMode (it interferes with MCP tool execution)
 * 3. Use plain string for systemPrompt (not preset object)
 * 4. Use AbortController for proper cleanup
 */

import { query, createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

/**
 * Emit structured trace events for frontend terminal display.
 *
 * Event types:
 * - tool_start: A tool is being called
 * - tool_end: A tool has completed
 * - message: Assistant text output
 * - phase: Workflow phase change (research, hooks, art, images)
 * - status: General status update
 */
function emitTrace(type: string, data: Record<string, unknown>) {
  const event = {
    type,
    ...data,
    timestamp: new Date().toISOString()
  };
  console.error(`[trace] ${JSON.stringify(event)}`);
}

// Import MCP tool and orchestrator prompt
import { generateAdImages } from "./nano-banana-mcp.js";
import { ORCHESTRATOR_SYSTEM_PROMPT } from "./orchestrator-prompt.js";

// Create MCP server for image generation
const nanoBananaMcp = createSdkMcpServer({
  name: "nano-banana",
  version: "4.0.0",
  tools: [
    tool(
      "generate_ad_images",
      "Generate up to 3 high-quality images using Gemini 3 Pro Image Preview. " +
      "Supports 1K/2K/4K resolution (default 2K), multiple aspect ratios.",
      {
        prompts: z.array(z.string()).max(3).describe(
          "Array of 1-3 image generation prompts"
        ),
        style: z.string().optional().describe("Visual style to apply"),
        aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'])
          .optional()
          .describe("Aspect ratio for images. Default: '1:1'"),
        imageSize: z.enum(['1K', '2K', '4K'])
          .optional()
          .describe("Output resolution. Default: '2K'"),
        sessionId: z.string().optional().describe("Session ID for organizing images")
      },
      async (args) => generateAdImages({
        ...args,
        sessionId: args.sessionId || process.env.SESSION_ID
      })
    )
  ]
});

/**
 * Create async generator for SDK prompt (required for MCP servers)
 *
 * CRITICAL: For MCP tools with long execution times (like Gemini API calls), the generator
 * must stay alive during tool execution. If the generator closes before the tool completes,
 * the SDK will throw "Tool permission stream closed before response received".
 *
 * This pattern is copied from the working local ai-client.ts implementation.
 */
async function* createPromptGenerator(promptText: string, signal: AbortSignal) {
  yield {
    type: "user" as const,
    message: {
      role: "user" as const,
      content: promptText
    },
    parent_tool_use_id: null
  } as any; // Type assertion - SDK will handle session_id and uuid

  // CRITICAL FIX for MCP tools with long execution times:
  // Keep the generator alive while tools are executing. The SDK needs this stream
  // to remain open during MCP tool calls. Without this, long-running tools (>1s)
  // will fail with "Tool permission stream closed before response received" error.
  //
  // The SDK will naturally break out of this loop when the query completes.
  // The abort signal provides a way to explicitly close the generator if needed.
  await new Promise<void>((resolve) => {
    signal.addEventListener('abort', () => resolve());
  });
}

// Main execution
async function main() {
  const prompt = process.env.PROMPT;
  const sessionId = process.env.SESSION_ID;

  if (!prompt) {
    console.error("ERROR: PROMPT environment variable is required");
    process.exit(1);
  }

  if (!sessionId) {
    console.error("ERROR: SESSION_ID environment variable is required");
    process.exit(1);
  }

  console.error(`[agent-runner] Starting agent for session: ${sessionId}`);
  console.error(`[agent-runner] Prompt: ${prompt.substring(0, 100)}...`);
  console.error(`[agent-runner] Environment ready, calling SDK...`);

  // Heartbeat to keep the stream alive during long SDK operations
  // This prevents Cloudflare from timing out due to inactivity
  const heartbeatInterval = setInterval(() => {
    console.error(`[heartbeat] Agent alive - ${new Date().toISOString()}`);
  }, 10000); // Every 10 seconds

  // Emit workflow start
  emitTrace('phase', { phase: 'parse', label: 'Parsing Request' });
  emitTrace('status', { message: `Starting generation for session ${sessionId.slice(0, 8)}` });

  const messages: any[] = [];

  // Create abort controller for generator lifecycle management
  const abortController = new AbortController();

  try {
    // Create async generator for prompt (CRITICAL for MCP tools)
    const promptGenerator = createPromptGenerator(prompt, abortController.signal);

    for await (const message of query({
      prompt: promptGenerator,  // Use async generator, NOT plain string
      options: {
        // Working directory (where .claude/agents and .claude/skills live)
        cwd: '/workspace/agent',

        // System prompt: Plain string format (matches working local implementation)
        systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,

        // Load agents/skills from .claude/ directory
        settingSources: ['project'],

        // MCP servers (image generation)
        mcpServers: { 'nano-banana': nanoBananaMcp },

        // Model settings
        model: 'claude-opus-4-5-20251101',
        maxTurns: 30,

        // Permission handling - original working configuration
        // Note: TypeScript complains but this works at runtime
        permissionMode: 'default',
        canUseTool: async () => true as any,

        // Restrict to only the tools our agent needs
        allowedTools: [
          // Core agent tools
          'Task',           // Launch subagents (research agent)
          'Skill',          // Use skills (hook-methodology, art-style)
          'TodoWrite',      // Track progress

          // File operations
          'Read',           // Read files
          'Write',          // Write files (research, prompts)
          'Edit',           // Edit files
          'Glob',           // Find files by pattern
          'Grep',           // Search file contents

          // System
          'Bash',           // Run shell commands

          // Web (for research agent)
          'WebFetch',       // Fetch URL content
          'WebSearch',      // Search the web

          // MCP tool (image generation)
          'mcp__nano-banana__generate_ad_images'
        ]
      }
    })) {
      messages.push(message);

      // Emit structured trace events for frontend terminal
      if (message.type === 'assistant' && message.message?.content) {
        const content = message.message.content;

        if (Array.isArray(content)) {
          for (const block of content) {
            // Tool invocation
            if (block.type === 'tool_use') {
              const toolName = block.name;
              const toolId = block.id;

              // Detect phase changes based on tool/input
              if (toolName === 'Task') {
                const input = block.input as Record<string, unknown>;
                if (input?.prompt && typeof input.prompt === 'string') {
                  if (input.prompt.toLowerCase().includes('research')) {
                    emitTrace('phase', { phase: 'research', label: 'Research' });
                  }
                }
              } else if (toolName === 'Skill') {
                const input = block.input as Record<string, unknown>;
                const skill = input?.skill as string;
                if (skill?.includes('hook')) {
                  emitTrace('phase', { phase: 'hooks', label: 'Hooks' });
                } else if (skill?.includes('art')) {
                  emitTrace('phase', { phase: 'art', label: 'Art Direction' });
                }
              } else if (toolName === 'mcp__nano-banana__generate_ad_images') {
                emitTrace('phase', { phase: 'images', label: 'Image Generation' });
              }

              // Emit tool start event
              emitTrace('tool_start', {
                tool: toolName,
                toolId,
                input: JSON.stringify(block.input).slice(0, 200)
              });
            }

            // Text output from assistant
            if (block.type === 'text' && block.text) {
              const text = block.text.slice(0, 300);
              emitTrace('message', { text });
            }
          }
        }
      }

      // SDK sends 'result' message when agent completes - emit completion immediately
      // This ensures frontend gets completion status before any timeout can fire
      if (message.type === 'result') {
        emitTrace('phase', { phase: 'complete', label: 'Complete' });
        emitTrace('status', { message: 'Generation complete', success: true });
      }

      // Tool result events - SDK sends these as type:"user" with tool_result in content
      // Use type assertion to handle SDK message structure
      const msg = message as any;
      if (msg.type === 'tool_result' || msg.type === 'user') {
        // Extract tool results from user messages (SDK wraps tool_result in user message)
        const messageContent = msg.message?.content || msg.content;

        if (Array.isArray(messageContent)) {
          for (const part of messageContent) {
            // Look for tool_result parts
            if (part.type === 'tool_result') {
              emitTrace('tool_end', {
                toolId: part.tool_use_id || msg.tool_use_id,
                success: !part.is_error && !msg.is_error
              });

              // Extract image results from tool_result content
              try {
                let contentStr = '';
                const resultContent = part.content;

                if (typeof resultContent === 'string') {
                  contentStr = resultContent;
                } else if (Array.isArray(resultContent)) {
                  // MCP format: [{type: "text", text: "..."}]
                  const textPart = resultContent.find((p: any) => p.type === 'text');
                  if (textPart?.text) {
                    contentStr = textPart.text;
                  }
                }

                if (contentStr.includes('"images"')) {
                  const parsed = JSON.parse(contentStr);
                  if (parsed.images && Array.isArray(parsed.images)) {
                    for (const img of parsed.images) {
                      if (img.urlPath && !img.error) {
                        emitTrace('image', {
                          id: img.id,
                          urlPath: img.urlPath,
                          prompt: img.prompt,
                          filename: img.filename
                        });
                      }
                    }
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Keep original progress output for backwards compatibility
      console.error(`[progress] ${JSON.stringify(message)}`);
    }

    // Clean up: abort the generator and stop heartbeat when query completes
    abortController.abort();
    clearInterval(heartbeatInterval);

    // Emit completion
    emitTrace('phase', { phase: 'complete', label: 'Complete' });
    emitTrace('status', { message: 'Generation complete', success: true });

    // Final output (goes to stdout, parsed by Worker)
    const output = {
      sessionId,
      messages,
      result: messages.find(m => m.type === 'result'),
      success: true
    };

    console.log(JSON.stringify(output));

  } catch (error: any) {
    // Clean up on error
    abortController.abort();
    clearInterval(heartbeatInterval);

    console.error(`[agent-runner] Error: ${error.message}`);
    console.error(`[agent-runner] Stack: ${error.stack}`);
    console.error(`[agent-runner] Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);

    const errorOutput = {
      sessionId,
      messages,
      error: error.message,
      stack: error.stack,
      success: false
    };

    console.log(JSON.stringify(errorOutput));
    process.exit(1);
  }
}

main();
