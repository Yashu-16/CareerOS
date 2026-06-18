import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface SessionUser {
  id: string
  email: string
  name?: string | null
  role?: string
}

/**
 * Returns the authenticated user or null. Use in API routes / server components.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session.user as SessionUser
}

/**
 * Throws a typed error when no session exists. Caller converts to a 401.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
