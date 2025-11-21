import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { aiClient } from './lib/ai-client.js';
import { sessionManager } from './lib/session-manager.js';
import { SDKInstrumentor } from './lib/instrumentor.js';

// Load environment variables from root .env
config({ path: resolve('../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    config: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      port: PORT
    }
  });
});

/**
 * Test endpoint - Session-aware SDK query
 * Use this to test SDK functionality with session management
 */
app.post('/test', async (req, res) => {
  const {
    prompt = "List available agents and tools",
    sessionId,
    createNew = false
  } = req.body;

  console.log('📝 Test query:', prompt);

  try {
    const messages = [];
    const startTime = Date.now();

    // Use session-aware query
    const effectiveSessionId = createNew ? undefined : sessionId;
    let currentSessionId = effectiveSessionId;

    // Stream responses from SDK with session management
    for await (const result of aiClient.queryWithSession(prompt, effectiveSessionId, { test: true })) {
      const { message, sessionId: sid } = result;
      currentSessionId = sid;
      messages.push(message);

      // Enhanced message processing for complete observability
      if (message.type === 'system') {
        console.log('🔧 System:', message.subtype || 'general');
        if (message.subtype === 'init' && message.session_id) {
          console.log('📋 SDK Session ID captured:', message.session_id);
        }
      } else if (message.type === 'assistant') {
        // Process assistant messages for text AND tool calls
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text') {
              const textPreview = block.text.substring(0, 100);
              console.log('🤖 Assistant:', textPreview + (block.text.length > 100 ? '...' : ''));
            } else if (block.type === 'tool_use') {
              // This is where tool calls appear!
              const timestamp = new Date().toISOString();
              console.log(`\n🔧 [${timestamp}] TOOL CALLED: ${block.name}`);
              console.log(`   Tool ID: ${block.id}`);

              // Log tool-specific details
              if (block.name === 'Task') {
                console.log(`   🤖 Agent: ${block.input?.subagent_type || 'unknown'}`);
                console.log(`   📝 Prompt: ${block.input?.prompt?.substring(0, 80)}...`);
              } else if (block.name === 'WebFetch') {
                console.log(`   🌐 URL: ${block.input?.url}`);
              } else if (block.name === 'Bash') {
                console.log(`   💻 Command: ${block.input?.command}`);
              } else {
                console.log(`   📋 Input:`, JSON.stringify(block.input).substring(0, 100) + '...');
              }
            }
          }
        }
      } else if (message.type === 'user') {
        // Process user messages for tool results
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_result') {
              const timestamp = new Date().toISOString();
              console.log(`\n✅ [${timestamp}] TOOL COMPLETED`);
              console.log(`   Tool ID: ${block.tool_use_id}`);
              console.log(`   Error: ${block.is_error || false}`);
              if (block.is_error) {
                console.log(`   Error Details:`, block.content);
              }
            }
          }
        }
      } else if (message.type === 'result') {
        // Final execution metrics
        console.log(`\n📊 EXECUTION COMPLETE`);
        console.log(`   Status: ${message.subtype}`);
        console.log(`   Duration: ${message.duration_ms}ms`);
        console.log(`   Turns: ${message.num_turns}`);
        console.log(`   Cost: $${message.total_cost_usd?.toFixed(4) || 0}`);
      }
    }

    const duration = Date.now() - startTime;

    // Get session stats
    const sessionStats = sessionManager.getSessionStats(currentSessionId!);

    res.json({
      success: true,
      sessionId: currentSessionId,
      sessionStats,
      duration: `${duration}ms`,
      messageCount: messages.length,
      messages: messages.slice(-5), // Return last 5 messages for debugging
      summary: extractSummary(messages)
    });

  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * Session management endpoints
 */

// List all active sessions
app.get('/sessions', (req, res) => {
  const sessions = sessionManager.getActiveSessions();
  res.json({
    success: true,
    count: sessions.length,
    sessions: sessions.map(s => ({
      id: s.id,
      sdkSessionId: s.sdkSessionId,
      createdAt: s.createdAt,
      lastAccessedAt: s.lastAccessedAt,
      metadata: s.metadata,
      turnCount: s.turnCount
    }))
  });
});

// Get specific session info
app.get('/sessions/:id', (req, res) => {
  const stats = sessionManager.getSessionStats(req.params.id);
  if (!stats) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
  res.json({ success: true, session: stats });
});

// Resume a session with new prompt
app.post('/sessions/:id/continue', async (req, res) => {
  const { prompt } = req.body;
  const sessionId = req.params.id;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required'
    });
  }

  try {
    const messages = [];
    const startTime = Date.now();

    // Continue existing session
    for await (const result of aiClient.queryWithSession(prompt, sessionId)) {
      const { message } = result;
      messages.push(message);
    }

    const duration = Date.now() - startTime;
    const sessionStats = sessionManager.getSessionStats(sessionId);

    res.json({
      success: true,
      sessionId,
      sessionStats,
      duration: `${duration}ms`,
      messageCount: messages.length,
      summary: extractSummary(messages)
    });

  } catch (error: any) {
    console.error('❌ Session continue error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to continue session'
    });
  }
});

// Fork a session to try different creative approaches
app.post('/sessions/:id/fork', async (req, res) => {
  const { prompt, purpose } = req.body;
  const baseSessionId = req.params.id;

  if (!prompt) {
    return res.status(400).json({
      success: false,
      error: 'Prompt is required for fork'
    });
  }

  console.log(`🌿 Forking session ${baseSessionId}: ${purpose || 'variant'}`);

  try {
    const messages = [];
    const startTime = Date.now();
    let forkSessionId: string | undefined;

    // Fork the session with metadata
    const forkMetadata = {
      forkPurpose: purpose || 'Creative variant',
      forkedAt: new Date().toISOString()
    };

    for await (const result of aiClient.queryWithSessionFork(
      prompt,
      baseSessionId,
      forkMetadata
    )) {
      const { message, sessionId } = result;
      forkSessionId = sessionId;
      messages.push(message);
    }

    const duration = Date.now() - startTime;
    const sessionStats = sessionManager.getSessionStats(forkSessionId!);
    const baseStats = sessionManager.getSessionStats(baseSessionId);

    res.json({
      success: true,
      fork: {
        sessionId: forkSessionId,
        baseSessionId,
        purpose: purpose || 'Creative variant',
        stats: sessionStats
      },
      baseSession: {
        id: baseSessionId,
        stats: baseStats
      },
      duration: `${duration}ms`,
      messageCount: messages.length,
      summary: extractSummary(messages),
      note: `Fork created successfully. Original session ${baseSessionId} is unchanged.`
    });

  } catch (error: any) {
    console.error('❌ Session fork error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fork session'
    });
  }
});

// Get session family tree (base + all forks)
app.get('/sessions/:id/family', (req, res) => {
  const sessionId = req.params.id;
  const family = sessionManager.getSessionFamily(sessionId);

  if (!family.baseSession) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    family: {
      base: {
        id: family.baseSession.id,
        sdkSessionId: family.baseSession.sdkSessionId,
        createdAt: family.baseSession.createdAt,
        metadata: family.baseSession.metadata,
        messageCount: family.baseSession.messages.length,
        turnCount: family.baseSession.turnCount
      },
      forks: family.forks.map(fork => ({
        id: fork.id,
        sdkSessionId: fork.sdkSessionId,
        createdAt: fork.createdAt,
        forkedFrom: fork.metadata.forkedFrom,
        forkTimestamp: fork.metadata.forkTimestamp,
        forkPurpose: fork.metadata.forkPurpose,
        messageCount: fork.messages.length,
        turnCount: fork.turnCount
      })),
      totalVariants: family.forks.length + 1  // Base + forks
    }
  });
});

/**
 * Main creative generation endpoint - Orchestrates all subagents in parallel
 * Implements the PRD workflow: Research → Strategy → Copy → Visuals
 */
app.post('/generate', async (req, res) => {
  const {
    url,
    platform = 'instagram',
    objective = 'conversion',
    targetAudience,
    sessionId,
    customInstructions
  } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  console.log('🎨 Starting creative generation for:', url);

  try {
    const messages = [];
    const startTime = Date.now();

    // Create or use existing session for this campaign
    const campaignSessionId = sessionId || `campaign-${Date.now()}`;

    // Initialize instrumentation for this campaign
    const instrumentor = new SDKInstrumentor(campaignSessionId, url, platform);

    // Directive orchestration: Explicit Task tool instructions for each agent
    const orchestrationPrompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMPAIGN ORCHESTRATION TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Campaign URL: ${url}
Platform: ${platform}
Objective: ${objective}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
Session ID: ${campaignSessionId}

${customInstructions ? `CREATIVE DIRECTION:\n${customInstructions}\n\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SEQUENTIAL WORKFLOW - USE TASK TOOL FOR EACH PHASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ PHASE 1: RESEARCH ═══

Use Task tool to launch campaign-researcher agent:

Agent: campaign-researcher
Description: Deep brand and customer research
Prompt: "Conduct comprehensive brand analysis for ${url}

Extract complete intelligence:
1. ALL product/service offerings with pricing (complete catalog)
2. Brand identity (colors, voice, positioning, visual style)
3. Customer psychology (pain points, desires, emotional triggers)
4. Psychological triggers (social proof, urgency, authority)
5. Competitive differentiation opportunities

${customInstructions ? `FOCUS: ${customInstructions}\n` : ''}Output: Structured markdown research report with all findings."

⏸️  WAIT for campaign-researcher to complete before Phase 2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ PHASE 2: COPYWRITING ═══

Use Task tool to launch copy-creator agent:

Agent: copy-creator
Description: Generate ad copy variations
Prompt: "Create 5 ${platform} ad copy variations for ${objective} objective.

Use the research findings from Phase 1 above.

Requirements:
- Use proven copywriting frameworks (PAS, AIDA, Before-After-Bridge, FAB, 4 Ps)
- Feature specific offerings identified in research
- Target customer pain points from research
- Match brand voice and tone from research
- Platform: ${platform} (optimize for feed/stories)
- Each copy includes: headline, body, CTA

Output: 5 complete, platform-ready ad copy variations."

⏸️  WAIT for copy-creator to complete before Phase 3

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ PHASE 3: VISUAL CREATION ═══

Use Task tool to launch visual-director agent:

Agent: visual-director
Description: Generate ad images with text overlays
Prompt: "Generate 5 complete ${platform} ad images with integrated text overlays.

Use research from Phase 1 and copy from Phase 2.

Requirements:
- Create 5 distinct images matching the 5 copy variations
- Each image includes copy text overlaid (headline + CTA visible)
- Brand-aligned colors from research
- Emotionally compelling scenes matching customer psychology
- Platform: ${platform} format (1080x1350px vertical)
- Session ID for image storage: ${campaignSessionId}

Output: 5 production-ready ad images with text overlays."

⏸️  WAIT for visual-director to complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ COMPLETION ═══

After all 3 phases complete, provide a comprehensive summary:

## 📊 Campaign Execution Summary

**Research Phase:**
- [Key findings from campaign-researcher]
- [Offerings identified]
- [Target audience insights]

**Copy Phase:**
- [Creative angles used]
- [Frameworks applied]
- [Summary of 5 variations]

**Visual Phase:**
- [Image generation status]
- [Visual strategy overview]
- [File locations]

**Campaign Assets:**
- 1 complete research report
- 5 ad copy variations
- 5 ad images (1080x1350px)
- Session ID: ${campaignSessionId}

**Next Steps:**
[Recommendations for deployment/testing]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEGIN EXECUTION - Launch Phase 1 now.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    // Execute orchestration with session management and instrumentation
    for await (const result of aiClient.queryWithSession(orchestrationPrompt, campaignSessionId)) {
      const { message } = result;
      messages.push(message);

      // Process message for instrumentation
      instrumentor.processMessage(message);

      // Log progress for debugging - FULL VISIBILITY
      if (message.type === 'assistant') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          // Show full text content
          const textContent = content.find((c: any) => c.type === 'text')?.text || '';
          if (textContent) {
            console.log('\n🤖 ASSISTANT MESSAGE:');
            console.log('─'.repeat(80));
            console.log(textContent);
            console.log('─'.repeat(80));
          }

          // Show all tool uses
          for (const block of content) {
            if (block.type === 'tool_use') {
              console.log(`\n🔧 TOOL CALL: ${block.name}`);
              console.log(`   Tool ID: ${block.id}`);
              if (block.name === 'Task') {
                console.log(`   🤖 Agent: ${block.input?.subagent_type}`);
                console.log(`   📝 Description: ${block.input?.description}`);
                console.log(`   📋 Prompt Preview: ${block.input?.prompt?.substring(0, 200)}...`);
              } else if (block.name === 'mcp__nano-banana__generate_ad_images') {
                console.log(`   🎨 Images: ${block.input?.prompts?.length || 0}`);
                console.log(`   Style: ${block.input?.style || 'default'}`);
              } else {
                console.log(`   Input:`, JSON.stringify(block.input, null, 2));
              }
            }
          }
        }
      }
    }

    // Instrumentation complete - all data tracked automatically

    const duration = Date.now() - startTime;
    const sessionStats = sessionManager.getSessionStats(campaignSessionId);

    // Extract and structure the final response using correct SDK pattern
    const assistantMessages = messages
      .filter(m => m.type === 'assistant')
      .map(m => {
        const content = m.message?.content;
        if (Array.isArray(content)) {
          return content.find((c: any) => c.type === 'text')?.text || '';
        }
        return '';
      })
      .filter(text => text.length > 0);

    // Try to find structured JSON data in the messages
    let structuredData = null;
    const allText = assistantMessages.join('\n');

    // Look for JSON blocks in the response
    const jsonMatch = allText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.log('Failed to parse JSON from response:', e);
      }
    }

    const finalResponse = assistantMessages[assistantMessages.length - 1] || '';
    const fullResponse = assistantMessages.join('\n\n---\n\n');

    // Get comprehensive instrumentation report
    const campaignReport = instrumentor.getCampaignReport();
    const costBreakdown = instrumentor.getCostBreakdown();

    res.json({
      success: true,
      campaign: {
        url,
        platform,
        objective,
        targetAudience,
        customInstructions: customInstructions || null,
        generatedAt: new Date().toISOString(),
        summary: finalResponse,
        fullResponse: fullResponse,
        structuredData: structuredData
      },
      sessionId: campaignSessionId,
      sessionStats,
      performance: {
        duration: `${duration}ms`,
        messageCount: messages.length,
        phases: ['Research', 'Strategy', 'Copy Generation', 'Image Generation']
      },
      instrumentation: {
        campaignMetrics: campaignReport,
        costBreakdown,
        timeline: instrumentor.getEventsTimeline(),
        summary: {
          totalCost: `$${campaignReport.totalCost_usd.toFixed(4)}`,
          totalTokens: campaignReport.summary.totalTokens,
          avgResponseTime: `${campaignReport.summary.avgResponseTime_ms.toFixed(0)}ms`,
          agentsUsed: campaignReport.summary.totalAgents,
          toolsUsed: campaignReport.summary.totalTools
        }
      },
      imageGeneration: {
        status: 'enabled',
        note: 'Images are generated automatically via visual-director agent in PHASE 4',
        agent: 'visual-director',
        mcpTool: 'mcp__nano-banana__generate_ad_images',
        expectedImages: 5,
        format: '1080x1080 (Instagram)',
        storageLocation: `generated-images/${campaignSessionId}/`,
        viewUrl: `http://localhost:${PORT}/images/${campaignSessionId}`
      }
    });

  } catch (error: any) {
    console.error('❌ Campaign generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate campaign',
      url,
      note: 'Check server logs for details'
    });
  }
});

/**
 * Instrumentation endpoint - Get metrics for a campaign
 */
app.get('/campaigns/:id/metrics', (req, res) => {
  const campaignId = req.params.id;

  // In a real app, you'd retrieve stored metrics from database
  // For now, return structure for what metrics would be available
  res.json({
    success: true,
    campaignId,
    note: 'Metrics are tracked during /generate execution',
    availableMetrics: {
      campaignMetrics: 'Complete campaign tracking with phases, agents, costs',
      costBreakdown: 'Cost analysis by phase and agent',
      timeline: 'Detailed event timeline',
      summary: 'High-level performance metrics'
    },
    usage: 'Metrics are included in /generate response under "instrumentation" key'
  });
});

/**
 * Image serving endpoint - Serve generated images
 * Images are stored in /generated-images/{sessionId?}/{filename}
 */
app.get('/images/:sessionId?/:filename', (req, res) => {
  const { sessionId, filename } = req.params;

  // Construct file path
  const projectRoot = resolve('..');
  const imagePath = sessionId && filename
    ? resolve(projectRoot, 'generated-images', sessionId, filename)
    : resolve(projectRoot, 'generated-images', sessionId || '');

  console.log(`📸 Serving image: ${imagePath}`);

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({
      success: false,
      error: 'Image not found',
      path: imagePath
    });
  }

  // Serve the image with appropriate content type
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('❌ Error serving image:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to serve image'
      });
    }
  });
});

/**
 * List generated images endpoint
 */
app.get('/images', (req, res) => {
  const projectRoot = resolve('..');
  const imagesDir = resolve(projectRoot, 'generated-images');

  if (!fs.existsSync(imagesDir)) {
    return res.json({
      success: true,
      images: [],
      note: 'No images generated yet'
    });
  }

  // Get all session directories
  const sessions = fs.readdirSync(imagesDir, { withFileTypes: true })
    .filter((dirent: any) => dirent.isDirectory())
    .map((dirent: any) => dirent.name);

  const imagesBySession: Record<string, string[]> = {};

  // Get images from each session
  for (const sessionId of sessions) {
    const sessionPath = resolve(imagesDir, sessionId);
    const images = fs.readdirSync(sessionPath)
      .filter((file: string) => file.endsWith('.png'));

    imagesBySession[sessionId] = images.map((img: string) =>
      `http://localhost:${PORT}/images/${sessionId}/${img}`
    );
  }

  // Also check for images in root directory
  const rootImages = fs.readdirSync(imagesDir)
    .filter((file: string) => file.endsWith('.png'));

  if (rootImages.length > 0) {
    imagesBySession['root'] = rootImages.map((img: string) =>
      `http://localhost:${PORT}/images/${img}`
    );
  }

  const totalImages = Object.values(imagesBySession).reduce(
    (sum, imgs) => sum + imgs.length, 0
  );

  res.json({
    success: true,
    totalImages,
    totalSessions: Object.keys(imagesBySession).length,
    imagesBySession
  });
});

/**
 * Extract summary from messages for debugging
 */
function extractSummary(messages: any[]): string {
  const assistantMessages = messages.filter(m => m.type === 'assistant');
  if (assistantMessages.length === 0) return 'No assistant messages';

  const lastMessage = assistantMessages[assistantMessages.length - 1];
  const content = lastMessage.content || '';

  return content.length > 200 ? content.substring(0, 200) + '...' : content;
}

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║     Creative Ad Agent Server Running         ║
╠══════════════════════════════════════════════╣
║  🚀 Server: http://localhost:${PORT}           ║
║                                              ║
║  Core Endpoints:                             ║
║  📝 POST /test - Test query with sessions    ║
║  🎨 POST /generate - Generate ad campaigns   ║
║  💚 GET /health - Health check               ║
║                                              ║
║  Session Management:                         ║
║  📋 GET /sessions - List active sessions     ║
║  📊 GET /sessions/:id - Get session info     ║
║  🔄 POST /sessions/:id/continue - Resume     ║
║  🌿 POST /sessions/:id/fork - Fork variant   ║
║  🌳 GET /sessions/:id/family - Session tree  ║
║                                              ║
║  Image Generation (nano_banana):             ║
║  🖼️  GET /images - List all generated images  ║
║  📸 GET /images/:session/:file - Serve image ║
╠══════════════════════════════════════════════╣
║  Features Enabled:                           ║
║  ✅ Session Management & Forking             ║
║  ✅ MCP Tools (nano_banana v3.0 - simple)    ║
║  ✅ Synchronous Generation (up to 3 images)  ║
║  ✅ Subagent MCP Access (validated)          ║
║  ✅ Custom System Prompt (ad specialist)     ║
╠══════════════════════════════════════════════╣
║  Environment:                                ║
║  - Anthropic API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing'}         ║
║  - Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}            ║
║  - Session Storage: ./sessions               ║
║  - Image Storage: ../generated-images        ║
╚══════════════════════════════════════════════╝
  `);
});