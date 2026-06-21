'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MapPin, RefreshCw } from 'lucide-react'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { formatCatalogUpdatedAt } from '@/lib/format'
import { formatDailySyncLabel } from '@/lib/sync-schedule'
import type { CareerEventRow } from '@/types'

interface EventsApiResponse {
  events: CareerEventRow[]
  city?: string | null
  typeFacets?: Record<string, number>
  sourceFacets?: Record<string, number>
  total?: number
  catalogUpdatedAt?: string
}

function EventsInner() {
  const searchParams = useSearchParams()
  const [syncing, setSyncing] = useState(false)

  const query = useMemo(() => {
    const type = searchParams.get('type') || ''
    const source = searchParams.get('source') || ''
    const qs = new URLSearchParams()
    if (type) qs.set('type', type)
    if (source) qs.set('source', source)
    return qs.toString()
  }, [searchParams])

  const url = `/api/events${query ? `?${query}` : ''}`
  const { data, loading, reload } = useCachedFetch<EventsApiResponse>(`events:${query}`, url, {
    maxAgeMs: 30_000,
  })

  const events = data?.events || []
  const city = data?.city ?? null
  const typeFacets = data?.typeFacets || {}
  const sourceFacets = data?.sourceFacets || {}
  const total = data?.total ?? events.length

  const refreshCatalog = async () => {
    setSyncing(true)
    try {
      await fetch('/api/events/sync', { method: 'POST' })
      await reload(false)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-h1 text-gray-900">Career Events</h1>
          <p className="text-body-md text-gray-500 mt-1">
            Live hackathons, workshops, and career events in the next 3 days — from Unstop, Devfolio, Luma, and more.
          </p>
          <p className="text-caption text-gray-500 mt-1">
            {formatDailySyncLabel()}
            {data?.catalogUpdatedAt && (
              <> · {formatCatalogUpdatedAt(data.catalogUpdatedAt)}</>
            )}
          </p>
          <p className="text-body-sm text-gray-500 mt-2 flex items-center gap-1.5">
            <MapPin size={14} className="text-primary-600" />
            {city ? (
              <>Showing events in <span className="font-medium text-gray-700">{city}</span> + online</>
            ) : (
              <>
                Set your city in{' '}
                <Link href="/profile" className="text-primary-700 font-medium hover:underline">
                  Profile
                </Link>{' '}
                for location-based picks (online events always included)
              </>
            )}
          </p>
        </div>
        <Button variant="secondary" onClick={refreshCatalog} loading={syncing} className="shrink-0">
          <RefreshCw size={16} /> Refresh events
        </Button>
      </div>

      <EventFilters typeFacets={typeFacets} sourceFacets={sourceFacets} total={total} />

      {loading && !events.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : events.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-body-lg text-gray-900 font-medium">No career events found</p>
          <p className="text-body-sm text-gray-500 mt-1 max-w-md mx-auto">
            {city
              ? `Try another event type, or update your city in Profile if ${city} looks wrong.`
              : 'Add your city in Profile, then refresh — or try another event type.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen rounded-xl" />}>
      <EventsInner />
    </Suspense>
  )
}
