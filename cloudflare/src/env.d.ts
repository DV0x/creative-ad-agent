import type { Sandbox } from '@cloudflare/sandbox';

export interface Env {
  // Static assets (React client)
  ASSETS: Fetcher;

  // D1 database
  DB: D1Database;

  // R2 storage bucket
  R2_BUCKET: R2Bucket;

  // Durable Object namespaces
  CAMPAIGN_SESSION: DurableObjectNamespace;
  SANDBOX: DurableObjectNamespace<Sandbox>;

  // Secrets (set via `wrangler secret put`)
  ANTHROPIC_API_KEY: string;
  FAL_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_WEBHOOK_SECRET: string;       // Svix-signed webhook from Clerk → /webhooks/clerk

  // R2 credentials for sandbox FUSE mount (set via `wrangler secret put`)
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;

  // Vars (set in wrangler.jsonc)
  CF_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;

  // Dodo Payments
  DODO_PAYMENTS_API_KEY: string;
  DODO_PAYMENTS_WEBHOOK_SECRET: string;
  DODO_API_BASE: string;
  DODO_PRODUCT_STARTER_MONTHLY: string;
  DODO_PRODUCT_STARTER_YEARLY: string;
  DODO_PRODUCT_PRO_MONTHLY: string;
  DODO_PRODUCT_PRO_YEARLY: string;
  DODO_PRODUCT_TOPUP: string;

  // Optional: set to "local" for wrangler dev (bypasses sandbox, runs SDK in-process)
  AI_BACKEND?: string;

  // Sentry — error tracking and performance monitoring
  // SENTRY_DSN: secret, set per env via `wrangler secret put SENTRY_DSN --env <staging|production>`
  // SENTRY_ENVIRONMENT: var, set in wrangler.jsonc per env ("staging" or "production")
  // SENTRY_RELEASE: var injected at deploy time via `--var SENTRY_RELEASE:<git-sha>`
  SENTRY_DSN?: string;
  SENTRY_ENVIRONMENT?: string;
  SENTRY_RELEASE?: string;

  // PostHog — server-side capture (var in wrangler.jsonc; public project key, same as client bundle)
  POSTHOG_KEY?: string;
  POSTHOG_HOST?: string;
}
