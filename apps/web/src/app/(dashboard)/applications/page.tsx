'use client';

import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useApplicationBoard, useApplicationAnalytics, useUpdateApplicationStage } from '@/hooks/use-applications';
import { KanbanColumn } from '@/components/applications/kanban-column';
import { AddApplicationDialog } from '@/components/applications/add-application-dialog';
import { AnalyticsStrip } from '@/components/applications/analytics-strip';
import { ApplicationStage } from '@/types';

const STAGES: ApplicationStage[] = [
  'SAVED', 'INTERESTED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'FINAL_ROUND', 'OFFER', 'REJECTED', 'ACCEPTED',
];

export default function ApplicationsPage() {
  const { data: board } = useApplicationBoard();
  const { data: analytics } = useApplicationAnalytics();
  const updateStage = useUpdateApplicationStage();

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStage = over.id as ApplicationStage;
    updateStage.mutate({ id: active.id as string, stage: newStage });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-800">Applications</h1>
          <p className="mt-1 text-ink-400">Drag cards across stages as your search progresses.</p>
        </div>
        <AddApplicationDialog />
      </div>

      {analytics && (
        <div className="mt-5">
          <AnalyticsStrip analytics={analytics} />
        </div>
      )}

      <DndContext onDragEnd={onDragEnd}>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn key={stage} stage={stage} applications={board?.[stage] || []} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
