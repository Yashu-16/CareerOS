import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Building2, MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { Button } from '@/components/ui/Button'
import { JobTypeBadge, LocationBadge, SkillTag } from '@/components/ui/Badge'
import { formatSalary, formatJobPostedAt } from '@/lib/format'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  await getCurrentUser()
  const job = await prisma.job.findUnique({ where: { id: params.id } })
  if (!job) notFound()

  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft size={16} /> Back to jobs
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.company} className="h-full w-full object-contain" />
            ) : (
              <Building2 size={24} className="text-gray-500" />
            )}
          </div>
          <div>
            <h1 className="text-h1 text-gray-900">{job.title}</h1>
            <p className="text-body-md text-gray-500">{job.company}</p>
            <div className="flex items-center gap-1.5 text-body-sm text-gray-500 mt-1">
              <MapPin size={14} /> {job.location}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <JobTypeBadge type={job.jobType} />
          <LocationBadge type={job.locationType} />
          {salary && <span className="text-body-md font-semibold text-success">{salary}</span>}
        </div>

        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-5">
          <Button>
            Apply now <ExternalLink size={16} />
          </Button>
        </a>
      </div>

      {job.skills.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-h2 text-gray-900 mb-3">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((s) => (
              <SkillTag key={s}>{s}</SkillTag>
            ))}
          </div>
        </div>
      )}

      {job.requirements && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-h2 text-gray-900 mb-3">Requirements</h2>
          <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{job.requirements}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-h2 text-gray-900 mb-3">Description</h2>
        <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{job.description}</p>
        <p className="text-caption text-gray-500 mt-4">
          {formatJobPostedAt(job.postedAt, job.scrapedAt)} · via {job.source}
        </p>
      </div>
    </div>
  )
}
