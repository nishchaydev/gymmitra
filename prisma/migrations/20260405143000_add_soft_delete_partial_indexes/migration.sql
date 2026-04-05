-- Partial indexes for soft-delete queries.
-- Every table with a "deletedAt" column needs a partial index so that
-- WHERE "deletedAt" IS NULL queries (the standard active-records filter)
-- hit a smaller, faster index instead of a full table scan.

-- Member: most queries filter by gymId + active (non-deleted) members
CREATE INDEX "Member_gymId_active_partial"
  ON "Member"("gymId") WHERE "deletedAt" IS NULL;

-- MemberSubscription: subscription listing/dashboard always filters soft deletes
CREATE INDEX "MemberSubscription_gymId_active_partial"
  ON "MemberSubscription"("gymId") WHERE "deletedAt" IS NULL;

-- Invoice: invoice listings, reports, and exports filter soft deletes
CREATE INDEX "Invoice_gymId_active_partial"
  ON "Invoice"("gymId") WHERE "deletedAt" IS NULL;

-- Sale: POS history and revenue reports filter active sales
CREATE INDEX "Sale_gymId_active_partial"
  ON "Sale"("gymId") WHERE "deletedAt" IS NULL;

-- GymProfile: admin/auth queries filter active gyms
CREATE INDEX "GymProfile_userId_active_partial"
  ON "GymProfile"("userId") WHERE "deletedAt" IS NULL;
