/**
 * Creative Agent - Cloudflare Worker Entry Point
 *
 * Routes HTTP requests to appropriate handlers and manages
 * sandbox lifecycle for agent execution.
 */

import { getSandbox, proxyToSandbox, type Sandbox } from "@cloudflare/sandbox";
export { Sandbox } from "@cloudflare/sandbox";

import { handleGenerate } from "./handlers/generate";
import { handleSessionsList, handleSessionRoute } from "./handlers/sessions";
import { handleImageRoute } from "./handlers/images";

export interface Env {
  Sandbox: DurableObjectNamespace<Sandbox>;
  DB: D1Database;
  STORAGE: R2Bucket;
  ANTHROPIC_API_KEY: string;
  GEMINI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  ENVIRONMENT: string;
  // R2 S3-compatible credentials for mountBucket
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
}

// CORS headers for API responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle sandbox proxy (for preview URLs if needed)
    const proxyResponse = await proxyToSandbox(request, env);
    if (proxyResponse) return proxyResponse;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route based on path
      switch (url.pathname) {
        case "/":
          return Response.json(
            {
              name: "Creative Agent API",
              version: "1.0.0",
              endpoints: [
                "GET /health",
                "POST /generate",
                "GET /sessions",
                "GET /sessions/:id",
                "POST /sessions/:id/continue",
                "POST /sessions/:id/fork",
                "GET /images/:sessionId/:filename",
              ],
            },
            { headers: corsHeaders }
          );

        case "/health":
          return Response.json(
            {
              status: "ok",
              timestamp: new Date().toISOString(),
              environment: env.ENVIRONMENT || "production",
            },
            { headers: corsHeaders }
          );

        case "/generate":
          if (request.method !== "POST") {
            return new Response("Method not allowed", {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleGenerate(request, env, ctx, corsHeaders);

        case "/sessions":
          if (request.method !== "GET") {
            return new Response("Method not allowed", {
              status: 405,
              headers: corsHeaders,
            });
          }
          return handleSessionsList(env, corsHeaders);

        default:
          // Handle /sessions/:id routes
          if (url.pathname.startsWith("/sessions/")) {
            return handleSessionRoute(request, env, url, corsHeaders);
          }

          // Handle /images routes
          if (url.pathname.startsWith("/images/")) {
            return handleImageRoute(request, env, url);
          }

          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return Response.json(
        {
          error: error instanceof Error ? error.message : "Internal server error",
          timestamp: new Date().toISOString(),
        },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
