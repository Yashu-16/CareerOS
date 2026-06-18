import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { clamp } from '@/lib/sanitize'

const patchSchema = z.object({
  status: z
    .enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .optional(),
  notes: z.string().max(5000).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const body = patchSchema.parse(await req.json())

    // Enforce ownership before updating.
    const existing = await prisma.application.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!existing) return ApiErrors.notFound('Application')

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: clamp(body.notes, 5000) } : {}),
      },
    })
    return NextResponse.json({ application: updated })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[APPLICATION_PATCH]', error)
    return ApiErrors.database()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const existing = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!existing) return ApiErrors.notFound('Application')

  await prisma.application.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
