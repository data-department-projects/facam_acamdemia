/**
 * DTO de création d'un chapitre.
 * Spec : titre, description, vidéo YouTube (titre + lien), quiz (questions + score min).
 * Soit moduleId (legacy), soit courseId pour rattacher au cours.
 */

import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuizQuestionDto {
  @IsString()
  questionText: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(10)
  correctIndex: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(10, { each: true })
  correctIndexes?: number[];
}

export class CreateChapitreDto {
  /** Obligatoire si courseId non fourni (legacy). */
  @IsOptional()
  @IsString()
  moduleId?: string;

  /** Si fourni, le chapitre est rattaché à ce cours (moduleId dérivé du cours). */
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  order: number;

  /** Titre de la vidéo YouTube (pour affichage). */
  @IsOptional()
  @IsString()
  videoTitle?: string;

  /** Lien de la vidéo YouTube. */
  @IsOptional()
  @IsString()
  videoUrl?: string;

  /** Quiz de fin de chapitre : questions + score minimum pour valider. */
  @IsOptional()
  minScoreToPass?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  quizQuestions?: QuizQuestionDto[];
}
