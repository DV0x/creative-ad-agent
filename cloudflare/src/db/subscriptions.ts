export type PlanTier = 'free' | 'starter' | 'pro';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'on_hold';

export interface UserSubscription {
  user_id: string;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  plan: PlanTier;
  billing_interval: BillingInterval | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export async function getSubscription(db: D1Database, userId: string): Promise<UserSubscription | null> {
  return db.prepare(
    'SELECT * FROM user_subscriptions WHERE user_id = ?'
  ).bind(userId).first<UserSubscription>();
}

export async function upsertSubscription(
  db: D1Database,
  userId: string,
  data: {
    dodoCustomerId?: string;
    dodoSubscriptionId?: string;
    plan: PlanTier;
    billingInterval?: BillingInterval | null;
    status: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  },
): Promise<void> {
  await db.prepare(
    `INSERT INTO user_subscriptions (user_id, dodo_customer_id, dodo_subscription_id, plan, billing_interval, status, current_period_end)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       dodo_customer_id = COALESCE(excluded.dodo_customer_id, dodo_customer_id),
       dodo_subscription_id = COALESCE(excluded.dodo_subscription_id, dodo_subscription_id),
       plan = excluded.plan,
       billing_interval = excluded.billing_interval,
       status = excluded.status,
       current_period_end = excluded.current_period_end,
       updated_at = datetime('now')`
  ).bind(
    userId,
    data.dodoCustomerId ?? null,
    data.dodoSubscriptionId ?? null,
    data.plan,
    data.billingInterval ?? null,
    data.status,
    data.currentPeriodEnd ?? null,
  ).run();
}

export async function isWebhookProcessed(db: D1Database, webhookId: string): Promise<boolean> {
  const row = await db.prepare(
    'SELECT 1 FROM payment_events WHERE webhook_id = ?'
  ).bind(webhookId).first();
  return row !== null;
}

export async function recordWebhookEvent(
  db: D1Database,
  webhookId: string,
  eventType: string,
  userId: string | null,
  amountUsd: number | null,
  amountCreditedUsd: number | null,
  metadata: string,
): Promise<void> {
  await db.prepare(
    `INSERT OR IGNORE INTO payment_events (webhook_id, event_type, user_id, amount_usd, amount_credited_usd, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(webhookId, eventType, userId, amountUsd, amountCreditedUsd, metadata).run();
}
