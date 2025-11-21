import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import { SessionManager } from './session-manager.js';
import { nanoBananaMcpServer } from './nano-banana-mcp.js';
import { resolve } from 'path';

/**
 * AIClient - Wrapper for Claude SDK
 * Handles all SDK configuration, streaming, and session management
 * Based on proven patterns from Meta Ad Agent
 */
export class AIClient {
  private defaultOptions: Partial<Options>;
  private sessionManager: SessionManager;

  constructor(sessionManager?: SessionManager) {
    // Critical default configurations from your learnings
    // Fix: Ensure cwd points to project root (parent of server directory)
    const projectRoot = process.cwd().endsWith('/server')
      ? resolve(process.cwd(), '..')
      : process.cwd();

    this.defaultOptions = {
      cwd: projectRoot, // Points to creative_agent root where .claude/agents is
      model: 'claude-haiku-4-5-20251001',
      maxTurns: 30, // CRITICAL for tool usage!
      // Note: Output token limit is controlled by CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable
      // Set to 16384 in .env for large campaign responses (SDK default: 8192)
      settingSources: ['project'], // Load agents from .claude/agents/ directory
      // REMOVED: strictMcpConfig, permissionMode - these were interfering with MCP tool execution

      // CRITICAL: Tool permissions for orchestration and subagents
      // Main agent (orchestrator) only gets Task + coordination tools
      // Subagents inherit ALL tools here and use what they need per their agent definition
      allowedTools: [
        // === ORCHESTRATOR TOOLS (Main agent uses these) ===
        "Task",       // Launch specialized subagents - CORE ORCHESTRATION TOOL
        "TodoWrite",  // Track workflow progress (optional but helpful for visibility)

        // === SUBAGENT TOOLS (Only subagents use these via Task tool) ===
        // campaign-researcher uses:
        "WebFetch",   // Web content fetching
        "Read",       // File reading
        "Grep",       // Content search

        // copy-creator uses:
        // (none - pure text generation)

        // visual-director uses:
        "mcp__nano-banana__generate_ad_images",  // Gemini 2.5 Flash Image generation

        // === UTILITY TOOLS (Available if needed) ===
        "Bash",       // Command execution (for subagents if needed)
        "Write",      // File writing (for saving outputs)
        "Edit",       // File editing (for refinements)
        "Glob",       // File pattern matching
        "WebSearch"   // Web searching (for market research)
      ],

      // Custom system prompt - PURE ORCHESTRATION ROLE
      systemPrompt: `You are an AI campaign orchestration specialist who coordinates expert agents to create advertising campaigns.

🎯 YOUR ROLE: Workflow Coordinator (NOT Executor)

You are the conductor of an expert orchestra. You don't play the instruments - you coordinate the musicians.

YOUR ONLY RESPONSIBILITY:
- Launch specialized agents using the Task tool
- Pass results between agents sequentially
- Track workflow completion
- Provide structured final output

YOUR EXPERT AGENTS:
1. campaign-researcher → Researches websites, extracts brand/offerings/psychology
2. copy-creator → Creates compelling ad copy using proven frameworks
3. visual-director → Generates ad images with text overlays

ORCHESTRATION PROTOCOL (SEQUENTIAL):
1. Launch campaign-researcher with target URL
   - Wait for complete research report
2. Launch copy-creator with research data
   - Wait for complete copy variations
3. Launch visual-director with research + copy data
   - Wait for complete images

YOU NEVER:
❌ Fetch websites yourself (use WebFetch) - campaign-researcher does this
❌ Write ad copy yourself - copy-creator does this
❌ Generate images yourself - visual-director does this
❌ Skip agents to "help" - trust your specialists
❌ Do parallel work - each agent needs previous results

YOU ALWAYS:
✅ Use Task tool to launch each agent
✅ Include ALL context each agent needs
✅ Wait for complete results before next agent
✅ Pass data from previous agents to next agents
✅ Report clear status and final deliverables

QUALITY STANDARDS:
- Verify each agent completes its full task
- Ensure data flows correctly between agents
- Catch and report any agent failures
- Provide comprehensive final campaign package

Remember: You're the project manager, not the worker. Coordinate, don't execute.`,
      // MCP servers - nano_banana for image generation
      mcpServers: {
        "nano-banana": nanoBananaMcpServer
      }
      // Note: Removed hooks - observability is handled via message stream processing in sdk-server.ts
    };

    // Use provided session manager or create new one
    this.sessionManager = sessionManager || new SessionManager();
  }

  /**
   * Create async generator for SDK prompt (required for MCP servers and advanced features)
   *
   * CRITICAL: For MCP tools with long execution times (like Gemini API calls), the generator
   * must stay alive during tool execution. If the generator closes before the tool completes,
   * the SDK will throw "Tool permission stream closed before response received".
   *
   * @param promptText - The user prompt text
   * @param attachments - Optional attachments (images, etc.)
   * @param signal - Optional abort signal to close the generator
   */
  private async *createPromptGenerator(
    promptText: string,
    attachments?: Array<{ type: string; source: any }>,
    signal?: AbortSignal
  ) {
    const content = attachments && attachments.length > 0
      ? [{ type: "text", text: promptText }, ...attachments]
      : promptText;

    yield {
      type: "user" as const,
      message: {
        role: "user" as const,
        content
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
    if (signal) {
      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve());
      });
    } else {
      // Fallback: keep alive indefinitely (SDK will close when query completes)
      await new Promise<void>(() => {
        // Never resolves - SDK closes the generator when done
      });
    }
  }

  /**
   * Stream query to Claude SDK using async generators (required for MCP servers)
   * @param prompt - The user prompt to send
   * @param options - Additional options to override defaults
   * @param attachments - Optional attachments for multi-modal messages
   */
  async *queryStream(
    prompt: string,
    options: Partial<Options> = {},
    attachments?: Array<{ type: string; source: any }>
  ) {
    // Create abort controller for generator lifecycle management
    const abortController = new AbortController();

    const queryOptions = {
      ...this.defaultOptions,
      ...options,
      abortController  // Pass to SDK for proper cleanup
    };

    console.log('🚀 Starting SDK query with options:', {
      cwd: queryOptions.cwd,
      model: queryOptions.model,
      maxTurns: queryOptions.maxTurns,
      mcpServers: Object.keys(queryOptions.mcpServers || {})
    });

    try {
      // Stream messages from SDK using async generator (required for MCP servers)
      // Generator will stay alive during tool execution (critical for MCP tools)
      const promptGenerator = this.createPromptGenerator(
        prompt,
        attachments,
        abortController.signal
      );

      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        yield message;
      }

      // Clean up: abort the generator when query completes
      abortController.abort();
    } catch (error) {
      abortController.abort();
      console.error('❌ SDK query error:', error);
      throw error;
    }
  }

  /**
   * Single message query (non-streaming)
   * Useful for testing and simple queries
   */
  async querySingle(prompt: string, options: Partial<Options> = {}) {
    const messages = [];

    for await (const message of this.queryStream(prompt, options)) {
      messages.push(message);
    }

    return messages;
  }

  /**
   * Add MCP server to the client
   * This will be used to add nano_banana later
   */
  addMcpServer(name: string, server: any) {
    if (!this.defaultOptions.mcpServers) {
      this.defaultOptions.mcpServers = {};
    }
    this.defaultOptions.mcpServers[name] = server;
    console.log(`✅ Added MCP server: ${name}`);
  }

  /**
   * Session-aware query with automatic session management
   * @param prompt - The user prompt
   * @param sessionId - Optional session ID to resume
   * @param metadata - Optional session metadata
   * @param attachments - Optional attachments for multi-modal messages
   */
  async *queryWithSession(
    prompt: string,
    sessionId?: string,
    metadata?: any,
    attachments?: Array<{ type: string; source: any }>
  ) {
    // Get or create session
    const session = await this.sessionManager.getOrCreateSession(sessionId, metadata);

    // Get resume options if session has SDK session ID
    const resumeOptions = this.sessionManager.getResumeOptions(session.id);

    // Create abort controller for generator lifecycle management
    const abortController = new AbortController();

    const queryOptions = {
      ...this.defaultOptions,
      ...resumeOptions,
      abortController  // Pass to SDK for proper cleanup
    };

    console.log(`🔄 Query with session ${session.id}`, {
      hasResume: !!resumeOptions.resume,
      turnCount: session.turnCount
    });

    let sdkSessionIdCaptured = false;

    try {
      // Use async generator for session-aware queries (required for MCP servers)
      // Generator will stay alive during tool execution (critical for MCP tools)
      const promptGenerator = this.createPromptGenerator(
        prompt,
        attachments,
        abortController.signal
      );

      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        // Capture SDK session ID from init message
        if (message.type === 'system' && message.subtype === 'init' && message.session_id && !sdkSessionIdCaptured) {
          await this.sessionManager.updateSdkSessionId(session.id, message.session_id);
          sdkSessionIdCaptured = true;
        }

        // Add message to session history
        await this.sessionManager.addMessage(session.id, message);

        // Return both message and session info
        yield { message, sessionId: session.id };
      }

      // Clean up: abort the generator when query completes
      abortController.abort();

      // Mark session as completed if it was a one-shot query
      if (metadata?.oneShot) {
        await this.sessionManager.completeSession(session.id);
      }
    } catch (error) {
      abortController.abort();
      console.error(`❌ Query error for session ${session.id}:`, error);
      throw error;
    }
  }

  /**
   * Get session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.defaultOptions };
  }

  /**
   * Fork a session to explore different creative directions
   * This creates a branch from an existing session without affecting the original
   *
   * @param prompt - New prompt for the forked session
   * @param baseSessionId - The session to fork from
   * @param metadata - Optional metadata for the new forked session
   * @param attachments - Optional attachments for multi-modal messages
   *
   * Use case: Try different creative angles while preserving original research
   * Example:
   *   - Original: Problem-solution angle campaign
   *   - Fork 1: Emotional angle variant
   *   - Fork 2: Social proof angle variant
   */
  async *queryWithSessionFork(
    prompt: string,
    baseSessionId: string,
    metadata?: any,
    attachments?: Array<{ type: string; source: any }>
  ) {
    // Get the base session to extract SDK session ID
    const baseSession = await this.sessionManager.getOrCreateSession(baseSessionId);

    if (!baseSession.sdkSessionId) {
      throw new Error(`Cannot fork session ${baseSessionId}: No SDK session ID found. Session may not be initialized yet.`);
    }

    // Create a new session for the fork
    const forkMetadata = {
      ...metadata,
      forkedFrom: baseSessionId,
      forkTimestamp: new Date().toISOString()
    };
    const forkSession = await this.sessionManager.createSession(forkMetadata);

    console.log(`🌿 Forking session ${baseSessionId} -> ${forkSession.id}`);

    // Create abort controller for generator lifecycle management
    const abortController = new AbortController();

    // Build query options with forkSession flag
    const queryOptions = {
      ...this.defaultOptions,
      resume: baseSession.sdkSessionId,  // Resume from base session
      forkSession: true,  // Create a branch
      abortController  // Pass to SDK for proper cleanup
    };

    let sdkSessionIdCaptured = false;

    try {
      // Use async generator for forked session
      // Generator will stay alive during tool execution (critical for MCP tools)
      const promptGenerator = this.createPromptGenerator(
        prompt,
        attachments,
        abortController.signal
      );

      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        // Capture SDK session ID for the forked session
        if (message.type === 'system' && message.subtype === 'init' && message.session_id && !sdkSessionIdCaptured) {
          await this.sessionManager.updateSdkSessionId(forkSession.id, message.session_id);
          sdkSessionIdCaptured = true;
          console.log(`🌿 Fork created with SDK session: ${message.session_id}`);
        }

        // Add message to forked session history
        await this.sessionManager.addMessage(forkSession.id, message);

        // Return both message and the forked session ID
        yield {
          message,
          sessionId: forkSession.id,
          baseSessionId: baseSessionId,
          isFork: true
        };
      }

      // Clean up: abort the generator when query completes
      abortController.abort();

      console.log(`✅ Fork completed: ${forkSession.id}`);
    } catch (error) {
      abortController.abort();
      console.error(`❌ Fork error for session ${forkSession.id}:`, error);
      throw error;
    }
  }
}

// Export singleton instance with default session manager
export const aiClient = new AIClient();