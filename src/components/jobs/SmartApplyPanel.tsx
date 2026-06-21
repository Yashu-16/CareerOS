'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  Sparkles,
  Download,
  ExternalLink,
  Check,
  Loader2,
  Puzzle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SkillTag } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import type { JobWithMatch } from '@/types'

interface TailorState {
  id: string
  overallScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  addedKeywords: string[]
  appliedEditsCount: number
  filename: string
  downloadPath: string
}

type Step = 'idle' | 'tailoring' | 'ready' | 'applying'

interface ResumeInfo {
  filename: string
  isDocx: boolean
  fileMissing?: boolean
}

export function SmartApplyPanel({ job }: { job: JobWithMatch }) {
  const { toast } = useToast()
  const [step, setStep] = useState<Step>('idle')
  const [tailored, setTailored] = useState<TailorState | null>(null)
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null)
  const [tracked, setTracked] = useState(false)
  const [extensionId, setExtensionId] = useState<string | null>(null)
  const [extensionConnected, setExtensionConnected] = useState(false)

  const canTailor = resumeInfo?.isDocx === true && !resumeInfo?.fileMissing

  const loadExisting = useCallback(async () => {
    const res = await fetch(`/api/apply/tailor?jobId=${encodeURIComponent(job.id)}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.resume) setResumeInfo(data.resume)
    if (data.tailored) {
      setTailored({
        id: data.tailored.id,
        overallScore: data.tailored.overallScore,
        matchedKeywords: data.tailored.matchedKeywords,
        missingKeywords: data.tailored.missingKeywords,
        addedKeywords: data.tailored.addedKeywords,
        appliedEditsCount: data.tailored.appliedEditsCount ?? 0,
        filename: data.tailored.filename,
        downloadPath: data.tailored.downloadPath,
      })
      setStep('ready')
    }
  }, [job.id])

  useEffect(() => {
    setStep('idle')
    setTailored(null)
    setResumeInfo(null)
    setTracked(false)
    loadExisting()
  }, [job.id, loadExisting])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CAREEROS_EXTENSION_PRESENT') {
        setExtensionId(event.data.extensionId || null)
      }
    }
    window.addEventListener('message', onMessage)
    window.postMessage({ type: 'CAREEROS_EXTENSION_PING' }, '*')
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const tailorResume = async () => {
    setStep('tailoring')
    try {
      const res = await fetch('/api/apply/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || data.code || 'Tailoring failed')
      }
      setTailored({
        id: data.tailoredResumeId,
        overallScore: data.overallScore,
        matchedKeywords: data.matchedKeywords,
        missingKeywords: data.missingKeywords,
        addedKeywords: data.addedKeywords,
        appliedEditsCount: data.appliedEditsCount ?? 0,
        filename: data.filename,
        downloadPath: data.downloadPath,
      })
      setStep('ready')
      void loadExisting()
      if ((data.appliedEditsCount ?? 0) > 0) {
        toast('Resume tailored — download your DOCX below (same layout).', 'success')
      } else {
        toast('Tailoring complete — your DOCX is ready. Download to review.', 'info')
      }
    } catch (err) {
      setStep('idle')
      toast(err instanceof Error ? err.message : 'Could not tailor resume', 'error')
    }
  }

  const connectExtension = () => {
    const url = extensionId
      ? `/extension/connect?extensionId=${encodeURIComponent(extensionId)}`
      : '/extension/connect'
    window.open(url, '_blank', 'noopener,noreferrer,width=480,height=640')
    setExtensionConnected(true)
    toast('Sign in once in the new tab — your extension stays connected.', 'success')
  }

  const downloadTailored = async () => {
    if (!tailored) return
    try {
      const res = await fetch(tailored.downloadPath)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      if (
        blob.type &&
        !blob.type.includes('wordprocessingml') &&
        !blob.type.includes('octet-stream')
      ) {
        throw new Error('Expected a DOCX file')
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = tailored.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast('Could not download tailored resume.', 'error')
    }
  }

  const openApplyWithAutofill = async () => {
    setStep('applying')
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          status: 'APPLIED',
          matchScore: job.matchScore,
          tailoredResumeId: tailored?.id,
        }),
      })
      setTracked(true)
    } catch {
      /* non-blocking */
    }

    if (typeof window !== 'undefined') {
      const applyContext = {
        jobId: job.id,
        applyUrl: job.applyUrl,
        jobTitle: job.title,
        company: job.company,
      }
      try {
        localStorage.setItem(
          'careeros_apply_context',
          JSON.stringify({
            pendingJobId: applyContext.jobId,
            pendingApplyUrl: applyContext.applyUrl,
            pendingJobTitle: applyContext.jobTitle,
            pendingCompany: applyContext.company,
          })
        )
      } catch {
        /* non-blocking */
      }
      window.postMessage({ type: 'CAREEROS_SET_APPLY_CONTEXT', ...applyContext }, '*')
    }

    window.open(job.applyUrl, '_blank', 'noopener,noreferrer')
    toast('Application page opened — click Autofill in the CareerOS extension.', 'success')
    setStep('ready')
  }

  return (
    <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50/40 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary-100 grid place-items-center shrink-0">
          <Sparkles size={18} className="text-primary-700" />
        </div>
        <div>
          <h3 className="text-body-md font-semibold text-gray-900">Smart Apply</h3>
          <p className="text-body-sm text-gray-600 mt-0.5">
            Tailor your DOCX resume with job keywords (same layout), then autofill the application form.
          </p>
        </div>
      </div>

      {step === 'idle' && resumeInfo?.fileMissing && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
          <p className="text-body-sm text-red-900">
            Your resume <span className="font-medium">{resumeInfo.filename}</span> is registered but the file is
            missing from storage (common after a server reset). Please upload it again.
          </p>
          <Link
            href="/resume"
            className="inline-flex text-body-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Re-upload DOCX resume →
          </Link>
        </div>
      )}

      {step === 'idle' && canTailor && (
        <>
          <p className="text-caption font-medium text-gray-700 uppercase tracking-wide">Step 1 · Tailor resume</p>
          <Button onClick={tailorResume} fullWidth>
            <Sparkles size={16} /> Customize resume for this job
          </Button>
        </>
      )}

      {step === 'idle' && resumeInfo && !canTailor && !resumeInfo.fileMissing && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-body-sm text-amber-900">
            Smart Apply needs a <strong>DOCX</strong> resume to keep your formatting. Your current file is{' '}
            <span className="font-medium">{resumeInfo.filename}</span>.
          </p>
          <Link
            href="/resume"
            className="inline-flex text-body-sm font-medium text-primary-700 hover:text-primary-800"
          >
            Upload a .docx resume →
          </Link>
        </div>
      )}

      {step === 'tailoring' && (
        <div className="flex items-center justify-center gap-2 py-4 text-body-sm text-primary-700">
          <Loader2 size={18} className="animate-spin" /> Analyzing job & weaving in keywords…
        </div>
      )}

      {(step === 'ready' || step === 'applying') && tailored && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body-sm text-gray-700">ATS match score</span>
            <span className="text-h3 font-semibold text-primary-700">{tailored.overallScore}%</span>
          </div>

          {tailored.addedKeywords.length > 0 && (
            <div>
              <p className="text-caption text-gray-500 mb-1.5">Keywords added to your resume</p>
              <div className="flex flex-wrap gap-1">
                {tailored.addedKeywords.slice(0, 8).map((k) => (
                  <SkillTag key={k}>{k}</SkillTag>
                ))}
              </div>
            </div>
          )}

          {tailored.missingKeywords.length > 0 && (
            <div>
              <p className="text-caption text-gray-500 mb-1.5">Still missing (optional)</p>
              <div className="flex flex-wrap gap-1">
                {tailored.missingKeywords.slice(0, 6).map((k) => (
                  <span key={k} className="text-caption px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tailored.appliedEditsCount > 0 && (
            <p className="text-body-sm text-gray-600">
              Updated {tailored.appliedEditsCount} section{tailored.appliedEditsCount === 1 ? '' : 's'} in your DOCX — formatting unchanged.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <div className="w-full">
              <p className="text-caption font-medium text-gray-700 uppercase tracking-wide mb-2">
                Step 2 · Download
              </p>
            </div>
            <Button variant="secondary" type="button" onClick={downloadTailored}>
              <Download size={16} /> Download tailored resume (DOCX)
            </Button>
            <Button variant="ghost" type="button" onClick={tailorResume}>
              Re-tailor
            </Button>
          </div>

          <div className="border-t border-primary-200/60 pt-3 space-y-2">
            <p className="text-caption font-medium text-gray-700 uppercase tracking-wide">Step 3 · Autofill form</p>
            <ol className="text-body-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Install the CareerOS Autofill extension (see <code className="text-xs bg-white px-1 rounded">extension/</code> folder)</li>
              <li>Connect once — no token to copy</li>
              <li>Open the job application & click <strong>Autofill</strong></li>
            </ol>
            <Button variant="secondary" type="button" onClick={connectExtension} className="w-full">
              <Puzzle size={16} /> {extensionConnected ? 'Extension connect opened' : 'Connect extension'}
            </Button>
            {extensionId && (
              <p className="text-caption text-success flex items-center gap-1">
                <Check size={14} /> Extension detected in this browser
              </p>
            )}
            <Button fullWidth onClick={openApplyWithAutofill} loading={step === 'applying'}>
              Apply with autofill <ExternalLink size={16} />
            </Button>
            {tracked && (
              <p className="text-caption text-success flex items-center gap-1">
                <Check size={14} /> Tracked in your application board
              </p>
            )}
          </div>
        </div>
      )}

      {step === 'idle' && !resumeInfo && (
        <p className="text-caption text-gray-500 flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          Upload a <strong>DOCX</strong> resume on the{' '}
          <Link href="/resume" className="text-primary-700 hover:underline">
            Resume page
          </Link>
          . We only swap keywords in your file — layout and styling stay the same.
        </p>
      )}

      {step === 'idle' && canTailor && (
        <p className="text-caption text-gray-500 flex items-start gap-1.5">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          Using {resumeInfo?.filename}. Output is a DOCX with the same layout and tailored keywords.
        </p>
      )}
    </div>
  )
}
