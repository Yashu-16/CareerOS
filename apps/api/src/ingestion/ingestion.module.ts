import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';
import { IngestionScheduler } from './ingestion.scheduler';
import { IngestionController } from './ingestion.controller';
import { GreenhouseProvider } from './providers/greenhouse.provider';
import { LeverProvider } from './providers/lever.provider';
import { AshbyProvider } from './providers/ashby.provider';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [IngestionController],
  providers: [IngestionService, IngestionScheduler, GreenhouseProvider, LeverProvider, AshbyProvider],
  exports: [IngestionService],
})
export class IngestionModule {}
