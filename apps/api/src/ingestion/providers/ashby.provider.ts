import { Injectable, Logger } from '@nestjs/common';
import { AtsSource, WorkMode } from '@prisma/client';
import { AtsProvider, NormalizedJob } from './ats-provider.interface';
import { stripHtml, inferEmploymentType } from './html.util';

interface AshbyJob {
  id?: string;
  title: string;
  location?: string;
  department?: string;
  team?: string;
  isRemote?: boolean;
  workplaceType?: 'Remote' | 'OnSite' | 'Hybrid';
  descriptionHtml?: string;
  descriptionPlain?: string;
  publishedAt?: string;
  employmentType?: string;
  jobUrl?: string;
  applyUrl?: string;
  compensation?: {
    compensationTiers?: Array<{ minValue?: number; maxValue?: number; currencyCode?: string }>;
  };
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

const WORKPLACE_TYPE_MAP: Record<string, WorkMode> = {
  Remote: WorkMode.REMOTE,
  Hybrid: WorkMode.HYBRID,
  OnSite: WorkMode.ONSITE,
};

/**
 * Ashby Job Postings API — public, unauthenticated.
 * GET https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true
 */
@Injectable()
export class AshbyProvider implements AtsProvider {
  readonly source = AtsSource.ASHBY;
  private readonly logger = new Logger(AshbyProvider.name);

  async fetchJobs(boardToken: string): Promise<NormalizedJob[]> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardToken)}?includeCompensation=true`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      this.logger.warn(`Ashby fetch failed for org "${boardToken}": ${response.status}`);
      return [];
    }

    const data: AshbyResponse = await response.json();

    return (data.jobs || []).map((job) => {
      const descriptionHtml = job.descriptionHtml || '';
      const descriptionText = job.descriptionPlain || stripHtml(descriptionHtml);

      const tier = job.compensation?.compensationTiers?.[0];
      let salaryMinLpa: number | undefined;
      let salaryMaxLpa: number | undefined;
      if (tier?.currencyCode === 'INR') {
        if (tier.minValue) salaryMinLpa = tier.minValue / 100000;
        if (tier.maxValue) salaryMaxLpa = tier.maxValue / 100000;
      }

      // Ashby doesn't always return a stable numeric id in the public feed;
      // jobUrl's slug is a reliable unique key when `id` is absent.
      const externalId = job.id || job.jobUrl?.split('/').pop() || `${job.title}-${job.location}`;

      return {
        externalId,
        atsSource: AtsSource.ASHBY,
        title: job.title,
        department: job.department || job.team,
        locationRaw: job.location,
        descriptionHtml,
        descriptionText,
        applyUrl: job.applyUrl || job.jobUrl || '',
        postedAt: job.publishedAt ? new Date(job.publishedAt) : undefined,
        salaryMinLpa,
        salaryMaxLpa,
        workModeHint: job.workplaceType ? WORKPLACE_TYPE_MAP[job.workplaceType] : undefined,
        employmentTypeHint: inferEmploymentType(`${job.title} ${job.employmentType || ''}`, descriptionText),
      };
    });
  }
}
