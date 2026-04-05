-- Drop existing unique index
DROP INDEX IF EXISTS "Member_gymId_phone_key";

-- Create new partial unique index
CREATE UNIQUE INDEX "Member_gymId_phone_key" ON "Member"("gymId", "phone") WHERE "deletedAt" IS NULL;
