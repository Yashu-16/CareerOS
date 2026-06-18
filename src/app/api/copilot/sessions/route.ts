import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { clamp } from '@/lib/sanitize'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })
  return NextResponse.json({ sessions })
}

const schema = z.object({ title: z.string().max(120).optional() })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()
  try {
    const { title } = schema.parse(await req.json().catch(() => ({})))
    const session = await prisma.chatSession.create({
      data: { userId: user.id, title: title ? clamp(title, 120) : 'New conversation' },
    })
    return NextResponse.json({ session })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    return ApiErrors.database()
  }
}
