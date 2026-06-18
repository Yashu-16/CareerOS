import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.S3_BUCKET_NAME!

/**
 * Generate a presigned PUT URL so the browser can upload a resume directly to S3.
 * The object is private; downloads always use short-lived presigned GET URLs.
 */
export async function generateUploadUrl(userId: string, filename: string, mimeType: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `resumes/${userId}/${Date.now()}_${safeName}`
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 min
  return { url, key }
}

export async function generateDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 hour
}
