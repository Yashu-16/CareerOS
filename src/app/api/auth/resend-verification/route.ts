import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { storeAuthToken, logDevAuthLink } from '@/lib/auth-tokens'
import { EmailDeliveryError, sendVerificationEmail } from '@/lib/email'
import { getAppBaseUrlFromRequest } from '@/lib/app-url'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })
const GENERIC = {
  message: 'If an unverified account exists for this email, a new link has been sent.',
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  try {
    const { email } = schema.parse(await req.json())

    // 1 resend per 2 minutes per email.
    const allowed = await rateLimit(`resend:${email}`, 1, 120)
    if (!allowed) return ApiErrors.rateLimited()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.emailVerified) return NextResponse.json(GENERIC)

    const token = await storeAuthToken('email-verify', user.id, 86400)
    const url = `${getAppBaseUrlFromRequest(req)}/verify-email?token=${token}`
    logDevAuthLink('Email verification link', url)

    try {
      await sendVerificationEmail(user.email, user.name, url)
    } catch (err) {
      console.error('[RESEND_VERIFICATION] email failed:', err)
      const message =
        err instanceof EmailDeliveryError ? err.message : 'Could not send verification email.'
      return NextResponse.json({ message, emailSent: false }, { status: 502 })
    }

    return NextResponse.json({ ...GENERIC, emailSent: true })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[RESEND_VERIFICATION]', error)
    return ApiErrors.database()
  }
}
