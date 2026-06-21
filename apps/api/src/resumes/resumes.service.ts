import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ResumeExtractionService } from './resume-extraction.service';
import { ResumeAiService } from './resume-ai.service';

@Injectable()
export class ResumesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly extraction: ResumeExtractionService,
    private readonly ai: ResumeAiService,
  ) {}

  async uploadAndParse(userId: string, file: Express.Multer.File, isMaster: boolean) {
    const fileType = file.mimetype === 'application/pdf' ? 'PDF' : 'DOCX';
    const storageKey = await this.storage.saveBuffer(file.buffer, file.originalname);
    const rawText = await this.extraction.extractText(file.buffer, fileType);

    if (isMaster) {
      // Only one master resume per user — demote any existing one.
      await this.prisma.resume.updateMany({
        where: { userId, isMaster: true },
        data: { isMaster: false },
      });
    }

    const resume = await this.prisma.resume.create({
      data: {
        userId,
        isMaster,
        originalFileName: file.originalname,
        fileType,
        storageKey,
        rawText,
      },
    });

    const parsed = await this.ai.parseResume(rawText);

    const updated = await this.prisma.resume.update({
      where: { id: resume.id },
      data: {
        atsScore: Math.round(parsed.atsScore),
        resumeScore: Math.round(parsed.resumeScore),
        parsedSkills: parsed.skills,
        parsedSummary: parsed.summary,
        recommendations: parsed.recommendations,
      },
    });

    return { resume: updated, parsed };
  }

  async list(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        isMaster: true,
        originalFileName: true,
        fileType: true,
        atsScore: true,
        resumeScore: true,
        parsedSkills: true,
        parsedSummary: true,
        recommendations: true,
        createdAt: true,
      },
    });
  }

  async getOne(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!resume) throw new NotFoundException('Resume not found');
    return resume;
  }

  async getMaster(userId: string) {
    return this.prisma.resume.findFirst({ where: { userId, isMaster: true } });
  }

  async delete(userId: string, id: string) {
    const resume = await this.prisma.resume.findFirst({ where: { id, userId } });
    if (!resume) throw new NotFoundException('Resume not found');
    await this.storage.delete(resume.storageKey);
    await this.prisma.resume.delete({ where: { id } });
  }
}
