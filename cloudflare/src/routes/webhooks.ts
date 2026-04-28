import type { Env } from '../env.js';
import {
  addPlanCredits,
  addTopupCredits,
  setPlanBalance,
  refundCredits,
  getPaymentCredit,
} from '../db/credits.js';
import {
  getSubscription,
  upsertSubscription,
  isWebhookProcessed,
  recordWebhookEvent,
} from '../db/subscriptions.js';
import type { PlanTier } from '../db/subscriptions.js';

// ── Plan config ──────────────────────────────────────────────────
// Maps Dodo product_id → plan tier + credit amount.
// Product IDs come from env vars (differ per staging/production).

interface PlanInfo {
  plan: 'starter' | 'pro';
  interval: 'monthly' | 'yearly';
  baseCreditsUsd: number;
}

function planConfig(env: Env): Record<string, PlanInfo> {
  return {
    [env.DODO_PRODUCT_STARTER_MONTHLY]: { plan: 'starter', interval: 'monthly', baseCreditsUsd: 25.0 },    // 275 credits (×1.1)
    [env.DODO_PRODUCT_STARTER_YEARLY]:  { plan: 'starter', interval: 'yearly',  baseCreditsUsd: 300.0 },   // 3,300 credits (×1.1)
    [env.DODO_PRODUCT_PRO_MONTHLY]:     { plan: 'pro',     interval: 'monthly', baseCreditsUsd: 75.0 },    // 900 credits (×1.2)
    [env.DODO_PRODUCT_PRO_YEARLY]:      { plan: 'pro',     interval: 'yearly',  baseCreditsUsd: 900.0 },   // 10,800 credits (×1.2)
  };
}

const BONUS_MULTIPLIER: Record<PlanTier, number> = {
  free: 1.0,
  starter: 1.1,
  pro: 1.2,
};

// ── HMAC verification ────────────────────────────────────────────

async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  webhookId: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader || !timestampHeader || !webhookId) return false;

  // Reject timestamps older than 5 minutes (replay protection)
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) return false;
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > 300) return false;

  // Standard Webhooks: secret is `whsec_<base64>`. Strip prefix, base64-decode to raw bytes.
  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const keyBytes = Uint8Array.from(atob(rawSecret), c => c.charCodeAt(0));

  // Standard Webhooks signed payload: `{webhook_id}.{timestamp}.{body}`
  const signedContent = `${webhookId}.${timestampHeader}.${rawBody}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  // Header may contain multiple "v1,<base64sig>" pairs separated by space — accept any match.
  const candidates = signatureHeader.split(' ');
  for (const candidate of candidates) {
    const parts = candidate.split(',');
    if (parts.length < 2 || parts[0] !== 'v1') continue;
    const sigBytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    if (await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(signedContent))) {
      return true;
    }
  }
  return false;
}

// ── Webhook handler ──────────────────────────────────────────────

export async function handleDodoWebhook(request: Request, env: Env): Promise<Response> {
  const rawBody = await request.text();
  const webhookId = request.headers.get('webhook-id');
  if (!webhookId) {
    return new Response('Missing webhook-id', { status: 400 });
  }

  // Verify signature (Standard Webhooks: signs `{webhookId}.{timestamp}.{body}`)
  const isValid = await verifyWebhookSignature(
    rawBody,
    request.headers.get('webhook-signature'),
    request.headers.get('webhook-timestamp'),
    webhookId,
    env.DODO_PAYMENTS_WEBHOOK_SECRET,
  );
  if (!isValid) {
    console.warn(`[webhook] Signature verification failed for ${webhookId}`);
    return new Response('Invalid signature', { status: 401 });
  }

  // Parse event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (await isWebhookProcessed(env.DB, webhookId)) {
    return new Response('Already processed', { status: 200 });
  }

  const eventType: string = event.type || '';
  const data = event.data || {};
  const userId: string | undefined = data.metadata?.clerk_user_id;

  console.log(`[webhook] type=${eventType} webhookId=${webhookId} userId=${userId || 'unknown'}`);

  try {
    if (eventType.startsWith('subscription.')) {
      await handleSubscriptionEvent(env, eventType, data, userId, webhookId, rawBody);
    } else if (eventType === 'payment.succeeded') {
      await handlePaymentSucceeded(env, data, userId, webhookId, rawBody);
    } else if (eventType === 'refund.succeeded') {
      await handleRefundSucceeded(env, data, userId, webhookId, rawBody);
    }
  } catch (err: any) {
    console.error(`[webhook] Error processing ${eventType}:`, err?.message);
    // Record the event even on error to avoid reprocessing
    await recordWebhookEvent(env.DB, webhookId, eventType, userId ?? null, null, null, rawBody);
    return new Response('Processing error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}

// ── Subscription events ──────────────────────────────────────────

async function handleSubscriptionEvent(
  env: Env,
  eventType: string,
  data: any,
  userId: string | undefined,
  webhookId: string,
  rawBody: string,
): Promise<void> {
  if (!userId) {
    console.error(`[webhook] No clerk_user_id in subscription event metadata`);
    await recordWebhookEvent(env.DB, webhookId, eventType, null, null, null, rawBody);
    return;
  }

  const productId: string = data.product_id || '';
  const planInfo = planConfig(env)[productId];
  const subType = eventType.replace('subscription.', '');

  switch (subType) {
    case 'active': {
      // State-only event. Credits are granted on subscription.renewed (which fires on
      // every billing cycle including the first). This avoids the active+renewed double-grant.
      if (!planInfo) {
        console.error(`[webhook] Unknown product_id: ${productId}`);
        break;
      }
      await upsertSubscription(env.DB, userId, {
        dodoCustomerId: data.customer?.customer_id,
        dodoSubscriptionId: data.subscription_id,
        plan: planInfo.plan,
        billingInterval: planInfo.interval,
        status: 'active',
        currentPeriodEnd: data.next_billing_date,
      });
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
      console.log(`[webhook] Subscription active (state only): ${planInfo.plan}/${planInfo.interval}`);
      return;
    }

    case 'renewed': {
      // Credit-grant event. Fires on first billing cycle AND every renewal.
      // Plan pool resets; top-up pool is untouched (user paid for those separately).
      if (!planInfo) {
        console.error(`[webhook] Unknown product_id on renewal: ${productId}`);
        break;
      }
      const creditedUsd = planInfo.baseCreditsUsd * BONUS_MULTIPLIER[planInfo.plan];
      await setPlanBalance(env.DB, userId, 0);
      await addPlanCredits(env.DB, userId, creditedUsd);
      await upsertSubscription(env.DB, userId, {
        dodoCustomerId: data.customer?.customer_id,
        dodoSubscriptionId: data.subscription_id,
        plan: planInfo.plan,
        billingInterval: planInfo.interval,
        status: 'active',
        currentPeriodEnd: data.next_billing_date,
      });
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, planInfo.baseCreditsUsd, creditedUsd, rawBody);
      console.log(`[webhook] Subscription renewed: plan pool reset + ${creditedUsd} USD`);
      return;
    }

    case 'cancelled': {
      await upsertSubscription(env.DB, userId, {
        plan: (await getSubscription(env.DB, userId))?.plan || 'free',
        status: 'cancelled',
        currentPeriodEnd: data.next_billing_date,
      });
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
      console.log(`[webhook] Subscription cancelled for ${userId}`);
      return;
    }

    case 'expired': {
      // Period ended (after cancel or non-payment). Zero the plan pool —
      // the user paid up through the period end and that time is now over.
      // Top-up pool is untouched.
      await setPlanBalance(env.DB, userId, 0);
      await upsertSubscription(env.DB, userId, {
        plan: 'free',
        status: 'expired',
        billingInterval: null,
        currentPeriodEnd: null,
      });
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
      console.log(`[webhook] Subscription expired for ${userId} — plan pool zeroed`);
      return;
    }

    case 'on_hold': {
      const existing = await getSubscription(env.DB, userId);
      await upsertSubscription(env.DB, userId, {
        plan: existing?.plan || 'free',
        status: 'on_hold',
      });
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
      console.log(`[webhook] Subscription on_hold for ${userId}`);
      return;
    }

    case 'plan_changed': {
      if (planInfo) {
        await upsertSubscription(env.DB, userId, {
          plan: planInfo.plan,
          billingInterval: planInfo.interval,
          status: 'active',
        });
      }
      await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
      console.log(`[webhook] Plan changed for ${userId} → ${planInfo?.plan || 'unknown'}`);
      return;
    }
  }

  // Catch-all for unhandled subscription subtypes
  await recordWebhookEvent(env.DB, webhookId, eventType, userId, null, null, rawBody);
}

// ── One-time payment ──────────────────────────────────────────────

async function handlePaymentSucceeded(
  env: Env,
  data: any,
  userId: string | undefined,
  webhookId: string,
  rawBody: string,
): Promise<void> {
  if (!userId) {
    console.error(`[webhook] No clerk_user_id in payment metadata`);
    await recordWebhookEvent(env.DB, webhookId, 'payment.succeeded', null, null, null, rawBody);
    return;
  }

  // Subscription charges are credited via subscription.renewed — skip to avoid double-credit.
  if (data.subscription_id) {
    await recordWebhookEvent(env.DB, webhookId, 'payment.succeeded', userId, null, null, rawBody);
    console.log(`[webhook] payment.succeeded skipped (subscription charge ${data.subscription_id})`);
    return;
  }

  // Top-up USD comes from checkout metadata (what the user chose to buy in USD).
  // Webhook amount fields are in settlement currency (e.g. INR for India-settling merchants),
  // so they're unreliable for crediting. Metadata round-trips unchanged from checkout → payment.
  const topupCents = parseInt(data.metadata?.topup_usd_cents || '0', 10);
  const amountUsd = topupCents / 100;
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    await recordWebhookEvent(env.DB, webhookId, 'payment.succeeded', userId, 0, 0, rawBody);
    console.warn(`[webhook] payment.succeeded missing topup_usd_cents metadata`);
    return;
  }

  // Look up user's plan for top-up bonus (Pro gets 20%, others none)
  const sub = await getSubscription(env.DB, userId);
  const plan: PlanTier = sub?.plan || 'free';
  const multiplier = plan === 'pro' ? 1.2 : 1.0;
  const creditedUsd = amountUsd * multiplier;

  // Top-ups land in the permanent topup pool — never wiped on sub renewal.
  await addTopupCredits(env.DB, userId, creditedUsd);
  await recordWebhookEvent(env.DB, webhookId, 'payment.succeeded', userId, amountUsd, creditedUsd, rawBody);
  console.log(`[webhook] Top-up: $${amountUsd} → ${creditedUsd} USD into topup pool (plan=${plan})`);
}

// ── Refund ─────────────────────────────────────────────────────────

async function handleRefundSucceeded(
  env: Env,
  data: any,
  _userId: string | undefined,  // Refund events have empty metadata — derive from payment_id lookup below.
  webhookId: string,
  rawBody: string,
): Promise<void> {
  // Refund webhooks carry a fresh empty metadata object — the original payment's
  // metadata (including clerk_user_id) is NOT copied across. We re-derive the user,
  // credited amount, and target pool from our own payment_events record.
  const paymentId: string | undefined = data.payment_id;
  if (!paymentId) {
    console.warn(`[webhook] refund.succeeded missing payment_id`);
    await recordWebhookEvent(env.DB, webhookId, 'refund.succeeded', null, null, null, rawBody);
    return;
  }

  const original = await getPaymentCredit(env.DB, paymentId);
  if (!original || !original.user_id || !original.amount_credited_usd) {
    console.warn(`[webhook] refund.succeeded: no prior credit record for payment ${paymentId}`);
    await recordWebhookEvent(env.DB, webhookId, 'refund.succeeded', null, null, null, rawBody);
    return;
  }

  // Subscription charges credit the plan pool (via .renewed); top-ups credit the
  // topup pool (via payment.succeeded). Reclaim from the same pool, with spill.
  const preferPool: 'plan' | 'topup' =
    original.event_type === 'subscription.renewed' ? 'plan' : 'topup';
  const refundUsd = original.amount_credited_usd;

  await refundCredits(env.DB, original.user_id, refundUsd, preferPool);
  await recordWebhookEvent(env.DB, webhookId, 'refund.succeeded', original.user_id, refundUsd, -refundUsd, rawBody);
  console.log(`[webhook] Refund $${refundUsd} deducted from ${preferPool} pool for ${original.user_id} (payment ${paymentId})`);
}
