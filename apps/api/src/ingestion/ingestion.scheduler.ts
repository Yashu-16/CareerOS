import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(private readonly ingestionService: IngestionService) {}

  // Every 6 hours — frequent enough to keep listings fresh without hammering
  // public ATS endpoints that have no documented rate limit but should still
  // be treated respectfully.
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleScheduledIngestion() {
    this.logger.log('Starting scheduled job ingestion run...');
    try {
      const result = await this.ingestionService.ingestAll();
      this.logger.log(`Scheduled ingestion finished: ${JSON.stringify(result)}`);
    } catch (err) {
      this.logger.error(`Scheduled ingestion failed: ${(err as Error).message}`);
    }
  }
}
