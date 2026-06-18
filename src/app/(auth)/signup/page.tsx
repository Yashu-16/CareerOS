'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  name: z.string().min(2, 'Enter your full name').max(100),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
})
type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.message || 'Sign up failed. Please try again.', 'error')
        return
      }
      setDone(true)
    } catch {
      toast('Network error. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3">📧</div>
        <h1 className="text-h1 text-gray-900">Check your inbox</h1>
        <p className="text-body-md text-gray-500 mt-2">
          We&apos;ve sent a verification link to your email. Click it to activate your account, then
          sign in.
        </p>
        <Link href="/login" className="inline-block mt-6 text-primary-600 font-medium hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-h1 text-gray-900">Create your account</h1>
      <p className="text-body-md text-gray-500 mt-1">Start landing interviews faster. It&apos;s free.</p>

      <Button
        variant="secondary"
        fullWidth
        className="mt-6"
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-caption text-gray-500">or</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="Priya Sharma" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          hint="At least 8 characters, one uppercase letter and one number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="text-body-sm text-gray-500 mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
