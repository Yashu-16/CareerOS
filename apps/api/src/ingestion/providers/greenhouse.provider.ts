import { Injectable, Logger } from '@nestjs/common';
import { AtsSource } from '@prisma/client';
import { AtsProvider, NormalizedJob } from './ats-provider.interface';
import { stripHtml, inferEmploymentType } from './html.util';

interface GreenhouseJob {
  id: number;
  title: string;
  updated_at: string;
  location?: { name?: string };
  content?: string;
  absolute_url?: string;
  departments?: Array<{ name: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

/**
 * Greenhouse Job Board API — public, unauthenticated, no rate limits documented.
 * GET https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs?content=true
 */
@Injectable()
export class GreenhouseProvider implements AtsProvider {
  readonly source = AtsSource.GREENHOUSE;
  private readonly logger = new Logger(GreenhouseProvider.name);

  async fetchJobs(boardToken: string): Promise<NormalizedJob[]> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      this.logger.warn(`Greenhouse fetch failed for board "${boardToken}": ${response.status}`);
      return [];
    }

    const data: GreenhouseResponse = await response.json();

    return data.jobs.map((job) => {
      const descriptionText = stripHtml(job.content || '');
      return {
        externalId: String(job.id),
        atsSource: AtsSource.GREENHOUSE,
        title: job.title,
        department: job.departments?.[0]?.name,
        locationRaw: job.location?.name,
        descriptionHtml: job.content || '',
        descriptionText,
        applyUrl: job.absolute_url || `https://boards.greenhouse.io/${boardToken}/jobs/${job.id}`,
        postedAt: job.updated_at ? new Date(job.updated_at) : undefined,
        employmentTypeHint: inferEmploymentType(job.title, descriptionText),
      };
    });
  }
}
