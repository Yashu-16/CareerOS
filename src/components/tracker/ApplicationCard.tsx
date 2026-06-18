'use client'

import { useDraggable } from '@dnd-kit/core'
import { Building2, GripVertical } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import type { ApplicationWithJob } from '@/types'

export function ApplicationCard({ application }: { application: ApplicationWithJob }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm ${
        isDragging ? 'opacity-80 shadow-md' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing mt-0.5"
          aria-label="Drag"
        >
          <GripVertical size={16} />
        </button>
        <div className="h-8 w-8 rounded bg-gray-50 border border-gray-200 grid place-items-center overflow-hidden shrink-0">
          {application.job.companyLogo ? (
            <img src={application.job.companyLogo} alt="" className="h-full w-full object-contain" />
          ) : (
            <Building2 size={14} className="text-gray-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium text-gray-900 truncate">{application.job.title}</p>
          <p className="text-caption text-gray-500 truncate">{application.job.company}</p>
        </div>
      </div>
      <p className="text-caption text-gray-500 mt-2">Updated {timeAgo(application.updatedAt)}</p>
    </div>
  )
}
