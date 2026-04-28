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
}
