import type { Env } from './env.js';
import { handleApiRequest } from './router.js';
import { verifyWebSocketToken } from './auth.js';

// Re-export Durable Object classes (required by wrangler)
export { CampaignSession } from './durable-objects/campaign-session.js';
export { Sandbox } from '@cloudflare/sandbox';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade → route to Durable Object
    if (url.pathname === '/ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const token = url.searchParams.get('token');
      const userId = await verifyWebSocketToken(token, env);
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      // One DO per user — pass userId via internal header
      const doId = env.CAMPAIGN_SESSION.idFromName(userId);
      const stub = env.CAMPAIGN_SESSION.get(doId);

      const doRequest = new Request(request.url, request);
      doRequest.headers.set('X-User-Id', userId);
      return stub.fetch(doRequest);
    }

    // REST API, image serving, health check
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname === '/health'
    ) {
      return handleApiRequest(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
