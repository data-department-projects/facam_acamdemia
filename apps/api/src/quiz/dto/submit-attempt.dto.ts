/**
 * DTO de soumission d'une tentative de quiz (réponses QCM).
 * answers : tableau d'index de réponses par ordre de question (0-based).
 */

import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class SubmitAttemptDto {
  /** ID de l'inscription (pour quiz final, optionnel pour quiz chapitre). */
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  /** Réponses : tableau d'index (0-based) pour chaque question, dans l'ordre. */
  @IsArray()
  @IsNumber({}, { each: true })
  answers: number[];
}
