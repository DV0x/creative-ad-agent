import { db, generateId } from '../database.js';

const DEFAULT_BALANCE = 5.0; // USD

// 10 credits = $1 USD. DB stores USD, convert at API/WS boundary.
export const CREDITS_PER_USD = 10;

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
  charged_amount_usd: number;       // user-facing charge in USD (= rawCost × COST_MULTIPLIER)
  credits_charged: number | null;
  campaign_name: string | null;
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
  chargedAmountUsd: number;         // user-facing charge in USD (= rawCost × COST_MULTIPLIER)
  creditsCharged: number;
  inputTokens: number;
  outputTokens: number;
  numTurns: number;
  durationMs: number;
}

// ─── Core functions ────────────────────────────────────────────

export function getOrCreateCredits(userId: string): UserCredits {
  const existing = db.prepare(
    'SELECT user_id, balance_usd, total_spent_usd, total_generations FROM user_credits WHERE user_id = ?'
  ).get(userId) as UserCredits | undefined;

  if (existing) return existing;

  db.prepare(
    'INSERT OR IGNORE INTO user_credits (user_id, balance_usd) VALUES (?, ?)'
  ).run(userId, DEFAULT_BALANCE);

  return { user_id: userId, balance_usd: DEFAULT_BALANCE, total_spent_usd: 0, total_generations: 0 };
}

export function getBalance(userId: string): number {
  const credits = getOrCreateCredits(userId);
  return credits.balance_usd;
}

export function recordUsage(
  userId: string,
  campaignId: string,
  usage: RecordUsageInput,
): { newBalance: number; alreadyRecorded: boolean } {
  const id = generateId('usg');

  // Transaction for atomicity
  const txn = db.transaction(() => {
    const insertResult = db.prepare(
      `INSERT OR IGNORE INTO usage_log
        (id, user_id, campaign_id, request_id, event_type, claude_cost_usd, image_count, image_cost_usd, charged_amount_usd, credits_charged, input_tokens, output_tokens, num_turns, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, userId, campaignId, usage.requestId, usage.eventType,
      usage.claudeCostUsd, usage.imageCount, usage.imageCostUsd, usage.chargedAmountUsd, usage.creditsCharged,
      usage.inputTokens, usage.outputTokens, usage.numTurns, usage.durationMs,
    );

    const alreadyRecorded = insertResult.changes === 0;

    if (!alreadyRecorded) {
      db.prepare(
        `UPDATE user_credits
         SET balance_usd = balance_usd - ?,
             total_spent_usd = total_spent_usd + ?,
             total_generations = total_generations + 1,
             updated_at = datetime('now')
         WHERE user_id = ?`
      ).run(usage.chargedAmountUsd, usage.chargedAmountUsd, userId);
    }

    return alreadyRecorded;
  });

  const alreadyRecorded = txn();
  const newBalance = getBalance(userId);
  return { newBalance, alreadyRecorded };
}

export function addCredits(userId: string, amount: number): { newBalance: number } {
  getOrCreateCredits(userId);

  db.prepare(
    `UPDATE user_credits
     SET balance_usd = balance_usd + ?,
         updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(amount, userId);

  return { newBalance: getBalance(userId) };
}

// ─── Query helpers ─────────────────────────────────────────────

export function getUsageLog(userId: string, limit = 20, offset = 0): UsageLogEntry[] {
  return db.prepare(
    `SELECT u.*, c.name AS campaign_name
       FROM usage_log u
       LEFT JOIN campaigns c ON c.id = u.campaign_id
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`
  ).all(userId, limit, offset) as UsageLogEntry[];
}

export interface UsageSummary {
  totalCredits: number;
  campaignCount: number;
  entryCount: number;
  since: string;
}

export function getUsageSummary(userId: string, sinceISODate: string): UsageSummary {
  const row = db.prepare(
    `SELECT
       COALESCE(SUM(credits_charged), 0) AS total_credits,
       COUNT(DISTINCT campaign_id)       AS campaign_count,
       COUNT(*)                          AS entry_count
     FROM usage_log
     WHERE user_id = ? AND created_at >= ?`
  ).get(userId, sinceISODate) as {
    total_credits: number;
    campaign_count: number;
    entry_count: number;
  };

  return {
    totalCredits: Math.round((row?.total_credits ?? 0) * 10) / 10,
    campaignCount: row?.campaign_count ?? 0,
    entryCount: row?.entry_count ?? 0,
    since: sinceISODate,
  };
}
