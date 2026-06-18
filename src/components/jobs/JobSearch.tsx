'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function JobSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  const [location, setLocation] = useState(params.get('location') || '')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params.toString())
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    if (location.trim()) next.set('location', location.trim())
    else next.delete('location')
    next.set('page', '1')
    router.push(`/jobs?${next.toString()}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Job title, skill or company"
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-600"
        />
      </div>
      <div className="relative sm:w-64">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City (e.g. Bengaluru)"
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-600"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}
