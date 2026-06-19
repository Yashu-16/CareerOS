import { NextResponse } from 'next/server'
import { fetchAllEvents } from '@/lib/events'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'

export const maxDuration = 120

/** On-demand event catalog refresh (rate-limited per user). */
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const allowed = await rateLimit(`events-sync:${user.id}`, 2, 3600)
  if (!allowed) return ApiErrors.rateLimited()

  let synced = 0
  try {
    const events = await fetchAllEvents()
    const seen = new Set<string>()

    for (const event of events) {
      seen.add(event.externalId)
      await prisma.careerEvent.upsert({
        where: { externalId: event.externalId },
        update: { ...event, isActive: true, scrapedAt: new Date() },
        create: event,
      })
      synced++
    }

    if (seen.size > 0) {
      await prisma.careerEvent.updateMany({
        where: { source: 'unstop', externalId: { notIn: [...seen] }, isActive: true },
        data: { isActive: false },
      })
    }
  } catch (err) {
    console.error('[EVENTS_SYNC]', err)
    return ApiErrors.externalDown()
  }

  return NextResponse.json({ synced })
}
