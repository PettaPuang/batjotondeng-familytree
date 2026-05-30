-- Index untuk daftar & login (filter birthDate dulu, urut nama)
CREATE INDEX IF NOT EXISTS "Person_birthDate_idx" ON "Person"("birthDate");
CREATE INDEX IF NOT EXISTS "Person_fullName_idx" ON "Person"("fullName");
