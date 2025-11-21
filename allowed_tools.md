 How MCP Tools Work with Subagents - The Mechanism

  1. Tool Inheritance Flow

  query() level:
    ├─ mcpServers: { "nano-banana": nanoBananaMcpServer }
    ├─ allowedTools: ["Read", "Write", "Task", "mcp__nano-banana__..."] ← Controls what exists
    │
    └─ Agent invoked via Task tool
       └─ Agent Definition:
          ├─ tools: undefined  → Inherits ALL from allowedTools ✅
          └─ tools: ["Read"]   → Gets ONLY Read ❌

  2. The Critical Difference

  email-agent (working):
  allowedTools: [
    "Task", "Bash", "Glob", "Grep", "Read", /* ... */
    "mcp__email__search_inbox",      // ← MCP tools explicitly listed!
    "mcp__email__read_emails"
  ],
  mcpServers: {
    "email": customServer
  }

  creative_agent (failing):
  // NO allowedTools field at all!
  mcpServers: {
    "nano-banana": nanoBananaMcpServer
  }

  3. Why This Matters

  According to the SDK docs, when allowedTools is not specified, it defaults to "all tools allowed." However, there's a subtle issue:

  Without allowedTools explicitly listing the MCP tools, the SDK may not properly register them in the tool context when a nested Task execution
  happens.

  The SDK documentation states:
  - Parent level: allowedTools controls what tools are available to be inherited
  - Subagent level: tools field controls what the subagent can access

  When you omit allowedTools at the parent level, the built-in tools (Read, Write, Task, etc.) are automatically available, but MCP tools may not be 
  automatically included in the nested execution context.

  4. The Fix

  Add allowedTools to creative_agent's configuration, explicitly listing MCP tools:

  this.defaultOptions = {
    cwd: projectRoot,
    model: 'claude-sonnet-4-5-20250929',
    maxTurns: 30,
    strictMcpConfig: true,
    permissionMode: 'bypassPermissions',
    settingSources: ['project'],

    // ✅ ADD THIS - Explicit tool registration
    allowedTools: [
      // Built-in tools
      "Task", "Bash", "Read", "Write", "Glob", "Grep",
      "WebFetch", "WebSearch", "TodoWrite",

      // ✅ MCP tools - MUST be explicitly listed!
      "mcp__nano-banana__generate_ad_images"
    ],

    mcpServers: {
      "nano-banana": nanoBananaMcpServer
    }
  };

  This ensures that when Task tool creates a nested execution context for the subagent, the MCP tools are properly registered and available for
  inheritance.