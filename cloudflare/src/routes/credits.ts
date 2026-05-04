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

  // GET /api/credits/usage — paginated usage history (DTO ONLY — no COGS)
  if (sub === '/usage' && method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const usage = await credits.getUsageLog(env.DB, userId, limit, offset);

    // ⚠️ DO NOT add cost or token fields to this response shape.
    // usage_log stores raw COGS for margin tracking — exposing claude_cost_usd,
    // image_cost_usd, charged_amount_usd, input_tokens, output_tokens, num_turns,
    // or duration_ms lets users reverse-engineer our gross margin.
    // User-facing fields only.
    return Response.json({
      usage: usage.map(u => ({
        id: u.id,
        campaign_id: u.campaign_id,
        campaign_name: u.campaign_name,
        event_type: u.event_type,
        image_count: u.image_count,
        // Prefer the stored value; fall back to charged_amount_usd for any row
        // not yet backfilled (defensive — the migration backfilled all existing rows).
        credits_charged: u.credits_charged ?? Math.round(u.charged_amount_usd * CREDITS_PER_USD * 10) / 10,
        created_at: u.created_at,
      })),
    });
  }

  // GET /api/credits/usage/summary?since=YYYY-MM-DD
  if (sub === '/usage/summary' && method === 'GET') {
    const url = new URL(request.url);
    const since = url.searchParams.get('since');
    if (!since) {
      return Response.json({ error: 'since param required (ISO date)' }, { status: 400 });
    }
    const summary = await credits.getUsageSummary(env.DB, userId, since);
    return Response.json(summary);
  }

  return new Response('Not Found', { status: 404 });
}
