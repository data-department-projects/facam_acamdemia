/**
 * DTO de création d'un cours (niveau Module → Cours → Chapitres).
 * Utilisé par l'admin ou le responsable du module.
 */

import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  moduleId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
