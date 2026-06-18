import {
  LayoutDashboard,
  Briefcase,
  FileText,
  KanbanSquare,
  Sparkles,
  CalendarDays,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Resume & ATS', href: '/resume', icon: FileText },
  { label: 'Tracker', href: '/tracker', icon: KanbanSquare },
  { label: 'AI Copilot', href: '/copilot', icon: Sparkles },
  { label: 'Events', href: '/events', icon: CalendarDays },
  { label: 'Profile', href: '/profile', icon: User },
]
