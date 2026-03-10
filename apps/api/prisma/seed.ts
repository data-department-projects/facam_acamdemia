/**
 * Seed Prisma — Crée uniquement le compte administrateur initial pour FACAM ACADEMIA.
 * Les comptes responsables et étudiants seront créés depuis l’interface admin.
 * Commande : npx prisma db seed (depuis apps/api ou racine du monorepo).
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const ADMIN_EMAIL = 'admin@facam.com';
const ADMIN_PASSWORD = 'Admin123!'; // Mot de passe de connexion pour l’admin initial

async function main() {
  // Suppression des comptes démo (étudiant et responsable) pour ne garder que l’admin
  const demoEmails = ['etudiant@facam.com', 'responsable@facam.com'];
  for (const email of demoEmails) {
    const deleted = await prisma.user.deleteMany({ where: { email } });
    if (deleted.count > 0) {
      console.log('Compte démo supprimé :', email);
    }
  }

  // Création ou mise à jour du compte administrateur (mot de passe toujours synchronisé avec ADMIN_PASSWORD)
  const hash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: hash,
      fullName: 'Administrateur FACAM',
      role: 'admin',
    },
    update: {
      passwordHash: hash,
      fullName: 'Administrateur FACAM',
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
