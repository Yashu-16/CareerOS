'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, LogOut, ChevronDown } from 'lucide-react'

export function TopBar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [query, setQuery] = useState('')

  const name = session?.user?.name || session?.user?.email || 'You'
  const initial = name.charAt(0).toUpperCase()

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/jobs?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="h-16 sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6">
      <form onSubmit={onSearch} className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs, companies, roles..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-600"
        />
      </form>

      <div className="relative ml-auto">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
        >
          <span className="h-8 w-8 rounded-full bg-primary-600 text-white grid place-items-center text-body-sm font-semibold">
            {initial}
          </span>
          <span className="hidden sm:block text-body-sm text-gray-700 max-w-[140px] truncate">{name}</span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-md z-20 py-1">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  router.push('/profile')
                }}
                className="w-full text-left px-4 py-2 text-body-sm text-gray-700 hover:bg-gray-100"
              >
                Profile & settings
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left px-4 py-2 text-body-sm text-danger hover:bg-gray-100 flex items-center gap-2"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
