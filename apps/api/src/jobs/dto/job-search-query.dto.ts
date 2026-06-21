import { IsArray, IsEnum, IsOptional, IsString, IsNumberString } from 'class-validator';
import { EmploymentType, WorkMode } from '@prisma/client';

export class JobSearchQueryDto {
  @IsOptional() @IsString() q?: string; // free text on title/description
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsEnum(WorkMode) workMode?: WorkMode;
  @IsOptional() @IsEnum(EmploymentType) employmentType?: EmploymentType;
  @IsOptional() @IsString() skill?: string;
  @IsOptional() @IsNumberString() minSalaryLpa?: string;
  @IsOptional() @IsNumberString() page?: string;
  @IsOptional() @IsNumberString() pageSize?: string;
}
