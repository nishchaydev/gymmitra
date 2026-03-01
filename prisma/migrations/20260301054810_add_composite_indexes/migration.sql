-- CreateIndex
CREATE INDEX "Attendance_gymId_idx" ON "Attendance"("gymId");

-- CreateIndex
CREATE INDEX "Invoice_gymId_paymentStatus_idx" ON "Invoice"("gymId", "paymentStatus");

-- CreateIndex
CREATE INDEX "MemberSubscription_gymId_status_idx" ON "MemberSubscription"("gymId", "status");

-- CreateIndex
CREATE INDEX "MemberSubscription_gymId_endDate_idx" ON "MemberSubscription"("gymId", "endDate");
