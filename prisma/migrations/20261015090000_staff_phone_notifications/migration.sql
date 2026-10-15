ALTER TABLE "user" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "user" ADD COLUMN "phone" TEXT;
ALTER TABLE "user" ADD COLUMN "staffType" TEXT;
ALTER TABLE "EmployeeInvitation" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "EmployeeInvitation" ADD COLUMN "phone" TEXT;
ALTER TABLE "EmployeeInvitation" ADD COLUMN "staffType" TEXT;
ALTER TABLE "Notification" ADD COLUMN "smsSentAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "user_contactEmail_key" ON "user"("contactEmail");
CREATE UNIQUE INDEX "user_phone_key" ON "user"("phone");
CREATE UNIQUE INDEX "EmployeeInvitation_contactEmail_key" ON "EmployeeInvitation"("contactEmail");
CREATE UNIQUE INDEX "EmployeeInvitation_phone_key" ON "EmployeeInvitation"("phone");
