'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/cn'

const JOB_TYPES = [
  { value: '', label: 'All types' },
  { value: 'FULLTIME', label: 'Full-time' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PARTTIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
]

const DATE_POSTED = [
  { value: '', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
]

export function JobFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    router.push(`/jobs?${next.toString()}`)
  }

  const currentType = params.get('jobType') || ''
  const currentDate = params.get('datePosted') || ''

  return (
    <aside className="hidden md:block w-60 shrink-0 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-label text-gray-700 mb-3 uppercase tracking-wide">Job type</h3>
        <div className="space-y-1">
          {JOB_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter('jobType', t.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-body-sm transition-colors',
                currentType === t.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-label text-gray-700 mb-3 uppercase tracking-wide">Date posted</h3>
        <div className="space-y-1">
          {DATE_POSTED.map((d) => (
            <button
              key={d.value}
              onClick={() => setFilter('datePosted', d.value)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-body-sm transition-colors',
                currentDate === d.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
