import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getResumeStorageMode, isS3Configured } from '@/lib/resume-storage'
import { ApiErrors } from '@/lib/errors'

/** Report whether resume files are stored on S3 or local disk. */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const mode = getResumeStorageMode()
  return NextResponse.json({
    mode,
    s3Configured: isS3Configured(),
    bucket: mode === 's3' ? process.env.S3_BUCKET_NAME : null,
    region: mode === 's3' ? process.env.AWS_REGION || 'ap-south-1' : null,
  })
}
