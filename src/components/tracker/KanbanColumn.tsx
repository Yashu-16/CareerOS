'use client'

import { useDroppable } from '@dnd-kit/core'
import { ApplicationCard } from './ApplicationCard'
import type { ApplicationWithJob } from '@/types'

export function KanbanColumn({
  column,
  applications,
}: {
  column: { id: string; label: string; color: string }
  applications: ApplicationWithJob[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="w-72 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${column.color}`}>
          {column.label}
        </span>
        <span className="text-caption text-gray-500">{applications.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 rounded-xl p-2 min-h-[120px] transition-colors ${
          isOver ? 'bg-primary-50 border border-primary-300' : 'bg-gray-50 border border-transparent'
        }`}
      >
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <p className="text-caption text-gray-500 text-center py-6">Drop here</p>
        )}
      </div>
    </div>
  )
}
