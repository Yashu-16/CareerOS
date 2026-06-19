import { NextRequest, NextResponse } from 'next/server'
import { fetchAllEvents } from '@/lib/events'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let synced = 0
  let failed = 0

  try {
    const events = await fetchAllEvents()
    const seen = new Set<string>()

    for (const event of events) {
      seen.add(event.externalId)
      try {
        await prisma.careerEvent.upsert({
          where: { externalId: event.externalId },
          update: { ...event, isActive: true, scrapedAt: new Date() },
          create: event,
        })
        synced++
      } catch (err) {
        console.error('[CRON][sync-events] persist failed:', err)
        failed++
      }
    }

    if (seen.size > 0) {
      await prisma.careerEvent.updateMany({
        where: { source: 'unstop', externalId: { notIn: [...seen] }, isActive: true },
        data: { isActive: false },
      })
    }
  } catch (err) {
    console.error('[CRON][sync-events] fetch failed:', err)
    failed++
  }

  return NextResponse.json({ synced, failed, timestamp: new Date().toISOString() })
}
