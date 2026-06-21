import { cache } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role?: string
  city?: string | null
}

/**
 * Returns the authenticated user or null. Deduplicated per request via React
 * cache() so layout + page + API handlers share one DB round-trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return null

  const dbUser = await prisma.user.findFirst({
    where: { id: session.user.id, email: session.user.email, deletedAt: null },
    select: { id: true, email: true, name: true, role: true, city: true },
  })
  if (!dbUser) return null

  return dbUser
})

/**
 * Throws a typed error when no session exists. Caller converts to a 401.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
