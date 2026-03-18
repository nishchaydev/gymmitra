/*
  Warnings:

  - The values [BASIC,GROWTH,ENTERPRISE] on the enum `SaaSPlan` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[staffId,localDateString]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[licenseKey]` on the table `GymProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('TRIAL', 'PRO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'SALARY', 'ELECTRICITY', 'MAINTENANCE', 'EQUIPMENT', 'MARKETING', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InvoiceType" ADD VALUE 'PRODUCT';
ALTER TYPE "InvoiceType" ADD VALUE 'WALK_IN';

-- AlterEnum
BEGIN;
CREATE TYPE "SaaSPlan_new" AS ENUM ('TRIAL', 'MAIN_PLAN');
ALTER TABLE "GymProfile" ALTER COLUMN "saasPlan" DROP DEFAULT;
ALTER TABLE "GymProfile" ALTER COLUMN "saasPlan" TYPE "SaaSPlan_new" USING ("saasPlan"::text::"SaaSPlan_new");
ALTER TABLE "RegistrationCode" ALTER COLUMN "plan" TYPE "SaaSPlan_new" USING ("plan"::text::"SaaSPlan_new");
ALTER TYPE "SaaSPlan" RENAME TO "SaaSPlan_old";
ALTER TYPE "SaaSPlan_new" RENAME TO "SaaSPlan";
DROP TYPE "SaaSPlan_old";
ALTER TABLE "GymProfile" ALTER COLUMN "saasPlan" SET DEFAULT 'TRIAL';
COMMIT;

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_memberId_fkey";

-- DropForeignKey
ALTER TABLE "MemberSubscription" DROP CONSTRAINT "MemberSubscription_memberId_fkey";

-- DropIndex
DROP INDEX "Attendance_gymId_date_checkInTime_idx";

-- DropIndex
DROP INDEX "Invoice_gymId_issueDate_paymentStatus_idx";

-- DropIndex
DROP INDEX "Member_gymId_name_idx";

-- DropIndex
DROP INDEX "Member_gymId_status_idx";

-- DropIndex
DROP INDEX "MemberSubscription_gymId_endDate_status_idx";

-- DropIndex
DROP INDEX "Product_gymId_isActive_idx";

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "staffId" TEXT,
ALTER COLUMN "memberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GymProfile" ADD COLUMN     "futurePlanPreference" TEXT,
ADD COLUMN     "licenseActivatedAt" TIMESTAMP(3),
ADD COLUMN     "licenseKey" TEXT,
ADD COLUMN     "onboardingEmailsSentAt" TIMESTAMP(3),
ADD COLUMN     "planTier" "PlanTier" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "trialExpiresAt" TIMESTAMP(3),
ADD COLUMN     "waInvoiceMsg" TEXT,
ADD COLUMN     "waOverdueMsg" TEXT,
ADD COLUMN     "waRenewalMsg" TEXT,
ADD COLUMN     "waWelcomeMsg" TEXT,
ALTER COLUMN "saasPlan" SET DEFAULT 'TRIAL';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
ADD COLUMN     "balanceDue" DECIMAL(10,2) NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "city" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "MemberSubscription" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "purchasePrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "planInterest" TEXT,
    "source" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_gymId_idx" ON "Lead"("gymId");

-- CreateIndex
CREATE INDEX "Lead_gymId_status_idx" ON "Lead"("gymId", "status");

-- CreateIndex
CREATE INDEX "Lead_gymId_phone_idx" ON "Lead"("gymId", "phone");

-- CreateIndex
CREATE INDEX "Expense_gymId_idx" ON "Expense"("gymId");

-- CreateIndex
CREATE INDEX "Expense_gymId_date_idx" ON "Expense"("gymId", "date");

-- CreateIndex
CREATE INDEX "Attendance_staffId_idx" ON "Attendance"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_staffId_localDateString_key" ON "Attendance"("staffId", "localDateString");

-- CreateIndex
CREATE UNIQUE INDEX "GymProfile_licenseKey_key" ON "GymProfile"("licenseKey");

-- AddForeignKey
ALTER TABLE "MemberSubscription" ADD CONSTRAINT "MemberSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "GymProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "GymProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
