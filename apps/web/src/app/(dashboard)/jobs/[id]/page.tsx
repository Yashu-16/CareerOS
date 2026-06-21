'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { MapPin, Briefcase, IndianRupee, ExternalLink } from 'lucide-react';
import { useJob } from '@/hooks/use-jobs';
import { useResumes } from '@/hooks/use-resumes';
import { useTailorResume } from '@/hooks/use-tailoring';
import { useCreateApplication } from '@/hooks/use-applications';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MatchScorePanel } from '@/components/jobs/match-score-panel';
import { TailoredResumePreview } from '@/components/jobs/tailored-resume-preview';
import { ApplicationAssistantPanel } from '@/components/jobs/application-assistant-panel';

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const { data: job, isLoading } = useJob(jobId);
  const { data: resumes } = useResumes();
  const tailor = useTailorResume();
  const createApplication = useCreateApplication();

  const masterResume = resumes?.find((r) => r.isMaster);
  const [saved, setSaved] = useState(false);

  if (isLoading || !job) {
    return <p className="text-sm text-ink-400">Loading job…</p>;
  }

  const onTailor = () => {
    if (!masterResume) return;
    tailor.mutate({ jobId: job.id, baseResumeId: masterResume.id });
  };

  const onSaveToTracker = () => {
    createApplication.mutate(
      { jobId: job.id, companyName: job.company.name, jobTitle: job.title, jobUrl: job.applyUrl },
      { onSuccess: () => setSaved(true) },
    );
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-800">{job.title}</h1>
          <p className="text-ink-500">{job.company.name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-400">
            {job.normalizedCity && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.normalizedCity}</span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {job.employmentType.replace('_', '-')}</span>
            )}
            {job.salaryMinLpa && (
              <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4" /> {job.salaryMinLpa}–{job.salaryMaxLpa} LPA</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" onClick={onSaveToTracker} disabled={saved || createApplication.isPending}>
            {saved ? 'Saved to tracker' : 'Save to tracker'}
          </Button>
          <Button asChild size="sm" variant="accent">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply on company site <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      {!masterResume ? (
        <Card className="mt-6 border-saffron-300 bg-saffron-50">
          <CardContent className="py-4">
            <p className="text-sm text-ink-700">
              Upload your master resume first — CareerOS needs it to compute your match score and tailor a version for this role.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6">
          {!tailor.data && (
            <Button onClick={onTailor} variant="accent" disabled={tailor.isPending}>
              {tailor.isPending ? 'Analyzing job & tailoring resume…' : 'Tailor my resume for this job'}
            </Button>
          )}

          {tailor.isError && (
            <p className="mt-2 text-sm text-alert-500">
              {(tailor.error as any)?.response?.data?.message || 'Something went wrong while tailoring.'}
            </p>
          )}

          {tailor.data && (
            <div className="mt-2 space-y-6">
              <MatchScorePanel result={tailor.data.matchScore} />
              <TailoredResumePreview content={tailor.data.tailoredContent} version={tailor.data.version} />
              <ApplicationAssistantPanel jobId={job.id} />
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Job description</p>
        <div
          className="prose prose-sm max-w-none text-ink-600"
          dangerouslySetInnerHTML={{ __html: job.descriptionHtml }}
        />
      </div>
    </div>
  );
}
