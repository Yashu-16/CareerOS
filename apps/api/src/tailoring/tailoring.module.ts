import { Module } from '@nestjs/common';
import { TailoringService } from './tailoring.service';
import { TailoringController } from './tailoring.controller';
import { TailoringAiService } from './tailoring-ai.service';
import { ResumeDocxGeneratorService } from './resume-docx-generator.service';
import { ResumePdfGeneratorService } from './resume-pdf-generator.service';

@Module({
  controllers: [TailoringController],
  providers: [TailoringService, TailoringAiService, ResumeDocxGeneratorService, ResumePdfGeneratorService],
  exports: [TailoringService],
})
export class TailoringModule {}
