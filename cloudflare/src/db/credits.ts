import { generateId } from './utils.js';

const DEFAULT_BALANCE = 5.0; // USD

// 10 credits = $1 USD. DB stores USD, convert at API/WS boundary.
export const CREDITS_PER_USD = 10;

// 4x cost multiplier = 75% gross margin. Raw COGS stays in usage_log for visibility.
export const COST_MULTIPLIER = 4;

export interface UserCredits {
  user_id: string;
  balance_usd: number;
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

// ─── Core functions ────────────────────────────────────────────

export async function getOrCreateCredits(db: D1Database, userId: string): Promise<UserCredits> {
  const existing = await db.prepare(
    'SELECT user_id, balance_usd, total_spent_usd, total_generations FROM user_credits WHERE user_id = ?'
  ).bind(userId).first<UserCredits>();

  if (existing) return existing;

  // Auto-provision new user with free credits
  await db.prepare(
    'INSERT OR IGNORE INTO user_credits (user_id, balance_usd) VALUES (?, ?)'
  ).bind(userId, DEFAULT_BALANCE).run();

  return { user_id: userId, balance_usd: DEFAULT_BALANCE, total_spent_usd: 0, total_generations: 0 };
}

export async function getBalance(db: D1Database, userId: string): Promise<number> {
  const credits = await getOrCreateCredits(db, userId);
  return credits.balance_usd;
}

export async function recordUsage(
  db: D1Database,
  userId: string,
  campaignId: string,
  usage: RecordUsageInput,
): Promise<{ newBalance: number; alreadyRecorded: boolean }> {
  const id = generateId('usg');

  // Batch: insert usage log + update credits atomically
  // INSERT OR IGNORE prevents double-charge (UNIQUE on campaign_id + request_id)
  const results = await db.batch([
    db.prepare(
      `INSERT OR IGNORE INTO usage_log
        (id, user_id, campaign_id, request_id, event_type, claude_cost_usd, image_count, image_cost_usd, total_cost_usd, input_tokens, output_tokens, num_turns, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, userId, campaignId, usage.requestId, usage.eventType,
      usage.claudeCostUsd, usage.imageCount, usage.imageCostUsd, usage.totalCostUsd,
      usage.inputTokens, usage.outputTokens, usage.numTurns, usage.durationMs,
    ),
    db.prepare(
      `UPDATE user_credits
       SET balance_usd = balance_usd - ?,
           total_spent_usd = total_spent_usd + ?,
           total_generations = total_generations + 1,
           updated_at = datetime('now')
       WHERE user_id = ?`
    ).bind(usage.totalCostUsd, usage.totalCostUsd, userId),
  ]);

  // Check if the INSERT actually inserted (changes > 0) or was ignored (duplicate)
  const insertResult = results[0];
  const alreadyRecorded = (insertResult.meta?.changes ?? 0) === 0;

  // If it was a duplicate, undo the UPDATE (it ran unconditionally in the batch)
  if (alreadyRecorded) {
    await db.prepare(
      `UPDATE user_credits
       SET balance_usd = balance_usd + ?,
           total_spent_usd = total_spent_usd - ?,
           total_generations = total_generations - 1,
           updated_at = datetime('now')
       WHERE user_id = ?`
    ).bind(usage.totalCostUsd, usage.totalCostUsd, userId).run();
  }

  const newBalance = await getBalance(db, userId);
  return { newBalance, alreadyRecorded };
}

export async function addCredits(db: D1Database, userId: string, amount: number): Promise<{ newBalance: number }> {
  // Ensure user exists
  await getOrCreateCredits(db, userId);

  await db.prepare(
    `UPDATE user_credits
     SET balance_usd = balance_usd + ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).bind(amount, userId).run();

  const newBalance = await getBalance(db, userId);
  return { newBalance };
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
