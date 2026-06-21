import { deactivateStaleEvents, fetchAllEvents } from '@/lib/events'
import { prisma } from '@/lib/prisma'

export async function syncEventsToDatabase(): Promise<{ synced: number; failed: number }> {
  let synced = 0
  let failed = 0

  try {
    const events = await fetchAllEvents()

    for (const event of events) {
      try {
        await prisma.careerEvent.upsert({
          where: { externalId: event.externalId },
          update: { ...event, isActive: true, scrapedAt: new Date() },
          create: event,
        })
        synced++
      } catch (err) {
        console.error('[EVENTS_SYNC] persist failed:', err)
        failed++
      }
    }

    await deactivateStaleEvents(prisma, events)
    await prisma.careerEvent.updateMany({
      where: { isActive: true, endsAt: { lt: new Date() } },
      data: { isActive: false },
    })
  } catch (err) {
    console.error('[EVENTS_SYNC] fetch failed:', err)
    failed++
  }

  return { synced, failed }
}
