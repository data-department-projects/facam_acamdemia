-- Type de module : interne (employés) | externe (étudiants).
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "moduleType" TEXT;
