import { NextRequest, NextResponse } from 'next/server'
import type { EventType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { matchesUserCity, EVENT_TYPE_LABELS, EVENT_SOURCE_LABELS, isUpcomingEvent } from '@/lib/events'
import type { EventSource } from '@/lib/events'
import { ApiErrors } from '@/lib/errors'

const VALID_TYPES: EventType[] = ['HACKATHON', 'NETWORKING', 'CAREER_SOCIAL', 'CAREER_FAIR', 'WORKSHOP']

const VALID_SOURCES = Object.keys(EVENT_SOURCE_LABELS) as EventSource[]

/**
 * Career events near the user's city (online events included everywhere).
 * Optional `type` and `source` filters narrow results.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const { searchParams } = new URL(req.url)
  const typeParam = (searchParams.get('type') || '').toUpperCase()
  const type = VALID_TYPES.includes(typeParam as EventType) ? (typeParam as EventType) : undefined
  const sourceParam = (searchParams.get('source') || '').toLowerCase()
  const source = VALID_SOURCES.includes(sourceParam as EventSource)
    ? (sourceParam as EventSource)
    : undefined

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { city: true },
    })
    const userCity = profile?.city?.trim() || null
    const now = new Date()

    const where: Prisma.CareerEventWhereInput = {
      isActive: true,
      // Registration still open, or event start is in the future when no deadline exists.
      OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: now } }],
    }
    if (type) where.type = type
    if (source) where.source = source

    const events = await prisma.careerEvent.findMany({
      where,
      orderBy: [{ endsAt: { sort: 'asc', nulls: 'last' } }, { startsAt: 'asc' }],
      take: 300,
    })

    const upcoming = events.filter((e) => isUpcomingEvent(e))
    const locationMatched = upcoming.filter((e) => matchesUserCity(userCity, e))

    const typeFacets = locationMatched.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {})

    const sourceFacets = locationMatched.reduce<Record<string, number>>((acc, e) => {
      acc[e.source] = (acc[e.source] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      events: locationMatched,
      city: userCity,
      typeFacets,
      sourceFacets,
      typeLabels: EVENT_TYPE_LABELS,
      sourceLabels: EVENT_SOURCE_LABELS,
      total: locationMatched.length,
    })
  } catch (error) {
    console.error('[EVENTS]', error)
    return ApiErrors.database()
  }
}
