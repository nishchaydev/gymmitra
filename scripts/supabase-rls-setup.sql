-- ============================================================================
-- GymMitra — Supabase Row Level Security (RLS) Setup
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run"
-- 4. Verify in Authentication → Policies that all tables show policies
--
-- NOTE: Prisma uses the service_role key which BYPASSES RLS.
-- This protects against direct Supabase JS client access only.
-- FIX: auth.uid() returns uuid, but userId is text — using ::text cast
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

-- ── Step 2: Helper function to get user's gymId(s) ──────────────────────────

CREATE OR REPLACE FUNCTION get_user_gym_ids()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT gp.id FROM "GymProfile" gp WHERE gp."userId" = auth.uid()::text
  UNION
  SELECT sm."gymId" FROM "StaffMember" sm WHERE sm."userId" = auth.uid()::text
$$;

-- ── Step 3: GymProfile — owner can access their own gym ─────────────────────

CREATE POLICY "gym_owner_access" ON "GymProfile"
  FOR ALL
  USING (
    "userId" = auth.uid()::text
    OR id IN (SELECT "gymId" FROM "StaffMember" WHERE "userId" = auth.uid()::text)
  );

-- ── Step 4: Gym-scoped tables using helper function ─────────────────────────

CREATE POLICY "gym_scoped_member" ON "Member"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_invoice" ON "Invoice"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_sale" ON "Sale"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_attendance" ON "Attendance"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_staff" ON "StaffMember"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_product" ON "Product"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_subscription" ON "MemberSubscription"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_plan" ON "MembershipPlan"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_ptsession" ON "PTSession"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_notification" ON "Notification"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

CREATE POLICY "gym_scoped_auditlog" ON "AuditLog"
  FOR ALL USING ("gymId" IN (SELECT get_user_gym_ids()));

-- ── Step 5: Verify ──────────────────────────────────────────────────────────
-- After running, check Supabase Dashboard → Authentication → Policies
-- All tables above should show their respective policies.
--
-- Test: Use Supabase JS client (anon key) to query Member table
-- without gymId filter — should return EMPTY, not all rows.
-- ============================================================================
