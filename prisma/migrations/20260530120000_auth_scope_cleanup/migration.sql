-- Drop unused NextAuth / User tables
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

DROP TYPE IF EXISTS "Role";

-- Marriage: prevent duplicate couples
CREATE UNIQUE INDEX IF NOT EXISTS "Marriage_husbandId_wifeId_key" ON "Marriage"("husbandId", "wifeId");

-- Audit: require actor (logged-in person)
DELETE FROM "PersonAuditLog" WHERE "actorPersonId" IS NULL;

ALTER TABLE "PersonAuditLog" DROP CONSTRAINT IF EXISTS "PersonAuditLog_actorPersonId_fkey";
ALTER TABLE "PersonAuditLog" ALTER COLUMN "actorPersonId" SET NOT NULL;
ALTER TABLE "PersonAuditLog" ADD CONSTRAINT "PersonAuditLog_actorPersonId_fkey" FOREIGN KEY ("actorPersonId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
