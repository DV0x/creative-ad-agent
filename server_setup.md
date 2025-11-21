# Creative Ad Agent Implementation Plan - SDK Orchestration Approach

Based on your PRD and following your proven SDK approach from sdk_plan.md, here's the implementation plan:

## Key Insight: Let SDK Orchestrate Everything!

Just like your Meta Ad Agent, the SDK will automatically orchestrate the workflow. The main difference is that the main agent (Creative Director) handles image generation directly via nano_banana MCP tool.

# Server Architecture Guide: sdk-server.ts and aiclient.ts

## Overview

This document explains the roles and relationship between `sdk-server.ts` and `aiclient.ts` in your Claude SDK-based development setup, and how to use both effectively in your development process.

## File Roles and Architecture

### 1. ai-client.ts - SDK Wrapper Layer

**Purpose**: Wraps the Claude SDK with your specific configurations and optimizations.

**Location**: `server/lib/ai-client.ts`

**Key Responsibilities**:
- Configures SDK with critical settings (maxTurns: 30, etc.)
- Integrates MCP servers (nano_banana)
- Handles streaming from SDK
- Manages SDK-specific options

**Example Implementation**:
```typescript
// server/lib/ai-client.ts
export class AIClient {
  async *queryStream(prompt: string, options = {}) {
    // Configure SDK with your learnings
    const queryOptions = {
      cwd: process.cwd(),
      model: 'claude-3-5-sonnet-20241022',
      maxTurns: 30,  // CRITICAL!
      strictMcpConfig: true,
      mcpServers: {
        "nano-banana": nanoBananaServer  // MCP tool integration
      },
      ...options
    };
    
    // Stream messages from SDK
    for await (const message of query({ prompt, options: queryOptions })) {
      yield message;
    }
  }
}
```

### 2. sdk-server.ts - Express API Server

**Purpose**: Provides HTTP interface for your application.

**Location**: `server/sdk-server.ts`

**Key Responsibilities**:
- Express server setup
- HTTP endpoint definitions
- Request/response handling
- Session management orchestration
- Instrumentation integration

**Example Implementation**:
```typescript
// server/sdk-server.ts
const app = express();
const sessionManager = new SessionManager();

app.post('/generate', async (req, res) => {
  const { url } = req.body;
  
  // Use session manager (which uses AIClient internally)
  const session = sessionManager.getOrCreate(`campaign-${Date.now()}`);
  
  // Process through SDK
  for await (const message of session.addUserMessage(prompt)) {
    // Handle responses
  }
  
  res.json({ success: true, results });
});
```

## Architecture Flow

The components work together in this flow:

```
HTTP Request → sdk-server.ts → SessionManager → AIClient → Claude SDK
     ↑              ↑                ↑           ↑           ↓
Express       Session Logic    SDK Config    AI Response
     ↓              ↓                ↓           ↓
HTTP Response ← Instrumentation ← Messages ← SDK Messages
```

## Development Process Flow

### Step 1: Client Makes HTTP Request
```http
POST /generate
{
  "url": "example.com"
}
```

### Step 2: sdk-server.ts Receives Request
- Creates or retrieves session
- Prepares prompt
- Calls session manager

### Step 3: Session Manager Uses AIClient
```typescript
class Session {
  private aiClient: AIClient;
  
  async *addUserMessage(content: string) {
    // Uses AIClient internally
    for await (const message of this.aiClient.queryStream(content, options)) {
      yield message;
    }
  }
}
```

### Step 4: AIClient Configures and Calls SDK
- Adds MCP servers
- Sets critical options (maxTurns: 30)
- Streams responses

### Step 5: sdk-server.ts Processes Responses
- Tracks with instrumentation
- Formats results
- Returns HTTP response

## Why This Separation?

### Benefits of Two-File Architecture

#### 1. Separation of Concerns
- **ai-client.ts**: SDK configuration logic
- **sdk-server.ts**: HTTP/API logic

#### 2. Reusability
- AIClient can be used in other contexts (CLI, workers, etc.)
- Not tied to Express server

#### 3. Testing
- Test SDK integration separately from HTTP layer
- Mock AIClient for server tests

#### 4. Configuration Management
- All SDK-specific settings in one place
- Easy to update SDK configurations

## Development Usage Patterns

### For API Development
1. **Modify endpoints in sdk-server.ts**:
   ```typescript
   app.post('/analyze', async (req, res) => {
     // New endpoint logic
   });
   ```

2. **Update SDK configuration in ai-client.ts**:
   ```typescript
   const queryOptions = {
     maxTurns: 50,  // Adjust for complex tasks
     mcpServers: {
       "new-tool": newToolServer
     }
   };
   ```

### For Adding New Features
1. **HTTP Layer Changes**: Modify `sdk-server.ts`
2. **SDK Integration Changes**: Modify `ai-client.ts`
3. **Both layers remain independent**

### For Testing
```typescript
// Test AIClient independently
const client = new AIClient();
const response = await client.queryStream("test prompt");

// Test server with mocked AIClient
const mockClient = new MockAIClient();
// Test HTTP endpoints
```

## Key Configuration Options

### Critical Settings in ai-client.ts
- **maxTurns: 30** - Essential for complex tasks
- **strictMcpConfig: true** - Ensures MCP server reliability
- **model**: Claude model selection
- **mcpServers**: Tool integrations

### Server Settings in sdk-server.ts
- Express middleware configuration
- CORS settings
- Rate limiting
- Session management
- Instrumentation setup

## Best Practices

1. **Keep SDK logic in ai-client.ts**
2. **Keep HTTP logic in sdk-server.ts**
3. **Use SessionManager for state management**
4. **Configure MCP servers in ai-client.ts**
5. **Handle errors appropriately in both layers**
6. **Use streaming for real-time responses**

## Troubleshooting

### Common Issues
- **MaxTurns too low**: Increase in ai-client.ts
- **MCP server failures**: Check strictMcpConfig setting
- **Memory issues**: Implement proper session cleanup
- **Timeout issues**: Configure appropriate timeouts in both layers

This architecture provides a clean separation between your HTTP API layer and Claude SDK integration, making your codebase more maintainable and testable.

---

## Phase 1: MCP Tools FIRST! (Critical Learning Applied)

### Step 1: Create NanoBanana MCP Server (Day 1)

**Why First:** Without this, the main agent can't generate images!

```
creative_agent/
└── server/
    └── lib/
        └── tools/
            └── nanoBananaGenerator.ts
```

Following your imageGenerator.ts pattern:
- Use createSdkMcpServer with proper tool array
- Return SDK-compliant format (type: "image" with base64)
- Handle Gemini API authentication correctly
- Include error handling with isError: true

---

## Phase 2: Agent Setup with YAML Frontmatter (Day 2)

### Step 2: Create Subagent Files

```
creative_agent/
└── .claude/
    └── agents/
        ├── brand-intelligence-analyst.md
        ├── customer-psychology-specialist.md  
        ├── competitive-intelligence-specialist.md
        └── copy-creator.md
```

Each agent needs proper YAML frontmatter:
```yaml
---
name: brand-intelligence-analyst
description: Extract brand identity and visual elements from websites
tools: WebFetch, Read, Grep
---
```

**Note:** MCP tools CAN be added to subagent tool lists when:
1. MCP tool is included in top-level `allowedTools` array
2. Agent definition includes the MCP tool in its `tools:` frontmatter
3. See `visual-director.md` for example: `tools: Read, Bash, mcp__nano-banana__generate_ad_images`

---

## Phase 3: SDK Server Foundation (Day 3)

### Step 3: Create Minimal SDK Wrapper

```typescript
// server/lib/ai-client.ts
```

Key configurations from your learnings:
- `maxTurns: 30` - CRITICAL for tool usage!
- `strictMcpConfig: true` - Prevent loading user's configs
- `cwd: process.cwd()` - Points to creative_agent root
- Include nanoBananaServer in mcpServers

### Step 4: Session Management

```typescript
// server/lib/session-manager.ts
```

Following your pattern:
- Capture session_id from first system message
- Use resume for subsequent calls
- Store messages for context

---

## Phase 4: Single Orchestration Endpoint (Day 4)

### Step 5: Create Main Server

```typescript
// server/sdk-server.ts
```

**Key Approach:** Simple Prompt, Let SDK Orchestrate!

```typescript
app.post('/generate', async (req, res) => {
  const { url } = req.body;

  // Simple, unconstrained prompt - SDK recognizes the pattern!
  const prompt = `
    Generate 10 creative ad variations for ${url}.
    
    Use all available agents to:
    1. Analyze brand identity and visual style
    2. Research customer psychology and pain points
    3. Analyze competitor strategies
    4. Create compelling copy for each variation
    5. Generate images using nano_banana for all creatives
    
    Return 10 complete ad creatives with different angles.
  `;

  // Let SDK orchestrate everything!
});
```

No manual orchestration needed - SDK automatically:
- Recognizes creative generation workflow
- Calls agents in logical sequence
- Manages context between agents
- Handles tool execution

---

## Phase 5: Instrumentation (Day 5)

### Step 6: Add SDKInstrumentor

```typescript
// server/lib/instrumentor.ts
```

Track everything for learning:
- Agent calls sequence
- Tool usage (especially nano_banana)
- Costs and timing
- Message flow

---

## Phase 6: Testing Strategy (Day 6)

### Step 7: Progressive Testing

**Test 1: Agent Discovery**
```bash
curl -X POST http://localhost:3001/test \
  -d '{"prompt": "List available agents"}'
```

**Test 2: Individual Agent with Constraint**
```bash
curl -X POST http://localhost:3001/test \
  -d '{"prompt": "CONSTRAINT: Only run brand-intelligence-analyst. Analyze example.com"}'
```

**Test 3: Full Orchestration**
```bash
curl -X POST http://localhost:3001/generate \
  -d '{"url": "example.com"}'
```

---

## Critical Differences from Meta Ad Agent

| Aspect         | Meta Ad Agent         | Creative Ad Agent      |
|----------------|-----------------------|------------------------|
| MCP Tool       | Google Imagen 3       | NanoBanana/Gemini      |
| Main Focus     | Meta ads specifically | General creative ads   |
| Agents         | 5 specialized         | 4 specialized          |
| Output         | 30 images (10×3)      | 10 creatives           |
| Copy Framework | Built into agents     | Dedicated Copy Creator |

---

## Implementation Timeline

### Week 1: Foundation

- **Day 1:** NanoBanana MCP server (CRITICAL!)
- **Day 2:** Create 4 subagents with YAML
- **Day 3:** SDK wrapper with session management
- **Day 4:** Main /generate endpoint
- **Day 5:** Instrumentation
- **Day 6:** Testing

### Week 2: Polish

- **Day 7:** Error handling
- **Day 8:** Cost optimization
- **Day 9:** Performance tuning
- **Day 10:** Documentation

---

## Key Success Patterns to Follow

1. **MCP First:** Without nano_banana tool, nothing works
2. **maxTurns: 30:** Essential for tool execution
3. **Simple Prompts:** Let SDK recognize patterns
4. **No Manual Orchestration:** SDK handles agent sequencing
5. **Instrumentation Early:** Track everything for debugging
6. **Constraint Testing:** Use "CONSTRAINT:" for individual agents
7. **Session Management:** Critical for multi-turn context

---

## Expected SDK Orchestration Flow

When you call `/generate` with a URL, SDK will automatically:

1. Recognize creative generation pattern
2. Call brand-intelligence-analyst → Extract brand elements
3. Call customer-psychology-specialist → Find pain points
4. Call competitive-intelligence-specialist → Analyze market
5. Synthesize insights (Main agent)
6. Call copy-creator → Generate 10 copy variations
7. Generate images (Main agent via nano_banana MCP)
8. Package results → Return 10 complete creatives

**Total time:** ~5 minutes (based on your Meta agent experience)

---

## Common Pitfalls to Avoid

### ❌ Don't Do:
- Don't try to manually orchestrate agents
- ~~Don't give subagents MCP tool access~~ (OUTDATED: Subagents CAN access MCP)
- Don't use streaming for simple queries
- Don't forget maxTurns: 30
- Don't skip instrumentation
- Don't let generator close before MCP tools complete

### ✅ Do:
- Do trust SDK orchestration
- Do use simple, clear prompts
- Do implement MCP tools first
- Do track everything with instrumentation
- Do test progressively
- Do include MCP tools in top-level `allowedTools` array
- Do use `AbortController` pattern for generator lifetime
- Do specify MCP tools in agent frontmatter when needed

This approach leverages SDK's intelligence while enabling both main agent and subagents to use MCP tools via proper configuration (see `MCP_STREAM_FIX.md` and `allowed_tools.md`).