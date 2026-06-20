'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'

type ConnectState = 'loading' | 'needs_login' | 'ready' | 'connecting' | 'success' | 'error'

declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: Record<string, unknown>,
          callback?: (response: { ok?: boolean; error?: string }) => void
        ) => void
        lastError?: { message?: string }
      }
    }
  }
}

export default function ExtensionConnectPage() {
  const searchParams = useSearchParams()
  const extensionId = searchParams.get('extensionId')
  const { status } = useSession()
  const [state, setState] = useState<ConnectState>('loading')
  const [error, setError] = useState<string | null>(null)

  const connectExtension = useCallback(async () => {
    if (!extensionId) {
      setState('error')
      setError('Open this page from the CareerOS extension popup so we can link your account.')
      return
    }

    setState('connecting')
    setError(null)

    try {
      const res = await fetch('/api/apply/extension-token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Could not create connection')
      }

      const payload = {
        type: 'CAREEROS_CONNECT',
        token: data.token,
        baseUrl: window.location.origin,
        userEmail: data.userEmail,
        userName: data.userName,
      }

      const viaChromeApi = await new Promise<boolean>((resolve) => {
        if (typeof window.chrome === 'undefined' || !window.chrome.runtime?.sendMessage) {
          resolve(false)
          return
        }
        window.chrome.runtime.sendMessage(extensionId, payload, (response) => {
          if (window.chrome?.runtime?.lastError) {
            resolve(false)
            return
          }
          resolve(!!response?.ok)
        })
      })

      if (viaChromeApi) {
        setState('success')
        setTimeout(() => window.close(), 1500)
        return
      }

      /** Fallback: content script on CareerOS receives token via postMessage. */
      window.postMessage(
        {
          type: 'CAREEROS_EXTENSION_CONNECT',
          token: payload.token,
          baseUrl: payload.baseUrl,
          userEmail: payload.userEmail,
          userName: payload.userName,
        },
        '*'
      )
      setState('success')
      setTimeout(() => window.close(), 2000)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [extensionId])

  useEffect(() => {
    if (status === 'loading') {
      setState('loading')
      return
    }
    if (status === 'unauthenticated') {
      setState('needs_login')
      return
    }
    setState('ready')
    if (extensionId) {
      void connectExtension()
    }
  }, [status, extensionId, connectExtension])

  const callbackUrl = extensionId
    ? `/extension/connect?extensionId=${encodeURIComponent(extensionId)}`
    : '/extension/connect'

  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto h-12 w-12 rounded-xl bg-primary-100 grid place-items-center text-primary-700 font-bold text-lg">
        C
      </div>
      <h1 className="text-h3 font-semibold text-gray-900">Connect CareerOS Autofill</h1>

      {state === 'loading' && (
        <p className="text-body-sm text-gray-600 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Checking your session…
        </p>
      )}

      {state === 'needs_login' && (
        <>
          <p className="text-body-sm text-gray-600">
            Sign in to CareerOS once. Your extension stays connected — no tokens to copy.
          </p>
          <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
            <Button fullWidth>Sign in to connect</Button>
          </Link>
        </>
      )}

      {state === 'ready' && !extensionId && (
        <>
          <p className="text-body-sm text-gray-600">
            Click the CareerOS extension icon in your browser toolbar, then choose <strong>Connect to CareerOS</strong>.
          </p>
          <p className="text-caption text-gray-500">That opens this page with the right link automatically.</p>
        </>
      )}

      {state === 'connecting' && (
        <p className="text-body-sm text-gray-600 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Linking your account…
        </p>
      )}

      {state === 'success' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-body-sm text-green-900">
          Connected! You can close this tab and use <strong>Autofill</strong> on any job application.
        </div>
      )}

      {state === 'error' && (
        <>
          <p className="text-body-sm text-red-700">{error}</p>
          {extensionId && status === 'authenticated' && (
            <Button onClick={() => void connectExtension()} fullWidth>
              Try again
            </Button>
          )}
        </>
      )}
    </div>
  )
}
