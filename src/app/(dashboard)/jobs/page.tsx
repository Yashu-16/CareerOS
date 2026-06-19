'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobGrid } from '@/components/jobs/JobGrid'
import { JobFilters } from '@/components/jobs/JobFilters'
import { JobSearch } from '@/components/jobs/JobSearch'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import type { JobWithMatch } from '@/types'

function JobsInner() {
  const [jobs, setJobs] = useState<JobWithMatch[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [typeFacets, setTypeFacets] = useState<Record<string, number> | undefined>(undefined)
  const [sourceFacets, setSourceFacets] = useState<Record<string, number> | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const buildParams = useCallback(
    (pageNum: number) =>
      new URLSearchParams({
        q: searchParams.get('q') || '',
        location: searchParams.get('location') || '',
        jobType: searchParams.get('jobType') || '',
        datePosted: searchParams.get('datePosted') || '',
        source: searchParams.get('source') || '',
        page: String(pageNum),
      }),
    [searchParams]
  )

  // Initial load / re-load whenever the search or filters change.
  const fetchFirstPage = useCallback(async () => {
    setLoading(true)
    setWarning(null)
    try {
      const res = await fetch(`/api/jobs?${buildParams(1)}`)
      const data = await res.json()
      setJobs(data.jobs || [])
      setTotal(typeof data.total === 'number' ? data.total : null)
      setTypeFacets(data.typeFacets)
      setSourceFacets(data.sourceFacets)
      setHasMore(Boolean(data.hasMore))
      setPage(1)
      setWarning(data.warning || null)
    } catch {
      setWarning('Unable to load jobs. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  const loadMore = useCallback(async () => {
    const next = page + 1
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/jobs?${buildParams(next)}`)
      const data = await res.json()
      setJobs((prev) => [...prev, ...(data.jobs || [])])
      setHasMore(Boolean(data.hasMore))
      setPage(next)
    } catch {
      setWarning('Unable to load more jobs. Please try again shortly.')
    } finally {
      setLoadingMore(false)
    }
  }, [page, buildParams])

  useEffect(() => {
    fetchFirstPage()
  }, [fetchFirstPage])

  const refreshCatalog = async () => {
    setSyncing(true)
    setWarning(null)
    try {
      const res = await fetch('/api/jobs/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Sync failed')
      await fetchFirstPage()
    } catch {
      setWarning('Unable to refresh the job catalog. Please try again shortly.')
    } finally {
      setSyncing(false)
    }
  }

  const catalogEmpty = !loading && total === 0 && !searchParams.get('q') && !searchParams.get('location') && !searchParams.get('jobType') && !searchParams.get('source') && !searchParams.get('datePosted')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-gray-900">Job Discovery</h1>
          <p className="text-body-md text-gray-500 mt-1">
            {total !== null
              ? `${total.toLocaleString('en-IN')} live roles from company career pages, LinkedIn, Indeed & Naukri.`
              : 'Real Indian jobs from company career pages, LinkedIn, Indeed & Naukri.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" onClick={refreshCatalog} loading={syncing}>
            <RefreshCw size={16} /> Refresh jobs
          </Button>
          {warning && (
            <div className="bg-warning-light text-warning text-body-sm px-4 py-2 rounded-lg border border-warning/20 flex items-center gap-2">
              <AlertTriangle size={16} /> {warning}
            </div>
          )}
        </div>
      </div>

      <JobSearch />

      <div className="flex gap-6">
        <JobFilters typeFacets={typeFacets} sourceFacets={sourceFacets} />
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <JobGrid jobs={jobs} catalogEmpty={catalogEmpty} onRefresh={refreshCatalog} syncing={syncing} />

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
