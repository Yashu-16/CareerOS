import Link from 'next/link'
import { StatusBadge } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/format'
import type { ApplicationWithJob } from '@/types'

export function ActivityFeed({ applications }: { applications: ApplicationWithJob[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h2 text-gray-900">Recent activity</h2>
        <Link href="/tracker" className="text-body-sm text-primary-600 font-medium hover:underline">
          View tracker
        </Link>
      </div>

      {applications.length ? (
        <ul className="divide-y divide-gray-200">
          {applications.map((app) => (
            <li key={app.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-md text-gray-900 font-medium truncate">{app.job.title}</p>
                <p className="text-body-sm text-gray-500 truncate">{app.job.company}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={app.status} />
                <span className="text-caption text-gray-500 hidden sm:block">{timeAgo(app.updatedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-gray-500 py-6 text-center">
          No applications yet. Start applying from the{' '}
          <Link href="/jobs" className="text-primary-600 hover:underline">
            Jobs page
          </Link>
          .
        </p>
      )}
    </div>
  )
}
