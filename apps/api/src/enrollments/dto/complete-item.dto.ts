/**
 * DTO pour marquer un élément de chapitre comme complété.
 */

import { IsString } from 'class-validator';

export class CompleteItemDto {
  @IsString()
  chapterItemId: string;
}
