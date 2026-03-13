import type { Env } from '../env.js';

export async function handleHealthRequest(env: Env): Promise<Response> {
  try {
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM campaigns',
    ).first<{ count: number }>();

    return Response.json({
      status: 'ok',
      d1: { connected: true, campaigns: result?.count ?? 0 },
      r2: { bound: !!env.R2_BUCKET },
      auth: { clerkKeySet: !!env.CLERK_SECRET_KEY },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      {
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
