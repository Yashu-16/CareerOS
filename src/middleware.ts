import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Redirect logged-in users away from auth pages.
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Admin-only routes.
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
          '/',
          '/api/auth',
        ]
        if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))) {
          return true
        }
        // Public landing + auth API are open; everything else requires a token.
        if (pathname === '/') return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/|.*\\.png$|.*\\.svg$).*)'],
}
