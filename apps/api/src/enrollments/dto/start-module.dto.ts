/**
 * DTO pour démarrer un module (auto-inscription étudiant/employé).
 * Le moduleId est le seul champ requis ; l'utilisateur est dérivé du JWT.
 */

import { IsString } from 'class-validator';

export class StartModuleDto {
  @IsString()
  moduleId: string;
}
