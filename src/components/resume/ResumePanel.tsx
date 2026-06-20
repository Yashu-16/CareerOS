'use client'

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import ResumeUpload from './ResumeUpload'
import { ATSReportView } from './ATSReportView'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import type { ATSReport } from '@/types'

interface Props {
  initialResume: { id: string; filename: string } | null
  initialReport: ATSReport | null
  context: string
}

export function ResumePanel({ initialResume, initialReport, context }: Props) {
  const { toast } = useToast()
  const [resume, setResume] = useState(initialResume)
  const [report, setReport] = useState<ATSReport | null>(initialReport)
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [storageMode, setStorageMode] = useState<'s3' | 'local' | null>(null)

  useEffect(() => {
    fetch('/api/resume/storage')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setStorageMode(d?.mode === 's3' ? 's3' : 'local'))
      .catch(() => setStorageMode(null))
  }, [])

  const analyze = async () => {
    if (!resume) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: resume.id, jobDescription: jobDescription || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.message || 'Analysis failed. Please try again.', 'error')
        return
      }
      setReport(data)
      toast('Analysis complete!', 'success')
    } catch {
      toast('Analysis failed. Please try again.', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-h2 text-gray-900 mb-1">Your resume</h2>
        {storageMode && (
          <p className="text-caption text-gray-500 mb-4">
            {storageMode === 's3'
              ? 'Files are stored securely in your AWS S3 bucket.'
              : 'Dev mode: files stored locally (.uploads/). Add AWS keys in .env.local for S3.'}
          </p>
        )}
        {resume ? (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={20} className="text-primary-600 shrink-0" />
              <span className="text-body-md text-gray-900 truncate">{resume.filename}</span>
            </div>
          </div>
        ) : null}
        <div className="mt-4">
          <ResumeUpload
            onUploadComplete={(id, filename, storage) => {
              setResume({ id, filename })
              setReport(null)
              if (storage === 's3') setStorageMode('s3')
              toast(
                storage === 's3'
                  ? 'Resume saved to AWS S3. Profile & job match updated.'
                  : 'Resume uploaded! Profile & job match scores updated.',
                'success'
              )
            }}
          />
        </div>
      </div>

      {resume && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-h2 text-gray-900">Run ATS analysis</h2>
          <p className="text-body-sm text-gray-500 mt-1">
            Optionally paste a job description to score your resume against a specific role.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste a target job description (optional)..."
            className="w-full mt-3 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-600"
          />
          <Button className="mt-3" onClick={analyze} loading={analyzing}>
            {report ? 'Re-analyze resume' : 'Analyze resume'}
          </Button>
        </div>
      )}

      {analyzing && !report && (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      )}

      {report && <ATSReportView report={report} context={context} />}
    </div>
  )
}
