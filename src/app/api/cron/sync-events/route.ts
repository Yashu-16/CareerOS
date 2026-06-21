import { NextRequest, NextResponse } from 'next/server'
import { syncEventsToDatabase } from '@/lib/events/sync-to-db'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { synced, failed } = await syncEventsToDatabase()
  return NextResponse.json({ synced, failed, timestamp: new Date().toISOString() })
}
