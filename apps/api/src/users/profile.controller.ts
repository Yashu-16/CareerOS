import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { EducationDto } from './dto/education.dto';
import { ExperienceDto } from './dto/experience.dto';
import { ProjectDto } from './dto/project.dto';
import { CertificationDto } from './dto/certification.dto';
import { ProfileSkillDto } from './dto/profile-skill.dto';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  get(@CurrentUser() user: CurrentUserPayload) {
    return this.profileService.getOrCreate(user.userId);
  }

  @Patch()
  update(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(user.userId, dto);
  }

  // Education
  @Post('education')
  addEducation(@CurrentUser() user: CurrentUserPayload, @Body() dto: EducationDto) {
    return this.profileService.addEducation(user.userId, dto);
  }

  @Patch('education/:id')
  updateEducation(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: Partial<EducationDto>,
  ) {
    return this.profileService.updateEducation(user.userId, id, dto);
  }

  @Delete('education/:id')
  deleteEducation(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.profileService.deleteEducation(user.userId, id);
  }

  // Experience
  @Post('experience')
  addExperience(@CurrentUser() user: CurrentUserPayload, @Body() dto: ExperienceDto) {
    return this.profileService.addExperience(user.userId, dto);
  }

  @Patch('experience/:id')
  updateExperience(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: Partial<ExperienceDto>,
  ) {
    return this.profileService.updateExperience(user.userId, id, dto);
  }

  @Delete('experience/:id')
  deleteExperience(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.profileService.deleteExperience(user.userId, id);
  }

  // Projects
  @Post('projects')
  addProject(@CurrentUser() user: CurrentUserPayload, @Body() dto: ProjectDto) {
    return this.profileService.addProject(user.userId, dto);
  }

  @Patch('projects/:id')
  updateProject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: Partial<ProjectDto>,
  ) {
    return this.profileService.updateProject(user.userId, id, dto);
  }

  @Delete('projects/:id')
  deleteProject(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.profileService.deleteProject(user.userId, id);
  }

  // Certifications
  @Post('certifications')
  addCertification(@CurrentUser() user: CurrentUserPayload, @Body() dto: CertificationDto) {
    return this.profileService.addCertification(user.userId, dto);
  }

  @Delete('certifications/:id')
  deleteCertification(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.profileService.deleteCertification(user.userId, id);
  }

  // Skills
  @Post('skills')
  addSkill(@CurrentUser() user: CurrentUserPayload, @Body() dto: ProfileSkillDto) {
    return this.profileService.addSkill(user.userId, dto);
  }

  @Delete('skills/:skillId')
  removeSkill(@CurrentUser() user: CurrentUserPayload, @Param('skillId') skillId: string) {
    return this.profileService.removeSkill(user.userId, skillId);
  }
}
