import { Injectable, Logger } from '@nestjs/common';
import { AtsSource } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { GreenhouseProvider } from './providers/greenhouse.provider';
import { LeverProvider } from './providers/lever.provider';
import { AshbyProvider } from './providers/ashby.provider';
import { AtsProvider, NormalizedJob } from './providers/ats-provider.interface';
import { COMPANY_SEED_LIST } from './company-seed.data';
import { detectIndianCity, isIndiaRelevant } from './india-location.util';
import { extractSkillsFromText } from './skill-extraction.util';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly providers: Record<AtsSource, AtsProvider>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly greenhouse: GreenhouseProvider,
    private readonly lever: LeverProvider,
    private readonly ashby: AshbyProvider,
  ) {
    this.providers = {
      [AtsSource.GREENHOUSE]: this.greenhouse,
      [AtsSource.LEVER]: this.lever,
      [AtsSource.ASHBY]: this.ashby,
      [AtsSource.MANUAL]: undefined as unknown as AtsProvider, // never ingested automatically
    };
  }

  /**
   * Ensures every seed company exists in the DB (idempotent upsert),
   * then ingests fresh jobs for all active companies.
   */
  async ingestAll(): Promise<{ totalFetched: number; totalCreated: number; totalUpdated: number }> {
    await this.ensureSeedCompaniesExist();

    const companies = await this.prisma.company.findMany({ where: { isActive: true } });

    let totalFetched = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    for (const company of companies) {
      const result = await this.ingestCompany(company.id, company.atsSource, company.atsBoardToken);
      totalFetched += result.fetched;
      totalCreated += result.created;
      totalUpdated += result.updated;
    }

    this.logger.log(
      `Ingestion complete: ${totalFetched} fetched, ${totalCreated} created, ${totalUpdated} updated across ${companies.length} companies.`,
    );

    return { totalFetched, totalCreated, totalUpdated };
  }

  async ingestCompany(
    companyId: string,
    atsSource: AtsSource,
    boardToken: string,
  ): Promise<{ fetched: number; created: number; updated: number }> {
    const run = await this.prisma.ingestionRun.create({ data: { atsSource } });

    const provider = this.providers[atsSource];
    if (!provider) {
      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: { finishedAt: new Date(), errorMessage: `No provider configured for ${atsSource}` },
      });
      return { fetched: 0, created: 0, updated: 0 };
    }

    let jobs: NormalizedJob[] = [];
    try {
      jobs = await provider.fetchJobs(boardToken);
    } catch (err) {
      this.logger.error(`Ingestion failed for ${atsSource}/${boardToken}: ${(err as Error).message}`);
      await this.prisma.ingestionRun.update({
        where: { id: run.id },
        data: { finishedAt: new Date(), errorMessage: (err as Error).message },
      });
      return { fetched: 0, created: 0, updated: 0 };
    }

    let created = 0;
    let updated = 0;

    for (const job of jobs) {
      const normalizedCity = detectIndianCity(job.locationRaw);
      const indiaRelevant = isIndiaRelevant(job.locationRaw, true);

      // We only persist jobs that are India-relevant, per CareerOS's India-first scope.
      if (!indiaRelevant) continue;

      const extractedKeywords = extractSkillsFromText(job.descriptionText);

      const existing = await this.prisma.job.findUnique({
        where: { companyId_externalId: { companyId, externalId: job.externalId } },
      });

      const data = {
        companyId,
        externalId: job.externalId,
        atsSource: job.atsSource,
        title: job.title,
        department: job.department,
        locationRaw: job.locationRaw,
        normalizedCity,
        workMode: job.workModeHint,
        employmentType: job.employmentTypeHint,
        descriptionHtml: job.descriptionHtml,
        descriptionText: job.descriptionText,
        salaryMinLpa: job.salaryMinLpa,
        salaryMaxLpa: job.salaryMaxLpa,
        applyUrl: job.applyUrl,
        postedAt: job.postedAt,
        isIndiaRelevant: indiaRelevant,
        isActive: true,
        extractedKeywords,
      };

      if (existing) {
        await this.prisma.job.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        const createdJob = await this.prisma.job.create({ data });
        await this.linkSkills(createdJob.id, extractedKeywords);
        created++;
      }
    }

    await this.prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        jobsFetched: jobs.length,
        jobsCreated: created,
        jobsUpdated: updated,
      },
    });

    return { fetched: jobs.length, created, updated };
  }

  private async linkSkills(jobId: string, skillNames: string[]) {
    for (const name of skillNames) {
      const skill = await this.prisma.skill.upsert({
        where: { name },
        create: { name },
        update: {},
      });
      await this.prisma.jobSkill.upsert({
        where: { jobId_skillId: { jobId, skillId: skill.id } },
        create: { jobId, skillId: skill.id },
        update: {},
      });
    }
  }

  private async ensureSeedCompaniesExist() {
    for (const seed of COMPANY_SEED_LIST) {
      await this.prisma.company.upsert({
        where: { atsSource_atsBoardToken: { atsSource: seed.atsSource as AtsSource, atsBoardToken: seed.atsBoardToken } },
        create: {
          name: seed.name,
          atsSource: seed.atsSource as AtsSource,
          atsBoardToken: seed.atsBoardToken,
          website: seed.website,
          industry: seed.industry,
        },
        update: {},
      });
    }
  }
}
