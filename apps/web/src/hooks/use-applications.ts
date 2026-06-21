import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Application, ApplicationBoard, ApplicationAnalytics, ApplicationStage } from '@/types';

export function useApplicationBoard() {
  return useQuery({
    queryKey: ['applications-board'],
    queryFn: async () => {
      const { data } = await api.get<ApplicationBoard>('/applications/board');
      return data;
    },
  });
}

export function useApplicationAnalytics() {
  return useQuery({
    queryKey: ['applications-analytics'],
    queryFn: async () => {
      const { data } = await api.get<ApplicationAnalytics>('/applications/analytics');
      return data;
    },
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Application> & { jobId?: string }) => {
      const { data } = await api.post('/applications', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications-board'] });
      qc.invalidateQueries({ queryKey: ['applications-analytics'] });
    },
  });
}

export function useUpdateApplicationStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: ApplicationStage }) => {
      const { data } = await api.patch(`/applications/${id}`, { stage });
      return data;
    },
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['applications-board'] });
      const previous = qc.getQueryData<ApplicationBoard>(['applications-board']);
      if (previous) {
        const next: ApplicationBoard = { ...previous };
        for (const key of Object.keys(next) as ApplicationStage[]) {
          next[key] = next[key].filter((a) => a.id !== id);
        }
        const moved = Object.values(previous)
          .flat()
          .find((a) => a.id === id);
        if (moved) {
          next[stage] = [{ ...moved, stage }, ...next[stage]];
        }
        qc.setQueryData(['applications-board'], next);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(['applications-board'], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['applications-board'] });
      qc.invalidateQueries({ queryKey: ['applications-analytics'] });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications-board'] });
      qc.invalidateQueries({ queryKey: ['applications-analytics'] });
    },
  });
}
