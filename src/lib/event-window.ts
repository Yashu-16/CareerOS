/** IST = UTC+5:30 — India-focused event windows. */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function toIstCalendar(d: Date): { y: number; m: number; day: number } {
  const ist = new Date(d.getTime() + IST_OFFSET_MS)
  return { y: ist.getUTCFullYear(), m: ist.getUTCMonth(), day: ist.getUTCDate() }
}

/** Start of today 00:00 IST (excludes yesterday's listings). */
export function startOfTodayIST(now = new Date()): Date {
  const { y, m, day } = toIstCalendar(now)
  return new Date(Date.UTC(y, m, day, 0, 0, 0, 0) - IST_OFFSET_MS)
}

/** End of calendar day `daysFromToday` ahead in IST (inclusive). */
export function endOfIstDay(daysFromToday: number, now = new Date()): Date {
  const start = startOfTodayIST(now)
  return new Date(start.getTime() + (daysFromToday + 1) * 24 * 60 * 60 * 1000 - 1)
}

/**
 * Near-term event window: today through the next 2 calendar days (IST).
 * Keeps the feed actionable and real-time for launch.
 */
export function eventDisplayWindow(now = new Date()) {
  return {
    windowStart: startOfTodayIST(now),
    windowEnd: endOfIstDay(2, now),
  }
}

export function isInEventDisplayWindow(event: {
  startsAt: Date
  endsAt: Date | null
}): boolean {
  const now = Date.now()
  if (event.endsAt && event.endsAt.getTime() < now) return false
  if (!event.endsAt && event.startsAt.getTime() < now) return false

  const { windowStart, windowEnd } = eventDisplayWindow()
  const anchor = event.startsAt
  return anchor.getTime() >= windowStart.getTime() && anchor.getTime() <= windowEnd.getTime()
}
