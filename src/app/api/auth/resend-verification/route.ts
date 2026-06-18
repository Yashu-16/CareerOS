import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendVerificationEmail } from '@/lib/sendgrid'
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

    const token = randomBytes(32).toString('hex')
    await redis.set(`email-verify:${token}`, user.id, { ex: 86400 })
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`
    await sendVerificationEmail(user.email, user.name, url)

    return NextResponse.json(GENERIC)
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[RESEND_VERIFICATION]', error)
    return ApiErrors.database()
  }
}
