import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
if (apiKey) sgMail.setApiKey(apiKey)

const FROM = process.env.SENDGRID_FROM_EMAIL || 'noreply@careeros.in'

async function send(msg: sgMail.MailDataRequired) {
  if (!apiKey) {
    // Graceful degradation in local/dev when SendGrid isn't configured.
    console.warn('[SENDGRID] API key missing — email not sent:', msg.subject || msg.templateId)
    return
  }
  await sgMail.send(msg)
}

export async function sendVerificationEmail(to: string, name: string | null, url: string) {
  const templateId = process.env.SENDGRID_VERIFICATION_TEMPLATE_ID
  if (templateId) {
    await send({
      to,
      from: FROM,
      templateId,
      dynamicTemplateData: { name: name || 'there', verificationUrl: url },
    } as sgMail.MailDataRequired)
    return
  }
  await send({
    to,
    from: FROM,
    subject: 'Verify your CareerOS India account',
    html: `<p>Hi ${name || 'there'},</p>
      <p>Welcome to CareerOS India! Please verify your email by clicking the link below:</p>
      <p><a href="${url}">Verify my email</a></p>
      <p>This link expires in 24 hours.</p>`,
  })
}

export async function sendOtpEmail(to: string, name: string | null, otp: string) {
  const templateId = process.env.SENDGRID_OTP_TEMPLATE_ID
  if (templateId) {
    await send({
      to,
      from: FROM,
      templateId,
      dynamicTemplateData: { name: name || 'there', otp },
    } as sgMail.MailDataRequired)
    return
  }
  await send({
    to,
    from: FROM,
    subject: 'Your CareerOS India verification code',
    html: `<p>Hi ${name || 'there'},</p>
      <p>Your one-time code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  })
}

export async function sendPasswordResetEmail(to: string, name: string | null, url: string) {
  await send({
    to,
    from: FROM,
    subject: 'Reset your CareerOS India password',
    html: `<p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click below to choose a new one:</p>
      <p><a href="${url}">Reset password</a></p>
      <p>If you didn't request this, you can safely ignore this email. The link expires in 1 hour.</p>`,
  })
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const templateId = process.env.SENDGRID_WELCOME_TEMPLATE_ID
  if (templateId) {
    await send({
      to,
      from: FROM,
      templateId,
      dynamicTemplateData: { name: name || 'there' },
    } as sgMail.MailDataRequired)
    return
  }
  await send({
    to,
    from: FROM,
    subject: 'Welcome to CareerOS India 🎉',
    html: `<p>Hi ${name || 'there'},</p>
      <p>Your email is verified and your account is ready. Let's get you hired faster!</p>`,
  })
}
