-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "antiSnipingMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "assetTag" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "eligibilityRules" JSONB,
ADD COLUMN     "itWipeConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentRules" TEXT NOT NULL DEFAULT 'Bank transfer after winner approval.',
ADD COLUMN     "photoKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "pickupRules" TEXT NOT NULL DEFAULT 'Pickup is arranged after confirmed payment.',
ADD COLUMN     "rejectedBidIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tagMissingReason" TEXT;

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "actorRole" TEXT;

-- AlterTable
ALTER TABLE "Pickup" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
