import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  getAwsAccessKeyId,
  getAwsRegion,
  getAwsSecretAccessKey,
  getS3BucketName,
} from '@/lib/aws-config'

let s3: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: getAwsRegion(),
      credentials: {
        accessKeyId: getAwsAccessKeyId()!,
        secretAccessKey: getAwsSecretAccessKey()!,
      },
    })
  }
  return s3
}

function getBucket(): string {
  const bucket = getS3BucketName()
  if (!bucket) throw new Error('S3 bucket is not configured')
  return bucket
}

/**
 * Generate a presigned PUT URL so the browser can upload a resume directly to S3.
 * The object is private; downloads always use short-lived presigned GET URLs.
 */
export async function generateUploadUrl(userId: string, filename: string, mimeType: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `resumes/${userId}/${Date.now()}_${safeName}`
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: mimeType,
  })
  const url = await getSignedUrl(getS3Client(), command, { expiresIn: 300 }) // 5 min
  return { url, key }
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key })
  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 }) // 1 hour
}
