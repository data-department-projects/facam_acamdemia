-- Supprime la colonne legacy SharePoint du module de formation.
ALTER TABLE "Module" DROP COLUMN IF EXISTS "sharePointFolderUrl";
