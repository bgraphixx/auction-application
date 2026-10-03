-- AlterTable
ALTER TABLE "EmployeeInvitation" ADD COLUMN     "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
