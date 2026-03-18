-- Ajout du champ prérequis sur Module (éditable par le responsable).
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "prerequisites" TEXT;
