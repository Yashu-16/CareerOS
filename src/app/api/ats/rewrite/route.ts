import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-helpers'
import { rewriteBulletPoint } from '@/lib/anthropic'
import { ApiErrors } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({
  original: z.string().min(3).max(2000),
  context: z.string().max(2000).default(''),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const allowed = await rateLimit(`rewrite:${user.id}`, 40, 3600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    const { original, context } = schema.parse(await req.json())
    const rewritten = await rewriteBulletPoint(original, context)
    return NextResponse.json({ rewritten })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[ATS_REWRITE]', error)
    return ApiErrors.aiUnavailable()
  }
}
