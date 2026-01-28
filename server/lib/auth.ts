import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

// Check if Clerk is configured
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const IS_CLERK_CONFIGURED = !!CLERK_SECRET_KEY;

if (!IS_CLERK_CONFIGURED) {
  console.warn('⚠️  CLERK_SECRET_KEY not set - using anonymous auth (dev mode)');
}

// Extend Express Request to include auth info
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Clerk middleware - initializes Clerk for the app
 * Use this once at app level: app.use(clerkAuth())
 */
export function clerkAuth() {
  if (IS_CLERK_CONFIGURED) {
    return clerkMiddleware();
  }
  // Dev mode: no-op middleware
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

/**
 * Require authentication middleware
 * Use on protected routes: router.get('/campaigns', authRequired, handler)
 */
export function authRequired(req: Request, res: Response, next: NextFunction) {
  if (IS_CLERK_CONFIGURED) {
    // Use Clerk's requireAuth
    return requireAuth()(req, res, next);
  }

  // Dev mode: allow all requests with anonymous user
  req.userId = 'anonymous';
  next();
}

/**
 * Extract user ID from request
 * Call after authRequired middleware
 */
export function getUserId(req: Request): string {
  if (IS_CLERK_CONFIGURED) {
    const auth = getAuth(req);
    return auth.userId || 'anonymous';
  }
  return req.userId || 'anonymous';
}

/**
 * Optional auth middleware - extracts user if present, but doesn't require it
 */
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  if (IS_CLERK_CONFIGURED) {
    const auth = getAuth(req);
    req.userId = auth.userId || 'anonymous';
  } else {
    req.userId = 'anonymous';
  }
  next();
}

export { IS_CLERK_CONFIGURED };
