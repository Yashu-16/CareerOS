import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'

const schema = z.object({ fcmToken: z.string().min(10) })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()
  try {
    const { fcmToken } = schema.parse(await req.json())
    await prisma.user.update({ where: { id: user.id }, data: { fcmToken } })
    return NextResponse.json({ message: 'Token saved.' })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    return ApiErrors.database()
  }
}
