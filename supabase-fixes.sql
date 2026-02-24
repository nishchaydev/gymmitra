-- Fix Auth RLS Initialization Plan
-- This replaces auth.<function>() with (select auth.<function>()) for better query performance
-- Added ::text cast because Prisma uses text (String) for ids while auth.uid() returns uuid

-- GymProfile
DROP POLICY IF EXISTS "Users can manage their own gym profile" ON "GymProfile";
CREATE POLICY "Users can manage their own gym profile" ON "GymProfile" FOR ALL USING ("userId" = (select auth.uid())::text) WITH CHECK ("userId" = (select auth.uid())::text);

-- Member
DROP POLICY IF EXISTS "Gyms can manage their own members" ON "Member";
CREATE POLICY "Gyms can manage their own members" ON "Member" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- MembershipPlan
DROP POLICY IF EXISTS "Gyms can manage their own plans" ON "MembershipPlan";
CREATE POLICY "Gyms can manage their own plans" ON "MembershipPlan" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- Product
DROP POLICY IF EXISTS "Gyms can manage their own products" ON "Product";
CREATE POLICY "Gyms can manage their own products" ON "Product" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- Sale
DROP POLICY IF EXISTS "Gyms can manage their own sales" ON "Sale";
CREATE POLICY "Gyms can manage their own sales" ON "Sale" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- Invoice
DROP POLICY IF EXISTS "Gyms can manage their own invoices" ON "Invoice";
CREATE POLICY "Gyms can manage their own invoices" ON "Invoice" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- InvoiceItem
DROP POLICY IF EXISTS "Gyms can manage their own invoice items" ON "InvoiceItem";
CREATE POLICY "Gyms can manage their own invoice items" ON "InvoiceItem" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- Attendance
DROP POLICY IF EXISTS "Gyms can manage their own attendance" ON "Attendance";
CREATE POLICY "Gyms can manage their own attendance" ON "Attendance" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- MemberSubscription
DROP POLICY IF EXISTS "Gyms can manage their own subscriptions" ON "MemberSubscription";
CREATE POLICY "Gyms can manage their own subscriptions" ON "MemberSubscription" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

-- Notification
DROP POLICY IF EXISTS "Users/Gyms can manage their own notifications" ON "Notification";
CREATE POLICY "Users/Gyms can manage their own notifications" ON "Notification" FOR ALL USING ("userId" = (select auth.uid())::text OR "gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("userId" = (select auth.uid())::text OR "gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));


-- Fix RLS Enabled No Policy for StaffMember and PTSession
ALTER TABLE "StaffMember" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gyms can manage their own staff members" ON "StaffMember";
CREATE POLICY "Gyms can manage their own staff members" ON "StaffMember" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));

ALTER TABLE "PTSession" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gyms can manage their own PT sessions" ON "PTSession";
CREATE POLICY "Gyms can manage their own PT sessions" ON "PTSession" FOR ALL USING ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text)) WITH CHECK ("gymId" IN (SELECT id FROM "GymProfile" WHERE "userId" = (select auth.uid())::text));
