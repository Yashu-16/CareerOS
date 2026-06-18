'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StepProgress } from '@/components/onboarding/StepProgress'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  college: z.string().min(2, 'Enter your college'),
  degree: z.string().min(2, 'Enter your degree'),
  graduationYear: z.coerce.number().int().min(1990).max(2100),
  city: z.string().min(2, 'Enter your city'),
})
type FormData = z.infer<typeof schema>

export default function OnboardingStep1() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitting(false)
    if (!res.ok) {
      toast('Could not save. Please try again.', 'error')
      return
    }
    router.push('/onboarding/step-2')
  }

  return (
    <div>
      <StepProgress current={1} />
      <Card>
        <h1 className="text-h1 text-gray-900">Tell us about yourself</h1>
        <p className="text-body-md text-gray-500 mt-1">This helps us personalize your job matches.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <Input label="Full name" placeholder="Priya Sharma" error={errors.name?.message} {...register('name')} />
          <Input label="College / University" placeholder="IIT Bombay" error={errors.college?.message} {...register('college')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Degree" placeholder="B.Tech CSE" error={errors.degree?.message} {...register('degree')} />
            <Input
              label="Graduation year"
              type="number"
              placeholder="2025"
              error={errors.graduationYear?.message}
              {...register('graduationYear')}
            />
          </div>
          <Input label="City" placeholder="Bengaluru" error={errors.city?.message} {...register('city')} />
          <Button type="submit" fullWidth loading={submitting}>
            Continue
          </Button>
        </form>
      </Card>
    </div>
  )
}
