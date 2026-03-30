-- Create table to store student/employee support messages.
CREATE TABLE "SupportFeedback" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "contactEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SupportFeedback_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportFeedback"
ADD CONSTRAINT "SupportFeedback_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE INDEX "SupportFeedback_createdAt_idx" ON "SupportFeedback"("createdAt");
CREATE INDEX "SupportFeedback_status_idx" ON "SupportFeedback"("status");
CREATE INDEX "SupportFeedback_category_idx" ON "SupportFeedback"("category");
