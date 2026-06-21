import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CertificationDto {
  @IsString() name: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() expiryDate?: string;
  @IsOptional() @IsString() credentialUrl?: string;
}
