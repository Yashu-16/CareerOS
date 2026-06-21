'use client'

import Link from 'next/link'
import { JobGrid } from '@/components/jobs/JobGrid'
import { Sparkles } from 'lucide-react'
import type { JobWithMatch } from '@/types'

export function TopMatchedJobs({ jobs }: { jobs: JobWithMatch[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-ai" />
          <h2 className="text-h2 text-gray-900">AI-matched jobs</h2>
        </div>
        <Link href="/jobs" className="text-body-sm text-primary-600 font-medium hover:underline">
          Browse all
        </Link>
      </div>

      {jobs.length ? (
        <JobGrid jobs={jobs.slice(0, 6)} />
      ) : (
        <div className="text-center py-10">
          <p className="text-body-md text-gray-900 font-medium">No matches yet</p>
          <p className="text-body-sm text-gray-500 mt-1 max-w-md mx-auto">
            Upload and analyze your resume to unlock AI-powered job matching tailored to your skills.
          </p>
          <Link
            href="/resume"
            className="inline-block mt-4 bg-primary-600 text-gray-900 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-primary-700 transition-all"
          >
            Analyze my resume
          </Link>
        </div>
      )}
    </div>
  )
}
