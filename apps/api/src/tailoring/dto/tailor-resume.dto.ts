import { IsString, IsUUID } from 'class-validator';

export class TailorResumeDto {
  @IsUUID() jobId: string;
  @IsUUID() baseResumeId: string;
}
