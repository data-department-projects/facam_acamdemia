/**
 * DTO de création d'une inscription (étudiant → module).
 */

import { IsString } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString()
  userId: string;

  @IsString()
  moduleId: string;
}
