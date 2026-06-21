import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TailorResult } from '@/types';

export function useTailorResume() {
  return useMutation({
    mutationFn: async (payload: { jobId: string; baseResumeId: string }) => {
      const { data } = await api.post<TailorResult>('/tailoring/resume', payload);
      return data;
    },
  });
}

export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.post<{ coverLetter: string }>(`/tailoring/cover-letter/${jobId}`);
      return data;
    },
  });
}

export function useGenerateInterviewAnswer() {
  return useMutation({
    mutationFn: async ({ jobId, question }: { jobId: string; question: string }) => {
      const { data } = await api.post<{ question: string; answer: string }>(
        `/tailoring/interview-answer/${jobId}`,
        { question },
      );
      return data;
    },
  });
}

export function downloadResumeVersion(versionId: string, format: 'pdf' | 'docx', token: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const url = `${baseUrl}/tailoring/versions/${versionId}/download?format=${format}`;
  // Direct browser navigation with auth header isn't possible for downloads,
  // so we fetch with the token and trigger a blob download instead.
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `resume.${format}`;
      link.click();
    });
}
