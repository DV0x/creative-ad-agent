import type { Env } from '../env.js';
import { getSubscription } from '../db/subscriptions.js';

// ── Dodo product IDs — injected per env via wrangler vars ────────

function checkoutProducts(env: Env): Record<string, string> {
  return {
    'starter-monthly': env.DODO_PRODUCT_STARTER_MONTHLY,
    'starter-yearly':  env.DODO_PRODUCT_STARTER_YEARLY,
    'pro-monthly':     env.DODO_PRODUCT_PRO_MONTHLY,
    'pro-yearly':      env.DODO_PRODUCT_PRO_YEARLY,
  };
}

const TOPUP_MIN_USD = 5;

// Dodo has separate base URLs for test vs live mode — injected per env via wrangler vars.
// Staging → https://test.dodopayments.com
// Production → https://live.dodopayments.com

// ── Dodo API helper ──────────────────────────────────────────────

async function dodoFetch<T>(env: Env, path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${env.DODO_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DODO_PAYMENTS_API_KEY}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dodo API ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Route handler ────────────────────────────────────────────────

export async function handlePaymentsRequest(
  request: Request,
  env: Env,
  userId: string,
  path: string,
  method: string,
): Promise<Response> {
  const sub = path.replace('/api/payments', '');

  // POST /api/payments/checkout — create subscription checkout
  if (sub === '/checkout' && method === 'POST') {
    const body = await request.json<{ plan: string; email?: string; name?: string }>();
    const productId = checkoutProducts(env)[body.plan];
    if (!productId) {
      return Response.json({ success: false, error: 'Invalid plan' }, { status: 400 });
    }
    if (!body.email) {
      return Response.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    // cancel_url is sent speculatively — Dodo's docs only formally cover return_url,
    // but most checkout providers honor cancel_url when present. If they ignore it,
    // user just stays on the Dodo tab on cancel (no harm done).
    const session = await dodoFetch<{ checkout_url: string }>(env, '/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: { email: body.email, name: body.name },
        metadata: { clerk_user_id: userId },
        return_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/?upgrade-cancelled=${encodeURIComponent(body.plan)}`,
      }),
    });

    return Response.json({ success: true, checkout_url: session.checkout_url });
  }

  // POST /api/payments/topup — create one-time top-up checkout (PWYW)
  if (sub === '/topup' && method === 'POST') {
    const body = await request.json<{ amount: number; email?: string; name?: string }>();
    const amount = body.amount;
    if (!amount || amount < TOPUP_MIN_USD || !Number.isFinite(amount)) {
      return Response.json({ success: false, error: `Minimum top-up is $${TOPUP_MIN_USD}.` }, { status: 400 });
    }
    if (!body.email) {
      return Response.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    // Subscriber-only top-ups, with one $5 trial allowed per free account.
    // UI gate alone is bypassable via direct API call — this is the real lock.
    const subscription = await getSubscription(env.DB, userId);
    const plan = subscription?.plan ?? 'free';
    const status = subscription?.status ?? 'active';
    const isActiveSubscriber =
      (plan === 'starter' || plan === 'pro') && status === 'active';

    if (!isActiveSubscriber) {
      if (amount !== 5) {
        return Response.json(
          { success: false, error: 'Top-ups require an active Starter or Pro subscription.' },
          { status: 403 },
        );
      }
      // Allow exactly one $5 trial per account. payment.succeeded only fires for
      // top-ups (subscription charges fire subscription.renewed), so its presence
      // for this user means the wedge has already been used.
      const prior = await env.DB.prepare(
        `SELECT 1 FROM payment_events WHERE user_id = ? AND event_type = 'payment.succeeded' LIMIT 1`,
      ).bind(userId).first();
      if (prior) {
        return Response.json(
          { success: false, error: 'Trial already used — subscribe to Starter or Pro for more top-ups.' },
          { status: 403 },
        );
      }
    }

    const amountCents = Math.round(amount * 100);
    const origin = new URL(request.url).origin;
    const session = await dodoFetch<{ checkout_url: string }>(env, '/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        product_cart: [{ product_id: env.DODO_PRODUCT_TOPUP, quantity: 1, amount: amountCents }],
        customer: { email: body.email, name: body.name },
        metadata: {
          clerk_user_id: userId,
          topup_usd_cents: String(amountCents),
        },
        return_url: `${origin}/checkout/success`,
        cancel_url: `${origin}/?topup-cancelled=${amount}`,
      }),
    });

    return Response.json({ success: true, checkout_url: session.checkout_url });
  }

  // GET /api/payments/subscription — get current plan
  if (sub === '/subscription' && method === 'GET') {
    const subscription = await getSubscription(env.DB, userId);
    if (!subscription) {
      return Response.json({ plan: 'free', status: 'active', billing_interval: null, current_period_end: null });
    }
    return Response.json({
      plan: subscription.plan,
      status: subscription.status,
      billing_interval: subscription.billing_interval,
      current_period_end: subscription.current_period_end,
    });
  }

  // POST /api/payments/portal — get Dodo customer portal URL
  if (sub === '/portal' && method === 'POST') {
    const subscription = await getSubscription(env.DB, userId);
    if (!subscription?.dodo_customer_id) {
      return Response.json({ success: false, error: 'No active subscription' }, { status: 400 });
    }

    const portal = await dodoFetch<{ link: string }>(
      env,
      `/customers/${subscription.dodo_customer_id}/customer-portal/session`,
      { method: 'POST' },
    );

    return Response.json({ success: true, portal_url: portal.link });
  }

  return new Response('Not Found', { status: 404 });
}
