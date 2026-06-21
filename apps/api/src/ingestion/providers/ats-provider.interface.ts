import { AtsSource, EmploymentType, WorkMode } from '@prisma/client';

/**
 * Common shape every ATS provider normalizes its raw response into,
 * before the ingestion service maps employment type / work mode / India
 * relevance and persists it.
 */
export interface NormalizedJob {
  externalId: string;
  atsSource: AtsSource;
  title: string;
  department?: string;
  locationRaw?: string;
  descriptionHtml: string;
  descriptionText: string;
  applyUrl: string;
  postedAt?: Date;
  salaryMinLpa?: number;
  salaryMaxLpa?: number;
  workModeHint?: WorkMode;
  employmentTypeHint?: EmploymentType;
}

export interface AtsProvider {
  readonly source: AtsSource;
  fetchJobs(boardToken: string): Promise<NormalizedJob[]>;
}
