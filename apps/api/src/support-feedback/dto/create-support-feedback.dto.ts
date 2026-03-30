/**
 * DTO de création d'un message support envoyé par un apprenant.
 */

import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportFeedbackDto {
  @IsString()
  @MinLength(4)
  @MaxLength(160)
  subject: string;

  @IsString()
  @IsIn(['acces_compte', 'cours_quiz', 'certificat', 'technique', 'autre'])
  category: string;

  @IsString()
  @IsIn(['normale', 'haute', 'urgente'])
  priority: string;

  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  contactEmail?: string;
}
