import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() currentCity?: string;
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() linkedinUrl?: string;
  @IsOptional() @IsString() githubUrl?: string;
  @IsOptional() @IsString() portfolioUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) preferredLocations?: string[];
  @IsOptional() @IsNumber() expectedSalaryMinLpa?: number;
  @IsOptional() @IsNumber() expectedSalaryMaxLpa?: number;
  @IsOptional() @IsString() careerGoals?: string;
  @IsOptional() @IsNumber() yearsOfExperience?: number;
}
