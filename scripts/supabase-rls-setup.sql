-- ============================================================================
-- Gym Mitra — Supabase Row Level Security (RLS) Setup
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- 4. Verify in Authentication → Policies that all tables show policies
--
-- NOTE: Prisma uses the service_role key which BYPASSES RLS.
-- This protects against direct Supabase JS client access only.
-- ============================================================================

-- ── Step 1: Enable RLS on all tenant-scoped tables ──────────────────────────

ALTER TABLE "GymProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StaffMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PTSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MemberSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MembershipPlan" ENABLE ROW LEVEL SECURITY;

-- ── Step 2: GymProfile — owner can access their own gym ─────────────────────

CREATE POLICY "gym_owner_access" ON "GymProfile"
  FOR ALL
  USING (
    "userId" = auth.uid()
    OR id IN (SELECT "gymId" FROM "StaffMember" WHERE "userId" = auth.uid())
  );

-- ── Step 3: Gym-scoped tables — users can only access their gym's data ──────

-- Member
CREATE POLICY "gym_scoped_member" ON "Member"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- Invoice
CREATE POLICY "gym_scoped_invoice" ON "Invoice"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- Sale
CREATE POLICY "gym_scoped_sale" ON "Sale"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- Attendance
CREATE POLICY "gym_scoped_attendance" ON "Attendance"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- StaffMember (users can only see staff in their gym)
CREATE POLICY "gym_scoped_staff" ON "StaffMember"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- Product
CREATE POLICY "gym_scoped_product" ON "Product"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- MemberSubscription
CREATE POLICY "gym_scoped_subscription" ON "MemberSubscription"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- MembershipPlan
CREATE POLICY "gym_scoped_plan" ON "MembershipPlan"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- PTSession
CREATE POLICY "gym_scoped_ptsession" ON "PTSession"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- Notification
CREATE POLICY "gym_scoped_notification" ON "Notification"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- AuditLog
CREATE POLICY "gym_scoped_auditlog" ON "AuditLog"
  FOR ALL
  USING ("gymId" IN (
    SELECT COALESCE(sm."gymId", gp.id)
    FROM "StaffMember" sm
    FULL OUTER JOIN "GymProfile" gp ON gp."userId" = auth.uid()
    WHERE sm."userId" = auth.uid() OR gp."userId" = auth.uid()
  ));

-- ── Step 4: Verify ──────────────────────────────────────────────────────────
-- After running, check Supabase Dashboard → Authentication → Policies
-- All tables above should show their respective policies.
--
-- Test: Use Supabase JS client (anon key) to query Member table
-- without gymId filter — should return EMPTY, not all rows.
-- ============================================================================
