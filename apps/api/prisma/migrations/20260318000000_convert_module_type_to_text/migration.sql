-- Convertir la colonne moduleType d'ENUM vers TEXT pour cohérence avec le schéma Prisma (String?).
-- Prisma rejetait la valeur "EXTERNE" car le client attend un String, pas un type ENUM natif.
ALTER TABLE "Module" ALTER COLUMN "moduleType" TYPE TEXT USING "moduleType"::TEXT;
