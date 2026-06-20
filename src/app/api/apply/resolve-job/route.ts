import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { resolveExtensionToken } from '@/lib/extension-token'
import { ApiErrors } from '@/lib/errors'
import {
  isAtsApplyUrl,
  parseTabTitle,
  resolveJobFromApplyUrl,
} from '@/lib/resolve-apply-url'

function corsHeaders(origin: string | null) {
  const allowed = origin && (origin.startsWith('chrome-extension://') || origin.includes('localhost'))
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-CareerOS-Token',
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

/** Resolve a CareerOS job from the ATS page URL open in the browser tab. */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const url = req.nextUrl.searchParams.get('url')
  const tabTitle = req.nextUrl.searchParams.get('tabTitle')
  const pageTitle = req.nextUrl.searchParams.get('pageTitle')
  const pageCompany = req.nextUrl.searchParams.get('pageCompany')

  if (!url) {
    return NextResponse.json({ error: true, message: 'url is required' }, { status: 400 })
  }

  let userId: string | null = null
  const extToken = req.headers.get('x-careeros-token')
  if (extToken) {
    userId = await resolveExtensionToken(extToken)
  } else {
    const user = await getCurrentUser()
    userId = user?.id || null
  }

  if (!userId) return ApiErrors.unauthorized()

  const isAtsPage = isAtsApplyUrl(url)
  const job = isAtsPage ? await resolveJobFromApplyUrl(url, userId) : null
  const pageHint = tabTitle ? parseTabTitle(tabTitle) : { title: null, company: null }
  const displayTitle = pageTitle || pageHint.title
  const displayCompany = pageCompany || pageHint.company

  return NextResponse.json(
    {
      isAtsPage,
      jobId: job?.id || null,
      job,
      pageOnly: job
        ? null
        : isAtsPage
          ? {
              title: displayTitle,
              company: displayCompany,
              applyUrl: url,
            }
          : null,
    },
    { headers: corsHeaders(origin) }
  )
}
