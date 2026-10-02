-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "isLot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lotExclusions" TEXT,
ADD COLUMN     "lotItems" TEXT,
ADD COLUMN     "lotQuantity" INTEGER;
