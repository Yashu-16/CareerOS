'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitting(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">📨</div>
        <h1 className="text-h1 text-gray-900">Check your email</h1>
        <p className="text-body-md text-gray-500 mt-2">
          If an account exists for that email, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="inline-block mt-6 text-primary-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-h1 text-gray-900">Forgot password?</h1>
      <p className="text-body-md text-gray-500 mt-1">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Button type="submit" fullWidth loading={submitting}>
          Send reset link
        </Button>
      </form>
      <p className="text-body-sm text-gray-500 mt-6 text-center">
        Remembered it?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
