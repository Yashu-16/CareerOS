'use client'

import { useEffect, useState } from 'react'
import { TopMatchedJobs } from '@/components/dashboard/TopMatchedJobs'
import { Skeleton } from '@/components/ui/Skeleton'
import { readClientCache, writeClientCache } from '@/lib/client-fetch-cache'
import type { JobWithMatch } from '@/types'

const CACHE_KEY = 'dashboard:matched-jobs'

export function TopMatchedJobsLoader() {
  const [jobs, setJobs] = useState<JobWithMatch[] | null>(() =>
    readClientCache<JobWithMatch[]>(CACHE_KEY, 120_000)
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/jobs/match?limit=10')
        if (!res.ok) return
        const data = await res.json()
        const list = (data.jobs || []).slice(0, 10) as JobWithMatch[]
        if (!cancelled) {
          writeClientCache(CACHE_KEY, list)
          setJobs(list)
        }
      } catch {
        if (!cancelled && !jobs) setJobs([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (jobs === null) {
    return <Skeleton className="h-72 rounded-xl" />
  }

  return <TopMatchedJobs jobs={jobs} />
}
