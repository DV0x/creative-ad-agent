import type { Env } from './env.js';
import { handleApiRequest } from './router.js';
import { verifyWebSocketToken } from './auth.js';
import { handleDodoWebhook } from './routes/webhooks.js';
import { handleClerkWebhook } from './routes/webhooks-clerk.js';

// Re-export Durable Object classes (required by wrangler)
export { CampaignSession } from './durable-objects/campaign-session.js';
export { Sandbox } from '@cloudflare/sandbox';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // WebSocket upgrade → route to Durable Object
    if (url.pathname === '/ws') {
      console.log(`[trace][worker][ws_upgrade] method=${method}`);
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const token = url.searchParams.get('token');
      const userId = await verifyWebSocketToken(token, env);
      console.log(`[trace][worker][ws_auth] userId=${userId || 'null'} tokenPresent=${!!token}`);
      if (!userId) {
        console.log('[trace][worker][ws_rejected] reason=no_userId');
        return new Response('Unauthorized', { status: 401 });
      }

      // One DO per user — pass userId via internal header
      const doId = env.CAMPAIGN_SESSION.idFromName(userId);
      const stub = env.CAMPAIGN_SESSION.get(doId, { locationHint: 'enam' });

      const doRequest = new Request(request.url, request);
      doRequest.headers.set('X-User-Id', userId);
      console.log(`[trace][worker][ws_forward] userId=${userId}`);
      return stub.fetch(doRequest);
    }

    // Dodo Payments webhook (unauthenticated, signature-verified)
    if (url.pathname === '/webhooks/dodo' && method === 'POST') {
      return handleDodoWebhook(request, env);
    }

    // Clerk identity webhook — keeps users table in sync with Clerk
    if (url.pathname === '/webhooks/clerk' && method === 'POST') {
      return handleClerkWebhook(request, env);
    }

    // REST API, image serving, health check
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname === '/health'
    ) {
      console.log(`[trace][worker][api] method=${method} path=${url.pathname}`);
      const response = await handleApiRequest(request, env);
      console.log(`[trace][worker][api_done] method=${method} path=${url.pathname} status=${response.status}`);
      return response;
    }

    // Serve static assets (React SPA) for all other routes
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
