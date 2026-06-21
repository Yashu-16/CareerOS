import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ProficiencyLevel } from '@prisma/client';

export class ProfileSkillDto {
  @IsString() name: string;
  @IsOptional() @IsEnum(ProficiencyLevel) proficiency?: ProficiencyLevel;
  @IsOptional() @IsNumber() yearsOfUse?: number;
}
