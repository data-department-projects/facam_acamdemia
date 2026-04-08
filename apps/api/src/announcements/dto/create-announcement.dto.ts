/**
 * DTO création message module — payload minimal (contenu).
 * Utilisé par le responsable de module via POST /announcements.
 */

import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content!: string;
}
