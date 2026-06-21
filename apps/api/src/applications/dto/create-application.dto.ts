import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsOptional() @IsUUID() jobId?: string;
  @IsString() companyName: string;
  @IsString() jobTitle: string;
  @IsOptional() @IsString() jobUrl?: string;
  @IsOptional() @IsNumber() salaryLpa?: number;
  @IsOptional() @IsString() recruiterName?: string;
  @IsOptional() @IsString() recruiterContact?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() appliedAt?: string;
}
