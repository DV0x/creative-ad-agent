★ Insight ─────────────────────────────────────
  These "quick wins" are like adding power-ups to your existing system without rebuilding it. Each one takes under 2 hours but unlocks new capabilities - think of them as low-hanging fruit that immediately improve
  your ad agent's performance, visibility, or flexibility.
  ─────────────────────────────────────────────────

  ---
  Quick Win #1: settingSources (5 minutes)

  What it is:

  A configuration that controls which settings files the SDK loads from your filesystem.

  Current situation:

  You're not explicitly setting this, so the SDK loads no filesystem settings (the new default).

  Why add it:

  settingSources: ['project']

  This tells the SDK: "Load settings from .claude/settings.json in my project, but ignore user settings from ~/.claude/settings.json"

  Practical benefit:

  - Team consistency: Everyone on your team uses the same agent configurations
  - Environment isolation: Your production server won't accidentally load your personal dev settings
  - CI/CD safety: Your tests run with predictable configurations

  Example use case:

  // In your .claude/settings.json
  {
    "defaultModel": "claude-sonnet-4-5",
    "maxTurns": 50,
    "timeout": 120000
  }

  // With settingSources: ['project'], these settings apply to everyone
  // Without it, each developer might have different settings

  ---
  Quick Win #2: Session Forking (30 minutes)

  What it is:

  Creating a "branch" from an existing conversation to explore different directions without losing the original.

  Think of it like:

  Git branches for conversations. You can try different approaches and compare results.

  How it works:

  // Original session: Generate campaign with "problem-solution" angle
  const originalSession = await generateCampaign(url, {
    angle: "problem-solution"
  });

  // Fork to try "emotional" angle - keeps original intact
  const emotionalVariant = await generateCampaign(url, {
    angle: "emotional",
    resume: originalSession.id,
    forkSession: true  // This creates a branch!
  });

  // Now you have TWO complete campaigns to compare

  Practical benefit for your ad agent:

  Original Session Tree:
  ├─ Brand research
  ├─ Customer insights
  ├─ Problem-Solution campaign (10 copy variations)
  │
  └─ FORK → Emotional campaign (10 different copy variations)
     └─ FORK → Social Proof campaign (10 more variations)

  Real-world use case:

  // Client asks: "Can you try a different creative approach?"
  // Instead of starting over (losing all research):

  app.post('/generate-variant', async (req, res) => {
    const { originalSessionId, newAngle } = req.body;

    // Reuse ALL the research from original session
    // Only regenerate the creative strategy + copy
    const variant = await aiClient.queryWithSession(
      `Using the same brand research, create ${newAngle} angle campaign`,
      originalSessionId,
      { oneShot: false },
      undefined,
      { forkSession: true }  // Branch off!
    );

    // Result: New campaign in 10 seconds instead of 30
    // (because you skip the research phase)
  });

  Time saved: 70% faster for variations (reuses research)

  ---
  Quick Win #3: Permission Hooks (1 hour)

  What it is:

  Callbacks that run before and after every tool the agent uses.

  Think of it like:

  Security cameras for your agent - you see everything it's doing in real-time.

  How it works:

  hooks: {
    PreToolUse: [{
      hooks: [async (input, toolUseId) => {
        // Runs BEFORE agent uses a tool
        console.log(`🔧 Agent wants to use: ${input.tool_name}`);
        console.log(`   Input: ${JSON.stringify(input.tool_input)}`);

        // You could block dangerous operations:
        if (input.tool_name === "Bash" && input.tool_input.command.includes("rm -rf")) {
          return { decision: "block", reason: "Dangerous command" };
        }

        return { continue: true };  // Allow it
      }]
    }],

    PostToolUse: [{
      hooks: [async (input, toolUseId) => {
        // Runs AFTER tool completes
        console.log(`✅ Tool ${input.tool_name} finished`);
        console.log(`   Result: ${input.tool_response}`);
        return { continue: true };
      }]
    }]
  }

  Practical benefits for your ad agent:

  1. Debugging visibility:
  🔧 Agent wants to use: Task
     Input: { subagent_type: "brand-intelligence-analyst", prompt: "..." }
  ✅ Tool Task finished
     Duration: 5.2s

  🔧 Agent wants to use: WebFetch
     Input: { url: "https://nike.com", prompt: "..." }
  ✅ Tool WebFetch finished
     Duration: 2.1s

  2. Cost tracking per tool:
  PreToolUse: async (input) => {
    toolStartTimes.set(input.tool_name, Date.now());
    return { continue: true };
  }

  PostToolUse: async (input) => {
    const duration = Date.now() - toolStartTimes.get(input.tool_name);
    console.log(`${input.tool_name} took ${duration}ms`);

    // Track which agents are slowest
    await db.recordToolMetrics({
      tool: input.tool_name,
      duration,
      cost: estimateCost(input)
    });
  }

  3. Audit logging:
  PreToolUse: async (input, toolUseId) => {
    await auditLog.record({
      campaignId: currentCampaignId,
      action: input.tool_name,
      input: input.tool_input,
      timestamp: new Date()
    });

    return { continue: true };
  }

  Real-world example:

  Campaign Report:
  - brand-intelligence-analyst: 3 tool calls, 8.5s total
  - customer-psychology-specialist: 2 tool calls, 4.2s total
  - copy-creator: 5 tool calls, 12.1s total

  Bottleneck identified: copy-creator taking too long
  → Optimize: Use faster model (Haiku) for copy generation

  ---
  Quick Win #4: Programmatic Agents (2 hours)

  What it is:

  Defining your agents in code instead of separate files.

  Current approach (file-based):

  .claude/agents/
  ├── brand-intelligence-analyst.md
  ├── customer-psychology-specialist.md
  ├── copy-creator.md
  └── competitive-intelligence-specialist.md

  New approach (programmatic):

  const agents = {
    "brand-intelligence-analyst": {
      description: "Extract brand identity and USPs",
      tools: ["WebFetch", "Grep"],
      prompt: `You are a brand analyst...`,
      model: "inherit"
    },
    "copy-creator": {
      description: "Generate ad copy with proven frameworks",
      tools: ["Write"],
      prompt: `You are an expert copywriter...`,
      model: "inherit"
    }
  };

  // Add to SDK options
  aiClient.defaultOptions.agents = agents;

  Why is this better?

  1. Dynamic Configuration

  // Different agent prompts for different campaign types
  const getAgents = (campaignType: string) => {
    if (campaignType === "B2B") {
      return {
        "copy-creator": {
          prompt: "You write professional B2B copy focusing on ROI..."
        }
      };
    } else {
      return {
        "copy-creator": {
          prompt: "You write emotional DTC copy focusing on lifestyle..."
        }
      };
    }
  };

  // Use different agents per request
  app.post('/generate', async (req, res) => {
    aiClient.setAgents(getAgents(req.body.campaignType));
    // Now generates B2B or DTC optimized copy automatically
  });

  2. A/B Testing

  // Test which copy-creator prompt performs better
  const variantA = {
    "copy-creator": {
      prompt: "Use AIDA framework for all copy..."
    }
  };

  const variantB = {
    "copy-creator": {
      prompt: "Use PAS framework for all copy..."
    }
  };

  // Split traffic and measure conversion rates
  if (Math.random() > 0.5) {
    aiClient.setAgents(variantA);
  } else {
    aiClient.setAgents(variantB);
  }

  3. Easy Updates

  // File-based: Edit 4 separate .md files, redeploy
  // Programmatic: Change one object, hot-reload

  const AGENT_CONFIG = {
    version: "2.0",
    agents: {
      // Update all agents instantly
    }
  };

  4. Environment-Specific Agents

  const agents =
    process.env.NODE_ENV === 'production'
      ? productionAgents  // Strict, cost-optimized
      : developmentAgents; // Verbose, detailed logging

  Real-world example:

  // Client: "Make the copy more aggressive"
  // Instead of editing 4 markdown files:

  agents["copy-creator"].prompt = `
    You are an expert copywriter specializing in AGGRESSIVE, 
    high-urgency direct response copy. Use power words, 
    create FOMO, emphasize scarcity...
  `;

  // Regenerate instantly with new tone

  ---
  Quick Win #5: Image Attachment Support (1 hour)

  What it is:

  Sending images to Claude along with text prompts (multi-modal input).

  Current limitation:

  You can only send text: "Analyze this brand: https://nike.com"

  With image attachments:

  // Send text + image
  {
    prompt: "Analyze this product and generate ad concepts",
    attachments: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: "iVBORw0KGgoAAAANSUhEUgA..."
        }
      }
    ]
  }

  Practical benefits for your ad agent:

  1. Product-First Campaigns

  app.post('/generate-from-product', upload.single('productImage'), async (req, res) => {
    const { brandUrl } = req.body;
    const productImage = req.file.buffer.toString('base64');

    const prompt = `
      Analyze this product image and create ad campaign for ${brandUrl}.
      
      1. Identify product features visible in the image
      2. Suggest angles that highlight these features
      3. Generate copy that references the visual
    `;

    // Claude can SEE the product now!
    const campaign = await aiClient.queryStream(prompt, {}, [{
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: productImage
      }
    }]);
  });

  Result:
  Agent sees: Running shoe with bright orange accents
  Agent generates:
  - "Light up your run with blazing speed"
  - "Orange you ready to crush your goals?"
  - Copy references the actual visual features

  2. Competitive Analysis

  // Upload competitor's ad image
  const competitorAd = await fetch('competitor-ad.jpg');

  const prompt = `
    Analyze this competitor ad:
    1. What visual techniques are they using?
    2. What's their color scheme?
    3. What messaging angle?
    4. Generate 3 ads that are better
  `;

  // Claude analyzes the actual visual

  3. Brand Style Matching

  // Upload client's existing ad
  const existingAd = req.files.referenceAd;

  const prompt = `
    Match the visual style of this reference ad:
    - Same color palette
    - Similar composition
    - Consistent brand feel
    
    Generate new campaign that fits this style
  `;

  4. Screenshot Analysis

  // User uploads screenshot of their website
  const screenshot = req.files.homepage;

  const prompt = `
    Based on this homepage screenshot:
    1. Extract brand colors
    2. Identify visual style (minimal/bold/playful)
    3. Generate ads that match the website aesthetic
  `;

  // Agent can see the actual design

  Real-world example:

  Without images:
  User: "Generate ads for my coffee brand"
  Agent: Creates generic coffee ads

  With images:
  User: "Generate ads for my coffee brand" + [uploads product photo]
  Agent sees: Elegant glass bottle, gold accents, minimalist label
  Agent creates: Luxury-focused ads with "Golden hour in a bottle"
                messaging that matches the premium visual style

  ---
  Summary: How They Work Together

  These 5 quick wins complement each other:

  // 1. settingSources: Load team configurations
  settingSources: ['project']

  // 2. Programmatic agents: Define agents in code for flexibility
  agents: dynamicAgents(campaignType)

  // 3. Permission hooks: Log everything for debugging
  hooks: { PreToolUse: [logTool], PostToolUse: [trackMetrics] }

  // 4. Session forking: Try variants quickly
  forkSession: true

  // 5. Image attachments: Visual-first campaigns
  attachments: [productImage]

  Combined result:
  - Consistent team settings ✅
  - Dynamic agent configuration ✅
  - Full visibility into operations ✅
  - Fast A/B testing ✅
  - Visual-aware campaigns ✅

  ★ Insight ─────────────────────────────────────
  Think of these as upgrading from a basic car to one with GPS, dashcam, turbo mode, and backup camera. The core functionality (driving) is the same, but you gain visibility, flexibility, speed, and safety. Each quick
   win is independent - you can implement them in any order based on your immediate needs.
  ─────────────────────────────────────────────────

