-- Restaure la colonne level sur Module après rollback du code.
-- La base avait été migrée pendant la refonte (level supprimé) ; le code actuel attend level.
-- Utilisation de IF NOT EXISTS pour éviter erreur si la colonne existe déjà.

ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "level" TEXT;
