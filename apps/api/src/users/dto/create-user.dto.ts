/**
 * DTO de création d'un utilisateur (étudiant ou responsable de module).
 */

import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

const ROLES_AUTORISES = ['student', 'module_manager'] as const;

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName: string;

  @IsIn(ROLES_AUTORISES, { message: 'Rôle invalide (student ou module_manager)' })
  role: (typeof ROLES_AUTORISES)[number];

  /** ID du module à assigner (obligatoire si role === module_manager). */
  @IsOptional()
  @IsString()
  moduleId?: string;
}
