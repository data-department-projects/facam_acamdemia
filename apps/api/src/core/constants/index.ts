/**
 * Réexport des constantes du core.
 */

export {
  ROLES,
  MODULE_MANAGER_ROLES,
  LEARNER_ROLES,
  ROLES_REQUIRING_EMPLOYEE_ID,
  type RoleType,
  requiresEmployeeId,
  isModuleManagerRole,
  hasAnyRole,
} from './roles';
export { QUIZ_MIN_SCORE_PERCENT } from './quiz';
