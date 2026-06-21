import { Redis } from '@upstash/redis'
import { isRedisConfigured } from './redis-config'

/**
 * Upstash Redis client (REST-based, edge-compatible).
 * Returns null when not configured so callers skip network calls entirely.
 */
export const redis: Redis | null = isRedisConfigured()
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null
