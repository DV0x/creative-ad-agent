/**
 * Generate Handler
 *
 * POST /generate - Main endpoint for campaign generation
 *
 * Spawns a sandbox container, runs the Agent SDK, and streams results.
 * Uses execStream() for long-running commands per Cloudflare Sandbox SDK docs.
 */

import { getSandbox, parseSSEStream, type ExecEvent } from "@cloudflare/sandbox";
import type { Env } from "../index";

interface GenerateRequest {
  prompt: string;
  sessionId?: string;
}

interface GenerateResponse {
  sessionId: string;
  result: any;
  messages: any[];
  images: string[];
  duration?: number;
}

export async function handleGenerate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const startTime = Date.now();

  // Parse request body
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders }
    );
  }

  const { prompt, sessionId: requestedSessionId } = body;

  if (!prompt) {
    return Response.json(
      { error: "prompt is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // Generate or use provided session ID
  const sessionId = requestedSessionId || crypto.randomUUID();

  console.log(`[generate] Starting session: ${sessionId}`);
  console.log(`[generate] Prompt: ${prompt.substring(0, 100)}...`);

  try {
    // Get or create sandbox for this session
    const sandbox = getSandbox(env.Sandbox, sessionId);

    // Ensure mount point exists (created in Dockerfile, but verify)
    await sandbox.exec(`mkdir -p /storage`);

    // Mount R2 bucket for persistent storage
    await sandbox.mountBucket("creative-agent-storage", "/storage", {
      endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      provider: "r2",
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Create output directories for this session
    await sandbox.exec(`mkdir -p /storage/images/${sessionId}`);
    await sandbox.exec(`mkdir -p /storage/research`);
    await sandbox.exec(`mkdir -p /storage/hooks`);
    await sandbox.exec(`mkdir -p /storage/creatives`);

    console.log(`[generate] Sandbox ready, running agent...`);

    // Debug: Test if claude CLI works (quick version check only)
    const claudeTest = await sandbox.exec("claude --version 2>&1 || echo 'claude not found'", {
      timeout: 10000,
    });
    console.log(`[generate] Claude CLI version: ${claudeTest.stdout.trim()}`);

    // Skip the interactive claude --print test - it hangs waiting for input
    // The real test is running agent-runner.ts which uses the SDK properly

    // Run the agent-runner.ts script using execStream() for long-running commands
    // Per Cloudflare Sandbox SDK docs: execStream() returns immediately with a ReadableStream
    console.log(`[generate] Starting agent-runner.ts with execStream()...`);

    const execStream = await sandbox.execStream("npx tsx /workspace/agent-runner.ts", {
      env: {
        // Agent configuration
        PROMPT: prompt,
        SESSION_ID: sessionId,

        // API keys
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        FAL_KEY: env.FAL_KEY,

        // Claude Code configuration
        HOME: "/root",
        PATH: "/usr/local/bin:/usr/bin:/bin:/root/.npm-global/bin:/usr/local/lib/node_modules/.bin",

        // Non-interactive mode flags (CRITICAL for containerized execution)
        CI: "true",
        CLAUDE_CODE_SKIP_EULA: "true",
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "true",

        // Disable any interactive prompts
        TERM: "dumb",
        NO_COLOR: "1",
      },
      timeout: 960000, // 16 min timeout for long agent runs
    });

    // Transform the stream to add session metadata and handle completion
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Process stream in background using waitUntil
    ctx.waitUntil((async () => {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      let lastEventTime = Date.now();
      let streamActive = true;

      // Send initial status (inside waitUntil so Response is already returned)
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Container started, initializing agent...',
          sessionId,
          timestamp: new Date().toISOString(),
        })}\n\n`));
      } catch (e) {
        console.error('[generate] Failed to write initial status:', e);
      }

      // Heartbeat to prevent Cloudflare timeout
      // Send SSE comment every 15s if no events received for 15s+
      const heartbeatInterval = setInterval(async () => {
        if (!streamActive) return;
        const timeSinceLastEvent = Date.now() - lastEventTime;
        if (timeSinceLastEvent >= 15000) {
          try {
            await writer.write(encoder.encode(`: heartbeat ${new Date().toISOString()}\n\n`));
            console.log(`[generate] Sent heartbeat after ${Math.round(timeSinceLastEvent/1000)}s inactivity`);
          } catch (e) {
            // Writer may be closed, ignore
          }
        }
      }, 15000);

      try {
        for await (const event of parseSSEStream<ExecEvent>(execStream)) {
          lastEventTime = Date.now();

          // Forward event to client with session metadata
          const enrichedEvent = {
            ...event,
            sessionId,
            timestamp: new Date().toISOString(),
          };

          await writer.write(encoder.encode(`data: ${JSON.stringify(enrichedEvent)}\n\n`));

          // Collect output for D1 save
          if (event.type === 'stdout') {
            stdout += event.data;
            console.log(`[agent:${sessionId}:stdout] ${event.data}`);
          } else if (event.type === 'stderr') {
            stderr += event.data;
            console.log(`[agent:${sessionId}:stderr] ${event.data}`);
          } else if (event.type === 'complete') {
            exitCode = event.exitCode ?? 0;
          }
        }

        // Send completion event
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          sessionId,
          success: exitCode === 0,
        })}\n\n`));

        // Save to D1 after stream completes
        const urlMatch = prompt.match(/https?:\/\/[^\s]+/);
        const brandUrl = urlMatch ? urlMatch[0] : null;

        let outputData: any = { stdout, stderr, exitCode };
        try {
          // Try to parse stdout as JSON (agent-runner outputs JSON)
          outputData = JSON.parse(stdout);
        } catch {
          // Keep raw output if not JSON
        }

        await env.DB.prepare(`
          INSERT OR REPLACE INTO sessions (id, created_at, updated_at, status, brand_url, data)
          VALUES (?, datetime('now'), datetime('now'), ?, ?, ?)
        `)
          .bind(
            sessionId,
            exitCode === 0 ? 'completed' : 'failed',
            brandUrl,
            JSON.stringify(outputData)
          )
          .run();

        console.log(`[generate] Session ${sessionId} saved to D1`);

      } catch (error) {
        console.error(`[generate] Stream error:`, error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })}\n\n`));

        // Save error to D1
        await env.DB.prepare(`
          INSERT OR REPLACE INTO sessions (id, created_at, updated_at, status, data)
          VALUES (?, datetime('now'), datetime('now'), 'error', ?)
        `)
          .bind(sessionId, JSON.stringify({ error: String(error), prompt }))
          .run();
      } finally {
        streamActive = false;
        clearInterval(heartbeatInterval);
        await writer.close();
      }
    })());

    // Return SSE stream immediately - no blocking!
    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error(`[generate] Error:`, error);

    // Save error to D1
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO sessions (id, created_at, updated_at, status, data)
      VALUES (?, datetime('now'), datetime('now'), 'error', ?)
    `
    )
      .bind(
        sessionId,
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown error",
          prompt,
        })
      )
      .run();

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        sessionId,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
