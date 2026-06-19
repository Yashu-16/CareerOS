import { NextRequest, NextResponse } from 'next/server'
import type { EventType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { matchesUserCity, EVENT_TYPE_LABELS } from '@/lib/events'
import { ApiErrors } from '@/lib/errors'

const VALID_TYPES: EventType[] = ['HACKATHON', 'NETWORKING', 'CAREER_SOCIAL', 'CAREER_FAIR', 'WORKSHOP']

/**
 * Career events near the user's city (online events included everywhere).
 * Optional `type` filter narrows to hackathons, networking, career fairs, etc.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const { searchParams } = new URL(req.url)
  const typeParam = (searchParams.get('type') || '').toUpperCase()
  const type = VALID_TYPES.includes(typeParam as EventType) ? (typeParam as EventType) : undefined

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { city: true },
    })
    const userCity = profile?.city?.trim() || null

    const where: Prisma.CareerEventWhereInput = {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    }
    if (type) where.type = type

    const events = await prisma.careerEvent.findMany({
      where,
      orderBy: [{ startsAt: 'asc' }],
      take: 300,
    })

    const locationMatched = events.filter((e) => matchesUserCity(userCity, e))

    const typeFacets = locationMatched.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      events: locationMatched,
      city: userCity,
      typeFacets,
      typeLabels: EVENT_TYPE_LABELS,
      total: locationMatched.length,
    })
  } catch (error) {
    console.error('[EVENTS]', error)
    return ApiErrors.database()
  }
}
