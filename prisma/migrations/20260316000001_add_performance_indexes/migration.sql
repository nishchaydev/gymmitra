-- CreateIndex
CREATE INDEX "Member_gymId_status_idx" ON "Member"("gymId", "status");

-- CreateIndex
CREATE INDEX "Invoice_gymId_issueDate_paymentStatus_idx" ON "Invoice"("gymId", "issueDate", "paymentStatus");

-- CreateIndex
CREATE INDEX "MemberSubscription_gymId_endDate_status_idx" ON "MemberSubscription"("gymId", "endDate", "status");

-- CreateIndex
CREATE INDEX "Attendance_gymId_date_checkInTime_idx" ON "Attendance"("gymId", "date", "checkInTime");

-- CreateIndex
CREATE INDEX "Product_gymId_isActive_idx" ON "Product"("gymId", "isActive");

-- CreateIndex
CREATE INDEX "Member_gymId_name_idx" ON "Member"("gymId", "name");

-- CreateIndex
CREATE INDEX "Member_gymId_phone_idx" ON "Member"("gymId", "phone");