/**
 * Seed Prisma — Crée les données initiales pour FACAM ACADEMIA.
 * Utilisé après la première migration pour avoir un admin et un étudiant de test.
 * Commande : npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  const adminEmail = 'admin@facam.com';
  const adminPassword = 'demo123'; // Même mot de passe que les autres comptes démo

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin déjà présent, skip.');
  } else {
    const hash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        fullName: 'Administrateur FACAM',
        role: 'admin',
      },
    });
    console.log('Admin créé :', adminEmail, '(mot de passe : demo123)');
  }

  const studentEmail = 'etudiant@facam.com';
  const studentPassword = 'demo123';

  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (existingStudent) {
    console.log('Étudiant déjà présent, skip.');
  } else {
    const hash = await bcrypt.hash(studentPassword, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: studentEmail,
        passwordHash: hash,
        fullName: 'Étudiant Demo',
        role: 'student',
      },
    });
    console.log('Étudiant créé :', studentEmail, '(mot de passe : demo123)');
  }

  // Module de test (pour assigner un responsable)
  let moduleTest = await prisma.module.findFirst({ where: { title: { contains: 'Test' } } });
  if (!moduleTest) {
    moduleTest = await prisma.module.create({
      data: {
        title: 'Module de test',
        description: 'Module créé par le seed pour les tests.',
        authorName: 'FACAM ACADEMIA',
      },
    });
    console.log('Module de test créé.');
  }

  // Responsable de module
  const managerEmail = 'responsable@facam.com';
  const managerPassword = 'demo123';
  const existingManager = await prisma.user.findUnique({ where: { email: managerEmail } });
  if (existingManager) {
    console.log('Responsable déjà présent, skip.');
  } else {
    const hash = await bcrypt.hash(managerPassword, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash: hash,
        fullName: 'Responsable Demo',
        role: 'module_manager',
        managedModule: { connect: { id: moduleTest.id } },
      },
    });
    console.log('Responsable créé :', managerEmail, '(mot de passe : demo123)');
  }

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
