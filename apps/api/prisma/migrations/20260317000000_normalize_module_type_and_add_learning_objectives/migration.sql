-- Objectifs d'apprentissage : ce que l'étudiant va apprendre (éditable par le responsable).
-- Note : moduleType peut être un ENUM en base (EXTERNE/INTERNE) ; l'app normalise à la lecture.
ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "learningObjectives" TEXT;
