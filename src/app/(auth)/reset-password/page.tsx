'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Spinner } from '@/components/ui/Spinner'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })
type FormData = z.infer<typeof schema>

function ResetInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast('Invalid reset link.', 'error')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      toast(json.message || 'Reset failed.', 'error')
      return
    }
    toast('Password reset! You can now sign in.', 'success')
    router.push('/login')
  }

  return (
    <div>
      <h1 className="text-h1 text-gray-900">Set a new password</h1>
      <p className="text-body-md text-gray-500 mt-1">Choose a strong password for your account.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <Input label="New password" type="password" error={errors.password?.message} {...register('password')} />
        <Input label="Confirm password" type="password" error={errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" fullWidth loading={submitting}>
          Reset password
        </Button>
      </form>
      <p className="text-body-sm text-gray-500 mt-6 text-center">
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Spinner size={32} className="text-primary-600 mx-auto" />}>
      <ResetInner />
    </Suspense>
  )
}
