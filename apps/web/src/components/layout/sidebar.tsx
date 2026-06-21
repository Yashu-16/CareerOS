'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Briefcase,
  KanbanSquare,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/resumes', label: 'Resumes', icon: FileText },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/applications', label: 'Applications', icon: KanbanSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-ink-100 bg-white">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="font-display text-xl font-semibold text-ink-800">
          CareerOS
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-saffron-50 text-saffron-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-4">
        <div className="mb-3 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">
            {user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-800">{user?.fullName || 'Your account'}</p>
            <p className="truncate text-xs text-ink-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-ink-400 hover:bg-ink-50 hover:text-alert-500"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
