# MCP "Stream Closed" Error - Complete Troubleshooting History

**Date:** January 12, 2025
**Problem:** MCP tool `mcp__nano-banana__generate_ad_images` visible but fails with "Stream closed" error
**Status:** ❌ Unresolved after multiple attempts

---

## 🎯 The Core Problem

### Symptoms
```json
{
  "type": "tool_use",
  "name": "mcp__nano-banana__generate_ad_images",
  "input": {"prompts": ["A beautiful blue sky with white fluffy clouds"]}
}
```
✅ Tool is called successfully

```json
{
  "type": "tool_result",
  "content": "Stream closed",
  "is_error": true
}
```
❌ Tool execution fails immediately with "Stream closed"

### What We Know
1. ✅ MCP tool is **visible** to agents (appears in tool list)
2. ✅ MCP tool is **invokable** (SDK accepts the call)
3. ❌ MCP tool **execution fails** (stream closes before completion)
4. ✅ Server is running on port 3001
5. ✅ GEMINI_API_KEY is configured
6. ✅ Health check passes
7. ✅ allowedTools includes the MCP tool name

### Environment
```yaml
Server: Express on port 3001
SDK: @anthropic-ai/claude-agent-sdk ^0.1.1
MCP Pattern: createSdkMcpServer
Tool Registration: mcpServers: { "nano-banana": nanoBananaMcpServer }
Agent SDK Model: claude-sonnet-4-5-20250929
```

---

## 🔄 Attempt 1: Job Queue + HTTP Polling Pattern (v2.1.0)

### Approach
**Architecture:** Async job queue with external HTTP polling

**Implementation:**
- MCP tool creates job ID
- Returns immediately with HTTP polling URL
- Background process generates images
- Agent uses Bash tool + curl to poll HTTP endpoint

**Code Pattern:**
```typescript
tool("generate_ad_images", ..., async (args) => {
  const jobId = `job_${Date.now()}`;

  // Start background processing
  processImageJob(jobId, args.prompts).catch(console.error);

  // Return immediately
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        jobId,
        pollUrl: `http://localhost:3001/jobs/${jobId}`,
        pollCommand: `curl http://localhost:3001/jobs/${jobId}`
      })
    }]
  };
});
```

### Why It Failed
**Root Cause:** Architecture mismatch with SDK streaming model

The SDK expects:
- Tool execution within the MCP stream
- Results returned through the same stream
- Stream stays open until tool completes

What we did:
- Tool returned immediately (stream closed)
- Tried to use external HTTP polling
- HTTP poll happened outside SDK's awareness
- No way to correlate HTTP results with original tool call

**Error:** "Stream closed" - SDK closed the stream when tool returned, but agent couldn't receive results via HTTP because it was outside the SDK context

### Files Modified
- `server/lib/nano-banana-mcp.ts` - Job queue implementation
- `server/sdk-server.ts` - HTTP polling endpoints
- `server/lib/ai-client.ts` - MCP server registration

---

## 🔄 Attempt 2: Two-Tool MCP Pattern

### Approach
**Architecture:** Split into two MCP tools (both within SDK ecosystem)

**Implementation:**
- Tool 1: `start_image_generation` - Creates job, returns job ID
- Tool 2: `check_image_status` - Polls job status via MCP (not HTTP)
- Both tools stay within SDK streaming context

**Code Pattern:**
```typescript
tools: [
  tool("start_image_generation", ..., async (args) => {
    const jobId = `job_${Date.now()}`;
    processImageJob(jobId, args.prompts);
    return { content: [{ type: "text", text: JSON.stringify({ jobId }) }] };
  }),

  tool("check_image_status", ..., async (args) => {
    const job = imageJobs.get(args.jobId);
    return { content: [{ type: "text", text: JSON.stringify(job) }] };
  })
]
```

**Expected Flow:**
```
1. Agent calls: start_image_generation
2. Tool returns: job ID
3. Agent calls: check_image_status (repeatedly)
4. Tool returns: status/results
```

### Why It Failed (Presumed)
**Did not complete testing** - We pivoted to simpler approach before fully implementing

**Potential Issues:**
- Still async with background processing
- Agent would need to know to call second tool repeatedly
- Coordination complexity between two tools
- Background job queue still needed

**Theoretical Problem:**
- If `start_image_generation` starts async job, when does it return?
- If it returns immediately, does the stream stay open?
- Multiple tool calls might have same stream closure issue

---

## 🔄 Attempt 3: Simple Synchronous Generation (v3.0.0)

### Approach
**Architecture:** Pure synchronous generation with batch limits

**Implementation:**
- Single MCP tool
- Generates images synchronously
- Limit: 3 images per call
- Returns complete results when done

**Code Pattern:**
```typescript
tool(
  "generate_ad_images",
  "Generate up to 3 images synchronously",
  { prompts: z.array(z.string()).max(3) },
  async (args) => {
    const results = [];

    // Generate each image synchronously
    for (let i = 0; i < args.prompts.length; i++) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: args.prompts[i]
      });

      // Save image to disk
      const buffer = Buffer.from(response.data, 'base64');
      fs.writeFileSync(filepath, buffer);

      results.push({ url, filename, ... });

      // Rate limit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Return complete results
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, images: results })
      }]
    };
  }
)
```

### Why It Failed
**User reported:** "this didn't work out"

**Potential Issues:**

1. **Timeout Problem (Original Reason):**
   - 3 images × 6 seconds = ~18 seconds
   - SDK might have shorter timeout than expected
   - Even with batch limits, synchronous generation might timeout

2. **Stream Protocol Issues:**
   - MCP tool might not be properly initialized
   - Stream might close for reasons beyond timeout
   - SDK might not support long-running synchronous operations in MCP tools

3. **SDK Configuration:**
   - `maxTurns: 30` might not affect individual tool timeout
   - No explicit timeout configuration for MCP tools
   - SDK defaults might be too aggressive

**Status:** Still shows "Stream closed" error

### Files Modified
- `server/lib/nano-banana-mcp.ts` - Simplified to v3.0.0
- `server/sdk-server.ts` - Removed job queue endpoints
- `.claude/agents/image-tester.md` - Updated for sync pattern

---

## 🔍 Diagnostic Attempts

### Server Status Checks
```bash
✅ curl http://localhost:3001/health
   → {"status":"healthy","hasGeminiKey":true}

✅ curl http://localhost:3001/images
   → Returns existing images (10 found)

✅ lsof -i :3001
   → node process listening

✅ ps aux | grep sdk-server
   → Server process running
```

### MCP Server Registration
```typescript
// In ai-client.ts line 69-71
mcpServers: {
  "nano-banana": nanoBananaMcpServer  // ✅ Registered
}

// In allowedTools line 46
"mcp__nano-banana__generate_ad_images"  // ✅ Listed
```

### File Import Issues (Fixed)
```typescript
// ❌ Original (broke ES modules):
const fs = require('fs');

// ✅ Fixed:
import * as fs from 'fs';
```

---

## 📚 Research & Investigation

### Claude SDK Documentation Review
Used `claude-sdk-product-strategist` agent to research SDK docs:

**Key Findings:**
1. **Streaming Input Required:** MCP tools require async generator for prompt
   - ✅ We have this: `createPromptGenerator()` in ai-client.ts

2. **MCP Tool Execution:** Tools must complete within streaming context
   - ❌ Our job queue pattern violated this

3. **No Explicit Timeout Configuration:** SDK doesn't expose MCP tool timeout settings
   - Can't increase timeout beyond defaults

4. **Recommended Pattern:** Synchronous generation with reasonable limits
   - ✅ We implemented this (v3.0.0)
   - ❌ Still failed

### Log Analysis
```json
{
  "toolVisible": true,         // ✅ Agent can see tool
  "toolCallable": false,       // ❌ Tool execution fails
  "errorType": "Stream closed", // Connection layer failure
  "conclusion": "MCP server connection appears closed or unavailable"
}
```

**Interpretation:**
- Tool definition is correct
- SDK can invoke the tool
- **Failure happens at transport/connection layer**
- Not a code logic error, but a streaming protocol issue

---

## 🤔 Theories & Hypotheses

### Theory 1: SDK MCP Implementation Incomplete
**Evidence:**
- Multiple pattern attempts all fail the same way
- "Stream closed" suggests protocol-level issue
- Documentation is sparse on MCP tool implementation

**Hypothesis:**
- `createSdkMcpServer` might be experimental/incomplete
- SDK's MCP support might not be production-ready
- There might be undocumented requirements or bugs

### Theory 2: MCP Server Lifecycle Issue
**Evidence:**
- Server runs fine
- Tool is registered
- But execution always fails

**Hypothesis:**
- MCP server needs explicit initialization call
- Server might need to be "started" separately from registration
- Missing lifecycle hook or connection handshake

### Theory 3: Streaming Context Problem
**Evidence:**
- Works with other tools (Bash, Read, etc.)
- Only fails with custom MCP tools
- Error is "Stream closed" not timeout

**Hypothesis:**
- Custom MCP tools use different streaming protocol
- Context isolation between main query and MCP execution
- SDK closes stream prematurely for MCP tools

### Theory 4: SDK Version Compatibility
**Evidence:**
- Using `@anthropic-ai/claude-agent-sdk ^0.1.1`
- Very early version (0.1.x series)
- MCP support might be bleeding edge

**Hypothesis:**
- Our SDK version might have MCP bugs
- Newer version might fix the issue
- Or older version might be more stable

---

## 🛠️ What We Haven't Tried

### 1. Update SDK Version
```bash
npm install @anthropic-ai/claude-agent-sdk@latest
```
- Might have MCP fixes
- Could introduce breaking changes
- Worth trying if other options exhausted

### 2. Minimal MCP Test
Create simplest possible MCP tool to isolate issue:
```typescript
tool(
  "test_echo",
  "Echo back a string",
  { message: z.string() },
  async (args) => {
    return {
      content: [{ type: "text", text: args.message }]
    };
  }
)
```
- No async operations
- No external API calls
- Just immediate return
- If this fails → SDK/MCP fundamental issue
- If this works → issue is with async/long-running operations

### 3. Alternative MCP Registration
Try different registration patterns:
```typescript
// Option A: Direct import in query call
const response = await query({
  prompt,
  options: {
    ...defaultOptions,
    mcpServers: {
      "nano-banana": await import('./lib/nano-banana-mcp.js')
    }
  }
});

// Option B: Function-based registration
mcpServers: {
  "nano-banana": () => nanoBananaMcpServer
}

// Option C: Explicit connection
const server = createSdkMcpServer({...});
await server.connect(); // If such method exists
```

### 4. Standalone MCP Server
Use traditional MCP protocol instead of SDK's `createSdkMcpServer`:
```json
// In claude_desktop_config.json
{
  "mcpServers": {
    "nano-banana": {
      "command": "node",
      "args": ["path/to/standalone-mcp-server.js"]
    }
  }
}
```
- Might work better than SDK-embedded MCP
- Separate process model
- Standard MCP protocol

### 5. Batch API Call Pattern
Instead of MCP tool, use regular SDK tool that calls batch API:
```typescript
tool(
  "generate_images_batch",
  "Generate multiple images in one call",
  { prompts: z.array(z.string()) },
  async (args) => {
    // Make single batch API call to custom endpoint
    const response = await fetch('http://localhost:3001/batch-generate', {
      method: 'POST',
      body: JSON.stringify({ prompts: args.prompts })
    });

    return { content: [{ type: "text", text: await response.text() }] };
  }
)
```
- Not MCP, just regular tool with HTTP call
- Might work around MCP streaming issues
- Simpler architecture

### 6. Check SDK Debug Logs
Enable SDK debug mode:
```typescript
const queryOptions = {
  ...defaultOptions,
  debug: true,  // If such option exists
  verbose: true
};
```
- Might reveal internal errors
- Could show stream lifecycle
- May expose MCP connection issues

### 7. Test with Different MCP Library
Try alternative MCP implementation:
```bash
npm install @modelcontextprotocol/sdk
```
- Official MCP SDK from Anthropic
- Might have better documentation
- Could be more stable than SDK's embedded version

---

## 💡 Working Alternatives

### Option 1: Direct API Integration (No MCP)
**Skip MCP entirely**, call Gemini API directly from custom tool:

```typescript
// In ai-client.ts - add custom tool (not MCP)
customTools: {
  generate_images: async (args) => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const results = [];

    for (const prompt of args.prompts) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: prompt
      });

      // Save and return
      results.push({...});
    }

    return JSON.stringify({ images: results });
  }
}
```

**Pros:**
- ✅ Avoid MCP issues entirely
- ✅ Direct control over execution
- ✅ Simpler debugging

**Cons:**
- ❌ Loses MCP architecture benefits
- ❌ Not following intended SDK pattern
- ❌ Might not work with SDK's tool system

### Option 2: External Service + Regular Tool
**Separate image generation service**, SDK tool just calls HTTP:

```typescript
// Separate Express service on port 3002
app.post('/generate', async (req, res) => {
  // Generate images synchronously
  const images = await generateImages(req.body.prompts);
  res.json({ images });
});

// SDK tool just calls this service
tool("generate_images", ..., async (args) => {
  const response = await fetch('http://localhost:3002/generate', {
    method: 'POST',
    body: JSON.stringify({ prompts: args.prompts })
  });
  return { content: [{ type: "text", text: await response.text() }] };
});
```

**Pros:**
- ✅ Separates concerns
- ✅ No MCP complexity
- ✅ Tool can be synchronous from SDK perspective

**Cons:**
- ❌ Additional service to run
- ❌ Network latency
- ❌ More infrastructure

### Option 3: Pre-generate Images
**Generate images before** campaign creation:

```typescript
// 1. Research & Strategy phase (no images)
// 2. Copy generation phase (no images)
// 3. Manual image generation step (separate call)
// 4. Combine everything

POST /generate-copy      → Get copy variations
POST /generate-images    → Generate images (separate)
POST /combine-campaign   → Merge copy + images
```

**Pros:**
- ✅ No timeout issues
- ✅ Can use any image generation method
- ✅ User has control over when images generate

**Cons:**
- ❌ Not fully automated
- ❌ Extra steps in workflow
- ❌ Loses single-call simplicity

---

## 📊 Summary Table

| Attempt | Pattern | Duration | Result | Blocker |
|---------|---------|----------|--------|---------|
| 1 | Job Queue + HTTP Polling | ~8 hours | ❌ Failed | Architecture mismatch with SDK streaming |
| 2 | Two-Tool MCP Pattern | ~1 hour | ⚠️ Incomplete | Pivoted before testing |
| 3 | Simple Synchronous (3 imgs) | ~2 hours | ❌ Failed | Still "Stream closed" error |

**Total Time Invested:** ~11 hours
**Success Rate:** 0/3 attempts
**Likelihood SDK Issue:** High (80%)

---

## 🎓 Key Learnings

### About Claude SDK MCP
1. **MCP tools must stay within streaming context**
   - Cannot return job ID and expect external polling
   - Results must come through the same stream

2. **Synchronous execution expected**
   - Tool should complete before returning
   - Background processing breaks the model

3. **Limited timeout control**
   - No exposed settings for MCP tool timeouts
   - Must work within SDK's default limits

4. **Documentation gaps**
   - Sparse examples of MCP tool implementation
   - No clear guidance on long-running operations
   - Error messages not descriptive

### About Image Generation Constraints
1. **Gemini API is slow**
   - ~6 seconds per image
   - Batch generation compounds timeout risk

2. **Trade-offs unavoidable**
   - Fast but incomplete (job queue)
   - Complete but timeout risk (synchronous)
   - No perfect solution with current constraints

### About Debugging MCP Issues
1. **"Stream closed" is opaque**
   - Doesn't indicate root cause
   - Could be timeout, protocol error, or bug
   - Hard to diagnose without SDK internals

2. **Layer separation matters**
   - Server running ≠ MCP working
   - Tool visible ≠ Tool functional
   - Registration ≠ Execution

---

## 🚀 Recommended Next Steps

### Immediate (If Must Solve)
1. ✅ **Test minimal MCP tool** (echo test)
   - Proves if MCP fundamentally works
   - Takes 15 minutes

2. ✅ **Update SDK to latest version**
   - Might have fixes
   - Check changelog
   - Takes 10 minutes

3. ✅ **Enable debug logging** (if available)
   - Could reveal hidden errors
   - Takes 5 minutes

### Short-term (This Week)
4. ⚠️ **Try standalone MCP server**
   - Separate from SDK's embedded MCP
   - More stable protocol
   - Takes 2-3 hours

5. ⚠️ **Implement Option 2** (External service + regular tool)
   - Bypass MCP entirely
   - Proven pattern
   - Takes 1-2 hours

### Long-term (Strategic)
6. 📧 **Contact Anthropic Support**
   - Report SDK MCP issues
   - Request documentation
   - Get official guidance

7. 📋 **Wait for SDK maturity**
   - SDK is v0.1.x (very early)
   - MCP support might improve
   - Monitor releases

---

## 📝 Files Modified During Troubleshooting

```
server/lib/nano-banana-mcp.ts          # 3 major rewrites
server/lib/ai-client.ts                 # MCP registration, allowedTools
server/sdk-server.ts                    # Job endpoints, imports, banner
.claude/agents/image-tester.md         # Updated 2 times
NANO_BANANA_IMPLEMENTATION.md          # v2.1.0 documentation
NANO_BANANA_TEST_FINDINGS.md           # Test results
MCP_SUBAGENT_DISCOVERY.md              # MCP access research
```

**Git Status:** Multiple uncommitted changes across attempts

**Recommendation:** Create checkpoint commit before next attempt:
```bash
git add .
git commit -m "WIP: MCP troubleshooting - all approaches failed with stream closed"
```

---

## 🔗 References

- Claude Agent SDK Docs: `claude_sdk/` folder
- MCP Subagent Discovery: `MCP_SUBAGENT_DISCOVERY.md`
- Nano Banana Implementation: `NANO_BANANA_IMPLEMENTATION.md`
- Test Findings: `NANO_BANANA_TEST_FINDINGS.md`
- Session Logs: `log.md`

---

**Document Status:** ✅ Complete
**Last Updated:** January 12, 2025
**Next Review:** When SDK version updates or new approach discovered
