-- Ajouter la colonne courseId à Chapter si elle n'existe pas (schéma Prisma : chapitre optionnellement lié à un cours).
ALTER TABLE "Chapter" ADD COLUMN IF NOT EXISTS "courseId" TEXT;

-- Contrainte de clé étrangère vers Course (si la table Course existe et que la contrainte n'existe pas déjà).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Course') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'Chapter_courseId_fkey' AND table_name = 'Chapter'
    ) THEN
      ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey"
        FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
