'use client'

import { useState } from 'react'
import { JobCard } from './JobCard'
import { JobDrawer } from './JobDrawer'
import { Briefcase } from 'lucide-react'
import type { JobWithMatch } from '@/types'

export function JobGrid({ jobs }: { jobs: JobWithMatch[] }) {
  const [selected, setSelected] = useState<JobWithMatch | null>(null)
  const [open, setOpen] = useState(false)

  if (!jobs.length) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Briefcase size={36} className="mx-auto text-gray-500 mb-3" />
        <p className="text-body-lg text-gray-900 font-medium">No jobs found</p>
        <p className="text-body-sm text-gray-500 mt-1">
          Try a different search term, location, or job type.
        </p>
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
