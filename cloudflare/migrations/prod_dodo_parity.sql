-- Bring production D1 to parity with staging (Dodo Payments schema).
-- Applied 2026-04-18 before production launch.
-- All statements are additive + idempotent.

ALTER TABLE user_credits ADD COLUMN balance_usd_topup REAL NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  dodo_customer_id TEXT,
  dodo_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro')),
  billing_interval TEXT
    CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'on_hold')),
  current_period_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_events (
  webhook_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  amount_usd REAL,
  amount_credited_usd REAL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_events_user ON payment_events(user_id);
