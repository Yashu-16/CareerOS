'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobGrid } from '@/components/jobs/JobGrid'
import { JobFilters } from '@/components/jobs/JobFilters'
import { JobSearch } from '@/components/jobs/JobSearch'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { formatCatalogUpdatedAt } from '@/lib/format'
import { formatDailySyncLabel } from '@/lib/sync-schedule'
import type { JobWithMatch } from '@/types'

interface JobsApiResponse {
  jobs: JobWithMatch[]
  total?: number
  hasMore?: boolean
  typeFacets?: Record<string, number>
  sourceFacets?: Record<string, number>
  catalogUpdatedAt?: string
  nextScheduledSyncIst?: string
  warning?: string
}

function JobsInner() {
  const searchParams = useSearchParams()
  const [extraJobs, setExtraJobs] = useState<JobWithMatch[]>([])
  const [page, setPage] = useState(1)
  const [hasMorePages, setHasMorePages] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const buildParams = useCallback(
    (pageNum: number, withFacets: boolean) => {
      const p = new URLSearchParams({
        q: searchParams.get('q') || '',
        location: searchParams.get('location') || '',
        jobType: searchParams.get('jobType') || '',
        datePosted: searchParams.get('datePosted') || '',
        source: searchParams.get('source') || '',
        page: String(pageNum),
      })
      if (!withFacets) p.set('facets', '0')
      return p.toString()
    },
    [searchParams]
  )

  const listKey = useMemo(() => buildParams(1, true), [buildParams])
  const listUrl = `/api/jobs?${listKey}`

  const { data, loading, reload } = useCachedFetch<JobsApiResponse>(
    `jobs:${listKey}`,
    listUrl
  )

  useEffect(() => {
    setExtraJobs([])
    setPage(1)
  }, [listKey])

  useEffect(() => {
    if (data) setHasMorePages(Boolean(data.hasMore))
  }, [data])

  const jobs = [...(data?.jobs || []), ...extraJobs]
  const total = data?.total ?? null
  const typeFacets = data?.typeFacets
  const sourceFacets = data?.sourceFacets
  const hasMore = hasMorePages

  const resetAndReload = useCallback(async () => {
    setExtraJobs([])
    setPage(1)
    setWarning(null)
    await reload(false)
  }, [reload])

  const loadMore = async () => {
    const next = page + 1
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/jobs?${buildParams(next, false)}`)
      const payload = (await res.json()) as JobsApiResponse
      setExtraJobs((prev) => [...prev, ...(payload.jobs || [])])
      setPage(next)
      setHasMorePages(Boolean(payload.hasMore))
    } catch {
      setWarning('Unable to load more jobs. Please try again shortly.')
    } finally {
      setLoadingMore(false)
    }
  }

  const refreshCatalog = async () => {
    setSyncing(true)
    setExtraJobs([])
    setPage(1)
    await resetAndReload()
    setSyncing(false)
  }

  const syncCatalog = async () => {
    setSyncing(true)
    setWarning(null)
    try {
      const res = await fetch('/api/jobs/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      setExtraJobs([])
      setPage(1)
      await reload(false)
    } catch {
      setWarning('Background sync is rate-limited. The catalog refreshes automatically every day at 12:00 PM IST.')
    } finally {
      setSyncing(false)
    }
  }

  const catalogEmpty =
    !loading &&
    total === 0 &&
    !searchParams.get('q') &&
    !searchParams.get('location') &&
    !searchParams.get('jobType') &&
    !searchParams.get('source') &&
    !searchParams.get('datePosted')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-gray-900">Job Discovery</h1>
          <p className="text-body-md text-gray-500 mt-1">
            {total !== null
              ? `${total.toLocaleString('en-IN')} live roles from company career pages and job boards.`
              : 'Jobs are loaded from our database and refreshed daily.'}
          </p>
          <p className="text-caption text-gray-500 mt-1">
            {formatDailySyncLabel()}
            {data?.catalogUpdatedAt && (
              <> · {formatCatalogUpdatedAt(data.catalogUpdatedAt)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={refreshCatalog} loading={syncing}>
            <RefreshCw size={16} /> Reload jobs
          </Button>
          {(warning || data?.warning) && (
            <div className="bg-warning-light text-warning text-body-sm px-4 py-2 rounded-lg border border-warning/20 flex items-center gap-2">
              <AlertTriangle size={16} /> {warning || data?.warning}
            </div>
          )}
        </div>
      </div>

      <JobSearch />

      <div className="flex gap-6">
        <JobFilters typeFacets={typeFacets} sourceFacets={sourceFacets} />
        <div className="flex-1 min-w-0">
          {loading && !jobs.length ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <JobGrid jobs={jobs} catalogEmpty={catalogEmpty} onRefresh={syncCatalog} syncing={syncing} />

              {(hasMore || jobs.length > 0) && (
                <div className="flex flex-col items-center gap-2 mt-6">
                  {hasMore ? (
                    <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Loading…
                        </>
                      ) : (
                        'Load more jobs'
                      )}
                    </Button>
                  ) : (
                    <p className="text-body-sm text-gray-500">You&apos;ve reached the end of the list.</p>
                  )}
                  {total !== null && (
                    <p className="text-caption text-gray-500">
                      Showing {jobs.length.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen rounded-xl" />}>
      <JobsInner />
    </Suspense>
  )
}
