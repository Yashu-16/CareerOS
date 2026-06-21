import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Job, JobSearchResponse } from '@/types';

export interface JobSearchFilters {
  q?: string;
  city?: string;
  workMode?: string;
  employmentType?: string;
  skill?: string;
  minSalaryLpa?: string;
  page?: number;
}

export function useJobSearch(filters: JobSearchFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      const { data } = await api.get<JobSearchResponse>('/jobs', { params: filters });
      return data;
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get<Job>(`/jobs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useJobCities() {
  return useQuery({
    queryKey: ['job-cities'],
    queryFn: async () => {
      const { data } = await api.get<Array<{ city: string; count: number }>>('/jobs/cities');
      return data;
    },
  });
}
