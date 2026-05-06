/**
 * Script de migration des données : convertit le champ `role` (string) en `roles` (string[]).
 * Pour chaque utilisateur existant dont `roles` est vide, copie `role` dans `roles`.
 * Les responsables de module reçoivent automatiquement le rôle "employee" en plus.
 *
 * Exécution : npx ts-node prisma/migrations/migrate-roles.ts (depuis apps/api)
 */

import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });

const MODULE_MANAGER_ROLES = ['module_manager_internal', 'module_manager_external'];

async function migrateRoles(): Promise<void> {
  const usersAMigrer = await prisma.user.findMany({
    where: { roles: { isEmpty: true } },
    select: { id: true, role: true },
  });
  console.log(`Utilisateurs à migrer : ${usersAMigrer.length}`);
  let migres = 0;
  for (const user of usersAMigrer) {
    const roles: string[] = [user.role];
    if (MODULE_MANAGER_ROLES.includes(user.role) && !roles.includes('employee')) {
      roles.push('employee');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { roles },
    });
    migres++;
  }
  console.log(`Migration terminée : ${migres} utilisateurs mis à jour.`);
}

migrateRoles()
  .catch((e) => {
    console.error('Erreur lors de la migration :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
