import type { Env } from '../env.js'
import { upsertUser, deleteUser } from '../db/users.js'

/**
 * Clerk webhook handler — keeps the `users` table in sync with Clerk identity.
 *
 * Events we care about:
 *   user.created  → upsert
 *   user.updated  → upsert (catches email/profile changes)
 *   user.deleted  → hard delete
 *
 * Signature: Clerk uses Svix. Each request carries svix-id / svix-timestamp /
 * svix-signature headers; signature is HMAC-SHA256 over `id.timestamp.body` with
 * the (base64-encoded) webhook secret. We verify manually — no npm dep needed.
 *
 * Replay protection: reject if timestamp is older than 5 minutes.
 *
 * Idempotency: SQL upsert handles duplicate user.created/updated. Duplicate
 * user.deleted is a no-op (row already gone).
 */

const REPLAY_TOLERANCE_SECONDS = 5 * 60

interface ClerkUserPayload {
  id: string
  email_addresses?: Array<{ id: string; email_address: string }>
  primary_email_address_id?: string | null
}

interface ClerkWebhookEvent {
  type: string
  data: ClerkUserPayload
}

export async function handleClerkWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 })
  }

  const tsNum = Number.parseInt(svixTimestamp, 10)
  if (!Number.isFinite(tsNum)) {
    return new Response('Invalid timestamp', { status: 400 })
  }
  const nowSec = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSec - tsNum) > REPLAY_TOLERANCE_SECONDS) {
    return new Response('Timestamp outside tolerance', { status: 400 })
  }

  const rawBody = await request.text()
  const verified = await verifySvixSignature(
    env.CLERK_WEBHOOK_SECRET,
    svixId,
    svixTimestamp,
    rawBody,
    svixSignature,
  )
  if (!verified) {
    console.warn('[clerk-webhook] signature verification failed')
    return new Response('Invalid signature', { status: 401 })
  }

  let event: ClerkWebhookEvent
  try {
    event = JSON.parse(rawBody) as ClerkWebhookEvent
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'user.created':
      case 'user.updated': {
        const userId = event.data?.id
        const email = pickPrimaryEmail(event.data)
        if (!userId || !email) {
          console.warn('[clerk-webhook] missing user_id or primary email', { type: event.type, userId })
          // Return 200 — payload-malformed events should not be retried indefinitely.
          return new Response('Skipped — incomplete payload', { status: 200 })
        }
        await upsertUser(env.DB, userId, email)
        console.log(`[clerk-webhook] upserted ${userId} (${event.type})`)
        return new Response('OK', { status: 200 })
      }
      case 'user.deleted': {
        const userId = event.data?.id
        if (!userId) {
          return new Response('Skipped — missing user_id', { status: 200 })
        }
        await deleteUser(env.DB, userId)
        console.log(`[clerk-webhook] deleted ${userId}`)
        return new Response('OK', { status: 200 })
      }
      default:
        // Other events (session.created, organization.*, etc.) — not relevant.
        return new Response('Ignored', { status: 200 })
    }
  } catch (err) {
    console.error('[clerk-webhook] handler error', err)
    // 500 triggers Clerk retry — only return this for transient/DB failures.
    return new Response('Handler error', { status: 500 })
  }
}

function pickPrimaryEmail(data: ClerkUserPayload): string | null {
  if (!data.email_addresses || data.email_addresses.length === 0) return null
  if (data.primary_email_address_id) {
    const match = data.email_addresses.find((e) => e.id === data.primary_email_address_id)
    if (match) return match.email_address
  }
  return data.email_addresses[0].email_address
}

/**
 * Svix signature verification.
 *
 * Header format: `svix-signature: v1,<base64-sig> v1,<base64-sig> ...`
 * Signed content: `${svix-id}.${svix-timestamp}.${raw-body}`
 * Signing key: secret is stored as `whsec_<base64>` — we decode the base64
 * portion to get the raw key bytes.
 */
async function verifySvixSignature(
  secret: string,
  svixId: string,
  svixTimestamp: string,
  body: string,
  signatureHeader: string,
): Promise<boolean> {
  const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const keyBytes = base64ToBytes(secretBase64)

  const signed = `${svixId}.${svixTimestamp}.${body}`
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const expected = bytesToBase64(new Uint8Array(sigBuf))

  // Header may contain multiple signatures (key rotation). Accept if any matches.
  const provided = signatureHeader
    .split(' ')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('v1,'))
    .map((s) => s.slice(3))

  return provided.some((p) => timingSafeEqual(p, expected))
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
