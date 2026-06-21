import { NextRequest, NextResponse } from 'next/server'
import { syncAllJobs } from '@/lib/jobs-sync'
import { syncEventsToDatabase } from '@/lib/events/sync-to-db'
import { DAILY_SYNC_TIMEZONE } from '@/lib/sync-schedule'

export const maxDuration = 300

/**
 * Daily full catalog refresh — jobs then events.
 * Scheduled at 12:00 PM IST via vercel.json (30 6 * * * UTC).
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date()
  console.log(`[CRON][sync-all] started ${startedAt.toISOString()}`)

  const jobs = await syncAllJobs()
  const events = await syncEventsToDatabase()

  const finishedAt = new Date()
  const istTime = finishedAt.toLocaleString('en-IN', {
    timeZone: DAILY_SYNC_TIMEZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return NextResponse.json({
    ok: true,
    jobs,
    events,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    finishedAtIst: istTime,
    message: 'Daily catalog sync completed',
  })
}
