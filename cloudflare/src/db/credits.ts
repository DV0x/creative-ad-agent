import { generateId } from './utils.js';

// 10 credits = $1 USD. DB stores USD, convert at API/WS boundary.
export const CREDITS_PER_USD = 10;

// 4x cost multiplier = 75% gross margin. Raw COGS stays in usage_log for visibility.
export const COST_MULTIPLIER = 4;

// Two balance pools:
//   balance_usd       = plan pool (reset on subscription.renewed & .expired)
//   balance_usd_topup = permanent pool (grown by top-ups, never auto-wiped)
// Spend order: plan first, then topup — so users burn their monthly allowance
// before eating into credits they explicitly paid for.
export interface UserCredits {
  user_id: string;
  balance_usd: number;
  balance_usd_topup: number;
  total_spent_usd: number;
  total_generations: number;
}

export interface UsageLogEntry {
  id: string;
  user_id: string;
  campaign_id: string;
  request_id: string;
  event_type: string;
  claude_cost_usd: number;
  image_count: number;
  image_cost_usd: number;
  total_cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  num_turns: number;
  duration_ms: number;
  created_at: string;
}

export interface RecordUsageInput {
  requestId: string;
  eventType: string;
  claudeCostUsd: number;
  imageCount: number;
  imageCostUsd: number;
  totalCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  numTurns: number;
  durationMs: number;
}

// ─── Core reads ────────────────────────────────────────────────

export async function getOrCreateCredits(db: D1Database, userId: string): Promise<UserCredits> {
  const existing = await db.prepare(
    `SELECT user_id, balance_usd, balance_usd_topup, total_spent_usd, total_generations
     FROM user_credits WHERE user_id = ?`
  ).bind(userId).first<UserCredits>();

  if (existing) return existing;

  await db.prepare(
    'INSERT OR IGNORE INTO user_credits (user_id) VALUES (?)'
  ).bind(userId).run();

  return {
    user_id: userId,
    balance_usd: 0,
    balance_usd_topup: 0,
    total_spent_usd: 0,
    total_generations: 0,
  };
}

// Total spendable balance = plan + topup. This is what callers compare against cost.
export async function getBalance(db: D1Database, userId: string): Promise<number> {
  const c = await getOrCreateCredits(db, userId);
  return c.balance_usd + c.balance_usd_topup;
}

// ─── Grants ────────────────────────────────────────────────────

export async function addPlanCredits(db: D1Database, userId: string, amountUsd: number): Promise<void> {
  await getOrCreateCredits(db, userId);
  await db.prepare(
    `UPDATE user_credits
     SET balance_usd = balance_usd + ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).bind(amountUsd, userId).run();
}

export async function addTopupCredits(db: D1Database, userId: string, amountUsd: number): Promise<void> {
  await getOrCreateCredits(db, userId);
  await db.prepare(
    `UPDATE user_credits
     SET balance_usd_topup = balance_usd_topup + ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).bind(amountUsd, userId).run();
}

// Used by subscription.renewed (reset to 0 before granting new) and .expired (zero it out).
export async function setPlanBalance(db: D1Database, userId: string, amountUsd: number): Promise<void> {
  await getOrCreateCredits(db, userId);
  await db.prepare(
    `UPDATE user_credits
     SET balance_usd = ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).bind(amountUsd, userId).run();
}

// ─── Refunds ───────────────────────────────────────────────────
// Deduct `amountUsd` from the user's balance, floored at 0.
// `preferPool` controls which pool we take from first — pick the pool the
// credits originally came from (plan for sub refund, topup for top-up refund).
// If that pool is insufficient, spill into the other pool (also floored at 0).
export async function refundCredits(
  db: D1Database,
  userId: string,
  amountUsd: number,
  preferPool: 'plan' | 'topup',
): Promise<void> {
  await getOrCreateCredits(db, userId);

  // In the CASE expressions below, SQL evaluates all SET clauses against the
  // row's old values — so the post-update values of the "other" pool correctly
  // see the pre-update value of the preferred pool.
  if (preferPool === 'plan') {
    await db.prepare(
      `UPDATE user_credits
       SET balance_usd_topup = CASE
             WHEN balance_usd >= ? THEN balance_usd_topup
             ELSE MAX(0, balance_usd_topup - (? - balance_usd))
           END,
           balance_usd = CASE
             WHEN balance_usd >= ? THEN balance_usd - ?
             ELSE 0
           END,
           updated_at = datetime('now')
       WHERE user_id = ?`
    ).bind(amountUsd, amountUsd, amountUsd, amountUsd, userId).run();
  } else {
    await db.prepare(
      `UPDATE user_credits
       SET balance_usd = CASE
             WHEN balance_usd_topup >= ? THEN balance_usd
             ELSE MAX(0, balance_usd - (? - balance_usd_topup))
           END,
           balance_usd_topup = CASE
             WHEN balance_usd_topup >= ? THEN balance_usd_topup - ?
             ELSE 0
           END,
           updated_at = datetime('now')
       WHERE user_id = ?`
    ).bind(amountUsd, amountUsd, amountUsd, amountUsd, userId).run();
  }
}

// ─── Spend ─────────────────────────────────────────────────────

export async function recordUsage(
  db: D1Database,
  userId: string,
  campaignId: string,
  usage: RecordUsageInput,
): Promise<{ newBalance: number; planBalance: number; topupBalance: number; alreadyRecorded: boolean }> {
  const id = generateId('usg');

  // INSERT first. UNIQUE(campaign_id, request_id) makes this idempotent —
  // a duplicate attempt yields changes=0 and we skip the deduct entirely.
  const insertResult = await db.prepare(
    `INSERT OR IGNORE INTO usage_log
      (id, user_id, campaign_id, request_id, event_type, claude_cost_usd, image_count, image_cost_usd, total_cost_usd, input_tokens, output_tokens, num_turns, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, userId, campaignId, usage.requestId, usage.eventType,
    usage.claudeCostUsd, usage.imageCount, usage.imageCostUsd, usage.totalCostUsd,
    usage.inputTokens, usage.outputTokens, usage.numTurns, usage.durationMs,
  ).run();

  const alreadyRecorded = (insertResult.meta?.changes ?? 0) === 0;
  if (alreadyRecorded) {
    const c = await getOrCreateCredits(db, userId);
    return {
      newBalance: c.balance_usd + c.balance_usd_topup,
      planBalance: c.balance_usd,
      topupBalance: c.balance_usd_topup,
      alreadyRecorded: true,
    };
  }

  // Deduct plan pool first, spill into topup pool. No floor: if pre-spend check
  // missed an over-draw, let it go negative so we can detect it in audits.
  await db.prepare(
    `UPDATE user_credits
     SET balance_usd_topup = CASE
           WHEN balance_usd >= ? THEN balance_usd_topup
           ELSE balance_usd_topup - (? - balance_usd)
         END,
         balance_usd = CASE
           WHEN balance_usd >= ? THEN balance_usd - ?
           ELSE 0
         END,
         total_spent_usd = total_spent_usd + ?,
         total_generations = total_generations + 1,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).bind(
    usage.totalCostUsd, usage.totalCostUsd,
    usage.totalCostUsd, usage.totalCostUsd,
    usage.totalCostUsd, userId,
  ).run();

  const c = await getOrCreateCredits(db, userId);
  return {
    newBalance: c.balance_usd + c.balance_usd_topup,
    planBalance: c.balance_usd,
    topupBalance: c.balance_usd_topup,
    alreadyRecorded: false,
  };
}

// ─── Query helpers ─────────────────────────────────────────────

export async function getUsageLog(
  db: D1Database,
  userId: string,
  limit = 20,
  offset = 0,
): Promise<UsageLogEntry[]> {
  const result = await db.prepare(
    'SELECT * FROM usage_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(userId, limit, offset).all<UsageLogEntry>();

  return result.results;
}

// Look up the original credit for a given Dodo payment_id.
// Used by the refund handler — refund webhooks don't carry the original
// payment's metadata, so we re-derive user_id, event_type, and credited
// amount from our stored payment_events row.
export async function getPaymentCredit(
  db: D1Database,
  paymentId: string,
): Promise<{ user_id: string | null; event_type: string; amount_credited_usd: number | null } | null> {
  // Find the most recent credit-granting event for this payment_id.
  // We filter to event_types that actually grant credits so we don't pick up
  // the subscription.active "state only" row (which has no amount).
  const row = await db.prepare(
    `SELECT user_id, event_type, amount_credited_usd
     FROM payment_events
     WHERE event_type IN ('payment.succeeded', 'subscription.renewed')
       AND amount_credited_usd IS NOT NULL
       AND metadata LIKE ?
     ORDER BY created_at DESC
     LIMIT 1`
  ).bind(`%"payment_id":"${paymentId}"%`).first<{
    user_id: string | null;
    event_type: string;
    amount_credited_usd: number | null;
  }>();
  return row;
}
