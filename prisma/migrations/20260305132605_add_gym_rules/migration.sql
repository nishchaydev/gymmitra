-- AlterTable
ALTER TABLE "GymProfile" ADD COLUMN     "gymRules" TEXT,
ADD COLUMN     "invoiceLinkExpiryDays" INTEGER NOT NULL DEFAULT 30;
