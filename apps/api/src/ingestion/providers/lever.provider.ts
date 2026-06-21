import { Injectable, Logger } from '@nestjs/common';
import { AtsSource, WorkMode } from '@prisma/client';
import { AtsProvider, NormalizedJob } from './ats-provider.interface';
import { stripHtml, inferEmploymentType } from './html.util';

interface LeverPosting {
  id: string;
  text: string; // title
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  description?: string;
  descriptionPlain?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number; // epoch ms
  workplaceType?: 'unspecified' | 'on-site' | 'remote' | 'hybrid';
  salaryRange?: { min?: number; max?: number; currency?: string; interval?: string };
}

const WORKPLACE_TYPE_MAP: Record<string, WorkMode> = {
  remote: WorkMode.REMOTE,
  hybrid: WorkMode.HYBRID,
  'on-site': WorkMode.ONSITE,
};

/**
 * Lever Postings API — public, unauthenticated.
 * GET https://api.lever.co/v0/postings/{site}?mode=json
 */
@Injectable()
export class LeverProvider implements AtsProvider {
  readonly source = AtsSource.LEVER;
  private readonly logger = new Logger(LeverProvider.name);

  async fetchJobs(boardToken: string): Promise<NormalizedJob[]> {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(boardToken)}?mode=json`;

    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      this.logger.warn(`Lever fetch failed for site "${boardToken}": ${response.status}`);
      return [];
    }

    const postings: LeverPosting[] = await response.json();

    return postings.map((posting) => {
      const descriptionHtml = posting.description || '';
      const descriptionText = posting.descriptionPlain || stripHtml(descriptionHtml);

      // Lever salary is annual, currency-agnostic at the API level; we only
      // map it when currency is INR — otherwise we leave it null rather than
      // guess a conversion rate.
      let salaryMinLpa: number | undefined;
      let salaryMaxLpa: number | undefined;
      if (posting.salaryRange?.currency === 'INR') {
        if (posting.salaryRange.min) salaryMinLpa = posting.salaryRange.min / 100000;
        if (posting.salaryRange.max) salaryMaxLpa = posting.salaryRange.max / 100000;
      }

      return {
        externalId: posting.id,
        atsSource: AtsSource.LEVER,
        title: posting.text,
        department: posting.categories?.team,
        locationRaw: posting.categories?.location,
        descriptionHtml,
        descriptionText,
        applyUrl: posting.applyUrl || posting.hostedUrl || '',
        postedAt: posting.createdAt ? new Date(posting.createdAt) : undefined,
        salaryMinLpa,
        salaryMaxLpa,
        workModeHint: posting.workplaceType ? WORKPLACE_TYPE_MAP[posting.workplaceType] : undefined,
        employmentTypeHint: inferEmploymentType(
          `${posting.text} ${posting.categories?.commitment || ''}`,
          descriptionText,
        ),
      };
    });
  }
}
