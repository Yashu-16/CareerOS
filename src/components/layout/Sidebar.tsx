'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav-items'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-sidebar shrink-0 border-r border-gray-200 bg-white h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="text-h2 font-bold text-gray-900">
          CareerOS<span className="text-primary-600"> India</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="bg-ai-light rounded-lg p-3">
          <p className="text-body-sm font-medium text-ai">AI Copilot</p>
          <p className="text-caption text-gray-500 mt-0.5">Ask anything about your career.</p>
          <Link
            href="/copilot"
            className="text-caption text-ai font-medium mt-2 inline-block hover:underline"
          >
            Open chat →
          </Link>
        </div>
      </div>
    </aside>
  )
}
