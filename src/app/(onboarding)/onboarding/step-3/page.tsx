'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StepProgress } from '@/components/onboarding/StepProgress'
import ResumeUpload from '@/components/resume/ResumeUpload'
import { useToast } from '@/components/ui/Toast'

export default function OnboardingStep3() {
  const router = useRouter()
  const { toast } = useToast()
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const finish = async (runAnalysis: boolean) => {
    if (runAnalysis && resumeId) {
      setAnalyzing(true)
      // Kick off ATS analysis (also generates the matching embedding).
      fetch('/api/ats/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      }).catch(() => {})
      toast('Analyzing your resume — results will appear on your dashboard.', 'info')
    }
    router.push('/dashboard')
  }

  return (
    <div>
      <StepProgress current={3} />
      <Card>
        <h1 className="text-h1 text-gray-900">Upload your resume</h1>
        <p className="text-body-md text-gray-500 mt-1">
          We&apos;ll score it against ATS systems and match you to relevant jobs.
        </p>
        <div className="mt-6">
          <ResumeUpload
            onUploadComplete={(id) => {
              setResumeId(id)
              toast('Resume uploaded!', 'success')
            }}
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => finish(false)}>
            Skip for now
          </Button>
          <Button fullWidth disabled={!resumeId} loading={analyzing} onClick={() => finish(true)}>
            Finish & analyze resume
          </Button>
        </div>
      </Card>
    </div>
  )
}
