import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth-helpers'
import { generateUploadUrl } from '@/lib/s3'
import { ApiErrors } from '@/lib/errors'

const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 5 * 1024 * 1024

const schema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  fileSize: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const { filename, mimeType, fileSize } = schema.parse(await req.json())
    if (!ALLOWED.includes(mimeType)) return ApiErrors.invalidFileType()
    if (fileSize > MAX_SIZE) return ApiErrors.fileTooLarge()

    const { url, key } = await generateUploadUrl(user.id, filename, mimeType)
    return NextResponse.json({ url, key })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[UPLOAD_URL]', error)
    return ApiErrors.externalDown()
  }
}
