import { formatDistanceToNow } from 'date-fns'

const IST = 'Asia/Kolkata'

export function formatSalary(min?: number | null, max?: number | null, currency = 'INR'): string | null {
  if (!min && !max) return null
  const symbol = currency === 'INR' ? '₹' : currency + ' '
  const fmt = (n: number) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`
    if (n >= 100000) return `${(n / 100000).toFixed(1)} L`
    if (n >= 1000) return `${Math.round(n / 1000)}K`
    return String(n)
  }
  if (min && max) return `${symbol}${fmt(min)} – ${symbol}${fmt(max)}`
  return `${symbol}${fmt((min || max)!)}`
}

export function timeAgo(date: Date | string): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return ''
  }
}

/** Exact posted time in IST for job cards (e.g. "18 Jun 2026, 2:30 pm IST"). */
export function formatExactIst(date: Date | string): string {
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: IST,
      timeZoneName: 'short',
    })
  } catch {
    return ''
  }
}

/** Clear posted label: relative + exact IST timestamp. */
export function formatJobPostedAt(postedAt: Date | string, scrapedAt?: Date | string | null): string {
  const relative = timeAgo(postedAt)
  const exact = formatExactIst(postedAt)
  if (!exact) return relative ? `Posted ${relative}` : 'Posted recently'
  const verified =
    scrapedAt && new Date(scrapedAt).getTime() > Date.now() - 48 * 60 * 60 * 1000
      ? ' · Verified today'
      : ''
  return `Posted ${relative} · ${exact}${verified}`
}

/** When the job catalog was last scraped (max scrapedAt across active jobs). */
export function formatCatalogUpdatedAt(date: Date | string | null | undefined): string | null {
  if (!date) return null
  try {
    const d = new Date(date)
    return `Last updated ${timeAgo(d)} (${formatExactIst(d)})`
  } catch {
    return null
  }
}

/** Human-readable range for event cards. */
export function formatEventDate(start: Date | string, end?: Date | string | null): string {
  const s = new Date(start)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = s.toLocaleDateString('en-IN', opts)
  if (!end) return startStr
  const e = new Date(end)
  if (Number.isNaN(e.getTime())) return startStr
  if (s.toDateString() === e.toDateString()) return startStr
  return `${startStr} – ${e.toLocaleDateString('en-IN', opts)}`
}
