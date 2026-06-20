/** True when Upstash Redis is configured (not placeholder env vars). */
export function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  return Boolean(url && token && !url.includes('placeholder'))
}
