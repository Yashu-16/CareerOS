'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readClientCache, writeClientCache } from '@/lib/client-fetch-cache'

/** Fetch JSON with sessionStorage + memory cache for fast tab switching. */
export function useCachedFetch<T>(
  cacheKey: string,
  url: string,
  opts?: { maxAgeMs?: number; enabled?: boolean }
) {
  const maxAgeMs = opts?.maxAgeMs ?? 90_000
  const enabled = opts?.enabled ?? true
  const cached = enabled ? readClientCache<T>(cacheKey, maxAgeMs) : null
  const [data, setData] = useState<T | null>(cached)
  const [loading, setLoading] = useState(enabled && !cached)
  const [error, setError] = useState<string | null>(null)
  const urlRef = useRef(url)

  const reload = useCallback(
    async (background = false) => {
      if (!enabled) return
      if (!background && !data) setLoading(true)
      setError(null)
      try {
        const res = await fetch(urlRef.current)
        const json = (await res.json()) as T
        if (!res.ok) throw new Error((json as { message?: string }).message || 'Request failed')
        writeClientCache(cacheKey, json)
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Request failed')
        if (!data) setData(null)
      } finally {
        setLoading(false)
      }
    },
    [cacheKey, data, enabled]
  )

  useEffect(() => {
    urlRef.current = url
    if (!enabled) return
    const stale = readClientCache<T>(cacheKey, maxAgeMs)
    if (stale) {
      setData(stale)
      setLoading(false)
      void reload(true)
    } else {
      void reload(false)
    }
  }, [cacheKey, url, enabled, maxAgeMs]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload, setData }
}
