What You're Building: AI-Powered Creative Ad Generation Agent

  The Big Picture

  You're building an intelligent system that automatically generates 10 high-quality ad creatives for Meta/Instagram platforms. Instead of spending
  4-8 hours manually creating ads, a user simply inputs a website URL and gets 10 diverse, strategically-aligned ad creatives in under 5 minutes.

  The Core Value: Transform https://example.com → 10 ready-to-use ad creatives with copy and strategic insights

  ---
  How It Works: Multi-Agent Orchestration

  ★ Insight ─────────────────────────────────────
  This project uses agentic AI architecture - instead of one giant AI trying to do everything, you have 5 specialized AI agents that each excel at
  specific tasks (brand analysis, customer psychology, competitor research, copywriting). Think of it like assembling an expert team rather than
  hiring one generalist.
  ─────────────────────────────────────────────────

  The System Architecture

  ┌─────────────────────────────────────────────────┐
  │          User makes HTTP request                │
  │    POST /generate { url: "example.com" }        │
  └────────────────────┬────────────────────────────┘
                       │
                       ↓
  ┌─────────────────────────────────────────────────┐
  │         Express Server (sdk-server.ts)          │
  │         Handles API, Sessions, Metrics          │
  └────────────────────┬────────────────────────────┘
                       │
                       ↓
  ┌─────────────────────────────────────────────────┐
  │        Claude SDK (Main Creative Director)      │
  │        Orchestrates the entire workflow         │
  └────────────────────┬────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ↓                       ↓
  ┌─────────────────┐    ┌─────────────────┐
  │  PHASE 1        │    │  PHASE 2        │
  │  Research       │ →  │  Copy Creation  │
  │  (3 agents)     │    │  (1 agent)      │
  └─────────────────┘    └─────────────────┘

  ---
  The 4 Execution Phases

  Phase 1: Parallel Research (60 seconds)

  Three AI agents run simultaneously to gather intelligence:

  1. brand-intelligence-analyst
    - Analyzes the website using WebFetch
    - Extracts: colors, typography, brand voice, value props, USPs
    - Returns JSON with visual identity and positioning
  2. customer-psychology-specialist
    - Uses WebFetch + WebSearch
    - Identifies: pain points, desires, emotional triggers, objections
    - Returns JSON with psychological insights
  3. competitive-intelligence-specialist
    - Uses WebSearch to find competitors
    - Analyzes: competitor positioning, market gaps, opportunities
    - Returns JSON with competitive landscape

  Phase 2: Creative Strategy (30 seconds)

  The Main Creative Director (your orchestrator):
  - Synthesizes all research data
  - Generates 5 strategic angles:
    a. Problem-Solution
    b. Social Proof
    c. Transformation (Before/After)
    d. Product Hero
    e. Emotional Connection

  Phase 3: Copy Generation (90 seconds)

  The copy-creator agent:
  - Takes each of the 5 angles
  - Generates 2 variants per angle = 10 total creatives
  - Uses proven copywriting frameworks:
    - Problem-Solution → PAS (Problem, Agitate, Solution)
    - Social Proof → 4 Ps (Promise, Picture, Proof, Push)
    - Transformation → Before-After-Bridge
    - Product Hero → FAB (Features, Advantages, Benefits)
    - Emotional → AIDA (Attention, Interest, Desire, Action)

  Phase 4: Assembly (10 seconds)

  - Combines all outputs into structured JSON
  - Packages with metadata, costs, performance metrics

  ---
  The Technology Stack

  ★ Insight ─────────────────────────────────────
  This project uses the Claude SDK (@anthropic-ai/claude-agent-sdk) which is Anthropic's official framework for building multi-agent systems. The SDK
   handles agent orchestration, tool usage, and session management - you don't have to manually manage prompts and API calls.
  ─────────────────────────────────────────────────

  Key Components

  1. Express Server (server/sdk-server.ts)
  - HTTP REST API with endpoints like /generate, /test, /sessions
  - Handles requests and routes them to the AI system

  2. AIClient (server/lib/ai-client.ts)
  - Wrapper around Claude SDK's query() function
  - Manages streaming responses using async generators
  - Handles session creation and resumption

  3. SessionManager (server/lib/session-manager.ts)
  - Tracks conversation history across multiple requests
  - Enables session forking (A/B testing different creative variants)
  - Persists sessions to disk (./sessions/*.json)

  4. SDKInstrumentor (server/lib/instrumentor.ts)
  - Real-time metrics tracking
  - Monitors costs, token usage, tool calls, agent launches
  - Provides complete observability

  5. Agent Definitions (.claude/agents/*.md)
  - Markdown files that define each AI agent's role
  - Specify tools available (WebFetch, WebSearch, Read, Write, etc.)
  - Include prompts that shape agent behavior

  ---
  Example: What Happens When You Generate a Campaign

  Let's trace a request through the system:

  curl -X POST http://localhost:3001/generate \
    -H "Content-Type: application/json" \
    -d '{
      "url": "https://theratefinder.com",
      "platform": "instagram",
      "objective": "conversion"
    }'

  Behind the Scenes:

  1. Express receives request (sdk-server.ts:36)
    - Creates new session ID: campaign-1696176234567
    - Initializes instrumentor for metrics
  2. AIClient constructs orchestration prompt
    - "Analyze https://theratefinder.com and generate 10 ad creatives"
    - Includes instructions for parallel agent execution
  3. Main Agent launches 3 research agents in parallel (via Task tool)
  [10:15:23] 🔧 TOOL CALLED: Task
  [10:15:23]    🤖 Agent: brand-intelligence-analyst

  [10:15:24] 🔧 TOOL CALLED: Task
  [10:15:24]    🤖 Agent: customer-psychology-specialist

  [10:15:25] 🔧 TOOL CALLED: Task
  [10:15:25]    🤖 Agent: competitive-intelligence-specialist
  4. Each agent does its work
    - Brand agent: WebFetch → extracts colors, voice, USPs
    - Psychology agent: WebFetch + WebSearch → identifies pain points
    - Competitive agent: WebSearch → finds competitors
  5. Main Agent synthesizes research
    - Combines all 3 JSON outputs
    - Identifies 5 strategic angles
  6. Main Agent launches Copy Creator
  [10:16:45] 🔧 TOOL CALLED: Task
  [10:16:45]    🤖 Agent: copy-creator
  7. Copy Creator generates 10 variations
    - Each with headline, body copy, CTA
    - Matched to strategic framework
  8. Response returned
  {
    "success": true,
    "campaign": {
      "structuredData": {
        "brandInsights": {...},
        "customerInsights": {...},
        "competitiveInsights": {...},
        "creativeAngles": [
          {
            "angle": "problem-solution",
            "framework": "PAS",
            "copy": {
              "headline": "Stop Wasting Hours...",
              "body": "...",
              "cta": "Start Free Trial"
            }
          },
          // ... 9 more
        ]
      }
    },
    "instrumentation": {
      "totalCost_usd": 0.2847,
      "duration_ms": 287432
    }
  }

  ---
  Key Features You've Implemented

  ★ Insight ─────────────────────────────────────
  The session management system is particularly clever - it allows session forking, meaning you can run the expensive research phase once, then
  create multiple "branches" to test different creative approaches. This saves both time and money while enabling A/B testing.
  ─────────────────────────────────────────────────

  1. Session Management

  - Create sessions that persist conversation history
  - Resume sessions to continue where you left off
  - Fork sessions to create variants (A/B testing)

  2. Real-time Instrumentation

  - Track every tool call, agent launch, token usage
  - Get exact USD costs from Claude SDK
  - Timeline of events for debugging

  3. Multi-Agent Orchestration

  - Parallel execution of research agents
  - Sequential coordination for complex workflows
  - Each agent specialized with specific tools

  4. Platform Optimization

  - Copy optimized for Instagram/Meta specs
  - Character limits, CTA best practices
  - 5 proven copywriting frameworks

  ---
  Current State

  Based on the file structure:

  ✅ Completed:
  - Express server with full REST API
  - Claude SDK integration with streaming
  - 5 specialized agents (brand, psychology, competitive, copy, visual director)
  - Session management with forking
  - Real-time instrumentation and cost tracking
  - End-to-end campaign generation
  - ✅ Image generation via nano_banana MCP (Gemini 2.5 Flash)
  - ✅ visual-director subagent with MCP access

  ⏸️ Future (mentioned in PRD):
  - Direct export to Meta Ads Manager
  - Performance tracking of actual ads
  - Multi-language support
  - Enhanced image generation (batch processing)

  ---
  How to Run It

  # 1. Install dependencies
  cd server
  npm install

  # 2. Set up environment
  # Create .env in project root with:
  ANTHROPIC_API_KEY=sk-ant-...

  # 3. Start server (development mode with hot reload)
  npm run dev

  # 4. Server runs on http://localhost:3001

  Available Endpoints:
  - POST /generate - Generate full campaign
  - POST /test - Test SDK with simple query
  - GET /sessions - List all sessions
  - POST /sessions/:id/continue - Resume session
  - POST /sessions/:id/fork - Create variant
  - GET /health - Health check

  ---
  Why This Architecture?

  ★ Insight ─────────────────────────────────────
  Traditional AI systems use a single prompt. This multi-agent approach is superior because:
  1. Specialization - Each agent is an expert in its domain
  2. Parallelization - Research happens simultaneously (3x faster)
  3. Modularity - Easy to swap/improve individual agents
  4. Composability - Can reuse agents across different workflows

  The Claude SDK makes this possible by providing the Task tool which spawns subagents with isolated contexts.