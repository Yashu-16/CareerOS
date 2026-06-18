'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { JobGrid } from '@/components/jobs/JobGrid'
import { JobFilters } from '@/components/jobs/JobFilters'
import { JobSearch } from '@/components/jobs/JobSearch'
import { Skeleton } from '@/components/ui/Skeleton'
import { AlertTriangle } from 'lucide-react'
import type { JobWithMatch } from '@/types'

function JobsInner() {
  const [jobs, setJobs] = useState<JobWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState<string | null>(null)
  const searchParams = useSearchParams()

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setWarning(null)
    try {
      const params = new URLSearchParams({
        q: searchParams.get('q') || 'software developer India',
        location: searchParams.get('location') || '',
        jobType: searchParams.get('jobType') || '',
        datePosted: searchParams.get('datePosted') || 'month',
        page: searchParams.get('page') || '1',
        source: 'live',
      })
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])
      setWarning(data.warning || null)
    } catch {
      setWarning('Unable to fetch live jobs. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-gray-900">Job Discovery</h1>
          <p className="text-body-md text-gray-500 mt-1">Real Indian jobs from LinkedIn, Indeed & Naukri.</p>
        </div>
        {warning && (
          <div className="bg-warning-light text-warning text-body-sm px-4 py-2 rounded-lg border border-warning/20 flex items-center gap-2">
            <AlertTriangle size={16} /> {warning}
          </div>
        )}
      </div>

      <JobSearch />

      <div className="flex gap-6">
        <JobFilters />
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-xl" />
              ))}
            </div>
          ) : (
            <JobGrid jobs={jobs} />
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
