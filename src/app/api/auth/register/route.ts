import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { EmailDeliveryError, sendVerificationEmail } from '@/lib/email'
import { getAppBaseUrlFromRequest } from '@/lib/app-url'
import { storeAuthToken, logDevAuthLink } from '@/lib/auth-tokens'
import { ApiErrors, auditLog } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  name: z.string().min(2).max(100),
})

const GENERIC_EXISTING =
  'If this email is not registered, you will receive a verification link shortly.'

async function deliverVerificationEmail(
  req: NextRequest,
  user: { id: string; email: string; name: string | null },
  ip: string
) {
  const token = await storeAuthToken('email-verify', user.id, 86400)
  const verificationUrl = `${getAppBaseUrlFromRequest(req)}/verify-email?token=${token}`
  logDevAuthLink('Email verification link', verificationUrl)

  try {
    await sendVerificationEmail(user.email, user.name, verificationUrl)
    return { ok: true as const, message: 'Verification email sent.', emailSent: true }
  } catch (err) {
    console.error('[REGISTER] verification email failed:', err)
    await auditLog({ userId: user.id, action: 'REGISTER_EMAIL_FAILED', resource: 'user', ip })
    const message =
      err instanceof EmailDeliveryError
        ? err.message
        : 'We could not send the verification email. Please try resending from the sign-up page.'
    return {
      ok: false as const,
      message,
      emailSent: false,
      code: err instanceof EmailDeliveryError ? err.code : 'EMAIL_NOT_SENT',
      status: err instanceof EmailDeliveryError && err.code === 'NOT_CONFIGURED' ? 503 : 502,
    }
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const allowed = await rateLimit(`register:${ip}`, 5, 600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    const body = await req.json()
    const { email, password, name } = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Re-send verification if they signed up before but never verified.
      if (!existing.emailVerified) {
        const result = await deliverVerificationEmail(req, existing, ip)
        if (result.ok) {
          return NextResponse.json({ message: result.message, emailSent: true })
        }
        return NextResponse.json(
          { message: result.message, emailSent: false, code: result.code },
          { status: result.status }
        )
      }
      return NextResponse.json({ message: GENERIC_EXISTING, emailSent: true })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })

    const result = await deliverVerificationEmail(req, user, ip)
    if (!result.ok) {
      return NextResponse.json(
        { message: result.message, emailSent: false, code: result.code },
        { status: result.status }
      )
    }

    await auditLog({ userId: user.id, action: 'REGISTER', resource: 'user', ip })
    return NextResponse.json({ message: result.message, emailSent: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error.errors)
    }
    console.error('[REGISTER]', error)
    return ApiErrors.database()
  }
}
