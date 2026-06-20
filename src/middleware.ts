import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl

    // Admin-only routes.
    const token = req.nextauth.token
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.json({ error: true, code: 'FORBIDDEN' }, { status: 403 })
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        const publicPaths = [
          '/login',
          '/signup',
          '/verify-email',
          '/forgot-password',
          '/reset-password',
          '/extension/connect',
          '/',
          '/api/auth',
        ]
        if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
          return true
        }
        if (pathname === '/') return true
        return !!token?.id
      },
    },
  }
)

export const config = {
  // `/api/cron` is intentionally excluded: those routes authenticate via a
  // CRON_SECRET bearer token (used by Vercel Cron), not a NextAuth session.
  matcher: ['/((?!api/cron|_next/static|_next/image|favicon.ico|public/|.*\\.png$|.*\\.svg$).*)'],
}
