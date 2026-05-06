/**
 * Seed Prisma — Crée le compte administrateur initial pour FACAM ACADEMIA.
 * Les comptes responsables et étudiants seront créés depuis l'interface admin.
 * Compatible multi-rôles : le champ `roles` est renseigné en parallèle de `role`.
 * Commande : npx prisma db seed (depuis apps/api ou racine du monorepo).
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

const ADMIN_EMAIL = 'admin@facam.com';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  const demoEmails = ['etudiant@facam.com', 'responsable@facam.com'];
  for (const email of demoEmails) {
    const deleted = await prisma.user.deleteMany({ where: { email } });
    if (deleted.count > 0) {
      console.log('Compte démo supprimé :', email);
    }
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      fullName: 'Administrateur FACAM',
      role: 'admin',
      roles: ['admin'],
    },
    update: {
      passwordHash: hash,
      fullName: 'Administrateur FACAM',
      roles: ['admin'],
    },
  });
  console.log('Admin prêt :', ADMIN_EMAIL, '| Mot de passe :', ADMIN_PASSWORD);
  console.log('Seed terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
