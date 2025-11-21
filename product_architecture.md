 Product Architecture Guide: Building Multi-Agent AI Systems

  The Core Pattern: API → Orchestrator → Specialized Agents

  Think of this like building a company:
  - API Layer = Your receptionist (takes requests)
  - Orchestrator = Your CEO (coordinates the team)
  - Specialized Agents = Your department heads (experts at specific tasks)
  - Session Manager = Your project management system (tracks ongoing work)
  - Instrumentor = Your accounting/analytics (tracks costs and performance)

  ---
  Layer 1: The API Layer (Your Product's Front Door)

  What it is: A standard REST API built with Express.js

  What it does:
  - Receives HTTP requests from users/frontend
  - Validates input
  - Routes to appropriate handler
  - Returns structured responses

  Product Decision Point:
  Do you want:
  ├─ REST API? → Use Express/FastAPI
  ├─ GraphQL? → Use Apollo Server
  ├─ WebSocket (real-time)? → Use Socket.io
  └─ Serverless? → Use AWS Lambda/Vercel Functions

  Key Endpoints Pattern:
  POST /generate         // Main action (generate campaign)
  POST /test            // Quick test/playground
  GET  /sessions        // List ongoing work
  POST /sessions/:id/continue  // Resume work
  POST /sessions/:id/fork      // Create variant
  GET  /health          // System status

  ★ Insight ─────────────────────────────────────
  Product Pattern: Always separate your "heavy" operations (like /generate) from "light" operations (like /test). This allows you to:
  - Offer a free tier with /test
  - Charge for /generate
  - Rate-limit differently
  - Scale independently
  ─────────────────────────────────────────────────

  ---
  Layer 2: The AIClient (Your SDK Wrapper)

  What it is: A thin wrapper around Claude SDK that adds your product logic

  Why you need this:
  Raw SDK → Too low-level, repetitive code everywhere
  AIClient Wrapper → Adds your patterns (sessions, streaming, error handling)

  What it handles:

  1. Configuration (your product defaults)
  {
    model: 'claude-sonnet-4-5',  // Your model choice
    maxTurns: 30,                // Prevents infinite loops
    systemPrompt: "...",         // Your product's personality
    mcpServers: {...}            // Your tool integrations
  }
  2. Streaming Pattern
  User Request → AIClient → Async Generator → Stream back results
  2. Why streaming? User sees progress in real-time instead of waiting 5 minutes
  3. Session Integration
  New user → Create session
  Returning user → Resume session
  A/B testing → Fork session

  Product Decision Point:
  How do users interact with your AI?
  ├─ One-shot requests → Simple query function
  ├─ Conversations → Session management (you need this!)
  ├─ Background jobs → Queue + webhook
  └─ Real-time collaboration → WebSocket streaming

  ---
  Layer 3: Session Manager (Your Memory System)

  ★ Insight ─────────────────────────────────────
  Key Product Insight: Sessions are your competitive moat. They enable:
  - Resume functionality = Better UX (users don't start over)
  - A/B testing = Fork from any point
  - User history = Show past campaigns
  - Incremental improvement = "Make this headline stronger"
  - Multi-turn collaboration = Natural conversation
  ─────────────────────────────────────────────────

  What it tracks:

  Session {
    id: "campaign-abc123",           // Your ID (user-facing)
    sdkSessionId: "sdk-xyz789",      // SDK's internal ID

    metadata: {
      url: "example.com",            // Product context
      status: "active/completed",
      campaignName: "Summer Sale"
    },

    messages: [...],                 // Full conversation
    turnCount: 8,                    // How many AI responses

    // Fork tracking
    forkedFrom: "campaign-parent",   // If this is a variant
    forkPurpose: "Try emotional angle"
  }

  Storage Options for Your Product:

  Development:
  └─ JSON files (./sessions/*.json) ✅ Simple, fast

  Production:
  ├─ Redis → Fast, temporary (24-hour expiry)
  ├─ PostgreSQL → Permanent, queryable
  ├─ MongoDB → Flexible schema
  └─ S3 + DynamoDB → Serverless, scalable

  Product Feature Unlocked: Session Forking

  This is your killer feature for creative work:

  Base Campaign ($0.30)
  ├─ Research phase (expensive)
  ├─ Insights gathered
  │
  └─ Fork Point (only $0.10 each)
      ├─ Variant A: Emotional angle
      ├─ Variant B: Data-driven angle
      └─ Variant C: Social proof angle

  Users pay once for research, then cheaply test multiple approaches!

  ---
  Layer 4: The Agent System (Your Expert Team)

  The Architecture:

  Main Agent (CEO/Orchestrator)
     ├─ Has access to all tools (Task, WebFetch, etc.)
     ├─ Can launch subagents
     └─ Synthesizes results
        │
        ├─→ Research Agents (Run in Parallel)
        │   ├─ Brand Intelligence
        │   ├─ Customer Psychology
        │   └─ Competitive Analysis
        │
        └─→ Execution Agents (Run Sequentially)
            ├─ Copy Creator
            └─ Visual Director ✅ (with MCP access for image generation)

  How Agents are Defined:

  Each agent is a Markdown file in .claude/agents/:

  ---
  name: brand-intelligence-analyst
  description: Extract brand identity from websites
  tools: WebFetch, Read, Grep
  ---

  You are an expert brand strategist...

  ## Your Mission
  Analyze websites to extract:
  - Colors and typography
  - Brand voice
  - Value propositions

  ## Output Format
  Return structured JSON:
  {
    "brandName": "...",
    "visualIdentity": {...}
  }

  ★ Insight ─────────────────────────────────────
  Product Pattern - Agent Design: Think of each agent as a microservice:
  - Single responsibility (one job only)
  - Clear input/output contract (JSON)
  - Specific tools (WebFetch vs WebSearch)
  - Independent testing (can test each agent solo)

  This lets you:
  - Swap agents without breaking the system
  - Improve one agent without touching others
  - Reuse agents across products
  - A/B test different agent prompts
  ─────────────────────────────────────────────────

  How to Choose Tools for Each Agent:

  Agent Needs           → Give Them
  ─────────────────────────────────────
  Read websites        → WebFetch
  Search internet      → WebSearch
  Read local files     → Read
  Write files          → Write
  Search code          → Grep, Glob
  Run commands         → Bash
  Launch subagents     → Task (only Main Agent)

  Product Decision: Parallel vs Sequential

  // PARALLEL (faster, independent tasks)
  const research = await Promise.all([
    launchAgent('brand-analyst'),
    launchAgent('customer-psych'),
    launchAgent('competitive-intel')
  ]);

  // SEQUENTIAL (slower, dependent tasks)
  const brand = await launchAgent('brand-analyst');
  const copy = await launchAgent('copy-creator', { brandData: brand });
  const images = await launchAgent('visual-director', { copy });

  When to parallelize:
  - Tasks are independent (no data dependency)
  - Want fastest possible time
  - OK with higher peak cost

  When to sequence:
  - Output of A feeds into B
  - Want to see progress step-by-step
  - Manage costs by spreading over time

  ---
  Layer 5: Instrumentor (Your Analytics Engine)

  What it tracks:

  Campaign Metrics {
    // Costs
    totalCost_usd: 0.2847,          // Real USD from SDK
    costBreakdown: {
      research: 0.12,
      copy: 0.08,
      synthesis: 0.08
    },

    // Performance
    duration_ms: 287432,
    avgResponseTime_ms: 2500,

    // Usage
    totalTokens: 124567,
    cacheHitRate: 0.65,             // 65% from cache

    // Agents
    agentsLaunched: 4,
    toolsCalled: 12,

    // Timeline
    events: [
      { timestamp, type: "AGENT", name: "brand-analyst" },
      { timestamp, type: "TOOL", name: "WebFetch" },
      ...
    ]
  }

  ★ Insight ─────────────────────────────────────
  Product Insight - Why This Matters:

  1. Pricing Strategy: You know exact costs → can set profitable prices
    - If campaign costs $0.30, charge $5-10
  2. Performance Optimization: Find bottlenecks
    - "Brand agent takes 45s, others take 20s" → optimize brand agent
  3. User Visibility: Show progress
    - "Research complete ✓ (took 60s, cost $0.12)"
  4. Rate Limiting: Prevent abuse
    - "User X ran 50 campaigns" → maybe they're abusing free tier
  5. Product Analytics:
    - Which agents are used most?
    - What's the average campaign cost?
    - Where do users get stuck?
  ─────────────────────────────────────────────────

  ---
  How Everything Connects: The Data Flow

  Let me trace a request through the entire system:

  ┌─────────────────────────────────────────────────┐
  │ 1. User Request                                 │
  │    POST /generate { url: "example.com" }        │
  └────────────┬────────────────────────────────────┘
               │
               ↓
  ┌─────────────────────────────────────────────────┐
  │ 2. Express Handler (sdk-server.ts)              │
  │    - Validate input                             │
  │    - Create/get session                         │
  │    - Initialize instrumentor                    │
  └────────────┬────────────────────────────────────┘
               │
               ↓
  ┌─────────────────────────────────────────────────┐
  │ 3. AIClient.queryWithSession()                  │
  │    - Build orchestration prompt                 │
  │    - Pass session ID                            │
  │    - Start streaming                            │
  └────────────┬────────────────────────────────────┘
               │
               ↓
  ┌─────────────────────────────────────────────────┐
  │ 4. Claude SDK (Main Agent)                      │
  │    - Receives prompt                            │
  │    - Plans workflow                             │
  │    - Launches subagents                         │
  └────────────┬────────────────────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
  ┌──────────┐  ┌──────────┐
  │ Research │  │   Copy   │
  │  Agents  │→ │  Creator │
  │(parallel)│  │(sequential)
  └──────────┘  └──────────┘
        │             │
        └──────┬──────┘
               ↓
  ┌─────────────────────────────────────────────────┐
  │ 5. Results Stream Back                          │
  │    For each message:                            │
  │    ├─ instrumentor.processMessage()             │
  │    ├─ sessionManager.addMessage()               │
  │    └─ Send to client                            │
  └────────────┬────────────────────────────────────┘
               │
               ↓
  ┌─────────────────────────────────────────────────┐
  │ 6. Response Assembly                            │
  │    {                                            │
  │      campaign: {...},                           │
  │      sessionId: "...",                          │
  │      instrumentation: {...}                     │
  │    }                                            │
  └─────────────────────────────────────────────────┘

  ---
  Critical Product Decisions: Your Blueprint

  Decision 1: Streaming vs Batch

  Streaming (What you have):
  ✅ User sees progress in real-time
  ✅ Better perceived performance
  ✅ Can cancel mid-operation
  ❌ More complex to implement
  ❌ Requires WebSocket or SSE

  Batch (Alternative):
  ✅ Simpler implementation
  ✅ Easier error handling
  ❌ User waits with no feedback
  ❌ Can't cancel once started

  Product recommendation: Streaming for operations > 30 seconds

  ---
  Decision 2: Session Storage

  Files (Current):
  ✅ Simple, no infrastructure
  ✅ Perfect for MVP/prototype
  ❌ Doesn't scale past one server
  ❌ No querying capabilities

  Database (Production):
  ✅ Scalable, queryable
  ✅ Multi-server support
  ✅ User history features
  ❌ More setup required

  Product recommendation:
  - MVP → Files
  - Production → Redis (temporary) + PostgreSQL (permanent)

  ---
  Decision 3: Agent Granularity

  Few Large Agents (generalists):
  ✅ Simpler to manage
  ✅ Fewer API calls
  ❌ Harder to optimize
  ❌ Less modularity

  Many Small Agents (specialists - what you have):
  ✅ Highly optimized
  ✅ Easy to swap/improve
  ✅ Parallel execution
  ❌ More complex coordination

  Product recommendation: Start with 3-5 specialized agents, can always combine later

  ---
  Reusable Patterns for Future Projects

  Pattern 1: The Orchestrator Pattern

  Main Agent (knows the big picture)
     └─ Launches specialized agents
     └─ Synthesizes results
     └─ Makes final decisions

  Use this when: You have multiple distinct tasks that need coordination

  Examples:
  - Research reports (gather → analyze → write)
  - Code generation (design → implement → test)
  - Content creation (research → draft → edit)

  ---
  Pattern 2: The Fork Pattern

  Base workflow (expensive setup)
     └─ Fork point (cheap variations)
         ├─ Variant A
         ├─ Variant B
         └─ Variant C

  Use this when: You want to A/B test or try multiple approaches

  Examples:
  - Marketing campaigns (research once, try 5 angles)
  - Design iterations (brief once, try 3 styles)
  - Product specs (requirements once, 3 implementation approaches)

  ---
  Pattern 3: The Pipeline Pattern

  Stage 1 → Stage 2 → Stage 3 → Final Output
  (save)    (save)    (save)

  Use this when: Workflow has clear stages, users might want intermediate results

  Examples:
  - Video production (script → storyboard → render)
  - Software development (requirements → design → code)
  - Data analysis (collect → clean → analyze → visualize)

  ---
  How to Adapt This for Your Next Project

  Let's say you want to build "AI Research Assistant" that reads papers and creates summaries:

  Step 1: Define Your Agents

  Main Agent: Research Coordinator
     ├─ PDF Extractor Agent (reads papers)
     ├─ Key Points Agent (finds main ideas)
     ├─ Citation Agent (tracks references)
     └─ Summary Writer Agent (creates final output)

  Step 2: Choose Your Tools

  PDF Extractor → Read, Bash (for pdf processing)
  Key Points → Read (analyze text)
  Citation → Grep (find references)
  Summary Writer → Write

  Step 3: Design Your API

  POST /analyze       // Main: analyze paper
  POST /test          // Quick test
  GET  /papers        // List analyzed papers
  POST /papers/:id/expand  // Deep dive on section
  POST /papers/:id/compare // Compare with another paper

  Step 4: Add Session Management

  Session tracks:
  - Which paper(s) being analyzed
  - Extracted key points
  - User's follow-up questions
  - Comparison across papers

  Step 5: Instrument Everything

  Track:
  - Pages processed
  - Time per paper
  - Cost per analysis
  - User engagement (which features used)

  ---
  The Formula for Any Agentic AI Product

  1. REST API Layer
     └─ Define your endpoints
     └─ Validate inputs
     └─ Route to AI client

  2. AI Client (SDK Wrapper)
     └─ Configure your model
     └─ Add product defaults
     └─ Handle streaming

  3. Session Manager
     └─ Track conversation state
     └─ Enable resume/fork
     └─ Persist to storage

  4. Agent System
     └─ Main orchestrator
     └─ 3-7 specialized agents
     └─ Clear input/output contracts

  5. Instrumentor
     └─ Track costs
     └─ Measure performance
     └─ Build analytics

  6. Agent Definitions (.md files)
     └─ One file per agent
     └─ Specify tools
     └─ Define output format

  ---
  Does this help you see how to "stitch everything together"? The key is that each layer is independent and communicates through clear interfaces
  (JSON, sessions, events), so you can swap pieces without breaking the whole system.