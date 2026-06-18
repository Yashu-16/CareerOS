'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { NAV_ITEMS } from './nav-items'

export function MobileNav() {
  const pathname = usePathname()
  // Show the five most important destinations on mobile.
  const items = NAV_ITEMS.filter((i) =>
    ['/dashboard', '/jobs', '/resume', '/tracker', '/copilot'].includes(i.href)
  )

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-caption',
              active ? 'text-primary-600' : 'text-gray-500'
            )}
          >
            <Icon size={20} />
            {item.label.split(' ')[0]}
          </Link>
        )
      })}
    </nav>
  )
}
