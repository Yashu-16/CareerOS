import Link from 'next/link';
import { MapPin, Briefcase, IndianRupee } from 'lucide-react';
import { Job } from '@/types';
import { Badge } from '@/components/ui/badge';

const EMPLOYMENT_LABELS: Record<string, string> = {
  INTERNSHIP: 'Internship',
  FRESHER: 'Fresher',
  FULL_TIME: 'Full-time',
  CONTRACT: 'Contract',
  PART_TIME: 'Part-time',
};

export function JobListCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block rounded-lg border border-ink-100 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-ink-800">{job.title}</p>
          <p className="text-sm text-ink-500">{job.company.name}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
            {job.normalizedCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.normalizedCity}
              </span>
            )}
            {job.employmentType && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {EMPLOYMENT_LABELS[job.employmentType]}
              </span>
            )}
            {job.salaryMinLpa && (
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />
                {job.salaryMinLpa}–{job.salaryMaxLpa} LPA
              </span>
            )}
          </div>

          {job.extractedKeywords && job.extractedKeywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.extractedKeywords.slice(0, 6).map((kw) => (
                <span key={kw} className="skill-tag">{kw}</span>
              ))}
            </div>
          )}
        </div>

        {job.workMode && (
          <Badge variant={job.workMode === 'REMOTE' ? 'success' : 'default'}>{job.workMode}</Badge>
        )}
      </div>
    </Link>
  );
}
