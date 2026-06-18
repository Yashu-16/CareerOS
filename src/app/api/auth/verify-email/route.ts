import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { sendWelcomeEmail } from '@/lib/sendgrid'
import { ApiErrors, auditLog } from '@/lib/errors'

const schema = z.object({ token: z.string().min(10) })

export async function POST(req: NextRequest) {
  try {
    const { token } = schema.parse(await req.json())

    const userId = await redis.get<string>(`email-verify:${token}`)
    if (!userId) return ApiErrors.tokenExpired()

    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    })
    await redis.del(`email-verify:${token}`)

    await sendWelcomeEmail(user.email, user.name)
    await auditLog({ userId, action: 'EMAIL_VERIFIED', resource: 'user' })

    return NextResponse.json({ message: 'Email verified successfully.' })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[VERIFY_EMAIL]', error)
    return ApiErrors.database()
  }
}
