const memory = new Map<string, { data: unknown; at: number }>()

function storageKey(key: string) {
  return `careeros:cache:${key}`
}

export function readClientCache<T>(key: string, maxAgeMs: number): T | null {
  const now = Date.now()
  const mem = memory.get(key)
  if (mem && now - mem.at < maxAgeMs) return mem.data as T

  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(storageKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: T; at: number }
    if (now - parsed.at > maxAgeMs) return null
    memory.set(key, parsed)
    return parsed.data
  } catch {
    return null
  }
}

export function writeClientCache<T>(key: string, data: T) {
  const entry = { data, at: Date.now() }
  memory.set(key, entry)
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry))
  } catch {
    /* quota */
  }
}
