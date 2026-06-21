import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { JobSearchQueryDto } from './dto/job-search-query.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: JobSearchQueryDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize || '20', 10)));

    const where: Prisma.JobWhereInput = {
      isActive: true,
      isIndiaRelevant: true,
    };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { descriptionText: { contains: query.q, mode: 'insensitive' } },
        { company: { name: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    if (query.city) {
      where.normalizedCity = { equals: query.city, mode: 'insensitive' };
    }

    if (query.workMode) {
      where.workMode = query.workMode;
    }

    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }

    if (query.skill) {
      where.extractedKeywords = { has: query.skill };
    }

    if (query.minSalaryLpa) {
      where.salaryMaxLpa = { gte: parseFloat(query.minSalaryLpa) };
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: { company: { select: { name: true, logoUrl: true, industry: true } } },
        orderBy: { postedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        skills: { include: { skill: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async listCities() {
    const result = await this.prisma.job.groupBy({
      by: ['normalizedCity'],
      where: { isActive: true, isIndiaRelevant: true, normalizedCity: { not: null } },
      _count: { normalizedCity: true },
      orderBy: { _count: { normalizedCity: 'desc' } },
    });
    return result.map((r) => ({ city: r.normalizedCity, count: r._count.normalizedCity }));
  }
}
