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
  { value: '', label: 'All live listings' },
  { value: 'today', label: 'Posted today' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
]

const SOURCES: { value: string; label: string; match: string[] }[] = [
  { value: '', label: 'All sources', match: [] },
  {
    value: 'company',
    label: 'Company career pages',
    match: ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workday'],
  },
  { value: 'linkedin', label: 'LinkedIn', match: ['linkedin'] },
  { value: 'indeed', label: 'Indeed', match: ['indeed'] },
  { value: 'naukri', label: 'Naukri', match: ['naukri'] },
  { value: 'internshala', label: 'Internshala', match: ['internshala'] },
  { value: 'adzuna', label: 'Adzuna', match: ['adzuna'] },
  { value: 'ziprecruiter', label: 'ZipRecruiter', match: ['ziprecruiter'] },
  { value: 'remotive', label: 'Remote (Remotive)', match: ['remotive'] },
]

interface JobFiltersProps {
  /** Map of jobType -> count under the current search/date/location/source filters. */
  typeFacets?: Record<string, number>
  /** Map of raw source -> count under the current search/date/location/type filters. */
  sourceFacets?: Record<string, number>
}

export function JobFilters({ typeFacets, sourceFacets }: JobFiltersProps) {
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
  const currentSource = params.get('source') || ''

  // Only surface a job type when it actually has matching roles. "All types" is
  // always shown, and the currently-selected type stays visible even if its
  // count is 0 so the active filter never silently disappears.
  const totalCount = typeFacets ? Object.values(typeFacets).reduce((a, b) => a + b, 0) : undefined
  const visibleTypes = JOB_TYPES.filter((t) => {
    if (t.value === '') return true
    if (t.value === currentType) return true
    if (!typeFacets) return true
    return (typeFacets[t.value] ?? 0) > 0
  })

  // Sum the raw-source counts that belong to each grouped source option.
  const sourceCount = (match: string[]) =>
    sourceFacets ? match.reduce((sum, s) => sum + (sourceFacets[s] ?? 0), 0) : undefined
  const allSourcesCount = sourceFacets ? Object.values(sourceFacets).reduce((a, b) => a + b, 0) : undefined
  const visibleSources = SOURCES.filter((s) => {
    if (s.value === '') return true
    if (s.value === currentSource) return true
    if (!sourceFacets) return true
    return (sourceCount(s.match) ?? 0) > 0
  })

  return (
    <aside className="hidden md:block w-60 shrink-0 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-label text-gray-700 mb-3 uppercase tracking-wide">Job type</h3>
        <div className="space-y-1">
          {visibleTypes.map((t) => {
            const count = t.value === '' ? totalCount : typeFacets?.[t.value]
            return (
              <button
                key={t.value}
                onClick={() => setFilter('jobType', t.value)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-body-sm transition-colors',
                  currentType === t.value
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span>{t.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'text-caption tabular-nums',
                      currentType === t.value ? 'text-primary-700' : 'text-gray-400'
                    )}
                  >
                    {count.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-label text-gray-700 mb-3 uppercase tracking-wide">Source</h3>
        <div className="space-y-1">
          {visibleSources.map((s) => {
            const count = s.value === '' ? allSourcesCount : sourceCount(s.match)
            return (
              <button
                key={s.value}
                onClick={() => setFilter('source', s.value)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-body-sm transition-colors',
                  currentSource === s.value
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <span className="truncate">{s.label}</span>
                {typeof count === 'number' && (
                  <span
                    className={cn(
                      'text-caption tabular-nums shrink-0',
                      currentSource === s.value ? 'text-primary-700' : 'text-gray-400'
                    )}
                  >
                    {count.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            )
          })}
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
