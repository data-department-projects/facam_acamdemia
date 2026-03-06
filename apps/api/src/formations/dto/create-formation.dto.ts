/**
 * DTO de création d'un module de formation.
 */

import { IsString, IsOptional, IsUrl, IsIn, MaxLength } from 'class-validator';

const NIVEAUX = ['debutant', 'intermediaire', 'avance'] as const;

export class CreateFormationDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  subtitle?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  teaserVideoUrl?: string;

  @IsOptional()
  @IsIn(NIVEAUX)
  level?: (typeof NIVEAUX)[number];

  @IsOptional()
  @IsUrl()
  sharePointFolderUrl?: string;

  @IsString()
  @MaxLength(120)
  authorName: string;

  @IsOptional()
  @IsString()
  authorBio?: string;

  @IsOptional()
  @IsUrl()
  authorAvatarUrl?: string;
}
