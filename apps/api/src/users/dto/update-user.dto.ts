/**
 * DTO de mise à jour partielle d'un utilisateur.
 */

import { IsString, MinLength, IsOptional, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
