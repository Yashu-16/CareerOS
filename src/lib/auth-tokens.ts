import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { isRedisConfigured } from '@/lib/redis-config'

export type AuthTokenPurpose = 'email-verify' | 'pw-reset'

function redisKey(purpose: AuthTokenPurpose, token: string) {
  return `${purpose}:${token}`
}

/** Store a one-time auth token (Redis when configured, otherwise Postgres). */
export async function storeAuthToken(
  purpose: AuthTokenPurpose,
  userId: string,
  ttlSeconds: number
): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  if (isRedisConfigured() && redis) {
    await redis.set(redisKey(purpose, token), userId, { ex: ttlSeconds })
    return token
  }

  await prisma.authToken.create({
    data: { token, purpose, userId, expiresAt },
  })
  return token
}

/** Read and delete a one-time auth token. Returns the user id or null if invalid/expired. */
export async function consumeAuthToken(
  purpose: AuthTokenPurpose,
  token: string
): Promise<string | null> {
  if (isRedisConfigured() && redis) {
    const userId = await redis.get<string>(redisKey(purpose, token))
    if (!userId) return null
    await redis.del(redisKey(purpose, token))
    return userId
  }

  const record = await prisma.authToken.findUnique({ where: { token } })
  if (!record || record.purpose !== purpose || record.expiresAt < new Date()) {
    if (record) {
      await prisma.authToken.delete({ where: { id: record.id } }).catch(() => {})
    }
    return null
  }

  await prisma.authToken.delete({ where: { id: record.id } })
  return record.userId
}

/** Log auth links when email is not configured (dev / missing SendGrid). */
export function logDevAuthLink(label: string, url: string) {
  if (process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim()) return
  console.warn(`[AUTH] ${label} (email not configured — copy this link manually):`, url)
}
