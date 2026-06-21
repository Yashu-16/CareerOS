import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Profile, Education, Experience, ProjectEntry, Certification } from '@/types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get<Profile>('/profile');
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Profile>) => {
      const { data } = await api.patch('/profile', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useAddEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Education>) => {
      const { data } = await api.post('/profile/education', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useDeleteEducation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/profile/education/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useAddExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Experience>) => {
      const { data } = await api.post('/profile/experience', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useDeleteExperience() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/profile/experience/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useAddProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ProjectEntry>) => {
      const { data } = await api.post('/profile/projects', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/profile/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useAddCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Certification>) => {
      const { data } = await api.post('/profile/certifications', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useDeleteCertification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/profile/certifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useAddSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; proficiency?: string }) => {
      const { data } = await api.post('/profile/skills', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useRemoveSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (skillId: string) => api.delete(`/profile/skills/${skillId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
