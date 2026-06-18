'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StepProgress } from '@/components/onboarding/StepProgress'
import { SkillsInput } from '@/components/onboarding/SkillsInput'
import { useToast } from '@/components/ui/Toast'

const LEVELS = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'ZERO_TO_TWO', label: '0–2 years' },
  { value: 'TWO_TO_FIVE', label: '2–5 years' },
  { value: 'FIVE_PLUS', label: '5+ years' },
]

export default function OnboardingStep2() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [targetRole, setTargetRole] = useState('')
  const [targetIndustry, setTargetIndustry] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('FRESHER')
  const [skills, setSkills] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRole.trim()) {
      setError('Enter your target role.')
      return
    }
    setError(null)
    setSubmitting(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole, targetIndustry, experienceLevel, skills }),
    })
    setSubmitting(false)
    if (!res.ok) {
      toast('Could not save. Please try again.', 'error')
      return
    }
    router.push('/onboarding/step-3')
  }

  return (
    <div>
      <StepProgress current={2} />
      <Card>
        <h1 className="text-h1 text-gray-900">What are you aiming for?</h1>
        <p className="text-body-md text-gray-500 mt-1">
          We use this to power AI job matching and your copilot.
        </p>
        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <Input
            label="Target role"
            placeholder="Frontend Developer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            error={error || undefined}
          />
          <Input
            label="Target industry (optional)"
            placeholder="Product / SaaS / Fintech"
            value={targetIndustry}
            onChange={(e) => setTargetIndustry(e.target.value)}
          />
          <div>
            <label className="block text-label text-gray-700 mb-1.5">Experience level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setExperienceLevel(l.value)}
                  className={
                    'px-3 py-2 rounded-lg text-body-sm font-medium border transition-colors ' +
                    (experienceLevel === l.value
                      ? 'bg-primary-50 border-primary-600 text-primary-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50')
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <SkillsInput value={skills} onChange={setSkills} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => router.push('/onboarding/step-1')}>
              Back
            </Button>
            <Button type="submit" fullWidth loading={submitting}>
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
