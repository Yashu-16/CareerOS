import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { buildAutofillProfile } from '@/lib/apply-autofill'
import { resolveExtensionToken } from '@/lib/extension-token'
import { ApiErrors } from '@/lib/errors'

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

/** Structured profile for the CareerOS Autofill extension. */
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin')
  const jobId = req.nextUrl.searchParams.get('jobId')

  let userId: string | null = null
  const extToken = req.headers.get('x-careeros-token')
  if (extToken) {
    userId = await resolveExtensionToken(extToken)
  } else {
    const user = await getCurrentUser()
    userId = user?.id || null
  }

  if (!userId) return ApiErrors.unauthorized()

  try {
    const profile = await buildAutofillProfile(userId, { jobId })
    return NextResponse.json(profile, { headers: corsHeaders(origin) })
  } catch (err) {
    console.error('[AUTOFILL_PROFILE]', err)
    return ApiErrors.database()
  }
}
