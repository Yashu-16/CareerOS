import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { TailoringService } from './tailoring.service';
import { TailorResumeDto } from './dto/tailor-resume.dto';

@UseGuards(JwtAuthGuard)
@Controller('tailoring')
export class TailoringController {
  constructor(private readonly tailoringService: TailoringService) {}

  @Post('resume')
  tailorResume(@CurrentUser() user: CurrentUserPayload, @Body() dto: TailorResumeDto) {
    return this.tailoringService.tailorForJob(user.userId, dto.jobId, dto.baseResumeId);
  }

  @Post('cover-letter/:jobId')
  coverLetter(@CurrentUser() user: CurrentUserPayload, @Param('jobId') jobId: string) {
    return this.tailoringService.generateCoverLetter(user.userId, jobId);
  }

  @Post('interview-answer/:jobId')
  interviewAnswer(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId') jobId: string,
    @Body('question') question: string,
  ) {
    return this.tailoringService.generateInterviewAnswer(user.userId, jobId, question);
  }

  @Get('versions/:versionId/download')
  async download(
    @CurrentUser() user: CurrentUserPayload,
    @Param('versionId') versionId: string,
    @Query('format') format: 'pdf' | 'docx' = 'pdf',
    @Res() res: Response,
  ) {
    const { buffer, label } = await this.tailoringService.getVersionFile(user.userId, versionId, format);
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const filename = `${label.replace(/[^a-zA-Z0-9_\- ]/g, '')}.${format}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }
}
