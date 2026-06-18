'use client'

import { useState } from 'react'
import { Building2, MapPin, ExternalLink, Bookmark, Check } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { JobTypeBadge, LocationBadge, MatchBadge, SkillTag } from '@/components/ui/Badge'
import { formatSalary, timeAgo } from '@/lib/format'
import { useToast } from '@/components/ui/Toast'
import type { JobWithMatch } from '@/types'

export function JobDrawer({
  job,
  open,
  onClose,
}: {
  job: JobWithMatch | null
  open: boolean
  onClose: () => void
}) {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  const [applied, setApplied] = useState(false)
  const [working, setWorking] = useState(false)

  if (!job) return null
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)

  const toggleSave = async () => {
    const next = !saved
    setSaved(next)
    await fetch('/api/jobs/save', {
      method: next ? 'POST' : 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(() => setSaved(!next))
  }

  const trackApplication = async () => {
    setWorking(true)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, status: 'APPLIED', matchScore: job.matchScore }),
    })
    setWorking(false)
    if (res.ok) {
      setApplied(true)
      toast('Added to your application tracker.', 'success')
    } else {
      toast('Could not track this application.', 'error')
    }
  }

  return (
    <Drawer open={open} onClose={onClose}>
      <div className="p-6 pt-12">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.company} className="h-full w-full object-contain" />
            ) : (
              <Building2 size={24} className="text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-h1 text-gray-900">{job.title}</h2>
            <p className="text-body-md text-gray-500">{job.company}</p>
            <div className="flex items-center gap-1.5 text-body-sm text-gray-500 mt-1">
              <MapPin size={14} /> {job.location}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <JobTypeBadge type={job.jobType} />
          <LocationBadge type={job.locationType} />
          {typeof job.matchScore === 'number' && <MatchBadge score={job.matchScore} />}
          {salary && <span className="text-body-md font-semibold text-success">{salary}</span>}
        </div>

        <div className="flex gap-3 mt-5">
          <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button fullWidth>
              Apply now <ExternalLink size={16} />
            </Button>
          </a>
          <Button variant="secondary" onClick={trackApplication} loading={working} disabled={applied}>
            {applied ? <Check size={16} /> : null}
            {applied ? 'Tracked' : 'Track'}
          </Button>
          <Button variant="ghost" onClick={toggleSave} aria-label="Save">
            <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
          </Button>
        </div>

        {job.skills?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-h3 text-gray-900 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <SkillTag key={s}>{s}</SkillTag>
              ))}
            </div>
          </div>
        )}

        {job.requirements && (
          <div className="mt-6">
            <h3 className="text-h3 text-gray-900 mb-2">Requirements</h3>
            <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{job.requirements}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-h3 text-gray-900 mb-2">Description</h3>
          <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{job.description}</p>
        </div>

        <p className="text-caption text-gray-500 mt-6">
          Posted {timeAgo(job.postedAt)} · via {job.source}
        </p>
      </div>
    </Drawer>
  )
}
