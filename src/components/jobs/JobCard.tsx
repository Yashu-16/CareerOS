'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { MapPin, Building2, Bookmark } from 'lucide-react'
import { JobTypeBadge, LocationBadge, MatchBadge, SkillTag } from '@/components/ui/Badge'
import { formatSalary, timeAgo } from '@/lib/format'
import type { JobWithMatch } from '@/types'

const COMPANY_SOURCES = ['greenhouse', 'lever', 'ashby', 'smartrecruiters']
const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  naukri: 'Naukri',
  internshala: 'Internshala',
}

/** Describe where a posting came from: direct-from-company vs an aggregator. */
function sourceMeta(source?: string): { label: string; direct: boolean } | null {
  if (!source) return null
  if (COMPANY_SOURCES.includes(source)) return { label: 'Direct from company', direct: true }
  return { label: SOURCE_LABELS[source] ?? source, direct: false }
}

export function JobCard({
  job,
  onClick,
  onSave,
  saved,
}: {
  job: JobWithMatch
  onClick?: () => void
  onSave?: () => void
  saved?: boolean
}) {
  const reduced = useReducedMotion()
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
  const source = sourceMeta((job as { source?: string }).source)

  return (
    <motion.div
      whileHover={reduced ? undefined : { y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="h-full w-full object-contain" />
          ) : (
            <Building2 size={20} className="text-gray-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-h3 text-gray-900 truncate">{job.title}</h3>
          <p className="text-body-sm text-gray-500 truncate">{job.company}</p>
        </div>
        {typeof job.matchScore === 'number' && <MatchBadge score={job.matchScore} />}
        {onSave && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            className="text-gray-500 hover:text-primary-600 transition-colors"
            aria-label={saved ? 'Unsave job' : 'Save job'}
          >
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 text-body-sm text-gray-500">
        <MapPin size={14} />
        <span className="truncate">{job.location}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <JobTypeBadge type={job.jobType} />
        <LocationBadge type={job.locationType} />
        {source && (
          <span
            className={
              source.direct
                ? 'inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium bg-primary-50 text-primary-700 border border-primary-200'
                : 'inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium bg-gray-100 text-gray-600'
            }
          >
            {source.label}
          </span>
        )}
        {salary && (
          <span className="text-body-sm font-medium text-success">{salary}</span>
        )}
      </div>

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 5).map((s) => (
            <SkillTag key={s}>{s}</SkillTag>
          ))}
          {job.skills.length > 5 && (
            <span className="text-caption text-gray-500">+{job.skills.length - 5} more</span>
          )}
        </div>
      )}

      <p className="text-caption text-gray-500 mt-3">Posted {timeAgo(job.postedAt)}</p>
    </motion.div>
  )
}
