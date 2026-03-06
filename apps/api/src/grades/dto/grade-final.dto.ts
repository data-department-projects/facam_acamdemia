/**
 * DTO d'attribution d'une note au quiz final (sur 20).
 */

import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class GradeFinalDto {
  @IsInt()
  @Min(0)
  @Max(20)
  gradeOver20: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
