/**
 * Test verification email. Usage: npm run test:email -- you@gmail.com
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: resolve(root, '.env.local') })

const to = process.argv[2]
if (!to) {
  console.error('Usage: npm run test:email -- <recipient-email>')
  process.exit(1)
}

const resendKey = process.env.RESEND_API_KEY?.trim()
const sendgridKey = process.env.SENDGRID_API_KEY?.trim()
const from =
  process.env.EMAIL_FROM?.trim() ||
  process.env.SENDGRID_FROM_EMAIL?.trim() ||
  process.env.RESEND_FROM_EMAIL?.trim() ||
  'noreply@careeros.in'

console.log('Recipient:', to)
console.log('From:', from)
console.log('Resend configured:', Boolean(resendKey))
console.log('SendGrid configured:', Boolean(sendgridKey))

if (!resendKey && !sendgridKey) {
  console.error('\nNo email provider configured.')
  console.error('Add RESEND_API_KEY (recommended) or SENDGRID_API_KEY to .env.local')
  process.exit(1)
}

const testUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=test`
const html = `<p>CareerOS test — <a href="${testUrl}">Verify link</a></p>`
const text = `CareerOS test: ${testUrl}`

async function tryResend() {
  if (!resendKey) return false
  console.log('\nTrying Resend...')
  const { Resend } = await import('resend')
  const resend = new Resend(resendKey)
  const { data, error } = await resend.emails.send({
    from: from.includes('<') ? from : `CareerOS India <${from}>`,
    to,
    subject: 'CareerOS — verification email test (Resend)',
    html,
    text,
  })
  if (error) {
    console.error('Resend FAILED:', error.message)
    return false
  }
  console.log('Resend SUCCESS — id:', data?.id)
  return true
}

async function trySendGrid() {
  if (!sendgridKey) return false
  console.log('\nTrying SendGrid...')
  const sgMail = (await import('@sendgrid/mail')).default
  sgMail.setApiKey(sendgridKey)
  try {
    const [res] = await sgMail.send({
      to,
      from: from.includes('<') ? from : from,
      subject: 'CareerOS — verification email test (SendGrid)',
      html,
      text,
    })
    console.log('SendGrid SUCCESS — status', res.statusCode)
    return true
  } catch (err) {
    const errors = err?.response?.body?.errors
    console.error('SendGrid FAILED:')
    if (errors?.length) {
      for (const e of errors) console.error(' -', e.message)
      if (errors[0]?.message?.includes('verified')) {
        console.error('\nFix: In SendGrid → Settings → Sender Authentication, verify:', from)
        console.error('Or add RESEND_API_KEY to .env.local (easier setup at resend.com)')
      }
    } else {
      console.error(err.message || err)
    }
    return false
  }
}

let ok = false
if (resendKey) ok = await tryResend()
if (!ok && sendgridKey) ok = await trySendGrid()

if (ok) {
  console.log('\nCheck inbox and spam folder for:', to)
} else {
  process.exit(1)
}
