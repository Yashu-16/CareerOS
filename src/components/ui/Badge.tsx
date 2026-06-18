import { cn } from '@/lib/cn'
import type { ApplicationStatus, JobType, LocationType } from '@prisma/client'

const base = 'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full'

export function Badge({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <span className={cn(base, className)}>{children}</span>
}

export function JobTypeBadge({ type }: { type: JobType }) {
  const labels: Record<JobType, string> = {
    FULLTIME: 'Full-time',
    PARTTIME: 'Part-time',
    INTERNSHIP: 'Internship',
    CONTRACT: 'Contract',
    FREELANCE: 'Freelance',
  }
  return <Badge className="bg-blue-100 text-blue-800">{labels[type]}</Badge>
}

export function LocationBadge({ type }: { type: LocationType }) {
  if (type === 'REMOTE') return <Badge className="bg-green-100 text-green-800">Remote</Badge>
  if (type === 'HYBRID') return <Badge className="bg-ai-light text-ai">Hybrid</Badge>
  return <Badge className="bg-gray-50 text-gray-700 border border-gray-200">On-site</Badge>
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, string> = {
    APPLIED: 'bg-blue-100 text-blue-800',
    SCREENING: 'bg-ai-light text-ai',
    INTERVIEW: 'bg-warning-light text-warning',
    OFFER: 'bg-success-light text-success',
    REJECTED: 'bg-danger-light text-danger',
    WITHDRAWN: 'bg-gray-50 text-gray-500 border border-gray-200',
  }
  return <Badge className={map[status]}>{status.charAt(0) + status.slice(1).toLowerCase()}</Badge>
}

export function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const high = pct >= 80
  return (
    <span
      className={cn(
        'text-sm font-semibold px-3 py-1 rounded-full',
        high ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
      )}
    >
      {pct}% match
    </span>
  )
}

export function SkillTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gray-50 text-gray-700 text-xs px-2 py-0.5 rounded-md border border-gray-200">
      {children}
    </span>
  )
}
