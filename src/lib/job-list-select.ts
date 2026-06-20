import type { Prisma } from '@prisma/client'

/** Fields returned for job list cards — excludes heavy description text. */
export const JOB_LIST_SELECT = {
  id: true,
  externalId: true,
  title: true,
  company: true,
  companyLogo: true,
  location: true,
  locationType: true,
  jobType: true,
  salaryMin: true,
  salaryMax: true,
  salaryCurrency: true,
  skills: true,
  applyUrl: true,
  source: true,
  postedAt: true,
  isActive: true,
} satisfies Prisma.JobSelect

/** Includes description for server-side fit scoring only — never send to the client. */
export const JOB_FIT_SCORE_SELECT = {
  ...JOB_LIST_SELECT,
  description: true,
} satisfies Prisma.JobSelect

export type JobListRow = Prisma.JobGetPayload<{ select: typeof JOB_LIST_SELECT }>

/** Max jobs scored in-memory when sorting by resume fit (keeps API fast). */
export const FIT_SCORE_POOL = 100
