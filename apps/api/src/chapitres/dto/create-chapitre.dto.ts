/**
 * DTO de création d'un chapitre.
 */

import { IsString, IsInt, Min } from 'class-validator';

export class CreateChapitreDto {
  @IsString()
  moduleId: string;

  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  order: number;
}
