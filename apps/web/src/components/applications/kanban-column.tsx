'use client';

import { useDroppable } from '@dnd-kit/core';
import { Application, ApplicationStage } from '@/types';
import { ApplicationCard } from './application-card';

const STAGE_LABELS: Record<ApplicationStage, string> = {
  SAVED: 'Saved',
  INTERESTED: 'Interested',
  APPLIED: 'Applied',
  ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview',
  FINAL_ROUND: 'Final round',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  ACCEPTED: 'Accepted',
};

export function KanbanColumn({ stage, applications }: { stage: ApplicationStage; applications: Application[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 flex-shrink-0 flex-col rounded-lg p-2 transition-colors ${
        isOver ? 'bg-saffron-50' : 'bg-ink-50/60'
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-ink-700">{STAGE_LABELS[stage]}</p>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs text-ink-400">{applications.length}</span>
      </div>

      <div className="flex-1 space-y-2">
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
        {applications.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-ink-300">Drop here</p>
        )}
      </div>
    </div>
  );
}
