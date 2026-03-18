/**
 * DTO de mise à jour partielle d'un utilisateur (nom, rôle, module assigné, mot de passe).
 */

import { IsString, MinLength, IsOptional, IsUrl, IsIn } from 'class-validator';

const ROLES_AUTORISES = [
  'student',
  'employee',
  'module_manager_internal',
  'module_manager_external',
] as const;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName?: string;

  @IsOptional()
  @IsIn(ROLES_AUTORISES)
  role?: (typeof ROLES_AUTORISES)[number];

  /** ID du module à assigner (pour responsable module ; null pour désassigner). */
  @IsOptional()
  @IsString()
  moduleId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
