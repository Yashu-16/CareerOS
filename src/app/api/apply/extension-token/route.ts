import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { createExtensionToken, revokeExtensionTokens } from '@/lib/extension-token'
import { ApiErrors } from '@/lib/errors'

/** Generate a token for the CareerOS Autofill Chrome extension. */
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const { token, expiresAt } = await createExtensionToken(user.id)
  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    userEmail: user.email,
    userName: user.name,
    instructions: 'Your extension will receive this automatically after you sign in on the connect page.',
  })
}

/** Revoke all extension tokens for the current user. */
export async function DELETE() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const count = await revokeExtensionTokens(user.id)
  return NextResponse.json({ revoked: count })
}
