import { createHash, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

const TOKEN_TTL_DAYS = 90

export function hashExtensionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createExtensionToken(userId: string, label?: string): Promise<{ token: string; expiresAt: Date }> {
  const token = `cos_${randomBytes(32).toString('hex')}`
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  await prisma.applyExtensionToken.create({
    data: {
      userId,
      tokenHash: hashExtensionToken(token),
      label: label || 'Chrome extension',
      expiresAt,
    },
  })

  return { token, expiresAt }
}

export async function resolveExtensionToken(token: string): Promise<string | null> {
  if (!token.startsWith('cos_')) return null
  const record = await prisma.applyExtensionToken.findUnique({
    where: { tokenHash: hashExtensionToken(token) },
  })
  if (!record || record.expiresAt < new Date()) return null
  return record.userId
}

export async function revokeExtensionTokens(userId: string): Promise<number> {
  const res = await prisma.applyExtensionToken.deleteMany({ where: { userId } })
  return res.count
}
