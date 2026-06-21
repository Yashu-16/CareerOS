/**
 * AWS S3 env vars. Netlify blocks standard AWS_* names in some setups,
 * so MY_* aliases are supported (see .env.example).
 */
export function getAwsAccessKeyId(): string | undefined {
  return process.env.MY_AWS_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim()
}

export function getAwsSecretAccessKey(): string | undefined {
  return (
    process.env.MY_AWS_SECRET_ACCESS_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim()
  )
}

export function getAwsRegion(): string {
  return (
    process.env.MY_AWS_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    'ap-south-1'
  )
}

export function getS3BucketName(): string | undefined {
  return process.env.MY_S3_BUCKET_NAME?.trim() || process.env.S3_BUCKET_NAME?.trim()
}

/** True when real AWS credentials are set (not empty placeholders). */
export function isAwsS3Configured(): boolean {
  if (process.env.RESUME_STORAGE === 'local') return false
  return Boolean(getAwsAccessKeyId() && getAwsSecretAccessKey() && getS3BucketName())
}

export const AWS_ENV_HINT =
  'Set MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_AWS_REGION, and MY_S3_BUCKET_NAME ' +
  '(or the standard AWS_* / S3_BUCKET_NAME names) in your deployment env vars.'
