'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'

const EVENT_TYPES = [
  { value: '', label: 'All events' },
  { value: 'HACKATHON', label: 'Hackathons' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'CAREER_SOCIAL', label: 'Career social' },
  { value: 'CAREER_FAIR', label: 'Career fairs' },
  { value: 'WORKSHOP', label: 'Workshops' },
]

const EVENT_SOURCES = [
  { value: '', label: 'All platforms' },
  { value: 'unstop', label: 'Unstop' },
  { value: 'devfolio', label: 'Devfolio' },
  { value: 'luma', label: 'Luma' },
  { value: 'eventbrite', label: 'Eventbrite' },
]

interface EventFiltersProps {
  typeFacets?: Record<string, number>
  sourceFacets?: Record<string, number>
  total?: number
}

export function EventFilters({ typeFacets, sourceFacets, total }: EventFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const currentType = params.get('type') || ''
  const currentSource = params.get('source') || ''

  const setParam = (key: 'type' | 'source', value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`/events?${next.toString()}`)
  }

  const visibleTypes = EVENT_TYPES.filter((t) => {
    if (t.value === '') return true
    if (t.value === currentType) return true
    if (!typeFacets) return true
    return (typeFacets[t.value] ?? 0) > 0
  })

  const visibleSources = EVENT_SOURCES.filter((s) => {
    if (s.value === '') return true
    if (s.value === currentSource) return true
    if (!sourceFacets) return true
    return (sourceFacets[s.value] ?? 0) > 0
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {visibleTypes.map((t) => {
          const count = t.value === '' ? total : typeFacets?.[t.value]
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setParam('type', t.value)}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium border transition-colors',
                currentType === t.value
                  ? 'bg-primary-50 border-primary-600 text-primary-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              {t.label}
              {typeof count === 'number' && (
                <span className="text-caption tabular-nums text-gray-400">{count.toLocaleString('en-IN')}</span>
              )}
            </button>
          )
        })}
      </div>
      {visibleSources.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleSources.map((s) => {
            const count = s.value === '' ? total : sourceFacets?.[s.value]
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setParam('source', s.value)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-caption font-medium border transition-colors',
                  currentSource === s.value
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                {s.label}
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'tabular-nums',
                      currentSource === s.value ? 'text-gray-300' : 'text-gray-400'
                    )}
                  >
                    {count.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
