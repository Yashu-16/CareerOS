'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SkillsInput } from '@/components/onboarding/SkillsInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

const LEVELS = [
  { value: 'FRESHER', label: 'Fresher' },
  { value: 'ZERO_TO_TWO', label: '0–2 years' },
  { value: 'TWO_TO_FIVE', label: '2–5 years' },
  { value: 'FIVE_PLUS', label: '5+ years' },
]

interface Profile {
  name: string
  email: string
  college: string
  degree: string
  graduationYear: number | null
  city: string
  targetRole: string
  targetIndustry: string
  experienceLevel: string
  skills: string[]
  bio: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  notifJobAlerts: boolean
  notifInterviews: boolean
  notifDigest: boolean
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/user/profile')
      const data = await res.json()
      setProfile({
        name: data.name || '',
        email: data.email || '',
        college: data.college || '',
        degree: data.degree || '',
        graduationYear: data.graduationYear ?? null,
        city: data.city || '',
        targetRole: data.targetRole || '',
        targetIndustry: data.targetIndustry || '',
        experienceLevel: data.experienceLevel || 'FRESHER',
        skills: data.skills || [],
        bio: data.bio || '',
        linkedinUrl: data.linkedinUrl || '',
        githubUrl: data.githubUrl || '',
        portfolioUrl: data.portfolioUrl || '',
        notifJobAlerts: data.notifJobAlerts ?? true,
        notifInterviews: data.notifInterviews ?? true,
        notifDigest: data.notifDigest ?? true,
      })
    })()
  }, [])

  const update = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p))

  const save = async () => {
    if (!profile) return
    setSaving(true)
    const { email, ...payload } = profile
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        graduationYear: payload.graduationYear ? Number(payload.graduationYear) : null,
      }),
    })
    setSaving(false)
    toast(res.ok ? 'Profile saved.' : 'Could not save profile.', res.ok ? 'success' : 'error')
  }

  if (!profile) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-h1 text-gray-900">Profile & Settings</h1>
        <p className="text-body-md text-gray-500 mt-1">Keep your profile updated for better matches.</p>
      </div>

      <Card>
        <h2 className="text-h2 text-gray-900 mb-4">Personal</h2>
        <div className="space-y-4">
          <Input label="Full name" value={profile.name} onChange={(e) => update('name', e.target.value)} />
          <Input label="Email" value={profile.email} disabled />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="College" value={profile.college} onChange={(e) => update('college', e.target.value)} />
            <Input label="Degree" value={profile.degree} onChange={(e) => update('degree', e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Graduation year"
              type="number"
              value={profile.graduationYear ?? ''}
              onChange={(e) => update('graduationYear', e.target.value ? Number(e.target.value) : null)}
            />
            <Input label="City" value={profile.city} onChange={(e) => update('city', e.target.value)} />
          </div>
          <div>
            <label className="block text-label text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={profile.bio}
              maxLength={500}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-600"
            />
            <p className="text-caption text-gray-500 mt-1">{profile.bio.length}/500</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-h2 text-gray-900 mb-4">Career goals</h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Target role" value={profile.targetRole} onChange={(e) => update('targetRole', e.target.value)} />
            <Input label="Target industry" value={profile.targetIndustry} onChange={(e) => update('targetIndustry', e.target.value)} />
          </div>
          <div>
            <label className="block text-label text-gray-700 mb-1.5">Experience level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => update('experienceLevel', l.value)}
                  className={
                    'px-3 py-2 rounded-lg text-body-sm font-medium border transition-colors ' +
                    (profile.experienceLevel === l.value
                      ? 'bg-primary-50 border-primary-600 text-primary-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50')
                  }
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <SkillsInput value={profile.skills} onChange={(s) => update('skills', s)} />
        </div>
      </Card>

      <Card>
        <h2 className="text-h2 text-gray-900 mb-4">Links</h2>
        <div className="space-y-4">
          <Input label="LinkedIn URL" value={profile.linkedinUrl} onChange={(e) => update('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
          <Input label="GitHub URL" value={profile.githubUrl} onChange={(e) => update('githubUrl', e.target.value)} placeholder="https://github.com/..." />
          <Input label="Portfolio URL" value={profile.portfolioUrl} onChange={(e) => update('portfolioUrl', e.target.value)} placeholder="https://..." />
        </div>
      </Card>

      <Card>
        <h2 className="text-h2 text-gray-900 mb-4">Notifications</h2>
        <div className="space-y-3">
          <Toggle label="Job alerts" checked={profile.notifJobAlerts} onChange={(v) => update('notifJobAlerts', v)} />
          <Toggle label="Interview reminders" checked={profile.notifInterviews} onChange={(v) => update('notifInterviews', v)} />
          <Toggle label="Weekly digest" checked={profile.notifDigest} onChange={(v) => update('notifDigest', v)} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-body-md text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}
