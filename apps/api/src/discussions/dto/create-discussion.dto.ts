/**
 * DTO de création d'une question ou réponse (fil de discussion).
 */

import { IsString, IsOptional } from 'class-validator';

export class CreateDiscussionDto {
  @IsString()
  content: string;

  /** ID du message parent (pour une réponse). */
  @IsOptional()
  @IsString()
  parentId?: string;
}
