import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class ProjectDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) techStack?: string[];
  @IsOptional() @IsString() projectUrl?: string;
  @IsOptional() @IsString() repoUrl?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
