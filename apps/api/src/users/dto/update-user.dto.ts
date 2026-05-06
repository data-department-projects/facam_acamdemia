/**
 * DTO de mise à jour partielle d'un utilisateur (multi-rôles, employeeId, téléphones).
 */

import {
  IsString,
  MinLength,
  IsOptional,
  IsUrl,
  IsIn,
  IsArray,
  ArrayMinSize,
  Matches,
} from 'class-validator';

const ROLES_AUTORISES = [
  'student',
  'employee',
  'module_manager_internal',
  'module_manager_external',
] as const;

type RoleAutorise = (typeof ROLES_AUTORISES)[number];

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName?: string;

  /** Rôle unique (rétrocompatibilité). Ignoré si `roles` est fourni. */
  @IsOptional()
  @IsIn(ROLES_AUTORISES)
  role?: RoleAutorise;

  /** Liste de rôles (nouveau système multi-rôles). Prioritaire sur `role`. */
  @IsOptional()
  @IsArray({ message: 'roles doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un rôle est requis' })
  @IsIn(ROLES_AUTORISES, { each: true, message: 'Chaque rôle doit être valide' })
  roles?: RoleAutorise[];

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

  /** Matricule employé. */
  @IsOptional()
  @IsString()
  employeeId?: string | null;

  /** Numéro de téléphone principal. */
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, {
    message: 'Format de numéro de téléphone invalide',
  })
  phoneNumber1?: string;

  /** Numéro de téléphone secondaire. */
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, {
    message: 'Format de numéro de téléphone secondaire invalide',
  })
  phoneNumber2?: string | null;
}
