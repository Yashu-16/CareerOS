import { syncAllJobs } from '../src/lib/jobs-sync'
import { syncEventsToDatabase } from '../src/lib/events/sync-to-db'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('[sync-all] Starting full catalog sync...')
  const jobs = await syncAllJobs()
  console.log('[sync-all] Jobs:', jobs)
  const events = await syncEventsToDatabase()
  console.log('[sync-all] Events:', events)
  console.log('[sync-all] Done at', new Date().toISOString())
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
