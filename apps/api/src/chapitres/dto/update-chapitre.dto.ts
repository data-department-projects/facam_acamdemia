/**
 * DTO de mise à jour partielle d'un chapitre (titre, description, ordre).
 */

import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateChapitreDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
