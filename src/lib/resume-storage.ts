import fs from 'fs/promises'
import path from 'path'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const UPLOAD_ROOT = path.join(process.cwd(), '.uploads')

let s3Client: S3Client | null = null

/** True when real AWS credentials are set (not empty placeholders). */
export function isS3Configured(): boolean {
  if (process.env.RESUME_STORAGE === 'local') return false
  const key = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.S3_BUCKET_NAME?.trim()
  return Boolean(key && secret && bucket)
}

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
      },
    })
  }
  return s3Client
}

function localPath(key: string): string {
  return path.join(UPLOAD_ROOT, key)
}

export function buildResumeKey(userId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `resumes/${userId}/${Date.now()}_${safeName}`
}

/** Store a resume file on S3 (production) or local disk (dev / missing AWS creds). */
export async function uploadResume(key: string, buffer: Buffer, mimeType: string): Promise<void> {
  if (isS3Configured()) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )
    return
  }

  const filePath = localPath(key)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, buffer)
}

/** Read a resume file — checks local disk first, then S3. */
export async function getResumeBuffer(key: string): Promise<Buffer> {
  try {
    return await fs.readFile(localPath(key))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }

  if (!isS3Configured()) {
    throw new Error(`Resume file not found: ${key}`)
  }

  const res = await getS3Client().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key })
  )
  if (!res.Body) throw new Error(`Empty S3 object: ${key}`)
  return Buffer.from(await res.Body.transformToByteArray())
}
