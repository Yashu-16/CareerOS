import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { ResumeExtractionService } from './resume-extraction.service';
import { ResumeAiService } from './resume-ai.service';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, ResumeExtractionService, ResumeAiService],
  exports: [ResumesService, ResumeExtractionService, ResumeAiService],
})
export class ResumesModule {}
