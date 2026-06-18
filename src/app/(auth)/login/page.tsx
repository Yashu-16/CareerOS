'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in. Check your inbox.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  CredentialsSignin: 'Incorrect email or password.',
}

export default function LoginPage() {
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
    const res = await signIn('credentials', { ...data, redirect: false })
    setSubmitting(false)
    if (res?.error) {
      toast(ERROR_MESSAGES[res.error] || 'Unable to sign in. Please try again.', 'error')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-h1 text-gray-900">Welcome back</h1>
      <p className="text-body-md text-gray-500 mt-1">Sign in to continue to CareerOS India.</p>

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
        <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body-sm text-primary-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="text-body-sm text-gray-500 mt-6 text-center">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
