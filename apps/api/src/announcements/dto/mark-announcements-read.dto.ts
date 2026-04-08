/**
 * DTO marquage messages comme lus.
 * Utilisé par POST /announcements/mark-read (apprenant).
 */

import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class MarkAnnouncementsReadDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids!: string[];
}
