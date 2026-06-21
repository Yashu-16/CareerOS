import { cn } from '@/lib/cn'

const STEPS = ['Personal info', 'Target role & skills', 'Resume upload']

export function StepProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => {
        const step = i + 1
        const active = step <= current
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'h-7 w-7 shrink-0 rounded-full grid place-items-center text-caption font-semibold',
                active ? 'bg-primary-600 text-gray-900' : 'bg-gray-200 text-gray-500'
              )}
            >
              {step}
            </div>
            <span className={cn('text-caption hidden sm:block', active ? 'text-gray-900' : 'text-gray-500')}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1', step < current ? 'bg-primary-600' : 'bg-gray-200')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
