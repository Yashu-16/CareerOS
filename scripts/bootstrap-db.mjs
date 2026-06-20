/**
 * One-shot launch bootstrap: seed jobs + sync career events into PostgreSQL (RDS).
 * Usage: npm run db:bootstrap
 */
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const UNSTOP_BASE = 'https://unstop.com/api/public/opportunity/search-result'
const UNSTOP_PLAN = [
  { opportunity: 'hackathons', pages: 4 },
  { opportunity: 'workshops', pages: 3 },
  { opportunity: 'conferences', pages: 3 },
  { opportunity: 'hiring-challenges', pages: 2 },
]

function parseDate(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapUnstopType(raw) {
  const label = `${raw?.type || ''} ${raw?.opportunity || ''} ${raw?.title || ''}`.toLowerCase()
  if (label.includes('hackathon')) return 'HACKATHON'
  if (label.includes('workshop')) return 'WORKSHOP'
  if (label.includes('fair')) return 'CAREER_FAIR'
  if (label.includes('network')) return 'NETWORKING'
  return 'CAREER_SOCIAL'
}

function normalizeUnstop(raw) {
  const title = (raw?.title || '').trim()
  if (!title || !raw?.id) return null

  const addr = raw.address_with_country_logo
  const city = addr?.city?.trim() || null
  const state = addr?.state?.trim() || null
  const isOnline = (raw.region || '').toLowerCase() === 'online'
  const addressLine = addr?.address?.trim()

  let location = 'India'
  if (isOnline) location = 'Online'
  else if (city && state) location = `${city}, ${state}`
  else if (city) location = city
  else if (addressLine) location = addressLine
  else if (state) location = state

  const registrationEnds = parseDate(raw.regnRequirements?.end_regn_dt)
  const eventEnds = parseDate(raw.end_date)
  const startsAt =
    parseDate(raw.regnRequirements?.start_regn_dt) ||
    parseDate(raw.approved_date) ||
    new Date()
  const endsAt = registrationEnds || eventEnds || null

  if (raw.regn_open === 0) return null
  const now = Date.now()
  if (registrationEnds && registrationEnds.getTime() < now) return null
  if (!registrationEnds && eventEnds && eventEnds.getTime() < now) return null

  const slug = raw.public_url || ''
  const url = raw.seo_url || (slug ? `https://unstop.com/${slug}` : 'https://unstop.com')
  const skills = Array.isArray(raw.required_skills)
    ? raw.required_skills.map((s) => s.skill || s.skill_name).filter(Boolean).slice(0, 20)
    : []

  return {
    externalId: `unstop:${raw.id}`,
    title,
    organizer: raw.organisation?.name || 'Organizer',
    type: mapUnstopType(raw),
    city,
    state,
    location,
    isOnline,
    description: stripHtml(raw.details || title).slice(0, 3000),
    skills,
    url,
    source: 'unstop',
    startsAt,
    endsAt,
    isActive: true,
    scrapedAt: new Date(),
  }
}

async function syncUnstopEvents() {
  let synced = 0
  let failed = 0

  for (const { opportunity, pages } of UNSTOP_PLAN) {
    for (let page = 1; page <= pages; page++) {
      const url = `${UNSTOP_BASE}?opportunity=${encodeURIComponent(opportunity)}&page=${page}&per_page=50`
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const rows = Array.isArray(json?.data?.data) ? json.data.data : []

        for (const raw of rows) {
          const event = normalizeUnstop(raw)
          if (!event) continue
          try {
            await prisma.careerEvent.upsert({
              where: { externalId: event.externalId },
              update: { ...event, isActive: true, scrapedAt: new Date() },
              create: event,
            })
            synced++
          } catch {
            failed++
          }
        }
      } catch (err) {
        console.warn(`[bootstrap] Unstop ${opportunity} page ${page} failed:`, err.message)
        failed++
      }
    }
  }

  return { synced, failed }
}

async function printStats() {
  const [jobs, activeJobs, events, activeEvents, users] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isActive: true } }),
    prisma.careerEvent.count(),
    prisma.careerEvent.count({ where: { isActive: true } }),
    prisma.user.count(),
  ])
  console.log('\n--- PostgreSQL (RDS) ---')
  console.log(`Jobs:    ${activeJobs} active / ${jobs} total`)
  console.log(`Events:  ${activeEvents} active / ${events} total`)
  console.log(`Users:   ${users}`)
}

async function main() {
  console.log('Bootstrapping CareerOS database (PostgreSQL)...\n')

  console.log('[1/2] Syncing live jobs (Greenhouse, Lever, Ashby, SmartRecruiters, JSearch)...')
  try {
    execSync('npx tsx scripts/sync-jobs.ts', { stdio: 'inherit', env: process.env })
  } catch {
    console.warn('[bootstrap] Live job sync failed — check JSEARCH_API_KEY and network. Continuing with events.')
  }

  console.log('\n[2/2] Syncing career events from all sources...')
  try {
    execSync('npx tsx scripts/sync-events.ts', { stdio: 'inherit', env: process.env })
  } catch {
    console.warn('[bootstrap] Event sync failed — falling back to Unstop-only sync.')
    const { synced, failed } = await syncUnstopEvents()
    console.log(`Events synced: ${synced}${failed ? ` (${failed} failed)` : ''}`)
  }

  await printStats()
  console.log('\nDone. Start the app with: npm run dev')
}

main()
  .catch((err) => {
    console.error('Bootstrap failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
