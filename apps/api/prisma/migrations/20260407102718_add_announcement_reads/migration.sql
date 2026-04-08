-- CreateTable
CREATE TABLE "ModuleAnnouncementRead" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleAnnouncementRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModuleAnnouncementRead_userId_readAt_idx" ON "ModuleAnnouncementRead"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ModuleAnnouncementRead_announcementId_readAt_idx" ON "ModuleAnnouncementRead"("announcementId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAnnouncementRead_announcementId_userId_key" ON "ModuleAnnouncementRead"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "ModuleAnnouncementRead" ADD CONSTRAINT "ModuleAnnouncementRead_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "ModuleAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAnnouncementRead" ADD CONSTRAINT "ModuleAnnouncementRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
