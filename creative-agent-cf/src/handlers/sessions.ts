/**
 * Sessions Handler
 *
 * GET /sessions - List all sessions
 * GET /sessions/:id - Get session details
 * POST /sessions/:id/continue - Continue session with new prompt
 * POST /sessions/:id/fork - Fork session for A/B testing
 */

import { getSandbox } from "@cloudflare/sandbox";
import type { Env } from "../index";

/**
 * GET /sessions - List all sessions
 */
export async function handleSessionsList(
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      `
      SELECT id, created_at, updated_at, status, campaign_name, brand_url
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 100
    `
    ).all();

    return Response.json(
      {
        sessions: result.results,
        total: result.results.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[sessions] List error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to list sessions",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Handle session routes:
 * - GET /sessions/:id
 * - POST /sessions/:id/continue
 * - POST /sessions/:id/fork
 */
export async function handleSessionRoute(
  request: Request,
  env: Env,
  url: URL,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const parts = url.pathname.split("/");
  const sessionId = parts[2];
  const action = parts[3];

  if (!sessionId) {
    return Response.json(
      { error: "Session ID is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  // GET /sessions/:id - Get session details
  if (request.method === "GET" && !action) {
    return getSession(env, sessionId, corsHeaders);
  }

  // POST /sessions/:id/continue - Continue session
  if (request.method === "POST" && action === "continue") {
    return continueSession(request, env, sessionId, corsHeaders);
  }

  // POST /sessions/:id/fork - Fork session
  if (request.method === "POST" && action === "fork") {
    return forkSession(request, env, sessionId, corsHeaders);
  }

  return new Response("Not Found", { status: 404, headers: corsHeaders });
}

/**
 * Get session details by ID
 */
async function getSession(
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      `
      SELECT * FROM sessions WHERE id = ?
    `
    )
      .bind(sessionId)
      .first();

    if (!result) {
      return Response.json(
        { error: "Session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse JSON data field
    let data = null;
    if (result.data) {
      try {
        data = JSON.parse(result.data as string);
      } catch {
        data = result.data;
      }
    }

    // Get images for this session from R2
    const images: string[] = [];
    try {
      const listResult = await env.STORAGE.list({
        prefix: `images/${sessionId}/`,
      });
      for (const object of listResult.objects) {
        const filename = object.key.split("/").pop();
        if (filename) {
          images.push(`/images/${sessionId}/${filename}`);
        }
      }
    } catch (err) {
      console.error("[sessions] Error listing images:", err);
    }

    return Response.json(
      {
        session: {
          ...result,
          data,
          images,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[sessions] Get error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to get session",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Continue session with a new prompt
 */
async function continueSession(
  request: Request,
  env: Env,
  sessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get existing session
    const existing = await env.DB.prepare(
      `SELECT * FROM sessions WHERE id = ?`
    )
      .bind(sessionId)
      .first();

    if (!existing) {
      return Response.json(
        { error: "Session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse new prompt
    const body = await request.json() as { prompt?: string };
    const { prompt } = body;

    if (!prompt) {
      return Response.json(
        { error: "prompt is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get sandbox and continue
    const sandbox = getSandbox(env.Sandbox, sessionId);

    // Mount R2
    await sandbox.mountBucket("creative-agent-storage", "/storage", {
      endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    });

    // Run agent with continuation prompt
    const result = await sandbox.exec("npx tsx /workspace/agent-runner.ts", {
      env: {
        PROMPT: prompt,
        SESSION_ID: sessionId,
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        GEMINI_API_KEY: env.GEMINI_API_KEY,
      },
      timeout: 960000, // 16 min timeout
    });

    if (!result.success) {
      return Response.json(
        {
          error: "Agent execution failed",
          stderr: result.stderr,
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const output = JSON.parse(result.stdout);

    // Update session in D1
    await env.DB.prepare(
      `
      UPDATE sessions
      SET updated_at = datetime('now'), data = ?
      WHERE id = ?
    `
    )
      .bind(JSON.stringify(output), sessionId)
      .run();

    return Response.json(
      {
        sessionId,
        result: output.result,
        messages: output.messages,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[sessions] Continue error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to continue session",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Fork session for A/B testing
 */
async function forkSession(
  request: Request,
  env: Env,
  parentSessionId: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    // Get parent session
    const parent = await env.DB.prepare(
      `SELECT * FROM sessions WHERE id = ?`
    )
      .bind(parentSessionId)
      .first();

    if (!parent) {
      return Response.json(
        { error: "Parent session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Parse optional modifications
    const body = await request.json() as { prompt?: string; name?: string };
    const { prompt, name } = body;

    // Create new session ID
    const newSessionId = crypto.randomUUID();

    // Create forked session in D1
    await env.DB.prepare(
      `
      INSERT INTO sessions (id, created_at, updated_at, status, campaign_name, brand_url, data, parent_session_id)
      VALUES (?, datetime('now'), datetime('now'), 'forked', ?, ?, ?, ?)
    `
    )
      .bind(
        newSessionId,
        name || parent.campaign_name,
        parent.brand_url,
        parent.data,
        parentSessionId
      )
      .run();

    // If a new prompt is provided, run the agent
    if (prompt) {
      const sandbox = getSandbox(env.Sandbox, newSessionId);

      await sandbox.mountBucket("creative-agent-storage", "/storage", {
        endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      });

      await sandbox.exec(`mkdir -p /storage/images/${newSessionId}`);

      const result = await sandbox.exec("npx tsx /workspace/agent-runner.ts", {
        env: {
          PROMPT: prompt,
          SESSION_ID: newSessionId,
          ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
          GEMINI_API_KEY: env.GEMINI_API_KEY,
        },
        timeout: 960000, // 16 min timeout
      });

      if (result.success) {
        const output = JSON.parse(result.stdout);
        await env.DB.prepare(
          `
          UPDATE sessions
          SET updated_at = datetime('now'), status = 'completed', data = ?
          WHERE id = ?
        `
        )
          .bind(JSON.stringify(output), newSessionId)
          .run();
      }
    }

    return Response.json(
      {
        sessionId: newSessionId,
        parentSessionId,
        message: "Session forked successfully",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("[sessions] Fork error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to fork session",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
