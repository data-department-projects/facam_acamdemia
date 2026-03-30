/**
 * DTO de mise à jour partielle d'un module de formation.
 */

import { IsString, IsOptional, IsUrl, IsIn, MaxLength } from 'class-validator';

const NIVEAUX = ['debutant', 'intermediaire', 'avance'] as const;

export class UpdateFormationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['interne', 'externe'])
  moduleType?: 'interne' | 'externe';

  /** Prérequis du cours (éditable par le responsable de module). */
  @IsOptional()
  @IsString()
  prerequisites?: string;

  /** Objectifs d'apprentissage (éditable par le responsable de module). */
  @IsOptional()
  @IsString()
  learningObjectives?: string;

  @IsOptional()
  @IsUrl()
  teaserVideoUrl?: string;

  @IsOptional()
  @IsIn(NIVEAUX)
  level?: (typeof NIVEAUX)[number];

  @IsOptional()
  @IsUrl()
  sharePointFolderUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @IsOptional()
  @IsString()
  authorBio?: string;

  @IsOptional()
  @IsUrl()
  authorAvatarUrl?: string;
}
