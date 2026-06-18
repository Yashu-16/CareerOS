import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { clamp } from '@/lib/sanitize'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      college: true,
      degree: true,
      graduationYear: true,
      city: true,
      targetRole: true,
      targetIndustry: true,
      experienceLevel: true,
      skills: true,
      bio: true,
      linkedinUrl: true,
      githubUrl: true,
      portfolioUrl: true,
      notifJobAlerts: true,
      notifInterviews: true,
      notifDigest: true,
    },
  })
  if (!profile) return ApiErrors.notFound('User')
  return NextResponse.json(profile)
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  college: z.string().max(200).optional().nullable(),
  degree: z.string().max(200).optional().nullable(),
  graduationYear: z.number().int().min(1990).max(2100).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  targetRole: z.string().max(160).optional().nullable(),
  targetIndustry: z.string().max(160).optional().nullable(),
  experienceLevel: z.enum(['FRESHER', 'ZERO_TO_TWO', 'TWO_TO_FIVE', 'FIVE_PLUS']).optional().nullable(),
  skills: z.array(z.string().max(60)).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
  githubUrl: z.string().url().optional().nullable().or(z.literal('')),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal('')),
  notifJobAlerts: z.boolean().optional(),
  notifInterviews: z.boolean().optional(),
  notifDigest: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const body = updateSchema.parse(await req.json())
    if (body.bio) body.bio = clamp(body.bio, 500)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: body,
    })
    return NextResponse.json({ message: 'Profile updated.', id: updated.id })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[USER_PROFILE_PATCH]', error)
    return ApiErrors.database()
  }
}
