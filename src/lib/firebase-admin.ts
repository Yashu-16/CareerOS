import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let app: App | null = null

function getApp(): App | null {
  if (app) return app
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FIREBASE] Admin credentials missing — push notifications disabled.')
    return null
  }

  app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
  return app
}

/**
 * Send a push notification to a single device. Fails gracefully if Firebase
 * isn't configured so core features keep working.
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const initialized = getApp()
  if (!initialized) return
  try {
    await getMessaging(initialized).send({
      token: fcmToken,
      notification: { title, body },
      data,
    })
  } catch (err) {
    console.error('[FIREBASE] Push send failed:', err)
  }
}
