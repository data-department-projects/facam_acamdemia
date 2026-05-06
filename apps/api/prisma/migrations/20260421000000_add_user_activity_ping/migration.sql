-- CreateTable
CREATE TABLE "UserActivityPing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT,
    "enrollmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivityPing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserActivityPing_userId_createdAt_idx" ON "UserActivityPing"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivityPing_createdAt_idx" ON "UserActivityPing"("createdAt");

-- AddForeignKey
ALTER TABLE "UserActivityPing" ADD CONSTRAINT "UserActivityPing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
