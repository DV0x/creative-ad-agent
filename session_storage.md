 ---
  1. Session Management: What You Actually Control

  You're correct that you can't manage Anthropic's internal storage, but here's what you DO control:

  ✅ What You Control (Your Layer)

  // YOUR SESSION MANAGER (What you actually manage)
  class SessionManager {
    // ✅ You decide: Which user owns this session
    async createSession(userId: string, metadata: any)

    // ✅ You decide: When sessions expire (8hr, 24hr, etc.)
    private maxSessionAge = 8 * 60 * 60 * 1000;

    // ✅ You decide: Who can access sessions
    async validateAccess(userId: string, sessionId: string)

    // ✅ You decide: When to clean up old sessions
    async cleanupExpiredSessions()

    // ✅ You decide: Store custom metadata
    metadata: {
      campaignName: string,
      url: string,
      forkedFrom?: string  // Your tracking
    }

    // ✅ You control: When to resume vs create new
    async getOrCreateSession(sessionId?: string)

    // ✅ You control: Fork relationships
    async forkSession(baseSessionId: string, purpose: string)
  }

  🤝 What SDK Controls (Anthropic's Layer)

  // ANTHROPIC SDK (What they manage)
  - Session storage (cloud infrastructure)
  - Context management (automatic compaction)
  - Prompt caching (5min/1hr)
  - Session ID generation (UUIDs)
  - Message history persistence
  - Context window optimization

  The Partnership Pattern

  ┌─────────────────────────────────────────────────┐
  │  YOUR CODE (What you manage)                   │
  ├─────────────────────────────────────────────────┤
  │  • User → Session mapping                      │
  │  • Session expiration logic (8hr TTL)          │
  │  • Access control (who can resume?)            │
  │  • Metadata (campaign info, forks)             │
  │  • Database persistence                         │
  │  • Cleanup jobs                                 │
  │  • Cost aggregation per user                   │
  └───────────────┬─────────────────────────────────┘
                  │ You provide: sdk_session_id
                  ↓
  ┌─────────────────────────────────────────────────┐
  │  ANTHROPIC SDK (What they manage)              │
  ├─────────────────────────────────────────────────┤
  │  • Conversation context storage                │
  │  • Message history                              │
  │  • Tool results (agent outputs)                │
  │  • Context compaction                           │
  │  • Prompt caching                               │
  └─────────────────────────────────────────────────┘

  So yes, you DO manage sessions - just at a different layer. You're the "session router" that controls access, while Anthropic is the "session
  storage engine."

  ---
  2. Agent-to-Agent Data Flow: How It Actually Works

  This is the critical part! Here's the complete picture:

  The Data Flow Pattern

  ┌─────────────────────────────────────────────────────────────────┐
  │  MAIN AGENT                                                     │
  │  "Generate campaign for theratefinder.ca"                       │
  └────────────────┬────────────────────────────────────────────────┘
                   │
                   │ 1. Calls Task tool
                   ├─────────────────────────────────────────────►
                   │   {
                   │     subagent_type: "brand-intelligence-analyst",
                   │     prompt: "Analyze theratefinder.ca..."
                   │   }
                   │
  ┌────────────────▼────────────────────────────────────────────────┐
  │  SUBAGENT: brand-intelligence-analyst                           │
  │  - Calls WebFetch(theratefinder.ca)                            │
  │  - Processes website data                                       │
  │  - Generates brand analysis                                     │
  └────────────────┬────────────────────────────────────────────────┘
                   │
                   │ 2. Returns tool_result
                   ├─────────────────────────────────────────────►
                   │   {
                   │     result: '{"brand_name": "TheRateFinder",
                   │               "colors": ["blue","white"],
                   │               "voice": "professional"...}'
                   │   }
                   │
  ┌────────────────▼────────────────────────────────────────────────┐
  │  SESSION CONTEXT (Stored at Anthropic)                          │
  │                                                                  │
  │  Messages:                                                       │
  │  1. user: "Generate campaign..."                                │
  │  2. assistant: [calls Task tool]                                │
  │  3. user: [tool_result with brand analysis JSON] ← STORED HERE  │
  │  4. assistant: [references brand data naturally]                │
  └──────────────────────────────────────────────────────────────────┘
                   │
                   │ 3. Data available in context
                   ├─────────────────────────────────────────────►
                   │   Main agent can now say:
                   │   "Based on the brand analysis showing
                   │    TheRateFinder uses blue/white colors..."
                   │
  ┌────────────────▼────────────────────────────────────────────────┐
  │  MAIN AGENT (Next Turn)                                         │
  │  - Has full access to brand analysis                            │
  │  - Can launch next agents with this context                     │
  │  - Launches customer-psychology-specialist                      │
  │  - That agent can ALSO reference brand analysis!                │
  └──────────────────────────────────────────────────────────────────┘

  ★ Insight ─────────────────────────────────────
  The Magic: Conversation Context as Data Store

  Agent-to-agent data transfer works through conversation context, not explicit data passing:

  1. Subagent returns data → Becomes a tool_result message in the conversation
  2. SDK stores in session → This message is part of the session transcript
  3. Main agent gets context → Claude automatically sees all previous messages
  4. Natural reference → Main agent can reference the data like "Based on the brand analysis from earlier..."

  Key Insight: The data isn't "passed" between agents - it's stored in the shared conversation history that all subsequent turns can access. It's
  like a shared memory space that grows with each turn.

  This is why session forking is so powerful - when you fork, you copy this entire conversation history including all the research data!
  ─────────────────────────────────────────────────

  Technical Message Flow

  // Your campaign generation request creates this message flow:

  // Turn 1: Main agent launches research agents
  {
    type: 'assistant',
    content: [
      { type: 'text', text: "I'll launch 3 research agents in parallel" },
      {
        type: 'tool_use',
        id: 'Task_001',
        name: 'Task',
        input: { subagent_type: 'brand-intelligence-analyst', ... }
      }
    ]
  }

  // Turn 2: Brand analyst returns data (STORED IN SESSION)
  {
    type: 'user',
    content: [
      {
        type: 'tool_result',
        tool_use_id: 'Task_001',
        content: '{"brand_name":"TheRateFinder","colors":["blue"],...}',
        // ↑ This JSON string is now PERMANENTLY in the session context
        is_error: false
      }
    ]
  }

  // Turn 3: Main agent synthesis (HAS ACCESS TO BRAND DATA)
  {
    type: 'assistant',
    content: [
      {
        type: 'text',
        text: "Based on the brand analysis showing TheRateFinder's professional voice and blue color scheme, I'll now generate strategic angles..."
        // ↑ Claude naturally references the data from Turn 2's tool_result
      }
    ]
  }

  // Turn 4: Launch copy creator (ALSO HAS ACCESS TO BRAND DATA)
  {
    type: 'assistant',
    content: [
      {
        type: 'tool_use',
        id: 'Task_004',
        name: 'Task',
        input: {
          subagent_type: 'copy-creator',
          prompt: 'Using the brand voice and colors from the analysis above, generate 10 copy variations...'
          // ↑ Can reference context from Turn 2!
        }
      }
    ]
  }

  Where Data Lives

  ┌─────────────────────────────────────────────────────────────┐
  │  ANTHROPIC'S SESSION STORAGE (Server-Side)                  │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  session_id: "sdk-xyz-789"                                  │
  │                                                             │
  │  messages: [                                                │
  │    { role: 'user', content: 'Generate campaign...' },      │
  │    { role: 'assistant', content: [...tool_use Task...] },  │
  │    { role: 'user', content: [...tool_result...] },  ◄──────┼─ BRAND DATA HERE
  │    { role: 'assistant', content: [...synthesis...] },      │
  │    { role: 'assistant', content: [...tool_use Task...] },  │
  │    { role: 'user', content: [...tool_result...] },  ◄──────┼─ CUSTOMER DATA HERE
  │    { role: 'assistant', content: [...tool_use Task...] },  │
  │    { role: 'user', content: [...tool_result...] },  ◄──────┼─ COMPETITOR DATA HERE
  │    { role: 'assistant', content: [...synthesis...] }       │
  │  ]                                                          │
  │                                                             │
  │  ↑ ALL agents in this session can access this history      │
  └─────────────────────────────────────────────────────────────┘

  Session Forking: Why It's Brilliant

  BASE SESSION after research:
  ├─ messages[0-15]: Research phase
  │  ├─ Brand analysis: {...}
  │  ├─ Customer psychology: {...}
  │  └─ Competitive intel: {...}
  └─ session_id: "sdk-abc-123"

                  FORK POINT
                      ↓
          ┌───────────┴───────────┐
          │                       │
      FORK 1                  FORK 2
      "Emotional angle"       "Social proof angle"
      │                       │
      ├─ COPY of messages     ├─ COPY of messages [0-15]
      │  [0-15]               │  (research data included!)
      │  + New turn:          │  + New turn:
      │  "Focus emotional"    │  "Focus social proof"
      └─ New ID:              └─ New ID:
         "sdk-def-456"           "sdk-ghi-789"

  🎯 Both forks have access to ALL research data!
  💰 No need to re-run expensive WebFetch/analysis
  ⚡ Each fork costs ~$0.05 instead of ~$0.15

  Real Example from Your Code

  Looking at your sdk-server.ts line 356-392:

  const orchestrationPrompt = `
  Generate a complete Meta ad campaign for: ${url}

  PHASE 1 - RESEARCH (Run these 3 agents IN PARALLEL):
  - Use brand-intelligence-analyst to extract brand identity from ${url}
  - Use customer-psychology-specialist to identify pain points
  - Use competitive-intelligence-specialist to analyze competitors

  PHASE 2 - CREATIVE STRATEGY:
  - Synthesize the research into 5 strategic creative angles
    ↑ This step can reference ALL the tool_results from Phase 1!

  PHASE 3 - COPY GENERATION:
  - Use copy-creator agent to generate 2 copy variations for each angle
    ↑ This agent can reference BOTH Phase 1 research AND Phase 2 strategy!
  `;

  What happens:
  1. Main agent launches 3 research agents
  2. Each returns tool_result with JSON → stored in session
  3. Main agent receives next turn → Claude sees ALL 3 tool_results in context
  4. Main agent synthesizes → creates strategy text
  5. Main agent launches copy-creator → that agent sees research + strategy
  6. Copy creator generates variations using ALL previous context

  The data flow is automatic - no explicit data passing needed!

  ---
  Summary

  Session Management: Two-Layer Control

  | Layer      | What's Managed                                            | Who Controls |
  |------------|-----------------------------------------------------------|--------------|
  | Your Layer | User mapping, expiration, access control, metadata, forks | ✅ You        |
  | SDK Layer  | Context storage, caching, message history                 | 🤝 Anthropic |

  Agent Data Flow: Context-Based Communication

  | Mechanism     | How It Works                                |
  |---------------|---------------------------------------------|
  | Data Transfer | Via tool_result messages in conversation    |
  | Data Storage  | In session's message history at Anthropic   |
  | Data Access   | Automatic via conversation context          |
  | Data Format   | JSON strings in tool_result.content         |
  | Data Lifetime | Entire session duration                     |
  | Data Sharing  | All agents in same session can reference it |

  Bottom line:
  - ✅ You manage who, when, and why sessions exist
  - 🤝 SDK manages where and how data is stored
  - 🔄 Agents communicate via shared conversation context
  - 💾 Data persists automatically in session messages
