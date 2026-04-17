import type { Env } from '../env.js';
import * as credits from '../db/credits.js';
import { CREDITS_PER_USD } from '../db/credits.js';

export async function handleCreditsRequest(
  request: Request,
  env: Env,
  userId: string,
  path: string,
  method: string,
): Promise<Response> {
  const sub = path.replace('/api/credits', '');

  // GET /api/credits — balance + totals (converted to credits)
  if (sub === '' && method === 'GET') {
    const data = await credits.getOrCreateCredits(env.DB, userId);
    const toCredits = (usd: number) => Math.round(usd * CREDITS_PER_USD * 10) / 10;
    return Response.json({
      // balance = plan + topup, the total spendable amount (unchanged contract)
      balance: toCredits(data.balance_usd + data.balance_usd_topup),
      plan_balance: toCredits(data.balance_usd),
      topup_balance: toCredits(data.balance_usd_topup),
      total_spent: toCredits(data.total_spent_usd),
      total_generations: data.total_generations,
    });
  }

  // GET /api/credits/usage — paginated usage history (costs converted to credits)
  if (sub === '/usage' && method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const usage = await credits.getUsageLog(env.DB, userId, limit, offset);
    return Response.json({
      usage: usage.map(u => ({
        ...u,
        total_cost: Math.round(u.total_cost_usd * CREDITS_PER_USD * 10) / 10,
        claude_cost: Math.round(u.claude_cost_usd * CREDITS_PER_USD * 10) / 10,
        image_cost: Math.round(u.image_cost_usd * CREDITS_PER_USD * 10) / 10,
      })),
    });
  }

  return new Response('Not Found', { status: 404 });
}
