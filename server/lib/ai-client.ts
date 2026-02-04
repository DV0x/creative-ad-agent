import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options, SDKUserMessage } from '@anthropic-ai/claude-agent-sdk';
import { SessionManager } from './session-manager.js';
import { nanoBananaMcpServer } from './nano-banana-mcp.js';
import { ORCHESTRATOR_SYSTEM_PROMPT } from './orchestrator-prompt.js';
import { resolve } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

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
    // Fix: Ensure cwd points to agent directory where .claude/ is located
    const projectRoot = process.cwd().endsWith('/server')
      ? resolve(process.cwd(), '..', 'agent')
      : resolve(process.cwd(), 'agent');

    this.defaultOptions = {
      cwd: projectRoot, // Points to agent/ directory where .claude/agents/ is located
      model: 'claude-opus-4-5-20251101',
      maxTurns: 30, // CRITICAL for tool usage!
      // Note: Output token limit is controlled by CLAUDE_CODE_MAX_OUTPUT_TOKENS environment variable
      // Set to 16384 in .env for large campaign responses (SDK default: 8192)
      settingSources: ['user', 'project'], // Load agents from .claude/agents/ and skills from .claude/skills/
      // REMOVED: strictMcpConfig, permissionMode - these were interfering with MCP tool execution

      // CRITICAL: Tool permissions for orchestration and subagents
      // Main agent (orchestrator) only gets Task + coordination tools
      // Subagents inherit ALL tools here and use what they need per their agent definition
      allowedTools: [
        // === ORCHESTRATOR TOOLS (Main agent uses these) ===
        "Task",       // Launch specialized subagents - CORE ORCHESTRATION TOOL
        "Skill",      // Enable skills - agents can consult specialized skills for guidance
        "TodoWrite",  // Track workflow progress (optional but helpful for visibility)

        // === SUBAGENT TOOLS (Only subagents use these via Task tool) ===
        // brand-researcher uses:
        "WebFetch",   // Web content fetching (2-3 targeted searches)
        "Read",       // File reading

        // culture-researcher uses:
        "WebSearch",  // Web searching (12-15 cultural intelligence searches)
        "Read",       // File reading
        "Write",      // Save cultural intelligence report

        // creative-director uses:
        "Read",       // Read research files
        "Write",      // Save campaign brief
        "Glob",       // File pattern matching
        "mcp__nano-banana__generate_ad_images",  // Gemini 2.5 Flash Image generation
        // + Can consult skills: viral-meme-creation, nanobanana-meme-prompting

        // === UTILITY TOOLS (Available if needed) ===
        "Bash",       // Command execution (for subagents if needed)
        "Edit",       // File editing (for refinements)
        "Grep"        // Content search
      ],

      // Custom system prompt - PURE ORCHESTRATION ROLE
      systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
      // MCP servers - nano_banana for image generation
      mcpServers: {
        "nano-banana": nanoBananaMcpServer
      }
      // Note: Removed hooks - observability is handled via message stream processing in sdk-server.ts
    };

    // Use provided session manager or create new one
    this.sessionManager = sessionManager || new SessionManager();

    // Log discovered agents and skills at initialization
    this.logDiscoveredAgents(projectRoot);
    this.logDiscoveredSkills(projectRoot);
  }

  /**
   * Log discovered agents from the project's .claude/agents directory
   */
  private logDiscoveredAgents(projectRoot: string) {
    const agentsDir = resolve(projectRoot, '.claude', 'agents');

    console.log('\n🤖 Checking for Agents...');
    console.log(`   Agents directory: ${agentsDir}`);

    if (!existsSync(agentsDir)) {
      console.log('   ⚠️  Agents directory not found');
      return;
    }

    try {
      const agentFiles = readdirSync(agentsDir)
        .filter(file => file.endsWith('.md'));

      if (agentFiles.length === 0) {
        console.log('   ⚠️  No agent files found');
        return;
      }

      console.log(`   ✅ Found ${agentFiles.length} agent(s):\n`);

      for (const file of agentFiles) {
        const agentPath = resolve(agentsDir, file);
        const content = readFileSync(agentPath, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
          const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
          const toolsMatch = frontmatter.match(/^tools:\s*(.+)$/m);

          const name = nameMatch ? nameMatch[1].trim() : file.replace('.md', '');
          const desc = descMatch ? descMatch[1].trim().substring(0, 60) + '...' : 'No description';
          const tools = toolsMatch ? toolsMatch[1].trim() : 'No tools specified';

          console.log(`   🤖 ${name}`);
          console.log(`      Tools: ${tools}`);
          console.log(`      Desc: ${desc}\n`);
        }
      }
    } catch (error) {
      console.error('   ❌ Error reading agents directory:', error);
    }
  }

  /**
   * Log discovered skills from the project's .claude/skills directory
   */
  private logDiscoveredSkills(projectRoot: string) {
    const skillsDir = resolve(projectRoot, '.claude', 'skills');

    console.log('\n📚 Checking for Skills...');
    console.log(`   Skills directory: ${skillsDir}`);

    if (!existsSync(skillsDir)) {
      console.log('   ⚠️  Skills directory not found');
      return;
    }

    try {
      const skillFolders = readdirSync(skillsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      if (skillFolders.length === 0) {
        console.log('   ⚠️  No skill folders found');
        return;
      }

      console.log(`   ✅ Found ${skillFolders.length} skill(s):\n`);

      for (const folder of skillFolders) {
        const skillPath = resolve(skillsDir, folder, 'SKILL.md');

        if (existsSync(skillPath)) {
          // Read frontmatter to get skill name and description
          const content = readFileSync(skillPath, 'utf-8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
            const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

            const name = nameMatch ? nameMatch[1].trim() : folder;
            const desc = descMatch ? descMatch[1].trim().substring(0, 80) + '...' : 'No description';

            console.log(`   📘 ${name}`);
            console.log(`      Path: ${skillPath}`);
            console.log(`      Desc: ${desc}\n`);
          } else {
            console.log(`   ⚠️  ${folder}: Missing frontmatter in SKILL.md`);
          }
        } else {
          console.log(`   ⚠️  ${folder}: Missing SKILL.md file`);
        }
      }
    } catch (error) {
      console.error('   ❌ Error reading skills directory:', error);
    }
  }

  /**
   * Create async generator for SDK prompt.
   *
   * Yields the user message, then keeps the generator alive until signaled.
   * This is necessary because the SDK's streamInput() only calls endInput()
   * (closing stdin to the CLI subprocess) after the generator returns.
   * If the generator returns too early, stdin closes and the MCP bridge dies
   * — the CLI can no longer receive MCP tool responses.
   *
   * The doneSignal is a SEPARATE AbortController from the SDK's own abort
   * controller (which kills the subprocess). This separation is critical:
   * - doneSignal: "generation finished, generator can close" (lifecycle)
   * - SDK abortController: "user cancelled, kill the process" (cancellation)
   *
   * @param promptText - The user prompt text
   * @param attachments - Optional attachments (images, etc.)
   * @param doneSignal - Signaled when the SDK yields 'result', letting the generator close
   */
  private async *createPromptGenerator(
    promptText: string,
    attachments?: Array<{ type: string; source: any }>,
    doneSignal?: AbortSignal
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
    } as any;

    // Keep generator alive until the query completes. This holds stdin open
    // so the MCP bridge can send tool responses back to the CLI subprocess.
    // The caller signals doneSignal when it receives the 'result' message.
    if (doneSignal) {
      if (!doneSignal.aborted) {
        await new Promise<void>(resolve => {
          doneSignal.addEventListener('abort', () => resolve(), { once: true });
        });
      }
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
    const queryOptions = {
      ...this.defaultOptions,
      ...options,
    };

    console.log('🚀 Starting SDK query with options:', {
      cwd: queryOptions.cwd,
      model: queryOptions.model,
      maxTurns: queryOptions.maxTurns,
      settingSources: queryOptions.settingSources,
      mcpServers: Object.keys(queryOptions.mcpServers || {}),
      skillsEnabled: queryOptions.allowedTools?.includes('Skill')
    });

    const doneController = new AbortController();
    const promptGenerator = this.createPromptGenerator(prompt, attachments, doneController.signal);

    try {
      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        if (message.type === 'result') doneController.abort();
        yield message;
      }
    } finally {
      doneController.abort();
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
    attachments?: Array<{ type: string; source: any }>,
    externalAbortController?: AbortController,
    resumeSdkSessionId?: string
  ) {
    // Get or create session
    const session = await this.sessionManager.getOrCreateSession(sessionId, metadata);

    // Use explicit resume SDK session ID if provided (e.g., from DB for follow-ups),
    // otherwise look up from session manager's in-memory map
    const resumeOptions = resumeSdkSessionId
      ? { resume: resumeSdkSessionId }
      : this.sessionManager.getResumeOptions(session.id);

    // External abort controller enables caller-driven cancellation (e.g., user clicks cancel).
    // Passed to SDK options so aborting kills the CLI subprocess.
    const abortController = externalAbortController || new AbortController();

    const queryOptions = {
      ...this.defaultOptions,
      ...resumeOptions,
      abortController
    };

    console.log(`🔄 Query with session ${session.id}`, {
      hasResume: !!resumeOptions.resume,
      turnCount: session.turnCount
    });

    let sdkSessionIdCaptured = false;
    const doneController = new AbortController();

    try {
      const promptGenerator = this.createPromptGenerator(prompt, attachments, doneController.signal);

      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        // Capture SDK session ID from init message
        if (message.type === 'system' && message.subtype === 'init' && message.session_id && !sdkSessionIdCaptured) {
          await this.sessionManager.updateSdkSessionId(session.id, message.session_id);
          sdkSessionIdCaptured = true;
        }

        // Signal generator to close when result arrives — this lets
        // streamInput() proceed to endInput() and cleanly shut down.
        if (message.type === 'result') doneController.abort();

        await this.sessionManager.addMessage(session.id, message);

        yield { message, sessionId: session.id };
      }

      if (metadata?.oneShot) {
        await this.sessionManager.completeSession(session.id);
      }
    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || abortController.signal.aborted;
      if (!isAbort) {
        console.error(`❌ Query error for session ${session.id}:`, error);
      }
      throw error;
    } finally {
      doneController.abort();
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

    const queryOptions = {
      ...this.defaultOptions,
      resume: baseSession.sdkSessionId,
      forkSession: true,
    };

    let sdkSessionIdCaptured = false;
    const doneController = new AbortController();

    try {
      const promptGenerator = this.createPromptGenerator(prompt, attachments, doneController.signal);

      for await (const message of query({ prompt: promptGenerator, options: queryOptions })) {
        if (message.type === 'system' && message.subtype === 'init' && message.session_id && !sdkSessionIdCaptured) {
          await this.sessionManager.updateSdkSessionId(forkSession.id, message.session_id);
          sdkSessionIdCaptured = true;
          console.log(`🌿 Fork created with SDK session: ${message.session_id}`);
        }

        if (message.type === 'result') doneController.abort();

        await this.sessionManager.addMessage(forkSession.id, message);

        yield {
          message,
          sessionId: forkSession.id,
          baseSessionId: baseSessionId,
          isFork: true
        };
      }

      console.log(`✅ Fork completed: ${forkSession.id}`);
    } catch (error) {
      console.error(`❌ Fork error for session ${forkSession.id}:`, error);
      throw error;
    } finally {
      doneController.abort();
    }
  }
}

// Export singleton instance with default session manager
export const aiClient = new AIClient();