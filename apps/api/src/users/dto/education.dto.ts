import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class EducationDto {
  @IsString() institution: string;
  @IsString() degree: string;
  @IsOptional() @IsString() fieldOfStudy?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() gradeValue?: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
}
