import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EducationDto } from './dto/education.dto';
import { ExperienceDto } from './dto/experience.dto';
import { ProjectDto } from './dto/project.dto';
import { CertificationDto } from './dto/certification.dto';
import { ProfileSkillDto } from './dto/profile-skill.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: {
        education: { orderBy: { startDate: 'desc' } },
        experience: { orderBy: { startDate: 'desc' } },
        projects: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        skills: { include: { skill: true } },
      },
    });

    if (!profile) {
      profile = await this.prisma.profile.create({
        data: { userId },
        include: {
          education: true,
          experience: true,
          projects: true,
          certifications: true,
          skills: { include: { skill: true } },
        },
      });
    }

    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    await this.ensureProfile(userId);
    return this.prisma.profile.update({
      where: { userId },
      data: { ...dto },
    });
  }

  // ── Education ─────────────────────────────────────────────────────────
  async addEducation(userId: string, dto: EducationDto) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.education.create({
      data: {
        profileId: profile.id,
        institution: dto.institution,
        degree: dto.degree,
        fieldOfStudy: dto.fieldOfStudy,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        gradeValue: dto.gradeValue,
        isCurrent: dto.isCurrent ?? false,
      },
    });
  }

  async updateEducation(userId: string, id: string, dto: Partial<EducationDto>) {
    await this.assertOwnership(userId, 'education', id);
    return this.prisma.education.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteEducation(userId: string, id: string) {
    await this.assertOwnership(userId, 'education', id);
    await this.prisma.education.delete({ where: { id } });
  }

  // ── Experience ─────────────────────────────────────────────────────────
  async addExperience(userId: string, dto: ExperienceDto) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.experience.create({
      data: {
        profileId: profile.id,
        company: dto.company,
        title: dto.title,
        location: dto.location,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isCurrent: dto.isCurrent ?? false,
        description: dto.description,
        achievements: dto.achievements ?? [],
      },
    });
  }

  async updateExperience(userId: string, id: string, dto: Partial<ExperienceDto>) {
    await this.assertOwnership(userId, 'experience', id);
    return this.prisma.experience.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteExperience(userId: string, id: string) {
    await this.assertOwnership(userId, 'experience', id);
    await this.prisma.experience.delete({ where: { id } });
  }

  // ── Projects ───────────────────────────────────────────────────────────
  async addProject(userId: string, dto: ProjectDto) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.project.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        description: dto.description,
        techStack: dto.techStack ?? [],
        projectUrl: dto.projectUrl,
        repoUrl: dto.repoUrl,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async updateProject(userId: string, id: string, dto: Partial<ProjectDto>) {
    await this.assertOwnership(userId, 'project', id);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async deleteProject(userId: string, id: string) {
    await this.assertOwnership(userId, 'project', id);
    await this.prisma.project.delete({ where: { id } });
  }

  // ── Certifications ────────────────────────────────────────────────────
  async addCertification(userId: string, dto: CertificationDto) {
    const profile = await this.ensureProfile(userId);
    return this.prisma.certification.create({
      data: {
        profileId: profile.id,
        name: dto.name,
        issuer: dto.issuer,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        credentialUrl: dto.credentialUrl,
      },
    });
  }

  async deleteCertification(userId: string, id: string) {
    await this.assertOwnership(userId, 'certification', id);
    await this.prisma.certification.delete({ where: { id } });
  }

  // ── Skills ─────────────────────────────────────────────────────────────
  async addSkill(userId: string, dto: ProfileSkillDto) {
    const profile = await this.ensureProfile(userId);

    const skill = await this.prisma.skill.upsert({
      where: { name: dto.name.trim() },
      create: { name: dto.name.trim() },
      update: {},
    });

    return this.prisma.profileSkill.upsert({
      where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } },
      create: {
        profileId: profile.id,
        skillId: skill.id,
        proficiency: dto.proficiency,
        yearsOfUse: dto.yearsOfUse,
      },
      update: {
        proficiency: dto.proficiency,
        yearsOfUse: dto.yearsOfUse,
      },
      include: { skill: true },
    });
  }

  async removeSkill(userId: string, skillId: string) {
    const profile = await this.ensureProfile(userId);
    await this.prisma.profileSkill.delete({
      where: { profileId_skillId: { profileId: profile.id, skillId } },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  private async ensureProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (profile) return profile;
    return this.prisma.profile.create({ data: { userId } });
  }

  private async assertOwnership(
    userId: string,
    entity: 'education' | 'experience' | 'project' | 'certification',
    id: string,
  ) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    let record: { profileId: string } | null = null;
    if (entity === 'education') record = await this.prisma.education.findUnique({ where: { id } });
    if (entity === 'experience') record = await this.prisma.experience.findUnique({ where: { id } });
    if (entity === 'project') record = await this.prisma.project.findUnique({ where: { id } });
    if (entity === 'certification') record = await this.prisma.certification.findUnique({ where: { id } });

    if (!record || record.profileId !== profile.id) {
      throw new NotFoundException(`${entity} record not found`);
    }
  }
}
