/**
 * DTO de création d'un élément de chapitre (vidéo, document, quiz).
 */

import { IsString, IsInt, IsOptional, IsUrl, IsIn, Min } from 'class-validator';

const TYPES = ['video', 'document', 'quiz'] as const;

export class CreateChapterItemDto {
  @IsString()
  chapterId: string;

  @IsIn(TYPES)
  type: (typeof TYPES)[number];

  @IsInt()
  @Min(0)
  order: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  documentLabel?: string;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  quizId?: string;
}
