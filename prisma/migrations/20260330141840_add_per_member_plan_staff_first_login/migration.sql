/*
  Warnings:

  - A unique constraint covering the columns `[gymId,phone]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MemberState" AS ENUM ('ACTIVE', 'PAUSED', 'CHURNED');

-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE 'EXPIRING_SOON';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'OWNER';
ALTER TYPE "Role" ADD VALUE 'MANAGER';
ALTER TYPE "Role" ADD VALUE 'FRONT_DESK';

-- AlterEnum
ALTER TYPE "SaaSPlan" ADD VALUE 'PER_MEMBER';

-- DropIndex
DROP INDEX "Member_gymId_phone_idx";

-- DropIndex
DROP INDEX "Product_gymId_idx";

-- AlterTable
ALTER TABLE "GymProfile" ADD COLUMN     "dobMandatory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastBriefingSentAt" TIMESTAMP(3),
ADD COLUMN     "lastTrialReminderMilestone" INTEGER,
ADD COLUMN     "membersAdded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tempPassword" TEXT;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "churnedAt" TIMESTAMP(3),
ADD COLUMN     "memberState" "MemberState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "pauseReturnDate" TIMESTAMP(3),
ALTER COLUMN "dateOfBirth" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StaffMember" ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tempPassword" TEXT;

-- CreateTable
CREATE TABLE "NudgeLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "outcome" TEXT,

    CONSTRAINT "NudgeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NudgeLog_gymId_idx" ON "NudgeLog"("gymId");

-- CreateIndex
CREATE INDEX "NudgeLog_memberId_idx" ON "NudgeLog"("memberId");

-- CreateIndex
CREATE INDEX "NudgeLog_sentAt_idx" ON "NudgeLog"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "Member_gymId_phone_key" ON "Member"("gymId", "phone");

-- AddForeignKey
ALTER TABLE "NudgeLog" ADD CONSTRAINT "NudgeLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NudgeLog" ADD CONSTRAINT "NudgeLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "GymProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
