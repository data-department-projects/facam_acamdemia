/**
 * DTO de création d'un utilisateur avec système multi-rôles.
 * Accepte un rôle unique (rétrocompatible) OU une liste de rôles.
 * Inclut les nouveaux champs : employeeId, phoneNumber1, phoneNumber2.
 */

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
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

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName: string;

  /**
   * Rôle unique (rétrocompatibilité avec les formulaires existants).
   * Si `roles` est fourni, ce champ est ignoré au profit de `roles`.
   */
  @IsOptional()
  @IsIn(ROLES_AUTORISES, {
    message: 'Rôle invalide (student, employee, module_manager_internal, module_manager_external)',
  })
  role?: RoleAutorise;

  /**
   * Liste de rôles (nouveau système multi-rôles).
   * Prioritaire sur `role` si les deux sont fournis.
   */
  @IsOptional()
  @IsArray({ message: 'roles doit être un tableau' })
  @ArrayMinSize(1, { message: 'Au moins un rôle est requis' })
  @IsIn(ROLES_AUTORISES, { each: true, message: 'Chaque rôle doit être valide' })
  roles?: RoleAutorise[];

  /** ID du module à assigner (obligatoire si un rôle est responsable de module). */
  @IsOptional()
  @IsString()
  moduleId?: string;

  /** Matricule employé (obligatoire pour employés et responsables de module). */
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "Le matricule employé ne peut pas être vide s'il est fourni" })
  employeeId?: string;

  /** Numéro de téléphone principal (obligatoire). */
  @IsString({ message: 'Le numéro de téléphone principal est requis' })
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, {
    message: 'Format de numéro de téléphone invalide',
  })
  phoneNumber1: string;

  /** Numéro de téléphone secondaire (optionnel). */
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{6,20}$/, {
    message: 'Format de numéro de téléphone secondaire invalide',
  })
  phoneNumber2?: string;
}
