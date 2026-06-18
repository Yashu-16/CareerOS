import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendPasswordResetEmail } from '@/lib/sendgrid'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({ email: z.string().email() })
const GENERIC = { message: 'If an account exists for this email, a reset link has been sent.' }

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  try {
    const { email } = schema.parse(await req.json())

    const allowed = await rateLimit(`forgot:${email}`, 1, 120)
    if (!allowed) return ApiErrors.rateLimited()

    const user = await prisma.user.findFirst({ where: { email, deletedAt: null } })
    if (!user || !user.password) return NextResponse.json(GENERIC)

    const token = randomBytes(32).toString('hex')
    await redis.set(`pw-reset:${token}`, user.id, { ex: 3600 })
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(user.email, user.name, url)

    return NextResponse.json(GENERIC)
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[FORGOT_PASSWORD]', error)
    return ApiErrors.database()
  }
}
