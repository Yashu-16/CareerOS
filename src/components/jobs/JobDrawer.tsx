'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, ExternalLink, Bookmark, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { JobTypeBadge, LocationBadge, MatchBadge, SkillTag } from '@/components/ui/Badge'
import { SmartApplyPanel } from '@/components/jobs/SmartApplyPanel'
import { formatSalary, formatJobPostedAt } from '@/lib/format'
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
  const [showSmartApply, setShowSmartApply] = useState(true)
  const [detail, setDetail] = useState<JobWithMatch | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!open || !job?.id) {
      setDetail(null)
      return
    }
    setLoadingDetail(true)
    fetch(`/api/jobs/${job.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.job) setDetail({ ...job, ...data.job })
        else setDetail(job)
      })
      .catch(() => setDetail(job))
      .finally(() => setLoadingDetail(false))
  }, [open, job])

  if (!job) return null
  const view = detail || job
  const salary = formatSalary(view.salaryMin, view.salaryMax, view.salaryCurrency)

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
            {view.companyLogo ? (
              <img src={view.companyLogo} alt={view.company} className="h-full w-full object-contain" />
            ) : (
              <Building2 size={24} className="text-gray-500" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-h1 text-gray-900">{view.title}</h2>
            <p className="text-body-md text-gray-500">{view.company}</p>
            <div className="flex items-center gap-1.5 text-body-sm text-gray-500 mt-1">
              <MapPin size={14} /> {view.location}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <JobTypeBadge type={view.jobType} />
          <LocationBadge type={view.locationType} />
          {typeof view.matchScore === 'number' && <MatchBadge score={view.matchScore} />}
          {salary && <span className="text-body-md font-semibold text-success">{salary}</span>}
        </div>

        <button
          type="button"
          onClick={() => setShowSmartApply((v) => !v)}
          className="mt-4 w-full flex items-center justify-between text-body-sm font-medium text-primary-700"
        >
          Smart Apply (tailor + autofill)
          {showSmartApply ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showSmartApply && <SmartApplyPanel job={view} />}

        <div className="flex gap-3 mt-5">
          <a href={view.applyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="secondary" fullWidth>
              Quick apply <ExternalLink size={16} />
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

        {view.skills?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-h3 text-gray-900 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {view.skills.map((s) => (
                <SkillTag key={s}>{s}</SkillTag>
              ))}
            </div>
          </div>
        )}

        {view.requirements && (
          <div className="mt-6">
            <h3 className="text-h3 text-gray-900 mb-2">Requirements</h3>
            <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{view.requirements}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-h3 text-gray-900 mb-2">Description</h3>
          {loadingDetail && !view.description ? (
            <p className="text-body-sm text-gray-500">Loading description…</p>
          ) : (
            <p className="text-body-md text-gray-700 whitespace-pre-line prose-readable">{view.description}</p>
          )}
        </div>

        <p className="text-caption text-gray-500 mt-6">
          {formatJobPostedAt(view.postedAt, view.scrapedAt)} · via {view.source}
        </p>
      </div>
    </Drawer>
  )
}
