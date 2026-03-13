import type { Env } from './env.js';

/**
 * Clerk JWT verification for Cloudflare Workers.
 * Production: Verifies JWT using Clerk JWKS endpoint.
 * Dev mode (no CLERK_SECRET_KEY): Returns 'anonymous'.
 */

interface ClerkJWTPayload {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  nbf: number;
}

/**
 * Verify a Clerk JWT token and return the userId.
 * Returns null on verification failure.
 */
export async function verifyToken(token: string | null, env: Env): Promise<string | null> {
  if (!env.CLERK_SECRET_KEY) {
    console.log('[AUTH] No CLERK_SECRET_KEY, returning anonymous');
    return 'anonymous';
  }
  if (!token) {
    console.log('[AUTH] No token provided, returning null');
    return null;
  }

  try {
    // Decode JWT header to get key ID
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[AUTH] Invalid JWT: not 3 parts');
      return null;
    }

    const header = JSON.parse(atob(parts[0]));
    const kid = header.kid;
    if (!kid) return null;

    // Fetch JWKS from Clerk
    // Extract Clerk instance ID from the secret key (sk_test_xxx or sk_live_xxx)
    // Clerk JWKS endpoint: https://<clerk-frontend-api>/.well-known/jwks.json
    // We decode the JWT payload to get the issuer
    const payloadRaw = JSON.parse(atob(parts[1]));
    const issuer = payloadRaw.iss;
    if (!issuer) return null;

    // Fetch JWKS from issuer
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) return null;

    const jwks = await jwksResponse.json() as { keys: Array<{ kid: string; kty: string; n: string; e: string }> };

    // Find the matching key
    const key = jwks.keys.find((k: { kid: string }) => k.kid === kid);
    if (!key) return null;

    // Import the public key
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    // Verify the signature
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);

    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature,
      data,
    );

    if (!valid) {
      console.log('[AUTH] JWT signature invalid');
      return null;
    }

    // Check expiration
    const payload = payloadRaw as ClerkJWTPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.log(`[AUTH] JWT expired: exp=${payload.exp}, now=${now}`);
      return null;
    }

    console.log(`[AUTH] JWT verified OK: sub=${payload.sub}, iss=${payload.iss}`);
    return payload.sub || 'anonymous';
  } catch (err) {
    console.warn('[AUTH] JWT verification error:', (err as Error).message);
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header.
 */
export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

/**
 * Authenticate a REST API request.
 * Returns userId or a 401 Response.
 */
export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<string | Response> {
  // Dev mode: no auth required
  if (!env.CLERK_SECRET_KEY) return 'anonymous';

  const token = extractBearerToken(request);
  const userId = await verifyToken(token, env);

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return userId;
}

/**
 * Verify a WebSocket token (from ?token= query param).
 * Returns userId or null.
 */
export async function verifyWebSocketToken(token: string | null, env: Env): Promise<string | null> {
  if (!env.CLERK_SECRET_KEY) return 'anonymous';
  if (!token) return null;
  return verifyToken(token, env);
}

// --- Helpers ---

function base64UrlDecode(str: string): ArrayBuffer {
  // Base64url → base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
