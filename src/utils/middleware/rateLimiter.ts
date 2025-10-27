import { NextFunction, Request, Response } from 'express';

/**
 * Simple fixed-window rate limiter middleware.
 * Keyed by Idempotency-Key header when present, otherwise by IP.
 * This is an in-memory implementation suitable for single-node apps and dev.
 */

type WindowEntry = {
  count: number;
  windowStart: number;
};

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
}

const DEFAULTS: Required<RateLimiterOptions> = {
  windowMs: 60_000, // 1 minute
  max: 60, // 60 requests per window
};

export function rateLimiter(opts?: RateLimiterOptions) {
  const cfg = { ...DEFAULTS, ...(opts || {}) };
  const store = new Map<string, WindowEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key =
      (req.headers['idempotency-key'] as string) || req.ip || 'unknown';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now - entry.windowStart >= cfg.windowMs) {
      // reset window
      store.set(key, { count: 1, windowStart: now });
      res.setHeader('X-RateLimit-Limit', String(cfg.max));
      res.setHeader('X-RateLimit-Remaining', String(cfg.max - 1));
      return next();
    }

    entry.count += 1;
    const remaining = Math.max(0, cfg.max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(cfg.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > cfg.max) {
      const retryAfterMs = cfg.windowMs - (now - entry.windowStart);
      res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return res.status(429).json({ message: 'Too many requests' });
    }

    return next();
  };
}
