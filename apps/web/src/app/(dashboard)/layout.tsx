'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useRequireAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-300">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
