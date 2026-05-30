-- CreateEnum
CREATE TYPE "PersonAuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateTable
CREATE TABLE "PersonAuditLog" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "personName" TEXT,
    "action" "PersonAuditAction" NOT NULL,
    "actorPersonId" TEXT,
    "actorName" TEXT,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonAuditLog_personId_createdAt_idx" ON "PersonAuditLog"("personId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PersonAuditLog" ADD CONSTRAINT "PersonAuditLog_actorPersonId_fkey" FOREIGN KEY ("actorPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
