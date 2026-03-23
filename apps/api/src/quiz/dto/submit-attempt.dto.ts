/**
 * DTO de soumission d'une tentative de quiz (réponses QCM).
 * answers : tableau d'index de réponses par ordre de question (0-based).
 */

import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitAttemptDto {
  /** ID de l'inscription (pour quiz final, optionnel pour quiz chapitre). */
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  /**
   * Réponses par question, dans l'ordre.
   * Compatibilité :
   * - ancien format : number (une seule réponse)
   * - nouveau format : number[] (plusieurs réponses)
   */
  @IsArray()
  answers: unknown[];
}
