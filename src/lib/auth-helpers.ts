import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role?: string
}

/**
 * Returns the authenticated user or null. Use in API routes / server components.
 * Verifies the session user still exists in the database (guards stale JWT ids).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) return null

  const dbUser = await prisma.user.findFirst({
    where: { id: session.user.id, email: session.user.email, deletedAt: null },
    select: { id: true, email: true, name: true, role: true },
  })
  if (!dbUser) return null

  return dbUser
}

/**
 * Throws a typed error when no session exists. Caller converts to a 401.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
