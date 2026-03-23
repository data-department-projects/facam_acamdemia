-- Add support for multiple correct answers per quiz question.
ALTER TABLE "QuizQuestion"
ADD COLUMN "correctIndexes" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- Backfill existing single-answer questions.
UPDATE "QuizQuestion"
SET "correctIndexes" = ARRAY["correctIndex"]
WHERE COALESCE(array_length("correctIndexes", 1), 0) = 0;
