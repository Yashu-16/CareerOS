import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const UPLOAD_ROOT = path.join(process.cwd(), '.uploads')

let s3Client: S3Client | null = null

export class ResumeStorageError extends Error {
  constructor(
    message: string,
    public readonly code: 'S3_NOT_CONFIGURED' | 'S3_DENIED' | 'S3_FAILED' | 'LOCAL_FAILED' = 'S3_FAILED'
  ) {
    super(message)
    this.name = 'ResumeStorageError'
  }
}

function isServerless(): boolean {
  return Boolean(
    process.env.NETLIFY ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  )
}

function localUploadRoot(): string {
  if (isServerless()) return path.join(os.tmpdir(), 'careeros-uploads')
  return UPLOAD_ROOT
}

/** True when real AWS credentials are set (not empty placeholders). */
export function isS3Configured(): boolean {
  if (process.env.RESUME_STORAGE === 'local') return false
  const key = process.env.AWS_ACCESS_KEY_ID?.trim()
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.S3_BUCKET_NAME?.trim()
  return Boolean(key && secret && bucket)
}

export function getResumeStorageMode(): 's3' | 'local' {
  return isS3Configured() ? 's3' : 'local'
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
  return path.join(localUploadRoot(), key)
}

export class ResumeFileNotFoundError extends Error {
  readonly key: string
  constructor(key: string) {
    super('RESUME_FILE_NOT_FOUND')
    this.name = 'ResumeFileNotFoundError'
    this.key = key
  }
}

/** Check whether a resume file exists locally or on S3. */
export async function resumeFileExists(key: string): Promise<boolean> {
  try {
    await fs.access(localPath(key))
    return true
  } catch {
    /* try S3 */
  }
  if (!isS3Configured()) return false
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key })
    )
    return Boolean(res.Body)
  } catch {
    return false
  }
}

export function buildResumeKey(userId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `resumes/${userId}/${Date.now()}_${safeName}`
}

/** Store a resume file on S3 (production) or local disk (dev only). */
export async function uploadResume(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<'s3' | 'local'> {
  if (isS3Configured()) {
    try {
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      )
      return 's3'
    } catch (err) {
      console.error('[S3_UPLOAD]', err)
      const name = (err as { name?: string }).name
      if (name === 'AccessDenied' || name === 'InvalidAccessKeyId') {
        const msg =
          'Could not upload to S3. The IAM user needs s3:PutObject and s3:GetObject on your bucket. ' +
          'Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME in your deployment env vars.'
        if (isServerless()) {
          throw new ResumeStorageError(msg, 'S3_DENIED')
        }
        console.warn('[S3_UPLOAD] Falling back to local disk for dev.')
      } else {
        throw new ResumeStorageError(
          'Could not upload resume to cloud storage. Please try again shortly.',
          'S3_FAILED'
        )
      }
    }
  } else if (isServerless()) {
    throw new ResumeStorageError(
      'Resume upload requires AWS S3 in production. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ' +
        'AWS_REGION, and S3_BUCKET_NAME in Netlify (or your host) environment variables.',
      'S3_NOT_CONFIGURED'
    )
  }

  try {
    const filePath = localPath(key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return 'local'
  } catch (err) {
    console.error('[LOCAL_UPLOAD]', err)
    throw new ResumeStorageError(
      'Could not save resume file. On production, configure AWS S3 storage.',
      'LOCAL_FAILED'
    )
  }
}

/** Read a resume file — checks local disk first, then S3. */
export async function getResumeBuffer(key: string): Promise<Buffer> {
  try {
    return await fs.readFile(localPath(key))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
  }

  if (!isS3Configured()) {
    throw new ResumeFileNotFoundError(key)
  }

  const res = await getS3Client().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME!, Key: key })
  )
  if (!res.Body) throw new ResumeFileNotFoundError(key)
  return Buffer.from(await res.Body.transformToByteArray())
}
