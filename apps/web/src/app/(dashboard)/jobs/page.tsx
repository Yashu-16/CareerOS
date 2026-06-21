'use client';

import { useState } from 'react';
import { useJobSearch, JobSearchFilters } from '@/hooks/use-jobs';
import { JobFiltersBar } from '@/components/jobs/job-filters-bar';
import { JobListCard } from '@/components/jobs/job-list-card';
import { Button } from '@/components/ui/button';

export default function JobsPage() {
  const [filters, setFilters] = useState<JobSearchFilters>({ page: 1 });
  const { data, isLoading } = useJobSearch(filters);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-ink-800">Jobs</h1>
      <p className="mt-1 text-ink-400">
        Live postings pulled directly from company career pages — Greenhouse, Lever, and Ashby — filtered to India.
      </p>

      <div className="mt-6">
        <JobFiltersBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-ink-400">Searching…</p>}
        {data?.items.length === 0 && (
          <p className="text-sm text-ink-400">
            No jobs match these filters yet. Try widening your search, or check back after the next ingestion run.
          </p>
        )}
        {data?.items.map((job) => <JobListCard key={job.id} job={job} />)}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page <= 1}
            onClick={() => setFilters({ ...filters, page: data.pagination.page - 1 })}
          >
            Previous
          </Button>
          <span className="text-sm text-ink-400">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page >= data.pagination.totalPages}
            onClick={() => setFilters({ ...filters, page: data.pagination.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
