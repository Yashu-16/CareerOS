import type { NextRequest } from 'next/server'

/** Resolve the public app URL for links in emails (Netlify, Vercel, Amplify, local). */
export function getAppBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]

  for (const raw of candidates) {
    const url = raw?.trim().replace(/\/$/, '')
    if (url && url.startsWith('http')) return url
  }

  return 'http://localhost:3000'
}

/** Prefer the incoming request host on server routes (correct on Netlify preview + prod). */
export function getAppBaseUrlFromRequest(req?: NextRequest): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, '')
    }
  }
  return getAppBaseUrl()
}
