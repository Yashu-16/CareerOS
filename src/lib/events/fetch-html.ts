const UA = 'CareerOS/1.0 (+https://careeros.in)'

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`${url} returned ${res.status}`)
  return res.text()
}

/** Parse embedded Next.js payload from an HTML page. */
export async function fetchNextData(url: string): Promise<any> {
  const html = await fetchHtml(url)
  const match = html.match(/__NEXT_DATA__[^>]*>([^<]+)/)
  if (!match) throw new Error(`No __NEXT_DATA__ at ${url}`)
  return JSON.parse(match[1])
}

export function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
