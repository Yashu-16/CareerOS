import { Redis } from '@upstash/redis'

/**
 * Upstash Redis client (REST-based, edge-compatible).
 * Used for: email verification tokens, password reset tokens, OTPs, rate limiting.
 */
// Fallbacks keep module import from throwing when env isn't set yet (e.g. during
// `next build`). Actual calls fail gracefully and rate limiting fails open.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder',
})
