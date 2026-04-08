/*
  Warnings:

  - You are about to drop the `Discussion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Discussion" DROP CONSTRAINT "Discussion_moduleId_fkey";

-- DropForeignKey
ALTER TABLE "Discussion" DROP CONSTRAINT "Discussion_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Discussion" DROP CONSTRAINT "Discussion_userId_fkey";

-- DropTable
DROP TABLE "Discussion";

-- CreateTable
CREATE TABLE "ModuleAnnouncement" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModuleAnnouncement_moduleId_createdAt_idx" ON "ModuleAnnouncement"("moduleId", "createdAt");

-- CreateIndex
CREATE INDEX "ModuleAnnouncement_authorId_createdAt_idx" ON "ModuleAnnouncement"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "ModuleAnnouncement" ADD CONSTRAINT "ModuleAnnouncement_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAnnouncement" ADD CONSTRAINT "ModuleAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
