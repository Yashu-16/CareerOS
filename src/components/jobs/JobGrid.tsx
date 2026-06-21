'use client'

import { useState } from 'react'
import { JobCard } from './JobCard'
import { JobDrawer } from './JobDrawer'
import { Briefcase } from 'lucide-react'
import type { JobWithMatch } from '@/types'

export function JobGrid({
  jobs,
  catalogEmpty,
  onRefresh,
  syncing,
}: {
  jobs: JobWithMatch[]
  catalogEmpty?: boolean
  onRefresh?: () => void
  syncing?: boolean
}) {
  const [selected, setSelected] = useState<JobWithMatch | null>(null)
  const [open, setOpen] = useState(false)

  if (!jobs.length) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Briefcase size={36} className="mx-auto text-gray-500 mb-3" />
        <p className="text-body-lg text-gray-900 font-medium">
          {catalogEmpty ? 'Job catalog is empty' : 'No jobs found'}
        </p>
        <p className="text-body-sm text-gray-500 mt-1 max-w-md mx-auto">
          {catalogEmpty
            ? 'Pull the latest roles from company career pages, LinkedIn, and Indeed.'
            : 'Try a different search term, location, or job type.'}
        </p>
        {catalogEmpty && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={syncing}
            className="mt-4 inline-flex items-center gap-2 text-body-sm text-primary-700 font-medium hover:underline disabled:opacity-50"
          >
            {syncing ? 'Refreshing…' : 'Refresh job catalog'}
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id || job.externalId}
            job={job}
            onClick={() => {
              setSelected(job)
              setOpen(true)
            }}
          />
        ))}
      </div>
      <JobDrawer job={selected} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
