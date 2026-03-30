/**
 * DTO de mise à jour du statut d'un message support.
 */

import { IsIn, IsString } from 'class-validator';

export class UpdateSupportFeedbackStatusDto {
  @IsString()
  @IsIn(['new', 'in_progress', 'resolved'])
  status: string;
}
