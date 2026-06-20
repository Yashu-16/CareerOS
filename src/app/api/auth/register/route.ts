import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/sendgrid'
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

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const allowed = await rateLimit(`register:${ip}`, 5, 600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    const body = await req.json()
    const { email, password, name } = schema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      // Same response either way to prevent email enumeration.
      return NextResponse.json({
        message: 'If this email is not registered, you will receive a verification link shortly.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    })

    const token = await storeAuthToken('email-verify', user.id, 86400)

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
    logDevAuthLink('Email verification link', verificationUrl)
    await sendVerificationEmail(email, name, verificationUrl)

    await auditLog({ userId: user.id, action: 'REGISTER', resource: 'user', ip })

    return NextResponse.json({ message: 'Verification email sent.' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error.errors)
    }
    console.error('[REGISTER]', error)
    return ApiErrors.database()
  }
}
