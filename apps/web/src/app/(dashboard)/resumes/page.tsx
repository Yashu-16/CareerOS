'use client';

import { useResumes } from '@/hooks/use-resumes';
import { ResumeUploadDropzone } from '@/components/resume/resume-upload-dropzone';
import { ResumeCard } from '@/components/resume/resume-card';

export default function ResumesPage() {
  const { data: resumes, isLoading } = useResumes();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink-800">Resumes</h1>
      <p className="mt-1 text-ink-400">
        Upload once. CareerOS extracts your skills, scores it for ATS readiness, and uses it as the base for every tailored version.
      </p>

      <div className="mt-6">
        <ResumeUploadDropzone />
      </div>

      <div className="mt-8 space-y-4">
        {isLoading && <p className="text-sm text-ink-400">Loading your resumes…</p>}
        {resumes?.length === 0 && (
          <p className="text-sm text-ink-400">No resumes yet — upload your first one above.</p>
        )}
        {resumes?.map((resume) => <ResumeCard key={resume.id} resume={resume} />)}
      </div>
    </div>
  );
}
