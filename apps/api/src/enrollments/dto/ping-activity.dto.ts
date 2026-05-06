import { IsOptional, IsString } from 'class-validator';

export class PingActivityDto {
  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsString()
  enrollmentId?: string;
}
