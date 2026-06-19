'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MapPin, RefreshCw } from 'lucide-react'
import { EventCard } from '@/components/events/EventCard'
import { EventFilters } from '@/components/events/EventFilters'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { CareerEventRow } from '@/types'

function EventsInner() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<CareerEventRow[]>([])
  const [city, setCity] = useState<string | null>(null)
  const [typeFacets, setTypeFacets] = useState<Record<string, number>>({})
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const type = searchParams.get('type') || ''
      const qs = type ? `?type=${encodeURIComponent(type)}` : ''
      const res = await fetch(`/api/events${qs}`)
      const text = await res.text()
      if (!text) throw new Error('Empty response from server')
      const data = JSON.parse(text)
      if (!res.ok) throw new Error(data.message || 'Failed to load events')
      setEvents(data.events || [])
      setCity(data.city ?? null)
      setTypeFacets(data.typeFacets || {})
      setTotal(data.total ?? (data.events?.length || 0))
    } catch (err) {
      console.error('[Events]', err)
      setEvents([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const refreshCatalog = async () => {
    setSyncing(true)
    try {
      await fetch('/api/events/sync', { method: 'POST' })
      await fetchEvents()
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
            Hackathons, networking, career fairs, and workshops near you — no parties or unrelated socials.
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

      <EventFilters typeFacets={typeFacets} total={total} />

      {loading ? (
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
