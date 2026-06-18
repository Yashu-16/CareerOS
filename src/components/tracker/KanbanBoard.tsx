'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { useToast } from '@/components/ui/Toast'
import type { ApplicationWithJob, ApplicationStatus } from '@/types'

const COLUMNS = [
  { id: 'APPLIED', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
  { id: 'SCREENING', label: 'Screening', color: 'bg-ai-light text-ai' },
  { id: 'INTERVIEW', label: 'Interview', color: 'bg-warning-light text-warning' },
  { id: 'OFFER', label: 'Offer', color: 'bg-success-light text-success' },
  { id: 'REJECTED', label: 'Rejected', color: 'bg-danger-light text-danger' },
]

export function KanbanBoard({ initialApplications }: { initialApplications: ApplicationWithJob[] }) {
  const { toast } = useToast()
  const [applications, setApplications] = useState(initialApplications)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as ApplicationStatus
    const moved = applications.find((a) => a.id === active.id)
    if (!moved || moved.status === newStatus) return

    const previous = moved.status
    setApplications((prev) =>
      prev.map((a) => (a.id === active.id ? { ...a, status: newStatus } : a))
    )

    const res = await fetch(`/api/applications/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null)

    if (!res || !res.ok) {
      // Roll back on failure.
      setApplications((prev) =>
        prev.map((a) => (a.id === active.id ? { ...a, status: previous } : a))
      )
      toast('Could not update status. Please try again.', 'error')
    }
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-body-lg text-gray-900 font-medium">No applications yet</p>
        <p className="text-body-sm text-gray-500 mt-1">
          Track jobs from the Jobs page and they&apos;ll appear here.
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            applications={applications.filter((a) => a.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
