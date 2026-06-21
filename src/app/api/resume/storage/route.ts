import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getAwsRegion, getS3BucketName } from '@/lib/aws-config'
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
    bucket: mode === 's3' ? getS3BucketName() : null,
    region: mode === 's3' ? getAwsRegion() : null,
  })
}
