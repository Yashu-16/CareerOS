/**
 * Transactional email — Resend (preferred) or SendGrid fallback.
 * SendGrid requires a verified Sender Identity for SENDGRID_FROM_EMAIL.
 */

export class EmailDeliveryError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'SEND_FAILED' = 'SEND_FAILED'
  ) {
    super(message)
    this.name = 'EmailDeliveryError'
  }
}

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'CareerOS India <noreply@careeros.in>'
  )
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim())
}

export function getEmailConfigSummary(): {
  configured: boolean
  provider: 'resend' | 'sendgrid' | null
  from: string
} {
  const from = getFromAddress()
  if (process.env.RESEND_API_KEY?.trim()) {
    return { configured: true, provider: 'resend', from }
  }
  if (process.env.SENDGRID_API_KEY?.trim()) {
    return { configured: true, provider: 'sendgrid', from }
  }
  return { configured: false, provider: null, from }
}

function extractSendGridError(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const body = (err as { response?: { body?: { errors?: Array<{ message?: string }> } } }).response?.body
    const msgs = body?.errors?.map((e) => e.message).filter(Boolean)
    if (msgs?.length) return msgs.join('; ')
  }
  return err instanceof Error ? err.message : 'SendGrid send failed'
}

async function sendViaResend(payload: EmailPayload): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) throw new EmailDeliveryError('Resend not configured', 'NOT_CONFIGURED')

  const { Resend } = await import('resend')
  const resend = new Resend(key)
  const from = getFromAddress()

  const { data, error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })

  if (error) {
    console.error('[EMAIL][Resend] send failed:', error)
    throw new EmailDeliveryError(error.message || 'Resend send failed', 'SEND_FAILED')
  }

  console.log('[EMAIL][Resend] sent id=', data?.id)
}

async function sendViaSendGrid(payload: EmailPayload): Promise<void> {
  const key = process.env.SENDGRID_API_KEY?.trim()
  if (!key) throw new EmailDeliveryError('SendGrid not configured', 'NOT_CONFIGURED')

  const sgMail = (await import('@sendgrid/mail')).default
  sgMail.setApiKey(key)

  const from = getFromAddress()

  try {
    await sgMail.send({
      to: payload.to,
      from,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })
    console.log('[EMAIL][SendGrid] sent to', payload.to)
  } catch (err) {
    const detail = extractSendGridError(err)
    console.error('[EMAIL][SendGrid] send failed:', detail)
    throw new EmailDeliveryError(
      detail.includes('verified') || detail.includes('Sender Identity')
        ? `Sender "${from}" is not verified in SendGrid. Verify it under Settings → Sender Authentication, or set EMAIL_FROM to a verified address.`
        : detail,
      'SEND_FAILED'
    )
  }
}

/** Send email using Resend first, then SendGrid. */
export async function sendTransactionalEmail(payload: EmailPayload): Promise<void> {
  if (!isEmailConfigured()) {
    const message =
      'Email is not configured. Set RESEND_API_KEY (recommended) or SENDGRID_API_KEY in environment variables.'
    if (process.env.NODE_ENV === 'production') {
      throw new EmailDeliveryError(message, 'NOT_CONFIGURED')
    }
    console.warn('[EMAIL] not configured — would send:', payload.subject, '→', payload.to)
    return
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      await sendViaResend(payload)
      return
    } catch (err) {
      if (!process.env.SENDGRID_API_KEY?.trim()) throw err
      console.warn('[EMAIL] Resend failed, trying SendGrid:', err)
    }
  }

  await sendViaSendGrid(payload)
}

function verificationHtml(name: string | null, url: string): string {
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px">
  <p>Hi ${name || 'there'},</p>
  <p>Welcome to <strong>CareerOS India</strong>! Tap the button below to verify your email and activate your account.</p>
  <p style="margin:24px 0">
    <a href="${url}" style="display:inline-block;background:#6be82c;color:#111;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:700">Verify my email</a>
  </p>
  <p style="font-size:14px;color:#555">Or paste this link in your browser:<br><a href="${url}">${url}</a></p>
  <p style="font-size:13px;color:#888">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
</body></html>`
}

export async function sendVerificationEmail(to: string, name: string | null, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: 'Verify your CareerOS India account',
    html: verificationHtml(name, url),
    text: `Hi ${name || 'there'},\n\nVerify your CareerOS account: ${url}\n\nThis link expires in 24 hours.`,
  })
}

export async function sendOtpEmail(to: string, name: string | null, otp: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: 'Your CareerOS India verification code',
    html: `<p>Hi ${name || 'there'},</p><p>Your one-time code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    text: `Your CareerOS verification code is ${otp}. It expires in 10 minutes.`,
  })
}

export async function sendPasswordResetEmail(to: string, name: string | null, url: string): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: 'Reset your CareerOS India password',
    html: `<p>Hi ${name || 'there'},</p>
      <p>Reset your password using this link:</p>
      <p><a href="${url}">${url}</a></p>
      <p>If you didn't request this, ignore this email. Link expires in 1 hour.</p>`,
    text: `Reset your password: ${url}`,
  })
}

export async function sendWelcomeEmail(to: string, name: string | null): Promise<void> {
  await sendTransactionalEmail({
    to,
    subject: 'Welcome to CareerOS India',
    html: `<p>Hi ${name || 'there'},</p><p>Your email is verified — your account is ready. Let's get you hired faster!</p>`,
    text: `Welcome to CareerOS India, ${name || 'there'}! Your account is ready.`,
  })
}

// Re-export for backwards compatibility
export { isEmailConfigured as isSendGridConfigured }
