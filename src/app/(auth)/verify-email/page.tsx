'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in this link.')
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const json = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage(json.message)
        } else {
          setStatus('error')
          setMessage(json.message || 'This link is invalid or has expired.')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    })()
  }, [token])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <Spinner size={32} className="text-primary-600 mx-auto" />
          <p className="text-body-md text-gray-500 mt-4">Verifying your email...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-h1 text-gray-900">Email verified!</h1>
          <p className="text-body-md text-gray-500 mt-2">{message}</p>
          <Link href="/login">
            <Button className="mt-6">Continue to sign in</Button>
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-h1 text-gray-900">Verification failed</h1>
          <p className="text-body-md text-gray-500 mt-2">{message}</p>
          <Link href="/login">
            <Button variant="secondary" className="mt-6">
              Back to sign in
            </Button>
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<Spinner size={32} className="text-primary-600 mx-auto" />}>
      <VerifyEmailInner />
    </Suspense>
  )
}
