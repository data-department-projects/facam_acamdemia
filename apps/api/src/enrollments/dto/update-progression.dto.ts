/**
 * DTO de mise à jour de la position de lecture (dernier chapitre / élément vu).
 */

import { IsString, IsOptional } from 'class-validator';

export class UpdateProgressionDto {
  @IsOptional()
  @IsString()
  lastViewedChapterId?: string;

  @IsOptional()
  @IsString()
  lastViewedItemId?: string;
}
