import { syncEventsToDatabase } from '../src/lib/events/sync-to-db'
import { prisma } from '../src/lib/prisma'

async function main() {
  const { synced, failed } = await syncEventsToDatabase()
  console.log(`Event sync complete: ${synced} synced, ${failed} failed`)
  await prisma.$disconnect()
  process.exit(failed > 0 && synced === 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
