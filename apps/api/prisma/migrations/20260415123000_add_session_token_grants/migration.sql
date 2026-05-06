CREATE TABLE "SessionTokenGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "grantType" TEXT NOT NULL,
  "minutesPerToken" INTEGER NOT NULL DEFAULT 15,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionTokenGrant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SessionTokenGrant_userId_createdAt_idx" ON "SessionTokenGrant"("userId", "createdAt");
CREATE INDEX "SessionTokenGrant_createdAt_idx" ON "SessionTokenGrant"("createdAt");

ALTER TABLE "SessionTokenGrant"
ADD CONSTRAINT "SessionTokenGrant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
