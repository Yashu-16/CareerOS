import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Standard API error response factory. Every API route returns errors
 * in this consistent shape: { error: true, code, message, details? }.
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { error: true, code, message, ...(details ? { details } : {}) },
    { status }
  )
}

export const ApiErrors = {
  unauthorized: () =>
    errorResponse('UNAUTHORIZED', 'You must be signed in to do that.', 401),
  invalidCredentials: () =>
    errorResponse('INVALID_CREDENTIALS', 'Incorrect email or password.', 401),
  emailNotVerified: () =>
    errorResponse('EMAIL_NOT_VERIFIED', 'Please verify your email before signing in.', 401),
  tokenExpired: () =>
    errorResponse('TOKEN_EXPIRED', 'This link has expired. Please request a new one.', 401),
  forbidden: () =>
    errorResponse('FORBIDDEN', 'You do not have permission to do that.', 403),
  validation: (details?: unknown) =>
    errorResponse('VALIDATION_ERROR', 'Some of the information you entered is invalid.', 400, details),
  notFound: (what = 'Resource') =>
    errorResponse('NOT_FOUND', `${what} not found.`, 404),
  fileTooLarge: () =>
    errorResponse('FILE_TOO_LARGE', 'Your file exceeds the 5MB limit.', 413),
  invalidFileType: () =>
    errorResponse('INVALID_FILE_TYPE', 'Only PDF and DOCX files are accepted.', 415),
  rateLimited: () =>
    NextResponse.json(
      { error: true, code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    ),
  database: () =>
    errorResponse('DATABASE_ERROR', 'Something went wrong on our end. Please try again.', 500),
  externalDown: () =>
    errorResponse('EXTERNAL_SERVICE_DOWN', 'A third-party service is temporarily unavailable.', 503),
  storageUnavailable: (message: string) =>
    errorResponse('STORAGE_UNAVAILABLE', message, 503),
  aiUnavailable: () =>
    errorResponse('AI_SERVICE_UNAVAILABLE', 'The AI service is temporarily unavailable.', 503),
}

/**
 * Record a security-relevant event to the audit_logs table. Never throws.
 */
export async function auditLog(params: {
  userId?: string | null
  action: string
  resource: string
  details?: unknown
  ip?: string
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        details: params.details ? (params.details as object) : undefined,
        ip: params.ip,
      },
    })
  } catch (err) {
    console.error('[AUDIT_LOG] failed to write:', err)
  }
}
