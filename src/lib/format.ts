import { formatDistanceToNow } from 'date-fns'

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
