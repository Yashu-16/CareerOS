/**
 * CareerOS intentionally has no fixture/mock data seed.
 *
 * Per the product requirement, every job posting in this system comes from
 * a real, live ATS API call (Greenhouse/Lever/Ashby) — never fabricated
 * records. So "seeding the database" here means:
 *
 *   1. Verify your company token list is live:
 *        npm run verify:companies
 *   2. Start the API (npm run start:dev) — it will auto-run ingestion
 *      every 6 hours via the IngestionScheduler.
 *   3. Or trigger it immediately over HTTP once you're logged in:
 *        curl -X POST http://localhost:4000/api/ingestion/run \
 *          -H "Authorization: Bearer <your-access-token>"
 *
 * This script exists only so `npm run prisma:seed` doesn't error if someone
 * runs it out of habit — it just prints the instructions above.
 */
console.log(`
CareerOS does not seed fixture data — all job listings come from live ATS APIs.

To populate jobs:
  1. npm run verify:companies   (confirm your seed company tokens are live)
  2. npm run start:dev          (ingestion runs automatically every 6 hours)
  3. or trigger immediately:    POST /api/ingestion/run (requires auth)
`);
