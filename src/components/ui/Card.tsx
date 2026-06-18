import { cn } from '@/lib/cn'

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-5 shadow-sm transition-shadow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string
  value: string | number
  accent?: string
  icon?: React.ReactNode
}) {
  return (
    <Card className="text-center">
      <div className="flex items-center justify-between">
        <span className="text-label text-gray-500">{label}</span>
        {icon}
      </div>
      <div className={cn('text-3xl font-bold mt-2', accent || 'text-gray-900')}>{value}</div>
    </Card>
  )
}
