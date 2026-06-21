import { Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStage } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

const TERMINAL_POSITIVE_STAGES = [ApplicationStage.OFFER, ApplicationStage.ACCEPTED];

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateApplicationDto) {
    const application = await this.prisma.application.create({
      data: {
        userId,
        jobId: dto.jobId,
        companyName: dto.companyName,
        jobTitle: dto.jobTitle,
        jobUrl: dto.jobUrl,
        salaryLpa: dto.salaryLpa,
        recruiterName: dto.recruiterName,
        recruiterContact: dto.recruiterContact,
        notes: dto.notes,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
        stage: dto.appliedAt ? ApplicationStage.APPLIED : ApplicationStage.SAVED,
      },
    });

    await this.prisma.applicationStageHistory.create({
      data: { applicationId: application.id, toStage: application.stage },
    });

    return application;
  }

  /** Returns applications grouped by stage — exactly what a Kanban board needs. */
  async listBoard(userId: string) {
    const applications = await this.prisma.application.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { job: { select: { id: true, title: true, applyUrl: true, company: { select: { name: true, logoUrl: true } } } } },
    });

    const board: Record<ApplicationStage, typeof applications> = {
      SAVED: [],
      INTERESTED: [],
      APPLIED: [],
      ASSESSMENT: [],
      INTERVIEW: [],
      FINAL_ROUND: [],
      OFFER: [],
      REJECTED: [],
      ACCEPTED: [],
    };

    for (const app of applications) {
      board[app.stage].push(app);
    }

    return board;
  }

  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    const existing = await this.prisma.application.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Application not found');

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        stage: dto.stage,
        salaryLpa: dto.salaryLpa,
        recruiterName: dto.recruiterName,
        recruiterContact: dto.recruiterContact,
        notes: dto.notes,
        appliedAt: dto.appliedAt ? new Date(dto.appliedAt) : undefined,
      },
    });

    if (dto.stage && dto.stage !== existing.stage) {
      await this.prisma.applicationStageHistory.create({
        data: { applicationId: id, fromStage: existing.stage, toStage: dto.stage },
      });
    }

    return updated;
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.application.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Application not found');
    await this.prisma.application.delete({ where: { id } });
  }

  /** Conversion analytics: interview rate, offer rate, stage funnel. */
  async getAnalytics(userId: string) {
    const applications = await this.prisma.application.findMany({ where: { userId } });

    const total = applications.length;
    const appliedOrBeyond = applications.filter((a) => a.stage !== ApplicationStage.SAVED && a.stage !== ApplicationStage.INTERESTED).length;
    const reachedInterview = applications.filter((a) =>
      [ApplicationStage.INTERVIEW, ApplicationStage.FINAL_ROUND, ApplicationStage.OFFER, ApplicationStage.ACCEPTED].includes(a.stage),
    ).length;
    const reachedOffer = applications.filter((a) => TERMINAL_POSITIVE_STAGES.includes(a.stage)).length;
    const rejected = applications.filter((a) => a.stage === ApplicationStage.REJECTED).length;

    const stageCounts = Object.values(ApplicationStage).reduce((acc, stage) => {
      acc[stage] = applications.filter((a) => a.stage === stage).length;
      return acc;
    }, {} as Record<ApplicationStage, number>);

    return {
      totalApplications: total,
      appliedOrBeyond,
      interviewRate: appliedOrBeyond > 0 ? Math.round((reachedInterview / appliedOrBeyond) * 100) : 0,
      offerRate: appliedOrBeyond > 0 ? Math.round((reachedOffer / appliedOrBeyond) * 100) : 0,
      rejectionRate: appliedOrBeyond > 0 ? Math.round((rejected / appliedOrBeyond) * 100) : 0,
      stageCounts,
    };
  }

  /** Weekly report: applications created/moved in the last 7 days. */
  async getWeeklyReport(userId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newApplications = await this.prisma.application.count({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
    });

    const stageChanges = await this.prisma.applicationStageHistory.findMany({
      where: { application: { userId }, changedAt: { gte: sevenDaysAgo } },
      include: { application: { select: { companyName: true, jobTitle: true } } },
      orderBy: { changedAt: 'desc' },
    });

    return { periodDays: 7, newApplications, stageChanges };
  }
}
