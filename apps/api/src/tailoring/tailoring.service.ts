import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { TailoringAiService, ProfileSnapshot } from './tailoring-ai.service';
import { ResumeDocxGeneratorService } from './resume-docx-generator.service';
import { ResumePdfGeneratorService } from './resume-pdf-generator.service';

@Injectable()
export class TailoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ai: TailoringAiService,
    private readonly docxGenerator: ResumeDocxGeneratorService,
    private readonly pdfGenerator: ResumePdfGeneratorService,
  ) {}

  /**
   * The flagship CareerOS flow: given a job + a base resume, this:
   *  1. Analyzes the job description (skills, responsibilities, seniority)
   *  2. Builds a profile snapshot (real user data — single source of truth)
   *  3. Computes a real AI match score against that specific job
   *  4. Generates a tailored resume grounded in the user's real data
   *  5. Exports it to PDF + DOCX and stores a version record
   */
  async tailorForJob(userId: string, jobId: string, baseResumeId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');

    const baseResume = await this.prisma.resume.findFirst({ where: { id: baseResumeId, userId } });
    if (!baseResume) throw new NotFoundException('Base resume not found');

    const profile = await this.buildProfileSnapshot(userId);

    const analysis = await this.ai.analyzeJob(job.title, job.descriptionText);
    const matchScore = await this.ai.computeMatchScore(analysis, profile);
    const tailoredContent = await this.ai.generateTailoredResume(analysis, matchScore, profile);

    const pdfBuffer = await this.pdfGenerator.generate(profile, tailoredContent);
    const docxBuffer = await this.docxGenerator.generate(profile, tailoredContent);

    const safeCompany = job.company.name.replace(/[^a-zA-Z0-9]/g, '_');
    const pdfKey = await this.storage.saveBuffer(pdfBuffer, `tailored_${safeCompany}.pdf`, 'tailored-resumes');
    const docxKey = await this.storage.saveBuffer(docxBuffer, `tailored_${safeCompany}.docx`, 'tailored-resumes');

    const version = await this.prisma.resumeVersion.create({
      data: {
        resumeId: baseResume.id,
        jobId: job.id,
        label: `Tailored for ${job.company.name} — ${job.title}`,
        contentJson: tailoredContent as unknown as object,
        matchScore: Math.round(matchScore.overallScore),
        missingSkills: matchScore.missingSkills,
        storageKeyPdf: pdfKey,
        storageKeyDocx: docxKey,
      },
    });

    return {
      version,
      analysis,
      matchScore,
      tailoredContent,
    };
  }

  async generateCoverLetter(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');

    const profile = await this.buildProfileSnapshot(userId);
    const analysis = await this.ai.analyzeJob(job.title, job.descriptionText);
    const coverLetter = await this.ai.generateCoverLetter(job.title, job.company.name, analysis, profile);

    return { coverLetter };
  }

  async generateInterviewAnswer(userId: string, jobId: string, question: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, include: { company: true } });
    if (!job) throw new NotFoundException('Job not found');

    const profile = await this.buildProfileSnapshot(userId);
    const answer = await this.ai.generateInterviewAnswer(question, job.title, job.company.name, profile);

    return { question, answer };
  }

  async getVersionFile(userId: string, versionId: string, format: 'pdf' | 'docx') {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: { resume: true },
    });
    if (!version || version.resume.userId !== userId) {
      throw new NotFoundException('Resume version not found');
    }

    const key = format === 'pdf' ? version.storageKeyPdf : version.storageKeyDocx;
    if (!key) throw new NotFoundException(`No ${format} export available for this version`);

    return { buffer: await this.storage.readBuffer(key), label: version.label };
  }

  private async buildProfileSnapshot(userId: string): Promise<ProfileSnapshot> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        education: true,
        experience: true,
        projects: true,
        certifications: true,
        skills: { include: { skill: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found — complete your profile before tailoring a resume');
    }

    return {
      fullName: profile.fullName || 'Candidate',
      headline: profile.headline || undefined,
      summary: profile.summary || undefined,
      yearsOfExperience: profile.yearsOfExperience || undefined,
      skills: profile.skills.map((s) => s.skill.name),
      education: profile.education.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.fieldOfStudy || undefined,
      })),
      experience: profile.experience.map((e) => ({
        company: e.company,
        title: e.title,
        description: e.description || undefined,
        achievements: e.achievements,
      })),
      projects: profile.projects.map((p) => ({
        name: p.name,
        description: p.description || undefined,
        techStack: p.techStack,
      })),
      certifications: profile.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer || undefined,
      })),
    };
  }
}
