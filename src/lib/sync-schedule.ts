/** Daily catalog refresh: 12:00 PM India Standard Time (UTC+5:30). */
export const DAILY_SYNC_HOUR_IST = 12
export const DAILY_SYNC_TIMEZONE = 'Asia/Kolkata'

/** Vercel Cron uses UTC — 12:00 IST = 06:30 UTC. */
export const DAILY_SYNC_CRON_UTC = '30 6 * * *'

export function formatDailySyncLabel(): string {
  return `Every day at ${DAILY_SYNC_HOUR_IST}:00 PM IST`
}
