import { syncAllJobs } from '../src/lib/jobs-sync'

async function main() {
  const result = await syncAllJobs()
  console.log('Job sync complete:', result)
  process.exit(result.failed > 0 && result.synced === 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
