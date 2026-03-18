-- Restaure la colonne gradeOver20 sur FinalQuizGrade si elle manque (après rollback ou migration partielle).
ALTER TABLE "FinalQuizGrade" ADD COLUMN IF NOT EXISTS "gradeOver20" INTEGER NOT NULL DEFAULT 0;
