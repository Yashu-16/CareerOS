import { NextResponse } from 'next/server'
import { syncAllJobs } from '@/lib/jobs-sync'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 300

/** On-demand job catalog refresh (rate-limited per user). */
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const allowed = await rateLimit(`jobs-sync:${user.id}`, 2, 3600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    const { synced, connectorJobs, failed } = await syncAllJobs()
    return NextResponse.json({ synced, connectorJobs, failed })
  } catch (err) {
    console.error('[JOBS_SYNC]', err)
    return ApiErrors.externalDown()
  }
}
