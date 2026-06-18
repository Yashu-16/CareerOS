'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, ExternalLink, Briefcase } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { timeAgo } from '@/lib/format'

interface Drive {
  company: string
  openRoles: number
  latestPostedAt: string | null
  sampleRole: string | null
  companyLogo: string | null
  location: string
  applyUrl: string
  jobId: string | null
}

export default function EventsPage() {
  const [drives, setDrives] = useState<Drive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/events')
        const data = await res.json()
        setDrives(data.drives || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-gray-900">Hiring Drives</h1>
        <p className="text-body-md text-gray-500 mt-1">
          Companies actively hiring in India right now, ranked by open roles.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : drives.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((d) => (
            <div key={d.company} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
                  {d.companyLogo ? (
                    <img src={d.companyLogo} alt={d.company} className="h-full w-full object-contain" />
                  ) : (
                    <Building2 size={18} className="text-gray-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-h3 text-gray-900 truncate">{d.company}</p>
                  <p className="text-caption text-gray-500 flex items-center gap-1 truncate">
                    <MapPin size={12} /> {d.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-body-sm text-gray-700">
                <Briefcase size={14} className="text-primary-600" />
                <span className="font-semibold text-primary-600">{d.openRoles}</span> open role
                {d.openRoles !== 1 ? 's' : ''}
              </div>
              {d.sampleRole && <p className="text-body-sm text-gray-500 mt-1 truncate">e.g. {d.sampleRole}</p>}
              {d.latestPostedAt && (
                <p className="text-caption text-gray-500 mt-2">Latest posting {timeAgo(d.latestPostedAt)}</p>
              )}

              <a
                href={d.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-body-sm text-primary-600 font-medium hover:underline"
              >
                View roles <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-body-lg text-gray-900 font-medium">No hiring drives yet</p>
          <p className="text-body-sm text-gray-500 mt-1">
            Once jobs are synced, active hiring companies will appear here.
          </p>
        </div>
      )}
    </div>
  )
}
