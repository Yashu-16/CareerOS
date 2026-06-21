'use client';

import { useDraggable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { Application } from '@/types';
import { useDeleteApplication } from '@/hooks/use-applications';

export function ApplicationCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });
  const remove = useDeleteApplication();

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group cursor-grab rounded-lg border border-ink-100 bg-white p-3 shadow-card active:cursor-grabbing ${
        isDragging ? 'opacity-60 shadow-cardHover' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-800">{application.jobTitle}</p>
          <p className="truncate text-xs text-ink-400">{application.companyName}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            remove.mutate(application.id);
          }}
          className="opacity-0 group-hover:opacity-100"
          aria-label="Delete application"
        >
          <Trash2 className="h-3.5 w-3.5 text-ink-300 hover:text-alert-500" />
        </button>
      </div>
      {application.salaryLpa && (
        <p className="mt-1.5 text-xs text-ink-400">₹{application.salaryLpa} LPA</p>
      )}
    </div>
  );
}
