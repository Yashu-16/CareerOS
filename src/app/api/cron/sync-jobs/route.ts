import { NextRequest, NextResponse } from 'next/server'
import { syncAllJobs } from '@/lib/jobs-sync'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { synced, connectorJobs, failed } = await syncAllJobs()
  return NextResponse.json({ synced, connectorJobs, failed, timestamp: new Date().toISOString() })
}
