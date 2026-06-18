import { redis } from './redis'

/**
 * Fixed-window rate limiter backed by Upstash Redis.
 * Returns true if the request is allowed, false if the limit is exceeded.
 * Fails open (allows the request) if Redis is unavailable so the app stays usable.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSeconds)
    return current <= limit
  } catch (err) {
    console.error('[RATE_LIMIT] Redis unavailable, failing open:', err)
    return true
  }
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
