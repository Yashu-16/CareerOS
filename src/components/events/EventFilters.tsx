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

interface EventFiltersProps {
  typeFacets?: Record<string, number>
  total?: number
}

export function EventFilters({ typeFacets, total }: EventFiltersProps) {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('type') || ''

  const setType = (value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set('type', value)
    else next.delete('type')
    router.push(`/events?${next.toString()}`)
  }

  const visible = EVENT_TYPES.filter((t) => {
    if (t.value === '') return true
    if (t.value === current) return true
    if (!typeFacets) return true
    return (typeFacets[t.value] ?? 0) > 0
  })

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((t) => {
        const count = t.value === '' ? total : typeFacets?.[t.value]
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium border transition-colors',
              current === t.value
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
  )
}
