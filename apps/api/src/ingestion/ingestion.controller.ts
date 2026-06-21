import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Manual trigger + status endpoints for job ingestion.
 * Gated behind auth so it isn't a public DOS vector; in a real production
 * deployment this should additionally be restricted to an admin role.
 */
@UseGuards(JwtAuthGuard)
@Controller('ingestion')
export class IngestionController {
  constructor(
    private readonly ingestionService: IngestionService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('run')
  run() {
    return this.ingestionService.ingestAll();
  }

  @Get('runs')
  recentRuns() {
    return this.prisma.ingestionRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }
}
