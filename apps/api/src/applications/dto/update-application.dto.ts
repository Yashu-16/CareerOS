import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApplicationStage } from '@prisma/client';

export class UpdateApplicationDto {
  @IsOptional() @IsEnum(ApplicationStage) stage?: ApplicationStage;
  @IsOptional() @IsNumber() salaryLpa?: number;
  @IsOptional() @IsString() recruiterName?: string;
  @IsOptional() @IsString() recruiterContact?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() appliedAt?: string;
}
