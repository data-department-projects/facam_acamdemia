/**
 * DTO de création d'un utilisateur (étudiant, employé, responsable module interne/externe).
 */

import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

const ROLES_AUTORISES = [
  'student',
  'employee',
  'module_manager_internal',
  'module_manager_external',
] as const;

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName: string;

  @IsIn(ROLES_AUTORISES, {
    message: 'Rôle invalide (student, employee, module_manager_internal, module_manager_external)',
  })
  role: (typeof ROLES_AUTORISES)[number];

  /** ID du module à assigner (obligatoire si role est un responsable de module). */
  @IsOptional()
  @IsString()
  moduleId?: string;
}
