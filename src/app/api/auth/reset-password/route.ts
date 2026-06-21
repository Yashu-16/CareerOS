import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { consumeAuthToken } from '@/lib/auth-tokens'
import { ApiErrors, auditLog } from '@/lib/errors'

const schema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
})

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())

    const userId = await consumeAuthToken('pw-reset', token)
    if (!userId) return ApiErrors.tokenExpired()

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    await auditLog({ userId, action: 'PASSWORD_RESET', resource: 'user' })

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[RESET_PASSWORD]', error)
    return ApiErrors.database()
  }
}
